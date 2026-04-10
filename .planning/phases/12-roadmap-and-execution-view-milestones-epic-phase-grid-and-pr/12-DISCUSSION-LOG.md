# Phase 12: Roadmap and Execution View — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 12-roadmap-and-execution-view-milestones-epic-phase-grid-and-pr
**Areas discussed:** Navigation & Routing, Milestone Management UX, Epic Phase Grid Visualization, Execution Plan Display, Progress Computation, AI Milestone Synthesis
**Mode:** --auto (all decisions auto-selected with recommended defaults)

---

## Navigation & Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Single "Roadmap" sidebar item with tabs | One nav item, tabbed sub-views (Milestones, Epic Phases, Execution Plan) | ✓ |
| Separate sidebar items | Individual "Milestones", "Epic Phases", "Execution" items | |
| Nested under existing Dashboard | Sub-tabs within the discovery dashboard | |

**User's choice:** [auto] Single "Roadmap" sidebar item with tabs (recommended — consistent with existing tab patterns, avoids sidebar bloat)
**Notes:** All roles can access. Phase-gated via `phase: 12` in sidebar config.

---

## Milestone Management UX

| Option | Description | Selected |
|--------|-------------|----------|
| Table + Sheet slide-over | Table view with Sheet for create/edit, dialog for story linking | ✓ |
| Card-based layout | Milestone cards in a grid with modal editing | |
| Inline table editing | Edit directly in table cells | |

**User's choice:** [auto] Table + Sheet slide-over (recommended — matches story form and sprint management patterns)
**Notes:** Multi-select dialog for story linking via MilestoneStory join. Confirmation dialog for deletion.

---

## Epic Phase Grid Visualization

| Option | Description | Selected |
|--------|-------------|----------|
| HTML table matrix with click-to-cycle | Epics as rows, phases as columns, status chips with click cycling | ✓ |
| Kanban-style columns | Phase columns with epic cards | |
| Compact badge grid | Minimal dot/circle indicators | |

**User's choice:** [auto] HTML table matrix with click-to-cycle (recommended — direct match to PRD 17.2 spec "A matrix showing each epic as a row and project phases as columns")
**Notes:** Status chips color-coded: gray (NOT_STARTED), blue (IN_PROGRESS), green (COMPLETE), muted (SKIPPED).

---

## Execution Plan Display

| Option | Description | Selected |
|--------|-------------|----------|
| Collapsible per-epic sections with dependency text | Accordion layout, stories in order, "Blocked by" text links | ✓ |
| Flat table with epic grouping | Single table with epic group headers | |
| Tree view with graphical lines | Hierarchical tree with SVG dependency arrows | |

**User's choice:** [auto] Collapsible per-epic sections with dependency text (recommended — straightforward for V1, graphical dependencies deferred)
**Notes:** Stories grouped by phase within each epic. Blocked stories highlighted.

---

## Progress Computation

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side computed from stories + questions | PRD formula: story completion + blocking question resolution | ✓ |
| Simple story count ratio | completed / total linked stories only | |
| Story points weighted | Weight by story points if available | |

**User's choice:** [auto] Server-side computed from stories + questions (recommended — matches PRD specification exactly)
**Notes:** Progress bar color-coded: green (>75%), yellow (25-75%), red (<25%).

---

## AI Milestone Synthesis

| Option | Description | Selected |
|--------|-------------|----------|
| On-demand via server action | Generate on page load/refresh, reuse AiSummaryCard | ✓ |
| Scheduled Inngest job | Pre-compute periodically like discovery dashboard | |
| Cached with manual refresh | Generate once, cache, button to regenerate | |

**User's choice:** [auto] On-demand via server action (recommended — simpler for V1, avoids background job overhead for a read-heavy view)
**Notes:** Shows next 2-3 milestones with "what must happen" and "what's blocking" summaries.

---

## Claude's Discretion

- Table density, responsive behavior, accordion mechanics, empty states, loading skeletons, sort/filter controls, AI card layout

## Deferred Ideas

- Full graphical dependency visualization
- Drag-and-drop story reordering
- Milestone timeline/Gantt view
- Epic Phase Grid bulk operations
