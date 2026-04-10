# Phase 8 Spec: Documents, Notifications

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [08-docs-notifications-gaps.md](./08-docs-notifications-gaps.md)
> Depends On: Phase 1 (RBAC, Security, Governance)
> Status: Draft
> Last Updated: 2026-04-10

---

## 1. Scope Summary

Fix the notification system (schema mismatches causing runtime errors, dead senders, wrong recipients, missing UX), build the branding administration system, add document versioning, create missing document templates, wire epic-scoped generation, and add document generation quality checks. This phase makes both the document generation and notification subsystems production-correct.

**In scope:** 19 domain gaps + 2 received from Phase 2 → 9 tasks
**Moved out:**
- GAP-DOCS-007 (inline DOCX/PPTX preview) → V2. Download workflow is functional.
- GAP-NOTIF-001 partial (HEALTH_SCORE_CHANGED sender) → Phase 7. Health score computation doesn't exist yet.
**Received from Phase 2:**
- GAP-AGENT-001 (STATUS_REPORT as document type variant in document templates)
- GAP-AGENT-008 notifications (80% rate limit threshold alerts)

---

## 2. Functional Requirements

### 2.1 NotificationType Schema Alignment (REQ-DOCS-001)

- **What it does:** Adds missing values to the `NotificationType` enum and fixes all code that sends invalid type strings. Updates the notification-item icon map and route map to cover all types.
- **Enum values to add:** `DOCUMENT_GENERATED`, `QUESTION_CONFLICT`, `PROJECT_ARCHIVED`, `PROJECT_REACTIVATED`, `DEFECT_CREATED`, `DEFECT_STATUS_CHANGED`, `TEST_EXECUTION_RECORDED`, `TEAM_MEMBER_ADDED`, `RATE_LIMIT_WARNING`
- **Type string fixes:**
  - `document-generation.ts`: Change `"DOCUMENT_GENERATED"` (currently invalid) → use new enum value
  - `question-impact.ts`: Change `"QUESTION_CONFLICT"` (currently invalid) → use new enum value
  - `project-archive.ts`: Change `"AI_PROCESSING_COMPLETE"` → `"PROJECT_ARCHIVED"` / `"PROJECT_REACTIVATED"`
  - `defects.ts`: Change proxy story types → `"DEFECT_CREATED"` / `"DEFECT_STATUS_CHANGED"`
  - `test-executions.ts`: Change proxy type → `"TEST_EXECUTION_RECORDED"`
- **Icon map:** Add entries for all new types in `notification-item.tsx` TYPE_ICONS
- **Route map:** Add entries for all new types in `notification-item.tsx` getEntityRoute (DOCUMENT → documents page, DEFECT → story detail, etc.)
- **Priority map:** Add entries for new types in `notification-dispatch.ts` NOTIFICATION_PRIORITY
- **Business rules:** This is a single migration that adds all enum values at once. All code changes are mechanical — find the incorrect type string, replace with the correct one.
- **Files:** `prisma/schema.prisma`, `notification-dispatch.ts`, `notification-item.tsx`, `document-generation.ts`, `question-impact.ts`, `project-archive.ts`, `defects.ts`, `test-executions.ts`

### 2.2 Notification Recipient Resolution Fixes (REQ-DOCS-002)

- **What it does:** Fixes two recipient resolution bugs:
  1. **QUESTION_ASSIGNED** (GAP-NOTIF-003): Add guard throw in the switch case fallback — if `recipientMemberIds` is absent, this is a code error, not a "notify everyone" scenario. Also wire a `QUESTION_ASSIGNED` notification when a question is reassigned via `updateQuestion`.
  2. **QUESTION_ANSWERED** (GAP-NOTIF-005): Change recipient resolution from "all PM/BA/SA" to "question owner + assignees of stories blocked by this question." Query `QuestionBlocksStory` → get story assignee memberIds → combine with question `assigneeId`.
- **Business rules:** Targeted notifications reduce noise. The PRD specifically calls out these recipients. The current "notify everyone" approach means PMs get notification spam for questions they're not involved in.
- **Files:** `notification-dispatch.ts` (switch cases), `questions.ts` (add notification for reassignment)

### 2.3 Wire Missing Notification Senders + Rate Limit Alerts (REQ-DOCS-003)

