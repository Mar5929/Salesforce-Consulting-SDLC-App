"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"

// ============================================================================
// Schemas
// ============================================================================

const uploadTranscriptSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1),
  title: z.string().optional(),
  sourceType: z.enum(["UPLOAD", "PASTE"]),
})

const getTranscriptsSchema = z.object({
  projectId: z.string().min(1),
})

const getTranscriptSchema = z.object({
  transcriptId: z.string().min(1),
  projectId: z.string().min(1),
})

const extractionItemActionSchema = z.object({
  projectId: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
})

// ============================================================================
// Constants
// ============================================================================

/** Maximum transcript length: ~10K words = ~50K chars (T-02-17) */
const MAX_CONTENT_LENGTH = 50_000

// ============================================================================
// Actions
// ============================================================================

/**
 * Upload or paste a transcript for AI processing.
 *
 * 1. Validates content length (T-02-17: 10K word limit)
 * 2. Creates Transcript record with status PENDING
 * 3. Creates a TRANSCRIPT_SESSION conversation for processing
 * 4. Sends Inngest TRANSCRIPT_UPLOADED event
 * 5. Returns { transcriptId, conversationId } for UI navigation
 */
export const uploadTranscript = actionClient
  .schema(uploadTranscriptSchema)
  .action(
    async ({
      parsedInput: { projectId, content, title, sourceType },
    }) => {
      const member = await getCurrentMember(projectId)

      // Validate content length (T-02-17)
      if (content.length > MAX_CONTENT_LENGTH) {
        throw new Error(
          "This transcript exceeds the 10,000 word limit. Please split it into smaller sections."
        )
      }

      // Estimate word count for additional validation
      const wordCount = content.trim().split(/\s+/).length
      if (wordCount > 10_000) {
        throw new Error(
          "This transcript exceeds the 10,000 word limit. Please split it into smaller sections."
        )
      }

      // Create transcript record
      const transcript = await prisma.transcript.create({
        data: {
          projectId,
          uploadedById: member.id,
          title: title ?? `Transcript ${new Date().toLocaleDateString()}`,
          rawContent: content,
          processingStatus: "PENDING",
        },
      })

      // Create a TRANSCRIPT_SESSION conversation for this processing
      const conversation = await prisma.conversation.create({
        data: {
          projectId,
          conversationType: "TRANSCRIPT_SESSION",
          title: `Processing: ${transcript.title}`,
          createdById: member.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      })

      // Add initial system message
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: "SYSTEM",
          content: `Processing transcript: "${transcript.title}" (${wordCount.toLocaleString()} words). Extracting questions, decisions, requirements, and risks...`,
        },
      })

      // Link conversation back to transcript via FK
      await prisma.transcript.update({
        where: { id: transcript.id },
        data: { conversationId: conversation.id },
      })

      // Send Inngest event to trigger processing (T-02-20)
      await inngest.send({
        name: EVENTS.TRANSCRIPT_UPLOADED,
        data: {
          projectId,
          transcriptId: transcript.id,
          conversationId: conversation.id,
          userId: member.id,
        },
      })

      return {
        transcriptId: transcript.id,
        conversationId: conversation.id,
      }
    }
  )

/**
 * List transcripts for a project with status, date, and extracted item counts.
 */
export const getTranscripts = actionClient
  .schema(getTranscriptsSchema)
  .action(async ({ parsedInput: { projectId } }) => {
    await getCurrentMember(projectId)
    const scoped = scopedPrisma(projectId)

    const transcripts = await scoped.transcript.findMany({
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        title: true,
        processingStatus: true,
        uploadedAt: true,
        sessionLogId: true,
      },
    })

    return transcripts
  })

/**
 * Fetch a single transcript with its linked conversation and session log.
 */
export const getTranscript = actionClient
  .schema(getTranscriptSchema)
  .action(async ({ parsedInput: { transcriptId, projectId } }) => {
    await getCurrentMember(projectId)
    const scoped = scopedPrisma(projectId)

    const transcript = await scoped.transcript.findFirst({
      where: { id: transcriptId },
      include: {
        sessionLog: true,
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    })

    if (!transcript) {
      throw new Error("Transcript not found")
    }

    return {
      ...transcript,
      conversation: transcript.conversation,
    }
  })

/**
 * Accept an AI-extracted item. Items are already persisted by agent tools,
 * so accept is a no-op confirmation. Included for completeness and future
 * confirmed/unconfirmed tracking.
 */
export const acceptExtractionItem = actionClient
  .schema(extractionItemActionSchema)
  .action(async ({ parsedInput: { projectId, entityType, entityId } }) => {
    await getCurrentMember(projectId)
    // Items are already created in DB by agent tools. Accept = keep as-is.
    return { accepted: true, entityType, entityId }
  })

/**
 * Reject an AI-extracted item by deleting it from the database.
 * The item was auto-created by AI during transcript processing;
 * rejecting removes it before it enters the project workflow.
 */
export const rejectExtractionItem = actionClient
  .schema(extractionItemActionSchema)
  .action(async ({ parsedInput: { projectId, entityType, entityId } }) => {
    await getCurrentMember(projectId)

    switch (entityType.toLowerCase()) {
      case "question":
        await prisma.question.delete({ where: { id: entityId } })
        break
      case "decision":
        await prisma.decision.delete({ where: { id: entityId } })
        break
      case "risk":
        await prisma.risk.delete({ where: { id: entityId } })
        break
      default:
        throw new Error(`Unknown extraction entity type: ${entityType}`)
    }

    return { rejected: true, entityType, entityId }
  })
