/**
 * Knowledge Article Detail Page
 *
 * Server component that loads a single article and renders
 * the ArticleDetail component with full content, source references,
 * related entities, and version history.
 *
 * Architecture: D-17
 */

import { notFound } from "next/navigation"
import { getArticle } from "@/actions/knowledge"
import { ArticleDetail } from "@/components/knowledge/article-detail"

interface ArticlePageProps {
  params: Promise<{ projectId: string; articleId: string }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { projectId, articleId } = await params

  const result = await getArticle({ projectId, articleId })
  const article = result?.data

  if (!article) {
    notFound()
  }

  return (
    <div className="px-6 py-8">
      <ArticleDetail article={article} projectId={projectId} />
    </div>
  )
}
