# Phase 11: Agentic Chat with Database Awareness and Project Tool Use - Research

**Researched:** 2026-04-08
**Domain:** Vercel AI SDK tool calling, multi-step agent loops, role-gated CRUD tools
**Confidence:** HIGH

## Summary

Phase 11 upgrades the existing chat from a simple Q&A assistant to a fully agentic AI that can query, create, update, and delete project entities through Vercel AI SDK `tool()` definitions with server-side `execute` handlers. The existing codebase already has: (1) a working chat route using `streamText` + `tool()` with `convertToModelMessages` and `toUIMessageStreamResponse()`, (2) 7 agent harness tools in Anthropic SDK format, (3) 22 server action files with validated CRUD operations, (4) `scopedPrisma` for project isolation, and (5) `getCurrentMember` + `requireRole` for role-based access.

The core work is: define ~50 Vercel AI SDK `tool()` functions (query/create/update/delete per entity) with `execute` handlers that call into existing server actions or direct Prisma queries, register them in the chat route with role-based filtering, use `needsApproval: true` for delete tools as the hard-coded deletion safety gate (D-05), add `stopWhen: stepCountIs(15)` for bounded multi-step workflows (D-16), render tool results as entity-specific card components in the message list, and log all tool calls to SessionLog for audit (D-19).

**Primary recommendation:** Use Vercel AI SDK `tool()` with `execute` + `needsApproval` pattern for the deletion safety gate. Tools should be thin wrappers calling existing server actions/Prisma queries with `scopedPrisma`. Use `stopWhen: stepCountIs(15)` for multi-step. Render tool results via typed `part.type === 'tool-{name}'` in message-list.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tool-per-entity pattern -- create granular Vercel AI SDK `tool()` definitions for each entity (epics, features, stories, questions, decisions, requirements, risks, knowledge articles, sprints, defects, test cases, org components, business processes, documents, conversations). Tool input schemas implicitly teach the AI the data model.
- **D-02:** Full CRUD for all entities -- every entity gets query, create, update, and delete tools.
- **D-03:** Batch tool variants -- include batch versions of tools (e.g., `create_stories` accepts an array) for efficiency when the AI needs to create/update multiple entities in one request.
- **D-04:** Tools use the existing server actions and data access layer under the hood -- tools call into the same validated, permission-checked code paths that the UI uses.
- **D-05:** Hard-coded deletion confirmation gate -- any delete operation requires explicit user confirmation at the code level, not just AI prompt instructions. Structural gate in the tool execution layer that cannot be bypassed by prompt injection.
- **D-08:** Tool availability is gated by user role -- same permissions as the web app UI. Enforced at the tool execution layer, not just the AI prompt.
- **D-09:** Role permissions map: tools respect AUTH-03 role definitions (SA, PM, BA, Developer, QA) and existing server action permission checks.
- **D-10:** All interactive chat sessions (GENERAL_CHAT, TASK_SESSION, STORY_SESSION) get the full tool repertoire. TRANSCRIPT_SESSION remains non-interactive.
- **D-11:** Phase 11 is defined independently of Phase 10.
- **D-12:** Structured cards for query results -- entity-specific card components render in chat when the AI queries data.
- **D-16:** Bounded tool call chains -- max 15 tool calls per AI response turn.
- **D-17:** Live context panel updates via SWR revalidation when a tool call mutates data.
- **D-18:** Natural message history -- AI SDK includes prior tool calls and results in conversation context automatically.
- **D-19:** Audit trail via SessionLog -- all tool calls logged with inputs, outputs, timestamps, and session linkage.

### Claude's Discretion
- Deletion confirmation UX pattern (D-06)
- Result set management and pagination strategy (D-07)
- Write/update confirmation rendering (D-13)
- Error handling and recovery patterns (D-14)
- System prompt size and content balance (D-15)
- Exact tool input/output schemas for each entity
- Card component designs for each entity type in chat
- Tool description text optimization for AI comprehension
- Loading states for tool execution in chat UI

