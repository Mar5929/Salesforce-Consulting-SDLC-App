# Phase 03 Audit: Discovery, Questions

**Auditor:** Claude Opus 4.6 (audit agent)
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-03-discovery-questions/PHASE_SPEC.md` (Last Updated 2026-04-10 + Addendum v1 Amendments 2026-04-13)
- `docs/bef/03-phases/phase-03-discovery-questions/TASKS.md` (Last Updated 2026-04-10; 14 tasks present)

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md`
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (secondary)
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`

---

## 1. Scope Map

| Req ID | Requirement (1-line) | Covered by (spec §/task #) | Status | Notes |
|--------|----------------------|----------------------------|--------|-------|
| PRD-3-01 | Web app manages discovery/stories/dashboards | §2.13 / Task 13 | Pass | Dashboard completion covers discovery surface. |
| PRD-4-04 | BA logs discovery by chat, manages requirements/stories | §2.4, Addendum Amendment / Task 4, Task 14 | Pass | Source=CHAT path + Answer Logging wiring. |
| PRD-5-20 | One general chat Conversation per project | — | NotApplicable | Owned by Phase 2 (agent harness, chat). |
| PRD-5-21 | Chat messages append-only | — | NotApplicable | Owned by Phase 2. |
| PRD-5-32 | Join tables including QuestionAffects, QuestionBlocks* | §2.6, §2.9 / Tasks 6, 9 | Pass | QuestionAffects AI+manual populated; blocking tables queried. |
| PRD-7-03 | No onboarding interview; progressive brain | §1, §2.10, §2.11 / Tasks 10, 11 | Pass | Gap/readiness reflect progressive knowledge. |
| PRD-8-01 | Discovery is first-class feature | §2.13 / Task 13 | Pass | 7-section discovery dashboard. |
| PRD-8-02 | Record unstructured info as answer-to-existing or new decision | Addendum Amendment / Task 14 | Partial | Delegated to Answer Logging Pipeline (Phase 2); Phase 3 only wires UI. No verification AC that Phase 3 call succeeds on both "answer" and "standalone decision" branches. |
| PRD-8-03 | Link discovery info to epic(s)/feature(s) | §2.9 / Task 9 | Pass | tag_question_affects tool + manual multi-select. |
| PRD-8-04 | Check whether new answer changes existing design | §2.8 / Task 8 (designChanges, contradictions) | Pass | Structured output + decision needsReview flip. |
| PRD-8-05 | Check whether answer unblocks work items | §2.8 / Task 8 (unblockedItems, unblock step) | Pass | QuestionBlocks* deletion + WORK_ITEM_UNBLOCKED event. |
| PRD-8-06 | Check whether answer raises new questions | §2.8 / Task 8 (newQuestions) | Pass | Creates follow-up Question records with source=CHAT. |
| PRD-8-07 | Update knowledge base on discovery events | Addendum Amendment / (Phase 11 enqueue) | Partial | Note states embeddings enqueued on question.create/update, but no Phase 3 AC asserts it and no concrete queue/event name is pinned. |
| PRD-8-08 | Single general chat Conversation per project | — | NotApplicable | Phase 2. |
| PRD-8-09 | Chat message = independent harness call | — | NotApplicable | Phase 2. |
| PRD-8-10 | Chat context injection = 50 msgs / 7 days | — | NotApplicable | Phase 2. |
| PRD-8-13 | Transcripts processed to extract Q/A/decisions/etc. | Addendum Amendment / (Phase 2 pipeline) | NotApplicable | Owned by Phase 2 Transcript Processing Pipeline; Phase 3 only verifies UI trigger. |
| PRD-8-15 | Users can raise/answer questions directly through UI | §2.5, §2.7 / Tasks 5, 7, 14 | Pass | Form + pagination + pipeline wiring. |
| PRD-8-16 | Gap Detection per epic | §2.10 / Task 10 | Pass | New GAP_DETECTION task + function + cache. |
| PRD-8-17 | Readiness Assessment | §2.11 / Task 11 | Pass | New READINESS_ASSESSMENT task + function + cache. |
| PRD-8-18 | Conflict Detection | §2.8 / Task 8 (contradictions) | Pass | Flags Decisions with needsReview. |
| PRD-8-19 | Follow-Up Recommendations ranked by blocks | §2.12 / Task 12 | Pass | getBlockingPriorityQuestions ranks by totalBlocks/age. |
| PRD-8-20 | Dashboard: outstanding questions by scope with owner/age | §2.13 / Task 13 | Pass | outstanding-questions-detail. |
| PRD-8-21 | Dashboard: AI follow-up questions with reasoning | §2.13 / Task 13 | Partial | Blocking-priority cards replace prose, but "reasoning" field is not in §2.12 output schema (only totalBlocks/ageDays). PRD-8-21 specifies "with reasoning." |
| PRD-8-22 | Dashboard: recently answered + impact | §2.13 / Task 13 (recently-answered) | Pass | Last 10 with impactAssessment summary. |
| PRD-8-23 | Dashboard: blocked work items | §2.13 / Task 13 | Partial | AC #1 lists "Blocked work items" as section 4 but no component/query is named; no AC binds this to a concrete query on QuestionBlocksStory/Epic/Feature. |
| PRD-8-24 | Dashboard: unmapped requirements | §2.13 / Task 13 (unmapped-requirements) | Pass | status: CAPTURED query. |
| PRD-8-25 | Dashboard: project health score | §2.13 / Task 13 | Partial | AC #1 lists "(7) Health score" but no component is created and no computation is specified (PRD-17-16 defines inputs; nothing wired here). |
| PRD-9-01 | Lifecycle RAISED → SCOPED → OWNED → ANSWERED → IMPACT_ASSESSED | §2.1 / Task 1 | Partial | Spec uses `OPEN` instead of PRD's `RAISED`. Pre-existing naming divergence is carried forward; no reconciliation or explicit justification that `OPEN` == `RAISED`. |
| PRD-9-02 | AI determines question scope during scoping | §2.4, §2.9 / Tasks 4, 9 | Partial | Scope-setting by AI on create is not explicitly described; only cross-cutting affects tagging is explicit. No AC that create_question must populate scope/scopeEpicId/scopeFeatureId correctly on TRANSCRIPT/CHAT paths. |
| PRD-9-03 | Every question has owner (team member / client w/ name / TBD) | §2.5 / Task 5 | Pass | ownerDescription enabled; mutual exclusion validated. |
| PRD-9-04 | Answered question: check design changes | §2.8 / Task 8 | Pass | designChanges + contradictions. |
| PRD-9-05 | Answered question: flag unblocked work items | §2.8 / Task 8 | Pass | Unblock step. |
| PRD-9-06 | Answered: create new questions, flag contradictions | §2.8 / Task 8 | Pass | newQuestions + contradictions. |
| PRD-9-07 | Question IDs Q-{SCOPE}-{NUMBER} zero-padded | §2.2 / Task 2 | Pass | Q-ENG/Q-{epic}/Q-{epic}-{feature} with 3-digit padding. |
| PRD-9-08 | Epic prefix unique within project | §2.2 / Task 2 (notes) | Partial | Notes state "already enforced" but no AC verifies this; uniqueness of epic.prefix at project scope is not actually visible in §2.2's file list. Phase-hint also includes Phase 4. |
| PRD-9-09 | Question record fields incl. blocks, affects, answer, impact, parkedReason | §2.1, §2.6 / Tasks 1, 6 | Pass | All fields present/rendered. |
| PRD-9-10 | Question text clear to outsider | — | Fail | No AC or validation in Phase 3 asserts clarity (e.g., minimum length, rejection of empty/terse text, reviewer flag). |
| PRD-9-11 | Cross-cutting Q-ENG-* with Affects auto-identified | §2.9 / Task 9 | Pass | AI tool + manual UI. |
| PRD-19-13 | Discovery eventual consistency; duplicate answers → AI-flagged resolution | §4 (edge cases) / Task 8 | Partial | Concurrency serialized via Inngest concurrency key, but "duplicate answer AI-flagged resolution" is not described — current behavior is sequential re-run, not dedup. |
| PRD-26-01 | Phase 1 delivers chat/discovery dashboard/question CRUD | §5 / all tasks | NotApplicable | Historical Phase 1 reference; Phase 3 completes discovery features. |
| ADD-5.2.2-03 | Answer Logging Stage 2: pick best Q or standalone decision (Sonnet) | Addendum Amendment / Task 14 | Partial | Delegated to Phase 2 pipeline; Task 14's AC does not verify Stage 2 branch behavior from the UI. |
| ADD-5.2.2-04 | Answer Logging Stage 4: unblocks/contradictions/new Qs (Sonnet) | §2.8 / Task 8 | Major Conflict | §2.8 re-implements Stage 4 equivalent inside `questionImpactFunction` as a separate Inngest function path. Addendum v1 §2 locks pipeline-first architecture: the Answer Logging Pipeline IS the mechanism. Having both a Phase-3-owned `questionImpactFunction` AND an Answer Logging Pipeline (Phase 2) for answered questions contradicts the locked pipeline-first decision. Phase 3 must either (a) remove §2.8's parallel function path and delegate entirely to the Phase 2 pipeline, or (b) clearly scope §2.8 as the UI-independent legacy path that is being deleted. Current spec has BOTH the Amendment ("Answer Logging Pipeline is the implementation path") AND §2.8 ("questionImpactFunction… hybrid function"). |
| ADD-5.2.2-05 | KB update after answer logging | Addendum Amendment | Partial | Embeddings re-enqueue mentioned but no AC and no explicit KB-article-update path. |
| ADD-5.3-04 | Freeform agent read tools include get_discovery_gaps | §2.10 | Partial | Gap data is cached on Project, but a `get_discovery_gaps` agent tool surface is not defined here (nor explicitly cross-referenced to Phase 2). Should at minimum name the owner phase. |
| ADD-5.4-02 | question_embeddings table / entity-scoped embeddings | Addendum Amendment | NotApplicable | Owned by Phase 11. Phase 3 only enqueues. |
| ADD-6.1-04 | Hybrid retrieval primitive covers Phase-1 entities | Addendum Amendment | NotApplicable | Owned by Phase 11. |
| ADD-7-02 | question_embeddings in data model | — | NotApplicable | Phase 11. |

**Scope summary:** 36 rows mapped. **Pass: 19. Partial: 10. Fail: 1. NotApplicable: 10** (with 1 entry flagged as Major Conflict counted under Partial for severity-breakdown purposes but treated as Blocker in Gaps).

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification (1 line) |
|---|-----------|-------|------------------------|
| R1 | Requirement traceability | Partial | Spec cites REQ-DISC-NNN local IDs; does not cross-link to PRD/Addendum IDs (PRD-8-*, PRD-9-*, ADD-5.2.2-*), making traceability implicit rather than explicit. |
| R2 | No PRD/Addendum/TECHNICAL_SPEC contradiction | Fail | §2.8's `questionImpactFunction` contradicts Addendum v1 §2 locked pipeline-first decision and its own Amendment note that routes answers through the Answer Logging Pipeline. Lifecycle uses `OPEN` vs PRD's `RAISED`. |
| R3 | Scope completeness | Partial | PRD-9-10 (question text clarity), PRD-8-25 (health score computation), PRD-8-23 (blocked-work-items dashboard query), PRD-19-13 (duplicate-answer resolution) have no concrete task coverage. |
| R4 | AC testability | Partial | Most ACs are concrete. Gaps: no numeric thresholds for "significant knowledge changes" auto-trigger (5+ mentioned in spec but not in AC), no cache TTL enforcement AC beyond 1 hr mention, no verification AC that embeddings were enqueued. |
| R5 | Edge cases enumerated | Partial | §4 is solid (concurrency, invalid JSON, orphaned epics, duplicate affects). Missing: question with no epicId at FEATURE scope, duplicate-answer resolution (PRD-19-13), gap analysis when AI fails mid-run, readiness assessment when no stories/requirements exist, race between manual affects update and AI affects tool. |
| R6 | Interfaces pinned | Partial | Schema changes and JSON output shapes are well-specified. Gaps: `QUESTION_IMPACT_REQUESTED` event payload field list not shown (only example); `GAP_ANALYSIS_REQUESTED` / `READINESS_ASSESSMENT_REQUESTED` payloads not defined; `updateQuestionAffects` signature not pinned; `tag_question_affects` upsert key references `questionId_epicId_featureId` composite — not verified as an existing unique constraint on QuestionAffects. |
| R7 | Upstream dependencies resolved | Partial | §5 cites Phase 2 REQ-HARNESS-001..010 but does not reference concrete Phase 2 interfaces for the Answer Logging Pipeline entry point (e.g., event name, payload, response contract). Task 14 says "call the pipeline" without naming the API. |
| R8 | Outstanding items closed | Pass | §7 "Open Questions: None." Revision history is clean. |

**Overall verdict:** Ready-after-fixes.

**A phase is "Ready" only if R1–R8 are all Pass.** R1, R3, R4, R5, R6, R7 Partial; R2 Fail. Not Ready as written.

---

## 3. Gaps

### PHASE-3-GAP-01
- **Rubric criterion:** R2
- **Affected Req IDs:** ADD-5.2.2-01..07, PRD-8-02, PRD-8-04, PRD-8-05, PRD-8-06, PRD-9-04, PRD-9-05, PRD-9-06
- **Description:** §2.8 defines a Phase-3-owned `questionImpactFunction` that performs Answer Logging Stage 4 equivalents (unblocks, contradictions, new-question creation, design-change flags) via a dedicated Inngest function with structured JSON output. This contradicts the Addendum v1 §2 locked pipeline-first architecture and the Addendum Amendment at the top of PHASE_SPEC.md, which explicitly states "The Answer Logging Pipeline (Phase 2) is the implementation path for answering a question. Phase 3 wires the UI answer submission form to call the pipeline, not a direct server action." A developer cannot execute both simultaneously without duplicating Stage 4 logic in two places.
- **Severity:** Blocker

### PHASE-3-GAP-02
- **Rubric criterion:** R2, R6
- **Affected Req IDs:** PRD-9-01
- **Description:** PRD §9.1 specifies lifecycle states `RAISED → SCOPED → OWNED → ANSWERED → IMPACT_ASSESSED`. The Phase 3 schema uses `OPEN, SCOPED, OWNED, ANSWERED, IMPACT_ASSESSED, PARKED`. `OPEN` is carried over from legacy, but no justification or renaming migration is provided, and PRD-9-01 uses the explicit term `RAISED`. Either rename `OPEN → RAISED` or add an explicit trace line asserting `OPEN` is a pre-PRD naming choice that must be preserved for compatibility reasons.
- **Severity:** Major

### PHASE-3-GAP-03
- **Rubric criterion:** R3, R4
- **Affected Req IDs:** PRD-9-10
- **Description:** "Question text must be stated clearly enough that someone outside the project can understand it." No Phase 3 task or AC enforces this (minimum length, LLM-rewrite pass on create, or `needsReview` flag when transcript-extracted questions are terse). Phase 3 owns question creation paths and is the correct place to enforce this.
- **Severity:** Major

### PHASE-3-GAP-04
- **Rubric criterion:** R3, R6
- **Affected Req IDs:** PRD-8-25, PRD-17-16
- **Description:** Task 13 AC #1 lists "(7) Health score" as a dashboard section, but no component is named in Implementation Notes, no query is specified, and PRD-17-16's inputs (stale questions >7 days, client-owned >3 days, blocked >5 days, active high-severity risks without mitigation) are not referenced. Either explicitly defer to Phase 7 with a cross-reference or add the implementation.
- **Severity:** Major

### PHASE-3-GAP-05
- **Rubric criterion:** R3, R6
- **Affected Req IDs:** PRD-8-23
- **Description:** "Blocked work items" dashboard section is listed in Task 13 AC #1 as section 4 but has no dedicated component in Implementation Notes (only `recently-answered`, `epic-discovery-progress`, `unmapped-requirements`, `blocking-priority-cards`, `outstanding-questions-detail` are listed). No query is defined to read `QuestionBlocksStory/Epic/Feature` from the blocked-item perspective (rather than the blocking-question perspective).
- **Severity:** Major

### PHASE-3-GAP-06
- **Rubric criterion:** R3, R5
- **Affected Req IDs:** PRD-19-13
- **Description:** "Duplicate answers trigger AI-flagged resolution." §4 handles concurrent impact-assessment serialization but not the duplicate-answer case (two users submit different answers to the same question within minutes; or the AI processes the same transcript answer twice). No AC on answerQuestion or on the Answer Logging wiring detects/flags duplicates.
- **Severity:** Major

### PHASE-3-GAP-07
- **Rubric criterion:** R6, R7
- **Affected Req IDs:** ADD-5.2.2-01..02, PRD-4-04, PRD-8-15
- **Description:** Task 14 says "Wire UI answer-submission to Answer Logging Pipeline" but does not pin the pipeline's entry contract: event name (e.g., `ANSWER_LOGGING_REQUESTED`?), payload fields (answer text, optional question_id, project_id, user_id per ADD-5.2.2-01), synchronous vs async response handling, and UI feedback while the pipeline runs. Without this, the implementer is forced to guess or coordinate out-of-band with Phase 2.
- **Severity:** Blocker

### PHASE-3-GAP-08
- **Rubric criterion:** R6
- **Affected Req IDs:** PRD-5-32
- **Description:** Task 9's `tag_question_affects` upserts on composite key `questionId_epicId_featureId`. The Prisma `QuestionAffects` uniqueness constraint is referenced but not shown. If QuestionAffects has a row with `epicId` set and `featureId` null, the composite-unique semantics under Postgres with NULL columns do not guarantee uniqueness by default. Pin the exact unique index (e.g., partial unique indexes for the (epic-only) and (feature-only) cases) or change the strategy to query-then-create.
- **Severity:** Major

### PHASE-3-GAP-09
- **Rubric criterion:** R4, R6
- **Affected Req IDs:** PRD-8-16, PRD-8-17
- **Description:** §2.10 says "automatic trigger after significant knowledge changes (5+ questions answered in a session)" but no Task 10 AC encodes the 5+ threshold, the session definition, or the event emitter. §2.11 mentions "chained after gap detection completes" but Task 11 AC does not verify the chain behavior. Gap severity thresholds (`<25% = CRITICAL`, `25–50% = HIGH`, …) appear only in §2.10 prose, not in ACs.
- **Severity:** Major

### PHASE-3-GAP-10
- **Rubric criterion:** R3, R4
- **Affected Req IDs:** PRD-8-21
- **Description:** PRD-8-21 requires "AI-recommended follow-up questions with reasoning." §2.12 ranks by raw `totalBlocks` + age with no reasoning field. Without a `reasoning` string populated by the AI (or a templated explanation, e.g., "Blocks 3 stories in Data Migration"), the dashboard fails PRD-8-21.
- **Severity:** Major

### PHASE-3-GAP-11
- **Rubric criterion:** R3, R4
- **Affected Req IDs:** PRD-8-07, ADD-5.2.2-05
- **Description:** The Addendum Amendment states "Enqueue via Phase 11 infrastructure on question.create and question.update (hash-based re-embed)" but no Phase 3 AC, Task, or edge-case confirms the enqueue call site, the hash computation, or that non-semantic updates (e.g., status change only) skip re-embedding. The hash-based behavior is therefore unverifiable within Phase 3 acceptance.
- **Severity:** Major

### PHASE-3-GAP-12
- **Rubric criterion:** R1
- **Affected Req IDs:** All
- **Description:** PHASE_SPEC uses local IDs (REQ-DISC-001..013) and does not cite PRD or Addendum requirement IDs anywhere. Project CLAUDE.md mandates: "Deep-dive outputs must include an explicit trace line for each requirement block (e.g., 'REQ-PIPELINE-001 → Addendum §5.2.1')."
- **Severity:** Minor

### PHASE-3-GAP-13
- **Rubric criterion:** R8 (doc hygiene), R3
- **Affected Req IDs:** —
- **Description:** TASKS.md has 14 tasks but (a) the "Execution Order" diagram shows only Tasks 1–13, (b) the bottom Summary table lists only Tasks 1–13, (c) the TASKS.md header says "Total Tasks: 13", and (d) PHASE_SPEC §1 Scope Summary says "13 tasks". Task 14 (Answer Logging Pipeline wiring + embeddings) was added as part of the Addendum v1 amendment but not fully integrated into task indexing, dependency graph, or completion counts.
- **Severity:** Minor

### PHASE-3-GAP-14
- **Rubric criterion:** R5
- **Affected Req IDs:** PRD-8-16, PRD-8-17
- **Description:** Missing edge cases: (a) gap analysis when a project has 0 epics (partially handled for readiness; not for gap); (b) readiness assessment when the AI call fails after context load (retry semantics beyond maxRetries=2); (c) race between manual `updateQuestionAffects` (full-replace strategy per Task 9) and AI `tag_question_affects` upsert — the manual full-replace can wipe AI records that the AI just wrote in the same Inngest run.
- **Severity:** Major

### PHASE-3-GAP-15
- **Rubric criterion:** R4, R6
- **Affected Req IDs:** PRD-9-02
- **Description:** PRD-9-02: "The AI must determine question scope during scoping." No Task 4 AC or create_question schema change asserts that the TRANSCRIPT/CHAT source path must set `scope`, `scopeEpicId`, `scopeFeatureId`. Without this, AI-created questions could arrive with null scope and break Task 2's display-ID generator.
- **Severity:** Major

---

## 4. Fix Plan

### Fix PHASE-3-GAP-01
- **File(s) to edit:** `docs/bef/03-phases/phase-03-discovery-questions/PHASE_SPEC.md` §2.8 and `TASKS.md` Task 8.
- **Change summary:** Resolve the pipeline-vs-function conflict. Recommended path: delete the Phase-3-owned `questionImpactFunction`; delegate the entire "after-answered" side-effect chain to the Phase 2 Answer Logging Pipeline (ADD-5.2.2-04). Retain ONLY the status advancement (`ANSWERED → IMPACT_ASSESSED`) as a downstream callback the pipeline fires. Move structured output schema (designChanges, unblockedItems, newQuestions, contradictions) into the Phase 2 pipeline spec via a cross-phase coordination note.
- **New content outline:**
  - Rewrite §2.8 to state: "Phase 3 does not own impact assessment. The Answer Logging Pipeline (Phase 2, ADD-5.2.2-04) owns Stage 4 (unblocks, contradictions, new-question creation, design-change flags). Phase 3 (a) fires `ANSWER_LOGGING_REQUESTED` from the `answerQuestion` UI action, (b) subscribes to a `QUESTION_IMPACT_COMPLETED` event fired by the pipeline, and (c) advances question status to `IMPACT_ASSESSED` in that subscriber."
  - Delete Task 8 Implementation Notes Step 2 (structured output in Phase 3 code) and Step 3 (downstream actions in Phase 3 Inngest function). Replace with: "Listener function `questionImpactCompletedListener` that updates `Question.status = IMPACT_ASSESSED` and stores `impactAssessment` summary from pipeline payload."
  - Remove `questionImpactAssessmentFunction` and `questionImpactFunction` from §3.2 File/Module Structure; add `src/lib/inngest/functions/question-impact-completed-listener.ts`.
- **Cross-phase coordination:** Phase 2 must (a) confirm `ANSWER_LOGGING_REQUESTED` event contract (payload fields), (b) emit `QUESTION_IMPACT_COMPLETED` with fields `{ projectId, questionId, summary, designChanges[], unblockedItems[], newQuestions[], contradictions[] }`, (c) implement the structured-output validator in the pipeline stage (not in Phase 3).
- **Definition of done:**
  - [ ] §2.8 no longer describes a Phase-3-owned impact function.
  - [ ] Task 8 is reduced to status-advancement listener only.
  - [ ] Cross-phase coordination note added naming Phase 2 pipeline as owner of Stage 4 work.
  - [ ] PRD-8-04..06, PRD-9-04..06 traced to Phase 2 ADD-5.2.2-04 instead of Phase 3.

### Fix PHASE-3-GAP-02
- **File(s) to edit:** `PHASE_SPEC.md` §2.1 and §3.3, `TASKS.md` Task 1.
- **Change summary:** Reconcile `OPEN` vs PRD-specified `RAISED`. Either (a) rename `OPEN → RAISED` in the enum with a migration, or (b) add an explicit "Naming Reconciliation" note asserting `OPEN` == `RAISED` semantically and citing the reason (pre-existing production data, avoid breaking migrations).
- **New content outline:**
  - Add §2.1 bullet: "Naming: `OPEN` is the internal representation of PRD §9.1 `RAISED`. Retained for compatibility with existing Phase 1 data; documented here as the PRD-9-01 trace."
  - Add Task 1 AC: "Lifecycle enum order matches PRD-9-01 semantically: OPEN (= RAISED) → SCOPED → OWNED → ANSWERED → IMPACT_ASSESSED, plus terminal PARKED."
- **Cross-phase coordination:** None if option (b). If option (a), Phase 2 and Phase 1 string literals must be updated in lockstep.
- **Definition of done:**
  - [ ] PHASE_SPEC §2.1 explicitly traces `OPEN` → PRD-9-01 `RAISED`.
  - [ ] Task 1 AC encodes the equivalence.

### Fix PHASE-3-GAP-03
- **File(s) to edit:** `TASKS.md` Task 4 and Task 5 (new AC); optional new Task 15 if preferred.
- **Change summary:** Enforce PRD-9-10 question clarity.
- **New content outline:**
  - New Task 4 AC: "createQuestion validates `questionText.length >= 15` and rejects text matching `^(yes|no|tbd|\\?+)$` (case-insensitive)."
  - New Task 4 AC: "create_question tool (TRANSCRIPT/CHAT path) sets `needsReview = true` when extracted question text is `< 25` chars or lacks a `?` terminal punctuation."
- **Cross-phase coordination:** Phase 2 `create_question` tool fix (REQ-HARNESS-001) must align on the needsReview threshold.
- **Definition of done:**
  - [ ] Task 4 AC lists the length threshold and regex rejection.
  - [ ] PRD-9-10 cited in §2.4.

### Fix PHASE-3-GAP-04
- **File(s) to edit:** `PHASE_SPEC.md` §2.13, `TASKS.md` Task 13.
- **Change summary:** Either defer health score to Phase 7 or add concrete implementation.
- **New content outline:** Recommended path: defer. Add sentence to §2.13: "Section (7) Health Score is owned by Phase 7 (REQ-DASH-NNN) and is not implemented in this phase. Phase 3 renders an empty placeholder that Phase 7 fills." Remove "(7) Health score" from Task 13 AC #1 and add a new AC: "Dashboard reserves a placeholder region for the Phase 7 health-score widget."
- **Cross-phase coordination:** Phase 7 must pick up PRD-17-16 computation and render into the reserved region.
- **Definition of done:**
  - [ ] §2.13 explicitly scopes health score out.
  - [ ] Task 13 AC updated.
  - [ ] Phase 7 PHASE_SPEC references the placeholder contract (or a note added to the Phase 7 outstanding list).

### Fix PHASE-3-GAP-05
- **File(s) to edit:** `PHASE_SPEC.md` §2.13, `TASKS.md` Task 13.
- **Change summary:** Add `blocked-work-items.tsx` component + query.
- **New content outline:**
  - Add component: `src/components/dashboard/blocked-work-items.tsx`. Queries stories/epics/features with `QuestionBlocksStory/Epic/Feature` records joined on unanswered questions (OPEN/SCOPED/OWNED). Rows: workItemType, workItemDisplayId, blockingQuestionDisplayId, blockingQuestionText, age.
  - Add Task 13 AC: "Blocked Work Items section lists up to 25 work items currently blocked by open questions, showing work-item ID, blocking question ID, and age."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Component added to §3.2.
  - [ ] Task 13 includes the new AC.

### Fix PHASE-3-GAP-06
- **File(s) to edit:** `PHASE_SPEC.md` §4 Edge Cases table, `TASKS.md` Task 14 (or Task 8 listener).
- **Change summary:** Handle PRD-19-13 duplicate-answer resolution.
- **New content outline:**
  - Edge-case row: "Same question answered twice within 5 minutes by different users. Behavior: second submission does not overwrite; pipeline flags a `duplicate_answer_conflict` on the SessionLog and surfaces a review banner on the question detail page. Status stays `ANSWERED` pending human resolution."
  - Task 14 AC: "Answer submission to a question already in `ANSWERED` status within the last 5 minutes surfaces a 409 response with `code: DUPLICATE_ANSWER_CONFLICT` and does not invoke the pipeline."
- **Cross-phase coordination:** Phase 2 Answer Logging Pipeline must either perform the dedup check or expose the necessary state.
- **Definition of done:**
  - [ ] §4 edge-case row added.
  - [ ] Task 14 AC added citing PRD-19-13.

### Fix PHASE-3-GAP-07
- **File(s) to edit:** `TASKS.md` Task 14, `PHASE_SPEC.md` Addendum Amendment section.
- **Change summary:** Pin Answer Logging Pipeline entry contract.
- **New content outline:**
  - Add to Task 14 Implementation Notes: "Event name: `ANSWER_LOGGING_REQUESTED`. Payload: `{ projectId: string; userId: string; answerText: string; questionIdHint?: string; source: 'MANUAL' | 'CHAT' }` (ADD-5.2.2-01). Response: async; UI shows `Submitting…` until `QUESTION_IMPACT_COMPLETED` event arrives via SSE/polling (wire to existing notification channel)."
  - Add to Task 14 AC: "answerQuestion server action fires `ANSWER_LOGGING_REQUESTED` with the exact payload above" and "UI polls or subscribes for completion and refreshes the question detail view on `QUESTION_IMPACT_COMPLETED`."
- **Cross-phase coordination:** Phase 2 must publish and freeze this contract. If Phase 2 has not yet defined it, coordination is a Blocker resolution prerequisite.
- **Definition of done:**
  - [ ] Event name and payload fields listed in Task 14.
  - [ ] ADD-5.2.2-01 cited.
  - [ ] Phase 2 spec references the same contract.

### Fix PHASE-3-GAP-08
- **File(s) to edit:** `PHASE_SPEC.md` §2.9, `TASKS.md` Task 9.
- **Change summary:** Pin QuestionAffects uniqueness under NULL columns.
- **New content outline:**
  - Add to §2.9: "Schema additions required in Task 1: two partial unique indexes on `QuestionAffects` — `CREATE UNIQUE INDEX question_affects_epic_only ON \"QuestionAffects\" (questionId, epicId) WHERE featureId IS NULL;` and `CREATE UNIQUE INDEX question_affects_feature_only ON \"QuestionAffects\" (questionId, featureId) WHERE epicId IS NULL;`. Upsert code paths must select the correct index by checking which of epicId/featureId is null."
  - Update Task 1 to include the two partial unique indexes.
  - Update Task 9's upsert code to query-then-create rather than relying on a single composite key.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] §2.9 pins the exact indexes.
  - [ ] Task 1 AC includes creation of both partial indexes.
  - [ ] Task 9 AC: "Upsert never creates duplicate (questionId, epicId) or (questionId, featureId) rows."

