# Phase 6 Tasks: Org, Knowledge

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 13
> Status: 0/13 complete
> Last Updated: 2026-04-10

---

## Execution Order

```
Task 1 (PKCE OAuth) ──────────────────────────────────────────┐
Task 2 (Sync cron + fixes) ──┐                                │
  └── Task 3 (Sync schedule UI)                                │ parallel
Task 4 (Phase 4 Articulate) ─┐                                │
  ├── Task 5 (BP dependencies)│── parallel                     │
  └── Task 6 (Knowledge refresh) ─────────────────────┐       │
       └── Task 7 (Article confirmation model) ─────── │ ──────┘
Task 8 (Annotation CRUD + context) ────────────────── parallel
Task 9 (Planned components) ──┐                               │
  └── Task 10 (PLANNED upgrade in sync) ── parallel            │
Task 11 (NLP org query) ────────────────── parallel            │
       ┌───────────────────────────────────────────────────────┘
Task 12 (Agent staleness flagging) ─── depends on Phase 2 Task 4
Task 13 (Semantic retrieval Pass 2) ── depends on Task 4 (articles must exist)
```

---

## Tasks

### Task 1: Add PKCE to Salesforce OAuth Web Server Flow

| Attribute | Details |
|-----------|---------|
| **Scope** | Generate `code_verifier` and `code_challenge` during authorization, store verifier alongside CSRF state token, include `code_verifier` in token exchange. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Given a user initiates SF org connection, the authorization URL includes `code_challenge` and `code_challenge_method=S256`
- [ ] Given the callback fires, the token exchange body includes the `code_verifier` from the stored session
- [ ] Given the `code_verifier` is missing from session (expired/corrupted), the callback returns a user-friendly error directing them to retry
- [ ] Existing OAuth flow continues to work end-to-end (connect org, store tokens, refresh tokens)

**Implementation Notes:**
File: `src/lib/salesforce/oauth.ts`
- Add a `generatePKCE()` function:
```ts
import { randomBytes, createHash } from "crypto";

function generatePKCE() {
  const verifier = randomBytes(32).toString("base64url"); // 43 chars
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
```
- In `buildAuthorizationUrl`: generate PKCE, store `verifier` alongside the state token (same storage mechanism - cookie or session), append `&code_challenge=${challenge}&code_challenge_method=S256` to the URL.
- In `src/app/api/auth/salesforce/callback/route.ts`: retrieve `code_verifier` from storage, include in the `jsforce.OAuth2.requestToken()` call. Note: jsforce may not support `code_verifier` natively - if not, use a direct HTTP POST to the Salesforce token endpoint instead.
- In `src/app/api/auth/salesforce/authorize/route.ts`: pass PKCE through to the URL builder.

---

### Task 2: Implement automated incremental sync cron with needsAssignment and soft-delete fixes

| Attribute | Details |
|-----------|---------|
| **Scope** | Create the Inngest cron function for automated incremental sync. Add `needsAssignment = true` flagging for unclassified components. Extend soft-delete to incremental syncs. |
| **Depends On** | None |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Inngest function `incremental-metadata-sync-cron` is registered with cron trigger `"0 */4 * * *"`
- [ ] On cron, all active projects with SF org connections are evaluated; only those past their sync interval are processed
- [ ] After incremental sync, new components with no `domainGroupingId` have `needsAssignment = true`
- [ ] After incremental sync, components that exist in DB but were NOT returned by the SF metadata API are set to `isActive = false`
- [ ] `sfOrgLastSyncAt` is updated on the project after successful sync
- [ ] Manual sync via existing button continues to work (event trigger preserved)
- [ ] `METADATA_SYNC_COMPLETE` notification is emitted

**Implementation Notes:**
File: `src/lib/inngest/functions/metadata-sync.ts`

