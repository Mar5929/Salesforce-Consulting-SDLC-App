import { getConversation } from "@/actions/conversations"
import { ChatInterface } from "@/components/chat/chat-interface"
import { TokenDisplay } from "@/components/chat/token-display"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import type { UIMessage } from "ai"

interface ConversationPageProps {
  params: Promise<{ projectId: string; conversationId: string }>
  searchParams: Promise<{ epicId?: string; featureId?: string; storyId?: string }>
}

/**
 * Task-specific chat session page.
 * Server component that loads conversation data and renders
 * ChatInterface with split layout + context panel.
 *
 * TRANSCRIPT_SESSION conversations are redirected to the transcript
 * detail page since they represent background AI processing jobs,
 * not interactive chat sessions.
 */
export default async function ConversationPage({
  params,
  searchParams,
}: ConversationPageProps) {
  const { projectId, conversationId } = await params
  const { epicId, featureId, storyId } = await searchParams

  const result = await getConversation({ conversationId, projectId })

  if (!result?.data) {
    redirect(`/projects/${projectId}/chat`)
  }

  const conversation = result.data

  // Redirect TRANSCRIPT_SESSION conversations to the transcript detail page.
  // These are background AI processing jobs, not interactive chat sessions.
  if (conversation.conversationType === "TRANSCRIPT_SESSION") {
    const transcript = await prisma.transcript.findUnique({
      where: { conversationId: conversation.id },
      select: { id: true },
    })

    if (transcript) {
      redirect(`/projects/${projectId}/transcripts/${transcript.id}`)
    }

    // No linked transcript found — fall back to read-only message view below
    // by using TRANSCRIPT_SESSION type which disables the chat input
  }

  // Fall back to persisted metadata when URL search params are missing (revisit)
  const meta = (conversation.metadata ?? {}) as Record<string, string | undefined>
  const resolvedEpicId = epicId ?? meta.epicId
  const resolvedFeatureId = featureId ?? meta.featureId
  const resolvedStoryId = storyId ?? meta.storyId

  // Map DB conversation type to ChatInterface variant
  type ChatType = "GENERAL_CHAT" | "TASK_SESSION" | "STORY_SESSION" | "TRANSCRIPT_SESSION" | "BRIEFING_SESSION" | "ENRICHMENT_SESSION" | "QUESTION_SESSION"
  const chatTypeMap: Record<string, ChatType> = {
    GENERAL_CHAT: "GENERAL_CHAT",
    STORY_SESSION: "STORY_SESSION",
    TRANSCRIPT_SESSION: "TRANSCRIPT_SESSION",
    BRIEFING_SESSION: "BRIEFING_SESSION",
    ENRICHMENT_SESSION: "ENRICHMENT_SESSION",
    QUESTION_SESSION: "QUESTION_SESSION",
  }
  const chatType = chatTypeMap[conversation.conversationType] ?? "TASK_SESSION"

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
    <ChatInterface
      conversationId={conversation.id}
      projectId={projectId}
      conversationType={chatType}
      initialMessages={initialMessages}
      sessionTitle={conversation.title ?? undefined}
      epicId={resolvedEpicId}
      featureId={resolvedFeatureId}
      storyId={resolvedStoryId}
      sessionStatus={conversation.status as "ACTIVE" | "COMPLETE" | "FAILED"}
    />
  )
}
