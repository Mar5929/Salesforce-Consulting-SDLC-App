# Feature Research

**Domain:** AI-powered Salesforce consulting SDLC platform (internal tool) -- project management, knowledge management, developer integration, document generation
**Researched:** 2026-04-04
**Confidence:** MEDIUM (no web search available; based on training data knowledge of PM/KM tools, Salesforce consulting workflows, and extensive PRD analysis)

## Feature Landscape

This analysis covers features across five functional areas: (1) project/work management, (2) AI knowledge management, (3) discovery and requirements, (4) developer integration, and (5) document generation and QA. The PRD already defines a comprehensive feature set. This research validates which are table stakes, which are genuine differentiators, and which are anti-features that should stay out of V1.

### Table Stakes (Users Expect These)

Features the consulting team will assume exist. Missing any of these means the tool gets abandoned in favor of spreadsheets and Slack.

#### Project and Work Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Epic/Story CRUD with hierarchy | Every PM tool has this (Jira, Linear, ClickUp). Without it the tool is not a work management system. | MEDIUM | PRD Section 10 covers this thoroughly. The epic > feature > story hierarchy is standard. |
| Story status workflow | Teams need to track what's in progress, in review, done. Visual board or list view. | LOW | Draft > Ready > Sprint Planned > In Progress > In Review > QA > Done per PRD. |
| Sprint management | Iterative development is the norm. Sprint creation, assignment, tracking are baseline. | MEDIUM | PRD Section 11 covers this. Basic sprint CRUD is table stakes; the intelligence layer is a differentiator. |
| Role-based access control | Consulting teams have distinct roles (PM, BA, Dev, QA, SA). People expect to see what's relevant to their role. | MEDIUM | PRD Section 19. Clerk + per-project roles. Standard implementation. |
| Dashboard with key metrics | Every PM tool has a summary view. Open items, progress, blockers. | MEDIUM | PRD Section 17. The quantitative dashboard (counts, statuses, burndown) is table stakes. AI synthesis is a differentiator. |
| Search across entities | Users need to find questions, stories, decisions quickly. | MEDIUM | PRD Section 17.7. Filtered search + full-text search are table stakes. Semantic search is a differentiator. |
| In-app notifications | Users need to know when something changes that affects them. | MEDIUM | PRD Section 17.8. Bell icon, unread count, event-driven dispatch via Inngest. |
| File attachments | Users attach screenshots to defects, docs to requirements. Expected everywhere. | LOW | PRD Section 5.2.1 Attachment entity. S3 storage. |
| Optimistic concurrency control | Multiple BAs editing the same story simultaneously must not silently overwrite each other. | MEDIUM | PRD Section 19.2. Version-based conflict detection. |

#### Authentication and Security

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User authentication | Non-negotiable for any multi-user tool. | LOW | Clerk handles this. Email/password sufficient for V1. |
| Project-level data isolation | Client data cannot leak between projects. Consulting firms take this seriously because of NDAs. | MEDIUM | PRD Section 22.2. Every query scoped to the active project. |
| Encrypted credential storage | Salesforce org tokens must be encrypted at rest. | LOW | PRD Section 22.8. Per-project HKDF-SHA256 derived keys. |
| Access logging | Consulting firms need audit trails for client data access. | LOW | PRD Section 22.4. Log who accessed what, when. |

### Differentiators (Competitive Advantage)

These are features no off-the-shelf PM tool provides. They are why building a custom tool is justified rather than using Jira + Confluence + Guru.

