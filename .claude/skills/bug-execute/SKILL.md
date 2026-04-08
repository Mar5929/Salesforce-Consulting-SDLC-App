---
name: bug-execute
description: Execute bug fixes from a triage execution plan by spawning parallel developer agents. Use this skill when the user wants to fix bugs from an execution plan, execute a bug fix phase, spawn developers to work on bugs, or run bug fixes in parallel. Triggers on phrases like "execute bugs", "fix the bugs", "run phase 1 of the bug plan", "start fixing bugs", "spawn devs for the bugs", "bug-execute", or "/bug-execute". Pairs with /bug-triage which produces the execution plan this skill consumes.
---

# Bug Execute — Parallel Developer Agent Orchestration

You are orchestrating bug fix execution. You read a phased execution plan (produced by `/bug-triage`) and spawn developer agents to fix bugs — running agents in parallel within each phase, and sequencing phases based on dependency order.

## Why This Exists

The execution plan from `/bug-triage` tells you WHAT to fix and in WHAT ORDER. This skill handles the HOW — spawning isolated developer agents that can work in parallel without stepping on each other, then advancing to the next phase once the current one is verified. Each agent works in its own git worktree so parallel fixes don't create merge conflicts.

## Step 1: Find the Execution Plan

Look for the execution plan in this order:

1. **User provides a path**: Use it directly.
2. **CLAUDE.md has a `## Bug Triage Output` section**: Use the configured path.
3. **Default location**: Check `.planning/BUG-EXECUTION-PLAN.md`.
4. **Ask the user**: If none of the above exist, ask where the execution plan is.

If no execution plan exists at all, tell the user: **"No execution plan found. Run `/bug-triage` first to analyze and prioritize your bugs."**

## Step 2: Parse the Plan and Select a Phase

Read the execution plan and parse out:
- Total phases and their contents
- Which phases are already completed (check for completion markers — see Step 5)
- The next incomplete phase

### Phase Selection

- If the user specified a phase number (e.g., `/bug-execute 2`), use that phase.
- If the user said "next", use the next incomplete phase.
- If no argument, show the user a summary of all phases with completion status and ask which to execute:

```
## Execution Plan Status

Phase 1: Foundation Fixes [COMPLETED]
  - BUG-001, BUG-003, BUG-002 (3 bugs)

Phase 2: UI and Navigation [READY]
  - BUG-004, BUG-007, BUG-008 (3 bugs)

Phase 3: Data Integrity [BLOCKED by Phase 2]
  - BUG-006, BUG-014 (2 bugs)

Which phase would you like to execute? (or "next" for Phase 2)
```

### Blocked Phase Check

If the selected phase depends on a prior phase that isn't completed, warn the user:

**"Phase 3 depends on Phase 2, which hasn't been completed yet. Executing out of order may cause issues. Proceed anyway?"**

Only continue if they confirm.

## Step 3: Spawn Developer Agents

For each bug in the selected phase, spawn a developer agent **in parallel** using the Agent tool with `isolation: "worktree"`. This gives each agent its own copy of the repo so their changes don't conflict.

### Developer Agent Prompt Template

For each bug, construct a prompt like this:

```
You are a developer fixing a specific bug. Your job is to understand the bug, implement the fix, and verify it works.

## Bug Details
[Insert the full contents of the bug detail file — e.g., the contents of bugs/BUG-XXX.md]

## Application Context
[Insert any relevant context — tech stack from CLAUDE.md, spec files if referenced in the bug]

## Your Task

1. **Understand the bug**: Read the files listed in the bug's "Location" and "Related Files" sections. Understand the root cause before writing any code.

2. **Implement the fix**: Follow the approach described in the bug's "Fix" section if one exists. If no fix is prescribed, determine the right approach based on the root cause. Make the minimal change necessary — don't refactor surrounding code, don't add features.

3. **Verify the fix**: After implementing:
   - Run any existing tests that cover the affected code (`npm test`, `npm run typecheck`, or whatever test commands exist)
   - If the fix is simple enough to verify by reading the code, explain why it works
   - If tests fail for reasons UNRELATED to your fix, note them but don't fix them

4. **Commit your work**: Create a single atomic commit with message format:
   `fix(BUG-XXX): <short description of what was fixed>`

## Rules
- Only modify files related to this bug. Do not touch unrelated code.
- If the bug detail file references files that don't exist, note this in your response — the codebase may have changed since the bug was logged.
- If you discover the bug has already been fixed (the described problem no longer exists in the code), report this instead of making changes.
- If the fix is more complex than expected (would require architectural changes or touching 10+ files), stop and report this rather than attempting a risky fix.
- Do not update the bug tracking files (BUGS.md, BUG-XXX.md). The orchestrator handles status updates.
```

### Parallelization

- Spawn ALL bugs in the current phase simultaneously — the execution plan guarantees they don't conflict.
- Use `run_in_background: true` for all agents so they work concurrently.
- As each agent completes, you'll be notified. Process results as they arrive.

## Step 4: Process Results

As each developer agent completes, categorize the result:

- **Fixed**: Agent made changes and committed. Record the commit hash and worktree path.
- **Already Fixed**: Bug no longer exists in the codebase. Mark for status update.
- **Too Complex**: Agent determined the fix exceeds safe scope. Flag for manual review.
- **Failed**: Agent encountered errors or couldn't implement the fix. Capture the error details.
- **Files Missing**: Referenced files don't exist. Bug detail may be stale.

Wait for ALL agents in the phase to complete before proceeding.

## Step 5: Report and Update

Once all agents in the phase are done, present a phase completion report:

```
## Phase [N] Results: [Phase Title]

### Fixed (X/Y bugs)
| Bug | Commit | Worktree | Summary |
|-----|--------|----------|---------|
| BUG-XXX | abc1234 | .claude/worktrees/agent-xxx | Renamed proxy.ts to middleware.ts |

### Already Fixed (if any)
| Bug | Evidence |
|-----|----------|
| BUG-YYY | The file was already renamed in commit def5678 |

### Needs Manual Review (if any)
| Bug | Reason |
|-----|--------|
| BUG-ZZZ | Fix requires architectural change to auth middleware |

### Failed (if any)
| Bug | Error |
|-----|-------|
| BUG-AAA | TypeScript compilation failed after changes |
```

Then ask the user what they'd like to do. Offer three options:

1. **"Review the worktrees?"** — They can inspect changes in each worktree before merging.
2. **"Merge all successful fixes?"** — If they approve, run the full merge-verify-update-cleanup workflow (see below).
3. **"Same as last phase"** — Shorthand for: merge all, update statuses, clean worktrees. If the user says this, run the full workflow without further prompts.

### Full Post-Completion Workflow

When the user approves merging (or says "same as last phase"), execute this entire sequence without pausing for confirmation between steps:

#### 1. Cherry-pick all commits onto main

Get commit hashes from each worktree branch (`git log --oneline -1 <branch>`), then cherry-pick sequentially. Order schema migrations first if any bugs include Prisma migrations.

```bash
git cherry-pick <commit-hash>  # repeat for each bug
```

If there's a merge conflict, pause and ask the user how to resolve it. Otherwise continue.

#### 2. Run typecheck verification

```bash
npx tsc --noEmit
```

If typecheck fails, diagnose and fix the issue before continuing. Common causes:
- Agent used an API that doesn't exist in the project's component library (e.g., `asChild` on Base UI Button)
- Type mismatches from schema changes that affect multiple files

Fix any issues, commit the fix, then re-run typecheck until clean.

#### 3. Update bug detail files

For each fixed bug, change `**Status:** Open` to `**Status:** Fixed` in its detail file (e.g., `.planning/bugs/BUG-XXX.md`).

#### 4. Update BUGS.md

- Change each fixed bug's Status from `Open` to `Fixed` in the table
- Recalculate the severity summary counts (decrement open counts per severity, increment Fixed count)

#### 5. Update execution plan

Add completion marker to the phase header in the execution plan:

```markdown
## Phase N: Phase Title [COMPLETED - YYYY-MM-DD]
```

#### 6. Clean up worktrees and branches

```bash
git worktree remove .claude/worktrees/agent-XXXX   # for each worktree
git branch -D worktree-agent-XXXX                    # for each branch
```

Note: Use `git branch -D` (force delete) because cherry-picked branches won't show as "fully merged" — the commits are on main but via cherry-pick, not merge.

#### 7. Verify clean state

```bash
git worktree list   # should show only main worktree
git log --oneline -N  # show the new commits (N = number of bugs fixed)
```

## Step 6: Next Phase Prompt

After the full workflow is complete, tell the user:

**"Phase [N] complete. [X] bugs fixed, [Y] need review. Phase [N+1] is now unblocked: [phase title] ([Z] bugs). Run `/bug-execute next` to continue."**

If all phases are complete:

**"All phases complete! [total] bugs fixed across [phases] phases. Run `/bug-triage` again if new bugs have been logged."**

## Edge Cases

- **Single bug in a phase**: Still use a worktree for isolation, but no parallelization needed.
- **Empty phase** (all bugs already fixed): Mark phase complete automatically and move to the next.
- **Execution plan has been modified** since triage: If a bug ID in the plan doesn't match any bug detail file, skip it and flag it in the report.
- **User wants to skip a bug**: If they say "skip BUG-XXX", don't spawn an agent for it and note it as "Skipped" in the report.
- **User wants to re-run a failed bug**: Support `/bug-execute <phase> --retry BUG-XXX` to re-attempt a single bug from a completed phase.

## Important Behaviors

- **Always use worktree isolation.** Never spawn developer agents on the main working tree. Parallel edits to the same repo without isolation will cause conflicts.
- **Never auto-merge.** Always present results and wait for user approval before merging any changes.
- **Verify after merge.** Run typecheck/tests after merging to catch integration issues between fixes that were developed in isolation.
- **Preserve the execution plan.** Update it with completion markers but never delete or restructure phases. The plan is the historical record of the triage decision.
- **Respect the phase boundary.** Don't start the next phase until the current one is fully processed (all agents done, results reported, user has decided on merges).
