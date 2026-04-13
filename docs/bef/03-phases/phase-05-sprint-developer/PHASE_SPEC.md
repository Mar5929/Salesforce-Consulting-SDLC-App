# Phase 5 Spec: Sprint, Developer API

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [05-sprint-developer-gaps.md](./05-sprint-developer-gaps.md)
> Depends On: Phase 4 (Work Management), Phase 6 (Org/Knowledge — added per Addendum v1 for `search_org_kb`)
> Status: Draft
> Last Updated: 2026-04-10

---

## 1. Scope Summary

Complete sprint intelligence with capacity assessment, parallelization output, developer attribution, and mid-sprint re-analysis triggers. Enrich the developer API context package with parent epic/feature business context, full knowledge article content, and answered discovery questions. Build the missing component report endpoint. Add API key expiry and rotation. Implement the brownfield scratch org warning. Refactor sprint intelligence to use the agent harness. Align URL documentation with the key-derived routing approach.

**In scope:** 14 of 14 domain gaps -> 12 tasks
**Resolved/deferred:** None. All 14 gaps addressed. GAP-SPRINT-009 (NLP org query) is scoped as a thin keyword-to-filter translation layer in this phase; full embedding-based semantic search is built in Phase 6 and wired in here as an optional enhancement.
**GAP-SPRINT-013 decision:** Update PRD endpoint documentation to match the key-derived `/api/v1/` routing (docs-to-code alignment). The key-derived approach is better security since projectId cannot be spoofed in the URL.

---

## Addendum v1 Amendments (April 13, 2026)

These amendments integrate PRD Addendum v1 into Phase 5. They are additive — existing requirements below are unchanged except where noted.

- **Context Package Assembly rewrite:** Context Package Assembly is now a specified deterministic pipeline (Addendum §4.6), not an agent loop. Nine steps:
  1. Fetch story + acceptance criteria + parent epic/feature.
  2. Read `story.impacted_components` (Layer 1 component IDs).
  3. For each component: fetch + 1-hop neighbors via `component_edges`, domain memberships, annotations.
  4. For each unique domain: fetch domain description + annotations.
  5. Fetch related discovery Q&A via `search_project_kb` (story description as query).
  6. Fetch in-flight stories sharing any impacted component (coordination flags).
  7. Apply token budget (target 20k tokens); trim by lowest semantic similarity if over.
  8. Single Sonnet call: generate 200-word "context brief" header.
  9. Return structured package.

  Latency target: <3s p95. Only one LLM call (step 8). Everything else is SQL + vector search.
- **Sprint health briefing routing:** Sprint health briefing now calls the Briefing/Status Pipeline (Phase 2) with `briefing_type = sprint_health`.
- **NEW dependency: Phase 6.** `search_org_kb` (Layer 5) must exist for step 5 of Context Package Assembly. The Depends On header above has been updated accordingly.
- **What does not change:** Capacity assessment, parallelization groups, developer attribution, API key expiry/rotation, brownfield warning, component report endpoint.
- **Eval fixture ownership (Context Package Assembly):** Phase 5 owns eval fixtures for Context Package Assembly (10 labeled fixtures covering brownfield + greenfield + high-component-count stories). Harness infrastructure from Phase 11 hosts them (fixtures live under `/evals/context_package_assembly/`), but authorship, gold labels, and maintenance belong to Phase 5. See Task 15 below.

---

## 2. Functional Requirements

### 2.1 Sprint Capacity Assessment (REQ-SPRINT-001)

