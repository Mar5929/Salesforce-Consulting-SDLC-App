import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"
import { generateStoryDisplayId } from "@/lib/display-id"
import { prisma } from "@/lib/db"

export function batchStoriesTools(projectId: string, memberId: string, role: string) {
  const scoped = scopedPrisma(projectId)
  void memberId
  void role

  return {
    create_stories: tool({
      description: "Create multiple user stories in a single operation. Max 20 stories. Returns created story summaries.",
      inputSchema: z.object({
        epicId: z.string().describe("Epic all stories belong to"),
        featureId: z.string().optional().describe("Feature all stories belong to (optional)"),
        stories: z
          .array(
            z.object({
              title: z.string().min(1).max(200),
              description: z.string().optional(),
              acceptanceCriteria: z.string().optional(),
              storyPoints: z.number().int().min(1).max(13).optional(),
              priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
            })
          )
          .min(1)
          .max(20),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const epic = await scoped.epic.findUnique({
            where: { id: s.epicId },
            select: { id: true, prefix: true },
          })
          if (!epic) return { success: false, error: "Epic not found in this project" }

          const created: Array<{ id: string; displayId: string; title: string }> = []

          // Sequential loop to preserve displayId ordering
          for (const storyInput of s.stories) {
            const displayId = await generateStoryDisplayId(projectId, epic.prefix, prisma)
            const count = await scoped.story.count()
            const story = await scoped.story.create({
              data: {
                projectId,
                epicId: s.epicId,
                featureId: s.featureId,
                displayId,
                title: storyInput.title,
                description: storyInput.description,
                acceptanceCriteria: storyInput.acceptanceCriteria,
                storyPoints: storyInput.storyPoints,
                priority: storyInput.priority,
                status: "DRAFT",
                sortOrder: count + 1,
              },
              select: { id: true, displayId: true, title: true },
            })
            created.push(story)
          }

          return { success: true, created: created.length, stories: created }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Batch create failed" }
        }
      },
    }),
  }
}
