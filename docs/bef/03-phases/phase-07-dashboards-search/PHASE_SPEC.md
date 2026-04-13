# Phase 7 Spec: Dashboards, Search

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [07-dashboards-search-gaps.md](./07-dashboards-search-gaps.md)
> Depends On: Phase 3 (Discovery), Phase 4 (Work Management), Phase 5 (Sprint/Developer), Phase 6 (Org/Knowledge)
> Status: Draft
> Last Updated: 2026-04-10

---

## 1. Scope Summary

Rework the health score model from a weighted percentage formula to the PRD's signal counter model (Green/Yellow/Red). Add per-project configurable thresholds. Complete the briefing header with roadmap progress, requirements count, and health score badge. Add epic status section and structured recommended focus. Complete sprint dashboard with missing-fields check, developer workload view, and conflict alerts. Complete PM dashboard with risk register summary, upcoming deliverable deadlines, and client-facing items. Build the Usage & Costs settings tab as a standalone page with per-member breakdown, date range filter, and RBAC gating. Expand search to Story, OrgComponent, and BusinessProcess entity types in full-text search. Add semantic search mode toggle. Fix execution plan tab with phase grouping and dependency links. Consolidate duplicate pricing logic. Verify auto-refresh event wiring. Implement audit logging schema and basic write middleware. Implement per-project cost caps with enforcement in the agent harness.

**In scope:** 26 domain gaps + 3 deferred from Phase 1 = 29 gaps total -> 15 tasks
**Deferred to V2:** GAP-DASH-020 semantic search expansion beyond KnowledgeArticle (adding pgvector embedding columns + generation pipeline for Story, Question, Decision, OrgComponent, BusinessProcess is high-effort with diminishing V1 returns -- full-text search covers these entities adequately). GAP-DASH-008 AI-generated milestone summaries (local computation is acceptable for V1). GAP-DASH-023 dependency chain visualization (plain text with navigable links is sufficient for V1; Gantt-style visualization is V2). GAP-DASH-018 Inngest event volume metric (Inngest does not expose a simple API for event counts; manual tracking adds complexity without clear V1 value).

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

These amendments integrate PRD Addendum v1 into Phase 7. They are additive — existing requirements below are unchanged.

- **Briefing generation routing:** Briefing generation now routes through the Briefing/Status Pipeline (Phase 2). Phase 7 calls the pipeline with the appropriate `briefing_type` — it does not implement its own AI generation.
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

- **What it does:** Enriches blocked-items display with question age and owner fields. Converts recommended focus from plain prose to a structured ranked list with question IDs and reasoning.
- **Inputs:** Blocked items query results. AI synthesis output.
- **Outputs:** Blocked items with `createdAt` age display and `ownerDescription`. Recommended focus as `Array<{ rank: number, questionId: string, questionDisplayId: string, questionText: string, reasoning: string }>`.
- **Business rules:**
  - The `getBlockedItems` query already fetches most fields. Add `askedDate` and `ownerDescription` to the select clause.
  - The `blocked-items.tsx` component renders age as "X days old" and owner name.
  - The `CachedBriefing` interface changes `recommendedFocus` from `string | null` to `Array<{ rank: number, questionId: string, questionDisplayId: string, questionText: string, reasoning: string }> | null`.
  - The dashboard synthesis task prompt is updated to request structured JSON output for recommended focus: "Return recommendedFocus as a JSON array of up to 5 items, each with rank, questionId (the displayId), questionText, and reasoning explaining why this question should be prioritized."
  - The AI-summary-card component for recommended focus renders as a numbered list with question IDs as links to the question detail page.
  - Backward compatibility: if `recommendedFocus` is a plain string (from old cached data), render it as prose with a "Refresh" prompt.
- **Files:** `src/lib/dashboard/queries.ts` (add fields to blocked items select), `src/components/dashboard/blocked-items.tsx` (add age + owner columns), `src/components/dashboard/ai-summary-card.tsx` (update recommended focus rendering), `src/lib/agent-harness/tasks/dashboard-synthesis.ts` (update prompt for structured output), `src/lib/inngest/functions/dashboard-synthesis.ts` (pass question IDs to synthesis)
- **Gaps addressed:** GAP-DASH-005, GAP-DASH-007

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

- **What it does:** Adds risk register summary, upcoming deliverable deadlines, and client-facing items needing attention to the PM dashboard.
- **Inputs:** Project ID.
- **Outputs:** Three new sections in PM dashboard data and UI.
- **Business rules:**
  - **Risk register summary:** Query risks grouped by severity (CRITICAL, HIGH, MEDIUM, LOW) and status (OPEN, MITIGATED, CLOSED). Display as a compact summary: "X active risks (Y critical, Z high)". Show top 5 open risks sorted by severity DESC, then createdAt ASC. Add to `PmDashboardData` as `riskSummary: { bySeverity: Record<string, number>, topOpenRisks: Array<{ displayId, description, severity, mitigationStrategy }> }`.
  - **Upcoming deliverable deadlines:** Query milestones with `targetDate` not null and `status != COMPLETE`, sorted by targetDate ASC, limited to next 5. Include computed progress from linked stories. Add to `PmDashboardData` as `upcomingDeadlines: Array<{ milestoneName, targetDate, progress, daysRemaining }>`.
  - **Client-facing items:** Query open questions where `ownerDescription` contains "Client" (case-insensitive) and `askedDate` is older than `clientFollowUpDays` threshold (from project health score thresholds, default 3 days). Add to `PmDashboardData` as `clientItems: Array<{ questionDisplayId, questionText, age, owner }>`.
  - The PM dashboard synthesis Inngest function is updated to compute these three new data sections.
