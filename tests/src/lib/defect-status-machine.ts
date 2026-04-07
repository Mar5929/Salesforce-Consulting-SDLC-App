/**
 * Defect Status Machine
 *
 * Validates defect status transitions with role-based gating.
 * Any role can transition most statuses.
 * QA role required for FIXED -> VERIFIED transition.
 * CLOSED is a terminal state with no outgoing transitions.
 *
 * Per DOC-03/QA-03 from planning context.
 */

import type { DefectStatus, ProjectRole } from "@/generated/prisma"

export const DEFECT_TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  OPEN: ["ASSIGNED"],
  ASSIGNED: ["OPEN", "FIXED"],
  FIXED: ["VERIFIED", "ASSIGNED"],
  VERIFIED: ["CLOSED", "ASSIGNED"],
  CLOSED: [],
}

export const DEFECT_STATUS_LABELS: Record<DefectStatus, string> = {
  OPEN: "Open",
  ASSIGNED: "In Progress",
  FIXED: "Fixed",
  VERIFIED: "Verified",
  CLOSED: "Closed",
}

// QA role required for VERIFIED transition
const VERIFIED_ROLES: ProjectRole[] = ["QA"]

export function canTransitionDefect(
  from: DefectStatus,
  to: DefectStatus,
  role: ProjectRole
): boolean {
  const allowed = DEFECT_TRANSITIONS[from]
  if (!allowed?.includes(to)) return false

  // Only QA can move to VERIFIED
  if (to === "VERIFIED" && !VERIFIED_ROLES.includes(role)) return false

  return true
}

export function getNextDefectStatuses(
  current: DefectStatus,
  role: ProjectRole
): DefectStatus[] {
  return (DEFECT_TRANSITIONS[current] || []).filter((to) =>
    canTransitionDefect(current, to, role)
  )
}
