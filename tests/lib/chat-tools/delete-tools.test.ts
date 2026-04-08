import { describe, it, expect } from "vitest"
import { deleteTools } from "@/lib/chat-tools/delete/delete-tools"

const ALL_DELETE_KEYS = [
  "delete_story",
  "delete_epic",
  "delete_feature",
  "delete_question",
  "delete_decision",
  "delete_requirement",
  "delete_risk",
  "delete_sprint",
  "delete_defect",
  "delete_test_case",
]

describe("deleteTools", () => {
  it("returns all 10 delete tool keys", () => {
    const tools = deleteTools("proj-1", "mem-1", "PM")
    for (const key of ALL_DELETE_KEYS) {
      expect(tools).toHaveProperty(key)
    }
  })

  it("every delete tool has needsApproval: true", () => {
    const tools = deleteTools("proj-1", "mem-1", "PM")
    for (const key of ALL_DELETE_KEYS) {
      const t = tools[key as keyof typeof tools] as { needsApproval?: boolean }
      expect(t.needsApproval).toBe(true)
    }
  })

  it("each delete tool has a description string", () => {
    const tools = deleteTools("proj-1", "mem-1", "PM")
    for (const key of ALL_DELETE_KEYS) {
      const t = tools[key as keyof typeof tools] as { description: string }
      expect(typeof t.description).toBe("string")
      expect(t.description.length).toBeGreaterThan(0)
    }
  })

  it("deleteTools factory works for SA role too", () => {
    const tools = deleteTools("proj-1", "mem-1", "SOLUTION_ARCHITECT")
    expect(tools).toHaveProperty("delete_story")
    expect((tools.delete_story as { needsApproval?: boolean }).needsApproval).toBe(true)
  })
})
