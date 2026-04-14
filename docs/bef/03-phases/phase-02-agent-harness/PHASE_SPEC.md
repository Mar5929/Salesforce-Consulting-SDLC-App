# Phase 2 Spec: Harness Hardening + Core Pipelines

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Addendum Source: [PRD-ADDENDUM-v1-Intelligence-Layer.md §5.2, §5.3](../../00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md)
> Integration Plan: [ADDENDUM-INTEGRATION-PLAN.md §Phase 2](../../ADDENDUM-INTEGRATION-PLAN.md)
> Depends On: Phase 1 (RBAC, Security, Governance), Phase 11 (Model Router, Eval Harness, Observability)
> Unlocks: Phase 3 (Discovery), Phase 4 (Work Management), Phase 6 (Org/Knowledge)
> Complexity: XL
> Status: Deep-dived — ready for execution (2a/2b split rejected; unified)
> Last Updated: 2026-04-13

---

## 0. Addendum Context

PRD Addendum v1 replaced the generic agent-harness task-type model with four deterministic pipelines plus a narrow freeform agent. This phase now combines two bodies of work:

1. **Harness hardening** — the original 10 REQ-HARNESS items (bug fixes, rate limiting, firm rules, context completeness, Needs Review UX). All still valid, unchanged in scope.
2. **Core pipelines + freeform agent** — new scope from the addendum. Replaces the generic `executeTask(taskType)` dispatch pattern with four explicit, multi-stage pipelines and a single freeform chat agent.

The original harness stays as infrastructure (context assembly, tool framework, SessionLog, rate limiting). The pipelines sit on top of it. The freeform agent uses the tool layer but does not use the task-type dispatcher.

Step 3 deep-dive completed 2026-04-13. All 9 outstanding items (formerly §8) are resolved in §8 "Resolved Decisions (Deep-Dive)". Phase is ready for execution.

**Requirement trace:** REQ-HARNESS-001..012 → PRD §6 (AI Harness, superseded in substance by Addendum §5). REQ-PIPELINE-001..004 → Addendum §5.2.1..5.2.4. REQ-AGENT-FREEFORM-001 → Addendum §5.3. Observability tables → Addendum §7. Eval harness extension → Addendum §5.6.

---

## 1. Scope Summary

Harden the existing harness engine (10 harness requirements) AND replace the generic task-type dispatcher with four deterministic pipelines and a freeform agent. Retrofit every Claude call to route through the Phase 11 model router. Extend the Phase 11 eval harness with Story Generation fixtures.

**In scope:**
- 10 harness-hardening requirements (REQ-HARNESS-001 through REQ-HARNESS-010)
- Four deterministic pipelines (REQ-PIPELINE-001 through REQ-PIPELINE-004)
- Freeform agent (REQ-AGENT-FREEFORM-001)
- Model router retrofit across engine and task files (REQ-HARNESS-011)
- Story Generation eval fixtures + assertions (REQ-HARNESS-012)

**Moved out (unchanged from pre-addendum spec):**
- GAP-AGENT-001 (STATUS_REPORT_GENERATION) → Phase 8. Now a briefing type served by the Briefing/Status Pipeline defined here, but document-format rendering stays in Phase 8.
- GAP-AGENT-002 (CONTEXT_PACKAGE_ASSEMBLY) → Phase 5 as a deterministic function.
- GAP-AGENT-005 (prompt injection defense) → Already covered by Phase 1 REQ-RBAC-012.
- GAP-AGENT-008 notification wiring → Phase 8.

---

## 2. Functional Requirements — Harness Hardening

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
  2. **Post-processing function** — Regex-based cleanup on the final AI output. Replaces em dashes with hyphens, strips known AI phrases, normalizes date formats. Safety net for what the prompt didn't prevent.
- **Inputs:** Every AI-generated text output from any task type OR pipeline stage
- **Outputs:** Clean text conforming to firm standards
- **Business rules:** Post-processing is cosmetic only — never alter entity names, technical terms, Salesforce API names, or quoted text within backticks/quotes. Rules are hardcoded in V1 per PRD Section 6.3. Also invoked by the Story Generation Pipeline (stage 6) and Briefing/Status Pipeline (stage 4).
- **File to create:** `src/lib/agent-harness/firm-rules.ts`
- **File to modify:** `src/lib/agent-harness/engine.ts` (`buildSystemPrompt` + post-processing before return)

### 2.4 SessionLog Entity Tracking (REQ-HARNESS-004)

- **What it does:** Populates `SessionLog.entitiesCreated` and `SessionLog.entitiesModified` with arrays of `{entityType, entityId}` for every entity the session's tool calls created or modified.
- **Inputs:** Tool execution results during any harness session (including pipeline stages and freeform agent tool calls)
- **Outputs:** SessionLog record with populated entity tracking fields
- **Business rules:** Each tool's execute function returns a standardized tracking shape: `{entityType: string, entityId: string, action: "created" | "modified"}`. The engine accumulates these across all tool calls in the session and writes them to the SessionLog at the end. Tools that don't return tracking data (legacy or read-only) are treated as empty — backwards compatible.
- **File:** `src/lib/agent-harness/engine.ts` (tool execution loop + SessionLog.create call)
- **Files to modify:** All tool execute functions in `src/lib/agent-harness/tools/` to return tracking data

### 2.5 Rate Limiting Enforcement Core (REQ-HARNESS-005)

- **What it does:** Adds pre-invocation checks to `executeTask` and to every pipeline entry point that enforce two limits:
  1. **Per-consultant daily limit** — Count today's SessionLog entries for this userId. Default: 100/day.
  2. **Per-project monthly cost cap** — Sum `inputTokens + outputTokens` from SessionLog for the current calendar month for this project, multiply by model cost constant. Default cap: configurable per project.
