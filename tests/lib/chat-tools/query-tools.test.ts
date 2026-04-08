import { describe, it, expect } from "vitest"
import { queryStoriesTools } from "@/lib/chat-tools/read/query-stories"
import { queryEpicsTools } from "@/lib/chat-tools/read/query-epics"
import { queryQuestionsTools } from "@/lib/chat-tools/read/query-questions"

describe("Query tool factories", () => {
  it("queryStoriesTools returns query_stories and get_story", () => {
    const tools = queryStoriesTools("proj-1")
    expect(tools).toHaveProperty("query_stories")
    expect(tools).toHaveProperty("get_story")
  })

  it("queryEpicsTools returns query_epics and get_epic", () => {
    const tools = queryEpicsTools("proj-1")
    expect(tools).toHaveProperty("query_epics")
    expect(tools).toHaveProperty("get_epic")
  })

  it("queryQuestionsTools returns query_questions and get_question", () => {
    const tools = queryQuestionsTools("proj-1")
    expect(tools).toHaveProperty("query_questions")
    expect(tools).toHaveProperty("get_question")
  })

  it("each tool has a description string", () => {
    const stories = queryStoriesTools("proj-1")
    expect(typeof (stories.query_stories as { description: string }).description).toBe("string")
    expect(typeof (stories.get_story as { description: string }).description).toBe("string")
  })

  it("each tool has an inputSchema", () => {
    const stories = queryStoriesTools("proj-1")
    expect((stories.query_stories as { inputSchema: unknown }).inputSchema).toBeDefined()
    expect((stories.get_story as { inputSchema: unknown }).inputSchema).toBeDefined()
  })
})
