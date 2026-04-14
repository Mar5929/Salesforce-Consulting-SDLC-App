# Cross-Phase Audit Consolidation

**Date:** 2026-04-13
**Scope:** Phases 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 (Phase 1 previously signed off; excluded)
**Inputs:** 10 per-phase audits + `REQUIREMENT_INDEX.md` (2026-04-13)

---

## 1. Executive summary

- **Phases audited:** 10 (Phases 2-11, excluding 1).
- **Verdict breakdown:** 0 Ready; 4 Ready-after-fixes (3, 6, 10, 11); 6 Not-ready (2, 4, 5, 7, 8, 9).
- **Gap totals across all phases:** **137 gaps** — **25 Blocker**, **82 Major**, **30 Minor**.
- **Bottom line:** The phase plan is NOT close to developer-ready. Nine of ten phases have Blocker-class contradictions with the locked Addendum or with TECHNICAL_SPEC, and four cross-phase contradictions cannot be resolved without an authoritative user decision. Substantial amendment is required before any phase executes. Phase 11 (foundational) and Phase 2 (pipelines) must be fixed first; downstream phases cannot proceed until upstream contracts stabilize.

---

## 2. Phase readiness matrix

| Phase | Name | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | Verdict | Blocker | Major | Minor |
|-------|------|----|----|----|----|----|----|----|----|---------|---------|-------|-------|
| 2  | Harness + Core Pipelines       | Partial | Fail    | Partial | Partial | Partial | Partial | Partial | Pass    | Not-ready           | 4 | 10 | 4 |
| 3  | Discovery, Questions            | Partial | Fail    | Partial | Partial | Partial | Partial | Partial | Pass    | Ready-after-fixes   | 2 | 11 | 2 |
| 4  | Work Management                 | Partial | Fail    | Fail    | Partial | Partial | Partial | Partial | Fail    | Not-ready           | 2 | 8  | 3 |
| 5  | Sprint, Developer API           | Partial | Fail    | Fail    | Partial | Partial | Partial | Partial | Fail    | Not-ready           | 4 | 7  | 1 |
| 6  | Five-Layer Org KB               | Partial | Partial | Fail    | Partial | Partial | Partial | Pass    | Fail    | Ready-after-fixes   | 3 | 12 | 5 |
| 7  | Dashboards, Search              | Partial | Fail    | Fail    | Partial | Partial | Partial | Partial | Fail    | Not-ready           | 2 | 5  | 3 |
| 8  | Documents, Notifications        | Partial | Partial | Fail    | Partial | Partial | Partial | Partial | Partial | Not-ready           | 2 | 8  | 2 |
| 9  | QA, Jira, Archival              | Partial | Fail    | Fail    | Partial | Partial | Partial | Partial | Pass    | Not-ready           | 2 | 8  | 3 |
| 10 | Work Tab UI Overhaul            | Fail    | Pass    | Partial | Partial | Partial | Partial | Partial | Fail    | Ready-after-fixes   | 2 | 7  | 2 |
| 11 | AI Infrastructure Foundation    | Partial | Fail    | Partial | Pass    | Pass    | Partial | Pass    | Partial | Ready-after-fixes   | 2 | 6  | 5 |

---

## 3. Blocker roll-up (must-fix queue)

Ordered by upstream-to-downstream execution order per PROJECT_STATE dependencies: **Phase 11 → 2 → 10 → 3 → 4 → 6 → 5 → 7 → 8 → 9**.

### Phase 11 — AI Infrastructure Foundation
- `PHASE-11-GAP-01` — `agent_conversations`/`agent_messages` table creation contradicts TECHNICAL_SPEC §5.3 (reuse Conversation/ChatMessage). Reqs: PRD-5-10, ADD-7.
- `PHASE-11-GAP-02` — Voyage embedding provider locked without running the Addendum-mandated 50-pair quality test. Req: ADD-3.1-02.

