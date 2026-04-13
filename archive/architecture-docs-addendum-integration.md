# Plan: Integrate PRD Addendum v1 into Architecture Docs

**Created:** 2026-04-13
**Target:** `docs/bef/01-architecture/TECHNICAL_SPEC.md` (2,590 lines) + `docs/bef/01-architecture/README.md`
**Scope:** Final piece of Step 2 — Steps to Ship
**Predecessor:** `docs/bef/ADDENDUM-INTEGRATION-PLAN.md` (integration-plan execution for phase specs, completed 2026-04-13)
**Source of truth:** `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`

---

## Context

PRD Addendum v1 (April 12, 2026) supersedes PRD §6 (AI Agent Harness) and §13 (Org Knowledge Base). All 11 phase specs in `docs/bef/03-phases/` have been updated to reflect the addendum. `TECHNICAL_SPEC.md` still reflects the pre-addendum design — specifically the three-layer generic agent harness and the flat org knowledge model. Until this is fixed, phase specs and architecture docs will disagree, and agent teams executing Step 5 will read conflicting guidance.

**Goal:** Rewrite or amend every affected section of `TECHNICAL_SPEC.md` so it accurately reflects: four deterministic pipelines + one freeform agent, five-layer org knowledge model, model router, hybrid retrieval primitive, eval harness, and all new schema entities.

**Non-goal:** Writing implementation code, or revising PRD §6 / §13 (those are superseded by the addendum, not rewritten inline).

---

## Effort Estimate

**Total: 14–20 hours across 3 sessions.**

Single-session attempt is not recommended. §3 alone (agent harness → pipelines rewrite) will exhaust a focused session. Schema changes require cross-referencing addendum §4.2–§4.6 and §7 closely.

| Session | Scope | Est. hours |
|---------|-------|------------|
| A | §3 rewrite (pipelines + freeform agent) + §8 rewrite (hybrid retrieval) | 5–8 |
| B | §2 schema work (3 rewrites + 14 adds) + §6 rewrite (brownfield + Org Health) | 5–7 |
| C | §4 rewrite (context window) + §10 + §11 adds + §5/§7/§1/§9/README amendments | 4–5 |

---

## Section-by-Section Change List

### KEEP
- §2.3 Join Tables (lines 743–826) — unaffected
- §2.4 Display ID Strategy (lines 827–849) — unaffected

### AMEND (surgical additions, no restructure)
- **§1 Decisions Locked** (lines 24–45) — add "Addendum v1 Supersessions" subsection flagging that §3 three-layer harness is superseded; list new locked items (four pipelines, five layers, model router, hybrid retrieval primitive, eval harness as V1 requirement)
- **§2.1 ERD Overview** (lines 47–95) — add new entities + relationships (see schema adds list below)
- **§2.2 OrgComponent** (lines 412–437) — deprecate inline `vector(1536)` embedding column; point to `component_embeddings` parallel table; reference `component_edges` and `component_history`
- **§2.2 KnowledgeArticle** (lines 637–685) — flag inline embedding column fate as "Decision Deferred" (Phase 6 deep-dive)
- **§5 Dashboard Architecture** (lines 1653–2010) — largely valid; note narrative synthesis routes through Briefing/Status Pipeline; §5.4 cache triggers reference `pipeline_runs.inputs_hash`; §5.3 cost queries extend to per-pipeline/per-stage
- **§7 Background Jobs (Inngest)** (lines 2102–2412) — add pipeline runner jobs (one per pipeline), embedding enqueue with hash-based re-embed gate, Claude Managed Agents long-running jobs (Org Health, domain proposal)
- **§9 Remaining Items** (line 2542+) — update outstanding-items list: embedding provider, RRF k tuning, domain confidence threshold, rename collision, `eval_runs`/`annotation_versions` persistence
- **README.md** — update file map: §3 now "Pipelines + Freeform Agent", call out new §10 + §11

