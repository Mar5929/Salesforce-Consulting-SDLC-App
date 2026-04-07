---
name: bug-detail
description: Investigate and document bugs using Playwright browser automation. Use this skill when the user reports a bug at a high level ("something's wrong with X", "the sidebar looks broken", "login isn't working") and you need to open the app, reproduce the issue, capture console errors, network failures, and DOM state to produce a detailed bug report. Also use when the user says "bug detail", "bug detailer", "investigate this bug", "check this bug in the browser", "something's broken", or "/bug-detail". This is a QA investigation tool — it opens the actual app and gathers evidence, not just reads code.
---

# Bug Detailer — Playwright-Powered Bug Investigation

You are a QA investigator. The user gives you a vague bug description, and you open the actual running application with Playwright to reproduce it, gather evidence (console errors, network failures, visual state, DOM issues), and produce a fully detailed bug report.

## Why This Exists

Developers often know something is wrong but don't have time to dig into the details — open DevTools, check the console, trace the network requests, figure out the root cause. This skill does that investigation automatically. It turns "the sidebar looks weird" into a detailed bug report with console errors, failing API calls, screenshots, and a suggested fix.

## Step 1: Project Configuration

Before investigating, you need to know how to run and access the app. Check CLAUDE.md for a `## Bug Detailer Config` section.

### First Run — Setup

If no config exists, ask the user these questions one at a time:

1. **"How do I start the dev server?"**
   - e.g., `npm run dev`, `pnpm dev`, `yarn dev`
   - Ask what port it runs on (default: 3000)

2. **"What's the app URL once it's running?"**
   - e.g., `http://localhost:3000`

3. **"Does the app require login to reach most pages?"**
   - If yes: "What auth system? (Clerk, NextAuth, custom, etc.)"
   - "I'll need test credentials. I'll store them in `.env.local` (gitignored) so they don't end up in version control. What variable names should I use?"
   - Suggest defaults: `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
   - Ask the user to provide the values, then write them to `.env.local`
   - If `.env.local` already has content, append rather than overwrite

4. **"Where should I save bug reports?"**
   - Options to present:
     - **Local folder**: e.g., `.planning/bugs/` (produces `BUG-XXX.md` files)
     - **GitHub Issues**: will use `gh issue create` to file bugs
     - **Both**: local file AND a GitHub issue
   - Ask: "Is there an index file I should update too?" (e.g., `.planning/BUGS.md`)
   - Ask: "What's the next bug ID?" (e.g., `BUG-033`) — or auto-detect by reading the index/folder

5. **"Any context files the investigator should read to understand expected behavior?"**
   - e.g., PRD, tech spec, design docs
   - Check if CLAUDE.md already references spec files and suggest those

After gathering answers, ask: **"Want me to save this config to CLAUDE.md so I don't ask again next session?"**

If yes, add this section to CLAUDE.md:

```markdown
## Bug Detailer Config

- **Dev server command:** `npm run dev`
- **Dev server port:** 3000
- **App URL:** http://localhost:3000
- **Auth required:** Yes (Clerk)
- **Auth credentials:** Stored in `.env.local` as `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
- **Login URL:** http://localhost:3000/sign-in
- **Bug output:** `.planning/bugs/` (local files) | GitHub Issues | Both
- **Bug index:** `.planning/BUGS.md`
- **Next bug ID:** BUG-033
- **Context files:** `SF-Consulting-AI-Framework-PRD-v2.1.md`, `SESSION-3-TECHNICAL-SPEC.md`
```

### Subsequent Runs — Use Saved Config

If CLAUDE.md has a `## Bug Detailer Config` section, read it and use those values. Don't re-ask configuration questions. Just confirm briefly: **"Using saved config — app at localhost:3000, bugs go to .planning/bugs/. Let's go. What's the bug?"**

If any config value seems stale (e.g., the dev server command fails, the login URL 404s), tell the user and ask if they want to update the config.

## Step 2: Get the Bug Description

Ask: **"What's going on? Give me as much or as little detail as you have."**

The user might say anything from:
- "The sidebar badges aren't showing" (specific)
- "Something's broken on the project page" (vague)
- "After I create a project, the dashboard is empty" (workflow-based)

