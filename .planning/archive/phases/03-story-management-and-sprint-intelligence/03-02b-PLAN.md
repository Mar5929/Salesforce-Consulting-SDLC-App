---
phase: 03-story-management-and-sprint-intelligence
plan: 02b
type: execute
wave: 2
depends_on: ["03-01"]
files_modified:
  - src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/page.tsx
  - src/app/(dashboard)/projects/[projectId]/backlog/page.tsx
  - src/components/work/story-table.tsx
  - src/components/work/story-kanban.tsx
  - src/components/work/story-form.tsx
  - src/components/work/component-selector.tsx
autonomous: true
requirements:
  - WORK-02
  - WORK-03
  - WORK-04
  - WORK-05
  - WORK-07

must_haves:
  truths:
    - "User can create stories via slide-over panel with mandatory acceptance criteria"
    - "Story table shows displayId, title, status badge, priority, assignee, points, feature, sprint columns per D-03"
    - "Stories can attach free-text Salesforce components with impact type"
    - "Backlog page shows all unassigned stories across epics"
    - "Story status transitions are role-gated (PM lifecycle, dev execution)"
    - "Bulk actions allow multi-select for status change, sprint assignment, assignee change"
    - "Feature detail page renders story table with breadcrumb navigation"
  artifacts:
    - path: "src/components/work/story-table.tsx"
      provides: "Story table with bulk actions and all D-03 columns"
    - path: "src/components/work/story-form.tsx"
      provides: "Slide-over story creation/edit form"
      contains: "acceptanceCriteria"
    - path: "src/components/work/component-selector.tsx"
      provides: "Free-text component name + impact type selector"
    - path: "src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/page.tsx"
      provides: "Feature detail page with stories list"
    - path: "src/app/(dashboard)/projects/[projectId]/backlog/page.tsx"
      provides: "Backlog showing all unassigned stories"
  key_links:
    - from: "src/components/work/story-table.tsx"
      to: "src/actions/stories.ts"
      via: "server action calls for status change and bulk operations"
      pattern: "import.*updateStoryStatus.*from.*actions/stories"
    - from: "src/components/work/story-form.tsx"
      to: "src/actions/stories.ts"
      via: "createStory/updateStory calls"
      pattern: "import.*createStory.*from.*actions/stories"
---

<objective>
Build the story-level UI: story table with bulk actions, story form (slide-over panel), component selector, story kanban, feature detail page, and backlog page.

Purpose: This delivers the story management interface that users interact with daily -- creating stories, attaching components, using bulk actions, and viewing the backlog. Split from Plan 02 to keep context budget manageable.
Output: Story table, story form, component selector, story kanban, feature detail page, backlog page.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/03-story-management-and-sprint-intelligence/03-CONTEXT.md
@.planning/phases/03-story-management-and-sprint-intelligence/03-RESEARCH.md
@.planning/phases/03-story-management-and-sprint-intelligence/03-01-SUMMARY.md

@src/actions/stories.ts
@src/lib/story-status-machine.ts
@src/components/questions/question-table.tsx
@src/components/questions/question-kanban.tsx
@src/components/questions/question-form.tsx
@src/components/work/work-breadcrumb.tsx
@src/components/shared/empty-state.tsx
@src/components/ui/sheet.tsx
@src/components/ui/table.tsx
@src/components/ui/badge.tsx
@src/components/ui/checkbox.tsx
@src/components/ui/select.tsx

<interfaces>
From src/actions/stories.ts (created in Plan 01):
```typescript
export const createStory = actionClient.schema(...).action(...)
export const updateStory = actionClient.schema(...).action(...)
export const updateStoryStatus = actionClient.schema(...).action(...)
export const getStories = actionClient.schema(...).action(...)
export const addStoryComponent = actionClient.schema(...).action(...)
```

From src/lib/story-status-machine.ts (created in Plan 01):
```typescript
export function canTransition(from: StoryStatus, to: StoryStatus, role: ProjectRole): boolean
export function getAvailableTransitions(from: StoryStatus, role: ProjectRole): StoryStatus[]
```

From src/components/work/work-breadcrumb.tsx (created in Plan 02):
```typescript
export function WorkBreadcrumb({ segments }: { segments: BreadcrumbSegment[] })
```

Prisma enums:
- StoryStatus: DRAFT | READY | SPRINT_PLANNED | IN_PROGRESS | IN_REVIEW | QA | DONE
- Priority: LOW | MEDIUM | HIGH | CRITICAL
- ImpactType: CREATE | MODIFY | DELETE
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Story table with bulk actions, story kanban, and component selector</name>
  <files>src/components/work/story-table.tsx, src/components/work/story-kanban.tsx, src/components/work/component-selector.tsx</files>
  <read_first>src/components/questions/question-table.tsx, src/components/questions/question-kanban.tsx, src/components/ui/checkbox.tsx, src/components/ui/select.tsx, src/components/ui/badge.tsx, src/actions/stories.ts, src/lib/story-status-machine.ts</read_first>
  <action>
**Story table (src/components/work/story-table.tsx) -- NEW FILE:**
Per D-03 and D-04. Uses `@tanstack/react-table`.

Columns per D-03:
1. Checkbox column for row selection (multi-select for bulk actions per D-04)
2. `displayId` -- monospace font, compact
3. `title` -- primary text, clickable to open story detail
4. `status` -- colored Badge component. Colors: DRAFT=gray, READY=blue, SPRINT_PLANNED=purple, IN_PROGRESS=yellow, IN_REVIEW=orange, QA=pink, DONE=green
5. `priority` -- Badge. CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=gray
6. `assignee` -- display assignee displayName or "Unassigned" in muted text
7. `storyPoints` -- number or "-"
8. `feature` -- feature name or "-"
9. `sprint` -- sprint name or "Unassigned"

