import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockPrisma } from "../../helpers/mock-prisma"
import {
  createMockAnthropic,
  mockTextResponse,
  mockToolUseResponse,
} from "../../helpers/mock-anthropic"
import type {
  TaskDefinition,
  TaskInput,
  ExecutionResult,
} from "@/lib/agent-harness/types"
import { calculateCost } from "@/lib/config/ai-pricing"

// Mock dependencies before importing engine
const mockPrisma = createMockPrisma()
vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}))

// Mock Anthropic SDK
const mockAnthropicInstance = createMockAnthropic()
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(() => mockAnthropicInstance),
}))

// Mock tool executor
vi.mock("@/lib/agent-harness/tool-executor", () => ({
  executeToolCall: vi.fn().mockResolvedValue({ success: true }),
}))

// Import after mocks are set up
const { executeTask } = await import("@/lib/agent-harness/engine")

/** Helper to create a minimal TaskDefinition for testing */
function createTestTaskDef(
  overrides: Partial<TaskDefinition> = {}
): TaskDefinition {
  return {
    taskType: "QUESTION_ANSWERING",
    systemPromptTemplate: "You are a helpful assistant. Context: {{context}}",
    contextLoader: vi.fn().mockResolvedValue({
      projectSummary: "Test project summary",
      rawContext: "Test context data",
    }),
    tools: [],
    executionMode: "SINGLE_TURN",
    ambiguityMode: "BACKGROUND",
    ...overrides,
  }
}

function createTestInput(overrides: Partial<TaskInput> = {}): TaskInput {
  return {
    userMessage: "Test question",
    entityId: "entity-123",
    ...overrides,
  }
}

