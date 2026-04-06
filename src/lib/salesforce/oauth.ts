import jsforce from "jsforce"
import { encrypt } from "@/lib/encryption"

/**
 * Build the Salesforce OAuth 2.0 authorization URL for the Web Server Flow.
 * The user's browser is redirected to this URL to begin the OAuth handshake.
 *
 * @param projectId - Used as the `state` parameter for CSRF protection and routing
 * @returns Full authorization URL string
 */
export function buildAuthorizationUrl(projectId: string): string {
  const clientId = process.env.SF_CONNECTED_APP_CLIENT_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`

  const oauth2 = new jsforce.OAuth2({
    clientId,
    clientSecret: process.env.SF_CONNECTED_APP_CLIENT_SECRET!,
    redirectUri,
  })

  // jsforce getAuthorizationUrl doesn't support state param directly,
  // so we construct the URL manually for full control
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: projectId,
  })

  return `https://login.salesforce.com/services/oauth2/authorize?${params.toString()}`
}

/**
 * Exchange an authorization code for encrypted OAuth tokens.
 * Called from the OAuth callback route after Salesforce redirects back.
 *
 * @param code - Authorization code from Salesforce callback
 * @param projectId - Used for token encryption (per-project derived key)
 * @returns Encrypted tokens and instance URL
 */
export async function exchangeCodeForTokens(
  code: string,
  projectId: string
): Promise<{
  instanceUrl: string
  encryptedAccessToken: string
  encryptedRefreshToken: string | null
}> {
  const oauth2 = new jsforce.OAuth2({
    clientId: process.env.SF_CONNECTED_APP_CLIENT_ID!,
    clientSecret: process.env.SF_CONNECTED_APP_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`,
  })

  const conn = new jsforce.Connection({ oauth2 })
  await conn.authorize(code)

  const encryptedAccessToken = await encrypt(conn.accessToken!, projectId)
  const encryptedRefreshToken = conn.refreshToken
    ? await encrypt(conn.refreshToken, projectId)
    : null

  return {
    instanceUrl: conn.instanceUrl,
    encryptedAccessToken,
    encryptedRefreshToken,
  }
}
