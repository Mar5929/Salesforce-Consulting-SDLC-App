# Phase 5 Spec: Sprint, Developer API

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Depends On: Phase 4 (Work Management), Phase 6 (Org/Knowledge — added per Addendum v1 for `search_org_kb`, `search_project_kb`, `component_edges`), Phase 9 (`assertProjectWritable` per DECISION-10)
> Status: Draft
> Last Updated: 2026-04-13

---

## 1. Scope Summary

Complete sprint intelligence with capacity assessment, parallelization output, execution ordering, developer attribution, and mid-sprint re-analysis triggers. Replace the naive Context Package implementation with the Addendum §4.6 deterministic 9-step pipeline. Rewrite the Org Query endpoint as a thin wrapper over Phase 6 `search_org_kb`. Build the missing component report endpoint, the Tier 1 project summary endpoint, API request logging, and token-field scrubbing on all responses. Add API key expiry/rotation. Implement the brownfield scratch org warning. Refactor sprint intelligence to use the agent harness. Align URL documentation with key-derived routing.

**In scope:** 14 original domain gaps + Addendum v1 amendments + Wave 0 audit fixes (12 gap fixes) absorbed into spec.
**Orphan requirements absorbed per DECISION-08:** PRD-11-01 (Execution Mapping), PRD-22-13 (token field stripping), PRD-22-16 (API request logging 90 days).
**GAP-SPRINT-013 decision:** Update PRD endpoint documentation to match the key-derived `/api/v1/` routing.

---

## Addendum v1 Amendments (April 13, 2026)

These amendments integrate PRD Addendum v1 into Phase 5 and are authoritative where they conflict with the original REQs (Addendum-wins per CLAUDE.md).

- **Context Package Assembly rewrite:** Context Package Assembly is a deterministic 9-step pipeline (Addendum §4.6), not an agent loop. REQs 2.6–2.8 below are superseded by this pipeline; they remain as data-assembly building blocks consumed by steps 1 and 5 of the pipeline. See Task 13 for the authoritative implementation. Steps:
  1. Fetch story + acceptance criteria + parent epic/feature.
  2. Read `story.impacted_components` (Layer 1 component IDs).
  3. For each component: fetch + 1-hop neighbors via `component_edges`, domain memberships, annotations.
  4. For each unique domain: fetch domain description + annotations.
  5. Fetch related discovery Q&A via `search_project_kb` (story description as query).
  6. Fetch in-flight stories sharing any impacted component (coordination flags).
  7. Apply token budget (target 20k tokens); trim by lowest semantic similarity to story description.
  8. Single Sonnet call: generate 200-word "context brief" header.
  9. Return structured package.

  Latency target: <3s p95. Only one LLM call (step 8). Everything else is SQL + vector search. (Traces to: ADD-4.6-03, ADD-4.6-04, ADD-4.6-05, ADD-4.6-07)
- **Org Query rewrite:** `/api/v1/org/query` is a thin wrapper over `search_org_kb` (Phase 6). Keyword parsing survives only as a pre-filter for structured intents; the LIKE fallback is removed as the primary path. (Traces to: ADD-4.6-06, DECISION-05)
- **Sprint health briefing routing:** Sprint health briefing routes through the Briefing/Status Pipeline (Phase 2) with `briefing_type = sprint_health`. (Traces to: ADD-5.2.4-01)
- **Phase 6 dependency:** `search_org_kb`, `search_project_kb`, `component_edges`, `OrgComponent.embedding`, and `KnowledgeArticle.embedding` must exist before Tasks 7 and 13 can execute. Phase 5 consumes these via `search_org_kb` only per DECISION-05.
- **Phase 9 dependency:** All mutation endpoints (component-report, any story-touching write) import `assertProjectWritable(projectId)` from Phase 9 per DECISION-10.
- **Eval fixture ownership (Context Package Assembly):** Phase 5 owns 10 fixtures under `/evals/context_package_assembly/`; Phase 11 hosts the harness. See Task 15. (Traces to: ADD §5.6)

---

## 2. Functional Requirements

### 2.1 Sprint Capacity Assessment (REQ-SPRINT-001)

Traces to: PRD-11-04

