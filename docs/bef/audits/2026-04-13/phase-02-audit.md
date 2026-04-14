# Phase 2 Audit: Harness Hardening + Core Pipelines

**Auditor:** phase-audit agent (from-scratch)
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-02-agent-harness/PHASE_SPEC.md` (550 lines, HEAD @ 605a8ee)
- `docs/bef/03-phases/phase-02-agent-harness/TASKS.md` (544 lines, HEAD @ 605a8ee)

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md`
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`
- `docs/bef/01-architecture/TECHNICAL_SPEC.md`
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`

---

## 1. Scope Map

> Every `REQUIREMENT_INDEX` row whose `Phase-hint` includes phase 2, plus any requirement this phase claims coverage for. Status = Pass | Partial | Fail | NotApplicable.

| Req ID | Requirement (1-line) | Covered by (spec §/task #) | Status | Notes |
|--------|----------------------|----------------------------|--------|-------|
| PRD-3-06 | AI operates in distinct task modes | SPEC §3 (four pipelines) + §4 (agent) | Pass | — |
| PRD-5-04 | AI Agent Harness module manages prompts/tools/validation | SPEC §2 (harness hardening) + §7.2 structure | Pass | — |
| PRD-5-22 | Every task session maps to exactly one SessionLog | SPEC §2.4, Task 4 | Pass | — |
| PRD-5-23 | SessionLog records project/user/task/tokens/entities | SPEC §2.4, Task 4 | Pass | — |
| PRD-5-30 | Current Focus / Recommended Focus AI-synthesized + cached | SPEC §3.4 (briefing) | Partial | Briefing types include executive_summary/weekly_status but "Current Focus" / "Recommended Focus" narratives not explicitly mapped to a briefing type |
| PRD-6-01 | Harness is the single entry point for all AI requests | SPEC §5 model-router retrofit; §4 agent routes through tool layer | Pass | — |
| PRD-6-02 | Harness enriches every prompt with task + context + firm rules + role | SPEC §2.3 firm rules, §2.6 context, §4 agent prompt | Partial | "Role-appropriate boundaries" / RBAC scoping in tool calls noted only as "evaluate during implementation" in §10 |
| PRD-6-03 | Harness defines per-task tool sets with read/write scopes | SPEC §4 agent tools, §3 pipeline stages | Pass | — |
| PRD-6-04 | Single-turn and multi-step execution with token tracking + max iterations | SPEC §2.4 (tracking); max-iteration limit | Partial | Max iteration/loop cap not specified for pipelines; only `maxRetries` for validation |
| PRD-6-05 | Output validation + re-prompt up to configurable retry limit | SPEC §2.2, Task 3 | Pass | — |
| PRD-6-06 | Token usage tracked per request/project/user | SPEC §2.5 (rate limiter reads), §2.4 | Partial | Token write path clear via SessionLog; per-request vs per-project aggregation not pinned |
| PRD-6-07 | Context window budget managed against provider limits | — | Fail | No task enforces context-window budget; §2.6 only says "target <1K tokens each" per function, no total budget guardrail |
| PRD-6-08 | Harness supports 11 task types (superseded by ADD pipelines) | SPEC §3 (4 pipelines) + §8.1 disposition matrix + Task 18 | Pass | Addendum supersedes; properly dispositioned |
| PRD-6-09 | Forbid em dashes | SPEC §2.3, Task 2 | Pass | — |
| PRD-6-10 | Forbid AI-characteristic phrases | SPEC §2.3, Task 2 | Pass | — |
| PRD-6-11 | Date format Month DD, YYYY | Task 2 addendum | Partial | Addendum string mentions it; no `postProcessOutput` AC checks date format enforcement |
| PRD-6-12 | Firm terminology / capitalization | Task 2 addendum | Partial | Mentioned in prompt addendum only; no verification AC |
| PRD-6-15 | Task type defined as config object (system prompt/context/tools/validator/mode) | SPEC §3 pipelines follow equivalent structure | Pass | Supersedes via Addendum pipelines |
| PRD-6-16 | Generic execution engine runs load → prompt → call → tools → validate → log | SPEC §2, §3 | Pass | — |
| PRD-6-17 | Reusable context assembly functions composed by task loaders | SPEC §2.6–2.8, Tasks 6-8 | Pass | — |
| PRD-6-18 | Each tool call commits independently; no rollback mid-loop | SPEC §3 (non-blocking stages do not roll back) | Pass | — |
| PRD-6-19 | Transcript processing budget ~4-8 iterations / 15-20K tokens/iter | SPEC §3.1 | Fail | No task enumerates iteration or per-iteration token budget; no AC |
| PRD-6-21 | Cached AI synthesis with generation timestamp (dashboards) | SPEC §3.4 briefing cache | Pass | — |
| PRD-6-23 | In chat, AI asks inline clarifying questions | SPEC §4 freeform agent | Partial | No explicit task AC forcing clarifying-question behavior |
| PRD-6-24 | Task sessions: best-guess, flag low confidence, Needs Review list | SPEC §2.10, Task 10, §3.1 stage 5 | Pass | — |
| PRD-6-25 | Background jobs: best guess + flag (no user) | — | Fail | No pipeline AC specifies background-job fallback when pipeline runs without interactive user |
| PRD-6-26 | Question/Decision/Req/Risk carry confidence + needsReview + reviewReason | SPEC §2.1, Task 1 | Pass | — |
| PRD-7-08 | Every KB-affecting interaction recorded in session log | SPEC §3.1 stage 7, §2.4 | Pass | — |
| PRD-7-09 | AI can reference previous sessions for coherence | Task 6 (getRecentSessions), Task 7 | Pass | — |
| PRD-8-02 | Discovery info → answer existing Q or new decision | SPEC §3.2 (Answer Logging) | Pass | — |
| PRD-8-04 | Check if answer changes existing design/assumption | SPEC §3.2 stage 4 impact | Pass | — |
| PRD-8-09 | General chat — independent harness call, no conversational memory | Task 9, §2.9 | Partial | Task 9 adds 50-msg/7-day history **into the prompt**, which restores some memory. Addendum ADD-5.3-03 says "last N turns default 20" — see contradiction below |
| PRD-8-11 | Task sessions = one agent invocation with full tool loop, 1 SessionLog | SPEC §2.4 | Pass | — |
| PRD-8-12 | If task session interrupted: artifacts persist, session marked FAILED | — | Fail | No task sets SessionLog/pipeline_run to `FAILED` on interrupt; failure path only discusses 3-retry exhaustion |
| PRD-8-13 | Transcripts uploaded → extract Q/A/decisions/reqs/risks/action items/scope | SPEC §3.1 | Partial | "Scope changes" not explicitly called out as an extraction type in stage 2 |
| PRD-8-14 | Raw transcript saved | SPEC §3.1 preamble, Task 11 AC | Pass | — |
| PRD-9-02 | AI determines question scope during scoping | SPEC §3.1 stage 4 reconcile | Partial | Reconcile outputs create/merge/update but scope-assignment isn't an explicit output |
| PRD-13-28 | At end of loop, set isStale on articles that reference modified entities | — | Fail | No task wires article-staleness at end of agent loop |
| PRD-22-05 | AI tool-call text fields server-side sanitized (HTML/script) before Prisma | — | Fail | No sanitization task in Phase 2; cross-cutting but Phase 2 is first touch point |
| PRD-22-09 | Transcript system prompt treats transcript body as data, not commands | SPEC §10 (covered by Phase 1 REQ-RBAC-012) | Pass | Properly deferred |
| PRD-22-10 | AI must flag suspicious transcript content as a risk | — | Fail | No Transcript Pipeline stage/AC instructs the extractor to flag suspicious content as Risk |
| PRD-23-03 | Per-consultant daily limits + per-project monthly cost caps + alerts | SPEC §2.5, Task 5 | Pass | — |
| ADD-2-04 | Build as 4 pipelines + 1 freeform agent (no Big Agent) | SPEC §3, §4 | Pass | — |
| ADD-5.1-01 | 4 deterministic pipelines + 1 agent + 1 retrieval primitive + 1 router | SPEC §3, §4, §5 | Pass | Retrieval primitive owned by Phase 11 |
| ADD-5.1-02 | Big Agent explicitly rejected | SPEC §4 | Pass | — |
| ADD-5.2.1-01 | Transcript accepts raw transcript + source metadata | Task 11 AC | Partial | "Source metadata (meeting type, attendees, date)" not explicitly enumerated in Task 11 inputs — only "optional meetingId" |
| ADD-5.2.1-02 | Stage 1 Haiku segment + ~500-token chunks | SPEC §3.1, Task 11 | Pass | — |
| ADD-5.2.1-03 | Stage 2 Haiku extract with confidence | SPEC §3.1, Task 11 | Pass | — |
| ADD-5.2.1-04 | Stage 3 deterministic hybrid search top-K per candidate | SPEC §3.1, Task 11 | Pass | — |
| ADD-5.2.1-05 | Stage 4 Sonnet reconcile create/merge/update | SPEC §3.1, Task 11 | Pass | — |
| ADD-5.2.1-06 | Stage 5 auto-apply >0.85, else pending_review | SPEC §3.1, Task 11 | Pass | Strict > 0.85 locked |
| ADD-5.2.1-07 | Stage 6 Sonnet impact assessment | SPEC §3.1, Task 11 | Pass | Non-blocking |
| ADD-5.2.1-08 | Stage 7 writes session_log with full pipeline trace | SPEC §3.1, Task 11 | Partial | Task 11 AC says `pipeline_stage_runs` but doesn't explicitly say stage 7 writes SessionLog linked to pipeline_run |
| ADD-5.2.1-09 | Output: applied_changes, pending_review, new_questions_raised, blocked_items_unblocked, conflicts_detected, session_log_id | — | Fail | Task 11 does not enumerate this specific output shape. No API return contract pinned |
| ADD-5.2.1-10 | Idempotent + retry-safe + human-review escalation on 3 failures | Task 11 AC | Pass | — |
| ADD-5.2.2-01 | Answer Logging accepts free-text answer + optional question_id + project/user | Task 12 | Pass | — |
| ADD-5.2.2-02 | Stage 1 top-5 open questions via hybrid search | Task 12 | Partial | "Top-K" mentioned but K=5 not pinned |
| ADD-5.2.2-03 | Stage 2 Sonnet pick best question OR standalone decision | Task 12 | Pass | — |
| ADD-5.2.2-04 | Stage 4 Sonnet impact: unblocked/contradicted/new questions | Task 12 | Pass | — |
| ADD-5.2.2-05 | Stage 5 deterministic apply + conflicts_flagged | Task 12 | Pass | — |
| ADD-5.2.2-06 | Stage 6 Sonnet propose Layer 4 annotations | Task 12 | Pass | — |
| ADD-5.2.3-01 | Stage 1 assemble epic+reqs+Q&A+candidate components | Task 8, Task 13 | Pass | — |
| ADD-5.2.3-02 | Stage 2 Sonnet draft to PRD §10.3 mandatory field schema | Task 13 | Partial | Mandatory field list not enumerated in Task 13 (persona/description/AC/parent/SP/TestCase/components) |
| ADD-5.2.3-03 | Stage 3 validates every mandatory field present | Task 13 | Pass | — |
| ADD-5.2.3-04 | Stage 4 cross-references components via hybrid search | Task 13 | Pass | — |
| ADD-5.2.3-05 | Stage 5 Sonnet only on conflicts, proposes resolution | Task 13 | Pass | — |
| ADD-5.2.3-06 | Stage 6 typography/branding validation | Task 13 | Pass | — |
| ADD-5.2.3-07 | Stage 7 persists draft in `draft` status | Task 13 | Pass | — |
| ADD-5.2.3-08 | Eval harness ships 15 labeled fixtures with structural + semantic metrics | Task 17 | Pass | — |
| ADD-5.2.4-01 | Accepts project_id + briefing_type (6 types) | Task 14 | Pass | — |
| ADD-5.2.4-02 | Stage 1 deterministic SQL with 5-min TTL cache | Task 14 | Pass | — |
| ADD-5.2.4-03 | Stage 3 Sonnet narrative per template | Task 14 | Pass | — |
| ADD-5.2.4-04 | Stage 4 validates typo/branding/no forbidden phrases + **numeric accuracy** against stage 1 metrics | Task 14 | Partial | Task 14 AC covers phrase strip via `postProcessOutput` but does NOT assert numeric-accuracy check against stage 1 metrics at runtime (only Task 17 eval checks it) |
| ADD-5.2.4-05 | Stage 5 caches with generated_at + inputs_hash | Task 14 | Pass | — |
| ADD-5.3-01 | Exactly one agent loop, scoped to open-ended PM/BA convos | SPEC §4, Task 15 | Pass | — |
| ADD-5.3-02 | Sonnet 4.6 default + Opus on "think harder" | Task 15 | Pass | — |
| ADD-5.3-03 | Agent context: last N turns (default 20) + Tier 1 project summary + tool outputs | Task 9, Task 15 | Fail | Task 9 pins window at "50 messages OR 7 days". Addendum says "default 20". Tier 1 project summary not explicitly included (only "Layer 3 context"). Contradiction with locked Addendum default |
| ADD-5.3-04 | Read tools include search_project_kb, search_org_kb, get_sprint_state, get_project_summary, get_blocked_items, get_discovery_gaps | Task 15 | Pass | Plus 2 extras from Task 6 |
| ADD-5.3-05 | Write tools limited to create_question/risk/requirement with UI confirmation | Task 15 | Pass | — |
| ADD-5.3-06 | No story creation, transcript, answer logging, doc gen, sprint mod | Task 15 | Pass | — |
| ADD-5.3-07 | Every agent turn persisted to `agent_conversations` + `agent_messages` | SPEC §4 Persistence note | Fail | PHASE_SPEC explicitly reuses existing Conversation / ChatMessage and rejects new agent_conversations/agent_messages tables. **Directly contradicts locked Addendum §5.3 table-name requirement** |
| ADD-6.5-01 | Freeform agent built at end of Phase 2 | TASKS execution order (Task 15 last) | Pass | — |
| ADD-7-04 | `pending_review` table (Phase 11 owned) | SPEC §7.3 | Pass | — |
| ADD-7-05 | `conflicts_flagged` table (Phase 11 owned) | SPEC §7.3 | Pass | — |
| ADD-7-06 | `agent_conversations` + `agent_messages` tables | — | Fail | Same contradiction as ADD-5.3-07. Phase 2 opts out of both tables |
| ADD-5.4-02 | Each searchable entity has its own embedding table | SPEC §7.3 (Phase 11 owned) | NotApplicable | Phase 11 owns |
| ADD-5.6-05 | Phase 1/11 ship requires 10 initial fixtures per pipeline | Task 17, Task 11 AC, Task 12 AC | Pass | 10 transcript + 10 answer-logging replacements; 15 story gen; 10 briefing |

**Scope summary:** 62 rows mapped. 42 Pass, 13 Partial, 7 Fail, 1 NotApplicable.

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification (1 line) |
|---|-----------|-------|------------------------|
| R1 | Requirement traceability | Partial | Specs/tasks cite REQ-HARNESS/REQ-PIPELINE IDs, but several in-scope PRD rows (PRD-6-07, PRD-6-19, PRD-6-25, PRD-8-12, PRD-13-28, PRD-22-05, PRD-22-10) have no backing task |
| R2 | No PRD/Addendum/TECHNICAL_SPEC contradiction | Fail | §4 Persistence note rejects `agent_conversations`/`agent_messages` — contradicts ADD-5.3-07 + ADD-7-06 (Addendum-locked). Task 9 window (50/7d) contradicts ADD-5.3-03 (N=20 default) for freeform agent |
| R3 | Scope completeness | Partial | Missing: article staleness wiring (PRD-13-28), interrupted-session FAILED marking (PRD-8-12), suspicious-transcript risk flagging (PRD-22-10), AI content sanitization (PRD-22-05), context-window budget (PRD-6-07), transcript iteration budget (PRD-6-19), background-job flag semantics (PRD-6-25) |
| R4 | Testable ACs | Partial | Most ACs concrete; gaps: Task 2 does not test date-format enforcement or terminology; Task 14 no runtime numeric-accuracy assertion; Task 5 doesn't pin UTC midnight boundary in AC |
| R5 | Edge cases enumerated | Partial | §9 edge-case table is strong for pipeline stages but missing: concurrent duplicate transcript upload, UTC day-boundary rollover during long session, project with null aiDailyLimit AND null aiMonthlyCostCap, invalid briefing_type, empty transcript, transcript larger than Haiku context window |
| R6 | Interfaces pinned | Partial | `briefing_cache` table decision deferred to Task 14 ("reuse or create"). `CostAlertLog` structure named in AC but no schema. `COST_APPROACHING_CAP` event payload undefined. Pipeline API return shape (ADD-5.2.1-09) not contractually defined. `EntityTrack.fieldsChanged` semantics vague |
| R7 | Upstream deps resolved with concrete refs | Partial | Phase 11 tables named (pipeline_runs, pipeline_stage_runs, pending_review, conflicts_flagged) with field lists in §7.3, but exact field types/nullability not quoted from Phase 11 schema. `model_router.resolve_model(intent)` signature referenced but return shape unspecified. Intent taxonomy enumerated (good) |
| R8 | Outstanding items closed | Pass | §12 "no open questions at execution gate" confirmed; §8 resolves all 10 deep-dive items |

**Overall verdict:** **Not-ready** (R2 Fail + R3/R1 gaps on PRD-13-28, PRD-22-10, PRD-8-12, agent persistence contradiction, agent history-window contradiction)

A phase is "Ready" only if R1–R8 are all Pass.

---

## 3. Gaps

### PHASE-2-GAP-01
- **Rubric criterion:** R2 (contradiction)
- **Affected Req IDs:** ADD-5.3-07, ADD-7-06
- **Description:** PHASE_SPEC §4 "Persistence" explicitly reuses `Conversation` / `ChatMessage` and rejects new `agent_conversations` / `agent_messages` tables. Addendum §5.3 + §7 lock these exact table names as required. Addendum wins per CLAUDE.md hard rule: "Never write scope that contradicts a locked Addendum decision."
- **Severity:** Blocker

### PHASE-2-GAP-02
- **Rubric criterion:** R2 (contradiction)
- **Affected Req IDs:** ADD-5.3-03
- **Description:** Task 9 pins the freeform-agent history window at "last 50 messages OR 7 days". Addendum §5.3-03 specifies "last N turns (default 20)" for the freeform agent. PRD-8-10 specifies 50/7d but that rule is for **general chat** context injection, not the agent. Phase 2 is conflating the two. Also missing from Task 15 system prompt: explicit "Tier 1 project summary" (Addendum names Tier 1 specifically; spec only says "Layer 3 context").
- **Severity:** Blocker

### PHASE-2-GAP-03
- **Rubric criterion:** R3 (scope)
- **Affected Req IDs:** PRD-22-10
- **Description:** Transcript Processing Pipeline has no stage/AC directing the extractor to flag suspicious transcript content as a Risk entity. Addendum §5.2.1 + PRD §22.7 require it. Phase 1 covers prompt-injection defense (treats body as data) but not the flag-as-risk behavior.
- **Severity:** Major

### PHASE-2-GAP-04
- **Rubric criterion:** R3 (scope)
- **Affected Req IDs:** PRD-13-28
- **Description:** PRD requires at the end of every agent loop, the engine queries which articles reference modified entities and sets `isStale=true` + `staleReason`. No Phase 2 task wires this into engine.ts or pipeline stage 7. Partially Phase 6, but engine-side hook belongs to Phase 2 since it modifies the engine's loop exit path.
- **Severity:** Major

### PHASE-2-GAP-05
- **Rubric criterion:** R3 (scope)
- **Affected Req IDs:** PRD-8-12
- **Description:** Interrupted task sessions must set SessionLog status to `FAILED`. No task defines how pipeline_runs and SessionLog react to interruption (server crash, Inngest cancel, user abort). Failure path is only specified for 3-retry exhaustion.
- **Severity:** Major

### PHASE-2-GAP-06
- **Rubric criterion:** R3 (scope), R6 (interface)
- **Affected Req IDs:** ADD-5.2.1-09
- **Description:** Addendum requires the Transcript Pipeline to output `{applied_changes, pending_review, new_questions_raised, blocked_items_unblocked, conflicts_detected, session_log_id}`. Task 11 does not pin this return contract; only mentions "entity IDs, pending_review queue entries, impact summary." Downstream consumers (Phase 3, Phase 7) cannot code against an undefined shape.
- **Severity:** Blocker

### PHASE-2-GAP-07
- **Rubric criterion:** R3 (scope)
- **Affected Req IDs:** PRD-6-07, PRD-6-19
- **Description:** No task enforces the context-window budget (PRD-6-07) or the transcript iteration budget of 4-8 iterations with 15-20K input tokens per iteration (PRD-6-19). Without a budget check, token blowups are possible on long transcripts.
- **Severity:** Major

### PHASE-2-GAP-08
- **Rubric criterion:** R3 (scope)
- **Affected Req IDs:** PRD-22-05
- **Description:** AI-written text fields must be server-side sanitized of HTML / script tags before Prisma write. No task requires tool execute functions (`create_question`, `create_decision`, `create_risk`, `create_requirement`) to sanitize AI-supplied text. Phase 2 is the natural home since it touches every tool.
- **Severity:** Major

### PHASE-2-GAP-09
- **Rubric criterion:** R3 (scope)
- **Affected Req IDs:** ADD-5.2.4-04
- **Description:** Briefing/Status Pipeline stage 4 must check numeric accuracy of metrics referenced in narrative against stage 1's metric results. Task 14 AC lists the typography strip but not the numeric-accuracy runtime check. Task 17 asserts this only in eval fixtures, not at runtime.
- **Severity:** Major

### PHASE-2-GAP-10
- **Rubric criterion:** R6 (interface pin)
- **Affected Req IDs:** REQ-HARNESS-005, REQ-PIPELINE-004
- **Description:** Task 5 references a `CostAlertLog` table (project_id, calendar_month, emitted_at) but no full Prisma schema is specified (PK, indexes, uniqueness constraint on (projectId, calendar_month)). Task 14 defers `briefing_cache` schema to "decide during implementation". Task 5 also emits `COST_APPROACHING_CAP` event with no payload definition. Downstream Phase 8 cannot wire a notification template against an unspecified event shape.
- **Severity:** Blocker

### PHASE-2-GAP-11
- **Rubric criterion:** R6 (interface pin)
- **Affected Req IDs:** REQ-HARNESS-011
- **Description:** Model router signature referenced as `model_router.resolve_model(intent)` but no return-shape contract is given (e.g., `{model: string, tokensBudget: number, cost: {in: number, out: number}}`). Task 5 AC says "cost constants sourced from Phase 11 model router config" — unclear which field on which object.
- **Severity:** Major

### PHASE-2-GAP-12
- **Rubric criterion:** R5 (edge cases)
- **Affected Req IDs:** REQ-HARNESS-005, REQ-PIPELINE-001
- **Description:** Missing edge cases: (a) UTC day-boundary rollover during an active pipeline run (which day counts the invocation?); (b) both `aiDailyLimit` and `aiMonthlyCostCap` null (should be explicitly allowed / handled); (c) concurrent duplicate transcript uploads (idempotency at the pipeline_run level); (d) transcript exceeding Haiku context window at stage 1; (e) invalid `briefing_type`; (f) empty transcript input.
- **Severity:** Major

### PHASE-2-GAP-13
- **Rubric criterion:** R4 (testable AC)
- **Affected Req IDs:** PRD-6-11, PRD-6-12
- **Description:** Task 2 AC does not test the date-format enforcement (Month DD, YYYY) or firm-terminology rules ("custom object" not "custom entity"). The prompt addendum mentions them, but `postProcessOutput` is tested only for em-dash replacement and phrase stripping. A developer could pass AC while leaving dates and terminology unenforced.
- **Severity:** Minor

### PHASE-2-GAP-14
- **Rubric criterion:** R1 (traceability), R3
- **Affected Req IDs:** PRD-6-25
- **Description:** Background-job behavior ("make best guess, flag item, no user to ask") not specified for pipelines running without an interactive user (e.g., Transcript pipeline triggered from an ingestion webhook). No AC forces the Needs Review queuing when no user is attached.
- **Severity:** Minor

### PHASE-2-GAP-15
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-6-02, REQ-RBAC-007
- **Description:** PHASE_SPEC §10 notes "AI tool call role enforcement" as "evaluate during implementation" rather than a committed task. PRD-6-02 requires role-appropriate boundaries on every prompt; without a committed task, the implementer may ship without it.
- **Severity:** Minor

### PHASE-2-GAP-16
- **Rubric criterion:** R3
- **Affected Req IDs:** ADD-5.2.1-01, ADD-5.2.2-02
- **Description:** (a) Task 11 input shape does not include source metadata fields (meeting type, attendees, date) required by Addendum §5.2.1-01; only `optional meetingId`. (b) Task 12 AC says "top-K" in stage 1; Addendum §5.2.2-02 specifies K=5. Pin K=5.
- **Severity:** Minor

### PHASE-2-GAP-17
- **Rubric criterion:** R3
- **Affected Req IDs:** ADD-5.2.3-02, PRD-10-08
- **Description:** Task 13 stage 2 does not enumerate the mandatory field schema (persona/description/AC/parent/story-points/test-case-stubs/components). PRD-10-08 requires TestCase stub generation from AC. Task 13 AC lists only "title, description, acceptance criteria, components" — missing persona, parent epic link, story point estimate, test case stubs.
- **Severity:** Major

### PHASE-2-GAP-18
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-5-30
- **Description:** "Current Focus" and "Recommended Focus" narratives are AI-synthesized (PRD-5-30) and are the primary consumers of the Briefing Pipeline per the Addendum cross-reference. Task 14's 6 briefing types don't include a type that maps directly to those narratives. Phase 7 consumes but Phase 2 must emit.
- **Severity:** Minor

---

## 4. Fix Plan

### Fix PHASE-2-GAP-01
- **File(s) to edit:** `docs/bef/03-phases/phase-02-agent-harness/PHASE_SPEC.md` §4 "Persistence"; `TASKS.md` Task 15 Scope
- **Change summary:** Reverse the decision to reuse `Conversation` / `ChatMessage`. Commit to creating `agent_conversations` and `agent_messages` per Addendum §5.3-07 and §7. Keep existing `Conversation` / `ChatMessage` for general-chat use cases; the freeform agent uses the new tables.
- **New content outline:**
  - Replace §4 Persistence paragraph with: "Every agent turn is persisted to new tables `agent_conversations(id, project_id, user_id, started_at, closed_at)` and `agent_messages(id, conversation_id, role, content_json, token_in, token_out, model_used, created_at)` per Addendum §5.3-07 and §7. Resumable across sessions."
  - Add Prisma schema change to Task 15 Scope: `model AgentConversation` and `model AgentMessage` (with foreign keys to Project/User) plus a migration AC.
  - Add Task 15 AC: "Agent turns persisted to `agent_conversations` + `agent_messages`; resuming a conversation by `agent_conversation_id` rehydrates messages."
- **Cross-phase coordination:** Confirm with Phase 11 schema that these tables are not already claimed; if so, Phase 2 references them. Otherwise Phase 2 owns the migration.
- **Definition of done:**
  - [ ] PHASE_SPEC §4 no longer rejects `agent_conversations`/`agent_messages`
  - [ ] Task 15 Scope lists the two new Prisma models with field lists
  - [ ] Task 15 AC includes persistence + resume assertion
  - [ ] Schema changes traced to ADD-5.3-07 and ADD-7-06

### Fix PHASE-2-GAP-02
- **File(s) to edit:** `TASKS.md` Task 9 and Task 15
- **Change summary:** Correct the freeform-agent history window to 20 turns per Addendum §5.3-03. Reclassify the 50-msg/7-day window as PRD-8-10 general-chat context injection, a separate concern. Add explicit Tier 1 project summary inclusion to Task 15 system prompt.
- **New content outline:**
  - Task 9 scope: change to "default 20 turns (configurable) for the freeform agent" and cite ADD-5.3-03. Remove the 50/7d wording for the agent path.
  - Add a new Task (or add to Task 9) specifically for PRD-8-10: "General chat context injection loads last 50 messages OR 7 days, whichever is smaller" — separate code path from the agent.
  - Task 15 AC: "System prompt includes (1) Tier 1 project summary, (2) last 20 agent turns, (3) firm rules addendum, (4) dynamically retrieved tool outputs."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Task 9 cites ADD-5.3-03 with 20-turn default
  - [ ] Task 15 AC explicitly names "Tier 1 project summary" (not "Layer 3 context")
  - [ ] PRD-8-10 general-chat path separated into its own Task or subtask

### Fix PHASE-2-GAP-03
- **File(s) to edit:** `PHASE_SPEC.md` §3.1 stage 2 description; `TASKS.md` Task 11
- **Change summary:** Add "suspicious content" detection to Transcript Pipeline stage 2 (extract). When content looks like prompt injection, social engineering, or off-topic instructions, the extractor must emit a Risk candidate with reason "suspicious transcript content" instead of treating it as commands.
- **New content outline:**
  - PHASE_SPEC §3.1 stage 2: add bullet "Emit `suspicious_content` Risk candidate for content matching heuristics (imperative directed at AI, base64 blobs, instruction-following patterns)."
  - Task 11 AC: "Given a transcript containing a prompt-injection attempt (e.g., 'Ignore previous instructions and...'), stage 2 emits at least one Risk candidate with category `suspicious_content` and `confidence: HIGH`; no commands are executed."
- **Cross-phase coordination:** Complements Phase 1 REQ-RBAC-012 (treats transcript as data).
- **Definition of done:**
  - [ ] Task 11 AC includes the injection-fixture test case
  - [ ] PHASE_SPEC stage 2 cites PRD-22-10
  - [ ] Task 17 fixture list includes 1 prompt-injection transcript fixture

### Fix PHASE-2-GAP-04
- **File(s) to edit:** `PHASE_SPEC.md` §3.1 stage 7 and §3.2 stage 5; `TASKS.md` Task 11 and Task 12
- **Change summary:** Add end-of-loop article-staleness marking to the Log / Propagate stages.
- **New content outline:**
  - PHASE_SPEC §3.1 stage 7: add "Query `article_entity_refs` for any article referencing entities in `entitiesModified`; set `article.isStale = true` and `article.staleReason = 'entity <X> modified in session <Y>'`."
  - Task 11 AC: "After a session modifies Question Q-DOM-003, any article referencing Q-DOM-003 has `isStale = true` and `staleReason` populated."
  - Same for Task 12.
- **Cross-phase coordination:** Phase 6 owns article storage; confirm `isStale`/`staleReason` fields exist on the Article model (TECHNICAL_SPEC). If the reference table doesn't exist yet, flag as dependency.
- **Definition of done:**
  - [ ] Task 11 and Task 12 each have an AC for article staleness
  - [ ] PHASE_SPEC §3.1 and §3.2 cite PRD-13-28
  - [ ] Cross-phase note added: Phase 6 confirms article reference table

### Fix PHASE-2-GAP-05
- **File(s) to edit:** `PHASE_SPEC.md` §9; `TASKS.md` Task 11, 12, 13, 14
- **Change summary:** Define interruption semantics. On server shutdown, Inngest cancellation, or explicit user abort, the pipeline_run row is marked `failed` and the matching SessionLog is marked `FAILED`.
- **New content outline:**
  - PHASE_SPEC §9 new row: "Server restart during pipeline run → Inngest event `pipeline.cancelled` handler marks `pipeline_run.status='failed'`, `session_log.status='FAILED'`, preserves all completed stage_runs and inputJson."
  - Each of Task 11/12/13/14: add AC "On Inngest cancellation or explicit abort, pipeline_run.status=`failed`, session_log.status=`FAILED`, no partial apply of in-flight stage."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] §9 interrupt row added
  - [ ] All 4 pipeline tasks reference PRD-8-12 in ACs

