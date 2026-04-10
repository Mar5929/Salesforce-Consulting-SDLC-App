# Pitfalls Research

**Domain:** Internal AI-powered Salesforce consulting work management platform
**Researched:** 2026-04-04
**Confidence:** HIGH (established stack with well-documented failure modes; verified against project tech spec)

---

## Critical Pitfalls

### Pitfall 1: Next.js App Router Server/Client Component Boundary Confusion

**What goes wrong:**
Developers mix server and client concerns, leading to: (a) accidentally making entire page trees client components by importing a single `useState` at the top, (b) trying to pass non-serializable props (functions, class instances) from server to client components, (c) unexpected re-renders when server components re-execute on navigation. In this project, the dashboard pages, question system, and chat interface all require both server-fetched data and interactive client state -- the boundary decision is non-trivial for every page.

**Why it happens:**
The App Router mental model ("everything is a server component by default") breaks the moment you need interactivity. The temptation is to put `"use client"` at the page level, which eliminates streaming SSR benefits and causes the entire component tree to ship as client JavaScript. The other failure mode: accidentally importing Prisma or server-only code in a component that was implicitly made a client component by a parent.

**How to avoid:**
- Adopt a strict "leaf node client components" pattern: pages and layouts are always server components. Interactive pieces are small, isolated client components that receive serializable props.
- Create a `components/server/` and `components/client/` directory structure from day one to make the boundary visible in the file system.
- Install and use the `server-only` npm package in any module that touches Prisma, Clerk server auth, or environment secrets. This causes a build error if accidentally imported client-side.
- For the chat interface and question system: server component fetches initial data, passes it as props to a client component that manages the interactive state.

**Warning signs:**
- Bundle size growing unexpectedly (check with `@next/bundle-analyzer`)
- Prisma or `process.env` references appearing in client bundles
- Pages that should stream showing a full loading state instead of progressive rendering
- "Functions cannot be passed directly to Client Components" errors

**Phase to address:**
Phase 1 (Discovery and Knowledge Brain) -- establish the pattern with the question system and dashboard. Every subsequent phase inherits the convention.

---

### Pitfall 2: Prisma Connection Pool Exhaustion on Vercel Serverless

**What goes wrong:**
Each serverless function invocation creates a new Prisma Client instance with its own connection pool. Under moderate concurrent load (5-10 simultaneous users triggering Inngest jobs plus page loads), you exhaust Neon/Supabase's connection limit (typically 20-100 depending on plan). Queries start timing out or failing with "too many clients" errors. This project is especially vulnerable because Inngest jobs, API routes, server components, and server actions ALL create database connections simultaneously.

**Why it happens:**
Prisma's default connection pool is designed for long-running servers, not serverless. Each cold start creates a fresh pool. Neon's serverless driver and Supabase's connection pooler (PgBouncer) exist to solve this, but Prisma needs specific configuration to use them correctly.

**How to avoid:**
- Use a global Prisma Client singleton pattern (`globalThis.__prisma`) that survives across warm invocations in the same container.
- Configure Prisma to use Neon's serverless driver (`@neondatabase/serverless`) with the `@prisma/adapter-neon` adapter, OR use Supabase's PgBouncer endpoint in `transaction` mode.
- Set `connection_limit=1` in the Prisma connection string for serverless functions (each instance needs only one connection when using an external pooler).
- Inngest functions run on Vercel serverless too -- the same singleton plus pooler pattern applies. Do not assume Inngest has a persistent process.
- Add connection monitoring early: log connection counts and add alerts for pool saturation.

