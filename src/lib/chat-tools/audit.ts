/**
 * Log an individual tool call to the ChatMessage.toolCalls JSON field
 * for the current conversation turn. (D-19)
 *
 * This is a fire-and-forget helper — call from onFinish in the chat route.
 * Errors are swallowed to never fail the main chat response.
 */
export async function logToolCall(params: {
  conversationId: string
  toolName: string
  toolInput: Record<string, unknown>
  toolResult: unknown
  projectId: string
  memberId: string
}): Promise<void> {
  try {
    // Tool calls are stored on the ChatMessage row via onFinish in the chat route.
    // This helper exists as an explicit audit hook for future extension (e.g., per-call rows).
    // Currently a no-op — onFinish in route.ts already persists toolCalls JSON.
    // Retained for structural completeness and future audit table migration.
    void params // suppress unused-vars
  } catch {
    // Swallow — audit must never crash the request
  }
}
