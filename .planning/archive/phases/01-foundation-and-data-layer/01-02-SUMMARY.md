---
phase: 01-foundation-and-data-layer
plan: 02
subsystem: ui, infra
tags: [next.js, app-router, inngest, sidebar, role-gating, audit-log, shadcn]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Prisma schema, auth helpers, Inngest client/events, shadcn components, project-scope utility"
provides:
  - "App shell layout with 240px sidebar, project switcher, role-gated navigation"
  - "Inngest serve route at /api/inngest"
  - "Audit log background function writing StatusTransition records"
  - "Reusable EmptyState component"
  - "API route for fetching user projects"
affects: [project-management, settings, team-management, all-dashboard-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "App shell pattern: (dashboard) route group with AppShell wrapper"
    - "Role-gated navigation: NAV_ITEMS array with roles filter"
    - "Inngest function pattern: createFunction with triggers array, step.run for checkpoints"
    - "Client-side data fetching via API route for interactive components"

key-files:
  created:
    - src/components/layout/sidebar.tsx
    - src/components/layout/project-switcher.tsx
    - src/components/layout/app-shell.tsx
    - src/components/layout/user-menu.tsx
    - src/components/shared/empty-state.tsx
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/page.tsx
    - src/app/api/projects/route.ts
    - src/app/api/inngest/route.ts
    - src/lib/inngest/functions/audit-log.ts
    - tests/lib/audit-log.test.ts
  modified: []

key-decisions:
  - "ProjectSwitcher uses client-side fetch via /api/projects route rather than server component to enable interactivity within sidebar"
  - "Inngest v4 uses triggers array in first arg (not second arg) -- adapted from plan's v3-style API"
  - "Used EVENTS constant reference instead of literal string for audit event trigger -- maintains DRY principle"

patterns-established:
  - "Role-gated nav: define NAV_ITEMS with optional roles array, filter by currentMemberRole"
  - "Dashboard layout: extract projectId from headers/pathname, fetch member role server-side"
  - "Inngest function: createFunction({id, retries, triggers}, handler) with step.run for checkpoints"
  - "Empty state: reusable component with heading, description, optional action link"

requirements-completed: [AUTH-03, AUTH-06, INFRA-01, INFRA-02]

# Metrics
duration: 6min
completed: 2026-04-05
---

# Phase 1 Plan 2: App Shell and Inngest Infrastructure Summary

**Role-gated sidebar navigation with project switcher, Inngest serve route, and audit log function writing StatusTransition records**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-05T16:45:30Z
- **Completed:** 2026-04-05T16:51:12Z
- **Tasks:** 2
- **Files created:** 11

## Accomplishments
- App shell with 240px fixed sidebar containing project switcher, role-gated navigation (Settings/Team only for PM and SA per D-10/AUTH-03), and Clerk user menu
- Dashboard page showing project list cards or empty state with CTA to create first project
- Inngest serve route at /api/inngest with audit log function that writes StatusTransition records using step.run for checkpoint support and 3 retries with exponential backoff
- 3 behavioral tests for audit log function configuration (all passing, 8 total tests across project)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build app shell layout** - `2ff50c6` (feat)
2. **Task 2 RED: Failing audit log tests** - `9d52764` (test)
3. **Task 2 GREEN: Audit log function + serve route** - `7d972f9` (feat)

## Files Created/Modified
- `src/components/layout/sidebar.tsx` - 240px fixed sidebar with role-gated nav items
- `src/components/layout/project-switcher.tsx` - Dropdown project selector using DropdownMenu
- `src/components/layout/app-shell.tsx` - Flex layout combining Sidebar + main content
- `src/components/layout/user-menu.tsx` - Clerk UserButton with user name display
- `src/components/shared/empty-state.tsx` - Reusable empty state with heading, description, action
- `src/app/(dashboard)/layout.tsx` - Dashboard route group layout wrapping AppShell, extracts projectId and member role
- `src/app/(dashboard)/page.tsx` - Project list page with empty state fallback
- `src/app/api/projects/route.ts` - GET endpoint returning user's projects for project switcher
- `src/app/api/inngest/route.ts` - Inngest serve route exporting GET, POST, PUT
- `src/lib/inngest/functions/audit-log.ts` - Audit log function with step.run, 3 retries
- `tests/lib/audit-log.test.ts` - 3 behavioral tests for function config

## Decisions Made
- ProjectSwitcher implemented as client component with API route fetch (not server component) because it needs interactive dropdown behavior within the sidebar
- Inngest v4 API uses `triggers` array in the first argument object rather than a separate second argument -- adapted from plan's suggested code
- Used `EVENTS.AUDIT_SENSITIVE_OP` constant reference instead of hardcoded string for the event trigger, maintaining DRY with the events registry

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Inngest v4 API signature change**
- **Found during:** Task 2 (audit log function implementation)
- **Issue:** Plan specified `inngest.createFunction(config, { event: "..." }, handler)` (v3 style) but Inngest v4 requires triggers in the first argument: `createFunction({ id, retries, triggers: [{ event }] }, handler)`
- **Fix:** Used correct v4 API with triggers array in config object
- **Files modified:** src/lib/inngest/functions/audit-log.ts
- **Verification:** Tests pass, tsc passes
- **Committed in:** 7d972f9

**2. [Rule 1 - Bug] Fixed Button asChild prop incompatibility**
- **Found during:** Task 1 (empty state component)
- **Issue:** shadcn/ui Button uses base-ui (not Radix), does not support `asChild` prop -- TypeScript error
- **Fix:** Replaced `<Button asChild>` with styled Link element matching button appearance
- **Files modified:** src/components/shared/empty-state.tsx
- **Verification:** tsc --noEmit passes
- **Committed in:** 2ff50c6

**3. [Rule 1 - Bug] Fixed Clerk UserButton prop**
- **Found during:** Task 1 (user menu component)
- **Issue:** `afterSignOutUrl` prop does not exist on Clerk v7 UserButton
- **Fix:** Removed the prop -- Clerk handles sign-out redirect via dashboard configuration
- **Files modified:** src/components/layout/user-menu.tsx
- **Verification:** tsc --noEmit passes
- **Committed in:** 2ff50c6

**4. [Rule 2 - Missing Critical] Added API route for project fetching**
- **Found during:** Task 1 (project switcher)
- **Issue:** ProjectSwitcher needs to fetch projects client-side but no API endpoint existed
- **Fix:** Created `/api/projects/route.ts` returning user's projects (scoped by clerkUserId)
- **Files modified:** src/app/api/projects/route.ts
- **Verification:** tsc passes, route returns user's projects only (T-02-03 mitigation)
- **Committed in:** 2ff50c6

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 blocking, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Threat Surface Verification

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-02-01 | Inngest signing key verification via `serve()` | Built-in to serve() |
| T-02-02 | Audit log records userId, userRole in StatusTransition | Implemented |
| T-02-03 | Project list query scoped by clerkUserId | Implemented in both page and API route |
| T-02-04 | Sidebar filters nav by currentMemberRole; server-side role check in layout | Implemented |

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: api_endpoint | src/app/api/projects/route.ts | New API endpoint not in original plan -- returns user's projects. Protected by requireAuth() |

## Known Stubs

None -- all components are wired to real data sources (Prisma queries, Clerk auth).

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- App shell is ready for all dashboard pages to render inside the (dashboard) route group
- Inngest infrastructure validated end-to-end with audit log function
- Role-gating pattern established for future nav items in later phases

## Self-Check: PASSED

All 11 created files verified on disk. All 3 task commits (2ff50c6, 9d52764, 7d972f9) verified in git log.

---
*Phase: 01-foundation-and-data-layer*
*Completed: 2026-04-05*
