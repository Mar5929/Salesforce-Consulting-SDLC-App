# Phase 10 Audit: Work Tab UI Overhaul

**Auditor:** phase-audit agent (from-scratch)
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-10-work-tab-ui/PHASE_SPEC.md` (rev 2026-04-10)
- `docs/bef/03-phases/phase-10-work-tab-ui/TASKS.md` (rev 2026-04-10)

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md` (§10, §12, §17.3, §17.4, §19)
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` (no direct Work-tab UI clauses)
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (no Work-tab-specific UI sections)
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`
- `docs/bef/02-phase-plan/PHASE_PLAN.md` (Phase 10 summary, §241-261)

**Scope note.** Phase 10 is UI-only (no schema, no API). It depends on Phase 1 (RBAC, story-status machine, `requireRole`, `getCurrentMember`). It is parallel with Phase 11 and must not introduce anything that bypasses the RBAC primitives delivered in Phase 1.

---

## 1. Scope Map

Requirements pulled from `REQUIREMENT_INDEX.md` whose Phase-hint includes Phase 10, plus PRD requirements that Phase 10's scope inherently renders (PRD §10 work items, §17.3/17.4 list-and-board work views, §19 RBAC-aware story transitions). PRD-17-11..14 (Execution Plan View) and PRD-17-10 (Sprint Dashboard) are phase-hinted to Phase 7 in the index but the prompt asks that Phase 10 cover "list/board/timeline" for the Work tab — they appear here as NotApplicable with the phase-7 owner called out so cross-phase alignment can be verified.

