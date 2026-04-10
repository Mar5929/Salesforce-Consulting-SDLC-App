---
phase: 03-story-management-and-sprint-intelligence
plan: 01
subsystem: api
tags: [prisma, server-actions, state-machine, inngest, next-safe-action, recharts]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Prisma schema, safe-action client, project-scope, auth helpers
  - phase: 03-00
    provides: Failing test specs for status machine, display ID, burndown, sprint actions
provides:
  - Epic CRUD server actions (createEpic, updateEpic, deleteEpic, getEpics, getEpic)
  - Feature CRUD server actions (createFeature, updateFeature, deleteFeature, getFeatures)
  - Story CRUD server actions with role-based access and status machine validation
  - Story status machine with role-gated transitions (PM lifecycle, DEV execution)
  - Story display ID generator using epic prefix (AUTH-1, AUTH-2)
  - Burndown chart computation (pure function)
  - Sprint.cachedAnalysis schema field for conflict detection
  - Story @@unique([projectId, displayId]) constraint
  - SPRINT_STORIES_CHANGED and STORY_STATUS_CHANGED Inngest events
  - Work, Backlog, Sprints sidebar navigation links
affects: [03-02, 03-03, 03-04, 03-05, 03-06]

# Tech tracking
tech-stack:
  added: [recharts, @tanstack/react-table]
  patterns: [role-gated-state-machine, epic-prefix-display-ids, utc-burndown-computation]

key-files:
  created:
    - src/lib/story-status-machine.ts
    - src/actions/epics.ts
    - src/actions/features.ts
    - src/actions/stories.ts
    - src/lib/burndown.ts
    - src/components/ui/chart.tsx
    - src/components/ui/checkbox.tsx
  modified:
    - prisma/schema.prisma
    - src/lib/display-id.ts
    - src/lib/inngest/events.ts
    - src/components/layout/sidebar.tsx
    - tests/helpers/mock-prisma.ts
    - package.json

key-decisions:
  - "Used FixedPrefixEntityType for ENTITY_PREFIXES to exclude Story from fixed-prefix map while keeping Story in DisplayIdEntityType union"
  - "Story update/delete uses findFirst for member lookup instead of getCurrentMember to enable testable role checks"
  - "Burndown computation uses UTC-consistent date handling to avoid timezone-dependent test failures"

patterns-established:
  - "Role-gated state machine: TRANSITIONS map defines valid moves, PM_TRANSITIONS/DEV_TRANSITIONS define who can make each move"
  - "Epic-prefix display IDs: Stories get IDs like AUTH-1 based on their epic prefix, not a fixed entity prefix"
  - "Server action role check pattern: findFirst for member, then check role before mutation"

requirements-completed: [WORK-01, WORK-04]

# Metrics
duration: 6min
completed: 2026-04-06
---

# Phase 3 Plan 01: Data Layer Foundation Summary

**Epic/feature/story CRUD server actions with role-gated status machine, display ID generation, burndown computation, and schema migration**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-06T21:31:23Z
- **Completed:** 2026-04-06T21:37:23Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Schema updated with Sprint.cachedAnalysis and Story unique displayId constraint
- Full CRUD server actions for epics, features, and stories with project scoping and role-based access
- Story status machine validates transitions by role (PM lifecycle, DEV execution, BA/QA blocked)
- Story display ID generation uses epic prefix pattern (AUTH-1, AUTH-2)
- Burndown chart pure function with UTC-consistent date math
- 26 tests passing (status machine, display ID, burndown)

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema migration + display ID + status machine + Inngest events + sidebar** - `94e5cfd` (feat)
2. **Task 2: Epic/Feature/Story CRUD server actions + dependencies** - `4f03913` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added cachedAnalysis to Sprint, @@unique to Story
- `src/lib/story-status-machine.ts` - Role-gated state machine for story status transitions
- `src/lib/display-id.ts` - Added generateStoryDisplayId for epic-prefix-based IDs
- `src/lib/burndown.ts` - Pure burndown chart computation
- `src/actions/epics.ts` - Epic CRUD server actions
- `src/actions/features.ts` - Feature CRUD server actions
- `src/actions/stories.ts` - Story CRUD with status validation, role checks, Inngest events
- `src/lib/inngest/events.ts` - Added sprint/story event definitions
- `src/components/layout/sidebar.tsx` - Added Work, Backlog, Sprints nav items
- `src/components/ui/chart.tsx` - shadcn chart component
- `src/components/ui/checkbox.tsx` - shadcn checkbox component
- `tests/helpers/mock-prisma.ts` - Added storyComponent and statusTransition models

## Decisions Made
- Used `FixedPrefixEntityType = Exclude<DisplayIdEntityType, "Story">` for the ENTITY_PREFIXES map since stories use epic-prefix-based IDs, not fixed prefixes
- Story update/delete uses `prisma.projectMember.findFirst` instead of `getCurrentMember` to match test expectations and enable mockable role checks
- Burndown computation uses UTC-consistent date handling (utcMidnight, utcDateKey helpers) to avoid timezone-dependent failures

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DisplayIdEntityType breaking ENTITY_PREFIXES**
- **Found during:** Task 1
- **Issue:** Adding "Story" to DisplayIdEntityType caused TypeScript error since ENTITY_PREFIXES is Record<DisplayIdEntityType, string> but Story has no fixed prefix
- **Fix:** Created FixedPrefixEntityType = Exclude<DisplayIdEntityType, "Story"> for the prefix map, kept Story in the union type
- **Files modified:** src/lib/display-id.ts
- **Committed in:** 94e5cfd

**2. [Rule 1 - Bug] Fixed burndown UTC timezone inconsistency**
- **Found during:** Task 2
- **Issue:** Using setHours(0,0,0,0) for local midnight then toISOString() for UTC caused date key mismatches in tests
- **Fix:** Created utcMidnight() and utcDateKey() helpers using Date.UTC consistently
- **Files modified:** src/lib/burndown.ts
- **Committed in:** 4f03913

**3. [Rule 2 - Missing Critical] Added burndown module**
- **Found during:** Task 2
- **Issue:** Plan 03-00 created burndown tests but the burndown module wasn't in Plan 01 task list
- **Fix:** Created src/lib/burndown.ts with computeBurndown pure function
- **Files modified:** src/lib/burndown.ts
- **Committed in:** 4f03913

**4. [Rule 1 - Bug] Fixed story update/delete member lookup for testability**
- **Found during:** Task 2
- **Issue:** Using getCurrentMember (findUnique with compound key) didn't match test mocks that set up findFirst
- **Fix:** Changed updateStory/deleteStory to use prisma.projectMember.findFirst for role lookup
- **Files modified:** src/actions/stories.ts
- **Committed in:** 4f03913

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness and test compatibility. No scope creep.

## Issues Encountered
- Database push failed due to missing DATABASE_URL env var (expected in dev without DB connection). Schema changes validated via Prisma generate.
- 3 sprint action tests still fail because `@/actions/sprints` module is Plan 04 work (expected).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All server actions ready for UI consumption in Plans 02/03
- Status machine ready for sprint assignment logic in Plan 04
- Burndown computation ready for sprint dashboard in Plan 05
- Sidebar navigation ready for Work, Backlog, Sprints pages

---
*Phase: 03-story-management-and-sprint-intelligence*
*Completed: 2026-04-06*
