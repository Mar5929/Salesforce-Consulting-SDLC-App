---
phase: 02-discovery-and-knowledge-brain
plan: 07
subsystem: search
tags: [tsvector, pgvector, voyage-ai, embeddings, command-palette, inngest, full-text-search, semantic-search]

requires:
  - phase: 02-04
    provides: question system with display IDs, question server actions
  - phase: 02-06
    provides: knowledge articles, staleness badges, article server actions
provides:
  - Three-layer global search function (filtered + full-text + semantic)
  - Voyage AI embedding wrapper with batch support and graceful fallback
  - Cmd+K command palette with grouped results, recent items, and quick actions
  - Inngest embedding batch function for async embedding generation
  - tsvector SQL migration with GIN indexes and auto-populating triggers
  - Vector dimension migration (1536 -> 1024) with HNSW indexes
  - Search server action with project membership validation
affects: [02-08 (dashboard), 02-09 (notifications)]

tech-stack:
  added: []
  patterns:
    - "Three-layer search: filtered (Prisma where) + full-text (tsvector $queryRaw) + semantic (pgvector cosine similarity)"
    - "Manual SQL migrations for tsvector/pgvector features outside Prisma schema"
    - "Voyage AI REST API for embeddings with graceful null-return fallback"
    - "Cmd+K global shortcut with debounced search and localStorage recent items"
    - "Separate raw SQL per entity type to avoid dynamic table names (T-02-24)"

key-files:
  created:
    - prisma/migrations/tsvector-setup.sql
    - prisma/migrations/vector-dimension-1024.sql
    - src/lib/search/embeddings.ts
    - src/lib/search/global-search.ts
    - src/actions/search.ts
    - src/components/search/command-palette.tsx
    - src/components/ui/command.tsx
    - src/lib/inngest/functions/embedding-batch.ts
  modified:
    - prisma/schema.prisma
    - src/env.ts
    - src/app/api/inngest/route.ts
    - src/components/layout/app-shell.tsx

key-decisions:
  - "Inline Command UI component built following shadcn/cmdk API contract since node_modules not installed"
  - "Separate raw SQL queries per entity type in embedding-batch to avoid dynamic table names (security)"
  - "Requirement and Risk use displayId as title in search results since those models have no title field"
  - "Decision model uses rationale (not outcome) for tsvector since schema has no outcome column"
  - "VOYAGE_API_KEY added as optional env var - search gracefully falls back to full-text when unavailable"

patterns-established:
  - "Three-layer search merge: filtered (score 2.0 boost) > full-text (0.6 weight) > semantic (0.4 weight)"
  - "Manual SQL migration pattern for Postgres features Prisma cannot express"
  - "Command palette mounted in app-shell, globally accessible via Cmd+K"
  - "localStorage for persisting recent search items per project"

requirements-completed: [SRCH-01, SRCH-02, SRCH-03, SRCH-04]

duration: 5min
completed: 2026-04-06
---

# Phase 02 Plan 07: Search Infrastructure Summary

**Three-layer search (filtered + tsvector full-text + pgvector semantic) with Cmd+K command palette, Voyage AI embeddings, and Inngest background embedding pipeline**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-06T18:50:57Z
- **Completed:** 2026-04-06T18:56:00Z
- **Tasks:** 2/2
- **Files modified:** 12

## Accomplishments
- Complete three-layer search infrastructure: filtered (Prisma where clauses for structured queries like "status:open"), full-text (tsvector with GIN indexes, ts_headline snippets, ts_rank scoring), and semantic (pgvector cosine similarity with Voyage AI embeddings)
- Cmd+K command palette globally mounted in app shell with debounced search, grouped results by entity type, recent items from localStorage, and quick actions (Create Question, Process Transcript, New Chat)
- Inngest embedding batch function with per-entity-type raw SQL storage, graceful Voyage AI fallback, and non-blocking failure handling
- SQL migrations for tsvector columns/triggers/indexes on 5 entity types and vector dimension update to 1024 with HNSW indexes

## Task Commits

Each task was committed atomically:

1. **Task 1: Search infrastructure - tsvector SQL, Voyage AI embeddings, three-layer global search** - `f105916` (feat)
2. **Task 2: Cmd+K command palette and Inngest embedding batch function** - `c23e9ed` (feat)

