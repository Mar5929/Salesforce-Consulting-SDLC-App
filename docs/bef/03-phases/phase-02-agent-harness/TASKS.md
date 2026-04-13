# Phase 2 Tasks: Harness Hardening + Core Pipelines

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 17
> Status: 0/17 complete
> Last Updated: 2026-04-13
> Note: Tasks 11-17 were added by the addendum integration. They are populated from the integration plan and require Step 3 deep-dive confirmation before execution.

---

## Execution Order

```
Task 1 (create_question fix) ──────────────────────────────────┐
  ├── Task 2 (firm typographic rules)    ─┐                     │
  ├── Task 3 (re-prompt loop)             │                     │
  ├── Task 4 (entity tracking)            ├── parallel          │
  ├── Task 5 (rate limiting)              │                     │
  └── Task 6 (Layer 3 context functions) ─┘                     │
       ├── Task 7 (transcript context)   ─┐                     │
       ├── Task 8 (story gen context)     ├── parallel          │
       └── Task 9 (chat history)         ─┘                     │
            └── Task 10 (Needs Review UX) ───────────────────── │
                 └── Task 16 (model router retrofit) ── depends on Phase 11
                      ├── Task 11 (Transcript Processing Pipeline)
                      │    ├── Task 12 (Answer Logging Pipeline)
                      │    ├── Task 13 (Story Generation Pipeline) ──┬── Task 17 (Story Gen eval fixtures)
                      │    └── Task 14 (Briefing/Status Pipeline)    │
                      └── Task 15 (Freeform Agent) ─── depends on 11-14
```

---

## Tasks

### Task 1: Fix create_question confidence/needsReview/reviewReason fields

| Attribute | Details |
|-----------|---------|
| **Scope** | Add `confidence`, `needsReview`, and `reviewReason` to the `prisma.question.create` data block in `create-question.ts`. Match the pattern used by `create-decision.ts`, `create-requirement.ts`, and `create-risk.ts`. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Given AI calls `create_question` with `confidence: "LOW"` and `needsReview: true` and `reviewReason: "Ambiguous scope"`, the Question record is created with all three fields populated
- [ ] Given AI calls `create_question` without these fields, schema defaults apply (confidence: HIGH, needsReview: false, reviewReason: null)
- [ ] Verified by reading `create-decision.ts` to confirm the pattern matches

**Implementation Notes:**
File: `src/lib/agent-harness/tools/create-question.ts` (~line 128).
Add to the `prisma.question.create({ data: { ... } })` block:
```ts
confidence: input.confidence ?? "HIGH",
needsReview: input.needsReview ?? false,
reviewReason: input.reviewReason ?? null,
```
Also verify the tool's Zod schema / input_schema exposes these three fields for the transcript-processing task context. The other three tools (`create-decision.ts`, `create-requirement.ts`, `create-risk.ts`) are the reference implementation.

---

### Task 2: Create firm typographic rules module

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `src/lib/agent-harness/firm-rules.ts` with a prompt addendum string and a `postProcessOutput` function. Wire the addendum into `buildSystemPrompt` in `engine.ts` and the post-processing into the engine's return path. Also reused by Story Generation Pipeline stage 6 and Briefing Pipeline stage 4. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `buildSystemPrompt` in engine.ts injects the firm rules addendum into every task's system prompt
- [ ] `postProcessOutput` replaces em dashes and en dashes with hyphens
- [ ] `postProcessOutput` strips known AI-characteristic phrases: "Certainly!", "Great question!", "I'd be happy to", "Absolutely!", "Of course!"
- [ ] `postProcessOutput` does NOT alter text inside backticks or double-quoted strings
- [ ] All existing task types receive the firm rules in their system prompt without per-task changes

