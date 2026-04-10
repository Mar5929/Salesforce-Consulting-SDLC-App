# Phase 4 Spec: Work Management

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [04-work-management-gaps.md](./04-work-management-gaps.md)
> Depends On: Phase 1 (RBAC, Security), Phase 3 (Discovery, Questions)
> Status: Draft
> Last Updated: 2026-04-10

---

## 1. Scope Summary

Implement the story quality gate (DRAFT-to-READY mandatory field validation), wire AI test case stub generation into the story creation pipeline, build the dual-mode OrgComponent selector in the story form, auto-initialize EpicPhase records on epic creation, fix enrichment dedup for free-text components, add Salesforce development guardrails to AI prompts, cross-reference the org knowledge base during story generation, and add missing UX entry points (story detail status controls, feature-level Generate Stories button).

**In scope:** 9 of 11 domain gaps -> 9 tasks
**Resolved upstream:** GAP-WORK-007 (BA transitions) resolved by Phase 1 REQ-RBAC-009. GAP-WORK-009 (acceptanceCriteria nullable) absorbed into GAP-WORK-001 DRAFT->READY validation.

---

## 2. Functional Requirements

### 2.1 EpicPhase Auto-Initialization (REQ-WORK-001)

- **What it does:** Automatically creates all 5 EpicPhase records (DISCOVERY, DESIGN, BUILD, TEST, DEPLOY) with `NOT_STARTED` status when a new epic is created. Backfills existing epics that have zero EpicPhase records.
- **Inputs:** Epic creation via `createEpic` server action
- **Outputs:** 5 EpicPhase rows per epic in the database
- **Business rules:**
  - The `initializeEpicPhases` action already exists in `src/actions/epic-phases.ts` (lines 113-148) but is never called. Wire it into `createEpic`.
  - Backfill migration: query all epics with zero EpicPhase records and create the 5 default rows. Use `createMany` with `skipDuplicates` to be idempotent.
  - After this, the EpicPhase Grid displays real database state instead of phantom `NOT_STARTED` fallbacks.
- **Files:** `src/actions/epics.ts` (wire call), migration script for backfill

### 2.2 Enrichment Dedup Fix (REQ-WORK-002)

- **What it does:** Prevents the enrichment path from creating duplicate free-text component records when AI enrichment is applied multiple times to the same story.
- **Inputs:** `applyEnrichmentSuggestion` action with `COMPONENTS` category
- **Outputs:** No duplicate `StoryComponent` rows
- **Business rules:**
  - Before creating a component in the enrichment loop, check for an existing record matching `storyId + componentName + impactType`.
  - If a match exists, skip creation (upsert semantics).
  - The existing `addStoryComponent` action already has this dedup check (lines 373-385 of `src/actions/stories.ts`). The fix is to replicate this check in the `applyEnrichmentSuggestion` path in `src/actions/enrichment.ts` (lines 100-113), or refactor to call `addStoryComponent` instead of raw `prisma.storyComponent.create`.
  - Prefer the refactor approach: have the enrichment path call `addStoryComponent` directly, which centralizes the dedup logic.
- **Files:** `src/actions/enrichment.ts`

### 2.3 Salesforce Guardrails in AI Prompts (REQ-WORK-003)

- **What it does:** Injects the 6 Salesforce development guardrails (PRD Section 15) as compact reminders into story generation and enrichment system prompts, and into the Tier 1 project summary.
- **Inputs:** N/A (prompt configuration change)
- **Outputs:** AI-generated stories reference guardrail-aware component impacts and acceptance criteria
- **Business rules:**
  - Create a `src/lib/agent-harness/prompts/salesforce-guardrails.ts` module exporting a constant string block summarizing the 6 guardrails:
    1. Governor Limits Awareness — no SOQL/DML in loops
    2. Bulkification — handlers operate on collections
    3. Test Class Requirements — positive, negative, bulk, assertion-based
    4. Naming Conventions — firm pattern enforcement
    5. Security Patterns — CRUD/FLS checks, no hardcoded IDs, no SOQL injection
    6. Sharing Model Enforcement — explicit `with sharing`/`without sharing` declaration
  - Inject this block into `storyGenerationTask` system prompt with framing: "When generating acceptance criteria and component impacts, ensure compliance with these Salesforce development guardrails."
  - Inject into `storyEnrichmentTask` system prompt similarly.
  - Add a `guardrails` section to the `getProjectSummary` context loader output (the Tier 1 "always loaded" summary) so all agent tasks have ambient awareness.
  - The guardrails are reminders for the web app's AI, not enforcement rules (enforcement lives in Claude Code skills per PRD Section 15).
