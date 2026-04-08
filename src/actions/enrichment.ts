"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"

const applyEnrichmentSuggestionSchema = z.object({
  projectId: z.string().min(1),
  storyId: z.string().min(1),
  category: z.enum([
    "ACCEPTANCE_CRITERIA",
    "DESCRIPTION",
    "COMPONENTS",
    "TECHNICAL_NOTES",
    "STORY_POINTS",
    "PRIORITY",
  ]),
  suggestedValue: z.string().min(1),
})

/**
 * Apply an AI-suggested enrichment to a story.
 * Maps enrichment categories to Story fields:
 * - ACCEPTANCE_CRITERIA -> acceptanceCriteria
 * - DESCRIPTION -> description
 * - TECHNICAL_NOTES -> notes (Story model uses `notes`, not `technicalNotes`)
 * - STORY_POINTS -> storyPoints
 * - PRIORITY -> priority
 * - COMPONENTS -> creates/updates StoryComponent records
 */
export const applyEnrichmentSuggestion = actionClient
  .schema(applyEnrichmentSuggestionSchema)
  .action(
    async ({
      parsedInput: { projectId, storyId, category, suggestedValue },
    }) => {
      await getCurrentMember(projectId)
      const scoped = scopedPrisma(projectId)

      // Verify story belongs to project
      const story = await scoped.story.findFirst({
        where: { id: storyId },
      })
      if (!story) throw new Error("Story not found")

      switch (category) {
        case "ACCEPTANCE_CRITERIA":
          return prisma.story.update({
            where: { id: storyId },
            data: { acceptanceCriteria: suggestedValue },
          })

        case "DESCRIPTION":
          return prisma.story.update({
            where: { id: storyId },
            data: { description: suggestedValue },
          })

        case "TECHNICAL_NOTES":
          // Story model has `notes` field, NOT `technicalNotes`
          return prisma.story.update({
            where: { id: storyId },
            data: { notes: suggestedValue },
          })

        case "STORY_POINTS": {
          const points = parseInt(suggestedValue, 10)
          if (isNaN(points) || points < 1 || points > 13) {
            throw new Error("Invalid story points value")
          }
          return prisma.story.update({
            where: { id: storyId },
            data: { storyPoints: points },
          })
        }

        case "PRIORITY": {
          const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
          const priority = suggestedValue.toUpperCase()
          if (!validPriorities.includes(priority)) {
            throw new Error("Invalid priority value")
          }
          return prisma.story.update({
            where: { id: storyId },
            data: { priority: priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" },
          })
        }

        case "COMPONENTS": {
          // Parse JSON array of component objects
          const components = JSON.parse(suggestedValue) as Array<{
            componentName: string
            impactType: string
          }>

          const validImpactTypes = ["CREATE", "MODIFY", "DELETE"]

          for (const comp of components) {
            const impactType = validImpactTypes.includes(comp.impactType)
              ? comp.impactType
              : "MODIFY"

            await prisma.storyComponent.create({
              data: {
                storyId,
                projectId,
                componentName: comp.componentName,
                impactType: impactType as "CREATE" | "MODIFY" | "DELETE",
              },
            })
          }

          return prisma.story.findUnique({
            where: { id: storyId },
            include: { storyComponents: true },
          })
        }

        default:
          throw new Error(`Unknown enrichment category: ${category}`)
      }
    }
  )
