# Phase 2 Tasks: Harness Hardening + Core Pipelines

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 18
> Status: 0/18 complete
> Last Updated: 2026-04-13
> Note: Step 3 deep-dive complete (2026-04-13). All tasks ready for execution. See PHASE_SPEC.md §8 for resolved decisions.

---

## Execution Order

```
Task 1 (create_question fix) ──────────────────────────────────┐
  ├── Task 2 (firm typographic rules)    ─┐                     │
  ├── Task 3 (re-prompt loop)             │                     │
  ├── Task 4 (entity tracking)            ├── parallel          │
  ├── Task 5 (rate limiting + cost cap)   │                     │
  └── Task 6 (Layer 3 context functions) ─┘                     │
       ├── Task 7 (transcript context)   ─┐                     │
       ├── Task 8 (story gen context)     ├── parallel          │
       └── Task 9 (chat history)         ─┘                     │
            └── Task 10 (Needs Review UX) ───────────────────── │
                 └── Task 16 (model router retrofit) ── depends on Phase 11
                      ├── Task 11 (Transcript Processing Pipeline)
                      │    ├── Task 12 (Answer Logging Pipeline)
                      │    ├── Task 13 (Story Generation Pipeline) ──┬── Task 17 (Story Gen + Briefing eval fixtures)
                      │    └── Task 14 (Briefing/Status Pipeline)    │
                      └── Task 15 (Freeform Agent) ─── depends on 11-14
Task 18 (orphan TaskType enum removal + grep CI check) ── depends on 11, 12, 13, 14 (once their replacements are live)
```

---

## Tasks

### Task 1: Fix create_question confidence/needsReview/reviewReason fields

| Attribute | Details |
|-----------|---------|
| **Scope** | Add `confidence`, `needsReview`, and `reviewReason` to the `prisma.question.create` data block in `create-question.ts`. Match the pattern used by `create-decision.ts`, `create-requirement.ts`, and `create-risk.ts`. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Given AI calls `create_question` with `confidence: "LOW"` and `needsReview: true` and `reviewReason: "Ambiguous scope"`, the Question record is created with all three fields populated
- [ ] Given AI calls `create_question` without these fields, schema defaults apply (confidence: HIGH, needsReview: false, reviewReason: null)
- [ ] Verified by reading `create-decision.ts` to confirm the pattern matches
- [ ] **Sanitization (PRD-22-05):** AI-supplied text fields (`text`, `context`, any free-text) are routed through `src/lib/agent-harness/tools/sanitize.ts` before Prisma write. Given AI supplies `<script>alert(1)</script>` as a question title, the stored title contains no `<script>` tag; unit test covers it. Applies symmetrically to `create_decision`, `create_requirement`, `create_risk`, plus any `update_*` tool that accepts AI-supplied strings.
- [ ] **Role-scope (PRD-6-02, DECISION-10):** the tool `execute` receives `member: { id, role, projectId }`; calls lacking the required role return `{ error: 'tool_unavailable', reason: 'role_scope' }` without DB write.
- [ ] **Archive gate (DECISION-10):** `assertProjectWritable(projectId)` from Phase 9 is invoked before Prisma write; archived-project calls return / throw 409.

Traces to: REQ-HARNESS-001, PRD-22-05 (DECISION-08), PRD-6-02, DECISION-10.

**Implementation Notes:**
File: `src/lib/agent-harness/tools/create-question.ts` (~line 128).
Add to the `prisma.question.create({ data: { ... } })` block:
```ts
confidence: input.confidence ?? "HIGH",
needsReview: input.needsReview ?? false,
reviewReason: input.reviewReason ?? null,
```
Also verify the tool's Zod schema / input_schema exposes these three fields for the transcript-processing task context. The other three tools (`create-decision.ts`, `create-requirement.ts`, `create-risk.ts`) are the reference implementation.

---

### Task 2: Create firm typographic rules module

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `src/lib/agent-harness/firm-rules.ts` with a prompt addendum string and a `postProcessOutput` function. Wire the addendum into `buildSystemPrompt` in `engine.ts` and the post-processing into the engine's return path. Also reused by Story Generation Pipeline stage 6 and Briefing Pipeline stage 4. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `buildSystemPrompt` in engine.ts injects the firm rules addendum into every task's system prompt
- [ ] `postProcessOutput` replaces em dashes and en dashes with hyphens
- [ ] `postProcessOutput` strips known AI-characteristic phrases: "Certainly!", "Great question!", "I'd be happy to", "Absolutely!", "Of course!"
- [ ] `postProcessOutput` does NOT alter text inside backticks or double-quoted strings
- [ ] All existing task types receive the firm rules in their system prompt without per-task changes
- [ ] **Date format enforcement (PRD-6-11):** given AI output "on 4/10/2026 we decided...", `postProcessOutput` rewrites to "on April 10, 2026 we decided...". Unit test covers the regex.
- [ ] **Firm terminology (PRD-6-12):** given AI output contains "custom entity", `postProcessOutput` replaces with "custom object". Maintain a firm-terminology map (`FIRM_TERMINOLOGY`) in `firm-rules.ts`; each entry produces a unit-test assertion.

Traces to: REQ-HARNESS-003, PRD-6-09, PRD-6-10, PRD-6-11, PRD-6-12.

