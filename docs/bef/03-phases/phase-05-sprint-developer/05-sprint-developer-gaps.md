# Gap Analysis: Sprint Intelligence and Developer Integration

**PRD Sections Audited:** 11 (Sprint Intelligence), 12 (Developer Execution Integration), 14 (Recommended Sandbox Strategy)
**Date:** 2026-04-08

## Summary
- Total gaps: 14
- Critical: 1
- Significant: 8
- Minor: 5

---

## Gaps

### GAP-SPRINT-001: Capacity assessment capability not implemented

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 11.1
- **What PRD says:** "Capacity Assessment. Given the number of developers and the estimated story points, the AI flags if the sprint is over- or under-committed."
- **What exists:** The sprint intelligence Inngest function at `src/lib/inngest/functions/sprint-intelligence.ts` loads stories with `storyPoints` but does not query the team's developer count, does not sum total points, does not compare points to capacity, and does not produce a capacity assessment in its output schema. The `Sprint` model at `prisma/schema.prisma:725` has no `teamCapacity` or `velocityTarget` field. The `sprintIntelligenceTask` definition at `src/lib/agent-harness/tasks/sprint-intelligence.ts` does not mention capacity in its system prompt template or output schema.
- **The gap:** The AI prompt asks for conflict severity and execution ordering only. There is no capacity input, no over/under-commitment flag in the JSON output shape, and no UI surface for it in `src/components/sprints/sprint-dashboard.tsx` or `src/components/sprints/sprint-intelligence-panel.tsx`.
- **Scope estimate:** M
- **Dependencies:** Requires a `teamCapacity` or `velocityTarget` field on Sprint (or a derived count from ProjectMember records filtered to DEVELOPER role), and an extension to the Inngest function and cached analysis schema.
- **Suggested phase grouping:** Sprint Intelligence Completion

---

### GAP-SPRINT-002: Parallelization analysis not surfaced as a named output

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 11.1
- **What PRD says:** "Parallelization Analysis. Which stories can be worked on simultaneously without conflict. If Story C touches Account and Story D touches Case with no overlap, they can be parallelized."
- **What exists:** The task prompt at `src/lib/agent-harness/tasks/sprint-intelligence.ts:28` says "Stories with no overlaps can be parallelized" in passing. The Inngest function output schema at `src/lib/inngest/functions/sprint-intelligence.ts:37` defines only `conflicts` and `dependencies` arrays. There is no `parallelGroups` output, no rendering in `SprintIntelligencePanel`, and no mention in the `DependencyList` component at `src/components/sprints/dependency-list.tsx`.
- **The gap:** Parallelization-safe story groups are never explicitly computed or surfaced to the user. The dependency ordering implies some of this but does not name which stories can safely run in parallel.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Sprint Intelligence Completion

---

### GAP-SPRINT-003: Mid-sprint re-analysis not triggered by story status changes or reassignment

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 11.2
- **What PRD says:** "When tickets are added or reassigned mid-sprint, the AI can re-run its analysis: Flag new conflicts introduced by the change. Suggest resequencing if dependencies have shifted. Alert if the sprint is now over-committed."
- **What exists:** `SPRINT_STORIES_CHANGED` is fired by `assignStoriesToSprint` and `removeStoriesFromSprint` in `src/actions/sprints.ts:227,274`. That covers the "added" case. However, story status changes (e.g., `IN_PROGRESS` → `DONE`) do not fire `SPRINT_STORIES_CHANGED`. Story reassignment between developers does not fire `SPRINT_STORIES_CHANGED`. The `STORY_STATUS_CHANGED` event in `src/lib/inngest/events.ts:26` only triggers the Jira sync function and the notification dispatch — not sprint intelligence.
- **The gap:** A mid-sprint status change that shifts workload (e.g., a story moving to DONE freeing a developer, or a story being reassigned mid-flight) never triggers re-analysis. The capacity alert path described in Section 11.2 cannot fire since capacity assessment is not implemented (GAP-SPRINT-001), but even when it is, the trigger is missing.
- **Scope estimate:** S
- **Dependencies:** GAP-SPRINT-001
- **Suggested phase grouping:** Sprint Intelligence Completion

---

