# Gap Analysis: Documents and Notifications — Sections 16 and 17.8

**PRD:** `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/archive/SF-Consulting-AI-Framework-PRD-v2.1.md` (Sections 16, 17.8)
**Audited:** 2026-04-08

---

### Document Generation Gaps

---

### GAP-DOCS-001: Missing document types — SOW, SDD, Training Material, Deployment Runbook
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 16.1
- **What PRD says:** Word documents include BRDs, SDDs, SOWs, requirements documents, technical specifications, training materials, and status reports. PDFs include test scripts, formal deliverables, sign-off documents, and deployment runbooks.
- **What exists:** Four templates are registered in `src/lib/documents/templates/index.ts`: `discovery-report` (BRD), `requirements-doc` (SDD), `sprint-summary` (STATUS_REPORT), and `executive-brief` (PRESENTATION). The `DocumentType` enum in `prisma/schema.prisma` (line 385) includes SOW, TEST_SCRIPT, DEPLOYMENT_RUNBOOK, and TRAINING_MATERIAL — but no templates back any of those types.
- **The gap:** Six of the ten PRD-specified document types have no template definition. SOW, TEST_SCRIPT, DEPLOYMENT_RUNBOOK, and TRAINING_MATERIAL cannot be generated at all. The `SDD` type has a template but it's named "Requirements Document" and covers functional requirements — it does not serve as a system design document. There is also no technical specification template.
- **Scope estimate:** L
- **Dependencies:** None
- **Suggested phase grouping:** Document Template Expansion

---

### GAP-DOCS-002: Branding is fully hardcoded — no admin-configurable assets
- **Severity:** Significant
- **Perspective:** Architecture
- **PRD Reference:** Section 16.2
- **What PRD says:** "Branding assets and templates are stored in the application's file storage. When branding is updated (e.g., a logo change), all future document generation uses the updated assets."
- **What exists:** `src/lib/documents/branding.ts` exports a `BRANDING_CONFIG` constant with `firmName: "Salesforce Consulting"`, `logoPath: null` (V1 stub), hardcoded hex colors, font family "Calibri", and footer text "Confidential". The comment acknowledges this is a V1 simplification. There is no database model for branding configuration, no admin UI to update it, and no file storage reference for a logo.
- **The gap:** Branding cannot be updated without a code change and redeployment. The PRD requirement that a logo change takes effect immediately for future documents is unmet. `logoPath: null` means no logo appears in any generated document — header/footer is text-only. Cover pages across all three renderers show "Salesforce Consulting" text in place of any logo asset.
- **Scope estimate:** M
- **Dependencies:** GAP-DOCS-003 (logo rendering)
- **Suggested phase grouping:** Branding Administration

---

### GAP-DOCS-003: No logo rendering in any format renderer
- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 16.2
- **What PRD says:** "Firm logo placement (cover page, headers, footers as defined in the template)."
- **What exists:** All three renderers (`docx-renderer.ts`, `pptx-renderer.ts`, `pdf-renderer.tsx`) check only `BrandingConfig.firmName` for the header. `logoPath` is defined in the `BrandingConfig` interface but is set to `null` in `BRANDING_CONFIG`. None of the three renderers contain any logic to conditionally render a logo image — there is no `if (branding.logoPath)` branch in any renderer.
- **The gap:** Even if `logoPath` were populated, no renderer would use it. Logo support is absent from the rendering layer entirely. The docx renderer (`src/lib/documents/renderers/docx-renderer.ts`) would need an `ImageRun` from the `docx` library; the pptx renderer would need `slide.addImage`; the pdf renderer would need `<Image>` from `@react-pdf/renderer`.
- **Scope estimate:** S
- **Dependencies:** GAP-DOCS-002
- **Suggested phase grouping:** Branding Administration

---

