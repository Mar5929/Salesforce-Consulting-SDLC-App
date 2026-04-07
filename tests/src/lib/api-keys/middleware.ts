import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

const INVALID_KEY_RESPONSE = NextResponse.json(
  { error: "Invalid API key" },
  { status: 401 }
)

/**
 * Validate an API key from the x-api-key request header.
 *
 * Security design:
 * - Uses keyPrefix index for fast candidate lookup (no full-table scan)
 * - bcrypt constant-time compare prevents timing attacks (T-04-04)
 * - Generic error message prevents key enumeration (T-04-04)
 * - Updates usage tracking on successful validation
 *
 * @param request - Incoming HTTP request
 * @returns { projectId, apiKeyId } on success, or NextResponse with 401 status
 */
export async function validateApiKey(
  request: Request
): Promise<{ projectId: string; apiKeyId: string } | NextResponse> {
  const apiKey = request.headers.get("x-api-key")

  if (!apiKey) {
    return INVALID_KEY_RESPONSE
  }

  // Extract prefix for indexed lookup
  const keyPrefix = apiKey.slice(0, 8)

  if (!keyPrefix) {
    return INVALID_KEY_RESPONSE
  }

  // Find candidates by prefix (indexed query, fast)
  const candidates = await prisma.apiKey.findMany({
    where: { keyPrefix, isActive: true },
    select: { id: true, projectId: true, keyHash: true },
  })

  if (candidates.length === 0) {
    return INVALID_KEY_RESPONSE
  }

  // Compare full key against each candidate hash (constant-time via bcrypt)
  for (const candidate of candidates) {
    const isMatch = await bcrypt.compare(apiKey, candidate.keyHash)
    if (isMatch) {
      // Update usage tracking (fire-and-forget to not slow down the request)
      prisma.apiKey
        .update({
          where: { id: candidate.id },
          data: {
            lastUsedAt: new Date(),
            useCount: { increment: 1 },
          },
        })
        .catch((err) =>
          console.error("Failed to update API key usage:", err)
        )

      return { projectId: candidate.projectId, apiKeyId: candidate.id }
    }
  }

  return INVALID_KEY_RESPONSE
}
