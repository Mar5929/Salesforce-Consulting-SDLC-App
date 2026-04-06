"use client"

/**
 * Sprint Intelligence Panel
 *
 * Client wrapper that manages dismissed conflict state and renders
 * the ConflictBanner and/or DependencyList based on the variant.
 *
 * - variant="board": Shows ConflictBanner only (above sprint board)
 * - variant="plan": Shows DependencyList only (below sprint planning)
 *
 * Per D-17: Dismiss is client-side only (not persisted) for V1.
 */

import { useState, useCallback } from "react"
import { ConflictBanner } from "@/components/sprints/conflict-banner"
import { DependencyList } from "@/components/sprints/dependency-list"

interface Conflict {
  id: string
  storyA: { displayId: string; title: string }
  storyB: { displayId: string; title: string }
  componentName: string
  impactA: string
  impactB: string
  severity: string
  reasoning: string
  dismissed: boolean
}

interface DependencySuggestion {
  order: number
  storyDisplayId: string
  storyTitle: string
  reasoning: string
}

interface SprintIntelligencePanelProps {
  conflicts: Conflict[]
  dependencies: DependencySuggestion[]
  variant: "board" | "plan"
}

export function SprintIntelligencePanel({
  conflicts,
  dependencies,
  variant,
}: SprintIntelligencePanelProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const handleDismiss = useCallback((conflictId: string) => {
    setDismissedIds((prev) => new Set([...prev, conflictId]))
  }, [])

  // Apply client-side dismiss filter
  const filteredConflicts = conflicts.map((c) => ({
    ...c,
    dismissed: c.dismissed || dismissedIds.has(c.id),
  }))

  if (variant === "board") {
    return (
      <ConflictBanner conflicts={filteredConflicts} onDismiss={handleDismiss} />
    )
  }

  return <DependencyList dependencies={dependencies} />
}
