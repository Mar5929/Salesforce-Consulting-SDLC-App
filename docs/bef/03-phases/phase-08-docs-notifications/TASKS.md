# Phase 8 Tasks: Documents, Notifications

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 9
> Status: 0/9 complete
> Last Updated: 2026-04-10

---

## Execution Order

```
Task 1 (schema alignment) ─────────────────────────────┐
  ├── Task 2 (recipient fixes)          ─┐              │
  ├── Task 3 (wire senders + rate limit)  ├── parallel   │
  └── Task 9 (notification UX)          ─┘              │
Task 4 (branding admin)    ─┐                           │
Task 5 (document versioning) ├── parallel with Tasks 2-3│
Task 7 (epic scope)        ─┘                           │
  └── Task 6 (new templates) ─── after 4, 5            │
       └── Task 8 (quality + UX) ─── last              │
```

---

## Tasks

### Task 1: NotificationType schema alignment + icon/route fixes

| Attribute | Details |
|-----------|---------|
| **Scope** | Add 9 missing values to NotificationType enum. Fix all mismatched type strings across the codebase. Update icon map, route map, and priority map in notification components. Run migration. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] NotificationType enum includes: DOCUMENT_GENERATED, QUESTION_CONFLICT, PROJECT_ARCHIVED, PROJECT_REACTIVATED, DEFECT_CREATED, DEFECT_STATUS_CHANGED, TEST_EXECUTION_RECORDED, TEAM_MEMBER_ADDED, RATE_LIMIT_WARNING
- [ ] `document-generation.ts` sends `DOCUMENT_GENERATED` (was invalid string)
- [ ] `question-impact.ts` sends `QUESTION_CONFLICT` (was invalid string)
- [ ] `project-archive.ts` sends `PROJECT_ARCHIVED` / `PROJECT_REACTIVATED` (was `AI_PROCESSING_COMPLETE`)
- [ ] `defects.ts` sends `DEFECT_CREATED` / `DEFECT_STATUS_CHANGED` (was story proxy types)
- [ ] `test-executions.ts` sends `TEST_EXECUTION_RECORDED` (was story proxy type)
- [ ] `notification-item.tsx` TYPE_ICONS has entries for all new types
- [ ] `notification-item.tsx` getEntityRoute routes DOCUMENT to documents page, DEFECT to story detail, etc.
- [ ] `notification-dispatch.ts` NOTIFICATION_PRIORITY has entries for all new types
- [ ] Migration runs successfully

**Implementation Notes:**
This is one migration + mechanical find-and-replace across ~6 action/function files + 2 component files. Do the schema migration first, then fix all type strings, then update the UI maps. Grep for `"DOCUMENT_GENERATED"`, `"QUESTION_CONFLICT"`, `"AI_PROCESSING_COMPLETE"` (in archive context), `"STORY_STATUS_CHANGED"` (in defect/test context) to find all sites.

---

### Task 2: Fix notification recipient resolution

| Attribute | Details |
|-----------|---------|
| **Scope** | Fix QUESTION_ASSIGNED fallback to throw instead of notifying everyone. Fix QUESTION_ANSWERED to target question owner + blocked story assignees. Add notification for question reassignment. |
| **Depends On** | Task 1 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] QUESTION_ASSIGNED switch case throws an error if `recipientMemberIds` is absent (guard against "notify everyone" fallback)
- [ ] When a question is reassigned via updateQuestion, a QUESTION_ASSIGNED notification is sent to the new assignee
- [ ] QUESTION_ANSWERED notification reaches: (1) the question's assigneeId, (2) assignees of stories in QuestionBlocksStory for this question
- [ ] QUESTION_ANSWERED no longer notifies all PM/BA/SA indiscriminately

**Implementation Notes:**
In `notification-dispatch.ts`:
- QUESTION_ASSIGNED case: `throw new Error("QUESTION_ASSIGNED requires explicit recipientMemberIds")`
- QUESTION_ANSWERED case: Query `prisma.question.findUnique({ where: { id: entityId }, include: { questionBlocksStory: { include: { story: { select: { assigneeId: true } } } } } })`. Collect assigneeId + all blocked story assignee IDs.