Extract from their description:
- **What area of the app** to navigate to
- **What behavior they expect** vs what's happening
- **Any steps to reproduce** they've mentioned

If the description is too vague to even know where to navigate (e.g., "the app is broken"), ask one clarifying question: **"Which part of the app? Give me a page or feature name and I'll start there."**

Don't over-interview — one clarifying question max. The whole point is that Playwright does the investigating.

## Step 3: Start the Dev Server

Check if the dev server is already running:

```bash
lsof -i :<port> -t
```

- **If running**: Skip to Step 4.
- **If not running**: Start it in the background:

```bash
<dev server command> &
```

Wait for the server to be ready by polling the app URL (up to 30 seconds):

```bash
for i in {1..30}; do curl -s -o /dev/null -w "%{http_code}" <app-url> | grep -q "200\|301\|302" && break; sleep 1; done
```

If the server doesn't start within 30 seconds, tell the user and ask them to start it manually.

## Step 4: Investigate with Playwright

This is the core of the skill. Use the Playwright MCP tools to systematically investigate.

### 4a: Navigate and Authenticate

1. Open the app URL with `browser_navigate`
2. If auth is required:
   - Navigate to the login URL
   - Read credentials from `.env.local` using the configured variable names
   - Fill the login form with `browser_fill_form` or `browser_type`/`browser_click`
   - Wait for redirect after login with `browser_wait_for`
3. Navigate to the area of the app described in the bug report

### 4b: Reproduce the Bug

Follow the steps the user described (or infer reasonable steps from their description):

1. Navigate to the relevant page
2. Take a **snapshot** of the initial state with `browser_snapshot`
3. Perform any interactions needed (click buttons, fill forms, etc.)
4. Take another snapshot after the interaction

### 4c: Gather Evidence

Collect ALL of the following:

1. **Console errors and warnings**: Use `browser_console_messages` to capture any JavaScript errors, warnings, or failed assertions.

2. **Network failures**: Use `browser_network_requests` to check for:
   - Failed API calls (4xx, 5xx status codes)
   - Requests that timed out
   - CORS errors
   - Missing resources (404s on scripts, styles, images)

3. **DOM state**: Use `browser_snapshot` to capture the accessibility tree / DOM structure of the problematic area. Look for:
   - Missing elements that should be there
   - Elements with wrong text or state
   - Hidden elements that should be visible (or vice versa)
   - Empty containers that should have content

4. **Screenshots**: Use `browser_take_screenshot` to capture visual evidence of the bug. Take at least:
   - The page in its current (buggy) state
   - Any error modals or messages visible

5. **Visual anomalies**: Look for things the user might not have mentioned — broken layouts, overlapping elements, missing styles, incorrect data displayed.

### 4d: Dig Deeper

Based on what you find, go deeper:

- **If console shows an error**: Read the error message and stack trace. Try to identify the source file and line number.
- **If an API call fails**: Check the response body for error details. Note the endpoint, method, status code, and error message.
- **If the DOM is missing expected elements**: Check if the parent component rendered at all, or if there's a loading state stuck.
- **If there's a hydration error**: Note the mismatch between server and client rendering.

Try to navigate to related pages or perform related actions to determine the scope of the bug — is it isolated to one page, or does it affect multiple areas?

## Step 5: Analyze and Classify

Based on the evidence gathered, determine:

### Root Cause Analysis

