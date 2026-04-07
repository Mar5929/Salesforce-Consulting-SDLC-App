"use client"

/**
 * Notification Bell (D-27)
 *
 * Bell icon in app header with unread count badge.
 * SWR polling every 30s for unread count.
 * Click opens notification panel popover.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import useSWR from "swr"
import { getNotifications, getUnreadCount } from "@/actions/notifications"
import { NotificationPanel } from "./notification-panel"
import type { NotificationData } from "./notification-item"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface NotificationBellProps {
  projectId: string
}

// ────────────────────────────────────────────
// SWR fetchers
// ────────────────────────────────────────────

async function fetchUnreadCount(projectId: string): Promise<number> {
  const result = await getUnreadCount({ projectId })
  if (result?.data) {
    return result.data.count
  }
  return 0
}

async function fetchNotifications(
  projectId: string
): Promise<NotificationData[]> {
  const result = await getNotifications({ projectId, limit: 30 })
  if (result?.data) {
    return result.data.notifications as NotificationData[]
  }
  return []
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function NotificationBell({ projectId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Poll unread count every 30s (D-27)
  const { data: unreadCount = 0, mutate: mutateCount } = useSWR(
    `notifications-count-${projectId}`,
    () => fetchUnreadCount(projectId),
    { refreshInterval: 30000 }
  )

  // Fetch full notifications only when panel is open
  const {
    data: notifications = [],
    mutate: mutateNotifications,
  } = useSWR(
    isOpen ? `notifications-list-${projectId}` : null,
    () => fetchNotifications(projectId)
  )

  const handleRefresh = useCallback(() => {
    mutateCount()
    mutateNotifications()
  }, [mutateCount, mutateNotifications])

  // Close panel on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        <Bell className="h-5 w-5" />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel dropdown */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[360px] rounded-lg border border-zinc-200 bg-white shadow-lg z-50"
        >
          <NotificationPanel
            projectId={projectId}
            notifications={notifications}
            onRefresh={handleRefresh}
          />
        </div>
      )}
    </div>
  )
}
