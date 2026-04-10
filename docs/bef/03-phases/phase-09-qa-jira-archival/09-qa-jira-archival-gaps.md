# Gap Analysis: QA Workflow, Jira Sync, and Project Lifecycle

**Domain:** QA Workflow, Jira Sync, Project Lifecycle
**PRD Sections:** 7 (Project Lifecycle), 18 (QA Workflow), 20 (Jira Sync), 21 (Project Archival)
**Audited:** 2026-04-08

---

## Summary

Of the four PRD sections audited, QA workflow is mostly implemented at the data and action layer but is missing several key capabilities at the product surface. Jira sync is functionally correct after the ADMIN-01 fix but has hardcoded field mapping that contradicts what the PRD specifies. Project archival covers the status-flip and notification but skips the 4 most consequential archival steps. Project lifecycle phase management lacks any mechanism to advance `currentPhase` on the Project model. Reactivation is a simple status undo, not the knowledge-inheritance model the PRD requires.

---

### GAP-QA-001: No AI generation of test cases from acceptance criteria

- **Severity:** Critical
- **Perspective:** Functionality
- **PRD Reference:** Section 18.1 — "Each user story has associated test cases (generated from acceptance criteria during story creation)."
- **What PRD says:** Test cases are AI-generated from a story's acceptance criteria as part of the story creation workflow. QAs then review them and can add additional cases.
- **What exists:** The `TestSource` enum in `prisma/schema.prisma` (line 177) has both `AI_GENERATED` and `MANUAL`. The `createTestCase` action in `src/actions/test-executions.ts` hardcodes `source: "MANUAL"` (line 104). The `mutate-test-cases.ts` AI tool at `src/lib/chat-tools/write/mutate-test-cases.ts` (line 36) also hardcodes `source: "MANUAL"`. There is no Inngest function, agent task, or story creation hook that triggers test case generation. No code path ever writes `AI_GENERATED` to the `TestCase.source` field.
- **The gap:** The `AI_GENERATED` source enum value is defined but never used. No story creation flow triggers test case generation. QAs have to create all test cases manually. The PRD expectation that stories arrive in the QA phase with pre-populated test cases is unmet.
- **Scope estimate:** L
- **Dependencies:** Story creation flow, agent harness task definition, story enrichment pipeline
- **Suggested phase grouping:** QA Capability Completion

---

### GAP-QA-002: Defect edit is a stub — no edit sheet implemented

- **Severity:** Significant
- **Perspective:** Functionality / UX
- **PRD Reference:** Section 18.1 — "QA engineers use the web application to... Log defects... Track defect resolution."
- **What PRD says:** Defects are full-lifecycle work items that are logged and maintained through resolution.
- **What exists:** `defects-page-client.tsx` (line 76) has a `handleEdit` function that calls `toast.info("Edit defect ${defect.displayId} -- editing coming in next iteration")`. There is a `DefectCreateSheet` component that handles creation only. The `updateDefect` action in `src/actions/defects.ts` is fully implemented and ready, but no UI sheet calls it.
- **The gap:** Users cannot edit a defect after creation — no title change, no severity update, no reassignment via UI. The server action is wired and correct; only the UI sheet is missing.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** QA Capability Completion

---

### GAP-QA-003: No test execution UI on the story detail page

- **Severity:** Critical
- **Perspective:** Functionality / UX
- **PRD Reference:** Section 18.1 — "Execute tests and record results. QAs mark individual test cases as Pass, Fail, or Blocked. Failed tests can be linked to a defect."
- **What PRD says:** QAs work in the story detail view to mark test cases pass/fail/blocked and immediately log a defect on failure.
- **What exists:** `recordTestExecution` action exists in `src/actions/test-executions.ts` (line 113). `getStoryTestCases` action exists (line 169). The story detail page at `src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/stories/[storyId]/story-detail-client.tsx` exists and references defects, but there is no rendered test case list with pass/fail controls. The `DefectCreateSheet` accepts a `prefill.testCaseId` prop to support the "fail → log defect" flow but nothing on the story detail page invokes it from a test case row.
- **The gap:** The full test execution loop — view test cases, mark result, log defect on failure — has no UI entry point on the story detail page. The actions exist and are wired; the UX surface is entirely absent.
- **Scope estimate:** M
- **Dependencies:** GAP-QA-001 (AI test case generation), GAP-QA-002 (defect edit)
- **Suggested phase grouping:** QA Capability Completion

