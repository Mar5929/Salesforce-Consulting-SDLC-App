"use client"

import { useState, useCallback } from "react"
import {
  CircleHelp,
  Scale,
  ShieldAlert,
  FileCheck,
  Check,
  X,
  Pencil,
  GitMerge,
  SkipForward,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

export interface ExtractionItem {
  id?: string
  displayId?: string
  text: string
  duplicate?: boolean
  existingDisplayId?: string
}

export interface ExtractionGroup {
  type: "question" | "decision" | "requirement" | "risk"
  items: ExtractionItem[]
}

interface ExtractionCardsProps {
  groups: ExtractionGroup[]
  onAccept?: (type: string, itemId: string) => void
  onReject?: (type: string, itemId: string) => void
  onEdit?: (type: string, itemId: string, newText: string) => void
  onMerge?: (type: string, existingDisplayId: string) => void
  onSkip?: (type: string, existingDisplayId: string) => void
}

// ============================================================================
// Constants
// ============================================================================

const TYPE_CONFIG: Record<
  string,
  { label: string; pluralLabel: string; icon: typeof CircleHelp; color: string; badgeClass: string }
> = {
  question: {
    label: "Question",
    pluralLabel: "Questions",
    icon: CircleHelp,
    color: "text-[#2563EB]",
    badgeClass: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  },
  decision: {
    label: "Decision",
    pluralLabel: "Decisions",
    icon: Scale,
    color: "text-[#7C3AED]",
    badgeClass: "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]",
  },
  requirement: {
    label: "Requirement",
    pluralLabel: "Requirements",
    icon: FileCheck,
    color: "text-[#059669]",
    badgeClass: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
  },
  risk: {
    label: "Risk",
    pluralLabel: "Risks",
    icon: ShieldAlert,
    color: "text-[#DC2626]",
    badgeClass: "bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]",
  },
}

// ============================================================================
// Component
// ============================================================================

/**
 * Renders extraction results grouped by type with accept/reject/edit actions (D-09, D-10).
 *
 * - Groups: Questions, Decisions, Requirements, Risks
 * - Each card has type icon, content, and action buttons
 * - Duplicate items show "Similar to existing Q-14" with Merge/Skip (D-10)
 */
export function ExtractionCards({
  groups,
  onAccept,
  onReject,
  onEdit,
  onMerge,
  onSkip,
}: ExtractionCardsProps) {
  if (groups.length === 0) return null

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const config = TYPE_CONFIG[group.type]
        if (!config) return null

        return (
          <div key={group.type} className="space-y-3">
            {/* Group header */}
            <div className="flex items-center gap-2">
              <config.icon className={cn("h-4 w-4", config.color)} />
              <h3 className="text-[14px] font-semibold text-foreground">
                {config.pluralLabel} ({group.items.length})
              </h3>
            </div>

            {/* Item cards */}
            <div className="space-y-2">
              {group.items.map((item, index) => (
                <ExtractionItemCard
                  key={item.id ?? `${group.type}-${index}`}
                  item={item}
                  type={group.type}
                  config={config}
                  onAccept={onAccept}
                  onReject={onReject}
                  onEdit={onEdit}
                  onMerge={onMerge}
                  onSkip={onSkip}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Item Card
// ============================================================================

interface ExtractionItemCardProps {
  item: ExtractionItem
  type: string
  config: (typeof TYPE_CONFIG)[string]
  onAccept?: (type: string, itemId: string) => void
  onReject?: (type: string, itemId: string) => void
  onEdit?: (type: string, itemId: string, newText: string) => void
  onMerge?: (type: string, existingDisplayId: string) => void
  onSkip?: (type: string, existingDisplayId: string) => void
}

function ExtractionItemCard({
  item,
  type,
  config,
  onAccept,
  onReject,
  onEdit,
  onMerge,
  onSkip,
}: ExtractionItemCardProps) {
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected" | "editing">("pending")
  const [editText, setEditText] = useState(item.text)

  const handleAccept = useCallback(() => {
    setStatus("accepted")
    if (item.id) onAccept?.(type, item.id)
  }, [item.id, type, onAccept])

  const handleReject = useCallback(() => {
    setStatus("rejected")
    if (item.id) onReject?.(type, item.id)
  }, [item.id, type, onReject])

  const handleEdit = useCallback(() => {
    setStatus("editing")
  }, [])

  const handleSaveEdit = useCallback(() => {
    setStatus("accepted")
    if (item.id) onEdit?.(type, item.id, editText)
  }, [item.id, type, editText, onEdit])

  const handleCancelEdit = useCallback(() => {
    setStatus("pending")
    setEditText(item.text)
  }, [item.text])

  const handleMerge = useCallback(() => {
    if (item.existingDisplayId) onMerge?.(type, item.existingDisplayId)
  }, [item.existingDisplayId, type, onMerge])

  const handleSkip = useCallback(() => {
    setStatus("rejected")
    if (item.existingDisplayId) onSkip?.(type, item.existingDisplayId)
  }, [item.existingDisplayId, type, onSkip])

  const isResolved = status === "accepted" || status === "rejected"

  return (
    <Card
      className={cn(
        "transition-opacity",
        isResolved && "opacity-60"
      )}
    >
      <CardContent className="p-3">
        {/* Duplicate warning (D-10) */}
        {item.duplicate && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-[#FFF7ED] p-2 text-[13px] text-[#EA580C]">
            <span>
              Similar to existing{" "}
              <span className="font-medium">{item.existingDisplayId}</span>
            </span>
            <div className="ml-auto flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 text-[11px]"
                onClick={handleMerge}
                disabled={isResolved}
              >
                <GitMerge className="h-3 w-3" />
                Merge
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 text-[11px]"
                onClick={handleSkip}
                disabled={isResolved}
              >
                <SkipForward className="h-3 w-3" />
                Skip
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Display ID badge */}
          {item.displayId && (
            <Badge
              variant="outline"
              className={cn("shrink-0 text-[11px]", config.badgeClass)}
            >
              {item.displayId}
            </Badge>
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            {status === "editing" ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[60px] text-[14px]"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 bg-[#2563EB] text-[12px] text-white hover:bg-[#1d4ed8]"
                    onClick={handleSaveEdit}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[12px]"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-[14px] font-normal text-foreground">{item.text}</p>
            )}
          </div>

          {/* Action buttons */}
          {!item.duplicate && status === "pending" && (
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
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:bg-[#F0F0F0]"
                onClick={handleEdit}
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Status indicator */}
          {status === "accepted" && (
            <Badge variant="outline" className="shrink-0 border-[#A7F3D0] bg-[#ECFDF5] text-[11px] text-[#059669]">
              Accepted
            </Badge>
          )}
          {status === "rejected" && (
            <Badge variant="outline" className="shrink-0 border-[#FCA5A5] bg-[#FEF2F2] text-[11px] text-[#DC2626]">
              Rejected
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
