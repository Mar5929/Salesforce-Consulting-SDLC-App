/**
 * Discovery Report Template
 *
 * Generates a comprehensive discovery document from the project
 * knowledge base: questions, decisions, requirements, and risks.
 */

import type { DocumentTemplate } from "./types"

export const DISCOVERY_REPORT_TEMPLATE: DocumentTemplate = {
  id: "discovery-report",
  documentType: "BRD",
  name: "Discovery Report",
  description:
    "Generate a comprehensive discovery document from project knowledge base, questions, decisions, and requirements.",
  icon: "FileText",
  supportedFormats: ["DOCX", "PDF"],
  sections: [
    {
      id: "executive-summary",
      label: "Executive Summary",
      description: "High-level project overview and key findings",
      contextQuery: "project-overview",
      required: true,
    },
    {
      id: "business-process-overview",
      label: "Business Process Overview",
      description: "Documented business processes and workflows",
      contextQuery: "business-processes",
      required: true,
    },
    {
      id: "requirements-summary",
      label: "Requirements Summary",
      description: "Captured requirements organized by epic",
      contextQuery: "requirements-by-epic",
      required: true,
    },
    {
      id: "questions-decisions",
      label: "Questions and Decisions",
      description: "Outstanding questions and recorded decisions",
      contextQuery: "questions-decisions",
      required: false,
    },
    {
      id: "risk-register",
      label: "Risk Register",
      description: "Identified risks with severity and mitigation",
      contextQuery: "risks",
      required: false,
    },
  ],
}
