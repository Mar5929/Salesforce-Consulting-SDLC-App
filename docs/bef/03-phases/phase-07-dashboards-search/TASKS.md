# Phase 7 Tasks: Dashboards, Search

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 15
> Status: 0/15 complete
> Last Updated: 2026-04-10

---

## Execution Order

```
Task 1 (Schema migration)  ─── must be first (AuditLog table, cost cap fields)
  │
  ├── Task 2 (Health score rework)  ─── depends on Task 1 (threshold defaults)
  │     └── Task 3 (Health score threshold settings UI)
  │
  ├── Task 4 (Briefing header + epic status)  ─── independent of health score
  │     └── Task 5 (Blocked items + structured focus)  ─── depends on Task 4 (header layout)
  │
  ├── Task 6 (Sprint dashboard completeness)  ─── independent
  │
  ├── Task 7 (PM dashboard completeness)  ─── independent
  │
  ├── Task 8 (Usage backend)  ─── independent
  │     └── Task 9 (Usage UI)  ─── depends on Task 8
  │
  ├── Task 10 (Search expansion)  ─── independent
  │
  ├── Task 11 (Execution plan improvements)  ─── independent
  │
  ├── Task 12 (Auto-refresh event wiring)  ─── independent (audit + fix)
  │
  ├── Task 13 (Audit logging implementation)  ─── depends on Task 1 (AuditLog model)
  │
  ├── Task 14 (Cost cap enforcement)  ─── depends on Task 1 (cost cap fields) + Task 8 (usage queries)
  │
  └── Task 15 (Pricing consolidation + integration test)  ─── after Tasks 2, 7, 8 (all pricing consumers)
```

---

## Tasks

### Task 1: Schema Migration -- AuditLog, Cost Cap Fields, tsvector Columns

| Attribute | Details |
|-----------|---------|
| **Scope** | Add AuditLog model, cost cap fields on Project and ProjectMember, and search_vector columns + triggers for Story, OrgComponent, BusinessProcess. Single Prisma migration. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `AuditLog` model created with: id, projectId (FK), userId, action (enum), entityType, entityId, entityDisplayId, changes (JSON), ipAddress, createdAt
- [ ] Index on `(projectId, createdAt DESC)` and `(projectId, entityType, entityId)` on AuditLog
- [ ] `AuditAction` enum: CREATE, UPDATE, DELETE, STATUS_CHANGE, ROLE_CHANGE, ARCHIVE
- [ ] `Project.monthlyCostCapCents` (Int?, nullable) added
- [ ] `ProjectMember.dailySessionLimit` (Int?, nullable) added
- [ ] `Story` table has `search_vector tsvector` column, GIN index, and auto-update trigger on title + description + acceptanceCriteria (verify: if Phase 6 already added this, skip)
- [ ] `OrgComponent` table has `search_vector tsvector` column, GIN index, and auto-update trigger on apiName + label (verify: if Phase 6 already added this, skip)
- [ ] `BusinessProcess` table has `search_vector tsvector` column, GIN index, and auto-update trigger on name + description (verify: if Phase 6 already added this, skip)
- [ ] Migration applies cleanly against existing data
- [ ] `npx prisma generate` succeeds

