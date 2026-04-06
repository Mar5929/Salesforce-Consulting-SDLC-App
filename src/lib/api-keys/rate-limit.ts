import { prisma } from "@/lib/db"

/**
 * Check if an API key is within its rate limit using a Postgres-backed sliding window.
 *
 * Uses COUNT of ApiRequestLog entries within the window to determine if the
 * request should be allowed. This avoids Redis dependency per tech spec Section 3.1.2.
 *
 * @param apiKeyId - The API key making the request
 * @param endpoint - The endpoint being accessed (for per-endpoint limits)
 * @param limit - Maximum requests allowed in the window (default: 60)
 * @param windowMs - Sliding window duration in milliseconds (default: 60000 = 1 minute)
 * @returns Rate limit check result with remaining count and optional retry delay
 */
export async function checkRateLimit(
  apiKeyId: string,
  endpoint: string,
  limit: number = 60,
  windowMs: number = 60_000
): Promise<{
  allowed: boolean
  remaining: number
  retryAfter?: number
}> {
  const windowStart = new Date(Date.now() - windowMs)

  const count = await prisma.apiRequestLog.count({
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
      allowed: false,
      remaining: 0,
      retryAfter,
    }
  }

  // Under limit -- log this request
  await prisma.apiRequestLog.create({
    data: {
      apiKeyId,
      endpoint,
      method: "GET",
    },
  })

  return {
    allowed: true,
    remaining: limit - count - 1, // -1 for the request we just logged
  }
}
