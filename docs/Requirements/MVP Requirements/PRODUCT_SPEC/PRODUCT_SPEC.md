# Product Spec: Salesforce Consulting SDLC App

**Purpose.** This document captures what the application should be able to do. It is the single source of truth for functional behavior: user-facing capabilities, workflows, and business rules. It does not cover how the system is built.

**Scope.**

- In scope: user-facing behavior, workflows, business rules, AI capabilities the user interacts with, integrations the user sees.
- Out of scope: architecture, data model, APIs, security implementation, infrastructure, build sequencing. Those live in a separate technical spec produced after this document is signed off.

**Status.** In progress. Section-by-section review coordinated via `docs/MVP Requirements/PRODUCT_SPEC_PROGRESS.md`. Read that tracker first to see current state and the next section to review.

**How this document is being built.** Section by section, across multiple sessions, collaboratively with Michael. For each section Claude reads the corresponding content in the existing reference material (`archive/PRD/PRD.md`, `archive/PRD/sections/`, and other files under `archive/`), asks Michael whether the content reflects how the system should function, then writes the approved content into this file.

---

## Table of Contents

1. Vision, Scope, and Non-Goals
2. Target Users and Personas
3. Problem Statement
4. Project Lifecycle
5. Discovery Workflow
6. Question System
7. Project Roadmap and Work Item Management
8. Sprint Intelligence
9. Developer Execution and the AI Architect
10. QA Workflow
11. Document Generation and Branding
12. Dashboards and Reporting
13. Project Knowledge Base
14. AI-Powered Capabilities
15. Org-Awareness Features
16. Org Connectivity and Sync
17. Sandbox Strategy
18. Salesforce Development Guardrails
19. Roles, Permissions, and Collaboration Behavior
20. Client Jira Sync (Optional)
21. Project Archival
22. Consultant Licensing and Cost Management
23. Executive Summary
24. Open Questions

---

## 1. Vision, Scope, and Non-Goals

> **Status:** Reviewed: Updated (2026-04-16).

### 1.1 What This Product Is

An internal web application that provides an AI-powered SDLC for Salesforce consulting engagements. It is the primary system of record for all project work, the centralized knowledge base for project context, and the integration point that connects non-technical team members with the technical delivery team.

### 1.2 Delivery Model

The product is a hybrid system with two surfaces that share the same underlying project data.

**Web application** for all team members. PMs, BAs, QAs, and architects use it to run discovery, create and refine user stories, view dashboards, generate deliverables, and interact with the project's AI. Developers also use the web application to view assigned tickets, review sprint plans, and see the implementation plans produced during their solutioning sessions. Developers do not write code in the web application.

**Claude Code** for developers during ticket execution. In a Claude Code session the developer works with two AI collaborators. The **AI Architect** reads the ticket and produces an implementation plan with the developer. The **coding agent** executes the approved plan to generate Salesforce source and metadata. The AI Architect reads from the web application's knowledge layer on demand; the coding agent uses the Salesforce CLI to build locally. The developer is the gate between them: the coding agent does not start until the developer approves the plan.

### 1.3 AI Capabilities at a Glance

The product exposes AI behavior at six touchpoints. Each is detailed in later sections; listed here so the scope of "AI-powered" is clear up front.

- **Discovery processing.** Turns BA-captured discovery content into structured questions, answers, and impact assessments.
- **Roadmap and phase generation.** Proposes a phased project roadmap with milestones from the current discovery context. The solution architect (or PM) iterates with the AI to refine it. On approval, the AI creates the phases directly in the work section, where they sit above epics, features, and work items and can be visualized across the project timeline.
- **Story generation and enrichment.** Produces user stories with the fields developers need, cross-referenced against existing org knowledge.
- **Briefings and synthesis.** Summarizes project state, blockers, and next actions for PMs and leads.
- **Document generation.** Produces branded client-facing deliverables from templates and project data.
- **Developer context assembly.** Assembles a per-ticket context package the AI Architect uses during solutioning.

The provider strategy (which AI vendor, embeddings approach, managed-agent usage) lives in the technical spec. From the user's perspective the above six behaviors are the contract.

### 1.4 Repository Posture

The web application does not create, manage, read from, or write to Git repositories. Each project's code repository is owned by the development team and runs through its standard Git workflow outside the application. The application connects to one shared Salesforce sandbox per project for org knowledge; everything else (requirements, stories, decisions, dashboards, deliverables) lives in the application's own database.

### 1.5 Non-Goals

- **Not a deployment tool.** The application never deploys code or metadata to a Salesforce org. It generates source and context that humans deploy.
- **Not a client-facing product.** Clients never sign in or interact with the application. They receive its outputs.
- **Not a Salesforce org management tool.** The application reads metadata for context; it does not write to the org. It is not a change management solution.
- **Not a replacement for human judgment.** The AI generates, suggests, and accelerates. Humans review, approve, and decide.
- **Not a replacement for the client's tools.** If the client uses Jira, the client's Jira remains their system. The application optionally pushes to it.
- **Not an offline tool.** Cloud connectivity is required.
- **Not a training platform for AI models.** Client data is never used to train AI models.
- **Not a CI/CD or DevOps tool.** It does not manage pipelines, deployments, or environment provisioning.
- **Not a sandbox management tool.** It does not provision, refresh, or track sandbox lifecycles. It reads from one sandbox per project.
- **Not a real-time collaborative editor.** Concurrent editing is handled with optimistic concurrency, not live operational transforms. Eventual consistency within minutes is acceptable for concurrent discovery work.

