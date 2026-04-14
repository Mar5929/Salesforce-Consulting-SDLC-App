# Phase 4 Tasks: Work Management

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 14
> Status: 0/14 complete
> Last Updated: 2026-04-14 (Wave 2 audit-fix)

---

## Execution Order

```
Schema foundation
Task 1  (EpicPhase init + backfill)        ──┐
Task 2  (Enrichment dedup)                    │
Task 11 (Optimistic concurrency + VersionHistory) ─── schema migration prerequisite for write tasks
                                              │
Cross-phase contracts (no runtime dependency)
Task 3  (SF Guardrails module) [GAP-WORK-006] ── Phase 2 imports downstream
Task 13 (Attachments) [Phase 9 coord]
                                              │
UX
Task 4  (Status controls)                    ─┤
Task 5  (Feature Generate Stories)           ─┤
Task 6  (Dual-mode OrgComponent selector)    ─┘
                                              │
Pipeline UI consumption (blocks on Phase 2 pipeline publish)
Task 10 (Wire UI → pipeline + embeddings enqueue) ── anchor task
  ├── Task 7  (Cross-reference UI render)
  ├── Task 8  (Test-case persistence on accept)
  ├── Task 9  (Validation result rendering)
  └── Task 12 (Conflict resolution modal)
                                              │
Bootstrap
Task 14 (KA bootstrap drafts)
```

All mutation tasks call `assertProjectWritable(projectId)` published by Phase 9 (DECISION-10). Tasks-tier UI is Phase 10 (DECISION-06); Phase 4 retains Tasks data/workflow only.

---

## Tasks

### Task 1: Auto-Initialize EpicPhase Records on Epic Creation

| Attribute | Details |
|-----------|---------|
| **Scope** | Wire `initializeEpicPhases` into `createEpic`; backfill existing epics with 0 EpicPhase records. Add `assertProjectWritable` at entry. |
| **Depends On** | Phase 9 (`assertProjectWritable` publish) |
| **Complexity** | S |
| **Status** | Not Started |
| **Trace** | PRD-5-11 |
| **Cites** | DECISION-10 |

**Acceptance Criteria:**
- [ ] `createEpic` calls `assertProjectWritable(projectId)` before any write (DECISION-10)
- [ ] `createEpic` calls `initializeEpicPhases` in same `prisma.$transaction` as the epic insert
- [ ] Phase-init failure rolls back epic creation
- [ ] Existing epics with 0 EpicPhase records backfilled with 5 `NOT_STARTED` rows via `createMany({ skipDuplicates: true })`
- [ ] Backfill idempotent; concurrent epic.create + backfill race is safe
- [ ] EpicPhase Grid displays real DB data (phantom fallback retained as safety net only)

**Implementation Notes:**
- `initializeEpicPhases` exists at `src/actions/epic-phases.ts` lines 113-148.
- Backfill query: `SELECT e.id FROM "Epic" e LEFT JOIN "EpicPhase" ep ON e.id = ep."epicId" GROUP BY e.id HAVING COUNT(ep.id) = 0`.

---

### Task 2: Fix Enrichment Dedup for Free-Text Components

| Attribute | Details |
|-----------|---------|
| **Scope** | Refactor `applyEnrichmentSuggestion` COMPONENTS path to call `addStoryComponent`; ensure `assertProjectWritable` guard. |
| **Depends On** | Phase 9 |
| **Complexity** | S |
| **Status** | Not Started |
| **Trace** | PRD-10-09, PRD-5-32, PRD-5-33 |
| **Cites** | DECISION-10 |

**Acceptance Criteria:**
- [ ] Applying enrichment twice creates 0 new duplicate rows
- [ ] Dedup matches `storyId + componentName + impactType`
- [ ] No destructive cleanup of pre-existing duplicates
- [ ] `applyEnrichmentSuggestion` calls `assertProjectWritable` (DECISION-10)

---

### Task 3: Salesforce Guardrails Module for AI Prompts [RESOLVES GAP-WORK-006]

| Attribute | Details |
|-----------|---------|
| **Scope** | Author `SF_DEV_GUARDRAILS` module covering the 6 SF dev guardrails. Phase 2 Stage 2 prompt, `storyEnrichmentTask`, and Tier-1 project summary all consume this module. |
| **Depends On** | None (published artifact) |
| **Complexity** | S |
| **Status** | Not Started |
| **Trace** | PRD §15, PRD-26-02 → ADD-5.2.3-02 |
| **Cites** | — (covers GAP-WORK-006) |

