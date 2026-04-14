# Phase 8 Spec: Documents, Notifications

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Depends On: Phase 1 (RBAC, Security, Governance), Phase 2 (Pipelines: `pending_review` + `conflicts_flagged`; `postProcessOutput`; model router for `MAX_CONTEXT_TOKENS`), Phase 6 (METADATA_SYNC_COMPLETE emit site), Phase 7 (HEALTH_SCORE_CHANGED handoff, SPRINT_CONFLICT_DETECTED origin), Phase 9 (archive `assertProjectWritable` helper per DECISION-10)
> Status: Draft (Wave 3 audit-fix 2026-04-14)
> Last Updated: 2026-04-14

---

## 1. Scope Summary

Fix the notification system (schema mismatches causing runtime errors, dead senders, wrong recipients, missing UX), build the branding administration system, add document versioning, create missing document templates, wire epic-scoped generation, and add document generation quality checks. This phase makes both the document generation and notification subsystems production-correct.

**In scope:** 19 domain gaps + 2 received from Phase 2 + Wave-3 audit fixes → 13 tasks
**Moved out:**
- GAP-DOCS-007 inline DOCX/PPTX preview (download workflow remains) — V1 delivers a PDF preview per DECISION-04; DOCX/PPTX inline preview stays V2 and is covered by PRD-16-06's "preview and download" clause via the PDF path.
- GAP-NOTIF-001 partial (HEALTH_SCORE_CHANGED sender) → Phase 7. Health score computation doesn't exist yet.
- Attachment storage backend (polymorphic attachments) — deferred to DECISION-12 / Phase 4 execution. Phase 8 owns document generation, not attachment storage.
**Received from Phase 2:**
- GAP-AGENT-001 (STATUS_REPORT as GeneratedDocument.documentType enum value per TECHNICAL_SPEC §2.2, implemented in `templates/status-report.ts`)
- GAP-AGENT-008 notifications (80% rate limit threshold alerts)

**Orphan ownership absorbed per DECISION-08:**
- PRD-5-14 — Story nullable test-assignee FK + QA fallback recipients (REQ-DOCS-003, STORY_MOVED_TO_QA sender).
- PRD-16-07 — Regeneration with user-supplied adjustments after preview (REQ-DOCS-011).

---

## Addendum v1 Amendments (April 13, 2026)

These amendments integrate PRD Addendum v1 into Phase 8. They are additive — existing requirements below are unchanged.

- **Pipeline notifications:** `pending_review` items (from Transcript Processing + Answer Logging pipelines) generate notifications when queued. `conflicts_flagged` records also trigger notifications. Phase 8 wires these into the existing notification dispatch infrastructure (fleshed out in REQ-DOCS-010).
- Pipeline run history may surface in the notification activity feed if time permits.
- **What does not change:** Word/PPT/PDF generation, notification delivery, recipient resolution.

## Wave 3 Audit-Fix Amendments (2026-04-14)

Cite `DECISION-nn` from `docs/bef/DECISIONS.md`.

- **DECISION-04 (PRD-16-06):** PDF in-browser preview added as REQ-DOCS-012 (Task 12). DOCX/PPTX inline preview remains V2; PDF satisfies the PRD preview clause for V1.
- **DECISION-07 (PRD-16-01):** BRD, SDD, and Client Deck (PPTX) templates added to Task 6. Each traces to PRD-16-01.
- **DECISION-08 orphans:** PRD-5-14 wired via STORY_MOVED_TO_QA recipient rule; PRD-16-07 wired via REQ-DOCS-011 (regeneration with adjustments).
- **DECISION-10:** Every doc-gen mutation entry point imports `assertProjectWritable(projectId)` from Phase 9. Tests verify archived-project calls return 409 / throw.
- **Six unwired PRD §17.8 senders (events 2, 3, 11, 12, 13, 14)** added to REQ-DOCS-003.
- **BrandingConfig** expanded to cover PRD-16-04 in full (header, cover page, font hierarchy, extended palette) and validation becomes a hard gate (PRD-16-03).
- **Version race condition** closed with unique constraint + transactional write.
- **Attachment storage** not in scope — deferred to DECISION-12.

---

## 2. Functional Requirements

### 2.1 NotificationType Schema Alignment (REQ-DOCS-001)

