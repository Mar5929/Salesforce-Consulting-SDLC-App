# §7.4 Work Item Views

> **Parent:** `PRODUCT_SPEC.md` §7.
> **Status:** In Progress (2026-04-17). This draft captures decisions from the §7 review session. Open items at the bottom flag what still needs review.

Work Items are the largest dataset inside a project. The Work Items sub-section offers three lenses on that data, a shared detail drawer, and a readiness model that applies to all lenses.

## Three lenses, one toggle

A lens toggle switches the Work Items sub-section between Tree, Board, and Timeline. All three read from the same underlying data. Filters and search state persist across lenses.

### Tree

Structural lens. Phases are the outer level, epics nested inside, optional features, work items at the leaves.

- Collapsible at every level. Expanding a phase, epic, or feature shows its children.
- Each phase and epic shows its readiness indicator (§7.5 Readiness).
- Work items show ID, title, assignee, and status.
- Defaults to Phases collapsed, Epics collapsed.
- Primary audience: PMs and SAs during planning, BAs while drafting stories.

### Board

Status-based lens, organized by lifecycle state. Columns are:

- Draft
- Ready
- Sprint Planned
- In Progress
- In Review
- QA
- Done

Each work item shows its ID, title, assignee, story points (if set), and its current status. Work items can be moved between columns by direct manipulation, subject to validation rules (for example, moving from Draft to Ready requires the work item's required fields to be populated).

- Default scope: active sprint.
- Filters let the user remove the sprint filter or scope by assignee, phase, or epic.
- Primary audience: Developers and QA during sprint execution.

### Timeline

Temporal lens, organized by time.

- One row per phase, arranged in roadmap order.
- Work at the epic level by default; a "Show work items" drill-down expands each epic to show its individual work items.
- Cross-phase dependencies are represented between related items (depends on resolution of the blocks/blocked-by open item).
- Milestones appear on a separate milestone row.
- A "today" indicator identifies the current date on the timeline.
- Zoom levels: weeks, months, quarters.
- Primary audience: PMs and SAs for schedule view, client-facing status generation.

## Filters

Filters are available on every lens. Currently specified:

- Phase
- Epic
- Assignee
- Sprint (Board default: active)
- Status (Board default: all states shown)

Filter state persists when the user switches lenses. Saved filter sets per user are a planned enhancement but scoped post-MVP.

## Search

A quick-search is invoked with the `/` keyboard shortcut. It matches against work item IDs, titles, assignee names, and phase/epic names. Pressing Enter opens the first hit in the detail drawer. Search is global within the current project.

## Detail drawer

Clicking any work item, in any lens, opens a side-panel drawer. The drawer keeps the current lens visible behind it and holds the work item's full detail:

- Title, description
- Type (user story, bug, etc.), status
- Assignee, reporter
- Parent epic (and feature, if any)
- Story points, priority
- Acceptance criteria
- Linked discovery questions (with inline Answer action, per §6)
- Linked Salesforce components (impacted; per §15)
- Linked test cases
- Activity log
- Comments thread

Quick edits (reassign, change status, answer a linked question, add a comment) happen in the drawer without leaving the lens. A dedicated full-page view exists for deep editing sessions (long-form description rewrites, test case authoring, extensive comment history), reached via an "Open full page" action in the drawer.

The drawer closes on click-outside, `Esc`, or an explicit close action.

## Readiness

Every epic (and phase, as a rollup) exposes a readiness indicator. The indicator is a composite of three sub-scores:

1. **Open discovery questions** linked to the epic that are still unanswered.
2. **Work item field gaps**: work items under the epic missing required fields for their type (user stories without acceptance criteria, without story points, without test cases, etc.).
3. **AI flags** on the epic: contradictions with prior decisions, conflicts with existing components, and any other AI-surfaced issues.

Clicking the indicator opens the **readiness drawer**, which breaks out which sub-score is dragging the score down. Each item in the breakdown is actionable:

- For open questions: **Answer** opens the question in the question drawer (§6).
- For field gaps: **Open** opens the work item in the work item drawer.
- For AI flags: **Resolve** opens the flag for SA review.

The exact formula for combining the three sub-scores into a single percentage is a tuning parameter, not a product-level commitment. At launch a simple weighted average is sufficient; weights can be adjusted based on observed behavior.

## Open items

- **Saved filter sets per user.** Post-MVP candidate.
- **Bulk operations.** Select-multiple with checkboxes, then reassign, move to next sprint, or change status for a batch. Needed for realistic sprint planning.
- **Keyboard shortcuts.** `j/k` to move through items, `Enter` to open, `e` to edit.
- **Timeline default granularity.** Epics (proposed) or work items.
- **Readiness weighting formula.** Weights of the three sub-scores.
- **Conflict between filter state and drill-down.** If a filter hides an epic and the user opens a work item under it in the drawer, does closing the drawer return them to the filtered lens?
