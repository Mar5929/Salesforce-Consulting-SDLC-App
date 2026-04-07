import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { buildAuthorizationUrl } from "@/lib/salesforce/oauth"

/**
 * GET /api/auth/salesforce/authorize?projectId=...
 *
 * Initiates the Salesforce OAuth 2.0 Web Server Flow.
 * Validates the user is authenticated and has SA or PM role on the project.
 * Redirects the browser to the Salesforce login page.
 */
export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    )
  }

  // Verify user is authenticated via Clerk
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user has SA or PM role on the project (D-05)
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      clerkUserId: userId,
      role: { in: ["SOLUTION_ARCHITECT", "PM"] },
    },
  })

  if (!member) {
    return NextResponse.json(
      { error: "Only Solution Architects and Project Managers can connect a Salesforce org" },
      { status: 403 }
    )
  }

  // Verify project doesn't already have a connected org (D-03)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { sfOrgInstanceUrl: true },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  if (project.sfOrgInstanceUrl) {
    return NextResponse.json(
      { error: "Org already connected. Disconnect first." },
      { status: 400 }
    )
  }

  // Build OAuth authorization URL (now async, generates CSRF state token)
  const authUrl = await buildAuthorizationUrl(projectId, userId)
  return NextResponse.redirect(authUrl)
}
