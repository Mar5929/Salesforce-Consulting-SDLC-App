# Technology Stack

**Project:** Salesforce Consulting AI Framework
**Researched:** 2026-04-04
**Overall Confidence:** HIGH (versions verified via npm registry, peer dependencies cross-checked)

## Version Verification Method

All versions below were retrieved live from the npm registry on 2026-04-04. Peer dependency compatibility was cross-checked between packages. Where my training data could not confirm a feature (e.g., Prisma 7 pgvector native support), I have flagged confidence accordingly.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.2.2 | Full-stack React framework (App Router) | Latest stable, released Oct 2025, 6 months mature. Clerk supports `^16.0.10+`. React 19 support. Server Components and Server Actions are stable. | HIGH |
| React | 19.2.4 | UI library | Peer dependency of Next.js 16. Server Components, `use()` hook, Actions are stable. | HIGH |
| TypeScript | 6.0.2 | Type safety | Latest stable. Required by Inngest (`>=5.8.0`). | HIGH |

**Decision: Next.js 16 over 15.** Next.js 16 has been stable since October 2025. Clerk 7.x explicitly supports it (`^16.0.10`). Inngest supports `>=12.0.0`. Starting a greenfield project on 15.x would mean a major version upgrade within months. Use 16.

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 16+ | Primary database | Industry standard. Neon and Supabase both default to PG 16+. Required for pgvector and tsvector. | HIGH |
| Prisma ORM | 7.6.0 | Database ORM/query builder | Latest stable. Major version jump from 6.x to 7.x happened in this cycle. Prisma 7 includes significant performance improvements and better relation loading. | HIGH |
| @prisma/client | 7.6.0 | Runtime query engine | Must match prisma CLI version exactly. | HIGH |
| @prisma/adapter-neon | 7.6.0 | Neon serverless adapter | Required for Prisma + Neon over WebSockets on Vercel serverless. Must match Prisma version. | HIGH |
| @neondatabase/serverless | 1.0.2 | Neon WebSocket driver | Neon's serverless-compatible PostgreSQL driver. Required by `@prisma/adapter-neon`. | HIGH |

### pgvector and tsvector Strategy

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| pgvector (PG extension) | 0.7+ | Vector similarity search | Installed server-side on Neon (enabled by default). Stores embeddings for semantic search. | HIGH |
| pgvector (npm) | 0.2.1 | Node.js pgvector utilities | Thin helper for formatting vectors. NOT required if using raw SQL via Prisma `$queryRaw`. | MEDIUM |

**pgvector with Prisma approach:** Prisma does not have native `vector` type support in its schema DSL. The proven pattern is:

1. Define the column in a Prisma migration using raw SQL (`ALTER TABLE ... ADD COLUMN embedding vector(1536)`)
2. Use `prisma.$queryRaw` or `prisma.$queryRawUnsafe` for vector operations (cosine similarity queries)
3. Create indexes via raw SQL in migrations: `CREATE INDEX ... USING ivfflat (embedding vector_cosine_ops)`
4. Use `Unsupported("vector(1536)")` in schema.prisma to acknowledge the column exists

**tsvector with Prisma approach:** Same pattern -- tsvector columns and GIN indexes are created via raw SQL migrations. Query via `$queryRaw` with `to_tsquery()`. Prisma does not support tsvector natively. This is a well-established pattern.

**Confidence on pgvector/tsvector approach:** MEDIUM -- the `$queryRaw` pattern works and is widely used, but I cannot confirm whether Prisma 7 added native vector support. Verify in Prisma 7 release notes before starting. If native support exists, use it. If not, `$queryRaw` is battle-tested.

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @clerk/nextjs | 7.0.8 | Auth, user management, RBAC | Locked stack choice. v7 explicitly supports Next.js 16 (`^16.0.10`). Handles sign-up, sign-in, session management, organizations, and role-based access. | HIGH |

**Clerk RBAC strategy:** Use Clerk Organizations with custom roles (SA, PM, BA, Developer, QA). Store Clerk `userId` as foreign key in your Postgres `User` table. Sync role data via Clerk webhooks to keep Postgres in sync for query-level access control.

### Background Jobs

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Inngest | 4.1.2 | Event-driven background jobs | Locked stack choice. Step functions with automatic retries, checkpoints, and fan-out. Vercel-native deployment. Free tier sufficient for V1. | HIGH |

**Inngest patterns for this project:**
- **Transcript processing:** Long-running step function with checkpoints (parse -> extract questions -> extract decisions -> synthesize)
- **Embedding generation:** Fan-out step function that processes chunks in parallel
- **Article refresh:** Scheduled cron function via Inngest
- **Dashboard synthesis:** Event-triggered after knowledge updates
- **Notification dispatch:** Event-triggered after state changes

