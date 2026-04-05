import { describe, it, expect } from "vitest"
import { encrypt, decrypt } from "@/lib/encryption"

describe("encryption", () => {
  const projectId = "test-project-123"

  it("encrypt and decrypt round-trip returns original plaintext", async () => {
    const plaintext = "my-secret-token-value"
    const ciphertext = await encrypt(plaintext, projectId)
    const decrypted = await decrypt(ciphertext, projectId)
    expect(decrypted).toBe(plaintext)
  })

  it("decrypt fails with wrong projectId", async () => {
    const ciphertext = await encrypt("secret", projectId)
    await expect(decrypt(ciphertext, "wrong-project")).rejects.toThrow()
  })

  it("encrypted output format is iv:tag:ciphertext base64", async () => {
    const ciphertext = await encrypt("test", projectId)
    const parts = ciphertext.split(":")
    expect(parts).toHaveLength(3)
    // Each part should be valid base64
    parts.forEach((part) => {
      expect(() => Buffer.from(part, "base64")).not.toThrow()
      expect(Buffer.from(part, "base64").length).toBeGreaterThan(0)
    })
  })
})
