# Phase 11 Tasks: AI Infrastructure Foundation

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 10
> Status: 0/10 complete
> Last Updated: 2026-04-13

---

## Execution Order

```
Task 1 (schema migration)
  ├── Task 2 (model router)              ─┐
  └── Task 3 (audit existing search)      │ parallel after Task 1
       └── Task 4 (extract search primitive + refactor call sites)
            └── Task 5 (embedding Inngest job)
                 ├── Task 6 (eval harness scaffold + runner)   ─┐
                 │    ├── Task 7 (transcript-processing fixtures) │
                 │    └── Task 8 (answer-logging fixtures)       ├── parallel
                 │         └── Task 9 (pnpm eval all + package script)
                 │              └── Task 10 (CI gate workflow)   ─┘
```

---

## Tasks

### Task 1: Schema migration — pgvector, 13 tables, materialized view, HNSW indexes

| Attribute | Details |
|-----------|---------|
| **Scope** | Enable pgvector extension. Add `component_edges`, `question_embeddings`, `decision_embeddings`, `requirement_embeddings`, `risk_embeddings`, `story_embeddings`, `component_embeddings`, `annotation_embeddings`, `pipeline_runs`, `pipeline_stage_runs`, `pending_review`, `conflicts_flagged`, `agent_conversations`, `agent_messages` to `prisma/schema.prisma`. Create `unresolved_references` materialized view and HNSW indexes via raw SQL in the migration. `OrgComponent` already exists (`prisma/schema.prisma:815`); Layer 1 completed by adding `component_edges` only. |
| **Depends On** | None |
| **Complexity** | L |
| **Requirement** | REQ-AIINFRA-001 (NEW) |
| **Status** | Not started |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Migration begins with `CREATE EXTENSION IF NOT EXISTS vector;`
- [ ] All 13 tables exist in `prisma/schema.prisma` with correct fields per PHASE_SPEC §2.1
- [ ] Every embedding table has: `entity_id`, `embedded_text`, `embedded_text_hash`, `embedding_model`, `embedding vector(512)`, `created_at`, `updated_at`
- [ ] `component_edges` supports nullable `target_component_id` for unresolved references; includes `source_component_id`, `edge_type`, `edge_metadata` (jsonb), `unresolved_reference_text`
- [ ] `agent_conversations` and `agent_messages` scaffolded (forward-reference for Phase 2 freeform agent)
- [ ] Materialized view `unresolved_references` selects from `component_edges WHERE target_component_id IS NULL`
- [ ] HNSW index created via raw SQL on every embedding table: `CREATE INDEX ... USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64)`; inline SQL comment documents the values
- [ ] `prisma migrate deploy` runs cleanly against a fresh DB
- [ ] Prisma client regenerates without errors

**Files touched:**
- `prisma/schema.prisma` (modify)
- `prisma/migrations/XXXXX_phase11_ai_infra/migration.sql` (generated + raw SQL additions)

---

### Task 2: Model router module

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `src/lib/ai/model-router.ts` exporting `resolve_model(intent, override)` with the `Intent` type and the default mapping (extract → Haiku 4.5, synthesize/generate_structured → Sonnet 4.6, reason_deeply → Opus 4.6, embed → Voyage `voyage-3-lite`). Confirm Voyage data handling contract (no retention, no training); summarize in `TECHNICAL_SPEC.md`. |
| **Depends On** | None (can run parallel to Task 1) |
| **Complexity** | S |
| **Requirement** | REQ-AIINFRA-002 (NEW) |
| **Status** | Not started |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `src/lib/ai/model-router.ts` exists and exports `Intent`, `ModelOverride`, `ModelConfig` types and `resolve_model` function
- [ ] Default mapping matches PHASE_SPEC §2.2 exactly
- [ ] Override parameter supports per-call model/provider escalation
- [ ] Unknown override model throws at resolution (no silent default fall-through)
- [ ] Unit tests cover each intent + the override path + the unknown-model error
- [ ] Grep CI check added: no file outside `src/lib/ai/` contains a hardcoded Claude model string
- [ ] Voyage data handling agreement (no retention, no training) confirmed and summarized in `TECHNICAL_SPEC.md` under "Data Handling Posture — Embeddings"

