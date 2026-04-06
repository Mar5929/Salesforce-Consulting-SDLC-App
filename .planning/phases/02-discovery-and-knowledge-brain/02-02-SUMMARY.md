---
phase: 02-discovery-and-knowledge-brain
plan: 02
subsystem: agent-harness-context-and-tasks
tags: [ai, agent-harness, context-assembly, task-definitions, two-pass-retrieval]
dependency_graph:
  requires: [02-01 (agent harness types, engine, tool-executor, mock helpers)]
  provides: [getProjectSummary, getOpenQuestions, getQuestionContext, getRecentDecisions, getArticleSummaries, getRelevantArticles, getBlockingRelationships, getEpicsAndFeatures, assembleContext, transcriptProcessingTask, questionAnsweringTask, dashboardSynthesisTask]
  affects: [all downstream AI features - transcript processing (02-04), question answering (02-05), dashboard synthesis (02-06), knowledge refresh]
tech_stack:
  added: []
  patterns: [scopedPrisma for project isolation, two-pass article retrieval (D-19), ContextLoader interface for composable context, parallel loader execution, conservative token estimation (1 token = 4 chars)]
key_files:
  created:
    - src/lib/agent-harness/context/project-summary.ts
    - src/lib/agent-harness/context/questions.ts
    - src/lib/agent-harness/context/decisions.ts
    - src/lib/agent-harness/context/article-summaries.ts
    - src/lib/agent-harness/context/blocking-relationships.ts
    - src/lib/agent-harness/context/epics-features.ts
    - src/lib/agent-harness/context/index.ts
    - src/lib/agent-harness/tasks/transcript-processing.ts
    - src/lib/agent-harness/tasks/question-answering.ts
    - src/lib/agent-harness/tasks/dashboard-synthesis.ts
    - src/lib/agent-harness/tasks/index.ts
    - tests/lib/agent-harness/context.test.ts
    - tests/lib/agent-harness/task-definitions.test.ts
  modified: []
decisions:
  - "project-summary uses prisma directly (not scopedPrisma) since it queries by project primary key — scoping extension is unnecessary for single-record lookups"
  - "blocking-relationships uses prisma with nested where filter on question.projectId to correctly scope cross-table join queries"
  - "Two-pass article retrieval loads top 3 articles by default in question-answering contextLoader — full AI-driven relevance selection deferred to execution time"
  - "ContextLoader interface uses name+load pattern for composability and error isolation — failed loaders produce error messages instead of crashing assembly"
  - "Token estimation uses conservative 1:4 ratio (1 token per 4 chars) to avoid context overflow"
metrics:
  duration: 8m
  completed: 2026-04-06T17:55:00Z
  tasks: 2/2
  tests: 31 passed (15 context + 16 task definitions)
  files_created: 13
  files_modified: 0
---

# Phase 02 Plan 02: Context Assembly and Task Definitions Summary

Five context loaders (Layer 3) with two-pass article retrieval (D-19), three task definitions (Layer 1) for transcript processing, question answering, and dashboard synthesis, all wired to scopedPrisma for project isolation with token budget enforcement.

## What Was Built

### Task 1: Context Loaders (Layer 3) with Two-Pass Article Retrieval (TDD)

**Context Loaders:**
- `getProjectSummary(projectId)`: Fetches project metadata (name, client, engagement type, phase, team count, dates) and formats as structured text
- `getOpenQuestions(projectId, limit)`: Fetches non-REVIEWED questions with 200-char text truncation, ordered by recency
- `getQuestionContext(projectId, questionId)`: Single question with all linked entities (blocked stories/epics/features, related decisions) for impact assessment
- `getRecentDecisions(projectId, limit)`: Recent decisions with 300-char rationale truncation
- `getArticleSummaries(projectId)`: Pass 1 of D-19 — lightweight fetch of non-stale article titles + summaries
- `getRelevantArticles(projectId, articleIds)`: Pass 2 of D-19 — full content for specific articles
- `getBlockingRelationships(projectId)`: Questions blocking stories/epics/features via join table queries
- `getEpicsAndFeatures(projectId)`: Lightweight epic/feature list for TRNS-04 scope assignment

**Assembly:**
- `assembleContext(loaders, projectId, tokenBudget)`: Runs loaders in parallel, concatenates with section headers, truncates to token budget (1 token = 4 chars)
- `ContextLoader` interface: `{ name: string, load: (projectId) => Promise<string> }` for composable context building

### Task 2: Task Definitions (Layer 1)

**transcriptProcessingTask:**
- taskType: TRANSCRIPT_PROCESSING, executionMode: AGENT_LOOP, maxIterations: 10
- ambiguityMode: TASK_SESSION
- 4 tools: create_question (with scopeEpicId/scopeFeatureId for TRNS-04), create_decision, create_requirement, create_risk
- contextLoader loads: project summary + open questions (dedup) + recent decisions (dedup) + epics/features (scope assignment)
- outputValidator: checks non-empty output

**questionAnsweringTask:**
- taskType: QUESTION_ANSWERING, executionMode: SINGLE_TURN
- ambiguityMode: TASK_SESSION
- 2 tools: flag_conflict, update_question_status
- contextLoader loads: project summary + question context + article summaries (two-pass, top 3 full articles)
- outputValidator: checks for Answer and Impact Assessment sections

**dashboardSynthesisTask:**
- taskType: DASHBOARD_SYNTHESIS, executionMode: SINGLE_TURN
- ambiguityMode: BACKGROUND (no user present)
- 0 tools (pure text generation)
- contextLoader loads: project summary + question stats + blocking relationships + article summaries
- outputValidator: checks for currentFocus and recommendedFocus sections

## Decisions Made

1. **Project summary uses prisma directly**: No need for scopedPrisma when querying by project primary key.
2. **Blocking relationships use nested projectId filter**: Join tables (QuestionBlocksStory, etc.) don't have projectId — filter through `question.projectId` instead.
3. **Top 3 articles for question answering**: Two-pass retrieval defaults to loading full content for 3 most recent non-stale articles. AI-driven relevance ranking happens at execution time.
4. **ContextLoader interface with error isolation**: Failed loaders produce `[name: load failed - message]` instead of crashing the entire assembly.
5. **Conservative token estimation (1:4)**: 1 token per 4 characters avoids context window overflow at the cost of slightly underutilizing available budget.

## Deviations from Plan

None - plan executed exactly as written.

## Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| tests/lib/agent-harness/context.test.ts | 15 | PASSED |
| tests/lib/agent-harness/task-definitions.test.ts | 16 | PASSED |

## Self-Check: PASSED

All 13 created files verified present. All 3 commits verified in git log (84d0947, d48b198, 1126494).
