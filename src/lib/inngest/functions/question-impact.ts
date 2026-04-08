/**
 * Question Impact Inngest Function — Hybrid Routing
 *
 * Triggered by QUESTION_IMPACT_REQUESTED event. Runs the questionImpactTask
 * via the agent harness. Routes based on conflict detection:
 *
 * - No conflict: auto-answers the question, updates status, notifies
 * - Conflict found: creates a QUESTION_SESSION conversation for human review
 *
 * This is separate from question-impact-assessment.ts which runs on
 * ENTITY_CONTENT_CHANGED events after a question is answered.
 */

import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { executeTask } from "@/lib/agent-harness/engine"
import { questionImpactTask } from "@/lib/agent-harness/tasks/question-impact"
import { prisma } from "@/lib/db"
import type { ToolResult } from "@/lib/agent-harness/types"

export const questionImpactFunction = inngest.createFunction(
  {
    id: "question-impact-hybrid",
    retries: 2,
    triggers: [{ event: EVENTS.QUESTION_IMPACT_REQUESTED }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { projectId, questionId, memberId } = event.data as {
      projectId: string
      questionId: string
      memberId: string
    }

    // Step 1: Run AI impact assessment via agent harness
    const result = await step.run("run-impact-assessment", async () => {
      return executeTask(
        questionImpactTask,
        {
          userMessage: `Assess the impact of question ${questionId} and check for conflicts with existing decisions`,
          entityId: questionId,
        },
        projectId,
        memberId
      )
    })

    // Step 2: Check for conflicts in tool results
    const conflicts = result.toolResults.filter(
      (tr: ToolResult) => tr.toolName === "flag_conflict" && !tr.isError
    )

    if (conflicts.length === 0) {
      // No conflicts — auto-answer the question
      await step.run("auto-answer-question", async () => {
        await prisma.question.update({
          where: { id: questionId },
          data: {
            answerText: result.output,
            impactAssessment: result.output,
            status: "ANSWERED",
            answeredDate: new Date(),
          },
        })
      })

      // Notify that question was auto-answered
      await step.run("notify-auto-answered", async () => {
        await inngest.send({
          name: EVENTS.NOTIFICATION_SEND,
          data: {
            projectId,
            type: "QUESTION_ANSWERED",
            title: "Question auto-answered",
            message: `Question ${questionId} was answered by AI with no conflicts detected.`,
            targetMemberId: memberId,
          },
        })
      })

      return {
        questionId,
        outcome: "auto-answered",
        tokenUsage: result.tokenUsage,
        cost: result.cost,
      }
    }

    // Conflicts found — create QUESTION_SESSION for human resolution
    const conversation = await step.run(
      "create-question-session",
      async () => {
        const question = await prisma.question.findUnique({
          where: { id: questionId },
          select: { displayId: true, questionText: true },
        })

        const conflictSummary = conflicts
          .map((c: ToolResult) => {
            const data = c.result as Record<string, unknown>
            return `${data.conflictType}: ${data.description} (${data.severity})`
          })
          .join("; ")

        return prisma.conversation.create({
          data: {
            projectId,
            conversationType: "QUESTION_SESSION",
            title: `Conflict: ${question?.displayId ?? questionId} — ${question?.questionText?.substring(0, 60) ?? "Question"}`,
            createdById: memberId,
            metadata: {
              questionId,
              conflicts: conflicts.map((c: ToolResult) => c.result),
              aiAnalysis: result.output,
            },
          },
        })
      }
    )

    // Save AI analysis as first message in the conversation
    await step.run("save-initial-analysis", async () => {
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content: result.output,
          inputTokens: result.tokenUsage.input,
          outputTokens: result.tokenUsage.output,
          cost: result.cost,
        },
      })
    })

    // Notify about conflict requiring resolution
    await step.run("notify-conflict", async () => {
      await inngest.send({
        name: EVENTS.NOTIFICATION_SEND,
        data: {
          projectId,
          type: "QUESTION_CONFLICT",
          title: "Decision conflict detected",
          message: `Question ${questionId} conflicts with existing decisions. Review required.`,
          targetMemberId: memberId,
          link: `/projects/${projectId}/chat/${conversation.id}`,
        },
      })
    })

    return {
      questionId,
      outcome: "conflict-detected",
      conversationId: conversation.id,
      conflictCount: conflicts.length,
      tokenUsage: result.tokenUsage,
      cost: result.cost,
    }
  }
)
