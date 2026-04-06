"use client"

/**
 * Epic Detail Client Component
 *
 * Handles view toggle for features, breadcrumb navigation,
 * and "Generate Stories" menu option (falls back to toast if not yet available).
 */

import { toast } from "sonner"
import { Sparkles } from "lucide-react"
import { WorkBreadcrumb } from "@/components/work/work-breadcrumb"
import { ViewToggle, useViewMode } from "@/components/work/view-toggle"
import { FeatureForm } from "@/components/work/feature-form"
import { FeatureTable } from "@/components/work/feature-table"
import { FeatureKanban } from "@/components/work/feature-kanban"
import { Button } from "@/components/ui/button"

interface FeatureRow {
  id: string
  name: string
  prefix: string
  description: string | null
  status: string
  _count: { stories: number }
}

interface EpicData {
  id: string
  name: string
  prefix: string
  description: string | null
  status: string
  features: FeatureRow[]
  _count: { stories: number }
}

interface EpicDetailClientProps {
  projectId: string
  epic: EpicData
}

export function EpicDetailClient({ projectId, epic }: EpicDetailClientProps) {
  const { viewMode } = useViewMode()

  const breadcrumbSegments = [
    { label: "Work", href: `/projects/${projectId}/work` },
    { label: epic.name, href: `/projects/${projectId}/work/${epic.id}` },
  ]

  function handleGenerateStories() {
    // initiateStorySession not yet available (Plan 03)
    toast("Coming soon - story generation will be available after Plan 03 is executed.")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <WorkBreadcrumb segments={breadcrumbSegments} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold text-foreground">
            <span className="font-mono text-[18px] text-muted-foreground mr-2">
              {epic.prefix}
            </span>
            {epic.name}
          </h1>
          {epic.description && (
            <p className="text-[14px] text-muted-foreground">{epic.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateStories}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            Generate Stories
          </Button>
          <ViewToggle />
          <FeatureForm projectId={projectId} epicId={epic.id} />
        </div>
      </div>

      {/* View content */}
      {viewMode === "table" ? (
        <FeatureTable
          features={epic.features}
          projectId={projectId}
          epicId={epic.id}
        />
      ) : (
        <FeatureKanban
          features={epic.features}
          projectId={projectId}
          epicId={epic.id}
        />
      )}
    </div>
  )
}
