/**
 * Agent Harness Execution Engine (Layer 2)
 *
 * Central execution engine for all AI interactions (except chat streaming).
 * Accepts a TaskDefinition from Layer 1, assembles context via Layer 3,
 * runs the Claude API, handles retries and tool loops, tracks tokens/cost,
 * and logs to SessionLog.
 *
 * Architecture: Tech spec Section 3.2 (D-32)
 * Threat mitigations: T-02-02 (parameterized queries), T-02-03 (no secrets in prompts), T-02-04 (iteration/retry caps)
 */

import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/db"
import { calculateCost, DEFAULT_MODEL } from "@/lib/config/ai-pricing"
import type {
  TaskDefinition,
  TaskInput,
  ExecutionResult,
  ToolResult,
  TokenUsage,
  ProjectContext,
} from "./types"

// Lazy singleton — created on first use so tests can mock the module
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicClient
}

/** Reset the singleton client. Used in tests to pick up fresh mocks. */
export function resetAnthropicClient(): void {
  anthropicClient = null
}

/** Delay helper for retry backoff */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Ambiguity instructions injected into system prompt based on mode (D-34) */
const AMBIGUITY_INSTRUCTIONS: Record<string, string> = {
  INTERACTIVE:
    "When you encounter ambiguity, ask the user for clarification before proceeding. Present options clearly and wait for their response.",
  TASK_SESSION:
    "When you encounter ambiguity, make your best guess based on available context and flag the uncertainty. Include a confidence indicator and note what assumption you made.",
  BACKGROUND:
    "When you encounter ambiguity, flag the item for human review. Do not guess or ask questions. Simply note the ambiguity and continue with what you can determine with confidence.",
}

/**
 * Check if an error is retryable (rate limit or overloaded).
 */
function isRetryableError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>
    const status = err.status as number | undefined
    // 429 = rate limited, 529 = overloaded
    if (status === 429 || status === 529) return true

    const errorObj = err.error as Record<string, unknown> | undefined
    if (errorObj) {
      const errorType = errorObj.type as string | undefined
      if (
        errorType === "overloaded_error" ||
        errorType === "rate_limit_error"
      ) {
        return true
      }
    }
  }
  return false
}

/**
 * Build the system prompt from the template and assembled context.
 */
function buildSystemPrompt(
  template: string,
  context: ProjectContext,
  ambiguityMode: string
): string {
  // Assemble context string from ProjectContext
  const contextParts: string[] = []

  if (context.projectSummary) {
    contextParts.push(`Project Summary: ${context.projectSummary}`)
  }
  if (context.rawContext) {
    contextParts.push(context.rawContext)
  }
  if (context.questions?.length) {
    contextParts.push(
      `Questions:\n${context.questions.map((q) => `- [${q.status}] ${q.text}`).join("\n")}`
    )
  }
  if (context.decisions?.length) {
    contextParts.push(
      `Decisions:\n${context.decisions.map((d) => `- ${d.text}`).join("\n")}`
    )
  }
  if (context.requirements?.length) {
    contextParts.push(
      `Requirements:\n${context.requirements.map((r) => `- ${r.text}`).join("\n")}`
    )
  }
  if (context.articles?.length) {
    contextParts.push(
      `Knowledge Articles:\n${context.articles.map((a) => `- ${a.title}: ${a.content}`).join("\n")}`
    )
  }

  const assembledContext = contextParts.join("\n\n")

  // Replace {{context}} placeholder
  let systemPrompt = template.replace("{{context}}", assembledContext)

  // Append ambiguity instructions
  const ambiguityInstruction = AMBIGUITY_INSTRUCTIONS[ambiguityMode]
  if (ambiguityInstruction) {
    systemPrompt += `\n\n${ambiguityInstruction}`
  }

  return systemPrompt
}

/**
 * Extract text output from Claude response content blocks.
 */
function extractTextOutput(
  content: Anthropic.Messages.ContentBlock[]
): string {
  return content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
}

/**
 * Execute a task through the agent harness.
 *
 * @param taskDef - Task definition (Layer 1)
 * @param input - User input and metadata
 * @param projectId - Project scope for DB operations
 * @param userId - User initiating the task
 * @returns ExecutionResult with output, token usage, cost, and session log ID
 */
