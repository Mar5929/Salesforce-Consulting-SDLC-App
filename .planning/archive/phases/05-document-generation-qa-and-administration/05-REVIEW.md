---
phase: 05-document-generation-qa-and-administration
reviewed: 2026-04-06T22:15:00Z
depth: standard
files_reviewed: 57
files_reviewed_list:
  - src/actions/defects.ts
  - src/actions/documents.ts
  - src/actions/jira-sync.ts
  - src/actions/pm-dashboard.ts
  - src/actions/project-archive.ts
  - src/actions/test-executions.ts
  - src/app/(dashboard)/projects/[projectId]/defects/defects-page-client.tsx
  - src/app/(dashboard)/projects/[projectId]/defects/page.tsx
  - src/app/(dashboard)/projects/[projectId]/documents/[documentId]/page.tsx
  - src/app/(dashboard)/projects/[projectId]/documents/documents-client.tsx
  - src/app/(dashboard)/projects/[projectId]/documents/page.tsx
  - src/app/(dashboard)/projects/[projectId]/pm-dashboard/page.tsx
  - src/app/(dashboard)/projects/[projectId]/pm-dashboard/pm-dashboard-client.tsx
  - src/app/(dashboard)/projects/[projectId]/settings/jira-settings-section.tsx
  - src/app/(dashboard)/projects/[projectId]/settings/page.tsx
  - src/app/(dashboard)/projects/[projectId]/settings/project-lifecycle-section.tsx
  - src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/stories/[storyId]/page.tsx
  - src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/stories/[storyId]/story-detail-client.tsx
  - src/app/api/inngest/route.ts
  - src/components/defects/defect-create-sheet.tsx
  - src/components/defects/defect-filters.tsx
  - src/components/defects/defect-kanban.tsx
  - src/components/defects/defect-table.tsx
  - src/components/documents/document-preview.tsx
  - src/components/documents/generation-dialog.tsx
  - src/components/documents/generation-progress.tsx
  - src/components/documents/template-gallery.tsx
  - src/components/documents/version-history-table.tsx
  - src/components/jira/jira-config-form.tsx
  - src/components/jira/sync-status-badge.tsx
  - src/components/layout/sidebar.tsx
  - src/components/pm-dashboard/ai-usage-charts.tsx
  - src/components/pm-dashboard/qa-summary.tsx
  - src/components/pm-dashboard/sprint-velocity-chart.tsx
  - src/components/pm-dashboard/stat-cards.tsx
  - src/components/pm-dashboard/team-activity.tsx
  - src/components/pm-dashboard/work-progress-chart.tsx
  - src/components/qa/record-result-form.tsx
  - src/components/qa/test-execution-table.tsx
  - src/components/work/story-table.tsx
  - src/lib/agent-harness/tasks/document-content.ts
  - src/lib/archive-guard.ts
  - src/lib/defect-status-machine.ts
  - src/lib/display-id.ts
  - src/lib/documents/branding.ts
  - src/lib/documents/renderers/docx-renderer.ts
  - src/lib/documents/renderers/pdf-renderer.tsx
  - src/lib/documents/renderers/pptx-renderer.ts
  - src/lib/documents/s3-storage.ts
  - src/lib/documents/templates/discovery-report.ts
  - src/lib/documents/templates/executive-brief.ts
  - src/lib/documents/templates/requirements-doc.ts
  - src/lib/documents/templates/sprint-summary.ts
  - src/lib/documents/templates/types.ts
  - src/lib/inngest/events.ts
  - src/lib/inngest/functions/document-generation.ts
  - src/lib/inngest/functions/jira-sync.ts
  - src/lib/inngest/functions/pm-dashboard-synthesis.ts
  - src/lib/jira/client.ts
  - src/lib/jira/field-mapping.ts
  - src/lib/jira/sync.ts
findings:
  critical: 2
  warning: 8
  info: 5
  total: 15
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-04-06T22:15:00Z
**Depth:** standard
**Files Reviewed:** 57
**Status:** issues_found

