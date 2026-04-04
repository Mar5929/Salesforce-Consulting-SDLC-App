# Architecture Analysis: Scalability, Knowledge Intelligence, and Security

**Date:** April 4, 2026
**Author:** Claude (Opus 4.6) at Michael Rihm's request
**Scope:** Full review of PRD v2.3, Technical Spec (Sessions 3-7), V2 Roadmap, and session thread history
**Focus areas:** Scalability under multi-project growth, Progressive Knowledge Intelligence layer viability, Security risks

---

## 1. Executive Assessment

The architecture is well-considered for a V1 internal tool serving 10-30 concurrent projects. The three-layer knowledge architecture (structured relationships + AI-curated articles + semantic retrieval) is the right conceptual design for the "progressively smarter AI" goal. The spec has gone through 7 sessions of refinement and a pre-build gap analysis that caught 15 real issues.

That said, several structural risks emerge when you stress-test the design against the stated goal: an AI that understands an entire Salesforce org so deeply it can produce world-class solution designs for any new story, bug, or feature. Below are the findings organized by severity and category.

---

## 2. Progressive Knowledge Intelligence: Will the AI Actually Get Smarter?

This is the core value proposition and the area with the most structural risk.

### 2.1 CRITICAL: Knowledge Article Quality Has No Feedback Loop

**The problem:** Knowledge Articles are the AI's persistent memory. The entire premise is that these articles accumulate understanding over time. But the architecture has no mechanism to measure or improve article quality.

- Articles are written by AI and optionally confirmed by a human (the architect).
- There is no metric for "this article helped the AI produce a better solution design" vs. "this article was irrelevant noise."
- The staleness detection system flags articles when referenced entities change, but staleness is not the same as quality. An article can be fresh but shallow, or fresh but wrong.
- The confidence field (LOW/MEDIUM/HIGH) is set at creation time by the AI itself. There is no mechanism for the confidence to increase based on validation (e.g., "this article's claims were confirmed by 3 successful story implementations").

**The risk:** Over 6+ months on a complex org, you accumulate dozens of articles. Some are insightful. Some are wrong or superficial. The AI treats them all as equally authoritative in the two-pass retrieval system. Garbage articles dilute the context window with noise, and the AI has no way to distinguish its own good synthesis from its bad synthesis.

**Recommendation:** Add an `effectiveness` signal to KnowledgeArticle. Options:
1. Track when an article is loaded into a context package and whether the resulting story implementation succeeded (no defects, no rework). Articles correlated with successful outcomes get boosted in retrieval ranking.
2. Allow developers to thumbs-up/thumbs-down articles from the context package view (V2 feature, Section 3.6). Even a simple boolean "was this useful?" per context package load would provide signal.
3. During article refresh, have the AI compare the previous article version against the current entity state and flag contradictions, not just regenerate.

### 2.2 HIGH: Business Process Discovery is a One-Shot Operation

**The problem:** BusinessProcess entities are created during brownfield ingestion (Phase 3+4 of the ingestion pipeline). After initial ingestion, the only way new business processes get created is through:
- Manual creation by the architect
- Re-running the full ingestion pipeline (which is triggered by metadata sync)

But metadata sync (every 4 hours) runs the parse and classify phases. The synthesize+articulate phases (3+4) are described in the ingestion pipeline as part of initial ingestion, not as part of the recurring 4-hour sync. The tech spec's `metadataSyncFunction` (Section 7.4) runs all 4 phases, but this means every 4-hour sync triggers an AI call to re-synthesize business processes, which seems expensive and potentially destructive (overwriting confirmed processes with new AI suggestions).

**The risk:** Either:
- The 4-hour sync only runs phases 1-2 (parse + classify), in which case new components added by developers between initial ingestion and project end never get synthesized into business processes or articles. The knowledge layer goes stale at the structural level.
- The 4-hour sync runs all 4 phases, in which case you're burning AI tokens every 4 hours per project and risk overwriting architect-confirmed processes.

