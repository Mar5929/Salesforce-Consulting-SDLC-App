import { vi } from "vitest"

/**
 * Mock Clerk's auth() function to return a specific userId.
 * Call this in beforeEach to simulate an authenticated user.
 */
export function mockAuth(userId: string) {
  vi.mock("@clerk/nextjs/server", () => ({
    auth: vi.fn().mockResolvedValue({ userId }),
  }))
}

/**
 * Creates a mock ProjectMember record with the given role.
 * Uses realistic defaults matching the Prisma schema.
 */
export function mockProjectMember(
  role: "PM" | "SOLUTION_ARCHITECT" | "DEVELOPER" | "BA" | "QA",
  overrides: {
    memberId?: string
    clerkUserId?: string
    projectId?: string
  } = {}
) {
  return {
    id: overrides.memberId ?? "member-1",
    projectId: overrides.projectId ?? "project-1",
    clerkUserId: overrides.clerkUserId ?? "user-1",
    displayName: "Test User",
    email: "test@example.com",
    role,
    status: "ACTIVE" as const,
    joinedAt: new Date("2026-01-15"),
    removedAt: null,
  }
}