**Implementation Notes:**
- Add to `prisma/schema.prisma`: AuditLog model with the specified fields and indexes. Use `@@index` for the composite indexes.
- The search_vector columns cannot be defined in Prisma schema (Prisma doesn't support tsvector). Use a raw SQL migration file: add the columns, GIN indexes, and trigger functions. Check if Phase 6 migrations already created these -- if so, skip the search_vector portion.
- The AuditLog `action` field uses a Prisma enum. The `entityType` is a plain String (not an enum) to avoid coupling to every model in the system.
- All new fields are nullable, so no backfill needed.

---

### Task 2: Health Score Rework -- Signal Counter Model

| Attribute | Details |
|-----------|---------|
| **Scope** | Rewrite `computeHealthScore` to use the PRD's signal counter model. Update the health score component to render as a badge. Move health score to the briefing header. |
| **Depends On** | Task 1 (schema migration for threshold defaults context) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `computeHealthScore` returns `{ status: "GREEN" | "YELLOW" | "RED", signalCount, breakdown: { staleQuestions, staleClientQuestions, staleBlockedItems, unmitigatedHighRisks } }`
- [ ] Signal 1: open questions older than `questionAgeDays` threshold (default 7)
- [ ] Signal 2: client-owned open questions older than `clientFollowUpDays` threshold (default 3), identified by case-insensitive match on `ownerDescription` containing "client"
- [ ] Signal 3: stories blocked by questions older than `blockedItemDays` threshold (default 5)
- [ ] Signal 4: open risks with severity HIGH or CRITICAL and null/empty mitigationStrategy
- [ ] Thresholds read from `Project.healthScoreThresholds` JSON, falling back to defaults
- [ ] Health score badge renders green/yellow/red circle with signal count
- [ ] Badge positioned in the briefing header bar (not as a standalone card)
- [ ] `HealthScore` and `HealthScoreBreakdown` TypeScript interfaces updated
- [ ] Dashboard synthesis function uses new health score shape in cached briefing
- [ ] Old `HealthDescriptor` type removed

**Implementation Notes:**
- The existing `computeHealthScore` in `src/lib/dashboard/queries.ts` is a complete rewrite. Replace the weighted formula with four signal count queries matching the tech spec Section 5.2 reference code.
- Create a helper `getProjectThresholds(projectId)` that reads `Project.healthScoreThresholds` and merges with defaults.
- The `health-score.tsx` component changes from a card with numeric score to a compact badge. Use shadcn Badge component with variant-based coloring (green/yellow/red via Tailwind classes).
- Update `dashboard-synthesis.ts` to pass the new `{ status, signalCount, breakdown }` shape instead of `{ score, descriptor, breakdown }`.

---

### Task 3: Health Score Threshold Settings UI

| Attribute | Details |
|-----------|---------|
| **Scope** | Add health score threshold configuration form to project settings. SA/PM only. |
| **Depends On** | Task 2 (health score rework -- so the thresholds are actually consumed) |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] "Health Score Thresholds" section visible in project settings for SA and PM only
- [ ] Three integer fields: question age (days), client follow-up (days), blocked item (days)
- [ ] Zod validation: positive integers, max 90
- [ ] Server action `updateHealthScoreThresholds` with `requireRole(["SOLUTION_ARCHITECT", "PM"])`
- [ ] Fires `PROJECT_STATE_CHANGED` after update
- [ ] Default values shown when thresholds are null
- [ ] Success toast on save

**Implementation Notes:**
- Create `src/components/settings/health-score-thresholds-form.tsx` using react-hook-form + Zod resolver.
- Create `updateHealthScoreThresholds` in `src/actions/project-settings.ts` (or extend existing settings action file).
- Add the form to the settings page, gated by role check in the page component.

---

### Task 4: Briefing Header and Epic Status Section

| Attribute | Details |
|-----------|---------|
| **Scope** | Add roadmap progress and requirements count to briefing header. Add epic status section to discovery dashboard. |
| **Depends On** | None (can parallelize with Task 2, just uses the header layout) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Briefing header displays: open questions (with blocking count), blocked items, roadmap progress ("X/Y milestones on track"), requirements count (with unmapped count)
- [ ] `getBriefingMetrics` query returns roadmap progress and requirements data
- [ ] Unmapped requirements = requirements not linked via RequirementStory join table
- [ ] Epic status section below header shows per-epic: name, current phase, story count by status, completion %
- [ ] `getEpicStatusSummary` query returns epic-level data
- [ ] Briefing header is a standalone component (`briefing-header.tsx`) for clean composition
- [ ] Epic status section is a standalone component (`epic-status-section.tsx`)

**Implementation Notes:**
- The tech spec's `getBriefingMetrics` already queries milestones and unmapped requirements. Match that query signature.
- For epic status: query epics with their epicPhases (to find current phase = the one with IN_PROGRESS status), and story counts grouped by status per epic.
- Use a compact grid/table layout for epic status -- one row per epic, columns for phase and story counts.
- The dashboard page orchestrates loading both components with `Promise.all`.

