/**
 * Org Components API Tests
 *
 * Tests GET /api/v1/org/components endpoint:
 * - API key authentication
 * - Paginated results
 * - Filtering by type and domain
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma
const mockOrgComponentFindMany = vi.fn()
const mockOrgComponentCount = vi.fn()

vi.mock("@/lib/db", () => ({
  prisma: {
    orgComponent: {
      findMany: (...args: unknown[]) => mockOrgComponentFindMany(...args),
      count: (...args: unknown[]) => mockOrgComponentCount(...args),
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

import { GET } from "@/app/api/v1/org/components/route"

describe("GET /api/v1/org/components", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateApiKey.mockResolvedValue({
      projectId: "proj1",
      apiKeyId: "key1",
    })
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 59 })
  })

  it("returns 401 without valid API key", async () => {
    const { NextResponse } = await import("next/server")
    mockValidateApiKey.mockResolvedValue(
      NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    )

    const request = new Request("http://localhost:3000/api/v1/org/components")
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it("returns paginated components", async () => {
    mockOrgComponentCount.mockResolvedValue(3)
    mockOrgComponentFindMany.mockResolvedValue([
      { id: "c1", apiName: "Account", label: "Account", componentType: "OBJECT", domainGroupingId: null },
      { id: "c2", apiName: "Contact", label: "Contact", componentType: "OBJECT", domainGroupingId: null },
      { id: "c3", apiName: "AccountTrigger", label: null, componentType: "APEX_TRIGGER", domainGroupingId: null },
    ])

    const request = new Request(
      "http://localhost:3000/api/v1/org/components?page=1&pageSize=10"
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(3)
    expect(data.pagination.total).toBe(3)
    expect(data.pagination.page).toBe(1)
  })

  it("filters by type", async () => {
    mockOrgComponentCount.mockResolvedValue(1)
    mockOrgComponentFindMany.mockResolvedValue([
      { id: "c1", apiName: "Account", label: "Account", componentType: "OBJECT", domainGroupingId: null },
    ])

    const request = new Request(
      "http://localhost:3000/api/v1/org/components?type=OBJECT"
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(mockOrgComponentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          componentType: "OBJECT",
        }),
      })
    )
  })

  it("filters by domain", async () => {
    mockOrgComponentCount.mockResolvedValue(1)
    mockOrgComponentFindMany.mockResolvedValue([
      { id: "c1", apiName: "Account", label: "Account", componentType: "OBJECT", domainGroupingId: "domain1" },
    ])

    const request = new Request(
      "http://localhost:3000/api/v1/org/components?domain=domain1"
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(mockOrgComponentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          domainGroupingId: "domain1",
        }),
      })
    )
  })
})
