# Phase 10: Chat Session Management and Conversation Intelligence - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the chat system's missing capabilities: conversation browsing/management UI, implement remaining session types (BRIEFING_SESSION, QUESTION_SESSION, ENRICHMENT_SESSION), session lifecycle management, and upgrade context assembly so the chat acts as a knowledgeable project assistant with access to the full project brain (org knowledge, stories, questions, transcripts, decisions, knowledge articles).

**Vision:** The chat is a personal assistant for all project team members — like having a senior architect + PM + BA available 24/7 who knows everything about the project's Salesforce org, outstanding work, decisions, and discovery context.

**Phase 11 boundary:** Agentic tool use (creating epics, stories, bugs, questions from chat) is Phase 11 scope. Phase 10 provides the session infrastructure and context intelligence that Phase 11 builds on.

</domain>

<decisions>
## Implementation Decisions

### Conversation History UX
- **D-01:** Chat page gets a left sidebar showing conversation list (ChatGPT-style). General chat pinned at top. Clicking a session loads it in the main area. Current sidebar "Chat" link behavior preserved — users still land in a chat context.
- **D-02:** Conversation list organized with tab bar: All | Stories | Briefings | Transcripts | Questions. Follows existing Linear/Vercel aesthetic pattern used in stories and questions views.
- **D-03:** Inline search bar at top of conversation list that filters by title/content. Immediate results within the chat section.
- **D-04:** Conversations sorted by most recent activity. Hover reveals actions: rename, archive, delete. Right-click context menu for additional options.
- **D-05:** Both source-context creation (e.g., "Generate Stories" from epic page) AND a "+ New" shortcut button in the conversation sidebar for power users who know what session type they want.

### Remaining Session Types
- **D-06:** All three unimplemented session types (BRIEFING_SESSION, QUESTION_SESSION, ENRICHMENT_SESSION) implemented in Phase 10. Each needs an agent harness task definition, context assembly, UI entry point, and tool definitions.
- **D-07:** BRIEFING_SESSION launched from a "Generate Briefing" button on the discovery dashboard. Session opens in the chat area with AI-generated briefing. Read-only across all project data per PRD Section 6.2.
- **D-08:** QUESTION_SESSION uses hybrid approach — background Inngest job for simple question answers (no contradictions). Interactive chat session auto-triggers only when contradictions with existing decisions or complex cross-entity impact detected. This lets the user resolve conflicts conversationally.
- **D-09:** ENRICHMENT_SESSION triggered from story detail page via "Enrich with AI" button. AI reads story context, epic, org components, and decisions, then suggests improvements as card-based accept/reject flow (same pattern as StoryDraftCards in STORY_SESSION). Minimal typing — user just accepts/rejects suggestions.

### Session Lifecycle Management
- **D-10:** Task sessions auto-complete when their purpose is fulfilled (briefing generated, story enriched, question impact assessed). General chat never completes — it's always ACTIVE. User can also manually complete any session.
- **D-11:** FAILED sessions (API timeout, browser close, etc.) shown in conversation list with red status badge. "Retry" action creates a new session of the same type with the same context. Old session becomes read-only for audit trail. Artifacts written before failure are preserved in DB.
- **D-12:** Archive only, no delete. Users can archive conversations to hide from default list. Archived sessions accessible via filter toggle. No permanent deletion — audit trail preserved per PRD ("All conversations persist permanently").

### Chat Context Assembly (Project Assistant Intelligence)
- **D-13:** Chat draws from ALL project data sources to act as a knowledgeable assistant: org knowledge base (OrgComponents, business processes, domain groupings), stories and sprint state, knowledge articles, transcripts and decisions, questions and outstanding items. The AI should be able to answer questions about any aspect of the project.
- **D-14:** Smart retrieval to handle context window limits. AI uses semantic search + keyword matching to pull only the most relevant data for each user question. Two-pass strategy: load summaries first, then full content for top matches. Stays within token budget. Builds on existing agent harness two-pass retrieval pattern from Phase 2 (D-19, D-33).

### Claude's Discretion
- Conversation list row density and metadata display (compact vs rich cards)
- Conversation sidebar width, collapse behavior, and responsive layout
- "+ New" session creation flow (dropdown type picker, context selection steps)
- Tab bar styling and interaction (underline tabs, pill tabs, etc.)
- Briefing session output format and structure
- QUESTION_SESSION threshold for "complex impact" that triggers interactive mode vs background
- ENRICHMENT_SESSION suggestion card design and grouping
- Auto-complete detection logic per session type
- Context assembly ranking/relevance algorithm details
- Token budget allocation across data sources in smart retrieval
- Empty states for conversation list, tabs with no sessions, archived view
- Retry flow UX details (confirmation dialog, context carry-over)

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product requirements
- `archive/SF-Consulting-AI-Framework-PRD-v2.1.md` — Section 6.2 (task types: Briefing Generation, Question Answering, Story Enrichment), Section 8.2 (chat model: general chat + task sessions, context strategy), Section 17.1 (project briefing daily view)

