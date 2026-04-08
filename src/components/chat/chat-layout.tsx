import { ConversationSidebar } from "./conversation-sidebar"
import type { ConversationListItem } from "./conversation-row"

interface ChatLayoutProps {
  projectId: string
  conversations: ConversationListItem[]
  children: React.ReactNode
}

/**
 * Split layout: ConversationSidebar (left, 320px) + chat area (right, flex-1).
 * Wraps all chat routes via layout.tsx.
 */
export function ChatLayout({
  projectId,
  conversations,
  children,
}: ChatLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden">
      <ConversationSidebar
        projectId={projectId}
        conversations={conversations}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
