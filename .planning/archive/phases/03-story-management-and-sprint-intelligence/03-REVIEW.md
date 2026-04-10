---
phase: 03-story-management-and-sprint-intelligence
reviewed: 2026-04-06T20:15:00Z
depth: standard
files_reviewed: 67
files_reviewed_list:
  - package.json
  - prisma/schema.prisma
  - src/actions/conversations.ts
  - src/actions/epics.ts
  - src/actions/features.ts
  - src/actions/sprints.ts
  - src/actions/stories.ts
  - src/app/(dashboard)/projects/[projectId]/backlog/backlog-client.tsx
  - src/app/(dashboard)/projects/[projectId]/backlog/page.tsx
  - src/app/(dashboard)/projects/[projectId]/sprints/[sprintId]/page.tsx
  - src/app/(dashboard)/projects/[projectId]/sprints/page.tsx
  - src/app/(dashboard)/projects/[projectId]/sprints/sprint-list-client.tsx
  - src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/feature-detail-client.tsx
  - src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/page.tsx
  - src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx
  - src/app/(dashboard)/projects/[projectId]/work/[epicId]/page.tsx
  - src/app/(dashboard)/projects/[projectId]/work/page.tsx
  - src/app/(dashboard)/projects/[projectId]/work/work-page-client.tsx
  - src/app/api/chat/route.ts
  - src/app/api/inngest/route.ts
  - src/components/layout/sidebar.tsx
  - src/components/sprints/burndown-chart.tsx
  - src/components/sprints/conflict-banner.tsx
  - src/components/sprints/dependency-list.tsx
  - src/components/sprints/sprint-board.tsx
  - src/components/sprints/sprint-dashboard.tsx
  - src/components/sprints/sprint-form.tsx
  - src/components/sprints/sprint-intelligence-panel.tsx
  - src/components/sprints/sprint-planning.tsx
  - src/components/sprints/sprint-table.tsx
  - src/components/ui/chart.tsx
  - src/components/ui/checkbox.tsx
  - src/components/work/component-selector.tsx
  - src/components/work/epic-form.tsx
  - src/components/work/epic-kanban.tsx
  - src/components/work/epic-table.tsx
  - src/components/work/feature-form.tsx
  - src/components/work/feature-kanban.tsx
  - src/components/work/feature-table.tsx
  - src/components/work/story-draft-cards.tsx
  - src/components/work/story-form.tsx
  - src/components/work/story-kanban.tsx
  - src/components/work/story-table.tsx
  - src/components/work/view-toggle.tsx
  - src/components/work/work-breadcrumb.tsx
  - src/lib/agent-harness/context/index.ts
  - src/lib/agent-harness/context/stories-context.ts
  - src/lib/agent-harness/context/stories-in-sprint.ts
  - src/lib/agent-harness/tasks/index.ts
  - src/lib/agent-harness/tasks/sprint-intelligence.ts
  - src/lib/agent-harness/tasks/story-generation.ts
  - src/lib/agent-harness/tool-executor.ts
  - src/lib/agent-harness/tools/create-story-draft.ts
  - src/lib/burndown.ts
  - src/lib/display-id.ts
  - src/lib/inngest/events.ts
  - src/lib/inngest/functions/sprint-intelligence.ts
  - src/lib/story-status-machine.ts
  - tests/actions/sprints.test.ts
  - tests/fixtures/work-fixtures.ts
  - tests/helpers/mock-auth.ts
  - tests/helpers/mock-prisma.ts
  - tests/lib/burndown.test.ts
  - tests/lib/display-id-story.test.ts
  - tests/lib/story-status-machine.test.ts
  - vitest.config.ts
findings:
  critical: 2
  warning: 7
  info: 5
  total: 14
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-06T20:15:00Z
**Depth:** standard
**Files Reviewed:** 67
**Status:** issues_found

## Summary

Phase 03 implements story management (CRUD, status machine, display IDs), sprint management (CRUD, planning, board, dashboard), AI story generation (chat-based with tool calls), and sprint intelligence (conflict detection and dependency ordering via Inngest). The code is generally well-structured with consistent patterns: server actions use next-safe-action with Zod validation, project scoping is enforced via scopedPrisma, and role-based access is checked where appropriate.

Key concerns:
1. The `saveMessage` action has no authorization check -- any authenticated user can write to any conversation.
2. Sprint date validation has a bypass when only one date is updated (partial update allows invalid date ranges).
3. Bulk status/assignee changes in story-table fire individual actions without awaiting, causing premature UI refresh.
4. The `getSessionTokenTotals` action does not verify the conversation belongs to the specified project.
5. The chat API route lacks request body schema validation.

## Critical Issues

### CR-01: saveMessage Has No Authorization or Project-Scope Check