- **Traces to:** PRD-17-23 (all 14 §17.8 events), PRD-5-24, ADD-5.2.1, ADD-5.2.2.
- **What it does:** Adds missing values to the `NotificationType` enum and fixes all code that sends invalid type strings. Updates the notification-item icon map and route map to cover all types.
- **Enum values to add (V1 migration):** `DOCUMENT_GENERATED`, `QUESTION_CONFLICT`, `PROJECT_ARCHIVED`, `PROJECT_REACTIVATED`, `DEFECT_CREATED`, `DEFECT_STATUS_CHANGED`, `TEST_EXECUTION_RECORDED`, `TEAM_MEMBER_ADDED`, `RATE_LIMIT_WARNING`, `WORK_ITEM_UNBLOCKED`, `SPRINT_CONFLICT_DETECTED`, `STORY_REASSIGNED`, `STORY_STATUS_CHANGED`, `ARTICLE_FLAGGED_STALE`, `METADATA_SYNC_COMPLETE`, `PIPELINE_REVIEW_PENDING`, `PIPELINE_CONFLICT_FLAGGED`.
- **Notification.entityType enum additions:** `PENDING_REVIEW`, `CONFLICT_FLAG` (for pipeline virtual entities per ADD-5.2.1 / ADD-5.2.2).
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

- **Traces to:** PRD-17-23 (events 1, 2, 3, 5, 7, 8, 9, 10, 11, 12, 13, 14), PRD-5-14 (QA fallback), GAP-AGENT-008 (rate-limit warning).
- **What it does:** Wires every PRD §17.8 notification event sender that is currently a dead dispatch case or unwired entry point, plus the rate-limit alert from Phase 2. The complete 14-event matrix is resolved here (events 4, 6 tracked separately: 4 is AI_PROCESSING_COMPLETE re-point per §2.1; 6 is HEALTH_SCORE_CHANGED deferred to Phase 7).
- **Senders wired in Task 3 (one AC bullet per event):**
  1. **STORY_MOVED_TO_QA** (event 8, HIGH, PRD-17-23-08, PRD-5-14): In `stories.ts` status change handler, emit `NOTIFICATION_SEND` when new status is `QA`. Recipients: `story.testAssigneeId` if non-null; else all ProjectMember rows with role `QA` and status `ACTIVE`. PRD-5-14 fallback explicit in query.
  2. **DECISION_RECORDED** (event 9, MEDIUM): In `create-decision.ts` tool (and `decisions.ts` `createDecision` action), emit notification. Recipients: PM + SA + "affected epic owners" resolved via `Decision.featureId → Feature.epicId → Epic.ownerId` (document the FK chain; if `Decision.epicId` is direct, use it).
  3. **RISK_CHANGED** (event 10, HIGH): In `create-risk.ts` tool and `risks.ts` update action, emit notification on create OR severity change. Recipients: PM + SA.
  4. **QUESTION_AGING** (event 5, MEDIUM, PRD-17-23-05): New Inngest cron at 9am **project-local time** (from `Project.timezone`; fall back to UTC with logged note if unset). Query OPEN questions older than 7 days. Recipients: `question.assigneeId` (owner) **AND** project PM — matches PRD §17.8 table (previous "PM only" wording was incorrect). Cadence: one notification per (question, recipient) pair per 7-day threshold crossing; re-alert every 7 days the question remains open. Suppress duplicates via `Notification.createdAt >= now()-7d AND entityId=questionId AND type=QUESTION_AGING`.
  5. **TEAM_MEMBER_ADDED** (MEDIUM): In `team.ts` `addMember` / `inviteMember`, emit notification. Recipients: all `ProjectMember` rows where `projectId=:projectId AND status='ACTIVE' AND id != :newMemberId` (all roles).
  6. **JIRA_SYNC_REQUESTED**: Inngest consumer registered; fallback UI retry calls the sync action directly.
  7. **RATE_LIMIT_WARNING** (GAP-AGENT-008): In `rate-limiter.ts`, when usage reaches 80% of daily or monthly limit, emit notification. Recipients: PM + SA. One-shot per threshold per period.
  8. **WORK_ITEM_UNBLOCKED** (event 2, HIGH, PRD-17-23-02): Fired from `questions.ts` `answerQuestion` when the answer resolves any `QuestionBlocksStory` row. Recipients: unblocked story assignees + project PM.
  9. **SPRINT_CONFLICT_DETECTED** (event 3, HIGH, PRD-17-23-03): Fired from the Phase 7 sprint capacity / conflict-check module. Cross-phase handoff: Phase 7 owns detection; Phase 8 owns the dispatch wiring (the `NOTIFICATION_SEND` call site in the Phase 7 conflict-check function). Recipients: affected story assignees + PM.
  10. **STORY_REASSIGNED** (event 11, MEDIUM): Fired from `stories.ts` `updateStory` when `assigneeId` changes. Recipients: `[oldAssigneeId, newAssigneeId]` (filter out null).
  11. **STORY_STATUS_CHANGED** (event 12, LOW): Fired from `stories.ts` `updateStory` on status change (excluding moves to QA, which are covered by event 8). Recipients: `[story.assigneeId]` plus `sprint.pmId` when `story.sprintId` is non-null AND `sprint.status = 'ACTIVE'`.
  12. **ARTICLE_FLAGGED_STALE** (event 13, LOW): Fired from `knowledge-articles.ts` on `isStale=true` transition (consumer of Phase 2 `entity.changed` hook per DECISION-08 PRD-13-28). Recipients: project architect (role `SA`).
  13. **METADATA_SYNC_COMPLETE** (event 14, LOW): Fired from the Phase 6 Inngest org metadata sync function on success. Cross-reference Phase 6 sync function emit point. Recipients: project architect (role `SA`).