---

### Task 5: Blocking Questions Data Quality and Structured Recommended Focus

| Attribute | Details |
|-----------|---------|
| **Scope** | Add age and owner to blocked items display. Convert recommended focus to structured ranked list. Update AI synthesis prompt. |
| **Depends On** | Task 4 (briefing header layout established) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `getBlockedItems` query includes `askedDate` and `ownerDescription` in select
- [ ] `blocked-items.tsx` displays question age ("X days ago") and owner name
- [ ] `CachedBriefing.recommendedFocus` type changed to structured array (with backward compat for string)
- [ ] Dashboard synthesis prompt updated to request structured JSON recommendedFocus output
- [ ] Recommended focus renders as numbered list with question displayId links and reasoning text
- [ ] Old string-format recommendedFocus renders as prose with "Refresh" CTA
- [ ] Dashboard synthesis Inngest function passes full question list (with displayIds) to synthesis task

**Implementation Notes:**
- In `queries.ts`, add `askedDate: true, ownerDescription: true` to the blocked items select.
- In `blocked-items.tsx`, compute age as `differenceInDays(new Date(), question.askedDate)` using date-fns.
- Update `CachedBriefing` interface: `recommendedFocus: string | Array<{ rank: number, questionId: string, questionDisplayId: string, questionText: string, reasoning: string }> | null`.
- In `dashboard-synthesis.ts` task prompt, add explicit instructions: "Return recommendedFocus as a JSON array of objects with keys: rank (1-5), questionId (the displayId like Q-FM-002), questionText (brief), reasoning (1 sentence on why this is priority)."
- In `ai-summary-card.tsx`, check `typeof recommendedFocus` at render time for backward compat.

---

### Task 6: Sprint Dashboard -- Missing Fields, Workload, Conflict Alerts

| Attribute | Details |
|-----------|---------|
| **Scope** | Add three new sections to the sprint dashboard: stories missing mandatory fields, developer workload view, and conflict alerts from cachedAnalysis. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] "Missing Fields" card lists stories in current sprint missing acceptance criteria or story components
- [ ] Each missing-field story links to the story detail/edit page
- [ ] Developer workload table groups stories by assignee with: name, story count, total points, status breakdown
- [ ] "Unassigned" group for stories with null assignee
- [ ] Conflict alerts section renders non-dismissed conflicts from `sprint.cachedAnalysis.conflicts`
- [ ] Conflict banners show developer names and conflicting components
- [ ] "No conflicts detected" message when array is empty or all dismissed
- [ ] "Run analysis" prompt when cachedAnalysis is null

**Implementation Notes:**
- Create three new components in `src/components/sprints/`:
  - `missing-fields-card.tsx`: query stories where acceptanceCriteria is null/empty OR storyComponents count is 0. Use a server action or inline the query in the page.
  - `developer-workload-table.tsx`: accepts sprint stories array, groups by assigneeId, shows table rows.
  - `dashboard-conflict-alerts.tsx`: reads `cachedAnalysis?.conflicts`, filters dismissed, renders as alert banners.
- Integrate all three into `sprint-dashboard.tsx` layout. Missing fields at top (warning), workload in middle, conflicts at bottom.

---

### Task 7: PM Dashboard -- Risk Summary, Deadlines, Client Items

| Attribute | Details |
|-----------|---------|
| **Scope** | Add risk register summary, upcoming milestone deadlines, and client-facing items needing attention to the PM dashboard synthesis and UI. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `PmDashboardData` includes `riskSummary`, `upcomingDeadlines`, and `clientItems` fields
- [ ] Risk summary: risks grouped by severity, top 5 open risks listed
- [ ] Upcoming deadlines: next 5 milestones with targetDate, progress %, days remaining
- [ ] Client items: open questions with client owner past follow-up threshold
- [ ] PM dashboard synthesis Inngest function computes all three new data sections
- [ ] Risk summary card component renders severity badges and open risk list
- [ ] Upcoming deadlines card shows countdown badges (red for <7 days, yellow for <14 days)
- [ ] Client items card lists questions with age and owner

