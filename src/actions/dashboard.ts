"use server"

/**
 * Dashboard Server Actions
 *
 * Provides combined dashboard data loading with auth and scope validation.
 * All dashboard queries run in parallel for fast page loads.
 *
 * Architecture: DASH-01 through DASH-05, D-24, D-25
 */

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { getCurrentMember } from "@/lib/auth"
import {
  getQuestionStats,
  getBlockedItems,
  computeHealthScore,
  getCachedBriefing,
} from "@/lib/dashboard/queries"
import { getTokenUsageSummary } from "@/lib/dashboard/usage-queries"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const getDashboardDataSchema = z.object({
  projectId: z.string().min(1),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

/**
 * Load all dashboard data in parallel.
 * Auth check + project membership validation.
 */
export const getDashboardData = actionClient
  .schema(getDashboardDataSchema)
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput

    // Verify project membership (T-02-30)
    await getCurrentMember(projectId)

    // Load all dashboard sections in parallel (D-25 — reads cached data)
    const [questionStats, blockedItems, healthScore, briefing, tokenUsage] =
      await Promise.all([
        getQuestionStats(projectId),
        getBlockedItems(projectId),
        computeHealthScore(projectId),
        getCachedBriefing(projectId),
        getTokenUsageSummary(projectId),
      ])

    return {
      questionStats,
      blockedItems,
      healthScore,
      briefing,
      tokenUsage,
    }
  })