### GAP-DOCS-004: No branding validation step in document generation workflow
- **Severity:** Minor
- **Perspective:** Architecture
- **PRD Reference:** Section 16.3 (step 4)
- **What PRD says:** "The harness validates the output against typographic and branding rules."
- **What exists:** The `generateDocumentFunction` in `src/lib/inngest/functions/document-generation.ts` has four steps: generate content, render document, upload to S3, create DB record. There is no validation step between rendering and upload. The AI output is parsed from JSON (with a fallback if parsing fails), then immediately passed to the renderer.
- **The gap:** No branding validation occurs. The system cannot detect if the AI omitted a required section, if section content is empty, or if font/color rules were violated. The PRD explicitly calls this out as step 4 of the workflow.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Document Generation Quality

---

### GAP-DOCS-005: Scope parameter collected in UI but silently discarded — epic-scoped generation not implemented
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 16.3
- **What PRD says:** The generation workflow assembles "relevant project context for that document type." The implication is context can be scoped.
- **What exists:** `src/components/documents/generation-dialog.tsx` renders a scope selector (`scopeEpicId` state, lines 68 and 202–216) when epics are provided. However, `DocumentsClient` passes `epics={[]}` (line 94 of `documents-client.tsx`) so the selector never appears. Furthermore, `scopeEpicId` is captured in state but never included in the `executeGeneration` call (line 118–126 of `generation-dialog.tsx`) — it is not passed to `requestDocumentGeneration`. The server action schema (`requestDocumentGenerationSchema` in `documents.ts`) has no `scopeEpicId` field. The Inngest event payload carries no scope. `executeDocumentContentTask` accepts no scope parameter.
- **The gap:** Epic-scoped document generation is stubbed in the UI but broken at every layer below it. A user requesting a requirements document scoped to one epic gets the same full-project document as if no scope were selected. The UI dialog always hides the scope selector due to the hardcoded empty epics prop.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Document Generation Quality

---

### GAP-DOCS-006: No document versioning model — version numbers are a computed facade
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 16.3 (step 6)
- **What PRD says:** "They can request regeneration with adjustments." Implies version history is meaningful and documents are differentiated from each other.
- **What exists:** The `GeneratedDocument` model in `prisma/schema.prisma` (lines 1158–1173) has no `version` field and no `parentDocumentId` foreign key. Version numbers in `getDocuments` (`src/actions/documents.ts` lines 165–176) are computed at query time by counting documents of the same `documentType` ordered by `createdAt`. This is a display-only façade — there is no version lineage, no way to see what changed between v1 and v2 of a BRD, and no ability to mark a specific version as "approved" or "current."
- **The gap:** The PRD implies users can regenerate with adjustments and track the version that was sent to the client. The current model treats each generation as an independent document — there is no concept of "this is v2 of the same document." If a user generates a Discovery Report, then a Requirements Doc, then another Discovery Report, the second Discovery Report is labeled v2 but has no connection to v1 in the data model.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Document Versioning

---

### GAP-DOCS-007: No inline preview for DOCX or PPTX formats
- **Severity:** Minor
- **Perspective:** UX
- **PRD Reference:** Section 16.3 (step 6)
- **What PRD says:** "The user previews and downloads the document."
- **What exists:** `src/components/documents/document-preview.tsx` renders a PDF via an `<iframe>` when `document.format === "PDF"`. For DOCX and PPTX it renders a metadata card with a download button and a message: "Inline preview is not available for Word/PowerPoint files."
- **The gap:** Two of the three supported formats have no preview capability. Users must download to see content, which is a meaningful friction point for a review-before-share workflow. The PRD presents preview as part of the standard workflow, not optional. Integration with a service like Google Docs Viewer or Microsoft Office Online viewer would satisfy this without hosting infrastructure.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Document UX

---

