# Domain Refinement Prompt

Copy the prompt below and append the domain number (1-9) at the end. That's it.

Example: paste the prompt, then type `1` to refine RBAC/Security.

---

## The Prompt

```markdown
@.planning/gap-analysis/workflow/WORKFLOW.md @.planning/gap-analysis/00-GAP-ANALYSIS-INDEX.md @CLAUDE.md

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
| 1 | RBAC, Security, Governance | .planning/gap-analysis/01-rbac-security-gaps.md | refined/01-rbac-security-spec.md |
| 2 | AI Agent Harness, Transcripts | .planning/gap-analysis/02-agent-harness-gaps.md | refined/02-agent-harness-spec.md |
| 3 | Discovery, Questions | .planning/gap-analysis/03-discovery-questions-gaps.md | refined/03-discovery-questions-spec.md |
| 4 | Work Management | .planning/gap-analysis/04-work-management-gaps.md | refined/04-work-management-spec.md |
| 5 | Sprint, Developer API | .planning/gap-analysis/05-sprint-developer-gaps.md | refined/05-sprint-developer-spec.md |
| 6 | Org, Knowledge | .planning/gap-analysis/06-org-knowledge-gaps.md | refined/06-org-knowledge-spec.md |
| 7 | Dashboards, Search | .planning/gap-analysis/07-dashboards-search-gaps.md | refined/07-dashboards-search-spec.md |
| 8 | Documents, Notifications | .planning/gap-analysis/08-docs-notifications-gaps.md | refined/08-docs-notifications-spec.md |
| 9 | QA, Jira, Archival, Lifecycle | .planning/gap-analysis/09-qa-jira-archival-gaps.md | refined/09-qa-jira-archival-spec.md |

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

Write the refined spec to `.planning/gap-analysis/[Output Spec path from table]`

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
