/**
 * Three-layer global search: filtered + full-text (tsvector) + semantic (pgvector)
 *
 * Layer 1 - Filtered: Parses structured queries like "status:open category:technical"
 * Layer 2 - Full-text: tsvector search via $queryRaw with ts_headline for snippets
 * Layer 3 - Semantic: pgvector cosine similarity via embeddings
 *
 * Results are merged, deduplicated, and ranked by combined score.
 * Graceful degradation: if embeddings unavailable, returns full-text + filtered only.
 *
 * SECURITY: All raw SQL uses tagged template literals ($queryRaw) — NEVER $queryRawUnsafe.
 * All queries include projectId filter for cross-project isolation (T-02-26).
 */

import { prisma } from "@/lib/db"
import { generateEmbedding } from "./embeddings"
import { Prisma } from "../../generated/prisma"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SearchEntityType = "question" | "decision" | "article" | "requirement" | "risk"

export interface SearchResult {
  id: string
  displayId: string
  title: string
  snippet: string
  entityType: SearchEntityType
  score: number
  status?: string
  isStale?: boolean
}

export interface SearchOptions {
  types?: SearchEntityType[]
  limit?: number
}

export interface GroupedSearchResults {
  questions: SearchResult[]
  articles: SearchResult[]
  decisions: SearchResult[]
  requirements: SearchResult[]
  risks: SearchResult[]
  totalCount: number
}

// ---------------------------------------------------------------------------
// Structured filter parsing
// ---------------------------------------------------------------------------

interface ParsedFilter {
  field: string
  value: string
}

interface ParseResult {
  filters: ParsedFilter[]
  freeText: string
}

const FILTER_PATTERN = /(\w+):(\S+)/g

function parseQuery(query: string): ParseResult {
  const filters: ParsedFilter[] = []
  let freeText = query

  let match: RegExpExecArray | null
  while ((match = FILTER_PATTERN.exec(query)) !== null) {
    filters.push({ field: match[1].toLowerCase(), value: match[2] })
    freeText = freeText.replace(match[0], "")
  }

  freeText = freeText.trim()
  return { filters, freeText }
}

// ---------------------------------------------------------------------------
// Layer 1: Filtered search (SRCH-01)
// ---------------------------------------------------------------------------

async function filteredSearch(
  projectId: string,
  filters: ParsedFilter[],
  types: SearchEntityType[],
  limit: number
): Promise<SearchResult[]> {
  if (filters.length === 0) return []

  const results: SearchResult[] = []

  // Build Prisma where clauses from filters
  const statusFilter = filters.find((f) => f.field === "status")?.value.toUpperCase()
  const confidenceFilter = filters.find((f) => f.field === "confidence")?.value.toUpperCase()
  const scopeFilter = filters.find((f) => f.field === "scope")?.value.toUpperCase()
  const priorityFilter = filters.find((f) => f.field === "priority")?.value.toUpperCase()

  if (types.includes("question") && (statusFilter || confidenceFilter || scopeFilter)) {
    const where: Record<string, unknown> = { projectId }
    if (statusFilter) where.status = statusFilter
    if (confidenceFilter) where.confidence = confidenceFilter
    if (scopeFilter) where.scope = scopeFilter

    const questions = await prisma.question.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
    })
    results.push(
      ...questions.map((q) => ({
        id: q.id,
        displayId: q.displayId,
        title: q.questionText.substring(0, 120),
        snippet: q.answerText?.substring(0, 200) ?? "",
        entityType: "question" as const,
        score: 1.0, // Exact match
        status: q.status,
      }))
    )
  }

  if (types.includes("decision") && (confidenceFilter)) {
    const where: Record<string, unknown> = { projectId }
    if (confidenceFilter) where.confidence = confidenceFilter

    const decisions = await prisma.decision.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
    })
    results.push(
      ...decisions.map((d) => ({
        id: d.id,
        displayId: d.displayId,
        title: d.title,
        snippet: d.rationale.substring(0, 200),
        entityType: "decision" as const,
        score: 1.0,
      }))
    )
  }

  if (types.includes("requirement") && (statusFilter || priorityFilter)) {
    const where: Record<string, unknown> = { projectId }
    if (statusFilter) where.status = statusFilter
    if (priorityFilter) where.priority = priorityFilter

    const requirements = await prisma.requirement.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
    })
    results.push(
      ...requirements.map((r) => ({
        id: r.id,
        displayId: r.displayId,
        title: r.displayId,
        snippet: r.description.substring(0, 200),
        entityType: "requirement" as const,
        score: 1.0,
        status: r.status,
      }))
    )
  }

  if (types.includes("risk") && (statusFilter)) {
    const where: Record<string, unknown> = { projectId }
    if (statusFilter) where.status = statusFilter

    const risks = await prisma.risk.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
    })
    results.push(
      ...risks.map((r) => ({
        id: r.id,
        displayId: r.displayId,
        title: r.displayId,
        snippet: r.description.substring(0, 200),
        entityType: "risk" as const,
        score: 1.0,
        status: r.status,
      }))
    )
  }

  return results
}