- **Archive gate (DECISION-10):** Every sender that runs inside a mutating action path MUST call `assertProjectWritable(projectId)` before emitting. Senders running purely on read/sync events (METADATA_SYNC_COMPLETE, RATE_LIMIT_WARNING) are exempt.
- **Business rules:** The dispatch switch cases for most existing events already exist — new senders add call sites. The question aging cron and cross-project stale-article cron are new Inngest functions. `NOTIFICATION_SEND` payload shape for each new sender is pinned in §3.4.
- **Files:** `stories.ts`, `create-decision.ts` (or `decisions.ts`), `create-risk.ts` (or `risks.ts`), `team.ts`, new `question-aging.ts` Inngest function, `rate-limiter.ts` (from Phase 2), `jira-sync.ts` consumer, `questions.ts` (WORK_ITEM_UNBLOCKED), Phase 7 sprint-conflict-check function (SPRINT_CONFLICT_DETECTED call site), `knowledge-articles.ts` (ARTICLE_FLAGGED_STALE), Phase 6 org-sync Inngest function (METADATA_SYNC_COMPLETE call site).

### 2.4 Branding Admin System (REQ-DOCS-004)

- **Traces to:** PRD-16-03, PRD-16-04, PRD-16-05.
- **What it does:** Replaces the hardcoded `BRANDING_CONFIG` with a database-backed branding configuration that SA/PM can manage through a settings UI. PRD-16-04 requires logo placement, color palette, font hierarchy, header/footer format, and cover page layout. All five are modeled.
- **Schema:** New `BrandingConfig` model: `id`, `projectId` (FK, unique), `firmName`, `logoUrl` (nullable), `primaryColor`, `accentColor`, `secondaryColor` (default `#4a5568`), `tertiaryColor` (default `#718096`), `headingFont` (default `Calibri`), `bodyFont` (default `Calibri`), `headerFormat Json` (per-renderer layout payload: logo placement, horizontal rule, page-number), `footerText`, `coverPageLayout Json` (cover template: logoPosition, titleStyle, subtitle, date slot), `createdAt`, `updatedAt`. All extended fields ship with defaults so existing records migrate without nulls.
- **Admin UI:** New "Branding" tab in project settings (SA/PM only per Phase 1 role gates). Form fields for firm name, colors, font family, footer text. File upload for logo that stores to S3/R2 and saves URL.
- **Logo rendering:** Update all three renderers to conditionally render a logo when `logoUrl` is present:
  - docx-renderer.ts: Use `ImageRun` from `docx` library
  - pptx-renderer.ts: Use `slide.addImage`
  - pdf-renderer.tsx: Use `<Image>` from `@react-pdf/renderer`
- **Fallback:** If no BrandingConfig exists for a project, fall back to the current hardcoded defaults. This is a progressive enhancement — existing projects work without configuration.
- **Business rules:** Logo upload is limited to PNG/JPEG, max 2MB. Colors must be valid hex. Font family is a select from supported fonts (Calibri, Arial, Times New Roman, Helvetica). Changes take effect on next document generation — no retroactive updates to existing documents.
- **Files:** `prisma/schema.prisma`, `branding.ts` (refactor), new settings tab component, S3 upload action, all three renderers

