/**
 * Mock jsforce objects for testing Salesforce integration
 */
import { vi } from "vitest"

export function createMockConnection() {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {}

  return {
    instanceUrl: "https://test.salesforce.com",
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    oauth2: {
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      redirectUri: "http://localhost:3000/api/auth/salesforce/callback",
      authorizationUrl: "https://login.salesforce.com/services/oauth2/authorize",
    },
    authorize: vi.fn().mockResolvedValue({
      id: "https://login.salesforce.com/id/orgId/userId",
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      instance_url: "https://na1.salesforce.com",
    }),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(handler)
    }),
    _triggerEvent: (event: string, ...args: unknown[]) => {
      listeners[event]?.forEach((h) => h(...args))
    },
    metadata: {
      list: vi.fn().mockResolvedValue([
        { fullName: "Account", type: "CustomObject", lastModifiedDate: "2024-01-01T00:00:00.000Z" },
        { fullName: "Contact", type: "CustomObject", lastModifiedDate: "2024-01-02T00:00:00.000Z" },
      ]),
      describe: vi.fn().mockResolvedValue({
        metadataObjects: [
          { xmlName: "CustomObject", directoryName: "objects", suffix: "object" },
          { xmlName: "ApexClass", directoryName: "classes", suffix: "cls" },
        ],
      }),
      read: vi.fn().mockResolvedValue([
        {
          fullName: "Account",
          fields: [
            { fullName: "Name", type: "Text", label: "Account Name" },
            { fullName: "Industry", type: "Picklist", label: "Industry" },
          ],
        },
      ]),
    },
    sobject: vi.fn().mockReturnValue({
      describe: vi.fn().mockResolvedValue({
        name: "Account",
        label: "Account",
        fields: [
          { name: "Name", type: "string", label: "Account Name" },
          { name: "Industry", type: "picklist", label: "Industry" },
        ],
      }),
    }),
    query: vi.fn().mockResolvedValue({
      totalSize: 1,
      done: true,
      records: [],
    }),
  }
}

export function createMockOAuth2() {
  return {
    getAuthorizationUrl: vi.fn().mockReturnValue(
      "https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=test-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fsalesforce%2Fcallback"
    ),
  }
}
