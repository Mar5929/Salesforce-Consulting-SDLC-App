# Roadmap: Salesforce Consulting AI Framework

## Overview

This roadmap delivers an internal AI-powered project management and knowledge platform for a Salesforce consulting firm. The build progresses from foundational infrastructure (auth, schema, project CRUD) through the core value proposition (persistent AI knowledge brain), into work management (stories, sprints), external integration (Salesforce org connectivity, developer API), and finally output artifacts (documents, QA, admin). Each phase delivers a coherent, independently verifiable capability that unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation and Data Layer** - Auth, database schema, project management, background job infrastructure
- [x] **Phase 2: Discovery and Knowledge Brain** - Question system, AI agent harness, transcript processing, chat, knowledge architecture, search, dashboard, notifications
- [x] **Phase 3: Story Management and Sprint Intelligence** - Epic/feature/story CRUD, AI-assisted story generation, sprint management and intelligence
- [x] **Phase 4: Salesforce Org Connectivity and Developer Integration** - Org OAuth, metadata sync, brownfield ingestion, REST API for Claude Code
- [x] **Phase 5: Document Generation, QA, and Administration** - Branded documents, QA workflow, Jira sync, PM dashboard, project archival
- [x] **Phase 6: Schema Fixes** - sandboxStrategy persistence and question category filter
- [x] **Phase 7: Story Generation E2E Wiring** - Cross-component wiring to complete AI story generation flow
- [x] **Phase 8: Event Wiring and Integration Fixes** - Dashboard auto-refresh, Jira sync field fix, event consumers
- [x] **Phase 9: Navigation and Badge Fixes** - Sidebar team link and badge count wiring

## Phase Details

### Phase 1: Foundation and Data Layer
**Goal**: The application boots, authenticates users, manages projects, and has the complete data model and background job infrastructure ready for feature development
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, PROJ-01, PROJ-02, PROJ-03, INFRA-01, INFRA-02, INFRA-04
**Success Criteria** (what must be TRUE):
  1. User can sign up, log in, and maintain a session across browser refreshes
  2. User can create a project, invite team members, and assign roles (SA, PM, BA, Developer, QA) that control feature visibility
  3. All data queries return only data belonging to the active project -- no cross-project leakage
  4. Inngest background job infrastructure processes events with automatic retries and step function checkpoints
  5. Full PostgreSQL schema is deployed with all entities, indexes, and vector extensions ready for feature phases
**Plans**: 3 plans

Plans:
- [x] 01-01: TBD
- [x] 01-02: TBD
- [x] 01-03: TBD

**UI hint**: yes

### Phase 2: Discovery and Knowledge Brain
**Goal**: The AI persistently accumulates project understanding through questions, transcripts, conversations, and knowledge articles -- making the team progressively smarter about each engagement
**Depends on**: Phase 1
**Requirements**: QUES-01, QUES-02, QUES-03, QUES-04, QUES-05, QUES-06, QUES-07, QUES-08, AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, TRNS-01, TRNS-02, TRNS-03, TRNS-04, TRNS-05, TRNS-06, CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, KNOW-01, KNOW-02, KNOW-03, KNOW-04, KNOW-05, KNOW-06, KNOW-07, SRCH-01, SRCH-02, SRCH-03, SRCH-04, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, NOTF-01, NOTF-02, NOTF-03, NOTF-04, INFRA-03
**Success Criteria** (what must be TRUE):
  1. User can raise questions manually, and AI raises questions automatically during transcript processing -- all following the full lifecycle (Open > Scoped > Owned > Answered > Reviewed) with filtering and search
  2. User can upload a transcript and the AI extracts questions, decisions, requirements, and risks in a multi-step chat session with user confirmation at key points
  3. User can chat with the AI in both general project chat and task-specific sessions, with streaming responses and persistent message history
  4. Knowledge articles are automatically synthesized from project data, track staleness, and refresh via background jobs -- with semantic search returning meaning-based results alongside filtered and full-text search
  5. Discovery dashboard shows outstanding questions, blocked items, health scores, and AI-generated focus summaries
**Plans**: 12 plans

