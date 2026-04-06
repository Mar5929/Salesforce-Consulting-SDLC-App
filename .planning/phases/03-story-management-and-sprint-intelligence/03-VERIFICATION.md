---
phase: 03-story-management-and-sprint-intelligence
verified: 2026-04-06T22:30:00Z
status: gaps_found
score: 11/13 must-haves verified
overrides_applied: 0
gaps:
  - truth: "User can initiate a STORY_SESSION conversation from epic/feature context menu"
    status: partial
    reason: "initiateStorySession server action exists and is fully implemented, but the epic-detail-client.tsx Generate Stories button still calls a toast placeholder ('Coming soon') instead of invoking the action. The wiring from Plan 03 was not back-applied to the Plan 02 UI."
    artifacts:
      - path: "src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx"
        issue: "handleGenerateStories() shows toast('Coming soon') instead of calling initiateStorySession and redirecting to chat"
    missing:
      - "Wire epic-detail-client.tsx Generate Stories button to call initiateStorySession and redirect to /projects/{projectId}/chat/{conversationId}"
  - truth: "Bulk actions allow multi-select for status change, sprint assignment, assignee change"
    status: partial
    reason: "Status change and assignee change bulk actions work. Sprint assignment bulk action in story-table.tsx calls handleBulkSprintAssign which shows toast.info('Sprint assignment will be available when sprint management is built.') — a known placeholder. The assignStoriesToSprint server action and SprintPlanning split view are fully functional, but the backlog/feature story table's bulk sprint assign is disconnected."
    artifacts:
      - path: "src/components/work/story-table.tsx"
        issue: "handleBulkSprintAssign (lines 282-293) shows toast.info placeholder instead of calling assignStoriesToSprint"
    missing:
      - "Update handleBulkSprintAssign to call assignStoriesToSprint server action with selected story IDs and sprintId, then call router.refresh()"
---

# Phase 3: Story Management and Sprint Intelligence Verification Report

