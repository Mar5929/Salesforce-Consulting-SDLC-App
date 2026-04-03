# Session 4: Knowledge Architecture Gap Analysis

**Date:** 2026-04-03 (continued 2026-04-03, Sessions 4-7)
**Status:** All high-priority gaps resolved. PRD updated to v2.3. Tech spec needs minor updates for Session 7 additions.
**Context:** Before starting Phase 1 construction, we paused to poke holes in the PRD, specifically around the knowledge base architecture.

---

## What We Set Out To Do

Continue refining the PRD before building. The user identified that the knowledge base / knowledge graph architecture was underspecified: specifically, how the AI stores and builds understanding of an org's technical components married to business context (e.g., multiple technical components together = "Account Onboarding Process").

---

## Gap Identified: No Business Process Entity

The PRD has three concepts that touch "business meaning of technical components":
1. **DomainGrouping** (flat labels: Sales, Finance, Marketing)
2. **BusinessContextAnnotation** (free-text notes on individual components)
3. **StoryComponent** join table (which stories touch which components)

**Missing:** There is no entity representing a **business process** composed of multiple technical components working together. "Account Onboarding" might involve an Account trigger, a Flow, a custom object, three fields, and a permission set all working in concert. The only way to express this today is human annotations on individual components, one at a time.

**Decision:** Add a first-class `BusinessProcess` entity. User confirmed this direction.

---

## Core Architecture Discussion: How Does the AI Retain Understanding?

The user asked: what's the right architecture for the AI to progressively build and retain knowledge about an org? Is it a knowledge graph? Something else?

### Options Explored

**Option 1: Knowledge Graph (Neo4j or similar)**
- Nodes for components, processes, concepts. Typed edges connecting them.
- Pros: powerful traversals, explicit relationship modeling.
- Cons: new infrastructure, complexity, query debugging harder, build time for solo developer.
- Assessment: Solves a scale problem (millions of nodes) that this product doesn't have in V1. Overkill.

**Option 2: Enhanced Relational + Embeddings (pgvector)**
- Stay in Postgres. Add richer relationship tables + vector embeddings for semantic search.
- Pros: simple stack, Prisma-compatible, incremental.
- Cons: AI re-discovers relationships every session. Embeddings find similar things, not connected things.
- Assessment: Not sufficient on its own. Doesn't solve the "AI forgets what it learned" problem.

**Option 3: AI-Curated Knowledge Layer (Knowledge Articles)**
- The AI writes structured summaries of what it's learned. These persist as database entities and become first-class context for future sessions.
- Pros: uses Claude's synthesis strength, token-efficient (pre-computed summaries vs. raw rows), no new infrastructure.
- Cons: AI cost per interaction, staleness risk, quality depends on AI.
- Assessment: Solves the right problem (AI retention) but the user pushed back that relationship structure also matters for queryability.

### Agreed Architecture: Two-Layer Design

**Layer 1: Structured Relationships (queryable, in Postgres)**

New entities to add to the spec:
- **BusinessProcess**: name, description, domain, status. Represents a logical business capability ("Account Onboarding", "Renewal Pipeline").
- **BusinessProcessComponent**: join table linking BusinessProcess to OrgComponent, with a `role` field describing the component's function in the process.
- **BusinessProcessDependency**: process-to-process relationships.

Purpose: queryable structure for dashboards, sprint intelligence, impact analysis. "This story modifies a component that participates in 3 business processes" is a SQL JOIN.

**Layer 2: AI-Curated Knowledge Articles (synthesized understanding, in Postgres)**

New entity:
- **KnowledgeArticle**: AI-maintained, versioned, natural-language synthesis of understanding about a topic.

Purpose: the AI's persistent memory. Instead of re-deriving understanding from raw rows every session, the AI reads its own previous synthesis and builds on it.

**Layer 1 is the skeleton (structure). Layer 2 is the muscle and memory (understanding).**

---

## Decisions Made