// ---------------------------------------------------------------------------
// Layer 2: Full-text search via tsvector (SRCH-02)
// ---------------------------------------------------------------------------

interface FullTextRow {
  id: string
  display_id: string
  title: string
  snippet: string
  rank: number
  status: string | null
  is_stale: boolean | null
}

async function fullTextSearch(
  projectId: string,
  query: string,
  types: SearchEntityType[],
  limit: number
): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const results: SearchResult[] = []
  const perTypeLimit = Math.ceil(limit / types.length)

  if (types.includes("question")) {
    const rows = await prisma.$queryRaw<FullTextRow[]>`
      SELECT
        id,
        "displayId" as display_id,
        LEFT("questionText", 120) as title,
        ts_headline('english', "questionText" || ' ' || COALESCE("answerText", ''), plainto_tsquery('english', ${query}),
          'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') as snippet,
        ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank,
        status,
        NULL::boolean as is_stale
      FROM "Question"
      WHERE "projectId" = ${projectId}
        AND search_vector @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${perTypeLimit}
    `
    results.push(...rows.map(toSearchResult("question")))
  }

  if (types.includes("decision")) {
    const rows = await prisma.$queryRaw<FullTextRow[]>`
      SELECT
        id,
        "displayId" as display_id,
        title,
        ts_headline('english', title || ' ' || COALESCE(rationale, ''), plainto_tsquery('english', ${query}),
          'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') as snippet,
        ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank,
        NULL as status,
        NULL::boolean as is_stale
      FROM "Decision"
      WHERE "projectId" = ${projectId}
        AND search_vector @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${perTypeLimit}
    `
    results.push(...rows.map(toSearchResult("decision")))
  }

  if (types.includes("article")) {
    const rows = await prisma.$queryRaw<FullTextRow[]>`
      SELECT
        id,
        id as display_id,
        title,
        ts_headline('english', title || ' ' || COALESCE(content, ''), plainto_tsquery('english', ${query}),
          'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') as snippet,
        ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank,
        NULL as status,
        "isStale" as is_stale
      FROM "KnowledgeArticle"
      WHERE "projectId" = ${projectId}
        AND search_vector @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${perTypeLimit}
    `
    results.push(...rows.map(toSearchResult("article")))
  }

  if (types.includes("requirement")) {
    const rows = await prisma.$queryRaw<FullTextRow[]>`
      SELECT
        id,
        "displayId" as display_id,
        "displayId" as title,
        ts_headline('english', COALESCE(description, ''), plainto_tsquery('english', ${query}),
          'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') as snippet,
        ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank,
        status,
        NULL::boolean as is_stale
      FROM "Requirement"
      WHERE "projectId" = ${projectId}
        AND search_vector @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${perTypeLimit}
    `
    results.push(...rows.map(toSearchResult("requirement")))
  }

  if (types.includes("risk")) {
    const rows = await prisma.$queryRaw<FullTextRow[]>`
      SELECT
        id,
        "displayId" as display_id,
        "displayId" as title,
        ts_headline('english', COALESCE(description, ''), plainto_tsquery('english', ${query}),
          'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') as snippet,
        ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank,
        status,
        NULL::boolean as is_stale
      FROM "Risk"
      WHERE "projectId" = ${projectId}
        AND search_vector @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${perTypeLimit}
    `
    results.push(...rows.map(toSearchResult("risk")))
  }

  return results
}

function toSearchResult(entityType: SearchEntityType) {
  return (row: FullTextRow): SearchResult => ({
    id: row.id,
    displayId: row.display_id,
    title: row.title,
    snippet: row.snippet,
    entityType,
    score: Number(row.rank),
    status: row.status ?? undefined,
    isStale: row.is_stale ?? undefined,
  })
}

// ---------------------------------------------------------------------------
// Layer 3: Semantic search via pgvector (SRCH-03)
// ---------------------------------------------------------------------------

interface SemanticRow {
  id: string
  display_id: string
  title: string
  snippet: string
  similarity: number
  status: string | null
  is_stale: boolean | null
}