**Implementation Notes:**
Create `src/lib/agent-harness/firm-rules.ts`:
```ts
export const FIRM_RULES_ADDENDUM = `
## Firm Typographic Rules (mandatory)
- Never use em dashes or en dashes. Use hyphens (-) or rephrase.
- Never use AI-characteristic phrases: "Certainly!", "Great question!", "I'd be happy to", "Absolutely!", "Of course!", "Here's", "Let me".
- Date format: Month DD, YYYY (e.g., April 10, 2026).
- Use standard Salesforce terminology: "custom object" not "custom entity", "record type" not "record category".
- Write in a professional, direct tone. No filler phrases.
`;

export function postProcessOutput(text: string): string {
  // Replace em/en dashes with hyphens (skip content inside backticks)
  // Strip AI-characteristic phrases
  // Return cleaned text
}
```
In `engine.ts`, append `FIRM_RULES_ADDENDUM` to the system prompt in `buildSystemPrompt`. Call `postProcessOutput` on the final text result before returning from `executeTask`.

---

### Task 3: Implement output validation re-prompt loop

| Attribute | Details |
|-----------|---------|
| **Scope** | Modify the execution flow in `engine.ts` after the `outputValidator` call (~lines 286-290). When validation fails, construct a correction message from `ValidationResult.corrections[]` and re-call Claude, up to `maxRetries` attempts. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Given output validation fails with corrections `["Missing 'Current Focus' section"]`, the engine sends a follow-up message to Claude with those corrections
- [ ] Given maxRetries is 2 and both re-prompts still fail validation, the engine returns the last output with `validation.valid: false`
- [ ] Given output validation passes on the first try, no re-prompt occurs
- [ ] Given maxRetries is 0, no re-prompt loop runs (backwards compatible)
- [ ] Re-prompt attempts are logged in the SessionLog (total attempts count)

**Implementation Notes:**
In `engine.ts`, after the initial `outputValidator` call, wrap in a loop:
```ts
let validationAttempts = 0;
let validation = taskDef.outputValidator(result);
while (!validation.valid && validationAttempts < taskDef.maxRetries) {
  validationAttempts++;
  const correctionMessage = `Output validation failed. Please fix: ${validation.corrections?.join("; ")}`;
  result = await callClaude(/* ... with correction appended */);
  validation = taskDef.outputValidator(result);
}
```

---

### Task 4: Populate SessionLog entity tracking fields

| Attribute | Details |
|-----------|---------|
| **Scope** | Modify the engine's tool execution loop to accumulate `{entityType, entityId, action}` tracking data from each tool call. Write accumulated arrays to `SessionLog.entitiesCreated` and `SessionLog.entitiesModified`. Update all tool execute functions to return tracking data. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] After a transcript processing session that creates 3 questions and 2 decisions, SessionLog.entitiesCreated contains 5 entries with correct entityType and entityId
- [ ] Tool execute functions return `{entityType, entityId, action: "created"}` alongside their existing return values
- [ ] Tools that don't create/modify entities return no tracking data — engine handles gracefully
- [ ] Existing SessionLog fields are unaffected

**Implementation Notes:**
Define a tracking type:
```ts
interface EntityTrack { entityType: string; entityId: string; action: "created" | "modified"; fieldsChanged?: string[] }
```
Each tool's execute function returns `{ result: ..., tracking?: EntityTrack }`. Audit all tools in `src/lib/agent-harness/tools/` and add tracking to each. In the engine's tool execution loop, collect tracking into `entitiesCreated` and `entitiesModified` arrays, then write on `prisma.sessionLog.create`.

---

### Task 5: Build rate limiting enforcement core

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `src/lib/agent-harness/rate-limiter.ts` with `checkRateLimits(projectId, userId)`. Add `aiDailyLimit` and `aiMonthlyCostCap` fields to the Project model. Call `checkRateLimits` at the top of `executeTask` in engine.ts AND at every pipeline entry point (added in later tasks). |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Given a user has made 100 AI invocations today and project's aiDailyLimit is 100, the next call returns 429 with message "Daily AI invocation limit exceeded (100/100). Contact your PM to increase the limit."
- [ ] Given a project has reached its monthly cost cap, the next call returns 429
- [ ] Given aiDailyLimit is null, daily limit is not enforced
- [ ] Given aiMonthlyCostCap is null, monthly limit is not enforced
- [ ] Schema migration adds nullable aiDailyLimit and aiMonthlyCostCap to Project model

