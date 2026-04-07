# Phase 8: Event Wiring and Integration Fixes - Research

**Researched:** 2026-04-07
**Domain:** Inngest event wiring, field name consistency, missing event consumers
**Confidence:** HIGH

## Summary

Phase 8 fixes three broken event chains identified in the v1.0 milestone audit. All three are wiring bugs -- no new features, no UI changes, no schema migrations. The existing infrastructure (Inngest functions, event constants, sync library) is fully implemented and tested; the problems are purely about connecting senders to consumers correctly.

The three bugs: (1) `PROJECT_STATE_CHANGED` event is never sent by any action, so `dashboardSynthesisFunction` never triggers. (2) `stories.ts` sends `toStatus` instead of `newStatus` in `STORY_STATUS_CHANGED`, causing `jira-sync.ts` to receive `undefined`. (3) `JIRA_SYNC_REQUESTED` event has no Inngest consumer for manual retry.

**Primary recommendation:** This is a surgical wiring phase. Each fix is small (1-5 lines per site), well-isolated, and follows established patterns already in the codebase. No libraries to install, no patterns to learn.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Send `PROJECT_STATE_CHANGED` from: `questions.ts` (createQuestion, answerQuestion, updateQuestionStatus), `transcript-processing.ts` (trigger-downstream array), `article-refresh.ts` (after article write)
- **D-02:** Rely on existing 30s debounce on `dashboardSynthesisFunction` -- no additional throttling
- **D-03:** Story status changes do NOT send `PROJECT_STATE_CHANGED`
- **D-04:** Create standalone `jiraSyncRetryFunction` triggered by `JIRA_SYNC_REQUESTED`
- **D-05:** Payload: `{ projectId, storyId }` -- single-story retry
- **D-06:** Reuse `pushStoryToJira`, `syncStoryStatus` from `@/lib/jira/sync` -- don't call another Inngest function
- **D-07:** Record outcome in `JiraSyncRecord`, same pattern as `jiraSyncOnStatusChange`
- **D-08:** Register new function in `src/app/api/inngest/route.ts`
- **D-09:** No separate notification on retry failure -- `SyncStatusBadge` reflects sync record. 2 retries.
- **D-10:** Rename `toStatus` to `newStatus` in `stories.ts:314`
- **D-11:** Normalize `route.ts:106` from `previousStatus` to `fromStatus` -- both senders emit `{ projectId, storyId, fromStatus, newStatus, memberId? }`
- **D-12:** Keep `StatusTransition.toStatus` DB column name unchanged
- **D-13:** `notification-dispatch.ts` is unaffected -- confirmed it doesn't destructure newStatus/fromStatus from STORY_STATUS_CHANGED events

### Claude's Discretion
- Best insertion point for `PROJECT_STATE_CHANGED` in `article-refresh.ts` (directly or at end of step chain)
- Whether additional question lifecycle transitions beyond create/answer/status-change affect dashboard metrics

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-05 | Dashboard data refreshes via Inngest-triggered cached synthesis | D-01/D-02: Add `PROJECT_STATE_CHANGED` sends to question actions and transcript/article Inngest functions. Existing `dashboardSynthesisFunction` already handles the event with 30s debounce. |
| ADMIN-01 | Optional one-directional push sync to client Jira instance | D-04 through D-09: Create `jiraSyncRetryFunction` for `JIRA_SYNC_REQUESTED`. D-10/D-11: Fix field name mismatch in `stories.ts` and `route.ts` so `jiraSyncOnStatusChange` receives correct payload. |
</phase_requirements>

## Standard Stack

No new libraries required. All changes use existing project dependencies:

| Library | Version | Purpose | Already Installed |
|---------|---------|---------|-------------------|
| inngest | 4.1.2 | Event-driven background jobs | Yes |
| @prisma/client | 7.6.0 | Database queries in retry function | Yes |

**Installation:** None required.

## Architecture Patterns

