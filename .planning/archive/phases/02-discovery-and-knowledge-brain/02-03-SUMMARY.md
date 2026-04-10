---
phase: 02-discovery-and-knowledge-brain
plan: 03
subsystem: chat
tags: [chat, streaming, ai-sdk, vercel-ai, conversations, ui]
dependency_graph:
  requires: [02-01 (agent harness types, ai-pricing), 01-foundation (Prisma schema, db.ts, safe-action.ts, auth.ts, project-scope.ts)]
  provides: [ChatInterface, MessageList, MessageBubble, ContextPanel, TokenDisplay, /api/chat streaming endpoint, conversation CRUD actions, chat context assembly]
  affects: [02-05 (transcript processing uses task sessions), 02-04 (question answering uses chat), 02-06 (knowledge articles referenced in context)]
tech_stack:
  added: ["ai@6.x", "@ai-sdk/anthropic@3.x", "@ai-sdk/react@latest"]
  patterns: [useChat hook with DefaultChatTransport, streamText with toUIMessageStreamResponse, UIMessage parts-based rendering, server action CRUD with scopedPrisma]
key_files:
  created:
    - src/app/api/chat/route.ts
    - src/actions/conversations.ts
    - src/lib/agent-harness/context/chat-context.ts
    - src/components/chat/chat-interface.tsx
    - src/components/chat/message-list.tsx
    - src/components/chat/message-bubble.tsx
    - src/components/chat/context-panel.tsx
    - src/components/chat/token-display.tsx
    - src/app/(dashboard)/projects/[projectId]/chat/page.tsx
    - src/app/(dashboard)/projects/[projectId]/chat/[conversationId]/page.tsx
    - src/components/ui/scroll-area.tsx
    - src/components/ui/tooltip.tsx
  modified:
    - prisma/schema.prisma
    - src/env.ts
    - src/components/layout/sidebar.tsx
    - package.json
    - package-lock.json
decisions:
  - "Used AI SDK v6 UIMessage parts-based API with DefaultChatTransport instead of legacy useChat body/api pattern"
  - "Token/cost data stored server-side in ChatMessage DB records, not in client-side UIMessage metadata"
  - "Context assembly loads project summary, open questions, and recent decisions for system prompt grounding"
  - "Added inputTokens, outputTokens, cost columns to ChatMessage Prisma model (schema deviation from original)"
  - "Added ANTHROPIC_API_KEY to env.ts validation for AI SDK provider"
metrics:
  duration: 9m
  completed: 2026-04-06T17:39:21Z
  tasks: 2/2
  files_created: 12
  files_modified: 5
---

# Phase 02 Plan 03: Chat Infrastructure Summary

Streaming chat with Vercel AI SDK v6, conversation persistence via server actions, general chat (full-width) and task session (split layout with context panel) modes, and project-aware system prompts assembled from live project data.

## What Was Built

### Task 1: Chat API Route and Conversation Server Actions
- **Chat API route** (`/api/chat`): POST handler using `streamText()` with `anthropic('claude-sonnet-4-20250514')` model. Authenticates via Clerk, verifies project membership and conversation ownership, saves user and AI messages to DB with token usage tracking, returns `toUIMessageStreamResponse()` for AI SDK v6 client consumption.
- **Conversation actions** (`conversations.ts`): Five server actions using next-safe-action pattern with scopedPrisma:
  - `getOrCreateGeneralChat`: Find-or-create single GENERAL_CHAT per project with last 50 messages
  - `createConversation`: Create task-specific sessions (TRANSCRIPT_SESSION, STORY_SESSION, etc.)
  - `getConversation`: Fetch with all messages and sessionLog, project-scoped
  - `getConversations`: List all conversations ordered by updatedAt
  - `saveMessage`: Persist ChatMessage with optional token usage and cost
- **Context assembly** (`chat-context.ts`): Loads project summary (name, client, engagement type, phase), open questions, and recent decisions. Builds grounding system prompt so AI responses are project-aware.
- **Schema update**: Added `inputTokens`, `outputTokens`, `cost` nullable columns to ChatMessage model for per-message token tracking.
- **Env update**: Added `ANTHROPIC_API_KEY` to server env validation.

