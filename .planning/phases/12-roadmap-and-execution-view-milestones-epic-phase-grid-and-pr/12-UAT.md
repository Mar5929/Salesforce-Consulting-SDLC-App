---
status: testing
phase: 12-roadmap-and-execution-view-milestones-epic-phase-grid-and-pr
source: 12-CONTEXT.md (no SUMMARY files — phase executed via parallel agents)
started: 2026-04-08T22:00:00Z
updated: 2026-04-08T22:00:00Z
---

## Current Test

number: 1
name: Roadmap Sidebar Navigation
expected: |
  In the sidebar, a "Roadmap" item appears (after Sprints). Clicking it navigates to /projects/[projectId]/roadmap. The item is visible to all roles.
awaiting: user response

## Tests

### 1. Roadmap Sidebar Navigation
expected: In the sidebar, a "Roadmap" item appears (after Sprints). Clicking it navigates to /projects/[projectId]/roadmap. The item is visible to all roles.
result: [pending]

### 2. Roadmap Page Loads with Tabs
expected: The roadmap page loads with a "Roadmap" heading and three tab buttons: "Milestones" (selected by default), "Epic Phases", and "Execution Plan". Clicking tabs switches content and updates the URL query param (?tab=...).
result: [pending]

### 3. Create a Milestone
expected: On the Milestones tab, clicking "New Milestone" opens a slide-over panel from the right. Filling in name (required), optional description, optional target date, and status, then saving creates the milestone. A success toast appears and the milestone appears in the table.
result: [pending]

### 4. Edit a Milestone
expected: Clicking the edit (pencil) icon on a milestone row opens the same slide-over pre-populated with that milestone's data. Changing fields and saving updates the milestone. Dirty form protection warns if closing with unsaved changes.
result: [pending]

### 5. Delete a Milestone
expected: Clicking the delete (trash) icon shows a confirmation dialog. Confirming deletes the milestone and removes it from the table. A success toast appears.
result: [pending]

### 6. Link Stories to a Milestone
expected: Clicking the link icon on a milestone row opens a dialog showing unlinked stories grouped by epic. Checking stories and clicking "Link Selected" links them. The milestone's story count and progress bar update.
result: [pending]

### 7. Milestone Progress Bar
expected: Milestones with linked stories show a progress bar. Progress reflects the ratio of DONE stories to total linked stories. Bar is green (>75%), yellow (25-75%), or red (<25%).
result: [pending]

### 8. Epic Phase Grid Display
expected: Clicking the "Epic Phases" tab shows a matrix table. Rows are epics, columns are Discovery/Design/Build/Test/Deploy. Each cell shows a colored status chip (gray=Not Started, blue=In Progress, green=Complete, muted=Skipped). Column headers show aggregate counts.
result: [pending]

### 9. Epic Phase Grid Click-to-Cycle
expected: Clicking a status cell cycles through: Not Started → In Progress → Complete → Skipped → Not Started. The change is instant (optimistic) and persists on page refresh.
result: [pending]

### 10. Execution Plan Tab Display
expected: Clicking "Execution Plan" tab shows collapsible per-epic sections. Each section header shows epic name, story count, and completion percentage. Expanding shows stories with displayId, title, assignee, status badge, and dependency indicators.
result: [pending]

### 11. AI Milestone Summaries
expected: On the Milestones tab, an "Upcoming Milestones" section shows summary cards for the next 2-3 NOT_STARTED or IN_PROGRESS milestones. Each card shows a computed summary of story completion and remaining work. A refresh button regenerates summaries.
result: [pending]

### 12. Empty States
expected: When no milestones exist, the Milestones tab shows an empty state message. When no epics exist, the Epic Phases tab shows an empty state. When no stories exist, the Execution Plan tab shows an empty state.
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0
blocked: 0

## Gaps

[none yet]
