# Phase 3: Story Management and Sprint Intelligence - Research

**Researched:** 2026-04-06
**Domain:** Work breakdown management (epics/features/stories), sprint planning, AI-powered conflict detection
**Confidence:** HIGH

## Summary

Phase 3 builds the work management layer on top of the existing Phase 2 foundation. The core work involves CRUD operations for epics, features, and stories with a hierarchical drill-down UI, sprint creation and story assignment with a split-view interface, a sprint board kanban, a burndown chart, and AI-powered conflict detection via Inngest background functions.

The database schema for all models (Epic, Feature, Story, Sprint, StoryComponent) is already deployed from Phase 1. The Prisma enums (EpicStatus, FeatureStatus, StoryStatus, SprintStatus, Priority, ImpactType) are all defined and ready. The existing Phase 2 UI patterns -- table+kanban toggle, accept/reject/edit cards, chat-based AI sessions, server actions with next-safe-action -- are directly reusable. The agent harness architecture from Phase 2 provides the foundation for AI story generation and conflict detection tasks.

The primary new dependency is `recharts` (installed via shadcn/ui chart component) for the burndown chart. Drag-and-drop uses native HTML DnD API, consistent with the Phase 2 question kanban pattern. No new DnD library is needed.

**Primary recommendation:** Follow established Phase 2 patterns exactly. The main technical novelty is the burndown chart (recharts via shadcn chart component) and the conflict detection Inngest function. Everything else is CRUD + UI composition using proven patterns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Breadcrumb drill-down with table+kanban toggle at each level. Flat table for epics list, click epic to see features table, click feature to see stories table. Breadcrumb trail for path navigation.
- **D-02:** Sidebar nav entry: "Work" section showing Epics as the entry point, plus a "Backlog" shortcut showing all unassigned stories across epics.
- **D-03:** Story table columns: displayId, title, status badge, priority, assignee, story points, feature, sprint assignment.
- **D-04:** Bulk actions via multi-select checkboxes on story table for bulk status change, sprint assignment, and assignee change.
- **D-05:** Manual story creation via slide-over panel (drawer from right) with form fields. Fields: title (required), epic (required), feature (optional), persona, description, acceptance criteria (required per WORK-02), story points, priority, impacted components.
- **D-06:** AI story generation launched from epic/feature context menu as a chat session. AI reads requirements, discovery context, and knowledge articles for that scope.
- **D-07:** AI-generated drafts presented as cards with accept/edit/reject actions (same pattern as transcript extraction cards from Phase 2 D-09).
- **D-08:** Component attachment via inline multi-select with componentName + impactType (CREATE/MODIFY/DELETE) per entry. Free-text component names in Phase 3.
- **D-09:** Story status transitions: PM manages lifecycle states (Draft > Ready, Ready > Sprint Planned auto-transitions on sprint assignment). Developers manage execution states (In Progress > In Review > QA > Done).
- **D-10:** Sprint creation via simple dialog/modal form with fields: name, goal (optional), start date, end date. No capacity field in V1.
- **D-11:** Story assignment via split view: backlog on left, sprint on right. Drag-and-drop from backlog to sprint, or multi-select + "Move to Sprint" bulk action.
- **D-12:** Sprint board as kanban columns by StoryStatus (Draft | Ready | In Progress | In Review | QA | Done).
- **D-13:** Sprint dashboard: header with sprint goal + date range + progress bar, summary cards, burndown chart.
- **D-14:** Sprint list view as table of all sprints with status, date range, story count, points.
- **D-15:** Conflict analysis runs on story assignment to sprint (real-time). AI checks StoryComponent overlaps.
- **D-16:** Conflict display as warning banner at top of sprint board when conflicts detected.
- **D-17:** Advisory severity model only -- warnings, not blocking gates. Option to dismiss individual warnings.
- **D-18:** Dependency suggestions shown in sprint planning view as an ordered list.
- **D-19:** Dependency analysis triggered via Inngest background function on `sprint/stories-changed` event.

