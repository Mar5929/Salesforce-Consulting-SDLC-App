# Gap Analysis Master Index

**Date:** 2026-04-08
**Reports:** 10 domain audits + 1 V2 roadmap assessment
**PRD Sections Covered:** 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 27

## Summary Statistics

- **Total V1 gaps:** 153 (across 9 domain reports; excludes 2 resolved Jira gaps)
- **Critical:** 22
- **Significant:** 77
- **Minor:** 54
- **V2 items assessed:** 22 (8 ready, 9 needs prep, 5 major work, 3 V1 scope drift)

### Per-Report Breakdown

| # | Domain | Total | Critical | Significant | Minor |
|---|--------|-------|----------|-------------|-------|
| 01 | RBAC and Security | 16 | 4 | 8 | 4 |
| 02 | Agent Harness | 13 | 4 | 7 | 2 |
| 03 | Discovery and Questions | 14 | 2 | 6 | 6 |
| 04 | Work Management | 11 | 2 | 6 | 3 |
| 05 | Sprint and Developer Integration | 14 | 1 | 8 | 5 |
| 06 | Org and Knowledge | 16 | 3 | 8 | 5 |
| 07 | Dashboards and Search | 26 | 0 | 16 | 10 |
| 08 | Documents and Notifications | 21 | 2 | 8 | 11 |
| 09 | QA, Jira, Archival | 22 | 4 | 10 | 4 |
| 10 | V2 Roadmap Assessment | 22 items | -- | -- | -- |

---

## All Critical Gaps (Fix First)

| Gap ID | Domain | Title | Scope | Dependencies |
|--------|--------|-------|-------|--------------|
| GAP-RBAC-001 | RBAC | Removed members bypass all server-side auth | S | None |
| GAP-RBAC-002 | RBAC | Epic/feature write operations have no role gate | S | RBAC-001 |
| GAP-RBAC-003 | RBAC | Sprint management has no role gate | S | RBAC-001 |
| GAP-RBAC-004 | RBAC | Milestone write operations have no role gate | S | RBAC-001 |
| GAP-AGENT-001 | Agent Harness | STATUS_REPORT_GENERATION task unimplemented | M | None |
| GAP-AGENT-002 | Agent Harness | CONTEXT_PACKAGE_ASSEMBLY task unimplemented | L | None |
| GAP-AGENT-003 | Agent Harness | Output validation failure does not trigger re-prompt | M | None |
| GAP-AGENT-004 | Agent Harness | create_question tool drops confidence/needsReview/reviewReason | S | None |
| GAP-DISC-009 | Discovery | Gap detection not implemented | L | DISC-012 |
| GAP-DISC-010 | Discovery | Readiness assessment not implemented | L | None |
| GAP-WORK-001 | Work Mgmt | No mandatory field validation on DRAFT to READY | M | WORK-002, WORK-005 |
| GAP-WORK-002 | Work Mgmt | Test case stubs never generated or created | L | None |
| GAP-SPRINT-009 | Sprint/Dev | Tier 3a org/query natural-language endpoint missing | L | Semantic search |
| GAP-ORG-002 | Org/Knowledge | Automated incremental sync cron does not exist | M | None |
| GAP-ORG-003 | Org/Knowledge | Full knowledge refresh -- no function, no UI trigger | L | None |
| GAP-ORG-007 | Org/Knowledge | Ingestion Phase 4 does not create KnowledgeArticle records | M | None |
| GAP-DOCS-009 | Documents | DOCUMENT_GENERATED notification type not in schema enum (runtime crash) | S | None |
| GAP-NOTIF-001 | Notifications | 5 of 14 notification event types have no senders (dead code) | L | Various |
| GAP-QA-001 | QA | No AI generation of test cases from acceptance criteria | L | Agent harness |
| GAP-QA-003 | QA | No test execution UI on the story detail page | M | QA-001, QA-002 |
| GAP-ARCH-001 | Archival | archiveProject does not delete Salesforce credentials | S | None |
| GAP-ARCH-004 | Archival | Reactivation is in-place status flip, not fork-and-inherit | XL | ARCH-001, ARCH-003 |

---

## All Significant Gaps

