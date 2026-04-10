"use client"

/**
 * Epic Detail Client Component
 *
 * Handles view toggle for features, breadcrumb navigation,
 * inline editing of epic details, and "Generate Stories" menu option.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Sparkles, LayoutGrid, FileText, Pencil, Loader2 } from "lucide-react"
import { WorkBreadcrumb } from "@/components/work/work-breadcrumb"
import { ViewToggle, useViewMode } from "@/components/work/view-toggle"
import { FeatureForm } from "@/components/work/feature-form"
import { FeatureTable } from "@/components/work/feature-table"
import { FeatureKanban } from "@/components/work/feature-kanban"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { initiateStorySession } from "@/actions/conversations"
import { updateEpic } from "@/actions/epics"
import { EpicStatus } from "@/generated/prisma"

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

const STATUS_LABELS: Record<EpicStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
}

const STATUS_COLORS: Record<EpicStatus, string> = {
  NOT_STARTED: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

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
  status: EpicStatus
  features: FeatureRow[]
  _count: { stories: number }
}

interface EpicDetailClientProps {
  projectId: string
  epic: EpicData
}

export function EpicDetailClient({ projectId, epic }: EpicDetailClientProps) {
  const router = useRouter()
  const { viewMode } = useViewMode()

  // ── Edit mode state ──
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(epic.name)
  const [editDescription, setEditDescription] = useState(epic.description ?? "")
  const [editStatus, setEditStatus] = useState<EpicStatus>(epic.status)

  const { execute: executeUpdate, isPending: isSaving } = useAction(
    updateEpic,
    {
      onSuccess: () => {
        toast.success("Epic updated")
        setIsEditing(false)
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to update epic")
      },
    }
  )

  function handleEdit() {
    setEditName(epic.name)
    setEditDescription(epic.description ?? "")
    setEditStatus(epic.status)
    setIsEditing(true)
  }

  function handleCancel() {
    setIsEditing(false)
  }

  function handleSave() {
    executeUpdate({
      projectId,
      epicId: epic.id,
      name: editName.trim(),
      description: editDescription.trim(),
      status: editStatus,
    })
  }

  const { execute: executeInitiateSession, isExecuting } = useAction(initiateStorySession, {
    onSuccess: ({ data }) => {
      if (data?.conversationId) {
        const params = new URLSearchParams()
        params.set("epicId", epic.id)
        if (data.featureId) params.set("featureId", data.featureId)
        router.push(`/projects/${projectId}/chat/${data.conversationId}?${params.toString()}`)
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to start story generation session")
    },
  })

  const breadcrumbSegments = [
    { label: "Work", href: `/projects/${projectId}/work` },
    { label: epic.name, href: `/projects/${projectId}/work/${epic.id}` },
  ]

  function handleGenerateStories() {
    executeInitiateSession({ projectId, epicId: epic.id })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <WorkBreadcrumb segments={breadcrumbSegments} />

      {/* Header */}
      {isEditing ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[14px] text-muted-foreground">
              {epic.prefix}
            </span>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Epic name"
              className="max-w-md text-[16px] font-semibold"
              autoFocus
            />
          </div>
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Epic description (optional)"
            className="max-w-lg resize-none text-[14px]"
            rows={3}
          />
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground">Status:</span>
            <Select
              value={editStatus}
              onValueChange={(val) => setEditStatus(val as EpicStatus)}
            >
              <SelectTrigger className="w-[160px]" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EpicStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={isSaving || !editName.trim()}
              className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] gap-1.5"
              size="sm"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-semibold text-foreground">
                <span className="font-mono text-[18px] text-muted-foreground mr-2">
                  {epic.prefix}
                </span>
                {epic.name}
              </h1>
              <Badge
                variant="secondary"
                className={STATUS_COLORS[epic.status]}
              >
                {STATUS_LABELS[epic.status]}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-7 gap-1 px-2 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
            <p className="text-[14px] text-muted-foreground">
              {epic.description || <span className="italic text-muted-foreground/60">No description</span>}
            </p>
            <div className="flex items-center gap-3 text-[13px] text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <LayoutGrid className="h-3.5 w-3.5" />
                {epic.features.length} {epic.features.length === 1 ? "feature" : "features"}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {epic._count.stories} {epic._count.stories === 1 ? "story" : "stories"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateStories}
              disabled={isExecuting}
              className="gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Generate Stories
            </Button>
            <ViewToggle />
            <FeatureForm projectId={projectId} epicId={epic.id} />
          </div>
        </div>
      )}

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
