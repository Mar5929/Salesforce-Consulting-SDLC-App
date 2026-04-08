"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BriefingOutputProps {
  content: string
}

/**
 * Briefing output wrapper — adds a "Copy Briefing" button.
 * The briefing itself streams as markdown via MessageBubble.
 * This component wraps the final output for easy clipboard copy.
 */
export function BriefingOutput({ content }: BriefingOutputProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!content) return null

  return (
    <div className="flex justify-end px-1 pt-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[12px] text-muted-foreground"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            Copy Briefing
          </>
        )}
      </Button>
    </div>
  )
}
