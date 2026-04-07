import { randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"

const KEY_PREFIX_LENGTH = 8
const BCRYPT_COST_FACTOR = 12

/**
 * Generate a new API key for project-scoped REST API access.
 *
 * Key format: sfai_{projectId first 8 chars}_{32 random hex chars}
 * The prefix (first 8 chars of full key) is stored in plain text for fast lookup.
 * The full key is bcrypt-hashed for secure comparison.
 *
 * @param projectId - Project this key is scoped to
 * @returns Raw key (shown once), prefix (for lookup), and hash (for storage)
 */
export async function generateApiKey(
  projectId: string
): Promise<{
  rawKey: string
  keyPrefix: string
  keyHash: string
}> {
  const randomHex = randomBytes(16).toString("hex") // 32 hex chars
  const rawKey = `sfai_${projectId.slice(0, 8)}_${randomHex}`
  const keyPrefix = rawKey.slice(0, KEY_PREFIX_LENGTH)
  const keyHash = await bcrypt.hash(rawKey, BCRYPT_COST_FACTOR)

  return { rawKey, keyPrefix, keyHash }
}
