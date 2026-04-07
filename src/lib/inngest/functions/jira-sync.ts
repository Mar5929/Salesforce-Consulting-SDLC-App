import { inngest } from "../client"
import { EVENTS } from "../events"
import { prisma } from "@/lib/db"
import { pushStoryToJira, syncStoryStatus } from "@/lib/jira/sync"
import type { StoryWithDetails } from "@/lib/jira/sync"
import type { JiraConfig } from "@/generated/prisma"

/**
 * Jira Sync on Story Status Change
 *
 * Triggered by STORY_STATUS_CHANGED event (existing Phase 3 event).
 * Checks if the project has an enabled JiraConfig, then pushes/updates
 * the story in Jira and transitions its status.
 *
 * T-05-17: Sync triggered by server-side Inngest events only.
 * Sync records tracked for audit.
 */
export const jiraSyncOnStatusChange = inngest.createFunction(
  {
    id: "jira-sync-on-status-change",
    retries: 2,
    triggers: [{ event: EVENTS.STORY_STATUS_CHANGED }],
  },
  async ({ event, step }) => {
    const { projectId, storyId, newStatus } = event.data as {
      projectId: string
      storyId: string
      newStatus: string
    }

    // Step 1: Check if project has Jira integration enabled
    const jiraConfig = await step.run("check-jira-config", async () => {
      return prisma.jiraConfig.findUnique({
        where: { projectId },
      })
    })

    if (!jiraConfig || !jiraConfig.enabled) {
      return { skipped: true, reason: "No enabled Jira config for project" }
    }

    // Step 2: Load story with details
    const story = await step.run("load-story", async () => {
      return prisma.story.findUnique({
        where: { id: storyId },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          storyPoints: true,
          displayId: true,
          status: true,
        },
      })
    })

    if (!story) {
      return { skipped: true, reason: "Story not found" }
    }

    try {
      // Step 3: Push/update story in Jira
      const { jiraIssueId, jiraIssueKey } = await step.run(
        "push-story-to-jira",
        async () => {
          return pushStoryToJira(
            jiraConfig as unknown as JiraConfig,
            story as StoryWithDetails
          )
        }
      )

      // Step 4: Sync story status (transition in Jira)
      await step.run("sync-story-status", async () => {
        return syncStoryStatus(
          jiraConfig as unknown as JiraConfig,
          storyId,
          story.status
        )
      })

      // Step 5: Upsert sync record as SYNCED
      await step.run("upsert-sync-record", async () => {
        return prisma.jiraSyncRecord.upsert({
          where: {
            projectId_storyId: { projectId, storyId },
          },
          create: {
            projectId,
            storyId,
            jiraIssueId,
            jiraIssueKey,
            status: "SYNCED",
            lastSyncAt: new Date(),
          },
          update: {
            jiraIssueId,
            jiraIssueKey,
            status: "SYNCED",
            lastSyncAt: new Date(),
            errorMessage: null,
          },
        })
      })

      // Step 6: Send notification for sync completion
      await step.run("notify-sync-complete", async () => {
        return inngest.send({
          name: EVENTS.NOTIFICATION_SEND,
          data: {
            projectId,
            type: "METADATA_SYNC_COMPLETE",
            title: `Jira sync completed for ${story.displayId}`,
            body: `Story "${story.title}" synced to Jira as ${jiraIssueKey}`,
            entityType: "STORY",
            entityId: storyId,
            actorMemberId: "", // system-triggered
          },
        })
      })

      return { synced: true, jiraIssueKey }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"

      // Upsert sync record as FAILED
      await step.run("record-sync-failure", async () => {
        return prisma.jiraSyncRecord.upsert({
          where: {
            projectId_storyId: { projectId, storyId },
          },
          create: {
            projectId,
            storyId,
            status: "FAILED",
            errorMessage,
          },
          update: {
            status: "FAILED",
            errorMessage,
          },
        })
      })

      // Send failure notification
      await step.run("notify-sync-failure", async () => {
        return inngest.send({
          name: EVENTS.NOTIFICATION_SEND,
          data: {
            projectId,
            type: "METADATA_SYNC_COMPLETE",
            title: `Jira sync failed for ${story.displayId}`,
            body: `Error: ${errorMessage}`,
            entityType: "STORY",
            entityId: storyId,
            actorMemberId: "",
          },
        })
      })

      throw error // Re-throw so Inngest retries
    }
  }
)

/**
 * Jira Sync Retry
 *
 * Triggered by JIRA_SYNC_REQUESTED event for manual retry from the UI.
 * Single-story retry (D-05). Reuses sync library functions (D-06).
 * Records outcome in JiraSyncRecord (D-07). No notification on failure (D-09).
 */
export const jiraSyncRetryFunction = inngest.createFunction(
  {
    id: "jira-sync-retry",
    retries: 2,
    triggers: [{ event: EVENTS.JIRA_SYNC_REQUESTED }],
  },
  async ({ event, step }) => {
    const { projectId, storyId } = event.data as {
      projectId: string
      storyId: string
    }

    // Step 1: Check if project has Jira integration enabled
    const jiraConfig = await step.run("check-jira-config", async () => {
      return prisma.jiraConfig.findUnique({
        where: { projectId },
      })
    })

    if (!jiraConfig || !jiraConfig.enabled) {
      return { skipped: true, reason: "No enabled Jira config for project" }
    }

    // Step 2: Load story with details
    const story = await step.run("load-story", async () => {
      return prisma.story.findUnique({
        where: { id: storyId },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          storyPoints: true,
          displayId: true,
          status: true,
        },
      })
    })

    if (!story) {
      return { skipped: true, reason: "Story not found" }
    }

    try {
      // Step 3: Push/update story in Jira
      const { jiraIssueId, jiraIssueKey } = await step.run(
        "push-story-to-jira",
        async () => {
          return pushStoryToJira(
            jiraConfig as unknown as JiraConfig,
            story as StoryWithDetails
          )
        }
      )

      // Step 4: Sync story status (transition in Jira)
      await step.run("sync-story-status", async () => {
        return syncStoryStatus(
          jiraConfig as unknown as JiraConfig,
          storyId,
          story.status
        )
      })

      // Step 5: Upsert sync record as SYNCED
      await step.run("upsert-sync-record", async () => {
        return prisma.jiraSyncRecord.upsert({
          where: {
            projectId_storyId: { projectId, storyId },
          },
          create: {
            projectId,
            storyId,
            jiraIssueId,
            jiraIssueKey,
            status: "SYNCED",
            lastSyncAt: new Date(),
          },
          update: {
            jiraIssueId,
            jiraIssueKey,
            status: "SYNCED",
            lastSyncAt: new Date(),
            errorMessage: null,
          },
        })
      })

      // D-09: No notification on retry success -- SyncStatusBadge reflects sync record
      return { synced: true, jiraIssueKey }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"

      // Upsert sync record as FAILED
      await step.run("record-sync-failure", async () => {
        return prisma.jiraSyncRecord.upsert({
          where: {
            projectId_storyId: { projectId, storyId },
          },
          create: {
            projectId,
            storyId,
            status: "FAILED",
            errorMessage,
          },
          update: {
            status: "FAILED",
            errorMessage,
          },
        })
      })

      // D-09: No notification on retry failure -- SyncStatusBadge reflects sync record
      throw error // Re-throw so Inngest retries (up to 2 retries)
    }
  }
)
