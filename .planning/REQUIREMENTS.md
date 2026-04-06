# Requirements: Salesforce Consulting AI Framework

**Defined:** 2026-04-04
**Core Value:** The AI must retain and build understanding across sessions — every discovery conversation, transcript, question, and decision feeds a persistent knowledge base that makes the AI progressively smarter about each project's business context.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication and Security

- [ ] **AUTH-01**: User can sign up and log in with email/password via Clerk
- [ ] **AUTH-02**: User session persists across browser refresh
- [ ] **AUTH-03**: User is assigned a project-level role (SA, PM, BA, Developer, QA) that controls visible features
- [ ] **AUTH-04**: All data queries are scoped to the active project — no cross-project data leakage
- [ ] **AUTH-05**: Salesforce org credentials are encrypted at rest using per-project derived keys (HKDF-SHA256)
- [ ] **AUTH-06**: Access to sensitive operations is logged for audit trail

### Project Management

- [ ] **PROJ-01**: User can create a new project with name, client, engagement type, and sandbox strategy
- [ ] **PROJ-02**: User can view and edit project settings and team membership
- [ ] **PROJ-03**: User can invite team members and assign project-level roles
- [ ] **PROJ-04**: PM can archive a completed project (read-only state, data retained)
- [ ] **PROJ-05**: PM can reactivate an archived project for follow-on engagements

### Question System

- [ ] **QUES-01**: User can raise a question manually with category, scope assignment, and priority
- [ ] **QUES-02**: AI can raise questions automatically during transcript processing or story generation
- [ ] **QUES-03**: Question owner can answer a question with source attribution
- [x] **QUES-04**: Answering a question triggers AI impact assessment (unblocks, contradictions, new questions)
- [x] **QUES-05**: Questions have a full lifecycle: Open > Scoped > Owned > Answered > Reviewed
- [ ] **QUES-06**: Questions are linked to relevant entities (epics, features, stories, decisions)
- [ ] **QUES-07**: SA can flag answered questions for review when confidence is below threshold
- [ ] **QUES-08**: User can filter and search questions by status, category, scope, owner, and priority

### AI Agent Harness

- [ ] **AGENT-01**: Three-layer architecture: task definitions, execution engine, context assembly
- [ ] **AGENT-02**: Task definitions specify required context, token budget, output schema, and validation rules
- [ ] **AGENT-03**: Execution engine manages AI calls with retry logic, token tracking, and cost recording
- [ ] **AGENT-04**: Context assembly builds scoped context packages from multiple data sources within token budgets
- [ ] **AGENT-05**: AI handles ambiguity context-dependently: ask inline when user present, best-guess + flag in task sessions, flag-only in background jobs
- [ ] **AGENT-06**: All AI interactions are logged with token usage, cost, and session linkage

### Transcript Processing

- [x] **TRNS-01**: User can upload or paste a meeting transcript (up to ~10K words)
- [x] **TRNS-02**: AI extracts questions, decisions, requirements, and risks from the transcript
- [x] **TRNS-03**: Extracted items are deduplicated against existing project data before filing
- [x] **TRNS-04**: AI assigns scope (epic/feature) to extracted items based on project context
- [x] **TRNS-05**: Transcript processing runs as a multi-step agent loop with user confirmation at key points
- [x] **TRNS-06**: Processing status and results are visible in the chat session interface

### Chat Interface

- [ ] **CHAT-01**: Each project has one general chat for quick discovery and ad-hoc AI interaction
- [ ] **CHAT-02**: Task-specific chat sessions exist for heavy-lift operations (transcript processing, story generation, briefings)
- [ ] **CHAT-03**: All conversations persist with full message history
- [ ] **CHAT-04**: Chat supports streaming AI responses
- [x] **CHAT-05**: Token usage and cost are tracked per chat session

### Knowledge Architecture

