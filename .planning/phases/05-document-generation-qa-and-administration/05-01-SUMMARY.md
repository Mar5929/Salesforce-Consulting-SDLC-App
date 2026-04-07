---
phase: 05-document-generation-qa-and-administration
plan: 01
subsystem: infra
tags: [s3, aws-sdk, defect-workflow, state-machine, inngest, branding, archive-guard]

requires:
  - phase: 05-00
    provides: Wave 0 test stubs and schema validation for Phase 5
provides:
  - Defect status machine with role-gated transitions
  - S3 document upload and presigned URL utilities
  - Firm branding configuration for document rendering
  - Archive guard middleware for project mutation prevention
  - Phase 5 Inngest event definitions
  - Sidebar navigation for Documents, Defects, PM Dashboard
affects: [05-02, 05-03, 05-04, 05-05, 05-06, 05-07, 05-08]

tech-stack:
  added: [docx, pptxgenjs, "@react-pdf/renderer", "jira.js", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"]
  patterns: [defect-status-machine, s3-singleton-client, archive-guard-pattern]

key-files:
  created:
    - src/lib/defect-status-machine.ts
    - src/lib/documents/branding.ts
    - src/lib/documents/s3-storage.ts
    - src/lib/archive-guard.ts
  modified:
    - src/lib/inngest/events.ts
    - src/components/layout/sidebar.tsx
    - package.json
    - tests/unit/defect-status-machine.test.ts
    - tests/unit/branding.test.ts
    - tests/unit/s3-storage.test.ts
    - tests/unit/archive-guard.test.ts

key-decisions:
  - "S3Client uses lazy singleton pattern with env-based configuration supporting both AWS S3 and Cloudflare R2"
  - "Defect status machine follows story-status-machine.ts pattern but with simpler role gating (only QA for VERIFIED)"
  - "ASSIGNED label displays as 'In Progress' in UI per RESEARCH.md pitfall 5"

patterns-established:
  - "Defect status machine: canTransitionDefect + getNextDefectStatuses with role-based VERIFIED gating"
  - "S3 storage: server-side key construction from projectId + cuid, never user-supplied (T-05-01)"
  - "Archive guard: assertProjectNotArchived called before project mutations (T-05-03)"

requirements-completed: [DOC-03, DOC-04, QA-03, PROJ-04]

duration: 4min
completed: 2026-04-07
---

# Phase 5 Plan 01: Shared Infrastructure Summary

**Defect status machine, S3 storage utilities, branding config, archive guard, Phase 5 Inngest events, and sidebar navigation for Documents/Defects/PM Dashboard**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-07T00:13:14Z
- **Completed:** 2026-04-07T00:17:32Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Installed 6 Phase 5 npm packages (docx, pptxgenjs, @react-pdf/renderer, jira.js, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
- Created defect status machine with OPEN->ASSIGNED->FIXED->VERIFIED->CLOSED lifecycle and QA-only VERIFIED gating
- Created S3 storage utilities with upload and presigned URL generation (5-min TTL default)
- Created branding config, archive guard, and 11 Phase 5 Inngest event definitions
- Added Documents, Defects (with badge), and PM Dashboard to sidebar navigation
- Implemented and passed 29 unit tests across all new modules

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create shared utilities** - `66d5589` (feat)
2. **Task 2: Update sidebar navigation with Phase 5 entries** - `12ddc8d` (feat)

## Files Created/Modified
- `src/lib/defect-status-machine.ts` - Defect lifecycle transition validation with role guards
- `src/lib/documents/branding.ts` - Hardcoded V1 firm branding configuration
- `src/lib/documents/s3-storage.ts` - S3 upload and presigned URL utilities
- `src/lib/archive-guard.ts` - Middleware guard preventing mutations on archived projects
- `src/lib/inngest/events.ts` - Added 11 Phase 5 event definitions
- `src/components/layout/sidebar.tsx` - Added Documents, Defects, PM Dashboard nav items
- `package.json` - Added 6 Phase 5 dependencies
- `tests/unit/defect-status-machine.test.ts` - 13 tests for status machine
- `tests/unit/branding.test.ts` - 4 tests for branding config
- `tests/unit/s3-storage.test.ts` - 8 tests for S3 utilities
- `tests/unit/archive-guard.test.ts` - 3 tests for archive guard

## Decisions Made
- S3Client uses lazy singleton pattern with env-based configuration supporting both AWS S3 and Cloudflare R2 (via S3_ENDPOINT)
- Defect status machine follows story-status-machine.ts pattern but with simpler role gating (only QA for VERIFIED transition)
- ASSIGNED label displays as "In Progress" in UI per RESEARCH.md pitfall 5
- Presigned URLs default to 300s (5 min) TTL per T-05-02 threat mitigation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- S3 test mocks required class-based mock constructors instead of vi.fn().mockImplementation() since AWS SDK uses `new` keyword -- resolved by creating MockS3Client, MockPutObjectCommand, MockGetObjectCommand classes

## User Setup Required

None - no external service configuration required. S3 credentials will be needed when document generation is used but that is configured in later plans.

## Next Phase Readiness
- All shared utilities ready for downstream Phase 5 plans
- Defect status machine available for 05-04 (QA workflow)
- S3 storage and branding available for 05-02/05-03 (document generation)
- Archive guard available for 05-07 (project archival)
- Inngest events available for all Phase 5 background jobs
- Sidebar navigation ready for all new Phase 5 pages

---
*Phase: 05-document-generation-qa-and-administration*
*Completed: 2026-04-07*
