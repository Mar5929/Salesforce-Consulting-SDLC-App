import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryDecisionsTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_decisions: tool({
      description: "Search for decisions. Returns summary fields. Use get_decision for full details.",
      inputSchema: z.object({
        confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ confidence, limit }) => {
        try {
          const decisions = await scoped.decision.findMany({
            where: {
              ...(confidence && { confidence }),
            },
            select: {
              id: true,
              displayId: true,
              title: true,
              confidence: true,
              createdAt: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: decisions.length, decisions }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_decision: tool({
      description: "Get full details of a single decision by ID.",
      inputSchema: z.object({
        decisionId: z.string().describe("The decision ID"),
      }),
      execute: async ({ decisionId }) => {
        try {
          const decision = await scoped.decision.findUnique({
            where: { id: decisionId },
          })
          if (!decision) return { success: false, error: "Decision not found" }
          return { success: true, decision }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
