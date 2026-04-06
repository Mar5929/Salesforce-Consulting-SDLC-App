---
phase: 03-story-management-and-sprint-intelligence
reviewed: 2026-04-06T19:45:00Z
depth: standard
files_reviewed: 65
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
  critical: 1
  warning: 6
  info: 4
  total: 11
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-06T19:45:00Z
**Depth:** standard
**Files Reviewed:** 65
**Status:** issues_found

## Summary

Phase 03 implements story management (CRUD, status machine, display IDs), sprint management (CRUD, story assignment, planning UI), sprint intelligence (AI-powered conflict detection via Inngest), and the AI story generation chat session. The code is well-structured with consistent patterns: server actions use next-safe-action with Zod validation, project scoping via scopedPrisma, and role-based access control. The sprint intelligence Inngest function follows a clean deterministic-then-AI two-phase pattern.

Key concerns: one authorization bypass in the conversations action (saveMessage has no project scope check), a partial date validation gap in sprint updates, and the bulk status change in the story table bypasses the status machine.

## Critical Issues

### CR-01: saveMessage has no authorization or project-scope check

**File:** `src/actions/conversations.ts:250-282`
**Issue:** The `saveMessage` action accepts a `conversationId` and persists a message without verifying the caller is a member of the project that owns the conversation. Any authenticated user who knows a `conversationId` could write messages to conversations in projects they are not a member of. All other conversation actions properly call `getCurrentMember(projectId)`, but `saveMessage` does not even accept a `projectId` parameter.
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

## Warnings

### WR-01: Sprint date validation gap when only one date is updated

**File:** `src/actions/sprints.ts:126-131`
**Issue:** When updating a sprint, date validation only runs when both `startDate` and `endDate` are provided in the same update call. If only `endDate` is updated to a value before the existing `startDate` (or vice versa), the invalid state is persisted. The code should fetch the existing dates and validate against them when only one date is changing.
**Fix:**
```typescript
// After building updateData, validate dates against existing values
if (updateData.startDate || updateData.endDate) {
  const existingSprint = await prisma.sprint.findUnique({
    where: { id: parsedInput.sprintId },
    select: { startDate: true, endDate: true },
  })
  const effectiveStart = (updateData.startDate as Date) ?? existingSprint?.startDate
  const effectiveEnd = (updateData.endDate as Date) ?? existingSprint?.endDate
  if (effectiveEnd && effectiveStart && effectiveEnd <= effectiveStart) {
    throw new Error("End date must be after start date")
  }
}
```

### WR-02: Bulk status change in StoryTable bypasses the status machine

**File:** `src/components/work/story-table.tsx:270-279`
**Issue:** `handleBulkStatusChange` iterates over selected rows and calls `updateStoryStatus` for each. While the server action does validate transitions, the UI offers all 7 statuses in the dropdown regardless of the current status of each selected story. This means a user could select stories in different states and attempt invalid transitions for some of them. The errors would surface as toasts, but the UX is confusing because some stories would transition and others would fail silently in the batch. Consider filtering the dropdown options based on common valid transitions, or at minimum noting this limitation.
**Fix:** Filter the status dropdown to only show transitions valid for ALL selected stories, or show a warning that some transitions may fail when stories are in mixed states.

### WR-03: Bulk sprint assignment in StoryTable is non-functional

**File:** `src/components/work/story-table.tsx:282-293`
**Issue:** `handleBulkSprintAssign` calls `updateStory` but never passes a `sprintId` field. The `updateStorySchema` does not include `sprintId` as a field, so this bulk action does nothing useful. The code even has a comment acknowledging this: "Sprint assignment will be available when sprint management is built." However, sprint management IS now built (via `assignStoriesToSprint` in sprints.ts). This should be wired up to the actual sprint assignment action.
**Fix:** Use `assignStoriesToSprint` from `@/actions/sprints` for the bulk sprint assignment, passing all selected story IDs in one call.

### WR-04: Display ID generation race condition under concurrent requests

