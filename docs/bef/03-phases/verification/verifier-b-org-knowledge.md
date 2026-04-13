# Verifier B — Org Knowledge / Sandbox / Dev Guardrails

**Scope:** PRD §13–15 + Addendum v1 §3, §4 vs. Phases 5, 6, 11 + TECHNICAL_SPEC.md
**Date:** 2026-04-13

## Summary
Cross-checked 60 atomic requirements. Status breakdown: 50 COVERED, 6 PARTIAL, 3 DEFERRED-TO-DEEP-DIVE, 1 GAP, 1 cross-cutting blocker owned by Phase 4.

## Status Breakdown

### COVERED (50)
- All five org knowledge layers (Component Graph, Embeddings, Domains, Annotations, Query Interface) with detailed implementations
- Sync reconciliation algorithm (5-step match-by-ID-first, rename detection, soft-archive)
- Brownfield domain proposal via Claude Managed Agents
- Org Health Assessment (six deterministic analyses + Managed Agent synthesis, $25 cost ceiling)
- Context Package Assembly deterministic pipeline (9 steps, <3s p95, single Sonnet call)
- Model router and eval harness as V1 requirements
- Developer API endpoints with semantic search integration

### PARTIAL (6) — signatures locked; implementations deferred
- `search_org_kb` signature in Phase 11; full implementation Phase 6
- Rename-collision edge case fixture (algorithm validated, edge-case validation pending)

### DEFERRED-TO-DEEP-DIVE (3)
- Sandbox brownfield/scratch-org warning (mentioned as in-scope in Phase 5, no functional spec)
- API key expiry/rotation policy
- KnowledgeArticle.embedding migration path (retain inline vs. parallel table vs. deprecate)

### GAP (1)
- Brownfield scratch-org UI warning (no task identified in Phase 5/6 specs)

### CROSS-CUTTING BLOCKER (Phase 4 ownership)
- **Dev Guardrails 1–6 absent from story generation prompts.** Phase 4 GAP-WORK-006 documents that none of the six Salesforce development guardrails (governor limits, bulkification, test classes, naming conventions, security patterns, sharing model) appear in current story generation task prompts. Blocks Phase 5/6 from delivering complete guardrail context to developers. **Critical path item.**

## Strengths
1. Five-layer org KB model is well-architected — Layer 1 (graph), Layer 2 (embeddings), Layer 3 (domains), Layer 4 (annotations), Layer 5 (query interface) cleanly separate concerns. Addendum v1 supersedes pre-addendum flat model decisively.
2. Managed Agents scope is explicit and narrow — Only two workloads: brownfield domain proposal (initial ingestion) + Org Health Assessment (long-running). Not used for request-scoped work.
3. Deterministic Context Package Assembly pipeline — Replaces agent loop with specified 9-step pipeline, single Sonnet summarization, <3s p95 latency target. Dependency on `search_org_kb` (Phase 6 Task 17) is clear.
4. Sync reconciliation algorithm is robust — 5-step approach with rename detection, soft-archive, managed-package flagging, and unresolved reference tracking.
5. Eval harness is a V1 requirement — Phase 11 scaffolds; seeded fixtures for Transcript Processing + Answer Logging; Phase 2, 5, 6 add their own. CI gate blocks merge on `src/ai/`, `src/pipelines/`, `prompts/`, `evals/` changes.

## Ordering / Dependency Concerns

1. **Phase 11 search primitive refactor (HIGHEST RISK)**
   - Phase 11 Task 3 requires auditing existing `globalSearch()`, extracting the generic hybrid retrieval primitive, and refactoring all call sites.
   - Existing code at `src/lib/search/global-search.ts` + `src/lib/agent-harness/context/smart-retrieval.ts` must be preserved through refactor.
   - Phase 1 regression tests must pass post-refactor.
   - **Recommendation:** Pair Phase 11 deep-dive with Phase 1 lead for safety verification.

2. **Embedding provider decision must precede Phase 11 completion**
   - Choice between Voyage AI `voyage-3-lite` vs. OpenAI `text-embedding-3-small`.
   - Requires quality test (50 labeled component-to-query pairs) + pricing comparison.
   - Contractual data-handling agreement required before production (no retention, no training).
   - **Gate:** Lock before Phase 2 executes.

3. **KnowledgeArticle.embedding migration path unresolved**
   - Three options: retain inline (inconsistent with Layer 2), migrate to parallel table (consistent but higher cost), deprecate (if Layer 5 search supersedes).
   - Decision blocks Phase 6 schema migration (Task 1).
   - **Recommendation:** Resolve in Phase 6 pre-deep-dive.

4. **Dev Guardrails gap in Phase 4 (cross-cutting blocker)**
   - Phase 4 GAP-WORK-006: no guardrail language in story generation prompts.
   - Phase 5/6 context packages inherit this gap, failing to deliver guardrail context to developers.
   - **Critical path:** Phase 4 deep-dive must add guardrails to `storyGenerationTask` + `getProjectSummary`.

## Outstanding-for-deep-dive items observed

### Phase 11
1. Embedding provider quality + pricing test methodology
2. Hybrid retrieval refactor safety verification plan
3. HNSW index tuning parameters (m, ef_construction)

### Phase 6
1. Rename-collision edge-case fixture validation
2. Managed-package exclusion override UX location + default
3. KnowledgeArticle.embedding migration choice
4. Domain proposal confidence threshold (manual-review-for-all vs. auto-confirm threshold)
5. Org Health Assessment cost ceiling UX (budget meter visualization)
6. Managed Agents progress/polling architecture

### Phase 5
1. Brownfield scratch-org warning UX + trigger logic (currently mentioned but not specified)
2. API key expiry/rotation policy
3. Context Package Assembly eval fixtures authorship (Phase 5 owns; live in Phase 11 infrastructure)

### Phase 4 (Escalate)
1. Six Salesforce development guardrails must appear in story generation prompts. This is a Phase 4 ownership item but blocks effective Phase 5/6 delivery. Escalate to Phase 4 lead.