| Gap ID | Domain | Title | Scope |
|--------|--------|-------|-------|
| GAP-RBAC-005 | RBAC | QA story creation Draft-only restriction is accidental | S |
| GAP-RBAC-006 | RBAC | Story status machine management vs execution split unaudited | S |
| GAP-RBAC-007 | RBAC | Decisions, requirements, risks write actions have no role gate | M |
| GAP-RBAC-008 | RBAC | Org disconnect allows PM -- PRD restricts to SA only | S |
| GAP-RBAC-009 | RBAC | Project archive restricted to PM only -- PRD says SA | S |
| GAP-RBAC-010 | RBAC | Usage and Cost dashboard absent; data leaks to all roles | L |
| GAP-RBAC-011 | RBAC | Optimistic concurrency control entirely absent (VersionHistory dead) | XL |
| GAP-RBAC-012 | RBAC | Prompt injection defense absent from transcript processing | S |
| GAP-RBAC-013 | RBAC | No centralized token field stripping for Project serialization | M |
| GAP-AGENT-005 | Agent Harness | Transcript processing system prompt missing untrusted-content protection | S |
| GAP-AGENT-006 | Agent Harness | Firm-level typographic rules not implemented | M |
| GAP-AGENT-007 | Agent Harness | SessionLog.entitiesCreated/entitiesModified never populated | M |
| GAP-AGENT-008 | Agent Harness | Rate limiting and monthly cost caps not implemented | L |
| GAP-AGENT-009 | Agent Harness | General chat history window not implemented | M |
| GAP-AGENT-010 | Agent Harness | Ambiguity "Needs Review" session-end UX not implemented | M |
| GAP-AGENT-011 | Agent Harness | Transcript context missing getRecentSessions and getArticleSummaries | M |
| GAP-DISC-001 | Discovery | Question ID scheme deviates from PRD spec | M |
| GAP-DISC-002 | Discovery | IMPACT_ASSESSED state missing; REVIEWED added without PRD basis | S |
| GAP-DISC-003 | Discovery | AI impact assessment stores text but executes no downstream actions | L |
| GAP-DISC-004 | Discovery | Hybrid routing function unreachable from direct answer UI path | M |
| GAP-DISC-005 | Discovery | QuestionAffects table is schema-only -- never populated or displayed | M |
| GAP-DISC-011 | Discovery | Follow-up recommendations lack question-level blocking prioritization | M |
| GAP-DISC-012 | Discovery | Discovery dashboard missing 3 of 7 PRD sections | M |
| GAP-WORK-003 | Work Mgmt | Linked OrgComponent mode absent from story form UI | L |
| GAP-WORK-004 | Work Mgmt | EpicPhase records never auto-initialized on epic create | S |
| GAP-WORK-005 | Work Mgmt | Enrichment path creates duplicate free-text components | S |
| GAP-WORK-006 | Work Mgmt | Six Salesforce guardrails absent from AI prompts | S |
| GAP-WORK-007 | Work Mgmt | BA role cannot transition stories -- contradicts PRD | S |
| GAP-WORK-008 | Work Mgmt | Story generation does not cross-reference org knowledge base | M |
| GAP-SPRINT-001 | Sprint/Dev | Capacity assessment not implemented | M |
| GAP-SPRINT-003 | Sprint/Dev | Mid-sprint re-analysis not triggered by story status changes | S |
| GAP-SPRINT-004 | Sprint/Dev | Cross-developer coordination has no assignee awareness | S |
| GAP-SPRINT-006 | Sprint/Dev | Context package missing parent epic/feature business context | M |
| GAP-SPRINT-007 | Sprint/Dev | Context package returns article summaries only, not full content | M |
| GAP-SPRINT-008 | Sprint/Dev | Context package omits related discovery notes | S |
| GAP-SPRINT-010 | Sprint/Dev | Component report endpoint missing entirely | M |
| GAP-SPRINT-011 | Sprint/Dev | API keys have no expiry or rotation mechanism | M |
| GAP-SPRINT-012 | Sprint/Dev | Brownfield scratch org warning not implemented | M |
| GAP-ORG-001 | Org/Knowledge | No PKCE on OAuth Web Server Flow | S |
| GAP-ORG-004 | Org/Knowledge | BusinessContextAnnotation has no write surface | M |
| GAP-ORG-005 | Org/Knowledge | BusinessContextAnnotation not included in context packages | S |
| GAP-ORG-006 | Org/Knowledge | Progressive update -- planned components never created | M |
| GAP-ORG-008 | Org/Knowledge | KnowledgeArticle confirmation model absent | M |
| GAP-ORG-009 | Org/Knowledge | Org Health Assessment for Rescue/Takeover absent | XL |
| GAP-ORG-010 | Org/Knowledge | Incremental sync does not flag needsAssignment | S |
| GAP-ORG-012 | Org/Knowledge | Org Query API is structured-filter only | M |
| GAP-ORG-013 | Org/Knowledge | Agent staleness flagging inline not implemented | M |
| GAP-ORG-014 | Org/Knowledge | Two-pass retrieval incomplete -- no embedding step | M |
| GAP-DASH-001 | Dashboards | Health Score uses wrong scoring model | M |
| GAP-DASH-003 | Dashboards | Client-owned question signal missing from health score | S |
| GAP-DASH-004 | Dashboards | Briefing header missing roadmap progress and requirements count | S |
| GAP-DASH-005 | Dashboards | Blocking questions missing age and owner fields | S |
| GAP-DASH-006 | Dashboards | Briefing missing epic status section | M |
| GAP-DASH-007 | Dashboards | Recommended focus is prose, not ranked list with question links | M |
| GAP-DASH-009 | Dashboards | Sprint dashboard missing stories with missing mandatory fields | S |
| GAP-DASH-010 | Dashboards | Sprint dashboard missing developer workload view | S |
| GAP-DASH-012 | Dashboards | PM dashboard missing risk register summary | S |
| GAP-DASH-013 | Dashboards | PM dashboard missing upcoming deliverable deadlines | S |
| GAP-DASH-014 | Dashboards | PM dashboard missing client-facing items needing attention | S |
| GAP-DASH-015 | Dashboards | Usage and costs not a dedicated settings tab | M |
| GAP-DASH-016 | Dashboards | Usage and costs missing per-member breakdown | S |
| GAP-DASH-019 | Dashboards | Search missing Story, OrgComponent, BusinessProcess entity types | M |
| GAP-DASH-020 | Dashboards | Semantic search only covers KnowledgeArticle | L |
| GAP-DASH-026 | Dashboards | Discovery dashboard auto-refresh event wiring needs verification | S |
| GAP-DOCS-001 | Documents | Missing document types -- SOW, SDD, Training, Runbook | L |
| GAP-DOCS-002 | Documents | Branding fully hardcoded -- no admin-configurable assets | M |
| GAP-DOCS-005 | Documents | Scope parameter collected but discarded -- epic-scoped gen broken | M |
| GAP-DOCS-006 | Documents | No document versioning model -- version numbers are facade | M |
| GAP-NOTIF-002 | Notifications | PROJECT_ARCHIVED/REACTIVATED send wrong notification type | S |
| GAP-NOTIF-003 | Notifications | QUESTION_ASSIGNED recipient resolution uses wrong fallback | S |
| GAP-NOTIF-004 | Notifications | QUESTION_CONFLICT notification type absent from schema (crash) | S |
| GAP-NOTIF-005 | Notifications | QUESTION_ANSWERED sent to wrong recipient set | S |
| GAP-NOTIF-007 | Notifications | Orphaned QA events -- wrong notification types used as proxies | M |
| GAP-NOTIF-008 | Notifications | JIRA_SYNC_REQUESTED retry mechanism silently broken | S |
| GAP-QA-002 | QA | Defect edit is a stub -- no edit sheet implemented | S |
| GAP-QA-004 | QA | Test coverage metric not computed or surfaced | M |
| GAP-QA-005 | QA | Defect attachment/screenshot upload not implemented | M |
| GAP-QA-006 | QA | QA role cannot transition story status -- contradicts RBAC table | S |
| GAP-JIRA-001 | Jira | Field mapping is hardcoded -- not configurable per project | M |
| GAP-JIRA-002 | Jira | Status trigger configuration not exposed -- all statuses trigger sync | S |
| GAP-JIRA-005 | Jira | Story points and acceptance criteria not synced to Jira | S |
| GAP-ARCH-002 | Archival | archiveProject does not disconnect Jira sync | S |
| GAP-ARCH-003 | Archival | No final project summary document generated on archive | L |
| GAP-LIFECYCLE-001 | Lifecycle | currentPhase on Project is never advanced | M |
| GAP-LIFECYCLE-002 | Lifecycle | No phase-specific dashboard emphasis or AI behavior | L |
| GAP-LIFECYCLE-003 | Lifecycle | No default epic templates created on project setup | M |

