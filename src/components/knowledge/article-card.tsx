"use client"

/**
 * Article Card Component
 *
 * Displays a knowledge article summary with staleness badge,
 * source counts, and last refreshed timestamp. Clickable to
 * navigate to article detail.
 *
 * Architecture: D-16, UI-SPEC Knowledge Articles View
 */

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { StalenessBadge } from "./staleness-badge"
import { formatDistanceToNow } from "date-fns"

interface ArticleCardProps {
  article: {
    id: string
    title: string
    summary: string
    articleType: string
    isStale: boolean
    staleSince: Date | string | null
    lastRefreshedAt: Date | string | null
    questionCount: number
    decisionCount: number
    otherCount: number
    sourceCount: number
  }
  projectId: string
}

export function ArticleCard({ article, projectId }: ArticleCardProps) {
  // Build source count description
  const sourceParts: string[] = []
  if (article.questionCount > 0) {
    sourceParts.push(
      `${article.questionCount} question${article.questionCount !== 1 ? "s" : ""}`
    )
  }
  if (article.decisionCount > 0) {
    sourceParts.push(
      `${article.decisionCount} decision${article.decisionCount !== 1 ? "s" : ""}`
    )
  }
  if (article.otherCount > 0) {
    sourceParts.push(
      `${article.otherCount} other source${article.otherCount !== 1 ? "s" : ""}`
    )
  }
  const sourceDescription =
    sourceParts.length > 0 ? sourceParts.join(", ") : "No sources yet"

  const lastRefreshed = article.lastRefreshedAt
    ? formatDistanceToNow(new Date(article.lastRefreshedAt), {
        addSuffix: true,
      })
    : "Never"

  return (
    <Link href={`/projects/${projectId}/knowledge/${article.id}`}>
      <Card className="group cursor-pointer transition-colors hover:bg-[#F8F8F8]">
        <CardContent className="relative p-4">
          {/* Staleness badge top-right */}
          <div className="absolute right-4 top-4">
            <StalenessBadge
              isStale={article.isStale}
              staleSince={article.staleSince}
              lastRefreshedAt={article.lastRefreshedAt}
            />
          </div>

          {/* Title */}
          <h3 className="pr-20 text-[18px] font-semibold text-foreground">
            {article.title}
          </h3>

          {/* Summary excerpt (2 lines max) */}
          <p className="mt-1 line-clamp-2 text-[14px] font-normal text-muted-foreground">
            {article.summary}
          </p>

          {/* Source count + last refreshed */}
          <div className="mt-3 flex items-center gap-4">
            <span className="text-[13px] font-normal text-muted-foreground">
              {sourceDescription}
            </span>
            <span className="text-[13px] text-muted-foreground">
              Refreshed {lastRefreshed}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
