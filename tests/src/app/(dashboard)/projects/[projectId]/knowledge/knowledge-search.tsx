"use client"

/**
 * Knowledge Search Client Component
 *
 * Client-side search filter on article titles. Full global search
 * comes in Plan 07 — this provides basic filtering for now.
 */

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ArticleCard } from "@/components/knowledge/article-card"

interface Article {
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

interface KnowledgeSearchProps {
  articles: Article[]
  projectId: string
}

export function KnowledgeSearch({ articles, projectId }: KnowledgeSearchProps) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return articles
    const lower = search.toLowerCase()
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.summary.toLowerCase().includes(lower)
    )
  }, [articles, search])

  return (
    <>
      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Article list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted-foreground">
            No articles match your search
          </p>
        ) : (
          filtered.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              projectId={projectId}
            />
          ))
        )}
      </div>
    </>
  )
}