---

## All Minor Gaps

| Gap ID | Domain | Title | Scope |
|--------|--------|-------|-------|
| GAP-RBAC-014 | RBAC | Access logging covers only status transitions and API requests | L |
| GAP-RBAC-015 | RBAC | Settings page has no server-side role gate | S |
| GAP-RBAC-016 | RBAC | Per-consultant daily limits and per-project monthly cost caps absent | M |
| GAP-AGENT-012 | Agent Harness | getRecentSessions and getMilestoneProgress context functions missing | S |
| GAP-AGENT-013 | Agent Harness | Story generation context loader too shallow | M |
| GAP-DISC-006 | Discovery | source field absent from Question model | S |
| GAP-DISC-007 | Discovery | Owner cannot be "Client" or "TBD" -- only team members | S |
| GAP-DISC-008 | Discovery | Detail page missing parkedReason and QuestionAffects rendering | S |
| GAP-DISC-013 | Discovery | Questions list has no pagination | S |
| GAP-DISC-014 | Discovery | ESCALATED status in agent code has no schema enum value | S |
| GAP-WORK-009 | Work Mgmt | acceptanceCriteria nullable in schema but mandatory in intent | S |
| GAP-WORK-010 | Work Mgmt | Story detail page has no status transition controls | S |
| GAP-WORK-011 | Work Mgmt | Feature-level "Generate Stories" entry point missing | S |
| GAP-SPRINT-002 | Sprint/Dev | Parallelization analysis not surfaced as named output | S |
| GAP-SPRINT-005 | Sprint/Dev | Conflict dismissal is client-side only, not persisted | S |
| GAP-SPRINT-013 | Sprint/Dev | Context package URL path does not match PRD spec | S-L |
| GAP-SPRINT-014 | Sprint/Dev | Sprint intelligence bypasses agent harness | M |
| GAP-ORG-011 | Org/Knowledge | Removed components only soft-deleted on FULL sync | S |
| GAP-ORG-015 | Org/Knowledge | BusinessProcessDependency records never created | S |
| GAP-ORG-016 | Org/Knowledge | Sync schedule display-only, no config UI | S |
| GAP-DASH-002 | Dashboards | Health score thresholds not configurable per project | M |
| GAP-DASH-008 | Dashboards | Milestone AI summaries are computed locally, not AI-generated | M |
| GAP-DASH-011 | Dashboards | Sprint dashboard missing conflict alerts section | S |
| GAP-DASH-017 | Dashboards | Usage and costs missing date range filter | S |
| GAP-DASH-018 | Dashboards | Usage and costs missing Inngest event volume metric | M |
| GAP-DASH-021 | Dashboards | Search lacks explicit semantic mode toggle | S |
| GAP-DASH-022 | Dashboards | Execution plan missing phase grouping within epics | S |
| GAP-DASH-023 | Dashboards | Execution plan missing story-to-story dependency visualization | M |
| GAP-DASH-024 | Dashboards | Health score not displayed in briefing header | S |
| GAP-DASH-025 | Dashboards | PM dashboard uses duplicate hardcoded pricing vs ai-pricing.ts | S |
| GAP-DOCS-003 | Documents | No logo rendering in any format renderer | S |
| GAP-DOCS-004 | Documents | No branding validation step in document generation | S |
| GAP-DOCS-007 | Documents | No inline preview for DOCX or PPTX formats | S |
| GAP-DOCS-008 | Documents | Generation progress polling has no page refresh after completion | S |
| GAP-DOCS-010 | Documents | Context query hardcoded -- no token budget for large projects | S |
| GAP-NOTIF-006 | Notifications | DOCUMENT_GENERATED not in icon map or notification routing | S |
| GAP-NOTIF-009 | Notifications | No notification priority visible in UI | S |
| GAP-NOTIF-010 | Notifications | NotificationBell only renders with activeProjectId | M |
| GAP-NOTIF-011 | Notifications | No notification for new team member added | S |
| GAP-QA-007 | QA | No per-sprint test execution aggregate in sprint view | S |
| GAP-QA-008 | QA | TEST_EXECUTION_RECORDED and DEFECT_* events have no consumers | S |
| GAP-ARCH-005 | Archival | No access log retention enforcement on archive | M |
| GAP-LIFECYCLE-004 | Lifecycle | No engagement-type-specific AI behavior | M |