### GAP-DOCS-008: Generation progress polling has no page refresh after completion
- **Severity:** Minor
- **Perspective:** UX
- **PRD Reference:** Section 16.3
- **What PRD says:** Implicit — generated documents should appear in the list after generation completes.
- **What exists:** `src/components/documents/generation-progress.tsx` polls every 3 seconds via `getDocuments` server action, detects completion, shows a toast, then calls `onComplete()` which closes the dialog after 2 seconds (via `setTimeout` in `generation-dialog.tsx` line 131). The documents page (`documents-client.tsx`) is a client component that receives the initial `documents` prop from the server component — it does not re-fetch after the dialog closes.
- **The gap:** After the generation dialog closes, the newly generated document does not appear in the version history table without a manual page refresh. The `onComplete` callback in `GenerationProgress` closes the dialog but does not trigger a data refresh in `DocumentsClient`. SWR or a router refresh call (`router.refresh()`) is absent from the completion flow.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Document UX

---

### GAP-DOCS-009: `DOCUMENT_GENERATED` notification type not in schema enum — runtime type mismatch
- **Severity:** Critical
- **Perspective:** Architecture
- **PRD Reference:** Section 16.3 (step 5 of workflow), Section 17.8
- **What PRD says:** Document generation should trigger a notification to the requesting user.
- **What exists:** `src/lib/inngest/functions/document-generation.ts` (line 103) sends a `NOTIFICATION_SEND` event with `type: "DOCUMENT_GENERATED"`. The `NotificationType` enum in `prisma/schema.prisma` (lines 314–329) does not include `DOCUMENT_GENERATED` — it includes `AI_PROCESSING_COMPLETE` instead. The `notificationDispatchFunction` (`notification-dispatch.ts` line 207) does a `prisma.notification.createMany` with `type: type as any`, which bypasses TypeScript but will fail at runtime with a Prisma validation error because `"DOCUMENT_GENERATED"` is not a valid enum value in the database.
- **The gap:** Every document generation will successfully run the four Inngest steps (content, render, upload, DB record) but will fail silently at step 5 — the `NOTIFICATION_SEND` event with an invalid type will cause the `notificationDispatchFunction` to throw a Prisma error when attempting `createMany`. The requesting user never receives a "document ready" notification. The `notification-item.tsx` icon map also has no `DOCUMENT_GENERATED` entry (line 53–68), so even if it were fixed in the enum it would fall back to the default `Bell` icon.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Document Notification Wiring

---

### GAP-DOCS-010: Context query hardcoded — no token budget management for large projects
- **Severity:** Minor
- **Perspective:** Architecture
- **PRD Reference:** Section 16.3 (step 2)
- **What PRD says:** "The AI agent harness assembles the relevant project context for that document type."
- **What exists:** `src/lib/agent-harness/tasks/document-content.ts` assembles context by running all section queries in parallel (`Promise.all`, line 408). Each query has hardcoded `take` limits (50 questions, 20 epics, 30 stories per feature, etc.) but there is no total token budget check. The assembled context is passed to `executeTask` which calls Claude with a single-turn prompt — if the assembled context exceeds the model's context window, the API call will fail with a 400 error and the Inngest step will retry twice before the entire generation job fails.
- **The gap:** Large projects with extensive knowledge bases can cause document generation to fail silently after all retries are exhausted. The `CLAUDE.md` technical spec explicitly calls for a context window budget, but none is implemented in the document generation path.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Document Generation Quality

---

### Notification System Gaps

---

### GAP-NOTIF-001: Five of fourteen PRD notification event types have no senders — dispatch cases are dead code
- **Severity:** Critical
- **Perspective:** Functionality
- **PRD Reference:** Section 17.8
- **What PRD says:** 14 distinct notification events with recipients and priorities, including: "New decision recorded (PM + SA + affected epic owners)", "Risk created or severity changed (PM + SA)", "Story moved to QA (test assignee or all QA members)", "Question aging past threshold (PM)", "Health score changed (PM + architect)."
- **What exists:** `notification-dispatch.ts` has switch cases for `QUESTION_AGING`, `HEALTH_SCORE_CHANGED`, `DECISION_RECORDED`, `RISK_CHANGED`, and `STORY_MOVED_TO_QA`. These cases are reachable only if a `NOTIFICATION_SEND` event is sent with those types. A search across all actions and Inngest functions finds zero files that send `NOTIFICATION_SEND` with any of those five types:
  - `QUESTION_AGING`: No Inngest cron or staleness function sends this. The `stalenessDetectionFunction` flags stale articles but does not check question age.
  - `HEALTH_SCORE_CHANGED`: No function computes or monitors health score changes.
  - `DECISION_RECORDED`: There is no `decisions.ts` actions file. Decisions are created only via the AI chat pipeline with no notification emission.
  - `RISK_CHANGED`: There is no `risks.ts` actions file. Risks are created via the AI chat pipeline with no notification emission.
  - `STORY_MOVED_TO_QA`: `stories.ts` sends `STORY_STATUS_CHANGED` for all status transitions but does not emit a separate `STORY_MOVED_TO_QA` event when `status === "QA"`.