**Implementation Notes:**
Cost constants sourced from the Phase 11 model router config (per model). Stored as named constants, not hardcoded.

Schema change:
```prisma
model Project {
  aiDailyLimit     Int?
  aiMonthlyCostCap Decimal?
}
```

---

### Task 6: Implement getRecentSessions and getMilestoneProgress context functions

| Attribute | Details |
|-----------|---------|
| **Scope** | Create two Layer 3 context assembly functions and export from `context/index.ts`. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `getRecentSessions(projectId, 5)` returns the 5 most recent SessionLog entries
- [ ] `getMilestoneProgress(projectId)` returns milestones with computed completion percentage
- [ ] Both return compact formatted strings (<1K tokens each)
- [ ] Both exported from `context/index.ts`
- [ ] Given no sessions exist, getRecentSessions returns empty result (no error)
- [ ] Given a milestone with 0 linked stories, completion is 0%

**Implementation Notes:**
Create `src/lib/agent-harness/context/recent-sessions.ts` and `src/lib/agent-harness/context/milestone-progress.ts`. Format each as a compact string suitable for system prompt injection.

---

### Task 7: Wire transcript context enrichment

| Attribute | Details |
|-----------|---------|
| **Scope** | Add `getRecentSessions` and `getArticleSummaries` (if available) to the transcript processing context loader's `Promise.all`. After Task 11 lands, this context is consumed by Transcript Processing Pipeline stages 2 and 4. |
| **Depends On** | Task 6 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Transcript context includes recent session summaries
- [ ] If `getArticleSummaries` exists, it is wired in
- [ ] If not, a TODO comment for Phase 6 is added and context loader still works
- [ ] Existing context is unchanged

---

### Task 8: Expand story generation context loader

| Attribute | Details |
|-----------|---------|
| **Scope** | Expand `storyGenerationContextLoader` to include epic-scoped answered questions, decisions, and org components. Wire in `getBusinessProcesses` and `getRelevantArticles` if they exist. After Task 13 lands, this becomes Story Generation Pipeline stage 1. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Context includes answered questions scoped to the target epic
- [ ] Context includes decisions scoped to the target epic
- [ ] Context includes org components referenced by the epic's stories
- [ ] If `getBusinessProcesses` exists, it is wired in; if not, TODO for Phase 6
- [ ] If `getRelevantArticles` exists, it is wired in; if not, TODO for Phase 6
- [ ] Existing context is unchanged

---

### Task 9: Add general chat history window

| Attribute | Details |
|-----------|---------|
| **Scope** | In the freeform agent's context assembly (Task 15), query recent ChatMessage records (last 50 messages or 7 days, whichever is smaller) and include as a "Recent conversation history" section in the system prompt. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] System prompt includes recent conversation history from prior chat sessions
- [ ] Window is capped at 50 messages OR 7 days, whichever produces fewer messages
- [ ] History is project-scoped
- [ ] Current session messages are NOT duplicated
- [ ] If no prior chat history exists, the section is omitted
- [ ] History formatted as: "[Apr 8] User: ... | AI: ..."

---

### Task 10: Build Needs Review session-end UX

