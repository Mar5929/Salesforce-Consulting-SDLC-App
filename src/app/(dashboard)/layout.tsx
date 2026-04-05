import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { getCurrentMember } from "@/lib/auth"

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

  const projectId = extractProjectId(pathname)

  let currentMemberRole: string | undefined
  if (projectId) {
    try {
      const member = await getCurrentMember(projectId)
      currentMemberRole = member.role
    } catch {
      // User is not a member of this project — redirect to dashboard root
      redirect("/")
    }
  }

  return (
    <AppShell
      currentMemberRole={currentMemberRole}
      activeProjectId={projectId ?? undefined}
    >
      {children}
    </AppShell>
  )
}
