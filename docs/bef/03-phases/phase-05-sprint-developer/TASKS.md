# Phase 5 Tasks: Sprint, Developer API

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 16
> Status: 0/16 complete
> Last Updated: 2026-04-13

---

## Execution Order

```
Task 1  (Schema migration + ApiRequestLog)          ─── must be first
  │
  ├── Task 1a (Shared helpers: stripSensitiveFields + logApiRequest wrapper)
  │
  ├── Task 2 (Harness refactor)
  │     └── Task 3 (Capacity + parallelization + executionOrder + developer attribution)
  │           └── Task 4 (Mid-sprint triggers + dismissal persistence)
  │
  ├── Task 5 [Superseded by Task 13 — data helpers only]
  ├── Task 6 [Superseded by Task 13 — data helpers only]
  ├── Task 7 (Org query endpoint — search_org_kb wrapper)      ─── needs Phase 6
  ├── Task 8 (Component report endpoint)                        ─── needs Phase 9 assertProjectWritable
  ├── Task 9 (API key expiry + rotation)
  ├── Task 10 (Brownfield warning)
  ├── Task 11 (Developer API docs update)                       ─── after 7, 8, 9, 16
  ├── Task 12 (Sprint intelligence UI)                          ─── after 3
  ├── Task 13 (Context Package Assembly pipeline, Addendum §4.6) ─── needs Phase 6
  ├── Task 14 (Sprint health briefing routing)                  ─── needs Phase 2
  ├── Task 15 (Eval fixtures)                                   ─── after 13
  ├── Task 16 (Tier 1 project summary endpoint)                 ─── independent
  └── Task 17 (Request-log retention cron)                      ─── after 1
```

---

## Tasks

### Task 1: Schema Migration — Sprint velocityTarget, ApiKey expiresAt, ProjectMember devEnvironmentType, ApiRequestLog

| Attribute | Details |
|-----------|---------|
| **Scope** | Add three fields, one enum, and the `ApiRequestLog` model in a single Prisma migration. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `Sprint` model has `velocityTarget Int?`
- [ ] `ApiKey` model has `expiresAt DateTime?`
- [ ] `ProjectMember` model has `devEnvironmentType DevEnvironmentType?`
- [ ] `DevEnvironmentType` enum with 5 values
- [ ] New model `ApiRequestLog { id, projectId, apiKeyId, endpoint, method, status Int, latencyMs Int, errorCode String?, createdAt DateTime @default(now()) }` with indexes `(projectId, createdAt)` and `(apiKeyId, createdAt)`
- [ ] Migration applies cleanly (all additions backward compatible)
- [ ] `npx prisma generate` succeeds

Traces to: PRD-22-16 (ApiRequestLog), DECISION-08.

---

### Task 1a: Shared Helpers — stripSensitiveFields + logApiRequest Middleware

| Attribute | Details |
|-----------|---------|
| **Scope** | Create (or reuse) the response scrubbing helper and the request-logging middleware wrapper used by every `/api/v1/*` route. |
| **Depends On** | Task 1 |
| **Complexity** | S |
| **Status** | Not Started |

**Acceptance Criteria:**
- [ ] `src/lib/serialization/strip-sensitive-fields.ts` exports `stripSensitiveFields(payload: unknown): unknown`
- [ ] Removes keys matching `accessToken`, `refreshToken`, `apiKeyHash`, `secret` at any nesting depth
- [ ] Unit test: payload containing `{project:{apiKey:{apiKeyHash:'...'}}}` returns object with the hash removed
- [ ] `src/lib/api-keys/auth.ts` `withApiAuth` now wraps handler with `logApiRequest` that records `{ projectId, apiKeyId, endpoint, method, status, latencyMs, errorCode }` on both success and error paths
- [ ] Logging failures do not block the request (log to app logger, return response)
- [ ] Unit tests: 200, 401 (expired), 403, 429, 500 paths all persist an `ApiRequestLog` row

