/**
 * Question Impact Task Definition (Layer 1)
 *
 * Defines the AI task for assessing question impact with conflict detection.
 * Used by the hybrid Inngest function: if no conflict is found, the question
 * is auto-answered; if a conflict is detected via flag_conflict tool, a
 * QUESTION_SESSION conversation is created for human resolution.
 *
 * Uses SINGLE_TURN execution mode with BACKGROUND ambiguity (no user interaction).
 */

import type { TaskDefinition, TaskInput, ProjectContext } from "../types"
import { getProjectSummary } from "../context/project-summary"
import { getQuestionContext } from "../context/questions"
import { getRecentDecisions } from "../context/decisions"
import { getArticleSummaries } from "../context/article-summaries"

async function questionImpactContextLoader(
  input: TaskInput,
  projectId: string
): Promise<ProjectContext> {
  const questionId = input.entityId

  const [projectSummary, questionContext, decisions, articles] =
    await Promise.all([
      getProjectSummary(projectId),
      questionId
        ? getQuestionContext(projectId, questionId)
        : Promise.resolve(null),
      getRecentDecisions(projectId, 15),
      getArticleSummaries(projectId),
    ])

  const rawParts: string[] = []

  if (questionContext) {
    rawParts.push(
      [
        `Question: [${questionContext.displayId}] ${questionContext.questionText}`,
        `Status: ${questionContext.status}`,
        `Scope: ${questionContext.scope}`,
        questionContext.answerText
          ? `Answer: ${questionContext.answerText}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    )

    if (questionContext.relatedDecisions.length > 0) {
      rawParts.push(
        "Related Decisions:\n" +
          questionContext.relatedDecisions
            .map((d) => `- [${d.displayId}] ${d.title}`)
            .join("\n")
      )
    }
  }

  if (decisions.length > 0) {
    rawParts.push(
      "All Recent Decisions:\n" +
        decisions
          .map(
            (d) =>
              `- [${d.displayId}] ${d.title}: ${d.rationale.substring(0, 200)}`
          )
          .join("\n")
    )
  }

  return {
    projectSummary,
    articles: articles.slice(0, 3).map((a) => ({
      id: a.id,
      title: a.title,
      content: a.summary,
    })),
    rawContext: rawParts.length > 0 ? rawParts.join("\n\n") : undefined,
  }
}

export const questionImpactTask: TaskDefinition = {
  taskType: "QUESTION_ANSWERING",
  executionMode: "SINGLE_TURN",
  maxIterations: 1,
  maxRetries: 3,
  ambiguityMode: "BACKGROUND",

  systemPromptTemplate: `You are an AI assistant assessing the impact of a question for a Salesforce consulting project.

## Project Context
{{context}}

## Your Task
Analyze the question above and:

1. **Provide an Answer** — Give a clear, actionable answer based on available context and Salesforce expertise.
2. **Check for Conflicts** — Compare your answer against ALL existing decisions listed above. If your answer contradicts or undermines any existing decision, you MUST call the flag_conflict tool.
3. **Assess Impact** — Describe how this question and answer affects the project.

## Conflict Detection Rules
- A conflict exists if answering the question would require changing an existing decision
- A conflict exists if the answer reveals information that invalidates a prior decision's rationale
- When in doubt, flag the conflict — it's better to surface a potential issue than miss one
- You may call flag_conflict multiple times if multiple decisions are affected

## Output Format
### Answer
[Your answer]

### Impact Assessment
- **Scope Impact:** [none|minor|moderate|major]
- **Affected Areas:** [list]

### Confidence
[HIGH|MEDIUM|LOW]`,

  contextLoader: questionImpactContextLoader,

  tools: [
    {
      name: "flag_conflict",
      description:
        "Flag a conflict between the question's answer and an existing project decision.",
      input_schema: {
        type: "object",
        properties: {
          conflictType: {
            type: "string",
            enum: [
              "DECISION_CONFLICT",
              "REQUIREMENT_CONFLICT",
              "SCOPE_CONFLICT",
            ],
            description: "Type of conflict detected",
          },
          conflictingEntityId: {
            type: "string",
            description: "Display ID of the conflicting decision (e.g., D-003)",
          },
          description: {
            type: "string",
            description: "Description of the conflict and its implications",
          },
          severity: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            description: "Severity of the conflict",
          },
        },
        required: ["conflictType", "description", "severity"],
      },
    },
  ],
}
