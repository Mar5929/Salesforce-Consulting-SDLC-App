"use client"

/**
 * Defect Kanban View (D-08)
 *
 * 5 columns: Open, In Progress, Fixed, Verified, Closed.
 * Cards show: displayId, title, severity badge, assignee, linked story.
 * Cards not draggable in V1 -- status transitions via kebab menu.
 */

import { MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DEFECT_STATUS_LABELS,
  getNextDefectStatuses,
} from "@/lib/defect-status-machine"
import type { DefectStatus, ProjectRole } from "@/generated/prisma"
import type { DefectRow } from "@/components/defects/defect-table"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface DefectKanbanProps {
  defects: DefectRow[]
  onTransition: (id: string, status: string) => void
  onEdit: (defect: DefectRow) => void
  memberRole: string
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const KANBAN_COLUMNS: DefectStatus[] = [
  "OPEN",
  "ASSIGNED",
  "FIXED",
  "VERIFIED",
  "CLOSED",
]

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-[#EF4444] text-white border-[#EF4444]",
  HIGH: "bg-[#F97316] text-white border-[#F97316]",
  MEDIUM: "bg-[#F59E0B] text-white border-[#F59E0B]",
  LOW: "border-muted-foreground text-muted-foreground",
}

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function DefectKanban({
  defects,
  onTransition,
  onEdit,
  memberRole,
}: DefectKanbanProps) {
  const grouped = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = defects.filter((d) => d.status === status)
      return acc
    },
    {} as Record<DefectStatus, DefectRow[]>
  )

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((status) => {
        const column = grouped[status]
        return (
          <div
            key={status}
            className="flex-shrink-0 w-[260px] flex flex-col gap-2"
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-foreground">
                  {DEFECT_STATUS_LABELS[status]}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {column.length}
                </span>
              </div>
            </div>

            {/* Column body */}
            <div className="flex flex-col gap-2 min-h-[100px] rounded-lg bg-[#FAFAFA] p-2">
              {column.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-[13px] text-muted-foreground">
                  No defects
                </div>
              ) : (
                column.map((defect) => {
                  const nextStatuses = getNextDefectStatuses(
                    defect.status as DefectStatus,
                    memberRole as ProjectRole
                  )

                  return (
                    <div
                      key={defect.id}
                      className="rounded-lg border border-[#E5E5E5] bg-white p-3 flex flex-col gap-2"
                    >
                      {/* Header: displayId + kebab */}
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-[12px] text-[#737373]">
                          {defect.displayId}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(defect)}>
                              Edit
                            </DropdownMenuItem>
                            {nextStatuses.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => onTransition(defect.id, s)}
                              >
                                Move to {DEFECT_STATUS_LABELS[s]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Title */}
                      <button
                        type="button"
                        className="text-[14px] font-normal text-foreground text-left hover:text-[#2563EB] transition-colors line-clamp-2"
                        onClick={() => onEdit(defect)}
                      >
                        {defect.title}
                      </button>

                      {/* Footer: severity + assignee + story */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={defect.severity === "LOW" ? "outline" : "default"}
                          className={`text-[11px] ${SEVERITY_STYLES[defect.severity]}`}
                        >
                          {SEVERITY_LABELS[defect.severity] ?? defect.severity}
                        </Badge>
                        {defect.assignee && (
                          <span className="text-[12px] text-muted-foreground">
                            {defect.assignee.displayName}
                          </span>
                        )}
                        {defect.story && (
                          <span className="font-mono text-[11px] text-[#737373]">
                            {defect.story.displayId}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