- **Files:** New `src/lib/agent-harness/prompts/salesforce-guardrails.ts`, modify `src/lib/agent-harness/tasks/story-generation.ts`, modify `src/lib/agent-harness/tasks/story-enrichment.ts`, modify project summary context loader

### 2.4 Story Detail Status Controls (REQ-WORK-004)

- **What it does:** Adds status transition buttons to the story detail page so users can promote/demote a story without navigating away to the kanban or table view.
- **Inputs:** User viewing a story detail page and clicking a transition button
- **Outputs:** Story status updated, page refreshed to reflect new state
- **Business rules:**
  - Display available transitions based on the current status and the user's role (reuse `getAvailableTransitions` from `story-status-machine.ts`).
  - Show "Move to:" buttons matching the existing pattern in `StoryForm` (lines 314-341).
  - For the DRAFT->READY transition specifically, this is where the validation gate (REQ-WORK-009) surfaces errors — show field-specific messages if validation fails.
  - Position the controls in the story detail header area, next to the existing "Enrich with AI" button.
- **Files:** `src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/stories/[storyId]/story-detail-client.tsx`

### 2.5 Feature-Level Generate Stories (REQ-WORK-005)

- **What it does:** Adds a "Generate Stories" button to the feature detail page, scoping AI story generation to the specific feature rather than the entire epic.
- **Inputs:** User clicks "Generate Stories" on a feature detail page
- **Outputs:** Navigates to conversation page with `epicId` + `featureId` as params, initiating a feature-scoped story session
- **Business rules:**
  - The `initiateStorySession` action already supports an optional `featureId` parameter.
  - The story generation context loader already handles the feature-scoped case.
  - This is a UI-only change: replicate the pattern from `EpicDetailClient` (line 96) in `FeatureDetailClient`.
  - Button visibility: same role restrictions as epic-level generate (SA, PM, BA).
- **Files:** `src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/feature-detail-client.tsx`

### 2.6 Linked OrgComponent Mode in Story Form (REQ-WORK-006)

- **What it does:** Upgrades the `ComponentSelector` widget to support two modes: (1) free-text entry (existing) and (2) linked OrgComponent search with autocomplete.
- **Inputs:** User adding impacted components to a story via the form
- **Outputs:** `StoryComponent` records with either `componentName` (free-text) or `orgComponentId` (linked)
- **Business rules:**
  - The selector shows a mode toggle: "Free Text" / "Link to Org". Default is "Free Text" (always available). "Link to Org" is only enabled when the project has org components (query count on page load).
  - In linked mode, an autocomplete searches `OrgComponent` by API name and label, filtered by the project's connected org. Results show: `apiName`, `label`, `componentType`, and `domainGrouping`.
  - When an org component is selected, `orgComponentId` is set and `componentName` is auto-populated from the org component's label (for display fallback).
  - The `addStoryComponent` action in `src/actions/stories.ts` must accept an optional `orgComponentId` parameter. When provided, it uses the existing `@@unique([storyId, orgComponentId])` constraint for dedup.
  - Add a DB-level check constraint (or application validation) ensuring at least one of `componentName` or `orgComponentId` is non-null on any `StoryComponent` row.
  - When org connectivity is established later, the AI can suggest linking free-text entries to matching OrgComponents (deferred to Phase 6 for AI-driven suggestion; this phase only builds the manual linking UI).
- **Files:** `src/components/work/component-selector.tsx` (major rework), `src/actions/stories.ts` (update `addStoryComponent` schema), new `src/actions/org-components.ts` (search endpoint, or add to existing)

### 2.7 Org Knowledge Cross-Reference in Story Generation (REQ-WORK-007)