- [x] **KNOW-01**: Structured BusinessProcess relationships are stored in Postgres and queryable
- [x] **KNOW-02**: AI-curated KnowledgeArticles synthesize understanding into versioned, persistent documents
- [x] **KNOW-03**: Knowledge articles track staleness and trigger re-synthesis when underlying data changes
- [x] **KNOW-04**: Article refresh runs as Inngest background jobs, not inline
- [ ] **KNOW-05**: Two-pass context retrieval: load summaries first, then full content for most relevant articles
- [x] **KNOW-06**: AI proactively identifies discovery gaps and assesses readiness to start building
- [x] **KNOW-07**: New information that contradicts existing decisions is automatically flagged as a conflict

### Search

- [x] **SRCH-01**: Filtered search across all entities by type, status, category, and other structured fields
- [x] **SRCH-02**: Full-text search via PostgreSQL tsvector for exact keyword matching
- [x] **SRCH-03**: Semantic search via pgvector embeddings for meaning-based retrieval
- [x] **SRCH-04**: Embeddings are generated by Inngest background jobs on entity create/update

### Discovery Dashboard

- [x] **DASH-01**: Dashboard shows outstanding questions count by status and category
- [x] **DASH-02**: Dashboard shows blocked items and dependency chains
- [x] **DASH-03**: Dashboard shows project health score derived from discovery completeness
- [x] **DASH-04**: AI synthesis cache provides "Current Focus" and "Recommended Focus" summaries
- [x] **DASH-05**: Dashboard data refreshes via Inngest-triggered cached synthesis

### Notifications

- [x] **NOTF-01**: In-app notification system with bell icon and unread count
- [x] **NOTF-02**: Notifications fire for 10 defined event types (question assigned, answer posted, story status change, etc.)
- [x] **NOTF-03**: Notifications are priority-based and dispatched via Inngest background jobs
- [x] **NOTF-04**: User can mark notifications as read individually or in bulk

### Background Infrastructure

- [ ] **INFRA-01**: Inngest event-driven background job infrastructure with automatic retries
- [ ] **INFRA-02**: Step functions with checkpoints for long-running operations (transcript processing, embedding gen)
- [x] **INFRA-03**: Background jobs for: article refresh, dashboard synthesis, embedding generation, notification dispatch
- [ ] **INFRA-04**: Optimistic concurrency control with version-based conflict detection on concurrent edits

### Epic, Feature, and User Story Management

- [x] **WORK-01**: User can create and manage epics with hierarchy: epic > feature > user story
- [x] **WORK-02**: Stories have mandatory fields enforced by validation (acceptance criteria, impacted components, etc.)
- [x] **WORK-03**: User can edit and delete own stories; PM/SA can edit any story
- [x] **WORK-04**: Story status workflow: Draft > Ready > Sprint Planned > In Progress > In Review > QA > Done
- [x] **WORK-05**: PM manages lifecycle states, developers manage execution states, auto-transition on sprint assignment
- [x] **WORK-06**: AI-assisted story generation from requirements and discovery context
- [x] **WORK-07**: Each story tracks impacted Salesforce components (creates/modifies/deletes) via StoryComponent join

### Sprint Management

- [x] **SPRT-01**: PM can create sprints with start/end dates and capacity
- [x] **SPRT-02**: PM can assign stories to sprints
- [x] **SPRT-03**: Sprint intelligence detects component-level conflicts between stories in the same sprint
- [x] **SPRT-04**: Sprint intelligence suggests dependency ordering and parallelization opportunities
- [x] **SPRT-05**: Sprint dashboard shows progress, velocity, and burndown

### Salesforce Org Connectivity

- [x] **ORG-01**: User can connect a Salesforce org via OAuth
- [ ] **ORG-02**: Periodic metadata sync (incremental + full refresh) stores normalized component data
- [x] **ORG-03**: Org knowledge base tables: OrgComponent, OrgRelationship, DomainGrouping
- [ ] **ORG-04**: Brownfield org ingestion pipeline: Parse > Classify > Synthesize > Articulate (4-phase)
- [ ] **ORG-05**: AI maps org components to business processes with human confirmation (isConfirmed pattern)
- [ ] **ORG-06**: Domain groupings with AI suggestion and architect confirmation

### Developer Integration

