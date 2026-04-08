/**
 * create_enrichment_suggestion Tool Implementation
 *
 * Used by the agent harness during enrichment sessions to propose
 * story improvements. Suggestions are stored in ChatMessage.toolCalls
 * JSON field -- NOT applied to the Story until the user accepts them.
 *
 * Follows the same pattern as create-story-draft.ts:
 * - T-03-08: Stored in toolCalls JSON, not Story table until accepted
 * - T-02-16: sanitizeToolInput called by tool-executor before dispatch
 */

import { createId } from "@paralleldrive/cuid2"
import type { ClaudeToolDefinition } from "../types"

export type EnrichmentCategory =
  | "ACCEPTANCE_CRITERIA"
  | "DESCRIPTION"
  | "COMPONENTS"
  | "TECHNICAL_NOTES"
  | "STORY_POINTS"
  | "PRIORITY"

export interface EnrichmentSuggestion {
  suggestionId: string
  category: EnrichmentCategory
  currentValue: string | null
  suggestedValue: string
  reasoning: string
}

export const createEnrichmentSuggestionToolDefinition: ClaudeToolDefinition = {
  name: "create_enrichment_suggestion",
  description:
    "Propose an improvement to a specific aspect of the story. The user will see this as a reviewable card they can accept or reject.",
  input_schema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: [
          "ACCEPTANCE_CRITERIA",
          "DESCRIPTION",
          "COMPONENTS",
          "TECHNICAL_NOTES",
          "STORY_POINTS",
          "PRIORITY",
        ],
        description: "Which aspect of the story to improve",
      },
      currentValue: {
        type: "string",
        description:
          "The current value of this field (or 'empty' if not set)",
      },
      suggestedValue: {
        type: "string",
        description: "The proposed new value",
      },
      reasoning: {
        type: "string",
        description: "Why this improvement is recommended",
      },
    },
    required: ["category", "suggestedValue", "reasoning"],
  },
}

export async function executeCreateEnrichmentSuggestion(
  input: Record<string, unknown>,
  _projectId: string
): Promise<{ success: true; suggestionId: string; suggestion: EnrichmentSuggestion }> {
  const suggestionId = createId()

  const suggestion: EnrichmentSuggestion = {
    suggestionId,
    category: validateCategory(input.category),
    currentValue: input.currentValue ? String(input.currentValue) : null,
    suggestedValue: String(input.suggestedValue ?? ""),
    reasoning: String(input.reasoning ?? ""),
  }

  return { success: true, suggestionId, suggestion }
}

const VALID_CATEGORIES: EnrichmentCategory[] = [
  "ACCEPTANCE_CRITERIA",
  "DESCRIPTION",
  "COMPONENTS",
  "TECHNICAL_NOTES",
  "STORY_POINTS",
  "PRIORITY",
]

function validateCategory(value: unknown): EnrichmentCategory {
  const str = String(value ?? "DESCRIPTION")
  return VALID_CATEGORIES.includes(str as EnrichmentCategory)
    ? (str as EnrichmentCategory)
    : "DESCRIPTION"
}
