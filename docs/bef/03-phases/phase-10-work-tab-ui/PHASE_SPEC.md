# Phase 10 Spec: Work Tab UI Overhaul

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Depends On: Phase 1 (RBAC, Security, Governance)
> Status: Draft
> Last Updated: 2026-04-10

---

## 1. Scope Summary

Build a shared page-level component library and completely redesign the Work tab experience. The shared components (PageHeader, DetailPageLayout, FilterBar, StatusBadge, ProgressBar, EditableField, MetadataSidebar, StatCard, enhanced EmptyState) establish reusable patterns for every page in the application. The Work tab itself gets redesigned with a multi-view overview (Epics table, Epics kanban, All Stories table, All Stories kanban), filter/search/sort capabilities, and Jira/Linear-inspired two-column detail pages for Epics, Features, and Stories. Kanban boards get richer cards, swimlane grouping, and column enhancements. Phase 10 also renders the Tasks tier within Story Detail (per `DECISION-06`, Phase 10 owns Tasks-tier UI; Phase 4 owns Tasks data/workflow).

**In scope:** 12 tasks across 3 layers (shared components, page overhauls, kanban/table enhancements), plus Tasks-tier rendering inside Story Detail (`DECISION-06`), accessibility requirements (WCAG 2.1 AA), and a role-based Developer default view.
**Out of scope:** Activity feeds/comment threads (future phase), timeline/Gantt views (V2; PRD-17-11..14 owned by Phase 7), sprint dashboards (PRD-17-10, Phase 7), custom fields (V2), keyboard shortcuts beyond a11y baselines (V2).

**Traces to:** PRD-10-01, PRD-10-02, PRD-10-03..10, PRD-10-14, PRD-12-01, PRD-19-04, PRD-19-05, PRD-19-06, PRD-19-07, PRD-19-08.

---

## 2. Functional Requirements

### 2.1 Shared Component Library

**Traces to:** PRD-10-01, PRD-10-02 (enables hierarchy rendering), reusable foundation for PRD-10-03..10 inline editing.


#### 2.1.1 Centralized Status Colors + StatusBadge

- **What it does:** Extracts the 4 duplicate inline status color maps (epic-detail-client, feature-detail-client, story-table, story-kanban) into a single `src/lib/status-colors.ts` module. Creates a `StatusBadge` component that renders the correctly colored badge for any entity type.
- **Inputs:** Entity type (`epic` | `feature` | `story` | `question` | `defect`) + status enum value
- **Outputs:** Colored Badge component with correct bg/text/border colors
- **Business rules:** All existing color values preserved exactly. The 7 story statuses, 3 epic/feature statuses, and priority colors all centralized. Components that currently hardcode these colors (epic-detail-client lines 45-49, feature-detail-client lines 44-48, story-table, story-kanban, epic-table, epic-kanban) must be migrated to use the shared component.

#### 2.1.2 PageHeader

- **What it does:** Provides a consistent page header used across all pages: breadcrumb trail, page title, optional description/subtitle, and right-aligned action buttons.
- **Inputs:** `breadcrumbs: Segment[]`, `title: string`, `subtitle?: string`, `actions?: ReactNode`, `badge?: ReactNode`
- **Outputs:** Rendered header with consistent spacing, typography, and layout
- **Business rules:** Replaces the current ad-hoc headers on Work, Epic Detail, Feature Detail, and Story Detail pages. Breadcrumb uses the existing `WorkBreadcrumb` pattern but is generalized for any page. Title is `text-2xl font-semibold`. Actions slot renders on the right side (flex justify-between).

#### 2.1.3 DetailPageLayout + MetadataSidebar

- **What it does:** Two-column layout component inspired by Jira/Linear issue detail. Left column (~65-70%) holds the main content (description, child items, tabs). Right column (~30-35%) holds a fixed metadata sidebar with labeled field rows.
- **Inputs:** `children` (main content), `sidebar` (ReactNode for right column), `sidebarWidth?: string`
- **Outputs:** Responsive two-column layout. On screens < 1024px, sidebar stacks below main content.
- **Business rules:** MetadataSidebar is a companion component that renders labeled field rows: `label` + `value` pairs in a vertical stack with consistent spacing. Supports custom renderers per field (e.g., StatusBadge for status, avatar for assignee, date formatter for timestamps). Sticky positioning on scroll (top offset accounts for header).

#### 2.1.4 EditableField

- **What it does:** Click-to-edit pattern for inline field editing on detail pages. Display mode shows the current value with a subtle hover indicator. Click enters edit mode with the appropriate input type. Save/cancel buttons or Enter/Escape keys commit or discard.
- **Inputs:** `value`, `onSave: (newValue) => Promise<void>`, `type: "text" | "textarea" | "select"`, `options?: SelectOption[]`, `placeholder?: string`
- **Outputs:** Toggles between display and edit modes. Shows loading state during save. Toast on error.
- **Business rules:** Used for title, description, status, priority, assignee on detail pages. For `select` type, renders a dropdown. For `textarea`, renders a resizable textarea. Escape key cancels without saving. Enter key saves for `text` type. Ctrl+Enter saves for `textarea`.

