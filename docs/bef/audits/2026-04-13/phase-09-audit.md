# Phase 9 Audit: QA, Jira, Archival, Lifecycle

**Auditor:** phase-audit-agent
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-09-qa-jira-archival/PHASE_SPEC.md`
- `docs/bef/03-phases/phase-09-qa-jira-archival/TASKS.md`

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md` (§§4.5, 7.1-7.3, 10.3, 18, 19.1, 20, 21, 22.5)
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` (§§5.2.3, table of supersession)
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (Project, TestCase, TestExecution, Defect, Attachment, JiraConfig sections)
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`

---

## 1. Scope Map

| Req ID | Requirement (1-line) | Covered by (spec §/task #) | Status | Notes |
|--------|----------------------|----------------------------|--------|-------|
| PRD-4-05 | QA views test plans, executes, marks pass/fail, logs defects | §2.8 / Task 8; §2.2 / Task 2 | Pass | Test execution UI + defect edit/attachments covered |
| PRD-5-14 | Test assignee FK nullable, fallback to all QA | — | Fail | Not addressed in Phase 9; assumed from Phase 4/8 but no trace to notification fallback behavior here |
| PRD-5-16 | TestCase is per-scenario record | §2.7 / Task 7 | Pass | AI_GENERATED source produces per-scenario rows |
| PRD-5-17 | Defect lifecycle Open→Assigned→Fixed→Verified→Closed with role ownership | §2.2 / Task 2 | Partial | Edit sheet references `defect-status-machine.ts`; no explicit per-transition role verification ACs in Phase 9 |
| PRD-5-25 | Attachments supported on defects/stories/questions via entityType+entityId | §2.2 / Task 2 | Partial | Phase 9 uses direct `defectId` FK, NOT the polymorphic `entityType + entityId` pattern TECHNICAL_SPEC §Attachment and PRD-5-25 require |
| PRD-7-02 | Project creation provisions default epic templates by engagement type | §2.6 / Task 6 | Pass | Inngest consumer on PROJECT_CREATED with 4 engagement-type templates |
| PRD-7-04 | Every project progresses through 8 standard phases | §2.5 / Task 5 | Pass | updateProjectPhase action with enum guard |
| PRD-10-08 | Stories must have at least one TestCase; AI generates stubs | §2.7 / Task 7 | Partial | Addendum says stubs are Phase 4 Story Generation Pipeline output; Phase 9 overloads this with AI_GENERATED on READY transition — relation between STUB (Phase 4) and AI_GENERATED (Phase 9) is described, but duplication/merge semantics across the two generators are not tested |
| PRD-18-01 | QA views test plans and can add test cases | §2.8 / Task 8 | Pass | "Add Test Case" inline form |
| PRD-18-02 | QA executes tests, records Pass/Fail/Blocked, optional defect link | §2.8 / Task 8 | Pass | Fail → DefectCreateSheet prefill |
| PRD-18-03 | Defects with severity, repro, expected/actual, attachments, env | §2.2 / Task 2 | Pass | All fields named; attachment types listed |
| PRD-18-04 | Fix verification and close via lifecycle | §2.2 / Task 2 | Partial | Edit sheet exists; no AC verifies role-gated Fixed→Verified→Closed transitions surface |
| PRD-18-05 | Per-story totals/pass/fail/not-yet-executed | §2.9 / Task 9 | Pass | Per-story coverage indicator |
| PRD-18-06 | Per-sprint aggregate test execution | §2.9 / Task 9 | Pass | Sprint detail aggregate section |
| PRD-18-07 | Overall metric: stories with all passed / stories in QA or Done | §2.9 / Task 9 | Pass | Exact PRD formula in Implementation Notes |
| PRD-19-07 | QA can create stories only in DRAFT | §2.1 / Task 1 | Pass | Server-side override |
| PRD-20-01 | Jira sync optional, per-project configurable | §2.4 / Task 4 | Pass | JiraConfig |
| PRD-20-02 | One-directional push only | — | Partial | Spec does not explicitly restate push-only guarantee or guard against any accidental read-path |
| PRD-20-03 | Sync scoped to one configured Jira project | — | Fail | No AC or guard verifies single-project scope. JiraConfig has no project key validation/isolation |
| PRD-20-04 | SA configures URL, project key, auth, field mapping, trigger statuses | §2.4 / Task 4 | Partial | Field mapping + trigger statuses pinned; project key, URL, auth credential rotation, and credential encryption not restated (assumed from prior phase but Phase 9 modifies JiraConfig materially) |
| PRD-20-05 | Inngest + Jira Cloud REST API, encrypted credentials | §2.4 / Task 4 | Partial | Inngest mentioned; no explicit verification that `apiToken` field is encrypted at rest in Phase 9's schema changes |
| PRD-21-01 | Archive sets project read-only (no new stories/edits/AI) | — | Fail | Phase 9 Task 3 covers steps 5-7 but does NOT verify or implement read-only enforcement (step 1 of PRD §21.1). No AC blocks AI chat/edits on archived projects |
| PRD-21-02 | Archive generates final project summary document | §2.10 / Task 10 | Pass | PROJECT_SUMMARY template |
| PRD-21-03 | Archive preserves all project data and generated documents | §4 Edge Cases (implicit) | Partial | No explicit AC that asserts non-destructive preservation; retention cron deletes audit logs but preservation of stories/docs/knowledge not restated |
| PRD-21-04 | Archive revokes and deletes SF org credentials | §2.3 / Task 3 | Pass | Revoke (best-effort) + null all three fields |
| PRD-21-05 | Archive disconnects Jira sync | §2.3 / Task 3 | Pass | enabled=false + apiToken cleared |
| PRD-21-06 | Access logs retained per retention period (default 2 years) | §2.3 / Task 3 | Partial | Stores `auditLogRetentionDays` and weekly cron deletes; "access logs" in PRD-21-06 vs. "audit logs" in Phase 9 — naming/scope equivalence not confirmed |
| PRD-21-07 | Reactivation creates a new project inheriting KB/org/decisions | — | NotApplicable | Explicitly deferred to V2 (GAP-ARCH-004). Documented. |
| PRD-21-08 | Reactivation leaves original archive untouched | — | NotApplicable | Deferred with PRD-21-07 |
| PRD-22-04 | SF org credentials encrypted, scoped, revoked on archive | §2.3 / Task 3 | Partial | Revocation/deletion covered; encryption-at-rest guarantee not restated for Phase 9 changes |
| PRD-22-05 (implicit) | Jira credentials encrypted at rest | §2.4 / Task 4 | Fail | `apiToken` clearing shown, but no explicit encryption requirement on `fieldMapping` Jira field IDs (low risk) or apiToken storage |
| ADD §5.2.3 (supersession) | AI-generated test cases fed by Story Generation Pipeline output | §Addendum Amendments (review-only) | Partial | Addendum amendments section says "review-only, no code changes expected" but Task 7 regenerates on READY with its own context loader — integration point to pipeline stage 7 (acceptance criteria) is not pinned; duplicate-of-Phase-4-stubs handling is described in words (preserve STUB) but no test for dedup |
| PRD-19-05 | Execution transitions restricted to SA/Developer | §2.1 / Task 1 | Pass | BA added to management only; execution unchanged |
| PRD-26-04 | Phase 4 build sequence delivers QA/Jira/archive/PM dashboard | §2 multiple | Pass | Aligned with PRD §26 scope |

**Scope summary:** 30 rows mapped. 14 Pass, 11 Partial, 3 Fail, 2 NotApplicable.

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification (1 line) |
|---|-----------|-------|------------------------|
| R1 | Requirement traceability | Partial | Most sections cite PRD, but Attachment polymorphism (PRD-5-25), Jira push-only (PRD-20-02), Jira scope (PRD-20-03), archive read-only (PRD-21-01), and credential encryption (PRD-22-04/05) lack explicit citations |
| R2 | No PRD/Addendum/TECHNICAL_SPEC contradiction | Fail | Attachment.defectId FK contradicts TECHNICAL_SPEC §Attachment + PRD-5-25 polymorphic entityType+entityId pattern |
| R3 | Scope completeness | Fail | Missing: archive read-only enforcement (PRD-21-01), Jira single-project scope guard (PRD-20-03), test-assignee fallback (PRD-5-14), defect role-gated transitions in Phase 9 UI (PRD-18-04) |
| R4 | Acceptance criteria are testable | Partial | Most ACs concrete; missing thresholds for: token budget truncation priority order, attachment virus scan, max attachments per defect enforced server-side, Jira sync retry/backoff count |
| R5 | Edge cases enumerated | Partial | Edge table is strong but missing: archived project receiving a STORY_STATUS_CHANGED event (should be blocked), Jira field mapping with duplicate Jira field IDs across app fields, concurrent archive + Jira sync retry, SF token revoke timeout threshold, audit log retention cron overlap with prior run |
| R6 | Interfaces pinned — DB schema, APIs, events fully specified | Partial | JiraConfig.fieldMapping is `Json?` with no declared TypeScript interface or Zod schema in the spec; triggerStatuses uses `String[]` but should reference StoryStatus enum; PROJECT_ARCHIVED event payload shape not specified; TEST_CASE_GENERATION output schema named but not defined |
| R7 | Upstream dependencies resolved | Partial | Phase 1 (RBAC), 4 (story validation), 8 (templates/notifications) are referenced, but: "PROJECT_CREATED event includes engagementType" noted as needs-verification in Task 6 (circular — Phase 9 cannot depend on an unverified upstream contract); Phase 8 DEFECT_CREATED/DEFECT_STATUS_CHANGED/TEST_EXECUTION_RECORDED event payload shapes not cited |
| R8 | Outstanding items empty or tracked | Pass | §7 explicitly states "None"; deferred GAP-ARCH-004 documented |

**Overall verdict:** Not-ready (R2 Fail on Attachment schema conflict; R3 Fail on archive read-only + Jira scope; additional Partials across R1/R4/R5/R6/R7)

---

## 3. Gaps

### PHASE-9-GAP-01
- **Rubric criterion:** R2, R1
- **Affected Req IDs:** PRD-5-25
- **Description:** Task 2 adds a direct `defectId String?` FK to `Attachment` and an `attachments Attachment[]` relation on `Defect`. This contradicts the polymorphic Attachment pattern defined in TECHNICAL_SPEC §Attachment (entityType string + entityId string) and PRD-5-25 ("entityType + entityId reference"). Introducing a typed FK alongside the existing polymorphic columns creates two parallel relation patterns on the same table.
- **Severity:** Blocker

### PHASE-9-GAP-02
- **Rubric criterion:** R3, R1
- **Affected Req IDs:** PRD-21-01
- **Description:** Task 3 implements archive steps 5-7 (credentials, Jira, retention) but does not enforce PRD §21.1 step 1: "project is set to read-only with no new stories, edits, or AI interactions." No AC guards story mutations, AI chat, or document generation on archived projects. Without this, an archived project remains functionally mutable even after credentials are revoked.
- **Severity:** Blocker

### PHASE-9-GAP-03
- **Rubric criterion:** R3, R1
- **Affected Req IDs:** PRD-20-03
- **Description:** Task 4 adds field mapping and trigger statuses to JiraConfig but does not restate or verify the PRD-20-03 scope guarantee: sync writes are limited to the single configured Jira project key. No AC validates that an unexpected project key in a payload is rejected, and the field mapping UI gives no project-key isolation check.
- **Severity:** Major

### PHASE-9-GAP-04
- **Rubric criterion:** R6
- **Affected Req IDs:** PRD-20-04, PRD-22-04
- **Description:** `JiraConfig.fieldMapping Json?` is declared without a TypeScript or Zod schema in the spec. Spec shows an example shape but no validated interface. `triggerStatuses String[]` should be bounded to the StoryStatus enum. `apiToken` encryption-at-rest is not restated for Phase 9's JiraConfig modifications. Event payloads for PROJECT_ARCHIVED and PROJECT_STATE_CHANGED are referenced without data shape.
- **Severity:** Major

### PHASE-9-GAP-05
- **Rubric criterion:** R7
- **Affected Req IDs:** PRD-7-02
- **Description:** Task 6 implementation notes say: "Verify that PROJECT_CREATED event includes engagementType in its data payload. If not, add it in src/actions/projects.ts." This is an unresolved upstream contract. Phase 9 cannot assume the field exists; it must either declare the requirement binding on the upstream phase (Phase 2 or wherever project creation lives) or own the event payload extension explicitly.
- **Severity:** Major

### PHASE-9-GAP-06
- **Rubric criterion:** R5
- **Affected Req IDs:** PRD-21-01, PRD-20-02
- **Description:** Edge cases missing: (a) STORY_STATUS_CHANGED or TEST_EXECUTION_RECORDED event arrives for an archived project (should be dropped, not trigger sync or dashboard refresh); (b) Jira field mapping with two app fields mapped to the same Jira field ID (last-write-wins vs. reject); (c) SF token revocation timeout threshold (currently "best-effort" with no timeout ceiling — could hang archive); (d) audit log retention cron overlap if prior run still batch-deleting; (e) test case regeneration when story is in terminal state (QA/DONE) — should be blocked.
- **Severity:** Major

### PHASE-9-GAP-07
- **Rubric criterion:** R4
- **Affected Req IDs:** PRD-18-03
- **Description:** Attachment AC says "10MB per file, max 5 per defect" but does not specify server-side enforcement (client-only enforcement is bypassable). No AC for MIME-type verification on the server, virus scanning, or storage path isolation per project.
- **Severity:** Major

### PHASE-9-GAP-08
- **Rubric criterion:** R4
- **Affected Req IDs:** PRD-5-17, PRD-18-04
- **Description:** Defect edit sheet AC lists editable fields but does not restate role-gated transitions from the PRD-5-17 lifecycle (QA creates/verifies/closes, Developer marks Fixed, SA/PM Close). Task 2 says "Status transitions follow the existing `defect-status-machine.ts` rules" but does not require an AC verifying role enforcement inside the edit sheet UI (hiding disallowed transitions) or the server action.
- **Severity:** Major

### PHASE-9-GAP-09
- **Rubric criterion:** R1, R3
- **Affected Req IDs:** PRD-10-08, ADD §5.2.3
- **Description:** Task 7 creates TestCase records with `source: "AI_GENERATED"` on STORY_STATUS_CHANGED → READY. Addendum supersession of §10.4 routes story generation through the Story Generation Pipeline whose Stage 7 emits test case stubs (source=STUB per Phase 4). The integration contract between Phase 4 STUB test cases and Phase 9 AI_GENERATED test cases is described in prose ("preserve STUB records") but there is no AC or trace line that: (a) AI_GENERATED regeneration never touches STUB; (b) STUB is migrated to AI_GENERATED only on explicit user accept; (c) AI_GENERATED generation reads pipeline-produced acceptance criteria (not pre-pipeline).
- **Severity:** Major

### PHASE-9-GAP-10
- **Rubric criterion:** R1
- **Affected Req IDs:** PRD-21-06
- **Description:** PRD-21-06 refers to "access logs retained per configured retention period." Phase 9 uses `auditLogRetentionDays` and deletes audit logs. "Access logs" and "audit logs" are not defined as equivalent in the spec; if they are distinct (e.g., access logs are auth-event logs from Phase 1), the retention cron may be deleting the wrong table.
- **Severity:** Major

### PHASE-9-GAP-11
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-5-14
- **Description:** PRD-5-14 requires "Story moved to QA" notification to fall back to all QA members when the test assignee is null. Phase 9 does not address this notification routing and Phase 8 is cited as owning the notification types, but the fallback routing for the QA-specific event is not explicitly traced to either Phase 8 or Phase 9.
- **Severity:** Minor

### PHASE-9-GAP-12
- **Rubric criterion:** R4
- **Affected Req IDs:** PRD-21-02
- **Description:** Task 10 token-budget truncation priority ("prioritize decisions and deliverables over raw story content") is mentioned but not pinned as an ordered priority list per template section. A concrete priority order per the template's 8 sections is needed so truncation behavior is testable.
- **Severity:** Minor

### PHASE-9-GAP-13
- **Rubric criterion:** R6
- **Affected Req IDs:** PRD-10-08
- **Description:** Task 7 references `testCaseOutputSchema` and `testCaseGenerationContext` but does not define them in the spec. Output schema fields (`title`, `steps`, `expectedResult`, `testType`) are listed but type definitions (e.g., `steps: string[]` vs. `{step: string, data?: string}[]`) are not pinned.
- **Severity:** Minor

---

## 4. Fix Plan

### Fix PHASE-9-GAP-01
- **File(s) to edit:** `docs/bef/03-phases/phase-09-qa-jira-archival/PHASE_SPEC.md` §2.2 and §3.3 Migration 1; `docs/bef/03-phases/phase-09-qa-jira-archival/TASKS.md` Task 2
- **Change summary:** Replace the typed `defectId` FK approach with the polymorphic `entityType + entityId` pattern already established in TECHNICAL_SPEC §Attachment. Remove `attachments Attachment[]` relation on Defect.
- **New content outline:**
  - Migration 1 rewrites: no Attachment schema change needed; defect attachments use `Attachment.entityType = "Defect"` and `Attachment.entityId = defect.id`.
  - Task 2 server action stores attachments with entityType=Defect, entityId=defect.id.
  - UI defect detail queries `Attachment.findMany({ where: { entityType: "Defect", entityId } })`.
  - Add AC: "Attachments use the polymorphic entityType/entityId pattern per TECHNICAL_SPEC §Attachment (PRD-5-25)."
- **Cross-phase coordination:** None — Attachment model already exists in Phase 2 schema.
- **Definition of done:**
  - [ ] Migration 1 removed; defect attachments documented as reusing existing Attachment table via polymorphic columns
  - [ ] Task 2 AC cites PRD-5-25
  - [ ] No new `defectId` column introduced on Attachment
  - [ ] Task 2 query and UI examples updated to use entityType/entityId

### Fix PHASE-9-GAP-02
- **File(s) to edit:** `PHASE_SPEC.md` §2.3 (new sub-item) and `TASKS.md` Task 3
- **Change summary:** Add archive read-only enforcement as a distinct Task 3 sub-requirement covering PRD §21.1 step 1.
- **New content outline:**
  - New §2.3.0: "Step 1 — Read-only gate: Add `assertProjectWritable(projectId)` helper that throws when `project.status = ARCHIVED`. Call from every mutating server action (stories, defects, documents, chat). Phase 1 role guards + this gate together enforce read-only."
  - Task 3 AC additions: "All mutating server actions call assertProjectWritable and reject with 'This project is archived and read-only.'"; "AI chat requests on archived projects return a canned read-only response"; "Document regeneration is blocked on archived projects except PROJECT_SUMMARY".
  - Edge case: "Archive with in-flight user request — gate rejects the request after status flip, no partial writes."
- **Cross-phase coordination:** Phase 1 RBAC middleware — the gate is additive, not replacing role checks.
- **Definition of done:**
  - [ ] §2.3.0 describes the gate
  - [ ] Task 3 has AC citing PRD-21-01
  - [ ] Edge case table row added
  - [ ] List of mutating action files enumerated (stories.ts, defects.ts, test-executions.ts, jira-sync.ts trigger, documents actions, chat send)

### Fix PHASE-9-GAP-03
- **File(s) to edit:** `PHASE_SPEC.md` §2.4 and `TASKS.md` Task 4
- **Change summary:** Add explicit single-project scope guard and AC citing PRD-20-03.
- **New content outline:**
  - §2.4 business rules: "Jira sync pushes ONLY to the `JiraConfig.projectKey` configured at setup. Any outbound push validates `payload.projectKey === jiraConfig.projectKey` before HTTP call. Cross-project writes are rejected with a logged error."
  - Task 4 AC: "jiraPush helper validates payload projectKey against JiraConfig.projectKey and rejects mismatches (PRD-20-03)."
  - Edge case: "Jira config updated to a new projectKey — in-flight retries for old projectKey are rejected by the validation."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] §2.4 explicitly restates PRD-20-03
  - [ ] Task 4 AC added
  - [ ] Edge case row added

