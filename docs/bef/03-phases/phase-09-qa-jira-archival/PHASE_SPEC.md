# Phase 9 Spec: QA, Jira, Archival, Lifecycle

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [09-qa-jira-archival-gaps.md](./09-qa-jira-archival-gaps.md)
> Depends On: Phase 1 (RBAC, Security, Governance), Phase 4 (Work Management), Phase 8 (Documents, Notifications)
> Status: Draft
> Last Updated: 2026-04-10

---

## 1. Scope Summary

Complete the QA workflow (AI test case generation, test execution UI, defect editing, coverage metrics), make Jira sync configurable (field mapping, trigger statuses, story points), implement the remaining archive steps (credential deletion, Jira disconnect, summary document, log retention), and add project lifecycle management (phase advancement, default epic templates, phase-aware AI context). This phase makes QA, Jira, archival, and lifecycle subsystems production-correct.

**In scope:** 19 active gaps (2 resolved, 1 deferred) → 11 tasks
**Moved out:**
- GAP-ARCH-004 (reactivation fork-and-inherit) → V2. Already noted in Phase Plan risk notes. Current in-place reactivation remains functional.
**Resolved (no work):**
- GAP-JIRA-003 (retry mechanism) — already wired
- GAP-JIRA-004 (toStatus/newStatus mismatch) — already fixed

---

## Addendum v1 Amendments (April 13, 2026)

These amendments integrate PRD Addendum v1 into Phase 9. Review-only; no new tasks unless review surfaces a gap.

- **Review note:** Verify test case generation consumes Story Generation Pipeline output (acceptance criteria from pipeline stage 7). No code changes expected — confirm integration point during Phase 9 execution.
- No other material changes expected from the addendum.

---

## 2. Functional Requirements

### 2.1 QA RBAC Fixes (REQ-QA-001)

- **What it does:** Fixes two story status machine gaps:
  1. **BA management transitions:** Add BA role to the management transition group so BAs can transition stories through DRAFT → READY → SPRINT_PLANNED (PRD Section 19.1 RBAC table confirms BA has "Transition story status (management)").
  2. **QA DRAFT-only story creation:** Add enforcement in `createStory` that when the creator's role is QA, the story status must be DRAFT. QAs can create stories (for logging defect-related stories) but cannot create them directly in READY or other states.
- **Business rules:** BA joins `PM_ROLES` for management transitions only (DRAFT ↔ READY ↔ SPRINT_PLANNED). BA still cannot do execution transitions (IN_PROGRESS → IN_REVIEW → QA → DONE). QA story creation constraint is a server-side validation, not a UI restriction.
- **Files:** `src/lib/story-status-machine.ts`, `src/actions/stories.ts`

### 2.2 Defect Edit Sheet + Attachments (REQ-QA-002)

- **What it does:** Two additions to the defect subsystem:
  1. **Edit sheet:** Create a `DefectEditSheet` component that calls the existing `updateDefect` action. Replace the `handleEdit` toast stub in `defects-page-client.tsx` with a sheet open. Fields: title, severity, status, assignee, steps to reproduce, expected/actual behavior, environment. Status transitions follow the existing `defect-status-machine.ts` rules.
  2. **Attachments:** Add a `Defect` → `Attachment` relation in the schema (reusing the existing `Attachment` model pattern). Add file upload to both `DefectCreateSheet` and `DefectEditSheet`. Store to S3/R2, save URL to Attachment record. Display attachments (images inline, others as download links) in the defect detail view.
- **Schema change:** Add `defectId String?` to `Attachment` model. Add `attachments Attachment[]` relation to `Defect` model.
- **Business rules:** Attachments are limited to 10MB per file, max 5 per defect. Supported types: PNG, JPEG, GIF, PDF, DOCX. Image attachments render inline thumbnails. The `updateDefect` action already exists and is fully implemented — only the UI surface is missing.
- **Files:** `prisma/schema.prisma`, new `defect-edit-sheet.tsx`, `defect-create-sheet.tsx` (add upload), `defects-page-client.tsx` (wire edit), `defects.ts` (add attachment handling), S3 upload utility (reuse from Phase 8 branding if available)