**Acceptance Criteria:**
- [ ] `src/lib/agent-harness/prompts/salesforce-guardrails.ts` exports `SF_DEV_GUARDRAILS: string`
- [ ] Module covers **all 6** guardrails explicitly named and numbered:
  1. Governor Limits Awareness (no SOQL/DML in loops; respect per-transaction limits)
  2. Bulkification (collections, not single records)
  3. Test Class Requirements (positive, negative, bulk, assertion-based)
  4. Naming Conventions (firm pattern enforcement)
  5. Security Patterns (CRUD/FLS, no hardcoded IDs, no SOQL injection)
  6. Sharing Model Enforcement (explicit with/without/inherited sharing)
- [ ] Module body under 200 tokens (compact numbered list, one-line each)
- [ ] Phase 2 Stage 2 prompt imports and prepends with framing: "When generating acceptance criteria and component impacts, ensure the story narrative is consistent with these Salesforce development guardrails."
- [ ] `storyEnrichmentTask` imports and prepends
- [ ] `getProjectSummary` Tier-1 context loader appends `## Guardrails` block built from the constant
- [ ] Unit test asserts the string mentions each of the 6 guardrail topics by keyword
- [ ] Integration test asserts a sample Stage 2 Sonnet draft response references at least one guardrail concept when prompted with a component that implicates it (e.g., a trigger story)

**Implementation Notes:**
- Framing matters: these are **reminders for AI narrative**; enforcement is in Claude Code skills per PRD §15.
- Place guardrails block at the TOP of the system prompt so truncation drops it last (edge case GAP-10).
- Coordinate with Phase 2 deep-dive agent so Stage 2 prompt assembly imports this module before Phase 2 execution.

---

### Task 4: Add Status Transition Controls to Story Detail Page

| Attribute | Details |
|-----------|---------|
| **Scope** | "Move to:" buttons on story detail header using `getAvailableTransitions`. Renders REQ-WORK-009 validation errors on DRAFT→READY failures. |
| **Depends On** | Phase 9, Task 9 (validation render shape) |
| **Complexity** | S |
| **Status** | Not Started |
| **Trace** | PRD-10-14, PRD-19-04 |
| **Cites** | DECISION-06 (Story-tier only; Tasks-tier is Phase 10), DECISION-10 |

**Acceptance Criteria:**
- [ ] Story detail shows available transitions per current status + user role
- [ ] Clicking calls `updateStoryStatus` + page refresh
- [ ] Transitions forbidden by role are hidden
- [ ] DRAFT→READY failure renders per-field `validationErrors` from pipeline Stage 3
- [ ] Server `updateStoryStatus` calls `assertProjectWritable` (DECISION-10)
- [ ] **Does NOT render Tasks-tier UI** (Phase 10 owns per DECISION-06)

---

### Task 5: Add Feature-Level Generate Stories Button

| Attribute | Details |
|-----------|---------|
| **Scope** | "Generate Stories" button on feature detail; calls `initiateStorySession` with `featureId`. |
| **Depends On** | Phase 9, Task 10 (pipeline wire) |
| **Complexity** | S |
| **Status** | Not Started |
| **Trace** | PRD-10-02, PRD-10-11 → ADD-5.2.3-01 |
| **Cites** | DECISION-10 |

**Acceptance Criteria:**
- [ ] Feature detail shows "Generate Stories" button (SA / PM / BA visibility)
- [ ] Button routes to conversation page with `epicId` + `featureId`
- [ ] Pipeline run scoped to feature per REQ-WORK-010
- [ ] Entry calls `assertProjectWritable` (DECISION-10)

---

### Task 6: Build Dual-Mode OrgComponent Selector

| Attribute | Details |
|-----------|---------|
| **Scope** | ComponentSelector mode toggle (Free Text / Link to Org). Create `searchOrgComponents` action. Update `addStoryComponent` schema with `orgComponentId`. |
| **Depends On** | Phase 9 |
| **Complexity** | M |
| **Status** | Not Started |
| **Trace** | PRD-10-09, PRD-5-32, PRD-5-33 |
| **Cites** | DECISION-10 |

