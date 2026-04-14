# Phase 9 Tasks: QA, Jira, Archival, Lifecycle

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 11
> Status: 0/11 complete
> Last Updated: 2026-04-14

---

## Execution Order

```
Independent batch (parallel):
  Task 1 (QA RBAC)
  Task 2 (defect edit + attachments)
  Task 3 (archive completion) ────────── security-critical, do early
  Task 4 (Jira config)
  Task 5 (phase advancement)
  Task 6 (default epic templates)

After batch completes:
  Task 7 (AI test case gen) ──┐
  Task 8 (test execution UI) ─┤── can be parallel
                               │
  Task 9 (coverage + events) ─┘── after Task 8

  Task 10 (final summary doc) ── after Task 3
  Task 11 (phase emphasis) ────── after Task 5
```

---

## Tasks

### Task 1: QA RBAC fixes — BA management transitions + QA DRAFT enforcement

| Attribute | Details |
|-----------|---------|
| **Scope** | Add BA to story status management transition group. Add QA DRAFT-only enforcement in createStory. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] BA can transition stories through DRAFT ↔ READY ↔ SPRINT_PLANNED
- [ ] BA still cannot perform execution transitions (IN_PROGRESS → IN_REVIEW → QA → DONE)
- [ ] QA creating a story is forced to DRAFT status regardless of what status is passed
- [ ] Existing PM and SA story transitions are unaffected

**Implementation Notes:**
In `src/lib/story-status-machine.ts`:
- Rename or expand `PM_ROLES` to include `"BA"` for management transitions only. The management transitions are DRAFT ↔ READY ↔ SPRINT_PLANNED. Keep execution roles unchanged.

In `src/actions/stories.ts` `createStory`:
- After role check, if the current member's role is `QA`, override the status to `DRAFT` regardless of input. Log a warning if a non-DRAFT status was requested.

**Gaps covered:** GAP-QA-006

---

### Task 2: Defect edit sheet + file attachments

| Attribute | Details |
|-----------|---------|
| **Scope** | Create DefectEditSheet component wired to updateDefect action. Add Defect → Attachment relation in schema. Add file upload to create and edit sheets. Display attachments in defect views. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `DefectEditSheet` opens from the defects table (replaces toast stub)
- [ ] All editable defect fields are present: title, severity, status, assignee, steps to reproduce, expected/actual behavior, environment
- [ ] Status transitions in the edit sheet follow `defect-status-machine.ts` rules AND the role-gated matrix in PHASE_SPEC §2.2 (PRD-5-17, PRD-18-04)
- [ ] `DefectEditSheet` status dropdown shows only transitions allowed for the current member's role
- [ ] `updateDefect` server action rejects role-disallowed transitions with a message of the form "Your role (X) cannot transition Defect from A to B." (PRD-5-17, PRD-18-04)
- [ ] Attachments use the polymorphic entityType/entityId pattern per TECHNICAL_SPEC §Attachment (PRD-5-25, DECISION-08). No `defectId` FK is added. No `attachments` relation is added to `Defect`.
- [ ] File upload on DefectCreateSheet and DefectEditSheet supports PNG, JPEG, GIF, PDF, DOCX up to 10MB
- [ ] Server action rejects uploads larger than 10MB with HTTP 413
- [ ] Server action rejects disallowed MIME types after server-side content sniffing (not trusting client-declared type)
- [ ] Server action rejects the 6th attachment on a defect with "Maximum 5 attachments per defect"
- [ ] Uploaded files are stored under S3 path `projects/{projectId}/defects/{defectId}/` to isolate per project
- [ ] Uploaded files are persisted as `Attachment` rows with `entityType = "Defect"` and `entityId = defect.id`
- [ ] Defect detail view queries `Attachment.findMany({ where: { entityType: "Defect", entityId } })`
- [ ] Image attachments render inline thumbnails in defect views
- [ ] Non-image attachments show as download links
- [ ] Virus scanning: deferred to V2 if not already provided by Phase 8 upload utility

**Implementation Notes:**
No schema migration required. Defect attachments reuse the existing polymorphic `Attachment` table (`entityType`, `entityId`) from Phase 2. Cites PRD-5-25 and DECISION-08.

Create `src/components/defects/defect-edit-sheet.tsx` — clone `DefectCreateSheet` as starting point, add:
- Populate form with existing defect data
- Status dropdown filtered by allowed transitions for current user's role per PHASE_SPEC §2.2 role matrix
- Call `updateDefect` on submit