| Attribute | Details |
|-----------|---------|
| **Scope** | Modify transcript processing Inngest function's save-to-conversation step to group entities by confidence tier and collect needsReview items (including entries queued to `pending_review` by Transcript Processing Pipeline stage 5). Update the extraction cards UI component to render confidence tier summary and Needs Review section. |
| **Depends On** | Task 1, Task 11 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] ChatMessage.toolCalls JSON includes `confidenceTiers: { HIGH, MEDIUM, LOW }`
- [ ] ChatMessage.toolCalls JSON includes `needsReviewItems: [{ entityType, entityId, title, reviewReason }]`
- [ ] Frontend renders a confidence tier summary bar
- [ ] Frontend renders a "Needs Review" section with edit/confirm/discard actions
- [ ] Each Needs Review item links to the entity's detail view
- [ ] If no items flagged, the Needs Review section is not rendered
- [ ] `pending_review` queue entries also surface in this UX

---

### Task 11: Build Transcript Processing Pipeline (REQ-PIPELINE-001)

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace the generic `TRANSCRIPT_PROCESSING` harness task with a 7-stage Inngest step function in `src/lib/pipelines/transcript-processing/`. Stages: (1) Segment — Haiku, (2) Extract candidates — Haiku, (3) Entity resolution — deterministic + hybrid search, (4) Reconcile — Sonnet, (5) Apply — deterministic with 0.85 confidence threshold, (6) Impact assessment — Sonnet, (7) Log. Each stage idempotent, 3-retry, escalate to human-review queue on failure. Raw transcript always retained. Writes `pipeline_runs`, `pipeline_stage_runs`, `pending_review`. |
| **Depends On** | Task 5, Task 7, Task 16 |
| **Complexity** | L |
| **Status** | Not Started — needs deep-dive confirmation (stage error behavior §8 item 2; confidence threshold §8 item 3; pipeline table schemas §8 item 6) |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] All 7 stages execute in order as an Inngest step function
- [ ] Re-running any stage with the same inputs produces the same outputs (idempotent)
- [ ] Stage failure retries up to 3 times, then escalates to human-review with partial state preserved
- [ ] Raw transcript text is retained on `pipeline_runs.inputJson` even on total failure
- [ ] Candidates with confidence > 0.85 auto-apply; ≤ 0.85 enqueue to `pending_review`
- [ ] `pipeline_stage_runs` records per stage with modelUsed, tokens, attempt count
- [ ] All Claude calls go through `model_router.resolve_model(intent)` (Task 16)
- [ ] Rate limit pre-check runs before stage 1

---

### Task 12: Build Answer Logging Pipeline (REQ-PIPELINE-002)

| Attribute | Details |
|-----------|---------|
| **Scope** | New pipeline in `src/lib/pipelines/answer-logging/`. 6 stages: (1) Retrieve candidate questions — deterministic + hybrid search, (2) Match — Sonnet, (3) Apply — deterministic, (4) Impact assessment — Sonnet, (5) Propagate — deterministic, (6) Annotate org KB — Sonnet. Same durability guarantees as Task 11. |
| **Depends On** | Task 5, Task 11, Task 16 |
| **Complexity** | L |
| **Status** | Not Started — needs deep-dive confirmation (stage error behavior §8 item 2) |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] All 6 stages execute in order as an Inngest step function
- [ ] Stage 2 correctly routes to either "update existing question" or "create standalone decision"
- [ ] Stage 5 creates conflict records when impact assessment flags contradictions
- [ ] Stage 6 produces Layer 4 annotation proposals (consumed by Phase 6)
- [ ] Idempotent stages, 3-retry, human-review escalation on failure
- [ ] All Claude calls through the router
- [ ] Rate limit pre-check runs before stage 1

---

