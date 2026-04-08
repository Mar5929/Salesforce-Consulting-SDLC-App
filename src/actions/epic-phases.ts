"use server"

/**
 * Epic Phase Server Actions
 *
 * Manage the phase grid for epics (DISCOVERY, DESIGN, BUILD, TEST, DEPLOY).
 * All actions use next-safe-action for Zod validation and auth middleware.
 * Revalidates /projects/{projectId}/roadmap on mutations.
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"
import { createId } from "@paralleldrive/cuid2"
import { EpicPhaseType, EpicPhaseStatus } from "@/generated/prisma"

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const PHASE_SORT_ORDER: Record<EpicPhaseType, number> = {
  DISCOVERY: 1,
  DESIGN: 2,
  BUILD: 3,
  TEST: 4,
  DEPLOY: 5,
}

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const updateEpicPhaseStatusSchema = z.object({
  projectId: z.string(),
  epicId: z.string(),
  phase: z.nativeEnum(EpicPhaseType),
  status: z.nativeEnum(EpicPhaseStatus),
})

const getEpicPhaseGridSchema = z.object({
  projectId: z.string(),
})

const initializeEpicPhasesSchema = z.object({
  projectId: z.string(),
  epicId: z.string(),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

export const updateEpicPhaseStatus = actionClient
  .schema(updateEpicPhaseStatusSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate epic belongs to project
    const epic = await prisma.epic.findUnique({
      where: { id: parsedInput.epicId },
      select: { projectId: true },
    })
    if (!epic || epic.projectId !== parsedInput.projectId) {
      throw new Error("Epic not found")
    }

    // Upsert: update if exists, create if not
    const epicPhase = await prisma.epicPhase.upsert({
      where: {
        epicId_phase: {
          epicId: parsedInput.epicId,
          phase: parsedInput.phase,
        },
      },
      update: {
        status: parsedInput.status,
      },
      create: {
        id: createId(),
        epicId: parsedInput.epicId,
        phase: parsedInput.phase,
        status: parsedInput.status,
        sortOrder: PHASE_SORT_ORDER[parsedInput.phase],
      },
    })

    revalidatePath(`/projects/${parsedInput.projectId}/roadmap`)
    return { epicPhase }
  })

export const getEpicPhaseGrid = actionClient
  .schema(getEpicPhaseGridSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)
    const db = scopedPrisma(parsedInput.projectId)

    const epics = await db.epic.findMany({
      where: { projectId: parsedInput.projectId },
      include: {
        phases: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    return { epics }
  })

export const initializeEpicPhases = actionClient
  .schema(initializeEpicPhasesSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    // Validate epic belongs to project
    const epic = await prisma.epic.findUnique({
      where: { id: parsedInput.epicId },
      select: { projectId: true },
    })
    if (!epic || epic.projectId !== parsedInput.projectId) {
      throw new Error("Epic not found")
    }

    const phases: EpicPhaseType[] = [
      "DISCOVERY",
      "DESIGN",
      "BUILD",
      "TEST",
      "DEPLOY",
    ]

    const result = await prisma.epicPhase.createMany({
      data: phases.map((phase) => ({
        id: createId(),
        epicId: parsedInput.epicId,
        phase,
        status: "NOT_STARTED" as const,
        sortOrder: PHASE_SORT_ORDER[phase],
      })),
      skipDuplicates: true,
    })

    revalidatePath(`/projects/${parsedInput.projectId}/roadmap`)
    return { created: result.count }
  })
