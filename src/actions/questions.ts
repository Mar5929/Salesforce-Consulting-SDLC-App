"use server"

/**
 * Question Server Actions
 *
 * CRUD operations for the Question entity with lifecycle management,
 * AI impact assessment triggering, and review flagging.
 *
 * All actions use next-safe-action for Zod validation and auth middleware.
 * All DB operations use scopedPrisma for project isolation (T-02-13).
 * SA-only role check on flagForReview (T-02-14).
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember, requireRole } from "@/lib/auth"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { generateDisplayId } from "@/lib/display-id"
import { createId } from "@paralleldrive/cuid2"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const createQuestionSchema = z.object({
  projectId: z.string().min(1),
  questionText: z.string().min(1, "Question text is required"),
  scope: z.enum(["ENGAGEMENT", "EPIC", "FEATURE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  scopeEpicId: z.string().optional(),
  scopeFeatureId: z.string().optional(),
  assigneeId: z.string().optional(),
})

const updateQuestionSchema = z.object({
  projectId: z.string().min(1),
  questionId: z.string().min(1),
  questionText: z.string().min(1).optional(),
  scope: z.enum(["ENGAGEMENT", "EPIC", "FEATURE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "SCOPED", "OWNED", "ANSWERED", "REVIEWED", "PARKED"]).optional(),
  scopeEpicId: z.string().nullable().optional(),
  scopeFeatureId: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  parkedReason: z.string().optional(),
})

const answerQuestionSchema = z.object({
  projectId: z.string().min(1),
  questionId: z.string().min(1),
  answerText: z.string().min(1, "Answer text is required"),
})

const flagForReviewSchema = z.object({
  projectId: z.string().min(1),
  questionId: z.string().min(1),
  reviewReason: z.string().min(1, "Review reason is required"),
})

const deleteQuestionSchema = z.object({
  projectId: z.string().min(1),
  questionId: z.string().min(1),
})

const getQuestionsSchema = z.object({
  projectId: z.string().min(1),
  status: z.enum(["OPEN", "SCOPED", "OWNED", "ANSWERED", "REVIEWED", "PARKED"]).optional(),
  scope: z.enum(["ENGAGEMENT", "EPIC", "FEATURE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  ownerId: z.string().optional(),
  needsReview: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
})

const getQuestionSchema = z.object({
  projectId: z.string().min(1),
  questionId: z.string().min(1),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

export const createQuestion = actionClient
  .schema(createQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    await getCurrentMember(parsedInput.projectId)

    const displayId = await generateDisplayId(
      parsedInput.projectId,
      "Question",
      prisma
    )

    const question = await prisma.question.create({
      data: {
        id: createId(),
        projectId: parsedInput.projectId,
        displayId,
        questionText: parsedInput.questionText,
        scope: parsedInput.scope,
        priority: parsedInput.priority,
        scopeEpicId: parsedInput.scopeEpicId ?? null,
        scopeFeatureId: parsedInput.scopeFeatureId ?? null,
        ownerId: parsedInput.assigneeId ?? null,
        status: "OPEN",
      },
    })

    // Notify assignee if set
    if (parsedInput.assigneeId) {
      await inngest.send({
        name: EVENTS.NOTIFICATION_SEND,
        data: {
          projectId: parsedInput.projectId,
          type: "QUESTION_ASSIGNED",
          recipientId: parsedInput.assigneeId,
          entityId: question.id,
          entityType: "Question",
          message: `You were assigned question ${displayId}`,
        },
      })
    }

    revalidatePath(`/projects/${parsedInput.projectId}/questions`)
    return { question }
  })

export const updateQuestion = actionClient
  .schema(updateQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    await getCurrentMember(parsedInput.projectId)

    const { projectId, questionId, ...updateFields } = parsedInput

    // Validate status transitions
    if (updateFields.status) {
      const existing = await prisma.question.findUnique({
        where: { id: questionId },
        select: { status: true, projectId: true },
      })
      if (!existing || existing.projectId !== projectId) {
        throw new Error("Question not found")
      }

      validateStatusTransition(existing.status, updateFields.status)
    }

    const updateData: Record<string, unknown> = {}
    if (updateFields.questionText !== undefined) updateData.questionText = updateFields.questionText
    if (updateFields.scope !== undefined) updateData.scope = updateFields.scope
    if (updateFields.priority !== undefined) updateData.priority = updateFields.priority
    if (updateFields.status !== undefined) updateData.status = updateFields.status
    if (updateFields.scopeEpicId !== undefined) updateData.scopeEpicId = updateFields.scopeEpicId
    if (updateFields.scopeFeatureId !== undefined) updateData.scopeFeatureId = updateFields.scopeFeatureId
    if (updateFields.ownerId !== undefined) updateData.ownerId = updateFields.ownerId
    if (updateFields.parkedReason !== undefined) updateData.parkedReason = updateFields.parkedReason

    const question = await prisma.question.update({
      where: { id: questionId },
      data: updateData,
    })

    await inngest.send({
      name: EVENTS.ENTITY_CONTENT_CHANGED,
      data: {
        projectId,
        entityType: "Question",
        entityId: questionId,
        userId: ctx.userId,
      },
    })

    revalidatePath(`/projects/${projectId}/questions`)
    return { question }
  })

export const answerQuestion = actionClient
  .schema(answerQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const member = await getCurrentMember(parsedInput.projectId)

    const question = await prisma.question.update({
      where: { id: parsedInput.questionId },
      data: {
        answerText: parsedInput.answerText,
        answeredDate: new Date(),
        answeredById: member.id,
        status: "ANSWERED",
      },
    })

    // Fire-and-forget: trigger AI impact assessment via Inngest
    await inngest.send({
      name: EVENTS.ENTITY_CONTENT_CHANGED,
      data: {
        projectId: parsedInput.projectId,
        entityType: "Question",
        entityId: parsedInput.questionId,
        userId: ctx.userId,
        action: "answered",
      },
    })

    // Notify question owner if different from answerer
    if (question.ownerId && question.ownerId !== member.id) {
      await inngest.send({
        name: EVENTS.NOTIFICATION_SEND,
        data: {
          projectId: parsedInput.projectId,
          type: "QUESTION_ANSWERED",
          recipientId: question.ownerId,
          entityId: question.id,
          entityType: "Question",
          message: `Question ${question.displayId} has been answered`,
        },
      })
    }

    revalidatePath(`/projects/${parsedInput.projectId}/questions`)
    revalidatePath(`/projects/${parsedInput.projectId}/questions/${parsedInput.questionId}`)
    return { question }
  })

export const flagForReview = actionClient
  .schema(flagForReviewSchema)
  .action(async ({ parsedInput, ctx }) => {
    // T-02-14: SA-only role check
    await requireRole(parsedInput.projectId, ["SOLUTION_ARCHITECT"])

    const question = await prisma.question.update({
      where: { id: parsedInput.questionId },
      data: {
        needsReview: true,
        reviewReason: parsedInput.reviewReason,
      },
    })

    // Notify the answerer that review is requested
    if (question.answeredById) {
      await inngest.send({
        name: EVENTS.NOTIFICATION_SEND,
        data: {
          projectId: parsedInput.projectId,
          type: "REVIEW_REQUESTED",
          recipientId: question.answeredById,
          entityId: question.id,
          entityType: "Question",
          message: `Question ${question.displayId} flagged for review: ${parsedInput.reviewReason}`,
        },
      })
    }

    revalidatePath(`/projects/${parsedInput.projectId}/questions`)
    revalidatePath(`/projects/${parsedInput.projectId}/questions/${parsedInput.questionId}`)
    return { question }
  })

export const deleteQuestion = actionClient
  .schema(deleteQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    await getCurrentMember(parsedInput.projectId)

    // Verify question belongs to this project
    const existing = await prisma.question.findUnique({
      where: { id: parsedInput.questionId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Question not found")
    }

    await prisma.question.delete({
      where: { id: parsedInput.questionId },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/questions`)
    return { success: true }
  })

export const getQuestions = actionClient
  .schema(getQuestionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await getCurrentMember(parsedInput.projectId)
    const db = scopedPrisma(parsedInput.projectId)

    const where: Record<string, unknown> = {
      projectId: parsedInput.projectId,
    }
    if (parsedInput.status) where.status = parsedInput.status
    if (parsedInput.scope) where.scope = parsedInput.scope
    if (parsedInput.priority) where.priority = parsedInput.priority
    if (parsedInput.ownerId) where.ownerId = parsedInput.ownerId
    if (parsedInput.needsReview !== undefined) where.needsReview = parsedInput.needsReview

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          owner: { select: { id: true, displayName: true, email: true } },
          answeredBy: { select: { id: true, displayName: true, email: true } },
          scopeEpic: { select: { id: true, name: true, prefix: true } },
          scopeFeature: { select: { id: true, name: true, prefix: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parsedInput.page - 1) * parsedInput.pageSize,
        take: parsedInput.pageSize,
      }),
      prisma.question.count({ where }),
    ])

    return {
      questions,
      total,
      page: parsedInput.page,
      pageSize: parsedInput.pageSize,
      totalPages: Math.ceil(total / parsedInput.pageSize),
    }
  })

export const getQuestion = actionClient
  .schema(getQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    await getCurrentMember(parsedInput.projectId)

    const question = await prisma.question.findUnique({
      where: { id: parsedInput.questionId },
      include: {
        owner: { select: { id: true, displayName: true, email: true } },
        answeredBy: { select: { id: true, displayName: true, email: true } },
        scopeEpic: { select: { id: true, name: true, prefix: true } },
        scopeFeature: { select: { id: true, name: true, prefix: true } },
        questionBlocksStories: {
          include: { story: { select: { id: true, displayId: true, title: true } } },
        },
        questionBlocksEpics: {
          include: { epic: { select: { id: true, prefix: true, name: true } } },
        },
        questionBlocksFeatures: {
          include: { feature: { select: { id: true, prefix: true, name: true } } },
        },
        decisionQuestions: {
          include: { decision: { select: { id: true, displayId: true, title: true } } },
        },
      },
    })

    if (!question || question.projectId !== parsedInput.projectId) {
      throw new Error("Question not found")
    }

    return { question }
  })

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

/**
 * Validate question status transitions.
 * Lifecycle: OPEN -> SCOPED -> OWNED -> ANSWERED -> REVIEWED
 * Parked is reachable from any active state. Unpark returns to OPEN.
 * Reopen from ANSWERED or REVIEWED returns to OPEN.
 */
function validateStatusTransition(current: string, next: string): void {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    OPEN: ["SCOPED", "PARKED"],
    SCOPED: ["OWNED", "OPEN", "PARKED"],
    OWNED: ["ANSWERED", "SCOPED", "OPEN", "PARKED"],
    ANSWERED: ["REVIEWED", "OPEN", "PARKED"], // Reopen or advance
    REVIEWED: ["OPEN", "PARKED"], // Reopen if needed
    PARKED: ["OPEN"], // Unpark
  }

  const allowed = VALID_TRANSITIONS[current]
  if (!allowed || !allowed.includes(next)) {
    throw new Error(
      `Invalid status transition: ${current} -> ${next}. Allowed transitions from ${current}: ${allowed?.join(", ") ?? "none"}`
    )
  }
}