**Warning signs:**
- Intermittent `P1001` (can't reach database) or `P1017` (server closed connection) errors
- Queries succeeding locally but failing in production under any load
- Inngest job retries increasing due to database connection failures

**Phase to address:**
Phase 1 -- this must be the first infrastructure decision. The Prisma client singleton and pooler configuration go into the initial project setup before any feature code.

---

### Pitfall 3: Prisma Raw SQL Maintenance Burden for tsvector and pgvector

**What goes wrong:**
Prisma does not natively support `tsvector` columns, `@@` full-text search operators, or pgvector distance operators (`<=>`). Every search query, every embedding comparison, and every tsvector trigger must be raw SQL via `prisma.$queryRaw`. This creates two codebases: Prisma for CRUD, raw SQL for search. The raw SQL queries are not type-checked, not validated at build time, and drift from schema changes silently. The tech spec (Section 8.1) already acknowledges this, but the maintenance burden is commonly underestimated.

**Why it happens:**
Prisma's type system and query builder do not model PostgreSQL-specific extensions. Teams scatter raw SQL across route handlers and server actions because it is "just one query." Over time, a migration that renames a column silently breaks multiple raw SQL queries with no compiler warning.

**How to avoid:**
- Create a dedicated `lib/search/` module that encapsulates ALL raw SQL for search. No raw SQL in route handlers or server actions.
- Build typed wrapper functions: `searchQuestions(projectId, query)` that return typed results and centralize the SQL.
- Write integration tests for every raw SQL query against a real PostgreSQL test database (not SQLite, which does not support these extensions).
- When running Prisma migrations, grep for affected column names in the `lib/search/` directory as part of the migration checklist.
- Use `Unsupported("vector(1536)")` in `schema.prisma` so Prisma acknowledges vector columns exist without trying to manage them. Manage vector columns and tsvector triggers via raw SQL within Prisma migration files (`prisma migrate dev --create-only` to create empty migration, add raw SQL).

**Warning signs:**
- More than 3 files importing `$queryRaw` for vector or search operations
- A schema migration passes but search breaks in production
- No test coverage for search queries
- Raw SQL queries duplicated across files

**Phase to address:**
Phase 1 -- the search infrastructure (tsvector plus pgvector) is a Phase 1 deliverable. The encapsulation pattern must be established here.

---

### Pitfall 4: Inngest Free Tier Event Budget Blown in Development

**What goes wrong:**
The tech spec (Section 7.6.1) projects 50-150 events/day/project in production. During active development with test data, a single debugging session can generate 500+ events (testing transcript processing, embedding generation, notification dispatch). The 5,000 events/month free tier is consumed in the first week of active Phase 1 development, forcing an unplanned upgrade or losing the ability to test background jobs.

**Why it happens:**
Every entity change emits events. Testing the agent harness means processing test transcripts, which creates questions/decisions/requirements, which triggers embedding batches, which triggers article staleness checks, each emitting events. A single transcript test run can generate 20-30 events.

**How to avoid:**
- Use Inngest's local dev server (`npx inngest-cli@latest dev`) for all development. Local events do not count against the cloud tier.
- Add an `INNGEST_ENV` check: in development, use the local dev server URL. Only point to cloud Inngest in staging/production.
- Create a development seeding script that populates data directly (bypassing Inngest events) for testing UI without burning event budget.
- Budget for the Inngest Team tier (~$25/month) from the start of Phase 1 development. Do not plan around the free tier for a project of this complexity.

**Warning signs:**
- Inngest dashboard showing high event consumption during dev
- Background jobs suddenly stop executing (tier limit reached)
- Having to throttle testing to conserve events

**Phase to address:**
Phase 1 setup -- configure local Inngest dev server on day one. Budget decision before any Inngest code is written.

---

### Pitfall 5: Next.js Caching Serving Stale Data After Mutations

**What goes wrong:**
Next.js App Router has aggressive caching by default: `fetch()` in server components is cached, route handler responses may be cached, and the client-side router cache stores server component payloads for 30 seconds (dynamic) or 5 minutes (static). After a user answers a question, creates a story, or processes a transcript, they see stale data because the cache has not been invalidated. In a work management tool, stale data is a trust-destroying bug.

**Why it happens:**
Next.js defaults to caching for performance. The developer must explicitly call `revalidatePath()` or `revalidateTag()` after every mutation. Server Actions handle this somewhat, but route handler mutations, Inngest background job completions (which update data outside the request cycle), and cross-page invalidation are all manual. The caching defaults have changed across Next.js versions, adding to confusion.

**How to avoid:**
- Default to `{ cache: 'no-store' }` or `export const dynamic = 'force-dynamic'` for all data fetches in server components during V1. Performance optimization via caching is a V2 concern. For a small internal team (5-10 users), the performance difference is negligible.
- When using Server Actions for mutations, always call `revalidatePath()` at the end of the action.
- Use `router.refresh()` in client components after mutations to force a server component re-render.
- For background-updated data (Inngest jobs complete, transcript processed): accept that users see updated data on next navigation. Do not try to build real-time push in V1.

**Warning signs:**
- Users reporting "I just did X but the page still shows the old data"
- Having to tell users to "refresh the page" after background operations
- Dashboard showing stale health scores after question resolution

**Phase to address:**
Phase 1 -- establish the caching strategy with the first interactive features (question CRUD, dashboard).

---

### Pitfall 6: Claude API Cost Spiraling Due to Uncontrolled Context Assembly

**What goes wrong:**
The tech spec defines a sophisticated context assembly system (Section 3.3) that pulls knowledge articles, business processes, org components, and conversation history. Without budget controls, a single "answer this question" request can assemble 50K+ tokens of context, costing $0.50-$2.00 per invocation. With multiple team members asking questions, processing transcripts, and generating stories across multiple projects, monthly Claude API costs exceed $500+ unexpectedly.

**Why it happens:**
The context assembly system is designed to be comprehensive ("the AI should know everything about the project"). The temptation is always to include maximum context for best AI output quality. The tech spec has a context window budget strategy (Section 4), but it must be enforced in code, not just documented.

**How to avoid:**
- Implement the token budget limits from Section 4 as hard caps in the context assembly layer, not advisory guidelines. The assembly function must take a `maxTokens` parameter and truncate aggressively.
- Track per-project AI costs in real-time using the SessionLog entity. Display running costs on the project dashboard from Phase 1.
- Set per-project monthly cost alerts (e.g., warn at $50, hard-stop at $100 for V1).
- Use Haiku/fast models for low-stakes tasks (embedding text preparation, question deduplication) and Sonnet/Opus only for high-value tasks (transcript analysis, knowledge synthesis).
- Cache AI responses aggressively: the `cachedBriefingContent` pattern on Project should extend to any AI output that does not change until underlying data changes.
- Hardcode model names in a config constant (`AI_MODELS.TRANSCRIPT_PROCESSING`), never inline in calling code. This enables model swapping without code changes.

**Warning signs:**
- SessionLog entries showing consistently large input token counts (>30K)
- Monthly Claude API bill growing faster than project count
- Same context being assembled repeatedly for similar queries without caching

**Phase to address:**
Phase 1 -- the agent harness and context assembly are Phase 1 deliverables. Token budgets must be enforced from the first AI call.

---

### Pitfall 7: Clerk RBAC Not Enforced at the Data Layer

**What goes wrong:**
Clerk handles authentication (who is this user?) but role-based authorization (can this SA edit this project's questions?) must be implemented in application code. Teams put RBAC checks only in the UI or middleware, then expose unprotected server actions or API routes that bypass those checks. A QA user could call a server action directly and modify stories they should only be able to view.

**Why it happens:**
Clerk middleware can protect routes, but it only knows about authentication -- not about project-level roles stored in ProjectMember. The per-project role model (a user can be SA on Project A and Developer on Project B) means authorization is contextual and cannot be handled by Clerk's built-in roles alone.

**How to avoid:**
- Create a centralized `lib/auth/authorize.ts` module with functions like `requireProjectRole(projectId, userId, allowedRoles[])` that queries ProjectMember.
- Call this authorization function in EVERY server action and API route handler, not just in middleware or UI conditionally.
- Server Actions are the primary mutation path -- each one must start with an auth check before any database operation.
- Write tests that verify unauthorized access returns 403, not just that authorized access works.
- For the REST API consumed by Claude Code: implement API key or token-based auth separate from Clerk session auth. Claude Code sessions do not have Clerk cookies.
- Use `clerkMiddleware()` (not the deprecated `authMiddleware`). Create route matchers with `createRouteMatcher()`.

**Warning signs:**
- Server actions or API routes that do not have an auth check in the first 3 lines
- Authorization logic duplicated across multiple files instead of centralized
- No test for "what happens when a QA user tries to do an SA-only action?"

**Phase to address:**
Phase 1 -- the auth pattern is established with the first protected routes. Every subsequent phase inherits it.

---

### Pitfall 8: Inngest Step Function State Serialization Gotchas

**What goes wrong:**
Inngest step functions checkpoint between steps by serializing step return values. If a step returns non-serializable data (Date objects that become strings, BigInt values that throw, Prisma model instances with circular references), the function fails or produces corrupted data in subsequent steps. The tech spec's step functions (Section 7.4) return complex objects like component arrays and article lists -- these must be serializable.

**Why it happens:**
Developers write step functions like synchronous code, not realizing that each `step.run()` boundary is a serialization/deserialization point. Prisma query results include metadata and potential circular references that do not survive JSON serialization. Inngest also has payload size limits -- passing full transcript text or large arrays of extracted entities between steps can exceed them.

**How to avoid:**
- Always return plain objects from `step.run()` -- never Prisma model instances. Map Prisma results to plain objects (pick only the fields needed by subsequent steps).
- Keep step return values small: return IDs and minimal metadata, not full entity objects. Store intermediate results in the database; subsequent steps re-query by ID.
- Test step functions with Inngest's local dev server, which surfaces serialization errors clearly.
- Watch for Date objects: they serialize to strings and must be re-parsed in subsequent steps if needed as Date instances.

**Warning signs:**
- Step functions failing on the second or third step with serialization errors
- Date values arriving as strings in later steps
- "Cannot serialize" errors in Inngest logs
- Step function payloads exceeding ~256KB

**Phase to address:**
Phase 1 -- transcript processing and embedding generation are the first Inngest step functions. Establish the serialization pattern here.

---

### Pitfall 9: pgvector HNSW Index Performance and Maintenance

**What goes wrong:**
HNSW indexes in pgvector perform well for reads but have write overhead. During bulk embedding operations (brownfield org sync creating thousands of OrgComponent embeddings, or a large transcript creating dozens of entities), INSERT performance degrades as the HNSW index updates. Additionally, using `CREATE INDEX` (without `CONCURRENTLY`) blocks writes to the table during index creation.

**Why it happens:**
Teams create HNSW indexes early and never plan for bulk operations. The index works fine for individual inserts but slows noticeably during batch operations at the scale of brownfield org ingestion.

**How to avoid:**
- Use `CREATE INDEX CONCURRENTLY` for all index operations to avoid blocking writes.
- For V1 scale (hundreds to low thousands of embeddings per project), HNSW is the right choice over IVFFlat (better recall, no training step required). The tech spec already specifies this correctly.
- For bulk embedding operations (Phase 3 org sync): consider temporarily disabling the index, bulk inserting, then rebuilding the index. This is faster than inserting with a live index for large batches.
- Use `ef_construction` and `m` parameters appropriate for the dataset size. Defaults (64 and 16 respectively) are fine for V1 scale.
- Embedding dimension 1536 is correct for OpenAI-compatible embeddings. If using Claude's native embeddings or switching providers, the dimension may change -- the abstraction layer from Pitfall 3 protects against this.

**Warning signs:**
- Semantic search latency increasing over time
- Embedding batch Inngest jobs taking longer than expected
- Query plans showing sequential scans instead of index scans on embedding columns

**Phase to address:**
Phase 1 (search infrastructure setup) -- configure HNSW with `CONCURRENTLY`. Phase 3 (Salesforce org connectivity) will add the bulk of embeddings -- monitor performance then.

---

### Pitfall 10: Solo Developer Scope Creep and Premature Optimization

**What goes wrong:**
A solo developer with a comprehensive 27-section PRD and detailed tech spec builds the "right" architecture for 1,000 users when the V1 audience is 5-10 people at one firm. Weeks are spent on perfect caching strategies, real-time updates, complex permission hierarchies, or optimized database indexes for scale that will not exist for years. Meanwhile, core features (question CRUD, transcript processing, basic dashboard) remain unfinished.

**Why it happens:**
The PRD and tech spec are thorough (intentionally), which creates a false sense that everything documented must be built to spec in V1. A solo developer who is also the architect gravitates toward interesting technical problems (knowledge graph optimization, embedding pipeline tuning) over mundane but essential features (form validation, error states, loading states, empty states).

**How to avoid:**
- Define a ruthless V1 scope for each phase: the minimum set of features that makes the tool usable for one real project. The spec distinguishes V1 from V2 -- respect that boundary.
- Time-box each phase. If a phase is taking longer than 2-3 weeks, cut scope rather than extending the timeline.
- For every technical decision, ask: "Does this matter at 5 users?" If no, defer it. Examples: advanced connection pooling optimization (just set it up correctly once), embedding index tuning (defaults are fine), real-time cache invalidation (page refresh is fine for 5 users).
- Build a walking skeleton first: the entire happy path from project creation through question entry to dashboard display, with minimal AI. Then layer in AI features incrementally.
- Ship to yourself (use the tool on a real consulting project) as early as possible. Real usage reveals what actually matters versus what seemed important in theory.

**Warning signs:**
- Spending more than a day on any single infrastructure concern
- Building features no one has asked for yet
- Optimizing before measuring
- Phase 1 taking more than 3-4 weeks

**Phase to address:**
ALL phases -- this is a continuous discipline. But especially Phase 1, where the temptation to "get the foundation perfect" is strongest.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `db push` instead of `prisma migrate dev` | Faster iteration in dev | No migration history, cannot rollback, production deploys become unpredictable | Only in the first week of schema prototyping. Switch to `migrate dev` before any staging/production deploy. |
| Hardcoding Claude model names in calling code | Quick to write | Cannot swap models without code changes, cannot A/B test | Never. Use a config constant (`AI_MODELS.TRANSCRIPT_PROCESSING = "claude-sonnet-4-20250514"`) from day one. |
| Putting raw SQL inline in route handlers | Fewer files to create | Raw SQL scattered everywhere, impossible to maintain, breaks silently on schema changes | Never. Always in `lib/search/` or `lib/db/` modules. |
| Skipping React error boundaries | Faster page development | One component error crashes the entire page | Only for initial prototyping. Add error boundaries before any user testing. |
| Using `any` types for AI responses | AI output is unpredictable, hard to type | Type safety lost, runtime errors surface in production | V1 MVP only. Add Zod validation schemas for AI output by end of Phase 1. |
| Skipping optimistic UI updates | Simpler state management | Every mutation feels slow (wait for server round-trip) | Acceptable for V1 internal tool with 5-10 users. Revisit only if latency complaints arise. |
| No API rate limiting on REST endpoints | Faster to ship | Runaway Claude Code session or accidental loop hammers the API | Never for the Claude Code REST API. Add basic rate limiting from day one. |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Clerk webhooks | Not verifying webhook signatures, leading to spoofed events | Use `svix` library (Clerk's webhook provider) to verify signatures. Store the webhook secret in environment variables. |
| Clerk middleware | Using deprecated `authMiddleware` instead of `clerkMiddleware` | Use `clerkMiddleware()` with `createRouteMatcher()` for protected routes. Verify against current Clerk docs -- their API changes frequently. |
| Clerk + Prisma user sync | Relying on Clerk session data for user details instead of syncing to local DB | Sync Clerk users to ProjectMember via webhooks on `user.created` / `user.updated`. The local Postgres DB is the source of truth for project-level roles. |
| Salesforce OAuth refresh | Assuming the access token is long-lived | SF access tokens expire (typically 2 hours). Implement refresh token flow in the metadata sync Inngest job. Handle `INVALID_SESSION_ID` errors gracefully with automatic token refresh and retry. |
| Claude API streaming | Not handling partial responses or mid-stream failures | Use Anthropic SDK's built-in streaming helpers. Do not parse partial JSON chunks manually. Handle stream abort gracefully (store partial results, notify user). |
| Claude API rate limits | No retry logic, or retrying immediately without backoff | Use exponential backoff with jitter. The Anthropic SDK has built-in retry -- set `maxRetries` in the client config. For batch operations (transcript processing), add delays between sequential calls. |
| Inngest + Vercel | Deploying without registering functions | Inngest functions must be served via an API route (`/api/inngest`) AND registered with Inngest cloud. The `serve()` function handles this, but you must hit the registration endpoint after each deploy. Verify registration in Inngest dashboard after deploys. |
| Neon serverless | Using Prisma's default connection string format | Neon requires `?sslmode=require` and optionally `?pgbouncer=true` for pooled connections. The Neon dashboard provides the correct connection string format -- use it exactly. |
| S3/R2 file uploads | Exposing bucket URLs to the client | Use presigned URLs generated server-side with short expiry (15 min). Never expose bucket name or direct URLs in client code. Auth-gated API route generates presigned URL on demand. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries in Prisma `include` | Page load times increasing linearly with data | Use `select` instead of `include` where possible. Use Prisma's query logging (`log: ['query']`) to catch N+1 patterns early. Batch with `findMany` plus `in` filters. | >100 related records per query (e.g., project with 100+ questions each with blocking relationships) |
| Missing `projectId` indexes | Dashboard and list queries slow down as data grows | Add explicit `@@index([projectId])` to every model in Prisma schema. Prisma does not auto-create FK indexes on PostgreSQL. | >1,000 rows per table |
| Full entity SELECT on list pages | List pages loading all fields including large text columns | Use Prisma `select` to pick only display fields. Never load `description`, `answerText`, `content`, `embedding` on list views. | >500 list items with large text fields |
| SWR polling overload on dashboard | High API request volume from multiple polling hooks | Use a single consolidated dashboard data endpoint. Set `revalidateOnFocus: false` for non-critical data. Use 30-60 second intervals, not 15 seconds. | >5 concurrent users with multiple dashboard widgets polling |
| Global search UNION ALL across many tables | Search latency increasing as entity types grow | Add per-entity-type result limits within the UNION, not just overall. Consider parallel queries if latency exceeds 500ms. | >10K total rows across searched tables |
| Embedding generation in request path | User waits for embedding API call before seeing their created entity | Embeddings are async via Inngest (already designed correctly in tech spec). Entity is immediately visible via full-text search. Semantic search availability is eventual. | N/A -- already handled correctly |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Salesforce OAuth tokens in API responses | Token theft enables unauthorized SF org access | Implement the `.toJSON()` stripping documented in the tech spec (Section 2.2 Project entity). Never include token fields in Prisma selects unless actively refreshing/using them. |
| Claude API key exposed to client | Attacker racks up AI costs on your account | All Claude API calls must happen server-side (server actions, API routes, Inngest jobs). Never pass the API key to client components. Use `server-only` package in AI modules. |
| REST API for Claude Code without auth | Anyone who discovers the endpoint can read all project data | Implement API key auth for the Claude Code REST API. Store key in Claude Code config, validate on every request. Rate-limit the endpoint aggressively. |
| Unsanitized transcript content fed to AI | Prompt injection via malicious content in uploaded transcripts | Treat AI output as untrusted -- validate and sanitize AI-generated content before storing. Strip obvious prompt injection patterns from input. More importantly, never execute AI-suggested actions without human review. |
| Project data isolation failure | User on Project A sees data from Project B | Every database query MUST filter by `projectId`. Create a query wrapper or Prisma middleware that automatically scopes to current project context. Test cross-project isolation explicitly. |
| Encryption key in code or logs | All Salesforce tokens compromised | Load `SF_TOKEN_ENCRYPTION_KEY` from environment only. Never log, never include in error traces. Use the HKDF-derived per-project key pattern from the tech spec. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading states for AI operations | User clicks "Process Transcript" and stares at a frozen UI for 30-120 seconds | Show immediate acknowledgment ("Processing started"), then progress indication. Poll Inngest job status or use optimistic UI patterns. |
| AI confidence scores without explanation | User sees "85% confidence" but does not know what that means | Show confidence as a category (High/Medium/Low) with tooltip explaining what it means for that entity type. Use the `needsReview` flag prominently. |
| Dashboard data not timestamped | User does not know if health score is 5 minutes or 5 hours old | Always show "Last updated: X minutes ago" on cached/synthesized data. The `cachedBriefingGeneratedAt` field exists in the schema -- display it. |
| Overwhelming notification volume | Users start ignoring all notifications because most are noise | Default to batched notifications for non-critical events. Let users configure notification preferences per event type. |
| Question/Decision forms too complex upfront | BA spends more time filling out metadata than capturing insights | Start with minimal required fields (text, category). Let AI suggest priority, affected epics, and blocking relationships. Use progressive disclosure for advanced fields. |
| Empty states that look broken | New project with no data shows blank pages | Design meaningful empty states: "No questions yet. Upload a transcript or add your first question." for every list view. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Question CRUD:** Often missing -- search/filter on the list view, pagination for >50 items, bulk status updates, empty state for new projects. Verify all status transitions work for all roles.
- [ ] **Transcript processing:** Often missing -- error handling for malformed transcripts, progress indication during processing, duplicate detection against existing questions. Verify the user can review and reject AI-extracted items before they are committed.
- [ ] **Dashboard:** Often missing -- empty states (new project with zero data), loading states for AI-synthesized sections, stale data indicators, error recovery when AI synthesis fails. Verify it does not error on a project with zero questions/stories.
- [ ] **Auth/RBAC:** Often missing -- testing with ALL five roles (SA, PM, BA, Developer, QA). Verify QA cannot access SA-only features. Verify a user removed from a project loses access immediately. Test the REST API auth separately from Clerk session auth.
- [ ] **Search:** Often missing -- handling of empty results gracefully, special character handling in queries, performance with long query strings. Verify semantic search degrades gracefully when embeddings are still pending.
- [ ] **AI chat:** Often missing -- conversation history windowing for long threads, error recovery when Claude API fails mid-stream, cost display per conversation, token limit enforcement. Verify conversations persist across page reloads.
- [ ] **Inngest jobs:** Often missing -- monitoring for job health, handling permanently failed jobs, manual retry capability, alerting when jobs are stuck. Verify jobs handle database temporarily unavailable.
- [ ] **File upload (transcripts):** Often missing -- file size limits enforced, file type validation, upload progress indication, graceful handling of very large files. Verify the upload path does not expose the S3/R2 bucket URL.
- [ ] **Error states:** Often missing -- what happens when the Claude API is down? When Neon is unreachable? When Inngest is unavailable? Each external dependency needs a graceful degradation path.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Connection pool exhaustion | LOW | Add pooler config to connection string, redeploy. No data loss. Immediate fix. |
| Stale cache serving wrong data | LOW | Add `revalidatePath()` calls to all mutations. Deploy. Users refresh once. |
| Raw SQL broken by migration | MEDIUM | Fix SQL queries in `lib/search/`, re-test against Postgres. May require emergency deploy if search is broken in production. |
| RBAC bypass discovered | MEDIUM | Audit all server actions and API routes for auth checks. Add centralized authorization middleware. Security review needed. |
| Claude API cost overrun | MEDIUM | Implement token budgets retroactively. Review and reduce context assembly. Set billing alerts on Anthropic dashboard immediately. |
| Inngest tier limit hit | LOW | Upgrade to paid tier (~$25/month). Switch to local dev server for development. Immediate fix. |
| N+1 queries causing slow pages | MEDIUM | Enable query logging, identify hot paths, refactor to use `select` and batch queries. May require significant refactoring if `include` is used pervasively. |
| Server/client boundary wrong (large client bundles) | HIGH | Refactoring component tree to push `"use client"` to leaf nodes is a significant rewrite if done late. Must establish pattern early to avoid this. |
| Scope creep (Phase 1 takes 2+ months) | HIGH | Stop building. Cut scope ruthlessly. Ship what exists. Use it on a real project. Let real usage drive priority, not the PRD. |
| Prisma migration drift with raw SQL | MEDIUM | Run `prisma migrate diff` to identify drift. Create corrective migration. Verify all raw SQL modules against current schema. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Server/client boundary confusion | Phase 1 (initial setup) | Bundle analysis shows reasonable client JS size; no Prisma in client bundles |
| Connection pool exhaustion | Phase 1 (initial setup) | 10 concurrent requests succeed without connection errors in staging |
| Raw SQL maintenance burden | Phase 1 (search infrastructure) | All raw SQL in `lib/search/`; integration tests pass against real Postgres |
| Inngest free tier blown | Phase 1 (initial setup) | Local dev server configured; cloud events tracked |
| Stale cache after mutations | Phase 1 (question CRUD) | Creating/updating a question shows new data immediately without manual refresh |
| Claude API cost spiral | Phase 1 (agent harness) | Token budgets enforced as hard caps; per-project costs visible on dashboard |
| Clerk RBAC at data layer | Phase 1 (auth setup) | Unauthorized access test returns 403 for all server actions and API routes |
| Inngest serialization | Phase 1 (transcript processing) | Step functions pass data correctly across checkpoints using IDs, not full objects |
| pgvector HNSW performance | Phase 1 (search) + Phase 3 (org sync) | HNSW index created with CONCURRENTLY; semantic search <200ms |
| Solo dev scope creep | ALL phases | Each phase ships within 2-3 weeks; working software on a real project by end of Phase 1 |
| N+1 Prisma queries | Phase 1 (first list views) | Query logging enabled; no page producing >10 SQL statements per load |
| Prisma migration discipline | Phase 1 (schema setup) | Using `prisma migrate dev` (not `db push`) from first staging deploy onward |
| SF OAuth token security | Phase 3 (org connectivity) | Tokens never appear in API responses, logs, or error traces |
| REST API auth for Claude Code | Phase 3 (developer integration) | API endpoint rejects requests without valid API key |
| Zod/Tailwind version compat | Phase 1 (initial setup) | Full dependency tree installs without peer dependency warnings |
| SWR polling overload | Phase 1 (dashboard) | Dashboard makes <5 API requests per 30-second interval per user |

## Sources

- Next.js App Router documentation: caching behavior, server/client component model, `revalidatePath` patterns
- Prisma documentation: connection pooling in serverless environments, raw query patterns, migration workflows
- Inngest documentation: step function serialization, concurrency configuration, event limits, local dev server setup
- pgvector GitHub repository: HNSW vs IVFFlat tradeoffs, `CREATE INDEX CONCURRENTLY`, index maintenance
- Anthropic Claude API documentation: rate limits, token counting, streaming, SDK retry configuration
- Clerk documentation: `clerkMiddleware` (replacing deprecated `authMiddleware`), webhook verification via Svix, RBAC patterns
- Neon documentation: serverless driver for Prisma, connection string format, pooled endpoints
- Project tech spec (SESSION-3-TECHNICAL-SPEC.md): context assembly budgets (Section 4), Inngest tier planning (Section 7.6.1), search infrastructure (Section 8), token encryption strategy (Section 2.2)
- Confidence: HIGH for patterns from official documentation and widely reported community experience. MEDIUM for version-specific claims (Zod 4 compat, Tailwind v4 with shadcn/ui) that may have been resolved by April 2026.

---
*Pitfalls research for: Salesforce Consulting AI Framework*
*Researched: 2026-04-04*
