"use client"

/**
 * Work Page Client Component
 *
 * Handles view toggle between Table (default) and Kanban for epics.
 * Renders the "New Epic" button and view components.
 */

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
        <h1 className="text-[24px] font-semibold text-foreground">Work</h1>
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