---

### GAP-QA-004: Test coverage metric not computed or surfaced

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 18.2 — "Overall: test coverage metric (stories with all test cases passed / total stories in QA or Done)."
- **What PRD says:** Three levels of coverage tracking: per-story (passed/failed/not executed), per-sprint (aggregate across sprint stories), and overall project-level metric.
- **What exists:** The PM dashboard synthesis function (`src/lib/inngest/functions/pm-dashboard-synthesis.ts`) computes aggregate pass/fail/blocked counts and open defect counts across the project (lines 287–324) and surfaces them in the `QaSummary` component. However, the aggregate counts are flat totals of all test executions ever recorded — not per-story completeness, not per-sprint rollup, and not the specific PRD metric (stories-with-all-tests-passing / total stories in QA or Done).
- **The gap:** The per-story and per-sprint test execution views don't exist. The overall metric shown in the PM dashboard is "total executions by result" not "stories with all cases passing." These are materially different: a story with 10 test cases that has had its first one marked PASS shows 100% pass on the flat metric but is 10% complete on the PRD metric.
- **Scope estimate:** M
- **Dependencies:** GAP-QA-003 (test execution UI)
- **Suggested phase grouping:** QA Capability Completion

---

### GAP-QA-005: Defect attachment / screenshot upload not implemented

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 18.1 — "Defects include: severity, steps to reproduce, expected behavior, actual behavior, screenshots/attachments, and the environment where the defect was observed."
- **What PRD says:** Defect records include file attachments and screenshots as first-class fields.
- **What exists:** The `Defect` model in `prisma/schema.prisma` (lines 777–806) has no attachment relation and no screenshot field. The `DefectCreateSheet` component (all 320 lines) has no file upload control. The `createDefect` and `updateDefect` actions have no attachment handling. The project-level `Attachment` model exists in the schema and is used for other entities, but it is not related to `Defect`.
- **The gap:** The schema, action, and UI all omit attachments/screenshots for defects. The `Attachment` model pattern exists elsewhere and could be reused, but the relation is absent from the Defect model.
- **Scope estimate:** M
- **Dependencies:** None (Attachment model pattern already exists)
- **Suggested phase grouping:** QA Capability Completion

---

### GAP-QA-006: QA role cannot transition story status — contradicts RBAC table

- **Severity:** Significant
- **Perspective:** Functionality / Architecture
- **PRD Reference:** Section 19.1 RBAC table — "Transition story status (execution): SA and Developer can move stories through these statuses." Also Section 18.1 — "Defects follow a lifecycle: Open > Assigned > Fixed > Verified > Closed. QAs verify fixes and close defects."
- **What PRD says:** QA engineers can execute tests and record results. QA role is the only role that can move a defect from FIXED to VERIFIED (they own defect verification). For story status, the RBAC table confirms QA cannot transition stories.
- **What exists:** `src/lib/story-status-machine.ts` (lines 26–27) lists `PM_ROLES` and `DEV_ROLES` only for story transitions; BA and QA are explicitly excluded. `src/lib/defect-status-machine.ts` (line 31) correctly restricts `FIXED → VERIFIED` to QA only. The story status machine also excludes BA entirely from execution transitions — the PRD RBAC table at Section 19.1 shows BA can do "Transition story status (management)" for DRAFT/READY/SPRINT_PLANNED. Looking at `src/lib/story-status-machine.ts`, BA is not in `PM_ROLES`, which means BAs cannot currently do management transitions (DRAFT → READY) even though PRD says they can.
- **The gap:** Two sub-issues: (1) Story status machine excludes BA from management transitions (DRAFT → READY). The PRD RBAC table at Section 19.1 shows BA can transition stories through management states. (2) QA creating stories is supposed to be limited to DRAFT status only — no code enforces this constraint in `createStory`.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** RBAC Hardening

---