**Files touched:**
- `src/lib/ai/model-router.ts` (create)
- `src/lib/ai/model-router.test.ts` (create)
- `.github/workflows/hardcoded-model-check.yml` (create, or add step to existing CI)

---

### Task 3: Audit existing hybrid search implementation

| Attribute | Details |
|-----------|---------|
| **Scope** | Audit `src/lib/search/global-search.ts` and `src/lib/agent-harness/context/smart-retrieval.ts`. Document the current BM25 + pgvector + structured three-layer hybrid: inputs, outputs, call sites, tests. Output a written reuse plan identifying what becomes the generic primitive vs. what stays caller-specific. |
| **Depends On** | Task 1 (schema must exist for the new embedding tables referenced in the plan) |
| **Complexity** | M |
| **Requirement** | REQ-AIINFRA-003 (NEW) |
| **Status** | Not started |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Written audit document in `docs/bef/03-phases/phase-11-ai-infrastructure/SEARCH_AUDIT.md`
- [ ] Every call site of `globalSearch()` enumerated with current arguments
- [ ] Every call site of functions in `smart-retrieval.ts` enumerated
- [ ] Reuse plan identifies which code moves to `src/lib/ai/search.ts` vs. which becomes a thin adapter
- [ ] Risks flagged: any behavior difference between generalized primitive and current impl

**Files touched:**
- `docs/bef/03-phases/phase-11-ai-infrastructure/SEARCH_AUDIT.md` (create)

---

### Task 4: Extract search primitive and refactor call sites

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `src/lib/ai/search.ts` with `search_project_kb` and `search_org_kb` signatures per PHASE_SPEC §2.3. Generalize existing logic from `global-search.ts`. Refactor `global-search.ts` and `smart-retrieval.ts` to call the new primitive. Preserve all existing call site behavior. RRF `k = 60`. `search_org_kb` is signature-only (returns empty array with `not_implemented` flag). |
| **Depends On** | Task 3 |
| **Complexity** | L |
| **Requirement** | REQ-AIINFRA-003 (NEW) |
| **Status** | Not started |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Golden-corpus snapshot captured BEFORE refactor: 10–20 representative queries run against current `globalSearch()`, results written to `docs/bef/03-phases/phase-11-ai-infrastructure/GOLDEN_CORPUS.json`
- [ ] `src/lib/ai/search.ts` exports `search_project_kb(project_id, query, options)` and `search_org_kb(project_id, query, options)`
- [ ] RRF scoring implemented with `k = 60` per the formula in PHASE_SPEC §2.3
- [ ] `search_project_kb` handles entity_types filter for questions, decisions, requirements, risks, stories
- [ ] `search_org_kb` returns empty array with `not_implemented` flag (no silent noop)
- [ ] `src/lib/search/global-search.ts` refactored to call the new primitive; all current call sites work unchanged
- [ ] `src/lib/agent-harness/context/smart-retrieval.ts` refactored to call the new primitive; all current call sites work unchanged
- [ ] Post-refactor golden-corpus diff is zero (within documented RRF tolerance)
- [ ] Parity test: seeded corpus produces identical ranking from old `globalSearch()` and new `search_project_kb` (within RRF tolerance)
- [ ] Phase 1 regression suite passes

**Files touched:**
- `src/lib/ai/search.ts` (create)
- `src/lib/ai/search.test.ts` (create — parity + RRF tests)
- `src/lib/search/global-search.ts` (refactor)
- `src/lib/agent-harness/context/smart-retrieval.ts` (refactor)

---

### Task 5: Embedding Inngest job with hash-based skip