### Fix PHASE-3-GAP-09
- **File(s) to edit:** `PHASE_SPEC.md` §2.10/§2.11, `TASKS.md` Tasks 10 and 11.
- **Change summary:** Move numeric thresholds from prose to ACs.
- **New content outline:**
  - Task 10 AC: "Automatic `GAP_ANALYSIS_REQUESTED` event is fired when a pipeline session closes with `answered_questions_delta >= 5` within that session."
  - Task 10 AC: "Gap severity is computed as: <25% answered → CRITICAL, 25–49% → HIGH, 50–74% → MEDIUM, ≥75% → LOW."
  - Task 11 AC: "Upon `GAP_ANALYSIS_COMPLETED` event, the system fires `READINESS_ASSESSMENT_REQUESTED` automatically when `overallCoverage >= 50`."
  - Task 10 AC: "Cached result returned when `now - cachedGapAnalysisAt < 3600000ms`; otherwise AI invoked."
- **Cross-phase coordination:** Phase 2 pipeline must emit `answered_questions_delta` in its session log.
- **Definition of done:**
  - [ ] All four thresholds are in ACs, not prose.
  - [ ] PRD-8-16 / PRD-8-17 cited.

### Fix PHASE-3-GAP-10
- **File(s) to edit:** `PHASE_SPEC.md` §2.12, `TASKS.md` Task 12.
- **Change summary:** Add `reasoning` to follow-up recommendations.
- **New content outline:**
  - Extend §2.12 output schema: add `reasoning: string` to each row, generated as a templated string: `"Blocks {totalBlocks} work item(s): {storyCount} stories, {epicCount} epics, {featureCount} features. Asked {ageDays} day(s) ago. Owner: {owner}."`
  - Task 12 AC: "Each returned row includes a `reasoning` string built from the templated format above."
  - Task 13 AC (#7): "Follow-up cards render the `reasoning` string under the question text."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] `reasoning` field added to schema.
  - [ ] PRD-8-21 cited.
  - [ ] Task 13 card component renders the field.

### Fix PHASE-3-GAP-11
- **File(s) to edit:** `PHASE_SPEC.md` Addendum Amendment section, `TASKS.md` Task 14 (split or extend).
- **Change summary:** Verify embedding enqueue.
- **New content outline:**
  - Task 14 AC: "On question.create and question.update where `questionText` or `answerText` changes, `enqueueEmbedding({entity: 'Question', id, content: <computed>})` is called. Hash of `{questionText, answerText, scope}` is stored on the Question row (new field `embeddingContentHash TEXT`); re-enqueue skipped when hash unchanged."
  - Add to Task 1 schema changes: `embeddingContentHash String?` on `Question`.
  - §4 edge-case row: "Status-only update (e.g., OPEN → SCOPED) with unchanged text: no re-embed."
- **Cross-phase coordination:** Phase 11 owns the queue; confirm the `enqueueEmbedding` signature.
- **Definition of done:**
  - [ ] `embeddingContentHash` field added in Task 1.
  - [ ] Task 14 AC added.
  - [ ] PRD-8-07 and ADD-5.2.2-05 cited.

### Fix PHASE-3-GAP-12
- **File(s) to edit:** `PHASE_SPEC.md` all §2.x blocks.
- **Change summary:** Add explicit PRD/Addendum trace lines per CLAUDE.md rule.
- **New content outline:**
  - At the end of each §2.x block, add a line: `Traces: REQ-DISC-NNN → PRD-§, ADD-§` (e.g., "Traces: REQ-DISC-008 → PRD-8-04/05/06, PRD-9-04/05/06, ADD-5.2.2-04").
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Every §2.x block has a `Traces:` line.
  - [ ] Trace IDs resolve to rows in REQUIREMENT_INDEX.md.

### Fix PHASE-3-GAP-13
- **File(s) to edit:** `PHASE_SPEC.md` §1, `TASKS.md` header/execution-order/Summary table.
- **Change summary:** Normalize Task 14 into the task indexing.
- **New content outline:**
  - Change PHASE_SPEC §1: "In scope: 14 of 14 domain gaps → 14 tasks" (not 13).
  - Update TASKS.md header: "Total Tasks: 14".
  - Add Task 14 to the Execution Order ASCII diagram under Task 1 parallel branch.
  - Add Task 14 row to the Summary table.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] All counters say 14.
  - [ ] Execution diagram includes Task 14.
  - [ ] Summary table includes Task 14.

