"use server"

/**
 * Epic Server Actions
 *
 * CRUD operations for the Epic entity with project scoping.
 * All actions use next-safe-action for Zod validation and auth middleware.
 * All DB operations use scopedPrisma for project isolation (T-03-02).
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import { createId } from "@paralleldrive/cuid2"
import { EpicStatus } from "@/generated/prisma"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const createEpicSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  prefix: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/),
  description: z.string().optional(),
})

const updateEpicSchema = z.object({
  projectId: z.string(),
  epicId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(EpicStatus).optional(),
})

const deleteEpicSchema = z.object({
  projectId: z.string(),
  epicId: z.string(),
})

const getEpicsSchema = z.object({
  projectId: z.string(),
})

const getEpicSchema = z.object({
  projectId: z.string(),
  epicId: z.string(),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

export const createEpic = actionClient
  .schema(createEpicSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Auto-compute sortOrder as max existing + 1
    const maxSort = await prisma.epic.aggregate({
      where: { projectId: parsedInput.projectId },
      _max: { sortOrder: true },
    })
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1

    const epic = await prisma.epic.create({
      data: {
        id: createId(),
        projectId: parsedInput.projectId,
        name: parsedInput.name,
        prefix: parsedInput.prefix,
        description: parsedInput.description ?? null,
        sortOrder,
      },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/work`)
    return { epic }
  })

export const updateEpic = actionClient
  .schema(updateEpicSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate epicId belongs to project
    const existing = await prisma.epic.findUnique({
      where: { id: parsedInput.epicId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Epic not found")
    }

    const { projectId, epicId, ...updateFields } = parsedInput
    const updateData: Record<string, unknown> = {}
    if (updateFields.name !== undefined) updateData.name = updateFields.name
    if (updateFields.description !== undefined) updateData.description = updateFields.description
    if (updateFields.status !== undefined) updateData.status = updateFields.status

    const epic = await prisma.epic.update({
      where: { id: epicId },
      data: updateData,
    })

    revalidatePath(`/projects/${projectId}/work`)
    return { epic }
  })

export const deleteEpic = actionClient
  .schema(deleteEpicSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate epicId belongs to project
    const existing = await prisma.epic.findUnique({
      where: { id: parsedInput.epicId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Epic not found")
    }

    // Cascade delete: Prisma onDelete: Cascade handles features and stories
    await prisma.epic.delete({
      where: { id: parsedInput.epicId },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/work`)
    return { success: true }
  })

export const getEpics = actionClient
  .schema(getEpicsSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)
    const db = scopedPrisma(parsedInput.projectId)

    const epics = await db.epic.findMany({
      where: { projectId: parsedInput.projectId },
      include: {
        _count: {
          select: { features: true, stories: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    return { epics }
  })

export const getEpic = actionClient
  .schema(getEpicSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    const epic = await prisma.epic.findUnique({
      where: { id: parsedInput.epicId },
      include: {
        features: {
          include: {
            _count: { select: { stories: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { stories: true },
        },
      },
    })

    if (!epic || epic.projectId !== parsedInput.projectId) {
      throw new Error("Epic not found")
    }

    return { epic }
  })