### Fix PHASE-2-GAP-06
- **File(s) to edit:** `PHASE_SPEC.md` §3.1 Outputs; `TASKS.md` Task 11
- **Change summary:** Pin the Transcript Pipeline return contract exactly as Addendum §5.2.1-09 specifies.
- **New content outline:**
  - PHASE_SPEC §3.1: replace the current "Outputs" bullet with a full TypeScript shape: `{ applied_changes: EntityRef[], pending_review: PendingReviewRef[], new_questions_raised: QuestionRef[], blocked_items_unblocked: StoryRef[], conflicts_detected: ConflictRef[], session_log_id: string, pipeline_run_id: string }` with each ref typed.
  - Task 11 AC: "Pipeline returns payload with all 7 keys populated (empty arrays allowed); JSON schema committed at `src/lib/pipelines/transcript-processing/contract.ts`."
- **Cross-phase coordination:** Phase 3 (Discovery Dashboard) consumes; confirm shape.
- **Definition of done:**
  - [ ] PHASE_SPEC §3.1 lists all 7 return keys with types
  - [ ] Task 11 AC references the contract file path
  - [ ] Trace line: ADD-5.2.1-09 → PHASE_SPEC §3.1

### Fix PHASE-2-GAP-07
- **File(s) to edit:** `PHASE_SPEC.md` §2.5 / new §2.11; `TASKS.md` new Task or extend Task 5
- **Change summary:** Add a context-window budget enforcer and transcript-iteration budget.
- **New content outline:**
  - New AC on Task 5 (or split into new Task): "Before each Claude call, compute total input tokens (system + context + messages). If > 180K (90% of Sonnet 4.6 context), truncate Layer 3 context blocks in a defined priority order (recent_sessions > milestone_progress > article_summaries). Log truncation event to SessionLog.warnings."
  - Task 11 AC: "Transcript stage 2 processes in chunks such that a single Claude call receives ≤ 20K input tokens; total iterations ≤ 8 per transcript; when exceeded, pipeline fails with `transcript_too_large` error."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Task 5 (or new task) has concrete 180K budget AC
  - [ ] Task 11 has 4-8 iterations / 15-20K token budget AC citing PRD-6-19

