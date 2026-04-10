# Phase 3: Story Management and Sprint Intelligence - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The team can manage the full work breakdown (epics, features, stories) and plan sprints with AI-powered conflict detection and dependency intelligence. Covers WORK-01 through WORK-07, SPRT-01 through SPRT-05.

</domain>

<decisions>
## Implementation Decisions

### Work Breakdown Navigation
- **D-01:** Breadcrumb drill-down with table+kanban toggle at each level. Flat table for epics list, click epic to see features table, click feature to see stories table. Breadcrumb trail for path navigation. Reuses table+kanban toggle pattern established in Phase 2 questions.
- **D-02:** Sidebar nav entry: "Work" section showing Epics as the entry point, plus a "Backlog" shortcut showing all unassigned stories across epics.
- **D-03:** Story table columns: displayId, title, status badge, priority, assignee, story points, feature, sprint assignment.
- **D-04:** Bulk actions via multi-select checkboxes on story table for bulk status change, sprint assignment, and assignee change.

### Story Creation and AI Generation
- **D-05:** Manual story creation via slide-over panel (drawer from right) with form fields. Fields: title (required), epic (required), feature (optional), persona, description, acceptance criteria (required per WORK-02), story points, priority, impacted components.
- **D-06:** AI story generation launched from epic/feature context menu as a chat session (consistent with Phase 2 transcript processing D-08). AI reads requirements, discovery context, and knowledge articles for that scope, then generates a batch of story drafts.
- **D-07:** AI-generated drafts presented as cards with accept/edit/reject actions (same pattern as transcript extraction cards from Phase 2 D-09). Each draft pre-populates acceptance criteria and impacted Salesforce components.
- **D-08:** Component attachment via inline multi-select with componentName + impactType (CREATE/MODIFY/DELETE) per entry. Free-text component names in Phase 3 since no org connection exists yet (Phase 4).
- **D-09:** Story status transitions: PM manages lifecycle states (Draft > Ready, Ready > Sprint Planned auto-transitions on sprint assignment). Developers manage execution states (In Progress > In Review > QA > Done). Per WORK-05.

### Sprint Planning Workflow
- **D-10:** Sprint creation via simple dialog/modal form with fields: name, goal (optional), start date, end date. No capacity field in V1 — story points sum is shown but no hard cap enforcement.
- **D-11:** Story assignment via split view: backlog (unassigned stories) on left, sprint on right. Drag-and-drop from backlog to sprint, or multi-select + "Move to Sprint" bulk action.
- **D-12:** Sprint board as kanban columns by StoryStatus (Draft | Ready | In Progress | In Review | QA | Done). Cards show displayId, title, assignee avatar, story points, priority badge.
- **D-13:** Sprint dashboard: header with sprint goal + date range + progress bar (points completed / total). Summary cards for total stories, points completed, points remaining. Burndown chart showing daily points remaining vs ideal line.
- **D-14:** Sprint list view as table of all sprints with status, date range, story count, points. Click through to sprint board.

### Conflict Detection and Dependency Intelligence
- **D-15:** Conflict analysis runs on story assignment to sprint (real-time). AI checks StoryComponent overlaps between all stories in the sprint.
- **D-16:** Conflict display as warning banner at top of sprint board when conflicts detected. Expandable to show conflict details: which stories overlap on which components, with links to both stories.
- **D-17:** Advisory severity model only — warnings, not blocking gates. PM decides whether overlapping components are a real conflict. Option to dismiss individual warnings.
- **D-18:** Dependency suggestions shown in sprint planning view as an ordered list. AI analyzes component dependencies and suggests execution order with reasoning.
- **D-19:** Dependency analysis triggered via Inngest background function on `sprint/stories-changed` event. Results cached and displayed in sprint view.

### Claude's Discretion
- Exact drag-and-drop library and animation for sprint planning
- Burndown chart library and styling
- Loading skeletons for work breakdown views
- Empty state designs for no epics/features/stories
- Sprint board card density and responsive layout
- Conflict detection AI prompt engineering and token budget
- Story displayId format and auto-increment logic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Full product requirements
- `SF-Consulting-AI-Framework-PRD-v2.1.md` — Complete PRD. Epic/feature/story management (relevant sections), sprint planning, AI story generation, conflict detection.

### Technical architecture and schema
- `SESSION-3-TECHNICAL-SPEC.md` — Database schema for Epic, EpicPhase, Feature, Story, Sprint, StoryComponent models. AI agent harness architecture (reused for story generation and conflict detection).

### Tech stack and versions
- `CLAUDE.md` §Technology Stack — Locked versions for all dependencies. `@tanstack/react-table` for data tables, `react-hook-form` + Zod for form validation, Inngest for background jobs.

### Phase 1 context (design system foundation)
- `.planning/phases/01-foundation-and-data-layer/01-CONTEXT.md` — D-01 (sidebar layout), D-04 (Linear/Vercel aesthetic), D-05 (full schema deployed), D-12/D-13 (Inngest patterns).

### Phase 2 context (UI patterns)
- `.planning/phases/02-discovery-and-knowledge-brain/02-CONTEXT.md` — D-01 (inline quick-add), D-02 (table+kanban toggle), D-08 (chat session for AI processing), D-09 (accept/reject/edit cards), D-31-D-35 (AI agent harness).

### Existing code patterns
- `src/lib/inngest/events.ts` — Event definitions, pattern for adding new events.
- `src/lib/safe-action.ts` — Server action pattern with auth middleware.
- `src/lib/project-scope.ts` — `scopedPrisma()` for project-level data isolation.

### Requirements traceability
- `.planning/REQUIREMENTS.md` — Phase 3 requirements: WORK-01 through WORK-07, SPRT-01 through SPRT-05.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/` — 20 shadcn/ui components (card, table, tabs, dialog, badge, skeleton, button, dropdown-menu, select, etc.) ready for Phase 3 views
- `src/components/layout/app-shell.tsx` — App shell with sidebar, add "Work" and "Sprints" nav items
- `src/components/layout/sidebar.tsx` — Sidebar navigation, needs Phase 3 links
- `src/components/shared/empty-state.tsx` — Empty state component for new views
- Phase 2 question views — Table+kanban toggle pattern to replicate for epics/features/stories

### Established Patterns
- Table+kanban toggle (Phase 2 questions) — reuse for work breakdown views
- Accept/reject/edit cards (Phase 2 transcript extraction) — reuse for AI story draft review
- Chat session for AI processing (Phase 2 transcript processing) — reuse for AI story generation
- Inngest step functions with event-driven triggers — reuse for conflict detection and dependency analysis
- Server actions via `safe-action.ts` with Zod validation — all CRUD operations follow this pattern
- Project-scoped queries via `scopedPrisma()` — all data access follows this pattern

### Integration Points
- Sidebar navigation: Add "Work" section (epics entry) and "Sprints" link
- AI agent harness: Reuse for story generation (context assembly from requirements + knowledge) and conflict detection
- Inngest events: Add `sprint/stories-changed` for triggering conflict/dependency analysis
- Knowledge articles: AI story generation reads existing knowledge articles for business context
- Questions/decisions: AI story generation references answered questions and recorded decisions for acceptance criteria

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow Linear's clean aesthetic for all views. Reuse established Phase 2 interaction patterns wherever applicable.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-story-management-and-sprint-intelligence*
*Context gathered: 2026-04-06*