### Deferred Ideas (OUT OF SCOPE)
- Undo capability (requires soft-delete, state snapshots, or event sourcing)
- Phase 10 (Chat Session Management) -- separate phase
- Generic SQL query tool -- consider if tool-per-entity proves too limiting
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | 6.0.147 | `streamText`, `tool()`, `convertToModelMessages`, `toUIMessageStreamResponse()`, `stepCountIs` | Already in use. Provides tool calling, multi-step loops, approval flows, streaming. [VERIFIED: node_modules] |
| @ai-sdk/react | (installed) | `useChat`, `addToolApprovalResponse`, `addToolOutput` | Already in use via `useChat` hook. [VERIFIED: codebase] |
| @ai-sdk/anthropic | (installed) | Claude provider for AI SDK | Already in use. [VERIFIED: codebase] |
| zod | 4.x | Tool input schemas | Already in use for server action schemas. [VERIFIED: codebase] |
| next-safe-action | 8.x | Type-safe server actions | Already in use -- tools will call these same actions. [VERIFIED: codebase] |

### No New Dependencies Required

All capabilities needed for Phase 11 are available in the existing stack. The Vercel AI SDK v6 `tool()` with `execute`, `needsApproval`, `stopWhen`, and `sendAutomaticallyWhen` provides everything needed for the agentic tool loop, deletion confirmation, and multi-step workflows.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    chat-tools/
      index.ts              # Tool registry: buildToolsForRole(role, projectId)
      types.ts              # Shared tool result types, ToolCategory enum
      schemas/              # Shared Zod schemas for tool inputs (reuse from server actions)
      read/                 # Query tools (one file per entity group)
        query-stories.ts
        query-epics.ts
        query-questions.ts
        query-decisions.ts
        query-requirements.ts
        query-risks.ts
        query-sprints.ts
        query-defects.ts
        query-knowledge.ts
        query-org-components.ts
        query-business-processes.ts
        query-documents.ts
        query-conversations.ts
        query-test-cases.ts
      write/                # Create/update tools
        mutate-stories.ts
        mutate-epics.ts
        mutate-questions.ts
        mutate-decisions.ts
        mutate-requirements.ts
        mutate-risks.ts
        mutate-sprints.ts
        mutate-defects.ts
        mutate-knowledge.ts
        mutate-org-components.ts
        mutate-business-processes.ts
        mutate-test-cases.ts
      delete/               # Delete tools (all with needsApproval)
        delete-tools.ts     # All delete tools in one file (they're thin)
      batch/                # Batch variants
        batch-stories.ts
        batch-questions.ts
      audit.ts              # SessionLog recording helper
  components/
    chat/
      tool-cards/           # Entity-specific card components
        story-card.tsx
        epic-card.tsx
        question-card.tsx
        decision-card.tsx
        requirement-card.tsx
        risk-card.tsx
        sprint-card.tsx
        defect-card.tsx
        knowledge-card.tsx
        org-component-card.tsx
        business-process-card.tsx
        generic-entity-card.tsx  # Fallback for simple entities
        delete-confirmation.tsx  # Approval UI for deletions
        mutation-result.tsx      # Success/error card for write ops
      tool-part-renderer.tsx # Switch on part.type to render correct card