## Files Created/Modified
- `prisma/migrations/tsvector-setup.sql` - tsvector columns, GIN indexes, trigger functions, backfill for Question/Decision/KnowledgeArticle/Requirement/Risk
- `prisma/migrations/vector-dimension-1024.sql` - Alter embedding columns from 1536 to 1024 for Voyage AI, HNSW indexes
- `prisma/schema.prisma` - Comments noting runtime vector(1024) via SQL migration
- `src/lib/search/embeddings.ts` - Voyage AI embedding wrapper with batch support (128 per call) and null-return fallback
- `src/lib/search/global-search.ts` - Three-layer globalSearch: filtered + full-text + semantic with merge/dedup/ranking
- `src/actions/search.ts` - Search server action with Zod validation and project membership check
- `src/env.ts` - Added optional VOYAGE_API_KEY
- `src/components/ui/command.tsx` - Command dialog/input/list/group/item/empty/separator components
- `src/components/search/command-palette.tsx` - Cmd+K palette with grouped results, recent items, quick actions
- `src/lib/inngest/functions/embedding-batch.ts` - Batched embedding generation and storage via Inngest
- `src/app/api/inngest/route.ts` - Registered embeddingBatchFunction
- `src/components/layout/app-shell.tsx` - Mounted CommandPalette globally

## Decisions Made
1. **Inline Command component**: Built Command UI following shadcn/cmdk API contract since node_modules not installed for CLI. Can be swapped for full shadcn version when dependencies are installed.
2. **Separate SQL per entity type**: Embedding batch uses distinct UPDATE queries for KnowledgeArticle and OrgComponent rather than dynamic table names, avoiding SQL injection risk (T-02-24).
3. **Schema field alignment**: Decision model has `rationale` not `outcome`; Requirement/Risk have no `title` field. Adjusted tsvector triggers and search results to use actual schema columns.
4. **Optional VOYAGE_API_KEY**: Added to env validation as optional. All search and embedding code gracefully falls back when not configured.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Decision model has no outcome column**
- **Found during:** Task 1 (tsvector setup)
- **Issue:** Plan specified `outcome` for Decision tsvector, but schema has `rationale` instead
- **Fix:** Used `rationale` in tsvector trigger and full-text search query
- **Files modified:** prisma/migrations/tsvector-setup.sql, src/lib/search/global-search.ts
- **Committed in:** f105916

**2. [Rule 1 - Bug] Requirement and Risk models have no title field**
- **Found during:** Task 1 (global search)
- **Issue:** Plan specified `title || description` for tsvector, but these models have `description` only
- **Fix:** Used `displayId` as searchable title weight A, `description` as weight B
- **Files modified:** prisma/migrations/tsvector-setup.sql, src/lib/search/global-search.ts
- **Committed in:** f105916

**3. [Rule 3 - Blocking] No node_modules for shadcn CLI or tsc verification**
- **Found during:** Task 2 (Command component install)
- **Issue:** node_modules not installed; cannot run `npx shadcn@latest add command`
- **Fix:** Built Command component inline following shadcn/cmdk API patterns. Verified code manually.
- **Files modified:** src/components/ui/command.tsx
- **Committed in:** c23e9ed

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Known Stubs

None - all search layers, command palette, and embedding pipeline are fully wired.

## Issues Encountered
- node_modules not installed, preventing TypeScript compilation verification and shadcn CLI usage. Pre-existing condition from prior plans. All code verified manually against Prisma schema types.

## User Setup Required

Voyage AI API key needed for semantic search (Layer 3). Without it, search gracefully falls back to filtered + full-text layers.

- **VOYAGE_API_KEY**: Get from [Voyage AI Dashboard](https://dash.voyageai.com/) -> API Keys
- Add to `.env.local`: `VOYAGE_API_KEY=your-key-here`
- **Verification**: Semantic search results appear when querying with Cmd+K

## Next Phase Readiness
- Search infrastructure complete and ready for integration with dashboard (Plan 08)
- Embedding batch function registered and ready to receive events from entity create/update flows
- Command palette globally accessible from any project page
- tsvector SQL ready to execute against database when DB connection is available

## Self-Check: PASSED

---
*Phase: 02-discovery-and-knowledge-brain*
*Completed: 2026-04-06*
