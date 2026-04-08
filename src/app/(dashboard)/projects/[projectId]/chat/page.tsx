import { getOrCreateGeneralChat } from "@/actions/conversations"
import { ChatInterface } from "@/components/chat/chat-interface"
import type { UIMessage } from "ai"

interface ChatPageProps {
  params: Promise<{ projectId: string }>
}

/**
 * General project chat page.
 * Server component that loads/creates the general chat conversation,
 * then renders ChatInterface in full-width mode.
 */
export default async function ChatPage({ params }: ChatPageProps) {
  const { projectId } = await params

  const result = await getOrCreateGeneralChat({ projectId })

  if (!result?.data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-[14px]">
          Unable to load chat. Please try again.
        </p>
      </div>
    )
  }

  const conversation = result.data

  // Convert DB messages to UIMessage format for initialMessages
  const initialMessages: UIMessage[] = conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role.toLowerCase() as "user" | "assistant" | "system",
    parts: [{ type: "text" as const, text: msg.content }],
  }))

  return (
    <ChatInterface
      conversationId={conversation.id}
      projectId={projectId}
      conversationType="GENERAL_CHAT"
      initialMessages={initialMessages}
    />
  )
}
