"use client"

/**
 * Sprint List Client Component
 *
 * Wraps sprint table with "New Sprint" button and sprint form dialog.
 */

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SprintTable, type SprintRow } from "@/components/sprints/sprint-table"
import { SprintForm } from "@/components/sprints/sprint-form"

interface SprintListClientProps {
  projectId: string
  sprints: SprintRow[]
}

export function SprintListClient({ projectId, sprints }: SprintListClientProps) {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Sprints</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Sprint
        </Button>
      </div>

      {/* Sprint table */}
      <SprintTable sprints={sprints} projectId={projectId} />

      {/* Create dialog */}
      <SprintForm
        projectId={projectId}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  )
}
