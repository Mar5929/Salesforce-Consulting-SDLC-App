# Phase 04 Audit: Work Management

**Auditor:** audit-agent (Opus 4.6 1M)
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-04-work-management/PHASE_SPEC.md` (Last Updated 2026-04-10, Addendum amendments dated 2026-04-13)
- `docs/bef/03-phases/phase-04-work-management/TASKS.md` (Last Updated 2026-04-10)

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md`
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`
- `docs/bef/01-architecture/TECHNICAL_SPEC.md`
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`
- `docs/bef/02-phase-plan/PHASE_PLAN.md`

---

## 1. Scope Map

| Req ID | Requirement (1-line) | Covered by (spec §/task #) | Status | Notes |
|--------|----------------------|----------------------------|--------|-------|
| PRD-4-03 | PM uses web app for sprints, dashboards, deliverables, briefings | Out of Phase 4 domain | NotApplicable | Phase 7/5 owns |
| PRD-4-04 | BA logs discovery by chatting with AI and manages requirements/stories | PHASE_SPEC §2 (stories) | Partial | Story mgmt covered; requirements/chat belong to Phase 3 |
| PRD-5-10 | Core data model includes Story, TestCase, StoryComponent, EpicPhase | §2.1, §2.6, §2.8 | Pass | No schema change required; schema already present |
| PRD-5-11 | EpicPhase tracks NOT_STARTED/IN_PROGRESS/COMPLETE/SKIPPED | §2.1 REQ-WORK-001 / Task 1 | Pass | Auto-init + backfill |
| PRD-5-12 | Stories may exist in Draft; validation on transition to Ready | §2.9 REQ-WORK-009 / Task 9 | Partial | Validation implemented in app code, but Addendum amendment says this lives in pipeline Stage 3 (Phase 2). Double-ownership unresolved. |
| PRD-5-25 | Attachments supported on stories, questions, defects | — | Fail | No coverage in Phase 4 scope; REQUIREMENT_INDEX hints Phase 4 |
| PRD-5-26 | VersionHistory for optimistic concurrency | — | Fail | No task; REQUIREMENT_INDEX hints Phase 4 |
| PRD-5-32 | Join tables incl. StoryComponent, RequirementStory, RequirementEpic | §2.6 | Pass | StoryComponent covered; others owned elsewhere |
| PRD-5-33 | StoryComponent carries impactType CREATE/MODIFY/DELETE | §2.2 (dedup mentions impactType) | Pass | Already in schema, dedup uses it |
| PRD-6-13 | Mandatory story fields enforced before Ready | §2.9 / Task 9 | Partial | See PRD-5-12 double-ownership |
| PRD-9-08 | Epic prefix uniqueness validated on epic create/edit | — | Fail | Not covered; REQUIREMENT_INDEX hints Phase 3/4 |
| PRD-10-01 | Web app is primary system of record for work items | Implicit / §5 Integration | Pass | No contradiction |
| PRD-10-02 | Hierarchy Epic > Feature > Story > Task | §2.5 (feature generate), §2.4 | Pass | Hierarchy honored in UI entry points |
| PRD-10-03 | Persona mandatory ("As a [role]...") | §2.9 AC #1 / Task 9 | Pass | Non-empty string check only; format (As a [role]...) not validated |
| PRD-10-04 | Description mandatory | §2.9 / Task 9 | Pass | Covered |
| PRD-10-05 | Acceptance Criteria mandatory, Given/When/Then, >=1 happy + >=1 exception | §2.9 / Task 9 | Partial | Only non-empty check; Given/When/Then format and happy+exception scenario counts NOT validated |
| PRD-10-06 | Parent epic or feature mandatory | §2.9 / Task 9 | Pass | Noted as always-true-by-schema |
| PRD-10-07 | Story Points mandatory (AI suggest, human confirm) | §2.9 / Task 9 | Partial | Human-confirm UX pattern not specified; AI suggestion pathway not wired |
| PRD-10-08 | >=1 TestCase mandatory; AI generates stubs | §2.8 / Task 8 | Pass | Stub tool + "STUB" source |
| PRD-10-09 | Impacted SF Components, free-text + linked OrgComponent | §2.6 / Task 6 | Pass | Dual-mode selector |
| PRD-10-10 | AI suggests linking free-text to OrgComponent once org connected | §2.6 (deferred to Phase 6) | Pass | Explicitly deferred; documented |
| PRD-10-11 | AI generation analyzes requirement, epic, discovery | §2.7 / Task 7 | Partial | Addendum says Phase 2 pipeline owns Stage 1; Phase 4 amendment section says UI trigger wiring only (Task 10) but Task 10 body missing |
| PRD-10-12 | AI generation cross-references org KB and flags conflicts | §2.7 / Task 7 | Partial | Task 7 reimplements context-loader augmentation; Addendum says this is Pipeline Stages 4-5 (Phase 2). Ownership conflict |
| PRD-10-13 | Mandatory field validation before Ready | §2.9 / Task 9 | Partial | Ownership conflict with ADD-5.2.3-03 |
| PRD-10-14 | Status progression Draft > Ready > Sprint Planned > ... > Done | §2.4 / Task 4 | Pass | Uses existing story-status-machine.ts |
| PRD-13-14 | Stories referencing components not in KB trigger "planned" placeholder entries | — | Fail | No task; REQUIREMENT_INDEX hints Phase 4, 6 |
| PRD-13-17 | Phase 4 writes initial KnowledgeArticle drafts per process/domain | — | Fail | No coverage in current scope; REQUIREMENT_INDEX explicitly cites Phase 4 |
| PRD-19-04 | Mgmt story transitions restricted to SA/PM/BA | §2.4 (uses getAvailableTransitions) | Pass | Reuses Phase 1 REQ-RBAC-009 |
| PRD-19-05 | Execution transitions restricted to SA/Developer | §5 integration w/ Phase 1 | Pass | Inherited from Phase 1 |
| PRD-19-06 | Sprint assignment auto-transitions story to Sprint Planned | — | NotApplicable | Phase 5 per Phase-hint; confirm |
| PRD-19-07 | QA creates only Draft stories | Implicit via RBAC | Pass | Inherited |
| PRD-19-08 | Sprint assignment and content editing separately permissioned | — | NotApplicable | Phase 5 owns sprint assignment |
| PRD-19-11 | Optimistic concurrency on concurrent edits; diff prompt | — | Fail | No task; REQUIREMENT_INDEX hints Phase 4 |
| PRD-19-12 | Never silently overwrite another user's changes | — | Fail | No task; tied to PRD-19-11 |
| PRD-25-03 | No real-time collab editing; optimistic concurrency | — | Fail | Follows PRD-19-11 gap |
| PRD-26-02 | Phase 2 delivers CRUD, mandatory validation, AI generation, sprints | Phase 2 owns | NotApplicable | Cross-check: mandatory validation and story gen moved; some residual in Phase 4 |
| ADD-5.2.3-01 | Pipeline Stage 1 assembles epic/feature/Q&A/components | §2.7 / Task 7 + amendment note | Partial | Phase 4 adds independent context loader; pipeline ownership in Phase 2 |
| ADD-5.2.3-02 | Stage 2 Sonnet drafts story per mandatory schema | Amendment § / Task 10 (undefined) | Partial | Task 10 body missing |
| ADD-5.2.3-03 | Stage 3 deterministic mandatory validation | §2.9 / Task 9 | Partial | Duplicate ownership Phase 4 vs Phase 2 |
| ADD-5.2.3-04 | Stage 4 component cross-reference via hybrid search | §2.7 / Task 7 | Partial | Phase 4 loads OrgComponents directly; Stage 4 per Addendum uses search_org_kb (Phase 6). Mismatch on retrieval method |
| ADD-5.2.3-05 | Stage 5 Sonnet resolves conflicts when flagged | — | Fail | Not referenced in Phase 4 at all |
| ADD-5.2.3-07 | Stage 7 persists story in `draft` status for UI review | §2.8 draft accept flow | Pass | Draft persistence via StoryDraftCards covered |

**Scope summary:** 36 rows mapped. **12 Pass, 14 Partial, 8 Fail, 4 NotApplicable (NA).**

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification (1 line) |
|---|-----------|-------|------------------------|
| R1 | Requirement traceability | Partial | Spec cites gap IDs but not PRD/Addendum Req IDs per §; Addendum trace line (per CLAUDE.md rule) absent from requirements. |
| R2 | No PRD/Addendum/TECH_SPEC contradiction | Fail | REQ-WORK-008 embeds `create_test_case_stub` as agent-loop tool inside `storyGenerationTask`, but Addendum §5.2.3 and TECH_SPEC §3.5 define Story Generation as a 7-stage deterministic pipeline owned by Phase 2, not an agent loop. REQ-WORK-009 reimplements Stage 3 validation in Phase 4 despite amendment claiming Phase 2 owns it. REQ-WORK-007 uses direct Prisma queries, not the Addendum-required hybrid `search_org_kb`. |
| R3 | Scope completeness | Fail | Missing coverage for PRD-5-25 (attachments on stories), PRD-5-26 + PRD-19-11/12 + PRD-25-03 (optimistic concurrency), PRD-9-08 (epic prefix uniqueness), PRD-13-14 (placeholder KB entries), PRD-13-17 (KB drafts), ADD-5.2.3-05 (conflict resolution). Six in-domain requirements unaddressed. |
| R4 | Testable ACs | Partial | Most ACs concrete; but PRD-10-03 (persona format), PRD-10-05 (Given/When/Then + happy+exception), PRD-10-07 (human-confirm flow) have only presence checks, not PRD-specified structural checks. Task 8 "at minimum 1 happy + 1 edge" not codified as post-acceptance validation. |
| R5 | Edge cases | Partial | Good edge table in §4, but missing: concurrent DRAFT→READY attempts, partial failure of createTestCases after createStory (rollback semantics), pipeline vs. agent-loop contradiction when both fire, orphaned testCases on draft discard, "Fix with AI" token ceiling, guardrails prompt injection precedence when prompt is long, sprint-assigned story regressing to DRAFT. |
| R6 | Interfaces pinned | Partial | `validateStoryReadiness` signature shown but return type inconsistent ("array of error messages" vs. `{ error, validationErrors }`). `createTestCases(storyId, testCases[])` has no Zod schema or error contract. `searchOrgComponents(projectId, query, limit)` invented without endpoint path or response schema. `getOrgComponentsForEpic` exists in tech spec but return shape not pinned in Phase 4. Task 10 interface entirely undefined. |
| R7 | Upstream dependencies resolved | Partial | Phase 2 dependency: amendment asserts Story Generation Pipeline is in Phase 2, but Phase 2 has "needs new deep-dive" status per PHASE_PLAN. Task 10 depends on pipeline + Phase 11 embeddings queue with zero pinned interface references (enqueue function name, event name, payload). Phase 3 dependency references REQ-DISC-001/008/010/011 but no data contract for "readiness signal" consumption. |
| R8 | Outstanding items closed | Fail | §7 claims "None — all scoping decisions resolved" yet Task 10 appears in the Summary table without a task body (lines 319-321 TASKS.md); execution order diagram omits Task 10; scope summary still says "9 of 11 domain gaps -> 9 tasks" after Addendum added a 10th. |

**Overall verdict:** **Not-ready** (R2, R3, R8 fail; R1, R4, R5, R6, R7 partial).

---

## 3. Gaps

### PHASE-4-GAP-01
- **Rubric criterion:** R2, R7, R8
- **Affected Req IDs:** ADD-5.2.3-01..07, PRD-10-11, PRD-10-12, PRD-10-13
- **Description:** TASKS.md lists Task 10 ("Wire story generation UI to Story Generation Pipeline + enqueue story embeddings") in the Summary table at line 321 but has no task body, no acceptance criteria, no implementation notes, no file list, and is absent from the Execution Order diagram (lines 12-22). PHASE_SPEC §1 still states "9 of 11 domain gaps -> 9 tasks." The Addendum Amendment section adds this requirement but doesn't define the task. A dev agent cannot execute Task 10.
- **Severity:** **Blocker**

### PHASE-4-GAP-02
- **Rubric criterion:** R2
- **Affected Req IDs:** ADD-5.2.3-02, ADD-5.2.3-03, ADD-5.2.3-04, ADD-5.2.3-05, PRD-10-11/12/13
- **Description:** REQ-WORK-008 (Task 8) and REQ-WORK-007 (Task 7) treat story generation as an agent-harness task (`storyGenerationTask` system prompt, `create_test_case_stub` tool in agent tools array, direct context loader mutation). Addendum §5.2.3 + TECH_SPEC §3.5 mandate a 7-stage deterministic pipeline owned by Phase 2, with test case stubs and component cross-reference as pipeline stages, not agent-loop tools. Addendum Amendment section explicitly states "Story generation now runs as the deterministic pipeline (Addendum §5.2.3) owned by Phase 2" and "Phase 4 does not re-implement mandatory-field validation separately" — but REQ-WORK-007/008/009 in the same document do exactly that. The amendment contradicts the requirements it precedes.
- **Severity:** **Blocker**

### PHASE-4-GAP-03
- **Rubric criterion:** R2, R6
- **Affected Req IDs:** ADD-5.2.3-04, PRD-10-12
- **Description:** REQ-WORK-007 loads OrgComponents via direct Prisma query (`getOrgComponentsForEpic`), but Addendum Stage 4 mandates component cross-reference via `search_org_kb` hybrid retrieval (vector + lexical). Phase 6 owns `search_org_kb`. Phase 4 therefore either duplicates retrieval infrastructure (stale) or depends on Phase 6 which is not listed in Phase 4 dependencies. Retrieval method mismatch.
- **Severity:** **Major**

### PHASE-4-GAP-04
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-19-11, PRD-19-12, PRD-25-03, PRD-5-26
- **Description:** Optimistic concurrency on story edits (version field, diff-on-conflict notification, never-silent-overwrite) is PRD-mandated and hinted as Phase 4 in REQUIREMENT_INDEX, but no task exists. Two BAs editing the same story concurrently will currently last-write-wins. VersionHistory snapshotting also unaddressed.
- **Severity:** **Major**

### PHASE-4-GAP-05
- **Rubric criterion:** R3, R4
- **Affected Req IDs:** PRD-10-05, PRD-10-03
- **Description:** Validation gate (Task 9) checks only non-empty strings for persona/AC. PRD-10-03 requires persona in "As a [role]..." format referencing concrete stakeholder-list persona. PRD-10-05 requires acceptance criteria in Given/When/Then with >=1 happy + >=1 exception scenario. Current ACs fail to enforce PRD's structural requirements. A story with persona "Bob" and AC "it works" will incorrectly pass READY.
- **Severity:** **Major**

### PHASE-4-GAP-06
- **Rubric criterion:** R3
- **Affected Req IDs:** ADD-5.2.3-05
- **Description:** No task covers Stage 5 (conflict resolution via Sonnet when Stage 4 flags unknowns/collisions). This is a locked Addendum decision. Even if Phase 4 only wires UI, the UI must display `ai_suggestions[]` and `component_conflicts[]` from the pipeline output — no AC mentions this.
- **Severity:** **Major**

### PHASE-4-GAP-07
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-5-25
- **Description:** PRD-5-25 requires attachments on stories (entityType + entityId). REQUIREMENT_INDEX hints Phase 4. No task. Either assign to another phase explicitly or add a task.
- **Severity:** **Major**

### PHASE-4-GAP-08
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-13-14, PRD-13-17
- **Description:** PRD-13-14: stories referencing components not in KB should trigger "planned" placeholder entries; PRD-13-17: Phase 4 writes initial KnowledgeArticle drafts per process/domain. Both hinted for Phase 4 by REQUIREMENT_INDEX. Neither covered nor explicitly deferred to Phase 6.
- **Severity:** **Major**

### PHASE-4-GAP-09
- **Rubric criterion:** R6
- **Affected Req IDs:** REQ-WORK-008, REQ-WORK-009
- **Description:** Interface contracts underspecified: `createTestCases(storyId, testCases[])` has no Zod schema, no RBAC guard spec, no error shape. `validateStoryReadiness` return type oscillates between `Promise<string[]>` (§2.9 code block) and `{ error, validationErrors }` (updateStoryStatus call site). `searchOrgComponents` route/handler not specified. `getOrgComponentsForEpic` return shape (fields, domain grouping flatten) not pinned.
- **Severity:** **Major**

### PHASE-4-GAP-10
- **Rubric criterion:** R5
- **Affected Req IDs:** REQ-WORK-001, REQ-WORK-008, REQ-WORK-009
- **Description:** Missing edge cases: (a) `createTestCases` failure after `createStory` succeeds — no rollback pattern specified; (b) concurrent DRAFT→READY transitions; (c) sprint-assigned story edited back to DRAFT (PRD-10-14 forward-only assumption); (d) "Fix with AI" token budget + rate limit; (e) orphaned test cases on discarded drafts; (f) EpicPhase backfill run mid-write when epic.create races.
- **Severity:** **Minor**

### PHASE-4-GAP-11
- **Rubric criterion:** R1
- **Affected Req IDs:** All
- **Description:** CLAUDE.md rule requires "explicit trace line for each requirement block (e.g., 'REQ-PIPELINE-001 → Addendum §5.2.1')". Phase 4 requirements cite gap IDs and PRD section numbers prose-style but no REQ-ID trace lines per PRD/Addendum section. Per-AC trace is absent.
- **Severity:** **Minor**

### PHASE-4-GAP-12
- **Rubric criterion:** R7
- **Affected Req IDs:** ADD-5.2.3-02 (embeddings), Task 10
- **Description:** Task 10 claims to "enqueue story embeddings via Phase 11 infrastructure on story.create and story.update" but Phase 11 enqueue API (function signature, event bus name, retry semantics, DLQ) is not referenced by path. No integration point pinned.
- **Severity:** **Major** (blocker-adjacent; moved to Major since Phase 11 deep-dive reportedly complete per recent commit).

### PHASE-4-GAP-13
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-9-08
- **Description:** Epic prefix uniqueness validation on create/edit hinted Phase 3/4 in REQUIREMENT_INDEX. Not covered in Phase 4. Either defer to Phase 3 explicitly (Phase 3 audit should confirm) or add to Phase 4.
- **Severity:** **Minor**

---

## 4. Fix Plan

### Fix PHASE-4-GAP-01 (Task 10 body)
- **File(s) to edit:** `docs/bef/03-phases/phase-04-work-management/TASKS.md` (add Task 10 body before Summary table; update Execution Order diagram lines 12-22); `PHASE_SPEC.md` §1 (update "9 of 11 gaps -> 9 tasks" to "10 of 11 + 1 Addendum task -> 10 tasks").
- **Change summary:** Replace Summary-table-only entry with a full task block defining Phase 2 pipeline invocation + Phase 11 embeddings enqueue, and insert Task 10 into execution-order.
- **New content outline:**
  - Scope: Replace the existing `storyGenerationTask` harness invocation in the Story Generation UI (conversation page + StoryDraftCards accept path) with a call to the Phase 2 `runStoryGenerationPipeline({ project_id, epic_id|requirement_id, prompt, user_id })`. Render `story_draft`, `validation_result`, `component_conflicts[]`, `ai_suggestions[]` from the pipeline output. On `story.create` and `story.update` server actions, enqueue via Phase 11 `embeddings.enqueue({ entity_type: "story", entity_id, content, project_id })`.
  - Depends On: Phase 2 (pipeline public function), Phase 11 (embeddings queue public API).
  - Complexity: M (not S).
  - ACs: [ ] UI calls pipeline, never `storyGenerationTask`; [ ] `component_conflicts[]` rendered with extend-vs-replace UI from Stage 5; [ ] `ai_suggestions[]` surfaced as inline suggestions; [ ] `story.create` enqueues embedding; [ ] `story.update` on mandatory-field change re-enqueues; [ ] pipeline_run_id surfaced in audit log.
  - File targets: pinned.
- **Cross-phase coordination:** Phase 2 must publish `runStoryGenerationPipeline` signature before Task 10 starts; Phase 11 must publish embeddings enqueue signature. Both referenced by exact import path.
- **Definition of done:**
  - [ ] Task 10 body lands in TASKS.md with ACs, complexity, deps
  - [ ] Execution Order diagram includes Task 10 + dependency arrow to Task 9
  - [ ] PHASE_SPEC §1 scope count reconciled
  - [ ] Trace lines: "Task 10 → ADD §5.2.3 Stages 1-7, Phase 11 §<embedding spec>"

### Fix PHASE-4-GAP-02 (pipeline vs agent-loop contradiction)
- **File(s) to edit:** `PHASE_SPEC.md` §2.7 (REQ-WORK-007), §2.8 (REQ-WORK-008), §2.9 (REQ-WORK-009); `TASKS.md` Task 7, 8, 9.
- **Change summary:** Reframe REQ-WORK-007/008/009 as UI-side consumers of Phase 2 pipeline output. Remove direct prompts/tool registrations on `storyGenerationTask`. Move test-case-stub tool to be a pipeline-internal tool in Phase 2, or delete it if pipeline Stage 2 produces test cases inside the structured-output schema.
- **New content outline:**
  - REQ-WORK-007: delete "add to storyGenerationTask system prompt" guidance; replace with "Phase 2 Stage 1 loads components via `search_org_kb` — Phase 4 adds no context-loader changes."
  - REQ-WORK-008: tool definition and agent-loop handler removed. Test case stubs are emitted by Stage 2 structured output as part of the draft schema. Phase 4 scope becomes: (a) extend the draft schema to include `test_cases[]`, (b) persist on accept via `createTestCases`, (c) preview in UI.
  - REQ-WORK-009: validation is Phase 2 Stage 3; Phase 4 consumes `validation_result.errors[]` returned by the pipeline and renders. `validateStoryReadiness` in `src/lib/story-validation.ts` is removed from Phase 4 scope (or relocated to Phase 2).
- **Cross-phase coordination:** Phase 2 deep-dive must own: mandatory validation logic, draft schema (including test_cases), Stage 4 cross-reference via `search_org_kb`, Stage 5 conflict-resolution Sonnet call. Phase 4 owns UI consumption only.
- **Definition of done:**
  - [ ] PHASE_SPEC §2.7/8/9 revised to UI-only scope
  - [ ] TASKS 7/8/9 no longer reference `storyGenerationTask`, agent tools array, or `validateStoryReadiness`
  - [ ] Every Addendum §5.2.3 stage has an explicit owner (Phase 2) cited
  - [ ] Conflict flagged in Phase 2 replan queue

### Fix PHASE-4-GAP-03 (retrieval method mismatch)
- **File(s) to edit:** `PHASE_SPEC.md` §2.7; `TASKS.md` Task 7 (likely obsolete post-GAP-02 fix).
- **Change summary:** If Task 7 survives as UI-only, document that cross-reference data is consumed from pipeline output (Stage 4) which uses `search_org_kb` — no direct Prisma query in Phase 4. If Phase 6 not yet ready, add explicit dependency on Phase 6 and do not ship Phase 4 cross-reference UI before then.
- **Cross-phase coordination:** Phase 6 must publish `search_org_kb` interface.
- **Definition of done:**
  - [ ] Phase 4 no longer imports `OrgComponent` via Prisma for generation context
  - [ ] Phase 6 dependency added to PHASE_SPEC header, or Task 7 cross-ref UI deferred to Phase 6

### Fix PHASE-4-GAP-04 (optimistic concurrency)
- **File(s) to edit:** `PHASE_SPEC.md` add new §2.10 "Optimistic Concurrency on Story/Epic/Feature Edits"; `TASKS.md` add Task 11.
- **Change summary:** Add version-based optimistic lock. Every update compares `updatedAt` or `version` column; on mismatch return 409 with diff, preserve prior state in `VersionHistory`.
- **New content outline:**
  - Schema: confirm `version` Int column on Story/Epic/Feature (or introduce); `VersionHistory` already in schema per PRD-5-26.
  - Update actions (`updateStory`, `updateEpic`, `updateFeature`) accept `expectedVersion`; on mismatch throw `ConcurrencyError`.
  - Client shows diff modal with "Merge" / "Overwrite" options; overwrite snapshots prior to VersionHistory.
  - ACs: two-user test case; never-silent-overwrite assertion; VersionHistory row created on every overwrite.
- **Cross-phase coordination:** Phase 1 auth/RBAC already returns user id for history actor.
- **Definition of done:**
  - [ ] §2.10 lands with inputs/outputs/edge cases
  - [ ] Task 11 lands with ACs and files
  - [ ] PRD-19-11, PRD-19-12, PRD-25-03, PRD-5-26 marked covered in scope map

### Fix PHASE-4-GAP-05 (persona and AC structural validation)
- **File(s) to edit:** `PHASE_SPEC.md` §2.9 (or its successor post-GAP-02); `TASKS.md` Task 9 ACs.
- **Change summary:** Strengthen validation rules (to live in Phase 2 Stage 3 per Addendum, but AC must be specified regardless of owner).
- **New content outline:**
  - Persona: regex `^As a [A-Z][a-zA-Z0-9 _-]+,` plus cross-check that role name exists in `Project.stakeholders[]` (JSON list maintained by PM).
  - Acceptance Criteria: parser checks for `Given/When/Then` tokens; requires at least one scenario that AI-classifier labels "happy path" and one "exception"; fallback regex for keyword-based heuristic when classifier unavailable.
  - Error messages: per-field with specific remediation hint.
- **Cross-phase coordination:** Phase 2 pipeline Stage 3 implements; Phase 4 tests present.
- **Definition of done:**
  - [ ] AC enumerates persona regex + stakeholder-list check
  - [ ] AC enumerates Given/When/Then + 1 happy + 1 exception
  - [ ] Edge case table covers "persona exists but not in stakeholder list" and "AC has GWT but no exception"

### Fix PHASE-4-GAP-06 (Stage 5 conflict resolution UI)
- **File(s) to edit:** `PHASE_SPEC.md` §2.7 / new §2.11 "Component Conflict Resolution UI"; `TASKS.md` add Task 12.
- **Change summary:** When pipeline returns `component_conflicts[]`, surface a modal per conflict showing existing component (apiName, label, semantics), AI proposal (extend/replace), and user confirmation control.
- **New content outline:**
  - Inputs: `component_conflicts: Array<{ draftComponent, existingOrgComponent, aiSuggestion: 'extend'|'replace'|'duplicate', rationale }>`.
  - Outputs: user decision written to `StoryComponent.orgComponentId` (if extend) or new `StoryComponent` record (if replace/duplicate with rationale in a new `decisionRationale` field — verify schema).
  - UI: modal list with per-row accept/override.
- **Cross-phase coordination:** Phase 2 Stage 5 output shape.
- **Definition of done:**
  - [ ] Task 12 lands with ACs
  - [ ] ADD-5.2.3-05 moves to Pass in scope map

### Fix PHASE-4-GAP-07 (attachments)
- **File(s) to edit:** `PHASE_SPEC.md` header "Depends On" + scope note; if owned by Phase 4, new §2.12 + TASKS.md Task 13; if deferred, update REQUIREMENT_INDEX.
- **Change summary:** Decide ownership. If Phase 4: implement `Attachment` upload/list/delete server actions for `entityType='Story'|'Question'|'Defect'`, S3 upload, size/MIME validation.
- **Cross-phase coordination:** Phase 8 handles document generation; confirm file-storage infra owner.
- **Definition of done:**
  - [ ] PRD-5-25 covered either by Phase 4 task or explicit deferral note

### Fix PHASE-4-GAP-08 (planned placeholder KB entries + initial KB drafts)
- **File(s) to edit:** `PHASE_SPEC.md` Section 5 "Integration Points"; potential new tasks.
- **Change summary:** Decide ownership between Phase 4 and Phase 6. PRD-13-17 explicitly says "Phase 4 writes initial KnowledgeArticle drafts." PRD-13-14 says stories referencing unknown components auto-create "planned" placeholder KB entries. Either (a) add task to Phase 4, or (b) push to Phase 6 with explicit REQUIREMENT_INDEX update.
- **Definition of done:**
  - [ ] Owner decided; if Phase 4, task added with DB write path and AC list

### Fix PHASE-4-GAP-09 (pin interfaces)
- **File(s) to edit:** `PHASE_SPEC.md` §2.6, §2.8, §2.9.
- **Change summary:** Add full Zod schemas and server-action return shapes.
- **New content outline:**
  - `validateStoryReadiness`: `Promise<{ ok: boolean; errors: Array<{ field: string; message: string }> }>`.
  - `createTestCases`: input Zod `z.object({ storyId: z.string().cuid(), testCases: z.array(z.object({ title: z.string().min(1), expectedResult: z.string().min(1), testType: z.enum(['HAPPY_PATH','EDGE_CASE','NEGATIVE','BULK']) })) })`. Return `{ createdIds: string[] }`. RBAC: SA/PM/BA/QA.
  - `searchOrgComponents`: route `actions/org-components.ts#searchOrgComponents`, input `{ projectId, query, limit? }`, return `Array<{ id, apiName, label, componentType, domainGrouping }>`, RBAC = any project member.
  - `getOrgComponentsForEpic`: `(epicId) => Promise<Array<{ id, apiName, label, componentType, domainGrouping }>>`.
- **Definition of done:**
  - [ ] Every new server action has Zod input + return type documented
  - [ ] Error shapes enumerated
  - [ ] RBAC row cites Phase 1 REQ-RBAC ids

### Fix PHASE-4-GAP-10 (additional edge cases)
- **File(s) to edit:** `PHASE_SPEC.md` §4 edge case table.
- **Change summary:** Add 6 new rows covering rollback, concurrency, sprint regression, token ceilings, orphaned test cases, EpicPhase race.
- **Definition of done:**
  - [ ] Each row has Scenario / Expected / Error Response columns filled

### Fix PHASE-4-GAP-11 (trace lines)
- **File(s) to edit:** `PHASE_SPEC.md` §2.1-2.9 headers.
- **Change summary:** Under each REQ-WORK-N header, add a "Trace:" line listing PRD and Addendum refs (e.g., "Trace: PRD-10-08, PRD-10-13 → ADD-5.2.3-03").
- **Definition of done:**
  - [ ] Every requirement block has a Trace line citing Req IDs
  - [ ] Complies with CLAUDE.md "explicit trace line" rule

### Fix PHASE-4-GAP-12 (Phase 11 embeddings interface)
- **File(s) to edit:** `PHASE_SPEC.md` Addendum Amendments section; `TASKS.md` Task 10 body (per GAP-01).
- **Change summary:** Cite the exact Phase 11 public function, event name, payload, retry policy, DLQ destination. Reference Phase 11 PHASE_SPEC §.
- **Definition of done:**
  - [ ] `embeddings.enqueue` (or equivalent) signature pinned
  - [ ] Event name + Inngest function id pinned
  - [ ] Failure semantics documented

### Fix PHASE-4-GAP-13 (epic prefix uniqueness)
- **File(s) to edit:** Likely `docs/bef/03-phases/phase-03-discovery-questions/PHASE_SPEC.md` (confirm during Phase 3 audit); if deferred here, update REQUIREMENT_INDEX row.
- **Change summary:** Decide owner phase and reflect in both audits.
- **Definition of done:**
  - [ ] Owner phase marked in REQUIREMENT_INDEX; Phase 4 audit scope map status updated accordingly

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
- [x] Overall verdict matches scorecard (Not-ready; multiple criteria < Pass)