Create a new function alongside the existing event-triggered one:
```ts
const incrementalSyncCronFunction = inngest.createFunction(
  {
    id: "incremental-metadata-sync-cron",
    concurrency: { limit: 1, scope: "env", key: "event.data.projectId" },
  },
  { cron: "0 */4 * * *" },
  async ({ step }) => {
    // Step 1: Get all active projects with SF org connections
    const projects = await step.run("get-active-projects", async () => {
      return prisma.project.findMany({
        where: { status: "ACTIVE", sfOrgInstanceUrl: { not: null } },
        select: { id: true, sfOrgLastSyncAt: true, sfOrgSyncIntervalHours: true },
      });
    });

    // Step 2: For each project past its interval, dispatch sync
    for (const project of projects) {
      const intervalMs = (project.sfOrgSyncIntervalHours ?? 4) * 60 * 60 * 1000;
      if (project.sfOrgSyncIntervalHours === 0) continue; // Disabled
      if (project.sfOrgLastSyncAt && Date.now() - project.sfOrgLastSyncAt.getTime() < intervalMs) continue;

      await step.sendEvent(`sync-${project.id}`, {
        name: EVENTS.ORG_SYNC_REQUESTED,
        data: { projectId: project.id, syncType: "INCREMENTAL" },
      });
    }
  }
);
```

File: `src/lib/salesforce/metadata-sync.ts`
- After component upsert loop, add: `WHERE domainGroupingId IS NULL → UPDATE needsAssignment = true`
- After upsert loop, add soft-delete for incremental: compare fetched API names against existing active components for this project. Any not in the fetched set get `isActive = false`.
- Note: the soft-delete comparison should scope to the same component types that were fetched (do not deactivate Apex classes if only objects were fetched in this sync cycle).

File: `src/app/api/inngest/route.ts` - register the new cron function.

---

### Task 3: Build sync schedule configuration UI

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace the read-only sync interval display with an editable form. Add server action for updating `sfOrgSyncIntervalHours`. |
| **Depends On** | Task 2 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Settings Org page shows an editable number input for sync interval hours (replacing static text)
- [ ] Input validates: integer, 0-168 range (0 = disabled)
- [ ] Only SA and PM roles can edit
- [ ] Displays "Next sync: {sfOrgLastSyncAt + interval}" or "Disabled" when 0
- [ ] After save, the new interval is immediately used by the cron function on its next evaluation

**Implementation Notes:**
File: `src/app/(dashboard)/projects/[projectId]/settings/org/page.tsx`
- Replace `"Every {project.sfOrgSyncIntervalHours} hours"` text with a form containing a number input.
- Use `react-hook-form` + Zod for validation: `z.object({ sfOrgSyncIntervalHours: z.number().int().min(0).max(168) })`.
- Compute and display next sync time: `new Date(sfOrgLastSyncAt.getTime() + intervalHours * 3600000)`.

File: `src/actions/org-connection.ts`
- Add `updateSyncInterval` server action with `requireRole(["SOLUTION_ARCHITECT", "PM"])` gate.
- Prisma update: `prisma.project.update({ where: { id: projectId }, data: { sfOrgSyncIntervalHours } })`.

---

### Task 4: Add Phase 4 (Articulate) to org ingestion pipeline - create KnowledgeArticle records

| Attribute | Details |
|-----------|---------|
| **Scope** | Add the Articulate step to `org-ingestion.ts` that creates KnowledgeArticle drafts from BusinessProcess and DomainGrouping data after the Synthesize step. Create KnowledgeArticleReference records. |
| **Depends On** | None |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] After full org ingestion, KnowledgeArticle records exist: one per BusinessProcess (`articleType = BUSINESS_PROCESS`) and one per DomainGrouping with >5 components (`articleType = DOMAIN_OVERVIEW`)
- [ ] Each article has: title, content (markdown), summary (~50 tokens), confidence, `authorType = AI_GENERATED`, `isConfirmed = false`
- [ ] KnowledgeArticleReference records link each article to its referenced BusinessProcess, DomainGrouping components, and OrgComponents
- [ ] `embedding.batch-requested` event is emitted for all new articles
- [ ] Existing ingestion steps (Parse, Classify, Synthesize) are unchanged
- [ ] The article synthesis uses the existing `articleSynthesisTask` in the agent harness (or creates it if it does not exist)

