# Phase 10: Chat Session Management and Conversation Intelligence - Research

**Researched:** 2026-04-08
**Domain:** Chat UI architecture, AI session management, context assembly expansion
**Confidence:** HIGH

## Summary

Phase 10 extends the existing chat system (built in Phase 2) with three major capabilities: (1) a conversation browsing/management sidebar (ChatGPT-style), (2) three new session types (BRIEFING_SESSION, QUESTION_SESSION, ENRICHMENT_SESSION), and (3) expanded context assembly so the general chat acts as a full project assistant drawing from all data sources.

The codebase already has solid foundations: `ChatInterface` component with variant support, `useChat` hook integration, agent harness three-layer architecture with 9 existing task definitions, context assembly with token-budgeted loading, and the `Conversation`/`ChatMessage` Prisma models with all six `ConversationType` enum values already defined (including the three unimplemented ones). The global search system provides both full-text (tsvector) and semantic (pgvector via Voyage AI) search that the smart retrieval system can leverage.

The primary work is: (a) building the conversation sidebar UI and chat layout restructure, (b) creating three new agent harness task definitions with their context loaders and tool definitions, (c) expanding `assembleGeneralChatContext` to pull from all project data sources with smart retrieval, (d) adding session lifecycle management (auto-complete, failed retry, archive), and (e) wiring entry points from the dashboard and story detail pages.

**Primary recommendation:** Build incrementally -- sidebar UI first (provides navigation for testing), then session types one at a time (briefing is simplest, enrichment reuses story draft pattern, question is most complex with hybrid Inngest logic), then context assembly expansion last since it enhances all sessions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Chat page gets a left sidebar showing conversation list (ChatGPT-style). General chat pinned at top. Clicking a session loads it in the main area.
- **D-02:** Conversation list organized with tab bar: All | Stories | Briefings | Transcripts | Questions.
- **D-03:** Inline search bar at top of conversation list that filters by title/content.
- **D-04:** Conversations sorted by most recent activity. Hover reveals actions: rename, archive, delete. Right-click context menu.
- **D-05:** Both source-context creation AND a "+ New" shortcut button in the conversation sidebar.
- **D-06:** All three unimplemented session types implemented in Phase 10.
- **D-07:** BRIEFING_SESSION launched from "Generate Briefing" button on discovery dashboard. Read-only across all project data.
- **D-08:** QUESTION_SESSION uses hybrid approach -- background Inngest job for simple answers, interactive chat session auto-triggers for contradictions.
- **D-09:** ENRICHMENT_SESSION triggered from story detail page via "Enrich with AI" button. Card-based accept/reject flow (same pattern as StoryDraftCards).
- **D-10:** Task sessions auto-complete when purpose fulfilled. General chat never completes.
- **D-11:** FAILED sessions shown with red status badge. "Retry" creates new session with same context.
- **D-12:** Archive only, no delete. Archived sessions accessible via filter toggle.
- **D-13:** Chat draws from ALL project data sources as knowledgeable assistant.
- **D-14:** Smart retrieval with semantic search + keyword matching. Two-pass strategy: summaries first, then full content. Token budget enforcement.

### Claude's Discretion
- Conversation list row density and metadata display
- Conversation sidebar width, collapse behavior, responsive layout
- "+ New" session creation flow details
- Tab bar styling (underline vs pill)
- Briefing session output format and structure
- QUESTION_SESSION threshold for "complex impact" triggering interactive mode
- ENRICHMENT_SESSION suggestion card design and grouping
- Auto-complete detection logic per session type
- Context assembly ranking/relevance algorithm details
- Token budget allocation across data sources
- Empty states for all views
- Retry flow UX details