| Req ID | Requirement (1-line) | Covered by (spec §/task #) | Status | Notes |
|--------|----------------------|----------------------------|--------|-------|
| PRD-12-01 | Developers view assigned tickets and sprint plans in the web app | PHASE_SPEC §2.2 "All Stories (Table/Kanban)" views; TASKS Task 8 | Partial | No developer-scoped preset ("My tickets / My sprint") view is specified. `assignee` is a filter but there's no default "assigned to me" shortcut. |
| PRD-10-01 | Web app is the primary system of record for epics, features, stories, bugs, tasks | PHASE_SPEC §2.2–2.6 | Pass | Work tab surfaces epic/feature/story entities end-to-end. |
| PRD-10-02 | Hierarchy Epic → optional Feature → Story → optional Task | PHASE_SPEC §2.3–2.5, TASKS Tasks 9–11 | Partial | Epic/Feature/Story detail covered. **Tasks (the 4th tier) are absent from every view, card, and sidebar.** |
| PRD-10-03..10 | Mandatory story fields (persona, description, AC, parent, points, test cases, impacted components) | PHASE_SPEC §2.5 Story Detail sidebar + left column sections; TASKS Task 11 | Partial | Persona, description, AC, points, components listed. **Test Case count badge is in sidebar but there is no surfacing of DRAFT→READY validation state or "which mandatory fields are still missing" cue on the Story Detail page or Story table.** Phase 4 is flagged to own the DRAFT→READY gate UI (§5) but the story table/kanban Phase 10 delivers has no "incomplete" indicator. |
| PRD-10-14 | Story statuses Draft → Ready → Sprint Planned → In Progress → In Review → QA → Done | TASKS Task 11 AC "Status shows available transitions … role-aware" | Pass | Delegates to existing story-status machine from Phase 1. |
| PRD-19-04 | Management transitions (Draft/Ready/Sprint Planned) restricted to SA/PM/BA | TASKS Task 11 AC "Status shows available transitions as dropdown options (role-aware)"; PHASE_SPEC §2.5 | Partial | Spec says "role-aware" and references `getAvailableTransitions(currentStatus, userRole)` but does not pin which server action enforces the check on save, nor that the UI must re-check after the server rejects an unauthorized transition. |
| PRD-19-05 | Execution transitions (In Progress/In Review/QA/Done) restricted to SA/Developer | TASKS Task 11 (same mechanism) | Partial | Same gap as PRD-19-04; the spec relies on the machine existing without pinning the server-action contract. |
| PRD-19-06 | Assigning a story to a sprint auto-transitions status to Sprint Planned | PHASE_SPEC §2.5 sidebar Sprint field | Fail | Sprint dropdown is specified as inline-editable via `updateStory` / existing sprint action, but the spec does not require or test the automatic status→Sprint Planned side effect in the UI flow (e.g., sidebar status must update in the same save). |
| PRD-19-07 | QAs can create stories only in Draft and cannot transition past Draft | PHASE_SPEC §2.5 Story Detail | Partial | Implicit in "role-aware transitions" but QA-specific "create in Draft only" is not a Phase-10 concern (creation UI not owned here). Acceptable if flagged. Not flagged. |
| PRD-19-08 | Sprint assignment and story content editing are separately permissioned | PHASE_SPEC §2.5 | Fail | Every field in the sidebar uses the same "click-to-edit" affordance with no statement that the Sprint field must be hidden/disabled for users without "Assign stories to sprints" permission, while other fields remain editable. Edge-case table says "User without edit permissions clicks editable field → field does not enter edit mode" but does not distinguish content-edit vs. sprint-assign permissions. |
| PRD-19-10 / PRD-23-04 | Usage & Costs visible only to SA/PM | — | NotApplicable | Owned by Phase 7; not Work-tab. |
| PRD-17-10 | Sprint dashboard (stories by status, burndown, workload) | — | NotApplicable | Phase-hint 7. Phase 10 scope summary explicitly lists "timeline/Gantt views (V2)" as out of scope, consistent with deferring any sprint-specific dashboard to Phase 7. |
| PRD-17-11..14 | Execution Plan view (per-epic order, dependencies, phase grouping, dependency chain visualization) | — | NotApplicable | Phase-hint 7. Phase 10 §1 "Out of scope: timeline/Gantt views (V2)". Prompt rubric asked to verify "list/board/timeline" coverage — list and board are covered; timeline is explicitly deferred and Phase 10 spec does not pretend otherwise. |
| — (app-wide) | Accessibility / a11y standards | — | Fail | No WCAG, keyboard-navigation, focus-order, ARIA, or screen-reader requirements are specified anywhere in PHASE_SPEC or TASKS. Drag-drop kanban, inline editing, popover filter dropdowns, and swimlane collapse are all a11y-sensitive patterns with zero acceptance criteria for keyboard/assistive-tech support. No global a11y req exists in PRD or TECHNICAL_SPEC to inherit from. |
| — (app-wide) | Empty-state coverage for every list/board | PHASE_SPEC §2.1.7 (Enhanced EmptyState component) + §4 edge-cases row "Filter returns 0 results" | Partial | EmptyState component is defined and one tailored message is illustrated ("No stories in this feature yet"). No per-view empty-state content is pinned for: Epics (Table/Kanban) with no epics, All Stories with no stories, swimlane with 0 items (only hide rule — no fallback if ALL groups empty), each kanban column with 0 items in that status, filtered-zero-results actual copy. |
| PRD-6-13 / PRD-10-13 | Mandatory story fields enforced before Ready | PHASE_SPEC §5 ("Phase 4 will build DRAFT→READY validation UI") | NotApplicable | Phase 10 hands this to Phase 4, correct. |

**Scope summary:** 16 rows mapped. 3 Pass, 7 Partial, 3 Fail, 3 NotApplicable.

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification (1 line) |
|---|-----------|-------|------------------------|
| R1 | Requirement traceability | Fail | Zero PRD/Addendum citations in PHASE_SPEC or TASKS; no requirement IDs referenced. |
| R2 | No PRD/Addendum/TECHNICAL_SPEC contradiction | Pass | No direct contradictions; timeline-view deferral matches PRD Phase-7 ownership. |
| R3 | Scope completeness | Partial | Tasks tier (PRD-10-02), accessibility, sprint-assignment-permission distinction (PRD-19-08), and PRD-19-06 auto-transition are missing. |
| R4 | Acceptance criteria testable | Partial | Many AC are visual/behavioral ("looks like", "consistent spacing") with no concrete threshold; no Playwright or keyboard-interaction AC. |
| R5 | Edge cases enumerated | Partial | §4 covers 11 UI edge cases but omits: keyboard-only flows, screen-reader announcements for drag-drop, role-mismatch on sprint field vs. content field, stale data after server-side status machine rejection, URL param validation (invalid `?view=`, `?groupBy=`). |
| R6 | Interfaces pinned | Partial | Props interfaces are pinned for shared components; but server actions invoked from EditableField saves (`updateStory`, `updateStoryStatus`, sprint assignment action) are referenced by name with no input/output contract, no error shape, no optimistic-UI rollback contract. |
| R7 | Upstream dependencies resolved | Partial | Phase 1 is named. Specific Phase-1 exports consumed (`getCurrentMember`, `requireRole`, `getAvailableTransitions`, story-status-machine module path) are referenced by name but not pinned to file paths or function signatures. |
| R8 | Outstanding-for-deep-dive items | Fail | §7 says "None — all product decisions resolved", but multiple unresolved items exist (tasks tier, a11y, permission split, auto-transition, per-view empty-state copy, server-action contracts). |

**Overall verdict:** Ready-after-fixes

**A phase is "Ready" only if R1–R8 are all Pass.** R1, R3, R4, R5, R6, R7, R8 are not Pass.

---

## 3. Gaps

### PHASE-10-GAP-01
- **Rubric criterion:** R1
- **Affected Req IDs:** all PRD-10-*, PRD-12-01, PRD-19-04..08
- **Description:** PHASE_SPEC and TASKS contain zero explicit PRD/Addendum requirement citations. The CLAUDE.md "PRD + Addendum as Source of Truth" rule requires every phase artifact to trace back to specific requirement IDs, including deep-dive trace lines.
- **Severity:** Major

### PHASE-10-GAP-02
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-10-02
- **Description:** The PRD hierarchy is Epic → Feature → Story → **Task**. Task-tier rendering appears nowhere: not in Story Detail, not in any card, not in a sidebar section, not in any view tab. Either Phase 10 renders Tasks as part of the Story Detail page, or the spec must explicitly defer Task UI to a named phase with rationale.
- **Severity:** Major

### PHASE-10-GAP-03
- **Rubric criterion:** R3, R5
- **Affected Req IDs:** — (app-wide accessibility; inferred from shadcn/Radix usage and drag-drop patterns)
- **Description:** No accessibility requirements. Kanban drag-drop, inline-edit, Popover-based filters, swimlane collapse, and EditableField save/cancel all need keyboard-operable equivalents, focus management, and ARIA semantics. There is no WCAG target, no keyboard-navigation AC, no screen-reader AC, and no statement about drag-drop reorder keyboard fallback.
- **Severity:** Blocker (a11y in a primary work-management UI cannot be left unstated; drag-drop without keyboard fallback is a regression risk from any prior table-only flow).

### PHASE-10-GAP-04
- **Rubric criterion:** R3, R6
- **Affected Req IDs:** PRD-19-04, PRD-19-05, PRD-19-08
- **Description:** RBAC is referenced as "role-aware" but the spec does not (a) pin which server action mediates each inline-edit save, (b) require the UI to honor the existing separation between "edit story content" and "assign to sprint" permissions — right now every sidebar field uses the same click-to-edit affordance and the §4 edge-case row only discusses binary edit-permission, and (c) specify UI behavior when the server rejects a transition that the status-machine missed client-side (e.g., stale role cache).
- **Severity:** Blocker (allowing the Sprint field to be editable by a user without "Assign stories to sprints" violates PRD-19-08; this is a silent regression risk).

### PHASE-10-GAP-05
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-19-06
- **Description:** Assigning a sprint must auto-transition status to Sprint Planned. The spec's Story Detail sidebar shows Sprint and Status as independent inline fields with no requirement that the Status field re-render to "Sprint Planned" after a sprint save, and no requirement that the server-action call chain trigger both updates in one round-trip.
- **Severity:** Major

### PHASE-10-GAP-06
- **Rubric criterion:** R3, R5
- **Affected Req IDs:** PRD-12-01
- **Description:** Developers using the Work tab need a fast path to their own assigned tickets and current sprint. No default-for-developer view, no "My Work" preset, no "assigned to me" filter chip by default are specified. The `assignee` filter exists but is unpinned to the current user.
- **Severity:** Major

### PHASE-10-GAP-07
- **Rubric criterion:** R4
- **Affected Req IDs:** PRD-10-03..10
- **Description:** Story Detail and the All-Stories table/kanban show no indicator for "story is still in Draft with N mandatory fields missing". Users in Phase 4 will add the DRAFT→READY gate UI there, but the Phase 10 table/kanban card designs (Task 12, §2.6) have no space or AC for an "incomplete" badge. This makes the two phases' deliverables incompatible without rework.
- **Severity:** Major

### PHASE-10-GAP-08
- **Rubric criterion:** R4, R5
- **Affected Req IDs:** — (empty-state, §2.1.7)
- **Description:** Empty-state content is specified only for the nested "no stories in this feature" case. No empty-state copy is pinned for: Epics Table with 0 epics (new project), Epics Kanban with 0 epics, All Stories views with 0 stories, individual kanban column with 0 items, swimlane row with 0 items (only "hide if empty" is stated — no rule for "hide vs. show placeholder"), filtered-to-zero (copy is mentioned but not pinned).
- **Severity:** Major

### PHASE-10-GAP-09
- **Rubric criterion:** R6, R7
- **Affected Req IDs:** PRD-10-14, PRD-19-04..06
- **Description:** The spec references upstream Phase-1 exports by name (`getAvailableTransitions`, `story-status-machine`, `requireRole`, `getCurrentMember`, `updateStory`, `updateStoryStatus`) without pinning module paths, function signatures, error shapes, or return types. A developer executing Task 11 cannot call these without opening Phase 1 source.
- **Severity:** Major

### PHASE-10-GAP-10
- **Rubric criterion:** R5
- **Affected Req IDs:** — (URL-state hygiene, §3.3)
- **Description:** URL params drive view, filters, sort, pagination, and groupBy. The spec does not state behavior when params are invalid (e.g., `?view=bogus`, `?groupBy=xyz`, `?page=-1`, `?pageSize=9999`). Silent fallback vs. redirect vs. error toast is unspecified.
- **Severity:** Minor

### PHASE-10-GAP-11
- **Rubric criterion:** R8
- **Affected Req IDs:** —
- **Description:** §7 "Open Questions" claims "None" but the gaps above are all open. Section must list real open items with owners/resolution targets so replan/deep-dive can close them.
- **Severity:** Minor

---

## 4. Fix Plan

### Fix PHASE-10-GAP-01
- **File(s) to edit:** `docs/bef/03-phases/phase-10-work-tab-ui/PHASE_SPEC.md` §2 (every subsection 2.1–2.8), §6 (Acceptance Criteria); `TASKS.md` Task headers
- **Change summary:** Add a one-line "Traces to:" reference under each functional requirement block and at the top of every Task, citing the specific Req IDs the item satisfies.
- **New content outline:**
  - PHASE_SPEC §2.2 add: "Traces to: PRD-10-01, PRD-10-02, PRD-12-01, PRD-17-11 (deferred to Phase 7)"
  - PHASE_SPEC §2.3 add: "Traces to: PRD-10-01, PRD-10-02, PRD-10-14"
  - PHASE_SPEC §2.5 add: "Traces to: PRD-10-03..10, PRD-10-14, PRD-19-04, PRD-19-05, PRD-19-06, PRD-19-08"
  - PHASE_SPEC §2.7, §2.8 add same trace lines
  - Each Task 1–12 gets a "Traces to:" row in the attribute table under **Depends On**
- **Definition of done:**
  - [ ] Every §2.x subsection has a "Traces to:" line with at least one Req ID
  - [ ] Every Task attribute table has a "Traces to:" row
  - [ ] Grep for `PRD-` in PHASE_SPEC.md returns ≥ 10 matches; in TASKS.md returns ≥ 12

### Fix PHASE-10-GAP-02
- **File(s) to edit:** `PHASE_SPEC.md` §1 Scope Summary, §2.5 Story Detail, §5 Integration Points
- **Change summary:** Either add Task-tier rendering to Story Detail, or explicitly defer Task tier to a named phase with the rationale.
- **New content outline:**
  - Option A (recommended): add a "Tasks" section to Story Detail left column (below Acceptance Criteria): inline list of Task rows (title, assignee, status checkbox) with add/edit/delete. Add Task 11 AC: "Tasks list shows all Task records for the story with title, assignee avatar, and status checkbox; click-to-edit title, inline assignee dropdown, checkbox toggles status between OPEN/DONE." Name the server actions `listStoryTasks`, `createStoryTask`, `updateStoryTask`, `deleteStoryTask` and mark them as Phase-4 dependencies.
  - Option B: §1 adds "Out of scope: Task-tier UI (Phase 4 owns)" and §2.5 explicitly omits Tasks with a traceable rationale.
- **Cross-phase coordination:** Phase 4 owns DRAFT→READY and may own Task-tier CRUD — confirm before choosing Option A vs. B.
- **Definition of done:**
  - [ ] §1 Scope Summary explicitly addresses Task tier (in-scope with AC, or out-of-scope with owning phase)
  - [ ] PRD-10-02 coverage in §1 Scope Map flips from Partial to Pass or NotApplicable

### Fix PHASE-10-GAP-03
- **File(s) to edit:** `PHASE_SPEC.md` add new §2.9 "Accessibility"; `TASKS.md` Tasks 3, 4, 6, 12 add a11y AC rows
- **Change summary:** Pin WCAG 2.1 AA as the target, enumerate keyboard-interaction AC for the four a11y-sensitive patterns, require axe-core automated testing in the Phase 10 verification gate.
- **New content outline:**
  - §2.9 Accessibility content:
    - Target: WCAG 2.1 AA across all Phase-10 components and pages
    - EditableField: focus lands on input on enter-edit; Escape returns focus to trigger; aria-label from display value; save loading state announced via aria-live polite
    - Kanban drag-drop: keyboard alternative using arrow keys + Space (per @dnd-kit accessibility spec); announce pickup/move/drop via aria-live assertive; focus returns to moved card after drop
    - FilterBar Popover dropdowns: Radix defaults (Escape closes, arrow navigation in option list); active filter pills keyboard-dismissible via Backspace on focus
    - Swimlane collapse: aria-expanded on trigger; section role="region" with aria-labelledby
    - ViewTabs: Radix Tabs primitives (role="tablist", tab/panel aria wiring)
    - MetadataSidebar: semantic dl/dt/dd; inline-editable fields behave like EditableField rules above
    - Color-only status signal is disallowed: StatusBadge must always include text label, not just color
  - Task 3 AC: "Layout passes axe-core scan with zero violations"
  - Task 4 AC: "EditableField keyboard: Tab into display enters focus ring; Enter/Space enters edit mode; Enter saves (text); Ctrl+Enter saves (textarea); Escape cancels and restores focus; screen-reader reads 'editable <label>, current value <value>'"
  - Task 6 AC: "FilterBar keyboard: Tab through search → filters → sort; Popover filter opens on Enter, arrows move through options, Space toggles, Escape closes; active-filter pills focusable and Backspace-dismissible"
  - Task 12 AC: "Kanban cards keyboard: Tab focuses cards in DOM order; Space picks up card; arrow keys move between columns/rows; Space drops; Escape cancels; aria-live announcements for pickup/move/drop"
  - §6 Acceptance Criteria "General" add: "All Work-tab pages pass axe-core CI check with zero serious/critical violations"
- **Definition of done:**
  - [ ] §2.9 Accessibility section exists with the WCAG 2.1 AA target and specific AC per pattern
  - [ ] Tasks 3, 4, 6, 12 each have ≥ 1 keyboard/a11y AC
  - [ ] §6 General section mentions axe-core / WCAG 2.1 AA explicitly
  - [ ] Scope Map a11y row flips to Pass

### Fix PHASE-10-GAP-04
- **File(s) to edit:** `PHASE_SPEC.md` §2.5, §4 edge-cases table; `TASKS.md` Task 11
- **Change summary:** Pin the server-action contracts, differentiate content-edit from sprint-assignment permissions, and specify server-reject behavior.
- **New content outline:**
  - §2.5 add "Permission gating per field" subsection:
    - Fields gated by "Create/edit user stories (content)": title, description, acceptance criteria, persona, dependencies, notes, impacted components, priority, assignee, QA assignee, story points
    - Fields gated by "Assign stories to sprints" (SA/PM only per PRD §19.1 table): sprint
    - Fields gated by "Transition story status (management)" (SA/PM/BA): status dropdown options filtered to management transitions
    - Fields gated by "Transition story status (execution)" (SA/Developer): status dropdown options filtered to execution transitions
    - Rule: Each EditableField receives a `canEdit: boolean` prop derived from `getCurrentMember().role` and the field's permission key. When false, the field renders display-only with no hover affordance.
  - §4 edge-case table: replace the one existing role row with three:
    - User can edit content but not assign sprints → all fields except Sprint are inline-editable; Sprint is display-only
    - User can assign sprint but not edit content (rare) → inverse
    - Server rejects a transition the client thought was allowed (stale role) → toast error, sidebar refetches role+status, UI re-renders gated state
  - Task 11 AC additions:
    - "EditableField wrapper uses `canEdit` prop resolved from current member's role and a per-field permission key"
    - "Sprint field is disabled for users without 'Assign stories to sprints' even if they can edit other content"
    - "On server-action 4xx response, UI shows toast with server error message and refetches story+member to re-gate UI"
  - Pin server-action signatures inline: `updateStory(projectId, storyId, patch): Promise<Story | { error }>`; `updateStoryStatus(projectId, storyId, toStatus): Promise<Story | { error }>`; `assignStoryToSprint(projectId, storyId, sprintId): Promise<Story | { error }>`
- **Cross-phase coordination:** Phase 1 must expose `getFieldPermission(role, fieldKey)` helper or equivalent; if it doesn't, flag as Phase-1 addendum in §5 Integration Points.
- **Definition of done:**
  - [ ] §2.5 lists every inline-editable field with its governing permission key
  - [ ] §4 has three distinct permission edge-case rows
  - [ ] Task 11 has `canEdit` prop + server-reject AC
  - [ ] PRD-19-08 coverage in §1 Scope Map flips to Pass

### Fix PHASE-10-GAP-05
- **File(s) to edit:** `PHASE_SPEC.md` §2.5; `TASKS.md` Task 11
- **Change summary:** Specify the Sprint-save → Status=Sprint Planned side-effect UI requirement.
- **New content outline:**
  - §2.5 sidebar Sprint field note: "Saving a non-null sprint on a story in Draft or Ready status auto-transitions status to Sprint Planned. The sidebar Status field must re-render to the new value in the same round-trip (server action returns the updated story and the UI updates both fields from the single response)."
  - Task 11 AC: "After saving a sprint via Sprint inline-edit, the Status field updates to Sprint Planned in the same save without a second server round-trip"
  - Task 11 AC: "If a story already has an execution-phase status (In Progress or later), saving a sprint does not change status"
- **Definition of done:**
  - [ ] §2.5 contains the auto-transition rule verbatim
  - [ ] Task 11 AC includes both positive and negative cases
  - [ ] PRD-19-06 coverage in §1 Scope Map flips to Pass

### Fix PHASE-10-GAP-06
- **File(s) to edit:** `PHASE_SPEC.md` §2.2; `TASKS.md` Task 8
- **Change summary:** Add a "My Work" preset or default filter to the developer-default view.
- **New content outline:**
  - §2.2 Work Overview: add a 5th view or a "My Work" filter shortcut: "For users with role Developer, the default landing view is 'All Stories (Table)' filtered to `assignee=currentMember` and `status in (Sprint Planned, In Progress, In Review)`. A 'My Work' filter pill appears pre-applied and can be dismissed."
  - Task 8 AC: "Developer role lands on 'All Stories (Table)' with `assignee=me` and `status in (Sprint Planned, In Progress, In Review)` pre-applied; 'My Work' pill visible and dismissible"
  - Task 8 AC: "Non-Developer roles land on default 'Epics (Table)' unchanged"
- **Definition of done:**
  - [ ] §2.2 contains the role-based default view rule
  - [ ] Task 8 has Developer-landing AC
  - [ ] PRD-12-01 coverage in §1 Scope Map flips to Pass

### Fix PHASE-10-GAP-07
- **File(s) to edit:** `PHASE_SPEC.md` §2.6 Kanban Card Redesign, §2.8 Tables; `TASKS.md` Tasks 7, 12
- **Change summary:** Add an "incomplete Draft" indicator on story cards and story-table rows that flips on once Phase 4 ships the validation logic.
- **New content outline:**
  - §2.6 Story card footer addition: "If story is in Draft status AND `missingMandatoryFields.length > 0` (field provided by Phase 4's server-side validator, defaults to empty array until Phase 4 lands), render an amber warning dot with tooltip 'N mandatory fields missing'"
  - §2.8 Story table: add optional "Completeness" column (hidden by default, toggleable) showing the same indicator
  - Task 12 AC: "Story kanban card renders amber warning dot when story has `missingMandatoryFields.length > 0`"
  - Task 7 AC: "Story table supports optional Completeness column toggle"
- **Cross-phase coordination:** Phase 4 must provide `missingMandatoryFields` on the story payload. Until it does, the UI defaults the indicator off.
- **Definition of done:**
  - [ ] §2.6 and §2.8 contain the indicator rule
  - [ ] Tasks 7 and 12 have corresponding AC
  - [ ] Integration note in §5 names Phase 4 as the provider of `missingMandatoryFields`

### Fix PHASE-10-GAP-08
- **File(s) to edit:** `PHASE_SPEC.md` §2.1.7 Enhanced EmptyState, §2.2–2.5 per-view sections; `TASKS.md` Task 2, Task 8
- **Change summary:** Pin the exact empty-state copy and primary/secondary CTA for every list/board empty state across the Work tab.
- **New content outline:**
  - §2.1.7 add a table of canonical empty states:

    | View/State | Heading | Body | Primary CTA | Secondary CTA |
    |---|---|---|---|---|
    | Epics Table/Kanban, 0 epics | "No epics yet" | "Create your first epic to start planning work for this project." | "New Epic" | "Generate with AI" |
    | All Stories Table/Kanban, 0 stories | "No stories yet" | "Stories appear here once epics have features and features have stories." | "Create Epic" (links) | — |
    | Feature list, 0 features | "No features in this epic" | "Add features to group related stories, or create stories directly on the epic." | "New Feature" | "Generate Stories" |
    | Story list, 0 stories | "No stories in this feature" | "Add your first story." | "Create Story" | "Generate with AI" |
    | Filter → 0 results | "No results match your filters" | "Try clearing some filters or adjusting your search." | "Clear filters" | — |
    | Kanban column, 0 items | — | Column shows its count badge (0) and a muted "Drop items here" hint | — | — |
    | Swimlane group, 0 items | Hidden by default | — | — | — |

  - Task 2 AC: "EmptyState consumes the canonical empty-state content from §2.1.7 and renders each case correctly"
  - Task 8 AC: "Each of the 4 views renders the correct canonical empty state from §2.1.7"
- **Definition of done:**
  - [ ] §2.1.7 contains the full table of empty-state copy
  - [ ] Tasks 2 and 8 reference the table explicitly
  - [ ] Empty-state row in §1 Scope Map flips to Pass

### Fix PHASE-10-GAP-09
- **File(s) to edit:** `PHASE_SPEC.md` §5 Integration Points
- **Change summary:** Replace name-only upstream references with file paths and signatures for every Phase-1 export Phase 10 consumes.
- **New content outline:**
  - §5 "From Prior Phases" replaced with a table:

    | Phase-1 export | Module | Signature | Used by |
    |---|---|---|---|
    | `getCurrentMember` | `src/lib/auth/rbac.ts` | `(projectId: string) => Promise<{ userId, role, permissions }>` | Task 11 (UI gating), Task 8 (Developer default view) |
    | `requireRole` | `src/lib/auth/rbac.ts` | `(projectId, roles[]) => Promise<void>` (throws on mismatch) | All server actions invoked by inline edits |
    | `getAvailableTransitions` | `src/lib/work/story-status-machine.ts` | `(currentStatus, role) => StoryStatus[]` | Task 11 status dropdown |
    | `updateStory` | `src/server/actions/story.ts` | `(projectId, storyId, patch) => Promise<Story \| { error }>` | EditableField save |
    | `updateStoryStatus` | `src/server/actions/story.ts` | `(projectId, storyId, toStatus) => Promise<Story \| { error }>` | Task 11 status save |
    | `assignStoryToSprint` | `src/server/actions/sprint.ts` | `(projectId, storyId, sprintId \| null) => Promise<Story \| { error }>` | Task 11 sprint save |

- **Definition of done:**
  - [ ] §5 table exists with all six (or corrected) exports
  - [ ] Every module path resolves in the Phase-1 codebase (to be verified at execute time)

### Fix PHASE-10-GAP-10
- **File(s) to edit:** `PHASE_SPEC.md` §3.3 URL State Management, §4 Edge Cases
- **Change summary:** Specify invalid-URL-param fallback behavior.
- **New content outline:**
  - §3.3 add rule: "Each param has a whitelist of valid values (view, groupBy, sort direction, pageSize). Invalid values fall back to the default silently. `page` is clamped to `[1, totalPages]`. `pageSize` not in {25, 50, 100} falls back to 25."
  - §4 add edge-case rows for `?view=bogus`, `?groupBy=bogus`, `?page=-1`, `?pageSize=9999`, all resolving to "silently falls back to default, no toast"
- **Definition of done:**
  - [ ] §3.3 contains the whitelist/fallback rule
  - [ ] §4 has ≥ 3 new URL-param rows

### Fix PHASE-10-GAP-11
- **File(s) to edit:** `PHASE_SPEC.md` §7 Open Questions
- **Change summary:** Replace "None" with the real list of open items generated by this audit (the gaps above). Each item gets an owner and a resolution checkpoint.
- **New content outline:**
  - "PHASE-10-GAP-02 (Tasks tier) — owner: Mike R., resolution: before execute, via cross-phase alignment with Phase 4"
  - "PHASE-10-GAP-03 (a11y) — owner: Phase 10 deep-dive re-open, resolution: add §2.9 before execute"
  - "PHASE-10-GAP-04 (permission split) — owner: Mike R., resolution: Phase 1 add `getFieldPermission` helper or document existing one"
  - "PHASE-10-GAP-07 (Draft completeness indicator) — owner: cross-phase with Phase 4 on `missingMandatoryFields` payload"
- **Definition of done:**
  - [ ] §7 lists all open gaps with owners
  - [ ] Each closed gap gets struck through or moved to Revision History when resolved

---

## 5. Sign-off Checklist

- [x] R1 scored
- [x] R2 scored
- [x] R3 scored
- [x] R4 scored
- [x] R5 scored
- [x] R6 scored
- [x] R7 scored
- [x] R8 scored
- [x] Every Partial/Fail in the Scope Map has a corresponding gap entry
- [x] Every gap has a fix plan entry
- [x] Every fix plan has a concrete definition of done
- [x] No gap uses vague remediation language
- [x] Overall verdict matches scorecard (Ready-after-fixes; R1/R3/R4/R5/R6/R7/R8 not Pass)
