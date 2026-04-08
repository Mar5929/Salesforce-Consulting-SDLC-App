"use client"

import { useState, useMemo } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"
import { ChevronRight, AlertTriangle, User } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoryWithEpic {
  id: string
  displayId: string
  title: string
  status: string
  priority: string
  storyPoints: number | null
  dependencies: string | null
  sortOrder: number
  epicId: string
  epic: {
    id: string
    name: string
    prefix: string
  }
  assignee: {
    displayName: string
  } | null
  questionBlocksStories: Array<{
    question: { id: string; status: string }
  }>
}

interface ExecutionPlanTabProps {
  projectId: string
  stories: StoryWithEpic[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-secondary text-secondary-foreground",
  READY: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  SPRINT_PLANNED:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  IN_PROGRESS:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  IN_REVIEW:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  QA: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  DONE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  SPRINT_PLANNED: "Sprint Planned",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  QA: "QA",
  DONE: "Done",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUnresolvedBlockingCount(story: StoryWithEpic): number {
  return story.questionBlocksStories.filter(
    (qbs) =>
      qbs.question.status !== "ANSWERED" && qbs.question.status !== "REVIEWED"
  ).length
}

function getAssigneeName(story: StoryWithEpic): string | null {
  if (!story.assignee) return null
  return story.assignee.displayName || null
}

function getCompletionColor(pct: number): string {
  if (pct >= 75) return "text-green-600 dark:text-green-400"
  if (pct >= 25) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

interface EpicGroup {
  epicId: string
  epicName: string
  epicPrefix: string
  stories: StoryWithEpic[]
  doneCount: number
  completionPct: number
}

function groupByEpic(stories: StoryWithEpic[]): EpicGroup[] {
  const map = new Map<string, StoryWithEpic[]>()

  for (const story of stories) {
    const existing = map.get(story.epicId)
    if (existing) {
      existing.push(story)
    } else {
      map.set(story.epicId, [story])
    }
  }

  const groups: EpicGroup[] = []

  for (const [epicId, epicStories] of map) {
    // Sort stories by sortOrder within each epic
    epicStories.sort((a, b) => a.sortOrder - b.sortOrder)

    const doneCount = epicStories.filter((s) => s.status === "DONE").length
    const completionPct =
      epicStories.length > 0
        ? Math.round((doneCount / epicStories.length) * 100)
        : 0

    groups.push({
      epicId,
      epicName: epicStories[0].epic.name,
      epicPrefix: epicStories[0].epic.prefix,
      stories: epicStories,
      doneCount,
      completionPct,
    })
  }

  // Sort groups alphabetically by epic name
  groups.sort((a, b) => a.epicName.localeCompare(b.epicName))

  return groups
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExecutionPlanTab({ projectId, stories }: ExecutionPlanTabProps) {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set())

  const epicGroups = useMemo(() => groupByEpic(stories), [stories])
  const allEpicIds = useMemo(
    () => epicGroups.map((g) => g.epicId),
    [epicGroups]
  )

  if (stories.length === 0) {
    return (
      <EmptyState
        heading="No stories yet"
        description="Create stories in the Work view to see the execution plan."
      />
    )
  }

  const allExpanded = expandedEpics.size === allEpicIds.length
  const toggleAll = () => {
    setExpandedEpics(allExpanded ? new Set() : new Set(allEpicIds))
  }

  const toggleEpic = (epicId: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev)
      if (next.has(epicId)) {
        next.delete(epicId)
      } else {
        next.add(epicId)
      }
      return next
    })
  }

  return (
    <div className="space-y-1">
      {/* Expand / Collapse All */}
      <div className="flex justify-end pb-2">
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {/* Epic Accordion Sections */}
      {epicGroups.map((group) => {
        const isOpen = expandedEpics.has(group.epicId)

        return (
          <Collapsible
            key={group.epicId}
            open={isOpen}
            onOpenChange={() => toggleEpic(group.epicId)}
            className="rounded-lg border"
          >
            <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors">
              <ChevronRight
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-90"
                )}
              />
              <span className="font-semibold text-sm truncate">
                {group.epicName}
              </span>
              <Badge variant="secondary" className="ml-auto shrink-0">
                {group.stories.length}{" "}
                {group.stories.length === 1 ? "story" : "stories"}
              </Badge>
              <span
                className={cn(
                  "text-xs font-medium shrink-0",
                  getCompletionColor(group.completionPct)
                )}
              >
                {group.completionPct}% complete
              </span>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border-t divide-y">
                {group.stories.map((story) => {
                  const blockedCount = getUnresolvedBlockingCount(story)
                  const isBlocked = blockedCount > 0
                  const assigneeName = getAssigneeName(story)

                  return (
                    <div
                      key={story.id}
                      className={cn(
                        "flex items-start gap-4 px-4 py-2.5 pl-11 hover:bg-muted/30 transition-colors",
                        isBlocked &&
                          "border-l-2 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
                      )}
                    >
                      {/* Left: ID + Title */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground shrink-0">
                            {story.displayId}
                          </span>
                          <span className="text-sm truncate">
                            {story.title}
                          </span>
                        </div>

                        {/* Dependency / Blocked indicators */}
                        {(story.dependencies || isBlocked) && (
                          <div className="flex flex-col gap-0.5">
                            {story.dependencies && (
                              <span className="text-xs text-muted-foreground">
                                Depends on: {story.dependencies}
                              </span>
                            )}
                            {isBlocked && (
                              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-3 w-3" />
                                Blocked by {blockedCount}{" "}
                                {blockedCount === 1 ? "question" : "questions"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Middle: Assignee */}
                      <div className="flex items-center gap-1.5 shrink-0 w-32">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span
                          className={cn(
                            "text-xs truncate",
                            assigneeName
                              ? "text-foreground"
                              : "text-muted-foreground italic"
                          )}
                        >
                          {assigneeName ?? "Unassigned"}
                        </span>
                      </div>

                      {/* Right: Status */}
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                          STATUS_STYLES[story.status] ?? STATUS_STYLES.DRAFT
                        )}
                      >
                        {STATUS_LABELS[story.status] ?? story.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
