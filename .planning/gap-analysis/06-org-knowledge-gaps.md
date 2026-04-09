# Gap Analysis: Salesforce Org Connectivity and Knowledge Architecture

**Domain:** Section 13 — Salesforce Org Connectivity and Knowledge Base
**Audited:** 2026-04-08
**Auditor:** Claude (code-explorer)
**PRD Version:** 2.3
**Tech Spec:** Session-3 (updated Sessions 4-7)

---

## Summary

The core infrastructure for this domain is impressively solid. The OAuth flow, metadata parsing, four-phase brownfield ingestion pipeline, all three knowledge architecture layers, article staleness and refresh, the confirmation model, and the two-pass retrieval pattern are all implemented and wired. The schema matches the PRD with high fidelity. What is missing falls into three categories: (1) automated scheduling that never fires, (2) two features that are schema-present but have no write surface or inclusion in context assembly, and (3) one PRD-specified flow (Org Health Assessment) that is entirely absent.

---

## Gaps

### GAP-ORG-001: No PKCE on the OAuth Web Server Flow
- **Severity:** Significant
- **Perspective:** Architecture
- **PRD Reference:** Section 13.1
- **What PRD says:** "standard Salesforce authentication (OAuth 2.0 JWT Bearer Flow or Web Server Flow)" with credentials encrypted and stored per-project. The tech spec specifies a PKCE-protected Web Server Flow.
- **What exists:** `/src/app/api/auth/salesforce/authorize/route.ts` and `/src/lib/salesforce/oauth.ts` implement standard Web Server Flow using `jsforce.OAuth2`. CSRF state token is generated and single-use validated correctly. There is no `code_challenge` or `code_verifier` generation anywhere in the OAuth handshake — the `buildAuthorizationUrl` function constructs only `response_type`, `client_id`, `redirect_uri`, and `state` parameters.
- **The gap:** PKCE (`code_challenge_method=S256`, `code_challenge`, and `code_verifier` exchange at token swap) is not implemented. Without PKCE, an authorization code intercepted before exchange can be used by an attacker. Salesforce Connected Apps support PKCE for Web Server Flow. The CSRF state token mitigates the CSRF vector but not the code interception vector that PKCE addresses.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Security Hardening

---

### GAP-ORG-002: Automated Incremental Sync Cron Does Not Exist
- **Severity:** Critical
- **Perspective:** Functionality
- **PRD Reference:** Section 13.3
- **What PRD says:** "Incremental sync (automated). Runs Phases 1-2 only (Parse + Classify) at the project's configured interval (default: every 4 hours)." The tech spec (Section 7.2 and 7.4) defines an `incrementalSyncFunction` with a cron trigger of `"0 */4 * * *"` that iterates all active connected projects and checks `sfOrgSyncIntervalHours` before running.
- **What exists:** `metadataSyncFunction` in `/src/lib/inngest/functions/metadata-sync.ts` only registers a single trigger: `{ event: EVENTS.ORG_SYNC_REQUESTED }`. There is no `{ cron: "0 */4 * * *" }` trigger and no multi-project dispatch loop. The `sfOrgSyncIntervalHours` field exists on the Project model (schema line 421, default `4`) and is displayed in the settings UI at `/src/app/(dashboard)/projects/[projectId]/settings/org/page.tsx` line 94, but nothing ever reads it to trigger a scheduled sync. The route `src/app/api/inngest/route.ts` registers 17 functions — none has a cron schedule for metadata sync.
- **The gap:** Incremental sync never runs automatically. The `sfOrgSyncIntervalHours` field is effectively dead data. The only way to sync is for an SA or PM to manually click a sync button. All projects will have stale metadata between the initial sync and the next manual trigger.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Scheduled Job Infrastructure

---

