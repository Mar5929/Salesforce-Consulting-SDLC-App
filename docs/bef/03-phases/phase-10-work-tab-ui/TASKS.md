# Phase 10 Tasks: Work Tab UI Overhaul

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 12
> Status: 0/12 complete
> Last Updated: 2026-04-14 (Wave 3 audit-fix; see PHASE_SPEC Revision History)

Every task carries a **Traces to** row citing the PRD requirement IDs it satisfies. Where a task is driven by a locked audit decision, the decision ID is cited inline (for example, `DECISION-06` on Task 11 Tasks-tier rendering).

---

## Execution Order

```
Layer 1 (Shared Components — all parallel):
  Task 1 (StatusBadge + colors)
  Task 2 (PageHeader + EmptyState)
  Task 3 (DetailPageLayout + MetadataSidebar)
  Task 4 (EditableField)
  Task 5 (ProgressBar + StatCard)

Layer 2 (Infrastructure):
  Task 6 (FilterBar + ViewTabs) — after Task 1
  Task 7 (Table enhancements) — after Task 6

Layer 3 (Page Overhauls):
  Task 8 (Work Overview) — after Tasks 1, 2, 5, 6, 7
  Task 9 (Epic Detail) — after Tasks 1-5
  Task 10 (Feature Detail) — after Task 9
  Task 11 (Story Detail) — after Tasks 1-5

Layer 4 (Kanban):
  Task 12 (Kanban cards + swimlanes) — after Tasks 1, 5
```

---

## Tasks

### Task 1: Centralized Status Colors + StatusBadge Component

| Attribute | Details |
|-----------|---------|
| **Scope** | Extract all inline status/priority color maps into `src/lib/status-colors.ts`. Create `StatusBadge` component in `src/components/shared/status-badge.tsx` that renders the correct badge for any entity type + status. Create `PriorityBadge` variant. Migrate all existing work components to use them. |
| **Depends On** | None |
| **Traces to** | PRD-10-01, PRD-10-14 (status rendering) |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `status-colors.ts` exports color maps for: EpicStatus (3), FeatureStatus (3), StoryStatus (7), Priority (4), QuestionStatus (6), DefectSeverity (4)
- [ ] `StatusBadge` accepts `entityType` + `status` and renders correct colors
- [ ] `PriorityBadge` accepts priority value and renders correct colors
- [ ] All 6 work components migrated: epic-table, epic-kanban, feature-table, feature-kanban, story-table, story-kanban
- [ ] All 2 detail clients migrated: epic-detail-client, feature-detail-client
- [ ] No inline color constants remain in any work component
- [ ] Visual output is pixel-identical to current (same hex values, same badge variant)
- [ ] StatusBadge always includes a text label alongside the color (status is never signaled by color alone, per §2.9)

**Implementation Notes:**
Current color locations to extract:
- `epic-detail-client.tsx` lines ~45-49: `statusColors` object for EpicStatus
- `feature-detail-client.tsx` lines ~44-48: same pattern for FeatureStatus
- `story-table.tsx`: `STATUS_COLORS` and `PRIORITY_COLORS` objects
- `story-kanban.tsx`: `statusColors` object (7 story statuses), `priorityColors` (4 levels)
- `epic-table.tsx`: inline badge className conditions
- `epic-kanban.tsx`: inline badge className conditions

Color scheme pattern (preserve exactly):
```
Gray:   bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]
Blue:   bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]
Green:  bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]
Orange: bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]
Purple: bg-[#F5F3FF] text-[#8B5CF6] border-[#DDD6FE]
Pink:   bg-[#FDF2F8] text-[#EC4899] border-[#FBCFE8]
Red:    bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]
```

---

