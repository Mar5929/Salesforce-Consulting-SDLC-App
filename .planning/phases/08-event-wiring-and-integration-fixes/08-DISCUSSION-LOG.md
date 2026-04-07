# Phase 8: Event Wiring and Integration Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07 (updated)
**Phase:** 08-event-wiring-and-integration-fixes
**Areas discussed:** Dashboard trigger sources, Jira retry consumer design, Field name fix strategy, Field naming consistency, PROJECT_STATE_CHANGED scope, Error handling for retry
**Mode:** Claude's recommendations (user deferred all choices)

---

## Dashboard Trigger Sources

| Option | Description | Selected |
|--------|-------------|----------|
| Broad triggers (all state-changing actions) | Send PROJECT_STATE_CHANGED from questions, transcripts, knowledge, decisions. Rely on 30s debounce. | ✓ |
| Narrow triggers (only major milestones) | Only trigger on transcript completion and knowledge article updates |  |
| Composite event fan-out | Create a middleware that detects state changes and sends one consolidated event |  |

**User's choice:** Claude's recommendation — Broad triggers
**Notes:** The 30s debounce on dashboardSynthesisFunction makes over-triggering safe. Better to have a responsive dashboard than risk stale data. Each action adds a single `inngest.send()` call — minimal code impact.

---

## Jira Retry Consumer Design

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone single-story retry | New function triggered by JIRA_SYNC_REQUESTED, accepts { projectId, storyId }, reuses sync library | ✓ |
| Bulk retry (all failed for project) | Accept just projectId, query all failed JiraSyncRecords, retry each |  |
| Invoke existing function | Have JIRA_SYNC_REQUESTED fan out to STORY_STATUS_CHANGED to reuse existing consumer |  |

**User's choice:** Claude's recommendation — Standalone single-story retry
**Notes:** Single-story aligns with per-story retry UI. Reusing the sync library (not the Inngest function) keeps both functions independently triggerable and testable. Same pattern as existing jiraSyncOnStatusChange.

---

## Field Name Fix Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Rename sender (stories.ts → newStatus) | Change event payload in stories.ts to use newStatus, consumer stays as-is | ✓ |
| Rename consumer (jira-sync.ts → toStatus) | Change jira-sync.ts to destructure toStatus, sender stays as-is |  |

**User's choice:** Claude's recommendation — Rename sender
**Notes:** jira-sync.ts and the API route both use newStatus — stories.ts is the outlier. newStatus is more semantically clear for event data. StatusTransition DB column keeps toStatus (correct for the model).

---

## Field Naming Consistency (update session)

| Option | Description | Selected |
|--------|-------------|----------|
| Normalize both senders | Change stories.ts toStatus→newStatus AND route.ts previousStatus→fromStatus | ✓ |
| Fix only stories.ts | Only fix the bug (toStatus→newStatus), leave route.ts as-is |  |
| Leave both as-is | Consumer handles both field names |  |

**User's choice:** Claude's recommendation — normalize both senders to identical payload shape
**Notes:** API route already uses `newStatus` correctly but uses `previousStatus` instead of `fromStatus`. Standardizing prevents future confusion. Added as D-11.

---

## PROJECT_STATE_CHANGED Scope (update session)

| Option | Description | Selected |
|--------|-------------|----------|
| Question + transcript + article actions | Instrument question CRUD, transcript processing completion, article refresh completion | ✓ |
| All state-changing actions | Also include stories, sprints, defects, etc. |  |
| Question actions only | Minimal instrumentation |  |

**User's choice:** Claude's recommendation — instrument only actions that feed the discovery dashboard
**Notes:** Stories/sprints feed the PM dashboard (different consumer). Discovery dashboard shows questions, transcripts, knowledge, decisions. Specific files and line numbers identified in D-01.

---

## Error Handling for Retry (update session)

| Option | Description | Selected |
|--------|-------------|----------|
| JiraSyncRecord audit trail | Same pattern as existing sync — record success/failure in DB | ✓ |
| Notification on failure | Fire NOTIFICATION_SEND event when retry fails |  |
| Silent logging | Console.error only, no persistent record |  |

**User's choice:** Claude's recommendation — follow existing jiraSyncOnStatusChange pattern exactly
**Notes:** SyncStatusBadge in story table already reflects sync record status. No need for separate notification. Added as D-09.

---

## Claude's Discretion

- Exact insertion point for PROJECT_STATE_CHANGED in article-refresh.ts
- Whether additional question lifecycle transitions beyond create/answer/status-change affect dashboard metrics

## Deferred Ideas

None — discussion stayed within phase scope