- **What it does:** Computes sprint capacity from team developer count and velocity target, then passes this to the AI for over/under-commitment flagging. Results are included in the cached analysis and rendered in the Sprint Intelligence Panel.
- **Inputs:** Sprint ID. Developer count derived from `ProjectMember` records with `role = DEVELOPER` and `status = ACTIVE`. Optional `velocityTarget` field on Sprint model.
- **Outputs:** `capacityAssessment` object in `cachedAnalysis` JSON: `{ developerCount, totalPoints, pointsPerDeveloper, velocityTarget, status: "ON_TRACK" | "OVER_COMMITTED" | "UNDER_COMMITTED", recommendation }`.
- **Business rules:**
  - Add `velocityTarget` (Int, nullable) to the Sprint model. When null, capacity assessment uses a default heuristic: 10 points per developer per sprint (configurable via a constant).
  - The Inngest function queries `ProjectMember` count where `projectId` matches and `role = DEVELOPER` and `status = ACTIVE`.
  - Total points = SUM of `storyPoints` for all stories in the sprint.
  - Status thresholds: `OVER_COMMITTED` if totalPoints > velocityTarget * 1.2, `UNDER_COMMITTED` if totalPoints < velocityTarget * 0.5, else `ON_TRACK`.
  - The AI prompt receives capacity data and generates a natural language recommendation (e.g., "Sprint is over-committed by 15 points. Consider moving STORY-FM-008 to the next sprint.").
  - `SprintIntelligencePanel` renders a capacity summary card above conflicts.
- **Files:** `prisma/schema.prisma` (Sprint model), `src/lib/inngest/functions/sprint-intelligence.ts`, `src/components/sprints/sprint-intelligence-panel.tsx`

### 2.2 Parallelization Analysis Output (REQ-SPRINT-002)

- **What it does:** Adds an explicit `parallelGroups` array to the sprint intelligence output schema, identifying sets of stories that can be worked on simultaneously without component overlap.
- **Inputs:** Sprint stories with their `storyComponents`.
- **Outputs:** `parallelGroups: Array<{ groupId: number, storyDisplayIds: string[], rationale: string }>` in `cachedAnalysis`.
- **Business rules:**
  - The AI prompt is updated to explicitly request parallelization grouping: "Group stories that share no impacted components into parallel work groups. Each story appears in exactly one group. Stories with conflicts must be in different groups."
  - The output schema validator checks that every sprint story appears in exactly one parallel group.
  - `SprintIntelligencePanel` renders parallel groups as labeled clusters (e.g., "Group 1: STORY-FM-001, STORY-FM-003 -- no overlap, safe to work in parallel").
- **Files:** `src/lib/inngest/functions/sprint-intelligence.ts` (schema + prompt), `src/components/sprints/sprint-intelligence-panel.tsx`

### 2.3 Developer Attribution in Sprint Intelligence (REQ-SPRINT-003)

- **What it does:** Loads assignee information for sprint stories and includes developer names in conflict output and AI recommendations.
- **Inputs:** Sprint stories with `assigneeId` joined to `ProjectMember.displayName`.
- **Outputs:** Conflict objects include `storyAAssignee` and `storyBAssignee` display names. AI recommendations name specific developers.
- **Business rules:**
  - The story query in the Inngest function adds `assignee: { select: { displayName: true, id: true } }` to the story select clause.
  - The AI prompt is updated: "When detecting conflicts, include the assigned developer's name. If two stories touching the same component are assigned to different developers, recommend coordination. If assigned to the same developer, note they are already aware."
  - `ConflictBanner` renders developer names: "Developer A (STORY-42) and Developer B (STORY-55) both modify AccountTriggerHandler."
  - Stories with null assignee show "Unassigned" in conflict output.
- **Files:** `src/lib/inngest/functions/sprint-intelligence.ts`, `src/components/sprints/conflict-banner.tsx`

### 2.4 Mid-Sprint Re-Analysis Triggers (REQ-SPRINT-004)

