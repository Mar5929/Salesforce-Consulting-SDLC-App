/**
 * Sprint List Page
 *
 * Server component that loads all sprints for a project.
 * Renders sprint table with "New Sprint" button.
 * Empty state when no sprints exist.
 */

import { Suspense } from "react"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { SprintListClient } from "./sprint-list-client"

interface SprintPageProps {
  params: Promise<{ projectId: string }>
}

export default async function SprintsPage({ params }: SprintPageProps) {
  const { projectId } = await params

  await getCurrentMember(projectId)
  const db = scopedPrisma(projectId)

  const sprints = await db.sprint.findMany({
    where: { projectId },
    include: {
      stories: {
        select: { storyPoints: true, status: true },
      },
    },
    orderBy: { startDate: "desc" },
  })

  return (
    <Suspense fallback={<SprintPageSkeleton />}>
      <SprintListClient
        projectId={projectId}
        sprints={JSON.parse(JSON.stringify(sprints))}
      />
    </Suspense>
  )
}

function SprintPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