| Decision | Choice | Reasoning |
|---|---|---|
| Business process representation | First-class `BusinessProcess` entity | Current spec has no way to group components into logical business capabilities |
| Knowledge storage technology | Postgres (not graph DB) | V1 scale doesn't need graph traversals; bottleneck is AI context, not query performance |
| Two-layer knowledge architecture | Structured relationships + AI-curated articles | Need both queryable structure AND persistent AI understanding |
| AI write approval model | AI commits directly, humans can correct | Faster knowledge accumulation; mirrors existing DomainGrouping pattern with `isConfirmed` flag |
| Knowledge Article scoping | Flexible topic-based with `articleType` field | Articles need to cover business processes, integrations, cross-cutting concerns, stakeholder context, not just processes |

### Article Types Discussed
- `BUSINESS_PROCESS`: about a specific business process and its components
- `INTEGRATION`: about how systems connect (e.g., Pardot integration)
- `ARCHITECTURE_DECISION`: cross-cutting technical architecture
- `DOMAIN_OVERVIEW`: broad domain area synthesis
- `CROSS_CUTTING_CONCERN`: things like sharing model, data migration strategy
- `STAKEHOLDER_CONTEXT`: institutional knowledge about client teams/constraints

### Article Entity Linking
Articles reference multiple entities (BusinessProcesses, OrgComponents, Epics, Questions, Decisions) via a join table. This is how the system finds relevant articles for a given context: "give me all articles that reference any component this story touches."

---

## Session 5 Decisions (2026-04-03, continued)

### Three-Layer Knowledge Architecture (refined from two-layer)

Confirmed the two-layer design from Session 4, then refined it to three layers after discussing whether embeddings (pgvector) were redundant or complementary:

| Layer | Purpose | Technology |
|-------|---------|------------|
| Structured relationships | "Which components participate in Account Onboarding?" | Postgres joins (BusinessProcess + join tables) |
| Synthesized understanding | "What does the AI know about Account Onboarding?" | KnowledgeArticle entities in Postgres |
| Semantic retrieval | "Find anything related to account creation" | pgvector embeddings on articles, components, questions |

**Key clarification:** Embeddings are the *retrieval mechanism* for finding relevant articles and components to load into context. They are not the knowledge representation itself. The tech spec already has pgvector for `OrgComponent.embedding`; we extend that to also embed `KnowledgeArticle.content`.

### Article Update Triggers: Hybrid (confirmed)

- Agent flags articles as "potentially stale" inline (cheap DB update: `staleReason`, timestamp). No synthesis during the agent loop.
- Background job does deep refresh: re-reads referenced entities, rewrites article content, updates version and embedding.
- Trigger conditions for flagging: agent touches a component that's referenced by an article, agent answers a question that changes understanding of a topic, user confirms/corrects a domain grouping or business process.

---

### Entity Specs: BusinessProcess + KnowledgeArticle (confirmed)

**New entities added to schema (5 total):**

**BusinessProcess**: name, description, domainGroupingId (FK -> DomainGrouping), status (DISCOVERED/DOCUMENTED/CONFIRMED/DEPRECATED), complexity (LOW/MEDIUM/HIGH/CRITICAL nullable), isAiSuggested, isConfirmed. Unique: (projectId, name).

**BusinessProcessComponent** (join): businessProcessId, orgComponentId, role (string describing function in process), isRequired. Unique: (businessProcessId, orgComponentId).

**BusinessProcessDependency** (process-to-process): sourceProcessId, targetProcessId, dependencyType (TRIGGERS/FEEDS_DATA/REQUIRES_COMPLETION/SHARED_COMPONENTS), description. Unique: (sourceProcessId, targetProcessId).

**KnowledgeArticle**: articleType (BUSINESS_PROCESS/INTEGRATION/ARCHITECTURE_DECISION/DOMAIN_OVERVIEW/CROSS_CUTTING_CONCERN/STAKEHOLDER_CONTEXT), title, content (markdown), summary (one-liner for two-pass context assembly), confidence (LOW/MEDIUM/HIGH), version (int, incremented on refresh), isStale, staleReason, staleSince, lastRefreshedAt, authorType (AI_GENERATED/HUMAN_AUTHORED/AI_GENERATED_HUMAN_EDITED), embedding (vector 1536). Unique: (projectId, articleType, title).

**KnowledgeArticleReference** (polymorphic join): articleId, entityType (BUSINESS_PROCESS/ORG_COMPONENT/EPIC/STORY/QUESTION/DECISION), entityId. Unique: (articleId, entityType, entityId). Polymorphic (no true FK) because articles can reference many entity types.

