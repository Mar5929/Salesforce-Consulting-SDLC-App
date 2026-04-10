# V2 Roadmap Assessment

**Date:** 2026-04-08
**Items Assessed:** 22
**Codebase State at Assessment:** Phases 1–9 complete, Phase 10 at 4/5 plans executed (known gaps: isArchived schema push pending, enrichment session auto-complete not wired), Phase 11 at 4/6 plans executed (delete tools and one plan not executed), Phase 12 not started.

---

## Summary

- **Ready (clean extension):** 8 items — 1.4, 2.1, 2.3, 3.2, 3.4, 3.5, 3.6, 5.4
- **Needs Prep (V1 changes first):** 9 items — 1.1 (trigger-based), 1.3, 2.2, 3.1, 3.3, 4.1, 4.3, 5.1, 5.2, 5.5, 6.2
- **Major Work (significant V1 refactor or zero foundation):** 5 items — 1.2, 3.7 (actually Ready), 4.2, 5.3
- **PRD V1 scope but deferred / V1 implementation gaps:** 3 items — 5.5 (QA chat RBAC inconsistency), 6.1 (no upload validation despite schema support), Activity Feed data capture is working

---

## Category Assessments

---

### 1. Infrastructure and Scaling

---

### V2-INFRA-001: Background Job Infrastructure Upgrade
- **V2 Roadmap Section:** 1.1
- **V1 Preparatory Code:** 15 Inngest functions in `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/` — all cleanly modular with named events and step boundaries. The Inngest client is centralized. Scaling trigger indicators (failure rate, sync duration, event volume) are all observable from existing infrastructure.
- **V1 Refactoring Required:** None. The Inngest functions would be migrated to BullMQ workers at a Railway/Fly.io service. Each function can be migrated independently. No application code changes required — the event-emit pattern is the same.
- **Clean Extension Point:** Yes — functions are discrete, events are named, and the Inngest event bus can be replaced function-by-function.
- **PRD V1 Scope Check:** PRD Section 5.1 explicitly documents the V1 Inngest approach and references V2-ROADMAP.md for BullMQ scaling. Properly deferred.
- **Readiness:** Ready (clean extension, trigger-based)
- **Priority Recommendation:** Low — activate when documented indicators are hit (5% failure rate, 3-min sync times, 10+ concurrent projects firing events simultaneously).
- **Estimated Scope:** L (infrastructure provisioning and migration ops, not code rewrite)

---

### V2-INFRA-002: Real-Time Collaborative Editing
- **V2 Roadmap Section:** 1.2
- **V1 Preparatory Code:** `VersionHistory` model at `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/prisma/schema.prisma` (line 1193) is written by `src/actions/stories.ts` and `src/actions/questions.ts`. `StatusTransition` is written by `src/lib/inngest/functions/audit-log.ts`. The optimistic concurrency design is implemented — `VersionHistory` captures previous state snapshots. This is the V1 conflict resolution foundation.
- **V1 Refactoring Required:** Significant. Adding OT/CRDT real-time editing would replace the optimistic concurrency conflict-resolution UI across all entity forms (stories, questions, epics). The `VersionHistory` model remains as audit trail but the concurrency mechanism changes entirely. This touches every entity edit form.
- **Clean Extension Point:** Partial — the data model supports it, but the UI and concurrency mechanism need replacement, not addition.
- **PRD V1 Scope Check:** PRD Section 25.2 explicitly states "No real-time collaborative editing" as a V1 architectural decision. PRD Section 19.2 describes optimistic concurrency control as the V1 approach.
- **Readiness:** Major Work (replacing concurrency UI across all entity forms)
- **Priority Recommendation:** Low — requires user-reported friction to justify investment. Optimistic concurrency with conflict diffs handles multi-user editing for a small consulting team.
- **Estimated Scope:** XL (OT/CRDT infrastructure + form rewrites across all entity types)

---

### V2-INFRA-003: Real-Time Update Mechanism
- **V2 Roadmap Section:** 1.3
- **V1 Preparatory Code:** SWR `refreshInterval` polling confirmed in 8 files: `src/components/notifications/notification-bell.tsx`, `src/app/(dashboard)/projects/[projectId]/pm-dashboard/pm-dashboard-client.tsx`, `src/app/(dashboard)/projects/[projectId]/pm-dashboard/page.tsx`, `src/components/documents/generation-progress.tsx`, `src/lib/inngest/functions/pm-dashboard-synthesis.ts`, `src/app/api/transcripts/[transcriptId]/messages/route.ts`, `src/app/(dashboard)/projects/[projectId]/transcripts/[transcriptId]/transcript-session-client.tsx`, `src/actions/notifications.ts`. No WebSocket or SSE code exists anywhere in `src/`.
- **V1 Refactoring Required:** Adding SSE or WebSocket requires a real-time server (Pusher, Ably, or Vercel Edge SSE). Each polling component would be migrated channel-by-channel. The polling components' data-fetching logic is reusable.
- **Clean Extension Point:** Partial — SWR hooks are well-localized. SSE is additive for new channels; replacing polling is a component-by-component migration.
- **PRD V1 Scope Check:** PRD Section 25.1 lists "WebSocket or polling" as undecided for V1 and acknowledges polling was chosen. Properly deferred.
- **Readiness:** Needs Prep (requires adding real-time infrastructure before replacing polling components)
- **Priority Recommendation:** Medium — multi-user dashboard staleness is a real UX problem once 3+ team members are on the same project simultaneously.
- **Estimated Scope:** M (SSE endpoint + component migration; no data model changes)

---

