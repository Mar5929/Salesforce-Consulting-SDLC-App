# Phase 5 Tasks: Sprint, Developer API

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 12
> Status: 0/12 complete
> Last Updated: 2026-04-10

---

## Execution Order

```
Task 1 (Schema migration)     ─── must be first (fields needed by Tasks 2-12)
  │
  ├── Task 2 (Harness refactor)  ─── depends on Task 1 (velocityTarget field)
  │     ├── Task 3 (Capacity + parallelization + developer attribution)
  │     │     └── Task 4 (Mid-sprint triggers + dismissal persistence)
  │     │
  │     └── (Tasks 5-8 are independent of Tasks 3-4)
  │
  ├── Task 5 (Context package: epic/feature + discovery notes)  ─── independent
  ├── Task 6 (Context package: full articles + semantic ranking)  ─── independent
  ├── Task 7 (Org query endpoint)  ─── independent
  ├── Task 8 (Component report endpoint)  ─── independent
  ├── Task 9 (API key expiry + rotation)  ─── depends on Task 1 (expiresAt field)
  ├── Task 10 (Brownfield warning)  ─── depends on Task 1 (devEnvironmentType field)
  ├── Task 11 (Developer API docs update)  ─── after Tasks 7, 8, 9 (needs final endpoint list)
  └── Task 12 (Sprint intelligence UI: capacity card + parallel groups + developer names)
        └── depends on Task 3 (needs the output schema changes)
```

---

## Tasks

### Task 1: Schema Migration -- Sprint velocityTarget, ApiKey expiresAt, ProjectMember devEnvironmentType

| Attribute | Details |
|-----------|---------|
| **Scope** | Add three fields and one new enum across three models in a single Prisma migration. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `Sprint` model has `velocityTarget Int?` field
- [ ] `ApiKey` model has `expiresAt DateTime?` field
- [ ] `ProjectMember` model has `devEnvironmentType DevEnvironmentType?` field
- [ ] `DevEnvironmentType` enum created: `SCRATCH_ORG`, `DEVELOPER_SANDBOX`, `PARTIAL_SANDBOX`, `FULL_SANDBOX`, `DEVELOPER_EDITION`
- [ ] Migration applies cleanly against existing data (all new fields nullable, no backfill needed)
- [ ] `npx prisma generate` produces updated client with no errors

**Implementation Notes:**
- Add to `prisma/schema.prisma`:
  - On `Sprint` (line ~735): `velocityTarget Int?` after `status`
  - On `ApiKey` (line ~991): `expiresAt DateTime?` after `revokedAt`
  - On `ProjectMember` (line ~137): `devEnvironmentType DevEnvironmentType?` after `removedAt`
  - New enum `DevEnvironmentType` with 5 values
- Run `npx prisma migrate dev --name add-sprint-velocity-apikey-expiry-dev-env-type`
- No seed data changes needed.

---

### Task 2: Refactor Sprint Intelligence to Use Agent Harness

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace the inline Anthropic client in the sprint intelligence Inngest function with the execution engine, moving context assembly to the task definition's contextLoader. |
| **Depends On** | Task 1 (velocityTarget field), Phase 2 (execution engine) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Inngest function no longer imports or constructs an `Anthropic` client directly
- [ ] Sprint intelligence routes through the execution engine via the `sprintIntelligenceTask` definition
- [ ] `sprintIntelligenceTask.contextLoader` performs all data queries (stories, components, assignees, developer count, velocityTarget)
- [ ] Output validation is handled by the task definition's `outputValidator`
- [ ] A `SessionLog` entry (taskType: `SPRINT_ANALYSIS`) is created for each analysis run
- [ ] Firm typographic rules from Phase 2 are applied to AI-generated recommendation text
- [ ] Sprint analysis results are functionally identical to current behavior (no regression)

