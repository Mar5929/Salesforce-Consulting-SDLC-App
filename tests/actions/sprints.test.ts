/**
 * Sprint Action Tests (SPRT-02, WORK-03)
 *
 * Tests sprint assignment auto-transition logic and role-based
 * access checks for story editing/deletion.
 *
 * Source modules:
 * - src/actions/sprints.ts (created in Plan 04)
 * - src/actions/stories.ts (created in Plan 01)
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockPrisma } from "../helpers/mock-prisma"
import { makeStory, makeProjectMember, makeSprint } from "../fixtures/work-fixtures"

// Set up mocks before imports
const mockPrisma = createMockPrisma()

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}))

vi.mock("@/lib/project-scope", () => ({
  scopedPrisma: vi.fn(() => mockPrisma),
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user-1" }),
}))

// Mock Inngest client
const mockInngestSend = vi.fn().mockResolvedValue({ ids: ["mock-event-id"] })
vi.mock("@/lib/inngest/client", () => ({
  inngest: { send: mockInngestSend },
}))

describe("assignStoriesToSprint", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should auto-transition READY stories to SPRINT_PLANNED on assignment", async () => {
    const sprint = makeSprint()
    const story = makeStory({ status: "READY" })

    mockPrisma.sprint.findUnique.mockResolvedValue(sprint)
    mockPrisma.story.findUnique.mockResolvedValue(story)
    mockPrisma.story.update.mockResolvedValue({ ...story, sprintId: sprint.id, status: "SPRINT_PLANNED" })
    mockPrisma.projectMember.findFirst.mockResolvedValue(makeProjectMember({ role: "PM" }))

    // Import dynamically to allow mocks to be set up first
    const { assignStoriesToSprint } = await import("@/actions/sprints")

    const result = await assignStoriesToSprint({
      projectId: "project-1",
      sprintId: sprint.id,
      storyIds: [story.id],
    })

    // Verify story was updated with SPRINT_PLANNED status
    expect(mockPrisma.story.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sprintId: sprint.id,
          status: "SPRINT_PLANNED",
        }),
      })
    )
  })

  it("should leave DRAFT status unchanged on sprint assignment (Pitfall 3)", async () => {
    const sprint = makeSprint()
    const story = makeStory({ status: "DRAFT" })

    mockPrisma.sprint.findUnique.mockResolvedValue(sprint)
    mockPrisma.story.findUnique.mockResolvedValue(story)
    mockPrisma.story.update.mockResolvedValue({ ...story, sprintId: sprint.id, status: "DRAFT" })
    mockPrisma.projectMember.findFirst.mockResolvedValue(makeProjectMember({ role: "PM" }))

    const { assignStoriesToSprint } = await import("@/actions/sprints")

    await assignStoriesToSprint({
      projectId: "project-1",
      sprintId: sprint.id,
      storyIds: [story.id],
    })

    // Verify status stayed as DRAFT (not auto-transitioned)
    expect(mockPrisma.story.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sprintId: sprint.id,
          status: "DRAFT",
        }),
      })
    )
  })

  it("should fire SPRINT_STORIES_CHANGED Inngest event after assignment", async () => {
    const sprint = makeSprint()
    const story = makeStory({ status: "READY" })

    mockPrisma.sprint.findUnique.mockResolvedValue(sprint)
    mockPrisma.story.findUnique.mockResolvedValue(story)
    mockPrisma.story.update.mockResolvedValue({ ...story, sprintId: sprint.id, status: "SPRINT_PLANNED" })
    mockPrisma.projectMember.findFirst.mockResolvedValue(makeProjectMember({ role: "PM" }))

    const { assignStoriesToSprint } = await import("@/actions/sprints")

    await assignStoriesToSprint({
      projectId: "project-1",
      sprintId: sprint.id,
      storyIds: [story.id],
    })

    // Verify Inngest event was fired
    expect(mockInngestSend).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "sprint/stories-changed",
        data: expect.objectContaining({
          sprintId: sprint.id,
          projectId: "project-1",
        }),
      })
    )
  })
})

describe("updateStory role checks (WORK-03)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should reject edit when user is not PM/SA and not the assignee", async () => {
    const story = makeStory({ assigneeId: "other-member-id" })
    const devMember = makeProjectMember({ role: "DEVELOPER", clerkUserId: "user-1" })

    mockPrisma.story.findUnique.mockResolvedValue(story)
    mockPrisma.projectMember.findFirst.mockResolvedValue(devMember)

    const { updateStory } = await import("@/actions/stories")

    const result = await updateStory({
      projectId: "project-1",
      storyId: story.id,
      title: "Updated title",
    })

    // Should return an error or throw -- the exact shape depends on implementation
    // but the update should NOT succeed
    expect(mockPrisma.story.update).not.toHaveBeenCalled()
  })

  it("should allow PM to edit any story", async () => {
    const story = makeStory({ assigneeId: "other-member-id" })
    const pmMember = makeProjectMember({ role: "PM", clerkUserId: "user-1" })

    mockPrisma.story.findUnique.mockResolvedValue(story)
    mockPrisma.projectMember.findFirst.mockResolvedValue(pmMember)
    mockPrisma.story.update.mockResolvedValue({ ...story, title: "Updated title" })

    const { updateStory } = await import("@/actions/stories")

    await updateStory({
      projectId: "project-1",
      storyId: story.id,
      title: "Updated title",
    })

    expect(mockPrisma.story.update).toHaveBeenCalled()
  })
})

describe("deleteStory role checks (WORK-03)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should reject deletion when user is not PM/SA and not the assignee", async () => {
    const story = makeStory({ assigneeId: "other-member-id" })
    const devMember = makeProjectMember({ role: "DEVELOPER", clerkUserId: "user-1" })

    mockPrisma.story.findUnique.mockResolvedValue(story)
    mockPrisma.projectMember.findFirst.mockResolvedValue(devMember)

    const { deleteStory } = await import("@/actions/stories")

    await deleteStory({
      projectId: "project-1",
      storyId: story.id,
    })

    // Delete should NOT have been called
    expect(mockPrisma.story.delete).not.toHaveBeenCalled()
  })
})