### Phase 2 — Harness + Core Pipelines
- `PHASE-2-GAP-01` — §4 Persistence explicitly rejects `agent_conversations`/`agent_messages`, contradicting locked Addendum §5.3/§7. Reqs: ADD-5.3-07, ADD-7-06.
- `PHASE-2-GAP-02` — Task 9 agent history window "50/7d" contradicts Addendum default N=20; Tier 1 summary missing. Req: ADD-5.3-03.
- `PHASE-2-GAP-06` — Transcript Pipeline output contract (`applied_changes`, `pending_review`, `new_questions_raised`, `blocked_items_unblocked`, `conflicts_detected`, `session_log_id`) not pinned. Req: ADD-5.2.1-09.
- `PHASE-2-GAP-10` — `CostAlertLog` schema unspecified; `briefing_cache` deferred; `COST_APPROACHING_CAP` payload undefined. Reqs: REQ-HARNESS-005, REQ-PIPELINE-004.

### Phase 10 — Work Tab UI Overhaul
- `PHASE-10-GAP-03` — No accessibility requirements (WCAG, keyboard-fallback for drag-drop, ARIA). Req: (app-wide a11y).
- `PHASE-10-GAP-04` — Sprint field vs content-edit permissions not differentiated (PRD-19-08 violation risk); server-reject UI behavior unspecified. Reqs: PRD-19-04, PRD-19-05, PRD-19-08.

### Phase 3 — Discovery, Questions
- `PHASE-3-GAP-01` — §2.8 `questionImpactFunction` duplicates Answer Logging Pipeline Stage 4 (Phase 2) — double ownership, pipeline-first contradiction. Reqs: ADD-5.2.2-01..07, PRD-8-02/04/05/06, PRD-9-04/05/06.
- `PHASE-3-GAP-07` — Task 14 "wire UI to Answer Logging Pipeline" but entry contract (event, payload, sync/async response) not pinned. Reqs: ADD-5.2.2-01..02, PRD-4-04, PRD-8-15.

### Phase 4 — Work Management
- `PHASE-4-GAP-01` — Task 10 (pipeline + embeddings wiring) appears only in summary table with no body/ACs/execution-order placement. Reqs: ADD-5.2.3-01..07, PRD-10-11/12/13.
- `PHASE-4-GAP-02` — REQ-WORK-007/008/009 use agent-loop harness; Addendum mandates deterministic 7-stage pipeline owned by Phase 2. Reqs: ADD-5.2.3-02..05, PRD-10-11/12/13.

### Phase 6 — Five-Layer Org KB
- `PHASE-6-GAP-02` — `KnowledgeArticle.embedding` fate deferred to deep-dive; Layer 3 two-pass retrieval depends on it. Reqs: PRD-5-18, PRD-13-25, ADD-8-E.
- `PHASE-6-GAP-03` — `search_org_kb` silently narrowed to 1-hop; Addendum §4.2 locks recursive-CTE multi-hop traversal. Req: ADD-4.2-03.
- `PHASE-6-GAP-20` — Phase status still "deep-dive still required"; §7 lists 6 open deep-dive items without owners. Process blocker.

### Phase 5 — Sprint, Developer API
- `PHASE-5-GAP-01` — Two competing context-package designs (REQ 2.6-2.8 vs Task 13 Addendum pipeline); Task 13 has no ACs/files. Reqs: PRD-5-34, PRD-12-04/05/06, ADD-4.6-03/04/05.
- `PHASE-5-GAP-02` — Org Query spec'd as keyword+LIKE; Addendum §4.6 mandates thin wrapper over `search_org_kb`. Reqs: PRD-5-35, PRD-12-07, ADD-4.6-06.
- `PHASE-5-GAP-03` — `GET /api/v1/summary` (Tier 1 project summary) referenced in Task 11 but never specified. Reqs: PRD-5-38, PRD-12-02/03.
- `PHASE-5-GAP-06` — Tier 2 package missing test-case stubs, business processes, in-flight coordination flags. Reqs: PRD-12-05, ADD-4.6-04.

### Phase 7 — Dashboards, Search
- `PHASE-7-GAP-01` — Task 5 updates legacy `dashboard-synthesis` task; Addendum mandates Briefing/Status Pipeline. Task 16 orphaned. Reqs: ADD-5.2.4-01..05, PRD-17-03/05, PRD-6-21.
- `PHASE-7-GAP-02` — Task 10 writes own tsvector queries in `global-search.ts`, bypassing `search_project_kb` substrate. Risk (PRD-17-20) entity missing. Reqs: ADD-5.4-01, PRD-17-19/21.