**Implementation Notes:**
File: `src/lib/inngest/functions/org-ingestion.ts`
- Add a new step after `synthesize-business-processes`:
```ts
const articles = await step.run("articulate-knowledge", async () => {
  const processes = await prisma.businessProcess.findMany({
    where: { projectId },
    include: { components: { include: { orgComponent: true } } },
  });
  const domains = await prisma.domainGrouping.findMany({
    where: { projectId },
    include: { components: true },
  });

  // Call article synthesis task for each process
  const articleRecords = [];
  for (const process of processes) {
    const article = await prisma.knowledgeArticle.create({
      data: {
        projectId,
        articleType: "BUSINESS_PROCESS",
        title: `Business Process: ${process.name}`,
        content: /* AI-generated markdown */,
        summary: /* AI-generated ~50 token summary */,
        confidence: /* from AI output */,
        authorType: "AI_GENERATED",
        isConfirmed: false,
      },
    });
    articleRecords.push(article);
    // Create references
    await prisma.knowledgeArticleReference.createMany({
      data: [
        { articleId: article.id, entityType: "BUSINESS_PROCESS", entityId: process.id },
        ...process.components.map(c => ({
          articleId: article.id,
          entityType: "ORG_COMPONENT",
          entityId: c.orgComponentId,
        })),
      ],
    });
  }
  // Similar for domain overview articles
  return articleRecords;
});
```

File: `src/lib/agent-harness/tasks/article-synthesis.ts`
- Verify the task exists and produces: title, content (markdown), summary, confidence.
- If the task definition is a stub, implement it: system prompt instructs Claude to synthesize understanding of a business process or domain into a clear markdown article.

---

### Task 5: Persist BusinessProcessDependency records from synthesis output

| Attribute | Details |
|-----------|---------|
| **Scope** | Modify the synthesize step in org-ingestion.ts to read the `dependsOn` field from AI output and create BusinessProcessDependency records. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] After synthesis, BusinessProcessDependency records exist for each dependency the AI identified
- [ ] Each record has: sourceProcessId, targetProcessId, dependencyType, description
- [ ] Dependencies referencing processes not found by name are logged as warnings but do not fail the pipeline
- [ ] Re-running synthesis does not create duplicate dependencies (idempotent via unique constraint)

**Implementation Notes:**
File: `src/lib/inngest/functions/org-ingestion.ts`

In `synthesizeBusinessProcesses`, after creating BusinessProcess records, add:
```ts
// Build name->id lookup from just-created processes
const processLookup = new Map(createdProcesses.map(p => [p.name.toLowerCase(), p.id]));

for (const process of aiOutput.processes) {
  if (!process.dependsOn?.length) continue;
  const sourceId = processLookup.get(process.name.toLowerCase());
  if (!sourceId) continue;

  for (const depName of process.dependsOn) {
    const targetId = processLookup.get(depName.toLowerCase());
    if (!targetId) {
      console.warn(`Dependency target "${depName}" not found for process "${process.name}"`);
      continue;
    }
    await prisma.businessProcessDependency.upsert({
      where: { sourceProcessId_targetProcessId: { sourceProcessId: sourceId, targetProcessId: targetId } },
      create: { sourceProcessId: sourceId, targetProcessId: targetId, dependencyType: "FEEDS_DATA", description: `${process.name} depends on ${depName}` },
      update: {},
    });
  }
}
```

Also update `org-synthesize.ts` task to request `dependencyType` in the AI output schema (not just `dependsOn: string[]` but `dependsOn: { name: string, type: string }[]`). If the AI returns just names, default type to `FEEDS_DATA`.

---

### Task 6: Build full knowledge refresh Inngest function with UI trigger

