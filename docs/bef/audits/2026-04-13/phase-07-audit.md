# Phase 07 Audit: Dashboards, Search

**Auditor:** Phase 7 audit agent
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-07-dashboards-search/PHASE_SPEC.md` (433 lines, last updated 2026-04-10 + Addendum amendments 2026-04-13)
- `docs/bef/03-phases/phase-07-dashboards-search/TASKS.md` (545 lines, 15 tasks in body + a 16th row appearing only in the summary table)

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md` (§§3, 5.2.2, 6.5, 8.4, 17.1-17.8, 19.1, 23.3-23.5, 23.12)
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` (§§5.2.4, 5.4)
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (§§5.2 dashboard queries, 5.3 usage, 3.6 briefing pipeline)
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`

---

## 1. Scope Map

| Req ID | Requirement (1-line) | Covered by (spec §/task #) | Status | Notes |
|--------|----------------------|----------------------------|--------|-------|
| PRD-5-29 | Project health computed from stale questions, blocked items, risk thresholds | §2.1 / Task 2 | Pass | Signal counter w/ thresholds |
| PRD-6-20 | Quantitative dashboard data from Postgres only, no AI | §2.1-§2.6, Addendum amendment | Pass | Amendment confirms deterministic SQL |
| PRD-6-21 | Qualitative dashboard content AI-generated and cached | §2.4 / Task 5 | Partial | Still wired to legacy `dashboard-synthesis` task, not Briefing/Status Pipeline |
| PRD-6-22 | Cached AI regenerated on state change or explicit refresh | §2.11 / Task 12 | Pass | Event wiring audit |
| PRD-8-20..25 | Discovery dashboard surfaces for open Qs, follow-ups, answered, blocked, unmapped reqs, health | §2.3, §2.4 / Tasks 4, 5 | Pass | — |
| PRD-17-01 | Briefing is primary landing page visible to all roles | — | NotApplicable | Established in earlier phase; not re-verified |
| PRD-17-02 | Briefing header metrics instant from Postgres | §2.3 / Task 4 | Pass | — |
| PRD-17-03 | Recommended Focus = AI-prioritized top 3-5 questions, cached | §2.4 / Task 5 | Partial | Structured output defined, but generation path does not call Briefing/Status Pipeline |
| PRD-17-04 | Blocking Questions panel direct DB, ID/age/owners/text/affected stories | §2.4 / Task 5 | Partial | Affected-stories list not in AC |
| PRD-17-05 | Current Focus narrative = cached 2-4 sentence AI summary | — | Fail | Task 5 updates legacy prompt; no task outputs/caches "Current Focus" via pipeline |
| PRD-17-06 | Epic Status panel per-epic phase/counts/completion from DB | §2.3 / Task 4 | Pass | — |
| PRD-17-10 | Sprint dashboard: progress, burndown, missing fields, conflicts, workload | §2.5 / Task 6 | Partial | Burndown not referenced (assumed prior phase); missing-fields/workload/conflict covered |
| PRD-17-15 | PM dashboard aggregates briefing/roadmap/sprint + velocity + risk + deadlines + client items | §2.6 / Task 7 | Partial | Velocity not addressed; risk/deadlines/client items covered |
| PRD-17-16 | Health score from stale Qs >7d, client Qs >3d, blocked >5d, unmitigated risks | §2.1 / Task 2 | Pass | — |
| PRD-17-17 | Green/Yellow/Red thresholds configurable; shown in Briefing header | §2.1, §2.2 / Tasks 2, 3 | Pass | — |
| PRD-17-18 | Layer 1 per-entity Prisma-filtered views with facets, AI-free | — | NotApplicable | Phase 1/6; not re-verified |
| PRD-17-19 | Layer 2 global full-text search via tsvector/tsquery grouped | §2.9 / Task 10 | Partial | Does not call `search_project_kb`; writes own tsvector queries in `global-search.ts` |
| PRD-17-20 | FTS indexed entities: Question, Decision, Requirement, Story, OrgComponent, KnowledgeArticle, BusinessProcess, Risk | §2.9, Task 1 | Partial | Risk not in task scope; schema check only lists Story/OrgComponent/BusinessProcess |
| PRD-17-21 | Layer 3 semantic via pgvector cosine when few results or user-chosen | §2.9 / Task 10 | Partial | Toggle added; but layer 3 still only covers KnowledgeArticle per spec line 174; no activation on "few results" heuristic |
| PRD-17-23 | 14 notification event types incl. health score change, cost threshold | — | NotApplicable | Phase 8; cost alerts partially defined here |
| PRD-19-10 | Only SA/PM view Usage & Costs | §2.7, §2.8 / Tasks 8, 9 | Pass | `requireRole` gating |
| PRD-23-03 | Per-consultant daily limits, per-project monthly cost caps, firm-wide alerts | §2.13 / Task 14 | Partial | Per-project + per-consultant covered; firm-wide alerts not addressed |
| PRD-23-04 | Usage & Costs tab per project, SA/PM only | §2.8 / Task 9 | Pass | — |
| PRD-23-05 | Project totals (tokens, cost, sessions) filterable by date range | §2.7, §2.8 | Pass | — |
| PRD-23-06 | Task-type breakdown with % of total | §2.8 / Task 9 | Pass | AC lists % of total |
| PRD-23-07 | Per-member breakdown SA/PM only | §2.7, §2.8 | Pass | — |
| PRD-23-08 | Trend chart daily/weekly | §2.8 / Task 9 | Pass | Daily trend; weekly aggregation not specified |
| PRD-23-09 | Cost formula aggregated from SessionLog, pricing as TS constant | §2.7 / Task 8 + Task 15 | Pass | Consolidation to `ai-pricing.ts` |
| PRD-23-12 | Inngest event volume metric included | — | Fail | Deferred to V2 per spec scope summary; PRD requires it |
| ADD-5.2.4-01 | Briefing pipeline accepts project_id + briefing_type | — | Fail | No task invokes pipeline; Task 16 in summary has no body |
| ADD-5.2.4-02 | Stage 1 deterministic SQL metrics w/ 5-min TTL cache | — | Fail | No TTL/inputs_hash cache described for Phase 7 data queries |
| ADD-5.2.4-03 | Stage 3 Sonnet generates narrative prose per template | §2.4 (AI prompt update) | Partial | Prompt lives in legacy `dashboard-synthesis` task, not pipeline stage |
| ADD-5.2.4-04 | Stage 4 deterministic validation (typography, branding, numeric parity) | — | Fail | No validator referenced in Phase 7 briefing generation path |
| ADD-5.2.4-05 | Stage 5 cache with generated_at + inputs_hash | — | Partial | `CachedBriefing` exists; `inputs_hash` not specified |
| ADD-5.4-01 | `search_project_kb` shared substrate across pipelines and agent | Amendment §Addendum v1 (line 37) | Fail | Amendment asserts it but Task 10 implements own tsvector queries in `global-search.ts`, contradicting the amendment |
| ADD-5.4-02 | Per-entity embedding tables feed hybrid retrieval | — | NotApplicable | Phase 11 scope |

**Scope summary:** 33 rows mapped. 14 Pass, 12 Partial, 4 Fail, 3 NotApplicable.

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification (1 line) |
|---|-----------|-------|------------------------|
| R1 | Requirement traceability — every spec/task cites PRD/Addendum | Partial | Spec references Addendum amendments but requirements are not traced per-task; no REQ-ID trace table |
| R2 | No PRD/Addendum/TECHNICAL_SPEC contradiction | Fail | Task 10 builds own tsvector queries, contradicting Addendum amendment that `search_project_kb` is the substrate; Task 5 updates legacy `dashboard-synthesis` prompt rather than Briefing/Status Pipeline |
| R3 | Scope completeness — every in-domain requirement has a task | Fail | Missing: Briefing/Status Pipeline invocation task (Task 16 orphaned in summary, no body), Inngest event volume (deferred against PRD-23-12), firm-wide cost alert (PRD-23-03), Current Focus narrative (PRD-17-05), Risk added to search scope (PRD-17-20), Sprint velocity (PRD-17-15) |
| R4 | Acceptance criteria testable (inputs/outputs/thresholds) | Partial | Most ACs concrete; several gaps: trend chart "daily/weekly" not specified, semantic "few results" heuristic undefined, daily-vs-weekly trend threshold ambiguous, 80%/100% thresholds defined but debounce window on repeat alerts not |
| R5 | Edge cases enumerated | Partial | Good table in §4, but missing: cost cap race condition during concurrent executeTask calls, audit log concurrent write ordering, daily session limit rollover at midnight TZ, semantic mode cold embedding (new entities not yet embedded), cap change mid-cycle, cap enforcement for in-flight multi-stage pipelines |
| R6 | Interfaces pinned (schema, APIs, events) | Partial | AuditLog schema well-defined; `CostCapExceededError` not specified; `NOTIFICATION_SEND` event payload shape for COST_THRESHOLD_WARNING/COST_CAP_EXCEEDED not specified; `getUsageDashboard` return type not declared; no `search_project_kb` signature pinned for Phase 7 consumers |
| R7 | Upstream dependencies resolved with concrete refs | Partial | Phase 3/4/5 references concrete; Phase 2 Briefing Pipeline referenced in amendment but no interface reference (signature, events, response shape); Phase 6 tsvector migration dependency described as "if exists, skip" without definitive check |
| R8 | Outstanding-for-deep-dive items empty/tracked | Fail | "Task 16" in summary table has no body, no Linear ID, no AC; three Open Questions resolved inline but no "Outstanding for deep-dive" section exists |

**Overall verdict:** Not-ready

---

## 3. Gaps

### PHASE-7-GAP-01
- **Rubric criterion:** R2, R3, R8
- **Affected Req IDs:** ADD-5.2.4-01, ADD-5.2.4-02, ADD-5.2.4-03, ADD-5.2.4-04, ADD-5.2.4-05, PRD-17-03, PRD-17-05, PRD-6-21
- **Description:** The Addendum amendment (spec line 35) declares that briefing generation must route through the Phase 2 Briefing/Status Pipeline. The summary table row labeled "Task 16" asserts this, but no Task 16 body exists. Task 5 ("Blocking Questions Data Quality and Structured Recommended Focus") still modifies `src/lib/agent-harness/tasks/dashboard-synthesis.ts` prompt directly, which is the legacy non-pipeline path. Current Focus (PRD-17-05) is never regenerated via the pipeline. No task emits `briefing_type` (e.g., `executive_summary`, `discovery_gap_report`). Stage 4 validator and `inputs_hash` caching are absent. A developer agent will implement the legacy path and ship a solution that contradicts the Addendum.
- **Severity:** Blocker

### PHASE-7-GAP-02
- **Rubric criterion:** R2, R3
- **Affected Req IDs:** ADD-5.4-01, PRD-17-19, PRD-17-21
- **Description:** The Addendum amendment states that `search_project_kb` (Phase 11 hybrid retrieval) is the substrate. Task 10, however, defines "add full-text search queries for Story, OrgComponent, BusinessProcess following the existing pattern" directly in `src/lib/search/global-search.ts` with its own tsvector clauses. Task 1 adds tsvector columns/triggers for those entities. This bypasses `search_project_kb` entirely and duplicates retrieval logic, contradicting the locked Addendum decision that hybrid retrieval is implemented once and used everywhere. In addition, Risk is required by PRD-17-20 to be full-text indexed but appears in no task.
- **Severity:** Blocker

### PHASE-7-GAP-03
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-23-12, PRD-17-15
- **Description:** PRD-23-12 explicitly requires the Usage & Costs dashboard to include an Inngest event volume metric. The spec defers this to V2 ("GAP-DASH-018 Inngest event volume metric... Inngest does not expose a simple API... adds complexity without clear V1 value"). Per the project's PRD-first rule, scope cannot be deferred against a PRD requirement without explicit justification approved at the PRD level. Separately, PRD-17-15 requires team velocity on the PM dashboard; Task 7 does not include velocity.
- **Severity:** Major

### PHASE-7-GAP-04
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-23-03
- **Description:** PRD-23-03 requires three cost controls: per-consultant daily request limits, per-project monthly cost caps with alerts, and firm-wide monthly cost alerts. Task 14 implements per-project and per-member. No task implements firm-wide monthly cost alerts (aggregate across all projects).
- **Severity:** Major

### PHASE-7-GAP-05
- **Rubric criterion:** R5, R6
- **Affected Req IDs:** PRD-23-03 (cost cap), ADD-5.2.4-05
- **Description:** Cost cap edge cases not enumerated: (a) concurrent `executeTask` calls when at 99% cap (race can bypass enforcement); (b) in-flight multi-stage pipelines where stage 1 is admitted but stage 3 pushes over cap; (c) cap threshold change mid-cycle (was 80%, raised to 200%, should it re-alert?); (d) TZ choice for "current calendar month" and "start of day" (UTC vs project TZ vs user TZ); (e) daily session limit counting aborted vs completed sessions. Also the `CostCapExceededError` class, its fields, and serialization to UI are not specified. `NOTIFICATION_SEND` event payload for COST_THRESHOLD_WARNING/COST_CAP_EXCEEDED is not pinned (recipients, severity, dedupe window).
- **Severity:** Major

### PHASE-7-GAP-06
- **Rubric criterion:** R4, R6
- **Affected Req IDs:** PRD-17-21
- **Description:** PRD-17-21 says Layer 3 activates "when full-text returns few results or when user chooses semantic mode." Task 10 only implements the user toggle. The "few results" auto-activation heuristic (threshold value, behavior when toggle off but results < N) is undefined. Also the spec states layer 3 "only covers KnowledgeArticle in V1" (line 174), which directly contradicts the toggle's purpose for the newly added entities (Story, OrgComponent, BusinessProcess) — toggling "Smart Search" on still produces no semantic results for those types.
- **Severity:** Major

### PHASE-7-GAP-07
- **Rubric criterion:** R1, R8
- **Affected Req IDs:** all Phase 7 requirements
- **Description:** PHASE_SPEC lacks a REQ-ID traceability table (PRD/Addendum IDs → spec §/task). Tasks reference internal `GAP-DASH-*` IDs, not PRD/Addendum REQ-IDs. Deep-dive outputs require an explicit trace line per project rule. There is no "Outstanding for deep-dive" section; the orphaned Task 16 row in the summary table has no body, AC, complexity, or owner.
- **Severity:** Major

### PHASE-7-GAP-08
- **Rubric criterion:** R4
- **Affected Req IDs:** PRD-17-04
- **Description:** PRD-17-04 requires the Blocking Questions panel to show ID, age, owners, text, and affected stories. Task 5 AC lists age, owner, question text, and displayId but does not require the affected-stories list to be rendered.
- **Severity:** Minor

### PHASE-7-GAP-09
- **Rubric criterion:** R5, R6
- **Affected Req IDs:** PRD-6-22, PRD-17-03, PRD-17-05
- **Description:** Recommended Focus and Current Focus regeneration triggers are not fully specified. Task 12 lists which mutations fire `PROJECT_STATE_CHANGED` but does not specify cache invalidation logic: when pipeline output is cached with `inputs_hash`, how does the 30-second debounce interact with the 5-minute TTL from Addendum §5.2.4-02? What happens on "manual refresh"? Explicit behavior (bypass cache, update `generated_at`, emit what event) is not pinned.
- **Severity:** Minor

### PHASE-7-GAP-10
- **Rubric criterion:** R4, R6
- **Affected Req IDs:** PRD-23-08
- **Description:** PRD-23-08 requires "daily/weekly" trend. Task 8 implements `getDailyUsageTrend` only. There is no weekly aggregation function or UI selector, and no AC on chart axis handling when date range spans >90 days (daily points become unreadable).
- **Severity:** Minor

---

## 4. Fix Plan

### Fix PHASE-7-GAP-01
- **File(s) to edit:** `docs/bef/03-phases/phase-07-dashboards-search/PHASE_SPEC.md` §2 (add new §2.14), `TASKS.md` (new Task 16 body, remove orphaned summary row or promote to full task)
- **Change summary:** Replace the current `dashboard-synthesis` legacy path with explicit calls to the Briefing/Status Pipeline defined in Phase 2. Define the caller contract, briefing types used by each dashboard, and pipeline output consumption. Remove Task 5's update to the legacy prompt and replace with pipeline invocation.
- **New content outline:**
  - Add §2.14 "Briefing/Status Pipeline Integration" with: caller locations (discovery dashboard → `discovery_gap_report`; PM dashboard → `weekly_status`; sprint dashboard → `sprint_health`); how cached pipeline output maps onto `CachedBriefing.currentFocus` and `CachedBriefing.recommendedFocus` (structured array); invalidation rule tying `PROJECT_STATE_CHANGED` + manual refresh to a call to `invokeBriefingPipeline(projectId, briefingType, { bypassCache? })`.
  - Add Task 16 body with ACs: (a) `src/lib/pipelines/briefing-status/invoke.ts` exists and returns `{ currentFocus, recommendedFocus: Array<{rank, questionId, questionDisplayId, questionText, reasoning}>, generatedAt, inputsHash }`; (b) discovery dashboard synthesis replaced by pipeline call; (c) PM dashboard Current Focus sourced from pipeline; (d) legacy `src/lib/agent-harness/tasks/dashboard-synthesis.ts` removed or delegates to pipeline; (e) Stage 4 validator (forbidden phrases, numeric parity) runs and blocks cache write on failure; (f) cache row stores `inputs_hash` and 5-min TTL per briefing type.
  - Update Task 5 AC to remove legacy prompt update; structured recommendedFocus now comes from pipeline output.
- **Cross-phase coordination:** Phase 2 must expose `invokeBriefingPipeline(projectId, briefingType, options)` and the `briefing_type` enum including `discovery_gap_report`. Phase 7 depends on this interface being finalized before Task 16 starts.
- **Definition of done:**
  - [ ] §2.14 lands in PHASE_SPEC.md with the items above
  - [ ] TASKS.md Task 16 has full attribute table, ACs, implementation notes matching the outline
  - [ ] Task 5 AC no longer mentions updating `dashboard-synthesis` prompt
  - [ ] REQ-IDs ADD-5.2.4-01..05, PRD-17-03, PRD-17-05, PRD-6-21 cited in §2.14 traceability
  - [ ] Phase 2 spec cross-reference added in §5 Integration Points

### Fix PHASE-7-GAP-02
- **File(s) to edit:** `PHASE_SPEC.md` §2.9, `TASKS.md` Task 10 (and Task 1)
- **Change summary:** Replace direct tsvector queries in `global-search.ts` with calls to `search_project_kb` for project-scoped entities (Question, Decision, Requirement, Risk, Story, annotations) and `search_org_kb` for org entities (OrgComponent, BusinessProcess, KnowledgeArticle). Add Risk to the search entity list. Schema work for embedding tables moves to Phase 11; only tsvector columns needed for pre-embedding BM25 remain in Task 1.
- **New content outline:**
  - §2.9 rewritten: `global-search.ts` becomes a thin adapter that fans out to `search_project_kb` and `search_org_kb`, merges grouped results, applies the UI facets. Smart Search toggle controls the `semantic: true|false` flag passed to both substrates.
  - Task 10 ACs: (a) no tsvector SQL written in `global-search.ts`; (b) `SearchEntityType` includes `question|decision|requirement|risk|story|orgComponent|businessProcess|knowledgeArticle`; (c) Risk appears in results; (d) Smart Search toggle passes through to both substrates; (e) unit test asserts `global-search.ts` does not reference `to_tsvector` or `to_tsquery`.
  - Task 1 ACs: retain tsvector column/trigger work for entities not yet covered by Phase 11 embedding tables; remove language that duplicates `search_project_kb` substrate.
- **Cross-phase coordination:** Phase 11 must expose `search_project_kb` with the options signature from Addendum §5.4; Phase 6 exposes `search_org_kb` per §4.6. Phase 7 task 10 gates on both being merged.
- **Definition of done:**
  - [ ] §2.9 cites ADD-5.4-01 and PRD-17-19/20/21
  - [ ] Task 10 AC forbids tsvector SQL in `global-search.ts` and adds Risk
  - [ ] Phase 11 dependency listed in "Depends On" for Task 10
  - [ ] Phase 1 "Deferred to V2" note for GAP-DASH-020 removed or rescoped

### Fix PHASE-7-GAP-03
- **File(s) to edit:** `PHASE_SPEC.md` §1 (Deferred list), §2.7, §2.8; `TASKS.md` Task 8, Task 9, Task 7
- **Change summary:** Remove GAP-DASH-018 from V2 deferrals and add an Inngest event volume query + UI card. Add team velocity to Task 7 PM dashboard.
- **New content outline:**
  - Add to §2.7: `getInngestEventVolume(projectId, startDate, endDate)` returns `{ eventName, count }[]`. Source: the `InngestEvent` table if present, otherwise a new `event_audit` table populated by an Inngest middleware that logs each event fire (projectId, eventName, timestamp).
  - Task 8 AC adds `getInngestEventVolume` function signature and storage source.
  - Task 9 AC adds "Event Volume" card below task-type breakdown.
  - Task 7 AC adds `velocity: { completedPointsByPast3Sprints: number[], averagePerSprint: number }` and the corresponding UI card.
- **Cross-phase coordination:** None required; event logging middleware is additive.
- **Definition of done:**
  - [ ] PRD-23-12 traced to Task 8/9 ACs
  - [ ] PRD-17-15 velocity requirement traced to Task 7 AC
  - [ ] §1 V2 Deferred list no longer contains GAP-DASH-018

### Fix PHASE-7-GAP-04
- **File(s) to edit:** `PHASE_SPEC.md` §2.13, `TASKS.md` Task 14
- **Change summary:** Add firm-wide monthly cost alert mechanism: aggregate cost across all projects, compare against `FIRM_MONTHLY_COST_CAP_CENTS` env/config, emit `NOTIFICATION_SEND` to firm admins at 80% and 100%.
- **New content outline:**
  - §2.13: add `checkFirmCostCap()` called on a daily Inngest cron; loads config from `src/lib/config/cost-caps.ts`; emits `FIRM_COST_THRESHOLD_WARNING` and `FIRM_COST_CAP_EXCEEDED` notification types.
  - Task 14 AC adds: daily cron schedule, env/config source, recipient list (role = FIRM_ADMIN or similar), and behavior when firm cap hit (does not block projects by default; configurable flag `firmCapBlocksExecution`).
- **Cross-phase coordination:** Phase 8 notification system must define `FIRM_COST_THRESHOLD_WARNING` and `FIRM_COST_CAP_EXCEEDED` event types.
- **Definition of done:**
  - [ ] PRD-23-03 third clause (firm-wide) traced to §2.13
  - [ ] Task 14 AC lists firm-wide check, cron, config source, recipients
  - [ ] Notification event types added to §5 Integration Points

### Fix PHASE-7-GAP-05
- **File(s) to edit:** `PHASE_SPEC.md` §4 (Edge Cases), §2.13; `TASKS.md` Task 14
- **Change summary:** Enumerate concurrency, TZ, and mid-cycle edge cases for cost caps, and pin the `CostCapExceededError` and `NOTIFICATION_SEND` payload shapes.
- **New content outline:**
  - §4 rows added: "Concurrent executeTask at 99% cap" → row-level lock on `Project.monthlyCostCapCents` check via advisory lock keyed by projectId; "Multi-stage pipeline mid-flight" → check runs per stage; "Cap raised after alert" → reset `costCapAlertFiredAt` state so 80% alert can fire again; "Current month TZ" → pinned to UTC; "Daily session limit TZ" → pinned to UTC midnight; "Aborted sessions" → counted toward daily limit (records still exist).
  - §2.13 adds `CostCapExceededError` interface: `{ code: "COST_CAP_EXCEEDED", projectId, currentCents, capCents, userMessage }`.
  - §2.13 adds `NOTIFICATION_SEND` payload shape for COST_THRESHOLD_WARNING/COST_CAP_EXCEEDED: `{ type, projectId, thresholdPct, currentCents, capCents, recipients: string[] }`; dedupe window 24 hours per (projectId, type) in current month.
- **Cross-phase coordination:** Phase 8 notification receiver must handle these types.
- **Definition of done:**
  - [ ] §4 contains the 6 new rows
  - [ ] §2.13 interfaces pinned
  - [ ] Task 14 AC references the interfaces and dedupe window

### Fix PHASE-7-GAP-06
- **File(s) to edit:** `PHASE_SPEC.md` §2.9, `TASKS.md` Task 10
- **Change summary:** Specify Layer 3 auto-activation threshold and resolve the V1 KnowledgeArticle-only contradiction against the expanded entity list.
- **New content outline:**
  - §2.9 adds: auto-activation if Layer 1+2 returns fewer than N results (N=5) OR toggle is on. Layer 3 scope in V1: KnowledgeArticle, OrgComponent (component_embeddings), annotations (annotation_embeddings). Story/Question/Decision/Requirement/Risk semantic deferred to Phase 11's entity-embedding rollout. Toggle behavior: when on and only Layer 1/2-covered entities have results, show "Semantic search not yet available for these entity types" informational chip.
  - Task 10 AC adds: threshold constant, auto-activation branch, informational chip copy.
- **Cross-phase coordination:** Aligns with Phase 11 embedding rollout; no blocking dependency.
- **Definition of done:**
  - [ ] §2.9 states auto-activation threshold = 5
  - [ ] Task 10 AC includes auto-activation test
  - [ ] Contradiction between "toggle enables semantic" and "semantic still only covers KnowledgeArticle" resolved in spec text

### Fix PHASE-7-GAP-07
- **File(s) to edit:** `PHASE_SPEC.md` (add §0 Traceability and §8 Outstanding), `TASKS.md` (add REQ-ID column to summary table)
- **Change summary:** Add a traceability table keyed on PRD/Addendum REQ-IDs, and a proper Outstanding section. Remove the orphan Task 16 row or promote to full task (covered in GAP-01 fix).
- **New content outline:**
  - §0 Traceability table: columns REQ-ID | Source | Covered by §/Task | Status (with every PRD §17 and §23 row from the REQUIREMENT_INDEX scoped to Phase 7).
  - §8 Outstanding for deep-dive: list of items still needing coordination (Phase 2 pipeline signature, Phase 11 `search_project_kb` signature, firm cost cap config location).
  - TASKS.md Summary column adds REQ-IDs per task.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] §0 table includes every Phase 7 row from REQUIREMENT_INDEX
  - [ ] §8 exists
  - [ ] Summary table Task rows cite REQ-IDs
  - [ ] Orphan "Task 16" row aligned with GAP-01 fix

