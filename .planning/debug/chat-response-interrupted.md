---
status: fixing
trigger: "Chat response fails with 'Response interrupted. Click to retry.' error when sending messages in Project Chat"
created: 2026-04-07T00:00:00Z
updated: 2026-04-07T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - UIMessage/ModelMessage format mismatch between client and server
test: Traced message flow from useChat -> DefaultChatTransport -> route -> streamText
expecting: Messages with `parts` array fail modelMessageSchema validation expecting `content`
next_action: Apply fix using convertToModelMessages in route.ts

## Symptoms

expected: AI should respond to the chat message with a streaming response
actual: Response is interrupted immediately, error state shown: "Response interrupted. Click to retry."
errors: "Response interrupted" shown in UI. Server throws InvalidPromptError during streamText validation.
reproduction: Go to any project's Chat page, type "hello", press send. Response fails.
started: Unknown

## Eliminated

- hypothesis: ANTHROPIC_API_KEY missing
  evidence: Key is set in .env.local (sk-ant-api03-...)
  timestamp: 2026-04-07

- hypothesis: Invalid model ID
  evidence: "claude-sonnet-4-20250514" is valid and used in AI_PRICING config
  timestamp: 2026-04-07

- hypothesis: toUIMessageStreamResponse() not a valid method
  evidence: Method exists and returns Response with 200 status in test
  timestamp: 2026-04-07

- hypothesis: tool() with inputSchema parameter not supported
  evidence: Both inputSchema and parameters work with tool() in ai@6.0.147
  timestamp: 2026-04-07

- hypothesis: API route not found (404)
  evidence: 404 was caused by Clerk auth.protect() on unauthenticated curl requests. Route file exists at src/app/api/chat/route.ts
  timestamp: 2026-04-07

## Evidence

- timestamp: 2026-04-07
  checked: Installed package versions
  found: ai@6.0.147, @ai-sdk/react@3.0.149, @ai-sdk/anthropic@3.0.67 -- all current
  implication: No version mismatch issues

- timestamp: 2026-04-07
  checked: Client-side message sending via useChat + DefaultChatTransport
  found: Transport sends `this.state.messages` (UIMessage[] with `parts` arrays) as POST body `messages` field
  implication: Server receives UIMessage format, not ModelMessage format

- timestamp: 2026-04-07
  checked: Server-side streamText message validation in standardizePrompt()
  found: Messages validated against modelMessageSchema which requires `content` field (string or ContentPart[]), NOT `parts` field
  implication: UIMessages from client fail Zod validation, throwing InvalidPromptError

- timestamp: 2026-04-07
  checked: userModelMessageSchema definition
  found: `{ role: "user", content: z.union([z.string(), z.array(...)]), providerOptions: ... }` -- no `parts` or `id` fields
  implication: UIMessages have `parts` and `id` but no `content` -- schema mismatch is confirmed

## Resolution

root_cause: The chat route passes UIMessage[] (from useChat client) directly to streamText() which expects ModelMessage[] format. UIMessages have `parts` arrays while ModelMessages expect `content` field. The streamText validation in standardizePrompt() throws InvalidPromptError, caught by try/catch returning 500, causing "Response interrupted" in UI.
fix: Use convertToModelMessages() from the `ai` package to convert UIMessages to ModelMessages before passing to streamText
verification: pending
files_changed: [src/app/api/chat/route.ts]
