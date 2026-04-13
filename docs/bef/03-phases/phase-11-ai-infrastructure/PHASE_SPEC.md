# Phase 11 Spec: AI Infrastructure Foundation

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Source: [ADDENDUM-INTEGRATION-PLAN.md](../../ADDENDUM-INTEGRATION-PLAN.md) (Phase 11 section, lines 38-81; New Data Model Entities, lines 353-401)
> Depends On: Phase 1
> Unlocks: Phase 2
> Parallel With: Phase 10
> Complexity: M
> Status: Deep-dived — ready for execution
> Last Updated: 2026-04-13

---

## 1. Scope Summary

Build the cross-cutting AI substrate required by every downstream pipeline and the freeform agent. Phase 11 exists because PRD Addendum v1 (April 12, 2026) specified infrastructure that was not part of the original Phase 1. Rather than amend a complete phase, this phase slots in as the first new work and is a prerequisite for all AI work in Phases 2 and 6.

The substrate covers the five-layer retrieval model: structured entities, BM25 tsvector, pgvector embeddings, hybrid reciprocal rank fusion (RRF), and domain/component graph edges. No pipeline stage or agent task may hardcode a Claude model name, bypass the search primitive, or skip eval coverage after this phase ships.

**In scope:** pgvector extension enable, schema migration (13 tables + 1 materialized view), model router module, hybrid retrieval primitive (generalized from existing code), Inngest embedding job, eval harness scaffold with seeded input fixtures + stubbed expectations, and CI gate.

**Deferred:** `eval_runs` DB persistence (file-only V1). Full `search_org_kb` implementation (Phase 6). Eval fixture expectations for the two V1 pipelines are completed during Phase 2 pipeline implementation (Phase 11 creates inputs + stubs only).

**Note:** `org_components` already exists in `prisma/schema.prisma` (line 815) from prior work — Phase 11 only adds `component_edges` to complete Layer 1 schema.

---

## 2. Functional Requirements

### 2.1 Schema Additions (REQ-AIINFRA-001)

- **What it does:** Enables pgvector and adds 13 tables and 1 materialized view to `prisma/schema.prisma`. Migration only — no data ingestion yet.
- **Extension:** `CREATE EXTENSION IF NOT EXISTS vector;` must run before any vector column is created.
- **Tables:**

| Table | Purpose |
|-------|---------|
| `component_edges` | Layer 1 of org KB. Relationships between org components, including unresolved references (target_component_id nullable). |
| `question_embeddings` | Per-entity embedding for `search_project_kb`. Includes `embedded_text`, `embedded_text_hash`, `embedding_model`, `embedding vector(512)`. |
| `decision_embeddings` | Per-entity embedding, same shape. |
| `requirement_embeddings` | Per-entity embedding, same shape. |
| `risk_embeddings` | Per-entity embedding, same shape. |
| `story_embeddings` | Per-entity embedding, same shape. |
| `component_embeddings` | Per-entity embedding, same shape. (Full migration of `OrgComponent.embedding` inline column happens in Phase 6.) |
| `annotation_embeddings` | Per-entity embedding, same shape. (Annotations entity arrives in Phase 6; table pre-created here.) |
| `pipeline_runs` | Observability: one row per pipeline invocation. Inputs, outputs, total cost. |
| `pipeline_stage_runs` | Per-stage trace within a pipeline run. Stage name, model used, tokens in/out, cost, duration, status. |
| `pending_review` | Pipeline items awaiting human confirmation (polymorphic: `entity_type` + `entity_id` + `proposed_change` JSON). |
| `conflicts_flagged` | Contradictions detected by impact assessment. Links to source decision + contradicting entity. |
| `agent_conversations` | Freeform agent ("Project Brain Chat") conversation thread metadata. Pre-scaffolded here; consumed by Phase 2 freeform agent. |
| `agent_messages` | Individual messages within an agent conversation. Pre-scaffolded here; consumed by Phase 2 freeform agent. |

- **Materialized view:** `unresolved_references` — `SELECT * FROM component_edges WHERE target_component_id IS NULL`. Surfaces dynamic SOQL / Apex callouts. Feeds the Org Health findings module in Phase 6.
- **HNSW indexes:** Created via raw SQL in the Prisma migration (`CREATE INDEX ... USING hnsw (embedding vector_cosine_ops)`) on every embedding table.
- **`embedding_model` column:** Required on every embedding table. Enables future provider migrations without schema change.

### 2.2 Model Router Module (REQ-AIINFRA-002)

