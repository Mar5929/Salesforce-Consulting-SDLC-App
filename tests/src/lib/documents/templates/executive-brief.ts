/**
 * Executive Brief Template
 *
 * Branded executive summary presentation for stakeholders.
 */

import type { DocumentTemplate } from "./types"

export const EXECUTIVE_BRIEF_TEMPLATE: DocumentTemplate = {
  id: "executive-brief",
  documentType: "PRESENTATION",
  name: "Executive Brief",
  description:
    "Generate a branded executive summary presentation for stakeholders.",
  icon: "Presentation",
  supportedFormats: ["PPTX", "PDF"],
  sections: [
    {
      id: "overview",
      label: "Project Overview",
      description: "Project status and key metrics",
      contextQuery: "project-overview",
      required: true,
    },
    {
      id: "progress",
      label: "Progress Update",
      description: "Work completed and upcoming milestones",
      contextQuery: "progress-update",
      required: true,
    },
    {
      id: "risks-actions",
      label: "Risks and Actions",
      description: "Key risks and required actions",
      contextQuery: "risks-actions",
      required: false,
    },
  ],
}
