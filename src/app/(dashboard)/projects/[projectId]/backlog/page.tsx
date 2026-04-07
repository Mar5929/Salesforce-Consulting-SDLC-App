/**
 * Backlog Page (D-02)
 *
 * Server component. Shows all stories where sprintId is null
 * across all epics in the project.
 * Includes bulk action toolbar for sprint assignment.
 */

import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { BacklogClient } from "./backlog-client"

interface BacklogPageProps {
  params: Promise<{ projectId: string }>
}

export default async function BacklogPage({ params }: BacklogPageProps) {
  const { projectId } = await params

  const member = await getCurrentMember(projectId)

  // Get all unassigned stories (no sprint) across all epics
  const stories = await prisma.story.findMany({
    where: { projectId, sprintId: null },
    include: {
      storyComponents: true,
      assignee: { select: { id: true, displayName: true, email: true } },
      feature: { select: { id: true, name: true, prefix: true } },
      sprint: { select: { id: true, name: true } },
      epic: { select: { id: true, name: true, prefix: true } },
    },
    orderBy: { sortOrder: "asc" },
  })

  // Load epics and features for the story form
  const epics = await prisma.epic.findMany({
    where: { projectId },
    select: { id: true, name: true, prefix: true },
    orderBy: { sortOrder: "asc" },
  })

  const features = await prisma.feature.findMany({
    where: { projectId },
    select: { id: true, name: true, prefix: true, epicId: true },
    orderBy: { sortOrder: "asc" },
  })

  // Load active/planned sprints for bulk sprint assignment
  const sprints = await prisma.sprint.findMany({
    where: { projectId, status: { in: ["PLANNING", "ACTIVE"] } },
    select: { id: true, name: true },
    orderBy: { startDate: "asc" },
  })

  // Load project members for bulk assignee change
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    select: { id: true, displayName: true, email: true },
  })

  return (
    <Suspense fallback={<BacklogSkeleton />}>
      <BacklogClient
        projectId={projectId}
        stories={JSON.parse(JSON.stringify(stories))}
        epics={epics}
        features={features}
        sprints={sprints}
        members={members}
        userRole={member.role}
      />
    </Suspense>
  )
}

function BacklogSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}
