# Phase 4 Tasks: Work Management

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 9
> Status: 0/9 complete
> Last Updated: 2026-04-10

---

## Execution Order

```
Task 1 (EpicPhase init)        ─┐
Task 2 (Enrichment dedup)       │
Task 3 (Guardrails module)      ├─ all independent, any order
Task 4 (Status controls)        │
Task 5 (Feature generate)      ─┘
Task 6 (OrgComponent UI)       ─── independent M task
Task 7 (Org cross-reference)   ─── independent M task
Task 8 (Test case stubs)       ─── independent L task
                                └── Task 9 (DRAFT→READY validation) — depends on Task 8
```

---

## Tasks

### Task 1: Auto-Initialize EpicPhase Records on Epic Creation

| Attribute | Details |
|-----------|---------|
| **Scope** | Wire the existing `initializeEpicPhases` action into `createEpic`, and backfill existing epics that have zero EpicPhase records. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `createEpic` calls `initializeEpicPhases` after successful epic creation
- [ ] Epic creation and phase init are in a transaction (phase init failure rolls back epic creation)
- [ ] Existing epics with 0 EpicPhase records are backfilled with 5 NOT_STARTED rows
- [ ] Backfill is idempotent (running twice does not create duplicates)
- [ ] EpicPhase Grid now displays real DB data instead of phantom fallbacks

**Implementation Notes:**
- `initializeEpicPhases` already exists at `src/actions/epic-phases.ts` lines 113-148. It creates all 5 phase records with `NOT_STARTED` status using `PHASE_SORT_ORDER`.
- In `src/actions/epics.ts`, after `prisma.epic.create()` succeeds, call `initializeEpicPhases(epicId)`. Wrap both in a `prisma.$transaction` if not already.
- For the backfill, write a migration or seed script that: `SELECT e.id FROM "Epic" e LEFT JOIN "EpicPhase" ep ON e.id = ep."epicId" GROUP BY e.id HAVING COUNT(ep.id) = 0`, then creates 5 rows per orphaned epic.
- The `epic-phase-grid.tsx` `getPhaseStatus()` fallback to `"NOT_STARTED"` can remain as a safety net, but should no longer be the primary path.

---

### Task 2: Fix Enrichment Dedup for Free-Text Components

| Attribute | Details |
|-----------|---------|
| **Scope** | Add dedup check in `applyEnrichmentSuggestion` for COMPONENTS category to prevent duplicate free-text `StoryComponent` records. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Applying AI enrichment twice on the same story does not create duplicate component rows
- [ ] Dedup matches on `storyId + componentName + impactType`
- [ ] Existing duplicate records (if any) are not affected (no destructive cleanup)

**Implementation Notes:**
- The bug is in `src/actions/enrichment.ts` lines 100-113, where the COMPONENTS enrichment path uses raw `prisma.storyComponent.create` in a loop without checking for existing records.
- Best fix: refactor the enrichment path to call the existing `addStoryComponent` action (which already has dedup at lines 373-385 of `src/actions/stories.ts`) instead of raw Prisma create.
- If calling the full action is too heavy (it does auth checks), extract the dedup query into a shared utility: `findExistingComponent(storyId, componentName, impactType)`.
- Test by running enrichment twice on a story with components — second run should add 0 new rows.

---

### Task 3: Salesforce Guardrails Module for AI Prompts

| Attribute | Details |
|-----------|---------|
| **Scope** | Create a guardrails constant module with the 6 PRD guardrails, inject into story generation/enrichment prompts and Tier 1 project summary. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `src/lib/agent-harness/prompts/salesforce-guardrails.ts` exports a compact guardrails string
- [ ] Story generation system prompt includes guardrail reminders
- [ ] Story enrichment system prompt includes guardrail reminders
- [ ] Tier 1 project summary (the "always loaded" context) includes a guardrails section
- [ ] Guardrails block is under 200 tokens (compact, not verbose)

**Implementation Notes:**
- The 6 guardrails from PRD Section 15: Governor Limits, Bulkification, Test Class Requirements, Naming Conventions, Security Patterns (CRUD/FLS), Sharing Model Enforcement.
- Format as a numbered list with one-line summaries, prefixed with: "Salesforce Development Guardrails (enforced in Claude Code — reference in story content):"
- In `src/lib/agent-harness/tasks/story-generation.ts`, append the guardrails block to the system prompt (after the existing instructions, before the context injection).
- In `src/lib/agent-harness/tasks/story-enrichment.ts`, same pattern.
- For the project summary, find the `getProjectSummary` or equivalent context loader and add a "## Guardrails" section to the output template.
- The framing matters: these are reminders for the AI to consider when generating acceptance criteria and component impacts, not rules the AI must enforce directly.

