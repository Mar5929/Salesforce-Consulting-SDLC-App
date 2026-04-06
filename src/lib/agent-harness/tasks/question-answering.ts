/**
 * Question Answering Task Definition (Layer 1)
 *
 * Defines the AI task for answering project questions with impact assessment.
 * Uses SINGLE_TURN execution mode — one AI call that produces an answer
 * and impact assessment, optionally flagging conflicts.
 *
 * Tech spec Section 3.4
 */

import type { TaskDefinition, TaskInput, ProjectContext } from "../types"
import { getProjectSummary } from "../context/project-summary"
import { getQuestionContext } from "../context/questions"
import { getArticleSummaries, getRelevantArticles } from "../context/article-summaries"

/**
 * Context loader for question answering.
 * Loads project summary + the specific question + related entities +
 * article summaries (two-pass: summaries then relevant full content).
 */
async function questionAnsweringContextLoader(
  input: TaskInput,
  projectId: string
): Promise<ProjectContext> {
  const questionId = input.entityId

  // Load project summary and question context in parallel
  const [projectSummary, questionContext, articleSummaries] = await Promise.all([
    getProjectSummary(projectId),
    questionId ? getQuestionContext(projectId, questionId) : Promise.resolve(null),
    getArticleSummaries(projectId),
  ])

  // Two-pass: determine relevant articles from summaries
  // For question answering, select top 3 articles most likely to be relevant
  // (In practice, the AI would determine relevance — here we load all summaries
  // and let the caller/task determine which to fetch fully)
  const topArticleIds = articleSummaries.slice(0, 3).map((a) => a.id)
  const relevantArticles =
    topArticleIds.length > 0
      ? await getRelevantArticles(projectId, topArticleIds)
      : []

  const rawParts: string[] = []

  if (questionContext) {
    rawParts.push(
      [
        `Question: [${questionContext.displayId}] ${questionContext.questionText}`,
        `Status: ${questionContext.status}`,
        `Scope: ${questionContext.scope}`,
        questionContext.scopeEpic
          ? `Scoped to Epic: ${questionContext.scopeEpic.prefix} - ${questionContext.scopeEpic.name}`
          : null,
        questionContext.scopeFeature
          ? `Scoped to Feature: ${questionContext.scopeFeature.prefix} - ${questionContext.scopeFeature.name}`
          : null,
        questionContext.answerText
          ? `Current Answer: ${questionContext.answerText}`
          : null,
        questionContext.impactAssessment
          ? `Current Impact Assessment: ${questionContext.impactAssessment}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    )

    if (questionContext.blockedEntities.length > 0) {
      rawParts.push(
        "Blocked Entities:\n" +
          questionContext.blockedEntities
            .map((e) => `- [${e.type}] ${e.displayId}: ${e.title}`)
            .join("\n")
      )
    }

    if (questionContext.relatedDecisions.length > 0) {
      rawParts.push(
        "Related Decisions:\n" +
          questionContext.relatedDecisions
            .map((d) => `- [${d.displayId}] ${d.title}`)
            .join("\n")
      )
    }
  }

  return {
    projectSummary,
    articles: relevantArticles.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
    })),
    rawContext: rawParts.length > 0 ? rawParts.join("\n\n") : undefined,
  }
}

export const questionAnsweringTask: TaskDefinition = {
  taskType: "QUESTION_ANSWERING",
  executionMode: "SINGLE_TURN",
  maxIterations: 1,
  maxRetries: 3,
  ambiguityMode: "TASK_SESSION",

  systemPromptTemplate: `You are an AI assistant analyzing a question for a Salesforce consulting project.

## Project Context
{{context}}

## Your Task
Provide a comprehensive answer to the question above, including:

1. **Answer** - A clear, actionable answer to the question based on available project context and Salesforce expertise.
2. **Impact Assessment** - How this question and its answer impacts the project:
   - Which epics, features, or stories are affected
   - Whether any existing decisions need to be revisited
   - Any risks introduced or mitigated
   - Estimated scope impact (none, minor, moderate, major)
3. **Confidence** - How confident you are in the answer (HIGH, MEDIUM, LOW)
4. **Recommendations** - Any follow-up actions or additional questions to consider

## Output Format
Structure your response as:

### Answer
[Your answer here]

### Impact Assessment
- **Affected Areas:** [list]
- **Decision Impact:** [any decisions affected]
- **Risk Impact:** [any risks introduced or mitigated]
- **Scope Impact:** [none|minor|moderate|major]

### Confidence
[HIGH|MEDIUM|LOW] - [brief justification]

### Recommendations
[Any follow-up items]

If you detect a conflict with an existing decision, use the flag_conflict tool.
If you can definitively answer the question, use the update_question_status tool.`,

  contextLoader: questionAnsweringContextLoader,

  tools: [
    {
      name: "flag_conflict",
      description:
        "Flag a conflict between the question's answer and an existing project decision or requirement.",
      input_schema: {
        type: "object",
        properties: {
          conflictType: {
            type: "string",
            enum: ["DECISION_CONFLICT", "REQUIREMENT_CONFLICT", "SCOPE_CONFLICT"],
            description: "Type of conflict detected",
          },
          conflictingEntityId: {
            type: "string",
            description: "ID of the conflicting decision/requirement",
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
    {
      name: "update_question_status",
      description:
        "Update the status of a question after providing an answer.",
      input_schema: {
        type: "object",
        properties: {
          questionId: {
            type: "string",
            description: "ID of the question to update",
          },
          status: {
            type: "string",
            enum: ["ANSWERED", "PARKED", "ESCALATED"],
            description: "New status for the question",
          },
          reason: {
            type: "string",
            description: "Reason for the status change",
          },
        },
        required: ["questionId", "status"],
      },
    },
  ],

  outputValidator: (output: string) => {
    const hasAnswer = output.includes("Answer") || output.includes("answer")
    const hasImpact =
      output.includes("Impact Assessment") ||
      output.includes("impact") ||
      output.includes("Impact")
    const errors: string[] = []

    if (!hasAnswer) errors.push("Output missing answer section")
    if (!hasImpact) errors.push("Output missing impact assessment section")

    return {
      valid: errors.length === 0,
      errors,
    }
  },
}