### V2-INFRA-004: Event-Driven Org Sync (Webhooks)
- **V2 Roadmap Section:** 1.4
- **V1 Preparatory Code:** `src/lib/inngest/functions/metadata-sync.ts` is the sync function. `OrgSyncRun` model in `prisma/schema.prisma` tracks history. `sfOrgSyncIntervalHours` on `Project` is configurable. A manual trigger exists in the UI. The Inngest event `ORG_SYNC_REQUESTED` can be fired by a webhook receiver without any changes to the sync function.
- **V1 Refactoring Required:** None to the sync function — it is already trigger-agnostic. V2 adds a Salesforce Platform Event listener or outbound message webhook receiver endpoint that fires `ORG_SYNC_REQUESTED`.
- **Clean Extension Point:** Yes — the sync function is already trigger-agnostic. Adding a webhook receiver is purely additive.
- **PRD V1 Scope Check:** PRD Section 27.3 explicitly accepts the stale context gap for V1 and references V2-ROADMAP.md Section 1.4.
- **Readiness:** Ready (clean extension)
- **Priority Recommendation:** Medium — relevant once projects are in active build phase with frequent metadata deploys. Low impact during discovery phase.
- **Estimated Scope:** S (webhook receiver endpoint + Salesforce Platform Event setup; sync function unchanged)

---

### 2. AI and Knowledge System

---

### V2-AI-001: Embedding-Enhanced Duplicate Detection
- **V2 Roadmap Section:** 2.1
- **V1 Preparatory Code:** `src/lib/agent-harness/tools/create-question.ts` implements substring and overlap dedup (lines 84–123) — exact match and >80% substring overlap. `KnowledgeArticle` and `OrgComponent` already have `embedding vector(1024)` columns in `prisma/schema.prisma`. `src/lib/search/global-search.ts` implements pgvector cosine similarity (`1 - (embedding <=> ...)::vector`). `src/lib/inngest/functions/embedding-batch.ts` handles Voyage AI batch embedding. The semantic search plumbing is fully operational on other entities.
- **V1 Refactoring Required:** Two additive schema changes: add `embedding vector(1024)` and `embeddingStatus EmbeddingStatus` columns to the `Question` model, matching the existing pattern on `KnowledgeArticle`. Update `create-question.ts` to perform cosine similarity lookup as a supplemental check.
- **Clean Extension Point:** Yes — the embedding infrastructure, Voyage AI client, and pgvector query pattern are all reusable. This is copy-and-extend from `KnowledgeArticle`.
- **PRD V1 Scope Check:** Tech Spec Section 6.4, design decision #4 explicitly defers this. Properly deferred.
- **Readiness:** Ready (clean extension)
- **Priority Recommendation:** Medium — false positives (blocking real questions from being created) are higher cost than missed duplicates. Prioritize when users report duplicate question noise.
- **Estimated Scope:** S (schema migration + update `create-question.ts` + embed questions on creation via existing batch infrastructure)

---

### V2-AI-002: AI Provider Abstraction Layer
- **V2 Roadmap Section:** 2.2
- **V1 Preparatory Code:** `src/lib/agent-harness/engine.ts` uses `@anthropic-ai/sdk` directly with a module-scoped singleton (`getAnthropicClient()`). `src/app/api/chat/route.ts` uses `@ai-sdk/anthropic` via Vercel AI SDK. These are two separate integration paths within V1. Tool definitions throughout `src/lib/agent-harness/tasks/` and `src/lib/chat-tools/` use Anthropic-specific `input_schema` format. `src/lib/config/ai-pricing.ts` has a pricing config TypeScript object.
- **V1 Refactoring Required:** Tool definitions use Anthropic-specific schemas throughout the codebase and would need a translation layer. `engine.ts` needs a provider interface wrapping `anthropic.messages.create()`. The two existing integration paths (direct SDK + AI SDK) would both need abstracting.
- **Clean Extension Point:** Partial — the agent harness is centralized (one engine file), making the abstraction surface small. But the tool definition schema format is Anthropic-specific throughout.
- **PRD V1 Scope Check:** PRD Section 3.3 explicitly states "no provider-agnostic abstraction layer is built in V1 but the module is cleanly separated." PRD Section 27.4 defers.
- **Readiness:** Needs Prep (need to audit all tool definition schemas and standardize format before abstracting)
- **Priority Recommendation:** Low — only justified when a specific second provider requirement emerges. Premature abstraction adds complexity without benefit.
- **Estimated Scope:** L (interface design + tool schema translation layer + provider-specific adapters for both engine and chat route paths)

---

### V2-AI-003: AI Output Quality Benchmarking
- **V2 Roadmap Section:** 2.3
- **V1 Preparatory Code:** `SessionLog` model tracks `inputTokens`, `outputTokens`, `taskType`, `status`, `summary`, `entitiesCreated`, `entitiesModified` — the complete AI usage audit trail. `KnowledgeArticle` has `thumbsUpCount`, `thumbsDownCount`, `effectivenessScore`, `useCount` — quality signal fields already on the model. The PM dashboard (`src/lib/inngest/functions/pm-dashboard-synthesis.ts`) already surfaces AI usage metrics. The data infrastructure for measurement is solid.
- **V1 Refactoring Required:** None. Quality benchmarking is entirely additive — define metrics, instrument collection (most data already in `SessionLog`), build reporting views.
- **Clean Extension Point:** Yes — `SessionLog` and `KnowledgeArticle` quality fields are the right foundation.
- **PRD V1 Scope Check:** PRD Section 27.8 explicitly defers. Properly deferred.
- **Readiness:** Ready (clean extension)
- **Priority Recommendation:** Low — useful for ROI demonstration but not an operational necessity for V1 teams.
- **Estimated Scope:** M (metric definition + measurement collection scripts + reporting dashboard tab)

