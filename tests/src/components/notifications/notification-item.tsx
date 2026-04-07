"use client"

/**
 * Notification Item (D-28)
 *
 * Single notification row with type-specific icon, title, body,
 * timestamp, and unread indicator. Click navigates to entity detail
 * and marks the notification as read.
 */

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  CircleHelp,
  FileText,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Zap,
  Activity,
  Shield,
  GitBranch,
  Server,
  Bell,
} from "lucide-react"
import { markRead } from "@/actions/notifications"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface NotificationData {
  id: string
  projectId: string
  type: string
  title: string
  body: string | null
  entityType: string
  entityId: string
  isRead: boolean
  createdAt: string | Date
}

interface NotificationItemProps {
  notification: NotificationData
  onRead?: () => void
}

// ────────────────────────────────────────────
// Icon mapping by notification type
// ────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
  QUESTION_ANSWERED: CircleHelp,
  QUESTION_ASSIGNED: CircleHelp,
  QUESTION_AGING: CircleHelp,
  WORK_ITEM_UNBLOCKED: Zap,
  SPRINT_CONFLICT_DETECTED: GitBranch,
  AI_PROCESSING_COMPLETE: FileText,
  HEALTH_SCORE_CHANGED: Activity,
  STORY_STATUS_CHANGED: CheckCircle,
  STORY_MOVED_TO_QA: Shield,
  STORY_REASSIGNED: CheckCircle,
  DECISION_RECORDED: CheckCircle,
  RISK_CHANGED: AlertTriangle,
  ARTICLE_FLAGGED_STALE: BookOpen,
  METADATA_SYNC_COMPLETE: Server,
}

// ────────────────────────────────────────────
// Entity route mapping
// ────────────────────────────────────────────

function getEntityRoute(
  projectId: string,
  entityType: string,
  entityId: string
): string {
  const base = `/projects/${projectId}`
  switch (entityType) {
    case "QUESTION":
      return `${base}/questions/${entityId}`
    case "STORY":
      return `${base}/stories/${entityId}`
    case "SPRINT":
      return `${base}/sprints/${entityId}`
    case "ARTICLE":
      return `${base}/knowledge/${entityId}`
    case "BUSINESS_PROCESS":
      return `${base}/knowledge/processes/${entityId}`
    case "DECISION":
      return `${base}/decisions/${entityId}`
    case "RISK":
      return `${base}/risks/${entityId}`
    case "PROJECT":
      return `${base}/dashboard`
    default:
      return base
  }
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter()
  const Icon = TYPE_ICONS[notification.type] ?? Bell

  const handleClick = async () => {
    if (!notification.isRead) {
      await markRead({
        projectId: notification.projectId,
        notificationId: notification.id,
      })
      onRead?.()
    }
    const route = getEntityRoute(
      notification.projectId,
      notification.entityType,
      notification.entityId
    )
    router.push(route)
  }

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  })

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-zinc-50"
    >
      {/* Unread indicator */}
      <div className="mt-1.5 flex-shrink-0">
        {!notification.isRead ? (
          <div className="h-2 w-2 rounded-full bg-blue-600" />
        ) : (
          <div className="h-2 w-2" />
        )}
      </div>

      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0">
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${
            notification.isRead ? "text-zinc-500" : "text-zinc-900"
          }`}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 text-[13px] leading-snug text-zinc-400 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-[13px] text-zinc-400">{timeAgo}</p>
      </div>
    </button>
  )
}
