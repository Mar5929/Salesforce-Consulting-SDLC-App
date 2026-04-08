import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"

export function mutateFeaturesTools(projectId: string, memberId: string) {
  const scoped = scopedPrisma(projectId)
  void memberId

  return {
    create_feature: tool({
      description: "Create a new feature within an epic. Returns the created feature summary.",
      inputSchema: z.object({
        epicId: z.string().describe("Epic this feature belongs to"),
        name: z.string().min(1).max(200),
        prefix: z.string().min(1).max(10).describe("Unique prefix for this feature"),
        description: z.string().optional(),
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]).default("NOT_STARTED"),
        sortOrder: z.number().int().min(0).default(0),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const epic = await scoped.epic.findUnique({ where: { id: s.epicId }, select: { id: true } })
          if (!epic) return { success: false, error: "Epic not found in this project" }
          const feature = await scoped.feature.create({
            data: {
              projectId,
              epicId: s.epicId,
              name: s.name,
              prefix: s.prefix.toUpperCase(),
              description: s.description,
              status: s.status,
              sortOrder: s.sortOrder,
            },
            select: { id: true, name: true, prefix: true, status: true, epicId: true },
          })
          return { success: true, feature }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Create failed" }
        }
      },
    }),

    update_feature: tool({
      description: "Update fields on an existing feature. Only provide fields to change.",
      inputSchema: z.object({
        featureId: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]).optional(),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const { featureId, ...updateData } = s
          const existing = await scoped.feature.findUnique({ where: { id: featureId }, select: { id: true } })
          if (!existing) return { success: false, error: "Feature not found" }
          const feature = await scoped.feature.update({
            where: { id: featureId },
            data: updateData,
            select: { id: true, name: true, prefix: true, status: true },
          })
          return { success: true, feature }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Update failed" }
        }
      },
    }),
  }
}
