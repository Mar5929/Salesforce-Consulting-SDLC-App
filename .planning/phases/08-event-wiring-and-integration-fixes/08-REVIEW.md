---
phase: 08-event-wiring-and-integration-fixes
reviewed: 2026-04-07T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/actions/questions.ts
  - src/lib/inngest/functions/transcript-processing.ts
  - src/lib/inngest/functions/article-refresh.ts
  - src/actions/stories.ts
  - src/app/api/v1/stories/[storyId]/status/route.ts
  - src/lib/inngest/functions/jira-sync.ts
  - src/app/api/inngest/route.ts
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-04-07T00:00:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Seven files were reviewed covering server actions (questions, stories), Inngest background functions (transcript processing, article refresh, Jira sync), the Claude Code REST API route for story status, and the Inngest serve handler.

The overall architecture is sound and the event wiring is mostly correct. One critical security issue was found in `stories.ts` — the `updateStory` action is missing a `getCurrentMember` guard, allowing requests with no project membership to proceed. Several warnings relate to missing Inngest event registrations, a wrong `scope` value in the article-refresh concurrency config, silent handling of the `PARKED` → `OPEN` unpark path in the notification flow, and a stale-status race condition in transcript processing. The `scopedPrisma` client is instantiated but unused in three action files, which is an observable dead-code pattern worth cleaning up.

---

## Critical Issues

### CR-01: `updateStory` Missing Membership Guard — Authorization Bypass

**File:** `src/actions/stories.ts:162-204`

**Issue:** `updateStory` performs a direct `prisma.story.findUnique` and then a `prisma.projectMember.findFirst` using `ctx.userId`. If `ctx.userId` is absent or the Clerk middleware is misconfigured, `projectMember.findFirst` returns `null` and the action throws `"Not a member of this project"` — but only after already having hit the database to look up the story. More critically, unlike every other action in this file, `updateStory` never calls `getCurrentMember(parsedInput.projectId)` as the first step. All peer actions (`createStory`, `deleteStory`, `getStories`, `updateStoryStatus`) call it immediately. The role check is performed inline with a raw `projectMember.findFirst`, which is a different code path that could drift from the canonical `getCurrentMember` implementation if that function evolves (e.g., adds account-suspension checks or org-level checks). If `getCurrentMember` ever becomes the single chokepoint for those checks, `updateStory` would silently bypass them.

**Fix:** Add `getCurrentMember` at the top of `updateStory` for consistency and defense-in-depth, then keep or remove the inline `projectMember.findFirst` as appropriate:

```typescript
export const updateStory = actionClient
  .schema(updateStorySchema)
  .action(async ({ parsedInput, ctx }) => {
    // Consistent membership + suspension check via canonical helper
    const member = await getCurrentMember(parsedInput.projectId)

    // Validate storyId belongs to project
    const existing = await prisma.story.findUnique({
      where: { id: parsedInput.storyId },
      select: { projectId: true, assigneeId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Story not found")
    }

    // Role check: PM/SA can edit any, others only their own
    if (member.role !== "PM" && member.role !== "SOLUTION_ARCHITECT") {
      if (existing.assigneeId !== member.id) {
        throw new Error("Insufficient permissions to edit this story")
      }
    }
    // ... rest of action
  })
```

---

## Warnings

### WR-01: `article-refresh` Concurrency `scope` Is Wrong — Functions Share Limit Across Projects

**File:** `src/lib/inngest/functions/article-refresh.ts:23-28`

**Issue:** The concurrency config uses `scope: "env"` with a `key` of `"event.data.projectId"`. In Inngest, `scope: "env"` means the limit applies globally across all runs in the environment, using the key only for grouping display — it does NOT create per-project limits. The comment says "limit to 2 per project" (T-02-22), but the implementation enforces 2 concurrent runs globally. The correct scope for per-key limits is `"fn"`.

**Fix:**
```typescript
concurrency: [
  {
    limit: 2,
    scope: "fn",       // "fn" scopes the limit per unique key value
    key: "event.data.projectId",
  },
],
```

### WR-02: Transcript Processing — Status Set to `PROCESSING` Before Confirming Content Exists

