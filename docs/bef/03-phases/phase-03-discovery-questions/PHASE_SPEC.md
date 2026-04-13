# Phase 3 Spec: Discovery, Questions

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [03-discovery-questions-gaps.md](./03-discovery-questions-gaps.md)
> Depends On: Phase 2 (Agent Harness, Transcripts)
> Status: Draft
> Last Updated: 2026-04-10

---

## 1. Scope Summary

Fix the question ID scheme to match the PRD's `Q-{SCOPE}-{NUMBER}` format, correct the lifecycle enum (replace `REVIEWED` with `IMPACT_ASSESSED`, remove phantom `ESCALATED`), unify the two impact assessment paths into one with conflict detection and downstream write actions, implement the two headline AI features (gap detection and readiness assessment), populate the `QuestionAffects` table for cross-cutting questions, complete the question data model (`source` field, client/TBD owner), wire pagination, and fill in the 3 missing discovery dashboard sections.

**In scope:** 14 of 14 domain gaps -> 13 tasks
**Moved out:** None. All gaps addressed in this phase.

---

## Addendum v1 Amendments (April 13, 2026)

These amendments integrate PRD Addendum v1 into Phase 3. They are additive — existing requirements below are unchanged.

- **Question embeddings:** Enqueue via Phase 11 infrastructure on `question.create` and `question.update` (hash-based re-embed — only re-embed when the semantic content hash changes). Questions become searchable via `search_project_kb`.
- **Answer submission routing:** The Answer Logging Pipeline (Phase 2) is the implementation path for answering a question. Phase 3 wires the UI answer submission form to call the pipeline, not a direct server action.
- **Transcript-driven discovery:** The Transcript Processing Pipeline (Phase 2) is the implementation path for transcript-driven discovery. Phase 3 verifies the UI trigger path is correct.
- **Search coverage:** `search_project_kb` covers questions by the end of Phase 3 — verify in retrieval tests.
- **What does not change:** Question lifecycle states, gap detection, readiness assessment, discovery workflow, blocking prioritization, pagination. All unchanged externally.

---

## 2. Functional Requirements

### 2.1 Schema Migration — Enum Fixes + Source Field (REQ-DISC-001)

- **What it does:** Three schema changes in one migration:
  1. Replaces `REVIEWED` with `IMPACT_ASSESSED` in the `QuestionStatus` enum. Existing `REVIEWED` records are migrated to `ANSWERED` (since `REVIEWED` was a misapplied human-review concept already handled by the `needsReview` boolean).
  2. Creates a `QuestionSource` enum with values `MANUAL`, `TRANSCRIPT`, `CHAT`.
  3. Adds a `source` field to the `Question` model (type `QuestionSource`, default `MANUAL`).
  4. Adds `cachedGapAnalysis Json?`, `cachedGapAnalysisAt DateTime?`, `cachedReadinessAssessment Json?`, `cachedReadinessAssessmentAt DateTime?` to the `Project` model for storing AI analysis results.
- **Inputs:** Database migration
- **Outputs:** Updated enum values, new field available on all Question records
- **Business rules:** Default `MANUAL` for source is correct — manually entered questions are the baseline. Transcript processing and chat paths will explicitly set their source. Migrating `REVIEWED` to `ANSWERED` (not `IMPACT_ASSESSED`) is correct because those questions had their answer recorded but never went through a real impact assessment.
- **Files:** `prisma/schema.prisma`, migration SQL

### 2.2 Fix Question Display ID Scheme (REQ-DISC-002)

- **What it does:** Reworks `generateDisplayId` for questions to produce the PRD-specified format:
  - `ENGAGEMENT` scope: `Q-ENG-001`
  - `EPIC` scope: `Q-{epicPrefix}-001` (e.g., `Q-DM-001`)
  - `FEATURE` scope: `Q-{epicPrefix}-{featurePrefix}-001` (e.g., `Q-DM-LRT-001`)
  - Numbers are zero-padded to 3 digits.
