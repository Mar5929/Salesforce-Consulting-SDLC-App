"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SessionStatusBadgeProps {
  status: "ACTIVE" | "COMPLETE" | "FAILED"
  conversationType?: string
}

/**
 * Renders conversation status as a colored badge.
 * ACTIVE is only shown for task sessions (not GENERAL_CHAT).
 * COMPLETE uses secondary variant.
 * FAILED uses destructive styling.
 */
export function SessionStatusBadge({
  status,
  conversationType,
}: SessionStatusBadgeProps) {
  // ACTIVE badge is hidden for general chat
  if (status === "ACTIVE" && conversationType === "GENERAL_CHAT") {
    return null
  }

  if (status === "ACTIVE") {
    return (
      <Badge variant="outline" aria-label="Session status: Active">
        Active
      </Badge>
    )
  }

  if (status === "COMPLETE") {
    return (
      <Badge variant="secondary" aria-label="Session status: Complete">
        Complete
      </Badge>
    )
  }

  if (status === "FAILED") {
    return (
      <Badge
        className={cn(
          "border-destructive/20 bg-destructive/10 text-destructive"
        )}
        aria-label="Session status: Failed"
      >
        Failed
      </Badge>
    )
  }

  return null
}