- **What it does:** Wires the 6 notification event senders that exist as dispatch cases but are never triggered, plus the rate limit alert from Phase 2:
  1. **STORY_MOVED_TO_QA**: In `stories.ts` status change handler, emit `NOTIFICATION_SEND` with type `STORY_MOVED_TO_QA` when new status is `QA`. Recipients: test assignee or all QA members.
  2. **DECISION_RECORDED**: In `create-decision.ts` tool (or wherever decisions are created outside transcript processing), emit notification. Recipients: PM + SA + affected epic owners.
  3. **RISK_CHANGED**: In `create-risk.ts` tool (or risk update), emit notification. Recipients: PM + SA.
  4. **QUESTION_AGING**: Create an Inngest cron function that runs daily, queries questions older than a threshold (default 7 days) that are still OPEN, and emits `NOTIFICATION_SEND` with type `QUESTION_AGING`. Recipient: PM.
  5. **TEAM_MEMBER_ADDED**: In team.ts `addMember` or `inviteMember`, emit notification. Recipients: all existing team members.
  6. **JIRA_SYNC_REQUESTED**: Wire an Inngest function to consume this event and trigger the Jira sync, or simplify by making the retry UI call the sync action directly.
  7. **RATE_LIMIT_WARNING** (from Phase 2): In `rate-limiter.ts`, when usage reaches 80% of daily or monthly limit, emit `NOTIFICATION_SEND` with type `RATE_LIMIT_WARNING`. Recipients: PM + SA.
- **Business rules:** The dispatch switch cases for most of these already exist — they just need senders. The question aging cron is the only new Inngest function. The rate limit alert hooks into Phase 2's `checkRateLimits` function.
- **Files:** `stories.ts`, `create-decision.ts` (or `decisions.ts` actions), `create-risk.ts` (or `risks.ts` actions), team actions, new `question-aging.ts` Inngest function, `rate-limiter.ts` (from Phase 2), `jira-sync.ts` or new consumer

### 2.4 Branding Admin System (REQ-DOCS-004)

- **What it does:** Replaces the hardcoded `BRANDING_CONFIG` with a database-backed branding configuration that SA/PM can manage through a settings UI.
- **Schema:** New `BrandingConfig` model: `id`, `projectId` (FK, unique), `firmName`, `logoUrl` (nullable), `primaryColor`, `accentColor`, `fontFamily`, `footerText`, `createdAt`, `updatedAt`
- **Admin UI:** New "Branding" tab in project settings (SA/PM only per Phase 1 role gates). Form fields for firm name, colors, font family, footer text. File upload for logo that stores to S3/R2 and saves URL.
- **Logo rendering:** Update all three renderers to conditionally render a logo when `logoUrl` is present:
  - docx-renderer.ts: Use `ImageRun` from `docx` library
  - pptx-renderer.ts: Use `slide.addImage`
  - pdf-renderer.tsx: Use `<Image>` from `@react-pdf/renderer`
- **Fallback:** If no BrandingConfig exists for a project, fall back to the current hardcoded defaults. This is a progressive enhancement — existing projects work without configuration.
- **Business rules:** Logo upload is limited to PNG/JPEG, max 2MB. Colors must be valid hex. Font family is a select from supported fonts (Calibri, Arial, Times New Roman, Helvetica). Changes take effect on next document generation — no retroactive updates to existing documents.
- **Files:** `prisma/schema.prisma`, `branding.ts` (refactor), new settings tab component, S3 upload action, all three renderers

### 2.5 Document Versioning Model (REQ-DOCS-005)

- **What it does:** Adds version lineage to the `GeneratedDocument` model so regenerations are tracked as version chains.
- **Schema changes:**
  - Add `version Int @default(1)` to GeneratedDocument
  - Add `parentDocumentId String?` (self-referencing FK, nullable)
  - Add `status` enum: `DRAFT`, `APPROVED`, `SUPERSEDED` (default DRAFT)
- **Generation flow:** When generating a document, check for existing documents of the same `documentType` + `scopeEpicId` (or project-level). If found, set the new document's `parentDocumentId` to the most recent one, increment version, and mark the previous one as `SUPERSEDED`.
- **UI:** Version history table shows version number, status badge, created date, and "Approve" action. Only one version can be `APPROVED` at a time per type+scope chain.
- **Business rules:** Version 1 has no parent. "Approve" sets status to APPROVED and keeps prior versions as SUPERSEDED. Deleting a document does not break the chain — `parentDocumentId` is nullable. The computed version facade in `getDocuments` is replaced by the actual `version` field.
- **Files:** `prisma/schema.prisma`, `documents.ts` (generation action + getDocuments), `version-history-table.tsx`, `document-generation.ts` (Inngest function)

### 2.6 New Document Templates (REQ-DOCS-006)