### Task 2: PageHeader + Enhanced EmptyState

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `PageHeader` component (`src/components/shared/page-header.tsx`) with breadcrumb, title, subtitle, badge, and actions slot. Enhance existing `EmptyState` (`src/components/shared/empty-state.tsx`) with icon prop, secondary action, and illustration slot. Consume the canonical empty-state content table from PHASE_SPEC §2.1.7. |
| **Depends On** | None |
| **Traces to** | PRD-10-01 (hierarchy surfaces), app-wide empty-state coverage (PHASE_SPEC §2.1.7) |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `PageHeader` renders breadcrumb trail with chevron separators (reuses WorkBreadcrumb pattern)
- [ ] `PageHeader` renders title (text-2xl font-semibold) with optional badge (e.g., count)
- [ ] `PageHeader` renders actions slot on the right side (flex justify-between)
- [ ] `PageHeader` renders optional subtitle below title (text-sm text-muted-foreground)
- [ ] `EmptyState` supports `icon` prop (LucideIcon, rendered at 48px, muted color)
- [ ] `EmptyState` supports `secondaryAction` prop (renders outline button alongside primary)
- [ ] Both components exported from their files and usable standalone
- [ ] `EmptyState` consumes the canonical empty-state content from PHASE_SPEC §2.1.7 and renders each case (Epics, All Stories, Feature list, Story list, Tasks list, Filter→0, Kanban column 0, Swimlane 0) correctly

**Implementation Notes:**
PageHeader structure:
```tsx
<div className="flex flex-col gap-1">
  <Breadcrumb segments={breadcrumbs} />
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {badge}
    </div>
    <div className="flex items-center gap-2">{actions}</div>
  </div>
  {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
</div>
```

EmptyState enhancement: Add optional `icon` rendered above heading, `secondaryAction` as outline button next to primary CTA. Keep backward compatibility — existing callers don't break.

---

### Task 3: DetailPageLayout + MetadataSidebar

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `DetailPageLayout` (`src/components/shared/detail-page-layout.tsx`), a two-column responsive layout. Create `MetadataSidebar` (`src/components/shared/metadata-sidebar.tsx`), a structured sidebar with labeled field rows. |
| **Depends On** | None |
| **Traces to** | PRD-10-01, PRD-10-02 (hierarchy detail pages), accessibility baseline (PHASE_SPEC §2.9) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `DetailPageLayout` renders two columns on screens >= 1024px (main ~65%, sidebar ~35%)
- [ ] `DetailPageLayout` stacks to single column on screens < 1024px (sidebar below main)
- [ ] `MetadataSidebar` renders labeled field rows with consistent spacing (label: text-xs text-muted-foreground uppercase tracking-wide, value below)
- [ ] `MetadataSidebar` supports field groups with optional dividers
- [ ] Sidebar is sticky on scroll (sticky top-20, accounting for header height)
- [ ] Sidebar has a Card wrapper with consistent padding
- [ ] Layout gap between columns is 24px (gap-6)
- [ ] `MetadataSidebar` renders semantic `dl`/`dt`/`dd` markup (per PHASE_SPEC §2.9)
- [ ] Layout pages pass an axe-core scan with zero serious/critical violations (WCAG 2.1 AA)

**Implementation Notes:**
DetailPageLayout structure:
```tsx
<div className="flex flex-col lg:flex-row gap-6">
  <div className="flex-1 min-w-0">{children}</div>  {/* main content */}
  <div className="w-full lg:w-[340px] lg:flex-shrink-0">
    <div className="lg:sticky lg:top-20">{sidebar}</div>
  </div>
</div>
```

MetadataSidebar structure:
```tsx
<Card>
  <CardContent className="p-4 space-y-4">
    {fields.map(field => (
      <div key={field.label}>
        <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{field.label}</dt>
        <dd className="mt-1 text-sm">{field.render ? field.render() : field.value}</dd>
      </div>
    ))}
  </CardContent>
</Card>
```

MetadataSidebar field type:
```typescript
interface MetadataField {
  label: string
  value?: string | number | null
  render?: () => ReactNode  // custom renderer (for StatusBadge, avatars, links, etc.)
}
```

---

