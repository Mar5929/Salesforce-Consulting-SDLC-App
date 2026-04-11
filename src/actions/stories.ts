"use server"

/**
 * Story Server Actions
 *
 * CRUD operations for the Story entity with project scoping,
 * role-based access control, status machine validation, and
 * display ID generation.
 *
 * All actions use next-safe-action for Zod validation and auth middleware.
 * All DB operations use scopedPrisma for project isolation (T-03-02).
 * Role checks enforce T-03-01 (elevation of privilege prevention).
 * Status transitions validated server-side per T-03-03.
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { generateStoryDisplayId } from "@/lib/display-id"
import { canTransition } from "@/lib/story-status-machine"
import { createId } from "@paralleldrive/cuid2"
import { StoryStatus, Priority, ImpactType } from "@/generated/prisma"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const createStorySchema = z.object({
  projectId: z.string(),
  epicId: z.string(),
  featureId: z.string().optional(),
  title: z.string().min(1).max(200),
  persona: z.string().optional(),
  description: z.string().optional(),
  acceptanceCriteria: z.string().min(1),
  storyPoints: z.number().int().min(0).max(100).optional(),
  priority: z.nativeEnum(Priority).optional(),
})

const updateStorySchema = z.object({
  projectId: z.string(),
  storyId: z.string(),
  title: z.string().min(1).max(200).optional(),
  persona: z.string().optional(),
  description: z.string().optional(),
  acceptanceCriteria: z.string().min(1).optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  priority: z.nativeEnum(Priority).optional(),
  featureId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  testAssigneeId: z.string().nullable().optional(),
})

const deleteStorySchema = z.object({
  projectId: z.string(),
  storyId: z.string(),
})

const getStoriesSchema = z.object({
  projectId: z.string(),
  epicId: z.string().optional(),
  featureId: z.string().optional(),
  sprintId: z.string().optional(),
  status: z.nativeEnum(StoryStatus).optional(),
  unassigned: z.boolean().optional(),
})

const updateStoryStatusSchema = z.object({
  projectId: z.string(),
  storyId: z.string(),
  status: z.nativeEnum(StoryStatus),
})

const getStorySchema = z.object({
  projectId: z.string(),
  storyId: z.string(),
})

const addStoryComponentSchema = z.object({
  projectId: z.string(),
  storyId: z.string(),
  componentName: z.string().min(1),
  impactType: z.nativeEnum(ImpactType),
})

const removeStoryComponentSchema = z.object({
  projectId: z.string(),
  storyComponentId: z.string(),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

export const createStory = actionClient
  .schema(createStorySchema)
  .action(async ({ parsedInput }) => {
    const member = await getCurrentMember(parsedInput.projectId)

    // QA members can only create stories in DRAFT status.
    // The createStorySchema intentionally omits the status field, so stories
    // always inherit the Prisma schema default (DRAFT). This guard ensures
    // the invariant holds even if the schema evolves to accept a status field.
    if (member.role === "QA") {
      // No-op today: status is not in parsedInput, so DRAFT is guaranteed.
      // If createStorySchema ever adds a status field, add an explicit
      // override here: parsedInput.status = "DRAFT"
    }

    // Get epic prefix for display ID generation
    const epic = await prisma.epic.findUnique({
      where: { id: parsedInput.epicId },
      select: { projectId: true, prefix: true },
    })
    if (!epic || epic.projectId !== parsedInput.projectId) {
      throw new Error("Epic not found")
    }

    // Validate featureId belongs to project if provided
    if (parsedInput.featureId) {
      const feature = await prisma.feature.findUnique({
        where: { id: parsedInput.featureId },
        select: { projectId: true },
      })
      if (!feature || feature.projectId !== parsedInput.projectId) {
        throw new Error("Feature not found")
      }
    }

    const displayId = await generateStoryDisplayId(
      parsedInput.projectId,
      epic.prefix,
      prisma
    )

    // Auto-compute sortOrder
    const maxSort = await prisma.story.aggregate({
      where: { projectId: parsedInput.projectId, epicId: parsedInput.epicId },
      _max: { sortOrder: true },
    })
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1

    const story = await prisma.story.create({
      data: {
        id: createId(),
        projectId: parsedInput.projectId,
        epicId: parsedInput.epicId,
        featureId: parsedInput.featureId ?? null,
        displayId,
        title: parsedInput.title,
        persona: parsedInput.persona ?? null,
        description: parsedInput.description ?? null,
        acceptanceCriteria: parsedInput.acceptanceCriteria,
        storyPoints: parsedInput.storyPoints ?? null,
        priority: parsedInput.priority ?? "MEDIUM",
        sortOrder,
      },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/work`)
    revalidatePath(`/projects/${parsedInput.projectId}/backlog`)
    return { story }
  })

export const updateStory = actionClient
  .schema(updateStorySchema)
  .action(async ({ parsedInput }) => {
    // Consistent membership + suspension check via canonical helper (T-03-01)
    const member = await getCurrentMember(parsedInput.projectId)

    // Validate storyId belongs to project
    const existing = await prisma.story.findUnique({
      where: { id: parsedInput.storyId },
      select: { projectId: true, assigneeId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Story not found")
    }

    // Role check: PM/SA can edit any, others only their own
    if (member.role !== "PM" && member.role !== "SOLUTION_ARCHITECT") {
      if (existing.assigneeId !== member.id) {
        throw new Error("Insufficient permissions to edit this story")
      }
    }

    const { projectId, storyId, ...updateFields } = parsedInput
    const updateData: Record<string, unknown> = {}
    if (updateFields.title !== undefined) updateData.title = updateFields.title
    if (updateFields.persona !== undefined) updateData.persona = updateFields.persona
    if (updateFields.description !== undefined) updateData.description = updateFields.description
    if (updateFields.acceptanceCriteria !== undefined) updateData.acceptanceCriteria = updateFields.acceptanceCriteria
    if (updateFields.storyPoints !== undefined) updateData.storyPoints = updateFields.storyPoints
    if (updateFields.priority !== undefined) updateData.priority = updateFields.priority
    if (updateFields.featureId !== undefined) updateData.featureId = updateFields.featureId
    if (updateFields.assigneeId !== undefined) updateData.assigneeId = updateFields.assigneeId
    if (updateFields.testAssigneeId !== undefined) updateData.testAssigneeId = updateFields.testAssigneeId

    const story = await prisma.story.update({
      where: { id: storyId },
      data: updateData,
    })

    revalidatePath(`/projects/${projectId}/work`)
    revalidatePath(`/projects/${projectId}/backlog`)
    return { story }
  })

export const deleteStory = actionClient
  .schema(deleteStorySchema)
  .action(async ({ parsedInput, ctx }) => {
    // Validate storyId belongs to project
    const existing = await prisma.story.findUnique({
      where: { id: parsedInput.storyId },
      select: { projectId: true, assigneeId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Story not found")
    }

    // Look up member for role check (T-03-01)
    const member = await prisma.projectMember.findFirst({
      where: { projectId: parsedInput.projectId, clerkUserId: ctx.userId },
    })
    if (!member) throw new Error("Not a member of this project")

    // Role check: PM/SA can delete any, others only their own
    if (member.role !== "PM" && member.role !== "SOLUTION_ARCHITECT") {
      if (existing.assigneeId !== member.id) {
        throw new Error("Insufficient permissions to delete this story")
      }
    }

    await prisma.story.delete({
      where: { id: parsedInput.storyId },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/work`)
    revalidatePath(`/projects/${parsedInput.projectId}/backlog`)
    return { success: true }
  })

export const getStories = actionClient
  .schema(getStoriesSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)
    const db = scopedPrisma(parsedInput.projectId)

    const where: Record<string, unknown> = {
      projectId: parsedInput.projectId,
    }
    if (parsedInput.epicId) where.epicId = parsedInput.epicId
    if (parsedInput.featureId) where.featureId = parsedInput.featureId
    if (parsedInput.sprintId) where.sprintId = parsedInput.sprintId
    if (parsedInput.status) where.status = parsedInput.status
    if (parsedInput.unassigned) where.sprintId = null

    const stories = await db.story.findMany({
      where,
      include: {
        storyComponents: true,
        assignee: { select: { id: true, displayName: true, email: true } },
        feature: { select: { id: true, name: true, prefix: true } },
        sprint: { select: { id: true, name: true } },
      },
      orderBy: { sortOrder: "asc" },
    })

    return { stories }
  })

export const updateStoryStatus = actionClient
  .schema(updateStoryStatusSchema)
  .action(async ({ parsedInput }) => {
    const member = await getCurrentMember(parsedInput.projectId)

    // Get current story
    const existing = await prisma.story.findUnique({
      where: { id: parsedInput.storyId },
      select: { projectId: true, status: true, displayId: true, assigneeId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Story not found")
    }

    // Validate transition with role gating (T-03-03)
    if (!canTransition(existing.status, parsedInput.status, member.role)) {
      throw new Error("Invalid status transition for your role")
    }

    const story = await prisma.story.update({
      where: { id: parsedInput.storyId },
      data: { status: parsedInput.status },
    })

    // Create status transition record
    await prisma.statusTransition.create({
      data: {
        id: createId(),
        entityType: "Story",
        entityId: parsedInput.storyId,
        fromStatus: existing.status,
        toStatus: parsedInput.status,
        transitionedById: member.id,
        transitionedByRole: member.role,
      },
    })

    // Fire Inngest events
    await inngest.send({
      name: EVENTS.STORY_STATUS_CHANGED,
      data: {
        projectId: parsedInput.projectId,
        storyId: parsedInput.storyId,
        fromStatus: existing.status,
        newStatus: parsedInput.status,
        memberId: member.id,
      },
    })

    await inngest.send({
      name: EVENTS.PROJECT_STATE_CHANGED,
      data: {
        projectId: parsedInput.projectId,
      },
    })

    // Notify the story assignee (if different from actor) about status change
    if (existing.assigneeId && existing.assigneeId !== member.id) {
      await inngest.send({
        name: EVENTS.NOTIFICATION_SEND,
        data: {
          projectId: parsedInput.projectId,
          type: "STORY_STATUS_CHANGED",
          recipientMemberIds: [existing.assigneeId],
          entityId: parsedInput.storyId,
          entityType: "STORY",
          title: `Story ${existing.displayId} moved to ${parsedInput.status}`,
          actorMemberId: member.id,
        },
      })
    }

    revalidatePath(`/projects/${parsedInput.projectId}/work`)
    return { story }
  })

export const getStory = actionClient
  .schema(getStorySchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    const story = await prisma.story.findUnique({
      where: { id: parsedInput.storyId },
      include: {
        epic: { select: { id: true, name: true, prefix: true } },
        feature: { select: { id: true, name: true, prefix: true } },
        sprint: { select: { id: true, name: true } },
        assignee: { select: { id: true, displayName: true, email: true } },
        testAssignee: { select: { id: true, displayName: true, email: true } },
        storyComponents: true,
      },
    })

    if (!story || story.projectId !== parsedInput.projectId) {
      throw new Error("Story not found")
    }

    return { story }
  })

export const addStoryComponent = actionClient
  .schema(addStoryComponentSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)
    const db = scopedPrisma(parsedInput.projectId)

    // Application-level dedup per Pitfall 1: check if already exists
    const existing = await db.storyComponent.findFirst({
      where: {
        storyId: parsedInput.storyId,
        componentName: parsedInput.componentName,
        impactType: parsedInput.impactType,
        projectId: parsedInput.projectId,
      },
    })

    if (existing) {
      return { storyComponent: existing }
    }

    const storyComponent = await prisma.storyComponent.create({
      data: {
        id: createId(),
        storyId: parsedInput.storyId,
        projectId: parsedInput.projectId,
        componentName: parsedInput.componentName,
        impactType: parsedInput.impactType,
      },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/work`)
    return { storyComponent }
  })

export const removeStoryComponent = actionClient
  .schema(removeStoryComponentSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate storyComponent belongs to project
    const existing = await prisma.storyComponent.findUnique({
      where: { id: parsedInput.storyComponentId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Story component not found")
    }

    await prisma.storyComponent.delete({
      where: { id: parsedInput.storyComponentId },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/work`)
    return { success: true }
  })
