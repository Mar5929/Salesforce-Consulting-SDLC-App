/**
 * Stories in Sprint Context Loader
 *
 * Loads minimal context for sprint conflict detection.
 * Only loads story display IDs, titles, and component impacts.
 *
 * Token budget: 2000 tokens max (sprints are typically 5-15 stories).
 * Uses prisma directly since this runs inside Inngest (no request context).
 */

import { prisma } from "@/lib/db"

interface StoriesInSprintParams {
  sprintId: string
  projectId: string
}

/**
 * Load stories with their component impacts for a given sprint.
 *
 * Returns formatted text block for prompt injection into
 * the sprint intelligence analysis task.
 */
export async function getStoriesInSprintContext(
  params: StoriesInSprintParams
): Promise<string> {
  const { sprintId, projectId } = params

  const stories = await prisma.story.findMany({
    where: { sprintId, projectId },
    select: {
      id: true,
      displayId: true,
      title: true,
      storyComponents: {
        select: { componentName: true, impactType: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  if (stories.length === 0) {
    return "## Stories in Sprint\nNo stories assigned to this sprint."
  }

  const lines = stories.map((s) => {
    const components =
      s.storyComponents.length > 0
        ? s.storyComponents
            .map((c) => `${c.componentName} (${c.impactType})`)
            .join(", ")
        : "No components"
    return `- ${s.displayId}: "${s.title}" [Components: ${components}]`
  })

  return `## Stories in Sprint\n${lines.join("\n")}`
}
