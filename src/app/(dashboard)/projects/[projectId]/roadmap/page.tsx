/**
 * Roadmap Page
 *
 * Server component that loads milestones, epics with phases, and stories
 * for the three roadmap tabs: Milestones, Epic Phases, Execution Plan.
 */

import { Suspense } from "react"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { RoadmapPageClient } from "./roadmap-page-client"

interface RoadmapPageProps {
  params: Promise<{ projectId: string }>
}

export default async function RoadmapPage({ params }: RoadmapPageProps) {
  const { projectId } = await params

  await getCurrentMember(projectId)
  const db = scopedPrisma(projectId)

  const [milestones, epics, stories] = await Promise.all([
    // Milestones with linked stories
    db.milestone.findMany({
      where: { projectId },
      include: {
        milestoneStories: {
          include: {
            story: {
              select: {
                id: true,
                displayId: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),

    // Epics with phases and story count
    db.epic.findMany({
      where: { projectId },
      include: {
        phases: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { stories: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),

    // All stories for execution plan and story linking
    db.story.findMany({
      where: { projectId },
      include: {
        epic: {
          select: {
            id: true,
            name: true,
            prefix: true,
            sortOrder: true,
          },
        },
        questionBlocksStories: {
          include: {
            question: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        assignee: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: [
        { epic: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    }),
  ])

  return (
    <Suspense fallback={<RoadmapPageSkeleton />}>
      <RoadmapPageClient
        projectId={projectId}
        milestones={JSON.parse(JSON.stringify(milestones))}
        epics={JSON.parse(JSON.stringify(epics))}
        stories={JSON.parse(JSON.stringify(stories))}
      />
    </Suspense>
  )
}

function RoadmapPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
