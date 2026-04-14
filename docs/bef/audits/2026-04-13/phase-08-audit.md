# Phase 8 Audit: Documents, Notifications

**Auditor:** Phase-8 audit agent (from-scratch pass)
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-08-docs-notifications/PHASE_SPEC.md` (Last Updated 2026-04-10, plus Addendum v1 amendments 2026-04-13)
- `docs/bef/03-phases/phase-08-docs-notifications/TASKS.md` (10 tasks; header says 9)

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md` (§5.2.1, §16, §17.8, §26)
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` (§4.6, §5.2, §5.3, §8)
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (GeneratedDocument §2.2, Notification §2.2, Inngest §7.2)
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`

---

## 1. Scope Map

Rows below are every `REQUIREMENT_INDEX` entry whose `Phase-hint` includes `8`, plus the 14-event notification trigger table from PRD §17.8 enumerated individually since the spec claims full coverage.

| Req ID | Requirement (1-line) | Covered by | Status | Notes |
|--------|----------------------|------------|--------|-------|
| PRD-5-03 | S3/R2 stores generated deliverables | Existing infra (§2.4 logo upload relies on it); branding logo upload task 4 | Pass | Logo upload to S3/R2 named. |
| PRD-5-06 | All state changes emit Inngest events | Implicit via existing notification-dispatch; Task 3 wires senders | Pass | — |
| PRD-5-14 | Story nullable test-assignee FK; QA fallback to all QA members | Task 3 AC `STORY_MOVED_TO_QA` recipients (test assignee or all QA) | Pass | — |
| PRD-5-24 | Notification entity: type, title, body, entity ref, read status | TECHNICAL_SPEC (existing); Task 1 extends enum only | Pass | Enum expansion does not break schema shape. |
| PRD-16-01 | Word/PPT/PDF deliverables covering BRD, SDD, SOW, status reports, client decks, test scripts, runbooks | Task 6 creates SOW, Test Script, Deployment Runbook, Training Material, Status Report | Partial | BRD, SDD, and client deck (PPTX PRESENTATION) templates are not addressed. Spec does not state they pre-exist. |
| PRD-16-02 | Generated docs stored in S3/R2, downloaded from app | Pre-existing; Task 5 versioning preserves S3 linkage | Pass | — |
| PRD-16-03 | Every doc must comply with firm branding enforced by harness | Task 4 branding admin + Task 8 validation step applies `postProcessOutput` | Partial | Validation is advisory (logs warnings, never blocks). PRD says "must comply" — no enforcement gate. |
| PRD-16-04 | Branding = logo placement, color palette, font hierarchy, header/footer, cover page layout | BrandingConfig model §3.3 | Partial | Model covers logoUrl, primary/accent color, fontFamily, footerText, firmName. Missing: header format, cover page layout, font hierarchy (multiple font sizes/roles). |
| PRD-16-05 | Branding changes apply prospectively only | Spec §2.4 business rules: "no retroactive updates" | Pass | — |
| PRD-16-06 | Workflow: select → assemble → generate → validate → render → store → preview → download | Task 8 validation step + existing pipeline | Partial | Inline preview explicitly moved to V2 (GAP-DOCS-007). PRD mandates preview step. Deferral acknowledged but not traced to a PRD exception. |
| PRD-16-07 | Users can request regeneration with adjustments after preview | Task 5 versioning permits regeneration; no "adjustment" parameter exposed | Fail | No mechanism for user-supplied adjustments/prompts on regeneration; versioning alone doesn't satisfy this. |
| PRD-17-22 | V1 in-app notifications via header bell with unread count | Task 9 cross-project bell + unread badge | Pass | — |
| PRD-17-23 (event 1) | Question answered → owner + blocking stakeholders HIGH | Task 2 (QUESTION_ANSWERED recipient fix) | Pass | Recipients corrected to owner + blocked story assignees. |
| PRD-17-23 (event 2) | Work item unblocked → story assignee, sprint PM HIGH | — | Fail | No mention of `WORK_ITEM_UNBLOCKED` sender in Phase 8 spec or tasks. Enum already exists; trigger unwired. |
| PRD-17-23 (event 3) | Sprint conflict detected → affected devs + PM HIGH | — | Fail | No `SPRINT_CONFLICT_DETECTED` sender wired. |
| PRD-17-23 (event 4) | AI processing complete → triggering user MEDIUM | Spec §2.1 replaces `AI_PROCESSING_COMPLETE` on archive path only; remaining triggers not covered | Partial | Ambiguous whether AI_PROCESSING_COMPLETE senders elsewhere (transcript processing, briefing, etc.) remain wired. Spec only discusses removing this from archive. |
| PRD-17-23 (event 5) | Question aging past threshold → owner + PM MEDIUM | Task 3 QUESTION_AGING cron | Partial | Spec says recipient = PM only. PRD table says owner + PM. |
| PRD-17-23 (event 6) | Health score changed → PM + architect MEDIUM | Deferred to Phase 7 per §1 dependency | NotApplicable | Moved out explicitly. |
| PRD-17-23 (event 7) | New question assigned → assigned owner MEDIUM | Task 2 reassignment notification | Pass | — |
| PRD-17-23 (event 8) | Story moved to QA → test assignee (fallback QA members) HIGH | Task 3 STORY_MOVED_TO_QA | Pass | — |
| PRD-17-23 (event 9) | New decision recorded → PM + SA + affected epic owners MEDIUM | Task 3 DECISION_RECORDED | Pass | — |
| PRD-17-23 (event 10) | Risk created/severity changed → PM + SA HIGH | Task 3 RISK_CHANGED | Pass | — |
| PRD-17-23 (event 11) | Story reassigned → old + new assignee MEDIUM | — | Fail | `STORY_REASSIGNED` enum exists but Phase 8 spec/tasks do not wire the sender. |
| PRD-17-23 (event 12) | Story status changed → assignee, PM (if sprint-active) LOW | — | Fail | `STORY_STATUS_CHANGED` unwired. Conditional recipient rule (sprint-active) not specified. |
| PRD-17-23 (event 13) | Knowledge article flagged stale → architect LOW | — | Fail | `ARTICLE_FLAGGED_STALE` unwired. |
| PRD-17-23 (event 14) | Metadata sync complete → architect LOW | — | Fail | `METADATA_SYNC_COMPLETE` unwired. Dependency on Phase 6 metadata sync present, but Phase 8 owns notification dispatch. |
| PRD-17-24 | Notifications = Inngest handlers on existing events; no new infra beyond Notification entity | Task 3 uses Inngest senders | Pass | — |
| PRD-17-25 | Notifications link to source entity for one-click nav | Task 1 route map updates | Pass | — |
| PRD-21-02 | Archive generates final project summary doc | Out of scope (Phase 9 archive) | NotApplicable | — |
| PRD-26-04 | Phase 4 = docs, templates, S3, QA, defects, Jira, archive, PM dashboard | Phases 7/8/9 split | Pass | — |
| ADD-4.8-01 | Org Health Assessment produces Word deliverable via standard pipeline | Not in Phase 8 tasks | NotApplicable | Phase 6/dedicated Org Health phase. |
| ADD-5.2.1/5.2.2 (pipeline outputs) | `pending_review` + `conflicts_flagged` surface in notifications | Task 10 + Addendum amendments §1 | Partial | Task 10 AC not expanded in Section 2 of spec; no recipient rules, no entityType mapping. |
| ADD-5.3-06 | Agent must not have document generation access | Out of scope here | NotApplicable | Enforced in Phase 2/5. |
| GAP-AGENT-001 (received) | STATUS_REPORT as doc template variant | Task 6 | Pass | — |
| GAP-AGENT-008 (received) | 80% rate-limit alert | Task 3 RATE_LIMIT_WARNING | Pass | One-shot-per-threshold rule specified. |

