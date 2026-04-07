"use client"

/**
 * Process Review Card
 *
 * Displays an AI-suggested business process mapping for architect review.
 * Shows name, description, complexity, component mapping table with roles.
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  confirmBusinessProcess,
  editBusinessProcess,
  rejectBusinessProcess,
} from "@/actions/org-analysis"

interface ProcessComponent {
  apiName: string
  role: string
  isRequired: boolean
}

interface BusinessProcess {
  id: string
  name: string
  description: string | null
  complexity: string | null
  isConfirmed: boolean
  components: ProcessComponent[]
}

interface ProcessReviewCardProps {
  process: BusinessProcess
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

function ComplexityBadge({ complexity }: { complexity: string | null }) {
  if (!complexity) return null

  const upper = complexity.toUpperCase()
  const variant =
    upper === "LOW"
      ? "secondary"
      : upper === "HIGH"
        ? "destructive"
        : "outline"

  const colorClass =
    upper === "LOW"
      ? "bg-[#22C55E]/10 text-[#22C55E]"
      : upper === "MEDIUM"
        ? "bg-[#F59E0B]/10 text-[#F59E0B]"
        : upper === "HIGH"
          ? "bg-[#EF4444]/10 text-[#EF4444]"
          : ""

  return (
    <Badge variant={variant} className={colorClass}>
      {complexity}
    </Badge>
  )
}

export function ProcessReviewCard({
  process,
  confidence,
  projectId,
  onUpdate,
}: ProcessReviewCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [editName, setEditName] = useState(process.name)
  const [editDescription, setEditDescription] = useState(
    process.description ?? ""
  )

  const { execute: executeConfirm, isExecuting: isConfirming } = useAction(
    confirmBusinessProcess,
    {
      onSuccess: () => {
        toast.success("Business process confirmed")
        onUpdate()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to confirm")
      },
    }
  )

  const { execute: executeEdit, isExecuting: isEditing } = useAction(
    editBusinessProcess,
    {
      onSuccess: () => {
        toast.success("Business process updated")
        setEditOpen(false)
        onUpdate()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to update")
      },
    }
  )

  const { execute: executeReject, isExecuting: isRejecting } = useAction(
    rejectBusinessProcess,
    {
      onSuccess: () => {
        toast.success("Business process removed")
        setRejectOpen(false)
        onUpdate()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to reject")
      },
    }
  )

  return (
    <>
      <Card className="p-6">
        <CardHeader className="flex-row items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[18px] font-semibold">
              {process.name}
            </CardTitle>
            <ComplexityBadge complexity={process.complexity} />
            {process.isConfirmed && (
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
          {process.description && (
            <p className="text-[14px] font-normal text-secondary-foreground">
              {process.description}
            </p>
          )}

          {/* Component mapping table */}
          {process.components.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[13px]">API Name</TableHead>
                    <TableHead className="text-[13px]">Role</TableHead>
                    <TableHead className="text-[13px]">Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {process.components.map((comp) => (
                    <TableRow key={comp.apiName}>
                      <TableCell className="text-[13px] font-medium">
                        {comp.apiName}
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {comp.role}
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {comp.isRequired ? (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            Optional
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={process.isConfirmed || isConfirming}
              onClick={() =>
                executeConfirm({
                  businessProcessId: process.id,
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
                setEditName(process.name)
                setEditDescription(process.description ?? "")
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
            <DialogTitle>Edit Business Process</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-bp-name">Name</Label>
              <Input
                id="edit-bp-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bp-desc">Description</Label>
              <Textarea
                id="edit-bp-desc"
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
                  businessProcessId: process.id,
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
            <DialogTitle>Remove Business Process</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove this business process? Component mappings will be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Keep Process
            </Button>
            <Button
              variant="destructive"
              disabled={isRejecting}
              onClick={() =>
                executeReject({
                  businessProcessId: process.id,
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
