# Phase 6 Spec: Org, Knowledge

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [06-org-knowledge-gaps.md](./06-org-knowledge-gaps.md)
> Depends On: Phase 2 (Agent Harness, Transcripts)
> Status: Draft
> Last Updated: 2026-04-10

---

## 1. Scope Summary

Complete the Salesforce org connectivity layer and knowledge architecture: add PKCE to OAuth, implement automated incremental sync cron, build the full knowledge refresh pipeline (Phases 3-4 with KnowledgeArticle creation), add the KnowledgeArticle confirmation model, build BusinessContextAnnotation CRUD and context package inclusion, implement planned component creation from story execution, persist BusinessProcessDependency records, build the NLP org query API, implement two-pass semantic retrieval for article selection, add end-of-agent-loop staleness flagging, and fix incremental sync behaviors (needsAssignment flagging, removed component detection).

**In scope:** 15 of 16 domain gaps -> 13 tasks (some gaps consolidated)
**Deferred to V2:**
- GAP-ORG-009 (Org Health Assessment for Rescue/Takeover) - XL complexity feature requiring code quality analysis, security analysis, technical debt inventory, and remediation backlog. The RESCUE_TAKEOVER engagement type exists but behavioral differentiation is a V2 feature. Rationale: this is a standalone analytical capability that does not block any other Phase 6 deliverable or downstream phase. The Phase Plan already identifies this as a V2 candidate.

**Consolidated:**
- GAP-ORG-010 (needsAssignment flagging) and GAP-ORG-011 (incremental soft-delete) are combined into one task with GAP-ORG-002 (automated sync cron) since they modify the same metadata-sync.ts file.
- GAP-ORG-005 (annotations in context packages) is combined with GAP-ORG-004 (annotation CRUD) since the context inclusion is trivial once the write surface exists.
- GAP-ORG-016 (sync schedule UI) is combined with GAP-ORG-002 (sync cron) since the UI is only useful once the cron exists.

---

## 2. Functional Requirements

### 2.1 PKCE on OAuth Web Server Flow (REQ-ORG-001)

- **What it does:** Adds Proof Key for Code Exchange (PKCE) to the existing Salesforce OAuth Web Server Flow, protecting against authorization code interception attacks.
- **Inputs:** User initiates Salesforce org connection from project settings
- **Outputs:** Authorization URL includes `code_challenge` and `code_challenge_method=S256`. Token exchange includes `code_verifier`.
- **Business rules:**
  - Generate a cryptographically random `code_verifier` (43-128 characters, URL-safe base64).
  - Compute `code_challenge = BASE64URL(SHA256(code_verifier))`.
  - Store `code_verifier` in the same short-TTL store as the CSRF state token (session or encrypted cookie), keyed by the state parameter.
  - On callback, include `code_verifier` in the token exchange request.
  - jsforce OAuth2 does not natively support PKCE parameters - manually append `code_challenge` and `code_challenge_method` to the authorization URL, and pass `code_verifier` in the token exchange body.
- **Files:** `src/lib/salesforce/oauth.ts`, `src/app/api/auth/salesforce/authorize/route.ts`, `src/app/api/auth/salesforce/callback/route.ts`

### 2.2 Automated Incremental Sync Cron with needsAssignment and Soft-Delete Fixes (REQ-ORG-002)

- **What it does:** Implements the automated incremental metadata sync that runs on a configurable cron schedule per project. Also fixes two behavioral gaps: flagging new unclassified components with `needsAssignment = true`, and soft-deleting removed components during incremental syncs.
- **Inputs:** Cron trigger (default every 4 hours) + manual trigger via existing sync button
- **Outputs:** Updated OrgComponent records, new components flagged for assignment, removed components marked inactive
- **Business rules:**
  - Create a new Inngest function `incrementalSyncCronFunction` with dual triggers: `{ event: "org.sync-requested" }` and `{ cron: "0 */4 * * *" }`.
  - On cron trigger: query all active projects with non-null `sfOrgInstanceUrl`. For each, check `sfOrgLastSyncAt + sfOrgSyncIntervalHours > now()` - skip if not yet due.
  - Run Phases 1-2 only (Parse + Classify) per the tech spec Section 6.1.1.
  - After upserting components, set `needsAssignment = true` on any component where `domainGroupingId IS NULL`. This feeds the full knowledge refresh (REQ-ORG-003).
  - During incremental sync, compare fetched component API names against existing active components. Any existing active component NOT in the fetched set gets `isActive = false` (soft-delete). This matches the existing FULL sync behavior but extends it to incremental runs.
  - Update `sfOrgLastSyncAt` on the project after successful sync.
  - Emit `METADATA_SYNC_COMPLETE` notification.
