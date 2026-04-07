# Phase 8: Event Wiring and Integration Fixes - Context

**Gathered:** 2026-04-07 (updated)
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix three broken event chains identified in the v1.0 milestone audit: (1) dashboard auto-refresh never triggers, (2) Jira sync field name mismatch breaks web UI path, (3) Jira manual retry has no consumer. All three are wiring bugs — no new features, no UI changes.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Trigger Sources
- **D-01:** Send `PROJECT_STATE_CHANGED` from these specific locations:
  - `src/actions/questions.ts` — after `createQuestion`, `answerQuestion`, and `updateQuestionStatus` mutations
  - `src/lib/inngest/functions/transcript-processing.ts` — add to `step.sendEvent("trigger-downstream")` array after extraction completes
  - `src/lib/inngest/functions/article-refresh.ts` — send after article write completes
- **D-02:** Rely on the existing 30s debounce on `dashboardSynthesisFunction` to coalesce rapid events — no additional throttling needed in senders
- **D-03:** Story status changes do NOT send `PROJECT_STATE_CHANGED` — they feed the PM dashboard (different consumer), not the discovery dashboard

### Jira Retry Consumer
- **D-04:** Create a standalone `jiraSyncRetryFunction` Inngest function triggered by `JIRA_SYNC_REQUESTED`
- **D-05:** Event payload: `{ projectId, storyId }` — single-story retry, not bulk
- **D-06:** Reuse existing sync library functions (`pushStoryToJira`, `syncStoryStatus` from `@/lib/jira/sync`), don't call the other Inngest function
- **D-07:** Record outcome in `JiraSyncRecord` for audit trail, same pattern as `jiraSyncOnStatusChange` — includes error message on failure
- **D-08:** Register the new function in `src/app/api/inngest/route.ts`
- **D-09:** No separate notification on retry failure — the `SyncStatusBadge` in the story table already reflects sync record status. Retry function gets 2 retries (same as `jiraSyncOnStatusChange`)

### Field Name Fix
- **D-10:** Rename sender field in `stories.ts:314` from `toStatus` to `newStatus` in the `STORY_STATUS_CHANGED` event payload — consumer (`jira-sync.ts:25`) keeps `newStatus` as-is
- **D-11:** Also normalize `route.ts:106` from `previousStatus` to `fromStatus` so both senders emit identical payload shape: `{ projectId, storyId, fromStatus, newStatus, memberId? }`
- **D-12:** Keep `StatusTransition.toStatus` DB column name unchanged — it's correct for the database model, separate from event payload naming
- **D-13:** Verify `notification-dispatch.ts` is unaffected — confirmed it doesn't destructure `newStatus`/`fromStatus` from STORY_STATUS_CHANGED events (it uses the separate NOTIFICATION_SEND event with its own type field)

### Claude's Discretion
- Whether `article-refresh.ts` should emit `PROJECT_STATE_CHANGED` directly or at the end of its step chain — Claude should check where the best insertion point is
- If any additional question lifecycle transitions beyond create/answer/status-change also affect dashboard metrics, Claude should instrument those too

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
- `src/app/api/v1/stories/[storyId]/status/route.ts` ~L101-109 — Sends `previousStatus` instead of `fromStatus` (secondary inconsistency)
- `src/lib/inngest/functions/jira-sync.ts` L25 — Consumer that destructures `newStatus`
- `src/lib/inngest/functions/dashboard-synthesis.ts` — Consumer of PROJECT_STATE_CHANGED (works, but never triggered)

### Actions to Instrument with PROJECT_STATE_CHANGED
- `src/actions/questions.ts` — L121 (createQuestion), L174 (answerQuestion/ENTITY_CONTENT_CHANGED area), L204 (updateQuestionStatus area)
- `src/lib/inngest/functions/transcript-processing.ts` L363 — `step.sendEvent("trigger-downstream")` array
- `src/lib/inngest/functions/article-refresh.ts` — end of article write step

### Sync Library (reuse for retry consumer)
- `src/lib/jira/sync.ts` — `pushStoryToJira`, `syncStoryStatus` functions used by existing Jira sync
- `src/lib/inngest/functions/jira-sync.ts` — Pattern template for the retry consumer (same flow: check config > load story > sync > record)

### PRD and Tech Spec
- `SF-Consulting-AI-Framework-PRD-v2.1.md` — DASH-05 (dashboard refresh), ADMIN-01 (Jira sync)
- `SESSION-3-TECHNICAL-SPEC.md` — Inngest event architecture, dashboard synthesis spec

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dashboardSynthesisFunction` (dashboard-synthesis.ts): Fully implemented with 30s debounce, concurrency control, AI synthesis — just needs events sent to it
- `pushStoryToJira` / `syncStoryStatus` (lib/jira/sync.ts): Reusable for the retry consumer
- `jiraSyncOnStatusChange` (jira-sync.ts): Pattern template for the retry consumer (same flow: check config > load story > sync > record)
- Inngest route registration pattern in `api/inngest/route.ts`: Add new function to the array

### Established Patterns
- All Inngest functions use step functions with named steps (`step.run("step-name", ...)`)
- Event constants centralized in `events.ts` — no inline event name strings
- Server actions use `inngest.send()` to fire events after mutations
- Inngest functions use `step.sendEvent()` to emit downstream events
- JiraSyncRecord pattern: create record with sync outcome (success/failure + error details)

### Integration Points
- Server actions in `src/actions/questions.ts` — add `inngest.send({ name: EVENTS.PROJECT_STATE_CHANGED })` after state-changing mutations
- `src/lib/inngest/functions/transcript-processing.ts` L363 — add to existing `step.sendEvent` array
- `src/lib/inngest/functions/article-refresh.ts` — add `PROJECT_STATE_CHANGED` at end of refresh
- `src/app/api/inngest/route.ts` — import and register `jiraSyncRetryFunction`

</code_context>

<specifics>
## Specific Ideas

- Normalize both event senders (stories.ts and route.ts) to identical payload shape for STORY_STATUS_CHANGED: `{ projectId, storyId, fromStatus, newStatus, memberId? }`
- Retry consumer mirrors jiraSyncOnStatusChange exactly — no custom error handling, just JiraSyncRecord audit trail

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-event-wiring-and-integration-fixes*
*Context gathered: 2026-04-07 (updated)*