- **Files:** `src/lib/inngest/functions/pm-dashboard-synthesis.ts` (add risk, deadline, client item queries), `src/components/pm-dashboard/risk-summary-card.tsx` (new), `src/components/pm-dashboard/upcoming-deadlines-card.tsx` (new), `src/components/pm-dashboard/client-items-card.tsx` (new), `src/app/(dashboard)/projects/[projectId]/pm-dashboard/page.tsx` (add sections)
- **Gaps addressed:** GAP-DASH-012, GAP-DASH-013, GAP-DASH-014

### 2.7 Usage & Costs Backend (REQ-DASH-007)

- **What it does:** Builds the complete backend for the Usage & Costs settings tab: per-member breakdown, date range filtering, trend data, and RBAC enforcement.
- **Inputs:** Project ID, date range (start, end), requesting user's role.
- **Outputs:** `UsageDashboardData` with project totals, by-task-type breakdown, by-member breakdown, and daily trend.
- **Business rules:**
  - Extend `getTokenUsageSummary` to accept `startDate` and `endDate` parameters. Default to last 30 days when not specified.
  - Add `getUsageByMember` function that groups SessionLog by `userId`, joins to `ProjectMember` for display names. Only callable by SA/PM.
  - Add `getDailyUsageTrend` function that returns daily aggregates for charting.
  - Consolidate duplicate pricing logic: remove the inline `estimateCost()` function in `pm-dashboard-synthesis.ts` and import `calculateCost` from `src/lib/config/ai-pricing.ts` everywhere.
  - Create a `getUsageDashboard` server action with `requireRole(["SOLUTION_ARCHITECT", "PM"])` check.
  - The tech spec already defines `getProjectUsage`, `getUsageByTaskType`, `getUsageByMember`, and `getDailyUsageTrend` in Section 5.3. The existing `usage-queries.ts` implements only `getTokenUsageSummary` (all-time, by-task-type only). Rewrite to match the tech spec signatures.
- **Files:** `src/lib/dashboard/usage-queries.ts` (rewrite with date range + by-member + trend), `src/lib/config/ai-pricing.ts` (verify single source of truth), `src/lib/inngest/functions/pm-dashboard-synthesis.ts` (remove duplicate estimateCost), `src/actions/usage.ts` (new server action with RBAC)
- **Gaps addressed:** GAP-DASH-016, GAP-DASH-017, GAP-DASH-025, GAP-RBAC-010 (backend)

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
  - Trend chart: simple line chart (use recharts or a lightweight chart lib already in the project) showing daily cost over the selected date range.
  - Loading states with skeleton UI for each section.
- **Files:** `src/app/(dashboard)/projects/[projectId]/settings/usage/page.tsx` (new page), `src/components/settings/usage-dashboard.tsx` (new), `src/components/settings/usage-trend-chart.tsx` (new), `src/app/(dashboard)/projects/[projectId]/settings/layout.tsx` (add tab)
- **Gaps addressed:** GAP-DASH-015, GAP-RBAC-010 (UI)

### 2.9 Search Entity Expansion (REQ-DASH-009)

- **What it does:** Adds Story, OrgComponent, and BusinessProcess to global search (full-text and filtered layers). Adds a semantic/keyword mode toggle to the search UI.
- **Inputs:** Search query, selected entity types, search mode preference.
- **Outputs:** Search results including the three new entity types. Mode toggle in command palette.
- **Business rules:**
  - Add `"story" | "orgComponent" | "businessProcess"` to `SearchEntityType` union.
  - Add `stories`, `orgComponents`, `businessProcesses` to `GroupedSearchResults`.
  - Story full-text: search `title`, `description`, `acceptanceCriteria` via search_vector. Display: displayId, title, snippet, status.
  - OrgComponent full-text: search `apiName`, `label` via search_vector. Display: apiName as title, label as snippet, componentType as status.
  - BusinessProcess full-text: search `name`, `description` via search_vector. Display: name as title, description snippet.
  - Add Story, OrgComponent, BusinessProcess to filtered search (status filters).
  - Semantic mode toggle: add a "Smart Search" toggle to the command palette. When off (default), only run layers 1+2. When on, also run layer 3. This avoids unnecessary embedding API costs on every keystroke.
  - The tsvector columns and triggers for Story, OrgComponent, and BusinessProcess need to exist (either already created by Phase 6 migrations or created here). If they don't exist, this task adds the migration.
  - Note: semantic search (layer 3) still only covers KnowledgeArticle in V1. The toggle controls whether layer 3 runs at all, not which entities it covers.
