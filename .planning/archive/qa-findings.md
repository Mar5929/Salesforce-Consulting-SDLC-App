# QA Findings — Playwright Live Testing (2026-04-07)

Production URL: https://salesforce-consulting-sdlc-app.vercel.app
Test project ID: l15ie8bsdib4nhrthwa2w5rl
Tester: Claude (Playwright MCP)

## Summary

- **31 pages tested** across auth, navigation, and all project-scoped routes
- **5 critical/high bugs found** (2 new, 3 confirm existing)
- **10 pages render correctly** with content
- **3 pages crash client-side** (nuqs adapter missing)
- **2 pages crash server-side** (scopedPrisma + Project model)
- **1 route redirects incorrectly** (/projects/new)

## New Bugs Found

### NEW-1: Missing NuqsAdapter crashes pages using useQueryState (CRITICAL)

- **Severity:** CRITICAL
- **Pages affected:** `/projects/[id]/questions`, `/projects/[id]/work`, `/projects/[id]/defects`
- **Error:** `[nuqs] nuqs requires an adapter to work with your framework. See https://nuqs.dev/NUQS-404`
- **Root cause:** `src/app/layout.tsx` does not wrap children with `<NuqsAdapter>` from `nuqs/adapters/next/app`
- **Components using nuqs:** `src/components/questions/question-table.tsx`, `src/components/work/view-toggle.tsx`, `src/components/defects/defect-filters.tsx`
- **Fix:** Add `import { NuqsAdapter } from 'nuqs/adapters/next/app'` to root layout and wrap `{children}` with `<NuqsAdapter>`
- **Confirms existing bug?** No — this is a new finding not in BUG-001–031

### NEW-2: /projects/new redirects to / instead of showing create form (HIGH)

- **Severity:** HIGH
- **URL:** `/projects/new`
- **Expected:** Create Project wizard renders
- **Actual:** Redirects to `/` (project list)
- **Root cause:** `src/app/(dashboard)/layout.tsx` line 8 regex `^\/projects\/([^/]+)` captures `"new"` as a projectId, then `getCurrentMember("new")` throws "Not a member of this project", triggering redirect to `/`
- **Fix:** Exclude `"new"` from the projectId extraction: `if (match && match[1] !== 'new')`
- **Confirms existing bug?** No — new finding

## Confirmed Existing Bugs

### CONFIRMED: BUG-031 — Sidebar fallback paths 404 when no project active (upgrade to MEDIUM)

- **Original severity:** LOW → **Should be:** MEDIUM
- **Evidence:** 11 console 404 errors on dashboard load from RSC prefetch of `/questions?_rsc=`, `/transcripts?_rsc=`, etc.
- **Note:** BUG-031 description says "sidebar hides these items when no project is active" — this is WRONG. All items are visible and clickable. Only role-gated items (Documents, PM Dashboard, Settings, Team) are hidden.

### CONFIRMED: scopedPrisma injects projectId into Project model queries (500)

- **Pages affected:** `/projects/[id]` (overview), `/projects/[id]/settings/team`
- **Root cause:** `src/lib/project-scope.ts` line 3 includes `"Project"` in `MODELS_WITH_PROJECT_ID`. The `Project` model has no `projectId` column — its own `id` IS the project ID. When `scopedPrisma` injects `{ projectId }` into `Project.findUnique` where clause, Prisma crashes.
- **Fix:** Remove `"Project"` from `MODELS_WITH_PROJECT_ID` array
- **Likely existing bug:** Check if this matches BUG-005 or similar

### CONFIRMED: Missing favicon.ico (LOW)

- **Evidence:** Console 404 for `/favicon.ico` on every page load
- **Fix:** Add a favicon to `src/app/` or `public/`

## Pages That Work Correctly

| Route | Content Verified |
|-------|-----------------|
| `/` (dashboard home) | Project list with cards |
| `/projects/[id]/transcripts` | Upload zone, paste area, "Past Transcripts" section |
| `/projects/[id]/chat` | "Project Chat - Start a conversation" |
| `/projects/[id]/knowledge` | "Knowledge Base - AI-synthesized understanding" |
| `/projects/[id]/dashboard` | "Discovery Dashboard - hasn't started" |
| `/projects/[id]/backlog` | Backlog table with columns (ID, Title, Status, Priority...) |
| `/projects/[id]/sprints` | Sprint list with "New Sprint" button |
| `/projects/[id]/org` | "Org Overview - No metadata synced" |
| `/projects/[id]/org/analysis` | Analysis pipeline stepper (Parse, Classify, Synthesize, Complete) |
| `/projects/[id]/documents` | Document templates (Discovery Report, etc.) |
| `/projects/[id]/pm-dashboard` | "PM Dashboard - building..." |
| `/projects/[id]/settings` | Settings form (name, client, engagement type, dates) |

## Pages That Crash

| Route | Status | Crash Type | Root Cause |
|-------|--------|------------|------------|
| `/projects/[id]` (overview) | 500 | Server | scopedPrisma + Project model |
| `/projects/[id]/settings/team` | 500 | Server | scopedPrisma + Project model |
| `/projects/[id]/questions` | 200→crash | Client hydration | Missing NuqsAdapter |
| `/projects/[id]/work` | 200→crash | Client hydration | Missing NuqsAdapter |
| `/projects/[id]/defects` | 200→crash | Client hydration | Missing NuqsAdapter |
| `/projects/new` | 302→/ | Redirect | Layout regex captures "new" as projectId |

## Console Error Summary

- 11x 404 errors from sidebar RSC prefetch (BUG-031)
- 1x favicon.ico 404
- 1x nuqs NUQS-404 adapter error (on affected pages)
- 1x "Server Components render error" (generic production error message)
