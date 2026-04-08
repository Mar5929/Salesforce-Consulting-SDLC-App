# Phase 11: Agentic Chat with Database Awareness and Project Tool Use - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade the existing chat interface from simple Q&A with static context to a fully agentic AI assistant that can actively query the database, look up project entities, create/update/delete records, and perform actions during conversations — making the AI a true project collaborator with full CRUD capabilities across the entire data model, gated by role permissions and hard-coded deletion confirmation.

</domain>

<decisions>
## Implementation Decisions

### Tool Architecture
- **D-01:** Tool-per-entity pattern — create granular Vercel AI SDK `tool()` definitions for each entity (epics, features, stories, questions, decisions, requirements, risks, knowledge articles, sprints, defects, test cases, org components, business processes, documents, conversations). Tool input schemas implicitly teach the AI the data model. More structured, easier to gate permissions.
- **D-02:** Full CRUD for all entities — every entity gets query, create, update, and delete tools. The AI can do everything a user can do through the web app.
- **D-03:** Batch tool variants — include batch versions of tools (e.g., `create_stories` accepts an array) for efficiency when the AI needs to create/update multiple entities in one request (e.g., "create 5 stories for this epic").
- **D-04:** Tools use the existing server actions and data access layer under the hood — tools call into the same validated, permission-checked code paths that the UI uses.

### Deletion Safety Gate
- **D-05:** Hard-coded deletion confirmation gate — any delete operation requires explicit user confirmation at the code level, not just AI prompt instructions. This is a structural gate in the tool execution layer that cannot be bypassed by prompt injection or AI reasoning.
- **D-06:** Claude's Discretion on the UX pattern for deletion confirmation (inline confirmation card vs. two-step tool pattern).

### Database Query Scope
- **D-07:** Claude's Discretion on result set management — smart pagination with summary-first pattern (return summary fields for lists, detail tool for full entity) vs. simple pagination. Optimize for token efficiency.

### Role-Based Tool Gating
- **D-08:** Tool availability is gated by user role — same permissions as the web app UI. If a BA can't delete stories in the web app, the AI can't do it for them either. Enforced at the tool execution layer, not just the AI prompt.
- **D-09:** Role permissions map: tools respect AUTH-03 role definitions (SA, PM, BA, Developer, QA) and existing server action permission checks.

### Session Type Behavior
- **D-10:** All interactive chat sessions (GENERAL_CHAT, TASK_SESSION, STORY_SESSION) get the full tool repertoire. The AI decides which tools are relevant based on conversation context. TRANSCRIPT_SESSION remains non-interactive.
- **D-11:** Phase 11 is defined independently of Phase 10. No dependency on Phase 10 being complete — the agentic tools work with the existing conversation infrastructure.

### Tool Result Rendering
- **D-12:** Structured cards for query results — entity-specific card components render in chat when the AI queries data (story cards, question cards, epic cards, etc.). Similar to existing StoryDraftCards pattern.
- **D-13:** Claude's Discretion on write/update confirmation rendering (action confirmation cards vs. inline text).

### Error and Fallback Behavior
- **D-14:** Claude's Discretion on error handling pattern — graceful AI recovery (structured error returned to AI, AI explains and suggests alternatives) is the recommended direction.

### System Prompt Strategy
- **D-15:** Claude's Discretion on system prompt size — balance between upfront context (project summary, key stats) and on-demand retrieval via tools. Recommended direction: lean prompt with tool descriptions + minimal project orientation, letting the AI pull data as needed.

### Multi-step Workflows
- **D-16:** Bounded tool call chains — max 15 tool calls per AI response turn. Prevents runaway loops while allowing meaningful multi-step workflows (create epic → generate stories → assign to sprint). AI warns when approaching the limit and summarizes progress. (auto-selected)

### Context Panel Updates
- **D-17:** Live context panel updates via SWR revalidation — when a tool call mutates data, the context panel's SWR hooks revalidate to show newly created/modified entities immediately. Leverages existing SWR polling pattern. (auto-selected)

### Conversation Memory
- **D-18:** Natural message history — the AI SDK includes prior tool calls and results in conversation context automatically. "Update the story I just created" works because the prior tool result (with entity ID) is in the message history. No additional infrastructure needed. (auto-selected)

### Audit Trail
- **D-19:** Audit trail via SessionLog — all tool calls logged with inputs, outputs, timestamps, and session linkage using the existing SessionLog model. A "show what AI changed" capability can query this log. Undo is deferred to a future phase. (auto-selected)

