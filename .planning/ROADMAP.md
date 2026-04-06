# Roadmap: Salesforce Consulting AI Framework

## Overview

This roadmap delivers an internal AI-powered project management and knowledge platform for a Salesforce consulting firm. The build progresses from foundational infrastructure (auth, schema, project CRUD) through the core value proposition (persistent AI knowledge brain), into work management (stories, sprints), external integration (Salesforce org connectivity, developer API), and finally output artifacts (documents, QA, admin). Each phase delivers a coherent, independently verifiable capability that unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Data Layer** - Auth, database schema, project management, background job infrastructure
- [ ] **Phase 2: Discovery and Knowledge Brain** - Question system, AI agent harness, transcript processing, chat, knowledge architecture, search, dashboard, notifications
- [ ] **Phase 3: Story Management and Sprint Intelligence** - Epic/feature/story CRUD, AI-assisted story generation, sprint management and intelligence
- [ ] **Phase 4: Salesforce Org Connectivity and Developer Integration** - Org OAuth, metadata sync, brownfield ingestion, REST API for Claude Code
- [ ] **Phase 5: Document Generation, QA, and Administration** - Branded documents, QA workflow, Jira sync, PM dashboard, project archival

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
**Plans**: 8 plans

Plans:
- [ ] 03-00-PLAN.md -- Wave 0: vitest setup, test utilities, unit tests for status machine, burndown, sprint assignment
- [ ] 03-01-PLAN.md -- Foundation: schema migration, server actions, status machine, sidebar nav
- [ ] 03-02-PLAN.md -- Work breakdown UI: epic/feature pages, breadcrumb, view toggle, epic/feature tables
- [ ] 03-02b-PLAN.md -- Story UI: story table with bulk actions, story form, component selector, backlog page
- [ ] 03-03-PLAN.md -- AI story generation: agent harness task, draft tool, accept/edit/reject cards, STORY_SESSION initiation
- [ ] 03-04-PLAN.md -- Sprint management: CRUD, sprint list, split-view planning with drag-and-drop
- [ ] 03-05-PLAN.md -- Sprint board kanban and dashboard with burndown chart
- [ ] 03-06-PLAN.md -- Sprint intelligence: conflict detection Inngest function, dependency suggestions

**UI hint**: yes

### Phase 4: Salesforce Org Connectivity and Developer Integration
**Goal**: The platform connects to live Salesforce orgs, builds an org knowledge base from metadata, and exposes a REST API that Claude Code consumes for context-aware development
**Depends on**: Phase 3
**Requirements**: ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, DEV-01, DEV-02, DEV-03, DEV-04, DEV-05
**Success Criteria** (what must be TRUE):
  1. User can connect a Salesforce org via OAuth and the system performs incremental metadata sync on a schedule
  2. Brownfield ingestion pipeline processes org metadata through Parse > Classify > Synthesize > Articulate, with AI-suggested domain groupings confirmed by the architect
  3. Claude Code can call the REST API to retrieve context packages (story details, business processes, knowledge articles, decisions, sprint conflicts) and update story status
  4. Org components are mapped to business processes with the isConfirmed pattern for human oversight
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

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
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 > 2 > 3 > 4 > 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Data Layer | 3/3 | Complete | - |
| 2. Discovery and Knowledge Brain | 12/12 | Complete | - |
| 3. Story Management and Sprint Intelligence | 0/8 | Planned | - |
| 4. Salesforce Org Connectivity and Developer Integration | 0/3 | Not started | - |
| 5. Document Generation, QA, and Administration | 0/3 | Not started | - |