In `questions.ts` updateQuestion: If `assigneeId` changed, emit `NOTIFICATION_SEND` with `type: "QUESTION_ASSIGNED"` and `recipientMemberIds: [newAssigneeId]`.

---

### Task 3: Wire missing notification senders + rate limit alerts

| Attribute | Details |
|-----------|---------|
| **Scope** | Wire 6 dead notification senders: STORY_MOVED_TO_QA, DECISION_RECORDED, RISK_CHANGED, QUESTION_AGING (cron), TEAM_MEMBER_ADDED, JIRA_SYNC_REQUESTED consumer. Plus RATE_LIMIT_WARNING from Phase 2. |
| **Depends On** | Task 1 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] When a story status changes to QA, a STORY_MOVED_TO_QA notification is sent to the test assignee (or all QA members if no assignee)
- [ ] When a decision is created (via AI tool or action), a DECISION_RECORDED notification is sent to PM + SA + affected epic owners
- [ ] When a risk is created or severity changes, a RISK_CHANGED notification is sent to PM + SA
- [ ] A daily cron runs and sends QUESTION_AGING notifications to PM for questions open > 7 days
- [ ] Question aging batches into one notification per PM (not one per question)
- [ ] When a team member is added, a TEAM_MEMBER_ADDED notification is sent to all existing team members
- [ ] JIRA_SYNC_REQUESTED event has a consumer that triggers the sync (or the retry UI calls the action directly)
- [ ] When AI usage reaches 80% of daily or monthly limit, a RATE_LIMIT_WARNING is sent to PM + SA
- [ ] Rate limit warning fires only once per threshold crossing (not repeatedly at 81%, 82%, etc.)

**Implementation Notes:**
Most senders are one-liners — emit `inngest.send({ name: "NOTIFICATION_SEND", data: { ... } })` at the right point in the action/tool.

**QUESTION_AGING cron:** Create `src/lib/inngest/functions/question-aging.ts`:
```ts
export const questionAgingFunction = inngest.createFunction(
  { id: "question-aging-check" },
  { cron: "0 9 * * *" }, // Daily at 9am UTC
  async ({ step }) => {
    // Query all projects with questions WHERE status=OPEN AND createdAt < now - 7 days
    // Group by project, send one NOTIFICATION_SEND per project's PM
  }
);
```

**RATE_LIMIT_WARNING:** In `rate-limiter.ts`, after the daily/monthly check, if usage is between 80-100% and no warning was sent today (check via a simple flag or query), emit the notification.

---

### Task 4: Build branding admin system

| Attribute | Details |
|-----------|---------|
| **Scope** | Create BrandingConfig model, admin UI tab in settings, S3 logo upload, refactor branding.ts to load from DB, add logo rendering to all three document renderers. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] BrandingConfig model exists with projectId (unique), firmName, logoUrl, primaryColor, accentColor, fontFamily, footerText
- [ ] SA/PM can access a "Branding" tab in project settings to edit branding fields
- [ ] Logo upload accepts PNG/JPEG up to 2MB, stores to S3/R2, saves URL to BrandingConfig
- [ ] `branding.ts` loads BrandingConfig from DB for the project, falls back to hardcoded defaults if none exists
- [ ] DOCX documents render the logo in the header when logoUrl is present
- [ ] PPTX documents render the logo on the cover slide when logoUrl is present
- [ ] PDF documents render the logo in the header when logoUrl is present
- [ ] Documents generated for projects without BrandingConfig use default branding (no errors)

**Implementation Notes:**
Schema: See spec Section 3.3 for the full model.
Refactor `branding.ts`: Change from exporting a constant to exporting `async function getBrandingConfig(projectId: string): Promise<BrandingConfig>` that queries the DB with fallback.
Logo rendering: Each renderer needs a conditional block. For docx, fetch the image buffer from the URL and use `new ImageRun({ data: buffer, transformation: { width: 150, height: 50 } })`. Similar pattern for pptx and pdf.
Settings tab: Add alongside existing settings tabs. Gate with the existing Phase 1 role check.

---

### Task 5: Build document versioning model

