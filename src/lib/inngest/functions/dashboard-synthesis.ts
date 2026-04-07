/**
 * Dashboard Synthesis Inngest Function
 *
 * Triggered by PROJECT_STATE_CHANGED events to recompute dashboard metrics
 * and generate AI-powered focus summaries.
 *
 * Architecture: D-25, DASH-05, KNOW-06 (discovery gap identification)
 * Threat mitigations: T-02-29 (debounce 30s, concurrency limit 1 per project)
 */

import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { prisma } from "@/lib/db"
import {
  getQuestionStats,
  getBlockedItems,
  computeHealthScore,
} from "@/lib/dashboard/queries"
import { executeTask } from "@/lib/agent-harness/engine"
import { dashboardSynthesisTask } from "@/lib/agent-harness/tasks/dashboard-synthesis"

export const dashboardSynthesisFunction = inngest.createFunction(
  {
    id: "dashboard-synthesis",
    concurrency: [
      {
        limit: 1,
        scope: "fn",
        key: "event.data.projectId",
      },
    ],
    debounce: {
      period: "30s",
      key: "event.data.projectId",
    },
    triggers: [{ event: EVENTS.PROJECT_STATE_CHANGED }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { projectId } = event.data as { projectId: string }

    // Step 1: Compute dashboard metrics
    const metrics = await step.run("compute-metrics", async () => {
      const [questionStats, blockedItems, healthScore] = await Promise.all([
        getQuestionStats(projectId),
        getBlockedItems(projectId),
        computeHealthScore(projectId),
      ])

      return { questionStats, blockedItems, healthScore }
    })

    // Step 2: AI synthesis — generate focus summaries (KNOW-06, D-20)
    const synthesis = await step.run("synthesize", async () => {
      try {
        const result = await executeTask(
          dashboardSynthesisTask,
          {
            userMessage: JSON.stringify({
              questionStats: metrics.questionStats,
              blockedItems: metrics.blockedItems.map((b: any) => ({
                questionDisplayId: b.questionDisplayId,
                questionText: b.questionText,
                questionStatus: b.questionStatus,
                blockedCount: b.blockedEntities.length,
              })),
              healthScore: metrics.healthScore,
            }),
          },
          projectId,
          "system"
        )

        // Parse JSON output from AI
        try {
          return JSON.parse(result.output) as {
            currentFocus: string
            recommendedFocus: string
            keyRisks: string[]
            progressSummary: string
            knowledgeGaps: string[]
          }
        } catch {
          // If AI didn't return valid JSON, use the raw text
          return {
            currentFocus: result.output,
            recommendedFocus: null,
            keyRisks: [],
            progressSummary: null,
            knowledgeGaps: [],
          }
        }
      } catch (error) {
        // AI synthesis is non-critical — cache metrics without AI content
        console.error("Dashboard AI synthesis failed:", error)
        return {
          currentFocus: null,
          recommendedFocus: null,
          keyRisks: [],
          progressSummary: null,
          knowledgeGaps: [],
        }
      }
    })

    // Step 3: Cache results to the Project record
    await step.run("cache-results", async () => {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          cachedBriefingContent: {
            ...synthesis,
            healthScore: metrics.healthScore,
            questionStats: metrics.questionStats,
            blockedItemCount: metrics.blockedItems.length,
          },
          cachedBriefingGeneratedAt: new Date(),
        },
      })
    })

    return {
      projectId,
      healthScore: metrics.healthScore.score,
      synthesized: !!synthesis.currentFocus,
    }
  }
)