- **Files:** `src/lib/inngest/functions/metadata-sync.ts` (modify existing + create cron function), `src/lib/salesforce/metadata-sync.ts` (add needsAssignment logic, extend soft-delete to incremental), `src/app/api/inngest/route.ts` (register new function)

### 2.3 Sync Schedule Configuration UI (REQ-ORG-003)

- **What it does:** Adds a form input to change `sfOrgSyncIntervalHours` from the project settings Org tab, replacing the current read-only display.
- **Inputs:** SA or PM enters a new sync interval (integer hours, 1-168 range)
- **Outputs:** Updated `sfOrgSyncIntervalHours` on the Project record
- **Business rules:**
  - Validate: integer, minimum 1 hour, maximum 168 hours (1 week). Value of 0 disables automated sync for this project.
  - Only SA and PM roles can modify.
  - Display next scheduled sync time based on `sfOrgLastSyncAt + sfOrgSyncIntervalHours`.
  - Server action with Zod validation and role gate.
- **Files:** `src/app/(dashboard)/projects/[projectId]/settings/org/page.tsx`, `src/actions/org-connection.ts` (add updateSyncInterval action)

### 2.4 Full Knowledge Refresh Pipeline (REQ-ORG-004)

- **What it does:** Implements the full knowledge refresh Inngest function that runs Phases 3-4 (Synthesize + Articulate) on stale/unassigned content. Includes the "Refresh Knowledge Base" UI button and the weekly cron trigger.
- **Inputs:** Manual trigger via UI button, weekly cron (Sunday 2am UTC), or `org.knowledge-refresh-requested` event
- **Outputs:** New/updated BusinessProcess records, new KnowledgeArticle drafts, BusinessProcessDependency records
- **Business rules:**
  - Create `knowledgeRefreshFunction` per tech spec Section 7.4 with dual triggers: `{ event: "org.knowledge-refresh-requested" }` and `{ cron: "0 2 * * 0" }`.
  - Gather targets: components with `needsAssignment = true`, articles with `isStale = true`, BusinessProcesses with components modified since `lastRefreshedAt`.
  - If no targets, return early (no-op).
  - Run Phase 3 (Synthesize): create/update BusinessProcess + BusinessProcessComponent records. Persist `dependsOn` data as BusinessProcessDependency records (fixing GAP-ORG-015).
  - Run Phase 4 (Articulate): create KnowledgeArticle drafts (fixing GAP-ORG-007). One per business process (`articleType = BUSINESS_PROCESS`) and one per domain grouping (`articleType = DOMAIN_OVERVIEW`).
  - All new records: `isAiSuggested = true`, `isConfirmed = false`. Existing confirmed non-stale articles are never overwritten. Stale confirmed articles are updated in-place.
  - Create KnowledgeArticleReference records linking articles to their constituent components and processes.
  - Clear `needsAssignment = false` on processed components.
  - Clear `isStale = false` on refreshed articles.
  - Emit `embedding.batch-requested` for new articles.
  - Add "Refresh Knowledge Base" button to the knowledge page UI (visible to SA and PM only).
- **Files:** `src/lib/inngest/functions/knowledge-refresh.ts` (new), `src/lib/inngest/functions/org-ingestion.ts` (extract shared synthesize logic), `src/lib/agent-harness/tasks/org-synthesize.ts` (add article generation step), `src/app/(dashboard)/projects/[projectId]/knowledge/page.tsx` (add refresh button), `src/actions/org-analysis.ts` (add triggerKnowledgeRefresh action), `src/app/api/inngest/route.ts` (register)

