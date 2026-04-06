"use server"

/**
 * Knowledge Server Actions
 *
 * Read operations for knowledge articles and business processes.
 * All actions use next-safe-action for Zod validation and auth middleware.
 * All DB operations use scopedPrisma for project isolation (T-02-23).
 *
 * Architecture: D-16, D-17, KNOW-01, KNOW-02, KNOW-03
 */

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import { getCurrentMember } from "@/lib/auth"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const getArticlesSchema = z.object({
  projectId: z.string().min(1),
})

const getArticleSchema = z.object({
  projectId: z.string().min(1),
  articleId: z.string().min(1),
})

const getBusinessProcessesSchema = z.object({
  projectId: z.string().min(1),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

/**
 * Fetch all knowledge articles for a project with staleness data and source counts.
 */
export const getArticles = actionClient
  .schema(getArticlesSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)
    const db = scopedPrisma(parsedInput.projectId)

    const articles = await db.knowledgeArticle.findMany({
      where: { projectId: parsedInput.projectId },
      select: {
        id: true,
        title: true,
        summary: true,
        articleType: true,
        confidence: true,
        version: true,
        isStale: true,
        staleReason: true,
        staleSince: true,
        lastRefreshedAt: true,
        authorType: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            references: true,
          },
        },
        references: {
          select: {
            entityType: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return articles.map((article) => {
      // Count sources by type
      const questionCount = article.references.filter(
        (r) => r.entityType === "QUESTION"
      ).length
      const decisionCount = article.references.filter(
        (r) => r.entityType === "DECISION"
      ).length
      const otherCount =
        article._count.references - questionCount - decisionCount

      return {
        id: article.id,
        title: article.title,
        summary: article.summary,
        articleType: article.articleType,
        confidence: article.confidence,
        version: article.version,
        isStale: article.isStale,
        staleReason: article.staleReason,
        staleSince: article.staleSince,
        lastRefreshedAt: article.lastRefreshedAt,
        authorType: article.authorType,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        sourceCount: article._count.references,
        questionCount,
        decisionCount,
        otherCount,
      }
    })
  })

/**
 * Fetch a single knowledge article with full content, source references,
 * related entities, and version metadata.
 */
export const getArticle = actionClient
  .schema(getArticleSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)

    const article = await prisma.knowledgeArticle.findUnique({
      where: { id: parsedInput.articleId },
      include: {
        references: true,
      },
    })

    if (!article || article.projectId !== parsedInput.projectId) {
      throw new Error("Article not found")
    }

    // Load source entities by type
    const questionRefs = article.references.filter(
      (r) => r.entityType === "QUESTION"
    )
    const decisionRefs = article.references.filter(
      (r) => r.entityType === "DECISION"
    )
    const epicRefs = article.references.filter(
      (r) => r.entityType === "EPIC"
    )
    const storyRefs = article.references.filter(
      (r) => r.entityType === "STORY"
    )
    const businessProcessRefs = article.references.filter(
      (r) => r.entityType === "BUSINESS_PROCESS"
    )

    // Fetch referenced entities in parallel
    const [questions, decisions, epics, stories, businessProcesses] =
      await Promise.all([
        questionRefs.length > 0
          ? prisma.question.findMany({
              where: {
                id: { in: questionRefs.map((r) => r.entityId) },
                projectId: parsedInput.projectId,
              },
              select: {
                id: true,
                displayId: true,
                questionText: true,
                status: true,
              },
            })
          : Promise.resolve([]),
        decisionRefs.length > 0
          ? prisma.decision.findMany({
              where: {
                id: { in: decisionRefs.map((r) => r.entityId) },
                projectId: parsedInput.projectId,
              },
              select: {
                id: true,
                displayId: true,
                title: true,
              },
            })
          : Promise.resolve([]),
        epicRefs.length > 0
          ? prisma.epic.findMany({
              where: {
                id: { in: epicRefs.map((r) => r.entityId) },
                projectId: parsedInput.projectId,
              },
              select: {
                id: true,
                prefix: true,
                name: true,
              },
            })
          : Promise.resolve([]),
        storyRefs.length > 0
          ? prisma.story.findMany({
              where: {
                id: { in: storyRefs.map((r) => r.entityId) },
              },
              select: {
                id: true,
                displayId: true,
                title: true,
              },
            })
          : Promise.resolve([]),
        businessProcessRefs.length > 0
          ? prisma.businessProcess.findMany({
              where: {
                id: { in: businessProcessRefs.map((r) => r.entityId) },
                projectId: parsedInput.projectId,
              },
              select: {
                id: true,
                name: true,
                status: true,
              },
            })
          : Promise.resolve([]),
      ])

    return {
      id: article.id,
      title: article.title,
      content: article.content,
      summary: article.summary,
      articleType: article.articleType,
      confidence: article.confidence,
      version: article.version,
      isStale: article.isStale,
      staleReason: article.staleReason,
      staleSince: article.staleSince,
      lastRefreshedAt: article.lastRefreshedAt,
      authorType: article.authorType,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      sourceReferences: {
        questions,
        decisions,
      },
      relatedEntities: {
        epics,
        stories,
        businessProcesses,
      },
    }
  })

/**
 * Fetch business processes for a project with their component relationships (KNOW-01).
 */
export const getBusinessProcesses = actionClient
  .schema(getBusinessProcessesSchema)
  .action(async ({ parsedInput }) => {
    await getCurrentMember(parsedInput.projectId)
    const db = scopedPrisma(parsedInput.projectId)

    const processes = await db.businessProcess.findMany({
      where: { projectId: parsedInput.projectId },
      include: {
        processComponents: {
          include: {
            orgComponent: {
              select: {
                id: true,
                apiName: true,
                label: true,
                componentType: true,
              },
            },
          },
        },
        domainGrouping: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return processes.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      complexity: p.complexity,
      isAiSuggested: p.isAiSuggested,
      isConfirmed: p.isConfirmed,
      domainGrouping: p.domainGrouping,
      components: p.processComponents.map((pc) => ({
        id: pc.id,
        role: pc.role,
        isRequired: pc.isRequired,
        component: pc.orgComponent,
      })),
    }))
  })