- **What it does:** Fires sprint intelligence re-analysis when a story's status changes or a story is reassigned, not just when stories are added/removed from the sprint.
- **Inputs:** `STORY_STATUS_CHANGED` event, `STORY_REASSIGNED` event (new).
- **Outputs:** Updated `cachedAnalysis` on the Sprint model.
- **Business rules:**
  - In `src/actions/stories.ts`, when `updateStoryStatus` succeeds and the story has a `sprintId`, fire `SPRINT_STORIES_CHANGED` event.
  - Add a `STORY_REASSIGNED` event to `src/lib/inngest/events.ts`. Fire it from the story update action when `assigneeId` changes and the story has a `sprintId`.
  - The existing `sprintIntelligenceFunction` already listens for `SPRINT_STORIES_CHANGED`. Add `STORY_REASSIGNED` as an additional trigger.
  - Debounce: use Inngest's `concurrency` with a 30-second `period` to avoid re-running analysis on every rapid status change during a standup.
- **Files:** `src/actions/stories.ts`, `src/lib/inngest/events.ts`, `src/lib/inngest/functions/sprint-intelligence.ts`

### 2.5 Conflict Dismissal Persistence (REQ-SPRINT-005)

- **What it does:** Persists conflict dismissals to `cachedAnalysis` so they survive page refreshes.
- **Inputs:** User clicks "Dismiss" on a conflict banner.
- **Outputs:** `dismissed: true` written to the specific conflict in `cachedAnalysis.conflicts[i]`.
- **Business rules:**
  - Create a `dismissSprintConflict` server action that reads `cachedAnalysis` JSON from the Sprint, finds the conflict by ID, sets `dismissed: true`, and writes back.
  - `SprintIntelligencePanel` reads `dismissed` from the cached data instead of local `useState`.
  - When sprint intelligence re-runs (e.g., from a mid-sprint trigger), previously dismissed conflicts that still exist keep their `dismissed: true` flag. New conflicts start as `dismissed: false`.
  - The re-analysis merge logic: match existing conflicts by a stable key (sorted pair of story display IDs + overlapping component name). If a re-analysis produces the same conflict, carry forward the dismissal.
- **Files:** New `src/actions/sprint-intelligence.ts` (dismissal action), `src/components/sprints/sprint-intelligence-panel.tsx`, `src/lib/inngest/functions/sprint-intelligence.ts` (merge logic)

### 2.6 Context Package: Parent Epic/Feature Business Context (REQ-SPRINT-006)

- **What it does:** Enriches the context package response with the parent epic and feature name, description, and business rationale -- not just bare IDs.
- **Inputs:** Story's `epicId` and `featureId`.
- **Outputs:** `epic: { id, name, prefix, description }` and `feature: { id, name, prefix, description }` objects in the context package response.
- **Business rules:**
  - In the context package route, join `epic` and `feature` when loading the story: `include: { epic: { select: { id: true, name: true, prefix: true, description: true } }, feature: { select: { id: true, name: true, prefix: true, description: true } } }`.
  - Include epic/feature data in the response under a `businessContext` key alongside the story.
  - This is the "Tier 2: Story-specific context" completion per PRD Section 12.2.
- **Files:** `src/app/api/v1/context-package/route.ts`

### 2.7 Context Package: Full Knowledge Article Content (REQ-SPRINT-007)

- **What it does:** Returns full article `content` (not just summaries) and selects articles by semantic relevance rather than usage count.
- **Inputs:** Story's component embeddings (or story text embedding).
- **Outputs:** Up to 5 knowledge articles with full `content` field, ordered by relevance.
- **Business rules:**
  - Replace the `useCount` ordering with a two-pass retrieval: (1) load article summaries, (2) if story components have `orgComponentId` with embeddings, use pgvector cosine similarity (`<=>` operator) to rank articles. Fallback to `useCount` if no embeddings exist.
  - Include `content` in the article select clause (remove the explicit exclusion).
  - Limit to 5 articles (not 10) since full content is larger. Each article's content is typically 500-2000 tokens.
  - Apply the `effectivenessScore` filter: exclude articles with score below -0.3 and 10+ uses.
  - Increment `useCount` on each article included in a response.
- **Files:** `src/app/api/v1/context-package/route.ts`

### 2.8 Context Package: Discovery Notes (Answered Questions) (REQ-SPRINT-008)

