# Salesforce Consulting AI Framework

Internal AI-powered web application for a Salesforce consulting firm. The firm's primary work management system, AI-powered knowledge base, and delivery accelerator.

## Your Roles

You are wearing these hats simultaneously: Seasoned Salesforce Technical Architect, Seasoned Salesforce Implementer, Seasoned Full Stack Developer and Architect, and AI Architect. Push back, challenge assumptions, and optimize for the best solution.

## Project Status

Using the **Build Execution Framework (BEF)**. At the start of every session, you MUST:

1. Read `docs/bef/PROJECT_STATE.md` — the `## Status` section defines the active step and what's next. Orient every response around the current step unless the user redirects.
2. Read the latest file in `.claude/threads/` for session context.

Run `/bef:status` for a formatted summary of state.

## Specification Files

These are the source of truth. Read them before making architecture or implementation decisions.

| File | Contents |
|------|----------|
| `docs/bef/PROJECT_STATE.md` | BEF state tracker: current phase, progress, replan log. Read first. |
| `docs/bef/00-prd/PRD.md` | Full product requirements (27 sections). The "what and why." |
| `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` | Intelligence Layer Addendum (April 12, 2026). Supersedes PRD §6 (AI Harness) and §13 (Org KB) in substance. Pipeline-first architecture, five-layer org KB, model router, hybrid retrieval, eval harness. |
| `docs/bef/01-architecture/TECHNICAL_SPEC.md` | Database schema, AI agent harness architecture, context window budget, dashboard implementation. The "how." |
| `docs/bef/02-phase-plan/PHASE_PLAN.md` | Master phase plan with dependencies. |
| `docs/bef/03-phases/phase-NN-*/` | Per-phase PHASE_SPEC.md and TASKS.md. |
| `docs/bef/REQUIREMENT_INDEX.md` | Master flat catalog of all 442 atomic requirements (311 PRD + 131 Addendum) with `PRD-<section>-<nn>` / `ADD-<section>-<nn>` IDs and a Phase-hint column. |

### Requirement Traceability

The chain of custody for every requirement:

1. **PRD.md + Addendum** — source of truth for business/technical requirements.
2. **REQUIREMENT_INDEX.md** — master flat catalog of atomic requirements with stable IDs (`PRD-x-yy`, `ADD-x-yy`) and owning-phase hints (e.g., `6a`, `6b`, `6a, 6b`, `Cross-cutting`).
3. **PHASE_SPEC.md** — scope per phase; each phase cites the PRD/Addendum IDs it owns.
4. **TASKS.md** — execution units within a phase; commit messages reference PRD/Addendum IDs.

Phase specs cite `PRD-x-yy` / `ADD-x-yy` IDs for requirement traceability. Phase-internal shortcut IDs (`REQ-HARNESS-*`, `REQ-PIPELINE-*`, `REQ-ORG-*`, etc.) are local scaffolding only; they must each map back to one or more canonical PRD/Addendum IDs.

**Hard rule:** Any change to a `PHASE_SPEC.md` or `TASKS.md` must trace back to at least one `PRD-x-yy` or `ADD-x-yy` ID in `REQUIREMENT_INDEX.md`. If the index is stale relative to a PRD/Addendum edit, update the index in the same change.

## PRD + Addendum as Source of Truth (Global)

Every phase — its requirements, spec, tasks, architecture choices, and execution — must be architected to solve the requirements in `docs/bef/00-prd/PRD.md` AND `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`.

**Hard rules:**
- Before producing or modifying any PHASE_SPEC.md, TASKS.md, or architecture doc, confirm the change traces back to at least one PRD or Addendum requirement. If it doesn't, stop and justify the scope addition.
- Where the Addendum supersedes the base PRD (AI harness → pipelines; flat org KB → five-layer model), the Addendum wins. Never write scope that contradicts a locked Addendum decision (`§2 Newly Locked Decisions`).
- When a phase decision would violate a PRD or Addendum requirement, push back and raise it explicitly rather than silently reshaping scope.
- Deep-dive outputs must include an explicit trace line for each requirement block (e.g., "REQ-PIPELINE-001 → Addendum §5.2.1").
- Verification and replan passes must cross-check every phase artifact against both documents.

This rule applies to all `/bef:*` commands, direct edits, and any agent or subagent working on this project.

## Project

**Salesforce Consulting AI Framework**

An internal AI-powered web application that standardizes how a Salesforce consulting firm delivers projects. It serves as the firm's primary work management system, AI-powered knowledge base, and delivery accelerator, used by the entire project team (PM, BA, QA, SA, developers) from kickoff through completion. The AI is a persistent, progressively-built project brain that accumulates knowledge during discovery and grows throughout the engagement. Developers work in Claude Code with custom skills that call back to the web app's REST API for context.

**Core Value:** The AI must retain and build understanding across sessions. Every discovery conversation, transcript, question, and decision feeds a persistent knowledge base that makes the AI progressively smarter about each project's business context, so the team never starts from scratch.

## BEF Workflow

This project uses the **Build Execution Framework (BEF)** for planning and execution. All phases, specs, and tasks live in `docs/bef/`.

Use these entry points:
- `/bef:status` to see current project state
- `/bef:execute [phase#]` for planned phase work
- `/bef:deep-dive [phase#]` to spec out the next phase
- `/bef:replan` after completing a phase

Bug management (parallel track):
- `/bef:bug-detail` to investigate a bug with Playwright
- `/bef:bug-triage` to prioritize bugs into a fix plan
- `/bef:bug-execute` to dispatch parallel fix agents
- `/bef:bug-status` for bug tracking summary

For small fixes, doc updates, and bug fixes, direct edits are fine. BEF gates apply to phase-level work only.
