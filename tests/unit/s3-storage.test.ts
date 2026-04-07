import { describe, it, expect } from "vitest"

describe("s3-storage", () => {
  describe("uploadDocument", () => {
    it.todo("uploads buffer to S3 with correct key pattern: projects/{projectId}/documents/{type}/{format}/{id}.{ext}")
    it.todo("returns the s3Key after upload")
    it.todo("sets correct content type for DOCX format")
    it.todo("sets correct content type for PDF format")
    it.todo("sets correct content type for PPTX format")
  })

  describe("getDownloadUrl", () => {
    it.todo("generates presigned URL for given s3Key")
    it.todo("uses 300s default TTL")
    it.todo("accepts custom TTL parameter")
  })
})
