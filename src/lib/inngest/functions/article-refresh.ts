/**
 * Article Refresh Inngest Function
 *
 * Triggered by ARTICLE_FLAGGED_STALE events. Synthesizes updated article
 * content via the agent harness and clears staleness flags.
 *
 * Architecture: D-18, KNOW-04
 * Threat mitigations:
 * - T-02-22: Concurrency limited to 2 per project to prevent AI cost spikes
 * - T-02-23: Project-scoped article verification
 */

import { inngest } from "../client"
import { EVENTS } from "../events"
import { prisma } from "@/lib/db"
import { executeTask } from "@/lib/agent-harness/engine"
import { articleSynthesisTask } from "@/lib/agent-harness/tasks/article-synthesis"

export const articleRefreshFunction = inngest.createFunction(
  {
    id: "article-refresh",
    retries: 2,
    concurrency: [
      {
        limit: 2,
        scope: "fn",
        key: "event.data.projectId",
      },
    ],
    triggers: [{ event: EVENTS.ARTICLE_FLAGGED_STALE }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { projectId, articleId } = event.data as {
      projectId: string
      articleId: string
    }

    if (!projectId || !articleId) {
      return { skipped: true, reason: "Missing required event data" }
    }

    // Step 1: Load current article and verify it exists
    const article = await step.run("load-article", async () => {
      const found = await prisma.knowledgeArticle.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          projectId: true,
          title: true,
          content: true,
          version: true,
          isStale: true,
        },
      })

      if (!found || found.projectId !== projectId) {
        throw new Error(`Article ${articleId} not found in project ${projectId}`)
      }

      return found
    })

    // Step 2: Synthesize updated content via agent harness
    const synthesisResult = await step.run("synthesize", async () => {
      const result = await executeTask(
        articleSynthesisTask,
        {
          userMessage: `Refresh the knowledge article "${article.title}" with the latest source information. Current version: ${article.version}.`,
          entityId: articleId,
        },
        projectId,
        "system" // Background job, no user context
      )

      return {
        output: result.output,
        tokenUsage: result.tokenUsage,
        cost: result.cost,
        sessionLogId: result.sessionLogId,
      }
    })

    // Step 3: Update article with new content and clear staleness
    const updated = await step.run("update-article", async () => {
      const updatedArticle = await prisma.knowledgeArticle.update({
        where: { id: articleId },
        data: {
          content: synthesisResult.output,
          version: { increment: 1 },
          isStale: false,
          staleReason: null,
          staleSince: null,
          lastRefreshedAt: new Date(),
          embeddingStatus: "PENDING", // Mark for re-embedding
        },
      })

      return {
        id: updatedArticle.id,
        version: updatedArticle.version,
        lastRefreshedAt: updatedArticle.lastRefreshedAt,
      }
    })

    // Step 4: Trigger embedding generation for the updated article
    await step.sendEvent("trigger-embeddings", {
      name: EVENTS.EMBEDDING_BATCH_REQUESTED,
      data: {
        projectId,
        entityType: "KNOWLEDGE_ARTICLE",
        entityIds: [articleId],
      },
    })

    // Step 5: Trigger dashboard re-synthesis after article refresh
    await step.sendEvent("trigger-dashboard-refresh", {
      name: EVENTS.PROJECT_STATE_CHANGED,
      data: { projectId },
    })

    return {
      articleId,
      projectId,
      newVersion: updated.version,
      lastRefreshedAt: updated.lastRefreshedAt,
      tokenUsage: synthesisResult.tokenUsage,
      cost: synthesisResult.cost,
      sessionLogId: synthesisResult.sessionLogId,
    }
  }
)
