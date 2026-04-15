# Phase Plan: Gap Closure

> Last Updated: 2026-04-14
> Total Phases: 12 (Phase 11 added; Addendum v1 incorporated April 13, 2026; Phase 6b split off from Phase 6 during 2026-04-14 re-dive)
> Total Gaps: 153 (22 Critical, 77 Significant, 54 Minor) + Phase 10 UI overhaul + Phase 11 AI infrastructure

---

## Dependency Graph

```
Phase 1 (RBAC/Security) ─── foundational, unblocks all
  ├── Phase 11 (AI Infrastructure Foundation) ─── cross-cutting AI substrate [NEW]
  │     └── Phase 2 (Harness Hardening + Core Pipelines) ─── pipelines + freeform agent
  │           ├── Phase 3 (Discovery/Questions) ─── uses Answer Logging Pipeline
  │           ├── Phase 4 (Work Management) ─── uses Story Generation Pipeline
  │           │     └── Phase 5 (Sprint/Developer) ─── depends on Phase 4 + Phase 6a
  │           └── Phase 6a (Org/Knowledge Five-Layer) ─── depends on Phase 11 + Phase 2
  │                 └── Phase 5 (Sprint/Developer) ─── search_org_kb needed
  │                       └── Phase 7 (Dashboards/Search) ─── depends on Phase 5 + Phase 6a
  │                             ├── Phase 8 (Docs/Notifications) ─── pipeline notifications
  │                             │     ├── Phase 9 (QA/Jira/Archival)
  │                             │     └── Phase 6b (Org Health Assessment) ─── needs Phase 8 Word gen
  └── Phase 10 (Work Tab UI Overhaul) ─── parallel with Phase 11, shared layout patterns
```

**Split note (2026-04-14 re-dive):** Phase 6 was split into Phase 6a (five-layer org KB, 33 tasks remaining after split) and Phase 6b (Org Health Assessment, 6 tasks). 6a keeps the folder `phase-06-org-knowledge`; 6b lives in `phase-06b-org-health-assessment`. 6b depends on 6a (substrate) + Phase 8 (Word gen); runs parallel with Phase 7 or Phase 9.

---

## Phase Summary

### Phase 11: AI Infrastructure Foundation *(NEW — added April 13, 2026)*

| Attribute | Details |
|-----------|---------|
| **Scope** | Build the cross-cutting AI substrate required by all pipelines and the five-layer org knowledge model. Includes: `component_edges` + per-entity embedding tables in Prisma schema (migration only, no ingestion); model router module (intent-based model resolution, centralized); hybrid retrieval primitive `search_project_kb()` (BM25 tsvector + pgvector cosine similarity + reciprocal rank fusion); embedding infrastructure (Inngest job, enqueue on entity create/update, re-embed on hash change); eval harness scaffold with 10 fixtures each for Transcript Processing and Answer Logging pipelines. Embedding provider selected (Voyage AI vs. OpenAI). |
| **Depends On** | Phase 1 |
| **Unlocks** | Phase 2 |
| **Parallel With** | Phase 10 (UI Overhaul) |
| **Complexity** | M |
| **Tasks** | 10 (scaffolded; deep-dive pending) |

**Key Deliverables:**
- Model router module: `src/lib/ai/model-router.ts`
- Hybrid retrieval primitive: `search_project_kb()` and `search_org_kb()` function signatures
- Embedding infrastructure: Inngest job, entity-level embedding tables, hash-based re-embed
- `component_edges` schema (Layer 1) and per-entity embedding tables
- Eval harness: `/evals/` directory, runner, 10 fixtures per pipeline

**Outstanding Decision:** Embedding provider (Voyage AI `voyage-3-lite` vs. OpenAI `text-embedding-3-small`). Decide at Phase 11 start based on quality test (50 labeled component-to-query pairs) and pricing. Inngest is already locked as background job runner.

---

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

### Phase 2: Harness Hardening + Core Pipelines *(scope updated — needs new deep-dive)*

| Attribute | Details |
|-----------|---------|
| **Scope** | Harden the existing agent harness (bug fixes, rate limiting, firm rules, entity tracking, context enrichment, Needs Review UX) AND implement the four deterministic pipelines from PRD Addendum §5.2 (Transcript Processing, Answer Logging, Story Generation, Briefing/Status) plus the freeform agent (PRD Addendum §5.3). All Claude calls route through the model router from Phase 11. Eval harness extended with Story Generation fixtures. |
| **Depends On** | Phase 11 |
| **Unlocks** | Phase 3, Phase 4, Phase 6 |
| **Parallel With** | Phase 10 (partially) |
| **Complexity** | XL |
| **Tasks** | 17 (populated; re-dive pending — 10 harness + 4 pipelines + freeform agent + model router + eval extension) |

