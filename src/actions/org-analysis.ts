"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"

/**
 * Trigger the brownfield ingestion pipeline for a project's Salesforce org.
 * Only SA role can trigger (D-13, T-04-12).
 * Requires: org connected + at least one synced OrgComponent.
 */
export const triggerIngestion = actionClient
  .schema(z.object({ projectId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { projectId } = parsedInput

    // Verify SA role (T-04-12)
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        clerkUserId: ctx.userId,
        role: "SOLUTION_ARCHITECT",
      },
    })

    if (!member) {
      throw new Error("Only Solution Architects can trigger org ingestion")
    }

    // Verify org is connected
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { sfOrgInstanceUrl: true },
    })

    if (!project?.sfOrgInstanceUrl) {
      throw new Error("No Salesforce org connected to this project")
    }

    // Verify at least one OrgComponent exists (sync has run)
    const componentCount = await prisma.orgComponent.count({
      where: { projectId },
    })

    if (componentCount === 0) {
      throw new Error("No org components found. Run a metadata sync first.")
    }

    // Send Inngest event to trigger ingestion pipeline
    await inngest.send({
      name: EVENTS.ORG_INGESTION_REQUESTED,
      data: {
        projectId,
        userId: ctx.userId,
      },
    })

    return { success: true }
  })

/**
 * Get the current ingestion status for a project.
 * Returns counts of domain groupings and business processes.
 * Requires active project membership.
 */