---

## Suggested Phase Groupings

### Phase A: Security Hardening (16 gaps)
**Gaps:** GAP-RBAC-001, RBAC-002, RBAC-003, RBAC-004, RBAC-005, RBAC-006, RBAC-007, RBAC-008, RBAC-009, RBAC-012, RBAC-013, RBAC-015, AGENT-004, AGENT-005, DOCS-009, NOTIF-004
**Total scope:** ~S-M (mostly single-line to small fixes)
**Dependencies:** RBAC-001 must be first (all others depend on it)
**Rationale:** Security and RBAC gaps are the highest-risk items. Most are small fixes (adding `requireRole` calls, adding a status filter). AGENT-004 (create_question dropping fields) and DOCS-009/NOTIF-004 (invalid notification types causing runtime crashes) are quick wins that fix real bugs.

### Phase B: Agent Harness Engine Hardening (7 gaps)
**Gaps:** GAP-AGENT-003, AGENT-006, AGENT-007, AGENT-008, AGENT-012, WORK-006, SPRINT-014
**Total scope:** M-L
**Dependencies:** None (independent of Phase A)
**Rationale:** The execution engine needs its re-prompt loop, firm typographic rules, session log entity tracking, rate limiting, and missing context functions. WORK-006 (Salesforce guardrails in prompts) and SPRINT-014 (sprint intelligence bypassing harness) are architecturally related.