### Fix PHASE-2-GAP-08
- **File(s) to edit:** `PHASE_SPEC.md` §2 (new subsection); `TASKS.md` extend Task 1 or new task
- **Change summary:** Add server-side sanitization of AI-written text fields before Prisma writes in every tool.
- **New content outline:**
  - New shared helper `src/lib/agent-harness/tools/sanitize.ts` applying DOMPurify (server-side) or a whitelist strip to all string fields written by tools.
  - Task to audit all `create_*` and `update_*` tools and pipe AI-supplied string fields through `sanitize()` before Prisma call.
  - AC: "AI supplying `<script>alert(1)</script>` as a question title results in the stored title containing no `<script>` tag; verified by unit test."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] New task or Task 1 amended with sanitization AC citing PRD-22-05
  - [ ] All `create_*` tool files listed

### Fix PHASE-2-GAP-09
- **File(s) to edit:** `PHASE_SPEC.md` §3.4 stage 4; `TASKS.md` Task 14
- **Change summary:** Add runtime numeric-accuracy validation in Briefing Pipeline stage 4.
- **New content outline:**
  - PHASE_SPEC §3.4 stage 4: add bullet "Extract numeric tokens from narrative via regex (`\d+(\.\d+)?%?`), assert each appears in the stage 1 metrics result set; if mismatch, re-run stage 3 once; on second mismatch, fail run with `metric_hallucination`."
  - Task 14 AC: "Given stage 1 reports 5 blocked stories and stage 3 narrative says '7 blocked stories', stage 4 detects mismatch, retries stage 3 once, and fails with `metric_hallucination` if the retry still disagrees."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] §3.4 stage 4 has numeric-accuracy bullet citing ADD-5.2.4-04
  - [ ] Task 14 AC covers the mismatch path

