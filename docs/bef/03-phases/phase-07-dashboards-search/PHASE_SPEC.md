# Phase 7 Spec: Dashboards, Search

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [07-dashboards-search-gaps.md](./07-dashboards-search-gaps.md)
> Depends On: Phase 2 (Briefing/Status Pipeline), Phase 3 (Discovery), Phase 4 (Work Management), Phase 5 (Sprint/Developer), Phase 6 (Org/Knowledge), Phase 11 (Hybrid Retrieval `search_project_kb` + `search_org_kb`)
> Status: Draft (Wave 3 audit-fix applied 2026-04-14)
> Last Updated: 2026-04-14

---

## 0. Requirement Traceability

This table enumerates every PRD/Addendum requirement in Phase 7 scope (per `REQUIREMENT_INDEX.md` and the phase-07 audit). Fix agents and verifiers cite by REQ-ID.

| REQ-ID | Source | Covered by §/Task | Status |
|--------|--------|-------------------|--------|
| PRD-5-29 | PRD §5 | §2.1 / Task 2 | Pass |
| PRD-6-20 | PRD §6 | §2.1-§2.6, Addendum amendments | Pass |
| PRD-6-21 | PRD §6 | §2.4, §2.14 / Tasks 5, 16 | Pass |
| PRD-6-22 | PRD §6 | §2.11, §2.14 / Task 12 | Pass |
| PRD-8-20..25 | PRD §8 | §2.3, §2.4 / Tasks 4, 5 | Pass |
| PRD-17-02 | PRD §17 | §2.3 / Task 4 | Pass |
| PRD-17-03 | PRD §17 | §2.4, §2.14 / Tasks 5, 16 | Pass |
| PRD-17-04 | PRD §17 | §2.4 / Task 5 | Pass |
| PRD-17-05 | PRD §17 | §2.14 / Task 16 (consumes Phase 2 emit per DECISION-08) | Pass |
| PRD-17-06 | PRD §17 | §2.3 / Task 4 | Pass |
| PRD-17-10 | PRD §17 | §2.5 / Task 6 | Pass |
| PRD-17-15 | PRD §17 | §2.6 / Task 7 (velocity added) | Pass |
| PRD-17-16 | PRD §17 | §2.1 / Task 2 | Pass |
| PRD-17-17 | PRD §17 | §2.1, §2.2 / Tasks 2, 3 | Pass |
| PRD-17-19 | PRD §17 | §2.9 / Task 10 (calls `search_project_kb`/`search_org_kb`) | Pass |
| PRD-17-20 | PRD §17 | §2.9, Task 1, Task 10 (Risk included) | Pass |
| PRD-17-21 | PRD §17 | §2.9 / Task 10 (auto-activation N=5 + toggle) | Pass |
| PRD-19-10 | PRD §19 | §2.7, §2.8 / Tasks 8, 9 | Pass |
| PRD-23-03 | PRD §23 | §2.13 / Task 14 (per-project + per-member + firm-wide alert per DECISION-09) | Pass |
| PRD-23-04 | PRD §23 | §2.8 / Task 9 | Pass |
| PRD-23-05 | PRD §23 | §2.7, §2.8 | Pass |
| PRD-23-06 | PRD §23 | §2.8 / Task 9 | Pass |
| PRD-23-07 | PRD §23 | §2.7, §2.8 | Pass |
| PRD-23-08 | PRD §23 | §2.7, §2.8 / Tasks 8, 9 (daily + weekly + monthly bucketing) | Pass |
| PRD-23-09 | PRD §23 | §2.7 / Tasks 8, 15 | Pass |
| PRD-23-12 | PRD §23 | §2.7, §2.8 / Tasks 8, 9 (Inngest event volume per DECISION-08) | Pass |
| ADD-5.2.4-01 | Addendum §5.2.4 | §2.14 / Task 16 (Briefing Pipeline invocation) | Pass |
| ADD-5.2.4-02 | Addendum §5.2.4 | §2.14 / Task 16 (5-min TTL + `inputs_hash`) | Pass |
| ADD-5.2.4-03 | Addendum §5.2.4 | §2.14 / Task 16 (Stage 3 narrative) | Pass |
| ADD-5.2.4-04 | Addendum §5.2.4 | §2.14 / Task 16 (Stage 4 validator) | Pass |
| ADD-5.2.4-05 | Addendum §5.2.4 | §2.14 / Task 16 (Stage 5 cache with `generated_at` + `inputs_hash`) | Pass |
| ADD-5.4-01 | Addendum §5.4 | §2.9 / Task 10 (substrate = `search_project_kb`/`search_org_kb`) | Pass |

**Wave 0 decision citations:** DECISION-05 (KA embedding consumed via `search_org_kb`), DECISION-08 (PRD-17-05 / PRD-23-03 firm-wide / PRD-23-12 orphans assigned here), DECISION-09 (firm-wide cost cap is advisory/alert-only).