**Implementation Notes:**
- In `pm-dashboard-synthesis.ts`, add three new data gathering steps:
  - Risks: `prisma.risk.groupBy({ by: ["severity"], where: { projectId, status: "OPEN" } })` + top 5 query.
  - Deadlines: `prisma.milestone.findMany({ where: { projectId, status: { not: "COMPLETE" }, targetDate: { not: null } }, orderBy: { targetDate: "asc" }, take: 5, include: { milestoneStories: { include: { story: { select: { status: true } } } } } })`.
  - Client items: `prisma.question.findMany({ where: { projectId, status: "OPEN", ownerDescription: { contains: "client", mode: "insensitive" } } })` then filter by age > threshold.
- Create three components in `src/components/pm-dashboard/` and add them to the PM dashboard page layout.

---

### Task 8: Usage & Costs Backend -- Date Range, Per-Member, Trend

| Attribute | Details |
|-----------|---------|
| **Scope** | Rewrite usage-queries.ts to support date range filtering, per-member breakdown, and daily trend. Create RBAC-gated server action. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `getProjectUsage(projectId, startDate, endDate)` returns totals for date range
- [ ] `getUsageByTaskType(projectId, startDate, endDate)` groups by taskType with cost
- [ ] `getUsageByMember(projectId, startDate, endDate)` groups by userId, resolves displayName via ProjectMember
- [ ] `getDailyUsageTrend(projectId, startDate, endDate)` returns daily token + cost aggregates
- [ ] All four functions accept date range parameters, defaulting to last 30 days
- [ ] `getUsageDashboard` server action combines all four queries with `requireRole(["SOLUTION_ARCHITECT", "PM"])`
- [ ] Cost calculation uses `calculateCost` from `ai-pricing.ts` (not inline formulas)
- [ ] Old `getTokenUsageSummary` replaced or aliased for backward compatibility

**Implementation Notes:**
- Rewrite `src/lib/dashboard/usage-queries.ts` to match the tech spec Section 5.3 function signatures.
- The `getUsageByMember` function queries SessionLog grouped by `userId`, then resolves names from ProjectMember.
- The `getDailyUsageTrend` uses raw SQL with `DATE("startedAt")` grouping.
- Create `src/actions/usage.ts` with `getUsageDashboard` that calls all four and returns a combined payload.
- The PM dashboard synthesis function (`pm-dashboard-synthesis.ts`) that currently computes AI usage should import from this module instead of duplicating logic.

---

### Task 9: Usage & Costs Settings Tab UI

| Attribute | Details |
|-----------|---------|
| **Scope** | Build the Usage & Costs page in project settings with date range selector, totals, breakdowns, and trend chart. SA/PM only. |
| **Depends On** | Task 8 (backend queries and server action) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] New route at `/projects/[projectId]/settings/usage` renders Usage & Costs page
- [ ] Tab appears in settings navigation only for SA and PM roles
- [ ] Date range selector with presets: Last 7 days, Last 30 days, Current sprint, All time, Custom
- [ ] Project totals section: total tokens, estimated cost ($X.XX), session count
- [ ] Task type breakdown table: taskType, input tokens, output tokens, cost, % of total
- [ ] Member breakdown table: name, input tokens, output tokens, cost, session count
- [ ] Trend line chart showing daily cost over selected date range
- [ ] Loading skeletons for each section
- [ ] Empty state when no usage data exists

**Implementation Notes:**
- Create `src/app/(dashboard)/projects/[projectId]/settings/usage/page.tsx` as a server component that checks role and renders the client component.
- `src/components/settings/usage-dashboard.tsx`: client component with date range state, calls server action via SWR or direct fetch, renders sections.
- `src/components/settings/usage-trend-chart.tsx`: minimal chart component. Check if recharts or any chart lib is already installed. If not, use a lightweight option or install recharts.
- Add "Usage & Costs" link to the settings layout navigation, conditionally rendered by role.

