# Phase 4 Spec: Work Management

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [04-work-management-gaps.md](./04-work-management-gaps.md)
> Depends On: Phase 1 (RBAC + auth), Phase 2 (Story Generation Pipeline, output schema, validation), Phase 3 (Discovery, Questions readiness signals), Phase 6 (`search_org_kb` hybrid retrieval — consumed via pipeline), Phase 9 (`assertProjectWritable` helper, polymorphic `Attachment` infrastructure), Phase 11 (embeddings enqueue API)
> Status: Draft (Wave 2 audit-fix applied 2026-04-14)
> Last Updated: 2026-04-14

---

## 1. Scope Summary

Phase 4 owns the **data layer + workflow + UI consumption** for Epic / Feature / Story / Task / TestCase / StoryComponent. It does NOT own the Story Generation Pipeline (Phase 2), the Tasks-tier UI (Phase 10, per DECISION-06), the archival lifecycle helper (Phase 9, per DECISION-10), embeddings infrastructure (Phase 11), or hybrid retrieval (Phase 6).

In-domain responsibilities:

1. EpicPhase auto-init + backfill (REQ-WORK-001).
2. Enrichment dedup fix (REQ-WORK-002).
3. Salesforce dev guardrails injected into Phase 2 pipeline prompts and Tier-1 project summary (REQ-WORK-003) — see GAP-WORK-006 below; this is a hard blocker for Phases 5/6.
4. Story Detail status controls (REQ-WORK-004).
5. Feature-level Generate Stories button (REQ-WORK-005).
6. Dual-mode OrgComponent selector (REQ-WORK-006).
7. UI consumption of pipeline cross-reference output (REQ-WORK-007 — UI-only post-fix).
8. UI consumption + persistence of pipeline-emitted test case stubs (REQ-WORK-008 — UI-only post-fix).
9. UI consumption of pipeline validation results (REQ-WORK-009 — UI-only post-fix).
10. Wire story generation UI to Phase 2 pipeline; enqueue story embeddings via Phase 11 (REQ-WORK-010, Addendum amendment).
11. Optimistic concurrency on Story / Epic / Feature edits with VersionHistory (REQ-WORK-011, per DECISION-08 orphan-owner assignment).
12. Component conflict resolution UI for pipeline Stage 5 output (REQ-WORK-012).
13. Polymorphic attachments for Story / Question entities (REQ-WORK-013, per DECISION-08 — Phase 9 owns the Defect refactor).
14. Initial KnowledgeArticle drafts per process/domain (REQ-WORK-014, per DECISION-08 PRD-13-17 ownership).
15. `assertProjectWritable` consumer wiring at every Phase 4 mutation entry point (per DECISION-10).

**In scope:** 14 functional requirements across 14 tasks (was 9; +5 added per audit fix plan).

**Resolved upstream:** GAP-WORK-007 (BA transitions) → Phase 1 REQ-RBAC-009. GAP-WORK-009 (acceptanceCriteria nullable) absorbed into REQ-WORK-009. PRD-9-08 (epic prefix uniqueness) → Phase 3 (per audit GAP-13 deferral). PRD-13-14 (planned KB placeholder) → Phase 6 (per DECISION-08).

---

## Addendum v1 Amendments (April 13, 2026; revised April 14, 2026 audit-fix)

These amendments integrate PRD Addendum v1 §5.2.3 (Story Generation Pipeline) into Phase 4. The Addendum supersedes the agent-harness model in any conflict.

