import { prisma } from "@/lib/db"

/**
 * Check if an API key is within its rate limit using a Postgres-backed sliding window.
 *
 * Uses a transaction to atomically COUNT ApiRequestLog entries within the window
 * and INSERT the new request log, preventing race conditions under concurrent requests.
 * This avoids Redis dependency per tech spec Section 3.1.2.
 *
 * @param apiKeyId - The API key making the request
 * @param endpoint - The endpoint being accessed (for per-endpoint limits)
 * @param limit - Maximum requests allowed in the window (default: 60)
 * @param windowMs - Sliding window duration in milliseconds (default: 60000 = 1 minute)
 * @param method - HTTP method of the request (default: "GET")
 * @returns Rate limit check result with remaining count and optional retry delay
 */
export async function checkRateLimit(
  apiKeyId: string,
  endpoint: string,
  limit: number = 60,
  windowMs: number = 60_000,
  method: string = "GET"
): Promise<{
  allowed: boolean
  remaining: number
  retryAfter?: number
}> {
  const windowStart = new Date(Date.now() - windowMs)

  // Use a transaction to atomically check count and insert log entry,
  // preventing race conditions where concurrent requests all read the
  // same count and exceed the limit.
  const result = await prisma.$transaction(async (tx) => {
    const count = await tx.apiRequestLog.count({
      where: {
        apiKeyId,
        endpoint,
        timestamp: { gte: windowStart },
      },
    })

    if (count >= limit) {
      // Over limit -- calculate approximate retry time
      const retryAfter = Math.ceil(windowMs / 1000)
      return {
        allowed: false as const,
        remaining: 0,
        retryAfter,
      }
    }

    // Under limit -- log this request atomically within the transaction
    await tx.apiRequestLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
      },
    })

    return {
      allowed: true as const,
      remaining: limit - count - 1, // -1 for the request we just logged
    }
  })

  return result
}
