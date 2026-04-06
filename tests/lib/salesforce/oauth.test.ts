import { describe, it, expect } from "vitest"
import { buildAuthorizationUrl } from "@/lib/salesforce/oauth"

describe("buildAuthorizationUrl", () => {
  const projectId = "test-project-123"

  it("returns a URL string", () => {
    const url = buildAuthorizationUrl(projectId)
    expect(typeof url).toBe("string")
    expect(() => new URL(url)).not.toThrow()
  })

  it("targets Salesforce login endpoint", () => {
    const url = new URL(buildAuthorizationUrl(projectId))
    expect(url.origin).toBe("https://login.salesforce.com")
    expect(url.pathname).toBe("/services/oauth2/authorize")
  })

  it("includes response_type=code", () => {
    const url = new URL(buildAuthorizationUrl(projectId))
    expect(url.searchParams.get("response_type")).toBe("code")
  })

  it("includes client_id from env", () => {
    const url = new URL(buildAuthorizationUrl(projectId))
    expect(url.searchParams.get("client_id")).toBe("test-sf-client-id")
  })

  it("includes redirect_uri pointing to callback route", () => {
    const url = new URL(buildAuthorizationUrl(projectId))
    const redirectUri = url.searchParams.get("redirect_uri")
    expect(redirectUri).toBe("http://localhost:3000/api/auth/salesforce/callback")
  })

  it("includes state=projectId for CSRF and routing", () => {
    const url = new URL(buildAuthorizationUrl(projectId))
    expect(url.searchParams.get("state")).toBe(projectId)
  })
})