---

### Task 10: Search Entity Expansion -- Story, OrgComponent, BusinessProcess

| Attribute | Details |
|-----------|---------|
| **Scope** | Add three entity types to global search. Add filtered search support. Add semantic mode toggle to command palette. |
| **Depends On** | Task 1 (search_vector columns must exist) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `SearchEntityType` includes `"story" | "orgComponent" | "businessProcess"`
- [ ] `GroupedSearchResults` includes `stories`, `orgComponents`, `businessProcesses` arrays
- [ ] Full-text search covers Story (title, description, acceptanceCriteria), OrgComponent (apiName, label), BusinessProcess (name, description)
- [ ] Filtered search supports status filter for Story and OrgComponent
- [ ] Command palette shows results grouped by all 8 entity types
- [ ] "Smart Search" toggle in command palette controls whether semantic layer runs
- [ ] Default is keyword-only (no embedding cost); toggle enables semantic
- [ ] Result items link to appropriate detail pages for each entity type

**Implementation Notes:**
- In `global-search.ts`:
  - Extend `SearchEntityType` union and `GroupedSearchResults`.
  - Add full-text search queries for Story, OrgComponent, BusinessProcess following the existing pattern.
  - Add filtered search clauses for status on Story and OrgComponent.
  - Add `semantic?: boolean` to `SearchOptions`. Pass this through to control whether layer 3 runs.
- In `command-palette.tsx`:
  - Add toggle switch (shadcn Switch component) labeled "Smart Search".
  - Add result sections for stories, org components, business processes.
  - Map entity types to appropriate icons and navigation URLs.

---

### Task 11: Execution Plan Tab -- Phase Grouping and Dependency Links

| Attribute | Details |
|-----------|---------|
| **Scope** | Group stories by EpicPhase within each epic. Render dependency references as clickable links. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Within each epic section, stories are grouped by the EpicPhase they relate to (Discovery, Design, Build, Test, Deploy)
- [ ] Phase subheaders displayed between story groups
- [ ] Stories not assignable to a specific phase appear in an "Other" group
- [ ] Dependency references (story IDs in component overlap or explicit dependencies) render as clickable links
- [ ] Clicking a dependency link scrolls to or navigates to the target story
- [ ] Empty phase groups are hidden

**Implementation Notes:**
- In `execution-plan-tab.tsx`:
  - Determine phase grouping per story: find the epic's EpicPhase entries, map stories based on their status (DRAFT/READY -> first non-COMPLETE phase, IN_PROGRESS -> BUILD, QA -> TEST, DONE -> last phase). Alternatively, if stories have explicit phase metadata, use that.
  - Render phase subheaders using collapsible sections.
  - For dependencies: if story has `storyComponents` that overlap with other stories, show "Related: STORY-FM-003" as a link. Use `<a href="#story-{displayId}">` for in-page scroll or `<Link>` for navigation.
- This is a pure UI refactor. No backend query changes needed (the data is already loaded).

---

### Task 12: Auto-Refresh Event Wiring Audit and Fixes

| Attribute | Details |
|-----------|---------|
| **Scope** | Audit all mutation server actions for PROJECT_STATE_CHANGED event emission. Add missing emissions. Document coverage. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Audit table documenting which actions fire PROJECT_STATE_CHANGED and which were added
- [ ] Question answered fires the event
- [ ] Question created fires the event
- [ ] Decision recorded fires the event
- [ ] Requirement created/updated fires the event
- [ ] Risk created/updated fires the event
- [ ] Story status changed fires the event (already exists, verify)
- [ ] Story created fires the event
- [ ] Milestone status changed fires the event
- [ ] Epic phase changed fires the event
- [ ] No duplicate event firing (check for existing emissions before adding)

**Implementation Notes:**
- Read through each file in `src/actions/`: stories.ts, questions.ts, decisions.ts, requirements.ts, risks.ts, milestones.ts, epics.ts.
- For each mutation that modifies project state, verify `inngest.send({ name: EVENTS.PROJECT_STATE_CHANGED, data: { projectId } })` is called after the successful database write.
- The dashboard synthesis function already debounces at 30s per project, so adding emissions to more actions is safe.
- Document results as a comment block at the top of the task PR or in a short audit table in the commit message.

