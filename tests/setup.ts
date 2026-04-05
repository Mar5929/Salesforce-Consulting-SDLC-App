// Environment variables for test context
process.env.SF_TOKEN_ENCRYPTION_KEY = "test-encryption-key-that-is-at-least-32-characters-long"
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
process.env.CLERK_SECRET_KEY = "sk_test_fake"
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_fake"