---

### Task 4: Add Status Transition Controls to Story Detail Page

| Attribute | Details |
|-----------|---------|
| **Scope** | Add "Move to:" status transition buttons on the story detail page header, matching the existing pattern from StoryForm. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Story detail page shows available status transitions based on current status and user role
- [ ] Clicking a transition button calls `updateStoryStatus` and refreshes the page
- [ ] Transitions that the current user's role cannot perform are not shown
- [ ] Controls are positioned in the header area near the existing "Enrich with AI" button

**Implementation Notes:**
- Reference the existing "Move to:" button pattern in `src/components/work/story-form.tsx` lines 314-341.
- Use `getAvailableTransitions(currentStatus, userRoleGroup)` from `src/lib/story-status-machine.ts` to determine which buttons to show.
- The `StoryDetailClient` at `src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/stories/[storyId]/story-detail-client.tsx` currently has an "Enrich with AI" button in the header. Add transition buttons nearby.
- Consider extracting the transition buttons into a shared `<StoryStatusControls>` component that both StoryForm and StoryDetailClient can use.
- Use `useTransition` or optimistic updates for responsive UX.

---

### Task 5: Add Feature-Level Generate Stories Button

| Attribute | Details |
|-----------|---------|
| **Scope** | Add a "Generate Stories" button to the feature detail page that initiates a feature-scoped AI story generation session. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Feature detail page has a "Generate Stories" button
- [ ] Button calls `initiateStorySession` with both `epicId` and `featureId`
- [ ] Navigates to conversation page with correct params for feature-scoped generation
- [ ] Button visible to SA, PM, BA only (matching epic-level permissions)

**Implementation Notes:**
- Copy the pattern from `src/app/(dashboard)/projects/[projectId]/work/[epicId]/epic-detail-client.tsx` line 96 (the Generate Stories button).
- In `src/app/(dashboard)/projects/[projectId]/work/[epicId]/[featureId]/feature-detail-client.tsx`, add the same button.
- The `initiateStorySession` action in `src/actions/conversations.ts` (or similar) already accepts `featureId` as optional parameter.
- The story generation context loader in `src/lib/agent-harness/tasks/story-generation.ts` already handles feature-scoped context when `featureId` is provided.
- Pass `featureId` as an additional URL search param alongside `epicId`.

---

### Task 6: Build Dual-Mode OrgComponent Selector in Story Form

| Attribute | Details |
|-----------|---------|
| **Scope** | Upgrade ComponentSelector to support both free-text entry and linked OrgComponent search. Update `addStoryComponent` action to accept `orgComponentId`. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] ComponentSelector shows mode toggle: "Free Text" / "Link to Org"
- [ ] "Link to Org" mode is disabled when project has 0 org components (graceful degradation)
- [ ] In linked mode, autocomplete searches OrgComponent by API name and label
- [ ] Search results show: apiName, label, componentType, domainGrouping
- [ ] Selecting an org component sets `orgComponentId` on the `StoryComponent` record
- [ ] `addStoryComponent` action schema accepts optional `orgComponentId` parameter
- [ ] Both free-text and linked components display correctly in the story component list
- [ ] Application validates that at least one of `componentName` or `orgComponentId` is non-null

**Implementation Notes:**
- The current `ComponentSelector` at `src/components/work/component-selector.tsx` is a plain `<Input>` for `componentName` + impact type select.
- Add a toggle (tabs or segmented control) above the input area. Default to "Free Text".
- For "Link to Org" mode, use a combobox/autocomplete pattern (shadcn `<Command>` or `<Popover>` + `<CommandInput>`).
- Create a server action `searchOrgComponents(projectId, query, limit=20)` that queries `OrgComponent` with `WHERE (apiName ILIKE '%query%' OR label ILIKE '%query%') AND projectId = ?`. Could go in a new `src/actions/org-components.ts` or add to existing org actions.
- When an org component is selected, auto-populate `componentName` from the org component's `label` (as a display fallback if the org component is later deleted).
- The `addStoryComponent` action in `src/actions/stories.ts` needs its Zod schema updated to accept `orgComponentId: z.string().optional()`. The dedup check should also consider `orgComponentId` uniqueness.
- The `@@unique([storyId, orgComponentId])` DB constraint handles dedup for linked components. For free-text, the existing application-level check remains.