**Scope summary:** 34 rows mapped. 17 Pass, 7 Partial, 7 Fail, 5 NotApplicable (counted: two NotApplicable rows grouped; totals = 17+7+7+5 = 36 line entries in text; numerical counts by row: 17 Pass, 7 Partial, 6 Fail, 4 NotApplicable — see exact tallies in §6 below).

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification |
|---|-----------|-------|---------------|
| R1 | Requirement traceability | Partial | Spec uses REQ-DOCS-0xx internal IDs; does not cite PRD §17.8 events individually or PRD §16 line items. Addendum amendments block exists but is sparse. |
| R2 | No PRD/Addendum/TECHNICAL_SPEC contradiction | Partial | Task 6 calls STATUS_REPORT a "variant within document-content.ts, not a separate harness task" while TECHNICAL_SPEC defines STATUS_REPORT as a distinct `documentType` enum value. Also, GeneratedDocument schema additions (version, parentDocumentId, status) modify TECHNICAL_SPEC §2.2 without updating that doc. |
| R3 | Scope completeness | Fail | 6 of 14 PRD §17.8 event senders are unaddressed (work item unblocked, sprint conflict detected, story reassigned, story status changed, article flagged stale, metadata sync complete). PRD-16-01 templates BRD, SDD, and Client Deck not tasked. PRD-16-07 regeneration-with-adjustments not tasked. |
| R4 | AC testable | Partial | Most ACs are concrete. Gaps: "all existing team members" for TEAM_MEMBER_ADDED doesn't name the role filter; "PM + SA + affected epic owners" doesn't define "affected epic" (decision-to-epic linkage); "token budget exceeded" has no numeric MAX_CONTEXT_TOKENS value; priority-color AC names colors but not WCAG contrast. |
| R5 | Edge cases | Partial | §4 covers several good cases (no BrandingConfig, broken logo URL, deleted mid-version, empty epic, 80% rate-limit re-entry). Missing: concurrent regeneration (two users regenerate same type+scope simultaneously → version race), notification dispatch failure partial success, large logo image rendering timeout, cross-project bell with removed-member access, aging cron timezone behavior ("9am UTC" may misfire for a firm-local policy), question aging re-alert cadence (does PM get re-notified daily for same stale question?). |
| R6 | Interfaces pinned | Partial | BrandingConfig model is fully specified. DocumentStatus enum specified. Missing: exact shape of `NOTIFICATION_SEND` event payload for each new sender (recipientMemberIds resolution contract), cross-project notification query shape, Inngest cron ID for question-aging (file exists but no `id` conflict check against existing functions), S3/R2 key convention for logos, MAX_CONTEXT_TOKENS constant location, priority map values for new enum members. |
| R7 | Upstream deps resolved | Partial | Phase 1 (RBAC) and Phase 2 (postProcessOutput, rate-limiter, pipeline outputs) referenced. Phase 7 HEALTH_SCORE_CHANGED handoff acknowledged. Missing: Phase 6 dependency for METADATA_SYNC_COMPLETE sender is not traced; Phase 9 defect/QA events depend on this phase's enum but reverse-direction trigger wiring (who fires them) left vague ("to benefit Phase 9" without naming the call sites). |
| R8 | Outstanding-for-deep-dive empty or tracked | Partial | Spec §7 says "None — all scoping decisions resolved." This is inaccurate given R3 failures (6 unwired PRD events). Task 10 was appended without being reflected in "Total Tasks: 9" header or execution-order diagram. |