**Inngest 4.x notes:** Inngest v4 is a significant release. Peer dependency on `zod ^3.25.0 || ^4.0.0` -- use Zod 4 if starting fresh (see below).

### AI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @anthropic-ai/sdk | 0.82.0 | Claude API client | Direct Claude API access. No provider abstraction in V1 per architecture decision. Use for agent harness, transcript processing, question answering. | HIGH |
| ai (Vercel AI SDK) | 6.0.146 | Streaming chat UI | Use ONLY for the chat interface streaming. Provides `useChat` hook, streaming response handling, and message management. Do NOT use for backend agent harness -- use `@anthropic-ai/sdk` directly for full control over context assembly. | HIGH |
| @ai-sdk/anthropic | 3.0.66 | Anthropic provider for Vercel AI SDK | Bridges Vercel AI SDK to Claude API. Required only if using `ai` SDK for chat streaming. | HIGH |

**AI SDK split rationale:** The Vercel AI SDK is excellent for chat UI streaming but adds unnecessary abstraction for backend agent work where you need precise control over context windows, tool definitions, and token budgets. Use `@anthropic-ai/sdk` directly for the three-layer agent harness. Use Vercel AI SDK only for the React chat components.

### File Storage

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @aws-sdk/client-s3 | 3.1024.0 | S3/R2 file operations | Works with both AWS S3 and Cloudflare R2 (S3-compatible API). For storing generated documents, transcripts, exports. | HIGH |

**S3 vs R2 decision:** Defer until deployment. Both use the same SDK. R2 has no egress fees (good for document downloads). S3 has broader ecosystem. Set endpoint URL via environment variable so you can switch without code changes.

### UI Components

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| shadcn/ui | latest (CLI-installed) | Component library | Not an npm package -- CLI copies components into your codebase. Tailwind-based, fully customizable, accessible. Industry standard for Next.js apps. | HIGH |
| Tailwind CSS | 4.2.2 | Utility-first CSS | Tailwind v4 is current. Major API changes from v3 (CSS-first config, `@theme` directive). Ensure shadcn/ui components are compatible with v4. | MEDIUM |
| @tanstack/react-table | 8.21.3 | Data tables | Headless table library. Handles sorting, filtering, pagination, column visibility. Pairs with shadcn/ui DataTable component. Essential for project management views. | HIGH |
| react-hook-form | 7.72.1 | Form management | Best form library for React. Uncontrolled by default, minimal re-renders. Pairs with Zod for validation. | HIGH |
| @hookform/resolvers | 5.2.2 | Form validation bridge | Connects react-hook-form to Zod schemas. | HIGH |
| Zod | 4.3.6 | Schema validation | Zod 4 is current (major release). Used for form validation, API input validation, env var validation. Inngest 4.x supports Zod 4. | MEDIUM |
| lucide-react | 1.7.0 | Icons | Default icon set for shadcn/ui. Consistent, tree-shakeable. | HIGH |
| sonner | 2.0.7 | Toast notifications | Best toast library for React. shadcn/ui integrates it natively. Use for in-app notification toasts. | HIGH |
| nuqs | 2.8.9 | URL search params state | Type-safe URL state management for Next.js. Essential for table filtering, pagination, and shareable URLs. | HIGH |
| class-variance-authority | 0.7.1 | Component variants | Used by shadcn/ui for variant definitions. | HIGH |
| clsx | 2.1.1 | Class name merging | Utility for conditional class names. | HIGH |
| tailwind-merge | 3.5.0 | Tailwind class deduplication | Resolves conflicting Tailwind classes. Used in `cn()` utility. | HIGH |
| date-fns | 4.1.0 | Date formatting/manipulation | Tree-shakeable, functional API. Better than moment.js or dayjs for bundle size. Use for sprint dates, timestamps, scheduling. | HIGH |

**Tailwind v4 warning:** Tailwind CSS 4 is a significant breaking change from v3. The config file moves from `tailwind.config.ts` to CSS-based configuration using `@theme`. shadcn/ui has been updating components for v4 compatibility but verify with `npx shadcn@latest init` that it scaffolds v4-compatible output. If issues arise, pin to Tailwind v3 (`3.4.x`) and upgrade later.

**Zod 4 warning:** Zod 4 is a major release with some API changes. Inngest 4.x supports it (`^3.25.0 || ^4.0.0`). However, verify that `react-hook-form` resolvers and `next-safe-action` work with Zod 4 before committing. If compatibility issues surface, use Zod 3.25.x (latest v3) as fallback.

