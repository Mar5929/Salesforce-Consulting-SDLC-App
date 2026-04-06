"use client"

/**
 * Feature Detail Client Component
 *
 * Handles view toggle for stories, breadcrumb navigation,
 * and "New Story" slide-over form.
 */

import { useState } from "react"
import { WorkBreadcrumb } from "@/components/work/work-breadcrumb"
import { ViewToggle, useViewMode } from "@/components/work/view-toggle"
import { StoryTable, type StoryRow } from "@/components/work/story-table"
import { StoryKanban } from "@/components/work/story-kanban"
import { StoryForm } from "@/components/work/story-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { ProjectRole } from "@/generated/prisma"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface FeatureData {
  id: string
  name: string
  prefix: string
  description: string | null
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold text-foreground">
            <span className="mr-2 font-mono text-[18px] text-muted-foreground">
              {feature.prefix}
            </span>
            {feature.name}
          </h1>
          {feature.description && (
            <p className="text-[14px] text-muted-foreground">
              {feature.description}
            </p>
          )}
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

      {/* View content */}
      {viewMode === "table" ? (
        <StoryTable
          stories={stories}
          projectId={projectId}
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