### Phase 8 — Documents, Notifications
- `PHASE-8-GAP-01` — 6 of 14 PRD §17.8 notification events have no sender wired (WORK_ITEM_UNBLOCKED, SPRINT_CONFLICT_DETECTED, STORY_REASSIGNED, STORY_STATUS_CHANGED, ARTICLE_FLAGGED_STALE, METADATA_SYNC_COMPLETE). Req: PRD-17-23.
- `PHASE-8-GAP-02` — BRD, SDD, Client Deck templates in PRD-16-01 neither built nor confirmed pre-existing. Req: PRD-16-01.

### Phase 9 — QA, Jira, Archival
- `PHASE-9-GAP-01` — Attachment `defectId` FK contradicts polymorphic `entityType+entityId` pattern in TECHNICAL_SPEC §Attachment and PRD-5-25. Req: PRD-5-25.
- `PHASE-9-GAP-02` — Archive read-only enforcement missing (PRD §21.1 step 1); mutating actions, AI chat, doc gen not gated. Req: PRD-21-01.

---

## 4. Cross-phase contradictions (CRITICAL)

### Contradiction A — `agent_conversations` / `agent_messages` table creation
- **Phase 2 stance (`PHASE-2-GAP-01`):** Rejects both tables; reuses `Conversation`/`ChatMessage` with `ConversationType = FREEFORM_AGENT`.
- **Phase 11 stance (`PHASE-11-GAP-01`):** Creates both new tables per Addendum §5.3/§7 language.
- **Authoritative sources in conflict:** Addendum §5.3-07 and §7 (require the new tables, locked); TECHNICAL_SPEC §5.3 line 1471 (explicitly reuses existing tables, forbids new ones).
- **Proposed resolution:** Addendum wins per CLAUDE.md hard rule. Create `agent_conversations` + `agent_messages` in Phase 11; update TECHNICAL_SPEC §5.3 to reflect. Phase 2 must drop its §4 "Persistence" reuse note. **Wave 0 user confirmation required** because resolution changes TECHNICAL_SPEC, which is treated as authoritative for Phase 11.

### Contradiction B — Freeform agent history window
- **Phase 2 stance (`PHASE-2-GAP-02`, Task 9):** 50 messages OR 7 days.
- **Addendum §5.3-03:** last N turns, default N=20.
- **Authoritative source:** Addendum §5.3-03 (locked).
- **Proposed resolution:** Phase 2 change Task 9 to N=20 turns (configurable). Phase 2 is also missing "Tier 1 project summary" — add to agent system prompt. Addendum wins. No user input needed; direct fix.

### Contradiction C — Story Generation location (agent-loop vs deterministic pipeline)
- **Phase 4 stance (`PHASE-4-GAP-02`):** REQ-WORK-007/008/009 implement story generation as `storyGenerationTask` agent-harness invocation with tools.
- **Phase 2 stance (implied by Addendum amendment):** Story Generation is a 7-stage deterministic pipeline owned by Phase 2.
- **Authoritative source:** Addendum §5.2.3 (locked); TECHNICAL_SPEC §3.5.
- **Proposed resolution:** Addendum wins. Phase 2 owns pipeline; Phase 4 is reduced to UI consumption of pipeline output. Update both specs. No user input needed.

### Contradiction D — Context Package retrieval method
- **Phase 4 stance (`PHASE-4-GAP-03`):** Loads components via direct Prisma `getOrgComponentsForEpic`.
- **Phase 5 stance (`PHASE-5-GAP-01`, `PHASE-5-GAP-02`):** Two competing designs — REQ 2.6-2.8 uses Prisma+cosine; Task 13 + Addendum use `search_org_kb` hybrid.
- **Phase 6 stance:** Exposes `search_org_kb` as single entry point.
- **Phase 7 stance (`PHASE-7-GAP-02`):** Writes its own tsvector queries, bypassing `search_project_kb`.
- **Authoritative source:** Addendum §4.6-01/02 and §5.4-01 (locked: single hybrid retrieval substrate).
- **Proposed resolution:** Addendum wins. All phases must call `search_project_kb` (Phase 11) or `search_org_kb` (Phase 6). Phases 4, 5, 7 must delete direct query implementations. No user input needed.