### GAP-QA-007: No per-sprint test execution aggregate in sprint view

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 18.2 — "Per sprint: aggregate test execution status across all stories in the sprint."
- **What PRD says:** Sprint view shows aggregate test execution status for all stories assigned to that sprint.
- **What exists:** Sprint pages exist. PM dashboard shows project-wide QA totals. No sprint-scoped test execution aggregate is computed or displayed anywhere.
- **The gap:** The sprint detail page has no test execution rollup. A QA lead or PM cannot look at a sprint and see "12/20 test cases passed, 4 blocked, 4 not run."
- **Scope estimate:** S
- **Dependencies:** GAP-QA-004
- **Suggested phase grouping:** QA Capability Completion

---

### GAP-QA-008: TEST_EXECUTION_RECORDED and DEFECT_* Inngest events have no consumers

- **Severity:** Minor
- **Perspective:** Architecture
- **PRD Reference:** Section 18.2 — test tracking implies live dashboard updates on QA activity
- **What PRD says:** Implied: QA activity should update dashboard state progressively.
- **What exists:** `src/actions/test-executions.ts` (line 143) emits `TEST_EXECUTION_RECORDED`. `src/actions/defects.ts` emits `DEFECT_CREATED` (line 122) and `DEFECT_STATUS_CHANGED` (line 232). None of these events have Inngest consumers registered in `src/app/api/inngest/route.ts`. The milestone audit confirmed this. `PROJECT_STATE_CHANGED` is now sent from story status changes (ADMIN-01 fix), but QA events do not send it and do not trigger PM dashboard synthesis.
- **The gap:** Test execution and defect events are fire-and-forget. No background job reacts to them to update the PM dashboard, trigger notifications to the SA, or trigger any downstream processing. The PM dashboard only refreshes when story status changes, not when QA records a test result or logs a defect.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Event Wiring Cleanup

---

### GAP-JIRA-001: Field mapping is hardcoded — not configurable per project

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 20.4 — "field mapping (which application fields map to which Jira fields)"
- **What PRD says:** The solution architect configures field mapping during project setup as part of Jira sync configuration. This is a per-project setting.
- **What exists:** `src/lib/jira/field-mapping.ts` contains a hardcoded `mapStoryToJiraFields` function that maps `title` to `summary` and `description` to Jira ADF. Story points mapping has a TODO comment (line 46): "Add configurable story points field ID (customfield_NNNNN varies per Jira instance)." The `JiraConfig` model in `prisma/schema.prisma` (lines 1227–1239) has no `fieldMapping` column. The `saveJiraConfig` action has no field mapping parameter.
- **The gap:** Field mapping is entirely hardcoded in source code. The PRD requires it to be configurable per project because custom field IDs vary by Jira instance. Story points are particularly impacted — the story points custom field ID is different in every Jira Cloud instance and is never synced currently. Acceptance criteria, priority, and other fields that the PRD implies should be mappable are also not configurable.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Jira Integration Hardening

---

### GAP-JIRA-002: Status trigger configuration not exposed — all status changes trigger sync

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 20.4 — "which story statuses trigger a push"
- **What PRD says:** The SA configures which story statuses trigger a Jira sync push. This is a per-project configuration.
- **What exists:** `src/lib/inngest/functions/jira-sync.ts` (line 22) triggers on every `STORY_STATUS_CHANGED` event for any project that has an enabled JiraConfig. There is no filtering by configured trigger statuses. The `JiraConfig` model has no `triggerStatuses` field. Every single story status change (DRAFT → READY, READY → SPRINT_PLANNED, etc.) triggers a Jira push if sync is enabled — including internal management transitions that clients would not want pushed to Jira.
- **The gap:** Pushing DRAFT, READY, and SPRINT_PLANNED statuses to a client's Jira creates noise and potentially violates the client's Jira workflow. The PRD explicitly says which statuses trigger a push should be configurable. Currently all status changes trigger it.
- **Scope estimate:** S
- **Dependencies:** GAP-JIRA-001 (JiraConfig schema extension)
- **Suggested phase grouping:** Jira Integration Hardening

---

### GAP-JIRA-003: JIRA_SYNC_REQUESTED retry mechanism is now wired but was previously broken (resolved)