| Attribute | Details |
|-----------|---------|
| **Scope** | Create the `knowledgeRefreshFunction` that runs Phases 3-4 on stale/unassigned targets. Add "Refresh Knowledge Base" button. Add weekly cron trigger. |
| **Depends On** | Task 4 |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Inngest function `full-knowledge-refresh` is registered with event trigger `org.knowledge-refresh-requested` and cron trigger `"0 2 * * 0"`
- [ ] Function gathers targets: `needsAssignment = true` components, `isStale = true` articles, modified BusinessProcesses
- [ ] Function returns early if no targets (no AI cost)
- [ ] After refresh, `needsAssignment` is cleared on processed components, `isStale` is cleared on refreshed articles
- [ ] New articles created as `isAiSuggested = true`, `isConfirmed = false`
- [ ] Confirmed non-stale articles are never overwritten
- [ ] Stale confirmed articles are updated in-place (version incremented)
- [ ] `embedding.batch-requested` emitted for new/updated articles
- [ ] "Refresh Knowledge Base" button visible to SA/PM on knowledge page
- [ ] Button click emits `org.knowledge-refresh-requested` event

**Implementation Notes:**
File: `src/lib/inngest/functions/knowledge-refresh.ts` (new)
- Follow the pattern from tech spec Section 7.4 (`knowledgeRefreshFunction`).
- Reuse the article synthesis logic from Task 4 for the Articulate step.
- For cron trigger: query active projects with SF org connections, similar to Task 2's cron pattern.

File: `src/actions/org-analysis.ts`
- Add `triggerKnowledgeRefresh` action with role gate (SA/PM only).
- Emits `org.knowledge-refresh-requested` event via Inngest.

File: `src/app/(dashboard)/projects/[projectId]/knowledge/page.tsx`
- Add a "Refresh Knowledge Base" button (e.g., RefreshCw icon from lucide-react).
- Show loading state while refresh runs.
- Optionally show last refresh timestamp.

---

### Task 7: Build KnowledgeArticle confirmation model and UI

| Attribute | Details |
|-----------|---------|
| **Scope** | Add `isConfirmed` to KnowledgeArticle schema. Build confirmation server actions. Add confirmation UI to knowledge list page. Update context assembly to respect confirmation status. |
| **Depends On** | Task 6 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] KnowledgeArticle model has `isConfirmed Boolean @default(false)` in Prisma schema
- [ ] Migration runs successfully, existing articles default to `isConfirmed = false`
- [ ] `confirmArticle(articleId)` action sets `isConfirmed = true` (SA only)
- [ ] `rejectArticle(articleId)` action deletes the article or marks it discarded (SA only)
- [ ] `editAndConfirmArticle(articleId, { title, content })` action updates content and sets `isConfirmed = true` (SA only)
- [ ] `bulkConfirmHighConfidence()` action confirms all unconfirmed articles with `confidence = HIGH` (SA only)
- [ ] Knowledge list page shows confirmation status column (badge: Confirmed/Unconfirmed)
- [ ] Each row has confirm/reject/edit action buttons
- [ ] Bulk confirm button above the table
- [ ] Context assembly in `article-summaries.ts` filters to `isConfirmed = true` for context packages (default mode)
- [ ] Context assembly includes unconfirmed articles with `[UNCONFIRMED]` prefix for internal AI tasks when configured

**Implementation Notes:**
Schema change: `prisma/schema.prisma`
```prisma
model KnowledgeArticle {
  // ... existing fields
  isConfirmed  Boolean  @default(false)
}
```
Run `npx prisma migrate dev --name add-knowledge-article-confirmation`.

File: `src/actions/knowledge.ts`
- Model after the existing confirmation pattern in DomainGrouping/BusinessProcess actions.
- `rejectArticle`: soft-delete approach - either physically delete or set a `status = DISCARDED` field. Since the schema does not have a status field, use physical delete (the article was AI-generated and unconfirmed, so no data loss).

