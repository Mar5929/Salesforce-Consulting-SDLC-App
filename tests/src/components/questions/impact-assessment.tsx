"use client"

/**
 * Impact Assessment Component (D-04)
 *
 * Collapsible component rendered below the answer section on question detail.
 * Shows badges for unblocked items, contradictions, and new questions.
 * Expandable detail for each impact item.
 */

import { useState } from "react"
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface ImpactItem {
  type: string
  id?: string
  displayId?: string
  title?: string
  description?: string
}

interface ConflictItem {
  type: string
  severity: string
  description: string
  conflictingEntityId?: string | null
  detectedAt?: string
}

interface ImpactAssessmentData {
  unblockedItems?: ImpactItem[]
  contradictions?: ConflictItem[]
  conflicts?: ConflictItem[]
  newQuestionsRaised?: ImpactItem[]
  scopeImpact?: string
  summary?: string
  previousContent?: string
}

interface ImpactAssessmentProps {
  /** Raw JSON string from question.impactAssessment field */
  data: string | null
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function ImpactAssessment({ data }: ImpactAssessmentProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!data) return null

  let parsed: ImpactAssessmentData
  try {
    parsed = JSON.parse(data) as ImpactAssessmentData
  } catch {
    // If it's plain text (not JSON), display as summary
    return (
      <div className="mt-4 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-4">
        <p className="text-[13px] font-semibold text-[#737373]">Impact Assessment</p>
        <p className="mt-2 text-[14px] text-foreground whitespace-pre-wrap">{data}</p>
      </div>
    )
  }

  const unblockedCount = parsed.unblockedItems?.length ?? 0
  const allConflicts = [...(parsed.contradictions ?? []), ...(parsed.conflicts ?? [])]
  const conflictCount = allConflicts.length
  const newQuestionsCount = parsed.newQuestionsRaised?.length ?? 0
  const hasSummary = !!parsed.summary || !!parsed.previousContent
  const hasContent = unblockedCount > 0 || conflictCount > 0 || newQuestionsCount > 0 || hasSummary

  if (!hasContent) return null

  return (
    <div className="mt-4 rounded-lg border border-[#E5E5E5]">
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-[#737373]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#737373]" />
          )}
          <span className="text-[13px] font-semibold text-foreground">
            Impact Assessment
          </span>
        </div>

        <div className="flex items-center gap-2">
          {unblockedCount > 0 && (
            <Badge variant="outline" className="bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0] text-[11px]">
              <CheckCircle className="mr-1 h-3 w-3" />
              {unblockedCount} unblocked
            </Badge>
          )}
          {conflictCount > 0 && (
            <Badge variant="outline" className="bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] text-[11px]">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {conflictCount} contradiction{conflictCount !== 1 ? "s" : ""}
            </Badge>
          )}
          {newQuestionsCount > 0 && (
            <Badge variant="outline" className="bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] text-[11px]">
              <HelpCircle className="mr-1 h-3 w-3" />
              {newQuestionsCount} new question{newQuestionsCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </button>

      {/* Expandable detail */}
      {isOpen && (
        <div className="border-t border-[#E5E5E5] px-4 py-3">
          {/* Summary */}
          {parsed.summary && (
            <div className="mb-3">
              <p className="text-[14px] text-foreground whitespace-pre-wrap">
                {parsed.summary}
              </p>
            </div>
          )}

          {/* Scope impact */}
          {parsed.scopeImpact && (
            <div className="mb-3">
              <span className="text-[13px] font-semibold text-[#737373]">Scope Impact: </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  parsed.scopeImpact === "major" && "bg-[#FEF2F2] text-[#DC2626]",
                  parsed.scopeImpact === "moderate" && "bg-[#FFF7ED] text-[#EA580C]",
                  parsed.scopeImpact === "minor" && "bg-[#EFF6FF] text-[#2563EB]",
                  parsed.scopeImpact === "none" && "bg-[#F5F5F5] text-[#737373]"
                )}
              >
                {parsed.scopeImpact}
              </Badge>
            </div>
          )}

          {/* Unblocked items */}
          {unblockedCount > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-[13px] font-semibold text-[#737373]">
                Unblocked Items
              </p>
              <ul className="flex flex-col gap-1">
                {parsed.unblockedItems!.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px]">
                    <CheckCircle className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>
                      {item.displayId && (
                        <span className="font-mono text-[#737373]">{item.displayId} </span>
                      )}
                      {item.title || item.description || item.type}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contradictions / Conflicts */}
          {conflictCount > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-[13px] font-semibold text-[#737373]">
                Contradictions
              </p>
              <ul className="flex flex-col gap-1">
                {allConflicts.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#DC2626]" />
                    <div>
                      <span className="text-foreground">{item.description}</span>
                      {item.severity && (
                        <Badge variant="outline" className="ml-1.5 text-[10px]">
                          {item.severity}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* New questions raised */}
          {newQuestionsCount > 0 && (
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-[#737373]">
                New Questions Raised
              </p>
              <ul className="flex flex-col gap-1">
                {parsed.newQuestionsRaised!.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px]">
                    <HelpCircle className="h-3.5 w-3.5 text-[#2563EB]" />
                    <span>{item.title || item.description || "New question"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fallback: previousContent */}
          {parsed.previousContent && !parsed.summary && (
            <p className="text-[14px] text-foreground whitespace-pre-wrap">
              {parsed.previousContent}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
