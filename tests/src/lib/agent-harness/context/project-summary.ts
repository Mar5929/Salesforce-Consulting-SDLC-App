/**
 * Project Summary Context Loader (D-33)
 *
 * Fetches project metadata and formats it as a structured text summary
 * for AI prompt injection. Uses prisma directly (not scopedPrisma) since
 * we query by project ID explicitly.
 */

import { prisma } from "@/lib/db"

/**
 * Load a structured text summary of a project.
 * Includes name, client, engagement type, phase, team count, and date range.
 */
export async function getProjectSummary(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      clientName: true,
      engagementType: true,
      currentPhase: true,
      startDate: true,
      targetEndDate: true,
      status: true,
      _count: {
        select: { members: true },
      },
    },
  })

  if (!project) {
    return `Project ${projectId} not found.`
  }

  const startDate = project.startDate.toISOString().split("T")[0]
  const endDate = project.targetEndDate
    ? project.targetEndDate.toISOString().split("T")[0]
    : "TBD"

  return [
    `Project: ${project.name}`,
    `Client: ${project.clientName}`,
    `Engagement Type: ${project.engagementType}`,
    `Current Phase: ${project.currentPhase}`,
    `Status: ${project.status}`,
    `Team Size: ${project._count.members} members`,
    `Timeline: ${startDate} to ${endDate}`,
  ].join("\n")
}