**File:** `src/actions/conversations.ts:250-282`
**Issue:** The `saveMessage` action accepts a `conversationId` and persists a message without verifying the caller is a member of the project that owns the conversation. Any authenticated user who knows a `conversationId` could write messages to conversations in projects they are not a member of. All other conversation actions properly call `getCurrentMember(projectId)`, but `saveMessage` does not even accept a `projectId` parameter. This is an authorization bypass.
**Fix:**
```typescript
const saveMessageSchema = z.object({
  projectId: z.string().min(1),  // Add projectId
  conversationId: z.string().min(1),
  role: z.enum(["USER", "ASSISTANT", "SYSTEM"]),
  content: z.string().min(1),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
})

export const saveMessage = actionClient
  .schema(saveMessageSchema)
  .action(
    async ({ parsedInput: { projectId, conversationId, role, content, ... } }) => {
      await getCurrentMember(projectId)
      // Verify conversation belongs to project
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, projectId },
      })
      if (!conversation) throw new Error("Conversation not found")
      // ... rest of logic
    }
  )
```

### CR-02: Incomplete Date Validation on Sprint Update Allows Invalid Date Ranges

**File:** `src/actions/sprints.ts:126-131`
**Issue:** When only `endDate` or only `startDate` is updated (not both simultaneously), no validation occurs against the existing stored date. A user could set `endDate` to a value before the existing `startDate` by only passing `endDate` in the update, bypassing the date validation check on lines 127-131 which only fires when both dates are present in the update payload. The `findUnique` on line 107 only selects `projectId`, so existing dates are not available for comparison.
**Fix:**
```typescript
// Change the select to include dates
const existing = await prisma.sprint.findUnique({
  where: { id: parsedInput.sprintId },
  select: { projectId: true, startDate: true, endDate: true },
})
// ...
// After building updateData, validate dates against existing values
if (updateData.startDate || updateData.endDate) {
  const effectiveStart = (updateData.startDate as Date) ?? existing.startDate
  const effectiveEnd = (updateData.endDate as Date) ?? existing.endDate
  if (effectiveEnd <= effectiveStart) {
    throw new Error("End date must be after start date")
  }
}
```

## Warnings

### WR-01: Bulk Status Change Does Not Await Server Actions

**File:** `src/components/work/story-table.tsx:280-289`
**Issue:** `handleBulkStatusChange` fires `executeStatusChange` in a `for` loop without awaiting each call, then immediately calls `setRowSelection({})` and `router.refresh()`. The `executeStatusChange` calls are non-blocking (fire-and-forget via `useAction`), so the router refreshes before the mutations complete. This causes a stale UI that does not reflect the status changes until a manual refresh.
**Fix:** Use `executeAsync` from next-safe-action and await each call, or create a batch server action that accepts multiple story IDs and a target status.

### WR-02: Bulk Assignee Change Does Not Await Server Actions

**File:** `src/components/work/story-table.tsx:297-307`
**Issue:** Same pattern as WR-01. `handleBulkAssigneeChange` fires multiple `executeUpdate` calls without awaiting, then immediately resets selection and refreshes. Updates may not be reflected.
**Fix:** Same approach as WR-01 -- either await each call or create a bulk server action.

### WR-03: Chat API Route Lacks Request Body Validation

**File:** `src/app/api/chat/route.ts:70-77`
**Issue:** The request body is parsed from JSON with `request.json()` but there is no schema validation. The destructured fields `messages`, `projectId`, `conversationId`, `epicId`, `featureId` are trusted as-is. While `projectId` and `conversationId` presence is checked, `messages` is passed directly to the AI SDK without validation. Malformed `messages` arrays could cause unexpected behavior or errors deep in the AI SDK.
**Fix:** Add Zod validation for the request body:
```typescript
const bodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.unknown(),
  })),
  projectId: z.string().min(1),
  conversationId: z.string().min(1),
  epicId: z.string().optional(),
  featureId: z.string().optional(),
})
const body = bodySchema.parse(await request.json())
```

### WR-04: Sprint Intelligence AI Response Parsing Uses Greedy Regex

**File:** `src/lib/inngest/functions/sprint-intelligence.ts:145`
**Issue:** The regex `text.match(/\{[\s\S]*\}/)` is greedy and matches from the first `{` to the last `}` in the response. If the AI includes any text with curly braces after the JSON object, this could capture extra content and cause `JSON.parse` to fail. The function silently falls back to `{ conflicts: [], dependencies: [] }` on parse failure, which means legitimate conflicts could be silently dropped.
**Fix:** Try parsing the full text first, then fall back to extraction:
```typescript
let parsed: AnalysisResult
try {
  parsed = JSON.parse(text)
} catch {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { conflicts: [], dependencies: [] }
  parsed = JSON.parse(jsonMatch[0])
}
```