### REWRITE (major restructure)
- **§2.2 DomainGrouping** (lines 450–462) → rename to `domains`; add `source` (ai_proposed/human_asserted), `status` (proposed/confirmed/archived), `archived_reason`; add `domain_memberships` polymorphic
- **§2.2 BusinessContextAnnotation** (lines 463–474) → rewrite as polymorphic `annotations` (entity_type + entity_id covering component/edge/domain); add `annotation_embeddings`; add source/status enums
- **§3 AI Agent Harness** (lines 850–1593) → full rewrite as pipelines architecture:
  - §3.1 Architecture overview (4 pipelines + 1 freeform agent)
  - §3.2 Pipeline contracts (idempotency, retry, escalation to `pending_review`, raw input retained)
  - §3.3 Transcript Processing Pipeline (7 stages)
  - §3.4 Answer Logging Pipeline (6 stages)
  - §3.5 Story Generation Pipeline (7 stages)
  - §3.6 Briefing/Status Pipeline (5 stages, 6 briefing types)
  - §3.7 Freeform Agent (read tools, confirmed write tools, Sonnet default + Opus "think harder")
  - §3.8 Model Router
  - §3.9 Hybrid Retrieval Primitive (BM25 + pgvector + RRF k=60)
  - §3.10 Eval Harness
  - Preserve §3.1.1/§3.1.2 rate-limit and §3.6.1 input sanitization as cross-cutting subsections
  - Orphan `TaskType` values (QUESTION_ANSWERING, STORY_ENRICHMENT, CONTEXT_PACKAGE_ASSEMBLY, DASHBOARD_SYNTHESIS, ARTICLE_SYNTHESIS, ORG_QUERY, DOCUMENT_GENERATION, SPRINT_ANALYSIS, STATUS_REPORT_GENERATION) explicitly mapped: fold / relocate / deprecate
- **§4 Context Window Budget** (lines 1594–1650) → re-key from TaskType to pipeline stage + freeform agent. Add Context Package Assembly as deterministic 9-step pipeline (Addendum §4.6, <3s p95, single Sonnet call, 20k token budget). §4.3 strategies remain. §4.5 brownfield sizing references Layer 2 embeddings + `search_org_kb`.
- **§6 Brownfield Org Ingestion Pipeline** (lines 2011–2101) → extend to five-layer model. Add sync reconciliation algorithm (metadata_id → (api_name, type, parent) → create; rename → `component_history`), unresolved_references handling, managed-package scoping, Org Health Assessment (Managed Agents, Opus `reason_deeply`, $25 default, `org_health_reports` output), brownfield domain proposal Managed Agent pass.
- **§8 Search Infrastructure** (lines 2413–2541) → hybrid retrieval primitive at `src/lib/ai/search.ts` (BM25 tsvector + pgvector cosine + RRF k=60); `search_project_kb` + `search_org_kb` signatures; HNSW index strategy; per-entity embedding tables with `embedding_model` column for future migrations; audit-generalize-relocate of existing `globalSearch()`.

### ADD (new sections)
- **§2.2 new entity specs:** `component_edges`, `component_history`, `domains`, `domain_memberships`, `annotations`, `annotation_embeddings`, 5 per-entity embedding tables (question/decision/requirement/risk/story_embeddings), `component_embeddings`, `pipeline_runs`, `pipeline_stage_runs`, `pending_review`, `conflicts_flagged`, `org_health_reports`, and the `unresolved_references` materialized view
- **§10 Model Router** (new) — Intent enum (extract/synthesize/generate_structured/reason_deeply/embed), default mapping (Haiku 4.5 / Sonnet 4.6 / Opus 4.6 / embed→selected provider), override semantics, location `src/lib/ai/model-router.ts`
- **§11 Eval Harness** (new) — `/evals/` directory layout, `pnpm eval [pipeline]` runner, CI gate on PRs touching `src/ai/`, `src/pipelines/`, `prompts/`, `evals/`; fixture counts per pipeline; ownership table

---

## Execution Order (Within Each Session)

**Session A — Pipelines + Search**
1. §3 full rewrite, top to bottom (§3.1 → §3.10)
2. §8 rewrite (hybrid retrieval primitive) — prerequisite for §4, §5, §6
3. Cross-check: verify every pipeline stage references model router intents and `search_*` functions consistently

**Session B — Schema + Brownfield**
1. §2 schema work:
   - Rewrite three existing models (DomainGrouping → domains; BusinessContextAnnotation → annotations; OrgComponent.embedding → component_embeddings)
   - Add 14 new entity specs in logical order (Layer 1 → Layer 2 → Layer 3 → Layer 4 → pipeline observability → edge/health entities)
2. §6 rewrite (brownfield five-layer + sync reconciliation + Org Health)
3. Cross-check: verify §6 references §2 entity names exactly

**Session C — Context Budget + New Sections + Cleanup**
1. §4 rewrite (re-key by pipeline stage, add Context Package Assembly 9-step)
2. Add §10 Model Router (net-new, self-contained)
3. Add §11 Eval Harness (net-new, self-contained)
4. Amendments: §5 dashboards, §7 Inngest, §1 decisions-locked addendum section, §9 remaining items, README file map
5. Final read-through: top-to-bottom consistency pass

---

## Delegation Strategy

