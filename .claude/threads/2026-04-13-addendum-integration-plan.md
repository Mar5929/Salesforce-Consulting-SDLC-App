# Thread: Addendum Integration Plan Execution

**Date:** 2026-04-13
**Scope:** Step 2 of the Steps to Ship — translate `docs/bef/ADDENDUM-INTEGRATION-PLAN.md` into the BEF file structure so every phase reflects post-addendum scope.

---

## What Was Delivered

### Phase spec work (via 4 parallel agents)

| Phase | Action | Result |
|-------|--------|--------|
| 11 (new) | Scaffold | `phase-11-ai-infrastructure/` created. 10 tasks. Covers: schema additions, model router, hybrid retrieval primitive (audit-first of `global-search.ts`), embedding infrastructure, eval harness scaffold. Outstanding: embedding provider (Voyage vs. OpenAI), RRF k tuning, embedding migration strategy. |
| 2 | Rewrite | 10 REQ-HARNESS tasks preserved. 4 pipelines + freeform agent + model router retrofit + eval extension added. 17 tasks total. Pre-addendum spec backed up as `PHASE_SPEC.pre-addendum.md`. |
| 6 | Rewrite | Five layers (Graph, Embeddings, Domains, Annotations, Query), sync reconciliation algorithm, Org Health Assessment restored from V2, schema migrations for `DomainGrouping` → `domains`, `BusinessContextAnnotation` → `annotations`, `OrgComponent.embedding` → `component_embeddings` table. 34 tasks. Pre-addendum spec backed up. |
| 3 | Amend | "Addendum v1 Amendments" section: Answer Logging Pipeline as answer-submission path; question embeddings via Phase 11. +1 task. |
| 4 | Amend | Story Generation Pipeline routing; story embeddings; mandatory field validation inside pipeline. +1 task. |
| 5 | Amend | Context Package Assembly 9-step rewrite per Addendum §4.6 (<3s p95, 1 LLM call, 20k token budget); Phase 6 added as dependency; sprint health briefing via pipeline. +3 tasks (including CPA eval fixtures added in reviewer fix-up). |
| 7 | Amend | Briefing Pipeline routing; deterministic SQL metrics confirmed; `search_project_kb` as substrate. +1 task. |
| 8 | Amend | `pending_review` + `conflicts_flagged` notification wiring. +1 task. |
| 9 | Review-only | Test case generation alignment with Story Generation Pipeline output. No new tasks. |

### Reviewer agent verification (4 parallel agents)

1. **PRD+Addendum coverage reviewer** — ~50 requirements analyzed. ~44 fully covered. 4 orphans surfaced and patched in fix-up pass: `agent_conversations`/`agent_messages` ambiguity, domain review nudge, rename-collision fixture ownership, Context Package Assembly + Briefing eval fixture ownership.
2. **Dependency-graph reviewer** — 9 of 11 phases consistent. 2 mismatches patched: Phase 4 (`Phase 1, 3` → `Phase 2, 3`), Phase 8 (`Phase 1` → `Phase 1, 2, 7`). Normalized Phase 7 + 9 listings across PROJECT_STATE and PHASE_PLAN.
3. **Outstanding-decision reviewer** — All 12 outstanding decisions captured in owning phase specs. No missing.
4. **Architecture-docs audit** — TECHNICAL_SPEC.md requires major revision (§3 harness rewrite, §8 search rewrite, §6 brownfield rewrite, +§10 model router, +§11 eval harness, new schema entities in §2). Estimate: **14–20 hours, multi-session**.

### Reviewer fix-ups applied (1 agent)

- Phase 4 header deps corrected
- Phase 8 header deps corrected
- PROJECT_STATE + PHASE_PLAN dependency listings normalized
- Phase 6: rename-collision fixture ownership note; domain review nudge task appended
- Phase 5: Context Package Assembly eval fixtures (10 labeled, brownfield + greenfield + high-component-count) now owned
- Phase 2: Briefing pipeline fixtures (10 labeled, covering all 6 briefing types) now owned; agent persistence clarified to reuse existing `Conversation`/`ChatMessage`/`ConversationType` per integration plan §399

---

## Files Touched