**Implementation Notes:**
Create `src/lib/agent-harness/firm-rules.ts`:
```ts
export const FIRM_RULES_ADDENDUM = `
## Firm Typographic Rules (mandatory)
- Never use em dashes or en dashes. Use hyphens (-) or rephrase.
- Never use AI-characteristic phrases: "Certainly!", "Great question!", "I'd be happy to", "Absolutely!", "Of course!", "Here's", "Let me".
- Date format: Month DD, YYYY (e.g., April 10, 2026).
- Use standard Salesforce terminology: "custom object" not "custom entity", "record type" not "record category".
- Write in a professional, direct tone. No filler phrases.
`;

export function postProcessOutput(text: string): string {
  // Replace em/en dashes with hyphens (skip content inside backticks)
  // Strip AI-characteristic phrases
  // Return cleaned text
}
```
In `engine.ts`, append `FIRM_RULES_ADDENDUM` to the system prompt in `buildSystemPrompt`. Call `postProcessOutput` on the final text result before returning from `executeTask`.

---

### Task 3: Implement output validation re-prompt loop

| Attribute | Details |
|-----------|---------|
| **Scope** | Modify the execution flow in `engine.ts` after the `outputValidator` call (~lines 286-290). When validation fails, construct a correction message from `ValidationResult.corrections[]` and re-call Claude, up to `maxRetries` attempts. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Given output validation fails with corrections `["Missing 'Current Focus' section"]`, the engine sends a follow-up message to Claude with those corrections
- [ ] Given maxRetries is 2 and both re-prompts still fail validation, the engine returns the last output with `validation.valid: false`
- [ ] Given output validation passes on the first try, no re-prompt occurs
- [ ] Given maxRetries is 0, no re-prompt loop runs (backwards compatible)
- [ ] Re-prompt attempts are logged in the SessionLog (total attempts count)

**Implementation Notes:**
In `engine.ts`, after the initial `outputValidator` call, wrap in a loop:
```ts
let validationAttempts = 0;
let validation = taskDef.outputValidator(result);
while (!validation.valid && validationAttempts < taskDef.maxRetries) {
  validationAttempts++;
  const correctionMessage = `Output validation failed. Please fix: ${validation.corrections?.join("; ")}`;
  result = await callClaude(/* ... with correction appended */);
  validation = taskDef.outputValidator(result);
}
```

---

### Task 4: Populate SessionLog entity tracking fields

| Attribute | Details |
|-----------|---------|
| **Scope** | Modify the engine's tool execution loop to accumulate `{entityType, entityId, action}` tracking data from each tool call. Write accumulated arrays to `SessionLog.entitiesCreated` and `SessionLog.entitiesModified`. Update all tool execute functions to return tracking data. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] After a transcript processing session that creates 3 questions and 2 decisions, SessionLog.entitiesCreated contains 5 entries with correct entityType and entityId
- [ ] Tool execute functions return `{entityType, entityId, action: "created"}` alongside their existing return values
- [ ] Tools that don't create/modify entities return no tracking data — engine handles gracefully
- [ ] Existing SessionLog fields are unaffected
- [ ] **Role-scoped tool execution (PRD-6-02, REQ-RBAC-007):** engine passes `member: { id, role, projectId }` into every tool `execute`. Tool implementations consult the Phase 1 RBAC matrix; unauthorized roles return `{ error: 'tool_unavailable', reason: 'role_scope' }` without side effects. Unit test per tool.
- [ ] **Archive gate (DECISION-10):** every tool with write side effects (`create_*`, any `update_*`) invokes `assertProjectWritable(projectId)` from Phase 9's published helper before Prisma write. Archived-project calls return 409.

Traces to: REQ-HARNESS-004, PRD-6-02, REQ-RBAC-007, DECISION-10.

**Implementation Notes:**
Define a tracking type:
```ts
interface EntityTrack { entityType: string; entityId: string; action: "created" | "modified"; fieldsChanged?: string[] }
```
Each tool's execute function returns `{ result: ..., tracking?: EntityTrack }`. Audit all tools in `src/lib/agent-harness/tools/` and add tracking to each. In the engine's tool execution loop, collect tracking into `entitiesCreated` and `entitiesModified` arrays, then write on `prisma.sessionLog.create`.

---

### Task 5: Build rate limiting enforcement core + cost cap alerting

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `src/lib/agent-harness/rate-limiter.ts` with `checkRateLimits(projectId, userId)`. Add `aiDailyLimit` and `aiMonthlyCostCap` fields to the Project model (defaults: daily = 100, monthly = null/unlimited). Call `checkRateLimits` at the top of `executeTask` in engine.ts AND at every pipeline entry point (added in later tasks). Emit `COST_APPROACHING_CAP` notification event when monthly cost crosses 80% of cap (Phase 8 wires the notification template). |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Given a user has made 100 AI invocations today and project's aiDailyLimit is 100, the next call returns 429 with message "Daily AI invocation limit exceeded (100/100). Contact your PM to increase the limit."
- [ ] Given a project has reached 100% of its monthly cost cap, the next call returns 429 (hard block)
- [ ] Given monthly cost crosses 80% of cap, a `COST_APPROACHING_CAP` event is emitted ONCE per calendar month to PM role (pipeline still proceeds — soft alert)
- [ ] Given aiDailyLimit is null, daily limit is not enforced
- [ ] Given aiMonthlyCostCap is null, monthly limit is not enforced (`null` = unlimited)
- [ ] Daily limit has NO soft threshold — hard block only at 100%
- [ ] Schema migration adds nullable `aiDailyLimit Int?` (default 100 on new projects) and `aiMonthlyCostCap Decimal?` (default null) to Project model
- [ ] Cost constants sourced from Phase 11 model router config (not hardcoded)
- [ ] Soft-alert emit tracked in a `CostAlertLog` table (schema pinned in PHASE_SPEC §7.3) to prevent duplicate emits
- [ ] **`CostAlertLog` Prisma schema (pinned):** `{ id String @id @default(cuid()); projectId String; calendarMonth String; alertType AlertType; emittedAt DateTime @default(now()); @@unique([projectId, calendarMonth, alertType]) }` with `enum AlertType { COST_APPROACHING_CAP, DAILY_LIMIT_WARNING }`.
- [ ] **`COST_APPROACHING_CAP` event payload (pinned):** `{ projectId: string, thresholdPct: 80, currentCostUsd: number, capUsd: number, calendarMonth: string }`. Phase 8 consumes this exact shape.
- [ ] **Context-window budget (PRD-6-07):** before each Claude call from engine or pipeline, compute total input tokens (system + context + messages); if > 180K, truncate Layer 3 blocks in priority order (`recent_sessions` > `milestone_progress` > `article_summaries`); log `{type: 'context_truncated', droppedBlocks}` to `SessionLog.warnings`.
- [ ] **Model router contract (GAP-11):** Task reads `costPer1KInput` / `costPer1KOutput` from `model_router.resolve_model(intent)` return shape pinned in PHASE_SPEC §5.
- [ ] **UTC day-boundary:** daily count is bound at `executeTask` entry time (UTC midnight); later stages of a long-running pipeline do not recount. AC test covers a pipeline that crosses UTC midnight.
- [ ] **Null cap semantics:** both `aiDailyLimit` null AND `aiMonthlyCostCap` null → no enforcement, no warning.
- [ ] **Firm-wide cap (DECISION-09):** Phase 2 does NOT implement firm-level blocking in pipeline runs. Firm-wide monthly advisory alert is owned by Phase 7.

