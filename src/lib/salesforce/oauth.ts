import { randomBytes } from "crypto"
import jsforce from "jsforce"
import { encrypt } from "@/lib/encryption"
import { prisma } from "@/lib/db"

/**
 * Build the Salesforce OAuth 2.0 authorization URL for the Web Server Flow.
 * The user's browser is redirected to this URL to begin the OAuth handshake.
 *
 * Generates a cryptographically random state token and stores it server-side
 * to bind the OAuth flow to the initiating user and project (CSRF protection).
 *
 * @param projectId - Project initiating the OAuth connection
 * @param userId - Clerk user ID initiating the flow
 * @returns Full authorization URL string
 */
export async function buildAuthorizationUrl(
  projectId: string,
  userId: string
): Promise<string> {
  const clientId = process.env.SF_CONNECTED_APP_CLIENT_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`

  // Generate a cryptographically random state token for CSRF protection
  const stateToken = randomBytes(32).toString("hex")

  // Store state token with projectId, userId, and short TTL (10 minutes)
  await prisma.oauthState.create({
    data: {
      token: stateToken,
      projectId,
      clerkUserId: userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  // jsforce getAuthorizationUrl doesn't support state param directly,
  // so we construct the URL manually for full control
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: stateToken,
  })

  return `https://login.salesforce.com/services/oauth2/authorize?${params.toString()}`
}

/**
 * Validate an OAuth state token and return the associated projectId and userId.
 * Deletes the token after validation (single-use).
 *
 * @param stateToken - The state token from the OAuth callback
 * @returns The projectId and userId bound to this state token, or null if invalid/expired
 */
export async function validateOAuthState(
  stateToken: string
): Promise<{ projectId: string; clerkUserId: string } | null> {
  const record = await prisma.oauthState.findUnique({
    where: { token: stateToken },
  })

  if (!record) return null

  // Delete the token (single-use)
  await prisma.oauthState.delete({ where: { token: stateToken } })

  // Check expiry
  if (record.expiresAt < new Date()) return null

  return { projectId: record.projectId, clerkUserId: record.clerkUserId }
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
