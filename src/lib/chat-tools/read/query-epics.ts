import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryEpicsTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_epics: tool({
      description: "Search for epics. Returns summary fields. Use get_epic for full details.",
      inputSchema: z.object({
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ status, limit }) => {
        try {
          const epics = await scoped.epic.findMany({
            where: {
              ...(status && { status }),
            },
            select: {
              id: true,
              name: true,
              prefix: true,
              status: true,
              sortOrder: true,
            },
            take: limit,
            orderBy: { sortOrder: "asc" },
          })
          return { success: true, count: epics.length, epics }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_epic: tool({
      description: "Get full details of a single epic by ID.",
      inputSchema: z.object({
        epicId: z.string().describe("The epic ID"),
      }),
      execute: async ({ epicId }) => {
        try {
          const epic = await scoped.epic.findUnique({
            where: { id: epicId },
          })
          if (!epic) return { success: false, error: "Epic not found" }
          return { success: true, epic }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
