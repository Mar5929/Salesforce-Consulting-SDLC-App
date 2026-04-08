import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"

export function mutateTestCasesTools(projectId: string, memberId: string) {
  void memberId

  return {
    create_test_case: tool({
      description: "Create a test case for a story. Returns the created test case summary.",
      inputSchema: z.object({
        storyId: z.string().describe("The story this test case belongs to"),
        title: z.string().min(1).max(300),
        steps: z.string().optional().describe("Test steps to execute"),
        expectedResult: z.string().min(1).describe("Expected outcome"),
        testType: z.enum(["HAPPY_PATH", "EDGE_CASE", "NEGATIVE", "BULK"]),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          // Verify story belongs to project before creating test case
          const story = await prisma.story.findFirst({
            where: { id: s.storyId, projectId },
            select: { id: true },
          })
          if (!story) return { success: false, error: "Story not found in this project" }
          const count = await prisma.testCase.count({ where: { storyId: s.storyId } })
          const testCase = await prisma.testCase.create({
            data: {
              storyId: s.storyId,
              title: s.title,
              steps: s.steps,
              expectedResult: s.expectedResult,
              testType: s.testType,
              source: "MANUAL",
              sortOrder: count + 1,
            },
            select: { id: true, title: true, testType: true, source: true },
          })
          return { success: true, testCase }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Create failed" }
        }
      },
    }),

    update_test_case: tool({
      description: "Update fields on an existing test case. Only provide fields to change.",
      inputSchema: z.object({
        testCaseId: z.string(),
        title: z.string().min(1).max(300).optional(),
        steps: z.string().optional(),
        expectedResult: z.string().optional(),
        testType: z.enum(["HAPPY_PATH", "EDGE_CASE", "NEGATIVE", "BULK"]).optional(),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          // Verify test case belongs to a story in this project
          const existing = await prisma.testCase.findFirst({
            where: {
              id: s.testCaseId,
              story: { projectId },
            },
            select: { id: true },
          })
          if (!existing) return { success: false, error: "Test case not found in this project" }
          const { testCaseId, ...updateData } = s
          const testCase = await prisma.testCase.update({
            where: { id: testCaseId },
            data: updateData,
            select: { id: true, title: true, testType: true },
          })
          return { success: true, testCase }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Update failed" }
        }
      },
    }),
  }
}