```

### Pattern 1: Tool Definition with Execute Handler
**What:** Each tool is a Vercel AI SDK `tool()` with Zod `inputSchema` and server-side `execute` function.
**When to use:** All CRUD tools.
**Example:**
```typescript
// Source: node_modules/ai/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx
import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryStoriesTools(projectId: string) {
  return {
    query_stories: tool({
      description: "Search for user stories in the current project. Returns summary fields. Use get_story for full details.",
      inputSchema: z.object({
        epicId: z.string().optional().describe("Filter by epic ID"),
        featureId: z.string().optional().describe("Filter by feature ID"),
        status: z.enum(["DRAFT", "READY", "SPRINT_PLANNED", "IN_PROGRESS", "IN_REVIEW", "QA", "DONE"]).optional(),
        limit: z.number().int().min(1).max(50).default(20).describe("Max results"),
      }),
      execute: async ({ epicId, featureId, status, limit }) => {
        const scoped = scopedPrisma(projectId)
        const stories = await scoped.story.findMany({
          where: { ...(epicId && { epicId }), ...(featureId && { featureId }), ...(status && { status }) },
          select: { id: true, displayId: true, title: true, status: true, priority: true, storyPoints: true },
          take: limit,
          orderBy: { createdAt: "desc" },
        })
        return { count: stories.length, stories }
      },
    }),
  }
}
```

### Pattern 2: Deletion with needsApproval (D-05 Hard-Coded Gate)
**What:** Delete tools use the AI SDK `needsApproval: true` flag. This is a structural gate -- the execute function only runs after the user explicitly approves via the UI. The AI cannot bypass this.
**When to use:** All delete operations.
**Example:**
```typescript
// Source: node_modules/ai/docs/04-ai-sdk-ui/03-chatbot-tool-usage.mdx
import { tool } from "ai"
import { z } from "zod"

export function deleteStoryTool(projectId: string, memberId: string, role: string) {
  return {
    delete_story: tool({
      description: "Delete a user story. Requires explicit user confirmation before execution.",
      inputSchema: z.object({
        storyId: z.string().describe("The story ID to delete"),
        reason: z.string().describe("Why this story should be deleted"),
      }),
      needsApproval: true, // Hard-coded gate (D-05)
      execute: async ({ storyId }) => {
        // Role check happens here at execution time
        const scoped = scopedPrisma(projectId)
        const story = await scoped.story.findUnique({ where: { id: storyId } })
        if (!story) return { success: false, error: "Story not found" }
        // Enforce same role rules as web app
        if (role !== "PM" && role !== "SOLUTION_ARCHITECT" && story.assigneeId !== memberId) {
          return { success: false, error: "Insufficient permissions" }
        }
        await prisma.story.delete({ where: { id: storyId } })
        return { success: true, deletedId: storyId, title: story.title }
      },
    }),
  }
}
```

### Pattern 3: Role-Based Tool Registration
**What:** The chat route builds the tools object dynamically based on the user's role. Some tools are only available to certain roles.
**When to use:** Chat API route when assembling tools for `streamText`.
**Example:**
```typescript
// In chat route
import { buildToolsForRole } from "@/lib/chat-tools"

const member = await getCurrentMember(projectId)
const tools = buildToolsForRole(member.role, projectId, member.id)

const result = streamText({
  model: anthropic("claude-sonnet-4-20250514"),
  system: systemPrompt,
  messages: modelMessages,
  tools,
  stopWhen: stepCountIs(15), // D-16: bounded tool chains
  onFinish: async ({ text, totalUsage, toolCalls }) => { /* persist + audit */ },
})
```

### Pattern 4: Client-Side Approval UI for Deletions (D-06 Recommendation)
**What:** When the AI calls a delete tool, `needsApproval` causes the SDK to return an `approval-requested` state. The client renders a confirmation card with Approve/Deny buttons. The user's response triggers `addToolApprovalResponse`.
**Example:**
```typescript
// Source: node_modules/ai/docs/04-ai-sdk-ui/03-chatbot-tool-usage.mdx
// In useChat setup:
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai"

const { messages, sendMessage, addToolApprovalResponse } = useChat({
  transport: new DefaultChatTransport({ api: "/api/chat", body: { projectId, conversationId } }),
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
})

