"use client"

/**
 * Story Kanban View (D-01)
 *
 * Kanban board with columns by StoryStatus.
 * Cards show: displayId, title, priority badge, assignee, story points.
 * Drag-and-drop between columns to change status via server action.
 *
 * Follows same pattern as question-kanban.tsx.
 */

import { useState, type DragEvent } from "react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { updateStoryStatus } from "@/actions/stories"
import type { StoryRow } from "./story-table"

// ────────────────────────────────────────────
// Column definitions
// ────────────────────────────────────────────

const COLUMNS = [
  { id: "DRAFT", label: "Draft", color: "border-[#737373]" },
  { id: "READY", label: "Ready", color: "border-[#2563EB]" },
  { id: "SPRINT_PLANNED", label: "Sprint Planned", color: "border-[#8B5CF6]" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-[#F59E0B]" },
  { id: "IN_REVIEW", label: "In Review", color: "border-[#EA580C]" },
  { id: "QA", label: "QA", color: "border-[#EC4899]" },
  { id: "DONE", label: "Done", color: "border-[#16A34A]" },
] as const

const PRIORITY_DOTS: Record<string, string> = {
  LOW: "bg-[#D4D4D4]",
  MEDIUM: "bg-[#FB923C]",
  HIGH: "bg-[#EF4444]",
  CRITICAL: "bg-[#DC2626]",
}

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface StoryKanbanProps {
  stories: StoryRow[]
  projectId: string
  onCardClick?: (storyId: string) => void
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function StoryKanban({ stories, projectId, onCardClick }: StoryKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const { execute } = useAction(updateStoryStatus, {
    onSuccess: () => toast.success("Story status updated"),
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to update story status"),
  })

  function handleDragStart(e: DragEvent, storyId: string) {
    setDraggedId(storyId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", storyId)
  }

  function handleDragOver(e: DragEvent, columnId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(columnId)
  }

  function handleDragLeave() {
    setDragOverColumn(null)
  }

  function handleDrop(e: DragEvent, newStatus: string) {
    e.preventDefault()
    setDragOverColumn(null)
    const storyId = e.dataTransfer.getData("text/plain")
    if (!storyId) return

    const story = stories.find((s) => s.id === storyId)
    if (!story || story.status === newStatus) return

    execute({
      projectId,
      storyId,
      status: newStatus as "DRAFT" | "READY" | "SPRINT_PLANNED" | "IN_PROGRESS" | "IN_REVIEW" | "QA" | "DONE",
    })
    setDraggedId(null)
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnStories = stories.filter((s) => s.status === col.id)
        const isOver = dragOverColumn === col.id

        return (
          <div
            key={col.id}
            className={cn(
              "flex min-w-[240px] flex-1 flex-col rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]",
              isOver && "border-[#2563EB] bg-[#EFF6FF]"
            )}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column header */}
            <div className={cn("rounded-t-lg border-t-2 px-3 py-2.5", col.color)}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-foreground">
                  {col.label}
                </span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E5E5E5] px-1.5 text-[11px] font-medium text-[#737373]">
                  {columnStories.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 p-2">
              {columnStories.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-[#737373]">
                  No stories
                </div>
              ) : (
                columnStories.map((story) => (
                  <div
                    key={story.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, story.id)}
                    onClick={() => onCardClick?.(story.id)}
                    className={cn(
                      "cursor-grab rounded-md border border-[#E5E5E5] bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
                      draggedId === story.id && "opacity-50"
                    )}
                  >
                    {/* Title + priority dot */}
                    <div className="flex items-start justify-between">
                      <p className="line-clamp-2 text-[14px] font-normal leading-snug text-foreground">
                        {story.title}
                      </p>
                      <div
                        className={cn(
                          "ml-2 mt-1 h-2 w-2 flex-shrink-0 rounded-full",
                          PRIORITY_DOTS[story.priority]
                        )}
                        title={story.priority}
                      />
                    </div>

                    {/* Footer: displayId, points, assignee */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-[#737373]">
                          {story.displayId}
                        </span>
                        {story.storyPoints != null && (
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[10px] text-[#737373]"
                          >
                            {story.storyPoints}pt
                          </Badge>
                        )}
                      </div>

                      {story.assignee ? (
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px]">
                            {getInitials(
                              story.assignee.displayName || story.assignee.email
                            )}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
