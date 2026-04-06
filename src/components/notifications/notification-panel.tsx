"use client"

/**
 * Notification Panel (D-27, D-28, D-30)
 *
 * Dropdown panel showing notifications grouped by time period.
 * "Today", "Yesterday", "This Week", "Older".
 * Mark all read button. Empty state.
 */

import { useMemo } from "react"
import {
  isToday,
  isYesterday,
  isThisWeek,
} from "date-fns"
import { NotificationItem, type NotificationData } from "./notification-item"
import { markAllRead } from "@/actions/notifications"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface NotificationPanelProps {
  projectId: string
  notifications: NotificationData[]
  onRefresh: () => void
}

// ────────────────────────────────────────────
// Time grouping
// ────────────────────────────────────────────

interface NotificationGroup {
  label: string
  items: NotificationData[]
}

function groupByTime(notifications: NotificationData[]): NotificationGroup[] {
  const groups: Record<string, NotificationData[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  }

  for (const n of notifications) {
    const date = new Date(n.createdAt)
    if (isToday(date)) {
      groups["Today"].push(n)
    } else if (isYesterday(date)) {
      groups["Yesterday"].push(n)
    } else if (isThisWeek(date)) {
      groups["This Week"].push(n)
    } else {
      groups["Older"].push(n)
    }
  }

  // Return only non-empty groups in order
  return ["Today", "Yesterday", "This Week", "Older"]
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ label, items: groups[label] }))
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function NotificationPanel({
  projectId,
  notifications,
  onRefresh,
}: NotificationPanelProps) {
  const groups = useMemo(() => groupByTime(notifications), [notifications])
  const hasUnread = notifications.some((n) => !n.isRead)

  const handleMarkAllRead = async () => {
    await markAllRead({ projectId })
    onRefresh()
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-sm font-medium text-zinc-900">All caught up</p>
        <p className="mt-1 text-[13px] text-zinc-400">
          No new notifications right now.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-[13px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[400px] overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-4 py-1.5 border-b border-zinc-50">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                {group.label}
              </span>
            </div>
            {group.items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onRefresh}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
