---
phase: 04-salesforce-org-connectivity-and-developer-integration
plan: 01
subsystem: api, database, auth
tags: [jsforce, salesforce, oauth, api-key, bcrypt, prisma, rate-limiting]

# Dependency graph
requires:
  - phase: 01-foundation-and-data-layer
    provides: Prisma schema, encryption.ts, Inngest infrastructure
provides:
  - ApiKey, ApiRequestLog, OrgSyncRun Prisma models
  - jsforce client factory with encrypted token refresh
  - OAuth URL builder and token exchange
  - API key generation, validation, and rate limiting
  - Salesforce metadata type configuration
  - Test fixtures for Salesforce mocks
affects: [04-02, 04-03, 04-04, 04-05, 04-06, 04-07]

# Tech tracking
tech-stack:
  added: [jsforce, bcryptjs]
  patterns: [keyPrefix indexed lookup + bcrypt compare, Postgres sliding window rate limit, encrypted token refresh handler]

key-files:
  created:
    - src/lib/salesforce/types.ts
    - src/lib/salesforce/oauth.ts
    - src/lib/salesforce/client.ts
    - src/lib/api-keys/generate.ts
    - src/lib/api-keys/middleware.ts
    - src/lib/api-keys/rate-limit.ts
    - tests/fixtures/salesforce-mocks.ts
    - tests/lib/salesforce/oauth.test.ts
    - tests/lib/api-keys/middleware.test.ts
    - tests/lib/api-keys/rate-limit.test.ts
  modified:
    - prisma/schema.prisma
    - src/lib/inngest/events.ts
    - package.json
    - .env.example
    - tests/setup.ts

key-decisions:
  - "Constructed OAuth URL manually instead of using jsforce getAuthorizationUrl to support state parameter for CSRF/routing"
  - "API key middleware uses fire-and-forget pattern for usage tracking to avoid slowing request path"
  - "db push skipped (no DATABASE_URL locally) -- schema validated, Prisma client generated successfully"

patterns-established:
  - "API key prefix-indexed lookup: store first 8 chars as keyPrefix for fast DB lookup, then bcrypt compare full key"
  - "Postgres sliding window rate limit: COUNT ApiRequestLog within time window, no Redis dependency"
  - "SF token refresh handler: conn.on('refresh') re-encrypts and persists new access token automatically"

requirements-completed: [ORG-03]

# Metrics
duration: 6min
completed: 2026-04-06
---

# Phase 4 Plan 01: Salesforce Org Foundation Summary

**jsforce client factory with encrypted token refresh, API key infrastructure (generate/validate/rate-limit), and three new Prisma models (ApiKey, ApiRequestLog, OrgSyncRun)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-06T23:08:54Z
- **Completed:** 2026-04-06T23:15:30Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Three new Prisma models (ApiKey, ApiRequestLog, OrgSyncRun) with proper indexes and cascade deletes
- jsforce client factory that decrypts stored tokens and auto-re-encrypts on token refresh
- API key generation with sfai_ prefix, bcrypt hash (cost 12), and 8-char prefix index
- API key middleware with constant-time bcrypt compare and generic error messages (prevents enumeration)
- Postgres-backed sliding window rate limiter (60 req/min default, no Redis needed)
- 18 new tests passing, 105 total

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema additions + Inngest events + npm install** - `0262fde` (feat)
   - TDD RED: `31010f4` (test)
2. **Task 2: jsforce client, OAuth helpers, API key infrastructure** - `e4ed275` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added SyncType, SyncRunStatus enums; OrgSyncRun, ApiKey, ApiRequestLog models
- `src/lib/inngest/events.ts` - Added ORG_INGESTION_REQUESTED and ORG_SYNC_COMPLETED events
- `src/lib/salesforce/types.ts` - SfConnectionStatus, SfOrgInfo, MetadataTypeConfig, SUPPORTED_METADATA_TYPES
- `src/lib/salesforce/oauth.ts` - buildAuthorizationUrl and exchangeCodeForTokens
- `src/lib/salesforce/client.ts` - getSalesforceConnection with encrypted token handling
- `src/lib/api-keys/generate.ts` - generateApiKey with sfai_ prefix and bcrypt hash
- `src/lib/api-keys/middleware.ts` - validateApiKey with prefix lookup and bcrypt compare
- `src/lib/api-keys/rate-limit.ts` - checkRateLimit with Postgres sliding window
- `tests/fixtures/salesforce-mocks.ts` - Mock jsforce Connection, OAuth2, metadata responses
- `tests/lib/salesforce/oauth.test.ts` - 6 tests for OAuth URL construction
- `tests/lib/api-keys/middleware.test.ts` - 6 tests for API key validation
- `tests/lib/api-keys/rate-limit.test.ts` - 6 tests for rate limiting

## Decisions Made
- Constructed OAuth URL manually instead of using jsforce getAuthorizationUrl -- jsforce's method doesn't support the `state` parameter needed for CSRF protection and project routing
- API key middleware uses fire-and-forget pattern for usage tracking (lastUsedAt, useCount) -- avoids adding latency to the critical request path
- db push skipped because no DATABASE_URL is configured locally (Neon hosted) -- schema validated via `prisma validate`, client generated successfully

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added SF OAuth env vars to test setup**
- **Found during:** Task 1 (test environment prep)
- **Issue:** Tests for OAuth module need SF_CONNECTED_APP_CLIENT_ID, SF_CONNECTED_APP_CLIENT_SECRET, and NEXT_PUBLIC_APP_URL env vars
- **Fix:** Added env vars to tests/setup.ts and .env.example
- **Files modified:** tests/setup.ts, .env.example
- **Verification:** All tests pass with env vars available
- **Committed in:** 0262fde (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for test environment correctness. No scope creep.

## Issues Encountered
- `npx prisma db push` failed due to missing DATABASE_URL (no local .env.local with Neon connection string). This is expected for the cloud-hosted database setup. Schema was validated via `prisma validate` and Prisma client generated successfully.

## User Setup Required
None - no new external service configuration required beyond existing .env.example variables.

## Next Phase Readiness
- All foundation modules ready for Phase 4 plans 02-07
- OAuth callback route handler (plan 02) can use buildAuthorizationUrl and exchangeCodeForTokens
- Metadata sync (plan 03) can use getSalesforceConnection and SUPPORTED_METADATA_TYPES
- REST API endpoints (plan 05-06) can use validateApiKey and checkRateLimit
- db push needed when DATABASE_URL is available to deploy new models

## Self-Check: PASSED

All 10 created files verified present. All 3 commit hashes verified in git log. No stubs found. No new threat surface outside plan's threat model.

---
*Phase: 04-salesforce-org-connectivity-and-developer-integration*
*Completed: 2026-04-06*
