/**
 * create_story_draft Tool Implementation
 *
 * Used by the agent harness during story generation sessions to propose
 * story drafts. Drafts are stored in ChatMessage.toolCalls JSON field
 * (same pattern as transcript extraction) -- NOT persisted to Story table
 * until the user explicitly accepts them.
 *
 * Threat mitigation:
 * - T-03-08: Drafts stored in toolCalls JSON, not Story table. No DB mutation until user accepts.
 * - T-02-16: sanitizeToolInput called by tool-executor before dispatch.
 */

import { createId } from "@paralleldrive/cuid2"
import type { ClaudeToolDefinition } from "../types"

/**
 * Shape of a story draft as stored in ChatMessage.toolCalls.
 * This is what the UI renders in the accept/edit/reject cards.
 */
export interface StoryDraft {
  draftId: string
  title: string
  persona?: string
  description: string
  acceptanceCriteria: string
  storyPoints?: number
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  components?: Array<{
    componentName: string
    impactType: "CREATE" | "MODIFY" | "DELETE"
  }>
  reasoning: string
}

/**
 * Claude tool definition for create_story_draft.
 * This is included in the task definition's tools array.
 */
export const createStoryDraftToolDefinition: ClaudeToolDefinition = {
  name: "create_story_draft",
  description:
    "Propose a new user story draft for the user to review. Include title, persona, description, acceptance criteria, estimated story points, priority, and impacted Salesforce components.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Story title",
      },
      persona: {
        type: "string",
        description: "User persona, e.g. 'Sales Manager'",
      },
      description: {
        type: "string",
        description: "Story description in user story format",
      },
      acceptanceCriteria: {
        type: "string",
        description: "Acceptance criteria in Given/When/Then format",
      },
      storyPoints: {
        type: "number",
        description: "Fibonacci estimate: 1,2,3,5,8,13",
      },
      priority: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        description: "Priority level (defaults to MEDIUM)",
      },
      components: {
        type: "array",
        description: "Impacted Salesforce components",
        items: {
          type: "object",
          properties: {
            componentName: {
              type: "string",
              description: "Salesforce component API name",
            },
            impactType: {
              type: "string",
              enum: ["CREATE", "MODIFY", "DELETE"],
              description: "Type of impact on the component",
            },
          },
          required: ["componentName", "impactType"],
        },
      },
      reasoning: {
        type: "string",
        description: "Why this story is needed based on the requirements/context",
      },
    },
    required: ["title", "description", "acceptanceCriteria", "reasoning"],
  },
}

/**
 * Execute the create_story_draft tool.
 *
 * Does NOT persist to the Story table. Returns the draft with a generated
 * draftId so the UI can track accept/reject state. The draft data is
 * stored in ChatMessage.toolCalls JSON by the execution engine.
 *
 * @param input - Sanitized tool input from the AI
 * @param _projectId - Project scope (unused -- no DB mutation)
 * @returns Draft with generated draftId
 */
export async function executeCreateStoryDraft(
  input: Record<string, unknown>,
  _projectId: string
): Promise<{ success: true; draftId: string; draft: StoryDraft }> {
  const draftId = createId()

  const draft: StoryDraft = {
    draftId,
    title: String(input.title ?? ""),
    persona: input.persona ? String(input.persona) : undefined,
    description: String(input.description ?? ""),
    acceptanceCriteria: String(input.acceptanceCriteria ?? ""),
    storyPoints: input.storyPoints ? Number(input.storyPoints) : undefined,
    priority: validatePriority(input.priority),
    components: parseComponents(input.components),
    reasoning: String(input.reasoning ?? ""),
  }

  return { success: true, draftId, draft }
}

function validatePriority(
  value: unknown
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const valid = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
  const str = String(value ?? "MEDIUM")
  return valid.includes(str)
    ? (str as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
    : "MEDIUM"
}

function parseComponents(
  value: unknown
): StoryDraft["components"] {
  if (!Array.isArray(value)) return undefined
  const validImpacts = ["CREATE", "MODIFY", "DELETE"]

  return value
    .filter(
      (c): c is Record<string, unknown> =>
        typeof c === "object" && c !== null && "componentName" in c
    )
    .map((c) => ({
      componentName: String(c.componentName),
      impactType: validImpacts.includes(String(c.impactType))
        ? (String(c.impactType) as "CREATE" | "MODIFY" | "DELETE")
        : "MODIFY",
    }))
}
