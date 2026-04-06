"use client"

/**
 * Feature Table View
 *
 * Table view for features within an epic.
 * Columns: prefix, name, status badge, stories count, actions.
 * Rows clickable to navigate to feature's stories.
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
import { deleteFeature } from "@/actions/features"
import { FeatureForm } from "./feature-form"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface FeatureRow {
  id: string
  name: string
  prefix: string
  description: string | null
  status: string
  _count: { stories: number }
}

interface FeatureTableProps {
  features: FeatureRow[]
  projectId: string
  epicId: string
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

export function FeatureTable({ features, projectId, epicId }: FeatureTableProps) {
  const router = useRouter()

  const { execute: executeDelete } = useAction(deleteFeature, {
    onSuccess: () => {
      toast.success("Feature deleted")
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to delete feature")
    },
  })

  function handleRowClick(featureId: string) {
    router.push(`/projects/${projectId}/work/${epicId}/${featureId}`)
  }

  function handleDelete(featureId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm("Delete this feature? All stories will be removed.")) {
      executeDelete({ projectId, featureId })
    }
  }

  return (
    <div className="rounded-lg border border-[#E5E5E5]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Prefix</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px] text-center">Stories</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-12 text-center text-[14px] text-[#737373]"
              >
                No features yet. Create your first feature to break down this epic.
              </TableCell>
            </TableRow>
          ) : (
            features.map((feature) => (
              <TableRow
                key={feature.id}
                className="cursor-pointer hover:bg-[#FAFAFA]"
                onClick={() => handleRowClick(feature.id)}
              >
                <TableCell className="font-mono text-[13px] font-medium text-[#737373]">
                  {feature.prefix}
                </TableCell>
                <TableCell className="text-[14px] font-medium">
                  {feature.name}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("text-[12px]", STATUS_STYLES[feature.status])}
                  >
                    {STATUS_LABELS[feature.status] ?? feature.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-[13px] text-[#737373]">
                  {feature._count.stories}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <FeatureForm
                        projectId={projectId}
                        epicId={epicId}
                        feature={feature}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => handleDelete(feature.id, e as unknown as React.MouseEvent)}
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
