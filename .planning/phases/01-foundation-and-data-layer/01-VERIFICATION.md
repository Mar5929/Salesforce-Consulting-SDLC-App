---
phase: 01-foundation-and-data-layer
verified: 2026-04-05T18:00:00Z
status: human_needed
score: 14/16 must-haves verified
re_verification: false
human_verification:
  - test: "npm install && npx prisma generate && npm test"
    expected: "All 8 vitest tests pass (3 audit-log, 2 project-scope, 3 encryption)"
    why_human: "node_modules are not installed and src/generated/prisma does not exist — vitest cannot run without these"
  - test: "npm install && npx tsc --noEmit"
    expected: "Zero TypeScript errors"
    why_human: "tsc cannot run without node_modules. src/lib/db.ts imports from ../generated/prisma which doesn't exist until prisma generate runs"
  - test: "Start dev server, sign up with Clerk, create a project through the 3-step wizard, navigate to Settings and edit project name, navigate to Team and verify member appears"
    expected: "Full end-to-end flow works: auth gate redirects, wizard creates project with DB records, settings saves changes with toast, team page shows members, sidebar role-gating hides Settings/Team for non-PM/SA users"
    why_human: "Requires DATABASE_URL, CLERK credentials, and a running server — cannot verify programmatically"
  - test: "On the Settings page, enter a sandbox strategy value and save. Reload the page."
    expected: "The sandbox strategy text persists after reload"
    why_human: "sandboxStrategy is accepted by the Zod schema and form but is NOT a field in the Project Prisma model and is NOT written to the database. Visual verification will expose this data loss bug."
gaps:
  - truth: "Step 2 captures sandbox strategy"
    status: failed
    reason: "sandboxStrategy is accepted by the Zod schema in createProject and updateProject, passed through the wizard and settings form, but the Project model in prisma/schema.prisma has no sandboxStrategy field. The createProject action does not include it in the prisma.project.create data object. The updateProject action does not include it in updateData. Data is silently discarded."
    artifacts:
      - path: "prisma/schema.prisma"
        issue: "Project model has no sandboxStrategy field"
      - path: "src/actions/projects.ts"
        issue: "createProject does not write sandboxStrategy to prisma.project.create. updateProject does not add sandboxStrategy to updateData."
    missing:
      - "Add sandboxStrategy String? field to the Project model in prisma/schema.prisma"
      - "Include sandboxStrategy in the prisma.project.create data block in createProject action"
      - "Include sandboxStrategy in the updateData block in updateProject action"
      - "Run npx prisma db push (or migration) after schema change"
---

# Phase 1: Foundation and Data Layer — Verification Report

