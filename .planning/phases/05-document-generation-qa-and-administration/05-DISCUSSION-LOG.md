# Phase 5: Document Generation, QA, and Administration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 05-document-generation-qa-and-administration
**Areas discussed:** Document generation UX, QA test/defect workflow, PM dashboard and cost tracking, Jira sync and project archival
**Mode:** Claude's recommendations (user requested all areas answered with Claude defaults)

---

## Document Generation UX

All decisions selected by Claude's recommendation at user request.

| Option | Description | Selected |
|--------|-------------|----------|
| Template gallery | Dedicated Documents page with branded template cards. PM picks, configures, previews, generates. | Yes |
| Context menu action | Generate from entity right-click menus. No dedicated page. | |
| Both paths | Gallery as hub + quick-generate from context menus. | |

**User's choice:** Template gallery (Claude's recommendation)
**Notes:** AI content via Inngest step function using agent harness. S3/R2 storage with version tracking. In-browser preview before download. Firm branding hardcoded in V1.

---

## QA Test/Defect Workflow

All decisions selected by Claude's recommendation at user request.

**User's choice:** Test execution at story level (QA tab), defect lifecycle with table+kanban toggle, slide-over panel for defect creation, defects linked to stories.
**Notes:** Consistent with Phase 2/3 UI patterns. Defect lifecycle mirrors existing status workflow patterns with role-appropriate transitions.

---

## PM Dashboard and Cost Tracking

All decisions selected by Claude's recommendation at user request.

**User's choice:** Dedicated PM dashboard page extending discovery dashboard pattern. Pre-computed data via Inngest. AI cost charts sourced from AgentExecution records.
**Notes:** Reuses existing dashboard component patterns and Inngest synthesis approach from Phase 2.

---

## Jira Sync and Project Archival

All decisions selected by Claude's recommendation at user request.

**User's choice:** Optional project setting for Jira, one-directional push, Inngest background jobs. Archive/reactivate via project settings with confirmation dialogs.
**Notes:** Jira API token encrypted at rest using existing encryption utilities. Sync status badges per story.

---

## Claude's Discretion

- Document template HTML/layout specifics and S3 key structure
- Chart library for PM dashboard
- Jira REST API field mapping and error handling
- Loading skeletons and empty states
- Test case data model details
- Branding configuration structure

## Deferred Ideas

None -- discussion stayed within phase scope.
