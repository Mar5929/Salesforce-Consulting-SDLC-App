# Phase 12: Roadmap and Execution View — Milestones, Epic Phase Grid, and Project Execution Order - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Roadmap dashboard and Execution Plan view as specified in PRD Sections 17.2 and 17.4. This includes: milestone CRUD with progress tracking, the Epic Phase Grid (epic × phase status matrix), per-epic story execution ordering with dependency visualization, and AI-synthesized upcoming milestone summaries. All views are visible to all roles.

**Not in scope:** Sprint dashboard (PRD 17.3 — already built in Phase 3), PM dashboard (PRD 17.5 — already built in Phase 5), health score (PRD 17.6 — already built in Phase 2).

</domain>

<decisions>
## Implementation Decisions

### Navigation & Routing
- **D-01:** Single "Roadmap" sidebar item added to the sidebar navigation, pointing to `/projects/[projectId]/roadmap`. This avoids sidebar bloat and groups related views together.
- **D-02:** Roadmap page uses tabbed sub-views: **Milestones** (default tab), **Epic Phases** (the grid), and **Execution Plan** (per-epic story ordering). Follows the existing tab pattern used in stories and questions views.
- **D-03:** Sidebar item visible to all roles (no role restriction). Phase gating via `phase: 12` in the nav item config.

### Milestone Management UX
- **D-04:** Milestones tab shows a table view listing all milestones with columns: name, target date (or "TBD"), status badge, progress bar, story count, and actions (edit, delete). Sorted by `sortOrder`.
- **D-05:** "New Milestone" button opens a Sheet slide-over for create/edit — consistent with the Story form pattern (Phase 3 decision). Fields: name, description (including "what must happen" criteria), target date (optional), status, sort order.
- **D-06:** Story linking via a dedicated "Link Stories" action on each milestone row. Opens a multi-select dialog showing unlinked stories grouped by epic. Uses MilestoneStory join table.
- **D-07:** Milestone deletion requires confirmation dialog. Deletes MilestoneStory links but not the stories themselves (cascade on MilestoneStory FK).

### Epic Phase Grid Visualization
- **D-08:** Epic Phase Grid rendered as an HTML table/matrix. Rows = epics (sorted by creation order or sort field). Columns = the 5 EpicPhaseType values: Discovery, Design, Build, Test, Deploy.
- **D-09:** Each cell shows a status chip (color-coded badge) for the EpicPhaseStatus: NOT_STARTED (gray), IN_PROGRESS (blue), COMPLETE (green), SKIPPED (striped/muted). Click a cell to cycle through statuses — inline editing without opening a form.
- **D-10:** Column headers show aggregate counts (e.g., "3/5 complete"). Row shows epic name with link to epic detail page.

### Execution Plan Display
- **D-11:** Execution Plan tab shows collapsible per-epic sections. Each section header shows epic name, story count, and completion percentage.
- **D-12:** Within each epic section, stories listed in execution order showing: story number/display ID, title, owner(s), status badge, and dependency indicators. Stories in Blocked status highlighted with reason.
- **D-13:** Phase grouping within each epic — stories grouped by which project phase they belong to (Discovery, Design, Build stories). Collapsible sub-groups within the epic accordion.
- **D-14:** Dependency visualization as simple inline indicators — "Blocked by: STORY-123" text links rather than graphical dependency lines. Keeps implementation straightforward for V1. Full dependency graph visualization deferred.

### Progress Computation
- **D-15:** Milestone progress computed server-side from: (completed stories / total linked stories) weighted with blocking question resolution. Formula per PRD: "completion state of stories linked via MilestoneStory and the resolution state of blocking questions."
- **D-16:** Progress displayed as a horizontal progress bar with percentage label. Color-coded: green (>75%), yellow (25-75%), red (<25%). Matches the Linear/Vercel minimal aesthetic.

### AI Milestone Synthesis
- **D-17:** "Upcoming milestones" section on the Milestones tab shows the next 2-3 milestones (by target date or sort order) with AI-synthesized "what must happen" summaries.
- **D-18:** AI synthesis generated on-demand via server action when the Roadmap page loads (or on explicit refresh). Reuses the AiSummaryCard component pattern from the discovery dashboard. Not a scheduled Inngest job — on-demand is simpler for V1.
- **D-19:** AI context for synthesis: milestone description, linked stories with statuses, blocking questions linked to those stories. Claude generates a concise "what must happen" and "what's currently blocking" summary.