// In message rendering, when part.state === "approval-requested":
// Render DeleteConfirmation card with Approve/Deny buttons
// On approve: addToolApprovalResponse({ id: part.approval.id, approved: true })
// On deny: addToolApprovalResponse({ id: part.approval.id, approved: false })
```

### Pattern 5: Summary-First Query Results (D-07 Recommendation)
**What:** Query tools return summary fields (id, displayId, title, status) for lists. A separate `get_{entity}` detail tool returns the full entity. This optimizes token usage.
**When to use:** All query tools that can return multiple results.
**Example:**
```typescript
// query_stories returns: { count, stories: [{ id, displayId, title, status, priority, storyPoints }] }
// get_story returns: { story: { id, displayId, title, description, acceptanceCriteria, persona, ... } }
```

### Pattern 6: SWR Revalidation After Mutations (D-17)
**What:** After a write/delete tool succeeds, the client triggers SWR revalidation so the context panel and any cached data refresh. This leverages the existing `mutate` pattern or `refreshInterval` polling.
**When to use:** After any create/update/delete tool call completes.

### Pattern 7: Multi-Step with stopWhen (D-16)
**What:** `streamText` with `stopWhen: stepCountIs(15)` allows the AI to chain up to 15 tool calls in a single response turn. The AI can: look up an epic, generate stories for it, assign them to a sprint -- all in one turn.
**Source:** node_modules/ai/docs/03-agents/04-loop-control.mdx [VERIFIED: local docs]

### Anti-Patterns to Avoid
- **Building a custom tool loop:** The AI SDK handles multi-step tool calling natively via `stopWhen`. Do NOT reimplement the loop from engine.ts for chat tools.
- **Duplicating server action validation:** Tools should call into existing server actions or use the same Prisma queries with `scopedPrisma`. Do NOT rewrite validation logic.
- **Prompt-only deletion protection:** NEVER rely on system prompt instructions like "ask before deleting" as the safety gate. Use `needsApproval: true` which is a structural code-level gate.
- **Loading full entities in list queries:** Return summary fields only (id, displayId, title, status). Full entity detail via separate `get_` tool.
- **One massive tools object:** Group tools into modules (read, write, delete, batch) and compose them in the registry. Keeps files manageable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-step tool loops | Custom iteration/retry loop | AI SDK `stopWhen: stepCountIs(15)` | SDK handles tool result passing, message assembly, and step counting natively |
| Deletion confirmation | Custom confirmation dialog with state tracking | AI SDK `needsApproval: true` + `addToolApprovalResponse` | Structural gate that cannot be bypassed. SDK manages approval flow state. |
| Tool result in message stream | Custom WebSocket events for tool results | AI SDK `toUIMessageStreamResponse()` + typed `parts` | SDK streams tool call states (input-streaming, input-available, output-available) natively |
| Auto-resubmit after approval | Custom message sending logic after approval | `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses` | SDK helper handles the timing automatically |
| Input sanitization | New sanitizer for tool inputs | Existing `sanitizeToolInput` from `src/lib/agent-harness/sanitize.ts` | Already handles recursive DOMPurify on all strings |

**Key insight:** The Vercel AI SDK v6 has evolved to handle the entire agentic tool loop, approval flows, and streaming natively. The heavy lifting is defining tool schemas and execute handlers, not building infrastructure.

## Entity-to-Tool Mapping

Based on CONTEXT.md D-01 and D-02, here is the full entity-to-tool matrix:

| Entity | Query | Get Detail | Create | Update | Delete | Batch |
|--------|-------|------------|--------|--------|--------|-------|
| Epic | query_epics | get_epic | create_epic | update_epic | delete_epic | - |
| Feature | query_features | get_feature | create_feature | update_feature | delete_feature | - |
| Story | query_stories | get_story | create_story | update_story | delete_story | create_stories |
| Question | query_questions | get_question | create_question | update_question | delete_question | create_questions |
| Decision | query_decisions | get_decision | create_decision | update_decision | delete_decision | - |
| Requirement | query_requirements | get_requirement | create_requirement | update_requirement | delete_requirement | - |
| Risk | query_risks | get_risk | create_risk | update_risk | delete_risk | - |
| Sprint | query_sprints | get_sprint | create_sprint | update_sprint | delete_sprint | - |
| Defect | query_defects | get_defect | create_defect | update_defect | delete_defect | - |
| Test Case | query_test_cases | get_test_case | create_test_case | update_test_case | delete_test_case | - |
| Knowledge Article | query_articles | get_article | - | - | - | - |
| Org Component | query_org_components | get_org_component | - | - | - | - |
| Business Process | query_business_processes | get_business_process | - | - | - | - |
| Document | query_documents | get_document | - | - | - | - |
| Conversation | query_conversations | get_conversation | - | - | - | - |

**Notes:**
- Knowledge Articles, Org Components, Business Processes, Documents, and Conversations are read-only through chat tools (mutations happen through dedicated workflows/UI).
- Total tools: ~60 (15 entities x ~4 CRUD ops + batch variants + detail tools) [ASSUMED]
- Batch variants per D-03: `create_stories` and `create_questions` are the most useful batch tools (common multi-create scenarios).

## Role-Based Tool Gating Matrix

Based on existing server action role checks (D-08, D-09):

| Operation | SA | PM | BA | Developer | QA |
|-----------|----|----|----|-----------|----|
| Query (all entities) | Yes | Yes | Yes | Yes | Yes |
| Create stories | Yes | Yes | Yes | Yes | No |
| Update stories | Yes (any) | Yes (any) | Own only | Own only | No |
| Delete stories | Yes | Yes | No | No | No |
| Create questions | Yes | Yes | Yes | No | No |
| Answer questions | Yes | Yes | Yes | No | No |
| Create decisions | Yes | Yes | Yes | No | No |
| Create requirements | Yes | Yes | Yes | No | No |
| Create risks | Yes | Yes | Yes | No | No |
| Create/update sprints | No | Yes | No | No | No |
| Create/update defects | Yes | Yes | Yes | Yes | Yes |
| Update story status | Yes | Yes | No | Yes | Yes |
| Create test cases | Yes | Yes | No | No | Yes |

**Note:** Exact permissions should be verified against each server action's role checks during implementation. The table above is based on patterns observed in `stories.ts` and `questions.ts`. [ASSUMED - verify during implementation]

## Common Pitfalls

### Pitfall 1: Tool Count Exceeding Model Context Budget
**What goes wrong:** With ~60 tools, the tool descriptions alone could consume 3,000-5,000 tokens of context, leaving less room for conversation history and system prompt.
**Why it happens:** Each tool definition (name, description, inputSchema) is serialized into the model's context window.
**How to avoid:** Keep tool descriptions concise (1 sentence). Use `.describe()` on Zod fields rather than verbose top-level descriptions. Consider using `prepareStep` to dynamically include only relevant tools based on conversation context if token budgets become tight.
**Warning signs:** Responses become less contextual, model starts hallucinating entity IDs, or conversation history gets truncated.

### Pitfall 2: Tool Execute Throwing Unhandled Errors
**What goes wrong:** If a tool's `execute` function throws an unhandled error, the entire `streamText` call may fail, losing the streamed response.
**Why it happens:** Database errors, validation failures, or permission denials in tool execute handlers.
**How to avoid:** Wrap every `execute` handler in try/catch. Return structured error objects `{ success: false, error: "message" }` rather than throwing. The AI can then explain the error and suggest alternatives (D-14).
**Warning signs:** Chat responses cut off mid-stream, generic error messages shown.

### Pitfall 3: Stale Entity IDs in Conversation History
**What goes wrong:** The AI references entity IDs from earlier in the conversation that have since been deleted or modified.
**Why it happens:** D-18 says the AI SDK includes prior tool results in context. If a user deletes a story in the web UI (not via chat), the AI still has the old ID in its history.
**How to avoid:** Query tools should always verify entity existence before returning data. Return "not found" gracefully rather than crashing.
**Warning signs:** AI confidently references entities that no longer exist.

### Pitfall 4: needsApproval + streamText Interaction
**What goes wrong:** When using `needsApproval: true` with `streamText`, the stream completes with an `approval-requested` state but no tool result. If the client is not set up to handle this state, nothing happens after the user approves.
**Why it happens:** `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses` must be configured on the `useChat` hook for the conversation to continue after approval.
**How to avoid:** Always configure `sendAutomaticallyWhen` when using `needsApproval` tools. Test the full approve/deny flow end-to-end.
**Warning signs:** User clicks "Approve" but nothing happens.

### Pitfall 5: Batch Tools Exceeding Token Limits
**What goes wrong:** A batch create of 10+ stories generates a huge tool result that exceeds output token limits or bloats the context.
**Why it happens:** Each created entity returns its full details in the tool result.
**How to avoid:** Batch tool results should return summary confirmations only: `{ created: 5, stories: [{ id, displayId, title }] }`. Full details available via `get_story`.
**Warning signs:** Token costs spike, model starts truncating responses.

### Pitfall 6: convertToModelMessages and Tool Call History
**What goes wrong:** `convertToModelMessages` may not correctly handle tool approval parts if the message format is unexpected.
**Why it happens:** The conversion from UIMessage (with `parts`) to ModelMessage (with `content`) needs to preserve tool-approval-request and tool-approval-response parts.
**How to avoid:** Let the AI SDK handle this natively. Do not manually transform tool-related parts. Test that approval round-trips work correctly.
**Warning signs:** Model receives garbled tool history, generates invalid tool calls.

### Pitfall 7: Race Condition on SWR Revalidation
**What goes wrong:** Context panel shows stale data because SWR revalidation happens before the database write commits.
**Why it happens:** Tool execute runs in streaming context. The mutation may not be committed when the client receives the tool result and triggers SWR refetch.
**How to avoid:** SWR's existing `refreshInterval` polling (if in use) handles eventual consistency. For instant updates, add a small delay or use SWR `mutate()` with optimistic data.
**Warning signs:** Context panel briefly shows old data after a tool mutation.

## Code Examples

### Chat Route Upgrade (Verified Pattern)
```typescript
// Source: existing src/app/api/chat/route.ts + AI SDK docs
import { streamText, tool, convertToModelMessages, stepCountIs } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { buildToolsForRole } from "@/lib/chat-tools"
import { getCurrentMember } from "@/lib/auth"
import { buildAgenticSystemPrompt } from "@/lib/chat-tools/system-prompt"