### Pattern 1: Sending PROJECT_STATE_CHANGED from Server Actions
**What:** After a state-changing mutation in a server action, send an Inngest event to trigger dashboard re-synthesis.
**When to use:** Any server action that changes question state (create, answer, status change).
**Example:**
```typescript
// Source: Existing pattern in src/actions/stories.ts L308-317
// After mutation completes:
await inngest.send({
  name: EVENTS.PROJECT_STATE_CHANGED,
  data: {
    projectId: parsedInput.projectId,
  },
})
```
[VERIFIED: codebase grep -- this exact pattern exists for STORY_STATUS_CHANGED and ENTITY_CONTENT_CHANGED in questions.ts]

### Pattern 2: Sending Events from Inngest Step Functions
**What:** Use `step.sendEvent()` to emit downstream events from within Inngest functions.
**When to use:** In transcript-processing.ts (add to existing array) and article-refresh.ts (new send).
**Example:**
```typescript
// Source: src/lib/inngest/functions/transcript-processing.ts L364
// Add to existing array in step.sendEvent("trigger-downstream", [...])
{
  name: EVENTS.PROJECT_STATE_CHANGED,
  data: { projectId },
}
```
[VERIFIED: codebase -- transcript-processing.ts L364 already sends an array via step.sendEvent]

### Pattern 3: Inngest Function Registration
**What:** New Inngest functions must be imported and added to the serve() functions array.
**When to use:** For the new `jiraSyncRetryFunction`.
**Example:**
```typescript
// Source: src/app/api/inngest/route.ts
import { jiraSyncRetryFunction } from "@/lib/inngest/functions/jira-sync"
// ... add to functions array
```
[VERIFIED: codebase -- route.ts L16-17 shows existing pattern for jiraSyncOnStatusChange]

### Pattern 4: Jira Sync Function Template
**What:** The new retry function mirrors `jiraSyncOnStatusChange` exactly: check config > load story > push/sync > record.
**When to use:** For `jiraSyncRetryFunction`.
**Key differences from template:**
- Trigger: `JIRA_SYNC_REQUESTED` instead of `STORY_STATUS_CHANGED`
- Payload: `{ projectId, storyId }` only (no status fields -- loads current status from DB)
- No notification on failure (D-09) -- unlike the status change function which sends NOTIFICATION_SEND
[VERIFIED: codebase -- jira-sync.ts fully read and analyzed]

### Anti-Patterns to Avoid
- **Calling Inngest functions from Inngest functions (D-06):** The retry function must call `pushStoryToJira`/`syncStoryStatus` directly, NOT trigger the `jiraSyncOnStatusChange` function via event.
- **Adding throttling to senders (D-02):** The 30s debounce on `dashboardSynthesisFunction` handles coalescing -- senders should fire freely.
- **Sending PROJECT_STATE_CHANGED from story status changes (D-03):** Story status changes feed the PM dashboard (different consumer), not the discovery dashboard.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event debouncing | Custom throttle logic in senders | Inngest's built-in `debounce` on dashboardSynthesisFunction | Already configured at 30s per project |
| Jira push logic | New sync implementation | `pushStoryToJira` / `syncStoryStatus` from `@/lib/jira/sync` | Battle-tested, handles edge cases |
| Sync audit trail | Custom logging | `JiraSyncRecord` upsert pattern from `jiraSyncOnStatusChange` | Consistent audit trail, UI already reads it |

## Common Pitfalls

### Pitfall 1: Missing Inngest Import in Server Actions
**What goes wrong:** `inngest.send()` fails silently or throws at runtime because `inngest` client isn't imported.
**Why it happens:** `questions.ts` already imports `inngest` and `EVENTS` (used for ENTITY_CONTENT_CHANGED and NOTIFICATION_SEND), so this is already solved.
**How to avoid:** Verify import at top of file before adding new sends.
**Warning signs:** TypeScript will catch missing imports at build time.
[VERIFIED: codebase -- questions.ts already imports inngest client and EVENTS]

### Pitfall 2: Wrong Event Name Constant
**What goes wrong:** Event is sent but no function triggers because of a typo or wrong constant.
**How to avoid:** Always use `EVENTS.PROJECT_STATE_CHANGED` constant from `events.ts`, never inline strings.
**Warning signs:** Event appears in Inngest dashboard as "unhandled."
[VERIFIED: codebase -- EVENTS.PROJECT_STATE_CHANGED exists in events.ts L22]

