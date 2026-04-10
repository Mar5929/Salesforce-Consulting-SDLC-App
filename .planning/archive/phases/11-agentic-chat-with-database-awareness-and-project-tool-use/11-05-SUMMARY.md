---
phase: 11-agentic-chat-with-database-awareness-and-project-tool-use
plan: 05
subsystem: chat-route
tags: [agentic-chat, tool-wiring, streaming, approval-flow, schema-push]
dependency_graph:
  requires:
    - 11-01 (chat-tools infrastructure, buildToolsForRole, buildAgenticSystemPrompt)
    - 11-02 (query tools)
    - 11-03 (write and batch tools)
    - 11-04 (delete tools with needsApproval)
  provides:
    - Live agentic chat route wired with full tool repertoire
    - Role-scoped tool assembly per authenticated user
    - stopWhen: stepCountIs(15) multi-step chain limit
    - sendAutomaticallyWhen approval flow in useChat client
    - AGENTIC_CHAT enum pushed to live Neon database
  affects:
    - src/app/api/chat/route.ts
    - src/components/chat/chat-interface.tsx
    - src/components/chat/message-list.tsx
tech_stack:
  added: []
  patterns:
    - buildToolsForRole called after getCurrentMember — role comes from Clerk server session, never from request body (T-11-18)
    - stepCountIs(15) hard cap prevents infinite tool loops (T-11-19)
    - agenticTools spread in streamText tools object, session-specific tools overlaid
    - sendAutomaticallyWhen with lastAssistantMessageIsCompleteWithApprovalResponses for delete approval auto-resubmit
key_files:
  created:
    - tests/api/chat-route.test.ts
  modified:
    - src/app/api/chat/route.ts
    - src/components/chat/chat-interface.tsx
    - src/components/chat/message-list.tsx
decisions:
  - buildAgenticSystemPrompt replaces assembleEnhancedChatContext for GENERAL_CHAT (lean ~500 token prompt; tools fetch data on demand per D-15)
  - agenticTools spread before session-specific tools so story/enrichment session tools take precedence on key collisions
  - addToolApprovalResponse threaded through ChatInterface -> MessageList for future delete confirmation UI
metrics:
  duration: 7m
  completed: "2026-04-08T21:50:00Z"
  tasks: 2
  files: 4
---

# Phase 11 Plan 05: Chat Route Wiring and Schema Push Summary

**One-liner:** Agentic chat route wired with role-scoped tool assembly, stopWhen(15) cap, and delete approval flow using buildToolsForRole + buildAgenticSystemPrompt.

## What Was Built

Upgraded `src/app/api/chat/route.ts` to use the full agentic tool infrastructure built in Plans 01-04:

1. **buildToolsForRole wired** — called immediately after `getCurrentMember`, assembles role-scoped tool set (read/write/delete/batch) for the authenticated user's role
2. **buildAgenticSystemPrompt** — replaces the heavy `assembleEnhancedChatContext` + `buildSmartChatSystemPrompt` chain for GENERAL_CHAT sessions with a lean ~500-token prompt; tools fetch data on demand
3. **stopWhen: stepCountIs(15)** — hard cap on multi-step tool chains per D-16 / T-11-19 (prevents infinite loops regardless of prompt content)
4. **agenticTools spread** — `tools` in `streamText` now spreads `agenticTools` first, then overlays session-specific tools (`create_story_draft` for STORY_SESSION, `create_enrichment_suggestion` for ENRICHMENT_SESSION)
5. **All existing session branches preserved** — STORY_SESSION, BRIEFING_SESSION, ENRICHMENT_SESSION, QUESTION_SESSION prompt builders unchanged; TRANSCRIPT_SESSION still returns 400

Updated `src/components/chat/chat-interface.tsx`:
- `lastAssistantMessageIsCompleteWithApprovalResponses` imported from `"ai"` and passed as `sendAutomaticallyWhen` in useChat options
- `addToolApprovalResponse` destructured from `useChat` return value
- `addToolApprovalResponse` passed as prop to `MessageList`

Updated `src/components/chat/message-list.tsx`:
- `addToolApprovalResponse?: (params: { id: string; approved: boolean }) => void` added to `MessageListProps`

**Task 2: Schema push** — `npx prisma db push` synced the AGENTIC_CHAT enum (added to `SessionLogTaskType` in Plan 01) to the live Neon database. `npx prisma generate` regenerated the Prisma client confirming `AGENTIC_CHAT` at line 774.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `2b4fa8c` | feat(11-05): upgrade chat route with agentic tools, stopWhen, and approval flow client config |
| Task 2 | (no commit) | npx prisma db push — schema already committed in Plan 01, runtime operation only |

## Deviations from Plan

None — plan executed exactly as written.

**Worktree note:** This worktree was initialized at a stale HEAD (`4be449a`) before the Phase 11 feature commits. A `git reset --soft 3ed89c2` + `git checkout HEAD -- .` restored the correct base before execution.

## Known Stubs

None — all data paths are wired to live tool implementations.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced. T-11-18 (role injection prevention), T-11-19 (stopWhen DoS cap), T-11-20 (TRANSCRIPT_SESSION blocking), and T-11-21 (toolCalls audit) all implemented as specified in threat model.

## Self-Check: PASSED

- FOUND: src/app/api/chat/route.ts
- FOUND: src/components/chat/chat-interface.tsx
- FOUND: src/components/chat/message-list.tsx
- FOUND: tests/api/chat-route.test.ts
- FOUND: commit 2b4fa8c
- grep buildToolsForRole route.ts: lines 14, 89
- grep "stopWhen: stepCountIs" route.ts: line 221
- grep sendAutomaticallyWhen chat-interface.tsx: line 52
- grep addToolApprovalResponse chat-interface.tsx: lines 45, 177
- grep AGENTIC_CHAT src/generated/prisma/index.d.ts: line 774
- All 27 tests pass (6 test files)
- npx tsc --noEmit: no errors
