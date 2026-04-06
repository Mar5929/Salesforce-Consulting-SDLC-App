# Phase 4: Salesforce Org Connectivity and Developer Integration - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The platform connects to live Salesforce orgs, builds an org knowledge base from metadata, and exposes a REST API that Claude Code consumes for context-aware development. Covers ORG-01 through ORG-06, DEV-01 through DEV-05.

</domain>

<decisions>
## Implementation Decisions

### Org Connection Flow
- **D-01:** Dedicated "Org Connections" settings page under project settings. "Connect Salesforce Org" button launches OAuth flow. Status card shows connection health (connected/disconnected/token expired).
- **D-02:** Standard Salesforce OAuth 2.0 Web Server Flow (authorization code grant). User redirected to Salesforce login, grants access, callback stores tokens. In-app setup guide documents Connected App prerequisites.
- **D-03:** One org connection per project (matches "one shared team sandbox" constraint). Disconnect first to switch orgs. No multi-org in V1.
- **D-04:** Tokens (access + refresh) encrypted at rest using existing `encryption.ts` (HKDF-SHA256 per AUTH-05). Silent refresh via refresh token before sync jobs. On refresh failure, mark connection "Needs Reauthorization" and notify PM.
- **D-05:** Only SA or PM roles can connect/disconnect orgs. All team members can view org data once connected.

### Metadata Sync Strategy
- **D-06:** Sync core consulting-relevant metadata types: Custom Objects (+ fields, validation rules, record types), Apex Classes, Apex Triggers, Lightning Web Components, Flows, Permission Sets, Profiles, Custom Labels, Custom Settings/Custom Metadata Types. Skip low-value types (static resources, page layouts) in V1.
- **D-07:** Two sync modes: (1) Full sync on initial connection and on-demand "Refresh All" button. (2) Incremental sync via Inngest cron function — daily by default, configurable per project. Incremental uses Salesforce `listMetadata` with `lastModifiedDate` filtering.
- **D-08:** Sync status on Org Connection settings card: last sync timestamp, component count, sync-in-progress indicator. Sync history log showing each run's results (added/modified/removed counts).
- **D-09:** Metadata stored as normalized OrgComponent records (schema exists). Relationships (lookups, master-detail, trigger-on) stored as OrgRelationship records. Raw data layer feeding brownfield ingestion pipeline.

### Brownfield Ingestion UX
- **D-10:** Brownfield ingestion runs as background Inngest step function (not interactive chat). Bulk analysis of hundreds of components — progress shown via dedicated "Org Analysis" status page with phase progress indicators.
- **D-11:** Four-phase pipeline per spec: Parse (normalize raw metadata) > Classify (categorize by domain area) > Synthesize + Articulate (AI groups into DomainGroupings and maps to BusinessProcesses). Phases 3+4 run as single AI call per PROJECT.md context.
- **D-12:** AI outputs presented for architect review using accept/reject/edit card pattern (reusing Phase 2 D-09). Two review sections: (1) Domain Groupings — AI-suggested groupings, architect confirms/edits/rejects. (2) Business Process Mappings — AI-suggested process-to-component mappings, architect confirms via isConfirmed pattern.
- **D-13:** Ingestion triggered manually by SA after metadata sync completes (not automatic). "Analyze Org" button on org page. Re-runnable after subsequent syncs.
- **D-14:** Review UX: Tabbed view — "Domain Groupings" tab and "Business Processes" tab. AI suggestions with confidence indicators. Bulk-confirm high-confidence, individually review low-confidence.

### REST API for Claude Code
- **D-15:** Project-scoped API keys for authentication. Generated in project settings by SA/PM. Keys hashed (bcrypt) in DB, shown once on creation. Scoped to single project for data isolation.
- **D-16:** Endpoints under `/api/v1/` namespace. Versioned from the start since Claude Code skills depend on the contract. RESTful resource-based design.
- **D-17:** Core endpoints:
  - `GET /api/v1/context-package?storyId=X` — Assembles context package (story details, business processes, knowledge articles, related decisions, sprint conflicts) using Phase 2 context assembly layer.
  - `GET /api/v1/org/components?type=X&domain=Y` — Query org metadata.
  - `PATCH /api/v1/stories/:id/status` — Update story execution status from Claude Code.
  - `GET /api/v1/project/summary` — Project summary for Claude Code session initialization.
- **D-18:** Context package assembly reuses Phase 2 agent harness context assembly layer (D-33). Same token budget management, same two-pass retrieval. REST API is thin wrapper over existing infrastructure.
- **D-19:** Claude Code skills make direct HTTP calls to web app API. Skills read API key from environment variable. No MCP server in V1 — direct REST is simpler and sufficient.

