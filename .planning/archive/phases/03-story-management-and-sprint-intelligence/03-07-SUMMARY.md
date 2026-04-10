---
phase: 03-story-management-and-sprint-intelligence
plan: 07
subsystem: ui
tags: [next-safe-action, useAction, server-actions, story-generation, sprint-assignment]

requires:
  - phase: 03-03
    provides: initiateStorySession server action
  - phase: 03-04
    provides: assignStoriesToSprint server action
  - phase: 03-02b
    provides: story-table UI with bulk action toolbar
  - phase: 03-02
    provides: epic-detail-client UI with Generate Stories button
provides:
  - Generate Stories button wired to initiateStorySession with chat redirect
  - Bulk sprint assignment wired to assignStoriesToSprint with transaction support
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx
    - src/components/work/story-table.tsx

key-decisions:
  - "No new decisions - followed plan exactly"

patterns-established: []

requirements-completed: [WORK-06, SPRT-02]

duration: 3min
completed: 2026-04-06
---

# Plan 03-07: Wire UI Entry Points to Server Actions

**Generate Stories and bulk sprint assignment buttons connected to existing server actions, replacing placeholder toasts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06
- **Completed:** 2026-04-06
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Epic detail "Generate Stories" button calls initiateStorySession and redirects to `/projects/{id}/chat/{conversationId}`
- Story table bulk "Assign Sprint" calls assignStoriesToSprint with all selected story IDs in a single transaction
- Removed all placeholder toasts ("Coming soon", "Sprint assignment will be available")

## Task Commits

Each task was committed atomically:

1. **Task 1 & 2: Wire Generate Stories + bulk sprint assignment** - `df5eb23` (fix)

## Files Created/Modified
- `src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx` - Added useAction + useRouter hooks, wired handleGenerateStories to initiateStorySession
- `src/components/work/story-table.tsx` - Added assignStoriesToSprint import and useAction hook, replaced loop+placeholder with single executeSprintAssign call

## Decisions Made
None - followed plan as specified

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 03 plans complete (9/9)
- Story management and sprint intelligence layer fully wired

---
*Phase: 03-story-management-and-sprint-intelligence*
*Completed: 2026-04-06*