Traces to: REQ-HARNESS-005, PRD-23-03 (per-project), PRD-6-07, DECISION-09, DECISION-08 (PRD-6-07 owner).

**Implementation Notes:**
Cost constants sourced from the Phase 11 model router config (per model). Stored as named constants, not hardcoded.

Schema change:
```prisma
model Project {
  aiDailyLimit     Int?
  aiMonthlyCostCap Decimal?
}
```

---

### Task 6: Implement getRecentSessions and getMilestoneProgress context functions

| Attribute | Details |
|-----------|---------|
| **Scope** | Create two Layer 3 context assembly functions and export from `context/index.ts`. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `getRecentSessions(projectId, 5)` returns the 5 most recent SessionLog entries
- [ ] `getMilestoneProgress(projectId)` returns milestones with computed completion percentage
- [ ] Both return compact formatted strings (<1K tokens each)
- [ ] Both exported from `context/index.ts`
- [ ] Given no sessions exist, getRecentSessions returns empty result (no error)
- [ ] Given a milestone with 0 linked stories, completion is 0%

**Implementation Notes:**
Create `src/lib/agent-harness/context/recent-sessions.ts` and `src/lib/agent-harness/context/milestone-progress.ts`. Format each as a compact string suitable for system prompt injection.

---

### Task 7: Wire transcript context enrichment

| Attribute | Details |
|-----------|---------|
| **Scope** | Add `getRecentSessions` and `getArticleSummaries` (if available) to the transcript processing context loader's `Promise.all`. After Task 11 lands, this context is consumed by Transcript Processing Pipeline stages 2 and 4. |
| **Depends On** | Task 6 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Transcript context includes recent session summaries
- [ ] If `getArticleSummaries` exists, it is wired in
- [ ] If not, a TODO comment for Phase 6 is added and context loader still works
- [ ] Existing context is unchanged

---

### Task 8: Expand story generation context loader

| Attribute | Details |
|-----------|---------|
| **Scope** | Expand `storyGenerationContextLoader` to include epic-scoped answered questions, decisions, and org components. Wire in `getBusinessProcesses` and `getRelevantArticles` if they exist. After Task 13 lands, this becomes Story Generation Pipeline stage 1. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Context includes answered questions scoped to the target epic
- [ ] Context includes decisions scoped to the target epic
- [ ] Context includes org components referenced by the epic's stories
- [ ] If `getBusinessProcesses` exists, it is wired in; if not, TODO for Phase 6
- [ ] If `getRelevantArticles` exists, it is wired in; if not, TODO for Phase 6
- [ ] Existing context is unchanged

---

### Task 9: Add general chat history window (PRD-8-10)

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement the **PRD-8-10 general-chat** history loader: query recent `ChatMessage` records (last 50 messages OR 7 days, whichever is smaller) and include as a "Recent conversation history" section in the general-chat `/api/chat` branch system prompt. This is the non-agent path. The freeform agent uses a separate N=20 agent-turn window from `agent_messages` (Task 15), per Addendum §5.3-03. Do NOT wire the 50/7d window into the freeform agent's system prompt. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] General-chat (non-agent) system prompt includes recent `ChatMessage` history from prior chat sessions
- [ ] Window capped at 50 messages OR 7 days, whichever produces fewer messages
- [ ] History is project-scoped
- [ ] Current session messages are NOT duplicated
- [ ] If no prior chat history exists, the section is omitted
- [ ] History formatted as: "[Apr 8] User: ... | AI: ..."
- [ ] The freeform agent (Task 15) does NOT read this 50/7d window; it uses `agent_messages` last 20 turns per Addendum §5.3-03.

Traces to: REQ-HARNESS-009, PRD-8-10.

---

### Task 10: Build Needs Review session-end UX