## 2. Target Users and Personas

> **Status:** Reviewed: Updated (2026-04-16).

The product serves six roles. Five are active participants in day-to-day project work. The sixth is the firm-level owner who sets the guardrails everyone else operates inside. Clients are never users of the system; all client-facing output leaves the application as a deliverable.

A single person may hold more than one role on a project (for example, a Solution Architect who also picks up developer tickets, or a Project Manager who also acts as Business Analyst). Role assignment is per-project and controls what a user sees and can do; it is not a job title.

Project administration (adding and removing team members, adjusting project-level settings) is a shared responsibility of the Solution Architect and the Project Manager, not a standalone role.

### 2.1 Solution Architect

The project's technical owner. Stands up the project, connects the shared team sandbox, configures project settings, and leads discovery. Drives the phased roadmap with the AI, approves the roadmap into the work section, and sets the technical direction. Reviews AI-generated code and design work. Shares project administration with the Project Manager: both can add and remove team members on the project and adjust project-level settings.

**Where they work:** Both surfaces. Web application for project setup, discovery, roadmap, and project management. Claude Code for technical architecture, code review, and deep technical work.

### 2.2 Developer

Executes the work. Picks up assigned tickets in the web application, then works in Claude Code to build them. Claude Code skills call the web application's API to fetch the ticket's full context package (story, acceptance criteria, org knowledge, related decisions, relevant standards). Deploys to a personal development environment, then to the shared team sandbox through the team's Git and CI/CD flow. Updates ticket status in the web application as work progresses.

**Where they work:** Both surfaces. Web application to see what to build and to update status. Claude Code to build it.

### 2.3 Project Manager

The project's delivery owner. Plans and manages sprints, reviews dashboards, tracks blockers, generates client-facing deliverables (status reports, presentations, decision logs, meeting briefs), and keeps work moving. Uses the AI to get project briefings, catch risks, and draft documents. Shares project administration with the Solution Architect: both can add and remove team members on the project and adjust project-level settings. Never touches code, Git, or the Salesforce org directly.

**Where they work:** Web application only.

### 2.4 Business Analyst

Owns discovery and requirements. Logs discovery findings by chatting with the AI ("I got an answer to this question from the client"). Drafts and refines user stories, acceptance criteria, and process documentation with AI assistance. The AI scopes, links, tags, and organizes what the BA provides so nothing gets lost across meetings and weeks.

**Where they work:** Web application only.

### 2.5 QA Engineer

Owns quality. Reviews AI-generated test plans, logs defects as tickets, executes tests against Salesforce environments (including Playwright-based UI automation), and marks pass/fail status. Works from user stories and their linked test cases.

**Where they work:** Web application for planning, execution tracking, and defect management. Salesforce and the team's test environments for actual test execution.

### 2.6 Firm Administrator

The cross-project owner. Sets and maintains firm-level standards that apply to every project and every user:

- Salesforce development guardrails (naming conventions, coding standards, security rules, patterns to prefer or avoid).
- Branding assets, document templates, and the visual language used in generated client deliverables.
- Firm-level taxonomies (e.g., project types, delivery methodologies, role definitions).
- Consultant licensing, cost allocation, and model/provider selection defaults.
- Firm-wide dashboards and reporting defaults.

In V1, the firm administrator role is held by the application owner (the founder of the consulting firm). As the firm grows, the role may expand to include other leadership (for example, a Delivery Lead or Head of Engineering).

## 3. Problem Statement

> **Status:** Reviewed: No Changes (2026-04-16). Copied verbatim from the prior PRD (archive/PRD/PRD.md §2) per Michael's direction.

Starting a Salesforce consulting engagement today involves days of manual setup and weeks of inconsistent discovery. Context sits scattered across meeting notes, Slack threads, email chains, and individual consultants' memories. When multiple BAs conduct discovery simultaneously across client departments, no central system connects what they learn to the technical work it drives.

Once a project is underway, the problems compound. User stories are written inconsistently and often lack the detail developers need. The connection between a business requirement, the discovery question that surfaced it, the decision that shaped it, and the user story that implements it exists only in people's heads. When consultants roll off and new ones join, this context is lost.

Developers working with AI code generation have no structured way to receive the full context behind a ticket: business rationale, existing org components, related decisions and constraints. They get a story title and maybe acceptance criteria, then spend time hunting for context that should be at their fingertips.

The firm needs a system that serves as the project's brain: capturing knowledge progressively from day one of discovery, organizing it automatically, surfacing what matters at each stage, and delivering the right context to the right person at the right time, whether that person is a BA logging a client answer, a PM generating a status report, or a developer picking up a ticket.

## 4. Project Lifecycle

> **Status:** Reviewed: Updated (2026-04-16).

Every engagement the firm runs passes through the same shape: someone creates the project, the AI pulls client context from the team, discovery begins, a roadmap emerges, work gets built and tested, the client goes live, and eventually the project is archived. This section describes that shape from the user's point of view: who does what, what the application does automatically, and how stages relate to the work hierarchy that sits underneath them.

