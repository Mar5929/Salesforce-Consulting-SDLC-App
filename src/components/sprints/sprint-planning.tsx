"use client"

/**
 * Sprint Planning Split View (D-11)
 *
 * Two-panel layout for sprint planning:
 * - Left: Backlog (unassigned stories)
 * - Right: Sprint stories
 *
 * Supports native HTML drag-and-drop and multi-select bulk actions.
 * Drag from backlog to sprint to assign, or use "Move to Sprint" button.
 */

import { useState, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { assignStoriesToSprint, removeStoriesFromSprint } from "@/actions/sprints"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface PlanningStory {
  id: string
  displayId: string
  title: string
  status: string
  priority: string
  storyPoints: number | null
  feature?: { id: string; name: string; prefix: string } | null
  assignee?: { id: string; displayName: string; email: string } | null
}

interface SprintPlanningProps {
  projectId: string
  sprintId: string
  sprintName: string
  backlogStories: PlanningStory[]
  sprintStories: PlanningStory[]
}

// ────────────────────────────────────────────
// Badge styles
// ────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  HIGH: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",
  MEDIUM: "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]",
  LOW: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
}

// ────────────────────────────────────────────
// Story Card
// ────────────────────────────────────────────

function StoryCard({
  story,
  selected,
  onSelect,
  draggable: isDraggable,
  onDragStart,
}: {
  story: PlanningStory
  selected: boolean
  onSelect: (checked: boolean) => void
  draggable: boolean
  onDragStart?: (e: DragEvent) => void
}) {
  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-[#E5E5E5] bg-white p-3 transition-colors",
        isDraggable && "cursor-grab active:cursor-grabbing",
        selected && "border-[#2563EB] bg-[#EFF6FF]"
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(value) => onSelect(!!value)}
        aria-label={`Select ${story.displayId}`}
        className="mt-0.5"
      />
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] text-[#737373]">
            {story.displayId}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[11px]", PRIORITY_STYLES[story.priority])}
          >
            {story.priority}
          </Badge>
          {story.storyPoints !== null && (
            <span className="ml-auto rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[11px] font-medium text-[#737373]">
              {story.storyPoints} pts
            </span>
          )}
        </div>
        <span className="text-[13px] font-medium leading-tight">
          {story.title}
        </span>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function SprintPlanning({
  projectId,
  sprintId,
  sprintName,
  backlogStories,
  sprintStories,
}: SprintPlanningProps) {
  const router = useRouter()
  const [backlogSelection, setBacklogSelection] = useState<Set<string>>(new Set())
  const [sprintSelection, setSprintSelection] = useState<Set<string>>(new Set())
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragOverBacklog, setIsDragOverBacklog] = useState(false)

  const { execute: executeAssign, isPending: isAssigning } = useAction(
    assignStoriesToSprint,
    {
      onSuccess: () => {
        toast.success("Stories assigned to sprint")
        setBacklogSelection(new Set())
        router.refresh()
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? "Failed to assign stories"),
    }
  )

  const { execute: executeRemove, isPending: isRemoving } = useAction(
    removeStoriesFromSprint,
    {
      onSuccess: () => {
        toast.success("Stories removed from sprint")
        setSprintSelection(new Set())
        router.refresh()
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? "Failed to remove stories"),
    }
  )

  // ── Selection helpers ──

  function toggleBacklogSelect(storyId: string, checked: boolean) {
    setBacklogSelection((prev) => {
      const next = new Set(prev)
      if (checked) next.add(storyId)
      else next.delete(storyId)
      return next
    })
  }

  function toggleSprintSelect(storyId: string, checked: boolean) {
    setSprintSelection((prev) => {
      const next = new Set(prev)
      if (checked) next.add(storyId)
      else next.delete(storyId)
      return next
    })
  }

  // ── Drag-and-drop handlers ──

  function handleDragStart(e: DragEvent, storyId: string) {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", storyId)
  }

  function handleDragOverSprint(e: DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setIsDragOver(true)
  }

  function handleDragLeaveSprint() {
    setIsDragOver(false)
  }

  function handleDropOnSprint(e: DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const storyId = e.dataTransfer.getData("text/plain")
    if (storyId) {
      executeAssign({ projectId, sprintId, storyIds: [storyId] })
    }
  }

  function handleDragOverBacklog(e: DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setIsDragOverBacklog(true)
  }

  function handleDragLeaveBacklog() {
    setIsDragOverBacklog(false)
  }

  function handleDropOnBacklog(e: DragEvent) {
    e.preventDefault()
    setIsDragOverBacklog(false)
    const storyId = e.dataTransfer.getData("text/plain")
    if (storyId) {
      executeRemove({ projectId, storyIds: [storyId] })
    }
  }

  // ── Bulk actions ──

  function handleMoveToSprint() {
    const ids = Array.from(backlogSelection)
    if (ids.length > 0) {
      executeAssign({ projectId, sprintId, storyIds: ids })
    }
  }

  function handleRemoveFromSprint() {
    const ids = Array.from(sprintSelection)
    if (ids.length > 0) {
      executeRemove({ projectId, storyIds: ids })
    }
  }

  // ── Computed values ──

  const sprintTotalPoints = sprintStories.reduce(
    (sum, s) => sum + (s.storyPoints ?? 0),
    0
  )

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left panel - Backlog */}
      <Card
        onDragOver={handleDragOverBacklog}
        onDragLeave={handleDragLeaveBacklog}
        onDrop={handleDropOnBacklog}
        className={cn(
          "flex flex-col",
          isDragOverBacklog && "border-2 border-dashed border-primary"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[16px]">
              Backlog
              <span className="ml-2 text-[13px] font-normal text-[#737373]">
                ({backlogStories.length})
              </span>
            </CardTitle>
            {backlogSelection.size > 0 && (
              <Button
                size="sm"
                onClick={handleMoveToSprint}
                disabled={isAssigning}
              >
                Move to Sprint ({backlogSelection.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
          {backlogStories.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#737373]">
              No unassigned stories in the backlog.
            </p>
          ) : (
            backlogStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                selected={backlogSelection.has(story.id)}
                onSelect={(checked) => toggleBacklogSelect(story.id, checked)}
                draggable
                onDragStart={(e) => handleDragStart(e, story.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Right panel - Sprint */}
      <Card
        onDragOver={handleDragOverSprint}
        onDragLeave={handleDragLeaveSprint}
        onDrop={handleDropOnSprint}
        className={cn(
          "flex flex-col",
          isDragOver && "border-2 border-dashed border-primary"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[16px]">
              {sprintName}
              <span className="ml-2 text-[13px] font-normal text-[#737373]">
                ({sprintStories.length} stories, {sprintTotalPoints} pts)
              </span>
            </CardTitle>
            {sprintSelection.size > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemoveFromSprint}
                disabled={isRemoving}
              >
                Remove from Sprint ({sprintSelection.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
          {sprintStories.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#737373]">
              Drag stories here or select and click &quot;Move to Sprint&quot;.
            </p>
          ) : (
            sprintStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                selected={sprintSelection.has(story.id)}
                onSelect={(checked) => toggleSprintSelect(story.id, checked)}
                draggable
                onDragStart={(e) => handleDragStart(e, story.id)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
