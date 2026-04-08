import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function querySprintsTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_sprints: tool({
      description: "Search for sprints. Returns summary fields. Use get_sprint for full details.",
      inputSchema: z.object({
        status: z.enum(["PLANNING", "ACTIVE", "COMPLETE"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ status, limit }) => {
        try {
          const sprints = await scoped.sprint.findMany({
            where: {
              ...(status && { status }),
            },
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
            },
            take: limit,
            orderBy: { startDate: "desc" },
          })
          return { success: true, count: sprints.length, sprints }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_sprint: tool({
      description: "Get full details of a single sprint by ID, including story count.",
      inputSchema: z.object({
        sprintId: z.string().describe("The sprint ID"),
      }),
      execute: async ({ sprintId }) => {
        try {
          const sprint = await scoped.sprint.findUnique({
            where: { id: sprintId },
            include: {
              _count: {
                select: { stories: true },
              },
            },
          })
          if (!sprint) return { success: false, error: "Sprint not found" }
          return { success: true, sprint }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