### 4.1 Creating a Project

A Solution Architect or Project Manager creates a new project in the web application. Project creation captures:

- Client name and engagement details.
- Engagement type (see §4.2).
- Initial team and per-project role assignments (see §2).
- The shared team sandbox connection for the project's org knowledge, if available at creation (see §16).
- Firm-level defaults the project will inherit: branding, templates for generated deliverables, guardrails, taxonomies, licensing (see §2.6).

On creation, the application:

- Provisions the project's data space so discovery, questions, decisions, and work items can begin accumulating immediately.
- Triggers the initial org metadata sync if a sandbox was connected at setup (see §16).
- Places the project in Project Initialization, the first lifecycle stage (§4.3).
- Opens the project workspace for the team.

**Where it happens:** Web application only.

The application does not seed default work items, epics, or deliverables at creation. Scope emerges from discovery and the roadmap proposal; documents are generated on demand.

### 4.2 Engagement Types

Engagement type describes **how the consulting team enters the project**, not the state of the client's org. A Greenfield engagement means the team runs discovery from scratch; the client's org can still be mature or heavily customized. The type affects which lifecycle stages get emphasis and how the AI prioritizes its assistance.

- **Greenfield.** Full lifecycle. All stages active. Discovery starts from zero. Use for any engagement where the team owns the work from discovery through go-live, regardless of the state of the client's org.
- **Build Phase.** Discovery was completed by the client or another firm. The team captures or imports the key requirements and decisions during Project Initialization. Roadmap and Design is the primary entry emphasis. Discovery remains available but is not the focus.
- **Managed Services.** Ongoing support of an existing org. Emphasis on org ingestion, a continuous stream of enhancement requests, and SLA tracking rather than a single discovery-to-go-live arc. Sprint cadence and the knowledge base are the primary surfaces.
- **Rescue/Takeover.** The firm is inheriting a troubled project. During Project Initialization, the AI prompts for and helps conduct an Org Health Assessment (code quality, security findings, technical debt inventory). Discovery focuses on understanding what exists and what is broken before remediation can be planned.

Engagement type is set at creation. Changing engagement type mid-project is deferred past MVP.

### 4.3 Lifecycle Stages

Every project, regardless of engagement type, moves through the same set of lifecycle stages. These are the delivery framework the application runs on. Only one stage is active at a time. The active stage signals emphasis: which dashboard views lead, which AI capabilities are surfaced most prominently, which defaults apply. It does not act as a hard gate. Work in other stages is still possible (a BA can log a discovery answer during Build), but the dashboard and AI focus follow the active stage.

The stages are:

1. **Project Initialization.** The project has just been created. The AI proactively prompts the Solution Architect and Project Manager for client context: who the client is, what they do for business, what products they sell, relevant company background, any known stakeholders or constraints, and what the engagement is trying to accomplish. The SA or PM enters what they have. They can also defer any of it and populate later; the initialization stage does not block on it. If the SA or PM asks, the AI can research publicly available information about the client (for example, industry, products, public news) and offer suggested additions to the context document. The user reviews and accepts or edits before anything is saved. The output of this stage is a living **client context document** that anchors the project's knowledge base and can be updated at any time thereafter (see §13). Project Initialization also covers remaining setup the team wants to handle before Discovery begins in earnest: connecting the sandbox if it was not connected at creation, finishing team invites, overriding any firm-level defaults that need project-specific values.
2. **Discovery.** The team gathers information from the client. The AI accumulates structured knowledge from transcripts, direct question and answer logging, and ad-hoc chat. Questions are raised, scoped, and tracked (see §6). Requirements emerge and are linked to the questions that surfaced them. The AI surfaces gaps and, when enough context exists, proposes a phased roadmap (see §4.4 and §7).
3. **Roadmap and Design.** The AI proposes a phased roadmap from the current discovery context. The Solution Architect (or PM) iterates with the AI to refine it, then approves the phases into the work section. Epics, features, and work items are drafted underneath the approved phases. Architecture decisions are captured and linked back to the questions and requirements that drove them.
4. **Build.** Work items are picked up and executed through Claude Code (see §9). Sprint Intelligence (see §8) manages planning, conflict detection, and dependency tracking. The org knowledge base updates as new components land in the shared sandbox (see §16). Discovery continues in parallel; the roadmap can be re-proposed as scope evolves (§4.4).
5. **Testing.** QA reviews AI-generated test plans, executes tests, and logs defects as work items tied back to the stories they relate to. QA work runs alongside Build in practice. Testing becomes the active stage when the project is between major scope deliveries and focus shifts to test execution and defect remediation (see §10).
6. **Deployment.** The application generates deployment runbooks and checklists from the completed work items and their impacted components. Humans execute the deployment. The application never deploys anything to Salesforce (see §1.5 Non-Goals).
7. **Hypercare and Handoff.** Post-go-live support. The application generates knowledge transfer materials, training documents, and onboarding content from the accumulated project knowledge base. The project can be held in this stage indefinitely while the firm provides support.
8. **Archive.** The project is set to read-only (see §21).

**What "active stage" does in the application.**

