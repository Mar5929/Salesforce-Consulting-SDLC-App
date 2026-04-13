# Phase 2 Spec: Agent Harness, Transcripts

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [02-agent-harness-gaps.md](./02-agent-harness-gaps.md)
> Depends On: Phase 1 (RBAC, Security, Governance)
> Status: Draft
> Last Updated: 2026-04-10

---

## 1. Scope Summary

Harden the AI agent harness engine, fix tool bugs, complete Layer 3 context assembly, add rate limiting, enrich chat and transcript context, and build the "Needs Review" session-end UX. This phase makes the existing harness correct, robust, and cost-safe before downstream phases build on it.

**In scope:** 10 of 13 domain gaps → 10 work items
**Moved out:**
- GAP-AGENT-001 (STATUS_REPORT_GENERATION) → Phase 8. Status reports are a document type variant — Phase 8 builds the document generation infrastructure.
- GAP-AGENT-002 (CONTEXT_PACKAGE_ASSEMBLY) → Phase 5. Context packages are deterministic data assembly, not an AI task. Phase 5 builds it as a direct function + REST endpoint with no harness involvement.
- GAP-AGENT-005 (prompt injection defense) → Already covered by Phase 1 REQ-RBAC-012.
- GAP-AGENT-008 notification wiring (80% threshold alerts, firm-wide alerts) → Phase 8. Needs notification infrastructure.

---

## 2. Functional Requirements

### 2.1 Tool Bug Fix (REQ-HARNESS-001)

- **What it does:** Fixes `create_question` tool to persist `confidence`, `needsReview`, and `reviewReason` fields to the database — matching the behavior of `create_decision`, `create_requirement`, and `create_risk`.
- **Inputs:** AI calls `create_question` with confidence/needsReview/reviewReason in the tool input
- **Outputs:** Question record created with all three fields populated
- **Business rules:** The other 3 entity tools already do this correctly. This is an isolated inconsistency in one tool. Blocks the Needs Review UX (REQ-HARNESS-010) since questions need correct flags.
- **File:** `src/lib/agent-harness/tools/create-question.ts` (~line 128, `prisma.question.create`)

### 2.2 Output Validation Re-Prompt Loop (REQ-HARNESS-002)

- **What it does:** When `outputValidator` returns `{valid: false, corrections: [...]}`, the engine re-prompts Claude with the correction instructions as a follow-up message, up to `maxRetries` attempts.
- **Inputs:** Any task execution where the AI produces structurally invalid output (e.g., briefing missing required sections, dashboard synthesis with invalid JSON)
- **Outputs:** Corrected output after re-prompting, or best-effort output with `validation.valid: false` attached after exhausting retries
- **Business rules:** `maxRetries` on TaskDefinition controls the limit (default 2). Each re-prompt sends the `corrections[]` array as a user message. After exhausting retries, return the last output — don't throw. The caller decides whether to use invalid output. This is distinct from the API retry logic in `callWithRetry` (which handles rate limits/overloaded errors).
- **File:** `src/lib/agent-harness/engine.ts` (~lines 286-290, after `outputValidator` call)

### 2.3 Firm Typographic Rules (REQ-HARNESS-003)

- **What it does:** Enforces firm-level typographic rules on every AI output via two layers:
  1. **Prompt addendum** — Injected into every system prompt by `buildSystemPrompt`. Tells Claude upfront: no em dashes (use hyphens), no AI-characteristic phrases ("Certainly!", "Great question!", "I'd be happy to"), consistent date format (Month DD, YYYY), Salesforce terminology ("custom object" not "custom entity").
  2. **Post-processing function** — Regex-based cleanup on the final AI output. Replaces em dashes (—) with hyphens (-), strips known AI phrases, normalizes date formats. Safety net for what the prompt didn't prevent.
- **Inputs:** Every AI-generated text output from any task type
- **Outputs:** Clean text conforming to firm standards
- **Business rules:** Post-processing is cosmetic only — never alter entity names, technical terms, Salesforce API names, or quoted text within backticks/quotes. Rules are hardcoded in V1 per PRD Section 6.3.
- **File to create:** `src/lib/agent-harness/firm-rules.ts`
- **File to modify:** `src/lib/agent-harness/engine.ts` (`buildSystemPrompt` + post-processing before return)

### 2.4 SessionLog Entity Tracking (REQ-HARNESS-004)