### Deferred Ideas (OUT OF SCOPE)
- Agentic tool use in chat (Phase 11)
- Proactive AI-triggered enrichment (Phase 11)
- Role-based context prioritization
- Cross-session topic summaries and conversation analytics
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01 | Conversation sidebar with pinned general chat | ChatLayout + ConversationSidebar components. Existing `getConversations` action returns all conversations sorted by recency. |
| D-02 | Tab bar filtering by session type | Client-side filter of loaded conversations by `conversationType`. Use shadcn Tabs. |
| D-03 | Inline search filtering | Client-side string match on title + last message content. |
| D-04 | Sort by activity, hover actions, context menu | `updatedAt` sort (already in `getConversations`). DropdownMenu for actions. |
| D-05 | "+ New" button and source-context entry points | NewSessionDropdown component + server actions on dashboard/story pages. |
| D-06 | Three new session types | Three new task definitions + context loaders + tools + chat route handling. |
| D-07 | BRIEFING_SESSION | New task definition, read-only context from all sources, BriefingOutput component. |
| D-08 | QUESTION_SESSION hybrid | Inngest function for background simple answers, chat session for contradictions, notification link. |
| D-09 | ENRICHMENT_SESSION | New task definition, story context loader, EnrichmentSuggestionCards component (reuse StoryDraftCards pattern). |
| D-10 | Session auto-complete | Server action to mark COMPLETE, per-type completion detection, read-only UI state. |
| D-11 | Failed session retry | Server action to create retry session, copy metadata, mark old session read-only. |
| D-12 | Archive (no delete) | Schema migration to add `isArchived` boolean to Conversation. Archive/unarchive server actions. |
| D-13 | Full project context in chat | Expanded `assembleGeneralChatContext` pulling all data sources. |
| D-14 | Smart retrieval with two-pass | Semantic search via existing embeddings + keyword search, summary-first loading, token budget. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @ai-sdk/react (`useChat`) | 6.x | Streaming chat UI | Already in use for chat. Provides `useChat` hook, `UIMessage` type, `DefaultChatTransport`. |
| ai (Vercel AI SDK) | 6.x | `streamText`, `tool`, `convertToModelMessages` | Already in use in chat route. Streaming response handling. |
| @ai-sdk/anthropic | 3.x | Anthropic provider for AI SDK streaming | Already in chat route. |
| @anthropic-ai/sdk | 0.82.x | Direct Claude API for agent harness tasks | Already in use for background task execution via `executeTask`. |
| inngest | 4.x | Background job for QUESTION_SESSION simple answers | Already in use. Add new event + function for question impact assessment. |
| shadcn/ui | latest | Tabs, Badge, DropdownMenu, AlertDialog, Card, Skeleton | Already initialized. All needed components available. |

### No New Dependencies

Phase 10 requires zero new npm packages. All functionality builds on the existing stack:
- Chat streaming: Vercel AI SDK (existing)
- Background jobs: Inngest (existing)
- Search/retrieval: Global search with tsvector + pgvector (existing)
- UI components: shadcn/ui (existing)
- Embeddings: Voyage AI (existing)

[VERIFIED: codebase grep of package.json, existing imports in chat route, agent harness, search modules]

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/chat/
│   ├── chat-interface.tsx        # EXTEND: add new session types to union
│   ├── chat-layout.tsx           # NEW: sidebar + chat area wrapper
│   ├── conversation-sidebar.tsx  # NEW: left panel with conversation list
│   ├── conversation-row.tsx      # NEW: single row in sidebar
│   ├── conversation-filters.tsx  # NEW: tab bar + search
│   ├── new-session-dropdown.tsx  # NEW: "+ New" session type picker
│   ├── session-status-badge.tsx  # NEW: ACTIVE/COMPLETE/FAILED badge
│   ├── enrichment-suggestion-cards.tsx  # NEW: accept/reject cards
│   ├── briefing-output.tsx       # NEW: structured briefing display
│   ├── message-list.tsx          # EXTEND: handle enrichment tool invocations
│   ├── message-bubble.tsx        # EXISTING
│   ├── context-panel.tsx         # EXISTING
│   └── token-display.tsx         # EXISTING
├── actions/
│   └── conversations.ts          # EXTEND: archive, rename, retry, session lifecycle
├── app/api/chat/
│   └── route.ts                  # EXTEND: handle BRIEFING/QUESTION/ENRICHMENT types
├── lib/agent-harness/
│   ├── tasks/
│   │   ├── briefing-generation.ts     # NEW: task definition
│   │   ├── question-impact.ts         # NEW: task definition
│   │   ├── story-enrichment.ts        # NEW: task definition
│   │   └── index.ts                   # EXTEND: export new tasks
│   ├── context/
│   │   ├── chat-context.ts            # EXTEND: full project context assembly
│   │   └── smart-retrieval.ts         # NEW: semantic + keyword two-pass retrieval
│   └── tools/
│       ├── create-enrichment-suggestion.ts  # NEW: tool for enrichment cards
│       └── ...existing tools
├── lib/inngest/
│   ├── events.ts                 # EXTEND: add QUESTION_IMPACT event
│   └── functions/
│       └── question-impact.ts    # NEW: background question answering function
└── app/(dashboard)/projects/[projectId]/chat/
    ├── page.tsx                  # EXTEND: use ChatLayout wrapper
    ├── [conversationId]/page.tsx # EXTEND: handle new session types
    └── layout.tsx                # NEW or EXTEND: shared sidebar state
