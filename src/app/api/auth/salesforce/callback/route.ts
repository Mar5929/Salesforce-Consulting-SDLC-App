import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import {
  exchangeCodeForTokens,
  validateOAuthState,
} from "@/lib/salesforce/oauth"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/**
 * GET /api/auth/salesforce/callback?code=...&state=...
 *
 * OAuth callback handler. Salesforce redirects here after the user authorizes.
 * Exchanges the authorization code for encrypted tokens, stores them on the project,
 * and triggers an initial full metadata sync.
 *
 * T-04-05: Validates state token and resolves to projectId + userId (CSRF protection).
 * T-04-07: Auth code is single-use and short-lived; tokens never exposed in URLs.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state") // CSRF state token
  const error = request.nextUrl.searchParams.get("error")

  // Handle Salesforce-side errors (user denied access, etc.)
  if (error || !code || !state) {
    return NextResponse.redirect(`${APP_URL}?error=oauth_failed`)
  }

  // Validate CSRF state token and resolve to projectId + userId
  const stateData = await validateOAuthState(state)
  if (!stateData) {
    // Token not found at all — no projectId available
    return NextResponse.redirect(`${APP_URL}?error=oauth_failed`)
  }
  if (!stateData.valid) {
    // Token expired — redirect to project org settings with error
    return NextResponse.redirect(
      `${APP_URL}/projects/${stateData.projectId}/settings/org?error=oauth_failed`
    )
  }

  const { projectId, clerkUserId: initiatingUserId } = stateData

  // Verify user session exists and matches the user who initiated the flow (T-04-05)
  const { userId } = await auth()
  if (!userId || userId !== initiatingUserId) {
    return NextResponse.redirect(
      `${APP_URL}/projects/${projectId}/settings/org?error=oauth_failed`
    )
  }

  // Verify the user has SA or PM role on the project (CR-02: independent role check)
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      clerkUserId: userId,
      role: { in: ["SOLUTION_ARCHITECT", "PM"] },
    },
  })

  if (!member) {
    return NextResponse.redirect(
      `${APP_URL}/projects/${projectId}/settings/org?error=oauth_failed`
    )
  }

  // Verify the project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.redirect(`${APP_URL}?error=oauth_failed`)
  }

  try {
    // Exchange authorization code for encrypted tokens
    const { instanceUrl, encryptedAccessToken, encryptedRefreshToken } =
      await exchangeCodeForTokens(code, projectId)

    // Store encrypted tokens on the project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        sfOrgInstanceUrl: instanceUrl,
        sfOrgAccessToken: encryptedAccessToken,
        sfOrgRefreshToken: encryptedRefreshToken,
      },
    })

    // Trigger initial full metadata sync via Inngest
    await inngest.send({
      name: EVENTS.ORG_SYNC_REQUESTED,
      data: {
        projectId,
        syncType: "FULL",
      },
    })

    return NextResponse.redirect(
      `${APP_URL}/projects/${projectId}/settings/org?connected=true`
    )
  } catch (err) {
    console.error("OAuth token exchange failed:", err)
    return NextResponse.redirect(
      `${APP_URL}/projects/${projectId}/settings/org?error=oauth_failed`
    )
  }
}