- **Inputs:** Question creation with scope and optional epic/feature reference
- **Outputs:** Display ID in the correct format
- **Business rules:**
  - The scope prefix lookup requires the epic's `prefix` field (already exists on Epic model) and the feature's `prefix` field (already exists on Feature model).
  - Sequential numbering is scoped: engagement-wide questions increment within `Q-ENG-*`, epic questions within `Q-{epicPrefix}-*`, feature questions within `Q-{epicPrefix}-{featurePrefix}-*`.
  - Existing display IDs (`Q-1`, `Q-2`, etc.) are migrated by determining scope from the question's `scope` field and reformatting with the appropriate prefix and zero-padding.
  - Epic prefix uniqueness within a project is already enforced by the `@@unique([epicId, prefix])` constraint on Feature and the epic prefix field. No additional validation needed.
- **File:** `src/lib/display-id.ts` (major rework of Question path), migration for existing IDs

### 2.3 Clean Up ESCALATED References (REQ-DISC-003)

- **What it does:** Removes the phantom `ESCALATED` status from agent task code where it references a value that doesn't exist in the database enum.
- **Inputs:** N/A
- **Outputs:** No more latent runtime error risk
- **Business rules:** `ESCALATED` was never a valid state. In `question-answering.ts`, remove `ESCALATED` from the `update_question_status` tool's allowed enum values (keep `ANSWERED` and `PARKED`). In `dashboard-synthesis.ts`, remove the `escalatedCount` filter (always produced 0). If a question truly needs escalation, it should be `PARKED` with a parkedReason explaining why.
- **Files:** `src/lib/agent-harness/tasks/question-answering.ts` (line 189), `src/lib/agent-harness/tasks/dashboard-synthesis.ts` (line 39)

### 2.4 Wire Source Field in Creation Paths (REQ-DISC-004)

- **What it does:** Sets the `source` field when questions are created through each of the three input channels.
- **Inputs:** Question creation from any path
- **Outputs:** Every new Question record has a correct `source` value
- **Business rules:**
  - `createQuestion` server action (UI form): `source: "MANUAL"`
  - `create_question` agent tool during transcript processing: `source: "TRANSCRIPT"`
  - `create_question` agent tool during chat/conversation: `source: "CHAT"`
  - The tool needs to know the session context (transcript vs chat). The `metadata.taskType` on the session provides this. If `taskType === "TRANSCRIPT_PROCESSING"`, set `TRANSCRIPT`. If the task is a chat-originated session, set `CHAT`. Default to `MANUAL` as fallback.
- **Files:** `src/actions/questions.ts` (createQuestion), `src/lib/agent-harness/tools/create-question.ts`

### 2.5 Enable Client/TBD Owner Assignment (REQ-DISC-005)

- **What it does:** Activates the existing but dead `ownerDescription` field on the Question model so questions can be owned by non-team-members.
- **Inputs:** Question form submission with owner type selection
- **Outputs:** Question records with either `ownerId` (team member) or `ownerDescription` ("Client (Sarah)", "TBD")
- **Business rules:**
  - The question form's owner field gets a dropdown with three sections: "Team Members" (existing), "Client" (text input for contact name, stored as `"Client ({name})"`), "TBD" (stored as `"TBD"`).
  - When `ownerDescription` is set, `ownerId` is null. When `ownerId` is set, `ownerDescription` is null. Mutually exclusive.
  - The `createQuestion` and `updateQuestion` server actions must accept `ownerDescription` as an alternative to `ownerId`.
  - Question list and detail views display `ownerDescription` when `ownerId` is null.
  - Status transition to `OWNED` is valid when either `ownerId` or `ownerDescription` is set.
- **Files:** `src/actions/questions.ts`, `src/components/questions/question-form.tsx`, `src/components/questions/question-detail.tsx`, question list component

### 2.6 Render parkedReason + QuestionAffects on Detail Page (REQ-DISC-006)

- **What it does:** Adds two missing UI sections to the question detail page:
  1. **Parked Reason** — Displayed when `status === "PARKED"`, shows the `parkedReason` field.
  2. **Affects** — Lists epics and features from `QuestionAffects` records. Rendered for engagement-scope questions.
- **Inputs:** Question detail page load
- **Outputs:** Complete question detail view with parked reason and cross-cutting scope visibility
- **Business rules:** Parked Reason section is conditionally rendered only for PARKED questions. Affects section is rendered only for ENGAGEMENT-scope questions (though it could also render for any question that has affects records). If no affects records exist, display "No cross-cutting relationships identified" with a note that the AI will detect these automatically.
- **Files:** `src/app/(dashboard)/projects/[projectId]/questions/[questionId]/page.tsx` (add `questionAffects` to include), `src/components/questions/question-detail.tsx`