In `defects.ts` server action:
- On create/update with attachments, write `Attachment` rows with `entityType: "Defect"`, `entityId: defect.id`
- On status change, enforce the role-gated matrix (PRD-5-17, PRD-18-04) before applying the transition
- Enforce 10MB per file, 5 per defect, MIME sniff server-side

In `defects-page-client.tsx`, replace the `handleEdit` toast with opening `DefectEditSheet` with the selected defect.

For file upload, reuse the S3 upload pattern from Phase 8's branding logo upload if available, or create a shared `uploadFile` utility that enforces the S3 path prefix `projects/{projectId}/defects/{defectId}/`.

**Gaps covered:** GAP-QA-002, GAP-QA-005, PHASE-9-GAP-01, PHASE-9-GAP-07, PHASE-9-GAP-08 (DECISION-08, PRD-5-25, PRD-5-17, PRD-18-03, PRD-18-04)

---

### Task 3: Archive completion — read-only gate, credentials, Jira disconnect, log retention

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement PRD Section 21.1 steps 1 (read-only gate, DECISION-10), 5 (SF credential deletion), 6 (Jira disconnect), and 7 (log retention policy). Publish `assertProjectWritable`. Add audit/access log retention cron. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `assertProjectWritable(projectId)` helper is exported from `src/lib/project-lifecycle/assert-writable.ts` and published as a Phase 9 interface (PRD-21-01, DECISION-10)
- [ ] Helper throws `ProjectArchivedError` (HTTP 409) with message "This project is archived and read-only." when `project.status === "ARCHIVED"`
- [ ] All Phase 9-owned mutating server actions (stories, defects, test-executions, documents, chat, jira-sync, projects.updateProjectPhase) call `assertProjectWritable` as the first step after authentication
- [ ] AI chat requests on archived projects return a canned read-only response instead of invoking the model
- [ ] Document regeneration on archived projects is blocked except for the `PROJECT_SUMMARY` template
- [ ] Archive with in-flight user request: gate rejects after status flip; no partial writes
- [ ] `archiveProject` clears `sfOrgAccessToken`, `sfOrgRefreshToken`, `sfOrgInstanceUrl` to null
- [ ] `archiveProject` attempts SF token revocation via Salesforce revoke endpoint (best-effort, 5s timeout ceiling, failure or timeout does not block archive)
- [ ] `archiveProject` sets `JiraConfig.enabled = false` and clears `JiraConfig.apiToken`
- [ ] `apiToken` and SF credential fields continue to use the Phase 1 encryption-at-rest wrapper; Phase 9 does not alter encryption behavior (PRD-22-04, PRD-22-05)
- [ ] `archiveProject` sets `Project.auditLogRetentionDays` (default 730)
- [ ] Schema has `auditLogRetentionDays Int @default(730)` on Project
- [ ] Weekly Inngest cron enumerates ALL log tables tagged with `projectId` (AuditLog, and AccessLog if present in Phase 1) and deletes rows past retention per project (PRD-21-06)
- [ ] Cron function declares `concurrency: 1` per function id so overlapping runs are skipped by Inngest runtime
- [ ] Cron batches deletes (chunks of 1000) to avoid timeout
- [ ] In-flight Jira retry events are blocked by the disabled JiraConfig

**Implementation Notes:**
In `src/actions/project-archive.ts` `archiveProject`, after the status update and before sending the notification:

```ts
// Step 5: Delete SF credentials
if (project.sfOrgRefreshToken) {
  try {
    await revokeSalesforceToken(project.sfOrgInstanceUrl!, project.sfOrgRefreshToken);
  } catch (e) {
    console.warn("SF token revocation failed (best-effort):", e);
  }
}
await prisma.project.update({
  where: { id: projectId },
  data: {
    sfOrgAccessToken: null,
    sfOrgRefreshToken: null,
    sfOrgInstanceUrl: null,
    auditLogRetentionDays: 730,
  },
});

// Step 6: Disconnect Jira
await prisma.jiraConfig.updateMany({
  where: { projectId },
  data: { enabled: false, apiToken: null },
});
```

Create `src/lib/inngest/functions/audit-log-retention.ts`:
```ts
export const auditLogRetentionFunction = inngest.createFunction(
  { id: "audit-log-retention" },
  { cron: "0 3 * * 0" }, // Weekly Sunday 3am UTC
  async ({ step }) => {
    // Query archived projects, calculate cutoff dates, batch-delete old logs
  }
);
```

In `jira-sync.ts`, verify the sync function checks `jiraConfig.enabled` before pushing. If it already does, no change needed. If not, add a guard.

