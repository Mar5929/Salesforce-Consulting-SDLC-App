/**
 * PATCH /api/v1/stories/:storyId/status
 *
 * Update a story's status with state machine validation.
 * Used by Claude Code to transition stories during development.
 *
 * Body: { status: StoryStatus }
 * Validates transition is legal per TRANSITIONS map (T-04-17).
 * Sends STORY_STATUS_CHANGED Inngest event on success.
 *
 * Rate limit: 30 requests per minute.
 * Auth: API key via x-api-key header (T-04-14).
 * Scope: All queries scoped to API key's project (T-04-16).
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { withApiAuth } from "@/app/api/v1/_lib/api-handler"
import { TRANSITIONS } from "@/lib/story-status-machine"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import type { StoryStatus } from "@/generated/prisma"

const statusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "READY",
    "SPRINT_PLANNED",
    "IN_PROGRESS",
    "IN_REVIEW",
    "QA",
    "DONE",
  ]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  return withApiAuth(
    request,
    async (projectId) => {
      const { storyId } = await params

      // Parse and validate request body
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        )
      }

      const parsed = statusSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid status value", details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const newStatus = parsed.data.status as StoryStatus

      // Load story with project scope enforcement (T-04-16)
      const story = await prisma.story.findFirst({
        where: { id: storyId, projectId },
        select: { id: true, projectId: true, status: true },
      })

      if (!story) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404 }
        )
      }

      // Validate status transition via state machine (T-04-17)
      // API key transitions bypass role checks (Claude Code is a system actor)
      const validTransitions = TRANSITIONS[story.status as StoryStatus] || []
      if (!validTransitions.includes(newStatus)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${story.status} to ${newStatus}`,
            currentStatus: story.status,
            validTransitions,
          },
          { status: 400 }
        )
      }

      // Update story status
      const updated = await prisma.story.update({
        where: { id: storyId },
        data: { status: newStatus },
        select: { id: true, status: true, updatedAt: true },
      })

      // Send Inngest event for notification dispatch
      await inngest.send({
        name: EVENTS.STORY_STATUS_CHANGED,
        data: {
          projectId,
          storyId,
          previousStatus: story.status,
          newStatus,
        },
      })

      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      })
    },
    30 // Rate limit: 30 per minute
  )
}
