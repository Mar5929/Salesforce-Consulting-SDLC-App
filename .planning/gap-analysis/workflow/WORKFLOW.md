# Gap Analysis Refinement & Execution Workflow

## Overview

This document describes the end-to-end workflow for closing the 153 gaps identified in the PRD-to-codebase gap analysis. The workflow has three stages: **Refine**, **Execute**, and **Verify**. Each domain goes through all three stages before moving to the next.

## Current State

- **Gap analysis complete:** 10 reports in `.planning/gap-analysis/` covering 9 code domains + V2 roadmap
- **Master index:** `00-GAP-ANALYSIS-INDEX.md` has all gaps indexed, phase groupings, dependency graph, and recommended build order
- **153 V1 gaps:** 22 Critical, 77 Significant, 54 Minor
- **22 V2 items:** assessed for readiness (8 ready, 9 needs prep, 5 major work)

## The Three Stages

### Stage 1: Refine (Human + AI collaboration)

**Goal:** Turn each domain's gap report into an execution-ready specification so detailed that an AI agent can implement it without asking questions.

**Input:** Gap report (e.g., `01-rbac-security-gaps.md`)
**Output:** Refined spec (e.g., `refined/01-rbac-security-spec.md`)

What happens in this stage:
1. Read the gap report for the domain
2. Validate each gap — confirm it's real, correctly scoped, correctly severity-rated
3. Break each gap into atomic, testable requirements (REQ-DOMAIN-NNN)
4. Cover all perspectives: backend, frontend, security, UX, architecture
5. Identify edge cases and failure modes
6. Write Given/When/Then acceptance criteria for each requirement
7. Define implementation order within the domain
8. Consolidate schema migrations and event wiring

This stage is interactive — the human and AI work through each gap together, pushing back on over-engineering, asking clarifying questions, and ensuring nothing is ambiguous.

**Use the prompt template in `workflow/REFINEMENT-PROMPT.md` to start each refinement session.**

### Stage 2: Execute (AI agents)

**Goal:** Implement all requirements from the refined spec.

**Input:** Refined spec (e.g., `refined/01-rbac-security-spec.md`)
**Output:** Working code committed to the repo

What happens in this stage:
1. AI agent reads the refined spec
2. Follows the implementation order defined in the spec
3. Makes the exact file changes specified
4. Runs schema migrations if needed
5. Wires events if needed
6. Creates atomic commits per requirement or logical group

The refined spec should be detailed enough that the agent rarely needs to ask questions. If it does, that's a signal the spec needs more refinement (go back to Stage 1).

### Stage 3: Verify (AI agent + Human)

**Goal:** Confirm every requirement's acceptance criteria passes.

**Input:** Refined spec + implemented code
**Output:** Verification report

What happens in this stage:
1. AI agent reads the acceptance criteria from the refined spec
2. Checks each criterion against the implemented code (static analysis + runtime if possible)
3. Produces a verification report: pass/fail per requirement
4. Human reviews any failures and decides: fix (back to Stage 2) or accept

## Domain Processing Order

Based on the dependency graph in `00-GAP-ANALYSIS-INDEX.md`, process domains in this order:

| Order | Domain | File | Why This Order |
|-------|--------|------|----------------|
| 1 | RBAC, Security, Governance | `01-rbac-security-gaps.md` | Foundational — `getCurrentMember` fix unblocks all other domains. 4 critical auth gaps. |
| 2 | Agent Harness, Transcripts | `02-agent-harness-gaps.md` | Core infrastructure — task completion, output validation, and rate limiting affect all AI features. |
| 3 | Discovery, Questions | `03-discovery-questions-gaps.md` | Core value prop — gap detection and readiness assessment are the PRD's headline AI capabilities. |
| 4 | Work Management | `04-work-management-gaps.md` | Depends on RBAC fixes (BA role transitions). Story quality enforcement is a gate for sprint planning. |
| 5 | Sprint, Developer API | `05-sprint-developer-gaps.md` | Depends on work management (story status). Context package completeness blocks developer workflow. |
| 6 | Org, Knowledge | `06-org-knowledge-gaps.md` | Depends on agent harness fixes. Knowledge base seeding and sync automation. |
| 7 | Documents, Notifications | `08-docs-notifications-gaps.md` | Event wiring fixes. Notification schema alignment needed before adding new event types. |
| 8 | Dashboards, Search | `07-dashboards-search-gaps.md` | Depends on many upstream data sources being correct. Dashboard completeness is the integration layer. |
| 9 | QA, Jira, Archival, Lifecycle | `09-qa-jira-archival-gaps.md` | Depends on RBAC and notification fixes. Project lifecycle is a late-stage concern. |

## File Structure

```
.planning/gap-analysis/
  00-GAP-ANALYSIS-INDEX.md              # Master index (read first)
  01-rbac-security-gaps.md              # Domain gap reports (raw findings)
  02-agent-harness-gaps.md
  03-discovery-questions-gaps.md
  04-work-management-gaps.md
  05-sprint-developer-gaps.md
  06-org-knowledge-gaps.md
  07-dashboards-search-gaps.md
  08-docs-notifications-gaps.md
  09-qa-jira-archival-gaps.md
  10-v2-roadmap-assessment.md
  workflow/
    WORKFLOW.md                         # This file — process overview
    REFINEMENT-PROMPT.md                # Template prompt for Stage 1 sessions
  refined/                              # Stage 1 outputs (created as domains are refined)
    01-rbac-security-spec.md            # Execution-ready specs
    02-agent-harness-spec.md
    ...
```

## Key Principles

1. **Never skip Stage 1.** The gap reports are findings, not specs. They describe what's wrong but not exactly how to fix it. Refinement turns "this is broken" into "do exactly this."

2. **One domain per refinement session.** Each domain is complex enough to fill a session. Don't try to refine multiple domains at once.

3. **The spec is the contract.** Once a refined spec is approved, the execution agent follows it literally. If the spec is wrong, fix the spec — don't improvise during execution.

4. **Dependencies matter.** The processing order exists because some fixes are prerequisites for others. Don't skip ahead without understanding what breaks.

5. **V2 items stay out.** The gap analysis cleanly separates V1 gaps from V2 enhancements. This workflow addresses V1 gaps only. V2 items are tracked in `10-v2-roadmap-assessment.md` for future planning.

6. **Atomic commits.** Each requirement (or small logical group) gets its own commit. This makes verification, rollback, and code review manageable.

## Progress Tracking

As domains complete each stage, update this table:

| Domain | Refine | Execute | Verify |
|--------|--------|---------|--------|
| 01 RBAC/Security | Done (2026-04-09) | - | - |
| 02 Agent Harness | - | - | - |
| 03 Discovery/Questions | - | - | - |
| 04 Work Management | - | - | - |
| 05 Sprint/Developer | - | - | - |
| 06 Org/Knowledge | - | - | - |
| 07 Dashboards/Search | - | - | - |
| 08 Docs/Notifications | - | - | - |
| 09 QA/Jira/Archival | - | - | - |