---

### Task 13: Audit Logging -- writeAuditLog Utility and Integration

| Attribute | Details |
|-----------|---------|
| **Scope** | Create the writeAuditLog utility function and integrate it into key mutation server actions. |
| **Depends On** | Task 1 (AuditLog model) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `writeAuditLog` utility function in `src/lib/audit/write-audit-log.ts`
- [ ] Accepts: projectId, userId, action, entityType, entityId, entityDisplayId (optional), changes (optional JSON), ipAddress (optional)
- [ ] Writes AuditLog row with error handling (logs failure, does not throw)
- [ ] Integrated into story status changes with before/after status in changes JSON
- [ ] Integrated into question status changes (answered, parked)
- [ ] Integrated into member role changes
- [ ] Integrated into sprint create/update
- [ ] Integrated into risk severity changes
- [ ] Integrated into decision creation
- [ ] Integrated into project archive/reactivate
- [ ] Changes JSON format: `{ fieldName: { old: value, new: value } }` for updates

**Implementation Notes:**
- Create `src/lib/audit/write-audit-log.ts`:
  ```typescript
  export async function writeAuditLog(params: {
    projectId: string
    userId: string
    action: AuditAction
    entityType: string
    entityId: string
    entityDisplayId?: string
    changes?: Record<string, { old: unknown; new: unknown }>
    ipAddress?: string
  }): Promise<void> {
    try {
      await prisma.auditLog.create({ data: params })
    } catch (error) {
      console.error("Audit log write failed:", error)
    }
  }
  ```
- In each server action, call `writeAuditLog` after the successful database mutation. Get userId from `getCurrentMember` or Clerk auth.
- For status changes, pass `{ status: { old: previousStatus, new: newStatus } }` as changes.
- This is synchronous (not Inngest) since audit writes are lightweight single INSERT operations.

---

### Task 14: Per-Project Cost Caps and Enforcement

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement cost cap checking in the agent harness, cost cap settings UI, and threshold alert notifications. |
| **Depends On** | Task 1 (schema fields), Task 8 (usage queries for current month aggregation) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `checkCostCap(projectId, userId)` function in `src/lib/agent-harness/cost-cap.ts`
- [ ] Queries current calendar month usage from SessionLog
- [ ] Compares against `project.monthlyCostCapCents`; throws `CostCapExceededError` if exceeded
- [ ] At 80% threshold, emits `NOTIFICATION_SEND` event with COST_THRESHOLD_WARNING type
- [ ] At 100%, emits COST_CAP_EXCEEDED notification and blocks execution
- [ ] Checks per-member daily session count against `projectMember.dailySessionLimit`
- [ ] `executeTask` in engine.ts calls `checkCostCap` before AI invocation
- [ ] `CostCapExceededError` caught by callers and rendered as user-friendly error
- [ ] Cost cap settings form in project settings (SA/PM only)
- [ ] Form fields: monthly cap (dollars, converted to cents), per-member daily limit
- [ ] Null/empty cap = no enforcement

**Implementation Notes:**
- Create `src/lib/agent-harness/cost-cap.ts`:
  - Query current month: `startDate = startOfMonth(new Date())`, `endDate = new Date()`.
  - Use `getProjectUsage(projectId, startDate, endDate)` from the rewritten usage-queries.
  - Compare `totalCost * 100` against `monthlyCostCapCents`.
  - For daily limit: count SessionLog entries where `userId` matches and `startedAt >= startOfDay(new Date())`.
  - Custom error class `CostCapExceededError extends Error`.
- In `engine.ts`, add `await checkCostCap(projectId, userId)` as the first step in `executeTask`.
- Create `src/components/settings/cost-cap-form.tsx` with dollar input (stored as cents) and daily limit input.
- Add notification types: COST_THRESHOLD_WARNING and COST_CAP_EXCEEDED to the notification event data.

