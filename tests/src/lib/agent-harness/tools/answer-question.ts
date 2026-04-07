/**
 * answer_question Tool Implementation
 *
 * Used by the agent harness to update a question with an AI-generated answer
 * and source attribution. Sets question status to ANSWERED.
 */

import { prisma } from "@/lib/db"

interface AnswerQuestionResult {
  success: true
  questionId: string
  displayId: string
  status: string
}

/**
 * Execute the answer_question tool.
 *
 * Updates the question with the AI-generated answer, marks status as ANSWERED,
 * and records the answer timestamp.
 *
 * @param input - Sanitized tool input from the AI
 * @param projectId - Project scope
 * @returns Updated question summary
 */
export async function executeAnswerQuestion(
  input: Record<string, unknown>,
  projectId: string
): Promise<AnswerQuestionResult> {
  const questionId = String(input.questionId ?? "")
  const answerText = String(input.answerText ?? "")
  const sourceUrl = input.sourceUrl ? String(input.sourceUrl) : undefined

  if (!questionId) {
    throw new Error("questionId is required")
  }
  if (!answerText.trim()) {
    throw new Error("answerText is required and cannot be empty")
  }

  // Verify question belongs to this project
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    select: { projectId: true, status: true },
  })

  if (!existing || existing.projectId !== projectId) {
    throw new Error(`Question ${questionId} not found in project ${projectId}`)
  }

  // Build answer text with optional source attribution
  const fullAnswer = sourceUrl
    ? `${answerText}\n\nSource: ${sourceUrl}`
    : answerText

  const question = await prisma.question.update({
    where: { id: questionId },
    data: {
      answerText: fullAnswer,
      answeredDate: new Date(),
      status: "ANSWERED",
    },
  })

  return {
    success: true,
    questionId: question.id,
    displayId: question.displayId,
    status: question.status,
  }
}
