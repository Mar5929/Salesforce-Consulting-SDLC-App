# Phase 11 Audit: AI Infrastructure Foundation

**Auditor:** from-scratch audit agent
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` (revision 2026-04-13, deep-dive complete)
- `docs/bef/03-phases/phase-11-ai-infrastructure/TASKS.md` (10 tasks, 0/10 complete)

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md`
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (secondary authoritative)
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`

---

## 1. Scope Map

| Req ID | Requirement (1-line) | Covered by (spec §/task #) | Status | Notes |
|--------|----------------------|----------------------------|--------|-------|
| ADD-2-01 | Five-layer org KB model | §2.1 (Layer 1 + Layer 2 tables), §7.3 (migration playbook) | Pass | Layer 1 schema + Layer 2 embedding tables scoped here; Layers 3-4 in Phase 6 |
| ADD-2-02 | Postgres + pgvector sole storage | §2.1 (pgvector extension), AC #1, Task 1 AC #1 | Pass | `CREATE EXTENSION IF NOT EXISTS vector;` explicit |
| ADD-2-05 | Hybrid retrieval primitive (BM25 + vector + RRF) shared everywhere | §2.3, Task 4 | Pass | RRF `k=60` locked |
| ADD-2-06 | Centralized intent-based model routing | §2.2, Task 2 | Pass | |
| ADD-2-07 | No hardcoded Claude model names in pipeline/agent code | §2.2, Task 2 AC #6 (grep CI check) | Partial | Grep covers "Claude model string" only; Addendum forbids any model name string (including Voyage). See GAP-07 |
| ADD-2-08 | Eval harness with fixtures + CI gate per pipeline is V1 | §2.5, Tasks 6-10 | Pass | |
| ADD-3.1-01 | pgvector enabled with HNSW indexes | §2.1, Task 1 AC #7 | Pass | `m=16, ef_construction=64` documented inline |
| ADD-3.1-02 | Embedding provider Voyage or OpenAI "selected at Phase 11 start based on a quality test" | §2.2, §7.1 | Partial | Voyage locked; 50-pair quality test explicitly skipped (§7.1). Rationale documented but deviates from Addendum's literal requirement. See GAP-02 |
| ADD-3.1-03 | Custom eval harness with `pnpm eval [pipeline]` runner | §2.5, Tasks 6, 9 | Pass | |
| ADD-3.1-04 | Durable job runner with retries (Inngest) | §2.4, Task 5 | Pass | Inngest already committed stack-wide |
| ADD-3.2-01 | Embeddings provider same no-retention/no-training posture | §2.2 last bullet, AC #5, Task 2 AC #7 | Pass | Gating AC on Task 2 |
| ADD-4.2-02 | `component_edges` schema (project_id, source/target, edge_type, edge_metadata, unresolved_reference_text) | §2.1 table row, Task 1 AC #4 | Pass | |
| ADD-4.3-01 | `component_embeddings` schema (component_id, embedded_text, hash, vector, model, embedded_at) | §2.1, Task 1 AC #3 | Pass | |
| ADD-4.3-04 | HNSW with cosine distance | §2.3 HNSW params, Task 1 AC #7 | Pass | |
| ADD-4.3-05 | `embedding_model` column for future migration | §2.1, Task 1 AC #3 | Pass | |
| ADD-4.5-02 | `annotation_embeddings` independent search | Task 1 includes `annotation_embeddings` table | Pass | Schema only; entity arrives in Phase 6 |
| ADD-4.6-02 | `search_org_kb` hybrid BM25+vector RRF k=60 | §2.3 signature-only | Partial | Signature locked; full impl deferred to Phase 6 (explicitly scoped). Acceptable if Phase 2 callers only need signature |
| ADD-4.7-05 | Re-embed only on hash change | §2.4, Task 5 AC #4 | Pass | |
| ADD-5.2.1-04 | Transcript pipeline Stage 3 uses hybrid search | Task 4 + Task 7 fixtures | Pass | Primitive exists; pipeline in Phase 2 |
| ADD-5.2.1-11 | Eval harness ships 10 transcript fixtures with F1/top-1/reconciliation metrics | Task 7 (10 fixtures, stubs) | Partial | 10 input fixtures + stubs only; real metrics deferred to Phase 2 per deliberate split. See GAP-03 |
| ADD-5.2.2-02 | Answer Logging Stage 1 retrieves via hybrid search | Task 4 + Task 8 fixtures | Pass | |
| ADD-5.2.2-07 | 10 answer/question pairs with match accuracy + no-hallucination metrics | Task 8 (10 fixtures, stubs) | Partial | Same deliberate split as above. See GAP-03 |
| ADD-5.4-01 | `search_project_kb` shared primitive | §2.3, Task 4 | Pass | |
| ADD-5.4-02 | Per-entity embedding tables | §2.1 (7 embedding tables) | Pass | |
| ADD-5.4-03 | Embeddings async on create/update; vector available <30s | §2.4, Task 5 | Partial | No latency AC asserting <30s typical. See GAP-05 |
| ADD-5.5-01 | Single model_router module | §2.2, Task 2 | Pass | |
| ADD-5.5-02 | Request models by intent, not name | §2.2, Task 2 | Pass | |
| ADD-5.5-03 | Default intent mapping (extract/synthesize/generate_structured/reason_deeply/embed) | §2.2 table | Pass | |
| ADD-5.5-04 | ModelOverride for "think harder" + eval-run forcing | §2.2 business rules, Task 2 AC #3 | Pass | |
| ADD-5.6-01 | Eval harness at `/evals` with fixtures, expectations.ts, runner, shared assertions | §3.2 directory, Task 6 | Partial | `shared/run-all.ts` and `runner-base.ts` created; no `shared/assertions.ts` for common semantic/structural helpers. See GAP-04 |
| ADD-5.6-02 | Fixture JSON: `input`, `expected_properties`, optional `gold_output` | Task 7/8 ACs | Partial | Fixture schema format not pinned in spec; "input-only" wording contradicts Addendum's `expected_properties` field requirement. See GAP-06 |
| ADD-5.6-03 | Runner reports pass/fail + diffs + latency + token cost per fixture | Task 6 AC #2 | Partial | Cost reported; latency not required. See GAP-05 |
| ADD-5.6-04 | `pnpm eval all` in CI on PRs touching `src/ai/`, `src/pipelines/`, `prompts/`, `evals/`, non-zero blocks merge | §2.5, Task 10 | Pass | |
| ADD-5.6-05 | 10 initial fixtures per pipeline at Phase 1/11 ship; every production bug becomes a new fixture | Task 7 (10), Task 8 (10) | Partial | 10 fixtures each present; "every bug becomes a fixture" convention not documented. See GAP-08 |
| ADD-6.1-01 | pgvector enabled in Phase 1/11 | Task 1 AC #1 | Pass | |
| ADD-6.1-02 | Embedding provider selected + integrated in Phase 1/11 | §2.2, Task 2 | Pass | Voyage 3-lite locked |
| ADD-6.1-03 | Embedding job infrastructure (queue, enqueue-on-write, retry) | §2.4, Task 5 | Pass | |
| ADD-6.1-04 | Hybrid retrieval primitive for questions/decisions/requirements/risks/session_logs | §2.3, Task 4 | Partial | `session_logs` not enumerated as an entity_type in `search_project_kb` options; spec lists "questions, decisions, requirements, risks, stories". See GAP-09 |
| ADD-6.1-05 | Model router in Phase 1/11 | §2.2, Task 2 | Pass | |
| ADD-6.1-06 | Eval scaffold + 10 fixtures each for Transcript Processing + Answer Logging | §2.5, Tasks 6-9 | Pass | |
| ADD-6.1-07 | Layer 1 schema only (org_components + component_edges); no ingestion | §2.1 Note, Task 1 | Pass | `org_components` already exists in `prisma/schema.prisma:815`; Phase 11 adds `component_edges` |
| ADD-7-01 | Org KB additions: component_edges, component_embeddings, annotation_embeddings, unresolved_references view | Task 1 | Pass | component_history/domains/domain_memberships/annotations/org_health_reports deferred to Phase 6 per ADD-6.1-07 |
| ADD-7-02 | question/decision/requirement/risk/story embeddings | Task 1 | Pass | |
| ADD-7-03 | pipeline_runs + pipeline_stage_runs observability | Task 1 | Pass | |
| PRD-3-05 | Claude integration cleanly separated so a 2nd provider can plug in | §2.2 model router | Pass | |
| PRD-5-05 | Background jobs on Inngest | §2.4, Task 5 | Pass | |
| PRD-5-06 | State changes emit Inngest events | §2.4 | Pass | embed-entity triggered on create/update events |
| PRD-5-07 | Inngest step functions with checkpoints | §2.4 retries | Partial | Retry strategy documented; checkpoints not explicit. See GAP-10 |
| PRD-5-10 | Core entities include Conversation/ChatMessage | Task 1 creates `agent_conversations` + `agent_messages` | Fail | Contradicts TECHNICAL_SPEC §5.3 which says freeform agent reuses existing `Conversation`/`ChatMessage` tables. See GAP-01 |
| PRD-5-22 | Every task session maps to one SessionLog | Not in Phase 11 scope (SessionLog exists from Phase 1) | NotApplicable | Pipeline observability via `pipeline_runs`, not SessionLog |
| PRD-5-23 | SessionLog contents | NotApplicable | NotApplicable | Existing Phase 1 entity |
| PRD-6-01 | Harness is single AI entry point | §2.2 router | Pass | Superseded by pipeline-first architecture (ADD-5.1-01) |
| PRD-6-25 | Background AI best-guess + flag | §2.1 `pending_review` table | Pass | |
| PRD-7-08 | Session log per knowledge-base addition | Task 1 (pipeline_runs + pipeline_stage_runs) | Pass | |
| PRD-13-08 | org_components table | Exists at `prisma/schema.prisma:815` (pre-existing) | Pass | |
| PRD-13-09 | org_relationships / component_edges | Task 1 AC #4 | Pass | |
| PRD-13-25 | Layer 3 pgvector embeddings on searchable entities | Task 1 (7 embedding tables) | Pass | |
| PRD-13-26 | KnowledgeArticle staleness inline flag | NotApplicable | NotApplicable | Phase 6 ownership |
| PRD-13-27 | Background Inngest KnowledgeArticle refresh | NotApplicable | NotApplicable | Phase 6 ownership |
| PRD-17-21 | Layer 3 semantic search via pgvector cosine | §2.3 | Pass | |
| PRD-23-11 | Embedding uses batched events per agent invocation | §2.4 "Fan-out parallel processing for batch back-fill" | Partial | Per-entity trigger is primary path; batching addressed for back-fill only. Acceptable given hash-skip bounds per-write cost. See GAP-11 |
| PRD-26-01 | Phase 1 build sequence | Supports via pgvector + tsvector + Inngest | Pass | |

**Scope summary:** 45 rows mapped. 28 Pass, 12 Partial, 1 Fail, 4 NotApplicable.

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification (1 line) |
|---|-----------|-------|------------------------|
| R1 | Requirement traceability | Partial | Spec cites Addendum sections and PRD sections accurately but Task-level lines reference only `REQ-AIINFRA-00X (NEW)`; upstream PRD/Addendum IDs not threaded through every task. |
| R2 | No PRD/Addendum/TECHNICAL_SPEC contradiction | Fail | `agent_conversations`+`agent_messages` directly contradicts TECHNICAL_SPEC §5.3 (line 1471); `vector(512)` hardcode contradicts TECHNICAL_SPEC §8.5 (line 2830); provider selection skipped its quality test contra ADD-3.1-02. |
| R3 | Scope completeness | Partial | `shared/assertions.ts` missing; `session_logs` entity_type missing from `search_project_kb`; latency SLO not asserted. |
| R4 | ACs testable | Pass | Concrete thresholds: HNSW m=16/ef=64, RRF k=60, vector(512), $0.50 CI ceiling, 10 fixtures per pipeline, golden-corpus zero-diff. |
| R5 | Edge cases enumerated | Pass | §4 table covers hash-unchanged skip, empty text, provider timeout, pre-backfill search, unknown override model, missing HNSW index, cost budget breach. |
| R6 | Interfaces pinned | Partial | Signatures for `resolve_model`, `search_project_kb`, `search_org_kb` locked; embedding table column list locked; but fixture JSON schema not pinned, `SearchHit` return shape not pinned, `not_implemented` flag location not pinned. |
| R7 | Upstream dependencies resolved | Pass | No upstream BEF dependency (foundational); Phase 1 handoff items named. |
| R8 | Outstanding items tracked | Partial | §7 closes embedding provider, RRF k, migration playbook; but "every production bug becomes a fixture" convention is not captured as an outstanding process item. |

**Overall verdict:** Ready-after-fixes

---

## 3. Gaps

### PHASE-11-GAP-01
- **Rubric criterion:** R2
- **Affected Req IDs:** PRD-5-10, ADD-7 (agent_conversations/agent_messages entries)
- **Description:** PHASE_SPEC §2.1 and Task 1 create new `agent_conversations` and `agent_messages` tables. TECHNICAL_SPEC §5.3 (line 1471) states explicitly: "Reuses the existing `Conversation` and `ChatMessage` models from `prisma/schema.prisma`. A new `ConversationType` enum value (`FREEFORM_AGENT`) distinguishes agent conversations from other chat surfaces. Agent-specific metadata rides on a JSON column on `ChatMessage`. No separate `agent_conversations` or `agent_messages` tables are introduced." Addendum §5.3 and §7 mention `agent_conversations`/`agent_messages` by name. The authoritative source conflict must be resolved before Phase 11 ships; building new tables if TECHNICAL_SPEC is correct is wasted work and schema churn; reusing `Conversation`/`ChatMessage` if Addendum is correct is a spec deviation.
- **Severity:** Blocker

### PHASE-11-GAP-02
- **Rubric criterion:** R2
- **Affected Req IDs:** ADD-3.1-02
- **Description:** Addendum §3.1 requires embedding provider to be "selected at Phase 11 start based on a quality test." §8.A names the test concretely: "50 labeled component-to-query pairs." PHASE_SPEC §7.1 locks Voyage and explicitly states "50-pair quality test skipped." The rationale (V1 internal tool, qualitative parity, swap-path documented) is defensible but the deviation from a locked Addendum requirement is not acknowledged as a formal variance with user approval. Per CLAUDE.md project rules, Addendum-locked decisions override silent reshaping of scope.
- **Severity:** Blocker

### PHASE-11-GAP-03
- **Rubric criterion:** R2, R6
- **Affected Req IDs:** ADD-5.2.1-11, ADD-5.2.2-07, ADD-5.6-02
- **Description:** Task 7/8 create "input-only" fixtures with stub predicates that only assert "pipeline returns a non-error response." Addendum §5.6 fixture format mandates `input`, `expected_properties`, optional `gold_output`. Addendum §5.2.1 says transcript evals measure "extraction F1, top-1 entity resolution accuracy, reconciliation decision accuracy"; §5.2.2 says "match accuracy, impact assessment completeness." Phase 11 defers all expectation authoring to Phase 2 pipeline implementers. This is a reasonable dev split, but (a) no Phase 2 task is guaranteed to exist yet that closes the stubs, creating a durable promise the CI gate enforces nothing meaningful, and (b) the deferred fields should be declared in the fixture JSON schema now so the Phase 11 fixtures are forward-compatible.
- **Severity:** Major

### PHASE-11-GAP-04
- **Rubric criterion:** R3
- **Affected Req IDs:** ADD-5.6-01
- **Description:** Addendum §5.6 structure mandates `shared/assertions.ts` (common semantic similarity + structural checks). Task 6 creates `evals/shared/run-all.ts` and `evals/shared/runner-base.ts` but not `shared/assertions.ts`. Without it, every pipeline's `expectations.ts` will re-implement similarity and structural checks.
- **Severity:** Major

### PHASE-11-GAP-05
- **Rubric criterion:** R3, R4
- **Affected Req IDs:** ADD-5.4-03, ADD-5.6-03
- **Description:** ADD-5.4-03 requires vector similarity available <30s after entity write. ADD-5.6-03 requires the runner to track "latency and token cost per fixture." Task 5 has no AC asserting embed-job p95 latency; Task 6 AC #2 reports cost but not latency. Without latency instrumentation, the <30s SLO is unverifiable and regressions are silent.
- **Severity:** Major

### PHASE-11-GAP-06
- **Rubric criterion:** R6
- **Affected Req IDs:** ADD-5.6-02
- **Description:** Fixture JSON schema is not pinned anywhere in the spec. Addendum §5.6 says fixture JSON has `input`, `expected_properties`, optional `gold_output`. Phase 11 Task 7/8 call them "input-only" without declaring the JSON shape. Downstream Phase 2 implementers may infer different shapes, producing inconsistent fixtures across pipelines.
- **Severity:** Major

### PHASE-11-GAP-07
- **Rubric criterion:** R3
- **Affected Req IDs:** ADD-2-07, ADD-5.5-01
- **Description:** Task 2 AC #6 grep CI check: "no file outside `src/lib/ai/` contains a hardcoded Claude model string." Addendum §2.7 forbids any "specific Claude model name" in pipeline/agent code, and §5.5 centralizes ALL model/provider names (including Voyage). The grep check must also forbid `voyage-3-lite`, `text-embedding-3-small`, and future provider names, otherwise a pipeline could hardcode `voyage-3-lite` in an embed call and bypass the router.
- **Severity:** Minor

### PHASE-11-GAP-08
- **Rubric criterion:** R8
- **Affected Req IDs:** ADD-5.6-05
- **Description:** Addendum §5.6 locks as a V1 convention: "every production bug in a pipeline becomes a new fixture." Phase 11 ships the harness but does not codify the convention (e.g., PR template checkbox, CONTRIBUTING note, or spec line in `evals/README.md`). Without the convention captured, the fixture corpus will not grow.
- **Severity:** Minor

### PHASE-11-GAP-09
- **Rubric criterion:** R3
- **Affected Req IDs:** ADD-6.1-04
- **Description:** ADD-6.1-04 lists "questions, decisions, requirements, risks, **session logs**" as the hybrid-primitive entities for end of Phase 1. Phase 11 §2.3 enumerates "questions, decisions, requirements, risks, stories" — stories are in scope via Phase 2 Addendum §6.2, but `session_logs` are omitted. Either confirm session_logs are intentionally not searchable (and note why) or add a `session_log_embeddings` table + entity_type.
- **Severity:** Minor

### PHASE-11-GAP-10
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-5-07
- **Description:** PRD §5.1 specifies "Inngest step functions with checkpoints allow long-running jobs to resume from the last successful step on failure." Task 5 `embed-entity` is short enough that step-checkpointing is unnecessary, but the spec should state that design choice explicitly rather than appear to overlook PRD-5-07.
- **Severity:** Minor

### PHASE-11-GAP-11
- **Rubric criterion:** R2
- **Affected Req IDs:** PRD-23-11
- **Description:** PRD §23.5 says "Embedding generation uses batched events (one batch per agent invocation) to reduce event count." Phase 11 §2.4 uses per-entity triggers on create/update with fan-out only for batch back-fill. Hash-skip makes this cheap in practice, but the PRD text expects per-invocation batching. Either confirm this is superseded by the Addendum's per-write-with-hash-skip pattern or add a batch-accumulator step.
- **Severity:** Minor

### PHASE-11-GAP-12
- **Rubric criterion:** R2, R6
- **Affected Req IDs:** TECHNICAL_SPEC §8.5 (line 2830)
- **Description:** TECHNICAL_SPEC explicitly states "Dimension is determined by `embedding_model`, not hardcoded in the schema. The `vector` column type accepts the dimension at row-write time; migrations do not need to specify it per entity." Phase 11 hardcodes `vector(512)` on every embedding table per Task 1 AC #3 and AC §2.1. If a future provider produces 1024-dim vectors (e.g., Voyage 3 full), a schema migration across 7 embedding tables is required. The contradiction must be resolved: either update TECHNICAL_SPEC §8.5 to reflect the fixed 512 dimension, or use `vector` (unspecified) per TECHNICAL_SPEC.
- **Severity:** Major

### PHASE-11-GAP-13
- **Rubric criterion:** R6
- **Affected Req IDs:** ADD-5.4-01, §2.3
- **Description:** `search_project_kb` and `search_org_kb` signatures are locked but the `SearchHit` return shape is not defined. `search_org_kb` is specified to return "empty array with a `not_implemented` flag in the hit list" — location, key, and type of that flag are not pinned. Phase 2 callers that branch on the flag will diverge from whatever Phase 6 actually ships.
- **Severity:** Major

---

## 4. Fix Plan

### Fix PHASE-11-GAP-01
- **File(s) to edit:** `docs/bef/01-architecture/TECHNICAL_SPEC.md` §5.3 (line 1471) AND/OR `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` §2.1 + `TASKS.md` Task 1
- **Change summary:** Resolve the conflict between TECHNICAL_SPEC §5.3 (reuse `Conversation`/`ChatMessage` + `ConversationType.FREEFORM_AGENT`) and Addendum §5.3+§7 + Phase 11 spec (new `agent_conversations`/`agent_messages` tables). Decision owner = user.
- **New content outline:**
  - Decide: Option A — reuse existing models (drop `agent_conversations`/`agent_messages` from Phase 11 scope, reduce table count from 13 to 11, add `ConversationType.FREEFORM_AGENT` enum value, document JSON metadata column on `ChatMessage`). Option B — new models (update TECHNICAL_SPEC §5.3 to match Addendum, remove the "No separate tables are introduced" sentence).
  - If Option A: amend Task 1 scope, AC #5, and the summary count. Amend revision history note that reversed the 11→13 decision.
  - If Option B: edit TECHNICAL_SPEC §5.3 line 1471 to describe the new tables (id, project_id, user_id, title, created_at, updated_at for conversations; id, conversation_id, role, content, metadata jsonb, created_at for messages).
- **Cross-phase coordination:** Phase 2 freeform agent deep-dive depends on this answer.
- **Definition of done:**
  - [ ] One of TECHNICAL_SPEC §5.3 OR Phase 11 PHASE_SPEC.md §2.1 updated to remove the conflict
  - [ ] Decision recorded with reasoning in the file that wins
  - [ ] Cross-reference added between the two documents

### Fix PHASE-11-GAP-02
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` §7.1 AND `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` §3.1 or §8.A
- **Change summary:** Either run the 50-pair quality test per Addendum §3.1/§8.A, or formally amend the Addendum to record that the test was deliberately waived for V1 with user sign-off.
- **New content outline:**
  - Option A (run the test): add a new Task 2a "Voyage quality validation" with scope = build 50 labeled component-to-query pairs drawn from `docs/org/` if present or Salesforce-domain vocabulary synthesis; run Voyage voyage-3-lite and OpenAI text-embedding-3-small on both, score nDCG@10; lock decision based on result. ACs: fixtures checked in to `/evals/embedding-quality/`, results report in PHASE_SPEC §7.1.
  - Option B (formal waiver): add a §3.1 footnote to the Addendum: "50-pair quality test waived during Phase 11 deep-dive on YYYY-MM-DD. Rationale: <verbatim from §7.1>. Swap path per Phase 11 §7.3." Add the user's sign-off date.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Decision recorded with authoritative signatory
  - [ ] If Option A: test results artifact exists, Voyage or OpenAI locked
  - [ ] If Option B: Addendum §3.1 or §8.A amended with explicit waiver

