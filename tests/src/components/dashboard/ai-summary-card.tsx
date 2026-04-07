/**
 * AI Summary Card Component (D-24, D-20, KNOW-06)
 *
 * Displays AI-generated focus summaries from cached dashboard synthesis.
 * Content is sanitized via HTML tag stripping (same pattern as article-detail.tsx).
 *
 * Threat mitigation: T-02-28 — AI markdown sanitized before rendering
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles } from "lucide-react"

interface AiSummaryCardProps {
  title: string
  content: string | null
  lastUpdated: Date | null
  loading?: boolean
}

/**
 * Strip HTML tags for safe rendering (T-02-28).
 * AI-generated content may contain markdown with embedded HTML.
 */
function sanitizeContent(text: string): string {
  return text.replace(/<[^>]*>/g, "")
}

/**
 * Simple markdown-to-text rendering for AI summaries.
 * Converts basic markdown (bold, italic, lists) to readable text.
 */
function renderMarkdown(text: string): string {
  const sanitized = sanitizeContent(text)
  return sanitized
    .replace(/\*\*(.*?)\*\*/g, "$1") // Strip bold markers for plain display
    .replace(/\*(.*?)\*/g, "$1") // Strip italic markers
    .trim()
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return "just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export function AiSummaryCard({
  title,
  content,
  lastUpdated,
  loading,
}: AiSummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <Sparkles className="size-4 text-[#2563EB]" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (!content) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <Sparkles className="size-4 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-muted-foreground">
            No AI synthesis available yet. Process a transcript or answer
            questions to generate insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <Sparkles className="size-4 text-[#2563EB]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
          {renderMarkdown(content)}
        </p>
        {lastUpdated && (
          <p className="mt-3 text-[12px] text-muted-foreground">
            Last updated: {formatTimeAgo(lastUpdated)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
