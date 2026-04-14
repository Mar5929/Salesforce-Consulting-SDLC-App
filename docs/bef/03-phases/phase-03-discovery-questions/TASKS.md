# Phase 3 Tasks: Discovery, Questions

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 14
> Status: 0/14 complete
> Last Updated: 2026-04-14

---

## Execution Order

```
Task 1 (schema migration) ────────────────────────────────────────┐
  ├── Task 2 (display ID scheme) ────── parallel ─────────────────┤
  ├── Task 3 (ESCALATED cleanup) ────── parallel ─────────────────┤
  ├── Task 4 (source field + clarity + scope-required) ── parallel ┤
  ├── Task 5 (client/TBD owner) ─────── parallel ─────────────────┤
  ├── Task 6 (detail page rendering) ── parallel ─────────────────┤
  ├── Task 7 (pagination) ──────────── parallel ──────────────────┤
  └── Task 14 (Answer Logging Pipeline wiring + embeddings) ──────┤
       └── Task 8 (status advancement listener) ──────────────────┤
            ├── Task 9 (QuestionAffects) ────── parallel with 8 ──┤
            ├── Task 10 (gap detection) ─────── depends on 8 ─────┤
            ├── Task 11 (readiness assessment) ─ depends on 8 ────┤
            └── Task 12 (blocking priority + reasoning) ─ parallel ┤
                 └── Task 13 (dashboard completion) ──────────────┘
```

---

## Tasks

### Task 1: Schema migration — enum fixes, source field, cached analysis fields

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace `REVIEWED` with `IMPACT_ASSESSED` in `QuestionStatus` enum, create `QuestionSource` enum, add `source` field to Question, add cached analysis fields to Project. Single Prisma migration. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `QuestionStatus` enum contains: `OPEN`, `SCOPED`, `OWNED`, `ANSWERED`, `IMPACT_ASSESSED`, `PARKED`
- [ ] Lifecycle enum order matches PRD-9-01 semantically: `OPEN` (= `RAISED`) → `SCOPED` → `OWNED` → `ANSWERED` → `IMPACT_ASSESSED`, plus terminal `PARKED`. PHASE_SPEC §2.1 documents the `OPEN` ↔ `RAISED` reconciliation.
- [ ] `REVIEWED` is no longer in the enum. Existing `REVIEWED` records are migrated to `ANSWERED`.
- [ ] `QuestionSource` enum exists with `MANUAL`, `TRANSCRIPT`, `CHAT`
- [ ] `Question.source` field exists with default `MANUAL`
- [ ] `Question.embeddingContentHash String?` field exists (gates re-embed in Task 14, per PRD-8-07 / ADD-5.2.2-05)
- [ ] `Project` model has `cachedGapAnalysis Json?`, `cachedGapAnalysisAt DateTime?`, `cachedReadinessAssessment Json?`, `cachedReadinessAssessmentAt DateTime?`
- [ ] Two partial unique indexes exist on `QuestionAffects`: `question_affects_epic_only` (questionId, epicId) WHERE featureId IS NULL, and `question_affects_feature_only` (questionId, featureId) WHERE epicId IS NULL — see PHASE_SPEC §3.3 (PRD-5-32)
- [ ] Migration runs cleanly on existing data

**Implementation Notes:**
1. In `prisma/schema.prisma`:
   - Change `REVIEWED` to `IMPACT_ASSESSED` in `enum QuestionStatus`
   - Add `enum QuestionSource { MANUAL TRANSCRIPT CHAT }`
   - Add `source QuestionSource @default(MANUAL)` to `Question` model
   - Add 4 cached fields to `Project` model
2. Migration SQL must include: `UPDATE "Question" SET status = 'ANSWERED' WHERE status = 'REVIEWED'` before the enum rename
3. Migration SQL also creates the two partial unique indexes on `QuestionAffects` (see PHASE_SPEC §3.3 SQL block)
4. Update the transition table in `src/actions/questions.ts` — replace any `REVIEWED` references with `IMPACT_ASSESSED`
5. Update any TypeScript code that references `"REVIEWED"` as a string literal

---

### Task 2: Fix question display ID scheme