- Drives the default dashboard views for the project (for example, Discovery stage emphasizes question tracking and discovery coverage; Build stage emphasizes sprint burndown and blockers).
- Determines which AI capabilities are foregrounded in the UI (for example, roadmap generation surfaces during Discovery; deployment runbook generation surfaces during Deployment).
- Signals the expected cadence of the project to team members and to leadership dashboards.
- Does not lock work out of other stages. Users can still take actions appropriate to other stages when needed; the dashboard and AI emphasis simply follow the active stage.

The project's active stage is changed by the Solution Architect or Project Manager. The AI may suggest a stage transition when appropriate signals are present (for example, discovery coverage is high enough to propose a roadmap), but the transition is always a human decision.

### 4.4 Roadmap Proposal and Re-proposal

Discovery is never finished in a meaningful sense. New information arrives throughout the project, and scope shifts. The application treats roadmap generation as an ongoing capability, not a one-time milestone.

- **Initial proposal.** Once discovery coverage is sufficient, the AI proposes a phased roadmap. The Solution Architect (or PM) iterates with the AI, then approves. On approval, the AI creates the phases in the work section above any existing epics and features.
- **Re-proposal.** The AI can re-propose the roadmap whenever discovery context changes materially. Re-proposal can be triggered manually by the Solution Architect, or surfaced automatically by the AI when significant new context arrives (for example, a major new requirement, a scope change from the client, or a rescue-type reassessment).
- **Impact on existing work.** A re-proposed roadmap is a draft until approved. On approval, the Solution Architect chooses how to apply it: adopt wholesale, merge into the existing roadmap, or apply selective changes. In-flight work is not reassigned automatically; the application shows the diff and the Solution Architect decides.
- **Versioning.** Every approved roadmap is versioned. The application retains prior versions for audit and comparison.

Detailed work-section UX for reviewing and applying a re-proposal lives in §7. Discovery-side triggers for re-proposal live in §5.

### 4.5 Context Evolution

The project's AI context builds progressively throughout the lifecycle, starting from the moment the project is initialized. Every interaction that adds to the knowledge base is captured:

- During Project Initialization: the client context document, basic project setup information.
- During Discovery: transcript processing, direct question and answer logging, requirement capture.
- During Roadmap and Design: roadmap iterations, architecture decisions, design trade-off discussions.
- During Build: work item creation and refinement, component creation reports flowing back from the sandbox, defect analysis.
- During Testing: test plan generation, defect logging, QA findings.
- During Hypercare and Handoff: training artifacts, knowledge transfer content, post-launch observations.
- At any time: any team member chatting with the AI to log new information, ask a question, or request synthesis.

The application retains conversational continuity across sessions so the AI can reference prior context when a user returns. How the knowledge is structured (the actual knowledge base surfaces the user sees) is covered in §13.

### 4.6 Relationship to the Work Hierarchy

This section describes the project's lifecycle, not its work structure. The two are related but distinct.

- **Lifecycle stages** (§4.3) are delivery-wide. Every project has the same eight stages. Only one is active at a time.
- **Phases, epics, features, and work items** (§7) are the project's scope. The number and shape of phases come from the AI-generated roadmap, refined by the Solution Architect. They are specific to the project.

A Phase in the work hierarchy is not a lifecycle stage. A Phase is a block of scope inside the project's roadmap (for example, "Phase 1: Quote-to-Cash MVP"). Lifecycle stages describe where the project sits in the consulting delivery arc; work phases describe what scope is being delivered.

## 5. Discovery Workflow

> **Status:** Reviewed: Updated (2026-04-16).

Discovery is how the project's knowledge base comes into existence, and the workflow that keeps it accurate as the engagement proceeds. Section 4.3 defines Discovery as a lifecycle stage where it is the emphasis. Section 5 defines the workflow itself, which runs throughout the entire project regardless of the active stage.

**What lives in this section.** The behavior of discovery: who puts information in, how it goes in, what the AI does with it, how uncertainty is handled, and where the outputs land. Adjacent specifications:

- Question mechanics (lifecycle, scoping, ID scheme, data model, volume): §6.
- Project knowledge base surfaces (decisions, requirements, risks, annotations, the client context document): §13.
- Chat session mechanics (starting sessions, session history, archive, cross-session recall, visibility, session ownership on role changes): §14.
- Discovery dashboard and intelligence widgets: §12.
- Roadmap re-proposal behavior once triggered: §4.4. Work-section UX for reviewing a re-proposed roadmap: §7.

### 5.1 The Shape of Discovery

- Discovery is centralized in the application. People bring information here. The application does not scan, crawl, or import from external tools (email, Slack, client knowledge bases).
- Discovery does not end when the Discovery lifecycle stage ends. New information arrives during Roadmap and Design, Build, Testing, and Hypercare. The inputs and AI behavior below apply at any point in the project.
- The BA is the primary driver. The SA and PM contribute content (architecture decisions, workshops they run, client leadership conversations). QA contributes when defects surface new rules about how the client actually works.
- The AI does two jobs. First, it turns unstructured input into structured records and links them to scope and components. Second, it analyzes accumulated knowledge and surfaces what it means: gaps, readiness, conflicts, and next questions.

### 5.2 Information Input Channels

All three channels feed the same knowledge base and run through the same extraction and linking behavior.

