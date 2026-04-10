---
phase: 09-navigation-and-badge-fixes
plan: 01
subsystem: ui
tags: [sidebar, navigation, badge, prisma-count]

# Dependency graph
requires:
  - phase: 02-discovery-and-knowledge-brain
    provides: Sidebar component with badge props, AppShell layout, question/defect models
provides:
  - Corrected Team link href pointing to /settings/team
  - Badge counts for Questions (ANSWERED) and Defects (OPEN) wired from layout through AppShell to Sidebar
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Promise.all for parallel Prisma count queries in server layout component"

key-files:
  created: []
  modified:
    - src/components/layout/sidebar.tsx
    - src/components/layout/app-shell.tsx
    - src/app/(dashboard)/layout.tsx

key-decisions:
  - "No new decisions - followed plan as specified"

patterns-established:
  - "Badge count pattern: Prisma count queries in layout server component, forwarded as props through AppShell to Sidebar"

requirements-completed: [PROJ-02]

# Metrics
duration: 1min
completed: 2026-04-07
---

# Phase 9 Plan 1: Navigation and Badge Fixes Summary

**Fixed sidebar Team link 404 and wired ANSWERED question / OPEN defect badge counts from Prisma through layout to Sidebar**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-07T14:18:33Z
- **Completed:** 2026-04-07T14:19:40Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Fixed Team nav item href from `/projects/{id}/team` (404) to `/projects/{id}/settings/team`
- Added Prisma count queries for Questions with ANSWERED status and Defects with OPEN status in the dashboard layout server component
- Wired badge counts through AppShell props to Sidebar, where they render as orange badge pills

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Team link href in sidebar** - `ffdb5ce` (fix)
2. **Task 2: Wire badge counts through layout > AppShell > Sidebar** - `d360ee6` (feat)

## Files Created/Modified
- `src/components/layout/sidebar.tsx` - Changed Team nav item href to include /settings/ segment
- `src/components/layout/app-shell.tsx` - Added questionReviewCount and openDefectCount to AppShellProps and forwarded to Sidebar
- `src/app/(dashboard)/layout.tsx` - Added prisma import, Promise.all for parallel count queries, forwarded badge count props to AppShell

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Sidebar navigation is fully functional with correct Team link routing
- Badge counts display real data from Prisma queries
- Pre-existing TypeScript errors in unrelated files (jira-config-form, question-form, staleness-badge) remain - these are out of scope for this plan

---
*Phase: 09-navigation-and-badge-fixes*
*Completed: 2026-04-07*