### Contradiction E — `vector(512)` hardcoding vs `vector` dimension-at-row-write
- **Phase 11 stance (`PHASE-11-GAP-12`):** Hardcodes `vector(512)` across 7 embedding tables.
- **TECHNICAL_SPEC §8.5 line 2830:** Dimension determined at row-write by `embedding_model`; column not dimension-pinned.
- **Authoritative source:** Addendum §3.1-02 locks Voyage 3-lite (512 dims) for V1, but TECHNICAL_SPEC allows future migration.
- **Proposed resolution:** **Wave 0 user decision required.** Option A: accept `vector(512)` hardcode for V1 simplicity and amend TECHNICAL_SPEC. Option B: use generic `vector` per TECHNICAL_SPEC and carry dimension in app logic. No clear "Addendum wins" rule applies — both are authoritative-consistent.

### Contradiction F — Briefing/Status path
- **Phase 7 stance (`PHASE-7-GAP-01`):** Task 5 modifies legacy `dashboard-synthesis` agent-task prompt.
- **Phase 2 stance:** Briefing/Status Pipeline (Addendum §5.2.4) owns all briefing generation.
- **Authoritative source:** Addendum §5.2.4 (locked).
- **Proposed resolution:** Addendum wins. Phase 7 replaces legacy path with pipeline invocation; Phase 2 must finalize and publish `invokeBriefingPipeline(projectId, briefingType, options)` signature and the 6-type enum. No user input needed.

### Contradiction G — Test case stubs (Phase 4 STUB vs Phase 9 AI_GENERATED)
- **Phase 9 stance (`PHASE-9-GAP-09`):** Task 7 generates test cases with `source: AI_GENERATED` on READY transition.
- **Phase 4 stance:** Story Generation Pipeline Stage 7 emits STUB test cases.
- **Proposed resolution:** Phase 9 must delete only `AI_GENERATED` rows on regenerate; never touch STUB/MANUAL. Phase 9 must read pipeline-produced ACs, not pre-pipeline fields. Cross-phase coordination ticket; no user input needed, but both audits must update AC text.

### Contradiction H — Answer Logging ownership (Phase 3 `questionImpactFunction` vs Phase 2 Answer Logging Pipeline)
- **Phase 3 stance (`PHASE-3-GAP-01`):** §2.8 implements its own Stage 4 equivalent via `questionImpactFunction`.
- **Phase 2 stance:** Answer Logging Pipeline (Addendum §5.2.2) owns all answer-logging impact analysis.
- **Authoritative source:** Addendum §5.2.2 and §2 pipeline-first lock.
- **Proposed resolution:** Addendum wins. Phase 3 removes §2.8 and delegates to Phase 2 pipeline. No user input needed.

---

## 5. Orphan requirements

Requirements with Fail/missing status across every relevant phase audit:

