/**
 * Document Template Registry
 *
 * Central registry of all available document templates.
 * Used by server actions and Inngest functions to resolve template definitions.
 */

export type { DocumentTemplate, TemplateSection } from "./types"

import type { DocumentTemplate } from "./types"
import { DISCOVERY_REPORT_TEMPLATE } from "./discovery-report"
import { REQUIREMENTS_DOC_TEMPLATE } from "./requirements-doc"
import { SPRINT_SUMMARY_TEMPLATE } from "./sprint-summary"
import { EXECUTIVE_BRIEF_TEMPLATE } from "./executive-brief"

export {
  DISCOVERY_REPORT_TEMPLATE,
  REQUIREMENTS_DOC_TEMPLATE,
  SPRINT_SUMMARY_TEMPLATE,
  EXECUTIVE_BRIEF_TEMPLATE,
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  DISCOVERY_REPORT_TEMPLATE,
  REQUIREMENTS_DOC_TEMPLATE,
  SPRINT_SUMMARY_TEMPLATE,
  EXECUTIVE_BRIEF_TEMPLATE,
]

export function getTemplate(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id)
}