### 2.3 Archive Completion (REQ-QA-003)

- **What it does:** Implements the 3 missing archive steps from PRD Section 21.1:
  1. **Step 5 — Delete SF credentials:** Clear `sfOrgAccessToken`, `sfOrgRefreshToken`, and `sfOrgInstanceUrl` on the Project record. Set all three to `null`. If the org has an active refresh token, attempt to revoke it via the Salesforce revoke endpoint first (best-effort, don't block archive on failure).
  2. **Step 6 — Disconnect Jira:** Set `JiraConfig.enabled = false` and clear `JiraConfig.apiToken` for the project. This prevents any in-flight retry events from pushing to the client's Jira.
  3. **Step 7 — Log retention policy:** Add `auditLogRetentionDays Int @default(730)` to Project model (730 = 2 years). Set this value during archive. Create an Inngest cron function that runs weekly, queries archived projects past their retention date, and deletes audit logs older than the retention window.
- **Business rules:** Credential deletion is a security requirement, not optional. SF token revocation is best-effort (the Salesforce instance may be unreachable). Jira disconnect preserves the JiraConfig record (for reference) but disables sync and clears the secret. Log retention is a compliance requirement — the cron runs independently and doesn't block the archive action.
- **Files:** `src/actions/project-archive.ts`, `prisma/schema.prisma` (Project.auditLogRetentionDays), new `src/lib/inngest/functions/audit-log-retention.ts`, `src/app/api/inngest/route.ts` (register)

### 2.4 Jira Configurable Sync (REQ-QA-004)

- **What it does:** Makes Jira sync configurable per project as the PRD requires:
  1. **Field mapping config:** Add `fieldMapping Json?` to `JiraConfig` model. Schema: `{ storyPoints?: string, acceptanceCriteria?: string, priority?: string, ...customFields }`. Each key maps an app field to a Jira field ID. The field mapping UI shows a table with app fields on the left and Jira custom field ID inputs on the right.
  2. **Trigger status config:** Add `triggerStatuses String[]` to `JiraConfig` model. Default: `["IN_PROGRESS", "IN_REVIEW", "QA", "DONE"]`. Only these statuses trigger a Jira push. The Jira settings page shows checkboxes for each StoryStatus value.
  3. **Story points + AC sync:** Update `mapStoryToJiraFields` to read the project's field mapping config. When `storyPoints` field ID is configured, include story points in the push. When `acceptanceCriteria` field ID is configured, include AC in ADF format.
- **Business rules:** If no field mapping is configured, fall back to current behavior (title + description only). Trigger statuses default to execution states — internal management states (DRAFT, READY, SPRINT_PLANNED) are excluded by default. The Jira sync Inngest function checks `triggerStatuses.includes(newStatus)` before proceeding. Field IDs are free-text inputs (e.g., `customfield_10016`) because they vary per Jira instance.
- **Files:** `prisma/schema.prisma` (JiraConfig), `src/lib/jira/field-mapping.ts`, `src/lib/inngest/functions/jira-sync.ts` (status filter), `src/actions/jira-sync.ts` (save config), Jira settings UI component

### 2.5 Phase Advancement (REQ-QA-005)

- **What it does:** Adds the ability for PM/SA to advance or set the project's `currentPhase`:
  1. **Server action:** New `updateProjectPhase` action in `projects.ts`. Accepts `projectId` and `phase` (ProjectPhase enum). Validates role (PM or SA only). Updates `project.currentPhase`. Emits a `PROJECT_STATE_CHANGED` event to trigger dashboard synthesis.
  2. **UI control:** Add a phase selector to the project settings page (or project header). Shows the 8 phases as a stepper/dropdown. Current phase is highlighted. PM/SA can click to advance (or set to any phase — not strictly sequential, since engagements may skip phases).
  3. **Phase context in AI:** The AI system prompt already receives `currentPhase` via `chat-context.ts`. No change needed — once the phase is actually updated, the AI naturally gets the correct context.
- **Business rules:** Phase changes are not sequential gates — a PM can set the phase to any value. This is intentional because not all engagement types follow the full 8-phase lifecycle. Phase changes are logged as audit events. Changing to ARCHIVE is NOT done through this control — that uses the existing archive action with its full sequence.
- **Files:** `src/actions/projects.ts` (new action), project settings or header component (UI), `src/lib/inngest/events.ts` (if PROJECT_STATE_CHANGED needs data shape update)

### 2.6 Default Epic Templates (REQ-QA-006)

- **What it does:** When a project is created, automatically provisions default epics based on the engagement type:
  - **GREENFIELD:** Discovery, Requirements & Story Definition, Solution Design, Build, Testing, Deployment, Hypercare & Handoff
  - **BUILD_PHASE:** Requirements Import, Solution Design, Build, Testing, Deployment
  - **MANAGED_SERVICES:** Enhancement Requests, Maintenance & Support, SLA Tracking
  - **RESCUE_TAKEOVER:** Org Health Assessment, Gap Analysis, Remediation, Stabilization, Testing, Deployment
- **Implementation:** Create an Inngest function that consumes `PROJECT_CREATED` and provisions the default epics. Each epic template is a simple config: `{ title, description, phase }`. The function creates Epic records for the project with status DRAFT.
- **Business rules:** Default epics are created with status DRAFT and no features/stories — they're scaffolding. Users can rename, delete, or add to them. If the project already has epics when the function runs (race condition), skip provisioning. The epic templates are defined as a constant in the codebase, not in the database — they're product decisions, not user config.
- **Files:** New `src/lib/inngest/functions/default-epic-provisioning.ts`, `src/lib/project-templates/epic-defaults.ts` (template definitions), `src/app/api/inngest/route.ts` (register)

### 2.7 AI Test Case Generation (REQ-QA-007)

- **What it does:** Implements the critical missing capability: AI-generated test cases from story acceptance criteria.
  1. **Agent harness task:** New task definition `TEST_CASE_GENERATION` in the agent harness. System prompt instructs Claude to analyze a story's acceptance criteria and generate structured test cases covering happy path, edge cases, negative cases, and bulk scenarios.
  2. **Context loader:** Assembles story title, description, acceptance criteria, related business processes, and any existing manual test cases (to avoid duplicates).
  3. **Output schema:** Array of `{ title, steps, expectedResult, testType }`. Validated against TestType enum.
  4. **Trigger:** An Inngest function consuming `STORY_STATUS_CHANGED` when the new status is `READY`. Also available as a manual action from the story detail page ("Generate Test Cases" button).
  5. **Storage:** Creates TestCase records with `source: "AI_GENERATED"`.
- **Business rules:** AI test cases are generated when a story transitions to READY (all required fields are populated). QAs review and can edit/delete AI-generated cases. Manual test cases are never overwritten. If AI test cases already exist for a story, regeneration replaces them (with a confirmation prompt from the UI). The test types (`HAPPY_PATH`, `EDGE_CASE`, `NEGATIVE`, `BULK`) are assigned by the AI based on the test's nature.
- **Files:** New `src/lib/agent-harness/tasks/test-case-generation.ts` (task definition), new `src/lib/inngest/functions/test-case-generation.ts` (Inngest function), `src/actions/test-executions.ts` (manual trigger action), story detail component (generate button)

### 2.8 Test Execution UI (REQ-QA-008)

- **What it does:** Builds the test execution surface on the story detail page:
  1. **Test case list:** Render all test cases for the story in a table. Columns: title, type badge (HAPPY_PATH/EDGE_CASE/etc.), source badge (AI/MANUAL), latest result (PASS/FAIL/BLOCKED/Not Run), actions.
  2. **Execute test:** Each row has Pass/Fail/Blocked buttons. Clicking one calls `recordTestExecution` with the result and current user as executor.
  3. **Fail → Defect flow:** When marking FAIL, auto-open `DefectCreateSheet` with `prefill.testCaseId` and `prefill.storyId` already set. The QA fills in the defect details and the defect is immediately linked to the failed test case.
  4. **Add manual test case:** An "Add Test Case" button opens an inline form or sheet for manual test case creation.
- **Business rules:** Only QA and SA roles can execute tests (record results). All roles can view test cases. The most recent execution result for each test case is the one displayed. Historical executions are viewable via a detail expand. The test case table should show "Not Run" for test cases with no executions.
- **Files:** New `src/components/stories/test-execution-panel.tsx`, `src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/stories/[storyId]/story-detail-client.tsx` (integrate panel), `src/actions/test-executions.ts` (verify getStoryTestCases returns enough data)

### 2.9 Test Coverage Metrics + QA Event Wiring (REQ-QA-009)

- **What it does:** Three related items:
  1. **Per-story coverage:** Compute and display per-story test execution status: total test cases, passed, failed, blocked, not executed. Show as a progress bar or fraction on the story card/row.
  2. **Per-sprint coverage:** Add a test execution aggregate section to the sprint detail page. Query all stories in the sprint, compute aggregate test execution metrics. Show as a summary card: "12/20 passed, 4 failed, 2 blocked, 2 not run."
  3. **Overall project metric:** Fix the PM dashboard's QA summary to compute the PRD metric: `stories with all test cases passed / total stories in QA or Done status`. Replace the current flat execution count.
  4. **QA event consumers:** Register Inngest consumers for `TEST_EXECUTION_RECORDED`, `DEFECT_CREATED`, `DEFECT_STATUS_CHANGED`. Each triggers `PM_DASHBOARD_SYNTHESIS` to refresh the PM dashboard. This ensures QA activity updates the dashboard in real time, not just on story status changes.
- **Business rules:** "All test cases passed" means every test case for the story has at least one execution with result PASS and no unresolved FAIL results. A story with 0 test cases is excluded from the metric (not counted as passing or failing). The sprint aggregate uses the same per-story logic rolled up.
- **Files:** `src/lib/inngest/functions/pm-dashboard-synthesis.ts` (fix QA metric), new `src/lib/inngest/functions/qa-event-handlers.ts` (event consumers), `src/app/api/inngest/route.ts` (register), sprint detail component (aggregate section), story list/card component (coverage indicator)

### 2.10 Final Project Summary Document (REQ-QA-010)

- **What it does:** Generates a comprehensive project summary document when a project is archived:
  1. **Template:** New document template `PROJECT_SUMMARY` in the Phase 8 template system. Sections: Executive Summary, Engagement Timeline, Deliverables Catalog (all generated documents), Architecture Decisions (all decisions), Knowledge Base State (article count, topic coverage), Org Knowledge Summary, Key Metrics (stories completed, defects resolved, test coverage), Team Roster.
  2. **Trigger:** An Inngest function consuming `PROJECT_ARCHIVED` event. Triggers document generation using the `PROJECT_SUMMARY` template with full project scope.
  3. **Context loader:** Pulls from all project data: epics, stories (counts/statuses), decisions, risks, knowledge articles, org components, generated documents list, team members, milestones, sprint history.
- **Business rules:** The summary document is generated after archive steps complete (credential deletion, Jira disconnect). If generation fails, the archive is not rolled back — the project is still archived, and the summary can be regenerated manually. The summary is the last document generated for the project and gets version 1 (using Phase 8's versioning model). Token budget for context assembly may need aggressive truncation for large projects — prioritize decisions and deliverables over raw story content.
- **Files:** New `src/lib/documents/templates/project-summary.ts`, new `src/lib/inngest/functions/archive-summary-generation.ts`, `src/app/api/inngest/route.ts` (register)

### 2.11 Phase Emphasis + Engagement-Type AI Context (REQ-QA-011)

- **What it does:** Lightweight phase and engagement awareness:
  1. **Phase emphasis in system prompt:** Add a section to the AI chat system prompt that varies by `currentPhase`. Each phase gets 2-3 sentences of emphasis guidance. E.g., Discovery: "Focus on gathering information, asking questions, and building understanding of the client's business." Testing: "Focus on test coverage, defect resolution, and QA metrics." This is a prompt-level change, not a dashboard change (dashboards are Phase 7's concern).
  2. **Engagement-type AI differentiation:** Expand the engagement type context in the system prompt beyond just the label. Add behavioral guidance per type. E.g., RESCUE_TAKEOVER: "This is a rescue project. Prioritize org health assessment, identify existing technical debt, and focus on stabilization before new feature work." MANAGED_SERVICES: "This is an ongoing support engagement. Focus on SLA tracking, enhancement requests, and maintenance efficiency."
  3. **Phase indicator in UI:** Add a phase badge to the project header (visible on all project pages). Shows current phase name. Clicking opens the phase advancement control (from REQ-QA-005).
- **Business rules:** The AI prompt additions are additive — they don't remove existing context, just add phase/engagement-specific guidance. If `currentPhase` is DISCOVERY (default), the existing behavior is effectively unchanged. The phase badge is read-only for non-PM/SA roles.
- **Files:** `src/lib/chat-tools/system-prompt.ts` (add phase and engagement blocks), `src/lib/agent-harness/context/chat-context.ts` (enhance engagement type context), project header component (phase badge)

---

## 3. Technical Approach

### 3.1 Implementation Strategy

Four parallel tracks, then convergence:

**Track A — Security & Infrastructure (Tasks 1-4):**
QA RBAC fixes, archive completion, Jira config, defect improvements. These are independent and can be built in parallel. Archive completion is the security-critical item — do it early.

**Track B — Test Execution Surface (Tasks 7-9):**
AI test case generation → test execution UI → coverage metrics. This is the core QA workflow chain.

**Track C — Lifecycle Management (Tasks 5-6, 11-12):**
Phase advancement, default epic templates, phase emphasis. Independent from QA.

**Track D — Archive Capstone (Task 10):**
Final summary document. Depends on archive completion (Task 3) and Phase 8 template infrastructure.

### 3.2 File/Module Structure

```
prisma/
  schema.prisma                                    — MODIFY (Attachment.defectId, JiraConfig.fieldMapping/triggerStatuses, Project.auditLogRetentionDays)
src/lib/
  story-status-machine.ts                          — MODIFY (add BA to management transitions)
  defect-status-machine.ts                         — NO CHANGE (already correct)
  agent-harness/
    tasks/
      test-case-generation.ts                      — CREATE (agent task definition)
    context/
      chat-context.ts                              — MODIFY (enhance engagement type context)
  chat-tools/
    system-prompt.ts                               — MODIFY (phase + engagement blocks)
  jira/
    field-mapping.ts                               — MODIFY (read from JiraConfig, add SP+AC)
  inngest/
    functions/
      test-case-generation.ts                      — CREATE (Inngest function)
      default-epic-provisioning.ts                 — CREATE (PROJECT_CREATED consumer)
      audit-log-retention.ts                       — CREATE (weekly cron)
      archive-summary-generation.ts                — CREATE (PROJECT_ARCHIVED consumer)
      qa-event-handlers.ts                         — CREATE (TEST_EXECUTION_RECORDED etc.)
      jira-sync.ts                                 — MODIFY (add triggerStatuses filter)
      pm-dashboard-synthesis.ts                    — MODIFY (fix QA coverage metric)
    events.ts                                      — MODIFY (new event types if needed)
  documents/
    templates/
      project-summary.ts                           — CREATE
      index.ts                                     — MODIFY (register project-summary)
  project-templates/
    epic-defaults.ts                               — CREATE (engagement-type epic templates)
src/actions/
  project-archive.ts                               — MODIFY (credential deletion, Jira disconnect, retention)
  projects.ts                                      — MODIFY (updateProjectPhase action, QA DRAFT enforcement)
  jira-sync.ts                                     — MODIFY (save field mapping + trigger config)
  defects.ts                                       — MODIFY (attachment handling)
  test-executions.ts                               — MODIFY (manual generate trigger)
  stories.ts                                       — MODIFY (QA DRAFT enforcement)
src/components/
  defects/
    defect-edit-sheet.tsx                           — CREATE
    defect-create-sheet.tsx                         — MODIFY (add file upload)
  stories/
    test-execution-panel.tsx                        — CREATE
  projects/
    phase-badge.tsx                                 — CREATE
  settings/
    jira-field-mapping.tsx                          — CREATE (or MODIFY existing Jira settings)
src/app/
  (dashboard)/projects/[projectId]/
    work/[epicId]/[featureId]/stories/[storyId]/
      story-detail-client.tsx                      — MODIFY (integrate test execution panel)
    defects/
      defects-page-client.tsx                      — MODIFY (wire edit sheet)
  api/inngest/route.ts                             — MODIFY (register new functions)
```

### 3.3 Data Changes

**Migration 1 — Defect attachments:**
```prisma
model Attachment {
  // ... existing fields ...
  defectId    String?
  defect      Defect?  @relation(fields: [defectId], references: [id])
}

model Defect {
  // ... existing fields ...
  attachments Attachment[]
}
```

**Migration 2 — JiraConfig extensions:**
```prisma
model JiraConfig {
  // ... existing fields ...
  fieldMapping    Json?       // { storyPoints: "customfield_10016", acceptanceCriteria: "customfield_10017", ... }
  triggerStatuses String[]    @default(["IN_PROGRESS", "IN_REVIEW", "QA", "DONE"])
}
```

**Migration 3 — Project audit log retention:**
```prisma
model Project {
  // ... existing fields ...
  auditLogRetentionDays  Int  @default(730)
}
```

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| BA tries execution transition (IN_PROGRESS → IN_REVIEW) | Blocked by story status machine | "Your role (BA) cannot perform execution transitions" |
| QA creates story with status READY | Blocked by server action validation | "QA role can only create stories in DRAFT status" |
| Archive with unreachable SF org (token revocation fails) | Clear local credentials anyway, log warning | Credentials deleted locally; revocation logged as failed |
| Archive with in-flight Jira retry event | JiraConfig.enabled = false prevents the retry from pushing | Retry function checks enabled flag, exits early |
| AI test case generation for story with no acceptance criteria | Generate minimal cases from title + description, log warning | At least 1 HAPPY_PATH test case generated |
| AI test case regeneration when manual test cases exist | Only replace AI_GENERATED cases, preserve MANUAL | Manual test cases are never deleted by regeneration |
| Record test execution for a test case that was just deleted | Return error, don't create orphaned execution | "Test case not found" |
| Jira field mapping with invalid custom field ID | Jira API returns error, Inngest retries | Log field-level error, push remaining valid fields |
| Default epic provisioning race condition (duplicate events) | Check if epics already exist, skip if > 0 | Idempotent — no duplicate epics |
| Project summary for very large project (token overflow) | Truncate per template priority, generate with available context | Warning logged, summary still generates |
| Audit log retention cron finds 100K+ logs to delete | Batch delete in chunks of 1000 | Inngest step function with pagination |
| Phase set to ARCHIVE via phase selector | Blocked — archive must go through archive action | "Use the Archive Project action to archive this project" |

---

## 5. Integration Points

### From Phase 1
- **Role gates** — `requireRole` used for phase advancement (PM/SA), test execution (QA/SA), and Jira config (SA/PM).
- **Auth layer** — `getCurrentMember` with active status check used in all new actions.
- **Story status machine** — Modified to include BA in management transitions.

### From Phase 4
- **DRAFT-to-READY validation gate** — Phase 4's mandatory field validation ensures stories reaching READY have complete data (persona, AC, components, test case stubs). Phase 9's AI test case generation (REQ-QA-007) triggers on READY status, so it can assume validated story content.
- **Test case stubs** — Phase 4 creates `TestCase` records with `source: "STUB"` during story generation. Phase 9's AI test case generation creates records with `source: "AI_GENERATED"`. When Phase 9 regenerates test cases for a story, it replaces only `AI_GENERATED` records — `STUB` records from Phase 4 are preserved as the user's accepted baseline.
- **Story status machine** — Phase 9's BA management transition fix (REQ-QA-001) extends the same `story-status-machine.ts` that Phase 4's validation gate wires into. Phase 1 REQ-RBAC-009 adds BA to management transitions; Phase 9 adds QA DRAFT-only enforcement.

### From Phase 8
- **Notification types** — Phase 8 adds DEFECT_CREATED, DEFECT_STATUS_CHANGED, TEST_EXECUTION_RECORDED to the enum. Phase 9 wires the Inngest consumers.
- **Document template system** — PROJECT_SUMMARY template follows the same pattern as Phase 8's SOW, Test Script, etc.
- **Document versioning** — The archive summary document uses Phase 8's versioning model (version 1, DRAFT status).
- **Branding** — Archive summary document uses project branding from Phase 8's BrandingConfig.

### For Future Phases
- **Phase 7 (Dashboards):** Phase 9 fixes the QA coverage metric in `pm-dashboard-synthesis.ts`. Phase 7 can build on this for the full PM dashboard. Phase 9's phase emphasis is prompt-level only — Phase 7 adds dashboard-level phase rendering.
- **V2 (Reactivation):** GAP-ARCH-004 is deferred. The archive completion work (credential deletion, Jira disconnect) ensures a clean archive state that V2's fork-and-inherit can build on.

---

## 6. Acceptance Criteria

**QA Workflow:**
- [ ] BA can transition stories through DRAFT → READY → SPRINT_PLANNED
- [ ] QA story creation is limited to DRAFT status
- [ ] Defects can be edited after creation (title, severity, status, assignee, description fields)
- [ ] Defects support file attachments (PNG, JPEG, GIF, PDF, DOCX) up to 10MB each
- [ ] AI test cases are generated when a story transitions to READY
- [ ] AI test cases cover HAPPY_PATH, EDGE_CASE, NEGATIVE, and BULK types
- [ ] AI_GENERATED test cases have correct source field (not MANUAL)
- [ ] Story detail page shows test case list with Pass/Fail/Blocked controls
- [ ] Failing a test case opens DefectCreateSheet with test case pre-linked
- [ ] Per-story test coverage shows total/passed/failed/blocked/not-run
- [ ] Sprint detail page shows aggregate test execution metrics
- [ ] PM dashboard QA metric shows "stories with all tests passed / stories in QA or Done"
- [ ] TEST_EXECUTION_RECORDED, DEFECT_CREATED, DEFECT_STATUS_CHANGED events trigger dashboard refresh

**Jira Sync:**
- [ ] SA can configure field mapping (story points, AC, custom fields) per project
- [ ] SA can configure which story statuses trigger a Jira push
- [ ] Story points are synced to Jira when the field ID is configured
- [ ] Acceptance criteria are synced to Jira in ADF format when the field ID is configured
- [ ] Internal management states (DRAFT, READY, SPRINT_PLANNED) do not trigger Jira pushes by default
- [ ] Projects without field mapping config fall back to title + description only

**Archival:**
- [ ] Archive action clears sfOrgAccessToken, sfOrgRefreshToken, sfOrgInstanceUrl
- [ ] Archive action disables JiraConfig and clears apiToken
- [ ] Archive action sets auditLogRetentionDays (default 730)
- [ ] Weekly cron deletes audit logs past retention window for archived projects
- [ ] PROJECT_ARCHIVED event triggers final project summary document generation
- [ ] Project summary document includes deliverables, decisions, metrics, and team roster

**Lifecycle:**
- [ ] PM/SA can set project currentPhase via settings or header control
- [ ] Phase changes emit PROJECT_STATE_CHANGED for dashboard refresh
- [ ] Setting phase to ARCHIVE is blocked (must use archive action)
- [ ] Default epics are provisioned on project creation based on engagement type
- [ ] AI system prompt includes phase-specific guidance for the current phase
- [ ] AI system prompt includes engagement-type-specific behavioral guidance
- [ ] Phase badge visible in project header showing current phase
- [ ] No regressions in existing QA, Jira, archive, or project creation functionality

---

## 7. Open Questions

None — all scoping decisions resolved. GAP-ARCH-004 deferred to V2 per existing Phase Plan risk notes.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 9`. GAP-ARCH-004 (reactivation fork-and-inherit) deferred to V2. GAP-JIRA-003 and GAP-JIRA-004 confirmed resolved. 19 active gaps consolidated to 11 tasks. |
