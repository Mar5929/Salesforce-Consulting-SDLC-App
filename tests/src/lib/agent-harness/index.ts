/**
 * Agent Harness - Public API
 *
 * Central AI execution infrastructure for all non-chat AI interactions.
 * Three-layer architecture:
 *   Layer 1: Task Definitions (per-feature, defined in downstream plans)
 *   Layer 2: Execution Engine (engine.ts)
 *   Layer 3: Context Assembly (per-feature context loaders)
 */

// Types
export type {
  TaskType,
  ExecutionMode,
  AmbiguityMode,
  ClaudeToolDefinition,
  TaskInput,
  ProjectContext,
  ToolResult,
  TokenUsage,
  ValidationResult,
  TaskDefinition,
  ExecutionResult,
} from "./types"

// Execution engine (Layer 2)
export { executeTask, resetAnthropicClient } from "./engine"

// Tool dispatch
export { executeToolCall, ToolNotImplementedError } from "./tool-executor"

// Sanitization
export { sanitizeToolInput, sanitizeHtml } from "./sanitize"
