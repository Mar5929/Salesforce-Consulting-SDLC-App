# Salesforce Consulting AI Framework

Internal AI-powered web application for a Salesforce consulting firm. The firm's primary work management system, AI-powered knowledge base, and delivery accelerator.

## Your Roles

You are wearing these hats simultaneously: Seasoned Salesforce Technical Architect, Seasoned Salesforce Implementer, Seasoned Full Stack Developer and Architect, and AI Architect. Push back, challenge assumptions, and optimize for the best solution.

## Project Status

Using the **Build Execution Framework (BEF)**. At the start of every session, you MUST:

1. Read `docs/bef/PROJECT_STATE.md` — the top "Steps to Ship" table and "Current Focus" section define the high-level next steps for this project. Orient every response around the current step unless the user redirects.
2. Read the latest file in `.claude/threads/` for session context.
3. Read `docs/bef/ADDENDUM-INTEGRATION-PLAN.md` if the current step references it.

Run `/bef:status` for a formatted summary of state.

## Specification Files

These are the source of truth. Read them before making architecture or implementation decisions.

| File | Contents |
|------|----------|
| `docs/bef/PROJECT_STATE.md` | BEF state tracker: current phase, progress, replan log. Read first. |
| `docs/bef/00-prd/PRD.md` | Full product requirements (27 sections). The "what and why." |
| `docs/bef/01-architecture/TECHNICAL_SPEC.md` | Database schema, AI agent harness architecture, context window budget, dashboard implementation. The "how." |
| `docs/bef/02-phase-plan/PHASE_PLAN.md` | Master phase plan with dependencies. |
| `docs/bef/03-phases/phase-NN-*/` | Per-phase PHASE_SPEC.md and TASKS.md. |

## Project

**Salesforce Consulting AI Framework**

An internal AI-powered web application that standardizes how a Salesforce consulting firm delivers projects. It serves as the firm's primary work management system, AI-powered knowledge base, and delivery accelerator, used by the entire project team (PM, BA, QA, SA, developers) from kickoff through completion. The AI is a persistent, progressively-built project brain that accumulates knowledge during discovery and grows throughout the engagement. Developers work in Claude Code with custom skills that call back to the web app's REST API for context.

**Core Value:** The AI must retain and build understanding across sessions. Every discovery conversation, transcript, question, and decision feeds a persistent knowledge base that makes the AI progressively smarter about each project's business context, so the team never starts from scratch.

## Architecture (Locked Decisions)

- Web app is management/knowledge layer. Claude Code is developer execution layer. Boundary is REST API.
- AI agent harness: three-layer architecture (Task Definitions > Execution Engine > Context Assembly).
- One shared team sandbox per project, read-only. Periodic metadata sync (not real-time).
- Structured data in Postgres. Generated deliverables in S3. No Git involvement from the web app.
- Knowledge architecture: two-layer design (structured BusinessProcess relationships + AI-curated KnowledgeArticle synthesis).
- AI provider: Claude API only in V1. No provider abstraction. Clean module boundary for future swap.
- Deployment: Vercel for web app + serverless functions. Inngest for background jobs.
- Budget: Solo developer, cost-conscious. Inngest free tier, Vercel free/hobby tier initially.

## Technology Stack

### Core Framework
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.2.2 | Full-stack React framework (App Router) | Latest stable, released Oct 2025, 6 months mature. Clerk supports `^16.0.10+`. React 19 support. Server Components and Server Actions are stable. | HIGH |
| React | 19.2.4 | UI library | Peer dependency of Next.js 16. Server Components, `use()` hook, Actions are stable. | HIGH |
| TypeScript | 6.0.2 | Type safety | Latest stable. Required by Inngest (`>=5.8.0`). | HIGH |

