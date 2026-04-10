---
phase: 01-foundation-and-data-layer
reviewed: 2026-04-06T12:00:00Z
depth: standard
files_reviewed: 40
files_reviewed_list:
  - .env.example
  - .gitignore
  - prisma.config.ts
  - prisma/schema.prisma
  - src/actions/projects.ts
  - src/actions/team.ts
  - src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
  - src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
  - src/app/(dashboard)/layout.tsx
  - src/app/(dashboard)/page.tsx
  - src/app/(dashboard)/projects/[projectId]/layout.tsx
  - src/app/(dashboard)/projects/[projectId]/page.tsx
  - src/app/(dashboard)/projects/[projectId]/settings/page.tsx
  - src/app/(dashboard)/projects/[projectId]/settings/team/page.tsx
  - src/app/(dashboard)/projects/new/page.tsx
  - src/app/api/inngest/route.ts
  - src/app/api/projects/route.ts
  - src/app/globals.css
  - src/app/layout.tsx
  - src/components/layout/app-shell.tsx
  - src/components/layout/project-switcher.tsx
  - src/components/layout/sidebar.tsx
  - src/components/layout/user-menu.tsx
  - src/components/projects/create-wizard.tsx
  - src/components/projects/project-settings-form.tsx
  - src/components/projects/team-management.tsx
  - src/components/projects/wizard-step-indicator.tsx
  - src/components/shared/empty-state.tsx
  - src/env.ts
  - src/lib/auth.ts
  - src/lib/db.ts
  - src/lib/encryption.ts
  - src/lib/inngest/client.ts
  - src/lib/inngest/events.ts
  - src/lib/inngest/functions/audit-log.ts
  - src/lib/project-scope.ts
  - src/lib/safe-action.ts
  - src/proxy.ts
  - tests/lib/audit-log.test.ts
  - tests/lib/encryption.test.ts
  - tests/lib/project-scope.test.ts
  - tests/setup.ts
  - vitest.config.ts
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-04-06T12:00:00Z
**Depth:** standard
**Files Reviewed:** 40
**Status:** issues_found

## Summary

Phase 1 establishes the foundation layer: Prisma schema, Clerk auth, Inngest background jobs, project CRUD, team management, encryption, and project-scoped data access. The codebase is well-structured overall with good separation of concerns, proper use of next-safe-action for server actions, and solid encryption implementation using AES-256-GCM with per-project key derivation.

Two critical security issues were found: (1) the `removeTeamMember` action does not verify the target member belongs to the specified project, allowing cross-project member removal, and (2) the `updateMemberRole` action has the same cross-project vulnerability. Several warnings relate to missing input validation on the `decrypt` function, the audit-log function writing to the wrong table schema, and inconsistent authorization in `updateProject`.

## Critical Issues

### CR-01: Cross-Project Member Removal (Authorization Bypass)

**File:** `src/actions/team.ts:100`
**Issue:** `removeTeamMember` calls `prisma.projectMember.update({ where: { id: parsedInput.memberId } })` using only the `memberId` without verifying the member actually belongs to `parsedInput.projectId`. An authenticated user with PM/SA role on Project A could remove a member from Project B by passing Project A's ID (to pass the role check) and a member ID from Project B.
**Fix:**
```typescript
// Verify the target member belongs to the specified project
const targetMember = await prisma.projectMember.findUnique({
  where: { id: parsedInput.memberId },
})
if (!targetMember || targetMember.projectId !== parsedInput.projectId) {
  throw new Error("Member not found in this project")
}

// Cannot remove yourself
if (callerMember.id === parsedInput.memberId) {
  throw new Error("You cannot remove yourself from the project.")
}

// Soft delete
await prisma.projectMember.update({
  where: { id: parsedInput.memberId },
  data: { status: "REMOVED", removedAt: new Date() },
})
```

### CR-02: Cross-Project Role Change (Authorization Bypass)

**File:** `src/actions/team.ts:140-148`
**Issue:** `updateMemberRole` has the same vulnerability as CR-01. It calls `prisma.projectMember.findUniqueOrThrow({ where: { id: parsedInput.memberId } })` without verifying the member belongs to `parsedInput.projectId`. A PM/SA on one project could escalate roles on another project.
**Fix:**
```typescript
const currentMember = await prisma.projectMember.findUniqueOrThrow({
  where: { id: parsedInput.memberId },
})
if (currentMember.projectId !== parsedInput.projectId) {
  throw new Error("Member not found in this project")
}
```

## Warnings

### WR-01: Audit Log Function Writes to Wrong Schema Shape

**File:** `src/lib/inngest/functions/audit-log.ts:13-22`
**Issue:** The `auditLogFunction` writes to `prisma.statusTransition.create()` expecting fields like `entityType`, `entityId`, `fromStatus`, `toStatus`, `transitionedById`, `transitionedByRole`, and `reason`. However, the events that trigger it (e.g., `AUDIT_SENSITIVE_OP` from `removeTeamMember`) send data shaped as `{ operation, projectId, memberId, performedBy }` -- none of the fields match. The function will throw at runtime because `event.data.entityType`, `event.data.entityId`, etc. are all `undefined`, and required columns in `StatusTransition` will be null.
**Fix:** Either (a) align the event payload to match the `StatusTransition` schema, or (b) create a generic audit log table, or (c) use a different handler shape for operational audit events vs. status transition events. The simplest immediate fix:
```typescript
// In src/actions/team.ts removeTeamMember, send event with correct shape:
await inngest.send({
  name: EVENTS.AUDIT_SENSITIVE_OP,
  data: {
    entityType: "ProjectMember",
    entityId: parsedInput.memberId,
    fromStatus: "ACTIVE",
    toStatus: "REMOVED",
    userId: ctx.userId,
    userRole: callerMember.role,
    reason: `Removed by ${ctx.userId}`,
  },
})
```