```

### Pattern 1: Chat Layout with Sidebar State

**What:** Wrap existing chat pages with a ChatLayout that includes the conversation sidebar. Sidebar state (selected conversation, filters) managed via URL params (consistent with nuqs pattern used elsewhere).

**When to use:** All chat page renders.

**Implementation approach:**
```typescript
// src/components/chat/chat-layout.tsx
// Server component that loads conversations, renders sidebar + children
// The sidebar is a client component with local filter/search state
// Selected conversation derived from URL path params (already works via routing)
```

The existing route structure (`/chat` for general, `/chat/[conversationId]` for sessions) maps naturally to sidebar selection. No additional state management needed -- URL routing handles it. [VERIFIED: existing route files]

### Pattern 2: Agent Harness Task Definition (Existing Pattern)

**What:** Each new session type gets a `TaskDefinition` object following the exact same shape as the 9 existing task definitions.

**When to use:** BRIEFING_SESSION, QUESTION_SESSION (background path), ENRICHMENT_SESSION.

**Key interface from codebase:**
```typescript
// From src/lib/agent-harness/types.ts
interface TaskDefinition {
  taskType: TaskType
  systemPromptTemplate: string       // {{context}} placeholder
  contextLoader: (input, projectId) => Promise<ProjectContext>
  tools: ClaudeToolDefinition[]
  outputValidator?: (output) => ValidationResult
  executionMode: "SINGLE_TURN" | "AGENT_LOOP"
  maxIterations?: number
  maxRetries?: number
  ambiguityMode: "INTERACTIVE" | "TASK_SESSION" | "BACKGROUND"
  model?: string
}
```
[VERIFIED: src/lib/agent-harness/types.ts]

### Pattern 3: Streaming Session via Chat Route (Existing Pattern)

**What:** Interactive sessions (BRIEFING, ENRICHMENT, QUESTION interactive) use the existing `/api/chat/route.ts` streaming pattern with `streamText` and session-type-specific system prompts + tools.

**When to use:** All interactive (user-facing) chat sessions.

**Key insight:** The chat route already has a switch on `conversation.conversationType`. Add new branches for BRIEFING_SESSION, QUESTION_SESSION, ENRICHMENT_SESSION following the same pattern as STORY_SESSION. Each branch builds its own system prompt via a dedicated function (like `buildStorySessionPrompt`). [VERIFIED: src/app/api/chat/route.ts lines 124-141]

### Pattern 4: Tool Invocation Cards (Existing Pattern)

**What:** AI calls a tool during streaming, the tool result renders as a card in the message list. User interacts with the card (accept/reject). This is how STORY_SESSION works with `create_story_draft` tool and `StoryDraftCards`.

**When to use:** ENRICHMENT_SESSION suggestions.

**Key insight:** `MessageList` already extracts tool invocations from `UIMessage.parts` and renders `StoryDraftCards`. Extend this to also render `EnrichmentSuggestionCards` when the tool name is `create_enrichment_suggestion`. The pattern is identical. [VERIFIED: src/components/chat/message-list.tsx lines 96-119]

### Pattern 5: Background Task via Inngest (Existing Pattern)

**What:** For QUESTION_SESSION simple answers (no contradiction), an Inngest function executes the agent harness task in the background, writes results to the database, and sends a notification.

**When to use:** QUESTION_SESSION non-interactive path.

**Key pattern from codebase:**
```typescript
// Follow existing Inngest function pattern
// 1. Define event in events.ts
// 2. Create function in functions/ directory
// 3. Use step functions for checkpoints
// 4. Call executeTask() for AI work
// 5. Send notification via NOTIFICATION_SEND event
```
[VERIFIED: src/lib/inngest/events.ts, existing function patterns]

### Anti-Patterns to Avoid
- **Do NOT duplicate context assembly logic between chat route and agent harness.** The chat route's system prompt builders should compose the same context loaders used by task definitions. Factor shared context loading into reusable functions.
- **Do NOT use client-side state for conversation selection.** URL routing already handles which conversation is active. Adding local state would create inconsistency with browser navigation.
- **Do NOT make the sidebar a server component that re-renders on navigation.** It should be a client component that loads conversations once and updates optimistically. Use SWR or useEffect for refresh.
- **Do NOT add WebSocket/SSE for sidebar updates.** Per project constraint, SWR polling with `refreshInterval` is the V1 pattern. Apply it to sidebar conversation list if real-time update is desired.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semantic search for context retrieval | Custom vector similarity | Existing `globalSearch()` or `generateEmbedding()` + `$queryRaw` pgvector queries | Three-layer search already handles filtered + full-text + semantic. Reuse. |
| Token counting for context budget | Character counting only | Existing `charsToTokens()` in context/index.ts (1 token ~= 4 chars) | Conservative estimation already built and used across all task definitions. |
| Streaming chat responses | Custom SSE implementation | Vercel AI SDK `streamText().toUIMessageStreamResponse()` | Already working in chat route. Battle-tested streaming. |
| Card-based accept/reject UI | Custom card component | Extend StoryDraftCards pattern from Phase 3 | Same tool invocation -> card rendering -> accept/reject flow. |
| Background job processing | Custom queue | Inngest step functions | Already used for transcript processing, embedding generation, dashboard synthesis. |

## Common Pitfalls

### Pitfall 1: Schema Migration for Archive
**What goes wrong:** The Conversation model has no `isArchived` field. Implementing archive without a schema migration breaks D-12.
**Why it happens:** The schema was defined in Phase 1 before the archive requirement was fully specified.
**How to avoid:** Add a Prisma migration early in the phase: `isArchived Boolean @default(false)` on Conversation model. All `getConversations` queries must filter `isArchived: false` by default.
**Warning signs:** Archived conversations still appearing in the sidebar.

### Pitfall 2: Chat Route Growing Too Large
**What goes wrong:** Adding 3 more session type handlers to the existing `route.ts` (already 215 lines) makes it unwieldy and hard to maintain.
**Why it happens:** Each session type needs its own system prompt builder, tool definitions, and response handling.
**How to avoid:** Extract session-type-specific logic into dedicated modules (e.g., `src/lib/chat-sessions/briefing.ts`, `enrichment.ts`, `question.ts`). The route.ts just dispatches to the right handler based on conversationType.
**Warning signs:** The route file exceeding 400 lines.

### Pitfall 3: Context Assembly Token Budget Overflow
**What goes wrong:** Pulling ALL project data sources (org knowledge, stories, questions, decisions, articles, transcripts) easily exceeds Claude's context window even with summarization.
**Why it happens:** D-13 says "draw from ALL project data" but context windows are finite.
**How to avoid:** D-14's two-pass strategy is the answer. First pass loads summaries only (compact). Second pass fetches full content only for the top-K most relevant items based on semantic similarity to the user's message. Budget allocation: ~500 tokens project summary, ~1000 token summaries across all sources, ~3000 tokens for full content of top matches. Total ~4500 tokens for context.
**Warning signs:** AI responses being slow or truncated, high token costs per message.

### Pitfall 4: QUESTION_SESSION Hybrid Trigger Logic
**What goes wrong:** The Inngest function for question answering needs to decide "simple vs. complex" but the threshold is ambiguous.
**Why it happens:** D-08 says "detect contradictions with existing decisions" but doesn't specify the detection algorithm.
**How to avoid:** Use the existing `flag_conflict` tool in the question-answering task. If the AI calls `flag_conflict` during background execution, that indicates a contradiction was found -> create an interactive session. If no conflict tool call -> answer is simple, write to DB and notify. The AI's own judgment is the "threshold."
**Warning signs:** All questions routing to interactive mode (AI is too cautious) or none routing there (AI misses real contradictions).

### Pitfall 5: Sidebar and Chat Area Layout Interaction
**What goes wrong:** The current chat pages render `ChatInterface` directly. Adding a sidebar requires restructuring the page layout without breaking existing URLs or functionality.
**Why it happens:** Phase 2 built a single-panel chat. Phase 10 adds a sidebar.
**How to avoid:** Create a `ChatLayout` wrapper that both `/chat/page.tsx` and `/chat/[conversationId]/page.tsx` use. The layout provides the sidebar, and the page provides the chat content as children. Use Next.js layout file (`chat/layout.tsx`) to share the sidebar across all chat routes.
**Warning signs:** Sidebar not persisting when navigating between conversations, full page reloads on conversation switch.

### Pitfall 6: Enrichment Session Accept/Reject Must Write to DB
**What goes wrong:** User accepts an enrichment suggestion but the story isn't actually updated.
**Why it happens:** The StoryDraftCards pattern creates new stories on accept. Enrichment updates *existing* story fields, which is a different write operation.
**How to avoid:** The "accept" action for enrichment must call a server action that updates the specific story field (e.g., acceptance criteria, description, components). Need a generic `applyEnrichmentSuggestion` server action that maps suggestion category to the right Prisma update.
**Warning signs:** Accepted suggestions showing green check but story data unchanged.

### Pitfall 7: General Chat Context vs Session Context
**What goes wrong:** The expanded context assembly (D-13/D-14) is applied to ALL sessions, making briefing and enrichment sessions slower than necessary.
**Why it happens:** Temptation to use the same smart retrieval for every session type.
**How to avoid:** Smart retrieval (semantic search + two-pass) should only apply to GENERAL_CHAT where the user's question is unpredictable. Task sessions (BRIEFING, ENRICHMENT, QUESTION) have known context requirements -- their task definitions should use purpose-specific context loaders that load exactly what's needed.
**Warning signs:** Task sessions taking 3+ seconds to start responding due to unnecessary search overhead.

## Code Examples

### Expanding Chat Route for New Session Types

```typescript
// In src/app/api/chat/route.ts -- dispatch pattern
// Source: existing pattern in route.ts lines 124-141