- **Severity:** Note (resolved)
- **Perspective:** Architecture
- **PRD Reference:** Section 20.5
- **What PRD says:** Inngest background jobs with retry logic, failure alerting, and dead-letter handling.
- **What exists:** The milestone audit identified `JIRA_SYNC_REQUESTED` having no Inngest consumer. The current `src/app/api/inngest/route.ts` (line 38) registers `jiraSyncRetryFunction` which consumes `JIRA_SYNC_REQUESTED`. The retry function is fully implemented in `src/lib/inngest/functions/jira-sync.ts` (lines 176–295).
- **The gap:** This was resolved. The fix was not in the original milestone audit closure table but is present in the current code. No gap remains for this item.
- **Scope estimate:** N/A — resolved
- **Dependencies:** None
- **Suggested phase grouping:** N/A

---

### GAP-JIRA-004: toStatus vs newStatus field mismatch — status of fix unclear

- **Severity:** Critical
- **Perspective:** Architecture
- **PRD Reference:** Section 20.5
- **What PRD says:** Jira sync triggered by story status transitions, pushed as background Inngest job.
- **What exists:** The milestone audit (ADMIN-01) identified that `src/actions/stories.ts` fires `STORY_STATUS_CHANGED` with `toStatus` but `jira-sync.ts` destructures `newStatus`. The current code at `src/actions/stories.ts` (line 311) now sends `newStatus: parsedInput.status` — the fix was applied. `src/lib/inngest/functions/jira-sync.ts` (line 25) destructures `newStatus`. These now match. The audit closure table credits this to Phase 8.
- **The gap:** No gap remains for the `stories.ts` web UI path. However, the audit closure is accurate only for the `transitionStoryStatus` action. Other actions that might emit `STORY_STATUS_CHANGED` should be verified. A quick check shows no other action currently fires `STORY_STATUS_CHANGED` — story status is only changed via `transitionStoryStatus`. No gap.
- **Scope estimate:** N/A — resolved
- **Dependencies:** None
- **Suggested phase grouping:** N/A

---

### GAP-JIRA-005: Story points and acceptance criteria not synced to Jira

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 20.2 — "Updates to stories in this application (status changes, description edits) are pushed to Jira."
- **What PRD says:** Story content updates are pushed. Story points and acceptance criteria are core story fields.
- **What exists:** `src/lib/jira/field-mapping.ts` `mapStoryToJiraFields` function (lines 22–48) maps only `summary` (title + displayId) and `description`. The TODO comment at line 46 acknowledges story points are not mapped. Acceptance criteria (`story.acceptanceCriteria`) are not included in the mapped fields at all.
- **The gap:** Story points are never pushed to Jira. Acceptance criteria are never pushed to Jira. For clients using Jira as their system of visibility, both fields are typically critical. Story points in particular require a per-instance custom field ID that is not yet configurable (see GAP-JIRA-001).
- **Scope estimate:** S (once field mapping config exists)
- **Dependencies:** GAP-JIRA-001
- **Suggested phase grouping:** Jira Integration Hardening

---

### GAP-ARCH-001: archiveProject does not delete Salesforce credentials

- **Severity:** Critical
- **Perspective:** Functionality / Architecture
- **PRD Reference:** Section 21.1, step 5 — "Revokes and deletes the Salesforce org connection credentials."
- **What PRD says:** The archive process is a 7-step sequence. Step 5 explicitly revokes and deletes the Salesforce org credentials as a security requirement.
- **What exists:** `src/actions/project-archive.ts` (lines 22–87) does exactly two things: sets `project.status = "ARCHIVED"` and sends a notification. It does not touch `sfOrgAccessToken`, `sfOrgRefreshToken`, `sfOrgInstanceUrl`, or any credential fields on the Project model. The `Project` model in `prisma/schema.prisma` (lines 408–427) stores `sfOrgAccessToken` and `sfOrgRefreshToken` as plain strings (encrypted externally). Nothing clears these on archive.
- **The gap:** A complete implementation gap for a security requirement. Archived projects retain active Salesforce credentials in the database indefinitely. PRD Section 22.5 also states credentials must be deleted on archive. This is a data handling obligation, not just a feature gap.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Archival Completion

---