#### AI Knowledge Brain (Core Differentiator)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Persistent project brain that accumulates knowledge | No PM tool builds a cumulative AI understanding of a project. Jira AI, Linear AI, ClickUp AI all operate on individual items, not the whole project context. This is the central value proposition. | HIGH | PRD Sections 8, 13.7. The three-layer knowledge architecture (structured relationships + AI-curated articles + semantic retrieval) is the hardest thing to build and the most valuable. |
| AI transcript processing (extract questions, decisions, requirements) | Transforms a 30-minute meeting into structured project artifacts in minutes. Tools like Otter.ai transcribe but do not extract structured PM artifacts. Fireflies.ai extracts action items but not scoped, linked questions and decisions. | HIGH | PRD Section 8.2. Multi-step agent loop with duplicate detection, scope assignment, cross-referencing. |
| AI question answering with impact assessment | When a question is answered, the AI automatically checks what it unblocks, what it contradicts, and what new questions it raises. No tool does this. | HIGH | PRD Section 9.1. The impact assessment cascade (update designs, unblock stories, flag conflicts, raise new questions) is unique. |
| Knowledge articles as persistent AI memory | The AI writes its understanding into versioned articles, then reads them back in future sessions instead of re-deriving from raw data. This is the "progressive brain" concept. | HIGH | PRD Section 13.7 Layer 2. Articles with staleness tracking, version history, and semantic embeddings. |
| Two-pass context retrieval (summaries then full content) | Keeps AI token costs manageable while giving access to all relevant knowledge. Load summaries first, then full content for the most relevant articles. | MEDIUM | PRD Section 13.7. Smart token budget management. |
| AI gap detection and readiness assessment | AI proactively identifies discovery gaps and tells you when you have enough information to start building. No PM tool does this. | MEDIUM | PRD Section 8.3. Requires the question system and knowledge base to be in place first. |
| Conflict detection across discovery inputs | When new information contradicts existing decisions, the AI flags it. Prevents the "we built the wrong thing because nobody noticed the contradiction" failure. | MEDIUM | PRD Section 8.3. Relies on the decision and question entity linkages. |

#### Salesforce-Specific Intelligence

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Salesforce org metadata sync and knowledge base | No PM tool understands a Salesforce org. This connects what the team is building to what already exists. Enables impact analysis that is impossible with generic tools. | HIGH | PRD Section 13. OAuth connection, periodic metadata sync, parsed into normalized tables. |
| Brownfield org ingestion (4-phase pipeline) | Automated analysis of an existing org: parse metadata, classify into domains, synthesize business processes, articulate knowledge articles. Turns weeks of manual org discovery into hours. | HIGH | PRD Section 13.6. Parse > Classify > Synthesize > Articulate. |
| Business process mapping from org metadata | AI identifies logical business processes from component relationships. "Account Onboarding involves these 12 components working together." | HIGH | PRD Section 13.6 Phases 3-4. BusinessProcess + BusinessProcessComponent entities. |
| Sprint intelligence (conflict detection on Salesforce components) | Detects when two stories modify the same Apex class or Flow. Prevents merge conflicts before they happen. Unique to Salesforce-aware tools. | MEDIUM | PRD Section 11. Uses StoryComponent join table for overlap detection. |
| Impacted components tracking on stories | Each story lists which Salesforce metadata it creates/modifies/deletes. Enables dependency analysis that generic story points cannot. | MEDIUM | PRD Section 10.3. StoryComponent join with impactType enum. |
| Domain groupings with human confirmation | AI suggests business domain clusters, architect confirms. Creates a shared vocabulary for the org. | MEDIUM | PRD Section 13.4. isAiSuggested + isConfirmed pattern. |

#### Developer Integration

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| REST API for Claude Code context packages | Developers get the full business context behind a ticket delivered directly into their AI coding environment. No other tool bridges PM knowledge to AI code generation this way. | HIGH | PRD Section 12.2. Context Package API assembles story details, business processes, knowledge articles, related decisions, sprint conflicts. |
| Dual-source developer context (web app + SF CLI) | Claude Code merges business intelligence from the web app with live technical reality from the Salesforce CLI. The web app knows the "why"; the CLI knows the "what exists." | MEDIUM | PRD Section 12.2. Tier 3a (web app API) + Tier 3b (SF CLI). The web app side is what this project builds. |
| Salesforce development guardrails enforcement | Six hard-locked guardrails (governor limits, bulkification, test classes, naming, security, sharing model) enforced in Claude Code skills. | LOW | PRD Section 15. These live in Claude Code skills, not the web app, but the web app references them in context packages. |