| Attribute | Details |
|-----------|---------|
| **Scope** | Rework `generateDisplayId` in `src/lib/display-id.ts` for questions to produce `Q-{SCOPE}-{NNN}` format. Write a data migration for existing IDs. |
| **Depends On** | Task 1 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] ENGAGEMENT-scope questions get IDs like `Q-ENG-001`
- [ ] EPIC-scope questions get IDs like `Q-DM-001` (using epic's prefix)
- [ ] FEATURE-scope questions get IDs like `Q-DM-LRT-001` (using epic prefix + feature prefix)
- [ ] Numbers are zero-padded to 3 digits
- [ ] Sequential numbering is scoped per prefix (e.g., `Q-ENG-*` increments independently from `Q-DM-*`)
- [ ] Existing display IDs are migrated to new format
- [ ] `generateDisplayId` still handles retry on unique constraint violation

**Implementation Notes:**
Rework `generateDisplayId` for the Question entity type:
```ts
export async function generateQuestionDisplayId(
  projectId: string,
  scope: "ENGAGEMENT" | "EPIC" | "FEATURE",
  scopeEpicId?: string,
  scopeFeatureId?: string,
  prismaClient: PrismaClient
): Promise<string> {
  // Build prefix based on scope
  let prefix: string;
  if (scope === "ENGAGEMENT") {
    prefix = "Q-ENG";
  } else if (scope === "EPIC" && scopeEpicId) {
    const epic = await prismaClient.epic.findUnique({ where: { id: scopeEpicId }, select: { prefix: true } });
    prefix = `Q-${epic!.prefix}`;
  } else if (scope === "FEATURE" && scopeFeatureId) {
    const feature = await prismaClient.feature.findUnique({
      where: { id: scopeFeatureId },
      select: { prefix: true, epic: { select: { prefix: true } } }
    });
    prefix = `Q-${feature!.epic.prefix}-${feature!.prefix}`;
  }

  // Query max number with this prefix, zero-pad
  const maxNum = await getMaxQuestionNumber(prismaClient, projectId, prefix);
  return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
}
```

Data migration: SQL script that reads each question's scope, epicId, featureId, looks up epic/feature prefix, and rewrites `displayId`. Handle orphaned scope references with `Q-UNK-{NNN}` fallback.

Update callers: `src/actions/questions.ts` (createQuestion), `src/lib/agent-harness/tools/create-question.ts`.

---

### Task 3: Clean up ESCALATED references in agent code

| Attribute | Details |
|-----------|---------|
| **Scope** | Remove phantom `ESCALATED` status from agent task code. Two files, two changes. |
| **Depends On** | Task 1 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `question-answering.ts` `update_question_status` tool enum no longer includes `ESCALATED`
- [ ] `dashboard-synthesis.ts` no longer filters for `status === "ESCALATED"` or computes `escalatedCount`
- [ ] No other files reference `ESCALATED` as a question status
- [ ] Grep confirms zero matches for `ESCALATED` in `src/`

**Implementation Notes:**
File 1: `src/lib/agent-harness/tasks/question-answering.ts` line 189 — remove `"ESCALATED"` from the enum array. Keep `["ANSWERED", "PARKED"]`.
File 2: `src/lib/agent-harness/tasks/dashboard-synthesis.ts` line 39 — remove the `escalatedCount` variable and its filter. Remove any reference to it in the prompt template below.

---

### Task 4: Wire source field in question creation paths

| Attribute | Details |
|-----------|---------|
| **Scope** | Set the `source` field when creating questions through the three input channels: manual UI, transcript processing, and chat. |
| **Depends On** | Task 1 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Questions created via the UI form have `source: "MANUAL"`
- [ ] Questions created during transcript processing have `source: "TRANSCRIPT"`
- [ ] Questions created during chat sessions have `source: "CHAT"`
- [ ] The `create_question` tool determines source from session metadata (`taskType`)
- [ ] **Clarity validation (PRD-9-10):** `createQuestion` server action validates `questionText.length >= 15` and rejects text matching `^(yes|no|tbd|\?+)$` (case-insensitive). Returns 400 on violation.
- [ ] **Needs-review trigger (PRD-9-10):** `create_question` tool (TRANSCRIPT/CHAT path) sets `needsReview = true` when extracted `questionText` is `< 25` chars OR lacks a terminal `?` punctuation.
- [ ] **Scope-required (PRD-9-02):** `create_question` tool input schema requires `scope: 'ENGAGEMENT' | 'EPIC' | 'FEATURE'`. When `scope === 'EPIC'`, requires `scopeEpicId`. When `scope === 'FEATURE'`, requires both `scopeEpicId` and `scopeFeatureId`. Tool handler rejects with validation error on missing required fields.
- [ ] Server-side check: `scope === 'FEATURE' && !scopeFeatureId` returns an error before insert.

**Implementation Notes:**
1. `src/actions/questions.ts` (createQuestion action): Add `source: "MANUAL"` to the `prisma.question.create` data block.
2. `src/lib/agent-harness/tools/create-question.ts`: Determine source from execution context. The tool receives session metadata. If `metadata.taskType === "TRANSCRIPT_PROCESSING"`, use `"TRANSCRIPT"`. If conversationType is chat-related, use `"CHAT"`. Default fallback: `"MANUAL"`.
3. Verify the tool's execute function has access to session metadata (it should, via the engine's execution context).

---

### Task 5: Enable client/TBD owner assignment

