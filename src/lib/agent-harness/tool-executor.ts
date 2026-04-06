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

import { sanitizeToolInput } from "./sanitize"

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
  // Note: scopedPrisma(projectId) will be used inside each tool implementation
  // to ensure project-level data isolation (T-02-05)
  switch (toolName) {
    // Question management tools (Plan 04)
    case "create_question":
      throw new ToolNotImplementedError(toolName)

    case "answer_question":
      throw new ToolNotImplementedError(toolName)

    case "update_question_status":
      throw new ToolNotImplementedError(toolName)

    // Decision management tools (Plan 04)
    case "create_decision":
      throw new ToolNotImplementedError(toolName)

    // Requirement management tools (Plan 04)
    case "create_requirement":
      throw new ToolNotImplementedError(toolName)

    // Risk management tools (Plan 04)
    case "create_risk":
      throw new ToolNotImplementedError(toolName)

    // Conflict detection tools (Plan 04)
    case "flag_conflict":
      throw new ToolNotImplementedError(toolName)

    default:
      throw new Error(
        `Unknown tool: ${toolName}. Available tools: create_question, answer_question, update_question_status, create_decision, create_requirement, create_risk, flag_conflict`
      )
  }

  // This ensures TypeScript knows sanitizedInput and projectId are used
  // Once tools are implemented, they'll receive these as parameters
  void sanitizedInput
  void projectId
}

/**
 * Error thrown when a tool is registered but not yet implemented.
 * Implementations will be added in Plans 04-06.
 */
export class ToolNotImplementedError extends Error {
  constructor(toolName: string) {
    super(`Tool not yet implemented: ${toolName}. Implementation coming in Plans 04-06.`)
    this.name = "ToolNotImplementedError"
  }
}