---

### 3. User Experience

---

### V2-UX-001: Firm Administrator UI
- **V2 Roadmap Section:** 3.1
- **V1 Preparatory Code:** `src/lib/documents/branding.ts` — `BRANDING_CONFIG` constant with comment "V2 will support per-firm customization via admin UI." Agent harness prompt templates with firm rules are TypeScript strings in `src/lib/agent-harness/tasks/`. Rate limits are hardcoded in `src/lib/api-keys/rate-limit.ts`. No `FirmSettings` database model exists in `prisma/schema.prisma`. No admin route exists under `src/app/`.
- **V1 Refactoring Required:** A `FirmSettings` or `FirmConfig` database model needs creating to store settings persistently. A migration to move hardcoded constants into that table. A new admin route (`/admin/` or `/settings/firm/`). Clerk would need a `FIRM_ADMIN` concept that spans projects (currently, roles are per-project only).
- **Clean Extension Point:** Partial — the constants are well-organized but scattered across multiple files (`branding.ts`, agent harness task files, rate limit config). A single firm config module does not exist yet.
- **PRD V1 Scope Check:** PRD Section 4.6 defines the Firm Administrator persona and explicitly states "V1, this is the application owner — firm-level settings configured directly in codebase and database." PRD Section 27.5 defers.
- **Readiness:** Needs Prep (need a firm settings data model before building the UI; constants need consolidation first)
- **Priority Recommendation:** Medium — critical when more than one person needs to manage firm-level settings. Not urgent for solo-admin operation.
- **Estimated Scope:** M (schema + migration of hardcoded constants into DB + admin UI + firm-level RBAC extension)

---

### V2-UX-002: Project Home Page
- **V2 Roadmap Section:** 3.2
- **V1 Preparatory Code:** `src/app/(dashboard)/projects/[projectId]/page.tsx` exists as a direct stub with placeholder comment: "Discovery dashboard and project content will appear here in future phases." Currently renders four stat cards (client, engagement type, current phase, team count) and a placeholder card. The discovery dashboard data, sprint data, notifications, and session logs are all queryable from this route.
- **V1 Refactoring Required:** None — this is the exact route that the Project Home Page will fill. Adding content is purely additive at an existing route.
- **Clean Extension Point:** Yes — the route exists as a stub. The data sources (briefing cache, sprint summary, notifications, recent activity) are all available.
- **PRD V1 Scope Check:** PRD Section 27.14 explicitly defers this to V2.
- **Readiness:** Ready (clean extension)
- **Priority Recommendation:** High — current state is nearly empty. Users navigating to a project see almost nothing useful. This is high-impact, low-effort.
- **Estimated Scope:** S (compose existing data sources into a dashboard card layout at an existing stub route)

---

### V2-UX-003: Mobile / Responsive Access
- **V2 Roadmap Section:** 3.3
- **V1 Preparatory Code:** Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) are present in 10+ component files (confirmed: `src/components/work/story-form.tsx`, `src/components/questions/question-form.tsx`, `src/components/work/epic-form.tsx`, `src/components/roadmap/milestone-story-linker.tsx`, `src/components/roadmap/milestone-ai-summary.tsx`, and others). The `src/app/(dashboard)/projects/[projectId]/page.tsx` project home page uses `sm:grid-cols-2 lg:grid-cols-4`. However, the sidebar navigation, chat layout with 320px fixed sidebar, kanban views, data tables with many columns, and sprint planning split-view are desktop-first without responsive breakpoints.
- **V1 Refactoring Required:** Significant UI work for key views: the chat sidebar layout, all kanban boards, data tables with 6+ columns, sprint planning split-view. Some components already have responsive classes; others assume desktop widths. This is pure UI work — no schema or API changes.
- **Clean Extension Point:** Partial — Tailwind is in use and responsive utilities work. The constraint is that key layout components assume desktop widths.
- **PRD V1 Scope Check:** PRD Section 27.10 explicitly defers mobile access.
- **Readiness:** Needs Prep (layout audit required before systematic responsive pass)
- **Priority Recommendation:** Medium — relevant when consultants need quick mobile access to dashboards or notifications. Not critical for primary workflows requiring keyboard input.
- **Estimated Scope:** L (systematic layout audit + responsive passes across all major page templates and navigation components)

---

### V2-UX-004: Data Export
- **V2 Roadmap Section:** 3.4
- **V1 Preparatory Code:** Document generation infrastructure at `src/lib/documents/renderers/` (docx, pptx, pdf renderers) is operational. S3 storage is operational. The REST API at `src/app/api/v1/` demonstrates JSON serialization of all major entities. `src/lib/agent-harness/tasks/document-content.ts` has 12 query types assembling project data. No dedicated export endpoint or UI exists.
- **V1 Refactoring Required:** None to existing code. A new export server action or API route queries existing Prisma models and serializes to JSON/CSV. The existing docx renderer could be extended for a "full project export" document type.
- **Clean Extension Point:** Yes — all data is in PostgreSQL, accessible via Prisma. Export is a new endpoint that composes existing queries.
- **PRD V1 Scope Check:** Gap analysis item #10. Not described as V1 scope in the PRD body.
- **Readiness:** Ready (clean extension)
- **Priority Recommendation:** Medium — important for project handoff and engagement-end deliverables. Not urgent during active use.
- **Estimated Scope:** M (export endpoint + format serializers + client-safe scrubbing logic + UI download trigger)

