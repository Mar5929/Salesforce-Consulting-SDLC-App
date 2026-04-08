import { describe, it, expect } from "vitest"
import { buildToolsForRole } from "@/lib/chat-tools"

describe("buildToolsForRole", () => {
  it("returns an object (not null or undefined)", () => {
    const tools = buildToolsForRole("SOLUTION_ARCHITECT", "proj-1", "mem-1")
    expect(tools).toBeDefined()
    expect(typeof tools).toBe("object")
    expect(tools).not.toBeNull()
  })

  it("returns an object for every valid role", () => {
    const roles = ["SOLUTION_ARCHITECT", "PM", "BA", "DEVELOPER", "QA"] as const
    for (const role of roles) {
      const tools = buildToolsForRole(role, "proj-1", "mem-1")
      expect(tools).toBeDefined()
    }
  })
})
