# Architecture Research

**Domain:** AI-powered project management system with knowledge base for Salesforce consulting
**Researched:** 2026-04-04
**Confidence:** MEDIUM-HIGH (based on spec analysis and training data; no live web verification available)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Dashboard    │  │  Project     │  │  Chat        │                  │
│  │  Pages (RSC)  │  │  Management  │  │  Interface   │                  │
│  │              │  │  Pages (RSC)  │  │  (Client)    │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                  │                          │
├─────────┴─────────────────┴──────────────────┴──────────────────────────┤
│                        Application Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Server       │  │  API Routes  │  │  AI Agent    │                  │
│  │  Actions      │  │  (REST for   │  │  Harness     │                  │
│  │  (mutations)  │  │  Claude Code) │  │  (3-layer)   │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                  │                          │
├─────────┴─────────────────┴──────────────────┴──────────────────────────┤
│                        Domain Services Layer                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ Knowledge  │ │ Discovery  │ │ Sprint     │ │ Org        │           │
│  │ Service    │ │ Service    │ │ Service    │ │ Service    │           │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘           │
│        │              │              │              │                   │
├────────┴──────────────┴──────────────┴──────────────┴───────────────────┤
│                        Data & Infrastructure Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Postgres │  │ S3/R2    │  │ Inngest  │  │ Claude   │               │
│  │ (Prisma) │  │ (Files)  │  │ (Jobs)   │  │ API      │               │
│  │ +pgvector│  │          │  │          │  │          │               │
│  │ +tsvector│  │          │  │          │  │          │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────────────────────┘

