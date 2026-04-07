"use server"

/**
 * Test Case and Test Execution Server Actions
 *
 * CRUD operations for test cases and test execution recording.
 * Test cases are scoped to stories. Test executions record pass/fail/blocked
 * results with optional notes and environment info.
 *
 * All actions use next-safe-action for Zod validation and auth middleware.
 * Project membership verified via story -> projectId lookup.
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { createId } from "@paralleldrive/cuid2"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const createTestCaseSchema = z.object({
  storyId: z.string(),
  title: z.string().min(1).max(500),
  steps: z.string().optional(),
  expectedResult: z.string().min(1),
  testType: z.enum(["HAPPY_PATH", "EDGE_CASE", "NEGATIVE", "BULK"]),
})

const recordTestExecutionSchema = z.object({
  testCaseId: z.string(),
  result: z.enum(["PASS", "FAIL", "BLOCKED"]),
  notes: z.string().optional(),
  environment: z.string().optional(),
})

const getStoryTestCasesSchema = z.object({
  storyId: z.string(),
})

const updateTestCaseSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500).optional(),
  steps: z.string().optional(),
  expectedResult: z.string().optional(),
})

const deleteTestCaseSchema = z.object({
  id: z.string(),
})

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

async function getStoryWithProject(storyId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true, projectId: true, assigneeId: true, displayId: true },
  })
  if (!story) throw new Error("Story not found")
  return story
}

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

export const createTestCase = actionClient
  .schema(createTestCaseSchema)
  .action(async ({ parsedInput, ctx }) => {
    const story = await getStoryWithProject(parsedInput.storyId)
    await verifyMembership(story.projectId, ctx.userId)

    // Calculate next sortOrder
    const maxSort = await prisma.testCase.aggregate({
      where: { storyId: parsedInput.storyId },
      _max: { sortOrder: true },
    })
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1

    const testCase = await prisma.testCase.create({
      data: {
        id: createId(),
        storyId: parsedInput.storyId,
        title: parsedInput.title,
        steps: parsedInput.steps ?? null,
        expectedResult: parsedInput.expectedResult,
        testType: parsedInput.testType,
        source: "MANUAL",
        sortOrder,
      },
    })

    revalidatePath(`/projects/${story.projectId}/work`)
    return { testCase }
  })

export const recordTestExecution = actionClient
  .schema(recordTestExecutionSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Navigate: testCase -> story -> project for membership check
    const testCase = await prisma.testCase.findUnique({
      where: { id: parsedInput.testCaseId },
      include: {
        story: { select: { id: true, projectId: true, assigneeId: true, displayId: true } },
      },
    })
    if (!testCase || !testCase.story) throw new Error("Test case not found")

    const projectId = testCase.story.projectId
    const member = await verifyMembership(projectId, ctx.userId)

    const execution = await prisma.testExecution.create({
      data: {
        id: createId(),
        testCaseId: parsedInput.testCaseId,
        executedById: member.id,
        executedAt: new Date(),
        result: parsedInput.result,
        notes: parsedInput.notes ?? null,
        environment: parsedInput.environment ?? null,
      },
    })

    // Emit Inngest events
    await inngest.send({
      name: EVENTS.TEST_EXECUTION_RECORDED,
      data: {
        projectId,
        storyId: testCase.story.id,
        testCaseId: parsedInput.testCaseId,
        result: parsedInput.result,
      },
    })

    await inngest.send({
      name: EVENTS.NOTIFICATION_SEND,
      data: {
        projectId,
        type: "TEST_EXECUTION_RECORDED",
        recipientId: testCase.story.assigneeId ?? member.id,
        entityId: parsedInput.testCaseId,
        entityType: "TestCase",
        message: `Test execution recorded: ${parsedInput.result} on ${testCase.title}`,
      },
    })

    revalidatePath(`/projects/${projectId}/work`)
    return { execution }
  })

export const getStoryTestCases = actionClient
  .schema(getStoryTestCasesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const story = await getStoryWithProject(parsedInput.storyId)
    await verifyMembership(story.projectId, ctx.userId)

    const testCases = await prisma.testCase.findMany({
      where: { storyId: parsedInput.storyId },
      include: {
        testExecutions: {
          orderBy: { executedAt: "desc" },
          take: 1,
          include: { executedBy: { select: { id: true, displayName: true } } },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    return { testCases }
  })

export const updateTestCase = actionClient
  .schema(updateTestCaseSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Look up test case to get story -> project for membership
    const existing = await prisma.testCase.findUnique({
      where: { id: parsedInput.id },
      include: { story: { select: { projectId: true } } },
    })
    if (!existing) throw new Error("Test case not found")
    await verifyMembership(existing.story.projectId, ctx.userId)

    const { id, ...updateFields } = parsedInput
    const updateData: Record<string, unknown> = {}
    if (updateFields.title !== undefined) updateData.title = updateFields.title
    if (updateFields.steps !== undefined) updateData.steps = updateFields.steps
    if (updateFields.expectedResult !== undefined) updateData.expectedResult = updateFields.expectedResult

    const testCase = await prisma.testCase.update({
      where: { id },
      data: updateData,
    })

    revalidatePath(`/projects/${existing.story.projectId}/work`)
    return { testCase }
  })

export const deleteTestCase = actionClient
  .schema(deleteTestCaseSchema)
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.testCase.findUnique({
      where: { id: parsedInput.id },
      include: { story: { select: { projectId: true } } },
    })
    if (!existing) throw new Error("Test case not found")
    await verifyMembership(existing.story.projectId, ctx.userId)

    // Cascade deletes test executions (handled by Prisma onDelete: Cascade)
    await prisma.testCase.delete({
      where: { id: parsedInput.id },
    })

    revalidatePath(`/projects/${existing.story.projectId}/work`)
    return { success: true }
  })
