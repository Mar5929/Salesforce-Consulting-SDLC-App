/**
 * Questions Context Loader
 *
 * Provides open questions and individual question context for AI consumption.
 * Uses scopedPrisma for project isolation (T-02-06).
 */

import { scopedPrisma } from "@/lib/project-scope"

/** Truncate text to a maximum length, appending "..." if truncated */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export interface QuestionSummary {
  id: string
  displayId: string
  questionText: string
  status: string
  scope: string
  answerText: string | null
  category: string | null
}

export interface QuestionContextResult {
  id: string
  displayId: string
  questionText: string
  status: string
  scope: string
  answerText: string | null
  impactAssessment: string | null
  scopeEpic: { id: string; name: string; prefix: string } | null
  scopeFeature: { id: string; name: string; prefix: string } | null
  blockedEntities: Array<{ type: string; displayId: string; title: string }>
  relatedDecisions: Array<{ id: string; displayId: string; title: string }>
}

/**
 * Fetch open/non-reviewed questions for context assembly.
 * Truncates questionText to ~200 chars for summary context.
 */
export async function getOpenQuestions(
  projectId: string,
  limit: number = 20
): Promise<QuestionSummary[]> {
  const scoped = scopedPrisma(projectId)

  const questions = await scoped.question.findMany({
    where: {
      status: { not: "REVIEWED" },
    },
    select: {
      id: true,
      displayId: true,
      questionText: true,
      status: true,
      scope: true,
      answerText: true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  })

  return questions.map((q: Record<string, unknown>) => ({
    id: q.id as string,
    displayId: q.displayId as string,
    questionText: truncateText(q.questionText as string, 200),
    status: q.status as string,
    scope: q.scope as string,
    answerText: q.answerText as string | null,
    category: null,
  }))
}

/**
 * Fetch a single question with all linked entities for impact assessment.
 */
export async function getQuestionContext(
  projectId: string,
  questionId: string
): Promise<QuestionContextResult | null> {
  const scoped = scopedPrisma(projectId)

  const question = await scoped.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      displayId: true,
      questionText: true,
      status: true,
      scope: true,
      answerText: true,
      impactAssessment: true,
      scopeEpic: { select: { id: true, name: true, prefix: true } },
      scopeFeature: { select: { id: true, name: true, prefix: true } },
      questionBlocksStories: {
        select: {
          story: { select: { id: true, displayId: true, title: true } },
        },
      },
      questionBlocksEpics: {
        select: {
          epic: { select: { id: true, name: true, prefix: true } },
        },
      },
      questionBlocksFeatures: {
        select: {
          feature: { select: { id: true, name: true, prefix: true } },
        },
      },
      decisionQuestions: {
        select: {
          decision: { select: { id: true, displayId: true, title: true } },
        },
      },
    },
  })

  if (!question) return null

  // Flatten blocked entities from all join tables
  const blockedEntities: QuestionContextResult["blockedEntities"] = []

  if (question.questionBlocksStories) {
    for (const qbs of question.questionBlocksStories) {
      blockedEntities.push({
        type: "Story",
        displayId: qbs.story.displayId,
        title: qbs.story.title,
      })
    }
  }

  if (question.questionBlocksEpics) {
    for (const qbe of question.questionBlocksEpics) {
      blockedEntities.push({
        type: "Epic",
        displayId: qbe.epic.prefix,
        title: qbe.epic.name,
      })
    }
  }

  if (question.questionBlocksFeatures) {
    for (const qbf of question.questionBlocksFeatures) {
      blockedEntities.push({
        type: "Feature",
        displayId: qbf.feature.prefix,
        title: qbf.feature.name,
      })
    }
  }

  const decisionQuestions = question.decisionQuestions as Array<{
    decision: { id: string; displayId: string; title: string }
  }> | undefined
  const relatedDecisions = (decisionQuestions || []).map((dq) => ({
    id: dq.decision.id,
    displayId: dq.decision.displayId,
    title: dq.decision.title,
  }))

  return {
    id: question.id,
    displayId: question.displayId,
    questionText: question.questionText,
    status: question.status,
    scope: question.scope,
    answerText: question.answerText,
    impactAssessment: question.impactAssessment,
    scopeEpic: question.scopeEpic,
    scopeFeature: question.scopeFeature,
    blockedEntities,
    relatedDecisions,
  }
}