---

### Task 7: Add Org Knowledge Cross-Reference to Story Generation Context

| Attribute | Details |
|-----------|---------|
| **Scope** | Load OrgComponent data into story generation and enrichment context loaders. Update prompts to instruct AI to cross-reference components. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `storyGenerationContextLoader` includes org components in the context payload
- [ ] Story generation system prompt instructs AI to cross-reference and flag component conflicts
- [ ] Story enrichment context also includes org components
- [ ] When org components exist, AI flags "this component already exists" in draft notes
- [ ] When no org is connected (0 components), context is empty array and prompt degrades gracefully

**Implementation Notes:**
- The tech spec reference implementation (line 1087) already shows `getOrgComponentsForEpic(epicId)` in the story generation context loader's `Promise.all`. This function doesn't exist yet — create it.
- `getOrgComponentsForEpic(epicId)`: Query org components that are either (a) directly referenced by the epic's existing stories via `StoryComponent.orgComponentId`, or (b) in the same domain grouping as those components. This provides relevant context without loading the entire org.
- Add the results to the context payload under `orgComponents`.
- In the system prompt, add a section: "## Existing Org Components\nThe following components exist in the connected Salesforce org. When identifying impacted components for stories, check whether a component already exists before suggesting creation. If extending an existing component, note this in the story description."
- In `src/lib/agent-harness/context/stories-context.ts`, add the org component loading function.
- For enrichment: same pattern, load org components relevant to the story being enriched.
- Token budget: org components are compact (apiName + type + label per row). Even 50 components is ~500 tokens. Well within budget.

---

### Task 8: Wire Test Case Stub Generation into Story Creation Pipeline

| Attribute | Details |
|-----------|---------|
| **Scope** | Add `create_test_case_stub` tool to story generation, update StoryDraft interface, wire test case persistence into draft accept flow, create `createTestCases` server action, show test cases in draft preview. |
| **Depends On** | None |
| **Complexity** | L |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `create_test_case_stub` tool is registered in story generation tools array
- [ ] Tool handler stores test cases on the draft (not in DB) until draft is accepted
- [ ] Story generation prompt instructs AI to generate at least 1 happy-path and 1 edge-case per draft
- [ ] `StoryDraft` interface includes `testCases` array
- [ ] Draft preview card shows test case stubs with title, type, and expected result
- [ ] `handleAccept` in StoryDraftCards creates TestCase records via new server action
- [ ] `createTestCases` server action validates inputs and creates records via `createMany`
- [ ] Test cases are linked to the correct story ID after story creation
- [ ] AI can generate HAPPY_PATH, EDGE_CASE, NEGATIVE, and BULK test types

**Implementation Notes:**
- **Tool definition:** Create `src/lib/agent-harness/tools/create-test-case-stub.ts` matching the tech spec definition (lines 1278-1291). Parameters: `storyDraftIndex` (int referencing the nth draft in the session), `title`, `expectedResult`, `testType` (enum).
- **Tool handler:** The tricky part — during story generation, the AI creates drafts via `create_story_draft` and test cases via `create_test_case_stub`. Test cases reference a draft that hasn't been persisted yet. The handler should append test cases to an in-memory array keyed by draft index. When the session ends and drafts are displayed, each draft includes its test cases.
- **StoryDraft interface:** In `src/lib/agent-harness/tools/create-story-draft.ts`, add `testCases?: Array<{ title: string; expectedResult: string; testType: string }>` to the interface.
- **Draft card UI:** In `src/components/work/story-draft-cards.tsx`, add a "Test Cases" section below the existing content showing each test case as a compact row: `[type badge] title — expected: ...`.
- **Accept flow:** In `handleAccept`, after `createStory` returns the new story ID, call `createTestCases(storyId, draft.testCases)`.
- **Server action:** In `src/actions/test-cases.ts`, create `createTestCases(storyId, testCases[])`. Use `prisma.testCase.createMany({ data: testCases.map(tc => ({ storyId, title: tc.title, expectedResult: tc.expectedResult, testType: tc.testType, source: "STUB", sortOrder: index })) })`.
- **Source value:** Use `source: "STUB"` (not `"AI_GENERATED"`). Phase 9's AI test case generation uses `"AI_GENERATED"` and its regeneration only replaces `"AI_GENERATED"` records — `"STUB"` records are preserved as the user's accepted baseline from story generation.
- **Prompt update:** Add to the story generation system prompt: "After creating each story draft, generate test case stubs from the acceptance criteria. Create at minimum: one HAPPY_PATH test case covering the primary workflow, and one EDGE_CASE test case covering a boundary condition or exception. Use the create_test_case_stub tool for each."