**Transcript processing.** A user pastes or uploads a meeting transcript (from Zoom, Teams, Gong, or any other source). The AI extracts questions raised, questions answered, decisions made, requirements stated or implied, action items, and scope changes. Each extracted item is scoped, owner-assigned where the transcript provides enough signal, linked to existing records, and cross-referenced against prior decisions and org knowledge. Component annotations are proposed where specific Salesforce components are referenced (§15). The raw transcript is retained for audit.

**Direct question-and-answer logging.** A user raises a new question or logs an answer to an existing question directly in the UI. This handles the common case where a BA gets an answer outside of a formal meeting (email, Slack, hallway, client phone call). Answers logged this way run through the same impact assessment as transcript-extracted answers: does it update existing designs, unblock work, raise new questions, or contradict a prior decision.

**Conversational chat.** The primary way users capture ad-hoc discovery content and invoke AI operations. The application hosts per-project chat sessions; any team member can start a new session. Within a session the AI carries running conversation memory. Across sessions, the AI can search prior sessions on demand when the user asks. Heavy operations (processing a long transcript, generating user stories, producing a briefing, drafting a deliverable) run inside a chat session; no separate "task session" mode. Sessions are private to the creator by default and can be opened to the project team. Structured records extracted from any session (questions, decisions, requirements, risks) flow to the shared project knowledge base regardless of whether the session itself is private or shared. Full chat session mechanics are specified in §14.

### 5.3 What the AI Does With a Discovery Input

For every input that lands, regardless of channel:

1. **Extract.** Identify the structured items contained in the input: questions, answers, decisions, requirements, risks, action items.
2. **Scope.** File each item at the right level: engagement-wide, epic-scoped, or feature-scoped (scoping model in §6).
3. **Assign ownership.** Team member, client contact, or TBD, based on context.
4. **Link.** Match to an open question, an existing decision, a related requirement, or a work item the content affects. Create new records where no match exists.
5. **Cross-reference org knowledge.** Check the connected sandbox's metadata for referenced components. Propose component annotations where appropriate.
6. **Run impact assessment.** For answers and decisions: does this change an existing technical design, unblock a work item, raise a new question, or contradict a prior decision?
7. **Tag confidence.** Attach a confidence flag to every AI-created or AI-modified item. High-confidence items apply directly; lower-confidence items route to a review queue (see §5.5).

### 5.4 Discovery Intelligence Surfaces

The AI analyzes the state of discovery and surfaces insights. These appear on the discovery dashboard (§12) and in AI briefings (§14):

- **Gap detection.** Scopes where open questions are blocking design or build, and where question volume suggests incomplete coverage. Example: "Epic: Data Migration has 12 open questions; 3 are blocking technical design."
- **Readiness assessment.** Scopes where enough context exists to draft stories, begin design, or propose a phase. Example: "Epic: Report Audit has enough answered questions and captured requirements to draft the first user stories."
- **Conflict detection.** Contradictions between new content and prior decisions or requirements. Example: "The answer to Q-ENG-005 contradicts Decision D-DM-003. This needs resolution."
- **Follow-up recommendations.** The next question the client should be asked, ordered by downstream blocking impact. Example: "Q-RA-003 is blocking the design for 3 user stories in Epic: Report Audit. Ask this next."

### 5.5 Handling AI Uncertainty

When the AI extracts or generates an item and is not confident in the interpretation, behavior depends on context:

- **Chat session (user present).** The AI asks an inline clarifying question before saving, then proceeds once the user responds.
- **Heavy operations running inside a session (transcript processing, bulk operations, story generation).** The AI makes its best guess, attaches a confidence flag, and surfaces low-confidence items at the end of the operation in a review list. The completion UX shows what was created, counts by confidence level, and a "Needs Review" section for items below the auto-apply threshold.
- **Background processing (knowledge refresh, embeddings, scheduled syncs).** The AI makes its best guess and flags the item. No user is present; flagged items queue for review the next time a human opens the relevant view.

High-confidence items apply without human review. Lower-confidence items queue for human confirmation. The exact auto-apply threshold is a configurable tuning parameter, not a product-level commitment.

### 5.6 Discovery Triggers for Roadmap Re-proposal

Discovery is the origin point for roadmap re-proposal (the behavior itself is defined in §4.4; work-section UX for reviewing a re-proposal is in §7). Two trigger types originate here:

- **Manual trigger.** The Solution Architect (or PM) explicitly asks the AI to re-propose the roadmap after a discovery milestone (after a major workshop, after the client returns with a scope decision, after a new department is brought into discovery).
- **AI-surfaced trigger.** When material new context lands (a substantial new requirement set, a scope change, a rescue-type reassessment, a cluster of new blocking questions in a previously stable area), the AI flags to the Solution Architect that a re-proposal may be warranted. The AI does not re-propose automatically; it surfaces the opportunity, and acceptance is a human decision.

### 5.7 Where Discovery Output Lands

Discovery does not produce standalone artifacts; it feeds other surfaces. For clarity:

- **Questions** (raised, scoped, owned, answered, parked): §6.
- **Decisions, requirements, risks, action items, annotations:** Project Knowledge Base, §13.
- **Client context document:** Project Knowledge Base, §13. Initial creation during Project Initialization, §4.3.
- **Roadmap proposals and re-proposals:** §4.4 (behavior) and §7 (work-section UX).
- **Discovery dashboard and intelligence surfaces:** §12.

## 6. Question System