## Summary

Phase 5 implements document generation, QA/defect tracking, Jira integration, PM dashboard, and project archival. The code is generally well-structured with good separation of concerns, proper auth checks, and threat mitigation annotations throughout. However, there are two critical issues: (1) the archive guard (`assertProjectNotArchived`) is never called by any of the write actions in this phase, meaning archived projects can still be mutated, and (2) the Jira config form allows saving with a blank API token when updating, which would overwrite the existing encrypted token with an empty string. There are also several warnings around missing auth checks, race conditions in display ID generation, and a role check inconsistency.

## Critical Issues

### CR-01: Archive guard not enforced on any Phase 5 write actions

**File:** `src/lib/archive-guard.ts:1` (declared but unused by Phase 5 actions)
**Issue:** The `assertProjectNotArchived` function exists but is never called by `createDefect`, `updateDefect`, `transitionDefectStatus`, `deleteDefect`, `createTestCase`, `recordTestExecution`, `requestDocumentGeneration`, or `saveJiraConfig`. Per threat mitigation T-05-03, all write operations on project-scoped data must reject mutations on archived projects. Currently, users can create defects, record test executions, generate documents, and modify Jira configuration on an archived project.
**Fix:** Add `await assertProjectNotArchived(projectId)` at the beginning of every write action. Example for `createDefect`:
```typescript
import { assertProjectNotArchived } from "@/lib/archive-guard"

export const createDefect = actionClient
  .schema(createDefectSchema)
  .action(async ({ parsedInput, ctx }) => {
    await assertProjectNotArchived(parsedInput.projectId)
    const member = await verifyMembership(parsedInput.projectId, ctx.userId)
    // ...rest
  })
```

### CR-02: Jira config form allows saving empty API token, overwriting existing token

**File:** `src/components/jira/jira-config-form.tsx:36` and `src/actions/jira-sync.ts:18`
**Issue:** The form hints "Leave blank to keep existing token" (line 192), but the Zod schema requires `apiToken: z.string().min(1)` and the server action always encrypts and overwrites the token. If the user submits the form without entering a token, form validation will block it. However, if the schema is later relaxed to allow optional tokens (to implement the "leave blank" UX), the server action will encrypt an empty string and overwrite the real token. The UI promise and the validation are misaligned -- the UX says "leave blank to keep" but there is no server-side logic to conditionally skip the token update.
**Fix:** Make the API token optional when updating an existing config, and skip the token update if blank:
```typescript
// In saveJiraConfig action:
const updateData: Record<string, unknown> = {
  instanceUrl,
  email,
  jiraProjectKey,
}
if (apiToken && apiToken.length > 0) {
  updateData.encryptedToken = await encrypt(apiToken, projectId)
}

const config = await prisma.jiraConfig.upsert({
  where: { projectId },
  create: {
    projectId,
    instanceUrl,
    email,
    encryptedToken: await encrypt(apiToken, projectId),
    jiraProjectKey,
  },
  update: updateData,
})
```
And adjust the schema to allow optional `apiToken` on update, or split into separate create/update schemas.

## Warnings

### WR-01: PM dashboard role check uses "SA" instead of "SOLUTION_ARCHITECT"

**File:** `src/actions/pm-dashboard.ts:44`
**Issue:** The role check `!["PM", "SA"].includes(member.role)` compares against `"SA"`, but the Prisma enum uses `"SOLUTION_ARCHITECT"`. This means Solution Architects will be denied access to the PM Dashboard with an error "PM Dashboard requires PM or SA role". The same bug appears on line 83.
**Fix:**
```typescript
if (!["PM", "SOLUTION_ARCHITECT"].includes(member.role)) {
  throw new Error("PM Dashboard requires PM or SA role")
}
```

### WR-02: Jira sync actions missing auth context check

