/**
 * PM Dashboard Synthesis Inngest Function
 *
 * Aggregates project-wide metrics for the PM Dashboard:
 * - Stories by status and by assignee (D-14)
 * - Questions by status (D-14)
 * - Knowledge coverage (D-14)
 * - Sprint velocity
 * - AI usage costs (D-12)
 * - QA summary (D-10)
 * - Team activity
 * - Health score
 *
 * Pre-computes data and stores in Project.cachedBriefingContent.pmDashboard
 * for fast page loads via SWR polling.
 *
 * Threat mitigations: T-05-15 (retries: 1, event-triggered not user-polled)
 */

import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { prisma } from "@/lib/db"
import { computeHealthScore } from "@/lib/dashboard/queries"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface PmDashboardData {
  generatedAt: string
  health: { score: number; label: string }
  storiesByStatus: Record<string, number>
  storiesByAssignee: Array<{
    assigneeId: string
    assigneeName: string
    count: number
  }>
  storiesTotal: number
  storiesCompleted: number
  questionsByStatus: Record<string, number>
  knowledgeCoverage: {
    totalArticles: number
    staleCount: number
    coveragePercent: number
  }
  sprintVelocity: Array<{ sprintName: string; pointsCompleted: number }>
  aiUsage: {
    totalCost: number
    costOverTime: Array<{ date: string; cost: number }>
    costByArea: Record<string, number>
  }
  qa: {
    passCount: number
    failCount: number
    blockedCount: number
    defectsBySeverity: Record<string, number>
    openDefectCount: number
  }
  teamActivity: Array<{
    memberId: string
    memberName: string
    action: string
    timestamp: string
  }>
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

const TASK_TYPE_LABELS: Record<string, string> = {
  TRANSCRIPT_PROCESSING: "Transcripts",
  QUESTION_ANSWERING: "Questions",
  STORY_GENERATION: "Story Gen",
  STORY_ENRICHMENT: "Story Gen",
  BRIEFING_GENERATION: "Knowledge",
  STATUS_REPORT_GENERATION: "Knowledge",
  DOCUMENT_GENERATION: "Doc Gen",
  SPRINT_ANALYSIS: "Sprint Intel",
  CONTEXT_PACKAGE_ASSEMBLY: "Context",
  ORG_QUERY: "Org Analysis",
  DASHBOARD_SYNTHESIS: "Dashboard",
}

/** Estimate cost from token counts (Claude Sonnet pricing approximation) */
function estimateCost(inputTokens: number, outputTokens: number): number {
  // Approximate pricing: $3/1M input, $15/1M output (Sonnet)
  return (inputTokens * 3) / 1_000_000 + (outputTokens * 15) / 1_000_000
}

// ────────────────────────────────────────────
// Inngest Function
// ────────────────────────────────────────────

export const synthesizePmDashboard = inngest.createFunction(
  {
    id: "pm-dashboard-synthesis",
    retries: 1,
    concurrency: [
      {
        limit: 1,
        scope: "fn",
        key: "event.data.projectId",
      },
    ],
  },
  { event: EVENTS.PM_DASHBOARD_SYNTHESIS_REQUESTED },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string }

    // Step 1: Aggregate stories by status
    const storiesByStatus = await step.run(
      "aggregate-stories-by-status",
      async () => {
        const groups = await prisma.story.groupBy({
          by: ["status"],
          _count: true,
          where: { projectId },
        })
        const result: Record<string, number> = {}
        for (const g of groups) {
          result[g.status] = g._count
        }
        return result
      }
    )

    // Step 2: Aggregate stories by assignee (D-14)
    const storiesByAssignee = await step.run(
      "aggregate-stories-by-assignee",
      async () => {
        const groups = await prisma.story.groupBy({
          by: ["assigneeId"],
          _count: true,
          where: { projectId, assigneeId: { not: null } },
        })

        const assigneeIds = groups.map((g) => g.assigneeId).filter(Boolean) as string[]
        const members = assigneeIds.length > 0
          ? await prisma.projectMember.findMany({
              where: { id: { in: assigneeIds } },
              select: { id: true, displayName: true },
            })
          : []

        const memberMap = new Map(members.map((m) => [m.id, m.displayName]))

        return groups.map((g) => ({
          assigneeId: g.assigneeId ?? "unassigned",
          assigneeName: memberMap.get(g.assigneeId ?? "") ?? "Unknown",
          count: g._count,
        }))
      }
    )

    // Step 3: Aggregate questions by status (D-14)
    const questionsByStatus = await step.run(
      "aggregate-questions-by-status",
      async () => {
        const groups = await prisma.question.groupBy({
          by: ["status"],
          _count: true,
          where: { projectId },
        })
        const result: Record<string, number> = {}
        for (const g of groups) {
          result[g.status] = g._count
        }
        return result
      }
    )

    // Step 4: Compute knowledge coverage (D-14)
    const knowledgeCoverage = await step.run(
      "compute-knowledge-coverage",
      async () => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

        const [totalArticles, staleCount] = await Promise.all([
          prisma.knowledgeArticle.count({ where: { projectId } }),
          prisma.knowledgeArticle.count({
            where: {
              projectId,
              OR: [
                { isStale: true },
                {
                  lastRefreshedAt: { lt: sevenDaysAgo },
                },
              ],
            },
          }),
        ])

        const coveragePercent =
          totalArticles > 0
            ? Math.round(((totalArticles - staleCount) / totalArticles) * 100)
            : 0

        return { totalArticles, staleCount, coveragePercent }
      }
    )

    // Step 5: Aggregate sprint velocity
    const sprintVelocity = await step.run(
      "aggregate-sprint-velocity",
      async () => {
        const sprints = await prisma.sprint.findMany({
          where: { projectId },
          select: {
            name: true,
            stories: {
              where: { status: "DONE" },
              select: { storyPoints: true },
            },
          },
          orderBy: { startDate: "asc" },
        })

        return sprints.map((s) => ({
          sprintName: s.name,
          pointsCompleted: s.stories.reduce(
            (sum, st) => sum + (st.storyPoints ?? 0),
            0
          ),
        }))
      }
    )

    // Step 6: Aggregate AI costs (D-12)
    const aiUsage = await step.run("aggregate-ai-costs", async () => {
      const sessions = await prisma.sessionLog.findMany({
        where: { projectId },
        select: {
          inputTokens: true,
          outputTokens: true,
          taskType: true,
          startedAt: true,
        },
      })

      let totalCost = 0
      const dailyCosts: Record<string, number> = {}
      const areaCosts: Record<string, number> = {}

      for (const s of sessions) {
        const cost = estimateCost(s.inputTokens, s.outputTokens)
        totalCost += cost

        // Group by date
        const dateKey = s.startedAt.toISOString().split("T")[0]
        dailyCosts[dateKey] = (dailyCosts[dateKey] ?? 0) + cost

        // Group by area
        const areaLabel = TASK_TYPE_LABELS[s.taskType] ?? s.taskType
        areaCosts[areaLabel] = (areaCosts[areaLabel] ?? 0) + cost
      }

      const costOverTime = Object.entries(dailyCosts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, cost]) => ({
          date,
          cost: Math.round(cost * 100) / 100,
        }))

      // Round area costs
      const roundedAreaCosts: Record<string, number> = {}
      for (const [k, v] of Object.entries(areaCosts)) {
        roundedAreaCosts[k] = Math.round(v * 100) / 100
      }

      return {
        totalCost: Math.round(totalCost * 100) / 100,
        costOverTime,
        costByArea: roundedAreaCosts,
      }
    })

    // Step 7: Aggregate QA data (D-10)
    const qa = await step.run("aggregate-qa-data", async () => {
      // Get test case IDs for this project's stories
      const testCases = await prisma.testCase.findMany({
        where: { story: { projectId } },
        select: { id: true },
      })
      const testCaseIds = testCases.map((tc) => tc.id)

      const [testResults, defectResults, openDefectCount] = await Promise.all([
        testCaseIds.length > 0
          ? prisma.testExecution.groupBy({
              by: ["result"],
              _count: true,
              where: { testCaseId: { in: testCaseIds } },
            })
          : Promise.resolve([]),
        prisma.defect.groupBy({
          by: ["severity"],
          _count: true,
          where: { projectId },
        }),
        prisma.defect.count({
          where: {
            projectId,
            status: { in: ["OPEN", "ASSIGNED"] },
          },
        }),
      ])

      const testMap: Record<string, number> = {}
      for (const t of testResults) {
        testMap[t.result] = t._count
      }

      const defectMap: Record<string, number> = {}
      for (const d of defectResults) {
        defectMap[d.severity] = d._count
      }

      return {
        passCount: testMap["PASS"] ?? 0,
        failCount: testMap["FAIL"] ?? 0,
        blockedCount: testMap["BLOCKED"] ?? 0,
        defectsBySeverity: defectMap,
        openDefectCount,
      }
    })

    // Step 8: Fetch recent team activity
    const teamActivity = await step.run(
      "fetch-team-activity",
      async () => {
        // Fetch recent stories updated
        const recentStories = await prisma.story.findMany({
          where: { projectId },
          orderBy: { updatedAt: "desc" },
          take: 10,
          select: {
            assigneeId: true,
            assignee: { select: { displayName: true } },
            title: true,
            status: true,
            updatedAt: true,
          },
        })

        // Fetch recent defects
        const recentDefects = await prisma.defect.findMany({
          where: { projectId },
          orderBy: { updatedAt: "desc" },
          take: 10,
          select: {
            createdById: true,
            createdBy: { select: { displayName: true } },
            title: true,
            status: true,
            updatedAt: true,
          },
        })

        const activities: Array<{
          memberId: string
          memberName: string
          action: string
          timestamp: string
        }> = []

        for (const s of recentStories) {
          activities.push({
            memberId: s.assigneeId ?? "system",
            memberName: s.assignee?.displayName ?? "Unassigned",
            action: `Story "${s.title}" moved to ${s.status}`,
            timestamp: s.updatedAt.toISOString(),
          })
        }

        for (const d of recentDefects) {
          activities.push({
            memberId: d.createdById,
            memberName: d.createdBy.displayName,
            action: `Defect "${d.title}" - ${d.status}`,
            timestamp: d.updatedAt.toISOString(),
          })
        }

        // Sort by timestamp descending, take top 20
        activities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        return activities.slice(0, 20)
      }
    )

    // Step 9: Compute health score
    const healthScore = await step.run("compute-health-score", async () => {
      return computeHealthScore(projectId)
    })

    // Step 10: Store computed data
    const statusCounts = storiesByStatus as Record<string, number>
    const storiesTotal = Object.values(statusCounts).reduce(
      (a: number, b: number) => a + b,
      0
    )
    const storiesCompleted = (statusCounts["DONE"] ?? 0) as number

    const hs = healthScore as { score: number; descriptor: string }
    const dashboardData: PmDashboardData = {
      generatedAt: new Date().toISOString(),
      health: {
        score: hs.score,
        label: hs.descriptor,
      },
      storiesByStatus: statusCounts,
      storiesByAssignee: storiesByAssignee as PmDashboardData["storiesByAssignee"],
      storiesTotal,
      storiesCompleted,
      questionsByStatus: questionsByStatus as Record<string, number>,
      knowledgeCoverage: knowledgeCoverage as PmDashboardData["knowledgeCoverage"],
      sprintVelocity: sprintVelocity as PmDashboardData["sprintVelocity"],
      aiUsage: aiUsage as PmDashboardData["aiUsage"],
      qa: qa as PmDashboardData["qa"],
      teamActivity: teamActivity as PmDashboardData["teamActivity"],
    }

    await step.run("cache-pm-dashboard", async () => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { cachedBriefingContent: true },
      })

      const existingContent =
        (project?.cachedBriefingContent as Record<string, unknown>) ?? {}

      await prisma.project.update({
        where: { id: projectId },
        data: {
          cachedBriefingContent: JSON.parse(
            JSON.stringify({
              ...existingContent,
              pmDashboard: dashboardData,
            })
          ),
          cachedBriefingGeneratedAt: new Date(),
        },
      })
    })

    return {
      projectId,
      generatedAt: dashboardData.generatedAt,
      healthScore: hs.score,
    }
  }
)