> **Status:** Reviewed: Updated (2026-04-16).

Questions are the atomic unit of discovery. Every unknown is captured, scoped, owned, tracked through to resolution, and preserved permanently. Section 5 owns how questions enter the system (input channels, extraction, linking, confidence). Section 6 owns the question record itself: states it can occupy, how it is scoped, the ID scheme, the data model, cross-cutting behavior, and volume expectations.

**What lives in this section.** Question lifecycle states, scoping model, ID scheme, data model, cross-cutting questions, volume expectations. Adjacent specifications:

- Discovery inputs that produce questions (transcript, direct entry, chat) and impact assessment behavior on answer: §5.
- Outstanding-question dashboards, gap detection, follow-up recommendations: §12.
- Decisions, requirements, risks, action items, the client context document: §13.
- CRUD-minus-delete firm guardrail: §19.

### 6.1 Question Lifecycle States

A question record is always in exactly one of the following states. State transitions are driven by user action or by Section 5's impact assessment.

| State | Meaning | Entered when |
|---|---|---|
| Draft | An AI-internal staging state used during extraction. The record exists but is not yet visible in question lists. | The AI extracts a candidate question from a transcript or chat session and confidence falls below the auto-apply threshold. The user confirms or discards in the review queue (§5.5). |
| Open | The question is scoped, owned, and awaiting an answer. | A user raises a question directly, or the AI promotes a Draft question after confirmation, or an Answered question is re-opened. |
| Answered | An answer has been recorded. Section 5's impact assessment runs. | An owner records an answer, or an inline answer is captured during a chat session or transcript. |
| Parked | The question is intentionally deferred. Removed from active follow-up lists but still searchable and reportable. | A user parks the question with a parked reason. |
| Superseded | The question has been replaced by another question that re-frames the same issue. | A user merges or re-frames a question. The replacement question's ID is recorded on the superseded record. |

A question is never hard-deleted. The CRUD-minus-delete guardrail (§19) applies. Mistaken or duplicate questions are handled with Superseded.

**Re-opening behavior.** An Answered question can be flipped back to Open if the answer no longer holds (the client revises, a contradicting decision is reached, the answer turns out to be wrong). The prior answer is preserved in the Answer History on the record (§6.4). Re-open is a deliberate user action; the system does not re-open automatically.

### 6.2 Scoping Model

Every question is scoped at exactly one of four levels. The AI proposes the scope on extraction (§5.3 step 2); the owner or the SA can re-scope at any time.

| Scope | Used for | Scope reference |
|---|---|---|
| Engagement | Questions that affect the project as a whole, the client's organization, or multiple work areas. Includes questions about client business, stakeholders, governance, and the client context document (§13). | None. |
| Phase | Questions that apply to a specific delivery phase (§7) such as cutover, release scope, dependency sequencing, or environment readiness. | Phase reference. |
| Epic | Questions tied to a single epic. The most common scope for discovery and design questions. | Epic reference. |
| Feature | Questions tied to a single feature within an epic. Used when the question only matters for that feature's design. | Feature reference (which implies the parent epic). |

Questions do not scope to user stories, tasks, or other leaf-level work items. A question that surfaces while working on a single story is recorded at Feature scope (or Epic scope if no Feature exists), and the affected story is captured in the Blocks field (§6.4) so the story is unblocked when the answer lands.

Cross-cutting questions (those that span more than one Epic, Phase, or Feature) are always scoped to Engagement and use the Affects field to record what they touch (§6.5).

### 6.3 Question ID Scheme

Format: `Q-{SCOPE}-{NUMBER}`.

`{SCOPE}` is a short prefix derived from the scope level:

| Scope | Prefix pattern | Example |
|---|---|---|
| Engagement | `ENG` | `Q-ENG-001` |
| Phase | `P{n}` where `{n}` is the phase number | `Q-P2-001` |
| Epic | The epic's 2-4 letter prefix (e.g., `DM` for Data Migration) | `Q-DM-001` |
| Feature | `{EPIC}-{FEATURE}` where `{FEATURE}` is the feature's 2-4 letter prefix | `Q-DM-LRT-001` |

`{NUMBER}` is a zero-padded incrementing integer, scoped to the prefix. Numbering does not reset across phases or sessions.

Epic prefixes and feature prefixes must be unique within their parent (epic prefix unique within a project; feature prefix unique within an epic). The application validates uniqueness on epic and feature create and edit.

If a question is re-scoped after it was issued an ID, the original ID is retained for traceability. The ID does not change with the scope.

### 6.4 Question Data Model

Each question record contains the following fields.

