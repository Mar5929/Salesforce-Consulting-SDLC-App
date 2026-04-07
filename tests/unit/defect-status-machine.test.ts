import { describe, it, expect } from "vitest"
// import { canTransitionDefect, getNextDefectStatuses, DEFECT_TRANSITIONS, DEFECT_STATUS_LABELS } from "@/lib/defect-status-machine"

describe("defect-status-machine", () => {
  describe("DEFECT_TRANSITIONS", () => {
    it.todo("allows OPEN -> ASSIGNED")
    it.todo("disallows OPEN -> FIXED")
    it.todo("allows FIXED -> VERIFIED")
    it.todo("disallows CLOSED -> any status")
  })

  describe("canTransitionDefect", () => {
    it.todo("returns true for valid transition with correct role")
    it.todo("returns false for invalid transition")
    it.todo("requires QA role for VERIFIED transition")
    it.todo("allows any role for non-VERIFIED transitions")
  })

  describe("getNextDefectStatuses", () => {
    it.todo("returns [ASSIGNED] for OPEN status")
    it.todo("returns [] for CLOSED status")
    it.todo("filters by role for VERIFIED-requiring transitions")
  })

  describe("DEFECT_STATUS_LABELS", () => {
    it.todo("maps ASSIGNED to 'In Progress'")
    it.todo("maps all statuses to display labels")
  })
})