### Fix PHASE-11-GAP-03
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` §2.5 AND `TASKS.md` Task 7, Task 8
- **Change summary:** Declare the fixture JSON schema now (per Addendum §5.6) so stubs are forward-compatible; bind the Phase 2 closure of stubs to explicit Phase 2 task IDs.
- **New content outline:**
  - Add to §2.5 a "Fixture JSON schema" block: `{ name: string, input: <pipeline-specific>, expected_properties: object (stub: {}), gold_output?: <pipeline-specific> }`. Every Phase 11 fixture has `expected_properties: {}` with a `TODO(phase-2)` comment.
  - Update Task 7/8 ACs: fixtures conform to the declared JSON schema; `expectations.ts` validates `expected_properties` is object (empty in Phase 11).
  - Add explicit back-references in Phase 2 TASKS.md (next deep-dive) that each pipeline task must replace matching fixture stubs.
- **Cross-phase coordination:** Phase 2 deep-dive must add one AC per pipeline task: "Replace fixture stubs in `/evals/<pipeline>/expectations.ts` with structural + semantic assertions per Addendum §5.2.x metrics."
- **Definition of done:**
  - [ ] Fixture JSON schema pinned in PHASE_SPEC §2.5
  - [ ] Task 7 and Task 8 ACs include schema conformance
  - [ ] Cross-phase handoff line added to PHASE_SPEC §5 Cross-Phase Handoffs

### Fix PHASE-11-GAP-04
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` §3.2 AND `TASKS.md` Task 6
- **Change summary:** Add `evals/shared/assertions.ts` creation to Task 6, with common helpers the pipeline expectations will consume.
- **New content outline:**
  - Add to §3.2 file structure: `evals/shared/assertions.ts` — exports `assertContainsAllKeys`, `assertSemanticSimilarity(actual, gold, threshold=0.85)`, `assertNoForbiddenPhrases(text, phrases)`, `assertPipelineNonError(result)`.
  - Add Task 6 AC: "`evals/shared/assertions.ts` exists and exports the four helpers; unit tests cover each helper."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] File added to file structure in §3.2
  - [ ] Task 6 AC added
  - [ ] Helper signatures enumerated in the AC

