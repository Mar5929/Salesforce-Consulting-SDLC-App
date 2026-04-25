# §7.1 Work Tab Structure

> **Parent:** `PRODUCT_SPEC.md` §7.
> **Status:** In Progress (2026-04-17). This draft captures decisions from the §7 review session. Open items at the bottom flag what still needs review.

The Work tab is one of the top-level tabs inside a project. It holds five sub-sections that together cover the full delivery experience: day-to-day status, ad-hoc project to-dos, the phase roadmap, the hierarchical scope, and sprints.

## Sub-navigation

The Work tab sub-nav, in order:

1. **Home**
2. **Admin Tasks**
3. **Roadmap**
4. **Work Items**
5. **Sprints**

## Home

Home is a dashboard for "what is happening on this project right now." It surfaces:

- **Lifecycle stage indicator.** Shows where the project sits in the lifecycle stages (§4.3): Init, Discovery, Design, Build, Testing, Deploy, Hypercare. The current stage is identified as active.
- **AI roadmap re-proposal notice.** When the AI has proposed an updated roadmap (§4.4) and the SA has not yet reviewed it, a prominent notice appears with a Review action that opens the diff in the Roadmap sub-section.
- **Admin tasks due this week.** List of upcoming admin tasks with due date and owner. Overdue items are identified. Links out to the Admin Tasks sub-section.
- **Scope summary.** Counts of phases, epics, work items, and work items blocked by open questions.
- **Recent activity.** Timeline of recent events: answered questions, new work items, AI flags, admin task updates. Scoped to the last 48 hours by default.
- **Role-adaptive widgets.** Home's widget mix adapts to the viewer's role. PMs see blockers and slippage; BAs see stories that need writing; Developers see their assigned queue; SAs see epic readiness and AI proposals. A "Viewing as" control lets any user switch to another role's Home on demand.

## Navigation model

- Clicking a work item from any lens opens a **side-panel detail drawer** (§7.4). The drawer keeps the current view visible behind it so the user does not lose their place.
- Navigating into a phase, epic, or work item page is a **full-page navigation**, reserved for deep edits or extended context.
- The Work tab sub-nav remains available across sub-sections so the user can jump between Roadmap, Work Items, and Sprints without backing out.

## Open items

- Per-role widget catalog for the adaptive Home. Each of the six personas needs a default widget set.
- Whether Home includes a dedicated "Blockers" widget or rolls blockers into the scope summary.
- Whether the re-proposal notice appears only in Home and Roadmap, or across all Work tab sub-sections until dismissed.
- Where a pending AI-proposed change to a single epic (not the whole roadmap) surfaces.
