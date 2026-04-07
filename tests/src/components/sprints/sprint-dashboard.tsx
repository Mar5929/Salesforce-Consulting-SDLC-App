"use client"

/**
 * Sprint Dashboard (D-13)
 *
 * Shows sprint progress at a glance:
 * 1. Header: sprint goal + date range + progress bar
 * 2. Summary cards: total stories, points completed, points remaining
 * 3. Burndown chart
 */

import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BurndownChart } from "@/components/sprints/burndown-chart"
import { computeBurndown } from "@/lib/burndown"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface DashboardStory {
  id: string
  status: string
  storyPoints: number | null
  updatedAt: Date | string
}

export interface SprintDashboardProps {
  sprint: {
    name: string
    goal: string | null
    startDate: Date | string
    endDate: Date | string
    stories: DashboardStory[]
  }
}

// ────────────────────────────────────────────
// Sprint Dashboard
// ────────────────────────────────────────────

export function SprintDashboard({ sprint }: SprintDashboardProps) {
  const startDate = new Date(sprint.startDate)
  const endDate = new Date(sprint.endDate)

  const totalStories = sprint.stories.length
  const totalPoints = sprint.stories.reduce(
    (sum, s) => sum + (s.storyPoints ?? 0),
    0
  )
  const pointsCompleted = sprint.stories
    .filter((s) => s.status === "DONE")
    .reduce((sum, s) => sum + (s.storyPoints ?? 0), 0)
  const pointsRemaining = totalPoints - pointsCompleted

  const progressPercent = totalPoints > 0 ? (pointsCompleted / totalPoints) * 100 : 0

  // Compute burndown data
  const burndownStories = sprint.stories.map((s) => ({
    storyPoints: s.storyPoints,
    status: s.status,
    updatedAt: new Date(s.updatedAt),
  }))
  const burndownData = computeBurndown(startDate, endDate, burndownStories)

  return (
    <div className="flex flex-col gap-6">
      {/* Header: goal + date range + progress */}
      <div className="flex flex-col gap-3">
        {sprint.goal && (
          <p className="text-[14px] text-[#525252]">{sprint.goal}</p>
        )}
        <div className="flex items-center gap-3 text-[13px] text-[#737373]">
          <span>
            {format(startDate, "MMM d, yyyy")} &ndash;{" "}
            {format(endDate, "MMM d, yyyy")}
          </span>
          <span className="font-medium text-[#171717]">
            {pointsCompleted} / {totalPoints} points
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-medium text-[#737373]">
              Total Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalStories}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-medium text-[#737373]">
              Points Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#16A34A]">
              {pointsCompleted}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-medium text-[#737373]">
              Points Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#EA580C]">
              {pointsRemaining}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Burndown chart */}
      <BurndownChart data={burndownData} />
    </div>
  )
}
