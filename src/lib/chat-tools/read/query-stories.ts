import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryStoriesTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_stories: tool({
      description: "Search for user stories. Returns summary fields. Use get_story for full details.",
      inputSchema: z.object({
        epicId: z.string().optional().describe("Filter by epic ID"),
        featureId: z.string().optional().describe("Filter by feature ID"),
        sprintId: z.string().optional().describe("Filter by sprint ID"),
        status: z.enum(["DRAFT", "READY", "SPRINT_PLANNED", "IN_PROGRESS", "IN_REVIEW", "QA", "DONE"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ epicId, featureId, sprintId, status, priority, limit }) => {
        try {
          const stories = await scoped.story.findMany({
            where: {
              ...(epicId && { epicId }),
              ...(featureId && { featureId }),
              ...(sprintId && { sprintId }),
              ...(status && { status }),
              ...(priority && { priority }),
            },
            select: {
              id: true,
              displayId: true,
              title: true,
              status: true,
              priority: true,
              storyPoints: true,
              epicId: true,
              featureId: true,
              sprintId: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: stories.length, stories }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_story: tool({
      description: "Get full details of a single story by ID.",
      inputSchema: z.object({
        storyId: z.string().describe("The story ID"),
      }),
      execute: async ({ storyId }) => {
        try {
          const story = await scoped.story.findUnique({
            where: { id: storyId },
          })
          if (!story) return { success: false, error: "Story not found" }
          return { success: true, story }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