| Attribute | Details |
|-----------|---------|
| **Scope** | Add version, parentDocumentId, and status fields to GeneratedDocument. Update generation flow to create version chains. Update UI to show version lineage with approve action. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] GeneratedDocument has `version Int @default(1)`, `parentDocumentId String?`, `status DocumentStatus @default(DRAFT)`
- [ ] DocumentStatus enum: DRAFT, APPROVED, SUPERSEDED
- [ ] When generating a document of a type+scope that already exists, the new doc links to the previous via parentDocumentId and increments version
- [ ] Previous version is marked SUPERSEDED when a new version is generated
- [ ] "Approve" action sets status to APPROVED (only one APPROVED per chain)
- [ ] Version history table shows version number, status badge, and approve button
- [ ] Migration runs successfully, existing documents get version 1 and DRAFT status

**Implementation Notes:**
In the document generation Inngest function's DB record step, before creating the new document:
```ts
const existing = await prisma.generatedDocument.findFirst({
  where: { projectId, documentType, scopeEpicId: scopeEpicId ?? null },
  orderBy: { version: "desc" },
});
const version = existing ? existing.version + 1 : 1;
const parentDocumentId = existing?.id ?? null;
if (existing) {
  await prisma.generatedDocument.update({ where: { id: existing.id }, data: { status: "SUPERSEDED" } });
}
```
Remove the computed version facade in `getDocuments` — use the actual `version` field instead.

---

### Task 6: Create new document templates

| Attribute | Details |
|-----------|---------|
| **Scope** | Create 5 new document template definitions: SOW, Test Script, Deployment Runbook, Training Material, Status Report. Register in templates/index.ts. |
| **Depends On** | Task 4 (branding loaded from DB), Task 5 (versioning in place) |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] SOW template generates a document with: scope, deliverables, timeline, assumptions, exclusions
- [ ] Test Script template generates grouped test cases with steps and expected results
- [ ] Deployment Runbook template generates pre-deploy checklist, deployment steps, rollback procedures, post-deploy verification
- [ ] Training Material template generates feature overviews with step-by-step instructions
- [ ] Status Report template generates project health summary, sprint progress, blockers, milestones, recent decisions
- [ ] All 5 templates are registered in templates/index.ts and selectable in the generation dialog
- [ ] Each template defines its context queries, section structure, and output schema
- [ ] Generated documents use project branding (from REQ-DOCS-004) and create version chains (from REQ-DOCS-005)

**Implementation Notes:**
Follow the existing template pattern in `templates/index.ts`. Each template file exports:
```ts
export const sowTemplate: DocumentTemplate = {
  documentType: "SOW",
  name: "Statement of Work",
  description: "...",
  sections: [...],
  contextQueries: ["getProjectSummary", "getEpicContext", "getMilestoneProgress", "getRequirements"],
  systemPrompt: "...",
  outputSchema: { ... },
};
```
The STATUS_REPORT template uses read-only context across all project data (same as briefing but formatted for client delivery). This is the Phase 2 GAP-AGENT-001 resolution.

---

### Task 7: Wire epic-scoped document generation

| Attribute | Details |
|-----------|---------|
| **Scope** | Fix the broken epic scope parameter flow from UI through all layers: generation dialog → server action → Inngest event → context loader. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Generation dialog shows epic selector when epics exist for the project
- [ ] Selected epicId is included in the generation request
- [ ] Server action schema accepts optional scopeEpicId
- [ ] Inngest event payload carries scopeEpicId
- [ ] Context loader filters all queries to the selected epic's scope when scopeEpicId is present
- [ ] Document title/header includes the epic name when scoped
- [ ] When no epic is selected, full project scope is used (current behavior preserved)

**Implementation Notes:**
1. `documents-client.tsx`: Change `epics={[]}` to pass actual epics from the server component's data fetch.
2. `generation-dialog.tsx`: Include `scopeEpicId` in the `executeGeneration` call (~line 118-126).
3. `documents.ts` action: Add `scopeEpicId: z.string().optional()` to `requestDocumentGenerationSchema`.
4. `document-generation.ts` Inngest: Pass `scopeEpicId` through event data to the content generation step.
5. `document-content.ts`: When `scopeEpicId` is present, filter context queries (e.g., `getOpenQuestions(projectId, { scopeEpicId })`, `getDecisionsForEpic(epicId)`, etc.).