**Implementation Notes:**
- The `sprintIntelligenceTask` definition exists at `src/lib/agent-harness/tasks/sprint-intelligence.ts` but is never invoked. It already has a system prompt template and model specification.
- Move the data loading from `src/lib/inngest/functions/sprint-intelligence.ts` lines 55-68 into the task definition's `contextLoader`. Add `assignee` join, developer count query, and `velocityTarget` from the sprint.
- The Inngest function becomes: (1) receive event, (2) call `executeTask(sprintIntelligenceTask, input)`, (3) write result to `sprint.cachedAnalysis`.
- The output schema needs updating to include `capacityAssessment` and `parallelGroups` (done in Task 3), but the harness refactor can land first with the existing schema.
- Test by running sprint intelligence on an existing sprint and comparing output to the current inline approach.

---

### Task 3: Sprint Intelligence -- Capacity Assessment, Parallelization, Developer Attribution

| Attribute | Details |
|-----------|---------|
| **Scope** | Extend the sprint intelligence task definition with capacity assessment data, parallelization group output, and developer attribution in conflicts. Updates to context loader, prompt, and output schema. |
| **Depends On** | Task 2 (harness refactor) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Context loader queries active developer count from `ProjectMember` (role=DEVELOPER, status=ACTIVE)
- [ ] Context loader includes `velocityTarget` from Sprint (or default 10pts/dev/sprint)
- [ ] AI prompt includes capacity data and requests over/under-commitment assessment
- [ ] Output schema includes `capacityAssessment: { developerCount, totalPoints, pointsPerDeveloper, velocityTarget, status, recommendation }`
- [ ] AI prompt requests explicit parallelization grouping
- [ ] Output schema includes `parallelGroups: Array<{ groupId, storyDisplayIds, rationale }>`
- [ ] Output validator checks every sprint story appears in exactly one parallel group
- [ ] Story select clause includes `assignee: { select: { displayName, id } }`
- [ ] AI prompt instructs developer-aware conflict recommendations
- [ ] Conflict output includes `storyAAssignee` and `storyBAssignee` display names
- [ ] Stories with null assignee show "Unassigned"

**Implementation Notes:**
- In the `contextLoader`, add:
  ```
  const developerCount = await prisma.projectMember.count({
    where: { projectId, role: 'DEVELOPER', status: 'ACTIVE' }
  });
  ```
- Update the story query select to include `assigneeId` and `assignee: { select: { displayName: true, id: true } }`.
- Capacity status thresholds (constants in the task file):
  - `OVER_COMMITTED`: totalPoints > velocityTarget * 1.2
  - `UNDER_COMMITTED`: totalPoints < velocityTarget * 0.5
  - Otherwise: `ON_TRACK`
- AI prompt additions (append to existing system prompt):
  - "Capacity data: {developerCount} developers, {totalPoints} total story points, velocity target {velocityTarget}. Assess if the sprint is over-committed, under-committed, or on track. Provide a specific recommendation."
  - "Group all sprint stories into parallel work groups. Stories sharing impacted components must be in different groups. Output as parallelGroups array."
  - "Include assigned developer display names in conflict output. If two conflicting stories are assigned to different developers, recommend they coordinate."
- The output validator should verify: (1) every story displayId from input appears in exactly one parallelGroup, (2) capacityAssessment.status is one of the three valid values.

---

### Task 4: Mid-Sprint Re-Analysis Triggers and Conflict Dismissal Persistence