**Key Deliverables:**
- Tool bug fix, output validation re-prompt loop, firm typographic rules
- Rate limiting and cost cap enforcement
- Transcript Processing Pipeline (7 stages, Haiku + Sonnet, hybrid retrieval)
- Answer Logging Pipeline (6 stages, Sonnet, org KB annotation proposals)
- Story Generation Pipeline (7 stages, Sonnet, component cross-reference)
- Briefing/Status Pipeline (5 stages, deterministic SQL + Sonnet synthesis, caching)
- Freeform agent ("project brain chat") with read + write tools, Sonnet/Opus routing
- All pipelines use centralized model router; never hardcode model names
- Eval fixtures for Story Generation pipeline

**Addendum reference:** PRD Addendum §5.1–5.4 supersedes PRD §6 in implementation. External behavior (workflows, APIs) unchanged.

---

### Phase 3: Discovery, Questions

| Attribute | Details |
|-----------|---------|
| **Scope** | Fix question ID scheme, add IMPACT_ASSESSED lifecycle state, implement gap detection and readiness assessment (core AI features), populate QuestionAffects table, fix hybrid routing, add source field, pagination, and blocking prioritization. |
| **Depends On** | Phase 2 |
| **Unlocks** | Phase 4, Phase 7 |
| **Parallel With** | Phase 6 |
| **Complexity** | XL |
| **Tasks** | 14 |

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
| **Depends On** | Phase 2, Phase 3 |
| **Unlocks** | Phase 5 |
| **Parallel With** | None |
| **Complexity** | L |
| **Tasks** | 10 |

**Key Deliverables:**
- Story quality gate (DRAFT→READY validation)
- Test case stub generation via agent harness
- Story generation with knowledge base cross-reference

---

### Phase 5: Sprint, Developer API *(dependency updated — now requires Phase 6)*

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement capacity assessment, Context Package Assembly as a deterministic pipeline (not agent loop) per PRD Addendum §4.6, add parent epic/feature context and full article content to context packages, build component report endpoint, add mid-sprint re-analysis triggers, developer workload attribution, API key expiry/rotation, brownfield scratch org warning. Sprint health briefing via Briefing/Status Pipeline. |
| **Depends On** | Phase 4, **Phase 6** (search_org_kb required for Context Package Assembly org component resolution) |
| **Unlocks** | Phase 7 |
| **Parallel With** | None |
| **Complexity** | L |
| **Tasks** | 14 |

**Key Deliverables:**
- Context Package Assembly: deterministic pipeline, <3s p95 latency, single Sonnet call at end
- Sprint health briefing via Briefing/Status Pipeline (`briefing_type = sprint_health`)
- Capacity assessment
- Component report endpoint
- API key lifecycle management

**Addendum reference:** PRD Addendum §4.6 fully specifies Context Package Assembly (9 steps). `search_org_kb()` from Phase 6 Layer 5 is called in step 5.

---

### Phase 6a: Org, Knowledge — Five-Layer Model *(re-dive complete 2026-04-14)*

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement the five-layer org knowledge model from PRD Addendum §4. Layer 1: `component_edges` during sync, sync reconciliation with rename detection and ID-reuse heuristic. Layer 2: component embeddings on sync (re-embed on hash change). Layer 3: `domains` + `domain_memberships`, brownfield domain proposal via Claude Managed Agents with circuit breaker + deterministic fallback. Layer 4: polymorphic `annotations` + `annotation_embeddings`. Layer 5: `search_org_kb()` (BM25 + pgvector RRF) + `traverse_component_graph` recursive CTE with cycle detection. Preserved: PKCE OAuth, sync cron, KnowledgeArticle confirmation model, planned component creation. Knowledge refresh + articulation pipeline. NLP org query rewrite. Biweekly domain review cron CUT from V1. |
| **Depends On** | Phase 11, Phase 2 |
| **Unlocks** | Phase 5, Phase 7, Phase 6b |
| **Parallel With** | Phase 3 (partially) |
| **Complexity** | XL |
| **Tasks** | 33 (was 34; biweekly Task 12c cut; Org Health Tasks 21–23 moved to Phase 6b) |