### 2.5 Ingestion Phase 4 - KnowledgeArticle Creation (REQ-ORG-005)

- **What it does:** Adds the Articulate step (Phase 4) to the initial org ingestion pipeline so that the first full ingestion produces KnowledgeArticle drafts alongside BusinessProcess records.
- **Inputs:** Full org ingestion triggered on initial org connection
- **Outputs:** KnowledgeArticle records (one per process + one per domain), KnowledgeArticleReference records
- **Business rules:**
  - After `synthesizeBusinessProcesses` (Phase 3), add an `articulate-knowledge` step.
  - The AI receives: BusinessProcess records just created, DomainGrouping records, OrgComponent records with their relationships.
  - For each BusinessProcess: generate a KnowledgeArticle with `articleType = BUSINESS_PROCESS`, a title, a markdown content body synthesizing understanding, a ~50-token summary, confidence level, `authorType = AI_GENERATED`.
  - For each DomainGrouping with >5 assigned components: generate a KnowledgeArticle with `articleType = DOMAIN_OVERVIEW`.
  - Create KnowledgeArticleReference records linking each article to its referenced entities (processes, components).
  - Emit `embedding.batch-requested` for all new articles.
  - This is distinct from REQ-ORG-004 (refresh): this runs during initial ingestion, REQ-ORG-004 runs on subsequent refreshes.
- **Files:** `src/lib/inngest/functions/org-ingestion.ts` (add Phase 4 step), `src/lib/agent-harness/tasks/article-synthesis.ts` (implement or verify article synthesis task)

### 2.6 BusinessProcessDependency Persistence (REQ-ORG-006)

- **What it does:** Persists the `dependsOn` data from the org synthesize AI output as BusinessProcessDependency records, which are currently parsed and silently discarded.
- **Inputs:** AI synthesis output with `dependsOn: string[]` per business process
- **Outputs:** BusinessProcessDependency records with sourceProcessId, targetProcessId, dependencyType
- **Business rules:**
  - In `synthesizeBusinessProcesses` (org-ingestion.ts), after creating BusinessProcess records, iterate the `dependsOn` array for each process.
  - Match dependency names to the just-created BusinessProcess records by name.
  - Create BusinessProcessDependency records with `dependencyType` inferred from the AI output (default to `FEEDS_DATA` if type is ambiguous).
  - Skip unresolved dependencies (referenced process not found) - log a warning but do not fail.
  - Use `createMany` with `skipDuplicates` to handle re-runs idempotently.
- **Files:** `src/lib/inngest/functions/org-ingestion.ts` (modify synthesizeBusinessProcesses step)

### 2.7 KnowledgeArticle Confirmation Model (REQ-ORG-007)

- **What it does:** Adds an `isConfirmed` field to KnowledgeArticle and builds the confirmation UI and server actions, matching the existing pattern used by DomainGrouping and BusinessProcess.
- **Inputs:** Architect reviews AI-generated articles in the knowledge UI
- **Outputs:** Articles marked as confirmed, edited, or discarded. Context assembly respects confirmation status.
- **Business rules:**
  - Add `isConfirmed Boolean @default(false)` to KnowledgeArticle in Prisma schema.
  - Add server actions: `confirmArticle`, `rejectArticle`, `editAndConfirmArticle`, `bulkConfirmHighConfidence` (confirm all articles with `confidence = HIGH` in one click).
  - Only SA role can confirm/reject/edit articles.
  - Context assembly (`smart-retrieval.ts`, `article-summaries.ts`) must filter: only confirmed articles OR all articles with a note of confirmation status (configurable per context loader - default to confirmed-only for context packages sent to Claude Code, confirmed + unconfirmed-with-disclaimer for internal AI tasks).
  - Knowledge list page: add confirmation status column, confirm/reject/edit action buttons, bulk confirm button.
  - Unconfirmed articles show a visual indicator (badge/icon).
