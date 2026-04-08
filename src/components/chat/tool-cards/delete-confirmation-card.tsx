"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ToolResultCard } from "./tool-result-card"

interface DeleteConfirmationCardProps {
  entityType: string
  entityName: string
  approvalId: string
  addToolApprovalResponse: (params: { id: string; approved: boolean }) => void
}

export function DeleteConfirmationCard({
  entityType,
  entityName,
  approvalId,
  addToolApprovalResponse,
}: DeleteConfirmationCardProps) {
  const [resolved, setResolved] = useState<"confirmed" | "cancelled" | null>(null)
  const bodyId = `delete-body-${approvalId}`

  if (resolved === "confirmed") {
    return (
      <p className="text-[13px] text-muted-foreground py-2">Deleted {entityName}.</p>
    )
  }

  if (resolved === "cancelled") {
    return (
      <p className="text-[13px] text-muted-foreground py-2">Deletion cancelled.</p>
    )
  }

  return (
    <ToolResultCard
      role="alertdialog"
      className="bg-destructive/5 border-destructive/20"
      aria-label={`Delete ${entityType}?`}
      aria-describedby={bodyId}
    >
      <p className="text-[14px] font-semibold mb-2">Delete {entityType}?</p>
      <p id={bodyId} className="text-[14px] text-foreground mb-4">
        This will permanently delete {entityName}. This action cannot be undone.
      </p>
      {/* Tab order: Keep It first, then Confirm Delete — prevents accidental destructive action */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setResolved("cancelled")
            addToolApprovalResponse({ id: approvalId, approved: false })
          }}
        >
          Keep It
        </Button>
        <Button
          variant="destructive"
          size="sm"
          aria-label={`Confirm permanent deletion of ${entityName}`}
          onClick={() => {
            setResolved("confirmed")
            addToolApprovalResponse({ id: approvalId, approved: true })
          }}
        >
          Confirm Delete
        </Button>
      </div>
    </ToolResultCard>
  )
}
