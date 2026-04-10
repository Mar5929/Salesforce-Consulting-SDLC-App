---
phase: 11-agentic-chat-with-database-awareness-and-project-tool-use
plan: "01"
subsystem: chat-tools
tags: [chat, tools, role-gating, audit, system-prompt, schema]
dependency_graph:
  requires: []
  provides:
    - src/lib/chat-tools/types.ts
    - src/lib/chat-tools/index.ts
    - src/lib/chat-tools/audit.ts
    - src/lib/chat-tools/system-prompt.ts
  affects:
    - prisma/schema.prisma
tech_stack:
  added: []
  patterns:
    - satisfies Record<ProjectRole, Record<ToolCategory, boolean>> for compile-time role permission completeness
    - fire-and-forget audit helper pattern (swallows errors to never fail main request)
    - registry skeleton with role-gated permission branches for Plans 02-04 to fill in
key_files:
  created:
    - src/lib/chat-tools/types.ts
    - src/lib/chat-tools/audit.ts
    - src/lib/chat-tools/system-prompt.ts
    - src/lib/chat-tools/index.ts
    - tests/lib/chat-tools/build-tools.test.ts
    - tests/lib/chat-tools/role-gating.test.ts
  modified:
    - prisma/schema.prisma
decisions:
  - "ROLE_PERMISSIONS uses satisfies guard against Record<ProjectRole, ...> so TypeScript enforces completeness when new roles are added to the enum"
  - "logToolCall is currently a no-op stub — onFinish in route.ts already persists toolCalls JSON; helper retained for future audit table migration"
  - "buildToolsForRole returns empty {} skeleton — Plans 02-04 add tool modules into read/write/delete/batch branches"
metrics:
  duration: 5m
  completed_date: "2026-04-08"
  tasks_completed: 2
  files_changed: 7
---

# Phase 11 Plan 01: Chat-Tools Infrastructure Layer Summary

**One-liner:** Role-gated tool registry skeleton, typed ToolResult/ROLE_PERMISSIONS constants, lean agentic system prompt builder, and audit stub — the stable contracts that Plans 02-05 build on top of.

## What Was Built

### Task 1: Schema Migration
Added `AGENTIC_CHAT` as the final entry in `SessionLogTaskType` enum in `prisma/schema.prisma`. No db push yet — consolidated in Plan 05 after all Phase 11 schema changes accumulate.

### Task 2: Chat-Tools Infrastructure
Four new modules under `src/lib/chat-tools/`:

- **types.ts** — `ToolResult<T>` discriminated union, `ToolCategory` string union, `ROLE_PERMISSIONS` constant map. The `satisfies Record<ProjectRole, Record<ToolCategory, boolean>>` guard makes TypeScript reject any missing role at compile time — T-11-01 mitigation.
- **audit.ts** — `logToolCall()` fire-and-forget helper. Currently a no-op (onFinish in the chat route already persists toolCalls JSON). Retained as an explicit structural hook for future per-call audit table migration.
- **system-prompt.ts** — `buildAgenticSystemPrompt(projectId)` builds a lean ~500-800 token prompt by calling the existing `getProjectSummary()` context loader. Scoped to projectId — T-11-03 accepted as acceptable information disclosure.
- **index.ts** — `buildToolsForRole(role, projectId, memberId)` registry skeleton. Returns `{}` today. Has four gated branches (read/write/delete/batch) where Plans 02-04 will import and register their tool modules.

Nine tests pass: 2 in build-tools.test.ts (registry shape), 7 in role-gating.test.ts (all 5 role permissions verified).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `buildToolsForRole` returns `{}` — intentional skeleton. Plans 02-04 will populate the read/write/delete/batch branches. Plan 05 calls it in the chat route. This stub does not block the plan's goal (establishing the stable registry contract).
- `logToolCall` is a no-op — intentional. Documented in code. Future audit table migration will give it behavior.

## Threat Surface

No new network endpoints introduced. `ROLE_PERMISSIONS` is a compile-time constant, not runtime-configurable (T-11-01 mitigated). `buildToolsForRole` role input comes from `getCurrentMember()` in the chat route — not from the request body (T-11-02 mitigated).

## Self-Check: PASSED

Files verified:
- src/lib/chat-tools/types.ts — FOUND
- src/lib/chat-tools/audit.ts — FOUND
- src/lib/chat-tools/system-prompt.ts — FOUND
- src/lib/chat-tools/index.ts — FOUND
- tests/lib/chat-tools/build-tools.test.ts — FOUND
- tests/lib/chat-tools/role-gating.test.ts — FOUND

Commits verified:
- 9ae865c feat(11-01): add AGENTIC_CHAT to SessionLogTaskType enum
- b6dd257 feat(11-01): add chat-tools infrastructure layer

Tests: 9/9 passed. TypeScript: 0 errors.