if (conversation.conversationType === "BRIEFING_SESSION") {
  systemPrompt = await buildBriefingSessionPrompt(projectId)
} else if (conversation.conversationType === "ENRICHMENT_SESSION") {
  const meta = (conversation.metadata ?? {}) as Record<string, string | undefined>
  systemPrompt = await buildEnrichmentSessionPrompt(projectId, meta.storyId!)
} else if (conversation.conversationType === "QUESTION_SESSION") {
  const meta = (conversation.metadata ?? {}) as Record<string, string | undefined>
  systemPrompt = await buildQuestionSessionPrompt(projectId, meta.questionId!)
} else {
  // General chat with smart retrieval
  const context = await assembleSmartChatContext(projectId, lastUserMessage)
  systemPrompt = buildChatSystemPrompt(context)
}
```
[VERIFIED: follows existing switch pattern in route.ts]

### Enrichment Suggestion Tool Definition

```typescript
// Follow exact pattern from create-story-draft.ts
// Source: src/lib/agent-harness/tools/create-story-draft.ts

export const createEnrichmentSuggestionTool: ClaudeToolDefinition = {
  name: "create_enrichment_suggestion",
  description: "Propose an improvement to the current user story.",
  input_schema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["ACCEPTANCE_CRITERIA", "DESCRIPTION", "COMPONENTS", "TECHNICAL_NOTES", "STORY_POINTS", "PRIORITY"],
        description: "Which aspect of the story to improve",
      },
      currentValue: { type: "string", description: "Current field value (or 'empty')" },
      suggestedValue: { type: "string", description: "Proposed improvement" },
      reasoning: { type: "string", description: "Why this improvement helps" },
    },
    required: ["category", "suggestedValue", "reasoning"],
  },
}
```
[ASSUMED: tool shape follows existing pattern, specific fields based on D-09 requirements]

### Smart Context Retrieval Two-Pass

```typescript
// Leverage existing search infrastructure
// Source: src/lib/search/global-search.ts, src/lib/search/embeddings.ts

