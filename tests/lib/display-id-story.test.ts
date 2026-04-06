/**
 * Display ID Generation Tests (Story extension)
 *
 * Tests the generateStoryDisplayId function for format correctness,
 * concurrent safety via max-number extraction, and prefix isolation.
 *
 * Source module: src/lib/display-id.ts (extended in Plan 01)
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockPrisma } from "../helpers/mock-prisma"

// We need to mock the db module so generateStoryDisplayId can use prisma
const mockPrisma = createMockPrisma()

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import { generateStoryDisplayId } from "@/lib/display-id"

describe("generateStoryDisplayId", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return '{prefix}-1' when no existing stories with that prefix", async () => {
    mockPrisma.story.findMany.mockResolvedValue([])

    const result = await generateStoryDisplayId("project-1", "AUTH", mockPrisma as never)
    expect(result).toBe("AUTH-1")
  })

  it("should return '{prefix}-3' when existing stories have prefix-1 and prefix-2", async () => {
    mockPrisma.story.findMany.mockResolvedValue([
      { displayId: "AUTH-1" },
      { displayId: "AUTH-2" },
    ])

    const result = await generateStoryDisplayId("project-1", "AUTH", mockPrisma as never)
    expect(result).toBe("AUTH-3")
  })

  it("should handle non-contiguous numbers (prefix-1, prefix-5 -> prefix-6)", async () => {
    mockPrisma.story.findMany.mockResolvedValue([
      { displayId: "AUTH-1" },
      { displayId: "AUTH-5" },
    ])

    const result = await generateStoryDisplayId("project-1", "AUTH", mockPrisma as never)
    expect(result).toBe("AUTH-6")
  })

  it("should ignore stories with different prefixes", async () => {
    mockPrisma.story.findMany.mockResolvedValue([
      // Only AUTH- stories should be returned by the query
      // since it filters by startsWith
    ])

    const result = await generateStoryDisplayId("project-1", "AUTH", mockPrisma as never)
    expect(result).toBe("AUTH-1")

    // Verify the query filtered by prefix
    expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: "project-1",
          displayId: expect.objectContaining({ startsWith: "AUTH-" }),
        }),
      })
    )
  })
})