---

### V2-UX-005: Activity Feed / Change History UI
- **V2 Roadmap Section:** 3.5
- **V1 Preparatory Code:** `VersionHistory` model in `prisma/schema.prisma` (line 1193) is actively written by `src/actions/stories.ts` and `src/actions/questions.ts`. `StatusTransition` model is written by `src/lib/inngest/functions/audit-log.ts` (confirmed in 4 files). `SessionLog` records every AI interaction. `src/components/documents/version-history-table.tsx` exists but is scoped to documents only. The audit data infrastructure is substantially in place and being populated.
- **V1 Refactoring Required:** None to existing schema or actions. The activity feed UI is purely additive — a new component querying `VersionHistory`, `StatusTransition`, and `SessionLog` with a unified timeline view, filterable by entity and date.
- **Clean Extension Point:** Yes — three audit tables exist and are being populated. A timeline component merges and renders them.
- **PRD V1 Scope Check:** V2 roadmap correctly notes "SessionLog and VersionHistory entities exist in the schema but no dedicated UI." Data capture is V1; the UI is V2. Not a V1 gap.
- **Readiness:** Ready (clean extension)
- **Priority Recommendation:** Medium — "who changed this?" is a frequent question in multi-person teams once the app is in use. Data is already captured; this is a display problem only.
- **Estimated Scope:** S (unified timeline component querying existing audit tables, with per-entity and per-project scoping)

---

### V2-UX-006: Developer Context Package Web View
- **V2 Roadmap Section:** 3.6
- **V1 Preparatory Code:** `src/app/api/v1/context-package/route.ts` already assembles the complete context package — story details, business processes, knowledge articles, related decisions, sprint conflicts. The REST API response is structured JSON that maps directly to a web view. The entire data assembly is complete.
- **V1 Refactoring Required:** None — the context package assembly logic already exists. A web view route (e.g., `/projects/[projectId]/stories/[storyId]/context`) would call the same assembly function and render it as structured HTML.
- **Clean Extension Point:** Yes — the API and data assembly are complete. This is a new read-only route reusing an existing server-side function.
- **PRD V1 Scope Check:** Gap analysis item #8. Not described as V1 scope in the PRD body.
- **Readiness:** Ready (clean extension)
- **Priority Recommendation:** High — developers who want to review their context package in the browser, or who work without Claude Code temporarily, have no current option. The assembly work is already done.
- **Estimated Scope:** S (new read-only route + rendering the existing context package JSON as structured HTML within the app shell)

---

### V2-UX-007: Email and Push Notifications
- **V2 Roadmap Section:** 3.7
- **V1 Preparatory Code:** `Notification` model is fully implemented in `prisma/schema.prisma` with `NotificationType` (14 types), `NotificationPriority`, and `entityType/entityId` for source linking. `src/lib/inngest/functions/notification-dispatch.ts` fires notifications for all 14 event types. `src/components/notifications/notification-bell.tsx` uses SWR polling. No email service (Resend, SendGrid) or push service integration exists anywhere in `src/`.
- **V1 Refactoring Required:** None to existing code. `notification-dispatch.ts` is the single hook point. Adding email dispatch is one code block in that function plus a `NotificationPreference` model (additive schema change) for user opt-in preferences.
- **Clean Extension Point:** Yes — `notification-dispatch.ts` is a clean single hook point. Adding email dispatch is purely additive.
- **PRD V1 Scope Check:** PRD Section 17.8 explicitly states "V1 is in-app only. Email and push notifications are deferred to V2."
- **Readiness:** Ready (clean extension)
- **Priority Recommendation:** High — users missing sprint conflict or work-unblocked notifications because they are not in the app is a real operational problem for a team actively using the platform. Email for HIGH-priority events is a straightforward Resend integration.
- **Estimated Scope:** S (Resend integration + `NotificationPreference` schema addition + dispatch function extension + preferences UI in project settings)

---

### 4. Integrations

---

### V2-INT-001: Playwright Test Integration
- **V2 Roadmap Section:** 4.1
- **V1 Preparatory Code:** `TestCase` and `TestExecution` models are fully implemented in `prisma/schema.prisma`. `src/actions/` has test case and test execution CRUD (Phase 5 complete). `TestSource` enum has `AI_GENERATED` and `MANUAL` values. `TestExecution.result` has `PASS`, `FAIL`, `BLOCKED`. No Playwright report parsing code exists anywhere in `src/`.
- **V1 Refactoring Required:** Minor additive schema changes: add `PLAYWRIGHT_IMPORT` to the `TestSource` enum; add optional `playwrightTestId String?` field to `TestCase` for Playwright test ID mapping. These are additive. The import pipeline itself is new work.
- **Clean Extension Point:** Partial — the data model is right but needs small enum and field additions. The import pipeline is new work building on the existing CRUD.
- **PRD V1 Scope Check:** PRD Section 18.3 explicitly calls this a "future enhancement." PRD Section 27.6 defers.
- **Readiness:** Needs Prep (needs `TestSource` enum addition and `playwrightTestId` field before implementing the import pipeline)
- **Priority Recommendation:** Medium — relevant once the team's Playwright suite is large enough that manual result logging becomes a bottleneck. Not urgent for small test suites.
- **Estimated Scope:** M (schema migration + Playwright JSON report parser + auto-mapping logic + import UI + test execution auto-update)

---

