import { vi } from "vitest"

interface MockUsage {
  input_tokens: number
  output_tokens: number
}

interface MockTextBlock {
  type: "text"
  text: string
}

interface MockToolUseBlock {
  type: "tool_use"
  id: string
  name: string
  input: Record<string, unknown>
}

type MockContentBlock = MockTextBlock | MockToolUseBlock

interface MockMessageResponse {
  id: string
  type: "message"
  role: "assistant"
  content: MockContentBlock[]
  model: string
  stop_reason: "end_turn" | "tool_use"
  usage: MockUsage
}

/**
 * Creates a mock text response matching the Anthropic SDK format.
 */
export function mockTextResponse(
  text: string,
  usage: MockUsage = { input_tokens: 100, output_tokens: 50 }
): MockMessageResponse {
  return {
    id: `msg_mock_${Date.now()}`,
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    model: "claude-sonnet-4-20250514",
    stop_reason: "end_turn",
    usage,
  }
}

/**
 * Creates a mock tool_use response matching the Anthropic SDK format.
 */
export function mockToolUseResponse(
  toolName: string,
  toolInput: Record<string, unknown>,
  usage: MockUsage = { input_tokens: 150, output_tokens: 80 }
): MockMessageResponse {
  return {
    id: `msg_mock_${Date.now()}`,
    type: "message",
    role: "assistant",
    content: [
      {
        type: "tool_use",
        id: `toolu_mock_${Date.now()}`,
        name: toolName,
        input: toolInput,
      },
    ],
    model: "claude-sonnet-4-20250514",
    stop_reason: "tool_use",
    usage,
  }
}

/**
 * Creates a sequence of mock responses for agent loop testing.
 * Each step is returned in order from successive messages.create() calls.
 * The last step should typically be a text response (end_turn) to stop the loop.
 */
export function mockAgentLoopResponses(
  steps: MockMessageResponse[]
): MockMessageResponse[] {
  return steps
}

/**
 * Factory that returns a mock Anthropic SDK client.
 * messages.create() returns a configurable response or sequence of responses.
 */
export function createMockAnthropic(
  responses?: MockMessageResponse | MockMessageResponse[]
) {
  const responseQueue = responses
    ? Array.isArray(responses)
      ? [...responses]
      : [responses]
    : [mockTextResponse("Default mock response")]

  let callIndex = 0

  const mockCreate = vi.fn().mockImplementation(() => {
    const response = responseQueue[Math.min(callIndex, responseQueue.length - 1)]
    callIndex++
    return Promise.resolve(response)
  })

  return {
    messages: {
      create: mockCreate,
    },
    _callIndex: () => callIndex,
    _resetCallIndex: () => {
      callIndex = 0
    },
  }
}

export type MockAnthropicClient = ReturnType<typeof createMockAnthropic>