File: `src/lib/agent-harness/context/article-summaries.ts`
- Add `isConfirmed` to the `where` clause: `isConfirmed: true` by default.
- Accept an option `{ includeUnconfirmed: boolean }` for internal AI tasks.

File: `src/lib/agent-harness/context/smart-retrieval.ts`
- Pass the `includeUnconfirmed` option through based on the task type. Context packages to Claude Code (external) use confirmed-only. Internal tasks (transcript processing, story generation) can see unconfirmed with disclaimer.

---

### Task 8: Build BusinessContextAnnotation CRUD and context package inclusion

| Attribute | Details |
|-----------|---------|
| **Scope** | Create server actions for annotation CRUD. Build annotation panel UI on component detail page. Include annotations in org component context loader for context packages. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `createAnnotation(orgComponentId, annotationText)` action creates a BusinessContextAnnotation record (SA/BA/PM roles)
- [ ] `deleteAnnotation(annotationId)` action deletes annotation (creator or SA only)
- [ ] Org component detail page shows annotation panel listing existing annotations with author name and date
- [ ] "Add Annotation" form with textarea and submit button
- [ ] Context packages include annotations: `loadOrgComponentContext` in `org-components.ts` includes `.annotations` relation
- [ ] Context package output includes format: "Human context for {apiName}: {annotationText} (added by {author})"
- [ ] Empty annotation text (whitespace-only) is rejected with validation error

**Implementation Notes:**
File: `src/actions/annotations.ts` (new)
```ts
"use server";
export async function createAnnotation(orgComponentId: string, annotationText: string) {
  const member = await getCurrentMember(projectId);
  requireRole(member, ["SOLUTION_ARCHITECT", "BA", "PM"]);
  // Validate annotationText is non-empty after trim
  return prisma.businessContextAnnotation.create({
    data: { orgComponentId, annotationText: annotationText.trim(), createdById: member.id },
  });
}

export async function deleteAnnotation(annotationId: string) {
  const annotation = await prisma.businessContextAnnotation.findUnique({ where: { id: annotationId }, include: { createdBy: true } });
  const member = await getCurrentMember(projectId);
  // Allow creator or SA to delete
  if (annotation.createdById !== member.id) requireRole(member, ["SOLUTION_ARCHITECT"]);
  return prisma.businessContextAnnotation.delete({ where: { id: annotationId } });
}
```

File: `src/lib/agent-harness/context/org-components.ts`
- Add `annotations: { include: { createdBy: true } }` to the OrgComponent query's `include` clause.
- Format annotations in the context string builder.

File: Component detail page (locate or create `src/app/(dashboard)/projects/[projectId]/org/components/[componentId]/page.tsx`)
- Add an "Annotations" section below component metadata.
- List existing annotations as cards with author, date, text.
- "Add Annotation" form at the bottom.

---

### Task 9: Create PLANNED OrgComponent records from story component assignment

| Attribute | Details |
|-----------|---------|
| **Scope** | When a free-text story component is added and no matching OrgComponent exists, create a PLANNED OrgComponent and link it. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Given a story component is added with `orgComponentId = null` and `componentName = "Renewal_Trigger"`, and no OrgComponent with that apiName exists, a new OrgComponent is created with `componentStatus = PLANNED`
- [ ] The StoryComponent record is linked to the new OrgComponent via `orgComponentId`
- [ ] Component type is inferred from the name: `__c` fields -> FIELD (if contains `.`), `__c` objects -> OBJECT, `Trigger` suffix -> APEX_TRIGGER, `Flow` or `_Flow` -> FLOW, default -> OTHER
- [ ] Given a second story references the same planned component name, it links to the existing PLANNED OrgComponent (no duplicate)
- [ ] Enrichment path (`applyEnrichmentSuggestion`) also creates PLANNED components
- [ ] PLANNED components appear in the org components list with a visual "Planned" badge