- **What it does:** Loads existing `OrgComponent` records into the story generation context so the AI can cross-reference planned story components against what already exists in the org.
- **Inputs:** Story generation session initiation
- **Outputs:** AI can flag conflicts like "this field already exists on Account — are you extending it or creating a new one?"
- **Business rules:**
  - Add `getOrgComponentsForEpic(epicId)` to the `storyGenerationContextLoader` parallel Promise.all, matching the tech spec reference implementation (line 1087).
  - The context loader queries `OrgComponent` records that are in the same domain grouping as the epic's existing story components, plus any components directly referenced by the epic's stories.
  - Update the story generation system prompt to include: "Cross-reference impacted components against the existing org components provided. If a component already exists, flag whether the story is modifying it or creating a duplicate. Suggest linking to existing org components when there's a match."
  - Also add org component context to the story enrichment task (`storyEnrichmentTask` context loader).
  - If no org is connected (zero org components), the context loader returns an empty array and the prompt gracefully handles the absence.
- **Files:** `src/lib/agent-harness/tasks/story-generation.ts` (context loader + prompt), `src/lib/agent-harness/context/stories-context.ts`, `src/lib/agent-harness/tasks/story-enrichment.ts`

### 2.8 Test Case Stub Generation During Story Creation (REQ-WORK-008)

- **What it does:** Wires the `create_test_case_stub` tool into the story generation pipeline so the AI generates test cases from acceptance criteria during story creation, and persists them when a draft is accepted.
- **Inputs:** Story generation session; draft acceptance by user
- **Outputs:** `TestCase` records linked to the created story
- **Business rules:**
  - **Tool definition:** The tech spec already specifies `create_test_case_stub` (lines 1278-1291). Add this tool to the story generation tools array in `src/lib/agent-harness/tools/`. Tool parameters: `storyDraftIndex` (referencing the draft in the current session), `title`, `expectedResult`, `testType` (HAPPY_PATH, EDGE_CASE, NEGATIVE, BULK).
  - **Prompt update:** Add to the story generation system prompt: "After creating each story draft, generate at minimum one happy-path test case and one edge-case test case from the acceptance criteria. Use the create_test_case_stub tool for each test case."
  - **StoryDraft interface:** Add a `testCases` array to the `StoryDraft` interface in `create-story-draft.ts`. When the AI calls `create_test_case_stub`, the handler appends to the draft's test cases array rather than persisting immediately (the draft hasn't been persisted yet).
  - **Draft accept flow:** In `StoryDraftCards.handleAccept`, after calling `createStory` and `addStoryComponent`, also call a new `createTestCases` action to persist the draft's test cases with the newly created story ID.
  - **`createTestCases` server action:** New action in `src/actions/test-cases.ts` (or add to `stories.ts`) that accepts an array of test case objects and creates them via `prisma.testCase.createMany`. Validates: title required, expectedResult required, testType must be valid enum.
  - **StoryDraftCards UI:** Show test case stubs in the draft preview card so the user can see them before accepting.
- **Files:** New `src/lib/agent-harness/tools/create-test-case-stub.ts`, modify `src/lib/agent-harness/tools/create-story-draft.ts` (interface), modify `src/lib/agent-harness/tasks/story-generation.ts` (tools array + prompt), modify `src/components/work/story-draft-cards.tsx` (accept flow + preview), new or modify `src/actions/test-cases.ts`

### 2.9 DRAFT-to-READY Mandatory Field Validation (REQ-WORK-009)

- **What it does:** Implements the PRD's mandatory field validation gate on the DRAFT->READY story transition, checking all 7 required fields.
- **Inputs:** `updateStoryStatus` call with `status: "READY"` from current status `"DRAFT"`
- **Outputs:** Either successful transition or a validation error listing all missing fields
- **Business rules:**
  - **Validation function:** Create `validateStoryReadiness(storyId)` that checks:
    1. `persona` — non-null, non-empty string
    2. `description` — non-null, non-empty string
    3. `acceptanceCriteria` — non-null, non-empty string (addresses GAP-WORK-009)
    4. `epicId` or `featureId` — at least one parent link exists (always true by schema, but validate)
    5. `storyPoints` — non-null number > 0
    6. `testCases` — at least one TestCase record exists for this story
    7. `storyComponents` — at least one StoryComponent record exists for this story
  - **Error format:** Return an array of field-specific messages, e.g., `["Persona is required", "At least one test case must be defined"]`. The UI displays all missing fields at once, not one at a time.
  - **Wire into `updateStoryStatus`:** After the existing `canTransition` role check (line 282), add the readiness validation check. Only applies when transitioning TO `READY` from `DRAFT`.
  - **Other transitions:** No validation gate on other transitions (Ready->Sprint Planned, etc.). Only DRAFT->READY is gated.
  - **AI assistance:** When validation fails, the response includes a suggestion: "Use 'Enrich with AI' to help fill missing fields." This is informational text, not an automatic action.