**Design calls confirmed:**
- summary field on KnowledgeArticle for two-pass context loading (summaries first, full content for top-N relevant)
- Polymorphic join table for article references (cleaner than N nullable FKs, trades DB-level referential integrity)
- complexity field on BusinessProcess kept (useful for sprint intelligence impact analysis)

### Context Assembly Integration (confirmed)

**New Layer 3 query functions:**
- `getRelevantArticles(projectId, scope)` : full content of top-N semantically relevant articles
- `getArticleSummaries(projectId, scope)` : title + summary only for two-pass loading
- `getBusinessProcesses(projectId, scope)` : processes filtered by componentIds, domain, etc.
- `getBusinessProcessForStory(storyId)` : story's components -> their business processes

**Two-pass retrieval pattern:**
1. Load article summaries for relevant scope (~50 tokens each)
2. Embed task/query, find top-N by cosine similarity
3. Load full content of only top-N articles

**Budget impact by task type:**
- Transcript Processing: +1-2K (article summaries for mentioned domains; AI flags stale articles)
- Story Generation: +2-4K (business processes for epic domain + top 3 relevant articles full)
- Story Enrichment: +1-2K (business processes for story components + article summaries)
- Context Package Assembly: +3-5K (business processes for story components + top 3 articles full; biggest impact, developers need business context)
- Sprint Analysis: +2-3K (business processes for all sprint components)
- Question Answering: +1-3K (top 2 semantically matched articles full)
- Briefing/Dashboard: +2-4K (article summaries project-wide, no full content)

**Staleness flagging:** End of every agent loop, execution engine queries which articles reference entities the agent modified. Sets `isStale = true` + `staleReason`. DB query only, no AI call.

## Still Open

1. ~~When does the AI update Knowledge Articles?~~ **Decided: Hybrid**
2. ~~Knowledge Article entity design~~ **Decided: full spec confirmed**
3. ~~BusinessProcess entity design~~ **Decided: full spec confirmed**
4. ~~How articles feed into context packages~~ **Decided: two-pass retrieval + per-task-type integration**
5. ~~Brownfield org ingestion changes~~ **Decided: expanded 4-phase ingestion**
6. **Other PRD gaps not yet explored:** Team member workflows, other missing pieces.

### Brownfield Org Ingestion: Expanded Flow (confirmed)

Previous flow produced OrgComponent + OrgRelationship + DomainGrouping. Now expanded to 4 phases:

```
Phase 1: Parse → OrgComponent + OrgRelationship rows
Phase 2: Classify → DomainGrouping suggestions (existing)
Phase 3: Synthesize → BusinessProcess + BusinessProcessComponent suggestions (NEW)
Phase 4: Articulate → KnowledgeArticle drafts, one per process + one per domain (NEW)
```

**Phases 3+4 run as a single AI call** (same context needed for both; splitting would re-derive understanding twice).

**Confirmation model:**
- BusinessProcess: `isAiSuggested = true`, `isConfirmed = false`, `status = DISCOVERED`
- KnowledgeArticle: `authorType = AI_GENERATED`, `confidence = LOW|MEDIUM`
- Architect reviews and confirms all AI suggestions before they're treated as trusted context.

---

## PRD Gap Analysis (Session 5)

Reviewed all 27 sections. Knowledge architecture was the biggest gap (resolved above). Remaining gaps identified, ranked by severity:

### High Priority (resolve before Phase 1 build)
1. ~~Chat/conversation interface~~ **Decided: Hybrid model (Option C)**
2. ~~Background job infrastructure~~ **Decided: Inngest (Option B) for V1, with documented V2 scaling path**
3. ~~AI ambiguity handling~~ **Decided: Hybrid Pattern 3 (context-dependent)**
4. ~~Search~~ **Decided: Three-layer (filtered + full-text + semantic)**
5. ~~Notification system~~ **Decided: In-app notifications via Inngest events**

### Medium Priority (before Phase 2-3)
6. **QA role too restricted** - RBAC blocks QA from chat/questions. QAs discover things during testing.
7. **Activity feed / change history UI** - SessionLog and VersionHistory exist but no UI spec.
8. **Developer fallback without Claude Code** - context package should be viewable in web UI.
9. **Large transcript handling** - no spec for transcripts exceeding typical size (20K+ words).

