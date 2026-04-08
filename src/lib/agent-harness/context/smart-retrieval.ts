/**
 * Smart Context Retrieval for General Chat
 *
 * Two-pass retrieval strategy:
 * Pass 1: Load lightweight summaries from all project data sources in parallel
 * Pass 2: Semantic search via globalSearch to find content relevant to the user's message
 *
 * Token budget management ensures the assembled context stays within limits.
 */

import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getProjectSummary } from "./project-summary"
import { getOpenQuestions } from "./questions"
import { getRecentDecisions } from "./decisions"
import { getArticleSummaries } from "./article-summaries"
import { globalSearch, type SearchResult } from "@/lib/search/global-search"

// Token budget constants (1 token ~= 4 characters)
const TOKEN_BUDGET = 6000
const CHARS_PER_TOKEN = 4
const MAX_CHARS = TOKEN_BUDGET * CHARS_PER_TOKEN

function truncateToChars(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.substring(0, maxChars) + "..."
}

// ────────────────────────────────────────────
// Summary loaders
// ────────────────────────────────────────────

async function getStorySummaries(projectId: string): Promise<string> {
  const scoped = scopedPrisma(projectId)
  const stories = await scoped.story.findMany({
    select: { title: true, status: true, priority: true, storyPoints: true },
    orderBy: { updatedAt: "desc" },
    take: 30,
  })

  if (stories.length === 0) return ""

  const lines = stories.map(
    (s) =>
      `[${s.status}] ${s.title} (${s.priority}, ${s.storyPoints ?? "?"}pts)`
  )
  return `## Stories (${stories.length})\n${lines.join("\n")}`
}

async function getSprintSummary(projectId: string): Promise<string> {
  const scoped = scopedPrisma(projectId)
  const sprint = await scoped.sprint.findFirst({
    where: { status: "ACTIVE" },
    include: {
      stories: { select: { status: true, storyPoints: true } },
    },
  })

  if (!sprint) return ""

  const total = sprint.stories.length
  const done = sprint.stories.filter((s) => s.status === "DONE").length
  const totalPts = sprint.stories.reduce(
    (sum, s) => sum + (s.storyPoints ?? 0),
    0
  )

  return [
    `## Active Sprint: ${sprint.name}`,
    `- ${done}/${total} stories complete`,
    `- ${totalPts} total points`,
    `- ${sprint.startDate.toISOString().split("T")[0]} to ${sprint.endDate.toISOString().split("T")[0]}`,
  ].join("\n")
}

async function getOrgKnowledgeSummary(projectId: string): Promise<string> {
  const scoped = scopedPrisma(projectId)
  const components = await scoped.orgComponent.groupBy({
    by: ["componentType"],
    _count: { id: true },
  })

  if (components.length === 0) return ""

  const lines = components.map(
    (c) => `- ${c.componentType}: ${c._count.id}`
  )
  return `## Org Components\n${lines.join("\n")}`
}

async function getTranscriptSummary(projectId: string): Promise<string> {
  const scoped = scopedPrisma(projectId)
  const transcripts = await scoped.transcript.findMany({
    select: { title: true, uploadedAt: true, processingStatus: true },
    orderBy: { uploadedAt: "desc" },
    take: 10,
  })

  if (transcripts.length === 0) return ""

  const lines = transcripts.map(
    (t) =>
      `- ${t.title ?? "Untitled"} (${t.uploadedAt.toISOString().split("T")[0]}, ${t.processingStatus})`
  )
  return `## Transcripts (${transcripts.length})\n${lines.join("\n")}`
}

async function getDecisionSummaryFormatted(
  projectId: string
): Promise<string> {
  const decisions = await getRecentDecisions(projectId, 15)
  if (decisions.length === 0) return ""

  const lines = decisions.map(
    (d) =>
      `- [${d.displayId}] ${d.title}: ${d.rationale.substring(0, 100)}`
  )
  return `## Recent Decisions (${decisions.length})\n${lines.join("\n")}`
}