### Claude's Discretion
- Exact drag-and-drop library and animation for sprint planning
- Burndown chart library and styling
- Loading skeletons for work breakdown views
- Empty state designs for no epics/features/stories
- Sprint board card density and responsive layout
- Conflict detection AI prompt engineering and token budget
- Story displayId format and auto-increment logic

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WORK-01 | User can create and manage epics with hierarchy: epic > feature > user story | Schema deployed (Epic, Feature, Story models). Breadcrumb drill-down UI pattern (D-01). Server actions follow safe-action.ts pattern. |
| WORK-02 | Stories have mandatory fields enforced by validation (acceptance criteria, impacted components, etc.) | Zod schema validation via react-hook-form + @hookform/resolvers. Slide-over form (D-05). |
| WORK-03 | User can edit and delete own stories; PM/SA can edit any story | Role-based access via Clerk auth middleware in safe-action.ts. ProjectMember role check pattern from Phase 2. |
| WORK-04 | Story status workflow: Draft > Ready > Sprint Planned > In Progress > In Review > QA > Done | StoryStatus enum deployed. State machine validation in server action. |
| WORK-05 | PM manages lifecycle states, developers manage execution states, auto-transition on sprint assignment | Role-based transition rules. Auto-set SPRINT_PLANNED when sprintId assigned. |
| WORK-06 | AI-assisted story generation from requirements and discovery context | Agent harness task definition (new). Chat session pattern from Phase 2 transcript processing. |
| WORK-07 | Each story tracks impacted Salesforce components via StoryComponent join | StoryComponent model deployed. Free-text componentName + ImpactType in Phase 3. |
| SPRT-01 | PM can create sprints with start/end dates and capacity | Sprint model deployed. Dialog form (D-10). No capacity enforcement in V1. |
| SPRT-02 | PM can assign stories to sprints | Split view (D-11). Update Story.sprintId + auto-transition to SPRINT_PLANNED. |
| SPRT-03 | Sprint intelligence detects component-level conflicts between stories in same sprint | Inngest function triggered by sprint/stories-changed. AI analyzes StoryComponent overlaps. |
| SPRT-04 | Sprint intelligence suggests dependency ordering and parallelization | Same Inngest function. AI analyzes component dependencies and suggests order. |
| SPRT-05 | Sprint dashboard shows progress, velocity, and burndown | recharts via shadcn/ui chart component. Burndown = daily points remaining vs ideal line. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| next-safe-action | 8.4.0 | Type-safe server actions with Zod validation | [VERIFIED: package.json] |
| react-hook-form | 7.72.1 | Form management for story/epic/feature/sprint creation | [VERIFIED: package.json] |
| @hookform/resolvers | 5.2.2 | Zod integration for form validation | [VERIFIED: package.json] |
| zod | 4.3.6 | Schema validation for all CRUD inputs | [VERIFIED: package.json] |
| @tanstack/react-table | n/a | Data tables for epics, features, stories, sprints | [VERIFIED: CLAUDE.md specifies, NOT yet in package.json -- needs install] |
| inngest | 4.1.2 | Background jobs for conflict detection and dependency analysis | [VERIFIED: package.json] |
| @anthropic-ai/sdk | 0.82.0 | Claude API for story generation and conflict detection | [VERIFIED: package.json] |
| ai | 6.0.147 | Streaming chat for AI story generation session | [VERIFIED: package.json] |
| date-fns | 4.1.0 | Sprint date formatting, burndown date calculations | [VERIFIED: package.json] |
| nuqs | 2.8.9 | URL search params for table filtering and pagination | [VERIFIED: package.json] |
| sonner | 2.0.7 | Toast notifications | [VERIFIED: package.json] |
| swr | 2.4.1 | Client-side polling for conflict analysis results | [VERIFIED: package.json] |

