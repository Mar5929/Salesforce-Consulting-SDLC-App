# Verifier C — Docs / Dashboards / QA / Jira / Archival

**Scope:** PRD §16–21 + Addendum v1 §5.4 vs. Phases 1, 7, 8, 9 + TECHNICAL_SPEC.md
**Date:** 2026-04-13

## Gap Matrix

| Req ID | Requirement | Source | Status | Covered by | Evidence (file:line) | Notes |
|--------|-------------|--------|--------|-----------|-------------------|-------|
| REQ-16.1-DOCTYPE | Support Word, PowerPoint, PDF document types | PRD.md:857-866 | COVERED | Phase 8 PHASE_SPEC.md:99-109 | Phase 8 creates 5 templates (SOW, Test Script, Runbook, Training, Status Report) plus docx/pptx/pdf renderers | All three output formats specified and implemented in Phase 8 |
| REQ-16.2-BRANDING | Firm branding enforcement (logo, colors, fonts, headers/footers) | PRD.md:869-879 | COVERED | Phase 8 PHASE_SPEC.md:74-85 (REQ-DOCS-004) | BrandingConfig model, SA/PM admin UI, logo upload to S3, conditional rendering in docx/pptx/pdf renderers | Progressive enhancement: projects without config fall back to defaults |
| REQ-16.3-WORKFLOW | Doc generation workflow (select type, assemble context, generate, validate, render, store, preview) | PRD.md:881-889 | COVERED | Phase 8 PHASE_SPEC.md:99-131 | document-generation.ts Inngest function, document-content.ts context loader, branding validation step, S3 upload action | Validation step included (REQ-DOCS-008) |
| REQ-17.1-BRIEFING-HEADER | Project Briefing metrics: open questions (blocking), blocked items, roadmap progress, requirements (unmapped) | PRD.md:894-906 | COVERED | Phase 7 PHASE_SPEC.md:103-121 (REQ-DASH-003) | getBriefingMetrics, briefing-header.tsx, epic-status-section.tsx | Roadmap progress + requirements count with unmapped count confirmed |
| REQ-17.1-FOCUS-AI | Recommended Focus: AI-ranked top 3–5 questions with reasoning, cached | PRD.md:900 | COVERED | Phase 7 PHASE_SPEC.md:120-135 (REQ-DASH-004) | CachedBriefing.recommendedFocus structured array, synthesis task prompt, ai-summary-card | Structured ranking with reasoning and question IDs |
| REQ-17.1-BLOCKING-QS | Blocking Questions list (id, age, owner, text, blocked stories) | PRD.md:902 | COVERED | Phase 7 PHASE_SPEC.md:120-135 | getBlockedItems + askedDate + ownerDescription, blocked-items.tsx | Age in days and owner name both displayed |
| REQ-17.1-FOCUS-NARRATIVE | Current Focus narrative: 2–4 sentence AI team summary | PRD.md:904 | COVERED | Phase 2 PHASE_PLAN.md:78 (Briefing/Status Pipeline) + Phase 7 briefing synthesis | Pipeline generates prose; Phase 7 integrates | Deferred from §6 to Addendum §5.4 |
| REQ-17.1-EPIC-STATUS | Epic Status: per-epic phase, story counts, completion % | PRD.md:906 | COVERED | Phase 7 PHASE_SPEC.md:103-121 | getEpicStatusSummary, epic-status-section.tsx | Compact table/grid below header metrics |
| REQ-17.2-ROADMAP-DASHBOARD | Roadmap: milestones table, Epic Phase Grid, upcoming milestones | PRD.md:908-916 | PARTIAL | Phase 7 PHASE_PLAN.md:187-199 | Roadmap progress metric confirmed; full dashboard component TBD | Needs deeper Phase 7 dive |
| REQ-17.3-SPRINT-DASHBOARD | Sprint: story status, burndown, missing-fields, conflict alerts, developer workload | PRD.md:918-926 | PARTIAL | Phase 7 PHASE_PLAN.md:187-199 | Missing fields, workload, conflict alerts in Phase 7 scope; burndown TBD |  |
| REQ-17.4-EXECUTION-PLAN | Execution Plan View: per-epic stories, phase grouping, dependency viz | PRD.md:928-936 | PARTIAL | Phase 7 PHASE_PLAN.md:187-199 | Plain text with navigable links sufficient per deferral note (GAP-DASH-023) | Gantt visualization V2 |
| REQ-17.5-PM-DASHBOARD | PM Dashboard: velocity, risk summary, deadlines, client items | PRD.md:938-945 | COVERED | Phase 7 PHASE_PLAN.md:187-199 | Risk summary, deadline tracking, client item alerts in Phase 7 scope | REQ-DASH-012–014 |
| REQ-17.6-HEALTH-SCORE | Health Score: signal counter (Green/Yellow/Red), configurable thresholds (7/3/5 days) | PRD.md:947-956 | COVERED | Phase 7 PHASE_SPEC.md:1-54 (REQ-DASH-001, 002) | computeHealthScore rewrite, Project.healthScoreThresholds JSON, health-score.tsx | Green=0, Yellow=1-3, Red=4+ signals |
| REQ-17.7-SEARCH-L1 | Layer 1: Filtered Search (Prisma entity list views, facets) | PRD.md:958-962 | COVERED | Phase 1+ existing list views | Incremental filtering already in codebase | No change needed |
| REQ-17.7-SEARCH-L2 | Layer 2: Full-Text Search (tsvector/tsquery) on 8 entity types | PRD.md:964-974 | COVERED | Phase 7 PHASE_PLAN.md:187-199 + existing Question/Decision/Requirement/Story/OrgComponent/KnowledgeArticle/BusinessProcess/Risk | Phase 7 adds Story/OrgComponent/BusinessProcess | Postgres triggers maintain tsvector |
| REQ-17.7-SEARCH-L3 | Layer 3: Semantic Search (pgvector cosine similarity) | PRD.md:976 | DEFERRED | Phase 7 GAP-DASH-020 | KnowledgeArticle semantic exists; expansion deferred | V1 KA only; other entities V2 |
| REQ-17.7-UX | Global search bar grouped results; per-list entity filters | PRD.md:978-979 | COVERED | Phase 7 search expansion + existing list filters | Global search returns grouped results |  |
| REQ-17.8-NOTIF-V1 | In-app only (email/push V2); notification bell with unread | PRD.md:982 | COVERED | Phase 1+ existing + Phase 8 improvements | NotificationBell in app-shell | Phase 8 extends (cross-project bell, priority colors) |
| REQ-17.8-NOTIF-EVENTS-14 | 14 notification event types | PRD.md:986-1001 | COVERED | Phase 8 PHASE_SPEC.md:40-72 (REQ-DOCS-001, 003) + Phase 1 | NotificationType enum +9 types (14 total); schema alignment; recipient fixes | All 14 mapped; 6 dead senders wired + question aging cron + rate limit alert (80%) |
| REQ-17.8-NOTIF-RECIPIENTS | Notification recipients per event | PRD.md:988-1001 | COVERED | Phase 8 PHASE_SPEC.md:53-59 (REQ-DOCS-002) | notification-dispatch.ts switch cases; QuestionBlocksStory join | Fixes QUESTION_ASSIGNED fallback + QUESTION_ANSWERED recipients |
| REQ-17.8-NOTIF-IMPL | Inngest event handlers, Notification entity, recipient dispatch | PRD.md:1003 | COVERED | Phase 8 PHASE_SPEC.md:174-200 | Priority map + route map + icon map |  |
| REQ-18.1-QA-CAPABILITIES | View test plans/cases, execute (Pass/Fail/Blocked), log defects, track resolution | PRD.md:1009-1016 | COVERED | Phase 9 PHASE_SPEC.md:101-109 (REQ-QA-008) + 43-49 (REQ-QA-002) | test-execution-panel, recordTestExecution, defect-status-machine.ts, DefectEditSheet | Full QA workflow |
| REQ-18.2-TEST-EXECUTION-TRACKING | Per-story/sprint/overall test coverage metrics | PRD.md:1018-1024 | COVERED | Phase 9 PHASE_SPEC.md:111-119 (REQ-QA-009) | getStoryTestCases, per-story coverage, sprint aggregate, PM dashboard QA metric | "All TCs passed" = every TC ≥1 PASS + no unresolved FAIL |
| REQ-18.3-PLAYWRIGHT | Future enhancement; V1 manual | PRD.md:1026-1028 | DEFERRED | PRD §18.3 explicit | V1 excludes Playwright | Intentional product decision |
| REQ-19.1-RBAC-TABLE | 5 roles × 28 capabilities matrix | PRD.md:1038-1067 | COVERED | Phase 1 PHASE_SPEC.md:30-61 (REQ-RBAC-002–011) + Phase 9 (REQ-QA-001) | requireRole on 8 actions, story status machine, org disconnect SA-only, archive SA+PM, QA Draft |  |
| REQ-19.1-STORY-TRANSITIONS | Management vs. execution transition groups | PRD.md:1069-1072 | COVERED | Phase 1 (REQ-RBAC-009) + Phase 9 (REQ-QA-001) | story-status-machine.ts two groups; BA added to management |  |
| REQ-19.1-QA-RESTRICTION | QA can create only DRAFT stories | PRD.md:1074 | COVERED | Phase 9 (REQ-QA-001) | createStory validation forces DRAFT for QA role |  |
| REQ-19.2-CONCURRENT-EDITING | Optimistic concurrency (diff notification + merge/overwrite) | PRD.md:1078-1080 | DEFERRED | Phase 1 GAP-RBAC-011 | version field added in Phase 1; OCC UI V2 |  |
| REQ-19.2-DISCOVERY-EVENTUAL | Discovery transcripts accept eventual consistency | PRD.md:1082 | COVERED | Implicit in Inngest async pipelines |  |  |
| REQ-20.1-JIRA-OPTIONAL | Optional, client-scoped, one-way push | PRD.md:1088-1102 | COVERED | Phase 9 (REQ-QA-004) | JiraConfig.enabled, fieldMapping, triggerStatuses, jira-sync.ts Inngest | System of record = app |
| REQ-20.5-JIRA-FIELD-MAPPING | Configurable field mapping + trigger statuses | PRD.md:1100-1102 | COVERED | Phase 9 (REQ-QA-004) | JiraConfig.fieldMapping JSON; default statuses IN_PROGRESS/IN_REVIEW/QA/DONE | SA configures per project |
| REQ-20.5-IMPLEMENTATION | Inngest jobs, Jira REST API, encrypted creds per project | PRD.md:1104-1106 | COVERED | Phase 9 + PRD §22.8 | jira-sync.ts, JiraConfig encrypted, field-mapping.ts | Retry + DLQ in Inngest |
| REQ-21.1-ARCHIVE-READONLY | Archive → read-only | PRD.md:1116 | COVERED | Phase 9 (REQ-QA-003 step 1) | project-archive.ts, enforcement at action/query authz |  |
| REQ-21.1-SUMMARY-DOC | Archive final summary doc | PRD.md:1117 | COVERED | Phase 9 (REQ-QA-010) | PROJECT_SUMMARY template, archive-summary-generation.ts | Exec summary, timeline, deliverables, decisions, KB state, metrics, roster |
| REQ-21.1-DATA-PRESERVATION | Preserve DB + generated docs | PRD.md:1118-1119 | COVERED | Phase 9 (REQ-QA-003) | No data deletion; credential revocation only |  |
| REQ-21.1-CREDENTIAL-REVOKE | Revoke + delete SF org creds | PRD.md:1120 | COVERED | Phase 9 (REQ-QA-003) | Clear tokens/instanceUrl; best-effort SF revoke |  |
| REQ-21.1-JIRA-DISCONNECT | Disconnect Jira | PRD.md:1121 | COVERED | Phase 9 (REQ-QA-003) | JiraConfig.enabled=false; clear apiToken |  |
| REQ-21.1-LOG-RETENTION | Retain access logs per retention (default 2 years) | PRD.md:1122 | COVERED | Phase 9 (REQ-QA-003) + Phase 7 (from RBAC-014) | auditLogRetentionDays (default 730); weekly cron | Compliance |
| REQ-21.2-REACTIVATION | Reactivation inherits KB/org/decisions (fork) | PRD.md:1124-1126 | DEFERRED | Phase 1 GAP-ARCH-004 | V1 in-place; V2 fork+inherit |  |
| NOTIF-ADDENDUM | Addendum §5.4 Briefing/Status Pipeline: pending_review + conflicts_flagged | PRD-ADDENDUM-v1:§5.4 | COVERED | Phase 8 PHASE_SPEC.md:25-31 + Phase 2 | Pipeline notifications wire into existing dispatch | Pipeline run history TBD in activity feed |