### GAP-SPRINT-004: Cross-developer coordination has no assignee awareness

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 11.3
- **What PRD says:** "The AI tracks which developers are working on which stories and their impacted components. When it detects overlap, it surfaces a recommendation: 'Developer A is working on STORY-42 which modifies AccountTriggerHandler. Developer B is about to start STORY-55 which also touches AccountTriggerHandler.'"
- **What exists:** The sprint intelligence Inngest function at `src/lib/inngest/functions/sprint-intelligence.ts:55-68` loads stories with `id`, `displayId`, `title`, and `storyComponents` only. The `select` clause explicitly does not include `assigneeId` or `assignee`. Conflict output objects include `storyADisplayId` and `storyBDisplayId` but no developer names. The `ConflictBanner` at `src/components/sprints/conflict-banner.tsx` therefore cannot surface developer attribution. The AI prompt at `src/lib/inngest/functions/sprint-intelligence.ts:128-139` has no mention of developer assignments.
- **The gap:** The system knows who is assigned to each story (the `Story` model has an `assigneeId` FK and `assignee` relation). This data is simply never loaded or passed to the AI. The recommendation surface described in Section 11.3 — naming specific developers — is absent.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Sprint Intelligence Completion

---

### GAP-SPRINT-005: Conflict dismissal is client-side only, not persisted

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 11.1 (implied — advisory, but dismissal UX should persist across page loads)
- **What PRD says:** Section 11 describes conflict alerts as advisory. The PRD does not explicitly require persistence of dismissal.
- **What exists:** `src/components/sprints/sprint-intelligence-panel.tsx:49` uses `useState` for `dismissedIds`. The `cachedAnalysis` JSON stored in `Sprint.cachedAnalysis` at `prisma/schema.prisma:733` includes a `dismissed: boolean` field in the shape defined at `src/lib/inngest/functions/sprint-intelligence.ts:156-168`, but the client never writes back to it. Dismissing a conflict banner survives only until the next page load.
- **The gap:** A dismissed conflict reappears on every page refresh. The `dismissed` field in `cachedAnalysis` is set to `false` on write and never updated. A server action to persist dismissal to `cachedAnalysis` is missing.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Sprint Intelligence Completion

---

### GAP-SPRINT-006: Context package missing parent epic/feature business context

- **Severity:** Significant
- **Perspective:** Architecture
- **PRD Reference:** Sections 5.3 and 12.2 (Tier 2)
- **What PRD says:** Section 5.3: `GET /api/projects/:projectId/context-package/:storyId`. Section 12.2: "The parent epic/feature and its business context" is one of the explicitly listed items in the Tier 2 context package.
- **What exists:** The actual route is `GET /api/v1/context-package?storyId=X` at `src/app/api/v1/context-package/route.ts`. The `projectId` is derived from the API key via `withApiAuth`, not from the URL path. The route fetches `story` with `storyComponents` but makes no query to load the parent `Epic` or `Feature` record — `story.epicId` and `story.featureId` are returned as bare IDs only. The epic/feature `description`, `businessContext`, or `name` fields are never fetched or included in the response.
- **The gap:** Two issues in one: (1) URL does not match the PRD spec, which matters when writing Claude Code skills that reference documented endpoints; (2) the Tier 2 business context is incomplete — Claude Code receives a story with `epicId` but no epic name, description, or business rationale to understand the broader context behind the ticket.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Context Package Completeness

---

### GAP-SPRINT-007: Context package returns knowledge article summaries only, not full content

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 12.2 (Tier 2)
- **What PRD says:** "Top relevant knowledge articles (full content) providing the AI's synthesized understanding of the business domain."
- **What exists:** `src/app/api/v1/context-package/route.ts:71-83` queries `knowledgeArticle.findMany` with `select: { id, title, summary, articleType, confidence }`. The `content` field — which holds the full synthesized article text — is explicitly excluded. The query orders by `useCount` descending and takes 10, but does not use semantic search (embedding similarity) to find the most relevant articles for the story's components.
- **The gap:** Claude Code receives article summaries (short excerpts) rather than the full synthesized content the PRD specifies. For complex domain articles, the summary alone is insufficient context for a developer. Additionally, the selection is by usage frequency rather than relevance to the story's components, violating the "Two-pass context retrieval pattern" specified in Section 13.7 of the PRD.
- **Scope estimate:** M
- **Dependencies:** None (semantic search infrastructure exists — `embedding` column on `KnowledgeArticle` is present per `prisma/schema.prisma:1029`)
- **Suggested phase grouping:** Context Package Completeness

