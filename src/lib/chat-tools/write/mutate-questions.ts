import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"
import { generateDisplayId } from "@/lib/display-id"
import { prisma } from "@/lib/db"

export function mutateQuestionsTools(projectId: string, memberId: string) {
  const scoped = scopedPrisma(projectId)
  void memberId

  return {
    create_question: tool({
      description: "Create a new discovery question. Returns the created question summary.",
      inputSchema: z.object({
        title: z.string().min(1).max(500).describe("The question text"),
        description: z.string().optional().describe("Additional context or details"),
        category: z
          .enum([
            "BUSINESS_PROCESS",
            "TECHNICAL",
            "DATA",
            "INTEGRATION",
            "SECURITY",
            "COMPLIANCE",
            "DESIGN",
            "GENERAL",
          ])
          .default("GENERAL"),
        scope: z.enum(["ENGAGEMENT", "EPIC", "FEATURE"]).default("ENGAGEMENT"),
        epicId: z.string().optional().describe("Scope to a specific epic (required if scope is EPIC or FEATURE)"),
        featureId: z.string().optional().describe("Scope to a specific feature (required if scope is FEATURE)"),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const displayId = await generateDisplayId(projectId, "Question", prisma)
          const question = await scoped.question.create({
            data: {
              projectId,
              displayId,
              questionText: s.title,
              category: s.category,
              scope: s.scope,
              scopeEpicId: s.epicId,
              scopeFeatureId: s.featureId,
              status: "OPEN",
            },
            select: { id: true, displayId: true, questionText: true, status: true, category: true },
          })
          return { success: true, question }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Create failed" }
        }
      },
    }),

    update_question: tool({
      description: "Update fields on an existing question. Only provide fields to change.",
      inputSchema: z.object({
        questionId: z.string(),
        title: z.string().min(1).max(500).optional().describe("Updated question text"),
        description: z.string().optional(),
        status: z.enum(["OPEN", "SCOPED", "OWNED", "ANSWERED", "REVIEWED", "PARKED"]).optional(),
        category: z
          .enum([
            "BUSINESS_PROCESS",
            "TECHNICAL",
            "DATA",
            "INTEGRATION",
            "SECURITY",
            "COMPLIANCE",
            "DESIGN",
            "GENERAL",
          ])
          .optional(),
        ownerId: z.string().optional().describe("ProjectMember ID of the owner"),
        answerId: z.string().optional().describe("ID of the answer record"),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const existing = await scoped.question.findUnique({
            where: { id: s.questionId },
            select: { id: true },
          })
          if (!existing) return { success: false, error: "Question not found" }
          const { questionId, title, ...rest } = s
          const question = await scoped.question.update({
            where: { id: questionId },
            data: {
              ...(title !== undefined && { questionText: title }),
              ...(rest.status !== undefined && { status: rest.status }),
              ...(rest.category !== undefined && { category: rest.category }),
              ...(rest.ownerId !== undefined && { ownerId: rest.ownerId }),
            },
            select: { id: true, displayId: true, questionText: true, status: true },
          })
          return { success: true, question }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Update failed" }
        }
      },
    }),
  }
}
