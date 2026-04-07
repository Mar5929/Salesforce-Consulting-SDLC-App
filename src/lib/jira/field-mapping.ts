import type { StoryStatus } from "@/generated/prisma"

/**
 * Map internal story status to Jira workflow status names (D-16).
 * These map to the default Jira Software workflow transitions.
 * Actual transition IDs are resolved at runtime via getTransitions API.
 */
export const STATUS_TO_JIRA: Record<StoryStatus, string> = {
  DRAFT: "To Do",
  READY: "To Do",
  SPRINT_PLANNED: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  QA: "In Review",
  DONE: "Done",
}

/**
 * Map story fields to Jira issue fields.
 * Uses Atlassian Document Format (ADF) for description.
 */
export function mapStoryToJiraFields(story: {
  title: string
  description: string | null
  priority: string | null
  storyPoints: number | null
  displayId: string
}) {
  return {
    summary: `[${story.displayId}] ${story.title}`,
    description: {
      type: "doc" as const,
      version: 1,
      content: [
        {
          type: "paragraph" as const,
          content: [
            {
              type: "text" as const,
              text: story.description ?? "",
            },
          ],
        },
      ],
    },
    // TODO: Add configurable story points field ID (customfield_NNNNN varies per Jira instance)
  }
}