- **What it does:** Populates `SessionLog.entitiesCreated` and `SessionLog.entitiesModified` with arrays of `{entityType, entityId}` for every entity the session's tool calls created or modified.
- **Inputs:** Tool execution results during any harness session
- **Outputs:** SessionLog record with populated entity tracking fields
- **Business rules:** Each tool's execute function returns a standardized tracking shape: `{entityType: string, entityId: string, action: "created" | "modified"}`. The engine accumulates these across all tool calls in the session and writes them to the SessionLog at the end. Tools that don't return tracking data (legacy or read-only) are treated as empty — backwards compatible.
- **File:** `src/lib/agent-harness/engine.ts` (tool execution loop + SessionLog.create call)
- **Files to modify:** All tool execute functions in `src/lib/agent-harness/tools/` to return tracking data

### 2.5 Rate Limiting Enforcement Core (REQ-HARNESS-005)

- **What it does:** Adds pre-invocation checks to `executeTask` that enforce two limits:
  1. **Per-consultant daily limit** — Count today's SessionLog entries for this userId. Default: 100/day.
  2. **Per-project monthly cost cap** — Sum `inputTokens + outputTokens` from SessionLog for the current calendar month for this project, multiply by model cost constant. Default cap: configurable per project.
- **Inputs:** Every `executeTask` call
- **Outputs:** Either proceeds with execution, or returns HTTP 429 with a descriptive message explaining which limit was hit
- **Business rules:** Limits are checked before the Claude API call (fail fast, don't waste money). Daily limit uses UTC midnight. Monthly cost uses a model cost constant ($3/M input, $15/M output for Sonnet — stored as config, not hardcoded). Default daily limit and monthly cap are stored on the Project model (nullable — null means unlimited). 80% threshold notifications are deferred to Phase 8.
- **File to create:** `src/lib/agent-harness/rate-limiter.ts`
- **File to modify:** `src/lib/agent-harness/engine.ts` (pre-invocation check at top of `executeTask`)
- **Schema change:** Add `aiDailyLimit Int?` and `aiMonthlyCostCap Decimal?` to Project model

### 2.6 Layer 3 Context Functions (REQ-HARNESS-006)

- **What it does:** Implements two missing Layer 3 context assembly functions:
  1. `getRecentSessions(projectId, limit)` — Queries SessionLog for the N most recent entries. Returns: taskType, timestamp, token counts, entity summary (from entitiesCreated once REQ-HARNESS-004 is done).
  2. `getMilestoneProgress(projectId)` — Queries milestones with computed completion percentage from linked story statuses (count of DONE stories / total linked stories).
- **Inputs:** projectId (both), limit (getRecentSessions, default 5)
- **Outputs:** Formatted context strings suitable for injection into system prompts
- **Business rules:** These are read-only query functions in the Layer 3 context assembly layer. They must return compact summaries that fit within context window budgets (target: <1K tokens each).
- **Files to create:** `src/lib/agent-harness/context/recent-sessions.ts`, `src/lib/agent-harness/context/milestone-progress.ts`
- **File to modify:** `src/lib/agent-harness/context/index.ts` (export new functions)

### 2.7 Transcript Context Enrichment (REQ-HARNESS-007)

- **What it does:** Adds `getRecentSessions` and `getArticleSummaries` to the transcript processing context loader's `Promise.all` call.
- **Inputs:** Transcript processing task invocation
- **Outputs:** Context window now includes recent session summaries (for continuity, reducing duplicate extractions) and article summaries (so AI can flag stale articles inline)
- **Business rules:** `getArticleSummaries` may already exist in the context layer — wire it in if present, note for Phase 6 if not. Recent sessions give the AI awareness of what was extracted in prior runs, reducing the chance of creating duplicate questions across separate transcript processing sessions.
- **File:** `src/lib/agent-harness/tasks/transcript-processing.ts` (~lines 22-57, `transcriptContextLoader`)

### 2.8 Story Generation Context Expansion (REQ-HARNESS-008)

- **What it does:** Expands the story generation context loader to include: `getEpicContext`, `getAnsweredQuestions(scopeEpicId)`, `getDecisionsForEpic`, `getOrgComponentsForEpic`. Optionally wire `getBusinessProcesses` and `getRelevantArticles` if they exist — note the gap for Phase 6 if they don't.
- **Inputs:** Story generation task invocation with `metadata.epicId`
- **Outputs:** Context window includes answered discovery questions, scoped decisions, and org components for the target epic — the primary signals for what stories should cover.
- **Business rules:** The current loader only loads `getProjectSummary` and `getStoriesContext`, which is too shallow. The PRD specifies that story generation needs the full discovery context for the epic. Wire in whatever Layer 3 functions exist today.
- **File:** `src/lib/agent-harness/tasks/story-generation.ts` (~lines 24-47, `storyGenerationContextLoader`)

### 2.9 General Chat History Window (REQ-HARNESS-009)

- **What it does:** Loads recent chat message history into the general chat system prompt for context enrichment. Queries ChatMessage table: last 50 messages OR 7 days, whichever is smaller.
- **Inputs:** Any general chat message
- **Outputs:** System prompt includes a "Recent conversation history" section with prior chat messages
- **Business rules:** Query is project-scoped, not conversation-scoped — the window spans all conversations in the project. This is context enrichment (the AI knows what was discussed recently), not conversational continuity (each chat session is still independent). The window parameters (50 messages, 7 days) are hardcoded in V1 per PRD Section 8.2.
- **File:** `src/app/api/chat/route.ts` (or `src/lib/agent-harness/context/smart-retrieval.ts` if that's where `assembleSmartChatContext` lives)

### 2.10 Needs Review Session-End UX (REQ-HARNESS-010)

- **What it does:** After transcript processing, the session completion message shows entities grouped by confidence tier (HIGH/MEDIUM/LOW) and a "Needs Review" section listing items where `needsReview === true` with their `reviewReason`.
- **Inputs:** Completed transcript processing session
- **Outputs:**
  - Backend: ChatMessage.toolCalls JSON includes `confidenceTiers` (counts per tier) and `needsReviewItems` (array of {entityType, entityId, title, reviewReason})
  - Frontend: Extraction cards component renders confidence tier summary bar and a "Needs Review" section with edit/confirm/discard actions per item
- **Business rules:** If no items are flagged for review, the Needs Review section is not rendered. Confidence tier summary always shows (even if all HIGH). Depends on REQ-HARNESS-001 being complete (questions must write needsReview correctly).
- **Files:** `src/lib/inngest/functions/transcript-processing.ts` (save-to-conversation step), extraction cards UI component (TBD — locate during implementation)

---

## 3. Technical Approach

### 3.1 Implementation Strategy

Engine-first, then context layer, then UX:

1. **Bug fix** (REQ-001) — Trivial change, unblocks REQ-010. Do first.
2. **Engine hardening** (REQ-002, 003, 004, 005) — These modify `engine.ts` and create new modules. All task types benefit immediately. Do before any context or UX work.
3. **Layer 3 completeness** (REQ-006, 007, 008) — Build missing context functions, wire into existing context loaders. Purely additive.
4. **Chat + UX** (REQ-009, 010) — Build on everything above. Do last.

### 3.2 File/Module Structure

```
src/lib/agent-harness/
  engine.ts                        — MODIFY (re-prompt loop, firm rules injection, entity tracking accumulation, rate limit pre-check)
  firm-rules.ts                    — CREATE (prompt addendum string + postProcessOutput regex function)
  rate-limiter.ts                  — CREATE (checkRateLimits function: daily count + monthly cost)
  tools/
    create-question.ts             — MODIFY (add 3 missing fields to prisma.question.create)
    create-decision.ts             — MODIFY (add entity tracking return shape)
    create-requirement.ts          — MODIFY (add entity tracking return shape)
    create-risk.ts                 — MODIFY (add entity tracking return shape)
    create-story-draft.ts          — MODIFY (add entity tracking return shape)
    [all other tools]              — MODIFY (add entity tracking return shape)
  tasks/
    transcript-processing.ts       — MODIFY (context loader: add getRecentSessions + getArticleSummaries)
    story-generation.ts            — MODIFY (context loader: add epic-scoped queries)
  context/
    recent-sessions.ts             — CREATE (getRecentSessions query + formatter)
    milestone-progress.ts          — CREATE (getMilestoneProgress query + formatter)
    index.ts                       — MODIFY (export new functions)
src/app/api/chat/route.ts          — MODIFY (add chat history window to context assembly)
src/lib/inngest/functions/
  transcript-processing.ts         — MODIFY (confidence grouping + needsReviewItems in save-to-conversation)
src/components/                    — MODIFY (extraction cards: confidence tiers + Needs Review section)
prisma/
  schema.prisma                    — MODIFY (add aiDailyLimit, aiMonthlyCostCap to Project)
```

### 3.3 Data Changes

Add to Project model in `prisma/schema.prisma`:
```prisma
aiDailyLimit     Int?      // Per-consultant daily AI invocation limit. Null = unlimited.
aiMonthlyCostCap Decimal?  // Per-project monthly AI cost cap in USD. Null = unlimited.
```

Migration: additive only, nullable fields, no data backfill needed.

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| Re-prompt loop exhausts maxRetries | Return last output with `validation.valid: false` attached | No error thrown — caller decides |
| Firm rules post-processing encounters backtick-quoted text | Skip regex replacement inside backticks and quoted strings | N/A — cosmetic only |
| Rate limit hit during Inngest step function | `executeTask` returns 429. Inngest treats as failure, backs off per its retry config. | HTTP 429 with message: "Daily AI invocation limit exceeded" or "Monthly project cost cap exceeded" |
| Daily limit resets at midnight UTC | Query: `WHERE createdAt >= current_date AT TIME ZONE 'UTC'` | N/A |
| Monthly cost with null token fields (old SessionLog entries) | Treat null tokens as 0 in sum | N/A |
| Chat history window spans deleted conversations | Query ChatMessage directly, conversation deletion cascades to messages | N/A — deleted messages won't appear |
| getRecentSessions called before any sessions exist | Return empty array, context section omitted from prompt | N/A |
| Needs Review section with 0 flagged items | Don't render the Needs Review section. Still show confidence tier summary. | N/A |
| Tool returns no entity tracking data | Engine treats as empty tracking. SessionLog still created. | N/A — backwards compatible |
| getArticleSummaries not yet implemented (Phase 6 dependency) | Skip it in transcript context loader. Add TODO comment for Phase 6. | N/A |

---

## 5. Integration Points

### From Phase 1
- **REQ-RBAC-001** (getCurrentMember auth fix) — The auth foundation is correct before any harness invocation.
- **REQ-RBAC-012** (prompt injection defense) — Already covers GAP-AGENT-005. Phase 2 doesn't duplicate it.
- **REQ-RBAC-007 secondary gap** (AI tool call role enforcement) — Deferred from Phase 1. If tools need to enforce role-based permissions on entity creation, that's a concern for the tool implementations modified in this phase. Evaluate during implementation — if the existing tools already respect the calling user's role via the member context, no additional work needed.

### For Future Phases
- **Phase 3 (Discovery/Questions):** Benefits from REQ-001 (questions now have correct confidence flags) and REQ-010 (Needs Review UX). Phase 3's question lifecycle work builds on these.
- **Phase 5 (Sprint/Developer):** Owns CONTEXT_PACKAGE_ASSEMBLY as a direct function. Uses `getMilestoneProgress` (REQ-006) in context packages.
- **Phase 6 (Org/Knowledge):** May need to implement `getArticleSummaries` and `getBusinessProcesses` if they don't exist yet. Phase 2 wires in whatever exists today.
- **Phase 7 (Dashboards):** Benefits from SessionLog entity tracking (REQ-004) for audit views.
- **Phase 8 (Documents/Notifications):** Owns STATUS_REPORT_GENERATION as a document type variant. Picks up rate limit 80% threshold notification wiring. Firm typographic rules (REQ-003) are already in place for document generation to consume.

---

## 6. Acceptance Criteria

- [ ] `create_question` tool persists confidence, needsReview, and reviewReason fields to the database
- [ ] When output validation fails, the engine re-prompts Claude with correction instructions up to maxRetries times
- [ ] After maxRetries exhausted, the engine returns the last output with validation failure attached (does not throw)
- [ ] Every AI-generated text output has em dashes replaced with hyphens and AI-characteristic phrases stripped
- [ ] Firm typographic rules are injected into every task's system prompt automatically via `buildSystemPrompt`
- [ ] SessionLog.entitiesCreated contains array of {entityType, entityId} for every entity created during the session
- [ ] SessionLog.entitiesModified contains array of {entityType, entityId, fieldsChanged} for modifications
- [ ] When a user exceeds their daily AI invocation limit, executeTask returns HTTP 429 with descriptive message
- [ ] When a project exceeds its monthly cost cap, executeTask returns HTTP 429
- [ ] Project model has nullable aiDailyLimit and aiMonthlyCostCap fields
- [ ] getRecentSessions returns the N most recent SessionLog entries with task type and entity counts
- [ ] getMilestoneProgress returns milestones with computed completion percentages
- [ ] Transcript processing context includes recent sessions (and article summaries if the function exists)
- [ ] Story generation context includes epic context, answered questions, decisions, and org components for the target epic
- [ ] General chat system prompt includes the most recent 50 messages or 7 days of chat history (whichever is smaller)
- [ ] After transcript processing, the session completion message groups entities by confidence tier
- [ ] Flagged items (needsReview === true) appear in a "Needs Review" section with reviewReason and edit/confirm/discard actions
- [ ] No regressions — existing harness task types continue to function correctly

---

## 7. Open Questions

None — all scoping decisions resolved during deep dive.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 2`. GAP-001 moved to Phase 8 (document type variant). GAP-002 moved to Phase 5 (direct function, no harness). GAP-005 duplicate of Phase 1. GAP-008 notifications deferred to Phase 8. |