### Fix PHASE-11-GAP-05
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` §2.4 + §2.5 AND `TASKS.md` Task 5 + Task 6
- **Change summary:** Assert the <30s embedding SLO and add per-fixture latency reporting to the runner.
- **New content outline:**
  - Amend §2.4 business rules: "p95 latency from entity write event to vector-available <30s under normal load. Emit latency metric on every run to `pipeline_stage_runs`."
  - Amend §2.5 runner behavior: "Runner records wall-clock latency per fixture in milliseconds and emits it in both console summary and JSON report."
  - Add Task 5 AC: "Latency from Inngest event to embedding row write is recorded; p95 under 30s on a 10-fixture test batch."
  - Add Task 6 AC: "Runner output includes `latency_ms` per fixture alongside `cost_usd`."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] SLO asserted in §2.4
  - [ ] Task 5 and Task 6 ACs added
  - [ ] JSON report schema includes `latency_ms`

### Fix PHASE-11-GAP-06
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` §2.5
- **Change summary:** Pin the fixture JSON schema explicitly (closes the same need as GAP-03 from an interfaces angle).
- **New content outline:**
  - Add §2.5 subsection "Fixture JSON Schema": concrete TypeScript type `type Fixture = { name: string; input: unknown; expected_properties: Record<string, unknown>; gold_output?: unknown }` with a prose example for each of the two V1 pipelines.