### Task 4: EditableField Component

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `EditableField` (`src/components/shared/editable-field.tsx`), a click-to-edit pattern that toggles between display and edit modes. Supports text input, textarea, and select types. Handles save/cancel with keyboard shortcuts and loading states. Accepts a `canEdit` prop driven by the per-field permission keys defined in PHASE_SPEC §2.5.1. |
| **Depends On** | None |
| **Traces to** | PRD-10-03..10 (inline editing of mandatory story fields), PRD-19-04, PRD-19-05, PRD-19-08 (permission gating), accessibility (§2.9) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Display mode: shows value with subtle hover indicator (border-transparent → border-muted on hover, cursor pointer)
- [ ] Click enters edit mode with appropriate input type
- [ ] `type="text"`: single-line input, Enter saves, Escape cancels
- [ ] `type="textarea"`: resizable textarea, Ctrl+Enter saves, Escape cancels
- [ ] `type="select"`: dropdown with options, selecting an option auto-saves
- [ ] Save shows loading spinner on the field, disables input
- [ ] Save error: reverts to previous value, shows toast error
- [ ] `readOnly` prop prevents edit mode entirely (no hover indicator)
- [ ] `placeholder` shown when value is empty (italic, muted)
- [ ] Focus automatically placed in input on entering edit mode
- [ ] `canEdit` prop: when false, the field renders display-only with no hover affordance, cursor, or click handler
- [ ] Keyboard accessibility (per §2.9): Tab focuses the display; Enter or Space enters edit mode; Enter saves for `text`; Ctrl+Enter saves for `textarea`; Escape cancels edit and returns focus to the trigger; aria-label derived from field label; loading state announced via `aria-live="polite"`

**Implementation Notes:**
Props interface:
```typescript
interface EditableFieldProps {
  value: string | number | null
  onSave: (newValue: string) => Promise<void>
  type?: "text" | "textarea" | "select"
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  readOnly?: boolean
  className?: string
  displayClassName?: string  // for title styling (text-2xl font-semibold, etc.)
}
```

For the `select` type, render a Popover with a list of options (not a native select). This gives us full control over styling and allows StatusBadge rendering in the dropdown. When an option is selected, call `onSave` immediately (no explicit save button needed).

For `text` and `textarea`, show small Save/Cancel icon buttons (CheckIcon/XIcon) below the input, plus keyboard shortcut support.

---

### Task 5: ProgressBar + StatCard Components

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `ProgressBar` (`src/components/shared/progress-bar.tsx`), segmented horizontal bar showing status distribution. Create `StatCard` (`src/components/shared/stat-card.tsx`), compact metric card for dashboards and sidebars. |
| **Depends On** | None |
| **Traces to** | PRD-10-01, PRD-10-14 (status-by-category visualization) |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `ProgressBar` renders proportional colored segments based on counts
- [ ] Zero-count segments are hidden (no sliver rendering)
- [ ] Hover on a segment shows tooltip with label and count
- [ ] Empty state (all counts 0) shows gray bar with "No items" text
- [ ] `showLabels` prop renders count labels below each segment
- [ ] `StatCard` renders icon (optional), metric value (large), and label (small, muted)
- [ ] `StatCard` supports `trend` prop showing up/down/neutral arrow with color
- [ ] Both components work at any width (flex-based, not fixed)

**Implementation Notes:**
ProgressBar usage for epics:
```tsx
<ProgressBar segments={[
  { count: doneStories, color: "#16A34A", label: "Done" },
  { count: inProgressStories, color: "#2563EB", label: "In Progress" },
  { count: notStartedStories, color: "#E5E5E5", label: "Not Started" },
]} />
```

StatCard for sidebar:
```tsx
<div className="grid grid-cols-2 gap-3">
  <StatCard label="Features" value={featureCount} icon={Layers} />
  <StatCard label="Stories" value={storyCount} icon={FileText} />
  <StatCard label="Points" value={totalPoints} icon={Zap} />
  <StatCard label="Complete" value={`${completionPct}%`} icon={CheckCircle} />
</div>
```

---