External Boundary:
┌──────────────────────────────────────────────┐
│  Claude Code Skills (developer machines)      │
│  Consumes REST API for context packages,      │
│  org queries, status updates                  │
└──────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Dashboard Pages | Read-heavy views: discovery dashboard, sprint dashboard, PM dashboard | Next.js RSC with parallel data fetching, cached AI narratives |
| Project Management Pages | CRUD for projects, epics, features, stories, questions, sprints | RSC for reads, Server Actions for mutations |
| Chat Interface | Real-time conversational AI, task sessions, general project chat | Client component with streaming, `useOptimistic` for message UX |
| Server Actions | All write operations from web UI | Colocated with page routes or in shared action modules |
| REST API Routes | External integration surface for Claude Code skills | Route handlers in `/api/` with API key auth, rate limiting |
| AI Agent Harness | Orchestrates all AI interactions across 11 task types | Three-layer: Task Definitions > Execution Engine > Context Assembly |
| Knowledge Service | Article lifecycle, staleness detection, two-pass retrieval | Domain module managing KnowledgeArticle + BusinessProcess |
| Discovery Service | Questions, decisions, requirements, risks, transcript processing | Domain module with cross-entity impact assessment |
| Sprint Service | Sprint management, conflict detection, dependency ordering | Domain module querying StoryComponent overlaps |
| Org Service | SF metadata sync, component parsing, domain grouping | Domain module + Inngest jobs for async sync |
| Prisma/Postgres | All structured data, full-text search, vector embeddings | Single DB with pgvector + tsvector extensions |
| Inngest | All async work: embedding gen, article refresh, sync, notifications | Event-driven step functions on Vercel serverless |
| Claude API | All AI inference: transcript processing, generation, synthesis | Single provider module, no abstraction in V1 |
| S3/R2 | Generated documents, uploaded attachments, branding assets | Direct upload/download with presigned URLs |

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-gated layout group
│   │   ├── projects/
│   │   │   ├── [projectId]/
│   │   │   │   ├── page.tsx              # Project overview/dashboard
│   │   │   │   ├── discovery/
│   │   │   │   │   ├── page.tsx          # Discovery dashboard
│   │   │   │   │   ├── questions/
│   │   │   │   │   ├── transcripts/
│   │   │   │   │   └── decisions/
│   │   │   │   ├── stories/
│   │   │   │   │   ├── page.tsx          # Story board/list
│   │   │   │   │   └── [storyId]/
│   │   │   │   ├── sprints/
│   │   │   │   ├── org/                  # Org knowledge views
│   │   │   │   ├── chat/                 # Chat interface
│   │   │   │   ├── documents/
│   │   │   │   ├── settings/
│   │   │   │   └── layout.tsx            # Project-scoped layout with nav
│   │   │   └── page.tsx                  # Project list
│   │   └── layout.tsx                    # Authenticated layout
│   ├── api/                      # REST API for Claude Code
│   │   └── projects/
│   │       └── [projectId]/
│   │           ├── context-package/
│   │           ├── org/
│   │           ├── stories/
│   │           └── summary/
│   ├── inngest/                  # Inngest route handler
│   │   └── route.ts             # Serves all Inngest functions
│   └── layout.tsx               # Root layout
│
├── lib/                          # Shared business logic
│   ├── ai/                       # AI Agent Harness
│   │   ├── harness/
│   │   │   ├── engine.ts         # Execution engine (the loop)
│   │   │   ├── types.ts          # TaskDefinition, ProjectContext, etc.
│   │   │   └── validator.ts      # Output validation helpers
│   │   ├── tasks/                # Task definitions (one file per task type)
│   │   │   ├── transcript-processing.ts
│   │   │   ├── question-answering.ts
│   │   │   ├── story-generation.ts
│   │   │   ├── briefing-generation.ts
│   │   │   ├── context-package-assembly.ts
│   │   │   └── ...
│   │   ├── context/              # Context assembly layer (Layer 3)
│   │   │   ├── loaders.ts        # getProjectSummary, getEpicContext, etc.
│   │   │   ├── knowledge.ts      # getRelevantArticles, getArticleSummaries
│   │   │   └── formatters.ts     # Context -> prompt string formatters
│   │   ├── tools/                # Claude tool definitions + handlers
│   │   │   ├── question-tools.ts
│   │   │   ├── story-tools.ts
│   │   │   ├── decision-tools.ts
│   │   │   └── ...
│   │   └── client.ts             # Claude API client wrapper
│   │
│   ├── services/                 # Domain service modules
│   │   ├── knowledge/            # Knowledge article lifecycle
│   │   ├── discovery/            # Questions, decisions, requirements
│   │   ├── sprint/               # Sprint management, conflict detection
│   │   ├── org/                  # SF org sync, metadata parsing
│   │   ├── search/               # Global search (full-text + semantic)
│   │   ├── notification/         # Notification dispatch
│   │   └── auth/                 # Clerk integration, RBAC helpers
│   │
│   ├── inngest/                  # Inngest function definitions
│   │   ├── client.ts             # Inngest client instance
│   │   ├── functions/
│   │   │   ├── article-refresh.ts
│   │   │   ├── dashboard-synthesis.ts
│   │   │   ├── embedding-batch.ts
│   │   │   ├── transcript-processing.ts
│   │   │   ├── metadata-sync.ts
│   │   │   ├── knowledge-refresh.ts
│   │   │   └── notification-dispatch.ts
│   │   └── events.ts             # Event type definitions
│   │
│   ├── db/                       # Database utilities
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── encryption.ts         # HKDF per-project key derivation
│   │   └── migrations/           # Raw SQL for tsvector triggers, pgvector
│   │
│   └── utils/                    # Shared utilities
│       ├── rate-limit.ts         # Postgres-backed sliding window
│       ├── token-budget.ts       # Context window budget helpers
│       └── id-generation.ts      # Display ID generators (Q-FM-001, etc.)
│
├── components/                   # React components
│   ├── ui/                       # Base UI components (shadcn/ui)
│   ├── dashboard/                # Dashboard-specific components
│   ├── discovery/                # Question, transcript, decision UI
│   ├── stories/                  # Epic, feature, story management UI
│   ├── chat/                     # Chat interface components
│   ├── sprint/                   # Sprint board, burndown
│   └── shared/                   # Layout, navigation, search
│
└── prisma/
    ├── schema.prisma             # Full Prisma schema
    └── seed.ts                   # Seed data (firm rules, default configs)