export const getIngestionStatus = actionClient
  .schema(z.object({ projectId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { projectId } = parsedInput

    // Verify caller is an active member of this project
    const member = await prisma.projectMember.findFirst({
      where: { projectId, clerkUserId: ctx.userId, status: "ACTIVE" },
    })
    if (!member) {
      throw new Error("Not a member of this project")
    }

    const [dgTotal, dgConfirmed, bpTotal, bpConfirmed] = await Promise.all([
      prisma.domainGrouping.count({ where: { projectId } }),
      prisma.domainGrouping.count({ where: { projectId, isConfirmed: true } }),
      prisma.businessProcess.count({ where: { projectId } }),
      prisma.businessProcess.count({ where: { projectId, isConfirmed: true } }),
    ])

    return {
      domainGroupings: { total: dgTotal, confirmed: dgConfirmed },
      businessProcesses: { total: bpTotal, confirmed: bpConfirmed },
      hasRun: dgTotal > 0,
    }
  })

/**
 * Confirm an AI-suggested domain grouping.
 * SA or PM role required.
 */
export const confirmDomainGrouping = actionClient
  .schema(
    z.object({
      domainGroupingId: z.string(),
      projectId: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { domainGroupingId, projectId } = parsedInput

    await verifyAnalysisRole(projectId, ctx.userId)

    // Verify grouping belongs to this project before updating
    await verifyDomainGroupingOwnership(domainGroupingId, projectId)

    await prisma.domainGrouping.update({
      where: { id: domainGroupingId },
      data: { isConfirmed: true },
    })

    return { success: true }
  })

/**
 * Reject an AI-suggested domain grouping.
 * Deletes the grouping and unassigns its components.
 * SA or PM role required.
 */
export const rejectDomainGrouping = actionClient
  .schema(
    z.object({
      domainGroupingId: z.string(),
      projectId: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { domainGroupingId, projectId } = parsedInput

    await verifyAnalysisRole(projectId, ctx.userId)

    // Verify grouping belongs to this project before deleting
    await verifyDomainGroupingOwnership(domainGroupingId, projectId)

    // Unassign components from this grouping
    await prisma.orgComponent.updateMany({
      where: { domainGroupingId, projectId },
      data: { domainGroupingId: null },
    })

    // Delete the grouping (cascade removes business processes)
    await prisma.domainGrouping.delete({
      where: { id: domainGroupingId },
    })

    return { success: true }
  })

/**
 * Edit an AI-suggested domain grouping.
 * Edit implies confirmation (sets isConfirmed=true).
 * SA or PM role required.
 */
export const editDomainGrouping = actionClient
  .schema(
    z.object({
      domainGroupingId: z.string(),
      projectId: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { domainGroupingId, projectId, name, description } = parsedInput

    await verifyAnalysisRole(projectId, ctx.userId)
    await verifyDomainGroupingOwnership(domainGroupingId, projectId)

    await prisma.domainGrouping.update({
      where: { id: domainGroupingId },
      data: {
        name,
        description,
        isConfirmed: true, // Edit implies confirmation
      },
    })

    return { success: true }
  })

/**
 * Confirm an AI-suggested business process.
 * SA or PM role required.
 */
export const confirmBusinessProcess = actionClient
  .schema(
    z.object({
      businessProcessId: z.string(),
      projectId: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { businessProcessId, projectId } = parsedInput

    await verifyAnalysisRole(projectId, ctx.userId)
    await verifyBusinessProcessOwnership(businessProcessId, projectId)

    await prisma.businessProcess.update({
      where: { id: businessProcessId },
      data: { isConfirmed: true },
    })

    return { success: true }
  })

/**
 * Reject an AI-suggested business process.
 * Deletes the process and its component mappings (cascade).
 * SA or PM role required.
 */
export const rejectBusinessProcess = actionClient
  .schema(
    z.object({
      businessProcessId: z.string(),
      projectId: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { businessProcessId, projectId } = parsedInput

    await verifyAnalysisRole(projectId, ctx.userId)
    await verifyBusinessProcessOwnership(businessProcessId, projectId)

    // Delete the business process (cascade deletes BusinessProcessComponent join records)
    await prisma.businessProcess.delete({
      where: { id: businessProcessId },
    })

    return { success: true }
  })

/**
 * Edit an AI-suggested business process.
 * Edit implies confirmation (sets isConfirmed=true).
 * SA or PM role required.
 */
export const editBusinessProcess = actionClient
  .schema(
    z.object({
      businessProcessId: z.string(),
      projectId: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { businessProcessId, projectId, name, description } = parsedInput

    await verifyAnalysisRole(projectId, ctx.userId)
    await verifyBusinessProcessOwnership(businessProcessId, projectId)

    await prisma.businessProcess.update({
      where: { id: businessProcessId },
      data: {
        name,
        description,
        isConfirmed: true, // Edit implies confirmation
      },
    })

    return { success: true }
  })

/**
 * Bulk confirm high-confidence unconfirmed AI suggestions.
 * Only confirms domain groupings or business processes whose confidence
 * score meets the HIGH_CONFIDENCE_THRESHOLD (0.8 / 80%).
 * SA or PM role required.
 */
const HIGH_CONFIDENCE_THRESHOLD = 0.8

export const bulkConfirmHighConfidence = actionClient
  .schema(
    z.object({
      projectId: z.string(),
      type: z.enum(["domain", "process"]),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, type } = parsedInput

    await verifyAnalysisRole(projectId, ctx.userId)

    let confirmed: number

    if (type === "domain") {
      // Confirm unconfirmed high-confidence domain groupings for this project
      const result = await prisma.domainGrouping.updateMany({
        where: {
          projectId,
          isConfirmed: false,
          confidence: { gte: HIGH_CONFIDENCE_THRESHOLD },
        },
        data: { isConfirmed: true },
      })
      confirmed = result.count
    } else {
      // Confirm unconfirmed high-confidence business processes for this project
      const result = await prisma.businessProcess.updateMany({
        where: {
          projectId,
          isConfirmed: false,
          confidence: { gte: HIGH_CONFIDENCE_THRESHOLD },
        },
        data: { isConfirmed: true },
      })
      confirmed = result.count
    }

    return { confirmed }
  })

/**
 * Verify that the current user has SA or PM role on the project.
 * Used by confirm/reject/edit actions.
 */
async function verifyAnalysisRole(
  projectId: string,
  clerkUserId: string
): Promise<void> {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      clerkUserId,
      role: { in: ["SOLUTION_ARCHITECT", "PM"] },
    },
  })

  if (!member) {
    throw new Error(
      "Only Solution Architects and Project Managers can manage org analysis"
    )
  }
}

/**
 * Verify that a domain grouping belongs to the specified project.
 * Prevents cross-project manipulation via crafted IDs.
 */
async function verifyDomainGroupingOwnership(
  domainGroupingId: string,
  projectId: string
): Promise<void> {
  const grouping = await prisma.domainGrouping.findFirst({
    where: { id: domainGroupingId, projectId },
    select: { id: true },
  })
  if (!grouping) {
    throw new Error("Domain grouping not found in this project")
  }
}

/**
 * Verify that a business process belongs to the specified project.
 * Prevents cross-project manipulation via crafted IDs.
 */
async function verifyBusinessProcessOwnership(
  businessProcessId: string,
  projectId: string
): Promise<void> {
  const process = await prisma.businessProcess.findFirst({
    where: { id: businessProcessId, projectId },
    select: { id: true },
  })
  if (!process) {
    throw new Error("Business process not found in this project")
  }
}
