"use client"

import { useState, useEffect } from "react"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { applyEnrichmentSuggestion } from "@/actions/enrichment"
import { toast } from "sonner"
import type { EnrichmentCategory } from "@/lib/agent-harness/tools/create-enrichment-suggestion"

export interface EnrichmentSuggestionData {
  suggestionId: string
  category: EnrichmentCategory
  currentValue: string | null
  suggestedValue: string
  reasoning: string
}

type CardState = "pending" | "accepting" | "accepted" | "rejected"

interface EnrichmentSuggestionCardsProps {
  suggestions: EnrichmentSuggestionData[]
  projectId: string
  storyId: string
  onAllResolved?: () => void
}

const CATEGORY_LABELS: Record<EnrichmentCategory, string> = {
  ACCEPTANCE_CRITERIA: "Acceptance Criteria",
  DESCRIPTION: "Description",
  COMPONENTS: "Components",
  TECHNICAL_NOTES: "Technical Notes",
  STORY_POINTS: "Story Points",
  PRIORITY: "Priority",
}

const CATEGORY_COLORS: Record<EnrichmentCategory, string> = {
  ACCEPTANCE_CRITERIA: "bg-blue-50 text-blue-700 border-blue-200",
  DESCRIPTION: "bg-purple-50 text-purple-700 border-purple-200",
  COMPONENTS: "bg-amber-50 text-amber-700 border-amber-200",
  TECHNICAL_NOTES: "bg-teal-50 text-teal-700 border-teal-200",
  STORY_POINTS: "bg-orange-50 text-orange-700 border-orange-200",
  PRIORITY: "bg-red-50 text-red-700 border-red-200",
}

export function EnrichmentSuggestionCards({
  suggestions,
  projectId,
  storyId,
  onAllResolved,
}: EnrichmentSuggestionCardsProps) {
  const [cardStates, setCardStates] = useState<Map<string, CardState>>(
    () => new Map(suggestions.map((s) => [s.suggestionId, "pending"]))
  )

  // Check if all cards are resolved
  useEffect(() => {
    if (suggestions.length === 0) return
    const allResolved = suggestions.every((s) => {
      const state = cardStates.get(s.suggestionId)
      return state === "accepted" || state === "rejected"
    })
    if (allResolved) {
      onAllResolved?.()
    }
  }, [cardStates, suggestions, onAllResolved])

  async function handleAccept(suggestion: EnrichmentSuggestionData) {
    setCardStates((prev) => new Map(prev).set(suggestion.suggestionId, "accepting"))

    try {
      const result = await applyEnrichmentSuggestion({
        projectId,
        storyId,
        category: suggestion.category,
        suggestedValue: suggestion.suggestedValue,
      })

      if (result?.data) {
        setCardStates((prev) => new Map(prev).set(suggestion.suggestionId, "accepted"))
        toast.success(`Applied: ${CATEGORY_LABELS[suggestion.category]}`)
      } else {
        throw new Error("Failed to apply suggestion")
      }
    } catch (err) {
      setCardStates((prev) => new Map(prev).set(suggestion.suggestionId, "pending"))
      toast.error(
        `Failed to apply ${CATEGORY_LABELS[suggestion.category]}: ${err instanceof Error ? err.message : "Unknown error"}`
      )
    }
  }

  function handleReject(suggestionId: string) {
    setCardStates((prev) => new Map(prev).set(suggestionId, "rejected"))
  }

  if (suggestions.length === 0) return null

  return (
    <div className="space-y-3">
      <h4 className="text-[13px] font-medium text-muted-foreground">
        Enrichment Suggestions ({suggestions.length})
      </h4>
      {suggestions.map((suggestion) => {
        const state = cardStates.get(suggestion.suggestionId) ?? "pending"

        if (state === "accepted") {
          return (
            <div
              key={suggestion.suggestionId}
              className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700"
            >
              <Check className="h-3.5 w-3.5" />
              Applied: {CATEGORY_LABELS[suggestion.category]}
            </div>
          )
        }

        if (state === "rejected") {
          return (
            <div
              key={suggestion.suggestionId}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Dismissed: {CATEGORY_LABELS[suggestion.category]}
            </div>
          )
        }

        return (
          <Card key={suggestion.suggestionId} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-2 py-2.5 px-3">
              <Badge
                variant="outline"
                className={CATEGORY_COLORS[suggestion.category]}
              >
                {CATEGORY_LABELS[suggestion.category]}
              </Badge>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                  onClick={() => handleAccept(suggestion)}
                  disabled={state === "accepting"}
                  aria-label="Accept suggestion"
                >
                  {state === "accepting" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive/80"
                  onClick={() => handleReject(suggestion.suggestionId)}
                  disabled={state === "accepting"}
                  aria-label="Reject suggestion"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              {suggestion.currentValue && suggestion.currentValue !== "empty" && (
                <div className="mb-2">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Current
                  </span>
                  <p className="text-[13px] text-muted-foreground line-through whitespace-pre-wrap mt-0.5">
                    {suggestion.currentValue.length > 200
                      ? suggestion.currentValue.substring(0, 200) + "..."
                      : suggestion.currentValue}
                  </p>
                </div>
              )}
              <div className="mb-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Suggested
                </span>
                <p className="text-[13px] text-foreground whitespace-pre-wrap mt-0.5">
                  {suggestion.suggestedValue}
                </p>
              </div>
              <p className="text-[12px] text-muted-foreground italic">
                {suggestion.reasoning}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