### Database
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 16+ | Primary database | Industry standard. Neon and Supabase both default to PG 16+. Required for pgvector and tsvector. | HIGH |
| Prisma ORM | 7.6.0 | Database ORM/query builder | Latest stable. Major version jump from 6.x to 7.x. Prisma 7 includes significant performance improvements and better relation loading. | HIGH |
| @prisma/client | 7.6.0 | Runtime query engine | Must match prisma CLI version exactly. | HIGH |
| @prisma/adapter-neon | 7.6.0 | Neon serverless adapter | Required for Prisma + Neon over WebSockets on Vercel serverless. Must match Prisma version. | HIGH |
| @neondatabase/serverless | 1.0.2 | Neon WebSocket driver | Neon's serverless-compatible PostgreSQL driver. Required by `@prisma/adapter-neon`. | HIGH |

### pgvector and tsvector Strategy
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| pgvector (PG extension) | 0.7+ | Vector similarity search | Installed server-side on Neon (enabled by default). Stores embeddings for semantic search. | HIGH |
| pgvector (npm) | 0.2.1 | Node.js pgvector utilities | Thin helper for formatting vectors. NOT required if using raw SQL via Prisma `$queryRaw`. | MEDIUM |

### Authentication
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @clerk/nextjs | 7.0.8 | Auth, user management, RBAC | Locked stack choice. v7 explicitly supports Next.js 16 (`^16.0.10`). Handles sign-up, sign-in, session management, organizations, and role-based access. | HIGH |

### Background Jobs
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Inngest | 4.1.2 | Event-driven background jobs | Locked stack choice. Step functions with automatic retries, checkpoints, and fan-out. Vercel-native deployment. Free tier sufficient for V1. | HIGH |

Inngest usage patterns:
- **Transcript processing:** Long-running step function with checkpoints (parse -> extract questions -> extract decisions -> synthesize)
- **Embedding generation:** Fan-out step function that processes chunks in parallel
- **Article refresh:** Scheduled cron function via Inngest
- **Dashboard synthesis:** Event-triggered after knowledge updates
- **Notification dispatch:** Event-triggered after state changes

### AI
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @anthropic-ai/sdk | 0.82.0 | Claude API client | Direct Claude API access. No provider abstraction in V1 per architecture decision. Use for agent harness, transcript processing, question answering. | HIGH |
| ai (Vercel AI SDK) | 6.0.146 | Streaming chat UI | Use ONLY for the chat interface streaming. Provides `useChat` hook, streaming response handling, and message management. Do NOT use for backend agent harness. Use `@anthropic-ai/sdk` directly for full control over context assembly. | HIGH |
| @ai-sdk/anthropic | 3.0.66 | Anthropic provider for Vercel AI SDK | Bridges Vercel AI SDK to Claude API. Required only if using `ai` SDK for chat streaming. | HIGH |

### File Storage
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @aws-sdk/client-s3 | 3.1024.0 | S3/R2 file operations | Works with both AWS S3 and Cloudflare R2 (S3-compatible API). For storing generated documents, transcripts, exports. | HIGH |

### UI Components
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| shadcn/ui | latest (CLI-installed) | Component library | Not an npm package. CLI copies components into your codebase. Tailwind-based, fully customizable, accessible. Industry standard for Next.js apps. | HIGH |
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

### Dev Dependencies
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TypeScript | 6.0.2 | Type checking | Latest stable. | HIGH |
| ESLint | 10.2.0 | Linting | ESLint 10 is current. Use with `eslint-config-next`. | MEDIUM |
| Prettier | 3.8.1 | Code formatting | Latest stable. Use `prettier-plugin-tailwindcss` for class sorting. | HIGH |

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

## BEF Workflow

This project uses the **Build Execution Framework (BEF)** for planning and execution. All phases, specs, and tasks live in `docs/bef/`.

Use these entry points:
- `/bef:status` to see current project state
- `/bef:execute [phase#]` for planned phase work
- `/bef:deep-dive [phase#]` to spec out the next phase
- `/bef:replan` after completing a phase

Bug management (parallel track):
- `/bef:bug-detail` to investigate a bug with Playwright
- `/bef:bug-triage` to prioritize bugs into a fix plan
- `/bef:bug-execute` to dispatch parallel fix agents
- `/bef:bug-status` for bug tracking summary

For small fixes, doc updates, and bug fixes, direct edits are fine. BEF gates apply to phase-level work only.