**File:** `src/actions/jira-sync.ts:78`
**Issue:** The `getJiraConfig` action (line 78) and `getJiraSyncStatus` action (line 138) do not verify project membership via `requireRole` or any membership check. Any authenticated user can read Jira configuration (minus the encrypted token) and sync status for any project by supplying an arbitrary `projectId`. While the encrypted token is excluded, leaking the Jira instance URL, email, and project key is still an information disclosure risk.
**Fix:** Add membership verification:
```typescript
export const getJiraConfig = actionClient
  .schema(getJiraConfigSchema)
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput
    await requireRole(projectId, ["PM", "SOLUTION_ARCHITECT"])
    // ...rest
  })
```

### WR-03: Display ID generation has a race condition window

**File:** `src/lib/display-id.ts:47-63`
**Issue:** The `generateDisplayId` function queries the max display number and constructs the next ID, but this is not wrapped in a database transaction. Between the query and the subsequent `prisma.defect.create()` call in the action, another concurrent request could generate the same display ID. The retry on unique constraint violation (P2002) helps, but only retries once, and the retry reads the same non-transactional state. Under high concurrency (e.g., bulk defect import), this could still produce duplicates or fail.
**Fix:** Wrap the read-and-create in a `prisma.$transaction()` with serializable isolation, or use a database sequence. For now, document the limitation and consider using a database-level sequence for display IDs in a future iteration.

### WR-04: Notification on defect reassignment uses wrong event type

**File:** `src/actions/defects.ts:189`
**Issue:** When a defect is reassigned via `updateDefect`, the notification event uses `type: "DEFECT_CREATED"` instead of a more appropriate type like `"DEFECT_ASSIGNED"` or `"DEFECT_UPDATED"`. This could cause the notification dispatch function to format the notification incorrectly (e.g., saying "new defect" when the defect was just reassigned).
**Fix:**
```typescript
await inngest.send({
  name: EVENTS.NOTIFICATION_SEND,
  data: {
    projectId: existing.projectId,
    type: "DEFECT_ASSIGNED",  // or "DEFECT_UPDATED"
    // ...rest
  },
})
```

### WR-05: Document detail page calls server action without proper auth context

**File:** `src/app/(dashboard)/projects/[projectId]/documents/[documentId]/page.tsx:63`
**Issue:** The page calls `getDocumentDownloadUrl({ documentId })` as a direct function call from a server component. Server actions invoked this way may not have the Clerk auth context properly threaded through `next-safe-action`'s middleware, depending on how `actionClient` is configured. If the auth middleware expects cookies/headers from a client-side request, this server-side call could fail or bypass auth. The membership check inside the action would then either throw or be skipped.
**Fix:** Either fetch the presigned URL directly using the `getDownloadUrl` utility (since membership is already verified earlier in the page), or ensure the action client supports server-component invocation. Safer approach:
```typescript
import { getDownloadUrl } from "@/lib/documents/s3-storage"
// After verifying membership above:
const downloadUrl = doc.s3Key ? await getDownloadUrl(doc.s3Key, 300) : ""
```

### WR-06: `handleDisconnect` in JiraSettingsSection does nothing useful

**File:** `src/app/(dashboard)/projects/[projectId]/settings/jira-settings-section.tsx:57-60`
**Issue:** The `handleDisconnect` function only shows a toast and refreshes the page, but does not actually delete the Jira config. The disconnect confirmation dialog in `JiraConfigForm` calls `onDisconnect?.()` which routes here, giving the user the impression that disconnection happened when it did not. The Jira config remains in the database.
**Fix:** Either implement a `deleteJiraConfig` server action that actually removes the config, or clearly label the button as a placeholder and disable it until the action exists.

### WR-07: Bulk status change in StoryTable fires without awaiting results