**Implementation Notes:**
File: `src/actions/stories.ts` (modify `addStoryComponent`)
```ts
// After checking orgComponentId is null (free-text mode):
if (!orgComponentId && componentName) {
  // Check if an OrgComponent already exists with this name
  const existing = await prisma.orgComponent.findFirst({
    where: { projectId, apiName: componentName },
  });

  if (existing) {
    orgComponentId = existing.id;
  } else {
    // Infer component type from name
    const componentType = inferComponentType(componentName);
    const planned = await prisma.orgComponent.create({
      data: {
        projectId,
        apiName: componentName,
        componentType,
        componentStatus: "PLANNED",
        isActive: true,
      },
    });
    orgComponentId = planned.id;
  }
}
```

Create a helper `inferComponentType(name: string): ComponentType`:
- Names containing `.` with `__c` suffix -> FIELD (e.g., `Account.Renewal_Status__c`)
- Names ending in `__c` without dot -> OBJECT
- Names ending in `Trigger` -> APEX_TRIGGER
- Names containing `Flow` -> FLOW
- Names ending in `.cls` -> APEX_CLASS
- Default -> OTHER

File: `src/actions/enrichment.ts` - apply same logic in the component enrichment path.

---

### Task 10: Upgrade PLANNED components to EXISTING during metadata sync

| Attribute | Details |
|-----------|---------|
| **Scope** | During metadata sync upsert, detect when a PLANNED component is found in the org and upgrade it to EXISTING with full metadata. |
| **Depends On** | Task 9 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] Given a PLANNED OrgComponent with `apiName = "Account_Trigger"` exists, and a metadata sync finds `Account_Trigger` in the org, the component is updated to `componentStatus = EXISTING` with all org metadata (label, apiVersion, namespace, etc.)
- [ ] Existing annotations and StoryComponent links on the PLANNED component are preserved
- [ ] `lastSyncedAt` is updated on the upgraded component
- [ ] Component is no longer flagged with `needsAssignment` after upgrade (it now has real metadata for classification)

**Implementation Notes:**
File: `src/lib/salesforce/metadata-sync.ts`

In the upsert logic, modify the update portion:
```ts
await prisma.orgComponent.upsert({
  where: { projectId_apiName_componentType: { projectId, apiName, componentType } },
  create: { /* standard create for new components */ },
  update: {
    // Merge all metadata fields
    label, apiVersion, namespace, parentComponentId,
    isActive: true,
    lastSyncedAt: new Date(),
    // Upgrade PLANNED to EXISTING
    componentStatus: "EXISTING",
    // Clear needsAssignment since we have real metadata now
    needsAssignment: false,
  },
});
```

The key insight: Prisma's `upsert` naturally handles this - the `update` block runs when the record exists (whether PLANNED or EXISTING), and setting `componentStatus = "EXISTING"` upgrades PLANNED components while being a no-op for already-EXISTING ones.

---

### Task 11: Build NLP org query API endpoint

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `POST /api/v1/org/query` endpoint with regex pattern matching, full-text fallback, and semantic search fallback for natural language org metadata queries. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `POST /api/v1/org/query` with `{ query: "fields on Account" }` returns Field-type components with Account as parent
- [ ] `POST /api/v1/org/query` with `{ query: "triggers on Case" }` returns APEX_TRIGGER components with Case as parent
- [ ] `POST /api/v1/org/query` with `{ query: "all flows" }` returns all FLOW components
- [ ] `POST /api/v1/org/query` with `{ query: "components in Sales domain" }` returns components in the Sales DomainGrouping
- [ ] Unrecognized queries fall back to full-text search against apiName and label
- [ ] If full-text returns <3 results and semantic search is available, pgvector cosine similarity is used
- [ ] Response includes `queryType` field indicating which strategy was used
- [ ] Endpoint uses the same API key auth as other v1 endpoints
- [ ] Rate limit: 60 req/min per API key

