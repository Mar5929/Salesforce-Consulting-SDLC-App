"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"

const archiveProjectSchema = z.object({
  projectId: z.string(),
})

/**
 * Archive a project, making it read-only.
 * T-05-18: Restricted to PM role. Sprint completion check prevents
 * archiving active sprints.
 * T-05-19: Archive event emitted to Inngest. Notifications sent to all members.
 */
export const archiveProject = actionClient
  .schema(archiveProjectSchema)
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput

    // T-05-18: Verify PM role
    const member = await requireRole(projectId, ["PM"])

    // Check for active sprints
    const activeSprints = await prisma.sprint.findMany({
      where: {
        projectId,
        status: "ACTIVE",
      },
      select: { id: true },
    })

    if (activeSprints.length > 0) {
      throw new Error(
        "Active sprints must be completed or cancelled first."
      )
    }

    // Check project is not already archived
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { status: true },
    })

    if (project.status === "ARCHIVED") {
      throw new Error("Project is already archived.")
    }

    // Update project status to ARCHIVED
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { status: "ARCHIVED" },
    })

    // Get all active members for notification
    const activeMembers = await prisma.projectMember.findMany({
      where: { projectId, status: "ACTIVE" },
      select: { id: true },
    })

    // T-05-19: Emit archive event
    await inngest.send({
      name: EVENTS.PROJECT_ARCHIVED,
      data: { projectId },
    })

    // Send notification to all team members
    await inngest.send({
      name: EVENTS.NOTIFICATION_SEND,
      data: {
        projectId,
        type: "AI_PROCESSING_COMPLETE", // Using existing type for project lifecycle
        title: "Project archived",
        body: `Project "${updated.name}" has been archived and is now read-only.`,
        entityType: "PROJECT",
        entityId: projectId,
        actorMemberId: member.id,
        recipientMemberIds: activeMembers.map((m) => m.id),
      },
    })

    return updated
  })

const reactivateProjectSchema = z.object({
  projectId: z.string(),
})

/**
 * Reactivate an archived project.
 * T-05-18: Restricted to PM role.
 * T-05-19: Reactivate event emitted. Notifications sent to all members.
 */
export const reactivateProject = actionClient
  .schema(reactivateProjectSchema)
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput

    // T-05-18: Verify PM role
    const member = await requireRole(projectId, ["PM"])

    // Check project is actually archived
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { status: true },
    })

    if (project.status !== "ARCHIVED") {
      throw new Error("Project is not archived.")
    }

    // Update project status to ACTIVE
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { status: "ACTIVE" },
    })

    // Get all active members for notification
    const activeMembers = await prisma.projectMember.findMany({
      where: { projectId, status: "ACTIVE" },
      select: { id: true },
    })

    // T-05-19: Emit reactivate event
    await inngest.send({
      name: EVENTS.PROJECT_REACTIVATED,
      data: { projectId },
    })

    // Send notification to all team members
    await inngest.send({
      name: EVENTS.NOTIFICATION_SEND,
      data: {
        projectId,
        type: "AI_PROCESSING_COMPLETE",
        title: "Project reactivated",
        body: `Project "${updated.name}" has been reactivated and is now editable.`,
        entityType: "PROJECT",
        entityId: projectId,
        actorMemberId: member.id,
        recipientMemberIds: activeMembers.map((m) => m.id),
      },
    })

    return updated
  })