### Technical architecture
- `SESSION-3-TECHNICAL-SPEC.md` — Database schema for Conversation, ChatMessage, SessionLog. Agent harness three-layer architecture. Context window budget allocation.

### Phase 2 context (chat system foundation)
- `.planning/phases/02-discovery-and-knowledge-brain/02-CONTEXT.md` — D-12 through D-15 (chat interface decisions), D-31 through D-35 (agent harness decisions). Phase 10 builds on these — do not contradict.

### Existing chat implementation
- `src/components/chat/chat-interface.tsx` — Current ChatInterface component with GENERAL_CHAT, TASK_SESSION, STORY_SESSION, TRANSCRIPT_SESSION variants
- `src/actions/conversations.ts` — Server actions: getOrCreateGeneralChat, createConversation, getConversation, getConversations, initiateStorySession, getSessionTokenTotals, saveMessage
- `src/app/api/chat/route.ts` — Chat API route with streaming, tool calls for STORY_SESSION
- `src/app/(dashboard)/projects/[projectId]/chat/page.tsx` — General chat page
- `src/app/(dashboard)/projects/[projectId]/chat/[conversationId]/page.tsx` — Task session page with type routing

### Agent harness (context assembly)
- `src/lib/agent-harness/context/chat-context.ts` — Current assembleGeneralChatContext and buildChatSystemPrompt. Phase 10 expands these to include all project data sources.

### Schema
- `prisma/schema.prisma` — ConversationType enum (BRIEFING_SESSION, QUESTION_SESSION, ENRICHMENT_SESSION defined but unimplemented), ConversationStatus enum (ACTIVE, COMPLETE, FAILED), Conversation and ChatMessage models

### Existing patterns to follow
- `src/components/chat/story-draft-cards.tsx` — Card-based accept/reject pattern for STORY_SESSION. Reuse for ENRICHMENT_SESSION suggestions.
- `src/lib/inngest/events.ts` — Event definitions for background jobs
- `src/lib/safe-action.ts` — Server action pattern with auth middleware
- `src/lib/project-scope.ts` — scopedPrisma() for project-scoped queries

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/chat/chat-interface.tsx` — ChatInterface component with variant support. Extend with conversation sidebar.
- `src/components/chat/story-draft-cards.tsx` — Card-based accept/reject pattern. Reuse for ENRICHMENT_SESSION.
- `src/components/chat/token-display.tsx` — Token/cost display component.
- `src/actions/conversations.ts` — getConversations() already returns all project conversations sorted by recency. Foundation for conversation list.
- `src/lib/agent-harness/` — Three-layer agent harness (task definitions, execution engine, context assembly). Add new task definitions for briefing, question impact, enrichment.

### Established Patterns
- Vercel AI SDK `useChat` hook for streaming chat (Phase 2 D-13)
- Server actions via `next-safe-action` with Clerk auth middleware
- Inngest background jobs for async processing
- StoryDraftCards tool invocation pattern for session-specific card UI
- Project-scoped data access via `scopedPrisma(projectId)`
- Linear/Vercel minimal aesthetic (Phase 1 D-04)
- Tab-based views (used in stories, questions)

### Integration Points
- Chat page layout needs conversation sidebar added alongside ChatInterface
- Agent harness needs new task definitions: briefing generation, question impact assessment, story enrichment
- Context assembly needs expansion: add org knowledge, stories, sprints, knowledge articles, transcripts to chat context
- Dashboard needs "Generate Briefing" button entry point
- Story detail page needs "Enrich with AI" button entry point
- Inngest needs QUESTION_SESSION trigger logic (detect contradiction threshold)

</code_context>

<specifics>
## Specific Ideas

- Chat is a personal assistant — like having a senior architect + PM + BA available 24/7 who knows everything about the project
- Conversation sidebar follows ChatGPT-style left panel with pinned general chat
- ENRICHMENT_SESSION uses same card-based accept/reject as StoryDraftCards — minimal typing
- QUESTION_SESSION is hybrid: background for simple answers, interactive only for contradictions
- Phase 11 builds on Phase 10's session infrastructure to add agentic capabilities (create epics, stories, bugs from chat)

</specifics>

<deferred>
## Deferred Ideas

- **Agentic tool use in chat** — AI creating epics, stories, bugs, questions from conversation. Phase 11 scope.
- **Proactive AI-triggered enrichment** — AI detects story gaps and suggests enrichment without user initiating. Phase 11 scope.
- **Role-based context prioritization** — Different roles get different default context (SA = org knowledge, PM = sprint state, etc.). Could enhance smart retrieval but not required for V1.
- **Cross-session topic summaries and conversation analytics** — AI-derived insights across conversation history. Belongs in domain-specific areas (dashboard, knowledge), not the chat itself.

</deferred>

---

*Phase: 10-chat-session-management-and-conversation-intelligence*
*Context gathered: 2026-04-08*