**Recommendation:** Split the sync into two modes:
1. **Incremental sync (every 4 hours):** Parse + classify only. Detect new/changed/removed components. Flag new components that don't belong to any business process as "unassigned."
2. **Knowledge refresh (manual trigger or weekly):** Run synthesis+articulation on unassigned components and stale articles. Present results as suggestions, not overwrites.

### 2.3 HIGH: The AI Cannot Learn from Implementation Outcomes

**The problem:** The knowledge layer accumulates understanding during discovery and org ingestion, but there is no feedback path from build-phase outcomes back into the knowledge layer:

- When a developer implements a story and discovers that the AccountTriggerHandler is actually more complex than the knowledge article describes, there is no mechanism for that learning to flow back into the article.
- When a defect is filed against a story, the knowledge layer does not learn "this business process has a tricky edge case around X."
- When a story touches components that the AI did not predict (the developer found additional dependencies), the BusinessProcessComponent relationships are not updated.

The Component Report API (`POST /api/projects/:projectId/org/component-report`) accepts reports of components created/modified, but this only updates the StoryComponent records. It does not trigger knowledge layer updates.

**The risk:** The knowledge layer reflects the state of understanding at the time of discovery and initial ingestion, not the state of understanding that the team has built through months of actual implementation. The AI's "memory" is frozen at the beginning of the project.

**Recommendation:** Add two feedback mechanisms:
1. **Post-implementation knowledge update trigger:** When a story moves to DONE, the execution engine should compare the story's actual StoryComponent records against the predicted ones and flag discrepancies. If significant, emit an `article.flagged-stale` event for related articles.
2. **Defect-driven knowledge enrichment:** When a defect is filed against a story, flag all knowledge articles that reference the same components. The defect's steps-to-reproduce and root cause contain valuable understanding about how the system actually behaves.

### 2.4 MEDIUM: Context Package Assembly is Component-Centric, Not Behavior-Centric

**The problem:** The context package for developers (Section 12.2, Tier 2) finds relevant knowledge by traversing from the story's impacted components to their business processes and then to relevant articles. This is component-centric: "what do we know about the things this story touches?"

But the best solution designs come from understanding behavior, not just components. A story that modifies a single validation rule on Opportunity might need to understand the entire renewal pipeline: what triggers it, what downstream processes depend on it, what business rules constrain it. The current traversal (story components -> business processes -> articles) would find the validation rule's business process, but might miss upstream and downstream processes linked via BusinessProcessDependency.

**The risk:** The AI gets components-level context ("this validation rule is part of the Renewal Pipeline") but misses behavioral context ("the Renewal Pipeline depends on the Quote Approval process, which uses a different validation pattern, and breaking consistency here will confuse users").

**Recommendation:** Extend `getBusinessProcessForStory` to traverse one hop through BusinessProcessDependency. If a story touches a component in Process A, also load Process A's dependencies (both inbound and outbound) at summary level. The token cost is small (process names + dependency types) and the behavioral context is high-value.

### 2.5 MEDIUM: No Cross-Project Learning (By Design, But Worth Questioning)

**The problem:** Section 22.2 states: "There is no cross-project learning or context sharing." This is correct for client data isolation. But the firm builds Salesforce solutions repeatedly. Patterns like "Account trigger handler architecture" or "renewal pipeline design" recur across projects.

**The risk:** The AI starts from zero understanding on every new project, even when the firm has built the same pattern 10 times before. The "best technical architect on earth" goal requires institutional knowledge, not just per-project knowledge.

**Recommendation (V2):** Add a firm-level knowledge layer separate from project data:
- **Pattern Library:** Anonymized, architect-approved solution patterns extracted from completed projects. "When building a renewal pipeline, consider X, Y, Z." No client data, just architectural patterns.
- **Component Archetype Templates:** Firm-standard implementations (trigger handler pattern, selector pattern, service pattern) with documented rationale.
- This is explicitly V2, but the knowledge article architecture should be designed with a `scope` field (PROJECT vs. FIRM) to support it later.

