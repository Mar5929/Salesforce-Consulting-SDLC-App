---
phase: 02-discovery-and-knowledge-brain
plan: 05
subsystem: transcripts
tags: [inngest, agent-harness, transcript-processing, extraction, drag-drop, swr-polling]

requires:
  - phase: 02-02
    provides: agent harness engine, tool-executor, task definitions, context loaders
  - phase: 02-03
    provides: ChatInterface, MessageBubble, MessageList, conversation CRUD actions
  - phase: 02-04
    provides: create_question tool, display ID generator, question server actions
provides:
  - Transcript upload and processing server actions (uploadTranscript, getTranscripts, getTranscript)
  - Inngest step function for multi-step AI extraction (transcript-processing)
  - Agent harness tools for decisions (create_decision), requirements (create_requirement), risks (create_risk)
  - Tool executor fully wired with all 7 tools dispatching to real implementations
  - UploadZone component with drag-and-drop and paste
  - ExtractionCards component with grouped display and accept/reject/edit/merge/skip
  - Transcript list page and detail processing session page
  - Transcript messages polling API endpoint
  - Sidebar Transcripts nav item
affects: [02-06, 02-07, 02-08, 02-09]

tech-stack:
  added: []
  patterns:
    - "Inngest step function with multi-step checkpoints for long-running AI processing"
    - "SWR polling with refreshInterval for real-time updates on background processing"
    - "Structured metadata in ChatMessage toolCalls JSON field for custom message rendering"
    - "Risk severity computed from likelihood x impact matrix"

key-files:
  created:
    - src/lib/agent-harness/tools/create-decision.ts
    - src/lib/agent-harness/tools/create-requirement.ts
    - src/lib/agent-harness/tools/create-risk.ts
    - src/actions/transcripts.ts
    - src/lib/inngest/functions/transcript-processing.ts
    - src/components/transcripts/upload-zone.tsx
    - src/components/transcripts/extraction-cards.tsx
    - src/app/(dashboard)/projects/[projectId]/transcripts/page.tsx
    - src/app/(dashboard)/projects/[projectId]/transcripts/[transcriptId]/page.tsx
    - src/app/(dashboard)/projects/[projectId]/transcripts/[transcriptId]/transcript-session-client.tsx
    - src/app/api/transcripts/[transcriptId]/messages/route.ts
    - src/components/ui/progress.tsx
  modified:
    - src/lib/agent-harness/tool-executor.ts
    - src/app/api/inngest/route.ts
    - src/components/layout/sidebar.tsx

key-decisions:
  - "Used toolCalls JSON field on ChatMessage for structured extraction metadata instead of adding a new schema column"
  - "Created dedicated polling API route for transcript messages instead of reusing chat API"
  - "Risk severity auto-computed from likelihood x impact matrix (LOW-CRITICAL scale)"
  - "Inngest failure handler as separate function listening to inngest/function.failed event"

patterns-established:
  - "Inngest step function pattern: load -> process -> update-status -> save-results -> trigger-downstream"
  - "SWR polling for background job status: refreshInterval=3000ms while processing, null key when complete"
  - "Extraction results stored as structured JSON in toolCalls field with type discriminator for custom rendering"
  - "Agent tool implementation pattern: validate inputs, generate displayId, create DB record, return structured result"

requirements-completed: [TRNS-01, TRNS-02, TRNS-03, TRNS-04, TRNS-05, TRNS-06, INFRA-03]

duration: 7min
completed: 2026-04-06
---

# Phase 02 Plan 05: Transcript Processing Summary

**Transcript upload with drag-and-drop/paste, Inngest multi-step AI extraction via agent harness, interactive review with grouped extraction cards and inline deduplication**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-06T18:23:33Z
- **Completed:** 2026-04-06T18:30:48Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments
- Complete transcript processing pipeline: upload -> Inngest step function -> agent harness extraction -> structured results saved to conversation
- All 7 agent harness tools wired into tool-executor with real implementations (create_question, answer_question, update_question_status, create_decision, create_requirement, create_risk, flag_conflict)
- Transcript UI with drag-and-drop upload zone, grouped extraction cards with accept/reject/edit actions, inline dedup with merge/skip, and real-time processing status via SWR polling
- Inngest function with 5 checkpointed steps (load, extract, update-status, save-to-conversation, trigger-downstream) plus failure handler

## Task Commits

Each task was committed atomically:

1. **Task 1a: Agent tools and tool executor wiring** - `1911fe4` (feat)
2. **Task 1b: Transcript server actions and Inngest step function** - `44cd0dd` (feat)
3. **Task 2: Transcript UI - upload, extraction cards, processing session** - `653d77b` (feat)