### Task 6: FilterBar + ViewTabs Components

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `FilterBar` (`src/components/shared/filter-bar.tsx`), horizontal bar with search input, filter dropdowns, sort selector, and active filter pills. Create `ViewTabs` (`src/components/shared/view-tabs.tsx`), multi-view tab selector replacing the simple two-button ViewToggle for pages with more than 2 views. All state persisted to URL via nuqs. |
| **Depends On** | Task 1 (StatusBadge, for filter dropdown option rendering) |
| **Traces to** | PRD-10-01, PRD-12-01 (developer filter path), accessibility (§2.9) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `FilterBar` renders search input (left), filter dropdowns (center), sort selector (right)
- [ ] Search is debounced at 300ms, persisted to `?q=` URL param
- [ ] Each filter dropdown shows options with checkboxes for multi-select
- [ ] Active filters shown as dismissible pills/chips below the bar
- [ ] "Clear all" button appears when any filter is active
- [ ] Sort selector shows current sort field + direction, click toggles or changes field
- [ ] All filter/sort/search state persisted to URL via nuqs
- [ ] `ViewTabs` renders horizontal tab bar with icon + label per tab
- [ ] Active tab shows underline/highlight style
- [ ] Tab selection persisted to `?view=` URL param via nuqs
- [ ] `ViewTabs` accepts `tabs: Array<{ id: string, label: string, icon: LucideIcon }>`
- [ ] Keyboard accessibility (per §2.9): Tab through search → filters → sort in DOM order; Popover filters open on Enter, arrows navigate options, Space toggles, Escape closes; active-filter pills are focusable and Backspace-dismissible on focus
- [ ] Invalid `sort` / `groupBy` URL params fall back to defaults silently (per §3.3)
- [ ] `ViewTabs` built on Radix Tabs primitives (role="tablist", tab/panel aria wiring)

**Implementation Notes:**
FilterBar config type:
```typescript
interface FilterConfig {
  key: string              // URL param name
  label: string            // Display label
  options: Array<{
    value: string
    label: string
    icon?: ReactNode       // e.g., StatusBadge for status filters
  }>
  multiSelect?: boolean    // default true
}

interface SortOption {
  value: string            // "name:asc", "createdAt:desc", etc.
  label: string
}

interface FilterBarProps {
  searchPlaceholder?: string
  filters: FilterConfig[]
  sortOptions?: SortOption[]
  onFilterChange: (filters: Record<string, string[]>) => void
  onSearchChange: (query: string) => void
  onSortChange?: (sort: string) => void
}
```

Use nuqs `useQueryStates` for batch URL state management. Filter dropdowns use Popover + Checkbox pattern (not native select). ViewTabs styling: border-b with active tab having border-primary and text-primary.

---

### Task 7: Table Sorting, Pagination, and Integration

| Attribute | Details |
|-----------|---------|
| **Scope** | Add sortable column headers, pagination controls, and FilterBar integration to all work tables (epic-table, feature-table, story-table). Create shared `TablePagination` component. Wire FilterBar search/filter state into table data filtering. Add an optional Completeness column on story table (hidden by default) rendering the Draft completeness dot from PHASE_SPEC §2.5.3. |
| **Depends On** | Task 6 (FilterBar) |
| **Traces to** | PRD-10-01, PRD-10-03..10 (Completeness column), PRD-12-01 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Column headers are clickable to toggle sort (unsorted → ascending → descending → unsorted)
- [ ] Sort indicator (arrow up/down) shown in active sort column header
- [ ] `TablePagination` shows page navigation (Prev/Next, page numbers), page size selector (25/50/100), and "Showing X-Y of Z" count
- [ ] Pagination resets to page 1 when filters or sort change
- [ ] All three work tables (epic, feature, story) support sorting by relevant columns
- [ ] Story table integrates FilterBar for status/priority/assignee/sprint filtering
- [ ] Epic table integrates FilterBar for status filtering and name search
- [ ] Client-side filtering and pagination (no API changes for V1)
- [ ] Sort and page state persisted to URL via nuqs
- [ ] Story table supports an optional Completeness column (hidden by default, user-toggleable) that shows an amber dot when `story.status === Draft && missingMandatoryFields.length > 0`
- [ ] Invalid `page` / `pageSize` params resolve per §3.3 (clamp / fallback, no toast)

**Implementation Notes:**
Create `TablePagination` in `src/components/shared/table-pagination.tsx`. Use `@tanstack/react-table` sorting and pagination features (already a dependency via story-table).

For epic-table and feature-table, add `@tanstack/react-table` integration (currently they use raw HTML tables). This gives us sorting, pagination, and filtering for free. Story table already uses react-table — extend its column definitions with sorting enabled.

Pagination layout:
```
[Showing 1-25 of 142]                [25 ▾]  [< Prev] [1] [2] [3] ... [6] [Next >]
```