async function assembleSmartChatContext(
  projectId: string,
  userMessage: string
): Promise<ChatContext> {
  // Pass 1: Load compact summaries from all sources
  const [projectSummary, questionSummaries, decisionSummaries, articleSummaries, storySummaries] =
    await Promise.all([
      getProjectSummary(projectId),
      getOpenQuestions(projectId, 20),
      getRecentDecisions(projectId),
      getArticleSummaries(projectId),
      getStorySummaries(projectId),   // NEW context loader needed
    ])

  // Pass 2: Semantic search to find most relevant full content
  const embedding = await generateEmbedding(userMessage)
  let relevantResults: SearchResult[] = []
  if (embedding) {
    // Use existing semantic search infrastructure
    const searchResults = await globalSearch(projectId, userMessage, { limit: 5 })
    relevantResults = flattenGroupedResults(searchResults)
  }

  // Compose within token budget
  return assembleWithBudget({
    projectSummary,
    questionSummaries,
    decisionSummaries,
    articleSummaries,
    storySummaries,
    relevantFullContent: relevantResults,
  }, TOKEN_BUDGET)
}
```
[VERIFIED: leverages existing `globalSearch`, `generateEmbedding`, `getArticleSummaries` functions]

### Conversation Archive Server Action

```typescript
// Follow existing safe-action pattern
// Source: src/actions/conversations.ts

