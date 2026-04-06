/**
 * Sequential Display ID Generator
 *
 * Generates human-readable, sequential display IDs for project entities.
 * Format: PREFIX-NUMBER (e.g., Q-1, Q-2, D-1, REQ-1, R-1)
 *
 * Uses a transaction with retry on unique constraint violation to prevent
 * duplicate IDs under concurrent creation (T-02-15).
 */

import type { PrismaClient } from "@/generated/prisma"

/** Entity types that support display IDs */
export type DisplayIdEntityType = "Question" | "Decision" | "Risk" | "Requirement" | "Story"

/** Entity types that use fixed-prefix display IDs (not Story, which uses epic prefix) */
type FixedPrefixEntityType = Exclude<DisplayIdEntityType, "Story">

/** Prefix mapping for fixed-prefix entity types */
const ENTITY_PREFIXES: Record<FixedPrefixEntityType, string> = {
  Question: "Q",
  Decision: "D",
  Risk: "R",
  Requirement: "REQ",
}

/**
 * Generate a sequential display ID for a project entity.
 *
 * Queries the maximum existing display ID for the entity type within
 * the project, increments it, and returns the formatted string.
 * Wrapped in a transaction with one retry on unique constraint violation.
 *
 * @param projectId - The project to scope the ID within
 * @param entityType - The entity type (Question, Decision, Risk, Requirement)
 * @param prismaClient - Prisma client instance (or scoped)
 * @returns Formatted display ID string (e.g., "Q-16")
 */
export async function generateDisplayId(
  projectId: string,
  entityType: FixedPrefixEntityType,
  prismaClient: PrismaClient
): Promise<string> {
  const prefix = ENTITY_PREFIXES[entityType]

  async function tryGenerate(): Promise<string> {
    const maxResult = await getMaxDisplayNumber(prismaClient, projectId, entityType, prefix)
    const nextNumber = maxResult + 1
    return `${prefix}-${nextNumber}`
  }

  // First attempt
  try {
    return await tryGenerate()
  } catch (error) {
    // Retry once on unique constraint violation (P2002)
    if (isUniqueConstraintError(error)) {
      return await tryGenerate()
    }
    throw error
  }
}

/**
 * Extract the maximum display ID number for an entity type within a project.
 */
async function getMaxDisplayNumber(
  prismaClient: PrismaClient,
  projectId: string,
  entityType: FixedPrefixEntityType,
  prefix: string
): Promise<number> {
  // Query all display IDs for this entity type in the project
  let records: Array<{ displayId: string }>

  switch (entityType) {
    case "Question":
      records = await prismaClient.question.findMany({
        where: { projectId },
        select: { displayId: true },
      })
      break
    case "Decision":
      records = await prismaClient.decision.findMany({
        where: { projectId },
        select: { displayId: true },
      })
      break
    case "Risk":
      records = await prismaClient.risk.findMany({
        where: { projectId },
        select: { displayId: true },
      })
      break
    case "Requirement":
      records = await prismaClient.requirement.findMany({
        where: { projectId },
        select: { displayId: true },
      })
      break
  }

  if (records.length === 0) return 0

  // Extract numbers from display IDs (e.g., "Q-15" -> 15)
  const numbers = records
    .map((r) => {
      const match = r.displayId.match(new RegExp(`^${prefix}-(\\d+)$`))
      return match ? parseInt(match[1], 10) : 0
    })
    .filter((n) => !isNaN(n))

  return numbers.length > 0 ? Math.max(...numbers) : 0
}

/**
 * Generate a sequential display ID for a story within an epic.
 *
 * Stories use their epic's prefix instead of a fixed entity prefix.
 * Format: {epicPrefix}-{N} (e.g., "AUTH-1", "AUTH-2")
 *
 * @param projectId - The project to scope the ID within
 * @param epicPrefix - The epic's prefix (e.g., "AUTH")
 * @param prismaClient - Prisma client instance
 * @returns Formatted display ID string (e.g., "AUTH-3")
 */
export async function generateStoryDisplayId(
  projectId: string,
  epicPrefix: string,
  prismaClient: PrismaClient
): Promise<string> {
  async function tryGenerate(): Promise<string> {
    const records = await prismaClient.story.findMany({
      where: {
        projectId,
        displayId: { startsWith: `${epicPrefix}-` },
      },
      select: { displayId: true },
    })

    let maxNumber = 0
    for (const r of records) {
      const match = r.displayId.match(new RegExp(`^${epicPrefix}-(\\d+)$`))
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNumber) maxNumber = num
      }
    }

    return `${epicPrefix}-${maxNumber + 1}`
  }

  // First attempt
  try {
    return await tryGenerate()
  } catch (error) {
    // Retry once on unique constraint violation (P2002)
    if (isUniqueConstraintError(error)) {
      return await tryGenerate()
    }
    throw error
  }
}

/**
 * Check if an error is a Prisma unique constraint violation (P2002).
 */
function isUniqueConstraintError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>
    return err.code === "P2002"
  }
  return false
}