#### 2.1.5 ProgressBar + StatCard

- **What it does:** `ProgressBar` shows a segmented horizontal bar (like Jira's epic progress) with color-coded segments representing status distribution. `StatCard` shows a single metric (number + label) in a compact card.
- **Inputs (ProgressBar):** `segments: Array<{ count: number, color: string, label: string }>`, `showLabels?: boolean`
- **Inputs (StatCard):** `label: string`, `value: number | string`, `icon?: LucideIcon`, `trend?: "up" | "down" | "neutral"`
- **Outputs:** Visual progress indicator and metric cards
- **Business rules:** ProgressBar segments are proportional to counts. Zero-count segments are hidden. Hover on a segment shows a tooltip with count and label. StatCard used in Epic/Feature detail sidebars to show story counts, point totals, completion percentages.

#### 2.1.6 FilterBar

- **What it does:** Horizontal filter/search/sort bar that sits below the page header and above content. Contains a search input, filter dropdowns (status, priority, assignee, etc.), sort selector, and an optional group-by selector.
- **Inputs:** `searchPlaceholder: string`, `filters: FilterConfig[]`, `sortOptions: SortOption[]`, `onFilterChange`, `onSortChange`, `onSearchChange`, `groupByOptions?: GroupByOption[]`
- **Outputs:** Rendered filter bar with active filter pills. All filter state persisted to URL via nuqs.
- **Business rules:** Search is debounced (300ms). Filters apply with AND logic. Active filters shown as dismissible chips/pills below the bar. Filter state survives page navigation via URL params. Clear All button resets all filters.

#### 2.1.7 Enhanced EmptyState

- **What it does:** Enhances the existing `EmptyState` component (src/components/shared/empty-state.tsx) with an optional icon, illustration slot, and secondary action.
- **Inputs:** Existing props + `icon?: LucideIcon`, `secondaryAction?: { label, href }`, `illustration?: ReactNode`
- **Outputs:** Centered empty state with icon, heading, description, primary CTA, and optional secondary CTA
- **Business rules:** Each entity type gets a tailored empty state message that guides the user to the right next action. Canonical copy is pinned in the table below and consumed by Tasks 2 and 8.

**Canonical empty-state content (authoritative):**

| View/State | Heading | Body | Primary CTA | Secondary CTA |
|---|---|---|---|---|
| Epics Table/Kanban, 0 epics | "No epics yet" | "Create your first epic to start planning work for this project." | "New Epic" | "Generate with AI" |
| All Stories Table/Kanban, 0 stories | "No stories yet" | "Stories appear here once epics have features and features have stories." | "Create Epic" (links to Work overview) | — |
| Feature list, 0 features | "No features in this epic" | "Add features to group related stories, or create stories directly on the epic." | "New Feature" | "Generate Stories" |
| Story list, 0 stories | "No stories in this feature" | "Add your first story." | "Create Story" | "Generate with AI" |
| Tasks list, 0 tasks (Story Detail) | "No tasks yet" | "Break this story into tasks to track execution work." | "New Task" | — |
| Filter → 0 results | "No results match your filters" | "Try clearing some filters or adjusting your search." | "Clear filters" | — |
| Kanban column, 0 items | — | Column shows its count badge (0) and a muted "Drop items here" hint | — | — |
| Swimlane group, 0 items | Hidden by default (empty groups suppressed) | — | — | — |

### 2.2 Work Overview Page Redesign

**Traces to:** PRD-10-01, PRD-10-02, PRD-12-01. PRD-17-10 (sprint dashboard) and PRD-17-11..14 (Execution Plan timeline) are owned by Phase 7 and deliberately out of Phase 10 scope.

- **What it does:** Replaces the current Work page (simple epic table + view toggle) with a multi-view work hub inspired by Jira/Asana project views.
- **Views available:**
  1. **Epics (Table)** — Enhanced epic table with progress column, filter/sort/search
  2. **Epics (Kanban)** — Enhanced epic kanban with richer cards
  3. **All Stories (Table)** — Flat table of ALL stories across all epics, with epic/feature columns, filter/sort/search, bulk actions
  4. **All Stories (Kanban)** — Story kanban with swimlane grouping options
- **View switching:** Horizontal tab bar below the page header (not the current two-button toggle). Each view tab has an icon and label. Active tab is underlined/highlighted.
- **Business rules:** Default view is "Epics (Table)" for all non-Developer roles. View selection persisted to URL via `?view=epics-table|epics-kanban|stories-table|stories-kanban`. The "All Stories" views require fetching stories across all epics; the server component must support this query. FilterBar config changes per view (epic view filters by epic status; story view filters by status, priority, assignee, epic, feature, sprint).
- **Developer default view (PRD-12-01):** When `getCurrentMember().role === "DEVELOPER"` and no `?view=` param is present, the Work page redirects to `?view=stories-table&assignee=<currentMemberId>&status=SPRINT_PLANNED,IN_PROGRESS,IN_REVIEW`. A pre-applied "My Work" filter pill is rendered and dismissible (dismissal clears the assignee/status preset but keeps the stories-table view). Non-Developer roles land on the default Epics (Table) view unchanged.

### 2.3 Epic Detail Page Redesign

**Traces to:** PRD-10-01, PRD-10-02, PRD-10-14.

- **What it does:** Replaces the current flat layout (header + feature table) with a Jira-style two-column detail page.
- **Left column (main content):**
  - Epic title (inline editable via EditableField)
  - Epic description (inline editable, rich text display with whitespace-pre-wrap)
  - Features list with FilterBar (search, sort by name/status/story count) and table/kanban toggle
  - "New Feature" and "Generate Stories" buttons in the features section header
- **Right column (metadata sidebar):**
  - Status (click-to-change via EditableField select)
  - Epic prefix (read-only, monospace)
  - Created date, Updated date
  - Progress bar (stories by status: Not Started / In Progress / Done)
  - Stats: total features, total stories, total story points, completion percentage
- **Business rules:** The current inline edit mode (isEditing state with Save/Cancel) is replaced by per-field inline editing via EditableField. Each field saves independently. The metadata sidebar is sticky on scroll.

### 2.4 Feature Detail Page Redesign

**Traces to:** PRD-10-01, PRD-10-02, PRD-10-14.

- **What it does:** Same two-column pattern as Epic Detail, scoped to a feature.
- **Left column:** Feature title (editable), description (editable), stories list with FilterBar and table/kanban toggle, "New Story" button
- **Right column:** Status, feature prefix, parent epic (link), created/updated dates, progress bar (stories by status), stats (story count, points, completion %)
- **Business rules:** Mirrors the Epic Detail pattern for visual consistency. Story table shows full columns (same as current story-table.tsx) with bulk actions. The StoryForm slide-over for creating/editing stories is retained.

### 2.5 Story Detail Page Redesign

**Traces to:** PRD-10-02 (Tasks tier, per `DECISION-06`), PRD-10-03..10 (mandatory story fields), PRD-10-14 (status workflow), PRD-19-04 (management transitions), PRD-19-05 (execution transitions), PRD-19-06 (sprint assignment auto-transition), PRD-19-08 (separately permissioned sprint assignment vs content edit).

- **What it does:** Replaces the current flat layout (badges row + tabs) with a Jira/Linear-style two-column detail page. Also renders the Tasks tier inline within Story Detail (per `DECISION-06`).
- **Left column (main content):**
  - Story title (inline editable, large text)
  - Tabs: Details | QA (retained from current implementation)
  - Details tab sections (each inline editable via EditableField):
    - Description
    - Acceptance Criteria
    - Persona
    - Dependencies
    - Notes
    - Impacted Components (ComponentSelector integration)
    - **Tasks** (new, per `DECISION-06`): inline list of Task rows for this story. Each row shows: status checkbox (toggles OPEN↔DONE), title (click-to-edit text), assignee avatar+name (click-to-edit dropdown from project members), and a row-level delete action. An "Add task" row at the bottom creates a new Task. Phase 4 owns the underlying Task model, server actions, and workflow; Phase 10 consumes them as `listStoryTasks(projectId, storyId)`, `createStoryTask(projectId, storyId, { title, assigneeId? })`, `updateStoryTask(projectId, taskId, patch)`, `deleteStoryTask(projectId, taskId)`. Empty state renders the canonical "No tasks yet" copy from §2.1.7.
  - QA tab: TestExecutionTable + DefectCreateSheet (unchanged)
- **Right column (metadata sidebar):**
  - Status (click-to-change dropdown showing available transitions based on role)
  - Priority (click-to-change)
  - Assignee (click-to-change, shows avatar + name)
  - QA Assignee (click-to-change)
  - Sprint (click-to-change, shows "Unassigned" if null)
  - Story Points (click-to-edit number)
  - Feature (link to feature detail)
  - Epic (link to epic detail)
  - Defect count (badge, links to defects filtered by this story)
  - Test case count (badge)
  - Created date, Updated date
- **Business rules:** The "Edit" button that opens the StoryForm sheet is removed; all editing happens inline. The "Enrich with AI" button moves to the page header actions. Status transitions respect role-based rules from the story status machine (same as current StoryForm behavior). Assignee/QA Assignee dropdowns populate from project members.

#### 2.5.1 Permission gating per field (PRD-19-04, PRD-19-05, PRD-19-08)

Each inline-editable field on Story Detail is governed by a specific permission key. Fields render display-only (no hover affordance, no click-to-edit) when the current member's role does not hold the governing permission. The `EditableField` component receives a `canEdit: boolean` prop derived from `getCurrentMember().role` and the field's permission key.

| Field | Permission key | Roles per PRD §19.1 |
|---|---|---|
| Title, Description, Acceptance Criteria, Persona, Dependencies, Notes, Impacted Components, Priority, Assignee, QA Assignee, Story Points | "Create/edit user stories (content)" | SA, PM, BA, Developer, QA (per current spec; content edit) |
| Sprint | "Assign stories to sprints" | SA, PM |
| Status (management transitions: Draft ↔ Ready ↔ Sprint Planned) | "Transition story status (management)" | SA, PM, BA |
| Status (execution transitions: In Progress → In Review → QA → Done) | "Transition story status (execution)" | SA, Developer |
| Tasks (add, edit title/assignee, toggle status, delete) | "Create/edit user stories (content)" (Phase 4 confirms) | Same as content-edit |

Rule: The status dropdown displays only the transitions returned by `getAvailableTransitions(currentStatus, userRole)`. The Sprint field is disabled (display-only) for roles without "Assign stories to sprints" even when the same user has content-edit rights. If the server rejects a transition or save that the client thought was permitted (stale role cache), the UI shows a toast with the server error message and refetches story + current member to re-gate the sidebar.

#### 2.5.2 Sprint assignment auto-transitions status (PRD-19-06)

Saving a non-null sprint on a story in Draft or Ready status auto-transitions the status to Sprint Planned. The sidebar Status field must re-render to the new value from the same server round-trip (the server action returns the updated story and the UI updates both Sprint and Status from the single response; no second server call). Saving a sprint on a story already in an execution-phase status (In Progress, In Review, QA, Done) does not change the status. Clearing the sprint (setting it to null) does not auto-transition status.

#### 2.5.3 Draft completeness indicator (PRD-10-03..10, PRD-10-14)

Story Detail and the All-Stories table/kanban render an "incomplete Draft" indicator when the story is in Draft status and has unmet mandatory-field requirements. The indicator is driven by `missingMandatoryFields: string[]` (field array on the story payload, provided by Phase 4's server-side validator; defaults to empty until Phase 4 lands). When non-empty and status === Draft, an amber warning dot renders in the card footer (kanban) and in an optional Completeness column (story table), with tooltip `"{N} mandatory fields missing"`.

### 2.6 Kanban Card Redesign

**Traces to:** PRD-10-01, PRD-10-02, PRD-10-03..10 (Draft completeness indicator), PRD-10-14, PRD-12-01.

- **What it does:** Enhances kanban cards across all entity types (epic, feature, story) with more information and better visual hierarchy.
- **Epic card redesign:**
  - Title (line-clamp-2)
  - Mini progress bar (3-segment: not started/in progress/done stories)
  - Footer: prefix, feature count, story count, total points
- **Feature card redesign:**
  - Title (line-clamp-2)
  - Mini progress bar (stories by status)
  - Footer: prefix, story count, points
- **Story card redesign:**
  - Title (line-clamp-2)
  - Priority icon (colored dot, retained from current)
  - Labels: epic name pill (if in "All Stories" view)
  - Footer: displayId, story points badge, assignee avatar, sprint name (if assigned), Draft-completeness amber dot when `status === Draft` and `missingMandatoryFields.length > 0` (tooltip: "{N} mandatory fields missing")
- **Business rules:** Card width stays at min-w-[240px]. Cards remain draggable. Click navigates to detail page. Hover shows shadow-md (retained).

### 2.7 Kanban Swimlanes + Column Enhancements

**Traces to:** PRD-10-01, PRD-10-02, PRD-12-01.

- **What it does:** Adds swimlane grouping and column metadata to kanban boards.
- **Swimlanes (story kanban only):**
  - Group by: None (default), Epic, Assignee, Priority
  - Each swimlane is a collapsible horizontal row with its own set of status columns
  - Swimlane header shows group name + story count + collapse toggle
  - Group-by selector in the FilterBar (or inline above the board)
- **Column enhancements (all kanbans):**
  - Column header shows: status label + count badge (current) + optional WIP indicator
  - Collapsible columns (click header to minimize to just the header + count)
  - Column count updates dynamically on drag-drop
- **Business rules:** Swimlane state persisted to URL via `?groupBy=none|epic|assignee|priority`. Empty swimlanes are hidden by default. Column collapse state is local (not URL-persisted).

### 2.8 Table Sorting, Filtering, Search, and Pagination

**Traces to:** PRD-10-01, PRD-10-02, PRD-10-03..10 (optional Completeness column), PRD-12-01.

- **What it does:** Enhances all tables in the Work tab with sortable columns, integrated search, filtering, and pagination.
- **Sorting:** Clickable column headers with ascending/descending/unsorted toggle. Sort indicator arrows in header. Default sort retained (sortOrder asc).
- **Search:** Text search across title/name/displayId fields. Integrated into FilterBar.
- **Filtering:** Status, priority, assignee, epic, feature, sprint — configurable per table. Uses FilterBar component.
- **Pagination:** Client-side pagination for V1 (all data still fetched server-side). Page size selector (25/50/100). Page navigation controls at bottom of table. Shows "Showing X-Y of Z" count.
- **Business rules:** Sort and filter state persisted to URL via nuqs. Pagination resets to page 1 when filters change. Empty filtered state shows "No results match your filters" with a "Clear filters" button. Story table supports an optional Completeness column (hidden by default, user-toggleable via a column-visibility menu) rendering the Draft completeness dot from §2.5.3.

### 2.9 Accessibility (WCAG 2.1 AA)

**Traces to:** app-wide accessibility baseline (Phase 10 sets this standard for future phases).

Target: **WCAG 2.1 AA** across all Phase-10 components and pages. All Work-tab pages must pass an axe-core automated scan with zero serious/critical violations as part of the Phase 10 verification gate.

Specific accessibility requirements per a11y-sensitive pattern:

- **EditableField.** Tab into display enters focus ring; Enter or Space enters edit mode; focus lands on the input automatically; Escape cancels edit and returns focus to the trigger; Enter saves for `text`; Ctrl+Enter saves for `textarea`; aria-label derived from the field label; save loading state is announced via `aria-live="polite"`; screen reader reads "editable {label}, current value {value}".
- **Kanban drag-drop (Task 12).** Cards are focusable in DOM order via Tab. Keyboard pickup/move/drop uses the @dnd-kit KeyboardSensor defaults: Space picks up a focused card, arrow keys move between columns and rows, Space drops, Escape cancels. Pickup, move, and drop events are announced via `aria-live="assertive"` (card title + source column + destination column). Focus returns to the moved card after drop.
- **FilterBar Popover dropdowns (Task 6).** Radix Popover primitives provide Escape-closes and arrow navigation. Active-filter pills are focusable and Backspace-dismissible on focus. Tab order: search → filters → sort.
- **Swimlane collapse (Task 12).** Trigger has `aria-expanded`; section uses `role="region"` with `aria-labelledby` pointing to the swimlane heading.
- **ViewTabs (Task 6).** Built on Radix Tabs primitives (`role="tablist"`, tab/panel aria wiring).
- **MetadataSidebar (Task 3).** Semantic `dl`/`dt`/`dd` structure for labeled fields; inline-editable fields follow the EditableField rules above.
- **StatusBadge (Task 1).** Status is never signaled by color alone; the badge always includes a text label.
- **Pages.** All Work-tab pages pass an axe-core scan with zero serious/critical violations.

---

## 3. Technical Approach

### 3.1 Implementation Strategy

**Layer 1 (Tasks 1-5): Shared components first.** Build the reusable component library before touching any pages. This ensures page overhauls can compose from tested building blocks.

**Layer 2 (Tasks 6-10): Page overhauls.** Rebuild each page using the new components. Start with the Work Overview (highest impact, user's primary entry point), then Epic Detail, Feature Detail, Story Detail.

**Layer 3 (Tasks 11-12): Kanban and table enhancements.** These enhance the views that the page overhauls render. Built last because they depend on the new page structure being in place.

**Pattern:** Each shared component is built in isolation, exported from a barrel file, and tested visually before integration. Page overhauls replace existing client components — the server page.tsx files change minimally (may need additional data fetching for stats/progress).

### 3.2 File/Module Structure

```
src/
  lib/
    status-colors.ts           — CREATE: centralized status/priority color maps
  components/
    shared/
      page-header.tsx           — CREATE: consistent page header
      detail-page-layout.tsx    — CREATE: two-column layout + MetadataSidebar
      editable-field.tsx        — CREATE: click-to-edit pattern
      progress-bar.tsx          — CREATE: segmented progress bar
      stat-card.tsx             — CREATE: compact metric card
      filter-bar.tsx            — CREATE: search/filter/sort bar
      view-tabs.tsx             — CREATE: multi-view tab selector (replaces ViewToggle for Work page)
      empty-state.tsx           — MODIFY: add icon, secondary action props
    work/
      work-page-client.tsx      — REWRITE: multi-view hub with tabs
      epic-detail-client.tsx    — REWRITE: two-column layout
      feature-detail-client.tsx — REWRITE: two-column layout
      story-detail-client.tsx   — REWRITE: two-column layout with inline editing
      epic-table.tsx            — MODIFY: add progress column, sorting, pagination
      epic-kanban.tsx           — MODIFY: richer cards with progress bar
      feature-table.tsx         — MODIFY: add sorting, pagination
      feature-kanban.tsx        — MODIFY: richer cards
      story-table.tsx           — MODIFY: add sorting, search, pagination
      story-kanban.tsx          — MODIFY: richer cards, swimlane support
      view-toggle.tsx           — KEEP: still used on detail pages for table/kanban toggle
  app/(dashboard)/projects/[projectId]/
    work/
      page.tsx                  — MODIFY: fetch story data for "All Stories" view
      [epicId]/
        page.tsx                — MODIFY: fetch progress stats
      [epicId]/[featureId]/
        page.tsx                — MODIFY: fetch progress stats
      [epicId]/[featureId]/stories/[storyId]/
        page.tsx                — MODIFY: fetch project members for inline editing
```

### 3.3 URL State Management

All view/filter/sort state uses `nuqs` (already in the project) for URL persistence:

| Param | Values | Used On |
|-------|--------|---------|
| `view` | `epics-table`, `epics-kanban`, `stories-table`, `stories-kanban` | Work Overview |
| `view` | `table`, `kanban` | Epic Detail, Feature Detail (retained) |
| `q` | search string | All pages with FilterBar |
| `status` | comma-separated status values | Filter |
| `priority` | comma-separated priority values | Filter |
| `assignee` | member ID | Filter |
| `epic` | epic ID | Stories view filter |
| `feature` | feature ID | Stories view filter |
| `sprint` | sprint ID | Stories view filter |
| `sort` | `field:asc` or `field:desc` | All tables |
| `page` | page number | All tables |
| `pageSize` | `25`, `50`, `100` | All tables |
| `groupBy` | `none`, `epic`, `assignee`, `priority` | Story kanban |
| `tab` | `details`, `qa` | Story Detail (retained) |

**Invalid-param handling:** Each param has a whitelist of valid values (`view`, `groupBy`, `sort`, `tab`, `pageSize`). Invalid values fall back to the documented default silently (no toast, no redirect). `page` is clamped to `[1, totalPages]`. `pageSize` not in `{25, 50, 100}` falls back to `25`. This behavior applies uniformly across Work Overview, Epic Detail, Feature Detail, and Story Detail.

### 3.4 Data Changes

No database schema changes. All enhancements are UI-only. Server pages may need additional Prisma queries for:
- Story aggregation across all epics (Work Overview "All Stories" view)
- Story status counts per epic/feature (for progress bars)
- Project member list (for inline assignee editing on Story Detail)

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| Epic with 0 features, 0 stories | Progress bar shows empty (gray bar), stats show "0" | No error — valid state |
| Story with no feature assigned | Feature field in sidebar shows "Unassigned" | Clicking opens feature selector |
| Inline edit save fails (network error) | Field reverts to previous value, toast shows error | "Failed to update {field}. Please try again." |
| Inline edit with concurrent modification | Save proceeds (OCC not active until V2) | No conflict detection yet — last write wins |
| Filter returns 0 results | Table shows "No results match your filters" with "Clear filters" button | Not an error state |
| Very long epic name in breadcrumb | Truncate with ellipsis at max-width, show full name on hover tooltip | CSS text-overflow |
| Kanban with 100+ stories in one column | Column scrolls internally (max-height with overflow-y-auto) | No performance issue — already client-rendered |
| Swimlane group with 0 stories | Swimlane row hidden (empty groups not shown) | — |
| User with content-edit permission but not "Assign stories to sprints" | All sidebar fields except Sprint are inline-editable; Sprint renders display-only with no hover affordance | Silent; role check prevents edit UI |
| User with "Assign stories to sprints" but not content-edit | Inverse: only Sprint is editable; other fields render display-only | Silent; role check prevents edit UI |
| Server rejects a transition the client allowed (stale role cache) | Save call returns a 4xx error; UI shows toast with the server error message and refetches story + current member to re-gate the sidebar | "Failed to update {field}: {server error}" |
| Drag-drop to invalid status transition | Card snaps back to original column, toast shows error | "Cannot move from {from} to {to}" |
| Sprint save on Draft/Ready story | Status auto-transitions to Sprint Planned in the same server round-trip; sidebar Status field re-renders from the same response | No error |
| Sprint save on story already in execution phase (In Progress, In Review, QA, Done) | Sprint updates; Status is not changed | No error |
| Page resize from desktop to mobile | Two-column layout stacks to single column (sidebar below) | Responsive at lg breakpoint (1024px) |
| `?view=bogus` on any page with a view param | Falls back to the documented default view silently | No toast |
| `?groupBy=xyz` on story kanban | Falls back to `groupBy=none` silently | No toast |
| `?page=-1` or `?page=9999` | Clamped to `[1, totalPages]` silently | No toast |
| `?pageSize=9999` | Falls back to `25` silently | No toast |

---

## 5. Integration Points

### From Prior Phases

- **Phase 1 (RBAC and story status machine):** Role gates determine which fields are editable inline. `requireRole` and status-machine transitions are enforced server-side when saving inline edits. `getCurrentMember` provides the role for UI gating.

**Pinned Phase-1 exports consumed by Phase 10:**

| Export | Module | Signature | Used by |
|---|---|---|---|
| `getCurrentMember` | `src/lib/auth/rbac.ts` | `(projectId: string) => Promise<{ userId, memberId, role, permissions: string[] }>` | Task 8 (Developer default view), Task 11 (UI gating) |
| `requireRole` | `src/lib/auth/rbac.ts` | `(projectId: string, roles: Role[]) => Promise<void>` (throws on mismatch) | All server actions invoked by inline edits |
| `getAvailableTransitions` | `src/lib/work/story-status-machine.ts` | `(currentStatus: StoryStatus, role: Role) => StoryStatus[]` | Task 11 status dropdown options |
| `updateStory` | `src/server/actions/story.ts` | `(projectId: string, storyId: string, patch: Partial<Story>) => Promise<Story \| { error: string }>` | EditableField save (content fields) |
| `updateStoryStatus` | `src/server/actions/story.ts` | `(projectId: string, storyId: string, toStatus: StoryStatus) => Promise<Story \| { error: string }>` | Task 11 status save |
| `assignStoryToSprint` | `src/server/actions/sprint.ts` | `(projectId: string, storyId: string, sprintId: string \| null) => Promise<Story \| { error: string }>` | Task 11 sprint save; returns the updated story with the Sprint-Planned auto-transition already applied server-side |

All six exports are consumed via published barrel paths; module paths above are resolved against the Phase 1 codebase at execute time. If Phase 1 does not ship a `getFieldPermission(role, fieldKey)` helper, Phase 10 derives `canEdit` inline from `getCurrentMember().permissions` against the permission keys listed in §2.5.1; this is tracked as an open item in §7.

### From Phase 4 (Tasks-tier data / workflow; per `DECISION-06`)

Phase 10 renders Tasks-tier UI inside Story Detail (§2.5). Phase 4 owns the Task model, the `story_tasks` (or equivalent) table, and the server actions consumed here:

| Export (Phase 4) | Signature | Used by |
|---|---|---|
| `listStoryTasks` | `(projectId: string, storyId: string) => Promise<Task[]>` | Story Detail initial render |
| `createStoryTask` | `(projectId: string, storyId: string, input: { title: string, assigneeId?: string }) => Promise<Task \| { error: string }>` | "Add task" row |
| `updateStoryTask` | `(projectId: string, taskId: string, patch: { title?: string, assigneeId?: string \| null, status?: "OPEN" \| "DONE" }) => Promise<Task \| { error: string }>` | Inline title, assignee, status toggle |
| `deleteStoryTask` | `(projectId: string, taskId: string) => Promise<{ ok: true } \| { error: string }>` | Row delete |

### From Phase 4 (DRAFT→READY validation payload; per §2.5.3)

Phase 4 adds `missingMandatoryFields: string[]` to the story read payload (fed by Phase 4's server-side DRAFT→READY validator). Until Phase 4 lands, the field defaults to an empty array and the Draft completeness indicator is suppressed.

### For Future Phases
- **Phase 3 (Discovery/Questions):** The shared component library (PageHeader, DetailPageLayout, FilterBar, StatusBadge) can be adopted for the Questions pages.
- **Phase 4 (Work Management):** New functionality (DRAFT→READY validation, test case stubs, OrgComponent selector) will be built into the new Epic/Feature/Story detail layouts. The two-column Story Detail with inline editing provides the right home for the DRAFT→READY quality gate UI.
- **Phase 5 (Sprint/Developer):** Sprint-related inline editing (assign sprint, capacity) uses the EditableField component.
- **Phase 7 (Dashboards/Search):** StatCard and ProgressBar components are reused for dashboard widgets. FilterBar reused for search results page. StatusBadge used across all dashboard entity references.
- **Phase 8 (Documents/Notifications):** PageHeader and DetailPageLayout adopted for document detail pages.
- **Phase 9 (QA/Jira):** Test execution UI on Story Detail already in the QA tab — Phase 9 builds into the existing tab structure. Defect detail page uses DetailPageLayout.
- **All phases:** Centralized status colors eliminate future duplication. Any new entity status gets added to `status-colors.ts` once.

---

## 6. Acceptance Criteria

### Shared Components
- [ ] `StatusBadge` renders correct colors for all 5 entity types (epic, feature, story, question, defect) and all their status values
- [ ] No inline status color constants remain in any work component — all use `status-colors.ts`
- [ ] `PageHeader` renders breadcrumb + title + actions on all 4 work pages
- [ ] `DetailPageLayout` renders two-column on desktop (>=1024px), single column on mobile
- [ ] `MetadataSidebar` is sticky on scroll with correct top offset
- [ ] `EditableField` supports text, textarea, and select types with save/cancel/escape behavior
- [ ] `ProgressBar` shows proportional colored segments with tooltips
- [ ] `FilterBar` persists all filter/search/sort state to URL via nuqs
- [ ] `EmptyState` supports icon, primary action, and secondary action

### Work Overview
- [ ] Four view tabs visible: Epics (Table), Epics (Kanban), All Stories (Table), All Stories (Kanban)
- [ ] View selection persists to URL and survives page refresh
- [ ] "All Stories" table shows stories from all epics with epic/feature columns
- [ ] "All Stories" kanban shows all stories grouped by status
- [ ] FilterBar on each view with appropriate filter options
- [ ] Epic table has progress column showing mini progress bar

### Epic Detail
- [ ] Two-column layout with main content (left) and metadata sidebar (right)
- [ ] Title and description are inline editable (click-to-edit)
- [ ] Status is changeable via dropdown in sidebar
- [ ] Progress bar shows story completion by status category
- [ ] Stats show: feature count, story count, total points, completion %
- [ ] Features list has search and sort capabilities

### Feature Detail
- [ ] Same two-column pattern as Epic Detail
- [ ] Parent epic shown as clickable link in sidebar
- [ ] Story list has search, sort, and bulk actions

### Story Detail
- [ ] Two-column layout with all content sections on left, all metadata on right
- [ ] All text fields (title, description, acceptance criteria, persona, dependencies, notes) are inline editable
- [ ] Status shows available transitions as dropdown options (role-aware)
- [ ] Priority, assignee, QA assignee, sprint, story points are inline editable in sidebar
- [ ] Feature and epic shown as clickable links in sidebar
- [ ] QA tab functions identically to current implementation

### Kanban Enhancements
- [ ] Epic kanban cards show mini progress bar and point total
- [ ] Story kanban cards show assignee avatar, points badge, sprint name
- [ ] Story kanban supports swimlane grouping by epic, assignee, or priority
- [ ] Column headers show item count
- [ ] Drag-drop continues to work correctly with swimlanes active

### Table Enhancements
- [ ] All tables support column header click-to-sort (ascending/descending)
- [ ] All tables show pagination controls with page size selector
- [ ] Sort and pagination state persists to URL
- [ ] Filtered empty state shows "No results" with "Clear filters" action

### Story Detail — Tasks tier (per `DECISION-06`)
- [ ] Tasks section renders below Acceptance Criteria in the Details tab
- [ ] Each task row shows status checkbox, title (click-to-edit), assignee (click-to-edit dropdown), delete action
- [ ] "Add task" row creates a new Task via `createStoryTask`
- [ ] Empty state renders the canonical "No tasks yet" copy from §2.1.7

### Story Detail — Permission gating (PRD-19-04, PRD-19-05, PRD-19-08)
- [ ] Sprint field is display-only for users without "Assign stories to sprints" even if they hold content-edit
- [ ] Status dropdown lists only transitions returned by `getAvailableTransitions(currentStatus, role)`
- [ ] On a server-rejected save, UI shows a toast and refetches story + current member to re-gate

### Story Detail — Auto-transition (PRD-19-06)
- [ ] Saving a sprint on a Draft or Ready story updates Status to Sprint Planned in the same server round-trip
- [ ] Saving a sprint on a story in an execution-phase status does not change Status

### Accessibility (WCAG 2.1 AA)
- [ ] All Work-tab pages pass axe-core with zero serious/critical violations
- [ ] Kanban cards are keyboard-draggable with aria-live announcements for pickup/move/drop
- [ ] EditableField supports full keyboard cycle (Tab → Enter/Space → Escape cancel, Enter save)
- [ ] FilterBar Popovers honor Radix keyboard defaults; active-filter pills are Backspace-dismissible on focus
- [ ] StatusBadge always includes a text label (status is not color-only)

### General
- [ ] No visual regressions on pages outside the Work tab
- [ ] All existing server actions continue to work (no API changes)
- [ ] Responsive layout works on screens >= 768px width
- [ ] Loading states (skeletons) shown during data fetches and inline saves
- [ ] All Work-tab pages pass the axe-core CI check with zero serious/critical violations (WCAG 2.1 AA)

---

## 7. Open Questions

Tracked items from the Phase 10 audit (`docs/bef/audits/2026-04-13/phase-10-audit.md`). Items closed by Wave 3 audit-fix are noted in the Revision History; items still requiring cross-phase coordination at execute time:

- **Phase-4 Tasks-tier server actions (§2.5, Integration Points):** Phase 4 must publish `listStoryTasks`, `createStoryTask`, `updateStoryTask`, `deleteStoryTask` with the signatures pinned in §5. Owner: Phase 4 deep-dive / Mike R. Resolution target: before Phase 10 execute.
- **Phase-4 `missingMandatoryFields` payload (§2.5.3, §2.6, §2.8):** Phase 4 must include `missingMandatoryFields: string[]` on story reads. Owner: Phase 4. Resolution target: before Task 12 completion (the indicator is a no-op until then).
- **Phase-1 `getFieldPermission` helper (§2.5.1):** If Phase 1 does not publish this helper, Phase 10 derives `canEdit` from `getCurrentMember().permissions`. Owner: Mike R. Resolution target: before Task 11 execute.
- **Phase-1 pinned exports (§5):** Verify every Phase-1 module path in §5 resolves when Phase 10 starts. Owner: Phase 10 execute kickoff.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 10` with self-answered interview |
| 2026-04-14 | Wave 3 audit-fix: applied 11 gap fixes from `phase-10-audit.md`. Added PRD trace lines across §1, §2.1–2.8. Added §2.9 Accessibility (WCAG 2.1 AA). Owned Tasks-tier UI in Story Detail per `DECISION-06`. Added permission gating per field (PRD-19-04, -05, -08), sprint auto-transition to Sprint Planned (PRD-19-06), Draft completeness indicator (PRD-10-03..10), Developer default "My Work" view (PRD-12-01), canonical empty-state table, pinned Phase-1 server-action signatures, invalid-URL-param fallback rules, and expanded §4 edge cases. §7 Open Questions rewritten with real cross-phase items. | Wave 3 audit remediation against `docs/bef/audits/2026-04-13/phase-10-audit.md`. Cites `DECISION-06`. |