export async function executeTask(
  taskDef: TaskDefinition,
  input: TaskInput,
  projectId: string,
  userId: string
): Promise<ExecutionResult> {
  const model = taskDef.model ?? DEFAULT_MODEL
  const maxRetries = taskDef.maxRetries ?? 3
  const maxIterations = taskDef.maxIterations ?? 10
  const client = getAnthropicClient()

  // Track cumulative usage
  const tokenUsage: TokenUsage = { input: 0, output: 0 }
  const toolResults: ToolResult[] = []
  let iterations = 0
  let output = ""

  try {
    // Layer 3: Assemble context
    const context = await taskDef.contextLoader(input, projectId)

    // Build system prompt with context and ambiguity instructions
    const systemPrompt = buildSystemPrompt(
      taskDef.systemPromptTemplate,
      context,
      taskDef.ambiguityMode
    )

    // Build initial messages
    const messages: Anthropic.Messages.MessageParam[] = [
      { role: "user", content: input.userMessage },
    ]

    // Build tool definitions for API call
    const tools =
      taskDef.tools.length > 0
        ? taskDef.tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.input_schema as Anthropic.Messages.Tool["input_schema"],
          }))
        : undefined

    // Execute with retry logic
    let response = await callWithRetry(
      client,
      { model, system: systemPrompt, messages, tools, max_tokens: 4096 },
      maxRetries
    )

    tokenUsage.input += response.usage.input_tokens
    tokenUsage.output += response.usage.output_tokens
    iterations++

    // SINGLE_TURN: return immediately
    if (taskDef.executionMode === "SINGLE_TURN") {
      output = extractTextOutput(response.content)
    }
    // AGENT_LOOP: iterate tool calls
    else {
      // Process the first response
      output = extractTextOutput(response.content)

      while (iterations < maxIterations) {
        // Check for tool_use blocks
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.Messages.ToolUseBlock =>
            block.type === "tool_use"
        )

        if (toolUseBlocks.length === 0) break

        // Execute each tool call
        const toolResultMessages: Anthropic.Messages.ToolResultBlockParam[] = []

        for (const toolBlock of toolUseBlocks) {
          // Dynamically import tool executor to allow mocking
          const { executeToolCall } = await import("./tool-executor")
          let result: unknown
          let isError = false

          try {
            result = await executeToolCall(
              toolBlock.name,
              toolBlock.input as Record<string, unknown>,
              projectId
            )
          } catch (err) {
            result = err instanceof Error ? err.message : String(err)
            isError = true
          }

          toolResults.push({
            toolName: toolBlock.name,
            toolUseId: toolBlock.id,
            result,
            isError,
          })

          toolResultMessages.push({
            type: "tool_result",
            tool_use_id: toolBlock.id,
            content: JSON.stringify(result),
            is_error: isError,
          })
        }

        // Append assistant response and tool results to messages
        messages.push({ role: "assistant", content: response.content })
        messages.push({ role: "user", content: toolResultMessages })

        // Make next API call
        response = await callWithRetry(
          client,
          { model, system: systemPrompt, messages, tools, max_tokens: 4096 },
          maxRetries
        )

        tokenUsage.input += response.usage.input_tokens
        tokenUsage.output += response.usage.output_tokens
        iterations++

        // Extract any text from this response
        const newOutput = extractTextOutput(response.content)
        if (newOutput) output = newOutput
      }
    }

    // Calculate cost
    const cost = calculateCost(model, tokenUsage.input, tokenUsage.output)

    // Run output validator if provided
    const validation = taskDef.outputValidator
      ? taskDef.outputValidator(output)
      : undefined

    // Create SessionLog record (D-35)
    const sessionLog = await prisma.sessionLog.create({
      data: {
        projectId,
        userId,
        taskType: taskDef.taskType,
        status: "COMPLETE",
        model,
        inputTokens: tokenUsage.input,
        outputTokens: tokenUsage.output,
        totalIterations: iterations,
        summary: output.slice(0, 500), // Truncate summary
        completedAt: new Date(),
      },
    })

    return {
      output,
      toolResults,
      tokenUsage,
      cost,
      sessionLogId: sessionLog.id,
      iterations,
      validation,
    }
  } catch (error) {
    // Log failed session
    const cost = calculateCost(
      model,
      tokenUsage.input,
      tokenUsage.output
    )

    await prisma.sessionLog.create({
      data: {
        projectId,
        userId,
        taskType: taskDef.taskType,
        status: "FAILED",
        model,
        inputTokens: tokenUsage.input,
        outputTokens: tokenUsage.output,
        totalIterations: iterations,
        errorMessage:
          error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      },
    })

    throw error
  }
}

/**
 * Call Claude API with retry logic for transient errors.
 * Retries on rate_limit_error (429) and overloaded_error (529) with exponential backoff.
 */
async function callWithRetry(
  client: Anthropic,
  params: {
    model: string
    system: string
    messages: Anthropic.Messages.MessageParam[]
    tools?: Anthropic.Messages.Tool[]
    max_tokens: number
  },
  maxRetries: number
): Promise<Anthropic.Messages.Message> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: params.model,
        system: params.system,
        messages: params.messages,
        ...(params.tools ? { tools: params.tools } : {}),
        max_tokens: params.max_tokens,
      })
      return response as Anthropic.Messages.Message
    } catch (error) {
      lastError = error

      if (!isRetryableError(error) || attempt >= maxRetries) {
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, attempt) * 1000
      await delay(backoffMs)
    }
  }

  throw lastError
}