---

### Task 8: Work Overview Page Redesign

| Attribute | Details |
|-----------|---------|
| **Scope** | Rewrite `work-page-client.tsx` and modify `work/page.tsx` to support four views: Epics Table, Epics Kanban, All Stories Table, All Stories Kanban. Add ViewTabs, FilterBar, and integrate enhanced tables/kanbans. Server component fetches both epics (with stats) and all stories. Implement the Developer default "My Work" landing view per PHASE_SPEC §2.2. |
| **Depends On** | Tasks 1, 2, 5, 6, 7 |
| **Traces to** | PRD-10-01, PRD-10-02, PRD-12-01 (Developer default view) |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] ViewTabs shows 4 tabs: Epics (Table), Epics (Kanban), All Stories (Table), All Stories (Kanban)
- [ ] Default view is "Epics (Table)", persisted to `?view=` URL param
- [ ] PageHeader shows "Work" title with total epic count badge
- [ ] "New Epic" button in PageHeader actions
- [ ] Epics Table view: enhanced epic-table with progress column (mini ProgressBar), sorting, pagination, FilterBar
- [ ] Epics Kanban view: enhanced epic-kanban with richer cards
- [ ] All Stories Table view: story-table showing ALL stories across all epics, with epic and feature columns visible, full FilterBar, bulk actions, sorting, pagination
- [ ] All Stories Kanban view: story-kanban showing all stories, with swimlane grouping options
- [ ] Server component (`page.tsx`) fetches both epics (with story status counts) and all project stories in parallel
- [ ] Loading skeleton shown while data loads
- [ ] Developer role landing (PRD-12-01): when `getCurrentMember().role === "DEVELOPER"` and no `?view=` is present, the page lands on `stories-table` with `assignee=<currentMemberId>` and `status=SPRINT_PLANNED,IN_PROGRESS,IN_REVIEW` pre-applied; a "My Work" filter pill is visible and dismissible
- [ ] Non-Developer roles land on the default `epics-table` view unchanged
- [ ] Each of the 4 views renders the correct canonical empty state from PHASE_SPEC §2.1.7
- [ ] Invalid `?view=` value falls back to the default view silently (per §3.3)

**Implementation Notes:**
Modify `work/page.tsx` to fetch additional data:
```typescript
// Existing: epics with feature/story counts
// New: all stories (for "All Stories" views)
// New: epic story status counts (for progress bars)
// New: project members (for assignee filter)
// New: sprints (for sprint filter)
const [epics, stories, members, sprints] = await Promise.all([
  prisma.epic.findMany({ where: { projectId }, include: { ... } }),
  prisma.story.findMany({ where: { projectId }, include: { assignee, feature, sprint, ... } }),
  prisma.projectMember.findMany({ where: { projectId, status: "ACTIVE" } }),
  prisma.sprint.findMany({ where: { projectId } }),
])
```

For epic progress bars, compute story status distribution per epic:
```typescript
const epicStats = await prisma.story.groupBy({
  by: ['epicId', 'status'],
  where: { projectId },
  _count: true,
})
```

ViewTabs config:
```typescript
const views = [
  { id: "epics-table", label: "Epics", icon: TableIcon },
  { id: "epics-kanban", label: "Epics Board", icon: KanbanIcon },
  { id: "stories-table", label: "All Stories", icon: ListIcon },
  { id: "stories-kanban", label: "Stories Board", icon: LayoutGridIcon },
]
```

---

### Task 9: Epic Detail Page Redesign