| Req ID | Text (short) | Suggested owner phase | Justification | Inferred severity |
|--------|--------------|-----------------------|---------------|-------------------|
| PRD-5-25 | Attachments polymorphic (entityType+entityId) on stories/questions/defects | Phase 4 (stories/questions) + Phase 9 (defects) already conflict. Owner: **Phase 4** adds story/question coverage; Phase 9 fixes defect path per PHASE-9-GAP-01. | Both phases hint; PRD-5-25 requires polymorphism. | Major |
| PRD-5-26 / PRD-19-11 / PRD-19-12 / PRD-25-03 | Optimistic concurrency + VersionHistory + never-silent-overwrite | **Phase 4** | REQUIREMENT_INDEX hints Phase 4; relates to story/epic/feature edits. | Major |
| PRD-9-08 | Epic prefix uniqueness per project | **Phase 3** | REQUIREMENT_INDEX hints Phase 3/4; epic CRUD lives in Phase 3. | Minor |
| PRD-9-10 | Question text clarity validation | **Phase 3** (per `PHASE-3-GAP-03`) | Phase 3 owns question creation. | Major |
| PRD-13-14 | Stories referencing unknown components trigger "planned" KB placeholder | **Phase 6** (preferred) or Phase 4 | Requires org KB write; belongs with Phase 6. | Major |
| PRD-13-17 | Phase 4 writes initial KnowledgeArticle drafts per process/domain | **Phase 4** (PRD names Phase 4 explicitly) or defer to Phase 6 | PRD explicit; currently neither owns. | Major |
| PRD-11-01 | AI Execution Mapping (ordered dependency sequencing) | **Phase 5** (`PHASE-5-GAP-05`) | REQUIREMENT_INDEX hints Phase 5; parallelization already there. | Major |
| PRD-22-05 | AI tool-call text fields server-side sanitized (HTML/script) | **Phase 2** | First touch point for AI output; cross-cutting. | Major |
| PRD-22-10 | AI must flag suspicious transcript content as a risk | **Phase 2** | Transcript Pipeline stage needs the rule. | Major |
| PRD-22-13 | Token fields stripped from JSON responses | **Phase 5** (`PHASE-5-GAP-07`) | Phase 5 adds 4 response surfaces with none scrubbing. | Major |
| PRD-22-16 | All API requests logged 90 days | **Phase 5** (`PHASE-5-GAP-09`) | Phase 5 creates/modifies 5 endpoints without logging. | Major |
| PRD-13-28 | isStale propagation at end of agent loop | **Phase 2** (engine hook) + **Phase 6** (flag read) | Engine loop owned by Phase 2. | Major |
| PRD-8-12 | Interrupted task session marked FAILED | **Phase 2** | Pipeline run state machine lives here. | Major |
| PRD-6-07 / PRD-6-19 | Context window budget + transcript iteration budget | **Phase 2** | Harness + Transcript Pipeline. | Major |
| PRD-6-25 | Background job best-guess + flag semantics | **Phase 2** | Pipeline non-interactive path. | Minor |
| PRD-5-14 | Null test-assignee fallback to all QA members | **Phase 8** (per `PHASE-9-GAP-11`) | Phase 8 owns notification routing. | Minor |
| PRD-16-07 | Regeneration-with-adjustments | **Phase 8** (`PHASE-8-GAP-03`) | Phase 8 owns doc generation. | Major |
| PRD-5-27 | BusinessProcess statuses + complexity | **Phase 6** (preserved) | Part of Layer 1. | Major |
| PRD-13-16 / PRD-13-20 / PRD-13-21 | BusinessProcess + AI KnowledgeArticle defaults persistence | **Phase 6** (`PHASE-6-GAP-04`) | Brownfield ingestion output path. | Major |
| PRD-17-05 | Current Focus narrative (cached AI summary) | **Phase 2** emits + **Phase 7** consumes | Briefing Pipeline type gap. | Major |
| PRD-23-12 | Inngest event volume metric on Usage dashboard | **Phase 7** (`PHASE-7-GAP-03`) | Currently deferred against PRD. | Major |
| PRD-23-03 (firm-wide) | Firm-wide monthly cost alert | **Phase 7** (`PHASE-7-GAP-04`) | Third clause of PRD-23-03 not wired. | Major |

---

## 6. Duplicate coverage

Requirements with divergent interpretations across phases.

| Req ID | Phases involved | Conflict description | Suggested owner |
|--------|-----------------|----------------------|-----------------|
| PRD-5-25 (Attachments) | 4, 9 | Phase 9 uses typed FK (`defectId`); Phase 4 silent. Must converge on polymorphic. | **Phase 4 owns story/question; Phase 9 refactors defect to polymorphic** |
| ADD-5.2.3-03 (mandatory validation) | 2, 4 | Phase 4 §2.9 implements `validateStoryReadiness`; Phase 2 Stage 3 also implements. | **Phase 2 owns**; Phase 4 UI-only |
| ADD-5.2.3-04 (component cross-ref) | 4, 6 | Phase 4 uses direct Prisma; Phase 6 owns `search_org_kb`. | **Phase 6 owns**; Phase 4 consumes pipeline output |
| ADD-5.2.2-04 (answer impact Stage 4) | 2, 3 | Phase 3 `questionImpactFunction` duplicates. | **Phase 2 owns**; Phase 3 UI-only |
| ADD-5.2.4 (briefing generation) | 2, 7 | Phase 7 Task 5 updates legacy task; Phase 2 owns pipeline. | **Phase 2 owns**; Phase 7 calls pipeline |
| ADD-5.4-01 (`search_project_kb`) | 7, 11 | Phase 7 writes its own tsvector; Phase 11 owns primitive. | **Phase 11 owns**; Phase 7 thin adapter |
| ADD-4.6-06 (`search_org_kb` wrapper) | 5, 6 | Phase 5 implements keyword+LIKE; Phase 6 owns. | **Phase 6 owns**; Phase 5 calls |
| ADD-5.2.3 stub test cases vs AI_GENERATED | 4, 9 | STUB (Phase 4) vs AI_GENERATED (Phase 9) lifecycle untested. | **Phase 4 emits STUB via pipeline; Phase 9 deletes only AI_GENERATED** |
| PRD-5-30 / PRD-17-05 Current Focus narrative | 2, 7 | Phase 2 briefing types don't include current-focus type; Phase 7 consumes. | **Phase 2 emits; Phase 7 consumes** |

