/**
 * Dashboard Data Queries
 *
 * Provides pre-computed data for the discovery dashboard:
 * - Question statistics by status (DASH-01)
 * - Blocked items with dependency chains (DASH-02)
 * - Health score with breakdown (DASH-03, D-26)
 * - Cached AI briefing content (DASH-04)
 *
 * All queries use scopedPrisma for project isolation (T-02-30).
 *
 * Tech spec Section 5, D-24
 */

import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface QuestionStats {
  total: number
  open: number
  answered: number
  parked: number
  byScope: {
    engagement: number
    epic: number
    feature: number
  }
}

export interface BlockedItem {
  questionId: string
  questionDisplayId: string
  questionText: string
  questionStatus: string
  blockedEntities: Array<{
    entityType: "STORY" | "EPIC" | "FEATURE"
    entityId: string
    entityDisplayId: string
    entityTitle: string
  }>
}

export type HealthDescriptor = "Good" | "Needs Attention" | "At Risk"

export interface HealthScoreBreakdown {
  answeredPercentage: number
  highPriorityResolved: number
  openHighRiskCount: number
  articleCoverage: number
  staleArticleCount: number
}

export interface HealthScore {
  score: number
  descriptor: HealthDescriptor
  breakdown: HealthScoreBreakdown
}

export interface CachedBriefing {
  currentFocus: string | null
  recommendedFocus: string | null
  keyRisks: string[]
  progressSummary: string | null
  knowledgeGaps: string[]
  generatedAt: Date | null
}

// ────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────

/**
 * Get question statistics grouped by status and scope (DASH-01).
 */
export async function getQuestionStats(
  projectId: string
): Promise<QuestionStats> {
  const db = scopedPrisma(projectId)

  const questions = await db.question.findMany({
    where: { projectId },
    select: {
      status: true,
      scope: true,
    },
  })

  return {
    total: questions.length,
    open: questions.filter((q) => q.status === "OPEN").length,
    answered: questions.filter((q) => q.status === "ANSWERED").length,
    parked: questions.filter((q) => q.status === "PARKED").length,
    byScope: {
      engagement: questions.filter((q) => q.scope === "ENGAGEMENT").length,
      epic: questions.filter((q) => q.scope === "EPIC").length,
      feature: questions.filter((q) => q.scope === "FEATURE").length,
    },
  }
}

/**
 * Get blocked items with dependency chain indicators (DASH-02).
 * Finds questions that block stories, epics, or features.
 */
export async function getBlockedItems(
  projectId: string
): Promise<BlockedItem[]> {
  const db = scopedPrisma(projectId)

  // Load questions that have any blocking relationships
  const questions = await db.question.findMany({
    where: {
      projectId,
      OR: [
        { questionBlocksStories: { some: {} } },
        { questionBlocksEpics: { some: {} } },
        { questionBlocksFeatures: { some: {} } },
      ],
    },
    select: {
      id: true,
      displayId: true,
      questionText: true,
      status: true,
      questionBlocksStories: {
        include: {
          story: {
            select: { id: true, displayId: true, title: true },
          },
        },
      },
      questionBlocksEpics: {
        include: {
          epic: {
            select: { id: true, prefix: true, name: true },
          },
        },
      },
      questionBlocksFeatures: {
        include: {
          feature: {
            select: { id: true, displayId: true, name: true },
          },
        },
      },
    },
  })

  return questions.map((q) => {
    const blockedEntities: BlockedItem["blockedEntities"] = []

    for (const bs of q.questionBlocksStories) {
      blockedEntities.push({
        entityType: "STORY",
        entityId: bs.story.id,
        entityDisplayId: bs.story.displayId,
        entityTitle: bs.story.title,
      })
    }

    for (const be of q.questionBlocksEpics) {
      blockedEntities.push({
        entityType: "EPIC",
        entityId: be.epic.id,
        entityDisplayId: be.epic.prefix,
        entityTitle: be.epic.name,
      })
    }

    for (const bf of q.questionBlocksFeatures) {
      blockedEntities.push({
        entityType: "FEATURE",
        entityId: bf.feature.id,
        entityDisplayId: bf.feature.displayId,
        entityTitle: bf.feature.name,
      })
    }

    return {
      questionId: q.id,
      questionDisplayId: q.displayId,
      questionText: q.questionText,
      questionStatus: q.status,
      blockedEntities,
    }
  })
}

