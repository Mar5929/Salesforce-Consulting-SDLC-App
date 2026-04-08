import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryRequirementsTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_requirements: tool({
      description: "Search for requirements. Returns summary fields. Use get_requirement for full details.",
      inputSchema: z.object({
        status: z.enum(["CAPTURED", "MAPPED", "DEFERRED"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ status, priority, limit }) => {
        try {
          const requirements = await scoped.requirement.findMany({
            where: {
              ...(status && { status }),
              ...(priority && { priority }),
            },
            select: {
              id: true,
              displayId: true,
              description: true,
              status: true,
              priority: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: requirements.length, requirements }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_requirement: tool({
      description: "Get full details of a single requirement by ID.",
      inputSchema: z.object({
        requirementId: z.string().describe("The requirement ID"),
      }),
      execute: async ({ requirementId }) => {
        try {
          const requirement = await scoped.requirement.findUnique({
            where: { id: requirementId },
          })
          if (!requirement) return { success: false, error: "Requirement not found" }
          return { success: true, requirement }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
