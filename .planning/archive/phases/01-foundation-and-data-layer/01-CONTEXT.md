# Phase 1: Foundation and Data Layer - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

The application boots, authenticates users, manages projects, and has the complete data model and background job infrastructure ready for feature development. Covers AUTH-01 through AUTH-06, PROJ-01 through PROJ-03, INFRA-01, INFRA-02, INFRA-04.

</domain>

<decisions>
## Implementation Decisions

### App Shell and Navigation
- **D-01:** Fixed left sidebar with navigation + main content area (Linear/Notion/Jira pattern). Sidebar contains project navigation, feature links, and settings.
- **D-02:** Sidebar project switcher at top of sidebar — dropdown showing current project, click to switch. No dedicated projects page needed for switching.

### Project Management UI
- **D-03:** Multi-step wizard for project creation: Step 1 (name, client, engagement type) > Step 2 (sandbox strategy) > Step 3 (invite team, assign roles). Guided flow ensures required fields are captured.
- **D-04:** Clean minimal visual style — Linear/Vercel aesthetic. Lots of whitespace, subtle borders, muted colors, sharp typography. Professional consulting tool feel. This is the design system foundation for all phases.

### Database Schema Strategy
- **D-05:** Deploy the full database schema upfront — all 30+ entities from the tech spec across phases 1-5. Avoids migration churn and lets future phases start without schema work.
- **D-06:** SESSION-3-TECHNICAL-SPEC.md is the canonical source for entity definitions. Generate Prisma schema directly from it.
- **D-07:** Use cuid2 for all record IDs — collision-resistant, URL-safe, sortable. Per tech stack decisions.

### Vector and Full-Text Search Types
- **D-08:** pgvector and tsvector handling is Claude's discretion. Choose the best approach for Prisma 7 + Neon at implementation time (raw SQL migrations, Unsupported type annotations, or hybrid).

### Role-Based Access Model
- **D-09:** Clerk Organizations for multi-project membership. Store 5 project-level roles (SA, PM, BA, Developer, QA) in ProjectMember table in Postgres, not Clerk metadata. Clerk handles auth, app handles authorization.
- **D-10:** Role enforcement at middleware level (route protection) and page level (show/hide nav items) in Phase 1. Component-level gating deferred to feature phases.
- **D-11:** Query-level project scoping — every database query includes projectId filter. Enforced via shared query helper or Prisma middleware that auto-appends active project scope.

### Inngest Job Patterns
- **D-12:** Inngest infrastructure + audit log job (AUTH-06) as first real function. Validates the infrastructure end-to-end with a real use case.
- **D-13:** 3 retries with exponential backoff as default retry policy. Individual functions can override.

### Claude's Discretion
- Inngest event naming convention (Claude picks based on Inngest best practices)
- pgvector/tsvector implementation strategy for Prisma 7
- Loading states, error boundaries, and empty state designs
- Exact sidebar layout details, spacing, and responsive behavior
- Prisma middleware vs. helper function approach for project scoping

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Full product requirements
- `SF-Consulting-AI-Framework-PRD-v2.1.md` — Complete PRD with 27 sections. Entity definitions, role permissions, feature specs, workflow descriptions.

### Technical architecture and schema
- `SESSION-3-TECHNICAL-SPEC.md` — Database schema (all entities with columns, types, indexes), AI agent harness architecture, context window budget, dashboard implementation. **Primary source for Prisma schema generation.**

### Tech stack and versions
- `CLAUDE.md` §Technology Stack — Locked versions for all dependencies. Compatibility matrix and installation commands.

### V2 scope boundary
- `V2-ROADMAP.md` — Features explicitly deferred to V2. Use to enforce scope boundaries.

### Requirements traceability
- `.planning/REQUIREMENTS.md` — Phase 1 requirements: AUTH-01 through AUTH-06, PROJ-01 through PROJ-03, INFRA-01, INFRA-02, INFRA-04.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. No existing source code.

### Established Patterns
- None yet. Phase 1 establishes all patterns: app shell layout, component structure, data fetching, styling approach.

### Integration Points
- Clerk SDK integration (auth provider)
- Neon/Supabase PostgreSQL connection via Prisma + @prisma/adapter-neon
- Inngest serve route (Next.js API route)
- Vercel deployment configuration

</code_context>

<specifics>
## Specific Ideas

- App should feel like Linear — clean, professional, fast. Not cluttered like Jira.
- Project switcher in sidebar like Slack/Linear workspace switcher.
- Wizard-style project creation to guide users through required configuration.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-and-data-layer*
*Context gathered: 2026-04-04*