- **Files:** `prisma/schema.prisma` (add field + migration), `src/actions/knowledge.ts` (add confirmation actions), `src/app/(dashboard)/projects/[projectId]/knowledge/page.tsx` (add confirmation UI), `src/lib/agent-harness/context/article-summaries.ts` (add isConfirmed filter), `src/lib/agent-harness/context/smart-retrieval.ts` (respect confirmation status)

### 2.8 BusinessContextAnnotation CRUD and Context Package Inclusion (REQ-ORG-008)

- **What it does:** Builds the complete write surface for BusinessContextAnnotation (create, read, delete) and includes annotations in context packages when stories touch annotated components.
- **Inputs:** BA or SA adds annotation text to an org component from the component detail view
- **Outputs:** Annotation records stored and included in context packages for Claude Code and agent harness
- **Business rules:**
  - Server actions: `createAnnotation(orgComponentId, annotationText)`, `deleteAnnotation(annotationId)`. No update - delete and recreate for simplicity.
  - Role gates: SA, BA, PM can create annotations. Only the creator or SA can delete.
  - UI: annotation panel on the org component detail page. Shows existing annotations with author and date. "Add Annotation" form with textarea.
  - Context package inclusion: modify `loadOrgComponentContext` in `org-components.ts` to include the `.annotations` relation in the Prisma query. Format annotations as "Human context for {componentApiName}: {annotationText} (added by {author})".
  - Context package API route (`/api/v1/context-package/route.ts`): annotations flow through automatically once the context loader includes them.
- **Files:** `src/actions/annotations.ts` (new), `src/app/(dashboard)/projects/[projectId]/org/components/[componentId]/page.tsx` (add annotation panel - create if needed), `src/lib/agent-harness/context/org-components.ts` (add .annotations include), `src/app/api/v1/context-package/route.ts` (verify annotations pass through)

### 2.9 Planned Component Creation from Story Execution (REQ-ORG-009)

- **What it does:** When a story's impacted components list includes components that do not exist in the org knowledge base, automatically creates placeholder OrgComponent records with `componentStatus = PLANNED`.
- **Inputs:** Story component assignment via `addStoryComponent` or story enrichment
- **Outputs:** OrgComponent record with `componentStatus = PLANNED` linked to the StoryComponent
- **Business rules:**
  - When a StoryComponent is created with `orgComponentId = null` (free-text mode), check if an OrgComponent with matching `componentName` and inferred `componentType` already exists for the project.
  - If no match: create an OrgComponent with `componentStatus = PLANNED`, `apiName = componentName`, `componentType` inferred from name patterns (e.g., names ending in `__c` with a dot suggest FIELD, names ending in `__c` alone suggest OBJECT, names ending in `Trigger` suggest APEX_TRIGGER). Default to OTHER if inference fails.
  - Link the StoryComponent to the newly created OrgComponent by setting `orgComponentId`.
  - On subsequent metadata syncs, if a PLANNED component is found in the org, update it to `componentStatus = EXISTING` and merge metadata.
  - This enables PLANNED components to participate in conflict detection (they now have an orgComponentId).
- **Files:** `src/actions/stories.ts` (modify addStoryComponent), `src/actions/enrichment.ts` (modify component application), `src/lib/salesforce/metadata-sync.ts` (add PLANNED->EXISTING upgrade logic)

### 2.10 NLP Org Query API (REQ-ORG-010)

- **What it does:** Implements a natural language query endpoint for org metadata, allowing Claude Code skills (and internal AI tasks) to ask questions like "fields on Account" or "triggers on Case" instead of requiring exact enum values and UUIDs.
- **Inputs:** Natural language query string + projectId
- **Outputs:** Filtered OrgComponent records matching the query intent
- **Business rules:**
  - New endpoint: `POST /api/v1/org/query` accepting `{ query: string }` in the body. Project scoping via API key (same auth as existing v1 endpoints).
  - Query parsing strategy (no AI call needed for most queries):
    1. Regex pattern matching for common Salesforce query patterns: "fields on {ObjectName}", "triggers on {ObjectName}", "flows on {ObjectName}", "classes referencing {ObjectName}", "all {ComponentType}s", "components in {DomainName} domain".
    2. If regex matches: translate to structured Prisma queries (e.g., "fields on Account" -> `WHERE componentType = 'FIELD' AND parentComponent.apiName = 'Account'`).
    3. If no regex match: fall back to full-text search against component apiName and label using tsvector.
    4. If full-text returns <3 results and embeddings exist: fall back to semantic search using pgvector cosine similarity against the query embedding.
  - Include BusinessContextAnnotations in results when available.
  - Return format: array of `{ apiName, label, componentType, parentComponent, domainGrouping, annotations, relationships }`.
  - Rate limit: 60 req/min per API key (consistent with existing endpoints).