| Attribute | Details |
|-----------|---------|
| **Scope** | Fire sprint re-analysis on story status changes and reassignment. Persist conflict dismissals to cachedAnalysis. Carry forward dismissals across re-analyses. |
| **Depends On** | Task 3 (updated output schema for merge logic) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `STORY_REASSIGNED` event defined in `src/lib/inngest/events.ts`
- [ ] `updateStoryStatus` fires `SPRINT_STORIES_CHANGED` when story has a sprintId
- [ ] Story assignee change fires `STORY_REASSIGNED` when story has a sprintId
- [ ] Sprint intelligence function triggers on `STORY_REASSIGNED` in addition to existing triggers
- [ ] Inngest concurrency configured with 30-second debounce period for sprint intelligence
- [ ] `dismissSprintConflict` server action reads `cachedAnalysis`, sets `dismissed: true` on matching conflict, writes back
- [ ] `SprintIntelligencePanel` reads dismissal state from cachedAnalysis (not useState)
- [ ] Re-analysis preserves `dismissed: true` for conflicts matching by stable key (sorted story display IDs + component name)
- [ ] New conflicts from re-analysis start as `dismissed: false`

**Implementation Notes:**
- In `src/lib/inngest/events.ts`, add:
  ```
  STORY_REASSIGNED: 'story/reassigned' // payload: { storyId, sprintId, oldAssigneeId, newAssigneeId }
  ```
- In `src/actions/stories.ts` `updateStoryStatus`:
  - After successful status update, check if `story.sprintId` is non-null.
  - If so, fire `inngest.send({ name: EVENTS.SPRINT_STORIES_CHANGED, data: { sprintId: story.sprintId } })`.
- For assignee changes, in the story update action:
  - Compare old vs new `assigneeId`. If changed and `sprintId` is set, fire `STORY_REASSIGNED`.
- Create `src/actions/sprint-intelligence.ts` with `dismissSprintConflict(sprintId, conflictKey)`:
  - RBAC: any project member can dismiss (informational, not destructive).
  - Read `sprint.cachedAnalysis`, find conflict by key, set `dismissed: true`, update sprint.
- Conflict stable key = `${[storyADisplayId, storyBDisplayId].sort().join('|')}|${overlappingComponent}`.
- In the Inngest function, after receiving new analysis from AI, merge with previous `cachedAnalysis`:
  - For each new conflict, compute stable key. If previous analysis had same key with `dismissed: true`, carry it forward.
- Debounce: configure Inngest function with `concurrency: { scope: "event", key: "event.data.sprintId", limit: 1, period: "30s" }`.

---

### Task 5: Context Package -- Parent Epic/Feature Business Context and Discovery Notes

| Attribute | Details |
|-----------|---------|
| **Scope** | Enrich the context package with parent epic/feature details and answered discovery questions. |
| **Depends On** | Task 1 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Context package response includes `epic: { id, name, prefix, description }` from the story's parent epic
- [ ] Context package response includes `feature: { id, name, prefix, description }` when story has a featureId
- [ ] Context package response includes `discoveryNotes` array of answered questions
- [ ] Answered questions include `displayId`, `questionText`, `answerText`, `answeredDate`
- [ ] Engagement-scoped answered questions are always included
- [ ] Epic/feature-scoped answered questions filtered by story's parent epic/feature
- [ ] Questions ordered by `answeredDate DESC`, limited to 20
- [ ] Response structure is backward-compatible (new fields added, existing fields unchanged)

**Implementation Notes:**
- In `src/app/api/v1/context-package/route.ts`:
  - Update the story query to include epic and feature joins:
    ```
    include: {
      epic: { select: { id: true, name: true, prefix: true, description: true } },
      feature: { select: { id: true, name: true, prefix: true, description: true } },
      storyComponents: true,
    }
    ```
  - Add a parallel query for answered questions:
    ```
    const discoveryNotes = await prisma.question.findMany({
      where: {
        projectId: apiKey.projectId,
        status: 'ANSWERED',
        OR: [
          { scope: 'ENGAGEMENT' },
          { scopeEpicId: story.epicId },
          ...(story.featureId ? [{ scopeFeatureId: story.featureId }] : []),
        ],
      },
      select: { displayId: true, questionText: true, answerText: true, answeredDate: true },
      orderBy: { answeredDate: 'desc' },
      take: 20,
    });
    ```
  - Add `businessContext: { epic: story.epic, feature: story.feature }` and `discoveryNotes` to the response.