### Fix PHASE-7-GAP-08
- **File(s) to edit:** `PHASE_SPEC.md` §2.4, `TASKS.md` Task 5
- **Change summary:** Add affected-stories list to the Blocking Questions panel.
- **New content outline:**
  - §2.4 output: add `affectedStories: Array<{ storyId, storyDisplayId, storyTitle }>` per blocking question.
  - Task 5 AC: row lists affected stories as links; query includes the join to `QuestionStory` or equivalent.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] §2.4 lists affected stories
  - [ ] Task 5 AC includes affected-stories rendering
  - [ ] PRD-17-04 cited

### Fix PHASE-7-GAP-09
- **File(s) to edit:** `PHASE_SPEC.md` §2.14 (new, from GAP-01), §4
- **Change summary:** Specify cache invalidation interactions between 30-sec debounce, 5-min TTL, and manual refresh.
- **New content outline:**
  - Rule: `PROJECT_STATE_CHANGED` enqueues debounced regeneration at 30-sec window per (project, briefingType). On regeneration, pipeline computes `inputs_hash`; if unchanged and cached entry is <5 min old, skip AI call and bump `generated_at`. Manual refresh bypasses cache entirely and emits `BRIEFING_REGENERATED` event.
  - §4 adds: "State event fires during ongoing regeneration" → enqueue follow-up job, do not dedupe against in-flight.
