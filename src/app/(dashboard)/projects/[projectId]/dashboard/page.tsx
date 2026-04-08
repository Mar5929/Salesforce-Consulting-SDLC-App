/**
 * Discovery Dashboard Page
 *
 * Server component that loads cached dashboard data and renders
 * four sections: health score, outstanding questions, blocked items,
 * and AI focus summaries.
 *
 * Architecture: D-24, D-25, DASH-01 through DASH-05
 */

import { notFound } from "next/navigation"
import { getCurrentMember } from "@/lib/auth"
import {
  getQuestionStats,
  getBlockedItems,
  computeHealthScore,
  getCachedBriefing,
} from "@/lib/dashboard/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HealthScore } from "@/components/dashboard/health-score"
import { OutstandingQuestions } from "@/components/dashboard/outstanding-questions"
import { BlockedItems } from "@/components/dashboard/blocked-items"
import { AiSummaryCard } from "@/components/dashboard/ai-summary-card"
import { EmptyState } from "@/components/shared/empty-state"
import { GenerateBriefingButton } from "@/components/dashboard/generate-briefing-button"

interface DashboardPageProps {
  params: Promise<{ projectId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { projectId } = await params

  // Auth check
  try {
    await getCurrentMember(projectId)
  } catch {
    notFound()
  }

  // Load all dashboard data in parallel (D-25 — cached data)
  const [questionStats, blockedItems, healthScore, briefing] =
    await Promise.all([
      getQuestionStats(projectId),
      getBlockedItems(projectId),
      computeHealthScore(projectId),
      getCachedBriefing(projectId),
    ])

  // Empty state: no questions means discovery hasn't started
  if (questionStats.total === 0 && !briefing.currentFocus) {
    return (
      <div>
        <h1 className="text-[24px] font-semibold text-foreground">
          Discovery Dashboard
        </h1>
        <div className="mt-6">
          <EmptyState
            heading="Discovery hasn't started"
            description="Process a transcript or create questions to begin building project intelligence."
            actionLabel="Process Transcript"
            actionHref={`/projects/${projectId}/transcripts`}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-semibold text-foreground">
          Discovery Dashboard
        </h1>
        <GenerateBriefingButton projectId={projectId} />
      </div>

      {/* Top row: Health Score (left) + Current Focus (right) */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Project Health</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <HealthScore
              score={healthScore.score}
              descriptor={healthScore.descriptor}
              breakdown={healthScore.breakdown}
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <AiSummaryCard
            title="Current Focus"
            content={briefing.currentFocus}
            lastUpdated={briefing.generatedAt}
          />
        </div>
      </div>

      {/* Middle: Outstanding Questions (full width) */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">
              Outstanding Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OutstandingQuestions stats={questionStats} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Blocked Items (left) + Recommended Focus (right) */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Blocked Items</CardTitle>
          </CardHeader>
          <CardContent>
            <BlockedItems items={blockedItems} />
          </CardContent>
        </Card>

        <AiSummaryCard
          title="Recommended Focus"
          content={briefing.recommendedFocus}
          lastUpdated={briefing.generatedAt}
        />
      </div>
    </div>
  )
}