- **Files:** New `src/lib/story-validation.ts`, modify `src/actions/stories.ts` (`updateStoryStatus`)

---

## 3. Technical Approach

### 3.1 Implementation Strategy

Schema/data fixes first, then AI infrastructure, then UX, then the quality gate:

1. **Schema & data** (REQ-001, 002) — EpicPhase backfill and enrichment dedup. Zero AI involvement. Quick wins.
2. **AI prompt infrastructure** (REQ-003, 007) — Guardrails module and org cross-reference context. Changes to prompt assembly, no UI.
3. **AI tool infrastructure** (REQ-008) — Test case stub tool, StoryDraft interface changes, draft accept flow. The largest task.
4. **UX enhancements** (REQ-004, 005, 006) — Story detail controls, feature generate button, dual-mode component selector. Independent UI work.
5. **Quality gate** (REQ-009) — DRAFT->READY validation. Must come after test case stubs exist (REQ-008) since test case presence is one of the 7 mandatory checks.

### 3.2 File/Module Structure

```
src/
  lib/
    story-validation.ts                          — CREATE (validateStoryReadiness)
    agent-harness/
      prompts/
        salesforce-guardrails.ts                 — CREATE (guardrails constant block)
      tasks/
        story-generation.ts                      — MODIFY (context loader + prompt + tools)
        story-enrichment.ts                      — MODIFY (prompt + context)
      tools/
        create-test-case-stub.ts                 — CREATE (test case tool handler)
        create-story-draft.ts                    — MODIFY (add testCases to interface)
      context/
        stories-context.ts                       — MODIFY (add org component loading)
  actions/
    epics.ts                                     — MODIFY (wire initializeEpicPhases)
    stories.ts                                   — MODIFY (addStoryComponent orgComponentId, updateStoryStatus validation)
    enrichment.ts                                — MODIFY (dedup fix)
    test-cases.ts                                — CREATE (createTestCases action)
  components/
    work/
      component-selector.tsx                     — MODIFY (dual-mode: free-text + org link)
      story-draft-cards.tsx                      — MODIFY (test case preview + accept flow)
  app/(dashboard)/projects/[projectId]/work/
    [epicId]/[featureId]/
      feature-detail-client.tsx                  — MODIFY (Generate Stories button)
      stories/[storyId]/
        story-detail-client.tsx                  — MODIFY (status transition controls)
prisma/
  schema.prisma                                  — No changes (schema already supports all)
  seed or migration                              — EpicPhase backfill script
```

### 3.3 Data Changes

**No schema migration required.** All needed schema elements already exist:
- `TestCase` model with all required fields
- `StoryComponent` with both `componentName?` and `orgComponentId?`
- `EpicPhase` model with all phase statuses
- `Story` with nullable `acceptanceCriteria`, `persona`, `storyPoints`

**Data backfill:** EpicPhase records for existing epics with zero phase records. This can be a seed script or a one-time migration.

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| DRAFT->READY with 0 test cases | Blocked | "At least one test case must be defined" |
| DRAFT->READY with null acceptanceCriteria | Blocked | "Acceptance criteria are required" |
| DRAFT->READY with null persona | Blocked | "Persona is required" |
| DRAFT->READY with null storyPoints | Blocked | "Story points estimate is required" |
| DRAFT->READY with 0 components | Blocked | "At least one impacted component is required" |
| Multiple missing fields on DRAFT->READY | All errors returned at once | Array of all missing field messages |
| Story already READY, no re-validation | Only DRAFT->READY triggers validation | Other transitions pass through |
| OrgComponent search with no org connected | Empty results, free-text mode only | "No org components available — use free-text mode" |
| OrgComponent search returns 100+ results | Paginate/limit autocomplete to 20 results | User refines search query |
| Linked OrgComponent is later deleted from org | StoryComponent retains `orgComponentId` (orphaned FK) | Display falls back to `componentName` |
| Enrichment applied twice to same story | Dedup check prevents duplicate components | Silently skips existing components |
| AI generates 0 test cases for a draft | Draft still accepted; user must manually add before READY | No error on accept, but DRAFT->READY will block |
| AI generates test case for wrong draft index | Tool handler validates draft index exists | "Invalid draft index" error, test case skipped |
| Epic created with `initializeEpicPhases` failure | Transaction: if phase init fails, epic creation rolls back | "Failed to create epic" |
| Feature-level generate with no requirements | AI uses epic context as fallback | Generates stories from epic description and discovery |
| Story generation with 0 org components | AI generates free-text component suggestions | No conflict detection (graceful degradation) |
| Guardrails prompt adds tokens to context | ~200 tokens — negligible within budget | N/A |