### Lower Priority (before Phase 3-4)
10. **Data export** - no export format for engagement end or migration.
11. **File upload constraints** - no size limits, allowed types, validation.
12. **Real-time updates** - "WebSocket or polling" too vague for multi-user.

### Chat/Conversation Interface Design (confirmed: Option C Hybrid)

**Model:** General project chat + task-specific sessions.
- General chat: one per project, auto-created. Quick conversational discovery ("client confirmed X"). All members with chat permission see it.
- Task sessions: discrete, scoped conversations for heavy-lift tasks (transcript processing, story generation, briefings). Each session = one SessionLog = one cost tracking unit.

**Visibility:** All conversations visible to all project members with chat permission. Session history browsable for audit trail and context continuity.

**Persistence:** All conversations persist. Nothing ephemeral. AI can reference previous conversations.

**Concurrency:** Interleaved messages in general chat (each triggers independent harness call). Simultaneous task sessions are independent. Conflict detection catches contradictory info across conversations.

**New entities:**

**Conversation**: id, projectId, conversationType (GENERAL_CHAT/TRANSCRIPT_SESSION/STORY_SESSION/BRIEFING_SESSION/etc), title (nullable, auto-generated for sessions), status (ACTIVE/COMPLETE/FAILED), createdById (FK -> ProjectMember), sessionLogId (nullable FK -> SessionLog), timestamps.

**ChatMessage**: id, conversationId, role (USER/ASSISTANT/SYSTEM), content (text), senderId (nullable FK -> ProjectMember, null for AI), toolCalls (JSON nullable, for AI transparency), createdAt.

### Background Job Infrastructure (confirmed: Inngest for V1)

**V1 architecture:** Inngest running on Vercel serverless functions. Event-driven triggers, automatic retries with backoff, step functions with checkpoints, concurrency controls, job visibility dashboard.

**V1 job inventory:**

| Job | Trigger | Estimated Duration |
|---|---|---|
| Knowledge article refresh | Staleness flags accumulate (event: `article.flagged-stale`) | 10-30s per article |
| Dashboard synthesis cache | State changes (event: `project.state-changed`) + manual | 5-15s |
| Transcript processing | User upload (event: `transcript.uploaded`) | 30s-2min |
| Embedding generation | Entity create/update (event: `entity.content-changed`) | 1-5s per entity |
| Metadata sync | Scheduled (cron: every 4h) + manual (event: `org.sync-requested`) | 30s-5min |
| Notification dispatch | Various events (event: `notification.send`) | <1s |

**Event-driven pattern:** All state changes in the app emit Inngest events. Job handlers subscribe to relevant events. This naturally supports adding new handlers later (e.g., notifications become just another subscriber to existing events).

**Step function pattern for metadata sync:**
```
Step 1: Fetch metadata from Salesforce (checkpoint)
Step 2: Parse into OrgComponent/OrgRelationship rows (checkpoint)
Step 3: AI domain classification (checkpoint)
Step 4: AI business process + article synthesis (checkpoint)
```
Failure at step 3 doesn't re-run steps 1-2.

### V2 Scaling Path (when Inngest + Vercel hits limits)

**Known V1 constraints and V2 solutions:**

| V1 Constraint | When It Hurts | V2 Solution |
|---|---|---|
| Vercel function timeout (5-10 min) | Metadata sync for very large orgs (300+ objects, 5000+ fields); bulk article refresh across many stale articles | Migrate sync and bulk refresh to a dedicated worker service (Railway/Fly.io with BullMQ + Redis). Inngest can still trigger it via webhook. |
| Inngest free tier limits (may hit concurrency caps) | 20+ concurrent projects all triggering events simultaneously | Inngest paid tier, or migrate to self-hosted Inngest or BullMQ |
| No job prioritization in V1 | User-triggered jobs (manual sync, transcript processing) waiting behind batch jobs (scheduled article refresh) | Add priority queues: P0 (user-initiated, immediate), P1 (event-driven, seconds), P2 (scheduled batch, can wait) |
| Single-region execution | If Vercel region is far from Neon DB region, job latency increases | Co-locate worker service with database region, or use Vercel edge functions for lightweight jobs |
| No dead letter queue | Failed jobs retry but eventually drop silently | Add DLQ with alerting: failed jobs after max retries go to a review queue with admin notification |
| No job chaining / DAG execution | Complex workflows where Job B depends on Job A's output across different entity types | Inngest's `step.waitForEvent()` handles simple cases; for complex DAGs, evaluate Temporal or custom orchestration |
| Embedding generation is per-entity | Bulk operations (initial org ingestion creates 500+ components) flood the queue with individual embedding jobs | Batch embedding API calls: collect entities, embed in batches of 50-100, write results in one transaction |
| No rate limiting on AI API calls from jobs | Multiple concurrent jobs all calling Claude API simultaneously could hit Anthropic rate limits | Add a semaphore/concurrency limit on AI-calling jobs (Inngest supports `concurrency` config per function) |
| Monitoring is Inngest dashboard only | Need alerting, metrics, SLA tracking on job completion times | Integrate with external monitoring (Datadog, Sentry) for job failure alerts and latency tracking |
| No tenant isolation for jobs | One project's large sync blocks another project's event processing | Per-project concurrency limits and fair scheduling. V2: separate queues per project or priority class. |