const archiveConversationSchema = z.object({
  projectId: z.string().min(1),
  conversationId: z.string().min(1),
})

export const archiveConversation = actionClient
  .schema(archiveConversationSchema)
  .action(async ({ parsedInput: { projectId, conversationId } }) => {
    await getCurrentMember(projectId)
    const scoped = scopedPrisma(projectId)

    const conversation = await scoped.conversation.findFirst({
      where: { id: conversationId },
    })
    if (!conversation) throw new Error("Conversation not found")

    return prisma.conversation.update({
      where: { id: conversationId },
      data: { isArchived: true },
    })
  })
```
[VERIFIED: follows exact pattern from existing conversations.ts actions]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat chat page (Phase 2) | Sidebar + chat area layout (Phase 10) | Phase 10 | All chat routing now goes through ChatLayout |
| Limited general chat context (questions + decisions only) | Full project context with smart retrieval | Phase 10 | AI becomes genuinely knowledgeable about all project aspects |
| Only GENERAL_CHAT + STORY_SESSION + TRANSCRIPT_SESSION | All 6 session types implemented | Phase 10 | Complete session type coverage per PRD Section 6.2 |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/lib/agent-harness/ --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-06 | New task definitions produce valid output | unit | `npx vitest run tests/lib/agent-harness/briefing-generation.test.ts -x` | No - Wave 0 |
| D-08 | Question impact Inngest function routes simple vs complex | unit | `npx vitest run tests/lib/inngest/question-impact.test.ts -x` | No - Wave 0 |
| D-10 | Session auto-complete marks status correctly | unit | `npx vitest run tests/actions/conversations-lifecycle.test.ts -x` | No - Wave 0 |
| D-11 | Retry creates new session with same metadata | unit | `npx vitest run tests/actions/conversations-retry.test.ts -x` | No - Wave 0 |
| D-12 | Archive action sets isArchived, getConversations filters | unit | `npx vitest run tests/actions/conversations-archive.test.ts -x` | No - Wave 0 |
| D-14 | Smart retrieval stays within token budget | unit | `npx vitest run tests/lib/agent-harness/smart-retrieval.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/agent-harness/ tests/actions/conversations*.test.ts --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/agent-harness/briefing-generation.test.ts` -- covers D-06 (briefing task definition)
- [ ] `tests/lib/agent-harness/story-enrichment.test.ts` -- covers D-06 (enrichment task definition)
- [ ] `tests/lib/agent-harness/smart-retrieval.test.ts` -- covers D-14
- [ ] `tests/lib/inngest/question-impact.test.ts` -- covers D-08
- [ ] `tests/actions/conversations-lifecycle.test.ts` -- covers D-10, D-11, D-12

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Clerk auth via `getCurrentMember(projectId)` on all actions [VERIFIED: existing pattern] |
| V3 Session Management | no | Handled by Clerk |
| V4 Access Control | yes | `scopedPrisma(projectId)` ensures cross-project isolation [VERIFIED: existing pattern] |
| V5 Input Validation | yes | Zod schemas on all server actions via `next-safe-action` [VERIFIED: existing pattern] |
| V6 Cryptography | no | No new crypto needed |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-project conversation access | Information Disclosure | `scopedPrisma(projectId)` on all conversation queries [VERIFIED: existing] |
| Prompt injection via user message | Tampering | System prompt isolation via AI SDK + existing sanitization [VERIFIED: src/lib/agent-harness/sanitize.ts] |
| Conversation archive bypass | Tampering | Server-side `isArchived` filter, no client-trust [ASSUMED: standard pattern] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Enrichment suggestion tool shape uses category/currentValue/suggestedValue pattern | Code Examples | Medium -- tool invocation rendering would need adjustment, but follows established StoryDraftCards pattern |
| A2 | Smart retrieval token budget of ~4500 tokens is sufficient for project context | Pitfall 3 | Medium -- may need tuning based on real project data volume. Start conservative and increase. |
| A3 | Using AI's `flag_conflict` tool call as the "contradiction detected" threshold for QUESTION_SESSION routing | Pitfall 4 | Low -- this is the natural signal. Could add keyword heuristics as fallback. |
| A4 | Conversation `isArchived` field needs schema migration | Pitfall 1 | High -- if the field already exists somewhere else (it doesn't per schema grep), the migration would be unnecessary. Confirmed missing. |
| A5 | Next.js layout.tsx can share sidebar state across chat routes | Pattern 1 | Low -- standard Next.js App Router pattern, already used in project for dashboard layout. |

## Open Questions

1. **Token budget allocation for smart retrieval**
   - What we know: Existing `assembleContext` uses a total token budget with `charsToTokens()` estimation. Claude Sonnet has 200K context window.
   - What's unclear: Optimal budget split between project summary, summaries layer, and full-content layer. The current general chat context is very light (~500 tokens).
   - Recommendation: Start with 6000 token budget (project summary: 500, summaries: 1500, full content: 4000). Measure and adjust. Well within Claude's limits.

2. **Briefing output structure**
   - What we know: PRD Section 17.1 defines the briefing as having header metrics, recommended focus, blocking questions, current focus narrative.
   - What's unclear: Whether BRIEFING_SESSION should replicate the full dashboard briefing or provide a conversational summary.
   - Recommendation: Generate a conversational briefing that covers the same areas as the dashboard but in narrative form. The dashboard already exists for structured metrics. The chat briefing is for "tell me what's going on."

3. **Conversation sidebar data freshness**
   - What we know: New conversations created from other pages (dashboard, story detail) won't appear in sidebar until refreshed.
   - What's unclear: Whether to use SWR polling or optimistic update.
   - Recommendation: Use `router.refresh()` after session creation (server component re-renders). For cross-tab updates, SWR polling with 30s interval is sufficient.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified). Phase 10 is purely code/config changes building on the existing stack. All required tools (Prisma, AI SDK, Inngest, shadcn) are already installed and working.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/components/chat/` -- all 5 existing chat components examined
