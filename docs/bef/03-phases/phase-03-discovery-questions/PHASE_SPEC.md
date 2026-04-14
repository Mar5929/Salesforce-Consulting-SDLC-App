# Phase 3 Spec: Discovery, Questions

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [03-discovery-questions-gaps.md](./03-discovery-questions-gaps.md)
> Depends On: Phase 2 (Agent Harness, Transcripts)
> Status: Draft
> Last Updated: 2026-04-10

---

## 1. Scope Summary

Fix the question ID scheme to match the PRD's `Q-{SCOPE}-{NUMBER}` format, correct the lifecycle enum (replace `REVIEWED` with `IMPACT_ASSESSED`, remove phantom `ESCALATED`), unify the two impact assessment paths into one with conflict detection and downstream write actions, implement the two headline AI features (gap detection and readiness assessment), populate the `QuestionAffects` table for cross-cutting questions, complete the question data model (`source` field, client/TBD owner), wire pagination, and fill in the 3 missing discovery dashboard sections.

**In scope:** 14 of 14 domain gaps -> 14 tasks (Task 14 added per Addendum v1 amendment for Answer Logging Pipeline wiring + question embeddings)
**Moved out:** None. All gaps addressed in this phase. Project Health Score (PRD-8-25) deferred to Phase 7 with a placeholder region reserved on the discovery dashboard.

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
- **Naming reconciliation (PRD-9-01):** The `OPEN` enum value is the internal representation of PRD §9.1 lifecycle state `RAISED`. Retained for compatibility with existing Phase 1 production data and to avoid a breaking string-literal migration across Phase 1/2 code. Lifecycle order is semantically equivalent: `OPEN` (= `RAISED`) → `SCOPED` → `OWNED` → `ANSWERED` → `IMPACT_ASSESSED`, with terminal `PARKED`. All PRD/Addendum references to `RAISED` map 1:1 to `OPEN` in this codebase.

Traces: REQ-DISC-001 → PRD-9-01, PRD-9-09
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

Traces: REQ-DISC-002 → PRD-9-07, PRD-9-08

### 2.3 Clean Up ESCALATED References (REQ-DISC-003)

- **What it does:** Removes the phantom `ESCALATED` status from agent task code where it references a value that doesn't exist in the database enum.
- **Inputs:** N/A
- **Outputs:** No more latent runtime error risk
- **Business rules:** `ESCALATED` was never a valid state. In `question-answering.ts`, remove `ESCALATED` from the `update_question_status` tool's allowed enum values (keep `ANSWERED` and `PARKED`). In `dashboard-synthesis.ts`, remove the `escalatedCount` filter (always produced 0). If a question truly needs escalation, it should be `PARKED` with a parkedReason explaining why.
- **Files:** `src/lib/agent-harness/tasks/question-answering.ts` (line 189), `src/lib/agent-harness/tasks/dashboard-synthesis.ts` (line 39)

Traces: REQ-DISC-003 → PRD-9-01 (lifecycle hygiene)

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

**Question text clarity (PRD-9-10):** `createQuestion` validates `questionText.length >= 15` and rejects text matching `^(yes|no|tbd|\?+)$` (case-insensitive). The `create_question` tool sets `needsReview = true` when extracted question text is `< 25` chars or lacks terminal `?` punctuation, surfacing it for human review before lifecycle progression.

**Scope-required for AI-created questions (PRD-9-02):** The `create_question` tool input schema requires `scope: 'ENGAGEMENT' | 'EPIC' | 'FEATURE'` and conditionally `scopeEpicId` (for EPIC/FEATURE) and `scopeFeatureId` (for FEATURE). The tool handler rejects calls missing required fields so AI-created questions never arrive with null scope and never break Task 2's display-ID generator.

Traces: REQ-DISC-004 → PRD-9-02, PRD-9-09, PRD-9-10

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

Traces: REQ-DISC-005 → PRD-9-03

### 2.6 Render parkedReason + QuestionAffects on Detail Page (REQ-DISC-006)

- **What it does:** Adds two missing UI sections to the question detail page:
  1. **Parked Reason** — Displayed when `status === "PARKED"`, shows the `parkedReason` field.
  2. **Affects** — Lists epics and features from `QuestionAffects` records. Rendered for engagement-scope questions.
