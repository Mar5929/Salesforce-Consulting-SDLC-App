"use client"

/**
 * View Toggle (D-01)
 *
 * Shared table/kanban toggle using nuqs for URL persistence.
 * Reusable across work hierarchy pages.
 */

import { useQueryState, parseAsString } from "nuqs"
import { LayoutList, Kanban } from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewMode = "table" | "kanban"

interface ViewToggleProps {
  className?: string
}

export function useViewMode() {
  const [view, setView] = useQueryState(
    "view",
    parseAsString.withDefault("table")
  )
  return {
    viewMode: (view === "kanban" ? "kanban" : "table") as ViewMode,
    setViewMode: setView,
  }
}

export function ViewToggle({ className }: ViewToggleProps) {
  const { viewMode, setViewMode } = useViewMode()

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border border-[#E5E5E5]",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setViewMode("table")}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-l-lg px-3 text-[13px] transition-colors",
          viewMode === "table"
            ? "bg-[#2563EB] text-white"
            : "text-[#737373] hover:bg-[#F0F0F0]"
        )}
      >
        <LayoutList className="h-3.5 w-3.5" />
        Table
      </button>
      <button
        type="button"
        onClick={() => setViewMode("kanban")}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-r-lg px-3 text-[13px] transition-colors",
          viewMode === "kanban"
            ? "bg-[#2563EB] text-white"
            : "text-[#737373] hover:bg-[#F0F0F0]"
        )}
      >
        <Kanban className="h-3.5 w-3.5" />
        Kanban
      </button>
    </div>
  )
}