---

### Task 6: Context Package -- Full Knowledge Article Content with Semantic Ranking

| Attribute | Details |
|-----------|---------|
| **Scope** | Return full article content instead of summaries, and rank by semantic relevance using pgvector cosine similarity when embeddings are available. |
| **Depends On** | Task 1 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Knowledge article query includes `content` field (not just `summary`)
- [ ] Articles ranked by cosine similarity when story components have embeddings
- [ ] Fallback to `useCount DESC` ordering when no embeddings available
- [ ] Articles with `effectivenessScore < -0.3` AND `useCount >= 10` excluded
- [ ] Limited to 5 articles (not 10)
- [ ] `useCount` incremented on each article included in response
- [ ] Response backward-compatible (articles array already exists, now has `content` field)

**Implementation Notes:**
- In `src/app/api/v1/context-package/route.ts`:
  - **Semantic path:** If story has components with `orgComponentId` that have embeddings, compute an average embedding vector and use pgvector cosine similarity:
    ```sql
    SELECT id, title, summary, content, "articleType", confidence
    FROM "KnowledgeArticle"
    WHERE "projectId" = $1
      AND ("effectivenessScore" IS NULL OR "effectivenessScore" > -0.3 OR "useCount" < 10)
      AND "embeddingStatus" = 'GENERATED'
    ORDER BY embedding <=> $2
    LIMIT 5
    ```
    Execute via `prisma.$queryRaw`.
  - **Fallback path:** If no embeddings available, use the existing query but with `content` in the select and `useCount DESC` ordering, limit 5.
  - After fetching, increment `useCount` for all returned articles in a single `updateMany`:
    ```
    await prisma.knowledgeArticle.updateMany({
      where: { id: { in: articleIds } },
      data: { useCount: { increment: 1 } },
    });
    ```
  - The average embedding calculation: load component embeddings from `OrgComponent` where `orgComponentId IN (story component orgComponentIds)` and `embeddingStatus = 'GENERATED'`. Average the vectors. If 0 components have embeddings, fall back.

---

### Task 7: NLP Org Query Endpoint

| Attribute | Details |
|-----------|---------|
| **Scope** | Build the `GET /api/v1/org/query` endpoint with keyword-to-filter translation for common Salesforce query patterns, plus LIKE search fallback. |
| **Depends On** | Task 1 |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `GET /api/v1/org/query?q=<query>` endpoint exists and requires API key auth
- [ ] Handles "fields on {Object}" -> returns FIELD components with parent = Object
- [ ] Handles "triggers on {Object}" -> returns APEX_TRIGGER components on Object
- [ ] Handles "flows on {Object}" -> returns FLOW components referencing Object
- [ ] Handles "integrations touching {Object}" -> returns CONNECTED_APP, NAMED_CREDENTIAL, REMOTE_SITE_SETTING related to Object
- [ ] Handles "stories touching {Component}" -> returns stories with storyComponents referencing Component
- [ ] Handles "business context for {topic}" -> returns KnowledgeArticles matching topic
- [ ] Unrecognized queries fall back to LIKE search on apiName, label, and article title
- [ ] Response includes `queryInterpretation` showing how the query was parsed
- [ ] Response includes `components`, `articles`, and `relatedStories` arrays
- [ ] Rate limited at 60 req/min per API key
- [ ] Returns HTTP 200 with empty results for no matches (not 404)

