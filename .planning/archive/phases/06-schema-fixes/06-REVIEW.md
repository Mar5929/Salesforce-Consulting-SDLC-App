---
phase: 06-schema-fixes
reviewed: 2026-04-07T12:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - prisma/schema.prisma
  - src/actions/projects.ts
  - src/actions/questions.ts
  - src/components/questions/question-form.tsx
  - src/components/questions/question-table.tsx
  - src/app/(dashboard)/projects/[projectId]/settings/page.tsx
  - src/app/(dashboard)/projects/[projectId]/questions/page.tsx
  - src/app/(dashboard)/projects/[projectId]/questions/questions-page-client.tsx
findings:
  critical: 3
  warning: 4
  info: 3
  total: 10
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-07T12:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed the Prisma schema, question server actions, question UI components, and related page files. The most critical finding is a **schema-application mismatch**: the `Question` model in the Prisma schema has no `priority` field, yet all application code (actions, forms, tables, page queries) references `priority` on questions. This will cause runtime errors. Additionally, the `getQuestions` action imports `scopedPrisma` but then uses the raw `prisma` client for queries, defeating project isolation. There are also authorization gaps in the `updateQuestion` and `deleteQuestion` actions, and plaintext credential storage in the schema.

## Critical Issues

### CR-01: Question model missing `priority` field -- schema/application mismatch

**File:** `prisma/schema.prisma:599-635`
**Issue:** The `Question` model has no `priority` field. However, `src/actions/questions.ts` (lines 35, 75, 111, 162, 302), `src/components/questions/question-form.tsx` (line 40), `src/components/questions/question-table.tsx` (line 44), and `src/app/(dashboard)/projects/[projectId]/questions/page.tsx` (line 31) all reference `priority` on questions. Any attempt to create, update, filter, or display question priority will fail at runtime with a Prisma unknown field error.
**Fix:** Add the `priority` field to the Question model in the Prisma schema:
```prisma
model Question {
  // ... existing fields after 'category'
  priority          Priority         @default(MEDIUM)
  // ... rest of fields
}
```

### CR-02: `getQuestions` imports `scopedPrisma` but uses raw `prisma` -- project isolation bypassed

**File:** `src/actions/questions.ts:295-321`
**Issue:** On line 295, `scopedPrisma(parsedInput.projectId)` is called and assigned to `db`, but lines 308 and 320 use the raw `prisma` client instead of `db`. The `where` clause does include `projectId` manually, so this is not an immediate data leak, but it defeats the purpose of the scoped client and violates the stated convention (docstring line 11: "All DB operations use scopedPrisma for project isolation (T-02-13)"). If the `where` clause construction ever has a bug, there is no safety net.
**Fix:** Replace `prisma` with `db` on lines 308 and 320:
```typescript
const [questions, total] = await Promise.all([
  db.question.findMany({
    where,
    // ...
  }),
  db.question.count({ where }),
])
```

### CR-03: Plaintext Salesforce OAuth tokens stored in database

**File:** `prisma/schema.prisma:416-417`
**Issue:** `sfOrgAccessToken` and `sfOrgRefreshToken` are stored as plain `String?` fields on the `Project` model. These are OAuth credentials that grant access to Salesforce orgs. Storing them in plaintext means any database breach or SQL injection exposes full org access. The schema already has a `keyVersion` field (line 423) suggesting encryption was intended but not implemented at the schema level.
**Fix:** These tokens must be encrypted at rest. Either:
1. Rename to `encryptedSfOrgAccessToken` / `encryptedSfOrgRefreshToken` and encrypt/decrypt in the application layer (similar to how `JiraConfig.encryptedToken` is handled -- line 40 in settings page excludes it from select), or
2. Use Prisma middleware or a custom extension to auto-encrypt/decrypt.

## Warnings

### WR-01: `updateQuestion` does not verify question belongs to project (non-status path)

