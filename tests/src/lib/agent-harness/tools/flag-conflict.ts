/**
 * flag_conflict Tool Implementation (KNOW-07)
 *
 * Used by the agent harness to flag conflicts when the AI detects
 * contradicting information between entities (e.g., a question answer
 * contradicts an existing decision or requirement).
 *
 * Creates a conflict annotation by updating the relevant question
 * with needsReview=true and storing the conflict details in the
 * impactAssessment field.
 */

import { prisma } from "@/lib/db"

interface FlagConflictInput {
  conflictType: string
  conflictingEntityId?: string
  description: string
  severity: string
  sourceEntityId?: string
}

interface FlagConflictResult {
  success: true
  conflictType: string
  severity: string
  description: string
  flaggedForReview: boolean
}

/**
 * Execute the flag_conflict tool.
 *
 * When the AI detects a contradiction between entities, this tool:
 * 1. Records the conflict details
 * 2. Flags the source question for review (needsReview=true)
 * 3. Stores conflict info in the question's impactAssessment field
 *
 * @param input - Sanitized tool input from the AI
 * @param projectId - Project scope
 * @returns Conflict registration result
 */
export async function executeFlagConflict(
  input: Record<string, unknown>,
  projectId: string
): Promise<FlagConflictResult> {
  const parsed: FlagConflictInput = {
    conflictType: String(input.conflictType ?? "SCOPE_CONFLICT"),
    conflictingEntityId: input.conflictingEntityId
      ? String(input.conflictingEntityId)
      : undefined,
    description: String(input.description ?? ""),
    severity: String(input.severity ?? "MEDIUM"),
    sourceEntityId: input.sourceEntityId
      ? String(input.sourceEntityId)
      : undefined,
  }

  if (!parsed.description.trim()) {
    throw new Error("Conflict description is required")
  }

  // Validate conflict type
  const validTypes = ["DECISION_CONFLICT", "REQUIREMENT_CONFLICT", "SCOPE_CONFLICT"]
  if (!validTypes.includes(parsed.conflictType)) {
    parsed.conflictType = "SCOPE_CONFLICT"
  }

  // Validate severity
  const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
  if (!validSeverities.includes(parsed.severity)) {
    parsed.severity = "MEDIUM"
  }

  // Build conflict annotation
  const conflictAnnotation = {
    type: parsed.conflictType,
    severity: parsed.severity,
    description: parsed.description,
    conflictingEntityId: parsed.conflictingEntityId ?? null,
    detectedAt: new Date().toISOString(),
  }

  let flaggedForReview = false

  // If we have a source entity (typically a question), flag it for review
  if (parsed.sourceEntityId) {
    const question = await prisma.question.findUnique({
      where: { id: parsed.sourceEntityId },
      select: { projectId: true, impactAssessment: true },
    })

    if (question && question.projectId === projectId) {
      // Append conflict info to impactAssessment
      let assessmentData: Record<string, unknown> = {}
      if (question.impactAssessment) {
        try {
          assessmentData = JSON.parse(question.impactAssessment) as Record<string, unknown>
        } catch {
          assessmentData = { previousContent: question.impactAssessment }
        }
      }

      const existingConflicts = (assessmentData.conflicts ?? []) as unknown[]
      const updatedConflicts = [...existingConflicts, conflictAnnotation]
      assessmentData.conflicts = updatedConflicts

      await prisma.question.update({
        where: { id: parsed.sourceEntityId },
        data: {
          needsReview: true,
          reviewReason: `AI detected conflict: ${parsed.conflictType} (${parsed.severity})`,
          impactAssessment: JSON.stringify(assessmentData),
        },
      })

      flaggedForReview = true
    }
  }

  // If conflicting entity is a question, also flag it
  if (parsed.conflictingEntityId) {
    const conflictingQuestion = await prisma.question.findUnique({
      where: { id: parsed.conflictingEntityId },
      select: { projectId: true },
    })

    if (conflictingQuestion && conflictingQuestion.projectId === projectId) {
      await prisma.question.update({
        where: { id: parsed.conflictingEntityId },
        data: {
          needsReview: true,
          reviewReason: `Conflict detected with another entity: ${parsed.description.slice(0, 200)}`,
        },
      })
    }
  }

  return {
    success: true,
    conflictType: parsed.conflictType,
    severity: parsed.severity,
    description: parsed.description,
    flaggedForReview,
  }
}