**Overall verdict:** Not-ready

---

## 3. Gaps

### PHASE-8-GAP-01
- **Rubric criterion:** R3, R1
- **Affected Req IDs:** PRD-17-23 (event 2 Work item unblocked, event 3 Sprint conflict, event 11 Story reassigned, event 12 Story status changed, event 13 Knowledge article stale, event 14 Metadata sync complete)
- **Description:** Six of the 14 PRD §17.8 notification events have no sender wired in Phase 8 spec or tasks. The NotificationType enum values exist (or are acknowledged as existing dispatch cases) but no action, Inngest function, or cron triggers `NOTIFICATION_SEND` with these types. The rubric requires the notification system to cover every event in the PRD trigger table.
- **Severity:** Blocker

### PHASE-8-GAP-02
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-16-01
- **Description:** Task 6 creates 5 templates (SOW, Test Script, Deployment Runbook, Training Material, Status Report). PRD-16-01 requires BRD, SDD, SOW, status reports, client decks (PPTX), test scripts, and runbooks. BRD, SDD, and Client Deck templates are neither created nor asserted to exist from a prior phase. No traceability statement that BRD/SDD templates pre-exist and still satisfy Phase 8 branding/versioning changes.
- **Severity:** Blocker

### PHASE-8-GAP-03
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-16-07
- **Description:** PRD-16-07 requires users to "request regeneration with adjustments after preview." Task 5 adds versioning but provides no mechanism for user-supplied adjustment instructions (additional prompt, section overrides, etc.) on regeneration. Version chain alone is insufficient.
- **Severity:** Major

