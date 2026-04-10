---
phase: 07-story-generation-e2e-wiring
verified: 2026-04-07T18:30:00Z
status: human_needed
score: 4/4
overrides_applied: 0
human_verification:
  - test: "Click Generate Stories on an epic detail page and verify the redirect includes epicId in the URL"
    expected: "Browser navigates to /projects/{id}/chat/{conversationId}?epicId=...&featureId=..."
    why_human: "Requires running app with seeded data, Clerk auth, and a real epic to click"
  - test: "Send a message in a STORY_SESSION chat and verify StoryDraftCards render inline"
    expected: "AI responds with create_story_draft tool calls and story draft cards appear below the assistant message with accept/reject buttons"
    why_human: "Requires live AI response with tool call streaming -- cannot verify statically"
---

# Phase 7: Story Generation E2E Wiring Verification Report

**Phase Goal:** Wire the complete AI story generation flow end-to-end so epicId reaches the API, StoryDraftCards render, and buildStorySessionPrompt activates
**Verified:** 2026-04-07T18:30:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Clicking Generate Stories on epic detail redirects to chat page with epicId in the URL | VERIFIED | `epic-detail-client.tsx` lines 53-56: `new URLSearchParams()`, `params.set("epicId", epic.id)`, `router.push(...)` with `?${params.toString()}` |
| 2 | ChatInterface in STORY_SESSION mode forwards epicId to the /api/chat endpoint | VERIFIED | `chat-interface.tsx` line 17: `"STORY_SESSION"` in type union; line 44: `...(epicId && { epicId })` in DefaultChatTransport body |
| 3 | /api/chat receives epicId and invokes buildStorySessionPrompt for STORY_SESSION conversations | VERIFIED | `route.ts` line 109: `if (conversation.conversationType === "STORY_SESSION" && epicId)` then calls `buildStorySessionPrompt(projectId, epicId, featureId)` |
| 4 | AI tool call responses render as StoryDraftCards in the chat message list | VERIFIED | `message-list.tsx` line 8: imports StoryDraftCards; lines 96-120: filters `create_story_draft` tool invocations; lines 139-145: renders `<StoryDraftCards>` |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx` | Redirect URL with epicId/featureId search params | VERIFIED | URLSearchParams constructed with epicId, appended to router.push URL |
| `src/app/(dashboard)/projects/[projectId]/chat/[conversationId]/page.tsx` | STORY_SESSION detection and search param forwarding to ChatInterface | VERIFIED | searchParams in page props, STORY_SESSION mapped correctly, epicId/featureId passed as props |
| `src/components/chat/chat-interface.tsx` | STORY_SESSION variant that includes epicId in transport body | VERIFIED | STORY_SESSION in type union, epicId/featureId in destructured props and transport body, storySession prop passed to MessageList |
| `src/components/chat/message-list.tsx` | Tool call rendering via StoryDraftCards | VERIFIED | StoryDraftCards imported, ToolInvocationPart interface defined, create_story_draft filter, StoryDraftCards rendered inline |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| epic-detail-client.tsx | [conversationId]/page.tsx | router.push with ?epicId=...&featureId=... | WIRED | Line 56: `router.push(...)` with URLSearchParams |
| [conversationId]/page.tsx | chat-interface.tsx | epicId and conversationType props | WIRED | Lines 64-65: `epicId={epicId}`, `featureId={featureId}` passed as props; line 33-37: STORY_SESSION mapped |
| chat-interface.tsx | /api/chat | DefaultChatTransport body includes epicId | WIRED | Line 44: `...(epicId && { epicId })` in body object |
| message-list.tsx | story-draft-cards.tsx | import and render StoryDraftCards | WIRED | Line 8: `import { StoryDraftCards }`, line 139: `<StoryDraftCards>` rendered |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| message-list.tsx | toolInvocations | UIMessage.parts filtered in chat-interface.tsx (lines 93-95) | Yes -- sourced from Vercel AI SDK streaming response | FLOWING |
| message-list.tsx | storySession | Props from chat-interface.tsx (line 124) | Yes -- derived from URL search params and conversationType | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED (requires running Next.js server with Clerk auth and seeded database -- no runnable entry points for static verification)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| WORK-06 | 07-01-PLAN.md | AI-assisted story generation from requirements and discovery context | SATISFIED | All 4 integration break points resolved: epicId flows E2E from button to API, StoryDraftCards render from tool calls |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | - | - | No anti-patterns found in modified files |

### Human Verification Required

### 1. End-to-End Story Generation Flow

**Test:** Navigate to an epic detail page, click "Generate Stories", verify redirect URL includes epicId, then send a message in the story session chat
**Expected:** (1) URL shows `?epicId=...` after redirect, (2) AI responds with story draft tool calls, (3) StoryDraftCards appear inline below the assistant message with accept/reject UI
**Why human:** Requires running Next.js app with Clerk auth, seeded project/epic data, and live Claude API for tool call streaming

### 2. StoryDraftCards Accept/Reject Interaction

**Test:** In a story session chat with rendered StoryDraftCards, click "Accept" on a draft card
**Expected:** Story is created in the database and card updates to show accepted state
**Why human:** Requires live server action execution and database state verification

### Gaps Summary

No automated gaps found. All 4 must-have truths are verified at the code level. All artifacts exist, are substantive (not stubs), and are properly wired. The epicId data flows from the Generate Stories button through URL search params, server page props, ChatInterface transport body, to the API route where buildStorySessionPrompt activates. StoryDraftCards are imported and rendered for create_story_draft tool invocations.

Two items require human verification: the full E2E flow with a running server and the accept/reject card interaction.

---

_Verified: 2026-04-07T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