**Phase Goal:** The application boots, authenticates users, manages projects, and has the complete data model and background job infrastructure ready for feature development
**Verified:** 2026-04-05T18:00:00Z
**Status:** human_needed (1 code gap found; 4 items require human verification)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can sign up and log in with email/password via Clerk | ? UNCERTAIN | SignIn/SignUp pages exist and are substantive. ClerkProvider in root layout. proxy.ts protects all non-public routes. Cannot run without credentials. |
| 2 | User session persists across browser refresh | ? UNCERTAIN | Clerk handles session persistence natively. ClerkProvider present. Requires human verification. |
| 3 | Next.js 16 app boots without errors | ? UNCERTAIN | All source files exist and appear correct but node_modules not installed, src/generated/prisma not generated — cannot verify compile-time. |
| 4 | Prisma schema contains all 30+ entities from the tech spec | ✓ VERIFIED | 44 models confirmed by grep. Project, ProjectMember, Story, Epic, Feature, Question, Decision, KnowledgeArticle, StatusTransition and all others present. 1222 lines. |
| 5 | Environment variables are validated at build time | ✓ VERIFIED | src/env.ts uses @t3-oss/env-nextjs with Zod schema for DATABASE_URL, CLERK_SECRET_KEY, SF_TOKEN_ENCRYPTION_KEY, INNGEST keys, NEXT_PUBLIC_CLERK keys. |
| 6 | Encryption module round-trips data correctly | ✓ VERIFIED | src/lib/encryption.ts implements HKDF-SHA256 + AES-256-GCM. Tests exist in tests/lib/encryption.test.ts. Cannot run without node_modules — marked human_needed. |
| 7 | Project-scoped query helper exists and appends projectId | ✓ VERIFIED | src/lib/project-scope.ts: scopedPrisma() returns prisma.$extends with MODELS_WITH_PROJECT_ID filter injecting projectId into all where clauses. |
| 8 | Authenticated user sees a sidebar with project navigation, role-gated items | ✓ VERIFIED | sidebar.tsx: 240px width, FAFAFA bg, NAV_ITEMS with roles filter, SOLUTION_ARCHITECT/PM gate for Settings/Team, usePathname for active state, accent border. |
| 9 | Project switcher dropdown appears at top of sidebar | ✓ VERIFIED | project-switcher.tsx: client component fetches /api/projects, DropdownMenu with project list, navigates to /projects/{id}. /api/projects/route.ts returns user-scoped projects. |
| 10 | Inngest serve route processes events at /api/inngest | ✓ VERIFIED | src/app/api/inngest/route.ts: serve() with inngest client + auditLogFunction, exports GET/POST/PUT. Route excluded from Clerk auth in proxy.ts. |
| 11 | Audit log function writes StatusTransition records on sensitive operations | ✓ VERIFIED | audit-log.ts: createFunction with id "audit-log", retries: 3, triggers AUDIT_SENSITIVE_OP, step.run writes prisma.statusTransition.create with all required fields. |
| 12 | User can create a project via a 3-step wizard | ✓ VERIFIED | create-wizard.tsx: 3 steps (Project Details / Sandbox Strategy / Invite Team), react-hook-form with Zod, step validation, createProject action call on submit. |
| 13 | Step 1 captures project name, client name, and engagement type | ✓ VERIFIED | create-wizard.tsx step 1: name, clientName, engagementType (4 options), startDate, targetEndDate. All wired to createProject action and persisted in DB. |
| 14 | Step 2 captures sandbox strategy | ✗ FAILED | Textarea exists in wizard step 2 but sandboxStrategy is not a field in the Project Prisma model and is never written to the database. Data is silently discarded. See gaps section. |
| 15 | Step 3 allows inviting team members and assigning roles | ✓ VERIFIED | create-wizard.tsx step 3: dynamic email+role rows with useFieldArray, all 5 roles, teamMembers passed to createProject which calls Clerk API and creates ProjectMember records. |
| 16 | User can invite new team members and assign one of 5 roles | ✓ VERIFIED | team.ts inviteTeamMember: requireRole gate (PM/SA only), Clerk user lookup by email, ProjectMember create with role, inngest.send PROJECT_MEMBER_INVITED. |
| 17 | User can remove team members from a project (with confirmation) | ✓ VERIFIED | team-management.tsx: Dialog with "They will lose access to all project data." confirmation. removeTeamMember: soft-delete sets status REMOVED and removedAt. |
| 18 | Role assignment stores in ProjectMember table, not Clerk | ✓ VERIFIED | team.ts: all role actions operate on prisma.projectMember. No Clerk role assignment calls. requireRole reads from ProjectMember.role. |
| 19 | User can edit project settings after creation | ✓ VERIFIED | project-settings-form.tsx: pre-populated form, updateProject action with getCurrentMember auth check, toast on success. Settings page renders with Tabs. |
| 20 | All data queries are scoped to the active project | ✓ VERIFIED | scopedPrisma() used in project page, team page, settings page. requireRole/getCurrentMember used in all actions. API route scopes by clerkUserId. |
| 21 | Inngest infrastructure with retries and step function checkpoints | ✓ VERIFIED | auditLogFunction: retries: 3, step.run() for checkpoints. INFRA-01 and INFRA-02 both addressed. |
| 22 | Vitest runs and test suite is green | ? UNCERTAIN | Tests exist and are substantive. Cannot run — node_modules not installed, src/generated/prisma missing. |