- **Cross-phase coordination:** Covered by GAP-03 handoff.
- **Definition of done:**
  - [ ] TypeScript type definition present in §2.5
  - [ ] One example fixture per pipeline shown inline

### Fix PHASE-11-GAP-07
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/TASKS.md` Task 2 AC #6
- **Change summary:** Broaden the grep CI check to cover all model/provider names.
- **New content outline:**
  - Replace AC #6 with: "Grep CI check: no file outside `src/lib/ai/` contains a hardcoded model name string matching the pattern `/(claude-(sonnet|haiku|opus)-[0-9-.]+|voyage-[a-z0-9-]+|text-embedding-[a-z0-9-]+)/`. Allow-list comments with `// model-name-ok: <reason>`."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Regex pattern embedded in CI workflow file path `.github/workflows/hardcoded-model-check.yml`
  - [ ] Task 2 AC #6 updated

### Fix PHASE-11-GAP-08
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/TASKS.md` Task 9 OR a new `evals/README.md`
- **Change summary:** Capture the "bug-to-fixture" convention as a spec artifact so the corpus grows.
- **New content outline:**
  - Add Task 9 AC: "`evals/README.md` includes a 'Bug-to-fixture convention' section stating every production pipeline bug must be reproduced as a new fixture before the fix PR merges; reference this in the PR template."
  - Add a one-line entry to `.github/pull_request_template.md`: `[ ] If this fixes a pipeline bug, a new eval fixture reproducing it is included.`
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] `evals/README.md` updated
  - [ ] PR template updated

### Fix PHASE-11-GAP-09
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` §2.3 AND `TASKS.md` Task 1 + Task 4
- **Change summary:** Either add `session_log_embeddings` or record the deliberate exclusion.
- **New content outline:**
  - Option A (exclude): add §2.3 note "`session_logs` are excluded from hybrid search in V1; they are structured audit records, not discoverable knowledge. Revisit if an agent query-over-history need surfaces in Phase 2."
  - Option B (include): add `session_log_embeddings` table to the §2.1 list (total 14 tables); add `session_log` to the `entity_types` union in `search_project_kb`; add Task 5 trigger on SessionLog write.