### Document Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| docx | 9.6.1 | Word document generation | Programmatic .docx creation. For generating branded discovery docs, requirements docs. | HIGH |
| pptxgenjs | 4.0.1 | PowerPoint generation | Programmatic .pptx creation. For generating branded presentations. | HIGH |
| @react-pdf/renderer | 4.3.2 | PDF generation | React-based PDF rendering. For generating branded PDF exports. | MEDIUM |

### Server Actions and API Safety

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next-safe-action | 8.4.0 | Type-safe server actions | Adds Zod validation, middleware, and error handling to Next.js Server Actions. Prevents shipping unvalidated mutations. | HIGH |
| @t3-oss/env-nextjs | 0.13.11 | Environment variable validation | Type-safe env vars with Zod schemas. Catches missing env vars at build time, not runtime. | HIGH |

### Utilities

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @paralleldrive/cuid2 | 3.3.0 | ID generation | Collision-resistant, URL-safe, sortable IDs. Better than UUID for primary keys (shorter, sortable). Use as default ID strategy in Prisma schema. | HIGH |
| SWR | 2.4.1 | Client-side data fetching/caching | Lightweight alternative to TanStack Query. Good for polling (dashboard refresh, notification checks). Use `refreshInterval` for polling patterns instead of WebSockets. | HIGH |

**SWR vs TanStack Query:** SWR is simpler and sufficient for this app's needs (polling, revalidation, caching). TanStack Query is more powerful but adds complexity you do not need for V1. SWR's `refreshInterval` option handles the "near real-time" polling for dashboards and notifications cleanly.

### Dev Dependencies

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TypeScript | 6.0.2 | Type checking | Latest stable. | HIGH |
| ESLint | 10.2.0 | Linting | ESLint 10 is current. Use with `eslint-config-next`. | MEDIUM |
| Prettier | 3.8.1 | Code formatting | Latest stable. Use `prettier-plugin-tailwindcss` for class sorting. | HIGH |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Next.js version | 16.2.2 | 15.5.14 (backport) | Greenfield project -- start on current major. 15.x will stop receiving updates. |
| ORM | Prisma 7 | Drizzle ORM | Locked stack choice. Prisma has better migration tooling and broader ecosystem. |
| Background jobs | Inngest | BullMQ + Redis | Locked stack choice. Inngest is serverless-native, no Redis needed. |
| State management | SWR | TanStack Query | SWR is simpler, sufficient for polling patterns. TanStack Query is overkill for V1. |
| Form library | react-hook-form | Formik | RHF has better performance (uncontrolled), smaller bundle, better DX. |
| UI components | shadcn/ui | Radix UI directly | shadcn/ui wraps Radix with Tailwind styling -- saves time while staying customizable. |
| Date library | date-fns | dayjs | date-fns is tree-shakeable and functional. dayjs is smaller but less ergonomic. |
| ID generation | cuid2 | UUID v4 | cuid2 is shorter, sortable, URL-safe. Better for user-facing IDs. |
| CSS | Tailwind CSS | CSS Modules | Locked decision implied by shadcn/ui. Tailwind is faster for solo developer iteration. |
| AI chat UI | Vercel AI SDK | Custom streaming | AI SDK provides battle-tested streaming hooks. No reason to rewrite. |
| Toasts | Sonner | react-hot-toast | Sonner has better animations, promise-based API, shadcn integration. |

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| tRPC | Adds unnecessary abstraction when you already have Server Actions + next-safe-action. REST API for Claude Code is standard HTTP. |
| Redux / Zustand | No global client state complex enough to need a store. Server Components + SWR cover data needs. |
| Mongoose / MongoDB | Locked on PostgreSQL. Relational data model is correct for this domain. |
| Socket.io / WebSockets | Overkill for V1. SWR polling with `refreshInterval` is sufficient for dashboard refresh and notifications. V2 consideration. |
| Prisma Accelerate | Adds cost. Neon's connection pooling handles serverless connection limits. |
| NextAuth.js | Clerk is locked and provides better DX for role management + organization features. |
| Tailwind UI (paid) | shadcn/ui provides equivalent components for free. |
| Playwright | Explicitly out of scope for V1. |
| GraphQL | REST is simpler for the Claude Code API integration. No client needs complex nested queries. |

---

## Installation

