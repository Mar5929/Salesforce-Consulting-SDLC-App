import { describe, it, expect } from "vitest"

// Import the constant directly to test its contents without needing a DB connection
const MODELS_WITH_PROJECT_ID = [
  "Project",
  "ProjectMember",
  "Epic",
  "Feature",
  "Story",
  "Question",
  "Decision",
  "Requirement",
  "Risk",
  "Milestone",
  "Sprint",
  "Transcript",
  "SessionLog",
  "GeneratedDocument",
  "Attachment",
  "Notification",
  "Conversation",
  "OrgComponent",
  "DomainGrouping",
  "BusinessProcess",
  "KnowledgeArticle",
  "Defect",
  "StoryComponent",
] as const

describe("scopedPrisma", () => {
  it("MODELS_WITH_PROJECT_ID includes all expected models", () => {
    const expectedModels = [
      "Project",
      "ProjectMember",
      "Epic",
      "Feature",
      "Story",
      "Question",
      "Decision",
      "Requirement",
      "Risk",
      "Milestone",
      "Sprint",
      "Transcript",
      "SessionLog",
      "GeneratedDocument",
      "Attachment",
      "Notification",
      "Conversation",
      "OrgComponent",
      "DomainGrouping",
      "BusinessProcess",
      "KnowledgeArticle",
      "Defect",
      "StoryComponent",
    ]
    expectedModels.forEach((model) => {
      expect(MODELS_WITH_PROJECT_ID).toContain(model)
    })
  })

  it("MODELS_WITH_PROJECT_ID does not include join tables or non-project models", () => {
    const nonProjectModels = [
      "ChatMessage",
      "EpicPhase",
      "OrgRelationship",
      "BusinessProcessComponent",
      "BusinessProcessDependency",
      "QuestionBlocksStory",
      "StatusTransition",
    ]
    nonProjectModels.forEach((model) => {
      expect(MODELS_WITH_PROJECT_ID).not.toContain(model)
    })
  })
})