### Claude's Discretion
- API rate limiting strategy and limits
- Exact metadata type list fine-tuning based on Salesforce API capabilities
- Sync job retry and error handling specifics
- Ingestion pipeline AI prompt engineering and token budgets
- API response pagination strategy
- Org analysis progress indicator design
- Loading states and error boundaries for org views

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Full product requirements
- `SF-Consulting-AI-Framework-PRD-v2.1.md` — Complete PRD. Salesforce org connectivity (relevant sections), brownfield ingestion pipeline, REST API for Claude Code, developer integration.

### Technical architecture and schema
- `SESSION-3-TECHNICAL-SPEC.md` — Database schema for OrgComponent, OrgRelationship, DomainGrouping, BusinessProcess, BusinessProcessComponent, BusinessProcessDependency, BusinessContextAnnotation models. AI agent harness architecture (reused for ingestion pipeline and context package assembly). Context window budget allocation.

### Tech stack and versions
- `CLAUDE.md` §Technology Stack — Locked versions for all dependencies. `@anthropic-ai/sdk` for AI pipeline, Inngest for background sync/ingestion jobs, `@aws-sdk/client-s3` for file storage.

### Phase 1 context (design system foundation)
- `.planning/phases/01-foundation-and-data-layer/01-CONTEXT.md` — D-01 (sidebar layout), D-04 (Linear/Vercel aesthetic), D-05 (full schema deployed — org models already exist), D-09 (Clerk auth, roles in ProjectMember), D-12/D-13 (Inngest patterns).

### Phase 2 context (AI and UI patterns)
- `.planning/phases/02-discovery-and-knowledge-brain/02-CONTEXT.md` — D-08 (chat session for AI processing), D-09 (accept/reject/edit cards — reuse for ingestion review), D-31-D-35 (AI agent harness three-layer architecture, context assembly, ambiguity handling).

### Phase 3 context (work management)
- `.planning/phases/03-story-management-and-sprint-intelligence/03-CONTEXT.md` — D-08 (story components as free-text — Phase 4 replaces with real org components), D-09 (story status transitions — REST API updates execution states).

### Existing code patterns
- `src/lib/encryption.ts` — Encryption module for credential storage (AUTH-05).
- `src/lib/agent-harness/` — Three-layer AI agent harness (engine, context assembly, task definitions, tools).
- `src/lib/inngest/events.ts` — Event definitions, pattern for adding sync/ingestion events.
- `src/lib/safe-action.ts` — Server action pattern with auth middleware.
- `src/lib/project-scope.ts` — `scopedPrisma()` for project-level data isolation.
- `prisma/schema.prisma` — OrgComponent, OrgRelationship, DomainGrouping, BusinessProcess models already defined.

### Requirements traceability
- `.planning/REQUIREMENTS.md` — Phase 4 requirements: ORG-01 through ORG-06, DEV-01 through DEV-05.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/` — shadcn/ui components for org settings page, review cards, status indicators
- `src/lib/encryption.ts` — HKDF-SHA256 encryption for Salesforce OAuth tokens
- `src/lib/agent-harness/` — Full AI agent harness (engine, context assembly, tasks, tools) — reuse for ingestion pipeline and context package API
- `src/lib/inngest/` — Inngest client, events, and function patterns — reuse for sync cron and ingestion jobs
- `src/lib/safe-action.ts` — Server action pattern for org connection CRUD
- `src/lib/project-scope.ts` — `scopedPrisma()` for project-scoped org data queries
- Phase 2 accept/reject/edit card UI pattern — reuse for architect review of AI suggestions

### Established Patterns
- Inngest step functions with event-driven triggers and automatic retries
- Server actions via `safe-action.ts` with Clerk auth and Zod validation
- Project-scoped data access via `scopedPrisma()`
- AI agent harness for structured AI task execution with context assembly
- Accept/reject/edit card pattern for human review of AI outputs
- Linear/Vercel minimal aesthetic

### Integration Points
- Project settings page: Add "Org Connections" section
- Sidebar navigation: Add "Org" section with org overview and analysis views
- Inngest events: Add `org/sync-requested`, `org/sync-completed`, `org/ingestion-requested` events
- Agent harness: Add ingestion task definitions (classify, synthesize+articulate)
- API routes: New `/api/v1/` namespace for Claude Code endpoints
- Phase 3 StoryComponent: Link to real OrgComponent records instead of free-text

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow Linear's clean aesthetic for all views. Reuse established Phase 2 AI and UI patterns wherever applicable. Architect review of AI suggestions should feel like transcript extraction review — familiar workflow, different content.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-salesforce-org-connectivity-and-developer-integration*
*Context gathered: 2026-04-06*