Traces to: PRD-22-13, PRD-22-16, DECISION-08.

---

### Task 2: Refactor Sprint Intelligence to Use Agent Harness

(Scope, depends, complexity unchanged from prior version.)

**Acceptance Criteria:**
- [ ] Inngest function no longer imports `Anthropic` directly
- [ ] Routes through `executeTask(sprintIntelligenceTask, input)`
- [ ] `contextLoader` performs all data queries
- [ ] Output validation via `outputValidator`
- [ ] `SessionLog` entry per run (taskType `SPRINT_ANALYSIS`)
- [ ] Firm typographic rules applied
- [ ] No functional regression

Traces to: PRD-6-07, PRD-6-14.

---

### Task 3: Sprint Intelligence — Capacity, Parallelization, Execution Ordering, Developer Attribution

| Attribute | Details |
|-----------|---------|
| **Scope** | Extend the sprint intelligence task with capacity assessment, parallelization groups, execution ordering, and developer attribution. |
| **Depends On** | Task 2 |
| **Complexity** | M |

**Acceptance Criteria:**
- [ ] Context loader queries active developer count
- [ ] Context loader includes `velocityTarget` (or default heuristic)
- [ ] Output schema includes `capacityAssessment: { developerCount, totalPoints, pointsPerDeveloper, velocityTarget, status, recommendation }`
- [ ] Output schema includes `parallelGroups: Array<{ groupId, storyDisplayIds, rationale }>`
- [ ] Output schema includes `executionOrder: Array<{ rank, storyDisplayId, rationale, dependsOn: string[] }>` — every sprint story appears exactly once, `dependsOn` references only sprint stories
- [ ] AI prompt requests explicit parallelization grouping
- [ ] AI prompt: "Order stories such that a story whose impacted components are modified by another story has a higher rank (runs after). `dependsOn` lists prerequisite storyDisplayIds."
- [ ] Output validator checks: (a) every story in exactly one parallel group, (b) every story in `executionOrder` exactly once, (c) no cycles in `dependsOn` graph, (d) `capacityAssessment.status` in valid set
- [ ] Story select includes `assignee: { select: { displayName: true, id: true } }`
- [ ] Conflict output includes `storyAAssignee` / `storyBAssignee` display names; null → "Unassigned"

Traces to: PRD-11-01 (executionOrder), PRD-11-02, PRD-11-03, PRD-11-04, PRD-11-06, DECISION-08.

---

### Task 4: Mid-Sprint Re-Analysis Triggers and Conflict Dismissal Persistence

(Unchanged from prior version; traces PRD-11-05.)

**Acceptance Criteria:** as previously specified — `STORY_REASSIGNED` event, debounce 30s, `dismissSprintConflict` action, stable-key carry-forward on re-analysis.

---

### Task 5: [Superseded by Task 13] — Context Package Data Helpers: Epic/Feature + Discovery

| Attribute | Details |
|-----------|---------|
| **Status** | Not Started (scope narrowed) |

**Scope change per Wave 3 audit (DECISION-08 / PHASE-5-GAP-01):** This task is no longer a standalone API behavior. REQs 2.6 and 2.8 are superseded by Task 13's 9-step pipeline. Remaining deliverable: build the epic/feature join helper and the answered-questions helper as pure functions consumed by Task 13 steps 1 and 5.

**Acceptance Criteria:**
- [ ] `fetchBusinessContext(storyId)` helper returns `{ epic, feature }`
- [ ] `fetchDiscoveryNotes(storyId)` helper returns up to 20 answered questions (engagement-scoped always, epic/feature scoped as applicable, ordered `answeredDate DESC`)
- [ ] Both helpers used only by Task 13 pipeline; the `/api/v1/context-package` route does NOT call them directly

---

### Task 6: [Superseded by Task 13] — Knowledge Article Retrieval Helper

| Attribute | Details |
|-----------|---------|
| **Status** | Not Started (scope narrowed) |

