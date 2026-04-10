# Domain Refinement Prompt

Copy the prompt below and append the domain number (1-9) at the end. That's it.

Example: paste the prompt, then type `1` to refine RBAC/Security.

---

## The Prompt

```markdown
@docs/bef/WORKFLOW.md @docs/bef/02-phase-plan/GAP-ANALYSIS-INDEX.md @CLAUDE.md

# Domain Refinement Session

I have a gap analysis with 153 gaps across 9 domains comparing my PRD against the codebase. I want to refine one domain at a time into execution-ready specs that AI agents can implement without ambiguity.

## How This Works

1. Look up the domain number I give you in the table below
2. Read the corresponding gap report file and the PRD sections it references
3. Read the WORKFLOW.md for process context
4. Work through each gap with me interactively

## Domain Lookup

| # | Domain | Gap Report | Output Spec |
|---|--------|-----------|-------------|
| 1 | RBAC, Security, Governance | docs/bef/03-phases/phase-01-rbac-security/01-rbac-security-gaps.md | docs/bef/03-phases/phase-01-rbac-security/PHASE_SPEC.md |
| 2 | AI Agent Harness, Transcripts | docs/bef/03-phases/phase-02-agent-harness/02-agent-harness-gaps.md | docs/bef/03-phases/phase-02-agent-harness/PHASE_SPEC.md |
| 3 | Discovery, Questions | docs/bef/03-phases/phase-03-discovery-questions/03-discovery-questions-gaps.md | docs/bef/03-phases/phase-03-discovery-questions/PHASE_SPEC.md |
| 4 | Work Management | docs/bef/03-phases/phase-04-work-management/04-work-management-gaps.md | docs/bef/03-phases/phase-04-work-management/PHASE_SPEC.md |
| 5 | Sprint, Developer API | docs/bef/03-phases/phase-05-sprint-developer/05-sprint-developer-gaps.md | docs/bef/03-phases/phase-05-sprint-developer/PHASE_SPEC.md |
| 6 | Org, Knowledge | docs/bef/03-phases/phase-06-org-knowledge/06-org-knowledge-gaps.md | docs/bef/03-phases/phase-06-org-knowledge/PHASE_SPEC.md |
| 7 | Dashboards, Search | docs/bef/03-phases/phase-07-dashboards-search/07-dashboards-search-gaps.md | docs/bef/03-phases/phase-07-dashboards-search/PHASE_SPEC.md |
| 8 | Documents, Notifications | docs/bef/03-phases/phase-08-docs-notifications/08-docs-notifications-gaps.md | docs/bef/03-phases/phase-08-docs-notifications/PHASE_SPEC.md |
| 9 | QA, Jira, Archival, Lifecycle | docs/bef/03-phases/phase-09-qa-jira-archival/09-qa-jira-archival-gaps.md | docs/bef/03-phases/phase-09-qa-jira-archival/PHASE_SPEC.md |

## What To Do

Read the gap report for my domain, then work with me to:

1. **Validate each gap** — Confirm it's real, correctly scoped, correctly severity-rated. Challenge anything that seems wrong or over-engineered.

2. **Break each gap into atomic requirements (REQ-DOMAIN-NNN)** — each must be:
   - Testable (clear pass/fail)
   - Unambiguous (AI agent knows exactly what to do)
   - Scoped (specific files/components/functions)
   - Independent where possible

3. **Cover all perspectives per requirement:**
   - Backend: server actions, API routes, Prisma queries, Inngest functions, validation
   - Frontend: components, pages, forms, state, loading/error/empty states
   - Security: RBAC enforcement, input validation, data isolation
   - UX: workflows, edge cases, error messages, confirmations
   - Architecture: schema changes, event wiring, context assembly

4. **Identify edge cases and failure modes** — missing data, wrong role, malformed AI output, concurrent edits

5. **Write acceptance tests** — Given/When/Then for each requirement

6. **Define implementation order** — internal dependencies within this domain

## Output Format

Write the refined spec to the Output Spec path from the domain lookup table above (e.g., `docs/bef/03-phases/phase-01-rbac-security/PHASE_SPEC.md`). Also create a corresponding `TASKS.md` in the same directory.

Use this structure for each requirement:

### REQ-[DOMAIN]-NNN: {Title}
**Gap Reference:** GAP-[DOMAIN]-NNN
**Priority:** P0 (security) | P1 (core) | P2 (completeness) | P3 (polish)

#### Description
{Precise description of what to build}

#### Implementation Details
- **Files to modify:** {exact paths}
- **Files to create:** {exact paths if any}
- **Schema changes:** {if any}
- **Event wiring:** {if any}

#### Acceptance Criteria
- [ ] Given {X}, when {Y}, then {Z}

#### Edge Cases
- {case and how to handle it}

End the spec with: Implementation Order, Schema Migration Summary, Event Wiring Summary.

## How We Work

- Gap by gap, requirement by requirement
- Push back on over-engineering
- Ask me when intent is ambiguous
- Flag cross-domain overlaps
- Practical, not bureaucratic

## Refine domain:
```

Then just type the number (1-9).
