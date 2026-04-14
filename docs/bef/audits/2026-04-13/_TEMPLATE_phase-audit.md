# Phase NN Audit: <Phase Name>

**Auditor:** <agent name>
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-NN-<slug>/PHASE_SPEC.md` (SHA: <short-sha>)
- `docs/bef/03-phases/phase-NN-<slug>/TASKS.md` (SHA: <short-sha>)

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md`
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (secondary authoritative — app-wide architecture derived from PRD)
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`

---

## 1. Scope Map

> Every `REQUIREMENT_INDEX` row whose `Phase-hint` includes phase NN, plus any additional requirements this phase claims coverage for. Status = Pass | Partial | Fail | NotApplicable.

| Req ID | Requirement (1-line) | Covered by (spec §/task #) | Status | Notes |
|--------|----------------------|----------------------------|--------|-------|
| PRD-x-yy | ... | PHASE_SPEC §y.z / TASKS Task N | Pass | — |
| ADD-x-yy | ... | TASKS Task M, AC #k | Partial | Missing threshold |
| PRD-x-yy | ... | — | Fail | No coverage |
| PRD-x-yy | ... | — | NotApplicable | Owned by phase M per Phase-hint |

**Scope summary:** X total rows mapped. Y Pass, Z Partial, W Fail, V NotApplicable.

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification (1 line) |
|---|-----------|-------|------------------------|
| R1 | Requirement traceability — every spec/task cites PRD/Addendum, every in-scope requirement is covered | Pass/Partial/Fail | |
| R2 | No PRD/Addendum/TECHNICAL_SPEC contradiction | Pass/Partial/Fail | |
| R3 | Scope completeness — every in-domain requirement has a task | Pass/Partial/Fail | |
| R4 | Acceptance criteria are testable (concrete inputs/outputs/thresholds) | Pass/Partial/Fail | |
| R5 | Edge cases enumerated (errors, concurrency, empty/null, rate limits, cost ceilings, auth, partial data) | Pass/Partial/Fail | |
| R6 | Interfaces pinned — DB schema, APIs, events fully specified (names, types, nullability) | Pass/Partial/Fail | |
| R7 | Upstream dependencies resolved with concrete interface references | Pass/Partial/Fail | |
| R8 | Outstanding-for-deep-dive items empty or tracked with owner | Pass/Partial/Fail | |

**Overall verdict:** Ready / Ready-after-fixes / Not-ready

**A phase is "Ready" only if R1–R8 are all Pass.**

---

## 3. Gaps

> One entry per Partial or Fail finding. `PHASE-N-GAP-nn` IDs are stable — do not renumber on re-run.

### PHASE-N-GAP-01
- **Rubric criterion:** R_
- **Affected Req IDs:** PRD-x-yy, ADD-x-yy
- **Description:** <what's missing or wrong, concrete>
- **Severity:** Blocker | Major | Minor
  - **Blocker** = phase cannot ship without it (contradicts PRD/Addendum, undefined interface, missing major requirement)
  - **Major** = phase can start but result won't satisfy PRD without it (missing AC threshold, missing edge case for a PRD-specified condition)
  - **Minor** = doc hygiene, cross-reference, or clarity issue

### PHASE-N-GAP-02
- ...

---

## 4. Fix Plan

> One concrete remediation task per gap. Each must name exact files + section/task #, summarize new content (not "add detail"), and specify a definition of done. No placeholders.

### Fix PHASE-N-GAP-01
- **File(s) to edit:** `docs/bef/03-phases/phase-NN-<slug>/PHASE_SPEC.md` §y.z  (and/or TASKS.md Task M)
- **Change summary:** <what to add/replace/remove — substantive enough for an agent to execute>
- **New content outline:**
  - <bullet 1: what new section/AC/edge case to add, with specific content>
  - <bullet 2>
- **Cross-phase coordination:** <if any — name the other phase and what needs to align>
- **Definition of done:**
  - [ ] Change lands in the named file(s)
  - [ ] PHASE_SPEC cites the originating Req ID(s)
  - [ ] <specific verifiable condition: e.g., "Task M AC #k includes confidence threshold 0.85">
  - [ ] `PHASE_SPEC.md` "Outstanding for deep-dive" section reflects the closure

### Fix PHASE-N-GAP-02
- ...

---

## 5. Sign-off Checklist

- [ ] R1 scored
- [ ] R2 scored
- [ ] R3 scored
- [ ] R4 scored
- [ ] R5 scored
- [ ] R6 scored
- [ ] R7 scored
- [ ] R8 scored
- [ ] Every Partial/Fail in the Scope Map has a corresponding gap entry
- [ ] Every gap has a fix plan entry
- [ ] Every fix plan has a concrete definition of done
- [ ] No gap uses vague remediation language ("add detail", "handle edge cases", "TBD")
- [ ] Overall verdict matches scorecard (Ready requires all R1–R8 = Pass)
