import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { getCurrentMember } from "@/lib/auth"
import { prisma } from "@/lib/db"

function extractProjectId(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/)
  if (!match || match[1] === "new") return null
  return match[1]
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? ""

  if (process.env.NODE_ENV === "development" && !pathname) {
    console.warn("[DashboardLayout] x-pathname header missing — is middleware injecting it?")
  }

  const projectId = extractProjectId(pathname)

  let currentMemberRole: string | undefined
  let questionReviewCount: number | undefined
  let openDefectCount: number | undefined

  if (projectId) {
    try {
      const [member, qCount, dCount] = await Promise.all([
        getCurrentMember(projectId),
        // Count questions answered (by AI or human) that are awaiting human review/approval.
        // Status flow: OPEN -> SCOPED -> OWNED -> ANSWERED -> REVIEWED
        prisma.question.count({
          where: { projectId, status: "ANSWERED" },
        }),
        prisma.defect.count({
          where: { projectId, status: "OPEN" },
        }),
      ])
      currentMemberRole = member.role
      questionReviewCount = qCount
      openDefectCount = dCount
    } catch (err) {
      // Only redirect for auth/membership errors; let infrastructure errors surface
      if (
        err instanceof Error &&
        (err.message === "Not a member of this project" ||
          err.message === "Unauthorized" ||
          err.message === "Insufficient permissions")
      ) {
        redirect("/")
      }
      throw err // Re-throw unexpected errors so Next.js error boundary handles them
    }
  }

  return (
    <AppShell
      currentMemberRole={currentMemberRole}
      activeProjectId={projectId ?? undefined}
      questionReviewCount={questionReviewCount}
      openDefectCount={openDefectCount}
    >
      {children}
    </AppShell>
  )
}
