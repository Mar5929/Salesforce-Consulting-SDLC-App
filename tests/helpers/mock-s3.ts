import { vi } from "vitest"

/**
 * Creates a mock S3 client with a `send` method that resolves successfully.
 * Mirrors the @aws-sdk/client-s3 S3Client interface.
 */
export function createMockS3Client() {
  return {
    send: vi.fn().mockResolvedValue({}),
  }
}

/**
 * Mock for uploading a document buffer to S3.
 * Resolves to a fake S3 key.
 */
export const mockUploadDocument = vi.fn().mockResolvedValue(
  "projects/proj-1/documents/BRD/DOCX/doc-1.docx"
)

/**
 * Mock for generating a presigned download URL.
 * Resolves to a fake presigned URL string.
 */
export const mockGetDownloadUrl = vi.fn().mockResolvedValue(
  "https://s3.example.com/presigned?token=abc123"
)
