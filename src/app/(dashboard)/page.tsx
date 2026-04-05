import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const clerkUserId = await requireAuth()

  const memberships = await prisma.projectMember.findMany({
    where: { clerkUserId, status: "ACTIVE" },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          clientName: true,
          engagementType: true,
          currentPhase: true,
          status: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const projects = memberships.map((m) => m.project)

  if (projects.length === 0) {
    return (
      <div>
        <h1 className="text-[24px] font-semibold text-foreground">Projects</h1>
        <EmptyState
          heading="No projects yet"
          description="Create your first project to get started with discovery, story management, and AI-powered delivery."
          actionLabel="Create Project"
          actionHref="/projects/new"
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-semibold text-foreground">Projects</h1>
      </div>
      <div className="mt-6 grid gap-4">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="transition-colors hover:bg-[#FAFAFA]">
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-foreground">
                    {project.name}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {project.clientName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[12px]">
                    {project.engagementType.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="outline" className="text-[12px]">
                    {project.currentPhase.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