### V2-INT-002: Git Repository Management
- **V2 Roadmap Section:** 4.2
- **V1 Preparatory Code:** No Git-related code exists anywhere in `src/`. The V1 architecture explicitly excludes Git involvement — PRD Section 25.2 states "No Git involvement from the web application." No `Repository` model in `prisma/schema.prisma`.
- **V1 Refactoring Required:** None to V1 code — this is entirely new functionality. Requires a new optional `Repository` model per project, a GitHub OAuth integration, and new project settings UI sections.
- **Clean Extension Point:** Partial — project settings infrastructure exists as an extension point for the UI, but the feature itself has zero foundation in V1.
- **PRD V1 Scope Check:** PRD Section 27.12 explicitly defers. Properly deferred.
- **Readiness:** Major Work (no foundation; new model, new GitHub API integration, new settings UI)
- **Priority Recommendation:** Low — repo setup automation is a convenience, not a capability gap. Teams are managing repos independently.
- **Estimated Scope:** M (GitHub OAuth + repo model + API client + settings UI — scoped but has zero V1 foundation)

---

### V2-INT-003: Bidirectional Jira Sync
- **V2 Roadmap Section:** 4.3
- **V1 Preparatory Code:** `src/lib/inngest/functions/jira-sync.ts` implements one-directional push. `JiraConfig` and `JiraSyncRecord` models are in `prisma/schema.prisma`. The Jira Cloud REST API client is implemented. `JiraSyncRecord` has `jiraIssueId` and `jiraIssueKey` supporting round-trip identification.
- **V1 Refactoring Required:** `JiraSyncRecord` needs `lastJiraUpdatedAt` and conflict resolution fields. A Jira webhook receiver endpoint or polling job is new. The conflict resolution model (field-by-field sync direction) must be designed before implementation. The existing sync function is the write path; a read path needs adding.
- **Clean Extension Point:** Partial — the Jira client and sync infrastructure exist, but the data flow direction extension and conflict model are new design work.
- **PRD V1 Scope Check:** PRD Section 20.2 explicitly states "Push only: application to Jira. Changes made directly in Jira are not synced back." This is an intentional V1 constraint.
- **Readiness:** Needs Prep (conflict model design and schema additions before implementation)
- **Priority Recommendation:** Medium — only relevant for projects where clients actively modify stories in Jira and expect reflection back. Not universal.
- **Estimated Scope:** L (webhook receiver or polling job + conflict model + resolution UI + per-field sync direction configuration)

---

### 5. Process and Compliance

---

### V2-PROC-001: Sprint Carryover History
- **V2 Roadmap Section:** 5.1
- **V1 Preparatory Code:** `Story` model has a simple `sprintId String?` FK. `StatusTransition` records track status changes with timestamps (written by `src/lib/inngest/functions/audit-log.ts`). Sprint date ranges are stored. Carryover can be inferred from `StatusTransition` — a story was `SPRINT_PLANNED` during Sprint N dates but completed in Sprint N+1. No explicit `StorySprintHistory` join table exists.
- **V1 Refactoring Required:** Additive schema change: a `StorySprintHistory` table tracking `(storyId, sprintId, assignedAt, removedAt, wasCarryover)`. The `Story.sprintId` FK remains for the current sprint assignment. This is purely additive.
- **Clean Extension Point:** Partial — the data to infer historical carryover is in `StatusTransition` but is not directly queryable for velocity calculations. A dedicated history table would be cleaner and more performant.
- **PRD V1 Scope Check:** PRD Section 7.3 explicitly notes "Sprint carryover history is not tracked in V1 — flagged as a known simplification."
- **Readiness:** Needs Prep (additive schema change needed before the history can be correctly captured going forward)
- **Priority Recommendation:** Medium — PM velocity accuracy matters once multiple sprints have completed. The sooner this is added, the more historical data is accumulated. Early addition has compounding value.
- **Estimated Scope:** S (new join table + write logic in sprint assignment actions + velocity calculation update + sprint dashboard display)

---

### V2-PROC-002: Salesforce Credential Rotation
- **V2 Roadmap Section:** 5.2
- **V1 Preparatory Code:** `src/lib/salesforce/oauth.ts` and `src/actions/org-connection.ts` implement OAuth token management. `Project` model has `sfOrgRefreshToken`, `sfOrgAccessToken`, and `keyVersion` (per-project derived key encryption per PRD Section 22.8). No `sfOrgTokenExpiresAt` field, no rotation workflow, no expiry notification exists in `src/`.
- **V1 Refactoring Required:** Additive: add `sfOrgTokenExpiresAt DateTime?` and `sfOrgLastRefreshAttemptAt DateTime?` to the `Project` model. Add a scheduled Inngest function checking expiry. Add a refresh workflow in `org-connection.ts` using the existing refresh token.
- **Clean Extension Point:** Partial — credential storage and encryption infrastructure is in place, but expiry tracking fields are absent.
- **PRD V1 Scope Check:** PRD Section 27.11 explicitly defers.
- **Readiness:** Needs Prep (needs schema additions for expiry tracking fields)
- **Priority Recommendation:** Medium — critical for long-running engagements (6+ months) where Connected App sessions expire. Low urgency for short projects.
- **Estimated Scope:** S (schema additions + scheduled Inngest check function + notification dispatch + UI refresh workflow)

---

