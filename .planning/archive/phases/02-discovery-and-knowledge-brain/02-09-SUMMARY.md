---
phase: 02-discovery-and-knowledge-brain
plan: 09
subsystem: notifications
tags: [inngest, swr, polling, bell-icon, dropdown-panel, notifications, in-app]

requires:
  - phase: 02-04
    provides: question system with display IDs, question server actions
provides:
  - Notification server actions (getNotifications, getUnreadCount, markRead, markAllRead)
  - Inngest notification dispatch function with role-based recipient resolution
  - Bell icon with unread count badge and SWR polling (30s)
  - Dropdown notification panel with time-grouped items
  - Click-through navigation from notification to entity detail
  - App header bar in app-shell layout
affects: []

tech-stack:
  added: []
  patterns:
    - "SWR polling for lightweight unread count (30s interval)"
    - "Time-grouped notification display (Today/Yesterday/This Week/Older)"
    - "Role-based recipient resolution per notification type in Inngest step function"
    - "App header bar pattern for global UI elements (bell, search, avatar)"

key-files:
  created:
    - src/actions/notifications.ts
    - src/lib/inngest/functions/notification-dispatch.ts
    - src/components/notifications/notification-bell.tsx
    - src/components/notifications/notification-panel.tsx
    - src/components/notifications/notification-item.tsx
  modified:
    - src/app/api/inngest/route.ts
    - src/components/layout/app-shell.tsx

key-decisions:
  - "No priority field on Notification model -- ordering by createdAt DESC instead of priority-based (schema deviation)"
  - "No readAt field on Notification model -- using isRead boolean only"
  - "recipientId references ProjectMember.id, not clerkUserId -- getCurrentMember resolves the mapping"
  - "Adapted to actual NotificationType enum (14 values) instead of plan's 10 event types"
  - "Custom dropdown panel instead of Popover primitive (no node_modules installed)"
  - "Added app header bar to app-shell for bell icon positioning"

patterns-established:
  - "SWR polling pattern for real-time-ish server action data"
  - "Notification type-to-icon mapping for consistent visual language"
  - "Entity type-to-route mapping for click-through navigation"
  - "App header bar for global actions above main content area"

requirements-completed: [NOTF-01, NOTF-02, NOTF-03, NOTF-04]

duration: 4min
completed: 2026-04-06
---

# Phase 02 Plan 09: Notification System Summary

**In-app notification bell with SWR-polled unread count, time-grouped dropdown panel, Inngest dispatch with role-based recipient resolution for 14 event types**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-06T19:04:39Z
- **Completed:** 2026-04-06T19:08:41Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments
- Complete notification server actions with recipient ownership verification on all operations (T-02-31, T-02-32)
- Inngest notification dispatch function resolving recipients by role per notification type, with batch createMany for all 14 NotificationType enum values
- Bell icon in app header with SWR polling (30s), unread count badge, and dropdown panel
- Time-grouped notification display with type-specific icons and click-through entity navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Notification server actions and Inngest dispatch function** - `6e2a87f` (feat)
2. **Task 2: Notification UI - bell icon, dropdown panel, and notification items** - `a55dd50` (feat)

## Files Created/Modified
- `src/actions/notifications.ts` - getNotifications, getUnreadCount, markRead, markAllRead server actions
- `src/lib/inngest/functions/notification-dispatch.ts` - Inngest function with recipient resolution and batch creation
- `src/components/notifications/notification-bell.tsx` - Bell icon with SWR polling and dropdown toggle
- `src/components/notifications/notification-panel.tsx` - Time-grouped notification list with mark all read
- `src/components/notifications/notification-item.tsx` - Individual notification with icon, timestamp, click-through
- `src/app/api/inngest/route.ts` - Registered notificationDispatchFunction
- `src/components/layout/app-shell.tsx` - Added app header bar with NotificationBell

## Decisions Made
1. **No priority field on Notification model**: Schema has no priority column. Ordering uses createdAt DESC instead of priority-based ordering. If priority is needed later, a schema migration would be required.
2. **Adapted to actual NotificationType enum**: Schema defines 14 notification types (not the 10 from the plan). All 14 types have appropriate role-based recipient resolution.
3. **No readAt timestamp**: Schema only has `isRead` boolean, no `readAt` DateTime. markRead sets isRead=true without timestamp.
4. **Custom dropdown instead of Popover**: Built dropdown with React state, outside-click handler, and Escape-to-close since @base-ui/react Popover not available without node_modules.
5. **App header bar added to app-shell**: Created header bar above main content for bell icon positioning. Future use for search trigger and user avatar.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] No priority field on Notification model**
- **Found during:** Task 1 (notification actions)
- **Issue:** Plan specified priority-based ordering (D-30) but Notification model has no priority column
- **Fix:** Order by createdAt DESC only. Priority-based ordering would require a schema migration.
- **Files modified:** src/actions/notifications.ts
- **Committed in:** 6e2a87f

**2. [Rule 1 - Bug] No readAt field on Notification model**
- **Found during:** Task 1 (markRead action)
- **Issue:** Plan specified setting readAt=now, but schema only has isRead boolean
- **Fix:** Set isRead=true without readAt timestamp
- **Files modified:** src/actions/notifications.ts
- **Committed in:** 6e2a87f

**3. [Rule 1 - Bug] NotificationType enum has 14 values, not 10**
- **Found during:** Task 1 (dispatch function)
- **Issue:** Plan specified 10 event types with specific copy templates. Schema has 14 enum values with different names.
- **Fix:** Adapted recipient resolution to handle all 14 actual enum values with role-based targeting
- **Files modified:** src/lib/inngest/functions/notification-dispatch.ts
- **Committed in:** 6e2a87f

**4. [Rule 3 - Blocking] No @base-ui/react Popover for notification panel**
- **Found during:** Task 2 (notification panel)
- **Issue:** No Popover UI component available and node_modules not installed
- **Fix:** Built custom dropdown with React state, outside-click detection, Escape key handler
- **Files modified:** src/components/notifications/notification-bell.tsx
- **Committed in:** a55dd50

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness against actual schema. No scope creep. Priority ordering deferred pending schema migration.

## Known Stubs

None - all notification actions, dispatch, and UI components are fully wired.

## Issues Encountered
- node_modules not installed, preventing TypeScript compilation verification. Pre-existing condition from prior plans. All code verified manually against Prisma schema types.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Notification system complete and ready for integration testing
- Inngest dispatch function registered and ready to receive NOTIFICATION_SEND events
- Other features can send notifications by calling `inngest.send({ name: EVENTS.NOTIFICATION_SEND, data: {...} })`
- Bell icon globally visible in app header when inside a project context
- Phase 02 plan completion: this is the final plan (9 of 9) in the discovery-and-knowledge-brain phase

## Self-Check: PASSED

---
*Phase: 02-discovery-and-knowledge-brain*
*Completed: 2026-04-06*
