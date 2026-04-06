"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MessageBubble } from "@/components/chat/message-bubble"
import { ExtractionCards, type ExtractionGroup } from "@/components/transcripts/extraction-cards"
import { ScrollArea } from "@/components/ui/scroll-area"

// ============================================================================
// Types
// ============================================================================

interface TranscriptMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
  toolCalls: Record<string, unknown> | null
  inputTokens: number | null
  outputTokens: number | null
  cost: number | null
}

interface TranscriptSessionClientProps {
  projectId: string
  transcriptId: string
  transcriptTitle: string
  processingStatus: string
  conversationId?: string
  initialMessages: TranscriptMessage[]
}

// ============================================================================
// Status config
// ============================================================================

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Loader2; color: string }> = {
  PENDING: { label: "Pending", icon: Loader2, color: "text-[#EA580C]" },
  PROCESSING: { label: "Processing", icon: Loader2, color: "text-[#2563EB]" },
  COMPLETE: { label: "Complete", icon: CheckCircle, color: "text-[#059669]" },
  FAILED: { label: "Failed", icon: XCircle, color: "text-[#DC2626]" },
}

// ============================================================================
// Fetcher for SWR polling
// ============================================================================

async function fetchMessages(url: string): Promise<TranscriptMessage[]> {
  const res = await fetch(url)
  if (!res.ok) return []
  return res.json()
}

// ============================================================================
// Component
// ============================================================================

/**
 * Client-side transcript processing session view (D-08).
 *
 * - Shows processing status with progress indicator
 * - Renders messages from the linked conversation
 * - Messages with toolCalls.type === "extraction_results" render as ExtractionCards
 * - Messages with toolCalls.type === "error" render as error banners
 * - Polls for new messages while processing (SWR refreshInterval: 3000)
 */
export function TranscriptSessionClient({
  projectId,
  transcriptId,
  transcriptTitle,
  processingStatus: initialStatus,
  conversationId,
  initialMessages,
}: TranscriptSessionClientProps) {
  const [messages, setMessages] = useState<TranscriptMessage[]>(initialMessages)
  const [status, setStatus] = useState(initialStatus)

  const isProcessing = status === "PENDING" || status === "PROCESSING"
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  const StatusIcon = statusConfig.icon

  // Poll for new messages while processing
  const { data: polledMessages } = useSWR(
    isProcessing && conversationId
      ? `/api/transcripts/${transcriptId}/messages?projectId=${projectId}&conversationId=${conversationId}`
      : null,
    fetchMessages,
    {
      refreshInterval: 3000,
      revalidateOnFocus: false,
    }
  )

  useEffect(() => {
    if (polledMessages && polledMessages.length > messages.length) {
      setMessages(polledMessages)

      // Check if any message indicates completion or error
      const lastMsg = polledMessages[polledMessages.length - 1]
      if (lastMsg?.toolCalls) {
        const tc = lastMsg.toolCalls as Record<string, unknown>
        if (tc.type === "extraction_results") {
          setStatus("COMPLETE")
        } else if (tc.type === "error") {
          setStatus("FAILED")
        }
      }
    }
  }, [polledMessages, messages.length])

  // Extract extraction groups from messages
  const extractionGroups: ExtractionGroup[] = []
  for (const msg of messages) {
    if (msg.toolCalls && (msg.toolCalls as Record<string, unknown>).type === "extraction_results") {
      const tc = msg.toolCalls as { groups?: ExtractionGroup[] }
      if (tc.groups) {
        extractionGroups.push(...tc.groups)
      }
    }
  }

  // Handlers for extraction card actions (client-side state only for now)
  const handleAccept = useCallback((_type: string, _itemId: string) => {
    // Future: call server action to finalize item
  }, [])

  const handleReject = useCallback((_type: string, _itemId: string) => {
    // Future: call server action to reject item
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#E5E5E5] px-4 py-3">
        <Link
          href={`/projects/${projectId}/transcripts`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[#F0F0F0]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16px] font-semibold text-foreground">
            {transcriptTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <StatusIcon
            className={`h-4 w-4 ${statusConfig.color} ${isProcessing ? "animate-spin" : ""}`}
          />
          <Badge
            variant="outline"
            className="text-[11px]"
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Processing progress */}
      {isProcessing && (
        <div className="border-b border-[#E5E5E5] px-4 py-2">
          <div className="flex items-center gap-3">
            <Progress value={status === "PROCESSING" ? 50 : 10} className="flex-1" />
            <span className="shrink-0 text-[13px] text-muted-foreground">
              {status === "PROCESSING" ? "Extracting items..." : "Queued for processing..."}
            </span>
          </div>
        </div>
      )}

      {/* Content area: split layout */}
      <div className="flex min-h-0 flex-1">
        {/* Messages / extraction results */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {messages.map((msg) => {
              const tc = msg.toolCalls as Record<string, unknown> | null

              // Render extraction results as ExtractionCards
              if (tc?.type === "extraction_results") {
                const groups = (tc as { groups?: ExtractionGroup[] }).groups ?? []
                return (
                  <div key={msg.id} className="space-y-3">
                    <p className="text-[14px] font-medium text-foreground">{msg.content}</p>
                    <ExtractionCards
                      groups={groups}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  </div>
                )
              }

              // Render error messages as error banners
              if (tc?.type === "error") {
                return (
                  <div
                    key={msg.id}
                    className="flex items-start gap-2 rounded-md border border-[#FCA5A5] bg-[#FEF2F2] p-3"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
                    <div>
                      <p className="text-[14px] font-medium text-[#DC2626]">{msg.content}</p>
                      {tc.message && (
                        <p className="mt-1 text-[13px] text-[#DC2626]/80">
                          {String(tc.message)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              }

              // Regular messages
              return (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  tokenUsage={
                    msg.inputTokens != null && msg.outputTokens != null
                      ? { input: msg.inputTokens, output: msg.outputTokens }
                      : undefined
                  }
                  cost={msg.cost ?? undefined}
                />
              )
            })}

            {/* Loading indicator while processing */}
            {isProcessing && (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
                <span className="text-[13px] text-muted-foreground">
                  AI is analyzing the transcript...
                </span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Context panel (right side) for completed transcripts */}
        {status === "COMPLETE" && extractionGroups.length > 0 && (
          <div className="w-[280px] shrink-0 border-l border-[#E5E5E5] p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
              Extraction Summary
            </h2>
            <div className="space-y-2">
              {extractionGroups.map((group) => (
                <div key={group.type} className="flex items-center justify-between text-[13px]">
                  <span className="capitalize text-foreground">{group.type}s</span>
                  <Badge variant="outline" className="text-[11px]">
                    {group.items.length}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