async function semanticSearch(
  projectId: string,
  queryEmbedding: number[],
  types: SearchEntityType[],
  limit: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  const perTypeLimit = Math.ceil(limit / types.length)
  const vectorStr = `[${queryEmbedding.join(",")}]`

  // Only KnowledgeArticle has embedding column in schema currently
  if (types.includes("article")) {
    const rows = await prisma.$queryRaw<SemanticRow[]>`
      SELECT
        id,
        id as display_id,
        title,
        LEFT(content, 200) as snippet,
        1 - (embedding <=> ${vectorStr}::vector) as similarity,
        NULL as status,
        "isStale" as is_stale
      FROM "KnowledgeArticle"
      WHERE "projectId" = ${projectId}
        AND embedding IS NOT NULL
        AND "embeddingStatus" = 'COMPLETED'
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${perTypeLimit}
    `
    results.push(
      ...rows.map(
        (row): SearchResult => ({
          id: row.id,
          displayId: row.display_id,
          title: row.title,
          snippet: row.snippet,
          entityType: "article",
          score: Number(row.similarity),
          isStale: row.is_stale ?? undefined,
        })
      )
    )
  }

  return results
}

// ---------------------------------------------------------------------------
// Merge & deduplicate
// ---------------------------------------------------------------------------

const FULL_TEXT_WEIGHT = 0.6
const SEMANTIC_WEIGHT = 0.4

function mergeResults(
  filtered: SearchResult[],
  fullText: SearchResult[],
  semantic: SearchResult[],
  limit: number
): SearchResult[] {
  const seen = new Map<string, SearchResult>()

  // Filtered results get highest priority (exact matches)
  for (const r of filtered) {
    const key = `${r.entityType}:${r.id}`
    seen.set(key, { ...r, score: 2.0 }) // Boosted above text/semantic
  }

  // Full-text results
  for (const r of fullText) {
    const key = `${r.entityType}:${r.id}`
    const existing = seen.get(key)
    if (existing) {
      existing.score = Math.max(existing.score, r.score * FULL_TEXT_WEIGHT + existing.score)
    } else {
      seen.set(key, { ...r, score: r.score * FULL_TEXT_WEIGHT })
    }
  }

  // Semantic results
  for (const r of semantic) {
    const key = `${r.entityType}:${r.id}`
    const existing = seen.get(key)
    if (existing) {
      existing.score = Math.max(existing.score, r.score * SEMANTIC_WEIGHT + existing.score)
    } else {
      seen.set(key, { ...r, score: r.score * SEMANTIC_WEIGHT })
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function groupResults(results: SearchResult[]): GroupedSearchResults {
  const grouped: GroupedSearchResults = {
    questions: [],
    articles: [],
    decisions: [],
    requirements: [],
    risks: [],
    totalCount: results.length,
  }

  for (const r of results) {
    switch (r.entityType) {
      case "question":
        grouped.questions.push(r)
        break
      case "article":
        grouped.articles.push(r)
        break
      case "decision":
        grouped.decisions.push(r)
        break
      case "requirement":
        grouped.requirements.push(r)
        break
      case "risk":
        grouped.risks.push(r)
        break
    }
  }

  return grouped
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

const ALL_TYPES: SearchEntityType[] = ["question", "decision", "article", "requirement", "risk"]
const DEFAULT_LIMIT = 20

export async function globalSearch(
  projectId: string,
  query: string,
  options?: SearchOptions
): Promise<GroupedSearchResults> {
  const types = options?.types ?? ALL_TYPES
  const limit = options?.limit ?? DEFAULT_LIMIT

  if (!query.trim()) {
    return { questions: [], articles: [], decisions: [], requirements: [], risks: [], totalCount: 0 }
  }

  const { filters, freeText } = parseQuery(query)

  // Run all three layers in parallel
  const [filteredResults, fullTextResults, semanticResults] = await Promise.all([
    // Layer 1: Filtered
    filteredSearch(projectId, filters, types, limit),

    // Layer 2: Full-text
    fullTextSearch(projectId, freeText || query, types, limit),

    // Layer 3: Semantic (graceful fallback if unavailable)
    (async () => {
      if (!freeText && filters.length > 0) return [] // Pure filter query, skip semantic
      const searchText = freeText || query
      const embedding = await generateEmbedding(searchText)
      if (!embedding) return [] // Voyage API not configured or failed
      return semanticSearch(projectId, embedding, types, limit)
    })(),
  ])

  const merged = mergeResults(filteredResults, fullTextResults, semanticResults, limit)
  return groupResults(merged)
}