**Implementation Notes:**
File: `src/lib/salesforce/org-query.ts` (new)
```ts
interface OrgQueryResult {
  results: OrgComponentWithContext[];
  queryType: "structured" | "fulltext" | "semantic";
  totalCount: number;
  suggestion?: string;
}

const QUERY_PATTERNS = [
  { regex: /^fields?\s+on\s+(\w+)$/i, handler: (match) => ({ componentType: "FIELD", parentApiName: match[1] }) },
  { regex: /^triggers?\s+on\s+(\w+)$/i, handler: (match) => ({ componentType: "APEX_TRIGGER", parentApiName: match[1] }) },
  { regex: /^flows?\s+on\s+(\w+)$/i, handler: (match) => ({ componentType: "FLOW", parentApiName: match[1] }) },
  { regex: /^all\s+(\w+)s?$/i, handler: (match) => ({ componentType: mapPluralToType(match[1]) }) },
  { regex: /^components?\s+in\s+(.+?)\s+domain$/i, handler: (match) => ({ domainName: match[1] }) },
  { regex: /^(?:classes|apex)\s+referencing\s+(\w+)$/i, handler: (match) => ({ componentType: "APEX_CLASS", referencesApiName: match[1] }) },
];

export async function executeOrgQuery(projectId: string, query: string): Promise<OrgQueryResult> {
  // 1. Try regex patterns
  for (const pattern of QUERY_PATTERNS) {
    const match = query.match(pattern.regex);
    if (match) {
      const filter = pattern.handler(match);
      const results = await executeStructuredQuery(projectId, filter);
      return { results, queryType: "structured", totalCount: results.length };
    }
  }

  // 2. Full-text search fallback
  const ftResults = await fullTextSearchComponents(projectId, query);
  if (ftResults.length >= 3) {
    return { results: ftResults, queryType: "fulltext", totalCount: ftResults.length };
  }

  // 3. Semantic search fallback
  const semanticResults = await semanticSearchComponents(projectId, query);
  const combined = [...ftResults, ...semanticResults];
  if (combined.length > 0) {
    return { results: combined, queryType: "semantic", totalCount: combined.length };
  }

  return { results: [], queryType: "structured", totalCount: 0, suggestion: 'Try: "fields on Account", "triggers on Case", "all flows"' };
}
```

File: `src/app/api/v1/org/query/route.ts` (new)
- Authenticate via API key (same pattern as existing v1 routes).
- Parse body: `{ query: string }`.
- Call `executeOrgQuery` and return results.
- Include annotations in results where available.

---

### Task 12: Implement agent staleness flagging at end of loop

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `flagStaleArticles` function and call it at the end of `executeTask()` in the agent harness engine. |
| **Depends On** | Phase 2 Task 4 (entity tracking) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] After every agent harness execution, `flagStaleArticles` queries KnowledgeArticleReference for entities modified during the session
- [ ] Matching articles are flagged: `isStale = true`, `staleReason = "Referenced entities modified during {taskType} session"`, `staleSince = now()`
- [ ] `article.flagged-stale` Inngest event is emitted for each flagged article
- [ ] If entity tracking arrays are empty (no entities modified), function is a no-op
- [ ] If no KnowledgeArticleReference records match, no articles are flagged
- [ ] Function does not make AI calls (DB operations only)
- [ ] Adds <100ms to end-of-loop latency

**Implementation Notes:**
File: `src/lib/agent-harness/staleness.ts` (new)
- Implement `flagStaleArticles` exactly per tech spec Section 7.5.
- Use a single `prisma.knowledgeArticleReference.findMany` with an OR clause across all modified entity IDs.
- Batch the article updates (use `prisma.$transaction` for multiple updates).

File: `src/lib/agent-harness/engine.ts`
- At the end of `executeTask`, after tool execution loop completes but before returning the result:
```ts
// Flag stale articles based on entities modified during this session
await flagStaleArticles(projectId, tracking);
```
- Import from `staleness.ts`.
- Wrap in try/catch to prevent staleness flagging failures from breaking the main task execution.

---

### Task 13: Implement two-pass semantic retrieval for article selection

