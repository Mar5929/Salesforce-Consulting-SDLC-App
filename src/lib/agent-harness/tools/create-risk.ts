/**
 * create_risk Tool Implementation
 *
 * Used by the agent harness during transcript processing to create
 * risks discovered in transcripts.
 *
 * Threat mitigation: T-02-16 (sanitizeToolInput called by tool-executor before dispatch)
 */

import { prisma } from "@/lib/db"
import { generateDisplayId } from "@/lib/display-id"
import { createId } from "@paralleldrive/cuid2"

interface CreateRiskInput {
  description: string
  likelihood: string
  impact: string
  mitigationStrategy?: string
  confidence?: string
  needsReview?: boolean
  reviewReason?: string
  sourceTranscriptId?: string
}

interface CreateRiskResult {
  risk: {
    id: string
    displayId: string
    description: string
    likelihood: string
    impact: string
    severity: string
    mitigationStrategy: string | null
    status: string
    confidence: string
    needsReview: boolean
  }
}

/**
 * Compute severity from likelihood x impact matrix.
 * LOW x LOW = LOW, HIGH x HIGH = CRITICAL, etc.
 */
function computeSeverity(likelihood: string, impact: string): string {
  const likelihoodLevel = { LOW: 1, MEDIUM: 2, HIGH: 3 }[likelihood] ?? 2
  const impactLevel = { LOW: 1, MEDIUM: 2, HIGH: 3 }[impact] ?? 2
  const score = likelihoodLevel * impactLevel

  if (score >= 6) return "CRITICAL"
  if (score >= 4) return "HIGH"
  if (score >= 2) return "MEDIUM"
  return "LOW"
}

/**
 * Execute the create_risk tool.
 *
 * Creates a Risk record with a generated display ID (R-XX format).
 * Computes severity from likelihood x impact.
 *
 * @param input - Sanitized tool input from the AI
 * @param projectId - Project scope
 * @returns Created risk summary
 */
export async function executeCreateRisk(
  input: Record<string, unknown>,
  projectId: string
): Promise<CreateRiskResult> {
  const parsed: CreateRiskInput = {
    description: String(input.description ?? ""),
    likelihood: String(input.likelihood ?? "MEDIUM"),
    impact: String(input.impact ?? "MEDIUM"),
    mitigationStrategy: input.mitigationStrategy
      ? String(input.mitigationStrategy)
      : undefined,
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

  // Validate likelihood enum
  const validLikelihood = ["LOW", "MEDIUM", "HIGH"]
  if (!validLikelihood.includes(parsed.likelihood)) {
    parsed.likelihood = "MEDIUM"
  }

  // Validate impact enum
  const validImpact = ["LOW", "MEDIUM", "HIGH"]
  if (!validImpact.includes(parsed.impact)) {
    parsed.impact = "MEDIUM"
  }

  // Validate confidence enum
  const validConfidence = ["HIGH", "MEDIUM", "LOW"]
  if (!parsed.confidence || !validConfidence.includes(parsed.confidence)) {
    parsed.confidence = "HIGH"
  }

  const severity = computeSeverity(parsed.likelihood, parsed.impact)
  const displayId = await generateDisplayId(projectId, "Risk", prisma)

  const risk = await prisma.risk.create({
    data: {
      id: createId(),
      projectId,
      displayId,
      description: parsed.description,
      likelihood: parsed.likelihood as "LOW" | "MEDIUM" | "HIGH",
      impact: parsed.impact as "LOW" | "MEDIUM" | "HIGH",
      severity: severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      mitigationStrategy: parsed.mitigationStrategy ?? null,
      status: "OPEN",
      confidence: parsed.confidence as "HIGH" | "MEDIUM" | "LOW",
      needsReview: parsed.needsReview ?? false,
      reviewReason: parsed.reviewReason ?? null,
    },
  })

  return {
    risk: {
      id: risk.id,
      displayId: risk.displayId,
      description: risk.description,
      likelihood: risk.likelihood,
      impact: risk.impact,
      severity: risk.severity,
      mitigationStrategy: risk.mitigationStrategy,
      status: risk.status,
      confidence: risk.confidence,
      needsReview: risk.needsReview,
    },
  }
}
