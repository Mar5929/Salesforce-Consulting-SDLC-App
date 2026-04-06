/**
 * GET /api/v1/context-package
 *
 * Assembles a context package for a story, providing Claude Code with
 * the business intelligence needed for development work.
 *
 * Returns: story details, business processes, knowledge articles,
 * decisions, and sprint conflicts.
 *
 * Rate limit: 30 requests per minute.
 * Auth: API key via x-api-key header (T-04-14).
 * Scope: All queries scoped to API key's project (T-04-16).
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withApiAuth } from "@/app/api/v1/_lib/api-handler"
import { loadOrgComponentContext } from "@/lib/agent-harness/context/org-components"
import { loadBusinessProcessContext } from "@/lib/agent-harness/context/business-processes"

export async function GET(request: Request) {
  return withApiAuth(
    request,
    async (projectId) => {
      const { searchParams } = new URL(request.url)
      const storyId = searchParams.get("storyId")

      if (!storyId) {
        return NextResponse.json(
          { error: "storyId query parameter is required" },
          { status: 400 }
        )
      }

      // Load story with project scope enforcement (T-04-16)
      const story = await prisma.story.findFirst({
        where: { id: storyId, projectId },
        include: {
          storyComponents: {
            select: {
              id: true,
              orgComponentId: true,
              componentName: true,
              impactType: true,
            },
          },
        },
      })

      if (!story) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404 }
        )
      }

      // Extract component IDs for context loading
      const componentIds = story.storyComponents
        .map((sc) => sc.orgComponentId)
        .filter((id): id is string => id !== null)

      // Assemble context in parallel
      const [orgComponents, businessProcesses, knowledgeArticles, decisions, sprintConflicts] =
        await Promise.all([
          // Org component context (relationships, parent objects)
          loadOrgComponentContext(projectId, storyId),

          // Business processes related to story's components
          loadBusinessProcessContext(projectId, componentIds),

          // Top knowledge articles by usage (summaries first per KNOW-05)
          prisma.knowledgeArticle.findMany({
            where: { projectId },
            orderBy: { useCount: "desc" },
            take: 10,
            select: {
              id: true,
              title: true,
              summary: true,
              articleType: true,
              confidence: true,
            },
          }),

          // Decisions scoped to the story's epic/feature
          prisma.decision.findMany({
            where: {
              projectId,
              decisionScopes: {
                some: {
                  OR: [
                    { epicId: story.epicId },
                    ...(story.featureId
                      ? [{ featureId: story.featureId }]
                      : []),
                  ],
                },
              },
            },
            select: {
              id: true,
              title: true,
              rationale: true,
              confidence: true,
              decisionDate: true,
            },
            orderBy: { decisionDate: "desc" },
            take: 20,
          }),

          // Sprint conflicts: other stories in same sprint sharing components
          story.sprintId
            ? prisma.story.findMany({
                where: {
                  projectId,
                  sprintId: story.sprintId,
                  id: { not: story.id },
                  storyComponents: {
                    some: {
                      orgComponentId: {
                        in: componentIds.length > 0 ? componentIds : ["__none__"],
                      },
                    },
                  },
                },
                select: {
                  id: true,
                  displayId: true,
                  title: true,
                  status: true,
                  storyComponents: {
                    where: {
                      orgComponentId: {
                        in: componentIds.length > 0 ? componentIds : ["__none__"],
                      },
                    },
                    select: {
                      componentName: true,
                      impactType: true,
                    },
                  },
                },
              })
            : [],
        ])

      return NextResponse.json({
        story: {
          id: story.id,
          displayId: story.displayId,
          title: story.title,
          description: story.description,
          acceptanceCriteria: story.acceptanceCriteria,
          status: story.status,
          priority: story.priority,
          storyPoints: story.storyPoints,
          epicId: story.epicId,
          featureId: story.featureId,
          storyComponents: story.storyComponents,
        },
        orgComponents,
        businessProcesses,
        knowledgeArticles,
        decisions,
        sprintConflicts,
      })
    },
    30 // Rate limit: 30 per minute
  )
}
