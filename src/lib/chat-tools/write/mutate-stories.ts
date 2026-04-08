import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"
import { generateStoryDisplayId } from "@/lib/display-id"
import { prisma } from "@/lib/db"

export function mutateStoriesTools(projectId: string, memberId: string, role: string) {
  const scoped = scopedPrisma(projectId)

  return {
    create_story: tool({
      description: "Create a new user story. Returns the created story summary.",
      inputSchema: z.object({
        epicId: z.string().describe("Epic this story belongs to"),
        featureId: z.string().optional().describe("Feature this story belongs to (optional)"),
        title: z.string().min(1).max(200),
        persona: z.string().optional(),
        description: z.string().optional(),
        acceptanceCriteria: z.string().optional(),
        storyPoints: z.number().int().min(1).max(13).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
        assigneeId: z.string().optional().describe("ProjectMember ID to assign"),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const epic = await scoped.epic.findUnique({
            where: { id: s.epicId },
            select: { id: true, prefix: true },
          })
          if (!epic) return { success: false, error: "Epic not found in this project" }
          const displayId = await generateStoryDisplayId(projectId, epic.prefix, prisma)
          const count = await scoped.story.count()
          const story = await scoped.story.create({
            data: {
              projectId,
              epicId: s.epicId,
              featureId: s.featureId,
              displayId,
              title: s.title,
              persona: s.persona,
              description: s.description,
              acceptanceCriteria: s.acceptanceCriteria,
              storyPoints: s.storyPoints,
              priority: s.priority,
              status: "DRAFT",
              assigneeId: s.assigneeId,
              sortOrder: count + 1,
            },
            select: { id: true, displayId: true, title: true, status: true, priority: true },
          })
          return { success: true, story }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Create failed" }
        }
      },
    }),

    update_story: tool({
      description: "Update fields on an existing story. Only provide fields to change.",
      inputSchema: z.object({
        storyId: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        acceptanceCriteria: z.string().optional(),
        storyPoints: z.number().int().min(1).max(13).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        status: z
          .enum(["DRAFT", "READY", "SPRINT_PLANNED", "IN_PROGRESS", "IN_REVIEW", "QA", "DONE"])
          .optional(),
        assigneeId: z.string().optional(),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const existing = await scoped.story.findUnique({
            where: { id: s.storyId },
            select: { id: true, assigneeId: true },
          })
          if (!existing) return { success: false, error: "Story not found" }
          if (["BA", "DEVELOPER"].includes(role) && existing.assigneeId !== memberId) {
            return { success: false, error: "You can only update stories assigned to you" }
          }
          const { storyId, ...updateData } = s
          const story = await scoped.story.update({
            where: { id: storyId },
            data: updateData,
            select: { id: true, displayId: true, title: true, status: true },
          })
          return { success: true, story }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Update failed" }
        }
      },
    }),
  }
}
