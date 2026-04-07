# Phase 8: Event Wiring and Integration Fixes - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix three broken event chains identified in the v1.0 milestone audit: (1) dashboard auto-refresh never triggers, (2) Jira sync field name mismatch breaks web UI path, (3) Jira manual retry has no consumer. All three are wiring bugs — no new features, no UI changes.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Trigger Sources
- **D-01:** Send `PROJECT_STATE_CHANGED` from all actions that affect discovery dashboard metrics: question create/answer/status-change, transcript processed, knowledge article create/update, decision created
- **D-02:** Rely on the existing 30s debounce on `dashboardSynthesisFunction` to coalesce rapid events — no additional throttling needed in senders
- **D-03:** Story status changes may optionally also trigger `PROJECT_STATE_CHANGED` for the "blocked items" metric, but this is Claude's discretion based on whether the dashboard queries blocked items from story status

### Jira Retry Consumer
- **D-04:** Create a standalone `jiraSyncRetryFunction` Inngest function triggered by `JIRA_SYNC_REQUESTED`
- **D-05:** Event payload: `{ projectId, storyId }` — single-story retry, not bulk
- **D-06:** Reuse existing sync library functions (`pushStoryToJira`, `syncStoryStatus` from `@/lib/jira/sync`), don't call the other Inngest function
- **D-07:** Record outcome in `JiraSyncRecord` for audit trail, same pattern as `jiraSyncOnStatusChange`
- **D-08:** Register the new function in `src/app/api/inngest/route.ts`

### Field Name Fix
- **D-09:** Rename sender field in `stories.ts` from `toStatus` to `newStatus` in the `STORY_STATUS_CHANGED` event payload — consumer (`jira-sync.ts`) keeps `newStatus` as-is
- **D-10:** Keep `StatusTransition.toStatus` DB column name unchanged — it's correct for the database model, separate from event payload naming
- **D-11:** Verify `notification-dispatch.ts` also destructures consistently (check if it reads from this event)

### Claude's Discretion
- Whether story status changes should additionally send `PROJECT_STATE_CHANGED` (D-03)
- Exact list of server actions to instrument — Claude should grep for state-changing mutations and determine which ones affect dashboard metrics

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit Findings
- `.planning/v1.0-MILESTONE-AUDIT.md` — Source of truth for all three bugs; sections on DASH-05, ADMIN-01, and orphaned events

### Existing Event Infrastructure
- `src/lib/inngest/events.ts` — All event name constants (PROJECT_STATE_CHANGED, STORY_STATUS_CHANGED, JIRA_SYNC_REQUESTED)
- `src/app/api/inngest/route.ts` — Inngest function registration (new retry function must be added here)

### Broken Code Paths
- `src/actions/stories.ts` ~L308-317 — Sends `toStatus` instead of `newStatus` in STORY_STATUS_CHANGED event
- `src/lib/inngest/functions/jira-sync.ts` — Consumer that destructures `newStatus` (line 25)
- `src/lib/inngest/functions/dashboard-synthesis.ts` — Consumer of PROJECT_STATE_CHANGED (works, but never triggered)

### Sync Library (reuse for retry consumer)
- `src/lib/jira/sync.ts` — `pushStoryToJira`, `syncStoryStatus` functions used by existing Jira sync

### PRD and Tech Spec
- `SF-Consulting-AI-Framework-PRD-v2.1.md` — DASH-05 (dashboard refresh), ADMIN-01 (Jira sync)
- `SESSION-3-TECHNICAL-SPEC.md` — Inngest event architecture, dashboard synthesis spec

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dashboardSynthesisFunction` (dashboard-synthesis.ts): Fully implemented with 30s debounce, concurrency control, AI synthesis — just needs events sent to it
- `pushStoryToJira` / `syncStoryStatus` (lib/jira/sync.ts): Reusable for the retry consumer
- `jiraSyncOnStatusChange` (jira-sync.ts): Pattern template for the retry consumer (same flow: check config → load story → sync → record)
- Inngest route registration pattern in `api/inngest/route.ts`: Add new function to the array

### Established Patterns
- All Inngest functions use step functions with named steps (`step.run("step-name", ...)`)
- Event constants centralized in `events.ts` — no inline event name strings
- Server actions use `inngest.send()` to fire events after mutations

### Integration Points
- Server actions in `src/actions/` that mutate question, transcript, knowledge, decision state — these need `inngest.send({ name: EVENTS.PROJECT_STATE_CHANGED })` calls added
- `src/app/api/inngest/route.ts` — new retry function must be imported and registered

</code_context>

<specifics>
## Specific Ideas

No specific requirements — user deferred all choices to Claude's best judgment. All decisions above represent Claude's recommended approaches based on codebase analysis and standard patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-event-wiring-and-integration-fixes*
*Context gathered: 2026-04-07*
