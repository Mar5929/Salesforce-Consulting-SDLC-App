import { describe, it, expect } from "vitest"

describe("defects actions", () => {
  describe("createDefect", () => {
    it.todo("generates DEF-N display ID")
    it.todo("sends DEFECT_CREATED Inngest event")
    it.todo("sends notification to assignee when provided")
  })

  describe("transitionDefectStatus", () => {
    it.todo("validates transition via canTransitionDefect")
    it.todo("rejects invalid transitions")
    it.todo("sends DEFECT_STATUS_CHANGED event")
  })

  describe("getDefects", () => {
    it.todo("filters by status when provided")
    it.todo("filters by severity when provided")
    it.todo("includes story and assignee relations")
  })
})