| Attribute | Details |
|-----------|---------|
| **Scope** | Rewrite `epic-detail-client.tsx` and modify `work/[epicId]/page.tsx` to use two-column DetailPageLayout with MetadataSidebar. Replace inline edit mode with per-field EditableField components. Add ProgressBar and StatCards for story metrics. Enhanced feature list with FilterBar. |
| **Depends On** | Tasks 1, 2, 3, 4, 5 |
| **Traces to** | PRD-10-01, PRD-10-02, PRD-10-14 |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] PageHeader with breadcrumb (Work > Epic Name), "New Feature" and "Generate Stories" buttons
- [ ] DetailPageLayout: main content left, metadata sidebar right
- [ ] Title (text-2xl) inline editable via EditableField
- [ ] Description inline editable via EditableField textarea
- [ ] Feature list section with heading, FilterBar (search, sort by name/status/stories), ViewToggle (table/kanban)
- [ ] MetadataSidebar fields: Status (editable select), Prefix (read-only), Created, Updated, Progress bar, Stats grid (features, stories, points, completion %)
- [ ] ProgressBar shows story distribution: Done (green), In Progress (blue), Not Started (gray)
- [ ] StatCards in 2x2 grid below progress bar
- [ ] Server page.tsx fetches story status counts for progress computation
- [ ] Inline saves call existing `updateEpic` server action
- [ ] No "Edit" button or edit mode toggle — all fields are individually editable

**Implementation Notes:**
Remove the current `isEditing` state pattern (lines ~30-80 of epic-detail-client.tsx). Replace with EditableField for each field.

Server page.tsx additions:
```typescript
// Add story status counts for this epic
const storyStats = await prisma.story.groupBy({
  by: ['status'],
  where: { epicId },
  _count: true,
})
const totalPoints = await prisma.story.aggregate({
  where: { epicId },
  _sum: { storyPoints: true },
})
```

MetadataSidebar configuration:
```tsx
<MetadataSidebar fields={[
  { label: "Status", render: () => <EditableField type="select" value={epic.status} options={epicStatuses} onSave={...} /> },
  { label: "Prefix", value: epic.prefix },
  { label: "Created", value: formatDate(epic.createdAt) },
  { label: "Updated", value: formatDate(epic.updatedAt) },
]} />
```

---

### Task 10: Feature Detail Page Redesign

| Attribute | Details |
|-----------|---------|
| **Scope** | Rewrite `feature-detail-client.tsx` and modify `work/[epicId]/[featureId]/page.tsx` to mirror the Epic Detail pattern: two-column layout, per-field inline editing, progress bar, stats. Story list with FilterBar. |
| **Depends On** | Task 9 (same pattern, ensures consistency) |
| **Traces to** | PRD-10-01, PRD-10-02, PRD-10-14 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] PageHeader with breadcrumb (Work > Epic > Feature Name), "New Story" button
- [ ] DetailPageLayout: main content left, metadata sidebar right
- [ ] Title and description inline editable
- [ ] Story list with FilterBar (search, filter by status/priority/assignee, sort), ViewToggle, bulk actions
- [ ] MetadataSidebar: Status (editable), Prefix (read-only), Parent Epic (clickable link), Created, Updated, ProgressBar, Stats (stories, points, completion %)
- [ ] StoryForm slide-over retained for creating new stories and full story editing
- [ ] Consistent visual pattern with Epic Detail (same component library)

**Implementation Notes:**
Follow exact same pattern as Task 9. The main difference is:
- Parent entity link (epic) in sidebar
- Child entity is stories (not features)
- StoryForm slide-over is retained (stories have too many fields for purely inline editing at list level)

Server page.tsx additions (same pattern as epic):
```typescript
const storyStats = await prisma.story.groupBy({
  by: ['status'],
  where: { featureId },
  _count: true,
})
```

---

### Task 11: Story Detail Page Redesign

