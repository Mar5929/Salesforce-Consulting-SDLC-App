/**
 * Article Synthesis Task Definition (Layer 1)
 *
 * Defines the AI task for refreshing knowledge articles by synthesizing
 * updated content from source entities. Uses SINGLE_TURN execution mode
 * (pure text generation, no tools). Runs in BACKGROUND mode (no user present).
 *
 * Architecture: D-18, KNOW-04
 */

import type { TaskDefinition, TaskInput, ProjectContext } from "../types"
import { getProjectSummary } from "../context/project-summary"
import { prisma } from "@/lib/db"

/**
 * Context loader for article synthesis.
 * Loads the existing article content + all source entities that changed
 * since last refresh + project summary.
 */
async function articleSynthesisContextLoader(
  input: TaskInput,
  projectId: string
): Promise<ProjectContext> {
  const articleId = input.entityId
  if (!articleId) {
    return { rawContext: "No article ID provided." }
  }

  const [projectSummary, article] = await Promise.all([
    getProjectSummary(projectId),
    prisma.knowledgeArticle.findUnique({
      where: { id: articleId },
      include: {
        references: true,
      },
    }),
  ])

  if (!article || article.projectId !== projectId) {
    return { projectSummary, rawContext: "Article not found." }
  }

  const rawParts: string[] = []

  // Current article content
  rawParts.push(
    [
      "Current Article:",
      `Title: ${article.title}`,
      `Type: ${article.articleType}`,
      `Version: ${article.version}`,
      `Content:\n${article.content}`,
    ].join("\n")
  )

  // Load source entities that reference this article
  const refs = article.references
  if (refs.length > 0) {
    const questionIds = refs
      .filter((r) => r.entityType === "QUESTION")
      .map((r) => r.entityId)
    const decisionIds = refs
      .filter((r) => r.entityType === "DECISION")
      .map((r) => r.entityId)

    const [questions, decisions] = await Promise.all([
      questionIds.length > 0
        ? prisma.question.findMany({
            where: { id: { in: questionIds }, projectId },
            select: {
              id: true,
              displayId: true,
              questionText: true,
              answerText: true,
              status: true,
            },
          })
        : Promise.resolve([]),
      decisionIds.length > 0
        ? prisma.decision.findMany({
            where: { id: { in: decisionIds }, projectId },
            select: {
              id: true,
              displayId: true,
              title: true,
              rationale: true,
            },
          })
        : Promise.resolve([]),
    ])

    if (questions.length > 0) {
      rawParts.push(
        "Source Questions:\n" +
          questions
            .map(
              (q) =>
                `- [${q.displayId}] ${q.questionText}${q.answerText ? `\n  Answer: ${q.answerText}` : ""}`
            )
            .join("\n")
      )
    }

    if (decisions.length > 0) {
      rawParts.push(
        "Source Decisions:\n" +
          decisions
            .map(
              (d) =>
                `- [${d.displayId}] ${d.title}${d.rationale ? `\n  Rationale: ${d.rationale}` : ""}`
            )
            .join("\n")
      )
    }
  }

  return {
    projectSummary,
    rawContext: rawParts.join("\n\n"),
  }
}

export const articleSynthesisTask: TaskDefinition = {
  taskType: "ARTICLE_SYNTHESIS",
  executionMode: "SINGLE_TURN",
  maxIterations: 1,
  maxRetries: 2,
  ambiguityMode: "BACKGROUND",

  systemPromptTemplate: `You are an AI assistant maintaining a knowledge article for a Salesforce consulting project. Your job is to synthesize understanding from all source entities into a coherent, up-to-date article.

## Project Context
{{context}}

## Your Task
Update the knowledge article based on all available source information. You must:

1. Preserve existing accurate information
2. Integrate new information from source entities
3. Resolve any contradictions (note them explicitly)
4. Maintain a clear, professional writing style
5. Structure the content with markdown headings

## Output Format
Return a JSON object with exactly two fields:
- "content": The updated article content as markdown. At the end, include a brief "Changes in this version" section listing what was updated.
- "summary": A 1-2 sentence plain-text summary of what this article covers, suitable for display in a list view.

Return ONLY the JSON object, no markdown code fences or other wrapping.

Be thorough but concise. Focus on actionable understanding that helps the project team.`,

  contextLoader: articleSynthesisContextLoader,

  tools: [], // Pure text generation, no tools

  outputValidator: (output: string) => {
    const errors: string[] = []

    if (!output || output.trim().length < 50) {
      errors.push("Output is too short to be a valid article")
    }

    // Validate JSON structure with content and summary fields
    try {
      const parsed = JSON.parse(output.trim())
      if (typeof parsed.content !== "string" || !parsed.content.trim()) {
        errors.push("Output JSON must include a non-empty 'content' field")
      }
      if (typeof parsed.summary !== "string" || !parsed.summary.trim()) {
        errors.push("Output JSON must include a non-empty 'summary' field")
      }
    } catch {
      errors.push(
        "Output must be valid JSON with 'content' and 'summary' fields"
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },
}
