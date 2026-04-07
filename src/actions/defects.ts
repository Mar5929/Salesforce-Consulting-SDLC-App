"use server"

/**
 * Defect Server Actions
 *
 * CRUD operations for defects with status machine transitions,
 * display ID generation (DEF-N), role-based access control,
 * and Inngest event emission for notifications.
 *
 * All actions use next-safe-action for Zod validation and auth middleware.
 * Status transitions validated via defect-status-machine (T-05-05).
 * Ownership/role checks enforce T-05-06 (elevation of privilege prevention).
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { generateDisplayId } from "@/lib/display-id"
import { canTransitionDefect } from "@/lib/defect-status-machine"
import { assertProjectNotArchived } from "@/lib/archive-guard"
import { createId } from "@paralleldrive/cuid2"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const createDefectSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(500),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  stepsToReproduce: z.string().min(1),
  expectedBehavior: z.string().min(1),
  actualBehavior: z.string().min(1),
  storyId: z.string().optional(),
  testCaseId: z.string().optional(),
  assigneeId: z.string().optional(),
  environment: z.string().optional(),
})

const updateDefectSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  environment: z.string().optional(),
})

const transitionDefectStatusSchema = z.object({
  id: z.string(),
  toStatus: z.enum(["OPEN", "ASSIGNED", "FIXED", "VERIFIED", "CLOSED"]),
})

const getDefectsSchema = z.object({
  projectId: z.string(),
  status: z.enum(["OPEN", "ASSIGNED", "FIXED", "VERIFIED", "CLOSED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assigneeId: z.string().optional(),
  storyId: z.string().optional(),
})

const getDefectSchema = z.object({
  id: z.string(),
})

const deleteDefectSchema = z.object({
  id: z.string(),
})

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

async function verifyMembership(projectId: string, clerkUserId: string) {
  const member = await prisma.projectMember.findFirst({
    where: { projectId, clerkUserId },
  })
  if (!member) throw new Error("Not a member of this project")
  return member
}

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

export const createDefect = actionClient
  .schema(createDefectSchema)
  .action(async ({ parsedInput, ctx }) => {
    await assertProjectNotArchived(parsedInput.projectId)
    const member = await verifyMembership(parsedInput.projectId, ctx.userId)

    const displayId = await generateDisplayId(
      parsedInput.projectId,
      "Defect",
      prisma
    )

    const defect = await prisma.defect.create({
      data: {
        id: createId(),
        projectId: parsedInput.projectId,
        displayId,
        title: parsedInput.title,
        severity: parsedInput.severity,
        stepsToReproduce: parsedInput.stepsToReproduce,
        expectedBehavior: parsedInput.expectedBehavior,
        actualBehavior: parsedInput.actualBehavior,
        storyId: parsedInput.storyId ?? null,
        testCaseId: parsedInput.testCaseId ?? null,
        assigneeId: parsedInput.assigneeId ?? null,
        environment: parsedInput.environment ?? null,
        createdById: member.id,
      },
    })

    // Emit Inngest events
    await inngest.send({
      name: EVENTS.DEFECT_CREATED,
      data: {
        projectId: parsedInput.projectId,
        defectId: defect.id,
        severity: parsedInput.severity,
        storyId: parsedInput.storyId ?? null,
      },
    })

    await inngest.send({
      name: EVENTS.NOTIFICATION_SEND,
      data: {
        projectId: parsedInput.projectId,
        type: "DEFECT_CREATED",
        recipientId: parsedInput.assigneeId ?? member.id,
        entityId: defect.id,
        entityType: "Defect",
        message: `Defect ${displayId} created: ${parsedInput.title}`,
      },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/defects`)
    return { defect }
  })

export const updateDefect = actionClient
  .schema(updateDefectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.defect.findUnique({
      where: { id: parsedInput.id },
      select: { projectId: true, createdById: true, assigneeId: true, displayId: true },
    })
    if (!existing) throw new Error("Defect not found")

    await assertProjectNotArchived(existing.projectId)
    const member = await verifyMembership(existing.projectId, ctx.userId)

    // Role check: PM/SA can edit any, others only their own (T-05-06)
    if (member.role !== "PM" && member.role !== "SOLUTION_ARCHITECT") {
      if (existing.createdById !== member.id) {
        throw new Error("Insufficient permissions to edit this defect")
      }
    }

    const { id, ...updateFields } = parsedInput
    const updateData: Record<string, unknown> = {}
    if (updateFields.title !== undefined) updateData.title = updateFields.title
    if (updateFields.severity !== undefined) updateData.severity = updateFields.severity
    if (updateFields.stepsToReproduce !== undefined) updateData.stepsToReproduce = updateFields.stepsToReproduce
    if (updateFields.expectedBehavior !== undefined) updateData.expectedBehavior = updateFields.expectedBehavior
    if (updateFields.actualBehavior !== undefined) updateData.actualBehavior = updateFields.actualBehavior
    if (updateFields.assigneeId !== undefined) updateData.assigneeId = updateFields.assigneeId
    if (updateFields.environment !== undefined) updateData.environment = updateFields.environment

    const defect = await prisma.defect.update({
      where: { id },
      data: updateData,
    })

    // Notify new assignee if assigneeId changed
    if (
      updateFields.assigneeId !== undefined &&
      updateFields.assigneeId !== null &&
      updateFields.assigneeId !== existing.assigneeId
    ) {
      await inngest.send({
        name: EVENTS.NOTIFICATION_SEND,
        data: {
          projectId: existing.projectId,
          type: "DEFECT_CREATED",
          recipientId: updateFields.assigneeId,
          entityId: id,
          entityType: "Defect",
          message: `You were assigned to defect ${existing.displayId}`,
        },
      })
    }

    revalidatePath(`/projects/${existing.projectId}/defects`)
    return { defect }
  })

export const transitionDefectStatus = actionClient
  .schema(transitionDefectStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.defect.findUnique({
      where: { id: parsedInput.id },
      select: { id: true, projectId: true, status: true, displayId: true },
    })
    if (!existing) throw new Error("Defect not found")

    await assertProjectNotArchived(existing.projectId)
    const member = await verifyMembership(existing.projectId, ctx.userId)

    // Validate transition with role gating (T-05-05)
    if (!canTransitionDefect(existing.status, parsedInput.toStatus, member.role)) {
      throw new Error(
        `Invalid status transition from ${existing.status} to ${parsedInput.toStatus} for role ${member.role}`
      )
    }

    const defect = await prisma.defect.update({
      where: { id: parsedInput.id },
      data: { status: parsedInput.toStatus },
    })

    // Emit Inngest events
    await inngest.send({
      name: EVENTS.DEFECT_STATUS_CHANGED,
      data: {
        projectId: existing.projectId,
        defectId: existing.id,
        fromStatus: existing.status,
        toStatus: parsedInput.toStatus,
      },
    })

    await inngest.send({
      name: EVENTS.NOTIFICATION_SEND,
      data: {
        projectId: existing.projectId,
        type: "DEFECT_STATUS_CHANGED",
        recipientId: member.id,
        entityId: existing.id,
        entityType: "Defect",
        message: `Defect ${existing.displayId} moved from ${existing.status} to ${parsedInput.toStatus}`,
      },
    })

    revalidatePath(`/projects/${existing.projectId}/defects`)
    return { defect }
  })

export const getDefects = actionClient
  .schema(getDefectsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await verifyMembership(parsedInput.projectId, ctx.userId)

    const where: Record<string, unknown> = {
      projectId: parsedInput.projectId,
    }
    if (parsedInput.status) where.status = parsedInput.status
    if (parsedInput.severity) where.severity = parsedInput.severity
    if (parsedInput.assigneeId) where.assigneeId = parsedInput.assigneeId
    if (parsedInput.storyId) where.storyId = parsedInput.storyId

    const defects = await prisma.defect.findMany({
      where,
      include: {
        story: { select: { id: true, displayId: true, title: true } },
        assignee: { select: { id: true, displayName: true } },
        createdBy: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return { defects }
  })

export const getDefect = actionClient
  .schema(getDefectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const defect = await prisma.defect.findUnique({
      where: { id: parsedInput.id },
      include: {
        story: { select: { id: true, displayId: true, title: true } },
        testCase: { select: { id: true, title: true } },
        assignee: { select: { id: true, displayName: true, email: true } },
        createdBy: { select: { id: true, displayName: true, email: true } },
        duplicateOf: { select: { id: true, displayId: true, title: true } },
      },
    })
    if (!defect) throw new Error("Defect not found")

    await verifyMembership(defect.projectId, ctx.userId)
    return { defect }
  })

export const deleteDefect = actionClient
  .schema(deleteDefectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.defect.findUnique({
      where: { id: parsedInput.id },
      select: { projectId: true, createdById: true },
    })
    if (!existing) throw new Error("Defect not found")

    await assertProjectNotArchived(existing.projectId)
    const member = await verifyMembership(existing.projectId, ctx.userId)

    // Role check: PM/SA can delete any, others only their own (T-05-06)
    if (member.role !== "PM" && member.role !== "SOLUTION_ARCHITECT") {
      if (existing.createdById !== member.id) {
        throw new Error("Insufficient permissions to delete this defect")
      }
    }

    await prisma.defect.delete({
      where: { id: parsedInput.id },
    })

    revalidatePath(`/projects/${existing.projectId}/defects`)
    return { success: true }
  })
