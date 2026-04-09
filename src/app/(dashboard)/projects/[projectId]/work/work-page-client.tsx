"use client"

/**
 * Work Page Client Component
 *
 * Handles view toggle between Table (default) and Kanban for epics.
 * Renders the "New Epic" button and view components.
 */

import { Layers, LayoutGrid, FileText, ChevronRight } from "lucide-react"
import { ViewToggle, useViewMode } from "@/components/work/view-toggle"
import { EpicForm } from "@/components/work/epic-form"
import { EpicTable } from "@/components/work/epic-table"
import { EpicKanban } from "@/components/work/epic-kanban"

interface EpicRow {
  id: string
  name: string
  prefix: string
  description: string | null
  status: string
  _count: { features: number; stories: number }
}

interface WorkPageClientProps {
  projectId: string
  epics: EpicRow[]
}

export function WorkPageClient({ projectId, epics }: WorkPageClientProps) {
  const { viewMode } = useViewMode()

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold text-foreground">Work</h1>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {epics.length} {epics.length === 1 ? "epic" : "epics"}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground/60">
              <Layers className="h-3 w-3" />
              Epics
              <ChevronRight className="h-3 w-3" />
              <LayoutGrid className="h-3 w-3" />
              Features
              <ChevronRight className="h-3 w-3" />
              <FileText className="h-3 w-3" />
              Stories
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle />
          <EpicForm projectId={projectId} />
        </div>
      </div>

      {/* View content */}
      {viewMode === "table" ? (
        <EpicTable epics={epics} projectId={projectId} />
      ) : (
        <EpicKanban epics={epics} projectId={projectId} />
      )}
    </div>
  )
}