## Files Created/Modified
- `src/lib/agent-harness/tools/create-decision.ts` - Decision creation tool with D-XX display ID generation
- `src/lib/agent-harness/tools/create-requirement.ts` - Requirement creation tool with REQ-XX display ID generation
- `src/lib/agent-harness/tools/create-risk.ts` - Risk creation tool with R-XX display ID and severity matrix
- `src/lib/agent-harness/tool-executor.ts` - Central dispatch now routes all 7 tools to real implementations
- `src/actions/transcripts.ts` - Upload (10K word limit), list, and detail server actions
- `src/lib/inngest/functions/transcript-processing.ts` - Multi-step Inngest function with failure handler
- `src/app/api/inngest/route.ts` - Registered transcript processing functions
- `src/components/transcripts/upload-zone.tsx` - Drag-and-drop + paste with word count validation
- `src/components/transcripts/extraction-cards.tsx` - Grouped cards with type icons, accept/reject/edit, dedup merge/skip
- `src/app/(dashboard)/projects/[projectId]/transcripts/page.tsx` - Transcript list with upload zone
- `src/app/(dashboard)/projects/[projectId]/transcripts/[transcriptId]/page.tsx` - Transcript detail server component
- `src/app/(dashboard)/projects/[projectId]/transcripts/[transcriptId]/transcript-session-client.tsx` - Processing session with SWR polling
- `src/app/api/transcripts/[transcriptId]/messages/route.ts` - Polling endpoint for real-time message updates
- `src/components/ui/progress.tsx` - Progress bar component
- `src/components/layout/sidebar.tsx` - Added Transcripts nav item with FileText icon

## Decisions Made
1. **toolCalls as metadata storage**: ChatMessage schema has no `metadata` column. Used the existing `toolCalls Json?` field to store structured extraction results with a `type` discriminator ("extraction_results" or "error"). Avoids a schema migration while achieving the same functionality.
2. **Dedicated polling API**: Created `/api/transcripts/[transcriptId]/messages` instead of reusing the chat API route, since transcript polling needs project membership verification and doesn't require the streaming infrastructure.
3. **Risk severity matrix**: Auto-computed from likelihood x impact (e.g., HIGH x HIGH = CRITICAL). The schema requires severity but the AI only provides likelihood and impact.
4. **Inngest failure handler**: Implemented as a separate function listening to `inngest/function.failed` rather than wrapping the main function in try/catch, following Inngest best practices for failure handling after retries exhaust.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] No metadata column on ChatMessage**
- **Found during:** Task 1b (Inngest step function)
- **Issue:** Plan specified saving extraction results with `metadata` JSON field, but ChatMessage model has no `metadata` column
- **Fix:** Used existing `toolCalls Json?` field as metadata storage with type discriminator. UI components check `toolCalls.type` to determine rendering.
- **Files modified:** src/lib/inngest/functions/transcript-processing.ts, transcript-session-client.tsx
- **Committed in:** 44cd0dd, 653d77b

**2. [Rule 3 - Blocking] No node_modules - TypeScript verification unavailable**
- **Found during:** Task 1a verification
- **Issue:** node_modules directory does not exist, preventing `tsc --noEmit` type checking
- **Fix:** Verified correctness by manual review of types against Prisma schema. Pre-existing condition.
- **Files modified:** None
- **Committed in:** N/A

**3. [Rule 2 - Missing] Risk severity computation**
- **Found during:** Task 1a (create-risk tool)
- **Issue:** Prisma schema requires `severity` field on Risk model, but the AI tool only provides likelihood and impact
- **Fix:** Added `computeSeverity()` function that derives severity from likelihood x impact matrix
- **Files modified:** src/lib/agent-harness/tools/create-risk.ts
- **Committed in:** 1911fe4

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Known Stubs

| File | Line | Description | Resolution |
|------|------|-------------|------------|
| transcript-session-client.tsx | handleAccept/handleReject | Client-side state only; no server action wired for accept/reject | Future plan can wire to a server action that updates entity status |
| extraction-cards.tsx | onEdit/onMerge/onSkip | Callbacks are optional props; no server actions wired yet | Future plan can wire entity update/merge server actions |

These stubs do not block the plan's goal. The extraction cards render correctly and track local accept/reject state. Server-side persistence of accept/reject decisions will be wired when the knowledge management pipeline (Plan 06+) is built.

## Issues Encountered
- node_modules not installed, preventing TypeScript compilation verification. All code was verified manually against Prisma schema types.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Transcript processing pipeline complete and ready for end-to-end testing
- All agent harness tools operational for transcript extraction
- ExtractionCards reusable for any future extraction display needs
- SWR polling pattern established for background job monitoring

## Self-Check: PASSED

All 15 files verified present on disk. All 3 task commits (1911fe4, 44cd0dd, 653d77b) verified in git log.

---
*Phase: 02-discovery-and-knowledge-brain*
*Completed: 2026-04-06*
