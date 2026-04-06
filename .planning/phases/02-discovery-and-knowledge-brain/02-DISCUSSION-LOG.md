# Phase 2: Discovery and Knowledge Brain - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 02-discovery-and-knowledge-brain
**Areas discussed:** Question System UX, Transcript Processing Flow, Chat Interface Design, Knowledge & Search Experience

---

## Question System UX

### Question Creation Method

| Option | Description | Selected |
|--------|-------------|----------|
| Inline quick-add | Floating action button or Cmd+K shortcut opens compact inline form. Fast, stays in context. | ✓ |
| Dedicated form page | Full-page form with all fields visible. More structured but takes you out of context. | |
| Contextual creation | Right-click or action menu on entities to create linked question. Auto-populates scope. | ✓ |

**User's choice:** Both inline quick-add AND contextual creation from entities
**Notes:** User wanted both approaches combined for maximum flexibility.

### Lifecycle Visualization

| Option | Description | Selected |
|--------|-------------|----------|
| Filtered table | Dense table with status badges, sortable/filterable columns. Linear list view style. | |
| Kanban board | Columns per status, drag to advance. Visual and scannable. | |
| Both views | Toggle between kanban and table. Users choose preferred view. | ✓ |

**User's choice:** Both views with toggle
**Notes:** None

### AI Impact Assessment Display

| Option | Description | Selected |
|--------|-------------|----------|
| Inline expansion | Impact assessment expands below answer as collapsible section with badges. | ✓ |
| Side panel | Clicking 'View Impact' opens a slide-over panel. | |
| Toast + dashboard | Brief toast notification, details on dashboard. | |

**User's choice:** Claude's recommendation (inline expansion)
**Notes:** User deferred to Claude's recommendation.

### SA Review Flagging

| Option | Description | Selected |
|--------|-------------|----------|
| Both | Inline flag on question detail + filtered 'Needs Review' view for batch processing. | ✓ |
| Review queue only | Dedicated 'Needs Review' tab. SA works through queue. | |
| Inline flag only | Yellow warning banner on question detail. SA approves/rejects directly. | |

**User's choice:** Both (Recommended)
**Notes:** None

## Transcript Processing Flow

**User's choice:** Claude's recommendation for all decisions
**Notes:** User asked Claude to use recommended defaults for all remaining areas.

Recommendations applied:
- Dedicated transcript page with drag-and-drop upload
- Multi-step processing as chat session with inline confirmation
- Extracted items as grouped cards with accept/reject/edit
- Deduplication shown inline with merge/skip options

## Chat Interface Design

**User's choice:** Claude's recommendation for all decisions
**Notes:** User asked Claude to use recommended defaults for all remaining areas.

Recommendations applied:
- General chat in sidebar + task-specific sessions from context
- Streaming via Vercel AI SDK useChat hook
- Split layout (messages + context panel) for task sessions, full-width for general chat
- Token/cost as subtle per-message footer, session total in header

## Knowledge & Search Experience

**User's choice:** Claude's recommendation for all decisions
**Notes:** User asked Claude to use recommended defaults for all remaining areas.

Recommendations applied:
- Knowledge section in sidebar with staleness badges
- Unified Cmd+K search across all three layers
- Article detail with version history and source references
- Inngest-triggered embedding generation and article refresh

---

## Claude's Discretion

- Cmd+K command palette implementation details
- Kanban drag interaction specifics
- Transcript processing checkpoint granularity
- Chat message rendering details
- Knowledge article card design and density
- Search result ranking weights
- Dashboard layout specifics
- Notification dropdown styling
- Loading states, error boundaries, empty states
- Token budget allocation across agent harness task types

## Deferred Ideas

None — discussion stayed within phase scope.
