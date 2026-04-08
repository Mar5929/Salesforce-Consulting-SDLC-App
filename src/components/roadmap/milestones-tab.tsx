"use client"

/**
 * Milestones Tab
 *
 * Table of milestones with progress bars, inline actions for edit/delete/link stories.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { format } from "date-fns"
import { Plus, Pencil, Trash2, Link2 } from "lucide-react"
import { MilestoneStatus, StoryStatus } from "@/generated/prisma"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { MilestoneForm } from "@/components/roadmap/milestone-form"
import { MilestoneStoryLinker } from "@/components/roadmap/milestone-story-linker"
import { deleteMilestone } from "@/actions/milestones"
import type { MilestoneData, StoryWithEpic } from "@/app/(dashboard)/projects/[projectId]/roadmap/roadmap-page-client"

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function computeProgress(stories: { status: string }[]): number {
  if (stories.length === 0) return 0
  const done = stories.filter((s) => s.status === StoryStatus.DONE).length
  return Math.round((done / stories.length) * 100)
}

function progressColor(pct: number): string {
  if (pct >= 75) return "bg-green-500"
  if (pct >= 25) return "bg-yellow-500"
  return "bg-red-500"
}

function statusBadgeVariant(status: MilestoneStatus): string {
  switch (status) {
    case MilestoneStatus.NOT_STARTED:
      return "secondary"
    case MilestoneStatus.IN_PROGRESS:
      return "default"
    case MilestoneStatus.COMPLETE:
      return "default"
    default:
      return "secondary"
  }
}

function statusBadgeClass(status: MilestoneStatus): string {
  switch (status) {
    case MilestoneStatus.IN_PROGRESS:
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    case MilestoneStatus.COMPLETE:
      return "bg-green-100 text-green-800 hover:bg-green-100"
    default:
      return ""
  }
}

function statusLabel(status: MilestoneStatus): string {
  switch (status) {
    case MilestoneStatus.NOT_STARTED:
      return "Not Started"
    case MilestoneStatus.IN_PROGRESS:
      return "In Progress"
    case MilestoneStatus.COMPLETE:
      return "Complete"
    default:
      return status
  }
}

// ────────────────────────────────────────────
// Props
// ────────────────────────────────────────────

interface MilestonesTabProps {
  projectId: string
  milestones: MilestoneData[]
  stories: StoryWithEpic[]
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function MilestonesTab({
  projectId,
  milestones,
  stories,
}: MilestonesTabProps) {
  const router = useRouter()

  // Form sheet state
  const [formOpen, setFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<MilestoneData | null>(null)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<MilestoneData | null>(null)

  // Story linker state
  const [linkerOpen, setLinkerOpen] = useState(false)
  const [linkerMilestone, setLinkerMilestone] = useState<MilestoneData | null>(null)

  const { execute: executeDelete } = useAction(deleteMilestone, {
    onSuccess: () => {
      toast.success("Milestone deleted")
      setDeleteTarget(null)
      router.refresh()
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to delete milestone"),
  })

  function handleEdit(milestone: MilestoneData) {
    setEditingMilestone(milestone)
    setFormOpen(true)
  }

  function handleCreate() {
    setEditingMilestone(null)
    setFormOpen(true)
  }

  function handleLinkStories(milestone: MilestoneData) {
    setLinkerMilestone(milestone)
    setLinkerOpen(true)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    executeDelete({ projectId, milestoneId: deleteTarget.id })
  }

  if (milestones.length === 0) {
    return (
      <>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Milestone
          </Button>
        </div>
        <EmptyState
          heading="No milestones yet"
          description="Create your first milestone to start tracking project delivery goals."
        />
        <MilestoneForm
          projectId={projectId}
          open={formOpen}
          onOpenChange={setFormOpen}
          milestone={editingMilestone}
        />
      </>
    )
  }

  return (
    <>
      {/* Header with create button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={handleCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Milestone
        </Button>
      </div>

      {/* Milestones table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Target Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-center">Stories</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {milestones.map((milestone) => {
              const msStories = milestone.milestoneStories.map((ms) => ms.story)
              const progress = computeProgress(msStories)

              return (
                <TableRow key={milestone.id}>
                  {/* Name */}
                  <TableCell className="font-medium">
                    {milestone.name}
                  </TableCell>

                  {/* Target Date */}
                  <TableCell>
                    {milestone.targetDate
                      ? format(new Date(milestone.targetDate), "MMM d, yyyy")
                      : "TBD"}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={statusBadgeVariant(milestone.status) as "default" | "secondary"}
                      className={statusBadgeClass(milestone.status)}
                    >
                      {statusLabel(milestone.status)}
                    </Badge>
                  </TableCell>

                  {/* Progress */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            progressColor(progress),
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                  </TableCell>

                  {/* Stories count */}
                  <TableCell className="text-center">
                    {msStories.length}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleLinkStories(milestone)}
                        title="Link Stories"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(milestone)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(milestone)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit sheet */}
      <MilestoneForm
        projectId={projectId}
        open={formOpen}
        onOpenChange={setFormOpen}
        milestone={editingMilestone}
      />

      {/* Story linker dialog */}
      {linkerMilestone && (
        <MilestoneStoryLinker
          projectId={projectId}
          milestoneId={linkerMilestone.id}
          open={linkerOpen}
          onOpenChange={setLinkerOpen}
          allStories={stories}
          linkedStoryIds={linkerMilestone.milestoneStories.map(
            (ms) => ms.story.id,
          )}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}
              &rdquo;? This will unlink all associated stories. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
