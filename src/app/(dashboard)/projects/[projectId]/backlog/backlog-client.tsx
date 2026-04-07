"use client"

/**
 * Backlog Client Component
 *
 * Renders all unassigned stories (no sprint) in a story table
 * with bulk action toolbar for sprint assignment and assignee change.
 */

import { useState } from "react"
import { StoryTable, type StoryRow } from "@/components/work/story-table"
import { StoryForm } from "@/components/work/story-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { ProjectRole } from "@/generated/prisma"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface BacklogClientProps {
  projectId: string
  stories: StoryRow[]
  epics: Array<{ id: string; name: string; prefix: string }>
  features: Array<{ id: string; name: string; prefix: string; epicId: string }>
  sprints: Array<{ id: string; name: string }>
  members: Array<{ id: string; displayName: string; email: string }>
  userRole: ProjectRole
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function BacklogClient({
  projectId,
  stories,
  epics,
  features,
  sprints,
  members,
  userRole,
}: BacklogClientProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingStory, setEditingStory] = useState<StoryRow | null>(null)

  function handleStoryClick(storyId: string) {
    const story = stories.find((s) => s.id === storyId)
    if (story) {
      setEditingStory(story)
      setFormOpen(true)
    }
  }

  function handleNewStory() {
    setEditingStory(null)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold text-foreground">Backlog</h1>
          <p className="text-[14px] text-muted-foreground">
            Stories not assigned to a sprint ({stories.length} total)
          </p>
        </div>
        <Button
          onClick={handleNewStory}
          className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New Story
        </Button>
      </div>

      {/* Story table with bulk actions */}
      <StoryTable
        stories={stories}
        projectId={projectId}
        onRowClick={handleStoryClick}
        sprints={sprints}
        members={members}
      />

      {/* Story form slide-over */}
      <StoryForm
        projectId={projectId}
        open={formOpen}
        onOpenChange={setFormOpen}
        story={editingStory as Parameters<typeof StoryForm>[0]["story"]}
        epics={epics}
        features={features}
        userRole={userRole}
      />
    </div>
  )
}
