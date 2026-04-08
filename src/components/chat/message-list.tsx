"use client"

import { useEffect, useRef } from "react"
import { format, isToday, isYesterday } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageBubble } from "./message-bubble"
import { StoryDraftCards } from "@/components/work/story-draft-cards"
import { EnrichmentSuggestionCards, type EnrichmentSuggestionData } from "./enrichment-suggestion-cards"
import { ToolPartRenderer } from "./tool-part-renderer"
import type { StoryDraft } from "@/lib/agent-harness/tools/create-story-draft"
import type { EnrichmentCategory } from "@/lib/agent-harness/tools/create-enrichment-suggestion"

interface ToolInvocationPart {
  type: "tool-invocation"
  toolInvocationId: string
  toolName: string
  args: Record<string, unknown>
  state: string
  result?: unknown
}

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt?: Date | string
  inputTokens?: number | null
  outputTokens?: number | null
  cost?: number | null
  toolInvocations?: ToolInvocationPart[]
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  storySession?: {
    projectId: string
    epicId: string
    featureId?: string
  }
  enrichmentSession?: {
    projectId: string
    storyId: string
  }
  onAllEnrichmentsResolved?: () => void
  addToolApprovalResponse?: (params: { id: string; approved: boolean }) => void
}

function formatDateGroup(date: Date): string {
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "MMM d")
}

function groupMessagesByDate(
  messages: Message[]
): Map<string, Message[]> {
  const groups = new Map<string, Message[]>()
  for (const msg of messages) {
    const date = msg.createdAt ? new Date(msg.createdAt) : new Date()
    const key = format(date, "yyyy-MM-dd")
    const existing = groups.get(key) ?? []
    existing.push(msg)
    groups.set(key, existing)
  }
  return groups
}

export function MessageList({ messages, isLoading, storySession, enrichmentSession, onAllEnrichmentsResolved, addToolApprovalResponse }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, isLoading])

  if (messages.length === 0 && !isLoading) {
    return null
  }

  const grouped = groupMessagesByDate(messages)

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="flex flex-col gap-4 p-4">
        {Array.from(grouped.entries()).map(([dateKey, msgs]) => {
          const date = new Date(dateKey)
          return (
            <div key={dateKey}>
              {/* Date separator */}
              <div className="flex items-center gap-3 py-2">
                <Separator className="flex-1" />
                <span className="text-muted-foreground shrink-0 text-[13px] font-normal">
                  {formatDateGroup(date)}
                </span>
                <Separator className="flex-1" />
              </div>

              {/* Messages in this date group */}
              <div className="flex flex-col gap-3">
                {msgs.map((msg) => {
                  const storyDrafts: StoryDraft[] | null =
                    storySession && msg.toolInvocations && msg.toolInvocations.length > 0
                      ? msg.toolInvocations
                          .filter((t) => t.toolName === "create_story_draft" && t.state === "call")
                          .map((t) => ({
                            draftId: t.toolInvocationId,
                            title: String(t.args.title ?? ""),
                            persona: t.args.persona ? String(t.args.persona) : undefined,
                            description: String(t.args.description ?? ""),
                            acceptanceCriteria: String(t.args.acceptanceCriteria ?? ""),
                            storyPoints: t.args.storyPoints ? Number(t.args.storyPoints) : undefined,
                            priority: (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(String(t.args.priority ?? ""))
                              ? String(t.args.priority)
                              : "MEDIUM") as StoryDraft["priority"],
                            components: Array.isArray(t.args.components)
                              ? t.args.components.map((c: Record<string, unknown>) => ({
                                  componentName: String(c.componentName ?? ""),
                                  impactType: (["CREATE", "MODIFY", "DELETE"].includes(String(c.impactType ?? ""))
                                    ? String(c.impactType)
                                    : "MODIFY") as "CREATE" | "MODIFY" | "DELETE",
                                }))
                              : undefined,
                            reasoning: String(t.args.reasoning ?? ""),
                          }))
                      : null

                  const VALID_CATEGORIES = ["ACCEPTANCE_CRITERIA", "DESCRIPTION", "COMPONENTS", "TECHNICAL_NOTES", "STORY_POINTS", "PRIORITY"]
                  const enrichmentSuggestions: EnrichmentSuggestionData[] | null =
                    enrichmentSession && msg.toolInvocations && msg.toolInvocations.length > 0
                      ? msg.toolInvocations
                          .filter((t) => t.toolName === "create_enrichment_suggestion" && t.state === "call")
                          .map((t) => ({
                            suggestionId: t.toolInvocationId,
                            category: (VALID_CATEGORIES.includes(String(t.args.category ?? ""))
                              ? String(t.args.category)
                              : "DESCRIPTION") as EnrichmentCategory,
                            currentValue: t.args.currentValue ? String(t.args.currentValue) : null,
                            suggestedValue: String(t.args.suggestedValue ?? ""),
                            reasoning: String(t.args.reasoning ?? ""),
                          }))
                      : null

                  return (
                    <div key={msg.id}>
                      <MessageBubble
                        role={msg.role}
                        content={msg.content}
                        tokenUsage={
                          msg.inputTokens != null && msg.outputTokens != null
                            ? {
                                input: msg.inputTokens,
                                output: msg.outputTokens,
                              }
                            : undefined
                        }
                        cost={msg.cost ?? undefined}
                      />
                      {storySession && storyDrafts && storyDrafts.length > 0 && (
                        <div className="mt-3">
                          <StoryDraftCards
                            drafts={storyDrafts}
                            projectId={storySession.projectId}
                            epicId={storySession.epicId}
                            featureId={storySession.featureId}
                          />
                        </div>
                      )}
                      {enrichmentSession && enrichmentSuggestions && enrichmentSuggestions.length > 0 && (
                        <div className="mt-3">
                          <EnrichmentSuggestionCards
                            suggestions={enrichmentSuggestions}
                            projectId={enrichmentSession.projectId}
                            storyId={enrichmentSession.storyId}
                            onAllResolved={onAllEnrichmentsResolved}
                          />
                        </div>
                      )}
                      {/* All other tool invocations (agentic database tools) — routed via ToolPartRenderer */}
                      {msg.toolInvocations && msg.toolInvocations.some(
                        t => t.toolName !== "create_story_draft" && t.toolName !== "create_enrichment_suggestion"
                      ) && (
                        <div className="mt-3 space-y-2">
                          {msg.toolInvocations
                            .filter(t => t.toolName !== "create_story_draft" && t.toolName !== "create_enrichment_suggestion")
                            .map(part => (
                              <ToolPartRenderer
                                key={part.toolInvocationId}
                                part={part}
                                addToolApprovalResponse={addToolApprovalResponse}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Streaming indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="border-border bg-background rounded-lg border-l-2 p-3">
              <div className="flex gap-1">
                <span className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]" />
                <span className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]" />
                <span className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
