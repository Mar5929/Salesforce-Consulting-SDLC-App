"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { assertProjectNotArchived } from "@/lib/archive-guard"
import { encrypt } from "@/lib/encryption"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"

const saveJiraConfigSchema = z.object({
  projectId: z.string(),
  instanceUrl: z.string().url("Must be a valid URL"),
  email: z.string().email("Must be a valid email"),
  apiToken: z.string().optional().default(""),
  jiraProjectKey: z
    .string()
    .min(1, "Jira project key is required")
    .max(10, "Jira project key is too long"),
})

/**
 * Save or update Jira configuration for a project.
 * T-05-16: API token encrypted via HKDF-SHA256 per-project key.
 * Never returned in plain text to client.
 */
export const saveJiraConfig = actionClient
  .schema(saveJiraConfigSchema)
  .action(async ({ parsedInput }) => {
    const { projectId, instanceUrl, email, apiToken, jiraProjectKey } =
      parsedInput

    await assertProjectNotArchived(projectId)

    // T-05-18: Restricted to PM or SA role
    await requireRole(projectId, ["PM", "SOLUTION_ARCHITECT"])

    // Build update data -- only overwrite token if a new one was provided
    const updateData: Record<string, unknown> = {
      instanceUrl,
      email,
      jiraProjectKey,
    }
    if (apiToken && apiToken.length > 0) {
      updateData.encryptedToken = await encrypt(apiToken, projectId)
    }

    // For create, a token is required
    const existingConfig = await prisma.jiraConfig.findUnique({
      where: { projectId },
      select: { id: true },
    })
    if (!existingConfig && (!apiToken || apiToken.length === 0)) {
      throw new Error("API token is required for initial Jira configuration")
    }

    const config = await prisma.jiraConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        instanceUrl,
        email,
        encryptedToken: await encrypt(apiToken, projectId),
        jiraProjectKey,
      },
      update: updateData,
    })

    // Return config without the encrypted token
    return {
      id: config.id,
      projectId: config.projectId,
      instanceUrl: config.instanceUrl,
      email: config.email,
      jiraProjectKey: config.jiraProjectKey,
      enabled: config.enabled,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }
  })

const getJiraConfigSchema = z.object({
  projectId: z.string(),
})

/**
 * Get Jira configuration for a project (without decrypted token).
 */
export const getJiraConfig = actionClient
  .schema(getJiraConfigSchema)
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput

    // Verify project membership (WR-02: prevent unauthorized config access)
    await requireRole(projectId, ["PM", "SOLUTION_ARCHITECT"])

    const config = await prisma.jiraConfig.findUnique({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        instanceUrl: true,
        email: true,
        jiraProjectKey: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        // encryptedToken intentionally excluded
      },
    })

    return config
  })

const toggleJiraSyncSchema = z.object({
  projectId: z.string(),
  enabled: z.boolean(),
})

/**
 * Enable or disable Jira sync for a project.
 */
export const toggleJiraSync = actionClient
  .schema(toggleJiraSyncSchema)
  .action(async ({ parsedInput }) => {
    const { projectId, enabled } = parsedInput

    await assertProjectNotArchived(projectId)
    await requireRole(projectId, ["PM", "SOLUTION_ARCHITECT"])

    const config = await prisma.jiraConfig.update({
      where: { projectId },
      data: { enabled },
      select: {
        id: true,
        projectId: true,
        enabled: true,
        updatedAt: true,
      },
    })

    return config
  })

const getJiraSyncStatusSchema = z.object({
  projectId: z.string(),
  storyIds: z.array(z.string()).optional(),
})

/**
 * Get Jira sync records for a project, optionally filtered by story IDs.
 */
export const getJiraSyncStatus = actionClient
  .schema(getJiraSyncStatusSchema)
  .action(async ({ parsedInput }) => {
    const { projectId, storyIds } = parsedInput

    // Verify project membership (WR-02: prevent unauthorized sync status access)
    await requireRole(projectId, ["PM", "SOLUTION_ARCHITECT"])

    const records = await prisma.jiraSyncRecord.findMany({
      where: {
        projectId,
        ...(storyIds && storyIds.length > 0
          ? { storyId: { in: storyIds } }
          : {}),
      },
      select: {
        id: true,
        storyId: true,
        jiraIssueId: true,
        jiraIssueKey: true,
        status: true,
        lastSyncAt: true,
        errorMessage: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return records
  })

const retryFailedSyncsSchema = z.object({
  projectId: z.string(),
})

/**
 * Retry all failed Jira sync records for a project.
 * Sends JIRA_SYNC_REQUESTED events for each failed record.
 */
export const retryFailedSyncs = actionClient
  .schema(retryFailedSyncsSchema)
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput

    await requireRole(projectId, ["PM", "SOLUTION_ARCHITECT"])

    const failedRecords = await prisma.jiraSyncRecord.findMany({
      where: { projectId, status: "FAILED" },
      select: { storyId: true },
    })

    if (failedRecords.length === 0) {
      return { retriesInitiated: 0 }
    }

    // Send sync events for each failed record
    await Promise.all(
      failedRecords.map((record) =>
        inngest.send({
          name: EVENTS.JIRA_SYNC_REQUESTED,
          data: {
            projectId,
            storyId: record.storyId,
          },
        })
      )
    )

    return { retriesInitiated: failedRecords.length }
  })

const deleteJiraConfigSchema = z.object({
  projectId: z.string(),
})

/**
 * Delete Jira configuration for a project.
 * Retains JiraSyncRecord entries for audit history.
 */
export const deleteJiraConfig = actionClient
  .schema(deleteJiraConfigSchema)
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput

    await assertProjectNotArchived(projectId)
    await requireRole(projectId, ["PM", "SOLUTION_ARCHITECT"])

    await prisma.jiraConfig.delete({
      where: { projectId },
    })

    return { success: true }
  })
