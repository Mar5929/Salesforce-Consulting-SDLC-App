"use client"

/**
 * Domain Review Card
 *
 * Displays an AI-suggested domain grouping for architect review.
 * Shows name, description, component list, confidence badge.
 * Actions: Confirm, Edit (dialog), Reject (confirmation dialog).
 */

import { useState } from "react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Check } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  confirmDomainGrouping,
  editDomainGrouping,
  rejectDomainGrouping,
} from "@/actions/org-analysis"

interface DomainGrouping {
  id: string
  name: string
  description: string | null
  isConfirmed: boolean
  components: Array<{ apiName: string; label: string | null }>
}

interface DomainReviewCardProps {
  grouping: DomainGrouping
  confidence?: number
  projectId: string
  onUpdate: () => void
}

function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence == null) return null

  const isHigh = confidence >= 80
  const isMedium = confidence >= 50 && confidence < 80

  return (
    <span
      className="inline-flex w-[48px] items-center justify-center rounded-full px-2 py-0.5 text-[13px] font-semibold"
      style={{
        backgroundColor: isHigh
          ? "#22C55E"
          : isMedium
            ? "#F59E0B"
            : "transparent",
        color: isHigh || isMedium ? "white" : "var(--muted-foreground)",
        border:
          !isHigh && !isMedium
            ? "1px solid var(--border)"
            : "1px solid transparent",
      }}
    >
      {confidence}%
    </span>
  )
}

export function DomainReviewCard({
  grouping,
  confidence,
  projectId,
  onUpdate,
}: DomainReviewCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [editName, setEditName] = useState(grouping.name)
  const [editDescription, setEditDescription] = useState(
    grouping.description ?? ""
  )

  const { execute: executeConfirm, isExecuting: isConfirming } = useAction(
    confirmDomainGrouping,
    {
      onSuccess: () => {
        toast.success("Domain grouping confirmed")
        onUpdate()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to confirm")
      },
    }
  )

  const { execute: executeEdit, isExecuting: isEditing } = useAction(
    editDomainGrouping,
    {
      onSuccess: () => {
        toast.success("Domain grouping updated")
        setEditOpen(false)
        onUpdate()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to update")
      },
    }
  )

  const { execute: executeReject, isExecuting: isRejecting } = useAction(
    rejectDomainGrouping,
    {
      onSuccess: () => {
        toast.success("Domain grouping removed")
        setRejectOpen(false)
        onUpdate()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to reject")
      },
    }
  )

  const MAX_COMPONENTS = 8
  const visibleComponents = grouping.components.slice(0, MAX_COMPONENTS)
  const remainingCount = grouping.components.length - MAX_COMPONENTS

  return (
    <>
      <Card className="p-6">
        <CardHeader className="flex-row items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[18px] font-semibold">
              {grouping.name}
            </CardTitle>
            {grouping.isConfirmed && (
              <Badge
                variant="default"
                className="bg-[#22C55E] text-white"
              >
                <Check className="size-3" />
                Confirmed
              </Badge>
            )}
          </div>
          <CardAction>
            <ConfidenceBadge confidence={confidence} />
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-3">
          {grouping.description && (
            <p className="text-[14px] font-normal text-secondary-foreground">
              {grouping.description}
            </p>
          )}

          {grouping.components.length > 0 && (
            <p className="text-[13px] font-normal text-muted-foreground">
              <span className="font-medium text-foreground">Components: </span>
              {visibleComponents.map((c) => c.apiName).join(", ")}
              {remainingCount > 0 && ` +${remainingCount} more`}
            </p>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={grouping.isConfirmed || isConfirming}
              onClick={() =>
                executeConfirm({
                  domainGroupingId: grouping.id,
                  projectId,
                })
              }
            >
              {isConfirming ? "Confirming..." : "Confirm"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditName(grouping.name)
                setEditDescription(grouping.description ?? "")
                setEditOpen(true)
              }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:text-destructive"
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Domain Grouping</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-dg-name">Name</Label>
              <Input
                id="edit-dg-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dg-desc">Description</Label>
              <Textarea
                id="edit-dg-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isEditing || !editName.trim()}
              onClick={() =>
                executeEdit({
                  domainGroupingId: grouping.id,
                  projectId,
                  name: editName.trim(),
                  description: editDescription.trim() || undefined,
                })
              }
            >
              {isEditing ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Domain Grouping</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove this grouping? Components will be ungrouped.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Keep Grouping
            </Button>
            <Button
              variant="destructive"
              disabled={isRejecting}
              onClick={() =>
                executeReject({
                  domainGroupingId: grouping.id,
                  projectId,
                })
              }
            >
              {isRejecting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