- **What it does:** Computes sprint capacity from team developer count and velocity target, then passes this to the AI for over/under-commitment flagging.
- **Inputs:** Sprint ID. Developer count from `ProjectMember` where `role = DEVELOPER` and `status = ACTIVE`. Optional `velocityTarget` on Sprint.
- **Outputs:** `capacityAssessment` object in `cachedAnalysis`: `{ developerCount, totalPoints, pointsPerDeveloper, velocityTarget, status: "ON_TRACK" | "OVER_COMMITTED" | "UNDER_COMMITTED", recommendation }`.
- **Business rules:**
  - Add `velocityTarget` (Int, nullable) to Sprint. When null, default heuristic: 10 points per developer per sprint.
  - Total points = SUM of `storyPoints` for all stories in the sprint.
  - Status thresholds: `OVER_COMMITTED` if totalPoints > velocityTarget * 1.2, `UNDER_COMMITTED` if totalPoints < velocityTarget * 0.5, else `ON_TRACK`.
  - AI prompt receives capacity data and generates a natural language recommendation.
- **Files:** `prisma/schema.prisma`, `src/lib/inngest/functions/sprint-intelligence.ts`, `src/components/sprints/sprint-intelligence-panel.tsx`

### 2.2 Parallelization Analysis + Execution Ordering (REQ-SPRINT-002)

Traces to: PRD-11-01, PRD-11-02

- **What it does:** Adds explicit `parallelGroups` and `executionOrder` arrays to sprint intelligence output. Parallelization identifies groups of stories safe to work simultaneously; execution ordering ranks stories by cross-component dependency so earlier-ranked stories must complete before later ones when they share or depend on impacted components.
- **Inputs:** Sprint stories with their `storyComponents`.
- **Outputs (added to `cachedAnalysis`):**
  - `parallelGroups: Array<{ groupId: number, storyDisplayIds: string[], rationale: string }>`.
  - `executionOrder: Array<{ rank: number, storyDisplayId: string, rationale: string, dependsOn: string[] }>`.
- **Business rules:**
  - Prompt: "Group stories that share no impacted components into parallel work groups. Each story appears in exactly one group."
  - Prompt: "Order stories such that a story whose impacted components are modified by another story has a higher rank (runs after). `dependsOn` lists displayIds of prerequisite stories."
  - Validator: every sprint story appears exactly once in `parallelGroups`; every sprint story appears exactly once in `executionOrder`; every `dependsOn` entry references a sprint story.
- **Files:** `src/lib/agent-harness/tasks/sprint-intelligence.ts`, `src/lib/inngest/functions/sprint-intelligence.ts`, `src/components/sprints/sprint-intelligence-panel.tsx`

### 2.3 Developer Attribution in Sprint Intelligence (REQ-SPRINT-003)

Traces to: PRD-11-03, PRD-11-06

- **What it does:** Loads assignee information for sprint stories and includes developer names in conflict output.
- **Inputs:** Sprint stories with `assigneeId` joined to `ProjectMember.displayName`.
- **Outputs:** Conflict objects include `storyAAssignee` and `storyBAssignee`.
- **Business rules:** Story select adds `assignee: { select: { displayName: true, id: true } }`. Null assignees show "Unassigned".
- **Files:** `src/lib/inngest/functions/sprint-intelligence.ts`, `src/components/sprints/conflict-banner.tsx`

### 2.4 Mid-Sprint Re-Analysis Triggers (REQ-SPRINT-004)

Traces to: PRD-11-05

- **What it does:** Fires sprint intelligence re-analysis on story status changes and reassignment.
- **Inputs:** `STORY_STATUS_CHANGED`, `STORY_REASSIGNED` events.
- **Outputs:** Updated `cachedAnalysis`.
- **Business rules:** Add `STORY_REASSIGNED` to events. Debounce with 30-second Inngest concurrency period.
- **Files:** `src/actions/stories.ts`, `src/lib/inngest/events.ts`, `src/lib/inngest/functions/sprint-intelligence.ts`

### 2.5 Conflict Dismissal Persistence (REQ-SPRINT-005)

Traces to: PRD-11-03 (UX)

- **What it does:** Persists conflict dismissals to `cachedAnalysis`.
- **Business rules:** `dismissSprintConflict` server action writes `dismissed: true`. Stable key = sorted story display IDs + overlapping component name. Re-analysis carries forward dismissals by stable key.
- **Files:** `src/actions/sprint-intelligence.ts`, `src/components/sprints/sprint-intelligence-panel.tsx`, `src/lib/inngest/functions/sprint-intelligence.ts`

### 2.6 Context Package: Parent Epic/Feature (REQ-SPRINT-006) [Superseded]

Traces to: PRD-12-05, ADD-4.6-04

> **SUPERSEDED by Addendum §4.6 pipeline; see Task 13.** REQs 2.6–2.8 remain as data-assembly steps used by the pipeline, not as standalone API behaviors. The pipeline (Task 13) is the authoritative implementation for the `/api/v1/context-package` response.

