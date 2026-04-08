import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryDocumentsTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_documents: tool({
      description: "Search for generated documents. Returns summary fields. Use get_document for full details.",
      inputSchema: z.object({
        documentType: z.enum(["BRD", "SDD", "SOW", "STATUS_REPORT", "PRESENTATION", "TEST_SCRIPT", "DEPLOYMENT_RUNBOOK", "TRAINING_MATERIAL", "OTHER"]).optional(),
        format: z.enum(["DOCX", "PPTX", "PDF"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ documentType, format, limit }) => {
        try {
          const documents = await scoped.generatedDocument.findMany({
            where: {
              ...(documentType && { documentType }),
              ...(format && { format }),
            },
            select: {
              id: true,
              title: true,
              documentType: true,
              format: true,
              createdAt: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: documents.length, documents }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_document: tool({
      description: "Get details of a single generated document by ID. Note: s3Key is returned but not a presigned URL — file access requires a separate download step.",
      inputSchema: z.object({
        documentId: z.string().describe("The generated document ID"),
      }),
      execute: async ({ documentId }) => {
        try {
          const document = await scoped.generatedDocument.findUnique({
            where: { id: documentId },
            select: {
              id: true,
              title: true,
              s3Key: true,
              documentType: true,
              format: true,
              createdAt: true,
            },
          })
          if (!document) return { success: false, error: "Document not found" }
          return { success: true, document }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