**Migration trigger indicators (when to invest in V2 infrastructure):**
- Job failure rate exceeds 5% on any job type
- Metadata sync duration regularly exceeds 3 minutes
- More than 10 concurrent projects triggering events in the same minute
- Users report lag between action and dashboard/notification update exceeding 30 seconds
- Inngest monthly event volume approaching tier limits

### AI Ambiguity Handling (confirmed: Hybrid Pattern 3)

**Context-dependent approach:**
- General chat (user present): Ask inline clarifying question, then proceed.
- Task sessions (transcript processing, bulk ops): Best guess + confidence flag. Surface uncertain items at end of session as a review list.
- Background jobs (article refresh, embedding gen): Best guess + flag. No user to ask.

**Schema additions to AI-created entities (Question, Decision, Requirement, Risk):**
- `confidence` Enum: HIGH, MEDIUM, LOW. AI's certainty about the extraction.
- `needsReview` Boolean: Default false. Set true when AI is uncertain.
- `reviewReason` String: Nullable. Why the AI flagged it (e.g., "Could not determine scope: mentioned both Data Migration and Sales Process epics").

**Not added to:** BusinessProcess, KnowledgeArticle, DomainGrouping (already have isAiSuggested/isConfirmed or confidence/staleness flows).

**Task session completion UX:** Shows summary of created entities, count by confidence level, and a "Needs Review" section listing flagged items with reasons. User can click into each to confirm, edit, or discard.

### Search Architecture (confirmed: three-layer)

**Layer 1: Filtered search** (Prisma where clauses). Per-entity list views with entity-specific filters (status, scope, owner, epic, domain, etc.). Always available.

**Layer 2: Full-text search** (PostgreSQL `tsvector`/`tsquery`). Global search bar, fast exact matching, no AI cost. `tsvector` columns auto-maintained by Postgres triggers on insert/update. Prisma uses raw SQL for search queries.

**Layer 3: Semantic search** (pgvector cosine similarity). "Smart search" for meaning-based matching. Falls back to this when full-text returns few/no results, or user explicitly chooses it.

**UX:** Global search bar returns grouped results across all entity types (questions, stories, articles, components, decisions, etc.). Per-entity filtered search on each list view.

**Full-text indexed entities and fields:**
- Question: questionText, answer
- Decision: decisionText, rationale
- Requirement: description
- Story: title, description, acceptanceCriteria
- OrgComponent: apiName, label
- KnowledgeArticle: title, content, summary
- BusinessProcess: name, description
- Risk: description, mitigationStrategy

**Embedding strategy:** OrgComponent and KnowledgeArticle already have embedding columns. Other entities get embeddings generated on create/update via Inngest `entity.content-changed` event for semantic search.

### Notification System (confirmed: in-app only, Inngest-driven)

**V1: In-app notifications only.** Notification bell in header with unread count. No email in V1.

**Notification events:**
- Question answered (-> owner + blocking stakeholders) HIGH
- Work item unblocked (-> story assignee, sprint PM) HIGH
- Sprint conflict detected (-> affected developers + PM) HIGH
- AI processing complete (-> triggering user) MEDIUM
- Question aging past threshold (-> owner + PM) MEDIUM
- Health score changed (-> PM + architect) MEDIUM
- New question assigned (-> assigned owner) MEDIUM
- Story status changed (-> assignee, PM if sprint-active) LOW
- Knowledge article flagged stale (-> architect) LOW
- Metadata sync complete (-> architect) LOW

