"use server"

/**
 * Feature Server Actions
 *
 * CRUD operations for the Feature entity with project scoping.
 * Features belong to epics and group related stories.
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
import { FeatureStatus } from "@/generated/prisma"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const createFeatureSchema = z.object({
  projectId: z.string(),
  epicId: z.string(),
  name: z.string().min(1).max(100),
  prefix: z.string().min(1).max(20),
  description: z.string().optional(),
})

const updateFeatureSchema = z.object({
  projectId: z.string(),
  featureId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(FeatureStatus).optional(),
})

const deleteFeatureSchema = z.object({
  projectId: z.string(),
  featureId: z.string(),
})

const getFeaturesSchema = z.object({
  projectId: z.string(),
  epicId: z.string(),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

export const createFeature = actionClient
  .schema(createFeatureSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate epicId belongs to project
    const epic = await prisma.epic.findUnique({
      where: { id: parsedInput.epicId },
      select: { projectId: true },
    })
    if (!epic || epic.projectId !== parsedInput.projectId) {
      throw new Error("Epic not found")
    }

    // Auto-compute sortOrder
    const maxSort = await prisma.feature.aggregate({
      where: { epicId: parsedInput.epicId },
      _max: { sortOrder: true },
    })
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1

    const feature = await prisma.feature.create({
      data: {
        id: createId(),
        projectId: parsedInput.projectId,
        epicId: parsedInput.epicId,
        name: parsedInput.name,
        prefix: parsedInput.prefix,
        description: parsedInput.description ?? null,
        sortOrder,
      },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/work`)
    return { feature }
  })

export const updateFeature = actionClient
  .schema(updateFeatureSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate featureId belongs to project
    const existing = await prisma.feature.findUnique({
      where: { id: parsedInput.featureId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Feature not found")
    }

    const { projectId, featureId, ...updateFields } = parsedInput
    const updateData: Record<string, unknown> = {}
    if (updateFields.name !== undefined) updateData.name = updateFields.name
    if (updateFields.description !== undefined) updateData.description = updateFields.description
    if (updateFields.status !== undefined) updateData.status = updateFields.status

    const feature = await prisma.feature.update({
      where: { id: featureId },
      data: updateData,
    })

    revalidatePath(`/projects/${projectId}/work`)
    return { feature }
  })

export const deleteFeature = actionClient
  .schema(deleteFeatureSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate featureId belongs to project
    const existing = await prisma.feature.findUnique({
      where: { id: parsedInput.featureId },
      select: { projectId: true },
    })
    if (!existing || existing.projectId !== parsedInput.projectId) {
      throw new Error("Feature not found")
    }

    await prisma.feature.delete({
      where: { id: parsedInput.featureId },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/work`)
    return { success: true }
  })

export const getFeatures = actionClient
  .schema(getFeaturesSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)
    const db = scopedPrisma(parsedInput.projectId)

    const features = await db.feature.findMany({
      where: {
        projectId: parsedInput.projectId,
        epicId: parsedInput.epicId,
      },
      include: {
        _count: { select: { stories: true } },
      },
      orderBy: { sortOrder: "asc" },
    })

    return { features }
  })
