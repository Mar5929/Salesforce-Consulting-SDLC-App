import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

/**
 * GET /api/transcripts/[transcriptId]/messages
 *
 * Polling endpoint for transcript processing messages.
 * Used by SWR in the transcript session view to get updated messages.
 *
 * Query params: projectId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transcriptId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json([], { status: 401 })
  }

  const { transcriptId } = await params
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json([], { status: 400 })
  }

  // Verify membership
  const member = await prisma.projectMember.findUnique({
    where: { projectId_clerkUserId: { projectId, clerkUserId: userId } },
  })
  if (!member) {
    return NextResponse.json([], { status: 403 })
  }

  // Verify transcript exists and belongs to this project
  const transcript = await prisma.transcript.findFirst({
    where: { id: transcriptId, projectId },
  })
  if (!transcript) {
    return NextResponse.json([], { status: 404 })
  }

  // Derive conversationId from the transcript's FK instead of trusting client input
  const conversationId = transcript.conversationId
  if (!conversationId) {
    return NextResponse.json([], { status: 404 })
  }

  // Fetch conversation messages
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      projectId,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!conversation) {
    return NextResponse.json([], { status: 404 })
  }

  const messages = conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role.toLowerCase(),
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
    toolCalls: msg.toolCalls,
    inputTokens: msg.inputTokens,
    outputTokens: msg.outputTokens,
    cost: msg.cost,
  }))

  return NextResponse.json(messages)
}