**Notification entity:** id, projectId, recipientId (FK -> ProjectMember), type (enum of all event types above), title, body (nullable), entityType (QUESTION/STORY/SPRINT/PROJECT/ARTICLE), entityId, isRead (default false), createdAt.

**Implementation:** Notifications are Inngest event handlers subscribing to existing events. No new infrastructure. Dispatch job determines recipients from project membership and entity relationships, writes Notification rows.

**V2:** Email (opt-in per type), push notifications, preferences UI, daily digest mode. Already captured in V2-ROADMAP.md.

## Session 6 (2026-04-03): Spec Updates Complete

### Work Completed
1. **PRD updated to v2.2** with all Session 4-5 decisions:
   - Section 5.1: Added Inngest background job infrastructure
   - Section 5.2.1: Added BusinessProcess, KnowledgeArticle, Conversation, ChatMessage, Notification entity descriptions
   - Section 5.2.3: Added BusinessProcessComponent, BusinessProcessDependency, KnowledgeArticleReference join tables
   - Section 6.6: Added AI ambiguity handling (confidence/needsReview/reviewReason)
   - Section 8.2: Expanded chat interface to describe general chat + task session model
   - Section 12.2: Revised context architecture to dual-source model (web app API + SF CLI)
   - Section 12.3: Updated developer workflow to include org inspection and story architecting steps
   - Section 13.6: Expanded brownfield ingestion to 4-phase pipeline
   - Section 13.7: Added three-layer knowledge architecture
   - Section 17.7: Added search architecture (filtered + full-text + semantic)
   - Section 17.8: Added notification system
   - Section 25: Added Inngest, pgvector, tsvector to tech stack
   - Section 26: Updated Phase 1 deliverables
   - Section 27: Reorganized open questions (resolved vs. remaining)

2. **Tech spec updated** with all Session 4-5 decisions:
   - Section 2.1: Updated entity relationship tree with new entities
   - Section 2.2: Added 8 new entity schemas (BusinessProcess, BusinessProcessComponent, BusinessProcessDependency, KnowledgeArticle, KnowledgeArticleReference, Conversation, ChatMessage, Notification) + ambiguity fields on Question, Decision, Requirement, Risk + embedding column on OrgComponent
   - Section 3: Updated context assembly Layer 3 with knowledge query functions, updated all context loader examples
   - Section 4.2: Updated context budget table with knowledge layer token additions per task type
   - Section 6: New brownfield ingestion pipeline with Inngest step function implementation
   - Section 7: New Inngest job infrastructure with job inventory, event schemas, step function patterns, staleness detection code
   - Section 8: New search infrastructure with tsvector setup, pgvector queries, global search implementation
   - Section 9: Reorganized remaining items (resolved vs. open)

### Decision: Developer Context Architecture (Session 6)
Claude Code has two sources of org knowledge:
- **Web app API**: Business intelligence (knowledge articles, business processes, decisions, cross-story context, sprint conflicts). The *why* and *how it fits together*.
- **SF CLI (local)**: Live technical reality from the developer's authenticated sandbox (source code, field definitions, current metadata). The *what exists right now*.

Claude Code merges both when architecting and executing a story. The web app provides context the SF CLI cannot (business processes, knowledge articles, cross-team awareness). The SF CLI provides ground truth the web app cannot (actual current source, fields added since last sync).

### Decision: Usage & Cost Dashboard (Session 6)
Added a "Usage & Costs" tab in project settings. Visible to SA and PM only.
- Project totals (tokens + estimated dollar cost) filterable by date range
- Breakdown by task type (which activities cost the most)
- Breakdown by team member (SA/PM eyes only; for capacity planning, not performance monitoring)
- Daily trend chart for spotting spikes
- Cost calculated from SessionLog token counts * pricing config (TypeScript constants in V1)
- Added `model` field to SessionLog to support per-model pricing
- PRD Section 23.4, RBAC table updated. Tech Spec Section 5.3.

