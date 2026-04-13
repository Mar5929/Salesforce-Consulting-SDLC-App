# Project State: Salesforce Consulting AI Framework — Gap Closure

> Close the 153 V1 gaps identified in the PRD-to-codebase gap analysis across 9 domains, incorporating PRD Addendum v1 (Intelligence Layer Architecture, April 12, 2026).

## Status

**Active step:** Step 3 — Deep-dives (Phases 11, 2, 6)
**Last updated:** 2026-04-13

### Start here (fresh session)

1. Read this file end-to-end. This is the source of truth for status.
2. Read `docs/bef/03-phases/VERIFICATION-STEP-2.md` — verifier verdict and the 7 critical findings carried forward.
3. Read the latest file in `.claude/threads/` for conversation context.
4. Run `/bef:deep-dive 11` when ready to begin Phase 11.

### What's next, in order

1. **Phase 11 deep-dive** (AI Infrastructure Foundation — new). Gates Phases 2 and 6.
   Pre-kickoff gate: lock embedding provider (Voyage `voyage-3-lite` vs. OpenAI `text-embedding-3-small`) via 50-pair quality test.
2. **Phase 2 re-dive** (Harness + Pipelines). Depends on Phase 11.
   Decide whether to split into Phase 2a (harness) / Phase 2b (pipelines).
3. **Phase 6 re-dive** (Five-Layer Org KB). Depends on Phase 11 + Phase 2.
   Resolve `KnowledgeArticle.embedding` migration path before Task 1.

Per-phase deep-dive items live in each phase's `PHASE_SPEC.md` "Outstanding for deep-dive" section. Consolidated inventory in `VERIFICATION-STEP-2.md`:

- **Phase 11:** embedding provider, hybrid retrieval refactor safety, HNSW params, RRF k validation, eval fixture authorship.
- **Phase 2:** TaskType remap, per-pipeline error/escalation, confidence thresholds, freeform agent prompt + tools, transcript sync/async, briefing caching, cost cap, cross-pipeline matrix, 2a/2b split.
- **Phase 6:** KA.embedding migration, rename-collision fixture, managed-package override UX, domain proposal threshold, Org Health cost ceiling UX, Managed Agents progress/polling, edge circular-ref detection.
- **Phase 4:** Add 6 SF dev guardrails to story generation prompts (GAP-WORK-006 — blocks Phase 5/6).
- **Phase 3, 5, 7, 8, 9:** see `VERIFICATION-STEP-2.md` outstanding inventory.

### Quick fixes (do anytime, ~5 min each)

- Add Phase 6 → Phase 5 visual edge to the dependency graph in `docs/bef/02-phase-plan/PHASE_PLAN.md` (textual dep is correct; only the ASCII arrow is missing).
- Phase 4 deep-dive must add 6 SF dev guardrails to story-generation prompts (GAP-WORK-006). Blocks Phase 5/6 from delivering full developer context.

## Recently Completed

- **Step 2 — Phase refactor + verification** (2026-04-13). All 11 phases reflect addendum scope. TECHNICAL_SPEC.md rewritten post-addendum. 4 parallel verifiers cross-checked PRD + addendum vs. all artifacts. ~245 atomic requirements verified, zero mismatches. Verdict: PROCEED to Step 3. Consolidated report: `docs/bef/03-phases/VERIFICATION-STEP-2.md`. 7 critical findings carried into Step 3 (Phase 4 dev guardrails, KA.embedding migration, embedding provider gate, brownfield scratch-org warning UX, PHASE_PLAN graph edge, Phase 2 split decision, 6 minor PRD-mention gaps).
- **Step 1 — Addendum integration plan** (2026-04-12). Plan now archived at `archive/ADDENDUM-INTEGRATION-PLAN.md` (superseded by Step 2 execution).
- **Phase 1 execution** (complete before addendum). 14/14 RBAC tasks done.

## Pipeline Progress

> Stage 5 shows "In Progress" because Phase 1 executed before the PRD Addendum v1 triggered the Step 2 refactor. Stages 4–5 are now blocked on Phase 11 / 2 / 6 deep-dives completing.

