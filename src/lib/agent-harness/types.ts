/**
 * Agent Harness Type Definitions
 *
 * Core types for the three-layer AI agent architecture:
 * Layer 1: Task Definitions (defined per-feature in downstream plans)
 * Layer 2: Execution Engine (engine.ts)
 * Layer 3: Context Assembly (per-feature context loaders)
 *
 * Based on tech spec Section 3.2 (D-31)
 */

/**
 * All task types the agent harness can execute.
 * Maps to SessionLogTaskType enum in Prisma schema.
 */
export type TaskType =
  | "TRANSCRIPT_PROCESSING"
  | "QUESTION_ANSWERING"
  | "STORY_GENERATION"
  | "STORY_ENRICHMENT"
  | "BRIEFING_GENERATION"
  | "STATUS_REPORT_GENERATION"
  | "DOCUMENT_GENERATION"
  | "SPRINT_ANALYSIS"
  | "CONTEXT_PACKAGE_ASSEMBLY"
  | "ORG_QUERY"
  | "DASHBOARD_SYNTHESIS"

/**
 * Execution mode determines how the engine processes AI responses.
 * SINGLE_TURN: One API call, return result directly.
 * AGENT_LOOP: Iterate tool calls until no more tool_use blocks or maxIterations.
 */
export type ExecutionMode = "SINGLE_TURN" | "AGENT_LOOP"

/**
 * Ambiguity handling mode per D-34.
 * INTERACTIVE: Ask user inline (chat context)
 * TASK_SESSION: Best-guess + flag for review (transcript processing)
 * BACKGROUND: Flag only, never ask (scheduled jobs)
 */
export type AmbiguityMode = "INTERACTIVE" | "TASK_SESSION" | "BACKGROUND"

/**
 * Tool definition matching the Anthropic API format.
 */
export interface ClaudeToolDefinition {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, unknown>
    required?: string[]
  }
}

/**
 * Input provided to executeTask() for each invocation.
 */
export interface TaskInput {
  /** The user's message or input text */
  userMessage: string
  /** ID of the entity being processed (transcript, question, etc.) */
  entityId?: string
  /** Additional metadata for context assembly */
  metadata?: Record<string, unknown>
}

/**
 * Assembled project context from Layer 3 context loaders.
 */
export interface ProjectContext {
  projectSummary?: string
  questions?: Array<{ id: string; text: string; status: string }>
  decisions?: Array<{ id: string; text: string }>
  requirements?: Array<{ id: string; text: string }>
  risks?: Array<{ id: string; text: string }>
  articles?: Array<{ id: string; title: string; content: string }>
  transcriptSummaries?: Array<{ id: string; summary: string }>
  orgComponents?: Array<{ id: string; name: string; type: string }>
  /** Raw context string for direct injection into prompts */
  rawContext?: string
}

/**
 * Result of a tool call execution.
 */
export interface ToolResult {
  toolName: string
  toolUseId: string
  result: unknown
  isError: boolean
}

/**
 * Token usage tracking.
 */
export interface TokenUsage {
  input: number
  output: number
}

/**
 * Validation result from output validators.
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Task definition for the execution engine (Layer 1).
 * Each feature defines its own TaskDefinition(s).
 */
export interface TaskDefinition {
  taskType: TaskType
  /** System prompt template. Use {{context}} for assembled context injection. */
  systemPromptTemplate: string
  /** Context loader function (Layer 3). Assembles project context for the prompt. */
  contextLoader: (input: TaskInput, projectId: string) => Promise<ProjectContext>
  /** Available tools for this task */
  tools: ClaudeToolDefinition[]
  /** Output validator for structured results */
  outputValidator?: (output: string) => ValidationResult
  /** Execution mode: single API call or iterative tool loop */
  executionMode: ExecutionMode
  /** Max iterations for AGENT_LOOP mode (default: 10) */
  maxIterations?: number
  /** Max retries on API failure (default: 3) */
  maxRetries?: number
  /** Ambiguity handling mode */
  ambiguityMode: AmbiguityMode
  /** Claude model to use (default: claude-sonnet-4-20250514) */
  model?: string
}

/**
 * Result returned by executeTask().
 */
export interface ExecutionResult {
  /** The AI's text output */
  output: string
  /** Results from tool calls (if any) */
  toolResults: ToolResult[]
  /** Cumulative token usage across all iterations */
  tokenUsage: TokenUsage
  /** Total cost in USD */
  cost: number
  /** ID of the created SessionLog record */
  sessionLogId: string
  /** Number of iterations completed (1 for SINGLE_TURN) */
  iterations: number
  /** Validation result (if outputValidator provided) */
  validation?: ValidationResult
}
