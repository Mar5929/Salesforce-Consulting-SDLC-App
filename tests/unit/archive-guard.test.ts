import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {
    project: {
      findUniqueOrThrow: vi.fn(),
    },
  },
}))

import { assertProjectNotArchived } from "@/lib/archive-guard"
import { prisma } from "@/lib/db"

const mockFindUnique = vi.mocked(prisma.project.findUniqueOrThrow)

describe("archive-guard", () => {
  it("throws error when project status is ARCHIVED", async () => {
    mockFindUnique.mockResolvedValue({ status: "ARCHIVED" } as never)

    await expect(assertProjectNotArchived("proj-1")).rejects.toThrow(
      "This project is archived"
    )
  })

  it("does not throw when project status is ACTIVE", async () => {
    mockFindUnique.mockResolvedValue({ status: "ACTIVE" } as never)

    await expect(assertProjectNotArchived("proj-1")).resolves.toBeUndefined()
  })

  it("throws with specific error message mentioning reactivation", async () => {
    mockFindUnique.mockResolvedValue({ status: "ARCHIVED" } as never)

    await expect(assertProjectNotArchived("proj-1")).rejects.toThrow(
      "Reactivate to make changes"
    )
  })
})