- [ ] **DEV-01**: REST API exposes context package assembly for Claude Code consumption
- [ ] **DEV-02**: Context packages include: story details, business processes, knowledge articles, related decisions, sprint conflicts
- [ ] **DEV-03**: REST API supports org metadata queries for Claude Code skills
- [ ] **DEV-04**: REST API supports story status updates from Claude Code
- [ ] **DEV-05**: Claude Code skills updated to consume the web app API

### Document Generation

- [ ] **DOC-01**: PM can generate branded documents (Word, PowerPoint, PDF) from project context
- [ ] **DOC-02**: Documents are populated by AI using project knowledge base content
- [ ] **DOC-03**: Generated documents are stored in S3/R2 with version tracking
- [ ] **DOC-04**: Branding templates enforce firm visual identity

### QA Workflow

- [ ] **QA-01**: QA can record test execution results (Pass/Fail/Blocked) with notes per test case
- [ ] **QA-02**: QA can create and manage defects linked to stories
- [ ] **QA-03**: Defect lifecycle: Open > In Progress > Fixed > Verified > Closed

### Project Administration

- [ ] **ADMIN-01**: Optional one-directional push sync to client Jira instance
- [ ] **ADMIN-02**: PM dashboard with aggregated views across project dimensions
- [ ] **ADMIN-03**: Usage and cost tracking for AI token consumption per project

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Collaboration

- **V2-COLLAB-01**: Real-time collaborative editing via CRDT/OT infrastructure
- **V2-COLLAB-02**: Activity feed / change history UI

### AI Enhancements

- **V2-AI-01**: Provider-agnostic AI abstraction layer (support GPT, Gemini alongside Claude)
- **V2-AI-02**: AI output quality benchmarking and evaluation framework
- **V2-AI-03**: Large transcript handling (20K+ words) with chunked processing

### Notifications

- **V2-NOTF-01**: Email notifications for critical events
- **V2-NOTF-02**: Push notifications

### Authentication

- **V2-AUTH-01**: OAuth login providers (Google, GitHub)

### Administration

- **V2-ADMIN-01**: Firm administrator UI for managing settings, branding, guardrails
- **V2-ADMIN-02**: Cross-project learning and template library (with data isolation)

### Developer

- **V2-DEV-01**: Git repository management from web app
- **V2-DEV-02**: Playwright test result auto-import

### Access

- **V2-ACCESS-01**: Full QA access to chat, decisions, and transcripts (V1: questions + draft stories only)
- **V2-ACCESS-02**: Developer access to transcript processing (V1: SA/BA only)

### Mobile