Create `src/lib/project-lifecycle/assert-writable.ts`:
```ts
export class ProjectArchivedError extends Error {
  statusCode = 409;
  constructor() { super("This project is archived and read-only."); }
}
export async function assertProjectWritable(projectId: string): Promise<void> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { status: true },
  });
  if (project.status === "ARCHIVED") throw new ProjectArchivedError();
}
```

Consumer phases (2, 4, 8) import and call this helper at every mutation entry point. Phase 9 does NOT edit consumer-phase docs (per DECISION-10 scope split).

**Gaps covered:** GAP-ARCH-001, GAP-ARCH-002, GAP-ARCH-005, PHASE-9-GAP-02, PHASE-9-GAP-10 (DECISION-10, PRD-21-01, PRD-21-06, PRD-22-04, PRD-22-05)

---

### Task 4: Jira configurable field mapping + trigger statuses

| Attribute | Details |
|-----------|---------|
| **Scope** | Add fieldMapping and triggerStatuses to JiraConfig schema. Build field mapping UI. Update jira-sync to filter by configured statuses. Update field-mapping.ts to read config and sync story points + AC. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] JiraConfig has `fieldMapping Json?` and `triggerStatuses String[]` with defaults
- [ ] `fieldMapping` is validated on write and read against an exported `JiraFieldMapping` Zod schema (PRD-20-04):
      `{ storyPoints?: string, acceptanceCriteria?: string, priority?: string, customFields?: Record<string,string> }`
- [ ] `saveJiraConfig` rejects mappings where two keys point to the same Jira field ID ("Duplicate Jira field ID in mapping")
- [ ] `triggerStatuses` values are validated server-side against the `StoryStatus` enum at write time; unknown values rejected
- [ ] `jiraPush` helper validates `payload.projectKey === jiraConfig.projectKey` before every HTTP call and rejects mismatches with a logged error (PRD-20-03)
- [ ] Spec restates push-only guarantee: Phase 9 introduces no read-path from Jira (PRD-20-02)
- [ ] `apiToken` continues to use the Phase 1 encryption-at-rest wrapper; Phase 9 does not change encryption behavior (PRD-22-04, PRD-22-05)
- [ ] Jira settings page shows field mapping table (app field → Jira field ID)
- [ ] Jira settings page shows checkboxes for trigger statuses
- [ ] `saveJiraConfig` action accepts and persists fieldMapping and triggerStatuses
- [ ] `jiraSyncOnStatusChange` checks `triggerStatuses.includes(newStatus)` before proceeding
- [ ] `mapStoryToJiraFields` reads fieldMapping config and includes story points when configured
- [ ] `mapStoryToJiraFields` includes acceptance criteria in ADF format when configured
- [ ] Projects without fieldMapping fall back to title + description only (current behavior)
- [ ] Default triggerStatuses exclude internal management states
- [ ] Updating JiraConfig to a new projectKey: in-flight retries for the old projectKey are rejected by the validation

**Implementation Notes:**
Schema migration — add two fields to JiraConfig:
```prisma
model JiraConfig {
  // existing fields...
  fieldMapping    Json?
  triggerStatuses String[]  @default(["IN_PROGRESS", "IN_REVIEW", "QA", "DONE"])
}
```

In `src/lib/inngest/functions/jira-sync.ts` `jiraSyncOnStatusChange`:
```ts
const jiraConfig = await prisma.jiraConfig.findUnique({ where: { projectId } });
if (!jiraConfig?.enabled) return;
if (!jiraConfig.triggerStatuses.includes(newStatus)) return; // New filter
```

In `src/lib/jira/field-mapping.ts`:
```ts
export function mapStoryToJiraFields(story: Story, fieldMapping?: JiraFieldMapping) {
  const fields: Record<string, unknown> = {
    summary: `[${story.displayId}] ${story.title}`,
    description: convertToAdf(story.description),
  };
  if (fieldMapping?.storyPoints && story.storyPoints) {
    fields[fieldMapping.storyPoints] = story.storyPoints;
  }
  if (fieldMapping?.acceptanceCriteria && story.acceptanceCriteria) {
    fields[fieldMapping.acceptanceCriteria] = convertToAdf(story.acceptanceCriteria);
  }
  return fields;
}
```

UI: Add a "Field Mapping" section and a "Trigger Statuses" section to the existing Jira settings component.

Add a `jiraPush` helper (or extend the existing one) that guards `payload.projectKey === jiraConfig.projectKey` before HTTP:
```ts
if (payload.projectKey !== jiraConfig.projectKey) {
  log.error("Jira push projectKey mismatch", { payload: payload.projectKey, config: jiraConfig.projectKey });
  throw new Error("Jira push rejected: projectKey mismatch");
}
```

