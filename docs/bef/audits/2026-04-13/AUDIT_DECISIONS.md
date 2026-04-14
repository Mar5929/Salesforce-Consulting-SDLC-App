# Audit Decisions — Wave 0 Sign-off

**Date:** 2026-04-13
**Decided by:** Michael Rihm
**Basis:** `CROSS_PHASE_SUMMARY.md` §4 (Cross-phase contradictions), §8 (Ambiguity inventory), §9 (Wave 0).

These decisions are authoritative for all fix agents executing Waves 1–3. Fix agents must cite the relevant row by `DECISION-nn` when amending a PHASE_SPEC or TASKS file.

---

## DECISION-01 — `agent_conversations` + `agent_messages` tables
**Resolves:** Contradiction A (Phase 2 GAP-01, Phase 11 GAP-01)
**Decision:** Create both tables in Phase 11 per Addendum §5.3 / §7.
**Downstream actions:**
- Phase 11: keep table-creation task; ensure schema matches Addendum §7.
- Phase 2: drop §4 "Persistence" reuse language; align persistence to the new tables.
- TECHNICAL_SPEC §5.3: amend to reflect the new tables (remove the "reuse Conversation/ChatMessage" paragraph).
**Authority:** Addendum wins per CLAUDE.md hard rule.

## DECISION-02 — `vector(512)` hardcoded dimension
**Resolves:** Contradiction E (Phase 11 GAP-12)
**Decision:** Hardcode `vector(512)` across all 7 embedding tables in V1.
**Downstream actions:**
- Phase 11: keep schema as-is.
- TECHNICAL_SPEC §8.5: amend to state that V1 hardcodes 512 dims; future dimension migration is a deliberate, documented amendment, not a runtime config.
**Rationale:** Voyage 3-lite locked for V1; simpler schema; migration path is a future project, not a V1 concern.

## DECISION-03 — Voyage 50-pair quality test
**Resolves:** Ambiguity (Phase 11 GAP-02)
**Decision:** Run the Addendum §3.1-02 / §8.A 50-pair quality test before Phase 11 execution lands.
**Downstream actions:**
- Phase 11: add a task (or extend an existing one) to run the test, record results, sign off. Block Phase 11 merge on test completion.
- **Scope clarification (added 2026-04-14):** Gate applies to any phase that enqueues via `embeddings.enqueue` — Phase 3, Phase 4, and Phase 6 inherit this merge gate because they share the embedding path.
**Rationale:** Addendum-locked requirement; skipping without evidence is a silent scope change. Test cost is low vs. regression cost.

## DECISION-04 — PRD-16-06 document preview
**Resolves:** Ambiguity (Phase 8 preview deferral)
**Decision:** Build PDF preview in Phase 8 V1. Do not defer to V2.
**Downstream actions:**
- Phase 8: add preview task before doc persistence. PHASE_SPEC must reflect preview as in-scope.
**Rationale:** PRD-16-06 is explicit; deferral without PRD amendment is silent scope reduction.

## DECISION-05 — `KnowledgeArticle.embedding` in V1
**Resolves:** Ambiguity (Phase 6 GAP-02)
**Decision:** Build `KnowledgeArticle.embedding` in Phase 6 V1. Layer 3 two-pass retrieval uses it.
**Downstream actions:**
- Phase 6: own the `knowledge_article_embeddings` table (or `embedding` column per final schema decision in Phase 6 deep-dive) and the embedding write path. Close GAP-02 "three options pending" with Option A (build now).
- Phase 11: coordinate on embeddings queue consumption (no Phase 11 re-scope needed since queue already exists).
- Phases 5 + 7: consume via `search_org_kb` only; no direct dependency on the embedding column.
**Rationale:** Layer 3 two-pass retrieval (Addendum §5.4) depends on KA embeddings. Deferring breaks Phases 5 and 7.

## DECISION-06 — Tasks-tier UI ownership
**Resolves:** Ambiguity (Phase 10 GAP-02)
**Decision:** Phase 10 owns the Tasks-tier UI.
**Downstream actions:**
- Phase 10: add Tasks rendering within Story Detail view (or a dedicated Tasks panel). PHASE_SPEC must add REQ-ID trace to PRD-10-02.
- Phase 4: Tasks data model / workflow stays owned by Phase 4; Phase 10 consumes.
**Rationale:** Phase 10 is the Work Tab UI overhaul; Phase 4 is data/workflow. Clean separation.

## DECISION-07 — BRD / SDD / Client Deck templates
**Resolves:** Ambiguity (Phase 8 GAP-02)
**Decision:** Phase 8 builds all 3 document templates (BRD, SDD, Client Deck/PPTX).
**Downstream actions:**
- Phase 8 Task 6: extend to include the 3 new templates. Track as distinct task IDs if scope warrants. PHASE_SPEC must cite PRD-16-01 for each.
**Rationale:** PRD-16-01 lists them explicitly; no earlier phase claims prior implementation.

