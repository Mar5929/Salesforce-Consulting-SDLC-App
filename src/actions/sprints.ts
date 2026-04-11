"use server"

/**
 * Sprint Server Actions
 *
 * CRUD operations for Sprint entity with project scoping.
 * Includes story assignment with auto-transition (D-09)
 * and Inngest event firing for conflict detection (D-19).
 *
 * All actions use next-safe-action for Zod validation and auth middleware.
 * All DB operations use scopedPrisma for project isolation (T-03-11, T-03-13).
 * Date validation ensures endDate > startDate (T-03-12).
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember, requireRole } from "@/lib/auth"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { createId } from "@paralleldrive/cuid2"
import { SprintStatus } from "@/generated/prisma"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const createSprintSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  goal: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

const updateSprintSchema = z.object({
  projectId: z.string(),
  sprintId: z.string(),
  name: z.string().min(1).max(100).optional(),
  goal: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.nativeEnum(SprintStatus).optional(),
})

const getSprintsSchema = z.object({
  projectId: z.string(),
})

const getSprintSchema = z.object({
  projectId: z.string(),
  sprintId: z.string(),
})

const assignStoriesSchema = z.object({
  projectId: z.string(),
  sprintId: z.string(),
  storyIds: z.array(z.string()).min(1),
})

const removeStoriesSchema = z.object({
  projectId: z.string(),
  storyIds: z.array(z.string()).min(1),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

export const createSprint = actionClient
  .schema(createSprintSchema)
  .action(async ({ parsedInput }) => {
    await requireRole(parsedInput.projectId, ["SOLUTION_ARCHITECT", "PM"])

    // Validate endDate > startDate (T-03-12)
    const start = new Date(parsedInput.startDate)
    const end = new Date(parsedInput.endDate)
    if (end <= start) {
      throw new Error("End date must be after start date")
    }

    const sprint = await prisma.sprint.create({
      data: {
        id: createId(),
        projectId: parsedInput.projectId,
        name: parsedInput.name,
        goal: parsedInput.goal ?? null,
        startDate: start,
        endDate: end,
        status: "PLANNING",
      },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/sprints`)
    return { sprint }
  })

export const updateSprint = actionClient
  .schema(updateSprintSchema)
  .action(async ({ parsedInput }) => {
    await requireRole(parsedInput.projectId, ["SOLUTION_ARCHITECT", "PM"])

    // Verify sprint belongs to project (T-03-13)
    const existing = await prisma.sprint.findUnique({
      where: { id: parsedInput.sprintId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Sprint not found")
    }

    const updateData: Record<string, unknown> = {}
    if (parsedInput.name !== undefined) updateData.name = parsedInput.name
    if (parsedInput.goal !== undefined) updateData.goal = parsedInput.goal
    if (parsedInput.status !== undefined) updateData.status = parsedInput.status

    if (parsedInput.startDate !== undefined) {
      updateData.startDate = new Date(parsedInput.startDate)
    }
    if (parsedInput.endDate !== undefined) {
      updateData.endDate = new Date(parsedInput.endDate)
    }

    // Validate dates if both are being updated
    if (updateData.startDate && updateData.endDate) {
      if ((updateData.endDate as Date) <= (updateData.startDate as Date)) {
        throw new Error("End date must be after start date")
      }
    }

    const sprint = await prisma.sprint.update({
      where: { id: parsedInput.sprintId },
      data: updateData,
    })

    revalidatePath(`/projects/${parsedInput.projectId}/sprints`)
    return { sprint }
  })

export const getSprints = actionClient
  .schema(getSprintsSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)
    const db = scopedPrisma(parsedInput.projectId)

    const sprints = await db.sprint.findMany({
      where: { projectId: parsedInput.projectId },
      include: {
        stories: {
          select: { storyPoints: true, status: true },
        },
      },
      orderBy: { startDate: "desc" },
    })

    return { sprints }
  })

export const getSprint = actionClient
  .schema(getSprintSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    const sprint = await prisma.sprint.findUnique({
      where: { id: parsedInput.sprintId },
      include: {
        stories: {
          include: {
            storyComponents: true,
            assignee: { select: { id: true, displayName: true, email: true } },
            feature: { select: { id: true, name: true, prefix: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    if (!sprint || sprint.projectId !== parsedInput.projectId) {
      throw new Error("Sprint not found")
    }

    return { sprint }
  })

export const assignStoriesToSprint = actionClient
  .schema(assignStoriesSchema)
  .action(async ({ parsedInput }) => {
    await requireRole(parsedInput.projectId, ["SOLUTION_ARCHITECT", "PM"])

    // Verify sprint belongs to project (T-03-11)
    const sprint = await prisma.sprint.findUnique({
      where: { id: parsedInput.sprintId },
      select: { id: true, projectId: true },
    })
    if (!sprint || sprint.projectId !== parsedInput.projectId) {
      throw new Error("Sprint not found")
    }

    // Assign each story, auto-transitioning READY -> SPRINT_PLANNED (D-09)
    for (const storyId of parsedInput.storyIds) {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { id: true, projectId: true, status: true },
      })
      if (!story || story.projectId !== parsedInput.projectId) {
        throw new Error(`Story ${storyId} not found in project`)
      }

      // Auto-transition READY -> SPRINT_PLANNED (D-09)
      // If not READY, keep current status (Pitfall 3: don't block assignment)
      const newStatus = story.status === "READY" ? "SPRINT_PLANNED" : story.status

      await prisma.story.update({
        where: { id: storyId },
        data: { sprintId: parsedInput.sprintId, status: newStatus },
      })
    }

    // Fire event for conflict detection (D-19)
    await inngest.send({
      name: EVENTS.SPRINT_STORIES_CHANGED,
      data: {
        sprintId: parsedInput.sprintId,
        projectId: parsedInput.projectId,
      },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/sprints`)
    return { success: true }
  })

export const removeStoriesFromSprint = actionClient
  .schema(removeStoriesSchema)
  .action(async ({ parsedInput }) => {
    await requireRole(parsedInput.projectId, ["SOLUTION_ARCHITECT", "PM"])

    // Track which sprint(s) were affected for event firing
    const affectedSprintIds = new Set<string>()

    for (const storyId of parsedInput.storyIds) {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { id: true, projectId: true, status: true, sprintId: true },
      })
      if (!story || story.projectId !== parsedInput.projectId) {
        throw new Error(`Story ${storyId} not found in project`)
      }

      if (story.sprintId) {
        affectedSprintIds.add(story.sprintId)
      }

      // Revert SPRINT_PLANNED -> READY on removal
      const newStatus = story.status === "SPRINT_PLANNED" ? "READY" : story.status

      await prisma.story.update({
        where: { id: storyId },
        data: { sprintId: null, status: newStatus },
      })
    }

    // Fire event for each affected sprint
    for (const sprintId of affectedSprintIds) {
      await inngest.send({
        name: EVENTS.SPRINT_STORIES_CHANGED,
        data: {
          sprintId,
          projectId: parsedInput.projectId,
        },
      })
    }

    revalidatePath(`/projects/${parsedInput.projectId}/sprints`)
    return { success: true }
  })