### V2-PROC-003: Framework Updates to Active Projects
- **V2 Roadmap Section:** 5.3
- **V1 Preparatory Code:** No framework update propagation mechanism exists anywhere in `src/`. Firm rules are hardcoded in TypeScript constants scattered across `src/lib/documents/branding.ts`, agent harness prompt template strings, and `src/lib/api-keys/rate-limit.ts`. There is no version tracking on firm-level rules.
- **V1 Refactoring Required:** This item has a hard prerequisite dependency on V2-UX-001 (Firm Administrator UI). Without a firm-level settings database model, there is nothing to propagate. The full feature requires: (1) firm settings in a database model, (2) per-project "settings version" tracking field, (3) propagation and notification mechanism. All three are new.
- **Clean Extension Point:** No — blocked on V2-UX-001 entirely.
- **PRD V1 Scope Check:** PRD Section 27.13 explicitly defers.
- **Readiness:** Major Work (blocked on V2-UX-001; nothing to propagate until firm settings exist in the database)
- **Priority Recommendation:** Low — only relevant once there are multiple active projects and the firm updates its rules mid-engagement. Must implement V2-UX-001 first.
- **Estimated Scope:** M in isolation, but effectively L when V2-UX-001 prerequisite is counted.

---

### V2-PROC-004: Regulatory and Contractual Review
- **V2 Roadmap Section:** 5.4
- **V1 Preparatory Code:** PRD Section 22 has comprehensive security and compliance documentation. `src/lib/inngest/functions/audit-log.ts` writes `StatusTransition` records. `SessionLog` is the complete AI usage audit trail. `ApiRequestLog` tracks all API access. The data infrastructure for compliance reporting is solid. No audit report generation endpoint or legal template management exists.
- **V1 Refactoring Required:** None to existing code. The technical component (audit report generation) is additive. The primary work is a legal review process external to the codebase.
- **Clean Extension Point:** Yes — all audit data is captured; report generation is additive.
- **PRD V1 Scope Check:** PRD Section 27.9 explicitly defers. Properly deferred.
- **Readiness:** Ready (clean extension for the technical component; legal review is external to the codebase)
- **Priority Recommendation:** High — this is a prerequisite for onboarding external clients. Should be addressed before broad rollout regardless of V1/V2 labeling. The code work is small; the process work is the real effort.
- **Estimated Scope:** S for code (audit report generation endpoint + template); the legal review process is not an engineering scope item.

---

### V2-PROC-005: QA Role Expansion
- **V2 Roadmap Section:** 5.5
- **V1 Preparatory Code:** `src/app/api/chat/route.ts` performs `getCurrentMember(projectId)` for membership verification but does NOT call `requireRole` with a role restriction. Any authenticated project member including QA can reach the chat endpoint. `buildToolsForRole(member.role, projectId, member.id)` is called and provides role-scoped tools — QA members receive a restricted tool set appropriate to their role. The PRD RBAC table (Section 19.1) says QA cannot chat, but this restriction is not enforced in the implementation.
- **V1 Refactoring Required:** The situation is ambiguous: the PRD specifies a restriction that is not enforced. To "expand" QA permissions in V2 requires first deciding whether to enforce the V1 restriction (add a `requireRole` check that excludes QA) and then relax it — or to accept the current permissive state as V2-ready. Given that `buildToolsForRole` already provides role-appropriate tool scoping, the current state may be functionally correct even if it diverges from the spec.
- **Clean Extension Point:** Yes — `buildToolsForRole` is the correct mechanism for scoping QA tool access. Tuning the QA tool set for testing discovery is additive.
- **PRD V1 Scope Check:** PRD Section 19.1 lists QA as unable to "Chat with AI (discovery)" — this is not enforced in code. This is simultaneously a V1 implementation gap (restriction specified but not implemented) AND a V2 expansion item. See V1 Scope Drift section.
- **Readiness:** Needs Prep (the RBAC inconsistency between spec and code must be resolved before implementing the V2 expansion)
- **Priority Recommendation:** High — the RBAC inconsistency is a V1 gap that should be resolved explicitly. Either enforce the restriction (one `requireRole` call) or formally accept the permissive behavior as the correct design. Document the decision either way.
- **Estimated Scope:** S (role decision + one `requireRole` call if restricting, or tool set tuning for QA if expanding)

---

### 6. File and Content Management

---

### V2-FILE-001: File Upload Constraints
- **V2 Roadmap Section:** 6.1
- **V1 Preparatory Code:** `src/components/transcripts/upload-zone.tsx` handles transcript uploads. `Attachment` model in `prisma/schema.prisma` has `fileSizeBytes Int`, `contentType String`, and `originalFilename String` — the metadata fields to enforce limits are already stored. No validation logic for file size limits, content type whitelisting, or virus scanning exists anywhere in `src/`. `Attachment.fileSizeBytes` stores the size after upload but nothing validates against a maximum before or during upload.
- **V1 Refactoring Required:** File size and type validation can be added to upload handlers as middleware without schema changes. Virus scanning requires new infrastructure (ClamAV or a cloud service). Upload rate limits per user can integrate with the existing rate-limiting pattern in `src/lib/api-keys/rate-limit.ts`.
- **Clean Extension Point:** Partial — the storage model correctly captures metadata, but the upload path has no validation layer.
- **PRD V1 Scope Check:** Gap analysis item #11. PRD Section 22 describes a security posture that implies untrusted uploads must be controlled. The `Attachment` model stores `fileSizeBytes` and `contentType` — fields that exist specifically to support validation. This is effectively a V1 production-readiness gap.
- **Readiness:** Needs Prep (no validation layer on the upload path; needs adding before production multi-user rollout)
- **Priority Recommendation:** High — this is a production-readiness requirement, not a feature enhancement. A user can currently upload a file of any size or type with no rejection. Should be addressed before multi-user rollout.
- **Estimated Scope:** S (upload validation middleware + size/type config constants + optional virus scan integration)

