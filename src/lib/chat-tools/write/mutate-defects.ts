import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"
import { generateDisplayId } from "@/lib/display-id"
import { prisma } from "@/lib/db"

export function mutateDefectsTools(projectId: string, memberId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    create_defect: tool({
      description: "Log a defect. Returns the created defect summary.",
      inputSchema: z.object({
        title: z.string().min(1).max(300),
        description: z.string().min(1).describe("Steps to reproduce and description of the issue"),
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
        storyId: z.string().optional().describe("Story this defect is related to"),
        assigneeId: z.string().optional().describe("ProjectMember ID to assign"),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const displayId = await generateDisplayId(projectId, "Defect", prisma)
          const defect = await scoped.defect.create({
            data: {
              projectId,
              displayId,
              title: s.title,
              severity: s.severity,
              stepsToReproduce: s.description,
              expectedBehavior: "See description",
              actualBehavior: s.description,
              storyId: s.storyId,
              assigneeId: s.assigneeId,
              createdById: memberId,
              status: "OPEN",
            },
            select: { id: true, displayId: true, title: true, severity: true, status: true },
          })
          return { success: true, defect }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Create failed" }
        }
      },
    }),

    update_defect: tool({
      description: "Update fields on an existing defect. Only provide fields to change.",
      inputSchema: z.object({
        defectId: z.string(),
        title: z.string().min(1).max(300).optional(),
        description: z.string().optional(),
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        status: z.enum(["OPEN", "ASSIGNED", "FIXED", "VERIFIED", "CLOSED"]).optional(),
        assigneeId: z.string().optional(),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const existing = await scoped.defect.findUnique({
            where: { id: s.defectId },
            select: { id: true },
          })
          if (!existing) return { success: false, error: "Defect not found" }
          const { defectId, description, ...rest } = s
          const defect = await scoped.defect.update({
            where: { id: defectId },
            data: {
              ...(rest.title !== undefined && { title: rest.title }),
              ...(description !== undefined && { stepsToReproduce: description }),
              ...(rest.severity !== undefined && { severity: rest.severity }),
              ...(rest.status !== undefined && { status: rest.status }),
              ...(rest.assigneeId !== undefined && { assigneeId: rest.assigneeId }),
            },
            select: { id: true, displayId: true, title: true, severity: true, status: true },
          })
          return { success: true, defect }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Update failed" }
        }
      },
    }),
  }
}