**Phase Goal:** The team can manage the full work breakdown (epics, features, stories) and plan sprints with AI-powered conflict detection and dependency intelligence
**Verified:** 2026-04-06T22:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | User can create and manage epics, features, and stories with mandatory field validation and a full status workflow (Draft through Done) | ✓ VERIFIED | epics.ts, features.ts, stories.ts all export full CRUD. acceptanceCriteria: z.string().min(1) enforced. story-status-machine.ts exports TRANSITIONS map covering DRAFT→READY→SPRINT_PLANNED→IN_PROGRESS→IN_REVIEW→QA→DONE. canTransition() and getAvailableTransitions() exported and wired into updateStoryStatus server action. |
| 2  | AI generates story drafts from requirements and discovery context, pre-populating acceptance criteria and impacted Salesforce components | ✓ VERIFIED | storyGenerationTask exported from story-generation.ts. createStoryDraftTool in tools/create-story-draft.ts with acceptanceCriteria and componentName fields. stories-context.ts loads requirements (RequirementEpic join), answered questions, decisions, knowledge articles, and existing stories. story-draft-cards.tsx wires Accept to createStory + addStoryComponent. STORY_SESSION handled in chat route. initiateStorySession action creates conversation. |
| 3  | PM can create sprints, assign stories, and view sprint dashboard with progress, velocity, and burndown | ✓ VERIFIED | createSprint, assignStoriesToSprint, removeStoriesFromSprint all functional in sprints.ts. Auto-transition READY→SPRINT_PLANNED on assignment. Sprint detail page has Plan/Board/Dashboard tabs. SprintDashboard renders progress bar, 3 summary cards, BurndownChart. computeBurndown function in burndown.ts uses date-fns eachDayOfInterval. |
| 4  | Sprint intelligence flags component-level conflicts between stories and suggests dependency ordering | ✓ VERIFIED | sprintIntelligence Inngest function registered in route.ts. Triggers on SPRINT_STORIES_CHANGED. 4-step pipeline: load-sprint-data, detect-overlaps (deterministic), ai-analysis (Claude), store-results (cachedAnalysis on Sprint). ConflictBanner and DependencyList wired via SprintIntelligencePanel into sprint detail page Board and Plan tabs. Notification fired when conflicts detected. |
| 5  | Epic CRUD server actions create, read, update, delete epics with project scoping | ✓ VERIFIED | epics.ts exports createEpic, updateEpic, deleteEpic, getEpics, getEpic. All use scopedPrisma for project isolation. |
| 6  | Story status machine validates allowed transitions | ✓ VERIFIED | story-status-machine.ts: TRANSITIONS map, canTransition() with PM/DEV role gating, getRoleGroup(). stories.ts calls canTransition() in updateStoryStatus before persisting. |
| 7  | Sidebar shows Work, Backlog, Sprints navigation links | ✓ VERIFIED | sidebar.tsx: label "Work" (line 75), label "Backlog" (line 83), label "Sprints" (line 91) all present with project-scoped hrefs. |
| 8  | Story table shows displayId, title, status, priority, assignee, points, feature, sprint columns | ✓ VERIFIED | story-table.tsx defines 9 columns: checkbox, displayId, title, status (colored Badge), priority (Badge), assignee, storyPoints, feature, sprint. |
| 9  | Sprint board shows kanban columns by story status with draggable cards | ✓ VERIFIED | sprint-board.tsx: 6 columns (DRAFT/SPRINT_PLANNED, READY, IN_PROGRESS, IN_REVIEW, QA, DONE). draggable and onDrop implemented. updateStoryStatus called on drop. Cards show displayId, title, storyPoints, priority. |
| 10 | User can initiate a STORY_SESSION conversation from epic/feature context menu | ✗ FAILED | initiateStorySession server action exists and is fully wired. BUT epic-detail-client.tsx (line 52-53) still calls toast("Coming soon...") instead of invoking initiateStorySession. Plan 03 created the action but did not back-apply the wiring to the Plan 02 UI. |
| 11 | Bulk actions allow multi-select for status change, sprint assignment, assignee change | ✗ FAILED | Status change bulk action works (executeStatusChange). Assignee change bulk action works (executeUpdate with assigneeId). Sprint assignment bulk action (handleBulkSprintAssign) shows toast.info placeholder — no actual assignment occurs. assignStoriesToSprint server action exists and is functional in the SprintPlanning component. |
| 12 | Story display ID generation uses epic-prefix-based IDs (e.g. AUTH-1) | ✓ VERIFIED | generateStoryDisplayId exported from display-id.ts. createStory calls it with epicPrefix. stories.ts imports it. |
| 13 | Conflict detection is advisory only — warnings not blocking gates | ✓ VERIFIED | ConflictBanner renders warnings with dismiss button. No gating logic in assignStoriesToSprint or any other action. SprintIntelligencePanel manages dismiss state client-side. |