**Implementation Notes:**
- Create `src/lib/org-query/parse-query.ts`:
  - Export `parseOrgQuery(query: string): ParsedQuery` where `ParsedQuery = { type: 'FIELD_ON' | 'TRIGGER_ON' | 'FLOW_ON' | 'INTEGRATION' | 'STORY_TOUCH' | 'KNOWLEDGE' | 'FALLBACK_TEXT_SEARCH', params: Record<string, string> }`.
  - Use regex patterns:
    - `/^(?:show me |list |get )?fields (?:on|for|of) (\w+)$/i` -> `{ type: 'FIELD_ON', params: { object: match[1] } }`
    - `/^(?:show me |list |get )?triggers? (?:on|for|of) (\w+)$/i` -> TRIGGER_ON
    - `/^(?:show me |list |get )?flows? (?:on|for|of) (\w+)$/i` -> FLOW_ON
    - `/^(?:show me |list |get )?integrations? (?:touching|on|for|with) (\w+)$/i` -> INTEGRATION
    - `/^(?:show me |list |get )?stories (?:touching|on|for|with|involving) (\w+)$/i` -> STORY_TOUCH
    - `/^(?:show me |get |what is )?(?:business )?context (?:for|about|on) (.+)$/i` -> KNOWLEDGE
    - Default: FALLBACK_TEXT_SEARCH
- Create `src/app/api/v1/org/query/route.ts`:
  - Use `withApiAuth` for authentication.
  - Parse query via `parseOrgQuery`.
  - Execute the appropriate Prisma queries based on parsed type.
  - For FALLBACK_TEXT_SEARCH, use `contains` (case-insensitive) on `apiName`, `label`, and `KnowledgeArticle.title`/`content`.
  - Limit each result type to 20 items.
  - Include a hook for Phase 6 semantic search: `// TODO: When Phase 6 embeddings are available, add cosine similarity search here`.

---

### Task 8: Component Report Endpoint

| Attribute | Details |
|-----------|---------|
| **Scope** | Build `POST /api/v1/component-report` endpoint for Claude Code to report built/modified components back to the web app. |
| **Depends On** | Task 1 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `POST /api/v1/component-report` endpoint exists and requires API key auth
- [ ] Validates story belongs to the API key's project
- [ ] For each reported component, looks up existing OrgComponent by (projectId, apiName, componentType)
- [ ] Creates/updates StoryComponent with orgComponentId when match found
- [ ] Creates StoryComponent with componentName (free-text) when no OrgComponent match
- [ ] Creates a PLANNED OrgComponent for unmatched components
- [ ] Upsert semantics: existing StoryComponent for same story+component gets updated impactType
- [ ] Maps action to impactType: CREATED->CREATE, MODIFIED->MODIFY, DELETED->DELETE
- [ ] Returns `{ linked: N, created: N, unmatched: [...] }` response
- [ ] Rate limited at 30 req/min per API key
- [ ] Rejects with 400 for invalid componentType enum values
- [ ] Rejects with 403 if storyId not in project

**Implementation Notes:**
- Create `src/app/api/v1/component-report/route.ts`:
  - Use `withApiAuth` for authentication.
  - Validate request body with Zod: `{ storyId: z.string(), components: z.array(z.object({ apiName: z.string(), componentType: z.nativeEnum(ComponentType), action: z.enum(['CREATED', 'MODIFIED', 'DELETED']) })) }`.
  - Verify story belongs to project: `prisma.story.findFirst({ where: { id: storyId, projectId } })`.
  - For each component in the request:
    1. Look up `OrgComponent` by `(projectId, apiName, componentType)`.
    2. If found: upsert `StoryComponent` with `orgComponentId` and `impactType`.
    3. If not found: create `OrgComponent` with `componentStatus: 'PLANNED'`, then create `StoryComponent` linked to it.
  - Use `prisma.$transaction` for atomicity.
  - Action-to-impactType mapping: `{ CREATED: 'CREATE', MODIFIED: 'MODIFY', DELETED: 'DELETE' }`.

---

### Task 9: API Key Expiry and Rotation