**Bulk action toolbar (inline at top of story table):**
Per D-04. Appears when 1+ rows selected. Shows:
- Selected count: "{N} selected"
- "Change Status" dropdown -- shows available statuses
- "Assign Sprint" dropdown -- loads available sprints for the project
- "Change Assignee" dropdown -- loads project members
- Each bulk action calls the corresponding server action in a loop for selected story IDs, then refreshes via `router.refresh()`

Use `table.getSelectedRowModel()` from TanStack for selection tracking.

**Story kanban (src/components/work/story-kanban.tsx) -- NEW FILE:**
Per D-01. Kanban columns by StoryStatus. Follow same pattern as question-kanban.tsx. Columns: DRAFT, READY, SPRINT_PLANNED, IN_PROGRESS, IN_REVIEW, QA, DONE. Each card shows: displayId, title, priority badge, assignee avatar (or initials), story points.

**Component selector (src/components/work/component-selector.tsx) -- NEW FILE:**
Per D-08. Inline multi-entry component for attaching Salesforce components to a story.
- Each entry has two fields: `componentName` (text input, free-text) and `impactType` (select: CREATE, MODIFY, DELETE)
- "Add Component" button appends a new row
- Each row has a delete (X) button to remove
- Controlled component: receives `value: Array<{ componentName: string, impactType: ImpactType }>` and `onChange` callback
- Used inside story-form.tsx as part of the form
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Story table displays all D-03 columns with bulk action toolbar (D-04). Story kanban shows status columns. Component selector provides free-text component + impact type entries (D-08).</done>
</task>

<task type="auto">
  <name>Task 2: Story form (slide-over), feature detail page, and backlog page</name>
  <files>src/components/work/story-form.tsx, src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/page.tsx, src/app/(dashboard)/projects/[projectId]/backlog/page.tsx</files>
  <read_first>src/components/questions/question-form.tsx, src/components/ui/sheet.tsx, src/components/work/component-selector.tsx, src/components/work/story-table.tsx, src/components/work/work-breadcrumb.tsx, src/actions/stories.ts, src/actions/epics.ts</read_first>
  <action>
**Story form (src/components/work/story-form.tsx) -- NEW FILE:**
Per D-05. Slide-over panel using shadcn Sheet component (opening from right).
Fields:
- `title` (required, text input)
- `epic` (required, select -- populated from epics in project. Pre-selected if opened from within an epic context)
- `feature` (optional, select -- filtered by selected epic. Pre-selected if opened from feature context)
- `persona` (optional, text input, placeholder "As a...")
- `description` (optional, textarea)
- `acceptanceCriteria` (required per WORK-02, textarea, placeholder "Given... When... Then...")
- `storyPoints` (optional, number input)
- `priority` (select: LOW, MEDIUM, HIGH, CRITICAL)
- `components` (ComponentSelector widget per D-08)

Uses react-hook-form with zod resolver. On submit: calls `createStory` server action, then for each component entry calls `addStoryComponent` from `src/actions/stories.ts` (created in Plan 01).

Dirty form protection per Pitfall 6: use `formState.isDirty` and `onOpenChange` to confirm before closing if unsaved changes exist.

Edit mode: When an existing story is passed as prop, pre-populate all fields and call `updateStory` on submit.

Status transition buttons: When editing, show current status badge and available transitions (from `getAvailableTransitions`). Each transition is a separate button that calls `updateStoryStatus`. Per D-09.

**Feature detail page (src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/page.tsx) -- NEW FILE:**
Server component. Calls `getStories({ projectId, featureId })`. Renders:
- `<WorkBreadcrumb segments={[Work, EpicName, FeatureName]} />`
- Story table with view toggle (table/kanban)
- "New Story" button opening slide-over form

**Backlog page (src/app/(dashboard)/projects/[projectId]/backlog/page.tsx) -- NEW FILE:**
Per D-02. Server component. Calls `getStories({ projectId, unassigned: true })`. Renders:
- Page header: "Backlog" title
- Story table showing all stories where sprintId is null, across all epics
- Bulk action toolbar for sprint assignment
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Story form slide-over has all D-05 fields with mandatory acceptance criteria (WORK-02), component selector (D-08), role-gated status transitions (D-09), and dirty form protection. Feature detail page and backlog page render story tables.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client UI -> Server Actions | All form submissions validated server-side via Zod schemas |
| Bulk actions -> Database | Each bulk operation validates per-item permissions |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-05b | Tampering | Bulk status change | mitigate | Each status change in bulk loop validates via canTransition() server-side |
| T-03-06b | Elevation of Privilege | Story form edit | mitigate | Role check in updateStory server action (PM/SA can edit any, others own only) |
| T-03-07b | Information Disclosure | Backlog page | mitigate | getStories uses scopedPrisma -- only shows project's stories |
</threat_model>

<verification>
1. `npx tsc --noEmit` passes
2. Story form enforces mandatory acceptance criteria
3. Bulk action toolbar appears on row selection
4. Feature detail page shows stories with breadcrumb
5. Backlog page shows unassigned stories
</verification>

<success_criteria>
- Story table shows all 8 data columns per D-03 plus checkbox column
- Bulk actions work for status change, sprint assignment, assignee change
- Story form slide-over has all D-05 fields with validation
- Component selector allows free-text component + impact type entries
- Feature detail page renders stories with breadcrumb navigation
- Backlog shows unassigned stories across all epics
</success_criteria>

<output>
After completion, create `.planning/phases/03-story-management-and-sprint-intelligence/03-02b-SUMMARY.md`
</output>
