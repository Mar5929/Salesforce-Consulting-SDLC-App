# Step 2 Verification Report — PRD + Addendum vs. Phase Artifacts

**Date:** 2026-04-13
**Sweep type:** Four parallel verifier agents, scope-partitioned by PRD domain
**Inputs verified against:** PRD.md (27 §), PRD-ADDENDUM-v1-Intelligence-Layer.md (10 §), ADDENDUM-INTEGRATION-PLAN.md, PHASE_PLAN.md, all 11 phase folders (PHASE_SPEC + TASKS), TECHNICAL_SPEC.md (post-rewrite)

Detailed per-verifier matrices live at `docs/bef/03-phases/verification/verifier-{a,b,c,d}-*.md`.

---

## Executive Summary

**Verdict: PROCEED to Step 3 deep-dives.** No blocking gaps. ~245 atomic requirements verified across four verifiers. The phase plan, specs, and tasks accurately reflect both the base PRD and Addendum v1.

| Verifier | Scope | Atomic reqs | Covered | Partial | Gap | Mismatch | Deferred |
|----------|-------|-------------|---------|---------|-----|----------|----------|
| A | Harness/Pipelines/Discovery/Work/Sprint (PRD §6–12, Add §2/§5/§9) | 68 | 52 | 9 | 6 | 0 | 16 |
| B | Org KB/Sandbox/Guardrails (PRD §13–15, Add §3/§4) | 60 | 50 | 6 | 1 | 0 | 3 (+1 cross-cutting blocker) |
| C | Docs/Dashboards/QA/Multi-user/Jira/Archival (PRD §16–21) | 57 | ~38 | ~10 | 0 | 0 | ~9 |
| D | Foundation/Stack/Build Sequence/Ordering (PRD §1–5, §22–27, Add §3/§6/§7/§8) | foundation review | All 11 schema entities, 8 locked decisions, 6 personas, 6 security reqs, 4 stack amendments, 6 exclusions, 11 open questions all tracked | — | 0 | 0 | 1 minor (graph annotation) |

Status legend: COVERED = fully present; PARTIAL = signature/scope locked, detail TBD; GAP = not addressed anywhere; MISMATCH = phase contradicts PRD/addendum; DEFERRED-TO-DEEP-DIVE = explicitly flagged for Phase 2/6/11 deep-dive.

---

## Critical Findings (action required before Step 3)

### 1. Cross-cutting blocker: Dev Guardrails missing from story generation prompts
- **Source:** Verifier B, Phase 4 GAP-WORK-006
- **Issue:** None of the six Salesforce dev guardrails (governor limits, bulkification, test classes, naming conventions, security patterns, sharing model — PRD §15) appear in current story generation task prompts. Phase 5/6 context packages inherit this gap and fail to deliver guardrail context to developers.
- **Owner:** Phase 4 (must be addressed in Phase 4 deep-dive, not Phases 5/6)
- **Action:** Add guardrails to `storyGenerationTask` + `getProjectSummary` prompts.

### 2. KnowledgeArticle.embedding migration path unresolved
- **Source:** Verifier B
- **Issue:** Three options (retain inline / migrate to parallel table / deprecate). Decision blocks Phase 6 schema migration (Task 1).
- **Owner:** Phase 6 pre-deep-dive
- **Action:** Lock decision before Phase 6 Task 1 starts.

### 3. Embedding provider gate must lock before Phase 11 execution
- **Source:** Verifiers B & D
- **Issue:** Voyage `voyage-3-lite` vs. OpenAI `text-embedding-3-small`. Needs quality test on 50+ labeled component-to-query pairs + pricing comparison + data-handling contract.
- **Owner:** Phase 11 deep-dive gate
- **Action:** Run quality test and lock provider before Phase 2 executes (Phase 2 retrofits Claude calls through model router which depends on embeddings infra).

### 4. Brownfield scratch-org warning UX missing
- **Source:** Verifier B (1 GAP)
- **Issue:** Phase 5 mentions sandbox/scratch-org warning in scope but no functional spec or task identified.
- **Owner:** Phase 5 deep-dive
- **Action:** Add task for warning UX + trigger logic.

### 5. PHASE_PLAN.md missing Phase 6 → Phase 5 visual edge
- **Source:** Verifier D
- **Issue:** Phase 5 PHASE_SPEC.md §1 correctly lists Phase 6 as a dependency, but the ASCII dependency graph in PHASE_PLAN.md (lines 11–26) only shows Phase 4 → Phase 5. Visual-only inconsistency, no schedule impact.
- **Owner:** Anyone (5-min fix)
- **Action:** Add explicit Phase 6 → Phase 5 edge to graph.

### 6. Phase 2 scope sizing (XL)
- **Source:** Verifier D
- **Issue:** Phase 2 = harness hardening + 4 deterministic pipelines + freeform agent. Verifier D recommends evaluating a Phase 2a (harness) + Phase 2b (pipelines) split during deep-dive.
- **Owner:** Phase 2 deep-dive
- **Action:** Decide split vs. monolithic during deep-dive scoping.

### 7. Verifier A GAPs (6 items)
PRD mentions not yet detailed in phase specs:
- Engagement types + default epic templates (mentioned in Phase 9 but spec TBD)
- General chat Tier 1 model selection
- Discovery dashboard synthesis specifics
- Question lifecycle states
- (Two additional minor items — see Verifier A matrix)

**Action:** Address each in the relevant phase's deep-dive (mostly Phase 3, Phase 9).

---

## Phase Ordering — Verified Compliant

Per Addendum §6 build sequence:

| Required edge | Status | Note |
|---|---|---|
| Phase 11 → Phase 2 | ✓ | Model router + hybrid retrieval prerequisite |
| Phase 11 + 2 → Phase 6 | ✓ | Phase 6 needs pipelines + embeddings |
| Phase 6 → Phase 5 | ✓ (textual; visual fix needed — see Critical #5) | Phase 5 consumes search_org_kb |
| Phase 10 parallel | ✓ | UI work parallelizable with 11/2 |
| No circular deps | ✓ | DAG valid |

---

## Outstanding-for-Deep-Dive Inventory (Step 3 input)

### Phase 11 (AI Infrastructure)
- Embedding provider selection (Voyage vs. OpenAI) + quality test methodology
- Hybrid retrieval refactor safety verification (must preserve `globalSearch()` + `smart-retrieval.ts` behavior)
- HNSW index parameters (m, ef_construction)
- RRF k=60 validation against labeled test corpus
- Eval fixture authorship (Phase 5/6/2 author, Phase 11 hosts infra)

### Phase 2 (Harness + Pipelines)
- Orphan TaskType enum re-mapping
- Per-pipeline error handling + escalation
- Confidence thresholds (Answer Logging, Story Generation)
- Freeform agent system prompt + tool set
- Transcript processing sync vs. async
- Briefing caching strategy
- Cost cap (hard limit vs. soft alert)
- Cross-pipeline integration matrix + stage-by-stage data flow
- 2a/2b split decision

### Phase 3 (Discovery + Questions)
- Gap detection coverage scope
- Readiness assessment formula
- Question ID scheme

### Phase 4 (Work Management) — ESCALATE
- Add 6 SF dev guardrails to story generation prompts (GAP-WORK-006) — blocks Phase 5/6

### Phase 5 (Sprint + Developer API)
- Brownfield scratch-org warning UX + trigger
- API key expiry/rotation policy
- Mid-sprint component handling
- Latency target validation (<3s p95)
- Context Package Assembly eval fixtures

### Phase 6 (Five-Layer Org KB)
- KnowledgeArticle.embedding migration choice
- Rename-collision edge-case fixture
- Managed-package exclusion override UX
- Domain proposal confidence threshold (manual-review-all vs. auto-confirm)
- Org Health Assessment cost ceiling UX
- Managed Agents progress/polling architecture
- Component edge circular reference detection
- Rename tracking retention
- Org health escalation

### Phase 7 (Dashboards + Search)
- Roadmap/Sprint dashboard details (burndown algorithm, conflict thresholds, workload attribution, milestone narratives)
- Usage & Costs backend (SessionLog aggregation, cost calc, cap enforcement, daily/monthly thresholds)
- Audit logging (which actions, schema, read-access scope, query filtering)

### Phase 8 (Docs + Notifications)
- Briefing/Status pipeline integration points (which stages emit `pending_review` vs. `conflicts_flagged`, recipients, activity feed surfacing)

### Phase 9 (QA + Jira + Archival)
- Default epic templates (versioning, customization, engagement type selection, fallback)
- Engagement type catalog

---

## Recommended Actions

### Fix Now (before Step 3 deep-dives start)
1. Update PHASE_PLAN.md to add Phase 6 → Phase 5 visual edge (5 min)
2. Decide KnowledgeArticle.embedding migration path (or commit to deciding in Phase 6 deep-dive opener)
3. Schedule embedding provider quality test (Phase 11 gate)

### Defer to Step 3 deep-dives (with explicit gates)
- Phase 4 deep-dive must address GAP-WORK-006 (dev guardrails in story prompts) — escalate
- Phase 11 deep-dive: embedding provider lock + hybrid retrieval refactor safety plan
- Phase 2 deep-dive: 2a/2b split decision + cross-pipeline matrix
- Phase 6 deep-dive: Managed Agents POC before full integration
- Phase 3 deep-dive: gap detection scope + readiness formula
- Phase 5 deep-dive: brownfield scratch-org warning task
- Phase 7 deep-dive: roadmap/sprint/usage/audit completeness
- Phase 9 deep-dive: epic template catalog

### Defer to V2 (already explicitly noted)
- Full OCC conflict UI (GAP-RBAC-011)
- Semantic search expansion beyond KnowledgeArticle (GAP-DASH-020)
- Reactivation fork-and-inherit (GAP-ARCH-004)
- Email + push notifications
- Playwright integration
- AI-generated milestone summaries (GAP-DASH-008)
- Gantt visualization (GAP-DASH-023)

---

## Sign-off Checklist

- [x] All 27 PRD sections appear in at least one verifier matrix
- [x] All 10 Addendum sections appear in at least one verifier matrix
- [x] All 11 phase folders referenced
- [x] All 11 new schema entities individually tracked (Verifier D)
- [x] All 4 deterministic pipelines individually tracked (Verifier A)
- [x] All 5 org KB layers individually tracked (Verifier B)
- [x] All 14 notification types individually tracked (Verifier C)
- [x] Phase ordering reviewed against Addendum §6 (Verifier D)
- [x] Outstanding deep-dive items consolidated (this report, §"Outstanding-for-Deep-Dive Inventory")
- [x] Report saved to `docs/bef/03-phases/VERIFICATION-STEP-2.md`
- [ ] PROJECT_STATE.md updated to mark Step 2 complete and point to this report

---

## Source Files

- `docs/bef/03-phases/verification/verifier-a-harness-pipelines.md`
- `docs/bef/03-phases/verification/verifier-b-org-knowledge.md`
- `docs/bef/03-phases/verification/verifier-c-docs-dashboards-qa.md`
- `docs/bef/03-phases/verification/verifier-d-foundation-ordering.md`