- **What it does:** Adds answered questions scoped to the story's epic/feature to the context package response.
- **Inputs:** Story's `epicId` and `featureId`.
- **Outputs:** `discoveryNotes: Array<{ displayId, questionText, answerText, answeredDate }>` in the context package response.
- **Business rules:**
  - Query `Question` where `status = ANSWERED` and (`scopeEpicId = story.epicId` OR `scopeFeatureId = story.featureId` OR `scope = ENGAGEMENT`).
  - Select: `displayId`, `questionText`, `answerText`, `answeredDate`.
  - Order by `answeredDate DESC`, limit 20.
  - Engagement-scoped questions are always included (they apply to all stories). Epic/feature-scoped questions are included when they match the story's parent.
- **Files:** `src/app/api/v1/context-package/route.ts`

### 2.9 NLP Org Query Endpoint (REQ-SPRINT-009)

- **What it does:** Provides a natural language query endpoint for Claude Code to ask questions about the org metadata and knowledge base mid-task.
- **Inputs:** `GET /api/v1/org/query?q=<natural language query>` with API key auth.
- **Outputs:** Matched org components, knowledge articles, and cross-story context.
- **Business rules:**
  - **Phase 5 scope (keyword translation):** Parse the query string into structured filters using pattern matching:
    - "fields on Account" -> `componentType = FIELD, parentComponent.apiName = Account`
    - "triggers on Case" -> `componentType = APEX_TRIGGER, parentComponent.apiName = Case`
    - "integrations touching Order" -> components with `componentType IN (CONNECTED_APP, NAMED_CREDENTIAL, REMOTE_SITE_SETTING)` related to Order
    - "stories touching AccountTriggerHandler" -> stories with `storyComponents` referencing that component
    - "business context for Renewal" -> knowledge articles matching "Renewal" in title or content
  - **Semantic search enhancement (wired when Phase 6 completes):** If embeddings exist for the query concept, use pgvector cosine similarity to find semantically similar OrgComponents and KnowledgeArticles. Phase 6 builds the embedding generation infrastructure; this endpoint is designed to consume it.
  - **Implementation approach:** Create a `parseOrgQuery(query: string)` utility that uses regex pattern matching for common Salesforce query shapes. For unrecognized patterns, fall back to a LIKE search on `apiName`, `label`, and `KnowledgeArticle.title`.
  - Response includes: `{ components: [...], articles: [...], relatedStories: [...] }` with a `queryInterpretation` field showing how the query was parsed.
  - Rate limited: 60 req/min per API key.
- **Files:** New `src/app/api/v1/org/query/route.ts`, new `src/lib/org-query/parse-query.ts`

### 2.10 Component Report Endpoint (REQ-SPRINT-010)

- **What it does:** Accepts reports from Claude Code about components created or modified during story implementation.
- **Inputs:** `POST /api/v1/component-report` with body: `{ storyId, components: [{ apiName, componentType, action: "CREATED" | "MODIFIED" | "DELETED" }] }`.
- **Outputs:** Created/updated `StoryComponent` records linked to `OrgComponent` where a match exists.
- **Business rules:**
  - Validate the story belongs to the API key's project.
  - For each reported component:
    - Look up existing `OrgComponent` by `(projectId, apiName, componentType)`.
    - If found, create/update `StoryComponent` with `orgComponentId` and `impactType` mapped from `action` (CREATED->CREATE, MODIFIED->MODIFY, DELETED->DELETE).
    - If not found, create a `StoryComponent` with `componentName = apiName` (free-text mode) and `componentStatus = PLANNED` on a new `OrgComponent`.
  - Upsert semantics: if a `StoryComponent` already exists for the same story + component, update `impactType`.
  - Return the count of components linked and a list of any that could not be matched.
  - Rate limited: 30 req/min per API key.
- **Files:** New `src/app/api/v1/component-report/route.ts`

### 2.11 API Key Expiry and Rotation (REQ-SPRINT-011)