### 2.7 Wire Pagination to Questions List Page (REQ-DISC-007)

- **What it does:** Replaces the direct `db.question.findMany` (which loads all questions) with the existing paginated `getQuestions` server action.
- **Inputs:** Questions list page with page/pageSize URL params
- **Outputs:** Paginated question list with navigation controls
- **Business rules:** The `getQuestions` action in `src/actions/questions.ts` (lines 315-354) already implements pagination with `page`/`pageSize` parameters. The page just needs to call it instead of querying directly. Default page size: 25. Use `nuqs` for URL state management (already in the stack).
- **Files:** `src/app/(dashboard)/projects/[projectId]/questions/page.tsx`

### 2.8 Unify Impact Assessment + Add Downstream Actions (REQ-DISC-008)

- **What it does:** This is the largest requirement. It unifies the two divergent impact assessment paths and adds the four PRD-mandated downstream write operations.

  **Routing unification:**
  - The `questionImpactAssessmentFunction` (triggered by `ENTITY_CONTENT_CHANGED` with `action=answered`) is deprecated.
  - The `answerQuestion` server action now fires `QUESTION_IMPACT_REQUESTED` instead of `ENTITY_CONTENT_CHANGED`.
  - All answered questions route through `questionImpactFunction` (the hybrid function with conflict detection).

  **Structured output:**
  - The impact assessment agent task is modified to produce structured JSON output (not prose string):
    ```json
    {
      "summary": "Impact analysis text...",
      "designChanges": [{"entityType": "Decision", "entityId": "...", "description": "..."}],
      "unblockedItems": [{"entityType": "Story", "entityId": "..."}],
      "newQuestions": [{"questionText": "...", "scope": "EPIC", "scopeEpicId": "..."}],
      "contradictions": [{"existingDecisionId": "...", "description": "...", "severity": "HIGH"}]
    }
    ```
  - The `questionImpactFunction` Inngest function parses this and executes downstream writes.

  **Downstream actions (4 from PRD Section 9.1 step 5):**
  1. **Update designs/assumptions:** Flag affected decisions for review by setting `needsReview: true` with reason.
  2. **Unblock items:** Remove `QuestionBlocksStory`/`QuestionBlocksEpic`/`QuestionBlocksFeature` records for the answered question, triggering `WORK_ITEM_UNBLOCKED` notifications.
  3. **Create follow-up questions:** Persist `newQuestions[]` as actual Question records with `source: "CHAT"` and scope from the parent question context.
  4. **Flag contradictions:** For each contradiction, use the existing `flag_conflict` tool or create a Decision with `needsReview: true`.

  **Status advancement:**
  - After all downstream actions complete, advance the question's status to `IMPACT_ASSESSED`.

- **Inputs:** Any question being answered (via UI form or chat)
- **Outputs:** Complete impact assessment with all downstream side effects executed
- **Business rules:**
  - If the AI's structured output fails validation, store the raw text as `impactAssessment` (fallback) but skip downstream actions. Log the validation failure.
  - Downstream question creation uses the parent question's scope unless the AI explicitly specifies a different scope.
  - Unblocking is automatic — if a question that blocked Story X is answered, the blocking record is removed. The story doesn't automatically change status.
  - Race condition prevention: The Inngest concurrency key `project-{projectId}-QUESTION_ANSWERING` ensures only one impact assessment runs per project at a time.
- **Files:** `src/actions/questions.ts` (change event from ENTITY_CONTENT_CHANGED to QUESTION_IMPACT_REQUESTED), `src/lib/inngest/functions/question-impact.ts` (add downstream action steps), `src/lib/inngest/functions/question-impact-assessment.ts` (deprecate/remove), `src/lib/agent-harness/tasks/question-impact.ts` (structured output schema)

### 2.9 Populate QuestionAffects via AI + Manual UI (REQ-DISC-009)

- **What it does:** Enables the `QuestionAffects` join table to be populated by two paths:
  1. **AI detection** — During transcript processing and impact assessment, the AI identifies when a question relates to multiple epics and uses a `tag_question_affects` tool to write records.
  2. **Manual tagging** — The question detail form includes a multi-select for affected epics/features.