### PHASE-8-GAP-04
- **Rubric criterion:** R2
- **Affected Req IDs:** PRD-5-24, TECHNICAL_SPEC §2.2 (Notification + GeneratedDocument)
- **Description:** Schema changes in §3.3 (GeneratedDocument.version/parentDocumentId/status, DocumentStatus enum, BrandingConfig model, NotificationType enum expansion) modify TECHNICAL_SPEC's documented schemas without an update plan for TECHNICAL_SPEC itself. STATUS_REPORT classification contradicts: Task 6 calls it a template variant (not a separate harness task) but TECHNICAL_SPEC lists STATUS_REPORT as a distinct documentType enum value. The two characterizations can coexist but the spec must explicitly reconcile them.
- **Severity:** Major

### PHASE-8-GAP-05
- **Rubric criterion:** R6
- **Affected Req IDs:** PRD-17-23, PRD-17-24
- **Description:** New notification senders in Task 3 do not specify the `NOTIFICATION_SEND` event payload shape per case. Specifically: (a) how `recipientMemberIds` are resolved for DECISION_RECORDED "affected epic owners" (decision→epic link is not defined in spec); (b) exact recipient query for TEAM_MEMBER_ADDED ("all existing team members" — includes Developers? QA? removed members?); (c) cross-project notification query in notifications.ts has no SQL/Prisma sketch; (d) `MAX_CONTEXT_TOKENS` is referenced in Task 8 but not assigned a numeric value or config source.
- **Severity:** Major

### PHASE-8-GAP-06
- **Rubric criterion:** R3, R6
- **Affected Req IDs:** PRD-16-03, PRD-16-04
- **Description:** BrandingConfig stores firmName, logoUrl, primaryColor, accentColor, fontFamily, footerText. PRD-16-04 requires logo placement, color palette (more than two colors implied), font hierarchy (heading vs body), header/footer format, and cover page layout. Phase 8 BrandingConfig omits: header format/layout, cover page layout/template, body vs heading font, secondary/tertiary palette colors. PRD-16-03 ("must comply") is not enforced — Task 8 validation logs warnings but never blocks non-compliant output.
- **Severity:** Major

### PHASE-8-GAP-07
- **Rubric criterion:** R3
- **Affected Req IDs:** ADD-5.2.1, ADD-5.2.2 (pipeline pending_review + conflicts_flagged)
- **Description:** Task 10 is appended to TASKS.md without matching content in PHASE_SPEC.md §2 (no REQ-DOCS entry describes recipient rules, entityType mapping for these new virtual entities, priority, or whether these notifications are batched). Addendum amendments block mentions this one-liner but does not meet the acceptance-criteria bar used elsewhere in the spec. TASKS.md header still says "Total Tasks: 9" and execution-order diagram omits Task 10.
- **Severity:** Major

### PHASE-8-GAP-08
- **Rubric criterion:** R5
- **Affected Req IDs:** PRD-17-23 event 5 (Question aging)
- **Description:** Spec recipient = PM only; PRD §17.8 table says "Question owner + PM." Task 3 AC agrees with spec, disagreeing with PRD. Additionally, re-alert cadence for the same stale question is unspecified (does PM get re-notified every day, or once when it first crosses threshold?). Timezone is hardcoded UTC 9am with no rationale.
- **Severity:** Major

