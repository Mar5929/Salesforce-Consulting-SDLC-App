/**
 * Context Package API Tests
 *
 * Tests GET /api/v1/context-package endpoint:
 * - API key authentication via validateApiKey
 * - Rate limiting via checkRateLimit
 * - Story context assembly (story, processes, articles, decisions, conflicts)
 * - 404 for unknown storyId
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma
const mockStoryFindFirst = vi.fn()
const mockKnowledgeArticleFindMany = vi.fn()
const mockDecisionFindMany = vi.fn()
const mockStoryFindMany = vi.fn()

vi.mock("@/lib/db", () => ({
  prisma: {
    story: {
      findFirst: (...args: unknown[]) => mockStoryFindFirst(...args),
      findMany: (...args: unknown[]) => mockStoryFindMany(...args),
    },
    knowledgeArticle: {
      findMany: (...args: unknown[]) => mockKnowledgeArticleFindMany(...args),
    },
    decision: {
      findMany: (...args: unknown[]) => mockDecisionFindMany(...args),
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

// Mock context loaders
const mockLoadOrgComponentContext = vi.fn()
vi.mock("@/lib/agent-harness/context/org-components", () => ({
  loadOrgComponentContext: (...args: unknown[]) =>
    mockLoadOrgComponentContext(...args),
}))

const mockLoadBusinessProcessContext = vi.fn()
vi.mock("@/lib/agent-harness/context/business-processes", () => ({
  loadBusinessProcessContext: (...args: unknown[]) =>
    mockLoadBusinessProcessContext(...args),
}))

import { GET } from "@/app/api/v1/context-package/route"

describe("GET /api/v1/context-package", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 29 })
    mockLoadOrgComponentContext.mockResolvedValue({ components: [], relationships: [] })
    mockLoadBusinessProcessContext.mockResolvedValue({ processes: [] })
    mockKnowledgeArticleFindMany.mockResolvedValue([])
    mockDecisionFindMany.mockResolvedValue([])
    mockStoryFindMany.mockResolvedValue([])
  })

  it("returns 401 without valid API key", async () => {
    const { NextResponse } = await import("next/server")
    mockValidateApiKey.mockResolvedValue(
      NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    )

    const request = new Request(
      "http://localhost:3000/api/v1/context-package?storyId=story123"
    )
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it("returns 429 when rate limited", async () => {
    mockValidateApiKey.mockResolvedValue({
      projectId: "proj1",
      apiKeyId: "key1",
    })
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfter: 60,
    })

    const request = new Request(
      "http://localhost:3000/api/v1/context-package?storyId=story123"
    )
    const response = await GET(request)

    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("60")
  })

  it("returns 400 when storyId is missing", async () => {
    mockValidateApiKey.mockResolvedValue({
      projectId: "proj1",
      apiKeyId: "key1",
    })

    const request = new Request(
      "http://localhost:3000/api/v1/context-package"
    )
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it("returns 404 for unknown storyId", async () => {
    mockValidateApiKey.mockResolvedValue({
      projectId: "proj1",
      apiKeyId: "key1",
    })
    mockStoryFindFirst.mockResolvedValue(null)

    const request = new Request(
      "http://localhost:3000/api/v1/context-package?storyId=nonexistent"
    )
    const response = await GET(request)

    expect(response.status).toBe(404)
  })

  it("returns story context with business processes", async () => {
    mockValidateApiKey.mockResolvedValue({
      projectId: "proj1",
      apiKeyId: "key1",
    })
    mockStoryFindFirst.mockResolvedValue({
      id: "story1",
      projectId: "proj1",
      title: "Implement Account trigger",
      description: "Handle account updates",
      acceptanceCriteria: "Given account update...",
      status: "IN_PROGRESS",
      epicId: "epic1",
      featureId: "feat1",
      storyComponents: [
        { id: "sc1", orgComponentId: "comp1", componentName: "Account", impactType: "MODIFY" },
      ],
    })
    mockLoadBusinessProcessContext.mockResolvedValue({
      processes: [
        {
          name: "Account Management",
          description: "Handles account lifecycle",
          complexity: "MEDIUM",
          components: [{ apiName: "Account", role: "Primary object" }],
        },
      ],
    })
    mockKnowledgeArticleFindMany.mockResolvedValue([
      { id: "art1", title: "Account overview", summary: "Summary of accounts" },
    ])
    mockDecisionFindMany.mockResolvedValue([
      { id: "dec1", title: "Use trigger for account", rationale: "Better control" },
    ])

    const request = new Request(
      "http://localhost:3000/api/v1/context-package?storyId=story1"
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.story).toBeDefined()
    expect(data.story.title).toBe("Implement Account trigger")
    expect(data.businessProcesses).toBeDefined()
    expect(data.businessProcesses.processes).toHaveLength(1)
    expect(data.knowledgeArticles).toHaveLength(1)
    expect(data.decisions).toHaveLength(1)
  })
})
