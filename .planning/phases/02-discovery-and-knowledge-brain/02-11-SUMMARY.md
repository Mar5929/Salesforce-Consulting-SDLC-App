---
phase: 02-discovery-and-knowledge-brain
plan: 11
subsystem: questions, inngest
tags: [kanban, lifecycle, inngest, impact-assessment, agent-harness]

# Dependency graph
requires:
  - phase: 02-discovery-and-knowledge-brain/plan-10
    provides: "QuestionStatus enum with 6 values (OPEN, SCOPED, OWNED, ANSWERED, REVIEWED, PARKED)"
  - phase: 02-discovery-and-knowledge-brain/plan-03
    provides: "Agent harness engine (executeTask) and questionAnsweringTask definition"
  - phase: 02-discovery-and-knowledge-brain/plan-05
    provides: "Knowledge staleness detection Inngest function pattern"
provides:
  - "6-state question kanban board (Open, Scoped, Owned, Answered, Reviewed, Parked)"
  - "6-state table status filter and badge colors"
  - "Full status transition graph in validateStatusTransition"
  - "questionImpactAssessmentFunction Inngest function for AI impact assessment on question answer"
affects: [question-detail, discovery-dashboard, sprint-intelligence]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inngest event filtering pattern: multiple functions on same event, early-return guard for specificity"

key-files:
  created:
    - src/lib/inngest/functions/question-impact-assessment.ts
  modified:
    - src/actions/questions.ts
    - src/components/questions/question-kanban.tsx
    - src/components/questions/question-table.tsx
    - src/app/api/inngest/route.ts

key-decisions:
  - "Extended validateStatusTransition with full lifecycle graph: OPEN->SCOPED->OWNED->ANSWERED->REVIEWED, Parked from any state"
  - "executeTask called with userId from event data, fallback to 'system' for background jobs"

patterns-established:
  - "Inngest event filtering: guard clause checking entityType and action before processing"

requirements-completed: [QUES-04, QUES-05]

# Metrics
duration: 2min
completed: 2026-04-06
---

# Phase 02 Plan 11: Question Lifecycle and Impact Assessment Summary

**6-state question kanban/table UI with AI impact assessment Inngest function triggered on question answer**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-06T19:38:28Z
- **Completed:** 2026-04-06T19:40:11Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Expanded question kanban from 3 columns to 6 (Open, Scoped, Owned, Answered, Reviewed, Parked) with distinct colors
- Updated table status filter and badge colors for all 6 QuestionStatus values
- Created questionImpactAssessmentFunction that runs AI impact assessment via agent harness when a question is answered
- Extended validateStatusTransition with full lifecycle graph supporting forward and backward transitions

## Task Commits

Each task was committed atomically:

1. **Task 1: Update question lifecycle to 5 states in UI and actions** - `c0ffbd4` (feat)
2. **Task 2: Create question impact assessment Inngest function** - `b35e0c1` (feat)

## Files Created/Modified
- `src/lib/inngest/functions/question-impact-assessment.ts` - Inngest function: listens to ENTITY_CONTENT_CHANGED, filters for question-answered, runs questionAnsweringTask, persists impactAssessment
- `src/actions/questions.ts` - Updated Zod schemas to accept all 6 statuses, expanded validateStatusTransition graph
- `src/components/questions/question-kanban.tsx` - 6-column kanban with drag-to-advance for all statuses
- `src/components/questions/question-table.tsx` - 6-status filter dropdown and badge color styles
- `src/app/api/inngest/route.ts` - Registered questionImpactAssessmentFunction

## Decisions Made
- Extended validateStatusTransition with full lifecycle graph: OPEN->SCOPED->OWNED->ANSWERED->REVIEWED, plus Parked reachable from any active state and unpark always returns to OPEN
- Passed userId from event data to executeTask with fallback to "system" for background jobs (plan omitted the required 4th param)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing userId parameter to executeTask call**
- **Found during:** Task 2 (Inngest function creation)
- **Issue:** Plan pseudocode called executeTask with 3 args but engine.ts signature requires 4 (taskDef, input, projectId, userId)
- **Fix:** Added userId from event.data with fallback to "system" string
- **Files modified:** src/lib/inngest/functions/question-impact-assessment.ts
- **Verification:** Function signature matches engine.ts export
- **Committed in:** b35e0c1

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Question lifecycle UI fully wired to 6-state model
- Impact assessment will auto-populate when questions are answered (once ANTHROPIC_API_KEY is configured)
- Ready for plan 12 (final verification/cleanup)

## Self-Check: PASSED

All 5 files verified present. Both task commits (c0ffbd4, b35e0c1) found in git log.

---
*Phase: 02-discovery-and-knowledge-brain*
*Completed: 2026-04-06*
