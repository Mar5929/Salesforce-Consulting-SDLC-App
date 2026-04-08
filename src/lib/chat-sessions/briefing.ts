/**
 * Briefing Session Prompt Builder
 *
 * Assembles context and builds the system prompt for BRIEFING_SESSION conversations.
 * Loads project summary, open questions, recent decisions, article summaries,
 * and active sprint data to generate a structured project briefing.
 */

import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getProjectSummary } from "@/lib/agent-harness/context/project-summary"
import { getOpenQuestions } from "@/lib/agent-harness/context/questions"
import { getRecentDecisions } from "@/lib/agent-harness/context/decisions"
import { getArticleSummaries } from "@/lib/agent-harness/context/article-summaries"

export async function buildBriefingSessionPrompt(
  projectId: string
): Promise<string> {
  const scoped = scopedPrisma(projectId)

  const [projectSummary, questions, decisions, articles, activeSprint] =
    await Promise.all([
      getProjectSummary(projectId),
      getOpenQuestions(projectId, 20),
      getRecentDecisions(projectId, 10),
      getArticleSummaries(projectId),
      scoped.sprint.findFirst({
        where: { status: "ACTIVE" },
        include: {
          stories: {
            select: { id: true, status: true, title: true, storyPoints: true },
          },
        },
      }),
    ])

  const parts: string[] = [
    `You are an AI assistant generating a project briefing for a Salesforce consulting engagement.

## Project Context
${projectSummary}`,
  ]

  if (questions.length > 0) {
    parts.push(
      "\n## Open Questions",
      ...questions.map(
        (q) => `- [${q.displayId}] [${q.status}] ${q.questionText}`
      )
    )
  }

  if (decisions.length > 0) {
    parts.push(
      "\n## Recent Decisions",
      ...decisions.map(
        (d) =>
          `- [${d.displayId}] ${d.title}: ${d.rationale.substring(0, 200)}`
      )
    )
  }

  const topArticles = articles.slice(0, 5)
  if (topArticles.length > 0) {
    parts.push(
      "\n## Knowledge Articles",
      ...topArticles.map((a) => `- ${a.title}: ${a.summary}`)
    )
  }

  if (activeSprint) {
    const total = activeSprint.stories.length
    const done = activeSprint.stories.filter(
      (s) => s.status === "DONE"
    ).length
    const totalPoints = activeSprint.stories.reduce(
      (sum, s) => sum + (s.storyPoints ?? 0),
      0
    )
    parts.push(
      `\n## Active Sprint: ${activeSprint.name}`,
      `- Stories: ${done}/${total} complete`,
      `- Total story points: ${totalPoints}`,
      `- Start: ${activeSprint.startDate.toISOString().split("T")[0]}`,
      `- End: ${activeSprint.endDate.toISOString().split("T")[0]}`
    )
  }

  parts.push(`
## Your Task
Generate a comprehensive project briefing in markdown with the following sections:

### Current Focus
What the team should be focused on right now based on open questions, sprint status, and recent decisions.

### Outstanding Items
Key open questions and unresolved items that need attention, prioritized by impact.

### Recommended Actions
Specific, actionable next steps for the team. Reference specific questions or decisions by their IDs.

### Sprint Status
Current sprint progress, velocity insights, and any stories at risk.

## Rules
- Be specific and reference items by their display IDs (e.g., Q-001, D-003)
- Prioritize items by business impact, not recency
- Flag any contradictions between decisions and open questions
- Keep sections concise but actionable
- If data is missing for a section, note what's missing rather than fabricating details`)

  return parts.join("\n")
}
