# PRD + Addendum Requirement Index

**Generated:** 2026-04-13
**Last Updated:** 2026-04-15 (Phase 6 split into 6a Five-Layer Org KB + 6b Org Health Assessment; phase-hint column retagged)
**Sources:** docs/bef/00-prd/PRD.md, docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md

## ID Scheme
- `PRD-<section>-<nn>` — atomic requirement from base PRD
- `ADD-<section>-<nn>` — atomic requirement from Addendum
- Addendum supersedes PRD §6 (AI Harness) and §13 (Org KB) in substance — see Supersedes column. For those sections the Addendum rows replace PRD rows in implementation; PRD rows still appear here as external-behavior baselines.

## Requirement Rows

| ID | Source | Section | Requirement | Supersedes | Phase-hint |
|----|--------|---------|-------------|------------|------------|
| PRD-1-01 | PRD | §1 Executive Summary | Application serves as the firm's single system of record for all project work across PMs, BAs, QAs, SAs, and developers. | — | Cross-cutting |
| PRD-1-02 | PRD | §1 Executive Summary | The AI maintains a persistent, progressively-built project brain that carries context across sessions. | — | Cross-cutting |
| PRD-1-03 | PRD | §1 Executive Summary | Developers work in Claude Code via custom skills that call the web application's REST API for context. | — | 5 |
| PRD-1-04 | PRD | §1 Executive Summary | The web application must never deploy to any Salesforce environment (generates source and artifacts only). | — | Cross-cutting |
| PRD-1-05 | PRD | §1 Executive Summary | Every project instance must be fully isolated so client data is never shared across projects. | — | Cross-cutting |
| PRD-1-06 | PRD | §1 Executive Summary | Architecture must support clean tenant boundaries for potential future productization. | — | Cross-cutting |
| PRD-3-01 | PRD | §3 Product Vision and Scope | Web app is the primary interface for PMs, BAs, QAs, and architects to manage discovery, stories, dashboards, and deliverables. | — | Cross-cutting |
| PRD-3-02 | PRD | §3 Product Vision and Scope | Claude Code with custom skills is the code execution environment for developers and SAs; code is not authored in the web app. | — | 5 |
| PRD-3-03 | PRD | §3 Product Vision and Scope | Web app exposes a REST API consumed by Claude Code skills as the clean boundary between management and execution. | — | 5 |
| PRD-3-04 | PRD | §3 Product Vision and Scope | AI layer is optimized for Claude (Anthropic) in V1 with no provider-agnostic abstraction. | — | Cross-cutting |
| PRD-3-05 | PRD | §3 Product Vision and Scope | Claude integration is built as a cleanly separated module so a second provider could be added in V2. | — | 11, 2 |
| PRD-3-06 | PRD | §3 Product Vision and Scope | AI operates in distinct task modes (discovery processing, story generation, briefings, document generation, developer context assembly). | — | 2 |
| PRD-3-07 | PRD | §3 Product Vision and Scope | The web application does not create or manage Git repositories. | — | Cross-cutting |
| PRD-3-08 | PRD | §3 Product Vision and Scope | Each project connects to a single shared Salesforce sandbox for org knowledge. | — | 6a |
| PRD-4-01 | PRD | §4 Target Users | The Solution Architect role can set up projects, connect the sandbox, configure settings, and grant/revoke member access. | — | 1 (out-of-scope, audit-only) |
| PRD-4-02 | PRD | §4 Target Users | The Developer role picks up assigned tickets in the web app and executes them in Claude Code. | — | 5 |
| PRD-4-03 | PRD | §4 Target Users | The Project Manager role uses the web app for sprints, dashboards, deliverables, and AI briefings without touching code. | — | 4, 7 |
| PRD-4-04 | PRD | §4 Target Users | The Business Analyst role logs discovery findings by chatting with the AI and manages requirements and stories. | — | 3, 4 |
| PRD-4-05 | PRD | §4 Target Users | The QA Engineer role views test plans, executes tests, marks pass/fail, and logs defects. | — | 9 |
| PRD-4-06 | PRD | §4 Target Users | The Firm Administrator role in V1 is the application owner; firm-level settings are configured in code and DB, not via admin UI. | — | Cross-cutting |
| PRD-5-01 | PRD | §5.1 High-Level Components | The web application is built on Next.js (App Router) and deployed on Vercel. | — | Cross-cutting |
| PRD-5-02 | PRD | §5.1 High-Level Components | The primary data store is PostgreSQL hosted on Neon or Supabase. | — | Cross-cutting |
| PRD-5-03 | PRD | §5.1 High-Level Components | File storage for generated deliverables and attachments uses S3 or Cloudflare R2. | — | 8 |
| PRD-5-04 | PRD | §5.1 High-Level Components | An AI Agent Harness server-side module manages all AI interactions including prompt construction, tool definitions, execution, and validation. | ADD-5.1-01..05 | 2 |
| PRD-5-05 | PRD | §5.1 High-Level Components | Background job infrastructure runs on Inngest over Vercel serverless functions for all asynchronous work. | — | 11 |
| PRD-5-06 | PRD | §5.1 High-Level Components | All state changes emit Inngest events and job handlers subscribe to relevant events. | — | 11, 8 |
| PRD-5-07 | PRD | §5.1 High-Level Components | Inngest step functions with checkpoints allow long-running jobs to resume from the last successful step on failure. | — | 6a, 6b, 11 |
| PRD-5-08 | PRD | §5.1 High-Level Components | Claude Code skills are maintained external to the web app and call its REST API for context. | — | 5 |
| PRD-5-09 | PRD | §5.1 High-Level Components | The Salesforce org connection is read-only against one shared team sandbox per project. | — | 6a |
| PRD-5-10 | PRD | §5.2.1 Core Entities | The data model includes Project, ProjectMember, Epic, EpicPhase, Feature, Story, Question, Decision, Requirement, Risk, Milestone, Sprint, TestCase, TestExecution, Defect, OrgComponent, OrgRelationship, DomainGrouping, BusinessContextAnnotation, GeneratedDocument, Transcript, SessionLog, Attachment, VersionHistory, BusinessProcess, KnowledgeArticle, Conversation, ChatMessage, Notification. | ADD-7-01..15 | 11, 2, 3, 4, 6a, 6b |
| PRD-5-11 | PRD | §5.2.1 Core Entities | EpicPhase tracks per-epic status (NOT_STARTED/IN_PROGRESS/COMPLETE/SKIPPED) across Discovery, Design, Build, Test, Deploy phases. | — | 4 |
| PRD-5-12 | PRD | §5.2.1 Core Entities | Stories may exist in Draft with incomplete mandatory fields; validation enforces on transition to Ready. | — | 4 |
| PRD-5-13 | PRD | §5.2.1 Core Entities | Developer-created atomic implementation tasks within a Claude Code session are not persisted in the web application. | — | 5 |
| PRD-5-14 | PRD | §5.2.1 Core Entities | Story has a nullable test-assignee FK; "Story moved to QA" notifications fall back to all QA members when null. | — | 8, 9 |
| PRD-5-15 | PRD | §5.2.1 Core Entities | Sprint carryover history between sprints is not tracked in V1. | — | 5 |
| PRD-5-16 | PRD | §5.2.1 Core Entities | TestCase is a separate record per test scenario, not a JSON array on the story. | — | 9 |
| PRD-5-17 | PRD | §5.2.1 Core Entities | Defect lifecycle is Open → Assigned → Fixed → Verified → Closed with explicit role ownership for each transition. | — | 9 |
| PRD-5-18 | PRD | §5.2.1 Core Entities | KnowledgeArticle stores type, title, markdown content, one-line summary, confidence, version, staleness fields, author type, and vector embedding. | ADD-4.5-01, ADD-4.5-02 | 6a |
| PRD-5-19 | PRD | §5.2.1 Core Entities | KnowledgeArticle references multiple entities via a polymorphic KnowledgeArticleReference join table. | — | 6a |
| PRD-5-20 | PRD | §5.2.1 Core Entities | Each project has one auto-created general chat Conversation plus on-demand task-specific sessions. | — | 3 |
| PRD-5-21 | PRD | §5.2.1 Core Entities | Chat messages are append-only. | — | 3 |
| PRD-5-22 | PRD | §5.2.1 Core Entities | Every task session maps to exactly one SessionLog for cost tracking. | — | 2, 11 |
| PRD-5-23 | PRD | §5.2.1 Core Entities | SessionLog records project, user, task type, timestamps, status, token usage, summary, and entity references. | — | 2, 11 |
| PRD-5-24 | PRD | §5.2.1 Core Entities | Notification stores type, title, optional body, entity reference, and read status; V1 is in-app only. | — | 8 |
| PRD-5-25 | PRD | §5.2.1 Core Entities | Attachments are supported on defects, stories, questions, and other entities with entityType + entityId reference. | — | 4, 9 |
| PRD-5-26 | PRD | §5.2.1 Core Entities | VersionHistory captures previous entity state (JSON snapshot) to support optimistic concurrency conflict resolution. | — | 1 (out-of-scope, audit-only), 4 |
| PRD-5-27 | PRD | §5.2.1 Core Entities | BusinessProcess entities carry status DISCOVERED/DOCUMENTED/CONFIRMED/DEPRECATED with complexity rating LOW/MEDIUM/HIGH/CRITICAL. | — | 6a |
| PRD-5-28 | PRD | §5.2.2 Computed Views | Milestone progress percentage is AI-derived from linked story completion and blocking question resolution, not stored. | — | 7 |
| PRD-5-29 | PRD | §5.2.2 Computed Views | Project health score is computed from stale questions, blocked items, and risk thresholds. | — | 7 |
| PRD-5-30 | PRD | §5.2.2 Computed Views | "Current Focus" narrative and "Recommended Focus" prioritization are AI-synthesized. | ADD-5.2.4-01 | 7, 2 |
| PRD-5-31 | PRD | §5.2.2 Computed Views | Sprint conflict alerts are detected from overlapping impacted components across in-flight stories. | — | 5 |
| PRD-5-32 | PRD | §5.2.3 Join Tables | Many-to-many relationships use explicit join tables including QuestionBlocksStory/Epic/Feature, QuestionAffects, DecisionQuestion, DecisionScope, RequirementEpic, RequirementStory, RiskEpic, StoryComponent, MilestoneStory, BusinessProcessComponent, BusinessProcessDependency, KnowledgeArticleReference. | — | 3, 4, 6a |
| PRD-5-33 | PRD | §5.2.3 Join Tables | StoryComponent records carry impactType CREATE/MODIFY/DELETE. | — | 4 |
| PRD-5-34 | PRD | §5.3 API Design | GET /api/projects/:projectId/context-package/:storyId returns the assembled story context package for Claude Code. | ADD-4.6-03..05 | 5 |
| PRD-5-35 | PRD | §5.3 API Design | GET /api/projects/:projectId/org/query returns filtered org metadata from the knowledge base on demand. | ADD-4.6-06 | 5, 6a |
| PRD-5-36 | PRD | §5.3 API Design | PATCH /api/projects/:projectId/stories/:storyId/status updates story status from Claude Code. | — | 5 |
| PRD-5-37 | PRD | §5.3 API Design | POST /api/projects/:projectId/org/component-report accepts developer reports of components created or modified for a story. | — | 5 |
| PRD-5-38 | PRD | §5.3 API Design | GET /api/projects/:projectId/summary returns the compact Tier 1 project summary. | — | 5 |
| PRD-5-39 | PRD | §5.3 API Design | All API endpoints require authentication and are scoped to the requesting user's project access and role. | — | 1 (out-of-scope, audit-only), 5 |
| PRD-5-40 | PRD | §5.4 Authentication | Authentication is handled by Clerk; every consultant has their own account. | — | 1 (out-of-scope, audit-only) |
| PRD-5-41 | PRD | §5.4 Authentication | Role assignment is per-project (SOLUTION_ARCHITECT, DEVELOPER, PM, BA, QA). | — | 1 (out-of-scope, audit-only) |
| PRD-6-01 | PRD | §6.1 Harness Responsibilities | The AI agent harness is the single point through which all AI requests flow. | ADD-5.1-01 | 2, 11 |
| PRD-6-02 | PRD | §6.1 Harness Responsibilities | The harness enriches every prompt with task instructions, project context, firm-level constraints, and role-appropriate boundaries. | ADD-5.2.1-01..07, ADD-5.2.2-01..06, ADD-5.2.3-01..07, ADD-5.2.4-01..05 | 2 |
| PRD-6-03 | PRD | §6.1 Harness Responsibilities | The harness defines per-task tool sets with read/write scopes appropriate to the task. | ADD-5.3-01..06 | 2 |
| PRD-6-04 | PRD | §6.1 Harness Responsibilities | The harness manages single-turn and multi-step execution with token tracking and max iteration limits. | ADD-5.1-01, ADD-5.2.1-02..07 | 2 |
| PRD-6-05 | PRD | §6.1 Harness Responsibilities | The harness validates AI output against applicable rules and re-prompts on failure up to a configurable retry limit. | ADD-5.2.1-07, ADD-5.2.3-06 | 2 |
| PRD-6-06 | PRD | §6.1 Harness Responsibilities | The harness tracks token usage per request, project, and user. | — | 2, 7 |
| PRD-6-07 | PRD | §6.1 Harness Responsibilities | The harness manages context window budget by selecting, summarizing, and monitoring context size against provider limits. | ADD-4.6-07 | 2, 5 |
| PRD-6-08 | PRD | §6.2 Task Types | The harness supports Transcript Processing, Question Answering, Story Generation, Story Enrichment, Briefing Generation, Status Report Generation, Document Generation, Sprint Analysis, Context Package Assembly, Org Query, and Discovery Dashboard Synthesis task types. | ADD-5.2.1, ADD-5.2.2, ADD-5.2.3, ADD-5.2.4, ADD-4.6-03 | 2 |
| PRD-6-09 | PRD | §6.3 Firm-Level Rules | The harness forbids em dashes in AI-generated text. | — | 2 |
| PRD-6-10 | PRD | §6.3 Firm-Level Rules | The harness forbids AI-characteristic phrasing in generated text. | — | 2 |
| PRD-6-11 | PRD | §6.3 Firm-Level Rules | Generated text must use consistent Month DD, YYYY date format. | — | 2 |
| PRD-6-12 | PRD | §6.3 Firm-Level Rules | Generated text must follow firm terminology and capitalization conventions. | — | 2 |
| PRD-6-13 | PRD | §6.3 Firm-Level Rules | Mandatory story fields are enforced before any story can be marked as Ready. | — | 4 |
| PRD-6-14 | PRD | §6.3 Firm-Level Rules | Salesforce guardrails are enforced in Claude Code skills, not in the web app harness. | — | 5 |
| PRD-6-15 | PRD | §6.4 Implementation Architecture | Each task type is defined as a TypeScript config object with system prompt template, context loader, tool definitions, output validator, and execution mode. | ADD-5.1-01, ADD-5.2.1..5.2.4 | 2 |
| PRD-6-16 | PRD | §6.4 Implementation Architecture | A generic execution engine runs the context load → prompt assembly → Claude call → tool execution loop → validation → session log → return. | ADD-5.1-01 | 2 |
| PRD-6-17 | PRD | §6.4 Implementation Architecture | Reusable context assembly functions (getProjectSummary, getEpicContext, getOpenQuestions, getOrgComponents, etc.) are composed by task-specific loaders. | ADD-5.4-01 | 2 |
| PRD-6-18 | PRD | §6.4 Implementation Architecture | Each AI tool call commits independently; no rollback if the loop fails partway. | — | 2 |
| PRD-6-19 | PRD | §6.4 Implementation Architecture | Transcript processing is budgeted at ~4-8 loop iterations with 15-20K input tokens per iteration. | ADD-5.2.1-02 | 2 |
| PRD-6-20 | PRD | §6.5 Dashboard Synthesis | Quantitative dashboard data is served from Postgres queries with no AI involvement. | — | 7 |
| PRD-6-21 | PRD | §6.5 Dashboard Synthesis | Qualitative dashboard content (Current Focus, Recommended Focus, briefings) is AI-generated and cached with a generation timestamp. | ADD-5.2.4-05 | 7, 2 |
| PRD-6-22 | PRD | §6.5 Dashboard Synthesis | Cached AI synthesis is regenerated on meaningful state changes or explicit user refresh, not on every page load. | — | 7 |
| PRD-6-23 | PRD | §6.6 Ambiguity Handling | In general chat, the AI must ask an inline clarifying question when uncertain and proceed once answered. | — | 2, 3 |
| PRD-6-24 | PRD | §6.6 Ambiguity Handling | In task sessions, the AI makes a best guess, flags low confidence, and surfaces flagged items in a Needs Review list. | ADD-5.2.1-05 | 2 |
| PRD-6-25 | PRD | §6.6 Ambiguity Handling | In background jobs, the AI makes a best guess and flags the item (no user to ask). | — | 11, 2 |
| PRD-6-26 | PRD | §6.6 Ambiguity Handling | Question, Decision, Requirement, and Risk entities carry confidence (HIGH/MEDIUM/LOW), needsReview, and reviewReason fields. | — | 2, 3 |
| PRD-7-01 | PRD | §7.1 Project Creation | A solution architect creates a project by providing client, engagement type, team members, and sandbox connection details. | — | 9 |
| PRD-7-02 | PRD | §7.1 Project Creation | Project creation provisions the data space, creates default epic templates by engagement type, and triggers initial org metadata sync. | — | 9, 6a |
| PRD-7-03 | PRD | §7.1 Project Creation | There is no structured onboarding interview; the AI brain accumulates knowledge through progressive discovery. | — | 3 |
| PRD-7-04 | PRD | §7.2 Standard Phases | Every project progresses through Discovery, Requirements/Story Definition, Solution Design, Build, Testing, Deployment, Hypercare/Handoff, Archive. | — | 9 |
| PRD-7-05 | PRD | §7.2 Standard Phases | The active phase determines which dashboard views are emphasized and which AI capabilities are highlighted. | — | 7, 9 |
| PRD-7-06 | PRD | §7.3 Engagement Types | Supported engagement types are Greenfield, Build Phase, Managed Services, and Rescue/Takeover. | — | 9 |
| PRD-7-07 | PRD | §7.3 Engagement Types | Engagement type affects which phases are emphasized, which default epics are created, and how the AI prioritizes assistance. | — | 9 |
| PRD-7-08 | PRD | §7.4 Context Evolution | Every interaction that adds to the knowledge base is recorded in a session log for audit trail. | — | 2, 11 |
| PRD-7-09 | PRD | §7.4 Context Evolution | The AI can reference previous sessions to maintain coherence across conversations. | — | 2, 3 |
| PRD-8-01 | PRD | §8.1 Discovery Core | Discovery is modeled as a first-class product feature, not just a project phase. | — | 3 |
| PRD-8-02 | PRD | §8.1 Discovery Core | When the AI receives unstructured discovery information, it must record it as an answer to an existing question or as a new decision. | ADD-5.2.2-03 | 3, 2 |
| PRD-8-03 | PRD | §8.1 Discovery Core | The AI must link new discovery information to relevant epic(s) and feature(s). | ADD-5.2.2-04 | 3 |
| PRD-8-04 | PRD | §8.1 Discovery Core | The AI must check whether a new answer changes any existing technical design or assumption. | ADD-5.2.2-04 | 3, 2 |
| PRD-8-05 | PRD | §8.1 Discovery Core | The AI must check whether a new answer unblocks any work items. | ADD-5.2.2-04 | 3 |
| PRD-8-06 | PRD | §8.1 Discovery Core | The AI must check whether a new answer raises new questions. | ADD-5.2.2-04 | 3 |
| PRD-8-07 | PRD | §8.1 Discovery Core | The AI must update the knowledge base when discovery information is recorded. | ADD-5.2.2-05 | 3, 6a |
| PRD-8-08 | PRD | §8.2 Information Input | A single general project chat Conversation exists per project, shared among members with chat permission. | — | 3 |
| PRD-8-09 | PRD | §8.2 Information Input | Each general chat message triggers an independent harness call with no conversational memory of prior messages. | — | 3, 2 |
| PRD-8-10 | PRD | §8.2 Information Input | The general chat context injection loads the most recent 50 messages or last 7 days, whichever is smaller (per-project configurable). | — | 3 |
| PRD-8-11 | PRD | §8.2 Information Input | Task sessions run as a single agent invocation with full tool-use loop and map to one SessionLog. | ADD-5.1-02 | 2, 3 |
| PRD-8-12 | PRD | §8.2 Information Input | If a task session is interrupted, artifacts persist but the session is marked FAILED and a new one must be started. | — | 2 |
| PRD-8-13 | PRD | §8.2 Information Input | Transcripts of any source can be uploaded and processed by the AI to extract questions, answers, decisions, requirements, action items, and scope changes. | ADD-5.2.1-01..07 | 2, 3 |
| PRD-8-14 | PRD | §8.2 Information Input | The raw transcript is saved for reference after processing. | — | 2, 3 |
| PRD-8-15 | PRD | §8.2 Information Input | Users can raise or answer questions directly through the UI, independent of chat. | — | 3 |
| PRD-8-16 | PRD | §8.3 Discovery Intelligence | The AI performs Gap Detection by identifying areas where insufficient information has been gathered, per epic. | — | 3 |
| PRD-8-17 | PRD | §8.3 Discovery Intelligence | The AI performs Readiness Assessment to suggest when enough context exists to begin creating epics/features/stories. | — | 3 |
| PRD-8-18 | PRD | §8.3 Discovery Intelligence | The AI performs Conflict Detection when new information contradicts existing decisions or assumptions. | ADD-5.2.2-04 | 3, 2 |
| PRD-8-19 | PRD | §8.3 Discovery Intelligence | The AI provides Follow-Up Recommendations ranked by what each question blocks. | — | 3, 7 |
| PRD-8-20 | PRD | §8.4 Discovery Dashboard | The discovery dashboard surfaces outstanding questions by scope with owner and age. | — | 7, 3 |
| PRD-8-21 | PRD | §8.4 Discovery Dashboard | The discovery dashboard shows AI-recommended follow-up questions with reasoning. | — | 7, 3 |
| PRD-8-22 | PRD | §8.4 Discovery Dashboard | The discovery dashboard shows recently answered questions and their impact. | — | 7 |
| PRD-8-23 | PRD | §8.4 Discovery Dashboard | The discovery dashboard shows blocked work items and what they're waiting on. | — | 7 |
| PRD-8-24 | PRD | §8.4 Discovery Dashboard | The discovery dashboard shows requirements captured but not yet mapped to epics/stories. | — | 7 |
| PRD-8-25 | PRD | §8.4 Discovery Dashboard | The discovery dashboard shows the project health score. | — | 7 |
| PRD-9-01 | PRD | §9.1 Question Lifecycle | Every question progresses through RAISED → SCOPED → OWNED → ANSWERED → IMPACT_ASSESSED. | — | 3 |
| PRD-9-02 | PRD | §9.1 Question Lifecycle | The AI must determine question scope (engagement-wide, epic, or feature) during scoping. | ADD-5.2.1-02 | 3, 2 |
| PRD-9-03 | PRD | §9.1 Question Lifecycle | Every question must have an owner (team member, client with contact name, or TBD). | — | 3 |
| PRD-9-04 | PRD | §9.1 Question Lifecycle | When a question is answered the AI must check if it changes existing design and update accordingly. | ADD-5.2.2-04 | 3, 2 |
| PRD-9-05 | PRD | §9.1 Question Lifecycle | When a question is answered the AI must flag unblocked work items. | ADD-5.2.2-04 | 3 |
| PRD-9-06 | PRD | §9.1 Question Lifecycle | When a question is answered the AI must create any new questions raised and flag contradictions with prior decisions. | ADD-5.2.2-04 | 3 |
| PRD-9-07 | PRD | §9.2 Question ID Scheme | Question IDs follow the format Q-{SCOPE}-{NUMBER} with zero-padded incrementing numbers. | — | 3 |
| PRD-9-08 | PRD | §9.2 Question ID Scheme | Epic prefixes used in question IDs must be unique within a project; uniqueness is validated on epic create/edit. | — | 3, 4 |
| PRD-9-09 | PRD | §9.3 Question Data Model | Each question record must include ID, text, scope, owner, status (Open/Answered/Parked), asked date, optional blocks, optional affects, answer, answered date, impact, and parked reason. | — | 3 |
| PRD-9-10 | PRD | §9.3 Question Data Model | Question text must be stated clearly enough that someone outside the project can understand it. | — | 3 |
| PRD-9-11 | PRD | §9.4 Cross-Cutting Questions | Cross-cutting questions are scoped Q-ENG-* with an Affects field listing touched epics, auto-identified by the AI. | — | 3 |
| PRD-10-01 | PRD | §10.1 System of Record | The web application is the primary system of record for all work items including epics, features, user stories, bugs, and tasks. | — | 4 |
| PRD-10-02 | PRD | §10.2 Hierarchy | The work item hierarchy is Epic → optional Feature → User Story → optional Task. | — | 4 |
| PRD-10-03 | PRD | §10.3 Mandatory Story Fields | Stories must have a Persona in "As a [specific user role]..." format using a concrete persona from the project's stakeholder list. | — | 4 |
| PRD-10-04 | PRD | §10.3 Mandatory Story Fields | Stories must have a Description describing what the user needs and why. | — | 4 |
| PRD-10-05 | PRD | §10.3 Mandatory Story Fields | Stories must have Acceptance Criteria in Given/When/Then format with at least one happy path and one exception scenario. | — | 4 |
| PRD-10-06 | PRD | §10.3 Mandatory Story Fields | Every story must reference its parent epic or feature. | — | 4 |
| PRD-10-07 | PRD | §10.3 Mandatory Story Fields | Stories must have Estimated Story Points populated before sprint entry (AI suggest, human confirm). | — | 4 |
| PRD-10-08 | PRD | §10.3 Mandatory Story Fields | Stories must have at least one TestCase defined; the AI generates stubs from acceptance criteria. | ADD-5.2.3-02 | 4, 9 |
| PRD-10-09 | PRD | §10.3 Mandatory Story Fields | Stories must list Impacted Salesforce Components supporting both free-text entries and linked OrgComponent references. | — | 4 |
| PRD-10-10 | PRD | §10.3 Mandatory Story Fields | When org connectivity is established, the AI suggests linking free-text component entries to matching OrgComponents. | — | 4, 6a |
| PRD-10-11 | PRD | §10.4 Story Generation Workflow | AI story generation must analyze the requirement, epic context, and related discovery knowledge. | ADD-5.2.3-01 | 4, 2 |
| PRD-10-12 | PRD | §10.4 Story Generation Workflow | AI story generation must cross-reference the org knowledge base and flag conflicts with existing components. | ADD-5.2.3-04, ADD-5.2.3-05 | 4, 6a |
| PRD-10-13 | PRD | §10.4 Story Generation Workflow | AI story generation must run mandatory field validation before allowing a story to be marked Ready. | ADD-5.2.3-03 | 4 |
| PRD-10-14 | PRD | §10.5 Story Statuses | Story statuses progress Draft → Ready → Sprint Planned → In Progress → In Review → QA → Done. | — | 4 |
| PRD-11-01 | PRD | §11.1 Sprint Planning | The AI provides Execution Mapping that orders candidate stories by dependencies across impacted components. | — | 5 |
| PRD-11-02 | PRD | §11.1 Sprint Planning | The AI provides Parallelization Analysis identifying non-overlapping stories that can run simultaneously. | — | 5 |
| PRD-11-03 | PRD | §11.1 Sprint Planning | The AI provides Conflict Detection flagging stories with overlapping impacted components. | — | 5 |
| PRD-11-04 | PRD | §11.1 Sprint Planning | The AI provides Capacity Assessment flagging over- or under-committed sprints. | — | 5 |
| PRD-11-05 | PRD | §11.2 Mid-Sprint Analysis | When tickets are added or reassigned mid-sprint the AI must re-run analysis and flag new conflicts, resequencing, or overcommit. | — | 5 |
| PRD-11-06 | PRD | §11.3 Coordination | The AI tracks which developers are working on which stories and surfaces overlap recommendations. | — | 5 |
| PRD-12-01 | PRD | §12.1 Developer Work | Developers view assigned tickets and sprint plans in the web application. | — | 5, 10 |
| PRD-12-02 | PRD | §12.2 Context Architecture | A Tier 1 project summary (1-2 pages) is always loaded in every Claude Code session. | — | 5 |
| PRD-12-03 | PRD | §12.2 Context Architecture | The Tier 1 summary covers architectural patterns, naming conventions, key decisions, the six guardrails, current sprint focus, and a map of how to request more detail. | — | 5 |
| PRD-12-04 | PRD | §12.2 Context Architecture | When a developer picks up a ticket, Claude Code calls the Context Package API to receive a Tier 2 scoped package. | ADD-4.6-03 | 5 |
| PRD-12-05 | PRD | §12.2 Context Architecture | The Tier 2 package includes the full story, acceptance criteria, test case stubs, parent epic/feature context, business processes, top knowledge articles, related discovery notes and decisions, and in-flight story conflict flags. | ADD-4.6-04 | 5 |
| PRD-12-06 | PRD | §12.2 Context Architecture | The web app performs relevance filtering for the context package via impacted-components traversal and semantic search. | ADD-4.6-04, ADD-5.4-01 | 5, 6a |
| PRD-12-07 | PRD | §12.2 Context Architecture | Tier 3a business intelligence lookups are served by the web app's REST API (org queries, knowledge articles, cross-story context). | ADD-4.6-06 | 5, 6a |
| PRD-12-08 | PRD | §12.2 Context Architecture | Tier 3b live org inspection uses SF CLI from the developer's authenticated sandbox. | — | 5 |
| PRD-12-09 | PRD | §12.3 Developer Workflow | The developer workflow is: view ticket → open Claude Code → invoke start skill → load context package → inspect sandbox → architect plan → review → execute tasks → test → update status → code review → deploy. | — | 5 |
| PRD-12-10 | PRD | §12.3 Developer Workflow | After code is merged to the shared sandbox the web app ingests it on the next org sync. | — | 6a |
| PRD-12-11 | PRD | §12.4 Claude Code Scope | Claude Code can generate any metadata type deployable via Salesforce CLI. | — | 5 |
| PRD-13-01 | PRD | §13.1 Connection Model | Each project connects to exactly one Salesforce sandbox environment. | — | 6a |
| PRD-13-02 | PRD | §13.1 Connection Model | The sandbox connection is established using OAuth 2.0 JWT Bearer Flow or Web Server Flow and credentials are encrypted per-project. | — | 6a |
| PRD-13-03 | PRD | §13.2 Read-Only Constraint | The web app and all its processes must never perform write operations against the connected Salesforce org. | — | 6a |
| PRD-13-04 | PRD | §13.3 Metadata Sync | Metadata sync covers custom/standard objects, Apex classes/triggers (inventory only), Flows/PBs/Workflows/Validation Rules, LWC/Aura, Permission Sets/Profiles/Groups, Connected Apps, Named Credentials, Remote Site Settings, installed packages, and all other SF CLI metadata types. | ADD-4.2-01 | 6a |
| PRD-13-05 | PRD | §13.3 Metadata Sync | Incremental sync runs Phases 1-2 (Parse + Classify) on the configured interval (default 4h) at near-zero AI cost. | ADD-4.7-02 | 6a |
| PRD-13-06 | PRD | §13.3 Metadata Sync | Full knowledge refresh runs Phases 3-4 (Synthesize + Articulate) manually or weekly (default Sunday 2am UTC) on unassigned components and stale articles only. | — | 6a |
| PRD-13-07 | PRD | §13.3 Metadata Sync | The initial sync at project creation runs all 4 phases. | ADD-4.8-02 | 6a |
| PRD-13-08 | PRD | §13.4 Org KB Structure | The org KB stores one row per metadata component in an Org Components table with type, parent, namespace, API version, status, and timestamps. | ADD-4.2-01 | 6a, 11 |
| PRD-13-09 | PRD | §13.4 Org KB Structure | The org KB stores an Org Relationships table including relationship fields and trigger/flow-to-object associations. | ADD-4.2-02 | 6a, 11 |
| PRD-13-10 | PRD | §13.4 Org KB Structure | The org KB stores a Domain Groupings table with AI-suggested clusters confirmed or adjusted by the architect. | ADD-4.4-01 | 6a |
| PRD-13-11 | PRD | §13.4 Org KB Structure | The org KB stores a Business Context Annotations table for human-provided context on org components. | ADD-4.5-01 | 6a |
| PRD-13-12 | PRD | §13.5 Progressive Updates | On sandbox sync new components are added, modified components updated, and removed components flagged (not deleted) to preserve history. | ADD-4.7-01 | 6a |
| PRD-13-13 | PRD | §13.5 Progressive Updates | Business context annotations accumulate as the team learns what org components are used for. | — | 6a |
| PRD-13-14 | PRD | §13.5 Progressive Updates | Stories referencing components not yet in the knowledge base trigger creation of placeholder "planned" entries. | — | 4, 6a |
| PRD-13-15 | PRD | §13.6 Brownfield Ingestion | Brownfield initial sync performs a comprehensive metadata pull through four phases: Parse, Classify, Synthesize, Articulate. | ADD-4.8-02 | 6a |
| PRD-13-16 | PRD | §13.6 Brownfield Ingestion | Phase 3 generates BusinessProcess + BusinessProcessComponent suggestion records. | ADD-4.4-03 | 6a |
| PRD-13-17 | PRD | §13.6 Brownfield Ingestion | Phase 4 writes initial KnowledgeArticle drafts synthesizing each process and each domain. | — | 6a |
| PRD-13-18 | PRD | §13.6 Brownfield Ingestion | Phases 3-4 run as a single AI call because they need the same context. | — | 6a |
| PRD-13-19 | PRD | §13.6 Brownfield Ingestion | All AI-generated ingestion entities require human review before being treated as trusted context. | ADD-4.4-04 | 6a |
| PRD-13-20 | PRD | §13.6 Brownfield Ingestion | BusinessProcess suggestions default to isAiSuggested=true, isConfirmed=false, status=DISCOVERED. | — | 6a |
| PRD-13-21 | PRD | §13.6 Brownfield Ingestion | AI-drafted KnowledgeArticles default to authorType=AI_GENERATED and confidence LOW or MEDIUM. | — | 6a |
| PRD-13-22 | PRD | §13.6 Brownfield Ingestion | For rescue/takeover engagements, the AI generates an Org Health Assessment covering code quality, security, technical debt, and a remediation backlog. | ADD-4.8-01 | 6b |
| PRD-13-23 | PRD | §13.7 Three-Layer Knowledge | Layer 1 provides queryable structured relationships via BusinessProcess ↔ OrgComponent join tables and BusinessProcessDependency. | ADD-4.2-01..02 | 6a |
| PRD-13-24 | PRD | §13.7 Three-Layer Knowledge | Layer 2 provides AI-curated KnowledgeArticle synthesis with versioning and references. | — | 6a |
| PRD-13-25 | PRD | §13.7 Three-Layer Knowledge | Layer 3 provides pgvector embeddings on KnowledgeArticle, OrgComponent, and other searchable entities for semantic retrieval. | ADD-4.3-01..05 | 11, 6a |
| PRD-13-26 | PRD | §13.7 Three-Layer Knowledge | KnowledgeArticle staleness is flagged inline by agents via a DB update (staleReason, staleSince) with no synthesis during the agent loop. | — | 6a, 11 |
| PRD-13-27 | PRD | §13.7 Three-Layer Knowledge | A background Inngest job performs deep KnowledgeArticle refresh (re-read referenced entities, rewrite content, update version and embedding). | — | 6a, 11 |
| PRD-13-28 | PRD | §13.7 Three-Layer Knowledge | At the end of every agent loop, the engine queries which articles reference entities the agent modified and sets isStale=true + staleReason. | — | 2, 6a |
| PRD-13-29 | PRD | §13.7 Three-Layer Knowledge | Context retrieval follows a two-pass pattern: load summaries, embed the task/query, then load full content of top-N articles. | ADD-4.6-07 | 6a, 2 |
| PRD-14-01 | PRD | §14.1 Required Environments | Every project assumes one shared team sandbox as the single source of truth for org metadata. | — | 6a |
| PRD-14-02 | PRD | §14.1 Required Environments | Every developer uses one isolated development environment (Developer sandbox, Pro, Partial, or scratch org) for in-progress work. | — | 5 |
| PRD-14-03 | PRD | §14.2 Environment Type Guidance | Sandbox type recommendations vary by engagement type (Greenfield/Brownfield/Rescue). | — | 9 |
| PRD-14-04 | PRD | §14.3 Brownfield Warning | When a brownfield project has a scratch-org developer environment the app must surface a warning about missing existing customizations. | — | 5 |
| PRD-14-05 | PRD | §14.4 Non-Goals | The web app does not provision sandboxes, manage refreshes, or act as a deployment tool. | — | Cross-cutting |
| PRD-15-01 | PRD | §15.1 Governor Limits | The Claude Code AI must never generate SOQL queries inside loops, DML inside loops, or other governor-limit-risk patterns. | — | 5 |
| PRD-15-02 | PRD | §15.1 Governor Limits | Post-processing static analysis rejects code with governor-limit violations and re-prompts the AI. | — | 5 |
| PRD-15-03 | PRD | §15.2 Bulkification | Trigger handler code must be bulkified and follow one-trigger-per-object with handler operating on collections. | — | 5 |
| PRD-15-04 | PRD | §15.3 Test Classes | Every generated Apex class or trigger must ship with a test class that includes positive, negative, and bulk (200+ records) cases plus meaningful assertions. | — | 5 |
| PRD-15-05 | PRD | §15.4 Naming Conventions | All generated components must follow the firm's naming conventions (e.g., AccountTriggerHandler, not AcctTH). | — | 5 |
| PRD-15-06 | PRD | §15.5 Security Patterns | Generated Apex must include CRUD/FLS checks before DML/SOQL using Security.stripInaccessible or Schema.sObjectType describes. | — | 5 |
| PRD-15-07 | PRD | §15.5 Security Patterns | Generated code must not contain hardcoded Salesforce record IDs, org IDs, or user IDs. | — | 5 |
| PRD-15-08 | PRD | §15.5 Security Patterns | Dynamic SOQL must use bind variables or String.escapeSingleQuotes to prevent injection. | — | 5 |
| PRD-15-09 | PRD | §15.6 Sharing Model | Every generated Apex class must explicitly declare "with sharing" or "without sharing". | — | 5 |
| PRD-15-10 | PRD | §15.6 Sharing Model | Use of "without sharing" must include a justifying code comment and flag the class for mandatory human review. | — | 5 |
| PRD-16-01 | PRD | §16.1 Document Types | The app generates Word (.docx), PowerPoint (.pptx), and PDF (.pdf) deliverables covering BRDs, SDDs, SOWs, status reports, client decks, test scripts, and runbooks. | — | 8 |
| PRD-16-02 | PRD | §16.1 Document Types | Generated documents are stored in S3/R2 and linked from the database; users download from the web app. | — | 8 |
| PRD-16-03 | PRD | §16.2 Branding Enforcement | Every generated document must comply with the firm's branding standards enforced by the AI harness. | — | 8, 2 |
| PRD-16-04 | PRD | §16.2 Branding Enforcement | Branding includes logo placement, color palette, font hierarchy, header/footer format, and cover page layout. | — | 8 |
| PRD-16-05 | PRD | §16.2 Branding Enforcement | When branding assets change, future generations use the updated assets but previously generated documents are not retroactively updated. | — | 8 |
| PRD-16-06 | PRD | §16.3 Generation Workflow | Document generation steps: user selects type → harness assembles context → AI generates content → harness validates typography/branding → app renders file → stores in S3 → user previews and downloads. | — | 8 |
| PRD-16-07 | PRD | §16.3 Generation Workflow | Users can request regeneration with adjustments after preview. | — | 8 |
| PRD-17-01 | PRD | §17.1 Project Briefing | The Briefing is the primary landing page for all team members and is visible to all roles. | — | 7 |
| PRD-17-02 | PRD | §17.1 Project Briefing | Briefing header metrics (open questions, blocked items, roadmap progress, requirements count) are served instantly from Postgres queries. | — | 7 |
| PRD-17-03 | PRD | §17.1 Project Briefing | The Recommended Focus panel is an AI-prioritized list of the top 3-5 questions with reasoning, cached and refreshed on state changes or manual trigger. | ADD-5.2.4-03 | 7, 2 |
| PRD-17-04 | PRD | §17.1 Project Briefing | The Blocking Questions panel is a direct DB query listing open questions that block at least one story with ID, age, owners, text, and affected stories. | — | 7 |
| PRD-17-05 | PRD | §17.1 Project Briefing | The Current Focus narrative is a cached 2-4 sentence AI-generated summary of team state and priorities. | ADD-5.2.4-03 | 7, 2 |
| PRD-17-06 | PRD | §17.1 Project Briefing | The Epic Status panel shows per-epic current phase, story counts by status, and completion percentage from DB queries. | — | 7 |
| PRD-17-07 | PRD | §17.2 Roadmap | The Milestones table shows each milestone with name, target date or TBD, status, and computed progress bar. | — | 7 |
| PRD-17-08 | PRD | §17.2 Roadmap | The Epic Phase Grid shows each epic as a row with phases as columns and the epic's status per cell from EpicPhase. | — | 7 |
| PRD-17-09 | PRD | §17.2 Roadmap | Upcoming Milestones panel shows what must happen, what's blocking, and target dates with AI-generated "what must happen" narrative. | — | 7 |
| PRD-17-10 | PRD | §17.3 Sprint Dashboard | The Sprint dashboard shows current sprint progress by status, burndown, stories missing mandatory fields, conflict alerts, and developer workload. | — | 7 |
| PRD-17-11 | PRD | §17.4 Execution Plan View | The Execution Plan view lists stories within each epic in execution order with owners, dependencies, status, and notes. | — | 7 |
| PRD-17-12 | PRD | §17.4 Execution Plan View | Blocked stories are highlighted with the reason (dependency unmet or unresolved question). | — | 7 |
| PRD-17-13 | PRD | §17.4 Execution Plan View | Stories can be grouped by project phase within the epic (Discovery/Design/Build stories). | — | 7 |
| PRD-17-14 | PRD | §17.4 Execution Plan View | Story dependency chains are visualized using StoryComponent overlap plus explicit dependencies. | — | 7 |
| PRD-17-15 | PRD | §17.5 PM Dashboard | The PM dashboard aggregates briefing/roadmap/sprint views plus team velocity, risk register summary, upcoming deadlines, and client-facing items needing attention. | — | 7 |
| PRD-17-16 | PRD | §17.6 Health Score | The project health score is computed from stale questions (>7 days default), client-owned questions >3 days, blocked items >5 days, and active high-severity risks without mitigation. | — | 7 |
| PRD-17-17 | PRD | §17.6 Health Score | Health score thresholds are Green (0 signals), Yellow (1-3), Red (4+), configurable per project, and displayed in the Briefing header. | — | 7 |
| PRD-17-18 | PRD | §17.7 Search Architecture | Layer 1 search provides per-entity Prisma-filtered list views with facet filters, always available and AI-free. | — | 7 |
| PRD-17-19 | PRD | §17.7 Search Architecture | Layer 2 search provides a global full-text search bar using PostgreSQL tsvector/tsquery with grouped results across entity types. | — | 7 |
| PRD-17-20 | PRD | §17.7 Search Architecture | Full-text indexed entities include Question, Decision, Requirement, Story, OrgComponent, KnowledgeArticle, BusinessProcess, and Risk on specified fields. | — | 7 |
| PRD-17-21 | PRD | §17.7 Search Architecture | Layer 3 search provides semantic search via pgvector cosine similarity activated when full-text returns few results or when user chooses semantic mode. | ADD-4.3-01..05, ADD-5.4-01 | 7, 11 |
| PRD-17-22 | PRD | §17.8 Notification System | V1 provides in-app notifications only via a header bell with unread count; email and push are deferred. | — | 8 |
| PRD-17-23 | PRD | §17.8 Notification System | Notifications cover 14 event types including question answered, work item unblocked, sprint conflict detected, AI processing complete, question aging, health score change, new question assigned, story moved to QA, new decision recorded, risk created/changed, story reassigned, story status changed, knowledge article stale, metadata sync complete — each with defined recipients and priority. | — | 8 |
| PRD-17-24 | PRD | §17.8 Notification System | Notifications are implemented as Inngest event handlers subscribing to existing app events with no new infrastructure beyond the Notification entity. | — | 8, 11 |
| PRD-17-25 | PRD | §17.8 Notification System | Notifications link to the source entity for one-click navigation. | — | 8 |
| PRD-18-01 | PRD | §18.1 QA Capabilities | QAs can view test plans and test cases and add additional test cases beyond AI-generated stubs. | — | 9 |
| PRD-18-02 | PRD | §18.1 QA Capabilities | QAs can execute tests and record Pass/Fail/Blocked results with optional defect linkage. | — | 9 |
| PRD-18-03 | PRD | §18.1 QA Capabilities | QAs can log defects with severity, reproduction steps, expected/actual behavior, attachments, and observed environment. | — | 9 |
| PRD-18-04 | PRD | §18.1 QA Capabilities | QAs can verify fixes and close defects via the Open → Assigned → Fixed → Verified → Closed lifecycle. | — | 9 |
| PRD-18-05 | PRD | §18.2 Test Execution Tracking | The app tracks per-story test case totals and pass/fail/not-yet-executed counts. | — | 9 |
| PRD-18-06 | PRD | §18.2 Test Execution Tracking | The app tracks per-sprint aggregate test execution status. | — | 9 |
| PRD-18-07 | PRD | §18.2 Test Execution Tracking | The app computes an overall test coverage metric (stories with all test cases passed / total stories in QA or Done). | — | 9 |
| PRD-18-08 | PRD | §18.3 Playwright Integration | V1 records Playwright results manually; direct integration is a future enhancement. | — | 9 |
| PRD-19-01 | PRD | §19.1 RBAC | Every user has exactly one role per project from SA/Developer/PM/BA/QA. | — | 1 (out-of-scope, audit-only) |
| PRD-19-02 | PRD | §19.1 RBAC | Only SAs can create/configure projects, connect Salesforce, manage team access, and trigger org metadata sync. | — | 1 (out-of-scope, audit-only) |
| PRD-19-03 | PRD | §19.1 RBAC | Developers do not process transcripts or create/edit epics and features. | — | 1 (out-of-scope, audit-only) |
| PRD-19-04 | PRD | §19.1 RBAC | Management story status transitions (Draft/Ready/Sprint Planned) are restricted to SA, PM, and BA. | — | 1 (out-of-scope, audit-only), 4 |
| PRD-19-05 | PRD | §19.1 RBAC | Execution story status transitions (In Progress/In Review/QA/Done) are restricted to SA and Developer. | — | 1 (out-of-scope, audit-only), 4, 5 |
| PRD-19-06 | PRD | §19.1 RBAC | Assigning a story to a sprint auto-transitions its status to Sprint Planned. | — | 5, 4 |
| PRD-19-07 | PRD | §19.1 RBAC | QAs can create user stories only in Draft and cannot transition them past Draft. | — | 1 (out-of-scope, audit-only), 4 |
| PRD-19-08 | PRD | §19.1 RBAC | Sprint assignment and story content editing are separately permissioned. | — | 1 (out-of-scope, audit-only), 4 |
| PRD-19-09 | PRD | §19.1 RBAC | Only SA and BA can create/edit business context annotations. | — | 1 (out-of-scope, audit-only), 6a |
| PRD-19-10 | PRD | §19.1 RBAC | Only SA and PM can view Usage & Costs data; individual users cannot see other users' consumption. | — | 7, 1 (out-of-scope, audit-only) |
| PRD-19-11 | PRD | §19.2 Concurrent Editing | Concurrent edits on the same entity use optimistic concurrency control; the second saver is notified with a diff and may merge or overwrite. | — | 4, 1 (out-of-scope, audit-only) |
| PRD-19-12 | PRD | §19.2 Concurrent Editing | The application never silently overwrites another user's changes. | — | 4 |
| PRD-19-13 | PRD | §19.2 Concurrent Editing | For discovery interactions, eventual consistency within minutes is acceptable; duplicate answers trigger AI-flagged resolution. | — | 3 |
| PRD-20-01 | PRD | §20.1 Jira Sync Use | Jira sync is optional, configurable per project when a client requires stories to live in their Jira. | — | 9 |
| PRD-20-02 | PRD | §20.2 Sync Direction | Jira sync is one-directional push only; changes in Jira are not synced back. | — | 9 |
| PRD-20-03 | PRD | §20.3 Sync Scope | The Jira sync is scoped to one configured Jira project and cannot read or write other projects. | — | 9 |
| PRD-20-04 | PRD | §20.4 Configuration | SA configures Jira URL, project key, auth credentials, field mapping, and which status triggers a push. | — | 9 |
| PRD-20-05 | PRD | §20.5 Implementation | Jira sync runs as Inngest background jobs calling the Jira Cloud REST API directly with encrypted credentials. | — | 9, 11 |
| PRD-21-01 | PRD | §21.1 Archive Process | Archiving sets the project to read-only with no new stories, edits, or AI interactions. | — | 9 |
| PRD-21-02 | PRD | §21.1 Archive Process | Archive generates a final project summary document cataloging artifacts, decisions, and final org knowledge state. | — | 9, 8 |
| PRD-21-03 | PRD | §21.1 Archive Process | Archive preserves all project data and generated documents in their final state. | — | 9 |
| PRD-21-04 | PRD | §21.1 Archive Process | Archive revokes and deletes the Salesforce org connection credentials. | — | 9, 6a |
| PRD-21-05 | PRD | §21.1 Archive Process | Archive disconnects any client Jira sync. | — | 9 |
| PRD-21-06 | PRD | §21.1 Archive Process | Access logs are retained per the configured retention period (default 2 years) after archive. | — | 9, 1 (out-of-scope, audit-only) |
| PRD-21-07 | PRD | §21.2 Reactivation | An archived project can be reactivated by creating a new project instance inheriting knowledge, org, decisions, and requirements. | — | 9 |
| PRD-21-08 | PRD | §21.2 Reactivation | Reactivation leaves the original archive untouched as a historical record. | — | 9 |
| PRD-22-01 | PRD | §22.2 Data Isolation | Every project is fully isolated; there is no shared data or cross-project learning. | — | 1 (out-of-scope, audit-only), Cross-cutting |
| PRD-22-02 | PRD | §22.3 AI Provider Data Handling | Claude API usage must ensure client data is not retained or used for model training. | ADD-3.2-01 | Cross-cutting |
| PRD-22-03 | PRD | §22.4 Access Logging | All access to project data must be logged (who, what, when, action) and retained per the configured period. | — | 1 (out-of-scope, audit-only), 7 |
| PRD-22-04 | PRD | §22.5 Credential Management | Salesforce org credentials are encrypted at rest, scoped per project, and revoked on archive. | — | 6a, 9 |
| PRD-22-05 | PRD | §22.6 AI Content Sanitization | All text fields written via AI tool calls must be server-side sanitized of HTML and script tags before Prisma write. | — | 1 (out-of-scope, audit-only), 2 |
| PRD-22-06 | PRD | §22.6 AI Content Sanitization | Use of Prisma $queryRawUnsafe is banned; raw SQL must use parameterized tagged template literals. | — | Cross-cutting |
| PRD-22-07 | PRD | §22.6 AI Content Sanitization | All AI-generated UI content uses React JSX escaping or DOMPurify for markdown/HTML bodies. | — | Cross-cutting |
| PRD-22-08 | PRD | §22.6 AI Content Sanitization | dangerouslySetInnerHTML must never be used on AI or user-provided content without DOMPurify sanitization. | — | Cross-cutting |
| PRD-22-09 | PRD | §22.7 Prompt Injection Defense | Transcript processing system prompt must treat transcript body as data, not commands. | — | 1 (out-of-scope, audit-only), 2 |
| PRD-22-10 | PRD | §22.7 Prompt Injection Defense | The AI must flag suspicious transcript content as a risk and extract only factual information. | — | 2 |
| PRD-22-11 | PRD | §22.8 Per-Project Token Encryption | Salesforce org credentials are encrypted with per-project derived keys using HKDF-SHA256 with the project UUID as salt. | — | 1 (out-of-scope, audit-only), 6a |
| PRD-22-12 | PRD | §22.8 Per-Project Token Encryption | Key rotation is supported via a keyVersion field on the project. | — | 6a, 1 (out-of-scope, audit-only) |
| PRD-22-13 | PRD | §22.8 Per-Project Token Encryption | Serialization helpers must strip token fields from JSON output to prevent leakage in API responses, errors, or logs. | — | 1 (out-of-scope, audit-only), 5 |
| PRD-22-14 | PRD | §22.9 API Rate Limiting | REST API endpoints consumed by Claude Code must be rate-limited per API key per minute. | — | 5 |
| PRD-22-15 | PRD | §22.9 API Rate Limiting | API keys are scoped per project and cannot access other projects' data. | — | 5, 1 (out-of-scope, audit-only) |
| PRD-22-16 | PRD | §22.9 API Rate Limiting | All API requests are logged with key ID, endpoint, timestamp, and response status, retained 90 days. | — | 5, 7 |
| PRD-23-01 | PRD | §23.1 Individual Accounts | Every consultant has their own Clerk account; usage is tracked per individual. | — | 1 (out-of-scope, audit-only) |
| PRD-23-02 | PRD | §23.2 Cost Model | The firm absorbs all AI API costs as overhead; costs are not billed back to projects. | — | 7 |
| PRD-23-03 | PRD | §23.3 Rate Limiting | The app implements per-consultant daily request limits, per-project monthly cost caps with alerts, and firm-wide monthly cost alerts. | — | 7, 2 |
| PRD-23-04 | PRD | §23.4 Usage & Costs Dashboard | Each project has a Usage & Costs tab visible only to SA and PM. | — | 7, 1 (out-of-scope, audit-only) |
| PRD-23-05 | PRD | §23.4 Usage & Costs Dashboard | The dashboard shows project totals (tokens, cost, sessions) filterable by date range. | — | 7 |
| PRD-23-06 | PRD | §23.4 Usage & Costs Dashboard | The dashboard shows breakdown by task type with percentage-of-total column. | — | 7 |
| PRD-23-07 | PRD | §23.4 Usage & Costs Dashboard | The dashboard shows breakdown by team member visible only to SA and PM. | — | 7, 1 (out-of-scope, audit-only) |
| PRD-23-08 | PRD | §23.4 Usage & Costs Dashboard | The dashboard shows a trend chart of daily/weekly token usage. | — | 7 |
| PRD-23-09 | PRD | §23.4 Usage & Costs Dashboard | Cost = inputTokens*inputRate + outputTokens*outputRate aggregated from SessionLog; pricing configured as a TypeScript constant in V1. | — | 7, 2 |
| PRD-23-10 | PRD | §23.5 Inngest Event Volume | Sync intervals are configurable per project (sfOrgSyncIntervalHours) with recommended defaults per phase. | — | 6a, 11 |
| PRD-23-11 | PRD | §23.5 Inngest Event Volume | Embedding generation uses batched events (one batch per agent invocation) to reduce event count. | — | 11 |
| PRD-23-12 | PRD | §23.5 Inngest Event Volume | The Usage & Costs dashboard includes an Inngest event volume metric alongside token costs. | — | 7 |
| PRD-25-01 | PRD | §25.1 Core Stack | The core stack is Next.js App Router on Vercel, PostgreSQL via Prisma, Clerk auth, S3/R2 storage, Claude API, Inngest jobs, pgvector, tsvector, and Claude Code for dev execution. | ADD-3.1-01..03 | Cross-cutting |
| PRD-25-02 | PRD | §25.2 Architecture Decisions | No Git involvement from the web application; structured data in Postgres and files in S3 only. | — | Cross-cutting |
| PRD-25-03 | PRD | §25.2 Architecture Decisions | No real-time collaborative editing; concurrency is handled via optimistic control with eventual consistency. | — | 4 |
| PRD-25-04 | PRD | §25.2 Architecture Decisions | Single read-only Salesforce connection per project; no per-developer sandbox connections. | — | 6a |
| PRD-25-05 | PRD | §25.2 Architecture Decisions | Claude Code is the execution layer and the REST API is the boundary with the web app. | — | 5 |
| PRD-25-06 | PRD | §25.3 UI Tooling | UI must be built using the frontend-design skill, ui-ux-pro-max skill, and 21st.dev MCP server together (locked for V1). | — | 10 |
| PRD-26-01 | PRD | §26 Build Sequence | Phase 1 delivers the knowledge brain: schema, pgvector/tsvector, Clerk, project creation, question CRUD with confidence/review, AI transcript processing, AI question answering, chat, Inngest jobs, notifications, search, and discovery dashboard. | ADD-6.1-01..07 | 11, 3, 2 |
| PRD-26-02 | PRD | §26 Build Sequence | Phase 2 delivers epic/feature/story CRUD, mandatory field validation, AI story generation, sprint management, sprint analysis, and sprint dashboard. | — | 4, 5 |
| PRD-26-03 | PRD | §26 Build Sequence | Phase 3 delivers Salesforce OAuth, metadata sync and parsing, org knowledge base tables, Context Package API, Org Query API, Story Status API, and Claude Code skill updates. | — | 6a, 5 |
| PRD-26-04 | PRD | §26 Build Sequence | Phase 4 delivers document generation, template system, S3 storage, QA test tracking, defect management, Jira sync, archive workflow, and PM dashboard. | — | 8, 9, 7 |
| ADD-2-01 | Addendum | §2 Newly Locked Decisions | The org knowledge base must be implemented as a five-layer model (component graph, semantic embeddings, business domains, business context annotations, query interface). | PRD-13-08..11, PRD-13-23..25 | 6a, 11 |
| ADD-2-02 | Addendum | §2 Newly Locked Decisions | Postgres with pgvector is the sole storage substrate for the org KB (no graph DB, no separate vector store). | — | 11, 6a |
| ADD-2-03 | Addendum | §2 Newly Locked Decisions | Salesforce durable metadata IDs must be the primary identity key for components; api_name is an indexed attribute. | — | 6a |
| ADD-2-04 | Addendum | §2 Newly Locked Decisions | The project management AI layer must be built as four deterministic pipelines plus one narrow freeform agent (no "Big Agent"). | PRD-6-01..08 | 2 |
| ADD-2-05 | Addendum | §2 Newly Locked Decisions | A hybrid retrieval primitive (BM25 + vector similarity with reciprocal rank fusion) must be implemented once and shared across all pipelines, the agent, and the org KB. | — | 11 |
| ADD-2-06 | Addendum | §2 Newly Locked Decisions | Model routing must be centralized and explicit: intent-based resolution with Haiku for extract, Sonnet for synthesis, Opus for deep reasoning. | — | 11 |
| ADD-2-07 | Addendum | §2 Newly Locked Decisions | No pipeline stage or agent code may hardcode a specific Claude model name. | — | 11, 2 |
| ADD-2-08 | Addendum | §2 Newly Locked Decisions | An evaluation harness is a V1 deliverable with fixtures and a CI gate for every pipeline. | — | 11, 2 |
| ADD-2-09 | Addendum | §2 Newly Locked Decisions | Claude Managed Agents must be used only for Org Health Assessment and initial brownfield domain proposal (no request-scoped or pipeline work). | — | 6a, 6b |
| ADD-3.1-01 | Addendum | §3.1 Tech Stack Additions | pgvector must be enabled on the Postgres instance with HNSW indexes for ANN search. | — | 11 |
| ADD-3.1-02 | Addendum | §3.1 Tech Stack Additions | The embedding provider must be Voyage AI (voyage-3-lite) or OpenAI (text-embedding-3-small), selected at Phase 11 start based on a quality test. | — | 11 |
| ADD-3.1-03 | Addendum | §3.1 Tech Stack Additions | The eval harness must be custom and lightweight with JSON fixtures per pipeline and a `pnpm eval [pipeline]` runner. | — | 11 |
| ADD-3.1-04 | Addendum | §3.1 Tech Stack Additions | The background job runner must provide durable workflows with retries (Inngest selected; Vercel cron is insufficient). | — | 11 |
| ADD-3.2-01 | Addendum | §3.2 Data Handling | The embeddings provider must carry the same no-retention, no-training contractual posture as Claude before production use. | PRD-22-02 | 11 |
| ADD-4.1-01 | Addendum | §4.1 Architecture Overview | Data flows upward through the five layers by ID reference; mixing responsibilities across layers is a design violation. | — | 6a |
| ADD-4.1-02 | Addendum | §4.1 Architecture Overview | A Layer 1 deletion must cascade as a soft-archive through Layers 2-4, never as a hard delete. | — | 6a |
| ADD-4.2-01 | Addendum | §4.2 Layer 1 Component Graph | `org_components` must store id, project_id, salesforce_metadata_id, api_name, label, component_type enum, parent_component_id, namespace, api_version, status, raw_metadata jsonb, timestamps, and metadata_hash. | PRD-13-08 | 6a, 11 |
| ADD-4.2-02 | Addendum | §4.2 Layer 1 Component Graph | `component_edges` must store project_id, source/target component IDs, edge_type enum, edge_metadata jsonb, unresolved_reference_text, and timestamps. | PRD-13-09 | 11, 6a |
| ADD-4.2-03 | Addendum | §4.2 Layer 1 Component Graph | Forward, reverse, and domain traversals must be supported via SQL recursive CTEs over component_edges. | — | 6a |
| ADD-4.3-01 | Addendum | §4.3 Layer 2 Embeddings | `component_embeddings` must store component_id, embedded_text, embedded_text_hash, embedding vector, embedding_model, and embedded_at. | — | 11, 6a |
| ADD-4.3-02 | Addendum | §4.3 Layer 2 Embeddings | `embedded_text` must be a deterministic concatenation of api_name, label, description, help_text, inline_help, and type-specific fields (Apex first 50 lines + comments, flow elements, VR errors). | — | 6a |
| ADD-4.3-03 | Addendum | §4.3 Layer 2 Embeddings | On sync, components are re-embedded only when embedded_text_hash differs from stored hash. | — | 6a |
| ADD-4.3-04 | Addendum | §4.3 Layer 2 Embeddings | Embeddings must be indexed via HNSW with cosine distance, tuned during Phase 6. | — | 6a, 11 |
| ADD-4.3-05 | Addendum | §4.3 Layer 2 Embeddings | Each embedding row must persist the originating embedding_model for future migration. | — | 11, 6a |
| ADD-4.4-01 | Addendum | §4.4 Layer 3 Domains | `domains` must store id, project_id, name, description, source enum, status enum, created_by, and timestamps. | PRD-13-10 | 6a |
| ADD-4.4-02 | Addendum | §4.4 Layer 3 Domains | `domain_memberships` must support many-to-many (component can belong to multiple domains) with rationale, source, and confidence. | — | 6a |
| ADD-4.4-03 | Addendum | §4.4 Layer 3 Domains | Domains must be flat (no hierarchy) in V1. | PRD-13-16 | 6a |
| ADD-4.4-04 | Addendum | §4.4 Layer 3 Domains | When an architect rejects an AI-proposed membership, it is marked status=archived and not re-proposed unless the component's metadata materially changes. | PRD-13-19 | 6a |
| ADD-4.4-05 | Addendum | §4.4 Layer 3 Domains | Brownfield initial domain proposal runs as a Claude Managed Agents session and writes proposals for architect review. | — | 6a |
| ADD-4.4-06 | Addendum | §4.4 Layer 3 Domains | Greenfield domains are created manually by the architect with AI suggestions for new components. | — | 6a |
| ADD-4.4-07 | Addendum | §4.4 Layer 3 Domains | A lighter domain-review pass runs every 2 weeks (or on architect trigger) over recently changed/new components. | — | 6a |
| ADD-4.5-01 | Addendum | §4.5 Layer 4 Annotations | `annotations` must store entity_type, entity_id, content, content_type enum, source enum, created_by, timestamps, and status via a polymorphic FK pattern. | PRD-13-11 | 6a |
| ADD-4.5-02 | Addendum | §4.5 Layer 4 Annotations | `annotation_embeddings` must support annotation search independently from component search. | — | 6a, 11 |
| ADD-4.5-03 | Addendum | §4.5 Layer 4 Annotations | Polymorphic consistency must be enforced via check constraint on application writes. | — | 6a |
| ADD-4.5-04 | Addendum | §4.5 Layer 4 Annotations | When the annotated entity is soft-archived, annotations are soft-archived as a cascade and remain queryable for history. | — | 6a |
| ADD-4.5-05 | Addendum | §4.5 Layer 4 Annotations | Annotations are never hard-deleted except on project archive. | — | 6a, 9 |
| ADD-4.6-01 | Addendum | §4.6 Layer 5 Query Interface | `search_org_kb(project_id, query, options)` must be the single entry point for "find relevant org knowledge for X". | PRD-5-35 | 6a |
| ADD-4.6-02 | Addendum | §4.6 Layer 5 Query Interface | `search_org_kb` must implement hybrid search: BM25 tsvector over api_name/label/raw_metadata/annotations + pgvector cosine over embeddings, fused via reciprocal rank fusion (k=60). | — | 6a, 11 |
| ADD-4.6-03 | Addendum | §4.6 Layer 5 Query Interface | Context Package Assembly must be a deterministic pipeline ending in a single Sonnet summarization call (no agent loop). | PRD-5-34, PRD-12-04 | 5 |
| ADD-4.6-04 | Addendum | §4.6 Layer 5 Query Interface | Context Package Assembly must fetch story + AC + parent epic/feature, impacted components with 1-hop neighbors, domain memberships, annotations, related discovery Q&A via hybrid search, in-flight story coordination flags, and apply a 20k-token budget. | PRD-12-05 | 5, 6a |
| ADD-4.6-05 | Addendum | §4.6 Layer 5 Query Interface | Context Package Assembly must hit a <3s p95 latency target with the only LLM call being the 200-word context brief. | — | 5 |
| ADD-4.6-06 | Addendum | §4.6 Layer 5 Query Interface | The Org Query API is a thin wrapper over search_org_kb with optional LLM synthesis for narrative answers. | PRD-5-35, PRD-12-07 | 5, 6a |
| ADD-4.6-07 | Addendum | §4.6 Layer 5 Query Interface | Token budget trimming must prefer lowest semantic similarity to the story description when over budget. | PRD-6-07 | 5 |
| ADD-4.7-01 | Addendum | §4.7 Freshness & Change Propagation | Sync reconciliation must match by salesforce_metadata_id first, then by (api_name, component_type, parent_component_id) as fallback, else create new. | PRD-13-12 | 6a |
| ADD-4.7-02 | Addendum | §4.7 Freshness & Change Propagation | Missing durable Salesforce IDs must log a warning per project per sync. | PRD-13-05 | 6a |
| ADD-4.7-03 | Addendum | §4.7 Freshness & Change Propagation | Renames must be recorded in `component_history` with annotations, domain memberships, and edges preserved. | — | 6a |
| ADD-4.7-04 | Addendum | §4.7 Freshness & Change Propagation | Components not seen in the current sync are soft-archived (status=archived) along with their annotations and edges. | — | 6a |
| ADD-4.7-05 | Addendum | §4.7 Freshness & Change Propagation | Embedding cost must be kept proportional to actual change by re-embedding only on hash change. | — | 6a, 11 |
| ADD-4.7-06 | Addendum | §4.7 Freshness & Change Propagation | Renames must preserve domain memberships via salesforce_metadata_id matching. | — | 6a |
| ADD-4.7-07 | Addendum | §4.7 Freshness & Change Propagation | Adding new fields to an object whose fields belong to a domain must trigger a "domain review nudge" to the architect. | — | 6a |
| ADD-4.7-08 | Addendum | §4.7 Freshness & Change Propagation | Archived domain memberships are preserved but excluded from active queries. | — | 6a |
| ADD-4.7-09 | Addendum | §4.7 Freshness & Change Propagation | Annotations must follow entities by ID so renames do not break them. | — | 6a |
| ADD-4.7-10 | Addendum | §4.7 Freshness & Change Propagation | Unresolved references (dynamic SOQL, dynamic Apex, external callouts) are stored as edges with target_component_id=null and flagged in Org Health. | — | 6a |
| ADD-4.7-11 | Addendum | §4.7 Freshness & Change Propagation | Components with a non-null namespace are excluded from AI-proposed domain memberships by default, overridable via project setting. | — | 6a |
| ADD-4.7-12 | Addendum | §4.7 Freshness & Change Propagation | Annotations on managed package components are supported. | — | 6a |
| ADD-4.7-13 | Addendum | §4.7 Freshness & Change Propagation | For large orgs (>10k custom fields or >500 Apex classes), sync runs in chunks with pagination and embedding is batched (50 components per API call). | — | 6a |
| ADD-4.7-14 | Addendum | §4.7 Freshness & Change Propagation | Initial brownfield ingestion of a large org may take 30-90 minutes and is acceptable as a Managed Agents workload. | — | 6a |
| ADD-4.8-01 | Addendum | §4.8 Managed Agents Scope | Org Health Assessment must run as a Claude Managed Agents session performing test coverage, governor-limit pattern detection, sharing review, FLS compliance, hardcoded ID detection, and technical debt inventory, producing an `org_health_reports` record and a Word deliverable. | PRD-13-22 | 6b, 8 |
| ADD-4.8-02 | Addendum | §4.8 Managed Agents Scope | Brownfield initial domain proposal runs once per project via Managed Agents writing domains + memberships with source=ai_proposed, status=proposed. | PRD-13-07, PRD-13-15 | 6a |
| ADD-4.8-03 | Addendum | §4.8 Managed Agents Scope | Managed Agents workloads must not run on any user-facing request path. | — | 6a, 6b |
| ADD-4.9-01 | Addendum | §4.9 Edge Cases & Non-Goals | Cross-project knowledge sharing is explicitly forbidden. | PRD-22-01 | 6a |
| ADD-4.9-02 | Addendum | §4.9 Edge Cases & Non-Goals | Real-time metadata sync is explicitly out of V1 scope (periodic + manual only). | — | 6a |
| ADD-4.9-03 | Addendum | §4.9 Edge Cases & Non-Goals | Apex source is stored and embedded at the class/trigger level (first 50 lines + comments) only; full-body analysis is an Org Health task. | — | 6a |
| ADD-4.9-04 | Addendum | §4.9 Edge Cases & Non-Goals | Line-level component source diffing across syncs is not provided in V1 (metadata_hash change detection only). | — | 6a |
| ADD-4.9-05 | Addendum | §4.9 Edge Cases & Non-Goals | Multi-org sandboxes are out of scope; one sandbox per project. | — | 6a |
| ADD-5.1-01 | Addendum | §5.1 PM AI Architecture | The project management AI layer must consist of four deterministic pipelines, one narrow freeform agent, one shared hybrid retrieval primitive, and one centralized model router. | PRD-6-01, PRD-6-04, PRD-6-15, PRD-6-16 | 2, 11 |
| ADD-5.1-02 | Addendum | §5.1 PM AI Architecture | The "Big Agent" pattern (one LLM with dozens of tools reasoning through every interaction) is explicitly rejected. | PRD-8-11 | 2 |
| ADD-5.2.1-01 | Addendum | §5.2.1 Transcript Processing Pipeline | The Transcript Processing pipeline accepts raw transcript + source metadata (meeting type, attendees, date, project_id). | — | 2 |
| ADD-5.2.1-02 | Addendum | §5.2.1 Transcript Processing Pipeline | Stage 1 (Segment) uses Haiku to split into speaker turns and chunk into ~500-token reasoning units. | PRD-6-19 | 2 |
| ADD-5.2.1-03 | Addendum | §5.2.1 Transcript Processing Pipeline | Stage 2 (Extract candidates) uses Haiku to extract questions, answers, decisions, requirements, risks, action items with confidence. | — | 2 |
| ADD-5.2.1-04 | Addendum | §5.2.1 Transcript Processing Pipeline | Stage 3 (Entity resolution) uses deterministic hybrid search to retrieve top-K existing entities per candidate. | — | 2, 11 |
| ADD-5.2.1-05 | Addendum | §5.2.1 Transcript Processing Pipeline | Stage 4 (Reconcile) uses Sonnet to decide create_new/merge_with_existing/update_existing per candidate+matches. | PRD-6-24 | 2 |
| ADD-5.2.1-06 | Addendum | §5.2.1 Transcript Processing Pipeline | Stage 5 (Apply) auto-applies changes when confidence > 0.85 and queues lower-confidence items in `pending_review`. | — | 2 |
| ADD-5.2.1-07 | Addendum | §5.2.1 Transcript Processing Pipeline | Stage 6 (Impact assessment) uses Sonnet to compute unblocked stories, contradicted decisions, new questions raised. | — | 2 |
| ADD-5.2.1-08 | Addendum | §5.2.1 Transcript Processing Pipeline | Stage 7 (Log) writes a session_log entry with full pipeline trace. | — | 2, 11 |
| ADD-5.2.1-09 | Addendum | §5.2.1 Transcript Processing Pipeline | The pipeline must output applied_changes, pending_review, new_questions_raised, blocked_items_unblocked, conflicts_detected, and session_log_id. | — | 2 |
| ADD-5.2.1-10 | Addendum | §5.2.1 Transcript Processing Pipeline | Each stage must be idempotent and retry-safe; after 3 failed retries the stage escalates to a human-review queue with partial state preserved. | — | 2 |
| ADD-5.2.1-11 | Addendum | §5.2.1 Transcript Processing Pipeline | The eval harness must ship 10 labeled transcript fixtures with extraction F1, top-1 entity resolution accuracy, and reconciliation decision accuracy metrics. | — | 11, 2 |
| ADD-5.2.2-01 | Addendum | §5.2.2 Answer Logging Pipeline | The pipeline accepts a free-text answer, optional question_id hint, project_id, and user_id. | — | 2 |
| ADD-5.2.2-02 | Addendum | §5.2.2 Answer Logging Pipeline | Stage 1 retrieves top-5 open questions matching the answer via deterministic hybrid search. | — | 2, 11 |
| ADD-5.2.2-03 | Addendum | §5.2.2 Answer Logging Pipeline | Stage 2 uses Sonnet to pick the best matching question or declare the input a standalone decision. | PRD-8-02 | 2 |
| ADD-5.2.2-04 | Addendum | §5.2.2 Answer Logging Pipeline | Stage 4 uses Sonnet to identify unblocked stories, contradicted decisions, and new questions to raise. | PRD-8-04, PRD-8-05, PRD-8-06, PRD-8-18, PRD-9-04, PRD-9-05, PRD-9-06 | 2, 3 |
| ADD-5.2.2-05 | Addendum | §5.2.2 Answer Logging Pipeline | Stage 5 applies impacts deterministically and creates `conflicts_flagged` records for human review. | PRD-8-07 | 2, 3 |
| ADD-5.2.2-06 | Addendum | §5.2.2 Answer Logging Pipeline | Stage 6 uses Sonnet to propose annotations on Layer 4 when the answer mentions Salesforce components, for human confirmation. | — | 2, 6a |
| ADD-5.2.2-07 | Addendum | §5.2.2 Answer Logging Pipeline | The eval harness ships 10 answer/question pairs with match accuracy and no-hallucination/no-missed-contradiction metrics. | — | 11, 2 |
| ADD-5.2.3-01 | Addendum | §5.2.3 Story Generation Pipeline | Stage 1 assembles parent epic/feature, linked requirements, related discovery Q&A (via hybrid search), and candidate impacted components (via search_org_kb). | PRD-10-11 | 2, 4 |
| ADD-5.2.3-02 | Addendum | §5.2.3 Story Generation Pipeline | Stage 2 uses Sonnet to draft a story matching the PRD §10.3 mandatory field schema as structured output. | PRD-10-08 | 2, 4 |
| ADD-5.2.3-03 | Addendum | §5.2.3 Story Generation Pipeline | Stage 3 deterministically validates that every mandatory field is present and well-formed. | PRD-10-13 | 4, 2 |
| ADD-5.2.3-04 | Addendum | §5.2.3 Story Generation Pipeline | Stage 4 cross-references impacted components against existing org components via hybrid search. | PRD-10-12 | 4, 6a |
| ADD-5.2.3-05 | Addendum | §5.2.3 Story Generation Pipeline | Stage 5 uses Sonnet only when stage 4 flagged conflicts, proposing resolution for extend-vs-replace decisions. | PRD-10-12 | 2, 4 |
| ADD-5.2.3-06 | Addendum | §5.2.3 Story Generation Pipeline | Stage 6 deterministically validates typography/branding per firm rules. | PRD-6-05 | 2 |
| ADD-5.2.3-07 | Addendum | §5.2.3 Story Generation Pipeline | Stage 7 persists the story draft in `draft` status for UI review before promotion to `ready`. | — | 4, 2 |
| ADD-5.2.3-08 | Addendum | §5.2.3 Story Generation Pipeline | The eval harness ships 15 labeled requirement-to-story fixtures with structural and semantic metrics. | — | 2, 11 |
| ADD-5.2.4-01 | Addendum | §5.2.4 Briefing/Status Pipeline | The pipeline accepts project_id and briefing_type (daily_standup, weekly_status, executive_summary, blocker_report, discovery_gap_report, sprint_health). | PRD-5-30 | 2, 7 |
| ADD-5.2.4-02 | Addendum | §5.2.4 Briefing/Status Pipeline | Stage 1 runs deterministic SQL metrics queries per briefing type with a 5-minute TTL cache. | — | 2, 7 |
| ADD-5.2.4-03 | Addendum | §5.2.4 Briefing/Status Pipeline | Stage 3 uses Sonnet to generate narrative prose matching the briefing-type template. | PRD-17-03, PRD-17-05 | 2, 7 |
| ADD-5.2.4-04 | Addendum | §5.2.4 Briefing/Status Pipeline | Stage 4 deterministically validates typography, branding, and absence of forbidden phrases, and checks numeric accuracy against stage 1 metrics. | — | 2 |
| ADD-5.2.4-05 | Addendum | §5.2.4 Briefing/Status Pipeline | Stage 5 caches the generated briefing with generated_at and inputs_hash for cache invalidation. | PRD-6-21 | 2, 7 |
| ADD-5.3-01 | Addendum | §5.3 Freeform Agent | There must be exactly one agent loop in the system, scoped to open-ended PM/BA conversations. | — | 2 |
| ADD-5.3-02 | Addendum | §5.3 Freeform Agent | The freeform agent runs on Sonnet 4.6 by default with user-triggered "think harder" escalating to Opus 4.6. | — | 2 |
| ADD-5.3-03 | Addendum | §5.3 Freeform Agent | Agent context includes the last N turns (default 20) + Tier 1 project summary + dynamically retrieved tool outputs. | — | 2 |
| ADD-5.3-04 | Addendum | §5.3 Freeform Agent | Agent read tools must include search_project_kb, search_org_kb, get_sprint_state, get_project_summary, get_blocked_items, and get_discovery_gaps. | — | 2 |
| ADD-5.3-05 | Addendum | §5.3 Freeform Agent | Agent write tools are limited to create_question, create_risk, create_requirement and require UI confirmation before apply. | — | 2 |
| ADD-5.3-06 | Addendum | §5.3 Freeform Agent | The agent must not have access to story creation, transcript processing, answer logging, document generation, or sprint modification (pipelines own those). | — | 2 |
| ADD-5.3-07 | Addendum | §5.3 Freeform Agent | Every agent turn must be persisted to `agent_conversations` + `agent_messages` with project_id and user_id and is resumable. | — | 2 |
| ADD-5.4-01 | Addendum | §5.4 Hybrid Retrieval Primitive | `search_project_kb(project_id, query, options)` must be implemented once and shared across pipelines and the agent. | — | 11 |
| ADD-5.4-02 | Addendum | §5.4 Hybrid Retrieval Primitive | Each searchable entity has its own embedding table (question_embeddings, decision_embeddings, etc.) or is covered by component/annotation embeddings. | — | 11, 2 |
| ADD-5.4-03 | Addendum | §5.4 Hybrid Retrieval Primitive | Embeddings are enqueued asynchronously on entity create/update; BM25 is available immediately, vector similarity after the job completes (<30s). | — | 11 |
| ADD-5.5-01 | Addendum | §5.5 Model Routing | A centralized `model_router` module must be the only place in the codebase that resolves a task to a specific model. | — | 11 |
| ADD-5.5-02 | Addendum | §5.5 Model Routing | Pipeline stages and the agent must request a model by intent (extract, synthesize, generate_structured, reason_deeply, embed), not by name. | — | 11, 2 |
| ADD-5.5-03 | Addendum | §5.5 Model Routing | Default intent-to-model mapping is extract→Haiku 4.5, synthesize→Sonnet 4.6, generate_structured→Sonnet 4.6, reason_deeply→Opus 4.6, embed→selected embedding provider. | — | 11 |
| ADD-5.5-04 | Addendum | §5.5 Model Routing | ModelOverride hooks must support user-triggered "think harder" mode and eval-run forcing of specific models. | — | 11, 2 |
| ADD-5.6-01 | Addendum | §5.6 Evaluation Harness | The eval harness must live at `/evals` with fixtures, expectations.ts, a runner, and shared assertions. | — | 11 |
| ADD-5.6-02 | Addendum | §5.6 Evaluation Harness | Fixtures must be JSON with input, expected_properties (structural), and optional gold_output (for semantic similarity). | — | 11 |
| ADD-5.6-03 | Addendum | §5.6 Evaluation Harness | The runner must produce a pass/fail report with diffs on failures and track latency and token cost per fixture. | — | 11 |
| ADD-5.6-04 | Addendum | §5.6 Evaluation Harness | `pnpm eval all` must run in CI on PRs touching src/ai/, src/pipelines/, prompts/, or evals/, and non-zero exit blocks merge. | — | 11 |
| ADD-5.6-05 | Addendum | §5.6 Evaluation Harness | Phase 1/11 ship requires 10 initial fixtures per pipeline; every production bug becomes a new fixture. | — | 11, 2 |
| ADD-6.1-01 | Addendum | §6.1 Phase 1 Amended Scope | pgvector must be enabled on the Postgres instance in Phase 1/11. | PRD-26-01 | 11 |
| ADD-6.1-02 | Addendum | §6.1 Phase 1 Amended Scope | The embedding provider must be selected and integrated in Phase 1/11. | — | 11 |
| ADD-6.1-03 | Addendum | §6.1 Phase 1 Amended Scope | Embedding job infrastructure (queue, enqueue-on-write, retry) ships in Phase 1/11. | — | 11 |
| ADD-6.1-04 | Addendum | §6.1 Phase 1 Amended Scope | The hybrid retrieval primitive must be implemented in Phase 1/11 for the entities present at end of Phase 1 (questions, decisions, requirements, risks, session logs). | — | 11 |
| ADD-6.1-05 | Addendum | §6.1 Phase 1 Amended Scope | The model router module with intent-based resolution must ship in Phase 1/11. | — | 11 |
| ADD-6.1-06 | Addendum | §6.1 Phase 1 Amended Scope | The eval harness scaffold + 10 fixtures each for Transcript Processing and Answer Logging pipelines must ship in Phase 1/11. | — | 11, 2 |
| ADD-6.1-07 | Addendum | §6.1 Phase 1 Amended Scope | Layer 1 schema only (org_components, component_edges) must ship in Phase 1/11 with no ingestion yet. | — | 11 |
| ADD-6.5-01 | Addendum | §6.5 Cross-Phase | The freeform agent is built at the end of Phase 2, not in Phase 1. | — | 2 |
| ADD-7-01 | Addendum | §7 Data Model Additions | Org KB must add component_edges, component_embeddings, component_history, domains, domain_memberships, annotations, annotation_embeddings, org_health_reports, and an unresolved_references materialized view. | PRD-5-10 | 6a, 6b, 11 |
| ADD-7-02 | Addendum | §7 Data Model Additions | Retrieval/AI infrastructure must add question_embeddings, decision_embeddings, requirement_embeddings, risk_embeddings, and story_embeddings. | — | 11, 2 |
| ADD-7-03 | Addendum | §7 Data Model Additions | Observability tables pipeline_runs and pipeline_stage_runs must record pipeline execution and per-stage traces. | — | 11, 2 |
| ADD-7-04 | Addendum | §7 Data Model Additions | A `pending_review` table must hold pipeline items awaiting human confirmation. | — | 2 |
| ADD-7-05 | Addendum | §7 Data Model Additions | A `conflicts_flagged` table must hold contradictions detected by impact assessment. | — | 2, 3 |
| ADD-7-06 | Addendum | §7 Data Model Additions | `agent_conversations` and `agent_messages` must persist freeform agent state. | — | 2 |

---

**End of Requirement Index.**
