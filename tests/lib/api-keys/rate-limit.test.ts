import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma
const mockCount = vi.fn()
const mockCreate = vi.fn()
vi.mock("@/lib/db", () => ({
  prisma: {
    apiRequestLog: {
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

import { checkRateLimit } from "@/lib/api-keys/rate-limit"

describe("checkRateLimit", () => {
  const apiKeyId = "key-123"
  const endpoint = "/api/v1/context"

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({})
  })

  it("returns allowed=true when request count is under limit", async () => {
    mockCount.mockResolvedValue(5)

    const result = await checkRateLimit(apiKeyId, endpoint, 60, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(54) // 60 - 5 - 1 (current request)
  })

  it("logs the request when under limit", async () => {
    mockCount.mockResolvedValue(5)

    await checkRateLimit(apiKeyId, endpoint, 60, 60_000)
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        apiKeyId,
        endpoint,
        method: "GET",
      }),
    })
  })

  it("returns allowed=false when at limit", async () => {
    mockCount.mockResolvedValue(60)

    const result = await checkRateLimit(apiKeyId, endpoint, 60, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeDefined()
    expect(typeof result.retryAfter).toBe("number")
  })

  it("does not log the request when over limit", async () => {
    mockCount.mockResolvedValue(60)

    await checkRateLimit(apiKeyId, endpoint, 60, 60_000)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("uses default limit of 60 and window of 60000ms", async () => {
    mockCount.mockResolvedValue(0)

    const result = await checkRateLimit(apiKeyId, endpoint)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(59) // 60 - 0 - 1
  })

  it("respects custom windowMs parameter", async () => {
    mockCount.mockResolvedValue(0)

    await checkRateLimit(apiKeyId, endpoint, 10, 30_000)

    // Verify the count query uses the correct window
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          apiKeyId,
          endpoint,
          timestamp: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      })
    )
  })
})
