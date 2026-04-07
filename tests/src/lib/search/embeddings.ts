/**
 * Voyage AI embedding generation wrapper
 *
 * Uses Voyage AI REST API (Anthropic-recommended provider) for generating
 * text embeddings used in semantic search. Model: voyage-3-large (1024 dimensions).
 *
 * Graceful degradation: If VOYAGE_API_KEY is not set, functions return null
 * instead of throwing, allowing the search system to fall back to full-text only.
 */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"
const VOYAGE_MODEL = "voyage-3-large"
const VOYAGE_DIMENSIONS = 1024
const VOYAGE_MAX_BATCH_SIZE = 128

interface VoyageEmbeddingResponse {
  object: "list"
  data: Array<{
    object: "embedding"
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    total_tokens: number
  }
}

function getApiKey(): string | null {
  const key = process.env.VOYAGE_API_KEY
  if (!key || key.trim() === "") {
    return null
  }
  return key
}

/**
 * Generate a single embedding vector for a text string.
 * Returns null if VOYAGE_API_KEY is not configured.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const results = await generateEmbeddings([text])
  return results ? results[0] : null
}

/**
 * Generate embedding vectors for multiple texts in batch.
 * Voyage API supports up to 128 texts per request.
 * Returns null if VOYAGE_API_KEY is not configured.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][] | null> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.warn("[embeddings] VOYAGE_API_KEY not configured. Skipping embedding generation.")
    return null
  }

  if (texts.length === 0) {
    return []
  }

  // Split into batches if needed
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += VOYAGE_MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + VOYAGE_MAX_BATCH_SIZE)
    const batchResult = await callVoyageApi(apiKey, batch)
    if (!batchResult) {
      return null
    }
    allEmbeddings.push(...batchResult)
  }

  return allEmbeddings
}

async function callVoyageApi(apiKey: string, texts: string[]): Promise<number[][] | null> {
  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: texts,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[embeddings] Voyage API error ${response.status}: ${errorText}`)
      return null
    }

    const data: VoyageEmbeddingResponse = await response.json()

    // Sort by index to maintain input order
    const sorted = data.data.sort((a, b) => a.index - b.index)
    return sorted.map((item) => item.embedding)
  } catch (error) {
    console.error("[embeddings] Failed to call Voyage AI API:", error)
    return null
  }
}

export { VOYAGE_DIMENSIONS, VOYAGE_MODEL }