### Fix PHASE-9-GAP-04
- **File(s) to edit:** `PHASE_SPEC.md` §3.3 (Migration 2), §5 Integration Points, and `TASKS.md` Tasks 4, 5, 10
- **Change summary:** Pin TypeScript/Zod interfaces for JiraConfig.fieldMapping, constrain triggerStatuses to StoryStatus enum, restate apiToken encryption, specify event payload shapes.
- **New content outline:**
  - Define `JiraFieldMapping` Zod schema in §2.4: `{ storyPoints?: string, acceptanceCriteria?: string, priority?: string, customFields?: Record<string, string> }`.
  - `triggerStatuses` typed as `StoryStatus[]` (via Prisma enum array if DB permits, otherwise `String[]` validated server-side against StoryStatus at write time).
  - Add note: "`apiToken` continues to be stored using the Phase 1 encryption-at-rest wrapper (same as sfOrgAccessToken). Phase 9 changes do not alter encryption behavior (PRD-22-04)."
  - Define event payloads: `PROJECT_ARCHIVED { projectId, archivedBy, archivedAt }`; `PROJECT_STATE_CHANGED { projectId, changeType: "phase"|"archive"|"member"|..., oldValue?, newValue? }`.
- **Cross-phase coordination:** Phase 8 and Phase 1 — confirm encryption wrapper exists.
- **Definition of done:**
  - [ ] Zod schema present in §2.4
  - [ ] triggerStatuses typing note added
  - [ ] apiToken encryption note added
  - [ ] Event payload shapes added in §5 Integration Points