- **Inputs:** Question detail page load
- **Outputs:** Complete question detail view with parked reason and cross-cutting scope visibility
- **Business rules:** Parked Reason section is conditionally rendered only for PARKED questions. Affects section is rendered only for ENGAGEMENT-scope questions (though it could also render for any question that has affects records). If no affects records exist, display "No cross-cutting relationships identified" with a note that the AI will detect these automatically.
- **Files:** `src/app/(dashboard)/projects/[projectId]/questions/[questionId]/page.tsx` (add `questionAffects` to include), `src/components/questions/question-detail.tsx`

Traces: REQ-DISC-006 → PRD-5-32, PRD-9-09

### 2.7 Wire Pagination to Questions List Page (REQ-DISC-007)

- **What it does:** Replaces the direct `db.question.findMany` (which loads all questions) with the existing paginated `getQuestions` server action.
- **Inputs:** Questions list page with page/pageSize URL params
- **Outputs:** Paginated question list with navigation controls
- **Business rules:** The `getQuestions` action in `src/actions/questions.ts` (lines 315-354) already implements pagination with `page`/`pageSize` parameters. The page just needs to call it instead of querying directly. Default page size: 25. Use `nuqs` for URL state management (already in the stack).
- **Files:** `src/app/(dashboard)/projects/[projectId]/questions/page.tsx`

Traces: REQ-DISC-007 → PRD-8-15

### 2.8 Status Advancement on Pipeline Completion (REQ-DISC-008)

- **What it does:** Phase 3 does NOT own impact assessment. The Answer Logging Pipeline (Phase 2, ADD-5.2.2-04) owns Stage 4 — unblocks, contradictions, new-question creation, design-change flags, and structured output validation. Phase 3's responsibility is reduced to: (a) firing `ANSWER_LOGGING_REQUESTED` from the `answerQuestion` UI action (see §2.14 / Task 14), (b) subscribing to `QUESTION_IMPACT_COMPLETED` emitted by the pipeline, and (c) advancing the question's status from `ANSWERED` to `IMPACT_ASSESSED` in that subscriber while persisting the pipeline's `summary` to `Question.impactAssessment`.

  This collapse resolves Wave 0 contradiction A: Addendum v1 §2 locks pipeline-first architecture; the legacy Phase-3-owned `questionImpactFunction` and `questionImpactAssessmentFunction` are removed.

  **Listener contract (consumed):**
  - Event: `QUESTION_IMPACT_COMPLETED` (emitted by Phase 2 pipeline after Stage 4 completes)
  - Payload: `{ projectId, questionId, summary, designChanges[], unblockedItems[], newQuestions[], contradictions[] }`
  - Listener action: update `Question.status = IMPACT_ASSESSED`, set `Question.impactAssessment = payload.summary`. Do not re-execute downstream writes; they are already applied by the pipeline.

  **Cross-phase coordination (Phase 2 owns):**
  - Confirms `ANSWER_LOGGING_REQUESTED` event contract (see §2.14 Task 14).
  - Emits `QUESTION_IMPACT_COMPLETED` with the payload above.
  - Implements structured-output validator (designChanges, unblockedItems, newQuestions, contradictions) inside the pipeline stage.
  - Owns concurrency key for serializing pipeline runs per project; Phase 3's listener is idempotent on repeated `QUESTION_IMPACT_COMPLETED` events.

- **Inputs:** `QUESTION_IMPACT_COMPLETED` event from Phase 2 Answer Logging Pipeline
- **Outputs:** `Question.status = IMPACT_ASSESSED`, `Question.impactAssessment` populated
- **Business rules:**
  - Listener is idempotent: re-receiving the same `QUESTION_IMPACT_COMPLETED` for a question already in `IMPACT_ASSESSED` is a no-op.
  - If the pipeline failed validation upstream, it does NOT emit `QUESTION_IMPACT_COMPLETED`; the Phase 3 listener never runs and status stays at `ANSWERED`. Pipeline error surfacing is Phase 2's responsibility.
- **Files:** `src/lib/inngest/functions/question-impact-completed-listener.ts` (CREATE). Removed: `src/lib/inngest/functions/question-impact.ts`, `src/lib/inngest/functions/question-impact-assessment.ts`, `src/lib/agent-harness/tasks/question-impact.ts`.

Traces: REQ-DISC-008 → ADD-5.2.2-04, PRD-9-04, PRD-9-05, PRD-9-06 (delegated to Phase 2 per pipeline-first architecture)

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
- **Files:** New tool `src/lib/agent-harness/tools/tag-question-affects.ts`, `src/lib/agent-harness/tasks/transcript-processing.ts` (add tool to available tools), question form component, `src/actions/questions.ts` (add updateQuestionAffects action). NOTE: `question-impact.ts` is removed per §2.8; the tool is registered on the Phase 2 Answer Logging Pipeline task instead (cross-phase coordination).