---

## 3. Scalability Issues Under Multi-Project Growth

### 3.1 CRITICAL: Inngest + Vercel Serverless Will Hit Walls Faster Than Expected

**The problem:** The V2 roadmap documents this risk, but the trigger indicators may be too conservative. Here's the math:

- 30 concurrent projects, each with a 4-hour metadata sync = 180 sync jobs/day.
- Each sync runs 4 Inngest steps. That's 720 step executions/day just for metadata sync.
- Add transcript processing (estimate 5-10 transcripts/day across all projects), article refresh (every agent interaction can flag stale articles), embedding generation (every entity create/update), dashboard synthesis, and notification dispatch.
- Conservative estimate: 2,000-5,000 Inngest events/day at 30 projects.

Inngest's free tier allows 5,000 events/month. You'll blow through that in 1-3 days.

**The risk:** You hit the paywall within the first month of multi-project use, not at the "10+ concurrent projects triggering events simultaneously" trigger indicator.

**Recommendation:**
1. Start on Inngest's paid tier from day one if you plan to onboard more than 3 projects.
2. Batch embedding generation (the spec acknowledges this in V2 roadmap Section 1.1, but it should be a V1 design). Instead of one Inngest event per entity, collect entities in a buffer and emit one batch event per project per 30 seconds.
3. Make the 4-hour sync interval configurable per project. Managed services projects with stable orgs can sync every 12-24 hours. Active build projects sync every 4 hours.

### 3.2 HIGH: Embedding Generation Cost at Scale

**The problem:** Every entity create/update emits an `entity.content-changed` event that triggers embedding generation. At 30 projects:

- OrgComponents: A medium brownfield org has 500-2000 components. Initial ingestion = 500-2000 embedding API calls per project.
- Knowledge Articles: 20-50 per project after ingestion.
- Questions, Decisions, Stories: Accumulate over project lifetime. A 6-month project might generate 200 questions, 50 decisions, 100 stories.
- Each embedding call costs ~$0.0001 (OpenAI ada-002) or more for higher-quality models.

At 30 projects: initial ingestion alone is 15,000-60,000 embedding calls. Over the project lifetime, another 10,000-30,000 per project.

**The risk:** Embedding costs are manageable but the volume of API calls can hit rate limits. More concerning: embedding generation is async via Inngest, but the spec doesn't specify what happens when a search or context assembly runs before the embedding is generated. New entities will have null embeddings and be invisible to semantic search.