```

### Structure Rationale

- **`lib/ai/` as a standalone module:** The AI harness is the most complex subsystem. Separating it from route handlers keeps it testable and creates the clean module boundary the PRD requires for a future provider swap. The three subdirectories (harness, tasks, context) mirror the three-layer architecture.
- **`lib/services/` for domain logic:** Business logic lives in service modules, not in Server Actions or API routes. Both Server Actions and API Routes call the same service functions, preventing logic duplication between the web UI path and the Claude Code REST path.
- **`lib/inngest/` separate from services:** Inngest functions are infrastructure glue -- they subscribe to events and call service functions. Keeping them separate makes it clear which code runs synchronously (services) vs. asynchronously (Inngest handlers).
- **Route groups `(auth)/`:** Next.js route groups for authenticated vs. public layouts. The entire app is auth-gated except the sign-in page.
- **`components/` by domain:** Components grouped by feature area rather than by type (atoms/molecules/organisms) because this app has distinct feature domains with minimal cross-domain component sharing.

## Architectural Patterns

### Pattern 1: Server Components for Data-Heavy Pages, Client Components for Interactivity

**What:** Default to React Server Components (RSC) for all pages that primarily display data. Use client components only where interactivity is required: chat interface, form inputs, optimistic updates, real-time polling.

**When to use:** Every page in this app. The discovery dashboard, sprint board, story detail views, and org knowledge views are all read-heavy and benefit from RSC's zero-JS-bundle data fetching.

**Trade-offs:** RSC cannot use hooks or browser APIs. Any interactive element (search input, status dropdowns, drag-and-drop sprint board) must be isolated into a client component and composed into the RSC page. This "islands of interactivity" pattern is ideal for this app because most pages are 80% data display and 20% interaction.

**Example:**
```typescript
// app/(auth)/projects/[projectId]/discovery/page.tsx (Server Component)
import { getDiscoveryDashboard } from '@/lib/services/discovery';
import { QuestionFilters } from '@/components/discovery/question-filters'; // Client
import { QuestionList } from '@/components/discovery/question-list'; // Server

export default async function DiscoveryPage({ params }: { params: { projectId: string } }) {
  const data = await getDiscoveryDashboard(params.projectId);
  return (
    <div>
      <DashboardMetrics data={data.metrics} />
      <QuestionFilters /> {/* Client: manages filter state */}
      <Suspense fallback={<QuestionListSkeleton />}>
        <QuestionList projectId={params.projectId} />
      </Suspense>
    </div>
  );
}
```

### Pattern 2: Server Actions for Mutations with Optimistic Updates

**What:** Use Next.js Server Actions for all write operations from the web UI. Pair with `useOptimistic` on the client for immediate feedback. Server Actions validate, write to DB, emit Inngest events, then revalidate.

**When to use:** Every form submission and status change in the web UI. Do NOT use API routes for web UI mutations -- Server Actions provide type safety, automatic revalidation, and progressive enhancement.

**Trade-offs:** Server Actions cannot be called from external clients (Claude Code). The REST API routes exist exclusively for the Claude Code integration. This creates two paths to the same service layer, which is intentional -- Server Actions handle web UI mutations; API routes handle external integrations.

**Example:**
```typescript
// lib/actions/questions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { inngest } from '@/lib/inngest/client';

