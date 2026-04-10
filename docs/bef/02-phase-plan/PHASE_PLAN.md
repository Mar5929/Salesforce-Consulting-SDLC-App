# Phase Plan: Gap Closure

> Last Updated: 2026-04-09
> Total Phases: 9
> Total Gaps: 153 (22 Critical, 77 Significant, 54 Minor)
> Reference: [GAP-ANALYSIS-INDEX.md](./GAP-ANALYSIS-INDEX.md)

---

## Dependency Graph

```
Phase 1 (RBAC/Security) ─── foundational, unblocks all
  ├── Phase 2 (Agent Harness) ─── core AI infrastructure
  │     ├── Phase 3 (Discovery/Questions) ─── core value prop
  │     │     └── Phase 7 (Dashboards/Search) ─── integration layer
  │     └── Phase 6 (Org/Knowledge) ─── knowledge infrastructure
  ├── Phase 4 (Work Management) ─── depends on Phase 1 + 3
  │     └── Phase 5 (Sprint/Developer) ─── depends on Phase 4
  │           └── Phase 7 (Dashboards/Search)
  ├── Phase 8 (Docs/Notifications) ─── event wiring
  │     └── Phase 9 (QA/Jira/Archival) ─── depends on Phase 1 + 8
  └── Phase 7 (Dashboards/Search) ─── last, depends on many upstream
```

---

## Phase Summary

### Phase 1: RBAC, Security, Governance

| Attribute | Details |
|-----------|---------|
| **Scope** | Fix the foundational auth bypass (`getCurrentMember` missing `status: "ACTIVE"`), add `requireRole` gates to 8 action files, fix wrong role allowlists, add prompt injection defense, create token field stripping utility, add `version` fields for future OCC. |
| **Depends On** | None |
| **Unlocks** | All other phases |
| **Parallel With** | None — must complete first |
| **Complexity** | M |
| **Tasks** | 14 |

**Key Deliverables:**
- Removed members blocked from all server actions
- Role gates on epics, features, sprints, milestones, settings page
- Story status machine fixed (BA management, SA both groups)
- Prompt injection defense in transcript processing
- Centralized token field stripping

---

### Phase 2: Agent Harness, Transcripts

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement missing agent tasks (STATUS_REPORT_GENERATION, CONTEXT_PACKAGE_ASSEMBLY), fix output validation re-prompt loop, add firm typographic rules, wire SessionLog entity tracking, implement rate limiting and cost caps, add chat history window, build "Needs Review" session-end UX, enrich transcript context with recent sessions and article summaries. |
| **Depends On** | Phase 1 |
| **Unlocks** | Phase 3, Phase 6 |
| **Parallel With** | Phase 8 (partially) |
| **Complexity** | L |
| **Tasks** | 10 (3 gaps moved out: GAP-001→Phase 8, GAP-002→Phase 5, GAP-005→Phase 1 dup) |

**Key Deliverables:**
- Two new agent task implementations
- Output validation re-prompt loop
- Firm typographic rules module
- Rate limiting and cost cap enforcement
- Chat history window

---

### Phase 3: Discovery, Questions

| Attribute | Details |
|-----------|---------|
| **Scope** | Fix question ID scheme, add IMPACT_ASSESSED lifecycle state, implement gap detection and readiness assessment (core AI features), populate QuestionAffects table, fix hybrid routing, add source field, pagination, and blocking prioritization. |
| **Depends On** | Phase 2 |
| **Unlocks** | Phase 4, Phase 7 |
| **Parallel With** | Phase 6 |
| **Complexity** | XL |
| **Tasks** | TBD (14 gaps, includes 2 Critical AI features) |

**Key Deliverables:**
- Gap detection analysis (AI-driven)
- Readiness assessment (AI-driven)
- Complete question lifecycle with IMPACT_ASSESSED state
- Discovery dashboard with all 7 PRD sections

---

### Phase 4: Work Management

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement DRAFT-to-READY mandatory field validation, AI test case stub generation, linked OrgComponent mode in story form, auto-initialize EpicPhase records, fix enrichment dedup, add Salesforce guardrails to AI prompts, cross-reference knowledge base in story generation. |
| **Depends On** | Phase 1, Phase 3 |
| **Unlocks** | Phase 5 |
| **Parallel With** | None |
| **Complexity** | L |
| **Tasks** | TBD (11 gaps, includes 2 Critical) |

**Key Deliverables:**
- Story quality gate (DRAFT→READY validation)
- Test case stub generation via agent harness
- Story generation with knowledge base cross-reference

---

### Phase 5: Sprint, Developer API

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement capacity assessment, build context package assembly task, add parent epic/feature context and full article content to context packages, build component report endpoint, add mid-sprint re-analysis triggers, developer workload attribution, API key expiry/rotation, brownfield scratch org warning. |
| **Depends On** | Phase 4 |
| **Unlocks** | Phase 7 |
| **Parallel With** | None |
| **Complexity** | L |
| **Tasks** | TBD (14 gaps) |

