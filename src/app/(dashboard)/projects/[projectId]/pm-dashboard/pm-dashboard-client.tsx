"use client"

/**
 * PM Dashboard Client Component
 *
 * Handles SWR polling for live dashboard data updates.
 * Renders stat cards, charts, and activity lists.
 * Shows skeleton loading states during initial fetch.
 * Empty state per UI-SPEC when no data is available.
 *
 * SWR refreshInterval: 30s for near-real-time updates.
 */

import useSWR from "swr"
import { getPmDashboardData } from "@/actions/pm-dashboard"
import { StatCards } from "@/components/pm-dashboard/stat-cards"
import { WorkProgressChart } from "@/components/pm-dashboard/work-progress-chart"
import { AiUsageCharts } from "@/components/pm-dashboard/ai-usage-charts"
import { QaSummary } from "@/components/pm-dashboard/qa-summary"
import { SprintVelocityChart } from "@/components/pm-dashboard/sprint-velocity-chart"
import { TeamActivity } from "@/components/pm-dashboard/team-activity"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import type { PmDashboardData } from "@/lib/inngest/functions/pm-dashboard-synthesis"

interface PmDashboardClientProps {
  projectId: string
}

async function fetchDashboardData(projectId: string): Promise<PmDashboardData | null> {
  const result = await getPmDashboardData({ projectId })
  if (result?.data?.data) {
    return result.data.data as PmDashboardData
  }
  return null
}

export function PmDashboardClient({ projectId }: PmDashboardClientProps) {
  const { data, isLoading } = useSWR(
    `pm-dashboard-${projectId}`,
    () => fetchDashboardData(projectId),
    { refreshInterval: 30000 }
  )

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <h2 className="text-[18px] font-semibold text-foreground">
              Dashboard is building
            </h2>
            <p className="text-[14px] text-muted-foreground">
              The PM dashboard populates as your project progresses. Process
              transcripts, create stories, and run sprints to see data here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Stat Cards (health, stories, AI cost, knowledge coverage) */}
      <StatCards
        healthScore={data.health.score}
        healthLabel={data.health.label}
        storiesCompleted={data.storiesCompleted}
        storiesTotal={data.storiesTotal}
        aiCostTotal={data.aiUsage.totalCost}
        knowledgeCoverage={data.knowledgeCoverage}
      />

      {/* Row 2: Work Progress (stories by status + by assignee) */}
      <WorkProgressChart
        storiesByStatus={data.storiesByStatus}
        storiesByAssignee={data.storiesByAssignee}
      />

      {/* Row 3: AI Usage + QA Summary side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AiUsageCharts
          costOverTime={data.aiUsage.costOverTime}
          costByArea={data.aiUsage.costByArea}
          totalCost={data.aiUsage.totalCost}
        />
        <QaSummary
          passCount={data.qa.passCount}
          failCount={data.qa.failCount}
          blockedCount={data.qa.blockedCount}
          defectsBySeverity={data.qa.defectsBySeverity}
          openDefectCount={data.qa.openDefectCount}
          questionsByStatus={data.questionsByStatus}
        />
      </div>

      {/* Row 4: Sprint Velocity (full width) */}
      <SprintVelocityChart velocity={data.sprintVelocity} />

      {/* Row 5: Team Activity (full width) */}
      <TeamActivity activities={data.teamActivity} />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="mb-1 h-7 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="mb-4 h-5 w-32" />
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="mb-4 h-5 w-32" />
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* More skeleton rows */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="mb-4 h-5 w-32" />
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
