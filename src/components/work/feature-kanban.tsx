"use client"

/**
 * Feature Kanban View
 *
 * Three-column kanban board by FeatureStatus: NOT_STARTED, IN_PROGRESS, COMPLETE.
 * Cards show prefix, name, story count.
 * Cards are clickable to drill into feature's stories.
 */

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

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

  function handleCardClick(featureId: string) {
    router.push(`/projects/${projectId}/work/${epicId}/${featureId}`)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnFeatures = features.filter((f) => f.status === col.id)

        return (
          <div
            key={col.id}
            className="flex min-w-[280px] flex-1 flex-col rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]"
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
                    className="cursor-pointer rounded-md border border-[#E5E5E5] bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                    onClick={() => handleCardClick(feature.id)}
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