Plans:
- [x] 02-01-PLAN.md -- Agent harness core: types, execution engine, tool executor, sanitization
- [x] 02-02-PLAN.md -- Context assembly (Layer 3) and task definitions (Layer 1)
- [x] 02-03-PLAN.md -- Chat infrastructure: streaming API, conversation persistence, chat UI
- [x] 02-04-PLAN.md -- Question system: CRUD, table/kanban views, lifecycle, AI impact assessment
- [x] 02-05-PLAN.md -- Transcript processing: upload, AI extraction, interactive review
- [x] 02-06-PLAN.md -- Knowledge architecture: articles, staleness, background refresh
- [x] 02-07-PLAN.md -- Three-layer search: filtered, full-text, semantic, Cmd+K palette
- [x] 02-08-PLAN.md -- Discovery dashboard: stats, health score, AI synthesis
- [x] 02-09-PLAN.md -- Notification system: bell icon, dispatch, mark-read
- [x] 02-10-PLAN.md -- Gap closure: schema migration (QuestionStatus lifecycle + Notification priority)
- [x] 02-11-PLAN.md -- Gap closure: question 5-state lifecycle UI + AI impact assessment Inngest function
- [x] 02-12-PLAN.md -- Gap closure: session tokens, extraction accept/reject, notification priority ordering

**UI hint**: yes

### Phase 3: Story Management and Sprint Intelligence
**Goal**: The team can manage the full work breakdown (epics, features, stories) and plan sprints with AI-powered conflict detection and dependency intelligence
**Depends on**: Phase 2
**Requirements**: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07, SPRT-01, SPRT-02, SPRT-03, SPRT-04, SPRT-05
**Success Criteria** (what must be TRUE):
  1. User can create and manage epics, features, and stories with mandatory field validation and a full status workflow (Draft through Done)
  2. AI generates story drafts from requirements and discovery context, pre-populating acceptance criteria and impacted Salesforce components
  3. PM can create sprints, assign stories, and view sprint dashboard with progress, velocity, and burndown
  4. Sprint intelligence flags component-level conflicts between stories and suggests dependency ordering
**Plans**: 9 plans

Plans:
- [x] 03-00-PLAN.md -- Wave 0: vitest setup, test utilities, unit tests for status machine, burndown, sprint assignment
- [x] 03-01-PLAN.md -- Foundation: schema migration, server actions, status machine, sidebar nav
- [x] 03-02-PLAN.md -- Work breakdown UI: epic/feature pages, breadcrumb, view toggle, epic/feature tables
- [x] 03-02b-PLAN.md -- Story UI: story table with bulk actions, story form, component selector, backlog page
- [x] 03-03-PLAN.md -- AI story generation: agent harness task, draft tool, accept/edit/reject cards, STORY_SESSION initiation
- [x] 03-04-PLAN.md -- Sprint management: CRUD, sprint list, split-view planning with drag-and-drop
- [x] 03-05-PLAN.md -- Sprint board kanban and dashboard with burndown chart
- [x] 03-06-PLAN.md -- Sprint intelligence: conflict detection Inngest function, dependency suggestions
- [x] 03-07-PLAN.md -- Gap closure: wire Generate Stories button and bulk sprint assignment to server actions

**UI hint**: yes

### Phase 4: Salesforce Org Connectivity and Developer Integration
**Goal**: The platform connects to live Salesforce orgs, builds an org knowledge base from metadata, and exposes a REST API that Claude Code consumes for context-aware development
**Depends on**: Phase 3
**Requirements**: ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, DEV-01, DEV-02, DEV-03, DEV-04, DEV-05
**Success Criteria** (what must be TRUE):
  1. User can connect a Salesforce org via OAuth and the system performs incremental metadata sync on a schedule
  2. Brownfield ingestion pipeline processes org metadata through Parse > Classify > Synthesize > Articulate, with AI-suggested domain groupings confirmed by the architect
  3. Claude Code can call the REST API to retrieve context packages (story details, business processes, knowledge articles, related decisions, sprint conflicts) and update story status
  4. Org components are mapped to business processes with the isConfirmed pattern for human oversight
**Plans**: 7 plans

Plans:
- [x] 04-01-PLAN.md -- Foundation: schema additions (ApiKey, OrgSyncRun), jsforce client, API key infrastructure, test scaffolds
- [x] 04-02-PLAN.md -- OAuth flow: authorize/callback routes, org connection settings page with status card
- [x] 04-03-PLAN.md -- Metadata sync: Inngest function, component parsing, sync history table, org overview page
- [x] 04-04-PLAN.md -- Brownfield ingestion: 4-phase AI pipeline, domain classification, business process synthesis, review actions
- [x] 04-05-PLAN.md -- REST API: context-package, org/components, stories/status, project/summary endpoints with API key auth
- [x] 04-06-PLAN.md -- Org analysis UI: pipeline stepper, domain/process review cards, tabbed review interface
- [x] 04-07-PLAN.md -- Claude Code skills: API endpoint documentation for developer consumption