### 2.5 Document Versioning Model (REQ-DOCS-005)

- **Traces to:** PRD-16-02, PRD-16-07.
- **What it does:** Adds version lineage to the `GeneratedDocument` model so regenerations are tracked as version chains.
- **Schema changes:**
  - Add `version Int @default(1)` to GeneratedDocument
  - Add `parentDocumentId String?` (self-referencing FK, nullable)
  - Add `status` enum: `DRAFT`, `APPROVED`, `SUPERSEDED` (default DRAFT)
  - Add `validationErrors Json?` for hard-gate failures (see REQ-DOCS-008).
  - Add partial unique indexes: `@@unique([projectId, documentType, scopeEpicId, version])` (non-null scope) and `@@unique([projectId, documentType, version])` where `scopeEpicId IS NULL`. Postgres partial unique index implements the "null-scope sentinel" without a computed column.
- **Concurrency (closes GAP-09 race):** Version increment runs inside a Prisma `$transaction`. The transaction `SELECT ... FOR UPDATE` on the current max-version row for `(projectId, documentType, scopeEpicId)`, then inserts the new row with `version = N+1` and supersedes the parent. If the unique constraint fires on write (two races reached insert), retry once. Second retry failure surfaces a 409 to the caller.
- **Generation flow:** When generating a document, the transaction locks the latest row for the `(documentType, scopeEpicId)` chain, sets `parentDocumentId` to it, increments `version`, and marks the previous row `SUPERSEDED`.
- **UI:** Version history table shows version number, status badge, created date, and "Approve" action. Only one version can be `APPROVED` at a time per type+scope chain.
- **Business rules:** Version 1 has no parent. "Approve" sets status to APPROVED and keeps prior versions as SUPERSEDED. Deleting a document does not break the chain — `parentDocumentId` is nullable. The computed version facade in `getDocuments` is replaced by the actual `version` field.
- **Files:** `prisma/schema.prisma`, `documents.ts` (generation action + getDocuments), `version-history-table.tsx`, `document-generation.ts` (Inngest function)

### 2.6 New Document Templates (REQ-DOCS-006)

- **Traces to:** PRD-16-01 (all deliverable document types), DECISION-07 (BRD / SDD / Client Deck ownership).
- **What it does:** Creates template definitions for the 8 document types PRD-16-01 enumerates and that Phase 8 owns. STATUS_REPORT is a distinct `GeneratedDocument.documentType` enum value per TECHNICAL_SPEC §2.2 and is implemented in its own template file (the earlier "variant" wording is removed to reconcile with TECHNICAL_SPEC):
  1. **BRD (Business Requirements Document)** [DECISION-07, PRD-16-01] — Executive summary, business drivers, scope, functional requirements, non-functional requirements, success criteria. Context: epics, requirements, decisions, business processes. `documentType = BRD`.
  2. **SDD (Solution Design Document)** [DECISION-07, PRD-16-01] — Architecture overview, data model, integrations, security, deployment model. Context: Salesforce components (Phase 6 org KB), decisions, risks, epics. `documentType = SDD`.
  3. **Client Deck (PPTX Presentation)** [DECISION-07, PRD-16-01] — Title slide, executive summary, scope, timeline, team, next steps. Context: project summary + milestones. `documentType = PRESENTATION`.
  4. **SOW (Statement of Work)** [PRD-16-01] — Scope, deliverables, timeline, assumptions, exclusions. Context: project summary, epics, milestones, requirements. `documentType = SOW`.
  5. **Test Script** [PRD-16-01] — Test cases grouped by story/feature, steps, expected results. Context: stories with test cases, epic structure. `documentType = TEST_SCRIPT`.
  6. **Deployment Runbook** [PRD-16-01] — Pre-deployment checklist, deployment steps, rollback procedures, post-deployment verification. Context: stories in sprint, org components affected, decisions. `documentType = DEPLOYMENT_RUNBOOK`.
  7. **Training Material** [PRD-16-01] — Feature overviews, step-by-step instructions, screenshots placeholders. Context: stories grouped by feature, business processes. `documentType = TRAINING_MATERIAL`.
  8. **Status Report** (from Phase 2 deferral, GAP-AGENT-001) — Project health, sprint progress, blockers, upcoming milestones, recent decisions. Context: read-only across all project data. Implemented in `templates/status-report.ts`. `documentType = STATUS_REPORT` (matches TECHNICAL_SPEC §2.2 enum).
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