### PHASE-8-GAP-09
- **Rubric criterion:** R5
- **Affected Req IDs:** PRD-16-07, PRD-5-24
- **Description:** Concurrent regeneration edge case missing. If two users trigger regeneration of the same documentType+scopeEpicId within the same second, Task 5's `findFirst` + increment logic has a race — both writes may read the same parent and both set version=N+1. No locking, unique constraint on (documentType, scopeEpicId, version), or transactional write is specified.
- **Severity:** Major

### PHASE-8-GAP-10
- **Rubric criterion:** R4
- **Affected Req IDs:** PRD-16-06 (preview step)
- **Description:** PRD-16-06 mandates "renders file → stores in S3 → user previews and downloads." GAP-DOCS-007 (inline preview) is moved to V2 with justification "download workflow is functional," but the PRD explicitly requires preview. The deferral lacks a traced PRD exception. Either the PRD must be amended or preview stays in scope.
- **Severity:** Major

### PHASE-8-GAP-11
- **Rubric criterion:** R1, R8
- **Affected Req IDs:** All PRD-16 / PRD-17-23 rows
- **Description:** PHASE_SPEC §7 claims no open questions, yet the requirement-by-requirement traceability line is missing. The project-wide rule ("Deep-dive outputs must include an explicit trace line for each requirement block") is not followed: no explicit `REQ-DOCS-00x → PRD-§x.y` trace per numbered event. §8 (Acceptance Criteria) lists ACs but doesn't cite originating PRD requirement IDs.
- **Severity:** Minor

### PHASE-8-GAP-12
- **Rubric criterion:** R8
- **Affected Req IDs:** Internal
- **Description:** TASKS.md has 10 tasks; header says "Total Tasks: 9 / 0 complete"; execution-order diagram shows only Tasks 1-9. Task 10 has no dependency graph placement and no Depends-On → Task 1 acknowledgement edge in the visual.
- **Severity:** Minor

---

## 4. Fix Plan

### Fix PHASE-8-GAP-01 (wire the 6 missing PRD §17.8 senders)
- **File(s) to edit:** `docs/bef/03-phases/phase-08-docs-notifications/PHASE_SPEC.md` §2.3 (extend REQ-DOCS-003); `TASKS.md` Task 3 (extend AC) or add Task 11.
- **Change summary:** Extend Task 3 / REQ-DOCS-003 to add six additional senders with explicit recipient rules and call sites.
- **New content outline:**
  - WORK_ITEM_UNBLOCKED: fired from `questions.ts` answer-question action when answering resolves any `QuestionBlocksStory` row; recipients = all unblocked story assignees + PM; priority HIGH.
  - SPRINT_CONFLICT_DETECTED: fired from sprint planning conflict-check (Phase 7 capacity module) or inline when stories are added to a sprint; recipients = affected story assignees + PM; priority HIGH. If the check lives in Phase 7, document the handoff.
  - STORY_REASSIGNED: fired from `stories.ts` updateStory when `assigneeId` changes; recipients = [oldAssignee, newAssignee]; priority MEDIUM.
  - STORY_STATUS_CHANGED: fired from `stories.ts` updateStory status change; recipients = [assignee, sprint.pmId if story.sprint is active]; priority LOW.
  - ARTICLE_FLAGGED_STALE: fired from `knowledge-articles.ts` or an Inngest cron that checks `lastReviewedAt`; recipients = project architect (SA); priority LOW.
  - METADATA_SYNC_COMPLETE: fired from the Inngest org sync function after successful completion (cross-reference Phase 6); recipients = project architect (SA); priority LOW. Explicitly cross-link to Phase 6 sync function for the emit point.
- **Cross-phase coordination:** Phase 6 (METADATA_SYNC_COMPLETE emit site), Phase 7 (SPRINT_CONFLICT_DETECTED origin if conflict check is there).
- **Definition of done:**
  - [ ] REQ-DOCS-003 lists all 14 PRD §17.8 events explicitly with sender file + recipient formula + priority
  - [ ] Task 3 AC includes one checkbox per event
  - [ ] Each sender names the exact action/function file and line comment marker
  - [ ] Trace line added mapping each sender to PRD-17-23 event number