Traces: REQ-DISC-009 → PRD-5-32, PRD-8-03, PRD-9-11

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

Traces: REQ-DISC-010 → PRD-8-16, PRD-8-18, ADD-5.3-04 (`get_discovery_gaps` consumer surface owned by Phase 2 freeform agent; Phase 3 produces the cached data)

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

Traces: REQ-DISC-011 → PRD-8-17

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

**Reasoning field (PRD-8-21):** Each row also includes a `reasoning: string` built from a templated format: `"Blocks {totalBlocks} work item(s): {blocksStories} stories, {blocksEpics} epics, {blocksFeatures} features. Asked {ageDays} day(s) ago. Owner: {owner}."` This populates the dashboard follow-up cards (REQ-DISC-013) so PRD-8-21 ("AI follow-up questions with reasoning") is satisfied without requiring a separate AI call.

Traces: REQ-DISC-012 → PRD-8-19, PRD-8-21

### 2.13 Complete Discovery Dashboard Sections (REQ-DISC-013)

- **What it does:** Adds the 3 missing sections and upgrades 2 degraded sections on the discovery dashboard to match all 7 PRD-specified sections (Section 8.4).
- **Sections to add:**
  1. **Recently Answered Questions + Impact** — Shows last 10 answered questions with their impact assessment summary and what changed.
  2. **Per-Epic Discovery Progress** — Visual progress bars per epic showing question coverage (answered/total) with gap severity indicators. Sourced from `cachedGapAnalysis`.
  3. **Unmapped Requirements** — Requirements with `status: CAPTURED` that aren't yet linked to epics/stories. Quick-link to map them.
  4. **Blocked Work Items** — Lists stories/epics/features currently blocked by open questions, sourced from `QuestionBlocksStory/Epic/Feature`. Component: `blocked-work-items.tsx`. Query joins blocking tables on questions with status in (`OPEN`, `SCOPED`, `OWNED`); rows: `workItemType`, `workItemDisplayId`, `blockingQuestionDisplayId`, `blockingQuestionText`, `ageDays`. Limit 25.
- **Sections to upgrade:**
  5. **Outstanding Questions** — Currently shows aggregate counts. Upgrade to per-scope breakdown with owner, age in days, and filtering by scope.
  6. **Follow-Up Recommendations** — Currently prose from briefing. Upgrade to structured question cards from the blocking-priority ranking (REQ-DISC-012), showing question ID, text, blocking count, owner, and `reasoning` field (PRD-8-21).
- **Section deferred to Phase 7:**
  7. **Project Health Score** — Owned by Phase 7 (PRD-17-16 inputs: stale questions >7 days, client-owned >3 days, blocked >5 days, active high-severity risks without mitigation). Phase 3 reserves a placeholder region in the dashboard layout that Phase 7 fills. No Phase 3 component or computation.
- **Business rules:**
  - Gap analysis and readiness assessment sections show cached results with "Last updated: {time}" and "Refresh" button.
  - If no gap analysis has been run, show a prompt: "Run your first gap analysis to see discovery coverage by epic."
  - The dashboard auto-refreshes on SWR polling (existing pattern), not on push.
- **Files:** `src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx`, new components in `src/components/dashboard/` including `blocked-work-items.tsx`.

Traces: REQ-DISC-013 → PRD-8-20, PRD-8-21, PRD-8-22, PRD-8-23, PRD-8-24; PRD-8-25 explicitly out of scope (deferred to Phase 7)

### 2.14 Answer Logging Pipeline Wiring + Question Embeddings (REQ-DISC-014)

- **What it does:** Wires the UI answer-submission path to the Phase 2 Answer Logging Pipeline (per Addendum v1 §2 pipeline-first lock and §5.2.2 Answer Logging stages) and enqueues question embeddings on create/update via Phase 11 infrastructure (per ADD-5.2.2-05).
- **Pipeline entry contract (Phase 2 publishes; Phase 3 consumes):**
  - Event name: `ANSWER_LOGGING_REQUESTED`
  - Payload: `{ projectId: string; userId: string; answerText: string; questionIdHint?: string; source: 'MANUAL' | 'CHAT' }` (per ADD-5.2.2-01)
  - Response: async. UI displays `Submitting…` until `QUESTION_IMPACT_COMPLETED` arrives via the existing notification channel (SSE/polling per Phase 2 pattern). On arrival, the §2.8 listener advances status and the UI refreshes the question detail view.