### GAP-ORG-003: Full Knowledge Refresh — No Inngest Function, No UI Trigger
- **Severity:** Critical
- **Perspective:** Functionality
- **PRD Reference:** Section 13.3
- **What PRD says:** "Full knowledge refresh (manual or weekly). Runs Phases 3-4 only (Synthesize + Articulate) on unassigned components and stale articles only. Generates suggestions, not overwrites. Triggered manually via 'Refresh Knowledge Base' button or by weekly cron (configurable, default: Sunday 2am UTC)."
- **What exists:** `EVENTS.ORG_KNOWLEDGE_REFRESH` is defined in `/src/lib/inngest/events.ts` (line 30) but no Inngest function consumes it — confirmed in the milestone audit as a dead event. There is no weekly cron for `org/knowledge-refresh-requested`. There is no "Refresh Knowledge Base" button anywhere in the knowledge or org UI pages. The ingestion pipeline (`org-ingestion.ts`) runs all phases together when triggered manually from the Org Analysis page — it is not separable into "incremental only" vs "full refresh only" modes. The `needsAssignment` flag exists in the schema (OrgComponent line 825) but the incremental sync (`metadata-sync.ts`) never sets it to `true` for unassigned components.
- **The gap:** The full knowledge refresh mode is entirely absent: no function, no cron, no UI trigger, no `needsAssignment` flagging in incremental sync. The two-mode sync design (incremental = Phases 1-2 only; full refresh = Phases 3-4 on stale/unassigned targets) is not implemented. Currently only the initial full ingestion pipeline exists, which always runs all four phases and is not re-runnable in a targeted way.
- **Scope estimate:** L
- **Dependencies:** GAP-ORG-002 (cron infrastructure pattern)
- **Suggested phase grouping:** Scheduled Job Infrastructure

---

### GAP-ORG-004: BusinessContextAnnotation Has No Write Surface
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 13.4
- **What PRD says:** "Business Context Annotations Table. Human-provided context attached to org components. When a BA says 'the Renewal_Status__c field on Opportunity tracks whether the client's finance team has approved the renewal' — that annotation is stored and included in context packages when any story touches that field."
- **What exists:** The `BusinessContextAnnotation` model exists in the schema (`prisma/schema.prisma` line 871) with `orgComponentId`, `annotationText`, `createdById`, and `createdAt` fields. There is no server action, no API route, no UI component, and no form anywhere in the codebase to create, read, update, or delete annotations. `/src/lib/agent-harness/tools/flag-conflict.ts` is the only file that references `BusinessContextAnnotation` — it is used to check for annotation existence when flagging org conflicts, but the annotations can never actually be created.
- **The gap:** The feature is a schema stub with zero functional surface. BAs and architects cannot add human context to org components. More critically, even if annotations existed, they are never loaded into context packages — `/src/lib/agent-harness/context/org-components.ts` does not query `BusinessContextAnnotation` records, so they would not be included in developer context packages even after creation.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Org Knowledge Enrichment

---

### GAP-ORG-005: BusinessContextAnnotation Not Included in Context Packages
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 13.4, Section 13.7 (Layer 1)
- **What PRD says:** "included in context packages when any story touches the annotated component"
- **What exists:** `/src/lib/agent-harness/context/org-components.ts` loads `OrgComponent` records and their relationships for a story, but does not include the `.annotations` relation. `/src/app/api/v1/context-package/route.ts` calls `loadOrgComponentContext` but likewise receives no annotation data. The `OrgComponent` Prisma model has `annotations BusinessContextAnnotation[]` defined, but no context loader queries it.
- **The gap:** Even if annotations were created (see GAP-ORG-004), they would never reach Claude Code or the agent harness. The context assembly layer is missing this join.
- **Scope estimate:** S
- **Dependencies:** GAP-ORG-004
- **Suggested phase grouping:** Org Knowledge Enrichment

---

### GAP-ORG-006: Progressive Update from Story Execution — Planned Components Never Created
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 13.5
- **What PRD says:** "From story execution: When a story's impacted components list includes new components that don't yet exist in the knowledge base, placeholder entries are created marked as 'planned.'"
- **What exists:** `ComponentStatus` enum has `PLANNED` (schema line 238). `OrgComponent.componentStatus` defaults to `EXISTING`. However, searching the entire codebase for any logic that creates `OrgComponent` records with `componentStatus: "PLANNED"` finds nothing. Story creation and story component assignment (`StoryComponent`) accept component names as free text (`componentName` field), but never cross-check against `OrgComponent` records or create placeholder entries for new names.
- **The gap:** The progressive update from story execution is entirely absent. `PLANNED` is a valid schema value that nothing ever writes. Components mentioned in stories that do not exist in the org knowledge base remain invisible to the AI context.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Org Knowledge Enrichment

---

