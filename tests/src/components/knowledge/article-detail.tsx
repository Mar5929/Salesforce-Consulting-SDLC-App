"use client"

/**
 * Article Detail Component
 *
 * Full article view with markdown content, source references,
 * related entities, and version history in collapsible sections.
 *
 * Architecture: D-17, UI-SPEC Article Detail View
 * Threat: T-02-21 — AI-generated markdown sanitized before rendering
 */

import Link from "next/link"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { StalenessBadge } from "./staleness-badge"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { formatDistanceToNow } from "date-fns"

interface SourceReferences {
  questions: Array<{
    id: string
    displayId: string
    questionText: string
    status: string
  }>
  decisions: Array<{
    id: string
    displayId: string
    title: string
  }>
}

interface RelatedEntities {
  epics: Array<{
    id: string
    prefix: string
    name: string
  }>
  stories: Array<{
    id: string
    displayId: string
    title: string
  }>
  businessProcesses: Array<{
    id: string
    name: string
    status: string
  }>
}

interface ArticleDetailProps {
  article: {
    id: string
    title: string
    content: string
    summary: string
    articleType: string
    confidence: string
    version: number
    isStale: boolean
    staleSince: Date | string | null
    lastRefreshedAt: Date | string | null
    authorType: string
    createdAt: Date | string
    updatedAt: Date | string
    sourceReferences: SourceReferences
    relatedEntities: RelatedEntities
  }
  projectId: string
}

/**
 * Sanitize and render markdown-like content safely.
 * Converts basic markdown to safe HTML without a full markdown parser.
 * Strips any HTML tags to prevent XSS (T-02-21).
 */
function sanitizeAndRender(content: string): string {
  // Strip all HTML tags first (T-02-21: prevent XSS from AI-generated content)
  let safe = content.replace(/<[^>]*>/g, "")

  // Convert markdown headings
  safe = safe.replace(/^### (.+)$/gm, '<h3 class="mt-4 mb-2 text-[16px] font-semibold">$1</h3>')
  safe = safe.replace(/^## (.+)$/gm, '<h2 class="mt-5 mb-2 text-[18px] font-semibold">$1</h2>')
  safe = safe.replace(/^# (.+)$/gm, '<h1 class="mt-6 mb-3 text-[20px] font-bold">$1</h1>')

  // Convert bold and italic
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  safe = safe.replace(/\*(.+?)\*/g, "<em>$1</em>")

  // Convert bullet lists
  safe = safe.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
  safe = safe.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')

  // Convert line breaks (double newline = paragraph)
  safe = safe.replace(/\n\n/g, '</p><p class="mb-3">')
  safe = `<p class="mb-3">${safe}</p>`

  return safe
}

export function ArticleDetail({ article, projectId }: ArticleDetailProps) {
  const lastRefreshed = article.lastRefreshedAt
    ? formatDistanceToNow(new Date(article.lastRefreshedAt), {
        addSuffix: true,
      })
    : "Never"

  const hasSourceRefs =
    article.sourceReferences.questions.length > 0 ||
    article.sourceReferences.decisions.length > 0

  const hasRelatedEntities =
    article.relatedEntities.epics.length > 0 ||
    article.relatedEntities.stories.length > 0 ||
    article.relatedEntities.businessProcesses.length > 0

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back navigation */}
      <Link
        href={`/projects/${projectId}/knowledge`}
        className="mb-6 inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to Knowledge
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <StalenessBadge
            isStale={article.isStale}
            staleSince={article.staleSince}
            lastRefreshedAt={article.lastRefreshedAt}
          />
          <span className="text-[13px] text-muted-foreground">
            Refreshed {lastRefreshed}
          </span>
          <span className="text-[13px] text-muted-foreground">
            v{article.version}
          </span>
        </div>
        <h1 className="text-[24px] font-semibold text-foreground">
          {article.title}
        </h1>
        <div className="mt-1 flex items-center gap-3">
          <span className="rounded-md bg-[#F0F0F0] px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
            {article.articleType.replace(/_/g, " ")}
          </span>
          <span className="text-[12px] text-muted-foreground">
            Confidence: {article.confidence}
          </span>
        </div>
      </div>

      {/* Article content (T-02-21: sanitized) */}
      <div
        className="prose prose-sm max-w-none text-[14px] leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{
          __html: sanitizeAndRender(article.content),
        }}
      />

      {/* Source References */}
      {hasSourceRefs && (
        <Collapsible defaultOpen className="mt-8 border-t border-[#E5E5E5] pt-4">
          <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
            <h2 className="text-[16px] font-semibold text-foreground">
              Source References
            </h2>
            <ChevronDown className="size-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-2">
              {article.sourceReferences.questions.map((q) => (
                <Link
                  key={q.id}
                  href={`/projects/${projectId}/questions?questionId=${q.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-[#F0F0F0]"
                >
                  <span className="font-medium text-[#2563EB]">
                    {q.displayId}
                  </span>
                  <span className="line-clamp-1 text-muted-foreground">
                    {q.questionText}
                  </span>
                  <span className="ml-auto shrink-0 rounded-md bg-[#F0F0F0] px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {q.status}
                  </span>
                </Link>
              ))}
              {article.sourceReferences.decisions.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
                >
                  <span className="font-medium text-[#2563EB]">
                    {d.displayId}
                  </span>
                  <span className="text-muted-foreground">{d.title}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Related Entities */}
      {hasRelatedEntities && (
        <Collapsible defaultOpen className="mt-6 border-t border-[#E5E5E5] pt-4">
          <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
            <h2 className="text-[16px] font-semibold text-foreground">
              Related Entities
            </h2>
            <ChevronDown className="size-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-2">
              {article.relatedEntities.businessProcesses.map((bp) => (
                <div
                  key={bp.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
                >
                  <span className="rounded-md bg-[#EDE9FE] px-1.5 py-0.5 text-[11px] font-medium text-[#7C3AED]">
                    Process
                  </span>
                  <span className="text-foreground">{bp.name}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {bp.status}
                  </span>
                </div>
              ))}
              {article.relatedEntities.epics.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
                >
                  <span className="rounded-md bg-[#DBEAFE] px-1.5 py-0.5 text-[11px] font-medium text-[#2563EB]">
                    Epic
                  </span>
                  <span className="text-foreground">
                    {e.prefix} {e.name}
                  </span>
                </div>
              ))}
              {article.relatedEntities.stories.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
                >
                  <span className="rounded-md bg-[#FEF3C7] px-1.5 py-0.5 text-[11px] font-medium text-[#B45309]">
                    Story
                  </span>
                  <span className="text-foreground">
                    {s.displayId} {s.title}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Version History */}
      <Collapsible className="mt-6 border-t border-[#E5E5E5] pt-4">
        <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
          <h2 className="text-[16px] font-semibold text-foreground">
            Version History
          </h2>
          <ChevronDown className="size-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-md px-2 py-1.5 text-[13px]">
              <span className="font-medium text-foreground">
                v{article.version}
              </span>
              <span className="text-muted-foreground">Current version</span>
              <span className="ml-auto text-[12px] text-muted-foreground">
                {article.lastRefreshedAt
                  ? formatDistanceToNow(new Date(article.lastRefreshedAt), {
                      addSuffix: true,
                    })
                  : formatDistanceToNow(new Date(article.updatedAt), {
                      addSuffix: true,
                    })}
              </span>
            </div>
            {article.version > 1 && (
              <p className="px-2 text-[12px] text-muted-foreground">
                Previous versions are tracked by version number. Full version
                diff will be available in a future update.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