| Attribute | Details |
|-----------|---------|
| **Scope** | Modify transcript processing Inngest function's save-to-conversation step to group entities by confidence tier and collect needsReview items (including entries queued to `pending_review` by Transcript Processing Pipeline stage 5). Update the extraction cards UI component to render confidence tier summary and Needs Review section. |
| **Depends On** | Task 1, Task 11 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] ChatMessage.toolCalls JSON includes `confidenceTiers: { HIGH, MEDIUM, LOW }`
- [ ] ChatMessage.toolCalls JSON includes `needsReviewItems: [{ entityType, entityId, title, reviewReason }]`
- [ ] Frontend renders a confidence tier summary bar
- [ ] Frontend renders a "Needs Review" section with edit/confirm/discard actions
- [ ] Each Needs Review item links to the entity's detail view
- [ ] If no items flagged, the Needs Review section is not rendered
- [ ] `pending_review` queue entries also surface in this UX

---

### Task 11: Build Transcript Processing Pipeline (REQ-PIPELINE-001)

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace the generic `TRANSCRIPT_PROCESSING` harness task with a 7-stage **async** Inngest step function in `src/lib/pipelines/transcript-processing/`. **Inputs:** `{ transcriptText, projectId, userId (nullable for background jobs), meetingType: 'discovery'|'planning'|'review'|'adhoc', attendees: string[], meetingDate: Date, meetingId? }` per Addendum §5.2.1-01. Stages: (1) Segment — Haiku, (2) Extract candidates — Haiku (emits `suspicious_content` Risk on prompt-injection content per PRD-22-10; extracts questions, answers, decisions, requirements, risks, action items, **scope changes**), (3) Entity resolution — deterministic + hybrid search, (4) Reconcile — Sonnet, (5) Apply — deterministic with strict `> 0.85` confidence threshold; calls `assertProjectWritable` before each entity write, (6) Impact assessment — Sonnet **(non-blocking — failure finalizes run with `completed_with_warnings`)**, (7) Log — writes SessionLog linked to `pipeline_run_id`; sets `article.isStale = true` + `staleReason` on articles referencing `entitiesModified` (PRD-13-28). Each stage idempotent, 3-retry. Raw transcript always retained. Writes `pipeline_runs`, `pipeline_stage_runs`, `pending_review`, `conflicts_flagged`. Replaces the 10 Phase 11 `transcript-processing` fixture stubs with real expectations. |
| **Depends On** | Task 5, Task 7, Task 16, Phase 11 (Tasks 1, 2, 4, 5, 7) |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] All 7 stages execute in order as an Inngest step function (async, fire-and-forget)
- [ ] Re-running any stage with the same inputs produces the same outputs (idempotent)
- [ ] Blocking stages (1-5, 7) fail the run on 3-retry exhaustion; human-review queue entry created with partial state
- [ ] Stage 6 (Impact) is non-blocking: failure marks run `completed_with_warnings`, creates a `pending_review` entry for manual impact review, does NOT roll back stage 5 applied entities
- [ ] Raw transcript text is retained on `pipeline_runs.inputJson` even on total failure
- [ ] Candidates with **strict** `confidence > 0.85` auto-apply; `≤ 0.85` (including exactly 0.85) enqueue to `pending_review`
- [ ] `pipeline_stage_runs` records per stage with modelUsed, tokens, attempt count
- [ ] All Claude calls go through `model_router.resolve_model(intent)` (Task 16)
- [ ] Rate limit pre-check runs before stage 1
- [ ] Stage 6 writes `conflicts_flagged` rows (shared schema with Answer Logging stage 4)
- [ ] Replaces all 10 stub expectations in `/evals/transcript-processing/expectations.ts`:
  - Extraction F1 per candidate type (questions, decisions, requirements, risks, action items, scope changes)
  - Entity resolution top-1 accuracy
  - Reconciliation decision accuracy (`create_new` / `merge_with_existing` / `update_existing`)
  - Per-fixture `TODO(phase-2)` comments removed
- [ ] **Return contract (Addendum §5.2.1-09):** pipeline returns `{ applied_changes, pending_review, new_questions_raised, blocked_items_unblocked, conflicts_detected, session_log_id, pipeline_run_id }` with all 7 keys populated (empty arrays allowed). JSON schema committed at `src/lib/pipelines/transcript-processing/contract.ts`; downstream consumers (Phase 3, Phase 7) import from this path.
- [ ] **Suspicious content (PRD-22-10):** given a transcript containing a prompt-injection attempt (e.g., "Ignore previous instructions and..."), stage 2 emits at least one Risk candidate with `category: 'suspicious_content'` and `confidence: 'HIGH'`. No commands from transcript body are executed. Task 17 fixture list includes at least 1 prompt-injection fixture.
- [ ] **Article staleness (PRD-13-28):** after a session modifies an entity Q-X, any article in `article_entity_refs` pointing at Q-X has `isStale = true` and `staleReason = 'entity Q-X modified in session <sessionLogId>'`. If the `article_entity_refs` reference table is not yet present in the schema (Phase 6 owns), raise a cross-phase dependency flag in the task PR description.
- [ ] **Interruption (PRD-8-12):** on server restart / Inngest cancellation / explicit user abort, `pipeline_run.status = 'failed'` and `SessionLog.status = 'FAILED'`. All completed `pipeline_stage_runs` + `inputJson` preserved. No partial apply of in-flight stage.
- [ ] **Iteration & token budget (PRD-6-19):** stage 2 processes in chunks such that a single Claude call receives ≤ 20K input tokens; total iterations ≤ 8 per transcript. Exceeding either fails with `transcript_too_large`. Edge: single chunk > 180K after paragraph split fails with `chunk_too_large`.
- [ ] **Idempotency:** stage 1 computes `inputsHash = sha256(transcriptText)`; if a `pipeline_runs` row exists for `(projectId, inputsHash)` with status in (`queued`, `running`, `completed`) within the last 1h, API returns the existing `pipeline_run_id` rather than starting a new run.
- [ ] **Empty input / 0-token input:** rejected at API layer with HTTP 400 before any Claude call.
- [ ] **Background job (PRD-6-25):** given `userId: null`, all candidates with confidence ≤ 0.85 route to `pending_review`; no `clarifying_question` entity is created; `SessionLog.userId = 'SYSTEM'`.
- [ ] **Archive gate (DECISION-10):** stage 5 (Apply) invokes `assertProjectWritable(projectId)` before each entity write; archived projects return 409 without writes.
- [ ] **Meeting metadata in SessionLog:** `meetingType`, `attendees`, `meetingDate` are persisted on the pipeline_run row (or SessionLog metadata) for downstream audit.

