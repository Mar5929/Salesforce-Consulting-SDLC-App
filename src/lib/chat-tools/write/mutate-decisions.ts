import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"
import { generateDisplayId } from "@/lib/display-id"
import { prisma } from "@/lib/db"

export function mutateDecisionsTools(projectId: string, memberId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    create_decision: tool({
      description: "Record a project decision. Returns the created decision summary.",
      inputSchema: z.object({
        title: z.string().min(1).max(300),
        description: z.string().min(1).describe("What was decided"),
        rationale: z.string().optional().describe("Why this decision was made"),
        confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const displayId = await generateDisplayId(projectId, "Decision", prisma)
          const decision = await scoped.decision.create({
            data: {
              projectId,
              displayId,
              title: s.title,
              rationale: s.rationale ?? s.description,
              madeById: memberId,
              decisionDate: new Date(),
              confidence: s.confidence,
            },
            select: { id: true, displayId: true, title: true, confidence: true },
          })
          return { success: true, decision }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Create failed" }
        }
      },
    }),

    update_decision: tool({
      description: "Update fields on an existing decision. Only provide fields to change.",
      inputSchema: z.object({
        decisionId: z.string(),
        title: z.string().min(1).max(300).optional(),
        description: z.string().optional().describe("Updated decision content"),
        rationale: z.string().optional(),
        confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const existing = await scoped.decision.findUnique({
            where: { id: s.decisionId },
            select: { id: true },
          })
          if (!existing) return { success: false, error: "Decision not found" }
          const { decisionId, description, ...rest } = s
          const decision = await scoped.decision.update({
            where: { id: decisionId },
            data: {
              ...(rest.title !== undefined && { title: rest.title }),
              ...(rest.rationale !== undefined && { rationale: rest.rationale }),
              ...(description !== undefined && rest.rationale === undefined && { rationale: description }),
              ...(rest.confidence !== undefined && { confidence: rest.confidence }),
            },
            select: { id: true, displayId: true, title: true, confidence: true },
          })
          return { success: true, decision }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Update failed" }
        }
      },
    }),
  }
}