- **The gap:** Five of the fourteen PRD notification events will never fire under any user interaction in the current codebase. The dispatch logic for these types exists but is unreachable dead code.
- **Scope estimate:** L
- **Dependencies:** None for STORY_MOVED_TO_QA (fix in stories.ts). QUESTION_AGING requires a cron/scheduled Inngest function. HEALTH_SCORE_CHANGED requires a health score computation module. DECISION_RECORDED and RISK_CHANGED require actions files for those entities.
- **Suggested phase grouping:** Notification Event Wiring

---

### GAP-NOTIF-002: PROJECT_ARCHIVED and PROJECT_REACTIVATED send incorrect notification type
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.8 (by implication — significant project lifecycle events warrant notification)
- **What PRD says:** Team members should be notified of significant project state changes.
- **What exists:** `src/actions/project-archive.ts` (lines 73 and 136) sends `NOTIFICATION_SEND` with `type: "AI_PROCESSING_COMPLETE"` for both project archive and reactivation events, with a comment: `// Using existing type for project lifecycle`. This means archival/reactivation notifications appear in the UI as "AI processing complete" with a `FileText` icon, which is semantically wrong and confusing.
- **The gap:** There is no `PROJECT_ARCHIVED` or `PROJECT_REACTIVATED` enum value in `NotificationType`. The events are piggybacking on an unrelated type. The milestone audit (`.planning/v1.0-MILESTONE-AUDIT.md` line 107) also flags that `PROJECT_ARCHIVED`/`PROJECT_REACTIVATED` Inngest events have no consumers — the archive events are sent but nothing subscribes to them for background processing.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Notification Event Wiring

---

### GAP-NOTIF-003: QUESTION_ASSIGNED recipient resolution always uses the fallback — specificity lost
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.8 — "New question assigned: Assigned owner, Priority: MEDIUM"
- **What PRD says:** The assigned owner receives the notification.
- **What exists:** `src/actions/questions.ts` (lines 120–133) correctly sends `NOTIFICATION_SEND` with `type: "QUESTION_ASSIGNED"` and `recipientMemberIds: [parsedInput.assigneeId]`. However, the `notificationDispatchFunction` step 1 checks `if (recipientMemberIds && recipientMemberIds.length > 0)` first (line 88) and should short-circuit to use the explicit list. But the `QUESTION_ASSIGNED` case in the `switch` statement (lines 104–106) returns `excludeActor(activeMembers)` — i.e., **all active members except the actor**. This case is only reached when `recipientMemberIds` is absent. The logic is correct for the happy path, but the switch case for `QUESTION_ASSIGNED` contradicts the code comment `// Question assigned -> assignee only (handled via explicit recipientMemberIds)` — if `recipientMemberIds` were somehow absent, every active member would receive the notification instead of just the assignee.
- **The gap:** The comment documents that this case should never be reached, but there is no guard to throw an error if it is. Additionally, when a question is reassigned (owner changed via `updateQuestion`), no `QUESTION_ASSIGNED` notification is sent for the new assignee — the `updateQuestion` action does not emit any notification for ownership changes.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Notification Event Wiring

---