### Phase 5: Document Generation, QA, and Administration
**Goal**: The platform produces branded deliverables, supports QA workflows, and provides PM-level administration including Jira sync and project archival
**Depends on**: Phase 4
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, QA-01, QA-02, QA-03, ADMIN-01, ADMIN-02, ADMIN-03, PROJ-04, PROJ-05
**Success Criteria** (what must be TRUE):
  1. PM can generate branded Word, PowerPoint, and PDF documents populated by AI from the project knowledge base, stored in S3/R2 with version tracking
  2. QA can record test execution results (Pass/Fail/Blocked) and manage defects through their full lifecycle linked to stories
  3. PM can optionally push stories and status to a client Jira instance (one-directional)
  4. PM dashboard shows aggregated views across project dimensions with AI token usage and cost tracking
  5. PM can archive a completed project (read-only state) and reactivate it for follow-on engagements
**Plans**: 9 plans

Plans:
- [x] 05-00-PLAN.md -- Wave 0: test stubs for all Phase 5 modules (TDD RED), mock helpers for S3 and Jira
- [x] 05-01-PLAN.md -- Foundation: dependencies, Inngest events, defect status machine, S3 utilities, branding config, sidebar nav
- [x] 05-02-PLAN.md -- QA server actions: test case CRUD, test execution recording, defect CRUD with status transitions
- [x] 05-03-PLAN.md -- QA UI: story detail page with QA tab, defect list page (table+kanban), defect creation sheet
- [x] 05-04-PLAN.md -- Document generation backend: template definitions, format renderers (with DOC-04 branding), AI task, Inngest pipeline
- [x] 05-05-PLAN.md -- Document generation UI: template gallery, generation dialog, progress, preview page
- [x] 05-06-PLAN.md -- PM Dashboard: stat cards, charts (AI usage, work progress, QA summary), stories by assignee/questions by status/knowledge coverage (D-14), Inngest synthesis
- [x] 05-07-PLAN.md -- Jira sync + project archival backend: schema models, Jira client, sync Inngest function, server actions
- [x] 05-08-PLAN.md -- Jira sync + archival UI: schema push, settings page, SyncStatusBadge wired into story table (D-17)

**UI hint**: yes

### Phase 6: Schema Fixes
**Goal**: Fix data model gaps where user input is silently discarded (sandboxStrategy) and filtering is incomplete (question category)
**Depends on**: Phase 1
**Requirements**: PROJ-01, QUES-08
**Gap Closure:** Closes gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. sandboxStrategy field exists on Project model and is persisted through create and update actions
  2. category field exists on Question model and category filter works in question list UI
**Plans**: 1 plan

Plans:
- [x] 06-01-PLAN.md -- Add sandboxStrategy to Project, QuestionCategory enum + category field/filter to Question

### Phase 7: Story Generation E2E Wiring
**Goal**: Wire the complete AI story generation flow end-to-end so epicId reaches the API, StoryDraftCards render, and buildStorySessionPrompt activates
**Depends on**: Phase 3
**Requirements**: WORK-06
**Gap Closure:** Closes gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. epicId/featureId are passed as search params in redirect URL from epic detail to chat
  2. ChatInterface has a STORY_SESSION variant that forwards epicId to the API
  3. /api/chat receives epicId and calls buildStorySessionPrompt
  4. StoryDraftCards component is imported and rendered in story session chat
**Plans**: 1 plan

Plans:
- [x] 07-01-PLAN.md — Wire epicId through redirect, ChatInterface STORY_SESSION variant, and StoryDraftCards rendering


### Phase 8: Event Wiring and Integration Fixes
**Goal**: Fix broken event chains so discovery dashboard auto-refreshes, Jira sync works from web UI, and retry mechanism functions
**Depends on**: Phase 5
**Requirements**: DASH-05, ADMIN-01
**Gap Closure:** Closes gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. PROJECT_STATE_CHANGED event is sent by state-changing actions, triggering dashboard synthesis
  2. stories.ts sends newStatus (not toStatus) in STORY_STATUS_CHANGED event
  3. JIRA_SYNC_REQUESTED event has an Inngest consumer for manual retry
**Plans**: 1 plan

Plans:
- [x] 08-01-PLAN.md -- Wire PROJECT_STATE_CHANGED sends, fix STORY_STATUS_CHANGED field names, create Jira retry consumer

### Phase 9: Navigation and Badge Fixes
**Goal**: Fix broken sidebar navigation and wire missing badge counts
**Depends on**: Phase 5
**Requirements**: PROJ-02
**Gap Closure:** Closes gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. Sidebar Team link navigates to /projects/{id}/settings/team (not /team)
  2. AppShell fetches and passes questionReviewCount and openDefectCount to Sidebar
