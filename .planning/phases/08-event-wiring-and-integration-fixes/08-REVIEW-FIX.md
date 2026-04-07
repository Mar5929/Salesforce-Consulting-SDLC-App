---
phase: 08-event-wiring-and-integration-fixes
fixed_at: 2026-04-07T00:00:00Z
review_path: .planning/phases/08-event-wiring-and-integration-fixes/08-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 08: Code Review Fix Report

**Fixed at:** 2026-04-07T00:00:00Z
**Source review:** .planning/phases/08-event-wiring-and-integration-fixes/08-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: `updateStory` Missing Membership Guard -- Authorization Bypass

**Files modified:** `src/actions/stories.ts`
**Commit:** 0cfa8dd
**Applied fix:** Replaced inline `prisma.projectMember.findFirst` with canonical `getCurrentMember(parsedInput.projectId)` call at the top of `updateStory`, consistent with all peer actions. Removed unused `ctx` from destructuring. The existing role check (PM/SA can edit any, others only their own) now uses the member returned by `getCurrentMember`.

### WR-01: `article-refresh` Concurrency `scope` Is Wrong -- Functions Share Limit Across Projects

**Files modified:** `src/lib/inngest/functions/article-refresh.ts`
**Commit:** 529008f
**Applied fix:** Changed `scope: "env"` to `scope: "fn"` in the concurrency config. With `scope: "fn"`, the concurrency limit of 2 is applied per unique `event.data.projectId` value, correctly enforcing per-project limits as intended by T-02-22.

### WR-02: Transcript Processing -- Status Set to `PROCESSING` Before Confirming Content Exists

**Files modified:** `src/lib/inngest/functions/transcript-processing.ts`
**Commit:** 9e97887
**Applied fix:** Reordered operations in the `load-transcript` step so the `PROCESSING` status update is the last write before returning `rawContent`. The chat message creation now happens before the status update. If the status update fails, Inngest retries cleanly without leaving a stuck PROCESSING state.

### WR-03: `jira-sync` -- Jira Status Synced with Pre-Update `story.status`, Not the Requested `newStatus`

**Files modified:** `src/lib/inngest/functions/jira-sync.ts`
**Commit:** 4a3ce30
**Applied fix:** Changed `jiraSyncOnStatusChange` step 4 to use `newStatus` from the event payload instead of `story.status` from the DB read. For the retry function (`jiraSyncRetryFunction`), using current DB status is intentional (re-sync actual state), so added a clarifying comment documenting that design choice.

### WR-04: `updateStoryStatus` in `stories.ts` Sends Notification to the Actor, Not Relevant Recipients

**Files modified:** `src/actions/stories.ts`
**Commit:** e269e50
**Applied fix:** Added `assigneeId` to the story select query. Changed the notification to target `existing.assigneeId` instead of `member.id` (the actor). Added a guard that only sends the notification if the assignee exists and is different from the actor, preventing self-notifications.

### WR-05: Duplicate Tool-Result Iteration in Transcript Processing

**Files modified:** `src/lib/inngest/functions/transcript-processing.ts`
**Commit:** f4e1f6f
**Applied fix:** Removed the entire duplicate tool-result iteration loop from the `update-status` step (previously lines ~141-230). The step now only performs the DB update to set `processingStatus: "COMPLETE"` and link the session log. All result parsing is handled exclusively in the `save-to-conversation` step, eliminating the maintenance hazard of keeping two identical loops in sync.

---

_Fixed: 2026-04-07T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
