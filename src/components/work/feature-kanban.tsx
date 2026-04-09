"use client"

/**
 * Feature Kanban View
 *
 * Three-column kanban board by FeatureStatus: NOT_STARTED, IN_PROGRESS, COMPLETE.
 * Cards show prefix, name, story count.
 * Cards are draggable to change status and clickable to drill into feature's stories.
 */

import { useState, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { updateFeature } from "@/actions/features"
import { FeatureStatus } from "@/generated/prisma"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface FeatureCard {
  id: string
  name: string
  prefix: string
  status: string
  _count: { stories: number }
}

interface FeatureKanbanProps {
  features: FeatureCard[]
  projectId: string
  epicId: string
}

// ────────────────────────────────────────────
// Column definitions
// ────────────────────────────────────────────

const COLUMNS = [
  { id: "NOT_STARTED", label: "Not Started", color: "border-[#737373]" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-[#2563EB]" },
  { id: "COMPLETE", label: "Complete", color: "border-[#16A34A]" },
] as const

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function FeatureKanban({ features, projectId, epicId }: FeatureKanbanProps) {
  const router = useRouter()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const { execute } = useAction(updateFeature, {
    onSuccess: () => toast.success("Feature status updated"),
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to update feature status"),
  })

  function handleCardClick(featureId: string) {
    router.push(`/projects/${projectId}/work/${epicId}/${featureId}`)
  }

  function handleDragStart(e: DragEvent, featureId: string) {
    setDraggedId(featureId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", featureId)
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
    const featureId = e.dataTransfer.getData("text/plain")
    if (!featureId) return

    const feature = features.find((f) => f.id === featureId)
    if (!feature || feature.status === newStatus) return

    execute({
      projectId,
      featureId,
      status: newStatus as FeatureStatus,
    })
    setDraggedId(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnFeatures = features.filter((f) => f.status === col.id)
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
                  {columnFeatures.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 p-2">
              {columnFeatures.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-[#737373]">
                  No features
                </div>
              ) : (
                columnFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, feature.id)}
                    onClick={() => handleCardClick(feature.id)}
                    className={cn(
                      "cursor-grab rounded-md border border-[#E5E5E5] bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
                      draggedId === feature.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-[14px] font-medium leading-snug text-foreground line-clamp-2">
                        {feature.name}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <span className="font-mono text-[11px] text-[#737373]">
                        {feature.prefix}
                      </span>
                      <span className="text-[11px] text-[#737373]">
                        {feature._count.stories} stories
                      </span>
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
