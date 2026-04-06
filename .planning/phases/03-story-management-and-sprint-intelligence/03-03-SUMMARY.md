---
phase: 03-story-management-and-sprint-intelligence
plan: 03
subsystem: ai-agent
tags: [agent-harness, story-generation, claude-api, vercel-ai-sdk, tool-calling, context-assembly]

# Dependency graph
requires:
  - phase: 02-discovery-and-knowledge-brain
    provides: agent harness three-layer architecture, chat route, conversation actions
  - phase: 03-story-management-and-sprint-intelligence plan 01
    provides: stories server actions (createStory, addStoryComponent), story status machine
provides:
  - Story generation task definition (AGENT_LOOP with create_story_draft tool)
  - Stories context assembly (requirements, questions, decisions, knowledge articles)
  - Story draft review cards with accept/reject UI
  - STORY_SESSION chat route integration with tool calling
  - initiateStorySession server action for launching generation
affects: [03-sprint-intelligence, 04-salesforce-connectivity]

# Tech tracking
tech-stack:
  added: []
  patterns: [AI SDK tool() with inputSchema for streaming tool calls, context assembly for story scope]

key-files:
  created:
    - src/lib/agent-harness/tasks/story-generation.ts
    - src/lib/agent-harness/tools/create-story-draft.ts
    - src/lib/agent-harness/context/stories-context.ts
    - src/components/work/story-draft-cards.tsx
  modified:
    - src/lib/agent-harness/tasks/index.ts
    - src/lib/agent-harness/tool-executor.ts
    - src/app/api/chat/route.ts
    - src/actions/conversations.ts

key-decisions:
  - "epicId/featureId passed as request body params to chat route, not stored in Conversation metadata (model has no metadata field)"
  - "AI SDK tool() with inputSchema used for streaming tool calls instead of raw JSON schema from task definition"
  - "Story generation system prompt inlined in chat route buildStorySessionPrompt to avoid import dependency on task definition"

patterns-established:
  - "Story draft tool pattern: AI proposes drafts via tool calls, stored in toolCalls JSON, rendered as accept/reject cards"
  - "Scoped context assembly: getStoriesContext loads requirements/questions/decisions/knowledge filtered by epic/feature scope"

requirements-completed: [WORK-06]

# Metrics
duration: 6min
completed: 2026-04-06
---

# Phase 03 Plan 03: AI Story Generation Summary

**AGENT_LOOP story generation with create_story_draft tool, scoped context assembly from requirements/questions/decisions/knowledge, and accept/reject draft cards integrated into STORY_SESSION chat**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-06T21:51:53Z
- **Completed:** 2026-04-06T21:57:53Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Built story generation task definition with AGENT_LOOP execution mode and create_story_draft tool
- Created stories context assembly loading requirements (via RequirementEpic), answered questions, decisions (via DecisionScope), knowledge articles (BUSINESS_PROCESS + DOMAIN_OVERVIEW summaries), and existing stories for dedup
- Implemented story draft review cards with accept (persists via createStory + addStoryComponent), reject (removes from UI), priority/points badges, components pills, and collapsible AI reasoning
- Integrated STORY_SESSION handling into chat route with Vercel AI SDK tool() for streaming tool calls
- Added initiateStorySession server action for launching story generation from epic context menu

## Task Commits

Each task was committed atomically:

1. **Task 1: Story generation task definition, context module, and draft tool** - `c733eaf` (feat)
2. **Task 2: Story draft review cards and chat route integration** - `001767e` (feat)

## Files Created/Modified
- `src/lib/agent-harness/tasks/story-generation.ts` - AGENT_LOOP task with system prompt for story generation (WORK-06)
- `src/lib/agent-harness/tools/create-story-draft.ts` - Tool for AI to propose story drafts stored in toolCalls JSON
- `src/lib/agent-harness/context/stories-context.ts` - Scoped context loader: requirements, questions, decisions, knowledge, existing stories
- `src/lib/agent-harness/tasks/index.ts` - Added storyGenerationTask export
- `src/lib/agent-harness/tool-executor.ts` - Added create_story_draft dispatch
- `src/components/work/story-draft-cards.tsx` - Accept/reject card UI for AI-generated drafts
- `src/app/api/chat/route.ts` - STORY_SESSION handling with AI SDK tool() and story generation prompt
- `src/actions/conversations.ts` - Added initiateStorySession action

## Decisions Made
- epicId/featureId passed as request body params to chat route rather than stored in Conversation model metadata (Conversation model has no metadata JSON field -- Rule 3 adaptation)
- Used Vercel AI SDK `tool()` with `inputSchema` (Zod schema) for chat route streaming, while keeping separate ClaudeToolDefinition in task definition for direct Anthropic SDK usage in agent harness
- Story generation system prompt inlined in buildStorySessionPrompt function to decouple chat route from storyGenerationTask import

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Conversation model has no metadata field**
- **Found during:** Task 2 (initiateStorySession implementation)
- **Issue:** Plan specified storing epicId/featureId in Conversation.metadata, but the Conversation Prisma model has no metadata JSON field
- **Fix:** Pass epicId/featureId as request body params to the chat route instead of storing in DB. Conversation title encodes the epic name for display.
- **Files modified:** src/app/api/chat/route.ts, src/actions/conversations.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 001767e (Task 2 commit)

**2. [Rule 3 - Blocking] Vercel AI SDK v6 tool() uses inputSchema not parameters**
- **Found during:** Task 2 (chat route tool definition)
- **Issue:** Initial implementation used `parameters` key in tool() call, but AI SDK v6 Tool type uses `inputSchema`
- **Fix:** Changed `parameters` to `inputSchema` in the tool() definition
- **Files modified:** src/app/api/chat/route.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 001767e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for compilation. No scope creep. Functionality preserved.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Story generation agent harness fully wired: task definition, context assembly, tool, and chat integration
- Ready for sprint management plans (03-04+) which may reference story generation
- Epic detail page "Generate Stories" button can be wired to call initiateStorySession and redirect to chat

---
*Phase: 03-story-management-and-sprint-intelligence*
*Completed: 2026-04-06*
