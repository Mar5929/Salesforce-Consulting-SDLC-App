import { hkdf, createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { promisify } from "node:util"

const hkdfAsync = promisify(hkdf)

async function deriveKey(projectId: string): Promise<Buffer> {
  const masterKey = process.env.SF_TOKEN_ENCRYPTION_KEY!
  return Buffer.from(
    await hkdfAsync("sha256", masterKey, projectId, "sf-token-encryption", 32)
  )
}

export async function encrypt(
  plaintext: string,
  projectId: string
): Promise<string> {
  const key = await deriveKey(projectId)
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

export async function decrypt(
  ciphertext: string,
  projectId: string
): Promise<string> {
  const [ivB64, tagB64, encB64] = ciphertext.split(":")
  const key = await deriveKey(projectId)
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64")
  )
  decipher.setAuthTag(Buffer.from(tagB64, "base64"))
  return (
    decipher.update(Buffer.from(encB64, "base64")).toString("utf8") +
    decipher.final("utf8")
  )
}
