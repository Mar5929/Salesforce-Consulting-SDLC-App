# Salesforce Consulting AI Framework

## What This Is

An internal AI-powered web application that standardizes how a Salesforce consulting firm delivers projects. It serves as the firm's primary work management system, AI-powered knowledge base, and delivery accelerator — used by the entire project team (PM, BA, QA, SA, developers) from kickoff through completion. The AI is a persistent, progressively-built project brain that accumulates knowledge during discovery and grows throughout the engagement. Developers work in Claude Code with custom skills that call back to the web app's REST API for context.

## Core Value

The AI must retain and build understanding across sessions — every discovery conversation, transcript, question, and decision feeds a persistent knowledge base that makes the AI progressively smarter about each project's business context, so the team never starts from scratch.

## Requirements

### Validated

- [x] Full PostgreSQL data model (44 models, 47 enums) — Validated in Phase 1: Foundation and Data Layer
- [x] Clerk authentication with role-based access (SA, PM, BA, Developer, QA) — Validated in Phase 1: Foundation and Data Layer
- [x] Project creation and management workflow — Validated in Phase 1: Foundation and Data Layer
- [x] Inngest background job infrastructure — Validated in Phase 1: Foundation and Data Layer (audit log function operational)
- [x] Epic/feature/user story CRUD with mandatory field validation — Validated in Phase 3: Story Management and Sprint Intelligence
- [x] AI-assisted story generation from requirements and discovery context — Validated in Phase 3: Story Management and Sprint Intelligence
- [x] Sprint creation, management, and intelligence (conflict detection, dependency ordering, capacity) — Validated in Phase 3: Story Management and Sprint Intelligence
- [x] Sprint dashboard — Validated in Phase 3: Story Management and Sprint Intelligence
- [x] Salesforce org OAuth connection and metadata sync — Validated in Phase 4: Salesforce Org Connectivity and Developer Integration
- [x] Org knowledge base (OrgComponent, OrgRelationship, DomainGrouping, BusinessProcess mapping) — Validated in Phase 4: Salesforce Org Connectivity and Developer Integration
- [x] REST API for Claude Code (context package assembly, org queries, story status updates) — Validated in Phase 4: Salesforce Org Connectivity and Developer Integration
- [x] Claude Code skill updates to consume web app API — Validated in Phase 4: Salesforce Org Connectivity and Developer Integration
- [x] Full PostgreSQL data model (44 models, 47 enums) — Validated in Phase 1: Foundation and Data Layer (schema validates, client generates; db push pending DATABASE_URL)
- [x] Question system with full lifecycle, confidence scoring, and review flagging — Validated in Phase 2: Discovery and Knowledge Brain
- [x] AI agent harness (three-layer: task definitions, execution engine, context assembly) — Validated in Phase 2: Discovery and Knowledge Brain
- [x] Transcript processing via AI (extract questions, decisions, requirements, risks) — Validated in Phase 2: Discovery and Knowledge Brain
- [x] AI question answering with impact assessment — Validated in Phase 2: Discovery and Knowledge Brain
- [x] Chat interface (general project chat + task-specific sessions) — Validated in Phase 2: Discovery and Knowledge Brain
- [x] Inngest background job infrastructure (article refresh, dashboard synthesis, embedding gen, notifications) — Validated in Phase 2: Discovery and Knowledge Brain
- [x] In-app notification system (10 event types, priority-based) — Validated in Phase 2: Discovery and Knowledge Brain
- [x] Three-layer search (filtered + full-text via tsvector + semantic via pgvector) — Validated in Phase 2: Discovery and Knowledge Brain
- [x] Discovery dashboard (outstanding questions, blocked items, health scores) — Validated in Phase 2: Discovery and Knowledge Brain
- [x] Three-layer knowledge architecture (structured relationships + AI-curated articles + semantic retrieval) — Validated in Phase 2: Discovery and Knowledge Brain
- [x] Branded document generation (Word, PowerPoint, PDF) — Validated in Phase 5: Document Generation, QA, and Administration
- [x] QA workflow (test execution tracking, defect management) — Validated in Phase 5: Document Generation, QA, and Administration
- [x] Optional client Jira sync (one-directional push) — Validated in Phase 5: Document Generation, QA, and Administration
- [x] Project archival workflow — Validated in Phase 5: Document Generation, QA, and Administration
- [x] PM dashboard — Validated in Phase 5: Document Generation, QA, and Administration
- [x] sandboxStrategy persistence and question category filter — Validated in Phase 6: Schema Fixes
- [x] Story generation E2E wiring (epicId through chat, StoryDraftCards rendering) — Validated in Phase 7: Story Generation E2E Wiring
- [x] Event wiring fixes (dashboard auto-refresh, Jira sync field names, retry consumer) — Validated in Phase 8: Event Wiring and Integration Fixes
- [x] Sidebar navigation and badge count wiring — Validated in Phase 9: Navigation and Badge Fixes

