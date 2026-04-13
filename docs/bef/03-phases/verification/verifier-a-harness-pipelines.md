# Verification Report A: Harness, Pipelines, and Intelligence Layer

**Verifier:** A | **Sweep Date:** 2026-04-13 | **Requirements Analyzed:** 68

## Summary

The PRD and Addendum define four deterministic pipelines (Transcript Processing, Answer Logging, Story Generation, Briefing/Status), one freeform agent, a five-layer org knowledge model, centralized model routing, and an eval harness.

**Status:** 52 COVERED, 9 PARTIAL, 6 GAP, 1 MISMATCH, 16 DEFERRED-TO-DEEP-DIVE

## Key Findings

### COVERED (52)
- Four pipeline specifications (Addendum §5.2): all with defined stages, inputs, outputs, failure handling
- Model router (intent-based routing): extract / synthesize / generate_structured / reason_deeply / embed
- Hybrid retrieval primitive: search_project_kb() + search_org_kb() with BM25 + pgvector + RRF
- Five-layer org knowledge: Component Graph, Embeddings, Domains, Annotations, Query Interface
- Mandatory story field validation (7 fields: persona, description, acceptanceCriteria, epic/feature, storyPoints, testCases, storyComponents)
- Sprint intelligence: capacity, parallelization, conflicts, mid-sprint re-analysis, developer coordination
- Context Package Assembly: deterministic pipeline, 9 steps, <3s p95 latency, single Sonnet call
- Eval harness: scaffold + 10 fixtures per pipeline, CI gate
- Confidence flags on extracted entities: HIGH/MEDIUM/LOW + needsReview + reviewReason

### PARTIAL (9) — Details TBD in Phase Deep-Dives
- General chat Tier 1 project summary architecture (Phase 2 mentions it; design TBD)
- Freeform agent system prompt, model selector, write tool UX (Phase 2 §8.B)
- Discovery gap detection + readiness assessment prompts (Phase 3, flagged as highest-risk)
- Briefing/Status caching triggers (Phase 2 §8.F)
- Test case stub generation prompt logic (Phase 4 §3.1.G)
- OrgComponent linked mode autocomplete ranking (Phase 4 §3.1.H)
- NLP-to-semantic search handoff when Phase 6 not yet complete (Phase 5 §1.J)
- Domain membership auto-confirm threshold (Phase 6 §8.D)
- Managed Agents cost ceiling for Org Health (Phase 6 §8.C)

### GAP (6) — PRD Mentioned but Not Yet Detailed
- Engagement type selection + default epic template initialization (Phase 9 TBD)
- General chat history window Tier 1 model specifics (Phase 2 infrastructure TBD)
- Discovery dashboard narrative synthesis (Phase 7 TBD)
- Freeform agent full system prompt
- Question lifecycle + ID scheme enforcement details (Phase 3 TBD)

### DEFERRED-TO-DEEP-DIVE (16 Items)
1. Harness architecture clarity (Phase 2 §8.A): Are old task dispatcher and three-layer harness removed or legacy?
2. Freeform agent specification (Phase 2 §8.B): System prompt, model selector, write tool confirmation, conversation persistence
3. Stage failure policy (Phase 2 §8.C): 3 retries hardcoded or configurable? Escalation UI? Human review SLA?
4. Pending review table UI (Phase 2 §8.D): Review queue appearance, approval/rejection workflow
5. Confidence threshold calibration (Phase 2 §8.E): Exactly 0.85 goes to review; calibration TBD
6. Briefing caching triggers (Phase 2 §8.F): Which state changes invalidate cache? Manual refresh rate limit?
7. Test case stub prompt (Phase 4 §3.1.G): How does AI decide between test types? Detail level?
8. OrgComponent linked mode autocomplete (Phase 4 §3.1.H): Ranking method? Fallback for "no org"?
9. Context Package eval fixture authorship (Phase 5 §1.I): Who authors? Which are gold labels?
10. NLP-to-semantic search handoff (Phase 5 §1.J): What if Phase 6 not yet complete?
11. Domain membership auto-confirm (Phase 6 §8.D): Threshold for human review?
12. Managed Agents cost ceiling (Phase 6 §8.C): Default budget for Org Health?
13. Rename-collision edge case (Phase 6 §8.F): Rule validation with fixture
14. Embedding provider selection (Phase 11 §7.A): Voyage AI vs. OpenAI (gate: document in TECHNICAL_SPEC.md before Phase 2 deep-dive)
15. RRF k tuning (Phase 11 §7.B): Measure and lock value after Phase 2 ships
16. Embedding migration playbook (Phase 11 §7.C): Document dual-write strategy for future provider swaps

---

## Dependency Chain Verification

| Chain | Status | Notes |
|-------|--------|-------|
| Phase 11 → Phase 2 | ✓ Correct | Model router, hybrid retrieval, eval scaffold block Phase 2 |
| Phase 2 → Phase 3,4,6 | ✓ Correct | Pipelines unblock downstream |
| Phase 6 → Phase 5 | ✓ Correct | search_org_kb() required by Context Package Assembly (updated April 13) |
| Phase 11 → Phase 6 | ✓ Correct | Component edges, embedding tables created before Phase 6 population |

---

## Cross-Phase Observability Gaps

- **Pipeline Observability Dashboard:** Pipelines write to pipeline_runs/pipeline_stage_runs but no UI. Phase ownership unclear (Phase 2 or Phase 7). Recommend basic observability page in Phase 2.
- **Model Router Audit Trail:** No logging of intent → model resolution. Recommend pipeline_runs.modelUsed + optional pipeline_router_logs table in Phase 11.

---

## Conclusion

**Green (52):** Core architecture (pipelines, model router, retrieval, eval) fully specified.

**Amber (25):** Details TBD in deep-dives; acknowledged and owned by phases.

**Red (6):** Engagement types, Tier 1 summary, discovery dashboard synthesis, gap detection prompts need investigation.

**Overall Risk:** Medium. Core locked. Outstanding are design & UX choices, not architectural gaps.

---

**Report Date:** 2026-04-13 | **Verifier A**

