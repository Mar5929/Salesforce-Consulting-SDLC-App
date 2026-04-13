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
| `docs/bef/01-architecture/TECHNICAL_SPEC.md` | Database schema, AI agent harness architecture, context window budget, dashboard implementation. The "how." |
| `docs/bef/02-phase-plan/PHASE_PLAN.md` | Master phase plan with dependencies. |
| `docs/bef/03-phases/phase-NN-*/` | Per-phase PHASE_SPEC.md and TASKS.md. |

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