| Attribute | Details |
|-----------|---------|
| **Scope** | Activate the `ownerDescription` field for questions. Modify the question form to support "Client ({name})" and "TBD" owners. Update server actions and display components. |
| **Depends On** | Task 1 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Question form has an owner type selector: "Team Member", "Client", "TBD"
- [ ] Selecting "Client" shows a text input for the contact name; saves as `ownerDescription: "Client (Sarah)"`
- [ ] Selecting "TBD" saves as `ownerDescription: "TBD"`, `ownerId: null`
- [ ] Selecting "Team Member" uses existing dropdown; `ownerDescription` is null
- [ ] Question detail and list views display `ownerDescription` when `ownerId` is null
- [ ] `createQuestion` and `updateQuestion` accept `ownerDescription` parameter
- [ ] Validation: cannot set both `ownerId` and `ownerDescription`

**Implementation Notes:**
1. `src/actions/questions.ts`: Add `ownerDescription` to createQuestion and updateQuestion input schemas. Add validation: if `ownerId` is provided, `ownerDescription` must be null and vice versa. Clear the other field when one is set.
2. `src/components/questions/question-form.tsx`: Add a radio group or select above the owner dropdown: "Team Member" | "Client" | "TBD". Conditionally render the team member dropdown or a client name text input.
3. `src/components/questions/question-detail.tsx`: In the owner display section, show `ownerDescription` when `ownerId` is null.
4. Question list component: Same owner display logic.

---

### Task 6: Render parkedReason + QuestionAffects on detail page

| Attribute | Details |
|-----------|---------|
| **Scope** | Add two missing UI sections to the question detail page: parked reason and cross-cutting affects. |
| **Depends On** | Task 1 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] When a question has status `PARKED`, a "Parked Reason" section displays the `parkedReason` text
- [ ] When a question has `questionAffects` records, an "Affects" section lists the linked epics/features with links
- [ ] The `[questionId]/page.tsx` query includes `questionAffects: { include: { epic: true, feature: true } }`
- [ ] If no affects records exist for an engagement-scope question, show "No cross-cutting relationships identified"
- [ ] Affects section is not shown for non-engagement-scope questions with 0 affects

**Implementation Notes:**
1. `src/app/(dashboard)/projects/[projectId]/questions/[questionId]/page.tsx`: Add `questionAffects: { include: { epic: { select: { id: true, name: true, prefix: true } }, feature: { select: { id: true, name: true, prefix: true } } } }` to the Prisma include.
2. `src/components/questions/question-detail.tsx`:
   - Add `QuestionDetailData` interface fields for `parkedReason` and `questionAffects`
   - Render parked reason: `{status === "PARKED" && parkedReason && <Section title="Parked Reason">...`
   - Render affects: Badge list of epic/feature names, each linking to the epic/feature page

---

### Task 7: Wire pagination to questions list page

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace the direct `db.question.findMany` in the questions list page with the existing paginated `getQuestions` server action. |
| **Depends On** | Task 1 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Questions list page uses `getQuestions` server action with pagination
- [ ] Default page size is 25
- [ ] Page number is tracked in URL search params via `nuqs`
- [ ] Pagination controls (Previous/Next) render below the list
- [ ] Total count is displayed: "Showing 1-25 of 142 questions"
- [ ] Existing filtering/sorting is preserved

**Implementation Notes:**
1. `src/app/(dashboard)/projects/[projectId]/questions/page.tsx`:
   - Remove direct `prisma.question.findMany` call
   - Import and call `getQuestions` with `page` and `pageSize` from URL search params
   - Use `nuqs` `useQueryState` for page number persistence
   - Add pagination controls (can use shadcn/ui Pagination component)
2. The `getQuestions` action (lines 315-354 of `src/actions/questions.ts`) already returns `{ questions, totalCount, page, pageSize }`. Wire this directly.

---

### Task 8: Status advancement listener for QUESTION_IMPACT_COMPLETED

| Attribute | Details |
|-----------|---------|
| **Scope** | Resolve Wave 0 contradiction A (cites AUDIT_DECISIONS DECISION-11 and Addendum v1 §2). Phase 3 no longer owns impact assessment. Delete `questionImpactFunction`, `questionImpactAssessmentFunction`, and the `question-impact.ts` agent task. Create a thin `question-impact-completed-listener` Inngest function that subscribes to `QUESTION_IMPACT_COMPLETED` (emitted by Phase 2 Answer Logging Pipeline) and advances `Question.status` to `IMPACT_ASSESSED`, persisting the pipeline's `summary` to `Question.impactAssessment`. |
| **Depends On** | Task 1, Task 14 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `src/lib/inngest/functions/question-impact.ts` is DELETED
- [ ] `src/lib/inngest/functions/question-impact-assessment.ts` is DELETED
- [ ] `src/lib/agent-harness/tasks/question-impact.ts` is DELETED
- [ ] Inngest client no longer registers either deprecated function
- [ ] New file `src/lib/inngest/functions/question-impact-completed-listener.ts` exists and registers a function subscribing to `QUESTION_IMPACT_COMPLETED`
- [ ] On `QUESTION_IMPACT_COMPLETED`: listener loads question, sets `status = "IMPACT_ASSESSED"`, sets `impactAssessment = payload.summary`, commits in a single Prisma update
- [ ] Listener is idempotent: re-receiving the same event for a question already in `IMPACT_ASSESSED` is a no-op (no error, no duplicate writes)
- [ ] Listener does NOT re-execute downstream writes (designChanges, unblockedItems, newQuestions, contradictions); these are owned by the Phase 2 pipeline
- [ ] PRD-8-04, PRD-8-05, PRD-8-06, PRD-9-04, PRD-9-05, PRD-9-06 trace to ADD-5.2.2-04 (Phase 2 Answer Logging Pipeline Stage 4)

