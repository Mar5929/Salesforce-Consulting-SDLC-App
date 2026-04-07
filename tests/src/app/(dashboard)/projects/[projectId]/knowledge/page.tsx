/**
 * Knowledge Base Page
 *
 * Lists all knowledge articles for a project with staleness badges,
 * source counts, and a search filter. Empty state guides users to
 * process transcripts to seed the knowledge base.
 *
 * Architecture: D-16, KNOW-01
 */

import { getArticles } from "@/actions/knowledge"
import { ArticleCard } from "@/components/knowledge/article-card"
import { EmptyState } from "@/components/shared/empty-state"
import { KnowledgeSearch } from "./knowledge-search"

interface KnowledgePageProps {
  params: Promise<{ projectId: string }>
}

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { projectId } = await params

  const result = await getArticles({ projectId })
  const articles = result?.data ?? []

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-foreground">
          Knowledge Base
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          AI-synthesized understanding from your project&apos;s discovery data
        </p>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          heading="Knowledge base is building"
          description="Knowledge articles are automatically created and updated as you process transcripts, answer questions, and capture decisions."
          actionLabel="Process Transcript"
          actionHref={`/projects/${projectId}/transcripts`}
        />
      ) : (
        <>
          <KnowledgeSearch articles={articles} projectId={projectId} />
        </>
      )}
    </div>
  )
}