- **Inputs:** AI tool call or manual form submission
- **Outputs:** `QuestionAffects` records linking questions to the epics/features they cross-cut
- **Business rules:**
  - AI detection triggers on engagement-scope questions by default. The system prompt instructs the AI: "If this question relates to multiple epics, use the tag_question_affects tool to record which epics it impacts."
  - The `tag_question_affects` tool accepts `questionId` and an array of `{epicId?, featureId?}` pairs.
  - Manual tagging is available on all questions regardless of scope but is most useful for engagement-scope questions.
  - Duplicate affects records (same question + epic/feature) are silently ignored (upsert).
- **Files:** New tool `src/lib/agent-harness/tools/tag-question-affects.ts`, `src/lib/agent-harness/tasks/transcript-processing.ts` (add tool to available tools), `src/lib/agent-harness/tasks/question-impact.ts` (add tool), question form component, `src/actions/questions.ts` (add updateQuestionAffects action)

### 2.10 Implement Gap Detection Analysis (REQ-DISC-010)

- **What it does:** Implements the PRD's "Gap Detection" AI feature — the AI analyzes discovery coverage per epic and identifies areas where insufficient information has been gathered.
- **Inputs:** On-demand trigger from discovery dashboard (button: "Run Gap Analysis") or automatic trigger after significant knowledge changes (5+ questions answered in a session)
- **Outputs:** Structured gap analysis stored in `project.cachedGapAnalysis`:
  ```json
  {
    "generatedAt": "2026-04-10T...",
    "epics": [
      {
        "epicId": "...",
        "epicName": "Data Migration",
        "totalQuestions": 12,
        "answeredQuestions": 3,
        "coveragePercent": 25,
        "gaps": ["Merge rules for duplicate handling", "Data volume estimates for staging"],
        "blockingQuestions": [{"questionId": "...", "displayId": "Q-DM-003", "blocksCount": 3}],
        "severity": "HIGH"
      }
    ],
    "overallCoverage": 42,
    "recommendation": "Data Migration and Integration Setup have critical gaps..."
  }
  ```
- **Business rules:**
  - Coverage percentage = answered questions / total questions per epic. Epics with 0 questions get flagged as "No discovery questions raised — potential blind spot."
  - Gap severity thresholds: <25% answered = CRITICAL, 25-50% = HIGH, 50-75% = MEDIUM, >75% = LOW.
  - The AI enriches the quantitative data with qualitative analysis: it examines the actual question texts and determines whether the answered questions cover the key design areas for each epic.
  - Rate limited: at most once per hour per project (check `cachedGapAnalysisAt`).
- **Agent task:** New `GAP_DETECTION` task type. Context loader provides: all questions grouped by epic (with status), all decisions, project summary. Tools: none (analysis only, structured output).
- **Inngest function:** Triggered by `GAP_ANALYSIS_REQUESTED` event.
- **Files:** New `src/lib/agent-harness/tasks/gap-detection.ts`, new `src/lib/inngest/functions/gap-detection.ts`, `src/lib/inngest/events.ts` (new event)

### 2.11 Implement Readiness Assessment (REQ-DISC-011)

- **What it does:** Implements the PRD's "Readiness Assessment" AI feature — the AI evaluates whether enough discovery information exists to begin creating user stories for each epic.
- **Inputs:** On-demand trigger from discovery dashboard (button: "Check Readiness") or automatic trigger after gap analysis completes
- **Outputs:** Structured readiness assessment stored in `project.cachedReadinessAssessment`:
  ```json
  {
    "generatedAt": "2026-04-10T...",
    "epics": [
      {
        "epicId": "...",
        "epicName": "Report Audit",
        "readyForStories": true,
        "confidence": "HIGH",
        "reasoning": "4 key requirements answered: report access permissions, audit trail format, retention policy, export format. Sufficient to draft initial stories.",
        "supportingAnswers": ["Q-RA-001", "Q-RA-004", "Q-RA-007", "Q-RA-012"],
        "remainingRisks": ["Client hasn't confirmed archival policy — stories may need revision"]
      }
    ],
    "overallReadiness": "3 of 5 epics ready for story generation"
  }
  ```
- **Business rules:**
  - Readiness is not binary — the AI provides confidence levels. HIGH = "go ahead and write stories", MEDIUM = "can start but expect revision", LOW = "more discovery needed."
  - The AI cross-references: answered questions, captured requirements, decisions made, and any existing stories (to avoid recommending story creation for epics that already have stories).
  - Rate limited: at most once per hour per project (check `cachedReadinessAssessmentAt`).