#### Document Generation

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Branded document generation (Word, PPT, PDF) | PM clicks a button, gets a branded BRD or status report populated with project context. Hours of manual work eliminated. Tools like Scribehow or Document360 handle user docs, not consulting deliverables. | HIGH | PRD Section 16. Template-driven, branding-enforced, stored in S3. |
| AI-populated deliverables from project context | Documents are not generic templates. They pull from the actual project knowledge base: discovery findings, decisions, requirements, sprint status. | HIGH | PRD Section 16.3. The AI agent harness assembles relevant context per document type. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem useful but would add complexity without proportional value in V1, or that actively conflict with the product's design philosophy.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time collaborative editing (Google Docs style) | "Multiple BAs edit the same story at once" | Requires CRDT or OT infrastructure (Yjs, Liveblocks). Massive implementation complexity for a solo builder. The actual use case (concurrent edits) happens rarely and is handled well by optimistic concurrency. | Optimistic concurrency control with version conflict UI (PRD Section 19.2). Handles the realistic scenario without the infrastructure burden. |
| Bidirectional Jira sync | "Keep client Jira and our tool in sync" | Split-brain problem. Two sources of truth means constant reconciliation, conflict resolution, and data integrity headaches. Every bidirectional sync implementation becomes the most complained-about feature. | One-directional push (PRD Section 20). This tool is the source of truth. Push to client Jira. Do not read back. |
| Provider-agnostic AI abstraction layer | "What if we want to switch to GPT-5 or Gemini?" | Abstraction layers add indirection, limit provider-specific features (tool use, caching, system prompts), and are premature optimization. The actual likelihood of switching in V1 is near zero. | Clean module boundary (PRD Section 3.3). All AI calls go through the agent harness. If a swap is needed later, refactor the harness internals. Do not build a generic layer now. |
| Mobile app | "Consultants are on the road" | The web app is responsive enough for checking dashboards on a phone. A native mobile app doubles the frontend surface area for a solo builder. The primary use cases (transcript processing, story editing, sprint planning) need a desktop-class interface. | Responsive web design. The dashboard and notification views should work on mobile browsers. Complex editing stays desktop. |
| Activity feed / change history UI | "I want to see everything that happened on this project" | V1 already stores VersionHistory and SessionLog. Building a polished activity feed UI is significant frontend work with marginal value when the dashboard already surfaces what matters. | VersionHistory entity for conflict resolution. SessionLog for audit. Dashboard for "what changed." Defer the feed UI to V2. |
| Email/push notifications | "I need to know when something happens even when I'm not in the app" | Requires email infrastructure (SendGrid/SES), push notification service, notification preference management UI. For an internal tool with 5-30 users, the in-app bell is sufficient. | In-app notifications only (PRD Section 17.8). Users who live in the tool will see them. |
| Firm administrator UI | "Admins need to configure guardrails and templates" | Building an admin UI for settings that change rarely (branding, guardrails, naming conventions) is wasted effort. The firm owner (who is also the developer) can update config in code. | Hardcoded firm-level settings in V1 (PRD Section 4.6). TypeScript constants and database seeds. Admin UI in V2 when other people need to manage these. |
| Cross-project learning / templates | "Reuse patterns from previous projects" | Data isolation is a hard constraint (PRD Section 22.2). Cross-project data sharing creates security and compliance risks with client data. | Project archival and reactivation (PRD Section 21.2) handles the "new engagement with same client" case. Firm-level templates (epic templates by engagement type) handle reuse without sharing data. |
| Git repository management from web app | "See commits, PRs, deployments in the same tool" | The web app is the management/knowledge layer. Git is developer tooling. Adding Git integration pulls the web app into territory it should not own and creates another integration to maintain. | Clean boundary: web app provides context, Claude Code executes, developers manage Git through standard workflows. The org metadata sync captures what lands in the shared sandbox. |
| Large transcript handling (20K+ words) | "We have hour-long discovery sessions" | Token costs scale linearly. A 20K word transcript could cost $3-6 per processing run. The chunking strategy adds complexity. | V1 handles transcripts up to ~10K words (PRD Section 6.4). For longer transcripts, users can split them manually or summarize sections. V2 adds chunked processing. |
| Playwright test integration | "Auto-import test results" | Requires parsing Playwright output format, mapping test names to test cases, handling flaky tests. QA workflow is simpler when QAs manually record results with context. | Manual test execution recording (PRD Section 18). QAs mark Pass/Fail/Blocked with notes. Playwright integration in V2. |

