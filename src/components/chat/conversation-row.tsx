"use client"

import { useState, useCallback, type KeyboardEvent } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  MessageSquare,
  BookOpen,
  FileText,
  LayoutDashboard,
  HelpCircle,
  Sparkles,
  Pencil,
  Archive,
  ArchiveRestore,
  MoreHorizontal,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SessionStatusBadge } from "./session-status-badge"
import { cn } from "@/lib/utils"

export interface ConversationListItem {
  id: string
  conversationType: string
  title: string | null
  status: string
  updatedAt: Date | string
  isArchived: boolean
}

interface ConversationRowProps {
  conversation: ConversationListItem
  isSelected: boolean
  isPinned?: boolean
  onArchive: (id: string) => void
  onUnarchive?: (id: string) => void
  onRename: (id: string, title: string) => void
}

const CONVERSATION_TYPE_ICONS: Record<string, typeof MessageSquare> = {
  GENERAL_CHAT: MessageSquare,
  STORY_SESSION: BookOpen,
  TRANSCRIPT_SESSION: FileText,
  BRIEFING_SESSION: LayoutDashboard,
  QUESTION_SESSION: HelpCircle,
  ENRICHMENT_SESSION: Sparkles,
}

/**
 * Single conversation row in the sidebar.
 * Shows icon, title, timestamp, status badge.
 * Hover reveals rename, archive, and more actions.
 */
export function ConversationRow({
  conversation,
  isSelected,
  isPinned,
  onArchive,
  onUnarchive,
  onRename,
}: ConversationRowProps) {
  const params = useParams<{ projectId: string }>()
  const projectId = params.projectId
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(conversation.title ?? "")
  const [isHovered, setIsHovered] = useState(false)

  const Icon =
    CONVERSATION_TYPE_ICONS[conversation.conversationType] ?? MessageSquare

  const href =
    conversation.conversationType === "GENERAL_CHAT"
      ? `/projects/${projectId}/chat`
      : `/projects/${projectId}/chat/${conversation.id}`

  const displayTitle =
    conversation.title ??
    conversation.conversationType.replace(/_/g, " ").toLowerCase()

  const timeAgo = formatDistanceToNow(new Date(conversation.updatedAt), {
    addSuffix: true,
  })

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== conversation.title) {
      onRename(conversation.id, trimmed)
    }
    setIsRenaming(false)
  }, [renameValue, conversation.id, conversation.title, onRename])

  const handleRenameKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleRenameSubmit()
      } else if (e.key === "Escape") {
        setIsRenaming(false)
        setRenameValue(conversation.title ?? "")
      }
    },
    [handleRenameSubmit, conversation.title]
  )

  const startRename = useCallback(() => {
    setRenameValue(conversation.title ?? "")
    setIsRenaming(true)
  }, [conversation.title])

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={href}
        className={cn(
          "flex min-h-[48px] items-center gap-2 px-3 py-2 transition-colors",
          isSelected && "bg-background border-primary border-l-2",
          !isSelected && "hover:bg-background/80",
          conversation.isArchived && "opacity-50"
        )}
      >
        <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col">
          {isRenaming ? (
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSubmit}
              onClick={(e) => e.preventDefault()}
              className="h-6 text-[13px]"
              aria-label="Rename conversation"
              autoFocus
            />
          ) : (
            <>
              <span className="truncate text-[14px]">{displayTitle}</span>
              <span className="text-muted-foreground text-[13px]">
                {timeAgo}
              </span>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {conversation.status !== "ACTIVE" && (
            <SessionStatusBadge
              status={conversation.status as "ACTIVE" | "COMPLETE" | "FAILED"}
              conversationType={conversation.conversationType}
            />
          )}
          {isHovered && !isRenaming && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  startRename()
                }}
                className="text-muted-foreground hover:text-foreground rounded p-0.5"
                aria-label="Rename conversation"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (conversation.isArchived) {
                    onUnarchive?.(conversation.id)
                  } else {
                    onArchive(conversation.id)
                  }
                }}
                className="text-muted-foreground hover:text-foreground rounded p-0.5"
                aria-label={
                  conversation.isArchived
                    ? "Unarchive conversation"
                    : "Archive conversation"
                }
              >
                {conversation.isArchived ? (
                  <ArchiveRestore className="h-3.5 w-3.5" />
                ) : (
                  <Archive className="h-3.5 w-3.5" />
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="text-muted-foreground hover:text-foreground rounded p-0.5"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={startRename}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  {conversation.isArchived ? (
                    <DropdownMenuItem
                      onClick={() => onUnarchive?.(conversation.id)}
                    >
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Unarchive
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => onArchive(conversation.id)}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
