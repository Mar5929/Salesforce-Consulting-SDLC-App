# Phase 10: Chat Session Management and Conversation Intelligence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 10-chat-session-management-and-conversation-intelligence
**Areas discussed:** Conversation history UX, Remaining session types, Session lifecycle management, Conversation intelligence (rescoped to Chat context assembly)

---

## Conversation History UX

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped by type | Sections for General Chat, Story Sessions, etc. with expand/collapse | |
| Chronological list | Single flat list sorted by most recent activity | |
| Tabbed by type | Tab bar at top (All, Stories, Briefings, etc.) | ✓ (Claude recommendation) |

**User's choice:** Tabbed by type (accepted Claude's recommendation)
**Notes:** Follows existing Linear/Vercel aesthetic pattern used in stories and questions views.

| Option | Description | Selected |
|--------|-------------|----------|
| Rich cards | Two-line layout with metadata row beneath title | |
| Compact rows | Single-line density like Linear issues list | |
| You decide | Claude picks density based on existing patterns | ✓ |

**User's choice:** Claude's discretion

| Option | Description | Selected |
|--------|-------------|----------|
| Inline search on list page | Search bar at top filtering by title/content | ✓ |
| Global Cmd+K only | Conversations in global search only | |
| Both | Inline + global search | |

**User's choice:** Inline search on list page

| Option | Description | Selected |
|--------|-------------|----------|
| Replace sidebar Chat link | Sidebar Chat goes to conversation list page | |
| Split sidebar items | Separate Chat and Sessions links | |
| Chat landing with sidebar | Chat page gets left sidebar with conversation list | ✓ (Claude recommendation) |

**User's choice:** Chat landing with sidebar (accepted Claude's recommendation)
**Notes:** Most intuitive pattern (ChatGPT, Claude.ai). Preserves one-click-to-chat workflow.

| Option | Description | Selected |
|--------|-------------|----------|
| Recent activity + hover actions | Sorted by last message time, hover reveals rename/archive/delete | ✓ |
| Pinned + recent | General chat pinned, then active/completed sections | |
| You decide | Claude picks | |

**User's choice:** Recent activity + hover actions

| Option | Description | Selected |
|--------|-------------|----------|
| Source context only | Sessions created from their natural trigger point only | |
| New session button in sidebar | + New button for direct creation | |
| Both paths | Source context + sidebar shortcut | ✓ |

**User's choice:** Both paths

---

## Remaining Session Types

| Option | Description | Selected |
|--------|-------------|----------|
| All three | BRIEFING, QUESTION, ENRICHMENT | ✓ |
| Briefing only | Highest value first | |
| Briefing + Question | Two of three | |

**User's choice:** All three

| Option | Description | Selected |
|--------|-------------|----------|
| From the dashboard | Generate Briefing button on discovery dashboard | ✓ |
| From the chat sidebar | + New button in conversation sidebar | |
| Both + auto-trigger | Dashboard, sidebar, and auto-generate daily | |

**User's choice:** From the dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Interactive chat session | AI walks through impact interactively | |
| Background job | AI posts findings as structured data silently | |
| Hybrid | Background for simple, interactive for contradictions | ✓ |

**User's choice:** Hybrid approach
**Notes:** User needed clarification on what "question impact analysis" meant. Explained with CPQ pricing example showing unblocked stories, contradiction with existing decision, and new questions raised.

| Option | Description | Selected |
|--------|-------------|----------|
| Manual from story detail | Enrich with AI button, card-based accept/reject | ✓ (Claude recommendation) |
| Bulk from story list | Select multiple, enrich in batch | |
| Both | Single + bulk | |

**User's choice:** Manual from story detail (accepted Claude's recommendation)
**Notes:** User shared Phase 11 vision — agentic chat that can create epics, stories, bugs, questions. Stories often created via chat. Minimal manual typing is the goal. Claude recommended Phase 10 sets up session plumbing, Phase 11 upgrades with agentic tool use.

---

## Session Lifecycle Management

| Option | Description | Selected |
|--------|-------------|----------|
| Manual completion only | User explicitly marks complete | |
| Auto-complete + manual | Task sessions auto-complete when purpose fulfilled, plus manual option | ✓ |
| You decide | Claude picks | |

**User's choice:** Auto-complete + manual

| Option | Description | Selected |
|--------|-------------|----------|
| Show with retry action | Red badge, Retry creates new session with same context | ✓ |
| Hide by default | Filtered out, available via toggle | |
| You decide | Claude picks | |

**User's choice:** Show with retry action
**Notes:** User needed clarification on what "failed sessions" means. Explained with examples: API timeout during transcript processing, browser close during briefing generation.

| Option | Description | Selected |
|--------|-------------|----------|
| Archive only, no delete | Archive hides from list, accessible via filter, no permanent deletion | ✓ |
| Soft delete | Hidden in UI, retained in DB, recoverable by admin | |
| No archive or delete | Everything always visible | |

**User's choice:** Archive only, no delete

---

## Conversation Intelligence (Rescoped)

**Original scope:** AI-derived insights from conversation history (topic clustering, knowledge gap detection, cross-session summaries, health metrics).

**User's input:** The chat's purpose is to be a personal assistant who knows everything about the project — like a senior architect + PM + BA available 24/7. AI-derived analytics belong in the domain-specific areas of the app (dashboard, knowledge base), not baked into the chat itself. Phase 11 adds agentic capabilities (creating epics, stories, bugs from chat).

**Rescoped to:** Improving chat context assembly so the AI draws from all project data sources (org knowledge, stories, sprints, questions, transcripts, decisions, knowledge articles) and uses smart retrieval to stay within token budgets.

| Option | Description | Selected |
|--------|-------------|----------|
| All data sources | Org knowledge, stories, sprints, knowledge articles, transcripts, decisions, questions | ✓ |

**User's choice:** All data sources — full project brain

| Option | Description | Selected |
|--------|-------------|----------|
| Smart retrieval | Semantic search + keyword matching, two-pass (summaries then detail) | ✓ |
| Role-based context | Different defaults per role + smart retrieval | |
| You decide | Claude designs strategy | |

**User's choice:** Smart retrieval (recommended)

---

## Claude's Discretion

- Conversation list row density and metadata display
- Conversation sidebar width, collapse behavior, responsive layout
- "+ New" session creation flow details
- Tab bar styling
- Briefing output format and structure
- QUESTION_SESSION contradiction threshold
- ENRICHMENT_SESSION suggestion card design
- Auto-complete detection logic per session type
- Context assembly ranking/relevance algorithm
- Token budget allocation across data sources
- Empty states, retry flow UX details

## Deferred Ideas

- Agentic tool use in chat (Phase 11)
- Proactive AI-triggered enrichment (Phase 11)
- Role-based context prioritization (future enhancement)
- Cross-session topic summaries and conversation analytics (domain-specific areas, not chat)
