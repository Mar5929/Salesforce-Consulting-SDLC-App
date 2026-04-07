import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { getCurrentMember } from "@/lib/auth"
import { prisma } from "@/lib/db"

function extractProjectId(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/)
  return match ? match[1] : null
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
    } catch {
      // User is not a member of this project — redirect to dashboard root
      redirect("/")
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