### GAP-ARCH-002: archiveProject does not disconnect Jira sync

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 21.1, step 6 — "Disconnects any client Jira sync."
- **What PRD says:** Archiving a project disconnects its Jira integration as part of the archive sequence.
- **What exists:** `src/actions/project-archive.ts` does not call `prisma.jiraConfig.update` to disable sync or delete the JiraConfig. An archived project with an enabled JiraConfig would continue to push story changes to the client's Jira if any story status events were fired — though the archive guard on story status transitions likely prevents this in practice.
- **The gap:** The Jira config is not disabled or deleted during archive. If the archive guard is ever bypassed or if the Inngest retry path processes an in-flight event after archive, the client's Jira could receive unexpected pushes from a project that has been formally concluded.
- **Scope estimate:** S
- **Dependencies:** GAP-ARCH-001
- **Suggested phase grouping:** Archival Completion

---

### GAP-ARCH-003: No final project summary document generated on archive

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 21.1, step 2 — "Generates a final project summary document cataloging all artifacts produced, all architecture decisions made, and the final state of the org knowledge base."
- **What PRD says:** Archiving triggers AI generation of a final summary document. This is a deliverable that persists as the historical record of the engagement.
- **What exists:** `src/actions/project-archive.ts` does not trigger any document generation. The `generateDocumentFunction` Inngest function exists and is registered. The `PROJECT_ARCHIVED` event is sent (line 67) but has no Inngest consumer. No template for a "project summary" or "engagement summary" document type exists in `src/lib/documents/templates/`.
- **The gap:** The archive event fires into a void. No summary document is generated. The PRD describes this as a core deliverable that makes the archive a useful historical record rather than just a status flag.
- **Scope estimate:** L
- **Dependencies:** None, but benefits from knowledge base completeness
- **Suggested phase grouping:** Archival Completion

---

### GAP-ARCH-004: Reactivation is in-place status flip, not new project instance with knowledge inheritance