### Phase C: Notification Event Wiring (10 gaps)
**Gaps:** GAP-NOTIF-001, NOTIF-002, NOTIF-003, NOTIF-005, NOTIF-006, NOTIF-007, NOTIF-008, NOTIF-009, NOTIF-010, NOTIF-011
**Total scope:** M-L
**Dependencies:** DOCS-009 and NOTIF-004 should be fixed in Phase A first
**Rationale:** The notification system infrastructure exists but many events are dead or send wrong types. Batch all notification wiring together for consistent patterns.

### Phase D: Question System Fidelity (9 gaps)
**Gaps:** GAP-DISC-001, DISC-002, DISC-005, DISC-006, DISC-007, DISC-008, DISC-013, DISC-014, QA-006
**Total scope:** M
**Dependencies:** None
**Rationale:** Question ID scheme, lifecycle states, source tracking, cross-cutting affects, and UI rendering fixes. QA-006 (BA story transitions) and WORK-007 overlap with this -- both fix the status machine.

### Phase E: AI-Driven Discovery Intelligence (4 gaps)
**Gaps:** GAP-DISC-003, DISC-009, DISC-010, DISC-011
**Total scope:** XL (2-3 features with AI integration)
**Dependencies:** Phase D (question system must be correct first)
**Rationale:** Gap detection, readiness assessment, impact assessment downstream actions, and blocking-prioritized follow-up recommendations. These are the "AI brain" features that make discovery valuable.

### Phase F: Story Quality and Work Management (8 gaps)
**Gaps:** GAP-WORK-001, WORK-002, WORK-004, WORK-005, WORK-007, WORK-009, WORK-010, WORK-011
**Total scope:** L
**Dependencies:** WORK-002 depends on agent harness task for test case generation
**Rationale:** DRAFT-to-READY validation, test case generation, EpicPhase initialization, component dedup, BA role fix, and UX improvements. Groups the story quality gate with its prerequisites.

### Phase G: Context Package Completeness (6 gaps)
**Gaps:** GAP-AGENT-002, SPRINT-006, SPRINT-007, SPRINT-008, SPRINT-010, SPRINT-013
**Total scope:** L
**Dependencies:** None
**Rationale:** The context package is the primary interface between the web app and Claude Code. Missing parent context, full article content, discovery notes, and the component report endpoint all belong together.

### Phase H: Sprint Intelligence Completion (5 gaps)
**Gaps:** GAP-SPRINT-001, SPRINT-002, SPRINT-003, SPRINT-004, SPRINT-005
**Total scope:** M
**Dependencies:** None
**Rationale:** Capacity assessment, parallelization output, mid-sprint triggers, developer attribution, and conflict dismissal persistence.

### Phase I: Org Knowledge and Sync (10 gaps)
**Gaps:** GAP-ORG-002, ORG-003, ORG-004, ORG-005, ORG-006, ORG-007, ORG-008, ORG-010, ORG-012, ORG-013, ORG-014
**Total scope:** XL
**Dependencies:** None (can parallel with other phases)
**Rationale:** Automated sync scheduling, knowledge refresh, annotation surfaces, article creation in ingestion, confirmation model, and NLP org query. Core knowledge infrastructure.

