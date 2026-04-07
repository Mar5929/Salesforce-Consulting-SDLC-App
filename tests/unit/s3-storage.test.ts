import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock AWS SDK before importing module
const mockSend = vi.fn()
const mockGetSignedUrl = vi.fn()

class MockS3Client {
  send = mockSend
}

class MockPutObjectCommand {
  input: Record<string, unknown>
  constructor(input: Record<string, unknown>) {
    this.input = input
    mockPutObjectInput(input)
  }
}

class MockGetObjectCommand {
  input: Record<string, unknown>
  constructor(input: Record<string, unknown>) {
    this.input = input
  }
}

const mockPutObjectInput = vi.fn()

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: MockS3Client,
  PutObjectCommand: MockPutObjectCommand,
  GetObjectCommand: MockGetObjectCommand,
}))

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}))

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "test-cuid-123",
}))

describe("s3-storage", () => {
  beforeEach(() => {
    vi.resetModules()
    mockSend.mockReset()
    mockGetSignedUrl.mockReset()
    mockPutObjectInput.mockReset()
    process.env.S3_REGION = "us-east-1"
    process.env.S3_ACCESS_KEY_ID = "test-key"
    process.env.S3_SECRET_ACCESS_KEY = "test-secret"
    process.env.S3_BUCKET = "test-bucket"
  })

  describe("uploadDocument", () => {
    it("uploads buffer to S3 with correct key pattern: projects/{projectId}/documents/{type}/{format}/{id}.{ext}", async () => {
      mockSend.mockResolvedValue({})
      const { uploadDocument } = await import("@/lib/documents/s3-storage")

      const key = await uploadDocument("proj-1", "discovery", "DOCX", Buffer.from("test"))

      expect(key).toBe("projects/proj-1/documents/discovery/DOCX/test-cuid-123.docx")
    })

    it("returns the s3Key after upload", async () => {
      mockSend.mockResolvedValue({})
      const { uploadDocument } = await import("@/lib/documents/s3-storage")

      const key = await uploadDocument("proj-1", "requirements", "PDF", Buffer.from("data"))

      expect(key).toMatch(/^projects\/proj-1\/documents\/requirements\/PDF\//)
      expect(key.endsWith(".pdf")).toBe(true)
    })

    it("sets correct content type for DOCX format", async () => {
      mockSend.mockResolvedValue({})
      const { uploadDocument } = await import("@/lib/documents/s3-storage")

      await uploadDocument("proj-1", "discovery", "DOCX", Buffer.from("test"))

      expect(mockPutObjectInput).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })
      )
    })

    it("sets correct content type for PDF format", async () => {
      mockSend.mockResolvedValue({})
      const { uploadDocument } = await import("@/lib/documents/s3-storage")

      await uploadDocument("proj-1", "report", "PDF", Buffer.from("test"))

      expect(mockPutObjectInput).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: "application/pdf",
        })
      )
    })

    it("sets correct content type for PPTX format", async () => {
      mockSend.mockResolvedValue({})
      const { uploadDocument } = await import("@/lib/documents/s3-storage")

      await uploadDocument("proj-1", "presentation", "PPTX", Buffer.from("test"))

      expect(mockPutObjectInput).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        })
      )
    })
  })

  describe("getDownloadUrl", () => {
    it("generates presigned URL for given s3Key", async () => {
      mockGetSignedUrl.mockResolvedValue("https://s3.example.com/signed")
      const { getDownloadUrl } = await import("@/lib/documents/s3-storage")

      const url = await getDownloadUrl("some/key.docx")

      expect(url).toBe("https://s3.example.com/signed")
    })

    it("uses 300s default TTL", async () => {
      mockGetSignedUrl.mockResolvedValue("https://s3.example.com/signed")
      const { getDownloadUrl } = await import("@/lib/documents/s3-storage")

      await getDownloadUrl("some/key.docx")

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 300 }
      )
    })

    it("accepts custom TTL parameter", async () => {
      mockGetSignedUrl.mockResolvedValue("https://s3.example.com/signed")
      const { getDownloadUrl } = await import("@/lib/documents/s3-storage")

      await getDownloadUrl("some/key.docx", 600)

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 600 }
      )
    })
  })
})
