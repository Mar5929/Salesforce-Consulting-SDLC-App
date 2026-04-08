# Phase 11: Agentic Chat with Database Awareness and Project Tool Use - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 11-agentic-chat-with-database-awareness-and-project-tool-use
**Areas discussed:** Phase 10 dependency, Tool repertoire, Database query scope, Session type behavior, Tool result rendering, Error and fallback behavior, System prompt strategy, Bulk operations, Multi-step workflows, Context panel updates, Conversation memory, Audit and undo

---

## Phase 10 Dependency

| Option | Description | Selected |
|--------|-------------|----------|
| Define 11 independently | Phase 11 is about giving the AI tools/actions in chat. Phase 10 can be defined separately later. | ✓ |
| Define both boundaries now | Clarify what Phase 10 covers vs Phase 11 right now. | |
| Merge 10 and 11 | Combine both into a single phase. | |

**User's choice:** Define 11 independently
**Notes:** None

---

## Tool Repertoire

| Option | Description | Selected |
|--------|-------------|----------|
| Read/query tools | Look up questions, stories, knowledge articles, etc. | ✓ |
| Write/create tools | Create questions, decisions, requirements, etc. | ✓ |
| Update/action tools | Update story status, assign questions, trigger processes. | ✓ |
| Analysis tools | Run sprint analysis, check conflicts, generate summaries. | ✓ |

**User's choice:** All four categories (multi-select)
**Notes:** "It should be able to understand the entire application schema in the web app and really understand it and be able to do anything, like create epics and features and stories and bugs, and update them. We should have hard checks that are not just instructions for deletion; any deletion needs explicit approval. It should be like a gate in the code."

### Follow-up: Deletion Safety Gate

| Option | Description | Selected |
|--------|-------------|----------|
| Inline confirmation card | AI proposes deletion, renders confirmation card with buttons. | |
| Two-step tool pattern | Propose_deletion then confirm_deletion — two distinct tool calls. | |
| You decide | Claude picks the best UX pattern. | ✓ |

**User's choice:** You decide

### Follow-up: Schema Awareness Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Tool-per-entity pattern | Granular tools for each entity with Zod validation. | ✓ |
| Generic SQL/query tool | General-purpose query tool against the database. | |
| Hybrid approach | Entity tools for writes, generic query for reads. | |

**User's choice:** Tool-per-entity (after Claude recommended it)
**Notes:** Claude recommended tool-per-entity for security, quality, token efficiency, existing patterns, and auditability. User confirmed.

---

## Database Query Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full CRUD for all | Every entity gets query/create/update/delete tools. | ✓ |
| Tiered approach | Core entities full CRUD, supporting entities limited. | |
| Start with read + create | Read and create only, update/delete in follow-up. | |

**User's choice:** Full CRUD for all

### Follow-up: Token Limits on Result Sets

| Option | Description | Selected |
|--------|-------------|----------|
| Smart pagination | Paginated results with total count. | |
| Summary + detail pattern | Summary views for lists, detail tool for specifics. | |
| You decide | Claude picks the best approach. | ✓ |

**User's choice:** You decide

---

## Session Type Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| All sessions get all tools | GENERAL_CHAT, TASK_SESSION, STORY_SESSION all get full repertoire. | ✓ |
| Context-appropriate tools | Tools curated per session type. | |
| General chat only | Only GENERAL_CHAT gets agentic tools. | |

**User's choice:** All sessions get all tools

### Follow-up: Role-Based Tool Gating

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, role-based tool gating | Tools respect same role permissions as the UI. | ✓ |
| No role gating on tools | Permissions inherited via server actions. | |
| You decide | Claude picks based on existing architecture. | |

**User's choice:** Yes, role-based tool gating

---

## Tool Result Rendering

| Option | Description | Selected |
|--------|-------------|----------|
| Structured cards | Styled cards/tables within chat for query results. | ✓ |
| AI-formatted text | AI formats results in markdown. | |
| Hybrid by entity | Key entities get cards, others are text. | |

**User's choice:** Structured cards

### Follow-up: Write Confirmation Rendering

| Option | Description | Selected |
|--------|-------------|----------|
| Action confirmation cards | Card with what was created/updated + link. | |
| Inline text confirmation | AI naturally confirms in text. | |
| You decide | Claude picks the best approach. | ✓ |

**User's choice:** You decide

---

## Error and Fallback Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Graceful AI recovery | Structured error to AI, AI explains and suggests alternatives. | |
| Error cards in chat | Failed tool calls render as error cards. | |
| You decide | Claude picks the best pattern. | ✓ |

**User's choice:** You decide

---

## System Prompt Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Lean prompt + tools | Minimal system prompt, AI queries on demand. | |
| Rich prompt + tools | Keep current context assembly AND add tools. | |
| You decide | Claude picks optimal balance. | ✓ |

**User's choice:** You decide

---

## Bulk Operations

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, batch tools | Batch variants accepting arrays for efficiency. | ✓ |
| Sequential tool calls | Individual tools called in a loop. | |
| You decide | Claude picks based on AI SDK patterns. | |

**User's choice:** Yes, batch tools

---

## Multi-step Workflows (auto-resolved)

**Auto-selected:** Bounded chains — max 15 tool calls per response turn.
**Rationale:** Prevents runaway loops while allowing meaningful multi-step workflows. AI warns when approaching limit.

---

## Context Panel Updates (auto-resolved)

**Auto-selected:** Live updates via SWR revalidation.
**Rationale:** Leverages existing SWR polling pattern without requiring WebSockets.

---

## Conversation Memory (auto-resolved)

**Auto-selected:** Natural message history — AI SDK includes prior tool calls in conversation context automatically.
**Rationale:** No additional infrastructure needed. Works out of the box.

---

## Audit and Undo (auto-resolved)

**Auto-selected:** Audit trail yes (via SessionLog), undo deferred.
**Rationale:** Undo adds significant complexity. Deletion confirmation gate prevents the most dangerous irreversible actions.

---

## Claude's Discretion

- Deletion confirmation UX pattern
- Result set management and pagination strategy
- Write/update confirmation rendering
- Error handling and recovery patterns
- System prompt size and content balance
- Tool input/output schema design
- Card component designs for entity types
- Tool description text optimization

## Deferred Ideas

- Undo capability (soft-delete, state snapshots) — future phase
- Phase 10 (Chat Session Management) — separate phase
- Generic SQL query tool — consider if tool-per-entity proves limiting