---

### Task 15: Pricing Consolidation and Cross-Dashboard Verification

| Attribute | Details |
|-----------|---------|
| **Scope** | Remove duplicate pricing logic from pm-dashboard-synthesis.ts. Verify all dashboards render correctly with the new data shapes. Smoke test health score, briefing, sprint, PM dashboard, usage, and search. |
| **Depends On** | Tasks 2, 7, 8 (all components that consume pricing or dashboard data) |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] No duplicate `estimateCost` or pricing calculation outside of `ai-pricing.ts`
- [ ] `pm-dashboard-synthesis.ts` imports `calculateCost` from `ai-pricing.ts`
- [ ] Health score on discovery dashboard shows correct Green/Yellow/Red badge
- [ ] Briefing header shows all 5 metrics (health, questions, blocked, roadmap, requirements)
- [ ] Sprint dashboard shows missing fields, workload, and conflicts
- [ ] PM dashboard shows risk summary, deadlines, and client items
- [ ] Usage & Costs tab loads with correct data for SA/PM, hidden for other roles
- [ ] Search returns results for all 8 entity types
- [ ] Smart search toggle works (off = no embedding call, on = includes semantic)
- [ ] No TypeScript errors from changed interfaces

**Implementation Notes:**
- In `pm-dashboard-synthesis.ts`, find and remove any inline cost calculation. Replace with import from `ai-pricing.ts`.
- Run `npx tsc --noEmit` to catch type errors from changed interfaces (HealthScore, CachedBriefing, PmDashboardData, SearchEntityType, etc.).
- Test each dashboard page manually or write a brief integration checklist.
- This is the final cleanup/verification task for the phase.

---

## Summary

| # | Task | Complexity | Depends On | Gaps Addressed |
|---|------|-----------|------------|----------------|
| 1 | Schema migration (AuditLog, cost caps, tsvector) | M | None | GAP-RBAC-014 (schema), GAP-RBAC-016 (schema), GAP-DASH-019 (schema) |
| 2 | Health score rework -- signal counter model | M | Task 1 | GAP-DASH-001, GAP-DASH-002, GAP-DASH-003, GAP-DASH-024 |
| 3 | Health score threshold settings UI | S | Task 2 | GAP-DASH-002 (UI) |
| 4 | Briefing header + epic status section | M | None | GAP-DASH-004, GAP-DASH-006 |
| 5 | Blocked items data quality + structured focus | M | Task 4 | GAP-DASH-005, GAP-DASH-007 |
| 6 | Sprint dashboard completeness | M | None | GAP-DASH-009, GAP-DASH-010, GAP-DASH-011 |
| 7 | PM dashboard completeness | M | None | GAP-DASH-012, GAP-DASH-013, GAP-DASH-014 |
| 8 | Usage & Costs backend | M | None | GAP-DASH-016, GAP-DASH-017, GAP-DASH-025, GAP-RBAC-010 |
| 9 | Usage & Costs settings tab UI | M | Task 8 | GAP-DASH-015, GAP-RBAC-010 |
| 10 | Search entity expansion | M | Task 1 | GAP-DASH-019, GAP-DASH-021 |
| 11 | Execution plan improvements | S | None | GAP-DASH-022, GAP-DASH-023 |
| 12 | Auto-refresh event wiring | S | None | GAP-DASH-026 |
| 13 | Audit logging implementation | M | Task 1 | GAP-RBAC-014 |
| 14 | Cost cap enforcement | M | Tasks 1, 8 | GAP-RBAC-016 |
| 15 | Pricing consolidation + verification | S | Tasks 2, 7, 8 | GAP-DASH-025 |
| 16 | Route briefing generation calls to Briefing/Status Pipeline (remove any direct AI calls) | S | Phase 2 | Addendum v1 |

**Totals:** 15 tasks (4 Small, 11 Medium). 25 gaps addressed, 4 deferred to V2 (GAP-DASH-008, GAP-DASH-018, GAP-DASH-020, GAP-DASH-023 visualization only).
