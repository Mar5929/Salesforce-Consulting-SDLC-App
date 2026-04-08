import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryBusinessProcessesTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_business_processes: tool({
      description: "Search for business processes. Returns summary fields. Use get_business_process for full details.",
      inputSchema: z.object({
        status: z.enum(["DISCOVERED", "DOCUMENTED", "CONFIRMED", "DEPRECATED"]).optional(),
        complexity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ status, complexity, limit }) => {
        try {
          const processes = await scoped.businessProcess.findMany({
            where: {
              ...(status && { status }),
              ...(complexity && { complexity }),
            },
            select: {
              id: true,
              name: true,
              status: true,
              complexity: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: processes.length, processes }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_business_process: tool({
      description: "Get full details of a single business process by ID.",
      inputSchema: z.object({
        processId: z.string().describe("The business process ID"),
      }),
      execute: async ({ processId }) => {
        try {
          const process = await scoped.businessProcess.findUnique({
            where: { id: processId },
          })
          if (!process) return { success: false, error: "Business process not found" }
          return { success: true, process }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
