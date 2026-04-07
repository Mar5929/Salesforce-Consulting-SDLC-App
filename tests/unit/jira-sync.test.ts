import { describe, it, expect } from "vitest"

describe("jira-sync", () => {
  describe("pushStoryToJira", () => {
    it.todo("creates new Jira issue when no sync record exists")
    it.todo("updates existing Jira issue when sync record exists")
    it.todo("returns jiraIssueId and jiraIssueKey")
  })

  describe("syncStoryStatus", () => {
    it.todo("transitions Jira issue to matching status")
    it.todo("skips sync when no sync record exists")
    it.todo("logs warning when no matching Jira transition found")
  })
})
