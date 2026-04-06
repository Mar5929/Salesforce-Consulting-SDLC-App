import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma before importing the module under test
const mockFindMany = vi.fn()
const mockUpdate = vi.fn()
vi.mock("@/lib/db", () => ({
  prisma: {
    apiKey: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

// Mock bcryptjs
const mockCompare = vi.fn()
vi.mock("bcryptjs", () => ({
  default: { compare: (...args: unknown[]) => mockCompare(...args) },
  compare: (...args: unknown[]) => mockCompare(...args),
}))

import { validateApiKey } from "@/lib/api-keys/middleware"

describe("validateApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 response when x-api-key header is missing", async () => {
    const request = new Request("http://localhost:3000/api/v1/context", {
      method: "GET",
    })

    const result = await validateApiKey(request)
    expect(result).toHaveProperty("status", 401)
  })

  it("returns 401 response when x-api-key header is empty", async () => {
    const request = new Request("http://localhost:3000/api/v1/context", {
      method: "GET",
      headers: { "x-api-key": "" },
    })

    const result = await validateApiKey(request)
    expect(result).toHaveProperty("status", 401)
  })

  it("returns 401 when no matching key prefix found", async () => {
    mockFindMany.mockResolvedValue([])

    const request = new Request("http://localhost:3000/api/v1/context", {
      method: "GET",
      headers: { "x-api-key": "sfai_abc12345_deadbeefcafebabe1234567890abcdef" },
    })

    const result = await validateApiKey(request)
    expect(result).toHaveProperty("status", 401)
  })

  it("returns 401 when bcrypt compare fails for all matches", async () => {
    mockFindMany.mockResolvedValue([
      { id: "key-1", projectId: "proj-1", keyHash: "hashed-wrong" },
    ])
    mockCompare.mockResolvedValue(false)

    const request = new Request("http://localhost:3000/api/v1/context", {
      method: "GET",
      headers: { "x-api-key": "sfai_abc12345_deadbeefcafebabe1234567890abcdef" },
    })

    const result = await validateApiKey(request)
    expect(result).toHaveProperty("status", 401)
  })

  it("returns projectId and apiKeyId for valid key", async () => {
    mockFindMany.mockResolvedValue([
      { id: "key-1", projectId: "proj-1", keyHash: "hashed-correct" },
    ])
    mockCompare.mockResolvedValue(true)
    mockUpdate.mockResolvedValue({})

    const request = new Request("http://localhost:3000/api/v1/context", {
      method: "GET",
      headers: { "x-api-key": "sfai_abc12345_deadbeefcafebabe1234567890abcdef" },
    })

    const result = await validateApiKey(request)
    expect(result).toEqual({ projectId: "proj-1", apiKeyId: "key-1" })
  })

  it("updates lastUsedAt and increments useCount on valid key", async () => {
    mockFindMany.mockResolvedValue([
      { id: "key-1", projectId: "proj-1", keyHash: "hashed-correct" },
    ])
    mockCompare.mockResolvedValue(true)
    mockUpdate.mockResolvedValue({})

    const request = new Request("http://localhost:3000/api/v1/context", {
      method: "GET",
      headers: { "x-api-key": "sfai_abc12345_deadbeefcafebabe1234567890abcdef" },
    })

    await validateApiKey(request)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "key-1" },
        data: expect.objectContaining({
          useCount: { increment: 1 },
        }),
      })
    )
  })
})
