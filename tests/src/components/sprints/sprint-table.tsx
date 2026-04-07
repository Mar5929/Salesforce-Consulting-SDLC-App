"use client"

/**
 * Sprint Table (D-14)
 *
 * Displays all sprints with status badge, dates, story count,
 * total points, and actions dropdown.
 * Rows clickable to navigate to sprint detail page.
 */

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface SprintRow {
  id: string
  name: string
  status: string
  startDate: string | Date
  endDate: string | Date
  goal: string | null
  stories: Array<{ storyPoints: number | null; status: string }>
}

interface SprintTableProps {
  sprints: SprintRow[]
  projectId: string
}

// ────────────────────────────────────────────
// Status badge styles
// ────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PLANNING: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  ACTIVE: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  COMPLETE: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
}

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  COMPLETE: "Complete",
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function SprintTable({ sprints, projectId }: SprintTableProps) {
  const router = useRouter()

  const columns = useMemo<ColumnDef<SprintRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="text-[14px] font-medium">{row.original.name}</span>
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
        size: 110,
      },
      {
        id: "startDate",
        header: "Start Date",
        cell: ({ row }) => (
          <span className="text-[13px] text-[#737373]">
            {format(new Date(row.original.startDate), "MMM d, yyyy")}
          </span>
        ),
        size: 130,
      },
      {
        id: "endDate",
        header: "End Date",
        cell: ({ row }) => (
          <span className="text-[13px] text-[#737373]">
            {format(new Date(row.original.endDate), "MMM d, yyyy")}
          </span>
        ),
        size: 130,
      },
      {
        id: "storyCount",
        header: "Stories",
        cell: ({ row }) => (
          <span className="text-[13px] text-[#737373]">
            {row.original.stories.length}
          </span>
        ),
        size: 80,
      },
      {
        id: "totalPoints",
        header: "Points",
        cell: ({ row }) => {
          const total = row.original.stories.reduce(
            (sum, s) => sum + (s.storyPoints ?? 0),
            0
          )
          return (
            <span className="text-[13px] text-[#737373]">
              {total}
            </span>
          )
        },
        size: 80,
      },
    ],
    []
  )

  const table = useReactTable({
    data: sprints,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
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
                No sprints yet. Create a sprint to start planning your work.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-[#FAFAFA]"
                onClick={() =>
                  router.push(`/projects/${projectId}/sprints/${row.original.id}`)
                }
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
  )
}
