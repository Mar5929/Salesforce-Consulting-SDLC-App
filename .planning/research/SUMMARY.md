# Research Summary: Salesforce Consulting AI Framework

**Domain:** AI-powered project management + knowledge base for Salesforce consulting
**Researched:** 2026-04-04
**Overall confidence:** HIGH (core stack versions verified via npm registry; architectural patterns from training data at MEDIUM)

## Executive Summary

The locked technology stack (Next.js, PostgreSQL/Neon, Prisma, Clerk, Inngest, Claude API) is well-suited for this application. All major packages have current stable releases that are mutually compatible, with Next.js 16.2.2 as the recommended framework version (stable since October 2025, supported by Clerk 7.x and Inngest 4.x).

The primary technical complexity lies in three areas: (1) the pgvector/tsvector integration with Prisma, which requires raw SQL for vector operations since Prisma lacks native vector type support; (2) the AI agent harness architecture, which should use the Anthropic SDK directly rather than the Vercel AI SDK to maintain precise control over context windows and token budgets; and (3) Inngest step function design for long-running operations like transcript processing and embedding generation.

The ecosystem is mature. shadcn/ui + TanStack Table + react-hook-form is the standard UI stack for data-heavy Next.js applications. SWR with polling intervals is sufficient for near-real-time features (dashboard refresh, notifications) without WebSocket complexity. The Vercel AI SDK should be used exclusively for the chat UI streaming layer.

One area requiring caution is Zod 4 compatibility. Zod 4 is a major release that Inngest supports, but react-hook-form resolvers and next-safe-action may not fully support it yet. Testing the full dependency tree before committing to Zod 4 vs 3.25.x is the first action item.

## Key Findings

**Stack:** Next.js 16.2.2 + Prisma 7.6.0 + Clerk 7.0.8 + Inngest 4.1.2 + Anthropic SDK 0.82.0 -- all current stable, all compatible.
**Architecture:** Server Components for data display, Server Actions for mutations, SWR for client polling, Inngest for background work, raw SQL for vector operations.
**Critical pitfall:** Prisma does not support vector types natively -- plan for a `$queryRaw` abstraction layer from day one.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation and Database** - Schema, auth, project CRUD
   - Addresses: Full PostgreSQL data model, Clerk auth, project management
   - Avoids: Premature AI integration before data layer is solid
   - Install and verify entire dependency tree here; resolve Zod 4 / Tailwind v4 issues early

2. **Discovery and Knowledge Brain** - Question system, agent harness, transcript processing
   - Addresses: Core value proposition -- persistent AI knowledge base
   - Avoids: Building sprint management before the knowledge layer exists
   - pgvector/tsvector integration happens here; requires raw SQL patterns

3. **Story Management and Sprint Intelligence** - Epics, stories, sprints
   - Addresses: Work management features that depend on knowledge context
   - Avoids: Starting sprint work before AI context assembly is proven

4. **Salesforce Org Connectivity** - OAuth, metadata sync, REST API
   - Addresses: Developer integration, Claude Code skills
   - Avoids: Building external integrations before internal platform is solid

5. **Document Generation, QA, and Polish** - Branded docs, testing, defects
   - Addresses: Output artifacts, quality workflows
   - Avoids: Polish before core features work

**Phase ordering rationale:**
- Foundation first because every feature depends on schema + auth
- Knowledge Brain second because it is the core value (PRD: "AI must retain and build understanding across sessions")
- Sprint management third because AI-assisted story generation depends on the knowledge layer
- Org connectivity fourth because it is an external integration that benefits from stable internal APIs
- Document generation last because it is output-focused and lowest risk

**Research flags for phases:**
- Phase 2: Needs deeper research on Inngest step function patterns for transcript processing
- Phase 2: Needs deeper research on pgvector index tuning (IVFFlat vs HNSW)
- Phase 4: Needs deeper research on Salesforce OAuth flow and metadata API patterns
- Phase 5: docx/pptxgenjs patterns are straightforward, unlikely to need research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack versions | HIGH | All verified via npm registry on 2026-04-04 |
| Peer dependency compatibility | HIGH | Cross-checked via npm `peerDependencies` |
| Zod 4 ecosystem compatibility | MEDIUM | Inngest confirmed, RHF/next-safe-action unverified |
| Tailwind v4 + shadcn/ui | MEDIUM | Both are current but major version transition -- verify during init |
| Prisma pgvector patterns | MEDIUM | Pattern is well-established but cannot confirm Prisma 7 changes without release notes |
| Architecture patterns | MEDIUM | Based on training data, not independently verified against current docs |
| Inngest 4.x patterns | MEDIUM | Version confirmed, specific API patterns from training data |

## Gaps to Address

- **Prisma 7 release notes:** Verify whether Prisma 7 added native vector type support (would change pgvector strategy significantly)
- **Zod 4 ecosystem test:** Run `npm install` with full dependency tree before writing any code
- **Tailwind v4 + shadcn/ui:** Verify `npx shadcn@latest init` produces v4-compatible output
- **Inngest 4.x API changes:** Verify step function API syntax against Inngest v4 docs
- **Claude API pricing/limits:** Verify current Claude model pricing for token budget planning
- **Neon free tier limits:** Verify connection limits, storage, and compute for V1 deployment