### New Dependencies
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| recharts | 3.8.1 | Burndown chart rendering | Peer depends on React `^19.0.0` -- compatible. shadcn/ui chart component wraps recharts. [VERIFIED: npm registry, peer deps checked] |

**Note:** `@tanstack/react-table` is specified in CLAUDE.md as a locked dependency but is NOT in `package.json` yet. It must be installed during this phase. Version 8.21.3 per CLAUDE.md. [VERIFIED: CLAUDE.md lists it, grep of package.json confirms absence]

### Not Needed
| Library | Why Not |
|---------|---------|
| @dnd-kit/core or @dnd-kit/react | Native HTML drag-and-drop is already proven in Phase 2 question kanban. Same pattern works for sprint planning split view and sprint board. No additional library needed. |
| chart.js / visx / nivo | recharts via shadcn/ui chart component is the standard. Consistent with the shadcn ecosystem. |

**Installation:**
```bash
npm install recharts @tanstack/react-table
npx shadcn@latest add chart
```

## Architecture Patterns

### Project Structure (New Files)
```
src/
  app/(dashboard)/projects/[projectId]/
    work/
      page.tsx                          # Epics list (entry point for "Work")
      [epicId]/
        page.tsx                        # Features list for an epic
        [featureId]/
          page.tsx                      # Stories list for a feature
    backlog/
      page.tsx                          # All unassigned stories across epics
    sprints/
      page.tsx                          # Sprint list table
      [sprintId]/
        page.tsx                        # Sprint detail (board + dashboard)
  actions/
    epics.ts                            # Epic CRUD server actions
    features.ts                         # Feature CRUD server actions
    stories.ts                          # Story CRUD + bulk actions
    sprints.ts                          # Sprint CRUD + story assignment
  components/
    work/
      epic-table.tsx                    # Epics table view
      epic-kanban.tsx                   # Epics kanban view
      feature-table.tsx                 # Features table
      feature-kanban.tsx                # Features kanban
      story-table.tsx                   # Stories table with bulk actions
      story-kanban.tsx                  # Stories kanban by status
      story-form.tsx                    # Slide-over panel form
      story-draft-cards.tsx             # AI-generated story accept/edit/reject
      component-selector.tsx            # Inline componentName + impactType selector
      work-breadcrumb.tsx               # Breadcrumb navigation
      view-toggle.tsx                   # Shared table/kanban toggle (extract from Phase 2)
    sprints/
      sprint-table.tsx                  # Sprint list table
      sprint-board.tsx                  # Kanban board by StoryStatus
      sprint-dashboard.tsx              # Progress bar, summary cards, burndown
      sprint-form.tsx                   # Create sprint dialog
      sprint-planning.tsx               # Split view: backlog + sprint
      burndown-chart.tsx                # Recharts line chart
      conflict-banner.tsx               # Warning banner with conflict details
      dependency-list.tsx               # Ordered dependency suggestions
  lib/
    agent-harness/
      tasks/
        story-generation.ts             # AI story generation task definition
        sprint-intelligence.ts          # Conflict detection + dependency task
      tools/
        create-story-draft.ts           # Tool for AI to create story drafts
      context/
        requirements.ts                 # Load requirements for story generation
        stories-in-sprint.ts            # Load sprint stories + components for conflict check
    inngest/
      functions/
        sprint-intelligence.ts          # Inngest function for conflict + dependency analysis
    story-status-machine.ts             # Status transition validation logic
```

### Pattern 1: Hierarchical Drill-Down with Breadcrumbs
**What:** Each level (epics > features > stories) is a separate route with its own page. Breadcrumb component tracks the path.
**When to use:** Navigation between hierarchy levels.
**Example:**
```typescript
// src/components/work/work-breadcrumb.tsx
// Source: Phase 2 established patterns + D-01
interface BreadcrumbSegment {
  label: string
  href: string
}

function WorkBreadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {segments.map((seg, i) => (
        <Fragment key={seg.href}>
          {i > 0 && <ChevronRight className="h-4 w-4" />}
          {i === segments.length - 1 ? (
            <span className="font-medium text-foreground">{seg.label}</span>
          ) : (
            <Link href={seg.href} className="hover:text-foreground transition-colors">
              {seg.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
```