---

### GAP-SPRINT-008: Context package omits related discovery notes (answered questions scoped to epic/feature)

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 12.2 (Tier 2)
- **What PRD says:** "Related discovery notes and decisions" is listed as a required element of the Tier 2 context package.
- **What exists:** `src/app/api/v1/context-package/route.ts` fetches decisions scoped to the story's epic/feature (lines 84-108) — that part is implemented. However, it does not fetch answered questions relevant to the story's epic/feature. The `Question` model has `epicId`/`featureId` relationships and a `status` field (ANSWERED, OPEN, etc.), but no query against `Question` appears in the context package route.
- **The gap:** Answered discovery questions — the record of what clients said about how processes work, what edge cases exist, what constraints were surfaced — are absent from the context package. This is exactly the "discovery notes" element the PRD cites.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Context Package Completeness

---

### GAP-SPRINT-009: Tier 3a org/query endpoint is missing entirely

- **Severity:** Critical
- **Perspective:** Functionality
- **PRD Reference:** Sections 5.3 and 12.2 (Tier 3a)
- **What PRD says:** Section 5.3: `GET /api/projects/:projectId/org/query` — "Accepts a query (e.g., 'fields on Account,' 'triggers on Case,' 'integrations touching Order') and returns filtered org metadata from the knowledge base." Section 12.2 Tier 3a: "Knowledge article queries: 'Show me the business context for the Renewal process' returns the AI-curated synthesis of that process, not just raw metadata. Cross-story context: 'Are there other stories touching this component?'"
- **What exists:** `GET /api/v1/org/components` exists at `src/app/api/v1/org/components/route.ts` and supports `type` and `domain` filter params. This is structural/paginated filtering, not natural language querying. There is no endpoint accepting a free-text query and returning semantically matched org components, knowledge articles, or cross-story context.
- **The gap:** The natural language org query capability — allowing Claude Code to ask contextual questions mid-task — does not exist. The endpoint documented in Section 5.3 and relied on by the Tier 3a workflow has no route file anywhere under `src/app/api/v1/`.
- **Scope estimate:** L
- **Dependencies:** Requires semantic search integration (pgvector embeddings on OrgComponent and KnowledgeArticle are present in schema, but query-time embedding generation and cosine similarity search logic must be built).
- **Suggested phase grouping:** Developer Integration API Completeness

---

### GAP-SPRINT-010: Component report endpoint is missing entirely

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 5.3
- **What PRD says:** `POST /api/projects/:projectId/org/component-report` — "Accepts a report of components created or modified for a story. Used for tracking what developers build."
- **What exists:** No route exists at any path matching `component-report`. The developer API docs surface documented in `src/app/(dashboard)/projects/[projectId]/settings/developer-api/developer-api-client.tsx:53-78` lists only four endpoints and does not include this one.
- **The gap:** Claude Code has no mechanism to report back which components it built for a story. The PRD describes this as the mechanism for tracking developer output (with the note that "the authoritative org state comes from the sandbox sync"). Without it, there is no way for the web app to record what a developer actually built until the next org sync.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Developer Integration API Completeness

---

### GAP-SPRINT-011: API keys have no expiry date or rotation mechanism

- **Severity:** Significant
- **Perspective:** Architecture
- **PRD Reference:** Section 5.3 ("All API endpoints require authentication"), Section 22 (Security — implied credential lifecycle)
- **What PRD says:** The PRD does not explicitly specify key expiry, but credential lifecycle management is a standard security requirement implied by Section 22. The `ApiKey` model in the tech spec and schema is described as supporting revocation but not expiry.
- **What exists:** `prisma/schema.prisma:980-998` — `ApiKey` model has `isActive`, `revokedAt`, `lastUsedAt`, and `useCount` but no `expiresAt` field. `src/actions/api-keys.ts` supports generate and revoke only — no rotation action exists. `src/lib/api-keys/generate.ts` generates keys with no expiry parameter.
- **The gap:** Keys are permanently valid until manually revoked. There is no automated expiry, no key rotation flow (generate replacement → automatically revoke old), and no warning when a key has not been used for an extended period. For a system handling client project data, this is a security gap.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Developer Integration API Completeness

