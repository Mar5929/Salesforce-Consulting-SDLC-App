"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"

/**
 * Disconnect a Salesforce org from a project.
 * Clears OAuth tokens but preserves synced metadata (OrgComponent, DomainGrouping, BusinessProcess).
 * Only SA role can disconnect (D-05, T-04-06).
 */
export const disconnectOrg = actionClient
  .schema(z.object({ projectId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { projectId } = parsedInput

    // Verify SA role (disconnect is destructive — SA-only)
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        clerkUserId: ctx.userId,
        role: "SOLUTION_ARCHITECT",
      },
    })

    if (!member) {
      throw new Error("Only Solution Architects can disconnect an org")
    }

    // Clear tokens but preserve synced metadata (per D-01 disconnect behavior)
    await prisma.project.update({
      where: { id: projectId },
      data: {
        sfOrgInstanceUrl: null,
        sfOrgAccessToken: null,
        sfOrgRefreshToken: null,
      },
    })

    return { success: true }
  })

/**
 * Request a metadata sync for a connected Salesforce org.
 * Sends an Inngest event to trigger the sync pipeline.
 * Only SA or PM roles can request sync (D-05, T-04-06).
 */
export const requestSync = actionClient
  .schema(
    z.object({
      projectId: z.string(),
      syncType: z.enum(["FULL", "INCREMENTAL"]),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, syncType } = parsedInput

    // Verify SA or PM role
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        clerkUserId: ctx.userId,
        role: { in: ["SOLUTION_ARCHITECT", "PM"] },
      },
    })

    if (!member) {
      throw new Error("Only Solution Architects and Project Managers can trigger a sync")
    }

    // Verify org is connected
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { sfOrgInstanceUrl: true },
    })

    if (!project?.sfOrgInstanceUrl) {
      throw new Error("No Salesforce org connected to this project")
    }

    // Send Inngest event to trigger sync
    await inngest.send({
      name: EVENTS.ORG_SYNC_REQUESTED,
      data: {
        projectId,
        syncType,
      },
    })

    return { success: true }
  })

/**
 * Get the current org connection status for a project.
 * Returns connection health state, instance URL, last sync time, and component count.
 */
export const getOrgConnectionStatus = actionClient
  .schema(z.object({ projectId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        sfOrgInstanceUrl: true,
        sfOrgLastSyncAt: true,
        sfOrgAccessToken: true,
      },
    })

    if (!project) {
      throw new Error("Project not found")
    }

    const componentCount = await prisma.orgComponent.count({
      where: { projectId },
    })

    return {
      instanceUrl: project.sfOrgInstanceUrl,
      lastSyncedAt: project.sfOrgLastSyncAt,
      componentCount,
      isConnected: !!project.sfOrgInstanceUrl,
      needsReauth:
        !!project.sfOrgInstanceUrl && !project.sfOrgAccessToken,
    }
  })
