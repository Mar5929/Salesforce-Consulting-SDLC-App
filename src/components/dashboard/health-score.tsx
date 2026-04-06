/**
 * Health Score Component (D-26, DASH-03)
 *
 * Displays project health as a circular progress indicator with
 * color-coded descriptor text.
 *
 * Thresholds: >= 70% = Good (blue), 40-69% = Needs Attention (amber), < 40% = At Risk (red)
 */

import { cn } from "@/lib/utils"

interface HealthScoreProps {
  score: number
  descriptor: string
  breakdown?: {
    answeredPercentage: number
    highPriorityResolved: number
    openHighRiskCount: number
    articleCoverage: number
    staleArticleCount: number
  }
}

function getScoreColor(score: number): {
  ring: string
  text: string
  descriptor: string
} {
  if (score >= 70) {
    return {
      ring: "stroke-[#2563EB]",
      text: "text-[#2563EB]",
      descriptor: "text-[#2563EB]",
    }
  }
  if (score >= 40) {
    return {
      ring: "stroke-[#F59E0B]",
      text: "text-[#F59E0B]",
      descriptor: "text-[#F59E0B]",
    }
  }
  return {
    ring: "stroke-[#EF4444]",
    text: "text-[#EF4444]",
    descriptor: "text-[#EF4444]",
  }
}

export function HealthScore({ score, descriptor, breakdown }: HealthScoreProps) {
  const colors = getScoreColor(score)

  // SVG circular progress parameters
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circular progress ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F0F0F0"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={colors.ring}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        {/* Score text centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-[24px] font-semibold", colors.text)}>
            {score}%
          </span>
        </div>
      </div>

      {/* Descriptor */}
      <span className={cn("text-[13px] font-semibold", colors.descriptor)}>
        {descriptor}
      </span>

      {/* Breakdown details (optional) */}
      {breakdown && (
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          <span>Questions answered</span>
          <span className="text-right font-medium text-foreground">
            {breakdown.answeredPercentage}%
          </span>
          <span>High priority resolved</span>
          <span className="text-right font-medium text-foreground">
            {breakdown.highPriorityResolved}%
          </span>
          <span>Open critical risks</span>
          <span className="text-right font-medium text-foreground">
            {breakdown.openHighRiskCount}
          </span>
          <span>Article coverage</span>
          <span className="text-right font-medium text-foreground">
            {breakdown.articleCoverage}%
          </span>
          <span>Stale articles</span>
          <span className="text-right font-medium text-foreground">
            {breakdown.staleArticleCount}
          </span>
        </div>
      )}
    </div>
  )
}
