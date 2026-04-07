"use server"

/**
 * Document Server Actions
 *
 * Operations for document generation, listing, and download URL generation.
 * Uses next-safe-action for Zod validation and auth middleware.
 *
 * Threat mitigations:
 * - T-05-09: Only PM/SA roles can request document generation
 * - T-05-10: Presigned URLs expire in 5 minutes, project membership verified
 * - T-05-11: All content generated server-side from AI + project database
 */

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { assertProjectNotArchived } from "@/lib/archive-guard"
import { getDownloadUrl } from "@/lib/documents/s3-storage"
import {
  DOCUMENT_TEMPLATES,
  getTemplate,
} from "@/lib/documents/templates"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const requestDocumentGenerationSchema = z.object({
  projectId: z.string(),
  templateId: z.string(),
  sectionIds: z.array(z.string()),
  format: z.enum(["DOCX", "PPTX", "PDF"]),
})

const getDocumentsSchema = z.object({
  projectId: z.string(),
  documentType: z
    .enum([
      "BRD",
      "SDD",
      "SOW",
      "STATUS_REPORT",
      "PRESENTATION",
      "TEST_SCRIPT",
      "DEPLOYMENT_RUNBOOK",
      "TRAINING_MATERIAL",
      "OTHER",
    ])
    .optional(),
})

const getDocumentDownloadUrlSchema = z.object({
  documentId: z.string(),
})

const getDocumentTemplatesSchema = z.object({
  projectId: z.string(),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

/**
 * Request document generation.
 * Validates template and format, verifies PM/SA role, sends Inngest event.
 */
export const requestDocumentGeneration = actionClient
  .schema(requestDocumentGenerationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, templateId, sectionIds, format } = parsedInput

    await assertProjectNotArchived(projectId)

    // Verify project membership and PM/SA role (T-05-09)
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        clerkUserId: ctx.userId,
        role: { in: ["SOLUTION_ARCHITECT", "PM"] },
      },
    })

    if (!member) {
      throw new Error(
        "Only PM or SA roles can request document generation"
      )
    }

    // Validate template exists
    const template = getTemplate(templateId)
    if (!template) {
      throw new Error(`Template "${templateId}" not found`)
    }

    // Validate format is supported by template
    if (!template.supportedFormats.includes(format)) {
      throw new Error(
        `Format "${format}" is not supported by template "${template.name}". Supported: ${template.supportedFormats.join(", ")}`
      )
    }

    // Validate section IDs exist in template
    const validSectionIds = template.sections.map((s) => s.id)
    const invalidSections = sectionIds.filter(
      (id) => !validSectionIds.includes(id)
    )
    if (invalidSections.length > 0) {
      throw new Error(
        `Invalid section IDs: ${invalidSections.join(", ")}`
      )
    }

    // Send Inngest event to start generation
    await inngest.send({
      name: EVENTS.DOCUMENT_GENERATION_REQUESTED,
      data: {
        projectId,
        templateId,
        sectionIds,
        format,
        memberId: member.id,
        userId: ctx.userId,
      },
    })

    return { success: true, message: "Document generation started" }
  })

/**
 * List generated documents for a project.
 * Optionally filter by document type.
 */
export const getDocuments = actionClient
  .schema(getDocumentsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, documentType } = parsedInput

    // Verify project membership
    const member = await prisma.projectMember.findFirst({
      where: { projectId, clerkUserId: ctx.userId },
    })
    if (!member) {
      throw new Error("Not a member of this project")
    }

    const documents = await prisma.generatedDocument.findMany({
      where: {
        projectId,
        ...(documentType ? { documentType } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        generatedBy: {
          select: { displayName: true },
        },
      },
    })

    // Compute version numbers: count of docs with same documentType, ordered by createdAt
    const versionMap = new Map<string, number>()
    const allDocs = await prisma.generatedDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: { id: true, documentType: true },
    })

    const typeCounters = new Map<string, number>()
    for (const d of allDocs) {
      const count = (typeCounters.get(d.documentType) ?? 0) + 1
      typeCounters.set(d.documentType, count)
      versionMap.set(d.id, count)
    }

    return documents.map((doc) => ({
      ...doc,
      version: versionMap.get(doc.id) ?? 1,
    }))
  })

/**
 * Get a presigned download URL for a document.
 * Verifies project membership before generating URL (T-05-10).
 */
export const getDocumentDownloadUrl = actionClient
  .schema(getDocumentDownloadUrlSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { documentId } = parsedInput

    // Look up document
    const doc = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      select: { s3Key: true, projectId: true },
    })
    if (!doc) {
      throw new Error("Document not found")
    }

    // Verify project membership (T-05-10)
    const member = await prisma.projectMember.findFirst({
      where: { projectId: doc.projectId, clerkUserId: ctx.userId },
    })
    if (!member) {
      throw new Error("Not a member of this project")
    }

    // Generate presigned URL with 5-minute TTL
    const url = await getDownloadUrl(doc.s3Key, 300)
    return { url }
  })

/**
 * Get available document templates.
 * Returns all templates from the registry.
 */
export const getDocumentTemplates = actionClient
  .schema(getDocumentTemplatesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { projectId } = parsedInput

    // Verify project membership
    const member = await prisma.projectMember.findFirst({
      where: { projectId, clerkUserId: ctx.userId },
    })
    if (!member) {
      throw new Error("Not a member of this project")
    }

    return DOCUMENT_TEMPLATES
  })