- **Files:** `src/lib/search/global-search.ts` (add 3 entity types to all layers + mode param), `src/components/search/command-palette.tsx` (add mode toggle + new result groups), `prisma/migrations/` (add search_vector columns/triggers if not present)
- **Gaps addressed:** GAP-DASH-019, GAP-DASH-021

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

### 2.13 Per-Project Cost Caps (REQ-DASH-013)

- **What it does:** Adds configurable monthly cost caps per project with pre-flight enforcement in the agent harness and alert notifications when thresholds are crossed.
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
- **Files:** `prisma/schema.prisma` (add fields), `src/lib/agent-harness/cost-cap.ts` (new -- check function), `src/lib/agent-harness/engine.ts` (add pre-flight call), `src/actions/project-settings.ts` (add cost cap update action), `src/components/settings/cost-cap-form.tsx` (new)
- **Gaps addressed:** GAP-RBAC-016

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
- `Project.monthlyCostCapCents` (Int, nullable)
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

---

## 5. Integration Points

### From Prior Phases

- **Phase 1 (RBAC):** Role checking functions (`requireRole`, `getCurrentMember`) used by Usage & Costs RBAC and settings forms. Deferred gaps GAP-RBAC-010/014/016 are addressed here.
- **Phase 2 (Agent Harness):** `executeTask` in engine.ts receives cost cap pre-flight check. Dashboard synthesis task definition receives prompt updates.
- **Phase 3 (Discovery):** Question model fields (`askedDate`, `ownerDescription`, `scope`) used by health score signals and client-items queries. Question impact assessment results feed into recommended focus.
- **Phase 4 (Work Management):** Story model fields, acceptance criteria validation, story components used by sprint dashboard missing-fields check.
- **Phase 5 (Sprint):** Sprint `cachedAnalysis` JSON with conflicts used by dashboard conflict alerts. Developer attribution in sprint intelligence used by workload view.
- **Phase 6 (Org/Knowledge):** OrgComponent and BusinessProcess models and their search_vector columns used by search expansion.

### For Future Phases

- **Phase 8 (Documents, Notifications):** `HEALTH_SCORE_CHANGED` notification sender (deferred from Phase 8) can now be implemented since health score model is correct. Cost threshold notifications use the `NOTIFICATION_SEND` event pattern.
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
- [ ] Blocking questions show age (days) and owner
- [ ] Recommended focus is structured ranked list with question IDs and reasoning

### Sprint Dashboard
- [ ] Missing mandatory fields section identifies stories without acceptance criteria or components
- [ ] Developer workload shows per-developer story count, points, status breakdown
- [ ] Conflict alerts from cachedAnalysis rendered on Dashboard tab

### PM Dashboard
- [ ] Risk register summary shows risks by severity with top 5 open risks
- [ ] Upcoming deadlines shows next 5 milestones with progress and days remaining
- [ ] Client-facing items shows questions past follow-up threshold

### Usage & Costs
- [ ] Standalone settings tab visible only to SA and PM
- [ ] Date range filter with presets works correctly
- [ ] Per-member breakdown shows token usage and cost per team member
- [ ] Trend chart displays daily cost over selected range
- [ ] No duplicate pricing logic -- single source in ai-pricing.ts

### Search
- [ ] Story, OrgComponent, BusinessProcess appear in global search results
- [ ] Full-text search works for all 8 entity types
- [ ] Semantic mode toggle present in command palette
- [ ] Semantic search only runs when toggle is on

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
- [ ] monthlyCostCapCents configurable per project in settings
- [ ] Pre-flight check blocks AI execution when cap exceeded
- [ ] 80% threshold warning notification fires
- [ ] 100% cap exceeded notification fires
- [ ] Per-member daily session limit enforced

---

## 7. Open Questions

1. **Chart library for trend chart:** The project uses shadcn/ui but no chart library is currently installed. Options: recharts (most popular, ~200KB), chart.js via react-chartjs-2, or a minimal custom SVG chart. Recommend recharts as it pairs well with shadcn patterns. -- **Decision: defer to implementation task; installer picks the lightest option that works.**

2. **Milestone-to-phase mapping for execution plan grouping:** Stories don't have an explicit "phase" field. The proposed mapping (status -> phase) is a heuristic. If a story in BUILD status is part of a Discovery epic, it would appear under "Build" phase grouping. -- **Decision: use the story's containing epic's current EpicPhase as the grouping dimension, not the story status. This matches the PRD's "stories grouped by which project phase they belong to within the epic."**

3. **Audit log retention policy:** No TTL or cleanup defined for V1. At scale, audit logs could grow large. -- **Decision: V1 has no retention policy. Flag for V2 admin settings.**

---

## Revision History

| Date | Change |
|------|--------|
| 2026-04-10 | Initial spec created. 29 gaps analyzed, 15 tasks defined. 4 gaps deferred to V2 (GAP-DASH-008, GAP-DASH-018, GAP-DASH-020, GAP-DASH-023 visualization). |