---

### Task 8: Document generation quality + UX fixes

| Attribute | Details |
|-----------|---------|
| **Scope** | Add branding validation step to Inngest function, add token budget check before Claude call, add router.refresh() after generation completion. |
| **Depends On** | Task 4 (branding), Task 6 (templates define required sections) |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] AI-generated content is run through `postProcessOutput` (firm rules from Phase 2) before rendering
- [ ] Document generation logs a warning if any required section has empty content
- [ ] Context assembly estimates token count before calling Claude; truncates least important sections if over limit
- [ ] Token truncation logs which sections were truncated
- [ ] Documents list refreshes automatically after generation dialog closes (no manual page refresh needed)

**Implementation Notes:**
**Validation step:** In `document-generation.ts` Inngest function, after the "generate-content" step and before "render-document":
```ts
const validated = await step.run("validate-content", async () => {
  const processed = postProcessOutput(content); // Firm rules
  const emptySections = template.sections.filter(s => !processed[s.key]?.trim());
  if (emptySections.length > 0) log.warn(`Empty sections: ${emptySections.map(s => s.name).join(", ")}`);
  return processed;
});
```

**Token budget:** In `document-content.ts`, after assembling all context sections:
```ts
const estimatedTokens = Math.ceil(contextString.length / 4); // rough estimate
if (estimatedTokens > MAX_CONTEXT_TOKENS) {
  // Truncate sections by priority (template defines priority order)
}
```

**Page refresh:** In `generation-dialog.tsx` onComplete:
```ts
router.refresh(); // After dialog closes, refresh server component data
```

---

### Task 9: Notification UX improvements

| Attribute | Details |
|-----------|---------|
| **Scope** | Add priority-based visual differentiation to notification items. Make notification bell visible on all pages with cross-project support. |
| **Depends On** | Task 1 (all notification types have correct priorities) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] URGENT notifications show red dot + light red background tint
- [ ] HIGH notifications show orange dot
- [ ] NORMAL notifications show blue dot (current default)
- [ ] LOW notifications show gray dot
- [ ] Notification bell is visible on the project list page and all non-project routes
- [ ] When outside a project context, bell shows notifications from all user's projects
- [ ] Each notification in cross-project mode shows the project name as a label
- [ ] Unread count badge shows total across all projects when in cross-project mode
- [ ] When inside a project, bell filters to that project only (current behavior preserved)

**Implementation Notes:**
**Priority colors:** In `notification-item.tsx`, replace the static `bg-blue-600` dot with a dynamic class based on `notification.priority`:
```tsx
const priorityColors = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  NORMAL: "bg-blue-600",
  LOW: "bg-gray-400",
};
```
Add a light background tint for URGENT: `bg-red-50` on the entire notification row.

**Cross-project bell:** In `app-shell.tsx`, remove the `{activeProjectId && ...}` guard around the NotificationBell. Pass `projectId={activeProjectId}` (nullable). In `notification-bell.tsx`, when `projectId` is null, use a different query in `notifications.ts` that fetches across all projects where the user is an active member. Add project name to each notification item when in cross-project mode.

---

## Summary

| Task | Title | Depends On | Complexity | Status |
|------|-------|-----------|------------|--------|
| 1 | NotificationType schema alignment + icon/route fixes | — | M | Not Started |
| 2 | Fix notification recipient resolution | 1 | S | Not Started |
| 3 | Wire missing notification senders + rate limit alerts | 1 | M | Not Started |
| 4 | Build branding admin system | — | M | Not Started |
| 5 | Build document versioning model | — | M | Not Started |
| 6 | Create new document templates | 4, 5 | L | Not Started |
| 7 | Wire epic-scoped document generation | — | M | Not Started |
| 8 | Document generation quality + UX fixes | 4, 6 | S | Not Started |
| 9 | Notification UX improvements | 1 | M | Not Started |