- **Agent task:** New `READINESS_ASSESSMENT` task type. Context loader provides: questions by epic (with answers), requirements, decisions, existing story counts per epic. Tools: none (analysis only, structured output).
- **Inngest function:** Triggered by `READINESS_ASSESSMENT_REQUESTED` event. Can also be chained after gap detection completes.
- **Files:** New `src/lib/agent-harness/tasks/readiness-assessment.ts`, new `src/lib/inngest/functions/readiness-assessment.ts`, `src/lib/inngest/events.ts` (new event)

### 2.12 Build Blocking-Priority Question Ranking (REQ-DISC-012)

- **What it does:** Aggregates blocking counts from `QuestionBlocksStory`, `QuestionBlocksEpic`, and `QuestionBlocksFeature` to produce a ranked priority queue of unanswered questions.
- **Inputs:** Project ID
- **Outputs:** Ranked list of questions sorted by total blocking impact:
  ```json
  [
    {"questionId": "...", "displayId": "Q-DM-003", "questionText": "...", "totalBlocks": 5, "blocksStories": 3, "blocksEpics": 1, "blocksFeatures": 1, "owner": "Client (Sarah)", "ageDays": 12}
  ]
  ```
- **Business rules:**
  - Only `OPEN`, `SCOPED`, and `OWNED` questions are included (not ANSWERED/PARKED/IMPACT_ASSESSED).
  - Ranking: primary sort by `totalBlocks` descending, secondary by `ageDays` descending (older blocking questions are more urgent).
  - This is a pure database query — no AI involved. It provides the data that the dashboard uses for structured follow-up recommendations.
- **Files:** New `src/lib/dashboard/queries/blocking-priority.ts`, wire into dashboard page

### 2.13 Complete Discovery Dashboard Sections (REQ-DISC-013)

- **What it does:** Adds the 3 missing sections and upgrades 2 degraded sections on the discovery dashboard to match all 7 PRD-specified sections (Section 8.4).
- **Sections to add:**
  1. **Recently Answered Questions + Impact** — Shows last 10 answered questions with their impact assessment summary and what changed.
  2. **Per-Epic Discovery Progress** — Visual progress bars per epic showing question coverage (answered/total) with gap severity indicators. Sourced from `cachedGapAnalysis`.
  3. **Unmapped Requirements** — Requirements with `status: CAPTURED` that aren't yet linked to epics/stories. Quick-link to map them.
- **Sections to upgrade:**
  4. **Outstanding Questions** — Currently shows aggregate counts. Upgrade to per-scope breakdown with owner, age in days, and filtering by scope.
  5. **Follow-Up Recommendations** — Currently prose from briefing. Upgrade to structured question cards from the blocking-priority ranking (REQ-DISC-012), showing question ID, text, blocking count, and owner.
- **Business rules:**
  - Gap analysis and readiness assessment sections show cached results with "Last updated: {time}" and "Refresh" button.
  - If no gap analysis has been run, show a prompt: "Run your first gap analysis to see discovery coverage by epic."
  - The dashboard auto-refreshes on SWR polling (existing pattern), not on push.
- **Files:** `src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx`, new components in `src/components/dashboard/`

---

## 3. Technical Approach

### 3.1 Implementation Strategy

Schema and data fixes first, then AI infrastructure, then dashboard integration:

1. **Schema migration** (REQ-001) — Everything downstream needs the new enum values and fields.
2. **Question system fidelity** (REQ-002 through 007) — Fixes that make the question data model correct. All can run in parallel after schema migration.
3. **Impact assessment overhaul** (REQ-008) — The critical unification. Depends on schema migration for `IMPACT_ASSESSED` status.
4. **Cross-cutting + AI features** (REQ-009 through 012) — QuestionAffects, gap detection, readiness assessment, and blocking priority. Most can run in parallel. Gap detection and readiness assessment depend on REQ-008 patterns.
5. **Dashboard completion** (REQ-013) — Wires everything into the UI. Must be last.

### 3.2 File/Module Structure

