/**
 * Shared API handler wrapper for /api/v1/ endpoints.
 *
 * Applies API key authentication (T-04-14) and rate limiting (T-04-15)
 * before delegating to the route handler. All queries are scoped to the
 * project identified by the API key (T-04-16).
 */
import { validateApiKey } from "@/lib/api-keys/middleware"
import { checkRateLimit } from "@/lib/api-keys/rate-limit"
import { NextResponse } from "next/server"

/**
 * Wrap an API route handler with authentication and rate limiting.
 *
 * @param request - Incoming HTTP request
 * @param handler - Route handler receiving validated projectId and apiKeyId
 * @param rateLimit - Max requests per minute (default: 60)
 */
export async function withApiAuth(
  request: Request,
  handler: (projectId: string, apiKeyId: string) => Promise<NextResponse>,
  rateLimit: number = 60
): Promise<NextResponse> {
  // Authenticate via API key (T-04-14)
  const authResult = await validateApiKey(request)
  if (authResult instanceof NextResponse) return authResult

  const { projectId, apiKeyId } = authResult

  // Apply rate limiting (T-04-15)
  const endpoint = new URL(request.url).pathname
  const method = request.method ?? "GET"
  const rateResult = await checkRateLimit(apiKeyId, endpoint, rateLimit, 60_000, method)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(rateResult.retryAfter ?? 60) },
      }
    )
  }

  return handler(projectId, apiKeyId)
}
