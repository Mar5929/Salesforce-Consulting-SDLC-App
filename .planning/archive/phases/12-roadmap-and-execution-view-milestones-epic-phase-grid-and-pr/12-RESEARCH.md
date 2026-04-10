# Phase 12: Roadmap and Execution View - Research

**Researched:** 2026-04-08
**Domain:** Dashboard views — milestone management, matrix grid visualization, execution plan display, AI synthesis
**Confidence:** HIGH

## Summary

Phase 12 builds three interconnected views behind a single "Roadmap" sidebar item with tabs: Milestones (CRUD + progress tracking + AI synthesis), Epic Phase Grid (status matrix), and Execution Plan (per-epic story ordering with dependency indicators). All database models already exist in the Prisma schema (Milestone, EpicPhase, MilestoneStory). The project-scope utility already includes Milestone. No schema migrations are needed.

The implementation follows well-established patterns from prior phases: server component page.tsx with data loading, client component for interactivity, tabbed sub-views (story detail pattern with Tabs component), Sheet slide-over for forms (story form pattern), and next-safe-action for mutations. The AI synthesis reuses the existing agent harness engine with a new task definition, rendered via the existing AiSummaryCard component. The one novel UI element is the Epic Phase Grid matrix — an HTML table with clickable status cells — which is straightforward but has no direct precedent in the codebase.

**Primary recommendation:** Implement as three waves: (1) routing + sidebar + milestone CRUD with progress, (2) Epic Phase Grid with inline status cycling, (3) Execution Plan display + AI milestone synthesis.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Single "Roadmap" sidebar item at `/projects/[projectId]/roadmap`. Phase gating via `phase: 12`.
- **D-02:** Tabbed sub-views: Milestones (default), Epic Phases, Execution Plan. Follows existing tab pattern.
- **D-03:** Sidebar item visible to all roles (no role restriction).
- **D-04:** Milestones tab: table view with name, target date, status badge, progress bar, story count, actions. Sorted by `sortOrder`.
- **D-05:** "New Milestone" button opens Sheet slide-over for create/edit. Fields: name, description, target date (optional), status, sort order.
- **D-06:** Story linking via "Link Stories" action — multi-select dialog showing unlinked stories grouped by epic. Uses MilestoneStory join.
- **D-07:** Milestone deletion with confirmation dialog. Cascade deletes MilestoneStory links, not stories.
- **D-08:** Epic Phase Grid: HTML table/matrix. Rows = epics (sorted by creation or sort field). Columns = 5 EpicPhaseType values.
- **D-09:** Cell shows status chip (color-coded badge): NOT_STARTED (gray), IN_PROGRESS (blue), COMPLETE (green), SKIPPED (striped/muted). Click to cycle statuses inline.
- **D-10:** Column headers show aggregate counts. Row shows epic name with link to epic detail.
- **D-11:** Execution Plan: collapsible per-epic sections. Header: epic name, story count, completion percentage.
- **D-12:** Within each epic: stories in execution order showing display ID, title, owner(s), status badge, dependency indicators. Blocked stories highlighted.
- **D-13:** Phase grouping within each epic — stories grouped by project phase (Discovery, Design, Build). Collapsible sub-groups.
- **D-14:** Dependencies as inline text links ("Blocked by: STORY-123"), not graphical lines.
- **D-15:** Milestone progress computed server-side: (completed stories / total linked stories) weighted with blocking question resolution.
- **D-16:** Progress bar with percentage. Color: green (>75%), yellow (25-75%), red (<25%).
- **D-17:** "Upcoming milestones" section shows next 2-3 milestones with AI-synthesized summaries.
- **D-18:** AI synthesis on-demand via server action on page load (or explicit refresh). Reuses AiSummaryCard. Not a scheduled Inngest job.
- **D-19:** AI context: milestone description, linked stories with statuses, blocking questions. Claude generates "what must happen" and "what's currently blocking" summary.

