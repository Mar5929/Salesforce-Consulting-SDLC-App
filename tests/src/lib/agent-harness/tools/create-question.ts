/**
 * create_question Tool Implementation
 *
 * Used by the agent harness during transcript processing to create
 * questions discovered in transcripts. Includes dedup check against
 * existing questions (D-10/TRNS-03).
 *
 * Threat mitigation: T-02-16 (sanitizeToolInput called by tool-executor before dispatch)
 */

import { prisma } from "@/lib/db"
import { generateDisplayId } from "@/lib/display-id"
import { createId } from "@paralleldrive/cuid2"

interface CreateQuestionInput {
  questionText: string
  scope: string
  priority?: string
  sourceTranscriptId?: string
  scopeEpicId?: string
  scopeFeatureId?: string
}

interface CreateQuestionResult {
  duplicate: false
  question: {
    id: string
    displayId: string
    questionText: string
    scope: string
    priority: string
    status: string
  }
}

interface DuplicateResult {
  duplicate: true
  existingId: string
  existingDisplayId: string
  existingText: string
  similarity: string
}

/**
 * Execute the create_question tool.
 *
 * 1. Check for duplicate questions by substring matching
 * 2. If duplicate found, return info for AI/user to decide
 * 3. If unique, create question with generated display ID
 *
 * @param input - Sanitized tool input from the AI
 * @param projectId - Project scope
 * @returns Created question or duplicate info
 */
export async function executeCreateQuestion(
  input: Record<string, unknown>,
  projectId: string
): Promise<CreateQuestionResult | DuplicateResult> {
  const parsed: CreateQuestionInput = {
    questionText: String(input.questionText ?? ""),
    scope: String(input.scope ?? "ENGAGEMENT"),
    priority: input.priority ? String(input.priority) : "MEDIUM",
    sourceTranscriptId: input.sourceTranscriptId ? String(input.sourceTranscriptId) : undefined,
    scopeEpicId: input.scopeEpicId ? String(input.scopeEpicId) : undefined,
    scopeFeatureId: input.scopeFeatureId ? String(input.scopeFeatureId) : undefined,
  }

  if (!parsed.questionText.trim()) {
    throw new Error("questionText is required and cannot be empty")
  }

  // Validate scope enum
  const validScopes = ["ENGAGEMENT", "EPIC", "FEATURE"]
  if (!validScopes.includes(parsed.scope)) {
    parsed.scope = "ENGAGEMENT"
  }

  // Validate priority enum
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
  if (!parsed.priority || !validPriorities.includes(parsed.priority)) {
    parsed.priority = "MEDIUM"
  }

  // Dedup check: search existing questions for similar text (D-10/TRNS-03)
  const existingQuestions = await prisma.question.findMany({
    where: { projectId },
    select: { id: true, displayId: true, questionText: true },
  })

  const normalizedInput = parsed.questionText.toLowerCase().trim()
  for (const existing of existingQuestions) {
    const normalizedExisting = existing.questionText.toLowerCase().trim()

    // Check exact match
    if (normalizedInput === normalizedExisting) {
      return {
        duplicate: true,
        existingId: existing.id,
        existingDisplayId: existing.displayId,
        existingText: existing.questionText,
        similarity: "exact",
      }
    }

    // Check if one is a substantial substring of the other (>80% overlap)
    if (
      normalizedInput.length > 20 &&
      (normalizedExisting.includes(normalizedInput) ||
        normalizedInput.includes(normalizedExisting))
    ) {
      const overlapRatio = Math.min(normalizedInput.length, normalizedExisting.length) /
        Math.max(normalizedInput.length, normalizedExisting.length)
      if (overlapRatio > 0.8) {
        return {
          duplicate: true,
          existingId: existing.id,
          existingDisplayId: existing.displayId,
          existingText: existing.questionText,
          similarity: `substring_overlap_${Math.round(overlapRatio * 100)}%`,
        }
      }
    }
  }

  // No duplicate found — create the question
  const displayId = await generateDisplayId(projectId, "Question", prisma)

  const question = await prisma.question.create({
    data: {
      id: createId(),
      projectId,
      displayId,
      questionText: parsed.questionText,
      scope: parsed.scope as "ENGAGEMENT" | "EPIC" | "FEATURE",
      priority: parsed.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      scopeEpicId: parsed.scopeEpicId ?? null,
      scopeFeatureId: parsed.scopeFeatureId ?? null,
      status: "OPEN",
    },
  })

  return {
    duplicate: false,
    question: {
      id: question.id,
      displayId: question.displayId,
      questionText: question.questionText,
      scope: question.scope,
      priority: question.priority,
      status: question.status,
    },
  }
}
