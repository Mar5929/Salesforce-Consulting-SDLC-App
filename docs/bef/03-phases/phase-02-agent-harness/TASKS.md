# Phase 2 Tasks: Agent Harness, Transcripts

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Total Tasks: 10
> Status: 0/10 complete
> Last Updated: 2026-04-10

---

## Execution Order

```
Task 1 (create_question fix) ───────────────────────────┐
  ├── Task 2 (firm typographic rules)    ─┐              │
  ├── Task 3 (re-prompt loop)             │              │
  ├── Task 4 (entity tracking)            ├── parallel   │
  ├── Task 5 (rate limiting)              │              │
  └── Task 6 (Layer 3 context functions) ─┘              │
       ├── Task 7 (transcript context)   ─┐              │
       ├── Task 8 (story gen context)     ├── parallel   │
       └── Task 9 (chat history)         ─┘              │
            └── Task 10 (Needs Review UX) ───────────────┘
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
| **Scope** | Create `src/lib/agent-harness/firm-rules.ts` with a prompt addendum string and a `postProcessOutput` function. Wire the addendum into `buildSystemPrompt` in `engine.ts` and the post-processing into the engine's return path. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] `buildSystemPrompt` in engine.ts injects the firm rules addendum into every task's system prompt
- [ ] `postProcessOutput` replaces em dashes (—, –) with hyphens (-)
- [ ] `postProcessOutput` strips known AI-characteristic phrases: "Certainly!", "Great question!", "I'd be happy to", "Absolutely!", "Of course!"
- [ ] `postProcessOutput` does NOT alter text inside backticks or double-quoted strings
- [ ] All existing task types receive the firm rules in their system prompt without per-task changes

**Implementation Notes:**
Create `src/lib/agent-harness/firm-rules.ts`:
```ts
export const FIRM_RULES_ADDENDUM = `
## Firm Typographic Rules (mandatory)
- Never use em dashes (—) or en dashes (–). Use hyphens (-) or rephrase.
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
- [ ] Given output validation passes on the first try, no re-prompt occurs (existing behavior unchanged)
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
  // Re-call Claude with correctionMessage appended to messages
  result = await callClaude(/* ... with correction appended */);
  validation = taskDef.outputValidator(result);
}
```
Key: the `messages` array must include the previous AI response AND the correction as a new user message. This maintains conversation context so Claude understands what to fix.

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
- [ ] Tools that don't create/modify entities (e.g., read-only, flag_conflict) return no tracking data — engine handles gracefully
- [ ] Existing SessionLog fields (inputTokens, outputTokens, etc.) are unaffected

**Implementation Notes:**
1. Define a tracking type:
```ts
interface EntityTrack { entityType: string; entityId: string; action: "created" | "modified"; fieldsChanged?: string[] }
```
2. Each tool's execute function returns `{ result: ..., tracking?: EntityTrack }`. Audit all tools in `src/lib/agent-harness/tools/` and add tracking to each.
3. In the engine's tool execution loop, collect tracking into `entitiesCreated: EntityTrack[]` and `entitiesModified: EntityTrack[]` arrays.
4. Write to `prisma.sessionLog.create({ data: { ..., entitiesCreated, entitiesModified } })`.

---

### Task 5: Build rate limiting enforcement core

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `src/lib/agent-harness/rate-limiter.ts` with `checkRateLimits(projectId, userId)`. Add `aiDailyLimit` and `aiMonthlyCostCap` fields to the Project model. Call `checkRateLimits` at the top of `executeTask` in engine.ts. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Given a user has made 100 AI invocations today and project's aiDailyLimit is 100, the next `executeTask` call returns a 429 error with message "Daily AI invocation limit exceeded (100/100). Contact your PM to increase the limit."
- [ ] Given a project has $50 in estimated AI cost this month and aiMonthlyCostCap is $50, the next call returns 429
- [ ] Given aiDailyLimit is null (unlimited), daily limit is not enforced
- [ ] Given aiMonthlyCostCap is null (unlimited), monthly limit is not enforced
- [ ] Schema migration adds nullable aiDailyLimit and aiMonthlyCostCap to Project model

