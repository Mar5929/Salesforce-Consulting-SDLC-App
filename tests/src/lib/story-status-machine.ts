/**
 * Story Status Machine
 *
 * Validates story status transitions with role-based gating.
 * PM roles manage lifecycle: DRAFT -> READY -> SPRINT_PLANNED
 * Dev roles manage execution: SPRINT_PLANNED -> IN_PROGRESS -> IN_REVIEW -> QA -> DONE
 * BA and QA roles cannot transition stories.
 *
 * Per D-03/WORK-04/WORK-05 from planning context.
 */

import type { StoryStatus, ProjectRole } from "@/generated/prisma"

export const TRANSITIONS: Record<StoryStatus, StoryStatus[]> = {
  DRAFT: ["READY"],
  READY: ["SPRINT_PLANNED", "DRAFT"],
  SPRINT_PLANNED: ["IN_PROGRESS", "READY"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: ["QA", "IN_PROGRESS"],
  QA: ["DONE", "IN_PROGRESS"],
  DONE: [],
}

// PM roles manage lifecycle: DRAFT->READY, auto READY->SPRINT_PLANNED
// Dev roles manage execution: SPRINT_PLANNED->IN_PROGRESS->IN_REVIEW->QA->DONE
const PM_ROLES: ProjectRole[] = ["PM", "SOLUTION_ARCHITECT"]
const DEV_ROLES: ProjectRole[] = ["DEVELOPER"]
// BA and QA can view but not transition

type RoleGroup = "PM" | "DEV" | "NONE"

export function getRoleGroup(role: ProjectRole): RoleGroup {
  if (PM_ROLES.includes(role)) return "PM"
  if (DEV_ROLES.includes(role)) return "DEV"
  return "NONE"
}

// PM-only transitions
const PM_TRANSITIONS: Array<[StoryStatus, StoryStatus]> = [
  ["DRAFT", "READY"],
  ["READY", "DRAFT"],
  ["READY", "SPRINT_PLANNED"],
  ["SPRINT_PLANNED", "READY"],
]

// DEV-only transitions
const DEV_TRANSITIONS: Array<[StoryStatus, StoryStatus]> = [
  ["SPRINT_PLANNED", "IN_PROGRESS"],
  ["IN_PROGRESS", "IN_REVIEW"],
  ["IN_REVIEW", "QA"],
  ["IN_REVIEW", "IN_PROGRESS"],
  ["QA", "DONE"],
  ["QA", "IN_PROGRESS"],
]

export function canTransition(from: StoryStatus, to: StoryStatus, role: ProjectRole): boolean {
  // Check if transition is valid at all
  if (!TRANSITIONS[from]?.includes(to)) return false
  const group = getRoleGroup(role)
  if (group === "NONE") return false
  // Check role-specific permissions
  if (group === "PM") return PM_TRANSITIONS.some(([f, t]) => f === from && t === to)
  if (group === "DEV") return DEV_TRANSITIONS.some(([f, t]) => f === from && t === to)
  return false
}

export function getAvailableTransitions(from: StoryStatus, role: ProjectRole): StoryStatus[] {
  return (TRANSITIONS[from] || []).filter(to => canTransition(from, to, role))
}