Each session is large enough to justify **parallel subagents** within the session (similar to how phase specs were rewritten):

- **Session A:** One agent rewrites §3; a second rewrites §8. Main thread reviews consolidation and cross-references.
- **Session B:** One agent handles §2 (schema); a second handles §6 (brownfield). Schema agent must finish first (§6 references §2 entity names) — dispatch with a brief wait, or sequence.
- **Session C:** One agent adds §10 + §11 (net-new); a second applies the lighter amendments (§5, §7, §1, §9, README); main thread does §4 rewrite and final consistency pass.

Agents must:
- Back up the original `TECHNICAL_SPEC.md` as `TECHNICAL_SPEC.pre-addendum.md` before Session A begins.
- Read phase specs in `docs/bef/03-phases/` as cross-reference (not just the addendum), since phase specs locked several decisions during the 2026-04-13 pass.
- Preserve any section that does not appear in the change list above.

---

## Critical Files

### Read for context (source)
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` — authoritative
- `docs/bef/ADDENDUM-INTEGRATION-PLAN.md` — phase-by-phase impact
- `docs/bef/03-phases/phase-11-ai-infrastructure/PHASE_SPEC.md` — model router, hybrid retrieval, eval harness locked decisions
- `docs/bef/03-phases/phase-02-agent-harness/PHASE_SPEC.md` — pipeline stage details, freeform agent tool lists, `Conversation`/`ChatMessage` reuse
- `docs/bef/03-phases/phase-06-org-knowledge/PHASE_SPEC.md` — five-layer model, migration strategy, Org Health Assessment details
- `docs/bef/03-phases/phase-05-sprint-developer/PHASE_SPEC.md` — Context Package Assembly 9-step spec
- `docs/bef/03-phases/phase-07-dashboards-search/PHASE_SPEC.md` — deterministic SQL metrics confirmation
- `.claude/threads/2026-04-13-addendum-integration-plan.md` — prior-session context

### Write (rewritten)
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` — most sections

### Write (backup)
- `docs/bef/01-architecture/TECHNICAL_SPEC.pre-addendum.md` — create before Session A

### Write (amended)
- `docs/bef/01-architecture/README.md` — file map only

---

## Verification

After Session C completes, run a reviewer pass (same pattern as the phase-spec verification):

1. **PRD + addendum coverage reviewer** — every addendum requirement has a home in `TECHNICAL_SPEC.md`; no orphans.
2. **Phase-spec consistency reviewer** — entity names, function signatures, pipeline stage counts in `TECHNICAL_SPEC.md` match the corresponding phase specs. Flag any drift.
3. **Self-consistency reviewer** — within `TECHNICAL_SPEC.md`, §3 pipeline stages reference the same entity names as §2, the same search functions as §8, the same model router intents as §10, the same eval harness conventions as §11.

Before declaring Step 2 complete:
- `TECHNICAL_SPEC.md` has no remaining references to the obsolete "three-layer agent harness" or "TaskType enum" except in clearly-marked deprecation/migration notes.
- README file map reflects all new sections.
- `PROJECT_STATE.md` Pipeline Progress: Stage 2 (Architecture) flipped from `[ ] Incomplete` to `[x] Complete`.
- Replan Log gets an entry for architecture-docs integration completion.

---

## Outstanding Decisions (Defer to Relevant Deep-Dives, Not Blocking This Plan)

These will surface during the rewrite but do not need to be resolved to complete it — flag them inline in the spec as "Decision Deferred: see Phase X deep-dive":

- Embedding provider (Voyage AI vs. OpenAI) — Phase 11 deep-dive. Embedding dimensions in schema specs should be parameterized by `embedding_model` column, not hardcoded 1536 or 1024.
- `KnowledgeArticle.embedding` fate — Phase 6 deep-dive.
- `eval_runs` persistence (file-only vs. DB) — flagged optional in Addendum §7.
- `annotation_versions` persistence — Addendum §4.5 optional.
- Rename-collision edge-case behavior — Phase 6 deep-dive will validate with fixture.

---

## Session Kickoff Checklist

Before starting Session A:

- [ ] Confirm no uncommitted changes in `docs/bef/01-architecture/`
- [ ] Copy `TECHNICAL_SPEC.md` to `TECHNICAL_SPEC.pre-addendum.md`
- [ ] Read the phase-11, phase-02, phase-06 specs in full (these lock the decisions being translated into the arch doc)
- [ ] Confirm Anthropic model IDs in §10 draft match current locked versions (Opus 4.6, Sonnet 4.6, Haiku 4.5)
- [ ] Block ~6 hours of focused time; do not attempt fragmented passes
