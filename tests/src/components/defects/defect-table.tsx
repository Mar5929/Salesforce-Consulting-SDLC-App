"use client"

/**
 * Defect Table View (D-07)
 *
 * Table view for defects with columns:
 * ID, Title, Severity, Status, Story, Assignee, Created.
 * Kebab menu per row: Edit, Change Status, Delete.
 */

import { format } from "date-fns"
import { MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DEFECT_STATUS_LABELS,
  getNextDefectStatuses,
} from "@/lib/defect-status-machine"
import type { DefectStatus, ProjectRole } from "@/generated/prisma"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface DefectRow {
  id: string
  displayId: string
  title: string
  severity: string
  status: string
  createdAt: string
  story: { id: string; displayId: string; title: string } | null
  assignee: { id: string; displayName: string } | null
  createdBy: { id: string; displayName: string } | null
}

interface DefectTableProps {
  defects: DefectRow[]
  onTransition: (id: string, status: string) => void
  onEdit: (defect: DefectRow) => void
  onDelete: (id: string) => void
  memberRole: string
}

// ────────────────────────────────────────────
// Badge styles
// ────────────────────────────────────────────

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

const STATUS_STYLES: Record<string, string> = {
  OPEN: "border-muted-foreground text-muted-foreground",
  ASSIGNED: "bg-[#2563EB] text-white border-[#2563EB]",
  FIXED: "bg-[#F59E0B] text-white border-[#F59E0B]",
  VERIFIED: "bg-[#16A34A] text-white border-[#16A34A]",
  CLOSED: "border-[#A3A3A3] text-[#A3A3A3]",
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function DefectTable({
  defects,
  onTransition,
  onEdit,
  onDelete,
  memberRole,
}: DefectTableProps) {
  return (
    <div className="rounded-lg border border-[#E5E5E5]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-[100px]">Severity</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[100px]">Story</TableHead>
            <TableHead className="w-[120px]">Assignee</TableHead>
            <TableHead className="w-[100px]">Created</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {defects.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-12 text-center text-[14px] text-[#737373]"
              >
                No defects match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            defects.map((defect) => {
              const nextStatuses = getNextDefectStatuses(
                defect.status as DefectStatus,
                memberRole as ProjectRole
              )

              return (
                <TableRow key={defect.id} className="hover:bg-[#FAFAFA]">
                  <TableCell>
                    <span className="font-mono text-[13px] text-[#737373]">
                      {defect.displayId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-[14px] font-medium text-left hover:text-[#2563EB] transition-colors"
                      onClick={() => onEdit(defect)}
                    >
                      {defect.title}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={defect.severity === "LOW" ? "outline" : "default"}
                      className={SEVERITY_STYLES[defect.severity]}
                    >
                      {SEVERITY_LABELS[defect.severity] ?? defect.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        defect.status === "OPEN" || defect.status === "CLOSED"
                          ? "outline"
                          : "default"
                      }
                      className={STATUS_STYLES[defect.status]}
                    >
                      {DEFECT_STATUS_LABELS[defect.status as DefectStatus] ??
                        defect.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {defect.story ? (
                      <span className="font-mono text-[13px] text-[#737373]">
                        {defect.story.displayId}
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">
                        --
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px]">
                      {defect.assignee?.displayName ?? (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px] text-[#737373]">
                      {format(new Date(defect.createdAt), "MMM d")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(defect)}>
                          Edit
                        </DropdownMenuItem>
                        {nextStatuses.length > 0 && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              Change Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {nextStatuses.map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => onTransition(defect.id, s)}
                                >
                                  {DEFECT_STATUS_LABELS[s]}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onDelete(defect.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
