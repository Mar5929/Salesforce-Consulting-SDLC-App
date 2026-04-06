/**
 * Epic Detail Page - Features List
 *
 * Server component that loads an epic and its features.
 * Renders breadcrumb navigation, features table/kanban toggle,
 * and "New Feature" button.
 */

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { EpicDetailClient } from "./epic-detail-client"

interface EpicDetailPageProps {
  params: Promise<{ projectId: string; epicId: string }>
}

export default async function EpicDetailPage({ params }: EpicDetailPageProps) {
  const { projectId, epicId } = await params

  await getCurrentMember(projectId)

  const epic = await prisma.epic.findUnique({
    where: { id: epicId },
    include: {
      features: {
        include: {
          _count: { select: { stories: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: { stories: true },
      },
    },
  })

  if (!epic || epic.projectId !== projectId) {
    notFound()
  }

  return (
    <Suspense fallback={<EpicDetailSkeleton />}>
      <EpicDetailClient
        projectId={projectId}
        epic={JSON.parse(JSON.stringify(epic))}
      />
    </Suspense>
  )
}

function EpicDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-5 w-48" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}
