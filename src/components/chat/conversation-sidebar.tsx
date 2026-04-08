"use client"

import { useState, useMemo, useCallback, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ConversationFilters } from "./conversation-filters"
import { ConversationRow, type ConversationListItem } from "./conversation-row"
import { NewSessionDropdown } from "./new-session-dropdown"
import {
  archiveConversation,
  unarchiveConversation,
  renameConversation,
  getConversations,
} from "@/actions/conversations"

interface ConversationSidebarProps {
  projectId: string
  conversations: ConversationListItem[]
  currentConversationId?: string
}

/** Map tab names to ConversationType enum values for filtering */
const TAB_TO_TYPE: Record<string, string> = {
  stories: "STORY_SESSION",
  briefings: "BRIEFING_SESSION",
  transcripts: "TRANSCRIPT_SESSION",
  questions: "QUESTION_SESSION",
}

/**
 * Left sidebar showing filterable, searchable conversation list.
 * General chat pinned at top. Sessions sorted by recent activity.
 */
export function ConversationSidebar({
  projectId,
  conversations: initialConversations,
}: ConversationSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [conversations, setConversations] =
    useState<ConversationListItem[]>(initialConversations)

  // Derive selected conversation from URL
  const pathParts = pathname.split("/")
  const chatIndex = pathParts.indexOf("chat")
  const currentConversationId =
    chatIndex >= 0 && chatIndex + 1 < pathParts.length
      ? pathParts[chatIndex + 1]
      : undefined

  // Separate general chat from task sessions
  const generalChat = useMemo(
    () => conversations.find((c) => c.conversationType === "GENERAL_CHAT"),
    [conversations]
  )

  const filteredSessions = useMemo(() => {
    let sessions = conversations.filter(
      (c) => c.conversationType !== "GENERAL_CHAT"
    )

    // Filter by tab
    if (activeTab !== "all" && TAB_TO_TYPE[activeTab]) {
      sessions = sessions.filter(
        (c) => c.conversationType === TAB_TO_TYPE[activeTab]
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      sessions = sessions.filter((c) =>
        (c.title ?? "").toLowerCase().includes(query)
      )
    }

    // Sort by most recent activity
    sessions.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    return sessions
  }, [conversations, activeTab, searchQuery])

  const refreshConversations = useCallback(async () => {
    const result = await getConversations({
      projectId,
      includeArchived: showArchived,
    })
    if (result?.data) {
      setConversations(
        result.data.map((c) => ({
          id: c.id,
          conversationType: c.conversationType,
          title: c.title,
          status: c.status,
          updatedAt: c.updatedAt,
          isArchived: c.isArchived,
        }))
      )
    }
  }, [projectId, showArchived])

  const handleArchive = useCallback(
    async (conversationId: string) => {
      await archiveConversation({ projectId, conversationId })
      startTransition(() => {
        refreshConversations()
        router.refresh()
      })
    },
    [projectId, refreshConversations, router]
  )

  const handleUnarchive = useCallback(
    async (conversationId: string) => {
      await unarchiveConversation({ projectId, conversationId })
      startTransition(() => {
        refreshConversations()
        router.refresh()
      })
    },
    [projectId, refreshConversations, router]
  )

  const handleRename = useCallback(
    async (conversationId: string, title: string) => {
      await renameConversation({ projectId, conversationId, title })
      startTransition(() => {
        refreshConversations()
        router.refresh()
      })
    },
    [projectId, refreshConversations, router]
  )

  const handleToggleArchived = useCallback(async () => {
    const newShowArchived = !showArchived
    setShowArchived(newShowArchived)
    const result = await getConversations({
      projectId,
      includeArchived: newShowArchived,
    })
    if (result?.data) {
      setConversations(
        result.data.map((c) => ({
          id: c.id,
          conversationType: c.conversationType,
          title: c.title,
          status: c.status,
          updatedAt: c.updatedAt,
          isArchived: c.isArchived,
        }))
      )
    }
  }, [showArchived, projectId])

  return (
    <div
      className="bg-muted border-border flex h-full w-80 shrink-0 flex-col border-r"
      role="navigation"
      aria-label="Conversation list"
    >
      {/* Header with New Session button */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-[16px] font-semibold">Conversations</h2>
        <NewSessionDropdown projectId={projectId} />
      </div>

      {/* Filters: search + tabs */}
      <div className="px-3 pb-2">
        <ConversationFilters
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div role="listbox" aria-label="Conversations">
          {/* Pinned general chat */}
          {generalChat && activeTab === "all" && (
            <>
              <ConversationRow
                conversation={generalChat}
                isSelected={!currentConversationId}
                isPinned
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onRename={handleRename}
              />
              <Separator className="mx-3" />
            </>
          )}

          {/* Session list */}
          {filteredSessions.length > 0 ? (
            filteredSessions.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                isSelected={currentConversationId === conversation.id}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onRename={handleRename}
              />
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              {searchQuery ? (
                <>
                  <p className="text-[14px] font-medium">
                    No matching conversations
                  </p>
                  <p className="text-muted-foreground mt-1 text-[13px]">
                    Try a different search term or clear the filter.
                  </p>
                </>
              ) : activeTab !== "all" ? (
                <>
                  <p className="text-[14px] font-medium">
                    No {activeTab} sessions
                  </p>
                  <p className="text-muted-foreground mt-1 text-[13px]">
                    Create a new session using the + New button above.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[14px] font-medium">
                    No conversations yet
                  </p>
                  <p className="text-muted-foreground mt-1 text-[13px]">
                    Start a general chat or create a task session to work with
                    the AI on specific project activities.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Show Archived toggle */}
      <div className="border-border border-t px-4 py-2">
        <button
          onClick={handleToggleArchived}
          className="text-muted-foreground hover:text-foreground text-[13px]"
        >
          {showArchived ? "Hide Archived" : "Show Archived"}
        </button>
      </div>
    </div>
  )
}