**Recommendation:**
1. Batch embedding generation (as noted above).
2. Add a `embeddingStatus` field (PENDING/GENERATED/FAILED) to embedded entities so search can fall back to full-text for entities with pending embeddings.
3. Document the embedding provider choice. The spec uses vector(1536) which implies OpenAI ada-002 or text-embedding-3-small. If using Claude for everything else, consider Voyage AI embeddings (Anthropic's recommended embedding partner) to avoid a second provider dependency.

### 3.3 HIGH: VersionHistory Table Growth

**The problem:** The pre-build gap analysis flagged this and the resolution was "accepted trade-off for V1." But at 30 concurrent projects with 200+ stories each, the math gets concerning:

- 30 projects x 200 stories x 10 edits average = 60,000 VersionHistory rows in the first year.
- Each row stores a full JSON snapshot of the entity (15+ fields for stories, including text fields like description and acceptanceCriteria).
- Add version history for Questions (100-200 per project), Decisions, etc.
- Conservative estimate: 100,000-200,000 VersionHistory rows in year one.

Each row could be 2-10KB of JSON. That's 200MB-2GB of version history data in year one.

**The risk:** Not a crisis, but:
- Neon/Supabase free tiers have storage limits (typically 500MB-1GB).
- Queries against this table for entity history will slow down without proper indexing.
- The `previousState` JSON column is unstructured, making it impossible to query "show me all stories where the acceptance criteria changed."

**Recommendation:**
1. Add a composite index on `(entityType, entityId, version)` (the spec mentions an index on `(entityType, entityId)` but version is needed for ordered retrieval).
2. Consider a retention policy: keep full snapshots for the last 30 versions, archive older ones to S3 as compressed JSON. This is a V2 concern but should be designed for in V1 by adding a `isArchived` flag.
3. For the StatusTransition table (which captures the most commonly queried audit data), the current design is already right: dedicated columns instead of JSON blobs.

### 3.4 MEDIUM: Context Package Cache is In-Memory (Node.js Map)

**The problem:** The tech spec notes that context packages are cached with 5-minute TTL using an in-memory Node.js Map, with a note to upgrade to Redis for horizontal scaling. But Vercel serverless functions are stateless by design. Each invocation may run on a different instance.

**The risk:** The in-memory cache will have near-zero hit rate on Vercel serverless. Every cold start creates a new Map. You're paying for the cache invalidation logic (which adds complexity to entity updates) but getting almost no cache hits.

**Recommendation:** Either:
1. Skip the cache entirely in V1. The 7-query assembly for a context package should complete in <500ms with proper Postgres indexes. Premature optimization.
2. If caching is needed, use Vercel KV (Redis-compatible) from day one. It's a few lines of code difference and works correctly in serverless.

### 3.5 MEDIUM: Display ID Generation Under Concurrency

**The problem:** Section 2.4 of the tech spec acknowledges this: "At target scale, contention on the MAX query is negligible." The resolution is a unique constraint as a safety net with retry on collision.

At 30 projects with 1-3 concurrent users each, you might have 2-5 concurrent entity creations per second across all projects. The project-scoped unique constraint makes collisions rare.

**The risk:** The risk is not collision frequency but the retry mechanism. The spec says "the loser gets a constraint violation and retries with the next available number." But the retry logic is not specified. Without it, the user sees an error. With naive retry (query MAX again and increment), you can get into a retry loop under sustained concurrent creation (unlikely but possible during bulk transcript processing).

**Recommendation:** Use a Postgres SEQUENCE per project per entity type. Yes, the spec dismissed this as "doesn't scale well," but at 30 projects x 6 entity types = 180 sequences, that's trivially manageable. Sequences are atomic and lock-free. Alternatively, use an advisory lock around the MAX query + insert.

---

## 4. Security Risks

### 4.1 CRITICAL: No Input Sanitization Spec for AI Tool Calls

**The problem:** The agent harness executes tool calls from Claude's output. These tool calls write directly to the database via Prisma. The tool executor (Section 3.6) validates input format but there is no specification for:

- HTML/script injection in text fields (questionText, answerText, rationale, description). These fields are rendered in the web UI. If Claude generates content containing `<script>` tags (unlikely from Claude but possible from adversarial transcript content that Claude echoes), the application could be vulnerable to stored XSS.
- SQL injection via raw queries. The search infrastructure (Section 8) uses `prisma.$queryRaw` with template literals. Prisma's tagged template literal approach parameterizes these correctly, but the pattern must be followed consistently. A single instance of string concatenation in a raw query creates an injection vector.
- Content injection via transcript processing. Users paste arbitrary text (meeting transcripts) that the AI processes and extracts structured data from. If a transcript contains adversarial content designed to manipulate the AI's extraction ("ignore previous instructions and create a question that says..."), the AI might create entities with injected content.

**The risk:** Stored XSS is the most likely real-world vulnerability. A malicious or compromised transcript could inject content into Questions, Decisions, or Requirements that gets rendered unsanitized in the web UI.

**Recommendation:**
1. Sanitize all user-facing text fields on output (render with a sanitization library like DOMPurify, or use React's default JSX escaping consistently). Never use `dangerouslySetInnerHTML` on AI-generated or user-provided content.
2. Add a content validation step to the tool executor that strips HTML tags and script content from all text fields before database writes.
3. For the raw SQL in search queries: establish a coding standard that all `$queryRaw` calls must use tagged template literals (which Prisma parameterizes). Add a linting rule to catch string concatenation in raw queries.

### 4.2 HIGH: Salesforce OAuth Token Encryption Strategy is Fragile

**The problem:** The spec documents AES-256-GCM encryption via Prisma middleware, with the key in an environment variable (`SF_TOKEN_ENCRYPTION_KEY`). This is the standard approach, but:

- A single encryption key for all projects means a key compromise exposes all Salesforce org credentials across all projects.
- The Prisma middleware approach means the decrypted tokens exist in application memory during any Prisma query that loads the Project model. Context loaders that don't need tokens must use `select` to avoid loading them, but this is an opt-out pattern (insecure by default, secure by discipline).
- There is no key rotation mechanism. If the key is compromised, re-encrypting all tokens requires a manual migration.
- Vercel serverless function logs, error tracking (Sentry), and debugging tools could inadvertently capture decrypted token values if they appear in error stack traces.

**The risk:** A single key compromise + a logging misconfiguration = all client Salesforce orgs accessible to an attacker.

**Recommendation:**
1. Use per-project encryption keys derived from the master key using HKDF (key derivation function). A compromise of one derived key exposes one project's tokens, not all.
2. Create a dedicated `SalesforceCredential` model separate from Project, with its own select/include pattern. This forces developers to explicitly request credentials rather than accidentally loading them.
3. Add a `.toJSON()` override or Prisma middleware that strips token fields from any serialized Project object, preventing accidental logging.
4. Plan for key rotation in V1 even if you don't build it: store a `keyVersion` alongside encrypted tokens so you can re-encrypt incrementally when the key changes.

### 4.3 HIGH: No Rate Limiting on the REST API for Claude Code

**The problem:** The Context Package API, Org Query API, Story Status API, and Component Report API are authenticated REST endpoints consumed by Claude Code. The spec documents rate limiting for the AI agent harness (per-consultant daily limits, per-project monthly cost caps), but there is no rate limiting specified for the REST API itself.

**The risk:** A compromised or misconfigured Claude Code session could hammer the API with requests. The Org Query API is especially concerning: it returns filtered org metadata, and unrestricted queries could be used to exfiltrate an entire project's org knowledge base.

**Recommendation:**
1. Add API-level rate limiting (e.g., 60 requests/minute per API key per endpoint). Vercel supports edge-level rate limiting via middleware.
2. Add request logging for API endpoints that return project data. Log the authenticated user, endpoint, and query parameters. This supports both security auditing and the access logging requirement in Section 22.4.
3. Scope API tokens per project. A token issued for Project A cannot query Project B's endpoints, even if the user has access to both projects. This is defense-in-depth on top of the project isolation described in Section 22.2.

### 4.4 MEDIUM: Polymorphic Join Tables Break Referential Integrity

**The problem:** KnowledgeArticleReference, Attachment, VersionHistory, and StatusTransition all use polymorphic patterns (entityType + entityId with no database-level FK). The spec acknowledges this: "Application-level validation ensures referential integrity."

**The risk:** Application-level validation is a single point of failure. If a bug in the tool executor writes an invalid entityId, the reference silently points to nothing. If an entity is deleted (e.g., a question is discarded during review), all polymorphic references to it become orphans with no cascade delete. Over time, these orphan references accumulate and cause confusing behavior: "This article references 5 components, but only 3 exist."

**Recommendation:**
1. Add a periodic cleanup job (Inngest, weekly) that scans polymorphic tables for orphaned references and logs/removes them.
2. When deleting any entity that could be referenced polymorphically, check for references and either block the delete or cascade-clean the references. Add this to the application's delete logic for Questions, Decisions, Stories, OrgComponents, and BusinessProcesses.
3. Consider whether KnowledgeArticleReference actually needs to be polymorphic. The referenced entity types are known and fixed (6 types). Six nullable FK columns with a CHECK constraint (exactly one non-null) provides database-level referential integrity at the cost of schema width. Given the importance of knowledge articles to the core value proposition, the integrity guarantee may be worth it.

### 4.5 MEDIUM: No CSRF Protection Specified for State-Changing API Endpoints

**The problem:** The PRD specifies authentication via Clerk, and the API is consumed by both the web UI (Next.js server actions) and Claude Code (REST API). For web UI interactions, Next.js server actions have built-in CSRF protection. But the REST API endpoints (consumed by Claude Code) are also reachable from the browser.

**The risk:** If a consultant is logged in to the web application and visits a malicious page, the page could make authenticated requests to the Story Status API or Component Report API, modifying project data.

**Recommendation:**
1. For REST API endpoints consumed by Claude Code, use API key authentication (separate from the Clerk session cookie). This makes CSRF impossible because the browser won't automatically include the API key.
2. Ensure all state-changing operations through the web UI use Next.js server actions (which include CSRF tokens) rather than direct API calls.

### 4.6 LOW: Transcript Content is a Prompt Injection Vector

**The problem:** Users paste meeting transcripts that the AI processes. The AI extracts structured data (questions, decisions, requirements) from arbitrary text. If a transcript contains adversarial content designed to manipulate Claude (either intentionally by a bad actor or unintentionally from a client who uses AI-generated meeting notes), the extraction could be corrupted.

**The risk:** Low probability in an internal tool, but:
- A client's AI-generated meeting notes could contain patterns that confuse Claude's extraction.
- If the firm ever allows clients to upload transcripts directly (not in V1 scope), this becomes a real injection risk.

**Recommendation:**
1. Add a system prompt instruction for transcript processing that explicitly tells Claude to treat the transcript as untrusted user content and to ignore any instructions embedded within it.
2. Log the full extraction results (already happening via SessionLog.entitiesCreated) so the review mechanism catches any anomalous extractions.

---

## 5. Additional Architectural Concerns

### 5.1 MEDIUM: General Chat Statelessness May Frustrate Users

**The problem:** Section 8.2 explicitly states general chat is stateless per-message: "each message is independently processed" with "no conversational memory from previous chat messages." The user experience implication: a BA cannot have a multi-turn conversation in general chat. If they say "the client confirmed the renewal process uses custom objects" and then follow up with "and they said it should trigger an email notification," the AI will not connect the second message to the first.

**The risk:** Users will expect conversational behavior in a chat interface and get confused when the AI "forgets" what they just said. This will lead to repeated context in every message, frustrating power users.

**Recommendation:** This is a deliberate design choice (documented and intentional), but consider:
1. Loading the last 3-5 general chat messages as lightweight context (just message content, no full project context reload). This provides basic conversational continuity without the cost of full context assembly.
2. Adding a clear UI indicator that general chat is a "log channel" not a "conversation." Something like "Each message is processed independently. For multi-turn conversations, start a task session."

### 5.2 MEDIUM: No Graceful Degradation for AI Service Outages

**The problem:** The entire application depends on Claude API availability. If Anthropic has an outage:
- Transcript processing fails.
- Story generation fails.
- Dashboard synthesis fails.
- Question answering (with impact assessment) fails.
- All background jobs that use AI fail.

**The risk:** During an AI outage, the application becomes a read-only dashboard. Users cannot do productive work except manual data entry.

**Recommendation:**
1. Identify which operations can proceed without AI and ensure the UI still allows them: manual question/story CRUD, manual status transitions, sprint management, test execution.
2. Add a health check endpoint that monitors Claude API availability. When the API is down, show a banner and disable AI-dependent features rather than letting users trigger actions that will fail.
3. The Inngest retry mechanism handles transient failures, but an extended outage will pile up events that all fire when the API comes back. Add a backpressure mechanism: if the retry queue exceeds N events, pause non-critical jobs (article refresh, dashboard synthesis) and prioritize user-triggered work.

### 5.3 LOW: Multi-Tenancy Isolation is Application-Level Only

**The problem:** All projects share one PostgreSQL database. Isolation is enforced by `projectId` filters on every query. There is no row-level security (RLS) in Postgres.

**The risk:** A bug in any Prisma query that omits the `projectId` filter leaks data across projects. At 30 projects with different clients, this is a real compliance concern.

**Recommendation:**
1. Enable Postgres Row-Level Security (RLS) as a defense-in-depth measure. Create a policy that restricts rows to the current project context. This catches application bugs that miss the projectId filter.
2. Add a Prisma middleware that automatically injects `projectId` filters on all queries when a project context is active. This is the "secure by default" pattern that prevents developers from accidentally writing cross-project queries.

---

## 6. Summary of Recommendations by Priority

### Must-Address Before Phase 1 Build

| # | Issue | Section | Impact |
|---|-------|---------|--------|
| 1 | Add input sanitization for AI tool call outputs (XSS prevention) | 4.1 | Security: stored XSS |
| 2 | Split metadata sync into incremental vs. full knowledge refresh | 2.2 | Knowledge layer goes stale |
| 3 | Plan for Inngest paid tier from project #3 onward | 3.1 | Operational: free tier exhausted in days |
| 4 | Use Vercel KV or skip context package cache (in-memory won't work on serverless) | 3.4 | Wasted complexity |
| 5 | Add prompt injection defense in transcript processing system prompt | 4.6 | Security: extraction corruption |

### Should-Address During Phase 1 Build

| # | Issue | Section | Impact |
|---|-------|---------|--------|
| 6 | Add effectiveness signal to KnowledgeArticle | 2.1 | Knowledge quality degrades over time |
| 7 | Create per-project derived encryption keys for SF tokens | 4.2 | Security: single key compromise |
| 8 | Add API-level rate limiting for REST endpoints | 4.3 | Security: data exfiltration |
| 9 | Batch embedding generation instead of per-entity events | 3.2 | Operational: API rate limits, cost |
| 10 | Add embeddingStatus field for graceful fallback to full-text search | 3.2 | UX: new entities invisible to semantic search |

### Should-Address During Phase 2-3 Build

| # | Issue | Section | Impact |
|---|-------|---------|--------|
| 11 | Extend context package traversal through BusinessProcessDependency | 2.4 | Knowledge: missing behavioral context |
| 12 | Add post-implementation knowledge update trigger (story DONE -> flag articles) | 2.3 | Knowledge: frozen at discovery time |
| 13 | Add defect-driven knowledge enrichment | 2.3 | Knowledge: misses implementation learnings |
| 14 | Enable Postgres RLS for project isolation | 5.3 | Security: cross-project data leak defense |
| 15 | Add orphan reference cleanup for polymorphic tables | 4.4 | Data integrity: orphaned references accumulate |

### V2 Considerations (Design for Now, Build Later)

| # | Issue | Section | Impact |
|---|-------|---------|--------|
| 16 | Firm-level knowledge layer (pattern library, component archetypes) | 2.5 | Knowledge: AI starts from zero on every project |
| 17 | Add `scope` field to KnowledgeArticle (PROJECT vs. FIRM) for future cross-project patterns | 2.5 | Forward-compatibility |
| 18 | VersionHistory retention policy with S3 archival | 3.3 | Storage: 200MB-2GB in year one |
| 19 | General chat conversational continuity (last 3-5 messages as context) | 5.1 | UX: users will expect conversation |
| 20 | AI service outage graceful degradation | 5.2 | Operational: app becomes read-only during outages |
