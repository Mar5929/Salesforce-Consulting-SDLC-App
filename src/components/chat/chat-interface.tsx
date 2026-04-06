"use client"

import { useState, useCallback, type KeyboardEvent } from "react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ArrowUp, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TokenDisplay } from "./token-display"
import { MessageList } from "./message-list"
import { ContextPanel } from "./context-panel"

interface ChatInterfaceProps {
  conversationId: string
  projectId: string
  conversationType: "GENERAL_CHAT" | "TASK_SESSION"
  initialMessages?: UIMessage[]
  sessionTitle?: string
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
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("")

  const { messages, sendMessage, status, error, clearError } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { projectId, conversationId },
    }),
    messages: initialMessages,
    onError: (err) => {
      console.error("[Chat Error]", err)
    },
  })

  const isLoading = status === "submitted" || status === "streaming"

  // Calculate session totals from messages
  const sessionTokens = computeSessionTokens(messages)

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
  }))

  const isTaskSession = conversationType === "TASK_SESSION"
  const title =
    sessionTitle ??
    (isTaskSession ? "Task Session" : "Project Chat")

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-[18px] font-semibold">{title}</h1>
        <TokenDisplay
          totalTokens={sessionTokens.totalTokens}
          totalCost={sessionTokens.totalCost}
        />
      </div>

      {/* Content area */}
      <div className="flex min-h-0 flex-1">
        {/* Messages */}
        <div className="flex min-w-0 flex-1 flex-col">
          {messages.length === 0 && !isLoading ? (
            <EmptyState />
          ) : (
            <MessageList messages={flatMessages} isLoading={isLoading} />
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

          {/* Input area */}
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
        </div>

        {/* Context panel for task sessions (D-14) */}
        {isTaskSession && (
          <ContextPanel
            title="Session Context"
            tokenUsage={{
              promptTokens: sessionTokens.promptTokens,
              responseTokens: sessionTokens.responseTokens,
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

/** Compute aggregate token/cost stats from messages (placeholder) */
function computeSessionTokens(_messages: UIMessage[]) {
  // Token data is stored server-side in ChatMessage records,
  // not in UIMessage parts. For now return zeros;
  // the TokenDisplay will hide when totalTokens is 0.
  // Session-level token data will be loaded via server component props.
  return {
    promptTokens: 0,
    responseTokens: 0,
    totalTokens: 0,
    totalCost: 0,
  }
}