### Pattern 2: Story Status Machine
**What:** Centralized validation of allowed status transitions with role-based gating.
**When to use:** Every story status update action.
**Example:**
```typescript
// src/lib/story-status-machine.ts [ASSUMED]
const TRANSITIONS: Record<StoryStatus, StoryStatus[]> = {
  DRAFT: ["READY"],
  READY: ["SPRINT_PLANNED", "DRAFT"],
  SPRINT_PLANNED: ["IN_PROGRESS", "READY"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: ["QA", "IN_PROGRESS"],
  QA: ["DONE", "IN_PROGRESS"],
  DONE: [],
}

// PM can: DRAFT->READY, READY->SPRINT_PLANNED (auto on assignment)
// Developer can: IN_PROGRESS->IN_REVIEW->QA->DONE
type RoleGroup = "PM" | "DEV"

function canTransition(
  from: StoryStatus, to: StoryStatus, role: RoleGroup
): boolean {
  if (!TRANSITIONS[from].includes(to)) return false
  // Role checks...
  return true
}
```

### Pattern 3: Inngest Event-Driven Sprint Intelligence
**What:** Sprint conflict detection and dependency analysis triggered by `sprint/stories-changed` event.
**When to use:** When stories are assigned to, removed from, or components change within a sprint.
**Example:**
```typescript
// src/lib/inngest/events.ts -- add new event
SPRINT_STORIES_CHANGED: "sprint/stories-changed",

// Event payload
{ sprintId: string, projectId: string }

// Inngest function runs:
// 1. Load all stories in sprint with their StoryComponent entries
// 2. Find overlapping componentName entries across different stories
// 3. Call Claude to analyze overlap significance and suggest ordering
// 4. Store results (JSON field on Sprint or separate cache)
```

### Pattern 4: Server Action with Role-Based Access
**What:** All CRUD actions use the established safe-action pattern with role checking.
**When to use:** Every mutation.
**Example:**
```typescript
// src/actions/stories.ts [VERIFIED: follows src/actions/questions.ts pattern]
import { actionClient } from "@/lib/safe-action"
import { z } from "zod"

const createStorySchema = z.object({
  projectId: z.string(),
  epicId: z.string(),
  featureId: z.string().optional(),
  title: z.string().min(1),
  acceptanceCriteria: z.string().min(1), // WORK-02: mandatory
  // ...
})

export const createStory = actionClient.schema(createStorySchema).action(
  async ({ parsedInput, ctx }) => {
    const db = scopedPrisma(parsedInput.projectId)
    // Generate displayId, create story...
  }
)
```

### Anti-Patterns to Avoid
- **Client-side status validation only:** Always validate status transitions server-side in the action. Client-side is for UX only.
- **Querying all stories unscoped:** Always use `scopedPrisma(projectId)` for data isolation (AUTH-04).
- **Inline conflict detection:** Conflict analysis is expensive (AI call). Always run via Inngest, never inline in the assignment action.
- **Blocking on conflict results:** Conflict detection is advisory (D-17). Assignment should succeed immediately; conflicts shown when analysis completes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data tables with sorting/filtering/pagination | Custom table logic | @tanstack/react-table + shadcn table | Column definitions, sorting, filtering, pagination are complex to get right. TanStack handles edge cases. |
| Charts/burndown | Custom SVG/Canvas chart | recharts via shadcn/ui chart component | Axes, tooltips, responsive sizing, animations -- dozens of edge cases. |
| Form validation | Manual validation | react-hook-form + zod + @hookform/resolvers | Handles async validation, field arrays (components), error states, dirty tracking. |
| Toast notifications | Custom toast system | sonner (already integrated) | Already wired into shadcn/ui. |
| URL state for filters | useState + router.push | nuqs | Type-safe URL params, shareable filter state, proper history handling. |
| Display ID generation | Manual counter | Extend existing `display-id.ts` | Concurrent-safe pattern already proven. |

