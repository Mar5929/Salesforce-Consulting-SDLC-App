import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import {
  assembleGeneralChatContext,
  buildChatSystemPrompt,
} from "@/lib/agent-harness/context/chat-context"
import { calculateCost, DEFAULT_MODEL } from "@/lib/config/ai-pricing"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    // Authenticate via Clerk (T-02-09)
    const { userId } = await auth()
    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { messages, projectId, conversationId } = body

    if (!projectId || !conversationId) {
      return new Response("Missing projectId or conversationId", {
        status: 400,
      })
    }

    // Verify project membership (T-02-09, T-02-10)
    const member = await getCurrentMember(projectId)

    // Verify conversation belongs to this project (T-02-10)
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, projectId },
    })
    if (!conversation) {
      return new Response("Conversation not found", { status: 404 })
    }

    // Save the user's message to DB
    const lastUserMessage = messages[messages.length - 1]
    if (lastUserMessage?.role === "user") {
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "USER",
          content:
            typeof lastUserMessage.content === "string"
              ? lastUserMessage.content
              : JSON.stringify(lastUserMessage.content),
          senderId: member.id,
        },
      })
    }

    // Assemble project context for system prompt (T-02-11)
    const context = await assembleGeneralChatContext(projectId)
    const systemPrompt = buildChatSystemPrompt(context)

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      messages,
      onFinish: async ({ text, totalUsage }) => {
        // Save AI response to DB with token usage
        const inputTokens = totalUsage.inputTokens ?? 0
        const outputTokens = totalUsage.outputTokens ?? 0
        const cost = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens)

        await prisma.chatMessage.create({
          data: {
            conversationId,
            role: "ASSISTANT",
            content: text,
            inputTokens,
            outputTokens,
            cost,
          },
        })

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        })
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[Chat API Error]", error)
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
