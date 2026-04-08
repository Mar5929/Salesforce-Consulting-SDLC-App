---
phase: 11-agentic-chat-with-database-awareness-and-project-tool-use
plan: "04"
subsystem: chat-tools/delete
tags: [delete-tools, needsApproval, role-gating, D-05, D-08]
dependency_graph:
  requires:
    - 11-01 (types, ROLE_PERMISSIONS, buildToolsForRole skeleton)
    - 11-02 (read tools)
    - 11-03 (write and batch tools)
  provides:
    - delete tool layer with needsApproval: true on all 10 entities
    - perms.delete gate in buildToolsForRole (SA and PM only)
  affects:
    - src/lib/chat-tools/index.ts (delete tools wired)
tech_stack:
  added: []
  patterns:
    - needsApproval: true — AI SDK structural gate (execute only runs after user confirms)
    - execute-time role double-check — prevents approval replay attacks
    - scopedPrisma — cross-project deletion is structurally impossible
key_files:
  created:
    - src/lib/chat-tools/delete/delete-tools.ts
    - tests/lib/chat-tools/delete-tools.test.ts
  modified:
    - src/lib/chat-tools/index.ts
decisions:
  - needsApproval: true is a code-level gate, not a prompt instruction — AI cannot bypass deletion
  - delete_sprint restricted to PM-only (SA excluded per RESEARCH.md sprint ownership rules)
  - delete_test_case allows SA, PM, and QA (QA manages test artifacts)
  - All other delete tools restricted to SA and PM
metrics:
  duration: ~10 minutes
  completed: 2026-04-08
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 11 Plan 04: Delete Tool Layer Summary

Delete tool layer for all 10 mutable entities, all gated by `needsApproval: true` (D-05 structural gate), wired into buildToolsForRole for SA and PM roles only.

## What Was Built

### Task 1: delete-tools.ts — all 10 delete tools

`src/lib/chat-tools/delete/delete-tools.ts` exports `deleteTools(projectId, memberId, role)` returning:

| Tool | Role restriction | Returns on success |
|------|-----------------|-------------------|
| delete_story | SA, PM | { id, displayId, title } |
| delete_epic | SA, PM | { id, name, prefix } (cascades features/stories) |
| delete_feature | SA, PM | { id, name, prefix } |
| delete_question | SA, PM | { id, displayId, title } |
| delete_decision | SA, PM | { id, displayId, title } |
| delete_requirement | SA, PM | { id, displayId, title } |
| delete_risk | SA, PM | { id, displayId, title } |
| delete_sprint | PM only | { id, name } |
| delete_defect | SA, PM | { id, displayId, title } |
| delete_test_case | SA, PM, QA | { id, title } |

Every tool has:
- `needsApproval: true` — structural D-05 gate, execute only runs after user confirms in UI
- Role double-check inside execute — prevents approval replay by lower-privileged role
- `sanitizeToolInput(input)` called first in execute — strips HTML/script from reason field
- `scopedPrisma(projectId)` — injects projectId into all where clauses, cross-project deletion impossible
- try/catch returning `{ success: false, error: msg }` — never throws

### Task 2: index.ts wiring

Replaced the placeholder comment in the `perms.delete` block with:
```typescript
if (perms.delete) {
  Object.assign(tools, deleteTools(projectId, memberId, role))
}
```

Since `ROLE_PERMISSIONS.delete` is `true` only for SA and PM, delete tools are never registered for BA, DEVELOPER, or QA roles.

## Verification Results

```
grep -c "needsApproval: true" src/lib/chat-tools/delete/delete-tools.ts → 11 (10 properties + 1 comment)
grep -c "sanitizeToolInput" src/lib/chat-tools/delete/delete-tools.ts → 11 (10 calls + 1 import)
npx vitest run tests/lib/chat-tools/ → 24 passed (5 test files)
npx tsc --noEmit → no errors
```

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Mitigation | Verified |
|-----------|-----------|---------|
| T-11-13 | needsApproval: true on all 10 tools | grep count = 10 |
| T-11-14 | Role double-check inside execute | Present in all 10 handlers |
| T-11-16 | sanitizeToolInput(input) first in execute | grep count = 10 |

## Self-Check: PASSED

Files created:
- src/lib/chat-tools/delete/delete-tools.ts — EXISTS
- tests/lib/chat-tools/delete-tools.test.ts — EXISTS

Commits:
- 5e1a860 — feat(11-04): create delete tool layer with needsApproval: true on all 10 tools
- 828998a — feat(11-04): wire delete tools into buildToolsForRole for SA and PM only
