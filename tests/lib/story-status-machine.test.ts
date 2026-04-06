/**
 * Story Status Machine Tests (WORK-04, WORK-05)
 *
 * Tests the status transition rules for stories.
 * PM manages lifecycle states (Draft -> Ready -> Sprint Planned).
 * Developers manage execution states (In Progress -> In Review -> QA -> Done).
 * Auto-transition on sprint assignment is tested in sprints.test.ts.
 *
 * Source module: src/lib/story-status-machine.ts (created in Plan 01)
 */
import { describe, it, expect } from "vitest"
import {
  canTransition,
  getAvailableTransitions,
  getRoleGroup,
} from "@/lib/story-status-machine"

describe("canTransition", () => {
  // PM lifecycle transitions
  it("should allow PM to transition DRAFT -> READY", () => {
    expect(canTransition("DRAFT", "READY", "PM")).toBe(true)
  })

  it("should NOT allow DEVELOPER to transition DRAFT -> READY (PM-only)", () => {
    expect(canTransition("DRAFT", "READY", "DEVELOPER")).toBe(false)
  })

  // Developer execution transitions
  it("should allow DEVELOPER to transition SPRINT_PLANNED -> IN_PROGRESS", () => {
    expect(canTransition("SPRINT_PLANNED", "IN_PROGRESS", "DEVELOPER")).toBe(true)
  })

  it("should NOT allow PM to transition SPRINT_PLANNED -> IN_PROGRESS (DEV-only)", () => {
    expect(canTransition("SPRINT_PLANNED", "IN_PROGRESS", "PM")).toBe(false)
  })

  // Terminal state
  it("should NOT allow any transition from DONE", () => {
    expect(canTransition("DONE", "DRAFT", "PM")).toBe(false)
  })

  // Invalid jump
  it("should NOT allow invalid jump DRAFT -> IN_PROGRESS", () => {
    expect(canTransition("DRAFT", "IN_PROGRESS", "PM")).toBe(false)
  })

  // Send-back transitions
  it("should allow DEVELOPER to transition IN_REVIEW -> IN_PROGRESS (send back)", () => {
    expect(canTransition("IN_REVIEW", "IN_PROGRESS", "DEVELOPER")).toBe(true)
  })

  // QA to Done
  it("should allow DEVELOPER to transition QA -> DONE", () => {
    expect(canTransition("QA", "DONE", "DEVELOPER")).toBe(true)
  })

  // BA has no transition permissions (NONE role group)
  it("should NOT allow BA to transition QA -> DONE", () => {
    expect(canTransition("QA", "DONE", "BA")).toBe(false)
  })
})

describe("getAvailableTransitions", () => {
  it("should return [READY] for DRAFT with PM role", () => {
    expect(getAvailableTransitions("DRAFT", "PM")).toEqual(["READY"])
  })

  it("should return [] for DRAFT with DEVELOPER role (no dev transitions from DRAFT)", () => {
    expect(getAvailableTransitions("DRAFT", "DEVELOPER")).toEqual([])
  })

  it("should return [IN_REVIEW] for IN_PROGRESS with DEVELOPER role", () => {
    expect(getAvailableTransitions("IN_PROGRESS", "DEVELOPER")).toEqual(["IN_REVIEW"])
  })
})

describe("getRoleGroup", () => {
  it("should return PM for PM role", () => {
    expect(getRoleGroup("PM")).toBe("PM")
  })

  it("should return PM for SOLUTION_ARCHITECT role", () => {
    expect(getRoleGroup("SOLUTION_ARCHITECT")).toBe("PM")
  })

  it("should return DEV for DEVELOPER role", () => {
    expect(getRoleGroup("DEVELOPER")).toBe("DEV")
  })

  it("should return NONE for BA role", () => {
    expect(getRoleGroup("BA")).toBe("NONE")
  })
})
