"use client"

/**
 * Conflict Banner Component
 *
 * Displays component-level conflict warnings detected by sprint intelligence.
 * Expandable banner with severity-colored conflict cards.
 *
 * Per D-16: Shows conflicts as advisory warnings
 * Per D-17: Dismiss is client-side only (not persisted) for V1
 */

import { useState } from "react"
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Conflict {
  id: string
  storyA: { displayId: string; title: string }
  storyB: { displayId: string; title: string }
  componentName: string
  impactA: string
  impactB: string
  severity: string
  reasoning: string
  dismissed: boolean
}

interface ConflictBannerProps {
  conflicts: Conflict[]
  onDismiss?: (conflictId: string) => void
}

const severityColor: Record<string, string> = {
  HIGH: "bg-red-50 border-red-200 text-red-800",
  MEDIUM: "bg-yellow-50 border-yellow-200 text-yellow-800",
  LOW: "bg-blue-50 border-blue-200 text-blue-800",
}

export function ConflictBanner({ conflicts, onDismiss }: ConflictBannerProps) {
  const [expanded, setExpanded] = useState(false)
  const activeConflicts = conflicts.filter((c) => !c.dismissed)

  if (activeConflicts.length === 0) return null

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 mb-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            {activeConflicts.length} component conflict
            {activeConflicts.length > 1 ? "s" : ""} detected
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </div>
      {expanded && (
        <div className="mt-3 space-y-2">
          {activeConflicts.map((conflict) => (
            <div
              key={conflict.id}
              className={`flex items-start justify-between rounded-md border p-2 text-xs ${severityColor[conflict.severity] || severityColor.MEDIUM}`}
            >
              <div>
                <div className="font-medium">
                  {conflict.storyA.displayId} &amp;{" "}
                  {conflict.storyB.displayId} overlap on &ldquo;
                  {conflict.componentName}&rdquo;
                </div>
                <div className="mt-0.5 text-muted-foreground">
                  {conflict.reasoning}
                </div>
                <Badge variant="outline" className="mt-1">
                  {conflict.severity}
                </Badge>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDismiss(conflict.id)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
