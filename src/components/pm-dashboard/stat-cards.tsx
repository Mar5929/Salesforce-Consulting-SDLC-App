"use client"

/**
 * PM Dashboard Stat Cards
 *
 * Four stat cards: Health Score, Stories Progress, AI Cost, Knowledge Coverage (D-14).
 * Color-coded health thresholds: >=70% accent, 40-69% amber, <40% destructive.
 */

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardsProps {
  healthScore: number
  healthLabel: string
  storiesCompleted: number
  storiesTotal: number
  aiCostTotal: number
  knowledgeCoverage: {
    coveragePercent: number
    staleCount: number
  }
}

function getHealthColor(score: number): string {
  if (score >= 70) return "text-[#2563EB]"
  if (score >= 40) return "text-[#F59E0B]"
  return "text-[#EF4444]"
}

export function StatCards({
  healthScore,
  healthLabel,
  storiesCompleted,
  storiesTotal,
  aiCostTotal,
  knowledgeCoverage,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Health Score */}
      <Card>
        <CardContent className="p-4">
          <p className="text-[13px] font-normal text-muted-foreground">
            Health Score
          </p>
          <p
            className={cn(
              "mt-1 text-[24px] font-semibold",
              getHealthColor(healthScore)
            )}
          >
            {healthScore}%
          </p>
          <p
            className={cn(
              "text-[13px] font-normal",
              getHealthColor(healthScore)
            )}
          >
            {healthLabel}
          </p>
        </CardContent>
      </Card>

      {/* Stories Progress */}
      <Card>
        <CardContent className="p-4">
          <p className="text-[13px] font-normal text-muted-foreground">
            Stories
          </p>
          <p className="mt-1 text-[24px] font-semibold text-foreground">
            {storiesCompleted} / {storiesTotal}
          </p>
          <p className="text-[13px] font-normal text-muted-foreground">
            completed
          </p>
        </CardContent>
      </Card>

      {/* AI Cost */}
      <Card>
        <CardContent className="p-4">
          <p className="text-[13px] font-normal text-muted-foreground">
            AI Cost
          </p>
          <p className="mt-1 text-[24px] font-semibold text-foreground">
            ${aiCostTotal.toFixed(2)}
          </p>
          <p className="text-[13px] font-normal text-muted-foreground">
            this month
          </p>
        </CardContent>
      </Card>

      {/* Knowledge Coverage (D-14) */}
      <Card>
        <CardContent className="p-4">
          <p className="text-[13px] font-normal text-muted-foreground">
            Knowledge Coverage
          </p>
          <p className="mt-1 text-[24px] font-semibold text-foreground">
            {knowledgeCoverage.coveragePercent}%
          </p>
          <p className="text-[13px] font-normal text-muted-foreground">
            {knowledgeCoverage.staleCount} stale articles
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