```bash
# Core framework
npm install next@16.2.2 react@19.2.4 react-dom@19.2.4

# Database
npm install prisma@7.6.0 @prisma/client@7.6.0
npm install @neondatabase/serverless@1.0.2 @prisma/adapter-neon@7.6.0

# Auth
npm install @clerk/nextjs@7.0.8

# Background jobs
npm install inngest@4.1.2

# AI
npm install @anthropic-ai/sdk@0.82.0
npm install ai@6.0.146 @ai-sdk/anthropic@3.0.66

# File storage
npm install @aws-sdk/client-s3@3.1024.0

# UI
npm install tailwindcss@4.2.2
npm install @tanstack/react-table@8.21.3
npm install react-hook-form@7.72.1 @hookform/resolvers@5.2.2
npm install zod@4.3.6
npm install lucide-react@1.7.0 sonner@2.0.7 nuqs@2.8.9
npm install class-variance-authority@0.7.1 clsx@2.1.1 tailwind-merge@3.5.0
npm install date-fns@4.1.0
npm install @paralleldrive/cuid2@3.3.0
npm install swr@2.4.1

# Server actions and env
npm install next-safe-action@8.4.0
npm install @t3-oss/env-nextjs@0.13.11

# Document generation (Phase 4)
npm install docx@9.6.1 pptxgenjs@4.0.1 @react-pdf/renderer@4.3.2

# Dev dependencies
npm install -D typescript@6.0.2 @types/react @types/react-dom @types/node
npm install -D eslint@10.2.0 eslint-config-next
npm install -D prettier@3.8.1 prettier-plugin-tailwindcss

# shadcn/ui (run after project init)
npx shadcn@latest init
```

---

## Stack Compatibility Matrix

| Package A | Package B | Compatible? | Notes |
|-----------|-----------|-------------|-------|
| Next.js 16.2.2 | React 19.2.4 | YES | Next 16 peer depends on `^19.0.0` |
| Next.js 16.2.2 | Clerk 7.0.8 | YES | Clerk peer depends on `^16.0.10` |
| Next.js 16.2.2 | Inngest 4.1.2 | YES | Inngest peer depends on `>=12.0.0` |
| Inngest 4.1.2 | Zod 4.3.6 | YES | Inngest peer depends on `^3.25.0 \|\| ^4.0.0` |
| Prisma 7.6.0 | Neon adapter 7.6.0 | YES | Must match major.minor version |
| Vercel AI SDK 6.x | @ai-sdk/anthropic 3.x | VERIFY | Likely compatible but verify at install time |
| Tailwind 4.2.2 | shadcn/ui | VERIFY | shadcn/ui has been updating for v4 but confirm during init |
| react-hook-form 7.x | Zod 4.x | VERIFY | Check @hookform/resolvers 5.x supports Zod 4 |
| next-safe-action 8.x | Zod 4.x | VERIFY | Check compatibility at install time |

**Items marked VERIFY:** Run `npm install` and check for peer dependency warnings. If Zod 4 causes issues with any library, fall back to `zod@3.25.x` (latest v3 with Inngest compatibility).

---

## Key Risks and Mitigations

### Risk 1: Zod 4 Compatibility
Zod 4 is a major release. While Inngest explicitly supports it, other libraries (react-hook-form resolvers, next-safe-action) may lag.
**Mitigation:** Test `npm install` with all packages before writing code. Fall back to Zod 3.25.x if needed.

### Risk 2: Tailwind v4 Breaking Changes
Tailwind v4 changes config from JS to CSS. shadcn/ui components are being updated but edge cases may exist.
**Mitigation:** Use `npx shadcn@latest init` which handles v4 setup. If components break, Tailwind v3.4.x is a safe fallback.

### Risk 3: Prisma pgvector Requires Raw SQL
Prisma does not natively support vector types in its schema language. All vector operations require `$queryRaw`.
**Mitigation:** Create a dedicated `search.service.ts` module that encapsulates all raw SQL vector queries. Keep Prisma for all other CRUD. This is a well-established pattern.

### Risk 4: Next.js 16 is Relatively New
6 months old. Most ecosystem libraries support it but some niche packages may not.
**Mitigation:** All critical packages (Clerk, Inngest, AI SDK) have verified peer dependency support. Check niche packages at install time.

---

## Sources

- npm registry (live queries, 2026-04-04): All version numbers and peer dependencies
- Clerk peer dependencies: Verified `next: "^16.0.10"` support
- Inngest peer dependencies: Verified `next: ">=12.0.0"`, `zod: "^3.25.0 || ^4.0.0"`
- Next.js peer dependencies: Verified `react: "^18.2.0 || ^19.0.0"`
- Next.js 16.0.0 publish date: 2025-10-22 (6 months stable)
- Training data (May 2025): Used for architectural patterns and library selection rationale. Flagged as MEDIUM confidence where not independently verified.
