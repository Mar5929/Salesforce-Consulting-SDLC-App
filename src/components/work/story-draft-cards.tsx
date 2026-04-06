"use client"

/**
 * Story Draft Review Cards (D-07)
 *
 * Renders AI-generated story drafts with accept/edit/reject actions.
 * Follows the extraction-cards.tsx pattern from transcript processing.
 *
 * - Accept: Calls createStory + addStoryComponent server actions to persist
 * - Edit: Opens StoryForm slide-over with fields pre-populated
 * - Reject: Removes the card from UI (no DB action since drafts aren't persisted)
 *
 * Threat mitigations:
 * - T-03-08: Drafts only persisted when user explicitly accepts
 * - T-03-10: addStoryComponent uses scopedPrisma for project isolation
 */

import { useState, useCallback } from "react"
import {
  Check,
  X,
  Pencil,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAction } from "next-safe-action/hooks"
import { createStory, addStoryComponent } from "@/actions/stories"
import type { StoryDraft } from "@/lib/agent-harness/tools/create-story-draft"

// ============================================================================
// Types
// ============================================================================

interface StoryDraftCardsProps {
  drafts: StoryDraft[]
  projectId: string
  epicId: string
  featureId?: string | null
  /** Called after a draft is accepted to refresh data */
  onAccepted?: (draftId: string, storyId: string) => void
}

type DraftStatus = "pending" | "accepted" | "rejected" | "accepting"

// ============================================================================
// Priority Styles
// ============================================================================

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
  MEDIUM: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  HIGH: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",
  CRITICAL: "bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]",
}

const IMPACT_STYLES: Record<string, string> = {
  CREATE: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  MODIFY: "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]",
  DELETE: "bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]",
}

// ============================================================================
// Component
// ============================================================================

/**
 * Renders a list of AI-generated story drafts with accept/edit/reject actions.
 */
export function StoryDraftCards({
  drafts,
  projectId,
  epicId,
  featureId,
  onAccepted,
}: StoryDraftCardsProps) {
  if (drafts.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
        <h3 className="text-[14px] font-semibold text-foreground">
          Generated Story Drafts ({drafts.length})
        </h3>
      </div>

      <div className="space-y-2">
        {drafts.map((draft) => (
          <StoryDraftCard
            key={draft.draftId}
            draft={draft}
            projectId={projectId}
            epicId={epicId}
            featureId={featureId}
            onAccepted={onAccepted}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Individual Draft Card
// ============================================================================

interface StoryDraftCardProps {
  draft: StoryDraft
  projectId: string
  epicId: string
  featureId?: string | null
  onAccepted?: (draftId: string, storyId: string) => void
}

function StoryDraftCard({
  draft,
  projectId,
  epicId,
  featureId,
  onAccepted,
}: StoryDraftCardProps) {
  const [status, setStatus] = useState<DraftStatus>("pending")
  const [reasoningExpanded, setReasoningExpanded] = useState(false)

  const createStoryAction = useAction(createStory)
  const addComponentAction = useAction(addStoryComponent)

  const handleAccept = useCallback(async () => {
    setStatus("accepting")
    try {
      // Create the story via server action
      const result = await createStoryAction.executeAsync({
        projectId,
        epicId,
        featureId: featureId ?? undefined,
        title: draft.title,
        persona: draft.persona ?? undefined,
        description: draft.description,
        acceptanceCriteria: draft.acceptanceCriteria,
        storyPoints: draft.storyPoints ?? undefined,
        priority: draft.priority,
      })

      if (!result?.data?.story) {
        throw new Error("Failed to create story")
      }

      const storyId = result.data.story.id

      // Add components if any (T-03-10: dedup handled by addStoryComponent)
      if (draft.components && draft.components.length > 0) {
        await Promise.all(
          draft.components.map((comp) =>
            addComponentAction.executeAsync({
              projectId,
              storyId,
              componentName: comp.componentName,
              impactType: comp.impactType,
            })
          )
        )
      }

      setStatus("accepted")
      toast.success(`Story "${draft.title}" created`)
      onAccepted?.(draft.draftId, storyId)
    } catch (error) {
      setStatus("pending")
      toast.error(
        `Failed to create story: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }, [
    draft,
    projectId,
    epicId,
    featureId,
    createStoryAction,
    addComponentAction,
    onAccepted,
  ])

  const handleReject = useCallback(() => {
    setStatus("rejected")
  }, [])

  const isResolved = status === "accepted" || status === "rejected"

  return (
    <Card
      className={cn(
        "transition-opacity",
        isResolved && "opacity-60"
      )}
    >
      <CardContent className="p-4">
        {/* Header: title + priority + points */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-[14px] font-semibold text-foreground">
                {draft.title}
              </h4>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 text-[11px]",
                  PRIORITY_STYLES[draft.priority] ?? PRIORITY_STYLES.MEDIUM
                )}
              >
                {draft.priority}
              </Badge>
              {draft.storyPoints != null && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-[#DDD6FE] bg-[#F5F3FF] text-[11px] text-[#7C3AED]"
                >
                  <Zap className="mr-0.5 h-3 w-3" />
                  {draft.storyPoints} pts
                </Badge>
              )}
            </div>

            {/* Persona */}
            {draft.persona && (
              <p className="mt-1 text-[13px] text-muted-foreground">
                As a {draft.persona}...
              </p>
            )}

            {/* Description */}
            <p className="mt-2 text-[14px] text-foreground">{draft.description}</p>

            {/* Acceptance Criteria */}
            <div className="mt-3 rounded-md border bg-muted/40 p-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Acceptance Criteria
              </p>
              <pre className="whitespace-pre-wrap text-[13px] text-foreground">
                {draft.acceptanceCriteria}
              </pre>
            </div>

            {/* Components */}
            {draft.components && draft.components.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {draft.components.map((comp, idx) => (
                  <Badge
                    key={`${comp.componentName}-${idx}`}
                    variant="outline"
                    className={cn(
                      "text-[11px]",
                      IMPACT_STYLES[comp.impactType] ?? IMPACT_STYLES.MODIFY
                    )}
                  >
                    {comp.componentName} ({comp.impactType})
                  </Badge>
                ))}
              </div>
            )}

            {/* AI Reasoning (collapsible) */}
            {draft.reasoning && (
              <div className="mt-3">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
                  onClick={() => setReasoningExpanded((prev) => !prev)}
                >
                  {reasoningExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  AI Reasoning
                </button>
                {reasoningExpanded && (
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {draft.reasoning}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {status === "pending" && (
            <div className="flex shrink-0 gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-[#059669] hover:bg-[#ECFDF5] hover:text-[#059669]"
                onClick={handleAccept}
                title="Accept"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                onClick={handleReject}
                title="Reject"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {status === "accepting" && (
            <Badge
              variant="outline"
              className="shrink-0 animate-pulse border-[#BFDBFE] bg-[#EFF6FF] text-[11px] text-[#2563EB]"
            >
              Creating...
            </Badge>
          )}

          {status === "accepted" && (
            <Badge
              variant="outline"
              className="shrink-0 border-[#A7F3D0] bg-[#ECFDF5] text-[11px] text-[#059669]"
            >
              Accepted
            </Badge>
          )}

          {status === "rejected" && (
            <Badge
              variant="outline"
              className="shrink-0 border-[#FCA5A5] bg-[#FEF2F2] text-[11px] text-[#DC2626]"
            >
              Rejected
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
