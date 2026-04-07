"use client"

/**
 * Sprint Board (D-12)
 *
 * Kanban board with columns by StoryStatus for sprint stories.
 * Cards show displayId, title, assignee, points, priority.
 * Native HTML drag-and-drop triggers status transitions validated server-side.
 *
 * Each StoryStatus maps 1:1 to a board column — no grouping.
 */

import { useState, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { updateStoryStatus } from "@/actions/stories"
import { canTransition, getAvailableTransitions } from "@/lib/story-status-machine"
import type { ProjectRole, StoryStatus } from "@/generated/prisma"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface BoardStory {
  id: string
  displayId: string
  title: string
  status: string
  priority: string
  storyPoints: number | null
  feature?: { id: string; name: string; prefix: string } | null
  assignee?: { id: string; displayName: string; email: string } | null
}

interface SprintBoardProps {
  stories: BoardStory[]
  projectId: string
  userRole: ProjectRole
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

/** Board columns in display order */
const COLUMNS = [
  { key: "DRAFT", label: "Draft" },
  { key: "READY", label: "Ready" },
  { key: "SPRINT_PLANNED", label: "Sprint Planned" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "QA", label: "QA" },
  { key: "DONE", label: "Done" },
] as const

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  HIGH: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",
  MEDIUM: "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]",
  LOW: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

/** Map story status to board column key. 1:1 mapping. */
function statusToColumn(status: string): string {
  return status
}

/** Map column key back to the StoryStatus value for transitions. */
function columnToStatus(columnKey: string): string {
  return columnKey
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ────────────────────────────────────────────
// Board Card
// ────────────────────────────────────────────

function BoardCard({
  story,
  onDragStart,
  isDraggable,
}: {
  story: BoardStory
  onDragStart: (e: DragEvent) => void
  isDraggable: boolean
}) {
  return (
    <div
      draggable={isDraggable}
      onDragStart={isDraggable ? onDragStart : undefined}
      className={cn(
        "rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
        isDraggable
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-default opacity-80"
      )}
    >
      {/* Display ID */}
      <span className="font-mono text-[12px] text-[#737373]">
        {story.displayId}
      </span>

      {/* Title — truncated to 2 lines */}
      <p className="mt-1 line-clamp-2 text-[13px] font-normal leading-tight text-[#171717]">
        {story.title}
      </p>

      {/* Bottom row: assignee + points + priority */}
      <div className="mt-2 flex items-center gap-2">
        {/* Assignee avatar */}
        {story.assignee && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E5E5E5] text-[10px] font-medium text-[#525252]"
            title={story.assignee.displayName}
          >
            {getInitials(story.assignee.displayName)}
          </div>
        )}

        {/* Spacer to push badges right */}
        <div className="flex-1" />

        {/* Story points */}
        {story.storyPoints != null && (
          <Badge
            variant="outline"
            className="border-[#E5E5E5] text-[11px] font-medium"
          >
            {story.storyPoints} pts
          </Badge>
        )}

        {/* Priority */}
        <Badge
          variant="outline"
          className={cn("text-[11px]", PRIORITY_STYLES[story.priority])}
        >
          {PRIORITY_LABELS[story.priority] ?? story.priority}
        </Badge>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// Board Column
// ────────────────────────────────────────────

function BoardColumn({
  columnKey,
  label,
  stories,
  onDrop,
  userRole,
}: {
  columnKey: string
  label: string
  stories: BoardStory[]
  onDrop: (storyId: string, currentStatus: string, targetColumn: string) => void
  userRole: ProjectRole
}) {
  const [dragOver, setDragOver] = useState(false)

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    try {
      const data = JSON.parse(
        e.dataTransfer.getData("application/json")
      ) as { storyId: string; currentStatus: string }
      onDrop(data.storyId, data.currentStatus, columnKey)
    } catch {
      // Ignore invalid drag data
    }
  }

  return (
    <div
      className={cn(
        "flex min-w-[200px] flex-1 flex-col rounded-lg bg-[#FAFAFA] p-2",
        dragOver && "border-2 border-dashed border-[#2563EB] bg-[#EFF6FF]"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[13px] font-medium text-[#525252]">{label}</span>
        <span className="rounded-full bg-[#E5E5E5] px-2 py-0.5 text-[11px] font-medium text-[#737373]">
          {stories.length}
        </span>
      </div>

      {/* Story cards */}
      <div className="flex flex-col gap-2">
        {stories.map((story) => (
          <BoardCard
            key={story.id}
            story={story}
            isDraggable={getAvailableTransitions(story.status as StoryStatus, userRole).length > 0}
            onDragStart={(e) => {
              e.dataTransfer.setData(
                "application/json",
                JSON.stringify({
                  storyId: story.id,
                  currentStatus: story.status,
                })
              )
              e.dataTransfer.effectAllowed = "move"
            }}
          />
        ))}

        {stories.length === 0 && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-[#E5E5E5] py-8 text-[12px] text-[#A3A3A3]">
            No stories
          </div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// Sprint Board
// ────────────────────────────────────────────

export function SprintBoard({ stories, projectId, userRole }: SprintBoardProps) {
  const router = useRouter()

  const { execute: executeUpdateStatus } = useAction(updateStoryStatus, {
    onSuccess: () => {
      router.refresh()
    },
    onError: (error) => {
      toast.error(
        error.error?.serverError ?? "Invalid status transition"
      )
    },
  })

  // Group stories by column
  const columnStories = new Map<string, BoardStory[]>()
  for (const col of COLUMNS) {
    columnStories.set(col.key, [])
  }
  for (const story of stories) {
    const col = statusToColumn(story.status)
    const list = columnStories.get(col)
    if (list) {
      list.push(story)
    }
  }

  function handleDrop(
    storyId: string,
    currentStatus: string,
    targetColumn: string
  ) {
    const targetStatus = columnToStatus(targetColumn)
    // Don't do anything if dropped on same column
    if (statusToColumn(currentStatus) === targetColumn) return

    // Client-side role-based transition check
    if (!canTransition(currentStatus as StoryStatus, targetStatus as StoryStatus, userRole)) {
      toast.error(
        `Your role (${userRole.replace("_", " ")}) cannot move stories from ${currentStatus.replace(/_/g, " ")} to ${targetStatus.replace(/_/g, " ")}.`
      )
      return
    }

    executeUpdateStatus({
      projectId,
      storyId,
      status: targetStatus as Parameters<typeof executeUpdateStatus>[0]["status"],
    })
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map((col) => (
        <BoardColumn
          key={col.key}
          columnKey={col.key}
          label={col.label}
          stories={columnStories.get(col.key) ?? []}
          onDrop={handleDrop}
          userRole={userRole}
        />
      ))}
    </div>
  )
}
