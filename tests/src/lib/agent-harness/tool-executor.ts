/**
 * Tool Executor
 *
 * Central dispatch for all AI tool calls. This is the ONLY place tool dispatch
 * happens -- engine.ts calls executeToolCall(), never individual tools directly.
 *
 * All tool inputs are sanitized via DOMPurify before processing.
 * All DB operations use scopedPrisma(projectId) for project isolation.
 *
 * Threat mitigations:
 * - T-02-01: sanitizeToolInput() on ALL inputs before dispatch
 * - T-02-05: scopedPrisma(projectId) for cross-project isolation
 */

import { prisma } from "@/lib/db"
import { sanitizeToolInput } from "./sanitize"
import { executeCreateQuestion } from "./tools/create-question"
import { executeAnswerQuestion } from "./tools/answer-question"
import { executeCreateDecision } from "./tools/create-decision"
import { executeCreateRequirement } from "./tools/create-requirement"
import { executeCreateRisk } from "./tools/create-risk"
import { executeFlagConflict } from "./tools/flag-conflict"
import { executeCreateStoryDraft } from "./tools/create-story-draft"

/**
 * Execute a tool call from the AI agent.
 *
 * @param toolName - Name of the tool to execute (from Claude's tool_use block)
 * @param toolInput - Raw input from Claude (will be sanitized)
 * @param projectId - Project scope for DB operations
 * @returns Tool result as a JSON-serializable object
 * @throws Error if tool is not recognized
 */
export async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  projectId: string
): Promise<unknown> {
  // Sanitize all string inputs before dispatch (T-02-01)
  const sanitizedInput = sanitizeToolInput(toolInput)

  // Dispatch to tool implementation
  // Each tool receives sanitized input and projectId for project isolation (T-02-05)
  switch (toolName) {
    // Question management tools (Plan 04)
    case "create_question":
      return executeCreateQuestion(sanitizedInput, projectId)

    case "answer_question":
      return executeAnswerQuestion(sanitizedInput, projectId)

    case "update_question_status":
      // Status transitions are handled via server actions (questions.ts)
      // This tool updates question status from the AI agent context
      return executeUpdateQuestionStatus(sanitizedInput, projectId)

    // Decision management tools (Plan 05)
    case "create_decision":
      return executeCreateDecision(sanitizedInput, projectId)

    // Requirement management tools (Plan 05)
    case "create_requirement":
      return executeCreateRequirement(sanitizedInput, projectId)

    // Risk management tools (Plan 05)
    case "create_risk":
      return executeCreateRisk(sanitizedInput, projectId)

    // Conflict detection tools (Plan 04)
    case "flag_conflict":
      return executeFlagConflict(sanitizedInput, projectId)

    // Story generation tools (Phase 03 Plan 03)
    case "create_story_draft":
      return executeCreateStoryDraft(sanitizedInput, projectId)

    default:
      throw new Error(
        `Unknown tool: ${toolName}. Available tools: create_question, answer_question, update_question_status, create_decision, create_requirement, create_risk, flag_conflict, create_story_draft`
      )
  }
}

/**
 * Update a question's status from the AI agent context.
 * Supports transitions: OPEN -> ANSWERED, OPEN -> PARKED, ANSWERED -> OPEN
 */
async function executeUpdateQuestionStatus(
  input: Record<string, unknown>,
  projectId: string
): Promise<{ success: boolean; questionId: string; newStatus: string }> {
  const questionId = String(input.questionId ?? "")
  const newStatus = String(input.status ?? "")

  if (!questionId) throw new Error("questionId is required")
  if (!newStatus) throw new Error("status is required")

  const validStatuses = ["OPEN", "ANSWERED", "PARKED"]
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}. Valid: ${validStatuses.join(", ")}`)
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { projectId: true, status: true },
  })

  if (!question || question.projectId !== projectId) {
    throw new Error(`Question ${questionId} not found in project ${projectId}`)
  }

  await prisma.question.update({
    where: { id: questionId },
    data: { status: newStatus as "OPEN" | "ANSWERED" | "PARKED" },
  })

  return { success: true, questionId, newStatus }
}
