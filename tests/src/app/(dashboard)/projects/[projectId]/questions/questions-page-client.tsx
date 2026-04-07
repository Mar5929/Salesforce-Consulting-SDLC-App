"use client"

/**
 * Questions Page Client Component
 *
 * Handles view toggle between Table (default) and Kanban.
 * Renders the "Ask Question" button and view components.
 */

import { useState } from "react"
import { LayoutList, Kanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { QuestionForm } from "@/components/questions/question-form"
import { QuestionTable } from "@/components/questions/question-table"
import { QuestionKanban } from "@/components/questions/question-kanban"

type ViewMode = "table" | "kanban"

interface QuestionRow {
  id: string
  displayId: string
  questionText: string
  scope: string
  priority: string
  category?: string
  status: string
  needsReview: boolean
  createdAt: string | Date
  owner?: { id: string; displayName: string; email: string } | null
  scopeEpic?: { id: string; name: string; prefix: string } | null
  scopeFeature?: { id: string; name: string; prefix: string } | null
}

interface QuestionsPageClientProps {
  projectId: string
  questions: QuestionRow[]
  epics: Array<{ id: string; name: string; prefix: string }>
  features: Array<{ id: string; name: string; prefix: string }>
  teamMembers: Array<{ id: string; displayName: string; email: string }>
  reviewCount: number
  currentMemberRole: string
}

export function QuestionsPageClient({
  projectId,
  questions,
  epics,
  features,
  teamMembers,
  reviewCount,
  currentMemberRole,
}: QuestionsPageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-semibold text-foreground">Questions</h1>
          {reviewCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFF7ED] px-1.5 text-[11px] font-medium text-[#EA580C] border border-[#FED7AA]">
              {reviewCount} needs review
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-[#E5E5E5]">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-l-lg px-3 text-[13px] transition-colors",
                viewMode === "table"
                  ? "bg-[#2563EB] text-white"
                  : "text-[#737373] hover:bg-[#F0F0F0]"
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-r-lg px-3 text-[13px] transition-colors",
                viewMode === "kanban"
                  ? "bg-[#2563EB] text-white"
                  : "text-[#737373] hover:bg-[#F0F0F0]"
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </button>
          </div>

          <QuestionForm
            projectId={projectId}
            epics={epics}
            features={features}
            teamMembers={teamMembers}
          />
        </div>
      </div>

      {/* View content */}
      {viewMode === "table" ? (
        <QuestionTable questions={questions} projectId={projectId} />
      ) : (
        <QuestionKanban questions={questions} projectId={projectId} />
      )}
    </div>
  )
}