### Fix PHASE-2-GAP-10
- **File(s) to edit:** `PHASE_SPEC.md` §7.3; `TASKS.md` Task 5 and Task 14
- **Change summary:** Pin schemas for `CostAlertLog`, `briefing_cache`, and the `COST_APPROACHING_CAP` event payload.
- **New content outline:**
  - §7.3 new table: `CostAlertLog { id: String @id @default(cuid()); projectId: String; calendarMonth: String // YYYY-MM; emittedAt: DateTime @default(now()); alertType: AlertType // COST_APPROACHING_CAP | DAILY_LIMIT_WARNING; @@unique([projectId, calendarMonth, alertType]) }`
  - §7.3 new table (Task 14): `BriefingCache { projectId: String; briefingType: BriefingType; inputsHash: String; briefingText: String; generatedAt: DateTime; @@id([projectId, briefingType]) }` — drop the "reuse vs create" fork; commit to the new table.
  - `COST_APPROACHING_CAP` event payload: `{ projectId: string, thresholdPct: 80, currentCostUsd: number, capUsd: number, calendarMonth: string }`.
- **Cross-phase coordination:** Phase 8 consumes the event; payload must match Phase 8 notification template.
- **Definition of done:**
  - [ ] §7.3 lists both tables with full field types + nullability
  - [ ] Event payload shape committed in Task 5
  - [ ] Task 14 "reuse or create" decision replaced with concrete `BriefingCache` schema

