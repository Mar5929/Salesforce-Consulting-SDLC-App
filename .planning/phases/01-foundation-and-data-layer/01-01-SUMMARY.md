---
phase: 01-foundation-and-data-layer
plan: 01
subsystem: foundation
tags: [next.js, prisma, clerk, inngest, tailwind, shadcn, encryption, vitest]

# Dependency graph
requires: []
provides:
  - "Next.js 16 app shell with Tailwind v4 and shadcn/ui"
  - "Complete Prisma schema (44 models, 47 enums) for all phases"
  - "Clerk authentication with proxy.ts (Next.js 16 convention)"
  - "Core library modules: db, auth, encryption, project-scope, safe-action, inngest"
  - "Vitest test infrastructure with 5 passing behavioral tests"
  - "Environment variable validation via @t3-oss/env-nextjs"
affects: [01-02, 01-03, all-future-plans]

# Tech tracking
tech-stack:
  added: [next.js@16.2.2, react@19.2.4, prisma@7.6.0, clerk@7.0.8, inngest@4.1.2, zod@4.3.6, tailwindcss@4.2.2, shadcn-ui, vitest@4.1.2, next-safe-action@8.4.0, t3-oss-env-nextjs@0.13.11]
  patterns: [prisma-neon-adapter, hkdf-aes256gcm-encryption, project-scoped-prisma-extension, clerk-proxy-middleware, safe-action-client-with-auth]

key-files:
  created:
    - prisma/schema.prisma
    - prisma.config.ts
    - src/lib/db.ts
    - src/lib/auth.ts
    - src/lib/encryption.ts
    - src/lib/project-scope.ts
    - src/lib/safe-action.ts
    - src/lib/inngest/client.ts
    - src/lib/inngest/events.ts
    - src/proxy.ts
    - src/env.ts
    - src/app/layout.tsx
    - src/app/globals.css
    - src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
    - src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
    - vitest.config.ts
    - tests/setup.ts
    - tests/lib/encryption.test.ts
    - tests/lib/project-scope.test.ts
    - .env.example
    - .gitignore
  modified: [package.json]

key-decisions:
  - "TypeScript 5.8.3 instead of spec's 6.0.2 -- TS 6.x does not exist yet, 5.8.3 is latest stable"
  - "Prisma 7 requires datasource config in prisma.config.ts, not schema.prisma -- adapted from plan"
  - "Zod 4 compat layer (import from 'zod') used for @t3-oss/env-nextjs compatibility"
  - "prisma db push deferred -- requires user to provide DATABASE_URL credentials"

patterns-established:
  - "Prisma 7 config: datasource URL in prisma.config.ts with process.env fallback"
  - "HKDF+AES-256-GCM encryption: per-project derived keys from master key"
  - "Project-scoped queries: Prisma $extends with MODELS_WITH_PROJECT_ID constant"
  - "Auth helpers: requireAuth(), getCurrentMember(), requireRole()"
  - "Safe actions: actionClient with Clerk auth middleware"
  - "Inngest events: namespaced constants (domain/action pattern)"
  - "Design system: Inter font, accent #2563EB, neutral palette per UI-SPEC"

requirements-completed: [AUTH-01, AUTH-02, AUTH-04, AUTH-05, INFRA-04]

# Metrics
duration: 16min
completed: 2026-04-05
---

# Phase 1 Plan 1: Project Scaffold and Foundation Summary

**Next.js 16 app with Clerk auth, complete 44-model Prisma schema, HKDF encryption, project-scoped queries, and green vitest suite**

## Performance

- **Duration:** 16 min
- **Started:** 2026-04-05T16:23:25Z
- **Completed:** 2026-04-05T16:40:00Z
- **Tasks:** 4 completed
- **Files modified:** 35+

## Accomplishments

- Complete Prisma schema with all 33 entities and 11 join tables from SESSION-3-TECHNICAL-SPEC.md, including pgvector fields, unique constraints, and indexes
- Full Clerk authentication setup with Next.js 16 proxy.ts convention, sign-in/sign-up pages, and ClerkProvider root layout
- Core library modules providing encryption (HKDF+AES-256-GCM), project-scoped queries, auth helpers, safe-action client, and Inngest event infrastructure
- Vitest test infrastructure with 5 passing behavioral tests covering encryption round-trip and project-scope model verification
- Design system tokens from UI-SPEC integrated into globals.css (Inter font, accent blue, neutral palette)

## Task Commits

Each task was committed atomically:

