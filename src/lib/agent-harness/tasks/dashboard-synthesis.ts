/**
 * Dashboard Synthesis Task Definition (Layer 1)
 *
 * Defines the AI task for generating discovery dashboard insights.
 * Uses SINGLE_TURN execution mode — pure text generation, no tools.
 * Runs in BACKGROUND mode (no user present).
 *
 * Tech spec Section 5
 */

import type { TaskDefinition, TaskInput, ProjectContext } from "../types"
import { getProjectSummary } from "../context/project-summary"
import { getOpenQuestions } from "../context/questions"
import { getBlockingRelationships } from "../context/blocking-relationships"
import { getArticleSummaries } from "../context/article-summaries"

/**
 * Context loader for dashboard synthesis.
 * Loads project summary + question stats + blocking relationships + article summaries.
 */
async function dashboardSynthesisContextLoader(
  _input: TaskInput,
  projectId: string
): Promise<ProjectContext> {
  const [projectSummary, questions, blockingRelationships, articleSummaries] =
    await Promise.all([
      getProjectSummary(projectId),
      getOpenQuestions(projectId, 50), // Load more questions for stats
      getBlockingRelationships(projectId),
      getArticleSummaries(projectId),
    ])

  const rawParts: string[] = []

  // Question statistics
  const openCount = questions.filter((q) => q.status === "OPEN").length
  const answeredCount = questions.filter((q) => q.status === "ANSWERED").length
  const parkedCount = questions.filter((q) => q.status === "PARKED").length
  const escalatedCount = questions.filter((q) => q.status === "ESCALATED").length

  rawParts.push(
    [
      "Question Statistics:",
      `- Total: ${questions.length}`,
      `- Open: ${openCount}`,
      `- Answered: ${answeredCount}`,
      `- Parked: ${parkedCount}`,
      `- Escalated: ${escalatedCount}`,
    ].join("\n")
  )

  // Blocking relationships summary
  if (blockingRelationships.length > 0) {
    rawParts.push(
      "Blocking Relationships:\n" +
        blockingRelationships
          .map(
            (br) =>
              `- ${br.questionDisplayId} blocks [${br.blockedEntityType}] ${br.blockedEntityDisplayId}: ${br.blockedEntityTitle}`
          )
          .join("\n")
    )
  }

  // Article summaries
  if (articleSummaries.length > 0) {
    rawParts.push(
      "Knowledge Articles:\n" +
        articleSummaries
          .map((a) => `- ${a.title} (${a.articleType}, confidence: ${a.confidence})`)
          .join("\n")
    )
  }

  return {
    projectSummary,
    questions: questions.map((q) => ({
      id: q.id,
      text: `[${q.displayId}] ${q.questionText}`,
      status: q.status,
    })),
    rawContext: rawParts.join("\n\n"),
  }
}

export const dashboardSynthesisTask: TaskDefinition = {
  taskType: "DASHBOARD_SYNTHESIS",
  executionMode: "SINGLE_TURN",
  maxIterations: 1,
  maxRetries: 3,
  ambiguityMode: "BACKGROUND",

  systemPromptTemplate: `You are an AI assistant synthesizing a discovery dashboard for a Salesforce consulting project.

## Project Context
{{context}}

## Your Task
Generate a concise discovery dashboard synthesis that helps the project team understand the current state. Include:

1. **currentFocus** - What the team should focus on right now (2-3 sentences)
2. **recommendedFocus** - What the team should prioritize next (2-3 sentences)
3. **Key Risks** - Top risks and blockers (bulleted list)
4. **Progress Summary** - Brief overview of discovery progress
5. **Knowledge Gaps** - Areas where more information is needed

## Output Format
Structure your response as JSON:

{
  "currentFocus": "...",
  "recommendedFocus": "...",
  "keyRisks": ["...", "..."],
  "progressSummary": "...",
  "knowledgeGaps": ["...", "..."]
}

Be concise but specific. Reference actual question IDs, epic names, and article titles where relevant.`,

  contextLoader: dashboardSynthesisContextLoader,

  tools: [], // Pure text generation, no tools

  outputValidator: (output: string) => {
    const errors: string[] = []

    const hasCurrentFocus =
      output.includes("currentFocus") || output.includes("current focus")
    const hasRecommendedFocus =
      output.includes("recommendedFocus") || output.includes("recommended focus")

    if (!hasCurrentFocus) errors.push("Output missing currentFocus section")
    if (!hasRecommendedFocus) errors.push("Output missing recommendedFocus section")

    return {
      valid: errors.length === 0,
      errors,
    }
  },
}