**Implementation Notes:**
`rate-limiter.ts`:
```ts
export async function checkRateLimits(projectId: string, userId: string): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { aiDailyLimit: true, aiMonthlyCostCap: true } });

  // Daily check: COUNT SessionLog WHERE projectId AND userId AND createdAt >= today UTC
  // Monthly check: SUM (inputTokens * INPUT_COST + outputTokens * OUTPUT_COST) WHERE projectId AND createdAt >= first of month UTC
  // Throw RateLimitError with descriptive message if exceeded
}
```
Cost constants: `INPUT_COST = 3.00 / 1_000_000` (per token), `OUTPUT_COST = 15.00 / 1_000_000` (Sonnet pricing). Store as named constants, not hardcoded in the query.

Schema change:
```prisma
model Project {
  // ... existing fields
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
- [ ] `getRecentSessions(projectId, 5)` returns the 5 most recent SessionLog entries with taskType, createdAt, token counts, and entities created summary
- [ ] `getMilestoneProgress(projectId)` returns milestones with name, target date, and computed completion percentage (done stories / total linked stories)
- [ ] Both return compact formatted strings suitable for system prompt injection (<1K tokens each)
- [ ] Both are exported from `context/index.ts`
- [ ] Given no sessions exist, getRecentSessions returns empty result (no error)
- [ ] Given a milestone with 0 linked stories, completion is 0%

**Implementation Notes:**
Create `src/lib/agent-harness/context/recent-sessions.ts`:
- Query: `prisma.sessionLog.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: limit, select: { taskType, createdAt, inputTokens, outputTokens, entitiesCreated } })`
- Format as: "Recent AI sessions: [TRANSCRIPT_PROCESSING 2h ago - created 5 questions, 3 decisions] [BRIEFING_GENERATION 1d ago] ..."

Create `src/lib/agent-harness/context/milestone-progress.ts`:
- Query milestones with `_count` of linked stories by status
- Format as: "Milestone progress: [Phase 1 Kickoff: 8/12 stories done (67%)] [Data Migration: 0/5 (0%)] ..."

---

### Task 7: Wire transcript context enrichment

| Attribute | Details |
|-----------|---------|
| **Scope** | Add `getRecentSessions` and `getArticleSummaries` (if available) to the transcript processing context loader's `Promise.all`. |
| **Depends On** | Task 6 |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Transcript processing context includes recent session summaries
- [ ] If `getArticleSummaries` exists in `context/`, it is wired in
- [ ] If `getArticleSummaries` does not exist, a TODO comment is added for Phase 6 and the context loader works without it
- [ ] Existing context (openQuestions, recentDecisions, epicsAndFeatures) is unchanged

**Implementation Notes:**
File: `src/lib/agent-harness/tasks/transcript-processing.ts` (~lines 22-57).
Add to the `Promise.all`:
```ts
const [questions, decisions, epics, recentSessions, articleSummaries] = await Promise.all([
  getOpenQuestions(projectId),
  getRecentDecisions(projectId, 20),
  getEpicsAndFeatures(projectId),
  getRecentSessions(projectId, 5),       // NEW
  getArticleSummaries?.(projectId) ?? "", // NEW — conditional on existence
]);
```
Import `getRecentSessions` from `context/index.ts`. Check if `getArticleSummaries` is exported — if not, skip and add `// TODO: Phase 6 — wire getArticleSummaries when knowledge layer is built`.

---

### Task 8: Expand story generation context loader

| Attribute | Details |
|-----------|---------|
| **Scope** | Expand `storyGenerationContextLoader` in `story-generation.ts` to include epic-scoped answered questions, decisions, and org components. Wire in `getBusinessProcesses` and `getRelevantArticles` if they exist. |
| **Depends On** | None |
| **Complexity** | S |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] Story generation context includes answered questions scoped to the target epic
- [ ] Story generation context includes decisions scoped to the target epic
- [ ] Story generation context includes org components referenced by the epic's stories
- [ ] If `getBusinessProcesses` exists, it is wired in; if not, TODO for Phase 6
- [ ] If `getRelevantArticles` exists, it is wired in; if not, TODO for Phase 6
- [ ] Existing context (projectSummary, storiesContext) is unchanged