### Phase J: Dashboard and Search Completion (17 gaps)
**Gaps:** GAP-DASH-001 through DASH-026 (excluding the Usage and Cost gaps)
**Total scope:** L-XL
**Dependencies:** Phase D (question system fixes inform health score), Phase E (discovery intelligence feeds briefing)
**Rationale:** Health score model rework, briefing completeness, sprint dashboard additions, PM dashboard additions, search entity expansion, and roadmap improvements.

### Phase K: QA Capability (6 gaps)
**Gaps:** GAP-QA-001, QA-002, QA-003, QA-004, QA-005, QA-007
**Total scope:** L
**Dependencies:** QA-001 depends on agent harness test case generation task
**Rationale:** AI test case generation, test execution UI, defect edit sheet, coverage metrics, attachments, and sprint-level rollup.

### Phase L: Document Generation (7 gaps)
**Gaps:** GAP-DOCS-001, DOCS-002, DOCS-003, DOCS-004, DOCS-005, DOCS-006, DOCS-007, DOCS-008, DOCS-010, AGENT-001
**Total scope:** L
**Dependencies:** AGENT-001 (status report task) needed for full template coverage
**Rationale:** Missing templates, branding admin, logo rendering, validation, scoped generation, versioning, preview, and refresh.

### Phase M: Project Lifecycle and Archival (9 gaps)
**Gaps:** GAP-LIFECYCLE-001, LIFECYCLE-002, LIFECYCLE-003, LIFECYCLE-004, ARCH-001, ARCH-002, ARCH-003, ARCH-005, SPRINT-012
**Total scope:** XL
**Dependencies:** ARCH-001 before ARCH-004
**Rationale:** Phase advancement, phase-aware dashboards, default epic templates, engagement-type AI behavior, credential cleanup, Jira disconnect, summary doc generation, and log retention.

### Phase N: Deferred / V2 Candidates (6 gaps)
**Gaps:** GAP-RBAC-011 (OCC), RBAC-014 (full access logging), RBAC-010/DASH-015/DASH-016/DASH-017/DASH-018 (usage dashboard), ARCH-004 (fork-and-inherit reactivation), ORG-009 (org health assessment)
**Total scope:** XL+
**Dependencies:** Various
**Rationale:** These are full features that may exceed V1 budget. OCC (RBAC-011) is XL. Fork-and-inherit reactivation (ARCH-004) is XL. Org Health Assessment (ORG-009) is XL. Usage dashboard needs dedicated build. Consider V2 or a separate V1.1 milestone.

---

## Cross-Cutting Concerns

### RBAC Enforcement Inconsistency
The most pervasive pattern. 8 action files use only `getCurrentMember` (membership check) where `requireRole` is required. Epics, features, sprints, milestones, decisions, requirements, and risks all have no role gate. The sidebar hides links but server-side enforcement is absent (GAP-RBAC-015). The `getCurrentMember` function itself does not filter on `status: "ACTIVE"`, making all other checks moot.

### Missing Event Wiring
Multiple Inngest events are defined and emitted but have no consumers: `ORG_KNOWLEDGE_REFRESH`, `PROJECT_ARCHIVED`, `PROJECT_REACTIVATED`, `TEST_EXECUTION_RECORDED`, `DEFECT_CREATED`, `DEFECT_STATUS_CHANGED`. Additionally, 5 notification dispatch cases exist as unreachable dead code. Notification types used in `NOTIFICATION_SEND` events do not match the `NotificationType` schema enum in 2 cases (GAP-DOCS-009, GAP-NOTIF-004), causing runtime Prisma errors.

### Context Assembly Incompleteness
Across agent harness tasks, context loaders consistently omit data the tech spec requires:
- Transcript processing: missing `getRecentSessions`, `getArticleSummaries`
- Story generation: missing answered questions, org components, business processes, knowledge articles
- Sprint intelligence: missing assignee data
- Context package: missing parent epic/feature context, full article content, answered questions
- Briefing generation: missing sprint data, milestone progress

