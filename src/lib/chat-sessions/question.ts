/**
 * Question Session Prompt Builder
 *
 * Assembles context and builds the system prompt for QUESTION_SESSION conversations.
 * These sessions are created when the AI detects a conflict between a question's
 * answer and an existing project decision, requiring human resolution.
 */

import { getProjectSummary } from "@/lib/agent-harness/context/project-summary"
import { getQuestionContext } from "@/lib/agent-harness/context/questions"
import { getRecentDecisions } from "@/lib/agent-harness/context/decisions"

export async function buildQuestionSessionPrompt(
  projectId: string,
  questionId: string
): Promise<string> {
  const [projectSummary, questionContext, decisions] = await Promise.all([
    getProjectSummary(projectId),
    getQuestionContext(projectId, questionId),
    getRecentDecisions(projectId, 15),
  ])

  const parts: string[] = [
    `You are an AI assistant helping resolve a conflict detected during question impact analysis for a Salesforce consulting project.

## Project Context
${projectSummary}`,
  ]

  if (questionContext) {
    parts.push(
      `\n## Question Under Review`,
      `- **ID:** ${questionContext.displayId}`,
      `- **Question:** ${questionContext.questionText}`,
      `- **Status:** ${questionContext.status}`,
      `- **Scope:** ${questionContext.scope}`
    )

    if (questionContext.scopeEpic) {
      parts.push(
        `- **Epic:** ${questionContext.scopeEpic.prefix} - ${questionContext.scopeEpic.name}`
      )
    }
    if (questionContext.scopeFeature) {
      parts.push(
        `- **Feature:** ${questionContext.scopeFeature.prefix} - ${questionContext.scopeFeature.name}`
      )
    }

    if (questionContext.answerText) {
      parts.push(`\n### Current Answer\n${questionContext.answerText}`)
    }

    if (questionContext.impactAssessment) {
      parts.push(
        `\n### Impact Assessment\n${questionContext.impactAssessment}`
      )
    }

    if (questionContext.blockedEntities.length > 0) {
      parts.push(
        "\n### Blocked Items",
        ...questionContext.blockedEntities.map(
          (e) => `- [${e.type}] ${e.displayId}: ${e.title}`
        )
      )
    }

    if (questionContext.relatedDecisions.length > 0) {
      parts.push(
        "\n### Related Decisions",
        ...questionContext.relatedDecisions.map(
          (d) => `- [${d.displayId}] ${d.title}`
        )
      )
    }
  }

  if (decisions.length > 0) {
    parts.push(
      "\n## All Recent Decisions",
      ...decisions.map(
        (d) =>
          `- [${d.displayId}] ${d.title}: ${d.rationale.substring(0, 200)}`
      )
    )
  }

  parts.push(`
## Your Task
A conflict was detected between this question's answer and one or more existing project decisions. Help the user resolve this conflict by:

1. **Explain the Conflict** — Clearly describe the contradiction between the question's answer and the conflicting decision(s). Present both sides objectively.
2. **Analyze Impact** — What happens if the user keeps the existing decision? What happens if they update it based on this new information?
3. **Suggest Resolution Options** — Provide 2-3 concrete options for resolving the conflict, with pros/cons for each.
4. **Guide Discussion** — Ask clarifying questions to help the user make an informed decision.

## Rules
- Reference decisions and questions by their display IDs
- Be objective — present both sides fairly
- Focus on business impact, not just technical correctness
- If the user reaches a resolution, summarize the agreed outcome clearly
- The user can click "Mark Resolved" when they're satisfied with the resolution`)

  return parts.join("\n")
}