| Attribute | Details |
|-----------|---------|
| **Scope** | Rewrite `story-detail-client.tsx` and modify the story detail `page.tsx` to use two-column DetailPageLayout. All text fields inline editable. All metadata fields in sidebar with inline editing. Status transitions via dropdown in sidebar. Remove StoryForm dependency for editing. Add the Tasks-tier section in the Details tab (per `DECISION-06`). Implement per-field permission gating (PRD-19-04, -05, -08) and the Sprint auto-transition to Sprint Planned (PRD-19-06). |
| **Depends On** | Tasks 1, 2, 3, 4 |
| **Traces to** | PRD-10-02 (Tasks tier, `DECISION-06`), PRD-10-03..10, PRD-10-14, PRD-19-04, PRD-19-05, PRD-19-06, PRD-19-08 |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] PageHeader with breadcrumb (Work > Epic > Feature > Story DisplayId), "Enrich with AI" button in actions
- [ ] DetailPageLayout: main content left, metadata sidebar right
- [ ] Title (text-xl font-semibold) inline editable
- [ ] Tabs (Details | QA) in main content area
- [ ] Details tab: Description, Acceptance Criteria, Persona, Dependencies, Notes — all inline editable via EditableField textarea
- [ ] Impacted Components section with existing ComponentSelector (editable)
- [ ] QA tab: TestExecutionTable + DefectCreateSheet (unchanged from current)
- [ ] MetadataSidebar fields (all inline editable where applicable):
  - Status: dropdown showing available transitions (role-aware via story-status-machine)
  - Priority: dropdown (LOW, MEDIUM, HIGH, CRITICAL)
  - Assignee: dropdown populated from project members (avatar + name)
  - QA Assignee: dropdown from project members
  - Sprint: dropdown from project sprints (+ "Unassigned" option)
  - Story Points: number input
  - Feature: clickable link to feature detail
  - Epic: clickable link to epic detail
  - Defects: count badge (red if > 0), clickable to filtered defects page
  - Test Cases: count badge
  - Created, Updated: formatted dates
- [ ] Server page.tsx fetches project members and sprints for dropdown population
- [ ] StoryForm sheet removed from this page (all editing is inline)
- [ ] "Edit" button removed from header (replaced by inline editing)
- [ ] Role-based edit permissions: fields are read-only for users without edit access
- [ ] Tasks-tier section (per `DECISION-06`): renders below Acceptance Criteria in the Details tab; each row shows status checkbox (toggles OPEN/DONE), click-to-edit title, inline assignee dropdown from project members, and a delete action; "Add task" row creates a new task via `createStoryTask`; empty state uses the canonical "No tasks yet" copy from §2.1.7
- [ ] `EditableField` wrapper uses a `canEdit: boolean` prop resolved from the current member's role and the per-field permission key table in PHASE_SPEC §2.5.1
- [ ] Sprint field is display-only for users without "Assign stories to sprints" even if they can edit other content
- [ ] Status dropdown shows only transitions returned by `getAvailableTransitions(currentStatus, role)` (PRD-19-04, PRD-19-05)
- [ ] Saving a non-null sprint on a Draft or Ready story auto-transitions status to Sprint Planned in the same server round-trip; sidebar Status re-renders from the same response (PRD-19-06)
- [ ] Saving a sprint on a story already in an execution-phase status (In Progress, In Review, QA, Done) does not change status
- [ ] On a 4xx response from `updateStory`, `updateStoryStatus`, or `assignStoryToSprint`, UI shows a toast with the server error message and refetches story + current member to re-gate the sidebar
- [ ] Server-action signatures consumed verbatim from PHASE_SPEC §5 (`updateStory`, `updateStoryStatus`, `assignStoryToSprint`, and Phase-4 task actions)
- [ ] Story kanban card and (optional) story table Completeness column render an amber warning dot when `story.status === Draft && missingMandatoryFields.length > 0`

**Implementation Notes:**
The story detail page is the most complex redesign. Key changes:

1. **Remove `editFormOpen` state and StoryForm** — all editing happens inline
2. **Status transitions**: Use EditableField `type="select"` but with a custom renderer that only shows valid transitions from `getAvailableTransitions(currentStatus, userRole)`. This reuses the existing story-status-machine logic.
3. **Assignee/QA Assignee dropdowns**: Need project members fetched in server component. Use EditableField `type="select"` with avatar rendering in options.
4. **Sprint dropdown**: Needs sprints fetched in server component.

Server page.tsx additions:
```typescript
const [story, members, sprints, epics, features] = await Promise.all([
  prisma.story.findUnique({ ... }),  // existing
  prisma.projectMember.findMany({ where: { projectId, status: "ACTIVE" }, select: { id: true, userId: true, displayName: true, email: true } }),
  prisma.sprint.findMany({ where: { projectId }, select: { id: true, name: true } }),
  prisma.epic.findMany({ ... }),     // existing
  prisma.feature.findMany({ ... }),  // existing
])
```