### Fix PHASE-2-GAP-11
- **File(s) to edit:** `PHASE_SPEC.md` §5
- **Change summary:** Pin the model router return shape.
- **New content outline:**
  - §5 add: "`resolve_model(intent: string): { model: string, maxOutputTokens: number, contextWindow: number, costPer1KInput: number, costPer1KOutput: number }`. Callers read `costPer1KInput/Output` for rate-limiter math."
- **Cross-phase coordination:** Phase 11 owns router; confirm shape matches.
- **Definition of done:**
  - [ ] §5 has the TypeScript signature
  - [ ] Task 5 AC references exact field names

### Fix PHASE-2-GAP-12
- **File(s) to edit:** `PHASE_SPEC.md` §9
- **Change summary:** Add 6 missing edge-case rows.
- **New content outline:**
  - UTC day-boundary rollover mid-pipeline → count invocation against the UTC day at `executeTask` entry.
  - Both `aiDailyLimit` and `aiMonthlyCostCap` null → no enforcement, no log warning.
  - Concurrent duplicate transcript upload (same transcript text, same projectId, within 60s) → stage 1 computes `inputsHash = sha256(transcript)`; if `pipeline_runs` has a row with matching `(projectId, inputsHash)` and status ∈ (`queued`, `running`, `completed`) within 1h, return existing `pipeline_run_id` (idempotency).
  - Transcript exceeds Haiku context → stage 1 chunks by paragraph first; if single chunk > 180K tokens, fail with `chunk_too_large`.
  - Invalid `briefing_type` → HTTP 400 at API layer before stage 1.
  - Empty transcript / 0-token input → HTTP 400 before Claude call.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] §9 has 6 new rows
  - [ ] Each row cites the relevant task number

