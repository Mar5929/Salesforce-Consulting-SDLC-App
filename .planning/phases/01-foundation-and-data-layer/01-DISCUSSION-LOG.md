# Phase 1: Foundation and Data Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 01-Foundation and Data Layer
**Areas discussed:** Project Management UI, Database Schema Strategy, Role-Based Access Model, Inngest Job Patterns

---

## Project Management UI

### App Shell Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar + content | Fixed left sidebar with navigation, main content area right. Linear/Notion/Jira style. | ✓ |
| Top nav + content | Horizontal top navbar with dropdowns, full-width content below. | |
| Collapsible sidebar | Left sidebar that can collapse to icons-only for more content space. | |

**User's choice:** Sidebar + content
**Notes:** Standard SaaS pattern, works well with multi-project model.

### Project Creation Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-step wizard | Step 1: Name + client + engagement type. Step 2: Sandbox strategy. Step 3: Invite team + assign roles. | ✓ |
| Single form | One page with all fields. | |
| Minimal then configure | Create with just name + client, configure everything else from settings. | |

**User's choice:** Multi-step wizard
**Notes:** None

### Project Switching

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar project switcher | Dropdown or list at top of sidebar showing current project. Linear/Slack style. | ✓ |
| Dedicated projects page | Navigate to /projects to see all projects and select one. | |

**User's choice:** Sidebar project switcher
**Notes:** None

### Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Clean minimal | Linear/Vercel aesthetic — whitespace, subtle borders, muted colors, sharp typography. | ✓ |
| Dense functional | Jira/GitHub style — information-dense, compact spacing. | |
| Warm approachable | Notion/Coda style — softer colors, rounded elements. | |

**User's choice:** Clean minimal
**Notes:** None

---

## Database Schema Strategy

### Schema Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full schema upfront | Deploy all entities from tech spec now. Avoids migration churn. | ✓ |
| Phase 1 entities only | Only create Phase 1 tables. Add more each phase. | |
| Phase 1 + stubs | Full Phase 1 entities, empty tables for later phases. | |

**User's choice:** Full schema upfront
**Notes:** None

### Schema Source

| Option | Description | Selected |
|--------|-------------|----------|
| Tech spec is canonical | Generate Prisma schema directly from SESSION-3-TECHNICAL-SPEC.md. | ✓ |
| Review first | Extract schema and present for review before generating. | |
| PRD + tech spec combined | Cross-reference both docs to resolve discrepancies. | |

**User's choice:** Tech spec is canonical
**Notes:** None

### ID Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| cuid2 | Collision-resistant, URL-safe, sortable. Per tech stack doc. | ✓ |
| UUID v4 | Standard UUIDs. Universally understood, native Postgres support. | |

**User's choice:** cuid2
**Notes:** None

### Vector Types (pgvector/tsvector)

| Option | Description | Selected |
|--------|-------------|----------|
| Raw SQL migrations | Prisma for standard schema, vector columns via raw SQL in custom migrations. | |
| Prisma Unsupported type | Use Prisma's Unsupported() type annotation. | |
| You decide | Claude picks best approach for Prisma 7. | ✓ |

**User's choice:** Claude's discretion
**Notes:** None

---

## Role-Based Access Model

### RBAC Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Clerk orgs + custom roles | Clerk Organizations for membership. 5 project-level roles in ProjectMember table. | ✓ |
| Clerk metadata only | Store roles in Clerk user/org metadata. | |
| Fully custom | Clerk only for auth, all role/membership logic in Postgres. | |

**User's choice:** Clerk orgs + custom roles
**Notes:** None

### Enforcement Level

| Option | Description | Selected |
|--------|-------------|----------|
| Middleware + page-level | Enforce roles at middleware (route protection) and page level (show/hide nav). | ✓ |
| Full component-level | Complete RBAC with component-level permissions now. | |
| Basic auth only | Just check authenticated + project member. Roles deferred. | |

**User's choice:** Middleware + page-level
**Notes:** None

### Data Isolation

| Option | Description | Selected |
|--------|-------------|----------|
| Query-level scoping | Every query includes projectId filter via shared helper or Prisma middleware. | ✓ |
| Row-level security (RLS) | Postgres RLS policies for database-level isolation. | |
| You decide | Claude picks best approach for Prisma + Neon. | |

**User's choice:** Query-level scoping
**Notes:** None

---

## Inngest Job Patterns

### Infra Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Infra + audit log job | Set up client, serve route, types. Plus audit logging job (AUTH-06) as first real function. | ✓ |
| Infrastructure only | Just Inngest client, serve route, event types, retry config. | |
| Infra + multiple stubs | Infrastructure plus stub functions for all Phase 2-5 job types. | |

**User's choice:** Infra + audit log job
**Notes:** None

### Event Naming Convention

| Option | Description | Selected |
|--------|-------------|----------|
| domain/action format | e.g., "project/created", "transcript/processing.started" | |
| dot notation | e.g., "project.created", "transcript.processing.started" | |
| You decide | Claude picks based on Inngest best practices. | ✓ |

**User's choice:** Claude's discretion
**Notes:** User asked Claude to use recommended defaults for remaining questions.

### Retry Policy

| Option | Description | Selected |
|--------|-------------|----------|
| 3 retries, exponential backoff | Standard pattern. Individual functions can override. | ✓ |
| 5 retries, more aggressive | More attempts for critical jobs. | |
| You decide | Claude sets appropriate config per Inngest best practices. | |

**User's choice:** 3 retries, exponential backoff (recommended default)
**Notes:** User asked Claude to use recommended defaults for remaining questions.

---

## Claude's Discretion

- Inngest event naming convention
- pgvector/tsvector implementation strategy for Prisma 7
- Loading states, error boundaries, and empty state designs
- Sidebar layout details, spacing, responsive behavior
- Prisma middleware vs. helper function for project scoping

## Deferred Ideas

None — discussion stayed within phase scope.
