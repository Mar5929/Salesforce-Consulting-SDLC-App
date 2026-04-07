/**
 * Document Generation Inngest Step Function
 *
 * Multi-step function triggered by DOCUMENT_GENERATION_REQUESTED event.
 * Orchestrates: AI content generation -> format rendering -> S3 upload -> DB record.
 *
 * Each step.run() is a Vercel-safe checkpoint.
 *
 * Threat mitigations:
 * - T-05-09: Role check happens in server action before sending event
 * - T-05-10: Presigned URLs generated with 5-min TTL in getDocumentDownloadUrl action
 * - T-05-11: All content from AI + project database, no client-supplied content
 */

import { inngest } from "../client"
import { EVENTS } from "../events"
import { prisma } from "@/lib/db"
import { executeDocumentContentTask } from "@/lib/agent-harness/tasks/document-content"
import { renderDocx } from "@/lib/documents/renderers/docx-renderer"
import { renderPptx } from "@/lib/documents/renderers/pptx-renderer"
import { renderPdf } from "@/lib/documents/renderers/pdf-renderer"
import { BRANDING_CONFIG } from "@/lib/documents/branding"
import { uploadDocument } from "@/lib/documents/s3-storage"
import { getTemplate } from "@/lib/documents/templates"
import type { DocumentFormat } from "@/generated/prisma"

export const generateDocumentFunction = inngest.createFunction(
  {
    id: "document-generation",
    retries: 2,
    concurrency: [
      {
        limit: 2,
        scope: "fn",
        key: "event.data.projectId",
      },
    ],
    triggers: [{ event: EVENTS.DOCUMENT_GENERATION_REQUESTED }],
  },
  async ({ event, step }) => {
    const { projectId, templateId, sectionIds, format, memberId, userId } =
      event.data as {
        projectId: string
        templateId: string
        sectionIds: string[]
        format: string
        memberId: string
        userId: string
      }

    // Step 1: Generate AI content from project knowledge base
    const content = await step.run("generate-content", async () => {
      return executeDocumentContentTask(projectId, templateId, sectionIds, userId)
    })

    // Step 2: Render to target format with firm branding
    const bufferData = await step.run("render-document", async () => {
      const branding = BRANDING_CONFIG
      let buffer: Buffer
      switch (format) {
        case "DOCX":
          buffer = await renderDocx(content, branding)
          break
        case "PPTX":
          buffer = await renderPptx(content, branding)
          break
        case "PDF":
          buffer = await renderPdf(content, branding)
          break
        default:
          throw new Error(`Unsupported format: ${format}`)
      }
      // Serialize buffer for step persistence
      return buffer.toString("base64")
    })

    // Step 3: Upload rendered document to S3
    const s3Key = await step.run("upload-to-s3", async () => {
      const buffer = Buffer.from(bufferData, "base64")
      return uploadDocument(projectId, templateId, format, buffer)
    })

    // Step 4: Create database record
    const doc = await step.run("create-record", async () => {
      const template = getTemplate(templateId)
      return prisma.generatedDocument.create({
        data: {
          projectId,
          title: content.title,
          documentType: template?.documentType ?? "OTHER",
          format: format as DocumentFormat,
          s3Key,
          templateUsed: templateId,
          generatedById: memberId,
        },
      })
    })

    // Step 5: Send completion notification
    await step.sendEvent("notify-complete", {
      name: EVENTS.NOTIFICATION_SEND,
      data: {
        type: "DOCUMENT_GENERATED",
        projectId,
        recipientId: memberId,
        payload: {
          documentId: doc.id,
          title: content.title,
          templateId,
        },
      },
    })

    return { documentId: doc.id, s3Key }
  }
)