- **Traces to:** PRD-16-03 (branding compliance must-enforce), PRD-16-04, PRD-6-07 (context budget).
- **What it does:** Three fixes:
  1. **Branding validation as a hard gate** (GAP-DOCS-004, PRD-16-03): Validation step runs between render and upload. Checks: (a) `postProcessOutput` firm-rule compliance on AI content (Phase 2); (b) required sections non-empty; (c) if `BrandingConfig.logoUrl` is set, logo rendered successfully; (d) required colors/footer present. Failure writes `validationErrors` JSON on the GeneratedDocument row and sets `status = DRAFT` with an upload block; the doc is **not uploaded to S3/R2** until a user with role SA explicitly bypasses the gate (or the branding is fixed and validation re-runs). Non-SA roles see the validation errors but cannot bypass; they must ask an SA or correct the branding. This satisfies PRD-16-03 "must comply" rather than logging advisory warnings. The bypass action is audit-logged with the SA member id, reason (free-text, required), and the `validationErrors` JSON snapshot at bypass time.
  2. **Token budget check** (GAP-DOCS-010): Before calling Claude, estimate assembled context tokens. `MAX_CONTEXT_TOKENS` is sourced from the Phase 2 model router config (`modelRouter.getContextBudget(model)`; default 75% of the model's advertised window, e.g. `200_000 * 0.75 = 150_000` for Claude Sonnet). If the assembled context exceeds the budget, truncate least-important sections by template-declared priority. Log which sections were truncated.
  3. **Page refresh after generation** (GAP-DOCS-008): Add `router.refresh()` in the onComplete callback of `generation-dialog.tsx` so the documents list updates without manual page refresh.
- **Business rules:** Branding enforcement is blocking (PRD-16-03). Token budget is a safety net, not a hard gate.
- **Files:** `document-generation.ts` (Inngest, validation step + token check), `document-content.ts` (token counting), `generation-dialog.tsx` (router.refresh)

### 2.9 Notification UX (REQ-DOCS-009)

- **What it does:** Two UX improvements:
  1. **Priority visual differentiation** (GAP-NOTIF-009): Add color coding to notification-item. URGENT: red dot + red-tinted background. HIGH: orange dot. NORMAL: blue dot (current). LOW: gray dot. The unread indicator changes color based on priority.
  2. **Cross-project notification bell** (GAP-NOTIF-010): Make the NotificationBell always visible in app-shell (remove the `activeProjectId &&` conditional). When outside a project context, the bell fetches notifications across all user's projects. When inside a project, it filters to that project (current behavior). Add project name label to each notification when in cross-project mode.
- **Business rules:** Priority ordering is preserved (URGENT first). Cross-project bell uses a separate query that joins through ProjectMember to find all projects for the current user. Notification count badge shows total unread across all projects when in cross-project mode.
- **Files:** `notification-item.tsx`, `notification-bell.tsx`, `notification-panel.tsx`, `app-shell.tsx`, `notifications.ts` (action — add cross-project query)

### 2.10 Pipeline pending_review + conflicts_flagged Notifications (REQ-DOCS-010)

- **Traces to:** ADD-5.2.1, ADD-5.2.2.
- **What it does:** Wires notifications for Transcript Processing + Answer Logging pipeline outputs (`pending_review`, `conflicts_flagged`) per Addendum §5.2.
  - On `pending_review` row insert: emit `NOTIFICATION_SEND` with type `PIPELINE_REVIEW_PENDING`, `entityType = PENDING_REVIEW`, `entityId = pending_review.id`, priority `MEDIUM`. Recipients: project PM + BA.
  - On `conflicts_flagged` row insert: emit `NOTIFICATION_SEND` with type `PIPELINE_CONFLICT_FLAGGED`, `entityType = CONFLICT_FLAG`, `entityId = conflicts_flagged.id`, priority `MEDIUM`. Recipients: project PM + SA.
- **Batching:** If a single pipeline run emits more than 10 items of the same type, collapse into one summary notification per recipient (count + link to review queue) to avoid inbox spam.
- **Route map:** `PENDING_REVIEW → /projects/:id/pipelines/pending-review`; `CONFLICT_FLAG → /projects/:id/pipelines/conflicts`. Task 1 migration adds these to the `notification-item.tsx` getEntityRoute map and TYPE_ICONS.

### 2.11 Regeneration with Adjustments (REQ-DOCS-011)

- **Traces to:** PRD-16-07, DECISION-08 (orphan owner assignment).
- **What it does:** After previewing a generated document, users may request regeneration with user-supplied adjustment instructions (additional prompt, section overrides). Version-chain logic alone does not satisfy PRD-16-07; this REQ adds the adjustments mechanism.
- **Schema addition:** `requestDocumentGenerationSchema` gains `regenerationAdjustments: z.string().max(2000).optional()`. Inngest `document-generation` event payload carries the same field.
- **UI:** `generation-dialog.tsx` shows a textarea labeled "Adjustments from last version" when a prior version for this `(documentType, scopeEpicId)` exists. Placeholder: "Describe what to change from the last version (e.g., shorten executive summary, add risk section)."
- **Content loader:** `document-content.ts` loads the most recent prior version's rendered content as reference context and prepends `regenerationAdjustments` as an additional instruction block in the system prompt.
- **AC:** Regenerating with instruction "shorten executive summary" produces a version N+1 whose executive summary byte count is less than version N.

### 2.12 In-Browser PDF Preview (REQ-DOCS-012)

- **Traces to:** PRD-16-06, DECISION-04.
- **What it does:** V1 delivers in-browser PDF preview before doc persistence. DOCX/PPTX inline preview remains V2; the PDF preview path satisfies the PRD-16-06 preview clause for V1.
- **Flow:** After render and validation (§2.8), but before S3/R2 upload finalization, the PDF buffer is streamed to a signed temporary URL. The generation dialog displays the PDF inline via a `<iframe src={previewUrl}>` (or PDF.js worker). The user clicks "Accept & Save" to persist to S3/R2 (final URL stored on GeneratedDocument) or "Regenerate" to invoke REQ-DOCS-011.
- **For DOCX/PPTX outputs:** Preview generates an on-the-fly PDF rendition for the preview step only (using LibreOffice headless conversion if available, else a message "Preview not available for this format — download to review"). The final delivered file format remains DOCX/PPTX.
- **Archive gate:** Preview route honors DECISION-10 `assertProjectWritable` — archived projects cannot trigger previews.

### 2.13 TECHNICAL_SPEC Reconciliation (REQ-DOCS-013)

- **What it does:** Updates `docs/bef/01-architecture/TECHNICAL_SPEC.md` GeneratedDocument + Notification sections to reflect Phase 8 schema additions (version, parentDocumentId, status, validationErrors on GeneratedDocument; full enum values on NotificationType including pipeline + unwired-event additions; entityType additions PENDING_REVIEW, CONFLICT_FLAG). Removes the "STATUS_REPORT as variant" wording from Phase 8 docs; STATUS_REPORT is a first-class `documentType` enum value per TECHNICAL_SPEC.

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

**Migration 3a — NotificationType enum expansion (Wave 3 additions):**
```prisma
enum NotificationType {
  // ... existing values + v1 additions from Migration 1 ...
  WORK_ITEM_UNBLOCKED
  SPRINT_CONFLICT_DETECTED
  STORY_REASSIGNED
  STORY_STATUS_CHANGED
  ARTICLE_FLAGGED_STALE
  METADATA_SYNC_COMPLETE
  PIPELINE_REVIEW_PENDING
  PIPELINE_CONFLICT_FLAGGED
}

enum NotificationEntityType {
  // ... existing values ...
  PENDING_REVIEW
  CONFLICT_FLAG
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
  validationErrors Json?
  regenerationAdjustments String?

  @@unique([projectId, documentType, scopeEpicId, version], name: "uniq_gendoc_version_scoped")
}

// Partial unique index for null-scope chain (Postgres)
// CREATE UNIQUE INDEX uniq_gendoc_version_unscoped
//   ON "GeneratedDocument"(projectId, documentType, version)
//   WHERE scopeEpicId IS NULL;
```

### 3.4 Event Payload Contracts

Every new sender emits `NOTIFICATION_SEND` with a payload conforming to the table below.

| Event type | entityType | entityId source | recipientMemberIds resolution | priority | title template |
|------------|------------|-----------------|--------------------------------|----------|----------------|
| WORK_ITEM_UNBLOCKED | STORY | unblocked story id | `story.assigneeId` + project PM | HIGH | `"Story {story.key} unblocked"` |
| SPRINT_CONFLICT_DETECTED | SPRINT | sprint id | affected story assignees + PM | HIGH | `"Sprint {sprint.name}: capacity/dependency conflict"` |
| STORY_REASSIGNED | STORY | story id | `[oldAssigneeId, newAssigneeId]` filter null | MEDIUM | `"{story.key} reassigned"` |
| STORY_STATUS_CHANGED | STORY | story id | `[story.assigneeId]` + `sprint.pmId` if active | LOW | `"{story.key} → {newStatus}"` |
| STORY_MOVED_TO_QA | STORY | story id | `story.testAssigneeId ?? all ACTIVE QA ProjectMembers` | HIGH | `"{story.key} ready for QA"` |
| ARTICLE_FLAGGED_STALE | KNOWLEDGE_ARTICLE | article id | project SA | LOW | `"Article '{article.title}' flagged stale"` |
| METADATA_SYNC_COMPLETE | PROJECT | project id | project SA | LOW | `"Metadata sync complete"` |
| PIPELINE_REVIEW_PENDING | PENDING_REVIEW | pending_review row id | PM + BA | MEDIUM | `"{N} items pending review"` |
| PIPELINE_CONFLICT_FLAGGED | CONFLICT_FLAG | conflicts_flagged row id | PM + SA | MEDIUM | `"{N} conflicts flagged"` |
| DECISION_RECORDED | DECISION | decision id | PM + SA + `Decision.featureId → Feature.epicId → Epic.ownerId` | MEDIUM | `"Decision recorded: {decision.title}"` |
| TEAM_MEMBER_ADDED | PROJECT | project id | `ProjectMember where projectId=? and status=ACTIVE and id != newMemberId` | MEDIUM | `"{member.name} joined the project"` |
| QUESTION_AGING | QUESTION | question id | `question.assigneeId` + project PM | MEDIUM | `"Question open {days}d: {question.text}"` |
| RATE_LIMIT_WARNING | PROJECT | project id | PM + SA | HIGH | `"AI usage at 80% ({period})"` |

**Cross-project notification query (§2.9 bell):**
```ts
prisma.notification.findMany({
  where: {
    recipient: { memberId: currentMember.id },
    project: { members: { some: { memberId: currentMember.id, status: "ACTIVE" } } },
  },
  include: { project: { select: { id: true, name: true } } },
  orderBy: { createdAt: "desc" },
  take: 50,
});
```

**`assertProjectWritable` import (DECISION-10):** Every mutation entry point in Phase 8 (doc generation trigger, branding upload, regeneration request, approve/supersede action, pipeline notification emit sites that run inside a write path) imports `assertProjectWritable` from Phase 9's published interface and calls it before the mutation. Tests assert that calls against an archived project throw `ProjectArchivedError` / return HTTP 409.

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
| Two concurrent regenerations for same (documentType, scopeEpicId) | Second write blocks on the `SELECT ... FOR UPDATE` in the generation transaction; both proceed sequentially producing version N+1 then N+2. | If unique constraint fires, retry once; second failure returns 409 |
| Dispatch failure for one of multiple recipients | Successful recipients remain delivered; failed recipient retried by Inngest per function retry policy. Partial success logged. | N/A — Inngest retry |
| Large logo image (>10MB decoded) renders slowly | Renderer enforces a 10s decode timeout; on timeout, render without logo and write `validationErrors.logo = "decode timeout"`. | Validation gate treats as failure requiring acknowledgment |
| Cross-project bell: member removed from project after notifications exist | Notifications for that project are filtered out (query joins `ProjectMember where status=ACTIVE`). | Graceful hide |
| Question aging re-alert cadence | Suppress duplicates for (question, recipient) when a QUESTION_AGING notification exists within the last 7 days. | N/A |
| Question aging timezone | Cron at 9am `Project.timezone`; fall back to UTC with logged note if unset. | N/A |
| Mutation attempted on archived project | `assertProjectWritable` throws `ProjectArchivedError` → 409 response (DECISION-10). | HTTP 409, notification not emitted |
| Token field stripping on regenerationAdjustments | AI output sanitization (PRD-22-05, Phase 2 owner) strips secrets from adjustments text before persisting. | N/A |

---

## 5. Integration Points

### From Phase 1
- **Role gates** — Settings page (where branding admin lives) is already gated to SA/PM by Phase 1.
- **Auth foundation** — `getCurrentMember` correctly filters removed members.

### From Phase 2
- **Firm typographic rules** (REQ-HARNESS-003) — `postProcessOutput` is available for the branding validation step to use on AI-generated content before rendering.
- **Rate limiting** (REQ-HARNESS-005) — `checkRateLimits` in `rate-limiter.ts` is where the 80% threshold notification hooks in.
- **STATUS_REPORT_GENERATION** (GAP-AGENT-001) — Implemented here as a document template variant, not a harness task.

### From Phase 6
- **METADATA_SYNC_COMPLETE emit site:** Phase 6's org metadata sync Inngest function fires `NOTIFICATION_SEND` on successful completion. Phase 8 owns the dispatch wiring + entityType routing.

### From Phase 9 (DECISION-10)
- **`assertProjectWritable(projectId)`:** Imported at every doc-gen mutation entry point (generation trigger, branding upload, approve/supersede, regeneration request). Throws `ProjectArchivedError` for archived projects. Tests verify archived calls return 409.

### For Future Phases
- **Phase 7 (Dashboards):** HEALTH_SCORE_CHANGED sender is deferred here — Phase 7 wires it when health score computation is built. Phase 7 also owns SPRINT_CONFLICT_DETECTED detection; Phase 8 wires the dispatch call at the Phase 7 call site.
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

**Wave 3 additions:**
- [ ] All 14 PRD §17.8 events have a sender wired (6, 7, 8, 9, 10: pass; 4: re-pointed; 6: deferred to Phase 7; 2, 3, 5, 11, 12, 13, 14: wired here) — one AC bullet per event in Task 3.
- [ ] BRD, SDD, Client Deck (PPTX), SOW, Test Script, Deployment Runbook, Training Material, Status Report templates registered (PRD-16-01 / DECISION-07).
- [ ] Regeneration with user-supplied adjustments round-trips end-to-end (PRD-16-07 / DECISION-08). Regeneration with "shorten executive summary" produces a smaller executive summary in version N+1.
- [ ] PDF preview renders inline before persistence (DECISION-04 / PRD-16-06).
- [ ] BrandingConfig covers PRD-16-04 in full (header format, cover page layout, heading/body fonts, extended palette).
- [ ] Branding validation is a hard gate; non-compliant output is not uploaded until acknowledged (PRD-16-03).
- [ ] Version chain unique constraint + transactional write prevent races (GAP-09).
- [ ] `assertProjectWritable` called at every doc-gen mutation entry point; archived-project calls return 409 (DECISION-10).
- [ ] TECHNICAL_SPEC §2.2 updated to include GeneratedDocument version/parentDocumentId/status/validationErrors + all new NotificationType enum values + PENDING_REVIEW/CONFLICT_FLAG entityTypes (REQ-DOCS-013).
- [ ] Task 10 (pipeline pending_review + conflicts_flagged notifications) has recipient rules, entityType mapping, and priority fleshed out per §2.10.

---

## 7. Open Questions

None — Wave 3 audit fixes (2026-04-14) closed all gaps from the 2026-04-13 PRD-traceability audit. Outstanding items are cross-phase handoffs tracked via DECISIONs (DECISION-04, 07, 08, 10).

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 8`. GAP-DOCS-007 (inline preview) deferred to V2. HEALTH_SCORE_CHANGED sender deferred to Phase 7. Received GAP-AGENT-001 (status report template) and GAP-AGENT-008 notifications (rate limit alerts) from Phase 2. |
| 2026-04-14 | Wave 3 audit-fix | Applied 12 gaps from the 2026-04-13 Phase 8 audit. Added PDF preview (DECISION-04), BRD/SDD/Client Deck templates (DECISION-07), orphan requirements PRD-5-14 + PRD-16-07 (DECISION-08), archive gate imports (DECISION-10), six unwired PRD §17.8 senders, pipeline notification REQ-DOCS-010, regeneration-with-adjustments REQ-DOCS-011, PDF preview REQ-DOCS-012, TECHNICAL_SPEC reconciliation REQ-DOCS-013. BrandingConfig expanded to cover PRD-16-04 in full; validation becomes a hard gate per PRD-16-03. Version race closed via unique constraint + FOR UPDATE transaction. Question aging aligned to PRD §17.8 (owner + PM) with timezone + cadence rules. |
