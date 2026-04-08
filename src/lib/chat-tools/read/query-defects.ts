import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryDefectsTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_defects: tool({
      description: "Search for defects. Returns summary fields. Use get_defect for full details.",
      inputSchema: z.object({
        status: z.enum(["OPEN", "ASSIGNED", "FIXED", "VERIFIED", "CLOSED"]).optional(),
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ status, severity, limit }) => {
        try {
          const defects = await scoped.defect.findMany({
            where: {
              ...(status && { status }),
              ...(severity && { severity }),
            },
            select: {
              id: true,
              displayId: true,
              title: true,
              severity: true,
              status: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: defects.length, defects }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_defect: tool({
      description: "Get full details of a single defect by ID.",
      inputSchema: z.object({
        defectId: z.string().describe("The defect ID"),
      }),
      execute: async ({ defectId }) => {
        try {
          const defect = await scoped.defect.findUnique({
            where: { id: defectId },
          })
          if (!defect) return { success: false, error: "Defect not found" }
          return { success: true, defect }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