**File:** `src/components/work/story-table.tsx:320-330`
**Issue:** `handleBulkStatusChange` calls `executeStatusChange` in a loop but does not await each call or use `Promise.all`. It then immediately calls `setRowSelection({})` and `router.refresh()` before the status changes complete. This means the UI will refresh showing stale data, and errors from individual updates will not block the UI reset.
**Fix:**
```typescript
async function handleBulkStatusChange(status: string) {
  const promises = selectedRows.map((row) =>
    executeStatusChange({
      projectId,
      storyId: row.original.id,
      status: status as typeof ALL_STATUSES[number],
    })
  )
  await Promise.all(promises)
  setRowSelection({})
  router.refresh()
}
```
Note: `executeStatusChange` from `useAction` may not return a promise. If so, consider using `Promise.allSettled` with direct action calls or batching via a dedicated bulk action.

### WR-08: `AlertDialogTrigger` and `AlertDialogAction` use non-standard `render` and `variant` props

**File:** `src/components/jira/jira-config-form.tsx:219-220` and `src/app/(dashboard)/projects/[projectId]/settings/project-lifecycle-section.tsx:166`
**Issue:** `AlertDialogTrigger` is called with a `render` prop (line 219), and `AlertDialogAction` is called with a `variant="destructive"` prop (line 166). Standard shadcn/ui `AlertDialogTrigger` uses `asChild` with a child element, not a `render` prop. Similarly, `AlertDialogAction` does not accept `variant` by default. These may cause runtime errors or silent rendering failures depending on the exact shadcn/ui version installed.
**Fix:** Use the standard shadcn/ui pattern:
```tsx
<AlertDialogTrigger asChild>
  <Button type="button" variant="outline" className="text-destructive">
    Disconnect
  </Button>
</AlertDialogTrigger>
```
For destructive action styling, apply className directly instead of variant.

## Info

### IN-01: `console.warn` left in Jira sync code

**File:** `src/lib/jira/sync.ts:114-117`
**Issue:** `console.warn` is used for logging when no matching Jira transition is found. This is fine for development but should use a structured logger in production.
**Fix:** Replace with a project logger or remove once the sync status is tracked via the `FAILED` sync record.

### IN-02: Recharts `rect` elements used incorrectly for bar coloring

**File:** `src/components/pm-dashboard/ai-usage-charts.tsx:140-144`
**Issue:** The BarChart renders child `<rect>` elements inside `<Bar>` to set per-bar colors, but Recharts expects `Cell` components for per-bar coloring, not raw `rect` elements. This may not render as intended.
**Fix:**
```tsx
import { Cell } from "recharts"
// Inside <Bar>:
{areaData.map((_, index) => (
  <Cell key={index} fill={AREA_COLORS[index % AREA_COLORS.length]} />
))}
```

### IN-03: `SyncStatusBadge` tooltip uses non-standard `render` prop

**File:** `src/components/jira/sync-status-badge.tsx:83`
**Issue:** `TooltipTrigger` is called with `render={<span className="inline-flex" />}`. Standard shadcn/ui uses `asChild` pattern. Same concern as WR-08.
**Fix:** Use `<TooltipTrigger asChild><span className="inline-flex">{badge}</span></TooltipTrigger>`

### IN-04: Defect Kanban column header label mismatch

**File:** `src/components/defects/defect-kanban.tsx:9`
**Issue:** The component comment says "5 columns: Open, In Progress, Fixed, Verified, Closed" but `DEFECT_STATUS_LABELS` maps `ASSIGNED` to `"In Progress"`. This is not a bug per se, but the comment and the actual status name (`ASSIGNED`) don't match. Minor documentation inconsistency.
**Fix:** Update the comment to match the actual status labels.

### IN-05: Unused `projectId` prop in DefectFilters

**File:** `src/components/defects/defect-filters.tsx:86`
**Issue:** `DefectFilters` accepts `projectId` in its props interface but never uses it in the component body. The destructured props omit it.
**Fix:** Remove `projectId` from the interface if not needed, or use it if filter URLs should be project-scoped.

---

_Reviewed: 2026-04-06T22:15:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