describe("executeTask", () => {
  const projectId = "project-123"
  const userId = "user-456"

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock Anthropic to return a default text response
    mockAnthropicInstance.messages.create.mockResolvedValue(
      mockTextResponse("AI response text", { input_tokens: 200, output_tokens: 100 })
    )
    // Reset SessionLog mock to return a record with ID
    mockPrisma.sessionLog.create.mockResolvedValue({
      id: "session-log-123",
      projectId,
      userId,
      taskType: "QUESTION_ANSWERING",
      status: "COMPLETE",
      inputTokens: 200,
      outputTokens: 100,
      totalIterations: 1,
    })
  })

  it("returns ExecutionResult with output, tokenUsage, and cost in SINGLE_TURN mode", async () => {
    const taskDef = createTestTaskDef()
    const input = createTestInput()

    const result: ExecutionResult = await executeTask(taskDef, input, projectId, userId)

    expect(result.output).toBe("AI response text")
    expect(result.tokenUsage.input).toBe(200)
    expect(result.tokenUsage.output).toBe(100)
    expect(result.cost).toBeGreaterThan(0)
    expect(result.sessionLogId).toBe("session-log-123")
    expect(result.iterations).toBe(1)
    expect(result.toolResults).toEqual([])
  })

  it("calls contextLoader with input and projectId", async () => {
    const contextLoader = vi.fn().mockResolvedValue({ rawContext: "ctx" })
    const taskDef = createTestTaskDef({ contextLoader })
    const input = createTestInput()

    await executeTask(taskDef, input, projectId, userId)

    expect(contextLoader).toHaveBeenCalledWith(input, projectId)
  })

  it("iterates tool calls in AGENT_LOOP mode until end_turn", async () => {
    const toolUseResp = mockToolUseResponse("create_question", { text: "What?" })
    const textResp = mockTextResponse("Done processing", {
      input_tokens: 100,
      output_tokens: 50,
    })

    mockAnthropicInstance.messages.create
      .mockResolvedValueOnce(toolUseResp)
      .mockResolvedValueOnce(textResp)

    const taskDef = createTestTaskDef({
      executionMode: "AGENT_LOOP",
      maxIterations: 5,
      tools: [
        {
          name: "create_question",
          description: "Create a question",
          input_schema: { type: "object" as const, properties: { text: { type: "string" } } },
        },
      ],
    })

    const result = await executeTask(taskDef, createTestInput(), projectId, userId)

    // Should have made 2 API calls: first returns tool_use, second returns end_turn
    expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(2)
    expect(result.iterations).toBe(2)
    expect(result.output).toBe("Done processing")
    // Token usage should be cumulative
    expect(result.tokenUsage.input).toBe(250) // 150 + 100
    expect(result.tokenUsage.output).toBe(130) // 80 + 50
  })

  it("stops agent loop at maxIterations even with pending tool calls", async () => {
    // Always return tool_use responses
    mockAnthropicInstance.messages.create.mockResolvedValue(
      mockToolUseResponse("create_question", { text: "Infinite loop?" })
    )

    const taskDef = createTestTaskDef({
      executionMode: "AGENT_LOOP",
      maxIterations: 3,
      tools: [
        {
          name: "create_question",
          description: "Create a question",
          input_schema: { type: "object" as const, properties: { text: { type: "string" } } },
        },
      ],
    })

    const result = await executeTask(taskDef, createTestInput(), projectId, userId)

    expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(3)
    expect(result.iterations).toBe(3)
  })

  it("retries on API failure up to maxRetries with exponential backoff", async () => {
    const apiError = Object.assign(new Error("overloaded"), {
      status: 529,
      error: { type: "overloaded_error" },
    })

    mockAnthropicInstance.messages.create
      .mockRejectedValueOnce(apiError)
      .mockRejectedValueOnce(apiError)
      .mockResolvedValueOnce(
        mockTextResponse("Success after retries", { input_tokens: 100, output_tokens: 50 })
      )

    const taskDef = createTestTaskDef({ maxRetries: 3 })
    const input = createTestInput()

    const result = await executeTask(taskDef, input, projectId, userId)

    expect(result.output).toBe("Success after retries")
    expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(3)
  }, 15000)

  it("throws after exhausting all retries", async () => {
    const apiError = Object.assign(new Error("overloaded"), {
      status: 529,
      error: { type: "overloaded_error" },
    })

    mockAnthropicInstance.messages.create.mockRejectedValue(apiError)

    const taskDef = createTestTaskDef({ maxRetries: 2 })

    await expect(
      executeTask(taskDef, createTestInput(), projectId, userId)
    ).rejects.toThrow()

    // 1 initial + 2 retries = 3 total
    expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(3)
  }, 15000)

  it("creates a SessionLog record with token usage, cost, and taskType", async () => {
    const taskDef = createTestTaskDef({ taskType: "TRANSCRIPT_PROCESSING" })

    await executeTask(taskDef, createTestInput(), projectId, userId)

    expect(mockPrisma.sessionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId,
        userId,
        taskType: "TRANSCRIPT_PROCESSING",
        status: "COMPLETE",
        inputTokens: 200,
        outputTokens: 100,
        totalIterations: 1,
      }),
    })
  })

  it("creates a FAILED SessionLog when execution errors", async () => {
    mockAnthropicInstance.messages.create.mockRejectedValue(
      new Error("non-retryable error")
    )

    const taskDef = createTestTaskDef({ maxRetries: 0 })

    await expect(
      executeTask(taskDef, createTestInput(), projectId, userId)
    ).rejects.toThrow()

    expect(mockPrisma.sessionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "FAILED",
        errorMessage: expect.stringContaining("non-retryable error"),
      }),
    })
  })

  it("includes ambiguity handling instructions based on ambiguityMode", async () => {
    const taskDef = createTestTaskDef({ ambiguityMode: "INTERACTIVE" })
    await executeTask(taskDef, createTestInput(), projectId, userId)

    const createCall = mockAnthropicInstance.messages.create.mock.calls[0][0]
    expect(createCall.system).toContain("ask the user")
  })

  it("includes TASK_SESSION ambiguity instructions", async () => {
    const taskDef = createTestTaskDef({ ambiguityMode: "TASK_SESSION" })
    await executeTask(taskDef, createTestInput(), projectId, userId)

    const createCall = mockAnthropicInstance.messages.create.mock.calls[0][0]
    expect(createCall.system).toContain("best guess")
  })

  it("includes BACKGROUND ambiguity instructions", async () => {
    const taskDef = createTestTaskDef({ ambiguityMode: "BACKGROUND" })
    await executeTask(taskDef, createTestInput(), projectId, userId)

    const createCall = mockAnthropicInstance.messages.create.mock.calls[0][0]
    expect(createCall.system).toContain("flag")
  })

  it("runs output validator when provided", async () => {
    const outputValidator = vi.fn().mockReturnValue({
      valid: true,
      errors: [],
    })

    const taskDef = createTestTaskDef({ outputValidator })
    const result = await executeTask(taskDef, createTestInput(), projectId, userId)

    expect(outputValidator).toHaveBeenCalledWith("AI response text")
    expect(result.validation).toEqual({ valid: true, errors: [] })
  })
})

describe("calculateCost", () => {
  it("correctly computes cost from token counts for Sonnet", () => {
    // Sonnet: $3/1M input, $15/1M output
    const cost = calculateCost("claude-sonnet-4-20250514", 1000, 500)
    expect(cost).toBeCloseTo(0.003 + 0.0075, 6) // 0.0105
  })

  it("correctly computes cost from token counts for Opus", () => {
    // Opus: $15/1M input, $75/1M output
    const cost = calculateCost("claude-opus-4-20250514", 1000, 500)
    expect(cost).toBeCloseTo(0.015 + 0.0375, 6) // 0.0525
  })

  it("correctly computes cost from token counts for Haiku", () => {
    // Haiku: $0.80/1M input, $4/1M output
    const cost = calculateCost("claude-haiku-3-5-20241022", 1000, 500)
    expect(cost).toBeCloseTo(0.0008 + 0.002, 6) // 0.0028
  })

  it("throws for unknown model", () => {
    expect(() => calculateCost("unknown-model", 100, 50)).toThrow("Unknown model")
  })
})