/**
 * Compute project health score from discovery completeness (DASH-03, D-26).
 *
 * Weights per tech spec Section 5.2:
 * - Percentage of questions answered: 40%
 * - Percentage of high-priority (ENGAGEMENT scope) questions resolved: 20%
 * - Open high-risk count: 15%
 * - Knowledge article coverage: 15%
 * - Stale article count: 10%
 *
 * Thresholds: >= 70% = "Good", 40-69% = "Needs Attention", < 40% = "At Risk"
 */
export async function computeHealthScore(
  projectId: string
): Promise<HealthScore> {
  const db = scopedPrisma(projectId)

  const [questions, risks, articles] = await Promise.all([
    db.question.findMany({
      where: { projectId },
      select: { status: true, scope: true },
    }),
    db.risk.findMany({
      where: { projectId },
      select: { status: true, severity: true },
    }),
    db.knowledgeArticle.findMany({
      where: { projectId },
      select: { isStale: true },
    }),
  ])

  // 1. Percentage of questions answered (weight: 40%)
  const answeredPercentage =
    questions.length > 0
      ? (questions.filter((q) => q.status === "ANSWERED").length /
          questions.length) *
        100
      : 100 // No questions = full score

  // 2. Percentage of high-priority (ENGAGEMENT scope) questions resolved (weight: 20%)
  const engagementQuestions = questions.filter(
    (q) => q.scope === "ENGAGEMENT"
  )
  const highPriorityResolved =
    engagementQuestions.length > 0
      ? (engagementQuestions.filter((q) => q.status === "ANSWERED").length /
          engagementQuestions.length) *
        100
      : 100

  // 3. Open high-risk count (weight: 15%) — fewer open risks = higher score
  const openHighRisks = risks.filter(
    (r) => r.status === "OPEN" && r.severity === "CRITICAL"
  )
  const openHighRiskCount = openHighRisks.length
  // Score: 100 if 0 risks, decreasing by 20 per risk, min 0
  const riskScore = Math.max(0, 100 - openHighRiskCount * 20)

  // 4. Knowledge article coverage (weight: 15%) — at least 1 article = partial, 3+ = full
  const nonStaleArticles = articles.filter((a) => !a.isStale)
  const articleCoverage =
    articles.length === 0
      ? 0
      : Math.min(100, (nonStaleArticles.length / Math.max(3, articles.length)) * 100)

  // 5. Stale article count (weight: 10%) — fewer stale = higher score
  const staleCount = articles.filter((a) => a.isStale).length
  const staleArticleScore =
    articles.length === 0
      ? 100
      : Math.max(0, ((articles.length - staleCount) / articles.length) * 100)

  // Weighted score
  const score = Math.round(
    answeredPercentage * 0.4 +
      highPriorityResolved * 0.2 +
      riskScore * 0.15 +
      articleCoverage * 0.15 +
      staleArticleScore * 0.1
  )

  // Descriptor per UI-SPEC thresholds
  let descriptor: HealthDescriptor
  if (score >= 70) {
    descriptor = "Good"
  } else if (score >= 40) {
    descriptor = "Needs Attention"
  } else {
    descriptor = "At Risk"
  }

  return {
    score,
    descriptor,
    breakdown: {
      answeredPercentage: Math.round(answeredPercentage),
      highPriorityResolved: Math.round(highPriorityResolved),
      openHighRiskCount,
      articleCoverage: Math.round(articleCoverage),
      staleArticleCount: staleCount,
    },
  }
}

/**
 * Read pre-computed cached briefing from the Project record (DASH-04).
 * The briefing is written by the Inngest dashboard synthesis function.
 */
export async function getCachedBriefing(
  projectId: string
): Promise<CachedBriefing> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      cachedBriefingContent: true,
      cachedBriefingGeneratedAt: true,
    },
  })

  if (!project?.cachedBriefingContent) {
    return {
      currentFocus: null,
      recommendedFocus: null,
      keyRisks: [],
      progressSummary: null,
      knowledgeGaps: [],
      generatedAt: null,
    }
  }

  // Parse the JSON cached briefing
  const content = project.cachedBriefingContent as Record<string, unknown>

  return {
    currentFocus: (content.currentFocus as string) ?? null,
    recommendedFocus: (content.recommendedFocus as string) ?? null,
    keyRisks: Array.isArray(content.keyRisks)
      ? (content.keyRisks as string[])
      : [],
    progressSummary: (content.progressSummary as string) ?? null,
    knowledgeGaps: Array.isArray(content.knowledgeGaps)
      ? (content.knowledgeGaps as string[])
      : [],
    generatedAt: project.cachedBriefingGeneratedAt,
  }
}