## Feature Dependencies

```
[Authentication (Clerk)]
    └──requires──> [nothing, foundational]

[Project Data Model (PostgreSQL schema)]
    └──requires──> [Authentication]
    └──requires──> [Database setup (Neon/Supabase, Prisma)]

[Question System]
    └──requires──> [Project Data Model]
    └──requires──> [Epic/Feature CRUD]

[AI Agent Harness]
    └──requires──> [Project Data Model]
    └──requires──> [Claude API integration]

[Transcript Processing]
    └──requires──> [AI Agent Harness]
    └──requires──> [Question System]
    └──requires──> [Chat/Conversation infrastructure]

[Knowledge Articles + Semantic Search]
    └──requires──> [Project Data Model]
    └──requires──> [pgvector setup]
    └──requires──> [AI Agent Harness]
    └──requires──> [Inngest background jobs (article refresh, embedding gen)]

[Discovery Dashboard]
    └──requires──> [Question System]
    └──requires──> [Knowledge Articles] (for AI synthesis cache)
    └──requires──> [Inngest background jobs] (for cached synthesis refresh)

[Epic/Feature/Story CRUD]
    └──requires──> [Project Data Model]

[Mandatory Story Field Validation]
    └──requires──> [Epic/Feature/Story CRUD]

[AI Story Generation]
    └──requires──> [AI Agent Harness]
    └──requires──> [Epic/Feature/Story CRUD]
    └──requires──> [Question System] (for discovery context)

[Sprint Management]
    └──requires──> [Epic/Feature/Story CRUD]

[Sprint Intelligence (conflict detection)]
    └──requires──> [Sprint Management]
    └──requires──> [Impacted Components tracking on stories]

[Salesforce Org Connectivity]
    └──requires──> [Project Data Model (OrgComponent, OrgRelationship)]
    └──requires──> [Salesforce OAuth implementation]

[Brownfield Org Ingestion]
    └──requires──> [Salesforce Org Connectivity]
    └──requires──> [AI Agent Harness]
    └──requires──> [Knowledge Articles]

[Business Process Mapping]
    └──requires──> [Brownfield Org Ingestion]
    └──requires──> [Knowledge Articles]

[REST API for Claude Code]
    └──requires──> [Epic/Feature/Story CRUD]
    └──requires──> [Knowledge Articles]
    └──requires──> [Salesforce Org Connectivity]

[Context Package Assembly]
    └──requires──> [REST API for Claude Code]
    └──requires──> [Business Process Mapping]
    └──requires──> [Sprint Intelligence]

[Document Generation]
    └──requires──> [AI Agent Harness]
    └──requires──> [S3/R2 file storage]
    └──requires──> [Branding templates]

[QA Workflow]
    └──requires──> [Epic/Feature/Story CRUD]
    └──requires──> [Test Case entity]

[Client Jira Sync]
    └──requires──> [Epic/Feature/Story CRUD]
    └──requires──> [Inngest background jobs]

[Notification System]
    └──requires──> [Inngest background jobs]
    └──requires──> [Project membership (RBAC)]
```

### Dependency Notes