**Gaps covered:** GAP-JIRA-001, GAP-JIRA-002, GAP-JIRA-005, PHASE-9-GAP-03, PHASE-9-GAP-04 (PRD-20-02, PRD-20-03, PRD-20-04, PRD-22-04, PRD-22-05)

---

### Task 5: Phase advancement — action + UI control

| Attribute | Details |
|-----------|---------|
| **Scope** | Create updateProjectPhase server action. Add phase selector to project settings or header. Emit PROJECT_STATE_CHANGED on phase change. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `updateProjectPhase` action accepts projectId and phase (ProjectPhase enum value)
- [ ] Only PM and SA roles can change the phase
- [ ] Setting phase to `ARCHIVE` is rejected (must use archive action)
- [ ] Phase change emits `PROJECT_STATE_CHANGED` with payload `{ projectId, changeType: "phase", oldValue, newValue }` (see PHASE_SPEC §5)
- [ ] Phase change is recorded as an audit log entry
- [ ] UI shows current phase with ability to change it
- [ ] Phase selector is visible to all roles but only editable by PM/SA

**Implementation Notes:**
In `src/actions/projects.ts`:
```ts
const updateProjectPhaseSchema = z.object({
  projectId: z.string(),
  phase: z.nativeEnum(ProjectPhase).refine(p => p !== "ARCHIVE", "Use Archive action"),
});

export const updateProjectPhase = authenticatedAction
  .schema(updateProjectPhaseSchema)
  .action(async ({ ctx, parsedInput }) => {
    const member = await getCurrentMember(ctx.userId, parsedInput.projectId);
    requireRole(member, ["PM", "SA"]);
    await prisma.project.update({
      where: { id: parsedInput.projectId },
      data: { currentPhase: parsedInput.phase },
    });
    await inngest.send({ name: "PROJECT_STATE_CHANGED", data: { projectId: parsedInput.projectId } });
  });
```

For the UI, add a phase dropdown/stepper in the project settings page. The 7 non-archive phases are shown as options. Use a `Select` component from shadcn/ui with the phase names.

**Gaps covered:** GAP-LIFECYCLE-001

---

### Task 6: Default epic templates on project creation

| Attribute | Details |
|-----------|---------|
| **Scope** | Define engagement-type epic templates. Create Inngest function consuming PROJECT_CREATED that provisions default epics. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `PROJECT_CREATED` event payload includes `engagementType` per contract `{ projectId, engagementType, createdBy, createdAt }` (PHASE_SPEC §5). Phase 9 OWNS this payload extension; Task 6 updates the emitter if upstream Phase 2 currently emits a narrower payload.
- [ ] GREENFIELD projects get 7 default epics (Discovery through Hypercare & Handoff)
- [ ] BUILD_PHASE projects get 5 default epics (Requirements Import through Deployment)
- [ ] MANAGED_SERVICES projects get 3 default epics (Enhancement Requests, Maintenance & Support, SLA Tracking)
- [ ] RESCUE_TAKEOVER projects get 6 default epics (Org Health Assessment through Deployment)
- [ ] Default epics are created with status DRAFT and no features/stories
- [ ] If epics already exist for the project when the function runs, provisioning is skipped
- [ ] Function is registered in Inngest route

**Implementation Notes:**
Create `src/lib/project-templates/epic-defaults.ts`:
```ts
export const EPIC_TEMPLATES: Record<EngagementType, { title: string; description: string }[]> = {
  GREENFIELD: [
    { title: "Discovery", description: "Client discovery, stakeholder interviews, and business process documentation" },
    { title: "Requirements & Story Definition", description: "User stories, acceptance criteria, and requirement sign-off" },
    // ... etc
  ],
  BUILD_PHASE: [...],
  MANAGED_SERVICES: [...],
  RESCUE_TAKEOVER: [...],
};
```

Create `src/lib/inngest/functions/default-epic-provisioning.ts`:
```ts
export const defaultEpicProvisioningFunction = inngest.createFunction(
  { id: "default-epic-provisioning" },
  { event: "PROJECT_CREATED" },
  async ({ event, step }) => {
    const { projectId, engagementType } = event.data;
    await step.run("provision-epics", async () => {
      const existing = await prisma.epic.count({ where: { projectId } });
      if (existing > 0) return; // Idempotent
      const templates = EPIC_TEMPLATES[engagementType] ?? EPIC_TEMPLATES.GREENFIELD;
      await prisma.epic.createMany({
        data: templates.map((t, i) => ({
          id: createId(),
          projectId,
          title: t.title,
          description: t.description,
          displayId: `EPIC-${String(i + 1).padStart(3, "0")}`,
          status: "DRAFT",
        })),
      });
    });
  }
);
```

