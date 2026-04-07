"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"

const inviteSchema = z.object({
  projectId: z.string().min(1),
  email: z.string().email("Invalid email address"),
  role: z.enum([
    "SOLUTION_ARCHITECT",
    "DEVELOPER",
    "PM",
    "BA",
    "QA",
  ]),
})

export const inviteTeamMember = actionClient
  .schema(inviteSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Only PM and SOLUTION_ARCHITECT can invite members
    await requireRole(parsedInput.projectId, ["PM", "SOLUTION_ARCHITECT"])

    // Look up Clerk user by email
    const { clerkClient } = await import("@clerk/nextjs/server")
    const clerk = await clerkClient()
    const users = await clerk.users.getUserList({
      emailAddress: [parsedInput.email],
    })

    if (users.data.length === 0) {
      throw new Error("User not found. They must sign up first.")
    }

    const clerkUser = users.data[0]

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: parsedInput.projectId,
        clerkUserId: clerkUser.id,
        status: "ACTIVE",
      },
    })

    if (existingMember) {
      throw new Error("User is already a member of this project.")
    }

    // Create ProjectMember record
    const member = await prisma.projectMember.create({
      data: {
        projectId: parsedInput.projectId,
        clerkUserId: clerkUser.id,
        displayName:
          `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
          parsedInput.email,
        email: parsedInput.email,
        role: parsedInput.role,
        status: "ACTIVE",
      },
    })

    await inngest.send({
      name: EVENTS.PROJECT_MEMBER_INVITED,
      data: {
        projectId: parsedInput.projectId,
        memberId: member.id,
        invitedBy: ctx.userId,
      },
    })

    return { member }
  })

const removeSchema = z.object({
  projectId: z.string().min(1),
  memberId: z.string().min(1),
})

export const removeTeamMember = actionClient
  .schema(removeSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Only PM and SOLUTION_ARCHITECT can remove members
    const callerMember = await requireRole(parsedInput.projectId, [
      "PM",
      "SOLUTION_ARCHITECT",
    ])

    // Verify the target member belongs to the specified project
    const targetMember = await prisma.projectMember.findUnique({
      where: { id: parsedInput.memberId },
    })
    if (!targetMember || targetMember.projectId !== parsedInput.projectId) {
      throw new Error("Member not found in this project")
    }

    // Cannot remove yourself
    if (callerMember.id === parsedInput.memberId) {
      throw new Error("You cannot remove yourself from the project.")
    }

    // Soft delete: set status to REMOVED and removedAt
    await prisma.projectMember.update({
      where: { id: parsedInput.memberId },
      data: {
        status: "REMOVED",
        removedAt: new Date(),
      },
    })

    await inngest.send({
      name: EVENTS.AUDIT_SENSITIVE_OP,
      data: {
        entityType: "ProjectMember",
        entityId: parsedInput.memberId,
        fromStatus: "ACTIVE",
        toStatus: "REMOVED",
        userId: ctx.userId,
        userRole: callerMember.role,
        reason: `Member removed from project ${parsedInput.projectId}`,
      },
    })

    return { success: true }
  })

const updateRoleSchema = z.object({
  projectId: z.string().min(1),
  memberId: z.string().min(1),
  newRole: z.enum([
    "SOLUTION_ARCHITECT",
    "DEVELOPER",
    "PM",
    "BA",
    "QA",
  ]),
})

export const updateMemberRole = actionClient
  .schema(updateRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Only PM and SOLUTION_ARCHITECT can change roles
    await requireRole(parsedInput.projectId, ["PM", "SOLUTION_ARCHITECT"])

    // Get the current member to capture old role
    const currentMember = await prisma.projectMember.findUniqueOrThrow({
      where: { id: parsedInput.memberId },
    })

    // Verify the target member belongs to the specified project
    if (currentMember.projectId !== parsedInput.projectId) {
      throw new Error("Member not found in this project")
    }

    const oldRole = currentMember.role

    // Update the role
    const member = await prisma.projectMember.update({
      where: { id: parsedInput.memberId },
      data: { role: parsedInput.newRole },
    })

    await inngest.send({
      name: EVENTS.PROJECT_MEMBER_ROLE_CHANGED,
      data: {
        projectId: parsedInput.projectId,
        memberId: parsedInput.memberId,
        oldRole,
        newRole: parsedInput.newRole,
        changedBy: ctx.userId,
      },
    })

    return { member }
  })
