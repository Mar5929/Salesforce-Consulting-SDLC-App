/**
 * Story Detail Page (D-06)
 *
 * Server component page for viewing a single story.
 * Tabs: Details (read-only display) and QA (test execution table).
 * Back link to parent feature page.
 */

import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { StoryDetailClient } from "./story-detail-client"

interface StoryDetailPageProps {
  params: Promise<{
    projectId: string
    epicId: string
    featureId: string
    storyId: string
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function StoryDetailPage({
  params,
  searchParams,
}: StoryDetailPageProps) {
  const { projectId, epicId, featureId, storyId } = await params
  const search = await searchParams

  const member = await getCurrentMember(projectId)

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      feature: {
        select: { id: true, name: true, prefix: true },
      },
      assignee: {
        select: { id: true, displayName: true, email: true },
      },
      testAssignee: {
        select: { id: true, displayName: true, email: true },
      },
      sprint: {
        select: { id: true, name: true },
      },
      storyComponents: true,
      _count: {
        select: {
          defects: { where: { status: { not: "CLOSED" } } },
          testCases: true,
        },
      },
    },
  })

  if (
    !story ||
    story.projectId !== projectId ||
    story.featureId !== featureId
  ) {
    notFound()
  }

  // Load epics and features for the story edit form
  const [epics, allFeatures] = await Promise.all([
    prisma.epic.findMany({
      where: { projectId },
      select: { id: true, name: true, prefix: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.feature.findMany({
      where: { projectId },
      select: { id: true, name: true, prefix: true, epicId: true },
      orderBy: { sortOrder: "asc" },
    }),
  ])

  const defaultTab =
    typeof search.tab === "string" && search.tab === "qa" ? "qa" : "details"

  return (
    <StoryDetailClient
      projectId={projectId}
      epicId={epicId}
      featureId={featureId}
      story={JSON.parse(JSON.stringify(story))}
      memberRole={member.role}
      defaultTab={defaultTab}
      openDefectCount={story._count.defects}
      epics={epics}
      features={allFeatures}
      userRole={member.role}
    />
  )
}
