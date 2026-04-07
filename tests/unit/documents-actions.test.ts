import { describe, it, expect } from "vitest"

describe("documents actions", () => {
  describe("requestDocumentGeneration", () => {
    it.todo("validates templateId exists in registry")
    it.todo("validates format is supported by template")
    it.todo("sends DOCUMENT_GENERATION_REQUESTED Inngest event")
    it.todo("restricts to PM/SA roles")
  })

  describe("getDocuments", () => {
    it.todo("returns documents ordered by createdAt desc")
    it.todo("computes version numbers per document type")
    it.todo("filters by documentType when provided")
  })

  describe("getDocumentDownloadUrl", () => {
    it.todo("returns presigned URL with 5-min TTL")
    it.todo("verifies project membership before generating URL")
  })
})
