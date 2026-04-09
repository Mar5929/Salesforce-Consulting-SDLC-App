"use client"

/**
 * Story Detail Client Component (D-06)
 *
 * Renders story detail view with Details and QA tabs.
 * Details tab: read-only story information.
 * QA tab: test execution table with defect creation.
 */

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, Loader2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { formatEnumLabel } from "@/lib/format-enum"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TestExecutionTable } from "@/components/qa/test-execution-table"
import { DefectCreateSheet } from "@/components/defects/defect-create-sheet"
import { initiateEnrichmentSession } from "@/actions/conversations"
import { toast } from "sonner"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface StoryData {
  id: string
  displayId: string
  title: string
  description: string | null
  acceptanceCriteria: string | null
  persona: string | null
  dependencies: string | null
  notes: string | null
  status: string
  priority: string
  storyPoints: number | null
  createdAt: string
  updatedAt: string
  feature: { id: string; name: string; prefix: string } | null
  assignee: { id: string; displayName: string; email: string } | null
  testAssignee: { id: string; displayName: string; email: string } | null
  sprint: { id: string; name: string } | null
  storyComponents: Array<{
    id: string
    componentName: string
    impactType: string
  }>
}

interface StoryDetailClientProps {
  projectId: string
  epicId: string
  featureId: string
  story: StoryData
  memberRole: string
  defaultTab: string
  openDefectCount: number
}

