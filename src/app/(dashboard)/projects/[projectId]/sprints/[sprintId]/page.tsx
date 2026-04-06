/**
 * Sprint Detail Page
 *
 * Server component with three tabs: Plan, Board, Dashboard.
 * Plan tab renders the SprintPlanning split view.
 * Board tab renders the SprintBoard kanban.
 * Dashboard tab renders the SprintDashboard with burndown chart.
 */

import { notFound } from "next/navigation"
import { format } from "date-fns"
import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SprintPlanning, type PlanningStory } from "@/components/sprints/sprint-planning"
import { SprintBoard, type BoardStory } from "@/components/sprints/sprint-board"
import { SprintDashboard } from "@/components/sprints/sprint-dashboard"

interface SprintDetailPageProps {
  params: Promise<{ projectId: string; sprintId: string }>
}

const STATUS_STYLES: Record<string, string> = {
  PLANNING: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  ACTIVE: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  COMPLETE: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
}

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  COMPLETE: "Complete",
}

export default async function SprintDetailPage({
  params,
}: SprintDetailPageProps) {
  const { projectId, sprintId } = await params

  await getCurrentMember(projectId)

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      stories: {
        include: {
          storyComponents: true,
          assignee: { select: { id: true, displayName: true, email: true } },
          feature: { select: { id: true, name: true, prefix: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!sprint || sprint.projectId !== projectId) {
    notFound()
  }

  // Fetch backlog stories (unassigned to any sprint)
  const db = scopedPrisma(projectId)
  const backlogStories = await db.story.findMany({
    where: { projectId, sprintId: null },
    include: {
      assignee: { select: { id: true, displayName: true, email: true } },
      feature: { select: { id: true, name: true, prefix: true } },
    },
    orderBy: { sortOrder: "asc" },
  })

  // Serialize for client components
  const sprintStories: PlanningStory[] = sprint.stories.map((s) => ({
    id: s.id,
    displayId: s.displayId,
    title: s.title,
    status: s.status,
    priority: s.priority,
    storyPoints: s.storyPoints,
    feature: s.feature,
    assignee: s.assignee,
  }))

  const boardStories: BoardStory[] = sprint.stories.map((s) => ({
    id: s.id,
    displayId: s.displayId,
    title: s.title,
    status: s.status,
    priority: s.priority,
    storyPoints: s.storyPoints,
    feature: s.feature,
    assignee: s.assignee,
  }))

  const backlog: PlanningStory[] = backlogStories.map((s) => ({
    id: s.id,
    displayId: s.displayId,
    title: s.title,
    status: s.status,
    priority: s.priority,
    storyPoints: s.storyPoints,
    feature: s.feature,
    assignee: s.assignee,
  }))

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight">
            {sprint.name}
          </h1>
          <Badge
            variant="outline"
            className={STATUS_STYLES[sprint.status]}
          >
            {STATUS_LABELS[sprint.status] ?? sprint.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-[13px] text-[#737373]">
          <span>
            {format(new Date(sprint.startDate), "MMM d, yyyy")} &ndash;{" "}
            {format(new Date(sprint.endDate), "MMM d, yyyy")}
          </span>
          {sprint.goal && (
            <span className="text-[#525252]">{sprint.goal}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plan">
        <TabsList>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="mt-4">
          <SprintPlanning
            projectId={projectId}
            sprintId={sprintId}
            sprintName={sprint.name}
            backlogStories={backlog}
            sprintStories={sprintStories}
          />
        </TabsContent>

        <TabsContent value="board" className="mt-4">
          <SprintBoard stories={boardStories} projectId={projectId} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <SprintDashboard
            sprint={{
              name: sprint.name,
              goal: sprint.goal,
              startDate: sprint.startDate,
              endDate: sprint.endDate,
              stories: sprint.stories.map((s) => ({
                id: s.id,
                status: s.status,
                storyPoints: s.storyPoints,
                updatedAt: s.updatedAt,
              })),
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
