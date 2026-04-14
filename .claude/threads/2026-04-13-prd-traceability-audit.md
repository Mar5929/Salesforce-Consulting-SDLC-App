# Session: PRD Traceability + Developer-Readiness Audit
**Date:** 2026-04-13
**Status:** Audit complete. Wave 0 decisions locked. Ready to dispatch Wave 1 fix agents.

## What happened this session

User asked: "scan all deep-dived phases, map them to PRD + Addendum, ensure no gaps/discrepancies, and produce one fix plan per phase for agents to execute later."

Built a structured audit:

1. **Task 1 — Requirement Index.** Subagent produced `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md` with 442 atomic requirement rows (311 PRD + 131 Addendum), stable IDs (`PRD-x-yy`, `ADD-x-yy`), supersedes mapping, phase-hint column. Row count exceeds target 200-260 because of aggressive atomization in PRD §5 (entities) and Addendum pipeline stages. Every row is independently verifiable. User approved keeping it dense.
2. **Task 2 — Audit template.** `_TEMPLATE_phase-audit.md` with 6 sections: header, scope map, R1-R8 rubric scorecard, gaps, fix plan, sign-off checklist.
3. **Task 3 — Per-phase audits ×10 (parallel).** Phase 1 excluded per user scope decision. Ten subagents dispatched in parallel, each producing `phase-NN-audit.md`.
4. **Task 4 — Cross-phase consolidation.** Subagent produced `CROSS_PHASE_SUMMARY.md` (300 lines) with executive summary, readiness matrix, 25-blocker roll-up, 8 cross-phase contradictions (6 auto-resolvable via Addendum-wins, 2 user decisions), orphan requirements, recurring patterns, wave-based execution order.
5. **Wave 0 decisions.** User delegated all 10 to me ("go all"). Recorded in `AUDIT_DECISIONS.md`.

## Audit results

- **Verdicts:** 0 Ready, 4 Ready-after-fixes (3, 6, 10, 11), 6 Not-ready (2, 4, 5, 7, 8, 9).
- **Gaps:** 137 total — 25 Blocker, 82 Major, 30 Minor.
- **Cross-phase contradictions:** 8 flagged; all resolved in `AUDIT_DECISIONS.md`.

## Key decisions locked (see `AUDIT_DECISIONS.md` for full detail)

1. Create `agent_conversations` + `agent_messages` tables (Addendum wins over TECHNICAL_SPEC).
2. Hardcode `vector(512)` across 7 embedding tables in V1.
3. Run Voyage 50-pair quality test before Phase 11 executes.
4. Build PDF document preview in Phase 8 V1 (no V2 deferral).
5. Build `KnowledgeArticle.embedding` in Phase 6 V1.
6. Phase 10 owns Tasks-tier UI; Phase 4 retains data/workflow.
7. Phase 8 builds BRD, SDD, Client Deck templates.
8. Orphan requirement owners per `CROSS_PHASE_SUMMARY.md` §5.
9. Firm-wide cost cap: advisory in V1 (not blocking).
10. Phase 9 owns `assertProjectWritable` helper; Phases 2, 4, 8 consume.

## Artifacts written

In `docs/bef/audits/2026-04-13/`:
- `REQUIREMENT_INDEX.md` (user flagged this to preserve past the audit; wants it moved to PRD folder or bef top-level)
- `_TEMPLATE_phase-audit.md`
- `phase-02-audit.md` through `phase-11-audit.md` (10 files)
- `CROSS_PHASE_SUMMARY.md`
- `AUDIT_DECISIONS.md`

Also updated `docs/bef/PROJECT_STATE.md` Status section + Recently Completed entry.

## Open items from earlier session notes (PROJECT_STATE "Ephemeral files")

