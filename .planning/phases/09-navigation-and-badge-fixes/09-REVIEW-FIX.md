---
phase: 09-navigation-and-badge-fixes
fixed_at: 2026-04-07T00:00:00Z
review_path: .planning/phases/09-navigation-and-badge-fixes/09-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 9: Code Review Fix Report

**Fixed at:** 2026-04-07
**Source review:** .planning/phases/09-navigation-and-badge-fixes/09-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: `x-pathname` header fallback silently hides middleware misconfiguration

**Files modified:** `src/app/(dashboard)/layout.tsx`
**Commit:** 929e151
**Applied fix:** Added a development-only `console.warn` when the `x-pathname` header is missing, making middleware misconfiguration visible during local development instead of silently falling back to an empty string.

### WR-02: `isActive` uses `startsWith` causing false positives

**Files modified:** `src/components/layout/sidebar.tsx`
**Commit:** f7a3767
**Applied fix:** Changed `pathname.startsWith(href)` to `pathname === href || pathname.startsWith(href + "/")` so that parent routes (e.g., `/projects/abc/org`) are not incorrectly marked active when a child route (e.g., `/projects/abc/org/analysis`) is the current page.

### WR-03: Badge counts `ANSWERED` questions -- may be wrong semantic

**Files modified:** `src/app/(dashboard)/layout.tsx`
**Commit:** 6f2e8a4
**Applied fix:** Added clarifying comments documenting the question status flow (`OPEN -> SCOPED -> OWNED -> ANSWERED -> REVIEWED`) and explaining that ANSWERED means "awaiting human review/approval" -- confirming the query is intentionally correct. Verified against the `QuestionStatus` enum in the Prisma schema.

### WR-04: Catch block swallows all errors

**Files modified:** `src/app/(dashboard)/layout.tsx`
**Commit:** 9feaa7e
**Applied fix:** Narrowed the `catch` block to only redirect for known auth/membership errors (`"Not a member of this project"`, `"Unauthorized"`, `"Insufficient permissions"` -- all verified against `src/lib/auth.ts`). Unexpected errors (database timeouts, network failures) are now re-thrown so Next.js error boundaries can handle them properly.

---

_Fixed: 2026-04-07_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
