# Phase 2 Spec: Harness Hardening + Core Pipelines

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Addendum Source: [PRD-ADDENDUM-v1-Intelligence-Layer.md §5.2, §5.3](../../00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md)
> Integration Plan: [ADDENDUM-INTEGRATION-PLAN.md §Phase 2](../../ADDENDUM-INTEGRATION-PLAN.md)
> Gap Report: [02-agent-harness-gaps.md](./02-agent-harness-gaps.md)
> Depends On: Phase 1 (RBAC, Security, Governance), Phase 11 (Model Router, Eval Harness, Observability)
> Unlocks: Phase 3 (Discovery), Phase 4 (Work Management), Phase 6 (Org/Knowledge)
> Complexity: XL
> Status: Draft (populated from integration plan — Step 3 deep-dive still required before execution)
> Last Updated: 2026-04-13

---

## 0. Addendum Context

PRD Addendum v1 replaced the generic agent-harness task-type model with four deterministic pipelines plus a narrow freeform agent. This phase now combines two bodies of work:

1. **Harness hardening** — the original 10 REQ-HARNESS items (bug fixes, rate limiting, firm rules, context completeness, Needs Review UX). All still valid, unchanged in scope.
2. **Core pipelines + freeform agent** — new scope from the addendum. Replaces the generic `executeTask(taskType)` dispatch pattern with four explicit, multi-stage pipelines and a single freeform chat agent.

The original harness stays as infrastructure (context assembly, tool framework, SessionLog, rate limiting). The pipelines sit on top of it. The freeform agent uses the tool layer but does not use the task-type dispatcher.

Step 3 deep-dive is required before execution to resolve the outstanding items in §8.

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

### 2.9 General Chat History Window (REQ-HARNESS-009)

