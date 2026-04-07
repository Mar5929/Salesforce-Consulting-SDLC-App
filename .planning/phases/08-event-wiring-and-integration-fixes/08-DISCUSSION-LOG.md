# Phase 8: Event Wiring and Integration Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 08-event-wiring-and-integration-fixes
**Areas discussed:** Dashboard trigger sources, Jira retry consumer design, Field name fix strategy
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

## Claude's Discretion

- Whether story status changes also send PROJECT_STATE_CHANGED (depends on dashboard blocked items query)
- Exact list of server actions to instrument with PROJECT_STATE_CHANGED

## Deferred Ideas

None — discussion stayed within phase scope