**Key Deliverables:**
- Layer 1: `component_edges` population, sync reconciliation algorithm, rename tracking with ID-reuse heuristic, Apex Tooling API parser
- Layer 2: component embeddings on sync, HNSW index, hash-based re-embed, cycle-bound dual-write migration
- Layer 3: domain + domain_membership CRUD, brownfield domain proposal (Managed Agents) with 20-min timeout + $15 cost ceiling + "Unclassified" fallback
- Layer 4: polymorphic annotations + annotation embeddings, Answer Logging Pipeline integration
- Layer 5: `search_org_kb()` + `traverse_component_graph` with cycle detection
- KnowledgeArticle creation, confirmation model, refresh pipeline
- NLP org query rewired through `search_org_kb`

**Addendum reference:** PRD Addendum §4 supersedes PRD §13.4 in substance. §13.3 (sync semantics) and §13.6 (brownfield ingestion) preserved. Biweekly review §4.4-07 narrowly superseded for V1.

---

### Phase 6b: Org Health Assessment *(new — split from Phase 6 during 2026-04-14 re-dive)*

| Attribute | Details |
|-----------|---------|
| **Scope** | Long-running diagnostic for rescue/takeover engagements. Six deterministic analyzers (test coverage, governor-limit risk, sharing model, FLS compliance, hardcoded IDs, unresolved references). Managed Agent synthesis (Opus 4.6, `reason_deeply`). Word document output via Phase 8. Snapshot-at-kickoff isolation. Trigger UI + cost ceiling ($25 default + architect override). Tech-debt analyzer CUT during re-dive. |
| **Depends On** | Phase 6a (substrate: `component_edges`, `unresolved_references` MV, reconciliation), Phase 8 (Word doc pipeline), Phase 9 (`assertProjectWritable`) |
| **Unlocks** | None |
| **Parallel With** | Phase 7 or Phase 9 (after Phase 8 lands) |
| **Complexity** | M |
| **Tasks** | 6 |

**Key Deliverables:**
- Six deterministic analyzers
- Snapshot-isolation mechanism
- Managed Agent synthesis
- Word document output (Phase 8 pipeline)
- Trigger + cost ceiling + progress UI
- Cost tracking in `pipeline_runs`

---

### Phase 7: Dashboards, Search

| Attribute | Details |
|-----------|---------|
| **Scope** | Rework health score model, complete briefing with all PRD sections, add sprint dashboard workload view and conflict alerts, complete PM dashboard (risk register, deadlines, client items), build Usage & Costs settings tab, expand search to Story/OrgComponent/BusinessProcess, verify discovery dashboard auto-refresh. Also receives deferred gaps from Phase 1 (RBAC-010, RBAC-014, RBAC-016). |
| **Depends On** | Phase 3, Phase 4, Phase 5, Phase 6 |
| **Unlocks** | None |
| **Parallel With** | Phase 9 |
| **Complexity** | XL |
| **Tasks** | 16 |

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
| **Depends On** | Phase 1, Phase 2, Phase 7 |
| **Unlocks** | Phase 9 |
| **Parallel With** | Phase 2 (partially) |
| **Complexity** | L |
| **Tasks** | 10 |

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
| **Depends On** | Phase 1, Phase 4, Phase 8 |
| **Unlocks** | None |
| **Parallel With** | Phase 7 |
| **Complexity** | XL |
| **Tasks** | 11 |

**Key Deliverables:**
- AI test case generation
- Test execution UI
- Configurable Jira sync
- Complete project archive flow
- Phase advancement and lifecycle management

---

### Phase 10: Work Tab UI Overhaul

| Attribute | Details |
|-----------|---------|
| **Scope** | Build shared page-level component library (PageHeader, DetailPageLayout, FilterBar, StatusBadge, ProgressBar, EditableField, MetadataSidebar, StatCard, enhanced EmptyState). Overhaul Work overview page with filter bar, search, "All Stories" flat view, and view tabs. Redesign Epic detail as two-column layout with metadata sidebar, progress bar, rollup stats, and inline editing. Redesign Feature detail with same pattern. Redesign Story detail with two-column layout, inline-editable fields, metadata sidebar, and activity/comments section. Enhance kanban boards with swimlanes, richer cards, column counts, and quick actions. |
| **Depends On** | Phase 1 |
| **Unlocks** | All subsequent phases benefit from shared layout patterns |
| **Parallel With** | Should run before Phases 2-9 so new features get built into correct patterns |
| **Complexity** | XL |
| **Tasks** | 12 |

