# Product Requirements Document: Salesforce Consulting AI Framework

**Document Version:** 2.2
**Date:** April 3, 2026
**Author:** Michael Rihm
**Status:** Draft — In Progress (Sessions 3-5 complete, pre-build)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision and Scope](#3-product-vision-and-scope)
4. [Target Users and Personas](#4-target-users-and-personas)
5. [System Architecture](#5-system-architecture)
6. [AI Agent Harness](#6-ai-agent-harness)
7. [Project Lifecycle](#7-project-lifecycle)
8. [Discovery Workflow](#8-discovery-workflow)
9. [Question System](#9-question-system)
10. [Epic, Feature, and User Story Management](#10-epic-feature-and-user-story-management)
11. [Sprint Intelligence](#11-sprint-intelligence)
12. [Developer Execution Integration](#12-developer-execution-integration)
13. [Salesforce Org Connectivity and Knowledge Base](#13-salesforce-org-connectivity-and-knowledge-base)
14. [Recommended Sandbox Strategy](#14-recommended-sandbox-strategy)
15. [Salesforce Development Guardrails](#15-salesforce-development-guardrails)
16. [Document Generation and Branding](#16-document-generation-and-branding)
17. [Dashboards and Reporting](#17-dashboards-and-reporting)
18. [QA Workflow](#18-qa-workflow)
19. [Multi-User Concurrency and Role-Based Access](#19-multi-user-concurrency-and-role-based-access)
20. [Client Jira Sync (Optional)](#20-client-jira-sync-optional)
21. [Project Archival and Lifecycle End](#21-project-archival-and-lifecycle-end)
22. [Security, Compliance, and Data Handling](#22-security-compliance-and-data-handling)
23. [Consultant Licensing and Cost Management](#23-consultant-licensing-and-cost-management)
24. [What This Product Is Not](#24-what-this-product-is-not)
25. [Technology Stack](#25-technology-stack)
26. [Build Sequence](#26-build-sequence)
27. [Open Questions and Future Considerations](#27-open-questions-and-future-considerations)

---

## 1. Executive Summary

This document defines the product requirements for an internal AI-powered web application that standardizes how a Salesforce consulting firm delivers projects. The application serves as the firm's primary work management system, AI-powered knowledge base, and delivery accelerator — used by the entire project team (project managers, business analysts, QA engineers, solution architects, and developers) from project kickoff through completion.

The application is the single system of record for all project work: epics, features, user stories, bugs, sprint management, discovery knowledge, requirements, decisions, questions, risks, and generated deliverables. It replaces the need for a separate project management tool for internal work tracking. When a client requires stories to live in their Jira instance, the application provides optional one-directional sync (push from this tool to client Jira).

The AI is not a tool you prompt from scratch. It is a persistent, progressively-built project brain that starts accumulating knowledge during discovery and grows continuously throughout the engagement. It tracks all discovery notes, answers to questions, and decisions. It links answers to relevant epics and features. It surfaces outstanding questions, blockers, and suggested follow-ups. It carries full project context from session to session.

Developers work in Claude Code with custom skills that call back to the web application's API for project context, org knowledge, and story details. The six hard-locked Salesforce development guardrails are enforced in the Claude Code skills. The web application provides context; Claude Code provides execution.

Every project instance is fully isolated. Client data (org metadata, user stories, business requirements) flows through the system, which means the application must meet the security and data handling standards required by client contracts. The AI never deploys to any Salesforce environment; it generates source, documents, and artifacts that humans review and deploy.

The firm expects 10 to 30 concurrent projects and 50 to 150 active consultants within the first 12 months. V1 is strictly an internal tool. The architecture should support clean tenant boundaries to allow for potential future productization.

---

## 2. Problem Statement

Starting a new Salesforce consulting engagement today involves days of manual setup and weeks of inconsistent discovery. Context is scattered across meeting notes, Slack threads, email chains, and individual consultants' memories. When multiple BAs conduct discovery simultaneously across different client departments, there is no centralized system that connects what they learn to the technical work it drives.

Once a project is underway, the problems compound. User stories are written inconsistently and often lack the detail developers need. The connection between a business requirement, the discovery question that surfaced it, the decision that shaped it, and the user story that implements it exists only in people's heads. When consultants roll off and new ones join, this context is lost.

Developers working with AI code generation have no structured way to receive the full context behind a ticket — the business rationale, the org's existing components, the related decisions and constraints. They get a story title and maybe some acceptance criteria, then spend time hunting for context that should be at their fingertips.

The firm needs a system that serves as the project's brain: capturing knowledge progressively from day one of discovery, organizing it automatically, surfacing what matters at each stage of the engagement, and delivering the right context to the right person at the right time — whether that person is a BA logging a client answer, a PM generating a status report, or a developer picking up a ticket.

---

## 3. Product Vision and Scope

### 3.1 What This Product Is

An internal web application that provides an AI-powered SDLC for Salesforce consulting engagements. It is the primary system of record for all project work, the centralized knowledge base for all project context, and the integration point that connects non-technical team members with the technical delivery team.

### 3.2 Delivery Model

The application is a hybrid system with two interfaces that share the same underlying data:

**Web Application** for all team members. This is the primary interface where PMs, BAs, QAs, and architects manage discovery, create and refine user stories, view dashboards, generate deliverables, and interact with the AI project brain. Developers also use the web application to view their assigned tickets, review sprint plans, and access project context — but they do not write code here.

**Claude Code with Custom Skills** for developers and solution architects. This is the code execution environment where technical team members pick up tickets, generate Salesforce source code and metadata, and deploy to their development environments. Claude Code skills call back to the web application's API to fetch project context, story details, acceptance criteria, and org knowledge. After building and deploying, the developer updates ticket status in the web application.

The web application exposes a REST API that Claude Code skills consume. This is the clean boundary between the management layer and the execution layer.

### 3.3 AI Strategy

The AI layer is optimized for Claude (Anthropic) in V1. The integration is structured as a cleanly separated module so that a second provider could be added in a future version, but no provider-agnostic abstraction layer is built in V1.

The AI operates in different modes depending on the task:

- **Discovery processing:** Multi-step workflows with tool use — extracting questions, scoping them, filing them, assessing impact across the knowledge base.
- **Story generation and enrichment:** Structured generation with mandatory field validation — drafting acceptance criteria, test case stubs, impacted component lists.
- **Briefings and synthesis:** Retrieval and reasoning across multiple data sources — reading questions, execution state, roadmap progress, and generating prioritized summaries.
- **Document generation:** Template-driven content generation using project context — populating branded deliverables with project-specific information.
- **Developer context assembly:** Filtered retrieval — assembling scoped context packages from the knowledge base for a specific ticket.

### 3.4 Repository Topology

The web application does not create or manage Git repositories. Each project's code repository is managed by the development team through their standard Git workflow. The web application connects to a single shared Salesforce sandbox per project for org knowledge and reads from its own database for all other project data.

The firm's Claude Code skills (guardrails, SF development patterns, context retrieval) live in a central location (currently the `.claude` configuration) that developers pull from independently.

---

## 4. Target Users and Personas

### 4.1 Solution Architect / Tech Lead

The person who sets up the project in the web application. They connect the shared team sandbox, configure project settings, and lead the initial discovery. They use both the web application (for project management and discovery) and Claude Code (for technical architecture and code review). They are the project's admin within the application and can grant/revoke access for other team members.

### 4.2 Developer

Picks up assigned tickets in the web application, then works in Claude Code to execute them. Claude Code skills call back to the web application's API to fetch the ticket's context package (story details, acceptance criteria, org knowledge, related decisions). They deploy to their own development environment and eventually to the shared team sandbox through the team's Git/CI-CD workflow. They update ticket status in the web application.

### 4.3 Project Manager

Uses the web application as their primary work tool. They manage sprints, review dashboards, generate client-facing deliverables (status reports, presentations), and oversee project progress. They interact with the AI brain to get briefings, track blockers, and generate documents. They never interact with code or Git.

### 4.4 Business Analyst

Uses the web application as their primary work tool during discovery and requirements phases. They log discovery findings by chatting with the AI ("I got an answer to this question from the client"), create and refine user stories with AI assistance, and manage requirements. The AI automatically scopes, links, and organizes what they provide.

### 4.5 QA Engineer

Uses the web application to view test plans, log defects as tickets, execute tests and mark pass/fail status. QAs on this team run Playwright testing against the Salesforce environments. They interact with the project's user stories and their associated test cases.

### 4.6 Firm Administrator (V1: Application Owner)

In V1, this is the application owner (Michael). Firm-level settings — Salesforce development guardrails, branding assets, document templates, naming conventions — are configured directly in the application's codebase and database rather than through an admin UI. A dedicated admin interface is a future consideration when more people need to manage these settings.

---

## 5. System Architecture

### 5.1 High-Level Components

**Web Application (Next.js).** The central application that all users access. Hosts the UI, API routes, server actions, and the AI agent harness. Deployed on Vercel.

**Database (PostgreSQL).** The primary data store for all structured project data: projects, epics, features, user stories, questions, decisions, requirements, risks, sprint data, team members, and org metadata. Hosted on Neon or Supabase (managed PostgreSQL on Vercel's ecosystem).

**File Storage (S3 or Cloudflare R2).** Stores generated deliverables (Word documents, PowerPoint decks, PDFs), uploaded attachments, and branding assets.

**AI Agent Harness.** A server-side module within the Next.js application that manages all AI interactions. It handles prompt construction (injecting project context, guardrails, role-appropriate constraints), tool definitions (what the AI can read/write/query for each task type), execution management (single-turn vs. multi-step agent loops), and output validation. Detailed in Section 6.

**Background Job Infrastructure (Inngest).** An event-driven job system running on Vercel serverless functions via Inngest. Handles all asynchronous work: knowledge article refresh, dashboard synthesis cache, transcript processing, embedding generation, metadata sync, and notification dispatch. All state changes in the app emit Inngest events; job handlers subscribe to relevant events. Step functions with checkpoints allow long-running jobs (like metadata sync) to resume from the last successful step on failure. V1 runs entirely on Vercel serverless; a scaling path to dedicated workers (Railway/Fly.io with BullMQ + Redis) is documented in V2-ROADMAP.md for when V1 constraints are hit.

**Claude Code Skills (External).** Custom Claude Code skills maintained separately from the web application. These skills call the web application's REST API to fetch context packages and report back status. They enforce the six Salesforce development guardrails. The web application does not manage or deploy these skills.

**Salesforce Org Connection.** A read-only connection to one shared team sandbox per project. The web application periodically retrieves metadata from this sandbox and stores parsed results in PostgreSQL. Detailed in Section 13.

### 5.2 Data Model Overview

All structured data lives in PostgreSQL. The core entities, their relationships, and the join tables that connect them are described below. The detailed Prisma schema and foreign key specifications are documented in the Session 3 Technical Specification (a companion document to this PRD).

#### 5.2.1 Core Entities

**Project.** The top-level container. Every other entity belongs to exactly one project. Stores project name, client name, engagement type, current phase, start date, target end date, and the connected Salesforce org credentials (encrypted).

**ProjectMember.** The join between a user (from Clerk) and a project, with their role on that project. A consultant can have different roles on different projects. Roles: SOLUTION_ARCHITECT, DEVELOPER, PM, BA, QA. Includes join date and active/removed status.

**Epic.** A major workstream within a project. Has a name, prefix (used for ID generation), status, and description. Contains features and user stories. Each epic tracks its own progression through phases independently via the EpicPhase entity.

**EpicPhase.** Tracks an individual epic's status across applicable project phases (DISCOVERY, DESIGN, BUILD, TEST, DEPLOY). Not every epic goes through every phase — some may skip Design or Discovery. Status per phase: NOT_STARTED, IN_PROGRESS, COMPLETE, SKIPPED. This powers the Epic Phase Grid on the dashboard.

**Feature.** An optional grouping within an epic. Contains user stories. Some epics may have stories directly without features.

**User Story.** The atomic unit of work. Contains all mandatory fields (Section 10): persona, description, acceptance criteria (Given/When/Then), linked epic/feature, estimated story points, impacted Salesforce components. Also tracks status, sprint assignment (simple FK to Sprint), assignee, and priority. During discovery and design phases, stories may exist in Draft status with incomplete mandatory fields — validation only enforces on transition to "Ready." When a developer picks up a story in Claude Code, the AI may break it into atomic implementation steps within the Claude Code session; these ephemeral developer tasks are not persisted in the web application.

**Question.** The atomic unit of discovery (Section 9). Contains question text, scope (engagement-wide, epic, or feature), owner, status (Open/Answered/Parked), and when answered: answer text, answer date, and impact assessment. Blocking relationships to Stories, Epics, and Features are tracked via join tables (see Section 5.2.3). Cross-cutting questions that affect multiple epics use the QuestionAffects join table.

**Decision.** A recorded decision with rationale, date, who made it, and links to the questions that drove it (DecisionQuestion join) and the epics/features it affects (DecisionScope join).

**Requirement.** A captured business requirement with source, priority, status, and mapping to epics (RequirementEpic join) and stories (RequirementStory join).

**Risk.** An identified risk with likelihood, impact, severity, mitigation strategy, and links to affected epics (RiskEpic join).

**Milestone.** A significant project checkpoint with a name, target date (nullable for TBD), status (NOT_STARTED, IN_PROGRESS, COMPLETE), sort order, and description (including "what must happen" criteria). Progress is computed by the AI from the completion state of linked stories (MilestoneStory join) and the resolution state of blocking questions — not stored as a static percentage. Milestones power the Roadmap view on the dashboard.

**Sprint.** A time-boxed iteration with start date, end date, goal, and assigned stories. Story-to-sprint is a simple FK on the Story entity. Sprint carryover history (a story originally planned for Sprint 3 but completed in Sprint 4) is not tracked in V1 — flagged as a known simplification.

**TestCase.** An individual test scenario linked to a user story. Contains title, steps, expected result, and type (happy path, edge case, bulk, negative). Initially generated by the AI from acceptance criteria during story creation; QAs can add additional test cases. Each test case is a separate record, not a JSON array on the story.

**TestExecution.** A record of a single test run against a test case. Contains the test case reference, who executed it, when, result (PASS, FAIL, BLOCKED), notes, and an optional link to the defect it exposed. The same test case may be executed multiple times across sprints and regression cycles.

**Defect.** A bug or issue logged by QA with severity, steps to reproduce, expected vs. actual behavior, linked story, linked test case, status (OPEN, ASSIGNED, FIXED, VERIFIED, CLOSED), and the environment where the defect was observed.

**Org Component.** A Salesforce metadata component parsed from the shared sandbox. Stores API name, label, component type (object, field, class, trigger, flow, etc.), parent component (for fields: the parent object), namespace (for managed packages), API version, status (active/inactive), domain grouping, and timestamps.

**Org Relationship.** Cross-component relationships: relationship fields, trigger-to-object associations, flow-to-object associations.

**Domain Grouping.** Business domain clusters (e.g., "Sales," "Finance," "Marketing") with assigned org components. Initially suggested by the AI based on relationship analysis, then confirmed by the architect.

**Business Context Annotation.** Human-provided context attached to org components (e.g., "the Renewal_Status__c field on Opportunity tracks whether the client's finance team has approved the renewal"). Included in context packages when any story touches the annotated component.

**Generated Document.** A record linking to a file in S3 — the generated Word doc, PowerPoint, or PDF — with metadata about when it was generated, from what template, and for what purpose.

**Transcript.** A raw meeting transcript uploaded for AI processing. Stores the project reference, who uploaded it, upload timestamp, raw content (or S3 reference for large transcripts), processing status (PENDING, PROCESSING, COMPLETE, FAILED), and a link to the session log that processed it.

**Session Log.** A record of a single AI agent harness invocation. One entry per harness call (e.g., one transcript processing run, one briefing generation, one story enrichment). Stores: project, user who triggered it, task type (from the Section 6.2 table), start and completion timestamps, status (RUNNING, COMPLETE, FAILED, PARTIAL), token usage (input + output), a summary of what the AI did, and references to entities created or modified. This is both the audit trail and the cost tracking source.

**Attachment.** A file uploaded by a user and attached to a project entity. Stores the S3 file reference, original filename, content type, file size, the entity it's attached to (via entityType + entityId), who uploaded it, and when. Supports attachments on defects, stories, questions, and other entities.

**VersionHistory.** An audit record capturing the previous state of an entity before modification. Stores entity type, entity ID, version number, a JSON snapshot of the previous state, who modified it, and when. Used to support the optimistic concurrency conflict resolution described in Section 19.2, where the previous version is preserved when a conflict occurs.

**Business Process.** A logical business capability composed of multiple technical components working together (e.g., "Account Onboarding," "Renewal Pipeline"). Stores name, description, domain grouping reference, status (DISCOVERED, DOCUMENTED, CONFIRMED, DEPRECATED), complexity rating (LOW/MEDIUM/HIGH/CRITICAL), and flags for AI suggestion and human confirmation. Business processes are the structural skeleton of the knowledge architecture (Section 13.7): they answer "which components participate in this business capability?" through queryable SQL joins. Initially suggested by the AI during brownfield org ingestion (Section 13.6) and confirmed by the architect.

**Knowledge Article.** An AI-curated, versioned, natural-language synthesis of understanding about a topic. Articles are the persistent memory of the AI: instead of re-deriving understanding from raw database rows every session, the AI reads its own previous synthesis and builds on it. Each article has a type (BUSINESS_PROCESS, INTEGRATION, ARCHITECTURE_DECISION, DOMAIN_OVERVIEW, CROSS_CUTTING_CONCERN, STAKEHOLDER_CONTEXT), a title, markdown content, a one-line summary (for two-pass context loading), a confidence rating (LOW/MEDIUM/HIGH), a version number incremented on each refresh, staleness tracking fields, author type (AI_GENERATED, HUMAN_AUTHORED, AI_GENERATED_HUMAN_EDITED), and a vector embedding for semantic retrieval. Articles reference multiple entities (business processes, org components, epics, stories, questions, decisions) via a polymorphic join table. See Section 13.7 for the full knowledge architecture.

**Conversation.** A container for chat interactions within a project. Two types: (1) general project chat, one per project, auto-created, for quick conversational discovery; (2) task-specific sessions for discrete heavy-lift operations (transcript processing, story generation, briefings). Each task session maps to one SessionLog for cost tracking. All conversations are visible to project members with chat permission, persist permanently, and are browsable for audit trail and context continuity. The AI can reference previous conversations to maintain coherence across sessions.

**Chat Message.** An individual message within a Conversation. Stores the role (USER, ASSISTANT, SYSTEM), content text, sender reference (null for AI messages), optional tool call metadata (for AI transparency), and timestamp. Messages are append-only.

**Notification.** An in-app notification delivered to a specific project member. Stores the notification type (from a defined set of event types), title, optional body, a reference to the entity that triggered it (entityType + entityId), and read status. Notifications are dispatched by Inngest event handlers subscribing to existing app events. V1 is in-app only (notification bell with unread count); email and push notifications are deferred to V2.

#### 5.2.2 Computed Views (AI-Derived, Not Stored)

The following data is synthesized by the AI from the underlying entities and not stored as static fields. The AI computes these on demand or on a cached refresh cycle (see Section 6.4):

- **Milestone progress percentage** — derived from linked story completion and blocking question resolution.
- **Epic phase status transitions** — the AI updates EpicPhase records as stories within the epic progress through statuses.
- **Project health score** — computed from stale questions, blocked items, and risk thresholds (Section 17.4).
- **Current Focus narrative** — AI-generated synthesis of what the team should focus on right now.
- **Recommended Focus prioritization** — AI-ranked list of questions to follow up on, based on what they block.
- **Sprint conflict alerts** — detected from overlapping impacted components across in-flight stories.

#### 5.2.3 Join Tables and Relationships

The following many-to-many relationships are modeled as explicit join tables:

| Join Table | From | To | Additional Fields |
|---|---|---|---|
| QuestionBlocksStory | Question | Story | — |
| QuestionBlocksEpic | Question | Epic | — |
| QuestionBlocksFeature | Question | Feature | — |
| QuestionAffects | Question | Epic (nullable), Feature (nullable) | For cross-cutting questions |
| DecisionQuestion | Decision | Question | — |
| DecisionScope | Decision | Epic (nullable), Feature (nullable) | — |
| RequirementEpic | Requirement | Epic | — |
| RequirementStory | Requirement | Story | — |
| RiskEpic | Risk | Epic | — |
| StoryComponent | Story | OrgComponent | impactType: CREATE, MODIFY, DELETE |
| MilestoneStory | Milestone | Story | — |
| BusinessProcessComponent | BusinessProcess | OrgComponent | role (string: component's function in the process), isRequired (boolean) |
| BusinessProcessDependency | BusinessProcess | BusinessProcess | dependencyType: TRIGGERS, FEEDS_DATA, REQUIRES_COMPLETION, SHARED_COMPONENTS; description |
| KnowledgeArticleReference | KnowledgeArticle | (polymorphic) | entityType (BUSINESS_PROCESS, ORG_COMPONENT, EPIC, STORY, QUESTION, DECISION), entityId. No true FK: articles can reference many entity types. |

The StoryComponent join table is the foundation of sprint intelligence (Section 11). It enables conflict detection, dependency ordering, and parallelization analysis by querying which stories share impacted components.

### 5.3 API Design

The web application exposes a REST API consumed by Claude Code skills. Key endpoints:

**Context Package API.** `GET /api/projects/:projectId/context-package/:storyId` — Assembles and returns the scoped context package for a specific story. Includes the story details, acceptance criteria, parent epic/feature business context, relevant org components, related decisions and discovery answers, and in-flight stories touching overlapping components. This is the primary endpoint Claude Code skills call when a developer picks up a ticket.

**Org Knowledge API.** `GET /api/projects/:projectId/org/query` — Accepts a query (e.g., "fields on Account," "triggers on Case," "integrations touching Order") and returns filtered org metadata from the knowledge base. Used by Claude Code skills for on-demand lookups mid-task.

**Story Status API.** `PATCH /api/projects/:projectId/stories/:storyId/status` — Updates story status (e.g., "In Progress," "In Review," "Done"). Called by Claude Code skills to report progress.

**Component Report API.** `POST /api/projects/:projectId/org/component-report` — Accepts a report of components created or modified for a story. Used for tracking what developers build, though the authoritative org state comes from the sandbox sync.

**Project Summary API.** `GET /api/projects/:projectId/summary` — Returns the compact project summary (Tier 1 context) that Claude Code loads at the start of every session.

All API endpoints require authentication and are scoped to the requesting user's project access and role.

### 5.4 Authentication and Authorization

Authentication is handled by Clerk. Every consultant has their own account. Role assignment is per-project — a consultant could be a developer on one project and a PM on another. Roles determine what they can see and do within each project (detailed in Section 19).

---

## 6. AI Agent Harness

The agent harness is the server-side module that manages all AI interactions within the web application. It is the single point through which all AI requests flow.

### 6.1 Responsibilities

**Prompt Construction.** Every AI request is enriched with relevant context before being sent to Claude. The harness assembles the system prompt from: the task-specific instructions (what the AI should do), the project context relevant to the task (pulled from PostgreSQL), the firm-level constraints (formatting rules, mandatory fields, terminology), and the role-appropriate boundaries (what the requesting user can see and modify).

**Tool Definitions.** The harness defines what tools (function calls) the AI has access to for each task type. When processing a transcript, the AI can read and write questions, decisions, and requirements. When generating a story, the AI can read the epic context and org components but can only write to the story draft. When generating a briefing, the AI has read-only access across the project.

**Execution Management.** Some tasks are single-turn (generate a briefing from current state). Others are multi-step agent loops (process a transcript: extract items, scope each one, check for duplicates, file them, assess cross-references). The harness manages the loop, tracks token usage, and enforces maximum iteration limits.

**Output Validation.** After the AI generates output, the harness validates it against applicable rules. For user stories: mandatory field checks (Section 10). For documents: typographic rules (no em dashes, no AI-characteristic phrasing). For any generated text: terminology consistency. If validation fails, the harness re-prompts with specific correction instructions, up to a configurable retry limit.

**Token Management.** The harness tracks token usage per request, per project, and per user. It manages context window budgets by selecting what context to include based on relevance to the current task, summarizing older context when needed, and monitoring total context size against provider limits.

### 6.2 Task Types

The harness supports the following task types, each with its own prompt template, tool set, and validation rules:

| Task Type | Trigger | Tools Available | Validation |
|---|---|---|---|
| Transcript Processing | User pastes or uploads meeting notes, brain dump, or transcript | Read/write questions, decisions, requirements, risks, session log | Duplicate detection, scope assignment |
| Question Answering | User provides an answer to an open question | Read/write questions, read decisions and stories, write impact updates | Impact assessment completeness |
| Story Generation | User creates a story from a requirement or epic | Read epic/feature context, org components; write story draft | Mandatory field validation (Section 10) |
| Story Enrichment | User requests AI to improve an existing story | Read story and its context; write story updates | Mandatory field validation |
| Briefing Generation | User requests a project briefing | Read-only across all project data | Completeness check |
| Status Report Generation | User requests a client-facing status report | Read-only across all project data | Branding and typographic rules |
| Document Generation | User requests a branded deliverable | Read project data; write to S3 | Branding, typographic rules, template compliance |
| Sprint Analysis | User requests sprint planning analysis | Read stories, dependencies, org components | Conflict detection completeness |
| Context Package Assembly | Claude Code requests context for a ticket | Read story, epic, org components, decisions, questions | Relevance filtering, size budget |
| Org Query | Claude Code requests specific org knowledge | Read org components | Result relevance |
| Discovery Dashboard Synthesis | Dashboard requests current state summary | Read-only across questions, risks, execution state | Freshness check |

### 6.3 Firm-Level Rules (Hardcoded in V1)

The following rules are enforced by the harness on every AI output. In V1, these are configured in the application's codebase, not through a UI.

**Typographic Rules:**
- No em dashes in any generated text. Use hyphens or rephrase.
- No AI-characteristic phrasing (e.g., "Certainly!", "Great question!", "I'd be happy to help").
- Consistent date formats (Month DD, YYYY).
- Firm terminology and capitalization conventions.

**Mandatory Story Fields:** Enforced before any story can be marked as "Ready" (detailed in Section 10).

**Salesforce Guardrails:** Enforced in Claude Code skills, not in the web application's harness. The harness enforces documentation and process rules; Claude Code enforces code quality rules.

### 6.4 Implementation Architecture (Session 3)

The harness is built as three layers. All task-specific logic lives in task definitions; the execution engine is generic and reusable.

**Layer 1: Task Definitions.** Each of the task types in Section 6.2 is defined as a TypeScript configuration object containing: a task type identifier, a system prompt template with placeholders for project context, a context loader function (fetches the relevant slice of project data from Postgres for this task type), Claude API tool definitions (the functions the AI can call during this task), an output validator function, and an execution mode (SINGLE_TURN or AGENT_LOOP with max iteration count).

**Layer 2: Execution Engine.** A single generic module that takes a task definition plus user input and runs the execution loop: (1) call the context loader to fetch project data, (2) assemble the system prompt from template + context + firm rules, (3) call Claude API with prompt, user input, and tool definitions, (4) if tool calls are returned, execute them (database writes via Prisma), collect results, send back to Claude for next iteration, repeat until final response or iteration limit, (5) run output validator — if invalid, re-prompt with corrections up to retry limit, (6) write session log entry, (7) return result to frontend.

**Layer 3: Context Assembly.** Reusable database query functions composed differently by each task's context loader. Core functions include: getProjectSummary, getEpicContext, getOpenQuestions (filterable by scope), getOrgComponents (filterable by component names), getRecentSessions, getBlockingRelationships, getMilestoneProgress. These are the building blocks that task-specific context loaders compose.

**Tool Execution and Transaction Handling.** When Claude calls a tool during an agent loop (e.g., `create_question` during transcript processing), the tool validates input, checks for duplicates, writes to Postgres, and returns the created entity (with generated ID) for Claude to reference in subsequent iterations. Each tool call commits independently — there is no rollback if the loop fails partway. Partial results are preserved, the session log records what was created, and the user can see and clean up if needed.

**Transcript Processing — Token Economics.** Transcript processing is the most expensive task type. A typical transcript (5,000-10,000 words) may require 4-8 agent loop iterations with 15-20K input tokens per iteration to extract 8-15 discrete items (questions, decisions, requirements). Total cost per transcript: approximately $0.50-$1.50 at Claude Sonnet pricing, $3-4 at Opus pricing. The context loader for this task type loads open questions, recent decisions, and epic/feature structure — not the full org knowledge base.

### 6.5 Dashboard Synthesis Strategy (Session 3)

Dashboard content follows a hybrid approach for performance and cost management:

**Instant (database queries, no AI).** All quantitative dashboard data is served directly from Postgres queries with no AI involvement: open question counts, milestone statuses, epic phase grid, sprint burndown, story status breakdowns, blocking relationships, test execution metrics, and health score computation. These render immediately on page load.

**Cached AI synthesis (generated on trigger, not on page load).** Qualitative content — the "Current Focus" narrative, "Recommended Focus" prioritization, and briefing summaries — is generated by the AI and cached. Generation is triggered by meaningful state changes (question answered, story status changed, milestone reached) or by the user clicking "Refresh Briefing." The cached result includes a generation timestamp so users know how fresh it is. This avoids burning tokens on every dashboard page load while keeping the AI-synthesized content reasonably current.

### 6.6 AI Ambiguity Handling (Session 5)

When the AI extracts or generates entities and is uncertain about the correct interpretation, it follows a context-dependent approach:

**General chat (user present).** The AI asks an inline clarifying question, then proceeds once the user responds.

**Task sessions (transcript processing, bulk operations).** The AI makes its best guess and attaches a confidence flag. Uncertain items are surfaced at the end of the session as a review list. The task session completion UX shows a summary of created entities, count by confidence level, and a "Needs Review" section listing flagged items with reasons. The user can click into each to confirm, edit, or discard.

**Background jobs (article refresh, embedding generation).** The AI makes its best guess and flags the item. No user to ask.

**Schema additions for AI-created entities.** The following fields are added to Question, Decision, Requirement, and Risk (entities that are typically AI-extracted):

| Field | Type | Default | Purpose |
|---|---|---|---|
| confidence | Enum: HIGH, MEDIUM, LOW | HIGH | AI's certainty about the extraction |
| needsReview | Boolean | false | Set true when AI is uncertain |
| reviewReason | String (nullable) | null | Why the AI flagged it (e.g., "Could not determine scope: mentioned both Data Migration and Sales Process epics") |

These fields are not added to BusinessProcess, KnowledgeArticle, or DomainGrouping, which already have their own confirmation flows (isAiSuggested/isConfirmed or confidence/staleness mechanisms).

---

## 7. Project Lifecycle

### 7.1 Project Creation

A solution architect or tech lead creates a new project in the web application. During setup, they provide: client name and engagement details, engagement type (greenfield, build phase, managed services, or rescue/takeover), team members and their roles, and the shared team sandbox connection details.

The application provisions the project's data space in PostgreSQL, creates default epic templates based on engagement type, and triggers the initial org metadata sync if a sandbox is connected.

There is no single structured onboarding interview. Instead, the project's AI brain begins accumulating knowledge immediately through the progressive discovery workflow (Section 8).

### 7.2 Standard Phases

Every project, regardless of engagement type, progresses through these phases. The active phase determines which dashboard views are emphasized and which AI capabilities are highlighted.

1. **Discovery.** The team gathers information from the client. The AI brain accumulates knowledge through the discovery workflow (Section 8). Questions are raised, scoped, and tracked. Requirements are captured and linked. The AI surfaces gaps and suggests when enough information exists to begin defining epics and stories.

2. **Requirements and Story Definition.** Epics, features, and user stories are created and refined with AI assistance. Stories go through mandatory field validation before they can enter a sprint. The AI suggests story breakdowns from requirements and cross-references the org knowledge base for impacted components.

3. **Solution Design.** Technical architecture is defined. Architecture decision records are created and linked to the questions and requirements that drove them. The org knowledge base informs design decisions.

4. **Build (Iterative Sprints).** Developers pick up tickets and execute through Claude Code. Sprint intelligence (Section 11) manages planning, conflict detection, and dependency tracking. The org knowledge base updates as new components land in the shared sandbox.

5. **Testing.** QAs execute test plans, log defects, and track test results. Defects are created as tickets in the application and linked to the stories they relate to.

6. **Deployment.** The application generates deployment runbooks and checklists from the sprint's completed stories and their impacted components. Humans execute the deployment through the firm's standard process. The AI does not deploy.

7. **Hypercare and Handoff.** Post-go-live support. The application generates knowledge transfer materials and training documents from the project's accumulated knowledge base.

8. **Archive.** Project is set to read-only. Detailed in Section 21.

### 7.3 Engagement Types

The engagement type selected at project creation affects which phases are emphasized, which default epics are created, and how the AI prioritizes its assistance:

- **Greenfield:** Full lifecycle. All phases active. Discovery starts from zero.
- **Build Phase:** Client has completed discovery externally. The team imports or recreates key requirements and decisions in the application. Story definition and solution design are the entry points.
- **Managed Services:** Ongoing support of an existing org. Emphasis on org ingestion, continuous enhancement requests, and SLA tracking rather than a single discovery-to-deployment arc.
- **Rescue/Takeover:** Inheriting a troubled project. The org knowledge base includes an Org Health Assessment (code quality, security analysis, technical debt inventory) and the discovery phase focuses on understanding what exists and what's broken before planning remediation.

### 7.4 Context Evolution

The project's AI context is not static. It is built progressively:

- During discovery, through transcript processing, direct question/answer logging, and requirement capture.
- During story definition, through story creation, refinement, and acceptance criteria development.
- During build, through architecture decisions, component creation reports, and defect analysis.
- At any time, through any team member chatting with the AI to log new information, ask questions, or request synthesis.

Every interaction that adds to the knowledge base is logged in the session log for audit trail and context continuity. The AI can reference previous sessions to maintain coherence across conversations.

---

## 8. Discovery Workflow

Discovery is a first-class product feature, not just a project phase. It is the workflow through which the AI brain accumulates the knowledge that powers everything else in the application.

### 8.1 Core Concept

Multiple PMs and BAs work simultaneously during discovery, gathering information from different client departments and stakeholders. The application is the centralized place where all discovery information is collected. People bring information here — the application does not scan or import from external tools.

The AI's job during discovery is to receive unstructured information and organize it automatically. A BA can chat with the AI and say "I just talked to the client's finance team and they confirmed that renewal opportunities should not auto-close — they need to stay open until a manual review is completed." The AI:

1. Records this as an answer to an existing open question (if one matches) or creates a new decision.
2. Links it to the relevant epic(s) and feature(s).
3. Checks if this answer changes any existing technical design or assumption.
4. Checks if this unblocks any work items.
5. Checks if this raises new questions.
6. Updates the knowledge base accordingly.

### 8.2 Information Input Methods

**Chat with the AI.** The primary input method. The chat interface follows a hybrid model with two conversation types:

- **General project chat.** One per project, auto-created. A persistent, shared conversation for quick conversational discovery. All project members with chat permission can see it. Each message triggers an independent harness call. Interleaved messages from multiple users are handled as independent interactions, with conflict detection catching contradictory information across conversations.
- **Task sessions.** Discrete, scoped conversations for heavy-lift tasks (transcript processing, story generation, briefings). Each session maps to one SessionLog for cost tracking. Simultaneous task sessions are independent of each other and of the general chat.

All conversations persist permanently. Nothing is ephemeral. The AI can reference previous conversations for context continuity. Session history is browsable for audit trail purposes.

Users type or paste information in either conversation type. The AI extracts structured data (questions, answers, decisions, requirements, action items) and files them appropriately. Examples:
- "The client confirmed that they use Pardot for email marketing and it's integrated through the standard Salesforce connector."
- "Sarah from the client's IT team said they have 3 million Account records and about 12 million Contacts."
- "Decision: we're going to use a custom object for the renewal tracking instead of modifying the existing Opportunity process."

**Transcript Processing.** A user pastes or uploads a meeting transcript (from Zoom, Teams, Gong, or any other source). The AI processes the entire transcript and extracts:
- Questions raised during the meeting
- Questions answered during the meeting
- Decisions made
- Requirements stated or implied
- Action items
- New scope items or changes

For each extracted item, the AI scopes it, assigns ownership based on context, files it in the appropriate place, and cross-references it against existing knowledge. The raw transcript is saved for reference.

**Direct Question/Answer Entry.** Users can raise new questions or answer existing ones directly through the UI (not just through chat). This supports workflows where a BA reviews the outstanding questions dashboard and enters answers they've received outside of formal meetings.

### 8.3 AI-Driven Discovery Intelligence

The AI does not just store what it's told. It actively analyzes the state of discovery and surfaces insights:

**Gap Detection.** The AI identifies areas where not enough information has been gathered. "Epic: Data Migration has 12 open questions and 3 have been answered. The merge rules and duplicate handling questions are blocking technical design."

**Readiness Assessment.** The AI suggests when there is enough information to begin creating epics, features, or user stories. "Based on the answered questions and captured requirements for Epic: Report Audit, I believe there's enough context to draft the initial user stories. Here are the 4 requirements that would drive them."

**Conflict Detection.** The AI flags when new information contradicts existing decisions or assumptions. "The answer to Q-ENG-005 (email segments dynamically update) contradicts Decision D-DM-003 (we assumed segments would need manual rebuild after data migration). This needs resolution."

**Follow-Up Recommendations.** The AI recommends which questions to prioritize based on what they block. "Q-RA-003 (report access permissions) is blocking the technical design for 3 user stories in Epic: Report Audit. This should be the next question you ask the client."

### 8.4 Discovery Dashboard

The discovery dashboard (part of the broader dashboard system in Section 17) shows:

- Outstanding questions by scope (engagement-wide, per-epic, per-feature) with owner and age
- Questions the AI recommends following up on, with reasoning
- Recently answered questions and their impact
- Blocked work items (stories, design sections) and what they're waiting on
- Overall discovery progress per epic
- Requirements captured but not yet mapped to epics/stories
- Project health score (computed from stale questions, blocked items, and risk thresholds)

---

## 9. Question System

Questions are the atomic unit of discovery. The question system tracks every unknown from the moment it is raised through to resolution and downstream impact. It is the engine that drives the knowledge base.

### 9.1 Question Lifecycle

```
RAISED -> SCOPED -> OWNED -> ANSWERED -> IMPACT ASSESSED
                                              |
                                  +-----------+-----------+
                                  v           v           v
                            Design updated  New questions  Work unblocked
                                            raised
```

1. **Raised.** A question is identified from any source: chat with the AI, transcript processing, meeting notes, design review, build-phase discovery, or direct entry.
2. **Scoped.** The AI determines whether the question is engagement-wide, epic-scoped, or feature-scoped, and assigns it to the appropriate scope.
3. **Owned.** An owner is assigned: a specific team member, the client (with contact name), or "TBD."
4. **Answered.** The answer is recorded. The AI then performs the impact assessment.
5. **Impact Assessed.** The AI checks:
   - Does this answer change any existing technical design or assumption? If yes, update it.
   - Does this answer resolve a blocker on any user story, task, or design section? If yes, flag the item as unblocked.
   - Does this answer raise new questions? If yes, create them.
   - Does this answer contradict a previous decision? If yes, flag the conflict.

### 9.2 Question ID Scheme

Format: `Q-{SCOPE}-{NUMBER}`

- `{SCOPE}` is a short prefix: `ENG` for engagement-wide, an epic's 2-4 letter prefix for epic-scoped (e.g., `DM` for Data Migration), or `{EPIC}-{FEATURE}` for feature-scoped.
- `{NUMBER}` is a zero-padded incrementing number (e.g., `001`).

Examples: `Q-ENG-001`, `Q-DM-001`, `Q-DM-LRT-001`.

### 9.3 Question Data Model

Each question record contains:

| Field | Required | Description |
|---|---|---|
| ID | Yes | Unique ID per the scheme above. Auto-generated. |
| Question | Yes | The question text, stated clearly enough that someone outside the project could understand it. |
| Scope | Yes | Engagement, Epic (with reference), or Feature (with reference). |
| Owner | Yes | Who is responsible for getting the answer. A team member, "Client ({name})," or "TBD." |
| Status | Yes | Open, Answered, or Parked. |
| Asked Date | Yes | Date the question was raised. Auto-set. |
| Blocks | No | References to work items (stories, design sections) waiting on this answer. |
| Affects | No | For cross-cutting questions: which epics/features this touches. |
| Answer | On answer | The answer text. |
| Answered Date | On answer | Date the answer was recorded. |
| Impact | On answer | What changed as a result: links to updated items, unblocked work, new questions raised. |
| Parked Reason | On park | Why this question is deferred. |

### 9.4 Cross-Cutting Questions

Some questions affect multiple epics. These are scoped as engagement-wide (`Q-ENG-*`) and include an "Affects" field listing the epics they touch. The AI identifies cross-cutting questions automatically when it detects that the question's subject matter relates to multiple epics.

### 9.5 Question Volume Expectations

For a typical consulting engagement: 5-15 engagement-wide questions, 10-30 questions per epic, 5-15 questions per feature. At scale, a project might have 100-200 total questions across all scopes.

---

## 10. Epic, Feature, and User Story Management

### 10.1 The Application as System of Record

The web application is the primary system of record for all work items: epics, features, user stories, bugs, and tasks. This is not a layer on top of Jira or Linear. The application owns this data. If a client requires stories in their Jira, optional one-directional sync pushes stories from this application to the client's Jira (Section 20).

### 10.2 Work Item Hierarchy

**Epic** > **Feature** (optional) > **User Story** > **Task** (optional, used during developer execution)

Epics represent major workstreams (e.g., "Data Migration," "Report Audit," "Integration Setup"). Features are optional groupings within an epic. User stories are the atomic unit of deliverable work. Tasks are sub-breakdowns of a story, typically created by the developer and AI during ticket execution (Section 12).

### 10.3 Mandatory Story Fields (Firm-Level, Enforced)

Every user story must have the following fields populated before it can be marked as "Ready" (eligible for sprint assignment). The AI assists with generating content for these fields, but a human must review and approve.

- **Persona.** "As a [specific user role]..." format. The AI must use a concrete persona from the project's stakeholder list, not generic placeholders.
- **Description.** What the user needs and why.
- **Acceptance Criteria.** Given/When/Then format. At minimum, one happy path scenario and one exception/edge case scenario.
- **Linked Epic or Feature.** Every story must reference its parent.
- **Estimated Story Points.** Must be populated before sprint entry. The AI can suggest an estimate based on complexity analysis, but a human must confirm.
- **Test Case(s).** At least one test case defined. The AI generates test case stubs from the acceptance criteria.
- **Impacted Salesforce Components.** A list of which objects, fields, classes, flows, or other metadata this story will create or modify. Cross-referenced against the org knowledge base.

### 10.4 Story Generation Workflow

When a BA or PM creates a story through the web application, the AI assists by:

1. Analyzing the requirement, epic context, and discovery knowledge the story relates to.
2. Suggesting the story description, persona, and acceptance criteria.
3. Cross-referencing the org knowledge base to identify impacted components and flag conflicts ("this field already exists on Account — are you extending it or creating a new one?").
4. Running mandatory field validation before allowing the story to be marked as "Ready."
5. If any mandatory field is missing or fails format requirements, the AI highlights what needs to be corrected and suggests specific content.

Stories in "Draft" status can have incomplete fields. Only the transition to "Ready" enforces full validation.

### 10.5 Story Statuses

Draft > Ready > Sprint Planned > In Progress > In Review > QA > Done

- **Draft:** Story is being created or refined. Not all mandatory fields are populated.
- **Ready:** All mandatory fields validated. Eligible for sprint assignment.
- **Sprint Planned:** Assigned to a sprint but work has not started.
- **In Progress:** A developer is actively working on this story.
- **In Review:** Code is complete and in code review.
- **QA:** Code review passed, QA testing in progress.
- **Done:** Story is complete. All acceptance criteria verified.

---

## 11. Sprint Intelligence

The AI is an active participant in sprint planning, not a passive dashboard.

### 11.1 Sprint Planning Assistance

Before a sprint begins, the AI can analyze the candidate stories and provide:

**Execution Mapping.** Which stories should be tackled first based on dependencies. If Story A creates the custom object that Story B adds fields to, A must come first. The AI identifies these chains by analyzing impacted components across stories.

**Parallelization Analysis.** Which stories can be worked on simultaneously without conflict. If Story C touches Account and Story D touches Case with no overlap, they can be parallelized.

**Conflict Detection.** Which stories have overlapping impacted components. If two stories both modify the same Apex class or Flow, the AI flags the potential merge conflict and suggests sequencing — or recommends that one developer handles both.

**Capacity Assessment.** Given the number of developers and the estimated story points, the AI flags if the sprint is over- or under-committed.

### 11.2 Mid-Sprint Analysis

When tickets are added or reassigned mid-sprint, the AI can re-run its analysis:

- Flag new conflicts introduced by the change.
- Suggest resequencing if dependencies have shifted.
- Alert if the sprint is now over-committed.

### 11.3 Cross-Developer Coordination

The AI tracks which developers are working on which stories and their impacted components. When it detects overlap, it surfaces a recommendation: "Developer A is working on STORY-42 which modifies AccountTriggerHandler. Developer B is about to start STORY-55 which also touches AccountTriggerHandler. Recommend Developer A completes and merges first, or assign both to Developer A."

---

## 12. Developer Execution Integration

### 12.1 How Developers Work

Developers use the web application to view their assigned tickets and sprint plans. When they pick up a ticket, they work in Claude Code. Claude Code skills call back to the web application's API to get everything they need.

### 12.2 Context Architecture

The context architecture ensures Claude Code has the right information for every task without overloading the context window. Claude Code draws from two distinct sources: the **web application** (business intelligence, project knowledge, cross-team context) and the **Salesforce CLI** (live technical reality from the developer's authenticated sandbox).

**Tier 1 — Project Summary (Always Loaded).** A compact project summary (1-2 pages) that lives in every Claude Code session. It covers the project's architectural patterns, naming conventions, key decisions, the six guardrails, current sprint focus, and a "map" of how to request more detail from the web application's API and from the local SF CLI. This is generated and kept current by the web application.

**Tier 2 — Ticket Context Package (Assembled on Pickup).** When a developer picks up a ticket, Claude Code calls the web application's Context Package API (`GET /api/projects/:projectId/context-package/:storyId`). The web application assembles a scoped package containing:

- The full user story, acceptance criteria, and test case stubs.
- The parent epic/feature and its business context.
- Business processes that involve components this story touches, with role descriptions explaining what each component does in the process.
- Top relevant knowledge articles (full content) providing the AI's synthesized understanding of the business domain.
- Related discovery notes and decisions.
- Other in-flight stories that touch overlapping components (the sprint intelligence flag).

The web application does the filtering. It knows what's relevant because the story has an "impacted components" field. It traverses relationships one or two hops out and uses semantic search to find the most relevant knowledge articles. The result is a focused context package: business intelligence and project knowledge that the developer's local environment cannot provide.

**Tier 3a — Business Intelligence Lookups (Web App API).** During execution, Claude Code can call the web application's API for business context not in the initial package:

- `GET /api/projects/:projectId/org/query` for enriched org knowledge with business context annotations, domain groupings, and process relationships.
- Knowledge article queries: "Show me the business context for the Renewal process" returns the AI-curated synthesis of that process, not just raw metadata.
- Cross-story context: "Are there other stories touching this component?" for real-time sprint conflict awareness.

This channel provides the *why* and *how it fits together*: business processes, knowledge articles, decisions, cross-team dependencies.

**Tier 3b — Live Org Inspection (SF CLI).** Claude Code runs SF CLI commands directly against the developer's authenticated Salesforce sandbox to inspect the actual current state of the org:

- `sf org list metadata` to see what metadata types exist.
- `sf project retrieve start` to pull current source for specific components.
- Direct inspection of Apex classes, triggers, flows, field definitions, permission sets, and any other metadata the developer's sandbox contains.

This channel provides the *what exists right now*: actual source code, current field definitions, live object schemas. It is the technical ground truth. The developer must be authenticated to their sandbox via SF CLI for this to work (standard SF development setup).

**Why both channels exist:** The web app knows things the SF CLI cannot: which business process a trigger supports, what the client said about renewal logic in a discovery meeting, which other developer is modifying the same class. The SF CLI knows things the web app cannot: the exact current source code in the developer's sandbox, fields added since the last metadata sync, the developer's local customizations. Claude Code merges both to plan and execute effectively.

### 12.3 Developer Workflow Steps

1. Developer views assigned tickets in the web application.
2. Developer opens VS Code with Claude Code and the Salesforce Extension Pack. They are authenticated to their development sandbox via SF CLI.
3. Developer invokes the ticket start skill (e.g., `sf-ticket start STORY-42`).
4. Claude Code calls the web application's Context Package API and loads the business context: story details, acceptance criteria, business processes, knowledge articles, related decisions, sprint conflicts.
5. Claude Code inspects the developer's authenticated sandbox via SF CLI to understand what currently exists: pulls relevant component source, checks field definitions, reviews existing triggers and flows that the story touches. Example: "Based on the story requirements, this touches AccountTriggerHandler and 3 custom fields on Account. Let me pull the current source from your org... here's what exists."
6. Claude Code cross-references the business intelligence (from the web app) with the technical reality (from the SF CLI) and architects the implementation: identifies what needs to be created vs. modified, flags any discrepancies between the story's impacted components list and what actually exists in the org, and proposes a plan.
7. Claude Code breaks the story into atomic implementation tasks optimized for AI execution. The developer reviews and approves the plan. These ephemeral task breakdowns are not persisted to the web application; the web app tracks work at the story level only.
8. The AI executes each task: generating Salesforce metadata and code with all six guardrails enforced.
9. The developer reviews, tests locally, and deploys to their development environment.
10. The developer updates the story status in the web application (or Claude Code does it via the Status API).
11. The developer goes through the team's Git and code review process.
12. When the code is merged and deployed to the shared team sandbox, the web application picks it up on the next org sync.

### 12.4 What Claude Code Can Build

Claude Code with the Salesforce development skills can generate any metadata type deployable through the Salesforce CLI: Apex classes, Apex triggers, test classes, Lightning Web Components, Aura components, Flows, Lightning Pages, custom objects, custom fields, validation rules, record types, page layouts, permission sets, custom tabs, list views, reports, dashboards, email templates, static resources, Connected Apps, Named Credentials, Platform Events, Custom Metadata Types, buttons, and any other metadata type the SF CLI supports.

---

## 13. Salesforce Org Connectivity and Knowledge Base

### 13.1 Connection Model

Each project connects to exactly one Salesforce environment: the shared team sandbox. This is the single environment the web application reads from. It does not connect to individual developer sandboxes, scratch orgs, or production.

The connection is established by the solution architect during project setup using standard Salesforce authentication (OAuth 2.0 JWT Bearer Flow or Web Server Flow). Credentials are encrypted and stored in the database, scoped to the project.

### 13.2 Read-Only Constraint

The web application and all of its processes must never perform write operations against the connected Salesforce org. No deployments, no data manipulation, no metadata changes, no user or permission changes. This is a hard constraint that cannot be overridden. The web application reads metadata; humans deploy through the firm's standard process.

### 13.3 Metadata Sync

The web application periodically retrieves metadata from the connected sandbox and parses it into the org knowledge base in PostgreSQL. The sync includes:

- Custom and standard objects with their fields, relationships, and record types.
- Apex classes and triggers (inventory only — names, API versions, line counts, not full source analysis).
- Flows, Process Builders, Workflow Rules, Validation Rules (inventory and object associations).
- Lightning Web Components and Aura components.
- Permission Sets, Profiles, Permission Set Groups.
- Connected Apps, Named Credentials, Remote Site Settings.
- Installed packages with namespaces and versions.
- Any other metadata types retrievable via the Salesforce CLI.

The sync is triggered:
- Automatically at a configurable interval (default: every 4 hours during business hours).
- Manually by the architect or tech lead via a "Refresh Org Knowledge" action in the web application.
- Automatically at project creation if a sandbox is connected.

### 13.4 Org Knowledge Base Structure

The parsed metadata is stored in PostgreSQL in normalized tables. The core structure:

**Org Components Table.** One row per metadata component. Columns: API name, label, component type (object, field, class, trigger, flow, etc.), parent component (for fields: the parent object), namespace (for managed package components), API version, status (active/inactive), and timestamps.

**Org Relationships Table.** Relationship fields, trigger-to-object associations, flow-to-object associations, and other cross-component relationships.

**Domain Groupings Table.** Business domain clusters (e.g., "Sales," "Finance," "Marketing") with assigned components. Initially suggested by the AI based on relationship analysis, then confirmed or adjusted by the architect.

**Business Context Annotations Table.** Human-provided context attached to org components. When a BA says "the Renewal_Status__c field on Opportunity tracks whether the client's finance team has approved the renewal" — that annotation is stored and included in context packages when any story touches that field.

### 13.5 Progressive Updates

The org knowledge base is progressively updated:

1. **On sandbox sync:** New components detected in the sandbox are added. Modified components are updated. Removed components are flagged (but not deleted, to preserve history).
2. **From discovery:** Business context annotations are added as the team learns what org components are used for.
3. **From story execution:** When a story's impacted components list includes new components that don't yet exist in the knowledge base, placeholder entries are created marked as "planned."

### 13.6 Brownfield Org Ingestion

For brownfield and managed services engagements, the initial sync performs a comprehensive metadata pull. The ingestion runs in four phases:

```
Phase 1: Parse    -> OrgComponent + OrgRelationship rows
Phase 2: Classify -> DomainGrouping suggestions
Phase 3: Synthesize -> BusinessProcess + BusinessProcessComponent suggestions (NEW)
Phase 4: Articulate -> KnowledgeArticle drafts, one per process + one per domain (NEW)
```

**Phases 1-2** are unchanged from the original design: raw metadata is parsed into normalized component and relationship rows, then the AI proposes business domain groupings.

**Phases 3-4** run as a single AI call (they need the same context; splitting them would re-derive understanding twice). The AI analyzes the parsed components and their relationships to identify logical business processes ("Account Onboarding," "Renewal Pipeline"), creates BusinessProcess and BusinessProcessComponent records linking processes to their constituent components, then writes initial KnowledgeArticle drafts synthesizing its understanding of each process and each domain.

**Confirmation model:** All AI-generated entities from ingestion require human review before being treated as trusted context:
- BusinessProcess: `isAiSuggested = true`, `isConfirmed = false`, `status = DISCOVERED`
- KnowledgeArticle: `authorType = AI_GENERATED`, `confidence = LOW` or `MEDIUM`
- The architect reviews and confirms all AI suggestions through the web application UI.

For rescue/takeover engagements, the AI also generates an Org Health Assessment: code quality analysis (test coverage, code complexity, governor limit risk areas), security analysis (sharing model review, FLS compliance, hardcoded IDs), technical debt inventory, and a recommended remediation backlog. This assessment is stored as a project artifact and informs the discovery and planning phases.

### 13.7 Three-Layer Knowledge Architecture (Session 4-5)

The org knowledge base uses a three-layer architecture to support both queryable structure and persistent AI understanding:

**Layer 1: Structured Relationships (queryable, in Postgres).** BusinessProcess entities linked to OrgComponents via BusinessProcessComponent join tables, with BusinessProcessDependency for process-to-process relationships. This layer answers questions like "Which components participate in Account Onboarding?" and "This story modifies a component that participates in 3 business processes." It powers dashboards, sprint intelligence impact analysis, and conflict detection through standard SQL joins.

**Layer 2: Synthesized Understanding (AI-curated, in Postgres).** KnowledgeArticle entities containing AI-maintained, versioned, natural-language synthesis of understanding about topics. Articles are the AI's persistent memory. Instead of re-deriving understanding from raw rows every session, the AI reads its own previous synthesis and builds on it. Articles cover business processes, integrations, architecture decisions, domain overviews, cross-cutting concerns, and stakeholder context. Articles reference multiple entities via KnowledgeArticleReference, enabling retrieval like "give me all articles that reference any component this story touches."

**Layer 3: Semantic Retrieval (pgvector embeddings).** Vector embeddings on KnowledgeArticle.content, OrgComponent fields, and other searchable entities. This layer is the retrieval mechanism for finding relevant articles and components to load into AI context. It answers fuzzy queries like "find anything related to account creation" where exact keyword matching would miss results. The tech spec already has `embedding` columns on OrgComponent; this extends to KnowledgeArticle and other entities that need semantic search.

**Layer 1 is the skeleton (structure). Layer 2 is the muscle and memory (understanding). Layer 3 is the nervous system (retrieval).**

**Article update triggers (hybrid model):**
- During agent interactions, the AI flags articles as "potentially stale" inline (cheap DB update: `staleReason`, `staleSince` timestamp). No synthesis during the agent loop.
- A background Inngest job performs deep refresh: re-reads referenced entities, rewrites article content, updates version and embedding.
- Trigger conditions for flagging: the agent touches a component referenced by an article, the agent answers a question that changes understanding of a topic, or a user confirms/corrects a domain grouping or business process.
- End of every agent loop, the execution engine queries which articles reference entities the agent modified and sets `isStale = true` + `staleReason`. This is a DB query only, no AI call.

**Two-pass context retrieval pattern:**
1. Load article summaries for the relevant scope (~50 tokens each).
2. Embed the task/query and find top-N articles by cosine similarity.
3. Load full content of only the top-N articles.

This keeps token costs low while giving the AI access to the most relevant synthesized knowledge.

---

## 14. Recommended Sandbox Strategy

The web application does not provision or manage Salesforce environments. However, the application's architecture assumes a specific environment topology. This section documents the recommended strategy that accompanies the application.

### 14.1 Required Environments

For any project using this application, the team needs at minimum:

**One shared team sandbox.** This is the environment the web application connects to. It is the single source of truth for "what exists in this project's org." All merged, reviewed code lands here. The web application reads metadata from this environment and builds its org knowledge base from it.

**One development environment per developer.** Each developer deploys to their own isolated environment during development. This prevents developers from overwriting each other's in-progress work and ensures the web application's knowledge base reflects only reviewed, merged code — not in-flight experiments. The environment type (Developer sandbox, Developer Pro, Partial Copy, or scratch org) is the team's choice.

### 14.2 Environment Type Guidance

The sandbox type depends on the engagement:

- **Greenfield projects:** Scratch orgs or Developer sandboxes are sufficient for individual developers. The shared team sandbox can be a Developer Pro or Partial Copy, depending on whether realistic data volumes are needed for testing.
- **Brownfield / managed services:** Partial Copy sandboxes are recommended for the shared team sandbox and for developer environments, because developers need the existing customizations available for testing. Scratch orgs will not have the existing org's metadata and are generally not suitable for brownfield work.
- **Rescue/takeover:** Full or Partial Copy sandbox as the shared team sandbox, since the team needs to work with the existing org's full state.

### 14.3 Brownfield + Scratch Org Warning

If a project is marked as brownfield or managed services and a developer's environment is identified as a scratch org, the application should surface a warning: "This is a brownfield engagement but Developer X's environment is a scratch org. Their environment will not have the existing org customizations. Testing against the shared team sandbox or a partial copy is recommended."

### 14.4 What This Application Does Not Do

The application does not provision sandboxes, manage sandbox refreshes, track sandbox metadata independently, or serve as a change management or deployment tool. It reads from one environment and builds knowledge from it. Sandbox lifecycle management and deployment orchestration are handled by the team through their existing processes and tools (Salesforce Setup, SF CLI, CI/CD pipelines).

---

## 15. Salesforce Development Guardrails

The following guardrails are enforced as hard rules on all AI-generated Salesforce code and metadata. These are implemented in the Claude Code skills as both prompt-level system instructions (pre-processing) and static analysis validators (post-processing). They cannot be disabled.

The web application does not enforce these guardrails directly — it does not generate Salesforce code. The guardrails live in the Claude Code skills that developers use. The web application's role is to include guardrail reminders in the Tier 1 project summary and to reference them in context packages.

### 15.1 Governor Limits Awareness

The AI must never generate code that performs SOQL queries inside loops, DML operations inside loops, or any pattern that risks hitting Salesforce governor limits. Post-processing static analysis detects these patterns. If detected, the output is rejected and the AI is re-prompted with the specific violation identified.

### 15.2 Bulkification

All trigger handler code must be bulkified. The AI must generate handlers that operate on collections (List, Set, Map) rather than single records. Trigger handlers must follow the firm's handler pattern: one trigger per object, trigger calls handler class, handler operates on Trigger.new / Trigger.old as collections.

### 15.3 Test Class Requirements

Every generated Apex class or trigger must be accompanied by a test class. Test classes must include: positive test cases, negative test cases (expected failures, boundary conditions), bulk test cases (inserting 200+ records to verify governor limit compliance), and assertions that verify actual behavior rather than just confirming no exception was thrown.

### 15.4 Naming Conventions

All generated components must follow the firm's naming convention rules. Examples: AccountTriggerHandler (not AcctTH), AccountService (not AccountSvc), AccountSelector (not AccountQuery). The specific patterns are configurable at the firm level, but the enforcement of having and following a naming convention is locked.

### 15.5 Security Patterns

All generated Apex must include CRUD and FLS checks before DML and SOQL operations (using Security.stripInaccessible or Schema.sObjectType describes). No hardcoded Salesforce record IDs, org IDs, or user IDs may appear in generated code. No SOQL injection vulnerabilities; all dynamic SOQL must use bind variables or String.escapeSingleQuotes.

### 15.6 Sharing Model Enforcement

Every generated Apex class must explicitly declare "with sharing" or "without sharing." If "without sharing" is used, the AI must include a code comment justifying why it is necessary. The post-processing validator flags any class that uses "without sharing" for mandatory human review.

---

## 16. Document Generation and Branding

### 16.1 Supported Document Types

The application generates branded documents in the following formats:

- **Word Documents (.docx):** BRDs, SDDs, SOWs, requirements documents, technical specifications, training materials, status reports.
- **PowerPoint Decks (.pptx):** Client presentations, executive status reports, architecture overview decks, steering committee decks.
- **PDFs (.pdf):** Test scripts, formal deliverables, sign-off documents, deployment runbooks.

Generated documents are stored in S3 (or Cloudflare R2) and linked in the database. Users download them from the web application.

### 16.2 Branding Enforcement

Every generated document must comply with the firm's branding standards. This is a firm-level rule enforced by the AI agent harness. Branding includes:

- Firm logo placement (cover page, headers, footers as defined in the template).
- Color palette (headings, accent colors, table headers).
- Font family and size hierarchy.
- Header and footer format (document title, page numbers, confidentiality notice).
- Cover page layout.

Branding assets and templates are stored in the application's file storage. When branding is updated (e.g., a logo change), all future document generation uses the updated assets. Previously generated documents are not retroactively updated.

### 16.3 Document Generation Workflow

1. A PM or BA selects a document type to generate from the web application.
2. The AI agent harness assembles the relevant project context for that document type (e.g., for a status report: recent session logs, roadmap progress, open questions, risks, sprint status).
3. The AI generates the document content using the project context and the firm's branded template.
4. The harness validates the output against typographic and branding rules.
5. The application renders the content into the target format (Word, PowerPoint, or PDF) and stores it in S3.
6. The user previews and downloads the document. They can request regeneration with adjustments.

---

## 17. Dashboards and Reporting

### 17.1 Project Briefing (Primary Daily View)

The Briefing is the primary landing page for all team members. It is the daily "what's going on and what should I focus on" view. Visible to all roles.

**Header metrics (instant, database queries).** Open questions count (with count of those blocking work), blocked items count, roadmap progress (milestone-level summary), and requirements count (with unmapped count).

**Recommended Focus (AI-synthesized, cached).** An AI-prioritized ranked list of the top 3-5 questions the team should pursue next, with reasoning tied to what each question blocks. Example: "#1 Q-FM-002: How are EAST BU accounts identified in Salesforce? (blocking work)." Generated by the AI based on blocking relationships, question age, and downstream impact. Cached and refreshed on state changes or manual trigger (see Section 6.5).

**Blocking Questions (instant, database query).** Full list of open questions that block at least one story, with: question ID, age, owner(s), question text, and the specific stories each question blocks. This is a direct query against the QuestionBlocksStory/Epic/Feature join tables.

**Current Focus narrative (AI-synthesized, cached).** A 2-4 sentence AI-generated summary of the team's current state and recommended priorities. Example: "The team is in early discovery for the field-mapping epic. Michael needs CRM access from Jeff (STORY-5) to unblock Dynamics schema exports. In parallel, Michael can complete Salesforce-side schema exports (STORY-2-4) and gather info from Dennis (STORY-11-12)."

**Epic Status (instant, database query).** Per-epic summary showing current phase (from EpicPhase), story counts by status, and completion percentage.

### 17.2 Roadmap Dashboard

Visible to all roles. Shows the project's milestone and epic progression.

**Milestones table (instant, database query + computed progress).** Each milestone with: name, target date (or TBD), status, and progress bar. Progress is computed from the completion state of stories linked via MilestoneStory and the resolution of blocking questions.

**Epic Phase Grid (instant, database query).** A matrix showing each epic as a row and project phases (Discovery, Design, Build, Test, Deploy) as columns. Each cell shows the epic's status for that phase (In Progress, Not Started, complete, or skipped). Populated from the EpicPhase table.

**Upcoming milestones (instant + AI-synthesized).** For the next 2-3 milestones: what must happen to reach them, what's currently blocking them, and target dates. The "what must happen" description can be AI-generated from the milestone's linked stories and blocking questions.

### 17.3 Sprint Dashboard

Visible to all roles. Emphasis during the build phase:

- Current sprint progress: stories by status (Planned, In Progress, In Review, QA, Done).
- Sprint burndown (stories or points completed over time).
- Stories missing acceptance criteria or other mandatory fields.
- Conflict alerts from sprint intelligence.
- Developer workload (stories assigned per developer, story points per developer).

### 17.4 Execution Plan View

Visible to all roles. Shows the detailed story-level work breakdown within each epic, similar to a traditional project plan.

**Per-epic story list.** Stories within each epic displayed in execution order, showing: story number, title, owner(s), dependencies (other stories that must complete first), status, and notes. Stories in Blocked status are highlighted with the reason (dependency not met or question unresolved).

**Phase grouping.** Stories can be grouped by which project phase they belong to within the epic (Discovery stories, Design stories, Build stories).

**Dependency visualization.** The dependency chain between stories is visible — which stories block which other stories. The AI identifies these chains from the StoryComponent join table (overlapping impacted components) and from explicit dependencies set by the team.

### 17.5 PM Dashboard

Aggregates the briefing, roadmap, and sprint dashboards with additional PM-specific views:

- Team velocity across sprints.
- Risk register summary (active risks by severity).
- Upcoming deliverable deadlines.
- Client-facing items needing attention (client-owned open questions past follow-up threshold).

### 17.6 Health Score

The project health score is computed from:

- Open questions past the age threshold (default: 7 days). Each stale question is a signal.
- Client-owned questions past the follow-up threshold (default: 3 days).
- Blocked items past the blocked threshold (default: 5 days).
- Active high-severity risks without mitigation plans.

Score: Green (0 signals), Yellow (1-3 signals), Red (4+ signals). Thresholds are configurable per project. Displayed in the Briefing header.

### 17.7 Search Architecture (Session 5)

The application provides three layers of search, each serving a different use case:

**Layer 1: Filtered Search (Prisma where clauses).** Per-entity list views with entity-specific filters: status, scope, owner, epic, domain, sprint, etc. Always available on every list view. No AI cost.

**Layer 2: Full-Text Search (PostgreSQL tsvector/tsquery).** A global search bar that returns grouped results across all entity types. Fast exact matching using Postgres built-in full-text search. `tsvector` columns are auto-maintained by Postgres triggers on insert/update. Prisma uses raw SQL for search queries. No AI cost.

Full-text indexed entities and fields:
- Question: questionText, answer
- Decision: decisionText, rationale
- Requirement: description
- Story: title, description, acceptanceCriteria
- OrgComponent: apiName, label
- KnowledgeArticle: title, content, summary
- BusinessProcess: name, description
- Risk: description, mitigationStrategy

**Layer 3: Semantic Search (pgvector cosine similarity).** "Smart search" for meaning-based matching. Activated when full-text search returns few or no results, or when the user explicitly chooses semantic mode. Uses the same embedding infrastructure as the knowledge article retrieval system (Section 13.7).

**UX:** The global search bar returns grouped results across all entity types (questions, stories, articles, components, decisions, etc.). Each entity list view also has its own filtered search with entity-specific facets.

### 17.8 Notification System (Session 5)

V1 provides in-app notifications only. A notification bell in the application header shows unread count. Email and push notifications are deferred to V2.

**Notification events and priority:**

| Event | Recipients | Priority |
|---|---|---|
| Question answered | Question owner + blocking stakeholders | HIGH |
| Work item unblocked | Story assignee, sprint PM | HIGH |
| Sprint conflict detected | Affected developers + PM | HIGH |
| AI processing complete | Triggering user | MEDIUM |
| Question aging past threshold | Question owner + PM | MEDIUM |
| Health score changed | PM + architect | MEDIUM |
| New question assigned | Assigned owner | MEDIUM |
| Story status changed | Assignee, PM (if sprint-active) | LOW |
| Knowledge article flagged stale | Architect | LOW |
| Metadata sync complete | Architect | LOW |

**Implementation:** Notifications are Inngest event handlers subscribing to existing app events. No new infrastructure beyond the Notification entity. The dispatch job determines recipients from project membership and entity relationships, then writes Notification rows. Notifications link to the source entity for one-click navigation.

---

## 18. QA Workflow

### 18.1 QA Capabilities

QA engineers use the web application to:

- **View test plans and test cases.** Each user story has associated test cases (generated from acceptance criteria during story creation). QAs review these and can add additional test cases.
- **Execute tests and record results.** QAs mark individual test cases as Pass, Fail, or Blocked. Failed tests can be linked to a defect.
- **Log defects.** QAs create defect tickets directly in the application, linked to the story and test case that exposed the defect. Defects include: severity, steps to reproduce, expected behavior, actual behavior, screenshots/attachments, and the environment where the defect was observed.
- **Track defect resolution.** Defects follow a lifecycle: Open > Assigned > Fixed > Verified > Closed. QAs verify fixes and close defects.

### 18.2 Test Execution Tracking

The application tracks test execution at the story and sprint level:

- Per story: how many test cases total, how many passed, how many failed, how many not yet executed.
- Per sprint: aggregate test execution status across all stories in the sprint.
- Overall: test coverage metric (stories with all test cases passed / total stories in QA or Done).

### 18.3 Playwright Integration (Future Enhancement)

The team runs Playwright tests against Salesforce environments. In V1, Playwright testing happens outside the application and QAs manually record results. A future enhancement could integrate Playwright test run results directly into the application, automatically marking test cases as Pass/Fail based on Playwright output.

---

## 19. Multi-User Concurrency and Role-Based Access

### 19.1 Role-Based Access Control

Every user has exactly one role per project. Roles determine what they can see and do:

| Capability | Solution Architect | Developer | PM | BA | QA |
|---|---|---|---|---|---|
| Create/configure project | Yes | No | No | No | No |
| Connect Salesforce org | Yes | No | No | No | No |
| Manage team access | Yes | No | No | No | No |
| Trigger org metadata sync | Yes | No | No | No | No |
| Chat with AI (discovery) | Yes | Yes | Yes | Yes | No |
| Process transcripts | Yes | No | Yes | Yes | No |
| Raise/answer questions | Yes | Yes | Yes | Yes | No |
| Create/edit epics and features | Yes | No | Yes | Yes | No |
| Create/edit user stories | Yes | Yes | Yes | Yes | No |
| Mark stories as "Ready" | Yes | No | Yes | Yes | No |
| Manage sprints | Yes | No | Yes | No | No |
| Pick up tickets (Claude Code) | Yes | Yes | No | No | No |
| Update story status | Yes | Yes | No | No | No |
| Generate deliverables | Yes | No | Yes | Yes | No |
| View dashboards | Yes | Yes | Yes | Yes | Yes |
| View org knowledge (read-only) | Yes | Yes | Yes | Yes | Yes |
| Log defects | Yes | Yes | Yes | Yes | Yes |
| Execute tests / record results | Yes | No | No | No | Yes |
| View/manage defects | Yes | Yes | Yes | Yes | Yes |
| Record decisions | Yes | Yes | Yes | Yes | No |
| View usage & costs | Yes | No | Yes | No | No |

### 19.2 Concurrent Editing

When two users edit the same entity (e.g., two BAs editing the same story), the application uses optimistic concurrency control. The second user to save receives a notification that the entity has been modified since they started editing, with a diff showing what changed. They can merge their changes or overwrite (with the previous version preserved in history). The application never silently overwrites another user's changes.

For discovery interactions (chatting with the AI, logging answers), eventual consistency within minutes is acceptable. If two BAs process transcripts simultaneously that both answer the same question, the AI flags the duplicate and asks for resolution.

---

## 20. Client Jira Sync (Optional)

### 20.1 When It's Used

Some clients require stories to live in their Jira instance for their own tracking, reporting, or compliance purposes. In these cases, the application provides optional one-directional sync: stories are pushed from this application to the client's Jira. This application remains the system of record.

### 20.2 Sync Direction

Push only: application to Jira. The application creates issues in the client's Jira project. Updates to stories in this application (status changes, description edits) are pushed to Jira. Changes made directly in Jira are not synced back. This eliminates the split-brain problem that bidirectional sync would create.

### 20.3 Sync Scope

The sync is scoped to a specific Jira project. The application can only create and update issues in that one project. It cannot read from or write to other Jira projects.

### 20.4 Sync Configuration

The solution architect configures the Jira sync during project setup: Jira instance URL, project key, authentication credentials, field mapping (which application fields map to which Jira fields), and which story statuses trigger a push.

### 20.5 Implementation

Jira sync is implemented via MCP (Model Context Protocol) using existing Jira MCP servers or a custom-built thin adapter. The specific implementation approach is an architecture decision to be made during build.

---

## 21. Project Archival and Lifecycle End

### 21.1 Archive Process

When a project concludes, the solution architect triggers the archive process:

1. Sets the project to read-only. No new stories, no edits, no AI interactions.
2. Generates a final project summary document cataloging all artifacts produced, all architecture decisions made, and the final state of the org knowledge base.
3. Preserves all project data in the database in its final state.
4. Preserves all generated documents in file storage.
5. Revokes and deletes the Salesforce org connection credentials.
6. Disconnects any client Jira sync.
7. Retains access logs per the configured retention period (default: 2 years).

### 21.2 Reactivation

If a client returns for a Phase 2 or additional engagement, the archived project can be reactivated. Reactivation creates a new project instance that inherits the archived project's knowledge base, org knowledge, decisions, and requirements as its starting point. The original archive remains untouched as a historical record. The new instance begins with an abbreviated discovery phase focused on what has changed since the original engagement.

---

## 22. Security, Compliance, and Data Handling

### 22.1 Data Classification

Client data flows through the application. This includes Salesforce org metadata (object schemas, field definitions, component inventories), user story content (which may reference business processes, customer segments, or internal terminology), and document content (BRDs, SDDs, which contain client business logic and requirements). None of this data should contain PII under normal usage, but the application must handle it as confidential client data regardless.

### 22.2 Data Isolation

Every project is fully isolated. There is no shared data layer between projects. A consultant working on Project A cannot access any data from Project B, even if they are assigned to both projects. The AI context for each project is assembled from that project's data only. There is no cross-project learning or context sharing.

### 22.3 AI Provider Data Handling

The application uses the Claude API with appropriate data handling agreements that ensure client data is not retained or used for model training. This is a firm-level configuration, not a per-project setting.

### 22.4 Access Logging

All access to project data is logged: who accessed what, when, and what action they took. Logs are retained for the configured retention period. This supports client audit requirements and internal compliance reviews.

### 22.5 Credential Management

Salesforce org credentials are encrypted at rest in the database. They are scoped to the project and not accessible by other projects or users without the appropriate role. When a project is archived, credentials are revoked and deleted.

---

## 23. Consultant Licensing and Cost Management

### 23.1 Individual Accounts

Every consultant who uses the application has their own account (managed via Clerk). Usage is tracked per individual: number of AI interactions, types of tasks performed, and projects accessed. This supports adoption metrics and capacity planning.

### 23.2 Cost Model

The firm absorbs all AI API costs as overhead. Costs are not billed back to client projects. Usage is tracked per project and per consultant for internal visibility.

### 23.3 Rate Limiting

To prevent runaway costs, the application implements configurable rate limits: per-consultant daily request limits, per-project monthly cost caps (soft limit with alerts), and firm-wide monthly cost threshold with alerts. These are configured in the application's settings (not through a UI in V1).

### 23.4 Usage and Cost Dashboard (Session 6)

Each project has a "Usage & Costs" tab in project settings, visible to Solution Architects and PMs only. This surfaces the token consumption and estimated dollar cost that SessionLog already tracks.

**What it shows:**

- **Project totals:** Total tokens (input + output), estimated cost, number of AI sessions. Filterable by date range (last 7 days, last 30 days, current sprint, custom range).
- **Breakdown by task type:** Token usage and cost per task type (transcript processing, story generation, briefing generation, etc.). Shows which activities consume the most budget. Displayed as a table with percentage-of-total column.
- **Breakdown by team member:** Token usage and cost per project member. Visible to SA and PM only; individual users do not see other users' consumption. Purpose is capacity planning and identifying if one workflow is disproportionately expensive, not performance monitoring.
- **Trend chart:** Daily or weekly token usage over the selected date range. Simple line chart to spot spikes or trends.

**Cost calculation:**

The application stores AI model pricing as a configuration object (TypeScript constants in V1, admin UI in V2):

```
{
  "claude-sonnet": { inputPer1KTokens: 0.003, outputPer1KTokens: 0.015 },
  "claude-opus":   { inputPer1KTokens: 0.015, outputPer1KTokens: 0.075 }
}
```

Cost per session = (inputTokens * inputRate) + (outputTokens * outputRate). Aggregated from SessionLog records. Pricing config requires manual update when Anthropic changes rates.

**RBAC:** Solution Architect and PM can view the full dashboard (project totals + per-user breakdown). Other roles cannot access this tab.

---

## 24. What This Product Is Not

- **Not a deployment tool.** The application never deploys code or metadata to any Salesforce org. It generates source and context that humans deploy.
- **Not a client-facing product.** Clients never see or interact with the application. They receive the outputs.
- **Not a Salesforce org management tool.** It reads metadata for context; it does not write. It is not a change management solution.
- **Not a replacement for human judgment.** The AI generates, suggests, and accelerates. Humans review, approve, and decide.
- **Not a replacement for the client's tools.** If the client uses Jira, their Jira remains their system. This application optionally pushes to it.
- **Not an offline tool.** It requires cloud connectivity.
- **Not a training platform for the AI.** Client data is never used to train AI models.
- **Not a CI/CD or DevOps tool.** It does not manage pipelines, deployments, or environment provisioning.
- **Not a sandbox management tool.** It does not provision, refresh, or track sandbox lifecycles. It reads from one sandbox.

---

## 25. Technology Stack

### 25.1 Core Stack

| Component | Technology | Hosting |
|---|---|---|
| Web Application | Next.js (App Router) | Vercel |
| Database | PostgreSQL | Neon or Supabase |
| ORM | Prisma | — |
| Authentication | Clerk | Clerk Cloud |
| File Storage | S3 or Cloudflare R2 | AWS or Cloudflare |
| AI Provider | Claude API (Anthropic) | Anthropic Cloud |
| Background Jobs | Inngest | Vercel (serverless functions) |
| Vector Search | pgvector (PostgreSQL extension) | Neon or Supabase |
| Full-Text Search | PostgreSQL tsvector/tsquery | Neon or Supabase |
| Real-Time Updates | WebSocket or polling | Vercel |
| Developer Execution | Claude Code + custom skills | Local (developer machine) |

### 25.2 Key Architecture Decisions

**No Git involvement from the web application.** The application does not create, manage, read from, or write to Git repositories. All structured data lives in PostgreSQL. Generated files live in S3.

**No real-time collaborative editing.** Multi-user concurrency is handled through optimistic concurrency control, not real-time operational transforms. Eventual consistency within minutes for concurrent discovery work.

**Single Salesforce connection per project.** One shared team sandbox, read-only. No per-developer sandbox connections.

**Claude Code as the execution layer.** The web application provides context; Claude Code executes code generation. The boundary is the REST API.

---

## 26. Build Sequence

The application is built by one person (the firm owner) using Claude Code. Everything described in this PRD is V1 scope. The build sequence determines the order of construction, with each layer building on the previous one.

### Phase 1: Discovery and Knowledge Brain

The foundation. Build the project data model (including the knowledge architecture entities), the question system, the AI agent harness for transcript processing and question/answer workflows, the chat/conversation interface, the notification system, the Inngest background job infrastructure, search, and the discovery dashboard. At the end of this phase, a user can create a project, chat with the AI to log discovery findings, process transcripts, track questions through their lifecycle, receive in-app notifications, search across all entities, and view a discovery dashboard with outstanding questions, blocked items, and health scores.

Key deliverables: PostgreSQL schema (all entities including BusinessProcess, KnowledgeArticle, Conversation, ChatMessage, Notification), pgvector and tsvector setup, Clerk authentication, project creation flow, question CRUD with confidence/review fields, AI transcript processing, AI question answering with impact assessment, chat interface (general + task sessions), Inngest job infrastructure (article refresh, dashboard synthesis, embedding generation, notification dispatch), in-app notification system, global search (filtered + full-text + semantic), discovery dashboard.

### Phase 2: Story Management and Sprint Intelligence

Build on the knowledge brain. Add epic/feature/user story management with mandatory field validation, AI-assisted story generation from requirements and discovery context, sprint creation and management, sprint intelligence (conflict detection, dependency ordering, capacity assessment), and the sprint dashboard.

Key deliverables: Epic/feature/story CRUD, mandatory field validation, AI story generation, sprint management, sprint analysis, sprint dashboard.

### Phase 3: Salesforce Org Connectivity and Developer Integration

Connect the shared sandbox. Build the org metadata sync, the org knowledge base in PostgreSQL, domain grouping, business context annotations, and the REST API that Claude Code skills consume (context package assembly, org queries, story status updates). Update the Claude Code skills to call the web application's API.

Key deliverables: Salesforce OAuth connection, metadata sync and parsing, org knowledge base tables, Context Package API, Org Query API, Story Status API, Claude Code skill updates.

### Phase 4: Document Generation, QA, and Polish

Build the branded document generation pipeline (Word, PowerPoint, PDF), the QA workflow (test execution tracking, defect management), the optional client Jira sync, project archival, and the PM dashboard. Polish the UI and fix gaps identified during internal use.

Key deliverables: Document generation engine, template system, S3 file storage, QA test tracking, defect management, Jira sync, archive workflow, PM dashboard.

---

## 27. Open Questions and Future Considerations

The following items were identified during requirements gathering. Items resolved during Sessions 3-5 are marked as such; remaining items should be addressed before or during implementation of the relevant phase.

### Resolved in Sessions 3-5

1. **~~AI context window management.~~** Resolved: three-layer knowledge architecture (Section 13.7) with two-pass retrieval, per-task-type context budgets (Tech Spec Section 4), and scoped loading strategies. Knowledge articles provide pre-computed summaries to reduce token cost.

2. **~~Org metadata sync performance.~~** Resolved: Inngest step functions with checkpoints (Section 5.1). Sync runs as a background job with automatic retry and progress tracking. V2 scaling path documented in V2-ROADMAP.md.

3. **Stale context gap.** Accepted for V1. Between developer deploy and next sync, context packages may be slightly stale. V2 solution (webhooks/event-driven sync) documented in V2-ROADMAP.md Section 1.4.

4. **Provider-agnostic abstraction layer.** Deferred to V2. Claude integration in a cleanly separated module. V2 path documented in V2-ROADMAP.md Section 2.2.

5. **Firm administrator UI.** Deferred to V2. V1 hardcodes firm-level settings. V2 path documented in V2-ROADMAP.md Section 3.1.

6. **Playwright test integration.** Deferred to V2. V2 path documented in V2-ROADMAP.md Section 4.1.

7. **Real-time collaborative editing.** Deferred to V2. V2 path documented in V2-ROADMAP.md Section 1.2.

8. **AI output quality benchmarking.** Deferred to V2. V2 path documented in V2-ROADMAP.md Section 2.3.

9. **Regulatory and contractual review.** Deferred to V2. V2 path documented in V2-ROADMAP.md Section 5.4.

10. **Mobile access.** Deferred to V2. V2 path documented in V2-ROADMAP.md Section 3.3.

11. **Salesforce org credential rotation.** Deferred to V2. V2 path documented in V2-ROADMAP.md Section 5.2.

12. **Git repository management.** Deferred to V2. V2 path documented in V2-ROADMAP.md Section 4.2.

13. **Framework updates to active projects.** Deferred to V2. V2 path documented in V2-ROADMAP.md Section 5.3.

14. **Project home page.** Deferred to V2. V2 path documented in V2-ROADMAP.md Section 3.2.

### Resolved via Sessions 4-5 Decisions (now in PRD/Tech Spec)

15. **Knowledge architecture.** Resolved: three-layer design (structured relationships + AI-curated articles + semantic retrieval). See Section 13.7.

16. **Chat/conversation interface.** Resolved: hybrid model (general project chat + task-specific sessions). See Section 8.2.

17. **Background job infrastructure.** Resolved: Inngest on Vercel serverless. See Section 5.1.

18. **AI ambiguity handling.** Resolved: context-dependent approach (ask inline, best-guess + flag, background flag). See Section 6.6.

19. **Search architecture.** Resolved: three-layer (filtered + full-text + semantic). See Section 17.7.

20. **Notification system.** Resolved: in-app notifications via Inngest events. See Section 17.8.

### Remaining Open (to address during build)

21. **Firm-level rules configuration format.** Typographic rules, naming conventions, and terminology are "hardcoded in V1." The specific format (TypeScript constants, JSON config file, or database seeds) should be decided during Phase 1 setup.

22. **Sprint intelligence scoring algorithm.** How to rank severity of overlapping components in conflict detection. Address during Phase 2 when sprint management is built.

23. **Org metadata parsing pipeline.** Translating raw SF CLI JSON output into normalized OrgComponent/OrgRelationship rows. Address during Phase 3 when org connectivity is built.

24. **Document generation library choices.** Candidates: `docx-templater` or `python-docx` for Word, `pptxgenjs` for PowerPoint, `pdf-lib` for PDF. Address during Phase 4.