export async function answerQuestion(questionId: string, formData: FormData) {
  const answer = formData.get('answer') as string;
  // Validate, authorize, write to DB via service
  const updated = await questionService.answer(questionId, answer, getCurrentUser());
  // Emit events for downstream effects
  await inngest.send({
    name: 'project.state-changed',
    data: { projectId: updated.projectId, changeType: 'QUESTION_ANSWERED', entityType: 'Question', entityId: questionId },
  });
  revalidatePath(`/projects/${updated.projectId}/discovery`);
}
```

### Pattern 3: Event-Driven Side Effects via Inngest

**What:** All side effects (article staleness, dashboard cache invalidation, embedding generation, notifications) are triggered by Inngest events, not by direct function calls in the mutation path. The write path is: validate > write to DB > emit event > return. Side effects happen asynchronously.

**When to use:** Every time a state change has downstream consequences. Answering a question triggers article staleness checks, dashboard cache refresh, and notifications -- but the user sees immediate success, not a 10-second wait.

**Trade-offs:** Eventual consistency. The dashboard narrative might be 30 seconds stale after a question is answered. For this app, that is acceptable -- the quantitative dashboard metrics (counts, blocking status) update instantly from DB queries; only the AI-synthesized narrative is eventually consistent.

**Example:**
```typescript
// Mutation writes to DB, emits event, returns immediately
await prisma.question.update({ where: { id }, data: { status: 'ANSWERED', answerText } });
await inngest.send({ name: 'project.state-changed', data: { ... } });
// Return to user -- done in <200ms

// Inngest handler picks up event asynchronously
const dashboardSynthesis = inngest.createFunction(
  { id: 'dashboard-synthesis', concurrency: { limit: 1, scope: 'env', key: 'event.data.projectId' } },
  { event: 'project.state-changed' },
  async ({ event, step }) => {
    // Regenerate AI narrative, update cached content
    // This takes 5-15s but user is not waiting
  }
);
```

### Pattern 4: Three-Layer AI Agent Harness

**What:** All AI interactions follow a strict three-layer pattern: Task Definition (config) > Execution Engine (loop) > Context Assembly (queries). No AI call bypasses this structure.

**When to use:** Every AI interaction in the app, from transcript processing to story enrichment to briefing generation.

**Trade-offs:** More boilerplate per task type (each needs a task definition file). But the benefit is enormous: consistent token tracking, rate limiting, session logging, error handling, and output validation across all 11 task types. Adding a new task type requires only writing a new task definition file and a context loader -- the engine and infrastructure are reusable.

### Pattern 5: Two-Pass Context Retrieval for Knowledge Articles

**What:** When the AI needs knowledge context, first load article summaries (one line each, ~50 tokens per article), then load full content only for the top-N most relevant articles. This prevents loading 20 full articles (potentially 40K+ tokens) when only 3 are relevant.

**When to use:** Any task type that loads knowledge articles -- story generation, context package assembly, question answering, briefing generation.

**Trade-offs:** Two database queries instead of one. But the token savings are massive: loading summaries for 20 articles costs ~1K tokens; loading full content for 3 costs ~3-5K tokens. Without two-pass, loading all 20 full articles would cost 30-40K tokens and likely exceed the task's context budget.

## Data Flow

### Request Flow (Web UI Mutation)

```
[User Action: Answer Question]
    |
    v
[Server Action] --> [Auth Check (Clerk)] --> [Service Layer]
    |                                             |
    |                                             v
    |                                    [Prisma: Write to DB]
    |                                             |
    |                                             v
    |                                    [Emit Inngest Event]
    |                                             |
    v                                             v
[revalidatePath]                         [Async Side Effects]
    |                                    - flagStaleArticles
    v                                    - dashboard synthesis
[RSC Re-render with fresh data]          - notification dispatch
                                         - embedding regen
```

### Request Flow (Claude Code REST API)

```
[Claude Code Skill: GET /api/projects/:id/context-package/:storyId]
    |
    v
[API Route] --> [API Key Auth + Rate Limit]
    |
    v
[Context Package Assembly Service]
    |
    v
