/**
 * Blocking Relationships Context Loader
 *
 * Queries QuestionBlocksStory/Epic/Feature join tables to find questions
 * that block other entities. Returns structured list for AI context.
 *
 * Uses prisma directly with projectId filter since we query join tables
 * that reference questions scoped to the project.
 */

import { prisma } from "@/lib/db"

export interface BlockingRelationship {
  questionId: string
  questionDisplayId: string
  questionText: string
  questionStatus: string
  blockedEntityType: "Story" | "Epic" | "Feature"
  blockedEntityId: string
  blockedEntityDisplayId: string
  blockedEntityTitle: string
}

/**
 * Fetch all blocking relationships for a project.
 * Queries QuestionBlocksStory, QuestionBlocksEpic, and QuestionBlocksFeature
 * join tables to find questions that block other entities.
 */
export async function getBlockingRelationships(
  projectId: string
): Promise<BlockingRelationship[]> {
  const [blockedStories, blockedEpics, blockedFeatures] = await Promise.all([
    prisma.questionBlocksStory.findMany({
      where: { question: { projectId } },
      select: {
        question: {
          select: { id: true, displayId: true, questionText: true, status: true },
        },
        story: {
          select: { id: true, displayId: true, title: true },
        },
      },
    }),
    prisma.questionBlocksEpic.findMany({
      where: { question: { projectId } },
      select: {
        question: {
          select: { id: true, displayId: true, questionText: true, status: true },
        },
        epic: {
          select: { id: true, name: true, prefix: true },
        },
      },
    }),
    prisma.questionBlocksFeature.findMany({
      where: { question: { projectId } },
      select: {
        question: {
          select: { id: true, displayId: true, questionText: true, status: true },
        },
        feature: {
          select: { id: true, name: true, prefix: true },
        },
      },
    }),
  ])

  const results: BlockingRelationship[] = []

  for (const bs of blockedStories) {
    results.push({
      questionId: bs.question.id,
      questionDisplayId: bs.question.displayId,
      questionText: bs.question.questionText,
      questionStatus: bs.question.status,
      blockedEntityType: "Story",
      blockedEntityId: bs.story.id,
      blockedEntityDisplayId: bs.story.displayId,
      blockedEntityTitle: bs.story.title,
    })
  }

  for (const be of blockedEpics) {
    results.push({
      questionId: be.question.id,
      questionDisplayId: be.question.displayId,
      questionText: be.question.questionText,
      questionStatus: be.question.status,
      blockedEntityType: "Epic",
      blockedEntityId: be.epic.id,
      blockedEntityDisplayId: be.epic.prefix,
      blockedEntityTitle: be.epic.name,
    })
  }

  for (const bf of blockedFeatures) {
    results.push({
      questionId: bf.question.id,
      questionDisplayId: bf.question.displayId,
      questionText: bf.question.questionText,
      questionStatus: bf.question.status,
      blockedEntityType: "Feature",
      blockedEntityId: bf.feature.id,
      blockedEntityDisplayId: bf.feature.prefix,
      blockedEntityTitle: bf.feature.name,
    })
  }

  return results
}
