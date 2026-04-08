/**
 * Briefing Generation Task Definition (Layer 1)
 *
 * Defines the AI task for generating project briefings.
 * Uses SINGLE_TURN execution mode — one AI call that produces a
 * structured briefing in markdown.
 */

import type { TaskDefinition, TaskInput, ProjectContext } from "../types"
import { getProjectSummary } from "../context/project-summary"
import { getOpenQuestions } from "../context/questions"
import { getRecentDecisions } from "../context/decisions"
import { getArticleSummaries } from "../context/article-summaries"

async function briefingContextLoader(
  _input: TaskInput,
  projectId: string
): Promise<ProjectContext> {
  const [projectSummary, questions, decisions, articles] = await Promise.all([
    getProjectSummary(projectId),
    getOpenQuestions(projectId, 20),
    getRecentDecisions(projectId, 10),
    getArticleSummaries(projectId),
  ])

  const rawParts: string[] = []

  if (questions.length > 0) {
    rawParts.push(
      "Open Questions:\n" +
        questions
          .map((q) => `- [${q.displayId}] [${q.status}] ${q.questionText}`)
          .join("\n")
    )
  }

  if (decisions.length > 0) {
    rawParts.push(
      "Recent Decisions:\n" +
        decisions
          .map((d) => `- [${d.displayId}] ${d.title}`)
          .join("\n")
    )
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

export const briefingGenerationTask: TaskDefinition = {
  taskType: "BRIEFING_GENERATION",
  executionMode: "SINGLE_TURN",
  maxIterations: 1,
  maxRetries: 3,
  ambiguityMode: "TASK_SESSION",

  systemPromptTemplate: `You are an AI assistant generating a project briefing for a Salesforce consulting engagement.

## Project Context
{{context}}

## Your Task
Generate a comprehensive project briefing covering:

### Current Focus
What the team should prioritize right now.

### Outstanding Items
Key open questions and unresolved items, prioritized by impact.

### Recommended Actions
Specific next steps with item IDs.

### Sprint Status
Sprint progress and any at-risk stories.

## Rules
- Reference items by display IDs
- Prioritize by business impact
- Flag contradictions between decisions and questions
- Be concise but actionable`,

  contextLoader: briefingContextLoader,
  tools: [],

  outputValidator: (output: string) => {
    const hasCurrentFocus =
      output.includes("Current Focus") || output.includes("current focus")
    const hasRecommendations =
      output.includes("Recommended") || output.includes("recommended")
    const errors: string[] = []

    if (!hasCurrentFocus) errors.push("Output missing Current Focus section")
    if (!hasRecommendations) errors.push("Output missing Recommended Actions section")

    return { valid: errors.length === 0, errors }
  },
}