### GAP-NOTIF-004: QUESTION_CONFLICT notification type sent by question-impact function but absent from schema
- **Severity:** Significant
- **Perspective:** Architecture
- **PRD Reference:** Section 17.8
- **What PRD says:** "AI flagged conflict" is implied as a notification-worthy event.
- **What exists:** `src/lib/inngest/functions/question-impact.ts` (line 140) sends `NOTIFICATION_SEND` with `type: "QUESTION_CONFLICT"`. The `NotificationType` enum in `prisma/schema.prisma` does not include `QUESTION_CONFLICT`. Like GAP-DOCS-009, this will cause a Prisma runtime error in `notificationDispatchFunction` when `createMany` is called with an invalid enum value.
- **The gap:** The question impact assessment function will successfully run its analysis steps but fail when attempting to notify team members of a detected conflict. The `NOTIFICATION_PRIORITY` map in `notification-dispatch.ts` (lines 13–28) also has no entry for `QUESTION_CONFLICT`, so it would default to `NORMAL` even if the type were valid — but this is a minor secondary issue.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Notification Schema Alignment

---

### GAP-NOTIF-005: No notification for QUESTION_ANSWERED sent from the question-impact function's primary path
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.8 — "Question answered: Question owner + blocking stakeholders, Priority: HIGH"
- **What PRD says:** When a question is answered, the question owner and stakeholders blocking on it are notified.
- **What exists:** `src/actions/questions.ts` sends `QUESTION_ANSWERED` at lines 233 and 275 (two code paths for answering a question). `src/lib/inngest/functions/question-impact.ts` also sends `QUESTION_ANSWERED` at line 72 after AI impact assessment. However, all three invocations send `type: "QUESTION_ANSWERED"` without `recipientMemberIds`, which means the dispatch function's switch case (lines 108–113 in `notification-dispatch.ts`) is used: it notifies all PM, BA, and SA roles. The PRD specifically calls out "question owner + blocking stakeholders" — neither the specific owner nor the story assignees of blocked stories are targeted. The blocking stakeholder resolution would require querying `QuestionBlocksStory` and looking up story assignees.
- **The gap:** The notification fires to the wrong set of recipients. PMs, BAs, and SAs are notified regardless of whether they care about the question. The original question raiser and the developers blocked by the question are not specifically targeted.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Notification Recipient Precision

---

### GAP-NOTIF-006: No notification for DOCUMENT_GENERATED type in icon map and notification-item routing
- **Severity:** Minor
- **Perspective:** UX
- **PRD Reference:** Section 17.8 — "AI processing complete: Triggering user, Priority: MEDIUM"
- **What PRD says:** Document generation completion should be surfaced to the user.
- **What exists:** `src/components/notifications/notification-item.tsx` (lines 53–68) defines `TYPE_ICONS` for all 14 schema enum values. `DOCUMENT_GENERATED` is not a schema enum value (see GAP-DOCS-009), and there is no `DOCUMENT_GENERATED` key in `TYPE_ICONS`. Additionally, `getEntityRoute` in `notification-item.tsx` (lines 74–100) has no `DOCUMENT` case — clicking a document-generated notification would fall to the default route `${base}` (the project root), not the documents page.
- **The gap:** Even if GAP-DOCS-009 is resolved by adding `DOCUMENT_GENERATED` to the schema enum, the notification UI component lacks both an icon and a route for this type. Navigation from the notification bell to the document detail page is not wired.
- **Scope estimate:** S
- **Dependencies:** GAP-DOCS-009
- **Suggested phase grouping:** Notification Schema Alignment

---

