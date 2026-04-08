"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import type { ConversationType, ChatMessageRole } from "@/generated/prisma"

// ============================================================================
// Schemas
// ============================================================================

const getOrCreateGeneralChatSchema = z.object({
  projectId: z.string().min(1),
})

const createConversationSchema = z.object({
  projectId: z.string().min(1),
  conversationType: z.enum([
    "GENERAL_CHAT",
    "TRANSCRIPT_SESSION",
    "STORY_SESSION",
    "BRIEFING_SESSION",
    "QUESTION_SESSION",
    "ENRICHMENT_SESSION",
  ]),
  title: z.string().optional(),
  sessionLogId: z.string().optional(),
})

const getConversationSchema = z.object({
  conversationId: z.string().min(1),
  projectId: z.string().min(1),
})

const getConversationsSchema = z.object({
  projectId: z.string().min(1),
  includeArchived: z.boolean().optional(),
})

const saveMessageSchema = z.object({
  conversationId: z.string().min(1),
  role: z.enum(["USER", "ASSISTANT", "SYSTEM"]),
  content: z.string().min(1),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
})

// ============================================================================
// Actions
// ============================================================================

/**
 * Find or create the single GENERAL_CHAT conversation for a project.
 * Returns the conversation with the most recent 50 messages.
 */
export const getOrCreateGeneralChat = actionClient
  .schema(getOrCreateGeneralChatSchema)
  .action(async ({ parsedInput: { projectId }, ctx: { userId } }) => {
    const member = await getCurrentMember(projectId)
    const scoped = scopedPrisma(projectId)

    let conversation = await scoped.conversation.findFirst({
      where: { conversationType: "GENERAL_CHAT" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          projectId,
          conversationType: "GENERAL_CHAT",
          title: "Project Chat",
          createdById: member.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 50,
          },
        },
      })
    }

    return conversation
  })

/**
 * Create a new task-specific conversation.
 */
export const createConversation = actionClient
  .schema(createConversationSchema)
  .action(
    async ({
      parsedInput: { projectId, conversationType, title, sessionLogId },
    }) => {
      const member = await getCurrentMember(projectId)

      const conversation = await prisma.conversation.create({
        data: {
          projectId,
          conversationType: conversationType as ConversationType,
          title: title ?? `${conversationType.replace(/_/g, " ").toLowerCase()} session`,
          createdById: member.id,
          sessionLogId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      })

      return conversation
    }
  )

/**
 * Fetch a conversation with all messages. Verifies project scope.
 */
export const getConversation = actionClient
  .schema(getConversationSchema)
  .action(async ({ parsedInput: { conversationId, projectId } }) => {
    // Verify membership
    await getCurrentMember(projectId)
    const scoped = scopedPrisma(projectId)

    const conversation = await scoped.conversation.findFirst({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        sessionLog: true,
      },
    })

    if (!conversation) {
      throw new Error("Conversation not found")
    }

    return conversation
  })

/**
 * List all conversations for a project, ordered by most recently updated.
 */
export const getConversations = actionClient
  .schema(getConversationsSchema)
  .action(async ({ parsedInput: { projectId, includeArchived } }) => {
    await getCurrentMember(projectId)
    const scoped = scopedPrisma(projectId)

    const conversations = await scoped.conversation.findMany({
      where: {
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
      },
    })

    return conversations
  })

/**
 * Get aggregate token usage and cost for a conversation session.
 * Sums inputTokens + outputTokens and cost across all ChatMessage records.
 */
const getSessionTokenTotalsSchema = z.object({
  projectId: z.string().min(1),
  conversationId: z.string().min(1),
})

export const getSessionTokenTotals = actionClient
  .schema(getSessionTokenTotalsSchema)
  .action(async ({ parsedInput: { projectId, conversationId } }) => {
    await getCurrentMember(projectId)

    const result = await prisma.chatMessage.aggregate({
      where: { conversationId },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
    })

    return {
      totalTokens: (result._sum.inputTokens ?? 0) + (result._sum.outputTokens ?? 0),
      totalCost: result._sum.cost ?? 0,
    }
  })

// ============================================================================
// Conversation Lifecycle (Archive, Rename)
// ============================================================================

const archiveConversationSchema = z.object({
  projectId: z.string().min(1),
  conversationId: z.string().min(1),
})

/**
 * Archive a conversation — hides it from the default conversation list.
 * Archived conversations can be restored via unarchiveConversation.
 */
export const archiveConversation = actionClient
  .schema(archiveConversationSchema)
  .action(async ({ parsedInput: { projectId, conversationId } }) => {
    await getCurrentMember(projectId)
    const scoped = scopedPrisma(projectId)

    const conversation = await scoped.conversation.findFirst({
      where: { id: conversationId },
    })
    if (!conversation) throw new Error("Conversation not found")

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { isArchived: true },
    })

    return updated
  })

const unarchiveConversationSchema = z.object({
  projectId: z.string().min(1),
  conversationId: z.string().min(1),
})

/**
 * Unarchive a conversation — restores it to the default conversation list.
 */