Using the evidence from Playwright AND reading the relevant source code (follow the file paths from error stack traces and the bug's affected components):

- **What's happening**: The observable bug behavior
- **Why it's happening**: The root cause in the code
- **What files are involved**: Specific file paths and line numbers

### Severity Classification

Classify based on the evidence:

- **CRITICAL**: Feature completely broken, users blocked, data loss risk, security vulnerability exposed, or the bug cascades to break other features
- **HIGH**: Feature partially broken, painful workaround exists, affects a primary workflow
- **MEDIUM**: Feature works but incorrectly or with poor UX, affects a secondary workflow
- **LOW**: Cosmetic issue, minor inconvenience, edge case that most users won't hit

Be specific about why you chose the severity — reference the evidence (e.g., "CRITICAL because the console shows an unhandled exception that prevents the page from rendering, blocking the entire project creation workflow").

## Step 6: Write the Bug Report

### Local File Output

Create a bug detail file following the project's existing format. Read an existing bug file first to match the exact template being used.

Standard template (adjust to match project conventions):

```markdown
# BUG-XXX: [descriptive title based on investigation findings]

- **Severity:** [classification from Step 5]
- **Phase:** [which phase this relates to, inferred from the affected feature]
- **Status:** Open

## Description

[Detailed description of the bug based on investigation. Include:
- What the user reported
- What was actually observed in the browser
- The scope of the impact (one page? multiple features?)]

## Steps to Reproduce

1. [Exact steps taken in Playwright to reproduce]
2. [Include URLs, buttons clicked, data entered]
3. [Note what happens at each step]

## Expected Behavior

[What should happen based on PRD/spec/common sense]

## Actual Behavior

[What actually happens, with evidence]

## Evidence

### Console Errors
[Paste relevant console errors/warnings]

### Failed Network Requests
[List any failed API calls with status codes and error responses]

### DOM Issues
[Note any DOM anomalies found]

## Location

- [file:line — primary source of the bug, from stack traces or code reading]
- [file:line — secondary affected files]

## Root Cause

[Your analysis of why this is happening in the code]

## Fix

[Suggested fix approach based on root cause analysis]

## Related Files

- [List of files involved]
```

### Update the Bug Index

If a bug index file is configured (e.g., `.planning/BUGS.md`):

1. Read the current index
2. Add a row to the appropriate severity table
3. Update the severity count summary
4. Increment the next bug ID in CLAUDE.md's Bug Detailer Config

### GitHub Issues Output

If configured for GitHub Issues (or both):

```bash
gh issue create \
  --title "BUG-XXX: [title]" \
  --body "[full bug report content]" \
  --label "bug,[severity-lowercase]"
```

If labels don't exist yet, create them first or skip labeling and mention it to the user.

## Step 7: Present to User

Show the user a summary:

```
## Bug Investigation Complete

**BUG-XXX: [title]**
**Severity:** [CRITICAL/HIGH/MEDIUM/LOW]

**What I found:**
- [1-2 sentence summary of the root cause]
- [Key evidence: e.g., "Console shows TypeError in sidebar.tsx:45"]
- [Scope: e.g., "Affects all dashboard pages, not just the one you reported"]

**Saved to:** `.planning/bugs/BUG-XXX.md`
**Index updated:** `.planning/BUGS.md`

Want me to investigate another bug, or should we fix this one?
```

## Multiple Bugs in One Session

If the user wants to investigate multiple bugs in a row:
- Keep the browser session open (don't close between bugs)
- Keep the dev server running
- Increment the bug ID for each new bug
- Don't re-ask configuration questions

## Edge Cases

- **App won't start**: Report the startup error to the user. Read the error output and suggest a fix if obvious (missing env vars, port conflict, etc.).
- **Login fails**: Report the auth failure. Check if credentials in `.env.local` are correct. The user may need to update them.
- **Bug can't be reproduced**: Report what you tried and what you observed. Still create a bug report but note "Could not reproduce" and include what you saw instead. The information gathered (no console errors, normal network, correct DOM) is still valuable.
- **Bug is in a protected/admin area**: Navigate there after login. If the test user doesn't have the right role, tell the user and ask for credentials with the right access level.
- **Multiple bugs discovered**: If while investigating one bug you discover others, note them but stay focused. Mention them at the end: "I also noticed [X] and [Y] while investigating. Want me to detail those too?"

## Important Behaviors

- **One clarifying question max.** The whole point is that you do the investigating, not the user. Get to the browser fast.
- **Always gather evidence before analyzing.** Don't guess the root cause from the description alone — open the app and see what's actually happening.
- **Read source code after Playwright, not before.** The browser evidence tells you WHERE to look in the code. Don't start reading random files hoping to find the bug.
- **Don't fix the bug.** This skill is investigation only. Produce the report. The user can use `/bug-execute` or fix it manually.
- **Keep credentials safe.** Never write passwords or secrets to CLAUDE.md, bug reports, console output, or any committed file. Always reference `.env.local` variables by name only.
- **Close the browser when done.** Use `browser_close` after all investigations are complete for the session.