**Key insight:** Phase 3 is mostly CRUD + UI composition. The only genuinely novel logic is the status machine, the conflict detection prompt, and the burndown data computation. Everything else should use existing libraries and patterns.

## Common Pitfalls

### Pitfall 1: StoryComponent Unique Constraint Gap
**What goes wrong:** The current `StoryComponent` model has `@@unique([storyId, orgComponentId])` but in Phase 3, `orgComponentId` is null (free-text components per D-08). This means the unique constraint won't prevent duplicate free-text component entries on a story.
**Why it happens:** The schema was designed for Phase 4's org connectivity. Phase 3 uses `componentName` (free-text) instead.
**How to avoid:** Add application-level dedup check when adding components: check if `(storyId, componentName, impactType)` combination already exists. Consider adding a compound index or updating the unique constraint. Alternatively, add `@@unique([storyId, componentName])` but this would break if the same component has CREATE and MODIFY impacts -- so use application-level validation.
**Warning signs:** Duplicate component entries appearing on stories.

### Pitfall 2: Story DisplayId Collision
**What goes wrong:** The `Story` model has a `displayId` field but no `@@unique([projectId, displayId])` constraint in the schema. Concurrent story creation could produce duplicates.
**Why it happens:** Missing unique constraint.
**How to avoid:** Add `@@unique([projectId, displayId])` to Story model via Prisma migration. Use the existing `generateDisplayId` pattern from `display-id.ts`, extended to support Story entity type.
**Warning signs:** Duplicate display IDs in story tables.

### Pitfall 3: Auto-Transition Race Condition
**What goes wrong:** When assigning a story to a sprint (SPRT-02), the status should auto-transition from READY to SPRINT_PLANNED (D-09). If the story is not in READY status, the auto-transition should be skipped (not errored).
**Why it happens:** Rigid status machine that throws on invalid transitions.
**How to avoid:** The sprint assignment action should: (1) set `sprintId`, (2) if status is READY, also set status to SPRINT_PLANNED, (3) if status is DRAFT or other, leave status unchanged but still assign. The auto-transition is a convenience, not a gate.
**Warning signs:** Sprint assignment failing for stories in DRAFT status.

### Pitfall 4: Burndown Chart Data Gaps
**What goes wrong:** Burndown chart shows no data points between sprint start and current date because there's no daily snapshot mechanism.
**Why it happens:** Story status changes are point-in-time events. Burndown needs daily aggregates.
**How to avoid:** Two approaches: (1) Compute burndown data on-the-fly by querying Story.updatedAt timestamps to reconstruct daily completed points (simpler, works for V1 scale), or (2) store daily snapshots via a scheduled Inngest cron. Recommend approach (1) for V1 since sprint sizes are small (5-15 stories).
**Warning signs:** Flat or incomplete burndown lines.

### Pitfall 5: Conflict Detection Prompt Token Budget
**What goes wrong:** Loading all story details + components for every story in a sprint creates a large prompt, especially with detailed acceptance criteria.
**Why it happens:** Naive context assembly loads full story text.
**How to avoid:** For conflict detection, only load: story displayId, title, and StoryComponent entries (componentName + impactType). Skip description and acceptance criteria -- they're irrelevant for component-level conflict detection. Budget: ~2K tokens for sprint context + ~1K for system prompt.
**Warning signs:** High token costs on sprint intelligence calls.