User left notes in PROJECT_STATE §"Ephemeral files that will eventually be deleted":
- `REQUIREMENT_INDEX.md` should be moved to the PRD folder or made a bef top-level file (user liked it)
- Uncertain whether `docs/bef/02-phase-plan/GAP-ANALYSIS-INDEX.md` is still needed
- Other `docs/bef/audits/*` and `docs/bef/03-phases/verification/*` files can be deleted once planned/implemented

Did not act on these during this session — confirm with user before moving/deleting.

## Wave 1 completed (2026-04-14)

Two parallel fix agents in isolated worktrees; both merged to `main` after review.

- `15ba83e audit-fix(phase-11): apply 13 gap fixes per phase-11-audit.md (cites DECISION-01/02/03)`
- `895d58d audit-fix(phase-02): apply 18 gap fixes per phase-02-audit.md (cites DECISION-01/08/09/10)`
- `73c3196` merge commit

P11 edits: `phase-11-ai-infrastructure/PHASE_SPEC.md`, `TASKS.md`, `TECHNICAL_SPEC.md` §5.3/§8.5, and `phase-11-audit.md` (now tracked). P2 edits: `phase-02-agent-harness/PHASE_SPEC.md`, `TASKS.md`. No file overlap.

### Carry-forward decisions (made 2026-04-14 after Wave 1 agent reports)

These are supplemental to `AUDIT_DECISIONS.md`. Not added to that file because they flow directly from existing decisions; they are captured here so Wave 2 dispatch can proceed without re-asking.

1. **Voyage 50-pair test gating Phase 11**: DECISION-03 stands. The 2-3 day corpus-synthesis cost is accepted. No formal Addendum waiver. Phase 11 execution blocks on test completion.
2. **`search_org_kb` return type is `SearchResponse` (not `SearchHit[]`)**: Per P11 GAP-13 fix. Has `_meta.not_implemented` envelope. All callers must branch on that envelope, not array length. Apply in Wave 2 Phase 6 (source) and any Phase 2 rework that touches the caller surface.
3. **`article_entity_refs` table is owned by Phase 6**: Phase 2 staleness hook (Task 11/12) references it. Phase 6 fix-agent prompt must include an explicit requirement to create/confirm this table or Phase 2 cannot land.
4. **Briefing-type mapping for Current Focus / Recommended Focus**: Agent selected the audit's preferred path — reuse `daily_standup → Current Focus` and `weekly_status → Recommended Focus`. No new mini-types added. Phase 7 fix-agent prompt (Wave 3) must consume this mapping; do not add `current_focus` / `recommended_focus` enum values.
5. **`assertProjectWritable` publish/consume ordering**: DECISION-10 already assigned Phase 9 as publisher. This is an execution-time ordering concern (Phase 9 executes before Phase 2), not a spec change. No action needed in any fix wave.

## Wave 2 completed (2026-04-14)

Three parallel fix agents in isolated worktrees; all merged to `main` with `--no-ff` merge commits.

- `253c0ed audit-fix(phase-03): apply 15 gap fixes per phase-03-audit.md (cites DECISION-01)` → merge `9651181`
- `51faeb3 audit-fix(phase-04): apply 13 gap fixes per phase-04-audit.md (cites DECISION-06/08/10)` → merge `0de3565`
- `a9ff4b7 audit-fix(phase-06): apply 20 gap fixes per phase-06-audit.md (cites DECISION-02/05/08/10)` → merge `e3d2342`

48 gaps closed. No file overlap between branches. ff-only not possible (main had advanced to `4e02777`); non-ff merges clean.

### Wave 2 agent-report flags (to carry into Wave 3 / verification)

