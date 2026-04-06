---
phase: 3
slug: story-management-and-sprint-intelligence
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-06
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 00-T1 | 03-00 | 0 | N/A | T-03-00 | Test infra setup | setup | `npx vitest run --reporter=verbose` | No -> Wave 0 creates | ⬜ pending |
| 00-T2 | 03-00 | 0 | WORK-04, WORK-05, WORK-03, SPRT-02, SPRT-05 | N/A | Unit test contracts | unit | `npx vitest run --reporter=verbose` | No -> Wave 0 creates | ⬜ pending |
| 01-T1 | 03-01 | 1 | WORK-01, WORK-04 | T-03-03 | Status machine validates transitions server-side | unit | `npx vitest run src/lib/__tests__/story-status-machine.test.ts` | Wave 0 | ⬜ pending |
| 01-T2 | 03-01 | 1 | WORK-01 | T-03-01, T-03-02 | Role-based CRUD, scoped queries | unit | `npx vitest run src/actions/__tests__/sprints.test.ts && npx tsc --noEmit` | Wave 0 | ⬜ pending |
| 02-T1 | 03-02 | 2 | WORK-01 | T-03-05 | Scoped data access | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 02-T2 | 03-02 | 2 | WORK-01 | T-03-05 | Scoped data access | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 02b-T1 | 03-02b | 2 | WORK-02, WORK-07 | T-03-05b | Bulk actions validate per-item | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 02b-T2 | 03-02b | 2 | WORK-03, WORK-04, WORK-05 | T-03-06b | Role-gated form transitions | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 03-T1 | 03-03 | 2 | WORK-06 | T-03-08, T-03-09 | AI drafts not auto-persisted, token cap | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 03-T2 | 03-03 | 2 | WORK-06 | T-03-10 | Scoped component access | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 04-T1 | 03-04 | 2 | SPRT-01, SPRT-02 | T-03-11, T-03-12 | Scoped assignment, date validation | unit | `npx vitest run src/actions/__tests__/sprints.test.ts && npx tsc --noEmit` | Wave 0 | ⬜ pending |
| 04-T2 | 03-04 | 2 | SPRT-02 | T-03-11 | Scoped DnD assignment | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 05-T1 | 03-05 | 3 | SPRT-05 | T-03-14 | Status transitions validated | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 05-T2 | 03-05 | 3 | SPRT-05 | T-03-15 | Burndown data correct | unit | `npx vitest run src/lib/__tests__/burndown.test.ts && npx tsc --noEmit` | Wave 0 | ⬜ pending |
| 06-T1 | 03-06 | 3 | SPRT-03, SPRT-04 | T-03-16, T-03-17 | Token budget cap, trusted storage | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 06-T2 | 03-06 | 3 | SPRT-03, SPRT-04 | T-03-18 | Scoped notifications | compile | `npx tsc --noEmit` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Test framework installed and configured (03-00-PLAN.md Task 1)
- [x] Server action test utilities -- mock auth, mock prisma (03-00-PLAN.md Task 1)
- [x] Shared fixtures for Epic, Feature, Story, Sprint test data (03-00-PLAN.md Task 1)
- [x] Unit tests for canTransition() (03-00-PLAN.md Task 2)
- [x] Unit tests for generateStoryDisplayId() (03-00-PLAN.md Task 2)
- [x] Unit tests for computeBurndown() (03-00-PLAN.md Task 2)
- [x] Unit tests for assignStoriesToSprint auto-transition (03-00-PLAN.md Task 2)
- [x] Unit tests for role-based edit/delete (03-00-PLAN.md Task 2)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop story assignment | SPRT-02 | Browser interaction | Drag story from backlog to sprint in split view |
| Kanban board column transitions | WORK-04 | Visual UI behavior | Drag story card between status columns |
| Burndown chart rendering | SPRT-05 | Chart visual accuracy | Verify chart shows correct data points |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
