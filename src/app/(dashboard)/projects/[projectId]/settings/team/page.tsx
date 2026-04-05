import { notFound } from "next/navigation"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import { TeamManagement } from "@/components/projects/team-management"

interface TeamPageProps {
  params: Promise<{ projectId: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { projectId } = await params
  const db = scopedPrisma(projectId)

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  })

  if (!project) {
    notFound()
  }

  const currentMember = await getCurrentMember(projectId)

  const members = await db.projectMember.findMany({
    where: { projectId, status: "ACTIVE" },
    orderBy: { joinedAt: "asc" },
    select: {
      id: true,
      displayName: true,
      email: true,
      role: true,
      joinedAt: true,
    },
  })

  const serializedMembers = members.map((m: { id: string; displayName: string; email: string; role: string; joinedAt: Date }) => ({
    id: m.id,
    displayName: m.displayName,
    email: m.email,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
  }))

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-foreground">Team</h1>

      <div className="mt-6">
        <TeamManagement
          projectId={projectId}
          projectName={project.name}
          members={serializedMembers}
          currentUserRole={currentMember.role}
        />
      </div>
    </div>
  )
}