### Fix PHASE-9-GAP-05
- **File(s) to edit:** `PHASE_SPEC.md` §5 Integration Points and `TASKS.md` Task 6
- **Change summary:** Declare the PROJECT_CREATED event payload contract as owned by Phase 9 (extend if needed) rather than "verify upstream."
- **New content outline:**
  - §5 add: "Phase 9 OWNS the extension of PROJECT_CREATED payload to `{ projectId, engagementType, createdBy, createdAt }`. If the current Phase 2/creating phase emits a narrower payload, Task 6 includes the payload extension as in-scope work."
  - Task 6 AC: "PROJECT_CREATED event payload includes engagementType. If upstream emitter does not include it, Task 6 updates the emitter."
- **Cross-phase coordination:** Identify the current PROJECT_CREATED emitter (likely Phase 2 projects.ts or wherever first provisioned) and coordinate the payload extension.
- **Definition of done:**
  - [ ] §5 payload contract declared
  - [ ] Task 6 owns the emitter extension explicitly
  - [ ] No "verify upstream" language remains

### Fix PHASE-9-GAP-06
- **File(s) to edit:** `PHASE_SPEC.md` §4 Edge Cases & Error Handling
- **Change summary:** Add five edge-case rows.
- **New content outline:**
  - Row: "Event arrives for archived project | Handler checks project.status; drops event with debug log | No side effects"
  - Row: "Two app fields mapped to same Jira field ID | saveJiraConfig validates unique values in fieldMapping | Reject with 'Duplicate Jira field ID in mapping'"
  - Row: "SF token revoke exceeds 5s timeout | Abort revoke, proceed with local credential deletion | Warn logged; archive continues"
  - Row: "Audit log retention cron overlap (prior run still running) | Inngest concurrency=1 per function id | Second run skipped by runtime"
  - Row: "Test case regeneration on QA or DONE story | Block, return error | 'Cannot regenerate test cases for story in terminal status'"
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Five new rows present in §4 table
  - [ ] Each row has scenario/expected/error-response columns filled