**Plans**: 1 plan

Plans:
- [x] 09-01-PLAN.md -- Fix Team link href and wire badge counts through layout > AppShell > Sidebar

## Progress

**Execution Order:**
Phases execute in numeric order: 1 > 2 > 3 > 4 > 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Data Layer | 3/3 | Complete | 2026-04-05 |
| 2. Discovery and Knowledge Brain | 12/12 | Complete | 2026-04-06 |
| 3. Story Management and Sprint Intelligence | 9/9 | Complete | 2026-04-06 |
| 4. Salesforce Org Connectivity and Developer Integration | 7/7 | Complete | 2026-04-06 |
| 5. Document Generation, QA, and Administration | 9/9 | Complete | 2026-04-07 |
| 6. Schema Fixes | 1/1 | Complete | 2026-04-07 |
| 7. Story Generation E2E Wiring | 1/1 | Complete | 2026-04-07 |
| 8. Event Wiring and Integration Fixes | 1/1 | Complete | 2026-04-07 |
| 9. Navigation and Badge Fixes | 1/1 | Complete | 2026-04-07 |

### Phase 10: Chat Session Management and Conversation Intelligence

**Goal:** The chat system provides a ChatGPT-style conversation browsing/management UI, implements all six session types with lifecycle management, and acts as a knowledgeable project assistant drawing from all project data sources via smart retrieval
**Requirements**: D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14
**Depends on:** Phase 9
**Success Criteria** (what must be TRUE):
  1. Chat page has a left sidebar (320px) with filterable, searchable conversation list and pinned general chat
  2. All six session types (GENERAL_CHAT, TRANSCRIPT_SESSION, STORY_SESSION, BRIEFING_SESSION, QUESTION_SESSION, ENRICHMENT_SESSION) are functional
  3. Task sessions auto-complete when purpose fulfilled; failed sessions show retry; completed sessions are read-only
  4. General chat draws from all project data sources via smart two-pass retrieval within token budget
  5. Users can archive conversations (no delete) and access archived via filter toggle
**Plans**: 5 plans

Plans:
- [ ] 10-01-PLAN.md -- Conversation sidebar UI, chat layout, schema migration (isArchived), lifecycle server actions
- [ ] 10-02-PLAN.md -- BRIEFING_SESSION and ENRICHMENT_SESSION: task definitions, prompt builders, UI components, entry points
- [ ] 10-03-PLAN.md -- QUESTION_SESSION hybrid (Inngest background + interactive), session lifecycle management
- [ ] 10-04-PLAN.md -- Smart context retrieval: two-pass semantic + keyword search, full project data assembly
- [ ] 10-05-PLAN.md -- Schema push and end-to-end verification

### Phase 11: Agentic Chat with Database Awareness and Project Tool Use

**Goal:** The AI chat assistant can actively query, create, update, and delete project entities through role-gated tools with hard-coded deletion confirmation, making it a true project collaborator
**Depends on:** Phase 9
**Requirements**: ACHAT-01, ACHAT-02, ACHAT-03, ACHAT-04, ACHAT-05, ACHAT-06, ACHAT-07, ACHAT-08, ACHAT-09, ACHAT-10, ACHAT-12, ACHAT-13, ACHAT-14, ACHAT-15, ACHAT-16, ACHAT-17, ACHAT-18, ACHAT-19
**Success Criteria** (what must be TRUE):
  1. AI can query all 15 project entities via chat tools returning summary-first results
  2. AI can create, update, and delete mutable entities through chat, with role-based gating matching web app permissions
  3. Delete operations require explicit user approval via a hard-coded structural gate (needsApproval) -- not just prompt instructions
  4. Tool results render as structured cards in the chat UI (query cards, mutation confirmations, delete approval dialogs)
  5. Multi-step tool chains are bounded to 15 calls per AI turn
  6. All tool calls are logged for audit via ChatMessage.toolCalls
**Plans**: 6 plans

Plans:
- [ ] 11-01-PLAN.md -- Tool infrastructure: types, registry, audit, system prompt, schema migration
- [ ] 11-02-PLAN.md -- Query tools for all 15 entities (query list + get detail)
- [ ] 11-03-PLAN.md -- Write tools for 10 mutable entities + batch variants
- [ ] 11-04-PLAN.md -- Delete tools with needsApproval safety gate
- [ ] 11-05-PLAN.md -- Chat route upgrade: wiring tools, multi-step, approval flow
- [ ] 11-06-PLAN.md -- Tool result card components and message list rendering

### Phase 12: Roadmap and Execution View — Milestones, Epic Phase Grid, and Project Execution Order

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 11
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 12 to break down)