- **What it does:** Creates template definitions for the 5 missing document types:
  1. **SOW (Statement of Work)** — Scope, deliverables, timeline, assumptions, exclusions. Context: project summary, epics, milestones, requirements.
  2. **Test Script** — Test cases grouped by story/feature, steps, expected results. Context: stories with test cases, epic structure.
  3. **Deployment Runbook** — Pre-deployment checklist, deployment steps, rollback procedures, post-deployment verification. Context: stories in sprint, org components affected, decisions.
  4. **Training Material** — Feature overviews, step-by-step instructions, screenshots placeholders. Context: stories grouped by feature, business processes.
  5. **Status Report** (from Phase 2 deferral) — Project health, sprint progress, blockers, upcoming milestones, recent decisions. Context: read-only across all project data. This is a variant within document-content.ts, not a separate harness task.
- **Each template needs:** Section definitions, context loader config (which Layer 3 queries to run), system prompt template, output schema (JSON structure for renderer).
- **Business rules:** Templates follow the existing pattern in `templates/index.ts`. Each declares its `documentType`, `sections`, `contextQueries`, and `outputSchema`. The renderers already handle arbitrary section structures — templates just configure the content.
- **Files:** `src/lib/documents/templates/` (5 new template files), `templates/index.ts` (register exports)

### 2.7 Epic-Scoped Document Generation (REQ-DOCS-007)

- **What it does:** Wires the `scopeEpicId` parameter from the UI through every layer so documents can be generated scoped to a single epic.
- **Layers to fix:**
  1. **UI:** `documents-client.tsx` passes actual epics list (not `epics={[]}`) to `generation-dialog.tsx`
  2. **Dialog:** `generation-dialog.tsx` includes `scopeEpicId` in the `executeGeneration` call
  3. **Server action:** `requestDocumentGenerationSchema` adds `scopeEpicId` optional field
  4. **Inngest event:** Payload carries `scopeEpicId`
  5. **Context loader:** `document-content.ts` filters context queries by epic when `scopeEpicId` is present
- **Business rules:** When no epic is selected, generate project-wide (current behavior). When an epic is selected, all context queries filter to that epic's scope. The document title/header should include the epic name when scoped.
- **Files:** `documents-client.tsx`, `generation-dialog.tsx`, `documents.ts` (action schema), `document-generation.ts` (Inngest), `document-content.ts` (context loader)

### 2.8 Document Generation Quality + UX (REQ-DOCS-008)

