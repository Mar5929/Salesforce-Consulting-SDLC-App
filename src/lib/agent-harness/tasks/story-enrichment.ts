/**
 * Story Enrichment Task Definition (Layer 1)
 *
 * Defines the AI task for enriching user stories with suggested
 * improvements. Uses AGENT_LOOP execution mode to iterate through
 * multiple enrichment suggestions via tool calls.
 */

import type { TaskDefinition, TaskInput, ProjectContext } from "../types"
import { getProjectSummary } from "../context/project-summary"
import { getArticleSummaries } from "../context/article-summaries"
import { createEnrichmentSuggestionToolDefinition } from "../tools/create-enrichment-suggestion"
import { prisma } from "@/lib/db"

async function storyEnrichmentContextLoader(
  input: TaskInput,
  projectId: string
): Promise<ProjectContext> {
  const storyId = input.entityId

  const [projectSummary, story, articles] = await Promise.all([
    getProjectSummary(projectId),
    storyId
      ? prisma.story.findUnique({
          where: { id: storyId },
          include: {
            epic: { select: { name: true, prefix: true } },
            feature: { select: { name: true, prefix: true } },
            storyComponents: {
              select: { componentName: true, impactType: true },
            },
          },
        })
      : Promise.resolve(null),
    getArticleSummaries(projectId),
  ])

  const rawParts: string[] = []

  if (story) {
    rawParts.push(
      [
        `Story: [${story.displayId}] ${story.title}`,
        `Epic: ${story.epic.prefix} - ${story.epic.name}`,
        story.feature
          ? `Feature: ${story.feature.prefix} - ${story.feature.name}`
          : null,
        `Status: ${story.status}`,
        `Priority: ${story.priority}`,
        `Story Points: ${story.storyPoints ?? "Not estimated"}`,
        `Persona: ${story.persona ?? "Not specified"}`,
        `Description: ${story.description || "(empty)"}`,
        `Acceptance Criteria: ${story.acceptanceCriteria || "(empty)"}`,
        `Notes: ${story.notes || "(empty)"}`,
      ]
        .filter(Boolean)
        .join("\n")
    )

    if (story.storyComponents.length > 0) {
      rawParts.push(
        "Impacted Components:\n" +
          story.storyComponents
            .map((c) => `- ${c.componentName} (${c.impactType})`)
            .join("\n")
      )
    }
  }

  return {
    projectSummary,
    articles: articles.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.title,
      content: a.summary,
    })),
    rawContext: rawParts.length > 0 ? rawParts.join("\n\n") : undefined,
  }
}

export const storyEnrichmentTask: TaskDefinition = {
  taskType: "STORY_ENRICHMENT",
  executionMode: "AGENT_LOOP",
  maxIterations: 10,
  maxRetries: 3,
  ambiguityMode: "INTERACTIVE",

  systemPromptTemplate: `You are an AI assistant enriching a user story for a Salesforce consulting project.

## Project Context
{{context}}

## Your Task
Analyze the story and suggest improvements using the create_enrichment_suggestion tool.

For each area that can be improved, call the tool with:
- category: ACCEPTANCE_CRITERIA, DESCRIPTION, COMPONENTS, TECHNICAL_NOTES, STORY_POINTS, or PRIORITY
- currentValue: The current value (or "empty")
- suggestedValue: Your proposed improvement
- reasoning: Why this helps

## Guidelines
- ACCEPTANCE_CRITERIA: Use Given/When/Then format
- DESCRIPTION: Use "As a [persona], I want [goal] so that [benefit]" format
- COMPONENTS: Suggest impacted Salesforce components
- TECHNICAL_NOTES: Add implementation guidance and edge cases
- STORY_POINTS: Fibonacci estimate (1, 2, 3, 5, 8, 13)
- PRIORITY: CRITICAL, HIGH, MEDIUM, or LOW
- Only suggest where current value is missing, incomplete, or significantly improvable`,

  contextLoader: storyEnrichmentContextLoader,
  tools: [createEnrichmentSuggestionToolDefinition],
}