- **What it does:** Centralizes Claude model resolution. No pipeline stage, agent task, or freeform call resolves a model name directly.
- **File to create:** `src/lib/ai/model-router.ts`
- **Signature:**
```typescript
type Intent = 'extract' | 'synthesize' | 'generate_structured' | 'reason_deeply' | 'embed'
type ModelOverride = { model?: string; provider?: 'anthropic' | 'voyage' | 'openai' }
type ModelConfig = { provider: string; model: string; maxTokens: number; temperature?: number }

function resolve_model(intent: Intent, override?: ModelOverride): ModelConfig
```
- **Default mapping:**

| Intent | Model | Why |
|--------|-------|-----|
| `extract` | Claude Haiku 4.5 | Cheap, fast, adequate for structured extraction. |
| `synthesize` | Claude Sonnet 4.6 | Reconciliation, impact assessment, summarization. |
| `generate_structured` | Claude Sonnet 4.6 | Structured output with schema adherence. |
| `reason_deeply` | Claude Opus 4.6 | Complex multi-entity reasoning (Org Health, contradiction analysis). |
| `embed` | Voyage `voyage-3-lite` (512-dim) | Locked during Phase 11 deep-dive. Anthropic stack alignment, 3× smaller vectors than OpenAI alternative, cost parity. Swap path documented in §7.3. |

- **Business rules:** Override parameter exists for tests and for explicit escalation (e.g., a low-confidence extract can retry with Sonnet). No file outside `src/lib/ai/` may import a model name string directly.
- **Data handling posture:** Voyage data handling agreement (no retention, no training) must be confirmed and summarized in `TECHNICAL_SPEC.md` under "Data Handling Posture — Embeddings" before any production call is made. This is a gating AC on Task 2.

### 2.3 Hybrid Retrieval Primitive (REQ-AIINFRA-003)

- **What it does:** Provides the single hybrid search function used by all pipelines, the freeform agent, and future org KB queries.
- **File to create:** `src/lib/ai/search.ts`
- **Signatures:**
```typescript
async function search_project_kb(
  project_id: string,
  query: string,
  options?: { entity_types?: EntityType[]; limit?: number; min_score?: number }
): Promise<SearchHit[]>

async function search_org_kb(
  project_id: string,
  query: string,
  options?: { entity_types?: OrgEntityType[]; limit?: number }
): Promise<SearchHit[]>  // signature only — full impl in Phase 6
```
- **Business rules:**
  - BM25 via Postgres `tsvector` + pgvector cosine similarity. Reciprocal rank fusion combines both.
  - RRF formula: `score = Σ (1 / (k + rank_i))` where `k = 60`.
  - `search_project_kb` covers all project KB entities (questions, decisions, requirements, risks, stories).
  - `search_org_kb` stubbed for Phase 6 with final signature locked now so Phase 2 callers compile.

- **Audit-first directive:** Existing code at `src/lib/search/global-search.ts` already implements a three-layer hybrid (structured + tsvector + pgvector), consumed by `src/lib/agent-harness/context/smart-retrieval.ts`. **Generalize and relocate — do not rewrite.** Required order of operations:
  1. Audit `globalSearch()` end-to-end; document reuse surface.
  2. **Capture a golden-corpus snapshot**: pick 10–20 representative queries, run against current `globalSearch()`, lock the result ordering to `docs/bef/03-phases/phase-11-ai-infrastructure/GOLDEN_CORPUS.json`.
  3. Extract the generic primitive into `src/lib/ai/search.ts`.
  4. Refactor `global-search.ts` and `smart-retrieval.ts` to call the new primitive.
  5. Preserve all existing call sites.
  6. Add `search_project_kb` as a thin adapter over the generic primitive.
  7. Diff post-refactor results against the golden corpus — diff must be zero (within documented RRF tolerance).
- **HNSW index parameters:** Use pgvector defaults `m=16, ef_construction=64`. Document the values inline in the migration SQL. Revisit only if recall on eval fixtures drops below 0.9 or dataset exceeds 1M vectors.

### 2.4 Embedding Infrastructure (REQ-AIINFRA-004)

- **What it does:** Keeps every indexed entity's embedding current, cheaply.
- **Inngest job to create:** `embed-entity` — triggered on entity create/update events from every embeddable model.
- **Business rules:**
  - Compute `embedded_text_hash` (sha256 of normalized text).
  - If hash unchanged from the existing row, skip embedding (no provider call).
  - If changed, call the provider via the model router (`intent: 'embed'`), upsert row, record `embedding_model`.
  - Fan-out parallel processing for batch back-fill.
  - Retry with Inngest default (3 attempts, exponential backoff).
- **Files touched:** `src/inngest/functions/embed-entity.ts` (new), `src/inngest/client.ts` (register).

### 2.5 Eval Harness Scaffold (REQ-AIINFRA-005)

