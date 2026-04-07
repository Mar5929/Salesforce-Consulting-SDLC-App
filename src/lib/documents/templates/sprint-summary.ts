/**
 * Sprint Summary Template
 *
 * Sprint progress report with velocity, completed stories, and blockers.
 */

import type { DocumentTemplate } from "./types"

export const SPRINT_SUMMARY_TEMPLATE: DocumentTemplate = {
  id: "sprint-summary",
  documentType: "STATUS_REPORT",
  name: "Sprint Summary",
  description:
    "Sprint progress report with velocity, completed stories, and blockers.",
  icon: "FileCheck",
  supportedFormats: ["DOCX", "PDF"],
  sections: [
    {
      id: "sprint-overview",
      label: "Sprint Overview",
      description: "Sprint dates, capacity, and completion stats",
      contextQuery: "sprint-overview",
      required: true,
    },
    {
      id: "completed-stories",
      label: "Completed Stories",
      description: "Stories completed in the sprint",
      contextQuery: "sprint-completed",
      required: true,
    },
    {
      id: "blockers",
      label: "Blockers and Risks",
      description: "Current blockers and emerging risks",
      contextQuery: "blockers-risks",
      required: false,
    },
  ],
}
