# Phase 1: Foundation and Data Layer - Research

**Researched:** 2026-04-04
**Domain:** Next.js 16 full-stack setup, PostgreSQL/Prisma, Clerk auth, Inngest background jobs
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield foundation phase covering: Next.js 16 app shell with Clerk authentication, complete Prisma schema (30+ entities from the tech spec), project management CRUD (create, invite, assign roles), Inngest background job infrastructure, and project-scoped data access. The tech stack is fully locked in CLAUDE.md with verified versions.

Key technical findings: Next.js 16 renames `middleware.ts` to `proxy.ts` (breaking change from Next.js 15). Prisma 7 introduces `prisma.config.ts` for adapter configuration and changes the PrismaClient import path to `./generated/prisma`. The pgvector `Unsupported("vector")` drift detection bug is fixed in Prisma 7.2.0+ (we're on 7.6.0). Clerk 7 supports Next.js 16 via `proxy.ts` with Organizations for multi-tenancy. shadcn/ui fully supports Tailwind v4.

**Primary recommendation:** Follow the locked stack exactly. The biggest risk areas are the Next.js 16 proxy.ts convention (new pattern, less community content) and Prisma 7's new configuration model. Deploy the full schema upfront per D-05 to avoid migration churn.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Fixed left sidebar with navigation + main content area (Linear/Notion/Jira pattern). Sidebar contains project navigation, feature links, and settings.
- **D-02:** Sidebar project switcher at top of sidebar -- dropdown showing current project, click to switch. No dedicated projects page needed for switching.
- **D-03:** Multi-step wizard for project creation: Step 1 (name, client, engagement type) > Step 2 (sandbox strategy) > Step 3 (invite team, assign roles). Guided flow ensures required fields are captured.
- **D-04:** Clean minimal visual style -- Linear/Vercel aesthetic. Lots of whitespace, subtle borders, muted colors, sharp typography. Professional consulting tool feel. This is the design system foundation for all phases.
- **D-05:** Deploy the full database schema upfront -- all 30+ entities from the tech spec across phases 1-5. Avoids migration churn and lets future phases start without schema work.
- **D-06:** SESSION-3-TECHNICAL-SPEC.md is the canonical source for entity definitions. Generate Prisma schema directly from it.
- **D-07:** Use cuid2 for all record IDs -- collision-resistant, URL-safe, sortable. Per tech stack decisions.
- **D-08:** pgvector and tsvector handling is Claude's discretion.
- **D-09:** Clerk Organizations for multi-project membership. Store 5 project-level roles (SA, PM, BA, Developer, QA) in ProjectMember table in Postgres, not Clerk metadata. Clerk handles auth, app handles authorization.
- **D-10:** Role enforcement at middleware level (route protection) and page level (show/hide nav items) in Phase 1. Component-level gating deferred to feature phases.
- **D-11:** Query-level project scoping -- every database query includes projectId filter. Enforced via shared query helper or Prisma middleware that auto-appends active project scope.
- **D-12:** Inngest infrastructure + audit log job (AUTH-06) as first real function. Validates the infrastructure end-to-end with a real use case.
- **D-13:** 3 retries with exponential backoff as default retry policy. Individual functions can override.

### Claude's Discretion
- Inngest event naming convention (Claude picks based on Inngest best practices)
- pgvector/tsvector implementation strategy for Prisma 7
- Loading states, error boundaries, and empty state designs
- Exact sidebar layout details, spacing, and responsive behavior
- Prisma middleware vs. helper function approach for project scoping

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up and log in with email/password via Clerk | Clerk 7 + Next.js 16 proxy.ts setup verified. `<SignIn>` and `<SignUp>` components available. |
| AUTH-02 | User session persists across browser refresh | Clerk session management handles this automatically via `clerkMiddleware()` in proxy.ts. |
| AUTH-03 | User is assigned a project-level role (SA, PM, BA, Developer, QA) that controls visible features | Clerk Organizations for membership + ProjectMember table for roles per D-09. Role enforcement at middleware and page level per D-10. |
| AUTH-04 | All data queries are scoped to the active project -- no cross-project data leakage | Prisma middleware or helper function for automatic projectId scoping per D-11. |
| AUTH-05 | Salesforce org credentials are encrypted at rest using per-project derived keys (HKDF-SHA256) | Node.js built-in `crypto.hkdf()` + AES-256-GCM. No external library needed. Schema includes keyVersion for rotation. |
| AUTH-06 | Access to sensitive operations is logged for audit trail | Inngest audit log function per D-12. StatusTransition + VersionHistory entities in schema. |
| PROJ-01 | User can create a new project with name, client, engagement type, and sandbox strategy | Multi-step wizard per D-03. react-hook-form + Zod validation. Server action via next-safe-action. |
| PROJ-02 | User can view and edit project settings and team membership | Standard CRUD with project-scoped queries. shadcn/ui forms. |
| PROJ-03 | User can invite team members and assign project-level roles | Clerk Organizations invite + ProjectMember record creation. Role enum: SA, PM, BA, Developer, QA. |
| INFRA-01 | Inngest event-driven background job infrastructure with automatic retries | Inngest serve route at `/api/inngest/route.ts`. 3 retries with exponential backoff per D-13. |
| INFRA-02 | Step functions with checkpoints for long-running operations | Inngest `step.run()` pattern. Verified working with Next.js App Router. |
| INFRA-04 | Optimistic concurrency control with version-based conflict detection | VersionHistory entity + version field on entities. Application-level check-and-increment pattern. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack locked:** Next.js 16.2.2, React 19.2.4, TypeScript 6.0.2, Prisma 7.6.0, Clerk 7.0.8, Inngest 4.1.2, Tailwind 4.2.2, Zod 4.3.6
- **Architecture:** Web app = management/knowledge layer. Claude Code = developer execution layer. Boundary is REST API.
- **AI provider:** Claude API only in V1. No provider abstraction.
- **Deployment:** Vercel for web app + serverless functions. Inngest for background jobs.
- **Budget:** Solo developer, cost-conscious -- Inngest free tier, Vercel free/hobby tier initially.
- **No tRPC, no Redux/Zustand, no WebSockets, no Prisma Accelerate, no NextAuth, no Playwright, no GraphQL.**
- **GSD Workflow Enforcement:** Use GSD commands for all repo changes.

## Standard Stack

### Core (Phase 1 subset)

All versions verified against npm registry on 2026-04-04. [VERIFIED: npm registry]

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.2 | Full-stack React framework (App Router) | Locked. proxy.ts replaces middleware.ts. |
| react | 19.2.4 | UI library | Peer dep of Next.js 16. |
| typescript | 6.0.2 | Type safety | Locked. Required by Inngest (>=5.8.0). |
| prisma | 7.6.0 | ORM / migration tool | Locked. Uses prisma.config.ts for adapter config. |
| @prisma/client | 7.6.0 | Runtime query engine | Must match prisma CLI version. Import from `./generated/prisma`. |
| @prisma/adapter-neon | 7.6.0 | Neon serverless adapter | Bundles @neondatabase/serverless. Must match Prisma version. |
| @clerk/nextjs | 7.0.8 | Auth, user management, organizations | Locked. Supports Next.js `^16.0.10`. |
| inngest | 4.1.2 | Event-driven background jobs | Locked. Supports Next.js `>=12.0.0`, Zod `^3.25.0 \|\| ^4.0.0`. |
| zod | 4.3.6 | Schema validation | Locked. Used by Inngest, next-safe-action (via Standard Schema), react-hook-form. |
| next-safe-action | 8.4.0 | Type-safe server actions | Uses Standard Schema v1 -- works with Zod 4. |
| @t3-oss/env-nextjs | 0.13.11 | Environment variable validation | Catches missing env vars at build time. |
| @paralleldrive/cuid2 | 3.3.0 | ID generation | Locked per D-07. Collision-resistant, URL-safe, sortable. |
| tailwindcss | 4.2.2 | Utility-first CSS | Locked. CSS-first config, `@theme` directive. |
| react-hook-form | 7.72.1 | Form management | For project creation wizard and settings forms. |
| @hookform/resolvers | 5.2.2 | Form validation bridge | Connects react-hook-form to Zod schemas. |
| swr | 2.4.1 | Client-side data fetching/caching | For polling patterns and client-side data refresh. |
| nuqs | 2.8.9 | URL search params state | Type-safe URL state for table filtering. |
| sonner | 2.0.7 | Toast notifications | Integrated with shadcn/ui. |
| lucide-react | 1.7.0 | Icons | Default icon set for shadcn/ui. |
| date-fns | 4.1.0 | Date formatting | Tree-shakeable, functional API. |

### shadcn/ui Components (Phase 1)

shadcn/ui is CLI-installed, not an npm package. Fully supports Tailwind v4 and React 19. [VERIFIED: shadcn/ui docs]

Components needed for Phase 1:
- Button, Input, Label, Textarea, Select -- form primitives
- Card -- project cards, wizard steps
- Dialog, Sheet -- modals, sidebar panel
- DropdownMenu -- project switcher, user menu
- Avatar -- team member display
- Badge -- role badges (SA, PM, BA, etc.)
- Separator -- layout divisions
- Skeleton -- loading states
- Toast (Sonner) -- action feedback
- Form -- react-hook-form integration
- Table -- team member list
- Tabs -- project settings sections

### Installation

```bash
# Core framework
npx create-next-app@16.2.2 --typescript --tailwind --app --src-dir --use-npm

# Database
npm install prisma@7.6.0 @prisma/client@7.6.0 @prisma/adapter-neon@7.6.0

# Auth
npm install @clerk/nextjs@7.0.8

# Background jobs
npm install inngest@4.1.2

# UI & Forms
npm install react-hook-form@7.72.1 @hookform/resolvers@5.2.2 zod@4.3.6 nuqs@2.8.9 sonner@2.0.7 lucide-react@1.7.0 date-fns@4.1.0

# Server actions & env
npm install next-safe-action@8.4.0 @t3-oss/env-nextjs@0.13.11

# Utilities
npm install @paralleldrive/cuid2@3.3.0 swr@2.4.1

# Tailwind utilities (used by shadcn)
npm install class-variance-authority@0.7.1 clsx@2.1.1 tailwind-merge@3.5.0

# Dev dependencies
npm install -D typescript@6.0.2 eslint@10.2.0 prettier@3.8.1

# shadcn/ui init (run after project setup)
npx shadcn@latest init
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Auth routes (sign-in, sign-up)
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/             # Authenticated app shell
│   │   ├── layout.tsx           # Sidebar + main content layout
│   │   ├── projects/
│   │   │   ├── new/page.tsx     # Project creation wizard
│   │   │   └── [projectId]/
│   │   │       ├── layout.tsx   # Project-scoped layout
│   │   │       ├── page.tsx     # Project overview/dashboard
│   │   │       └── settings/
│   │   │           ├── page.tsx # General settings
│   │   │           └── team/page.tsx # Team management
│   │   └── page.tsx             # Default redirect or project list
│   ├── api/
│   │   └── inngest/route.ts     # Inngest serve endpoint
│   ├── layout.tsx               # Root layout with ClerkProvider
│   └── globals.css              # Tailwind v4 imports + theme
├── components/
│   ├── ui/                      # shadcn/ui components (CLI-managed)
│   ├── layout/
│   │   ├── sidebar.tsx          # App sidebar (D-01)
│   │   ├── project-switcher.tsx # Sidebar project switcher (D-02)
│   │   └── app-shell.tsx        # Sidebar + content wrapper
│   ├── projects/
│   │   ├── create-wizard.tsx    # Multi-step wizard (D-03)
│   │   ├── team-management.tsx  # Invite + role assignment
│   │   └── project-card.tsx     # Project list item
│   └── shared/
│       ├── loading-skeleton.tsx
│       └── empty-state.tsx
├── lib/
│   ├── db.ts                    # Prisma client singleton with Neon adapter
│   ├── auth.ts                  # Auth helpers (getCurrentUser, requireAuth, etc.)
│   ├── project-scope.ts         # Project-scoped query helper (D-11)
│   ├── encryption.ts            # HKDF + AES-256-GCM (AUTH-05)
│   ├── inngest/
│   │   ├── client.ts            # Inngest client instance
│   │   ├── functions/
│   │   │   └── audit-log.ts     # First real function (D-12)
│   │   └── events.ts            # Event type definitions
│   └── utils.ts                 # cn() helper, etc.
├── actions/
│   ├── projects.ts              # Project CRUD server actions
│   └── team.ts                  # Team invite/role server actions
├── generated/
│   └── prisma/                  # Prisma generated client (Prisma 7 output)
└── env.ts                       # @t3-oss/env-nextjs config
proxy.ts                         # Clerk middleware (Next.js 16 convention)
prisma/
├── schema.prisma                # Full database schema (D-05, D-06)
└── migrations/                  # Prisma migrations
prisma.config.ts                 # Prisma 7 adapter configuration
```

### Pattern 1: Next.js 16 Proxy (formerly Middleware)

**What:** Next.js 16 renames `middleware.ts` to `proxy.ts`. The exported function is also renamed from `middleware` to default export. Runtime is now always Node.js (not Edge). [VERIFIED: nextjs.org/docs]

**When to use:** Always -- this is the only way to run route-level logic in Next.js 16.

**Example:**
```typescript
// proxy.ts (root of project or src/)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/inngest(.*)',  // Inngest needs unauthenticated access
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```
Source: [Clerk docs](https://clerk.com/docs/reference/nextjs/clerk-middleware), [Next.js 16 proxy docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

### Pattern 2: Prisma 7 + Neon Serverless Setup

**What:** Prisma 7 uses `prisma.config.ts` for adapter configuration. PrismaClient import path changed to `./generated/prisma`. [VERIFIED: Prisma docs, Neon docs]

**Example:**
```typescript
// prisma.config.ts
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
})

// src/lib/db.ts
import { PrismaClient } from '../generated/prisma'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```
Source: [Neon Prisma guide](https://neon.com/docs/guides/prisma), [Prisma config reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)

### Pattern 3: Inngest Serve Route

**What:** API route that exposes Inngest functions to the Inngest service. [VERIFIED: Inngest docs]

**Example:**
```typescript
// src/app/api/inngest/route.ts
import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { auditLogFunction } from '@/lib/inngest/functions/audit-log'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [auditLogFunction],
})

// src/lib/inngest/client.ts
import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'sf-consulting-ai',
})

// src/lib/inngest/functions/audit-log.ts
import { inngest } from '../client'
import { prisma } from '@/lib/db'

export const auditLogFunction = inngest.createFunction(
  {
    id: 'audit-log',
    retries: 3,  // D-13: 3 retries with exponential backoff
  },
  { event: 'audit/sensitive-operation' },
  async ({ event, step }) => {
    await step.run('write-audit-log', async () => {
      await prisma.statusTransition.create({
        data: {
          entityType: event.data.entityType,
          entityId: event.data.entityId,
          fromStatus: event.data.fromStatus,
          toStatus: event.data.toStatus,
          transitionedById: event.data.userId,
          transitionedByRole: event.data.userRole,
          reason: event.data.reason,
        },
      })
    })
  }
)
```
Source: [Inngest Next.js Quick Start](https://www.inngest.com/docs/getting-started/nextjs-quick-start)

### Pattern 4: Project-Scoped Queries (D-11)

**What:** Every database query must include `projectId` to prevent cross-project data leakage.

**Recommended approach:** Helper function over Prisma middleware.

**Why helper over middleware:**
- Prisma middleware is deprecated in favor of Prisma Client extensions in Prisma 7 [ASSUMED]
- Helper functions are explicit -- you can see the scoping in every query
- Easier to test and debug
- No magic -- new team members immediately understand the pattern

```typescript
// src/lib/project-scope.ts
import { prisma } from './db'

export function scopedPrisma(projectId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ args, query, model }) {
        // Skip models that don't have projectId
        const modelsWithProjectId = [
          'Project', 'ProjectMember', 'Epic', 'Feature', 'Story',
          'Question', 'Decision', 'Requirement', 'Risk', 'Milestone',
          'Sprint', 'Transcript', 'SessionLog', 'GeneratedDocument',
          'Attachment', 'Notification', 'Conversation', 'OrgComponent',
          'DomainGrouping', 'BusinessProcess', 'KnowledgeArticle', 'Defect',
        ]
        if (model && modelsWithProjectId.includes(model)) {
          args.where = { ...args.where, projectId }
        }
        return query(args)
      },
    },
  })
}
```

### Pattern 5: HKDF + AES-256-GCM Encryption (AUTH-05)

**What:** Per-project encryption for Salesforce credentials using Node.js built-in crypto. [VERIFIED: Node.js docs]

```typescript
// src/lib/encryption.ts
import { hkdf, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const hkdfAsync = promisify(hkdf)

async function deriveKey(projectId: string): Promise<Buffer> {
  const masterKey = process.env.SF_TOKEN_ENCRYPTION_KEY!
  return Buffer.from(
    await hkdfAsync('sha256', masterKey, projectId, 'sf-token-encryption', 32)
  )
}

export async function encrypt(plaintext: string, projectId: string): Promise<string> {
  const key = await deriveKey(projectId)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Store as: iv:tag:ciphertext (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

export async function decrypt(ciphertext: string, projectId: string): Promise<string> {
  const [ivB64, tagB64, encB64] = ciphertext.split(':')
  const key = await deriveKey(projectId)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return decipher.update(Buffer.from(encB64, 'base64')) + decipher.final('utf8')
}
```

### Pattern 6: Server Actions with next-safe-action

**What:** Type-safe, validated server actions for all mutations. [VERIFIED: next-safe-action docs]

```typescript
// src/actions/projects.ts
import { actionClient } from '@/lib/safe-action'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  clientName: z.string().min(1).max(100),
  engagementType: z.enum(['GREENFIELD', 'BUILD_PHASE', 'MANAGED_SERVICES', 'RESCUE_TAKEOVER']),
  startDate: z.string().datetime(),
  targetEndDate: z.string().datetime().optional(),
})

export const createProject = actionClient
  .schema(createProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    // ctx.userId from Clerk auth
    const project = await prisma.project.create({
      data: {
        ...parsedInput,
        status: 'ACTIVE',
        currentPhase: 'DISCOVERY',
      },
    })
    return { project }
  })
```

### Anti-Patterns to Avoid

- **Querying without projectId scope:** Every query touching project data MUST include projectId. Never rely on UI-only filtering.
- **Storing roles in Clerk metadata:** Per D-09, roles are in ProjectMember table. Clerk handles auth only.
- **Using middleware.ts:** Next.js 16 uses proxy.ts. middleware.ts will cause errors.
- **Importing PrismaClient from @prisma/client:** Prisma 7 requires import from `./generated/prisma`.
- **Installing @neondatabase/serverless separately:** `@prisma/adapter-neon@7.6.0` bundles it.
- **Using Edge Runtime in proxy.ts:** Next.js 16 proxy runs on Node.js only. Edge runtime is not supported.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom auth with JWTs | Clerk | Session management, MFA, user management, organization features |
| Form validation | Custom validation logic | Zod + react-hook-form + @hookform/resolvers | Edge cases in validation are endless (type coercion, error messages, nesting) |
| Background jobs | Custom queue with polling | Inngest | Retries, step functions, checkpoints, concurrency control, observability |
| Server action safety | Raw server actions | next-safe-action | Input validation, error handling, middleware, type inference |
| Env var validation | Manual `process.env.X!` | @t3-oss/env-nextjs | Catches missing vars at build time, full type safety |
| ID generation | UUID v4 | cuid2 | Shorter, sortable, URL-safe, collision-resistant |
| Encryption | Custom crypto primitives | Node.js built-in crypto (hkdf + aes-256-gcm) | Battle-tested, audited, correct by default |
| Component library | Custom components from scratch | shadcn/ui | Accessible, tested, Tailwind-native, customizable |
| Class name merging | String concatenation | cn() (clsx + tailwind-merge) | Handles conditional classes and Tailwind conflicts |

**Key insight:** This is a solo developer project. Every hand-rolled solution is time stolen from business logic. The locked stack covers every infrastructure concern.

## Common Pitfalls

### Pitfall 1: Next.js 16 proxy.ts Convention
**What goes wrong:** Creating `middleware.ts` instead of `proxy.ts`, or exporting a named `middleware` function instead of default export.
**Why it happens:** Most tutorials and community content still reference the Next.js 15 convention.
**How to avoid:** Use `proxy.ts` with `export default clerkMiddleware(...)`. The Next.js codemod `@next/codemod` can automate this.
**Warning signs:** "Middleware not found" errors, Clerk auth not working on protected routes.

### Pitfall 2: Prisma 7 Import Path Change
**What goes wrong:** `import { PrismaClient } from '@prisma/client'` fails silently or uses wrong types.
**Why it happens:** Every Prisma tutorial before 7.0 uses the old import path.
**How to avoid:** Always import from `./generated/prisma` (or configured output path). Set `output` in schema.prisma generator block.
**Warning signs:** TypeScript errors about missing types, runtime "Cannot find module" errors.

### Pitfall 3: Missing projectId Scoping
**What goes wrong:** A query returns data from other projects, violating AUTH-04.
**Why it happens:** Developer forgets to add `projectId` filter in a new query.
**How to avoid:** Use the `scopedPrisma(projectId)` helper for all project-scoped queries. Add integration tests that verify no cross-project leakage.
**Warning signs:** Data appearing that doesn't belong to the current project.

### Pitfall 4: Prisma pgvector Dimension Mismatch
**What goes wrong:** Prisma migrate detects schema drift on vector columns.
**Why it happens:** Vector columns created without dimension specification (e.g., `vector` vs `vector(1536)`).
**How to avoid:** Always specify dimensions in migration SQL: `vector(1536)`. Use `--create-only` flag on migrations that involve vector columns, edit the SQL, then apply. Fixed in Prisma 7.2.0+ but explicit dimensions remain best practice.
**Warning signs:** "Drift detected" errors on `prisma migrate dev`.

### Pitfall 5: Inngest Route Not Excluded from Auth
**What goes wrong:** Inngest cannot invoke functions because the `/api/inngest` route is behind Clerk auth.
**Why it happens:** Default Clerk middleware protects all routes.
**How to avoid:** Add `/api/inngest(.*)` to the public routes matcher in proxy.ts.
**Warning signs:** Inngest dashboard shows "failed to sync" or function invocations return 401.

### Pitfall 6: Clerk Organizations Overkill
**What goes wrong:** Over-engineering the Clerk Organizations integration when only basic multi-project membership is needed.
**Why it happens:** Clerk Organizations has many features (billing, invitations, role management) that overlap with custom project management.
**How to avoid:** Use Clerk Organizations solely for grouping users. Per D-09, all role management is in Postgres via ProjectMember. Don't use Clerk's built-in role system.
**Warning signs:** Roles stored in two places, sync issues between Clerk and Postgres.

### Pitfall 7: Tailwind v4 Config Migration
**What goes wrong:** Using `tailwind.config.ts` file instead of CSS-first configuration.
**Why it happens:** Tailwind v3 patterns are deeply embedded in community knowledge.
**How to avoid:** Tailwind v4 uses CSS-first config with `@theme` directive in `globals.css`. No `tailwind.config.ts` needed. shadcn/ui `init` handles this correctly when run with Tailwind v4.
**Warning signs:** Theme customizations not applying, PostCSS errors.

## Code Examples

### Prisma Schema Pattern (cuid2 IDs, enums, relations)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum EngagementType {
  GREENFIELD
  BUILD_PHASE
  MANAGED_SERVICES
  RESCUE_TAKEOVER
}

enum ProjectPhase {
  DISCOVERY
  REQUIREMENTS
  SOLUTION_DESIGN
  BUILD
  TESTING
  DEPLOYMENT
  HYPERCARE
  ARCHIVE
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
}

enum ProjectRole {
  SOLUTION_ARCHITECT
  DEVELOPER
  PM
  BA
  QA
}

enum MemberStatus {
  ACTIVE
  REMOVED
}

model Project {
  id               String          @id @default(cuid())
  name             String
  clientName       String
  engagementType   EngagementType
  currentPhase     ProjectPhase    @default(DISCOVERY)
  startDate        DateTime
  targetEndDate    DateTime?
  status           ProjectStatus   @default(ACTIVE)
  // SF org credentials (encrypted at app level)
  sfOrgInstanceUrl  String?
  sfOrgAccessToken  String?
  sfOrgRefreshToken String?
  sfOrgLastSyncAt   DateTime?
  sfOrgSyncIntervalHours Int       @default(4)
  // Cached briefing
  cachedBriefingContent     Json?
  cachedBriefingGeneratedAt DateTime?
  healthScoreThresholds     Json?
  keyVersion       Int            @default(1)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  members          ProjectMember[]
  epics            Epic[]
  // ... all other relations
}

model ProjectMember {
  id           String       @id @default(cuid())
  projectId    String
  clerkUserId  String
  displayName  String
  email        String
  role         ProjectRole
  status       MemberStatus @default(ACTIVE)
  joinedAt     DateTime     @default(now())
  removedAt    DateTime?

  project      Project      @relation(fields: [projectId], references: [id])

  @@unique([projectId, clerkUserId])
}
```

### Environment Variable Validation

```typescript
// src/env.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
    SF_TOKEN_ENCRYPTION_KEY: z.string().min(32),
    INNGEST_SIGNING_KEY: z.string().optional(),
    INNGEST_EVENT_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    SF_TOKEN_ENCRYPTION_KEY: process.env.SF_TOKEN_ENCRYPTION_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  },
})
```

### Inngest Event Naming Convention (Claude's Discretion)

Following Inngest best practices, use `domain/action` format with dot separators for hierarchy:

```typescript
// src/lib/inngest/events.ts
export const EVENTS = {
  // Audit events (Phase 1)
  AUDIT_SENSITIVE_OP: 'audit/sensitive-operation',

  // Project events (Phase 1)
  PROJECT_CREATED: 'project/created',
  PROJECT_MEMBER_INVITED: 'project/member.invited',
  PROJECT_MEMBER_ROLE_CHANGED: 'project/member.role-changed',

  // Transcript events (Phase 2)
  TRANSCRIPT_UPLOADED: 'transcript/uploaded',

  // Knowledge events (Phase 2)
  ARTICLE_FLAGGED_STALE: 'article/flagged-stale',
  ENTITY_CONTENT_CHANGED: 'entity/content-changed',
  EMBEDDING_BATCH_REQUESTED: 'embedding/batch-requested',

  // Notification events (Phase 2)
  NOTIFICATION_SEND: 'notification/send',

  // Org events (Phase 4)
  ORG_SYNC_REQUESTED: 'org/sync-requested',
  ORG_KNOWLEDGE_REFRESH: 'org/knowledge-refresh-requested',

  // Dashboard events (Phase 2)
  PROJECT_STATE_CHANGED: 'project/state-changed',
} as const
```

### pgvector/tsvector Strategy (Claude's Discretion)

**Recommendation:** Use `Unsupported("vector(1536)")` in Prisma schema with `--create-only` migrations for vector columns. Use `$queryRaw` for vector operations. [VERIFIED: Prisma 7.6.0 supports this pattern, drift bug fixed in 7.2.0+]

```prisma
// In schema.prisma
model OrgComponent {
  // ... other fields
  embedding        Unsupported("vector(1536)")?
  embeddingStatus  EmbeddingStatus @default(PENDING)
}

