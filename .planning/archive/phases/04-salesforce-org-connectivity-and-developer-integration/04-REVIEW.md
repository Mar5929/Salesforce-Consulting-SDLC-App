---
phase: 04-salesforce-org-connectivity-and-developer-integration
reviewed: 2026-04-06T18:30:00Z
depth: standard
files_reviewed: 42
files_reviewed_list:
  - src/actions/api-keys.ts
  - src/actions/org-analysis.ts
  - src/actions/org-connection.ts
  - src/app/(dashboard)/projects/[projectId]/org/analysis/analysis-client.tsx
  - src/app/(dashboard)/projects/[projectId]/org/analysis/page.tsx
  - src/app/(dashboard)/projects/[projectId]/org/page.tsx
  - src/app/(dashboard)/projects/[projectId]/settings/developer-api/developer-api-client.tsx
  - src/app/(dashboard)/projects/[projectId]/settings/developer-api/page.tsx
  - src/app/(dashboard)/projects/[projectId]/settings/org/connected-toast.tsx
  - src/app/(dashboard)/projects/[projectId]/settings/org/page.tsx
  - src/app/api/auth/salesforce/authorize/route.ts
  - src/app/api/auth/salesforce/callback/route.ts
  - src/app/api/v1/_lib/api-handler.ts
  - src/app/api/v1/context-package/route.ts
  - src/app/api/v1/org/components/route.ts
  - src/app/api/v1/project/summary/route.ts
  - src/app/api/v1/stories/[storyId]/status/route.ts
  - src/components/org/api-key-card.tsx
  - src/components/org/component-table.tsx
  - src/components/org/domain-review-card.tsx
  - src/components/org/org-connection-card.tsx
  - src/components/org/pipeline-stepper.tsx
  - src/components/org/process-review-card.tsx
  - src/components/org/sync-history-table.tsx
  - src/lib/agent-harness/context/business-processes.ts
  - src/lib/agent-harness/context/org-components.ts
  - src/lib/agent-harness/tasks/org-classify.ts
  - src/lib/agent-harness/tasks/org-synthesize.ts
  - src/lib/api-keys/generate.ts
  - src/lib/api-keys/middleware.ts
  - src/lib/api-keys/rate-limit.ts
  - src/lib/inngest/functions/metadata-sync.ts
  - src/lib/inngest/functions/org-ingestion.ts
  - src/lib/salesforce/client.ts
  - src/lib/salesforce/metadata-sync.ts
  - src/lib/salesforce/oauth.ts
  - src/lib/salesforce/types.ts
  - tests/actions/org-analysis.test.ts
  - tests/api/v1/context-package.test.ts
  - tests/api/v1/org-components.test.ts
  - tests/api/v1/story-status.test.ts
  - tests/lib/inngest/org-ingestion.test.ts
  - tests/lib/salesforce/metadata-sync.test.ts
findings:
  critical: 3
  warning: 6
  info: 4
  total: 13
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-04-06T18:30:00Z
**Depth:** standard
**Files Reviewed:** 42
**Status:** issues_found

## Summary

Phase 4 implements Salesforce Org Connectivity and Developer Integration: OAuth flow, metadata sync, brownfield ingestion pipeline, REST API with API key auth, and the associated UI. The code is well-structured with proper separation of concerns, thorough role-based access checks, and good use of Inngest step functions for reliability.

Key concerns: (1) OAuth state parameter uses raw projectId without CSRF token, creating a session fixation vector. (2) The rate limiter has a race condition that allows burst traffic to exceed limits. (3) The `bulkConfirmHighConfidence` action ignores the `minConfidence` parameter. (4) The OrgRelationship upsert uses a constructed ID that will never match, causing duplicate records.

## Critical Issues

### CR-01: OAuth State Parameter Lacks CSRF Protection

**File:** `src/lib/salesforce/oauth.ts:28`
**Issue:** The `state` parameter in the OAuth authorization URL is set to the raw `projectId`. The callback at `src/app/api/auth/salesforce/callback/route.ts:33` trusts this value directly. An attacker could craft a URL with a victim's projectId, tricking them into connecting their Salesforce org to a project they don't own. The callback only checks that the user has a Clerk session and that the project exists -- it does not verify the user has SA/PM role on the project referenced in `state`, nor does it use a CSRF token to bind the OAuth flow to the session that initiated it.
**Fix:** Generate a cryptographically random state token, store it server-side (e.g., in a short-lived database record or signed cookie) alongside the projectId and userId, then validate in the callback that the state matches and the user has the correct role:
```typescript
// In buildAuthorizationUrl:
const stateToken = randomBytes(32).toString("hex")
// Store { stateToken, projectId, userId } with short TTL
const state = stateToken

// In callback:
// 1. Look up stateToken -> get stored projectId + userId
// 2. Verify auth().userId matches stored userId
// 3. Verify user has SA/PM role on the stored projectId
```