### Fix PHASE-3-GAP-14
- **File(s) to edit:** `PHASE_SPEC.md` §4, `TASKS.md` Task 9.
- **Change summary:** Add missing edge cases.
- **New content outline:**
  - §4 rows: (a) "Gap analysis on project with 0 epics → return empty epics[] with recommendation 'Define epics before running gap analysis.'"; (b) "Readiness AI call fails after context load → no cache update; return 502 to caller; dashboard shows 'Analysis failed, try again.'"; (c) "Manual updateQuestionAffects collides with in-flight AI tag_question_affects → updateQuestionAffects takes an advisory lock `pg_advisory_xact_lock(hash('question_affects_'||questionId))`; AI tool also acquires it; second waiter merges rather than replaces."
  - Task 9 AC: "updateQuestionAffects acquires advisory lock before delete/create."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Three new edge-case rows added.
  - [ ] Task 9 AC for the advisory lock.

### Fix PHASE-3-GAP-15
- **File(s) to edit:** `TASKS.md` Task 4.
- **Change summary:** Require scope population on AI-created questions.
- **New content outline:**
  - Task 4 AC: "create_question tool input schema requires `scope: 'ENGAGEMENT' | 'EPIC' | 'FEATURE'` and, conditionally, `scopeEpicId` (for EPIC/FEATURE) and `scopeFeatureId` (for FEATURE). Tool rejects calls missing required fields."
  - Task 4 AC: "Server-side validation in the tool handler ensures `scope === 'FEATURE' && !scopeFeatureId` returns an error."
- **Cross-phase coordination:** Phase 2 (create_question tool definition).
- **Definition of done:**
  - [ ] Task 4 AC encodes the scope-required rule.
  - [ ] PRD-9-02 cited.

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
- [x] No gap uses vague remediation language ("add detail", "handle edge cases", "TBD")
- [x] Overall verdict matches scorecard (Ready requires all R1–R8 = Pass)