**Score:** 11/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/story-status-machine.ts` | Status transition validation with role gating | ✓ VERIFIED | Exports TRANSITIONS, canTransition, getAvailableTransitions, getRoleGroup |
| `src/lib/display-id.ts` | Display ID generation including Story entity | ✓ VERIFIED | generateStoryDisplayId exported, Story in DisplayIdEntityType |
| `src/actions/epics.ts` | Epic CRUD server actions | ✓ VERIFIED | createEpic, updateEpic, deleteEpic, getEpics, getEpic all exported |
| `src/actions/features.ts` | Feature CRUD server actions | ✓ VERIFIED | createFeature, updateFeature, deleteFeature, getFeatures all exported |
| `src/actions/stories.ts` | Story CRUD server actions | ✓ VERIFIED | createStory, updateStory, deleteStory, getStories, updateStoryStatus, addStoryComponent, getStory exported. canTransition and generateStoryDisplayId imported. acceptanceCriteria enforced. |
| `src/actions/sprints.ts` | Sprint CRUD and story assignment server actions | ✓ VERIFIED | createSprint, updateSprint, getSprints, getSprint, assignStoriesToSprint, removeStoriesFromSprint all exported. EVENTS.SPRINT_STORIES_CHANGED fired. Auto-transition READY→SPRINT_PLANNED. |
| `src/lib/burndown.ts` | Burndown data computation | ✓ VERIFIED | computeBurndown exported. BurndownStory interface exported. Uses date-fns eachDayOfInterval. |
| `src/lib/inngest/functions/sprint-intelligence.ts` | Inngest step function for conflict detection | ✓ VERIFIED | sprintIntelligence exported. EVENTS.SPRINT_STORIES_CHANGED trigger. 4-step pipeline. Stores cachedAnalysis. NOTIFICATION_SEND on conflicts. |
| `src/lib/agent-harness/tasks/story-generation.ts` | Story generation task definition | ✓ VERIFIED | storyGenerationTask exported with AGENT_LOOP mode, create_story_draft tool, system prompt |
| `src/lib/agent-harness/tools/create-story-draft.ts` | Tool for AI to propose story drafts | ✓ VERIFIED | createStoryDraftToolDefinition exported with acceptanceCriteria and componentName in schema |
| `src/lib/agent-harness/context/stories-context.ts` | Context assembly for story generation | ✓ VERIFIED | Loads requirements via RequirementEpic, answered questions, decisions, knowledge articles, existing stories |
| `src/components/work/story-draft-cards.tsx` | Accept/edit/reject card UI | ✓ VERIFIED | Imports createStory and addStoryComponent. handleAccept persists via server actions. Reject removes from UI state. acceptanceCriteria and componentName displayed. |
| `src/components/work/story-table.tsx` | Story table with bulk actions and all D-03 columns | ✓ VERIFIED | 9 columns present. Bulk status change works. Bulk assignee change works. Bulk sprint assign is placeholder (see gap). |
| `src/components/work/story-form.tsx` | Slide-over story creation/edit form | ✓ VERIFIED | acceptanceCriteria: z.string().min(1) enforced. Creates via createStory, updates via updateStory. Status transitions via updateStoryStatus. ComponentSelector included. |
| `src/components/work/component-selector.tsx` | Free-text component name + impact type selector | ✓ VERIFIED | File exists in components/work/ |
| `src/components/sprints/sprint-board.tsx` | Kanban board by StoryStatus for sprint | ✓ VERIFIED | 6 columns, draggable, onDrop, updateStoryStatus import, displayId and storyPoints on cards |
| `src/components/sprints/burndown-chart.tsx` | Recharts line chart for burndown | ✓ VERIFIED | LineChart import from recharts. dataKey="ideal" and dataKey="remaining". |
| `src/components/sprints/sprint-dashboard.tsx` | Sprint dashboard with progress and burndown | ✓ VERIFIED | computeBurndown imported. Progress component. Points Completed metric. |
| `src/components/sprints/conflict-banner.tsx` | Warning banner showing component conflicts | ✓ VERIFIED | ConflictBanner exported. AlertTriangle icon. onDismiss per D-17. |
| `src/components/sprints/dependency-list.tsx` | Ordered dependency suggestions | ✓ VERIFIED | DependencyList exported. "Suggested Execution Order" heading. reasoning displayed. |
| `src/app/(dashboard)/projects/[projectId]/work/page.tsx` | Epics list page | ✓ VERIFIED | Server component fetching epics via scopedPrisma |
| `src/app/(dashboard)/projects/[projectId]/work/[epicId]/page.tsx` | Epic detail page | ✓ VERIFIED | Renders features with breadcrumb |
| `src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx` | Epic detail client | ⚠️ PARTIAL | Generate Stories button wired to toast placeholder, not initiateStorySession |
| `src/app/(dashboard)/projects/[projectId]/backlog/page.tsx` | Backlog page | ✓ VERIFIED | Server component fetching unassigned stories (sprintId: null) |
| `src/app/(dashboard)/projects/[projectId]/sprints/page.tsx` | Sprint list page | ✓ VERIFIED | Server component fetching sprints via scopedPrisma |
| `src/app/(dashboard)/projects/[projectId]/sprints/[sprintId]/page.tsx` | Sprint detail page | ✓ VERIFIED | Plan/Board/Dashboard tabs. SprintBoard, SprintDashboard, SprintIntelligencePanel all wired. cachedAnalysis parsed and passed. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/actions/stories.ts` | `src/lib/story-status-machine.ts` | canTransition import | ✓ WIRED | Line 25: `import { canTransition } from "@/lib/story-status-machine"` |
| `src/actions/stories.ts` | `src/lib/display-id.ts` | generateStoryDisplayId import | ✓ WIRED | Line 24: `import { generateStoryDisplayId } from "@/lib/display-id"` |
| `src/actions/sprints.ts` | `src/lib/inngest/events.ts` | SPRINT_STORIES_CHANGED event | ✓ WIRED | EVENTS.SPRINT_STORIES_CHANGED fired in assignStoriesToSprint and removeStoriesFromSprint |
| `src/components/sprints/sprint-planning.tsx` | `src/actions/sprints.ts` | assignStoriesToSprint call | ✓ WIRED | Line 23: import, used in drag-and-drop and bulk Move to Sprint |
| `src/lib/agent-harness/tasks/story-generation.ts` | `src/lib/agent-harness/context/stories-context.ts` | storiesContext import | ✓ WIRED | storiesContext referenced in contextSources |
| `src/components/work/story-draft-cards.tsx` | `src/actions/stories.ts` | createStory on accept | ✓ WIRED | Line 34: `import { createStory, addStoryComponent } from "@/actions/stories"` |
| `src/components/sprints/burndown-chart.tsx` | `recharts` | LineChart import | ✓ WIRED | Line 12: `LineChart` imported from recharts |
| `src/components/sprints/sprint-dashboard.tsx` | `src/lib/burndown.ts` | computeBurndown import | ✓ WIRED | Line 16: `import { computeBurndown } from "@/lib/burndown"` |
| `src/lib/inngest/functions/sprint-intelligence.ts` | `src/lib/inngest/events.ts` | SPRINT_STORIES_CHANGED trigger | ✓ WIRED | EVENTS.SPRINT_STORIES_CHANGED in triggers array |
| `src/components/sprints/conflict-banner.tsx` | `Sprint.cachedAnalysis` | reads cached analysis | ✓ WIRED | cachedAnalysis parsed in page.tsx line 75 and passed to SprintIntelligencePanel |
| `src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx` | `src/actions/conversations.ts` | initiateStorySession call | ✗ NOT WIRED | handleGenerateStories() calls toast("Coming soon") instead of initiateStorySession |
| `src/components/work/story-table.tsx` | `src/actions/sprints.ts` | assignStoriesToSprint for bulk | ✗ NOT WIRED | handleBulkSprintAssign calls toast.info() placeholder, not assignStoriesToSprint |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/app/(dashboard)/projects/[projectId]/work/page.tsx` | `epics` | `db.epic.findMany()` via scopedPrisma | Yes | ✓ FLOWING |
| `src/app/(dashboard)/projects/[projectId]/backlog/page.tsx` | `stories` | `db.story.findMany({ where: { sprintId: null } })` | Yes | ✓ FLOWING |
| `src/app/(dashboard)/projects/[projectId]/sprints/[sprintId]/page.tsx` | `sprint`, `cachedAnalysis` | `db.sprint.findUnique()` with stories relation | Yes | ✓ FLOWING |
| `src/components/sprints/sprint-dashboard.tsx` | `burndownData` | `computeBurndown(sprint.startDate, sprint.endDate, stories)` pure function | Yes | ✓ FLOWING |
| `src/components/work/story-draft-cards.tsx` | `drafts` | Streamed from chat route via toolCalls JSON in ChatMessage | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — No server running. All verification done via static code analysis.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| WORK-01 | 03-01, 03-02 | Epic/feature/user story hierarchy CRUD | ✓ SATISFIED | epics.ts, features.ts, stories.ts; Work page, epic detail, feature detail pages all functional |
| WORK-02 | 03-02b | Mandatory acceptance criteria on stories | ✓ SATISFIED | story-form.tsx z.string().min(1) for acceptanceCriteria; createStory schema enforces acceptanceCriteria: z.string().min(1) |
| WORK-03 | 03-01, 03-02b | Role-based edit/delete — own stories or PM/SA any | ✓ SATISFIED | updateStory and deleteStory check ProjectMember role via findFirst; PM/SA bypass, others check ownership |
| WORK-04 | 03-00, 03-01, 03-02b | Story status workflow Draft through Done | ✓ SATISFIED | TRANSITIONS map covers all 7 statuses; canTransition() enforced server-side; 16 unit tests validate all role/transition combinations |
| WORK-05 | 03-00, 03-01, 03-02b | PM lifecycle states, dev execution states, auto-transition on sprint assignment | ✓ SATISFIED | PM_TRANSITIONS and DEV_TRANSITIONS separate; assignStoriesToSprint auto-transitions READY→SPRINT_PLANNED |
| WORK-06 | 03-03 | AI-assisted story generation | ✓ SATISFIED | storyGenerationTask, createStoryDraftTool, stories-context.ts, story-draft-cards.tsx, STORY_SESSION in chat route, initiateStorySession action all implemented |
| WORK-07 | 03-01, 03-02b | Story tracks impacted Salesforce components via StoryComponent | ✓ SATISFIED | addStoryComponent server action with dedup; component-selector.tsx; story-form.tsx includes ComponentSelector |
| SPRT-01 | 03-04 | PM can create sprints with start/end dates | ✓ SATISFIED | createSprint action with name, goal, startDate, endDate, status=PLANNING |
| SPRT-02 | 03-00, 03-04 | PM can assign stories to sprints | ✓ SATISFIED | assignStoriesToSprint functional; SprintPlanning drag-and-drop and "Move to Sprint" bulk action work. NOTE: bulk sprint assign in story-table is a toast placeholder (gap). Primary assignment path via SprintPlanning is functional. |
| SPRT-03 | 03-06 | Sprint intelligence detects component-level conflicts | ✓ SATISFIED | sprintIntelligence Inngest function with deterministic overlap detection; AI severity analysis; cachedAnalysis stored; ConflictBanner renders on Board tab |
| SPRT-04 | 03-06 | Sprint intelligence suggests dependency ordering | ✓ SATISFIED | AI dependency ordering in sprintIntelligence; DependencyList renders on Plan tab with numbered steps and AI reasoning |
| SPRT-05 | 03-00, 03-05 | Sprint dashboard shows progress, velocity, burndown | ✓ SATISFIED | SprintDashboard: Progress bar, Points Completed/Remaining summary cards, BurndownChart with ideal and remaining lines |

**All 12 requirement IDs from plan frontmatter covered. No orphaned requirements from REQUIREMENTS.md for Phase 3.**

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx` | 52-53 | `toast("Coming soon...")` in handleGenerateStories instead of calling initiateStorySession | Blocker | Generate Stories feature is advertised in UI but non-functional; WORK-06 user-facing entry point broken |
| `src/components/work/story-table.tsx` | 288-291 | `toast.info("Sprint assignment will be available...")` in handleBulkSprintAssign instead of calling assignStoriesToSprint | Warning | Bulk sprint assign from story table/backlog is non-functional; SprintPlanning provides an alternative working path |

