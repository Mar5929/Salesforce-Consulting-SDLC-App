import { describe, it, expect } from "vitest"
import { ROLE_PERMISSIONS } from "@/lib/chat-tools"

describe("ROLE_PERMISSIONS", () => {
  it("has entries for all 5 roles", () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(5)
  })

  it("SOLUTION_ARCHITECT can delete", () => {
    expect(ROLE_PERMISSIONS.SOLUTION_ARCHITECT.delete).toBe(true)
  })

  it("PM can delete", () => {
    expect(ROLE_PERMISSIONS.PM.delete).toBe(true)
  })

  it("BA cannot delete", () => {
    expect(ROLE_PERMISSIONS.BA.delete).toBe(false)
  })

  it("DEVELOPER cannot delete", () => {
    expect(ROLE_PERMISSIONS.DEVELOPER.delete).toBe(false)
  })

  it("QA cannot delete", () => {
    expect(ROLE_PERMISSIONS.QA.delete).toBe(false)
  })

  it("all roles can read", () => {
    for (const role of Object.values(ROLE_PERMISSIONS)) {
      expect(role.read).toBe(true)
    }
  })
})
