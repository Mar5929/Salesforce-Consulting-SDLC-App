# Phase 3: Story Management and Sprint Intelligence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 03-story-management-and-sprint-intelligence
**Areas discussed:** Work breakdown navigation, Story creation and AI generation, Sprint planning workflow, Conflict detection and dependency intelligence

---

## Work Breakdown Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Tree sidebar + table | Collapsible tree in left panel with table/kanban main view | |
| Nested table with expand | Single table with inline expand for hierarchy | |
| Breadcrumb drill-down | Flat table at each level with breadcrumb navigation | |

**User's choice:** Claude's recommendation — Breadcrumb drill-down with table+kanban toggle. User selected all areas for Claude to recommend.
**Notes:** Reuses table+kanban toggle from Phase 2. Simpler than tree sidebar. Avoids nested table complexity.

### Sub-decisions (Claude recommended)

**Sidebar entry:** "Work" section with Epics entry point + "Backlog" shortcut
**Table columns:** displayId, title, status badge, priority, assignee, story points, feature, sprint
**Bulk actions:** Multi-select checkboxes for status change, sprint assignment, assignee change

---

## Story Creation and AI Generation

| Option | Description | Selected |
|--------|-------------|----------|
| Slide-over panel | Drawer from right with form fields | |
| Full page form | Dedicated page for story creation | |
| Inline creation | Add row to table with inline editing | |

**User's choice:** Claude's recommendation — Slide-over panel (drawer). User selected all areas for Claude to recommend.
**Notes:** Consistent with Linear's issue creation. AI generation via chat session (Phase 2 pattern). Drafts as accept/edit/reject cards (Phase 2 pattern).

### Sub-decisions (Claude recommended)

**AI generation trigger:** Epic/feature context menu launches chat session
**Draft presentation:** Cards with accept/edit/reject (transcript extraction pattern)
**Component attachment:** Inline multi-select, free-text names (no org in Phase 3)
**Status transitions:** PM manages lifecycle states, developers manage execution states

---

## Sprint Planning Workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Simple dialog form | Modal with name, goal, dates | |
| Multi-step wizard | Guided flow: details > assign stories > review | |
| Inline creation | Add sprint directly in list view | |

**User's choice:** Claude's recommendation — Simple dialog form for creation, split view for assignment. User selected all areas for Claude to recommend.
**Notes:** No capacity enforcement in V1. Drag-and-drop + bulk "Move to Sprint" for assignment. Kanban board by story status. Burndown chart in dashboard.

### Sub-decisions (Claude recommended)

**Story assignment:** Split view with backlog left, sprint right, drag-and-drop
**Sprint board:** Kanban columns by StoryStatus
**Dashboard:** Progress bar + summary cards + burndown chart
**Sprint list:** Table with click-through to board

---

## Conflict Detection and Dependency Intelligence

| Option | Description | Selected |
|--------|-------------|----------|
| Inline warnings (advisory) | Warning banner + expandable details, non-blocking | |
| Blocking gates | Must resolve conflicts before sprint can start | |
| Separate analysis panel | Dedicated conflict/dependency view accessed from sprint | |

**User's choice:** Claude's recommendation — Advisory warnings (non-blocking). User selected all areas for Claude to recommend.
**Notes:** Analysis runs on story assignment via Inngest. PM decides if conflicts are real. Dependency suggestions as ordered list with reasoning.

### Sub-decisions (Claude recommended)

**Analysis trigger:** On story assignment, via Inngest `sprint/stories-changed` event
**Conflict display:** Warning banner at top of sprint board, expandable
**Dependency suggestions:** Ordered list with AI reasoning
**Severity:** Advisory only, dismissible

---

## Claude's Discretion

- Drag-and-drop library, burndown chart library, loading skeletons, empty states, card density, conflict AI prompts, displayId format

## Deferred Ideas

None — discussion stayed within phase scope.