- **What it does:** Loads recent chat message history into the freeform agent's system prompt. Queries ChatMessage table: last 50 messages OR 7 days, whichever is smaller.
- **Inputs:** Any freeform agent invocation
- **Outputs:** System prompt includes a "Recent conversation history" section with prior chat messages
- **Business rules:** Query is project-scoped, not conversation-scoped. Context enrichment, not conversational continuity. Window parameters hardcoded in V1 per PRD Section 8.2.
- **File:** `src/app/api/chat/route.ts` (or the freeform agent's system-prompt builder)

### 2.10 Needs Review Session-End UX (REQ-HARNESS-010)

- **What it does:** After the Transcript Processing Pipeline completes, the session-completion message shows entities grouped by confidence tier (HIGH/MEDIUM/LOW) and a "Needs Review" section listing items where `needsReview === true` with their `reviewReason`. Also surfaces items queued to `pending_review` by pipeline stage 5 (Apply).
- **Inputs:** Completed transcript processing pipeline run
- **Outputs:**
  - Backend: ChatMessage.toolCalls JSON includes `confidenceTiers` (counts per tier) and `needsReviewItems` (array of {entityType, entityId, title, reviewReason})
  - Frontend: Extraction cards component renders confidence tier summary bar and a "Needs Review" section with edit/confirm/discard actions per item
- **Business rules:** Items in `pending_review` (confidence ≤ 0.85) and items with `needsReview === true` both surface here. If none, the Needs Review section is not rendered. Depends on REQ-HARNESS-001.
- **Files:** `src/lib/inngest/functions/transcript-processing.ts` (save-to-conversation step), extraction cards UI component (TBD — locate during implementation)

---

## 3. Functional Requirements — Four Deterministic Pipelines

Each pipeline replaces a specific generic harness task type. Pipeline stages are explicit steps in an Inngest step function. Stages are idempotent and retry-safe. Stage-failure policy (default):

- Up to 3 retries per stage (Inngest step-level retry).
- On final failure: partial pipeline state is preserved, the run is marked `failed`, and the item is escalated to a human-review queue with a link back to the raw input and all completed stage outputs.
- Raw transcript / raw input is always retained, even on total failure.
- Per-stage error behavior detail is outstanding — see §8.

### 3.1 Transcript Processing Pipeline (REQ-PIPELINE-001)

Replaces the generic `TRANSCRIPT_PROCESSING` harness task. Seven stages:

| # | Stage | Implementation | Notes |
|---|-------|----------------|-------|
| 1 | Segment | Haiku (via model router) | Split into speaker turns, chunk to ~500 tokens |
| 2 | Extract candidates | Haiku | Structured output: questions, answers, decisions, requirements, risks, action items, each with confidence score |
| 3 | Entity resolution | Deterministic + hybrid search | Retrieve top-K existing entities per candidate (pgvector + tsvector) |
| 4 | Reconcile | Sonnet | For each candidate + matches: decide `create_new | merge_with_existing | update_existing` |
| 5 | Apply | Deterministic | Auto-apply if confidence > 0.85 (V1 threshold — see §8). Below threshold → `pending_review` queue |
| 6 | Impact assessment | Sonnet | Identify unblocked stories, contradicted decisions, new questions raised |
| 7 | Log | Deterministic | Create `pipeline_runs` row + `session_log` entry |

- **Inputs:** raw transcript text, projectId, userId, optional meetingId
- **Outputs:** created/updated entity IDs, pending_review queue entries, impact summary, pipeline_run record
- **Model routing:** stages 1, 2 → Haiku; stages 4, 6 → Sonnet; all via `model_router.resolve_model(intent)`
- **Idempotency:** stage `(pipeline_run_id, stage_name)` unique. Re-running a stage produces the same outputs given the same inputs.
- **Confidence cutoff:** 0.85 for auto-apply (V1 default, see §8 outstanding calibration).
- **File structure:** `src/lib/pipelines/transcript-processing/` with one file per stage + `index.ts` Inngest step function.

### 3.2 Answer Logging Pipeline (REQ-PIPELINE-002) — NEW

Handles free-text answers from users (not a replacement — net-new scope from addendum §5.2.2). Six stages:

| # | Stage | Implementation | Notes |
|---|-------|----------------|-------|
| 1 | Retrieve candidate questions | Deterministic + hybrid search | pgvector + tsvector over open questions |
| 2 | Match | Sonnet | Best matching question OR "standalone decision" |
| 3 | Apply | Deterministic | Update question (mark answered) or create a new decision |
| 4 | Impact assessment | Sonnet | Unblocked items, contradicted decisions, new questions raised |
| 5 | Propagate | Deterministic | Apply impacts, create conflict records |
| 6 | Annotate org KB | Sonnet | Propose Layer 4 annotations when Salesforce components are mentioned |

- **Inputs:** free-text answer, projectId, userId, optional targetQuestionId (if user pre-linked)
- **Outputs:** updated question or new decision, conflict records, proposed org-KB annotations (queued for review per Phase 6 rules)
- **Model routing:** stages 2, 4, 6 → Sonnet via router
- **File structure:** `src/lib/pipelines/answer-logging/` with one file per stage + Inngest step function.

### 3.3 Story Generation Pipeline (REQ-PIPELINE-003)

Replaces the generic `STORY_GENERATION` harness task. Seven stages:

| # | Stage | Implementation | Notes |
|---|-------|----------------|-------|
| 1 | Assemble context | Deterministic | Epic/feature, requirements, Q&A via hybrid search, candidate components via `search_org_kb`. Consumes REQ-HARNESS-008 context expansion |
| 2 | Draft story | Sonnet | Structured output per mandatory field schema |
| 3 | Validate mandatory fields | Deterministic | Ensure all required fields present (title, description, AC, components, etc.) |
| 4 | Component cross-reference | Deterministic + hybrid search | Verify referenced components exist; flag unknowns |
| 5 | Resolve conflicts | Sonnet (conditional) | Only runs if stage 4 flagged unknowns or mismatches |
| 6 | Typography/branding validator | Deterministic | Invokes `firm-rules.postProcessOutput` (REQ-HARNESS-003) |
| 7 | Return draft | Deterministic | Persist with `draft` status |

- **Inputs:** epicId, projectId, userId, optional explicit requirement set
- **Outputs:** draft Story record(s), conflict notes, component-reference report
- **Model routing:** stages 2, 5 → Sonnet via router
- **Eval coverage:** REQ-HARNESS-012 adds 15 labeled fixtures against this pipeline.
- **File structure:** `src/lib/pipelines/story-generation/` with one file per stage + Inngest step function.

### 3.4 Briefing/Status Pipeline (REQ-PIPELINE-004)

Replaces the generic `BRIEFING` harness task. Five stages:

| # | Stage | Implementation | Notes |
|---|-------|----------------|-------|
| 1 | Fetch metrics | Deterministic SQL | Per briefing type. 5-minute cache keyed by (projectId, briefingType) |
| 2 | Assemble narrative context | Deterministic | Combine metrics with Layer 3 context |
| 3 | Synthesize | Sonnet | Narrative prose per briefing-type template |
| 4 | Validate | Deterministic | Typography, branding, AI-phrase strip (via REQ-HARNESS-003) |
| 5 | Cache and return | Deterministic | Compute `inputs_hash` for cache invalidation |

- **Briefing types:** `daily_standup`, `weekly_status`, `executive_summary`, `blocker_report`, `discovery_gap_report`, `sprint_health`
- **Inputs:** projectId, briefingType, optional recipientRole
- **Outputs:** briefing text, cache metadata, inputs_hash
- **Model routing:** stage 3 → Sonnet via router
- **File structure:** `src/lib/pipelines/briefing/` with one file per stage + Inngest step function. Briefing-type templates in `src/lib/pipelines/briefing/templates/`.

---

## 4. Functional Requirements — Freeform Agent (REQ-AGENT-FREEFORM-001)

The project-brain chat. One agent loop in the system. Built at the end of Phase 2 after pipelines land.

- **Model default:** Sonnet 4.6 via router (intent: `freeform_chat`).
- **"Think harder" mode:** routes to Opus 4.6 (intent: `freeform_chat_deep`). UI toggle.
- **System prompt:** includes Layer 3 context + chat history window (REQ-HARNESS-009) + firm rules (REQ-HARNESS-003).

**Read tools (no confirmation):**
- `search_project_kb` — hybrid search over project knowledge (questions, decisions, requirements, risks, articles)
- `search_org_kb` — hybrid search over org component knowledge
- `get_sprint_state` — current sprint, in-flight stories, blockers
- `get_project_summary` — Layer 3 project summary
- `get_blocked_items` — currently blocked stories/features and reasons
- `get_discovery_gaps` — open questions, unanswered requirements, coverage gaps

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

**Principle:** the freeform agent suggests and captures intent; pipelines execute deterministic work. Additional read tools under consideration — see §8.

**Persistence (per integration plan §399):** reuse the existing `Conversation` / `ChatMessage` / `ConversationType` models from `prisma/schema.prisma`. Add a new `ConversationType` enum value (e.g., `FREEFORM_AGENT`) or reuse `GENERAL_CHAT`. No new top-level `agent_conversations` or `agent_messages` table is introduced unless agent-specific metadata demands it during deep-dive. Any agent-specific metadata that does not fit the existing columns goes into a JSON column on `ChatMessage` rather than a new table.

---

## 5. Model Router Integration (REQ-HARNESS-011)

Retrofit every existing direct Claude API call in `engine.ts` and under `src/lib/agent-harness/tasks/` to go through `model_router.resolve_model(intent)` from Phase 11. No stage anywhere in the system hardcodes a model string.

- **Scope:** engine.ts, all existing task files, all four new pipelines (as they are built), the freeform agent.
- **Intent taxonomy:** defined in Phase 11. Phase 2 consumes it; it does not redefine it. At minimum this phase needs intents for: `transcript_segment`, `transcript_extract`, `transcript_reconcile`, `transcript_impact`, `answer_match`, `answer_impact`, `answer_org_annotate`, `story_draft`, `story_conflict_resolve`, `briefing_synthesize`, `freeform_chat`, `freeform_chat_deep`.
- **Verification:** grep across `src/lib/agent-harness/` and `src/lib/pipelines/` for any literal `"claude-"` or `anthropic.messages.create` outside the router module. Result: zero hits.

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

**New tables (per addendum §5.2):**
- `pipeline_runs` — one row per pipeline invocation: `{id, projectId, userId, pipelineType, status, inputsHash, startedAt, completedAt, errorJson}`
- `pipeline_stage_runs` — one row per stage execution: `{id, pipelineRunId, stageName, status, inputJson, outputJson, modelUsed, tokensIn, tokensOut, attempt, error}`
- `pending_review` — low-confidence candidates held for human review: `{id, projectId, pipelineRunId, entityType, candidateJson, confidence, reason, createdAt, resolvedAt, resolution}`

Exact column details to finalize in deep-dive.

---

## 8. Outstanding Items (Resolve in Step 3 Deep-Dive)

The following are explicit open items flagged by the integration plan. Deep-dive must resolve each before execution starts.

| # | Item | Context |
|---|------|---------|
| 1 | **Orphan TaskType enum re-mapping** | Values not covered by the four pipelines: `QUESTION_ANSWERING`, `STORY_ENRICHMENT`, `STATUS_REPORT_GENERATION`, `DOCUMENT_GENERATION`, `SPRINT_ANALYSIS`, `CONTEXT_PACKAGE_ASSEMBLY`, `ORG_QUERY`, `DASHBOARD_SYNTHESIS`, `ARTICLE_SYNTHESIS`. Each must be explicitly folded into a pipeline, routed to a different phase, or deprecated. Per integration plan §152-153. No generic task-type execution remains after Phase 2. |
| 2 | **Per-pipeline error/escalation behavior** | Default is 3 retries then human-review queue. Each pipeline may need custom escalation rules (e.g., does an impact-assessment failure block the whole transcript run, or finalize with a partial-impact note?). Specify per stage. |
| 3 | **Confidence threshold calibration** | V1 default is 0.85 for auto-apply vs `pending_review`. Calibrate against labeled data. May differ per pipeline and per entity type (questions vs decisions vs requirements). |
| 4 | **Additional freeform agent read tools** | Confirm the six read tools listed in §4 are sufficient. Candidates under consideration: `get_recent_sessions`, `get_milestone_progress`, `get_org_component_detail`, `get_question_thread`. |
| 5 | **Semantic similarity threshold for Story Gen eval** | REQ-HARNESS-012 assertion #2 needs a numeric threshold (e.g., cosine ≥ 0.80). Calibrate against gold fixtures. |
| 6 | **Pipeline table schema finalization** | `pipeline_runs`, `pipeline_stage_runs`, `pending_review` column definitions and indices. |

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
| Orphan TaskType invoked before deep-dive resolves mapping | Engine logs warning and rejects the call | HTTP 400 with message pointing to deep-dive resolution |
| Model router returns no model for an intent | Engine falls back to Sonnet default and logs a warning | N/A — Phase 11 behavior |
| Tool returns no entity tracking data | Engine treats as empty tracking. SessionLog still created | N/A — backwards compatible |

---

## 10. Integration Points

### From Phase 1
- **REQ-RBAC-001** (getCurrentMember auth fix) — auth foundation for every pipeline and the freeform agent.
- **REQ-RBAC-012** (prompt injection defense) — covers GAP-AGENT-005.
- **REQ-RBAC-007 secondary gap** (AI tool call role enforcement) — tools modified in this phase must respect the calling user's role via member context. Evaluate during implementation.

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
- [ ] Freeform agent system prompt includes 50-message / 7-day chat history
- [ ] Transcript pipeline completion surfaces confidence tiers and Needs Review items in UX

**Pipelines + agent + router + eval (new):**
- [ ] Transcript Processing Pipeline executes all 7 stages, idempotent, stage-level retry, escalates to human-review on 3 failures
- [ ] Answer Logging Pipeline executes all 6 stages with same durability guarantees
- [ ] Story Generation Pipeline executes all 7 stages; mandatory field schema enforced; typography validator runs
- [ ] Briefing/Status Pipeline supports all 6 briefing types with 5-minute cache
- [ ] Freeform agent loads 6 read tools without confirmation and 3 write tools with UI confirmation. Story creation / transcript processing / answer logging / document generation / sprint modification are unavailable
- [ ] "Think harder" mode routes freeform agent to Opus
- [ ] Zero literal model strings in `src/lib/agent-harness/` or `src/lib/pipelines/` outside the router module
- [ ] Phase 11 eval harness runs 15 Story Generation fixtures with mandatory field, semantic similarity, and component cross-reference assertions
- [ ] Orphan TaskType enum values all explicitly re-mapped per deep-dive resolution
- [ ] pipeline_runs, pipeline_stage_runs, and pending_review tables present and populated

---

## 12. Open Questions

All open items are consolidated in §8 "Outstanding Items (Resolve in Step 3 Deep-Dive)".

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 2`. GAP-001 → Phase 8. GAP-002 → Phase 5. GAP-005 duplicate of Phase 1. GAP-008 notifications deferred to Phase 8. |
| 2026-04-13 | Addendum integration (populated from integration plan) | Phase renamed to "Harness Hardening + Core Pipelines". Added four deterministic pipelines, freeform agent, model router retrofit, Story Generation eval fixtures. Preserved all 10 REQ-HARNESS items. Step 3 deep-dive still required before execution — see §8 for outstanding items. Pre-addendum spec archived as PHASE_SPEC.pre-addendum.md. |