Phase 9 OWNS the `PROJECT_CREATED` payload extension. If `src/actions/projects.ts` (or whichever upstream emits the event) does not include `engagementType`, `createdBy`, and `createdAt`, extend the emitter as part of this task. No "verify upstream" language applies; Task 6 treats the extension as in-scope.

**Gaps covered:** GAP-LIFECYCLE-003, PHASE-9-GAP-05 (PRD-7-02)

---

### Task 7: AI test case generation

| Attribute | Details |
|-----------|---------|
| **Scope** | Create TEST_CASE_GENERATION agent harness task definition. Create Inngest function triggered on STORY_STATUS_CHANGED (to READY) and manual action. Generate structured test cases with AI and save as TestCase records with source AI_GENERATED. |
| **Depends On** | None (parallel with Task 8) |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Agent task `TEST_CASE_GENERATION` exists with system prompt, context loader, output validator
- [ ] System prompt instructs Claude to generate test cases from acceptance criteria covering HAPPY_PATH, EDGE_CASE, NEGATIVE, and BULK types
- [ ] Context loader pulls acceptance criteria from the `Story` record populated by the Story Generation Pipeline Stage 7 (Addendum §5.2.3); it does NOT bypass the pipeline or read pre-pipeline inputs
- [ ] Context loader assembles: story title, description, acceptance criteria (pipeline-populated), related business processes, existing manual test cases
- [ ] Output is validated against the pinned schema (see PHASE_SPEC §2.7):
      `title: string (5-200), steps: { step: string; data?: string }[] (min 1), expectedResult: string (5-500), testType: HAPPY_PATH|EDGE_CASE|NEGATIVE|BULK`
- [ ] Output parser rejects any row missing any of the four required fields; rejected rows are never written
- [ ] Inngest function triggers on `STORY_STATUS_CHANGED` when newStatus is `READY`
- [ ] Manual "Generate Test Cases" button available on story detail page
- [ ] Generated TestCase records have `source: "AI_GENERATED"` (not MANUAL)
- [ ] Regeneration deletes ONLY `source = AI_GENERATED` rows; `STUB` and `MANUAL` rows are never touched (PRD-10-08, ADD §5.2.3)
- [ ] Regeneration test verifies STUB rows present before regeneration are still present after regeneration
- [ ] Regeneration is blocked when the story is in a terminal status (QA, DONE); both the event consumer and the manual trigger enforce this with error "Cannot regenerate test cases for story in terminal status"
- [ ] Story with empty acceptance criteria still generates at least 1 HAPPY_PATH case from title/description

**Implementation Notes:**
Create `src/lib/agent-harness/tasks/test-case-generation.ts`:
```ts
export const TEST_CASE_GENERATION: AgentTaskDefinition = {
  id: "TEST_CASE_GENERATION",
  systemPrompt: `You are a QA engineer generating test cases for a Salesforce project.
Given a user story with acceptance criteria, generate comprehensive test cases covering:
- HAPPY_PATH: Standard successful scenarios
- EDGE_CASE: Boundary conditions and unusual inputs
- NEGATIVE: Error conditions and invalid inputs
- BULK: Volume and performance scenarios (when applicable)

Each test case must have a clear title, step-by-step instructions, and expected result.`,
  contextLoader: "testCaseGenerationContext",
  outputSchema: testCaseOutputSchema,
  executionMode: "single-shot",
};
```

Create `src/lib/inngest/functions/test-case-generation.ts`:
```ts
export const testCaseGenerationFunction = inngest.createFunction(
  { id: "test-case-generation" },
  { event: "STORY_STATUS_CHANGED" },
  async ({ event, step }) => {
    if (event.data.newStatus !== "READY") return;
    // Load story, run agent task, save test cases
    await step.run("delete-old-ai-cases", async () => {
      await prisma.testCase.deleteMany({
        where: { storyId: event.data.storyId, source: "AI_GENERATED" },
      });
    });
    const cases = await step.run("generate-cases", async () => {
      return executeAgentTask("TEST_CASE_GENERATION", { storyId: event.data.storyId });
    });
    await step.run("save-cases", async () => {
      await prisma.testCase.createMany({
        data: cases.map(c => ({
          id: createId(),
          storyId: event.data.storyId,
          title: c.title,
          steps: c.steps,
          expectedResult: c.expectedResult,
          testType: c.testType,
          source: "AI_GENERATED",
        })),
      });
    });
  }
);
```

