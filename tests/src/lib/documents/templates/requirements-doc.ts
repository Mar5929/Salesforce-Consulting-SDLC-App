/**
 * Requirements Document Template
 *
 * Formal requirements specification organized by epic and feature hierarchy.
 */

import type { DocumentTemplate } from "./types"

export const REQUIREMENTS_DOC_TEMPLATE: DocumentTemplate = {
  id: "requirements-doc",
  documentType: "SDD",
  name: "Requirements Document",
  description:
    "Formal requirements specification organized by epic and feature hierarchy.",
  icon: "FileSpreadsheet",
  supportedFormats: ["DOCX", "PDF"],
  sections: [
    {
      id: "scope",
      label: "Scope Statement",
      description: "Project scope and boundaries",
      contextQuery: "project-scope",
      required: true,
    },
    {
      id: "functional-reqs",
      label: "Functional Requirements",
      description: "User stories with acceptance criteria by epic",
      contextQuery: "stories-by-epic",
      required: true,
    },
    {
      id: "components",
      label: "Salesforce Components",
      description: "Impacted Salesforce components by story",
      contextQuery: "story-components",
      required: true,
    },
    {
      id: "dependencies",
      label: "Dependencies and Constraints",
      description: "Cross-story dependencies and technical constraints",
      contextQuery: "dependencies",
      required: false,
    },
  ],
}
