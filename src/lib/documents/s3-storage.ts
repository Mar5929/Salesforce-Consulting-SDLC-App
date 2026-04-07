/**
 * S3 Storage Utilities
 *
 * Handles document upload to S3/R2 and presigned download URL generation.
 * S3 keys are constructed server-side from projectId + cuid -- never user-supplied.
 * Presigned URLs expire in 5 minutes by default.
 *
 * Per T-05-01, T-05-02 threat mitigations.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createId } from "@paralleldrive/cuid2"

function getS3Client(): S3Client {
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  }

  // Support Cloudflare R2 or custom S3-compatible endpoints
  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT
    config.forcePathStyle = true
  }

  return new S3Client(config)
}

let _client: S3Client | null = null

function getClient(): S3Client {
  if (!_client) {
    _client = getS3Client()
  }
  return _client
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET
  if (!bucket) {
    throw new Error("S3_BUCKET environment variable is required")
  }
  return bucket
}

function getContentType(format: string): string {
  const types: Record<string, string> = {
    DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    PDF: "application/pdf",
  }
  return types[format.toUpperCase()] || "application/octet-stream"
}

/**
 * Upload a document buffer to S3.
 * Returns the S3 key for later retrieval.
 */
export async function uploadDocument(
  projectId: string,
  documentType: string,
  format: string,
  buffer: Buffer
): Promise<string> {
  const client = getClient()
  const bucket = getBucket()
  const ext = format.toLowerCase()
  const key = `projects/${projectId}/documents/${documentType}/${format}/${createId()}.${ext}`

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: getContentType(format),
    })
  )

  return key
}

/**
 * Generate a presigned download URL for an S3 object.
 * Default TTL is 300 seconds (5 minutes).
 */
export async function getDownloadUrl(
  s3Key: string,
  expiresIn: number = 300
): Promise<string> {
  const client = getClient()
  const bucket = getBucket()

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  })

  return getSignedUrl(client, command, { expiresIn })
}