Add a "Generate Test Cases" button to the story detail page that calls a server action triggering the same Inngest function manually. The action first calls `assertProjectWritable` and then rejects stories in terminal status (QA, DONE).

Define `testCaseOutputSchema` as a Zod schema in `src/lib/agent-harness/tasks/test-case-generation.ts`, matching the pinned shape in PHASE_SPEC §2.7. Define `testCaseGenerationContext` as the context loader.

**Gaps covered:** GAP-QA-001, PHASE-9-GAP-09, PHASE-9-GAP-13 (PRD-10-08, ADD §5.2.3)

---

### Task 8: Test execution UI on story detail page

| Attribute | Details |
|-----------|---------|
| **Scope** | Build test execution panel for story detail page. Show test case list with Pass/Fail/Blocked controls. Wire fail → defect creation flow. Add manual test case creation. |
| **Depends On** | None (parallel with Task 7) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Story detail page shows "Test Cases" section with all test cases for the story
- [ ] Each test case row shows: title, type badge, source badge (AI/MANUAL), latest result, action buttons
- [ ] QA/SA can click Pass/Fail/Blocked to record a test execution
- [ ] Clicking Fail opens DefectCreateSheet with testCaseId and storyId pre-filled
- [ ] "Not Run" status shown for test cases with no executions
- [ ] "Add Test Case" button opens inline form for manual test case creation
- [ ] Historical executions viewable via row expand/detail
- [ ] Only QA and SA roles see execution action buttons (all roles can view)

**Implementation Notes:**
Create `src/components/stories/test-execution-panel.tsx`:
- Accept `storyId` and `projectId` props
- Fetch test cases via `getStoryTestCases` action
- Render as a table with columns: Title, Type, Source, Result, Actions
- The Result column shows the latest TestExecution result for each test case (query: `testExecution.findFirst({ where: { testCaseId }, orderBy: { executedAt: "desc" } })`)
- Action buttons call `recordTestExecution` with the appropriate result

In `story-detail-client.tsx`:
- Import and render `<TestExecutionPanel storyId={story.id} projectId={projectId} />`
- Place below the existing story detail sections

For the fail → defect flow:
```tsx
const handleFail = async (testCaseId: string) => {
  await recordTestExecution({ testCaseId, result: "FAIL" });
  setDefectPrefill({ testCaseId, storyId });
  setDefectSheetOpen(true);
};
```

**Gaps covered:** GAP-QA-003

---

### Task 9: Test coverage metrics + QA event consumers

| Attribute | Details |
|-----------|---------|
| **Scope** | Compute per-story, per-sprint, and project-level test coverage metrics using the PRD formula. Register Inngest consumers for QA events to trigger dashboard refresh. |
| **Depends On** | Task 8 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Per-story coverage: total/passed/failed/blocked/not-run counts shown on story card or row
- [ ] Per-sprint coverage: aggregate test metrics section on sprint detail page
- [ ] Project-level metric: "stories with all tests passed / stories in QA or Done" (PRD formula)
- [ ] PM dashboard QA summary uses the correct PRD metric (not flat execution counts)
- [ ] `TEST_EXECUTION_RECORDED` Inngest consumer triggers `PM_DASHBOARD_SYNTHESIS`
- [ ] `DEFECT_CREATED` Inngest consumer triggers `PM_DASHBOARD_SYNTHESIS`
- [ ] `DEFECT_STATUS_CHANGED` Inngest consumer triggers `PM_DASHBOARD_SYNTHESIS`
- [ ] Stories with 0 test cases are excluded from coverage metric
- [ ] Sprint aggregate correctly handles stories with mixed results

**Implementation Notes:**
Fix `src/lib/inngest/functions/pm-dashboard-synthesis.ts`:
Replace the flat QA aggregate (lines ~287-324) with per-story completeness logic:
```ts
// For each story in QA or DONE status:
//   Get all test cases
//   For each test case, get latest execution
//   Story passes if ALL test cases have latest result = PASS
// Metric = passing stories / total stories with test cases
const storiesInQaOrDone = await prisma.story.findMany({
  where: { projectId, status: { in: ["QA", "DONE"] } },
  include: {
    testCases: {
      include: {
        testExecutions: { orderBy: { executedAt: "desc" }, take: 1 },
      },
    },
  },
});
const storiesWithTests = storiesInQaOrDone.filter(s => s.testCases.length > 0);
const passingStories = storiesWithTests.filter(s =>
  s.testCases.every(tc => tc.testExecutions[0]?.result === "PASS")
);
const coverageMetric = storiesWithTests.length > 0
  ? passingStories.length / storiesWithTests.length
  : 0;
```