- **Files:** `src/app/api/v1/org/query/route.ts` (new), `src/lib/salesforce/org-query.ts` (new - query parsing and execution logic)

### 2.11 Agent Staleness Flagging at End of Loop (REQ-ORG-011)

- **What it does:** Adds a post-loop staleness scan to the agent harness execution engine. After every agent loop completes, the engine queries which KnowledgeArticles reference entities that were modified during the session and flags them as stale.
- **Inputs:** Completed agent harness execution with entity tracking data
- **Outputs:** KnowledgeArticles flagged with `isStale = true`, `staleReason`, `staleSince`. Stale events emitted for background refresh.
- **Business rules:**
  - Implement `flagStaleArticles(projectId, tracking)` per tech spec Section 7.5.
  - Call at the end of `executeTask()` in `engine.ts`, after the main execution loop completes, before returning the result.
  - Query `KnowledgeArticleReference` for any references to modified entity IDs. Set `isStale = true` on matching articles with a reason like "Referenced entities modified during {taskType} session".
  - Emit `article.flagged-stale` Inngest events for each flagged article (triggers background refresh if the article refresh function exists).
  - This is a DB-only operation - no AI calls, minimal latency impact.
  - Depends on Phase 2 Task 4 (entity tracking) being complete, since it reads from `tracking.entitiesCreated` and `tracking.entitiesModified`.
- **Files:** `src/lib/agent-harness/engine.ts` (add flagStaleArticles call), `src/lib/agent-harness/staleness.ts` (new - implement flagStaleArticles function)

### 2.12 Two-Pass Semantic Retrieval for Article Selection (REQ-ORG-012)