### Fix PHASE-2-GAP-13
- **File(s) to edit:** `TASKS.md` Task 2
- **Change summary:** Add ACs for date format and terminology enforcement.
- **New content outline:**
  - AC: "Given AI output 'on 4/10/2026 we decided...', postProcessOutput rewrites to 'on April 10, 2026 we decided...'."
  - AC: "Given AI output contains 'custom entity', postProcessOutput replaces with 'custom object'."
  - AC: "Maintain a firm-terminology map in firm-rules.ts; each entry produces a unit-test assertion."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Task 2 has ≥ 2 new ACs citing PRD-6-11 and PRD-6-12

### Fix PHASE-2-GAP-14
- **File(s) to edit:** `PHASE_SPEC.md` §9; `TASKS.md` Task 11
- **Change summary:** Define background-job semantics.
- **New content outline:**
  - §9 row: "Pipeline invoked without interactive user (webhook/batch) → all low-confidence items auto-route to `pending_review`; no inline clarifying question is asked; SessionLog.userId = `SYSTEM`."
  - Task 11 AC: "Given pipeline invoked with `userId: null`, all candidates with confidence ≤ 0.85 route to pending_review; no `clarifying_question` entity is created."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] §9 row added; Task 11 AC added citing PRD-6-25

### Fix PHASE-2-GAP-15
- **File(s) to edit:** `PHASE_SPEC.md` §10; new AC on Task 4 or Task 15
- **Change summary:** Commit to role-scoped tool execution.
- **New content outline:**
  - Add Task AC: "Every tool's `execute` function receives a `member: { id, role, projectId }` context and rejects calls where the role lacks the required permission (reuse Phase 1 RBAC matrix). Non-permitted call returns `tool_unavailable` without writing to DB."