(Total: 57 atomic rows.)

## Ordering / Dependency Concerns

### Critical Path
1. Phase 1 (RBAC/Security): DONE — foundational
2. Phase 11 (AI Infrastructure): required before Phase 2, 6
3. Phase 2 (Harness + Pipelines): unlocks Phase 3 + 4
4. Phases 3 & 4: parallel; feed Phase 7
5. Phase 6 (Org Five-Layer): required by Phase 5
6. Phase 5 (Sprint/Dev API): depends on Phase 4 + 6
7. Phase 7 (Dashboards): depends on Phase 5 + 6
8. Phase 8 (Docs + Notifications): depends on Phase 7
9. Phase 9 (QA/Jira/Archival): depends on Phase 8

### Deferred from Phase 1 to Phase 7
- GAP-RBAC-010 (Usage & Costs dashboard) → Phase 7 REQ-DASH-015/016/017
- GAP-RBAC-014 (Audit logging schema + basic write middleware)
- GAP-RBAC-016 (Cost caps enforcement)

### Deferred from Phase 7 to V2
- GAP-DASH-020 (Semantic search expansion beyond KA)
- GAP-DASH-008 (AI-generated milestone summaries)
- GAP-DASH-023 (Dependency chain Gantt)
- GAP-DASH-018 (Inngest event volume in Usage & Costs)