- **V2-MOBILE-01**: Mobile-optimized responsive views for dashboard and notifications

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native mobile app | Web-first; primary use cases need desktop-class interface. Responsive web sufficient for V1. |
| Bidirectional Jira sync | Split-brain problem. One-directional push avoids reconciliation complexity. |
| Real-time collaborative editing | CRDT/OT infrastructure too complex for solo builder. Optimistic concurrency handles realistic scenarios. |
| Provider-agnostic AI layer | Premature optimization. Claude-only in V1 with clean module boundary for future swap. |
| Email/push notifications | In-app only sufficient for 5-30 internal users. Infrastructure cost not justified in V1. |
| Firm admin UI | Settings change rarely. Firm owner (also the developer) updates config in code. |
| Git management from web app | Web app is management/knowledge layer. Git is developer tooling. Clean boundary. |
| Cross-project data sharing | Hard constraint from client NDAs. Project-level data isolation is non-negotiable. |
| Large transcript handling (20K+) | Token costs scale linearly. V1 cap at ~10K words; users split longer transcripts. |
| Playwright test integration | Manual test recording simpler for V1. QAs add context with Pass/Fail notes. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| PROJ-01 | Phase 1 | Pending |
| PROJ-02 | Phase 1 | Pending |
| PROJ-03 | Phase 1 | Pending |
| PROJ-04 | Phase 5 | Pending |
| PROJ-05 | Phase 5 | Pending |
| QUES-01 | Phase 2 | Pending |
| QUES-02 | Phase 2 | Pending |
| QUES-03 | Phase 2 | Pending |
| QUES-04 | Phase 2 | Complete |
| QUES-05 | Phase 2 | Complete |
| QUES-06 | Phase 2 | Pending |
| QUES-07 | Phase 2 | Pending |
| QUES-08 | Phase 2 | Pending |
| AGENT-01 | Phase 2 | Pending |
| AGENT-02 | Phase 2 | Pending |
| AGENT-03 | Phase 2 | Pending |
| AGENT-04 | Phase 2 | Pending |
| AGENT-05 | Phase 2 | Pending |
| AGENT-06 | Phase 2 | Pending |
| TRNS-01 | Phase 2 | Complete |
| TRNS-02 | Phase 2 | Complete |
| TRNS-03 | Phase 2 | Complete |
| TRNS-04 | Phase 2 | Complete |
| TRNS-05 | Phase 2 | Complete |
| TRNS-06 | Phase 2 | Complete |
| CHAT-01 | Phase 2 | Pending |
| CHAT-02 | Phase 2 | Pending |
| CHAT-03 | Phase 2 | Pending |
| CHAT-04 | Phase 2 | Pending |
| CHAT-05 | Phase 2 | Complete |
| KNOW-01 | Phase 2 | Complete |
| KNOW-02 | Phase 2 | Complete |
| KNOW-03 | Phase 2 | Complete |
| KNOW-04 | Phase 2 | Complete |
| KNOW-05 | Phase 2 | Pending |
| KNOW-06 | Phase 2 | Complete |
| KNOW-07 | Phase 2 | Complete |
| SRCH-01 | Phase 2 | Complete |
| SRCH-02 | Phase 2 | Complete |
| SRCH-03 | Phase 2 | Complete |
| SRCH-04 | Phase 2 | Complete |
| DASH-01 | Phase 2 | Complete |
| DASH-02 | Phase 2 | Complete |
| DASH-03 | Phase 2 | Complete |
| DASH-04 | Phase 2 | Complete |
| DASH-05 | Phase 2 | Complete |
| NOTF-01 | Phase 2 | Complete |
| NOTF-02 | Phase 2 | Complete |
| NOTF-03 | Phase 2 | Complete |
| NOTF-04 | Phase 2 | Complete |
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 2 | Complete |
| INFRA-04 | Phase 1 | Pending |
| WORK-01 | Phase 3 | Complete |
| WORK-02 | Phase 3 | Complete |
| WORK-03 | Phase 3 | Complete |
| WORK-04 | Phase 3 | Complete |
| WORK-05 | Phase 3 | Complete |
| WORK-06 | Phase 3 | Complete |
| WORK-07 | Phase 3 | Complete |
| SPRT-01 | Phase 3 | Complete |
| SPRT-02 | Phase 3 | Complete |
| SPRT-03 | Phase 3 | Complete |
| SPRT-04 | Phase 3 | Complete |
| SPRT-05 | Phase 3 | Complete |
| ORG-01 | Phase 4 | Complete |
| ORG-02 | Phase 4 | Pending |
| ORG-03 | Phase 4 | Complete |
| ORG-04 | Phase 4 | Pending |
| ORG-05 | Phase 4 | Pending |
| ORG-06 | Phase 4 | Pending |
| DEV-01 | Phase 4 | Pending |
| DEV-02 | Phase 4 | Pending |
| DEV-03 | Phase 4 | Pending |
| DEV-04 | Phase 4 | Pending |
| DEV-05 | Phase 4 | Pending |
| DOC-01 | Phase 5 | Pending |
| DOC-02 | Phase 5 | Pending |
| DOC-03 | Phase 5 | Pending |
| DOC-04 | Phase 5 | Pending |
| QA-01 | Phase 5 | Pending |
| QA-02 | Phase 5 | Pending |
| QA-03 | Phase 5 | Pending |
| ADMIN-01 | Phase 5 | Pending |
| ADMIN-02 | Phase 5 | Pending |
| ADMIN-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 93 total
- Mapped to phases: 93
- Unmapped: 0

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after roadmap creation*