async function getQuestionSummaryFormatted(
  projectId: string
): Promise<string> {
  const questions = await getOpenQuestions(projectId, 20)
  if (questions.length === 0) return ""

  // Group by status
  const byStatus = new Map<string, number>()
  for (const q of questions) {
    byStatus.set(q.status, (byStatus.get(q.status) ?? 0) + 1)
  }

  const statusLine = Array.from(byStatus.entries())
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ")

  const topQuestions = questions.slice(0, 10).map(
    (q) => `- [${q.displayId}] [${q.status}] ${q.questionText}`
  )

  return `## Open Questions (${questions.length} — ${statusLine})\n${topQuestions.join("\n")}`
}

async function getArticleSummaryFormatted(
  projectId: string
): Promise<string> {
  const articles = await getArticleSummaries(projectId)
  if (articles.length === 0) return ""

  const top = articles.slice(0, 5)
  const lines = top.map((a) => `- ${a.title}: ${a.summary.substring(0, 100)}`)
  return `## Knowledge Articles (${articles.length})\n${lines.join("\n")}`
}

// ────────────────────────────────────────────
// Main assembly
// ────────────────────────────────────────────

export interface SmartChatContext {
  projectSummary: string
  summaries: {
    stories: string
    sprint: string
    orgKnowledge: string
    transcripts: string
    decisions: string
    questions: string
    articles: string
  }
  relevantFullContent: string
}

/**
 * Two-pass smart context assembly for general chat.
 * Pass 1: Load all 7 summary layers in parallel.
 * Pass 2: Semantic search for content relevant to the user's message.
 */
export async function assembleSmartChatContext(
  projectId: string,
  userMessage?: string
): Promise<SmartChatContext> {
  // Pass 1: Load all summaries in parallel
  const [
    projectSummary,
    stories,
    sprint,
    orgKnowledge,
    transcripts,
    decisions,
    questions,
    articles,
  ] = await Promise.all([
    getProjectSummary(projectId),
    getStorySummaries(projectId),
    getSprintSummary(projectId),
    getOrgKnowledgeSummary(projectId),
    getTranscriptSummary(projectId),
    getDecisionSummaryFormatted(projectId),
    getQuestionSummaryFormatted(projectId),
    getArticleSummaryFormatted(projectId),
  ])

  // Pass 2: Search for relevant content based on user message
  let relevantFullContent = ""
  if (userMessage?.trim()) {
    try {
      const searchResults = await globalSearch(projectId, userMessage, {
        limit: 5,
      })

      const allResults: SearchResult[] = [
        ...searchResults.questions,
        ...searchResults.articles,
        ...searchResults.decisions,
        ...searchResults.requirements,
        ...searchResults.risks,
      ]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      if (allResults.length > 0) {
        const resultLines = allResults.map(
          (r) =>
            `### [${r.entityType.toUpperCase()}] ${r.displayId}: ${r.title}\n${r.snippet}`
        )
        relevantFullContent = resultLines.join("\n\n")
      }
    } catch {
      // Graceful degradation: search failure doesn't block chat
    }
  }

  // Token budget: truncate if total exceeds budget
  const summaryParts = [stories, sprint, orgKnowledge, transcripts, decisions, questions, articles]
  const totalSummaryChars = summaryParts.reduce((sum, s) => sum + s.length, 0)
  const summaryBudget = MAX_CHARS - projectSummary.length - relevantFullContent.length

  // If summaries exceed budget, truncate proportionally
  const summaries = {
    stories,
    sprint,
    orgKnowledge,
    transcripts,
    decisions,
    questions,
    articles,
  }

  if (totalSummaryChars > summaryBudget && summaryBudget > 0) {
    const ratio = summaryBudget / totalSummaryChars
    summaries.stories = truncateToChars(stories, Math.floor(stories.length * ratio))
    summaries.decisions = truncateToChars(decisions, Math.floor(decisions.length * ratio))
    summaries.questions = truncateToChars(questions, Math.floor(questions.length * ratio))
    summaries.articles = truncateToChars(articles, Math.floor(articles.length * ratio))
  }

  return {
    projectSummary,
    summaries,
    relevantFullContent: truncateToChars(relevantFullContent, CHARS_PER_TOKEN * 2000),
  }
}