---

### Task 9: Implement DRAFT-to-READY Mandatory Field Validation

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `validateStoryReadiness` function checking all 7 mandatory fields. Wire into `updateStoryStatus` for the DRAFT->READY transition. Return field-specific errors. |
| **Depends On** | Task 8 (test case stubs must be creatable before they can be validated) |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `validateStoryReadiness(storyId)` checks all 7 mandatory fields
- [ ] Returns array of field-specific error messages for all missing fields at once
- [ ] `updateStoryStatus` calls validation when transitioning from DRAFT to READY
- [ ] Transition is blocked if any mandatory field is missing
- [ ] Returns a structured error the UI can display per-field
- [ ] Other status transitions (READY->SPRINT_PLANNED, etc.) are not affected
- [ ] Validation checks: persona, description, acceptanceCriteria, parent link, storyPoints, testCases (>=1), storyComponents (>=1)
- [ ] Empty/whitespace-only strings are treated as missing

**Implementation Notes:**
- Create `src/lib/story-validation.ts` with:
  ```typescript
  export async function validateStoryReadiness(storyId: string): Promise<string[]> {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: { testCases: { select: { id: true } }, storyComponents: { select: { id: true } } },
    });
    const errors: string[] = [];
    if (!story.persona?.trim()) errors.push("Persona is required");
    if (!story.description?.trim()) errors.push("Description is required");
    if (!story.acceptanceCriteria?.trim()) errors.push("Acceptance criteria are required");
    if (!story.storyPoints || story.storyPoints <= 0) errors.push("Story points estimate is required");
    if (!story.testCases.length) errors.push("At least one test case must be defined");
    if (!story.storyComponents.length) errors.push("At least one impacted component is required");
    // Parent link (epicId) is always set by schema, skip check
    return errors;
  }
  ```
- In `src/actions/stories.ts` `updateStoryStatus`, after the existing `canTransition` check at line 282:
  ```typescript
  if (parsedInput.status === "READY" && existing.status === "DRAFT") {
    const errors = await validateStoryReadiness(storyId);
    if (errors.length > 0) {
      return { error: "Story is not ready", validationErrors: errors };
    }
  }
  ```
- The UI (StoryForm transition buttons, Task 4's detail page controls) should handle the `validationErrors` response and display each error.
- **AI-assisted remediation:** When validation fails, the UI shows the error list plus a "Fix with AI" button. Clicking it calls the enrichment task with a targeted prompt listing the missing fields. The AI generates suggestions that the user can accept or edit. Fallback: static message "Use 'Enrich with AI' to fill missing fields, or add test cases from the QA tab."
- This task depends on Task 8 because without the test case generation pipeline, the "at least one test case" check would block all DRAFT->READY transitions since no mechanism exists to create test cases during story creation.

---

## Summary

| Task | Title | Depends On | Complexity | Status |
|------|-------|-----------|------------|--------|
| 1 | Auto-Initialize EpicPhase Records | — | S | Not Started |
| 2 | Fix Enrichment Dedup | — | S | Not Started |
| 3 | Salesforce Guardrails Module | — | S | Not Started |
| 4 | Story Detail Status Controls | — | S | Not Started |
| 5 | Feature-Level Generate Stories | — | S | Not Started |
| 6 | Dual-Mode OrgComponent Selector | — | M | Not Started |
| 7 | Org Knowledge Cross-Reference | — | M | Not Started |
| 8 | Test Case Stub Generation Pipeline | — | L | Not Started |
| 9 | DRAFT-to-READY Validation Gate | 8 | M | Not Started |
| 10 | Wire story generation UI to Story Generation Pipeline + enqueue story embeddings (Addendum v1; references Phase 2 + Phase 11) | — | S | Not Started |