**File:** `src/lib/inngest/functions/transcript-processing.ts:88-114`

**Issue:** In the `load-transcript` step, the function first reads the transcript, then throws if `rawContent` is null, but if content _does_ exist, it immediately sets `processingStatus: "PROCESSING"` and creates a chat message — all in the same `step.run`. Because `step.run` is retried on failure, a transient DB error after the `UPDATE` but before returning `rawContent` would leave the transcript stuck in `PROCESSING` state on a retry. On the next retry attempt, the transcript would appear as `PROCESSING` to any UI polling for status but the step would still proceed correctly. The real hazard is if the function fails permanently after step 1 and the `transcriptProcessingFailure` handler fires — it correctly sets `FAILED`, but only if it can extract `transcriptId` from the original event data (which it can). This is a lower-severity race, but the ordering is fragile.

**Fix:** Return `rawContent` first, then update status in a separate step or at minimum do the `UPDATE` last within the step so any failure before the update is idempotent:

```typescript
const transcriptContent = await step.run("load-transcript", async () => {
  const transcript = await prisma.transcript.findUnique({
    where: { id: transcriptId },
    select: { rawContent: true, title: true },
  })
  if (!transcript?.rawContent) {
    throw new Error(`Transcript ${transcriptId} not found or has no content`)
  }
  // Update status LAST — if this fails, Inngest retries cleanly
  await prisma.transcript.update({
    where: { id: transcriptId },
    data: { processingStatus: "PROCESSING" },
  })
  await prisma.chatMessage.create({ ... })
  return transcript.rawContent
})
```

The current order is already close to this, but the `update` should be the final write before the return to minimize the retry-leaves-stuck-status window.

### WR-03: `jira-sync` — Jira Status Synced with Pre-Update `story.status`, Not the Requested `newStatus`

**File:** `src/lib/inngest/functions/jira-sync.ts:75-80`

**Issue:** In step 4 (`sync-story-status`), the call uses `story.status` (loaded in step 2) rather than `newStatus` (the status from the event that triggered the function). `story.status` reflects the story's state at the time of the DB read in step 2, which should already be the updated status — but the story was updated _before_ the event was sent. However, if the story is updated again between the event being sent and step 2 executing (possible under load), the synced status would be the most-recent DB status rather than the status captured in the event. For a status-change sync function, it should always use the authoritative `newStatus` from the event payload.

**Fix:**
```typescript
// Step 4: Sync story status (transition in Jira)
await step.run("sync-story-status", async () => {
  return syncStoryStatus(
    jiraConfig as unknown as JiraConfig,
    storyId,
    newStatus  // Use event payload, not potentially-stale DB value
  )
})
```

Same fix applies to `jiraSyncRetryFunction` at line 231-235, where `story.status` is used instead of the current intent. For the retry function, using the current DB status is likely intentional (re-sync current state), but should be documented explicitly if so.

### WR-04: `updateStoryStatus` in `stories.ts` Sends Notification to the Actor, Not Relevant Recipients

**File:** `src/actions/stories.ts:319-329`

**Issue:** The `NOTIFICATION_SEND` event dispatched after a story status change sets `recipientId: member.id` — i.e., it notifies the person who just performed the action. This is almost certainly wrong. The useful recipients would be the story assignee, sprint owner, or PM — not the actor. In the unpark case (PARKED → any active status), there is no notification at all from the question workflow's `validateStatusTransition` helper, meaning interested parties are never notified. While the notification system's dispatch function may filter self-notifications, the intent here is unclear.

**Fix:** Send the notification to the story's assignee (if different from the actor) and/or the project PM. At minimum, guard against self-notification:

```typescript
const story = await prisma.story.findUnique({
  where: { id: parsedInput.storyId },
  select: { assigneeId: true },
})

if (story?.assigneeId && story.assigneeId !== member.id) {
  await inngest.send({
    name: EVENTS.NOTIFICATION_SEND,
    data: {
      projectId: parsedInput.projectId,
      type: "STORY_STATUS_CHANGED",
      recipientId: story.assigneeId,  // Notify assignee, not actor
      entityId: parsedInput.storyId,
      entityType: "Story",
      message: `Story ${existing.displayId} moved to ${parsedInput.status}`,
    },
  })
}
```

