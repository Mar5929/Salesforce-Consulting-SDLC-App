---
phase: 10-chat-session-management-and-conversation-intelligence
plan: 01
subsystem: chat
tags: [chat, sidebar, conversations, UI, schema]
dependency_graph:
  requires: [02-03, 02-12]
  provides: [conversation-sidebar, chat-layout, archive-rename-actions]
  affects: [chat-pages, conversation-list]
tech_stack:
  added: []
  patterns: [split-layout-sidebar, conversation-list-filtering, inline-rename]
key_files:
  created:
    - src/components/chat/chat-layout.tsx
    - src/components/chat/conversation-sidebar.tsx
    - src/components/chat/conversation-row.tsx
    - src/components/chat/conversation-filters.tsx
    - src/components/chat/session-status-badge.tsx
    - src/components/chat/new-session-dropdown.tsx
    - src/app/(dashboard)/projects/[projectId]/chat/layout.tsx
  modified:
    - prisma/schema.prisma
    - src/actions/conversations.ts
    - src/app/(dashboard)/projects/[projectId]/chat/page.tsx
    - src/app/(dashboard)/projects/[projectId]/chat/[conversationId]/page.tsx
decisions:
  - "Used MoreHorizontal overflow menu instead of right-click DropdownMenu trigger wrapping Link (base-ui does not support asChild pattern)"
  - "ConversationSidebar derives selected conversation from URL pathname instead of prop (layout cannot pass child route params)"
  - "Conversation list state managed locally with refresh via getConversations after mutations"
metrics:
  duration: 9m
  completed: 2026-04-08
---

# Phase 10 Plan 01: Conversation Sidebar and Chat Layout Summary

ChatGPT-style conversation sidebar with filterable list, search, pinned general chat, hover actions (rename/archive), and split layout wrapping all chat routes.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | f5eca43 | Schema isArchived field + archive/unarchive/rename server actions |
| 2 | 5190204 | Conversation sidebar UI components + chat layout |

## What Was Built

### Task 1: Schema + Server Actions
- Added `isArchived Boolean @default(false)` field to Conversation model in Prisma schema
- Added `archiveConversation` server action with project-scoped auth via getCurrentMember + scopedPrisma findFirst
- Added `unarchiveConversation` server action with same auth pattern
- Added `renameConversation` server action with Zod validation (1-100 chars)
- Updated `getConversations` to filter out archived conversations by default, with `includeArchived` optional parameter

### Task 2: Conversation Sidebar UI
- **ChatLayout**: Split layout component (320px sidebar + flex-1 chat area)
- **ConversationSidebar**: Left panel with conversation list, search input, tab filters, pinned general chat at top, "Show Archived" toggle at bottom
- **ConversationRow**: Row with session type icon (MessageSquare/BookOpen/FileText/LayoutDashboard/HelpCircle/Sparkles), truncated title, relative timestamp via date-fns, status badge, hover actions (rename pencil, archive, overflow menu)
- **ConversationFilters**: Tab bar (All/Stories/Briefings/Transcripts/Questions) using shadcn Tabs with line variant + search Input with Search icon
- **SessionStatusBadge**: ACTIVE (outline), COMPLETE (secondary), FAILED (destructive/10) badge variants
- **NewSessionDropdown**: "+ New Session" button with dropdown showing Story Generation, Briefing, Question Impact, Story Enrichment session types with descriptions
- **Chat layout.tsx**: Shared route layout that loads conversations and wraps all chat routes with ChatLayout
- Updated chat page.tsx and [conversationId]/page.tsx to remove wrapper divs (layout handles it)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] base-ui DropdownMenuTrigger does not support asChild**
- **Found during:** Task 2
- **Issue:** Plan specified right-click DropdownMenu wrapping the entire conversation row link. base-ui's MenuPrimitive.Trigger uses `render` prop pattern, not `asChild`. Wrapping a Link inside a menu trigger would also conflict (click opens menu vs navigating).
- **Fix:** Replaced right-click context menu with a MoreHorizontal overflow button that appears on hover alongside rename and archive icons. The overflow menu opens a DropdownMenu with Rename and Archive/Unarchive options.
- **Files modified:** src/components/chat/conversation-row.tsx

## Verification

- `npx prisma validate` -- PASSED
- `npx tsc --noEmit` -- PASSED (zero errors)

## Self-Check: PASSED
