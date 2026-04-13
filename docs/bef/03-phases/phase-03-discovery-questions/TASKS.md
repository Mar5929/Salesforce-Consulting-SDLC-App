# Phase 3 Tasks: Discovery, Questions

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 13
> Status: 0/13 complete
> Last Updated: 2026-04-10

---

## Execution Order

```
Task 1 (schema migration) ────────────────────────────────────────┐
  ├── Task 2 (display ID scheme) ────── parallel ─────────────────┤
  ├── Task 3 (ESCALATED cleanup) ────── parallel ─────────────────┤
  ├── Task 4 (source field wiring) ──── parallel ─────────────────┤
  ├── Task 5 (client/TBD owner) ─────── parallel ─────────────────┤
  ├── Task 6 (detail page rendering) ── parallel ─────────────────┤
  └── Task 7 (pagination) ──────────── parallel ──────────────────┤
       └── Task 8 (impact assessment overhaul) ───────────────────┤
            ├── Task 9 (QuestionAffects) ────── parallel with 8 ──┤
            ├── Task 10 (gap detection) ─────── depends on 8 ─────┤
            ├── Task 11 (readiness assessment) ─ depends on 8 ────┤
            └── Task 12 (blocking priority) ──── parallel w/10,11 ┤
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
- [ ] `REVIEWED` is no longer in the enum. Existing `REVIEWED` records are migrated to `ANSWERED`.
- [ ] `QuestionSource` enum exists with `MANUAL`, `TRANSCRIPT`, `CHAT`
- [ ] `Question.source` field exists with default `MANUAL`
- [ ] `Project` model has `cachedGapAnalysis Json?`, `cachedGapAnalysisAt DateTime?`, `cachedReadinessAssessment Json?`, `cachedReadinessAssessmentAt DateTime?`
- [ ] Migration runs cleanly on existing data

**Implementation Notes:**
1. In `prisma/schema.prisma`:
   - Change `REVIEWED` to `IMPACT_ASSESSED` in `enum QuestionStatus`
   - Add `enum QuestionSource { MANUAL TRANSCRIPT CHAT }`
   - Add `source QuestionSource @default(MANUAL)` to `Question` model
   - Add 4 cached fields to `Project` model
2. Migration SQL must include: `UPDATE "Question" SET status = 'ANSWERED' WHERE status = 'REVIEWED'` before the enum rename
3. Update the transition table in `src/actions/questions.ts` — replace any `REVIEWED` references with `IMPACT_ASSESSED`
4. Update any TypeScript code that references `"REVIEWED"` as a string literal

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

### Task 8: Unify impact assessment + add downstream actions

| Attribute | Details |
|-----------|---------|
| **Scope** | Deprecate `questionImpactAssessmentFunction`, route all answered-question events through `questionImpactFunction`, modify the impact task for structured output, add 4 downstream write operations, advance status to `IMPACT_ASSESSED`. |
| **Depends On** | Task 1 |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `answerQuestion` action fires `QUESTION_IMPACT_REQUESTED` (not `ENTITY_CONTENT_CHANGED`)
- [ ] `questionImpactAssessmentFunction` is removed (or disabled)
- [ ] All answered questions go through hybrid routing with conflict detection
- [ ] Impact task produces structured JSON with: summary, designChanges, unblockedItems, newQuestions, contradictions
- [ ] Follow-up questions from `newQuestions[]` are created as real Question records
- [ ] `QuestionBlocksStory/Epic/Feature` records for the answered question are deleted (unblocking)
- [ ] `WORK_ITEM_UNBLOCKED` notifications are sent for each unblocked item
- [ ] Contradictions flag affected Decision records with `needsReview: true`
- [ ] Question status advances to `IMPACT_ASSESSED` after all downstream actions complete
- [ ] If AI returns invalid JSON, fallback to storing raw text; status stays `ANSWERED`
- [ ] Race conditions prevented by Inngest concurrency key

**Implementation Notes:**

**Step 1 — Route change:**
In `src/actions/questions.ts`, `answerQuestion` function (~line 219): Change `inngest.send({ name: EVENTS.ENTITY_CONTENT_CHANGED, data: { entityType: "question", entityId, action: "answered" } })` to `inngest.send({ name: EVENTS.QUESTION_IMPACT_REQUESTED, data: { projectId, questionId: entityId, memberId } })`.

**Step 2 — Structured output schema:**
In `src/lib/agent-harness/tasks/question-impact.ts`, add an `outputValidator` that parses JSON:
```ts
outputValidator: (result) => {
  try {
    const parsed = JSON.parse(result);
    const required = ["summary", "designChanges", "unblockedItems", "newQuestions", "contradictions"];
    const missing = required.filter(k => !(k in parsed));
    if (missing.length > 0) return { valid: false, corrections: [`Missing fields: ${missing.join(", ")}`] };
    return { valid: true };
  } catch {
    return { valid: false, corrections: ["Output must be valid JSON with fields: summary, designChanges, unblockedItems, newQuestions, contradictions"] };
  }
}
```

**Step 3 — Downstream actions in Inngest function:**
In `src/lib/inngest/functions/question-impact.ts`, after the AI assessment step, add new steps:

```ts
// Step: Create follow-up questions
await step.run("create-follow-up-questions", async () => {
  for (const q of parsed.newQuestions) {
    await prisma.question.create({
      data: {
        projectId, displayId: await generateQuestionDisplayId(...),
        questionText: q.questionText, scope: q.scope || parentQuestion.scope,
        scopeEpicId: q.scopeEpicId || parentQuestion.scopeEpicId,
        source: "CHAT", status: "OPEN",
      }
    });
  }
});

