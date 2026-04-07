/**
 * Dashboard Usage Queries
 *
 * Token usage and cost aggregation for dashboard display.
 * Aggregates SessionLog records for project-level AI usage metrics.
 */

import { scopedPrisma } from "@/lib/project-scope"
import { calculateCost } from "@/lib/config/ai-pricing"

export interface TokenUsageSummary {
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  sessionCount: number
  byTaskType: Array<{
    taskType: string
    inputTokens: number
    outputTokens: number
    cost: number
    count: number
  }>
}

/**
 * Aggregate token usage across all SessionLog records for a project.
 */
export async function getTokenUsageSummary(
  projectId: string
): Promise<TokenUsageSummary> {
  const db = scopedPrisma(projectId)

  const sessions = await db.sessionLog.findMany({
    where: {
      projectId,
      status: "COMPLETE",
    },
    select: {
      taskType: true,
      model: true,
      inputTokens: true,
      outputTokens: true,
    },
  })

  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalCost = 0

  // Group by task type
  const taskTypeMap = new Map<
    string,
    { inputTokens: number; outputTokens: number; cost: number; count: number }
  >()

  for (const session of sessions) {
    totalInputTokens += session.inputTokens
    totalOutputTokens += session.outputTokens

    const model = session.model ?? "claude-sonnet-4-20250514"
    let sessionCost = 0
    try {
      sessionCost = calculateCost(model, session.inputTokens, session.outputTokens)
    } catch {
      // Unknown model — skip cost calculation
    }
    totalCost += sessionCost

    const existing = taskTypeMap.get(session.taskType)
    if (existing) {
      existing.inputTokens += session.inputTokens
      existing.outputTokens += session.outputTokens
      existing.cost += sessionCost
      existing.count += 1
    } else {
      taskTypeMap.set(session.taskType, {
        inputTokens: session.inputTokens,
        outputTokens: session.outputTokens,
        cost: sessionCost,
        count: 1,
      })
    }
  }

  const byTaskType = Array.from(taskTypeMap.entries()).map(
    ([taskType, data]) => ({
      taskType,
      ...data,
    })
  )

  return {
    totalInputTokens,
    totalOutputTokens,
    totalCost,
    sessionCount: sessions.length,
    byTaskType,
  }
}
