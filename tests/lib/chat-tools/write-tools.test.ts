import { describe, it, expect } from "vitest"
import { mutateStoriesTools } from "@/lib/chat-tools/write/mutate-stories"
import { mutateQuestionsTools } from "@/lib/chat-tools/write/mutate-questions"
import { batchStoriesTools } from "@/lib/chat-tools/batch/batch-stories"
import { batchQuestionsTools } from "@/lib/chat-tools/batch/batch-questions"

describe("Write tool factories", () => {
  it("mutateStoriesTools returns create_story and update_story", () => {
    const tools = mutateStoriesTools("proj-1", "mem-1", "PM")
    expect(tools).toHaveProperty("create_story")
    expect(tools).toHaveProperty("update_story")
  })

  it("mutateQuestionsTools returns create_question and update_question", () => {
    const tools = mutateQuestionsTools("proj-1", "mem-1")
    expect(tools).toHaveProperty("create_question")
    expect(tools).toHaveProperty("update_question")
  })

  it("batchStoriesTools returns create_stories", () => {
    const tools = batchStoriesTools("proj-1", "mem-1", "PM")
    expect(tools).toHaveProperty("create_stories")
  })

  it("batchQuestionsTools returns create_questions", () => {
    const tools = batchQuestionsTools("proj-1", "mem-1")
    expect(tools).toHaveProperty("create_questions")
  })

  it("create_story has a description string", () => {
    const tools = mutateStoriesTools("proj-1", "mem-1", "PM")
    expect(typeof (tools.create_story as { description: string }).description).toBe("string")
  })

  it("create_story has an inputSchema", () => {
    const tools = mutateStoriesTools("proj-1", "mem-1", "PM")
    expect((tools.create_story as { inputSchema: unknown }).inputSchema).toBeDefined()
  })
})
