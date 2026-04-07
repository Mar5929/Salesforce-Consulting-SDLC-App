"use client"

/**
 * Defects Page Client Component
 *
 * Handles view toggle (table/kanban), filter bar,
 * defect creation sheet, and status transitions.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Plus, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ViewToggle, useViewMode } from "@/components/work/view-toggle"
import { DefectTable, type DefectRow } from "@/components/defects/defect-table"
import { DefectKanban } from "@/components/defects/defect-kanban"
import { DefectFilters } from "@/components/defects/defect-filters"
import { DefectCreateSheet } from "@/components/defects/defect-create-sheet"
import { transitionDefectStatus, deleteDefect } from "@/actions/defects"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface DefectsPageClientProps {
  projectId: string
  defects: DefectRow[]
  members: Array<{ id: string; displayName: string }>
  stories: Array<{ id: string; displayId: string; title: string }>
  memberRole: string
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function DefectsPageClient({
  projectId,
  defects,
  members,
  stories,
  memberRole,
}: DefectsPageClientProps) {
  const router = useRouter()
  const { viewMode } = useViewMode()
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  const { execute: executeTransition } = useAction(transitionDefectStatus, {
    onSuccess: () => {
      toast.success("Status updated")
      router.refresh()
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to update status"),
  })

  const { execute: executeDelete } = useAction(deleteDefect, {
    onSuccess: () => {
      toast.success("Defect deleted")
      router.refresh()
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to delete defect"),
  })

  function handleTransition(id: string, status: string) {
    executeTransition({
      id,
      toStatus: status as "OPEN" | "ASSIGNED" | "FIXED" | "VERIFIED" | "CLOSED",
    })
  }

  function handleEdit(defect: DefectRow) {
    // For V1, edit opens the create sheet pattern (future: edit sheet)
    toast.info(`Edit defect ${defect.displayId} -- editing coming in next iteration`)
  }

  function handleDelete(id: string) {
    executeDelete({ id })
  }

  function handleCreated() {
    setCreateSheetOpen(false)
    router.refresh()
  }

  // Empty state
  if (defects.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-semibold text-foreground">Defects</h1>
        </div>

        <DefectFilters
          projectId={projectId}
          members={members}
          stories={stories}
        />

        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F5]">
            <Bug className="h-6 w-6 text-[#737373]" />
          </div>
          <h3 className="text-[16px] font-medium text-foreground">
            No defects reported
          </h3>
          <p className="text-[14px] text-muted-foreground text-center max-w-md">
            Defects are created from failed test cases or manually when issues
            are discovered during QA testing.
          </p>
          <Button
            onClick={() => setCreateSheetOpen(true)}
            className="mt-2 bg-[#2563EB] text-white hover:bg-[#1d4ed8] gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Create Defect
          </Button>
        </div>

        <DefectCreateSheet
          projectId={projectId}
          open={createSheetOpen}
          onOpenChange={setCreateSheetOpen}
          onCreated={handleCreated}
          members={members}
          stories={stories}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-semibold text-foreground">Defects</h1>
        <div className="flex items-center gap-2">
          <ViewToggle />
          <Button
            onClick={() => setCreateSheetOpen(true)}
            className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Create Defect
          </Button>
        </div>
      </div>

      {/* Filters */}
      <DefectFilters
        projectId={projectId}
        members={members}
        stories={stories}
      />

      {/* View content */}
      {viewMode === "table" ? (
        <DefectTable
          defects={defects}
          onTransition={handleTransition}
          onEdit={handleEdit}
          onDelete={handleDelete}
          memberRole={memberRole}
        />
      ) : (
        <DefectKanban
          defects={defects}
          onTransition={handleTransition}
          onEdit={handleEdit}
          memberRole={memberRole}
        />
      )}

      {/* Create defect sheet */}
      <DefectCreateSheet
        projectId={projectId}
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onCreated={handleCreated}
        members={members}
        stories={stories}
      />
    </div>
  )
}