### WR-02: decrypt Does Not Validate Input Format

**File:** `src/lib/encryption.ts:32`
**Issue:** The `decrypt` function destructures `ciphertext.split(":")` into `[ivB64, tagB64, encB64]` without checking that exactly 3 parts exist. If passed a malformed string (e.g., missing a segment), `Buffer.from(undefined, "base64")` will throw a confusing error. This is a robustness concern -- callers may pass corrupted data from the database.
**Fix:**
```typescript
export async function decrypt(ciphertext: string, projectId: string): Promise<string> {
  const parts = ciphertext.split(":")
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format: expected iv:tag:encrypted")
  }
  const [ivB64, tagB64, encB64] = parts
  // ... rest of function
}
```

### WR-03: updateProject Missing Project Membership Check for Self

**File:** `src/actions/projects.ts:125`
**Issue:** The `updateProject` action calls `getCurrentMember(parsedInput.projectId)` which verifies the user is a member, but does not restrict by role. Any project member (including a QA or Developer) can update project settings (name, client name, engagement type, dates). Other team management operations correctly restrict to PM/SOLUTION_ARCHITECT via `requireRole`.
**Fix:**
```typescript
// Restrict project settings updates to PM and SA only
await requireRole(parsedInput.projectId, ["PM", "SOLUTION_ARCHITECT"])
```

### WR-04: scopedPrisma Does Not Scope create/upsert Operations

**File:** `src/lib/project-scope.ts:37-39`
**Issue:** The `scopedPrisma` extension only injects `projectId` into `args.where` when `"where" in args`. For `create` operations, the data is in `args.data`, not `args.where`. This means `scopedPrisma` only provides read/update/delete scoping, not write scoping. If a developer uses `scopedPrisma(projectA).someModel.create({ data: { projectId: projectB, ... } })`, it silently creates a record in the wrong project. This is a defensive programming gap -- the naming suggests full scoping but only partial scoping is enforced.
**Fix:** Document this limitation clearly in a JSDoc comment, or extend the middleware to also verify `args.data.projectId` matches on create/upsert:
```typescript
export function scopedPrisma(projectId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ args, query, model, operation }) {
        if (
          model &&
          MODELS_WITH_PROJECT_ID.includes(model as (typeof MODELS_WITH_PROJECT_ID)[number])
        ) {
          if ("where" in args) {
            args.where = { ...args.where, projectId }
          }
          // Enforce projectId on creates
          if ("data" in args && args.data && typeof args.data === "object" && !Array.isArray(args.data)) {
            (args.data as Record<string, unknown>).projectId = projectId
          }
        }
        return query(args)
      },
    },
  })
}
```

### WR-05: Dashboard Layout Relies on Unreliable Header for Pathname

**File:** `src/app/(dashboard)/layout.tsx:17`
**Issue:** The dashboard layout reads `x-pathname` or `x-invoke-path` from request headers to determine the current project ID. These headers are not set by Next.js by default -- they require custom middleware to inject them. The `src/proxy.ts` (Clerk middleware) does not inject `x-pathname`. If neither header is present, `pathname` is `""`, `projectId` is null, and the layout renders without project context. This means the sidebar will never show project-scoped navigation items from this layout, and access control is not enforced here (though the `[projectId]/layout.tsx` child layout does enforce it separately).
**Fix:** Either inject `x-pathname` in the Clerk middleware, or remove the pathname-based logic from this layout and rely solely on the child `[projectId]/layout.tsx` for project-scoped concerns:
```typescript
// In src/proxy.ts, add header injection:
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", req.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
})
```

## Info

### IN-01: ANTHROPIC_API_KEY Missing from .env.example

**File:** `.env.example`
**Issue:** `src/env.ts` requires `ANTHROPIC_API_KEY` as a non-optional server env var (`z.string().min(1)`), but `.env.example` does not include it. Developers will get a build-time error with no guidance on what key to add.
**Fix:** Add to `.env.example`:
```
# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...
```

### IN-02: Creating User Gets Empty displayName and email

**File:** `src/actions/projects.ts:65-66`
**Issue:** When creating the project, the creator's `ProjectMember` record is created with `displayName: ""` and `email: ""`. All other member creation paths (invite flow) populate these fields from Clerk. This means the creator will appear as a blank entry in the team table until the data is backfilled.
**Fix:**
```typescript
// Look up the current user's info from Clerk
const { clerkClient } = await import("@clerk/nextjs/server")
const clerk = await clerkClient()
const currentUser = await clerk.users.getUser(ctx.userId)

await prisma.projectMember.create({
  data: {
    projectId: project.id,
    clerkUserId: ctx.userId,
    displayName: `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() || "Unknown",
    email: currentUser.emailAddresses[0]?.emailAddress ?? "",
    role: "SOLUTION_ARCHITECT",
    status: "ACTIVE",
  },
})
```

### IN-03: console.error in Production Code

**File:** `src/lib/safe-action.ts:6`
**Issue:** `handleServerError` uses `console.error("Action error:", e.message)`. This is acceptable for development but should use a structured logger in production. Low priority for V1.
**Fix:** Replace with a structured logging call when a logging solution is adopted, or gate behind `process.env.NODE_ENV`:
```typescript
handleServerError(e) {
  if (process.env.NODE_ENV !== "production") {
    console.error("Action error:", e.message)
  }
  return e.message
}
```

---

_Reviewed: 2026-04-06T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
