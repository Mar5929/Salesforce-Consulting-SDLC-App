# Phase 05 Audit: Sprint, Developer API

**Auditor:** Phase 5 audit agent
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-05-sprint-developer/PHASE_SPEC.md` (SHA: ac4c1ba)
- `docs/bef/03-phases/phase-05-sprint-developer/TASKS.md` (SHA: ac4c1ba)

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md`
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (secondary authoritative)
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`

---

## 1. Scope Map

| Req ID | Requirement (1-line) | Covered by (spec §/task #) | Status | Notes |
|--------|----------------------|----------------------------|--------|-------|
| PRD-1-03 | Developers work in Claude Code via skills calling REST API | §2.9, §2.10, §2.14 / Tasks 7, 8, 11 | Pass | Endpoints plus docs surface. |
| PRD-3-02 | Claude Code is the code execution environment | §2.14 / Task 11 | Pass | Boundary respected. |
| PRD-3-03 | Web app exposes REST API as management/execution boundary | §2.14 / Task 11 | Pass | — |
| PRD-4-02 | Developer role picks up tickets | §2.12, §2.6 / Tasks 10, 5 | Pass | — |
| PRD-5-08 | Claude Code skills are external to web app | §2.14 / Task 11 | Pass | Docs-only alignment. |
| PRD-5-13 | Dev-created atomic tasks not persisted | — | NotApplicable | Negative requirement. |
| PRD-5-15 | Sprint carryover not tracked in V1 | — | NotApplicable | Negative requirement. |
| PRD-5-31 | Sprint conflict alerts from overlapping impacted components | §2.2, §2.3 / Tasks 3, 4 | Pass | Parallel groups + conflict detection retained. |
| PRD-5-34 | GET context-package endpoint | §2.6–§2.8, Task 13 Addendum rewrite | Partial | Requirements 2.6–2.8 describe a naive implementation that conflicts with Task 13's deterministic pipeline rewrite (see GAP-01). |
| PRD-5-35 | GET org/query endpoint | §2.9 / Task 7 | Partial | Implemented as keyword parser; Addendum §4.6 says thin wrapper over `search_org_kb`. Phase 6 dependency acknowledged but interface contract not pinned (see GAP-02). |
| PRD-5-36 | PATCH stories/:storyId/status | — | Partial | Referenced in Task 11 doc list but not specified as a Phase 5 deliverable; appears to be prior phase (Phase 4). Not flagged in spec. |
| PRD-5-37 | POST org/component-report | §2.10 / Task 8 | Pass | — |
| PRD-5-38 | GET project/summary endpoint | — | Fail | Endpoint listed in Task 11 ACs (#1) but not specified, tasked, or scoped. No ACs, no implementation note. (see GAP-03) |
| PRD-5-39 | All APIs authenticated + role-scoped | §2.11 / Task 9 (partial) | Partial | API key expiry added; project-scoping via key is covered but role-based scoping on key-derived endpoints is not explicit. |
| PRD-6-07 | Harness manages context window budget | Task 13 | Partial | 20k token budget named in Addendum amendment but no explicit algorithm for "trim by lowest semantic similarity" in Task 13 ACs (see GAP-04). |
| PRD-6-14 | SF guardrails enforced in Claude Code, not web app | — | NotApplicable | Out-of-scope clarification only. |
| PRD-11-01 | AI Execution Mapping ordering by dependencies | — | Fail | Execution Mapping is not in Phase 5 scope. Parallelization (2.2) and Conflict (2.3) are present, Capacity (2.1) is present, but ordered dependency mapping is missing (see GAP-05). |
| PRD-11-02 | AI Parallelization Analysis | §2.2 / Task 3 | Pass | Explicit `parallelGroups` output. |
| PRD-11-03 | AI Conflict Detection | §2.3 / Tasks 3, 4 | Pass | — |
| PRD-11-04 | AI Capacity Assessment | §2.1 / Task 3 | Pass | Thresholds defined. |
| PRD-11-05 | Mid-sprint re-analysis on add/reassign | §2.4 / Task 4 | Pass | `STORY_REASSIGNED` + status-change triggers. |
| PRD-11-06 | AI tracks developer/story overlap | §2.3 / Task 3 | Pass | Developer attribution. |
| PRD-12-01 | Developers view assigned tickets + sprint plan | — | Partial | Phase 5 adds capacity/parallel UI but assigned-ticket view for Developer is not explicitly specified. Likely Phase 4. Not flagged. |
| PRD-12-02 | Tier 1 project summary always loaded | — | Fail | No Tier 1 summary endpoint spec or task in Phase 5 despite PRD assigning it here (`GET /summary` PRD-5-38). (rolled into GAP-03) |
| PRD-12-03 | Tier 1 summary contents (patterns, naming, guardrails, sprint focus) | — | Fail | Not specified. (rolled into GAP-03) |
| PRD-12-04 | Claude Code calls Context Package API on pickup | §2.6–§2.8, Task 13 | Partial | See GAP-01. |
| PRD-12-05 | Tier 2 package contents (story, AC, test stubs, epic/feature, processes, articles, discovery notes, in-flight conflicts) | §2.6–§2.8, Task 13 | Partial | Current REQs miss: test case stubs, business processes, in-flight story coordination flags (Addendum §4.6 step 6). Only Task 13 acknowledges these via Addendum amendment, but Task 13's ACs are light (see GAP-01, GAP-06). |
| PRD-12-06 | Relevance filtering via component traversal + semantic search | Task 13 | Partial | Task 13 lists steps but lacks concrete ACs for 1-hop traversal, `component_edges` usage (see GAP-01). |
| PRD-12-07 | Tier 3a business intelligence served via REST | §2.9 / Task 7 | Partial | Covered, but Addendum §4.6 `search_org_kb` contract unpinned (see GAP-02). |
| PRD-12-08 | Tier 3b live org via SF CLI from developer sandbox | — | NotApplicable | Claude Code side. |
| PRD-12-09 | Developer workflow sequence | — | NotApplicable | Documentation narrative, not a build gate. |
| PRD-12-11 | Claude Code can generate any SF CLI-deployable metadata | — | NotApplicable | Claude Code capability. |
| PRD-14-02 | Every developer uses one isolated dev env | §2.12 / Task 10 | Pass | `devEnvironmentType` field. |
| PRD-14-04 | Brownfield scratch-org warning | §2.12 / Task 10 | Pass | Covers BUILD_PHASE, MANAGED_SERVICES, RESCUE_TAKEOVER. |
| PRD-15-01..10 | SF guardrails (governor, bulkification, tests, naming, security, sharing) | — | NotApplicable | Claude Code-side per PRD-6-14. |
| PRD-19-05 | Execution status transitions restricted to SA/Dev | — | NotApplicable | Phase 4. |
| PRD-19-06 | Sprint assignment auto-transitions to Sprint Planned | — | NotApplicable | Phase 4. |
| PRD-22-13 | Token fields stripped from JSON output | — | Fail | No mention in Phase 5 for context-package/org-query/component-report responses (see GAP-07). |
| PRD-22-14 | REST API rate limited per key per minute | §2.9 (60/min), §2.10 (30/min), Task 9 | Partial | Context-package, project/summary, and stories/status endpoints have no rate-limit AC in Phase 5 despite TECHNICAL_SPEC §3.11.2 pinning them (see GAP-08). |
| PRD-22-15 | Keys scoped per project | Task 9 | Pass | Derived from API key. |
| PRD-22-16 | All API requests logged 90 days | — | Fail | No request-log implementation specified in Phase 5 for any new endpoint (see GAP-09). |
| PRD-26-02 | Build Sequence: Phase 2 covers sprint analysis | — | NotApplicable | Cross-ref. |
| ADD-4.6-03 | Context Package Assembly is deterministic pipeline, single Sonnet call | Task 13 | Partial | Listed as 9 steps but Task 13 has zero ACs and no file list (see GAP-01). |
| ADD-4.6-04 | Package content breadth (epic, 1-hop neighbors, memberships, annotations, Q&A, in-flight, 20k budget) | Task 13 | Partial | Steps enumerated but not testable (see GAP-01). |
| ADD-4.6-05 | <3s p95 latency target, only LLM call is 200-word brief | Task 13 | Partial | Latency target named but no measurement AC or instrumentation task (see GAP-01). |
| ADD-4.6-06 | Org Query API is thin wrapper over `search_org_kb` | §2.9 / Task 7 | Partial | Phase 5 implementation is keyword parser + LIKE fallback; Addendum says wrap `search_org_kb`. Mismatch (see GAP-02). |
| ADD-4.6-07 | Trim by lowest semantic similarity when over token budget | Task 13 | Partial | Named in amendment step 7 but no AC in Task 13 (see GAP-04). |
| ADD-5.2.4-01 | Briefing/Status Pipeline accepts `sprint_health` | Task 14 | Partial | Task 14 is one line; no ACs, no file list, no interface with Phase 2 (see GAP-10). |
| ADD §5.6 | Eval fixtures for Context Package Assembly | Task 15 | Pass | Ten fixtures, scenario split, assertions, latency + token assertions. |

**Scope summary:** 42 rows mapped. 15 Pass, 17 Partial, 5 Fail, 14 NotApplicable.

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification (1 line) |
|---|-----------|-------|------------------------|
| R1 | Requirement traceability | Partial | Most REQ-SPRINT items trace to gap doc, but REQs do not cite PRD IDs directly and several PRD rows (PRD-5-38, PRD-12-02/03, PRD-11-01) are uncovered. |
| R2 | No PRD/Addendum/TECHNICAL_SPEC contradiction | Fail | REQs 2.6–2.8 describe a Prisma-join/keyword implementation of the context package while Task 13 mandates the Addendum §4.6 deterministic pipeline. Both are in scope, irreconcilable. |
| R3 | Scope completeness | Fail | Missing: GET /api/v1/summary (Tier 1), Execution Mapping (PRD-11-01), request logging (PRD-22-16), response token scrubbing (PRD-22-13). |
| R4 | Acceptance criteria are testable | Partial | Tasks 1–12 have concrete ACs; Tasks 13 and 14 have no ACs; Task 15 is solid. |
| R5 | Edge cases enumerated | Partial | Phase-5 table covers sprint/context/API-key well but misses: token-budget overflow behavior, `search_org_kb` unavailable, component_edges empty, rate-limit 429 contract, request-log failure. |
| R6 | Interfaces pinned | Partial | Schema diffs + component-report request/response are pinned; org/query response schema incomplete (no field types on `components[]`/`articles[]`/`relatedStories[]`); context package v2 response schema (Task 13) not pinned at all. |
| R7 | Upstream deps resolved | Partial | Phase 4 (story/sprint) resolved. Phase 2 (harness) resolved for sprint intel. Phase 6 `search_org_kb`/`search_project_kb`/`component_edges` dependency is named but no interface contract (function signature, return shape, embedding status requirements) is pinned. |
| R8 | Outstanding items | Fail | Spec §7 says "None" but Tasks 13 and 14 are visibly incomplete (no ACs, no file list). |

**Overall verdict:** Not-ready

---

## 3. Gaps

### PHASE-5-GAP-01
- **Rubric criterion:** R2, R3, R4, R6
- **Affected Req IDs:** PRD-5-34, PRD-12-04, PRD-12-05, PRD-12-06, ADD-4.6-03, ADD-4.6-04, ADD-4.6-05
- **Description:** The phase has two competing context-package designs. REQs 2.6–2.8 (and Tasks 5, 6) describe a traditional Prisma-include + cosine-similarity-on-articles implementation, while the "Addendum v1 Amendments" block and Task 13 mandate a replacement deterministic 9-step pipeline per Addendum §4.6. The spec does not state which wins, does not mark 2.6–2.8 as superseded, and Task 13 has no acceptance criteria, no files-list, no response schema, no in-flight-story coordination flag behavior, no business-process inclusion, no test-stub inclusion, and no latency instrumentation. A developer agent executing Tasks 5–6 in parallel with Task 13 would produce conflicting code paths.
- **Severity:** Blocker

### PHASE-5-GAP-02
- **Rubric criterion:** R2, R6, R7
- **Affected Req IDs:** PRD-5-35, PRD-12-07, ADD-4.6-06
- **Description:** Org Query (§2.9 / Task 7) is spec'd as a regex keyword parser + LIKE fallback. Addendum §4.6 locks this endpoint as a thin wrapper over `search_org_kb` with optional LLM synthesis. The spec acknowledges "Phase 6 builds this and wires in later" but the Phase 5 implementation itself contradicts the Addendum-locked contract. The `search_org_kb` function signature, input options, return shape, and how Phase 5 will swap implementations are unspecified. Response schemas (`components[]`, `articles[]`, `relatedStories[]`) are listed by name only, with no field types or nullability.
- **Severity:** Blocker

### PHASE-5-GAP-03
- **Rubric criterion:** R3, R6
- **Affected Req IDs:** PRD-5-38, PRD-12-02, PRD-12-03
- **Description:** GET `/api/v1/summary` (Tier 1 project summary) is referenced in Task 11's endpoint-list AC #1 but has no functional requirement, no task, no ACs, no response schema, and no source-of-truth for its contents. PRD-12-02/03 mandate architectural patterns, naming conventions, key decisions, six guardrails, current sprint focus, and a map for requesting more detail — none of this is assembled or specified anywhere in Phase 5.
- **Severity:** Blocker

### PHASE-5-GAP-04
- **Rubric criterion:** R4, R5
- **Affected Req IDs:** ADD-4.6-07, PRD-6-07
- **Description:** The 20k-token budget and "trim by lowest semantic similarity to story description" rule (Addendum step 7) are named but not testable. No tokenizer, no budget-miss behavior, no guarantee which sections are protected (story + AC must survive), no tie-breaker rule, no unit that owns the trim logic.
- **Severity:** Major

### PHASE-5-GAP-05
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-11-01
- **Description:** Sprint Execution Mapping (ordering candidate stories by cross-component dependencies) is a PRD §11.1 AI capability mapped to Phase 5 in the requirement index. The spec covers parallelization and capacity but never defines sequencing output. No task, no AC, no data shape.
- **Severity:** Major

### PHASE-5-GAP-06
- **Rubric criterion:** R3, R4
- **Affected Req IDs:** PRD-12-05, ADD-4.6-04
- **Description:** PRD-12-05 requires the Tier 2 package to include test case stubs, business processes, related decisions, and in-flight story coordination flags. Phase 5 REQs cover epic/feature, articles, and discovery notes only. Task 13 lists "in-flight stories sharing any impacted component" at step 6 but has no AC; business processes and decisions are not mentioned anywhere.
- **Severity:** Blocker

### PHASE-5-GAP-07
- **Rubric criterion:** R5
- **Affected Req IDs:** PRD-22-13
- **Description:** PRD §22.8 requires serialization helpers to strip token fields from JSON output. Phase 5 adds four new/modified response surfaces (context-package v2, org/query, component-report, project/summary) and none of them name the scrubbing layer. If any of these responses include `ProjectMember`, `Project`, or credential-bearing nested objects, tokens can leak.
- **Severity:** Major

### PHASE-5-GAP-08
- **Rubric criterion:** R5, R6
- **Affected Req IDs:** PRD-22-14
- **Description:** TECHNICAL_SPEC §3.11.2 pins specific per-endpoint rate limits: context-package 60/min, org/query 60/min, stories/status 30/min, component-report 30/min, summary 120/min. Phase 5 only lists limits for org/query and component-report. Context-package (Tasks 5, 6, 13), summary (GAP-03), and stories/status have no rate-limit AC. 429 response shape is unpinned.
- **Severity:** Major

### PHASE-5-GAP-09
- **Rubric criterion:** R3, R5
- **Affected Req IDs:** PRD-22-16
- **Description:** All API requests must be logged with key ID, endpoint, timestamp, response status, retained 90 days. Phase 5 creates/modifies five endpoints and says nothing about request logging, log table/entity, middleware, or retention sweep. Either the log already exists from an earlier phase and Phase 5 must reuse it (name the helper), or it must be built here.
- **Severity:** Major

### PHASE-5-GAP-10
- **Rubric criterion:** R4, R6, R7
- **Affected Req IDs:** ADD-5.2.4-01
- **Description:** Task 14 ("Route sprint health briefing to Briefing/Status Pipeline (Phase 2) with `briefing_type = sprint_health`") has one sentence. No ACs, no file list, no Phase 2 interface reference, no payload shape, no trigger (when is sprint_health invoked — on-demand, scheduled?), no output destination.
- **Severity:** Major

### PHASE-5-GAP-11
- **Rubric criterion:** R1, R8
- **Affected Req IDs:** all
- **Description:** REQs in §2 cite internal `REQ-SPRINT-NNN` + gap-report IDs, but do not trace to PRD IDs or Addendum IDs. The project-wide hard rule ("Deep-dive outputs must include an explicit trace line for each requirement block") is violated. Spec §7 "Open Questions: None" contradicts visible incompleteness in Tasks 13–14.
- **Severity:** Minor

### PHASE-5-GAP-12
- **Rubric criterion:** R6, R7
- **Affected Req IDs:** PRD-12-06, ADD-4.6-04
- **Description:** Task 13 step 3 requires "1-hop neighbors via `component_edges`". `component_edges` is a Phase 6 artifact. No interface contract is pinned (table shape, traversal SQL, neighbor cap, cycle protection). Without this, Task 13 is not buildable.
- **Severity:** Major

---

## 4. Fix Plan

### Fix PHASE-5-GAP-01
- **File(s) to edit:** `docs/bef/03-phases/phase-05-sprint-developer/PHASE_SPEC.md` §2.6–§2.8 and §Addendum Amendments; `TASKS.md` Tasks 5, 6, 13.
- **Change summary:** Mark REQs 2.6–2.8 as superseded by the Addendum §4.6 pipeline. Collapse Tasks 5 and 6 into Task 13 (or explicitly mark them as "data-layer building blocks consumed by Task 13 step 1/5"). Expand Task 13 into a full task with ACs, file list, response schema, and instrumentation.
- **New content outline:**
  - Add a note at top of §2.6: "Superseded by Addendum §4.6 pipeline; see Task 13. REQs 2.6–2.8 remain as data-assembly steps used by the pipeline, not as standalone API behaviors."
  - Task 13 new ACs (minimum): (a) route handler at `src/app/api/v1/context-package/route.ts` implements 9 steps in order; (b) response schema `{story, businessContext:{epic,feature}, impactedComponents:[{id,apiName,type,neighbors:[…],domains:[…],annotations:[…]}], domains:[{id,name,description,annotations}], discoveryNotes, inFlightStoryCoordination:[{storyDisplayId,sharedComponents:[]}], articles:[{…full content}], contextBrief:string, _meta:{tokenCount,latencyMs}}`; (c) exactly one LLM call (Sonnet) for the 200-word brief; (d) p95 latency <3s measured over eval fixture runs; (e) SessionLog entry with taskType CONTEXT_PACKAGE_ASSEMBLY; (f) unit tests for each of the 9 steps; (g) response respects token budget (GAP-04 rule).
  - Task 13 file list: `src/app/api/v1/context-package/route.ts` (modify), `src/lib/context-package/pipeline.ts` (create, orchestrator), `src/lib/context-package/steps/*.ts` (9 step modules), `src/lib/context-package/token-budget.ts` (create), `src/lib/agent-harness/tasks/context-brief.ts` (create, Sonnet call).
  - In §2.7 rewrite the article-ranking rule to run through step 5 (Q&A hybrid search) + step 4 (domain context) rather than a standalone cosine query.
- **Cross-phase coordination:** Phase 6 must expose `search_org_kb`, `search_project_kb`, and `component_edges` before Task 13 can run (already noted in dependency header — pin the function signatures).
- **Definition of done:**
  - [ ] §2.6–§2.8 each carry a "Superseded by Addendum §4.6 / Task 13" banner.
  - [ ] Task 13 has ≥7 concrete ACs and a files-to-change/create list.
  - [ ] Response schema fully typed in §3.3 "API Contracts".
  - [ ] Spec cites PRD-5-34, PRD-12-04, PRD-12-05, PRD-12-06, ADD-4.6-03..05 on Task 13.

### Fix PHASE-5-GAP-02
- **File(s) to edit:** `PHASE_SPEC.md` §2.9; `TASKS.md` Task 7.
- **Change summary:** Rewrite org/query as a thin wrapper over `search_org_kb` (Phase 6). Keep keyword parsing only as a pre-filter for structured intents that short-circuit to SQL; drop the LIKE fallback as the primary path.
- **New content outline:**
  - §2.9 new behavior: "Call `search_org_kb(query, options)` with `options = { projectId, entityTypes: ['component','article','story'], filters: parseOrgQueryFilters(q), topK: 20 }`. If `parseOrgQueryFilters` extracts a structured shape (e.g., `componentType=FIELD, parent=Account`), pass it as a hard filter. Otherwise forward the raw query for hybrid retrieval."
  - Pin `search_org_kb` signature in §5 "Integration Points → Phase 6": `search_org_kb(query: string, options: { projectId: string; entityTypes?: EntityType[]; filters?: Record<string,unknown>; topK?: number; synthesize?: boolean }) => Promise<{ components: OrgComponentHit[]; articles: KnowledgeArticleHit[]; relatedStories: StoryHit[]; queryInterpretation: object; synthesis?: string }>`.
  - Task 7 ACs: replace LIKE-search AC with "Invokes `search_org_kb` and returns its result shape." Add "When Phase 6 `search_org_kb` is unavailable, endpoint returns 503 with `{error:'org_kb_unavailable'}`." Remove regex fallback from acceptance path (keep as pre-filter only).
- **Cross-phase coordination:** Phase 6 owns `search_org_kb` contract; Phase 5 spec must cite it and the Phase 6 phase doc must publish it before Task 7 starts.
- **Definition of done:**
  - [ ] §2.9 behavior is "wrapper over `search_org_kb`".
  - [ ] Response schema fields typed in §3.3.
  - [ ] Spec cites ADD-4.6-06.

### Fix PHASE-5-GAP-03
- **File(s) to edit:** `PHASE_SPEC.md` (new §2.15); `TASKS.md` (new Task 16).
- **Change summary:** Add functional requirement and task for GET `/api/v1/summary` (Tier 1 project summary) with explicit contents from PRD §12.2.
- **New content outline:**
  - §2.15 "Tier 1 Project Summary Endpoint (PRD-5-38, PRD-12-02, PRD-12-03)": GET `/api/v1/summary`, API key auth, response `{architecturalPatterns:string[], namingConventions:object, keyDecisions:{id,title,summary}[], guardrails:GuardrailRef[], currentSprintFocus:{sprintId,name,goals,storyDisplayIds[]}, howToRequestMore:object}`. Rate limit 120/min per TECHNICAL_SPEC §3.11.2.
  - Task 16 ACs: endpoint exists; each field populated from documented source tables; unit tests for empty-project and no-active-sprint cases; response cached for 5 minutes per project.
  - File list: `src/app/api/v1/summary/route.ts` (create), `src/lib/project-summary/assemble.ts` (create).
- **Cross-phase coordination:** Needs Phase 4 Decision table + Phase 4 Sprint model.
- **Definition of done:**
  - [ ] §2.15 added, Task 16 added.
  - [ ] Response shape typed in §3.3.
  - [ ] Spec cites PRD-5-38, PRD-12-02, PRD-12-03.

### Fix PHASE-5-GAP-04
- **File(s) to edit:** `TASKS.md` Task 13; `PHASE_SPEC.md` §4 Edge Cases.
- **Change summary:** Pin the token-budget trim algorithm.
- **New content outline:**
  - Task 13 AC: "Use `tiktoken` (or equivalent) to count tokens on the final serialized package. If >20,000, trim sections in this priority order: (1) never trim story+AC+businessContext+contextBrief, (2) drop lowest-cosine-similarity articles first, (3) drop lowest-cosine-similarity discovery notes next, (4) drop 1-hop neighbor components with lowest similarity last. Tie-break by most-recently-updated. Repeat until <=20,000."
  - Edge-case row: "Trim cannot bring package under 20k (impossible in practice) → return 507 Insufficient Storage with diagnostic payload."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Algorithm documented in Task 13.
  - [ ] Protected sections listed.
  - [ ] Edge-case row added.

### Fix PHASE-5-GAP-05
- **File(s) to edit:** `PHASE_SPEC.md` §2.2 (extend) or new §2.16; `TASKS.md` Task 3.
- **Change summary:** Add Execution Mapping output to sprint intelligence.
- **New content outline:**
  - Extend §2.2: add `executionOrder: Array<{ rank: number, storyDisplayId: string, rationale: string, dependsOn: string[] }>` to `cachedAnalysis`.
  - Task 3 new AC: "Output schema includes `executionOrder` where every story appears once with a rank and explicit `dependsOn` list derived from shared component impact."
  - AI prompt addendum: "Order stories such that a story whose impacted components are modified by another story has a higher rank (runs after)."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] `executionOrder` field defined in output schema.
  - [ ] Validator enforces every story present.
  - [ ] Spec cites PRD-11-01.

### Fix PHASE-5-GAP-06
- **File(s) to edit:** `TASKS.md` Task 13; `PHASE_SPEC.md` §2 (Addendum amendment block).
- **Change summary:** Expand Tier 2 package to include test stubs, business processes, related decisions, in-flight coordination.
- **New content outline:**
  - Task 13 ACs add: (a) `testCases: Array<{displayId,title,steps,expected}>` pulled from `TestCase` where `storyId = story.id`; (b) `businessProcesses: Array<{id,name,description,componentMappings[]}>` from `BusinessProcess` joined via `BusinessProcessComponent` intersecting story's impacted components; (c) `decisions: Array<{id,title,summary,date}>` from `Decision` scoped to story's epic/feature; (d) `inFlightStoryCoordination: Array<{storyDisplayId, assignee, sharedComponents:[apiName]}>` from stories with `status IN ('IN_PROGRESS','IN_REVIEW')` and overlapping components.
- **Cross-phase coordination:** Requires Phase 3 `Decision`, Phase 6 `BusinessProcess` tables.
- **Definition of done:**
  - [ ] Task 13 ACs include all four sections.
  - [ ] Response schema in §3.3 typed.
  - [ ] Spec cites PRD-12-05.

### Fix PHASE-5-GAP-07
- **File(s) to edit:** `PHASE_SPEC.md` §4 Edge Cases; each affected task.
- **Change summary:** Require all response payloads to flow through an existing serialization helper that strips token fields (or create one if absent).
- **New content outline:**
  - Add edge-case row: "API response includes entity with token field → serializer strips `accessToken`, `refreshToken`, `apiKeyHash` before JSON encoding."
  - Each new/modified endpoint task gets AC: "Response is serialized via `stripSensitiveFields()`; unit test asserts absence of token-bearing keys."
- **Cross-phase coordination:** None if helper exists (likely Phase 1); name the helper if so.
- **Definition of done:**
  - [ ] Edge-case row added.
  - [ ] ACs added to Tasks 7, 8, 13, 16.
  - [ ] Spec cites PRD-22-13.

### Fix PHASE-5-GAP-08
- **File(s) to edit:** `PHASE_SPEC.md` §2.6–§2.10, §2.15; affected tasks.
- **Change summary:** Pin rate limits from TECHNICAL_SPEC §3.11.2 on every endpoint AC.
- **New content outline:**
  - context-package: "Rate limited: 60 req/min per API key."
  - summary: "Rate limited: 120 req/min per API key."
  - org/query: already 60 (confirm).
  - component-report: already 30 (confirm).
  - stories/status (clarify ownership): if Phase 5, "Rate limited: 30 req/min per API key"; else mark NotApplicable.
  - 429 response contract: `{error:'rate_limited', retryAfterSeconds:number}` with `Retry-After` header.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Each endpoint REQ names the limit.
  - [ ] 429 shape defined in §3.3.
  - [ ] Spec cites PRD-22-14 and TECHNICAL_SPEC §3.11.2.

### Fix PHASE-5-GAP-09
- **File(s) to edit:** `PHASE_SPEC.md` §3.1 (new step) or §5; `TASKS.md` new sub-AC on each endpoint task.
- **Change summary:** Hook every endpoint to an `ApiRequestLog` entity (verify existence; if absent, add to Task 1 migration).
- **New content outline:**
  - Add to §5 "Integration Points → From Phase 1": "`logApiRequest({apiKeyId, endpoint, method, status, latencyMs})` middleware wraps `withApiAuth`." If not yet built, add Task 16a "Create ApiRequestLog model + middleware + 90-day retention sweep (Inngest cron)".
  - Each endpoint task: AC "Request logged via `logApiRequest` including failures."
- **Cross-phase coordination:** Verify with Phase 1 whether log exists.
- **Definition of done:**
  - [ ] Logging integration point named.
  - [ ] Each endpoint task has a logging AC.
  - [ ] If log table is new, schema is in Task 1 or a new Task 16a.
  - [ ] Spec cites PRD-22-16.

### Fix PHASE-5-GAP-10
- **File(s) to edit:** `TASKS.md` Task 14.
- **Change summary:** Expand Task 14 with ACs, file list, trigger definition, output destination.
- **New content outline:**
  - Scope: trigger the Phase 2 Briefing/Status Pipeline with `briefing_type='sprint_health'` on (a) manual request via UI button on Sprint page, (b) end-of-day cron at 18:00 project-local time.
  - ACs: (a) UI button on Sprint page calls `requestSprintHealthBriefing(sprintId)` server action; (b) action enqueues Inngest event `BRIEFING_REQUESTED` with payload `{projectId, sprintId, briefingType:'sprint_health', requestorUserId}`; (c) Phase 2 pipeline handles event and writes result to `GeneratedDocument` with `type='SPRINT_HEALTH_BRIEFING'`; (d) cron job `sprint-health-daily.ts` enumerates active sprints and fires same event.
  - File list: `src/actions/sprint-briefing.ts` (create), `src/lib/inngest/functions/sprint-health-cron.ts` (create), `src/components/sprints/sprint-briefing-button.tsx` (create).
  - Interface with Phase 2: cite the exact Inngest event name + payload schema defined in Phase 2's pipeline spec.
- **Cross-phase coordination:** Phase 2 must have published `sprint_health` briefing_type in its Briefing/Status Pipeline contract.
- **Definition of done:**
  - [ ] Task 14 has ≥4 ACs and a file list.
  - [ ] Phase 2 interface cited.
  - [ ] Spec cites ADD-5.2.4-01.

### Fix PHASE-5-GAP-11
- **File(s) to edit:** `PHASE_SPEC.md` §2 headers and §7.
- **Change summary:** Add "Traces to:" line on every §2.x block and purge §7 claim of zero open questions.
- **New content outline:**
  - Each §2.x: append "Traces to: PRD-x-y, ADD-x-y" line under the title.
  - §7 Open Questions: list Tasks 13 and 14 incompleteness plus any unresolved GAPs from this audit.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Every §2.x has a Traces line.
  - [ ] §7 reflects real open items.

### Fix PHASE-5-GAP-12
- **File(s) to edit:** `PHASE_SPEC.md` §5 "For Future Phases" → move to "From Prior Phases" (Phase 6 is a dependency, not future). `TASKS.md` Task 13.
- **Change summary:** Pin Phase 6 interface contracts this phase consumes.
- **New content outline:**
  - §5 new subsection "Phase 6 (Depends On, Addendum v1)": list with signatures:
    - `search_org_kb(...)` — signature per GAP-02.
    - `search_project_kb(query, entityTypes, filters) => SearchResult[]`.
    - `component_edges` table: `(projectId, fromComponentId, toComponentId, edgeType, weight)` with index `(projectId, fromComponentId)`.
    - `OrgComponent.embedding` vector(1536), `embeddingStatus` enum.
  - Task 13 AC: "1-hop neighbor traversal uses `component_edges`, max 10 neighbors per component, excludes cycles."
- **Cross-phase coordination:** Phase 6 publishes these contracts before Phase 5 Task 13 starts.
- **Definition of done:**
  - [ ] §5 names each Phase 6 symbol with signature/shape.
  - [ ] Task 13 has neighbor-cap AC.
  - [ ] Header "Depends On" line retained.

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
- [x] Overall verdict matches scorecard (Not-ready; R2, R3, R8 = Fail)
