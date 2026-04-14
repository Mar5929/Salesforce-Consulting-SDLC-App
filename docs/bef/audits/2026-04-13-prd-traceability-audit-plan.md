# PRD Traceability & Developer-Readiness Audit Plan

> **For agentic workers:** This is an audit plan, not a code-implementation plan. Each task produces an analysis artifact (markdown report). Steps use checkbox (`- [ ]`) syntax for tracking. Use `superpowers:subagent-driven-development` to parallelize Task 3 (per-phase audits) across 11 subagents.

**Goal:** For every deep-dived phase, verify the PHASE_SPEC + TASKS are complete, unambiguous, and traceable to PRD / PRD-Addendum requirements such that a development agent can build the phase and the result will satisfy the PRD. Produce a per-phase gap report + fix plan for any phase that falls short.

**Approach:** (1) Build a canonical requirement index from PRD + Addendum. (2) Run a structured per-phase audit against that index using a fixed rubric. (3) Emit one gap report + one fix plan per phase. Fixes are executed later in a separate pass.

**In-scope phases:** All 11 phases under `docs/bef/03-phases/` (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11). All have populated PHASE_SPEC.md and TASKS.md per PROJECT_STATE.md.

**Authoritative sources:**
- `docs/bef/00-prd/PRD.md`
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` (supersedes PRD §6 and §13)
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (secondary, for cross-check only)
- `docs/bef/03-phases/VERIFICATION-STEP-2.md` (prior verifier findings, do not re-discover)

**Output location:** `docs/bef/audits/2026-04-13/`

---

## Rubric: Developer-Readiness Criteria

Every phase is scored against these 8 criteria. Any "Fail" or "Partial" becomes a gap in the fix plan.

| # | Criterion | Pass definition |
|---|-----------|-----------------|
| R1 | **Requirement traceability** | Every PHASE_SPEC requirement block and every TASKS.md task cites at least one PRD section ID or Addendum §. Any PRD/Addendum requirement that names this phase's subject has a corresponding spec/task. |
| R2 | **No PRD/Addendum contradiction** | No spec or task contradicts a locked Addendum decision (`§2 Newly Locked Decisions`) or a PRD "must/shall" statement. |
| R3 | **Scope completeness** | Every PRD + Addendum requirement in this phase's domain is covered by a task. No requirement is "mentioned but not built." |
| R4 | **Acceptance criteria are testable** | Every task has ACs expressed as verifiable conditions (not "works correctly", "handles errors"). ACs reference concrete inputs, outputs, thresholds, or states. |
| R5 | **Edge cases enumerated** | Each task lists edge cases explicit in the PRD/Addendum (error paths, concurrency, empty/null, rate limits, cost ceilings, auth failures, partial data). Phase 2's per-stage error behavior and Phase 11's cost ceilings are the standard bar. |
| R6 | **Interfaces are pinned** | DB schema, API contracts, event shapes, and cross-phase hand-offs are fully specified (field names, types, nullability). No "TBD", no "see later phase." |
| R7 | **Dependencies resolved** | Every upstream dependency from `PHASE_PLAN.md` is consumed with a concrete interface reference. No task relies on an undefined artifact from another phase. |
| R8 | **Outstanding items closed** | `PHASE_SPEC.md` "Outstanding for deep-dive" section is empty, OR every open item is in `VERIFICATION-STEP-2.md`'s carried-forward list with an owner. |

A phase is **developer-ready** only when R1–R8 are all Pass.

---

## Task 1: Build the Requirement Index

**Purpose:** Produce a single indexed list of atomic requirements from PRD + Addendum. Every downstream phase audit references this index by ID.

**Files:**
- Create: `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`
- Read: `docs/bef/00-prd/PRD.md`
- Read: `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`

- [ ] **Step 1.1** — Read PRD.md end-to-end. For every numbered section and every "must/shall/will" statement, assign a stable ID: `PRD-<section>-<nn>` (e.g., `PRD-6-04`). One row per atomic requirement.
- [ ] **Step 1.2** — Read the Addendum end-to-end. Assign IDs `ADD-<section>-<nn>`. For every Addendum requirement that supersedes a PRD section, add a `Supersedes:` column pointing at the PRD ID.
- [ ] **Step 1.3** — For each requirement row, add a `Phase-hint:` column with the phase(s) where this requirement would naturally live, based on topic (RBAC → 1, pipelines → 2, discovery → 3, etc.). This is a hint, not a binding assignment — the per-phase audit confirms actual coverage.
- [ ] **Step 1.4** — Save to `REQUIREMENT_INDEX.md` with columns: `ID | Source | Section | Requirement (1-line) | Supersedes | Phase-hint`. Include a header section explaining ID scheme and sort order.
- [ ] **Step 1.5** — Sanity-check against `VERIFICATION-STEP-2.md` — the prior sweep verified ~245 atomic requirements. Your index should be in that order of magnitude. If dramatically smaller, you missed rows. If dramatically larger, you are splitting too aggressively.

**Output artifact:** `REQUIREMENT_INDEX.md` with ~200–260 rows.

---

## Task 2: Build the Audit Template

**Purpose:** Lock the exact format every per-phase audit will follow so outputs are comparable and the later fix-execution pass is mechanical.

**Files:**
- Create: `docs/bef/audits/2026-04-13/_TEMPLATE_phase-audit.md`

- [ ] **Step 2.1** — Create the template file with the following sections, in this order:
  1. **Header:** phase number, phase name, auditor, date, commit SHA of phase artifacts audited.
  2. **Scope map:** table of all `REQUIREMENT_INDEX` rows whose `Phase-hint` includes this phase, plus any additional rows this phase claims coverage for. Columns: `Req ID | Requirement | Covered by (spec §/task #) | Status (Pass/Partial/Fail/NotApplicable) | Notes`.
  3. **Rubric scorecard:** one row per R1–R8 with Pass/Partial/Fail + one-line justification.
  4. **Gaps:** numbered list. Each gap has: `ID (PHASE-GAP-nn) | Rubric criterion | Req ID(s) affected | Description | Severity (Blocker/Major/Minor)`.
  5. **Fix plan:** for each gap, a concrete remediation task sized for a single agent. Must include: files to edit, specific sections/task numbers to amend, expected new content summary, and a definition-of-done. No placeholders.
  6. **Sign-off checklist:** R1–R8 boxes + "Fix plan covers every gap" + "No gap is unresolved or deferred."

**Output artifact:** `_TEMPLATE_phase-audit.md`.

---

## Task 3: Per-Phase Audit (×11, parallelizable)

**Purpose:** Apply the template to each phase. Each sub-task is independent and can be dispatched to a fresh subagent.

**Files (per phase N, where N ∈ {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11}):**
- Read: `docs/bef/03-phases/phase-NN-*/PHASE_SPEC.md`
- Read: `docs/bef/03-phases/phase-NN-*/TASKS.md`
- Read: `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`
- Read: `docs/bef/03-phases/VERIFICATION-STEP-2.md` (for already-known carried-forward items)
- Create: `docs/bef/audits/2026-04-13/phase-NN-audit.md`

**Per-phase steps (repeat for each of the 11 phases):**

- [ ] **Step 3.N.1 — Scope mapping.** Copy `_TEMPLATE_phase-audit.md` to `phase-NN-audit.md`. Fill the Scope Map: list every `REQUIREMENT_INDEX` row whose `Phase-hint` includes phase N. Then scan PHASE_SPEC.md + TASKS.md for any additional requirements this phase claims but that weren't hinted — add those rows too.
- [ ] **Step 3.N.2 — Coverage check (R1, R3).** For each Scope Map row, find where PHASE_SPEC or TASKS covers it. Cite the exact §/task #. If nothing covers it, mark Fail. If partially covered (e.g., task exists but missing an AC tied to this requirement), mark Partial with specifics.
- [ ] **Step 3.N.3 — Contradiction check (R2).** Scan for any spec text or task behavior that conflicts with an Addendum "Newly Locked Decision" or a PRD "must/shall." For Phase 2/6/11 specifically, cross-check the Addendum's pipeline-first and five-layer KB model. Record each contradiction as a Fail.
- [ ] **Step 3.N.4 — AC quality check (R4).** Walk every task's acceptance criteria. Flag any AC that uses "works correctly", "handles errors gracefully", "as appropriate", "performs well", or similar unverifiable language. Flag ACs without numeric thresholds where PRD/Addendum specifies one (e.g., confidence ≥ 0.85, p95 latency < 2s, cost ≤ $0.50).
- [ ] **Step 3.N.5 — Edge-case check (R5).** For each task, verify edge cases are enumerated for: error/failure paths, concurrency (if multi-user or async), empty/null inputs, auth boundary (respects RBAC from Phase 1), rate limits/cost ceilings (where PRD-Addendum specifies them), partial/dirty data. Use Phase 2's per-stage error behavior spec and Phase 11's cost ceiling spec as reference bars — other phases should match that level of detail where equivalent risks apply.
- [ ] **Step 3.N.6 — Interface pinning check (R6).** Every DB schema, API endpoint, event shape, and cross-phase artifact must have: field names, types, nullability, and (for APIs) request/response examples. Flag any "TBD", "see X", "details later", or silently missing fields.
- [ ] **Step 3.N.7 — Dependency check (R7).** For each upstream dependency named in `PHASE_PLAN.md`, confirm the phase references a concrete interface (table, endpoint, function signature) defined in the upstream phase's spec. Flag anything that depends on an undefined artifact.
- [ ] **Step 3.N.8 — Outstanding-items check (R8).** Read PHASE_SPEC's "Outstanding for deep-dive" section. Cross-reference `VERIFICATION-STEP-2.md`. Any item still open that isn't tracked in VERIFICATION-STEP-2 is a gap. Any item that's been resolved in the phase but not struck from the Outstanding section is a doc hygiene gap.
- [ ] **Step 3.N.9 — Score the rubric.** Fill the Rubric Scorecard. R1–R8 each get Pass, Partial, or Fail with one-line justification.
- [ ] **Step 3.N.10 — Enumerate gaps.** For every Partial or Fail, create a numbered `PHASE-N-GAP-nn` entry with: rubric criterion, affected Req IDs, description, severity. Severity rules: **Blocker** = phase cannot ship without it (contradicts PRD, undefined interface, missing major requirement); **Major** = phase can start but result won't satisfy PRD without it (missing AC threshold, missing edge case for a PRD-specified condition); **Minor** = doc hygiene, cross-reference, or clarity issue.
- [ ] **Step 3.N.11 — Write the fix plan.** For every gap, write one concrete remediation task. Each task must: (a) name the exact file and section/task # to edit, (b) summarize the new content (not just "add detail" — say what content), (c) specify a definition of done an execution agent can verify. If a gap requires coordination with another phase, call that out explicitly.
- [ ] **Step 3.N.12 — Self-review.** Re-read the audit. Confirm: every Scope Map row has a Status; every gap has a fix task; every fix task has a DoD; no gap uses vague fix language; the scorecard matches the gap list (a Pass cannot have open gaps, a Fail must have at least one Blocker or Major gap).
- [ ] **Step 3.N.13 — Commit.** Commit `phase-NN-audit.md` with message `audit(phase-NN): PRD traceability + developer-readiness audit`.

**Dispatch guidance:** Run the 11 per-phase audits as parallel subagents. Each subagent gets only the files for its phase + the requirement index + the template + `VERIFICATION-STEP-2.md`. Do not share per-phase audits between subagents — they must be independent.

---

## Task 4: Cross-Phase Consolidation

**Purpose:** Find gaps that span phases (a PRD requirement that falls between two phases and is in neither) and produce a single roll-up the user can work from.

**Files:**
- Create: `docs/bef/audits/2026-04-13/CROSS_PHASE_SUMMARY.md`
- Read: all 11 `phase-NN-audit.md` files

- [ ] **Step 4.1** — Build an "Orphan Requirements" table: every `REQUIREMENT_INDEX` row whose status across all 11 phase audits is Fail, NotApplicable, or missing. These are PRD requirements no phase currently owns. For each, propose which phase should absorb it (with justification).
- [ ] **Step 4.2** — Build a "Duplicate Coverage" table: any requirement covered by more than one phase with conflicting interpretation. Flag as Blocker for the later-executing phase.
- [ ] **Step 4.3** — Build a "Blocker Roll-up": list all Blocker-severity gaps across all 11 phases, grouped by phase, ordered by phase execution order. This becomes the must-fix queue before any execution resumes.
- [ ] **Step 4.4** — Build a "Phase Readiness Matrix": one row per phase with columns `R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | Verdict (Ready / Ready-after-fixes / Not-ready)`.
- [ ] **Step 4.5** — Add an "Execution order recommendation" section: given the fix plans, what's the most efficient sequence to work through the 11 fix plans? Identify which fix plans can run in parallel and which are blocked by upstream fixes.
- [ ] **Step 4.6** — Commit `CROSS_PHASE_SUMMARY.md` with message `audit: cross-phase consolidation and readiness matrix`.

---

## Task 5: Final Delivery

- [ ] **Step 5.1** — Update `docs/bef/PROJECT_STATE.md` `## Status` section with a one-line pointer: "Traceability audit complete — see `docs/bef/audits/2026-04-13/CROSS_PHASE_SUMMARY.md` for fix queue."
- [ ] **Step 5.2** — Append a row to the "Recently Completed" section of `PROJECT_STATE.md`: date-stamped summary naming total gaps found, blockers, and the readiness verdict per phase.
- [ ] **Step 5.3** — Hand off: present `CROSS_PHASE_SUMMARY.md` Blocker Roll-up + per-phase fix plans to the user. User will dispatch fix agents per phase (one agent per `phase-NN-audit.md` fix plan).

---

## Self-Review (done before handoff)

1. **Spec coverage** — Every criterion R1–R8 has a step in Task 3 that evaluates it.
2. **No placeholders** — No "TBD", no "add detail", no "handle edge cases" without specifics. Every fix-plan task in Task 3.N.11 must name file + section + content + DoD.
3. **ID consistency** — `PRD-x-yy`, `ADD-x-yy`, `PHASE-N-GAP-nn` formats used consistently across the plan.
4. **Scope** — 11 phases covered. No implicit expansion to phases not in `docs/bef/03-phases/`.

---

## Questions Before Execution (flag any before starting)

1. Should the audit treat Phase 1 as in-scope even though execution is complete (14/14 tasks done)? Default: **yes** — audit it for completeness of requirement coverage, but skip gap fixes unless the gap is a PRD requirement that wasn't built.
2. Should the audit consume `TECHNICAL_SPEC.md` as a source of truth or only as a cross-check? Default: **cross-check only**. PRD + Addendum are authoritative per `CLAUDE.md`.
3. Are Phase 2/6/11 re-dive items already-known gaps that should be pre-loaded into those audits rather than re-discovered? Default: **yes** — the audit subagent should read `VERIFICATION-STEP-2.md` and the "Outstanding for deep-dive" section first and treat those as prior art, not new discoveries.