| Attribute | Details |
|-----------|---------|
| **Scope** | Create Inngest function `embed-entity` at `src/inngest/functions/embed-entity.ts`. Triggered on entity create/update events. Computes sha256 hash of normalized text; skips provider call if hash unchanged; otherwise calls provider via `resolve_model('embed')`, upserts embedding row, writes `embedding_model`. Register in `src/inngest/client.ts`. |
| **Depends On** | Task 1, Task 2, Task 4 |
| **Complexity** | M |
| **Requirement** | REQ-AIINFRA-004 (NEW) |
| **Status** | Not started |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `embed-entity` Inngest function registered and deployed
- [ ] Triggered on create/update for every embeddable entity: question, decision, requirement, risk, story, component, annotation
- [ ] Hash computed over normalized text (lowercase, whitespace-collapsed)
- [ ] If hash matches existing row, no provider call is made
- [ ] If hash differs, provider called via model router; row upserted; `embedding_model` populated
- [ ] Fan-out step pattern supports batch back-fill
- [ ] Retries: 3 attempts with exponential backoff; final failure logs to `pipeline_runs` with status `error` and does not block the originating entity write
- [ ] Unit tests cover: hash-match skip, hash-miss embed, provider timeout retry, final-failure logging

**Files touched:**
- `src/inngest/functions/embed-entity.ts` (create)
- `src/inngest/client.ts` (modify — register function)
- `src/inngest/functions/embed-entity.test.ts` (create)

---

### Task 6: Eval harness scaffold and runner

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `/evals/` directory structure. Implement `runner.ts` pattern: loads JSON fixtures, invokes a pipeline, compares against `expectations.ts`, reports per-fixture pass/fail + aggregate cost. Create `/evals/shared/run-all.ts` orchestrator. Add `pnpm eval [pipeline]` and `pnpm eval all` package scripts. File-only output in V1 (no `eval_runs` DB persistence). |
| **Depends On** | Task 5 |
| **Complexity** | M |
| **Requirement** | REQ-AIINFRA-005 (NEW) |
| **Status** | Not started |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `/evals/` directory exists with `shared/` subdirectory
- [ ] `runner.ts` template: loads `fixtures/*.json`, invokes pipeline, compares to `expectations.ts`, prints per-fixture pass/fail + total cost
- [ ] `/evals/shared/run-all.ts` discovers and runs every registered pipeline
- [ ] `pnpm eval [pipeline]` runs a single pipeline; exits non-zero on any fixture regression
- [ ] `pnpm eval all` runs every pipeline; exits non-zero on any failure
- [ ] Output format: human-readable console summary + JSON report written to `/evals/reports/[pipeline]-[timestamp].json`

**Files touched:**
- `evals/shared/run-all.ts` (create)
- `evals/shared/runner-base.ts` (create — shared runner logic)
- `package.json` (modify — add `eval` script)

---

### Task 7: Transcript Processing eval fixtures (inputs + stubs)

| Attribute | Details |
|-----------|---------|
| **Scope** | Author 10 labeled **input** fixtures for the Transcript Processing pipeline at `/evals/transcript-processing/fixtures/`. Each fixture is a JSON file with input transcript only. Create `expectations.ts` with per-fixture **stub** predicates that assert only "pipeline returns a non-error response" — real structural and semantic expectations are completed in Phase 2 by the pipeline implementer. Create pipeline-specific `runner.ts`. |
| **Depends On** | Task 6 |
| **Complexity** | M |
| **Requirement** | REQ-AIINFRA-005 (NEW) |
| **Status** | Not started |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] 10 input-only fixture JSON files in `/evals/transcript-processing/fixtures/`
- [ ] Fixtures cover: questions, decisions, requirements, risks, action items, mixed content, prompt-injection attempt, ambiguous confidence, merge-candidate with existing entity, standalone new entity
- [ ] `expectations.ts` has 10 stub predicates, each with a `TODO(phase-2)` comment and a minimal non-error assertion
- [ ] `runner.ts` imports the pipeline (stub until Phase 2), runs each fixture, reports pass/fail
- [ ] `pnpm eval transcript-processing` runs against all 10 fixtures and passes (stubs trivially pass)
- [ ] Phase 2 hand-off note added to `evals/transcript-processing/README.md` listing which fixtures each Phase 2 pipeline task must complete

**Files touched:**
- `evals/transcript-processing/fixtures/01-*.json` through `10-*.json` (create)
- `evals/transcript-processing/expectations.ts` (create)
- `evals/transcript-processing/runner.ts` (create)

---

### Task 8: Answer Logging eval fixtures (inputs + stubs)

