"use client"

/**
 * Feature Detail Client Component
 *
 * Handles view toggle for stories, breadcrumb navigation,
 * inline feature editing, and "New Story" slide-over form.
 */

import { useState } from "react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { WorkBreadcrumb } from "@/components/work/work-breadcrumb"
import { ViewToggle, useViewMode } from "@/components/work/view-toggle"
import { StoryTable, type StoryRow } from "@/components/work/story-table"
import { StoryKanban } from "@/components/work/story-kanban"
import { StoryForm } from "@/components/work/story-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Loader2, Calendar, Layers } from "lucide-react"
import { format } from "date-fns"
import { updateFeature } from "@/actions/features"
import { FeatureStatus, type ProjectRole } from "@/generated/prisma"

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

const STATUS_LABELS: Record<FeatureStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
}

const STATUS_COLORS: Record<FeatureStatus, string> = {
  NOT_STARTED: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface FeatureData {
  id: string
  name: string
  prefix: string
  description: string | null
  status: FeatureStatus
  createdAt: string
  updatedAt: string
  epic: { id: string; name: string; prefix: string }
}

interface FeatureDetailClientProps {
  projectId: string
  epicId: string
  feature: FeatureData
  stories: StoryRow[]
  epics: Array<{ id: string; name: string; prefix: string }>
  features: Array<{ id: string; name: string; prefix: string; epicId: string }>
  userRole: ProjectRole
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function FeatureDetailClient({
  projectId,
  epicId,
  feature,
  stories,
  epics,
  features,
  userRole,
}: FeatureDetailClientProps) {
  const { viewMode } = useViewMode()
  const [formOpen, setFormOpen] = useState(false)
  const [editingStory, setEditingStory] = useState<StoryRow | null>(null)

  // ── Edit mode state ──
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(feature.name)
  const [editDescription, setEditDescription] = useState(feature.description ?? "")
  const [editStatus, setEditStatus] = useState<FeatureStatus>(feature.status)

  const { execute: executeUpdate, isPending: isSaving } = useAction(
    updateFeature,
    {
      onSuccess: () => {
        toast.success("Feature updated")
        setIsEditing(false)
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to update feature")
      },
    }
  )

  function handleEdit() {
    setEditName(feature.name)
    setEditDescription(feature.description ?? "")
    setEditStatus(feature.status)
    setIsEditing(true)
  }

  function handleCancel() {
    setIsEditing(false)
  }

  function handleSave() {
    executeUpdate({
      projectId,
      featureId: feature.id,
      name: editName.trim(),
      description: editDescription.trim(),
      status: editStatus,
    })
  }

  const breadcrumbSegments = [
    { label: "Work", href: `/projects/${projectId}/work` },
    { label: feature.epic.name, href: `/projects/${projectId}/work/${epicId}` },
    {
      label: feature.name,
      href: `/projects/${projectId}/work/${epicId}/${feature.id}`,
    },
  ]

  function handleStoryClick(storyId: string) {
    const story = stories.find((s) => s.id === storyId)
    if (story) {
      setEditingStory(story as StoryRow & { epicId: string; featureId: string | null; acceptanceCriteria: string; persona: string | null; description: string | null })
      setFormOpen(true)
    }
  }

  function handleNewStory() {
    setEditingStory(null)
    setFormOpen(true)
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
              {feature.prefix}
            </span>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Feature name"
              className="max-w-md text-[16px] font-semibold"
              autoFocus
            />
          </div>
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Feature description (optional)"
            className="max-w-lg resize-none text-[14px]"
            rows={3}
          />
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground">Status:</span>
            <Select
              value={editStatus}
              onValueChange={(val) => setEditStatus(val as FeatureStatus)}
            >
              <SelectTrigger className="w-[160px]" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FeatureStatus).map((s) => (
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
                <span className="mr-2 font-mono text-[18px] text-muted-foreground">
                  {feature.prefix}
                </span>
                {feature.name}
              </h1>
              <Badge
                variant="secondary"
                className={STATUS_COLORS[feature.status]}
              >
                {STATUS_LABELS[feature.status]}
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
              {feature.description || <span className="italic text-muted-foreground/60">No description</span>}
            </p>
            <div className="flex items-center gap-3 text-[13px] text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {stories.length} {stories.length === 1 ? "story" : "stories"}
              </span>
              <span>Epic: {feature.epic.name}</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Created {format(new Date(feature.createdAt), "MMM d, yyyy")}
              </span>
              {feature.createdAt !== feature.updatedAt && (
                <span>
                  Updated {format(new Date(feature.updatedAt), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle />
            <Button
              onClick={handleNewStory}
              className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] gap-1.5"
            >
              <Plus className="h-4 w-4" />
              New Story
            </Button>
          </div>
        </div>
      )}

      {/* View content */}
      {viewMode === "table" ? (
        <StoryTable
          stories={stories}
          projectId={projectId}
          epicId={epicId}
          featureId={feature.id}
          onRowClick={handleStoryClick}
        />
      ) : (
        <StoryKanban
          stories={stories}
          projectId={projectId}
          onCardClick={handleStoryClick}
        />
      )}

      {/* Story form slide-over */}
      <StoryForm
        projectId={projectId}
        open={formOpen}
        onOpenChange={setFormOpen}
        story={editingStory as Parameters<typeof StoryForm>[0]["story"]}
        epics={epics}
        features={features}
        defaultEpicId={epicId}
        defaultFeatureId={feature.id}
        userRole={userRole}
      />
    </div>
  )
}