**Key Deliverables:**
- Shared component library: PageHeader, DetailPageLayout, FilterBar, StatusBadge, ProgressBar, EditableField, MetadataSidebar, StatCard
- Centralized status color mapping (eliminates 4 duplicate inline definitions)
- Work overview with filter/search/sort and "All Stories" flat view
- Epic detail: two-column layout with metadata sidebar, progress bar, feature stats
- Feature detail: two-column layout with metadata sidebar, story stats
- Story detail: two-column layout with inline editing, metadata sidebar, activity section
- Kanban enhancements: swimlanes, richer cards, column counts, quick actions

**Design Inspiration:** Jira (two-column detail layout, swimlanes, quick filters), Linear (clean density, keyboard shortcuts, minimal cards), Asana (view tabs, progress visualization)

---

## Execution Order Summary *(updated April 13, 2026 — addendum incorporated)*

1. **Phase 1:** RBAC/Security — DONE
2. **Phase 11:** AI Infrastructure Foundation — second; model router, hybrid retrieval, eval harness, schema
3. **Phase 10:** Work Tab UI Overhaul — parallel with Phase 11 (no AI dependencies)
4. **Phase 2:** Harness Hardening + Core Pipelines — after Phase 11
5. **Phase 3:** Discovery/Questions + **Phase 4:** Work Management — parallel (both after Phase 2)
6. **Phase 6a:** Org/Knowledge Five-Layer Model — after Phase 11 + Phase 2
7. **Phase 5:** Sprint/Developer API — after Phase 4 AND Phase 6a (needs search_org_kb)
8. **Phase 7:** Dashboards/Search — after Phase 5 + Phase 6a
9. **Phase 8:** Documents/Notifications — after Phase 7
10. **Phase 9:** QA/Jira/Archival — after Phase 8
11. **Phase 6b:** Org Health Assessment — parallel with Phase 9 (after Phase 6a + Phase 8 + Phase 9 `assertProjectWritable`)

---

## Risk Notes

- **Phase 11 (AI Foundation):** Embedding provider decision is a gate. Run quality test before deep-dive. Hybrid retrieval tuning (RRF k constant, HNSW parameters) requires labeled test pairs — plan for at least 50 component-to-query pairs.
- **Phase 2 (Pipelines):** XL complexity now that pipelines are added. Four pipeline implementations + freeform agent is significant scope. Consider splitting into Phase 2a (harness hardening) and Phase 2b (pipelines) during deep-dive if needed.
- **Phase 6a (Five-Layer Model):** Most architecturally complex phase. Claude Managed Agents integration (brownfield domain proposal) is new territory. Re-dive 2026-04-14 added circuit breaker (20-min timeout, $15 cost ceiling, deterministic fallback) to de-risk first run. Tooling-API-based Apex parsing avoids regex edge cases.
- **Phase 6b (Org Health Assessment):** Split out 2026-04-14. Depends on Phase 6a + Phase 8. Tech-debt analyzer cut; snapshot isolation added to stabilize findings across sync runs. No downstream consumers so scheduling is flexible.
- **Phase 5 (Sprint/Dev API):** Now depends on Phase 6a for `search_org_kb`. This moves Phase 5 later in the sequence than originally planned. Context Package Assembly latency target (<3s p95) requires attention to query optimization. Must pass `edge_types: ['lookup','master_detail','references']` and `depth ≤ 2` to `expand_neighbors` (Phase 6a contract).
- **Phase 3 (Discovery):** Gap detection and readiness assessment are XL AI features. These are the PRD's headline capabilities and have the highest implementation uncertainty.
- **Phase 7 (Dashboards):** Largest phase by gap count (26+3). May need splitting during deep-dive.
- **Phase 9 (QA/Jira/Archival):** Covers 4 distinct subsystems. May benefit from splitting during deep-dive.
- **Phase 10 (Work Tab UI):** XL complexity. Builds shared component library that all other phases benefit from. Running it in parallel with Phase 11 (both after Phase 1) front-loads UI patterns.
- **Deferred to V2:** OCC conflict UI (GAP-RBAC-011 full), fork-and-inherit reactivation (GAP-ARCH-004). Org Health Assessment is back in V1 scope (Phase 6, Managed Agents).
- **Note on Phase 7 deferred gaps:** GAP-RBAC-010 (Usage & Costs dashboard), GAP-RBAC-014 (audit logging schema + basic implementation), and GAP-RBAC-016 (cost caps) are deferred FROM Phase 1 TO Phase 7. They are V1 scope, not V2. Full comprehensive access logging (all reads) may extend into V2.
