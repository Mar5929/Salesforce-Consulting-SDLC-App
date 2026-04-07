---
phase: 09-navigation-and-badge-fixes
verified: 2026-04-07T00:00:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 9: Navigation and Badge Fixes — Verification Report

**Phase Goal:** Fix broken sidebar navigation and wire missing badge counts
**Verified:** 2026-04-07
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                  | Status     | Evidence                                                                                                        |
| --- | -------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Sidebar Team link navigates to /projects/{id}/settings/team, not /projects/{id}/team  | ✓ VERIFIED | sidebar.tsx line 151: `href: activeProjectId ? \`/projects/${activeProjectId}/settings/team\` : "/settings/team"`. Old broken pattern `/${activeProjectId}/team"` is absent. |
| 2   | Sidebar Questions badge shows count of questions with ANSWERED status                 | ✓ VERIFIED | layout.tsx line 31: `prisma.question.count({ where: { projectId, status: "ANSWERED" } })`. Count flows via qCount → questionReviewCount prop → AppShell → Sidebar → badge on Questions nav item (sidebar.tsx line 41). |
| 3   | Sidebar Defects badge shows count of defects with OPEN status                         | ✓ VERIFIED | layout.tsx line 34: `prisma.defect.count({ where: { projectId, status: "OPEN" } })`. Count flows via dCount → openDefectCount prop → AppShell → Sidebar → badge on Defects nav item (sidebar.tsx line 130). |
| 4   | Badge counts are fetched in the layout server component using Prisma, not via API routes | ✓ VERIFIED | layout.tsx: `import { prisma } from "@/lib/db"` at line 5. Both counts are fetched inside `Promise.all` in the server component function body (lines 28–36). No API routes used. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact                                   | Expected                              | Status     | Details                                                                                   |
| ------------------------------------------ | ------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `src/components/layout/sidebar.tsx`        | Corrected Team link href              | ✓ VERIFIED | Contains `/settings/team` at line 151; old broken href absent                            |
| `src/components/layout/app-shell.tsx`      | Badge count prop forwarding           | ✓ VERIFIED | `questionReviewCount` in AppShellProps (line 11), destructured (line 19), forwarded to Sidebar (lines 27–28) |
| `src/app/(dashboard)/layout.tsx`           | Prisma count queries for badge data   | ✓ VERIFIED | `prisma.question.count` at line 30, `prisma.defect.count` at line 33, inside `Promise.all` |

### Key Link Verification

| From                                  | To                                        | Via                                                   | Status     | Details                                                                                     |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| `src/app/(dashboard)/layout.tsx`      | `src/components/layout/app-shell.tsx`     | `questionReviewCount` and `openDefectCount` props     | ✓ WIRED    | AppShell JSX at lines 47–54 passes both props. Pattern confirmed.                           |
| `src/components/layout/app-shell.tsx` | `src/components/layout/sidebar.tsx`       | `questionReviewCount` and `openDefectCount` forwarded | ✓ WIRED    | Sidebar JSX at lines 24–29 in app-shell.tsx passes both props to `<Sidebar>`.               |

### Data-Flow Trace (Level 4)

| Artifact                              | Data Variable           | Source                                          | Produces Real Data | Status      |
| ------------------------------------- | ----------------------- | ----------------------------------------------- | ------------------ | ----------- |
| `src/components/layout/sidebar.tsx`   | `questionReviewCount`   | `prisma.question.count` in dashboard layout     | Yes — DB count query scoped to projectId + status filter | ✓ FLOWING |
| `src/components/layout/sidebar.tsx`   | `openDefectCount`       | `prisma.defect.count` in dashboard layout       | Yes — DB count query scoped to projectId + status filter | ✓ FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — badge counts render client-side and require a running server and real Prisma connection to observe. TypeScript compilation clean on all three modified files confirms no structural errors.

### Requirements Coverage

| Requirement | Source Plan | Description                                      | Status      | Evidence                                                                                              |
| ----------- | ----------- | ------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------- |
| PROJ-02     | 09-01-PLAN  | User can view and edit project settings and team membership | ✓ SATISFIED | Phase 9 restores correct navigation to the existing `/settings/team` page (confirms broken href to that page is fixed). Route `src/app/(dashboard)/projects/[projectId]/settings/team/page.tsx` confirmed to exist. |

**Note on traceability:** REQUIREMENTS.md maps PROJ-02 to Phase 1 (original implementation). Phase 9 claims it as a bug-fix contribution. This is not a gap — the requirement was met by Phase 1; Phase 9 fixes a navigation regression that prevented users from reaching the Phase-1-built feature.

### Anti-Patterns Found

No anti-patterns detected in any of the three modified files. No TODO/FIXME/placeholder comments. No stub return patterns.

Pre-existing TypeScript errors in unrelated files (`jira-config-form.tsx`, `question-form.tsx`, `staleness-badge.tsx`, `src/generated/prisma/index.d 2.ts`, etc.) were present before this phase and confirmed to be out of scope. Zero TypeScript errors were introduced by this phase's changes.

### Human Verification Required

None. All changes are structural/data wiring verifiable through static analysis.

### Gaps Summary

No gaps. All four must-have truths are verified with direct codebase evidence. The data pipeline from Prisma count queries in the layout server component through AppShell props to Sidebar badge rendering is fully wired and substantive.

---

_Verified: 2026-04-07_
_Verifier: Claude (gsd-verifier)_