### Task 13: Build Story Generation Pipeline (REQ-PIPELINE-003)

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace the generic `STORY_GENERATION` harness task with a 7-stage Inngest step function in `src/lib/pipelines/story-generation/`. Stages: (1) Assemble context — deterministic (consumes Task 8), (2) Draft — Sonnet, (3) Validate mandatory fields — deterministic, (4) Component cross-reference — deterministic + hybrid search, (5) Resolve conflicts — Sonnet (conditional), (6) Typography validator — invokes firm-rules.postProcessOutput, (7) Return draft — persist with `draft` status. |
| **Depends On** | Task 2, Task 5, Task 8, Task 16 |
| **Complexity** | L |
| **Status** | Not Started — needs deep-dive confirmation (stage error behavior §8 item 2) |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] All 7 stages execute as an Inngest step function
- [ ] Stage 3 rejects drafts missing any mandatory field
- [ ] Stage 5 only runs when stage 4 flagged unknowns/mismatches
- [ ] Stage 6 applies firm typographic rules before persistence
- [ ] Drafts persist with `draft` status; no auto-promotion
- [ ] Idempotent stages, 3-retry, human-review escalation
- [ ] All Claude calls through the router
- [ ] Rate limit pre-check runs before stage 1

---

### Task 14: Build Briefing/Status Pipeline (REQ-PIPELINE-004)

| Attribute | Details |
|-----------|---------|
| **Scope** | Replace the generic `BRIEFING` harness task with a 5-stage Inngest step function in `src/lib/pipelines/briefing/`. Stages: (1) Fetch metrics — deterministic SQL with 5-minute cache, (2) Assemble narrative context — deterministic, (3) Synthesize — Sonnet per briefing-type template, (4) Validate — typography/branding/AI-phrase strip, (5) Cache and return with `inputs_hash`. Support all 6 briefing types: daily_standup, weekly_status, executive_summary, blocker_report, discovery_gap_report, sprint_health. |
| **Depends On** | Task 2, Task 5, Task 16 |
| **Complexity** | L |
| **Status** | Not Started — needs deep-dive confirmation (stage error behavior §8 item 2) |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] All 5 stages execute as an Inngest step function
- [ ] All 6 briefing types have dedicated templates and produce correctly-shaped output
- [ ] Stage 1 cache hits (matching inputs_hash within 5 minutes) short-circuit stages 1-4 and return cached result
- [ ] Stage 4 strips AI-characteristic phrases via firm-rules.postProcessOutput
- [ ] Idempotent stages, 3-retry, human-review escalation
- [ ] All Claude calls through the router
- [ ] Rate limit pre-check runs before stage 1

---

### Task 15: Build Freeform Agent (REQ-AGENT-FREEFORM-001)

| Attribute | Details |
|-----------|---------|
| **Scope** | Build the "project brain chat" agent loop in `src/lib/agent-freeform/`. Single agent loop. Default model Sonnet 4.6 via router (intent `freeform_chat`); "think harder" mode routes to Opus 4.6 (intent `freeform_chat_deep`). Register 6 read tools (no confirmation) and 3 write tools (UI confirmation). System prompt builds from Layer 3 context + chat history window (Task 9) + firm rules (Task 2). Wire `src/app/api/chat/route.ts` to this agent. |
| **Depends On** | Task 2, Task 9, Task 11, Task 12, Task 13, Task 14, Task 16 |
| **Complexity** | L |
| **Status** | Not Started — needs deep-dive confirmation (additional read tools §8 item 4) |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Read tools registered: `search_project_kb`, `search_org_kb`, `get_sprint_state`, `get_project_summary`, `get_blocked_items`, `get_discovery_gaps` — invocable without user confirmation
- [ ] Write tools registered: `create_question`, `create_risk`, `create_requirement` — require UI confirmation before persistence
- [ ] Story creation, transcript processing, answer logging, document generation, and sprint modification tools are NOT registered and attempts to invoke them fail with "tool not available"
- [ ] UI toggle routes agent between Sonnet (default) and Opus ("think harder")
- [ ] System prompt includes Layer 3 context, 50-message / 7-day chat history window, and firm rules addendum
- [ ] Rate limit pre-check runs at agent invocation

---

### Task 16: Model router retrofit