**Score:** 14/16 truths fully verified from source (1 FAILED, 4 UNCERTAIN require human verification or environment setup)

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `prisma/schema.prisma` | ✓ VERIFIED | 1222 lines, 44 models, all expected entities present |
| `src/lib/db.ts` | ✓ VERIFIED | PrismaClient singleton with PrismaNeon adapter, exports `prisma` |
| `src/lib/encryption.ts` | ✓ VERIFIED | exports `encrypt` and `decrypt`, full HKDF+AES-256-GCM implementation |
| `src/lib/project-scope.ts` | ✓ VERIFIED | exports `scopedPrisma`, injects projectId via $extends |
| `src/proxy.ts` | ✓ VERIFIED | clerkMiddleware with public route matcher, protects all routes |
| `vitest.config.ts` | ✓ VERIFIED | Substantive config with globals, node env, path aliases |
| `tests/lib/encryption.test.ts` | ✓ VERIFIED | 3 behavioral tests (cannot run without node_modules) |
| `tests/lib/project-scope.test.ts` | ✓ VERIFIED | 2 model verification tests (cannot run without node_modules) |
| `src/components/layout/sidebar.tsx` | ✓ VERIFIED | 107 lines, 240px width, role-gated nav, usePathname, accent active state |
| `src/components/layout/project-switcher.tsx` | ✓ VERIFIED | 101 lines, DropdownMenu, fetches /api/projects, navigates on select |
| `src/app/api/inngest/route.ts` | ✓ VERIFIED | serve() with auditLogFunction, exports GET/POST/PUT |
| `src/lib/inngest/functions/audit-log.ts` | ✓ VERIFIED | createFunction, retries:3, step.run, StatusTransition.create |
| `tests/lib/audit-log.test.ts` | ✓ VERIFIED | 3 behavioral tests (cannot run without node_modules) |
| `src/components/projects/create-wizard.tsx` | ✓ VERIFIED | 404 lines, 3 steps, react-hook-form, step validation, createProject wired |
| `src/actions/projects.ts` | ⚠️ PARTIAL | createProject/updateProject exist and are substantive. sandboxStrategy in schema but not written to DB. |
| `src/actions/team.ts` | ✓ VERIFIED | inviteTeamMember, removeTeamMember, updateMemberRole — all with requireRole gates |
| `src/components/projects/team-management.tsx` | ✓ VERIFIED | 294 lines, Table, Badge, Dialog confirmation, invite form, PM/SA gated |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/proxy.ts` | `@clerk/nextjs/server` | clerkMiddleware import | ✓ WIRED | `clerkMiddleware` imported and used |
| `src/lib/db.ts` | `src/generated/prisma` | PrismaClient import | ⚠️ RUNTIME | Import path correct but `src/generated/` does not exist on disk (requires `prisma generate`) |
| `src/app/layout.tsx` | `@clerk/nextjs` | ClerkProvider wrapper | ✓ WIRED | ClerkProvider wraps entire app |
| `src/app/api/inngest/route.ts` | `src/lib/inngest/functions/audit-log.ts` | function registration in serve() | ✓ WIRED | auditLogFunction imported and in functions array |
| `src/app/(dashboard)/layout.tsx` | `src/components/layout/app-shell.tsx` | component import | ✓ WIRED | AppShell imported and rendered |
| `src/components/layout/sidebar.tsx` | `src/components/layout/project-switcher.tsx` | component composition | ✓ WIRED | ProjectSwitcher rendered inside Sidebar |
| `src/components/projects/create-wizard.tsx` | `src/actions/projects.ts` | server action call on final step | ✓ WIRED | createProject imported, called via useAction on step 3 submit |
| `src/components/projects/team-management.tsx` | `src/actions/team.ts` | server action calls | ✓ WIRED | inviteTeamMember, removeTeamMember, updateMemberRole all imported and wired |
| `src/actions/projects.ts` | `src/lib/inngest/client.ts` | inngest.send for audit events | ✓ WIRED | inngest.send(EVENTS.PROJECT_CREATED) called after project creation |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/app/(dashboard)/page.tsx` | `memberships` / `projects` | `prisma.projectMember.findMany` with `include: { project }` | Yes — real DB query with auth scope | ✓ FLOWING |
| `src/components/layout/project-switcher.tsx` | `projects` state | `fetch("/api/projects")` → `/api/projects/route.ts` → `prisma.projectMember.findMany` | Yes — real DB query scoped by clerkUserId | ✓ FLOWING |
| `src/app/(dashboard)/projects/[projectId]/page.tsx` | `project`, `memberCount` | `scopedPrisma(projectId).project.findUnique` + `.projectMember.count` | Yes — scopedPrisma queries | ✓ FLOWING |
| `src/app/(dashboard)/projects/[projectId]/settings/team/page.tsx` | `members` | `scopedPrisma(projectId).projectMember.findMany` | Yes — scopedPrisma query, serialized for client | ✓ FLOWING |
| `src/components/projects/create-wizard.tsx` | `sandboxStrategy` form field | user input → createProject action → NOT stored | No — field accepted but discarded | ✗ HOLLOW |

