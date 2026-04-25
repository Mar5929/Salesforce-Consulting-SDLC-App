# §7.7 Sprints Sub-Section

> **Parent:** `PRODUCT_SPEC.md` §7.
> **Status:** In Progress (2026-04-17). This draft captures decisions from the §7 review session. Open items at the bottom flag what still needs review.

The Sprints sub-section is where sprint planning, active sprint execution, and sprint closing happen. AI sprint intelligence (§8) surfaces inline on this view.

## Views within Sprints

- **Active sprint view.** Surfaces sprint name, window, capacity, and burn status. Shows the backlog of Ready work items together with the committed sprint contents. AI intelligence callouts appear in context when relevant.
- **Sprint planning view.** Entered via "Plan next sprint." Similar shape to the Active sprint view, with the committed side replaced by the forming next sprint. Work items move from the backlog into the forming sprint by direct manipulation. Capacity against commitment updates live as items are added.
- **Sprint history.** List of closed sprints with committed vs. completed points, carryover items, and summary stats. Read-only.

## Sprint lifecycle

A sprint moves through three states:

- **Planning.** Being built. Not yet started.
- **Active.** In flight. At most one sprint per project is Active at any time. The Board lens on Work Items (§7.4) defaults to showing the Active sprint.
- **Closed.** Completed. Incomplete work items are rolled over or re-triaged on close (see "Closing a sprint" below).

## Sprint composition

- Work items enter a sprint only when they are in **Ready** state.
- Work items can be added mid-sprint when they reach Ready. Mid-sprint additions trigger an AI intelligence re-run (§8) that may surface new conflicts or resequencing recommendations.
- Work items can be removed from an active sprint. Removal returns the item to its prior state (Ready) and the activity log records who removed it and why.

## Capacity and commitment

- Each sprint has a **capacity** (in story points) and a **commitment** (sum of points of committed work items).
- Capacity is set at sprint start. It can be adjusted mid-sprint with an explicit action.
- Over-commitment is allowed but flagged prominently and called out in the AI intelligence callouts.
- Unassigned work items in a sprint count toward the commitment.

The capacity model itself (per-developer, team total, or by role) is an open item below.

## AI sprint intelligence

From §8, the following AI behaviors surface in the Sprints view as inline callouts:

- **Conflict detection.** Two work items in the sprint modifying the same Salesforce component (Apex class, Flow, object, etc.). The callout recommends sequencing or consolidating assignees.
- **Parallelization analysis.** Identifies work items that can be safely worked in parallel.
- **Execution mapping.** Dependency-based sequencing. "Do A before B because A creates the object B adds fields to."
- **Capacity assessment.** Over-commitment, under-commitment, or role-imbalance warnings ("all dev work on Jane, no QA capacity for the review queue").

Callouts are not blocking. The SA or PM decides whether to act on them.

## Closing a sprint

When the SA or PM triggers "Close Sprint N," the application prompts for each incomplete work item with a three-choice picker:

- **Roll over** to the next planned sprint.
- **Return to backlog** (Ready, not in any sprint).
- **Mark as blocked** and re-triage later.

The closing flow also produces a short summary: committed points, completed points, carryover count, cycle time per work item. Summary is retained in sprint history.

## Sprint history

All closed sprints are retained indefinitely. Sprint history can be used for:

- Velocity calculations (trailing N sprints).
- Client-facing status reports pulling committed vs. completed data.
- Retrospective discussions.

## Open items

- **Capacity model.** Per-developer (sum of individual capacities), team total, or by role (dev capacity, QA capacity, BA capacity separately)? Affects how unassigned work items count.
- **AI-proposed sprint composition.** Does the AI propose what the next sprint should contain, or is planning always manual (with AI only evaluating what the human planned)?
- **Non-story work items in sprints.** Can bugs and spikes sit in a sprint alongside user stories? Proposed: yes, with the same Ready gate. Depends on the work item subtype decision.
- **Admin task sprint eligibility.** Proposed: no, per §7.3 Admin Tasks.
- **Sprint cadence defaults.** 1 week, 2 weeks, 3 weeks. Per-project or per-firm default.
- **Sprint naming.** Auto-numbered (Sprint 14) vs. named (Sprint: Q2 Lead Management). Proposed: auto-numbered with an optional display name.
- **Burn metrics.** Burndown, burnup, velocity. Which ones appear on this view vs. live in §12 Dashboards.
