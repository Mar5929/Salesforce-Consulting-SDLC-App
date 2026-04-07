"use client"

/**
 * Story Table with Bulk Actions (D-03, D-04)
 *
 * Table view for stories with all D-03 columns:
 * checkbox, displayId, title, status, priority, assignee, storyPoints, feature, sprint.
 *
 * Bulk action toolbar (D-04) appears when rows selected:
 * Change Status, Assign Sprint, Change Assignee.
 *
 * Uses @tanstack/react-table for selection tracking.
 */

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { SyncStatusBadge } from "@/components/jira/sync-status-badge"
import { updateStoryStatus, updateStory } from "@/actions/stories"
import { assignStoriesToSprint } from "@/actions/sprints"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface StoryRow {
  id: string
  displayId: string
  title: string
  status: string
  priority: string
  storyPoints: number | null
  defectCount?: number
  jiraSyncStatus?: { status: string; lastSyncAt: Date | null; jiraIssueKey: string | null } | null
  assignee?: { id: string; displayName: string; email: string } | null
  feature?: { id: string; name: string; prefix: string } | null
  sprint?: { id: string; name: string } | null
  storyComponents?: Array<{
    id: string
    componentName: string
    impactType: string
  }>
}

interface StoryTableProps {
  stories: StoryRow[]
  projectId: string
  epicId?: string
  featureId?: string
  onRowClick?: (storyId: string) => void
  sprints?: Array<{ id: string; name: string }>
  members?: Array<{ id: string; displayName: string; email: string }>
  hasJiraConfig?: boolean
}

// ────────────────────────────────────────────
// Status & priority badge styles
// ────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
  READY: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  SPRINT_PLANNED: "bg-[#F5F3FF] text-[#8B5CF6] border-[#DDD6FE]",
  IN_PROGRESS: "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]",
  IN_REVIEW: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",
  QA: "bg-[#FDF2F8] text-[#EC4899] border-[#FBCFE8]",
  DONE: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  SPRINT_PLANNED: "Sprint Planned",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  QA: "QA",
  DONE: "Done",
}

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  HIGH: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",
  MEDIUM: "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]",
  LOW: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
}