// ────────────────────────────────────────────
// Status & priority badge styles
// ────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
  READY: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  SPRINT_PLANNED: "bg-[#F5F3FF] text-[#8B5CF6] border-[#DDD6FE]",
  IN_PROGRESS: "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]",
  IN_REVIEW: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",
  QA: "bg-[#FDF2F8] text-[#EC4899] border-[#FBCFE8]",
  DONE: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  SPRINT_PLANNED: "Sprint Planned",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  QA: "QA",
  DONE: "Done",
}

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  HIGH: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",
  MEDIUM: "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]",
  LOW: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function StoryDetailClient({
  projectId,
  epicId,
  featureId,
  story,
  memberRole,
  defaultTab,
  openDefectCount,
}: StoryDetailClientProps) {
  const router = useRouter()
  const [defectSheetOpen, setDefectSheetOpen] = useState(false)
  const [enrichLoading, setEnrichLoading] = useState(false)
  const [defectPrefill, setDefectPrefill] = useState<{
    storyId?: string
    testCaseId?: string
    title?: string
  }>({})

  const backHref = `/projects/${projectId}/work/${epicId}/${featureId}`

  async function handleEnrichWithAI() {
    setEnrichLoading(true)
    try {
      const result = await initiateEnrichmentSession({ projectId, storyId: story.id })
      if (result?.data?.conversationId) {
        router.push(`/projects/${projectId}/chat/${result.data.conversationId}`)
      } else {
        toast.error("Failed to create enrichment session")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create enrichment session")
    } finally {
      setEnrichLoading(false)
    }
  }

  function handleCreateDefectFromTest(testCase: {
    id: string
    title: string
  }) {
    setDefectPrefill({
      storyId: story.id,
      testCaseId: testCase.id,
      title: `[${story.displayId}] ${testCase.title} - Failed`,
    })
    setDefectSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Link
        href={backHref}
        className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {story.feature?.name ?? "Feature"}
      </Link>

      {/* Title and metadata */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[24px] font-semibold text-foreground">
            <span className="mr-2 font-mono text-[18px] text-muted-foreground">
              {story.displayId}
            </span>
            {story.title}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnrichWithAI}
            disabled={enrichLoading}
            className="shrink-0 gap-1.5"
          >
            {enrichLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Enrich with AI
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={STATUS_STYLES[story.status]}
          >
            {STATUS_LABELS[story.status] ?? story.status}
          </Badge>
          <Badge
            variant="outline"
            className={PRIORITY_STYLES[story.priority]}
          >
            {formatEnumLabel(story.priority)}
          </Badge>
          {story.assignee && (
            <span className="text-[13px] text-muted-foreground">
              Assigned to {story.assignee.displayName || story.assignee.email}
            </span>
          )}
          {story.testAssignee && (
            <span className="text-[13px] text-muted-foreground">
              QA: {story.testAssignee.displayName || story.testAssignee.email}
            </span>
          )}
          {story.sprint && (
            <span className="text-[13px] text-muted-foreground">
              {story.sprint.name}
            </span>
          )}
          {story.storyPoints !== null && (
            <span className="text-[13px] text-muted-foreground">
              {story.storyPoints} pts
            </span>
          )}
          {story.feature && (
            <span className="text-[13px] text-muted-foreground">
              Feature: {story.feature.prefix} {story.feature.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created {format(new Date(story.createdAt), "MMM d, yyyy")}
          </span>
          {story.createdAt !== story.updatedAt && (
            <span>
              Updated {format(new Date(story.updatedAt), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="qa" className="gap-1.5">
            QA
            {openDefectCount > 0 && (
              <Badge
                variant="outline"
                className="ml-1 h-5 min-w-[20px] px-1.5 text-[11px] bg-red-50 text-red-600 border-red-200"
              >
                {openDefectCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          <div className="flex flex-col gap-6">
            {/* Description */}
            {story.description && (
              <div>
                <h3 className="text-[14px] font-medium text-foreground mb-1">
                  Description
                </h3>
                <p className="text-[14px] text-muted-foreground whitespace-pre-wrap">
                  {story.description}
                </p>
              </div>
            )}

            {/* Acceptance Criteria */}
            {story.acceptanceCriteria && (
              <div>
                <h3 className="text-[14px] font-medium text-foreground mb-1">
                  Acceptance Criteria
                </h3>
                <p className="text-[14px] text-muted-foreground whitespace-pre-wrap">
                  {story.acceptanceCriteria}
                </p>
              </div>
            )}

            {/* Persona */}
            {story.persona && (
              <div>
                <h3 className="text-[14px] font-medium text-foreground mb-1">
                  Persona
                </h3>
                <p className="text-[14px] text-muted-foreground">
                  {story.persona}
                </p>
              </div>
            )}

            {/* Dependencies */}
            {story.dependencies && (
              <div>
                <h3 className="text-[14px] font-medium text-foreground mb-1">
                  Dependencies
                </h3>
                <p className="text-[14px] text-muted-foreground whitespace-pre-wrap">
                  {story.dependencies}
                </p>
              </div>
            )}

            {/* Notes */}
            {story.notes && (
              <div>
                <h3 className="text-[14px] font-medium text-foreground mb-1">
                  Notes
                </h3>
                <p className="text-[14px] text-muted-foreground whitespace-pre-wrap">
                  {story.notes}
                </p>
              </div>
            )}

            {/* Impacted Components */}
            {story.storyComponents.length > 0 && (
              <div>
                <h3 className="text-[14px] font-medium text-foreground mb-1">
                  Impacted Components
                </h3>
                <div className="flex flex-wrap gap-2">
                  {story.storyComponents.map((sc) => (
                    <Badge key={sc.id} variant="outline" className="text-[12px]">
                      {sc.componentName}{" "}
                      <span className="text-muted-foreground ml-1">
                        ({sc.impactType})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* QA Tab */}
        <TabsContent value="qa" className="mt-4">
          <TestExecutionTable
            storyId={story.id}
            projectId={projectId}
            memberRole={memberRole}
            onCreateDefectFromTest={handleCreateDefectFromTest}
          />
        </TabsContent>
      </Tabs>

      {/* Defect creation sheet (shared, opened from QA tab) */}
      <DefectCreateSheet
        projectId={projectId}
        open={defectSheetOpen}
        onOpenChange={setDefectSheetOpen}
        onCreated={() => setDefectSheetOpen(false)}
        prefill={defectPrefill}
      />
    </div>
  )
}
