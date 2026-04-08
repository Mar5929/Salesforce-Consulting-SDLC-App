import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"
import { generateDisplayId } from "@/lib/display-id"
import { prisma } from "@/lib/db"

export function batchQuestionsTools(projectId: string, memberId: string) {
  const scoped = scopedPrisma(projectId)
  void memberId

  return {
    create_questions: tool({
      description: "Create multiple discovery questions in a single operation. Max 20 questions. Returns created question summaries.",
      inputSchema: z.object({
        questions: z
          .array(
            z.object({
              title: z.string().min(1).max(500).describe("The question text"),
              description: z.string().optional(),
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
            })
          )
          .min(1)
          .max(20),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const created: Array<{ id: string; displayId: string; title: string }> = []

          // Sequential loop to preserve displayId ordering
          for (const questionInput of s.questions) {
            const displayId = await generateDisplayId(projectId, "Question", prisma)
            const question = await scoped.question.create({
              data: {
                projectId,
                displayId,
                questionText: questionInput.title,
                category: questionInput.category,
                scope: questionInput.scope,
                status: "OPEN",
              },
              select: { id: true, displayId: true, questionText: true },
            })
            created.push({ id: question.id, displayId: question.displayId, title: question.questionText })
          }

          return { success: true, created: created.length, questions: created }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Batch create failed" }
        }
      },
    }),
  }
}
