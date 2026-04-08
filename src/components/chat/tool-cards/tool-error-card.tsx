"use client"

import { AlertCircle } from "lucide-react"
import { ToolResultCard } from "./tool-result-card"

interface ToolErrorCardProps {
  error: string
  toolName?: string
}

export function ToolErrorCard({ error, toolName }: ToolErrorCardProps) {
  return (
    <ToolResultCard
      className="bg-destructive/5 border-destructive/20"
      aria-label={`${toolName ?? "Tool"} error`}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
        <p className="text-[14px] text-foreground">{error}</p>
      </div>
    </ToolResultCard>
  )
}