- Retained content: Story query joins epic and feature with `{ id, name, prefix, description }`. Exposed under `businessContext` in the final pipeline response (Task 13 step 1).

### 2.7 Context Package: Full Knowledge Article Content (REQ-SPRINT-007) [Superseded]

Traces to: PRD-12-05, ADD-4.6-04

> **SUPERSEDED by Addendum §4.6 pipeline; see Task 13.** Article selection now runs through step 5 (Q&A hybrid search) and step 4 (domain context). Standalone cosine query on articles is replaced by the pipeline's semantic retrieval via `search_project_kb` plus Layer 3 KA embeddings per DECISION-05.

- Retained content: Full `content` field (not summaries) in the final response; exclude articles with `effectivenessScore < -0.3` AND `useCount >= 10`; cap to 5 articles; increment `useCount` on inclusion.

### 2.8 Context Package: Discovery Notes (REQ-SPRINT-008) [Superseded]

Traces to: PRD-12-05, ADD-4.6-04

> **SUPERSEDED by Addendum §4.6 pipeline; see Task 13.** Discovery notes are assembled by step 5 (Q&A via `search_project_kb`), not a standalone scoped query.

- Retained content: Engagement-scoped questions always included; epic/feature-scoped questions filtered by story parent; ordered by `answeredDate DESC`, limit 20.

### 2.9 Org Query Endpoint (REQ-SPRINT-009)

Traces to: PRD-5-35, PRD-12-07, ADD-4.6-06, DECISION-05

- **What it does:** Natural language query endpoint for Claude Code, implemented as a thin wrapper over Phase 6 `search_org_kb`.
- **Inputs:** `GET /api/v1/org/query?q=<query>` with API key auth.
- **Behavior:** Call `search_org_kb(query, options)` with `options = { projectId, entityTypes: ['component','article','story'], filters: parseOrgQueryFilters(q), topK: 20 }`. If `parseOrgQueryFilters` extracts structured filters (e.g., `componentType=FIELD, parent=Account`), pass them as hard filters. Otherwise forward the raw query for hybrid retrieval.
- **Outputs:** `{ queryInterpretation, components: OrgComponentHit[], articles: KnowledgeArticleHit[], relatedStories: StoryHit[], synthesis?: string }`. Response types pinned under §3.3.
- **Error handling:** If `search_org_kb` is unavailable (Phase 6 not deployed), return HTTP 503 `{error:'org_kb_unavailable'}`.
- **Non-functional:** Rate limited 60 req/min per API key. Logged via `logApiRequest` (see §2.17). Response scrubbed via `stripSensitiveFields` (see §2.16).
- **Files:** `src/app/api/v1/org/query/route.ts`, `src/lib/org-query/parse-query.ts` (pre-filter extraction only).

### 2.10 Component Report Endpoint (REQ-SPRINT-010)

Traces to: PRD-5-37

- **What it does:** Accepts reports of components created/modified during story implementation.
- **Inputs:** `POST /api/v1/component-report` with `{ storyId, components: [{ apiName, componentType, action }] }`.
- **Business rules:** Validate story belongs to API key's project. Call `assertProjectWritable(projectId)` per DECISION-10 before any write. For each component: look up `OrgComponent` by `(projectId, apiName, componentType)`; upsert `StoryComponent`; create PLANNED `OrgComponent` if no match. Use `prisma.$transaction`.
- **Non-functional:** Rate limited 30 req/min. Logged via `logApiRequest`. Response scrubbed.
- **Files:** `src/app/api/v1/component-report/route.ts`.

### 2.11 API Key Expiry and Rotation (REQ-SPRINT-011)

Traces to: PRD-22-15

- **Business rules:** Add `expiresAt` (DateTime, nullable) to `ApiKey`. Default 90 days. `withApiAuth` checks expiry and returns 401 with `{ error: "API key expired", expiredAt }`. `rotateApiKey(oldKeyId)` is transactional.
- **Files:** `prisma/schema.prisma`, `src/lib/api-keys/generate.ts`, `src/lib/api-keys/auth.ts`, `src/actions/api-keys.ts`, `src/app/(dashboard)/projects/[projectId]/settings/developer-api/developer-api-client.tsx`.

### 2.12 Brownfield Scratch Org Warning (REQ-SPRINT-012)

Traces to: PRD-14-02, PRD-14-04