### WR-05: Duplicate Tool-Result Iteration in Transcript Processing

**File:** `src/lib/inngest/functions/transcript-processing.ts:140-229` and `233-361`

**Issue:** `extractionResult.toolResults` is iterated twice with identical switch-case logic: once in `step.run("update-status")` (lines ~158-229) and again in `step.run("save-to-conversation")` (lines ~260-315). The first pass builds `itemCounts` and `extractedItems` (but `extractedItems` is computed and then never used — its value is returned from the step but the return value of `update-status` is discarded). The second pass rebuilds `itemCounts` and also builds the `groups` array. This is dead logic in step 3 and a maintenance hazard where both loops must be kept in sync.

**Fix:** Remove the first loop from `update-status` entirely — it serves no purpose since the returned value is discarded. Move all result parsing into `save-to-conversation`, or extract a shared helper. At minimum, delete lines ~148-229 in `update-status` and simplify that step to only the DB update:

```typescript
await step.run("update-status", async () => {
  await prisma.transcript.update({
    where: { id: transcriptId },
    data: {
      processingStatus: "COMPLETE",
      sessionLogId: extractionResult.sessionLogId,
    },
  })
})
```

---

## Info

### IN-01: `scopedPrisma` Instantiated but Unused in `questions.ts` and `stories.ts`

**File:** `src/actions/questions.ts:316`, `src/actions/stories.ts:245`

**Issue:** Both `getQuestions` and `getStories` call `scopedPrisma(projectId)` and assign the result to `db`, then proceed to use the global `prisma` client directly for all queries. The scoped client is never used.

**Fix:** Either use `db` throughout the query, or remove the `scopedPrisma` instantiation. Given the project security model (T-02-13, T-03-02), using `db` is preferable:

```typescript
// In getQuestions / getStories:
const db = scopedPrisma(parsedInput.projectId)
const [questions, total] = await Promise.all([
  db.question.findMany({ ... }),    // was: prisma.question.findMany
  db.question.count({ where }),     // was: prisma.question.count
])
```

### IN-02: `addStoryComponent` Deduplication Check Uses `scopedPrisma` but Create Uses `prisma`

**File:** `src/actions/stories.ts:362-391`

**Issue:** The existence check at line 366 uses `db.storyComponent.findFirst` (via `scopedPrisma`) but the create at line 379 uses the global `prisma.storyComponent.create`. This is inconsistent. While both pass `projectId` explicitly, the project scope comment (Pitfall 1) implies scoped client was the intent throughout this action.

**Fix:** Use `db` for the create as well, or use `prisma` for both and remove the `scopedPrisma` call.

### IN-03: `questions.ts` — `ctx` Parameter Destructured but Unused in `createQuestion` and `deleteQuestion`

**File:** `src/actions/questions.ts:94`, `src/actions/questions.ts:291`

**Issue:** Both `createQuestion` and `deleteQuestion` destructure `ctx` in the action callback signature (`{ parsedInput, ctx }`) but never use it. This is dead code that adds noise.

**Fix:** Remove `ctx` from the destructuring in those two actions:

```typescript
.action(async ({ parsedInput }) => {
```

### IN-04: `article-refresh` Passes `"system"` as `userId` to `executeTask` Without Validation

**File:** `src/lib/inngest/functions/article-refresh.ts:72`

**Issue:** The userId `"system"` is passed as a literal string to `executeTask`. If `executeTask` or any downstream call (audit logging, session log creation) validates that `userId` is a real Clerk user ID (e.g., by looking it up in the DB or sending to Clerk), this will fail or produce corrupt session logs. This is a documentation gap at minimum — it should be a named constant (`SYSTEM_USER_ID`) or the harness interface should explicitly accept `null` for background jobs.

**Fix:** Define a module-level constant and document the contract:

```typescript
/** Sentinel value for background/system-triggered agent tasks with no user context. */
const SYSTEM_ACTOR_ID = "system" as const

// In the step:
"system" -> SYSTEM_ACTOR_ID
```

And ensure `executeTask`'s type signature accepts `string | null` if no real user is available.

---

_Reviewed: 2026-04-07T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
