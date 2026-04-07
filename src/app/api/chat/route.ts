import { anthropic } from "@ai-sdk/anthropic"
import { streamText, tool, convertToModelMessages } from "ai"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import {
  assembleGeneralChatContext,
  buildChatSystemPrompt,
} from "@/lib/agent-harness/context/chat-context"
import { calculateCost, DEFAULT_MODEL } from "@/lib/config/ai-pricing"
import { getStoriesContext } from "@/lib/agent-harness/context/stories-context"
import { getProjectSummary } from "@/lib/agent-harness/context/project-summary"

export const maxDuration = 60

/**
 * Build system prompt for STORY_SESSION conversations.
 * Assembles project + stories context and injects into the story generation prompt.
 */
async function buildStorySessionPrompt(
  projectId: string,
  epicId: string,
  featureId?: string
): Promise<string> {
  const [projectSummary, storiesContext] = await Promise.all([
    getProjectSummary(projectId),
    getStoriesContext({ projectId, epicId, featureId }),
  ])

  const context = `${projectSummary}\n\n${storiesContext}`

  return `You are an AI assistant helping a Salesforce consulting team generate user stories from project discovery context.

## Project Context
${context}

## Your Task
Analyze the provided requirements, questions, decisions, and knowledge articles. Generate user story drafts that cover the requirements not already addressed by existing stories.

## Story Generation Guidelines
- Each story should have a clear, concise title
- Include a persona (As a [role]...) when the user role is clear from context
- Write descriptions in user story format: "As a [persona], I want [goal] so that [benefit]"
- Write acceptance criteria in Given/When/Then format
- Estimate story points using Fibonacci scale: 1, 2, 3, 5, 8, 13
- Assign priority: CRITICAL for blockers, HIGH for core functionality, MEDIUM for standard work, LOW for nice-to-haves
- Identify impacted Salesforce components (objects, flows, triggers, classes, LWC, etc.) with CREATE/MODIFY/DELETE impact type
- Provide clear reasoning for why each story is needed based on the requirements and context

## Rules
- DO NOT generate duplicate stories -- carefully check the "Existing Stories" list above
- If a requirement is already fully covered by existing stories, skip it
- If a requirement is partially covered, generate stories only for the uncovered parts
- When unsure about scope or acceptance criteria, call the tool anyway but note the uncertainty in the reasoning field
- After proposing all drafts, provide a brief summary of what was generated and ask if the user wants more stories, modifications, or has specific areas to focus on

## Tool Usage
Call the \`create_story_draft\` tool for each proposed story. Do not describe stories in text -- use the tool so they appear as reviewable cards.`
}

export async function POST(request: Request) {
  try {
    // Authenticate via Clerk (T-02-09)
    const { userId } = await auth()
    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { messages, projectId, conversationId, epicId, featureId } = body

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
      // AI SDK v6 UIMessage uses `parts` array instead of `content`
      const content =
        typeof lastUserMessage.content === "string"
          ? lastUserMessage.content
          : Array.isArray(lastUserMessage.parts)
            ? lastUserMessage.parts
                .filter((p: { type: string }) => p.type === "text")
                .map((p: { text: string }) => p.text)
                .join("")
            : JSON.stringify(lastUserMessage.content ?? "")
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "USER",
          content,
          senderId: member.id,
        },
      })
    }

    // Determine system prompt based on conversation type
    let systemPrompt: string

    // Resolve epicId/featureId: prefer request body, fall back to persisted metadata
    const meta = (conversation.metadata ?? {}) as Record<string, string | undefined>
    const resolvedEpicId = epicId ?? meta.epicId
    const resolvedFeatureId = featureId ?? meta.featureId

    if (conversation.conversationType === "STORY_SESSION" && resolvedEpicId) {
      // Story generation session: use story generation task's prompt with context
      systemPrompt = await buildStorySessionPrompt(
        projectId,
        resolvedEpicId,
        resolvedFeatureId || undefined
      )
    } else {
      // General chat: use standard context assembly (T-02-11)
      const context = await assembleGeneralChatContext(projectId)
      systemPrompt = buildChatSystemPrompt(context)
    }

    // Configure tools based on conversation type
    const isStorySession = conversation.conversationType === "STORY_SESSION"

    const storyDraftTool = tool({
      description:
        "Propose a new user story draft for the user to review. Include title, persona, description, acceptance criteria, estimated story points, priority, and impacted Salesforce components.",
      inputSchema: z.object({
        title: z.string().describe("Story title"),
        persona: z.string().optional().describe("User persona, e.g. 'Sales Manager'"),
        description: z.string().describe("Story description in user story format"),
        acceptanceCriteria: z.string().describe("Acceptance criteria in Given/When/Then format"),
        storyPoints: z.number().int().min(1).max(13).optional().describe("Fibonacci estimate: 1,2,3,5,8,13"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
        components: z.array(z.object({
          componentName: z.string().describe("Salesforce component API name"),
          impactType: z.enum(["CREATE", "MODIFY", "DELETE"]),
        })).optional().describe("Impacted Salesforce components"),
        reasoning: z.string().describe("Why this story is needed based on the requirements/context"),
      }),
    })

    // Convert UIMessages (with `parts`) from the client to ModelMessages
    // (with `content`) that streamText expects
    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      messages: modelMessages,
      ...(isStorySession
        ? { tools: { create_story_draft: storyDraftTool } }
        : {}),
      onFinish: async ({ text, totalUsage, toolCalls }) => {
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
            // Store tool calls in JSON for draft card rendering (T-03-08)
            toolCalls: toolCalls && toolCalls.length > 0
              ? JSON.parse(JSON.stringify(toolCalls))
              : undefined,
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