- **Business rules:** Add `devEnvironmentType` enum on `ProjectMember`. Warn when `project.engagementType IN (BUILD_PHASE, MANAGED_SERVICES, RESCUE_TAKEOVER)` AND any active developer has `devEnvironmentType = SCRATCH_ORG`. Informational only.
- **Files:** `prisma/schema.prisma`, `src/components/projects/brownfield-warning.tsx`, sprint planning page, project members list.

### 2.13 Sprint Intelligence Harness Integration (REQ-SPRINT-013)

Traces to: PRD-6-07, PRD-6-14 (harness boundary)

- **Business rules:** Refactor sprint intelligence to call the execution engine via `sprintIntelligenceTask`. Context loader performs data queries. Output validator enforces schema (including `parallelGroups` and `executionOrder`). `SessionLog` entry per run with taskType `SPRINT_ANALYSIS`.
- **Files:** `src/lib/inngest/functions/sprint-intelligence.ts`, `src/lib/agent-harness/tasks/sprint-intelligence.ts`.

### 2.14 Developer API Documentation (REQ-SPRINT-014)

Traces to: PRD-5-08, PRD-1-03

- **Business rules:** Update docs to reflect `/api/v1/` key-derived routing. List all endpoints with rate limits. Note "All endpoints derive the project scope from your API key."
- **Files:** `src/app/(dashboard)/projects/[projectId]/settings/developer-api/developer-api-client.tsx`.

### 2.15 Tier 1 Project Summary Endpoint (REQ-SPRINT-015)

Traces to: PRD-5-38, PRD-12-02, PRD-12-03

- **What it does:** Returns the always-loaded Tier 1 project summary that Claude Code pulls on every task pickup.
- **Inputs:** `GET /api/v1/summary` with API key auth.
- **Outputs:** `{ architecturalPatterns: string[], namingConventions: object, keyDecisions: { id, title, summary }[], guardrails: GuardrailRef[], currentSprintFocus: { sprintId, name, goals, storyDisplayIds: string[] }, howToRequestMore: object }`. Fields populated from:
  - `architecturalPatterns`: `Project.architecturalPatterns` or aggregated from `Decision` entries tagged `ARCHITECTURAL_PATTERN`.
  - `namingConventions`: `Project.namingConventions`.
  - `keyDecisions`: latest 10 `Decision` rows for project, ordered by date desc.
  - `guardrails`: six PRD §15 guardrail references (governor, bulkification, tests, naming, security, sharing).
  - `currentSprintFocus`: active `Sprint` (status `IN_PROGRESS`) with its stories' display IDs.
  - `howToRequestMore`: static map of available endpoints + payload hints.
- **Non-functional:** Rate limited 120 req/min per TECHNICAL_SPEC §3.11.2. Response cached 5 minutes per project. Logged via `logApiRequest`. Response scrubbed.
- **Files:** `src/app/api/v1/summary/route.ts`, `src/lib/project-summary/assemble.ts`.

### 2.16 Response Token-Field Scrubbing (REQ-SPRINT-016)

Traces to: PRD-22-13, DECISION-08

- **What it does:** Strips sensitive/token fields from all API response bodies before JSON serialization.
- **Business rules:** Every new or modified `/api/v1/*` endpoint (context-package, org/query, component-report, summary, and any story-mutation endpoints routed through this phase) pipes its response object through `stripSensitiveFields()` before `NextResponse.json`. The helper removes keys matching `accessToken`, `refreshToken`, `apiKeyHash`, `secret`, and nested occurrences on related entities (`ProjectMember`, `Project`, `ApiKey`). If the helper does not exist in Phase 1 shared-lib, create it at `src/lib/serialization/strip-sensitive-fields.ts`.
- **Files:** `src/lib/serialization/strip-sensitive-fields.ts` (create or reuse), every endpoint listed above.

### 2.17 API Request Logging (REQ-SPRINT-017)

Traces to: PRD-22-16, DECISION-08

- **What it does:** Persists every `/api/v1/*` request with key ID, endpoint, method, status, latency, and timestamp; retains 90 days.
- **Business rules:**
  - `ApiRequestLog` model: `{ id, projectId, apiKeyId, endpoint, method, status, latencyMs, createdAt, errorCode? }`. Index `(projectId, createdAt)` and `(apiKeyId, createdAt)`.
  - `logApiRequest({ apiKeyId, projectId, endpoint, method, status, latencyMs, errorCode? })` middleware wraps `withApiAuth`. Logs both success and failure paths, including 401/403 rejections.
  - Retention sweep: Inngest cron `api-request-log-retention` runs daily, deletes rows older than 90 days.
  - If `ApiRequestLog` does not already exist from an earlier phase, add its model to Task 1 (the schema migration task).