**File:** `src/actions/questions.ts:138-186`
**Issue:** The `updateQuestion` action only fetches the existing question to verify `projectId` ownership when `updateFields.status` is set (lines 147-153). If the update does not include a status change (e.g., updating `questionText`, `priority`, or `category`), the action updates `where: { id: questionId }` without verifying the question belongs to the given `projectId`. A user who is a member of project A could update a question belonging to project B by passing project A's `projectId` (to pass the `getCurrentMember` check) and project B's `questionId`.
**Fix:** Always verify ownership before updating:
```typescript
const existing = await prisma.question.findUnique({
  where: { id: questionId },
  select: { projectId: true, status: true },
})
if (!existing || existing.projectId !== projectId) {
  throw new Error("Question not found")
}
// Then proceed with status validation if needed
```

### WR-02: `deleteQuestion` has no role-based access control

**File:** `src/actions/questions.ts:269-289`
**Issue:** The `deleteQuestion` action only checks that the user is a member of the project (`getCurrentMember`), but any team member (including QA or BA) can delete any question. This is inconsistent with `flagForReview` which restricts to `SOLUTION_ARCHITECT` only. Deletion is a more destructive operation than flagging and should have stricter access control.
**Fix:** Add role restriction, e.g.:
```typescript
await requireRole(parsedInput.projectId, ["PM", "SOLUTION_ARCHITECT"])
```

### WR-03: Question model missing `@@unique` constraint on `[projectId, displayId]`

**File:** `prisma/schema.prisma:599-635`
**Issue:** The `Story` model has `@@unique([projectId, displayId])` (line 596), but the `Question` model has no such constraint. Since `displayId` is generated via `generateDisplayId` and used for user-facing references (e.g., "Q-001"), a missing unique constraint could allow duplicate display IDs if there is a race condition during concurrent question creation, leading to ambiguous references.
**Fix:** Add a unique constraint to the Question model:
```prisma
model Question {
  // ... fields and relations ...
  @@unique([projectId, displayId])
}
```

### WR-04: `createProject` stores empty string for creator's `displayName` and `email`

**File:** `src/actions/projects.ts:62-71`
**Issue:** When creating the `ProjectMember` record for the creating user (lines 66-67), `displayName` is set to `""` and `email` to `""`. This means the project creator appears as an empty-named member. The team member invitation path (lines 80-98) correctly resolves display name and email from Clerk. The creator path should do the same.
**Fix:** Look up the current user's info from Clerk:
```typescript
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

## Info

### IN-01: `scopeEpicId` / `scopeFeatureId` not cleared when scope changes

**File:** `src/components/questions/question-form.tsx:150-188`
**Issue:** When the user changes scope from "EPIC" to "ENGAGEMENT", the previously selected `scopeEpicId` remains in the form state and will be submitted to the server. The conditional rendering hides the select UI, but the form value persists. This could associate a question with an epic even when the scope is "ENGAGEMENT".
**Fix:** Add a `useEffect` or `onChange` handler that clears `scopeEpicId` when scope is not "EPIC" and `scopeFeatureId` when scope is not "FEATURE":
```typescript
useEffect(() => {
  if (scope !== "EPIC") form.setValue("scopeEpicId", undefined)
  if (scope !== "FEATURE") form.setValue("scopeFeatureId", undefined)
}, [scope])
```

### IN-02: `QuestionTable` filter state declared but not connected to data fetching

**File:** `src/components/questions/question-table.tsx:104-108`
**Issue:** The `QuestionTable` component manages URL-persisted filter state via `nuqs` (lines 104-108), and receives an `onFilterChange` callback prop (line 56), but the filter state changes are never propagated -- `onFilterChange` is never called. The filters update the URL params, and the server component in `questions/page.tsx` reads those params, so this works via full-page navigation. However, the `onFilterChange` prop is dead code.
**Fix:** Either remove the `onFilterChange` prop from the interface, or invoke it when filters change if client-side filtering is intended.

### IN-03: Suspense boundary wraps already-resolved data

**File:** `src/app/(dashboard)/projects/[projectId]/questions/page.tsx:66-77`
**Issue:** The `QuestionsPage` server component awaits all data (questions, epics, features, teamMembers, reviewCount) before rendering. The `<Suspense>` wrapper around `QuestionsPageClient` on line 66 will never trigger its fallback because all promises are already resolved by that point. The Suspense boundary is a no-op.
**Fix:** Either remove the Suspense wrapper (since data is pre-fetched) or restructure to use Suspense-based streaming by not awaiting the data and passing promises to the client component.

---

_Reviewed: 2026-04-07T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