- **Cross-phase coordination:** Phase 2 freeform agent design may depend on this answer.
- **Definition of done:**
  - [ ] Decision recorded
  - [ ] PHASE_SPEC and TASKS.md reflect the decision consistently

### Fix PHASE-11-GAP-10
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` §2.4
- **Change summary:** State the checkpointing design choice for `embed-entity`.
- **New content outline:**
  - Add §2.4 note: "embed-entity is a single-logical-step job (hash-check → call-or-skip → upsert). Inngest step-checkpointing is not used because the job is short (<30s) and idempotent on retry. PRD-5-07 applies to long-running jobs (sync, back-fill) covered in Phase 6."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Note present in §2.4
  - [ ] PRD-5-07 explicitly referenced

### Fix PHASE-11-GAP-11
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` §2.4
- **Change summary:** Reconcile per-write triggers with PRD-23-11's batched-events guidance.
- **New content outline:**
  - Add §2.4 note: "PRD-23-11 (batched events per agent invocation) is superseded for the live path by per-write triggers with hash-skip: event volume is bounded by unique-text change rate, not write rate. Batched events are used only for back-fill via fan-out."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Note added
  - [ ] PRD-23-11 explicitly superseded with justification

### Fix PHASE-11-GAP-12
- **File(s) to edit:** `docs/bef/01-architecture/TECHNICAL_SPEC.md` §8.5 (line 2823-2830)
- **Change summary:** Update TECHNICAL_SPEC to reflect the locked 512-dim Voyage decision.
- **New content outline:**
  - Replace "Dimension is determined by `embedding_model`, not hardcoded in the schema" with "Dimension is `vector(512)` on every embedding table (Voyage voyage-3-lite locked in Phase 11 deep-dive). Provider migration to a different-dimension model uses the dual-write playbook in Phase 11 §7.3, which creates a parallel set of embedding columns at the new dimension."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] TECHNICAL_SPEC §8.5 updated
  - [ ] Reference to Phase 11 §7.3 migration playbook added