export const unarchiveConversation = actionClient
  .schema(unarchiveConversationSchema)
  .action(async ({ parsedInput: { projectId, conversationId } }) => {
    await getCurrentMember(projectId)
    const scoped = scopedPrisma(projectId)

    const conversation = await scoped.conversation.findFirst({
      where: { id: conversationId },
    })
    if (!conversation) throw new Error("Conversation not found")

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { isArchived: false },
    })

    return updated
  })

const renameConversationSchema = z.object({
  projectId: z.string().min(1),
  conversationId: z.string().min(1),
  title: z.string().min(1).max(100),
})

/**
 * Rename a conversation title.
 */
export const renameConversation = actionClient
  .schema(renameConversationSchema)
  .action(async ({ parsedInput: { projectId, conversationId, title } }) => {
    await getCurrentMember(projectId)
    const scoped = scopedPrisma(projectId)

    const conversation = await scoped.conversation.findFirst({
      where: { id: conversationId },
    })
    if (!conversation) throw new Error("Conversation not found")

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    })

    return updated
  })

// ============================================================================
// Story Session
// ============================================================================

const initiateStorySessionSchema = z.object({
  projectId: z.string().min(1),
  epicId: z.string().min(1),
  featureId: z.string().optional(),
})

/**
 * Create a STORY_SESSION conversation for AI story generation (WORK-06).
 * Called from the "Generate Stories" context menu on epic/feature pages.
 * Returns the conversationId for redirect to chat page.
 *
 * Note: epicId/featureId are passed as URL search params to the chat page
 * rather than stored in conversation metadata (Conversation model has no
 * metadata field). The conversation title encodes the scope for display.
 */
export const initiateStorySession = actionClient
  .schema(initiateStorySessionSchema)
  .action(async ({ parsedInput: { projectId, epicId, featureId } }) => {
    const member = await getCurrentMember(projectId)

    // Look up epic name for a descriptive title
    const epic = await prisma.epic.findUnique({
      where: { id: epicId },
      select: { name: true, prefix: true },
    })
    const epicLabel = epic ? `${epic.prefix}: ${epic.name}` : "Epic"

    const conversation = await prisma.conversation.create({
      data: {
        projectId,
        conversationType: "STORY_SESSION",
        title: `AI Story Generation - ${epicLabel}`,
        createdById: member.id,
        metadata: { epicId, ...(featureId && { featureId }) },
      },
    })

    return { conversationId: conversation.id, epicId, featureId }
  })

// ============================================================================
// Briefing Session
// ============================================================================

const initiateBriefingSessionSchema = z.object({
  projectId: z.string().min(1),
})

/**
 * Create a BRIEFING_SESSION conversation for AI project briefing generation.
 * Called from the "Generate Briefing" button on the dashboard.
 * Returns the conversationId for redirect to chat page.
 */
export const initiateBriefingSession = actionClient
  .schema(initiateBriefingSessionSchema)
  .action(async ({ parsedInput: { projectId } }) => {
    const member = await getCurrentMember(projectId)

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    const conversation = await prisma.conversation.create({
      data: {
        projectId,
        conversationType: "BRIEFING_SESSION",
        title: `Project Briefing — ${dateStr}`,
        createdById: member.id,
      },
    })

    return { conversationId: conversation.id }
  })

// ============================================================================
// Enrichment Session
// ============================================================================

const initiateEnrichmentSessionSchema = z.object({
  projectId: z.string().min(1),
  storyId: z.string().min(1),
})

/**
 * Create an ENRICHMENT_SESSION conversation for AI story enrichment.
 * Called from the "Enrich with AI" button on story detail pages.
 * Returns the conversationId for redirect to chat page.
 */
export const initiateEnrichmentSession = actionClient
  .schema(initiateEnrichmentSessionSchema)
  .action(async ({ parsedInput: { projectId, storyId } }) => {
    const member = await getCurrentMember(projectId)

    // Look up story title for a descriptive conversation title
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { title: true, displayId: true },
    })
    const storyLabel = story ? `${story.displayId}: ${story.title}` : "Story"

    const conversation = await prisma.conversation.create({
      data: {
        projectId,
        conversationType: "ENRICHMENT_SESSION",
        title: `Enrich — ${storyLabel}`,
        createdById: member.id,
        metadata: { storyId },
      },
    })

    return { conversationId: conversation.id, storyId }
  })

// ============================================================================
// Messages
// ============================================================================

/**
 * Persist a chat message to the database.
 * For AI messages, stores inputTokens, outputTokens, and cost.
 */
export const saveMessage = actionClient
  .schema(saveMessageSchema)
  .action(
    async ({
      parsedInput: {
        conversationId,
        role,
        content,
        inputTokens,
        outputTokens,
        cost,
      },
    }) => {
      const message = await prisma.chatMessage.create({
        data: {
          conversationId,
          role: role as ChatMessageRole,
          content,
          inputTokens,
          outputTokens,
          cost,
        },
      })

      // Update conversation's updatedAt timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })

      return message
    }
  )
