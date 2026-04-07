---
phase: 04-salesforce-org-connectivity-and-developer-integration
fixed_at: 2026-04-06T18:45:00Z
review_path: .planning/phases/04-salesforce-org-connectivity-and-developer-integration/04-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-04-06T18:45:00Z
**Source review:** .planning/phases/04-salesforce-org-connectivity-and-developer-integration/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9
- Fixed: 9
- Skipped: 0

## Fixed Issues

### CR-01: OAuth State Parameter Lacks CSRF Protection

**Files modified:** `src/lib/salesforce/oauth.ts`, `src/app/api/auth/salesforce/authorize/route.ts`, `src/app/api/auth/salesforce/callback/route.ts`, `prisma/schema.prisma`
**Commit:** f96b313
**Applied fix:** Replaced raw projectId state parameter with a cryptographically random state token. Added `buildAuthorizationUrl` parameters for userId, made it async, and stores a server-side `OauthState` record (new Prisma model) with projectId, userId, and 10-minute TTL. Added `validateOAuthState` function that looks up, validates, and deletes the single-use token. Callback now resolves projectId from the validated state token instead of trusting the URL parameter directly.

### CR-02: OAuth Callback Missing Role Verification

**Files modified:** `src/app/api/auth/salesforce/callback/route.ts`, `src/lib/salesforce/oauth.ts`, `prisma/schema.prisma`
**Commit:** f96b313 (combined with CR-01)
**Applied fix:** Added independent role verification in the callback route. After validating the CSRF state token and confirming the session userId matches the initiating user, the callback now queries `projectMember` to verify SA or PM role before proceeding with token exchange. This prevents state parameter manipulation attacks.

### CR-03: OrgRelationship Upsert Uses Fabricated ID

**Files modified:** `src/lib/salesforce/metadata-sync.ts`, `prisma/schema.prisma`
**Commit:** 9ea58bd
**Applied fix:** Added `@@unique([sourceComponentId, targetComponentId, relationshipType])` constraint to the `OrgRelationship` model in the Prisma schema. Updated the upsert in `describeAndUpsertFields` to use the composite unique constraint (`sourceComponentId_targetComponentId_relationshipType`) in the `where` clause instead of the fabricated composite ID that would never match existing records. This prevents duplicate OrgRelationship records from accumulating on each sync run.

### WR-01: bulkConfirmHighConfidence Ignores minConfidence Parameter

**Files modified:** `src/actions/org-analysis.ts`, `tests/actions/org-analysis.test.ts`
**Commit:** 014b953
**Applied fix:** Removed the misleading `minConfidence` parameter from the Zod schema since neither `DomainGrouping` nor `BusinessProcess` models store a numeric confidence score. Updated the JSDoc to clearly document that the function confirms ALL unconfirmed records. Updated the corresponding test to remove the `minConfidence` argument. The UI callers already did not pass this parameter.

### WR-02: Rate Limiter Race Condition on Concurrent Requests

**Files modified:** `src/lib/api-keys/rate-limit.ts`
**Commit:** 0d2b8ed
**Applied fix:** Wrapped the count check and log insert in a `prisma.$transaction` call so that concurrent requests cannot all read the same count, pass the check, and exceed the limit. The count and insert now execute atomically within a single database transaction.

### WR-03: Rate Limiter Hardcodes Method as "GET"

**Files modified:** `src/lib/api-keys/rate-limit.ts`, `src/app/api/v1/_lib/api-handler.ts`
**Commit:** 0d2b8ed (combined with WR-02)
**Applied fix:** Added a `method` parameter (default `"GET"`) to `checkRateLimit`. Updated `withApiAuth` in the API handler to extract `request.method` and pass it through to `checkRateLimit`. PATCH and other HTTP methods now log the correct method in `ApiRequestLog`.

### WR-04: Metadata Sync Count Tracking Is Inaccurate

**Files modified:** `src/lib/salesforce/metadata-sync.ts`
**Commit:** 4f3739c
**Applied fix: requires human verification** Replaced the "count everything as added" logic with a comparison of `createdAt` and `updatedAt` timestamps on the upserted record. On a fresh create, both timestamps are equal (set to `now()`). On an update, `updatedAt` is refreshed by Prisma's `@updatedAt` directive while `createdAt` remains the original value. This correctly distinguishes creates from updates in the sync counts.

### WR-05: confirmDomainGrouping and confirmBusinessProcess Missing Project Scope Check

**Files modified:** `src/actions/org-analysis.ts`
**Commit:** 2e5f794
**Applied fix:** Added `verifyDomainGroupingOwnership` and `verifyBusinessProcessOwnership` helper functions that verify the target record belongs to the specified project via `findFirst` with both `id` and `projectId`. Added ownership verification calls to all six affected actions: `confirmDomainGrouping`, `rejectDomainGrouping`, `editDomainGrouping`, `confirmBusinessProcess`, `rejectBusinessProcess`, `editBusinessProcess`. Also scoped the `orgComponent.updateMany` in `rejectDomainGrouping` by adding `projectId` to its where clause.

### WR-06: getIngestionStatus Missing Project Membership Check

**Files modified:** `src/actions/org-analysis.ts`
**Commit:** b08cc7c
**Applied fix:** Added active project membership verification before returning ingestion counts. The action now queries `projectMember` with `clerkUserId` and `status: "ACTIVE"` and throws if the caller is not a member. Updated the handler signature to access `ctx.userId`.

## Skipped Issues

None -- all in-scope findings were fixed.

---

_Fixed: 2026-04-06T18:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