### GAP-NOTIF-007: Orphaned QA events — TEST_EXECUTION_RECORDED, DEFECT_CREATED, DEFECT_STATUS_CHANGED have no notification consumers
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.8 (by implication — QA state changes affect story assignees and PMs)
- **What PRD says:** The PRD notification table does not explicitly list QA-specific events, but QA activity (defect creation, status change) affects PM visibility and developer workflow.
- **What exists:** The milestone audit (`v1.0-MILESTONE-AUDIT.md` line 107) flags these as orphaned events. `src/actions/test-executions.ts` (line 153) sends `NOTIFICATION_SEND` with `type: "STORY_STATUS_CHANGED"` when a test execution is recorded (a reuse of a story type). `src/actions/defects.ts` sends `WORK_ITEM_UNBLOCKED` (line 136), `STORY_REASSIGNED` (line 193), and `STORY_STATUS_CHANGED` (line 246) — reusing story notification types for defect events. Meanwhile, `TEST_EXECUTION_RECORDED`, `DEFECT_CREATED`, and `DEFECT_STATUS_CHANGED` Inngest events are sent but have no Inngest function subscribed to them (`events.ts` lines 39–41, confirmed no consumer in the functions directory).
- **The gap:** QA activity sends notification events using story type proxies rather than dedicated types, which means defect notifications appear with incorrect titles and routing (pointing to story routes instead of defect routes). The QA-specific Inngest events that could trigger more sophisticated processing are dead.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Notification Event Wiring

---

### GAP-NOTIF-008: JIRA_SYNC_REQUESTED event has no Inngest consumer — retry mechanism silently broken
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.8 — "Metadata sync complete: Architect, Priority: LOW"
- **What PRD says:** Sync completion should surface to the architect.
- **What exists:** The milestone audit confirms `JIRA_SYNC_REQUESTED` has no Inngest consumer. `src/lib/inngest/functions/jira-sync.ts` (lines 111 and 151) correctly sends `METADATA_SYNC_COMPLETE` notifications on both success and failure paths — this part works. But the manual retry path that sends `JIRA_SYNC_REQUESTED` is dead — no function listens to it, so user-initiated retries silently fail.
- **The gap:** The notification for sync complete is wired correctly for the automatic path. The broken piece is the retry trigger, which means a developer who clicks "retry sync" sees no response and no notification.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Notification Event Wiring

---

### GAP-NOTIF-009: No notification priority visible in the UI — URGENT and HIGH look identical to LOW
- **Severity:** Minor
- **Perspective:** UX
- **PRD Reference:** Section 17.8 — priorities: URGENT (sprint conflict), HIGH (question answered, risk, unblocked), NORMAL (assignments), LOW (sync complete, stale article)
- **What PRD says:** Different priority levels are defined for all 14 event types.
- **What exists:** `prisma/schema.prisma` has a `NotificationPriority` enum (URGENT, HIGH, NORMAL, LOW, line 342). The `Notification` model stores `priority`. The `getNotifications` action orders by `priority DESC` then `createdAt DESC`. However, `notification-item.tsx` renders every notification identically — there is no visual differentiation between URGENT and LOW. The unread dot (`h-2 w-2 rounded-full bg-blue-600`) is the same for all priorities. No icon color, border, badge, or label indicates priority level.
- **The gap:** URGENT notifications (sprint conflicts, critical blockers) look identical to LOW notifications (metadata sync complete). A PM scanning the notification list has no ability to triage by severity.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Notification UX

---

### GAP-NOTIF-010: NotificationBell only renders when activeProjectId is set — cross-project notifications not visible
- **Severity:** Minor
- **Perspective:** UX
- **PRD Reference:** Section 17.8 — "in-app notifications only... a notification bell in the application header shows unread count"
- **What PRD says:** The bell should be always visible in the application header.
- **What exists:** `src/components/layout/app-shell.tsx` (lines 32–35) wraps both the notification bell and the header bar in `{activeProjectId && (...)}`. If the user navigates to a page outside a project context (e.g., the project list), the entire header disappears, including the notification bell. The `NotificationBell` itself is also scoped to a single `projectId` — it fetches notifications for one project only.
- **The gap:** Notifications are not surfaced on the project list page or any non-project-scoped route. Users must enter a project to see their bell. The PRD describes the bell as being in "the application header" without project-scoping. This also means multi-project users cannot see cross-project notifications in one place.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Notification UX

---

