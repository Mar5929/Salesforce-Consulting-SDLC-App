---
phase: 03-story-management-and-sprint-intelligence
plan: 02b
subsystem: ui
tags: [react, tanstack-table, kanban, sheet, react-hook-form, zod, next-safe-action]

# Dependency graph
requires:
  - phase: 03-01
    provides: Story server actions, status machine, display IDs
  - phase: 03-02
    provides: Work navigation, breadcrumbs, view toggle, epic/feature tables
provides:
  - Story table with bulk actions (D-03, D-04)
  - Story kanban with drag-and-drop (D-01)
  - Story form slide-over with component selector (D-05, D-08, D-09)
  - Feature detail page with stories
  - Backlog page with unassigned stories
affects: [03-03, 03-04, 03-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [slide-over-form-pattern, bulk-action-toolbar, base-ui-select-null-handling]

key-files:
  created:
    - src/components/work/story-table.tsx
    - src/components/work/story-kanban.tsx
    - src/components/work/story-form.tsx
    - src/components/work/component-selector.tsx
    - src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/page.tsx
    - src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/feature-detail-client.tsx
    - src/app/(dashboard)/projects/[projectId]/backlog/page.tsx
    - src/app/(dashboard)/projects/[projectId]/backlog/backlog-client.tsx
  modified: []

key-decisions:
  - "base-ui Select onValueChange passes string|null -- all handlers guard with null check"
  - "Story form uses Sheet (slide-over) instead of Dialog for larger form surface area"
  - "Sprint bulk assignment shows toast placeholder until sprint management is built"

patterns-established:
  - "Slide-over form pattern: Sheet component with react-hook-form, dirty form protection via confirm on close"
  - "Bulk action toolbar: appears on row selection, uses base-ui Select with null-safe onValueChange"
  - "base-ui null handling: all Select onValueChange callbacks use (v: string | null) => v && handler(v)"

requirements-completed: [WORK-02, WORK-03, WORK-04, WORK-05, WORK-07]

# Metrics
duration: 6m
completed: 2026-04-06
---

# Phase 03 Plan 02b: Story-Level UI Summary

**Story table with bulk actions, kanban drag-and-drop, slide-over form with component selector, feature detail page, and backlog page**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-06T21:44:34Z
- **Completed:** 2026-04-06T21:50:21Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Story table with all 9 columns (checkbox, displayId, title, status, priority, assignee, points, feature, sprint) using TanStack React Table
- Bulk action toolbar with status change, sprint assignment, and assignee change on multi-select
- Story kanban with 7 status columns and drag-and-drop transitions
- Component selector for free-text Salesforce component name + impact type (CREATE/MODIFY/DELETE)
- Story form slide-over with mandatory acceptance criteria, role-gated status transitions, dirty form protection
- Feature detail page with breadcrumb navigation and story table/kanban toggle
- Backlog page showing all unassigned stories across all epics

## Task Commits

Each task was committed atomically:

1. **Task 1: Story table with bulk actions, story kanban, and component selector** - `727c5e6` (feat)
2. **Task 2: Story form slide-over, feature detail page, and backlog page** - `af35e30` (feat)

## Files Created/Modified
- `src/components/work/story-table.tsx` - Story table with TanStack React Table, bulk action toolbar, all D-03 columns
- `src/components/work/story-kanban.tsx` - Kanban board with 7 status columns and drag-and-drop
- `src/components/work/component-selector.tsx` - Inline multi-entry widget for Salesforce components
- `src/components/work/story-form.tsx` - Slide-over form with all D-05 fields, status transitions, dirty protection
- `src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/page.tsx` - Feature detail server component
- `src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/feature-detail-client.tsx` - Feature detail client with view toggle
- `src/app/(dashboard)/projects/[projectId]/backlog/page.tsx` - Backlog server component
- `src/app/(dashboard)/projects/[projectId]/backlog/backlog-client.tsx` - Backlog client with story table and form

## Decisions Made
- base-ui Select onValueChange passes `string | null` -- all handlers guard with null check pattern `(v: string | null) => v && handler(v)`
- Story form uses Sheet (slide-over from right) instead of Dialog to provide more form surface area for the many fields
- Sprint bulk assignment shows toast placeholder -- updateStory action does not have sprintId field yet; will be wired when sprint management plan executes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Story-level UI complete, ready for sprint management (Plan 03-03+)
- Sprint assignment bulk action has placeholder toast -- needs sprint CRUD actions to wire up
- Feature detail and backlog pages are functional and integrate with existing work navigation

---
*Phase: 03-story-management-and-sprint-intelligence*
*Completed: 2026-04-06*