### Medium-Priority Gaps: All Kept in V2
- #6 QA role too restricted: V2 (V2-ROADMAP Section 5.5)
- #7 Activity feed / change history UI: V2 (V2-ROADMAP Section 3.5)
- #8 Developer fallback without Claude Code: V2 (V2-ROADMAP Section 3.6)
- #9 Large transcript handling: V2 (V2-ROADMAP Section 6.2)

None are blocking for V1. All are captured in V2-ROADMAP.md.

## Session 7 (2026-04-03): Workflow Sanity Check + PRD Fixes

### What We Did
Traced every persona's (SA, Developer, PM, BA, QA) daily workflows end-to-end through the system. Checked for workflow dead ends, broken handoffs, missing RBAC permissions, data flow gaps, and chicken-and-egg problems. Found 20 issues across 4 severity levels.

### Issues Found and Resolved (PRD updated to v2.3)

**Critical (3):**
1. **PM can't update story status but manages sprints.** Fixed: Split status transitions into management (Draft/Ready/Sprint Planned) and execution (In Progress/In Review/QA/Done). Auto-transition to Sprint Planned on sprint assignment. Updated RBAC table.
2. **Impacted Components mandatory but org not connected until Phase 3.** Fixed: Field now supports two modes: free-text entries (always available) and linked OrgComponent references (Phase 3+). Section 10.3 updated.
3. **No QA handoff notification.** Fixed: Added testAssigneeId to Story entity. Added "Story moved to QA" notification (HIGH) to Section 17.8.

**High (5):**
4. **No milestone management in RBAC.** Fixed: Added "Create/manage milestones" row (SA, PM).
5. **No requirement/risk manual CRUD in RBAC.** Fixed: Added "Create/edit requirements" and "Create/edit risks" rows.
6. **No decision/risk notification events.** Fixed: Added "New decision recorded" (MEDIUM) and "Risk created or severity changed" (HIGH) to notification table.
7. **QA too restricted.** Fixed (partial): QA can now raise/answer questions and create Draft stories. Chat, decisions, transcripts remain V2.
8. **EpicPhase stored vs. computed contradiction.** Fixed: Clarified in Section 5.2.2 that EpicPhase is a stored entity with AI-driven updates.

**Medium (7) - resolved in PRD:**
9. No chat message notification: deferred to Phase 1 build (batched activity notification).
10. Business context annotation RBAC: added row (SA, BA).
11. Attachment upload RBAC: added row (all roles).
12. Defect lifecycle roles: added assigneeId to Defect entity, documented lifecycle roles.
13. Sprint FK edit restriction: separated "Assign stories to sprints" from story content editing.
14. Greenfield business process creation: note to add during Phase 3 build.
15. Epic prefix uniqueness: added validation constraint in Section 9.2.

**Low (5) - accepted or deferred to build:**
16. Milestone progress timing: resolve during Phase 1 build (it's instant/DB query).
17. General chat growth: accept for V1, revisit if projects exceed 6 months.
18. Developer can't process transcripts: accept for V1.
19. Story reassignment notification: added to notification table (MEDIUM).
20. Real-time updates TBD: resolve during Phase 1 build (recommendation: polling in V1).

### PRD Sections Modified
- Section 5.2.1: Added testAssigneeId on Story, assigneeId + lifecycle on Defect
- Section 5.2.2: Clarified EpicPhase is stored (AI-maintained), not purely computed
- Section 9.2: Added epic prefix uniqueness constraint
- Section 10.3: Impacted components supports free-text + linked modes
- Section 17.8: Added 4 notification events (QA handoff, decision, risk, reassignment)
- Section 19.1: Expanded RBAC table with 7 new rows, status transition permissions, sprint assignment separation, QA question/story access, annotations, attachments, milestones, requirements, risks

## How To Continue (Next Session)

1. Read this thread file to restore full context.
2. PRD is updated (v2.3) with all workflow sanity check fixes. Tech spec still needs corresponding updates for: testAssigneeId on Story, assigneeId on Defect, epic prefix unique constraint, StoryComponent free-text mode.
3. Proceed to Phase 1 build: Discovery and Knowledge Brain.
4. Phase 1 scope: PostgreSQL schema (all entities), pgvector + tsvector setup, Clerk auth, project creation, question CRUD with confidence/review fields, AI transcript processing, AI question answering, chat interface (general + task sessions), Inngest job infrastructure, in-app notifications, global search, discovery dashboard.
