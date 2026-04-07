/**
 * Inngest function for batched embedding generation via Voyage AI
 *
 * Event: EMBEDDING_BATCH_REQUESTED
 * Generates embeddings for a batch of entities and stores them via raw SQL.
 * Graceful degradation: if VOYAGE_API_KEY not configured, logs warning and exits.
 * Non-critical: embedding failure does not block other operations (D-23).
 */

import { inngest } from "../client"
import { EVENTS } from "../events"
import { prisma } from "@/lib/db"
import { generateEmbeddings } from "@/lib/search/embeddings"

interface EmbeddingEntity {
  type: "KnowledgeArticle" | "OrgComponent"
  id: string
  text: string
}

async function storeEmbedding(
  entityType: EmbeddingEntity["type"],
  entityId: string,
  projectId: string,
  embedding: number[]
): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`

  // Separate queries per known table — avoids dynamic SQL (T-02-24)
  if (entityType === "KnowledgeArticle") {
    await prisma.$executeRaw`
      UPDATE "KnowledgeArticle"
      SET embedding = ${vectorStr}::vector, "embeddingStatus" = 'COMPLETED', "updatedAt" = NOW()
      WHERE id = ${entityId} AND "projectId" = ${projectId}
    `
  } else if (entityType === "OrgComponent") {
    await prisma.$executeRaw`
      UPDATE "OrgComponent"
      SET embedding = ${vectorStr}::vector, "embeddingStatus" = 'COMPLETED', "updatedAt" = NOW()
      WHERE id = ${entityId} AND "projectId" = ${projectId}
    `
  }
}

async function markFailed(
  entityType: EmbeddingEntity["type"],
  entityId: string,
  projectId: string
): Promise<void> {
  try {
    if (entityType === "KnowledgeArticle") {
      await prisma.$executeRaw`
        UPDATE "KnowledgeArticle"
        SET "embeddingStatus" = 'FAILED', "updatedAt" = NOW()
        WHERE id = ${entityId} AND "projectId" = ${projectId}
      `
    } else if (entityType === "OrgComponent") {
      await prisma.$executeRaw`
        UPDATE "OrgComponent"
        SET "embeddingStatus" = 'FAILED', "updatedAt" = NOW()
        WHERE id = ${entityId} AND "projectId" = ${projectId}
      `
    }
  } catch {
    // Best effort — embedding status is non-critical
  }
}

/**
 * Resolve entities from caller payload shapes into EmbeddingEntity[].
 *
 * Callers send two different shapes:
 *   - transcript-processing.ts: { projectId, sourceEntityType: "transcript", sourceEntityId }
 *   - article-refresh.ts:      { projectId, entityType: "KNOWLEDGE_ARTICLE", entityIds: string[] }
 *
 * This function normalises both into EmbeddingEntity[] by querying the database.
 */
async function resolveEntities(data: Record<string, unknown>): Promise<EmbeddingEntity[]> {
  const projectId = data.projectId as string

  // Shape 1: caller already provides fully-formed entities (future-proofing)
  if (Array.isArray(data.entities) && data.entities.length > 0) {
    return data.entities as EmbeddingEntity[]
  }

  // Shape 2: transcript-processing sends { sourceEntityType, sourceEntityId }
  // Find all KnowledgeArticles in this project with PENDING embedding status.
  // Transcript processing creates questions/decisions/risks but triggers
  // downstream article synthesis — those articles land with PENDING status.
  if (data.sourceEntityType === "transcript") {
    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        projectId,
        embeddingStatus: "PENDING",
      },
      select: { id: true, title: true, content: true, summary: true },
    })

    return articles.map((a) => ({
      type: "KnowledgeArticle" as const,
      id: a.id,
      text: `${a.title}\n\n${a.content}`,
    }))
  }

  // Shape 3: article-refresh sends { entityType: "KNOWLEDGE_ARTICLE", entityIds }
  if (data.entityType === "KNOWLEDGE_ARTICLE" && Array.isArray(data.entityIds)) {
    const entityIds = data.entityIds as string[]
    if (entityIds.length === 0) return []

    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        id: { in: entityIds },
        projectId,
      },
      select: { id: true, title: true, content: true, summary: true },
    })

    return articles.map((a) => ({
      type: "KnowledgeArticle" as const,
      id: a.id,
      text: `${a.title}\n\n${a.content}`,
    }))
  }

  return []
}

export const embeddingBatchFunction = inngest.createFunction(
  {
    id: "embedding-batch",
    retries: 2,
    concurrency: [
      {
        limit: 2,
        scope: "env",
        key: "event.data.projectId",
      },
    ],
    triggers: [{ event: EVENTS.EMBEDDING_BATCH_REQUESTED }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const projectId = event.data.projectId as string

    // Step 1: Resolve entities from whichever payload shape the caller sent
    const entities = await step.run("resolve-entities", async () => {
      try {
        return await resolveEntities(event.data as Record<string, unknown>)
      } catch (error) {
        console.error(
          `[embedding-batch] Failed to resolve entities for project ${projectId}:`,
          error
        )
        return []
      }
    })

    if (!entities || entities.length === 0) {
      return { status: "skipped", reason: "No entities to embed" }
    }

    // Step 2: Generate embeddings via Voyage AI
    const embeddings = await step.run("generate-embeddings", async () => {
      const texts = entities.map((e: EmbeddingEntity) => e.text)
      const result = await generateEmbeddings(texts)

      if (!result) {
        console.warn(
          `[embedding-batch] Voyage AI unavailable for project ${projectId}. Skipping.`
        )
        return null
      }

      return result
    })

    if (!embeddings) {
      return { status: "skipped", reason: "Voyage API not configured or failed" }
    }

    // Step 3: Store embeddings in database via raw SQL
    const storeResult = await step.run("store-embeddings", async () => {
      let succeeded = 0
      let failed = 0

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i] as EmbeddingEntity
        const embedding = embeddings[i]

        if (!embedding) {
          failed++
          continue
        }

        try {
          await storeEmbedding(entity.type, entity.id, projectId, embedding)
          succeeded++
        } catch (error) {
          console.error(
            `[embedding-batch] Failed to store embedding for ${entity.type}:${entity.id}:`,
            error
          )
          await markFailed(entity.type, entity.id, projectId)
          failed++
        }
      }

      return { succeeded, failed }
    })

    return {
      status: "completed",
      projectId,
      entitiesProcessed: entities.length,
      ...storeResult,
    }
  }
)
