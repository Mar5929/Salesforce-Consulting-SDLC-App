/**
 * Questions List Page
 *
 * Server component that loads questions for a project.
 * Renders page title with "Ask Question" button.
 * Toggle between Table (default) and Kanban views.
 */

import { Suspense } from "react"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { QuestionsPageClient } from "./questions-page-client"

interface QuestionsPageProps {
  params: Promise<{ projectId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function QuestionsPage({ params, searchParams }: QuestionsPageProps) {
  const { projectId } = await params
  const search = await searchParams

  const member = await getCurrentMember(projectId)
  const db = scopedPrisma(projectId)

  // Build where clause from search params
  const where: Record<string, unknown> = { projectId }
  if (search.status && typeof search.status === "string") where.status = search.status
  if (search.scope && typeof search.scope === "string") where.scope = search.scope
  if (search.priority && typeof search.priority === "string") where.priority = search.priority
  if (search.review === "needs_review") where.needsReview = true

  const [questions, epics, features, teamMembers, reviewCount] = await Promise.all([
    db.question.findMany({
      where,
      include: {
        owner: { select: { id: true, displayName: true, email: true } },
        answeredBy: { select: { id: true, displayName: true, email: true } },
        scopeEpic: { select: { id: true, name: true, prefix: true } },
        scopeFeature: { select: { id: true, name: true, prefix: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.epic.findMany({
      where: { projectId },
      select: { id: true, name: true, prefix: true },
      orderBy: { prefix: "asc" },
    }),
    db.feature.findMany({
      where: { projectId },
      select: { id: true, name: true, prefix: true },
      orderBy: { prefix: "asc" },
    }),
    db.projectMember.findMany({
      where: { projectId, status: "ACTIVE" },
      select: { id: true, displayName: true, email: true },
    }),
    db.question.count({
      where: { projectId, needsReview: true },
    }),
  ])

  return (
    <Suspense fallback={<QuestionsPageSkeleton />}>
      <QuestionsPageClient
        projectId={projectId}
        questions={JSON.parse(JSON.stringify(questions))}
        epics={epics}
        features={features}
        teamMembers={teamMembers}
        reviewCount={reviewCount}
        currentMemberRole={member.role}
      />
    </Suspense>
  )
}

function QuestionsPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[140px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}