### Schema-Present but Dead Data
Multiple schema models and fields exist but are never written or read:
- `VersionHistory` -- never written
- `QuestionAffects` -- never populated
- `Question.ownerDescription` -- dead field
- `EpicPhase` records -- never auto-initialized
- `sfOrgSyncIntervalHours` -- displayed but never triggers anything
- `BusinessContextAnnotation` -- no write surface
- `BusinessProcessDependency` -- never created

### Missing Loading/Empty States
Not systematically audited, but noted in several reports: questions list loads all records (no pagination), enrichment path has no dedup, sprint intelligence panel dismissals do not persist.

### Firm Typographic Rules
GAP-AGENT-006 is a cross-cutting concern. No em dash filtering, no AI-characteristic phrase removal, no consistent date format enforcement exists anywhere in the output pipeline. Every AI-generated text (briefings, stories, assessments, documents) can contain these patterns.

---

## Dependency Graph

```
GAP-RBAC-001 (removed member auth bypass)
  |-- GAP-RBAC-002 (epic/feature role gates)
  |-- GAP-RBAC-003 (sprint role gates)
  |-- GAP-RBAC-004 (milestone role gates)
  |-- GAP-RBAC-005 (QA story draft enforcement)
  |-- GAP-RBAC-007 (decisions/requirements/risks role gates)

GAP-AGENT-004 (create_question confidence fields)
  |-- GAP-AGENT-010 (Needs Review session-end UX)

GAP-AGENT-012 (getRecentSessions context function)
  |-- GAP-AGENT-011 (transcript context enrichment)

GAP-DISC-002 (IMPACT_ASSESSED status)
  |-- GAP-DISC-003 (impact assessment downstream actions)
       |-- GAP-DISC-004 (hybrid routing unification)

GAP-DISC-005 (QuestionAffects population)
  |-- GAP-DISC-008 (detail page rendering of affects)

GAP-DISC-009 (gap detection)
  |-- GAP-DISC-011 (blocking prioritization)
  |-- GAP-DISC-012 (discovery dashboard sections)

GAP-WORK-002 (test case stubs)
  |-- GAP-WORK-001 (DRAFT-to-READY validation -- checks test case existence)

GAP-DASH-001 (health score model rework)
  |-- GAP-DASH-002 (configurable thresholds)
  |-- GAP-DASH-003 (client-owned question signal)

GAP-DASH-015 (usage settings tab)
  |-- GAP-DASH-016 (per-member breakdown)
  |-- GAP-DASH-017 (date range filter)
  |-- GAP-DASH-018 (Inngest event volume)

GAP-JIRA-001 (field mapping config)
  |-- GAP-JIRA-002 (trigger status config)
  |-- GAP-JIRA-005 (story points + AC sync)

GAP-ARCH-001 (SF credential deletion)
  |-- GAP-ARCH-002 (Jira disconnect on archive)
  |-- GAP-ARCH-005 (log retention)
  |-- GAP-ARCH-004 (reactivation fork -- requires clean archive first)

GAP-LIFECYCLE-001 (currentPhase never advanced)
  |-- GAP-LIFECYCLE-002 (phase-aware dashboards)
  |-- GAP-LIFECYCLE-004 (engagement-type AI behavior)

GAP-QA-001 (AI test case gen)
  |-- GAP-QA-003 (test execution UI)
       |-- GAP-QA-004 (coverage metric)
            |-- GAP-QA-007 (sprint-level rollup)

GAP-DOCS-009 (DOCUMENT_GENERATED enum)
  |-- GAP-NOTIF-006 (icon map + routing)
```

---

## V2 Roadmap Integration

### V1 Scope Drift (V2 items that are actually V1 gaps)
The V2 roadmap assessment identified 3 items that appear to be V1 scope:
1. **Optimistic concurrency control** (GAP-RBAC-011) -- PRD Section 19.2 explicitly requires this. Section 27 item 7 defers real-time collaboration, not basic OCC. This is V1 scope that has been de-facto deferred.
2. **Full access logging** (GAP-RBAC-014) -- PRD Section 22.4 requires "all access" logging. The current implementation only logs status transitions and API requests. V1 scope, practically V2 effort.
3. **Org Health Assessment** (GAP-ORG-009) -- PRD Section 7.3 describes this as part of Rescue/Takeover engagement type setup. V1 scope for non-Greenfield projects.

