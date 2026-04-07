/**
 * Decisions Context Loader
 *
 * Fetches recent decisions for AI context, with truncated rationale
 * to keep within token budgets. Uses scopedPrisma for project isolation (T-02-06).
 */

import { scopedPrisma } from "@/lib/project-scope"

/** Truncate text to a maximum length, appending "..." if truncated */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export interface DecisionSummary {
  id: string
  displayId: string
  title: string
  rationale: string
  decisionDate: Date
}

/**
 * Fetch recent decisions for a project, ordered by recency.
 * Rationale is truncated to ~300 chars for summary context.
 */
export async function getRecentDecisions(
  projectId: string,
  limit: number = 15
): Promise<DecisionSummary[]> {
  const scoped = scopedPrisma(projectId)

  const decisions = await scoped.decision.findMany({
    select: {
      id: true,
      displayId: true,
      title: true,
      rationale: true,
      decisionDate: true,
    },
    orderBy: { decisionDate: "desc" },
    take: limit,
  })

  return decisions.map((d: Record<string, unknown>) => ({
    id: d.id as string,
    displayId: d.displayId as string,
    title: d.title as string,
    rationale: truncateText(d.rationale as string, 300),
    decisionDate: d.decisionDate as Date,
  }))
}
