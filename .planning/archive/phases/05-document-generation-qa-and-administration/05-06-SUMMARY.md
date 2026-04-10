---
phase: 05-document-generation-qa-and-administration
plan: 06
subsystem: dashboard
tags: [recharts, swr, inngest, charts, pm-dashboard, aggregation]

requires:
  - phase: 05-00
    provides: Inngest infrastructure and schema models for stories, defects, test execution
  - phase: 05-01
    provides: QA workflow with test execution and defect models

provides:
  - PM Dashboard page with health score, stories, AI cost, and knowledge coverage stat cards
  - Pre-computed dashboard data via Inngest synthesis function
  - Stories by status and by assignee charts (D-14)
  - Questions by status display (D-14)
  - Knowledge coverage metric (D-14)
  - AI cost tracking over time and by feature area (D-12)
  - QA summary with pass/fail/blocked and defect severity (D-10)
  - Sprint velocity chart
  - Team activity feed

affects: [05-07, 05-08]

tech-stack:
  added: []
  patterns:
    - "Pre-computed JSON in cachedBriefingContent.pmDashboard (extends discovery dashboard pattern)"
    - "SWR polling with 30s refreshInterval for near-real-time dashboard updates"
    - "Inngest step functions for multi-query aggregation with per-step retries"

key-files:
  created:
    - src/lib/inngest/functions/pm-dashboard-synthesis.ts
    - src/actions/pm-dashboard.ts
    - src/app/(dashboard)/projects/[projectId]/pm-dashboard/page.tsx
    - src/app/(dashboard)/projects/[projectId]/pm-dashboard/pm-dashboard-client.tsx
    - src/components/pm-dashboard/stat-cards.tsx
    - src/components/pm-dashboard/work-progress-chart.tsx
    - src/components/pm-dashboard/ai-usage-charts.tsx
    - src/components/pm-dashboard/qa-summary.tsx
    - src/components/pm-dashboard/sprint-velocity-chart.tsx
    - src/components/pm-dashboard/team-activity.tsx
  modified:
    - src/app/api/inngest/route.ts

key-decisions:
  - "AI cost estimated from token counts using approximate Claude Sonnet pricing ($3/1M input, $15/1M output)"
  - "Knowledge coverage computed as (total - stale) / total with 7-day stale threshold"
  - "PM Dashboard data stored in cachedBriefingContent.pmDashboard key to avoid overwriting discovery dashboard data"

patterns-established:
  - "PM Dashboard chart pattern: shadcn ChartContainer + Recharts with chart CSS variables"
  - "Dashboard client/server split: server page passes projectId, client handles SWR polling"

requirements-completed: [ADMIN-02, ADMIN-03, QA-01]

duration: 6min
completed: 2026-04-07
---

# Phase 05 Plan 06: PM Dashboard Summary

**PM Dashboard with pre-computed Inngest synthesis, Recharts charts (stories by status/assignee, AI cost, QA summary, sprint velocity), and 30s SWR polling**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-07T00:47:32Z
- **Completed:** 2026-04-07T00:53:32Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Inngest synthesis function aggregates 10 data dimensions (stories by status, by assignee, questions by status, knowledge coverage, sprint velocity, AI costs, QA results, defects, team activity, health score) into pre-computed JSON
- PM Dashboard page with 6 sections: stat cards, work progress charts, AI usage charts, QA+questions summary, sprint velocity, team activity
- SWR polling at 30s interval with skeleton loading states and empty state
- All charts use shadcn Charts (Recharts) with design system CSS variables

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PM Dashboard server actions and Inngest synthesis function** - `02be5c7` (feat)
2. **Task 2: Create PM Dashboard page with chart components** - `3752a27` (feat)

## Files Created/Modified
- `src/lib/inngest/functions/pm-dashboard-synthesis.ts` - Inngest function aggregating 10 data dimensions into PmDashboardData
- `src/actions/pm-dashboard.ts` - Server actions getPmDashboardData (with PM/SA role check) and requestDashboardRefresh
- `src/app/api/inngest/route.ts` - Registered synthesizePmDashboard in Inngest serve handler
- `src/app/(dashboard)/projects/[projectId]/pm-dashboard/page.tsx` - Server component PM Dashboard page
- `src/app/(dashboard)/projects/[projectId]/pm-dashboard/pm-dashboard-client.tsx` - Client component with SWR polling
- `src/components/pm-dashboard/stat-cards.tsx` - Health, stories, AI cost, knowledge coverage cards
- `src/components/pm-dashboard/work-progress-chart.tsx` - Stories by status and by assignee bar charts
- `src/components/pm-dashboard/ai-usage-charts.tsx` - Cost over time line chart and cost by area bar chart
- `src/components/pm-dashboard/qa-summary.tsx` - Test results, defect severity, questions by status
- `src/components/pm-dashboard/sprint-velocity-chart.tsx` - Points per sprint bar chart
- `src/components/pm-dashboard/team-activity.tsx` - Recent team actions list

## Decisions Made
- AI cost estimated from token counts using approximate Claude Sonnet pricing ($3/1M input, $15/1M output) since SessionLog has no totalCost field
- Knowledge coverage computed as (total - stale) / total with 7-day stale threshold on lastRefreshedAt
- PM Dashboard data stored under `cachedBriefingContent.pmDashboard` key to coexist with discovery dashboard data
- AiUsageCharts renders side-by-side within its own grid rather than sharing row 3 grid with QaSummary (cleaner nesting)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PM Dashboard fully operational with pre-computed data pipeline
- Ready for Jira configuration (05-07) and project archival (05-08) plans

---
*Phase: 05-document-generation-qa-and-administration*
*Completed: 2026-04-07*

## Self-Check: PASSED

All 11 files verified present. Both task commits (02be5c7, 3752a27) verified in git log.