| Attribute | Details |
|-----------|---------|
| **Scope** | Retrofit every existing direct Claude call in `src/lib/agent-harness/engine.ts` and `src/lib/agent-harness/tasks/**` to go through `model_router.resolve_model(intent)` from Phase 11. No stage anywhere in agent-harness or pipelines hardcodes a model string. |
| **Depends On** | Phase 11 (model router delivered) |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] All calls to `anthropic.messages.create` in `src/lib/agent-harness/` go through the router
- [ ] Grep across `src/lib/agent-harness/` and `src/lib/pipelines/` for literal model strings (e.g., `"claude-"`) returns zero hits outside the router module
- [ ] Router receives an intent string per call; defaults handled by Phase 11 router config
- [ ] Existing task types continue to produce equivalent outputs (no model regression)

---

### Task 17: Story Generation eval fixtures + assertions (REQ-HARNESS-012)

| Attribute | Details |
|-----------|---------|
| **Scope** | Add 15 labeled fixtures for the Story Generation Pipeline to the Phase 11 eval harness. Register three assertions per fixture: (1) mandatory field presence, (2) semantic similarity of acceptance criteria to gold, (3) component cross-reference accuracy. |
| **Depends On** | Phase 11 (eval harness delivered), Task 13 |
| **Complexity** | M |
| **Status** | Not Started — needs deep-dive confirmation (similarity threshold §8 item 5) |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] 15 fixtures committed under the Phase 11 eval fixtures directory, tagged `story-generation`
- [ ] Each fixture has an input `{epicId, projectFixtureId}` and a gold Story with title, description, acceptance criteria, components
- [ ] Mandatory field presence assertion: all required Story fields non-empty
- [ ] Semantic similarity assertion: acceptance-criteria embedding similarity ≥ calibrated threshold (see §8 item 5)
- [ ] Component cross-reference assertion: referenced components match gold's set within tolerance
- [ ] Eval suite runs in CI against the Story Generation Pipeline
- [ ] **Briefing/Status Pipeline fixtures (added):** 10 labeled fixtures committed under `/evals/briefing/`, tagged `briefing-status`, covering all 6 briefing types (`daily_standup`, `weekly_status`, `executive_summary`, `blocker_report`, `discovery_gap_report`, `sprint_health`). Authored and maintained by Phase 2; Phase 11 harness hosts them.
- [ ] Briefing fixture assertions: (1) all template-required sections present, (2) firm-rules post-processing applied, (3) cache key `inputs_hash` stable across re-runs with identical inputs.

---

## Summary

| Task | Title | Depends On | Complexity | Status |
|------|-------|-----------|------------|--------|
| 1 | Fix create_question confidence/needsReview/reviewReason | — | S | Not Started |
| 2 | Create firm typographic rules module | — | M | Not Started |
| 3 | Implement output validation re-prompt loop | — | M | Not Started |
| 4 | Populate SessionLog entity tracking fields | — | M | Not Started |
| 5 | Build rate limiting enforcement core | — | M | Not Started |
| 6 | Implement getRecentSessions + getMilestoneProgress | — | S | Not Started |
| 7 | Wire transcript context enrichment | 6 | S | Not Started |
| 8 | Expand story generation context loader | — | S | Not Started |
| 9 | Add general chat history window | — | M | Not Started |
| 10 | Build Needs Review session-end UX | 1, 11 | M | Not Started |
| 11 | Build Transcript Processing Pipeline | 5, 7, 16 | L | Needs deep-dive |
| 12 | Build Answer Logging Pipeline | 5, 11, 16 | L | Needs deep-dive |
| 13 | Build Story Generation Pipeline | 2, 5, 8, 16 | L | Needs deep-dive |
| 14 | Build Briefing/Status Pipeline | 2, 5, 16 | L | Needs deep-dive |
| 15 | Build Freeform Agent | 2, 9, 11, 12, 13, 14, 16 | L | Needs deep-dive |
| 16 | Model router retrofit | Phase 11 | S | Not Started |
| 17 | Story Generation eval fixtures + assertions | Phase 11, 13 | M | Needs deep-dive |
