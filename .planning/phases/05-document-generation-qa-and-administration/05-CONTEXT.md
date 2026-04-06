# Phase 5: Document Generation, QA, and Administration - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The platform produces branded deliverables, supports QA workflows, and provides PM-level administration including Jira sync and project archival. Covers DOC-01 through DOC-04, QA-01 through QA-03, ADMIN-01 through ADMIN-03, PROJ-04, PROJ-05.

</domain>

<decisions>
## Implementation Decisions

### Document Generation UX
- **D-01:** Template gallery as primary hub -- dedicated "Documents" page in sidebar with branded template cards (Discovery Report, Requirements Doc, Sprint Summary, Executive Brief, etc.). PM picks template, configures scope/sections, previews, then generates.
- **D-02:** AI content population runs as Inngest step function using the existing agent harness (Phase 2). PM sees a progress indicator during generation. Output stored in S3/R2 with version tracking per DOC-03.
- **D-03:** Document preview before download -- rendered preview in-browser (PDF inline, Word/PPT as formatted preview). Download buttons for final format.
- **D-04:** Version history per document type per project -- table showing generation date, template used, who generated, file size. Re-generate creates a new version, doesn't overwrite.
- **D-05:** Branding templates enforce firm visual identity via configuration (logo, colors, fonts) stored at the firm level. Hardcoded in V1 per constraints (no firm admin UI). Per DOC-04.

### QA Test/Defect Workflow
- **D-06:** Test execution recorded at the story level -- each story shows a "QA" tab with test cases. QA marks Pass/Fail/Blocked with notes per test case. Reuses table pattern from Phase 2/3.
- **D-07:** Defect creation from failed test cases -- "Create Defect" action auto-links to the story and pre-populates context. Defects also creatable standalone from a dedicated "Defects" view.
- **D-08:** Defect lifecycle: Open > In Progress > Fixed > Verified > Closed. Table+kanban toggle (consistent with questions and sprint board patterns). Defect detail as slide-over panel (consistent with story creation from Phase 3 D-05).
- **D-09:** Defects linked to stories via join table. Story detail view shows linked defects count badge. Defect detail shows linked story.
- **D-10:** QA dashboard section showing test execution summary (pass/fail/blocked counts), open defect count by severity, defect aging.

### PM Dashboard and Cost Tracking
- **D-11:** PM dashboard as a dedicated page extending the existing discovery dashboard pattern (`src/components/dashboard/`). Sections: project health (reuses Phase 2 health score), work progress (stories by status), sprint velocity, AI usage/cost summary, team activity.
- **D-12:** AI token usage displayed as charts -- cost over time (line chart), cost by feature area (bar chart: transcripts, questions, knowledge, story generation, doc generation), cumulative total. Data sourced from existing AgentExecution records.
- **D-13:** Dashboard data pre-computed via Inngest-triggered synthesis (consistent with Phase 2 D-25). Polling refresh via SWR `refreshInterval`.
- **D-14:** Aggregated project dimensions: stories by status, by assignee, by sprint; questions by status; knowledge coverage; defects by severity.

### Jira Sync and Project Archival
- **D-15:** Jira sync as optional project setting. PM enters Jira instance URL + API token (encrypted at rest per AUTH-05 pattern). One-directional push only -- no inbound sync. Per ADMIN-01.
- **D-16:** Push scope: stories and their status updates. Mapped fields: title, description, status, priority, story points. Sync runs as Inngest background job on story status change events.
- **D-17:** Sync status visible per story -- badge showing "Synced" / "Pending" / "Failed" with last sync timestamp. Bulk retry for failed syncs.
- **D-18:** Project archival via project settings. PM clicks "Archive Project" -- confirmation dialog, then project becomes read-only. All data retained. Visual indicator (muted/locked state) on archived projects. Per PROJ-04.
- **D-19:** Reactivation via archived project's settings page. PM clicks "Reactivate" -- confirmation dialog, project returns to active state. Per PROJ-05.

### Claude's Discretion
- Document template HTML/layout specifics and S3 key structure for storage
- Chart library for PM dashboard (recharts or similar)
- Jira REST API field mapping details and error handling strategy
- Loading skeletons and empty states for all new views
- Test case data model details (inline on story vs separate entity)
- Exact branding configuration structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Full product requirements
- `SF-Consulting-AI-Framework-PRD-v2.1.md` -- Complete PRD. Document generation (DOC-01-04), QA workflow (QA-01-03), project administration (ADMIN-01-03), project archival (PROJ-04-05).

