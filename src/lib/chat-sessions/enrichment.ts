/**
 * Enrichment Session Prompt Builder
 *
 * Assembles context and builds the system prompt for ENRICHMENT_SESSION conversations.
 * Loads the target story, project context, related articles, and scoped questions
 * to help the AI suggest improvements via the create_enrichment_suggestion tool.
 */

import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getProjectSummary } from "@/lib/agent-harness/context/project-summary"
import { getArticleSummaries } from "@/lib/agent-harness/context/article-summaries"

export async function buildEnrichmentSessionPrompt(
  projectId: string,
  storyId: string
): Promise<string> {
  const scoped = scopedPrisma(projectId)

  const [projectSummary, story, articles] = await Promise.all([
    getProjectSummary(projectId),
    prisma.story.findUnique({
      where: { id: storyId },
      include: {
        epic: { select: { id: true, name: true, prefix: true } },
        feature: { select: { id: true, name: true, prefix: true } },
        storyComponents: {
          select: { componentName: true, impactType: true },
        },
      },
    }),
    getArticleSummaries(projectId),
  ])

  if (!story) {
    return "Error: Story not found. Please check the story ID and try again."
  }

  // Load questions scoped to this story's epic
  const scopedQuestions = await scoped.question.findMany({
    where: {
      status: { not: "REVIEWED" },
      scopeEpicId: story.epicId,
    },
    select: { displayId: true, questionText: true, status: true },
    take: 10,
    orderBy: { createdAt: "desc" },
  })

  const parts: string[] = [
    `You are an AI assistant helping enrich a user story for a Salesforce consulting project.

## Project Context
${projectSummary}

## Story to Enrich
- **ID:** ${story.displayId}
- **Title:** ${story.title}
- **Epic:** ${story.epic.prefix}: ${story.epic.name}`,
  ]

  if (story.feature) {
    parts.push(`- **Feature:** ${story.feature.prefix}: ${story.feature.name}`)
  }

  parts.push(
    `- **Status:** ${story.status}`,
    `- **Priority:** ${story.priority}`,
    `- **Story Points:** ${story.storyPoints ?? "Not estimated"}`,
    `- **Persona:** ${story.persona ?? "Not specified"}`,
    `\n### Current Description\n${story.description || "(empty)"}`,
    `\n### Current Acceptance Criteria\n${story.acceptanceCriteria || "(empty)"}`,
    `\n### Current Notes\n${story.notes || "(empty)"}`
  )

  if (story.storyComponents.length > 0) {
    parts.push(
      "\n### Impacted Components",
      ...story.storyComponents.map(
        (c) => `- ${c.componentName} (${c.impactType})`
      )
    )
  }

  const topArticles = articles.slice(0, 5)
  if (topArticles.length > 0) {
    parts.push(
      "\n## Relevant Knowledge",
      ...topArticles.map((a) => `- ${a.title}: ${a.summary}`)
    )
  }

  if (scopedQuestions.length > 0) {
    parts.push(
      "\n## Related Open Questions",
      ...scopedQuestions.map(
        (q) => `- [${q.displayId}] [${q.status}] ${q.questionText}`
      )
    )
  }

  parts.push(`
## Your Task
Analyze the story above and suggest improvements using the \`create_enrichment_suggestion\` tool. For each suggestion, call the tool with:
- **category**: One of ACCEPTANCE_CRITERIA, DESCRIPTION, COMPONENTS, TECHNICAL_NOTES, STORY_POINTS, PRIORITY
- **currentValue**: The current value (or "empty" if not set)
- **suggestedValue**: Your proposed improvement
- **reasoning**: Why this improvement helps

## Guidelines
- For ACCEPTANCE_CRITERIA: Use Given/When/Then format. Ensure testability.
- For DESCRIPTION: Use "As a [persona], I want [goal] so that [benefit]" format.
- For COMPONENTS: Suggest Salesforce components (objects, flows, triggers, classes, LWC) that should be impacted.
- For TECHNICAL_NOTES: Add implementation guidance, edge cases, or technical considerations.
- For STORY_POINTS: Suggest Fibonacci estimate (1, 2, 3, 5, 8, 13) based on complexity.
- For PRIORITY: Suggest CRITICAL, HIGH, MEDIUM, or LOW based on business impact.
- Only suggest improvements where the current value is missing, incomplete, or could be significantly better.
- Reference open questions or knowledge articles when relevant.
- After proposing all suggestions, summarize what was suggested and ask if the user wants more or different enrichments.`)

  return parts.join("\n")
}
