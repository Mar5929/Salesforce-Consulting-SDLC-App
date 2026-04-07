---
phase: 08-event-wiring-and-integration-fixes
verified: 2026-04-07T15:00:00Z
status: human_needed
score: 7/7 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Trigger a question create/update/answer and observe the discovery dashboard"
    expected: "Dashboard synthesis job fires in Inngest and dashboard data refreshes within ~30s"
    why_human: "Cannot verify Inngest job execution or UI refresh without a running server and Inngest Dev Server"
  - test: "Trigger a story status change from the web UI and verify Jira receives the update"
    expected: "STORY_STATUS_CHANGED event fires with fromStatus/newStatus fields; jiraSyncOnStatusChange function executes; Jira issue transitions state"
    why_human: "Requires live Jira credentials, running server, and Inngest Dev Server to observe end-to-end"
  - test: "Manually send a JIRA_SYNC_REQUESTED event from Inngest Dev Server for a known story"
    expected: "jiraSyncRetryFunction runs the full pipeline (check config, load story, push to Jira, sync status, upsert JiraSyncRecord with SYNCED status)"
    why_human: "Requires live Inngest Dev Server and Jira credentials to observe step execution and JiraSyncRecord update"
---

# Phase 8: Event Wiring and Integration Fixes — Verification Report

**Phase Goal:** Fix broken event chains so discovery dashboard auto-refreshes, Jira sync works from web UI, and retry mechanism functions
**Verified:** 2026-04-07T15:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

All 7 truths from the PLAN frontmatter were verified against the actual codebase. The ROADMAP defines 3 success criteria, each mapping to one or more of the 7 truths.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Question create/update/answer actions send PROJECT_STATE_CHANGED to trigger dashboard re-synthesis | VERIFIED | `src/actions/questions.ts` lines 134–139 (createQuestion), 191–196 (updateQuestion), 244–249 (answerQuestion) each contain `inngest.send({ name: EVENTS.PROJECT_STATE_CHANGED, ... })` |
| 2 | Transcript processing sends PROJECT_STATE_CHANGED after extraction completes | VERIFIED | `src/lib/inngest/functions/transcript-processing.ts` line 383: third object in the `step.sendEvent("trigger-downstream", [...])` array is `{ name: EVENTS.PROJECT_STATE_CHANGED, data: { projectId } }` |
| 3 | Article refresh sends PROJECT_STATE_CHANGED after article write and embedding trigger | VERIFIED | `src/lib/inngest/functions/article-refresh.ts` lines 115–119: `step.sendEvent("trigger-dashboard-refresh", { name: EVENTS.PROJECT_STATE_CHANGED, ... })` placed after embedding trigger step |
| 4 | stories.ts sends newStatus (not toStatus) in STORY_STATUS_CHANGED event payload | VERIFIED | `src/actions/stories.ts` line 314: `newStatus: parsedInput.status` in the STORY_STATUS_CHANGED event data block. Line 301 `toStatus: parsedInput.status` is in the StatusTransition DB insert, not the event — correct per D-12 |
| 5 | API route.ts sends fromStatus (not previousStatus) in STORY_STATUS_CHANGED event payload | VERIFIED | `src/app/api/v1/stories/[storyId]/status/route.ts` line 106: `fromStatus: story.status` and line 107: `newStatus` in the STORY_STATUS_CHANGED event block |
| 6 | JIRA_SYNC_REQUESTED event has an Inngest consumer that retries sync for a single story | VERIFIED | `src/lib/inngest/functions/jira-sync.ts` lines 175–292: `jiraSyncRetryFunction` with `triggers: [{ event: EVENTS.JIRA_SYNC_REQUESTED }]`, `retries: 2`. Operates on a single `storyId` received from the event payload |
| 7 | Retry function is registered in Inngest route and records outcome in JiraSyncRecord | VERIFIED | `src/app/api/inngest/route.ts` line 16 imports `jiraSyncRetryFunction`, line 36 registers it in the `functions` array. Function upserts `prisma.jiraSyncRecord` on both success (line 241, status: "SYNCED") and failure (line 271, status: "FAILED") |

**Score:** 7/7 truths verified

### ROADMAP Success Criteria Mapping