- **What it does:** Adds an `expiresAt` field to API keys, enforces expiry during authentication, and provides a rotation action that generates a new key and revokes the old one atomically.
- **Inputs:** Key generation with optional `expiresInDays` parameter. Rotation via `rotateApiKey` server action.
- **Outputs:** New key with expiry date. Old key revoked.
- **Business rules:**
  - Add `expiresAt` (DateTime, nullable) to the `ApiKey` model. Nullable = no expiry (backward compatible).
  - Default expiry: 90 days from creation when `expiresInDays` is not specified.
  - `withApiAuth` middleware checks `expiresAt` and returns 401 with `{ error: "API key expired", expiredAt }` if past.
  - `rotateApiKey(oldKeyId)` server action: within a transaction, generate a new key with same name/project/member, revoke the old key. Returns the new key value (only time it is visible).
  - API key list UI shows expiry date with visual indicator: green (>30 days), yellow (7-30 days), red (<7 days), expired (strikethrough).
  - No automated key rotation -- the developer must initiate. A notification could be sent when a key is approaching expiry (deferred to Phase 8 notification wiring if not already covered).
- **Files:** `prisma/schema.prisma` (ApiKey model), `src/lib/api-keys/generate.ts`, `src/lib/api-keys/auth.ts` (withApiAuth), `src/actions/api-keys.ts`, `src/app/(dashboard)/projects/[projectId]/settings/developer-api/developer-api-client.tsx`

### 2.12 Brownfield Scratch Org Warning (REQ-SPRINT-012)

- **What it does:** Allows developers to register their Salesforce environment type and surfaces a warning when a brownfield/managed-services project has developers using scratch orgs.
- **Inputs:** Developer sets their environment type in project settings. System checks `engagementType` on the Project model.
- **Outputs:** Warning banner on sprint planning page and project member list.
- **Business rules:**
  - Add `devEnvironmentType` (Enum: SCRATCH_ORG, DEVELOPER_SANDBOX, PARTIAL_SANDBOX, FULL_SANDBOX, DEVELOPER_EDITION, nullable) to `ProjectMember` model.
  - Add a "Developer Environment" selector to the developer's project settings or profile section (visible to DEVELOPER role only).
  - Warning logic: if `project.engagementType IN (BUILD_PHASE, MANAGED_SERVICES, RESCUE_TAKEOVER)` AND any active project member with `role = DEVELOPER` has `devEnvironmentType = SCRATCH_ORG`, display: "Warning: {Developer Name}'s environment is a scratch org. This is a brownfield engagement -- their environment will not have existing org customizations."
  - Warning surfaces on: sprint planning page (when viewing assigned stories), project members list.
  - The warning is informational only -- it does not block any action.
- **Files:** `prisma/schema.prisma` (ProjectMember model), new `src/components/projects/brownfield-warning.tsx`, `src/app/(dashboard)/projects/[projectId]/settings/` (environment selector), `src/components/sprints/sprint-dashboard.tsx`

### 2.13 Sprint Intelligence Harness Integration (REQ-SPRINT-013)

- **What it does:** Refactors the sprint intelligence Inngest function to route through the agent harness execution engine instead of constructing its own Anthropic client.
- **Inputs:** The existing `sprintIntelligenceTask` definition at `src/lib/agent-harness/tasks/sprint-intelligence.ts`.
- **Outputs:** Sprint analysis results identical to current behavior, but now routed through the harness with output validation, session logging, and firm rules applied.
- **Business rules:**
  - The Inngest function calls the execution engine with the `sprintIntelligenceTask` definition instead of raw `Anthropic` client calls.
  - The task definition's `contextLoader` handles the data assembly (developer count, stories, components, assignees) that the Inngest function currently does inline.
  - Output validation uses the task definition's `outputValidator` to check schema conformance.
  - A `SessionLog` entry is created for each analysis run (task type: `SPRINT_ANALYSIS`).
  - Firm typographic rules from Phase 2 are applied to AI-generated text.
  - The Inngest function becomes a thin wrapper: receive event, call harness, write `cachedAnalysis`.