### Pitfall 6: Sheet (Slide-Over) Form State Persistence
**What goes wrong:** User fills out story form, accidentally closes the sheet, loses all input.
**Why it happens:** React state resets when Sheet unmounts.
**How to avoid:** Use controlled open state and `onOpenChange` handler that confirms close if form is dirty (react-hook-form `formState.isDirty`). Or keep the Sheet mounted but hidden.
**Warning signs:** User complaints about lost form data.

## Code Examples

### Extending Display ID Generator for Stories
```typescript
// Add to src/lib/display-id.ts [VERIFIED: extends existing pattern]
// Add "Story" to DisplayIdEntityType union
// Story prefix should follow Epic prefix: if Epic prefix is "AUTH", stories are "AUTH-1", "AUTH-2"
// This means Story displayId incorporates the Epic prefix

export type DisplayIdEntityType = "Question" | "Decision" | "Risk" | "Requirement" | "Story"

// For Story, the prefix comes from the parent Epic's prefix field
// So generateStoryDisplayId needs the epicPrefix parameter
export async function generateStoryDisplayId(
  projectId: string,
  epicPrefix: string,
  prismaClient: PrismaClient
): Promise<string> {
  const records = await prismaClient.story.findMany({
    where: { projectId, displayId: { startsWith: `${epicPrefix}-` } },
    select: { displayId: true },
  })
  // Extract max number, increment
  const numbers = records
    .map(r => {
      const match = r.displayId.match(new RegExp(`^${epicPrefix}-(\\d+)$`))
      return match ? parseInt(match[1], 10) : 0
    })
    .filter(n => !isNaN(n))
  const nextNumber = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1
  return `${epicPrefix}-${nextNumber}`
}
```

### Sprint Assignment with Auto-Transition
```typescript
// src/actions/sprints.ts [ASSUMED: follows established pattern]
export const assignStoriesToSprint = actionClient.schema(
  z.object({
    projectId: z.string(),
    sprintId: z.string(),
    storyIds: z.array(z.string()).min(1),
  })
).action(async ({ parsedInput }) => {
  const db = scopedPrisma(parsedInput.projectId)

  await db.$transaction(async (tx) => {
    for (const storyId of parsedInput.storyIds) {
      const story = await tx.story.findUniqueOrThrow({ where: { id: storyId } })

      // Auto-transition READY -> SPRINT_PLANNED (D-09)
      const newStatus = story.status === "READY" ? "SPRINT_PLANNED" : story.status

      await tx.story.update({
        where: { id: storyId },
        data: { sprintId: parsedInput.sprintId, status: newStatus },
      })
    }
  })

  // Fire event for conflict detection (D-19)
  await inngest.send({
    name: EVENTS.SPRINT_STORIES_CHANGED,
    data: { sprintId: parsedInput.sprintId, projectId: parsedInput.projectId },
  })
})
```

### Burndown Chart Data Computation
```typescript
// src/lib/burndown.ts [ASSUMED: simple on-the-fly computation]
import { eachDayOfInterval, startOfDay, isBefore, isAfter } from "date-fns"

interface BurndownPoint { date: Date; remaining: number; ideal: number }

function computeBurndown(
  sprintStart: Date,
  sprintEnd: Date,
  stories: Array<{ storyPoints: number | null; status: string; updatedAt: Date }>
): BurndownPoint[] {
  const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0)
  const days = eachDayOfInterval({ start: sprintStart, end: sprintEnd })
  const today = startOfDay(new Date())

  return days.map((day, i) => {
    const ideal = totalPoints - (totalPoints / (days.length - 1)) * i

    // Only compute actual for past/current days
    if (isAfter(day, today)) return { date: day, remaining: NaN, ideal }

    // Count points completed by end of this day
    const completedByDay = stories
      .filter(s => s.status === "DONE" && isBefore(startOfDay(s.updatedAt), day))
      .reduce((sum, s) => sum + (s.storyPoints ?? 0), 0)

    return { date: day, remaining: totalPoints - completedByDay, ideal }
  })
}
```