- `docs/bef/PROJECT_STATE.md` — Phase Overview spec statuses, Current Focus, Replan Log entry
- `docs/bef/02-phase-plan/PHASE_PLAN.md` — Phase 4 + Phase 8 dependency corrections
- `docs/bef/03-phases/phase-11-ai-infrastructure/` — new: `PHASE_SPEC.md`, `TASKS.md`
- `docs/bef/03-phases/phase-02-agent-harness/PHASE_SPEC.md` + `TASKS.md` — rewritten; originals backed up
- `docs/bef/03-phases/phase-06-org-knowledge/PHASE_SPEC.md` + `TASKS.md` — rewritten; originals backed up
- `docs/bef/03-phases/phase-03-discovery-questions/PHASE_SPEC.md` + `TASKS.md` — amended
- `docs/bef/03-phases/phase-04-work-management/PHASE_SPEC.md` + `TASKS.md` — amended
- `docs/bef/03-phases/phase-05-sprint-developer/PHASE_SPEC.md` + `TASKS.md` — amended
- `docs/bef/03-phases/phase-07-dashboards-search/PHASE_SPEC.md` + `TASKS.md` — amended
- `docs/bef/03-phases/phase-08-docs-notifications/PHASE_SPEC.md` + `TASKS.md` — amended
- `docs/bef/03-phases/phase-09-qa-jira-archival/PHASE_SPEC.md` — review-only amendment
- `.claude/plans/reactive-greeting-toucan.md` — plan file

---

## What Remains for Step 2

**Architecture docs integration** — `docs/bef/01-architecture/TECHNICAL_SPEC.md` (2,590 lines) still reflects pre-addendum design:
- §3 (three-layer harness) → rewrite as four pipelines + one freeform agent
- §2 schema → add 14+ new tables, rewrite DomainGrouping/BusinessContextAnnotation/OrgComponent.embedding
- §6 (brownfield) → rewrite for five-layer model + sync reconciliation + Org Health
- §8 (search) → rewrite for hybrid retrieval primitive
- §4 (context window) → re-key by pipeline stage; add Context Package Assembly
- Add §10 (model router), §11 (eval harness)
- Amendments to §5 (dashboards), §7 (Inngest), §1 (decisions), §9 (remaining items), README

Estimated 14–20 hours across 3 sessions. Recommend:
- Session A: §3 rewrite + §8 rewrite
- Session B: §2 schema work + §6 rewrite
- Session C: §4 rewrite + §10/§11 adds + cleanup

---

## Step 3 Agenda (Deep-Dives)

Each populated/scaffolded spec has an "Outstanding for deep-dive" section. Consolidated agenda:

**Phase 11 deep-dive**
- Embedding provider: Voyage AI `voyage-3-lite` vs. OpenAI `text-embedding-3-small` (run 50-pair quality test first)
- RRF k constant tuning (default k=60)
- Embedding migration strategy (dual-write window, incremental re-embedding)

**Phase 2 deep-dive** (sequence after Phase 11 — embedding provider must be documented in TECHNICAL_SPEC.md first)
- Orphan TaskType enum re-mapping: `QUESTION_ANSWERING`, `STORY_ENRICHMENT`, `STATUS_REPORT_GENERATION`, `DOCUMENT_GENERATION`, `SPRINT_ANALYSIS`, `CONTEXT_PACKAGE_ASSEMBLY`, `ORG_QUERY`, `DASHBOARD_SYNTHESIS`, `ARTICLE_SYNTHESIS` — fold, route, or deprecate each
- Per-pipeline error/escalation behavior details
- Confidence threshold calibration for auto-apply (V1 default 0.85)
- Freeform agent additional read tool candidates

**Phase 6 deep-dive**
- Embedding migration window + dual-write
- Rename-collision edge-case fixture (per Addendum §8.F)
- Managed-package exclusion override UX
- `KnowledgeArticle.embedding` fate: retain inline / migrate / deprecate
- Domain proposal confidence threshold (start: manual-review-all)
- Org Health Assessment cost ceiling override UX ($25 default)

---

## Key Decisions Made This Session

1. **Documentation-only scope.** This session produced specs and plan updates — no code.
2. **Pre-addendum specs preserved.** Phase 2 and Phase 6 rewrites backed up as `*.pre-addendum.md` for reference.
3. **Architecture docs deferred.** The 14–20hr TECHNICAL_SPEC.md rewrite is the clear next block of work for Step 2. Recommend separate multi-session effort.
4. **Rename-collision fixture moved from Phase 3 to Phase 6.** Integration plan §425 incorrectly assigned it to Phase 3; this is org-sync behavior, belongs in Phase 6.
5. **Eval fixture ownership locked.**
   - Transcript Processing + Answer Logging → Phase 11 (scaffolded with 10 each)
   - Story Generation → Phase 2 (15 fixtures)
   - Briefing/Status → Phase 2 (10 fixtures, 6 types)
   - Context Package Assembly → Phase 5 (10 fixtures)
6. **Freeform agent persistence model locked.** Reuse existing `Conversation` / `ChatMessage` / `ConversationType` models from `prisma/schema.prisma`. No new top-level table unless agent-specific metadata demands it.
