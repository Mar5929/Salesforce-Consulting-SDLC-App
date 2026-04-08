"use client"

import { useState, useCallback } from "react"
import { AiSummaryCard } from "@/components/dashboard/ai-summary-card"
import { Button } from "@/components/ui/button"
import { Sparkles, RefreshCw } from "lucide-react"

interface MilestoneAiSummaryProps {
  projectId: string
  milestones: Array<{
    id: string
    name: string
    targetDate: string | null
    status: string
    milestoneStories: Array<{
      story: {
        id: string
        displayId: string
        title: string
        status: string
      }
    }>
  }>
}

interface MilestoneSummary {
  milestoneId: string
  content: string
  generatedAt: Date
}

function generateSummaryText(
  milestone: MilestoneAiSummaryProps["milestones"][number]
): string {
  const stories = milestone.milestoneStories.map((ms) => ms.story)
  const total = stories.length
  const complete = stories.filter((s) => s.status === "DONE").length
  const remaining = total - complete

  if (total === 0) {
    return "No stories assigned to this milestone yet."
  }

  const remainingStories = stories.filter((s) => s.status !== "DONE")
  const listedTitles = remainingStories
    .slice(0, 3)
    .map((s) => s.displayId + " " + s.title)
    .join(", ")

  const parts: string[] = []
  parts.push(`${complete} of ${total} stories complete.`)

  if (remaining > 0) {
    parts.push(
      `${remaining} ${remaining === 1 ? "story" : "stories"} remaining: ${listedTitles}${remainingStories.length > 3 ? ` and ${remainingStories.length - 3} more` : ""}.`
    )
  }

  const blocked = stories.filter((s) => s.status === "BLOCKED")
  if (blocked.length > 0) {
    parts.push(
      `${blocked.length} ${blocked.length === 1 ? "story is" : "stories are"} currently blocked.`
    )
  }

  return parts.join(" ")
}

function sortMilestones(
  milestones: MilestoneAiSummaryProps["milestones"]
): MilestoneAiSummaryProps["milestones"] {
  return [...milestones].sort((a, b) => {
    // nulls last
    if (a.targetDate && !b.targetDate) return -1
    if (!a.targetDate && b.targetDate) return 1
    if (a.targetDate && b.targetDate) {
      return a.targetDate.localeCompare(b.targetDate)
    }
    return 0
  })
}

export function MilestoneAiSummary({
  milestones,
}: MilestoneAiSummaryProps) {
  const [summaries, setSummaries] = useState<MilestoneSummary[]>([])
  const [loading, setLoading] = useState(false)

  const upcomingMilestones = sortMilestones(
    milestones.filter(
      (m) => m.status === "NOT_STARTED" || m.status === "IN_PROGRESS"
    )
  ).slice(0, 3)

  const generateSummaries = useCallback(() => {
    setLoading(true)
    // Simulate async to allow UI to show loading state
    const timer = setTimeout(() => {
      const generated = upcomingMilestones.map((m) => ({
        milestoneId: m.id,
        content: generateSummaryText(m),
        generatedAt: new Date(),
      }))
      setSummaries(generated)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [upcomingMilestones])

  if (upcomingMilestones.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-[#2563EB]" />
          <h2 className="text-[16px] font-semibold">Upcoming Milestones</h2>
        </div>
        <p className="text-[13px] text-muted-foreground">
          No upcoming milestones
        </p>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-[#2563EB]" />
          <h2 className="text-[16px] font-semibold">Upcoming Milestones</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummaries}
          disabled={loading}
        >
          <RefreshCw
            className={`size-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          {summaries.length === 0 ? "Generate Summaries" : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingMilestones.map((milestone) => {
          const summary = summaries.find(
            (s) => s.milestoneId === milestone.id
          )
          return (
            <AiSummaryCard
              key={milestone.id}
              title={milestone.name}
              content={summary?.content ?? null}
              lastUpdated={summary?.generatedAt ?? null}
              loading={loading}
            />
          )
        })}
      </div>
    </section>
  )
}