```
prisma/
  schema.prisma                         — MODIFY (enum changes, source field, cached analysis fields)
  migrations/                           — CREATE (migration for enum + field changes + display ID rewrite)
src/lib/
  display-id.ts                         — MODIFY (rework Question path for scope-based IDs)
src/actions/
  questions.ts                          — MODIFY (source field, ownerDescription, event change, updateQuestionAffects)
src/lib/agent-harness/
  tasks/
    question-answering.ts               — MODIFY (remove ESCALATED from tool enum)
    question-impact.ts                  — MODIFY (structured output schema, tag_question_affects tool)
    transcript-processing.ts            — MODIFY (add tag_question_affects tool)
    dashboard-synthesis.ts              — MODIFY (remove ESCALATED filter)
    gap-detection.ts                    — CREATE (new agent task)
    readiness-assessment.ts             — CREATE (new agent task)
  tools/
    tag-question-affects.ts             — CREATE (new tool)
    create-question.ts                  — MODIFY (add source field from session context)
src/lib/inngest/
  events.ts                             — MODIFY (add GAP_ANALYSIS_REQUESTED, READINESS_ASSESSMENT_REQUESTED)
  functions/
    question-impact-assessment.ts       — REMOVE (deprecated, merged into question-impact.ts)
    question-impact.ts                  — MODIFY (add downstream action steps)
    gap-detection.ts                    — CREATE (new Inngest function)
    readiness-assessment.ts             — CREATE (new Inngest function)
src/lib/dashboard/queries/
  blocking-priority.ts                  — CREATE (blocking count aggregation query)
src/components/
  questions/
    question-form.tsx                   — MODIFY (owner type selector, affects multi-select)
    question-detail.tsx                 — MODIFY (parkedReason, QuestionAffects display)
  dashboard/
    recently-answered.tsx               — CREATE (new dashboard section)
    epic-discovery-progress.tsx         — CREATE (new dashboard section)
    unmapped-requirements.tsx           — CREATE (new dashboard section)
    blocking-priority-cards.tsx         — CREATE (structured follow-up recommendation cards)
    outstanding-questions-detail.tsx    — CREATE (upgraded outstanding questions section)
src/app/(dashboard)/projects/[projectId]/
  questions/page.tsx                    — MODIFY (wire pagination)
  questions/[questionId]/page.tsx       — MODIFY (add questionAffects to query)
  dashboard/page.tsx                    — MODIFY (add new sections, wire gap/readiness data)
```

### 3.3 Data Changes

**Enum changes:**
```prisma
enum QuestionStatus {
  OPEN
  SCOPED
  OWNED
  ANSWERED
  IMPACT_ASSESSED  // replaces REVIEWED
  PARKED
}

enum QuestionSource {
  MANUAL
  TRANSCRIPT
  CHAT
}
```

**Question model addition:**
```prisma
model Question {
  // ... existing fields
  source  QuestionSource @default(MANUAL)
}
```

**Project model additions:**
```prisma
model Project {
  // ... existing fields
  cachedGapAnalysis           Json?
  cachedGapAnalysisAt         DateTime?
  cachedReadinessAssessment   Json?
  cachedReadinessAssessmentAt DateTime?
}
```

