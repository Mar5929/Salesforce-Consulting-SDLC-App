"use server"

/**
 * Milestone Server Actions
 *
 * CRUD operations for milestones, story linking, and progress computation.
 * All actions use next-safe-action for Zod validation and auth middleware.
 * Revalidates /projects/{projectId}/roadmap on mutations.
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { createId } from "@paralleldrive/cuid2"
import { MilestoneStatus } from "@/generated/prisma"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const createMilestoneSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  targetDate: z.string().optional(), // ISO string
  status: z.nativeEnum(MilestoneStatus).optional(),
})

const updateMilestoneSchema = z.object({
  projectId: z.string(),
  milestoneId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  targetDate: z.string().optional(), // ISO string
  status: z.nativeEnum(MilestoneStatus).optional(),
})

const deleteMilestoneSchema = z.object({
  projectId: z.string(),
  milestoneId: z.string(),
})

const linkStoriesSchema = z.object({
  projectId: z.string(),
  milestoneId: z.string(),
  storyIds: z.array(z.string()).min(1),
})

const unlinkStorySchema = z.object({
  projectId: z.string(),
  milestoneId: z.string(),
  storyId: z.string(),
})

const getMilestoneProgressSchema = z.object({
  projectId: z.string(),
  milestoneId: z.string(),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

export const createMilestone = actionClient
  .schema(createMilestoneSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Auto-compute sortOrder as max existing + 1
    const maxSort = await prisma.milestone.aggregate({
      where: { projectId: parsedInput.projectId },
      _max: { sortOrder: true },
    })
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1

    const milestone = await prisma.milestone.create({
      data: {
        id: createId(),
        projectId: parsedInput.projectId,
        name: parsedInput.name,
        description: parsedInput.description ?? null,
        targetDate: parsedInput.targetDate
          ? new Date(parsedInput.targetDate)
          : null,
        status: parsedInput.status ?? "NOT_STARTED",
        sortOrder,
      },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/roadmap`)
    return { milestone }
  })

export const updateMilestone = actionClient
  .schema(updateMilestoneSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate milestone belongs to project
    const existing = await prisma.milestone.findUnique({
      where: { id: parsedInput.milestoneId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Milestone not found")
    }

    const { projectId, milestoneId, ...updateFields } = parsedInput
    const updateData: Record<string, unknown> = {}
    if (updateFields.name !== undefined) updateData.name = updateFields.name
    if (updateFields.description !== undefined)
      updateData.description = updateFields.description
    if (updateFields.targetDate !== undefined)
      updateData.targetDate = new Date(updateFields.targetDate)
    if (updateFields.status !== undefined)
      updateData.status = updateFields.status

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
    })

    revalidatePath(`/projects/${projectId}/roadmap`)
    return { milestone }
  })

export const deleteMilestone = actionClient
  .schema(deleteMilestoneSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate milestone belongs to project
    const existing = await prisma.milestone.findUnique({
      where: { id: parsedInput.milestoneId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Milestone not found")
    }

    // Cascade delete: Prisma onDelete: Cascade handles MilestoneStory rows
    await prisma.milestone.delete({
      where: { id: parsedInput.milestoneId },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/roadmap`)
    return { success: true }
  })

export const linkStoriesToMilestone = actionClient
  .schema(linkStoriesSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate milestone belongs to project
    const existing = await prisma.milestone.findUnique({
      where: { id: parsedInput.milestoneId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Milestone not found")
    }

    const result = await prisma.milestoneStory.createMany({
      data: parsedInput.storyIds.map((storyId) => ({
        id: createId(),
        milestoneId: parsedInput.milestoneId,
        storyId,
      })),
      skipDuplicates: true,
    })

    revalidatePath(`/projects/${parsedInput.projectId}/roadmap`)
    return { linked: result.count }
  })

export const unlinkStoryFromMilestone = actionClient
  .schema(unlinkStorySchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate milestone belongs to project
    const existing = await prisma.milestone.findUnique({
      where: { id: parsedInput.milestoneId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Milestone not found")
    }

    await prisma.milestoneStory.delete({
      where: {
        milestoneId_storyId: {
          milestoneId: parsedInput.milestoneId,
          storyId: parsedInput.storyId,
        },
      },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/roadmap`)
    return { success: true }
  })

export const getMilestoneProgress = actionClient
  .schema(getMilestoneProgressSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate milestone belongs to project
    const existing = await prisma.milestone.findUnique({
      where: { id: parsedInput.milestoneId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Milestone not found")
    }

    // Get all stories linked to this milestone
    const milestoneStories = await prisma.milestoneStory.findMany({
      where: { milestoneId: parsedInput.milestoneId },
      include: {
        story: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    const totalStories = milestoneStories.length
    const doneStories = milestoneStories.filter(
      (ms) => ms.story.status === "DONE"
    ).length

    // Get blocking questions for those stories via QuestionBlocksStory
    const storyIds = milestoneStories.map((ms) => ms.storyId)
    const blockingLinks = await prisma.questionBlocksStory.findMany({
      where: { storyId: { in: storyIds } },
      include: {
        question: {
          select: { status: true },
        },
      },
    })

    const totalBlockingQuestions = blockingLinks.length
    const resolvedBlockingQuestions = blockingLinks.filter(
      (bl) =>
        bl.question.status === "ANSWERED" || bl.question.status === "REVIEWED"
    ).length

    // Compute progress
    const storyProgress = totalStories > 0 ? doneStories / totalStories : 0
    const questionProgress =
      totalBlockingQuestions > 0
        ? resolvedBlockingQuestions / totalBlockingQuestions
        : 1
    const progress = Math.round(
      (storyProgress * 0.7 + questionProgress * 0.3) * 100
    )

    revalidatePath(`/projects/${parsedInput.projectId}/roadmap`)
    return {
      progress,
      totalStories,
      doneStories,
      totalBlockingQuestions,
      resolvedBlockingQuestions,
    }
  })
