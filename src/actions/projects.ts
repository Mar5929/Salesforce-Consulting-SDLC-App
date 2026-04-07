"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { getCurrentMember, requireRole } from "@/lib/auth"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"
import { createId } from "@paralleldrive/cuid2"

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  clientName: z.string().min(1, "Client name is required").max(100),
  engagementType: z.enum([
    "GREENFIELD",
    "BUILD_PHASE",
    "MANAGED_SERVICES",
    "RESCUE_TAKEOVER",
  ]),
  startDate: z.string().min(1, "Start date is required"),
  targetEndDate: z.string().optional(),
  sandboxStrategy: z.string().optional(),
  teamMembers: z
    .array(
      z.object({
        email: z.string().email("Invalid email address"),
        role: z.enum([
          "SOLUTION_ARCHITECT",
          "DEVELOPER",
          "PM",
          "BA",
          "QA",
        ]),
      })
    )
    .optional(),
})

export const createProject = actionClient
  .schema(createProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const projectId = createId()

    const project = await prisma.project.create({
      data: {
        id: projectId,
        name: parsedInput.name,
        clientName: parsedInput.clientName,
        engagementType: parsedInput.engagementType,
        startDate: new Date(parsedInput.startDate),
        targetEndDate: parsedInput.targetEndDate
          ? new Date(parsedInput.targetEndDate)
          : null,
        sandboxStrategy: parsedInput.sandboxStrategy ?? null,
        status: "ACTIVE",
        currentPhase: "DISCOVERY",
      },
    })

    // Import Clerk backend to look up user profiles
    const { clerkClient } = await import("@clerk/nextjs/server")
    const clerk = await clerkClient()

    // Fetch creator's Clerk profile for display name and email
    const creatorUser = await clerk.users.getUser(ctx.userId)

    // Create ProjectMember record for the creating user
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        clerkUserId: ctx.userId,
        displayName:
          `${creatorUser.firstName ?? ""} ${creatorUser.lastName ?? ""}`.trim() ||
          creatorUser.emailAddresses[0]?.emailAddress ||
          "",
        email: creatorUser.emailAddresses[0]?.emailAddress || "",
        role: "SOLUTION_ARCHITECT",
        status: "ACTIVE",
      },
    })

    // Create ProjectMember records for invited team members
    if (parsedInput.teamMembers && parsedInput.teamMembers.length > 0) {

      for (const member of parsedInput.teamMembers) {
        const users = await clerk.users.getUserList({
          emailAddress: [member.email],
        })

        if (users.data.length > 0) {
          const clerkUser = users.data[0]
          await prisma.projectMember.create({
            data: {
              projectId: project.id,
              clerkUserId: clerkUser.id,
              displayName:
                `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
                member.email,
              email: member.email,
              role: member.role,
              status: "ACTIVE",
            },
          })
        }
      }
    }

    await inngest.send({
      name: EVENTS.PROJECT_CREATED,
      data: { projectId: project.id, userId: ctx.userId },
    })

    redirect(`/projects/${project.id}`)
  })

const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  clientName: z.string().min(1).max(100).optional(),
  engagementType: z
    .enum(["GREENFIELD", "BUILD_PHASE", "MANAGED_SERVICES", "RESCUE_TAKEOVER"])
    .optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  sandboxStrategy: z.string().optional(),
})

export const updateProject = actionClient
  .schema(updateProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Restrict project settings updates to PM and SA only
    await requireRole(parsedInput.projectId, ["PM", "SOLUTION_ARCHITECT"])

    const updateData: Record<string, unknown> = {}

    if (parsedInput.name !== undefined) updateData.name = parsedInput.name
    if (parsedInput.clientName !== undefined)
      updateData.clientName = parsedInput.clientName
    if (parsedInput.engagementType !== undefined)
      updateData.engagementType = parsedInput.engagementType
    if (parsedInput.startDate !== undefined)
      updateData.startDate = new Date(parsedInput.startDate)
    if (parsedInput.targetEndDate !== undefined)
      updateData.targetEndDate = parsedInput.targetEndDate
        ? new Date(parsedInput.targetEndDate)
        : null
    if (parsedInput.sandboxStrategy !== undefined)
      updateData.sandboxStrategy = parsedInput.sandboxStrategy || null

    const project = await prisma.project.update({
      where: { id: parsedInput.projectId },
      data: updateData,
    })

    return { project }
  })
