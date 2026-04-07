/**
 * Staleness Detection Inngest Function
 *
 * Triggered by ENTITY_CONTENT_CHANGED events (question answered, decision created, etc.).
 * Finds affected knowledge articles and flags them as stale, or bootstraps
 * the first article for new projects with no knowledge base.
 *
 * Architecture: D-18, KNOW-02, KNOW-03
 * Threat mitigations:
 * - T-02-22: Scoped to affected articles only, not full scan
 * - T-02-23: Project-scoped queries
 */

import { inngest } from "../client"
import { EVENTS } from "../events"
import { prisma } from "@/lib/db"

export const stalenessDetectionFunction = inngest.createFunction(
  {
    id: "staleness-detection",
    retries: 2,
    triggers: [{ event: EVENTS.ENTITY_CONTENT_CHANGED }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { projectId, entityType, entityId, description } = event.data as {
      projectId: string
      entityType: string
      entityId: string
      description?: string
    }

    if (!projectId || !entityType || !entityId) {
      return { skipped: true, reason: "Missing required event data" }
    }

    // Step 1: Find affected articles that reference the changed entity
    const affectedArticles = await step.run(
      "find-affected-articles",
      async () => {
        const refs = await prisma.knowledgeArticleReference.findMany({
          where: {
            entityType: entityType as "QUESTION" | "DECISION" | "BUSINESS_PROCESS" | "ORG_COMPONENT" | "EPIC" | "STORY",
            entityId,
          },
          select: {
            articleId: true,
            article: {
              select: {
                id: true,
                projectId: true,
                title: true,
              },
            },
          },
        })

        // Filter to this project only (T-02-23 defense in depth)
        return refs
          .filter((r) => r.article.projectId === projectId)
          .map((r) => ({
            id: r.article.id,
            title: r.article.title,
          }))
      }
    )

    // Step 2: Bootstrap or flag articles
    const result = await step.run("bootstrap-or-flag", async () => {
      // Check if ANY articles exist for this project
      const articleCount = await prisma.knowledgeArticle.count({
        where: { projectId },
      })

      // KNOW-02 bootstrap: If no articles exist at all, create a stub
      if (articleCount === 0) {
        const stub = await prisma.knowledgeArticle.create({
          data: {
            projectId,
            articleType: "DOMAIN_OVERVIEW",
            title: "Project Discovery Summary",
            content: "",
            summary: "Auto-generated summary of project discovery findings.",
            confidence: "LOW",
            isStale: true,
            staleReason: `Initial bootstrap from ${entityType} change`,
            staleSince: new Date(),
          },
        })

        // Link the triggering entity as a source reference
        await prisma.knowledgeArticleReference.create({
          data: {
            articleId: stub.id,
            entityType: entityType as "QUESTION" | "DECISION" | "BUSINESS_PROCESS" | "ORG_COMPONENT" | "EPIC" | "STORY",
            entityId,
          },
        })

        return {
          bootstrapped: true,
          stubArticleId: stub.id,
          flaggedCount: 0,
        }
      }

      // Flag affected articles as stale
      if (affectedArticles.length > 0) {
        const now = new Date()
        const staleReason =
          description || `${entityType} ${entityId} was modified`

        await prisma.knowledgeArticle.updateMany({
          where: {
            id: { in: affectedArticles.map((a: any) => a.id) },
            projectId,
          },
          data: {
            isStale: true,
            staleReason,
            staleSince: now,
          },
        })

        return {
          bootstrapped: false,
          flaggedCount: affectedArticles.length,
          flaggedArticleIds: affectedArticles.map((a: any) => a.id),
        }
      }

      return {
        bootstrapped: false,
        flaggedCount: 0,
      }
    })

    // Step 3: Emit ARTICLE_FLAGGED_STALE events for each stale article
    const articleIdsToRefresh: string[] = []

    if (result.bootstrapped && result.stubArticleId) {
      articleIdsToRefresh.push(result.stubArticleId)
    } else if (
      !result.bootstrapped &&
      result.flaggedCount > 0 &&
      result.flaggedArticleIds
    ) {
      articleIdsToRefresh.push(...result.flaggedArticleIds)
    }

    if (articleIdsToRefresh.length > 0) {
      await step.sendEvent(
        "trigger-refresh",
        articleIdsToRefresh.map((articleId) => ({
          name: EVENTS.ARTICLE_FLAGGED_STALE,
          data: {
            projectId,
            articleId,
          },
        }))
      )
    }

    return {
      projectId,
      entityType,
      entityId,
      ...result,
      refreshTriggered: articleIdsToRefresh.length,
    }
  }
)