- **Severity:** Critical
- **Perspective:** Functionality / Architecture
- **PRD Reference:** Section 21.2 — "Reactivation creates a new project instance that inherits the archived project's knowledge base, org knowledge, decisions, and requirements as its starting point. The original archive remains untouched as a historical record."
- **What PRD says:** Reactivation is a fork operation. A new project is created, pre-populated with the archived project's knowledge base. The archived project stays archived forever as an immutable historical record.
- **What exists:** `src/actions/project-archive.ts` `reactivateProject` (lines 98–150) sets `project.status = "ACTIVE"` on the same project record. It is a simple undo. No new project is created. No knowledge inheritance logic exists anywhere in the codebase. The archived project is mutated back to ACTIVE, breaking the immutability guarantee.
- **The gap:** Architecturally incorrect. The PRD model requires a fork-and-inherit pattern. The current implementation is destructive to the historical record (it overwrites the archived project's status), prevents the "original archive remains untouched" guarantee, and provides none of the knowledge seeding that makes reactivation valuable. The Project model has no `sourceProjectId` or `inheritedFromId` field.
- **Scope estimate:** XL
- **Dependencies:** GAP-ARCH-001, GAP-ARCH-003 (archival must be complete before reactivation inherits from it)
- **Suggested phase grouping:** Archival Completion

---

### GAP-ARCH-005: No access log retention enforcement on archive

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 21.1, step 7 — "Retains access logs per the configured retention period (default: 2 years)."
- **What PRD says:** Access logs are explicitly retained with a configured retention period during archive. This is a compliance requirement.
- **What exists:** The `AuditLog` model exists in the schema. `src/lib/inngest/functions/audit-log.ts` writes audit logs. No retention period configuration exists. No retention enforcement runs on archive. The `archiveProject` action does not set any retention policy or flag the project's audit logs for retention.
- **The gap:** No retention policy mechanism exists at all. The archive process does not mark or protect audit logs. For client-facing compliance this is material — logs could be deleted by any future purge logic.
- **Scope estimate:** M
- **Dependencies:** GAP-ARCH-001
- **Suggested phase grouping:** Archival Completion

---

### GAP-LIFECYCLE-001: currentPhase on Project is never advanced by any action

- **Severity:** Significant
- **Perspective:** Functionality / Architecture
- **PRD Reference:** Section 7.2 — "The active phase determines which dashboard views are emphasized and which AI capabilities are highlighted." 8 phases: Discovery, Requirements, Solution Design, Build, Testing, Deployment, Hypercare, Archive.
- **What PRD says:** As a project progresses, its active phase changes. The phase drives dashboard emphasis and AI capability highlighting.
- **What exists:** `Project.currentPhase` is a `ProjectPhase` enum field defaulting to `DISCOVERY` (set in `src/actions/projects.ts` line 57). No action, no UI control, and no automated trigger ever calls `prisma.project.update({ data: { currentPhase: ... } })`. The `updateProject` action does not include `currentPhase` in its schema or data block. The only thing that reads `currentPhase` is the AI agent context (`src/lib/agent-harness/context/chat-context.ts` line 39, `project-summary.ts` line 22) and display badges. Every project is permanently in DISCOVERY phase regardless of how far along it is.
- **The gap:** The `currentPhase` field is write-never after project creation. There is no way for a PM or SA to advance the project phase. The PRD's phase-gated feature emphasis and AI behavior differentiation cannot function.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Project Lifecycle Management

---

### GAP-LIFECYCLE-002: No phase-specific dashboard emphasis or AI capability highlighting

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 7.2 — "The active phase determines which dashboard views are emphasized and which AI capabilities are highlighted."
- **What PRD says:** Each of the 8 phases has different dashboard emphasis. For example, Testing phase emphasizes QA metrics; Build phase emphasizes sprint velocity; Discovery emphasizes question coverage.
- **What exists:** The PM dashboard synthesis (`src/lib/inngest/functions/pm-dashboard-synthesis.ts`) and the discovery dashboard (`src/lib/dashboard/queries.ts`) are both always-on — they show the same metrics regardless of project phase. No conditional rendering based on `currentPhase` exists in any dashboard component. The AI system prompt (`src/lib/chat-tools/system-prompt.ts`) does not branch on phase.
- **The gap:** Since `currentPhase` is never advanced (GAP-LIFECYCLE-001), this gap is partially masked, but even if it were advanced, there is no phase-aware rendering or AI prompt variation implemented anywhere.
- **Scope estimate:** L
- **Dependencies:** GAP-LIFECYCLE-001
- **Suggested phase grouping:** Project Lifecycle Management

---

### GAP-LIFECYCLE-003: Engagement type defaults — no default epic templates created on project setup

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 7.3 — "The application provisions the project's data space in PostgreSQL, creates default epic templates based on engagement type."
- **What PRD says:** When a Greenfield project is created, default epics are provisioned. A Rescue/Takeover project gets different defaults including an Org Health Assessment epic. Managed Services gets enhancement request and SLA epics.
- **What exists:** `src/actions/projects.ts` `createProject` action (lines 40–115) creates the project, creates the creator's ProjectMember record, invites team members, and sends `PROJECT_CREATED` to Inngest. No epic templates are created. No Inngest consumer for `PROJECT_CREATED` creates default epics. The `PROJECT_CREATED` event fires but the audit and current code shows no handler that provisions default epics based on engagement type.
- **The gap:** Every project starts with an empty epic list regardless of engagement type. A new Greenfield project has no Discovery, Solution Design, or Build epics. A Rescue/Takeover has no Org Health Assessment epic. Teams must create all epics from scratch.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Project Lifecycle Management

---

### GAP-LIFECYCLE-004: No engagement-type-specific AI behavior or phase emphasis

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 7.3 — "The engagement type selected at project creation affects which phases are emphasized, which default epics are created, and how the AI prioritizes its assistance."
- **What PRD says:** A Rescue/Takeover engagement has the AI focus on org health and existing debt before planning remediation. A Managed Services engagement has the AI focus on SLA tracking and enhancement requests, not discovery-to-deployment.
- **What exists:** `engagementType` is included in the AI context string (`src/lib/agent-harness/context/chat-context.ts` line 60: `Engagement Type: ${project.engagementType}`). The system prompt and all agent task definitions treat all engagement types identically. No branching logic based on engagement type exists in any task definition or system prompt.
- **The gap:** The AI receives the engagement type as text context but does not behaviorally differentiate based on it. The system prompt, context assembly, and dashboard emphasis are identical for Greenfield and Rescue/Takeover projects. This is a product differentiation gap that reduces the tool's value for non-Greenfield engagements.
- **Scope estimate:** M
- **Dependencies:** GAP-LIFECYCLE-001, GAP-LIFECYCLE-002
- **Suggested phase grouping:** Project Lifecycle Management

---

## Dependency Map

```
GAP-QA-001 (AI test case gen)
  └─ GAP-QA-003 (test execution UI)
       └─ GAP-QA-004 (coverage metric)
            └─ GAP-QA-007 (sprint-level rollup)

GAP-QA-002 (defect edit) ─ independent

GAP-QA-005 (attachments) ─ independent

GAP-QA-006 (RBAC BA/QA story transitions) ─ independent

GAP-QA-008 (orphaned QA events) ─ independent

GAP-JIRA-001 (field mapping config)
  └─ GAP-JIRA-002 (trigger status config)
  └─ GAP-JIRA-005 (story points + AC sync)

GAP-ARCH-001 (SF credential deletion)
  └─ GAP-ARCH-002 (Jira disconnect on archive)
  └─ GAP-ARCH-005 (log retention)
  └─ GAP-ARCH-004 (reactivation — must archive cleanly first)

GAP-ARCH-003 (final summary doc) ─ independent

GAP-LIFECYCLE-001 (currentPhase never advanced)
  └─ GAP-LIFECYCLE-002 (phase emphasis)
  └─ GAP-LIFECYCLE-004 (engagement-type AI behavior)

GAP-LIFECYCLE-003 (default epic templates) ─ independent
```

---

## Priority Order (Critical Gaps First)

| Gap ID | Severity | PRD Section | Scope |
|--------|----------|-------------|-------|
| GAP-QA-001 | Critical | 18.1 | L |
| GAP-QA-003 | Critical | 18.1 | M |
| GAP-ARCH-001 | Critical | 21.1 step 5 | S |
| GAP-ARCH-004 | Critical | 21.2 | XL |
| GAP-JIRA-004 | Resolved | 20.5 | — |
| GAP-JIRA-003 | Resolved | 20.5 | — |
| GAP-QA-002 | Significant | 18.1 | S |
| GAP-QA-004 | Significant | 18.2 | M |
| GAP-QA-005 | Significant | 18.1 | M |
| GAP-QA-006 | Significant | 19.1 | S |
| GAP-JIRA-001 | Significant | 20.4 | M |
| GAP-JIRA-002 | Significant | 20.4 | S |
| GAP-JIRA-005 | Significant | 20.2 | S |
| GAP-ARCH-002 | Significant | 21.1 step 6 | S |
| GAP-ARCH-003 | Significant | 21.1 step 2 | L |
| GAP-LIFECYCLE-001 | Significant | 7.2 | M |
| GAP-LIFECYCLE-002 | Significant | 7.2 | L |
| GAP-LIFECYCLE-003 | Significant | 7.3 | M |
| GAP-QA-007 | Minor | 18.2 | S |
| GAP-QA-008 | Minor | 18.2 | S |
| GAP-ARCH-005 | Minor | 21.1 step 7 | M |
| GAP-LIFECYCLE-004 | Minor | 7.3 | M |

---

## Key Files Referenced

- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/project-archive.ts` — archive/reactivate actions
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/defects.ts` — defect CRUD and status machine
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/test-executions.ts` — test case and execution actions
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/jira-sync.ts` — Jira config management
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/projects.ts` — project creation (no default epic provisioning)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/jira-sync.ts` — jiraSyncOnStatusChange, jiraSyncRetryFunction
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/jira/field-mapping.ts` — hardcoded field mapping with TODO for story points
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/jira/sync.ts` — pushStoryToJira, syncStoryStatus
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/defect-status-machine.ts` — defect transitions with QA-only VERIFIED gate
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/story-status-machine.ts` — story transitions (BA excluded from management transitions)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/chat-tools/write/mutate-test-cases.ts` — AI tool hardcodes MANUAL source
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/defects/defect-create-sheet.tsx` — create-only, no edit capability
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/defects/defects-page-client.tsx` — handleEdit stub
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/pm-dashboard-synthesis.ts` — flat QA aggregate, no per-story/sprint coverage
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/prisma/schema.prisma` — Defect model (no attachment relation), JiraConfig model (no fieldMapping), Project model (currentPhase never written after create)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/api/inngest/route.ts` — function registration (jiraSyncRetryFunction now registered)