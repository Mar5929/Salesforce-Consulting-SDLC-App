---
phase: 11
plan: "06"
subsystem: chat-ui
tags: [tool-cards, agentic-chat, ui-components, delete-gate]
dependency_graph:
  requires:
    - 11-01-PLAN.md
    - 11-05-PLAN.md
  provides:
    - Tool result card components for chat message list
    - ToolPartRenderer dispatcher for all agentic tool invocations
    - DeleteConfirmationCard D-05 structural gate
  affects:
    - src/components/chat/message-list.tsx
tech_stack:
  added: []
  patterns:
    - ToolResultCard generic wrapper pattern (bg-muted/50, border, rounded-lg, p-4)
    - ToolPartRenderer switch dispatcher routing on toolName pattern and state
    - Delete gate pattern: approval-requested state -> DeleteConfirmationCard -> addToolApprovalResponse
key_files:
  created:
    - src/components/chat/tool-cards/tool-result-card.tsx
    - src/components/chat/tool-cards/tool-loading-indicator.tsx
    - src/components/chat/tool-cards/tool-error-card.tsx
    - src/components/chat/tool-cards/entity-query-card.tsx
    - src/components/chat/tool-cards/entity-detail-card.tsx
    - src/components/chat/tool-cards/mutation-confirm-card.tsx
    - src/components/chat/tool-cards/delete-confirmation-card.tsx
    - src/components/chat/tool-part-renderer.tsx
    - tests/components/chat/tool-cards.test.ts
  modified:
    - src/components/chat/message-list.tsx
decisions:
  - "ToolLoadingIndicator imports getToolDisplayName from tool-part-renderer to avoid circular dependency; all cards import from tool-result-card which has no upward imports"
  - "EntityRow interface exported from entity-query-card.tsx so tool-part-renderer can cast safely without Record<string, unknown> incompatibility"
  - "message-list.tsx filters by toolName exclusion (not inclusion) so any new tools added to the agentic layer automatically route through ToolPartRenderer without code changes"
  - "vitest environment is node with no @testing-library/react — tests cover getToolDisplayName pure function only; component rendering verified by TypeScript compilation"
metrics:
  duration: "8m"
  completed: "2026-04-08"
  tasks: 2
  files: 10
---

# Phase 11 Plan 06: Tool Result Card Components Summary

**One-liner:** Seven tool result card components plus ToolPartRenderer dispatcher wired into message-list.tsx, implementing the D-05 delete confirmation gate and full agentic tool result rendering pipeline.

## What Was Built

All 7 tool card UI components and the ToolPartRenderer switch dispatcher that routes AI SDK tool invocation parts to the correct card variant based on toolName pattern and state. The components are wired into `message-list.tsx` for all non-session tool invocations.

### Components Created

| Component | Purpose |
|-----------|---------|
| `ToolResultCard` | Generic card wrapper — bg-muted/50, border, rounded-lg, p-4 |
| `ToolLoadingIndicator` | Inline spinner with aria-live="polite" for partial-call/call states |
| `ToolErrorCard` | bg-destructive/5 card with AlertCircle icon for error results |
| `EntityQueryCard` | List of entity rows with display ID, title, status badge, max 10 rows |
| `EntityDetailCard` | Single entity field display for get_ tool results |
| `MutationConfirmCard` | Created/updated/deleted confirmation with Check/Pencil/Trash2 icon |
| `DeleteConfirmationCard` | D-05 structural gate — role="alertdialog", Keep It + Confirm Delete buttons |

### ToolPartRenderer Dispatch Logic

| State / Pattern | Card Rendered |
|-----------------|---------------|
| partial-call or call (no result) | ToolLoadingIndicator |
| approval-requested | DeleteConfirmationCard |
| result + success === false | ToolErrorCard |
| delete_ + success === true | MutationConfirmCard (action="deleted") |
| create_ + success === true | MutationConfirmCard (action="created") |
| update_ + success === true | MutationConfirmCard (action="updated") |
| query_ + success === true | EntityQueryCard |
| get_ + success === true | EntityDetailCard |

### message-list.tsx Extension

Added `addToolApprovalResponse` prop, then after existing StoryDraftCards/EnrichmentSuggestionCards blocks, renders all tool parts where `toolName !== "create_story_draft"` and `toolName !== "create_enrichment_suggestion"` via ToolPartRenderer with `space-y-2` gap.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | f95e5c2 | Add tool card components and ToolPartRenderer dispatcher (9 files) |
| Task 2 | 7d89402 | Wire ToolPartRenderer into message-list for all tool invocations (1 file) |

## Test Results

```
✓ getToolDisplayName > maps query_stories to Searching stories
✓ getToolDisplayName > maps get_story to Loading story details
✓ getToolDisplayName > maps create_epic to Creating epic
✓ getToolDisplayName > maps update_question to Updating question
✓ getToolDisplayName > maps delete_sprint to Preparing to delete sprint
✓ getToolDisplayName > maps create_stories to Creating multiple stories

Test Files  1 passed (1)
Tests  6 passed (6)
```

TypeScript: `npx tsc --noEmit` — zero errors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] EntityRow type incompatibility between entity-query-card and tool-part-renderer**
- **Found during:** Task 1 TypeScript check
- **Issue:** `Record<string, unknown>[]` not assignable to `EntityRow[]` because `id` is required in EntityRow
- **Fix:** Exported `EntityRow` interface from entity-query-card.tsx and imported it into tool-part-renderer.tsx for the cast
- **Files modified:** src/components/chat/tool-cards/entity-query-card.tsx, src/components/chat/tool-part-renderer.tsx

### Minor Additions

- Added `Trash2` icon to `MutationConfirmCard` for the `deleted` action (plan only specified Check and Pencil for create/update — deleted action used in ToolPartRenderer delete confirmed flow needed an icon)
- `getEntityTypePlural` guards against double-pluralization for words already ending in "ies" (e.g. "stories" from `query_stories`)

## Known Stubs

None — all cards are fully implemented and wire directly to the AI SDK approval response callback. No hardcoded placeholder data.

## Threat Surface

No new threat surface beyond what was analyzed in the plan's threat model. T-11-22 (DeleteConfirmationCard elevation of privilege) is mitigated: the card calls `addToolApprovalResponse` (SDK structural gate) — the execute handler re-checks role before performing deletion.

## Self-Check: PASSED

Files exist:
- src/components/chat/tool-cards/tool-result-card.tsx — FOUND
- src/components/chat/tool-cards/tool-loading-indicator.tsx — FOUND
- src/components/chat/tool-cards/tool-error-card.tsx — FOUND
- src/components/chat/tool-cards/entity-query-card.tsx — FOUND
- src/components/chat/tool-cards/entity-detail-card.tsx — FOUND
- src/components/chat/tool-cards/mutation-confirm-card.tsx — FOUND
- src/components/chat/tool-cards/delete-confirmation-card.tsx — FOUND
- src/components/chat/tool-part-renderer.tsx — FOUND
- tests/components/chat/tool-cards.test.ts — FOUND

Commits exist:
- f95e5c2 — FOUND
- 7d89402 — FOUND