Traces to: REQ-PIPELINE-001, Addendum §5.2.1-01/02/03/04/05/06/07/08/09/10, PRD-13-28, PRD-22-10, PRD-8-12, PRD-6-07, PRD-6-19, PRD-6-25, DECISION-10.

---

### Task 12: Build Answer Logging Pipeline (REQ-PIPELINE-002)

| Attribute | Details |
|-----------|---------|
| **Scope** | New pipeline in `src/lib/pipelines/answer-logging/`. **Sync-capable** — API route awaits completion; Inngest used for durability/retries. 6 stages: (1) Retrieve candidate questions — deterministic + hybrid search, (2) Match — Sonnet with tiered confidence, (3) Apply — deterministic, (4) Impact assessment — Sonnet **(non-blocking)**, (5) Propagate — deterministic, (6) Annotate org KB — Sonnet. Same durability guarantees as Task 11. Replaces the 10 Phase 11 `answer-logging` fixture stubs with real expectations. |
| **Depends On** | Task 5, Task 11, Task 16, Phase 11 (Tasks 1, 2, 4, 5, 7) |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] All 6 stages execute in order as an Inngest step function (sync-capable — API route awaits)
- [ ] Stage 2 tiered routing: `≥ 0.85` auto-update existing question, `0.70–0.85` enqueue to `pending_review` with top-K candidates surfaced to user, `< 0.70` create standalone decision
- [ ] `targetQuestionId` pre-linked by user bypasses stage 2 confidence gate
- [ ] Stage 4 (Impact) is non-blocking: failure marks run `completed_with_warnings`, does NOT roll back stage 3 applied changes
- [ ] Stage 5 creates `conflicts_flagged` records when impact assessment flags contradictions
- [ ] Stage 6 produces Layer 4 annotation proposals written to `pending_review` with `entity_type='annotation'` (Phase 6 consumes)
- [ ] Idempotent stages, 3-retry, human-review escalation on failure
- [ ] All Claude calls through the router
- [ ] Rate limit pre-check runs before stage 1
- [ ] Replaces all 10 stub expectations in `/evals/answer-logging/expectations.ts`:
  - Match accuracy per tier (exact, semantic, standalone)
  - Confidence bucket precision (≥ 0.85 / 0.70–0.85 / < 0.70)
  - Impact detection accuracy (contradictions flagged correctly)
  - Annotation proposal accuracy (Salesforce components correctly identified)
  - Per-fixture `TODO(phase-2)` comments removed
- [ ] **Stage 1 K=5 locked (Addendum §5.2.2-02):** stage 1 retrieves exactly the top-5 open questions via hybrid search.
- [ ] **Article staleness (PRD-13-28):** stage 5 (Propagate) sets `article.isStale = true` + `staleReason` on articles referencing `entitiesModified`.
- [ ] **Interruption (PRD-8-12):** on Inngest cancellation / user abort, `pipeline_run.status = 'failed'` and `SessionLog.status = 'FAILED'`; no partial apply.
- [ ] **Background job (PRD-6-25):** `userId: null` invocations route all sub-0.85 matches to `pending_review`; no inline confirm/correct prompt.
- [ ] **Archive gate (DECISION-10):** stage 3 (Apply) and stage 5 (Propagate) call `assertProjectWritable(projectId)` before Prisma writes.

Traces to: REQ-PIPELINE-002, Addendum §5.2.2-01 through -06, PRD-13-28, PRD-8-12, PRD-6-25, DECISION-10.

---