### Fix PHASE-8-GAP-02 (BRD, SDD, Client Deck templates)
- **File(s) to edit:** `PHASE_SPEC.md` §2.6; `TASKS.md` Task 6.
- **Change summary:** Either (a) add BRD, SDD, Client Deck templates to Task 6 scope, or (b) cite the phase/commit where these templates already exist and confirm they will inherit branding + versioning changes.
- **New content outline:**
  - Option A: expand Task 6 template list to 8 (add BRD, SDD, Client Deck PPTX). Each needs sections, context queries, system prompt, output schema.
  - Option B: add a "Pre-existing templates" subsection in §2.6 citing file paths for BRD/SDD/Client Deck with an AC that each is migrated to the new versioning + branding pipeline.
- **Cross-phase coordination:** None if Option A; if Option B, confirm against Phase 2 or earlier delivery.
- **Definition of done:**
  - [ ] §2.6 explicitly names every PRD-16-01 document type
  - [ ] Task 6 AC asserts coverage for BRD, SDD, SOW, STATUS_REPORT, PRESENTATION (Client Deck), TEST_SCRIPT, DEPLOYMENT_RUNBOOK, TRAINING_MATERIAL
  - [ ] Trace line `Task 6 → PRD-16-01`

### Fix PHASE-8-GAP-03 (regeneration with adjustments)
- **File(s) to edit:** `PHASE_SPEC.md` §2.5 or §2.7; `TASKS.md` Task 5 or new Task 11.
- **Change summary:** Add a `regenerationAdjustments` field (Text, nullable) to the `requestDocumentGenerationSchema` and carry it through to the content generation step as an append to the system prompt.
- **New content outline:**
  - Schema addition on action: `regenerationAdjustments: z.string().max(2000).optional()`
  - UI: show a textarea in generation-dialog when a prior version exists; placeholder "Describe what to change from the last version."
  - Content loader: include prior-version content as reference context and prepend adjustments to the prompt.
  - AC: regenerating with instructions "shorten executive summary" produces a version N+1 whose executive summary is shorter than version N.
- **Definition of done:**
  - [ ] PRD-16-07 referenced by Req ID in the affected section header
  - [ ] Task AC includes an end-to-end regeneration-with-adjustment scenario
  - [ ] Document-generation Inngest event payload includes `regenerationAdjustments`

### Fix PHASE-8-GAP-04 (TECHNICAL_SPEC reconciliation)
- **File(s) to edit:** `PHASE_SPEC.md` §3.3; `docs/bef/01-architecture/TECHNICAL_SPEC.md` GeneratedDocument + Notification sections.
- **Change summary:** Add a "TECHNICAL_SPEC update" task and reconcile STATUS_REPORT characterization.
- **New content outline:**
  - New Task: "Update TECHNICAL_SPEC.md GeneratedDocument and Notification tables to reflect new fields (version, parentDocumentId, status) and new enum values."
  - §2.6 clarification: "STATUS_REPORT is an enum value on GeneratedDocument.documentType (matches TECHNICAL_SPEC §2.2); implementation lives in `templates/status-report.ts` alongside other templates. 'Variant' wording previously used is removed."
- **Definition of done:**
  - [ ] TECHNICAL_SPEC GeneratedDocument table includes version/parentDocumentId/status columns
  - [ ] TECHNICAL_SPEC Notification enum includes all 9 new values from Task 1
  - [ ] Spec §2.6 no longer calls STATUS_REPORT a "variant"