Create `src/lib/inngest/functions/qa-event-handlers.ts`:
```ts
export const qaEventDashboardRefresh = inngest.createFunction(
  { id: "qa-event-dashboard-refresh" },
  [
    { event: "TEST_EXECUTION_RECORDED" },
    { event: "DEFECT_CREATED" },
    { event: "DEFECT_STATUS_CHANGED" },
  ],
  async ({ event, step }) => {
    await inngest.send({
      name: "PM_DASHBOARD_SYNTHESIS",
      data: { projectId: event.data.projectId },
    });
  }
);
```

For the sprint aggregate, add a query function that rolls up per-story metrics for stories in a given sprint and render in the sprint detail component.

**Gaps covered:** GAP-QA-004, GAP-QA-007, GAP-QA-008

---

### Task 10: Final project summary document on archive

| Attribute | Details |
|-----------|---------|
| **Scope** | Create PROJECT_SUMMARY document template. Create Inngest function consuming PROJECT_ARCHIVED that generates the summary. Context loader pulls from all project data. |
| **Depends On** | Task 3 (archive must be complete for clean state) |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `PROJECT_SUMMARY` template registered in `templates/index.ts`
- [ ] Template sections: Executive Summary, Engagement Timeline, Deliverables Catalog, Architecture Decisions, Knowledge Base State, Org Knowledge Summary, Key Metrics, Team Roster
- [ ] `PROJECT_ARCHIVED` event triggers summary document generation
- [ ] Context loader pulls: epics, story counts/statuses, decisions, risks, knowledge articles, org components, generated documents, team members, milestones, sprint history
- [ ] Generated summary uses project branding (Phase 8 BrandingConfig)
- [ ] Generated summary uses document versioning (Phase 8 version model)
- [ ] Token budget truncation follows a pinned reverse-priority order. Sections are truncated in this order when context exceeds budget: 8 Team Roster (drop detail first), 7 Key Metrics (keep totals only), 5 Knowledge Base State, 6 Org Knowledge Summary, 2 Timeline (keep milestones only), 1 Executive Summary (keep), 3 Deliverables (keep), 4 Decisions (keep last)
- [ ] Decisions (§4) and Deliverables (§3) sections are never truncated below a full enumeration of titles + status; they are the last to lose detail and never lose their enumerations
- [ ] Archive is not rolled back if summary generation fails

**Implementation Notes:**
Create `src/lib/documents/templates/project-summary.ts` following the Phase 8 template pattern:
```ts
export const projectSummaryTemplate: DocumentTemplate = {
  documentType: "PROJECT_SUMMARY",
  name: "Project Summary",
  description: "Comprehensive engagement summary generated on project archive",
  sections: [
    { key: "executiveSummary", name: "Executive Summary", priority: 1 },
    { key: "timeline", name: "Engagement Timeline", priority: 2 },
    { key: "deliverables", name: "Deliverables Catalog", priority: 3 },
    { key: "decisions", name: "Architecture Decisions", priority: 4 },
    { key: "knowledgeBase", name: "Knowledge Base State", priority: 5 },
    { key: "orgKnowledge", name: "Org Knowledge Summary", priority: 6 },
    { key: "metrics", name: "Key Metrics", priority: 7 },
    { key: "team", name: "Team Roster", priority: 8 },
  ],
  contextQueries: [
    "getProjectSummary", "getEpicContext", "getDecisions", "getRisks",
    "getKnowledgeArticles", "getOrgComponents", "getGeneratedDocuments",
    "getTeamMembers", "getMilestoneProgress", "getSprintHistory",
    "getStoryMetrics",
  ],
  systemPrompt: `Generate a comprehensive project summary document...`,
  outputSchema: projectSummarySchema,
};
```

Create `src/lib/inngest/functions/archive-summary-generation.ts`:
```ts
export const archiveSummaryFunction = inngest.createFunction(
  { id: "archive-summary-generation" },
  { event: "PROJECT_ARCHIVED" },
  async ({ event, step }) => {
    const { projectId } = event.data;
    await step.run("generate-summary", async () => {
      // Trigger document generation using PROJECT_SUMMARY template
      await inngest.send({
        name: "DOCUMENT_GENERATION_REQUESTED",
        data: { projectId, documentType: "PROJECT_SUMMARY" },
      });
    });
  }
);
```

Register both in `src/app/api/inngest/route.ts`.

The `PROJECT_SUMMARY` template is whitelisted by the document dispatcher on archived projects (since `assertProjectWritable` blocks other document generation post-archive).