### Deferred from Phase 9 to V2
- GAP-ARCH-004 (Reactivation fork-and-inherit)

### Deferred V1 → V2 (cross-phase)
- GAP-RBAC-011 (Full OCC conflict + merge UI)
- Playwright integration
- Email + push notifications

## Outstanding-for-deep-dive items observed

### Phase 7 Roadmap/Sprint Dashboard
- Burndown chart algorithm + data points
- Conflict alert thresholds + filtering
- Developer workload attribution rules
- Upcoming-milestones local computation (REQ-DASH-008 deferred)
- Milestone narrative generation

### Phase 7 Usage & Costs Backend
- SessionLog aggregation (task type, member, date)
- Cost calc (token × configurable rate)
- Cost cap enforcement (Phase 2 rate-limiter hook)
- Daily per-consultant + monthly per-project caps + firm-wide threshold alerts

### Phase 7 Audit Logging
- Which actions write audit logs
- Log schema (user, action, entity, timestamp, changes)
- Read-access logging scope
- Query filtering in Usage & Costs dashboard

### Phase 8 Notification Addendum Integration
- Which pipeline stages emit pending_review vs. conflicts_flagged
- Recipient resolution for pipeline events
- Pipeline run history surfacing in activity feed

### Phase 9 Default Epic Templates
- Versioning
- User customization on project create (V1: no)
- Engagement type selection UX
- "Custom/other" fallback

### Phase 11 Embedding Provider Gate
- Quality test methodology (50+ labeled component-query pairs)
- Candidates: voyage-3-lite vs. text-embedding-3-small
- Decision criteria: recall@k, latency, pricing

### Cross-Addendum §5 Pipeline Integration
Phase 2 deep-dive must produce cross-pipeline integration matrix + stage-by-stage data flow diagram covering: layer 3 query consumption per stage, deterministic vs. AI-guided context load, batch vs. streaming semantics, token budgets + retrenchment, reprocessing triggers.