- **Files:** `prisma/schema.prisma` (new model), `src/lib/api-keys/auth.ts` (middleware wrapper), `src/lib/inngest/functions/api-request-log-retention.ts` (cron).

### 2.18 AI Execution Mapping (REQ-SPRINT-018)

Traces to: PRD-11-01, DECISION-08

Covered under §2.2 `executionOrder` output. Listed here for explicit PRD-11-01 traceability per the requirement-index.

---

## 3. Technical Approach

### 3.1 Implementation Strategy

1. Schema migration (REQ-001, 011, 012, 017) — Sprint `velocityTarget`, ApiKey `expiresAt`, ProjectMember `devEnvironmentType`, `ApiRequestLog` table + cron.
2. Shared helpers (REQ-016, 017) — `stripSensitiveFields`, `logApiRequest` middleware wrapper.
3. Sprint intelligence core (REQ-001, 002, 003, 013, 018) — Harness refactor, capacity, parallelization, execution ordering, developer attribution.
4. Sprint triggers (REQ-004, 005) — Mid-sprint events, dismissal persistence.
5. Context Package pipeline (Task 13) — Addendum §4.6 9-step pipeline replaces REQs 2.6–2.8.
6. New API endpoints (REQ-009, 010, 015) — Org query (`search_org_kb` wrapper), component report, Tier 1 summary.
7. API key lifecycle (REQ-011) — Expiry enforcement, rotation.
8. Brownfield warning + docs (REQ-012, 014).
9. Sprint health briefing routing (Task 14) — Addendum §5.2.4 pipeline wiring.

### 3.2 File/Module Structure

```
prisma/
  schema.prisma                                 -- MODIFY (Sprint, ApiKey, ProjectMember + ApiRequestLog)
src/
  lib/
    serialization/
      strip-sensitive-fields.ts                 -- CREATE (REQ-016)
    context-package/
      pipeline.ts                               -- CREATE (orchestrator, Task 13)
      steps/                                    -- CREATE (9 step modules)
      token-budget.ts                           -- CREATE (trim algorithm)
    project-summary/
      assemble.ts                               -- CREATE (REQ-015)
    inngest/
      functions/
        sprint-intelligence.ts                  -- MODIFY (harness)
        api-request-log-retention.ts            -- CREATE (90-day sweep)
        sprint-health-cron.ts                   -- CREATE (Task 14)
    agent-harness/
      tasks/
        sprint-intelligence.ts                  -- MODIFY (exec order)
        context-brief.ts                        -- CREATE (Sonnet call, step 8)
    api-keys/
      auth.ts                                   -- MODIFY (expiry + logApiRequest wrapper)
      generate.ts                               -- MODIFY (expiresAt)
    org-query/
      parse-query.ts                            -- CREATE (pre-filter only)
  actions/
    sprint-briefing.ts                          -- CREATE (Task 14)
    sprint-intelligence.ts                      -- CREATE (dismissSprintConflict)
    api-keys.ts                                 -- MODIFY (rotateApiKey)
  app/api/v1/
    context-package/route.ts                    -- MODIFY (invokes pipeline)
    org/query/route.ts                          -- CREATE
    component-report/route.ts                   -- CREATE
    summary/route.ts                            -- CREATE
  components/
    sprints/
      sprint-intelligence-panel.tsx             -- MODIFY
      sprint-briefing-button.tsx                -- CREATE
      conflict-banner.tsx                       -- MODIFY
    projects/
      brownfield-warning.tsx                    -- CREATE
```

### 3.3 API Contracts

**POST /api/v1/component-report**
```json
// Request
{ "storyId": "cuid", "components": [ { "apiName": "Account_Trigger", "componentType": "APEX_TRIGGER", "action": "MODIFIED" } ] }
// Response 200
{ "linked": 3, "created": 1, "unmatched": [ { "apiName": "NewFlow__c", "reason": "No existing org component" } ] }
```

**GET /api/v1/org/query?q=<query>**
```jsonc
// Response 200 (shape returned by search_org_kb)
{
  "queryInterpretation": { "type": "FIELD_ON" | "TRIGGER_ON" | "FLOW_ON" | "INTEGRATION" | "STORY_TOUCH" | "KNOWLEDGE" | "FALLBACK_HYBRID", "params": { "object": "Account" } },
  "components": [ { "id": "string", "apiName": "string", "componentType": "ComponentType", "label": "string|null", "parentApiName": "string|null", "score": 0.87 } ],
  "articles":   [ { "id": "string", "title": "string", "summary": "string|null", "content": "string", "score": 0.79 } ],
  "relatedStories": [ { "id": "string", "displayId": "string", "title": "string", "status": "StoryStatus", "score": 0.74 } ],
  "synthesis": "string|undefined"
}
// Response 503 (Phase 6 not available)
{ "error": "org_kb_unavailable" }
// Response 429
{ "error": "rate_limited", "retryAfterSeconds": 42 }   // plus header Retry-After: 42
```