- **Cross-phase coordination:** Phase 2 pipeline must support `bypassCache` option.
- **Definition of done:**
  - [ ] §2.14 specifies debounce+TTL+refresh interactions
  - [ ] §4 includes in-flight regeneration row
  - [ ] `BRIEFING_REGENERATED` event listed in §5

### Fix PHASE-7-GAP-10
- **File(s) to edit:** `PHASE_SPEC.md` §2.7, §2.8; `TASKS.md` Task 8, Task 9
- **Change summary:** Add weekly aggregation and axis-bucketing behavior for long ranges.
- **New content outline:**
  - Task 8 AC adds `getWeeklyUsageTrend(projectId, startDate, endDate)` returning weekly aggregates.
  - Task 9 AC: when selected range spans ≤31 days → daily points; 32-120 days → weekly; >120 days → monthly. Toggle optional for user override.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Task 8 adds weekly function
  - [ ] Task 9 AC has bucket-switch thresholds
  - [ ] PRD-23-08 cited

---

## 5. Sign-off Checklist

- [x] R1 scored
- [x] R2 scored
- [x] R3 scored
- [x] R4 scored
- [x] R5 scored
- [x] R6 scored
- [x] R7 scored
- [x] R8 scored
- [x] Every Partial/Fail in the Scope Map has a corresponding gap entry
- [x] Every gap has a fix plan entry
- [x] Every fix plan has a concrete definition of done
- [x] No gap uses vague remediation language
- [x] Overall verdict matches scorecard (Not-ready — R2, R3, R8 Fail)