[Context Assembly Layer (7 parallel queries)]
    |
    ├── getStoryWithContext(storyId)
    ├── getStoryOrgComponents(storyId)
    ├── getOverlappingStories(storyId)
    ├── getDecisionsForStory(storyId)
    ├── getAnsweredQuestionsForStory(storyId)
    ├── getBusinessProcessForStory(storyId)
    └── getRelevantArticles(projectId, { storyId, limit: 3 })
    |
    v
[Formatted Context Package JSON Response]
```

### AI Agent Harness Flow

```
[User triggers AI task (e.g., "Process Transcript")]
    |
    v
[Task Definition lookup by taskType]
    |
    v
[Context Loader: parallel DB queries scoped to task needs]
    |
    v
[System Prompt Assembly: template + context + firm rules]
    |
    v
[Claude API Call (prompt + tools + user input)]
    |
    +---> [tool_use response?]
    |         |
    |         v
    |     [Execute tool (DB write via Prisma)]
    |     [Track entity in EntityTracking]
    |         |
    |         v
    |     [Return tool result to Claude, loop back]
    |
    +---> [text response (final)]
              |
              v
         [Output Validator]
              |
              +---> [Invalid? Re-prompt with corrections (up to maxRetries)]
              |
              +---> [Valid]
                        |
                        v
                   [flagStaleArticles (check modified entities)]
                   [Emit embedding.batch-requested for new/modified entities]
                   [Write SessionLog (tokens, cost, entities created/modified)]
                        |
                        v
                   [Return result to frontend]
