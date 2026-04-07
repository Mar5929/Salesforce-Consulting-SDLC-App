import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
    SF_TOKEN_ENCRYPTION_KEY: z.string().min(32),
    ANTHROPIC_API_KEY: z.string().min(1),
    INNGEST_SIGNING_KEY: z.string().optional(),
    INNGEST_EVENT_KEY: z.string().optional(),
    VOYAGE_API_KEY: z.string().optional(), // Voyage AI for embeddings — non-critical, search falls back to full-text
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    AWS_S3_REGION: z.string().optional(),
    AWS_S3_ENDPOINT: z.string().optional(),
    SF_CONNECTED_APP_CLIENT_ID: z.string().optional(),
    SF_CONNECTED_APP_CLIENT_SECRET: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    SF_TOKEN_ENCRYPTION_KEY: process.env.SF_TOKEN_ENCRYPTION_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    VOYAGE_API_KEY: process.env.VOYAGE_API_KEY,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AWS_S3_REGION: process.env.AWS_S3_REGION,
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
    SF_CONNECTED_APP_CLIENT_ID: process.env.SF_CONNECTED_APP_CLIENT_ID,
    SF_CONNECTED_APP_CLIENT_SECRET: process.env.SF_CONNECTED_APP_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  },
})
