/**
 * Story Status API Tests
 *
 * Tests PATCH /api/v1/stories/:id/status endpoint:
 * - API key authentication
 * - Valid status transition updates story
 * - Invalid transition returns 400
 * - Sends STORY_STATUS_CHANGED Inngest event
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma
const mockStoryFindFirst = vi.fn()
const mockStoryUpdate = vi.fn()

vi.mock("@/lib/db", () => ({
  prisma: {
    story: {
      findFirst: (...args: unknown[]) => mockStoryFindFirst(...args),
      update: (...args: unknown[]) => mockStoryUpdate(...args),
    },
  },
}))

// Mock validateApiKey
const mockValidateApiKey = vi.fn()
vi.mock("@/lib/api-keys/middleware", () => ({
  validateApiKey: (...args: unknown[]) => mockValidateApiKey(...args),
}))

// Mock checkRateLimit
const mockCheckRateLimit = vi.fn()
vi.mock("@/lib/api-keys/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}))

// Mock inngest
const mockSend = vi.fn()
vi.mock("@/lib/inngest/client", () => ({
  inngest: { send: (...args: unknown[]) => mockSend(...args) },
}))

import { PATCH } from "@/app/api/v1/stories/[storyId]/status/route"

describe("PATCH /api/v1/stories/:storyId/status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateApiKey.mockResolvedValue({
      projectId: "proj1",
      apiKeyId: "key1",
    })
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 29 })
    mockSend.mockResolvedValue(undefined)
  })

  it("returns 401 without valid API key", async () => {
    const { NextResponse } = await import("next/server")
    mockValidateApiKey.mockResolvedValue(
      NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    )

    const request = new Request(
      "http://localhost:3000/api/v1/stories/story1/status",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      }
    )
    const response = await PATCH(request, {
      params: Promise.resolve({ storyId: "story1" }),
    })

    expect(response.status).toBe(401)
  })

  it("returns 404 for unknown storyId", async () => {
    mockStoryFindFirst.mockResolvedValue(null)

    const request = new Request(
      "http://localhost:3000/api/v1/stories/nonexistent/status",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      }
    )
    const response = await PATCH(request, {
      params: Promise.resolve({ storyId: "nonexistent" }),
    })

    expect(response.status).toBe(404)
  })

  it("valid transition updates status and sends event", async () => {
    mockStoryFindFirst.mockResolvedValue({
      id: "story1",
      projectId: "proj1",
      status: "SPRINT_PLANNED",
    })
    const now = new Date()
    mockStoryUpdate.mockResolvedValue({
      id: "story1",
      status: "IN_PROGRESS",
      updatedAt: now,
    })

    const request = new Request(
      "http://localhost:3000/api/v1/stories/story1/status",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      }
    )
    const response = await PATCH(request, {
      params: Promise.resolve({ storyId: "story1" }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe("story1")
    expect(data.status).toBe("IN_PROGRESS")
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "story/status-changed",
      })
    )
  })

  it("invalid transition returns 400", async () => {
    mockStoryFindFirst.mockResolvedValue({
      id: "story1",
      projectId: "proj1",
      status: "DRAFT",
    })

    const request = new Request(
      "http://localhost:3000/api/v1/stories/story1/status",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      }
    )
    const response = await PATCH(request, {
      params: Promise.resolve({ storyId: "story1" }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain("Invalid status transition")
  })
})