**Scope change per Wave 3 audit (DECISION-05 / PHASE-5-GAP-01):** REQ 2.7 is superseded by Task 13's pipeline. Retrieval now runs through `search_project_kb` (step 5) plus domain context (step 4). Layer 3 KA embeddings exist per DECISION-05.

**Acceptance Criteria:**
- [ ] `fetchKnowledgeArticles(storyId, semanticHint)` helper wraps `search_project_kb` with `entityTypes: ['article']`, limit 5
- [ ] Filters articles with `effectivenessScore < -0.3` AND `useCount >= 10`
- [ ] Returns full `content` field (not summaries)
- [ ] Increments `useCount` on returned articles in a single `updateMany`
- [ ] Used only by Task 13 pipeline

---

### Task 7: Org Query Endpoint — search_org_kb Wrapper

| Attribute | Details |
|-----------|---------|
| **Scope** | Build `GET /api/v1/org/query` as a thin wrapper over Phase 6 `search_org_kb`. Keyword parsing survives only as pre-filter extraction; the LIKE fallback is removed as a primary path. |
| **Depends On** | Task 1, Task 1a, Phase 6 (`search_org_kb` published) |
| **Complexity** | M |

**Acceptance Criteria:**
- [ ] Route `GET /api/v1/org/query?q=<query>` exists, requires API key auth via `withApiAuth`
- [ ] Invokes `search_org_kb(q, { projectId, entityTypes: ['component','article','story'], filters: parseOrgQueryFilters(q), topK: 20 })`
- [ ] `parseOrgQueryFilters` extracts structured filters for: "fields on {Object}", "triggers on {Object}", "flows on {Object}", "integrations touching {Object}", "stories touching {Component}". Unmatched → `{}` (forward raw query for hybrid retrieval, no LIKE fallback)
- [ ] Response conforms to §3.3 `/api/v1/org/query` schema (typed fields)
- [ ] When `search_org_kb` throws or is not deployed → HTTP 503 `{error:'org_kb_unavailable'}`
- [ ] Rate limited: 60 req/min per API key; 429 shape per §3.3
- [ ] Response piped through `stripSensitiveFields` before `NextResponse.json`
- [ ] Every request logged via `logApiRequest` (success + failure)
- [ ] Returns HTTP 200 with empty arrays on zero matches (not 404)

Traces to: PRD-5-35, PRD-12-07, PRD-22-13, PRD-22-14, PRD-22-16, ADD-4.6-06, DECISION-05, DECISION-08.

---

### Task 8: Component Report Endpoint

| Attribute | Details |
|-----------|---------|
| **Scope** | Build `POST /api/v1/component-report` for Claude Code to report built/modified components. |
| **Depends On** | Task 1, Task 1a, Phase 9 (`assertProjectWritable`) |
| **Complexity** | M |

**Acceptance Criteria:**
- [ ] Route exists, requires API key auth
- [ ] Validates request body with Zod
- [ ] Validates story belongs to API key's project (403 otherwise)
- [ ] Calls `assertProjectWritable(projectId)` before any DB write; archived projects return 409 per DECISION-10
- [ ] For each component: look up `OrgComponent` by `(projectId, apiName, componentType)`; upsert `StoryComponent`; create PLANNED `OrgComponent` when no match
- [ ] Atomic via `prisma.$transaction`
- [ ] Action → impactType map: CREATED→CREATE, MODIFIED→MODIFY, DELETED→DELETE
- [ ] Response `{ linked, created, unmatched }`
- [ ] Rate limited 30 req/min; 429 shape per §3.3
- [ ] Response piped through `stripSensitiveFields`
- [ ] Request logged via `logApiRequest`

Traces to: PRD-5-37, PRD-22-13, PRD-22-14, PRD-22-16, DECISION-08, DECISION-10.

---

### Task 9: API Key Expiry and Rotation

(Acceptance criteria unchanged from prior version. Adds:)