- **What it does:** Establishes the V1 eval pattern and wires it into CI.
- **Directory to create:** `/evals/{pipeline_name}/` with:
  - `fixtures/` — JSON input files
  - `expectations.ts` — expected outputs or assertion predicates per fixture
  - `runner.ts` — loads fixtures, invokes the pipeline, compares against expectations, reports pass/fail + cost
- **Command to add:** `pnpm eval [pipeline]` — runs a single pipeline. `pnpm eval all` runs every pipeline.
- **Seeded pipelines (V1):**
  - `/evals/transcript-processing/` — 10 labeled input fixtures + stubbed expectations
  - `/evals/answer-logging/` — 10 labeled input fixtures + stubbed expectations
- **Fixture authorship split:**
  - **Phase 11:** creates all 20 input JSON fixtures covering the scenarios listed in Task 7/8 ACs. Creates `expectations.ts` with one `TODO` stub per fixture asserting only "pipeline returns a non-error response."
  - **Phase 2:** each pipeline implementation task has an AC to replace the matching fixture stubs with real structural + semantic expectations. Rationale: whoever builds the pipeline knows its output shape best, and fixtures must exist before pipelines to keep the CI gate buildable in Phase 11.
- **CI gate:** GitHub Actions workflow runs `pnpm eval all` on any PR touching `src/ai/`, `src/pipelines/`, `prompts/`, or `evals/`. Red gate blocks merge. Per-CI-run cost budget: **< $0.50** (fail the gate if exceeded).
- **Persistence:** File-only report output in V1. `eval_runs` table deferred unless needed.

---

## 3. Technical Approach

### 3.1 Implementation Strategy

1. Schema migration first — all downstream code depends on table existence.
2. Model router second — needed by embedding job and by Phase 2.
3. Search primitive third — audit existing code, extract, relocate, refactor call sites. Highest-risk task; do not merge until Phase 1 regression tests still pass.
4. Inngest embedding job fourth — composes the router + schema + hash logic.
5. Eval harness scaffold + seeded fixtures last — wires CI gate after the pieces it gates exist.

### 3.2 File/Module Structure

```
prisma/
  schema.prisma                        — modify (11 tables + view + HNSW raw SQL)
  migrations/XXXXX_phase11_ai_infra/   — generated
src/
  lib/
    ai/
      model-router.ts                  — CREATE
      search.ts                        — CREATE (generalized from global-search.ts)
    search/
      global-search.ts                 — refactor to call src/lib/ai/search.ts
    agent-harness/context/
      smart-retrieval.ts               — refactor call sites (no behavior change)
  inngest/
    client.ts                          — register embed-entity
    functions/
      embed-entity.ts                  — CREATE
evals/
  transcript-processing/
    fixtures/                          — CREATE (10 JSON fixtures)
    expectations.ts                    — CREATE
    runner.ts                          — CREATE
  answer-logging/
    fixtures/                          — CREATE (10 JSON fixtures)
    expectations.ts                    — CREATE
    runner.ts                          — CREATE
  shared/
    run-all.ts                         — CREATE (eval-all orchestrator)
.github/workflows/
  evals.yml                            — CREATE (CI gate)
package.json                           — modify (add `eval` script)
```

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Entity updated but text unchanged | Hash matches; skip provider call; no embedding row change |
| Entity created without indexable text | Embedding job no-ops; no row inserted |
| Embedding provider times out | Inngest retry (3 attempts). After final failure, log to `pipeline_runs` with status `error`; do not block entity write |
| `search_project_kb` called before embeddings back-filled | Returns BM25-only results; vector side contributes zero until back-fill completes |
| `search_org_kb` called in Phase 2 | Signature resolves; returns empty array with a `not_implemented` flag in the hit list (fails loud, not silent) |
| Override passed to `resolve_model` with unknown model | Throw at resolution; do not silently fall through to default |
| HNSW index missing on fresh DB | Migration fails loudly; no partial apply |
| CI eval run exceeds cost budget | Fails the gate; PR author must justify |

---

## 5. Integration Points

### From Prior Phases
- **Phase 1:** Relies on the fixed auth layer and `version` schema-prep fields. No direct code handoff.

### For Future Phases
- **Phase 2 (Harness Hardening + Core Pipelines):** Consumes the model router, search primitive, embedding job, and eval harness. All four new pipelines (Transcript Processing, Answer Logging, Story Generation, Impact Assessment) must route models through `resolve_model` and retrieve via `search_project_kb`.
- **Phase 6 (Knowledge + Org KB):** Completes `search_org_kb`, back-fills Phase 6 embeddings into the tables pre-created here, and migrates `OrgComponent.embedding` inline column into `component_embeddings` table.
- **Phase 10 (Work Tab UI):** Runs in parallel. No dependency either direction.

