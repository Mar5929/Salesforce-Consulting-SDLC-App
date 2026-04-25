# §7.2 Work Hierarchy

> **Parent:** `PRODUCT_SPEC.md` §7.
> **Status:** In Progress (2026-04-17). This draft captures decisions from the §7 review session. Open items at the bottom flag what still needs review.

Delivery scope in a project is organized in up to four nesting levels.

## The four levels

| Level | Description | Multiplicity | Optional? |
|---|---|---|---|
| Phase | A block of scope delivered together. Has a name, description, ordering, and an approximate duration. Comes from the AI-proposed roadmap the SA approves. | A project has 1..N phases. | No. |
| Epic | A larger chunk of work within a phase. Has a name, description, owner, readiness indicator. | A phase has 0..N epics. | Required within a phase. |
| Feature | An intermediate grouping of related work items inside a large epic. | An epic has 0..N features. | **Yes, optional.** |
| Work Item | The leaf-level assignable unit. Includes user stories and other subtypes (TBD). | A feature or epic has 0..N work items. | No (leaf). |

## Parentage rules

- Every epic belongs to exactly one phase.
- Every feature belongs to exactly one epic.
- A work item parents either to a feature (if one is used in its area) or directly to an epic (if no feature is used for its cluster).
- A work item cannot parent directly to a phase. Scope too small for a formal epic is still an epic.
- **Admin Tasks are not part of this hierarchy** (§7.3). They parent to the project.

## Features: optional, not mandatory

An epic with a small set of work items stays flat: Epic → Work Item. An epic large enough that its work items cluster into sub-themes can introduce Features. Features group related work items; they do not have their own assignees or lifecycle states.

Adding a Feature under an existing epic is a non-breaking structural change: existing work items can be moved into the new feature or left directly under the epic. Removing a Feature moves its work items back under the parent epic.

## Re-parenting across phases

A work item can be re-parented across epics (and therefore across phases) only through one of two flows:

- **Manual re-parent** by the SA, PM, or the work item's owner. The activity log records the move.
- **Roadmap re-proposal apply** (§4.4, §7.6). When the SA applies a re-proposal, impacted work items surface in an impact panel; the SA confirms or overrides each re-parent before approval.

In-flight work items (status: In Progress, In Review, QA) are never re-parented silently.

## ID scheme (working proposal)

The ID scheme mirrors the question ID scheme in §6.3 so a question's scope and a work item's location read naturally together.

| Entity | Format | Example |
|---|---|---|
| Phase | `P{n}` | `P2` |
| Epic | `{epic-prefix}` (2-4 letters, unique within the project) | `LM` for Lead Management |
| Feature | `{epic-prefix}-{feature-prefix}` (feature-prefix unique within the epic) | `LM-LC` for Lead Capture feature inside LM |
| Work Item | `WI-{epic-prefix}-{feature-prefix}-{number}` or `WI-{epic-prefix}-{number}` when no feature is used | `WI-LM-LC-01`, `WI-LM-LA-03` |

Numbering is zero-padded and does not reset across features. Epic and feature prefix uniqueness is validated on create and edit.

If a work item is re-parented, its ID is retained for traceability. The ID does not change with the scope.

## Example

Example project (greenfield Sales Cloud build):

- Phase 1: Lead Management
  - Epic: Lead Capture (`LM-LC`)
    - `WI-LM-LC-01` Capture leads from web form
    - `WI-LM-LC-02` Import leads from CSV
  - Epic: Lead Assignment (`LM-LA`)
    - `WI-LM-LA-01` Round-robin assignment rules
    - `WI-LM-LA-02` Manager override
    - `WI-LM-LA-03` Notify assignee on lead claim
- Phase 2: Opportunity Workflow (epics omitted for brevity)
- Phase 3: Quoting
- Phase 4: Reporting

## Open items

- **Work item subtypes.** User story only, or story + bug + spike (or more)? Affects mandatory fields, lifecycle states, and whether the ID scheme needs a type segment.
- **Direct work-item-under-phase.** Can a work item live directly under a Phase with no Epic, for very small scope? Current position: no, use a minimal epic.
- **Cross-phase dependencies.** Where blocks / blocked-by relationships live, and how they surface on the Timeline view.
- **Feature-prefix length.** 2-4 letters proposed; may need adjustment as real epics are created.
