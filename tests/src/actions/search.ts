"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { globalSearch, type SearchEntityType } from "@/lib/search/global-search"
import { prisma } from "@/lib/db"

const searchSchema = z.object({
  projectId: z.string().min(1),
  query: z.string().min(1).max(500),
  types: z
    .array(z.enum(["question", "decision", "article", "requirement", "risk"]))
    .optional(),
  limit: z.number().int().min(1).max(50).optional(),
})

export const search = actionClient
  .schema(searchSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, query, types, limit } = parsedInput

    // Verify user has access to this project
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        clerkUserId: ctx.userId,
      },
      select: { id: true },
    })

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    const results = await globalSearch(projectId, query, {
      types: types as SearchEntityType[] | undefined,
      limit,
    })

    return results
  })
