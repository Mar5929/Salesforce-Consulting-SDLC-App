import { createJiraClient } from "./client"
import { mapStoryToJiraFields, STATUS_TO_JIRA } from "./field-mapping"
import { prisma } from "@/lib/db"
import type { JiraConfig, StoryStatus } from "@/generated/prisma"

/**
 * Story shape expected by sync functions.
 */
export type StoryWithDetails = {
  id: string
  title: string
  description: string | null
  priority: string | null
  storyPoints: number | null
  displayId: string
  status: StoryStatus
}

/**
 * Push a story to Jira -- creates a new issue or updates an existing one.
 * T-05-17: Sync triggered server-side only. Jira client authenticated.
 */
export async function pushStoryToJira(
  config: JiraConfig,
  story: StoryWithDetails
): Promise<{ jiraIssueId: string; jiraIssueKey: string }> {
  const client = await createJiraClient(config)

  // Check if we already have a sync record for this story
  const existingRecord = await prisma.jiraSyncRecord.findUnique({
    where: {
      projectId_storyId: {
        projectId: config.projectId,
        storyId: story.id,
      },
    },
  })

  const fields = mapStoryToJiraFields(story)

  if (existingRecord?.jiraIssueKey) {
    // Update existing issue
    await client.issues.editIssue({
      issueIdOrKey: existingRecord.jiraIssueKey,
      fields: {
        summary: fields.summary,
        description: fields.description,
      },
    })

    return {
      jiraIssueId: existingRecord.jiraIssueId!,
      jiraIssueKey: existingRecord.jiraIssueKey,
    }
  }

  // Create new issue
  const result = await client.issues.createIssue({
    fields: {
      project: { key: config.jiraProjectKey },
      issuetype: { name: "Story" },
      ...fields,
    },
  })

  return {
    jiraIssueId: result.id,
    jiraIssueKey: result.key,
  }
}

/**
 * Sync story status to Jira via workflow transitions.
 * Looks up available transitions and finds a matching one.
 * If no matching transition found, logs a warning (Jira workflow may differ).
 */
export async function syncStoryStatus(
  config: JiraConfig,
  storyId: string,
  newStatus: StoryStatus
): Promise<void> {
  // Look up the sync record to get the Jira issue key
  const syncRecord = await prisma.jiraSyncRecord.findUnique({
    where: {
      projectId_storyId: {
        projectId: config.projectId,
        storyId,
      },
    },
  })

  if (!syncRecord?.jiraIssueKey) {
    // Story not yet synced to Jira, skip status transition
    return
  }

  const client = await createJiraClient(config)
  const issueIdOrKey = syncRecord.jiraIssueKey
  const targetStatusName = STATUS_TO_JIRA[newStatus]

  // Get available transitions for the current issue state
  const transitions = await client.issues.getTransitions({ issueIdOrKey })

  const matchingTransition = transitions.transitions?.find(
    (t) => t.name === targetStatusName
  )

  if (matchingTransition?.id) {
    await client.issues.doTransition({
      issueIdOrKey,
      transition: { id: matchingTransition.id },
    })
  } else {
    console.warn(
      `[Jira Sync] No matching transition found for status "${targetStatusName}" on issue ${issueIdOrKey}. ` +
        `Available transitions: ${transitions.transitions?.map((t) => t.name).join(", ") ?? "none"}`
    )
  }
}
