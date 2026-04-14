# Phase 7 Tasks: Dashboards, Search

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 16
> Status: 0/16 complete
> Last Updated: 2026-04-14 (Wave 3 audit-fix)

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
  ├── Task 15 (Pricing consolidation + integration test)  ─── after Tasks 2, 7, 8 (all pricing consumers)
  │
  └── Task 16 (Briefing/Status Pipeline integration)  ─── Phase 2 pipeline published; also closes GAP-01/GAP-09
```

---

## Tasks

### Task 1: Schema Migration -- AuditLog, Cost Cap State, Event Audit, tsvector Columns

| Attribute | Details |
|-----------|---------|
| **Scope** | Add AuditLog model, cost cap fields + alert state on Project, per-member daily limit, FirmCostState model, event_audit model, and search_vector columns/triggers for Story, OrgComponent, BusinessProcess, Risk. |
| **REQ IDs** | PRD-17-20, PRD-23-03, PRD-23-12, ADD-5.4-01 (tsvector substrate inputs) |
| **Decisions** | DECISION-08 (firm-wide orphan), DECISION-09 (advisory) |
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
- [ ] `Project.costCapAlertFiredAt` (DateTime?, nullable) added -- dedupe anchor (PHASE-7-GAP-05)
- [ ] `Project.costCapAlertType` (String?, nullable -- `"COST_THRESHOLD_WARNING" | "COST_CAP_EXCEEDED"`) added
- [ ] `ProjectMember.dailySessionLimit` (Int?, nullable) added
- [ ] `FirmCostState` model added -- key `yearMonth` (String PK, format `YYYY-MM`), `firmCostCapAlertFiredAt` (DateTime?), `firmCostCapAlertType` (String?)
- [ ] `event_audit` model added -- id (UUID PK), projectId (FK, nullable for firm-level events), eventName (String), firedAt (DateTime @default(now())); indexes `(projectId, firedAt DESC)` and `(eventName)`
- [ ] `Story` table has `search_vector tsvector` column, GIN index, and auto-update trigger on title + description + acceptanceCriteria (verify: if Phase 6 already added this, skip)
- [ ] `OrgComponent` table has `search_vector tsvector` column, GIN index, trigger on apiName + label (skip if present)
- [ ] `BusinessProcess` table has `search_vector tsvector` column, GIN index, trigger on name + description (skip if present)
- [ ] `Risk` table has `search_vector tsvector` column, GIN index, trigger on title + description + mitigationStrategy (PRD-17-20)
- [ ] Migration applies cleanly; `npx prisma generate` succeeds

**Implementation Notes:**
- Add AuditLog, FirmCostState, and event_audit models to `prisma/schema.prisma`.
- The search_vector columns cannot be defined in Prisma schema. Use a raw SQL migration file. Check if Phase 6 migrations already created Story/OrgComponent/BusinessProcess -- if so, skip those. Risk is new for Phase 7 per PRD-17-20.
- All new fields are nullable, so no backfill needed.
- These tsvector columns are consumed by Phase 11 `search_project_kb` / `search_org_kb`, NOT by `src/lib/search/global-search.ts` (see Task 10 + DECISION-05).

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

### Task 5: Blocking Questions Data Quality (Age, Owner, Affected Stories) and Structured Focus Rendering

| Attribute | Details |
|-----------|---------|
| **Scope** | Add age, owner, and affected-stories to blocked items display. Render pipeline-produced structured recommended focus. Do NOT edit `dashboard-synthesis.ts` prompt (that path is removed in Task 16). |
| **REQ IDs** | PRD-17-03, PRD-17-04, PRD-6-21, PRD-8-22 |
| **Decisions** | -- (prompt ownership shifts to Phase 2 per Task 16; carry-forward #4 briefing mapping) |
| **Depends On** | Task 4 (briefing header layout), Task 16 (pipeline available for live data; type-only coupling otherwise) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `getBlockedItems` query includes `askedDate`, `ownerDescription`, and joins the question→story relation to return `affectedStories: Array<{ storyId, storyDisplayId, storyTitle }>` per question (PHASE-7-GAP-08)
- [ ] `blocked-items.tsx` renders age ("X days ago"), owner name, and affected-stories pills/links to story detail pages
- [ ] `CachedBriefing.recommendedFocus` type is `Array<{ rank: number, questionId: string, questionDisplayId: string, questionText: string, reasoning: string }> | null`
- [ ] `ai-summary-card.tsx` renders recommended focus as numbered list with question displayId links and reasoning text
- [ ] Legacy string-format `recommendedFocus` renders as prose with a "Refresh" button that invokes `invokeBriefingPipeline(..., { bypassCache: true })`
- [ ] Task 5 does NOT modify `src/lib/agent-harness/tasks/dashboard-synthesis.ts` -- prompt ownership lives in the Phase 2 pipeline (see Task 16)

**Implementation Notes:**
- In `queries.ts`, add `askedDate: true, ownerDescription: true` to the blocked items select and include the story join (`QuestionStory` or Phase 4 equivalent) returning story displayId + title.
- In `blocked-items.tsx`, compute age as `differenceInDays(new Date(), question.askedDate)` using date-fns.
- Update the `CachedBriefing` interface if not already updated by Task 16.
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

**REQ IDs:** PRD-17-15 (velocity added per Wave 3 audit-fix)

**Acceptance Criteria:**
- [ ] `PmDashboardData` includes `riskSummary`, `upcomingDeadlines`, `clientItems`, and `velocity` fields
- [ ] Risk summary: risks grouped by severity, top 5 open risks listed
- [ ] Upcoming deadlines: next 5 milestones with targetDate, progress %, days remaining
- [ ] Client items: open questions with client owner past follow-up threshold
- [ ] `velocity: { completedPointsByPast3Sprints: number[], averagePerSprint: number }` computed from last 3 COMPLETED sprints (fewer if not available); average taken across present entries only (PHASE-7-GAP-03, PRD-17-15)
- [ ] PM dashboard synthesis Inngest function computes all four data sections
- [ ] Risk summary card component renders severity badges and open risk list
- [ ] Upcoming deadlines card shows countdown badges (red for <7 days, yellow for <14 days)
- [ ] Client items card lists questions with age and owner
- [ ] Velocity card shows sparkline/bar strip over past 3 sprints + numeric average

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

**REQ IDs:** PRD-23-04, PRD-23-05, PRD-23-06, PRD-23-07, PRD-23-08, PRD-23-09, PRD-23-12, PRD-19-10. **Decision:** DECISION-08 (PRD-23-12 orphan).

**Acceptance Criteria:**
- [ ] `getProjectUsage(projectId, startDate, endDate)` returns totals for date range
- [ ] `getUsageByTaskType(projectId, startDate, endDate)` groups by taskType with cost
- [ ] `getUsageByMember(projectId, startDate, endDate)` groups by userId, resolves displayName via ProjectMember
- [ ] `getDailyUsageTrend(projectId, startDate, endDate)` returns daily token + cost aggregates
- [ ] `getWeeklyUsageTrend(projectId, startDate, endDate)` returns ISO-week aggregates (PHASE-7-GAP-10)
- [ ] `getMonthlyUsageTrend(projectId, startDate, endDate)` returns calendar-month aggregates
- [ ] `getInngestEventVolume(projectId, startDate, endDate)` returns `Array<{ eventName: string, count: number }>` from `event_audit` (PHASE-7-GAP-03, PRD-23-12)
- [ ] New Inngest middleware `src/lib/inngest/middleware/event-audit.ts` logs every event fire into `event_audit` (projectId pulled from event payload when present); failure is swallowed and logged
- [ ] All functions accept date range, default to last 30 days
- [ ] `UsageDashboardData` declared return type covers totals, byTaskType, byMember, `trend: { bucket: "day" | "week" | "month", points: [...] }`, `eventVolume: [...]`
- [ ] `getUsageDashboard` server action combines all queries with `requireRole(["SOLUTION_ARCHITECT", "PM"])`
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
- [ ] Trend line chart bucket auto-switches by range (≤31 days → day, 32-120 → week, >120 → month) with optional Day/Week/Month user override (PHASE-7-GAP-10, PRD-23-08)
- [ ] "Event Volume" card below task-type breakdown lists Inngest event names + fire counts for selected range (PRD-23-12)
- [ ] Loading skeletons for each section
- [ ] Empty state when no usage data exists

**Implementation Notes:**
- Create `src/app/(dashboard)/projects/[projectId]/settings/usage/page.tsx` as a server component that checks role and renders the client component.
- `src/components/settings/usage-dashboard.tsx`: client component with date range state, calls server action via SWR or direct fetch, renders sections.
- `src/components/settings/usage-trend-chart.tsx`: minimal chart component. Check if recharts or any chart lib is already installed. If not, use a lightweight option or install recharts.
- Add "Usage & Costs" link to the settings layout navigation, conditionally rendered by role.

---

### Task 10: Search Adapter Over `search_project_kb` / `search_org_kb` (All 8 Entity Types)

| Attribute | Details |
|-----------|---------|
| **Scope** | Rewrite `src/lib/search/global-search.ts` as a thin adapter that fans out to `search_project_kb` (project-scoped entities incl. Risk) and `search_org_kb` (org-scoped). Merge grouped results. Add Smart Search toggle and auto-activation heuristic. No tsvector SQL in `global-search.ts`. |
| **REQ IDs** | PRD-17-19, PRD-17-20, PRD-17-21, ADD-5.4-01 |
| **Decisions** | DECISION-05 (consume via `search_org_kb`; branch on `SearchResponse._meta.not_implemented`) |
| **Depends On** | Task 1 (tsvector columns consumed by substrate), Phase 11 (`search_project_kb` / `search_org_kb` merged OR returning `_meta.not_implemented = true`) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `SearchEntityType` includes `"question" | "decision" | "requirement" | "risk" | "story" | "orgComponent" | "businessProcess" | "knowledgeArticle"` (PRD-17-20: Risk included)
- [ ] `GroupedSearchResults` has arrays for all 8 entity types
- [ ] `src/lib/search/global-search.ts` contains NO references to `to_tsvector` or `to_tsquery` (unit test enforces via grep/regex)
- [ ] Adapter calls `search_project_kb({ projectId, query, entities: [...], semantic })` for project-scoped entities and `search_org_kb({ query, entities: [...], semantic })` for org-scoped entities (PHASE-7-GAP-02, ADD-5.4-01)
- [ ] Adapter branches on `SearchResponse._meta.not_implemented` (not on array length) per DECISION-05; surfaces pending state for affected entity families
- [ ] `SearchResponse<T> = { results: T[], _meta: { not_implemented?: boolean, layerUsed: 1|2|3, totalResults: number } }` declared in adapter types
- [ ] "Smart Search" toggle in command palette; default off; passes `semantic: true|false` to both substrates
- [ ] `SMART_SEARCH_AUTO_THRESHOLD = 5` constant triggers auto-activation of Layer 3 when toggle off AND combined `totalResults < 5` (PRD-17-21, PHASE-7-GAP-06)
- [ ] When semantic is on but selected entity families have no embedding coverage, UI shows chip: "Semantic search is not yet available for these entity types -- rolling out in a later phase"
- [ ] Result items link to appropriate detail pages for each of the 8 entity types
- [ ] Unit test: fails build if `global-search.ts` contains `to_tsvector` or `to_tsquery`

**Implementation Notes:**
- The substrate functions own BM25 + hybrid retrieval. Phase 7 never issues raw tsvector SQL.
- Facets (status filters, etc.) are applied in the adapter after the substrate returns results.
- If Phase 11 has not landed at execution time, the substrate returns `_meta.not_implemented = true`. The adapter must handle this deterministically and display a "Search substrate pending" chip rather than returning zero results silently.

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

### Task 14: Cost Caps -- Per-Project (Blocking), Per-Member (Blocking), Firm-Wide (Advisory)

| Attribute | Details |
|-----------|---------|
| **Scope** | `checkCostCap` (per-stage, advisory-lock safe) for per-project + per-member. Daily cron `checkFirmCostCap` for firm-wide advisory. Pinned interfaces for `CostCapExceededError` and `NOTIFICATION_SEND` cost payload. Cost cap settings UI. |
| **REQ IDs** | PRD-23-03 (all three clauses: per-project, per-member, firm-wide) |
| **Decisions** | DECISION-08 (firm-wide orphan → Phase 7), DECISION-09 (firm-wide advisory only; no enforcement gate) |
| **Depends On** | Task 1 (schema fields + FirmCostState + cost cap state columns), Task 8 (usage queries for current month aggregation) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `checkCostCap(projectId, userId)` in `src/lib/agent-harness/cost-cap.ts` acquires a Postgres advisory lock `pg_advisory_xact_lock(hashtext('cost-cap:'||projectId))` inside a transaction that reads month-to-date usage (PHASE-7-GAP-05)
- [ ] Throws `CostCapExceededError` (per-project cap) when `monthlyCostCapCents` exceeded
- [ ] Throws `CostCapExceededError` (per-member daily) when `dailySessionLimit` exceeded (aborted sessions count; UTC midnight boundary)
- [ ] At 80% per-project, emits `NOTIFICATION_SEND` with `COST_THRESHOLD_WARNING`; dedupe 24h via `Project.costCapAlertFiredAt` + `Project.costCapAlertType`
- [ ] At 100%, emits `COST_CAP_EXCEEDED` and blocks execution
- [ ] `executeTask` in `engine.ts` calls `checkCostCap` before each pipeline stage (not just once per call) (PHASE-7-GAP-05)
- [ ] Cap change to `monthlyCostCapCents` clears `Project.costCapAlertFiredAt` so 80% alert can re-fire against the new value
- [ ] `CostCapExceededError` interface matches §2.13 pinned shape: `{ code, projectId, currentCents, capCents, userMessage, scope: "project" | "member_daily" }`
- [ ] `NOTIFICATION_SEND` cost payload matches §2.13 pinned shape with `type`, optional `projectId`, `thresholdPct: 80 | 100`, `currentCents`, `capCents`, `recipients: string[]`
- [ ] New Inngest cron `src/lib/inngest/functions/firm-cost-check.ts` runs daily at 06:00 UTC; reads `FIRM_MONTHLY_COST_CAP_CENTS` from `src/lib/config/cost-caps.ts`; aggregates SessionLog across all projects for current UTC month
- [ ] At 80% firm-wide, emits `FIRM_COST_THRESHOLD_WARNING`; at 100% emits `FIRM_COST_CAP_EXCEEDED`; deduped via `FirmCostState` row for `yearMonth`
- [ ] Firm-wide advisory DOES NOT call `checkCostCap` or short-circuit `executeTask` (DECISION-09)
- [ ] Recipients for firm-wide alerts: users with role `FIRM_ADMIN`; fallback to SA+PM if role not defined (documented)
- [ ] Cost cap settings form in project settings (SA/PM only); monthly cap in dollars (stored as cents), optional per-member daily limit
- [ ] Null/empty per-project cap = no enforcement; null firm-wide config = no advisory

**Implementation Notes:**
- Time zone: all "current month" and "start of day" computations use UTC. Form help text states this.
- Reset `Project.costCapAlertFiredAt` is wired into the settings update server action, not into the cron.
- The `scope: "member_daily"` branch of `CostCapExceededError` carries `capCents` as the integer daily-session limit repurposed; alternatively the error can carry `limit` + `count` in a `memberScope` shape -- pin the exact shape in the deep-dive work for this task before implementation.
- Forward-compatible flag `firmCapBlocksExecution` (default `false`) is defined in `cost-caps.ts` but ignored by V1 runtime.

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

### Task 16: Briefing/Status Pipeline Integration (Replace Legacy `dashboard-synthesis` Path)

| Attribute | Details |
|-----------|---------|
| **Scope** | Route all Phase 7 AI-generated briefing content (Current Focus, Recommended Focus) through the Phase 2 Briefing/Status Pipeline. Remove or shim the legacy `src/lib/agent-harness/tasks/dashboard-synthesis.ts` path. Implement the Phase 7 consumer of `invokeBriefingPipeline`. Cache row carries `generated_at` + `inputs_hash`. Stage 4 validator gates the cache write. |
| **REQ IDs** | ADD-5.2.4-01, ADD-5.2.4-02, ADD-5.2.4-03, ADD-5.2.4-04, ADD-5.2.4-05, PRD-6-21, PRD-6-22, PRD-17-03, PRD-17-05 |
| **Decisions** | DECISION-08 (PRD-17-05 Current Focus consumer assigned here; Phase 2 emits). Carry-forward #4: reuse `daily_standup` / `weekly_status` -- do NOT add new briefing-type enum values. |
| **Depends On** | Phase 2 (published `invokeBriefingPipeline` + `BriefingType` enum + Stage 4 validator + `BRIEFING_REGENERATED` event) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `src/lib/dashboard/briefing-loader.ts` exists and exports:
  ```ts
  loadBriefing(projectId: string, briefingType: BriefingType): Promise<CachedBriefing | null>
  refreshBriefing(projectId: string, briefingType: BriefingType): Promise<CachedBriefing>
  ```
  `loadBriefing` reads `CachedBriefing`. `refreshBriefing` calls `invokeBriefingPipeline(projectId, briefingType, { bypassCache: true })`.
- [ ] Discovery dashboard Current Focus narrative sourced from pipeline via `briefing_type = daily_standup` (carry-forward mapping)
- [ ] Discovery dashboard Recommended Focus ranked list sourced from pipeline via `briefing_type = weekly_status`
- [ ] PM dashboard Current Focus sourced from pipeline via `briefing_type = daily_standup`
- [ ] `CachedBriefing` row includes `generated_at` (DateTime) and `inputs_hash` (String, SHA-256 over canonicalized Stage 1 deterministic metrics) (ADD-5.2.4-05)
- [ ] Stage 4 deterministic validator (forbidden phrases, numeric parity with Stage 1 outputs) runs and blocks the cache write on failure (ADD-5.2.4-04); Phase 7 surfaces "narrative pending" when no cache row exists
- [ ] Debounce + TTL + manual-refresh interaction matches §2.14 rule: debounced 30s per `(projectId, briefingType)`; skip Stages 2-4 when `inputs_hash` unchanged and cache <5 min old; manual refresh bypasses both and emits `BRIEFING_REGENERATED`
- [ ] `src/lib/agent-harness/tasks/dashboard-synthesis.ts` is removed OR shimmed to a function that delegates to `invokeBriefingPipeline(..., 'daily_standup')` and throws if Phase 2 is not deployed; no prompt text remains in this file
- [ ] Phase 7 does NOT add new values to the `BriefingType` enum
- [ ] Unit test: `src/lib/agent-harness/tasks/dashboard-synthesis.ts` contains no `system:` / `user:` prompt strings (validates prompt ownership has moved)
- [ ] Integration test: manual refresh triggers a pipeline run that writes a new `CachedBriefing` row with updated `generated_at` and either the same or new `inputs_hash`

**Implementation Notes:**
- Phase 2 publishes `invokeBriefingPipeline`. Import it from the published path (to be confirmed in Phase 2 deep-dive; reference in §8 Outstanding).
- The `PROJECT_STATE_CHANGED` wiring in Task 12 triggers a debounced call into the pipeline (pipeline owns the debounce window; Task 12 just emits the event).
- If Phase 2 exposes a `discovery_gap_report` briefing type, Phase 7 uses it for the discovery gap narrative; otherwise the discovery gap narrative is served from `weekly_status` output.
- No Sonnet calls are made from Phase 7 code in this task.

---

## Summary

| # | Task | Complexity | Depends On | REQ IDs / Gaps Addressed |
|---|------|-----------|------------|--------------------------|
| 1 | Schema migration (AuditLog, cost cap state, FirmCostState, event_audit, tsvector incl. Risk) | M | None | PRD-17-20, PRD-23-03, PRD-23-12; GAP-RBAC-014, GAP-RBAC-016, GAP-DASH-019 |
| 2 | Health score rework -- signal counter model | M | Task 1 | PRD-5-29, PRD-17-16, PRD-17-17; GAP-DASH-001..003, GAP-DASH-024 |
| 3 | Health score threshold settings UI | S | Task 2 | PRD-17-17; GAP-DASH-002 (UI) |
| 4 | Briefing header + epic status section | M | None | PRD-17-02, PRD-17-06, PRD-8-20..25; GAP-DASH-004, GAP-DASH-006 |
| 5 | Blocked items data quality (age/owner/affected stories) + structured focus rendering | M | Task 4, Task 16 | PRD-17-03, PRD-17-04, PRD-6-21; GAP-DASH-005, GAP-DASH-007, PHASE-7-GAP-08 |
| 6 | Sprint dashboard completeness | M | None | PRD-17-10; GAP-DASH-009..011 |
| 7 | PM dashboard completeness (incl. velocity) | M | None | PRD-17-15; GAP-DASH-012..014, PHASE-7-GAP-03 |
| 8 | Usage & Costs backend (daily/weekly/monthly + event volume) | M | None | PRD-23-04..09, PRD-23-12, PRD-19-10; GAP-DASH-016/017/018/025, GAP-RBAC-010, PHASE-7-GAP-03/10 |
| 9 | Usage & Costs settings tab UI | M | Task 8 | PRD-19-10, PRD-23-04, PRD-23-12; GAP-DASH-015, GAP-RBAC-010, PHASE-7-GAP-10 |
| 10 | Search adapter over `search_project_kb` / `search_org_kb` (8 entity types incl. Risk) | M | Task 1, Phase 11 | PRD-17-19/20/21, ADD-5.4-01; GAP-DASH-019/021, PHASE-7-GAP-02/06 (DECISION-05) |
| 11 | Execution plan improvements | S | None | GAP-DASH-022, GAP-DASH-023 |
| 12 | Auto-refresh event wiring | S | None | PRD-6-22; GAP-DASH-026 |
| 13 | Audit logging implementation | M | Task 1 | GAP-RBAC-014 |
| 14 | Cost caps (per-project + per-member blocking; firm-wide advisory) | M | Tasks 1, 8 | PRD-23-03; GAP-RBAC-016, PHASE-7-GAP-04/05 (DECISION-08, DECISION-09) |
| 15 | Pricing consolidation + verification | S | Tasks 2, 7, 8 | PRD-23-09; GAP-DASH-025 |
| 16 | Briefing/Status Pipeline integration (replace legacy `dashboard-synthesis` path) | M | Phase 2 | ADD-5.2.4-01..05, PRD-6-21, PRD-6-22, PRD-17-03, PRD-17-05; PHASE-7-GAP-01/09 (DECISION-08; carry-forward #4 mapping) |

**Totals:** 16 tasks (3 Small, 13 Medium). All 10 PHASE-7-GAP items from `phase-07-audit.md` closed. V2 deferrals: GAP-DASH-008, GAP-DASH-020 (project-entity semantic -- owned by Phase 11 per Addendum §5.4), GAP-DASH-023 Gantt visualization. GAP-DASH-018 moved from V2 into V1 (Task 8/9).

---

## Revision History

| Date | Change |
|------|--------|
| 2026-04-10 | Initial tasks drafted. |
| 2026-04-13 | Addendum v1 note added as orphan "Task 16" row in summary table only. |
| 2026-04-14 | Wave 3 audit-fix: promoted Task 16 to full body with ACs (PHASE-7-GAP-01/09); expanded Task 1 (Risk tsvector, event_audit, FirmCostState, cost cap alert state); rewrote Task 5 to drop legacy prompt edit and add affected-stories (PHASE-7-GAP-08); added velocity to Task 7 (PHASE-7-GAP-03); expanded Task 8/9 with weekly/monthly bucketing + Inngest event volume (PHASE-7-GAP-03/10); rewrote Task 10 as substrate adapter with Risk + auto-activation (PHASE-7-GAP-02/06); expanded Task 14 with firm-wide advisory + concurrency advisory-lock + pinned interfaces (PHASE-7-GAP-04/05); added REQ-ID column to summary table (PHASE-7-GAP-07). Citations: DECISION-05, DECISION-08, DECISION-09. |