- [x] Stage 1: PRD — Complete (existing: `docs/bef/00-prd/PRD.md` + addendum `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`)
  - [x] Step 1: Write addendum integration / phase refactor plan (archived at `archive/ADDENDUM-INTEGRATION-PLAN.md`)
- [x] Stage 2: Architecture — Complete. Addendum integrated into `docs/bef/01-architecture/TECHNICAL_SPEC.md`.
  - [x] Step 2 (arch portion): Integrate addendum into `docs/bef/01-architecture/TECHNICAL_SPEC.md`
- [x] Stage 3: Phase Plan — Complete. All 11 phases reflect addendum; verifier sweep produced `docs/bef/03-phases/VERIFICATION-STEP-2.md` with verdict to proceed.
  - [x] Step 2 (phase-plan portion): Execute integration plan across `docs/bef/03-phases/*` + 4-verifier agent team sweep — verdict: PROCEED with 7 critical findings carried into Step 3
- [ ] Stage 4: Phase Deep Dive — Incomplete (re-deep-dive into phases that need it due to refactoring from addendum)
  - [ ] Step 3: Deep-dive sessions for affected phases (Phase 11 new, Phase 2 re-dive, Phase 6 re-dive)
  - [ ] Step 4: Agent team verification of all deep-dive specs against PRD + addendum
- [ ] Stage 5: Execute — In Progress (Phase 1 complete)
  - [ ] Step 5: Execute phase code with agent teams (wave-based, per phase)
  - [ ] Step 6: Iterate until shipped

## Phase Overview

> Phase plan is locked through Step 2 verification (2026-04-13). Phases 2, 6, 11 still need Step 3 deep-dives before execution; other phases are deep-dived but may receive small adjustments based on deep-dive outcomes.

| # | Phase | Depends On | Gaps | Spec | Tasks | Execution |
|---|-------|-----------|------|------|-------|-----------|
| 1 | RBAC, Security, Governance | None | 16 | Done | Done (14 tasks) | 14/14 done |
| 11 | AI Infrastructure Foundation | Phase 1 | New | Scaffolded (deep-dive pending) | Scaffolded (10 tasks) | Not Started |
| 10 | Work Tab UI Overhaul | Phase 1 | — | Done | Done (12 tasks) | Not Started |
| 2 | Harness Hardening + Core Pipelines | Phase 11 | 10+ | Populated from integration plan (re-dive pending) | Populated (17 tasks) | Not Started |
| 3 | Discovery, Questions | Phase 2 | 14 | Amended per addendum | Done (14 tasks) | Not Started |
| 4 | Work Management | Phase 2, 3 | 11 | Amended per addendum | Done (10 tasks) | Not Started |
| 6 | Org, Knowledge (Five-Layer Model) | Phase 11, 2 | 16+ | Populated from integration plan (re-dive pending) | Populated (34 tasks) | Not Started |
| 5 | Sprint, Developer API | Phase 4, 6 | 14 | Amended per addendum | Done (14 tasks) | Not Started |
| 7 | Dashboards, Search | Phase 3, 4, 5, 6 | 26+3 | Amended per addendum | Done (16 tasks) | Not Started |
| 8 | Documents, Notifications | Phase 1, 2, 7 | 21 | Amended per addendum | Done (10 tasks) | Not Started |
| 9 | QA, Jira, Archival, Lifecycle | Phase 1, 4, 8 | 22 | Reviewed per addendum | Done (11 tasks) | Not Started |

## Bug Tracking

| Metric | Value |
|--------|-------|
| **Total Bugs** | 0 |
| **Open** | 0 (Critical: 0, High: 0, Medium: 0, Low: 0) |
| **Fixed** | 0 |
| **Bug Index** | docs/bef/04-bugs/BUGS.md |
| **Execution Plan** | docs/bef/04-bugs/BUG-EXECUTION-PLAN.md |
| **Active Bug Phase** | None |
| **Next Bug ID** | BUG-001 |

### Bug Detailer Config

| Setting | Value |
|---------|-------|
| **Dev Server** | _not configured_ |
| **App URL** | _not configured_ |
| **Auth Required** | _not configured_ |
| **Auth Credentials** | _stored in .env.local_ |

