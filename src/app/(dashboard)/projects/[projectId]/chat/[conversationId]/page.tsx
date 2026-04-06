import { getConversation } from "@/actions/conversations"
import { ChatInterface } from "@/components/chat/chat-interface"
import { TokenDisplay } from "@/components/chat/token-display"
import { redirect } from "next/navigation"
import type { UIMessage } from "ai"

interface ConversationPageProps {
  params: Promise<{ projectId: string; conversationId: string }>
}

/**
 * Task-specific chat session page.
 * Server component that loads conversation data and renders
 * ChatInterface with split layout + context panel.
 */
export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { projectId, conversationId } = await params

  const result = await getConversation({ conversationId, projectId })

  if (!result?.data) {
    redirect(`/projects/${projectId}/chat`)
  }

  const conversation = result.data

  // Determine conversation type for layout
  const isTaskSession = conversation.conversationType !== "GENERAL_CHAT"

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
        conversationType={isTaskSession ? "TASK_SESSION" : "GENERAL_CHAT"}
        initialMessages={initialMessages}
        sessionTitle={conversation.title ?? undefined}
      />
    </div>
  )
}
