---
phase: 11
plan: 02
subsystem: chat-tools/read
tags: [agentic-chat, query-tools, read-layer, prisma, vercel-ai-sdk]
one_liner: "30 read-only query tools (15 entity pairs) wired into buildToolsForRole via scopedPrisma project isolation"
dependency_graph:
  requires:
    - "11-01: chat-tools infrastructure (types, audit, system-prompt, index skeleton)"
  provides:
    - "src/lib/chat-tools/read/*.ts: 15 query tool factories exporting 30 tools"
    - "src/lib/chat-tools/index.ts: buildToolsForRole with all 30 query tools under perms.read"
  affects:
    - "Plans 03-04: write/delete tool implementations can now query before mutating"
    - "Plan 05: chat route that calls buildToolsForRole will receive all 30 query tools"
tech_stack:
  added: []
  patterns:
    - "Factory pattern: queryXxxTools(projectId) returns named tool object"
    - "scopedPrisma(projectId) for all DB access — cross-project leakage structurally impossible"
    - "Vercel AI SDK tool() with inputSchema (Zod) and execute handler"
    - "try/catch on all execute handlers returning { success: false, error } never throw"
    - "limit capped at 50 on all list tools, default 20 (T-11-06 DoS mitigation)"
key_files:
  created:
    - src/lib/chat-tools/read/query-stories.ts
    - src/lib/chat-tools/read/query-epics.ts
    - src/lib/chat-tools/read/query-features.ts
    - src/lib/chat-tools/read/query-questions.ts
    - src/lib/chat-tools/read/query-decisions.ts
    - src/lib/chat-tools/read/query-requirements.ts
    - src/lib/chat-tools/read/query-risks.ts
    - src/lib/chat-tools/read/query-sprints.ts
    - src/lib/chat-tools/read/query-defects.ts
    - src/lib/chat-tools/read/query-knowledge.ts
    - src/lib/chat-tools/read/query-org-components.ts
    - src/lib/chat-tools/read/query-business-processes.ts
    - src/lib/chat-tools/read/query-documents.ts
    - src/lib/chat-tools/read/query-conversations.ts
    - src/lib/chat-tools/read/query-test-cases.ts
    - src/lib/chat-tools/types.ts
    - src/lib/chat-tools/audit.ts
    - src/lib/chat-tools/system-prompt.ts
    - tests/lib/chat-tools/query-tools.test.ts
  modified:
    - src/lib/chat-tools/index.ts
    - tests/lib/chat-tools/build-tools.test.ts
    - tests/lib/chat-tools/role-gating.test.ts
decisions:
  - "Requirement field: used `description` not `title` (Risk also uses `description`) — schema-accurate, no plan deviation"
  - "OrgComponent status field: named `componentStatus` in schema (not `status`) — handled in filter mapping"
  - "TestCase has no projectId column — scoped implicitly via story relationship through scopedPrisma"
  - "Plan 01 infrastructure files (types, audit, system-prompt) created in this worktree since they were on main but not in worktree base"
metrics:
  duration: "8m"
  completed: "2026-04-08"
  tasks_completed: 2
  files_changed: 22
---

# Phase 11 Plan 02: Query Tools Read Layer Summary

30 read-only query tools (query_* + get_* per entity) for all 15 project entities, wired into buildToolsForRole under the perms.read gate using scopedPrisma project isolation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create 15 query tool files (read/ directory) | d4c380e | 19 files (15 read tools + Plan 01 infra + test) |
| 2 | Wire all query tools into buildToolsForRole registry | c8bd89f | 3 files (index.ts + 2 test files) |

## What Was Built

### 15 Query Tool Files (30 tools total)

Each file exports a factory function `queryXxxTools(projectId: string)` that returns two tools:

| File | List Tool | Detail Tool | Key Filters |
|------|-----------|-------------|-------------|
| query-stories.ts | query_stories | get_story | epicId, featureId, sprintId, status, priority |
| query-epics.ts | query_epics | get_epic | status |
| query-features.ts | query_features | get_feature | epicId, status |
| query-questions.ts | query_questions | get_question | status, category, scope |
| query-decisions.ts | query_decisions | get_decision | confidence |
| query-requirements.ts | query_requirements | get_requirement | status, priority |
| query-risks.ts | query_risks | get_risk | severity, status |
| query-sprints.ts | query_sprints | get_sprint | status (detail includes _count.stories) |
| query-defects.ts | query_defects | get_defect | status, severity |
| query-knowledge.ts | query_articles | get_article | articleType, isStale |
| query-org-components.ts | query_org_components | get_org_component | componentType, status |
| query-business-processes.ts | query_business_processes | get_business_process | status, complexity |
| query-documents.ts | query_documents | get_document | documentType, format |
| query-conversations.ts | query_conversations | get_conversation | conversationType, status |
| query-test-cases.ts | query_test_cases | get_test_case | testType, source, storyId |

### Registry Update (index.ts)

`buildToolsForRole` now imports and spreads all 15 factory results under `perms.read`. All 5 roles have `read: true`, so all roles receive all 30 tools.

## Test Results

```
Test Files  3 passed (3)
     Tests  14 passed (14)
```

- query-tools.test.ts: 5 tests (factory structure, description, inputSchema)
- role-gating.test.ts: 7 tests (ROLE_PERMISSIONS correctness)
- build-tools.test.ts: 2 tests (registry shape)

## Deviations from Plan

### Schema-Driven Adjustments (Not Deviations — Schema-Accurate)

**1. Requirement model uses `description` not `title`**
- Plan interface listed `id, displayId, title, status, priority` for Requirement summary
- Schema field is `description` not `title`
- Fix: Used `description` in select and returned as-is

**2. Risk model uses `description` not `title`**
- Same as above — Risk schema field is `description`

**3. OrgComponent `status` field is named `componentStatus`**
- Plan listed `status` filter with `ComponentStatus` enum values
- Schema field is `componentStatus` not `status`
- Fix: Filter maps `status` input param to `componentStatus` where clause key

**4. Plan 01 infrastructure files created in this worktree**
- This worktree was based on `4be449a` (before Plan 01 commits on main)
- types.ts, audit.ts, system-prompt.ts were on main but absent here
- Fix: Recreated from Plan 01 commits — exact same content, no behavior change

## Security Notes (Threat Model Compliance)

| Threat | Mitigation Applied |
|--------|-------------------|
| T-11-04: Cross-project data disclosure | Every execute handler uses `scopedPrisma(projectId)` |
| T-11-05: Enum tampering | All status/type fields use z.enum() — invalid values rejected before execute runs |
| T-11-06: DoS via unbounded results | `limit` field on all list tools: default 20, max 50 |
| T-11-07: Document S3 key exposure | get_document returns s3Key but not presigned URL — accepted risk per plan |

## Known Stubs

None. All 30 tools are fully wired and functional. Execute handlers call real Prisma queries through scopedPrisma.

## Self-Check: PASSED

All 17 key files found on disk. Commits d4c380e and c8bd89f confirmed in git log.