| Attribute | Details |
|-----------|---------|
| **Scope** | Author 10 labeled **input** fixtures for the Answer Logging pipeline at `/evals/answer-logging/fixtures/`. Each fixture is a JSON file with input answer text + candidate questions only. Create `expectations.ts` with per-fixture **stub** predicates; real match targets and confidence bands are completed in Phase 2 by the pipeline implementer. Create pipeline-specific `runner.ts`. |
| **Depends On** | Task 6 |
| **Complexity** | M |
| **Requirement** | REQ-AIINFRA-005 (NEW) |
| **Status** | Not started |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] 10 input-only fixture JSON files in `/evals/answer-logging/fixtures/`
- [ ] Fixtures cover: exact question match, semantic match, no-match standalone decision, ambiguous match (two candidates close), contradiction with existing decision, impact assessment trigger, low-confidence needs-review, multi-question answer, empty answer, malformed input
- [ ] `expectations.ts` has 10 stub predicates, each with a `TODO(phase-2)` comment and a minimal non-error assertion
- [ ] `runner.ts` imports the pipeline (stub until Phase 2), runs each fixture, reports pass/fail
- [ ] `pnpm eval answer-logging` runs against all 10 fixtures and passes (stubs trivially pass)
- [ ] Phase 2 hand-off note added to `evals/answer-logging/README.md` listing which fixtures each Phase 2 pipeline task must complete

**Files touched:**
- `evals/answer-logging/fixtures/01-*.json` through `10-*.json` (create)
- `evals/answer-logging/expectations.ts` (create)
- `evals/answer-logging/runner.ts` (create)

---

### Task 9: Wire `pnpm eval all` and package script

| Attribute | Details |
|-----------|---------|
| **Scope** | Register transcript-processing and answer-logging in `/evals/shared/run-all.ts`. Confirm `pnpm eval all` runs both and aggregates results. Add usage docs to the root `README.md` under a new "Evals" section. |
| **Depends On** | Task 7, Task 8 |
| **Complexity** | S |
| **Requirement** | REQ-AIINFRA-005 (NEW) |
| **Status** | Not started |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `pnpm eval all` runs both pipelines in sequence
- [ ] Aggregate report shows per-pipeline pass/fail + total cost
- [ ] Exit code non-zero if any pipeline has any failing fixture
- [ ] `README.md` has an "Evals" section with usage examples

**Files touched:**
- `evals/shared/run-all.ts` (modify — register pipelines)
- `README.md` (modify)

---

### Task 10: CI gate workflow

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `.github/workflows/evals.yml` that runs `pnpm eval all` on any PR touching paths `src/ai/`, `src/pipelines/`, `prompts/`, or `evals/`. The workflow must fail the PR when any eval fixture regresses. |
| **Depends On** | Task 9 |
| **Complexity** | S |
| **Requirement** | REQ-AIINFRA-005 (NEW) |
| **Status** | Not started |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `.github/workflows/evals.yml` exists
- [ ] Workflow triggered by `pull_request` with path filter on `src/ai/**`, `src/pipelines/**`, `prompts/**`, `evals/**`
- [ ] Workflow installs deps, runs `pnpm eval all`, uploads JSON report artifact
- [ ] Workflow fails if aggregate cost of a single eval run exceeds **$0.50** (hard budget)
- [ ] PR check is required for merge to main (branch protection rule documented in the PR description)
- [ ] Test PR touching a watched path verifies the gate fires

**Files touched:**
- `.github/workflows/evals.yml` (create)

---

## Summary

| Task | Title | Depends On | Complexity | Status |
|------|-------|-----------|------------|--------|
| 1 | Schema migration — pgvector, 13 tables, materialized view, HNSW indexes | — | L | Not started |
| 2 | Model router module | — | S | Not started |
| 3 | Audit existing hybrid search implementation | 1 | M | Not started |
| 4 | Extract search primitive and refactor call sites | 3 | L | Not started |
| 5 | Embedding Inngest job with hash-based skip | 1, 2, 4 | M | Not started |
| 6 | Eval harness scaffold and runner | 5 | M | Not started |
| 7 | Transcript Processing eval fixtures | 6 | M | Not started |
| 8 | Answer Logging eval fixtures | 6 | M | Not started |
| 9 | Wire `pnpm eval all` and package script | 7, 8 | S | Not started |
| 10 | CI gate workflow | 9 | S | Not started |