### Claude's Discretion
- Table row density and spacing in milestone table
- Epic Phase Grid responsive behavior on smaller screens
- Execution Plan accordion expand/collapse behavior
- Empty states for each tab
- Loading skeletons for each view
- Sort controls and filtering within tabs
- AI synthesis card layout and refresh UX
- Whether to show mini epic phase grid inline on Milestones tab

### Deferred Ideas (OUT OF SCOPE)
- Full dependency graph visualization (graphical lines/arrows)
- Drag-and-drop story reordering
- Milestone timeline/Gantt view
- Epic Phase Grid bulk operations
</user_constraints>

<phase_requirements>
## Phase Requirements

Phase 12 does not map to specific requirement IDs from REQUIREMENTS.md (all 93 v1 requirements are already satisfied). This phase implements PRD Sections 17.2 (Roadmap Dashboard) and 17.4 (Execution Plan View) as a post-v1 enhancement.

| PRD Section | Description | Research Support |
|-------------|-------------|------------------|
| PRD 17.2 - Milestones Table | Milestone CRUD, progress tracking, status management | Milestone model exists in schema. scopedPrisma supports Milestone. Sheet/Table/Badge components available. |
| PRD 17.2 - Epic Phase Grid | Epic x phase status matrix | EpicPhase model exists with @@unique([epicId, phase]). 5 EpicPhaseType + 4 EpicPhaseStatus enums defined. |
| PRD 17.2 - Upcoming Milestones | AI-synthesized milestone summaries | Agent harness engine + AiSummaryCard reusable. New task definition needed. |
| PRD 17.4 - Per-Epic Story List | Stories in execution order with dependencies | Story.dependencies (String?) field available. QuestionBlocksStory join for blocking questions. |
| PRD 17.4 - Phase Grouping | Stories grouped by project phase within epic | EpicPhase model provides phase context per epic. Story status can indicate phase. |
| PRD 17.4 - Dependency Visualization | Inline "Blocked by" text links | Story.dependencies field + QuestionBlocksStory join provide data. D-14 locks text-only approach. |
</phase_requirements>

## Standard Stack

No new dependencies required. Phase 12 uses exclusively existing project libraries.

### Core (Already Installed)
| Library | Purpose | Used For |
|---------|---------|----------|
| Next.js (App Router) | Routing, server components | `/projects/[projectId]/roadmap` route with server data loading |
| Prisma | Database queries | Milestone, EpicPhase, MilestoneStory CRUD, Story queries with includes |
| next-safe-action + Zod | Server action validation | All milestone/epic-phase mutations |
| shadcn/ui | UI components | Tabs, Table, Sheet, Dialog, Badge, Progress, Card, Collapsible |
| nuqs | URL state | Tab selection persisted in URL search params |
| lucide-react | Icons | Milestone, calendar, chart icons |
| @anthropic-ai/sdk | AI synthesis | Milestone summary generation via agent harness |
| sonner | Toast notifications | Mutation feedback (create, update, delete) |
| date-fns | Date formatting | Milestone target dates |

### No New Packages Needed
This phase composes existing UI components and patterns. [VERIFIED: codebase inspection — all required shadcn/ui components (Tabs, Table, Sheet, Dialog, Badge, Progress, Card, Collapsible) already installed]

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(dashboard)/projects/[projectId]/roadmap/
│   ├── page.tsx                    # Server component — data loading
│   └── roadmap-client.tsx          # Client component — tabs, interactivity
├── components/roadmap/
│   ├── milestones-tab.tsx          # Milestones table + upcoming AI summaries
│   ├── milestone-form-sheet.tsx    # Create/edit Sheet slide-over
│   ├── milestone-link-stories.tsx  # Multi-select story linking dialog
│   ├── milestone-progress-bar.tsx  # Color-coded progress bar
│   ├── epic-phase-grid.tsx         # Matrix table with clickable cells
│   ├── epic-phase-cell.tsx         # Individual status cell with cycling
│   ├── execution-plan-tab.tsx      # Per-epic collapsible sections
│   └── epic-story-group.tsx        # Stories grouped by phase within epic
├── actions/
│   ├── milestones.ts               # Milestone CRUD server actions
│   └── epic-phases.ts              # EpicPhase status update action
└── lib/
    └── agent-harness/tasks/
        └── milestone-synthesis.ts  # AI task definition for milestone summaries