**Gaps covered:** GAP-ARCH-003, PHASE-9-GAP-12 (PRD-21-02)

---

### Task 11: Phase emphasis + engagement-type AI context

| Attribute | Details |
|-----------|---------|
| **Scope** | Add phase-specific guidance to AI system prompt. Add engagement-type behavioral guidance. Add phase badge to project header UI. |
| **Depends On** | Task 5 (phase advancement must exist) |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] AI system prompt includes phase-specific guidance that varies by currentPhase
- [ ] Each of the 7 non-archive phases has 2-3 sentences of emphasis guidance
- [ ] AI system prompt includes engagement-type behavioral guidance (not just the label)
- [ ] Each of the 4 engagement types has specific AI behavioral instructions
- [ ] Phase badge visible in project header on all project pages
- [ ] Phase badge shows current phase name
- [ ] Phase badge links to phase advancement control (from Task 5)

**Implementation Notes:**
In `src/lib/chat-tools/system-prompt.ts`, add two new sections:

```ts
const PHASE_GUIDANCE: Record<ProjectPhase, string> = {
  DISCOVERY: "This project is in the Discovery phase. Focus on gathering information, asking probing questions, building understanding of the client's business processes, and identifying gaps.",
  REQUIREMENTS: "This project is in the Requirements phase. Focus on translating discovery findings into clear user stories with acceptance criteria, validating completeness, and identifying missing requirements.",
  SOLUTION_DESIGN: "This project is in the Solution Design phase. Focus on architecture decisions, Salesforce solution patterns, technical feasibility, and linking decisions to requirements.",
  BUILD: "This project is in the Build phase. Focus on sprint execution, developer context packages, code quality, and implementation guidance aligned with the solution design.",
  TESTING: "This project is in the Testing phase. Focus on test coverage, defect resolution, QA metrics, and ensuring acceptance criteria are validated.",
  DEPLOYMENT: "This project is in the Deployment phase. Focus on deployment runbooks, pre-deployment checklists, rollback procedures, and post-deployment verification.",
  HYPERCARE: "This project is in the Hypercare phase. Focus on knowledge transfer, training materials, support handoff documentation, and capturing lessons learned.",
  ARCHIVE: "This project is archived. It is read-only.",
};

const ENGAGEMENT_GUIDANCE: Record<EngagementType, string> = {
  GREENFIELD: "This is a greenfield implementation. The client has no existing Salesforce footprint. Discovery should be thorough and cover all business processes from scratch. Focus on building a complete solution design before development.",
  BUILD_PHASE: "This is a build-phase engagement. The client has already completed discovery and has documented requirements. Focus on validating imported requirements, filling gaps, and moving efficiently into solution design and development.",
  MANAGED_SERVICES: "This is a managed services engagement. The client has an existing Salesforce org with ongoing support needs. Focus on enhancement requests, SLA tracking, maintenance efficiency, and incremental improvements rather than full-lifecycle delivery.",
  RESCUE_TAKEOVER: "This is a rescue/takeover project. The client is inheriting a troubled Salesforce implementation. Prioritize org health assessment, identify existing technical debt, understand what was built vs. what was intended, and focus on stabilization before new feature work.",
};
```

Add to the system prompt assembly function:
```ts
const phaseBlock = `\n## Current Project Phase\n${PHASE_GUIDANCE[project.currentPhase]}\n`;
const engagementBlock = `\n## Engagement Context\n${ENGAGEMENT_GUIDANCE[project.engagementType]}\n`;
```

For the phase badge, create `src/components/projects/phase-badge.tsx` — a simple badge component that shows the phase name with a link to the settings page phase control. Render it in the project layout header.

**Gaps covered:** GAP-LIFECYCLE-002, GAP-LIFECYCLE-004

---

## Summary

| Task | Title | Depends On | Complexity | Status |
|------|-------|-----------|------------|--------|
| 1 | QA RBAC fixes | — | S | Not Started |
| 2 | Defect edit sheet + attachments | — | M | Not Started |
| 3 | Archive completion | — | M | Not Started |
| 4 | Jira configurable sync | — | M | Not Started |
| 5 | Phase advancement | — | M | Not Started |
| 6 | Default epic templates | — | M | Not Started |
| 7 | AI test case generation | — | L | Not Started |
| 8 | Test execution UI | — | M | Not Started |
| 9 | Test coverage metrics + QA events | 8 | M | Not Started |
| 10 | Final project summary document | 3 | L | Not Started |
| 11 | Phase emphasis + engagement AI | 5 | L | Not Started |