### GAP-ORG-007: Ingestion Phase 4 Does Not Create KnowledgeArticle Records
- **Severity:** Critical
- **Perspective:** Functionality
- **PRD Reference:** Section 13.6
- **What PRD says:** "Phase 4: Articulate → KnowledgeArticle drafts, one per process + one per domain (NEW)" and "writes initial KnowledgeArticle drafts synthesizing its understanding of each process and each domain."
- **What exists:** `/src/lib/inngest/functions/org-ingestion.ts` implements the pipeline as three functional steps: `parseOrgComponents` (Phase 1), `classifyComponents` (Phase 2/DomainGroupings), and `synthesizeBusinessProcesses` (Phase 3/BusinessProcesses). Step 4 in the Inngest function (`finalize-ingestion`) only updates the project's `sfOrgLastSyncAt` and marks the run completed — it does not call any article synthesis or create any `KnowledgeArticle` records. The `orgSynthesizeTask` in `/src/lib/agent-harness/tasks/org-synthesize.ts` generates BusinessProcess JSON but has no article generation step. No call to `articleSynthesisTask` exists anywhere in the ingestion pipeline.
- **The gap:** The Articulate phase (Phase 4) is missing entirely. After a full org ingestion, BusinessProcess and DomainGrouping records are created, but no KnowledgeArticle records are seeded. The knowledge base Layer 2 (synthesized understanding) starts empty after ingestion and only begins populating when transcripts are processed — org-based knowledge synthesis never happens.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Knowledge Base Seeding

---

### GAP-ORG-008: KnowledgeArticle Confirmation Model Is Absent
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 13.6, Tech Spec Section 6.3
- **What PRD says:** "KnowledgeArticle: authorType = AI_GENERATED, confidence = LOW or MEDIUM. The architect reviews and confirms all AI suggestions through the web application UI." Tech Spec 6.3: "KnowledgeArticle drafts appear in a 'Review Knowledge Base' UI. Architect can confirm, edit, or discard each suggestion. Only confirmed... articles are treated as trusted context in future AI interactions."
- **What exists:** `KnowledgeArticle` has `authorType` (AI_GENERATED/HUMAN_AUTHORED) and `confidence` fields. But there is no `isConfirmed` boolean on `KnowledgeArticle` (unlike `DomainGrouping` and `BusinessProcess` which have it). The knowledge list page at `/src/app/(dashboard)/projects/[projectId]/knowledge/page.tsx` shows all articles with no confirmation workflow — no confirm/reject/edit actions in `/src/actions/knowledge.ts`. The article detail page renders content but has no confirmation controls.
- **The gap:** `KnowledgeArticle` has no `isConfirmed` field, no confirmation UI, no confirmation actions, and no logic to treat unconfirmed articles differently in context assembly. All AI-generated articles are surfaced to the AI as trusted context immediately, bypassing the human review step that the PRD and tech spec both specify. This is a schema-level omission as well as a logic gap.
- **Scope estimate:** M
- **Dependencies:** GAP-ORG-007 (articles must exist to be confirmed)
- **Suggested phase grouping:** Knowledge Base Confirmation

---

### GAP-ORG-009: Org Health Assessment for Rescue/Takeover Engagements Is Absent
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 13.6
- **What PRD says:** "For rescue/takeover engagements, the AI also generates an Org Health Assessment: code quality analysis (test coverage, code complexity, governor limit risk areas), security analysis (sharing model review, FLS compliance, hardcoded IDs), technical debt inventory, and a recommended remediation backlog. This assessment is stored as a project artifact and informs the discovery and planning phases."
- **What exists:** The `RESCUE_TAKEOVER` engagement type is defined in the schema, wizard, and project settings. When a project's `engagementType` is `RESCUE_TAKEOVER`, the ingestion pipeline in `/src/lib/inngest/functions/org-ingestion.ts` does nothing different — there is no branch checking `engagementType`, no health assessment task definition, no health assessment Inngest step, no stored artifact for health assessment output, and no UI to display health assessment results.
- **The gap:** The Org Health Assessment is entirely absent. The `RESCUE_TAKEOVER` engagement type is a UI label with no behavioral differentiation in the org ingestion pipeline.
- **Scope estimate:** XL
- **Dependencies:** None
- **Suggested phase grouping:** Brownfield Intelligence

---

