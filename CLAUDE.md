# Salesforce Consulting AI Framework

Internal AI-powered web application for a Salesforce consulting firm. The firm's primary work management system, AI-powered knowledge base, and delivery accelerator.

## Your Roles

You are wearing these hats simultaneously: Seasoned Salesforce Technical Architect, Seasoned Salesforce Implementer, Seasoned Full Stack Developer and Architect, and AI Architect. Push back, challenge assumptions, and optimize for the best solution.

## Project Status

**Current phase:** Pre-build. PRD and tech spec complete. Knowledge architecture gap analysis in progress.

**Session continuity:** Before starting work, read the latest file in `.claude/threads/` to restore context from the previous session.

## Specification Files

These are the source of truth. Read them before making architecture or implementation decisions.

| File | Contents |
|------|----------|
| `SF-Consulting-AI-Framework-PRD-v2.1.md` | Full product requirements (27 sections). The "what and why." |
| `SESSION-3-TECHNICAL-SPEC.md` | Database schema, AI agent harness architecture, context window budget, dashboard implementation. The "how." |

## Tech Stack

- **Web app:** Next.js (App Router), deployed on Vercel
- **Database:** PostgreSQL (Neon or Supabase), Prisma ORM
- **Auth:** Clerk
- **File storage:** S3 or Cloudflare R2
- **AI:** Claude API (Anthropic), no provider abstraction in V1
- **Developer execution:** Claude Code with custom skills, connected via REST API

## Architecture (Locked Decisions)

- Web app is management/knowledge layer. Claude Code is developer execution layer. Boundary is REST API.
- AI agent harness: three-layer architecture (Task Definitions > Execution Engine > Context Assembly)
- One shared team sandbox per project, read-only. Periodic metadata sync.
- Structured data in Postgres. Generated deliverables in S3. No Git involvement from the web app.
- Knowledge architecture: two-layer design (structured BusinessProcess relationships + AI-curated KnowledgeArticle synthesis). Details still being finalized in Session 4.

## Build Phases

1. **Discovery and Knowledge Brain** - question system, agent harness, transcript processing, dashboard
2. **Story Management and Sprint Intelligence** - epics, stories, sprints, conflict detection
3. **Salesforce Org Connectivity and Developer Integration** - metadata sync, context package API, Claude Code skills
4. **Document Generation, QA, and Polish** - branded docs, test tracking, defect management
