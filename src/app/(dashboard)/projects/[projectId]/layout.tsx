import { redirect } from "next/navigation"
import { getCurrentMember } from "@/lib/auth"

interface ProjectLayoutProps {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { projectId } = await params

  // Validate the user is a member of this project
  try {
    await getCurrentMember(projectId)
  } catch {
    redirect("/")
  }

  return <>{children}</>
}