---

### V2-FILE-002: Large Transcript Handling
- **V2 Roadmap Section:** 6.2
- **V1 Preparatory Code:** `src/lib/inngest/functions/transcript-processing.ts` processes transcripts as a single Inngest step function. `Transcript` model has both `rawContent String?` (inline) and `s3Key String?` (for S3-stored large content) — the schema already anticipates size variation. `src/lib/agent-harness/tasks/transcript-processing.ts` documents token economics for 5–10K word transcripts (4–8 iterations, ~$0.50–$1.50). No chunking logic exists; large transcripts would exceed the Claude context window or cost budget without user feedback.
- **V1 Refactoring Required:** The Inngest step function structure is well-suited to chunked processing — steps can be added for split, process-chunk-N, and merge-results without restructuring the overall function. `Transcript.s3Key` already supports storing large content externally. This is an extension of the existing transcript processing Inngest function.
- **Clean Extension Point:** Partial — the Inngest step boundary design is right, but a chunking strategy (split point logic, deduplication on merge, size threshold) must be designed before implementation.
- **PRD V1 Scope Check:** Gap analysis item #9. PRD Section 6.4 documents token economics for 5–10K word transcripts, implicitly acknowledging larger transcripts are out of V1 scope.
- **Readiness:** Needs Prep (chunking strategy must be designed; involves modifying the transcript processing Inngest function)
- **Priority Recommendation:** Medium — reactive to user-reported transcript size issues. Low urgency until a 2-hour transcript is attempted and fails.
- **Estimated Scope:** M (chunking strategy design + Inngest step additions for split/process/merge + dedup logic + size threshold UI feedback before submission)

---

## Recommended Priority Order

Items ranked by combined user impact and implementation effort, with hard dependencies respected.

### Tier 1 — Address Before or During Broad Rollout (production-readiness and correctness)

1. **V2-PROC-004 (Regulatory Review)** — S code scope; the legal review is a business process prerequisite for external client engagement.
2. **V2-FILE-001 (File Upload Constraints)** — S scope; no upload validation exists on any upload path. A production security gap.
3. **V2-PROC-005 (QA Role Expansion)** — S scope; first requires resolving the RBAC inconsistency between PRD and implementation. One decision + one code change.

### Tier 2 — High User Impact, Low Effort (quick wins using existing infrastructure)

4. **V2-UX-002 (Project Home Page)** — S scope; stub route exists, data sources ready. Current state is nearly empty.
5. **V2-UX-006 (Developer Context Package Web View)** — S scope; REST API assembly already done. New read-only route only.
6. **V2-UX-007 (Email Notifications)** — S scope; single hook point in `notification-dispatch.ts`. Resend integration for HIGH-priority events.
7. **V2-UX-005 (Activity Feed UI)** — S scope; three audit tables are populated and growing. Pure display work.

### Tier 3 — Medium Impact, Medium Effort (meaningful features, bounded scope)

8. **V2-AI-001 (Embedding Duplicate Detection)** — S scope; copy-and-extend from existing `KnowledgeArticle` embedding pattern.
9. **V2-PROC-001 (Sprint Carryover History)** — S scope; additive schema change. Captures data sooner = more historical value accumulated.
10. **V2-INFRA-004 (Event-Driven Org Sync)** — S scope; webhook receiver fires existing event. Sync function unchanged.
11. **V2-PROC-002 (Credential Rotation)** — S scope; additive schema fields + Inngest check function.
12. **V2-UX-004 (Data Export)** — M scope; important for engagement-end deliverables and client handoff.
13. **V2-INFRA-003 (Real-Time Updates)** — M scope; relevant once multi-user dashboard staleness is reported.
14. **V2-INT-001 (Playwright Test Integration)** — M scope; relevant once automated test volume justifies it.
15. **V2-FILE-002 (Large Transcript Handling)** — M scope; reactive to user-reported size issues.
16. **V2-AI-003 (AI Quality Benchmarking)** — M scope; useful for ROI reporting to firm leadership.

### Tier 4 — Strategic Investments (prerequisite dependencies or scaling triggers)

17. **V2-UX-001 (Firm Admin UI)** — M scope; prerequisite for V2-PROC-003. Needed when team grows beyond single admin.
18. **V2-INT-003 (Bidirectional Jira Sync)** — L scope; only for projects where clients actively modify Jira stories.
19. **V2-UX-003 (Mobile Access)** — L scope; layout audit + responsive passes across all major templates.
20. **V2-PROC-003 (Framework Updates)** — L scope (blocked on V2-UX-001 as hard prerequisite).
21. **V2-AI-002 (AI Provider Abstraction)** — L scope; only if a specific second provider requirement emerges.
22. **V2-INFRA-001 (Background Job Upgrade)** — L scope; trigger-based scaling investment. Monitor documented indicators.
23. **V2-INFRA-002 (Real-Time Collaborative Editing)** — XL scope; only when optimistic concurrency conflicts are repeatedly user-reported.
24. **V2-INT-002 (Git Repository Management)** — M scope; no foundation in V1; low reported pain.

---

## V1 Scope Drift

Items where the PRD describes V1 behavior or infrastructure that is either not fully implemented or has a behavioral inconsistency between spec and code.

---

### Drift-1: QA Role Chat Access (PRD Section 19.1 vs. `src/app/api/chat/route.ts`)

**PRD says:** The RBAC matrix in Section 19.1 lists "Chat with AI (discovery)" as "No" for QA role.