- **What it does:** Implements Pass 2 of the three-pass retrieval pattern: embed the current task/query, compute cosine similarity against article embeddings, and select the top-N most semantically relevant articles.
- **Inputs:** Task context (assembled query string from the task's context loader) + article embeddings
- **Outputs:** Top-N articles ranked by semantic relevance to the current task, replacing the current recency/useCount ordering
- **Business rules:**
  - In `smart-retrieval.ts`, after loading article summaries (Pass 1), embed the assembled context/query.
  - Use pgvector cosine similarity (`1 - (embedding <=> query_embedding)`) against KnowledgeArticle embeddings to rank articles.
  - Apply effectiveness score boost per tech spec Section 8.3: `adjusted_rank = cosine_similarity * (1 + (effectivenessScore * 0.2))` for articles with `useCount >= 5`.
  - Select top-N articles (default N=5 for most tasks, N=3 for context packages to Claude Code).
  - Load full content of only the selected top-N articles (Pass 3).
  - Fallback: if embedding generation fails or no articles have embeddings (`embeddingStatus = 'GENERATED'`), fall back to existing recency/useCount ordering.
  - Increment `useCount` on each article included in a context package.
- **Files:** `src/lib/agent-harness/context/smart-retrieval.ts` (modify retrieval flow), `src/lib/agent-harness/context/article-summaries.ts` (verify summary loading compatible)

### 2.13 Planned Component Status Upgrade During Sync (REQ-ORG-013)

- **What it does:** During metadata sync, when a component with `componentStatus = PLANNED` is found in the org metadata, upgrade it to `EXISTING` and merge the real metadata from the org.
- **Inputs:** Metadata sync detects a component API name that already exists as PLANNED in the database
- **Outputs:** OrgComponent updated from PLANNED to EXISTING with full metadata from the org
- **Business rules:**
  - In the metadata-sync upsert logic, when upserting a component, check if an existing record has `componentStatus = PLANNED`.
  - If so: update to `componentStatus = EXISTING`, merge in all metadata fields from the org (label, apiVersion, namespace, parentComponentId, etc.), set `lastSyncedAt`.
  - Preserve any existing annotations and StoryComponent links.
  - This completes the lifecycle: story references a planned component -> component created as PLANNED -> metadata sync finds it in org -> upgraded to EXISTING.
- **Files:** `src/lib/salesforce/metadata-sync.ts` (modify upsert logic)

---

## 3. Technical Approach

### 3.1 Implementation Strategy

Infrastructure first (sync, ingestion), then knowledge layer (articles, confirmation), then enrichment features (annotations, planned components, NLP query), then cross-cutting (staleness, semantic retrieval):

1. **OAuth hardening** (REQ-001) - Security fix, no dependencies. Do first.
2. **Sync infrastructure** (REQ-002, 003) - Automated sync cron with behavioral fixes. Foundational for knowledge refresh.
3. **Knowledge pipeline** (REQ-004, 005, 006) - Full knowledge refresh + Phase 4 articulation + dependency persistence. Critical path for knowledge value.
4. **Confirmation model** (REQ-007) - Must follow article creation. Enables trusted context assembly.
5. **Annotations** (REQ-008) - Independent of knowledge pipeline. Can parallelize with confirmation model.
6. **Planned components** (REQ-009, 013) - Story-to-org bridge. Can parallelize with annotations.
7. **NLP query** (REQ-010) - Developer API feature. Independent of knowledge pipeline.
8. **Cross-cutting** (REQ-011, 012) - Staleness + semantic retrieval. Do last since they depend on articles existing and Phase 2 entity tracking.

### 3.2 File/Module Structure

```
src/lib/salesforce/
  oauth.ts                           -- MODIFY (add PKCE generation + verification)
  metadata-sync.ts                   -- MODIFY (needsAssignment, soft-delete on incremental, PLANNED upgrade)
  org-query.ts                       -- CREATE (NLP query parsing + execution)

src/lib/inngest/functions/
  metadata-sync.ts                   -- MODIFY (add cron trigger, multi-project dispatch)
  knowledge-refresh.ts               -- CREATE (full knowledge refresh: Phases 3-4)
  org-ingestion.ts                   -- MODIFY (add Phase 4 Articulate step, persist dependencies)

src/lib/agent-harness/
  engine.ts                          -- MODIFY (add flagStaleArticles call at end of loop)
  staleness.ts                       -- CREATE (flagStaleArticles function)
  tasks/
    org-synthesize.ts                -- MODIFY (add article synthesis to output)
    article-synthesis.ts             -- MODIFY (implement article generation task)
  context/
    org-components.ts                -- MODIFY (include .annotations relation)
    smart-retrieval.ts               -- MODIFY (add Pass 2 semantic ranking)
    article-summaries.ts             -- MODIFY (add isConfirmed filter)

src/actions/
  org-connection.ts                  -- MODIFY (add updateSyncInterval action)
  org-analysis.ts                    -- MODIFY (add triggerKnowledgeRefresh action)
  knowledge.ts                       -- MODIFY (add confirmation actions)
  annotations.ts                     -- CREATE (CRUD actions for BusinessContextAnnotation)
  stories.ts                         -- MODIFY (planned component creation in addStoryComponent)
  enrichment.ts                      -- MODIFY (planned component creation in enrichment path)

src/app/api/
  auth/salesforce/authorize/route.ts -- MODIFY (add PKCE params to auth URL)
  auth/salesforce/callback/route.ts  -- MODIFY (include code_verifier in token exchange)
  v1/org/query/route.ts              -- CREATE (NLP org query endpoint)
  v1/context-package/route.ts        -- VERIFY (annotations pass through)
  inngest/route.ts                   -- MODIFY (register new functions)

src/app/(dashboard)/projects/[projectId]/
  settings/org/page.tsx              -- MODIFY (sync interval form)
  knowledge/page.tsx                 -- MODIFY (refresh button, confirmation UI)
  org/components/[componentId]/
    page.tsx                         -- CREATE or MODIFY (annotation panel)

prisma/
  schema.prisma                      -- MODIFY (add isConfirmed to KnowledgeArticle)
```

### 3.3 API Contracts

**NLP Org Query:**
```
POST /api/v1/org/query
Authorization: Bearer {apiKey}
Body: { "query": "fields on Account" }
Response: {
  "results": [
    {
      "apiName": "Industry",
      "label": "Industry",
      "componentType": "FIELD",
      "parentComponent": { "apiName": "Account", "label": "Account" },
      "domainGrouping": { "name": "Sales" },
      "annotations": [{ "text": "Used for tier pricing", "author": "John" }],
      "relationships": []
    }
  ],
  "queryType": "structured" | "fulltext" | "semantic",
  "totalCount": 42
}
```

**Knowledge Refresh Trigger:**
```
POST /api/inngest (event emission)
Event: { name: "org.knowledge-refresh-requested", data: { projectId } }
```

### 3.4 Data Changes

Add to KnowledgeArticle in `prisma/schema.prisma`:
```prisma
isConfirmed  Boolean  @default(false)
```

Migration: additive only, nullable/defaulted field, no data backfill needed. Existing articles (if any) default to `isConfirmed = false`, which is correct behavior (they should be reviewed).

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| Cron fires but project's sync interval not yet elapsed | Skip project, return early | N/A - silent skip |
| Cron fires but project has no SF org connected | Skip project (sfOrgInstanceUrl is null) | N/A |
| SF access token expired during cron sync | Attempt token refresh using refresh token. If refresh fails, skip project and emit error notification. | Notification: "Metadata sync failed - Salesforce token expired. Please reconnect." |
| Knowledge refresh finds 0 targets (nothing stale/unassigned) | Return early, no AI calls, no cost | N/A |
| Article synthesis produces article for process that already has a confirmed article | Skip - do not overwrite confirmed non-stale articles | N/A |
| Article synthesis for stale confirmed article | Update in-place: increment version, update content, set isStale=false, keep isConfirmed=true | N/A |
| PKCE code_verifier lost between authorize and callback | Callback fails with "invalid_grant" from Salesforce. User sees error and must retry. | Error page: "Authentication failed. Please try connecting again." |
| NLP query matches no regex patterns and no full-text results | Return empty array with 200 status. Include suggestion: "Try: fields on {object}, triggers on {object}" | `{ results: [], queryType: "none", suggestion: "..." }` |
| NLP query with semantic fallback but no embeddings generated yet | Skip semantic search, return full-text results only | N/A - graceful degradation |
| Planned component name matches existing EXISTING component | Link to existing component instead of creating duplicate | N/A |
| Multiple stories reference same planned component name | First creates the PLANNED OrgComponent, subsequent stories link to existing | Unique constraint on (projectId, apiName, componentType) prevents duplicates |
| Incremental sync detects removed component that has annotations | Soft-delete (isActive=false) preserves annotations. Component still shows in history views. | N/A |
| Agent loop modifies entity but Phase 2 entity tracking not yet implemented | flagStaleArticles receives empty tracking arrays, does nothing | N/A - graceful no-op |
| Embedding API call fails during semantic retrieval | Fall back to recency/useCount ordering | N/A - degraded but functional |
| Annotation text is empty or whitespace-only | Reject with validation error | 400: "Annotation text is required" |
| bulkConfirmHighConfidence with 0 HIGH confidence articles | No-op, return success with count: 0 | N/A |

---

## 5. Integration Points

### From Prior Phases

- **Phase 1 (RBAC):** Role gates on all new actions (SA for confirmation/sync config, BA/SA/PM for annotations). `getCurrentMember` auth fix ensures only active members can access.
- **Phase 2 (Agent Harness):**
  - REQ-ORG-011 (staleness flagging) depends on Phase 2 Task 4 (entity tracking in SessionLog). If entity tracking is not yet complete, staleness flagging is a no-op.
  - REQ-ORG-012 (semantic retrieval) integrates with the agent harness's context assembly pipeline built in Phase 2 Tasks 6-8.
  - Phase 2 Task 7 has a TODO for `getArticleSummaries` - this phase implements the full article pipeline that makes article summaries available.

### For Future Phases

- **Phase 3 (Discovery/Questions):** Knowledge articles created here provide context for gap detection and readiness assessment AI tasks.
- **Phase 4 (Work Management):** Planned component creation (REQ-009) enables the dual-mode OrgComponent selector in the story form. Knowledge articles inform story generation via cross-reference.
- **Phase 5 (Sprint/Developer API):**
  - Context package API gains annotations (REQ-008) and confirmed articles automatically.
  - NLP org query (REQ-010) is the API endpoint that Phase 5's GAP-SPRINT-009 needs. Phase 5 can simply expose this endpoint in its developer API documentation.
  - Component report endpoint benefits from planned components and annotations.
- **Phase 7 (Dashboards/Search):** Knowledge articles are searchable entities. Confirmation status powers knowledge health metrics on dashboards.
- **Phase 8 (Documents/Notifications):** METADATA_SYNC_COMPLETE and knowledge refresh notifications wire into the notification dispatch infrastructure.

---

## 6. Acceptance Criteria

- [ ] OAuth authorization URL includes `code_challenge` and `code_challenge_method=S256`; token exchange includes `code_verifier`
- [ ] Automated incremental sync runs on cron schedule for all active connected projects
- [ ] Projects not yet due for sync (based on sfOrgSyncIntervalHours) are skipped by the cron
- [ ] sfOrgSyncIntervalHours is configurable via settings UI (SA/PM only, validated 0-168 range)
- [ ] New unclassified components from incremental sync have `needsAssignment = true`
- [ ] Components removed from the org during incremental sync are soft-deleted (`isActive = false`)
- [ ] Full knowledge refresh function processes unassigned components and stale articles
- [ ] Full knowledge refresh is triggerable via "Refresh Knowledge Base" button (SA/PM only)
- [ ] Full knowledge refresh runs on weekly cron (Sunday 2am UTC)
- [ ] Initial org ingestion creates KnowledgeArticle drafts (one per business process + one per domain)
- [ ] KnowledgeArticleReference records link articles to their constituent entities
- [ ] BusinessProcessDependency records are persisted from the AI synthesis output
- [ ] KnowledgeArticle has `isConfirmed` field; new AI-generated articles default to `isConfirmed = false`
- [ ] Architect can confirm, reject, edit, and bulk-confirm knowledge articles from the UI
- [ ] Context assembly filters articles by confirmation status (confirmed-only for external context packages)
- [ ] BusinessContextAnnotation CRUD works: create, read, delete with role gates
- [ ] Annotation panel appears on org component detail page
- [ ] Annotations are included in context packages when stories touch annotated components
- [ ] Free-text story components create PLANNED OrgComponent records when no match exists
- [ ] PLANNED components are upgraded to EXISTING when found during metadata sync
- [ ] NLP org query endpoint accepts natural language queries and returns filtered components
- [ ] NLP query supports common patterns: "fields on X", "triggers on X", "flows on X"
- [ ] Agent harness execution engine flags stale articles at end of every agent loop
- [ ] Semantic retrieval (Pass 2) ranks articles by cosine similarity when embeddings are available
- [ ] Semantic retrieval falls back to recency/useCount when embeddings are unavailable
- [ ] No regressions in existing org connectivity, ingestion, or knowledge features

---

## 7. Open Questions

None - all scoping decisions resolved during deep dive. GAP-ORG-009 (Org Health Assessment) explicitly deferred to V2 per Phase Plan risk notes.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 6`. GAP-ORG-009 deferred to V2. GAP-ORG-010/011 consolidated with GAP-ORG-002. GAP-ORG-005 consolidated with GAP-ORG-004. GAP-ORG-016 consolidated with GAP-ORG-002/003. GAP-ORG-015 addressed within REQ-ORG-004. |
