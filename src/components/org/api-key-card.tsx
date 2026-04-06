"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ApiKeyCardProps {
  rawKey: string
  onDismiss: () => void
}

/**
 * One-time API key display card.
 *
 * Shows the raw key in monospace with copy-to-clipboard.
 * Warning: key is never shown again after dismissal (T-04-18).
 *
 * Per UI-SPEC: --muted background, 13px monospace, Copy icon button,
 * warning text below.
 */
export function ApiKeyCard({ rawKey, onDismiss }: ApiKeyCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-muted">
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <code
            className="flex-1 break-all rounded bg-background px-3 py-2 text-[13px] font-normal"
            style={{
              fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
            }}
          >
            {rawKey}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy API key to clipboard"
          >
            {copied ? (
              <Check className="size-4 text-green-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>

        <p className="text-[13px] font-normal text-muted-foreground">
          Copy this key now. It will not be shown again.
        </p>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
