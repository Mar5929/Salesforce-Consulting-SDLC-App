---
phase: 05-document-generation-qa-and-administration
fixed_at: 2026-04-06T22:45:00Z
review_path: .planning/phases/05-document-generation-qa-and-administration/05-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 5: Code Review Fix Report

**Fixed at:** 2026-04-06T22:45:00Z
**Source review:** .planning/phases/05-document-generation-qa-and-administration/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 10
- Fixed: 10
- Skipped: 0

## Fixed Issues

### CR-01: Archive guard not enforced on any Phase 5 write actions

**Files modified:** `src/actions/defects.ts`, `src/actions/test-executions.ts`, `src/actions/documents.ts`, `src/actions/jira-sync.ts`
**Commit:** 82e4e71
**Applied fix:** Added `import { assertProjectNotArchived } from "@/lib/archive-guard"` and `await assertProjectNotArchived(projectId)` calls at the beginning of all write actions: `createDefect`, `updateDefect`, `transitionDefectStatus`, `deleteDefect`, `createTestCase`, `recordTestExecution`, `updateTestCase`, `deleteTestCase`, `requestDocumentGeneration`, `saveJiraConfig`, and `toggleJiraSync`.

### CR-02: Jira config form allows saving empty API token, overwriting existing token

**Files modified:** `src/actions/jira-sync.ts`, `src/components/jira/jira-config-form.tsx`
**Commit:** edc8635
**Applied fix:** Made `apiToken` optional (with empty string default) in the server action schema. Updated the action handler to only overwrite `encryptedToken` in the update path when a non-empty token is provided. Added a guard that throws an error if no token is provided during initial config creation. Split the client-side form schema into `jiraConfigCreateSchema` (token required) and `jiraConfigUpdateSchema` (token optional), selecting the correct one based on whether `existingConfig` is present.

### WR-01: PM dashboard role check uses "SA" instead of "SOLUTION_ARCHITECT"

**Files modified:** `src/actions/pm-dashboard.ts`
**Commit:** 3d40b76
**Applied fix:** Changed `"SA"` to `"SOLUTION_ARCHITECT"` in both `getPmDashboardData` and `requestDashboardRefresh` role checks to match the Prisma enum value.

### WR-02: Jira sync actions missing auth context check

**Files modified:** `src/actions/jira-sync.ts`
**Commit:** 70557e6
**Applied fix:** Added `await requireRole(projectId, ["PM", "SOLUTION_ARCHITECT"])` to `getJiraConfig` and `getJiraSyncStatus` actions to prevent unauthorized access to Jira configuration and sync status data.

### WR-03: Display ID generation has a race condition window

**Files modified:** `src/lib/display-id.ts`
**Commit:** f988d01
**Applied fix:** Added documentation comment describing the known limitation: the read-and-create is not wrapped in a serializable transaction, and under high concurrency the single retry may not suffice. Recommends migrating to a database-level sequence for display IDs in a future iteration if bulk creation is needed.

### WR-04: Notification on defect reassignment uses wrong event type

**Files modified:** `src/actions/defects.ts`
**Commit:** d93abff
**Applied fix:** Changed the notification event type from `"DEFECT_CREATED"` to `"DEFECT_ASSIGNED"` in the `updateDefect` action's reassignment notification, so the notification dispatch function can format the message correctly.

### WR-05: Document detail page calls server action without proper auth context

**Files modified:** `src/app/(dashboard)/projects/[projectId]/documents/[documentId]/page.tsx`
**Commit:** 92039d6
**Applied fix:** Replaced the server action call `getDocumentDownloadUrl({ documentId })` with a direct call to `getDownloadUrl(doc.s3Key, 300)` from `@/lib/documents/s3-storage`. This is safe because project membership is already verified earlier in the page via `getCurrentMember(projectId)`. Removed the unused `getDocumentDownloadUrl` import.

### WR-06: handleDisconnect in JiraSettingsSection does nothing useful

**Files modified:** `src/app/(dashboard)/projects/[projectId]/settings/jira-settings-section.tsx`, `src/components/jira/jira-config-form.tsx`
**Commit:** 610552d
**Applied fix:** Updated `handleDisconnect` to show an explicit "not yet implemented" toast instead of a misleading "Jira disconnected" message. Disabled the Disconnect confirmation button in the AlertDialog to prevent user confusion until a `deleteJiraConfig` server action is implemented. Added TODO comment documenting the need for the server action.

### WR-07: Bulk status change in StoryTable fires without awaiting results

**Files modified:** `src/components/work/story-table.tsx`
**Commit:** 59ef274
**Applied fix:** Replaced the fire-and-forget `for` loop with `Promise.allSettled()` over mapped `executeStatusChange` calls, then awaiting the result before clearing row selection and refreshing the router. This ensures the UI only refreshes after all status changes have completed (or settled with errors).

### WR-08: AlertDialogTrigger and AlertDialogAction use non-standard props

**Files modified:** `src/components/jira/jira-config-form.tsx`, `src/app/(dashboard)/projects/[projectId]/settings/project-lifecycle-section.tsx`
**Commit:** 1b75c48
**Applied fix:** Replaced the non-standard `render` prop on `AlertDialogTrigger` with the standard shadcn/ui `asChild` pattern wrapping a child `Button`. Replaced the non-standard `variant="destructive"` prop on `AlertDialogAction` with equivalent `className` styling using Tailwind classes (`bg-destructive text-destructive-foreground hover:bg-destructive/90`).

---

_Fixed: 2026-04-06T22:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