| Attribute | Details |
|-----------|---------|
| **Scope** | Enforce API key expiry in withApiAuth, add rotation server action, update key generation to set default expiry, and update the API key UI. |
| **Depends On** | Task 1 (expiresAt field) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `withApiAuth` checks `expiresAt` and rejects expired keys with 401
- [ ] 401 response includes `{ error: "API key expired", expiredAt: "<ISO date>" }`
- [ ] Key generation sets `expiresAt` to 90 days from now by default
- [ ] Key generation accepts optional `expiresInDays` parameter (null = no expiry)
- [ ] `rotateApiKey` server action: generates new key, revokes old, within a transaction
- [ ] `rotateApiKey` returns the new key value (visible once)
- [ ] `rotateApiKey` rejects if old key is already revoked
- [ ] API key list UI shows expiry date column
- [ ] Visual indicators: green (>30 days), yellow (7-30 days), red (<7 days), strikethrough (expired)
- [ ] "Rotate" button next to each active key that triggers rotation flow

**Implementation Notes:**
- In `src/lib/api-keys/auth.ts` (`withApiAuth`):
  - After the existing `isActive` check, add: `if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return NextResponse.json({ error: 'API key expired', expiredAt: apiKey.expiresAt.toISOString() }, { status: 401 })`.
- In `src/lib/api-keys/generate.ts`:
  - Add `expiresInDays?: number | null` parameter. Default 90.
  - Compute `expiresAt = expiresInDays ? addDays(new Date(), expiresInDays) : null` (use `date-fns`).
  - Pass to `prisma.apiKey.create`.
- In `src/actions/api-keys.ts`:
  - Add `rotateApiKey(keyId: string)` action:
    - RBAC: key owner or SA/PM can rotate.
    - Verify old key exists, is active, not revoked.
    - Within `prisma.$transaction`: revoke old key, generate new key with same name/project/member.
    - Return new key value and ID.
- In `developer-api-client.tsx`:
  - Add `expiresAt` to the key display table.
  - Add color-coded badge: `getExpiryStatus(expiresAt)` returns `{ label, color }`.
  - Add "Rotate" button that calls `rotateApiKey` and displays the new key in a copy-once dialog.

---

### Task 10: Brownfield Scratch Org Warning

| Attribute | Details |
|-----------|---------|
| **Scope** | Build developer environment type selector and brownfield warning component. |
| **Depends On** | Task 1 (devEnvironmentType field) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Developer can set their environment type in project settings (visible to DEVELOPER role)
- [ ] Environment type selector shows all 5 options (Scratch Org, Developer Sandbox, Partial Sandbox, Full Sandbox, Developer Edition)
- [ ] `BrownfieldWarning` component checks project engagement type and developer environments
- [ ] Warning displayed when: engagement is BUILD_PHASE, MANAGED_SERVICES, or RESCUE_TAKEOVER AND any developer has devEnvironmentType = SCRATCH_ORG
- [ ] Warning names the specific developer(s) using scratch orgs
- [ ] Warning text matches PRD Section 14.3
- [ ] Warning appears on sprint planning page
- [ ] Warning appears on project members list
- [ ] Warning is informational only (no blocking)
- [ ] No warning for GREENFIELD projects

**Implementation Notes:**
- Create `src/components/projects/brownfield-warning.tsx`:
  - Props: `projectEngagementType`, `members: Array<{ displayName, role, devEnvironmentType }>`.
  - Logic: filter members to `role = DEVELOPER` and `devEnvironmentType = SCRATCH_ORG`. If engagement is non-greenfield and any match, render warning.
  - Use shadcn/ui `Alert` component with `variant="warning"` (or destructive).
  - Text: "Warning: {names} environment(s) are scratch orgs. This is a {engagementType} engagement -- scratch org environments will not have existing org customizations."
- Add a "Developer Environment" select to the project member settings or a dedicated developer settings section:
  - Create a `updateDevEnvironmentType` server action.
  - RBAC: a developer can update their own environment type. SA/PM can update any member's.
  - Use a shadcn `Select` component with the 5 enum values.
