/**
 * Document Template Type Definitions
 *
 * Shared types for document template definitions.
 * Each template declares its sections and supported formats.
 */

import type { DocumentType, DocumentFormat } from "@/generated/prisma"

/**
 * A single section within a document template.
 * contextQuery describes what project data to assemble for AI content generation.
 */
export interface TemplateSection {
  id: string
  label: string
  description: string
  contextQuery: string
  required: boolean
}

/**
 * A document template definition.
 * Declares structure, supported formats, and section specifications
 * for AI content generation.
 */
export interface DocumentTemplate {
  id: string
  documentType: DocumentType
  name: string
  description: string
  icon: string
  supportedFormats: DocumentFormat[]
  sections: TemplateSection[]
}