### Technical architecture and schema
- `SESSION-3-TECHNICAL-SPEC.md` -- Database schema for Document, DocumentVersion, TestExecution, Defect, JiraSync models. AI agent harness architecture (reused for document content generation). Context window budget for AI-populated docs.

### Tech stack and versions
- `CLAUDE.md` Technology Stack -- Locked versions: `docx` for Word, `pptxgenjs` for PowerPoint, `@react-pdf/renderer` for PDF. `@aws-sdk/client-s3` for S3/R2 storage. Inngest for background jobs. SWR for polling refresh.

### Phase 1 context (design system and infrastructure)
- `.planning/phases/01-foundation-and-data-layer/01-CONTEXT.md` -- D-01 (sidebar layout), D-04 (Linear/Vercel aesthetic), D-05 (full schema deployed), D-09 (Clerk Organizations + role in Postgres), D-11 (query-level project scoping), D-12/D-13 (Inngest patterns).

### Phase 2 context (dashboard and agent harness patterns)
- `.planning/phases/02-discovery-and-knowledge-brain/02-CONTEXT.md` -- D-24/D-25 (dashboard with pre-computed cached data via Inngest), D-31-D-35 (AI agent harness patterns for task definitions and execution).

### Phase 3 context (UI patterns for tables, kanban, panels)
- `.planning/phases/03-story-management-and-sprint-intelligence/03-CONTEXT.md` -- D-01 (breadcrumb drill-down + table/kanban toggle), D-05 (slide-over panel for creation), D-09 (role-split status transitions), D-13 (dashboard with charts).

### Existing code patterns
- `src/lib/inngest/events.ts` -- Event definitions pattern for adding doc generation, Jira sync, and archival events.
- `src/lib/safe-action.ts` -- Server action pattern with auth middleware.
- `src/lib/project-scope.ts` -- `scopedPrisma()` for project-level data isolation.
- `src/lib/agent-harness/` -- AI task infrastructure for document content generation.
- `src/lib/encryption.ts` -- Encryption utilities for Jira API token storage (per AUTH-05 pattern).
- `src/components/dashboard/` -- Existing dashboard components to extend for PM dashboard.

### Requirements traceability
- `.planning/REQUIREMENTS.md` -- Phase 5 requirements: DOC-01 through DOC-04, QA-01 through QA-03, ADMIN-01 through ADMIN-03, PROJ-04, PROJ-05.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/dashboard/` -- Discovery dashboard components (ai-summary-card, blocked-items, health-score, outstanding-questions). PM dashboard can extend this pattern and reuse health-score.
- `src/components/shared/empty-state.tsx` -- Reusable empty state component for new views.
- `src/components/ui/` -- Full shadcn component library (card, table, dialog, sheet, badge, tabs, progress, skeleton).
- `src/lib/agent-harness/` -- Three-layer AI architecture for document content generation tasks.
- `src/lib/inngest/` -- Background job infrastructure with event patterns, retry policies, step functions.
- `src/lib/encryption.ts` -- Encryption utilities reusable for Jira API token storage.

### Established Patterns
- Table+kanban toggle with column filters (Phase 2 questions, Phase 3 stories) -- reuse for defects view.
- Slide-over panel (sheet) for entity creation (Phase 3 stories) -- reuse for defect creation.
- Pre-computed dashboard data via Inngest synthesis events -- reuse for PM dashboard.
- Server actions with `safe-action.ts` middleware for auth+validation.
- Project-scoped queries via `scopedPrisma()`.

### Integration Points
- Sidebar navigation (`src/components/layout/sidebar.tsx`) -- add "Documents", "Defects", and "PM Dashboard" entries.
- Inngest route (`src/app/api/inngest/route.ts`) -- register new functions for doc generation, Jira sync, archival.
- Agent harness task definitions (`src/lib/agent-harness/tasks/`) -- add document content generation task.
- Story detail view -- add "QA" tab for test execution and defect linkage.
- Project settings page -- add Jira configuration and archive/reactivate actions.

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches. All decisions based on Claude's recommended defaults maintaining consistency with established Phase 1-3 patterns.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 05-document-generation-qa-and-administration*
*Context gathered: 2026-04-06*