- In `sprint-dashboard.tsx`, load project engagement type and developer environments, render `BrownfieldWarning` at the top.
- In the project members list page, render `BrownfieldWarning` below the member table header.

---

### Task 11: Developer API Documentation Update

| Attribute | Details |
|-----------|---------|
| **Scope** | Update the developer API settings page to accurately document all endpoints including new ones from this phase. |
| **Depends On** | Tasks 7, 8, 9 (needs final endpoint list and paths) |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Endpoint list includes all 6 endpoints: context-package, org/components, stories/:storyId/status, project/summary, org/query, component-report
- [ ] Each endpoint shows correct HTTP method, path, description, and rate limit
- [ ] Explanatory note: "All endpoints derive project scope from your API key. No project ID needed in the URL."
- [ ] New endpoints (org/query, component-report) have request/response examples
- [ ] Expiry information visible in key management section
- [ ] No references to PRD Section 5.3 paths (or references updated to note the key-derived approach)

**Implementation Notes:**
- In `src/app/(dashboard)/projects/[projectId]/settings/developer-api/developer-api-client.tsx`:
  - Update the endpoint documentation array (currently 4 endpoints) to include 6.
  - Add entries for:
    - `GET /api/v1/org/query?q=<query>` -- "Query org metadata and knowledge base with natural language"
    - `POST /api/v1/component-report` -- "Report components created or modified during story implementation"
  - Add a prominent info box: "All API endpoints use your API key to determine project scope. The project ID is not included in the URL for security."
  - Add request/response examples for the new endpoints (can be static markdown or collapsible sections).
  - Update any code comments in the API route files that reference PRD Section 5.3 URL format.

---

### Task 12: Sprint Intelligence UI -- Capacity Card, Parallel Groups, Developer Names

| Attribute | Details |
|-----------|---------|
| **Scope** | Update SprintIntelligencePanel and ConflictBanner to render the new capacity assessment, parallelization groups, and developer attribution data. |
| **Depends On** | Task 3 (output schema changes must be deployed) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Capacity summary card renders above conflicts showing: developer count, total points, velocity target, status badge
- [ ] Status badge color-coded: green (ON_TRACK), yellow (UNDER_COMMITTED), red (OVER_COMMITTED)
- [ ] AI recommendation text displayed below capacity summary
- [ ] Parallel groups rendered as labeled clusters (e.g., "Group 1: STORY-FM-001, STORY-FM-003")
- [ ] Each group shows rationale text from AI
- [ ] ConflictBanner shows developer names: "Developer A (STORY-42) and Developer B (STORY-55) both modify AccountTriggerHandler"
- [ ] Unassigned stories show "Unassigned" instead of developer name
- [ ] Dismiss button calls server action (from Task 4) instead of setting local state
- [ ] Dismissed conflicts are hidden but can be shown via "Show dismissed" toggle
- [ ] Graceful handling of old cachedAnalysis format (no capacityAssessment/parallelGroups keys)

**Implementation Notes:**
- In `src/components/sprints/sprint-intelligence-panel.tsx`:
  - Parse `cachedAnalysis` with type guard: check for `capacityAssessment` and `parallelGroups` keys. If absent (old format), render existing UI without new sections.
  - **Capacity card:** Use shadcn `Card` with a heading "Sprint Capacity". Show a horizontal stat row: `{developerCount} devs | {totalPoints} pts | Target: {velocityTarget} pts`. Status badge using `Badge` component with appropriate variant.
  - **Parallel groups section:** Render after capacity, before conflicts. Each group as a `Card` with group number header and story display IDs as `Badge` elements. Rationale as muted text below.
  - **Dismiss action:** Replace `useState(dismissedIds)` with reading `dismissed` from cachedAnalysis. "Dismiss" button calls `dismissSprintConflict` server action, then `router.refresh()`.
  - **"Show dismissed" toggle:** A checkbox/switch that shows dismissed conflicts with a visual indicator (strikethrough or muted).