// Step: Unblock items
await step.run("unblock-items", async () => {
  await prisma.questionBlocksStory.deleteMany({ where: { questionId } });
  await prisma.questionBlocksEpic.deleteMany({ where: { questionId } });
  await prisma.questionBlocksFeature.deleteMany({ where: { questionId } });
  // Send WORK_ITEM_UNBLOCKED notifications for each
});

// Step: Flag contradictions
await step.run("flag-contradictions", async () => {
  for (const c of parsed.contradictions) {
    await prisma.decision.update({
      where: { id: c.existingDecisionId },
      data: { needsReview: true, reviewReason: c.description }
    });
  }
});

// Step: Advance status
await step.run("advance-to-impact-assessed", async () => {
  await prisma.question.update({
    where: { id: questionId },
    data: { status: "IMPACT_ASSESSED", impactAssessment: parsed.summary }
  });
});
```

**Step 4 — Remove deprecated function:**
Delete or disable `src/lib/inngest/functions/question-impact-assessment.ts`. Remove its registration from the Inngest client.

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
- [ ] Duplicate records are handled via upsert (no errors)

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
    for (const a of input.affects) {
      await prisma.questionAffects.upsert({
        where: { questionId_epicId_featureId: { questionId: input.questionId, epicId: a.epicId, featureId: a.featureId } },
        create: { questionId: input.questionId, epicId: a.epicId, featureId: a.featureId },
        update: {}
      });
    }
    return { success: true, count: input.affects.length };
  }
}
```
2. Add tool to `transcript-processing.ts` and `question-impact.ts` task definitions' tools arrays.
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
- [ ] Rate limited: returns cached if < 1 hour old
- [ ] Inngest function triggered by `GAP_ANALYSIS_REQUESTED` event
- [ ] Epics with 0 questions flagged as "potential blind spot"

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
- [ ] AI cross-references existing stories (don't recommend creation for epics that already have stories)

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
- [ ] Dashboard renders: (1) Outstanding questions by scope with owner and age, (2) Follow-up recommendations as structured cards with blocking counts, (3) Recently answered questions with impact summary, (4) Blocked work items, (5) Per-epic discovery progress bars, (6) Unmapped requirements, (7) Health score
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
4. `src/components/dashboard/blocking-priority-cards.tsx` — Use `getBlockingPriorityQuestions` result. Render as cards: question ID, text, blocking count badge, owner, age.
5. `src/components/dashboard/outstanding-questions-detail.tsx` — Group questions by scope, show owner and age columns.

Modify `src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx`:
- Add queries for recently answered, unmapped requirements, blocking priority
- Load cached gap analysis and readiness assessment from project
- Add "Run Gap Analysis" and "Check Readiness" buttons (fire Inngest events via server actions)
- Render all 7 sections in the correct order

---

## Summary

| Task | Title | Depends On | Complexity | Status |
|------|-------|-----------|------------|--------|
| 1 | Schema migration — enum fixes, source field, cached fields | — | S | Not Started |
| 2 | Fix question display ID scheme | 1 | M | Not Started |
| 3 | Clean up ESCALATED references | 1 | S | Not Started |
| 4 | Wire source field in creation paths | 1 | S | Not Started |
| 5 | Enable client/TBD owner assignment | 1 | S | Not Started |
| 6 | Render parkedReason + QuestionAffects on detail page | 1 | S | Not Started |
| 7 | Wire pagination to questions list page | 1 | S | Not Started |
| 8 | Unify impact assessment + add downstream actions | 1 | L | Not Started |
| 9 | Populate QuestionAffects via AI + manual UI | 1 | M | Not Started |
| 10 | Implement gap detection analysis | 8 | L | Not Started |
| 11 | Implement readiness assessment | 8 | L | Not Started |
| 12 | Build blocking-priority question ranking | 1 | M | Not Started |
| 13 | Complete discovery dashboard sections | 10, 11, 12 | M | Not Started |
| 14 | Wire UI answer-submission to Answer Logging Pipeline + enqueue question embeddings (Addendum v1; references Phase 2 + Phase 11) | 1 | S | Not Started |