### Task 2: Chat UI Components
- **MessageBubble**: User messages with muted background, AI messages with white background and left border, system messages centered in muted text. AI messages render basic markdown (headings, lists, inline bold/italic/code). Token/cost footer on AI messages in 13px muted style per D-15.
- **MessageList**: ScrollArea wrapper with auto-scroll to bottom, date grouping with separators (Today/Yesterday/MMM d), three-dot bounce animation streaming indicator.
- **TokenDisplay**: Session total tokens and cost in header, right-aligned, 13px muted style. Hidden when zero.
- **ContextPanel** (D-14): 320px fixed-width right panel for task sessions showing related entities list and token usage breakdown (prompt/response/session/cost).
- **ChatInterface** (D-12, D-13): Main component using `useChat` hook from `@ai-sdk/react` with `DefaultChatTransport`. General chat renders full-width; task sessions render split layout with ContextPanel. Input area with muted background, 44px min-height, ArrowUp send button. Empty state per UI-SPEC. Error state with retry prompt.
- **Chat pages**: Server components that load conversation data and render ChatInterface with initialMessages converted to UIMessage format.
- **Sidebar update**: Added "Chat" nav item with MessageSquare icon, visible to all roles.

## Decisions Made

1. **AI SDK v6 API**: Used `DefaultChatTransport` and `toUIMessageStreamResponse()` instead of the legacy `toDataStreamResponse()` pattern. The v6 API uses `sendMessage({text})` and `UIMessage.parts` array instead of `handleSubmit`/`append` and plain string content.
2. **Server-side token tracking**: Token data lives in ChatMessage DB records rather than being sent to the client via stream metadata. The `onFinish` callback in the API route captures `totalUsage.inputTokens`/`outputTokens` and computes cost using the existing `calculateCost()` utility.
3. **Schema addition**: Added three nullable columns (`inputTokens Int?`, `outputTokens Int?`, `cost Float?`) to ChatMessage. This was not in the original schema but is required by the plan's token tracking requirement.
4. **Lightweight markdown rendering**: Built inline markdown rendering for AI messages rather than pulling in a markdown library. Handles headings, lists, bold, italic, and inline code. Sufficient for V1; can upgrade to remark/rehype if needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] AI SDK v6 API differences**
- **Found during:** Task 1
- **Issue:** Plan specified `toDataStreamResponse()` and `useChat` from `ai/react` with `api`/`body` options. AI SDK v6 removed `toDataStreamResponse()` in favor of `toUIMessageStreamResponse()`, moved `useChat` to `@ai-sdk/react`, and uses `DefaultChatTransport` with `body` option instead of direct options.
- **Fix:** Installed `@ai-sdk/react`, used `DefaultChatTransport` class, `toUIMessageStreamResponse()`, and `sendMessage({text})` API.
- **Files modified:** src/app/api/chat/route.ts, src/components/chat/chat-interface.tsx

**2. [Rule 3 - Blocking] Prisma schema field mismatches**
- **Found during:** Task 1
- **Issue:** Context loader referenced `description`, `sfEdition`, `sfClouds` on Project model and `IN_PROGRESS` QuestionStatus and `priority` field on Question -- none of which exist in the actual schema.
- **Fix:** Updated context loader to use actual schema fields: `clientName`, `engagementType`, `currentPhase` for Project; `OPEN` status and `createdAt` ordering for Questions.
- **Files modified:** src/lib/agent-harness/context/chat-context.ts

**3. [Rule 2 - Missing] ChatMessage token tracking columns**
- **Found during:** Task 1
- **Issue:** Plan requires saving token usage per AI message, but ChatMessage model lacked `inputTokens`, `outputTokens`, `cost` fields.
- **Fix:** Added three nullable columns to ChatMessage in Prisma schema, regenerated client.
- **Files modified:** prisma/schema.prisma

**4. [Rule 2 - Missing] ANTHROPIC_API_KEY env validation**
- **Found during:** Task 1
- **Issue:** AI SDK anthropic provider requires ANTHROPIC_API_KEY environment variable, but env.ts did not validate it.
- **Fix:** Added `ANTHROPIC_API_KEY: z.string().min(1)` to server env schema.
- **Files modified:** src/env.ts

## Known Stubs

| File | Line | Description | Resolution |
|------|------|-------------|------------|
| src/components/chat/chat-interface.tsx | computeSessionTokens() | Returns zeros -- token data is in DB, not UIMessage parts. Server components pass pre-calculated totals. | Plan 05+ can wire session-level token aggregation via server props |
| src/components/chat/context-panel.tsx | relatedEntities prop | Defaults to empty array. No data source wired yet. | Plan 05 (transcript processing) and Plan 04 (question system) will pass linked entities |

These stubs do not block the plan's goal (working streaming chat with persistence). Token display works at the per-message level via DB records; session totals will be wired when task sessions are created by downstream plans.

## Self-Check: PASSED

All 12 created files verified present. Both commits (30c4644, 3ce7df0) verified in git log. TypeScript compilation passes with --skipLibCheck.
