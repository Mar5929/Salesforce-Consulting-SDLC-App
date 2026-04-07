import { describe, it, expect } from "vitest"
import {
  DEFECT_TRANSITIONS,
  DEFECT_STATUS_LABELS,
  canTransitionDefect,
  getNextDefectStatuses,
} from "@/lib/defect-status-machine"

describe("defect-status-machine", () => {
  describe("DEFECT_TRANSITIONS", () => {
    it("allows OPEN -> ASSIGNED", () => {
      expect(DEFECT_TRANSITIONS.OPEN).toEqual(["ASSIGNED"])
    })

    it("disallows OPEN -> FIXED", () => {
      expect(DEFECT_TRANSITIONS.OPEN).not.toContain("FIXED")
    })

    it("allows FIXED -> VERIFIED", () => {
      expect(DEFECT_TRANSITIONS.FIXED).toContain("VERIFIED")
    })

    it("disallows CLOSED -> any status", () => {
      expect(DEFECT_TRANSITIONS.CLOSED).toEqual([])
    })

    it("defines all expected transitions", () => {
      expect(DEFECT_TRANSITIONS.ASSIGNED).toEqual(["OPEN", "FIXED"])
      expect(DEFECT_TRANSITIONS.FIXED).toEqual(["VERIFIED", "ASSIGNED"])
      expect(DEFECT_TRANSITIONS.VERIFIED).toEqual(["CLOSED", "ASSIGNED"])
    })
  })

  describe("canTransitionDefect", () => {
    it("returns true for valid transition with correct role", () => {
      expect(canTransitionDefect("OPEN", "ASSIGNED", "DEVELOPER")).toBe(true)
      expect(canTransitionDefect("ASSIGNED", "FIXED", "PM")).toBe(true)
    })

    it("returns false for invalid transition", () => {
      expect(canTransitionDefect("OPEN", "FIXED", "DEVELOPER")).toBe(false)
      expect(canTransitionDefect("OPEN", "CLOSED", "PM")).toBe(false)
      expect(canTransitionDefect("CLOSED", "OPEN", "QA")).toBe(false)
    })

    it("requires QA role for VERIFIED transition", () => {
      expect(canTransitionDefect("FIXED", "VERIFIED", "QA")).toBe(true)
      expect(canTransitionDefect("FIXED", "VERIFIED", "DEVELOPER")).toBe(false)
      expect(canTransitionDefect("FIXED", "VERIFIED", "PM")).toBe(false)
    })

    it("allows any role for non-VERIFIED transitions", () => {
      expect(canTransitionDefect("OPEN", "ASSIGNED", "DEVELOPER")).toBe(true)
      expect(canTransitionDefect("OPEN", "ASSIGNED", "PM")).toBe(true)
      expect(canTransitionDefect("OPEN", "ASSIGNED", "QA")).toBe(true)
      expect(canTransitionDefect("OPEN", "ASSIGNED", "BA")).toBe(true)
      expect(canTransitionDefect("ASSIGNED", "FIXED", "DEVELOPER")).toBe(true)
    })
  })

  describe("getNextDefectStatuses", () => {
    it("returns [ASSIGNED] for OPEN status", () => {
      expect(getNextDefectStatuses("OPEN", "DEVELOPER")).toEqual(["ASSIGNED"])
    })

    it("returns [] for CLOSED status", () => {
      expect(getNextDefectStatuses("CLOSED", "PM")).toEqual([])
    })

    it("filters by role for VERIFIED-requiring transitions", () => {
      expect(getNextDefectStatuses("FIXED", "QA")).toEqual(["VERIFIED", "ASSIGNED"])
      expect(getNextDefectStatuses("FIXED", "DEVELOPER")).toEqual(["ASSIGNED"])
    })
  })

  describe("DEFECT_STATUS_LABELS", () => {
    it("maps ASSIGNED to 'In Progress'", () => {
      expect(DEFECT_STATUS_LABELS.ASSIGNED).toBe("In Progress")
    })

    it("maps all statuses to display labels", () => {
      expect(DEFECT_STATUS_LABELS.OPEN).toBe("Open")
      expect(DEFECT_STATUS_LABELS.FIXED).toBe("Fixed")
      expect(DEFECT_STATUS_LABELS.VERIFIED).toBe("Verified")
      expect(DEFECT_STATUS_LABELS.CLOSED).toBe("Closed")
    })
  })
})
