---
phase: 02-discovery-and-knowledge-brain
plan: 01
subsystem: agent-harness
tags: [ai, agent-harness, execution-engine, tool-dispatch, sanitization]
dependency_graph:
  requires: [01-foundation (Prisma schema, db.ts, project-scope.ts)]
  provides: [executeTask, executeToolCall, sanitizeToolInput, AI_PRICING, calculateCost, TaskDefinition types]
  affects: [all Phase 2 AI features - transcript processing, question answering, dashboard synthesis, knowledge refresh]
tech_stack:
  added: ["@anthropic-ai/sdk@0.82.0", "isomorphic-dompurify@2.22.0", "@types/dompurify"]
  patterns: [lazy-singleton Anthropic client, exponential retry backoff, DOMPurify recursive sanitization, TDD red-green]
key_files:
  created:
    - src/lib/agent-harness/types.ts
    - src/lib/agent-harness/engine.ts
    - src/lib/agent-harness/tool-executor.ts
    - src/lib/agent-harness/sanitize.ts
    - src/lib/agent-harness/index.ts
    - src/lib/config/ai-pricing.ts
    - tests/lib/agent-harness/engine.test.ts
    - tests/helpers/mock-prisma.ts
    - tests/helpers/mock-anthropic.ts
  modified:
    - tests/setup.ts
    - package.json
    - package-lock.json
decisions:
  - "Used lazy singleton pattern for Anthropic client with resetAnthropicClient() for test isolation"
  - "Tool executor uses switch dispatch with ToolNotImplementedError for unimplemented tools (implementations in Plans 04-06)"
  - "Ambiguity instructions appended to system prompt as plain text per mode (INTERACTIVE/TASK_SESSION/BACKGROUND)"
  - "Token usage tracked cumulatively across all iterations in AGENT_LOOP mode"
metrics:
  duration: 7m
  completed: 2026-04-06T17:22:56Z
  tasks: 3/3
  tests: 16 passed
  files_created: 9
  files_modified: 3
---

# Phase 02 Plan 01: Agent Harness Core Summary

Agent harness execution engine with three-layer architecture foundation: types, executeTask() with SINGLE_TURN and AGENT_LOOP modes, tool dispatch with DOMPurify sanitization, exponential retry backoff, and per-interaction SessionLog cost tracking.

## What Was Built

### Task 0: Test Utilities
- `tests/helpers/mock-prisma.ts`: Factory creating deeply-mocked Prisma client for all Phase 2 models (sessionLog, question, decision, risk, requirement, transcript, conversation, chatMessage, knowledgeArticle, notification, project, projectMember, etc.)
- `tests/helpers/mock-anthropic.ts`: Factory with `mockTextResponse()`, `mockToolUseResponse()`, and `mockAgentLoopResponses()` helpers that match the Anthropic SDK response format
- Added `ANTHROPIC_API_KEY` to test setup env vars

### Task 1: Types, Execution Engine, and AI Pricing (TDD)
- **Types** (`types.ts`): All 11 TaskTypes matching Prisma SessionLogTaskType enum, ExecutionMode (SINGLE_TURN/AGENT_LOOP), AmbiguityMode (INTERACTIVE/TASK_SESSION/BACKGROUND), TaskDefinition, TaskInput, ProjectContext, ExecutionResult, ClaudeToolDefinition, ValidationResult, ToolResult, TokenUsage
- **AI Pricing** (`ai-pricing.ts`): Pricing constants for claude-sonnet-4, claude-opus-4, claude-haiku-3.5 with `calculateCost()` function
- **Execution Engine** (`engine.ts`): `executeTask()` function implementing Layer 2:
  - Calls context loader (Layer 3 integration point)
  - Builds system prompt with context injection and ambiguity instructions
  - SINGLE_TURN mode: single API call, return result
  - AGENT_LOOP mode: iterates tool_use blocks up to maxIterations cap (T-02-04)
  - Retry with exponential backoff (1s, 2s, 4s) on 429/529 errors up to maxRetries (T-02-04)
  - Cumulative token tracking across all iterations
  - Cost calculation via calculateCost()
  - SessionLog creation for every interaction (COMPLETE or FAILED status)
  - Output validation support

### Task 2: Tool Executor and Sanitization
- **Sanitize** (`sanitize.ts`): `sanitizeToolInput()` recursively walks input objects and runs DOMPurify.sanitize() on all strings (T-02-01). `sanitizeHtml()` for frontend rendering.
- **Tool Executor** (`tool-executor.ts`): `executeToolCall()` dispatches by tool name with sanitized inputs. 7 placeholder tools registered (create_question, answer_question, update_question_status, create_decision, create_requirement, create_risk, flag_conflict) with ToolNotImplementedError.
- **Barrel Export** (`index.ts`): Re-exports all types, engine, tool-executor, and sanitize modules.

## Decisions Made

1. **Lazy singleton Anthropic client**: Created on first use with `resetAnthropicClient()` exported for test isolation. Avoids constructing client at module load time.
2. **Switch-based tool dispatch**: Single dispatch point in tool-executor.ts. Tools throw ToolNotImplementedError until Plans 04-06 add implementations.
3. **Ambiguity mode as prompt injection**: Ambiguity instructions appended to system prompt as natural language rather than structured config, since Claude processes them as instructions.
4. **Cumulative token tracking**: In AGENT_LOOP mode, input/output tokens are summed across all iterations for accurate cost tracking.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Anthropic SDK mock constructor compatibility**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** `vi.mock("@anthropic-ai/sdk")` with arrow function didn't work with `new Anthropic()` because arrow functions can't be used as constructors
- **Fix:** Changed mock to use regular function declaration: `function MockAnthropic() { return mockAnthropicInstance }`
- **Files modified:** tests/lib/agent-harness/engine.test.ts
- **Commit:** faccd0c

**2. [Rule 3 - Blocking] Singleton client not resetting between tests**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Anthropic client singleton persisted between tests, causing mock to not be picked up on subsequent test runs
- **Fix:** Added `resetAnthropicClient()` export and called it in `beforeEach`
- **Files modified:** src/lib/agent-harness/engine.ts, tests/lib/agent-harness/engine.test.ts
- **Commit:** faccd0c

## Threat Mitigations Implemented

| Threat ID | Status | Implementation |
|-----------|--------|----------------|
| T-02-01 | Mitigated | `sanitizeToolInput()` runs DOMPurify.sanitize() on all string values recursively |
| T-02-02 | Mitigated | Engine uses Prisma's typed client (parameterized queries by default). No `$queryRawUnsafe` usage. |
| T-02-03 | Mitigated | System prompts built from template + assembled context only. No env vars or API keys injected. |
| T-02-04 | Mitigated | `maxIterations` caps agent loops (default 10). `maxRetries` caps retries (default 3). |
| T-02-05 | Mitigated | Tool executor architecture uses `scopedPrisma(projectId)` pattern (enforced when tools are implemented) |

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| 7 tool implementations | src/lib/agent-harness/tool-executor.ts | Intentional -- tool implementations are scoped to Plans 04-06 per architecture |

These stubs do NOT block this plan's goal. The tool executor dispatch infrastructure is complete; implementations will be added as downstream plans build each feature.

## Verification Results

- `npx vitest run tests/lib/agent-harness/` -- 16 tests passed
- `npx tsc --noEmit --skipLibCheck` -- no new TypeScript errors (pre-existing errors in db.ts and project-scope.ts are from Phase 1)
- DOMPurify sanitization verified: `<script>` tags and event handlers stripped from tool inputs

## Self-Check: PASSED

All 9 created files verified present. All 4 commit hashes verified in git log.