### CR-02: OAuth Callback Missing Role Verification

**File:** `src/app/api/auth/salesforce/callback/route.ts:36-41`
**Issue:** The callback verifies only that a Clerk session exists (`userId`). It does not verify the user has SA/PM role on the project. The authorize route checks this, but the callback must independently verify because the state parameter comes from an untrusted source (the redirect URL). An attacker could initiate the flow from a project where they have access, then swap the state to a different projectId in the callback URL.
**Fix:** Add role verification in the callback before storing tokens:
```typescript
const member = await prisma.projectMember.findFirst({
  where: {
    projectId,
    clerkUserId: userId,
    role: { in: ["SOLUTION_ARCHITECT", "PM"] },
  },
})
if (!member) {
  return NextResponse.redirect(
    `${APP_URL}/projects/${projectId}/settings/org?error=oauth_failed`
  )
}
```

### CR-03: OrgRelationship Upsert Uses Fabricated ID

**File:** `src/lib/salesforce/metadata-sync.ts:183-195`
**Issue:** The `prisma.orgRelationship.upsert` uses `id: \`${fieldComponent.id}-${targetComponent.id}\`` in the `where` clause. Prisma's `upsert` with an `id` field requires that the `id` matches an existing record's primary key. Since these IDs are generated by the database (likely cuid2), the fabricated composite ID will never match an existing record, causing a new record to be created on every sync run. This results in duplicate OrgRelationship records accumulating with each sync.
**Fix:** Use a unique composite constraint (`@@unique([sourceComponentId, targetComponentId, relationshipType])`) in the Prisma schema, then upsert on that:
```typescript
await prisma.orgRelationship.upsert({
  where: {
    sourceComponentId_targetComponentId_relationshipType: {
      sourceComponentId: fieldComponent.id,
      targetComponentId: targetComponent.id,
      relationshipType: relType,
    },
  },
  create: {
    projectId,
    sourceComponentId: fieldComponent.id,
    targetComponentId: targetComponent.id,
    relationshipType: relType,
  },
  update: {
    relationshipType: relType,
  },
})
```

## Warnings

### WR-01: bulkConfirmHighConfidence Ignores minConfidence Parameter

**File:** `src/actions/org-analysis.ts:266-295`
**Issue:** The `minConfidence` parameter is accepted in the schema (line 263) but never used in the Prisma query (lines 274-280 and 283-289). The action confirms ALL unconfirmed records regardless of confidence score. The "Confirm All High-Confidence" button in the UI passes no confidence filter, so low-confidence AI suggestions get blindly confirmed alongside high-confidence ones.
**Fix:** Either filter by confidence in the query, or remove the `minConfidence` parameter if confidence scores are not stored on the records. If confidence is embedded in the description string (as done in `classifyComponents`), consider storing it as a numeric field on `DomainGrouping` and filtering:
```typescript
where: {
  projectId,
  isConfirmed: false,
  confidence: { gte: minConfidence }, // requires schema field
},
```

### WR-02: Rate Limiter Race Condition on Concurrent Requests

**File:** `src/lib/api-keys/rate-limit.ts:27-50`
**Issue:** The rate limiter reads the count and then writes the log entry in two separate operations without a transaction. Under concurrent requests, multiple requests can read the same count (e.g., 59 of 60 limit), all pass the check, and all write log entries, exceeding the limit. For the REST API used by Claude Code, this is a moderate risk since parallel requests are plausible.
**Fix:** Use a Prisma transaction or a single raw SQL query that atomically checks and inserts:
```typescript
const result = await prisma.$transaction(async (tx) => {
  const count = await tx.apiRequestLog.count({
    where: { apiKeyId, endpoint, timestamp: { gte: windowStart } },
  })
  if (count >= limit) return { allowed: false, remaining: 0 }
  await tx.apiRequestLog.create({ data: { apiKeyId, endpoint, method: "GET" } })
  return { allowed: true, remaining: limit - count - 1 }
})
```

### WR-03: Rate Limiter Hardcodes Method as "GET"

**File:** `src/lib/api-keys/rate-limit.ts:47`
**Issue:** The `method` field is hardcoded to `"GET"` when creating the request log entry. The PATCH endpoint (`/api/v1/stories/:id/status`) will log requests with the wrong HTTP method. This affects audit accuracy and could cause incorrect per-method rate limiting if that feature is added later.
**Fix:** Pass the HTTP method through from the API handler:
```typescript
export async function checkRateLimit(
  apiKeyId: string,
  endpoint: string,
  limit: number = 60,
  windowMs: number = 60_000,
  method: string = "GET" // Add parameter
)
```