- **Files:** `src/lib/inngest/functions/sprint-intelligence.ts` (refactor), `src/lib/agent-harness/tasks/sprint-intelligence.ts` (update context loader)

### 2.14 Context Package URL Documentation Alignment (REQ-SPRINT-014)

- **What it does:** Updates the developer API documentation surface in the web app to accurately reflect the `/api/v1/` key-derived routing approach.
- **Inputs:** N/A (documentation change).
- **Outputs:** Updated endpoint documentation in the developer API settings page and any inline help text.
- **Business rules:**
  - The code routes stay as `/api/v1/...` (no code change). The key-derived approach is superior security.
  - Update the endpoint list in `developer-api-client.tsx` to include all endpoints with correct paths and descriptions.
  - Add the new endpoints from this phase: `GET /api/v1/org/query`, `POST /api/v1/component-report`.
  - Add a note explaining: "All endpoints derive the project scope from your API key. No project ID is needed in the URL."
  - Update any references in code comments that cite PRD Section 5.3 paths.
- **Files:** `src/app/(dashboard)/projects/[projectId]/settings/developer-api/developer-api-client.tsx`

---

## 3. Technical Approach

### 3.1 Implementation Strategy

Schema changes first, then sprint intelligence enhancements, then context package completion, then new API endpoints, then UI:

1. **Schema migration** (REQ-011, 012, 001) -- Add `expiresAt` to ApiKey, `devEnvironmentType` to ProjectMember, `velocityTarget` to Sprint. Single migration.
2. **Sprint intelligence core** (REQ-001, 002, 003, 013) -- Refactor to harness, add capacity/parallelization/developer output. Tightly coupled changes.
3. **Sprint intelligence triggers** (REQ-004, 005) -- Mid-sprint re-analysis events and conflict dismissal. Builds on core.
4. **Context package enrichment** (REQ-006, 007, 008) -- Epic/feature context, full articles, discovery notes. Independent from sprint work.
5. **New API endpoints** (REQ-009, 010) -- Org query and component report. Independent from sprint and context.
6. **API key lifecycle** (REQ-011 continued) -- Expiry enforcement, rotation action, UI. Schema done in step 1.
7. **Brownfield warning + docs** (REQ-012, 014) -- UI components and documentation. Independent.

### 3.2 File/Module Structure

```
prisma/
  schema.prisma                                    -- MODIFY (3 field additions)
  migrations/                                      -- New migration for 3 fields
src/
  lib/
    inngest/
      events.ts                                    -- MODIFY (add STORY_REASSIGNED)
      functions/
        sprint-intelligence.ts                     -- MODIFY (major refactor to harness)
    agent-harness/
      tasks/
        sprint-intelligence.ts                     -- MODIFY (expand context loader, output schema)
    api-keys/
      generate.ts                                  -- MODIFY (add expiresAt param)
      auth.ts                                      -- MODIFY (check expiresAt)
    org-query/
      parse-query.ts                               -- CREATE (keyword-to-filter translation)
  actions/
    api-keys.ts                                    -- MODIFY (add rotateApiKey)
    stories.ts                                     -- MODIFY (fire re-analysis events)
    sprint-intelligence.ts                         -- CREATE (dismissSprintConflict)
  app/
    api/v1/
      org/
        query/
          route.ts                                 -- CREATE (NLP org query)
      component-report/
        route.ts                                   -- CREATE (component report)
      context-package/
        route.ts                                   -- MODIFY (epic/feature, articles, questions)
  components/
    sprints/
      sprint-intelligence-panel.tsx                -- MODIFY (capacity card, parallel groups)
      conflict-banner.tsx                          -- MODIFY (developer names)
      sprint-dashboard.tsx                         -- MODIFY (brownfield warning)
    projects/
      brownfield-warning.tsx                       -- CREATE
  app/(dashboard)/projects/[projectId]/settings/
    developer-api/
      developer-api-client.tsx                     -- MODIFY (docs, expiry UI)
    members/ or profile/                           -- MODIFY (dev environment selector)
```

