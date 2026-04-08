import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryFeaturesTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_features: tool({
      description: "Search for features. Returns summary fields. Use get_feature for full details.",
      inputSchema: z.object({
        epicId: z.string().optional().describe("Filter by epic ID"),
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ epicId, status, limit }) => {
        try {
          const features = await scoped.feature.findMany({
            where: {
              ...(epicId && { epicId }),
              ...(status && { status }),
            },
            select: {
              id: true,
              name: true,
              prefix: true,
              status: true,
              epicId: true,
            },
            take: limit,
            orderBy: { sortOrder: "asc" },
          })
          return { success: true, count: features.length, features }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_feature: tool({
      description: "Get full details of a single feature by ID.",
      inputSchema: z.object({
        featureId: z.string().describe("The feature ID"),
      }),
      execute: async ({ featureId }) => {
        try {
          const feature = await scoped.feature.findUnique({
            where: { id: featureId },
          })
          if (!feature) return { success: false, error: "Feature not found" }
          return { success: true, feature }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