export async function POST(request: Request) {
  // ... existing auth and conversation loading ...

  const member = await getCurrentMember(projectId)

  // Build tools based on role (D-08)
  const tools = buildToolsForRole(member.role, projectId, member.id)

  // Build lean system prompt with project orientation (D-15)
  const systemPrompt = await buildAgenticSystemPrompt(projectId)

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(15), // D-16: bounded tool chains
    onFinish: async ({ text, totalUsage, toolCalls, steps }) => {
      // Persist message + audit log (D-19)
      // ...
    },
  })

  return result.toUIMessageStreamResponse()
}
```

### Tool Registry Pattern
```typescript
// Source: AI SDK docs pattern applied to project structure
import type { ProjectRole } from "@/generated/prisma"

export function buildToolsForRole(
  role: ProjectRole,
  projectId: string,
  memberId: string
) {
  // Everyone gets read tools
  const tools = {
    ...queryStoriesTools(projectId),
    ...queryEpicsTools(projectId),
    ...queryQuestionsTools(projectId),
    // ... all query tools
  }

  // Write tools gated by role
  if (["SOLUTION_ARCHITECT", "PM", "BA"].includes(role)) {
    Object.assign(tools, {
      ...mutateQuestionsTools(projectId, memberId),
      ...mutateDecisionsTools(projectId, memberId),
      ...mutateRequirementsTools(projectId, memberId),
      ...mutateRisksTools(projectId, memberId),
    })
  }

  if (["SOLUTION_ARCHITECT", "PM", "BA", "DEVELOPER"].includes(role)) {
    Object.assign(tools, mutateStoriesTools(projectId, memberId, role))
  }

  if (role === "PM") {
    Object.assign(tools, mutateSprintsTools(projectId, memberId))
  }

  // Delete tools - only for roles that have delete permissions
  if (["SOLUTION_ARCHITECT", "PM"].includes(role)) {
    Object.assign(tools, deleteTools(projectId, memberId, role))
  }

  return tools
}
```

### Delete Confirmation Card Component
```typescript
// Renders when part.state === "approval-requested" for delete tools
interface DeleteConfirmationProps {
  entityType: string
  entityId: string
  reason: string
  approvalId: string
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}