**Implementation Notes:**
File: `src/lib/agent-harness/tasks/story-generation.ts` (~lines 24-47).
Read the existing `storyGenerationContextLoader`. Add parallel queries:
```ts
const epicId = input.metadata?.epicId as string;
const [projectSummary, storiesContext, answeredQuestions, decisions, orgComponents] = await Promise.all([
  getProjectSummary(projectId),
  getStoriesContext(projectId, epicId),
  getAnsweredQuestions(projectId, { scopeEpicId: epicId }),  // NEW
  getDecisionsForEpic(epicId),                                // NEW
  getOrgComponentsForEpic?.(epicId) ?? [],                    // NEW — conditional
]);
```
Check `context/index.ts` for which functions exist. Wire in what's available, add TODOs for what's missing.

---

### Task 9: Add general chat history window

| Attribute | Details |
|-----------|---------|
| **Scope** | In the general chat context assembly, query recent ChatMessage records (last 50 messages or 7 days, whichever is smaller) and include as a "Recent conversation history" section in the system prompt. |
| **Depends On** | None |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] General chat system prompt includes recent conversation history from prior chat sessions
- [ ] History window is capped at 50 messages OR 7 days, whichever produces fewer messages
- [ ] History is project-scoped (all conversations in the project, not just the current one)
- [ ] Current session messages are NOT duplicated in the history section (they're already in the messages array)
- [ ] If no prior chat history exists, the section is omitted from the prompt
- [ ] History is formatted as: "[Apr 8] User: ... | AI: ..." (compact, not full message objects)

**Implementation Notes:**
Locate where `assembleSmartChatContext` or `buildAgenticSystemPrompt` is called for general chat. Add a query:
```ts
const recentHistory = await prisma.chatMessage.findMany({
  where: {
    conversation: { projectId },
    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    // Exclude current conversation to avoid duplicates
    conversationId: { not: currentConversationId },
  },
  orderBy: { createdAt: "desc" },
  take: 50,
  select: { role: true, content: true, createdAt: true },
});
```
Format as a compact string and inject into the system prompt as a "Recent conversation history" section.

---

### Task 10: Build Needs Review session-end UX

| Attribute | Details |
|-----------|---------|
| **Scope** | Modify transcript processing Inngest function's save-to-conversation step to group entities by confidence tier and collect needsReview items. Update the extraction cards UI component to render confidence tier summary and Needs Review section. |
| **Depends On** | Task 1 |
| **Complexity** | M |
| **Status** | Not Started |
| **Completed** | — |
| **Linear ID** | — |

**Acceptance Criteria:**
- [ ] ChatMessage.toolCalls JSON includes `confidenceTiers: { HIGH: N, MEDIUM: N, LOW: N }` counts
- [ ] ChatMessage.toolCalls JSON includes `needsReviewItems: [{ entityType, entityId, title, reviewReason }]`
- [ ] Frontend renders a confidence tier summary bar (e.g., "12 HIGH | 3 MEDIUM | 1 LOW")
- [ ] Frontend renders a "Needs Review" section listing flagged items with reviewReason
- [ ] Each Needs Review item links to the entity's detail/edit view
- [ ] If no items are flagged for review, the Needs Review section is not rendered
- [ ] Given 0 MEDIUM and 0 LOW items, confidence bar still shows (all HIGH is valid)

**Implementation Notes:**
Backend — `src/lib/inngest/functions/transcript-processing.ts` (save-to-conversation step):
After building `ExtractionCards` groups, query the created entities for their confidence and needsReview fields:
```ts
const createdEntities = await Promise.all([
  prisma.question.findMany({ where: { id: { in: questionIds } }, select: { id: true, questionText: true, confidence: true, needsReview: true, reviewReason: true } }),
  prisma.decision.findMany({ where: { id: { in: decisionIds } }, select: { id: true, title: true, confidence: true, needsReview: true, reviewReason: true } }),
  // ... same for requirements, risks
]);
```
Build `confidenceTiers` and `needsReviewItems` from the results. Add to the ChatMessage.toolCalls JSON.

Frontend — Locate the extraction cards component (likely in `src/components/chat/` or similar). Add:
1. A confidence tier summary bar above the entity groups
2. A "Needs Review" collapsible section below the entity groups with edit/confirm/discard actions per item

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
| 10 | Build Needs Review session-end UX | 1 | M | Not Started |