### 3.3 API Contracts

**POST /api/v1/component-report**
```json
// Request
{
  "storyId": "cuid",
  "components": [
    { "apiName": "Account_Trigger", "componentType": "APEX_TRIGGER", "action": "MODIFIED" }
  ]
}
// Response 200
{
  "linked": 3,
  "unmatched": [{ "apiName": "NewFlow__c", "reason": "No existing org component" }]
}
```

**GET /api/v1/org/query?q=fields+on+Account**
```json
// Response 200
{
  "queryInterpretation": { "type": "FIELD", "parentObject": "Account" },
  "components": [...],
  "articles": [...],
  "relatedStories": [...]
}
```

### 3.4 Data Changes

**Prisma migration (single):**
- `Sprint`: add `velocityTarget Int?`
- `ApiKey`: add `expiresAt DateTime?`
- `ProjectMember`: add `devEnvironmentType DevEnvironmentType?`
- New enum `DevEnvironmentType`: `SCRATCH_ORG`, `DEVELOPER_SANDBOX`, `PARTIAL_SANDBOX`, `FULL_SANDBOX`, `DEVELOPER_EDITION`

**No backfill required.** All new fields are nullable. Existing keys have no expiry (null = never expires). Existing members have no environment type set (null = not registered).

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| Sprint with 0 stories | Capacity assessment returns `{ totalPoints: 0, status: "UNDER_COMMITTED" }` | N/A -- valid state |
| Sprint with 0 developers on project | Capacity assessment uses `developerCount: 0`, recommendation says "No developers assigned to this project" | N/A -- AI handles gracefully |
| Story with null storyPoints in sprint | Excluded from capacity total. AI flags "STORY-X has no estimate -- capacity calculation incomplete." | N/A |
| Story with null assignee in conflict | Shows "Unassigned" in conflict banner | N/A |
| Mid-sprint rapid status changes (e.g., standup) | Debounced via Inngest concurrency period (30s) | Only last-triggered analysis runs |
| Re-analysis produces same conflict as before, user had dismissed it | Dismissal carried forward by stable key matching | N/A |
| Context package for story with no epic description | `epic.description` is null in response -- Claude Code handles absence | N/A |
| Context package with no knowledge articles | Empty `articles` array | N/A |
| Context package with no embeddings on articles | Falls back to `useCount` ordering instead of cosine similarity | N/A |
| Org query with unparseable natural language | Falls back to LIKE search on apiName/label/title | `queryInterpretation: { type: "FALLBACK_TEXT_SEARCH" }` |
| Org query returns 0 results | Empty arrays in response | HTTP 200 with empty results |
| Component report for story not in API key's project | Rejected | HTTP 403 "Story not found in this project" |
| Component report with unknown componentType | Rejected per enum validation | HTTP 400 "Invalid componentType" |
| API key expired | Rejected at withApiAuth | HTTP 401 `{ error: "API key expired", expiredAt: "..." }` |
| rotateApiKey for already-revoked key | Rejected | HTTP 400 "Cannot rotate a revoked key" |
| Brownfield warning with no developers registered | No warning shown (nothing to check) | N/A |
| Harness integration failure (execution engine unavailable) | Inngest function fails with retryable error | Inngest auto-retries per configuration |

---

## 5. Integration Points

### From Prior Phases

**Phase 1 (RBAC):**
- `requireRole` gates protect all new server actions (dismiss conflict, rotate key, update dev environment).
- `withApiAuth` middleware is extended for expiry checking.
- Story status machine provides the `STORY_STATUS_CHANGED` event shape.