function DeleteConfirmation({ entityType, entityId, reason, approvalId, onApprove, onDeny }: DeleteConfirmationProps) {
  return (
    <div className="border-destructive/50 bg-destructive/5 rounded-lg border p-4">
      <h4 className="text-destructive text-[14px] font-semibold">Confirm Deletion</h4>
      <p className="text-[13px] mt-1">Delete {entityType} {entityId}?</p>
      <p className="text-muted-foreground text-[13px] mt-1">Reason: {reason}</p>
      <div className="flex gap-2 mt-3">
        <Button variant="destructive" size="sm" onClick={() => onApprove(approvalId)}>Delete</Button>
        <Button variant="outline" size="sm" onClick={() => onDeny(approvalId)}>Cancel</Button>
      </div>
    </div>
  )
}
```

### Audit Logging Helper (D-19)
```typescript
// Log tool calls to SessionLog
export async function logToolCall(params: {
  projectId: string
  memberId: string
  toolName: string
  toolInput: Record<string, unknown>
  toolResult: unknown
  conversationId: string
  tokenUsage?: { input: number; output: number }
}) {
  // Use existing SessionLog model -- extend entitiesCreated/entitiesModified JSON fields
  // OR create a lightweight tool_call_log within the ChatMessage.toolCalls JSON
  // Recommendation: Use ChatMessage.toolCalls (already stores tool calls) + add result data
}
```

## System Prompt Strategy (D-15 Recommendation)

**Recommended: Lean prompt + tool descriptions approach.**

The system prompt should be ~500-800 tokens containing:
1. Role definition ("You are an AI project assistant for a Salesforce consulting project")
2. Project orientation (name, client, phase, engagement type -- from existing `getProjectSummary`)
3. Available capabilities summary ("You can query, create, update, and delete project entities")
4. Behavioral rules (concise list: use tools not text for data, confirm destructive actions, stay within project scope)

The tool descriptions themselves teach the AI the data model (per D-01). The AI discovers available data by calling query tools rather than receiving a dump in the system prompt. This saves ~2,000+ tokens compared to the current `assembleGeneralChatContext` approach.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `maxToolRoundtrips` | `stopWhen: stepCountIs(N)` | AI SDK v5+ | New API for controlling multi-step loops |
| Client-side confirmation dialogs | `needsApproval` + `addToolApprovalResponse` | AI SDK v6 | Native SDK support for approval flows |
| Manual tool result passing | Automatic tool result in message history | AI SDK v6 | D-18 works out of the box |
| `maxSteps` (number) | `stopWhen` (composable conditions) | AI SDK v6 | More flexible stopping conditions |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ~60 total tools is manageable within Claude Sonnet's context window | Entity-to-Tool Mapping | If too many tools, may need `prepareStep` to dynamically filter tools per step. Token cost would be higher than expected. |
| A2 | Role permission matrix is accurate based on observed server actions | Role-Based Tool Gating Matrix | Wrong role gates = security issue. Must verify each role check during implementation against actual server action code. |
| A3 | Knowledge Articles, Org Components, Business Processes, Documents are read-only via chat | Entity-to-Tool Mapping | If users expect write access, would need additional tools. Low risk -- these are workflow-driven entities. |
| A4 | `needsApproval` works correctly with `stopWhen` in multi-step flows | Architecture Patterns | If approval interrupts the step chain prematurely, the "create epic then generate stories then delete draft" flow would break mid-chain. Need to test. |
| A5 | Existing `ChatMessage.toolCalls` JSON field can store the expanded tool call data from agentic sessions | Audit | If the JSON field size is insufficient for 15 tool calls per turn, may need a separate audit table. |

## Open Questions (RESOLVED)

1. **SessionLog vs ChatMessage for audit (D-19)** — RESOLVED: Use ChatMessage.toolCalls for per-call recording (already works via AI SDK). Create one SessionLog per conversation turn via `onFinish` for aggregate tracking. Plan 01 implements this.

2. **SessionLogTaskType enum for agentic chat** — RESOLVED: Add `AGENTIC_CHAT` to the SessionLogTaskType enum in prisma/schema.prisma. Plan 01 Task 1 handles this.

3. **Tool token budget** — RESOLVED: Build tools first, measure token count during execution. Optimize descriptions if over 4,000 tokens. Not a planning blocker — handled at implementation time.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (based on existing tests/ directory) |
| Config file | Check for vitest.config.ts or jest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req | Behavior | Test Type | Automated Command |
|-----|----------|-----------|-------------------|
| D-01 | Tool-per-entity definitions exist for all entities | unit | Verify tool registry exports all expected tool names |
| D-02 | CRUD operations work for all entities | integration | Test each tool execute handler with mock data |
| D-05 | Delete tools have needsApproval: true | unit | Assert needsApproval property on all delete tools |
| D-08 | Role gating filters tools correctly | unit | Test buildToolsForRole for each role returns correct tool set |
| D-16 | stopWhen limits tool calls to 15 | unit | Verify streamText config includes stepCountIs(15) |
| D-19 | Tool calls are logged | integration | Verify ChatMessage.toolCalls contains tool call data after execution |

### Wave 0 Gaps
- [ ] Test file for tool registry: `tests/lib/chat-tools/build-tools.test.ts`
- [ ] Test file for tool execute handlers: `tests/lib/chat-tools/tool-execute.test.ts`
- [ ] Test file for role gating: `tests/lib/chat-tools/role-gating.test.ts`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Clerk auth check in chat route (existing) |
| V3 Session Management | Yes | Clerk session (existing) |
| V4 Access Control | Yes | `getCurrentMember` + role-based tool filtering (D-08) |
| V5 Input Validation | Yes | Zod schemas on all tool inputs + `sanitizeToolInput` |
| V6 Cryptography | No | No new crypto needed |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection via tool inputs | Tampering | `sanitizeToolInput` (DOMPurify) on all string inputs before DB write |
| AI-directed unauthorized deletion | Elevation of Privilege | `needsApproval: true` structural gate + role check in execute handler |
| Cross-project data access via tool | Information Disclosure | `scopedPrisma(projectId)` on all queries |
| Tool call forgery | Spoofing | AI SDK validates tool calls against schema; server-side execution only |
| Runaway tool loops | Denial of Service | `stopWhen: stepCountIs(15)` hard limit |

## Sources

### Primary (HIGH confidence)
- node_modules/ai/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx -- tool(), execute, needsApproval, stopWhen, inputSchema
- node_modules/ai/docs/04-ai-sdk-ui/03-chatbot-tool-usage.mdx -- useChat tool approval flow, addToolApprovalResponse, sendAutomaticallyWhen
- node_modules/ai/docs/03-agents/02-building-agents.mdx -- ToolLoopAgent, stepCountIs, loop control
- node_modules/ai/docs/03-agents/04-loop-control.mdx -- stopWhen conditions
- Existing codebase: src/app/api/chat/route.ts, src/lib/agent-harness/tools/, src/actions/*, src/lib/project-scope.ts, src/lib/auth.ts

### Secondary (MEDIUM confidence)
- Role permission matrix derived from server action code patterns (not exhaustively verified for all entities)

### Tertiary (LOW confidence)
- Token budget estimates for ~60 tools (needs measurement during implementation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use
- Architecture: HIGH - patterns verified against AI SDK v6 bundled docs
- Pitfalls: HIGH - derived from SDK docs and codebase analysis
- Role gating: MEDIUM - inferred from observed server actions, needs per-entity verification

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable -- AI SDK v6 is current, codebase is known)
