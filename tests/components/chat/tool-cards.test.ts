import { describe, it, expect } from "vitest"
import { getToolDisplayName } from "@/components/chat/tool-part-renderer"

describe("getToolDisplayName", () => {
  it("maps query_stories to Searching stories", () => {
    expect(getToolDisplayName("query_stories")).toBe("Searching stories")
  })

  it("maps get_story to Loading story details", () => {
    expect(getToolDisplayName("get_story")).toBe("Loading story details")
  })

  it("maps create_epic to Creating epic", () => {
    expect(getToolDisplayName("create_epic")).toBe("Creating epic")
  })

  it("maps update_question to Updating question", () => {
    expect(getToolDisplayName("update_question")).toBe("Updating question")
  })

  it("maps delete_sprint to Preparing to delete sprint", () => {
    expect(getToolDisplayName("delete_sprint")).toBe("Preparing to delete sprint")
  })

  it("maps create_stories to Creating multiple stories", () => {
    expect(getToolDisplayName("create_stories")).toBe("Creating multiple stories")
  })
})
