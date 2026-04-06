---
phase: 04-salesforce-org-connectivity-and-developer-integration
plan: 02
subsystem: auth
tags: [salesforce, oauth, jsforce, inngest, server-actions]

requires:
  - phase: 04-01
    provides: "Salesforce OAuth helpers (buildAuthorizationUrl, exchangeCodeForTokens), encryption, Inngest events"
provides:
  - "OAuth authorize/callback API routes for Salesforce connection"
  - "Server actions for disconnect/sync/status with SA/PM role gating"
  - "Org connection settings page with status card UI"
affects: [04-03, 04-04, 04-05]

tech-stack:
  added: [shadcn-alert]
  patterns: [base-ui-render-prop-for-link-buttons, connection-status-card-pattern]

key-files:
  created:
    - src/app/api/auth/salesforce/authorize/route.ts
    - src/app/api/auth/salesforce/callback/route.ts
    - src/actions/org-connection.ts
    - src/components/org/org-connection-card.tsx
    - src/app/(dashboard)/projects/[projectId]/settings/org/page.tsx
    - src/app/(dashboard)/projects/[projectId]/settings/org/connected-toast.tsx
    - src/components/ui/alert.tsx
  modified: []

key-decisions:
  - "Used base-ui render prop pattern for Button-as-link instead of asChild (shadcn v4 base-ui migration)"
  - "Separate OrgConnectedToast client component for sonner toast from server page"

patterns-established:
  - "Connection status card: left border color + badge style driven by status config map"
  - "OAuth API routes use Clerk auth() + ProjectMember role check for SA/PM gating"

requirements-completed: [ORG-01]

duration: 5m
completed: 2026-04-06
---

# Phase 4 Plan 02: Salesforce OAuth Connection Flow Summary

**Salesforce OAuth authorize/callback routes with encrypted token storage, role-gated server actions, and org connection settings page with status card**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-06T23:17:48Z
- **Completed:** 2026-04-06T23:22:50Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- OAuth authorize route with Clerk auth verification, SA/PM role check, and existing org guard
- OAuth callback handler that exchanges code for encrypted tokens, stores them, and triggers Inngest full sync
- Server actions (disconnectOrg, requestSync, getOrgConnectionStatus) with consistent SA/PM role gating
- Org settings page at /projects/[projectId]/settings/org with connection status card, disconnect dialog, and OAuth error/success feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: OAuth API routes and org connection server actions** - `df2319f` (feat)
2. **Task 2: Org connection settings page and status card UI** - `d6c8264` (feat)

## Files Created/Modified
- `src/app/api/auth/salesforce/authorize/route.ts` - OAuth redirect with auth + role + org checks
- `src/app/api/auth/salesforce/callback/route.ts` - Token exchange, storage, and sync trigger
- `src/actions/org-connection.ts` - disconnectOrg, requestSync, getOrgConnectionStatus server actions
- `src/components/org/org-connection-card.tsx` - Connection status card with 4 states and actions
- `src/app/(dashboard)/projects/[projectId]/settings/org/page.tsx` - Org settings server page
- `src/app/(dashboard)/projects/[projectId]/settings/org/connected-toast.tsx` - Client-side success toast
- `src/components/ui/alert.tsx` - shadcn Alert component (new for Phase 4)

## Decisions Made
- Used base-ui `render` prop pattern for Button-as-link (e.g., `<Button render={<a href="..." />}>`) since shadcn v4 with base-ui does not support `asChild`
- Created separate OrgConnectedToast client component to handle sonner toast from server page (toast requires client-side execution)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Button asChild pattern for base-ui**
- **Found during:** Task 2 (Org connection card)
- **Issue:** Plan specified `<Button asChild><Link>` pattern but shadcn v4 uses base-ui which has `render` prop instead of `asChild`
- **Fix:** Changed to `<Button render={<a href="..." />}>` pattern
- **Files modified:** src/components/org/org-connection-card.tsx
- **Verification:** TypeScript compilation passes with no errors
- **Committed in:** d6c8264 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Adaptation to actual component API. No scope creep.

## Issues Encountered
None

## Known Stubs
- Sync Schedule section on org settings page shows placeholder text ("Coming in a future update") -- will be populated in Plan 03
- Sync History section shows placeholder text -- will be populated in Plan 03
- `isSyncing` is hardcoded to `false` on the settings page -- will be dynamic once sync pipeline is built in Plan 03

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- OAuth flow complete, ready for metadata sync pipeline (Plan 03)
- Server actions ready for consumption by sync management UI
- OrgConnectionCard component reusable for any page needing org status display

---
*Phase: 04-salesforce-org-connectivity-and-developer-integration*
*Completed: 2026-04-06*