model KnowledgeArticle {
  // ... other fields
  embedding        Unsupported("vector(1536)")?
  embeddingStatus  EmbeddingStatus @default(PENDING)
}
```

For the initial migration, use `--create-only` and add to the SQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for tsvector/full-text search
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 (Oct 2025) | File rename + default export. Runtime now always Node.js. |
| `import from '@prisma/client'` | `import from './generated/prisma'` | Prisma 7 (2025) | Breaking change in import path. |
| `prisma.config.ts` not needed | Required for adapter config | Prisma 7 (2025) | New file at project root configures datasource URL and adapters. |
| `tailwind.config.ts` | CSS-first config in globals.css | Tailwind v4 (2025) | `@theme` directive replaces JS config. |
| Prisma middleware | Prisma Client extensions | Prisma 5+ (recommended in 7) | `$extends()` is the modern API. |
| Edge Runtime for middleware | Node.js only for proxy | Next.js 16 | Edge runtime not supported in proxy.ts. |

**Deprecated/outdated:**
- `authMiddleware()` in Clerk: Replaced by `clerkMiddleware()`. Removed in Clerk 6+.
- `middleware.ts` in Next.js: Renamed to `proxy.ts` in Next.js 16.
- `@prisma/client` direct import: Use generated output path in Prisma 7.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma middleware is deprecated in favor of Client extensions in Prisma 7 | Architecture Patterns > Pattern 4 | LOW -- if middleware still works, the extension approach is still better practice |
| A2 | Clerk 7 `organizationSyncOptions` works with proxy.ts identically to middleware.ts | Architecture Patterns > Pattern 1 | MEDIUM -- if not, org-based URL routing needs manual handling |
| A3 | next-safe-action 8.4.0 works with Zod 4 via Standard Schema v1 without issues | Standard Stack | LOW -- Standard Schema v1 is designed for this. Fallback: use Zod 3 compatibility import |
| A4 | @t3-oss/env-nextjs 0.13.11 supports Zod 4 | Standard Stack | LOW -- if not, pin to Zod 3 for env validation only |

## Open Questions

1. **Clerk Organizations mapping to projects**
   - What we know: Clerk Organizations provides multi-tenancy. D-09 says use it for membership.
   - What's unclear: Should each Project map 1:1 to a Clerk Organization, or should there be one Clerk Organization per "firm" with projects managed entirely in Postgres?
   - Recommendation: One Clerk Organization per firm. Projects are Postgres-only entities. Clerk Organization membership = "user belongs to this firm." Project membership = ProjectMember records. This is simpler and avoids Clerk Organization sprawl.

2. **Prisma schema output path with Next.js 16**
   - What we know: Prisma 7 generates to `./generated/prisma` by default.
   - What's unclear: Whether `src/generated/prisma` or project-root `generated/prisma` works better with Next.js 16 module resolution.
   - Recommendation: Use `src/generated/prisma` with explicit `output` in generator config. Test during project init.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything | Yes | v25.8.1 | -- |
| npm | Package management | Yes | 11.11.0 | -- |
| PostgreSQL (Neon) | Database | External service | -- | Requires Neon account setup |
| Clerk | Auth | External service | -- | Requires Clerk account setup |
| Inngest | Background jobs | External service (or local dev server) | -- | `npx inngest-cli@latest dev` for local |

**Missing dependencies with no fallback:**
- Neon PostgreSQL account -- must be created before database work
- Clerk account + application -- must be created before auth work

**Missing dependencies with fallback:**
- Inngest Cloud account -- can use `inngest-cli dev` for local development

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (recommended for Next.js 16 + TypeScript) [ASSUMED] |
| Config file | None -- Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Sign up/login renders Clerk components | smoke | Manual -- Clerk hosted UI | N/A |
| AUTH-02 | Session persists across refresh | e2e/manual | Manual -- browser test | N/A |
| AUTH-03 | Role assignment controls visibility | unit | `npx vitest run tests/auth/role-visibility.test.ts -t "role"` | Wave 0 |
| AUTH-04 | No cross-project data leakage | integration | `npx vitest run tests/db/project-scope.test.ts` | Wave 0 |
| AUTH-05 | Credential encryption round-trip | unit | `npx vitest run tests/lib/encryption.test.ts` | Wave 0 |
| AUTH-06 | Audit log written on sensitive ops | integration | `npx vitest run tests/inngest/audit-log.test.ts` | Wave 0 |
| PROJ-01 | Create project with all fields | unit | `npx vitest run tests/actions/projects.test.ts -t "create"` | Wave 0 |
| PROJ-02 | View and edit project settings | unit | `npx vitest run tests/actions/projects.test.ts -t "update"` | Wave 0 |
| PROJ-03 | Invite team member and assign role | unit | `npx vitest run tests/actions/team.test.ts` | Wave 0 |
| INFRA-01 | Inngest processes events with retries | integration | `npx vitest run tests/inngest/serve.test.ts` | Wave 0 |
| INFRA-02 | Step functions with checkpoints work | integration | `npx vitest run tests/inngest/step-functions.test.ts` | Wave 0 |
| INFRA-04 | Optimistic concurrency detects conflicts | unit | `npx vitest run tests/db/concurrency.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration
- [ ] `tests/lib/encryption.test.ts` -- AES-256-GCM round-trip tests (AUTH-05)
- [ ] `tests/db/project-scope.test.ts` -- Project scoping isolation tests (AUTH-04)
- [ ] `tests/actions/projects.test.ts` -- Project CRUD action tests
- [ ] `tests/actions/team.test.ts` -- Team invite/role action tests
- [ ] `tests/inngest/audit-log.test.ts` -- Audit log function tests (AUTH-06)
- [ ] `tests/db/concurrency.test.ts` -- Optimistic concurrency tests (INFRA-04)
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Clerk (handles password policy, session tokens, CSRF) |
| V3 Session Management | Yes | Clerk (httpOnly cookies, session expiry, refresh) |
| V4 Access Control | Yes | Clerk middleware (route protection) + ProjectMember role checks |
| V5 Input Validation | Yes | Zod schemas via next-safe-action on all server actions |
| V6 Cryptography | Yes | Node.js crypto HKDF-SHA256 + AES-256-GCM for SF credentials |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-project data leakage | Information Disclosure | Mandatory projectId scoping on every query (AUTH-04) |
| Unencrypted credentials at rest | Information Disclosure | HKDF per-project derived keys + AES-256-GCM (AUTH-05) |
| Token leakage in API responses | Information Disclosure | Serialization helper strips sfOrg* fields from JSON output |
| Unauthorized role escalation | Elevation of Privilege | Roles in Postgres, not client-editable Clerk metadata (D-09) |
| Missing audit trail | Repudiation | Inngest audit log for sensitive operations (AUTH-06) |
| Inngest endpoint abuse | Spoofing | Inngest signing key verification on /api/inngest route |
| Server action without validation | Tampering | next-safe-action enforces Zod validation on all mutations |

