import { getCurrentMember } from "@/lib/auth"
import { getConversations } from "@/actions/conversations"
import { ChatLayout } from "@/components/chat/chat-layout"

interface ChatLayoutRouteProps {
  params: Promise<{ projectId: string }>
  children: React.ReactNode
}

/**
 * Shared layout for all chat routes.
 * Loads conversation list and renders ChatLayout with sidebar.
 */
export default async function ChatLayoutRoute({
  params,
  children,
}: ChatLayoutRouteProps) {
  const { projectId } = await params
  await getCurrentMember(projectId)

  const result = await getConversations({ projectId })
  const conversations = (result?.data ?? []).map((c) => ({
    id: c.id,
    conversationType: c.conversationType,
    title: c.title,
    status: c.status,
    updatedAt: c.updatedAt,
    isArchived: c.isArchived,
  }))

  return (
    <ChatLayout projectId={projectId} conversations={conversations}>
      {children}
    </ChatLayout>
  )
}
