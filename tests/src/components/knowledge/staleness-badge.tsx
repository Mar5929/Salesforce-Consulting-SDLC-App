"use client"

/**
 * Staleness Badge Component
 *
 * Color-coded pill badge indicating article freshness:
 * - Fresh (green): Not stale, refreshed within 24h
 * - Aging (amber): Stale but within 48h grace period
 * - Stale (red): Stale past grace period
 *
 * Architecture: D-16
 */

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { formatDistanceToNow } from "date-fns"

interface StalenessBadgeProps {
  isStale: boolean
  staleSince: Date | string | null
  lastRefreshedAt: Date | string | null
}

type StalenessLevel = "fresh" | "aging" | "stale"

const AGING_THRESHOLD_MS = 48 * 60 * 60 * 1000 // 48 hours

function getStalenessLevel(
  isStale: boolean,
  staleSince: Date | null
): StalenessLevel {
  if (!isStale) return "fresh"

  if (staleSince) {
    const elapsed = Date.now() - new Date(staleSince).getTime()
    if (elapsed < AGING_THRESHOLD_MS) return "aging"
  }

  return "stale"
}

const BADGE_STYLES: Record<StalenessLevel, { bg: string; label: string }> = {
  fresh: { bg: "bg-[#22C55E]", label: "Fresh" },
  aging: { bg: "bg-[#F59E0B]", label: "Aging" },
  stale: { bg: "bg-[#EF4444]", label: "Stale" },
}

export function StalenessBadge({
  isStale,
  staleSince,
  lastRefreshedAt,
}: StalenessBadgeProps) {
  const staleSinceDate = staleSince ? new Date(staleSince) : null
  const lastRefreshedDate = lastRefreshedAt ? new Date(lastRefreshedAt) : null

  const level = getStalenessLevel(isStale, staleSinceDate)
  const style = BADGE_STYLES[level]

  const tooltipText = lastRefreshedDate
    ? `Last refreshed: ${formatDistanceToNow(lastRefreshedDate, { addSuffix: true })}`
    : "Never refreshed"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[13px] font-semibold text-white ${style.bg}`}
          >
            {style.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