- [ ] `stripSensitiveFields` applied to rotation response (never return the new key's stored hash)
- [ ] Rotation logs a `SessionLog` entry

Traces to: PRD-22-15.

---

### Task 10: Brownfield Scratch Org Warning

(Unchanged.) Traces to: PRD-14-02, PRD-14-04.

---

### Task 11: Developer API Documentation Update

**Acceptance Criteria:**
- [ ] Endpoint list documents all 6 endpoints: `GET /api/v1/context-package`, `GET /api/v1/org/query`, `POST /api/v1/component-report`, `PATCH /api/v1/stories/:storyId/status` (cross-ref Phase 4), `GET /api/v1/summary`, plus any component metadata endpoint already present
- [ ] Each entry lists HTTP method, path, description, and rate limit: context-package 60/min, summary 120/min, org/query 60/min, component-report 30/min, stories/status 30/min
- [ ] 429 response shape documented
- [ ] Info box: "All endpoints derive project scope from your API key. No project ID in the URL."
- [ ] Expiry info in key management section

Traces to: PRD-1-03, PRD-5-08, PRD-22-14.

---

### Task 12: Sprint Intelligence UI

(Unchanged, plus:)

- [ ] Renders `executionOrder` as a numbered dependency chain below parallel groups, with each row showing rank, storyDisplayId, rationale, and `dependsOn` badges

Traces to: PRD-11-01, PRD-11-02, PRD-11-03, PRD-11-04.

---

### Task 13: Context Package Assembly Pipeline (Addendum §4.6)

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace the existing `/api/v1/context-package` implementation with the deterministic 9-step pipeline per Addendum §4.6. Exactly one LLM call (Sonnet, step 8, 200-word brief). Target <3s p95 latency. |
| **Depends On** | Phase 6 (`search_org_kb`, `search_project_kb`, `component_edges`, `OrgComponent.embedding`, `KnowledgeArticle.embedding` per DECISION-05), Task 1, Task 1a, Task 5 helpers, Task 6 helpers |
| **Complexity** | L |

**Acceptance Criteria:**
- [ ] Route handler at `src/app/api/v1/context-package/route.ts` delegates to `src/lib/context-package/pipeline.ts`
- [ ] Pipeline implements the 9 steps in order; each step is a pure function under `src/lib/context-package/steps/`
- [ ] Step 3: 1-hop neighbors fetched via `component_edges` with max 10 neighbors per component, cycle protection (visited-set), excludes self-edges
- [ ] Step 5: discovery Q&A fetched via `search_project_kb(story.description, ['question'], { projectId })`
- [ ] Step 6: in-flight coordination query returns `Array<{ storyDisplayId, assignee, sharedComponents: string[] }>` for stories with status in (`IN_PROGRESS`, `IN_REVIEW`) sharing any impacted component
- [ ] Step 7 token-budget trim algorithm: count tokens via `tiktoken` (or equivalent) on the serialized package. If >20,000:
      1. Never trim: `story`, `acceptanceCriteria`, `businessContext`, `contextBrief`.
      2. Drop lowest-cosine-similarity articles first.
      3. Drop lowest-cosine-similarity discovery notes next.
      4. Drop lowest-cosine-similarity 1-hop neighbor components last.
      Tie-break: most-recently-updated first. Repeat until <=20,000 tokens or all droppable sections exhausted.
- [ ] If trim cannot reach 20k → return HTTP 507 `{error:'context_package_over_budget', tokenCount, minimumSections:['story','businessContext','contextBrief']}`
- [ ] Step 8: exactly one call to Sonnet via `src/lib/agent-harness/tasks/context-brief.ts`; output <=200 words; no other LLM calls anywhere in the pipeline
- [ ] Response schema matches §3.3 `/api/v1/context-package` entry exactly (includes `businessContext`, `impactedComponents[].neighbors[]`, `domains`, `discoveryNotes`, `inFlightStoryCoordination`, `articles`, `testCases`, `businessProcesses`, `decisions`, `contextBrief`, `_meta`)
- [ ] `testCases`: pulled from `TestCase` where `storyId = story.id` (Phase 4 artifact)
- [ ] `businessProcesses`: pulled from `BusinessProcess` joined via `BusinessProcessComponent` intersecting story's impacted components (Phase 6 artifact)
- [ ] `decisions`: pulled from `Decision` scoped to story's epic/feature (Phase 3 artifact)
- [ ] `SessionLog` entry per invocation with taskType `CONTEXT_PACKAGE_ASSEMBLY`, stores `tokenCount` and `latencyMs`
- [ ] p95 latency <3s measured over the Task 15 eval fixture suite
- [ ] Unit tests for each of the 9 steps
- [ ] Rate limited 60 req/min; 429 shape per §3.3
- [ ] Response piped through `stripSensitiveFields`
- [ ] Request logged via `logApiRequest`

**Files:**
- `src/app/api/v1/context-package/route.ts` (modify to invoke pipeline)
- `src/lib/context-package/pipeline.ts` (create)
- `src/lib/context-package/steps/step-01-story.ts` ... `step-09-return.ts` (create)
- `src/lib/context-package/token-budget.ts` (create)
- `src/lib/agent-harness/tasks/context-brief.ts` (create, Sonnet)

Traces to: PRD-5-34, PRD-12-04, PRD-12-05, PRD-12-06, PRD-22-13, PRD-22-14, PRD-22-16, ADD-4.6-03, ADD-4.6-04, ADD-4.6-05, ADD-4.6-07, DECISION-05, DECISION-08.

---

### Task 14: Sprint Health Briefing → Briefing/Status Pipeline (Phase 2)

| Attribute | Details |
|-----------|---------|
| **Scope** | Wire the sprint health briefing to the Phase 2 Briefing/Status Pipeline via `briefing_type = sprint_health`. Manual trigger from Sprint page plus daily cron. |
| **Depends On** | Phase 2 (Briefing/Status Pipeline publishes `BRIEFING_REQUESTED` contract with `sprint_health` type) |
| **Complexity** | M |

**Acceptance Criteria:**
- [ ] UI button on Sprint page calls `requestSprintHealthBriefing(sprintId)` server action
- [ ] Server action enqueues Inngest event `BRIEFING_REQUESTED` with payload `{ projectId, sprintId, briefingType: 'sprint_health', requestorUserId }`
- [ ] Phase 2 pipeline handles event and writes output to `GeneratedDocument` with `type = 'SPRINT_HEALTH_BRIEFING'`
- [ ] Daily cron `sprint-health-cron.ts` at 18:00 project-local time enumerates active sprints and fires the same event
- [ ] RBAC: any project member can trigger manually; the cron uses a system user identifier
- [ ] Failed pipeline executions visible in the Sprint page (read `GeneratedDocument` status)

**Files:**
- `src/actions/sprint-briefing.ts` (create)
- `src/lib/inngest/functions/sprint-health-cron.ts` (create)
- `src/components/sprints/sprint-briefing-button.tsx` (create)

Traces to: ADD-5.2.4-01.

---

### Task 15: Context Package Assembly Eval Fixtures

(Acceptance criteria unchanged from prior version.) Traces to: ADD §5.6.

---

### Task 16: Tier 1 Project Summary Endpoint

| Attribute | Details |
|-----------|---------|
| **Scope** | Build `GET /api/v1/summary` returning the always-loaded Tier 1 project summary Claude Code pulls on task pickup. |
| **Depends On** | Task 1, Task 1a, Phase 3 (`Decision` model), Phase 4 (Sprint model) |
| **Complexity** | M |

**Acceptance Criteria:**
- [ ] Route `GET /api/v1/summary` exists, requires API key auth via `withApiAuth`
- [ ] Response conforms to §3.3 `/api/v1/summary` schema
- [ ] `architecturalPatterns`: from `Project.architecturalPatterns` or aggregated `Decision` tagged `ARCHITECTURAL_PATTERN`
- [ ] `namingConventions`: from `Project.namingConventions`
- [ ] `keyDecisions`: latest 10 `Decision` rows, `date DESC`
- [ ] `guardrails`: six PRD §15 guardrail references
- [ ] `currentSprintFocus`: active `Sprint` (`status = IN_PROGRESS`) with its stories' display IDs; null when no active sprint
- [ ] `howToRequestMore`: static map of available endpoints
- [ ] Response cached 5 minutes per project (Next.js `revalidate` or route-segment cache)
- [ ] Unit tests: empty-project, no-active-sprint cases
- [ ] Rate limited 120 req/min per API key; 429 shape per §3.3
- [ ] Response piped through `stripSensitiveFields`
- [ ] Request logged via `logApiRequest`

**Files:**
- `src/app/api/v1/summary/route.ts` (create)
- `src/lib/project-summary/assemble.ts` (create)

Traces to: PRD-5-38, PRD-12-02, PRD-12-03, PRD-22-13, PRD-22-14, PRD-22-16, DECISION-08.

---

### Task 17: ApiRequestLog Retention Sweep

| Attribute | Details |
|-----------|---------|
| **Scope** | Inngest cron that deletes `ApiRequestLog` rows older than 90 days. |
| **Depends On** | Task 1 |
| **Complexity** | S |

**Acceptance Criteria:**
- [ ] Inngest cron `api-request-log-retention` runs daily at 02:00 UTC
- [ ] Deletes rows where `createdAt < now() - 90 days`
- [ ] Emits metric `{ deletedCount, runMs }` on completion
- [ ] Unit test confirms the retention boundary

**Files:**
- `src/lib/inngest/functions/api-request-log-retention.ts` (create)

Traces to: PRD-22-16, DECISION-08.

---

## Summary

| # | Task | Complexity | Depends On | Reqs Covered |
|---|------|-----------|------------|--------------|
| 1 | Schema migration + ApiRequestLog | S | None | REQ-001, 011, 012, 017 |
| 1a | Shared helpers (stripSensitiveFields + logApiRequest) | S | Task 1 | REQ-016, 017 |
| 2 | Harness refactor | M | Task 1, Phase 2 | REQ-013 |
| 3 | Capacity + parallelization + executionOrder + dev attribution | M | Task 2 | REQ-001, 002, 003, 018 |
| 4 | Mid-sprint triggers + dismissal | M | Task 3 | REQ-004, 005 |
| 5 | [Superseded] Data helpers: epic/feature + discovery | S | Task 1 | REQ-006, 008 (feeds Task 13) |
| 6 | [Superseded] Knowledge article helper | S | Task 1 | REQ-007 (feeds Task 13) |
| 7 | Org query endpoint — search_org_kb wrapper | M | Task 1, 1a, Phase 6 | REQ-009 |
| 8 | Component report endpoint | M | Task 1, 1a, Phase 9 | REQ-010 |
| 9 | API key expiry + rotation | M | Task 1 | REQ-011 |
| 10 | Brownfield warning | M | Task 1 | REQ-012 |
| 11 | Developer API docs update | S | Tasks 7, 8, 9, 16 | REQ-014 |
| 12 | Sprint intelligence UI | M | Task 3 | REQ-001, 002, 003 (UI) |
| 13 | Context Package Assembly pipeline | L | Phase 6, Tasks 1, 1a, 5, 6 | Addendum §4.6, supersedes REQ-006/007/008 |
| 14 | Sprint health briefing routing | M | Phase 2 | Addendum §5.2.4 |
| 15 | Eval fixtures | M | Task 13, Phase 11 | Addendum §5.6 |
| 16 | Tier 1 project summary | M | Tasks 1, 1a | REQ-015 |
| 17 | ApiRequestLog retention sweep | S | Task 1 | REQ-017 |