---

## 7. Recurring pattern gaps

Gap classes appearing in 3+ phases.

### Pattern A — No REQ-ID trace lines (CLAUDE.md explicit rule)
- Phases exhibiting: `PHASE-2-GAP-*(implicit R1)`, `PHASE-3-GAP-12`, `PHASE-4-GAP-11`, `PHASE-5-GAP-11`, `PHASE-6-*(R1)`, `PHASE-7-GAP-07`, `PHASE-8-GAP-11`, `PHASE-10-GAP-01`, `PHASE-11-*(R1)`.
- Pattern: Phase specs use internal REQ-XXX IDs, never cite PRD/Addendum Req IDs per block.
- Single remediation: add a "Traces to:" line to every §2.x block and every TASK attribute table across all 10 phases in one documentation sweep.

### Pattern B — Unpinned upstream interfaces
- Phases: `PHASE-4-GAP-12` (Phase 11 embeddings), `PHASE-4-GAP-09` (server actions), `PHASE-5-GAP-01/02/10/12` (Phase 6 `search_org_kb`/`search_project_kb`/`component_edges`), `PHASE-7-GAP-01/02` (Phase 2 briefing; Phase 11 search), `PHASE-8-GAP-05` (event payloads), `PHASE-9-GAP-04/05` (Jira/event payloads), `PHASE-10-GAP-09` (Phase 1 exports).
- Pattern: upstream functions referenced by name without module path, Zod/TS signature, error shape, or return contract.
- Single remediation: Wave 1 creates a consolidated "Published Interfaces" doc — Phase 11 publishes retrieval + model router + embeddings queue signatures; Phase 2 publishes pipeline invocation + event payload shapes; Phase 1 publishes RBAC + status-machine exports — and every downstream phase links to it.

### Pattern C — Orphaned/unbodied tasks ("summary-only" entries)
- Phases: `PHASE-4-GAP-01` (Task 10), `PHASE-5-GAP-10` (Task 14), `PHASE-7-GAP-01/07` (Task 16), `PHASE-8-GAP-07/12` (Task 10), `PHASE-3-GAP-13` (Task 14), `PHASE-6-GAP-20` (6 open deep-dive items).
- Pattern: Addendum amendments add tasks in the summary table or amendment section but the task body, ACs, files list, and execution-order entry are missing.
- Single remediation: Wave 0 audit — every phase sweeps `TASKS.md` summary table rows without a matching body and either writes the body or removes the row. Reconcile "Total Tasks: N" headers in the same pass.

### Pattern D — Missing role/permission edge cases
- Phases: `PHASE-4-GAP-10`, `PHASE-8-GAP-05`, `PHASE-9-GAP-08`, `PHASE-10-GAP-04`.
- Pattern: RBAC "role-aware" claims without pinning which field a role gates, which action enforces it, or what happens on stale-role server reject.
- Single remediation: extend Phase 1 RBAC helpers with a `getFieldPermission(role, fieldKey)` helper; every phase consuming it references Phase 1's published helper.

### Pattern E — Missing rate-limit / API-request-log ACs
- Phases: `PHASE-5-GAP-08/09`, `PHASE-7-GAP-05` (cost cap race), `PHASE-8-GAP-05` (dedupe window).
- Single remediation: one shared §3 "API Guardrails" template applied to each phase's endpoint tasks (rate limit, 429 shape, request log, dedupe window).