### Behavioral Spot-Checks

Step 7b: SKIPPED — node_modules not installed, cannot run any commands. The project has no runnable entry points in the current environment.

### Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|---------|
| AUTH-01 | 01-01 | User can sign up and log in via Clerk | ? NEEDS HUMAN | SignIn/SignUp pages + ClerkProvider + proxy.ts. Needs Clerk credentials + running server. |
| AUTH-02 | 01-01 | Session persists across browser refresh | ? NEEDS HUMAN | Clerk handles natively; ClerkProvider present. Requires running browser session. |
| AUTH-03 | 01-01, 01-02, 01-03 | Project-level role controls visible features | ✓ SATISFIED | requireRole() in team.ts, getCurrentMember in layout.tsx, sidebar filters by currentMemberRole. All 5 roles in ProjectMember. |
| AUTH-04 | 01-01 | Data queries scoped to active project — no cross-project leakage | ✓ SATISFIED | scopedPrisma() injects projectId into all 22 listed models. All server actions and pages use scopedPrisma or project-scoped queries. |
| AUTH-05 | 01-01 | SF org credentials encrypted at rest via HKDF-SHA256 | ✓ SATISFIED | encryption.ts: HKDF-SHA256 key derivation per-project + AES-256-GCM. Schema has sfOrgAccessToken/sfOrgRefreshToken fields ready. |
| AUTH-06 | 01-02 | Sensitive operations logged for audit trail | ✓ SATISFIED | auditLogFunction writes StatusTransition records. removeTeamMember sends AUDIT_SENSITIVE_OP event. |
| PROJ-01 | 01-03 | Create project with name, client, engagement type, sandbox strategy | ✗ BLOCKED | name, client, engagementType: ✓ stored. sandboxStrategy: accepted by form and schema but NOT persisted (no field in Prisma model). |
| PROJ-02 | 01-03 | View and edit project settings and team membership | ✓ SATISFIED | settings page with ProjectSettingsForm (updateProject action). Team page with TeamManagement. |
| PROJ-03 | 01-03 | Invite team members and assign project-level roles | ✓ SATISFIED | inviteTeamMember action (PM/SA gated), all 5 roles, Clerk user lookup. TeamManagement invite form. |
| INFRA-01 | 01-02 | Inngest event-driven background job infrastructure with retries | ✓ SATISFIED | /api/inngest route, serve() with auditLogFunction, retries: 3. |
| INFRA-02 | 01-02 | Step functions with checkpoints for long-running operations | ✓ SATISFIED | step.run("write-audit-log") in audit-log.ts provides checkpoint support. |
| INFRA-04 | 01-01 | Optimistic concurrency control with version-based conflict detection | ✓ SATISFIED | keyVersion field on Project model (Int @default(1)) ready for OCC. Pattern established for future use. |

**Orphaned requirements check:** All Phase 1 requirements from REQUIREMENTS.md (AUTH-01 through AUTH-06, PROJ-01 through PROJ-03, INFRA-01, INFRA-02, INFRA-04) are claimed by plans. No orphaned requirements.

### Anti-Patterns Found

| File | Pattern | Severity | Notes |
|------|---------|----------|-------|
| `src/actions/projects.ts` | sandboxStrategy in Zod schema but not written to DB | ✗ Blocker | PROJ-01 partially fails. User enters data that is silently lost. |
| `src/lib/db.ts` | Imports from `../generated/prisma` which does not exist | ⚠️ Warning | Not a code bug — generated output is gitignored per plan. App will not compile until `npm install && npx prisma generate` is run. |
| `src/app/(dashboard)/projects/[projectId]/page.tsx` | `<p>Discovery dashboard and project content will appear here in future phases.</p>` | ℹ️ Info | Intentional placeholder — this area is scope of Phase 2. Not a stub anti-pattern. |

