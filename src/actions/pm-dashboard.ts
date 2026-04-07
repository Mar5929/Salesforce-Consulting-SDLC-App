"use server"

/**
 * PM Dashboard Server Actions
 *
 * Provides pre-computed PM dashboard data and refresh triggering.
 * Data is stored in Project.cachedBriefingContent.pmDashboard JSON field,
 * pre-computed by the pm-dashboard-synthesis Inngest function.
 *
 * Threat mitigations: T-05-14 (PM/SA role check before data access)
 */

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { getCurrentMember } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import type { PmDashboardData } from "@/lib/inngest/functions/pm-dashboard-synthesis"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const pmDashboardSchema = z.object({
  projectId: z.string().min(1),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

/**
 * Get pre-computed PM dashboard data.
 * Checks PM or SA role. If data is stale (>5 min), triggers refresh.
 */
export const getPmDashboardData = actionClient
  .schema(pmDashboardSchema)
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput

    // Verify project membership and PM/SA role (T-05-14)
    const member = await getCurrentMember(projectId)
    if (!["PM", "SOLUTION_ARCHITECT"].includes(member.role)) {
      throw new Error("PM Dashboard requires PM or SA role")
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        cachedBriefingContent: true,
        cachedBriefingGeneratedAt: true,
      },
    })

    const content = project?.cachedBriefingContent as Record<string, unknown> | null
    const pmDashboard = (content?.pmDashboard as PmDashboardData) ?? null

    // If data is stale (older than 5 minutes) or missing, trigger refresh
    const generatedAt = project?.cachedBriefingGeneratedAt
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    if (!pmDashboard || !generatedAt || generatedAt < fiveMinutesAgo) {
      await inngest.send({
        name: EVENTS.PM_DASHBOARD_SYNTHESIS_REQUESTED,
        data: { projectId },
      })
    }

    return { data: pmDashboard }
  })

/**
 * Manually request a PM dashboard data refresh.
 */
export const requestDashboardRefresh = actionClient
  .schema(pmDashboardSchema)
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput

    // Verify project membership
    const member = await getCurrentMember(projectId)
    if (!["PM", "SOLUTION_ARCHITECT"].includes(member.role)) {
      throw new Error("PM Dashboard requires PM or SA role")
    }

    await inngest.send({
      name: EVENTS.PM_DASHBOARD_SYNTHESIS_REQUESTED,
      data: { projectId },
    })

    return { success: true }
  })