**Migration notes:**
- `REVIEWED` -> `ANSWERED` for existing records (SQL: `UPDATE "Question" SET status = 'ANSWERED' WHERE status = 'REVIEWED'`).
- Display ID migration: SQL script to rewrite `Q-N` format IDs using the question's scope and linked epic/feature prefixes. Must run within a transaction.
- All additions are nullable or have defaults — no breaking changes for existing data.

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| Question answered via UI and chat simultaneously | Inngest concurrency key `project-{projectId}-QUESTION_ANSWERING` serializes impact assessments. Second one runs after first completes. | N/A — sequential execution |
| Impact assessment AI returns invalid JSON | Store raw text as `impactAssessment` string. Skip downstream actions. Log validation failure in SessionLog. Status stays `ANSWERED` (not advanced to `IMPACT_ASSESSED`). | Warning logged |
| Follow-up question creation fails (e.g., scope epic doesn't exist) | Skip that question, continue with others. Log the failure. | Partial success |
| Question has no blocking records when unblocking runs | No-op. No records to delete. | N/A |
| Gap analysis requested within 1 hour of last run | Return cached result immediately. Don't invoke AI. | User sees "Last updated X minutes ago" with cached data |
| Epic has 0 questions when gap analysis runs | Flag as "No discovery questions raised — potential blind spot" with CRITICAL severity | N/A — this IS the gap |
| Display ID migration for question with deleted epic | Use `Q-UNK-{number}` as fallback prefix for orphaned scope references | Log warning |
| QuestionAffects duplicate (same question + epic) | Upsert — silently ignore if record exists | N/A |
| `ownerDescription` and `ownerId` both provided | Validation error in server action. Mutually exclusive. | 400: "Cannot set both ownerId and ownerDescription" |
| Readiness assessment for project with 0 epics | Return empty assessment with message "No epics defined yet" | N/A |
| Blocking priority query on project with 0 blocking records | Return empty array. Dashboard shows "No blocking dependencies found." | N/A |

---

## 5. Integration Points

### From Phase 2
- **REQ-HARNESS-001** (create_question tool fix) — Questions now have correct confidence/needsReview fields. Phase 3's source field addition builds on this same tool.
- **REQ-HARNESS-002** (output validation re-prompt) — Gap detection and readiness assessment benefit from re-prompt loop for structured output validation.
- **REQ-HARNESS-003** (firm typographic rules) — All new AI task outputs are automatically cleaned.
- **REQ-HARNESS-004** (SessionLog entity tracking) — Impact assessment downstream actions (creating follow-up questions) are tracked in SessionLog.
- **REQ-HARNESS-010** (Needs Review UX) — Questions flagged for review during transcript processing are visible before Phase 3's impact assessment runs on them.

### From Phase 1
- **REQ-RBAC-001** (auth fix) — All new server actions and dashboard queries go through authenticated paths.
- **REQ-RBAC-002-007** (role gates) — New question actions respect role permissions.

### For Future Phases
- **Phase 4 (Work Management):** Depends on IMPACT_ASSESSED lifecycle state for story readiness signals. Uses gap detection data to inform story generation scope.
- **Phase 5 (Sprint/Developer):** Context packages include answered questions and impact assessments from Phase 3.
- **Phase 6 (Org/Knowledge):** Knowledge article creation can reference impact assessment data. QuestionAffects helps knowledge graph understand cross-cutting concerns.
- **Phase 7 (Dashboards/Search):** Dashboard framework integrates Phase 3's discovery sections. Search expansion includes questions. Phase 7 receives the structured data that Phase 3 stores in cached fields.
- **Phase 9 (QA/Jira/Archival):** Question archival depends on correct lifecycle states from Phase 3.

---

## 6. Acceptance Criteria

- [ ] `QuestionStatus` enum has `IMPACT_ASSESSED` and no longer has `REVIEWED`
- [ ] `QuestionSource` enum exists with `MANUAL`, `TRANSCRIPT`, `CHAT` values
- [ ] Every new Question record has a `source` field correctly set based on creation path
- [ ] Question display IDs follow `Q-{SCOPE}-{NNN}` format (e.g., `Q-ENG-001`, `Q-DM-003`)
- [ ] Existing display IDs are migrated to the new format
- [ ] No reference to `ESCALATED` exists in agent task code
- [ ] Questions can be assigned to "Client ({name})" or "TBD" via `ownerDescription`
- [ ] Parked questions display their `parkedReason` on the detail page
- [ ] `QuestionAffects` records are displayed on the question detail page
- [ ] Questions list page is paginated (default 25 per page)
- [ ] All answered questions route through the hybrid impact function with conflict detection
- [ ] Impact assessment creates follow-up Question records when the AI identifies them
- [ ] Impact assessment removes blocking records when a blocking question is answered
- [ ] Impact assessment flags contradictions with existing decisions
- [ ] Question status advances to `IMPACT_ASSESSED` after successful impact processing
- [ ] `QuestionAffects` is populated by AI during transcript processing and impact assessment
- [ ] Gap detection analysis runs on demand and produces per-epic coverage data
- [ ] Readiness assessment runs on demand and produces per-epic readiness data
- [ ] Discovery dashboard shows all 7 PRD-specified sections
- [ ] Follow-up recommendations show structured question cards with blocking counts (not prose)
- [ ] Discovery dashboard shows per-epic progress bars with gap severity indicators
- [ ] No regressions — existing question CRUD, search, and chat flows continue working

---

## 7. Open Questions

None — all scoping decisions resolved during deep dive.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 3`. All 14 gaps addressed. REVIEWED replaced with IMPACT_ASSESSED. Two impact assessment functions unified. Four new files created (gap detection, readiness assessment, tag-question-affects tool, blocking priority query). |
