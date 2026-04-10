# Phase 9: Navigation and Badge Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 09-navigation-and-badge-fixes
**Areas discussed:** Badge fetch strategy, Badge count definitions

---

## Badge Fetch Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Layout server component query | Add Prisma count() calls in layout.tsx, pass through AppShell props — follows existing pattern | ✓ |
| Server action | Client-side fetch via server action on mount | |
| API route | Dedicated /api endpoint for badge counts | |

**User's choice:** Claude's recommendation — layout server component query
**Notes:** User delegated all decisions to Claude. Layout query chosen because the existing data flow pattern already passes currentMemberRole and activeProjectId from layout → AppShell → Sidebar. Badge counts follow the same path with zero new infrastructure.

---

## Badge Count Definitions

| Option | Description | Selected |
|--------|-------------|----------|
| Actionable counts only | questionReviewCount = ANSWERED status, openDefectCount = OPEN status | ✓ |
| Broader counts | Include multiple statuses (e.g., all non-closed) | |

**User's choice:** Claude's recommendation — actionable counts only
**Notes:** ANSWERED questions are awaiting review (the actionable step in the 5-state lifecycle). OPEN defects are unresolved. These represent "things that need attention" — the purpose of badge counts.

---

## Claude's Discretion

None remaining — all areas resolved in this update session.

## Deferred Ideas

None — discussion stayed within phase scope.
