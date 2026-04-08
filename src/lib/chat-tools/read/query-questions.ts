import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryQuestionsTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_questions: tool({
      description: "Search for questions. Returns summary fields. Use get_question for full details.",
      inputSchema: z.object({
        status: z.enum(["OPEN", "SCOPED", "OWNED", "ANSWERED", "REVIEWED", "PARKED"]).optional(),
        category: z.enum(["BUSINESS_PROCESS", "TECHNICAL", "DATA", "INTEGRATION", "SECURITY", "COMPLIANCE", "DESIGN", "GENERAL"]).optional(),
        scope: z.enum(["ENGAGEMENT", "EPIC", "FEATURE"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ status, category, scope, limit }) => {
        try {
          const questions = await scoped.question.findMany({
            where: {
              ...(status && { status }),
              ...(category && { category }),
              ...(scope && { scope }),
            },
            select: {
              id: true,
              displayId: true,
              questionText: true,
              status: true,
              category: true,
              scope: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: questions.length, questions }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_question: tool({
      description: "Get full details of a single question by ID, including owner and answer.",
      inputSchema: z.object({
        questionId: z.string().describe("The question ID"),
      }),
      execute: async ({ questionId }) => {
        try {
          const question = await scoped.question.findUnique({
            where: { id: questionId },
          })
          if (!question) return { success: false, error: "Question not found" }
          return { success: true, question }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
