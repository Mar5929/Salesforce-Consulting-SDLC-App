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
  },
  { event: EVENTS.EMBEDDING_BATCH_REQUESTED },
  async ({ event, step }) => {
    const { projectId, entities } = event.data as {
      projectId: string
      entities: EmbeddingEntity[]
    }

    if (!entities || entities.length === 0) {
      return { status: "skipped", reason: "No entities to embed" }
    }

    // Step 1: Generate embeddings via Voyage AI
    const embeddings = await step.run("generate-embeddings", async () => {
      const texts = entities.map((e) => e.text)
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

    // Step 2: Store embeddings in database via raw SQL
    const storeResult = await step.run("store-embeddings", async () => {
      let succeeded = 0
      let failed = 0

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]
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