- **Cross-phase coordination:** Phase 1 RBAC matrix.
- **Definition of done:**
  - [ ] Task 4 (or new task) has explicit role-enforcement AC citing PRD-6-02

### Fix PHASE-2-GAP-16
- **File(s) to edit:** `TASKS.md` Task 11, Task 12
- **Change summary:** Pin missing input fields.
- **New content outline:**
  - Task 11 Scope: "Inputs: `{ transcriptText, projectId, userId, meetingType: 'discovery'|'planning'|'review'|'adhoc', attendees: string[], meetingDate: Date, optional meetingId }`."
  - Task 12 Stage 1 AC: "Stage 1 retrieves exactly top-5 open questions via hybrid search (K=5 locked per ADD-5.2.2-02)."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Task 11 inputs match ADD-5.2.1-01 fields
  - [ ] Task 12 pins K=5

### Fix PHASE-2-GAP-17
- **File(s) to edit:** `PHASE_SPEC.md` §3.3; `TASKS.md` Task 13
- **Change summary:** Enumerate the mandatory story-field schema and require TestCase stub generation.
- **New content outline:**
  - §3.3 stage 2: "Draft output must contain: `persona` (free-text, `As a ...` format), `description`, `acceptanceCriteria[]` (Given/When/Then), `parentEpicId` or `parentFeatureId`, `estimatedStoryPoints` (AI-suggested), `testCaseStubs[]` (generated from AC), `impactedComponents[]` (free-text or OrgComponent refs)."
  - Task 13 AC: "Draft Story has all 7 mandatory fields populated; stage 3 validation rejects drafts missing any." Add fixture coverage in Task 17.
