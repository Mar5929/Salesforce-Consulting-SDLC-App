/**
 * create_requirement Tool Implementation
 *
 * Used by the agent harness during transcript processing to create
 * requirements discovered in transcripts.
 *
 * Threat mitigation: T-02-16 (sanitizeToolInput called by tool-executor before dispatch)
 */

import { prisma } from "@/lib/db"
import { generateDisplayId } from "@/lib/display-id"
import { createId } from "@paralleldrive/cuid2"

interface CreateRequirementInput {
  description: string
  source?: string
  priority?: string
  confidence?: string
  needsReview?: boolean
  reviewReason?: string
  sourceTranscriptId?: string
}

interface CreateRequirementResult {
  requirement: {
    id: string
    displayId: string
    description: string
    source: string | null
    priority: string
    status: string
    confidence: string
    needsReview: boolean
  }
}

/**
 * Execute the create_requirement tool.
 *
 * Creates a Requirement record with a generated display ID (REQ-XX format).
 *
 * @param input - Sanitized tool input from the AI
 * @param projectId - Project scope
 * @returns Created requirement summary
 */
export async function executeCreateRequirement(
  input: Record<string, unknown>,
  projectId: string
): Promise<CreateRequirementResult> {
  const parsed: CreateRequirementInput = {
    description: String(input.description ?? ""),
    source: input.source ? String(input.source) : undefined,
    priority: input.priority ? String(input.priority) : "MEDIUM",
    confidence: input.confidence ? String(input.confidence) : "HIGH",
    needsReview: input.needsReview === true,
    reviewReason: input.reviewReason ? String(input.reviewReason) : undefined,
    sourceTranscriptId: input.sourceTranscriptId
      ? String(input.sourceTranscriptId)
      : undefined,
  }

  if (!parsed.description.trim()) {
    throw new Error("description is required and cannot be empty")
  }

  // Validate priority enum
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
  if (!parsed.priority || !validPriorities.includes(parsed.priority)) {
    parsed.priority = "MEDIUM"
  }

  // Validate confidence enum
  const validConfidence = ["HIGH", "MEDIUM", "LOW"]
  if (!parsed.confidence || !validConfidence.includes(parsed.confidence)) {
    parsed.confidence = "HIGH"
  }

  const displayId = await generateDisplayId(projectId, "Requirement", prisma)

  const requirement = await prisma.requirement.create({
    data: {
      id: createId(),
      projectId,
      displayId,
      description: parsed.description,
      source: parsed.source ?? null,
      priority: parsed.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      status: "CAPTURED",
      confidence: parsed.confidence as "HIGH" | "MEDIUM" | "LOW",
      needsReview: parsed.needsReview ?? false,
      reviewReason: parsed.reviewReason ?? null,
    },
  })

  return {
    requirement: {
      id: requirement.id,
      displayId: requirement.displayId,
      description: requirement.description,
      source: requirement.source,
      priority: requirement.priority,
      status: requirement.status,
      confidence: requirement.confidence,
      needsReview: requirement.needsReview,
    },
  }
}