| SC # | Success Criterion | Status | Supporting Truths |
|------|------------------|--------|-------------------|
| 1 | PROJECT_STATE_CHANGED event is sent by state-changing actions, triggering dashboard synthesis | VERIFIED | Truths 1, 2, 3 — event fires from 5 locations; `dashboardSynthesisFunction` consumes it (confirmed line 37 of dashboard-synthesis.ts) |
| 2 | stories.ts sends newStatus (not toStatus) in STORY_STATUS_CHANGED event | VERIFIED | Truth 4 — field corrected from `toStatus` to `newStatus` in event payload |
| 3 | JIRA_SYNC_REQUESTED event has an Inngest consumer for manual retry | VERIFIED | Truths 6, 7 — consumer exists, is registered, and records outcome |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/actions/questions.ts` | PROJECT_STATE_CHANGED sends in createQuestion, updateQuestion, answerQuestion | VERIFIED | 3 occurrences at lines 134, 191, 244 |
| `src/lib/inngest/functions/transcript-processing.ts` | PROJECT_STATE_CHANGED in trigger-downstream array | VERIFIED | Line 383 — third entry in the array |
| `src/lib/inngest/functions/article-refresh.ts` | PROJECT_STATE_CHANGED after embeddings trigger | VERIFIED | Lines 116–119 as separate `trigger-dashboard-refresh` step after embedding step |
| `src/actions/stories.ts` | Fixed STORY_STATUS_CHANGED payload with newStatus | VERIFIED | Line 314: `newStatus: parsedInput.status`; no `toStatus` in event payload |
| `src/app/api/v1/stories/[storyId]/status/route.ts` | Fixed STORY_STATUS_CHANGED payload with fromStatus | VERIFIED | Lines 106–107: `fromStatus: story.status, newStatus` |
| `src/lib/inngest/functions/jira-sync.ts` | jiraSyncRetryFunction triggered by JIRA_SYNC_REQUESTED | VERIFIED | Lines 175–292; exports both `jiraSyncOnStatusChange` and `jiraSyncRetryFunction` |
| `src/app/api/inngest/route.ts` | Registration of jiraSyncRetryFunction | VERIFIED | Line 16 (import), line 36 (registration in serve() functions array) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/actions/questions.ts` | `src/lib/inngest/functions/dashboard-synthesis.ts` | inngest.send PROJECT_STATE_CHANGED | WIRED | questions.ts sends `EVENTS.PROJECT_STATE_CHANGED`; dashboard-synthesis.ts triggers on that event (line 37) |
| `src/actions/stories.ts` | `src/lib/inngest/functions/jira-sync.ts` | inngest.send STORY_STATUS_CHANGED with newStatus field | WIRED | stories.ts line 314: `newStatus: parsedInput.status`; jira-sync.ts destructures `newStatus` from event data |
| `src/lib/inngest/functions/jira-sync.ts` | `src/app/api/inngest/route.ts` | function registration in serve() array | WIRED | `jiraSyncRetryFunction` imported at line 16, registered at line 36 |

### Data-Flow Trace (Level 4)

These are event-wiring changes only — no components that render dynamic data were added. The artifact changes are server-side action/Inngest function modifications. Level 4 data-flow trace not applicable to these artifacts.

### Behavioral Spot-Checks

Step 7b: SKIPPED — changes are server-side Inngest function modifications and server actions. Verifying end-to-end event execution requires a running Inngest Dev Server and live services. The three human verification items below cover this gap.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DASH-05 | 08-01-PLAN.md | Dashboard data refreshes via Inngest-triggered cached synthesis | SATISFIED | PROJECT_STATE_CHANGED now fires from all state-changing discovery actions and Inngest functions; dashboardSynthesisFunction is registered and consumes the event |
| ADMIN-01 | 08-01-PLAN.md | Optional one-directional push sync to client Jira instance | SATISFIED | STORY_STATUS_CHANGED field names corrected (fromStatus/newStatus); jiraSyncRetryFunction created and registered for JIRA_SYNC_REQUESTED manual retry path |

Both requirements declared in the PLAN are addressed. No orphaned requirements — REQUIREMENTS.md Traceability table maps only DASH-05 and ADMIN-01 to Phase 8.

### Anti-Patterns Found

None. Scanned all 7 modified files for TODO/FIXME/PLACEHOLDER comments, empty implementations, and hardcoded empty data. No issues found.

### Human Verification Required

Three behaviors require a running server and Inngest Dev Server to verify end-to-end execution:

#### 1. Discovery Dashboard Auto-Refresh

**Test:** Create or answer a question in an active project, then observe the Inngest Dev Server
**Expected:** `project/state-changed` event appears in Inngest Dev, triggers `dashboard-synthesis` function run, discovery dashboard data updates within ~30 seconds
**Why human:** Cannot verify Inngest job execution or UI refresh without a running server. The code wiring is confirmed correct but the runtime behavior requires observation.

#### 2. Jira Sync Field Name Fix

**Test:** Change a story's status via the web UI or via the developer API (PATCH `/api/v1/stories/:storyId/status`), then inspect the Inngest Dev Server
**Expected:** `story/status-changed` event payload contains `fromStatus` and `newStatus` (not `previousStatus`/`toStatus`); `jira-sync-on-status-change` function executes and pushes the status change to Jira
**Why human:** Requires live Jira credentials and a running server to confirm the field names propagate through to the Jira API call without type errors.

#### 3. JIRA_SYNC_REQUESTED Retry Consumer

**Test:** In Inngest Dev Server, send a `jira/sync-requested` event with a valid `projectId` and `storyId`
**Expected:** `jira-sync-retry` function runs all steps (check-jira-config, load-story, push-story-to-jira, sync-story-status, upsert-sync-record); JiraSyncRecord row exists in DB with `status: "SYNCED"` and a `lastSyncAt` timestamp
**Why human:** Requires Inngest Dev Server access and a project with Jira integration configured to observe step execution and database outcome.

### Gaps Summary

No gaps. All 7 must-have truths are verified in the codebase. Human verification items are runtime/integration checks that cannot be satisfied by static code analysis — the code wiring is complete and correct.

---

_Verified: 2026-04-07T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