### Claude's Discretion
- Table row density and spacing in milestone table
- Epic Phase Grid responsive behavior on smaller screens
- Execution Plan accordion expand/collapse behavior (expand all vs one-at-a-time)
- Empty states for each tab (no milestones, no epic phases configured, no stories)
- Loading skeletons for each view
- Sort controls and any filtering within tabs
- AI synthesis card layout and refresh UX
- Whether to show a mini epic phase grid inline on the Milestones tab or keep it separate

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product requirements
- `archive/SF-Consulting-AI-Framework-PRD-v2.1.md` — Section 17.2 (Roadmap Dashboard: milestones table, Epic Phase Grid, upcoming milestones), Section 17.4 (Execution Plan View: per-epic story list, phase grouping, dependency visualization), Section 5.2.1 (EpicPhase entity definition, Milestone entity definition, MilestoneStory join)

### Technical architecture
- `SESSION-3-TECHNICAL-SPEC.md` — Database schema for Milestone, EpicPhase, MilestoneStory. Context assembly architecture for AI synthesis.

### Schema
- `prisma/schema.prisma` — Milestone model (id, projectId, name, description, targetDate, status, sortOrder), MilestoneStory join (milestoneId, storyId), EpicPhase model (epicId, phase: EpicPhaseType, status: EpicPhaseStatus, sortOrder). Enums: MilestoneStatus (NOT_STARTED, IN_PROGRESS, COMPLETE), EpicPhaseType (DISCOVERY, DESIGN, BUILD, TEST, DEPLOY), EpicPhaseStatus (NOT_STARTED, IN_PROGRESS, COMPLETE, SKIPPED).

### Existing UI patterns to follow
- `src/components/layout/sidebar.tsx` — Sidebar navigation with NavItem config, phase gating, role filtering, badge support
- `src/app/(dashboard)/projects/[projectId]/work/page.tsx` — Server component page pattern with scopedPrisma
- `src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx` — Discovery dashboard with AiSummaryCard, server data loading
- `src/components/dashboard/ai-summary-card.tsx` — Reusable AI summary card component for milestone synthesis
- `src/components/shared/empty-state.tsx` — Empty state component pattern

### Data access patterns
- `src/lib/project-scope.ts` — scopedPrisma() for project-scoped queries (Milestone already in scoped entities list)
- `src/lib/auth.ts` — getCurrentMember() for auth checks
- `src/lib/safe-action.ts` — next-safe-action pattern for server actions with auth middleware

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/dashboard/ai-summary-card.tsx` — AiSummaryCard for AI-synthesized milestone summaries
- `src/components/shared/empty-state.tsx` — EmptyState component for tabs with no data
- `src/components/ui/` — Full shadcn/ui component library (Card, Table, Badge, Sheet, Dialog, Tabs, Progress, etc.)
- `src/lib/project-scope.ts` — scopedPrisma with Milestone already in the scoped entities list
- `src/actions/conversations.ts` — Server action patterns to follow for milestone/epic-phase CRUD

### Established Patterns
- Server component page.tsx fetches data, client component handles interactivity (Phase 4, 5 pattern)
- Sheet slide-over for create/edit forms (Phase 3 story form pattern)
- Tab-based views with URL state via nuqs (Phase 3 work hierarchy pattern)
- Table views with inline actions (work page, questions page, sprints page)
- Badge/chip status indicators throughout the app
- `next-safe-action` with Zod validation for all mutations

### Integration Points
- `src/components/layout/sidebar.tsx` — Add "Roadmap" NavItem entry
- `src/app/(dashboard)/projects/[projectId]/` — New `roadmap/` route directory
- `src/actions/` — New milestone and epic-phase server actions
- `src/lib/agent-harness/context/` — Context loader for milestone synthesis (if needed beyond inline query)

</code_context>

<specifics>
## Specific Ideas

- PRD Section 17.2 explicitly defines the Epic Phase Grid as "A matrix showing each epic as a row and project phases as columns" — this is a defined UI pattern, not open to interpretation
- Milestone progress is computed, not stored — per PRD: "Progress is computed by the AI from the completion state of linked stories and the resolution state of blocking questions — not stored as a static percentage"
- The "what must happen" milestone description can be AI-generated — PRD says "The 'what must happen' description can be AI-generated from the milestone's linked stories and blocking questions"
- Execution Plan view per PRD: "Stories within each epic displayed in execution order" — execution order comes from story dependencies and the StoryComponent join table

</specifics>

<deferred>
## Deferred Ideas

- **Full dependency graph visualization** — Graphical dependency lines/arrows between stories. V1 uses simple text-based "Blocked by" indicators. Visual graph could be a future enhancement.
- **Drag-and-drop story reordering** — Manual execution order override via drag-and-drop. V1 uses dependency-derived order.
- **Milestone timeline/Gantt view** — Visual timeline showing milestone dates and durations. V1 uses table view.
- **Epic Phase Grid bulk operations** — Bulk status updates across multiple epics/phases. V1 uses click-to-cycle per cell.

</deferred>

---

*Phase: 12-roadmap-and-execution-view-milestones-epic-phase-grid-and-pr*
*Context gathered: 2026-04-08*