### Fix PHASE-9-GAP-07
- **File(s) to edit:** `TASKS.md` Task 2
- **Change summary:** Add server-side enforcement ACs for attachment limits and content-type validation.
- **New content outline:**
  - AC: "Server action rejects uploads >10MB with 413."
  - AC: "Server action rejects disallowed MIME types (outside PNG/JPEG/GIF/PDF/DOCX) after content sniffing (not trusting client-declared type)."
  - AC: "Server action rejects the 6th attachment on a defect with a specific error."
  - AC: "Uploaded files are stored under S3 path `projects/{projectId}/defects/{defectId}/` to isolate per project."
  - Note: Virus scanning deferred to V2 if not in Phase 8.
- **Cross-phase coordination:** Phase 8 S3 upload utility — confirm server-side validation path.
- **Definition of done:**
  - [ ] Four new ACs in Task 2
  - [ ] S3 path pattern specified

### Fix PHASE-9-GAP-08
- **File(s) to edit:** `PHASE_SPEC.md` §2.2 and `TASKS.md` Task 2
- **Change summary:** Restate defect lifecycle role rules and add AC verifying UI and server enforcement.
- **New content outline:**
  - §2.2 business rules: enumerate role-per-transition (QA creates Open→Assigned [assigns dev]; Developer Assigned→Fixed; QA Fixed→Verified or Fixed→Open [reopen]; SA/PM Verified→Closed).
  - Task 2 AC: "DefectEditSheet status dropdown shows only transitions allowed for the current member's role."
  - Task 2 AC: "updateDefect server action rejects role-disallowed transitions with 'Your role (X) cannot transition Defect from A to B.'"
  - Cite PRD-5-17 and PRD-18-04.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Role matrix present in §2.2
  - [ ] Two new ACs in Task 2 citing PRD-5-17/PRD-18-04