**Acceptance Criteria:**
- [ ] Mode toggle "Free Text" / "Link to Org"; linked mode disabled when 0 org components
- [ ] Linked mode autocomplete via `searchOrgComponents(projectId, query, limit=20)`
- [ ] Results show `apiName`, `label`, `componentType`, `domainGrouping`
- [ ] Selecting sets `orgComponentId`; auto-populates `componentName` from `OrgComponent.label`
- [ ] `addStoryComponent` Zod schema accepts optional `orgComponentId: z.string().cuid().nullish()`
- [ ] App-level invariant: at least one of `componentName` or `orgComponentId` non-null
- [ ] `searchOrgComponents` Zod input matches spec §2.6 interface pin; returns typed array
- [ ] RBAC: search = any project member; add = SA / PM / BA (Phase 1 REQ-RBAC-002)
- [ ] All writes call `assertProjectWritable` (DECISION-10)

---

### Task 7: Render Pipeline Stage 4 Cross-Reference Output [REFRAMED per GAP-02, GAP-03]

| Attribute | Details |
|-----------|---------|
| **Scope** | UI-only consumer of pipeline `cross_reference_result`. Render badges + tooltips on draft component rows. Graceful fallback when `SearchResponse._meta.not_implemented === true`. |
| **Depends On** | Task 10 (pipeline wire), Phase 6 (`search_org_kb` deployment for full functionality) |
| **Complexity** | S (was M; scope shrank post-audit) |
| **Status** | Not Started |
| **Trace** | PRD-10-12 → ADD-5.2.3-04 |
| **Cites** | Carry-forward decision #2 (`SearchResponse` envelope) |

**Acceptance Criteria:**
- [ ] **No direct Prisma query for `OrgComponent`** in Phase 4 generation-context code paths
- [ ] Draft component rows show "Matches existing: `<apiName>`" badge when pipeline returns matches
- [ ] When `cross_reference_result._meta.not_implemented === true` (Phase 6 stub), render "Org KB cross-reference unavailable — verify manually" notice instead of empty state
- [ ] Click-to-link affordance on badge opens linked-mode flow (Task 6)
- [ ] Conflicts from the result are handed off to Task 12 conflict modal, not rendered here

