import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryTestCasesTools(projectId: string) {
  // TestCase does not have projectId — scoped via story relationship
  // We use the raw prisma client filtered by story membership in project
  const scoped = scopedPrisma(projectId)

  return {
    query_test_cases: tool({
      description: "Search for test cases. Returns summary fields. Use get_test_case for full details.",
      inputSchema: z.object({
        testType: z.enum(["HAPPY_PATH", "EDGE_CASE", "NEGATIVE", "BULK"]).optional(),
        source: z.enum(["AI_GENERATED", "MANUAL"]).optional(),
        storyId: z.string().optional().describe("Filter by story ID"),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ testType, source, storyId, limit }) => {
        try {
          // TestCase is scoped via story.projectId — filter by storyId or story.projectId
          const testCases = await scoped.testCase.findMany({
            where: {
              ...(testType && { testType }),
              ...(source && { source }),
              ...(storyId && { storyId }),
            },
            select: {
              id: true,
              title: true,
              testType: true,
              source: true,
              storyId: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: testCases.length, testCases }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_test_case: tool({
      description: "Get full details of a single test case by ID.",
      inputSchema: z.object({
        testCaseId: z.string().describe("The test case ID"),
      }),
      execute: async ({ testCaseId }) => {
        try {
          const testCase = await scoped.testCase.findUnique({
            where: { id: testCaseId },
          })
          if (!testCase) return { success: false, error: "Test case not found" }
          return { success: true, testCase }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
