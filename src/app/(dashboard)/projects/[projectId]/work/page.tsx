/**
 * Work Page - Epics List
 *
 * Server component that loads epics for a project.
 * Renders page title with "New Epic" button.
 * Toggle between Table (default) and Kanban views.
 */

import { Suspense } from "react"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { WorkPageClient } from "./work-page-client"

interface WorkPageProps {
  params: Promise<{ projectId: string }>
}

export default async function WorkPage({ params }: WorkPageProps) {
  const { projectId } = await params

  await getCurrentMember(projectId)
  const db = scopedPrisma(projectId)

  const epics = await db.epic.findMany({
    where: { projectId },
    include: {
      _count: {
        select: { features: true, stories: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  return (
    <Suspense fallback={<WorkPageSkeleton />}>
      <WorkPageClient
        projectId={projectId}
        epics={JSON.parse(JSON.stringify(epics))}
      />
    </Suspense>
  )
}

function WorkPageSkeleton() {
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