### Task 13: Build Story Generation Pipeline (REQ-PIPELINE-003)

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace the generic `STORY_GENERATION` harness task with a 7-stage **async** Inngest step function in `src/lib/pipelines/story-generation/`. Supports `mode: 'generate'` and `mode: 'enrich'` (replaces legacy `STORY_ENRICHMENT`). Stages: (1) Assemble context — deterministic (consumes Task 8), (2) Draft — Sonnet (in enrich mode, preserves user-modified fields), (3) Validate mandatory fields — deterministic, (4) Component cross-reference — deterministic + hybrid search (via `search_org_kb` — returns `not_implemented` until Phase 6), (5) Resolve conflicts — Sonnet (conditional, **non-blocking**), (6) Typography validator — invokes firm-rules.postProcessOutput, (7) Return draft — persist with `draft` status (or amended version row in enrich mode). |
| **Depends On** | Task 2, Task 5, Task 8, Task 16, Phase 11 (Tasks 1, 2, 4, 5) |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] All 7 stages execute as an Inngest step function (async)
- [ ] `mode: 'generate'` creates a new draft Story
- [ ] `mode: 'enrich'` accepts `existingStoryId`, runs all 7 stages, preserves user-modified fields in stage 2, persists as a new version row on the existing Story
- [ ] Invoking `mode: 'enrich'` without `existingStoryId` returns HTTP 400 before any Claude call
- [ ] Stage 3 rejects drafts missing any mandatory field
- [ ] Stage 4 calls `search_org_kb`; gracefully handles `not_implemented: true` response (treats component universe as empty, flags all references as unknowns for Phase 6 follow-up)
- [ ] Stage 5 only runs when stage 4 flagged unknowns/mismatches
- [ ] Stage 5 is non-blocking: if it fails on 3 retries, draft persists with `needs_component_review` flag, run marked `completed_with_warnings`
- [ ] Stage 6 applies firm typographic rules before persistence
- [ ] Drafts persist with `draft` status; no auto-promotion
- [ ] Idempotent stages, 3-retry, human-review escalation on blocking-stage failure
- [ ] All Claude calls through the router
- [ ] Rate limit pre-check runs before stage 1
- [ ] **Mandatory Story field schema (Addendum §5.2.3-02, PRD-10-08):** draft Story must populate all 7 fields: `persona` (free-text, "As a ..." format), `description`, `acceptanceCriteria[]` (Given/When/Then), `parentEpicId` OR `parentFeatureId`, `estimatedStoryPoints` (AI-suggested), `testCaseStubs[]` (generated from AC per PRD-10-08), `impactedComponents[]`. Stage 3 validation rejects drafts missing any. Task 17 fixture coverage asserts presence of all 7.
- [ ] **Interruption (PRD-8-12):** on cancellation / abort, `pipeline_run.status = 'failed'` and `SessionLog.status = 'FAILED'`; draft is not persisted.
- [ ] **Archive gate (DECISION-10):** stage 7 (Return draft) calls `assertProjectWritable(projectId)` before persisting the draft Story (or amended version row in enrich mode).

Traces to: REQ-PIPELINE-003, Addendum §5.2.3-01 through -08, PRD-10-08, PRD-8-12, DECISION-10.

---

### Task 14: Build Briefing/Status Pipeline (REQ-PIPELINE-004)

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace the generic `BRIEFING` harness task with a 5-stage **sync-with-cache** Inngest step function in `src/lib/pipelines/briefing/`. Stages: (1) Fetch metrics — deterministic SQL with 5-minute cache, (2) Assemble narrative context — deterministic, (3) Synthesize — Sonnet per briefing-type template, (4) Validate — typography/branding/AI-phrase strip, (5) Cache and return with `inputs_hash`. Support all 6 briefing types: daily_standup, weekly_status, executive_summary, blocker_report, discovery_gap_report, sprint_health. Cache via reused infra if present; else add `briefing_cache` table. |
| **Depends On** | Task 2, Task 5, Task 16, Phase 11 (Tasks 1, 2, 4, 5) |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] All 5 stages execute as an Inngest step function (sync-capable — API route awaits)
- [ ] All 6 briefing types have dedicated templates in `src/lib/pipelines/briefing/templates/`
- [ ] Cache key: `(projectId, briefingType, inputs_hash)` with 5-min TTL (passive, no active invalidation in V1)
- [ ] `inputs_hash` = sha256 of sorted metric query result from stage 1
- [ ] Cache HIT (matching `inputs_hash` within TTL) short-circuits stages 2-4 and returns cached result
- [ ] Cache MISS (new `inputs_hash` OR TTL expired) runs stages 2-5 and overwrites cache row
- [ ] Stage 4 strips AI-characteristic phrases via `firm-rules.postProcessOutput`
- [ ] **Failures are never cached** — any stage failure returns "briefing unavailable, retry" (HTTP 503) and leaves existing cache untouched
- [ ] Idempotent stages, 3-retry, human-review escalation on blocking-stage failure
- [ ] All Claude calls through the router
- [ ] Rate limit pre-check runs before stage 1
- [ ] **`BriefingCache` Prisma schema (pinned — no longer optional):** `{ projectId String; briefingType BriefingType; inputsHash String; briefingText String @db.Text; generatedAt DateTime @default(now()); @@id([projectId, briefingType]); @@index([projectId, briefingType, inputsHash]) }`. Schema ships with Task 14 migration. Existing cache infra is NOT reused.
- [ ] **Numeric-accuracy runtime check (Addendum §5.2.4-04):** stage 4 extracts numeric tokens from narrative via regex `\d+(\.\d+)?%?`; asserts each appears in stage 1 metrics. Given stage 1 reports 5 blocked stories and stage 3 narrative says "7 blocked stories", stage 4 detects the mismatch, re-runs stage 3 once, and fails with `metric_hallucination` if the retry still disagrees.
- [ ] **Current Focus / Recommended Focus mapping (PRD-5-30, PRD-17-05):** `daily_standup` output is consumable directly by the Phase 7 dashboard "Current Focus" tile; `weekly_status` output by "Recommended Focus". Contract for each tile documented in the template file.
- [ ] **Invalid `briefingType`:** validated at API layer before stage 1; returns HTTP 400.
- [ ] **Interruption (PRD-8-12):** on cancellation, `pipeline_run.status = 'failed'` and `SessionLog.status = 'FAILED'`; no stale cache row written.
- [ ] **Archive gate (DECISION-10):** stage 5 (Cache and return) invokes `assertProjectWritable(projectId)` before upserting `BriefingCache`.
- [ ] `invokeBriefingPipeline` function exported from `src/lib/pipelines/briefing/index.ts` with signature pinned in PHASE_SPEC §3.4 Published Interfaces
- [ ] `BriefingType` enum exported with all 6 values (daily_standup, weekly_status, executive_summary, blocker_report, discovery_gap_report, sprint_health)
- [ ] `BRIEFING_REQUESTED` Inngest event handler registered with pinned payload schema
- [ ] Phase 5 Task 14 and Phase 7 Task 16 can import `BriefingType` and `invokeBriefingPipeline` from the pinned path