---

### GAP-SPRINT-012: Brownfield scratch org warning (Section 14.3) not implemented

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 14.3
- **What PRD says:** "If a project is marked as brownfield or managed services and a developer's environment is identified as a scratch org, the application should surface a warning: 'This is a brownfield engagement but Developer X's environment is a scratch org. Their environment will not have the existing org customizations.'"
- **What exists:** The `Project` model has `engagementType` and `sandboxStrategy`. However, there is no `developerEnvironmentType` field on `ProjectMember`, no UI for developers to register their environment type, no validation logic checking engagementType against developer environment types, and no warning component anywhere in the sprint or project settings pages. Searching for "scratch" in `src/` returns zero relevant results outside of comments in org-related task files.
- **The gap:** The entire feature is unimplemented. It requires: (1) a `developerEnvironmentType` enum and field on `ProjectMember` or a separate developer settings entity; (2) a UI for developers to set their environment type; (3) a warning check on the sprint planning or project settings page; (4) a warning UI component.
- **Scope estimate:** M
- **Dependencies:** None (sandboxStrategy is now persisted per milestone audit gap closure)
- **Suggested phase grouping:** Sandbox Strategy Implementation

---

### GAP-SPRINT-013: Context package URL path does not match PRD spec

- **Severity:** Minor
- **Perspective:** Architecture
- **PRD Reference:** Section 5.3
- **What PRD says:** All five endpoints in Section 5.3 are namespaced under `/api/projects/:projectId/...` — the projectId is in the URL path, making the scope explicit and verifiable by inspection.
- **What exists:** All four implemented routes are under `/api/v1/` with no projectId in the path: `GET /api/v1/context-package`, `GET /api/v1/org/components`, `PATCH /api/v1/stories/:storyId/status`, `GET /api/v1/project/summary`. The projectId is derived exclusively from the API key via `withApiAuth`.
- **The gap:** The URL structure diverges from the PRD spec. The key-derived approach works correctly (project isolation is enforced) but means the Claude Code skill documentation in Section 5.3 doesn't match actual routes. This is a documentation/architecture alignment issue rather than a functional bug.
- **Scope estimate:** S (if only documentation is updated) | L (if route paths are changed)
- **Dependencies:** None
- **Suggested phase grouping:** Developer Integration API Completeness

---

### GAP-SPRINT-014: Sprint intelligence Inngest function bypasses agent harness

- **Severity:** Minor
- **Perspective:** Architecture
- **PRD Reference:** Section 6.4 (three-layer harness architecture: task definitions drive execution)
- **What PRD says:** The agent harness three-layer architecture specifies that the execution engine is generic and driven by task definitions. Task definitions specify the model.
- **What exists:** `src/lib/inngest/functions/sprint-intelligence.ts:129` hardcodes `model: "claude-sonnet-4-20250514"`. The task definition at `src/lib/agent-harness/tasks/sprint-intelligence.ts:61` specifies the same model. However, the Inngest function constructs its own `Anthropic` client and calls the model directly rather than routing through the execution engine. The `sprintIntelligenceTask` definition is imported in `src/lib/agent-harness/tasks/index.ts` but not used anywhere in the Inngest function.
- **The gap:** The task definition exists but is never invoked. The Inngest function bypasses the harness entirely, duplicating the model call, temperature, max_tokens, and prompt assembly inline. This means harness-level features (output validation, retry logic, session log writing, firm-level typographic rules) do not apply to sprint intelligence runs.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Sprint Intelligence Completion

---

## Cross-References

- Story status transitions and role-based transition rules are owned by Agent 4 (Work Management)
- RBAC enforcement on sprint actions is owned by Agent 1 (RBAC/Security)

## Already-Tracked Items

- Phase 12: Roadmap UI (milestones, epic phase grid, execution plan) is entirely unbuilt — referenced but not re-reported here since it's tracked in Phase 12 planning artifacts
