import { vi } from "vitest"

/**
 * Creates a mock Jira Version3Client with standard issue operations.
 * Mirrors the jira.js Version3Client interface.
 */
export function createMockJiraClient() {
  return {
    issues: {
      createIssue: vi.fn().mockResolvedValue({ id: "10001", key: "PROJ-1" }),
      editIssue: vi.fn().mockResolvedValue(undefined),
      getTransitions: vi.fn().mockResolvedValue({
        transitions: [{ id: "1", name: "In Progress" }],
      }),
      doTransition: vi.fn().mockResolvedValue(undefined),
    },
  }
}

/**
 * Mock for decrypting encrypted Jira credentials.
 * Returns plaintext credential string.
 */
export const mockDecrypt = vi.fn().mockReturnValue("decrypted-api-token")