Traces to: REQ-PIPELINE-004, Addendum §5.2.4-01 through -05, PRD-5-30, PRD-17-05, PRD-8-12, DECISION-10.

---

### Task 15: Build Freeform Agent (REQ-AGENT-FREEFORM-001)

| Attribute | Details |
|-----------|---------|
| **Scope** | Build the "project brain chat" agent loop in `src/lib/agent-freeform/`. Single agent loop. Default model Sonnet 4.6 via router (intent `freeform_chat`); "think harder" mode routes to Opus 4.6 (intent `freeform_chat_deep`). Register **8 read tools** (no confirmation) and 3 write tools (UI confirmation). Agent never invokes pipelines — write tools route through the standard tool layer. System prompt builds from (1) Tier 1 project summary, (2) last **20 agent turns** (Addendum §5.3-03 default) loaded from `agent_messages` by `agent_conversation_id`, (3) firm rules addendum (Task 2), (4) dynamically retrieved tool outputs. Agent turns persisted to `agent_conversations` + `agent_messages` (tables created in Phase 11 per DECISION-01). Wire `src/app/api/chat/route.ts` agent branch to this module. The PRD-8-10 general-chat branch (Task 9) remains separate. |
| **Depends On** | Task 2, Task 6, Task 9, Task 11, Task 12, Task 13, Task 14, Task 16 |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Read tools registered: `search_project_kb`, `search_org_kb`, `get_sprint_state`, `get_project_summary`, `get_blocked_items`, `get_discovery_gaps`, `get_recent_sessions`, `get_milestone_progress` — invocable without user confirmation (8 tools total)
- [ ] `get_recent_sessions` and `get_milestone_progress` wrap the REQ-HARNESS-006 context functions from Task 6
- [ ] Rejected tools NOT registered: `get_org_component_detail`, `get_question_thread` (covered by search primitives)
- [ ] Write tools registered: `create_question`, `create_risk`, `create_requirement` — require UI confirmation before persistence
- [ ] Write tools route through the standard agent-harness tool layer — agent does NOT invoke Transcript/Answer/Story/Briefing pipelines
- [ ] Story creation, transcript processing, answer logging, document generation, and sprint modification tools are NOT registered and attempts to invoke them fail with "tool not available"
- [ ] UI toggle routes agent between Sonnet (default) and Opus ("think harder")
- [ ] **System prompt composition (Addendum §5.3-03):** includes (1) Tier 1 project summary (explicit by name, not a generic "Layer 3 context"), (2) last **20 agent turns** (configurable; default 20) loaded from `agent_messages`, (3) firm rules addendum (Task 2), (4) dynamically retrieved tool outputs. Does NOT use the 50-message / 7-day general-chat window.
- [ ] **Persistence (DECISION-01, Addendum §5.3-07):** every agent turn is persisted to `agent_conversations` + `agent_messages` (tables owned by Phase 11). Given a conversation is resumed by `agent_conversation_id`, the stored messages rehydrate the agent's history correctly.
- [ ] **Archive gate (DECISION-10):** each write tool (`create_question`, `create_risk`, `create_requirement`) and the agent turn persist path invoke `assertProjectWritable(projectId)` before Prisma write.
- [ ] **Clarifying questions (PRD-6-23):** when the agent lacks enough info for a write tool, it asks an inline clarifying question rather than guessing. Behavior verified by a unit test with a deliberately ambiguous user prompt.
- [ ] Rate limit pre-check runs at agent invocation

Traces to: REQ-AGENT-FREEFORM-001, Addendum §5.3-01 through -07, DECISION-01, DECISION-10, PRD-6-23.

---

### Task 16: Model router retrofit

| Attribute | Details |
|-----------|---------|
| **Scope** | Retrofit every existing direct Claude call in `src/lib/agent-harness/engine.ts` and `src/lib/agent-harness/tasks/**` to go through `model_router.resolve_model(intent)` from Phase 11. No stage anywhere in agent-harness or pipelines hardcodes a model string. |
| **Depends On** | Phase 11 (model router delivered) |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] All calls to `anthropic.messages.create` in `src/lib/agent-harness/` go through the router
- [ ] Grep across `src/lib/agent-harness/` and `src/lib/pipelines/` for literal model strings (e.g., `"claude-"`) returns zero hits outside the router module
- [ ] Router receives an intent string per call; defaults handled by Phase 11 router config
- [ ] Existing task types continue to produce equivalent outputs (no model regression)

---

### Task 17: Story Generation + Briefing eval fixtures + assertions (REQ-HARNESS-012)

| Attribute | Details |
|-----------|---------|
| **Scope** | Add 15 labeled fixtures for the Story Generation Pipeline AND 10 labeled fixtures for the Briefing/Status Pipeline to the Phase 11 eval harness. Register per-pipeline assertions. Semantic similarity threshold locked at cosine ≥ 0.80. |
| **Depends On** | Phase 11 (eval harness delivered), Task 13, Task 14 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**

**Story Generation fixtures (15):**
- [ ] 15 fixtures committed under `/evals/story-generation/fixtures/`, tagged `story-generation`
- [ ] Each fixture has an input `{epicId, projectFixtureId, mode: 'generate' | 'enrich', existingStoryId?}` and a gold Story with title, description, acceptance criteria, components
- [ ] Coverage: ≥ 12 `mode: 'generate'` fixtures and ≥ 3 `mode: 'enrich'` fixtures
- [ ] Mandatory field presence assertion: all required Story fields non-empty
- [ ] Semantic similarity assertion: acceptance-criteria embedding similarity **cosine ≥ 0.80** (recalibrate after first run)
- [ ] Component cross-reference assertion: referenced components match gold's set within tolerance (F1 ≥ 0.85)
- [ ] Eval suite runs in CI against the Story Generation Pipeline
- [ ] **Mandatory field coverage (PRD-10-08, Addendum §5.2.3-02):** at least one fixture per required field confirms `persona`, `description`, `acceptanceCriteria`, `parentEpicId`/`parentFeatureId`, `estimatedStoryPoints`, `testCaseStubs`, `impactedComponents` are populated in the gold