- In `src/components/sprints/conflict-banner.tsx`:
  - Add `storyAAssignee` and `storyBAssignee` props.
  - Render: "{assigneeA || 'Unassigned'} ({storyADisplayId}) and {assigneeB || 'Unassigned'} ({storyBDisplayId}) both modify {overlappingComponent}".

---

## Summary

| # | Task | Complexity | Depends On | Gaps Covered |
|---|------|-----------|------------|-------------|
| 1 | Schema migration | S | None | GAP-001, 011, 012 (partial) |
| 2 | Harness refactor | M | Task 1, Phase 2 | GAP-014 |
| 3 | Capacity + parallelization + developer attribution | M | Task 2 | GAP-001, 002, 004 |
| 4 | Mid-sprint triggers + dismissal persistence | M | Task 3 | GAP-003, 005 |
| 5 | Context package: epic/feature + discovery notes | M | Task 1 | GAP-006, 008 |
| 6 | Context package: full articles + semantic ranking | M | Task 1 | GAP-007 |
| 7 | NLP org query endpoint | L | Task 1 | GAP-009 |
| 8 | Component report endpoint | M | Task 1 | GAP-010 |
| 9 | API key expiry + rotation | M | Task 1 | GAP-011 |
| 10 | Brownfield warning | M | Task 1 | GAP-012 |
| 11 | Developer API docs update | S | Tasks 7, 8, 9 | GAP-013 |
| 12 | Sprint intelligence UI | M | Task 3 | GAP-001, 002, 004, 005 (UI) |
| 13 | Rewrite Context Package Assembly per Addendum §4.6 (9 steps, 1 LLM call, <3s p95) | L | Phase 6 (`search_org_kb`) | Addendum v1 |
| 14 | Route sprint health briefing to Briefing/Status Pipeline (Phase 2) | S | Phase 2 | Addendum v1 |
| 15 | Context Package Assembly eval fixtures (10 labeled, brownfield + greenfield + high-component-count) | M | Task 13, Phase 11 eval harness | Addendum §5.6 |

---

### Task 15: Context Package Assembly eval fixtures

| Attribute | Details |
|-----------|---------|
| **Scope** | Author 10 labeled eval fixtures for Context Package Assembly (Addendum §5.6). Coverage split: 4 brownfield stories (rescue/takeover with existing org metadata + annotations + domains), 4 greenfield stories (no existing org metadata, relying on discovery Q&A + requirements), 2 high-component-count stories (10+ impacted components, exercising the 20k-token budget trim logic). Fixtures live under `/evals/context_package_assembly/` in Phase 11 harness infrastructure; Phase 5 owns authorship, gold labels, and maintenance. |
| **Depends On** | Task 13 (pipeline implementation), Phase 11 eval harness delivered |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] 10 fixtures committed under `/evals/context_package_assembly/` with README documenting the scenario mix.
- [ ] Each fixture input: `{storyId, projectFixtureId}`; gold: `{businessContext, impactedComponents[], domains[], discoveryNotes[], inFlightConflicts[], contextBriefSummary}`.
- [ ] Assertions: (1) all mandatory context sections populated, (2) impacted-component set matches gold within tolerance, (3) token count <=20k, (4) p95 latency <3s over repeated runs.
- [ ] Brownfield fixtures exercise `search_org_kb` (Layer 5).
- [ ] Greenfield fixtures exercise discovery Q&A retrieval path.
- [ ] High-component-count fixtures exercise the trim-by-lowest-semantic-similarity step.
- [ ] Eval suite registered with Phase 11 harness, tagged `context-package-assembly`.

**Implementation Notes:**
- Reuse project fixture data from Phase 11 where possible; add minimal fixture rows for edge scenarios.
- Fixture gold labels should be authored collaboratively with the architect role during deep-dive of Task 13.