- Codebase analysis: `src/actions/conversations.ts` -- all existing server actions examined
- Codebase analysis: `src/app/api/chat/route.ts` -- full streaming route examined
- Codebase analysis: `src/lib/agent-harness/` -- engine, types, 3 task definitions, context assembly examined
- Codebase analysis: `src/lib/search/` -- global search and embeddings modules examined
- Codebase analysis: `prisma/schema.prisma` -- Conversation, ChatMessage models, ConversationType/ConversationStatus enums confirmed
- Phase 10 CONTEXT.md -- all 14 decisions
- Phase 10 UI-SPEC.md -- full component inventory and visual contracts
- Phase 2 CONTEXT.md -- D-12 through D-15 (chat), D-31 through D-35 (agent harness)

### Secondary (MEDIUM confidence)
- PRD v2.1 Section 6.2 -- task type definitions for briefing, question, enrichment
- PRD v2.1 Section 17.1 -- project briefing structure
- PRD v2.1 Section 8.2 -- chat model (general + task sessions)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything already in codebase
- Architecture: HIGH -- extending well-established patterns (agent harness, chat route, tool invocations)
- Pitfalls: HIGH -- identified from direct codebase analysis of what exists and what's missing
- UI patterns: HIGH -- detailed UI-SPEC already exists

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable -- building on mature internal patterns)