### Pattern F — "Open Questions: None" false claim
- Phases: `PHASE-4-GAP-01(R8)`, `PHASE-5-GAP-11`, `PHASE-7-GAP-07`, `PHASE-8-GAP-07`, `PHASE-10-GAP-11`.
- Single remediation: every Not-ready phase re-opens §7 with the gaps from its audit listed as unresolved items with owners.

---

## 8. Ambiguity inventory

| Ambiguity | Flagged by (phases) | Candidate resolutions | Impact if unresolved |
|-----------|---------------------|-----------------------|----------------------|
| `agent_conversations`/`agent_messages` vs `Conversation`/`ChatMessage` reuse | 2, 11 | (A) Create new tables per Addendum; (B) Reuse existing per TECHNICAL_SPEC | Phase 11 ships wrong schema; Phase 2 persistence diverges |
| Freeform agent history window N (20 vs 50) | 2 | (A) N=20 per Addendum; (B) 50/7d per general chat rule | Agent context quality; wrong PRD clause applied |
| `vector(512)` hardcode vs generic `vector` | 11 | (A) Hardcode, update TECHNICAL_SPEC; (B) Generic, keep TECHNICAL_SPEC | Future 1024-dim migration cost; 7-table alter |
| Voyage provider without 50-pair test | 11 | (A) Accept deviation (documented); (B) Run the test before lock | Potential quality regression; Addendum-rule violation |
| STATUS_REPORT "variant" vs distinct enum | 8 | Reconcile wording; enum stays in TECHNICAL_SPEC | Cosmetic; developer confusion |
| BRD/SDD/Client Deck templates: built or pre-existing? | 8 | (A) Add 3 templates to Phase 8; (B) Cite earlier phase | PRD-16-01 uncovered |
| Preview deferral (PRD-16-06) | 8 | (A) Implement PDF preview; (B) Amend PRD | PRD coverage gap |
| KnowledgeArticle embedding fate | 6 | (A) Yes in V1; (B) Phase 2 pass | Two-pass retrieval unbuildable |
| `KnowledgeArticle` re-proposal after archive | 6 | Addendum-silent; need explicit rule | Repeated AI-nag on rejected memberships |
| Greenfield domain proposal flow | 6 | (A) Manual only V1; (B) AI-suggested | ADD-4.4-06 uncovered |
| "Current Focus" / "Recommended Focus" briefing type mapping | 2, 7 | Add dedicated briefing types | PRD-5-30 / PRD-17-05 uncovered |
| OPEN vs RAISED question lifecycle naming | 3 | Rename `OPEN → RAISED` or trace justification | PRD-9-01 naming mismatch |
| Firm-wide cost cap semantics (advisory vs blocking) | 7 | (A) Advisory; (B) Blocks execution with flag | PRD-23-03 uncovered |
| "Access logs" vs "Audit logs" scope (PRD-21-06) | 9 | Define equivalence or split | Wrong retention table |
| Archive read-only ownership (who gates AI chat?) | 9 | Phase 9 adds `assertProjectWritable` gate | PRD-21-01 violation |
| Tasks-tier UI ownership (PRD-10-02) | 10 | (A) Phase 10 builds; (B) Defer to Phase 4 | Fourth tier absent |
| Developer default "My Work" view | 10 | Add to Phase 10 | PRD-12-01 partial |
| Sprint assignment auto-transition (PRD-19-06) | 10 | Phase 10 UI + Phase 1 action | Silent regression |

---

## 9. Execution order for fixes

### Wave 0 — Resolve ambiguities (user sign-off required)
**These items block every fix agent.** User must decide before dispatch.