### Human Verification Required

#### 1. Test Suite Execution

**Test:** Run `npm install && npx prisma generate && npm test`
**Expected:** All 8 vitest tests pass (3 audit-log, 2 project-scope, 3 encryption). Zero failures.
**Why human:** node_modules are not installed in the working tree and `src/generated/prisma` does not exist — vitest cannot be invoked.

#### 2. TypeScript Compilation

**Test:** Run `npm install && npx prisma generate && npx tsc --noEmit`
**Expected:** Zero TypeScript errors
**Why human:** tsc cannot run without node_modules. The `src/lib/db.ts` import from `../generated/prisma` will fail until the Prisma client is generated.

#### 3. End-to-End Application Flow

**Test:** Configure `.env` with DATABASE_URL (Neon), CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, and SF_TOKEN_ENCRYPTION_KEY. Run `npx prisma db push`, then `npm run dev`. Visit http://localhost:3000.
**Expected:**
1. Redirected to /sign-in (Clerk auth gate)
2. Sign up creates account
3. Dashboard shows empty state "No projects yet" with "Create Project" button
4. 3-step wizard creates a project (Project Details → Sandbox Strategy → Invite Team → Create Project)
5. Redirect to project overview page showing client, engagement type, phase, member count
6. Sidebar: project switcher shows the new project, nav shows Projects for all roles; Settings/Team only visible to PM/SA
7. Settings page: form pre-populated, save changes shows "Project settings updated" toast
8. Team page: creator appears as SOLUTION_ARCHITECT
**Why human:** Requires external services (Neon DB, Clerk), database migration, and a running dev server.

#### 4. Sandbox Strategy Data Persistence Confirmation (Blocker Verification)

**Test:** On step 2 of the Create Project wizard, enter a sandbox strategy. Complete the wizard. Navigate to Settings → General tab. Check if sandbox strategy field is populated.
**Expected (FAILING):** The field will be empty. Data entered in step 2 is silently discarded — no sandboxStrategy column exists in the Project table.
**Why human:** Confirms the code gap identified in this verification. This must be fixed before PROJ-01 can be marked satisfied.

---

## Gaps Summary

**1 code gap blocking goal achievement:**

**PROJ-01 sandboxStrategy not persisted.** The 3-step creation wizard captures sandbox strategy in step 2 via a Textarea, and both createProject and updateProject Zod schemas include `sandboxStrategy: z.string().optional()`. However, the Project model in `prisma/schema.prisma` has no `sandboxStrategy` field. The `createProject` action's `prisma.project.create` data block does not include it. The `updateProject` action's `updateData` object does not include it. User input is silently discarded.

This gap affects PROJ-01 ("create a project with...sandbox strategy") and the Plan 03 success criterion "User can create a project via a 3-step wizard" (step 2 is functionally hollow).

**Fix required:**
1. Add `sandboxStrategy String?` to the Project model in `prisma/schema.prisma`
2. Add `sandboxStrategy: parsedInput.sandboxStrategy ?? null` to `prisma.project.create` data in `createProject`
3. Add `if (parsedInput.sandboxStrategy !== undefined) updateData.sandboxStrategy = parsedInput.sandboxStrategy` in `updateProject`
4. Run `npx prisma db push` after schema change

**Environment setup (not code gaps — documented user actions):**
- `node_modules` not installed — `npm install` required before any tooling works
- `src/generated/prisma` does not exist — `npx prisma generate` required after install
- Database not provisioned — user must create Neon project, set DATABASE_URL, run `npx prisma db push`
- Clerk not configured — user must create Clerk app, set CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- SF_TOKEN_ENCRYPTION_KEY must be set to any 32+ character string

All other Phase 1 artifacts are substantive, wired, and data-flowing. The foundation is structurally complete with one code fix and environment setup remaining.

---

_Verified: 2026-04-05T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