**Codebase does:** `src/app/api/chat/route.ts` calls `getCurrentMember(projectId)` for membership verification but never calls `requireRole` with a role restriction. Any authenticated project member — including QA — can reach the chat endpoint. `buildToolsForRole(member.role, ...)` does provide role-scoped tools, so QA members receive a restricted tool set appropriate to their role, but the access restriction itself is not enforced.

**Impact:** Low operationally (QA gets role-appropriate tools), but the spec divergence is a correctness issue. The V2 expansion item (5.5) cannot be cleanly designed until the V1 intended behavior is decided.

**Recommendation:** Make an explicit decision before V2 planning: either (a) add a `requireRole` guard excluding QA from chat (one line), then plan V2 to relax it; or (b) formally accept the current permissive behavior as the correct design and update the PRD RBAC matrix. Option (b) is arguably better UX and avoids unnecessary V1 churn.

---

### Drift-2: File Upload Has No Validation (V2 Roadmap Section 6.1 / PRD Section 22)

**PRD says:** Section 22 describes a security posture for handling client data as confidential. The `Attachment` model stores `fileSizeBytes`, `contentType`, and `originalFilename` — fields whose existence implies they will be used to enforce constraints.

**Codebase does:** No file size validation, no content type whitelist, no virus scanning exists on any upload path in `src/`. The schema captures the metadata after upload but nothing validates before or during.

**Impact:** Real security and cost risk before multi-user production rollout. A user can upload a file of arbitrary size or type with no rejection.

**Recommendation:** Treat as a V1 gap to close before production rollout, not a V2 enhancement. Add upload validation middleware to the transcript upload handler and any attachment upload paths. This is S-sized work.

---

### Drift-3: Activity Feed Data Capture Is V1, UI Is Correctly V2

**PRD implies:** `VersionHistory` and `StatusTransition` are V1 schema entities supporting the optimistic concurrency system (Section 19.2). They are part of V1 design.

**Codebase does:** Both models are in `prisma/schema.prisma` and are being actively written by V1 actions and Inngest functions. The data is accumulating correctly.

**Impact:** None. This is not a gap — data capture is functioning as intended. The V2 item is the display layer, which correctly has no V1 foundation.

**Recommendation:** No action needed. The V2 Activity Feed UI will have full historical data to display from day one.

---

## Key Architectural Observations

The codebase is well-prepared for V2. Several deliberate V1 design choices created clean extension points that make the highest-value V2 items inexpensive to implement:

The Inngest function architecture is modular and trigger-agnostic — metadata sync, embedding batch, notification dispatch, and document generation are all self-contained functions that can be extended independently. The pgvector embedding infrastructure on `KnowledgeArticle` and `OrgComponent` is the exact pattern needed for V2-AI-001 (embedding duplicate detection on questions) — it is copy-and-extend, not net-new. The `notification-dispatch.ts` Inngest function is a single hook point for all 14 notification event types — email dispatch is one code block addition, not a distributed change. The `src/app/api/v1/context-package/route.ts` already performs the complete data assembly that V2-UX-006 needs to render — the web view is a new route consuming an existing server function. The stub at `src/app/(dashboard)/projects/[projectId]/page.tsx` with its placeholder comment is the exact landing point for V2-UX-002.

The smallest-scope V2 items deliver the most immediate user value. Items V2-UX-002, V2-UX-006, V2-UX-007, and V2-UX-005 are all S-sized, use exclusively existing data sources, and have zero schema changes. They should be treated as Phase 13/14 work rather than deferred until a formal V2 build milestone.

Three items have a hard dependency chain: V2-PROC-003 (Framework Updates) requires V2-UX-001 (Firm Admin UI) which requires a `FirmSettings` database model. None should be started out of order.

The infrastructure scaling items (V2-INFRA-001, V2-INFRA-002, V2-INFRA-003) are correctly treated as trigger-based investments. The Inngest architecture is solid for V1 load. The V2 roadmap's documented trigger conditions for 1.1 are the right escalation criteria.

---

## Essential Files for This Assessment

- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/archive/V2-ROADMAP.md` — Source document for all 22 V2 items
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/archive/SF-Consulting-AI-Framework-PRD-v2.1.md` — PRD sections 3.3, 4.6, 7.3, 17.8, 18.3, 19.1, 20.2, 22, 25.1–25.2, 27.3–27.14
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/prisma/schema.prisma` — Complete data model including `VersionHistory`, `StatusTransition`, `Notification`, `Sprint`, `JiraConfig`, `KnowledgeArticle` (with embedding), `OrgComponent` (with embedding), `TestCase`, `Attachment`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/.planning/ROADMAP.md` — Phase completion state (Phases 1–9 complete, 10–12 in progress)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/.planning/STATE.md` — Decision log with implementation notes from all phases
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/api/chat/route.ts` — Chat route; confirmed no QA role check
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/agent-harness/engine.ts` — Agent harness; confirmed direct `@anthropic-ai/sdk` usage
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/agent-harness/tools/create-question.ts` — V1 substring-based duplicate detection
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/documents/branding.ts` — Hardcoded V1 branding config with V2 admin UI comment
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/notification-dispatch.ts` — Single hook point for V2-UX-007 email extension
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/metadata-sync.ts` — Trigger-agnostic sync function for V2-INFRA-004
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/api/v1/context-package/route.ts` — Complete context package assembly (foundation for V2-UX-006)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/page.tsx` — Project home page stub (V2-UX-002 landing point)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/auth.ts` — `requireRole` pattern (absent from chat route, relevant to V2-PROC-005)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/search/global-search.ts` — pgvector cosine similarity implementation (reusable for V2-AI-001)