### GAP-NOTIF-011: No notification for new team member added to project
- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 17.8 — "New team member added: Whole team, Priority: MEDIUM" (implicit from the notification events listed)
- **What PRD says:** The PRD notification table does not list this event explicitly, but team membership changes are a common notification pattern for collaboration tools.
- **What exists:** `src/actions/team.ts` exists (from the actions listing). A search confirms no `NOTIFICATION_SEND` event is emitted by any team-related action.
- **The gap:** When a new consultant is added to a project, no existing team members are notified. There is also no `TEAM_MEMBER_ADDED` type in `NotificationType` enum. This is a minor gap compared to the broken functional paths above but represents an expected social notification.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Notification Event Wiring

---

### Summary Table

| Gap ID | Domain | Severity | Scope | Phase Grouping |
|--------|--------|----------|-------|----------------|
| GAP-DOCS-001 | Documents | Significant | L | Document Template Expansion |
| GAP-DOCS-002 | Documents | Significant | M | Branding Administration |
| GAP-DOCS-003 | Documents | Minor | S | Branding Administration |
| GAP-DOCS-004 | Documents | Minor | S | Document Generation Quality |
| GAP-DOCS-005 | Documents | Significant | M | Document Generation Quality |
| GAP-DOCS-006 | Documents | Significant | M | Document Versioning |
| GAP-DOCS-007 | Documents | Minor | S | Document UX |
| GAP-DOCS-008 | Documents | Minor | S | Document UX |
| GAP-DOCS-009 | Documents | **Critical** | S | Document Notification Wiring |
| GAP-DOCS-010 | Documents | Minor | S | Document Generation Quality |
| GAP-NOTIF-001 | Notifications | **Critical** | L | Notification Event Wiring |
| GAP-NOTIF-002 | Notifications | Significant | S | Notification Event Wiring |
| GAP-NOTIF-003 | Notifications | Significant | S | Notification Event Wiring |
| GAP-NOTIF-004 | Notifications | Significant | S | Notification Schema Alignment |
| GAP-NOTIF-005 | Notifications | Significant | S | Notification Recipient Precision |
| GAP-NOTIF-006 | Notifications | Minor | S | Notification Schema Alignment |
| GAP-NOTIF-007 | Notifications | Significant | M | Notification Event Wiring |
| GAP-NOTIF-008 | Notifications | Significant | S | Notification Event Wiring |
| GAP-NOTIF-009 | Notifications | Minor | S | Notification UX |
| GAP-NOTIF-010 | Notifications | Minor | M | Notification UX |
| GAP-NOTIF-011 | Notifications | Minor | S | Notification Event Wiring |

---

### Critical Path Items (Fix First)

Two items will cause silent runtime failures in the current production build:

1. **GAP-DOCS-009** — `document-generation.ts` sends `type: "DOCUMENT_GENERATED"` which is not in the `NotificationType` enum. The Inngest `notification-dispatch` step will throw a Prisma validation error on every document generation. Fix: either add `DOCUMENT_GENERATED` to the enum and migrate, or change the event type to `AI_PROCESSING_COMPLETE` (the type the PRD intends for this).

2. **GAP-NOTIF-004** — `question-impact.ts` sends `type: "QUESTION_CONFLICT"` which is also not in `NotificationType`. Every question impact assessment that detects a conflict will fail to notify. Fix: add `QUESTION_CONFLICT` to the enum and migrate, or rename to `SPRINT_CONFLICT_DETECTED` if semantically appropriate.

---

### Key Files Referenced

- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/archive/SF-Consulting-AI-Framework-PRD-v2.1.md` (lines 857–1004)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/prisma/schema.prisma` (lines 314–401, 1095–1173)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/documents/branding.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/documents/templates/index.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/documents/renderers/docx-renderer.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/documents/renderers/pptx-renderer.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/documents/renderers/pdf-renderer.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/documents/s3-storage.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/document-generation.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/notification-dispatch.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/events.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/agent-harness/tasks/document-content.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/documents.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/notifications.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/questions.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/stories.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/project-archive.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/documents/generation-dialog.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/documents/generation-progress.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/documents/document-preview.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/documents/version-history-table.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/notifications/notification-bell.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/notifications/notification-panel.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/notifications/notification-item.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/layout/app-shell.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/documents/documents-client.tsx`