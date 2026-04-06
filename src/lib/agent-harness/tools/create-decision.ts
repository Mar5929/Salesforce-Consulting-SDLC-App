/**
 * create_decision Tool Implementation
 *
 * Used by the agent harness during transcript processing to create
 * decisions discovered in transcripts.
 *
 * Threat mitigation: T-02-16 (sanitizeToolInput called by tool-executor before dispatch)
 */

import { prisma } from "@/lib/db"
import { generateDisplayId } from "@/lib/display-id"
import { createId } from "@paralleldrive/cuid2"

interface CreateDecisionInput {
  title: string
  rationale: string
  confidence?: string
  needsReview?: boolean
  reviewReason?: string
  sourceTranscriptId?: string
}

interface CreateDecisionResult {
  decision: {
    id: string
    displayId: string
    title: string
    rationale: string
    confidence: string
    needsReview: boolean
  }
}

/**
 * Execute the create_decision tool.
 *
 * Creates a Decision record with a generated display ID (D-XX format).
 *
 * @param input - Sanitized tool input from the AI
 * @param projectId - Project scope
 * @returns Created decision summary
 */
export async function executeCreateDecision(
  input: Record<string, unknown>,
  projectId: string
): Promise<CreateDecisionResult> {
  const parsed: CreateDecisionInput = {
    title: String(input.title ?? ""),
    rationale: String(input.rationale ?? ""),
    confidence: input.confidence ? String(input.confidence) : "HIGH",
    needsReview: input.needsReview === true,
    reviewReason: input.reviewReason ? String(input.reviewReason) : undefined,
    sourceTranscriptId: input.sourceTranscriptId
      ? String(input.sourceTranscriptId)
      : undefined,
  }

  if (!parsed.title.trim()) {
    throw new Error("title is required and cannot be empty")
  }
  if (!parsed.rationale.trim()) {
    throw new Error("rationale is required and cannot be empty")
  }

  // Validate confidence enum
  const validConfidence = ["HIGH", "MEDIUM", "LOW"]
  if (!parsed.confidence || !validConfidence.includes(parsed.confidence)) {
    parsed.confidence = "HIGH"
  }

  const displayId = await generateDisplayId(projectId, "Decision", prisma)

  const decision = await prisma.decision.create({
    data: {
      id: createId(),
      projectId,
      displayId,
      title: parsed.title,
      rationale: parsed.rationale,
      decisionDate: new Date(),
      confidence: parsed.confidence as "HIGH" | "MEDIUM" | "LOW",
      needsReview: parsed.needsReview ?? false,
      reviewReason: parsed.reviewReason ?? null,
    },
  })

  return {
    decision: {
      id: decision.id,
      displayId: decision.displayId,
      title: decision.title,
      rationale: decision.rationale,
      confidence: decision.confidence,
      needsReview: decision.needsReview,
    },
  }
}
