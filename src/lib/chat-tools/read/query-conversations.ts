import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryConversationsTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_conversations: tool({
      description: "Search for conversations. Returns summary fields. Use get_conversation for full details.",
      inputSchema: z.object({
        conversationType: z.enum(["GENERAL_CHAT", "TRANSCRIPT_SESSION", "STORY_SESSION", "BRIEFING_SESSION", "QUESTION_SESSION", "ENRICHMENT_SESSION"]).optional(),
        status: z.enum(["ACTIVE", "COMPLETE", "FAILED"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ conversationType, status, limit }) => {
        try {
          const conversations = await scoped.conversation.findMany({
            where: {
              ...(conversationType && { conversationType }),
              ...(status && { status }),
            },
            select: {
              id: true,
              title: true,
              conversationType: true,
              status: true,
              updatedAt: true,
            },
            take: limit,
            orderBy: { updatedAt: "desc" },
          })
          return { success: true, count: conversations.length, conversations }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_conversation: tool({
      description: "Get details of a single conversation by ID.",
      inputSchema: z.object({
        conversationId: z.string().describe("The conversation ID"),
      }),
      execute: async ({ conversationId }) => {
        try {
          const conversation = await scoped.conversation.findUnique({
            where: { id: conversationId },
            select: {
              id: true,
              title: true,
              conversationType: true,
              status: true,
              metadata: true,
              createdAt: true,
            },
          })
          if (!conversation) return { success: false, error: "Conversation not found" }
          return { success: true, conversation }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