**Phase 2 (Agent Harness):**
- Execution engine used for sprint intelligence refactor (REQ-SPRINT-013). Output validation, session logging, firm rules.
- Rate limiting infrastructure applies to the new org query and component report endpoints.

**Phase 3 (Discovery):**
- `IMPACT_ASSESSED` question status is available for richer discovery notes in context packages.
- Answered questions with `answerText` feed into REQ-SPRINT-008.

**Phase 4 (Work Management):**
- DRAFT-to-READY validation ensures stories in sprints have complete data for sprint intelligence.
- Test case stubs are available in context packages (already present in story data).
- OrgComponent linked mode means sprint conflict detection is more accurate (linked components vs free-text).
- Salesforce guardrails are in the Tier 1 project summary, included in context packages.

### For Future Phases

**Phase 6 (Org/Knowledge):**
- The org query endpoint (REQ-SPRINT-009) is designed to consume Phase 6's embedding generation. When Phase 6 completes, the fallback keyword matching can be enhanced with cosine similarity search.
- Knowledge article full content in context packages benefits from Phase 6's article refresh cycle keeping content current.

**Phase 7 (Dashboards):**
- Sprint capacity data and developer workload attribution feed the sprint dashboard workload view.
- Parallel groups provide the sprint execution visualization.
- Brownfield warnings surface on the sprint planning dashboard.

---

## 6. Acceptance Criteria

- [ ] Sprint model has `velocityTarget` field (nullable)
- [ ] Sprint intelligence computes and outputs capacity assessment with over/under-commitment status
- [ ] Sprint intelligence outputs parallelization groups where every story appears in exactly one group
- [ ] Sprint intelligence includes developer names in conflict detection and recommendations
- [ ] Stories with null assignee show "Unassigned" in conflict output
- [ ] `STORY_STATUS_CHANGED` fires sprint re-analysis when the story has a sprintId
- [ ] Story reassignment fires sprint re-analysis when the story has a sprintId
- [ ] Re-analysis debounced to prevent rapid successive runs
- [ ] Conflict dismissal persists to `cachedAnalysis` and survives page refresh
- [ ] Dismissed conflicts are carried forward on re-analysis if the same conflict still exists
- [ ] Context package includes parent epic name, prefix, and description
- [ ] Context package includes parent feature name, prefix, and description (when applicable)
- [ ] Context package returns full knowledge article content, not just summaries
- [ ] Knowledge articles selected by semantic relevance (cosine similarity) with useCount fallback
- [ ] Context package includes answered discovery questions scoped to story's epic/feature
- [ ] Engagement-scoped answered questions included in every context package
- [ ] `GET /api/v1/org/query` accepts natural language and returns matched components/articles/stories
- [ ] Org query endpoint handles common Salesforce patterns (fields on X, triggers on X, etc.)
- [ ] `POST /api/v1/component-report` accepts and processes component reports
- [ ] Component report links to existing OrgComponent when apiName+componentType matches
- [ ] ApiKey model has `expiresAt` field
- [ ] `withApiAuth` rejects expired keys with 401
- [ ] `rotateApiKey` action generates new key and revokes old in a transaction
- [ ] API key UI shows expiry status with color indicators
- [ ] Default API key expiry is 90 days
- [ ] ProjectMember model has `devEnvironmentType` field
- [ ] Developers can set their environment type in project settings
- [ ] Brownfield warning displayed when scratch org detected on non-greenfield project
- [ ] Sprint intelligence routes through agent harness execution engine
- [ ] SessionLog entries created for sprint intelligence runs
- [ ] Developer API docs page shows all endpoints with correct paths
- [ ] No regressions in existing sprint, context package, or API key flows

---

## 7. Open Questions

None -- all scoping decisions resolved during deep dive.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 5`. 14 of 14 gaps addressed across 12 tasks. GAP-SPRINT-009 scoped as keyword translation with Phase 6 semantic enhancement hook. GAP-SPRINT-013 resolved by updating docs (not code). GAP-SPRINT-014 addressed by harness integration refactor. |
