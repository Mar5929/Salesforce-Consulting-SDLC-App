---
phase: 01-foundation-and-data-layer
fixed_at: 2026-04-06T12:15:00Z
review_path: .planning/phases/01-foundation-and-data-layer/01-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 1: Code Review Fix Report

**Fixed at:** 2026-04-06T12:15:00Z
**Source review:** .planning/phases/01-foundation-and-data-layer/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (2 Critical, 5 Warning)
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Cross-Project Member Removal (Authorization Bypass)

**Files modified:** `src/actions/team.ts`
**Commit:** cba6dd9
**Applied fix:** Added a lookup of the target member before removal and verified that `targetMember.projectId` matches `parsedInput.projectId`. If the member does not belong to the specified project, the action throws "Member not found in this project" before any mutation occurs.

### CR-02: Cross-Project Role Change (Authorization Bypass)

**Files modified:** `src/actions/team.ts`
**Commit:** cba6dd9
**Applied fix:** After fetching the current member in `updateMemberRole`, added a check that `currentMember.projectId` matches `parsedInput.projectId`. Throws "Member not found in this project" if the member belongs to a different project. (Committed together with CR-01 since both changes are in the same file.)

### WR-01: Audit Log Function Writes to Wrong Schema Shape

**Files modified:** `src/actions/team.ts`
**Commit:** 50c13b6
**Applied fix:** Aligned the `AUDIT_SENSITIVE_OP` event payload in `removeTeamMember` to match the `StatusTransition` schema expected by the audit log function. Changed fields from `{ operation, projectId, memberId, performedBy }` to `{ entityType, entityId, fromStatus, toStatus, userId, userRole, reason }`.

### WR-02: decrypt Does Not Validate Input Format

**Files modified:** `src/lib/encryption.ts`
**Commit:** 71d8987
**Applied fix:** Added input validation to `decrypt` that splits the ciphertext and checks for exactly 3 parts (iv:tag:encrypted) before destructuring. Throws a descriptive error "Invalid ciphertext format: expected iv:tag:encrypted" if the format is malformed.

### WR-03: updateProject Missing Project Membership Check for Self

**Files modified:** `src/actions/projects.ts`
**Commit:** 44849ed
**Applied fix:** Replaced `getCurrentMember(parsedInput.projectId)` with `requireRole(parsedInput.projectId, ["PM", "SOLUTION_ARCHITECT"])` in the `updateProject` action. Added `requireRole` to the import statement. Project settings updates are now restricted to PM and Solution Architect roles only.

### WR-04: scopedPrisma Does Not Scope create/upsert Operations

**Files modified:** `src/lib/project-scope.ts`
**Commit:** e597e3d
**Applied fix:** Extended the `$allOperations` middleware to also enforce `projectId` on `data` objects for create/upsert operations. Added a JSDoc comment documenting the full scoping behavior. The check verifies `"data" in args` and that `args.data` is a non-array object before injecting the projectId.

### WR-05: Dashboard Layout Relies on Unreliable Header for Pathname

**Files modified:** `src/proxy.ts`
**Commit:** 0d77101
**Applied fix:** Added `x-pathname` header injection in the Clerk middleware. After auth protection, the middleware now copies request headers, sets `x-pathname` to `req.nextUrl.pathname`, and returns `NextResponse.next()` with the updated headers. Also added the `NextResponse` import from `next/server`.

---

_Fixed: 2026-04-06T12:15:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