Each inline save calls the appropriate existing server action:
- Title/description/persona/etc. → `updateStory(projectId, storyId, { field: value })`
- Status → `updateStoryStatus(projectId, storyId, newStatus)`
- Assignee → `updateStory(projectId, storyId, { assigneeId })`
- Sprint → existing sprint assignment action
- Components → `addStoryComponent` / `removeStoryComponent`

---

### Task 12: Kanban Card Redesign + Swimlanes

| Attribute | Details |
|-----------|---------|
| **Scope** | Enhance kanban cards across all entity types with richer information. Add swimlane grouping to story kanban (group by epic, assignee, priority). Add column count badges and collapsible columns. Render the Draft completeness indicator from PHASE_SPEC §2.5.3 on story cards. |
| **Depends On** | Tasks 1, 5 |
| **Traces to** | PRD-10-01, PRD-10-02, PRD-10-03..10 (Draft completeness indicator), PRD-12-01, accessibility (§2.9) |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Epic kanban cards: title, mini ProgressBar, footer with prefix + feature count + story count + total points
- [ ] Feature kanban cards: title, mini ProgressBar, footer with prefix + story count + points
- [ ] Story kanban cards: title, priority dot, epic name pill (in "All Stories" view), footer with displayId + points badge + assignee avatar + sprint name
- [ ] Story kanban supports swimlane grouping via `?groupBy=` URL param
- [ ] Swimlane options: None (default), Epic, Assignee, Priority
- [ ] Each swimlane row: collapsible, shows group name + count + collapse toggle
- [ ] Empty swimlanes hidden by default
- [ ] Column headers show item count badge (already exists, verify consistent)
- [ ] Columns are collapsible (click header to minimize to header-only)
- [ ] All drag-drop functionality continues to work within swimlanes
- [ ] Group-by selector rendered above the kanban board (or integrated into FilterBar)
- [ ] Story kanban card renders an amber warning dot when `story.status === Draft && missingMandatoryFields.length > 0` (tooltip: "{N} mandatory fields missing")
- [ ] Keyboard drag-drop (per §2.9): cards are focusable in DOM order via Tab; Space picks up; arrow keys move between columns and rows; Space drops; Escape cancels; pickup/move/drop announced via `aria-live="assertive"` with card title + source + destination column; focus returns to the moved card after drop
- [ ] Swimlane triggers set `aria-expanded`; swimlane sections use `role="region"` with `aria-labelledby`

**Implementation Notes:**
Swimlane implementation approach:
```tsx
// Group stories by the selected dimension
const groups = groupBy(stories, groupByField)

// Render each group as a swimlane
{Object.entries(groups).map(([groupName, groupStories]) => (
  <Collapsible key={groupName}>
    <CollapsibleTrigger>
      <span>{groupName}</span>
      <Badge>{groupStories.length}</Badge>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <KanbanColumns stories={groupStories} />
    </CollapsibleContent>
  </Collapsible>
))}
```

For the "group by epic" swimlane, each row shows the epic name. For "group by assignee", shows avatar + name. For "group by priority", shows priority badge.

Epic/Feature card enhancement: Pass `storyStats` (status distribution) as a prop to the kanban components so cards can render mini ProgressBars. This data is already fetched in the Work Overview page (Task 8) and Epic Detail page (Task 9).

---

## Summary

| Task | Title | Depends On | Complexity | Status |
|------|-------|-----------|------------|--------|
| 1 | Centralized Status Colors + StatusBadge | — | S | Not Started |
| 2 | PageHeader + Enhanced EmptyState | — | S | Not Started |
| 3 | DetailPageLayout + MetadataSidebar | — | M | Not Started |
| 4 | EditableField Component | — | M | Not Started |
| 5 | ProgressBar + StatCard | — | S | Not Started |
| 6 | FilterBar + ViewTabs | 1 | M | Not Started |
| 7 | Table Sorting, Pagination, Integration | 6 | M | Not Started |
| 8 | Work Overview Page Redesign | 1, 2, 5, 6, 7 | L | Not Started |
| 9 | Epic Detail Page Redesign | 1-5 | L | Not Started |
| 10 | Feature Detail Page Redesign | 9 | M | Not Started |
| 11 | Story Detail Page Redesign | 1-4 | L | Not Started |
| 12 | Kanban Card Redesign + Swimlanes | 1, 5 | L | Not Started |
