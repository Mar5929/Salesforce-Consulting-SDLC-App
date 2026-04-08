import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"
import { generateDisplayId } from "@/lib/display-id"
import { prisma } from "@/lib/db"

export function mutateRequirementsTools(projectId: string, memberId: string) {
  const scoped = scopedPrisma(projectId)
  void memberId

  return {
    create_requirement: tool({
      description: "Capture a project requirement. Returns the created requirement summary.",
      inputSchema: z.object({
        title: z.string().min(1).max(300).describe("Requirement title"),
        description: z.string().min(1).describe("Detailed requirement description"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
        status: z.enum(["CAPTURED", "MAPPED", "DEFERRED"]).default("CAPTURED"),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const displayId = await generateDisplayId(projectId, "Requirement", prisma)
          const requirement = await scoped.requirement.create({
            data: {
              projectId,
              displayId,
              description: `${s.title}\n\n${s.description}`,
              priority: s.priority,
              status: s.status,
            },
            select: { id: true, displayId: true, description: true, priority: true, status: true },
          })
          return { success: true, requirement }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Create failed" }
        }
      },
    }),

    update_requirement: tool({
      description: "Update fields on an existing requirement. Only provide fields to change.",
      inputSchema: z.object({
        requirementId: z.string(),
        title: z.string().optional().describe("Updated title (prepended to description)"),
        description: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        status: z.enum(["CAPTURED", "MAPPED", "DEFERRED"]).optional(),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const existing = await scoped.requirement.findUnique({
            where: { id: s.requirementId },
            select: { id: true, description: true },
          })
          if (!existing) return { success: false, error: "Requirement not found" }
          const { requirementId, title, description, ...rest } = s
          // Build updated description if either title or description changes
          let updatedDescription: string | undefined
          if (description !== undefined) {
            updatedDescription = title ? `${title}\n\n${description}` : description
          } else if (title !== undefined) {
            updatedDescription = `${title}\n\n${existing.description}`
          }
          const requirement = await scoped.requirement.update({
            where: { id: requirementId },
            data: {
              ...(updatedDescription !== undefined && { description: updatedDescription }),
              ...(rest.priority !== undefined && { priority: rest.priority }),
              ...(rest.status !== undefined && { status: rest.status }),
            },
            select: { id: true, displayId: true, description: true, priority: true, status: true },
          })
          return { success: true, requirement }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Update failed" }
        }
      },
    }),
  }
}