---

## 5. Integration Points

### From Phase 1
- **REQ-RBAC-009** (story status machine fix) resolves GAP-WORK-007. BA can now do management transitions. Phase 4 marks this gap as resolved.
- **REQ-RBAC-001** (auth fix) ensures all new Phase 4 server actions reject removed members.
- **REQ-RBAC-002-007** (role gates) protect epic/feature/story write operations that Phase 4 extends.

### From Phase 3
- **REQ-DISC-001** (IMPACT_ASSESSED status) provides the complete question lifecycle state, available as a readiness signal for story generation scope decisions.
- **REQ-DISC-010/011** (gap detection + readiness assessment) produce data that can inform which epics have sufficient discovery for story generation. Phase 4 does not depend on this data but benefits from it.
- **REQ-DISC-008** (impact assessment downstream actions) creates blocking relationships that feed into story status awareness. Stories blocked by unanswered questions are visible in the story detail page.

### For Future Phases
- **Phase 5 (Sprint/Developer):** Test case stubs on stories are available in context packages. OrgComponent links enable sprint conflict detection (already wired in the context-package API, which queries by `orgComponentId`). Guardrails in project summary are included in Tier 1 context for Claude Code.
- **Phase 6 (Org/Knowledge):** The OrgComponent search infrastructure from REQ-WORK-006 is reusable for knowledge article UI. Phase 6's AI-driven "suggest linking free-text to OrgComponent" feature builds on the linked mode UI from this phase.
- **Phase 7 (Dashboards):** EpicPhase records now exist in the database (not phantom fallbacks), enabling accurate dashboard metrics and the Epic Phase Grid. Story quality metrics (Ready vs Draft counts) are meaningful with the validation gate active.
- **Phase 9 (QA/Jira/Archival):** Test cases created during story generation (REQ-WORK-008) are the starting point for Phase 9's test execution UI and coverage metrics.

---

## 6. Acceptance Criteria

- [ ] EpicPhase records are auto-created (5 rows, NOT_STARTED) when an epic is created
- [ ] Existing epics without EpicPhase records are backfilled
- [ ] Enrichment path does not create duplicate free-text component records
- [ ] Story generation and enrichment system prompts include Salesforce guardrail reminders
- [ ] Tier 1 project summary includes a guardrails section
- [ ] Story detail page has status transition controls matching the user's role permissions
- [ ] Feature detail page has a "Generate Stories" button that initiates a feature-scoped session
- [ ] ComponentSelector supports free-text and linked OrgComponent modes
- [ ] `addStoryComponent` action accepts and persists `orgComponentId`
- [ ] OrgComponent search returns results filtered by project's connected org
- [ ] Story generation context includes org components for the epic's domain
- [ ] Story generation prompt instructs AI to cross-reference and flag component conflicts
- [ ] `create_test_case_stub` tool is available during story generation
- [ ] AI generates at least one happy-path and one edge-case test case per story draft
- [ ] Test cases are displayed in the draft preview card
- [ ] Test cases are persisted when a story draft is accepted
- [ ] DRAFT->READY transition validates all 7 mandatory fields
- [ ] Validation returns all missing fields at once (not one at a time)
- [ ] DRAFT->READY with missing fields returns field-specific error messages
- [ ] Other status transitions (READY->SPRINT_PLANNED, etc.) are not gated by field validation
- [ ] No regressions in existing story CRUD, generation, enrichment, or status transition flows

---

## 7. Open Questions

None — all scoping decisions resolved during deep dive.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Created via `/bef:deep-dive 4`. 9 of 11 gaps addressed. GAP-WORK-007 resolved by Phase 1. GAP-WORK-009 absorbed into GAP-WORK-001. |