### V2 Items Needing V1 Prep
The 9 V2 items requiring V1 changes first should inform V1 implementation decisions:
- Add `sourceProjectId` field to Project model now (even if fork-and-inherit is V2)
- Add `AuditLog` schema model now (even if full access logging is V2)
- Ensure `currentPhase` advancement works (V2 phase-aware features depend on it)
- Build the Usage and Cost dashboard foundation (V2 admin UI builds on it)

### V2 Items That Are Clean Extensions (8 items)
These can be added without V1 changes -- no prep needed.

### V2 Major Work (5 items)
These require significant new infrastructure regardless of V1 state.

---

## Recommended Build Order

### Sprint 1: Security and Bug Fixes
**Phase A** (Security Hardening) + runtime crash fixes from DOCS-009, NOTIF-004
- Fix `getCurrentMember` to filter `status: "ACTIVE"` -- 1 line, fixes all 25 action files
- Add `requireRole` to 8 action files (epics, features, sprints, milestones, decisions, requirements, risks, settings page)
- Fix wrong role allowlists (RBAC-008 org disconnect, RBAC-009 archive)
- Fix `create_question` tool to persist confidence/needsReview fields
- Add `DOCUMENT_GENERATED` and `QUESTION_CONFLICT` to NotificationType enum
- Add prompt injection defense to transcript processing system prompt
- Add token field stripping middleware
- **Estimated effort:** 2-3 days

### Sprint 2: Agent Harness Hardening
**Phase B** (Agent Harness Engine) + quick wins
- Implement output validation re-prompt loop
- Add firm typographic rules module
- Wire SessionLog entity tracking
- Add Salesforce guardrails to story generation prompts
- Build `getRecentSessions` and `getMilestoneProgress` context functions
- Route sprint intelligence through agent harness
- **Estimated effort:** 3-5 days

### Sprint 3: Notification Wiring + Question System
**Phase C** (Notification Wiring) + **Phase D** (Question System)
- Wire all 5 dead notification event senders
- Fix notification recipient resolution
- Fix proxy notification types for QA events
- Fix question lifecycle (IMPACT_ASSESSED state, source field, pagination)
- Fix BA and QA story transition rules
- Auto-initialize EpicPhase on epic creation
- **Estimated effort:** 5-7 days

### Sprint 4: Context Package + Sprint Intelligence
**Phase G** (Context Package) + **Phase H** (Sprint Intelligence)
- Build CONTEXT_PACKAGE_ASSEMBLY task definition
- Add parent epic/feature context, full articles, discovery notes
- Build component report endpoint
- Add capacity assessment, parallelization output, developer attribution
- Wire mid-sprint re-analysis triggers
- **Estimated effort:** 5-7 days

### Sprint 5: Discovery Intelligence + Dashboard Fixes
**Phase E** (Discovery Intelligence) + dashboard quick wins from **Phase J**
- Build gap detection analysis
- Build readiness assessment
- Implement impact assessment downstream actions
- Fix health score model
- Add missing briefing sections
- Add sprint dashboard workload view
- **Estimated effort:** 7-10 days

### Sprint 6: QA + Jira + Story Quality
**Phase K** (QA) + **Phase F** (remaining) + Jira gaps
- Build AI test case generation task
- Build test execution UI on story detail page
- Build defect edit sheet
- Implement DRAFT-to-READY validation
- Make Jira field mapping configurable
- Add status trigger configuration
- **Estimated effort:** 7-10 days

### Sprint 7: Documents + Org Knowledge
**Phase L** (Documents) + **Phase I** (Org Knowledge)
- Build missing document templates
- Add branding admin
- Build epic-scoped generation
- Implement automated sync cron
- Build knowledge refresh function
- Wire article creation in ingestion Phase 4
- **Estimated effort:** 7-10 days

### Sprint 8: Lifecycle + Archival + Polish
**Phase M** (Lifecycle/Archival) + remaining dashboard/search items from **Phase J**
- Build phase advancement UI
- Build default epic templates by engagement type
- Implement credential deletion on archive
- Build final summary document generation
- Expand search to include Story, OrgComponent, BusinessProcess
- **Estimated effort:** 7-10 days

### Deferred to V1.1 or V2
**Phase N** items:
- Optimistic concurrency control (XL)
- Fork-and-inherit reactivation (XL)
- Full access logging (L)
- Org Health Assessment for Rescue/Takeover (XL)
- Usage and Cost standalone dashboard (M-L)
- Semantic search expansion to all entity types (L)