**Implementation Notes:**

This task replaces the legacy Phase-3-owned impact assessment with a thin listener. The pipeline-first architecture (Addendum v1 §2) requires that Stage 4 logic (unblocks, contradictions, new-question creation, design-change flags) live exclusively in the Phase 2 Answer Logging Pipeline.

```ts
// src/lib/inngest/functions/question-impact-completed-listener.ts
export const questionImpactCompletedListener = inngest.createFunction(
  { id: "question-impact-completed-listener", retries: 1 },
  { event: EVENTS.QUESTION_IMPACT_COMPLETED },
  async ({ event, step }) => {
    const { projectId, questionId, summary } = event.data;
    await step.run("advance-status", async () => {
      const q = await prisma.question.findUnique({ where: { id: questionId }, select: { status: true } });
      if (!q) return { skipped: "not_found" };
      if (q.status === "IMPACT_ASSESSED") return { skipped: "already_assessed" };
      await prisma.question.update({
        where: { id: questionId },
        data: { status: "IMPACT_ASSESSED", impactAssessment: summary },
      });
      return { advanced: true };
    });
  }
);
```

**Cross-phase coordination (Phase 2 must):**
- Confirm `ANSWER_LOGGING_REQUESTED` event contract per Task 14.
- Emit `QUESTION_IMPACT_COMPLETED` with `{ projectId, questionId, summary, designChanges[], unblockedItems[], newQuestions[], contradictions[] }`.
- Implement the structured-output validator inside the pipeline (Sonnet stage), not in Phase 3.
- Persist the four downstream writes (follow-up questions, unblock records, contradictions, design changes) inside the pipeline. Phase 3's listener does NOT replicate them.

**Removal checklist:**
- [ ] Delete `src/lib/inngest/functions/question-impact.ts`
- [ ] Delete `src/lib/inngest/functions/question-impact-assessment.ts`
- [ ] Delete `src/lib/agent-harness/tasks/question-impact.ts`
- [ ] Remove imports/registrations from the Inngest client and from any task registry
- [ ] Remove `EVENTS.QUESTION_IMPACT_REQUESTED` if no longer referenced (or downgrade to internal-only)

---

### Task 9: Populate QuestionAffects via AI + manual UI

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `tag_question_affects` tool, add it to transcript processing and impact assessment tasks, add manual affects editing to question form. |
| **Depends On** | Task 1 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `tag_question_affects` tool exists and writes `QuestionAffects` records
- [ ] Tool is available during transcript processing and impact assessment
- [ ] AI system prompts instruct: "When a question relates to multiple epics, use tag_question_affects"
- [ ] Question detail form has a multi-select for affected epics/features
- [ ] `updateQuestionAffects` server action accepts an array of `{epicId?, featureId?}` and syncs
- [ ] Duplicate records are handled via query-then-create (no errors). Upsert never produces duplicate `(questionId, epicId)` or `(questionId, featureId)` rows under either partial unique index (PRD-5-32; see PHASE_SPEC §3.3).
- [ ] **Advisory lock (PRD-19-13 / GAP-14):** `updateQuestionAffects` server action acquires `pg_advisory_xact_lock(hashtext('question_affects_' || questionId))` before delete/create. The `tag_question_affects` AI tool acquires the same lock so a manual full-replace cannot wipe AI records mid-Inngest-run; the second waiter merges rather than replaces.

