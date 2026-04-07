/**
 * Defects List Page (D-07, D-08)
 *
 * Server component that loads defects for a project.
 * Renders page title with "Create Defect" button.
 * Toggle between Table (default) and Kanban views.
 * Filter bar for status, severity, assignee, story.
 */

import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { DefectsPageClient } from "./defects-page-client"

interface DefectsPageProps {
  params: Promise<{ projectId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DefectsPage({
  params,
  searchParams,
}: DefectsPageProps) {
  const { projectId } = await params
  const search = await searchParams

  const member = await getCurrentMember(projectId)

  // Build where clause from search params
  const where: Record<string, unknown> = { projectId }
  if (search.status && typeof search.status === "string") where.status = search.status
  if (search.severity && typeof search.severity === "string") where.severity = search.severity
  if (search.assignee && typeof search.assignee === "string") where.assigneeId = search.assignee
  if (search.story && typeof search.story === "string") where.storyId = search.story

  const [defects, teamMembers, stories] = await Promise.all([
    prisma.defect.findMany({
      where,
      include: {
        story: { select: { id: true, displayId: true, title: true } },
        assignee: { select: { id: true, displayName: true } },
        createdBy: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.projectMember.findMany({
      where: { projectId, status: "ACTIVE" },
      select: { id: true, displayName: true },
    }),
    prisma.story.findMany({
      where: { projectId },
      select: { id: true, displayId: true, title: true },
      orderBy: { displayId: "asc" },
    }),
  ])

  return (
    <Suspense fallback={<DefectsPageSkeleton />}>
      <DefectsPageClient
        projectId={projectId}
        defects={JSON.parse(JSON.stringify(defects))}
        members={teamMembers}
        stories={stories}
        memberRole={member.role}
      />
    </Suspense>
  )
}

function DefectsPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}
