import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"
import { generateDisplayId } from "@/lib/display-id"
import { prisma } from "@/lib/db"
import type { RiskLikelihood, RiskImpact, RiskSeverity } from "@/generated/prisma"

/** Compute risk severity from likelihood x impact matrix */
function computeSeverity(likelihood: RiskLikelihood, impact: RiskImpact): RiskSeverity {
  if (likelihood === "HIGH" && impact === "HIGH") return "CRITICAL"
  if (likelihood === "HIGH" && impact === "MEDIUM") return "HIGH"
  if (likelihood === "HIGH" && impact === "LOW") return "MEDIUM"
  if (likelihood === "MEDIUM" && impact === "HIGH") return "HIGH"
  if (likelihood === "MEDIUM" && impact === "MEDIUM") return "MEDIUM"
  if (likelihood === "MEDIUM" && impact === "LOW") return "LOW"
  if (likelihood === "LOW" && impact === "HIGH") return "MEDIUM"
  if (likelihood === "LOW" && impact === "MEDIUM") return "LOW"
  return "LOW" // LOW + LOW
}

export function mutateRisksTools(projectId: string, memberId: string) {
  const scoped = scopedPrisma(projectId)
  void memberId

  return {
    create_risk: tool({
      description: "Log a project risk. Severity is computed automatically from likelihood and impact. Returns the created risk summary.",
      inputSchema: z.object({
        title: z.string().min(1).max(300).describe("Risk title"),
        description: z.string().min(1).describe("Risk description"),
        likelihood: z.enum(["LOW", "MEDIUM", "HIGH"]),
        impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
        mitigationPlan: z.string().optional(),
        ownerId: z.string().optional().describe("ProjectMember ID of the risk owner"),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const severity = computeSeverity(s.likelihood, s.impact)
          const displayId = await generateDisplayId(projectId, "Risk", prisma)
          const risk = await scoped.risk.create({
            data: {
              projectId,
              displayId,
              description: `${s.title}\n\n${s.description}`,
              likelihood: s.likelihood,
              impact: s.impact,
              severity,
              mitigationStrategy: s.mitigationPlan,
              ownerId: s.ownerId,
              status: "OPEN",
            },
            select: { id: true, displayId: true, description: true, severity: true, status: true },
          })
          return { success: true, risk }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Create failed" }
        }
      },
    }),

    update_risk: tool({
      description: "Update fields on an existing risk. Severity is recomputed if likelihood or impact changes.",
      inputSchema: z.object({
        riskId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        likelihood: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        impact: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        mitigationPlan: z.string().optional(),
        status: z.enum(["OPEN", "MITIGATED", "CLOSED", "ACCEPTED"]).optional(),
        ownerId: z.string().optional(),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const existing = await scoped.risk.findUnique({
            where: { id: s.riskId },
            select: { id: true, likelihood: true, impact: true, description: true },
          })
          if (!existing) return { success: false, error: "Risk not found" }
          const newLikelihood = s.likelihood ?? existing.likelihood
          const newImpact = s.impact ?? existing.impact
          const severity = computeSeverity(newLikelihood, newImpact)
          const { riskId, title, description, likelihood, impact, mitigationPlan, ...rest } = s
          // If title or description changed, rebuild description field
          let updatedDescription: string | undefined
          if (description !== undefined || title !== undefined) {
            const parts = existing.description.split("\n\n")
            const existingTitle = parts[0] ?? ""
            const existingDesc = parts.slice(1).join("\n\n")
            updatedDescription = `${title ?? existingTitle}\n\n${description ?? existingDesc}`
          }
          const risk = await scoped.risk.update({
            where: { id: riskId },
            data: {
              ...(updatedDescription !== undefined && { description: updatedDescription }),
              ...(likelihood !== undefined && { likelihood }),
              ...(impact !== undefined && { impact }),
              severity,
              ...(mitigationPlan !== undefined && { mitigationStrategy: mitigationPlan }),
              ...(rest.status !== undefined && { status: rest.status }),
              ...(rest.ownerId !== undefined && { ownerId: rest.ownerId }),
            },
            select: { id: true, displayId: true, description: true, severity: true, status: true },
          })
          return { success: true, risk }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Update failed" }
        }
      },
    }),
  }
}