1. **Contradiction A**: `agent_conversations` tables? Confirm Addendum-wins resolution and authorize TECHNICAL_SPEC §5.3 amendment.
2. **Contradiction E**: `vector(512)` hardcode vs generic — user decision.
3. **Ambiguity**: Voyage provider 50-pair quality test — accept deviation or run the test before Phase 11 executes.
4. **Ambiguity**: PRD-16-06 preview deferral — add preview or amend PRD.
5. **Ambiguity**: `KnowledgeArticle.embedding` fate (Phase 6 GAP-02) — decide V1 or deferred.
6. **Ambiguity**: Tasks-tier UI ownership (Phase 10 GAP-02) — Phase 10 or Phase 4.
7. **Ambiguity**: BRD/SDD/Client Deck templates (Phase 8 GAP-02) — build or cite.
8. **Ambiguity**: Orphan requirement owners (PRD-5-25 attachments, PRD-13-17 KA drafts, PRD-22-05 sanitization, PRD-13-28 staleness hook, PRD-22-10 suspicious-transcript flag) — confirm suggested owners from §5.
9. **Ambiguity**: Firm-wide cost cap behavior (advisory vs blocking).
10. **Ambiguity**: Archive read-only gate (Phase 9 GAP-02) ownership confirmation.

**Wave 0 item count: 10.**

### Wave 1 — Foundational blockers (upstream-most)
**Phases 11 and 2.** Nothing else can proceed until these are stable.

- **Phase 11**: fix GAP-01 (agent tables per Wave 0 decision), GAP-02 (provider test), GAP-12 (vector dim per Wave 0), GAP-03 (fixture expected_properties), GAP-04 (shared/assertions), GAP-05 (latency SLO), GAP-06 (fixture JSON schema).
- **Phase 2**: fix GAP-01 (persistence align), GAP-02 (agent window N=20), GAP-06 (transcript pipeline output contract), GAP-10 (CostAlertLog + briefing_cache + event payloads), GAP-03 (suspicious transcript risk), GAP-04 (staleness hook), GAP-05 (interrupted-session FAILED).
- Rationale: Phase 2 and 11 publish the interfaces every downstream phase depends on; their pinning is a prerequisite for Pattern B remediation.

### Wave 2 — Downstream blockers that unblock others
Phases whose blockers gate 2+ other phases.

- **Phase 6**: fix GAP-02 (embedding fate — unblocks Phases 5, 7), GAP-03 (recursive-CTE traversal — unblocks Phase 5 Task 13), GAP-20 (close deep-dive items). Also GAP-04 (BusinessProcess persistence) — unblocks Phase 4's PRD-13-17 orphan.
- **Phase 3**: fix GAP-01 (remove `questionImpactFunction`) + GAP-07 (pin Answer Logging Pipeline entry contract) — these depend on Phase 2 GAP-06 being done first.
- **Phase 4**: fix GAP-01 (Task 10 body) + GAP-02 (Agent-loop → pipeline consumer) — depend on Phase 2 pipeline and Phase 6 `search_org_kb`.

Rationale: Phase 6's `search_org_kb` feeds Phases 5 and 7; Phase 2/3 answer-logging path feeds Phase 7 dashboards; Phase 4 produces artifacts consumed by Phases 7, 8, 9.

### Wave 3 — Parallel fix-up (no cross-phase contention)
Can run in parallel once Wave 1+2 land.

- **Phase 5**: fix GAP-01, GAP-02, GAP-03, GAP-06 (all depend on Phase 2 + Phase 6 interfaces from Wave 1/2).
- **Phase 7**: fix GAP-01, GAP-02 (depend on Phase 2 + Phase 11 interfaces).
- **Phase 8**: fix GAP-01 (6 missing senders) + GAP-02 (templates) — can run alongside Phase 9 since events are additive.
- **Phase 9**: fix GAP-01 (polymorphic Attachment) + GAP-02 (archive read-only) — no upstream dependency beyond Phase 1.
- **Phase 10**: fix GAP-03 (a11y) + GAP-04 (permission split) — depend only on Phase 1 RBAC helper (Pattern D remediation).
- All Minor and most Major gaps across all phases fold into this wave.

---

## 10. Sign-off checklist

- [x] All 10 audits consolidated
- [x] Readiness matrix fills every cell
- [x] Blocker roll-up covers every Blocker in every audit (25 blockers listed)
- [x] Cross-phase contradictions each have a proposed resolution (8 contradictions documented; 2 deferred to Wave 0 user decision)
- [x] Orphan requirements each have a suggested owner
- [x] Execution order is actionable (no "TBD"; 3 waves + Wave 0 decision gate)