**GET /api/v1/context-package?storyId=<id>** (Task 13, 9-step pipeline)
```jsonc
{
  "story": { "id": "string", "displayId": "string", "title": "string", "description": "string", "acceptanceCriteria": [ { "id": "string", "text": "string" } ] },
  "businessContext": { "epic": { "id":"string","name":"string","prefix":"string","description":"string|null" }, "feature": { "id":"string","name":"string","prefix":"string","description":"string|null" } | null },
  "impactedComponents": [ { "id":"string", "apiName":"string", "componentType":"ComponentType", "neighbors": [ { "id":"string", "apiName":"string", "edgeType":"string" } ], "domains": [ "string" ], "annotations": [ "string" ] } ],
  "domains": [ { "id":"string", "name":"string", "description":"string|null", "annotations": [ "string" ] } ],
  "discoveryNotes": [ { "displayId":"string", "questionText":"string", "answerText":"string", "answeredDate":"ISO8601" } ],
  "inFlightStoryCoordination": [ { "storyDisplayId":"string", "assignee":"string|null", "sharedComponents": [ "string" ] } ],
  "articles": [ { "id":"string","title":"string","summary":"string|null","content":"string","articleType":"string","confidence":"string|null" } ],
  "testCases": [ { "displayId":"string", "title":"string", "steps":"string", "expected":"string" } ],
  "businessProcesses": [ { "id":"string", "name":"string", "description":"string|null", "componentMappings": [ "string" ] } ],
  "decisions": [ { "id":"string", "title":"string", "summary":"string|null", "date":"ISO8601" } ],
  "contextBrief": "string (<=200 words, Sonnet output, step 8)",
  "_meta": { "tokenCount": 0, "latencyMs": 0, "pipelineVersion": "v2" }
}
// Response 507 Insufficient Storage (trim cannot meet 20k budget)
{ "error": "context_package_over_budget", "tokenCount": 0, "minimumSections": [ "story", "businessContext", "contextBrief" ] }
```

**GET /api/v1/summary**
```jsonc
{
  "architecturalPatterns": [ "string" ],
  "namingConventions": { "apex": "string", "lwc": "string", "flows": "string" },
  "keyDecisions": [ { "id":"string", "title":"string", "summary":"string|null" } ],
  "guardrails": [ { "id":"string", "name":"string", "summary":"string", "referencePrdSection":"string" } ],
  "currentSprintFocus": { "sprintId":"string|null", "name":"string|null", "goals":"string|null", "storyDisplayIds": [ "string" ] },
  "howToRequestMore": { "contextPackage":"GET /api/v1/context-package?storyId=...", "orgQuery":"GET /api/v1/org/query?q=...", "summaryTtlSeconds": 300 }
}
```

**429 (rate limited) contract (applies to every endpoint):**
```json
{ "error": "rate_limited", "retryAfterSeconds": 42 }
```
Header: `Retry-After: <seconds>`.

### 3.4 Data Changes

**Prisma migration (single):**
- `Sprint`: add `velocityTarget Int?`
- `ApiKey`: add `expiresAt DateTime?`
- `ProjectMember`: add `devEnvironmentType DevEnvironmentType?`
- New enum `DevEnvironmentType`: `SCRATCH_ORG`, `DEVELOPER_SANDBOX`, `PARTIAL_SANDBOX`, `FULL_SANDBOX`, `DEVELOPER_EDITION`
- New model `ApiRequestLog { id String @id @default(cuid()); projectId String; apiKeyId String; endpoint String; method String; status Int; latencyMs Int; errorCode String?; createdAt DateTime @default(now()); @@index([projectId, createdAt]); @@index([apiKeyId, createdAt]); }`

