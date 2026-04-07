"use client"

/**
 * Epic Table View
 *
 * Table view for the epics list using shadcn Table.
 * Columns: prefix, name, status badge, features count, stories count, actions.
 * Rows are clickable to drill down into epic detail.
 */

import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { deleteEpic } from "@/actions/epics"
import { EpicForm } from "./epic-form"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface EpicRow {
  id: string
  name: string
  prefix: string
  description: string | null
  status: string
  _count: { features: number; stories: number }
}

interface EpicTableProps {
  epics: EpicRow[]
  projectId: string
}

// ────────────────────────────────────────────
// Status badge colors
// ────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
  IN_PROGRESS: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  COMPLETE: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
}

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function EpicTable({ epics, projectId }: EpicTableProps) {
  const router = useRouter()

  const { execute: executeDelete } = useAction(deleteEpic, {
    onSuccess: () => {
      toast.success("Epic deleted")
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to delete epic")
    },
  })

  function handleRowClick(epicId: string) {
    router.push(`/projects/${projectId}/work/${epicId}`)
  }

  function handleDelete(epicId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm("Delete this epic? All features and stories will be removed.")) {
      executeDelete({ projectId, epicId })
    }
  }

  return (
    <div className="rounded-lg border border-[#E5E5E5]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Prefix</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px] text-center">Features</TableHead>
            <TableHead className="w-[100px] text-center">Stories</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {epics.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-12 text-center text-[14px] text-[#737373]"
              >
                No epics yet. Create your first epic to start organizing work.
              </TableCell>
            </TableRow>
          ) : (
            epics.map((epic) => (
              <TableRow
                key={epic.id}
                className="cursor-pointer hover:bg-[#FAFAFA]"
                onClick={() => handleRowClick(epic.id)}
              >
                <TableCell className="font-mono text-[13px] font-medium text-[#737373]">
                  {epic.prefix}
                </TableCell>
                <TableCell className="text-[14px] font-medium">
                  {epic.name}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("text-[12px]", STATUS_STYLES[epic.status])}
                  >
                    {STATUS_LABELS[epic.status] ?? epic.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-[13px] text-[#737373]">
                  {epic._count.features}
                </TableCell>
                <TableCell className="text-center text-[13px] text-[#737373]">
                  {epic._count.stories}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <EpicForm
                        projectId={projectId}
                        epic={epic}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => handleDelete(epic.id, e as unknown as React.MouseEvent)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