### GAP-ORG-010: Incremental Sync Does Not Flag `needsAssignment` on New Unclassified Components
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 13.3, Tech Spec Section 6.1.1
- **What PRD says:** Incremental sync "flags new unclassified components for the next knowledge refresh." Tech spec: "New components that are not yet assigned to a DomainGrouping or BusinessProcess are flagged with `needsAssignment = true`."
- **What exists:** `OrgComponent` has `needsAssignment Boolean @default(false)` (schema line 825). `/src/lib/salesforce/metadata-sync.ts` upserts components during incremental sync but never sets `needsAssignment = true` for components with no `domainGroupingId`. The full knowledge refresh (when it exists per GAP-ORG-003) would need this flag to know which components need processing.
- **The gap:** `needsAssignment` is never set to `true` by any code path. New components added during incremental syncs are silently orphaned from the domain/process knowledge structure with no queuing mechanism to classify them.
- **Scope estimate:** S
- **Dependencies:** GAP-ORG-003 (the full knowledge refresh that would consume this flag also does not exist)
- **Suggested phase grouping:** Scheduled Job Infrastructure

---

### GAP-ORG-011: Removed Components Only Soft-Deleted on FULL Sync, Not on INCREMENTAL
- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 13.5
- **What PRD says:** "Removed components are flagged (but not deleted, to preserve history)."
- **What exists:** In `/src/lib/salesforce/metadata-sync.ts` lines 266-278, the soft-delete via `isActive: false` only runs when `syncType === "FULL"`. INCREMENTAL syncs never flag components as removed/inactive, even if a component was deleted from the org between incremental sync runs. Removed components will remain marked `isActive: true` indefinitely until the next FULL sync.
- **The gap:** Between full syncs, removed components are never flagged inactive during incremental syncs. Given that full syncs are currently only triggered manually (GAP-ORG-002), components deleted from the org may persist as active in the knowledge base for extended periods.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Metadata Sync Correctness

---

### GAP-ORG-012: Org Query API Is Structured-Filter Only — No Natural Language Query
- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 12 (developer integration), tech spec
- **What PRD says:** PRD Section 5.2 describes `GET /api/projects/:projectId/org/query` — "Accepts a query (e.g., 'fields on Account,' 'triggers on Case,' 'integrations touching Order') and returns filtered org metadata." These examples imply natural language or fuzzy query handling.
- **What exists:** `/src/app/api/v1/org/components/route.ts` implements `GET /api/v1/org/components` with structured filters: `type` (exact ComponentType enum match) and `domain` (exact domainGroupingId match). It does not accept natural language queries, free-text search, or semantic search. The endpoint path also differs from what the PRD describes (`/api/v1/org/components` vs `/api/projects/:projectId/org/query`).
- **The gap:** The "query" semantics described in the PRD — where Claude Code can ask "what triggers exist on Case?" in natural language — are not supported. The current endpoint requires knowing exact enum values and UUIDs. Claude Code skills would need to first know the exact `ComponentType` enum name to filter by it, rather than asking a natural language question.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Claude Code API Surface

---

### GAP-ORG-013: Agent Staleness Flagging Inline During Agent Loops Is Not Implemented
- **Severity:** Significant
- **Perspective:** Architecture
- **PRD Reference:** Section 13.7
- **What PRD says:** "During agent interactions, the AI flags articles as 'potentially stale' inline (cheap DB update: `staleReason`, `staleSince` timestamp). No synthesis during the agent loop. End of every agent loop, the execution engine queries which articles reference entities the agent modified and sets `isStale = true` + `staleReason`. This is a DB query only, no AI call."
- **What exists:** The staleness detection lifecycle exists as an Inngest function (`stalenessDetectionFunction`) triggered by `ENTITY_CONTENT_CHANGED` events. Various actions (question answering, transcript processing, etc.) emit `ENTITY_CONTENT_CHANGED` events. However, the agent harness execution engine in `/src/lib/agent-harness/engine.ts` does not perform an end-of-loop staleness scan — it does not query which articles reference modified entities and does not set `isStale = true` as a post-loop DB step. The staleness detection is entirely event-driven, which means it only fires if the appropriate event is emitted. If the agent uses a write tool that modifies an entity without that modification path emitting `ENTITY_CONTENT_CHANGED`, the staleness cascade is missed entirely.
- **The gap:** The PRD specifies a two-mechanism hybrid: (1) inline flagging during agent loops as a guaranteed catch-all, plus (2) event-driven staleness detection. Only the event-driven path exists. The agent execution engine post-loop scan is absent, meaning staleness detection completeness depends entirely on every write path correctly emitting `ENTITY_CONTENT_CHANGED`.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Knowledge Base Maintenance