All new fields nullable or default-initialized. No backfill required.

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| Sprint with 0 stories | Capacity returns `{ totalPoints: 0, status: "UNDER_COMMITTED" }` | N/A |
| Sprint with 0 developers | `developerCount: 0`, recommendation covers | N/A |
| Story with null storyPoints | Excluded from capacity total | N/A |
| Story with null assignee in conflict | Shows "Unassigned" | N/A |
| Execution order contains cycle | Validator rejects analysis, AI is re-prompted with cycle detected | N/A |
| Mid-sprint rapid status changes | Debounced via Inngest concurrency period (30s) | N/A |
| Dismissed conflict recurs on re-analysis | Dismissal carried forward by stable key | N/A |
| Context package for story with no epic description | `businessContext.epic.description` is null | N/A |
| Context package token count >20k after all trim passes | Trim by lowest semantic similarity: (1) protect story + AC + businessContext + contextBrief, (2) drop lowest-similarity articles, (3) drop lowest-similarity discovery notes, (4) drop lowest-similarity 1-hop neighbor components. Tie-break by most-recently-updated. | HTTP 507 `{error:'context_package_over_budget', tokenCount, minimumSections}` if still over budget |
| Context package: `search_org_kb` or `search_project_kb` unavailable | Pipeline short-circuits step 5 with empty discoveryNotes and logs warning | HTTP 200 with partial package; `_meta.degraded = true` |
| Context package: `component_edges` empty for a component | Treat as no neighbors; proceed | N/A |
| Org query: `search_org_kb` unavailable | Endpoint returns 503 | `{error:'org_kb_unavailable'}` |
| Rate limit exceeded on any endpoint | 429 with `Retry-After` header | `{error:'rate_limited', retryAfterSeconds:N}` |
| API response contains entity with token field (`accessToken`, `refreshToken`, `apiKeyHash`) | `stripSensitiveFields` removes before JSON encode | N/A — unit test asserts absence |
| API request logging write fails | Log error to application logger, do not block the request | Request succeeds; log failure emits ops alert |
| Component report for story not in API key's project | Rejected | HTTP 403 |
| Component report on archived project | `assertProjectWritable` throws | HTTP 409 `{error:'project_archived'}` per DECISION-10 |
| Component report with unknown `componentType` | Zod rejects | HTTP 400 |
| API key expired | Rejected at `withApiAuth` | HTTP 401 `{error:'API key expired', expiredAt}` |
| `rotateApiKey` on revoked key | Rejected | HTTP 400 |
| Brownfield warning with no developers registered | No warning | N/A |
| Sprint health briefing: Phase 2 pipeline unavailable | Inngest retries per Phase 2 retry policy | N/A |

---

## 5. Integration Points

### From Prior Phases

**Phase 1 (RBAC + shared lib):**
- `requireRole` gates all new server actions.
- `withApiAuth` middleware extended for expiry checking and request logging.
- `stripSensitiveFields` lives here if already present; otherwise Phase 5 creates it.

**Phase 2 (Agent Harness + Pipelines):**
- Execution engine for sprint intelligence refactor (REQ-013).
- Briefing/Status Pipeline accepts `briefing_type = sprint_health` event: `BRIEFING_REQUESTED` with payload `{ projectId, sprintId, briefingType: 'sprint_health', requestorUserId }` → `GeneratedDocument` with `type = 'SPRINT_HEALTH_BRIEFING'`. (Cite: ADD-5.2.4-01.)
- Rate limiting infrastructure applies to all new endpoints.

**Phase 3 (Discovery):** Answered questions with `answerText` feed into the pipeline's step 5 retrieval. `Decision` model supplies entries for the Tier 1 summary `keyDecisions` and Tier 2 pipeline `decisions`.

**Phase 4 (Work Management):** DRAFT-to-READY validation. `TestCase` rows feed pipeline step. `Story.impacted_components` drives steps 2–3.

**Phase 6 (Depends On, Addendum v1):** Consumed via the following pinned contracts (Phase 6 must publish before Phase 5 Tasks 7 and 13 start):
- `search_org_kb(query: string, options: { projectId: string; entityTypes?: Array<'component'|'article'|'story'>; filters?: Record<string, unknown>; topK?: number; synthesize?: boolean }) => Promise<{ components: OrgComponentHit[]; articles: KnowledgeArticleHit[]; relatedStories: StoryHit[]; queryInterpretation: object; synthesis?: string }>`.
- `search_project_kb(query: string, entityTypes?: string[], filters?: Record<string, unknown>) => Promise<SearchResult[]>`.
- `component_edges` table: `(projectId, fromComponentId, toComponentId, edgeType, weight)`, index `(projectId, fromComponentId)`.
- `OrgComponent.embedding` vector(512), `embeddingStatus` enum.
- `KnowledgeArticle.embedding` vector(512) (DECISION-05).
- `BusinessProcess` model (Phase 6 deep-dive to confirm shape) with `BusinessProcessComponent` join.

**Phase 9 (Archive read-only):**
- `assertProjectWritable(projectId)` imported at every mutation entry point (Task 8, any component-report write). Per DECISION-10. Tests verify archived-project calls return 409.