> Bug config is populated on first run of `/bef:bug-detail`.
> Run `/bef:bug-detail` to investigate bugs, `/bef:bug-triage` to plan fixes,
> `/bef:bug-execute` to dispatch parallel fix agents.

## Replan Log

| Date | Summary |
|------|---------|
| 2026-04-09 | BEF adopted. 9 gap analysis domains mapped to BEF phases. Phase 1 refined spec migrated to BEF format. Phases 2-9 have gap reports only, awaiting deep-dive refinement. |
| 2026-04-10 | Phase 2 deep-dive complete. 10 tasks from 10 gaps (3 gaps moved: GAP-001→Phase 8, GAP-002→Phase 5 as direct function, GAP-005→Phase 1 duplicate). Rate limit notifications deferred to Phase 8. |
| 2026-04-10 | Phase 8 deep-dive complete. 9 tasks from 21 gaps (consolidated). GAP-DOCS-007 (inline preview) deferred to V2. HEALTH_SCORE_CHANGED sender deferred to Phase 7. Received status report template + rate limit notifications from Phase 2. |
| 2026-04-10 | Phase 9 deep-dive complete. 11 tasks from 22 gaps (2 resolved, 1 deferred). GAP-ARCH-004 (reactivation fork-and-inherit) deferred to V2. GAP-JIRA-003 and GAP-JIRA-004 confirmed resolved. |
| 2026-04-10 | Phase 3 deep-dive complete. 13 tasks from 14 gaps. REVIEWED replaced with IMPACT_ASSESSED. Two impact assessment Inngest functions unified into one with conflict detection + downstream actions. Gap detection and readiness assessment are new L-complexity AI tasks. |
| 2026-04-10 | Phase 4 deep-dive complete. 9 tasks from 11 gaps (2 resolved: GAP-WORK-007 by Phase 1 REQ-RBAC-009, GAP-WORK-009 absorbed into GAP-WORK-001). Key deliverables: DRAFT->READY validation gate, test case stub generation pipeline, dual-mode OrgComponent selector, Salesforce guardrails in AI prompts. |
| 2026-04-10 | Phase 5 deep-dive complete. 12 tasks from 14 gaps (all addressed). GAP-SPRINT-009 (NLP org query) scoped as keyword translation with Phase 6 semantic enhancement hook. GAP-SPRINT-013 resolved by updating docs to match key-derived routing (not changing code). GAP-SPRINT-014 addressed by harness integration refactor. Key deliverables: capacity assessment, parallelization groups, developer attribution, full context package, org query + component report endpoints, API key expiry/rotation, brownfield warning. |
| 2026-04-10 | Phase 6 deep-dive complete. 13 tasks from 15 gaps (1 deferred, 4 consolidated). GAP-ORG-009 (Org Health Assessment, XL) deferred to V2 — no downstream blockers. NLP org query uses 3-tier approach (regex → full-text → semantic). Agent staleness as DB-only post-loop scan. Article confirmation: confirmed-only for Claude Code, unconfirmed-with-disclaimer for internal AI. |
| 2026-04-10 | Phase 7 deep-dive complete. 15 tasks from 29 gaps (25 addressed, 4 deferred to V2). Deferred: GAP-DASH-008 (AI milestone summaries), GAP-DASH-018 (Inngest event volume), GAP-DASH-020 (semantic search expansion), GAP-DASH-023 (dependency chain visualization). Health score fully rewritten from weighted percentage to PRD signal counter. Search expanded with tsvector for 3 new entity types. Absorbed Phase 1 deferred gaps: RBAC-010 (Usage & Costs), RBAC-014 (audit logging), RBAC-016 (cost caps). Stage 4 complete — all 9 phases specced. |
| 2026-04-10 | Phase 10 added: Work Tab UI Overhaul. Scope: shared component library (PageHeader, DetailPageLayout, FilterBar, StatusBadge, ProgressBar, EditableField, MetadataSidebar, StatCard), Work overview redesign with "All Stories" view, Epic/Feature/Story detail page overhauls to two-column layout, kanban enhancements (swimlanes, richer cards, quick actions). Depends on Phase 1. Recommended to run second (after Phase 1, before Phases 2-9) so new features get built into correct patterns. XL complexity. |
| 2026-04-13 | PRD Addendum v1 (Intelligence Layer Architecture) incorporated. Addendum supersedes PRD §6 (AI Agent Harness) and §13 (Org Knowledge Base). Pipeline-first architecture replaces generic agent harness. Five-layer org knowledge model replaces flat structure. Cross-cutting additions: model router module, hybrid retrieval primitive (BM25+vector RRF), formal eval harness (V1 requirement), per-entity embedding tables, component_edges schema. Phase 11 added (AI Infrastructure Foundation). Phase 2 renamed to "Harness Hardening + Core Pipelines" and requires full re-dive. Phase 6 requires full re-dive for five-layer model. Phases 3, 4, 5, 7, 8 require spec updates only. Phase 5 now depends on Phase 6 (search_org_kb needed for Context Package Assembly). Execution order revised accordingly. See `archive/ADDENDUM-INTEGRATION-PLAN.md` (archived). |
| 2026-04-13 | Layer 5 identity reconciled. TECHNICAL_SPEC.md §6.1 was wrong (listed Layer 5 as Org Health Assessment); PRD Addendum v1 §4.1 and §4.6 lock Layer 5 as Query & Retrieval Interface (`search_org_kb`). Org Health Assessment reclassified as a parallel Managed Agents workload per Addendum §4.8. Phase 6 PHASE_SPEC.md was already correct; TECHNICAL_SPEC.md §6.1 table and the "locked points" bullet in §1 updated to match. |
| 2026-04-13 | Step 2 phase-docs pass complete. Phase 11 scaffolded (10 tasks). Phase 2 spec rewritten — 10 harness tasks preserved + 4 pipelines + freeform agent + model router retrofit + eval extension (17 tasks total; pre-addendum spec retained as PHASE_SPEC.pre-addendum.md). Phase 6 spec rewritten — five layers, sync reconciliation, Org Health Assessment restored from V2, schema migrations for DomainGrouping/BusinessContextAnnotation/OrgComponent.embedding (34 tasks total; pre-addendum spec retained). Phases 3, 4, 5, 7, 8 received targeted "Addendum v1 Amendments" sections with new tasks wiring UI to pipelines and embedding enqueue. Phase 9 received review-only note on test-case-gen alignment with Story Generation Pipeline output. Phase 5 dependencies header now includes Phase 6. All outstanding decisions flagged in per-phase "Outstanding for deep-dive" sections for Step 3 agenda. Architecture docs (01-architecture) still need addendum integration. |
| 2026-04-13 | Step 2 architecture pass complete. TECHNICAL_SPEC.md fully integrated with addendum (pipeline-first harness, five-layer org KB, 11 new schema entities, model router, hybrid retrieval, eval harness). Layer 5 identity (Query Interface vs. Org Health) reconciled across architecture and phase docs. |
| 2026-04-13 | Step 2 verification sweep complete. Four parallel verifier agents cross-checked PRD (27 §) + Addendum v1 (10 §) vs. PHASE_PLAN.md, all 11 phase folders (PHASE_SPEC + TASKS), and TECHNICAL_SPEC.md. ~245 atomic requirements verified. Verdict: PROCEED to Step 3. Zero MISMATCHes (no phase contradicts PRD/addendum). All 11 schema entities, 4 pipelines, 5 org KB layers, 14 notification types, 8 locked decisions, 6 personas individually accounted for. Phase ordering compliant with Addendum §6. 7 critical findings carried into Step 3: Phase 4 dev guardrails escalation (GAP-WORK-006), KA.embedding migration, embedding provider gate, brownfield scratch-org warning UX, PHASE_PLAN graph edge fix, Phase 2 split decision, 6 minor PRD-mention gaps. Per-verifier matrices in `docs/bef/03-phases/verification/`. Consolidated report at `docs/bef/03-phases/VERIFICATION-STEP-2.md`. |