| Field | Required | Description |
|---|---|---|
| ID | Yes | Unique ID per §6.3. Auto-generated on create. Immutable. |
| Question | Yes | The question text, stated clearly enough that someone outside the project could understand it. |
| Scope | Yes | One of Engagement, Phase, Epic, Feature, with the appropriate scope reference. Editable. |
| Owner | Yes | One of: a team member (any role on the project), Client (`{name}`), Firm (`{name}` for a firm-wide owner such as the firm administrator), or TBD. Editable. |
| State | Yes | One of Draft, Open, Answered, Parked, Superseded (§6.1). |
| Asked Date | Yes | Auto-set on creation. |
| Asked By | Yes | The user who created the record, or the system if AI-extracted (with a link to the originating chat session or transcript). |
| Blocks | No | References to work items (phase, epic, feature, story, task) and named artifacts (architecture decisions, in-progress deliverables, planned deployments) that are waiting on the answer. Multi-valued. |
| Affects | No | For cross-cutting Engagement-scoped questions: the epics, features, or phases the question touches. Multi-valued. |
| Spawned From | No | Reference to a parent question, when this question was raised during impact assessment of another question's answer (§5.3 step 6). |
| Answer | On answer | The answer text. |
| Answered Date | On answer | Auto-set on the most recent answer. |
| Answered By | On answer | The user who recorded the answer. |
| Impact | On answer | The summary of what changed: links to updated items, unblocked work, new questions raised, contradicted decisions. Populated by §5's impact assessment. |
| Answer History | On re-answer | Append-only list of prior `{Answer, Answered Date, Answered By, Impact}` tuples retained when an answer is replaced after a re-open. |
| Parked Reason | On park | Why this question is deferred. Required to enter Parked state. |
| Superseded By | On supersede | The ID of the replacement question. Required to enter Superseded state. |
| Activity Log | Auto | Append-only entries for state transitions, scope changes, owner changes, edit events. Includes actor and timestamp. Populated automatically; not user-editable. |

### 6.5 Cross-Cutting Questions

A question is cross-cutting when it affects more than one Epic, Phase, or Feature. Cross-cutting questions are always scoped to Engagement and use the Affects field to enumerate what they touch.

The AI proposes cross-cutting classification during scoping (§5.3 step 2) when the question's subject matter relates to more than one epic, phase, or feature. The Solution Architect or owner can promote an Epic-scoped or Feature-scoped question to Engagement scope at any time, populating Affects in the process.

When a cross-cutting question is answered, the impact assessment in §5 fans out to every entity in the Affects list.

### 6.6 Question Volume Expectations

These are planning expectations, not enforced limits. The application must remain usable at the upper end of these ranges.

- 5-15 Engagement-scoped questions per project.
- 0-10 Phase-scoped questions per phase.
- 10-30 Epic-scoped questions per epic.
- 5-15 Feature-scoped questions per feature.
- 100-200 total questions per project at scale.

Volume informs UI behavior in §12 (filtering, grouping, paging on the outstanding-question dashboard) and search behavior in §13.

### 6.7 Where Question Behavior Lives

Question records are touched by several other sections. For clarity:

- **How questions enter the system** (transcript, direct entry, chat) and **what happens when one is answered** (impact assessment, downstream changes): §5.
- **Outstanding-question views, gap detection, follow-up recommendations:** §12.
- **Linkage to decisions, requirements, risks, and the client context document:** §13.
- **Permission and CRUD rules** (no hard delete, who can edit a question, who can change state): §19.
- **One-directional sync of questions to a client Jira instance** (if applicable): §20.

## 7. Project Roadmap and Work Item Management

> **Status:** In Progress (2026-04-17). Structural shape locked. Sub-details tracked as open items per subfile.

The Work tab is the delivery surface of the application. The team uses it to plan and manage the scope of an engagement: what is in flight, what is next, what is blocked, what is done, and what the AI has just re-proposed. It is the project's work-management surface purpose-built for the consulting SDLC: discovery feeds into it through linked questions and requirements; the AI proposes phases and can re-propose them as discovery evolves; sprint planning happens alongside the backlog; admin to-dos sit parallel to delivery scope.

This section is modular. The subsections below are short maps into subfiles under `7-roadmap-and-work-items/`. Each subfile holds the detail plus open questions.

### 7.1 Work tab structure

The Work tab has five sub-sections:

| Sub-section | What it does |
|---|---|
| Home | Dashboard of the project right now: lifecycle pipeline stage, admin tasks due soon, scope summary, recent activity, AI re-proposal banner when one is pending. Role-adaptive widgets. |
| Admin Tasks | Project-level to-dos not parented to any delivery scope. |
| Roadmap | The approved phase structure. AI re-proposals with diff + apply. Version history. |
| Work Items | The hierarchical delivery scope. Viewable as Tree, Board, or Timeline. |
| Sprints | Sprint planning, active sprint execution, closing and history. AI sprint intelligence surfaces here. |

Detail: [`7-roadmap-and-work-items/work-tab-overview.md`](7-roadmap-and-work-items/work-tab-overview.md).

### 7.2 Work hierarchy

Delivery scope is organized in up to four levels:

- **Phase.** A block of scope delivered together. Phases come from the AI-proposed roadmap the Solution Architect approves. They are the top of the tree.
- **Epic.** A larger chunk of work within a phase.
- **Feature.** *Optional.* An intermediate grouping between Epic and Work Item, used when an epic grows large enough that related work items benefit from clustering. Skipped when the epic is small.
- **Work Item.** The leaf-level assignable unit. Includes user stories and other work-item subtypes (still being decided, see 7.9).

Detail: [`7-roadmap-and-work-items/work-hierarchy.md`](7-roadmap-and-work-items/work-hierarchy.md).

### 7.3 Admin tasks

Project-level to-dos that do not belong to any phase or epic. Examples: "Set up Jane's sandbox user," "Schedule Discovery workshop #3," "Grant Tom access to Gong." They have a due date, owner, and status. They do not have a persona, acceptance criteria, or story points. They sit parallel to the delivery hierarchy and surface on the Work tab Home dashboard when due or overdue.