### For Future Phases

**Phase 7 (Dashboards):** Sprint capacity, `executionOrder`, `parallelGroups`, brownfield warnings surface on sprint dashboards.

---

## 6. Acceptance Criteria

- [ ] Sprint model has `velocityTarget` field (nullable)
- [ ] ApiKey model has `expiresAt` field
- [ ] ProjectMember model has `devEnvironmentType` field
- [ ] `ApiRequestLog` model created with (projectId, createdAt) + (apiKeyId, createdAt) indexes
- [ ] `stripSensitiveFields` helper available and unit tested
- [ ] `logApiRequest` middleware wraps every `/api/v1/*` route (success + failure paths)
- [ ] Retention Inngest cron deletes `ApiRequestLog` rows older than 90 days
- [ ] Sprint intelligence routes through agent harness, outputs `capacityAssessment`, `parallelGroups`, and `executionOrder`
- [ ] Every sprint story appears exactly once in both `parallelGroups` and `executionOrder`
- [ ] Every `executionOrder.dependsOn` entry references a sprint story
- [ ] Developer names appear in conflict output; "Unassigned" for null
- [ ] Story status change and reassignment fire sprint re-analysis (debounced 30s)
- [ ] Conflict dismissal persists to `cachedAnalysis` and carries forward by stable key
- [ ] Context Package Assembly implements the 9-step pipeline; response conforms to §3.3 schema
- [ ] Context Package token count <=20k (or 507 returned); protected sections never trimmed
- [ ] Context Package exactly one Sonnet call (step 8); p95 latency <3s over eval fixtures
- [ ] Context Package includes testCases, businessProcesses, decisions, inFlightStoryCoordination
- [ ] `/api/v1/org/query` is a `search_org_kb` wrapper; 503 when Phase 6 unavailable
- [ ] `/api/v1/summary` returns Tier 1 summary with all 6 documented fields; cached 5 minutes
- [ ] `/api/v1/component-report` calls `assertProjectWritable` before writes
- [ ] Every endpoint documents its rate limit: context-package 60, summary 120, org/query 60, component-report 30, stories/status 30
- [ ] 429 responses include `{error:'rate_limited', retryAfterSeconds}` and `Retry-After` header
- [ ] All response payloads pass through `stripSensitiveFields`; unit tests assert no token keys present
- [ ] All API requests (success + failure) are logged to `ApiRequestLog`
- [ ] `withApiAuth` rejects expired keys with 401
- [ ] `rotateApiKey` transactional; new key returned once; rejects revoked keys
- [ ] Brownfield warning displayed for BUILD_PHASE/MANAGED_SERVICES/RESCUE_TAKEOVER + SCRATCH_ORG
- [ ] Sprint health briefing button + daily cron both emit `BRIEFING_REQUESTED` with `briefing_type='sprint_health'`; Phase 2 pipeline writes `GeneratedDocument` type `SPRINT_HEALTH_BRIEFING`
- [ ] Eval fixtures: 10 labeled fixtures, 4 brownfield + 4 greenfield + 2 high-component-count, registered with Phase 11 harness
- [ ] No regressions in existing sprint, context package, or API key flows

---

## 7. Open Questions

- Task 13 and Task 14 expanded in this revision. Remaining integration-level unknowns:
  - Phase 6 deep-dive to confirm the exact `BusinessProcess`/`BusinessProcessComponent` shape consumed by Task 13 step 6 (decisions + processes).
  - Phase 1/Shared lib deep-dive to confirm whether `stripSensitiveFields` exists or must be created in Phase 5.
  - Phase 2 deep-dive to confirm the exact Inngest event name and payload schema for `BRIEFING_REQUESTED` + `briefing_type='sprint_health'`.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 5`. 14 gaps addressed across 12 tasks. |
| 2026-04-13 | Addendum v1 amendments | Added Context Package pipeline rewrite, sprint health routing, Phase 6 dependency, eval fixtures (Tasks 13–15). |
| 2026-04-13 | Wave 3 audit-fix (phase-05-audit.md) | Applied 12 gap fixes. Absorbed orphan requirements PRD-11-01, PRD-22-13, PRD-22-16 per DECISION-08. Pinned Phase 6 contracts per DECISION-05. Added Phase 9 `assertProjectWritable` dependency per DECISION-10. Superseded REQs 2.6–2.8 in favor of Task 13 pipeline. Added REQs 2.15–2.18. Expanded response schemas, rate limits, token-budget trim algorithm, edge cases, acceptance criteria. |