**Implementation Notes:**
1. Create `src/lib/agent-harness/tools/tag-question-affects.ts`:
```ts
{
  name: "tag_question_affects",
  description: "Record which epics/features a cross-cutting question affects",
  input_schema: {
    type: "object",
    properties: {
      questionId: { type: "string" },
      affects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            epicId: { type: "string" },
            featureId: { type: "string" }
          }
        }
      }
    },
    required: ["questionId", "affects"]
  },
  execute: async (input) => {
    return prisma.$transaction(async (tx) => {
      // Acquire advisory lock keyed on questionId to serialize against manual updateQuestionAffects
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext($1))`,
        `question_affects_${input.questionId}`,
      );
      for (const a of input.affects) {
        // Query-then-create pattern (Prisma upsert cannot target the partial unique indexes)
        const existing = await tx.questionAffects.findFirst({
          where: { questionId: input.questionId, epicId: a.epicId ?? null, featureId: a.featureId ?? null },
        });
        if (!existing) {
          await tx.questionAffects.create({
            data: { questionId: input.questionId, epicId: a.epicId ?? null, featureId: a.featureId ?? null },
          });
        }
      }
      return { success: true, count: input.affects.length };
    });
  }
}
```
2. Add tool to `transcript-processing.ts` task definition's tools array. NOTE: `question-impact.ts` is removed in Task 8 (pipeline-first); register the tool on the Phase 2 Answer Logging Pipeline task instead (cross-phase coordination).
3. Add prompt instruction: "If you identify a question that relates to multiple epics, use the tag_question_affects tool to record the cross-cutting relationship."
4. Create `updateQuestionAffects` server action in `src/actions/questions.ts`: delete existing records, create new ones (full replace strategy).
5. Add multi-select in question form showing project epics/features.

---

### Task 10: Implement gap detection analysis

| Attribute | Details |
|-----------|---------|
| **Scope** | Create new `GAP_DETECTION` agent task and Inngest function. Triggered on demand from dashboard. Stores structured results in `project.cachedGapAnalysis`. |
| **Depends On** | Task 8 |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `GAP_DETECTION` task type exists in agent harness
- [ ] Context loader provides: all questions grouped by epic (with status counts), all decisions, project summary
- [ ] AI produces structured output: per-epic analysis with coverage %, identified gaps, blocking questions, severity
- [ ] Quantitative coverage (answered/total per epic) is computed in the context loader (not by AI)
- [ ] AI adds qualitative analysis: whether answered questions cover key design areas
- [ ] Results stored in `project.cachedGapAnalysis` and `project.cachedGapAnalysisAt`
- [ ] Rate limited: cached result returned when `now - cachedGapAnalysisAt < 3600000ms`; otherwise AI invoked.
- [ ] Inngest function triggered by `GAP_ANALYSIS_REQUESTED` event
- [ ] Epics with 0 questions flagged as "potential blind spot"
- [ ] **Auto-trigger threshold (PRD-8-16):** Phase 2 pipeline session-close emits `answered_questions_delta`. When `answered_questions_delta >= 5` for a session, the pipeline (or downstream listener) fires `GAP_ANALYSIS_REQUESTED` automatically.
- [ ] **Severity bands (PRD-8-16):** computed as `<25% answered → CRITICAL`, `25–49% → HIGH`, `50–74% → MEDIUM`, `≥75% → LOW`. Encoded in the agent task validator and in stored output.
- [ ] **Edge cases:** project with 0 epics returns `epics: []` with `recommendation: "Define epics before running gap analysis."` AI call failure beyond `maxRetries=2` returns 502; cache is NOT updated.

**Implementation Notes:**

Create `src/lib/agent-harness/tasks/gap-detection.ts`:
```ts
export const gapDetectionTask: TaskDefinition = {
  taskType: "GAP_DETECTION",
  systemPromptTemplate: `You are analyzing the state of discovery for a Salesforce consulting project.
For each epic, evaluate whether the answered questions sufficiently cover the key design areas.
Consider: Are there obvious areas that haven't been explored? Are blocking questions being addressed?

You will receive quantitative data (question counts, coverage percentages) along with the actual
question texts. Your job is to add qualitative analysis: what specific knowledge gaps exist?

Output MUST be valid JSON matching this schema: { epics: [...], overallCoverage: number, recommendation: string }`,
  contextLoader: async (input, projectId) => {
    // Load all questions grouped by epic, with status
    // Load all epics (including those with 0 questions)
    // Compute per-epic counts: total, answered, open, parked
    // Load decisions for cross-reference
  },
  tools: [], // Analysis only, no write tools
  outputValidator: (result) => { /* validate JSON schema */ },
  executionMode: "SINGLE_TURN",
  maxRetries: 2,
};
```

Create `src/lib/inngest/functions/gap-detection.ts`:
```ts
export const gapDetectionFunction = inngest.createFunction(
  { id: "gap-detection", retries: 2, triggers: [{ event: EVENTS.GAP_ANALYSIS_REQUESTED }] },
  async ({ event, step }) => {
    const { projectId, userId } = event.data;

    // Check rate limit (1 hour)
    const project = await step.run("check-cache", async () => {
      return prisma.project.findUnique({ where: { id: projectId }, select: { cachedGapAnalysisAt: true } });
    });
    if (project?.cachedGapAnalysisAt && Date.now() - project.cachedGapAnalysisAt.getTime() < 3600000) {
      return { cached: true };
    }

    const result = await step.run("run-analysis", () => executeTask(gapDetectionTask, { ... }, projectId, userId));

    await step.run("persist-results", async () => {
      await prisma.project.update({
        where: { id: projectId },
        data: { cachedGapAnalysis: JSON.parse(result.output), cachedGapAnalysisAt: new Date() }
      });
    });
  }
);
```

Add `GAP_ANALYSIS_REQUESTED` to `src/lib/inngest/events.ts`.
Add a "Run Gap Analysis" button on the dashboard that sends this event.

---

### Task 11: Implement readiness assessment

| Attribute | Details |
|-----------|---------|
| **Scope** | Create new `READINESS_ASSESSMENT` agent task and Inngest function. Triggered on demand from dashboard or chained after gap detection. |
| **Depends On** | Task 8 |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `READINESS_ASSESSMENT` task type exists in agent harness
- [ ] Context loader provides: questions by epic (with answers), requirements, decisions, existing story counts per epic
- [ ] AI produces per-epic readiness evaluation: ready (yes/no), confidence (HIGH/MEDIUM/LOW), reasoning, supporting answers, remaining risks
- [ ] Results stored in `project.cachedReadinessAssessment` and `project.cachedReadinessAssessmentAt`
- [ ] Rate limited: returns cached if < 1 hour old
- [ ] Inngest function triggered by `READINESS_ASSESSMENT_REQUESTED` event
- [ ] **Chained trigger (PRD-8-17):** Upon `GAP_ANALYSIS_COMPLETED`, system fires `READINESS_ASSESSMENT_REQUESTED` automatically when `overallCoverage >= 50`.
- [ ] AI cross-references existing stories (don't recommend creation for epics that already have stories)
- [ ] Edge case: AI call failure beyond `maxRetries=2` returns 502; dashboard shows "Analysis failed, try again." Cache is NOT updated.

**Implementation Notes:**

Create `src/lib/agent-harness/tasks/readiness-assessment.ts`:
```ts
export const readinessAssessmentTask: TaskDefinition = {
  taskType: "READINESS_ASSESSMENT",
  systemPromptTemplate: `You are evaluating whether each epic in a Salesforce consulting project
has sufficient discovery information to begin writing user stories.

Consider for each epic:
- Are the key business requirements answered?
- Are there critical open questions that would change the story scope?
- Do the captured decisions provide enough design direction?
- Are there existing stories already (if so, assess refinement needs instead of creation readiness)?

Readiness levels:
- HIGH: Proceed with story generation confidently
- MEDIUM: Can start but expect revisions as more discovery emerges
- LOW: More discovery needed before meaningful stories can be written

Output MUST be valid JSON: { epics: [...], overallReadiness: string }`,
  contextLoader: async (input, projectId) => {
    // Load answered questions per epic (with answer text)
    // Load requirements (all statuses)
    // Load decisions per epic
    // Load story counts per epic (to detect already-started epics)
    // Load epic names and descriptions
  },
  tools: [],
  outputValidator: (result) => { /* validate JSON schema */ },
  executionMode: "SINGLE_TURN",
  maxRetries: 2,
};
```

Create `src/lib/inngest/functions/readiness-assessment.ts` — same pattern as gap detection with rate limiting and cache storage.

Add `READINESS_ASSESSMENT_REQUESTED` to events.

---

### Task 12: Build blocking-priority question ranking

| Attribute | Details |
|-----------|---------|
| **Scope** | Create a query function that aggregates blocking counts per question and returns a ranked priority list. Pure database query, no AI. |
| **Depends On** | Task 1 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `getBlockingPriorityQuestions(projectId)` returns questions ranked by total blocking count
- [ ] Only includes unanswered questions (OPEN, SCOPED, OWNED)
- [ ] Each result includes: questionId, displayId, questionText, totalBlocks, blocksStories, blocksEpics, blocksFeatures, owner (name or ownerDescription), ageDays
- [ ] **Reasoning field (PRD-8-21):** Each row includes `reasoning: string` built from the templated format: `"Blocks {totalBlocks} work item(s): {blocksStories} stories, {blocksEpics} epics, {blocksFeatures} features. Asked {ageDays} day(s) ago. Owner: {owner}."`
- [ ] Primary sort: totalBlocks descending. Secondary: ageDays descending.
- [ ] Returns empty array when no blocking relationships exist
- [ ] Function is efficient (single query with joins, not N+1)

**Implementation Notes:**
Create `src/lib/dashboard/queries/blocking-priority.ts`:
```ts
export async function getBlockingPriorityQuestions(projectId: string) {
  const questions = await prisma.question.findMany({
    where: {
      projectId,
      status: { in: ["OPEN", "SCOPED", "OWNED"] },
      OR: [
        { questionBlocksStories: { some: {} } },
        { questionBlocksEpics: { some: {} } },
        { questionBlocksFeatures: { some: {} } },
      ],
    },
    include: {
      _count: {
        select: {
          questionBlocksStories: true,
          questionBlocksEpics: true,
          questionBlocksFeatures: true,
        },
      },
      owner: { select: { user: { select: { name: true } } } },
    },
    orderBy: { askedDate: "asc" }, // We'll re-sort in JS by blocking count
  });

  return questions
    .map((q) => ({
      questionId: q.id,
      displayId: q.displayId,
      questionText: q.questionText,
      blocksStories: q._count.questionBlocksStories,
      blocksEpics: q._count.questionBlocksEpics,
      blocksFeatures: q._count.questionBlocksFeatures,
      totalBlocks: q._count.questionBlocksStories + q._count.questionBlocksEpics + q._count.questionBlocksFeatures,
      owner: q.owner?.user?.name ?? q.ownerDescription ?? "Unassigned",
      ageDays: Math.floor((Date.now() - q.askedDate.getTime()) / 86400000),
    }))
    .map((row) => ({
      ...row,
      reasoning: `Blocks ${row.totalBlocks} work item(s): ${row.blocksStories} stories, ${row.blocksEpics} epics, ${row.blocksFeatures} features. Asked ${row.ageDays} day(s) ago. Owner: ${row.owner}.`,
    }))
    .sort((a, b) => b.totalBlocks - a.totalBlocks || b.ageDays - a.ageDays);
}
```

---

### Task 13: Complete discovery dashboard sections

| Attribute | Details |
|-----------|---------|
| **Scope** | Add 3 missing sections and upgrade 2 degraded sections on the discovery dashboard to match all 7 PRD-specified sections. Wire gap detection and readiness assessment results. |
| **Depends On** | Task 10, Task 11, Task 12 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Dashboard renders 6 of 7 PRD-specified sections: (1) Outstanding questions by scope with owner and age, (2) Follow-up recommendations as structured cards with blocking counts and `reasoning`, (3) Recently answered questions with impact summary, (4) Blocked work items (`blocked-work-items.tsx`), (5) Per-epic discovery progress bars, (6) Unmapped requirements
- [ ] Section (7) Project Health Score is OUT OF SCOPE for Phase 3 (deferred to Phase 7 per PRD-17-16). Phase 3 reserves a placeholder region in the dashboard layout that Phase 7 fills.
- [ ] Blocked Work Items section lists up to 25 work items currently blocked by open questions, showing `workItemType`, `workItemDisplayId`, `blockingQuestionDisplayId`, `blockingQuestionText`, and `ageDays` (PRD-8-23).
- [ ] Follow-up cards render the `reasoning` string under the question text (PRD-8-21).
- [ ] "Run Gap Analysis" button triggers gap detection; results render as per-epic progress bars with severity indicators
- [ ] "Check Readiness" button triggers readiness assessment; results render as per-epic readiness badges
- [ ] Cached results show "Last updated: {time}" with refresh button
- [ ] If no gap analysis has been run, section shows prompt to run first analysis
- [ ] Outstanding questions section shows per-scope/per-owner breakdown (not just aggregate counts)
- [ ] Follow-up recommendations section shows question cards from blocking priority ranking (not prose)
- [ ] Recently answered section shows last 10 answered questions with their `impactAssessment` summary (truncated)
- [ ] Unmapped requirements section shows requirements with `status: CAPTURED`
- [ ] All sections use SWR polling for auto-refresh (existing pattern)

**Implementation Notes:**

New components to create:
1. `src/components/dashboard/recently-answered.tsx` — Query last 10 `ANSWERED` or `IMPACT_ASSESSED` questions. Show question text, answer date, impact summary (first 200 chars).
2. `src/components/dashboard/epic-discovery-progress.tsx` — Read `cachedGapAnalysis` from project. Render progress bars per epic with color-coded severity.
3. `src/components/dashboard/unmapped-requirements.tsx` — Query `requirement.findMany({ where: { projectId, status: "CAPTURED" } })`. Show count and list with link to map them.
4. `src/components/dashboard/blocked-work-items.tsx` — Query stories/epics/features with `QuestionBlocksStory/Epic/Feature` records joined on questions where `status IN ('OPEN', 'SCOPED', 'OWNED')`. Limit 25. Columns: workItemType, workItemDisplayId, blockingQuestionDisplayId, blockingQuestionText, ageDays. (PRD-8-23)
5. `src/components/dashboard/blocking-priority-cards.tsx` — Use `getBlockingPriorityQuestions` result. Render as cards: question ID, text, blocking count badge, owner, age, AND `reasoning` field (PRD-8-21).
6. `src/components/dashboard/outstanding-questions-detail.tsx` — Group questions by scope, show owner and age columns.

NOTE: No `health-score` component is created in Phase 3. Render an empty placeholder `<section data-phase7-placeholder="health-score" />` that Phase 7 will fill (PRD-8-25 / PRD-17-16).

Modify `src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx`:
- Add queries for recently answered, unmapped requirements, blocking priority
- Load cached gap analysis and readiness assessment from project
- Add "Run Gap Analysis" and "Check Readiness" buttons (fire Inngest events via server actions)
- Render all 7 sections in the correct order

---

### Task 14: Wire UI answer-submission to Answer Logging Pipeline + enqueue question embeddings

| Attribute | Details |
|-----------|---------|
| **Scope** | Phase 3 wires the UI answer-submission path to the Phase 2 Answer Logging Pipeline (Addendum v1 §2 pipeline-first). Adds embedding enqueue on question.create / question.update via Phase 11 infrastructure. Adds duplicate-answer dedup gate (PRD-19-13). |
| **Depends On** | Task 1 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `answerQuestion` server action fires `ANSWER_LOGGING_REQUESTED` with payload `{ projectId: string; userId: string; answerText: string; questionIdHint?: string; source: 'MANUAL' | 'CHAT' }` (per ADD-5.2.2-01)
- [ ] UI shows `Submitting…` until `QUESTION_IMPACT_COMPLETED` arrives (via existing notification channel — SSE/polling per Phase 2 pattern)
- [ ] On `QUESTION_IMPACT_COMPLETED`, the question detail view refreshes (Task 8 listener handles status advancement)
- [ ] **Embedding enqueue (PRD-8-07, ADD-5.2.2-05):** On `question.create` and `question.update` where `questionText` or `answerText` changes, `enqueueEmbedding({ entity: 'Question', id, content: <computed> })` is called. Hash of `{questionText, answerText, scope}` is stored on `Question.embeddingContentHash` (Task 1 schema field); re-enqueue is skipped when hash unchanged.
- [ ] Status-only update (e.g., `OPEN → SCOPED`) with unchanged text does NOT call `enqueueEmbedding`.
- [ ] **Duplicate-answer dedup (PRD-19-13):** Answer submission to a question already in `ANSWERED` status with `answeredAt` within the last 5 minutes returns 409 with `code: DUPLICATE_ANSWER_CONFLICT` and does not invoke the pipeline.
- [ ] PHASE_SPEC §2.14 cites ADD-5.2.2-01, ADD-5.2.2-02, ADD-5.2.2-05 trace.

**Implementation Notes:**

```ts
// src/actions/questions.ts (answerQuestion excerpt)
const recent = await prisma.question.findUnique({
  where: { id: questionId },
  select: { status: true, answeredAt: true },
});
if (recent?.status === "ANSWERED" && recent.answeredAt && Date.now() - recent.answeredAt.getTime() < 300_000) {
  throw new ActionError("DUPLICATE_ANSWER_CONFLICT", 409);
}

