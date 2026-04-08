"use client"

import { Loader2 } from "lucide-react"
import { getToolDisplayName } from "../tool-part-renderer"

interface ToolLoadingIndicatorProps {
  toolName: string
}

export function ToolLoadingIndicator({ toolName }: ToolLoadingIndicatorProps) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 py-2">
      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      <span className="text-[13px] text-muted-foreground">
        {getToolDisplayName(toolName)}...
      </span>
    </div>
  )
}