### WR-05: getSessionTokenTotals Does Not Verify Conversation Belongs to Project

**File:** `src/actions/conversations.ts:179-197`
**Issue:** The `getSessionTokenTotals` action verifies project membership via `getCurrentMember(projectId)`, but then queries `chatMessage.aggregate` using only `conversationId` without verifying the conversation belongs to the specified project. A user who is a member of project A could pass a `conversationId` from project B and retrieve token usage data from a conversation they should not have access to.
**Fix:**
```typescript
// After getCurrentMember, verify conversation belongs to project
const conversation = await prisma.conversation.findFirst({
  where: { id: conversationId, projectId },
})
if (!conversation) throw new Error("Conversation not found")

const result = await prisma.chatMessage.aggregate({
  where: { conversationId: conversation.id },
  // ...rest
})
```

### WR-06: Display ID Race Condition Under Concurrent Story Creation

**File:** `src/lib/display-id.ts:127-163`
**Issue:** `generateStoryDisplayId` queries all existing stories with the prefix, finds the max number, and increments it. Under concurrent requests, two calls could read the same max number and generate the same display ID. The retry-on-P2002 mechanism only works if there is a unique constraint on `displayId` in the schema. The retry does re-read the max (which is correct), but only retries once. Under high concurrency this could still fail.
**Fix:** This is acceptable for V1 given the low-concurrency use case. Add a comment documenting the limitation and consider a database-level sequence for V2.

### WR-07: Bulk Status Change Dropdown Shows All Statuses Regardless of Selection

**File:** `src/components/work/story-table.tsx:324-335`
**Issue:** The bulk "Change Status" dropdown always shows all 7 statuses (`ALL_STATUSES`) regardless of the current status of selected stories. When stories in different states are selected, applying a status change will fail for some stories (the server validates transitions) while succeeding for others. The error toasts would appear alongside success toasts, creating a confusing UX.
**Fix:** Filter the dropdown options to only show transitions valid for ALL selected stories, or show a confirmation dialog noting which stories cannot be transitioned.

## Info

### IN-01: console.error in Production Chat API Route

**File:** `src/app/api/chat/route.ts:181`
**Issue:** `console.error("[Chat API Error]", error)` will log to server output in production. Consider using a structured logger for production environments.
**Fix:** Replace with a structured logging call or remove in favor of error monitoring.

### IN-02: Duplicated System Prompt Between Chat Route and Task Definition

**File:** `src/app/api/chat/route.ts:33-59` and `src/lib/agent-harness/tasks/story-generation.ts:56-82`
**Issue:** The story generation system prompt is duplicated between the chat API route's `buildStorySessionPrompt` function and the `storyGenerationTask` task definition. Changes to one will not automatically propagate to the other, risking divergence.
**Fix:** Extract the shared prompt template to a single constant and import it in both locations.

### IN-03: Hardcoded Model String in Sprint Intelligence Function

**File:** `src/lib/inngest/functions/sprint-intelligence.ts:129`
**Issue:** The model `"claude-sonnet-4-20250514"` is hardcoded rather than referencing the `DEFAULT_MODEL` constant used elsewhere (e.g., in the chat route's cost calculation). If the default model changes, this function would be missed.
**Fix:** Import and use `DEFAULT_MODEL` from `@/lib/config/ai-pricing` or define a central AI model config.

### IN-04: Type Assertions Using `as` in Multiple Components

**File:** Multiple files including `src/app/(dashboard)/projects/[projectId]/backlog/backlog-client.tsx:90`, `src/components/work/story-form.tsx:282`, `src/components/sprints/sprint-board.tsx:286`
**Issue:** Several components use `as` type assertions to force type compatibility (e.g., `as Parameters<typeof StoryForm>[0]["story"]`, `as Parameters<typeof executeUpdateStatus>[0]["status"]`). These mask potential type mismatches at compile time.
**Fix:** Define explicit shared types for these interfaces rather than using parameter extraction patterns.

### IN-05: Duplicated Style Constants Across Components

**File:** `src/components/sprints/sprint-board.tsx:55-60`, `src/components/sprints/sprint-planning.tsx:52-57`, `src/components/work/story-table.tsx:99-104`, `src/components/work/story-draft-cards.tsx:56-61`
**Issue:** `PRIORITY_STYLES`, `STATUS_STYLES`, and `STATUS_LABELS` Record objects are defined identically in at least 4-6 different component files.
**Fix:** Extract these shared style constants to a central file (e.g., `src/lib/constants/status-styles.ts`) and import them.

---

_Reviewed: 2026-04-06T20:15:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