**Key Deliverables:**
- Complete context package for Claude Code
- Capacity assessment
- Component report endpoint
- API key lifecycle management

---

### Phase 6: Org, Knowledge

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement automated incremental sync cron, full knowledge refresh function, create KnowledgeArticle records in ingestion Phase 4, add BusinessContextAnnotation write surface and context package inclusion, build confirmation model, implement NLP org query, two-pass retrieval with embeddings. |
| **Depends On** | Phase 2 |
| **Unlocks** | Phase 7 |
| **Parallel With** | Phase 3 |
| **Complexity** | XL |
| **Tasks** | TBD (16 gaps, includes 3 Critical) |

**Key Deliverables:**
- Automated sync scheduling
- Knowledge article creation and refresh
- Business context annotation surface
- NLP org query API

---

### Phase 7: Dashboards, Search

| Attribute | Details |
|-----------|---------|
| **Scope** | Rework health score model, complete briefing with all PRD sections, add sprint dashboard workload view and conflict alerts, complete PM dashboard (risk register, deadlines, client items), build Usage & Costs settings tab, expand search to Story/OrgComponent/BusinessProcess, verify discovery dashboard auto-refresh. Also receives deferred gaps from Phase 1 (RBAC-010, RBAC-014, RBAC-016). |
| **Depends On** | Phase 3, Phase 4, Phase 5, Phase 6 |
| **Unlocks** | None |
| **Parallel With** | Phase 9 |
| **Complexity** | XL |
| **Tasks** | TBD (26 gaps + 3 deferred from Phase 1) |

**Key Deliverables:**
- Correct health score model
- Complete briefing header and sections
- PM dashboard completion
- Usage & Costs settings tab (SA/PM only)
- Search entity expansion

---

### Phase 8: Documents, Notifications

| Attribute | Details |
|-----------|---------|
| **Scope** | Add missing document types (SOW, SDD, Training, Runbook), implement branding admin, fix epic-scoped generation, add document versioning model, wire all dead notification event senders, fix recipient resolution, fix proxy notification types. |
| **Depends On** | Phase 1 |
| **Unlocks** | Phase 9 |
| **Parallel With** | Phase 2 (partially) |
| **Complexity** | L |
| **Tasks** | TBD (21 gaps, includes 2 Critical) |

**Key Deliverables:**
- 4 new document templates
- Branding admin configuration
- Document versioning
- All 14 notification event types working

---

### Phase 9: QA, Jira, Archival, Lifecycle

| Attribute | Details |
|-----------|---------|
| **Scope** | Build AI test case generation from acceptance criteria, test execution UI on story detail page, defect edit sheet, test coverage metric, configurable Jira field mapping, implement credential deletion on archive, Jira disconnect on archive, final project summary document, phase advancement, default epic templates. |
| **Depends On** | Phase 1, Phase 8 |
| **Unlocks** | None |
| **Parallel With** | Phase 7 |
| **Complexity** | XL |
| **Tasks** | TBD (22 gaps, includes 4 Critical) |

**Key Deliverables:**
- AI test case generation
- Test execution UI
- Configurable Jira sync
- Complete project archive flow
- Phase advancement and lifecycle management

---

## Execution Order Summary

1. **Phase 1:** RBAC/Security — must complete first
2. **Phase 2:** Agent Harness + **Phase 8:** Docs/Notifications — can run in parallel
3. **Phase 3:** Discovery + **Phase 6:** Org/Knowledge — can run in parallel (both depend on Phase 2)
4. **Phase 4:** Work Management — after Phase 3
5. **Phase 5:** Sprint/Developer — after Phase 4
6. **Phase 7:** Dashboards/Search + **Phase 9:** QA/Jira/Archival — can run in parallel (final wave)

---

## Risk Notes

- **Phase 3 (Discovery):** Gap detection and readiness assessment are XL AI features. These are the PRD's headline capabilities and have the highest implementation uncertainty.
- **Phase 7 (Dashboards):** Largest phase by gap count (26+3). May need splitting during deep-dive.
- **Phase 9 (QA/Jira/Archival):** Covers 4 distinct subsystems. May benefit from splitting during deep-dive.
- **Deferred to V2:** OCC conflict UI (GAP-RBAC-011 full), fork-and-inherit reactivation (GAP-ARCH-004), org health assessment (GAP-ORG-009).
- **Note on Phase 7 deferred gaps:** GAP-RBAC-010 (Usage & Costs dashboard), GAP-RBAC-014 (audit logging schema + basic implementation), and GAP-RBAC-016 (cost caps) are deferred FROM Phase 1 TO Phase 7. They are V1 scope, not V2. Full comprehensive access logging (all reads) may extend into V2.