- **Story Generation routing (REQ-WORK-010):** Story generation runs as the deterministic 7-stage pipeline (Addendum §5.2.3 Stages 1–7) owned by Phase 2. Phase 4 wires the UI to call `runStoryGenerationPipeline()` from Phase 2. Phase 4 does NOT register `storyGenerationTask`, agent-loop tools, or `create_test_case_stub` as a tool.
- **Story embeddings:** On `story.create` and `story.update` (mandatory-field changes), enqueue via Phase 11 `embeddings.enqueue()`. Pipeline reference and Phase 11 interface pinned in REQ-WORK-010 below.
- **Mandatory field validation (REQ-WORK-009):** Stage 3 of the pipeline performs deterministic validation in Phase 2. Phase 4 consumes `validation_result.errors[]` and renders per-field errors. No re-implementation of validation logic in Phase 4.
- **Component cross-reference (REQ-WORK-007):** Stage 4 of the pipeline calls `search_org_kb` (Phase 6 hybrid retrieval, returns `SearchResponse` per carry-forward decision #2). Phase 4 does NOT directly query `OrgComponent` via Prisma for generation context. Phase 4 renders the Stage 4 cross-reference output in the draft preview.
- **Conflict resolution (REQ-WORK-012):** Stage 5 of the pipeline runs Sonnet to resolve flagged collisions. Phase 4 renders `component_conflicts[]` in a modal with extend / replace / duplicate options.
- **Test case stubs (REQ-WORK-008):** Stage 2 emits `test_cases[]` inside the structured-output `story_draft` schema. Phase 4 does NOT register `create_test_case_stub` as an agent tool. Phase 4 persists the emitted test cases on draft accept via `createTestCases`.
- **Eval harness:** Story Generation eval harness owned by Phase 2. Phase 4 may add UI-level smoke tests.
- **Archive read-only gate (DECISION-10):** Every Phase 4 mutation entry point (story / epic / feature / question CRUD, status transitions, component edits, attachment uploads) calls `assertProjectWritable(projectId)` published by Phase 9. Phase 4 does NOT redefine this helper.

---

## 2. Functional Requirements

### 2.1 EpicPhase Auto-Initialization (REQ-WORK-001)

**Trace:** PRD-5-11 → no Addendum supersession.

- **What it does:** Automatically creates all 5 EpicPhase records (DISCOVERY, DESIGN, BUILD, TEST, DEPLOY) with `NOT_STARTED` status when a new epic is created. Backfills existing epics with zero EpicPhase records.
- **Inputs:** Epic creation via `createEpic` server action.
- **Outputs:** 5 EpicPhase rows per epic.
- **Business rules:**
  - The `initializeEpicPhases` action already exists in `src/actions/epic-phases.ts` (lines 113-148). Wire it into `createEpic`.
  - Backfill migration: query all epics with zero EpicPhase records; create the 5 default rows. Use `createMany` with `skipDuplicates`.
  - `createEpic` must call `assertProjectWritable(projectId)` before any write (DECISION-10).
- **Files:** `src/actions/epics.ts` (wire call + writable assertion), migration script for backfill.

### 2.2 Enrichment Dedup Fix (REQ-WORK-002)

**Trace:** PRD-10-09, PRD-5-32, PRD-5-33 → no Addendum supersession.

- **What it does:** Prevents the enrichment path from creating duplicate free-text component records.
- **Inputs:** `applyEnrichmentSuggestion` action with `COMPONENTS` category.
- **Outputs:** No duplicate `StoryComponent` rows.
- **Business rules:**
  - Refactor enrichment path to call `addStoryComponent` (which has dedup at lines 373-385 of `src/actions/stories.ts`) instead of raw `prisma.storyComponent.create`.
  - `applyEnrichmentSuggestion` must call `assertProjectWritable(projectId)` (DECISION-10).
- **Files:** `src/actions/enrichment.ts`.

### 2.3 Salesforce Guardrails in AI Prompts (REQ-WORK-003) [GAP-WORK-006 RESOLUTION]

**Trace:** PRD §15 (Salesforce Development Guardrails), PRD-26-02 → ADD-5.2.3-02 (Stage 2 prompt assembly).

- **What it does:** Defines the 6 Salesforce dev guardrails as a compact prompt module that Phase 2 Stage 2 (Sonnet draft) and the story enrichment task inject into their system prompts, and that the Tier-1 project summary embeds for ambient context.
- **Why this is a Phase 4 deliverable:** PROJECT_STATE.md and VERIFICATION-STEP-2.md flag this as a Phase 4 blocker for Phases 5/6 developer context. Even though Phase 2 owns the pipeline, the guardrail content + module + injection points are authored here as a published string artifact Phase 2 imports.
- **Inputs:** N/A (prompt configuration artifact).
- **Outputs:** AI-generated stories reference guardrail-aware component impacts and acceptance criteria; Tier-1 project summary surfaces guardrails for all downstream tasks.
- **Business rules:**
  - Create `src/lib/agent-harness/prompts/salesforce-guardrails.ts` exporting `SF_DEV_GUARDRAILS: string` (under 200 tokens). The 6 guardrails:
    1. **Governor Limits Awareness** — no SOQL/DML in loops; respect per-transaction limits.
    2. **Bulkification** — handlers operate on collections, not single records.
    3. **Test Class Requirements** — positive, negative, bulk, and assertion-based coverage.
    4. **Naming Conventions** — firm pattern enforcement (object/field/Apex/LWC).
    5. **Security Patterns** — CRUD/FLS checks, no hardcoded IDs, no SOQL injection.
    6. **Sharing Model Enforcement** — explicit `with sharing` / `without sharing` / `inherited sharing` declarations.
  - Phase 2 Stage 2 imports `SF_DEV_GUARDRAILS` and prepends it to the Sonnet draft system prompt with framing: "When generating acceptance criteria and component impacts, ensure the story narrative is consistent with these Salesforce development guardrails."
  - `storyEnrichmentTask` system prompt imports the same constant.
  - `getProjectSummary` Tier-1 context loader (Phase 2-owned but consumed everywhere) appends a `## Guardrails` block built from `SF_DEV_GUARDRAILS`.
  - The guardrails are **reminders for AI narrative**, not enforcement rules. Enforcement lives in Claude Code skills per PRD §15.
- **Cross-phase coordination:** Phase 2 must import this module in Stage 2 prompt assembly; Phase 5/6/8 inherit guardrail context via the Tier-1 project summary.
- **Files:** `src/lib/agent-harness/prompts/salesforce-guardrails.ts` (CREATE — Phase 4 owns).

### 2.4 Story Detail Status Controls (REQ-WORK-004)

**Trace:** PRD-10-14, PRD-19-04 → reuses Phase 1 REQ-RBAC-009.

- **What it does:** Adds status transition buttons to the story detail page so users can promote/demote a story without leaving detail view.
- **Inputs:** User clicking a transition button.
- **Outputs:** Story status updated; page refreshes.
- **Business rules:**
  - Use `getAvailableTransitions(currentStatus, userRoleGroup)` from `story-status-machine.ts`.
  - For DRAFT → READY transitions, surface pipeline `validation_result.errors[]` per-field (consumed from REQ-WORK-009).
  - Place controls in detail header next to "Enrich with AI".
  - Server-side `updateStoryStatus` calls `assertProjectWritable(projectId)` (DECISION-10).
  - **Note:** Tasks-tier UI is Phase 10 per DECISION-06; this requirement covers Story-tier only.
- **Files:** `src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/stories/[storyId]/story-detail-client.tsx`.

### 2.5 Feature-Level Generate Stories (REQ-WORK-005)

**Trace:** PRD-10-02, PRD-10-11 → ADD-5.2.3-01 (pipeline entry takes `epic_id` or `feature_id`).

- **What it does:** Adds a "Generate Stories" button on the feature detail page that initiates a feature-scoped pipeline run.
- **Inputs:** User click on feature detail.
- **Outputs:** Navigates to conversation page with `epicId` + `featureId`; pipeline run scoped to feature.
- **Business rules:**
  - `initiateStorySession` already accepts optional `featureId`.
  - Button visibility: SA, PM, BA only.
  - Calls `runStoryGenerationPipeline({ feature_id, ... })` per REQ-WORK-010.
  - Server entry calls `assertProjectWritable(projectId)` (DECISION-10).
- **Files:** `src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/feature-detail-client.tsx`.

### 2.6 Dual-Mode OrgComponent Selector (REQ-WORK-006)

**Trace:** PRD-10-09, PRD-5-32, PRD-5-33 → no Addendum supersession.

- **What it does:** Upgrades `ComponentSelector` to support free-text and linked OrgComponent modes.
- **Inputs:** User adding impacted components.
- **Outputs:** `StoryComponent` records with either `componentName` or `orgComponentId`.
- **Business rules:**
  - Mode toggle "Free Text" / "Link to Org". "Link to Org" disabled when project has 0 org components.
  - Linked mode autocomplete via `searchOrgComponents` (interface pinned below).
  - Selecting an org component sets `orgComponentId` and auto-populates `componentName` from `OrgComponent.label`.
  - At least one of `componentName` or `orgComponentId` must be non-null (application-level invariant; DB constraint optional).
  - AI-driven free-text → OrgComponent linking deferred to Phase 6.
  - All write paths call `assertProjectWritable` (DECISION-10).
- **Pinned interfaces (GAP-09 fix):**
  - `searchOrgComponents` (server action at `src/actions/org-components.ts#searchOrgComponents`):
    - Input Zod: `z.object({ projectId: z.string().cuid(), query: z.string().min(1).max(100), limit: z.number().int().min(1).max(50).default(20) })`
    - Return: `Promise<Array<{ id: string; apiName: string; label: string; componentType: string; domainGrouping: string | null }>>`
    - RBAC: any project member (Phase 1 REQ-RBAC-002).
    - Errors: `{ error: 'PROJECT_NOT_FOUND' | 'NOT_AUTHORIZED' | 'INVALID_INPUT' }`.
  - `getOrgComponentsForEpic`: REMOVED from Phase 4 scope (cross-reference now flows through pipeline Stage 4 per REQ-WORK-007).
  - `addStoryComponent` Zod schema accepts optional `orgComponentId: z.string().cuid().nullish()`. RBAC: SA / PM / BA.
- **Files:** `src/components/work/component-selector.tsx`, `src/actions/stories.ts` (`addStoryComponent` schema), `src/actions/org-components.ts` (CREATE).

### 2.7 Org Knowledge Cross-Reference UI (REQ-WORK-007)

**Trace:** PRD-10-12 → ADD-5.2.3-04 (Stage 4 hybrid retrieval via `search_org_kb`).

**Scope (post-audit-fix):** UI-only consumer of pipeline Stage 4 output. Phase 4 no longer loads `OrgComponent` via direct Prisma for generation context. Phase 6 owns `search_org_kb` (returns `SearchResponse` envelope per carry-forward decision #2).

- **What it does:** Renders pipeline Stage 4 cross-reference results in the story draft preview so the user can see which proposed components match (or conflict with) the connected org.
- **Inputs:** Pipeline output containing `cross_reference_result: { matches: SearchResponse, conflicts: ComponentConflict[] }`.
- **Outputs:** Cross-reference badges + tooltips on draft component rows.
- **Business rules:**
  - If `SearchResponse._meta.not_implemented === true` (Phase 6 not deployed yet), render a graceful fallback "Org KB cross-reference unavailable — verify components manually" notice.
  - When matches exist, show "Matches existing: `<apiName>`" badge with click-to-link affordance.
  - When conflicts exist, hand off to REQ-WORK-012 conflict modal.
  - Phase 4 does **not** call `search_org_kb` directly; the pipeline does.
- **Files:** `src/components/work/story-draft-cards.tsx` (cross-ref render), `src/components/work/draft-component-row.tsx` (CREATE).

### 2.8 Test Case Stub Persistence on Draft Accept (REQ-WORK-008)

**Trace:** PRD-10-08 → ADD-5.2.3-02 (Stage 2 structured output includes `test_cases[]`).

**Scope (post-audit-fix):** UI-only consumer + persistence layer. Phase 4 does NOT register `create_test_case_stub` as an agent tool; pipeline Stage 2 emits `test_cases[]` inside the `story_draft` schema.

- **What it does:** Persists `test_cases[]` from the accepted draft into `TestCase` records.
- **Inputs:** `StoryDraft.test_cases` array (emitted by Phase 2 Stage 2 schema).
- **Outputs:** `TestCase` records with `source: "STUB"` linked to the new story.
- **Business rules:**
  - On draft accept, after `createStory` returns, call `createTestCases(storyId, draft.test_cases)`.
  - `source: "STUB"` distinguishes from Phase 9 `AI_GENERATED` records (Phase 9 regenerates only `AI_GENERATED`).
  - Draft preview card shows `test_cases[]` (title, type, expected result) before accept.
  - Rollback semantics (GAP-10): if `createTestCases` fails after `createStory` succeeds, transactionally roll back the story to avoid orphaned test cases. Use `prisma.$transaction([createStory, createTestCases])`.
- **Pinned interface (GAP-09 fix):**
  - `createTestCases` (server action at `src/actions/test-cases.ts`):
    - Input Zod: `z.object({ storyId: z.string().cuid(), testCases: z.array(z.object({ title: z.string().min(1).max(200), expectedResult: z.string().min(1).max(2000), testType: z.enum(['HAPPY_PATH','EDGE_CASE','NEGATIVE','BULK']) })).min(1) })`
    - Return: `Promise<{ createdIds: string[] }>`
    - RBAC: SA / PM / BA / QA (Phase 1 REQ-RBAC-002 / 005).
    - Errors: `{ error: 'STORY_NOT_FOUND' | 'NOT_AUTHORIZED' | 'INVALID_INPUT' | 'PROJECT_ARCHIVED' }`.
    - Calls `assertProjectWritable(projectId)` (DECISION-10).
- **Files:** `src/actions/test-cases.ts` (CREATE), `src/components/work/story-draft-cards.tsx` (preview + accept flow).

### 2.9 DRAFT-to-READY Validation UI (REQ-WORK-009)

**Trace:** PRD-10-03, PRD-10-05, PRD-10-07, PRD-10-13, PRD-6-13 → ADD-5.2.3-03 (Stage 3 deterministic validation owned by Phase 2).

**Scope (post-audit-fix):** UI consumer of Phase 2 Stage 3 validation output. Phase 4 does NOT implement `validateStoryReadiness` — that lives in Phase 2 pipeline Stage 3 with the structural rules below.

- **What it does:** Renders `validation_result.errors[]` from the pipeline / from a Phase 2 standalone validator invoked at status-transition time. Surfaces "Fix with AI" remediation.
- **Inputs:** Phase 2 `validateStoryReadiness(storyId): Promise<{ ok: boolean; errors: Array<{ field: string; message: string; remediationHint?: string }> }>`.
- **Outputs:** Per-field error list in story detail; "Fix with AI" button triggering enrichment.
- **Business rules (validation rules to be enforced by Phase 2 Stage 3; ACs specified here per audit GAP-05):**
  1. **Persona format (PRD-10-03):** Regex `^As a [A-Z][a-zA-Z0-9 _-]+,` AND role name appears in `Project.stakeholders[]`. Empty / "Bob" / missing-comma forms FAIL.
  2. **Description (PRD-10-04):** Non-empty, trimmed.
  3. **Acceptance Criteria (PRD-10-05):**
     - Parse for `Given` / `When` / `Then` tokens.
     - Require ≥1 scenario classified as "happy path" AND ≥1 scenario classified as "exception". Heuristic regex fallback when classifier unavailable: scenarios containing `error|invalid|fail|reject|denied|exception` count as exception.
     - "it works" form FAILS.
  4. **Parent link (PRD-10-06):** `epicId` or `featureId` non-null (schema-enforced; double-check).
  5. **Story Points (PRD-10-07):** `> 0`. AI-suggest pathway emits `aiSuggestedPoints` on the draft; UI shows suggestion with explicit user confirm action before persisting.
  6. **TestCases ≥ 1 (PRD-10-08):** Includes `STUB` and `AI_GENERATED` sources.
  7. **StoryComponents ≥ 1 (PRD-10-09):** Free-text or linked.
- **UI behavior:**
  - Display all errors at once, per-field.
  - "Fix with AI" button calls `storyEnrichmentTask` with targeted prompt: "The following fields are missing or incomplete: [list]. Generate suggestions."
  - Fallback hint: "Use 'Enrich with AI' to fill missing fields."
  - `updateStoryStatus` server action calls `assertProjectWritable` (DECISION-10).
- **Pinned interface (GAP-09 fix):**
  - `validateStoryReadiness` (Phase 2 import path TBD by Phase 2 deep-dive):
    - Return: `Promise<{ ok: boolean; errors: Array<{ field: string; message: string; remediationHint?: string }> }>`
  - `updateStoryStatus` mismatch resolved: returns `{ error: 'NOT_READY'; validationErrors: Array<{ field, message }> }` on validation failure.
- **Files:** `src/components/work/story-detail-client.tsx`, `src/components/work/story-form.tsx` (consume validation result). `src/lib/story-validation.ts` is REMOVED from Phase 4 scope (relocated to Phase 2).

### 2.10 Optimistic Concurrency on Story / Epic / Feature Edits (REQ-WORK-011) [NEW per audit GAP-04 + DECISION-08]

**Trace:** PRD-5-26, PRD-19-11, PRD-19-12, PRD-25-03 → no Addendum supersession.

- **What it does:** Prevents silent overwrites on concurrent edits via version-based optimistic locking; snapshots prior state into `VersionHistory`; surfaces a diff modal on conflict.
- **Inputs:** `updateStory`, `updateEpic`, `updateFeature` server actions, each receiving `expectedVersion: number`.
- **Outputs:** Either successful update with incremented `version`, or `ConcurrencyError` (HTTP 409) with diff payload.
- **Business rules:**
  - Add `version Int @default(1)` column to `Story`, `Epic`, `Feature` (schema migration — confirm absence first).
  - On every update: compare `expectedVersion` with current `version` row inside a transaction. Mismatch → throw `ConcurrencyError` carrying current row state for diff.
  - `VersionHistory` table (already in schema per PRD-5-26) records every successful update: actor, entity type/id, prior JSON snapshot, timestamp.
  - On conflict, UI shows diff modal with two actions:
    - **Merge** — user manually reconciles fields, resubmits with new `expectedVersion`.
    - **Overwrite** — user explicitly chooses to clobber; prior state still snapshotted to `VersionHistory` first.
  - Never silent overwrite (PRD-19-12).
  - All update paths call `assertProjectWritable` (DECISION-10).
- **Pinned interface:**
  - `updateStory` Zod input adds: `expectedVersion: z.number().int().min(1)`.
  - Error response: `{ error: 'CONCURRENCY_CONFLICT'; currentVersion: number; currentValue: Story; conflictingFields: string[] }`.
- **Files:** `prisma/schema.prisma` (add `version` column, confirm `VersionHistory`), `src/actions/stories.ts` / `epics.ts` / `features.ts`, `src/components/work/concurrency-conflict-modal.tsx` (CREATE), migration script.

### 2.11 Component Conflict Resolution UI (REQ-WORK-012) [NEW per audit GAP-06]

**Trace:** PRD-10-12 → ADD-5.2.3-05 (Stage 5 conflict resolution).

- **What it does:** Surfaces pipeline Stage 5 `component_conflicts[]` as a per-conflict modal allowing user confirmation of extend / replace / duplicate decisions.
- **Inputs:** Pipeline output `component_conflicts: Array<{ draftComponent, existingOrgComponent, aiSuggestion: 'extend'|'replace'|'duplicate', rationale, confidence }>`.
- **Outputs:** User decisions written as `StoryComponent` records:
  - `extend` → set `orgComponentId` to existing component.
  - `replace` → new `StoryComponent` with `decisionRationale` field (verify schema; add migration if absent).
  - `duplicate` → new `StoryComponent` flagged `isDuplicate = true` with `decisionRationale`.
- **Business rules:**
  - Modal lists conflicts; per row shows existing component (apiName/label/semantics), AI proposal + rationale, accept / override controls.
  - User can override AI suggestion per row.
  - Persistence calls `assertProjectWritable` (DECISION-10).
- **Files:** `src/components/work/component-conflict-modal.tsx` (CREATE), `src/actions/stories.ts` (resolve action), potential `prisma/schema.prisma` migration for `decisionRationale` field.

### 2.12 Polymorphic Attachments on Story / Question (REQ-WORK-013) [NEW per audit GAP-07 + DECISION-08]

**Trace:** PRD-5-25 → no Addendum supersession.

**Scope split:** Phase 4 owns Story + Question attachment surface. Phase 9 owns Defect attachment refactor (per DECISION-08).

- **What it does:** Upload / list / delete attachments on Story and Question entities via polymorphic `Attachment` table (`entityType` + `entityId`).
- **Inputs:** File upload (S3 / Vercel Blob), entity reference.
- **Outputs:** `Attachment` rows; signed-URL downloads.
- **Business rules:**
  - Server actions `uploadAttachment(entityType, entityId, file)`, `listAttachments(entityType, entityId)`, `deleteAttachment(attachmentId)`.
  - MIME allowlist: `image/png`, `image/jpeg`, `application/pdf`, `text/csv`, `text/plain`. Size limit 25 MB.
  - RBAC: any project member can upload/list; only uploader or PM/SA can delete.
  - All write paths call `assertProjectWritable` (DECISION-10).
  - Storage backend: confirm with Phase 8 (document storage owner) — default to Vercel Blob if Phase 8 has not yet finalized.
- **Pinned interface:**
  - `uploadAttachment` Zod input: `z.object({ entityType: z.enum(['Story','Question']), entityId: z.string().cuid(), filename: z.string().min(1).max(255), mimeType: z.string(), sizeBytes: z.number().int().max(25_000_000) })`.
  - Return: `{ id: string; downloadUrl: string }`.
- **Files:** `src/actions/attachments.ts` (CREATE), `src/components/shared/attachment-list.tsx` (CREATE), schema confirmation for `Attachment` model.

### 2.13 Initial KnowledgeArticle Drafts per Process / Domain (REQ-WORK-014) [NEW per audit GAP-08 + DECISION-08]

**Trace:** PRD-13-17 → no Addendum supersession (this is bootstrap; ongoing KA writes are Phase 6).

- **What it does:** When a Phase 4 entity is first created (epic with new `domainGrouping`, or feature mapped to a new business process), Phase 4 writes an initial `KnowledgeArticle` draft scoped to that process/domain so Phase 6 has a seed to enrich.
- **Inputs:** Epic / Feature creation with novel domain or process mapping.
- **Outputs:** `KnowledgeArticle` row with `status: 'DRAFT'`, `source: 'PHASE_4_BOOTSTRAP'`, minimal title + slug, empty body for Phase 6 to populate.
- **Business rules:**
  - Detect "novel" via `SELECT 1 FROM KnowledgeArticle WHERE projectId=? AND process=? OR domain=? LIMIT 1`. If absent, create draft.
  - PRD-13-14 (planned-component placeholder KA entries) is **Phase 6** per DECISION-08.
  - Bootstrap path calls `assertProjectWritable` (DECISION-10).
- **Files:** `src/actions/epics.ts` / `features.ts` (bootstrap hook), `src/lib/ka-bootstrap.ts` (CREATE).

### 2.14 Story Generation UI → Pipeline Wire + Embeddings Enqueue (REQ-WORK-010) [NEW per audit GAP-01]

**Trace:** PRD-10-11, PRD-10-12, PRD-10-13 → ADD-5.2.3-01..07 (full 7-stage pipeline); Phase 11 §<embedding queue spec, see Phase 11 PHASE_SPEC §3 for `embeddings.enqueue`).

- **What it does:** Replaces all Phase 4 invocations of the legacy `storyGenerationTask` agent loop with calls to the Phase 2 `runStoryGenerationPipeline`. Enqueues story embeddings via Phase 11 on create / update.
- **Inputs:** UI trigger from conversation page or feature/epic detail.
- **Outputs:** Pipeline run that returns `story_draft`, `validation_result`, `cross_reference_result`, `component_conflicts[]`, `ai_suggestions[]`, `pipeline_run_id`. Story create / update enqueues embedding job.
- **Business rules:**
  - Pipeline call: `runStoryGenerationPipeline({ project_id, epic_id?, feature_id?, requirement_id?, prompt, user_id })` published by Phase 2 (signature pinned by Phase 2 deep-dive; Phase 4 imports the public function — no inline reimplementation).
  - Embeddings: on `story.create` and on `story.update` where mandatory fields change (persona / description / acceptanceCriteria / storyPoints), call `embeddings.enqueue({ entity_type: 'story', entity_id, content, project_id })` per Phase 11 PHASE_SPEC. Inngest event name: `embedding.requested` (per Phase 11 carry-forward). Failure semantics: queue retries 3x with exponential backoff; final failure pushes to DLQ; UI shows non-blocking "embedding pending" badge.
  - Surface `pipeline_run_id` in audit log row for traceability.
  - All entry points call `assertProjectWritable(projectId)` (DECISION-10).
- **UI rendering:**
  - `story_draft` → existing `StoryDraftCards`.
  - `cross_reference_result` → REQ-WORK-007 badges.
  - `component_conflicts[]` → REQ-WORK-012 modal.
  - `ai_suggestions[]` → inline suggestion chips above each draft field.
  - `validation_result.errors[]` → REQ-WORK-009 per-field display.
- **Files:** `src/lib/agent-harness/tasks/story-generation.ts` (REMOVE legacy task — now a thin pipeline-call wrapper), `src/components/work/story-draft-cards.tsx` (consume new payload shape), `src/actions/stories.ts` (post-create / post-update embeddings enqueue).

---

## 3. Technical Approach

### 3.1 Implementation Strategy

Order shifts post-audit-fix:

1. **Schema & data foundations** (REQ-001, 002, 011 schema migration) — EpicPhase backfill, dedup fix, optimistic-concurrency `version` columns + VersionHistory snapshotting. Zero AI involvement.
2. **Cross-phase contracts** (REQ-003 guardrails module, REQ-013 attachments scaffolding) — standalone artifacts other phases consume.
3. **Pipeline UI consumption** (REQ-010 wire, REQ-007 cross-ref UI, REQ-008 test-case persistence, REQ-009 validation rendering, REQ-012 conflict modal) — all UI-only consumers of Phase 2 pipeline output. Blocked on Phase 2 publishing the pipeline.
4. **UX features** (REQ-004, 005, 006) — independent UI work.
5. **Bootstrap hook** (REQ-014 KA drafts) — once epics / features stable.
6. **Archive gate wiring** (DECISION-10) — applied at every mutation in tasks above; not its own task because it threads through everything.

### 3.2 File / Module Structure

```
src/
  lib/
    agent-harness/
      prompts/
        salesforce-guardrails.ts                 — CREATE (REQ-003) [Phase 4 owns; Phase 2 imports]
      tasks/
        story-generation.ts                      — REWRITE as pipeline-call wrapper (REQ-010)
        story-enrichment.ts                      — MODIFY (import guardrails)
    ka-bootstrap.ts                              — CREATE (REQ-014)
  actions/
    epics.ts                                     — MODIFY (init phases, writable assert, KA bootstrap, optimistic-concurrency)
    features.ts                                  — MODIFY (writable assert, KA bootstrap, optimistic-concurrency)
    stories.ts                                   — MODIFY (orgComponentId, writable assert, optimistic-concurrency, post-create embeddings, conflict resolution)
    enrichment.ts                                — MODIFY (dedup fix, writable assert)
    test-cases.ts                                — CREATE (createTestCases)
    org-components.ts                            — CREATE (searchOrgComponents)
    attachments.ts                               — CREATE (REQ-013)
  components/
    work/
      component-selector.tsx                     — MODIFY (dual-mode)
      story-draft-cards.tsx                      — MODIFY (test cases, cross-ref badges, conflict modal trigger, ai_suggestions)
      draft-component-row.tsx                    — CREATE (REQ-007)
      component-conflict-modal.tsx               — CREATE (REQ-012)
      concurrency-conflict-modal.tsx             — CREATE (REQ-011)
    shared/
      attachment-list.tsx                        — CREATE (REQ-013)
  app/(dashboard)/projects/[projectId]/work/
    [epicId]/[featureId]/
      feature-detail-client.tsx                  — MODIFY (Generate Stories)
      stories/[storyId]/
        story-detail-client.tsx                  — MODIFY (status controls, validation render)
prisma/
  schema.prisma                                  — MODIFY (version columns on Story/Epic/Feature; confirm VersionHistory + Attachment + decisionRationale)
  migrations/                                    — Optimistic-concurrency + EpicPhase backfill scripts
```

### 3.3 Data Changes

- **Schema additions:**
  - `Story.version Int @default(1)`, `Epic.version Int @default(1)`, `Feature.version Int @default(1)` (REQ-011).
  - Confirm `VersionHistory` model exists per PRD-5-26; if absent, add per Phase 4.
  - Confirm `Attachment` polymorphic model; verify `entityType` enum includes `Story`, `Question`. (Defect added by Phase 9 per DECISION-08.)
  - `StoryComponent.decisionRationale String?` (REQ-012); confirm absence first.
  - `KnowledgeArticle.source` enum should include `'PHASE_4_BOOTSTRAP'` (Phase 6 may have authoritative enum; coordinate).
- **Removed from scope:** No app-side `validateStoryReadiness` in Phase 4 (Phase 2 owns; per audit GAP-02).

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| DRAFT→READY with 0 test cases | Blocked by Phase 2 Stage 3; Phase 4 renders | `validationErrors: [{ field: 'testCases', message: 'At least one test case must be defined' }]` |
| DRAFT→READY with malformed persona ("Bob") | Blocked | `{ field: 'persona', message: "Persona must follow 'As a [Role], ...' format using a stakeholder from the project list" }` |
| DRAFT→READY with AC missing exception scenario | Blocked | `{ field: 'acceptanceCriteria', message: 'Acceptance criteria require at least one happy-path AND one exception scenario in Given/When/Then format' }` |
| DRAFT→READY with persona role not in `Project.stakeholders` | Blocked | `{ field: 'persona', message: "Role '<X>' is not in the project stakeholder list" }` |
| Multiple missing fields | All errors returned at once | Array of per-field errors |
| Other transitions (READY→SPRINT_PLANNED) | No validation gate | Pass-through |
| Sprint-assigned story regressed to DRAFT | Allowed only with PM/SA confirmation; sprint assignment cleared | `{ error: 'STATUS_REGRESSION_REQUIRES_CONFIRMATION' }` until `forceRegress: true` flag set |
| OrgComponent search with no org connected | Empty results; UI hides linked-mode toggle | "No org components available — use free-text mode" |
| OrgComponent search returns 100+ results | Limit 20; user refines | N/A |
| Linked OrgComponent later deleted from org | `StoryComponent.orgComponentId` retained (orphan FK); display falls back to `componentName` | Warning badge "Linked component no longer in org" |
| Enrichment applied twice | Dedup prevents duplicates | Silent skip |
| Pipeline emits 0 test cases | Draft accepted; Phase 2 Stage 3 blocks READY | "At least one test case required" on transition |
| `createTestCases` fails after `createStory` succeeds (GAP-10) | `prisma.$transaction` rolls back story | `{ error: 'TEST_CASE_PERSIST_FAILED'; transactional: true }` |
| Concurrent DRAFT→READY transitions on same story (GAP-10) | Optimistic-concurrency `version` check rejects second writer | 409 `CONCURRENCY_CONFLICT` |
| Two BAs editing same story (REQ-011) | Second writer gets 409 with diff modal | `{ error: 'CONCURRENCY_CONFLICT'; currentVersion, currentValue }` |
| Discarded draft with orphaned in-memory test cases (GAP-10) | Test cases never persisted; in-memory only — drop on session end | N/A (no DB writes) |
| EpicPhase backfill races epic.create (GAP-10) | Backfill `INSERT … ON CONFLICT DO NOTHING` semantics via `createMany({ skipDuplicates: true })` | Idempotent |
| "Fix with AI" exceeds token budget (GAP-10) | Phase 2 enrichment task enforces ceiling; UI degrades to static suggestions | `{ error: 'TOKEN_CEILING'; useStaticHints: true }` |
| Long-prompt guardrails injection precedence (GAP-10) | Guardrails block placed at top of system prompt; truncation strategy preserves it last to drop | N/A |
| Pipeline `cross_reference_result._meta.not_implemented === true` (Phase 6 not deployed) | UI renders "cross-ref unavailable" notice | Graceful degradation |
| `assertProjectWritable` throws on archived project | All Phase 4 mutations return 409 | `{ error: 'PROJECT_ARCHIVED'; readOnly: true }` |
| Embeddings enqueue fails after story.create | Story persists; embedding job retries 3x; DLQ on final failure; UI shows "embedding pending" badge | Non-blocking |
| Attachment upload exceeds 25 MB | Rejected pre-upload | `{ error: 'FILE_TOO_LARGE'; maxBytes: 25_000_000 }` |
| KA bootstrap race: two epics in new domain created concurrently | `INSERT … ON CONFLICT DO NOTHING` on `(projectId, slug)` unique constraint | One winner; second silently skipped |
| Conflict modal closed without decision (REQ-012) | Draft remains in pending state; cannot accept until each conflict resolved | UI block on accept |
| Guardrails prompt token cost | ~200 tokens — negligible | N/A |

---

## 5. Integration Points

### From Phase 1
- **REQ-RBAC-009** resolves GAP-WORK-007.
- **REQ-RBAC-001..007** protect all Phase 4 server actions.

### From Phase 2 (CRITICAL)
- **`runStoryGenerationPipeline`** — Phase 4 imports as the sole story-generation entry point.
- **Pipeline output schema** — Phase 4 consumes `story_draft`, `validation_result`, `cross_reference_result`, `component_conflicts[]`, `ai_suggestions[]`, `pipeline_run_id`.
- **`validateStoryReadiness`** (Phase 2 Stage 3 standalone export) — Phase 4 calls on DRAFT→READY.
- **Tier-1 `getProjectSummary`** — embeds Phase 4 `SF_DEV_GUARDRAILS`.

### From Phase 3
- **REQ-DISC-001 / 008 / 010 / 011** — discovery readiness signals consumed by epic / feature scope decisions.

### From Phase 6
- **`search_org_kb`** — pipeline Stage 4 calls; returns `SearchResponse` envelope (carry-forward decision #2). Phase 4 consumes via pipeline output, never directly.

### From Phase 9 (CRITICAL — DECISION-10)
- **`assertProjectWritable(projectId)`** — Phase 4 imports and calls at every mutation entry point. Phase 4 does NOT redefine this helper.
- **`Attachment` polymorphic infra** — coordinated extension; Phase 9 owns Defect surface, Phase 4 adds Story / Question.

### From Phase 11
- **`embeddings.enqueue({ entity_type, entity_id, content, project_id })`** — Phase 4 calls on `story.create` / `story.update` (mandatory-field changes).
- Inngest event: `embedding.requested`.

### For Future Phases
- **Phase 5 (Sprint / Developer):** test case stubs available in context packages; OrgComponent links enable conflict detection; guardrails inherited via Tier-1 summary.
- **Phase 7 (Dashboards):** EpicPhase rows + story quality metrics meaningful with validation gate.
- **Phase 9 (QA):** STUB test cases are baseline preserved across `AI_GENERATED` regenerations.
- **Phase 10 (Work Tab UI):** consumes Story-tier data; renders Tasks-tier UI per DECISION-06.

---

## 6. Acceptance Criteria

- [ ] EpicPhase records auto-created (5 rows, NOT_STARTED) on epic create
- [ ] Existing epics without EpicPhase records backfilled idempotently
- [ ] Enrichment path does not create duplicate free-text component records
- [ ] `SF_DEV_GUARDRAILS` module exported from `src/lib/agent-harness/prompts/salesforce-guardrails.ts` covering all 6 guardrails under 200 tokens (REQ-WORK-003 / GAP-WORK-006)
- [ ] Phase 2 Stage 2 imports `SF_DEV_GUARDRAILS` (verified via Phase 2 integration test)
- [ ] `storyEnrichmentTask` imports and prepends guardrails
- [ ] Tier-1 project summary surfaces guardrails block
- [ ] Story detail page shows status transition controls per role
- [ ] Feature detail page has Generate Stories button
- [ ] ComponentSelector supports free-text + linked OrgComponent modes
- [ ] `searchOrgComponents` action implemented per pinned interface
- [ ] `addStoryComponent` accepts optional `orgComponentId`
- [ ] Story generation UI calls `runStoryGenerationPipeline` (no calls to legacy `storyGenerationTask`)
- [ ] Pipeline `cross_reference_result` rendered as badges; graceful fallback when `_meta.not_implemented === true`
- [ ] Pipeline-emitted `test_cases[]` displayed in draft preview; persisted on accept with `source: "STUB"` via transactional `createTestCases`
- [ ] DRAFT→READY blocked by Phase 2 Stage 3 validation; UI displays per-field errors
- [ ] Persona regex + stakeholder list cross-check enforced (PRD-10-03)
- [ ] AC requires Given/When/Then + ≥1 happy + ≥1 exception (PRD-10-05)
- [ ] Story Points AI suggestion + explicit user confirm flow implemented (PRD-10-07)
- [ ] "Fix with AI" button surfaces remediation suggestions; static fallback present
- [ ] Optimistic concurrency (REQ-WORK-011): `version` columns on Story/Epic/Feature; 409 `CONCURRENCY_CONFLICT` on stale `expectedVersion`; diff modal with Merge/Overwrite; VersionHistory snapshot on every overwrite; never-silent-overwrite assertion test
- [ ] Component conflict resolution modal renders pipeline `component_conflicts[]` with extend / replace / duplicate options (REQ-WORK-012)
- [ ] Polymorphic `Attachment` upload / list / delete for Story + Question with MIME allowlist + 25 MB cap (REQ-WORK-013)
- [ ] Initial KnowledgeArticle bootstrap drafts created on first novel domain / process (REQ-WORK-014)
- [ ] `runStoryGenerationPipeline` called with `pipeline_run_id` surfaced in audit log
- [ ] Story embeddings enqueued via Phase 11 on create + update; failure semantics non-blocking with DLQ
- [ ] Every Phase 4 mutation entry point calls `assertProjectWritable(projectId)`; archived-project tests return 409 (DECISION-10)
- [ ] No re-implementation of pipeline logic, validation logic, or `assertProjectWritable` helper inside Phase 4
- [ ] No regressions in existing CRUD / status transitions

---

## 7. Open Questions

- **OQ-1:** `KnowledgeArticle.source` enum extension — Phase 4 needs `'PHASE_4_BOOTSTRAP'` value. Confirm with Phase 6 deep-dive whether this enum is owned by Phase 6 schema migration or whether Phase 4 may add. **Default action:** Phase 4 adds during execution; Phase 6 absorbs in its deep-dive.
- **OQ-2:** Attachment storage backend — Vercel Blob vs S3. Phase 8 doc-gen owns broader storage decisions. **Default action:** start with Vercel Blob; revisit if Phase 8 standardizes elsewhere.
- **OQ-3:** Pipeline `runStoryGenerationPipeline` exact import path. **Pinned by:** Phase 2 deep-dive (must complete before REQ-WORK-010 task starts).

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | `/bef:deep-dive 4`. 9 of 11 gaps addressed. |
| 2026-04-13 | Addendum amendments | Pipeline-first integration; Phase 2 ownership. |
| 2026-04-14 | Wave 2 audit-fix (13 gap fixes per phase-04-audit.md) | Cites DECISION-06, DECISION-08, DECISION-10. Resolves GAP-WORK-006. Adds REQ-WORK-010..014. Reframes REQ-WORK-007/008/009 as UI-only consumers of Phase 2 pipeline. Pins interfaces. Adds optimistic concurrency, conflict modal, attachments, KA bootstrap. Carries forward decisions #2 (`SearchResponse` envelope), #5 (`assertProjectWritable` ordering). |
