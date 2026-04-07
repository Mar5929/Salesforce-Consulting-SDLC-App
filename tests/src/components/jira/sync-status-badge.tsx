"use client"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type SyncStatus = "SYNCED" | "PENDING" | "FAILED"

interface SyncStatusBadgeProps {
  status?: SyncStatus | string | null
  lastSyncAt?: Date | string | null
  jiraIssueKey?: string | null
}

// ────────────────────────────────────────────
// Status config
// ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SyncStatus,
  { label: string; className: string; variant: "outline" | "default" | "destructive" }
> = {
  SYNCED: {
    label: "Synced",
    className: "border-primary text-primary",
    variant: "outline",
  },
  PENDING: {
    label: "Pending",
    className: "text-muted-foreground",
    variant: "outline",
  },
  FAILED: {
    label: "Failed",
    className: "bg-destructive text-white border-destructive",
    variant: "default",
  },
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function SyncStatusBadge({
  status,
  lastSyncAt,
  jiraIssueKey,
}: SyncStatusBadgeProps) {
  // If no status, render nothing (story not synced)
  if (!status) return null

  const config = STATUS_CONFIG[status as SyncStatus]
  if (!config) return null

  const formattedDate = lastSyncAt
    ? new Date(lastSyncAt).toLocaleString()
    : null

  const label =
    status === "SYNCED" && jiraIssueKey ? jiraIssueKey : config.label

  const badge = (
    <Badge
      variant={config.variant}
      className={cn("text-[12px]", config.className)}
    >
      {label}
    </Badge>
  )

  // Wrap in tooltip if we have a sync timestamp
  if (formattedDate) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>Last synced: {formattedDate}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return badge
}