**File:** `src/lib/display-id.ts:127-163`
**Issue:** `generateStoryDisplayId` fetches all display IDs, finds the max, and increments. Between the read and the subsequent write (in the caller `createStory`), another concurrent request could generate the same ID. The retry-on-P2002 mitigates this but only retries once. Under high concurrency (unlikely for this app but worth noting), the second attempt could also collide. The `generateDisplayId` function for other entity types has the same pattern. Consider using a database sequence or `SELECT ... FOR UPDATE` for stronger guarantees.
**Fix:** This is acceptable for V1 given the low-concurrency use case, but add a comment documenting the limitation and consider a database-level sequence for V2.

### WR-05: getSessionTokenTotals does not verify conversation belongs to project

**File:** `src/actions/conversations.ts:179-197`
**Issue:** `getSessionTokenTotals` verifies project membership but queries `chatMessage.aggregate` using only `conversationId` without verifying the conversation belongs to the given `projectId`. An authenticated member of project A could pass a `conversationId` from project B and retrieve token usage data.
**Fix:**
```typescript
// After getCurrentMember, verify conversation belongs to project
const conversation = await prisma.conversation.findFirst({
  where: { id: conversationId, projectId },
})
if (!conversation) throw new Error("Conversation not found")
```

### WR-06: Chat API route does not validate request body schema

**File:** `src/app/api/chat/route.ts:70-77`
**Issue:** The POST handler parses `request.json()` and destructures `messages`, `projectId`, `conversationId`, `epicId`, `featureId` without any schema validation. While `projectId` and `conversationId` are null-checked, `messages` is passed directly to `streamText` without validation. Malformed message arrays could cause unexpected behavior. The `epicId` and `featureId` are used in database queries without sanitization (though Prisma parameterizes queries, so SQL injection is not a risk).
**Fix:** Add Zod schema validation for the request body:
```typescript
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.union([z.string(), z.array(z.unknown())]),
  })),
  projectId: z.string().min(1),
  conversationId: z.string().min(1),
  epicId: z.string().optional(),
  featureId: z.string().optional(),
})
```

## Info

### IN-01: console.error in chat API route

**File:** `src/app/api/chat/route.ts:181`
**Issue:** `console.error("[Chat API Error]", error)` is present. This is acceptable for an API route error handler but should be replaced with structured logging in production.
**Fix:** Replace with a structured logger when one is added to the project.

### IN-02: Unused import in conversations.ts

**File:** `src/actions/conversations.ts:8`
**Issue:** `ConversationType` and `ChatMessageRole` are imported but `ConversationType` is only used via a cast (`as ConversationType`) and `ChatMessageRole` similarly. The Zod enum validation already constrains values, making the cast redundant.
**Fix:** Remove the type imports and the `as` casts, since Zod validation already ensures correct values.

### IN-03: Hardcoded color values throughout components

**File:** Multiple files (e.g., `sprint-board.tsx`, `sprint-table.tsx`, `story-table.tsx`, `epic-table.tsx`)
**Issue:** Color values like `#2563EB`, `#737373`, `#E5E5E5`, `#FAFAFA` are repeated across many components without centralized constants. While this follows the established pattern in the codebase and matches the UI design spec, it creates maintenance risk if the design system evolves. This is not a bug but worth tracking.
**Fix:** Consider extracting to a shared theme constants file when the design system stabilizes.

### IN-04: Sprint intelligence stores empty title strings in cached analysis

**File:** `src/lib/inngest/functions/sprint-intelligence.ts:158-169`
**Issue:** The cached analysis initially sets `storyA.title` and `storyB.title` to empty strings (`""`), then enriches them from `sprintData` using a `titleMap`. If the AI response contains a `storyADisplayId` that does not match any story in `sprintData` (e.g., AI hallucination), the title will remain as an empty string. The conflict banner would then show an empty title, which is a cosmetic issue.
**Fix:** Add a fallback like `titleMap.get(conflict.storyA.displayId) || conflict.storyA.displayId` so the display ID is shown when the title lookup fails.

---

_Reviewed: 2026-04-06T19:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