### Pitfall 3: Forgetting to Register New Inngest Function
**What goes wrong:** New function exists but never executes because it's not in the serve() array.
**How to avoid:** Add to `src/app/api/inngest/route.ts` functions array (D-08).
**Warning signs:** Inngest dashboard doesn't show the function.
[VERIFIED: codebase -- route.ts L18-37 shows registration pattern]

### Pitfall 4: updateQuestion Handles Both Content and Status Changes
**What goes wrong:** Adding PROJECT_STATE_CHANGED only to status-specific logic misses content changes that affect dashboard, or vice versa.
**Why it happens:** `updateQuestion` is a single action that handles multiple field updates including status transitions. There is no separate `updateQuestionStatus` action.
**How to avoid:** The CONTEXT.md calls out "updateQuestionStatus" which is actually handled by `updateQuestion` with a status field. Add PROJECT_STATE_CHANGED after the `prisma.question.update` call (alongside the existing ENTITY_CONTENT_CHANGED send at L174). This covers both content and status changes.
**Warning signs:** Dashboard doesn't refresh when question status changes.
[VERIFIED: codebase -- questions.ts has updateQuestion (L138-186), no separate updateQuestionStatus]

### Pitfall 5: article-refresh.ts Step Ordering
**What goes wrong:** Sending PROJECT_STATE_CHANGED before the embedding trigger could cause dashboard synthesis to run on stale embeddings.
**Recommendation (Claude's Discretion):** Add PROJECT_STATE_CHANGED send AFTER the existing `step.sendEvent("trigger-embeddings")` at L106-113, as a separate step. This ensures the article is written and embeddings are queued before dashboard re-synthesis triggers.
[VERIFIED: codebase -- article-refresh.ts L105-113 shows trigger-embeddings is the last step before return]

## Code Examples

### Example 1: Adding PROJECT_STATE_CHANGED to questions.ts createQuestion
```typescript
// After L132 (after revalidatePath, before return)
// Source: Pattern from stories.ts L308-317
await inngest.send({
  name: EVENTS.PROJECT_STATE_CHANGED,
  data: {
    projectId: parsedInput.projectId,
  },
})
```
[VERIFIED: codebase -- questions.ts createQuestion ends at L136]

### Example 2: Adding PROJECT_STATE_CHANGED to transcript-processing.ts
```typescript
// Add to existing array at L364
// Source: transcript-processing.ts L364-382
await step.sendEvent("trigger-downstream", [
  // ... existing events ...
  {
    name: EVENTS.PROJECT_STATE_CHANGED,
    data: { projectId },
  },
])
```
[VERIFIED: codebase -- transcript-processing.ts L364 step.sendEvent array]

### Example 3: Field Name Fix in stories.ts
```typescript
// Line 314: Change toStatus to newStatus
data: {
  projectId: parsedInput.projectId,
  storyId: parsedInput.storyId,
  fromStatus: existing.status,
  newStatus: parsedInput.status,  // was: toStatus
  memberId: member.id,
},
```
[VERIFIED: codebase -- stories.ts L310-316 shows current toStatus field]

### Example 4: Field Name Fix in route.ts
```typescript
// Line 106: Change previousStatus to fromStatus
data: {
  projectId,
  storyId,
  fromStatus: story.status,  // was: previousStatus
  newStatus,
},
```
[VERIFIED: codebase -- route.ts L103-108 shows current previousStatus field]

### Example 5: jiraSyncRetryFunction skeleton
```typescript
// Source: Pattern from jira-sync.ts jiraSyncOnStatusChange
export const jiraSyncRetryFunction = inngest.createFunction(
  {
    id: "jira-sync-retry",
    retries: 2,
    triggers: [{ event: EVENTS.JIRA_SYNC_REQUESTED }],
  },
  async ({ event, step }) => {
    const { projectId, storyId } = event.data as {
      projectId: string
      storyId: string
    }
    // Same flow as jiraSyncOnStatusChange:
    // 1. Check jira config
    // 2. Load story
    // 3. Push to Jira
    // 4. Sync status
    // 5. Upsert JiraSyncRecord
    // NO notification on failure (D-09)
  }
)
```
[VERIFIED: codebase -- jira-sync.ts provides complete template]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts (or similar) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-05 | PROJECT_STATE_CHANGED sent by question actions | unit | `npx vitest run tests/actions/questions.test.ts -t "PROJECT_STATE_CHANGED" -x` | Needs creation or extension |
| DASH-05 | PROJECT_STATE_CHANGED sent by transcript-processing | unit | `npx vitest run tests/lib/transcript-processing.test.ts -x` | Needs verification |
| DASH-05 | PROJECT_STATE_CHANGED sent by article-refresh | unit | `npx vitest run tests/lib/article-refresh.test.ts -x` | Needs creation |
| ADMIN-01 | stories.ts sends newStatus (not toStatus) | unit | `npx vitest run tests/actions/stories.test.ts -t "newStatus" -x` | Needs creation or extension |
| ADMIN-01 | route.ts sends fromStatus (not previousStatus) | unit | `npx vitest run tests/api/stories-status.test.ts -x` | Needs creation or extension |
| ADMIN-01 | jiraSyncRetryFunction triggers on JIRA_SYNC_REQUESTED | unit | `npx vitest run tests/unit/jira-sync.test.ts -t "retry" -x` | Extend existing |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Extend `tests/unit/jira-sync.test.ts` -- add retry function tests
- [ ] Verify question action test file exists or create mock for inngest.send assertions

## Security Domain

No security implications. This phase only:
- Adds event sends to existing authenticated server actions (auth already enforced)
- Creates a new Inngest function that runs server-side with no user input
- Fixes field names in existing event payloads

No new API endpoints, no new user input paths, no credential handling.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `updateQuestion` action (L138-186) is the correct location for "updateQuestionStatus" referenced in CONTEXT.md D-01 | Code Examples / Pitfall 4 | LOW -- Verified no separate updateQuestionStatus exists. If a separate action is added later, it would also need instrumentation. |

## Open Questions

1. **Additional question lifecycle transitions (Claude's Discretion)**
   - What we know: D-01 specifies createQuestion, answerQuestion, updateQuestionStatus. The `updateQuestion` action handles status changes AND content edits.
   - What's unclear: Whether content-only edits (e.g., changing questionText without changing status) should also trigger PROJECT_STATE_CHANGED.
   - Recommendation: Yes, add it to `updateQuestion` unconditionally -- it already sends ENTITY_CONTENT_CHANGED, and any question update can affect dashboard metrics. The 30s debounce protects against over-triggering.

## Sources

### Primary (HIGH confidence)
- Codebase grep/read: All source file references verified against current code
  - `src/lib/inngest/events.ts` -- event constants confirmed
  - `src/lib/inngest/functions/jira-sync.ts` -- full template read
  - `src/lib/inngest/functions/dashboard-synthesis.ts` -- debounce config confirmed
  - `src/lib/inngest/functions/article-refresh.ts` -- insertion point identified
  - `src/lib/inngest/functions/transcript-processing.ts` -- step.sendEvent array confirmed
  - `src/actions/questions.ts` -- createQuestion (L103-136), updateQuestion (L138-186), answerQuestion (L188-229)
  - `src/actions/stories.ts` -- toStatus field at L314 confirmed
  - `src/app/api/v1/stories/[storyId]/status/route.ts` -- previousStatus at L106 confirmed
  - `src/app/api/inngest/route.ts` -- registration pattern confirmed
  - `src/lib/inngest/functions/notification-dispatch.ts` -- confirmed unaffected by field rename (D-13)
- `.planning/v1.0-MILESTONE-AUDIT.md` -- source of all three bugs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, purely wiring fixes
- Architecture: HIGH -- all patterns verified in existing codebase
- Pitfalls: HIGH -- specific line numbers and field names verified

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable -- pure bug fixes against existing code)