## DECISION-08 — Orphan requirement owners
**Resolves:** Orphan requirements (`CROSS_PHASE_SUMMARY.md` §5)
**Decision:** Accept all suggested owners from §5 as authoritative assignments.
**Downstream actions:** Each orphan Req ID is owned by the phase listed in §5. Owning phase must add a spec block and at least one task (or AC on an existing task) covering the requirement. Notable assignments:
- PRD-5-25 (polymorphic attachments): **Phase 4** (stories/questions) + **Phase 9** (defect refactor)
- PRD-5-26 / PRD-19-11 / PRD-19-12 / PRD-25-03 (optimistic concurrency + VersionHistory): **Phase 4**
- PRD-9-08 (epic prefix uniqueness): **Phase 3**
- PRD-9-10 (question text clarity): **Phase 3**
- PRD-13-14 (planned KB placeholder): **Phase 6**
- PRD-13-17 (initial KA drafts): **Phase 4**
- PRD-11-01 (AI Execution Mapping): **Phase 5**
- PRD-22-05 (AI output sanitization): **Phase 2**
- PRD-22-10 (suspicious transcript flag): **Phase 2**
- PRD-22-13 (token field stripping): **Phase 5**
- PRD-22-16 (API request logging 90d): **Phase 5**
- PRD-13-28 (isStale propagation): **Phase 2** hook + **Phase 6** flag consumer
- PRD-8-12 (interrupted session FAILED): **Phase 2**
- PRD-6-07 / PRD-6-19 (context + iteration budgets): **Phase 2**
- PRD-6-25 (background job best-guess): **Phase 2**
- PRD-5-14 (null test-assignee fallback): **Phase 8**
- PRD-16-07 (regeneration with adjustments): **Phase 8**
- PRD-5-27 (BusinessProcess statuses): **Phase 6**
- PRD-13-16 / PRD-13-20 / PRD-13-21 (BP + KA defaults): **Phase 6**
- PRD-17-05 (Current Focus narrative): **Phase 2** emits + **Phase 7** consumes
- PRD-23-12 (Inngest event volume metric): **Phase 7**
- PRD-23-03 (firm-wide monthly cost alert): **Phase 7**

## DECISION-09 — Firm-wide cost cap behavior
**Resolves:** Ambiguity (firm-wide cap advisory vs blocking)
**Decision:** Advisory (alert-only) in V1. Do not block execution at firm level.
**Downstream actions:**
- Phase 7: wire firm-wide alert notification per PRD-23-03. No enforcement gate.
- Phase 2: no firm-level blocking in pipeline runs; per-project caps remain blocking per existing locked behavior.
**Rationale:** A firm-level block can halt all users from one user's behavior with no override path. Advisory is safer for V1; revisit with usage data. Revisit trigger: once V1 in production for ≥1 month, review cap utilization and upgrade to blocking if needed.

## DECISION-11 — Phase 3 `questionImpactFunction` collapses into pipeline listener
**Resolves:** Cross-phase contradiction A derivative (CROSS_PHASE_SUMMARY §4) — no prior explicit DECISION ID.
**Decision:** Phase 3 `questionImpactFunction` collapses into a `QUESTION_IMPACT_COMPLETED` event listener; the Answer Analysis Pipeline owns impact analysis per Addendum §2 (Addendum-wins).
**Downstream actions:**
- Phase 3: PHASE_SPEC / TASKS cite `DECISION-11` (replaces the earlier "DECISION-01 derivation + Addendum §2" citation already applied in Wave 2 commit `253c0ed`).
- Wave 3 and all verifier agents: cite `DECISION-11` for this collapse.
**Rationale:** Future verifier agents cite by stable ID; derivation logic rots. Retro-minted 2026-04-14 after Wave 2 merged without an explicit ID.
**Authority:** Addendum §2 (Addendum-wins) + PRD Addendum v1 pipeline-first architecture.

## DECISION-10 — Archive read-only gate ownership
**Resolves:** Ambiguity (Phase 9 GAP-02)
**Decision:** Phase 9 owns `assertProjectWritable(projectId)` helper. Exports it. Phases 2, 4, 8 import at all mutation points.
**Downstream actions:**
- Phase 9: add `assertProjectWritable` as a published interface; include in Phase 9 "Published Interfaces" section. PHASE_SPEC amends to cover PRD-21-01 step 1 (read-only enforcement).
- Phases 2, 4, 8: import + call at every mutation entry point (story/question/defect edits, AI chat submit, doc gen trigger). Tests must verify archived-project calls throw / return 409.
**Rationale:** Keeps archival lifecycle logic co-located with Phase 9; other phases treat it as a Phase 1-style published helper (Pattern D remediation).

---

## Sign-off

- [x] All 10 Wave 0 items decided
- [x] Authority cited for each (Addendum / PRD / TECH_SPEC / judgment)
- [x] Downstream actions are actionable per phase
- [x] Fix agents may now execute Waves 1–3 against per-phase audits

**Next action:** dispatch fix agents per phase. Each agent reads its `phase-NN-audit.md` + this decisions file + the relevant PHASE_SPEC/TASKS, and applies the fix plan.
