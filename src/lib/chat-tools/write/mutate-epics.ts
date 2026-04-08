import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"

export function mutateEpicsTools(projectId: string, memberId: string) {
  const scoped = scopedPrisma(projectId)
  void memberId

  return {
    create_epic: tool({
      description: "Create a new epic. Returns the created epic summary.",
      inputSchema: z.object({
        name: z.string().min(1).max(200),
        prefix: z.string().min(1).max(10).describe("Unique prefix for this epic (e.g. AUTH, CRM)"),
        description: z.string().optional(),
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]).default("NOT_STARTED"),
        sortOrder: z.number().int().min(0).default(0),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const epic = await scoped.epic.create({
            data: {
              projectId,
              name: s.name,
              prefix: s.prefix.toUpperCase(),
              description: s.description,
              status: s.status,
              sortOrder: s.sortOrder,
            },
            select: { id: true, name: true, prefix: true, status: true },
          })
          return { success: true, epic }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Create failed" }
        }
      },
    }),

    update_epic: tool({
      description: "Update fields on an existing epic. Only provide fields to change.",
      inputSchema: z.object({
        epicId: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]).optional(),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const { epicId, ...updateData } = s
          const existing = await scoped.epic.findUnique({ where: { id: epicId }, select: { id: true } })
          if (!existing) return { success: false, error: "Epic not found" }
          const epic = await scoped.epic.update({
            where: { id: epicId },
            data: updateData,
            select: { id: true, name: true, prefix: true, status: true },
          })
          return { success: true, epic }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Update failed" }
        }
      },
    }),
  }
}
