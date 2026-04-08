"use client"

/**
 * Milestone Story Linker
 *
 * Dialog for linking stories to a milestone.
 * Shows unlinked stories grouped by epic, with already-linked stories disabled at top.
 */

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { linkStoriesToMilestone } from "@/actions/milestones"
import type { StoryWithEpic } from "@/app/(dashboard)/projects/[projectId]/roadmap/roadmap-page-client"

// ────────────────────────────────────────────
// Props
// ────────────────────────────────────────────

interface MilestoneStoryLinkerProps {
  projectId: string
  milestoneId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  allStories: StoryWithEpic[]
  linkedStoryIds: string[]
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function MilestoneStoryLinker({
  projectId,
  milestoneId,
  open,
  onOpenChange,
  allStories,
  linkedStoryIds,
}: MilestoneStoryLinkerProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const linkedSet = useMemo(() => new Set(linkedStoryIds), [linkedStoryIds])

  // Group stories by epic
  const groupedStories = useMemo(() => {
    const groups: Record<string, { epicName: string; stories: StoryWithEpic[] }> = {}

    for (const story of allStories) {
      const key = story.epic.prefix
      if (!groups[key]) {
        groups[key] = { epicName: story.epic.name, stories: [] }
      }
      groups[key].stories.push(story)
    }

    return Object.entries(groups).sort(([, a], [, b]) =>
      a.stories[0].epic.sortOrder - b.stories[0].epic.sortOrder,
    )
  }, [allStories])

  const { execute, isPending } = useAction(linkStoriesToMilestone, {
    onSuccess: () => {
      toast.success("Stories linked to milestone")
      setSelectedIds(new Set())
      onOpenChange(false)
      router.refresh()
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to link stories"),
  })

  function toggleStory(storyId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(storyId)) {
        next.delete(storyId)
      } else {
        next.add(storyId)
      }
      return next
    })
  }

  function handleLink() {
    if (selectedIds.size === 0) {
      toast.error("Select at least one story to link")
      return
    }
    execute({
      projectId,
      milestoneId,
      storyIds: Array.from(selectedIds),
    })
  }

  // Reset selections when dialog opens
  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      setSelectedIds(new Set())
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[80vh] sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Link Stories to Milestone</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto pr-2">
          {/* Already-linked stories */}
          {linkedStoryIds.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Already Linked
              </p>
              <div className="flex flex-col gap-1">
                {allStories
                  .filter((s) => linkedSet.has(s.id))
                  .map((story) => (
                    <label
                      key={story.id}
                      className="flex items-center gap-2 rounded px-2 py-1 opacity-60"
                    >
                      <Checkbox checked disabled />
                      <span className="text-sm font-mono text-muted-foreground">
                        {story.displayId}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {story.title}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {/* Unlinked stories grouped by epic */}
          {groupedStories.map(([prefix, group]) => {
            const unlinked = group.stories.filter((s) => !linkedSet.has(s.id))
            if (unlinked.length === 0) return null

            return (
              <div key={prefix} className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group.epicName}
                </p>
                <div className="flex flex-col gap-1">
                  {unlinked.map((story) => (
                    <label
                      key={story.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedIds.has(story.id)}
                        onCheckedChange={() => toggleStory(story.id)}
                      />
                      <span className="text-sm font-mono">
                        {story.displayId}
                      </span>
                      <span className="text-sm truncate">{story.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}

          {/* No unlinked stories available */}
          {groupedStories.every(([, group]) =>
            group.stories.every((s) => linkedSet.has(s.id)),
          ) && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              All stories are already linked to this milestone.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={isPending || selectedIds.size === 0}
          >
            <Link2 className="mr-1.5 h-4 w-4" />
            Link Selected ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
