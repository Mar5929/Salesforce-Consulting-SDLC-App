---
phase: 08-event-wiring-and-integration-fixes
plan: 01
subsystem: events
tags: [inngest, event-wiring, jira-sync, dashboard, background-jobs]

# Dependency graph
requires:
  - phase: 02-discovery-and-knowledge-brain
    provides: dashboard synthesis function, question actions, transcript processing, article refresh
  - phase: 05-document-generation-qa-and-administration
    provides: jira sync function, story status API route
provides:
  - PROJECT_STATE_CHANGED event sends from question/transcript/article workflows
  - Consistent STORY_STATUS_CHANGED payload shape (fromStatus, newStatus)
  - JIRA_SYNC_REQUESTED consumer for manual Jira retry
affects: [dashboard-synthesis, jira-sync, discovery-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inngest event fan-out: trigger-downstream array pattern for multi-event sends"
    - "Step ordering: dashboard refresh after embedding trigger for data freshness"

key-files:
  created: []
  modified:
    - src/actions/questions.ts
    - src/lib/inngest/functions/transcript-processing.ts
    - src/lib/inngest/functions/article-refresh.ts
    - src/actions/stories.ts
    - src/app/api/v1/stories/[storyId]/status/route.ts
    - src/lib/inngest/functions/jira-sync.ts
    - src/app/api/inngest/route.ts

key-decisions:
  - "No PROJECT_STATE_CHANGED in stories.ts -- story changes feed PM dashboard, not discovery dashboard (D-03)"
  - "No NOTIFICATION_SEND in jiraSyncRetryFunction -- SyncStatusBadge reflects sync record directly (D-09)"
  - "StatusTransition.toStatus DB column unchanged -- event payload field name is independent of DB schema (D-12)"

patterns-established:
  - "Event payload consistency: all STORY_STATUS_CHANGED senders use { fromStatus, newStatus } shape"

requirements-completed: [DASH-05, ADMIN-01]

# Metrics
duration: 3min
completed: 2026-04-07
---

# Phase 08 Plan 01: Event Wiring and Integration Fixes Summary

**Three broken event chains fixed: dashboard auto-refresh via PROJECT_STATE_CHANGED, Jira sync payload field names, and JIRA_SYNC_REQUESTED retry consumer**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T14:27:11Z
- **Completed:** 2026-04-07T14:30:11Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Wired PROJECT_STATE_CHANGED event sends from 5 locations (3 question actions + transcript processing + article refresh) to trigger discovery dashboard re-synthesis
- Fixed STORY_STATUS_CHANGED field name mismatch: toStatus->newStatus in stories.ts, previousStatus->fromStatus in API route
- Created jiraSyncRetryFunction with full sync pipeline (check config, load story, push to Jira, sync status, record outcome)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire PROJECT_STATE_CHANGED sends** - `f283ea8` (feat)
2. **Task 2: Fix STORY_STATUS_CHANGED fields and create Jira retry consumer** - `d1cc1c0` (fix)

## Files Created/Modified
- `src/actions/questions.ts` - Added PROJECT_STATE_CHANGED sends in createQuestion, updateQuestion, answerQuestion
- `src/lib/inngest/functions/transcript-processing.ts` - Added PROJECT_STATE_CHANGED to trigger-downstream event array
- `src/lib/inngest/functions/article-refresh.ts` - Added trigger-dashboard-refresh step after embedding trigger
- `src/actions/stories.ts` - Fixed toStatus -> newStatus in STORY_STATUS_CHANGED event payload
- `src/app/api/v1/stories/[storyId]/status/route.ts` - Fixed previousStatus -> fromStatus in STORY_STATUS_CHANGED event payload
- `src/lib/inngest/functions/jira-sync.ts` - Added jiraSyncRetryFunction for JIRA_SYNC_REQUESTED manual retry
- `src/app/api/inngest/route.ts` - Imported and registered jiraSyncRetryFunction

## Decisions Made
- No PROJECT_STATE_CHANGED in stories.ts -- story status changes feed the PM dashboard, not the discovery dashboard (D-03)
- No NOTIFICATION_SEND in retry function -- SyncStatusBadge reflects JiraSyncRecord directly (D-09)
- StatusTransition.toStatus DB column left unchanged -- DB field name is independent of event payload field name (D-12)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three event chains are functional
- Dashboard synthesis will trigger on question/transcript/article changes
- Jira sync receives correct field names from both story status senders
- Manual Jira retry is available via JIRA_SYNC_REQUESTED event

---
*Phase: 08-event-wiring-and-integration-fixes*
*Completed: 2026-04-07*
