import Link from "next/link"
import { notFound } from "next/navigation"
import { scopedPrisma } from "@/lib/project-scope"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Settings,
  Users,
  Layers,
  LayoutGrid,
  FileText,
  HelpCircle,
  MessageSquare,
} from "lucide-react"

interface ProjectPageProps {
  params: Promise<{ projectId: string }>
}

const ENGAGEMENT_TYPE_LABELS: Record<string, string> = {
  GREENFIELD: "Greenfield",
  BUILD_PHASE: "Build Phase",
  MANAGED_SERVICES: "Managed Services",
  RESCUE_TAKEOVER: "Rescue/Takeover",
}

const PHASE_LABELS: Record<string, string> = {
  DISCOVERY: "Discovery",
  REQUIREMENTS: "Requirements",
  SOLUTION_DESIGN: "Solution Design",
  BUILD: "Build",
  TESTING: "Testing",
  DEPLOYMENT: "Deployment",
  HYPERCARE: "Hypercare",
  ARCHIVE: "Archive",
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params
  const db = scopedPrisma(projectId)

  const project = await db.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    notFound()
  }

  const [memberCount, epicCount, featureCount, storyCount, questionCount, conversationCount] = await Promise.all([
    db.projectMember.count({ where: { projectId, status: "ACTIVE" } }),
    db.epic.count({ where: { projectId } }),
    db.feature.count({ where: { projectId } }),
    db.story.count({ where: { projectId } }),
    db.question.count({ where: { projectId } }),
    db.conversation.count({ where: { projectId } }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-semibold text-foreground">
          {project.name}
        </h1>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${projectId}/settings/team`}>
            <Button variant="outline" size="sm">
              <Users className="mr-1 h-4 w-4" />
              Team
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="mr-1 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[13px] font-semibold text-[#737373]">Client</p>
            <p className="mt-1 text-[14px] text-foreground">
              {project.clientName}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[13px] font-semibold text-[#737373]">
              Engagement Type
            </p>
            <div className="mt-1">
              <Badge variant="outline">
                {ENGAGEMENT_TYPE_LABELS[project.engagementType] ??
                  project.engagementType}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[13px] font-semibold text-[#737373]">
              Current Phase
            </p>
            <div className="mt-1">
              <Badge variant="outline">
                {PHASE_LABELS[project.currentPhase] ?? project.currentPhase}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[13px] font-semibold text-[#737373]">
              Team Members
            </p>
            <p className="mt-1 text-[14px] text-foreground">{memberCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-[13px] font-semibold text-[#737373]">
              Start Date
            </p>
            <p className="mt-1 text-[14px] text-foreground">
              {project.startDate.toLocaleDateString()}
            </p>
            {project.targetEndDate && (
              <>
                <p className="mt-3 text-[13px] font-semibold text-[#737373]">
                  Target End Date
                </p>
                <p className="mt-1 text-[14px] text-foreground">
                  {project.targetEndDate.toLocaleDateString()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Summary */}
      <div className="mt-8">
        <h2 className="text-[16px] font-semibold text-foreground">
          Project Summary
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#737373]" />
                <p className="text-[13px] font-semibold text-[#737373]">
                  Epics
                </p>
              </div>
              <p className="mt-1 text-[14px] text-foreground">{epicCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-[#737373]" />
                <p className="text-[13px] font-semibold text-[#737373]">
                  Features
                </p>
              </div>
              <p className="mt-1 text-[14px] text-foreground">
                {featureCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#737373]" />
                <p className="text-[13px] font-semibold text-[#737373]">
                  Stories
                </p>
              </div>
              <p className="mt-1 text-[14px] text-foreground">{storyCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#737373]" />
                <p className="text-[13px] font-semibold text-[#737373]">
                  Questions
                </p>
              </div>
              <p className="mt-1 text-[14px] text-foreground">
                {questionCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#737373]" />
                <p className="text-[13px] font-semibold text-[#737373]">
                  Conversations
                </p>
              </div>
              <p className="mt-1 text-[14px] text-foreground">
                {conversationCount}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mt-6 flex items-center gap-3">
        <Link href={`/projects/${projectId}/work`}>
          <Button variant="outline" size="sm">
            View Work Items
          </Button>
        </Link>
        <Link href={`/projects/${projectId}/questions`}>
          <Button variant="outline" size="sm">
            View Questions
          </Button>
        </Link>
        <Link href={`/projects/${projectId}/chat`}>
          <Button variant="outline" size="sm">
            View Chat
          </Button>
        </Link>
      </div>
    </div>
  )
}
