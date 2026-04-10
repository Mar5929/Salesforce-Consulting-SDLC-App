---
phase: 07-story-generation-e2e-wiring
plan: 01
subsystem: ui
tags: [vercel-ai-sdk, chat, story-generation, tool-calls, streaming]

# Dependency graph
requires:
  - phase: 03-story-management-and-sprint-intelligence
    provides: StoryDraftCards component, initiateStorySession action, chat route handler with STORY_SESSION branch
provides:
  - E2E wiring from Generate Stories button through AI story draft rendering with accept/reject cards
  - STORY_SESSION variant in ChatInterface with epicId forwarding
  - Tool call rendering in MessageList via StoryDraftCards
affects: [story-generation, chat, work-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "URL search params for cross-page context passing (epicId/featureId)"
    - "UIMessage.parts tool-invocation extraction for inline tool call rendering"
    - "StorySession context prop pattern for conditional rendering in message list"

key-files:
  created: []
  modified:
    - src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx
    - src/app/(dashboard)/projects/[projectId]/chat/[conversationId]/page.tsx
    - src/components/chat/chat-interface.tsx
    - src/components/chat/message-list.tsx

key-decisions:
  - "epicId/featureId passed via URL search params from epic detail to chat page (not stored in conversation metadata)"
  - "Tool invocations extracted from UIMessage.parts and mapped to StoryDraft interface inline in message-list"

patterns-established:
  - "URL search params for epicId/featureId cross-page context: URLSearchParams in redirect, searchParams in server page props"
  - "Tool call rendering: filter UIMessage parts for tool-invocation type, map args to domain interface, render inline after MessageBubble"

requirements-completed: [WORK-06]

# Metrics
duration: 3min
completed: 2026-04-07
---

# Phase 07 Plan 01: Story Generation E2E Wiring Summary

**Wired 4 broken integration points connecting Generate Stories button through AI tool call rendering with StoryDraftCards accept/reject UI**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T12:08:55Z
- **Completed:** 2026-04-07T12:11:25Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- epicId/featureId flow end-to-end from Generate Stories button click through URL search params, server page, ChatInterface props, into /api/chat request body where buildStorySessionPrompt activates
- STORY_SESSION variant added to ChatInterface conversationType union with context panel display
- StoryDraftCards component imported and rendered inline in chat message list when AI makes create_story_draft tool calls

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire epicId through redirect URL and ChatInterface STORY_SESSION variant** - `8f7e56e` (feat)
2. **Task 2: Render StoryDraftCards from AI tool call parts in message list** - `9500aaa` (feat)

## Files Created/Modified
- `src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx` - Append epicId/featureId as URL search params to redirect after initiateStorySession
- `src/app/(dashboard)/projects/[projectId]/chat/[conversationId]/page.tsx` - Read searchParams, map STORY_SESSION conversationType, pass epicId/featureId to ChatInterface
- `src/components/chat/chat-interface.tsx` - Add STORY_SESSION to type union, forward epicId in transport body, extract tool-invocation parts, pass storySession to MessageList
- `src/components/chat/message-list.tsx` - Import StoryDraftCards, add ToolInvocationPart interface, render StoryDraftCards for create_story_draft tool calls

## Decisions Made
- epicId/featureId passed via URL search params from epic detail to chat page, consistent with Phase 03 decision (Conversation model has no metadata field)
- Tool invocations extracted from UIMessage.parts and mapped to StoryDraft interface inline in message-list rather than a separate adapter layer

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 break points from v1.0 audit WORK-06 gap are resolved
- Story generation E2E flow is fully wired
- Ready for Phase 08 (schema fixes) or further gap closure work

---
*Phase: 07-story-generation-e2e-wiring*
*Completed: 2026-04-07*