- **What it does:** Three fixes:
  1. **Branding validation step** (GAP-DOCS-004): Add a validation step between render and upload in the Inngest function. Check: no empty required sections, firm rules compliance (Phase 2's `postProcessOutput` applied to AI content before rendering).
  2. **Token budget check** (GAP-DOCS-010): Before calling Claude, estimate assembled context token count. If it exceeds model limit, truncate least important sections (by priority order defined in template). Log a warning when truncation occurs.
  3. **Page refresh after generation** (GAP-DOCS-008): Add `router.refresh()` in the onComplete callback of `generation-dialog.tsx` so the documents list updates without manual page refresh.
- **Business rules:** Validation failures don't block generation — they log warnings and proceed (the document is still useful even if a section is thin). Token budget is a safety net, not a hard gate.
- **Files:** `document-generation.ts` (Inngest, validation step + token check), `document-content.ts` (token counting), `generation-dialog.tsx` (router.refresh)

### 2.9 Notification UX (REQ-DOCS-009)

- **What it does:** Two UX improvements:
  1. **Priority visual differentiation** (GAP-NOTIF-009): Add color coding to notification-item. URGENT: red dot + red-tinted background. HIGH: orange dot. NORMAL: blue dot (current). LOW: gray dot. The unread indicator changes color based on priority.
  2. **Cross-project notification bell** (GAP-NOTIF-010): Make the NotificationBell always visible in app-shell (remove the `activeProjectId &&` conditional). When outside a project context, the bell fetches notifications across all user's projects. When inside a project, it filters to that project (current behavior). Add project name label to each notification when in cross-project mode.
- **Business rules:** Priority ordering is preserved (URGENT first). Cross-project bell uses a separate query that joins through ProjectMember to find all projects for the current user. Notification count badge shows total unread across all projects when in cross-project mode.
- **Files:** `notification-item.tsx`, `notification-bell.tsx`, `notification-panel.tsx`, `app-shell.tsx`, `notifications.ts` (action — add cross-project query)

---

## 3. Technical Approach

### 3.1 Implementation Strategy

Fix the broken stuff first, build new stuff second:

1. **Schema alignment** (REQ-001) — Everything depends on correct enum values. One migration with all additions. Do first.
2. **Notification fixes** (REQ-002, REQ-003) — Fix recipients, wire senders. Now that the schema is correct, these are wiring changes.
3. **Document infrastructure** (REQ-004, REQ-005) — Branding and versioning are schema additions that new templates will use.
4. **Templates + scoping** (REQ-006, REQ-007) — Build on branding and versioning infrastructure.
5. **Quality + UX** (REQ-008, REQ-009) — Polish layer. Do last.

### 3.2 File/Module Structure

```
prisma/
  schema.prisma                         — MODIFY (NotificationType enum, BrandingConfig model, GeneratedDocument versioning fields, DocumentStatus enum)
src/lib/
  documents/
    branding.ts                         — MODIFY (refactor to load from DB with fallback)
    templates/
      index.ts                          — MODIFY (register 5 new templates)
      sow.ts                            — CREATE
      test-script.ts                    — CREATE
      deployment-runbook.ts             — CREATE
      training-material.ts              — CREATE
      status-report.ts                  — CREATE
    renderers/
      docx-renderer.ts                  — MODIFY (logo support)
      pptx-renderer.ts                  — MODIFY (logo support)
      pdf-renderer.tsx                  — MODIFY (logo support)
  inngest/
    functions/
      document-generation.ts            — MODIFY (validation step, token check, fix notification type)
      notification-dispatch.ts          — MODIFY (priority map, recipient fixes, new type routing)
      question-aging.ts                 — CREATE (cron function)
      question-impact.ts                — MODIFY (fix notification type)
    events.ts                           — MODIFY (new event types if needed)
  agent-harness/
    rate-limiter.ts                     — MODIFY (80% threshold notification)
    tasks/document-content.ts           — MODIFY (token budget, epic scope filtering)
src/actions/
  documents.ts                          — MODIFY (scope param, versioning logic)
  stories.ts                            — MODIFY (STORY_MOVED_TO_QA sender)
  questions.ts                          — MODIFY (reassignment notification)
  project-archive.ts                    — MODIFY (fix notification types)
  defects.ts                            — MODIFY (fix notification types)
  test-executions.ts                    — MODIFY (fix notification type)
  team.ts                               — MODIFY (TEAM_MEMBER_ADDED sender)
  notifications.ts                      — MODIFY (cross-project query)
src/components/
  documents/
    generation-dialog.tsx               — MODIFY (scope param, router.refresh)
    documents-client.tsx                — MODIFY (pass epics, version status)
    version-history-table.tsx           — MODIFY (version lineage, status badge, approve action)
  notifications/
    notification-item.tsx               — MODIFY (icon map, route map, priority colors)
    notification-bell.tsx               — MODIFY (cross-project mode)
    notification-panel.tsx              — MODIFY (project label in cross-project mode)
  layout/
    app-shell.tsx                       — MODIFY (always show bell)
  settings/
    branding-tab.tsx                    — CREATE (branding admin form + logo upload)
```

### 3.3 Data Changes

**Migration 1 — NotificationType enum expansion:**
```prisma
enum NotificationType {
  // ... existing values ...
  DOCUMENT_GENERATED
  QUESTION_CONFLICT
  PROJECT_ARCHIVED
  PROJECT_REACTIVATED
  DEFECT_CREATED
  DEFECT_STATUS_CHANGED
  TEST_EXECUTION_RECORDED
  TEAM_MEMBER_ADDED
  RATE_LIMIT_WARNING
}
```

**Migration 2 — BrandingConfig model:**
```prisma
model BrandingConfig {
  id           String   @id @default(cuid())
  projectId    String   @unique
  project      Project  @relation(fields: [projectId], references: [id])
  firmName     String   @default("Salesforce Consulting")
  logoUrl      String?
  primaryColor String   @default("#1a365d")
  accentColor  String   @default("#2b6cb0")
  fontFamily   String   @default("Calibri")
  footerText   String   @default("Confidential")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Migration 3 — Document versioning:**
```prisma
enum DocumentStatus {
  DRAFT
  APPROVED
  SUPERSEDED
}

model GeneratedDocument {
  // ... existing fields ...
  version          Int             @default(1)
  parentDocumentId String?
  parentDocument   GeneratedDocument? @relation("DocumentVersions", fields: [parentDocumentId], references: [id])
  childDocuments   GeneratedDocument[] @relation("DocumentVersions")
  status           DocumentStatus  @default(DRAFT)
}
```

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| Document generated with no BrandingConfig for project | Fall back to hardcoded defaults | N/A — transparent fallback |
| Logo upload exceeds 2MB | Reject with client-side validation | "Logo must be under 2MB" |
| Logo URL is broken/404 at render time | Render without logo, log warning | Document still generates |
| Version chain: delete middle version | Child's parentDocumentId becomes dangling (nullable FK) | Version history skips deleted entry |
| Epic-scoped generation with no stories in epic | Document generates with empty sections | Warning in generation log |
| Token budget exceeded for large project | Truncate least important context sections by template priority | Warning logged, document still generates |
| Notification enum value not in icon map | Fall back to default Bell icon | N/A — graceful degradation |
| Question aging cron finds 50+ stale questions | Batch into one notification per PM (not 50 separate notifications) | N/A |
| Cross-project bell with 100+ unread | Show "99+" badge, paginate panel | N/A |
| Approve document when another version already approved | Auto-supersede the previously approved version | N/A — only one APPROVED per chain |
| Rate limit at exactly 80% | Send one notification. Don't re-send at 81%, 82%, etc. | Use a flag on the day's/month's first threshold crossing |

---

## 5. Integration Points

### From Phase 1
- **Role gates** — Settings page (where branding admin lives) is already gated to SA/PM by Phase 1.
- **Auth foundation** — `getCurrentMember` correctly filters removed members.

### From Phase 2
- **Firm typographic rules** (REQ-HARNESS-003) — `postProcessOutput` is available for the branding validation step to use on AI-generated content before rendering.
- **Rate limiting** (REQ-HARNESS-005) — `checkRateLimits` in `rate-limiter.ts` is where the 80% threshold notification hooks in.
- **STATUS_REPORT_GENERATION** (GAP-AGENT-001) — Implemented here as a document template variant, not a harness task.

### For Future Phases
- **Phase 7 (Dashboards):** HEALTH_SCORE_CHANGED sender is deferred here — Phase 7 wires it when health score computation is built.
- **Phase 9 (QA/Jira):** Benefits from correct DEFECT_CREATED/DEFECT_STATUS_CHANGED/TEST_EXECUTION_RECORDED notification types. QA-specific notifications now route correctly.

---

## 6. Acceptance Criteria

**Notifications:**
- [ ] All notification types in the codebase match valid NotificationType enum values (no runtime Prisma errors)
- [ ] Document generation triggers a DOCUMENT_GENERATED notification that reaches the requesting user
- [ ] Project archive/reactivate sends correctly typed notifications (not AI_PROCESSING_COMPLETE)
- [ ] QA events (defects, test executions) send correctly typed notifications with proper routing
- [ ] QUESTION_ANSWERED notification reaches the question owner + blocked story assignees (not all PM/BA/SA)
- [ ] QUESTION_ASSIGNED fallback case throws an error instead of notifying everyone
- [ ] Question reassignment sends a QUESTION_ASSIGNED notification to the new assignee
- [ ] STORY_MOVED_TO_QA notification fires when a story status changes to QA
- [ ] QUESTION_AGING cron runs daily and notifies PM of questions open > 7 days
- [ ] TEAM_MEMBER_ADDED notification reaches all existing team members
- [ ] Rate limit 80% threshold sends a RATE_LIMIT_WARNING to PM + SA
- [ ] Notification bell is visible on all pages, including outside project context
- [ ] URGENT/HIGH notifications are visually distinguishable from NORMAL/LOW
- [ ] Cross-project notification bell shows notifications from all user's projects

**Documents:**
- [ ] BrandingConfig can be managed through project settings (firm name, logo, colors, font, footer)
- [ ] Logo appears in generated DOCX, PPTX, and PDF documents when configured
- [ ] Projects without BrandingConfig fall back to default branding
- [ ] GeneratedDocument has version, parentDocumentId, and status fields
- [ ] Regenerating a document increments version and links to parent
- [ ] Only one version per type+scope chain can be APPROVED
- [ ] SOW, Test Script, Deployment Runbook, Training Material, and Status Report templates are registered and functional
- [ ] Epic-scoped generation works end-to-end (UI scope selector → scoped context → scoped document)
- [ ] Document generation validates content before upload (no empty required sections)
- [ ] Token budget prevents context overflow for large projects
- [ ] Documents list refreshes automatically after generation completes
- [ ] No regressions in existing document generation or notification functionality

---

## 7. Open Questions

None — all scoping decisions resolved during deep dive.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 8`. GAP-DOCS-007 (inline preview) deferred to V2. HEALTH_SCORE_CHANGED sender deferred to Phase 7. Received GAP-AGENT-001 (status report template) and GAP-AGENT-008 notifications (rate limit alerts) from Phase 2. |