- **Transcript Processing requires Question System:** Transcripts produce questions, decisions, requirements. The question system must exist first.
- **Sprint Intelligence requires Impacted Components:** Conflict detection works by querying overlapping components across stories. Without component tracking, there is nothing to detect conflicts on.
- **Context Package Assembly requires nearly everything:** This is a Phase 3/4 feature because it needs stories, knowledge articles, org components, and business processes to all be populated.
- **Knowledge Articles require Inngest:** Articles are refreshed by background jobs, not inline. The Inngest infrastructure must exist.
- **Discovery Dashboard requires Knowledge Articles:** The AI synthesis cache (Current Focus, Recommended Focus) is stored as cached content refreshed by Inngest triggers. Without the knowledge layer, the dashboard is purely quantitative.
- **AI Story Generation benefits enormously from Question System:** Stories generated from requirements + discovery context are dramatically better than stories generated from bare requirements. Phase 2 builds on Phase 1's discovery data.

## MVP Definition

### Launch With (Phase 1 -- Discovery and Knowledge Brain)

The MVP is not a stripped-down PM tool. It is the knowledge brain. This is the right call because the knowledge brain is the hardest and most unique part, and it validates the core hypothesis: can an AI progressively build project understanding that makes the entire team more effective?

- [ ] PostgreSQL schema (all entities) -- foundation for everything
- [ ] Clerk authentication with per-project roles -- security baseline
- [ ] Project creation and basic management -- entry point
- [ ] Question system with full lifecycle (raise, scope, own, answer, impact assess) -- atomic unit of discovery
- [ ] AI agent harness (task definitions, execution engine, context assembly) -- the AI backbone
- [ ] Transcript processing via AI -- the "magic moment" that shows the tool's value
- [ ] Chat interface (general project chat + task sessions) -- primary input channel
- [ ] Knowledge articles with staleness tracking -- persistent AI memory
- [ ] Inngest background job infrastructure -- required for article refresh, embedding gen, notifications
- [ ] In-app notification system -- keeps users informed
- [ ] Search (filtered + full-text + semantic) -- users must find things
- [ ] Discovery dashboard with health score -- the daily landing page

### Add After Validation (Phase 2 -- Story Management and Sprint Intelligence)

Once the knowledge brain is proven useful, add the work management layer on top of it.

- [ ] Epic/Feature/Story CRUD with mandatory field validation -- when discovery context feeds story creation
- [ ] AI-assisted story generation from requirements and discovery -- leverages Phase 1 knowledge
- [ ] Sprint creation and management -- when stories exist to plan
- [ ] Sprint intelligence (conflict detection, dependency ordering) -- when impacted components are tracked
- [ ] Sprint dashboard -- when sprints exist to visualize

### Add After Work Management (Phase 3 -- Salesforce Org Connectivity)

The Salesforce-specific intelligence layer. Requires stories to exist so that impacted components can be linked.

- [ ] Salesforce org OAuth connection -- when the team needs org awareness
- [ ] Metadata sync (incremental + full refresh) -- when org changes need tracking
- [ ] Brownfield org ingestion pipeline -- for existing orgs
- [ ] Business process mapping -- when org components are populated
- [ ] REST API for Claude Code -- when developers need context packages
- [ ] Context package assembly -- when all context sources are available

### Future Consideration (Phase 4 -- Document Generation, QA, and Polish)

- [ ] Branded document generation (Word, PPT, PDF) -- when project context is rich enough to populate documents
- [ ] QA workflow (test execution tracking, defect management) -- when stories are being built and tested
- [ ] Client Jira sync -- when clients require it
- [ ] Project archival workflow -- when projects complete
- [ ] PM dashboard (aggregated views) -- when enough data exists for meaningful aggregation

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Question system with lifecycle | HIGH | MEDIUM | P1 |
| AI agent harness | HIGH | HIGH | P1 |
| Transcript processing | HIGH | HIGH | P1 |
| Chat interface | HIGH | MEDIUM | P1 |
| Knowledge articles + semantic search | HIGH | HIGH | P1 |
| Discovery dashboard | HIGH | MEDIUM | P1 |
| In-app notifications | MEDIUM | MEDIUM | P1 |
| Search (filtered + full-text + semantic) | HIGH | MEDIUM | P1 |
| Epic/Feature/Story CRUD | HIGH | MEDIUM | P2 |
| AI story generation | HIGH | MEDIUM | P2 |
| Sprint management | MEDIUM | MEDIUM | P2 |
| Sprint intelligence | HIGH | MEDIUM | P2 |
| Mandatory story field validation | MEDIUM | LOW | P2 |
| Salesforce org connectivity | HIGH | HIGH | P2 |
| Brownfield org ingestion | HIGH | HIGH | P2 |
| REST API for Claude Code | HIGH | MEDIUM | P2 |
| Context package assembly | HIGH | HIGH | P2 |
| Branded document generation | MEDIUM | HIGH | P3 |
| QA workflow | MEDIUM | MEDIUM | P3 |
| Client Jira sync | LOW | MEDIUM | P3 |
| Project archival | LOW | LOW | P3 |
| PM dashboard | MEDIUM | MEDIUM | P3 |
| Usage and cost dashboard | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for Phase 1 launch (validates core hypothesis: AI project brain)
- P2: Must have for Phase 2-3 (work management + Salesforce intelligence)
- P3: Phase 4 or beyond (document gen, QA, polish)