**Briefing/Status fixtures (10):**
- [ ] 10 labeled fixtures committed under `/evals/briefing/fixtures/`, tagged `briefing-status`
- [ ] Coverage: at least 1 fixture per briefing type (`daily_standup`, `weekly_status`, `executive_summary`, `blocker_report`, `discovery_gap_report`, `sprint_health`) with 4 additional fixtures distributed across high-traffic types
- [ ] Briefing fixture assertions:
  - All template-required sections present for the briefing type
  - Firm-rules post-processing applied (no em dashes, no AI-characteristic phrases)
  - Cache key `inputs_hash` stable across re-runs with identical inputs (same sha256)
  - Numeric accuracy: metrics referenced in narrative match metrics from stage 1
- [ ] **Transcript prompt-injection fixture (PRD-22-10):** the transcript-processing fixture set includes ≥ 1 fixture containing a prompt-injection attempt; gold asserts stage 2 emits a `suspicious_content` Risk candidate and no injected command is applied
- [ ] Authored and maintained by Phase 2; Phase 11 harness hosts them

---

### Task 18: Orphan TaskType enum removal + grep CI check

| Attribute | Details |
|-----------|---------|
| **Scope** | Remove the 9 orphan TaskType enum values per the disposition matrix in PHASE_SPEC.md §8.1. Each value's replacement must be live before removal. Add a grep CI check to `.github/workflows/` that fails any PR reintroducing the removed values. |
| **Depends On** | Task 11, Task 12, Task 13, Task 14 (Phase 2 replacements live); downstream phases handle their own moved values (Phase 5, 6, 7, 8) |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `QUESTION_ANSWERING`, `STORY_ENRICHMENT`, `STATUS_REPORT_GENERATION`, `DOCUMENT_GENERATION`, `SPRINT_ANALYSIS`, `CONTEXT_PACKAGE_ASSEMBLY`, `ORG_QUERY`, `DASHBOARD_SYNTHESIS`, `ARTICLE_SYNTHESIS` removed from the TaskType enum in `prisma/schema.prisma`
- [ ] Prisma migration generated and applied cleanly
- [ ] Any code paths referencing these values deleted (no dead switch cases, no dead task definitions)
- [ ] New CI workflow `orphan-tasktype-check.yml` greps the codebase for any of the 9 removed identifiers as string literals and fails the PR on match
- [ ] Build and typecheck pass end-to-end after removal
- [ ] Downstream phase dependency note: Phase 5 (SPRINT_ANALYSIS, CONTEXT_PACKAGE_ASSEMBLY), Phase 6 (ORG_QUERY, ARTICLE_SYNTHESIS), Phase 7 (DASHBOARD_SYNTHESIS), Phase 8 (STATUS_REPORT_GENERATION, DOCUMENT_GENERATION) must introduce their own explicit entry points BEFORE their phase execution — NOT by adding new generic TaskType values

**Implementation Notes:**
Sequence matters: run Task 18 **after** Tasks 11-14 are merged so the in-Phase-2 replacements (`QUESTION_ANSWERING` → Answer Logging Pipeline, `STORY_ENRICHMENT` → Story Gen Pipeline enrich mode) are live. The cross-phase values (moved to Phases 5, 6, 7, 8) require those phases to stand up their entry points as part of their phase execution. Phase 2 removes the enum values; downstream phases are responsible for ensuring their dependencies on the removed values are satisfied via their own phase-specific code paths.

---

## Summary

| Task | Title | Depends On | Complexity | Status |
|------|-------|-----------|------------|--------|
| 1 | Fix create_question confidence/needsReview/reviewReason | — | S | Not Started |
| 2 | Create firm typographic rules module | — | M | Not Started |
| 3 | Implement output validation re-prompt loop | — | M | Not Started |
| 4 | Populate SessionLog entity tracking fields | — | M | Not Started |
| 5 | Build rate limiting enforcement core + cost cap alerting | — | M | Not Started |
| 6 | Implement getRecentSessions + getMilestoneProgress | — | S | Not Started |
| 7 | Wire transcript context enrichment | 6 | S | Not Started |
| 8 | Expand story generation context loader | — | S | Not Started |
| 9 | Add general chat history window | — | M | Not Started |
| 10 | Build Needs Review session-end UX | 1, 11 | M | Not Started |
| 11 | Build Transcript Processing Pipeline | 5, 7, 16, Phase 11 | L | Not Started |
| 12 | Build Answer Logging Pipeline | 5, 11, 16, Phase 11 | L | Not Started |
| 13 | Build Story Generation Pipeline | 2, 5, 8, 16, Phase 11 | L | Not Started |
| 14 | Build Briefing/Status Pipeline | 2, 5, 16, Phase 11 | L | Not Started |
| 15 | Build Freeform Agent | 2, 6, 9, 11, 12, 13, 14, 16 | L | Not Started |
| 16 | Model router retrofit | Phase 11 | S | Not Started |
| 17 | Story Gen + Briefing eval fixtures + assertions | Phase 11, 13, 14 | M | Not Started |
| 18 | Orphan TaskType enum removal + grep CI check | 11, 12, 13, 14 | S | Not Started |