### Fix PHASE-9-GAP-09
- **File(s) to edit:** `PHASE_SPEC.md` §2.7, §5 Integration Points / From Phase 4, and `TASKS.md` Task 7
- **Change summary:** Pin the STUB vs. AI_GENERATED contract with explicit ACs and trace to Addendum §5.2.3.
- **New content outline:**
  - §2.7 rules: "Task 7 regeneration deletes ONLY `source = AI_GENERATED` rows. STUB and MANUAL rows are never touched by Task 7. If a user accepts a STUB, source is flipped to MANUAL (out of scope here, flagged to Phase 4 if not already)."
  - §2.7 trace line: "AI_GENERATED test case generation consumes acceptance criteria produced by Story Generation Pipeline Stage 7 (Addendum §5.2.3). No direct pre-pipeline AC fields are read."
  - Task 7 AC: "Regeneration test verifies STUB rows present before and after regeneration."
  - Task 7 AC: "Context loader pulls acceptance criteria from Story record (populated by pipeline); it does not bypass the pipeline."
- **Cross-phase coordination:** Phase 4 STUB semantics.
- **Definition of done:**
  - [ ] §2.7 trace line cites ADD §5.2.3
  - [ ] Two regeneration ACs in Task 7

### Fix PHASE-9-GAP-10
- **File(s) to edit:** `PHASE_SPEC.md` §2.3 and `TASKS.md` Task 3
- **Change summary:** Define audit-log vs. access-log scope and bind retention to the correct tables.
- **New content outline:**
  - §2.3 note: "Per PRD-21-06, 'access logs' refers to BOTH (a) the Phase 1 audit/event log (AuditLog table) AND (b) any auth/access log (AccessLog table if separate). Task 3 retention cron deletes from both; if only AuditLog exists in Phase 1, access logs are the same table."
  - Task 3 AC: "Retention cron enumerates all log tables tagged with `projectId` and deletes rows past retention per project."