**Implementation Notes:**
- The legacy `getOrgComponentsForEpic` function is **removed** from Phase 4 scope. Cross-reference flows through the pipeline only.
- Branch on `_meta.not_implemented`, not on array length (per carry-forward #2).

---

### Task 8: Persist Pipeline-Emitted Test Case Stubs on Draft Accept [REFRAMED per GAP-02]

| Attribute | Details |
|-----------|---------|
| **Scope** | UI-only consumer + persistence. NO agent-tool registration. Pipeline Stage 2 emits `test_cases[]` in `story_draft`. On accept, persist via `createTestCases` inside a transaction with `createStory`. |
| **Depends On** | Task 10 (pipeline wire), Phase 9 |
| **Complexity** | M (was L; scope shrank post-audit) |
| **Status** | Not Started |
| **Trace** | PRD-10-08 → ADD-5.2.3-02 |
| **Cites** | DECISION-10 |

**Acceptance Criteria:**
- [ ] `create_test_case_stub` tool is **NOT** registered in any Phase 4 agent-tools array (removed from scope)
- [ ] `StoryDraft` interface treats `test_cases[]` as read-only data emitted by pipeline Stage 2
- [ ] Draft preview card shows each test case as `[type badge] title — expected: ...`
- [ ] `handleAccept` calls `createTestCases(storyId, draft.test_cases)` inside `prisma.$transaction` with `createStory`
- [ ] `createTestCases` Zod matches spec §2.8 pinned schema (`z.object({ storyId, testCases: z.array(...).min(1) })`)
- [ ] Return: `{ createdIds: string[] }`
- [ ] RBAC: SA / PM / BA / QA
- [ ] `source: "STUB"` on every created TestCase
- [ ] Rollback: failure of `createTestCases` after `createStory` rolls back the story (transactional — edge case GAP-10)
- [ ] Server action calls `assertProjectWritable` (DECISION-10)
- [ ] Valid `testType` values: `HAPPY_PATH`, `EDGE_CASE`, `NEGATIVE`, `BULK`

---

### Task 9: Render Pipeline Stage 3 Validation Results on Status Transition [REFRAMED per GAP-02, GAP-05]

| Attribute | Details |
|-----------|---------|
| **Scope** | UI-only consumer of `validation_result.errors[]` from Phase 2 Stage 3 on DRAFT→READY. Per-field error display. "Fix with AI" remediation. NO Phase 4 validation logic. |
| **Depends On** | Task 8 (test case persistence), Task 10 (pipeline), Phase 2 Stage 3 `validateStoryReadiness` export |
| **Complexity** | M |
| **Status** | Not Started |
| **Trace** | PRD-10-03, PRD-10-05, PRD-10-07, PRD-10-13, PRD-6-13 → ADD-5.2.3-03 |
| **Cites** | DECISION-10 |

**Acceptance Criteria:**
- [ ] `src/lib/story-validation.ts` is **removed** from Phase 4 scope (relocated to Phase 2)
- [ ] `updateStoryStatus` calls Phase 2 `validateStoryReadiness(storyId)` on DRAFT→READY; on failure returns `{ error: 'NOT_READY', validationErrors: Array<{ field, message, remediationHint? }> }`
- [ ] UI displays all errors at once, per-field
- [ ] Persona validation (PRD-10-03): regex `^As a [A-Z][a-zA-Z0-9 _-]+,` AND role name appears in `Project.stakeholders[]` — verified against pipeline output (Phase 2 Stage 3 enforces; Phase 4 renders the message)
- [ ] AC validation (PRD-10-05): ≥1 happy AND ≥1 exception scenario in Given/When/Then — Phase 4 renders the granular per-scenario failure message
- [ ] Story Points (PRD-10-07): AI suggestion shown with explicit user confirm control before persistence
- [ ] "Fix with AI" button triggers `storyEnrichmentTask` with targeted prompt listing missing fields
- [ ] Static fallback hint: "Use 'Enrich with AI' to fill missing fields"
- [ ] Other transitions (READY→SPRINT_PLANNED, etc.) are NOT gated by field validation
- [ ] `updateStoryStatus` calls `assertProjectWritable` (DECISION-10)
- [ ] Return type consistent: success = `{ ok: true }`; failure = `{ error, validationErrors? }`

---

### Task 10: Wire Story Generation UI to Phase 2 Pipeline + Enqueue Story Embeddings [NEW per GAP-01]

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace legacy `storyGenerationTask` invocations with `runStoryGenerationPipeline` calls. Enqueue story embeddings via Phase 11 on `story.create` and mandatory-field `story.update`. Anchor task that Tasks 7 / 8 / 9 / 12 consume. |
| **Depends On** | Phase 2 (pipeline public function + output schema), Phase 11 (embeddings enqueue API), Phase 9 |
| **Complexity** | M |
| **Status** | Not Started |
| **Trace** | PRD-10-11, PRD-10-12, PRD-10-13 → ADD-5.2.3-01..07; Phase 11 PHASE_SPEC §3 (embeddings queue) |
| **Cites** | DECISION-10, Carry-forward decision #2 (`SearchResponse` envelope) |

**Acceptance Criteria:**
- [ ] Story generation UI calls **only** `runStoryGenerationPipeline({ project_id, epic_id?, feature_id?, requirement_id?, prompt, user_id })` — no `storyGenerationTask` invocations remain in Phase 4 code
- [ ] UI consumes the pipeline output schema: `story_draft`, `validation_result`, `cross_reference_result`, `component_conflicts[]`, `ai_suggestions[]`, `pipeline_run_id`
- [ ] `ai_suggestions[]` surface as inline suggestion chips above each draft field
- [ ] `component_conflicts[]` invokes Task 12 modal
- [ ] `pipeline_run_id` persisted in audit log on every run
- [ ] `story.create` server action enqueues: `embeddings.enqueue({ entity_type: 'story', entity_id, content, project_id })`
- [ ] `story.update` re-enqueues only when `persona`, `description`, `acceptanceCriteria`, or `storyPoints` changed
- [ ] Inngest event name `embedding.requested` (per Phase 11 carry-forward)
- [ ] Retry semantics: 3x exponential backoff; final failure routes to DLQ; UI shows non-blocking "embedding pending" badge
- [ ] All entry points call `assertProjectWritable(projectId)` (DECISION-10)
- [ ] Execution Order diagram in this TASKS.md includes Task 10 with dependency arrows to Tasks 7, 8, 9, 12 (done above)

**Implementation Notes:**
- Phase 2 publishes `runStoryGenerationPipeline` signature; Phase 4 imports the public function — do NOT reimplement.
- Phase 11 publishes `embeddings.enqueue` signature; Phase 4 imports — do NOT reimplement queue.
- `src/lib/agent-harness/tasks/story-generation.ts` becomes a thin wrapper that delegates to the pipeline (or is deleted if call sites import pipeline directly).

---

### Task 11: Optimistic Concurrency + VersionHistory for Story / Epic / Feature [NEW per GAP-04]

| Attribute | Details |
|-----------|---------|
| **Scope** | Add `version` columns to Story / Epic / Feature. Implement `expectedVersion` check in all update actions. Snapshot prior state to `VersionHistory`. Diff modal on 409 conflict with Merge / Overwrite options. |
| **Depends On** | Phase 9 |
| **Complexity** | M |
| **Status** | Not Started |
| **Trace** | PRD-5-26, PRD-19-11, PRD-19-12, PRD-25-03 |
| **Cites** | DECISION-08 (orphan owner), DECISION-10 |

**Acceptance Criteria:**
- [ ] Schema migration adds `version Int @default(1)` to `Story`, `Epic`, `Feature`
- [ ] `VersionHistory` model confirmed present per PRD-5-26 (add if absent)
- [ ] `updateStory`, `updateEpic`, `updateFeature` Zod inputs add `expectedVersion: z.number().int().min(1)`
- [ ] On mismatch, throw `ConcurrencyError`; server returns 409 with `{ error: 'CONCURRENCY_CONFLICT', currentVersion, currentValue, conflictingFields }`
- [ ] On success, increment `version` and write `VersionHistory` row (actor, entityType, entityId, priorJson, timestamp) inside the transaction
- [ ] Diff modal shows conflicting fields with Merge (manual reconcile, resubmit new `expectedVersion`) and Overwrite (explicit clobber; prior state still snapshotted) actions
- [ ] Never silent overwrite (PRD-19-12) — test asserts overwrite path writes VersionHistory before applying new value
- [ ] All update paths call `assertProjectWritable` (DECISION-10)
- [ ] Two-user concurrent-edit test passes

---

### Task 12: Component Conflict Resolution UI (Pipeline Stage 5) [NEW per GAP-06]

| Attribute | Details |
|-----------|---------|
| **Scope** | Render pipeline `component_conflicts[]` as modal with per-row extend / replace / duplicate options. Persist decisions as `StoryComponent` records with optional `decisionRationale`. |
| **Depends On** | Task 10 (pipeline wire), Task 6 (dual-mode selector), Phase 9 |
| **Complexity** | M |
| **Status** | Not Started |
| **Trace** | PRD-10-12 → ADD-5.2.3-05 |
| **Cites** | DECISION-10 |

**Acceptance Criteria:**
- [ ] Modal lists conflicts; per row shows existing component (apiName / label / semantics), AI proposal (extend / replace / duplicate), rationale, confidence
- [ ] User can override AI suggestion per row
- [ ] Persistence:
  - `extend` → set `StoryComponent.orgComponentId` to existing component id
  - `replace` → new `StoryComponent` with `decisionRationale`
  - `duplicate` → new `StoryComponent` with `isDuplicate = true` and `decisionRationale`
- [ ] Schema migration adds `StoryComponent.decisionRationale String?` if absent
- [ ] Draft cannot be accepted while conflicts remain unresolved (UI gate)
- [ ] Server action calls `assertProjectWritable` (DECISION-10)

---

### Task 13: Polymorphic Attachments for Story / Question [NEW per GAP-07 + DECISION-08]

| Attribute | Details |
|-----------|---------|
| **Scope** | Upload / list / delete `Attachment` rows for Story and Question entities via polymorphic model. Phase 9 owns Defect refactor (per DECISION-08). |
| **Depends On** | Phase 9 (polymorphic `Attachment` infra + `assertProjectWritable`) |
| **Complexity** | M |
| **Status** | Not Started |
| **Trace** | PRD-5-25 |
| **Cites** | DECISION-08, DECISION-10 |

**Acceptance Criteria:**
- [ ] `Attachment` model confirmed polymorphic (`entityType` enum includes `Story`, `Question`)
- [ ] `uploadAttachment` Zod input: `z.object({ entityType: z.enum(['Story','Question']), entityId: z.string().cuid(), filename, mimeType, sizeBytes: z.number().int().max(25_000_000) })`
- [ ] MIME allowlist: `image/png`, `image/jpeg`, `application/pdf`, `text/csv`, `text/plain`
- [ ] Size cap 25 MB enforced pre-upload
- [ ] `listAttachments(entityType, entityId)` returns signed-URL downloads
- [ ] `deleteAttachment(attachmentId)` gated to uploader OR PM/SA
- [ ] All write paths call `assertProjectWritable` (DECISION-10)
- [ ] Storage backend: Vercel Blob default; coordinate with Phase 8 per OQ-2

---

### Task 14: Initial KnowledgeArticle Bootstrap Drafts [NEW per GAP-08 + DECISION-08]

| Attribute | Details |
|-----------|---------|
| **Scope** | On epic / feature creation with novel `domainGrouping` or business-process mapping, write an initial `KnowledgeArticle` draft so Phase 6 has a seed. |
| **Depends On** | Phase 9, Phase 6 (for `KnowledgeArticle.source` enum coordination — OQ-1) |
| **Complexity** | S |
| **Status** | Not Started |
| **Trace** | PRD-13-17 |
| **Cites** | DECISION-08 |

**Acceptance Criteria:**
- [ ] New hook `bootstrapKnowledgeArticle({ projectId, domain?, process? })` invoked from `createEpic` and `createFeature` post-commit
- [ ] Novelty check: `SELECT 1 FROM KnowledgeArticle WHERE projectId=? AND (process=? OR domain=?) LIMIT 1` — if absent, create draft with `status: 'DRAFT'`, `source: 'PHASE_4_BOOTSTRAP'`, minimal title + slug, empty body
- [ ] `INSERT … ON CONFLICT DO NOTHING` via Prisma unique constraint on `(projectId, slug)` — concurrent bootstrap race is idempotent
- [ ] PRD-13-14 (planned-component placeholder KA) is explicitly **Phase 6** per DECISION-08 — do not implement here
- [ ] Bootstrap path calls `assertProjectWritable` (DECISION-10)

---

## Summary

| Task | Title | Depends On | Complexity | Status | Cites |
|------|-------|-----------|------------|--------|-------|
| 1 | Auto-Initialize EpicPhase Records | P9 | S | Not Started | DECISION-10 |
| 2 | Fix Enrichment Dedup | P9 | S | Not Started | DECISION-10 |
| 3 | SF Guardrails Module [GAP-WORK-006] | — | S | Not Started | — |
| 4 | Story Detail Status Controls | P9, Task 9 | S | Not Started | DECISION-06, DECISION-10 |
| 5 | Feature-Level Generate Stories | P9, Task 10 | S | Not Started | DECISION-10 |
| 6 | Dual-Mode OrgComponent Selector | P9 | M | Not Started | DECISION-10 |
| 7 | Pipeline Cross-Reference Render | Task 10, P6 | S | Not Started | Carry-forward #2 |
| 8 | Test Case Stub Persistence | Task 10, P9 | M | Not Started | DECISION-10 |
| 9 | Validation Result Render | Task 8, Task 10, P2 | M | Not Started | DECISION-10 |
| 10 | UI → Pipeline Wire + Embeddings Enqueue | P2, P11, P9 | M | Not Started | DECISION-10, CF #2 |
| 11 | Optimistic Concurrency + VersionHistory | P9 | M | Not Started | DECISION-08, DECISION-10 |
| 12 | Component Conflict Resolution Modal | Task 10, Task 6, P9 | M | Not Started | DECISION-10 |
| 13 | Polymorphic Attachments (Story, Question) | P9 | M | Not Started | DECISION-08, DECISION-10 |
| 14 | KnowledgeArticle Bootstrap | P9, P6 coord | S | Not Started | DECISION-08 |

**Total tasks:** 14 (was 9; +5 added per audit fix plan).

**Defer / no-op from audit:**
- **GAP-13 (PRD-9-08 epic prefix uniqueness):** Deferred to Phase 3 per audit — no Phase 4 task.
- **PRD-13-14 (planned-component KA placeholders):** Phase 6 per DECISION-08 — no Phase 4 task.
- **GAP-11 trace lines:** Applied inline in PHASE_SPEC §2 subsections (no standalone task required).
- **GAP-10 edge cases:** Applied inline in PHASE_SPEC §4 table (no standalone task required).

**Cross-references:**
- PHASE_SPEC §2.14 — Task 10 body.
- AUDIT_DECISIONS.md — DECISION-06, DECISION-08, DECISION-10.
- `.claude/threads/2026-04-13-prd-traceability-audit.md` — carry-forward decisions (esp. #2 `SearchResponse`, #5 `assertProjectWritable` ordering).