const ALL_STATUSES = [
  "DRAFT",
  "READY",
  "SPRINT_PLANNED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "QA",
  "DONE",
] as const

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function StoryTable({
  stories,
  projectId,
  epicId,
  featureId,
  onRowClick,
  sprints = [],
  members = [],
  hasJiraConfig = false,
}: StoryTableProps) {
  const router = useRouter()
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const { execute: executeStatusChange } = useAction(updateStoryStatus, {
    onSuccess: () => toast.success("Status updated"),
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update status"),
  })

  const { execute: executeUpdate } = useAction(updateStory, {
    onSuccess: () => toast.success("Story updated"),
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update story"),
  })

  const { execute: executeSprintAssign } = useAction(assignStoriesToSprint, {
    onSuccess: () => {
      toast.success("Stories assigned to sprint")
      setRowSelection({})
      router.refresh()
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to assign stories to sprint"),
  })

  // ── Column definitions ──

  const columns = useMemo<ColumnDef<StoryRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: "displayId",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-[13px] text-[#737373]">
            {row.original.displayId}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="text-[14px] font-medium">{row.original.title}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("text-[12px]", STATUS_STYLES[row.original.status])}
          >
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
        ),
        size: 130,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("text-[12px]", PRIORITY_STYLES[row.original.priority])}
          >
            {row.original.priority}
          </Badge>
        ),
        size: 100,
      },
      {
        id: "assignee",
        header: "Assignee",
        cell: ({ row }) =>
          row.original.assignee ? (
            <span className="text-[13px]">
              {row.original.assignee.displayName || row.original.assignee.email}
            </span>
          ) : (
            <span className="text-[13px] text-muted-foreground">Unassigned</span>
          ),
        size: 140,
      },
      {
        accessorKey: "storyPoints",
        header: "Points",
        cell: ({ row }) => (
          <span className="text-[13px] text-[#737373]">
            {row.original.storyPoints ?? "-"}
          </span>
        ),
        size: 70,
      },
      {
        id: "feature",
        header: "Feature",
        cell: ({ row }) =>
          row.original.feature ? (
            <span className="text-[13px]">{row.original.feature.name}</span>
          ) : (
            <span className="text-[13px] text-muted-foreground">-</span>
          ),
        size: 140,
      },
      {
        id: "sprint",
        header: "Sprint",
        cell: ({ row }) =>
          row.original.sprint ? (
            <span className="text-[13px]">{row.original.sprint.name}</span>
          ) : (
            <span className="text-[13px] text-muted-foreground">Unassigned</span>
          ),
        size: 120,
      },
      {
        id: "defects",
        header: "Defects",
        cell: ({ row }) =>
          row.original.defectCount && row.original.defectCount > 0 ? (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-600 border-red-200 text-[12px]"
            >
              {row.original.defectCount}
            </Badge>
          ) : null,
        size: 80,
      },
      // Jira column -- only included when project has Jira config (per D-17)
      ...(hasJiraConfig
        ? [
            {
              id: "jira" as const,
              header: "Jira",
              cell: ({ row }: { row: { original: StoryRow } }) => (
                <SyncStatusBadge
                  status={row.original.jiraSyncStatus?.status}
                  lastSyncAt={row.original.jiraSyncStatus?.lastSyncAt}
                  jiraIssueKey={row.original.jiraSyncStatus?.jiraIssueKey}
                />
              ),
              size: 100,
            },
          ]
        : []),
    ],
    [hasJiraConfig]
  )

  const table = useReactTable({
    data: stories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    getRowId: (row) => row.id,
  })

  const selectedRows = table.getSelectedRowModel().rows
  const selectedCount = selectedRows.length

  // ── Bulk actions ──

  async function handleBulkStatusChange(status: string) {
    const promises = selectedRows.map((row) =>
      executeStatusChange({
        projectId,
        storyId: row.original.id,
        status: status as typeof ALL_STATUSES[number],
      })
    )
    await Promise.allSettled(promises)
    setRowSelection({})
    router.refresh()
  }

  async function handleBulkSprintAssign(sprintId: string) {
    const selectedIds = selectedRows.map((row) => row.original.id)
    executeSprintAssign({ projectId, sprintId, storyIds: selectedIds })
  }

  async function handleBulkAssigneeChange(assigneeId: string) {
    for (const row of selectedRows) {
      executeUpdate({
        projectId,
        storyId: row.original.id,
        assigneeId,
      })
    }
    setRowSelection({})
    router.refresh()
  }

  function handleRowClick(storyId: string) {
    if (epicId && featureId) {
      router.push(`/projects/${projectId}/work/${epicId}/${featureId}/stories/${storyId}`)
      return
    }
    if (onRowClick) {
      onRowClick(storyId)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk action toolbar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[#2563EB] bg-[#EFF6FF] px-4 py-2">
          <span className="text-[13px] font-medium text-[#2563EB]">
            {selectedCount} selected
          </span>

          <Select onValueChange={(v: string | null) => v && handleBulkStatusChange(v)}>
            <SelectTrigger className="h-8 w-[150px] text-[13px]">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {sprints.length > 0 && (
            <Select onValueChange={(v: string | null) => v && handleBulkSprintAssign(v)}>
              <SelectTrigger className="h-8 w-[150px] text-[13px]">
                <SelectValue placeholder="Assign Sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {members.length > 0 && (
            <Select onValueChange={(v: string | null) => v && handleBulkAssigneeChange(v)}>
              <SelectTrigger className="h-8 w-[150px] text-[13px]">
                <SelectValue placeholder="Change Assignee" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.displayName || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-[#E5E5E5]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-[14px] text-[#737373]"
                >
                  No stories yet. Create your first story to start building.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-[#FAFAFA]"
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleRowClick(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
