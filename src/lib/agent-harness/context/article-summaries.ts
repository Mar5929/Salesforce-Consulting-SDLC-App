/**
 * Article Summaries Context Loader — Two-Pass Retrieval (D-19)
 *
 * Pass 1: getArticleSummaries() — Lightweight fetch of all non-stale articles
 *         with title + summary excerpt. Cheap (~2K tokens for 20 articles).
 * Pass 2: getRelevantArticles() — Full content for specific article IDs.
 *         Called AFTER pass 1 determines which articles are most relevant.
 *
 * Uses scopedPrisma for project isolation (T-02-06).
 */

import { scopedPrisma } from "@/lib/project-scope"

export interface ArticleSummary {
  id: string
  title: string
  summary: string
  articleType: string
  confidence: string
}

export interface ArticleFull {
  id: string
  title: string
  content: string
  summary: string
  articleType: string
  confidence: string
}

/**
 * Pass 1: Fetch all non-stale articles with title and summary excerpt.
 * Lightweight operation suitable for initial context loading.
 */
export async function getArticleSummaries(
  projectId: string
): Promise<ArticleSummary[]> {
  const scoped = scopedPrisma(projectId)

  const articles = await scoped.knowledgeArticle.findMany({
    where: { isStale: false },
    select: {
      id: true,
      title: true,
      summary: true,
      articleType: true,
      confidence: true,
    },
    orderBy: { updatedAt: "desc" },
  })

  return articles.map((a: Record<string, unknown>) => ({
    id: a.id as string,
    title: a.title as string,
    summary: a.summary as string,
    articleType: a.articleType as string,
    confidence: a.confidence as string,
  }))
}

/**
 * Pass 2: Fetch full content for specific articles identified as relevant.
 * Called after pass 1 determines which articles matter for the current task.
 * Typically loads 3-5 articles maximum.
 */
export async function getRelevantArticles(
  projectId: string,
  articleIds: string[]
): Promise<ArticleFull[]> {
  if (articleIds.length === 0) return []

  const scoped = scopedPrisma(projectId)

  const articles = await scoped.knowledgeArticle.findMany({
    where: { id: { in: articleIds } },
    select: {
      id: true,
      title: true,
      content: true,
      summary: true,
      articleType: true,
      confidence: true,
    },
  })

  return articles.map((a: Record<string, unknown>) => ({
    id: a.id as string,
    title: a.title as string,
    content: a.content as string,
    summary: a.summary as string,
    articleType: a.articleType as string,
    confidence: a.confidence as string,
  }))
}