---

### GAP-ORG-014: Two-Pass Retrieval Incomplete — No Semantic Embedding Step for Articles
- **Severity:** Significant
- **Perspective:** Architecture
- **PRD Reference:** Section 13.7
- **What PRD says:** "1. Load article summaries for the relevant scope (~50 tokens each). 2. Embed the task/query and find top-N articles by cosine similarity. 3. Load full content of only the top-N articles."
- **What exists:** `/src/lib/agent-harness/context/article-summaries.ts` and `/src/lib/agent-harness/context/smart-retrieval.ts` implement Pass 1 (load summaries) correctly. Pass 3 (load full content) exists for the articles returned by Pass 1 or by global search. However, Pass 2 — embedding the current task/query and performing cosine similarity against article embeddings to select the top-N articles — is not implemented in the retrieval path. `/src/lib/search/global-search.ts` handles semantic search but is called as Pass 2 in `smart-retrieval.ts` using the user's raw message text, not by embedding the assembled task context. The article context loaders in individual task definitions (e.g., `question-answering.ts`) load article summaries and then note "(In practice, the AI would determine relevance — here we load all summaries)" with no actual embedding-based selection step.
- **The gap:** The pgvector-based cosine similarity retrieval described in Step 2 is not used in the main agent context assembly flow. Articles are selected by recency/usage count (`useCount` ordering in context-package) rather than semantic relevance to the current task. The Voyage AI embeddings generated for articles are stored but not used for article selection in context assembly.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Semantic Retrieval

---

### GAP-ORG-015: BusinessProcessDependency Records Never Created by Ingestion Pipeline
- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 13.7 (Layer 1), PRD Section 5.2.3 join tables
- **What PRD says:** "BusinessProcessDependency for process-to-process relationships. This layer answers questions like... 'This story modifies a component that participates in 3 business processes.'"
- **What exists:** `BusinessProcessDependency` model exists with full fields (`sourceProcessId`, `targetProcessId`, `dependencyType` enum with TRIGGERS, FEEDS_DATA, REQUIRES_COMPLETION, SHARED_COMPONENTS, `description`). The `orgSynthesizeTask` in `/src/lib/agent-harness/tasks/org-synthesize.ts` does ask for `dependsOn: []` in its output schema, and the `SynthesizeResult` interface in `org-ingestion.ts` (line 43) includes `dependsOn: string[]`. However, `synthesizeBusinessProcesses` in `org-ingestion.ts` (lines 171-248) never reads the `dependsOn` field from the AI output and never creates any `BusinessProcessDependency` records. The data is parsed and then silently discarded.
- **The gap:** Process-to-process dependency mapping is collected by the AI but never persisted. The dependency graph that powers sprint conflict detection ("this story touches components in 3 dependent processes") is empty.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Knowledge Base Seeding

---

### GAP-ORG-016: Sync Schedule Is Display-Only — No UI to Configure `sfOrgSyncIntervalHours`
- **Severity:** Minor
- **Perspective:** UX
- **PRD Reference:** Section 13.3
- **What PRD says:** "at the project's configured interval (default: every 4 hours)" and the tech spec describes `sfOrgSyncIntervalHours` as "configurable per project."
- **What exists:** `/src/app/(dashboard)/projects/[projectId]/settings/org/page.tsx` displays "Every {project.sfOrgSyncIntervalHours} hours" (line 94) as static read-only text. There is no form, action, or input to change this value. `sfOrgSyncIntervalHours` defaults to `4` in the schema and is never written by any action.
- **The gap:** The sync interval cannot be changed through the UI. The field is read-only display of a constant. This is a minor UX gap since the automated cron itself is missing (GAP-ORG-002), but even when the cron is implemented, there will be no way to configure it per project without a separate fix here.
- **Scope estimate:** S
- **Dependencies:** GAP-ORG-002
- **Suggested phase grouping:** Scheduled Job Infrastructure

---

## Cross-Cutting Observations

**What is well-implemented:**

1. OAuth security fundamentals are sound: CSRF state token is cryptographically random, single-use, project-scoped, and short-TTL (10 minutes). The callback validates session identity against the initiating user. Role checks are performed independently at both the authorize and callback routes.