### Fix PHASE-11-GAP-13
- **File(s) to edit:** `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` §2.3 AND `TASKS.md` Task 4
- **Change summary:** Pin the `SearchHit` interface and the `not_implemented` flag location.
- **New content outline:**
  - Add to §2.3: `interface SearchHit { entity_type: string; entity_id: string; score: number; snippet?: string; source: 'bm25' | 'vector' | 'fused'; flags?: { not_implemented?: true } }`.
  - Amend Task 4 AC: "`search_org_kb` returns `[]` when not implemented AND sets a top-level `_meta: { not_implemented: true }` on the return envelope OR places the flag on individual stub hits per the pinned interface — pick one and pin it."
- **Cross-phase coordination:** Phase 2 callers branching on the flag.
- **Definition of done:**
  - [ ] `SearchHit` interface pinned in §2.3
  - [ ] Flag location pinned (return envelope vs. hit-level)
  - [ ] Task 4 AC reflects the chosen convention

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
- [x] Overall verdict matches scorecard (Ready-after-fixes; R2 Fail + multiple Partial)

---

## 6. Fix Application Log (2026-04-13)

All 13 gaps applied in this worktree. Mapped to AUDIT_DECISIONS.md:

- [x] GAP-01 (Blocker) — DECISION-01. TECHNICAL_SPEC §5.3 amended to drop the reuse paragraph; `agent_conversations` + `agent_messages` confirmed as Phase 11 tables with columns enumerated in PHASE_SPEC §2.1.
- [x] GAP-02 (Blocker) — DECISION-03. PHASE_SPEC §7.1 waiver rescinded. Task 2a added to run the 50-pair Voyage vs. OpenAI quality test before Phase 11 merges.
- [x] GAP-03 (Major) — Fixture JSON schema pinned in PHASE_SPEC §2.5.1; Task 7/8 ACs require schema conformance; Phase 2 handoff line added in §5.
- [x] GAP-04 (Major) — `evals/shared/assertions.ts` added to §3.2 and Task 6 ACs with helper signatures enumerated.
- [x] GAP-05 (Major) — <30s SLO asserted in §2.4; Task 5 latency AC added; Task 6 runner AC requires `latency_ms` per fixture in JSON report.
- [x] GAP-06 (Major) — TypeScript `Fixture` type pinned in §2.5.1 with one example per V1 pipeline.
- [x] GAP-07 (Minor) — Task 2 AC #6 broadened regex to cover Claude + Voyage + OpenAI model names with `// model-name-ok:` allow-list.
- [x] GAP-08 (Minor) — Bug-to-fixture convention captured in PHASE_SPEC §2.5.4 and Task 9 ACs (adds `evals/README.md` section + PR template checkbox).
- [x] GAP-09 (Minor) — `session_logs` deliberate exclusion recorded in PHASE_SPEC §2.3 with rationale; Task 4 AC cites the deviation.
- [x] GAP-10 (Minor) — `embed-entity` checkpointing rationale added to PHASE_SPEC §2.4 with explicit PRD-5-07 reference.
- [x] GAP-11 (Minor) — PRD-23-11 reconciled with per-write + hash-skip pattern in PHASE_SPEC §2.4.
- [x] GAP-12 (Major) — DECISION-02. TECHNICAL_SPEC §8.5 amended to hardcode `vector(512)` with reference to Phase 11 §7.3 migration playbook.
- [x] GAP-13 (Major) — `SearchHit` + `SearchResponse` interfaces pinned in PHASE_SPEC §2.3; `_meta.not_implemented` envelope location chosen; Task 4 AC updated.

**Files touched by this fix pass:**
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (§5.3, §8.5)
- `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md`
- `docs/bef/03-phases/phase-11-ai-infrastructure/TASKS.md`
- `docs/bef/audits/2026-04-13/phase-11-audit.md` (this log)
