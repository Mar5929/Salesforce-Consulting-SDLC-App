"use client"

/**
 * Question Kanban View (D-02, D-03)
 *
 * Kanban board with lifecycle columns: Open, Scoped, Owned, Answered, Reviewed, Parked.
 * Cards show title, priority indicator, and owner avatar per UI-SPEC.
 * Drag between columns to advance status via HTML drag-and-drop API.
 */

import { useState, type DragEvent } from "react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { updateQuestion } from "@/actions/questions"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface QuestionCard {
  id: string
  displayId: string
  questionText: string
  scope: string
  priority: string
  status: string
  needsReview: boolean
  owner?: { id: string; displayName: string; email: string } | null
}

interface QuestionKanbanProps {
  questions: QuestionCard[]
  projectId: string
}

// ────────────────────────────────────────────
// Column definitions
// ────────────────────────────────────────────

const COLUMNS = [
  { id: "OPEN", label: "Open", color: "border-[#2563EB]" },
  { id: "SCOPED", label: "Scoped", color: "border-[#8B5CF6]" },
  { id: "OWNED", label: "Owned", color: "border-[#F59E0B]" },
  { id: "ANSWERED", label: "Answered", color: "border-[#16A34A]" },
  { id: "REVIEWED", label: "Reviewed", color: "border-[#06B6D4]" },
  { id: "PARKED", label: "Parked", color: "border-[#737373]" },
] as const

const PRIORITY_DOTS: Record<string, string> = {
  LOW: "bg-[#D4D4D4]",
  MEDIUM: "bg-[#FB923C]",
  HIGH: "bg-[#EF4444]",
  CRITICAL: "bg-[#DC2626]",
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function QuestionKanban({ questions, projectId }: QuestionKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const { execute } = useAction(updateQuestion, {
    onSuccess: () => {
      toast.success("Question status updated")
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to update question")
    },
  })

  function handleDragStart(e: DragEvent, questionId: string) {
    setDraggedId(questionId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", questionId)
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
    const questionId = e.dataTransfer.getData("text/plain")
    if (!questionId) return

    const question = questions.find((q) => q.id === questionId)
    if (!question || question.status === newStatus) return

    execute({
      projectId,
      questionId,
      status: newStatus as "OPEN" | "SCOPED" | "OWNED" | "ANSWERED" | "REVIEWED" | "PARKED",
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
        const columnQuestions = questions.filter((q) => q.status === col.id)
        const isOver = dragOverColumn === col.id

        return (
          <div
            key={col.id}
            className={cn(
              "flex min-w-[280px] flex-1 flex-col rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]",
              isOver && "border-[#2563EB] bg-[#EFF6FF]"
            )}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column header */}
            <div className={cn("border-t-2 rounded-t-lg px-3 py-2.5", col.color)}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-foreground">
                  {col.label}
                </span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E5E5E5] px-1.5 text-[11px] font-medium text-[#737373]">
                  {columnQuestions.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 p-2">
              {columnQuestions.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-[#737373]">
                  No questions
                </div>
              ) : (
                columnQuestions.map((q) => (
                  <div
                    key={q.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, q.id)}
                    className={cn(
                      "cursor-grab rounded-md border border-[#E5E5E5] bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
                      draggedId === q.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-[14px] font-normal leading-snug text-foreground line-clamp-2">
                        {q.questionText}
                      </p>
                      <div
                        className={cn(
                          "ml-2 mt-1 h-2 w-2 flex-shrink-0 rounded-full",
                          PRIORITY_DOTS[q.priority]
                        )}
                        title={q.priority}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-[#737373]">
                          {q.displayId}
                        </span>
                        {q.needsReview && (
                          <Badge
                            variant="outline"
                            className="h-4 bg-[#FFF7ED] text-[10px] text-[#EA580C] border-[#FED7AA]"
                          >
                            Review
                          </Badge>
                        )}
                      </div>

                      {q.owner ? (
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px]">
                            {getInitials(q.owner.displayName || q.owner.email)}
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
