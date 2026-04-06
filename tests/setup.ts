// Environment variables for test context
process.env.SF_TOKEN_ENCRYPTION_KEY = "test-encryption-key-that-is-at-least-32-characters-long"
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
process.env.CLERK_SECRET_KEY = "sk_test_fake"
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_fake"
process.env.ANTHROPIC_API_KEY = "sk-ant-test-fake-key"
process.env.SF_CONNECTED_APP_CLIENT_ID = "test-sf-client-id"
process.env.SF_CONNECTED_APP_CLIENT_SECRET = "test-sf-client-secret"
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