- **Embedding enqueue:**
  - On `question.create` and `question.update` where `questionText` or `answerText` changes, call `enqueueEmbedding({ entity: 'Question', id, content: <computed> })` (Phase 11 surface).
  - Compute `embeddingContentHash = hash({ questionText, answerText, scope })` and store on `Question.embeddingContentHash` (new field, see Task 1). Skip enqueue when hash unchanged. Status-only updates (e.g., `OPEN → SCOPED`) do not re-embed.
- **Duplicate-answer dedup (PRD-19-13):** If the question is already in `ANSWERED` status with `answeredAt` within the last 5 minutes, the `answerQuestion` server action returns 409 with `code: DUPLICATE_ANSWER_CONFLICT` and does NOT fire `ANSWER_LOGGING_REQUESTED`. Pipeline must also be defensive (Phase 2 owns final dedup). The duplicate condition surfaces a review banner on the question detail page.
- **Inputs:** UI answer-submission form, Question entity create/update events
- **Outputs:** `ANSWER_LOGGING_REQUESTED` Inngest event; `enqueueEmbedding` queue write; populated `embeddingContentHash`
- **Files:** `src/actions/questions.ts` (answerQuestion, createQuestion, updateQuestion), `src/lib/embeddings/enqueue.ts` (Phase 11 helper, consumed)

Traces: REQ-DISC-014 → ADD-5.2.2-01, ADD-5.2.2-02, ADD-5.2.2-05, PRD-4-04, PRD-8-07, PRD-8-15, PRD-19-13

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
    transcript-processing.ts            — MODIFY (add tag_question_affects tool)
    dashboard-synthesis.ts              — MODIFY (remove ESCALATED filter)
    gap-detection.ts                    — CREATE (new agent task)
    readiness-assessment.ts             — CREATE (new agent task)
    question-impact.ts                  — REMOVE (delegated to Phase 2 Answer Logging Pipeline per DECISION pipeline-first)
  tools/
    tag-question-affects.ts             — CREATE (new tool)
    create-question.ts                  — MODIFY (add source field from session context, require scope/scopeEpicId/scopeFeatureId per PRD-9-02)
src/lib/inngest/
  events.ts                             — MODIFY (add GAP_ANALYSIS_REQUESTED, READINESS_ASSESSMENT_REQUESTED). NOTE: ANSWER_LOGGING_REQUESTED and QUESTION_IMPACT_COMPLETED are owned/published by Phase 2; Phase 3 only sends/subscribes.
  functions/
    question-impact-assessment.ts       — REMOVE (legacy; replaced by Phase 2 pipeline)
    question-impact.ts                  — REMOVE (legacy; replaced by Phase 2 pipeline)
    question-impact-completed-listener.ts — CREATE (subscribes to QUESTION_IMPACT_COMPLETED, advances status, persists summary)
    gap-detection.ts                    — CREATE (new Inngest function)
    readiness-assessment.ts             — CREATE (new Inngest function)
src/lib/embeddings/
  enqueue.ts                            — CONSUME (Phase 11 surface; called from question create/update)
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
    blocked-work-items.tsx              — CREATE (lists work items blocked by open questions; PRD-8-23)
    blocking-priority-cards.tsx         — CREATE (structured follow-up recommendation cards w/ reasoning; PRD-8-21)
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
  source                 QuestionSource @default(MANUAL)
  embeddingContentHash   String?        // SHA-256 of {questionText, answerText, scope}; gates re-embed (REQ-DISC-014)
}
```

**QuestionAffects partial unique indexes (PRD-5-32, GAP-08):**
```sql
-- NULL columns do not enforce uniqueness in standard composite unique constraints in Postgres.
-- Two partial unique indexes guarantee no duplicate (questionId, epicId) or (questionId, featureId) rows.
CREATE UNIQUE INDEX question_affects_epic_only
  ON "QuestionAffects" ("questionId", "epicId")
  WHERE "featureId" IS NULL;

CREATE UNIQUE INDEX question_affects_feature_only
  ON "QuestionAffects" ("questionId", "featureId")
  WHERE "epicId" IS NULL;
