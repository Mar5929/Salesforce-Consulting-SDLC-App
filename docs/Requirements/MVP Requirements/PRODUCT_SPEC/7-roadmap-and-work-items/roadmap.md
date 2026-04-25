# §7.6 Roadmap Sub-Section

> **Parent:** `PRODUCT_SPEC.md` §7.
> **Status:** In Progress (2026-04-17). This draft captures decisions from the §7 review session. Open items at the bottom flag what still needs review.

The Roadmap sub-section owns the approved phase structure of the project. It is more than a view on work items: it has its own workflow covering AI proposals, SA review and approval, and versioning.

Related behavior elsewhere:

- **§4.4** defines the overall roadmap proposal and re-proposal behavior (initial proposal, SA approval, impact on in-flight work, versioning).
- **§5.6** defines the discovery-side triggers that produce an AI re-proposal (manual trigger by the SA, AI-surfaced trigger when material new context lands).
- **§7.6 (this file)** specifies what the user sees and does in the Roadmap sub-section.

## What the sub-section shows

- **Header.** Project name, current lifecycle stage (from §4.3), and the roadmap's current version number with approval metadata.
- **AI re-proposal notice** when a re-proposal is pending review. One-line summary of what is changing, a Review action, a Dismiss action.
- **Current approved roadmap.** Each phase is represented with name, ordering, short descriptor of epics inside, and approximate duration.
- **Version history.** Every approved version with approver, approval date, and a short diff description. Opening a prior version shows it read-only.
- **Actions on the current roadmap.** "Trigger manual re-proposal" and "Edit phases directly."

## AI re-proposal review

When the AI proposes an updated roadmap, the re-proposal notice is the user's entry point. Invoking Review opens the diff view.

### Diff view

The diff shows the current roadmap and the proposed roadmap together. Changes are grouped by change type:

- Added phases
- Removed phases
- Re-parented epics (moved from one phase to another)
- Reordered phases
- Description or name changes

Each change is individually expandable. The SA can inspect the evidence the AI cites for each change (links to discovery content, questions, decisions).

### Apply modes

The SA chooses one apply mode for the entire review:

- **Adopt wholesale.** Replace the current roadmap with the proposal verbatim.
- **Merge.** Combine both. The application proposes a merged roadmap and the SA confirms.
- **Selective apply.** Check or uncheck individual changes. Only checked changes are applied.

### Impact on in-flight work

Before approval, an impact panel shows any in-flight work items (status: In Progress, In Review, QA) affected by the pending changes. For each, the SA sees:

- Current assignee and status.
- The proposed change (e.g., "Re-parent from Phase 3 to Phase 2").
- Options: confirm the change, override (leave the work item in its current position), or flag for later decision.

In-flight work is never re-parented silently.

Approval writes a new roadmap version. The prior version is retained for audit and comparison (§4.4).

## Manual re-proposal

A "Trigger manual re-proposal" action lets the SA (or PM) ask the AI to re-propose at any time, independent of the automatic triggers in §5.6. Useful after a major client workshop, a scope decision, or a rescue-type reassessment.

## Direct phase editing

An "Edit phases directly" action lets the SA adjust the current roadmap without involving the AI:

- Rename a phase
- Reorder phases
- Add an empty phase
- Remove an empty phase (removing a phase with epics requires re-parenting those epics first)
- Edit phase description or approximate duration

Direct edits also produce a new version with the SA recorded as the approver.

## Who sees what

| Role | Sees notice? | Can Review? | Can Approve? | Can Trigger manual? | Can Edit directly? |
|---|---|---|---|---|---|
| Solution Architect | Yes | Yes | Yes | Yes | Yes |
| Project Manager | Yes | Yes | No (sees read-only) | Yes | No |
| BA, QA, Developer | Yes (read-only) | No | No | No | No |
| Firm Administrator | Yes | Yes (read-only) | No | No | No |

All roles are subject to the final outcome; visibility of the notice keeps the team aware of pending scope changes.

## Open items

- **Diff grouping strategy.** By change type (adds, removes, re-parents, description changes) vs. some other organization. Functional question about how the SA should be shown the diff to best support review.
- **Evidence annotations.** What exactly does the AI attach to each proposed change as evidence? Discovery question IDs, transcript excerpts, decision links?
- **Who sees the notice.** Proposed: all team roles see it as read-only, SA and PM can act on it. Alternative: SA only, with a separate Slack or email ping to the team on approval.
- **Concurrent re-proposals.** What happens if a second AI re-proposal fires while a prior one is still under review? Options: queue, replace, flag collision.
- **Dismissal semantics.** "Dismiss" on the notice: does it hide this specific re-proposal forever, or until the next triggering event? Proposed: hides this specific one until a new re-proposal fires.