### WR-04: Metadata Sync Count Tracking Is Inaccurate

**File:** `src/lib/salesforce/metadata-sync.ts:109-111`
**Issue:** The `syncMetadataType` function always increments `added` and never increments `modified`. The comment on line 108 acknowledges this limitation ("Count as added for simplicity since we can't distinguish"). The resulting `componentCounts` in the sync run record will show `modified: 0` always, making the sync history table misleading for incremental syncs where most components are updates.
**Fix:** Compare `createdAt` and `updatedAt` on the upserted record to distinguish creates from updates:
```typescript
const result = await prisma.orgComponent.upsert({ ... })
if (result.createdAt.getTime() === result.updatedAt.getTime()) {
  added++
} else {
  modified++
}
```

### WR-05: confirmDomainGrouping and confirmBusinessProcess Missing Project Scope Check

**File:** `src/actions/org-analysis.ts:102` and `src/actions/org-analysis.ts:189`
**Issue:** The `confirmDomainGrouping` action updates by `id` only (line 102-103) without verifying the domain grouping belongs to the given `projectId`. Similarly for `confirmBusinessProcess` (line 189). The `verifyAnalysisRole` check confirms the user has SA/PM role on `projectId`, but a malicious user could pass a valid `projectId` where they have access along with a `domainGroupingId` from a different project. Same pattern applies to `editDomainGrouping`, `editBusinessProcess`, and `rejectBusinessProcess`.
**Fix:** Add projectId to the where clause in all update/delete operations:
```typescript
await prisma.domainGrouping.update({
  where: { id: domainGroupingId, projectId }, // Add projectId
  data: { isConfirmed: true },
})
```

### WR-06: getIngestionStatus Missing Project Membership Check

**File:** `src/actions/org-analysis.ts:67-84`
**Issue:** The `getIngestionStatus` action queries domain grouping and business process counts for a project without verifying the caller is a member of that project. Any authenticated user could pass any projectId and learn whether org analysis has been performed and how many groupings/processes exist. While not a data leak of the actual content, it exposes project metadata.
**Fix:** Add a membership check before returning counts, similar to `listApiKeys`:
```typescript
.action(async ({ parsedInput, ctx }) => {
  const { projectId } = parsedInput
  const member = await prisma.projectMember.findFirst({
    where: { projectId, clerkUserId: ctx.userId, status: "ACTIVE" },
  })
  if (!member) throw new Error("Not a member of this project")
  // ... rest of query
})
```

## Info

### IN-01: Duplicated ConfidenceBadge Component

**File:** `src/components/org/domain-review-card.tsx:55-80` and `src/components/org/process-review-card.tsx:70-95`
**Issue:** The `ConfidenceBadge` component is identically defined in both files.
**Fix:** Extract to a shared `src/components/org/confidence-badge.tsx` and import from both.

### IN-02: console.error Left in Production Code

**File:** `src/app/api/auth/salesforce/callback/route.ts:81`, `src/lib/api-keys/middleware.ts:61`, `src/lib/inngest/functions/org-ingestion.ts:120`, `src/lib/inngest/functions/org-ingestion.ts:208`
**Issue:** Multiple `console.error` calls exist in production code paths. While useful for debugging, these should use a structured logger for production observability.
**Fix:** Replace with a structured logger when one is introduced. Low priority for V1.

### IN-03: Unused Badge Import in component-table.tsx

**File:** `src/components/org/component-table.tsx:21`
**Issue:** `Badge` is imported from `@/components/ui/badge` but the component uses inline `<span>` elements with manual class names for both the type badge and status badge instead. The status badge on lines 164-170 does use Badge, but the type badge on line 157 uses a raw span.
**Fix:** Either use the Badge component consistently or remove the import if switching to inline spans.

### IN-04: OrgConnectionCard Uses Server Action Directly Instead of useAction

**File:** `src/components/org/org-connection-card.tsx:89-109`
**Issue:** The component calls `disconnectOrg` and `requestSync` directly via `startTransition` and checks `result?.serverError`. This pattern bypasses the standard `useAction` hook from next-safe-action used everywhere else in the codebase. The error shape from direct invocation may differ from the `useAction` pattern, potentially missing error cases.
**Fix:** Refactor to use `useAction` from `next-safe-action/hooks` for consistency with the rest of the codebase:
```typescript
const { execute: disconnectOrgAction, isExecuting } = useAction(disconnectOrg, {
  onSuccess: () => { toast.success("Salesforce org disconnected"); ... },
  onError: ({ error }) => { toast.error(error.serverError ?? "Failed") },
})
```

---

_Reviewed: 2026-04-06T18:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
