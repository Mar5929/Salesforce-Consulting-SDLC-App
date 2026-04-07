/**
 * Transcript Processing Inngest Step Function
 *
 * Multi-step function triggered by TRANSCRIPT_UPLOADED event.
 * Runs the AI agent harness to extract questions, decisions,
 * requirements, and risks from uploaded transcripts.
 *
 * Each step.run() is a Vercel-safe checkpoint (completes within 10s).
 *
 * Threat mitigations:
 * - T-02-17: Content length already validated in uploadTranscript action
 * - T-02-19: All DB queries use project-scoped access
 * - T-02-20: Each step completes within 10s, 3 retry limit, concurrency limit per project
 */

import { inngest } from "../client"
import { EVENTS } from "../events"
import { prisma } from "@/lib/db"
import { executeTask } from "@/lib/agent-harness/engine"
import { transcriptProcessingTask } from "@/lib/agent-harness/tasks/transcript-processing"

/**
 * Failure handler: update transcript status to FAILED and save error to conversation.
 */
export const transcriptProcessingFailure = inngest.createFunction(
  {
    id: "transcript-processing-failure",
    triggers: [{ event: "inngest/function.failed" }],
  },
  async ({ event }) => {
    const originalEvent = event.data?.event as { data?: Record<string, unknown> } | undefined
    if (!originalEvent?.data) return

    const { transcriptId, conversationId } = originalEvent.data as {
      transcriptId?: string
      conversationId?: string
    }

    const errorMessage = String(
      (event.data as Record<string, unknown>)?.error ?? "Unknown error during transcript processing"
    )

    if (transcriptId) {
      await prisma.transcript.update({
        where: { id: transcriptId },
        data: { processingStatus: "FAILED" },
      })
    }

    if (conversationId) {
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "SYSTEM",
          content: "Transcript processing failed. Please try again.",
          toolCalls: {
            type: "error",
            message: errorMessage,
          },
        },
      })
    }
  }
)