```

### Key Data Flows

1. **Discovery-to-Knowledge pipeline:** Transcript upload > AI extraction (questions, decisions, requirements) > entity creation in DB > article staleness detection > background article refresh > updated knowledge base. This is the primary knowledge accumulation path.

2. **Knowledge-to-Developer pipeline:** Developer picks up story > Claude Code calls context package API > 7-query parallel assembly including business processes and knowledge articles > formatted context delivered. This is the primary knowledge consumption path.

3. **State-change cascade:** Any entity mutation > Inngest event > parallel side effects (staleness check, dashboard refresh, notifications, embedding regen). This ensures the knowledge base stays current without blocking the user.

4. **Embedding lifecycle:** Entity created/modified > entity IDs tracked in EntityTracking > batch event emitted at end of harness run > Inngest handler generates embeddings in batches of 50 > embeddingStatus set to GENERATED > entity now discoverable via semantic search.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-5 projects (Month 1-3) | No adjustments. Inngest free tier, Vercel hobby/pro, single Neon DB. Total cost <$50/month excluding AI API. |
| 5-15 projects (Month 3-6) | Inngest paid tier required (~$25/month). Monitor Vercel serverless execution time. Consider Neon auto-scaling. Add connection pooling if not already enabled. |
| 15-30 projects (Month 6-12) | Inngest Pro tier. Vercel Pro for longer function timeouts (5min vs 1min). pgvector HNSW indexes become important as article count grows past 500. Consider Vercel KV (Redis) for context package caching. |
| 30+ projects (Year 2+) | V2 architecture: dedicated worker tier (Railway/Fly.io + BullMQ + Redis) for background jobs. Connection pooler (PgBouncer) required. Consider read replicas for dashboard queries. |

### Scaling Priorities

1. **First bottleneck: Inngest event volume.** At 3+ active projects, you will exceed the free tier. Budget for this from day one. The tier jump is small ($25/month) but the failure mode (events silently dropped) is dangerous.

2. **Second bottleneck: Vercel serverless timeout.** Default is 60 seconds on hobby, 300 seconds on Pro. Transcript processing and org ingestion can exceed 60 seconds. You will need Vercel Pro or restructure long-running tasks into smaller Inngest steps that each complete within the timeout.

3. **Third bottleneck: pgvector query performance.** With <500 articles, brute-force cosine similarity is fine. Beyond 500, HNSW indexes are essential. The tech spec already specifies HNSW -- just ensure the index is created during initial migration, not deferred.

4. **Fourth bottleneck: Neon cold starts.** Neon serverless can have ~500ms cold starts on the free tier. For the context package API (developer-facing, latency-sensitive), this matters. Neon's "always-on" compute option eliminates this but costs more.

## Anti-Patterns

### Anti-Pattern 1: Fat Server Actions

**What people do:** Put business logic, validation, authorization, DB writes, event emission, and revalidation all inline in a Server Action function.
**Why it's wrong:** Server Actions become untestable, unreusable, and duplicated when the same logic is needed from an API route (Claude Code path).
**Do this instead:** Server Actions should be thin -- auth check, call service function, emit event, revalidate. All business logic lives in `lib/services/`.

### Anti-Pattern 2: Synchronous Side Effects in the Write Path

**What people do:** After writing to the DB, immediately call `flagStaleArticles()`, regenerate embeddings, refresh the dashboard cache, and send notifications before returning to the user.
**Why it's wrong:** A single question answer would take 10-30 seconds instead of 200ms. Users abandon or double-click.
**Do this instead:** Write to DB, emit one Inngest event, return immediately. All side effects are async.

### Anti-Pattern 3: Loading All Context for Every AI Task

**What people do:** Create one "getFullProjectContext" function and call it for every task type, because it is simpler than writing scoped loaders.
**Why it's wrong:** A briefing needs 22-34K tokens of context. A question-answering task needs 9-15K. Loading 34K tokens when you need 9K wastes money ($0.003 per 1K input tokens adds up across hundreds of daily invocations) and degrades AI response quality (irrelevant context confuses the model).
**Do this instead:** Each task type has its own context loader that fetches exactly what it needs. The context assembly functions are reusable building blocks composed differently per task.

### Anti-Pattern 4: Polling for Real-Time Updates

**What people do:** Set up client-side polling every 2 seconds to check for new notifications, dashboard changes, or chat messages.
**Why it's wrong:** At 30 projects with 150 users, that is 75 requests/second just for polling. Vercel bills per invocation.
**Do this instead:** V1 uses conservative polling (30-second intervals for dashboards, 5-second intervals for chat only when the chat panel is open). Revalidation via Server Actions handles most freshness needs. V2 can add WebSocket or server-sent events if polling becomes expensive.

### Anti-Pattern 5: Embedding Generation in the Hot Path

**What people do:** Generate embeddings synchronously when creating an entity, before returning to the user.
**Why it's wrong:** Embedding API calls add 200-500ms per entity. Transcript processing creates 5-15 entities. That is 1-7 seconds of additional latency in the user's critical path.
**Do this instead:** Track entity IDs during the harness run, emit one batch event at the end, generate embeddings asynchronously. Entities are immediately searchable via full-text (tsvector); semantic search becomes available within seconds when the async job completes.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude API (Anthropic) | Direct SDK calls from AI harness execution engine | Single module `lib/ai/client.ts`. All calls go through harness -- never call Claude directly from routes. Token tracking via SessionLog. |
| Clerk | Middleware + `auth()` helper in Server Components/Actions | Clerk handles all auth. RBAC via `ProjectMember.role`. No custom JWT or session management. |
| Salesforce Org | OAuth 2.0 (web server flow) + SF CLI-style metadata API calls | Credentials encrypted per-project with HKDF. Periodic sync via Inngest cron, not real-time. |
| Inngest | Event emission from services + function definitions served via `/api/inngest` route | All async work. Uses Inngest's built-in concurrency controls. Step functions for long-running jobs. |
| S3/R2 | Presigned URLs for upload/download | Generated documents and attachments. No direct S3 access from client -- presigned URLs issued by server. |
| Neon PostgreSQL | Prisma ORM with connection pooling | Use Neon's serverless driver for Vercel edge compatibility if needed. Prefer standard Prisma connection for Server Actions/API routes. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Web UI <-> Service Layer | Server Actions (direct function calls) | Type-safe, no serialization overhead. Server Actions call service functions directly. |
| Claude Code <-> Service Layer | REST API routes with API key auth | Separate auth path (API keys, not Clerk sessions). Rate limited. Same service functions as Server Actions. |
| Service Layer <-> AI Harness | Direct function calls (`executeTask(taskDefinition, input, projectId)`) | Harness is a library module, not a separate service. No HTTP boundary. |
| Service Layer <-> Inngest | Event emission (fire-and-forget) | Services emit events via `inngest.send()`. Inngest handlers call service functions for the actual work. Loose coupling. |
| AI Harness <-> Claude API | HTTP (Anthropic SDK) | Single external HTTP boundary for AI. All other AI interactions are in-process. |
| Inngest Functions <-> Service Layer | Direct function calls within the same Vercel runtime | Inngest functions import and call service modules. No HTTP boundary. Same DB connection. |

## Build Order Implications

The architecture has clear dependency chains that dictate build order:

### Foundation (must be first)
1. **Prisma schema + DB migrations** -- everything depends on the data model
2. **Clerk auth + RBAC middleware** -- everything depends on auth
3. **Inngest client + route handler** -- background jobs needed by Phase 1 features
4. **AI harness execution engine** -- needed before any task type can be built

### Phase 1 Dependencies
5. **Context assembly layer (Layer 3)** -- reusable query functions needed by all task types
6. **Task definitions for transcript processing + question answering** -- first two task types
7. **Search infrastructure (tsvector + pgvector setup)** -- needed for semantic retrieval in context assembly
8. **Embedding batch job** -- needed for semantic search to function
9. **Notification system** -- needed for question lifecycle events
10. **Discovery dashboard** -- consumes all of the above

### Phase 2 Dependencies
11. **Epic/feature/story CRUD** -- depends on schema + auth
12. **Story generation task definition** -- depends on harness + context assembly
13. **Sprint management + conflict detection** -- depends on StoryComponent data
14. **Sprint dashboard** -- consumes sprint service

### Phase 3 Dependencies
15. **SF OAuth + metadata sync** -- depends on Inngest + Prisma
16. **Org ingestion pipeline (4 phases)** -- depends on metadata sync + AI harness
17. **REST API routes** -- depends on service layer + auth (API keys)
18. **Context package assembly** -- depends on all prior services being functional

### Phase 4 Dependencies
19. **Document generation** -- depends on service layer + S3 integration
20. **QA workflow** -- depends on story management
21. **PM dashboard** -- depends on all prior phases for data

**Critical path:** Items 1-4 (foundation) block everything. Within Phase 1, the AI harness engine (item 4) is the highest-risk item because it is the most architecturally novel component. Build and validate it early with the transcript processing task type before adding other task types.

## Sources

- SF-Consulting-AI-Framework-PRD-v2.3.md (Sections 5, 6, 12, 25, 26)
- SESSION-3-TECHNICAL-SPEC.md (Sections 3, 4, 7, 8)
- Next.js App Router documentation (server components, server actions, route handlers)
- Inngest documentation (step functions, concurrency, event-driven patterns)
- pgvector documentation (HNSW indexes, cosine similarity)
- Prisma documentation (client generation, raw SQL for tsvector/pgvector)

**Confidence notes:**
- Architecture patterns validated against both spec documents (HIGH confidence)
- Project structure based on Next.js App Router conventions and spec requirements (HIGH confidence)
- Scaling thresholds based on Inngest tier documentation and Vercel limits from training data (MEDIUM confidence -- verify current pricing/limits)
- pgvector HNSW performance thresholds from training data (MEDIUM confidence -- verify with current benchmarks)

---
*Architecture research for: AI-powered Salesforce consulting work management platform*
*Researched: 2026-04-04*