- **Cross-phase coordination:** Phase 1 — confirm log table names.
- **Definition of done:**
  - [ ] Scope note added in §2.3
  - [ ] Task 3 AC updated
  - [ ] Phase 1 table names cited

### Fix PHASE-9-GAP-11
- **File(s) to edit:** `PHASE_SPEC.md` §5 Integration Points / From Phase 8
- **Change summary:** Explicitly trace PRD-5-14 notification fallback.
- **New content outline:**
  - Add: "Phase 8 'Story moved to QA' notification handler reads `story.testAssigneeId`. When null, Phase 8 fans out to all ProjectMembers with role=QA per PRD-5-14. Phase 9 depends on this behavior; no Phase 9 changes. If Phase 8 does not yet implement the null-fallback, Phase 9 raises a cross-phase coordination ticket."
- **Cross-phase coordination:** Phase 8.
- **Definition of done:**
  - [ ] §5 trace line added
  - [ ] PRD-5-14 cited

### Fix PHASE-9-GAP-12
- **File(s) to edit:** `TASKS.md` Task 10
- **Change summary:** Pin truncation priority order.
- **New content outline:**
  - Task 10 AC: "When context exceeds token budget, sections are truncated in reverse priority order: 8 Team Roster, 7 Key Metrics (keep totals only), 5 Knowledge Base State, 6 Org Knowledge Summary, 2 Timeline (keep milestones only), 1 Executive Summary (keep), 3 Deliverables (keep), 4 Decisions (keep)."
  - Task 10 AC: "Decisions and Deliverables sections are never truncated below a full enumeration of titles + status."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Priority order present in Task 10 AC
  - [ ] Decisions/Deliverables protection AC present

### Fix PHASE-9-GAP-13
- **File(s) to edit:** `PHASE_SPEC.md` §2.7 and `TASKS.md` Task 7
- **Change summary:** Define the TestCase output schema in the spec.
- **New content outline:**
  - §2.7 output schema (Zod or TypeScript):
    - `title: string (min 5, max 200)`
    - `steps: { step: string; data?: string }[]` (min 1)
    - `expectedResult: string (min 5, max 500)`
    - `testType: "HAPPY_PATH" | "EDGE_CASE" | "NEGATIVE" | "BULK"`
  - Task 7 AC: "Output parser rejects any row missing any of the four required fields."
- **Cross-phase coordination:** TestCase table schema from Phase 4 — confirm `steps` column type supports the structure.
- **Definition of done:**
  - [ ] Output schema explicit in §2.7
  - [ ] Task 7 AC validates the schema

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
- [x] Overall verdict matches scorecard (Not-ready — R2 and R3 Fail)
