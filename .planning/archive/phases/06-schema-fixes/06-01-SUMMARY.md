---
phase: 06-schema-fixes
plan: 01
subsystem: database
tags: [prisma, schema, questions, projects, nuqs]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Prisma schema with Project and Question models
  - phase: 02-discovery-knowledge
    provides: Question CRUD actions, question form, question table UI
provides:
  - sandboxStrategy field on Project model persisted through create/update
  - QuestionCategory enum with 8 values
  - category field on Question model with GENERAL default
  - Category select in question form
  - Category filter and column in question table
affects: [07-story-generation-e2e-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns: [nuqs useQueryState for URL-persisted category filter]

key-files:
  created: []
  modified:
    - prisma/schema.prisma
    - src/actions/projects.ts
    - src/actions/questions.ts
    - src/components/questions/question-form.tsx
    - src/components/questions/question-table.tsx
    - src/app/(dashboard)/projects/[projectId]/settings/page.tsx
    - src/app/(dashboard)/projects/[projectId]/questions/page.tsx
    - src/app/(dashboard)/projects/[projectId]/questions/questions-page-client.tsx

key-decisions:
  - "sandboxStrategy as String? (nullable free text) matching existing Textarea UI pattern"
  - "QuestionCategory with GENERAL default so existing rows remain valid without migration"
  - "db push deferred -- no DATABASE_URL in local env; schema validates and Prisma client generates correctly"

patterns-established:
  - "Category filter pattern: nuqs useQueryState + server-side where clause + Select dropdown"

requirements-completed: [PROJ-01, QUES-08]

# Metrics
duration: 3min
completed: 2026-04-07
---

# Phase 06 Plan 01: Schema Fixes Summary

**sandboxStrategy field wired through Project create/update/settings, QuestionCategory enum with 8-value category field, form select, and URL-persisted table filter**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T12:08:28Z
- **Completed:** 2026-04-07T12:11:45Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- sandboxStrategy field added to Project model and wired through createProject, updateProject, and settings page (was silently discarded)
- QuestionCategory enum with 8 values (BUSINESS_PROCESS, TECHNICAL, DATA, INTEGRATION, SECURITY, COMPLIANCE, DESIGN, GENERAL) added to schema
- Category field with GENERAL default on Question model, wired through create/update/filter actions
- Category select dropdown added to question form between Priority and Assignee
- Category filter dropdown and category column added to question table with nuqs URL state

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sandboxStrategy to Project model and wire through actions** - `ca3aaf3` (feat)
2. **Task 2: Add QuestionCategory enum, category field, form input, and table filter** - `5d30aa3` (feat)
3. **Task 3: Push schema to database and verify build** - No commit (Prisma validate + generate only; db push requires DATABASE_URL; no new TS errors introduced)

## Files Created/Modified
- `prisma/schema.prisma` - Added sandboxStrategy to Project, QuestionCategory enum, category to Question
- `src/actions/projects.ts` - sandboxStrategy in createProject data and updateProject updateData
- `src/actions/questions.ts` - category in create/update/filter schemas and action handlers
- `src/components/questions/question-form.tsx` - Category select dropdown with 8 options
- `src/components/questions/question-table.tsx` - CATEGORY_LABELS, categoryFilter nuqs state, filter dropdown, column header, cell
- `src/app/(dashboard)/projects/[projectId]/settings/page.tsx` - Read sandboxStrategy from project object instead of hardcoded ""
- `src/app/(dashboard)/projects/[projectId]/questions/page.tsx` - Category filter in server-side where clause
- `src/app/(dashboard)/projects/[projectId]/questions/questions-page-client.tsx` - category field on QuestionRow interface

## Decisions Made
- sandboxStrategy as String? (nullable free text) matching existing Textarea UI pattern in wizard/settings
- QuestionCategory with GENERAL default so existing rows remain valid without data migration
- db push deferred -- no DATABASE_URL configured in local environment; schema validates and Prisma client generates correctly; push will succeed on deploy or when env is configured

## Deviations from Plan

None - plan executed exactly as written. Task 3 db push could not run due to missing DATABASE_URL (no .env file, only .env.example), but schema validation and Prisma client generation succeeded. All pre-existing TS errors confirmed unrelated to this plan's changes.

## Issues Encountered
- `npx prisma db push` failed with "Connection url is empty" -- no .env file with DATABASE_URL. Verified schema with `prisma validate` (valid) and `prisma generate` (succeeded). Pre-existing TS errors in staleness-detection.ts, salesforce/client.ts, and oauth.test.ts confirmed unrelated to this plan.

## User Setup Required

Database push required when DATABASE_URL is configured:
```bash
npx prisma db push
```

## Next Phase Readiness
- Schema changes ready for deployment once DATABASE_URL is available
- Category field and filter pattern established for reuse in other entity types
- sandboxStrategy now properly persisted end-to-end

---
*Phase: 06-schema-fixes*
*Completed: 2026-04-07*