| Attribute | Details |
|-----------|---------|
| **Scope** | Add Pass 2 (embed task query, cosine similarity against article embeddings, select top-N) to the smart retrieval flow. |
| **Depends On** | Task 4 (articles must exist with embeddings) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | -- |
| **Linear ID** | -- |

**Acceptance Criteria:**
- [ ] `smart-retrieval.ts` embeds the assembled task context and computes cosine similarity against KnowledgeArticle embeddings
- [ ] Top-N articles (default 5) are selected by semantic relevance instead of recency/useCount
- [ ] Effectiveness score boost is applied: `adjusted_rank = cosine * (1 + effectivenessScore * 0.2)` for articles with `useCount >= 5`
- [ ] Only articles with `embeddingStatus = 'GENERATED'` participate in semantic ranking
- [ ] If no articles have embeddings, falls back to existing recency/useCount ordering
- [ ] `useCount` is incremented on each article included in a context package
- [ ] Full content of only the selected top-N articles is loaded (Pass 3)

**Implementation Notes:**
File: `src/lib/agent-harness/context/smart-retrieval.ts`

After loading article summaries (Pass 1), add Pass 2:
```ts
// Pass 2: Semantic ranking
const queryText = assembleQueryText(taskType, contextSoFar); // Combine task description + key context
const queryEmbedding = await generateEmbedding(queryText);

const rankedArticles = await prisma.$queryRaw<{ id: string; rank: number }[]>`
  SELECT id,
    (1 - (embedding <=> ${queryEmbedding}::vector))
      * (1 + CASE WHEN "useCount" >= 5 THEN COALESCE("effectivenessScore", 0) * 0.2 ELSE 0 END)
      AS rank
  FROM "KnowledgeArticle"
  WHERE "projectId" = ${projectId}::uuid
    AND embedding IS NOT NULL
    AND "embeddingStatus" = 'GENERATED'
    AND "isConfirmed" = true
  ORDER BY rank DESC
  LIMIT ${topN}
`;

// Pass 3: Load full content of top-N
const topArticles = await prisma.knowledgeArticle.findMany({
  where: { id: { in: rankedArticles.map(a => a.id) } },
});

// Increment useCount
await prisma.knowledgeArticle.updateMany({
  where: { id: { in: rankedArticles.map(a => a.id) } },
  data: { useCount: { increment: 1 } },
});
```

If `generateEmbedding` fails (API error), catch the error and fall back to the existing ordering. Log the failure but do not break the task.

File: `src/lib/agent-harness/context/article-summaries.ts`
- Ensure the summary loading in Pass 1 is compatible with the Pass 2 filtering (both should respect `isConfirmed` consistently).

---

## Summary

| Task | Title | Depends On | Complexity | Status |
|------|-------|-----------|------------|--------|
| 1 | Add PKCE to Salesforce OAuth flow | -- | S | Not Started |
| 2 | Automated incremental sync cron + needsAssignment + soft-delete | -- | L | Not Started |
| 3 | Sync schedule configuration UI | 2 | S | Not Started |
| 4 | Phase 4 Articulate - KnowledgeArticle creation in ingestion | -- | L | Not Started |
| 5 | Persist BusinessProcessDependency records | -- | S | Not Started |
| 6 | Full knowledge refresh Inngest function + UI trigger | 4 | L | Not Started |
| 7 | KnowledgeArticle confirmation model + UI | 6 | M | Not Started |
| 8 | BusinessContextAnnotation CRUD + context package inclusion | -- | M | Not Started |
| 9 | Planned component creation from story execution | -- | M | Not Started |
| 10 | PLANNED-to-EXISTING upgrade during metadata sync | 9 | S | Not Started |
| 11 | NLP org query API endpoint | -- | M | Not Started |
| 12 | Agent staleness flagging at end of loop | Phase 2 Task 4 | M | Not Started |
| 13 | Two-pass semantic retrieval for article selection | 4 | M | Not Started |
