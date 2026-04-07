# Salesforce Consulting AI Framework

An internal AI-powered web application that standardizes how a Salesforce consulting firm delivers projects. Serves as the firm's primary work management system, AI-powered knowledge base, and delivery accelerator — used by the entire project team (PM, BA, QA, SA, developers) from kickoff through completion.

## Core Concept

The AI is a persistent, progressively-built **project brain** that accumulates knowledge during discovery and grows throughout the engagement. Every transcript, question, decision, and conversation feeds a knowledge base that makes the AI progressively smarter about each project's business context. The team never starts from scratch.

## Key Features

- **Question System** — Full lifecycle tracking (Open > Scoped > Owned > Answered > Reviewed) with AI-powered impact assessment
- **Transcript Processing** — Upload meeting transcripts; AI extracts questions, decisions, requirements, and risks
- **Knowledge Architecture** — Two-layer design: structured BusinessProcess relationships + AI-curated KnowledgeArticle synthesis with semantic search via pgvector
- **AI Chat** — General project chat and task-specific sessions (transcript processing, story generation, briefings) with streaming responses
- **Work Management** — Epic > Feature > Story hierarchy with AI-assisted story generation from discovery context
- **Sprint Intelligence** — Component-level conflict detection and dependency ordering between stories
- **Salesforce Org Connectivity** — OAuth connection, metadata sync, brownfield ingestion pipeline (Parse > Classify > Synthesize > Articulate)
- **Developer API** — REST API exposing context packages for Claude Code consumption
- **Document Generation** — Branded Word, PowerPoint, and PDF documents populated by AI from project knowledge
- **QA Workflow** — Test execution recording and defect lifecycle management
- **Jira Sync** — Optional one-directional push to client Jira instances
- **PM Dashboard** — Aggregated views across project dimensions with AI usage tracking
- **Discovery Dashboard** — Outstanding questions, blocked items, health scores, AI-generated focus summaries

## Architecture

```
Web App (Next.js)                    Claude Code
Management + Knowledge Layer         Developer Execution Layer
         |                                    |
         +------------- REST API -------------+
```

- **Web app** handles project management, knowledge accumulation, and AI interactions
- **Claude Code** handles developer execution with custom skills that call back to the web app API
- **Inngest** handles background jobs: transcript processing, embedding generation, article refresh, dashboard synthesis, notifications

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) with Prisma 7 ORM |
| Auth | Clerk (role-based: SA, PM, BA, Developer, QA) |
| AI | Claude API (Anthropic) + Vercel AI SDK for chat streaming |
| Background Jobs | Inngest |
| File Storage | S3 / Cloudflare R2 |
| UI | shadcn/ui + Tailwind CSS 4 |
| Search | Filtered + tsvector full-text + pgvector semantic |
| Deployment | Vercel |

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or a [Neon](https://neon.tech) account)
- [Clerk](https://clerk.com) account
- [Anthropic](https://console.anthropic.com) API key
- [Inngest](https://inngest.com) account (optional for local dev)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Mar5929/Salesforce-Consulting-SDLC-App.git
cd Salesforce-Consulting-SDLC-App

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your credentials in .env.local

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.example` for all required variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Clerk authentication |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client-side auth |
| `SF_TOKEN_ENCRYPTION_KEY` | Salesforce credential encryption (32+ chars) |
| `SF_CONNECTED_APP_CLIENT_ID` | Salesforce OAuth connected app |
| `SF_CONNECTED_APP_CLIENT_SECRET` | Salesforce OAuth secret |
| `NEXT_PUBLIC_APP_URL` | App URL for OAuth callbacks |
| `ANTHROPIC_API_KEY` | Claude API access |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production (runs prisma generate first)
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run tests with Vitest
```

## Project Structure

```
src/
  actions/        # Server actions (type-safe with next-safe-action + Zod)
  app/            # Next.js App Router pages and API routes
    (auth)/       # Sign-in / sign-up pages
    (dashboard)/  # Main application (projects, chat, knowledge, etc.)
    api/          # REST API routes (chat, inngest, v1 developer API)
  components/     # React components
    layout/       # App shell, sidebar, navigation
    shared/       # Reusable UI components
    ui/           # shadcn/ui base components
  lib/            # Core libraries
    ai/           # Agent harness, task definitions, context assembly
    inngest/      # Background job definitions and event types
prisma/
  schema.prisma   # Database schema (44 models, 47 enums)
tests/            # Vitest test suites
```

## License

Private. Internal use only.