await inngest.send({
  name: EVENTS.ANSWER_LOGGING_REQUESTED,
  data: { projectId, userId, answerText, questionIdHint: questionId, source: "MANUAL" },
});
```

```ts
// src/lib/embeddings/question-hash.ts
import { createHash } from "node:crypto";
export function computeQuestionEmbeddingHash(q: { questionText: string; answerText: string | null; scope: string }) {
  return createHash("sha256")
    .update(JSON.stringify({ q: q.questionText, a: q.answerText ?? "", s: q.scope }))
    .digest("hex");
}
```

After every `prisma.question.create` or `prisma.question.update` that touches `questionText` or `answerText`, recompute the hash; if it differs from the stored value, call `enqueueEmbedding` (Phase 11 surface) and persist the new hash.

**Cross-phase coordination:**
- Phase 2 publishes and freezes `ANSWER_LOGGING_REQUESTED` and `QUESTION_IMPACT_COMPLETED` event contracts.
- Phase 11 publishes the `enqueueEmbedding` surface and consumes the queue.

---

## Summary

| Task | Title | Depends On | Complexity | Status |
|------|-------|-----------|------------|--------|
| 1 | Schema migration — enum fixes, source field, cached fields, embedding hash, partial unique indexes | — | S | Not Started |
| 2 | Fix question display ID scheme | 1 | M | Not Started |
| 3 | Clean up ESCALATED references | 1 | S | Not Started |
| 4 | Wire source field + clarity validation + scope-required (PRD-9-02, PRD-9-10) | 1 | S | Not Started |
| 5 | Enable client/TBD owner assignment | 1 | S | Not Started |
| 6 | Render parkedReason + QuestionAffects on detail page | 1 | S | Not Started |
| 7 | Wire pagination to questions list page | 1 | S | Not Started |
| 8 | Status advancement listener for QUESTION_IMPACT_COMPLETED (pipeline-first) | 1, 14 | S | Not Started |
| 9 | Populate QuestionAffects via AI + manual UI (advisory lock; query-then-create) | 1 | M | Not Started |
| 10 | Implement gap detection analysis | 8 | L | Not Started |
| 11 | Implement readiness assessment | 8 | L | Not Started |
| 12 | Build blocking-priority question ranking + reasoning field | 1 | M | Not Started |
| 13 | Complete discovery dashboard sections (6 of 7; health score deferred to Phase 7) | 10, 11, 12 | M | Not Started |
| 14 | Wire UI answer-submission to Answer Logging Pipeline + enqueue question embeddings + duplicate-answer 409 | 1 | M | Not Started |
