"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { generateApiKey } from "@/lib/api-keys/generate"

/**
 * Generate a new API key for project-scoped REST API access.
 * Only SA or PM roles can generate keys (D-15, T-04-18).
 * Returns the raw key once — it is never stored or retrievable again.
 */
export const generateApiKeyAction = actionClient
  .schema(
    z.object({
      projectId: z.string(),
      name: z.string().min(1, "Name is required").max(50, "Name too long"),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, name } = parsedInput

    // Verify SA or PM role
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        clerkUserId: ctx.userId,
        role: { in: ["SOLUTION_ARCHITECT", "PM"] },
      },
    })

    if (!member) {
      throw new Error(
        "Only Solution Architects and Project Managers can generate API keys"
      )
    }

    // Generate API key (bcrypt hash for storage, raw key shown once)
    const { rawKey, keyPrefix, keyHash } = await generateApiKey(projectId)

    // Create API key record
    const apiKey = await prisma.apiKey.create({
      data: {
        projectId,
        memberId: member.id,
        name,
        keyPrefix,
        keyHash,
      },
      select: { id: true, name: true },
    })

    return { rawKey, id: apiKey.id, name: apiKey.name }
  })

/**
 * Revoke an API key, immediately disabling access.
 * Only SA or PM roles can revoke keys (D-15).
 */
export const revokeApiKeyAction = actionClient
  .schema(
    z.object({
      apiKeyId: z.string(),
      projectId: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { apiKeyId, projectId } = parsedInput

    // Verify SA or PM role
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        clerkUserId: ctx.userId,
        role: { in: ["SOLUTION_ARCHITECT", "PM"] },
      },
    })

    if (!member) {
      throw new Error(
        "Only Solution Architects and Project Managers can revoke API keys"
      )
    }

    // Verify the key belongs to this project
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: apiKeyId, projectId, isActive: true },
    })

    if (!apiKey) {
      throw new Error("API key not found or already revoked")
    }

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false, revokedAt: new Date() },
    })

    return { success: true }
  })

/**
 * List active API keys for a project.
 * Any project member can view keys (prefix only, not full key).
 */
export const listApiKeys = actionClient
  .schema(z.object({ projectId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { projectId } = parsedInput

    // Verify project membership
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        clerkUserId: ctx.userId,
        status: "ACTIVE",
      },
    })

    if (!member) {
      throw new Error("Not a member of this project")
    }

    const keys = await prisma.apiKey.findMany({
      where: { projectId, isActive: true },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        useCount: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return keys
  })