Admin Tasks are a **separate entity type**, not a subtype of Work Item. Their lifecycle, required fields, and sprint posture all differ from delivery work.

Detail: [`7-roadmap-and-work-items/admin-tasks.md`](7-roadmap-and-work-items/admin-tasks.md).

### 7.4 Work item views

Work Items can be viewed through three lenses on the same underlying data:

- **Tree.** Structural lens. Planning, readiness rollups.
- **Board.** Status-based Kanban. Day-to-day execution. Defaults to the active sprint.
- **Timeline.** Gantt with swimlane per phase. Temporal view, milestones, cross-phase dependencies.

A view toggle switches lenses. Clicking any work item opens a side-panel detail drawer that keeps the lens visible behind it, supporting quick edits (reassign, change status, answer a linked question) without a full page navigation. A full-page view exists for deep edits.

Detail: [`7-roadmap-and-work-items/work-item-views.md`](7-roadmap-and-work-items/work-item-views.md).

### 7.5 Readiness

Every epic (and phase, as a rollup) shows a readiness score. The score is a composite of three sub-scores:

1. **Open discovery questions** linked to the epic that are unanswered.
2. **Work item field gaps** (missing acceptance criteria, story points, test cases, or other required fields).
3. **AI-flagged issues** (contradictions with prior decisions, conflicts with existing components).

Clicking the indicator opens a drawer that breaks out which of the three is dragging the score down. Each item in the breakdown is actionable: answer the question, open the work item, resolve the flag.

Detail: within [`7-roadmap-and-work-items/work-item-views.md`](7-roadmap-and-work-items/work-item-views.md).

### 7.6 Roadmap sub-section

Dedicated surface for the approved phase structure. Shows the current roadmap with its version number and approval date. When the AI has a pending re-proposal (triggered per §4.4 and §5.6), a banner appears at the top with a Review button that opens the diff. The SA chooses an apply mode: adopt wholesale, merge, or selective apply. Every approved roadmap is versioned and retained for audit.

Detail: [`7-roadmap-and-work-items/roadmap.md`](7-roadmap-and-work-items/roadmap.md).

### 7.7 Sprints sub-section

Sprint planning, active sprint execution, and closing. The view shows the backlog of Ready work items alongside the active sprint and its capacity against commitment. AI sprint intelligence (§8) surfaces conflict and dependency callouts on this view. Sprint history is retained.

Detail: [`7-roadmap-and-work-items/sprints.md`](7-roadmap-and-work-items/sprints.md).

### 7.8 Where related behavior lives

| Topic | Section |
|---|---|
| Lifecycle stages vs. Phases (terminology) | §4.6 |
| Roadmap generation and approval flow | §4.4 |
| Discovery input that feeds work | §5 |
| Question linkage to epics and work items | §6 |
| Sprint intelligence (AI behavior) | §8 |
| Developer execution and ticket context | §9 |
| QA workflow | §10 |
| Dashboards that read from work items | §12 |
| Decisions, requirements, risks | §13 |
| Client Jira sync | §20 |
| CRUD-minus-delete guardrail, role permissions | §19 |

### 7.9 Open items

Carried over from the §7 review as unresolved:

- **Work item subtypes.** User story only, or story + bug + spike + others? Affects lifecycle states, mandatory fields, ID scheme.
- **Sprint rules.** Capacity model, what happens on close, whether non-stories can live in sprints, whether AI proposes sprint composition.
- **Re-proposal diff UX.** Exactly how the diff renders and who can trigger a manual re-proposal.
- **Admin Task data model.** What fields beyond title, owner, due date, status.
- **Cross-phase dependencies.** Blocks / blocked-by relationships between work items across phases.
- **Role-adaptive Home widget catalog.** Default widgets per role still need definition.

## 8. Sprint Intelligence

> **Status:** Not yet reviewed.

## 9. Developer Execution and the AI Architect

> **Status:** Not yet reviewed.

## 10. QA Workflow

> **Status:** Not yet reviewed.

## 11. Document Generation and Branding

> **Status:** Not yet reviewed.

## 12. Dashboards and Reporting

> **Status:** Not yet reviewed.

## 13. Project Knowledge Base

> **Status:** Not yet reviewed.

## 14. AI-Powered Capabilities

> **Status:** Not yet reviewed.

## 15. Org-Awareness Features

> **Status:** Not yet reviewed.

## 16. Org Connectivity and Sync

> **Status:** Not yet reviewed.

## 17. Sandbox Strategy

> **Status:** Not yet reviewed.

## 18. Salesforce Development Guardrails

> **Status:** Not yet reviewed. Open thread: this section may split or be trimmed. Some content is user-facing; some is technical policy.

## 19. Roles, Permissions, and Collaboration Behavior

> **Status:** Not yet reviewed.

## 20. Client Jira Sync (Optional)

> **Status:** Not yet reviewed.

## 21. Project Archival

> **Status:** Not yet reviewed.

## 22. Consultant Licensing and Cost Management

> **Status:** Not yet reviewed.

## 23. Executive Summary

> **Status:** Not yet reviewed. Written last, after all other sections are signed off.

## 24. Open Questions

> **Status:** Not yet reviewed.
