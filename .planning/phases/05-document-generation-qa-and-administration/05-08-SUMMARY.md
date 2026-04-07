---
phase: 05-document-generation-qa-and-administration
plan: 08
subsystem: ui
tags: [jira, sync, settings, archive, react, next.js, alert-dialog]

# Dependency graph
requires:
  - phase: 05-07
    provides: Jira sync and project archive server actions
  - phase: 05-03
    provides: Story table with defect count column
provides:
  - Jira configuration form component
  - Sync status badge component
  - Settings page with Jira integration and project lifecycle sections
  - Story table Jira column (conditional on config)
affects: []

# Tech tracking
tech-stack:
  added: [shadcn switch, shadcn alert-dialog, shadcn tooltip]
  patterns: [conditional table column via spread, controlled AlertDialog with open state]

key-files:
  created:
    - src/components/jira/jira-config-form.tsx
    - src/components/jira/sync-status-badge.tsx
    - src/app/(dashboard)/projects/[projectId]/settings/jira-settings-section.tsx
    - src/app/(dashboard)/projects/[projectId]/settings/project-lifecycle-section.tsx
  modified:
    - src/components/work/story-table.tsx
    - src/app/(dashboard)/projects/[projectId]/settings/page.tsx

key-decisions:
  - "Controlled AlertDialog with open/onOpenChange state for archive/reactivate instead of uncontrolled trigger"
  - "Conditional Jira column via spread operator in useMemo columns array with hasJiraConfig dependency"

patterns-established:
  - "Controlled AlertDialog: manage open state for programmatic close after async action"
  - "Conditional table columns: spread conditional column array into useMemo columns definition"

requirements-completed: [ADMIN-01, PROJ-04, PROJ-05]

# Metrics
duration: 4min
completed: 2026-04-07
---

# Phase 5 Plan 8: Jira Integration UI and Project Lifecycle Summary

**Jira config form with toggle/credentials, sync status badge in story table, and project archive/reactivate with confirmation dialogs**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-07T01:01:56Z
- **Completed:** 2026-04-07T01:06:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Jira configuration form with enable toggle, instance URL, email, masked API token, and project key fields
- SyncStatusBadge with semantic colors (SYNCED primary, PENDING muted, FAILED destructive) and Jira issue key display
- Story table conditionally shows Jira column when project has Jira config (per D-17)
- Settings page with Jira Integration section (config form, retry failed syncs) and Project Lifecycle section (archive/reactivate with AlertDialog confirmations)

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema push and create Jira config form and sync status badge** - `3fdf7f3` (feat)
2. **Task 2: Wire SyncStatusBadge into story table and update settings page** - `d404609` (feat)

## Files Created/Modified
- `src/components/jira/jira-config-form.tsx` - Jira configuration form with react-hook-form, toggle, disconnect dialog
- `src/components/jira/sync-status-badge.tsx` - Sync status badge with SYNCED/PENDING/FAILED states and tooltip
- `src/components/ui/switch.tsx` - shadcn Switch component (installed)
- `src/components/ui/alert-dialog.tsx` - shadcn AlertDialog component (installed)
- `src/components/work/story-table.tsx` - Added jiraSyncStatus to StoryRow, hasJiraConfig prop, conditional Jira column
- `src/app/(dashboard)/projects/[projectId]/settings/page.tsx` - Fetches Jira config, renders Jira and lifecycle sections
- `src/app/(dashboard)/projects/[projectId]/settings/jira-settings-section.tsx` - Jira settings with config form and retry failed syncs
- `src/app/(dashboard)/projects/[projectId]/settings/project-lifecycle-section.tsx` - Archive/reactivate with AlertDialog confirmations

## Decisions Made
- Controlled AlertDialog with open/onOpenChange state for archive/reactivate instead of uncontrolled trigger, enabling programmatic close after async action completes
- Conditional Jira column via spread operator in useMemo columns array with hasJiraConfig as dependency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed shadcn switch, alert-dialog, and tooltip components**
- **Found during:** Task 1
- **Issue:** switch.tsx, alert-dialog.tsx, and tooltip.tsx not present in src/components/ui/
- **Fix:** Installed via `npx shadcn@latest add switch alert-dialog tooltip`
- **Files modified:** src/components/ui/switch.tsx, src/components/ui/alert-dialog.tsx, src/components/ui/tooltip.tsx
- **Verification:** Components import and compile successfully
- **Committed in:** 3fdf7f3 (Task 1 commit)

**2. [Rule 3 - Blocking] Schema push skipped (no DATABASE_URL)**
- **Found during:** Task 1
- **Issue:** `npx prisma db push` requires DATABASE_URL which is not set in this environment
- **Fix:** Verified JiraConfig and JiraSyncRecord models exist in schema.prisma, ran `npx prisma generate` successfully
- **Impact:** Schema push must be run in an environment with database access before deployment

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** UI components were necessary dependencies. Schema push deferred to deployment environment.

## Issues Encountered
- No DATABASE_URL configured in local environment, so `npx prisma db push` could not execute. Schema models are correctly defined and Prisma client was regenerated. Push needed in deployment environment.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 (final phase) complete with all 9 plans executed
- Full V1 feature set implemented across all 5 phases
- Project ready for integration testing and deployment

## Self-Check: PASSED

All 4 created files verified. Both task commits (3fdf7f3, d404609) verified.

---
*Phase: 05-document-generation-qa-and-administration*
*Completed: 2026-04-07*