### Human Verification Required

None — all must-haves verifiable via static code analysis for this phase's scope.

### Gaps Summary

Two wiring gaps found where Plan 02 UI was not updated after Plan 03 created the missing dependencies:

**Gap 1 (Blocker): Generate Stories entry point is disconnected.** The `initiateStorySession` server action was implemented in Plan 03 and is fully functional. The `STORY_SESSION` chat route integration is complete. However, `epic-detail-client.tsx` (created in Plan 02) still shows a "Coming soon" toast instead of calling `initiateStorySession`. The entire AI story generation pipeline (WORK-06) is built but unreachable from the UI. Fix: update `handleGenerateStories()` in `epic-detail-client.tsx` to call `initiateStorySession({ projectId, epicId })` and redirect to `/projects/${projectId}/chat/${conversationId}`.

**Gap 2 (Warning): Bulk sprint assignment from story table is a toast placeholder.** `handleBulkSprintAssign` in `story-table.tsx` shows an info toast instead of calling `assignStoriesToSprint`. The `assignStoriesToSprint` server action exists and works correctly. The sprint planning split view provides a functional alternative for assigning stories. SPRT-02 "PM can assign stories to sprints" is satisfied via `SprintPlanning`. The backlog's bulk assign convenience feature is broken. Fix: call `assignStoriesToSprint({ projectId, sprintId, storyIds: selectedIds })` from `handleBulkSprintAssign`.

---

_Verified: 2026-04-06T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
