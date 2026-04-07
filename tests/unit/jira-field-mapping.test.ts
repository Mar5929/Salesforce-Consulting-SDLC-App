import { describe, it, expect } from "vitest"

describe("jira-field-mapping", () => {
  describe("STATUS_TO_JIRA", () => {
    it.todo("maps DRAFT to 'To Do'")
    it.todo("maps IN_PROGRESS to 'In Progress'")
    it.todo("maps DONE to 'Done'")
    it.todo("maps all StoryStatus values")
  })

  describe("mapStoryToJiraFields", () => {
    it.todo("prefixes summary with displayId")
    it.todo("uses empty string for null description")
    it.todo("includes story points when present")
    it.todo("omits story points when null")
  })
})
