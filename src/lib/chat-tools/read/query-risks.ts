import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryRisksTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_risks: tool({
      description: "Search for risks. Returns summary fields. Use get_risk for full details.",
      inputSchema: z.object({
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        status: z.enum(["OPEN", "MITIGATED", "CLOSED", "ACCEPTED"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ severity, status, limit }) => {
        try {
          const risks = await scoped.risk.findMany({
            where: {
              ...(severity && { severity }),
              ...(status && { status }),
            },
            select: {
              id: true,
              displayId: true,
              description: true,
              severity: true,
              status: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: risks.length, risks }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_risk: tool({
      description: "Get full details of a single risk by ID.",
      inputSchema: z.object({
        riskId: z.string().describe("The risk ID"),
      }),
      execute: async ({ riskId }) => {
        try {
          const risk = await scoped.risk.findUnique({
            where: { id: riskId },
          })
          if (!risk) return { success: false, error: "Risk not found" }
          return { success: true, risk }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