2. The read-only constraint (Section 13.2) is structurally enforced: `jsforce` is only used for `metadata.list` and `sobject().describe()` calls — both are read operations. There are no write SDK calls anywhere in the org-facing code.

3. The four-phase ingestion pipeline structure (Phases 1-3 functional, Phase 4 missing per GAP-ORG-007) is correctly implemented with per-project Inngest concurrency limits, proper `isAiSuggested = true / isConfirmed = false` seeding for AI outputs, and a polled UI that reflects real pipeline progress from `OrgIngestionRun` records.

4. The confirmation model for DomainGroupings and BusinessProcesses is fully implemented with confirm, reject, edit, and bulk-confirm-high-confidence actions and UI.

5. The three-layer knowledge architecture schema is complete and correct. All models exist: `OrgComponent` with embeddings, `BusinessProcess` / `BusinessProcessComponent` (Layer 1), `KnowledgeArticle` with embeddings, staleness tracking, and version history (Layer 2), and pgvector columns on both (Layer 3 storage).

6. Token management during refresh is handled correctly: the `conn.on("refresh")` handler re-encrypts and persists new access tokens.

**Critical path for Phase 4 value delivery:**

GAP-ORG-007 (Phase 4 Articulate missing) and GAP-ORG-003 (no full knowledge refresh path) together mean the org knowledge base never self-populates from org data. The knowledge base only grows from transcript processing. For projects without transcripts — especially Rescue/Takeover engagements where the org is the primary knowledge source — the knowledge base will be empty.

The dependency chain that must be addressed together: GAP-ORG-007 → GAP-ORG-008 → GAP-ORG-015 → GAP-ORG-010 → GAP-ORG-003.

---

## Gap Summary Table

| ID | Title | Severity | Scope |
|----|-------|----------|-------|
| GAP-ORG-001 | No PKCE on OAuth Web Server Flow | Significant | S |
| GAP-ORG-002 | Automated incremental sync cron does not exist | Critical | M |
| GAP-ORG-003 | Full knowledge refresh — no function, no UI trigger | Critical | L |
| GAP-ORG-004 | BusinessContextAnnotation has no write surface | Significant | M |
| GAP-ORG-005 | BusinessContextAnnotation not included in context packages | Significant | S |
| GAP-ORG-006 | Progressive update from story execution — planned components never created | Significant | M |
| GAP-ORG-007 | Ingestion Phase 4 does not create KnowledgeArticle records | Critical | M |
| GAP-ORG-008 | KnowledgeArticle confirmation model is absent | Significant | M |
| GAP-ORG-009 | Org Health Assessment for Rescue/Takeover is absent | Significant | XL |
| GAP-ORG-010 | Incremental sync does not flag `needsAssignment` | Significant | S |
| GAP-ORG-011 | Removed components only soft-deleted on FULL sync | Minor | S |
| GAP-ORG-012 | Org Query API is structured-filter only, not natural language | Significant | M |
| GAP-ORG-013 | Agent staleness flagging inline during agent loops not implemented | Significant | M |
| GAP-ORG-014 | Two-pass retrieval incomplete — no embedding step for article selection | Significant | M |
| GAP-ORG-015 | BusinessProcessDependency records never created | Minor | S |
| GAP-ORG-016 | Sync schedule is display-only, no UI to configure interval | Minor | S |

**Counts:** 3 Critical, 8 Significant, 3 Minor — 16 total gaps.

---

## Essential Files for This Domain

- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/salesforce/oauth.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/salesforce/client.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/salesforce/metadata-sync.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/api/auth/salesforce/authorize/route.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/api/auth/salesforce/callback/route.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/metadata-sync.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/org-ingestion.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/article-refresh.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/staleness-detection.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/embedding-batch.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/events.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/agent-harness/tasks/org-classify.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/agent-harness/tasks/org-synthesize.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/agent-harness/tasks/article-synthesis.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/agent-harness/context/org-components.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/agent-harness/context/business-processes.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/agent-harness/context/smart-retrieval.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/org-connection.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/org-analysis.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/knowledge.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/api/v1/org/components/route.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/api/v1/context-package/route.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/org/analysis/page.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/org/analysis/analysis-client.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/settings/org/page.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/prisma/schema.prisma` (lines 808-1056)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/archive/SF-Consulting-AI-Framework-PRD-v2.1.md` (Section 13)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/archive/SESSION-3-TECHNICAL-SPEC.md` (Sections 6 and 7)