import { getConversation } from "@/actions/conversations"
import { ChatInterface } from "@/components/chat/chat-interface"
import { TokenDisplay } from "@/components/chat/token-display"
import { redirect } from "next/navigation"
import type { UIMessage } from "ai"

interface ConversationPageProps {
  params: Promise<{ projectId: string; conversationId: string }>
  searchParams: Promise<{ epicId?: string; featureId?: string }>
}

/**
 * Task-specific chat session page.
 * Server component that loads conversation data and renders
 * ChatInterface with split layout + context panel.
 */
export default async function ConversationPage({
  params,
  searchParams,
}: ConversationPageProps) {
  const { projectId, conversationId } = await params
  const { epicId, featureId } = await searchParams

  const result = await getConversation({ conversationId, projectId })

  if (!result?.data) {
    redirect(`/projects/${projectId}/chat`)
  }

  const conversation = result.data

  // Map DB conversation type to ChatInterface variant
  const chatType = conversation.conversationType === "GENERAL_CHAT"
    ? "GENERAL_CHAT"
    : conversation.conversationType === "STORY_SESSION"
      ? "STORY_SESSION"
      : "TASK_SESSION"

  // Convert DB messages to UIMessage format
  const initialMessages: UIMessage[] = conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role.toLowerCase() as "user" | "assistant" | "system",
    parts: [{ type: "text" as const, text: msg.content }],
  }))

  // Calculate session totals from DB records
  const sessionTokens = conversation.messages.reduce(
    (acc, msg) => ({
      totalTokens:
        acc.totalTokens + (msg.inputTokens ?? 0) + (msg.outputTokens ?? 0),
      totalCost: acc.totalCost + (msg.cost ?? 0),
    }),
    { totalTokens: 0, totalCost: 0 }
  )

  return (
    <div className="h-full">
      <ChatInterface
        conversationId={conversation.id}
        projectId={projectId}
        conversationType={chatType}
        initialMessages={initialMessages}
        sessionTitle={conversation.title ?? undefined}
        epicId={epicId}
        featureId={featureId}
      />
    </div>
  )
}