```

### Pattern 1: Server + Client Split (Established)
**What:** Server component page.tsx loads all data via scopedPrisma, passes serialized data to client component for interactivity.
**When to use:** Every page in this app.
**Source:** [VERIFIED: `src/app/(dashboard)/projects/[projectId]/work/page.tsx`, `dashboard/page.tsx`]
```typescript
// page.tsx (server component)
export default async function RoadmapPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  await getCurrentMember(projectId)
  const db = scopedPrisma(projectId)

  const [milestones, epics, epicPhases] = await Promise.all([
    db.milestone.findMany({
      where: { projectId },
      include: { milestoneStories: { include: { story: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.epic.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
    // EpicPhase is NOT in scopedPrisma (no projectId) — query via epicIds
    prisma.epicPhase.findMany({
      where: { epicId: { in: epicIds } },
    }),
  ])

  return <RoadmapClient projectId={projectId} milestones={...} epics={...} epicPhases={...} />
}
```

### Pattern 2: Tabbed Sub-Views with nuqs (Established)
**What:** Tabs component with URL-persisted tab selection via nuqs useQueryState.
**When to use:** D-02 requires Milestones/Epic Phases/Execution Plan tabs.
**Source:** [VERIFIED: `story-detail-client.tsx` uses Tabs with defaultTab prop; nuqs used in work page for view toggle]
```typescript
"use client"
import { useQueryState } from "nuqs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function RoadmapClient({ ... }) {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "milestones" })

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="milestones">Milestones</TabsTrigger>
        <TabsTrigger value="epic-phases">Epic Phases</TabsTrigger>
        <TabsTrigger value="execution-plan">Execution Plan</TabsTrigger>
      </TabsList>
      <TabsContent value="milestones">...</TabsContent>
      <TabsContent value="epic-phases">...</TabsContent>
      <TabsContent value="execution-plan">...</TabsContent>
    </Tabs>
  )
}
```

### Pattern 3: Sheet Slide-Over for Forms (Established)
**What:** Sheet component for create/edit forms, triggered by button or row action.
**When to use:** D-05 requires Sheet for milestone create/edit.
**Source:** [VERIFIED: Phase 3 decision — "Story form uses Sheet slide-over pattern"]

### Pattern 4: next-safe-action for Mutations (Established)
**What:** All server actions use `actionClient.schema(zodSchema).action(handler)` pattern with auth middleware.
**When to use:** All milestone CRUD and epic-phase status updates.
**Source:** [VERIFIED: `src/actions/stories.ts`, `src/lib/safe-action.ts`]

### Pattern 5: Agent Harness for AI Synthesis (Established)
**What:** TaskDefinition + executeTask() for AI calls. Context loader gathers project data, system prompt instructs Claude, result rendered via AiSummaryCard.
**When to use:** D-17/D-18/D-19 — milestone AI synthesis.
**Source:** [VERIFIED: `src/lib/agent-harness/tasks/dashboard-synthesis.ts`, `src/lib/agent-harness/engine.ts`]

### Anti-Patterns to Avoid
- **Don't store milestone progress:** PRD explicitly says progress is computed, not stored. Calculate server-side on each page load.
- **Don't use Inngest for milestone synthesis:** D-18 locks on-demand server action, not a background job. Keep it simple.
- **Don't build graphical dependency visualization:** D-14 locks text-based "Blocked by" indicators. Full graph is deferred.
- **Don't query EpicPhase via scopedPrisma:** EpicPhase has no `projectId` column — it relates to Epic which has projectId. Query via epicIds obtained from project-scoped epic query.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Manual input checking | Zod schemas + next-safe-action | Established pattern, type-safe |
| Tab URL persistence | Manual searchParams handling | nuqs useQueryState | Already used in work page |
| Progress bar | Custom CSS animation | shadcn/ui Progress component | Already installed, accessible |
| Collapsible sections | Manual show/hide state | shadcn/ui Collapsible component | Already installed, handles animation |
| AI text generation | Direct fetch to Anthropic API | Agent harness executeTask() | Handles retries, token tracking, cost logging |
| Date formatting | Manual date string building | date-fns format() | Already installed, handles edge cases |

## Common Pitfalls

### Pitfall 1: EpicPhase Has No projectId
**What goes wrong:** Attempting to use `scopedPrisma` for EpicPhase queries returns nothing or errors because EpicPhase has no `projectId` column.
**Why it happens:** EpicPhase relates to Epic (which has projectId) but is not directly project-scoped.
**How to avoid:** First query epics for the project, extract epicIds, then query EpicPhase with `where: { epicId: { in: epicIds } }`.
**Warning signs:** Empty epic phase grid despite data existing in the database.

### Pitfall 2: Milestone Progress Denominator of Zero
**What goes wrong:** Division by zero when computing progress for a milestone with no linked stories.
**Why it happens:** Newly created milestones have no MilestoneStory records.
**How to avoid:** Guard with `if (totalStories === 0) return 0` before computing percentage. Display "No stories linked" in the progress bar area.
**Warning signs:** NaN or Infinity appearing in the UI.

### Pitfall 3: Story.dependencies is a Free-Text String
**What goes wrong:** Expecting `dependencies` to be a structured array of story IDs for programmatic dependency resolution.
**Why it happens:** The Prisma schema defines `dependencies String?` — a nullable free-text field, not a relational FK.
**How to avoid:** For D-14 dependency indicators, parse the free-text string for display. For blocking question indicators, use the `QuestionBlocksStory` join table which IS relational. Do not try to build a dependency graph from the free-text field.
**Warning signs:** Regex failures trying to extract story IDs from arbitrary text.

### Pitfall 4: Serializing Prisma Dates for Client Components
**What goes wrong:** Prisma returns `Date` objects that can't be serialized for client components.
**Why it happens:** Next.js server-to-client serialization requires plain objects.
**How to avoid:** Use `JSON.parse(JSON.stringify(data))` pattern (established in work page) or map dates to ISO strings explicitly.
**Warning signs:** "Error: Only plain objects, and a few built-in, can be passed to Client Components from Server Components."

### Pitfall 5: Epic Phase Grid — Missing EpicPhase Records
**What goes wrong:** Not all epics have all 5 EpicPhase records, leaving empty cells in the grid.
**Why it happens:** EpicPhase records may only exist for phases an epic has entered. The schema has no auto-creation trigger.
**How to avoid:** When rendering the grid, fill missing phase cells with a virtual "NOT_STARTED" state. The click-to-cycle action should upsert (create if missing, update if exists) using the `@@unique([epicId, phase])` constraint.
**Warning signs:** Grid cells that are undefined/missing rather than showing NOT_STARTED.

### Pitfall 6: CURRENT_PHASE Constant
**What goes wrong:** Adding the Roadmap nav item with `phase: 12` but forgetting to update `CURRENT_PHASE` in sidebar.tsx (currently set to 1).
**Why it happens:** The `CURRENT_PHASE` constant gates which nav items are visible.
**How to avoid:** Update `CURRENT_PHASE` to at least 12 in sidebar.tsx as part of the nav item addition.
**Warning signs:** Roadmap nav item not appearing in the sidebar.

## Code Examples

### Milestone Progress Computation (D-15, D-16)
```typescript
// Source: PRD 17.2 + CONTEXT.md D-15
interface MilestoneWithStories {
  id: string
  milestoneStories: Array<{
    story: {
      id: string
      status: string
      questionBlocksStories: Array<{
        question: { status: string }
      }>
    }
  }>
}

function computeMilestoneProgress(milestone: MilestoneWithStories): {
  percentage: number
  completedStories: number
  totalStories: number
  unresolvedBlockingQuestions: number
} {
  const stories = milestone.milestoneStories.map(ms => ms.story)
  const total = stories.length
  if (total === 0) return { percentage: 0, completedStories: 0, totalStories: 0, unresolvedBlockingQuestions: 0 }

  const completed = stories.filter(s => s.status === "DONE").length

  // Count unresolved blocking questions across all linked stories
  const unresolvedBlockingQuestions = stories.reduce((count, story) => {
    const unresolved = story.questionBlocksStories.filter(
      qbs => !["ANSWERED", "REVIEWED"].includes(qbs.question.status)
    )
    return count + unresolved.length
  }, 0)

  // Weighted progress: story completion minus blocking question penalty
  const storyProgress = (completed / total) * 100
  const blockingPenalty = unresolvedBlockingQuestions > 0
    ? Math.min(storyProgress * 0.25, unresolvedBlockingQuestions * 5) // Cap penalty
    : 0
  const percentage = Math.max(0, Math.round(storyProgress - blockingPenalty))

  return { percentage, completedStories: completed, totalStories: total, unresolvedBlockingQuestions }
}
```

### Epic Phase Grid Cell Cycling (D-09)
```typescript
// Source: CONTEXT.md D-09
const PHASE_STATUS_CYCLE: Record<string, string> = {
  NOT_STARTED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETE",
  COMPLETE: "SKIPPED",
  SKIPPED: "NOT_STARTED",
}

// Server action for upsert
const updateEpicPhaseSchema = z.object({
  projectId: z.string(), // For auth verification
  epicId: z.string(),
  phase: z.nativeEnum(EpicPhaseType),
  status: z.nativeEnum(EpicPhaseStatus),
})

export const updateEpicPhaseStatus = actionClient
  .schema(updateEpicPhaseSchema)
  .action(async ({ parsedInput }) => {
    const { projectId, epicId, phase, status } = parsedInput
    await getCurrentMember(projectId)

    // Verify epic belongs to project
    const epic = await prisma.epic.findFirst({ where: { id: epicId, projectId } })
    if (!epic) throw new Error("Epic not found")

    // Upsert — handles missing records (Pitfall 5)
    await prisma.epicPhase.upsert({
      where: { epicId_phase: { epicId, phase } },
      create: { epicId, phase, status, sortOrder: PHASE_SORT_ORDER[phase] },
      update: { status },
    })

    revalidatePath(`/projects/${projectId}/roadmap`)
  })
```

### Sidebar NavItem Addition (D-01, D-03)
```typescript
// Source: CONTEXT.md D-01, D-03
// Add to buildNavItems() array in sidebar.tsx
{
  label: "Roadmap",
  icon: BarChart3, // or Map, or Milestone-appropriate icon
  href: activeProjectId
    ? `/projects/${activeProjectId}/roadmap`
    : "#",
  phase: 12,
  disabled: !activeProjectId,
  // No roles — visible to all (D-03)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate pages per dashboard | Tabbed sub-views in single route | Phase 12 decision | Reduces sidebar bloat, groups related views |
| Stored progress percentages | Computed progress on read | PRD design | Always accurate, no stale data |
| Scheduled AI synthesis jobs | On-demand server action | D-18 decision | Simpler, no Inngest job overhead |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Milestone progress blocking question penalty uses 25% cap and 5-point-per-question weighting | Code Examples | Progress percentages would be inaccurate — easily adjustable formula |
| A2 | Phase status cycle order is NOT_STARTED -> IN_PROGRESS -> COMPLETE -> SKIPPED -> NOT_STARTED | Code Examples | Users may expect different cycle order — low risk, configurable |
| A3 | Story "execution order" is derived from sortOrder + dependencies text + QuestionBlocksStory | Architecture | If execution order comes from a different source, Execution Plan tab ordering would be wrong |
| A4 | EpicPhase records may not exist for all epics/phases (need upsert pattern) | Pitfalls | If records are auto-created elsewhere, upsert is still safe (idempotent) |

## Open Questions

1. **Milestone progress formula weighting**
   - What we know: PRD says "computed from completion state of stories and resolution state of blocking questions"
   - What's unclear: Exact weighting between story completion and blocking question resolution
   - Recommendation: Start with simple formula (story% minus blocking penalty), let user adjust if needed

2. **Execution order derivation**
   - What we know: PRD says "stories in execution order" and D-12 specifies the display. Story has `sortOrder` and `dependencies` (free text) fields.
   - What's unclear: Whether execution order is purely `sortOrder` or also considers dependency chains
   - Recommendation: Use `sortOrder` as primary sort within phase groups, surface `dependencies` text and QuestionBlocksStory blocking as indicators (per D-14)

3. **Phase grouping within Execution Plan (D-13)**
   - What we know: Stories should be grouped by "which project phase they belong to" within each epic
   - What's unclear: How to determine which project phase a story belongs to — EpicPhase model tracks epic-level phases, not story-level
   - Recommendation: Group stories by the EpicPhase status context (Discovery stories = those created during DISCOVERY phase) or by a heuristic based on story status (DRAFT/READY = Discovery, SPRINT_PLANNED/IN_PROGRESS = Build, etc.)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/actions/milestones.test.ts --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-15 | Milestone progress computation | unit | `npx vitest run tests/lib/milestone-progress.test.ts -x` | Wave 0 |
| D-CRUD | Milestone create/update/delete server actions | unit | `npx vitest run tests/actions/milestones.test.ts -x` | Wave 0 |
| D-09 | Epic phase status upsert | unit | `npx vitest run tests/actions/epic-phases.test.ts -x` | Wave 0 |
| D-06 | Story linking to milestones | unit | `npx vitest run tests/actions/milestones.test.ts -x` | Wave 0 |
| D-18 | AI milestone synthesis | unit | `npx vitest run tests/lib/milestone-synthesis.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/actions/milestones.test.ts tests/actions/epic-phases.test.ts --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/actions/milestones.test.ts` -- covers milestone CRUD actions
- [ ] `tests/actions/epic-phases.test.ts` -- covers epic phase status update
- [ ] `tests/lib/milestone-progress.test.ts` -- covers progress computation logic
- [ ] `tests/lib/milestone-synthesis.test.ts` -- covers AI task definition

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Clerk auth via getCurrentMember() on every server action and page |
| V3 Session Management | yes | Clerk session handling (existing) |
| V4 Access Control | yes | Project scoping via scopedPrisma + getCurrentMember. All roles can access (D-03). EpicPhase queries must verify epic belongs to project. |
| V5 Input Validation | yes | Zod schemas on all server actions via next-safe-action |
| V6 Cryptography | no | No sensitive data in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-project data access via milestone ID | Tampering | scopedPrisma for Milestone queries; epic ownership check for EpicPhase |
| AI injection via milestone description | Information Disclosure | HTML tag stripping in AiSummaryCard (established T-02-28 pattern) |
| Unauthorized milestone deletion | Elevation of Privilege | getCurrentMember() auth check in delete action |

## Sources

### Primary (HIGH confidence)
- Prisma schema (`prisma/schema.prisma`) — Milestone, EpicPhase, MilestoneStory models, enums verified
- Codebase inspection — sidebar.tsx NavItem pattern, work page.tsx server/client split, AiSummaryCard component, safe-action pattern, agent harness engine, dashboard synthesis task, project-scope utility
- CONTEXT.md (12-CONTEXT.md) — All 19 locked decisions

### Secondary (MEDIUM confidence)
- PRD v2.1 Sections 17.2, 17.4, 5.2.1 — Feature specifications and entity definitions

### Tertiary (LOW confidence)
- None — all claims verified against codebase or PRD

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all patterns established in prior phases
- Architecture: HIGH — follows exact patterns from work page, dashboard, story detail
- Pitfalls: HIGH — identified from direct schema inspection and codebase patterns
- AI synthesis: HIGH — reuses established agent harness pattern

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable — internal project, no external dependency changes)