### Conflict Detection Inngest Function
```typescript
// src/lib/inngest/functions/sprint-intelligence.ts [ASSUMED: follows existing Inngest patterns]
import { inngest } from "../client"
import { EVENTS } from "../events"

export const sprintIntelligence = inngest.createFunction(
  { id: "sprint-intelligence", retries: 2 },
  { event: EVENTS.SPRINT_STORIES_CHANGED },
  async ({ event, step }) => {
    const { sprintId, projectId } = event.data

    // Step 1: Load sprint stories + components
    const sprintData = await step.run("load-sprint-data", async () => {
      // Query stories with storyComponents for this sprint
      // Return minimal data: displayId, title, components
    })

    // Step 2: Find component overlaps (no AI needed for this)
    const overlaps = await step.run("detect-overlaps", async () => {
      // Group components by componentName
      // Find names appearing in 2+ stories
      // Return overlap pairs
    })

    if (overlaps.length === 0) {
      // No conflicts -- store empty result
      return { conflicts: [], dependencies: [] }
    }

    // Step 3: AI analysis of overlaps + dependency ordering
    const analysis = await step.run("ai-analysis", async () => {
      // Call Claude with overlap data
      // Ask for: severity assessment, dependency ordering, reasoning
    })

    // Step 4: Store results (cache on Sprint or separate table)
    await step.run("store-results", async () => {
      // Update sprint with cached analysis results
    })
  }
)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @dnd-kit/core (classic) | @dnd-kit/react 0.3.2 or native HTML DnD | 2025 | @dnd-kit/react is v0.x and unstable. Native HTML DnD is proven in this codebase. Use native. [VERIFIED: npm registry] |
| Custom chart components | shadcn/ui chart (wraps recharts 3.x) | 2024 | shadcn/ui provides copy-paste chart components with consistent styling. [CITED: ui.shadcn.com/docs/components/radix/chart] |
| recharts v2 | recharts v3.8.1 | 2025 | v3 has breaking API changes from v2. Use shadcn chart component which handles v3 API. [VERIFIED: npm registry] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Story displayId format: `{EpicPrefix}-{N}` (e.g., AUTH-1, DATA-3) | Code Examples | Low -- format is at Claude's discretion per CONTEXT.md. Alternative: flat "S-N" format. |
| A2 | Burndown computed on-the-fly from Story.updatedAt, no daily snapshots | Code Examples / Pitfalls | Low -- V1 sprint sizes small. If inaccurate, can add snapshots later. |
| A3 | Conflict analysis results stored as JSON field on Sprint model | Architecture Patterns | Medium -- may need a separate SprintAnalysis model if results are complex. Schema migration needed either way. |
| A4 | Sprint model needs an `analysisCache` JSON field (not in current schema) | Architecture Patterns | Medium -- requires Prisma migration. Alternative: separate table. |
| A5 | Native HTML drag-and-drop sufficient for split-view sprint planning | Standard Stack | Low -- already proven in Phase 2 kanban. Same complexity level. |

## Open Questions

1. **Sprint analysis storage**
   - What we know: Sprint model has no field for storing conflict/dependency analysis results.
   - What's unclear: Should we add a JSON field to Sprint, or create a separate SprintAnalysis model?
   - Recommendation: Add a `cachedAnalysis` JSON field to Sprint (Prisma `Json?` type). Same pattern used for `Project.cachedBriefingContent` in Phase 2. Requires a migration.

2. **Story displayId uniqueness constraint**
   - What we know: Story.displayId exists in schema but has no unique constraint.
   - What's unclear: Whether this was intentional.
   - Recommendation: Add `@@unique([projectId, displayId])` via migration. This is needed for data integrity.

3. **Epic/Feature displayId or prefix in story tables**
   - What we know: Epic has a `prefix` field. Feature has a `prefix` field scoped to epic (`@@unique([epicId, prefix])`).
   - What's unclear: Whether story displayId should incorporate the feature prefix too (e.g., AUTH-LOGIN-1).
   - Recommendation: Keep it simple: `{EpicPrefix}-{N}`. Feature context is shown in the table column (D-03). Nesting feature prefix adds complexity for marginal benefit.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Not yet configured (no test framework in devDependencies) |
| Config file | None -- needs setup in Wave 0 |
| Quick run command | TBD after framework selection |
| Full suite command | TBD after framework selection |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WORK-01 | CRUD operations for epics/features/stories | unit | TBD | No -- Wave 0 |
| WORK-02 | Mandatory field validation (acceptance criteria) | unit | TBD | No -- Wave 0 |
| WORK-03 | Role-based edit/delete permissions | unit | TBD | No -- Wave 0 |
| WORK-04 | Status workflow transitions | unit | TBD | No -- Wave 0 |
| WORK-05 | PM vs developer status management | unit | TBD | No -- Wave 0 |
| WORK-06 | AI story generation produces valid drafts | integration | TBD | No -- Wave 0 |
| WORK-07 | StoryComponent CRUD with free-text names | unit | TBD | No -- Wave 0 |
| SPRT-01 | Sprint CRUD operations | unit | TBD | No -- Wave 0 |
| SPRT-02 | Story assignment + auto-transition | unit | TBD | No -- Wave 0 |
| SPRT-03 | Component conflict detection | unit | TBD | No -- Wave 0 |
| SPRT-04 | Dependency ordering suggestions | integration | TBD | No -- Wave 0 |
| SPRT-05 | Burndown data computation | unit | TBD | No -- Wave 0 |

### Wave 0 Gaps
- [ ] Test framework selection and configuration (vitest recommended for Next.js)
- [ ] Story status machine unit tests
- [ ] Burndown computation unit tests
- [ ] Server action integration test setup

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (inherited) | Clerk -- already configured in safe-action.ts middleware |
| V3 Session Management | yes (inherited) | Clerk session management -- no Phase 3 changes |
| V4 Access Control | yes | Role-based access in server actions: PM manages lifecycle, devs manage execution (WORK-03, WORK-05) |
| V5 Input Validation | yes | Zod schemas on all server actions. Mandatory field enforcement (WORK-02). |
| V6 Cryptography | no | No crypto operations in Phase 3 |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized story edit | Elevation of Privilege | Check ProjectMember role in server action before mutation |
| Cross-project data access | Information Disclosure | scopedPrisma(projectId) on all queries (AUTH-04) |
| Status transition bypass | Tampering | Server-side status machine validation, not client-only |
| Sprint assignment without membership | Elevation of Privilege | Verify userId is a ProjectMember of the target project |

## Sources

### Primary (HIGH confidence)
- Prisma schema (`prisma/schema.prisma`) -- All models, enums, and constraints verified
- Existing codebase (`src/lib/`, `src/actions/`, `src/components/`) -- Established patterns verified
- `package.json` -- All installed dependencies and versions verified
- npm registry -- Versions and peer dependencies for recharts (3.8.1), @tanstack/react-table (8.21.3), @dnd-kit/react (0.3.2) verified

### Secondary (MEDIUM confidence)
- [shadcn/ui chart docs](https://ui.shadcn.com/docs/components/radix/chart) -- Chart component wraps recharts, copy-paste integration
- [shadcn/ui charts gallery](https://ui.shadcn.com/charts/area) -- Available chart types including line charts for burndown

### Tertiary (LOW confidence)
- Burndown computation approach (on-the-fly vs snapshots) -- based on training data knowledge of sprint management patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries are already installed or have verified compatibility
- Architecture: HIGH -- Follows established Phase 2 patterns, schema already deployed
- Pitfalls: HIGH -- Based on verified schema analysis and codebase patterns
- AI integration: MEDIUM -- Story generation and conflict detection prompts need iteration

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable domain, locked stack)
