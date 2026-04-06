/**
 * Epics and Features Context Loader
 *
 * Provides a lightweight list of epics and features for the project.
 * Used by transcript processing so the AI can assign scope
 * (scopeEpicId, scopeFeatureId) to extracted items (TRNS-04).
 *
 * Uses scopedPrisma for project isolation (T-02-06).
 */

import { scopedPrisma } from "@/lib/project-scope"

export interface EpicOrFeature {
  id: string
  displayId: string
  title: string
  type: "Epic" | "Feature"
}

/**
 * Fetch all epics and features for a project.
 * Lightweight query — just id, displayId (prefix), and title (name) fields.
 */
export async function getEpicsAndFeatures(
  projectId: string
): Promise<EpicOrFeature[]> {
  const scoped = scopedPrisma(projectId)

  const [epics, features] = await Promise.all([
    scoped.epic.findMany({
      select: { id: true, prefix: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    scoped.feature.findMany({
      select: { id: true, prefix: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ])

  const results: EpicOrFeature[] = []

  for (const epic of epics) {
    results.push({
      id: epic.id,
      displayId: epic.prefix,
      title: epic.name,
      type: "Epic",
    })
  }

  for (const feature of features) {
    results.push({
      id: feature.id,
      displayId: feature.prefix,
      title: feature.name,
      type: "Feature",
    })
  }

  return results
}