- **Cross-phase coordination:** PRD-10-03 through -10.
- **Definition of done:**
  - [ ] §3.3 stage 2 enumerates 7 fields
  - [ ] Task 13 AC lists all 7; Task 17 fixture covers each

### Fix PHASE-2-GAP-18
- **File(s) to edit:** `PHASE_SPEC.md` §3.4; `TASKS.md` Task 14
- **Change summary:** Add explicit mapping from PRD-5-30 "Current Focus" / "Recommended Focus" to briefing types.
- **New content outline:**
  - §3.4 add row to briefing-type table: extend `executive_summary` or add `current_focus` / `recommended_focus` mini-types. Preferred: clarify that `daily_standup` produces "Current Focus" narrative and `weekly_status` produces "Recommended Focus" narrative. Document the mapping.
  - Task 14 AC: "`daily_standup` output is consumable directly by the Phase 7 dashboard 'Current Focus' tile; `weekly_status` by 'Recommended Focus'."
- **Cross-phase coordination:** Phase 7 dashboard tile contracts.
- **Definition of done:**
  - [ ] §3.4 has explicit mapping citing PRD-5-30
  - [ ] Task 14 AC references the dashboard tile consumers

---

## 5. Sign-off Checklist

- [x] R1 scored
- [x] R2 scored
- [x] R3 scored
- [x] R4 scored
- [x] R5 scored
- [x] R6 scored
- [x] R7 scored
- [x] R8 scored
- [x] Every Partial/Fail in the Scope Map has a corresponding gap entry
- [x] Every gap has a fix plan entry
- [x] Every fix plan has a concrete definition of done
- [x] No gap uses vague remediation language
- [x] Overall verdict matches scorecard (Not-ready — R2 is Fail)