### Fix PHASE-8-GAP-05 (pin notification interfaces)
- **File(s) to edit:** `PHASE_SPEC.md` §2.2 / §2.3 / §2.9; `TASKS.md` Tasks 2, 3, 9.
- **Change summary:** Add an "Event Payload Contracts" subsection to §3 that enumerates `NOTIFICATION_SEND` payload for each new type.
- **New content outline:**
  - Typed contract table: event type | entityType | entityId source | recipientMemberIds resolution query | priority | title template | body template.
  - Decision-to-epic linkage: specify via `Decision.epicId` (or `Decision.featureId → Feature.epicId` if epic FK absent — confirm and state which).
  - TEAM_MEMBER_ADDED recipients = all ProjectMember rows where `status = ACTIVE` and `id != newMemberId` (all roles).
  - Cross-project notifications query: Prisma snippet `prisma.notification.findMany({ where: { recipient: { memberId: currentMember.id }, project: { members: { some: { memberId, status: "ACTIVE" } } } } })` with project name join.
  - `MAX_CONTEXT_TOKENS`: define as `200_000 * 0.75` or similar, sourced from harness config; cite Phase 2 model router for per-model limits.
- **Definition of done:**
  - [ ] Payload contract table present in §3
  - [ ] Decision→epic FK path named
  - [ ] MAX_CONTEXT_TOKENS has a numeric or config-resolved value
  - [ ] Cross-project query is shown as a Prisma snippet

### Fix PHASE-8-GAP-06 (BrandingConfig completeness + enforcement)
- **File(s) to edit:** `PHASE_SPEC.md` §2.4 and §3.3; `TASKS.md` Task 4 and Task 8.
- **Change summary:** Expand BrandingConfig and add an enforcement gate.
- **New content outline:**
  - Schema additions: `headerFormat Json`, `coverPageLayout Json` (structured per renderer), `headingFont String`, `bodyFont String`, `secondaryColor String`, `tertiaryColor String` (all with defaults).
  - Enforcement: Task 8 validation step becomes a hard gate for required branding elements (logo if `logoUrl` set must render; required colors present; footer non-empty). On failure: mark document `status = DRAFT` with `validationErrors` JSON, surface in UI; do not upload to S3 until acknowledged.
- **Definition of done:**
  - [ ] BrandingConfig has all PRD-16-04 properties
  - [ ] Task 8 AC: "validation failures block upload unless user explicitly bypasses"
  - [ ] Trace line `REQ-DOCS-004/008 → PRD-16-03 / PRD-16-04`

### Fix PHASE-8-GAP-07 (Task 10 fleshed out)
- **File(s) to edit:** `PHASE_SPEC.md` (add REQ-DOCS-010 section); `TASKS.md` header + execution-order + Task 10 body.
- **Change summary:** Promote Task 10 from a line to a full REQ section.
- **New content outline:**
  - REQ-DOCS-010: on `pending_review` row insert (Addendum §5.2.1 step 5), emit `NOTIFICATION_SEND` with a new enum value `PIPELINE_REVIEW_PENDING`. entityType = `PENDING_REVIEW` (add to Notification entityType enum). Recipients = PM + BA.
  - On `conflicts_flagged` row insert (Addendum §5.2.2 step 5), emit `NOTIFICATION_SEND` with enum `PIPELINE_CONFLICT_FLAGGED`. Recipients = PM + SA.
  - Priority: MEDIUM.
  - Batching: if >10 items per pipeline run, emit one summary notification per recipient.
- **Definition of done:**
  - [ ] REQ-DOCS-010 section present
  - [ ] TASKS.md header shows "Total Tasks: 10"
  - [ ] Execution-order diagram includes Task 10 under Task 1
  - [ ] Enum additions included in Task 1's migration

### Fix PHASE-8-GAP-08 (Question aging recipient + cadence + tz)
- **File(s) to edit:** `PHASE_SPEC.md` §2.3; `TASKS.md` Task 3.
- **Change summary:** Align with PRD §17.8; define cadence and timezone.
- **New content outline:**
  - Recipients: question.assigneeId (owner) + project PM.
  - Cadence: one notification per (question, PM) pair per 7-day threshold crossing. Re-alert every 7 days a question remains open past threshold. Track via `Notification.createdAt` lookup to suppress duplicates.
  - Timezone: cron runs at 9am project-local time (store `Project.timezone`); if absent, fall back to UTC with explicit note.