export const transcriptProcessingFunction = inngest.createFunction(
  {
    id: "transcript-processing",
    retries: 3,
    concurrency: [
      {
        limit: 1,
        scope: "fn",
        key: "event.data.projectId",
      },
    ],
    triggers: [{ event: EVENTS.TRANSCRIPT_UPLOADED }],
  },
  async ({ event, step }) => {
    const { projectId, transcriptId, conversationId, userId } = event.data as {
      projectId: string
      transcriptId: string
      conversationId: string
      userId: string
    }

    // Step 1: Load transcript content and update status to PROCESSING
    const transcriptContent = await step.run("load-transcript", async () => {
      const transcript = await prisma.transcript.findUnique({
        where: { id: transcriptId },
        select: { rawContent: true, title: true },
      })

      if (!transcript?.rawContent) {
        throw new Error(`Transcript ${transcriptId} not found or has no content`)
      }

      // Add processing status message to conversation
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "ASSISTANT",
          content: "Analyzing transcript and extracting structured items...",
        },
      })

      // Update status to PROCESSING last — if this fails, Inngest retries
      // cleanly without leaving a stuck PROCESSING state
      await prisma.transcript.update({
        where: { id: transcriptId },
        data: { processingStatus: "PROCESSING" },
      })

      return transcript.rawContent
    })

    // Step 2: Run AI extraction via agent harness
    const extractionResult = await step.run("extract-items", async () => {
      const result = await executeTask(
        transcriptProcessingTask,
        {
          userMessage: transcriptContent,
          entityId: transcriptId,
        },
        projectId,
        userId
      )

      return {
        output: result.output,
        toolResults: result.toolResults,
        tokenUsage: result.tokenUsage,
        cost: result.cost,
        sessionLogId: result.sessionLogId,
        iterations: result.iterations,
      }
    })

    // Step 3: Update transcript status and link session log
    await step.run("update-status", async () => {
      await prisma.transcript.update({
        where: { id: transcriptId },
        data: {
          processingStatus: "COMPLETE",
          sessionLogId: extractionResult.sessionLogId,
        },
      })
    })

    // Step 4: Save extraction results to conversation as structured ChatMessage
    const savedResults = await step.run("save-to-conversation", async () => {
      // Count items by type
      const itemCounts = {
        questions: 0,
        decisions: 0,
        requirements: 0,
        risks: 0,
        duplicates: 0,
      }

      // Build grouped extraction results for the ExtractionCards component
      const groups: Array<{
        type: string
        items: Array<{
          id?: string
          displayId?: string
          text: string
          duplicate?: boolean
          existingDisplayId?: string
        }>
      }> = []

      const questionItems: typeof groups[0]["items"] = []
      const decisionItems: typeof groups[0]["items"] = []
      const requirementItems: typeof groups[0]["items"] = []
      const riskItems: typeof groups[0]["items"] = []

      for (const toolResult of extractionResult.toolResults) {
        if (toolResult.isError) continue
        const result = toolResult.result as Record<string, unknown>

        switch (toolResult.toolName) {
          case "create_question": {
            if (result.duplicate) {
              itemCounts.duplicates++
              questionItems.push({
                text: String((result as Record<string, unknown>).existingText ?? ""),
                duplicate: true,
                existingDisplayId: String((result as Record<string, unknown>).existingDisplayId ?? ""),
              })
            } else {
              itemCounts.questions++
              const q = result.question as Record<string, unknown>
              questionItems.push({
                id: String(q.id ?? ""),
                displayId: String(q.displayId ?? ""),
                text: String(q.questionText ?? ""),
              })
            }
            break
          }
          case "create_decision": {
            itemCounts.decisions++
            const d = result.decision as Record<string, unknown>
            decisionItems.push({
              id: String(d.id ?? ""),
              displayId: String(d.displayId ?? ""),
              text: String(d.title ?? ""),
            })
            break
          }
          case "create_requirement": {
            itemCounts.requirements++
            const r = result.requirement as Record<string, unknown>
            requirementItems.push({
              id: String(r.id ?? ""),
              displayId: String(r.displayId ?? ""),
              text: String(r.description ?? ""),
            })
            break
          }
          case "create_risk": {
            itemCounts.risks++
            const risk = result.risk as Record<string, unknown>
            riskItems.push({
              id: String(risk.id ?? ""),
              displayId: String(risk.displayId ?? ""),
              text: String(risk.description ?? ""),
            })
            break
          }
        }
      }

      if (questionItems.length > 0) groups.push({ type: "question", items: questionItems })
      if (decisionItems.length > 0) groups.push({ type: "decision", items: decisionItems })
      if (requirementItems.length > 0) groups.push({ type: "requirement", items: requirementItems })
      if (riskItems.length > 0) groups.push({ type: "risk", items: riskItems })

      // Build summary text
      const parts: string[] = ["Extraction complete."]
      if (itemCounts.questions > 0) parts.push(`${itemCounts.questions} questions`)
      if (itemCounts.decisions > 0) parts.push(`${itemCounts.decisions} decisions`)
      if (itemCounts.requirements > 0) parts.push(`${itemCounts.requirements} requirements`)
      if (itemCounts.risks > 0) parts.push(`${itemCounts.risks} risks`)
      if (itemCounts.duplicates > 0) parts.push(`${itemCounts.duplicates} duplicates detected`)
      const summaryText = parts.join(" | ")

      // Save extraction results as a ChatMessage with structured metadata in toolCalls JSON
      // The ExtractionCards component reads toolCalls.type === "extraction_results"
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "ASSISTANT",
          content: summaryText,
          toolCalls: {
            type: "extraction_results",
            groups,
            itemCounts,
          },
          inputTokens: extractionResult.tokenUsage.input,
          outputTokens: extractionResult.tokenUsage.output,
          cost: extractionResult.cost,
        },
      })

      // Also save the AI's text summary if available
      if (extractionResult.output) {
        await prisma.chatMessage.create({
          data: {
            conversationId,
            role: "ASSISTANT",
            content: extractionResult.output,
          },
        })
      }

      return { itemCounts, groupCount: groups.length }
    })

    // Step 5: Emit downstream events for newly created entities
    await step.sendEvent("trigger-downstream", [
      {
        name: EVENTS.ENTITY_CONTENT_CHANGED,
        data: {
          projectId,
          entityType: "transcript",
          entityId: transcriptId,
          changeType: "processed",
        },
      },
      {
        name: EVENTS.EMBEDDING_BATCH_REQUESTED,
        data: {
          projectId,
          sourceEntityType: "transcript",
          sourceEntityId: transcriptId,
        },
      },
      {
        name: EVENTS.PROJECT_STATE_CHANGED,
        data: { projectId },
      },
    ])

    return {
      success: true,
      transcriptId,
      conversationId,
      ...savedResults,
    }
  }
)