### Cross-Phase Handoffs
- Embedding provider decision: document in `docs/bef/01-architecture/TECHNICAL_SPEC.md` before Phase 2 deep-dive begins.
- `pending_review` table surfaced to Phase 2 UI (Needs Review queue).
- `unresolved_references` materialized view surfaced to Phase 6 Org Health findings.

---

## 6. Acceptance Criteria

- [ ] `CREATE EXTENSION IF NOT EXISTS vector;` runs as part of the Phase 11 migration
- [ ] All 13 tables and the `unresolved_references` materialized view exist in `prisma/schema.prisma` and in a clean DB after `prisma migrate deploy`
- [ ] Every embedding table uses `vector(512)` and has an `embedding_model` column and an HNSW index (`m=16, ef_construction=64`) on its `embedding` column
- [ ] `src/lib/ai/model-router.ts` exports `resolve_model(intent, override)` with the documented default mapping (embed → Voyage `voyage-3-lite`)
- [ ] Voyage data handling agreement (no retention, no training) confirmed and summarized in `TECHNICAL_SPEC.md` under "Data Handling Posture — Embeddings"
- [ ] No file outside `src/lib/ai/` contains a hardcoded Claude model name string (verified via grep CI check)
- [ ] `src/lib/ai/search.ts` exports `search_project_kb` and `search_org_kb` with the locked signatures
- [ ] Golden-corpus snapshot captured before refactor; post-refactor diff is zero
- [ ] `search_project_kb` passes a parity test against the existing `globalSearch()` on a seeded corpus
- [ ] `src/lib/agent-harness/context/smart-retrieval.ts` still passes its current test suite after refactor
- [ ] `embed-entity` Inngest job runs on entity create/update; skips on unchanged hash; populates `embedding_model`
- [ ] `pnpm eval transcript-processing` and `pnpm eval answer-logging` both run against 10 input fixtures each (stubbed expectations) and report pass/fail per fixture + aggregate cost
- [ ] `pnpm eval all` runs every registered pipeline
- [ ] CI workflow fails the PR when any eval fixture regresses on touched paths; per-run cost stays under $0.50
- [ ] No regression in Phase 1 test suites

---

## 7. Resolved Decisions and Deferrals

### 7.1 Embedding Provider — RESOLVED

- **Locked:** Voyage AI `voyage-3-lite` (512-dim).
- **Rationale:** Anthropic stack alignment (Voyage acquired by Anthropic, 2024). Cost parity with OpenAI `text-embedding-3-small`. 3× smaller vectors (512 vs. 1536) means cheaper storage and faster HNSW. Single-vendor data posture is cleaner for consulting clients.
- **50-pair quality test skipped:** For a V1 internal tool where both providers are qualitatively similar on English retrieval, the test's 3–5 day cost outweighs its decision value. If real-world retrieval quality proves insufficient, swap path is documented in §7.3.
- **Gating item:** Voyage data handling contract (no retention, no training) must be confirmed before Task 2 is marked complete. Record summary in `TECHNICAL_SPEC.md`.

### 7.2 RRF `k` — LOCKED AT 60, RETUNE POST-PHASE 2

- **Locked:** `k = 60` (literature standard — Cormack et al. 2009).
- **Retune trigger:** after Phase 2 ships real eval fixtures with labeled expectations, sweep `k ∈ {10, 30, 60, 100}` on measured precision@10. Lock final value in `TECHNICAL_SPEC.md`. No separate Phase 11 validation task needed — we don't have labeled data yet.

### 7.3 Embedding Migration Strategy

- **Problem:** Future provider swap must not force a full re-embed outage.
- **Approach:** `embedding_model` column enables side-by-side dual-write during migration. Document the migration playbook (enable new provider → dual-write on create/update → back-fill job → cutover reader → drop old column) before the first swap is actually needed. Playbook lives in `TECHNICAL_SPEC.md` under "Embedding Provider Migration."

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-13 | Initial spec | Created from PRD Addendum v1 Phase 11 section during addendum integration |
| 2026-04-13 | Deep-dive complete | Voyage `voyage-3-lite` (512-dim) locked as embedding provider; pgvector extension enable explicit; `agent_conversations` + `agent_messages` added (table count 11 → 13); HNSW params fixed at defaults (m=16, ef_construction=64); RRF k=60 locked with post-Phase 2 retune window; golden-corpus snapshot required before search refactor; fixture authorship split (Phase 11 inputs + stubs, Phase 2 real expectations); CI cost ceiling $0.50; Voyage data handling contract added as gating AC. |
