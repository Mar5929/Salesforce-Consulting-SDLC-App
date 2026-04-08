"use client"

/**
 * Roadmap Page Client
 *
 * Tabbed layout for Milestones, Epic Phases, and Execution Plan.
 * Uses nuqs for URL-persisted tab state.
 */

import { parseAsString, useQueryState } from "nuqs"
import type {
  MilestoneStatus,
  StoryStatus,
  EpicStatus,
  EpicPhaseType,
  EpicPhaseStatus,
  QuestionStatus,
} from "@/generated/prisma"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MilestonesTab } from "@/components/roadmap/milestones-tab"
import { EpicPhaseGrid } from "@/components/roadmap/epic-phase-grid"
import { ExecutionPlanTab } from "@/components/roadmap/execution-plan-tab"

// ────────────────────────────────────────────
// Shared types for roadmap data
// ────────────────────────────────────────────

export interface MilestoneStoryData {
  id: string
  displayId: string
  title: string
  status: StoryStatus
}

export interface MilestoneData {
  id: string
  projectId: string
  name: string
  description: string | null
  targetDate: string | null
  status: MilestoneStatus
  sortOrder: number
  milestoneStories: {
    story: MilestoneStoryData
  }[]
}

export interface EpicPhaseData {
  id: string
  epicId: string
  phase: EpicPhaseType
  status: EpicPhaseStatus
  sortOrder: number
}

export interface EpicData {
  id: string
  projectId: string
  name: string
  prefix: string
  status: EpicStatus
  sortOrder: number
  phases: EpicPhaseData[]
  _count: { stories: number }
}

export interface StoryWithEpic {
  id: string
  displayId: string
  title: string
  status: StoryStatus
  storyPoints: number | null
  priority: string
  dependencies: string | null
  sortOrder: number
  epicId: string
  epic: {
    id: string
    name: string
    prefix: string
    sortOrder: number
  }
  questionBlocksStories: {
    question: {
      id: string
      status: QuestionStatus
    }
  }[]
  assignee: {
    displayName: string
  } | null
}

// ────────────────────────────────────────────
// Tab definitions
// ────────────────────────────────────────────

const TABS = [
  { value: "milestones", label: "Milestones" },
  { value: "epic-phases", label: "Epic Phases" },
  { value: "execution-plan", label: "Execution Plan" },
] as const

type TabValue = (typeof TABS)[number]["value"]

// ────────────────────────────────────────────
// Props
// ────────────────────────────────────────────

interface RoadmapPageClientProps {
  projectId: string
  milestones: MilestoneData[]
  epics: EpicData[]
  stories: StoryWithEpic[]
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function RoadmapPageClient({
  projectId,
  milestones,
  epics,
  stories,
}: RoadmapPageClientProps) {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("milestones"),
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <h1 className="text-[22px] font-semibold tracking-tight">Roadmap</h1>

      {/* Tab navigation */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={tab === t.value ? "default" : "ghost"}
            className={cn(
              tab === t.value &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "milestones" && (
        <MilestonesTab
          projectId={projectId}
          milestones={milestones}
          stories={stories}
        />
      )}

      {tab === "epic-phases" && (
        <EpicPhaseGrid projectId={projectId} epics={epics} />
      )}

      {tab === "execution-plan" && (
        <ExecutionPlanTab projectId={projectId} stories={stories} />
      )}
    </div>
  )
}