### Claude's Discretion
- Deletion confirmation UX pattern (D-06)
- Result set management and pagination strategy (D-07)
- Write/update confirmation rendering (D-13)
- Error handling and recovery patterns (D-14)
- System prompt size and content balance (D-15)
- Exact tool input/output schemas for each entity
- Card component designs for each entity type in chat
- Tool description text optimization for AI comprehension
- Loading states for tool execution in chat UI

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Chat Infrastructure
- `src/app/api/chat/route.ts` — Current chat API route with streaming, tool support (STORY_SESSION only), message persistence
- `src/components/chat/chat-interface.tsx` — Main chat component using `useChat` hook with `DefaultChatTransport`
- `src/components/chat/message-bubble.tsx` — Message rendering including tool call results (StoryDraftCards)

### Agent Harness
- `src/lib/agent-harness/types.ts` — Core types: TaskType, ExecutionMode, AmbiguityMode, ClaudeToolDefinition
- `src/lib/agent-harness/tools/` — 7 existing tools (answer-question, create-decision, create-question, create-requirement, create-risk, create-story-draft, flag-conflict) using Anthropic SDK format
- `src/lib/agent-harness/tool-executor.ts` — Tool execution layer
- `src/lib/agent-harness/engine.ts` — Execution engine with retry logic, token tracking

### Context Assembly
- `src/lib/agent-harness/context/chat-context.ts` — Current minimal context assembly (project summary, open questions, recent decisions)
- `src/lib/agent-harness/context/index.ts` — Context assembly exports
- `src/lib/agent-harness/context/` — 12 context loaders (project-summary, questions, decisions, stories-context, epics-features, org-components, business-processes, article-summaries, sprint-stories, blocking-relationships, stories-in-sprint)

### Data Layer
- `prisma/schema.prisma` — Full data model defining all entities that need tools
- `src/lib/project-scope.ts` — Project-scoped Prisma queries (security boundary)
- `src/lib/auth.ts` — Role-based permission checks (getCurrentMember)

### Prior Phase Decisions
- `.planning/phases/02-discovery-and-knowledge-brain/02-CONTEXT.md` — Chat interface decisions (D-12 through D-15), agent harness decisions (D-31 through D-35)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useChat` hook + `DefaultChatTransport` — already wired for streaming chat with tool support
- `StoryDraftCards` — existing pattern for rendering tool call results as interactive cards in chat
- `message-bubble.tsx` — handles tool call rendering, can be extended for new tool result types
- 7 agent harness tools — logic can be adapted from Anthropic SDK format to Vercel AI SDK `tool()` format
- 12 context loaders — can be repurposed as tool implementations (e.g., `getStoriesContext` → `query_stories` tool)
- Server actions in `src/actions/` — existing validated CRUD operations that tools can call into

### Established Patterns
- Vercel AI SDK v6 with `streamText`, `tool()`, `convertToModelMessages`, `toUIMessageStreamResponse()`
- Tool calls stored in `ChatMessage.toolCalls` JSON field for rendering
- `scopedPrisma(projectId)` for project-scoped database queries
- `getCurrentMember(projectId)` for role-based permission checks
- SWR for client-side data fetching with `refreshInterval` polling

### Integration Points
- `src/app/api/chat/route.ts` — tools need to be registered here per conversation type
- `src/components/chat/message-bubble.tsx` — new card components need rendering logic here
- `src/lib/agent-harness/tools/` — new tools built here, adapted to Vercel AI SDK format
- `src/components/chat/context-panel.tsx` — SWR revalidation triggers for live updates

</code_context>

<specifics>
## Specific Ideas

- The AI should understand the entire application schema and "be able to do anything" — full CRUD across all entities
- Deletion must have hard checks in code, not just prompt instructions — "a gate in the code" that prevents deletion without explicit user approval
- This is about making the AI a genuine project collaborator, not just a Q&A bot

</specifics>

<deferred>
## Deferred Ideas

- **Undo capability** — ability to reverse AI actions. Requires soft-delete, state snapshots, or event sourcing. Deferred to future phase.
- **Phase 10 (Chat Session Management)** — session listing, filtering, archiving, renaming, conversation intelligence. Separate phase, defined independently.
- **Generic SQL query tool** — a flexible read-only query tool for ad-hoc lookups. Consider if tool-per-entity proves too limiting.

</deferred>

---

*Phase: 11-agentic-chat-with-database-awareness-and-project-tool-use*
*Context gathered: 2026-04-08*
