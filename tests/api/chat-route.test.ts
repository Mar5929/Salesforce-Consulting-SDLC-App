import { describe, it, expect } from "vitest"

describe("Chat route structure", () => {
  it("POST handler is exported from route module", async () => {
    const mod = await import("@/app/api/chat/route")
    expect(typeof mod.POST).toBe("function")
  })

  it("buildToolsForRole is importable from chat-tools", async () => {
    const mod = await import("@/lib/chat-tools")
    expect(typeof mod.buildToolsForRole).toBe("function")
  })

  it("buildAgenticSystemPrompt is importable from chat-tools", async () => {
    const mod = await import("@/lib/chat-tools")
    expect(typeof mod.buildAgenticSystemPrompt).toBe("function")
  })
})