## Competitor Feature Analysis

| Feature Area | Jira + Confluence + AI | Linear + Notion AI | ClickUp AI | This Platform |
|---------|--------------|--------------|------------|---------------|
| Work item tracking | Mature, full-featured, overly complex | Clean, fast, developer-focused | Feature-rich, cluttered UI | Purpose-built for SF consulting. Mandatory fields enforce quality. |
| AI assistance | Jira AI summarizes issues. Confluence AI drafts pages. Disconnected. | Linear auto-labels, Notion AI writes content. Per-item, not project-wide. | Task descriptions, summaries. Shallow. | Persistent project brain. Cumulative understanding. Cross-entity impact analysis. |
| Knowledge management | Confluence. Manual. Pages rot. No connection to work items. | Notion. Manual. Better UX than Confluence. Still disconnected from PM. | Docs feature. Basic. | AI-curated articles with staleness tracking. Automatic linking to entities. Semantic retrieval. |
| Discovery workflow | None. Discovery is done in meetings, transcripts go to Confluence. | None. | None. | First-class discovery workflow. Transcript processing, question lifecycle, impact assessment. |
| Salesforce awareness | Zero. Jira does not know what a Custom Object is. | Zero. | Zero. | Full org metadata ingestion, business process mapping, component-level impact tracking. |
| Developer AI integration | Jira plugin for Cursor/Copilot provides ticket context. Basic. | Linear provides ticket context to AI editors. | Basic. | Full context package API. Business processes, knowledge articles, decisions, sprint conflicts delivered to Claude Code. |
| Document generation | Confluence export to PDF. No branding, no AI population. | Notion export. Basic. | Docs export. Basic. | Branded Word/PPT/PDF generation populated from project context by AI. |
| Sprint intelligence | None. Jira boards are passive. | Auto-assigns, basic estimation. | Workload views. | Component-level conflict detection, dependency ordering, parallelization analysis. |
| Consulting-specific | Generic. Configured per team. | Generic. Developer-first. | Generic. | Engagement types, sandbox strategy, SF guardrails, client data isolation. |

**Key insight:** No existing tool combines PM, KM, and Salesforce org intelligence in a single platform. The closest alternatives require 3-4 tools stitched together, and even then the AI understanding is per-item, not cumulative. The "persistent project brain" concept has no direct competitor.

## Sources

- PRD v2.3 (SF-Consulting-AI-Framework-PRD-v2.1.md) -- primary source for all feature specifications
- SESSION-3-TECHNICAL-SPEC.md -- referenced for architecture details
- PROJECT.md -- project context and constraints
- Training data knowledge of: Jira, Jira AI, Linear, Notion AI, ClickUp AI, Monday.com AI, Asana Intelligence, Confluence AI, Guru, Slite, Fireflies.ai, Otter.ai, Document360 (MEDIUM confidence -- no web verification available)
- Training data knowledge of: Salesforce consulting delivery patterns, SDLC workflows, brownfield org analysis (HIGH confidence -- domain expertise)

---
*Feature research for: Salesforce Consulting AI Framework*
*Researched: 2026-04-04*