```
Upsert paths in the `tag_question_affects` tool (Task 9) MUST query-then-create rather than rely on a single composite-key upsert, because Prisma's `upsert` cannot target the conditional partial index.

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
| Same question answered twice within 5 minutes (different users or pipeline replay) — PRD-19-13 | Second submission does NOT overwrite. `answerQuestion` returns 409 `code: DUPLICATE_ANSWER_CONFLICT` and does not fire the pipeline. Pipeline (Phase 2) records `duplicate_answer_conflict` on SessionLog and surfaces a review banner on the question detail page. Status stays `ANSWERED` pending human resolution. | 409 with code |
| Gap analysis runs on project with 0 epics | Return empty `epics[]` with `recommendation: "Define epics before running gap analysis."` Cache result. | N/A |
| Readiness AI call fails after context load (beyond `maxRetries=2`) | No cache update. Inngest function returns 502 to caller. Dashboard shows "Analysis failed, try again." | 502 |
| Manual `updateQuestionAffects` collides with in-flight AI `tag_question_affects` upsert | Both paths acquire `pg_advisory_xact_lock(hash('question_affects_'||questionId))` before mutating. Second waiter merges (does not full-replace AI-written records). | N/A — serialized |
| Question created at FEATURE scope with `scopeFeatureId = null` | `create_question` tool rejects with validation error before insert. UI form requires feature selection when scope = FEATURE. | 400 validation |
| Status-only update (e.g., OPEN → SCOPED) with unchanged questionText/answerText | Embedding enqueue is SKIPPED (hash unchanged). | N/A |

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
- [ ] `answerQuestion` server action fires `ANSWER_LOGGING_REQUESTED` (not a Phase-3-owned impact event); pipeline-first per Addendum v1 §2
- [ ] `question-impact-completed-listener` subscribes to `QUESTION_IMPACT_COMPLETED`, advances Question.status to `IMPACT_ASSESSED`, and persists `summary` to `Question.impactAssessment`
- [ ] Phase-3-owned `questionImpactFunction` and `questionImpactAssessmentFunction` files are deleted; Inngest registrations removed
- [ ] Duplicate-answer dedup: re-submission within 5 minutes returns 409 `DUPLICATE_ANSWER_CONFLICT` (PRD-19-13)
- [ ] `QuestionAffects` is populated by AI during transcript processing and impact assessment
- [ ] Gap detection analysis runs on demand and produces per-epic coverage data
- [ ] Readiness assessment runs on demand and produces per-epic readiness data
- [ ] Discovery dashboard shows 6 of 7 PRD-specified sections (Project Health Score deferred to Phase 7; Phase 3 reserves placeholder region)
- [ ] Blocked Work Items section renders up to 25 items, each showing work-item ID, blocking question ID, and age (PRD-8-23)
- [ ] Follow-up recommendation cards include `reasoning` string per PRD-8-21
- [ ] Discovery dashboard shows per-epic progress bars with gap severity indicators
- [ ] Question text validation rejects text shorter than 15 chars or matching `^(yes|no|tbd|\?+)$` (PRD-9-10)
- [ ] `create_question` tool rejects calls missing `scope` or required scope-id fields (PRD-9-02)
- [ ] `enqueueEmbedding` is called on question.create/update only when `embeddingContentHash` changes (PRD-8-07, ADD-5.2.2-05)
- [ ] Two partial unique indexes on `QuestionAffects` exist; `tag_question_affects` upsert never produces duplicates
- [ ] Voyage 50-pair quality test gating Phase 11 has been completed before Phase 3 merge (DECISION-03 carry-forward; embedding consumer)
- [ ] No regressions — existing question CRUD, search, and chat flows continue working

---

## 7. Open Questions

None — all scoping decisions resolved during deep dive.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 3`. All 14 gaps addressed. REVIEWED replaced with IMPACT_ASSESSED. Two impact assessment functions unified. Four new files created (gap detection, readiness assessment, tag-question-affects tool, blocking priority query). |
| 2026-04-14 | Wave 2 audit fixes | Applied 15 gap fixes per `docs/bef/audits/2026-04-13/phase-03-audit.md`. Resolves Wave 0 contradiction A: §2.8 collapsed to a status-advancement listener; Phase 2 Answer Logging Pipeline owns Stage 4 (cites pipeline-first lock per AUDIT_DECISIONS DECISION-01 derivation and Addendum v1 §2). Health Score deferred to Phase 7 (PRD-8-25). Blocked Work Items component added (PRD-8-23). PRD-9-10 clarity validation, PRD-9-02 scope-required, PRD-19-13 duplicate-answer 409, embedding hash gate, partial unique indexes for QuestionAffects, and reasoning field on follow-up cards added. New §2.14 wires the Answer Logging Pipeline contract. Trace lines added to all §2.x blocks. |