1. **Phase 3 — no dedicated DECISION ID for pipeline-first listener collapse.** The audit's GAP on `questionImpactFunction → QUESTION_IMPACT_COMPLETED` listener is a Wave 0 contradiction (CROSS_PHASE_SUMMARY §A) that flows from Addendum §2 Addendum-wins but has no explicit `DECISION-nn`. Agent cited "DECISION-01 derivation + Addendum §2." If a formal ID is wanted, mint it before Wave 3.
2. **Phase 3 — DECISION-03 (Voyage 50-pair test) extended as a Phase 3 merge gate.** Agent reasoned: Phase 3 enqueues embeddings consumed by Phase 11, so the shared embedding path is gated too. Confirm this extension (or narrow to Phase 11 only).
3. **Phase 4 — OQ-1: `KnowledgeArticle.source = 'PHASE_4_BOOTSTRAP'` enum extension.** Phase 4 spec adds the enum value; Phase 6 owns the `KnowledgeArticle` schema. Phase 6 agent did not reconcile. Wave 3 / Phase 6 final review must absorb the enum addition.
4. **Phase 4 — OQ-2: attachment storage backend (Vercel Blob vs S3) deferred to Phase 8 coordination.** Phase 8 agent prompt (Wave 3) should resolve.
5. **Phase 4 — OQ-3: `runStoryGenerationPipeline` import path pending.** Shape is pinned; path finalizes when Phase 2 execution lands.
6. **Phase 6 — `knowledge_article_embeddings` owned by Phase 6 (not Phase 11).** Agent took the "own in Phase 6" branch because Phase 11 scope is closed. Phase 11 gets a schema reconciliation note in Phase 6 Task 5 but no direct edit.
7. **Phase 6 — polymorphic integrity on `article_entity_refs` implemented as BEFORE INSERT/UPDATE trigger** (Postgres can't enforce cross-table CHECK). Matches the audit's parenthetical fallback.
8. **Phase 6 — all embedding columns corrected to `vector(512)`** per DECISION-02 where pre-existing text said `vector(1536)`.

### Recommendations on the 8 Wave 2 flags (resolve before or during Wave 3 dispatch)

1. **Flag 1 — no DECISION ID for pipeline-first listener collapse.**
   **Recommendation: mint `DECISION-11` in `AUDIT_DECISIONS.md`.** One-liner: "Phase 3 `questionImpactFunction` collapses into a `QUESTION_IMPACT_COMPLETED` event listener; pipeline owns impact analysis per Addendum §2 (Addendum-wins)." Then patch the Phase 3 PHASE_SPEC / TASKS citations from "DECISION-01 derivation + Addendum §2" to `DECISION-11`. Reason: future verifier agents cite by ID; derivation logic rots.
2. **Flag 2 — DECISION-03 extended as a Phase 3 merge gate.**
   **Recommendation: accept.** Phase 3 enqueues embeddings consumed through the Phase 11 embedding pipeline, so the 50-pair quality test must pass before either ships. Add a one-sentence clarification to `AUDIT_DECISIONS.md` DECISION-03: "Gate applies to any phase that enqueues via `embeddings.enqueue` — Phase 3 + Phase 6 + Phase 4." No spec edits needed.
3. **Flag 3 — `KnowledgeArticle.source = 'PHASE_4_BOOTSTRAP'` enum addition.**
   **Recommendation: Wave 3 Phase 6 wrap-up agent (or a standalone 5-minute fix) absorbs the enum value into Phase 6's `KnowledgeArticle` schema task.** Phase 4 consumes it; Phase 6 owns the schema. Cross-reference the Phase 4 Task 14 bootstrap AC. Do NOT let Phase 4 migration add the enum — that splits schema ownership.
4. **Flag 4 — attachment storage backend (Vercel Blob vs S3).**
   **Recommendation: decide before Phase 4 execution, not during Wave 3 spec pass.** Phase 8 doesn't own attachment storage (it owns document generation). Better owner is Phase 1 (infra) or Phase 4 (first consumer). My call if pressed: Vercel Blob for V1 — zero-config with Next.js, good enough for < 50 GB, migrate to S3 when scale demands. Document the decision as DECISION-12 when you make it.
5. **Flag 5 — `runStoryGenerationPipeline` import path pending Phase 2 execution.**
   **Recommendation: leave as-is.** Shape is pinned; path resolves mechanically at execution time. Not a spec gap.
6. **Flag 6 — `knowledge_article_embeddings` owned by Phase 6.**
   **Recommendation: accept.** Phase 11 scope is closed (Wave 1 already merged). Schema reconciliation note in Phase 6 Task 5 is the right mechanism. No action.
7. **Flag 7 — Phase 6 polymorphic integrity via trigger instead of CHECK.**
   **Recommendation: accept.** Postgres can't do cross-table CHECK; trigger is the canonical pattern. No action.
8. **Flag 8 — `vector(512)` corrections in Phase 6.**
   **Recommendation: accept.** Matches DECISION-02. No action.

### Pre-Wave-3 checklist (derived from flags)

- [ ] Mint `DECISION-11` (flag 1) and patch Phase 3 citations.
- [ ] Amend `DECISION-03` scope note (flag 2).
- [ ] Decide attachment storage backend → `DECISION-12` (flag 4). Optional pre-Wave-3; can defer to Phase 4 execution.
- [ ] Queue a Phase 6 enum-absorption micro-task for the Wave 3 Phase 6 touch-up (flag 3). Alternative: include as an explicit instruction in the Wave 3 Phase 8 agent prompt since Phase 8 also touches KnowledgeArticle.

## Wave 3 completed (2026-04-14)

Five parallel fix agents; 58 gaps closed. Phase 5 + Phase 8 in isolated worktrees (merged with `--no-ff`); Phase 7 + Phase 9 + Phase 10 agents committed directly on `main` (worktree isolation unexpectedly did not take effect for those three — resulting history is still clean linear on main before the two merge commits).

- `dd6b5de audit-fix(phase-09): apply 13 gap fixes per phase-09-audit.md (cites DECISION-08, DECISION-10)` (direct on main)
- `a086464 audit-fix(phase-10): apply 11 gap fixes per phase-10-audit.md (cites DECISION-06)` (direct on main)
- `5351627 audit-fix(phase-07): apply 10 gap fixes per phase-07-audit.md (cites DECISION-05/08/09)` (direct on main)
- `785e692 docs(audits): mint DECISION-11 + amend DECISION-03 scope (Wave 3 prep)` (pre-dispatch)
- `7f72017 audit-fix(phase-05): apply 12 gap fixes per phase-05-audit.md (cites DECISION-05/08/10)` → merge `152e611`
- `09dc21b audit-fix(phase-08): apply 12 gap fixes per phase-08-audit.md + P6 enum absorption (cites DECISION-04/07/08/10)` → merge `9caf710`

Pre-Wave-3 checklist execution:
- ✅ `DECISION-11` minted (Phase 3 pipeline listener collapse retro-doc).
- ✅ `DECISION-03` scope amended to cover Phase 3 + 4 + 6 embedding path.
- Deferred: `DECISION-12` (attachment storage backend) — Phase 4 execution time call.
- ✅ Phase 6 enum absorption (Wave 2 flag 3) baked into Phase 8 agent prompt and applied: `KnowledgeArticle.source` gained `'PHASE_4_BOOTSTRAP'` in Phase 6 PHASE_SPEC §2.10 and Task 18 AC.

### Wave 3 agent-report flags (carry into Step 4b verifier sweep)

1. **Phase 5 — 3 cross-phase Open Questions flagged (not deferrals):**
   - Phase 2 `invokeBriefingPipeline` signature + `BriefingType` enum publication (gate for Phase 5 Task 16 / briefings).
   - Phase 1 ownership of `stripSensitiveFields` shared library (currently authored in Phase 5 §2.16 + Task 1a).
   - Phase 2 exact `BRIEFING_REQUESTED` event name for Phase 5 consumer.
2. **Phase 7 — 5 cross-phase Outstanding items** (same Phase 2 / Phase 11 publish gates). Phase 7 handles `_meta.not_implemented = true` envelope gracefully if Phase 11 merges first.
3. **Phase 7 — `event_audit` table added** for PRD-23-12 Inngest event volume; Phase 7 owns per DECISION-08. No Phase 11 schema reconciliation needed.
4. **Phase 7 — em-dash policy tension.** Phase 7 agent converted em dashes to `--` double-hyphens "to match existing file style." Other Wave 3 agents did not globally scrub em dashes. Verifier sweep should pick a rule (strip all vs. leave pre-existing) and apply consistently.
5. **Phase 8 — attachment storage** deferred per thread recommendation to `DECISION-12` / Phase 4 execution.
6. **Phase 8 — Phase 6 reconciliation** applied minimally (one enum value + one cross-ref). No broader Phase 6 edit.
7. **Phase 9 — DECISION-10 consumer wiring deferred** per scope split: Phase 9 publishes `assertProjectWritable`; Phase 2 / Phase 4 / Phase 8 imports land in their own fix waves. Phase 8 Wave 3 agent did add import ACs to Tasks 3, 5, 10, 11, 12. Phase 2 and Phase 4 still need verifier cross-check.
8. **Phase 10 — pre-existing em dashes left in place** by agent. Agent did not introduce new ones. Same policy question as flag 4.

### Worktree process note (Wave 3)

Wave 2 pattern called for all agents in isolated worktrees. In Wave 3, only Phase 5 and Phase 8 agents actually landed on worktree branches; Phase 7, Phase 9, Phase 10 agents committed directly to `main`. Two agents flagged operational recovery (wrote to main first, then reverted and re-applied in worktree). No content is lost, but worktree isolation cannot be relied on in Wave 3 form. For future waves: verify worktree path before agent begins Write calls, or accept direct-on-main commits as the normal pattern and drop worktree isolation.

## Next session: what to do

1. Read `docs/bef/PROJECT_STATE.md` first.
2. Read this thread (Waves 1 + 2 + 3 complete; 8 Wave 3 agent-report flags above).
3. Read `docs/bef/audits/2026-04-13/AUDIT_DECISIONS.md` — 11 locked decisions (DECISION-01 through DECISION-11; `DECISION-03` scope amended).
4. **Active step is Step 4b — Post-gap-closure verifier sweep.** Dispatch verifier agents (pattern: Step 2's 4-verifier team) to cross-check all 10 fixed phases against PRD + Addendum. Verdict must be PROCEED before Stage 5 (execution). Watch specifically for the 8 Wave 3 flags above.
5. After Step 4b verdict, Phase 6 re-dive is the last Stage 4 item before Stage 5 kicks off.
6. Remaining pre-Wave-0 open items: `DECISION-12` (attachment storage — defer to Phase 4 execution unless verifier escalates).
7. Ephemeral-file cleanup items from `PROJECT_STATE.md` Status §"Ephemeral files" are still open (move `REQUIREMENT_INDEX.md`, decide on `GAP-ANALYSIS-INDEX.md`).

### Wave 1 lessons learned (apply to Wave 2/3 dispatch)

- Worktree merge: if an audit file is untracked on main but added by the agent, `git merge --ff-only` aborts. Remove the untracked file on main first, then merge.
- `git worktree remove` fails with untracked/modified files in the worktree (agents copy audit references). Use `--force` after commits are merged.
- Agents respect "do not create Linear tickets" cleanly; keep that rule.

## Discipline notes (user preferences relevant to next session)

- Always update the thread file with decisions as they happen (from `feedback_thread_updates` memory).
- User granted blanket "continue without confirming each step" earlier this session. That grant was for this session's audit work; re-confirm before running Wave 1 fix agents in the next session (they will modify many files).
- User likes concise summaries; no em dashes; no AI-language phrases (per CLAUDE.md writing-style rule).
- Before any fix agent modifies files, follow `linear-ticket-management.md` rule: move referenced Linear tickets to "In Progress" and add a comment.
