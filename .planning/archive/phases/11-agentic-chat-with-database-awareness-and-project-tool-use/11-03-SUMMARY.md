---
phase: 11-agentic-chat-with-database-awareness-and-project-tool-use
plan: "03"
subsystem: chat-tools/write
tags: [ai-tools, write-tools, batch-tools, role-gating, sanitization]
dependency_graph:
  requires:
    - "11-01 (chat-tools types, ROLE_PERMISSIONS, buildToolsForRole skeleton)"
    - "11-02 (query read tools, scopedPrisma pattern)"
  provides:
    - "create/update tools for all 10 mutable entities"
    - "batch create for stories and questions"
    - "complete role-gated tool registry in buildToolsForRole"
  affects:
    - "src/lib/chat-tools/index.ts (extended with write + batch imports)"
tech_stack:
  added: []
  patterns:
    - "sanitizeToolInput as mandatory first call in every execute handler"
    - "scopedPrisma for project-scoped DB writes with explicit projectId in create data"
    - "generateDisplayId / generateStoryDisplayId for sequential human-readable IDs"
    - "server-side severity matrix for risk (likelihood x impact → severity)"
    - "sequential loop (not Promise.all) in batch tools for displayId ordering"
key_files:
  created:
    - src/lib/chat-tools/write/mutate-stories.ts
    - src/lib/chat-tools/write/mutate-epics.ts
    - src/lib/chat-tools/write/mutate-features.ts
    - src/lib/chat-tools/write/mutate-questions.ts
    - src/lib/chat-tools/write/mutate-decisions.ts
    - src/lib/chat-tools/write/mutate-requirements.ts
    - src/lib/chat-tools/write/mutate-risks.ts
    - src/lib/chat-tools/write/mutate-sprints.ts
    - src/lib/chat-tools/write/mutate-defects.ts
    - src/lib/chat-tools/write/mutate-test-cases.ts
    - src/lib/chat-tools/batch/batch-stories.ts
    - src/lib/chat-tools/batch/batch-questions.ts
    - tests/lib/chat-tools/write-tools.test.ts
  modified:
    - src/lib/chat-tools/index.ts
decisions:
  - "Explicit projectId in create data objects required for Prisma strict types even though scopedPrisma injects it at runtime"
  - "TestCase has no projectId field — project scoping verified via story.projectId join query before create/update"
  - "Requirement and Risk use description field for combined title+body (schema has no title column) — combined with newline separator"
  - "Decision rationale field is required in schema — falls back to description input if rationale not provided"
  - "Defect create uses description as stepsToReproduce; expectedBehavior/actualBehavior get placeholder values since schema requires them but tool interface simplifies input"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-08"
  tasks: 2
  files: 14
---

# Phase 11 Plan 03: Write and Batch Tool Layer Summary

Write and batch tools for all 10 mutable entities, wired into the role-gated `buildToolsForRole` registry. The AI can now create and update stories, epics, features, questions, decisions, requirements, risks, sprints, defects, and test cases — not just query them.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create all 10 write tool files and 2 batch tool files | `07d4406` | 12 write/batch files + 1 test file |
| 2 | Wire write and batch tools into buildToolsForRole | `22916e4` | src/lib/chat-tools/index.ts |

## What Was Built

**Write tools (create + update pairs):**
- `mutate-stories.ts` — create_story, update_story (role check: BA/DEVELOPER only update assigned stories)
- `mutate-epics.ts` — create_epic, update_epic
- `mutate-features.ts` — create_feature, update_feature
- `mutate-questions.ts` — create_question, update_question
- `mutate-decisions.ts` — create_decision, update_decision
- `mutate-requirements.ts` — create_requirement, update_requirement
- `mutate-risks.ts` — create_risk, update_risk (severity auto-computed from likelihood x impact)
- `mutate-sprints.ts` — create_sprint, update_sprint (PM-only structural gate)
- `mutate-defects.ts` — create_defect, update_defect
- `mutate-test-cases.ts` — create_test_case, update_test_case

**Batch tools:**
- `batch-stories.ts` — create_stories (max 20, sequential loop for displayId ordering)
- `batch-questions.ts` — create_questions (max 20, sequential loop)

**Registry update (`index.ts`):**
- SA/PM/BA/DEVELOPER: stories, epics, features
- SA/PM/BA: questions, decisions, requirements, risks
- PM only: sprints
- All roles: defects
- SA/PM/QA: test cases
- SA/PM/BA (batch gate): batch stories + questions

## Security (Threat Model Mitigations)

| Threat | Mitigation | Verified |
|--------|-----------|---------|
| T-11-08 Prompt injection via tool input | sanitizeToolInput(input) is first call in every execute handler — all 12 files | grep shows 12 files |
| T-11-09 Elevation of privilege on story update | BA/DEVELOPER blocked from updating stories not assigned to them | Role check in update_story execute handler |
| T-11-10 Sprint tool elevation | Sprint tools included only when role === PM — structural gate, not prompt-based | index.ts wiring |
| T-11-11 DoS via batch | .max(20) hard cap on all array inputs | Both batch files verified |
| T-11-12 Risk severity injection | Severity computed server-side from likelihood x impact matrix — AI cannot supply severity directly | mutate-risks.ts computeSeverity() |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma strict types require explicit `projectId` in create data**
- **Found during:** Task 1 typecheck
- **Issue:** `scopedPrisma` injects `projectId` at runtime via Prisma extension, but TypeScript strict types still require it at compile time
- **Fix:** Added explicit `projectId` to all 10 write tool create data objects and both batch tool create calls
- **Files modified:** All write + batch files
- **Commit:** `07d4406`

**2. [Rule 2 - Missing critical functionality] TestCase has no projectId column**
- **Found during:** Task 1 implementation
- **Issue:** `TestCase` is not in `MODELS_WITH_PROJECT_ID`, so `scopedPrisma` cannot scope it. Using scoped client would silently not filter by project.
- **Fix:** `mutate-test-cases.ts` uses raw `prisma` client with explicit `story: { projectId }` join filter to verify story belongs to project before create/update
- **Files modified:** src/lib/chat-tools/write/mutate-test-cases.ts
- **Commit:** `07d4406`

## Known Stubs

None. All tools write real data through scopedPrisma to the database.

## Self-Check

- [x] `src/lib/chat-tools/write/mutate-stories.ts` — exists
- [x] `src/lib/chat-tools/batch/batch-stories.ts` — exists
- [x] `tests/lib/chat-tools/write-tools.test.ts` — exists
- [x] Commit `07d4406` — confirmed
- [x] Commit `22916e4` — confirmed
- [x] `npx vitest run tests/lib/chat-tools/` — 20 tests, all pass
- [x] `npx tsc --noEmit` — no errors
- [x] `grep -r "sanitizeToolInput" write/ batch/` — 12 files

## Self-Check: PASSED
