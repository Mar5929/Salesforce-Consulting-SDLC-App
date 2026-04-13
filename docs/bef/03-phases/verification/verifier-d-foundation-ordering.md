# Verifier D — Foundation / Security / Stack / Build Sequence / Ordering

**Scope:** PRD §1–5, §22–27 + Addendum v1 §3, §6, §7, §8 vs. Phases 1, 10, 11 + cross-cutting schema check + full phase-ordering review
**Date:** 2026-04-13

## Executive Summary

**Overall Status:** COMPLIANT WITH ONE MINOR CLARIFICATION NEEDED.

All 11 new schema entities, 8 locked decisions, RBAC roles, tech stack amendments, and phase ordering constraints validated.

## Coverage Summary

| Domain | Count | Status |
|--------|-------|--------|
| New Schema Entities (Addendum §7) | 11 | ALL COVERED |
| Locked Decisions (Addendum §2) | 8 | ALL REFLECTED |
| Personas (PRD §4) | 6 | ALL MAPPED |
| Security Requirements (PRD §22) | 6 | ALL COVERED |
| Tech Stack Amendments (Addendum §3) | 4 | ALL REFLECTED |
| What-This-Is-Not Exclusions (PRD §24) | 6 | ALL EXCLUDED |
| Open Questions (PRD §27 + Addendum §8) | 11 | ALL TRACKED |
| Phase Dependency Edges | 10 critical | ALL VERIFIED |
| Circular Dependencies | — | NONE FOUND |

## Key Findings

### 1. 11 New Schema Entities (Addendum §7)
ALL COVERED. Entities: component_edges, component_embeddings, question_embeddings, decision_embeddings, requirement_embeddings, risk_embeddings, story_embeddings, annotation_embeddings, pipeline_runs, pipeline_stage_runs, pending_review. Owned by Phase 11 Task 1 (schema) + Phase 2/6 (population/use). No orphans.

### 2. 8 Locked Decisions (Addendum §2)
ALL REFLECTED:
- Five-layer org KB model (Phase 6)
- Postgres + pgvector, no separate vector store (Phase 11 Task 1)
- BM25 + pgvector + RRF k=60 hybrid retrieval (Phase 11 Task 4)
- Centralized model router (Phase 11 Task 2)
- Deterministic pipelines (Phase 2 §3-4)
- Eval harness as V1 deliverable (Phase 11 Tasks 6-10)
- Claude Managed Agents narrow use (org health + brownfield domain only; Phase 6)

### 3. 6 Personas + RBAC (PRD §4 + §22)
ALL MAPPED. SA/Developer/PM/BA/QA/Exec mapped to RBAC roles. Phase 1 implements gates (REQ-RBAC-001-014). Phase 10 UI patterns reflect role-based visibility.

### 4. 4 Tech Stack Amendments (Addendum §3)
ALL REFLECTED: pgvector (Phase 11), Inngest (Phase 11 Task 5), Claude Sonnet/Haiku/Opus (Phase 11 Task 2), embedding provider decision gate (Phase 11 deep-dive).

### 5. 6 What-This-Is-Not Exclusions (PRD §24)
ALL CORRECTLY OUT-OF-SCOPE. Verified absent from phase scope: agent-driven feature generation, auto-priority escalation, sync-triggered state changes, component deletion cascades, multi-org federation, speculative analysis.

### 6. 11 Open Questions (3 PRD §27 + 8 Addendum §8)
ALL TRACKED with explicit phase ownership or V2 deferral: RRF tuning (Phase 11), conflict resolution UI (V2), brownfield ingestion (Phase 6), transcript sync/async, component circularity, answer logging threshold, domains CRUD, sprint context changes, embedding caching, annotation extensibility, org health escalation.

### 7. Phase Ordering vs. Addendum §6 Mandates
COMPLIANT:
- Phase 11 before Phase 2 ✓
- Phase 11 + Phase 2 before Phase 6 ✓
- Phase 6 before Phase 5 ✓ (textually explicit)
- Phase 10 parallel ✓
- No circular dependencies ✓
- DAG valid ✓

## Ordering / Dependency Concerns

**ONE MINOR ISSUE:** Phase 6 → Phase 5 dependency is textually explicit in Phase 5 PHASE_SPEC.md §1 ("Depends On: Phase 4, Phase 6") and §4.6 context assembly requirements, but NOT visually clear in PHASE_PLAN.md dependency graph (lines 11–26). The graph footnote mentions "depends on Phase 4 + Phase 6" but the ASCII arrow only shows Phase 4 → Phase 5.

**Recommendation:** Update PHASE_PLAN.md lines 11–26 to show explicit Phase 6 → Phase 5 edge for clarity (no schedule impact).

## Critical Gates Before Phase Deep-Dives

1. **Phase 11 Deep-Dive Gate:** Embedding provider selection (Voyage AI vs. OpenAI) + quality test on 50 labeled component-to-query pairs (PHASE_PLAN.md L50)
2. **Phase 2 Deep-Dive Decision:** XL scope — harness + 4 pipelines + freeform agent. Consider Phase 2a (harness) + Phase 2b (pipelines) split.
3. **Phase 6 Deep-Dive Gate:** Claude Managed Agents proof-of-concept (brownfield domain proposal) before full integration
4. **Phase 3 Deep-Dive Risk:** Gap detection + readiness assessment labeled XL AI features; high uncertainty
5. **Phase 7/9 Sizing:** Assess scope vs. capacity; plan splits (Phase 7a/7b, Phase 9a/9b) if needed

## Outstanding-for-deep-dive items observed

**Phase 2:** transcript sync/async, answer logging confidence threshold, story generation KB cross-ref, briefing caching, freeform agent write tool scope, cost cap (hard limit vs. soft alert)

**Phase 3:** gap detection coverage (PRD sections), readiness assessment formula, question ID scheme

**Phase 5:** mid-sprint component handling, latency target validation (<3s p95), API key rotation frequency, brownfield scratch-org warning conditions

**Phase 6:** component edge circular reference detection, rename tracking retention, domain proposal trigger, domain CRUD vs. auto-proposal balance, org health escalation

**Phase 11:** RRF k=60 validation against labeled corpus, HNSW parameters (m, ef_construction), eval fixture authorship, embedding provider selection gate