**Briefing-type mapping (carry-forward #4 from thread 2026-04-13):** Phase 7 reuses the existing `daily_standup → Current Focus` and `weekly_status → Recommended Focus` mapping. Phase 7 does NOT introduce `current_focus` or `recommended_focus` enum values. All `§2.14` pipeline calls cite one of the existing briefing types.

---

## 1. Scope Summary

Rework the health score model from a weighted percentage formula to the PRD's signal counter model (Green/Yellow/Red). Add per-project configurable thresholds. Complete the briefing header with roadmap progress, requirements count, and health score badge. Add epic status section and structured recommended focus. Complete sprint dashboard with missing-fields check, developer workload view, and conflict alerts. Complete PM dashboard with risk register summary, upcoming deliverable deadlines, and client-facing items. Build the Usage & Costs settings tab as a standalone page with per-member breakdown, date range filter, and RBAC gating. Expand search to Story, OrgComponent, and BusinessProcess entity types in full-text search. Add semantic search mode toggle. Fix execution plan tab with phase grouping and dependency links. Consolidate duplicate pricing logic. Verify auto-refresh event wiring. Implement audit logging schema and basic write middleware. Implement per-project cost caps with enforcement in the agent harness.

**In scope:** 26 domain gaps + 3 deferred from Phase 1 + Wave 3 audit-fix additions (Task 16 Briefing Pipeline integration, firm-wide cost alert, Inngest event volume, velocity, weekly/monthly usage bucketing, `search_project_kb` substrate adoption) = 16 tasks total
**Deferred to V2:** GAP-DASH-020 semantic search expansion to project-entity embedding tables (Story, Question, Decision, Requirement, Risk) is Phase 11's responsibility per Addendum §5.4. In Phase 7 V1, Layer 3 semantic covers KnowledgeArticle, OrgComponent, and annotations via `search_org_kb`. GAP-DASH-008 AI-generated milestone summaries (local computation is acceptable for V1). GAP-DASH-023 Gantt-style dependency visualization (plain text with navigable links is sufficient for V1).

**Brought into V1 by Wave 3 audit-fix (2026-04-14):** GAP-DASH-018 Inngest event volume metric (PRD-23-12 is explicit per DECISION-08; implemented via Inngest middleware logging to an `event_audit` table -- see §2.7). Firm-wide monthly cost alert (PRD-23-03 third clause, advisory per DECISION-09 -- see §2.13). Current Focus narrative pipeline consumption (PRD-17-05 per DECISION-08 -- see §2.14). Team velocity on PM dashboard (PRD-17-15 -- see §2.6).

**Consolidation decisions:**
- GAP-DASH-001 + GAP-DASH-002 + GAP-DASH-003 + GAP-DASH-024 -> single health score rework task
- GAP-DASH-004 + GAP-DASH-006 -> briefing completeness task
- GAP-DASH-005 + GAP-DASH-007 -> briefing data quality task (blocking items + structured focus)
- GAP-DASH-009 + GAP-DASH-010 + GAP-DASH-011 -> sprint dashboard completeness task
- GAP-DASH-012 + GAP-DASH-013 + GAP-DASH-014 -> PM dashboard completeness task
- GAP-DASH-015 + GAP-DASH-016 + GAP-DASH-017 + GAP-RBAC-010 -> Usage & Costs tab (two tasks: backend + frontend)
- GAP-DASH-019 + GAP-DASH-021 -> search expansion task
- GAP-RBAC-014 -> audit logging task
- GAP-RBAC-016 -> cost caps task

---

## Addendum v1 Amendments (April 13, 2026)

These amendments integrate PRD Addendum v1 into Phase 7. They are additive -- existing requirements below are unchanged.

- **Briefing generation routing:** Briefing generation now routes through the Briefing/Status Pipeline (Phase 2). Phase 7 calls the pipeline with the appropriate `briefing_type` -- it does not implement its own AI generation.
- **Dashboard metrics are deterministic SQL.** Confirm all dashboard data comes from SQL queries, not AI inference. Sonnet synthesizes narrative prose around the deterministic metrics (via the Briefing Pipeline).
- **Search substrate:** `search_project_kb` (Phase 11 hybrid retrieval) is the substrate. Phase 7 builds the UI over this function. The three new entity type expansions (Story, OrgComponent, BusinessProcess) resolve to Layer 1/2 queries via `search_org_kb` for org entities.
- **What does not change:** Project overview, sprint analytics, team productivity view, risk/decision dashboards, filter UI, Usage & Costs tab, audit logging.

---

## 2. Functional Requirements

### 2.1 Health Score Rework -- Signal Counter Model (REQ-DASH-001)

- **What it does:** Replaces the weighted percentage health score (0-100 numeric) with the PRD's signal counter model. Signals are counted from four categories; score is Green (0 signals), Yellow (1-3 signals), Red (4+ signals). Thresholds are configurable per project. Health score is displayed as a compact badge in the briefing header bar.
- **Inputs:** Project ID. Per-project threshold configuration from `Project.healthScoreThresholds` JSON field (already exists in schema).
- **Outputs:** `{ status: "GREEN" | "YELLOW" | "RED", signalCount: number, breakdown: { staleQuestions: number, staleClientQuestions: number, staleBlockedItems: number, unmitigatedHighRisks: number } }`
- **Business rules:**
  - Default thresholds: `{ questionAgeDays: 7, clientFollowUpDays: 3, blockedItemDays: 5 }`. Stored in `Project.healthScoreThresholds` JSON. A settings UI control allows SA/PM to edit.
  - Signal 1 -- Stale questions: Count of open questions where `askedDate` is older than `questionAgeDays` threshold.
  - Signal 2 -- Client-owned questions past follow-up: Count of open questions where `owner` contains "Client" (case-insensitive match on `ownerDescription` field) and `askedDate` is older than `clientFollowUpDays` threshold.
  - Signal 3 -- Blocked items past threshold: Count of stories blocked by open questions where the question's `askedDate` is older than `blockedItemDays` threshold.
  - Signal 4 -- Unmitigated high-severity risks: Count of open risks with severity HIGH or CRITICAL and `mitigationStrategy` is null or empty.
  - The `HealthScore` interface changes from `{ score: number, descriptor: string, breakdown: ... }` to `{ status: "GREEN" | "YELLOW" | "RED", signalCount: number, breakdown: ... }`.
  - The `HealthScoreBreakdown` interface changes to match the four signal categories.
  - The health score component renders as a colored badge (green/yellow/red circle with signal count) in the briefing header, not as a card body.
  - Dashboard synthesis function passes the new health score shape to the cached briefing.
- **Files:** `src/lib/dashboard/queries.ts` (rewrite `computeHealthScore`), `src/components/dashboard/health-score.tsx` (rewrite to badge), `src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx` (move health score to header), `src/lib/inngest/functions/dashboard-synthesis.ts` (update cached shape)
- **Gaps addressed:** GAP-DASH-001, GAP-DASH-002, GAP-DASH-003, GAP-DASH-024

### 2.2 Health Score Threshold Settings UI (REQ-DASH-002)

- **What it does:** Adds a "Health Score Thresholds" section to project settings where SA/PM can configure the three threshold values.
- **Inputs:** Three integer fields: question age threshold (days), client follow-up threshold (days), blocked item threshold (days).
- **Outputs:** Updated `Project.healthScoreThresholds` JSON.
- **Business rules:**
  - Only SA and PM roles can view and edit thresholds (per RBAC matrix).
  - Validation: all values must be positive integers, max 90 days.
  - Default values shown when thresholds are null.
  - Server action `updateHealthScoreThresholds` with role check and Zod validation.
  - Fires `PROJECT_STATE_CHANGED` event after update to trigger briefing refresh.
- **Files:** `src/app/(dashboard)/projects/[projectId]/settings/page.tsx` (add section), `src/actions/project-settings.ts` (new action), `src/components/settings/health-score-thresholds-form.tsx` (new component)
- **Gaps addressed:** GAP-DASH-002 (settings UI portion)

### 2.3 Briefing Header Completeness (REQ-DASH-003)

- **What it does:** Adds missing header metrics to the discovery dashboard briefing: roadmap progress (milestone-level summary) and requirements count with unmapped count. Adds epic status section below the header.
- **Inputs:** Project ID.
- **Outputs:** Header bar with: health score badge, open questions count (with blocking count), blocked items count, roadmap progress summary, requirements count (with unmapped count).
- **Business rules:**
  - Roadmap progress: query milestones with their linked stories, compute per-milestone completion percentage, display as "X/Y milestones on track" summary stat.
  - Requirements count: total requirements count + count where status is CAPTURED (unmapped = not linked to any story via RequirementStory).
  - Epic status section: per-epic summary showing current phase (from EpicPhase where status = IN_PROGRESS), story counts by status, and completion percentage. Rendered as a compact table/grid below the header.
  - The `getBriefingMetrics` query in the tech spec already includes milestones and unmappedRequirements. The code implementation needs to expose these to the page and render them.
- **Files:** `src/lib/dashboard/queries.ts` (add `getEpicStatusSummary`, extend `getBriefingMetrics` to include requirements total), `src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx` (add header metrics + epic section), `src/components/dashboard/briefing-header.tsx` (new component), `src/components/dashboard/epic-status-section.tsx` (new component)
- **Gaps addressed:** GAP-DASH-004, GAP-DASH-006

### 2.4 Blocking Questions Data Quality and Structured Recommended Focus (REQ-DASH-004)

**REQ-IDs traced:** PRD-17-03, PRD-17-04, PRD-6-21, PRD-8-22.

- **What it does:** Enriches blocked-items display with question age, owner, and affected-stories fields. The structured `recommendedFocus` array is produced by the Briefing/Status Pipeline (see §2.14), not by an ad hoc prompt in the legacy `dashboard-synthesis` task.
- **Inputs:** Blocked items query results. `CachedBriefing` output from the Briefing/Status Pipeline (§2.14).
- **Outputs:** Blocked items with `askedDate` age, `ownerDescription`, and `affectedStories: Array<{ storyId, storyDisplayId, storyTitle }>`. Recommended focus as `Array<{ rank: number, questionId: string, questionDisplayId: string, questionText: string, reasoning: string }>` sourced from pipeline output.
- **Business rules:**
  - `getBlockedItems` query selects `askedDate`, `ownerDescription`, and joins through the question-to-story relation (e.g., `QuestionStory` or the equivalent join on the Phase 4 data model) to return `affectedStories` with `storyId`, `storyDisplayId`, `storyTitle`.
  - `blocked-items.tsx` renders age as "X days old", owner name, and a comma-separated or pill list of affected story display IDs, each linked to its story detail page.
  - `CachedBriefing.recommendedFocus` is typed as `Array<{ rank: number, questionId: string, questionDisplayId: string, questionText: string, reasoning: string }> | null`. Populated by the pipeline per §2.14.
  - `ai-summary-card` renders recommended focus as a numbered list with question displayId links and reasoning text.
  - Backward compatibility: if a legacy cached row contains a string `recommendedFocus`, render it as prose with a "Refresh" button that triggers `invokeBriefingPipeline(..., { bypassCache: true })`.
  - **Prompt ownership (resolves PHASE-7-GAP-01):** The structured recommendedFocus prompt lives in the Phase 2 Briefing/Status Pipeline (`briefing_type = weekly_status` per the carry-forward mapping). Task 5 does NOT edit `src/lib/agent-harness/tasks/dashboard-synthesis.ts` prompt text; that legacy path is removed or delegates to the pipeline per Task 16.
- **Files:** `src/lib/dashboard/queries.ts` (fields + story join on blocked items), `src/components/dashboard/blocked-items.tsx` (age + owner + affected-stories columns), `src/components/dashboard/ai-summary-card.tsx` (structured render + legacy fallback)
- **Gaps addressed:** GAP-DASH-005, GAP-DASH-007, PHASE-7-GAP-08

### 2.5 Sprint Dashboard Completeness (REQ-DASH-005)

- **What it does:** Adds three missing sections to the sprint dashboard: stories missing mandatory fields, developer workload view, and conflict alerts.
- **Inputs:** Sprint ID, sprint stories with assignees and story components.
- **Outputs:** Three new UI sections on the sprint dashboard tab.
- **Business rules:**
  - **Missing mandatory fields:** Query stories in the current sprint where `acceptanceCriteria` is null/empty OR `storyComponents` has zero entries. Display as a warning card with story links. This helps PMs identify stories not ready for development.
  - **Developer workload:** Group sprint stories by `assigneeId`, join to `ProjectMember.displayName`. Show per-developer: story count, total story points, and status breakdown. Render as a compact table. "Unassigned" group for stories with null assignee.
  - **Conflict alerts:** The sprint already has `cachedAnalysis` JSON with a `conflicts` array (populated by sprint intelligence from Phase 5). Render the conflicts on the Dashboard tab, not just Plan/Board tabs. Filter out `dismissed: true` conflicts. Show as warning banners with developer names and conflicting components.
- **Files:** `src/components/sprints/sprint-dashboard.tsx` (add sections), `src/components/sprints/missing-fields-card.tsx` (new), `src/components/sprints/developer-workload-table.tsx` (new), `src/components/sprints/dashboard-conflict-alerts.tsx` (new), `src/actions/sprints.ts` (add query for missing fields)
- **Gaps addressed:** GAP-DASH-009, GAP-DASH-010, GAP-DASH-011

### 2.6 PM Dashboard Completeness (REQ-DASH-006)

**REQ-IDs traced:** PRD-17-15 (includes velocity per Wave 3 audit-fix).

- **What it does:** Adds risk register summary, upcoming deliverable deadlines, client-facing items, and team velocity to the PM dashboard.
- **Inputs:** Project ID.
- **Outputs:** Three new sections in PM dashboard data and UI.
- **Business rules:**
  - **Risk register summary:** Query risks grouped by severity (CRITICAL, HIGH, MEDIUM, LOW) and status (OPEN, MITIGATED, CLOSED). Display as a compact summary: "X active risks (Y critical, Z high)". Show top 5 open risks sorted by severity DESC, then createdAt ASC. Add to `PmDashboardData` as `riskSummary: { bySeverity: Record<string, number>, topOpenRisks: Array<{ displayId, description, severity, mitigationStrategy }> }`.
  - **Upcoming deliverable deadlines:** Query milestones with `targetDate` not null and `status != COMPLETE`, sorted by targetDate ASC, limited to next 5. Include computed progress from linked stories. Add to `PmDashboardData` as `upcomingDeadlines: Array<{ milestoneName, targetDate, progress, daysRemaining }>`.
  - **Client-facing items:** Query open questions where `ownerDescription` contains "Client" (case-insensitive) and `askedDate` is older than `clientFollowUpDays` threshold (from project health score thresholds, default 3 days). Add to `PmDashboardData` as `clientItems: Array<{ questionDisplayId, questionText, age, owner }>`.
  - **Team velocity (PRD-17-15):** Compute `velocity: { completedPointsByPast3Sprints: number[], averagePerSprint: number }`. Source: sum of story points for stories in the last 3 COMPLETED sprints where `story.status = DONE`. If fewer than 3 completed sprints exist, return the available entries; `averagePerSprint` averages across present entries only. Rendered as a compact card with sparkline or bar strip plus the average.
  - The PM dashboard synthesis Inngest function is updated to compute these four new data sections.
- **Files:** `src/lib/inngest/functions/pm-dashboard-synthesis.ts` (add risk, deadline, client item queries), `src/components/pm-dashboard/risk-summary-card.tsx` (new), `src/components/pm-dashboard/upcoming-deadlines-card.tsx` (new), `src/components/pm-dashboard/client-items-card.tsx` (new), `src/app/(dashboard)/projects/[projectId]/pm-dashboard/page.tsx` (add sections)
- **Gaps addressed:** GAP-DASH-012, GAP-DASH-013, GAP-DASH-014

### 2.7 Usage & Costs Backend (REQ-DASH-007)

**REQ-IDs traced:** PRD-23-04, PRD-23-05, PRD-23-06, PRD-23-07, PRD-23-08, PRD-23-09, PRD-23-12, PRD-19-10. **Decision cited:** DECISION-08 (PRD-23-12 orphan assigned to Phase 7).

- **What it does:** Builds the complete backend for the Usage & Costs settings tab: per-member breakdown, date range filtering, trend data (daily/weekly/monthly), Inngest event volume, and RBAC enforcement.
- **Inputs:** Project ID, date range (start, end), requesting user's role.
- **Outputs:** `UsageDashboardData` with project totals, by-task-type breakdown, by-member breakdown, and daily trend.
- **Business rules:**
  - Extend `getTokenUsageSummary` to accept `startDate` and `endDate` parameters. Default to last 30 days when not specified.
  - Add `getUsageByMember` function that groups SessionLog by `userId`, joins to `ProjectMember` for display names. Only callable by SA/PM.
  - Add `getDailyUsageTrend(projectId, startDate, endDate)` returning daily aggregates.
  - Add `getWeeklyUsageTrend(projectId, startDate, endDate)` returning weekly aggregates (ISO week bucket).
  - Add `getMonthlyUsageTrend(projectId, startDate, endDate)` returning calendar-month aggregates.
  - Add `getInngestEventVolume(projectId, startDate, endDate): Promise<Array<{ eventName: string, count: number }>>`. Source: new `event_audit` table populated by an Inngest middleware (`src/lib/inngest/middleware/event-audit.ts`) that logs every event fire with `(projectId, eventName, firedAt)`. The middleware is added once and applied globally; no per-event opt-in. Schema additions land in Task 1.
  - Consolidate duplicate pricing logic: remove the inline `estimateCost()` function in `pm-dashboard-synthesis.ts` and import `calculateCost` from `src/lib/config/ai-pricing.ts` everywhere.
  - `getUsageDashboard` server action return type: `UsageDashboardData = { projectTotals, byTaskType, byMember, trend: { bucket: "day" | "week" | "month", points: Array<{ date: string, tokens: number, costCents: number }> }, eventVolume: Array<{ eventName: string, count: number }> }`. `requireRole(["SOLUTION_ARCHITECT", "PM"])` enforced.
  - The tech spec already defines `getProjectUsage`, `getUsageByTaskType`, `getUsageByMember`, and `getDailyUsageTrend` in Section 5.3. The existing `usage-queries.ts` implements only `getTokenUsageSummary` (all-time, by-task-type only). Rewrite to match the tech spec signatures.
- **Files:** `src/lib/dashboard/usage-queries.ts` (rewrite with date range + by-member + daily/weekly/monthly trend + event volume), `src/lib/config/ai-pricing.ts` (single source of truth), `src/lib/inngest/middleware/event-audit.ts` (new -- logs every event fire), `src/lib/inngest/functions/pm-dashboard-synthesis.ts` (remove duplicate estimateCost), `src/actions/usage.ts` (new server action with RBAC), `prisma/schema.prisma` (add `event_audit` table -- see Task 1)
- **Gaps addressed:** GAP-DASH-016, GAP-DASH-017, GAP-DASH-025, GAP-RBAC-010 (backend), GAP-DASH-018 (Inngest event volume), PHASE-7-GAP-03, PHASE-7-GAP-10

### 2.8 Usage & Costs Settings Tab UI (REQ-DASH-008)

- **What it does:** Creates a dedicated "Usage & Costs" tab in project settings, visible only to SA and PM.
- **Inputs:** Usage dashboard data from server action.
- **Outputs:** Full-page settings tab with: project totals, breakdown by task type (table), breakdown by team member (table), daily trend chart, date range selector.
- **Business rules:**
  - Tab appears in project settings navigation only for SA and PM roles.
  - Date range selector with presets: Last 7 days, Last 30 days, Current sprint, All time, Custom range.
  - Project totals section: total tokens, estimated cost, session count.
  - Task type breakdown: table with columns taskType, tokens, cost, percentage-of-total.
  - Member breakdown: table with columns member name, tokens, cost, session count. Individual users do not see other users' consumption -- this is SA/PM only.
  - Trend chart: line chart. Bucket auto-switches by selected range: `≤31 days → day`, `32-120 days → week`, `>120 days → month`. Optional user override control (Day / Week / Month).
  - Event Volume card (below task-type breakdown): table of Inngest event names and fire counts over the selected date range, sourced from `getInngestEventVolume`.
  - Loading states with skeleton UI for each section.
- **Files:** `src/app/(dashboard)/projects/[projectId]/settings/usage/page.tsx` (new page), `src/components/settings/usage-dashboard.tsx` (new), `src/components/settings/usage-trend-chart.tsx` (new), `src/app/(dashboard)/projects/[projectId]/settings/layout.tsx` (add tab)
- **Gaps addressed:** GAP-DASH-015, GAP-RBAC-010 (UI)

### 2.9 Search Entity Expansion via Shared Retrieval Substrate (REQ-DASH-009)

**REQ-IDs traced:** PRD-17-19, PRD-17-20, PRD-17-21, ADD-5.4-01. **Decisions cited:** DECISION-05 (Phase 5/7 consume via `search_org_kb`).

- **What it does:** Expands global search to cover Story, Question, Decision, Requirement, Risk, OrgComponent, BusinessProcess, and KnowledgeArticle. Implements a thin adapter in `global-search.ts` that fans out to `search_project_kb` (project-scoped entities) and `search_org_kb` (org-scoped entities), then merges grouped results and applies UI facets. Adds a semantic/keyword mode toggle plus a "few results" auto-activation heuristic for Layer 3.
- **Inputs:** Search query, selected entity types, search mode preference, project ID.
- **Outputs:** `GroupedSearchResults` across all 8 entity types. Mode toggle + informational chip in command palette.
- **Business rules:**
  - Adapter contract: `global-search.ts` exports `globalSearch(options: SearchOptions): Promise<GroupedSearchResults>`. Internally it calls `search_project_kb({ projectId, query, entities, semantic })` for Question, Decision, Requirement, Risk, Story, annotations; and `search_org_kb({ query, entities, semantic })` for OrgComponent, BusinessProcess, KnowledgeArticle. The adapter does NOT write its own `to_tsvector` / `to_tsquery` SQL -- the substrate functions own BM25/hybrid retrieval.
  - `SearchEntityType` union: `"question" | "decision" | "requirement" | "risk" | "story" | "orgComponent" | "businessProcess" | "knowledgeArticle"`.
  - `GroupedSearchResults` includes `questions`, `decisions`, `requirements`, `risks`, `stories`, `orgComponents`, `businessProcesses`, `knowledgeArticles` arrays.
  - Risk is included in full-text scope per PRD-17-20. Substrate's tsvector covers Risk's `title` + `description` + `mitigationStrategy`.
  - Envelope handling per DECISION-05: `search_project_kb` / `search_org_kb` return `SearchResponse` with `_meta: { not_implemented?: boolean }`. Adapter branches on `_meta.not_implemented` (not on array length) and, if set, surfaces the substrate's pending state to the UI.
  - Search response envelope `SearchResponse<T>`: `{ results: T[], _meta: { not_implemented?: boolean, layerUsed: 1 | 2 | 3, totalResults: number } }`.
  - **Smart Search toggle:** command palette has a "Smart Search" toggle. When on, adapter passes `semantic: true` to both substrates. Default off to control embedding cost.
  - **Layer 3 auto-activation (PRD-17-21):** if the toggle is off AND the combined Layer 1+2 `totalResults` across all entity groups is fewer than `SMART_SEARCH_AUTO_THRESHOLD = 5`, the adapter re-issues the call with `semantic: true`. The UI shows a chip: "Few keyword results -- semantic results included." The threshold is a TypeScript constant in `src/lib/search/global-search.ts`.
  - **Layer 3 V1 coverage (resolves contradiction with the prior V1 note):** Semantic in V1 covers KnowledgeArticle, OrgComponent, and annotations through `search_org_kb`. Project entities (Story, Question, Decision, Requirement, Risk) get Layer 1/2 only in V1; their embedding tables roll out in Phase 11 per Addendum §5.4. When Smart Search is on and only project-entity results return, the UI shows a secondary chip: "Semantic search is not yet available for these entity types -- rolling out in a later phase."
  - **tsvector migrations (pre-embedding BM25):** Task 1 retains tsvector column/trigger work for entities not yet covered by Phase 11 embedding tables. These columns are consumed by the substrate, not by `global-search.ts`.
- **Files:** `src/lib/search/global-search.ts` (rewrite as thin adapter; must not reference `to_tsvector` or `to_tsquery`), `src/components/search/command-palette.tsx` (add toggle + chips + 8 result groups), `prisma/migrations/` (tsvector columns/triggers where missing, consumed by substrate)
- **Gaps addressed:** GAP-DASH-019, GAP-DASH-021, PHASE-7-GAP-02, PHASE-7-GAP-06

### 2.10 Execution Plan Tab Improvements (REQ-DASH-010)

- **What it does:** Adds phase grouping within epics and navigable dependency links to the execution plan tab.
- **Inputs:** Epic stories with phase assignments and dependency data.
- **Outputs:** Stories grouped by phase within each epic. Dependency references rendered as clickable links.
- **Business rules:**
  - Phase grouping: within each epic section, group stories by the EpicPhase they belong to (determined by story status mapping: DRAFT/READY = Discovery/Design, SPRINT_PLANNED/IN_PROGRESS/IN_REVIEW = Build, QA = Test, DONE = Deploy). Show phase subheaders.
  - Dependency links: the `storyDependencies` relation (if it exists) or component overlap data from sprint intelligence provides dependency info. Render dependency story IDs as clickable links that scroll to / navigate to the target story. If no explicit dependency model exists, show component overlap as "Shares components with: STORY-FM-003" with a link.
  - This is a UI-only enhancement to `execution-plan-tab.tsx`. No backend changes.
- **Files:** `src/components/roadmap/execution-plan-tab.tsx` (add phase grouping + dependency links)
- **Gaps addressed:** GAP-DASH-022, GAP-DASH-023

### 2.11 Auto-Refresh Event Wiring Verification (REQ-DASH-011)

- **What it does:** Audits all mutation actions to verify they fire `PROJECT_STATE_CHANGED` events when they should, then adds missing event emissions.
- **Inputs:** Code audit of all server actions that modify project state.
- **Outputs:** Complete event coverage so dashboard synthesis triggers correctly.
- **Business rules:**
  - The following mutations must fire `PROJECT_STATE_CHANGED`: question answered, question created, decision recorded, requirement created/updated, risk created/updated/severity changed, story status changed, story created, milestone status changed, epic phase changed.
  - Audit each action file. For any mutation that does not emit the event, add the `inngest.send({ name: EVENTS.PROJECT_STATE_CHANGED, data: { projectId } })` call.
  - The dashboard synthesis function already has 30-second debounce per project, so rapid-fire events are safe.
  - Document in a table which actions already fire and which were added.
- **Files:** `src/actions/*.ts` (audit and patch), `src/lib/inngest/events.ts` (no changes expected -- event already defined)
- **Gaps addressed:** GAP-DASH-026

### 2.12 Audit Logging Schema and Basic Implementation (REQ-DASH-012)

- **What it does:** Creates an AuditLog table and basic middleware to write audit entries on significant mutations. V1 scope: write-path logging only (who changed what, when). Full read-path access logging and query UI are V2.
- **Inputs:** User action context (userId, action type, entity type, entity ID, before/after values).
- **Outputs:** AuditLog rows for each audited mutation.
- **Business rules:**
  - AuditLog schema: `id` (UUID PK), `projectId` (FK -> Project), `userId` (String, Clerk user ID), `action` (enum: CREATE, UPDATE, DELETE, STATUS_CHANGE, ROLE_CHANGE, ARCHIVE), `entityType` (String -- "Story", "Question", "Decision", etc.), `entityId` (UUID), `entityDisplayId` (String, nullable), `changes` (JSON, nullable -- `{ field: { old: X, new: Y } }` for updates), `ipAddress` (String, nullable), `createdAt` (DateTime).
  - Index on `(projectId, createdAt DESC)` and `(projectId, entityType, entityId)`.
  - Create a utility function `writeAuditLog(params)` that writes a row. This function is called from server actions, not from Prisma middleware (to avoid capturing internal system writes).
  - V1 logged actions: story status changes, question status changes, member role changes, project archive/reactivate, sprint create/update, risk severity changes, decision creation. These are the security-relevant mutations.
  - No UI for viewing audit logs in V1. The data exists for compliance queries via direct database access or a future admin UI.
  - Existing `audit-log.ts` Inngest function handles sensitive ops (token access, API key operations). This new `writeAuditLog` utility covers broader mutation logging and writes synchronously (no Inngest event needed -- these are lightweight INSERT operations).
- **Files:** `prisma/schema.prisma` (add AuditLog model), `src/lib/audit/write-audit-log.ts` (new utility), `src/actions/stories.ts`, `src/actions/questions.ts`, `src/actions/members.ts`, `src/actions/sprints.ts`, `src/actions/risks.ts`, `src/actions/decisions.ts` (add writeAuditLog calls to key mutations)
- **Gaps addressed:** GAP-RBAC-014

### 2.13 Cost Caps -- Per-Project (Blocking), Per-Member (Blocking), Firm-Wide (Advisory) (REQ-DASH-013)

**REQ-IDs traced:** PRD-23-03. **Decisions cited:** DECISION-08 (firm-wide orphan assigned to Phase 7), DECISION-09 (firm-wide advisory only in V1).

- **What it does:** Adds configurable monthly cost caps per project (blocking), optional per-member daily session limit (blocking), and a firm-wide monthly advisory alert (alert-only, does NOT block execution per DECISION-09). Pre-flight enforcement in the agent harness for per-project and per-member. Firm-wide runs on a daily cron.
- **Inputs:** Project cost cap configuration. Current month's usage from SessionLog.
- **Outputs:** Blocked AI execution when cap exceeded. Notification alerts at 80% and 100% thresholds.
- **Business rules:**
  - Add `monthlyCostCapCents` (Int, nullable) to the Project model. When null, no cap enforced. Stored in cents to avoid floating point issues.
  - Add `dailySessionLimit` (Int, nullable) to ProjectMember model. When null, no per-member daily limit.
  - Create a `checkCostCap(projectId, userId)` function that:
    1. Queries current month's total cost from SessionLog aggregation.
    2. Compares against `project.monthlyCostCapCents`.
    3. If exceeded, throws a `CostCapExceededError` with a user-friendly message.
    4. If at 80% threshold, emits a `NOTIFICATION_SEND` event with type `COST_THRESHOLD_WARNING` to PM + SA.
    5. Checks daily session count for the requesting user against `dailySessionLimit`.
  - The `executeTask` function in the agent harness calls `checkCostCap` before invoking the AI. This is a pre-flight check, not a post-flight check.
  - Cost cap settings are configurable in project settings (SA/PM only). Simple form with monthly cap amount and optional per-member daily limit.
  - Alert notifications: at 80% of cap, send warning. At 100%, send critical alert and block further AI calls. Both fire `NOTIFICATION_SEND` events.
  - A "cap exceeded" state is recoverable: SA can increase the cap or wait for the next billing month.
  - **Concurrency safety (PHASE-7-GAP-05):** The 99%-cap race is closed by a Postgres advisory lock keyed on `projectId` around the read-check-debit path. `checkCostCap` acquires `pg_advisory_xact_lock(hashtext('cost-cap:' || projectId))` inside the same transaction that reads the month-to-date total. Cap decisions made inside the lock are authoritative; concurrent calls serialize.
  - **Multi-stage pipeline (PHASE-7-GAP-05):** Cap check runs per pipeline stage, not once per invocation. A pipeline may be admitted at Stage 1 and rejected at Stage 3 if aggregate spend crosses the cap. Callers handle `CostCapExceededError` between stages and surface a resumable state.
  - **Cap raised mid-cycle (PHASE-7-GAP-05):** When `monthlyCostCapCents` is changed, `Project.costCapAlertFiredAt` (new nullable column on Project, added in Task 1) is cleared so the 80% alert can fire again for the new cap value. A matching clear occurs on `firmCostCapAlertFiredAt` when the firm config changes.
  - **Time zone (PHASE-7-GAP-05):** "Current calendar month" is UTC. "Start of day" for the daily session limit is UTC midnight. Documented in code comments and the form help text.
  - **Aborted sessions (PHASE-7-GAP-05):** Aborted SessionLog rows count toward the daily session limit (the user still consumed an AI slot). Cost rollup for the monthly cap uses actual token usage recorded on the row (zero if the request never hit the model).
  - **Firm-wide advisory (PRD-23-03, DECISION-09):** `checkFirmCostCap()` runs on a daily Inngest cron at 06:00 UTC. Reads `FIRM_MONTHLY_COST_CAP_CENTS` from `src/lib/config/cost-caps.ts` (TypeScript constant fallback + env override `FIRM_MONTHLY_COST_CAP_CENTS`). Aggregates SessionLog across all projects for the current UTC calendar month. Emits `FIRM_COST_THRESHOLD_WARNING` at 80%, `FIRM_COST_CAP_EXCEEDED` at 100%. Advisory only -- does NOT call `checkCostCap` or short-circuit `executeTask`. Recipients: users with role `FIRM_ADMIN` (or PM/SA if no `FIRM_ADMIN` role is defined at V1 -- document the fallback). Optional forward-compatible flag `firmCapBlocksExecution` (default `false`) reserved for a future V2 tightening; V1 ignores it.
  - **`CostCapExceededError` interface (pinned):**
    ```ts
    export class CostCapExceededError extends Error {
      code: "COST_CAP_EXCEEDED"
      projectId: string
      currentCents: number
      capCents: number
      userMessage: string
      scope: "project" | "member_daily"
    }
    ```
    Serialized to the UI as `{ code, scope, userMessage, capCents, currentCents }`. Action handlers catch and convert to a 409-style response.
  - **`NOTIFICATION_SEND` payload shape for cost alerts (pinned):**
    ```ts
    type CostNotification = {
      type: "COST_THRESHOLD_WARNING" | "COST_CAP_EXCEEDED"
          | "FIRM_COST_THRESHOLD_WARNING" | "FIRM_COST_CAP_EXCEEDED"
      projectId?: string   // omitted for firm-wide
      thresholdPct: 80 | 100
      currentCents: number
      capCents: number
      recipients: string[] // user IDs
    }
    ```
    **Dedupe window:** 24 hours per `(projectId, type)` within the current UTC calendar month, tracked via `Project.costCapAlertFiredAt` + `Project.costCapAlertType`. Firm-wide uses a `FirmCostState` table row keyed by `YYYY-MM` with analogous fields.
- **Files:** `prisma/schema.prisma` (add `monthlyCostCapCents`, `dailySessionLimit`, `costCapAlertFiredAt`, `costCapAlertType`, `FirmCostState` table), `src/lib/agent-harness/cost-cap.ts` (`checkCostCap` with advisory lock), `src/lib/agent-harness/engine.ts` (per-stage pre-flight), `src/lib/inngest/functions/firm-cost-check.ts` (new daily cron), `src/lib/config/cost-caps.ts` (new -- firm cap config), `src/actions/project-settings.ts`, `src/components/settings/cost-cap-form.tsx`
- **Gaps addressed:** GAP-RBAC-016, PHASE-7-GAP-04, PHASE-7-GAP-05

### 2.14 Briefing/Status Pipeline Integration (REQ-DASH-014)

**REQ-IDs traced:** ADD-5.2.4-01, ADD-5.2.4-02, ADD-5.2.4-03, ADD-5.2.4-04, ADD-5.2.4-05, PRD-6-21, PRD-6-22, PRD-17-03, PRD-17-05. **Decision cited:** DECISION-08 (PRD-17-05 Current Focus consumed here; Phase 2 emits).

- **What it does:** Replaces the legacy `src/lib/agent-harness/tasks/dashboard-synthesis.ts` narrative path with explicit calls into the Phase 2 Briefing/Status Pipeline. All Phase 7 AI-generated briefing content (Current Focus narrative, Recommended Focus ranked list, discovery gap summaries, weekly status prose) is produced by the pipeline and read from its cache. Phase 7 does not call Sonnet directly.
- **Inputs:** `projectId`, `briefingType`, optional `bypassCache` flag.
- **Outputs:** `CachedBriefing` rows per `(projectId, briefingType)` containing `currentFocus: string | null`, `recommendedFocus: Array<{ rank, questionId, questionDisplayId, questionText, reasoning }> | null`, `generatedAt`, `inputsHash`.
- **Business rules:**
  - **Briefing-type mapping (carry-forward #4 -- do NOT add new enum values):**
    - Discovery dashboard Current Focus narrative → `daily_standup`
    - Discovery dashboard Recommended Focus ranked list → `weekly_status`
    - PM dashboard Current Focus → `daily_standup`
    - Discovery gap summary (optional pipeline type already in Phase 2 scope) → `discovery_gap_report` if and only if Phase 2 exposes it; otherwise discovery gap narrative is served from `weekly_status` output.
    - Sprint dashboard AI narrative (if any rendered) → reuses `weekly_status`. No `sprint_health` type added in Phase 7.
  - **Caller contract:** Phase 2 exposes `invokeBriefingPipeline(projectId: string, briefingType: BriefingType, opts?: { bypassCache?: boolean }): Promise<CachedBriefing>`. Phase 7 imports this function; it does not re-implement any pipeline stage.
  - **Cache consumption:** Dashboard pages read `CachedBriefing` rows directly for read paths (fast, no AI cost). Writes happen only through the pipeline.
  - **Stage 4 validator (ADD-5.2.4-04):** The pipeline's deterministic Stage 4 validator (forbidden phrases/typography, numeric parity with deterministic metrics from Stage 1) runs on Sonnet output. If validation fails the pipeline does NOT write the cache row; the prior cached row remains authoritative. Phase 7 surfaces a non-blocking "narrative pending" state to the UI when no cache row exists.
  - **Stage 5 cache (ADD-5.2.4-05):** Cache row includes `generated_at` and `inputs_hash` (SHA-256 over the canonicalized Stage 1 deterministic metrics input). Phase 7 never writes these fields directly.
  - **TTL + debounce + manual refresh interaction (PHASE-7-GAP-09):**
    - `PROJECT_STATE_CHANGED` events enqueue a debounced regeneration at a 30-second window per `(projectId, briefingType)` (debounce already in Phase 2).
    - On regeneration, the pipeline recomputes `inputs_hash`. If unchanged AND the cache row is younger than 5 minutes (ADD-5.2.4-02 TTL), Stages 2-4 are skipped; the pipeline bumps `generated_at` and returns the existing row (Stage 1 metrics always re-read).
    - Manual refresh: Phase 7 calls `invokeBriefingPipeline(..., { bypassCache: true })`. This ignores TTL and `inputs_hash` equality, always runs Stages 2-4, and emits `BRIEFING_REGENERATED` on success (listed in §5 Integration Points).
    - If `PROJECT_STATE_CHANGED` fires while a regeneration is in flight, the new job is enqueued behind the in-flight one (no dedupe against in-flight).
  - **Legacy path removal:** `src/lib/agent-harness/tasks/dashboard-synthesis.ts` is either deleted or reduced to a thin shim that delegates to `invokeBriefingPipeline` with `briefing_type = daily_standup` (or `weekly_status`) and throws if Phase 2 is not deployed. Task 5 no longer edits this file's prompt.
- **Files:** `src/lib/pipelines/briefing-status/invoke.ts` (published by Phase 2; imported here), `src/lib/dashboard/briefing-loader.ts` (new -- reads `CachedBriefing` and invokes pipeline on manual refresh), `src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx` (sources Current Focus + Recommended Focus from `CachedBriefing`), `src/app/(dashboard)/projects/[projectId]/pm-dashboard/page.tsx` (same), `src/lib/agent-harness/tasks/dashboard-synthesis.ts` (removed or shimmed)
- **Gaps addressed:** PHASE-7-GAP-01, PHASE-7-GAP-09

---

## 3. Technical Approach

### 3.1 Strategy

This phase is primarily a completeness pass -- filling gaps in existing dashboard pages, expanding search coverage, and adding missing infrastructure (audit logging, cost caps). Most tasks modify existing files rather than creating new subsystems.

The work is organized into functional areas that can be developed somewhat independently:

1. **Health score rework** (Tasks 1-2): Foundation change that affects multiple dashboards.
2. **Briefing completeness** (Tasks 3-4): Discovery dashboard data and UI.
3. **Sprint + PM dashboard** (Tasks 5-6): Adding missing sections to existing pages.
4. **Usage & Costs** (Tasks 7-8): New settings tab (backend then frontend).
5. **Search expansion** (Task 9): Expanding the global search system.
6. **Execution plan + auto-refresh** (Tasks 10-11): UI polish and event wiring.
7. **Infrastructure** (Tasks 12-15): Schema migration, audit logging, cost caps.
8. **Briefing/Status Pipeline integration** (Task 16): Replace legacy `dashboard-synthesis` prompt path with calls into the Phase 2 pipeline (§2.14).

### 3.2 File Structure

New files:
```
src/lib/audit/write-audit-log.ts         -- Audit log utility
src/lib/agent-harness/cost-cap.ts        -- Cost cap enforcement
src/actions/usage.ts                      -- Usage dashboard server action
src/actions/project-settings.ts           -- Settings actions (thresholds, cost caps)
src/components/dashboard/briefing-header.tsx
src/components/dashboard/epic-status-section.tsx
src/components/settings/health-score-thresholds-form.tsx
src/components/settings/usage-dashboard.tsx
src/components/settings/usage-trend-chart.tsx
src/components/settings/cost-cap-form.tsx
src/components/sprints/missing-fields-card.tsx
src/components/sprints/developer-workload-table.tsx
src/components/sprints/dashboard-conflict-alerts.tsx
src/components/pm-dashboard/risk-summary-card.tsx
src/components/pm-dashboard/upcoming-deadlines-card.tsx
src/components/pm-dashboard/client-items-card.tsx
src/app/(dashboard)/projects/[projectId]/settings/usage/page.tsx
```

Modified files:
```
prisma/schema.prisma                     -- AuditLog model, cost cap fields
src/lib/dashboard/queries.ts             -- Health score rewrite, new queries
src/lib/dashboard/usage-queries.ts       -- Full rewrite with date range + member
src/lib/search/global-search.ts          -- 3 new entity types + mode toggle
src/lib/inngest/functions/dashboard-synthesis.ts
src/lib/inngest/functions/pm-dashboard-synthesis.ts
src/lib/agent-harness/engine.ts          -- Cost cap pre-flight
src/lib/agent-harness/tasks/dashboard-synthesis.ts
src/components/dashboard/health-score.tsx
src/components/dashboard/blocked-items.tsx
src/components/dashboard/ai-summary-card.tsx
src/components/search/command-palette.tsx
src/components/sprints/sprint-dashboard.tsx
src/components/roadmap/execution-plan-tab.tsx
src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx
src/app/(dashboard)/projects/[projectId]/pm-dashboard/page.tsx
src/app/(dashboard)/projects/[projectId]/settings/layout.tsx
src/actions/*.ts                         -- Audit log calls + event wiring
```

### 3.3 Data Changes

**Schema additions:**
- `AuditLog` model (new table)
- `event_audit` model (new table -- Inngest event fire log; columns: `id`, `projectId` nullable, `eventName`, `firedAt`, GIN/index on `(projectId, firedAt)`, `(eventName)`)
- `FirmCostState` model (new table -- key `yearMonth` (e.g., `2026-04`), fields `firmCostCapAlertFiredAt`, `firmCostCapAlertType`)
- `Project.monthlyCostCapCents` (Int, nullable)
- `Project.costCapAlertFiredAt` (DateTime, nullable)
- `Project.costCapAlertType` (String, nullable -- `"COST_THRESHOLD_WARNING" | "COST_CAP_EXCEEDED"`)
- `ProjectMember.dailySessionLimit` (Int, nullable)

**Schema modifications:**
- `Project.healthScoreThresholds` JSON field already exists but needs documented default structure

**tsvector migrations (if not done by Phase 6):**
- `Story.search_vector` column + GIN index + trigger
- `OrgComponent.search_vector` column + GIN index + trigger
- `BusinessProcess.search_vector` column + GIN index + trigger

---

## 4. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Health score with zero questions | Return GREEN with 0 signals (no questions = no stale questions) |
| Health score with no risks | 0 signals from risk category |
| Recommended focus returns unparseable JSON from AI | Fall back to rendering raw text with "Refresh" button |
| Old cached briefing has string `recommendedFocus` | Detect type at render time, show as prose with refresh prompt |
| Usage queries with no SessionLog data | Return zero values, show "No AI usage recorded" in UI |
| Date range with no data | Show empty state, not error |
| Cost cap not set (null) | Skip enforcement entirely |
| Cost cap check when SessionLog has no model field | Use default model pricing |
| Search for entity type with no search_vector column | Skip that entity type, log warning |
| Multiple rapid mutations triggering dashboard synthesis | Debounce (30s) already in place on Inngest function |
| Audit log write failure | Log error but do not block the mutation (non-critical path) |
| Sprint with no cachedAnalysis for conflict alerts | Show "Run sprint analysis to see conflicts" message |
| Milestone with null targetDate | Show "TBD" in deadline list, sort to bottom |
| Execution plan with stories that have no phase mapping | Show in "Unphased" group |
| Concurrent `executeTask` at 99% of per-project cap | `checkCostCap` wraps read + decision in a Postgres advisory lock `pg_advisory_xact_lock(hashtext('cost-cap:'||projectId))`; concurrent callers serialize and the last-admitted call that pushes over the cap raises `CostCapExceededError` |
| Multi-stage pipeline mid-flight when cap crosses | Cap check runs per stage. Stage 1 admit does not exempt Stage 3; callers catch `CostCapExceededError` between stages and surface resumable state |
| Cap value raised after an alert already fired | On `monthlyCostCapCents` change, clear `costCapAlertFiredAt` + `costCapAlertType` so the 80% warning can fire again for the new value. Same for firm-wide via `FirmCostState` |
| "Current calendar month" time zone | UTC. Documented in form help text. Daily session limit window is also UTC (midnight to midnight) |
| Aborted sessions and the daily session limit | Counted toward daily session limit (slot consumed). Cost rollup uses actual tokens on the row (0 if request never reached the model) |
| Semantic search toggled on but only project-entity results returned | Surface chip "Semantic search is not yet available for these entity types -- rolling out in a later phase"; still return Layer 1/2 hits |
| Briefing pipeline regeneration event fires while a prior regeneration is in flight | Enqueue behind the in-flight job; do NOT dedupe against in-flight. The 30s debounce applies to fresh enqueues, not to in-flight workers |
| Manual briefing refresh from UI | Phase 7 calls `invokeBriefingPipeline(..., { bypassCache: true })`. Pipeline ignores TTL + `inputs_hash` equality, runs Stages 2-4, emits `BRIEFING_REGENERATED` |
| Stage 4 validator fails on Sonnet output | Pipeline does NOT overwrite the cache row; prior row remains authoritative. Phase 7 surfaces non-blocking "narrative pending" |
| `search_project_kb` / `search_org_kb` return `_meta.not_implemented = true` (Phase 11 not yet deployed) | Adapter branches on `_meta.not_implemented` (per DECISION-05), surfaces pending state chip in the UI, and falls back to empty grouped results for the affected entity family |
| Audit log write failure (duplicate row above) | Log error but do not block the mutation (non-critical path) |
| Inngest middleware fails to write to `event_audit` | Middleware swallows the error and logs; never blocks the event handler. Event volume may undercount during incidents |

---

## 5. Integration Points

### From Prior Phases

- **Phase 1 (RBAC):** Role checking functions (`requireRole`, `getCurrentMember`) used by Usage & Costs RBAC and settings forms. Deferred gaps GAP-RBAC-010/014/016 are addressed here.
- **Phase 2 (Agent Harness + Briefing/Status Pipeline):** `executeTask` in engine.ts receives per-stage cost cap pre-flight check. Phase 2 publishes `invokeBriefingPipeline(projectId, briefingType, { bypassCache? })` and the `BriefingType` enum (including `daily_standup`, `weekly_status`, and, if present, `discovery_gap_report`). Phase 2 also emits `BRIEFING_REGENERATED` after a successful regeneration. Phase 7 consumes these; it does NOT re-implement pipeline stages. Phase 7 does NOT add new briefing-type enum values.
- **Phase 3 (Discovery):** Question model fields (`askedDate`, `ownerDescription`, `scope`) used by health score signals and client-items queries. Question impact assessment results feed into Phase 2 pipeline inputs.
- **Phase 4 (Work Management):** Story model fields, acceptance criteria validation, story components used by sprint dashboard missing-fields check. QuestionStory join (or equivalent) consumed by affected-stories rendering in §2.4.
- **Phase 5 (Sprint):** Sprint `cachedAnalysis` JSON with conflicts used by dashboard conflict alerts. Developer attribution in sprint intelligence used by workload view. Completed-sprint point totals feed §2.6 velocity.
- **Phase 6 (Org/Knowledge):** OrgComponent and BusinessProcess models; KnowledgeArticle embedding (per DECISION-05). Consumed via `search_org_kb`.
- **Phase 11 (Hybrid Retrieval):** Publishes `search_project_kb` and `search_org_kb` per Addendum §5.4. Phase 7 §2.9 is a thin adapter. Phase 11 must expose the `SearchResponse` envelope with `_meta.not_implemented` flag per DECISION-05 so Phase 7 can branch deterministically before project-entity embeddings land.

### Published Events and Notification Types (consumed downstream)

- `BRIEFING_REGENERATED` -- emitted by Phase 2 pipeline on successful regeneration; Phase 7 triggers via manual refresh in §2.14.
- `NOTIFICATION_SEND` types added by Phase 7: `COST_THRESHOLD_WARNING`, `COST_CAP_EXCEEDED`, `FIRM_COST_THRESHOLD_WARNING`, `FIRM_COST_CAP_EXCEEDED`. Payload shape pinned in §2.13.

### For Future Phases

- **Phase 8 (Documents, Notifications):** `HEALTH_SCORE_CHANGED` notification sender (deferred from Phase 8) can now be implemented since health score model is correct. Phase 8 notification receiver must handle all four cost notification types defined in §2.13.
- **Phase 9 (QA, Archival):** Audit log infrastructure is available for QA workflow logging. Archived project cost data preserved in AuditLog.
- **V2:** Audit log UI (admin panel for querying logs). Semantic search expansion to all entity types. AI-generated milestone summaries. Dependency chain Gantt visualization. Inngest event volume tracking. Full read-path access logging.

---

## 6. Acceptance Criteria

### Health Score
- [ ] Health score uses signal counter model (Green/Yellow/Red), not weighted percentage
- [ ] Four signal categories match PRD Section 17.6 exactly
- [ ] Client-owned question signal correctly filters by ownerDescription
- [ ] Thresholds configurable per project via settings UI
- [ ] Health score renders as colored badge in briefing header

### Briefing
- [ ] Header shows: health badge, open questions (blocking count), blocked items, roadmap progress, requirements (unmapped count)
- [ ] Epic status section shows per-epic phase, story counts, completion percentage
- [ ] Blocking questions show age (days), owner, and affected-stories list (linked by displayId)
- [ ] Recommended focus is structured ranked list with question IDs and reasoning, sourced from Phase 2 Briefing/Status Pipeline
- [ ] Current Focus narrative sourced from Phase 2 pipeline (briefing_type = `daily_standup` per carry-forward mapping)
- [ ] Legacy `src/lib/agent-harness/tasks/dashboard-synthesis.ts` prompt path removed or shimmed to pipeline

### Sprint Dashboard
- [ ] Missing mandatory fields section identifies stories without acceptance criteria or components
- [ ] Developer workload shows per-developer story count, points, status breakdown
- [ ] Conflict alerts from cachedAnalysis rendered on Dashboard tab

### PM Dashboard
- [ ] Risk register summary shows risks by severity with top 5 open risks
- [ ] Upcoming deadlines shows next 5 milestones with progress and days remaining
- [ ] Client-facing items shows questions past follow-up threshold
- [ ] Team velocity card shows completed points for up to 3 past sprints plus average (PRD-17-15)

### Usage & Costs
- [ ] Standalone settings tab visible only to SA and PM
- [ ] Date range filter with presets works correctly
- [ ] Per-member breakdown shows token usage and cost per team member
- [ ] Trend chart displays daily / weekly / monthly cost based on range (≤31 / 32-120 / >120 days) with optional manual override
- [ ] Event Volume card shows Inngest event fire counts over selected range (PRD-23-12)
- [ ] No duplicate pricing logic -- single source in ai-pricing.ts

### Search
- [ ] `src/lib/search/global-search.ts` is a thin adapter over `search_project_kb` + `search_org_kb`; contains no `to_tsvector` / `to_tsquery` SQL (unit test enforces)
- [ ] All 8 entity types (Question, Decision, Requirement, Risk, Story, OrgComponent, BusinessProcess, KnowledgeArticle) appear in grouped results
- [ ] Smart Search toggle present in command palette; default off
- [ ] Layer 3 auto-activates when Layer 1+2 `totalResults < 5` (constant `SMART_SEARCH_AUTO_THRESHOLD = 5`)
- [ ] Informational chip shows when semantic is requested for entity types not yet covered by embeddings
- [ ] Adapter branches on `SearchResponse._meta.not_implemented` (not array length) per DECISION-05

### Execution Plan
- [ ] Stories grouped by phase within each epic
- [ ] Dependency references are clickable links

### Auto-Refresh
- [ ] All significant mutations fire PROJECT_STATE_CHANGED event
- [ ] Dashboard synthesis triggers correctly for question answered, story status changed, milestone reached

### Audit Logging
- [ ] AuditLog table created with proper indexes
- [ ] Key mutations (story status, question status, member roles, sprint changes, risk severity) write audit entries
- [ ] Audit log writes do not block mutations on failure

### Cost Caps
- [ ] `monthlyCostCapCents` configurable per project in settings (blocking)
- [ ] Per-stage pre-flight check blocks AI execution when cap exceeded; advisory lock closes the 99% race
- [ ] 80% threshold warning notification fires (dedupe 24h per project/type in current UTC month)
- [ ] 100% cap exceeded notification fires
- [ ] Per-member daily session limit enforced (UTC midnight window; aborted sessions count)
- [ ] Firm-wide advisory alert fires at 80% and 100% via daily cron; does NOT block execution (DECISION-09)
- [ ] `CostCapExceededError` and `NOTIFICATION_SEND` cost payload shapes match §2.13 pinned interfaces
- [ ] Cap raised mid-cycle clears `costCapAlertFiredAt` so alerts can re-fire for the new cap value

---

## 7. Open Questions

1. **Chart library for trend chart:** The project uses shadcn/ui but no chart library is currently installed. Options: recharts (most popular, ~200KB), chart.js via react-chartjs-2, or a minimal custom SVG chart. Recommend recharts as it pairs well with shadcn patterns. -- **Decision: defer to implementation task; installer picks the lightest option that works.**

2. **Milestone-to-phase mapping for execution plan grouping:** Stories don't have an explicit "phase" field. The proposed mapping (status -> phase) is a heuristic. If a story in BUILD status is part of a Discovery epic, it would appear under "Build" phase grouping. -- **Decision: use the story's containing epic's current EpicPhase as the grouping dimension, not the story status. This matches the PRD's "stories grouped by which project phase they belong to within the epic."**

3. **Audit log retention policy:** No TTL or cleanup defined for V1. At scale, audit logs could grow large. -- **Decision: V1 has no retention policy. Flag for V2 admin settings.**

---

## 8. Outstanding for Deep-Dive Coordination

These items require explicit sign-off with the owning phase before Phase 7 execution lands. Each is referenced inline above; listed here for tracking.

1. **Phase 2 pipeline signature.** Phase 2 must publish `invokeBriefingPipeline(projectId, briefingType, { bypassCache? })` and the `BriefingType` enum. Phase 7 does NOT add enum values. Coordinate with Phase 2 deep-dive before Task 16 starts. (Ref: §2.14; REQ IDs ADD-5.2.4-01..05)
2. **Phase 11 `search_project_kb` / `search_org_kb` signature + envelope.** Must return `SearchResponse<T>` with `_meta.not_implemented` flag (DECISION-05). Phase 7 Task 10 depends on both being merged (or on the envelope returning `not_implemented = true` so the adapter branches cleanly). (Ref: §2.9; REQ ID ADD-5.4-01)
3. **`FIRM_MONTHLY_COST_CAP_CENTS` config location.** Confirm canonical location: TypeScript constant in `src/lib/config/cost-caps.ts` with env override `FIRM_MONTHLY_COST_CAP_CENTS`. (Ref: §2.13; DECISION-09)
4. **`FIRM_ADMIN` role.** If not defined in Phase 1 RBAC, Phase 7 falls back to PM/SA recipients for firm-wide alerts. Document the fallback in the Task 14 rollout notes. (Ref: §2.13)
5. **`discovery_gap_report` briefing type.** Phase 7 prefers this type for the discovery gap narrative if Phase 2 exposes it; otherwise it falls back to `weekly_status` output per the carry-forward mapping. Coordinate with Phase 2 deep-dive. (Ref: §2.14)

---

## Revision History

| Date | Change |
|------|--------|
| 2026-04-10 | Initial spec created. 29 gaps analyzed, 15 tasks defined. 4 gaps deferred to V2 (GAP-DASH-008, GAP-DASH-018, GAP-DASH-020, GAP-DASH-023 visualization). |
| 2026-04-13 | Addendum v1 amendments applied (briefing routing, search substrate, deterministic dashboard metrics). |
| 2026-04-14 | Wave 3 audit-fix (10 gaps from `phase-07-audit.md`): added §0 Traceability, §2.14 Briefing/Status Pipeline Integration (GAP-01, GAP-09), rewrote §2.9 as substrate adapter (GAP-02, GAP-06), added firm-wide cost alert + concurrency / TZ edge cases + `CostCapExceededError` / `NOTIFICATION_SEND` interfaces (GAP-04, GAP-05), brought GAP-DASH-018 Inngest event volume into V1 (GAP-03), added velocity to PM dashboard (GAP-03), added affected-stories to blocking questions (GAP-08), added weekly/monthly trend bucketing (GAP-10), added §8 Outstanding. Citations: DECISION-05, DECISION-08, DECISION-09. Briefing-type carry-forward mapping applied (reuse `daily_standup` / `weekly_status`). |
