/**
 * GET /api/v1/project/summary
 *
 * Returns a project summary for Claude Code sessions.
 * Includes counts of team members, stories, epics, open questions,
 * and org components.
 *
 * Rate limit: 60 requests per minute.
 * Auth: API key via x-api-key header (T-04-14).
 * Scope: All queries scoped to API key's project (T-04-16).
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withApiAuth } from "@/app/api/v1/_lib/api-handler"

export async function GET(request: Request) {
  return withApiAuth(
    request,
    async (projectId) => {
      // Load project with aggregate counts in parallel
      const [project, memberCount, epicCount, storyCount, openQuestionCount, orgComponentCount] =
        await Promise.all([
          prisma.project.findUnique({
            where: { id: projectId },
            select: {
              id: true,
              name: true,
              clientName: true,
              engagementType: true,
              currentPhase: true,
              status: true,
              startDate: true,
              targetEndDate: true,
            },
          }),
          prisma.projectMember.count({
            where: { projectId, status: "ACTIVE" },
          }),
          prisma.epic.count({ where: { projectId } }),
          prisma.story.count({ where: { projectId } }),
          prisma.question.count({
            where: { projectId, status: "OPEN" },
          }),
          prisma.orgComponent.count({
            where: { projectId, isActive: true },
          }),
        ])

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: project.id,
        name: project.name,
        client: project.clientName,
        engagementType: project.engagementType,
        currentPhase: project.currentPhase,
        status: project.status,
        startDate: project.startDate,
        targetEndDate: project.targetEndDate,
        memberCount,
        epicCount,
        storyCount,
        openQuestionCount,
        orgComponentCount,
      })
    },
    60 // Rate limit: 60 per minute
  )
}