### Active

None — all v1 requirements validated.

### Out of Scope

- Mobile app — web-first, mobile deferred to V2
- Real-time collaborative editing — V2 (V2-ROADMAP Section 1.2)
- Provider-agnostic AI abstraction — Claude-only in V1, clean module boundary for V2
- Firm administrator UI — hardcoded firm-level settings in V1
- Playwright test integration — V2 (V2-ROADMAP Section 4.1)
- AI output quality benchmarking — V2 (V2-ROADMAP Section 2.3)
- Email/push notifications — in-app only in V1
- OAuth login (Google, GitHub) — email/password via Clerk sufficient
- Git repository management from web app — V2
- QA access to chat/decisions/transcripts — partial V1 (questions + draft stories only)
- Activity feed / change history UI — V2
- Developer transcript processing — SA/BA only in V1
- Large transcript handling (20K+ words) — V2

## Context

- **Solo builder:** Built by the firm owner (Michael Rihm) using Claude Code. No team of developers.
- **7 sessions of architecture work:** PRD v2.3 and tech spec are comprehensive — 27 PRD sections, full entity schemas, context assembly architecture, Inngest job specs, search infrastructure, brownfield ingestion pipeline.
- **Two-layer knowledge architecture:** Structured BusinessProcess relationships (queryable) + AI-curated KnowledgeArticle synthesis (persistent understanding). Semantic retrieval via pgvector embeddings.
- **Dual-source developer context:** Web app provides business intelligence (knowledge articles, business processes, decisions). SF CLI provides live technical reality (source code, metadata).
- **Four-phase brownfield ingestion:** Parse -> Classify -> Synthesize -> Articulate. Phases 3+4 run as single AI call.
- **AI ambiguity handling:** Context-dependent (ask inline when user present, best-guess + flag in task sessions, flag-only in background jobs).
- **Chat model:** General project chat (one per project) + task-specific sessions (transcript processing, story generation, briefings). All conversations persist.
- **Workflow sanity check complete:** All 5 persona workflows traced end-to-end. 20 issues found and resolved in PRD v2.3.

## Constraints

- **Tech stack:** Next.js (App Router), PostgreSQL (Neon/Supabase), Prisma ORM, Clerk auth, S3/R2 file storage, Claude API (Anthropic), Inngest — all locked
- **Architecture:** Web app = management/knowledge layer. Claude Code = developer execution layer. Boundary is REST API.
- **AI provider:** Claude API only in V1. No provider abstraction. Clean module boundary for future swap.
- **Sandbox model:** One shared team sandbox per project, read-only. Periodic metadata sync (not real-time).
- **Deployment:** Vercel for web app + serverless functions. Inngest for background jobs.
- **Budget:** Solo developer, cost-conscious — Inngest free tier, Vercel free/hobby tier initially.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Postgres over graph DB for knowledge | V1 scale doesn't need graph traversals; bottleneck is AI context, not query performance | -- Pending |
| Two-layer knowledge architecture | Need both queryable structure AND persistent AI understanding | -- Pending |
| AI writes directly, humans correct | Faster knowledge accumulation; mirrors DomainGrouping pattern with isConfirmed flag | -- Pending |
| Inngest for background jobs | Event-driven, automatic retries, step functions with checkpoints, Vercel-native | -- Pending |
| Hybrid chat model (general + sessions) | General chat for quick discovery; task sessions for heavy-lift work with cost tracking | -- Pending |
| Three-layer search | Filtered for structured queries, full-text for exact matching, semantic for meaning-based | -- Pending |
| In-app notifications only in V1 | Simpler implementation; email/push deferred to V2 | -- Pending |
| Context-dependent AI ambiguity handling | Different confidence/flagging behavior based on user presence and task type | -- Pending |
| Status transitions split by role | PM manages lifecycle states, devs manage execution states, auto-transition on sprint assignment | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-07 — all 9 phases complete, v1.0 milestone achieved (93/93 requirements satisfied)*
