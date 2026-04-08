"use client"

import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai"
import { ArrowUp, AlertCircle, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { getSessionTokenTotals, completeSession } from "@/actions/conversations"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TokenDisplay } from "./token-display"
import { MessageList } from "./message-list"
import { ContextPanel } from "./context-panel"

interface ChatInterfaceProps {
  conversationId: string
  projectId: string
  conversationType: "GENERAL_CHAT" | "TASK_SESSION" | "STORY_SESSION" | "TRANSCRIPT_SESSION" | "BRIEFING_SESSION" | "ENRICHMENT_SESSION" | "QUESTION_SESSION"
  initialMessages?: UIMessage[]
  sessionTitle?: string
  epicId?: string
  featureId?: string
  storyId?: string
  sessionStatus?: "ACTIVE" | "COMPLETE" | "FAILED"
}

/**
 * Main chat component (D-12, D-13).
 * - GENERAL_CHAT: full-width message list
 * - TASK_SESSION: split layout with ContextPanel on the right
 */
export function ChatInterface({
  conversationId,
  projectId,
  conversationType,
  initialMessages = [],
  sessionTitle,
  epicId,
  featureId,
  storyId,
  sessionStatus = "ACTIVE",
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("")
  const [currentStatus, setCurrentStatus] = useState(sessionStatus)
  const router = useRouter()
  const prevMessageCountRef = useRef(0)

  const { messages, sendMessage, status, error, clearError, addToolApprovalResponse } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { projectId, conversationId, ...(epicId && { epicId }), ...(featureId && { featureId }), ...(storyId && { storyId }) },
    }),
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: (err) => {
      console.error("[Chat Error]", err)
    },
  })

  const isLoading = status === "submitted" || status === "streaming"

  // ACHAT-17: Revalidate page data after mutation tool calls complete
  // Detects when streaming stops and new messages with mutation tool calls appeared
  const MUTATION_PREFIXES = ["create_", "update_", "delete_", "batch_"]
  useEffect(() => {
    if (isLoading || messages.length <= prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length
      return
    }
    const newMessages = messages.slice(prevMessageCountRef.current)
    prevMessageCountRef.current = messages.length
    const hasMutation = newMessages.some((m) =>
      m.parts?.some((p: { type: string }) =>
        MUTATION_PREFIXES.some((prefix) => p.type.startsWith(`tool-${prefix}`))
      )
    )
    if (hasMutation) {
      router.refresh()
    }
  }, [isLoading, messages, router])

  // Auto-complete briefing sessions after first AI response finishes
  const [briefingAutoCompleted, setBriefingAutoCompleted] = useState(false)
  useEffect(() => {
    if (
      conversationType !== "BRIEFING_SESSION" ||
      briefingAutoCompleted ||
      currentStatus !== "ACTIVE" ||
      isLoading
    ) return
    const hasAssistantMessage = messages.some((m) => m.role === "assistant")
    if (hasAssistantMessage) {
      setBriefingAutoCompleted(true)
      completeSession({ projectId, conversationId }).then((result) => {
        if (result?.data) setCurrentStatus("COMPLETE")
      })
    }
  }, [conversationType, briefingAutoCompleted, currentStatus, isLoading, messages, projectId, conversationId])

  // Load real session token totals from database
  const [sessionTokens, setSessionTokens] = useState({ totalTokens: 0, totalCost: 0 })

  useEffect(() => {
    if (!conversationId || !projectId) return

    const loadTokens = async () => {
      const result = await getSessionTokenTotals({ projectId, conversationId })
      if (result?.data) {
        setSessionTokens(result.data)
      }
    }

    loadTokens()
  }, [conversationId, projectId, messages.length])

  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text || isLoading) return
    setInputValue("")
    sendMessage({ text })
  }, [inputValue, isLoading, sendMessage])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Convert UIMessage parts to flat content for MessageList
  const flatMessages = messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    content: extractTextFromParts(msg.parts),
    createdAt: new Date(),
    toolInvocations: msg.parts.filter(
      (p): p is Extract<typeof p, { type: "tool-invocation" }> => p.type === "tool-invocation"
    ),
  }))

  const isTaskSession = conversationType === "TASK_SESSION" || conversationType === "STORY_SESSION" || conversationType === "BRIEFING_SESSION" || conversationType === "ENRICHMENT_SESSION" || conversationType === "QUESTION_SESSION"
  const isReadOnly = conversationType === "TRANSCRIPT_SESSION"
  const isSessionComplete = currentStatus === "COMPLETE" || currentStatus === "FAILED"

  async function handleMarkResolved() {
    const result = await completeSession({ projectId, conversationId })
    if (result?.data) {
      setCurrentStatus("COMPLETE")
    }
  }

  // Auto-complete for enrichment and briefing sessions
  const handleAutoComplete = useCallback(async () => {
    if (currentStatus !== "ACTIVE") return
    const result = await completeSession({ projectId, conversationId })
    if (result?.data) {
      setCurrentStatus("COMPLETE")
    }
  }, [currentStatus, projectId, conversationId])
  const title =
    sessionTitle ??
    (isReadOnly ? "Transcript Session" : isTaskSession ? "Task Session" : "Project Chat")

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-[18px] font-semibold">{title}</h1>
        <div className="flex items-center gap-3">
          {conversationType === "QUESTION_SESSION" && currentStatus === "ACTIVE" && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleMarkResolved}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Resolved
            </Button>
          )}
          <TokenDisplay
            totalTokens={sessionTokens.totalTokens}
            totalCost={sessionTokens.totalCost}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="flex min-h-0 flex-1">
        {/* Messages */}
        <div className="flex min-w-0 flex-1 flex-col">
          {messages.length === 0 && !isLoading ? (
            <EmptyState />
          ) : (
            <MessageList
              messages={flatMessages}
              isLoading={isLoading}
              storySession={conversationType === "STORY_SESSION" ? { projectId, epicId: epicId ?? "", featureId } : undefined}
              enrichmentSession={conversationType === "ENRICHMENT_SESSION" && storyId ? { projectId, storyId } : undefined}
              onAllEnrichmentsResolved={conversationType === "ENRICHMENT_SESSION" ? handleAutoComplete : undefined}
              addToolApprovalResponse={addToolApprovalResponse}
            />
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2">
              <AlertCircle className="text-destructive h-4 w-4" />
              <span className="text-destructive text-[13px]">
                Response interrupted.
              </span>
              <button
                onClick={() => {
                  clearError()
                }}
                className="text-primary inline-flex items-center gap-1 text-[13px] hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                Click to retry.
              </button>
            </div>
          )}

          {/* Input area — hidden for read-only or completed sessions */}
          {isReadOnly ? (
            <div className="bg-muted border-border border-t px-4 py-3">
              <p className="text-muted-foreground text-center text-[13px]">
                This is a read-only transcript processing session. View the full transcript for extraction results and accept/reject controls.
              </p>
            </div>
          ) : isSessionComplete ? (
            <div className="bg-muted border-border border-t px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                {currentStatus === "COMPLETE" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-muted-foreground text-[13px]">
                      This session has been completed.
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <p className="text-muted-foreground text-[13px]">
                      This session failed. You can retry by creating a new session.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-muted border-border border-t px-4 py-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about this project..."
                  className="bg-background min-h-[44px] flex-1 resize-none"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="h-[44px] w-[44px] shrink-0"
                  aria-label="Send message"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Context panel for task sessions (D-14) */}
        {isTaskSession && (
          <ContextPanel
            title="Session Context"
            tokenUsage={{
              promptTokens: 0,
              responseTokens: 0,
              sessionTotal: sessionTokens.totalTokens,
              cost: sessionTokens.totalCost,
            }}
          />
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <h2 className="text-[18px] font-semibold">Start a conversation</h2>
      <p className="text-muted-foreground max-w-md text-center text-[14px]">
        Ask the AI anything about this project. It draws on all discovery
        data, transcripts, and knowledge articles to give contextual answers.
      </p>
    </div>
  )
}

/** Extract plain text from UIMessage parts array */
function extractTextFromParts(
  parts: UIMessage["parts"]
): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