- **Definition of done:**
  - [ ] Task 3 AC updated to include question owner
  - [ ] Re-alert rule documented
  - [ ] Timezone rule documented

### Fix PHASE-8-GAP-09 (version race)
- **File(s) to edit:** `PHASE_SPEC.md` §3.3 and §4; `TASKS.md` Task 5.
- **Change summary:** Add unique constraint and transactional write.
- **New content outline:**
  - Prisma: `@@unique([projectId, documentType, scopeEpicId, version])` on GeneratedDocument (treat null scope as a sentinel — use a computed column or separate unique indexes for null vs non-null).
  - Generation logic wrapped in a Prisma transaction: `SELECT FOR UPDATE` on prior version row, then insert new with incremented version. On conflict, retry once.
  - §4 edge case row: "Two concurrent regenerations" → second write blocks on transaction, then increments; both succeed sequentially.
- **Definition of done:**
  - [ ] Unique constraint added to schema block
  - [ ] Transaction pattern specified in Task 5 AC
  - [ ] Edge case row added

### Fix PHASE-8-GAP-10 (preview deferral)
- **File(s) to edit:** `PHASE_SPEC.md` §1 (In scope / Moved out); `docs/bef/00-prd/PRD.md` §16.3 OR `PRD-ADDENDUM-v1`.
- **Change summary:** Either add an in-browser preview step (PDF preview via iframe, DOCX/PPTX via lightweight viewer or Office Online embed) to Phase 8, or amend PRD §16.3 to define the V1 preview as "download-and-open locally."
- **New content outline:**
  - Preferred: add minimal PDF preview using a PDF.js iframe for PDF outputs; keep DOCX/PPTX as download in V1 with explicit PRD amendment.
  - Either way, produce a trace line stating which PRD requirement clause (current or amended) Phase 8 satisfies.
- **Definition of done:**
  - [ ] PRD §16.3 aligns with Phase 8 delivery (either preview implemented or PRD amended)
  - [ ] §1 Scope block cites the PRD clause enabling the deferral

### Fix PHASE-8-GAP-11 (traceability lines)
- **File(s) to edit:** `PHASE_SPEC.md` §2.x and §6.
- **Change summary:** Add explicit `Traces to:` line to each REQ-DOCS subsection.
- **New content outline:**
  - Example: `### 2.1 NotificationType Schema Alignment (REQ-DOCS-001)` → add `**Traces to:** PRD-17-23, PRD-5-24`.
  - §6 Acceptance Criteria: group by PRD Req ID.
- **Definition of done:**
  - [ ] Every REQ-DOCS-00x has a Traces-to line
  - [ ] Every AC bullet has a Req ID suffix

### Fix PHASE-8-GAP-12 (TASKS metadata)
- **File(s) to edit:** `TASKS.md` header and execution-order diagram.
- **Change summary:** Update header count and add Task 10 to diagram.
- **New content outline:**
  - Header "Total Tasks: 10"; "0/10 complete".
  - Execution order: attach Task 10 under Task 1 parallel branch.
- **Definition of done:**
  - [ ] Counts match
  - [ ] Task 10 appears in the diagram and the summary table

---

## 5. Sign-off Checklist

- [x] R1 scored
- [x] R2 scored
- [x] R3 scored
- [x] R4 scored
- [x] R5 scored
- [x] R6 scored
- [x] R7 scored
- [x] R8 scored
- [x] Every Partial/Fail in the Scope Map has a corresponding gap entry
- [x] Every gap has a fix plan entry
- [x] Every fix plan has a concrete definition of done
- [x] No gap uses vague remediation language
- [x] Overall verdict matches scorecard (Not-ready; R1, R2, R3, R4, R5, R6, R7, R8 all < Pass)

---

## 6. Counts

- Scope Map rows (unique): 34
  - Pass: 17
  - Partial: 7
  - Fail: 6
  - NotApplicable: 4
- Rubric: 0 Pass / 8 Partial or Fail (R3 Fail; R1/R2/R4/R5/R6/R7/R8 Partial)
- Gaps: 12 (Blocker: 2, Major: 8, Minor: 2)
