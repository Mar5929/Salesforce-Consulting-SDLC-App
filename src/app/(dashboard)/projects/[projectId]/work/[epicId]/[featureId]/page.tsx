/**
 * Feature Detail Page - Stories List
 *
 * Server component that loads a feature and its stories.
 * Renders breadcrumb navigation, story table/kanban toggle,
 * and "New Story" button opening slide-over form.
 */

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { FeatureDetailClient } from "./feature-detail-client"

interface FeatureDetailPageProps {
  params: Promise<{ projectId: string; epicId: string; featureId: string }>
}

export default async function FeatureDetailPage({ params }: FeatureDetailPageProps) {
  const { projectId, epicId, featureId } = await params

  const member = await getCurrentMember(projectId)

  const feature = await prisma.feature.findUnique({
    where: { id: featureId },
    include: {
      epic: { select: { id: true, name: true, prefix: true } },
    },
  })

  if (!feature || feature.projectId !== projectId || feature.epicId !== epicId) {
    notFound()
  }

  const stories = await prisma.story.findMany({
    where: { projectId, featureId },
    include: {
      storyComponents: true,
      assignee: { select: { id: true, displayName: true, email: true } },
      feature: { select: { id: true, name: true, prefix: true } },
      sprint: { select: { id: true, name: true } },
    },
    orderBy: { sortOrder: "asc" },
  })

  // Load epics and features for the story form
  const epics = await prisma.epic.findMany({
    where: { projectId },
    select: { id: true, name: true, prefix: true },
    orderBy: { sortOrder: "asc" },
  })

  const allFeatures = await prisma.feature.findMany({
    where: { projectId },
    select: { id: true, name: true, prefix: true, epicId: true },
    orderBy: { sortOrder: "asc" },
  })

  return (
    <Suspense fallback={<FeatureDetailSkeleton />}>
      <FeatureDetailClient
        projectId={projectId}
        epicId={epicId}
        feature={JSON.parse(JSON.stringify(feature))}
        stories={JSON.parse(JSON.stringify(stories))}
        epics={epics}
        features={allFeatures}
        userRole={member.role}
      />
    </Suspense>
  )
}

function FeatureDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-5 w-64" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}