- **Inputs:** Every `executeTask` call AND every pipeline invocation
- **Outputs:** Either proceeds with execution, or returns HTTP 429 with a descriptive message explaining which limit was hit
- **Business rules:** Limits are checked before any Claude API call (fail fast, don't waste money). Daily limit uses UTC midnight. Monthly cost uses a model cost constant sourced from the Phase 11 model router config. Default daily limit and monthly cap are stored on the Project model (nullable — null means unlimited). 80% threshold notifications are deferred to Phase 8.
- **File to create:** `src/lib/agent-harness/rate-limiter.ts`
- **File to modify:** `src/lib/agent-harness/engine.ts` and each pipeline entry point (pre-invocation check)
- **Schema change:** Add `aiDailyLimit Int?` and `aiMonthlyCostCap Decimal?` to Project model

### 2.6 Layer 3 Context Functions (REQ-HARNESS-006)

- **What it does:** Implements two missing Layer 3 context assembly functions:
  1. `getRecentSessions(projectId, limit)` — Queries SessionLog for the N most recent entries. Returns: taskType, timestamp, token counts, entity summary.
  2. `getMilestoneProgress(projectId)` — Queries milestones with computed completion percentage from linked story statuses.
- **Inputs:** projectId (both), limit (getRecentSessions, default 5)
- **Outputs:** Formatted context strings suitable for injection into system prompts
- **Business rules:** Read-only query functions in the Layer 3 context assembly layer. Must return compact summaries that fit within context window budgets (target: <1K tokens each).
- **Files to create:** `src/lib/agent-harness/context/recent-sessions.ts`, `src/lib/agent-harness/context/milestone-progress.ts`
- **File to modify:** `src/lib/agent-harness/context/index.ts` (export new functions)

### 2.7 Transcript Context Enrichment (REQ-HARNESS-007)

- **What it does:** Adds `getRecentSessions` and `getArticleSummaries` to the transcript processing context loader's `Promise.all` call. This context feeds the new Transcript Processing Pipeline's stage 2 (extract candidates) and stage 4 (reconcile).
- **Inputs:** Transcript processing pipeline invocation
- **Outputs:** Context window includes recent session summaries (for continuity) and article summaries (so AI can flag stale articles inline)
- **Business rules:** `getArticleSummaries` may already exist in the context layer — wire it in if present, note for Phase 6 if not. Recent sessions give the AI awareness of what was extracted in prior runs.
- **File:** `src/lib/agent-harness/tasks/transcript-processing.ts` (context loader) OR the equivalent pipeline stage context assembler once REQ-PIPELINE-001 lands.

### 2.8 Story Generation Context Expansion (REQ-HARNESS-008)

- **What it does:** Expands the story generation context loader (which becomes the Story Generation Pipeline stage 1, "Assemble context") to include: `getEpicContext`, `getAnsweredQuestions(scopeEpicId)`, `getDecisionsForEpic`, `getOrgComponentsForEpic`. Optionally wire `getBusinessProcesses` and `getRelevantArticles` if they exist.
- **Inputs:** Story generation pipeline invocation with `metadata.epicId`
- **Outputs:** Context window includes answered discovery questions, scoped decisions, and org components for the target epic.
- **File:** `src/lib/agent-harness/tasks/story-generation.ts` OR the pipeline stage-1 assembler.

### 2.9 General Chat History Window (REQ-HARNESS-009, PRD-8-10)

- **What it does:** Loads recent chat message history for the **PRD-8-10 general-chat path** (non-agent /api/chat endpoint). Queries ChatMessage table: last 50 messages OR 7 days, whichever is smaller. This is a separate code path from the freeform agent.
- **Freeform agent history (Addendum §5.3-03):** the freeform agent uses a different window: **last N=20 agent turns** (default, configurable) loaded from `agent_messages` by `agent_conversation_id` plus the Tier 1 project summary. See Task 15 for the agent-side implementation.
- **Inputs:** project-scoped chat history load
- **Outputs:** System prompt includes a "Recent conversation history" section with prior chat messages
- **Business rules:** Query is project-scoped, not conversation-scoped. Context enrichment, not conversational continuity. Window parameters hardcoded in V1 per PRD Section 8.2.
- **File:** `src/app/api/chat/route.ts` (general-chat branch) — the freeform agent lives in `src/lib/agent-freeform/` with its own window loader.

### 2.10 Needs Review Session-End UX (REQ-HARNESS-010)

- **What it does:** After the Transcript Processing Pipeline completes, the session-completion message shows entities grouped by confidence tier (HIGH/MEDIUM/LOW) and a "Needs Review" section listing items where `needsReview === true` with their `reviewReason`. Also surfaces items queued to `pending_review` by pipeline stage 5 (Apply).
- **Inputs:** Completed transcript processing pipeline run
- **Outputs:**
  - Backend: ChatMessage.toolCalls JSON includes `confidenceTiers` (counts per tier) and `needsReviewItems` (array of {entityType, entityId, title, reviewReason})
  - Frontend: Extraction cards component renders confidence tier summary bar and a "Needs Review" section with edit/confirm/discard actions per item
- **Business rules:** Items in `pending_review` (confidence ≤ 0.85) and items with `needsReview === true` both surface here. If none, the Needs Review section is not rendered. Depends on REQ-HARNESS-001.
- **Files:** `src/lib/inngest/functions/transcript-processing.ts` (save-to-conversation step), extraction cards UI component (TBD — locate during implementation)

---

### 2.11 Context-Window Budget Enforcement (PRD-6-07)

- **What it does:** Before each Claude call, the engine/pipeline computes `totalInputTokens = system + context + messages`. If `totalInputTokens > 180_000` (90% of Sonnet 4.6 context window), truncate Layer 3 context blocks in a defined priority order: drop `recent_sessions` first, then `milestone_progress`, then `article_summaries`. Log the truncation event to `SessionLog.warnings` as `{type: 'context_truncated', droppedBlocks: string[]}`.
- **Business rules:** 180K is the soft ceiling; hard call to Claude is made with the truncated payload. If truncation cannot bring the total below 180K (e.g., the raw transcript itself is > 180K), stage fails with `chunk_too_large` / `transcript_too_large`.
- **Traces to:** PRD-6-07, PRD-6-19. See Task 5 expansion.

### 2.12 AI Output Sanitization (PRD-22-05)

- **What it does:** Every tool `execute` function (`create_question`, `create_decision`, `create_requirement`, `create_risk`, plus any `update_*` tool that writes AI-supplied string fields) pipes each AI-supplied text field through a shared `sanitize()` helper before calling Prisma. The helper uses a server-side DOMPurify or an equivalent HTML/script allowlist-strip to remove `<script>`, `<iframe>`, event handlers, and inline JS URIs.
- **File to create:** `src/lib/agent-harness/tools/sanitize.ts`
- **Business rules:** sanitization is idempotent; it never alters code fences or backtick-quoted content (technical terms stay). Unit tests cover `<script>alert(1)</script>` injected into a question title; stored title contains no `<script>` tag.
- **Traces to:** PRD-22-05, DECISION-08.

### 2.13 Role-Scoped Tool Execution (PRD-6-02, REQ-RBAC-007)

- **What it does:** Every tool's `execute` receives a `member: { id, role, projectId }` context from the engine's caller. Before any write or read, the tool consults the Phase 1 RBAC matrix. Calls where the caller's role lacks the required permission return `{ error: 'tool_unavailable', reason: 'role_scope' }` without writing to DB.
- **Traces to:** PRD-6-02, REQ-RBAC-007, DECISION-10 (paired with `assertProjectWritable`).

### 2.14 Archive Read-Only Gate (DECISION-10, PRD-21-01)

- **What it does:** Every Phase 2 mutation entry point (tool writes, pipeline Apply / Propagate stages, freeform agent write tools, rate-limited invocations with side effects) imports `assertProjectWritable(projectId)` from Phase 9's published interface. Archived projects throw / return HTTP 409 from the entry point before any Prisma write.
- **Coverage:** Transcript Pipeline stage 5 (Apply), Answer Logging stage 3 (Apply) + stage 5 (Propagate), Story Generation stage 7 (persist draft), Briefing Pipeline stage 5 (cache write), every `create_*` tool, every freeform agent write-tool.
- **Traces to:** DECISION-10, PRD-21-01.

---

## 3. Functional Requirements — Four Deterministic Pipelines

Each pipeline replaces a specific generic harness task type. Pipeline stages are explicit steps in an Inngest step function. Stages are idempotent and retry-safe. Stage-failure policy:

- **Default:** up to 3 retries per stage (Inngest step-level retry). On final failure: partial pipeline state preserved, run marked `failed`, escalated to a human-review queue with a link back to the raw input and all completed stage outputs.
- **Raw input retention:** raw transcript / raw answer / raw briefing input is always retained on `pipeline_runs.inputJson`, even on total failure.
- **Non-blocking stages** (locked 2026-04-13): the following stages finalize the pipeline with a flag rather than fail the run when they exhaust retries. The run is marked `completed_with_warnings`, downstream work proceeds, and a `pending_review` entry is created for manual follow-up:
  - Transcript Processing stage 6 (Impact assessment) — runs after Apply; impact failure does not roll back applied entities.
  - Answer Logging stage 4 (Impact assessment) — same rationale.
  - Story Generation stage 5 (Resolve conflicts) — draft persists with a `needs_component_review` flag.
- **Blocking stages:** all other stages fail the run on retry exhaustion.
- **Briefing failures:** any Briefing/Status Pipeline stage failure returns a "briefing unavailable, retry" response to the caller and does NOT cache the failure.

**Orchestration mode per pipeline (locked 2026-04-13):**

| Pipeline | Execution | Rationale |
|----------|-----------|-----------|
| Transcript Processing | **Async** (Inngest fire-and-forget) | 7-stage run with 2 Sonnet calls routinely exceeds 30s; Needs Review UX already designed for async session-end. |
| Answer Logging | **Sync-capable** (API route awaits; Inngest still used for durability/retries) | Single-sentence inputs; users expect immediate match/create response. |
| Story Generation | **Async** | Always background; drafts appear in the work board when ready. |
| Briefing/Status | **Sync with 5-min cache** | First call synthesizes; subsequent calls within TTL return cached result. |

### 3.1 Transcript Processing Pipeline (REQ-PIPELINE-001)

Replaces the generic `TRANSCRIPT_PROCESSING` harness task. Seven stages:

| # | Stage | Implementation | Notes |
|---|-------|----------------|-------|
| 1 | Segment | Haiku (via model router) | Split into speaker turns, chunk to ~500 tokens |
| 2 | Extract candidates | Haiku | Structured output: questions, answers, decisions, requirements, risks, action items, **scope changes**, each with confidence score. Emits `suspicious_content` Risk candidate on prompt-injection / social-engineering content (PRD-22-10). |
| 3 | Entity resolution | Deterministic + hybrid search | Retrieve top-K existing entities per candidate (pgvector + tsvector) |
| 4 | Reconcile | Sonnet | For each candidate + matches: decide `create_new | merge_with_existing | update_existing` |
| 5 | Apply | Deterministic | Auto-apply if confidence > 0.85 (V1 threshold — see §8). Below threshold → `pending_review` queue |
| 6 | Impact assessment | Sonnet | Identify unblocked stories, contradicted decisions, new questions raised |
| 7 | Log | Deterministic | Create `pipeline_runs` row + `session_log` entry. Sets `article.isStale = true` and `staleReason` for any article referencing `entitiesModified` (PRD-13-28). |

- **Inputs:** `{ transcriptText: string, projectId: string, userId: string | null, meetingType: 'discovery' | 'planning' | 'review' | 'adhoc', attendees: string[], meetingDate: Date, meetingId?: string }` per Addendum §5.2.1-01. A null `userId` signals a background-job invocation (see §9).
- **Outputs (return contract per Addendum §5.2.1-09, pinned):**
  ```ts
  {
    applied_changes: EntityRef[],           // auto-applied entities (confidence > 0.85)
    pending_review: PendingReviewRef[],     // candidates queued for human review
    new_questions_raised: QuestionRef[],    // impact stage 6 new questions
    blocked_items_unblocked: StoryRef[],    // stories unblocked by applied changes
    conflicts_detected: ConflictRef[],      // conflicts_flagged rows written
    session_log_id: string,
    pipeline_run_id: string,
  }
  ```
  Empty arrays allowed. JSON schema committed at `src/lib/pipelines/transcript-processing/contract.ts`. Stage 7 writes a SessionLog linked to the pipeline_run.
- **Suspicious content (per PRD-22-10):** stage 2 emits a `suspicious_content` Risk candidate (confidence HIGH) for prompt-injection or social-engineering patterns (imperatives directed at the AI, base64 blobs, instruction-following constructions). No commands from transcript body are executed.
- **End-of-loop article staleness (per PRD-13-28):** stage 7 queries `article_entity_refs` for any article referencing entities in `entitiesModified`; sets `article.isStale = true` and `article.staleReason = 'entity <X> modified in session <Y>'`. Phase 6 consumes the flag; Phase 2 wires the hook.
- **Iteration + token budget (per PRD-6-19):** stage 2 processes in chunks such that a single Claude call receives ≤ 20K input tokens; total iterations ≤ 8 per transcript; exceeding either fails the run with `transcript_too_large`.
- **Model routing:** stages 1, 2 → Haiku; stages 4, 6 → Sonnet; all via `model_router.resolve_model(intent)`
- **Idempotency:** stage `(pipeline_run_id, stage_name)` unique. Re-running a stage produces the same outputs given the same inputs.
- **Confidence cutoff (locked 2026-04-13):** strict `> 0.85` for auto-apply. Values `≤ 0.85` (including exactly 0.85) route to `pending_review`. Recalibrate after first 100 real transcripts.
- **File structure:** `src/lib/pipelines/transcript-processing/` with one file per stage + `index.ts` Inngest step function.

### 3.2 Answer Logging Pipeline (REQ-PIPELINE-002) — NEW

Handles free-text answers from users (not a replacement — net-new scope from addendum §5.2.2). Six stages:

| # | Stage | Implementation | Notes |
|---|-------|----------------|-------|
| 1 | Retrieve candidate questions | Deterministic + hybrid search | pgvector + tsvector over open questions. K=5 locked (Addendum §5.2.2-02). |
| 2 | Match | Sonnet | Best matching question OR "standalone decision" |
| 3 | Apply | Deterministic | Update question (mark answered) or create a new decision |
| 4 | Impact assessment | Sonnet | Unblocked items, contradicted decisions, new questions raised |
| 5 | Propagate | Deterministic | Apply impacts, create conflict records. Sets `article.isStale = true` and `staleReason` for any article referencing `entitiesModified` (PRD-13-28). |
| 6 | Annotate org KB | Sonnet | Propose Layer 4 annotations when Salesforce components are mentioned |

- **Inputs:** free-text answer, projectId, userId, optional targetQuestionId (if user pre-linked)
- **Outputs:** updated question or new decision, conflict records, proposed org-KB annotations (queued for review per Phase 6 rules)
- **Model routing:** stages 2, 4, 6 → Sonnet via router
- **Match-confidence cutoffs (locked 2026-04-13):**
  - `≥ 0.85` — auto-apply: mark the matched question answered and persist the answer.
  - `0.70 ≤ confidence < 0.85` — enqueue to `pending_review` with the top-K candidate questions surfaced to the user for confirm/correct.
  - `< 0.70` — treat as standalone: stage 3 creates a new Decision; no existing question is updated.
  - `targetQuestionId` pre-linked by user bypasses stage 2 (no confidence gate).
- **File structure:** `src/lib/pipelines/answer-logging/` with one file per stage + Inngest step function.

### 3.3 Story Generation Pipeline (REQ-PIPELINE-003)

Replaces the generic `STORY_GENERATION` harness task. Seven stages:

| # | Stage | Implementation | Notes |
|---|-------|----------------|-------|
| 1 | Assemble context | Deterministic | Epic/feature, requirements, Q&A via hybrid search, candidate components via `search_org_kb`. Consumes REQ-HARNESS-008 context expansion |
| 2 | Draft story | Sonnet | Structured output. Mandatory field schema (per Addendum §5.2.3-02, PRD-10-08): `persona` (free-text, "As a ..." format), `description`, `acceptanceCriteria[]` (Given/When/Then), `parentEpicId` OR `parentFeatureId`, `estimatedStoryPoints` (AI-suggested), `testCaseStubs[]` (generated from AC), `impactedComponents[]` (free-text or OrgComponent refs). |
| 3 | Validate mandatory fields | Deterministic | Ensure all required fields present (title, description, AC, components, etc.) |
| 4 | Component cross-reference | Deterministic + hybrid search | Verify referenced components exist; flag unknowns |
| 5 | Resolve conflicts | Sonnet (conditional) | Only runs if stage 4 flagged unknowns or mismatches |
| 6 | Typography/branding validator | Deterministic | Invokes `firm-rules.postProcessOutput` (REQ-HARNESS-003) |
| 7 | Return draft | Deterministic | Persist with `draft` status |

- **Inputs:** `{ epicId, projectId, userId, mode: 'generate' | 'enrich', existingStoryId?, explicitRequirementIds? }`
- **`mode: 'enrich'` variant (locked 2026-04-13):** replaces the legacy `STORY_ENRICHMENT` TaskType. Seeded input = existing story + new context. All 7 stages run; stage 2 prompts Claude to preserve fields the user has modified and only update fields affected by new context. Output = amended draft on the same story (new version row).
- **Outputs:** draft Story record(s), conflict notes, component-reference report
- **Model routing:** stages 2, 5 → Sonnet via router
- **Eval coverage:** REQ-HARNESS-012 adds 15 labeled fixtures against this pipeline. Semantic similarity threshold locked at **cosine ≥ 0.80** for AC-to-gold; recalibrate after first eval run.
- **File structure:** `src/lib/pipelines/story-generation/` with one file per stage + Inngest step function.

### 3.4 Briefing/Status Pipeline (REQ-PIPELINE-004)

Replaces the generic `BRIEFING` harness task. Five stages:

| # | Stage | Implementation | Notes |
|---|-------|----------------|-------|
| 1 | Fetch metrics | Deterministic SQL | Per briefing type. 5-minute cache keyed by (projectId, briefingType) |
| 2 | Assemble narrative context | Deterministic | Combine metrics with Layer 3 context |
| 3 | Synthesize | Sonnet | Narrative prose per briefing-type template |
| 4 | Validate | Deterministic | Typography, branding, AI-phrase strip (via REQ-HARNESS-003). **Numeric accuracy (Addendum §5.2.4-04):** extract numeric tokens from narrative via regex `\d+(\.\d+)?%?`; assert each appears in stage 1 metrics; on mismatch, re-run stage 3 once; if the retry still disagrees, fail with `metric_hallucination`. |
| 5 | Cache and return | Deterministic | Compute `inputs_hash` for cache invalidation |

- **Briefing types:** `daily_standup`, `weekly_status`, `executive_summary`, `blocker_report`, `discovery_gap_report`, `sprint_health`
- **Dashboard tile mapping (per PRD-5-30, PRD-17-05):** `daily_standup` produces the "Current Focus" narrative consumed by the Phase 7 dashboard tile; `weekly_status` produces the "Recommended Focus" narrative for the matching tile. Phase 2 emits; Phase 7 consumes.
- **Inputs:** projectId, briefingType, optional recipientRole
- **Outputs:** briefing text, cache metadata, inputs_hash
- **Model routing:** stage 3 → Sonnet via router
- **Cache strategy (locked 2026-04-13):**
  - **Key:** `(projectId, briefingType, inputs_hash)`
  - **TTL:** 5 minutes, passive (no active invalidation in V1)
  - **`inputs_hash`** = sha256 of sorted metric query result from stage 1. If metrics change within the TTL (rare outside active sprint ceremonies), the hash differs and stages 1-4 re-run.
  - **Failure caching:** never cache a failed stage. Failure returns "briefing unavailable, retry" to caller.
  - **Cache store:** Postgres row in a new `briefing_cache` table (or an existing cache infra if already present) keyed by `(projectId, briefingType)` with latest `inputs_hash` + generated text + `generated_at`. Reuse of existing cache infra preferred over new table; confirm during Task 14 implementation.
- **File structure:** `src/lib/pipelines/briefing/` with one file per stage + Inngest step function. Briefing-type templates in `src/lib/pipelines/briefing/templates/`.

#### Published Interfaces

Phase 2 publishes the following contracts verbatim. Phase 5 Task 14 and Phase 7 Task 16 import from the pinned path.

```typescript
// src/lib/pipelines/briefing/index.ts
export enum BriefingType {
  daily_standup = 'daily_standup',
  weekly_status = 'weekly_status',
  executive_summary = 'executive_summary',
  blocker_report = 'blocker_report',
  discovery_gap_report = 'discovery_gap_report',
  sprint_health = 'sprint_health',
}

export interface BriefingOptions {
  recipientRole?: 'PM' | 'SA' | 'BA' | 'DEV' | 'QA';
  requestorUserId?: string;
  bypassCache?: boolean;
  sprintId?: string;  // required when briefingType = 'sprint_health'
}

export interface BriefingOutput {
  briefingId: string;
  briefingType: BriefingType;
  projectId: string;
  generatedAt: Date;
  inputsHash: string;
  content: { sections: BriefingSection[]; rawMarkdown: string };
  cached: boolean;
  cacheTtlSeconds: number;
}

export async function invokeBriefingPipeline(
  projectId: string,
  briefingType: BriefingType,
  options?: BriefingOptions
): Promise<BriefingOutput>;
```

Inngest event contract:
- Event name: `BRIEFING_REQUESTED`
- Payload: `{ projectId: string; briefingType: BriefingType; recipientRole?: string; requestorUserId?: string; sprintId?: string; bypassCache?: boolean }`
- Handler registered in `src/lib/pipelines/briefing/inngest.ts`

Consumers:
- Phase 5 Task 14 (sprint_health briefings)
- Phase 7 Task 16 (daily_standup, weekly_status for dashboards)

---

## 4. Functional Requirements — Freeform Agent (REQ-AGENT-FREEFORM-001)

The project-brain chat. One agent loop in the system. Built at the end of Phase 2 after pipelines land.

- **Model default:** Sonnet 4.6 via router (intent: `freeform_chat`).
- **"Think harder" mode:** routes to Opus 4.6 (intent: `freeform_chat_deep`). UI toggle.
- **System prompt:** includes Layer 3 context + chat history window (REQ-HARNESS-009) + firm rules (REQ-HARNESS-003).

**Read tools (no confirmation) — locked 2026-04-13:**
- `search_project_kb` — hybrid search over project knowledge (questions, decisions, requirements, risks, articles)
- `search_org_kb` — hybrid search over org component knowledge
- `get_sprint_state` — current sprint, in-flight stories, blockers
- `get_project_summary` — Layer 3 project summary
- `get_blocked_items` — currently blocked stories/features and reasons
- `get_discovery_gaps` — open questions, unanswered requirements, coverage gaps
- `get_recent_sessions` — recent AI session summaries (wraps REQ-HARNESS-006 function)
- `get_milestone_progress` — milestones with computed completion percentage (wraps REQ-HARNESS-006 function)

**Rejected as agent tools (use alternatives):**
- `get_org_component_detail` → covered by `search_org_kb` with entity_types filter
- `get_question_thread` → covered by `search_project_kb` with entity_types=['questions']

**Write tools (UI confirmation required before apply):**
- `create_question`
- `create_risk`
- `create_requirement`

**Explicitly NOT available to the freeform agent:**
- Story creation (goes through Story Generation Pipeline)
- Transcript processing (goes through Transcript Processing Pipeline)
- Answer logging (goes through Answer Logging Pipeline)
- Document generation (Phase 8)
- Sprint modification (Phase 5)

**Principle:** the freeform agent suggests and captures intent; pipelines execute deterministic work. The agent does NOT invoke pipelines — write tools go through the standard tool layer directly (no pipeline entry).

**Persistence (per DECISION-01, Addendum §5.3-07 and §7):** every freeform agent turn is persisted to the new tables `agent_conversations(id, project_id, user_id, started_at, closed_at)` and `agent_messages(id, conversation_id, role, content_json, token_in, token_out, model_used, created_at)`. Phase 11 owns table creation (per DECISION-01); Phase 2 consumes them in Task 15. Resuming a conversation by `agent_conversation_id` rehydrates the stored messages. The existing `Conversation` / `ChatMessage` models remain available for general-chat (PRD-8-10) use cases but are NOT used by the freeform agent.

Traces to: ADD-5.3-07, ADD-7-06 (DECISION-01).

---

## 5. Model Router Integration (REQ-HARNESS-011)

Retrofit every existing direct Claude API call in `engine.ts` and under `src/lib/agent-harness/tasks/` to go through `model_router.resolve_model(intent)` from Phase 11. No stage anywhere in the system hardcodes a model string.

- **Scope:** engine.ts, all existing task files, all four new pipelines (as they are built), the freeform agent.
- **Intent taxonomy:** defined in Phase 11. Phase 2 consumes it; it does not redefine it. At minimum this phase needs intents for: `transcript_segment`, `transcript_extract`, `transcript_reconcile`, `transcript_impact`, `answer_match`, `answer_impact`, `answer_org_annotate`, `story_draft`, `story_conflict_resolve`, `briefing_synthesize`, `freeform_chat`, `freeform_chat_deep`.
- **Verification:** grep across `src/lib/agent-harness/` and `src/lib/pipelines/` for any literal `"claude-"` or `anthropic.messages.create` outside the router module. Result: zero hits.
- **Return shape (pinned):** `resolve_model(intent: string): { model: string, maxOutputTokens: number, contextWindow: number, costPer1KInput: number, costPer1KOutput: number }`. Callers read `costPer1KInput` / `costPer1KOutput` for rate-limiter cost math (Task 5). Phase 11 owns the router; Phase 2 consumes this signature.

---

## 6. Eval Harness Extension (REQ-HARNESS-012)

Extend the Phase 11 eval harness with 15 labeled fixtures for the Story Generation Pipeline.

- **Fixture shape:** `{ input: { epicId, projectFixtureId }, gold: { title, description, acceptanceCriteria, components, ... } }`
- **Assertions:**
  1. **Mandatory field presence** — every required Story field is non-empty.
  2. **Semantic similarity to gold** — acceptance criteria embedding similarity to gold ≥ threshold (threshold calibrated in §8).
  3. **Component cross-reference accuracy** — referenced components match gold's component set within tolerance.
- **Integration:** registered as an eval suite in the Phase 11 harness so CI can run it on pipeline changes.

**Briefing/Status Pipeline eval fixtures (ownership note):** the Briefing/Status Pipeline eval fixtures (10 labeled fixtures covering each of the 6 briefing types — `daily_standup`, `weekly_status`, `executive_summary`, `blocker_report`, `discovery_gap_report`, `sprint_health`) are owned by Phase 2. This extends the existing eval harness. Fixtures physically live under `/evals/briefing/` in Phase 11 infrastructure; authorship, gold labels, and maintenance responsibility belong to Phase 2. See Task 17 (extended) in TASKS.md.

---

## 7. Technical Approach

### 7.1 Implementation Strategy

Order:

1. **Harness hardening foundation** — REQ-HARNESS-001 through REQ-HARNESS-010. Same order as pre-addendum plan (bug fix → engine hardening → Layer 3 context → chat/UX).
2. **Model router retrofit** — REQ-HARNESS-011. Before building pipelines so pipelines use the router from day one.
3. **Pipelines in dependency order:**
   - Transcript Processing Pipeline (REQ-PIPELINE-001) first — largest, sets pattern for others.
   - Answer Logging Pipeline (REQ-PIPELINE-002) — reuses transcript pipeline patterns.
   - Story Generation Pipeline (REQ-PIPELINE-003) — consumes REQ-HARNESS-008 context expansion.
   - Briefing/Status Pipeline (REQ-PIPELINE-004) — simplest, can be done in parallel with story gen.
4. **Freeform agent** (REQ-AGENT-FREEFORM-001) — last. Consumes everything above.
5. **Eval fixtures** (REQ-HARNESS-012) — alongside Story Generation Pipeline.

### 7.2 File/Module Structure

```
src/lib/agent-harness/
  engine.ts                        — MODIFY (re-prompt loop, firm rules injection, entity tracking, rate limit pre-check, model router)
  firm-rules.ts                    — CREATE
  rate-limiter.ts                  — CREATE
  tools/                           — MODIFY (all tools return entity tracking; create_question bug fix)
  context/
    recent-sessions.ts             — CREATE
    milestone-progress.ts          — CREATE
    index.ts                       — MODIFY
  tasks/
    transcript-processing.ts       — DEPRECATE (replaced by pipeline)
    story-generation.ts            — DEPRECATE (replaced by pipeline)
    briefing.ts                    — DEPRECATE (replaced by pipeline)
    [orphans]                      — RE-MAP per §8 outstanding item

src/lib/pipelines/                 — CREATE (new directory)
  transcript-processing/
    01-segment.ts
    02-extract.ts
    03-entity-resolution.ts
    04-reconcile.ts
    05-apply.ts
    06-impact.ts
    07-log.ts
    index.ts                       — Inngest step function
  answer-logging/                  — 6 stages + index.ts
  story-generation/                — 7 stages + index.ts
  briefing/
    templates/                     — per briefing type
    [5 stages] + index.ts

src/lib/agent-freeform/            — CREATE
  agent.ts                         — agent loop, tool registration
  system-prompt.ts                 — builds system prompt with Layer 3 + history + firm rules
  tools/                           — read/write tool wrappers

src/app/api/chat/route.ts          — MODIFY (routes to freeform agent, adds chat history window)
src/lib/inngest/functions/
  transcript-processing.ts         — MODIFY (invoke new pipeline; confidence grouping for REQ-HARNESS-010)

prisma/
  schema.prisma                    — MODIFY (aiDailyLimit, aiMonthlyCostCap on Project; pipeline_runs table per addendum; pending_review queue per addendum)
```

### 7.3 Data Changes

**Project model:**
```prisma
aiDailyLimit     Int?
aiMonthlyCostCap Decimal?
```

**New tables:** all owned by Phase 11 (already in Phase 11 Task 1 schema). Phase 2 consumes them:
- `pipeline_runs` — one row per pipeline invocation: `{id, projectId, userId, pipelineType, status, inputsHash, startedAt, completedAt, errorJson}`
- `pipeline_stage_runs` — one row per stage execution: `{id, pipelineRunId, stageName, status, inputJson, outputJson, modelUsed, tokensIn, tokensOut, attempt, error}`
- `pending_review` — low-confidence candidates held for human review: `{id, projectId, pipelineRunId, entityType, candidateJson, confidence, reason, createdAt, resolvedAt, resolution}`
- `conflicts_flagged` — written by Transcript stage 6 + Answer stage 4; Phase 11 schema.

**Phase 2 new tables (pinned per GAP-10):**

```prisma
model CostAlertLog {
  id             String   @id @default(cuid())
  projectId      String
  calendarMonth  String   // YYYY-MM
  alertType      AlertType // COST_APPROACHING_CAP | DAILY_LIMIT_WARNING
  emittedAt      DateTime @default(now())
  project        Project  @relation(fields: [projectId], references: [id])
  @@unique([projectId, calendarMonth, alertType])
  @@index([projectId, calendarMonth])
}

enum AlertType {
  COST_APPROACHING_CAP
  DAILY_LIMIT_WARNING
}

model BriefingCache {
  projectId    String
  briefingType BriefingType
  inputsHash   String
  briefingText String   @db.Text
  generatedAt  DateTime @default(now())
  project      Project  @relation(fields: [projectId], references: [id])
  @@id([projectId, briefingType])
  @@index([projectId, briefingType, inputsHash])
}
```

The prior "reuse existing cache infra vs. create table" fork is resolved: Phase 2 owns the `BriefingCache` table.

**`COST_APPROACHING_CAP` event payload (pinned):**
```ts
{
  projectId: string,
  thresholdPct: 80,
  currentCostUsd: number,
  capUsd: number,
  calendarMonth: string, // YYYY-MM
}
```
Phase 8 consumes the event to render the notification template. Payload contract must match Phase 8 template inputs.

Traces to: REQ-HARNESS-005, REQ-PIPELINE-004, PRD-23-03.

Pipeline status enum (Phase 11 owned, consumed here): `queued`, `running`, `completed`, `completed_with_warnings`, `failed`.

---

## 8. Resolved Decisions (Deep-Dive 2026-04-13)

All outstanding items from the integration plan are resolved below. The pre-deep-dive list is archived in this file's revision history.

| # | Item | Decision |
|---|------|----------|
| 1 | **2a/2b split** | **Rejected.** Phase 2 stays unified (18 tasks). Rationale: every downstream phase (3, 4, 6) depends on both harness hardening AND ≥ 1 pipeline, so a split does not unblock anyone earlier. Splitting adds Linear milestone overhead without a calendar win. |
| 2 | **Orphan TaskType enum re-mapping** | 9 values dispositioned. See §8.1 table below. Enum values removed in Phase 2 (new Task 18) with a grep CI check ensuring no caller references them. |
| 3 | **Per-pipeline error/escalation behavior** | Specified per-stage in §3 preamble: default 3 retries + human-review queue; **non-blocking stages** are Transcript stage 6, Answer stage 4, Story stage 5. Briefing failures never cache; return "briefing unavailable." |
| 4 | **Confidence thresholds** | Transcript strict `> 0.85` auto-apply (§3.1). Answer Logging tiered: `≥ 0.85` auto-update, `0.70–0.85` `pending_review` with candidates, `< 0.70` standalone decision (§3.2). Story Gen has no confidence gate (mandatory-field validation is deterministic). |
| 5 | **Freeform agent read tools** | 8 total (6 original + `get_recent_sessions` + `get_milestone_progress`). `get_org_component_detail` and `get_question_thread` rejected — covered by `search_org_kb` / `search_project_kb` with entity filters (§4). |
| 6 | **Semantic similarity threshold** | Cosine ≥ **0.80** for Story Gen AC-to-gold comparison. Recalibrate after first eval-run data. |
| 7 | **Pipeline schema ownership** | `pipeline_runs`, `pipeline_stage_runs`, `pending_review`, `conflicts_flagged` are **Phase 11 owned** (already in Phase 11 Task 1 schema). Phase 2 only adds `Project.aiDailyLimit` + `Project.aiMonthlyCostCap`. Briefing cache may reuse existing cache infra or add a `briefing_cache` table (decide during Task 14). |
| 8 | **Transcript sync vs. async** | Async (Inngest). Answer=sync-capable, Story=async, Briefing=sync+cache (§3 preamble table). |
| 9 | **Cost cap** | Hybrid: 80% soft alert emits `COST_APPROACHING_CAP` notification event to PM role (Phase 8 wires template); 100% hard 429 block; `null` cap = unlimited. Daily limit = hard block at 100%, no soft threshold. Default daily = 100 invocations/user/project. Default monthly cap = `null`. |
| 10 | **Fixture expectations (20 Phase 11 stubs)** | Task 11 AC replaces 10 `transcript-processing` stubs with extraction F1 + entity-resolution top-1 + reconciliation accuracy assertions (Addendum §5.2.1). Task 12 AC replaces 10 `answer-logging` stubs with match accuracy + impact detection + annotation proposal assertions. |

### 8.1 TaskType Orphan Disposition Matrix

| TaskType | Disposition | Destination | Notes |
|----------|------------|-------------|-------|
| `QUESTION_ANSWERING` | **Deprecate** | Replaced by REQ-PIPELINE-002 (Answer Logging) | Delete in Task 18 |
| `STORY_ENRICHMENT` | **Fold** | Story Generation Pipeline, `mode: 'enrich'` | Pipeline accepts `mode` input (§3.3) |
| `STATUS_REPORT_GENERATION` | **Move** | Phase 8 (document rendering) | Briefing Pipeline produces text; Phase 8 renders document |
| `DOCUMENT_GENERATION` | **Move** | Phase 8 | Document rendering is Phase 8 domain |
| `SPRINT_ANALYSIS` | **Move** | Phase 5 | Sprint + Developer API owns sprint logic |
| `CONTEXT_PACKAGE_ASSEMBLY` | **Move** | Phase 5 (deterministic function) | Addendum §4.6 |
| `ORG_QUERY` | **Move** | Phase 6 | Org KB ownership; uses `search_org_kb` |
| `DASHBOARD_SYNTHESIS` | **Move** | Phase 7 | Dashboards own their synthesis |
| `ARTICLE_SYNTHESIS` | **Move** | Phase 6 | Articles live in org KB |

Enum values removed in Phase 2 (Task 18). Grep CI check: any reference to these TaskType values in `src/` fails the build. Downstream phases introduce their own explicit entry points (pipelines, deterministic functions, phase-specific Inngest jobs) — **not** new generic TaskType values.

### 8.2 Cross-Pipeline Integration Matrix

| Producer | Event / Output | Consumer | Notes |
|----------|---------------|----------|-------|
| Transcript stage 5 (Apply) | `pending_review` entries (confidence ≤ 0.85) | Task 10 Needs Review UX | ChatMessage.toolCalls surfaces in session-end message |
| Transcript stage 6 (Impact) | `conflicts_flagged` rows | Phase 3 (Discovery Dashboard), Phase 7 (Conflicts view) | Shared schema with Answer Logging stage 4 |
| Answer Logging stage 4 (Impact) | `conflicts_flagged` rows | Same as above | |
| Answer Logging stage 6 (Annotate) | Proposed Layer 4 annotations | Phase 6 (annotation queue) | Write to `pending_review` with `entity_type='annotation'` in V1 until Phase 6 ships dedicated queue |
| Story Gen stage 1 (Assemble) | Calls `search_project_kb` + `search_org_kb` | Phase 11 (primitives) | `search_org_kb` returns `{ results: [], not_implemented: true }` until Phase 6 |
| Story Gen stage 4 (Cross-ref) | Component-reference report | Task 10 Needs Review UX (flagged drafts) | Same pattern: `needs_component_review` flag surfaces in work board |
| Story Gen (all stages) | `pipeline_runs` / `pipeline_stage_runs` | Phase 7 (Observability) | Phase 11 schema |
| Briefing Pipeline | Rendered briefing + `inputs_hash` | Phase 8 (Status Report rendering) | Phase 8 calls Briefing Pipeline; caches result |
| Freeform agent write tool (`create_question` / `create_risk` / `create_requirement`) | Standard tool layer (direct persistence) | — | Agent never invokes pipelines. Entity tracking flows through REQ-HARNESS-004. |
| Rate limiter 80% threshold | `COST_APPROACHING_CAP` event | Phase 8 (notification templates) | Phase 2 emits; Phase 8 renders/routes |

---

## 9. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| Re-prompt loop exhausts maxRetries | Return last output with `validation.valid: false` attached | No error thrown |
| Firm rules post-processing encounters backtick-quoted text | Skip regex replacement inside backticks and quoted strings | N/A |
| Rate limit hit during pipeline execution | Pipeline entry point returns 429. Inngest treats as failure, backs off per its retry config | HTTP 429 with descriptive message |
| Pipeline stage fails 3 times | Mark `pipeline_run.status = 'failed'`, preserve all completed stage outputs, enqueue to human-review | N/A — async resolution |
| Transcript Processing confidence tied at 0.85 | Threshold is strict `>` — exactly 0.85 goes to `pending_review` | N/A |
| Answer Logging can't match to any open question | Stage 2 returns "standalone decision"; stage 3 creates a Decision record | N/A |
| Story Generation stage 4 flags an unknown component | Stage 5 (conflict resolve) runs. If still unresolved, draft is saved with a `needs_component_review` flag | Surfaced in Needs Review UX |
| Briefing cache hit with matching inputs_hash | Skip stages 1-4, return cached result | N/A |
| Freeform agent invokes write tool | UI prompts user to confirm before pipeline-side persistence occurs | N/A — interactive |
| Freeform agent tries to call a non-registered tool (e.g., story creation) | Tool call fails with "tool not available" error surfaced to the user | N/A |
| Orphan TaskType referenced in code | Grep CI check fails the build (Task 18). At runtime: engine rejects the call with a compile-time impossible path (enum removed). | N/A — caught at build |
| Answer Logging match confidence exactly 0.85 | Routes to `pending_review` with candidates (tiered cutoff, strict `≥ 0.85` = auto-apply) | N/A |
| Answer Logging match confidence in `0.70..0.85` range | `pending_review` with top-K candidate questions surfaced for user confirm/correct | N/A — interactive |
| Story Gen invoked with `mode: 'enrich'` but no `existingStoryId` | Stage 1 throws validation error before any Claude call | HTTP 400 |
| Non-blocking stage (Transcript 6, Answer 4, Story 5) fails after 3 retries | Pipeline marked `completed_with_warnings`; `pending_review` created for manual follow-up; downstream work proceeds | N/A — async |
| Briefing Pipeline stage failure | Return "briefing unavailable, retry"; do NOT cache the failure | HTTP 503 |
| 80% monthly cost threshold crossed | Emit `COST_APPROACHING_CAP` notification event to PM; pipeline continues | N/A — soft alert |
| Model router returns no model for an intent | Engine falls back to Sonnet default and logs a warning | N/A — Phase 11 behavior |
| Tool returns no entity tracking data | Engine treats as empty tracking. SessionLog still created | N/A — backwards compatible |
| Server restart / Inngest cancellation / user abort during pipeline run (PRD-8-12) | Inngest `pipeline.cancelled` handler marks `pipeline_run.status='failed'`, matching `SessionLog.status='FAILED'`. All completed `pipeline_stage_runs` and `inputJson` preserved. No partial apply of the in-flight stage. | N/A — persisted state |
| UTC day-boundary rollover during an active pipeline run (Task 5) | Daily limit counts the invocation against the UTC day at `executeTask` entry time; later stages do not recount. | N/A |
| Both `aiDailyLimit` and `aiMonthlyCostCap` null (Task 5) | No enforcement; no warning logged. `null` = unlimited on both axes. | N/A |
| Concurrent duplicate transcript upload (Task 11) | Stage 1 computes `inputsHash = sha256(transcriptText)`. If a `pipeline_runs` row exists for `(projectId, inputsHash)` with status in (`queued`, `running`, `completed`) within the last 1h, API returns the existing `pipeline_run_id` (idempotency). | N/A |
| Transcript chunk exceeds Haiku context after paragraph chunking (Task 11) | Stage 1 fails with `chunk_too_large` after attempting paragraph-level split. | HTTP 422 |
| Invalid `briefingType` passed to Briefing Pipeline | Validated at API layer before stage 1. | HTTP 400 |
| Empty transcript / zero-token input (Task 11) | Rejected at API layer before Claude call. | HTTP 400 |
| Pipeline invoked without interactive user (webhook/batch, `userId: null`) — PRD-6-25 | Low-confidence items (confidence ≤ 0.85) all auto-route to `pending_review`; no inline clarifying question; `SessionLog.userId = 'SYSTEM'`. | N/A |

---

## 10. Integration Points

### From Phase 1
- **REQ-RBAC-001** (getCurrentMember auth fix) — auth foundation for every pipeline and the freeform agent.
- **REQ-RBAC-012** (prompt injection defense) — covers GAP-AGENT-005.
- **REQ-RBAC-007 secondary gap** (AI tool call role enforcement) — committed in §2.13. Every tool `execute` receives a `member` context and rejects calls where the role lacks the required permission (Phase 1 RBAC matrix). See Task 4 AC.
- **DECISION-10 published helper** (`assertProjectWritable(projectId)`) — imported from Phase 9 at every Phase 2 mutation entry point. See §2.14.

### From Phase 11
- **Model router** — `model_router.resolve_model(intent)` API. REQ-HARNESS-011 depends on it.
- **Eval harness** — REQ-HARNESS-012 extends it with fixtures.
- **Observability** — pipeline_runs and pipeline_stage_runs feed Phase 11 observability surfaces.

### For Future Phases
- **Phase 3 (Discovery/Questions):** Consumes REQ-HARNESS-001 (correct confidence flags), REQ-HARNESS-010 (Needs Review UX), and REQ-PIPELINE-002 (Answer Logging).
- **Phase 4 (Work Management):** Consumes REQ-PIPELINE-003 (Story Generation) and REQ-PIPELINE-004 (Briefing).
- **Phase 5 (Sprint/Developer):** Owns CONTEXT_PACKAGE_ASSEMBLY as a direct function. Uses `getMilestoneProgress` (REQ-HARNESS-006).
- **Phase 6 (Org/Knowledge):** May need `getArticleSummaries`, `getBusinessProcesses`, `getRelevantArticles`, and `getOrgComponentsForEpic`. Phase 2 wires what exists; Phase 6 fills gaps. Consumes REQ-PIPELINE-002 stage 6 (org-KB annotation proposals).
- **Phase 7 (Dashboards):** Consumes SessionLog entity tracking and pipeline_runs.
- **Phase 8 (Documents/Notifications):** Briefing/Status Pipeline feeds status-report document rendering. Rate-limit 80% threshold notifications. Firm typography rules consumed by document generation.

---

## 11. Acceptance Criteria

**Harness hardening (unchanged from pre-addendum spec):**
- [ ] `create_question` persists confidence, needsReview, and reviewReason
- [ ] Output validation re-prompts up to maxRetries; returns last output with validation failure attached after exhaustion
- [ ] Firm rules addendum is injected into every system prompt (task and pipeline)
- [ ] Em dashes replaced with hyphens and AI-characteristic phrases stripped from every AI text output
- [ ] SessionLog.entitiesCreated and entitiesModified populated
- [ ] 429 returned when daily limit or monthly cap exceeded
- [ ] Project has nullable aiDailyLimit and aiMonthlyCostCap
- [ ] `getRecentSessions` and `getMilestoneProgress` implemented and exported
- [ ] Transcript pipeline context includes recent sessions (and article summaries if available)
- [ ] Story Generation Pipeline stage 1 includes epic-scoped questions, decisions, org components
- [ ] Freeform agent system prompt includes (1) Tier 1 project summary, (2) last **20 agent turns** (Addendum §5.3-03 default), (3) firm rules addendum, (4) dynamically retrieved tool outputs. The 50-message / 7-day window is a separate PRD-8-10 general-chat path, not the freeform agent.
- [ ] Agent turns persisted to `agent_conversations` + `agent_messages` (per DECISION-01); resuming a conversation rehydrates messages
- [ ] Every tool `execute` receives a `member: { id, role, projectId }` context; role-scoped checks reject unauthorized calls with `tool_unavailable`
- [ ] Every mutation entry point calls `assertProjectWritable(projectId)` from Phase 9; archived-project calls throw / return 409 (DECISION-10)
- [ ] Every AI-supplied string field routed through `sanitize()` before Prisma write (PRD-22-05)
- [ ] Context-window budget: Claude calls with total input > 180K trigger defined truncation priority; if still over, stage fails with `transcript_too_large` / `chunk_too_large` (PRD-6-07, PRD-6-19)
- [ ] Transcript Pipeline return payload matches the 7-key contract in `src/lib/pipelines/transcript-processing/contract.ts` (Addendum §5.2.1-09)
- [ ] Transcript stage 2 emits `suspicious_content` Risk candidate on prompt-injection content (PRD-22-10)
- [ ] Transcript stage 7 and Answer Logging stage 5 set `article.isStale = true` + `staleReason` for articles referencing `entitiesModified` (PRD-13-28)
- [ ] Interruption (server restart, Inngest cancel, user abort) marks `pipeline_run.status = 'failed'` and `SessionLog.status = 'FAILED'`; no partial apply of in-flight stage (PRD-8-12)
- [ ] Background-job invocation (`userId: null`) routes all low-confidence items to `pending_review`; no inline clarifying questions; `SessionLog.userId = 'SYSTEM'` (PRD-6-25)
- [ ] Briefing Pipeline stage 4 numeric-accuracy check re-runs stage 3 once on mismatch; second mismatch fails with `metric_hallucination` (Addendum §5.2.4-04)
- [ ] `daily_standup` drives Phase 7 "Current Focus" tile; `weekly_status` drives "Recommended Focus" tile (PRD-5-30, PRD-17-05)
- [ ] `CostAlertLog`, `BriefingCache` tables migrated; `COST_APPROACHING_CAP` event payload matches pinned shape
- [ ] Transcript pipeline completion surfaces confidence tiers and Needs Review items in UX

**Pipelines + agent + router + eval (new):**
- [ ] Transcript Processing Pipeline executes all 7 stages **async via Inngest**, idempotent, stage-level 3-retry; non-blocking behavior on stage 6 (impact)
- [ ] Auto-apply uses strict `confidence > 0.85`; everything else routes to `pending_review`
- [ ] Answer Logging Pipeline executes all 6 stages **sync-capable**; tiered match confidence (≥ 0.85 auto, 0.70-0.85 `pending_review`, < 0.70 standalone decision); non-blocking on stage 4 (impact)
- [ ] Story Generation Pipeline executes all 7 stages **async**; supports `mode: 'generate'` and `mode: 'enrich'`; mandatory field schema enforced; typography validator runs; non-blocking on stage 5 (conflict resolve)
- [ ] Briefing/Status Pipeline supports all 6 briefing types with 5-minute passive cache keyed on `(projectId, briefingType, inputs_hash)`; failures are never cached
- [ ] Freeform agent loads **8** read tools without confirmation and 3 write tools with UI confirmation. Story creation / transcript processing / answer logging / document generation / sprint modification are unavailable. Agent never invokes pipelines.
- [ ] "Think harder" mode routes freeform agent to Opus
- [ ] Zero literal model strings in `src/lib/agent-harness/` or `src/lib/pipelines/` outside the router module
- [ ] Phase 11 eval harness runs 15 Story Generation fixtures with mandatory field presence, semantic similarity (cosine ≥ 0.80), and component cross-reference assertions
- [ ] All 9 orphan TaskType enum values removed; grep CI check passes (no caller references remain)
- [ ] Cost cap: 80% threshold emits `COST_APPROACHING_CAP` event; 100% hard 429; daily limit hard 429 at default 100/user/project/day; `null` cap = unlimited
- [ ] pipeline_runs, pipeline_stage_runs, pending_review, conflicts_flagged tables (from Phase 11) populated correctly by Phase 2 pipelines
- [ ] All 20 Phase 11 fixture stubs replaced with real Phase 2 expectations (10 transcript-processing + 10 answer-logging)
- [ ] Briefing/Status Pipeline eval fixtures committed (10 labeled fixtures covering all 6 briefing types) — authored by Phase 2, hosted in Phase 11 eval harness

---

## 12. Open Questions

All items previously open in §8 are resolved (see §8 "Resolved Decisions"). No open questions at execution gate.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 2`. GAP-001 → Phase 8. GAP-002 → Phase 5. GAP-005 duplicate of Phase 1. GAP-008 notifications deferred to Phase 8. |
| 2026-04-13 | Addendum integration (populated from integration plan) | Phase renamed to "Harness Hardening + Core Pipelines". Added four deterministic pipelines, freeform agent, model router retrofit, Story Generation eval fixtures. Preserved all 10 REQ-HARNESS items. |
| 2026-04-13 | Step 3 deep-dive complete | 10 outstanding decisions resolved: (1) unified (no 2a/2b split); (2) 9 orphan TaskTypes dispositioned + Task 18 removes enum values with grep CI check; (3) per-stage error behavior — non-blocking: Transcript stage 6, Answer stage 4, Story stage 5; (4) Transcript confidence strict > 0.85, Answer Logging tiered 0.70/0.85; (5) Freeform agent gets 8 read tools (added get_recent_sessions + get_milestone_progress); (6) Story Gen eval similarity cosine ≥ 0.80; (7) Pipeline schema owned by Phase 11; Phase 2 adds only aiDailyLimit/aiMonthlyCostCap; (8) Transcript=async, Answer=sync, Story=async, Briefing=sync+cache; (9) Cost cap hybrid — 80% soft alert event + 100% hard 429; (10) Task 11/12 ACs extended to replace Phase 11 fixture stubs with real expectations. Added §8.1 TaskType disposition matrix and §8.2 Cross-Pipeline Integration Matrix. |