## Sources

### Primary (HIGH confidence)
- npm registry (2026-04-04) -- All version numbers, peer dependencies verified via `npm view`
- [Clerk docs: clerkMiddleware](https://clerk.com/docs/reference/nextjs/clerk-middleware) -- proxy.ts setup, route protection, organization support
- [Next.js docs: proxy.ts](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) -- File convention change from middleware.ts
- [Neon docs: Prisma guide](https://neon.com/docs/guides/prisma) -- Prisma 7 + Neon adapter setup, prisma.config.ts
- [Inngest docs: Next.js Quick Start](https://www.inngest.com/docs/getting-started/nextjs-quick-start) -- Serve route, function patterns
- [Prisma docs: config reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference) -- prisma.config.ts structure
- [shadcn/ui: Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) -- Full Tailwind v4 compatibility confirmed

### Secondary (MEDIUM confidence)
- [GitHub: Prisma #28867](https://github.com/prisma/prisma/issues/28867) -- pgvector drift bug fixed in Prisma 7.2.0
- [Next.js: middleware-to-proxy migration](https://nextjs.org/docs/messages/middleware-to-proxy) -- Codemod and migration details
- [Clerk: Organizations getting started](https://clerk.com/docs/nextjs/guides/organizations/getting-started) -- Organization setup for Next.js
- [next-safe-action docs](https://next-safe-action.dev/) -- Standard Schema v1 support (works with Zod 4)

### Tertiary (LOW confidence)
- WebSearch results for Zod 4 ecosystem compatibility -- broad adoption reported but not independently verified for every package

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified against npm registry. Peer dependencies confirmed compatible.
- Architecture: HIGH -- Patterns verified against official documentation for each library.
- Pitfalls: HIGH -- Multiple sources confirm Next.js 16 proxy.ts change, Prisma 7 breaking changes.
- pgvector strategy: MEDIUM -- Drift fix verified but native Prisma vector support still evolving.

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable stack, 30-day validity)