1. **Task 0: Install vitest and create test infrastructure** - `ba7b5ae` (chore)
2. **Task 1: Scaffold Next.js 16 project, install all dependencies, configure tooling** - `d843e31` (feat)
3. **Task 2: Create full Prisma schema and core library modules** - `f4d7ebf` (feat, TDD)
4. **Task 3: Set up Clerk auth pages, proxy.ts, root layout** - `fbc62f6` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - Complete database schema (44 models, 47 enums)
- `prisma.config.ts` - Prisma 7 configuration with Neon datasource
- `src/lib/db.ts` - Prisma client singleton with PrismaNeon adapter
- `src/lib/auth.ts` - Auth helpers: requireAuth, getCurrentMember, requireRole
- `src/lib/encryption.ts` - HKDF-SHA256 key derivation + AES-256-GCM encryption
- `src/lib/project-scope.ts` - Prisma $extends for automatic projectId scoping
- `src/lib/safe-action.ts` - next-safe-action client with Clerk auth middleware
- `src/lib/inngest/client.ts` - Inngest client instance (id: sf-consulting-ai)
- `src/lib/inngest/events.ts` - Event type constants for all phases
- `src/proxy.ts` - Clerk middleware (Next.js 16 proxy.ts convention)
- `src/env.ts` - Environment variable validation with @t3-oss/env-nextjs
- `src/app/layout.tsx` - Root layout with ClerkProvider, Inter font, Toaster
- `src/app/globals.css` - Tailwind v4 with design system color tokens
- `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` - Clerk SignIn page
- `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` - Clerk SignUp page
- `vitest.config.ts` - Test configuration with path aliases
- `tests/setup.ts` - Test environment variable stubs
- `tests/lib/encryption.test.ts` - 3 encryption behavioral tests
- `tests/lib/project-scope.test.ts` - 2 project-scope behavioral tests
- `.env.example` - All required environment variables documented
- `.gitignore` - node_modules, .next, .env, src/generated, tsbuildinfo
- `16 shadcn/ui components` in src/components/ui/

## Decisions Made

1. **TypeScript 5.8.3 over spec's 6.0.2** - TypeScript 6.x does not exist. 5.8.3 is the actual latest stable version. All peer dependencies satisfied.
2. **Prisma 7 config adaptation** - Prisma 7 moved datasource URL from schema.prisma to prisma.config.ts. Used `process.env.DATABASE_URL` with fallback for CLI commands that don't need a DB connection.
3. **Zod compat layer** - Used `import { z } from "zod"` (Zod 4 compat path) instead of `zod/v4` for @t3-oss/env-nextjs compatibility.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript version 6.0.2 does not exist**
- **Found during:** Task 1 (dependency installation)
- **Issue:** CLAUDE.md specified TypeScript 6.0.2, which is not a real version
- **Fix:** Installed TypeScript 5.8.3 (actual latest stable)
- **Files modified:** package.json
- **Committed in:** d843e31

**2. [Rule 3 - Blocking] Prisma 7 datasource URL moved to prisma.config.ts**
- **Found during:** Task 2 (prisma validate)
- **Issue:** Prisma 7 no longer allows `url = env("DATABASE_URL")` in schema.prisma
- **Fix:** Moved datasource config to prisma.config.ts, removed url from schema
- **Files modified:** prisma/schema.prisma, prisma.config.ts
- **Committed in:** f4d7ebf

**3. [Rule 3 - Blocking] Missing back-relations in Prisma schema**
- **Found during:** Task 2 (prisma validate)
- **Issue:** TestCase missing `defects` back-relation, SessionLog missing `generatedDocuments` back-relation
- **Fix:** Added the missing relation arrays
- **Files modified:** prisma/schema.prisma
- **Committed in:** f4d7ebf

**4. [Rule 3 - Blocking] Prisma config earlyAccess property invalid**
- **Found during:** Task 2 (tsc --noEmit)
- **Issue:** `earlyAccess` is not a valid PrismaConfig property in 7.6.0
- **Fix:** Removed the property
- **Files modified:** prisma.config.ts
- **Committed in:** f4d7ebf

---

**Total deviations:** 4 auto-fixed (1x Rule 1 bug, 3x Rule 3 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

**prisma db push not executed** - Requires a valid DATABASE_URL pointing to a Neon PostgreSQL database. No .env file exists in the repository. The schema is validated and the Prisma client is generated, but the database has not been synced. User must:
1. Create a Neon database
2. Add DATABASE_URL to .env
3. Run `npx prisma db push`
4. Run `npx prisma db execute --stdin <<< "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_trgm;"`

## User Setup Required

The following environment variables must be configured before the app can run:

| Variable | Source | Required |
|----------|--------|----------|
| DATABASE_URL | Neon dashboard | Yes |
| CLERK_SECRET_KEY | Clerk dashboard | Yes |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk dashboard | Yes |
| SF_TOKEN_ENCRYPTION_KEY | Generate 32+ char key | Yes |
| INNGEST_SIGNING_KEY | Inngest dashboard | No (dev) |
| INNGEST_EVENT_KEY | Inngest dashboard | No (dev) |

See `.env.example` for the full template.

## Known Stubs

None -- all code is functional, not stubbed.

## Next Phase Readiness

- Schema is ready for all subsequent plans (full entity set deployed)
- Core lib modules provide foundation for Plan 02 (project CRUD) and Plan 03 (Inngest functions)
- Auth infrastructure (Clerk + proxy.ts + auth helpers) ready for protected routes
- Test infrastructure established for behavioral verification
- **Blocker:** DATABASE_URL must be configured and `prisma db push` must be run before Plan 02 can execute database operations

---
*Phase: 01-foundation-and-data-layer*
*Completed: 2026-04-05*
