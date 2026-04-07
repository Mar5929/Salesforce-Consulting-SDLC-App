/**
 * Question Impact Assessment Inngest Function
 *
 * Triggered when a question is answered (ENTITY_CONTENT_CHANGED with
 * entityType='question' and action='answered'). Runs the questionAnsweringTask
 * via the agent harness to generate an impact assessment, then writes the
 * result to question.impactAssessment.
 *
 * Closes Gap 1 (QUES-04).
 * Threat mitigations:
 * - T-02-11-01: Checks entityType and action before processing
 * - T-02-11-03: Retries capped at 2
 */

import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { executeTask } from "@/lib/agent-harness/engine"
import { questionAnsweringTask } from "@/lib/agent-harness/tasks/question-answering"
import { prisma } from "@/lib/db"

export const questionImpactAssessmentFunction = inngest.createFunction(
  {
    id: "question-impact-assessment",
    retries: 2,
    triggers: [{ event: EVENTS.ENTITY_CONTENT_CHANGED }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { projectId, entityType, entityId, userId, action } = event.data as {
      projectId: string
      entityType: string
      entityId: string
      userId?: string
      action?: string
    }

    // Only process question-answered events (T-02-11-01)
    if (entityType?.toLowerCase() !== "question" || action !== "answered") {
      return {
        skipped: true,
        reason: `Not a question-answered event (entityType=${entityType}, action=${action})`,
      }
    }

    // Step 1: Run AI impact assessment via agent harness
    const result = await step.run("run-impact-assessment", async () => {
      return executeTask(
        questionAnsweringTask,
        {
          userMessage: `Assess the impact of answering question ${entityId}`,
          entityId,
          metadata: { projectId },
        },
        projectId,
        userId ?? "system"
      )
    })

    // Step 2: Persist impact assessment to question record
    await step.run("persist-impact-assessment", async () => {
      await prisma.question.update({
        where: { id: entityId },
        data: {
          impactAssessment: result.output,
        },
      })
    })

    return {
      questionId: entityId,
      tokenUsage: result.tokenUsage,
      cost: result.cost,
    }
  }
)
