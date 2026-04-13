# Addendum Integration Plan — Intelligence Layer Architecture

**Date:** April 13, 2026
**Addendum:** PRD-ADDENDUM-v1-Intelligence-Layer.md (April 12, 2026)
**Status:** Reference document for Steps to Ship — Step 2 execution

---

## Purpose

This document is the authoritative integration guide for incorporating PRD Addendum v1 into the BEF phase plan. It answers: what changed, which phases are affected, what each phase needs to do differently, and in what order phases should execute.

Audience: Claude Code sessions executing Steps 2–5 of the shipping workflow.

---

## What the Addendum Changes

The addendum is an architectural refinement, not a scope change. All user-facing behavior, workflows, roles, RBAC, and business requirements remain as specified in the original PRD. What changes is the implementation architecture for two subsystems:

| PRD Section | Before Addendum | After Addendum |
|-------------|----------------|----------------|
| §6 AI Agent Harness | Generic agent loop with task types | Four deterministic pipelines + one narrow freeform agent |
| §13 Org Knowledge Base | Flat component storage with ad-hoc relationships | Five-layer model (Graph, Embeddings, Domains, Annotations, Query Interface) |

Three cross-cutting items were also missing from the PRD and are now locked:

| Item | What It Is |
|------|-----------|
| Model router module | Centralized, intent-based Claude model resolution. No pipeline stage hardcodes a model name. |
| Hybrid retrieval primitive | BM25 (tsvector) + pgvector cosine similarity + reciprocal rank fusion (k=60). Used by all pipelines and the freeform agent. |
| Eval harness | V1 deliverable. JSON fixtures per pipeline, `pnpm eval [pipeline]` runner, CI gate on main branch. |

---

## Phase-by-Phase Impact

### Phase 11 — AI Infrastructure Foundation *(NEW phase)*

**Status:** Needs initial deep-dive
**Execute:** Second (after Phase 1, before Phase 2)
**Parallel with:** Phase 10

This phase exists because the addendum specified these items for Phase 1, which is already done. Rather than amend a complete phase, Phase 11 is the first phase to execute and is a prerequisite for all AI work.

**What to build:**

1. **Schema additions** (migration only — no data ingestion yet):
   - `component_edges` table (Layer 1 of org KB; see Addendum §4.2)
   - Per-entity embedding tables: `question_embeddings`, `decision_embeddings`, `requirement_embeddings`, `risk_embeddings`, `story_embeddings`, `component_embeddings`, `annotation_embeddings`
   - `pipeline_runs` and `pipeline_stage_runs` (observability)
   - `pending_review` (pipeline items awaiting human confirmation)
   - `conflicts_flagged` (contradictions detected by impact assessment)

2. **Model router module** (`src/lib/ai/model-router.ts`):
   ```typescript
   type Intent = 'extract' | 'synthesize' | 'generate_structured' | 'reason_deeply' | 'embed'
   function resolve_model(intent: Intent, override?: ModelOverride): ModelConfig
   ```
   Default mapping: extract → Haiku 4.5 | synthesize/generate_structured → Sonnet 4.6 | reason_deeply → Opus 4.6 | embed → selected provider

3. **Hybrid retrieval primitive** (`src/lib/ai/search.ts`):
   - `search_project_kb(project_id, query, options)` — BM25 + vector + RRF across all project KB entities
   - `search_org_kb(project_id, query, options)` — function signature only; full implementation in Phase 6
   - RRF formula: `score = Σ (1 / (60 + rank_i))` across rank lists
   - **Audit → generalize → relocate (not rewrite):** Existing `src/lib/search/global-search.ts` implements a three-layer hybrid (structured + tsvector + pgvector) used today by `src/lib/agent-harness/context/smart-retrieval.ts`. Phase 11 should generalize and relocate this to `src/lib/ai/search.ts` rather than rebuild. Audit `globalSearch()` first for reuse as the primitive; refactor; retain call sites.

4. **Embedding infrastructure**:
   - Inngest job: enqueue embedding on entity create/update, re-embed only on hash change
   - `embedding_model` column on every embedding table (for future provider migrations)
   - HNSW index creation (via Prisma migration + raw SQL)

5. **Eval harness scaffold** (`/evals/`):
   - Directory structure: `evals/{pipeline_name}/fixtures/`, `expectations.ts`, `runner.ts`
   - `pnpm eval [pipeline]` command
   - 10 labeled fixtures each for Transcript Processing and Answer Logging pipelines
   - CI gate: `pnpm eval all` on PRs touching `src/ai/`, `src/pipelines/`, `prompts/`, `evals/`

**Outstanding decision before deep-dive:**
Embedding provider: Voyage AI (`voyage-3-lite`) vs. OpenAI (`text-embedding-3-small`). Run a quality test with 50 labeled component-to-query pairs. Consider: recall on Salesforce-domain vocabulary, per-token cost at expected volume, data handling posture (no retention, no training contractually required). Store decision in `TECHNICAL_SPEC.md`.

---

### Phase 2 — Harness Hardening + Core Pipelines *(MAJOR UPDATE — needs new deep-dive)*

**Status:** Needs full re-dive. Existing PHASE_SPEC.md is partially valid.
**Execute:** Fourth (after Phase 11)
**Old name:** "Agent Harness, Transcripts"

**What stays from existing spec (all 10 tasks remain valid):**
- Tool bug fix: `create_question` confidence/needsReview/reviewReason fields (REQ-HARNESS-001)
- Output validation re-prompt loop (REQ-HARNESS-002)
- Firm typographic rules module (REQ-HARNESS-003)
- SessionLog entity tracking (REQ-HARNESS-004)
- Rate limiting enforcement (REQ-HARNESS-005)
- Layer 3 context functions: `getRecentSessions`, `getMilestoneProgress` (REQ-HARNESS-006)
- Transcript context enrichment (REQ-HARNESS-007)
- Story generation context expansion (REQ-HARNESS-008)
- General chat history window (REQ-HARNESS-009)
- Needs Review session-end UX (REQ-HARNESS-010)

**What's added (addendum — four pipelines):**

**Transcript Processing Pipeline** (Addendum §5.2.1):
Replaces generic `TRANSCRIPT_PROCESSING` harness task. Each stage is idempotent and retry-safe; stage failure after 3 retries escalates to the human-review queue with partial state preserved. Raw transcript text is always retained on input. Seven stages:
1. Segment (Haiku) — split into speaker turns + chunk to ~500 tokens
2. Extract candidates (Haiku) — structured output: questions, answers, decisions, requirements, risks, action items with confidence
3. Entity resolution (deterministic + hybrid search) — retrieve top-K existing entities per candidate
4. Reconcile (Sonnet) — for each candidate + matches: `create_new | merge_with_existing | update_existing`
5. Apply (deterministic) — auto-apply if confidence > 0.85, else queue in `pending_review`
6. Impact assessment (Sonnet) — unblocked stories, contradicted decisions, new questions raised
7. Log (deterministic) — `pipeline_runs` record + `session_log`

**Answer Logging Pipeline** (Addendum §5.2.2) — NEW, not in original spec:
Handles free-text answers from users. Six stages:
1. Retrieve candidate questions (deterministic + hybrid search)
2. Match (Sonnet) — best matching question or "standalone decision"
3. Apply (deterministic) — update question or create decision
4. Impact assessment (Sonnet) — unblocked items, contradicted decisions, new questions
5. Propagate (deterministic) — apply impacts, create conflict records
6. Annotate org KB (Sonnet) — propose Layer 4 annotations when Salesforce components mentioned

**Story Generation Pipeline** (Addendum §5.2.3):
Replaces generic `STORY_GENERATION` harness task. Seven stages:
1. Assemble context (deterministic) — epic/feature, requirements, Q&A via hybrid search, candidate components via `search_org_kb`
2. Draft story (Sonnet) — structured output per mandatory field schema
3. Validate mandatory fields (deterministic)
4. Component cross-reference (deterministic + hybrid search)
5. Resolve conflicts (Sonnet, only if stage 4 flagged)
6. Typography/branding validator (deterministic)
7. Return draft (deterministic) — persist as `draft` status

**Briefing/Status Pipeline** (Addendum §5.2.4):
Replaces generic `BRIEFING` harness task. Five stages:
1. Fetch metrics (deterministic SQL) — per briefing type, 5-min cache
2. Assemble narrative context (deterministic)
3. Synthesize (Sonnet) — narrative prose per briefing type template
4. Validate (deterministic) — typography, branding, no AI-characteristic phrases
5. Cache and return (deterministic) — `inputs_hash` for cache invalidation

Briefing types: `daily_standup`, `weekly_status`, `executive_summary`, `blocker_report`, `discovery_gap_report`, `sprint_health`

**Freeform Agent** (Addendum §5.3) — "project brain chat":
Built at end of Phase 2. One agent loop in the system. Model: Sonnet 4.6 default, Opus 4.6 for "think harder" mode.

Read tools (no confirmation): `search_project_kb`, `search_org_kb`, `get_sprint_state`, `get_project_summary`, `get_blocked_items`, `get_discovery_gaps`

Write tools (confirmation required in UI before apply): `create_question`, `create_risk`, `create_requirement`

Not available to the agent: story creation, transcript processing, answer logging, document generation, sprint modification. Agent suggests; pipelines execute.

**Orphan TaskType mapping (deep-dive requirement):**
Existing `TaskType` enum values not covered by the four pipelines (`QUESTION_ANSWERING`, `STORY_ENRICHMENT`, `STATUS_REPORT_GENERATION`, `DOCUMENT_GENERATION`, `SPRINT_ANALYSIS`, `CONTEXT_PACKAGE_ASSEMBLY`, `ORG_QUERY`, `DASHBOARD_SYNTHESIS`, `ARTICLE_SYNTHESIS`) must be explicitly re-mapped during the Phase 2 deep-dive: either fold into a pipeline (e.g., `QUESTION_ANSWERING` → Answer Logging), route to a different phase (e.g., `DOCUMENT_GENERATION` → Phase 8), or deprecate. No generic task-type execution remains after Phase 2.

**Model router integration:**
All existing direct Claude calls in `engine.ts` and task files are retrofitted to use `model_router.resolve_model(intent)`. No stage hardcodes a model string.

**Eval harness extension:**
15 labeled fixtures for Story Generation pipeline (per Addendum §5.2.3). Eval assertions: mandatory field presence, semantic similarity of acceptance criteria to gold, component cross-reference accuracy.

---

### Phase 3 — Discovery, Questions *(MODERATE — spec update only, no re-dive)*

**Status:** Existing spec is valid. Needs targeted amendments.
**Execute:** Fifth (after Phase 2)

**What changes:**
- Question embeddings: enqueue via Phase 11 infrastructure on `question.create` and `question.update` (hash-based re-embed). Questions are now searchable via `search_project_kb`.
- Answer Logging Pipeline (Phase 2) is the implementation path for "answering a question." Phase 3 wires the UI answer submission form to call the pipeline, not a direct server action.
- Transcript Processing Pipeline (Phase 2) is the implementation path for transcript-driven discovery. Phase 3 verifies the UI trigger path is correct.
- `search_project_kb` covers questions by Phase 3 — verify in retrieval tests.

**What does not change:** Question lifecycle states, gap detection, readiness assessment, discovery workflow, blocking prioritization, pagination. All unchanged externally.

**Spec update instructions:**
Amend `docs/bef/03-phases/phase-03-discovery-questions/PHASE_SPEC.md`:
- Add note in §3 (Technical Approach) that answer submission triggers Answer Logging Pipeline, not a direct action
- Add task for question embedding enqueue in `TASKS.md`
- Update integration points to reference pipelines built in Phase 2

---

### Phase 4 — Work Management *(MODERATE — spec update only, no re-dive)*

**Status:** Existing spec is valid. Needs targeted amendments.
**Execute:** Sixth (after Phase 2, parallel with Phase 3)

**What changes:**
- Story Generation now runs as the deterministic pipeline (§5.2.3) from Phase 2. Phase 4 wires the story generation UI trigger to call the pipeline instead of the generic harness task type.
- Story embeddings: enqueue via Phase 11 infrastructure on `story.create` and `story.update`.
- Mandatory field validation is now a deterministic stage inside the pipeline — Phase 4 does not need to re-implement this separately; it verifies the UI reflects pipeline validation errors correctly.
- Eval harness for Story Generation is owned in Phase 2; Phase 4 may add integration-level tests if needed.

**What does not change:** Epic/Feature/Story CRUD, Kanban views, status machines, dual-mode component selector, test case stub generation, enrichment dedup.

**Spec update instructions:**
Amend `docs/bef/03-phases/phase-04-work-management/PHASE_SPEC.md`:
- Update story generation section to reference Story Generation Pipeline
- Add story embedding enqueue task
- Update integration points

---

### Phase 6 — Org, Knowledge — Five-Layer Model *(MAJOR UPDATE — needs new deep-dive)*

**Status:** Existing PHASE_SPEC.md is partially valid. Major architectural changes required.
**Execute:** Seventh (after Phase 11 + Phase 2)
**Old name:** "Org, Knowledge"

**What stays from existing spec:**
- PKCE on OAuth Web Server Flow (REQ-ORG-001) — unchanged
- Automated incremental sync cron with needsAssignment + soft-delete (REQ-ORG-002) — unchanged logic, enhanced with sync reconciliation algorithm
- Sync schedule configuration UI (REQ-ORG-003) — unchanged
- KnowledgeArticle confirmation model (REQ-ORG-007) — unchanged
- Planned component creation from story execution (REQ-ORG-009) — unchanged
- Planned component status upgrade during sync (REQ-ORG-013) — unchanged

**What's replaced/expanded (five-layer model):**

**Layer 1 — Component Graph** (replaces flat org_components):
- `component_edges` table (schema exists from Phase 11) — Phase 6 populates during sync
- Sync reconciliation algorithm per Addendum §4.7:
  1. Match by `salesforce_metadata_id` first (durable identity)
  2. Fallback: match by `(api_name, component_type, parent_component_id)`
  3. No match: create new
  4. Rename detected: record in `component_history`, update `api_name`, preserve annotations + domain memberships + edges
  5. After sync: soft-archive any component not seen in current sync (`status = archived`)
- Unresolved references: `component_edges` with `target_component_id = null` and `unresolved_reference_text` for dynamic SOQL/Apex callouts
- Managed package handling: namespace-scoped, excluded from AI domain proposals by default

**Layer 2 — Semantic Embeddings:**
- `component_embeddings` table (schema from Phase 11) — populate on sync
- Embedded text: deterministic concatenation of api_name, label, description, help_text; for Apex: class comments + first 50 lines; for flows: label, description, element names; for validation rules: error message + formula comments
- Re-embed only if `embedded_text_hash` changed (bounded cost)
- HNSW index on `embedding` column (cosine distance)

**Layer 3 — Business Domains** (extends/replaces DomainGrouping):
- `domains` and `domain_memberships` tables (see Addendum §4.4 for full schema)
- Many-to-many: one component can belong to multiple domains
- `source` enum: `ai_proposed | human_asserted`; `status` enum: `proposed | confirmed | archived`
- **Brownfield initial domain proposal** via Claude Managed Agents: walks Layer 1 graph, clusters by structural relationships + semantic similarity, proposes domains + memberships + rationales. Writes `source = ai_proposed, status = proposed`. Architect confirms in UI. Runs once per project at initial ingestion.
- Domain review nudge: when new fields added to an object whose existing fields are domain members, notify architect
- Managed package components excluded from AI proposals by default (project setting can override)
- Existing `DomainGrouping` records should be migrated to `domains` during Phase 6

**Layer 4 — Business Context Annotations** (extends/replaces BusinessContextAnnotation):
- `annotations` table: polymorphic (`entity_type + entity_id` covers `component | edge | domain`)
- `annotation_embeddings` table for annotation-level semantic search
- `source` enum: `human | ai_derived_from_discovery`
- Answer Logging Pipeline (Phase 2) proposes annotations when a decision mentions Salesforce components by name or concept — architect confirms or rejects
- Annotations follow entities through renames (matched by ID, not by name)
- Existing `BusinessContextAnnotation` records should be migrated to `annotations`

**Layer 5 — Query & Retrieval Interface:**
- Full `search_org_kb()` implementation (function signature exists from Phase 11):
  - BM25 over `org_components.api_name`, `org_components.label`, `org_components.raw_metadata`, `annotations.content`
  - Vector similarity over `component_embeddings.embedding` and `annotation_embeddings.embedding`
  - RRF merge, filter by entity_types/component_types/domain_ids, expand to 1-hop neighbors if requested
- Context Package Assembly (Phase 5) calls `search_org_kb` — Phase 6 must be complete before Phase 5 can fully implement Context Package Assembly

**Org Health Assessment** (Managed Agents, Addendum §4.8) — RESTORED from V2 deferral:
- Long-running (30min–2hr), triggered by architect at project setup for rescue engagements
- Deterministic analyses: test coverage, governor limit risk patterns, sharing model review, FLS compliance, hardcoded ID detection, tech debt inventory
- Outputs: `org_health_reports` record + generated Word document via document pipeline
- Uses Claude Managed Agents (Opus 4.6 for `reason_deeply` intent)
- Cost ceiling: $25 default per run (architect-override for complex rescue engagements)

**Full knowledge refresh pipeline** (REQ-ORG-004): updated to use Layer 3/4 domain and annotation structure. KnowledgeArticle creation and confirmation model remain.

**NLP org query API** (REQ-ORG-010): updated to call `search_org_kb` (Layer 5) instead of ad-hoc queries. Three-tier fallback approach (regex → full-text → semantic) remains.

---

### Phase 5 — Sprint, Developer API *(MODERATE — spec update only, no re-dive)*

**Status:** Existing spec needs amendments. Dependency on Phase 6 is new.
**Execute:** Eighth (after Phase 4 AND Phase 6)

**What changes:**
- **Context Package Assembly** is now a specified deterministic pipeline (Addendum §4.6), not an agent loop. Nine steps:
  1. Fetch story + acceptance criteria + parent epic/feature
  2. Read `story.impacted_components` (Layer 1 component IDs)
  3. For each component: fetch + 1-hop neighbors via `component_edges`, domain memberships, annotations
  4. For each unique domain: fetch domain description + annotations
  5. Fetch related discovery Q&A via `search_project_kb` (story description as query)
  6. Fetch in-flight stories sharing any impacted component (coordination flags)
  7. Apply token budget (target 20k tokens); trim by lowest semantic similarity if over
  8. Single Sonnet call: generate 200-word "context brief" header
  9. Return structured package
  
  Latency target: <3s p95. Only one LLM call (step 8). Everything else is SQL + vector search.

- **Sprint health briefing** now calls the Briefing/Status Pipeline (Phase 2) with `briefing_type = sprint_health` instead of a custom AI call.

- **Phase 6 is now a dependency.** `search_org_kb` (Layer 5) must exist for step 5 of Context Package Assembly. Phase 5 cannot fully implement the context package until Phase 6 is complete.

**What does not change:** Capacity assessment, parallelization groups, developer attribution, API key expiry/rotation, brownfield warning, component report endpoint.

**Spec update instructions:**
Amend `docs/bef/03-phases/phase-05-sprint-developer/PHASE_SPEC.md`:
- Update Context Package Assembly spec per Addendum §4.6 (nine steps, <3s p95 target)
- Add Phase 6 to dependencies
- Update sprint health briefing to reference Briefing/Status Pipeline

---

### Phase 7 — Dashboards, Search *(MODERATE — spec update only, no re-dive)*

**Status:** Existing spec is largely valid. Targeted amendments needed.
**Execute:** Ninth (after Phase 5 + Phase 6)

**What changes:**
- **Briefing generation** now routes through the Briefing/Status Pipeline (Phase 2). Phase 7 calls the pipeline with the appropriate `briefing_type` — it does not implement its own AI generation.
- **Dashboard metrics are deterministic SQL.** No AI generates the numbers; Sonnet synthesizes narrative prose around deterministic metrics. Phase 7 should ensure all dashboard data comes from SQL queries, not AI inference.
- **Search substrate** is `search_project_kb` (Phase 11 + Phase 11 hybrid retrieval). Phase 7 builds the UI over this function. The three new entity type expansions (Story, OrgComponent, BusinessProcess) should resolve to Layer 1/2 queries via `search_org_kb` for org entities.

**What does not change:** Project overview, sprint analytics, team productivity view, risk/decision dashboards, filter UI, Usage & Costs tab, audit logging.

---

### Phase 8 — Documents, Notifications *(MINOR — spec update only)*

**Status:** Existing spec is valid. Minor amendments for pipeline integration.
**Execute:** Tenth (after Phase 7)

**What changes:**
- **Pipeline notifications:** `pending_review` items (from Transcript Processing and Answer Logging pipelines) generate notifications when queued — Phase 8 wires these into the notification dispatch infrastructure. `conflicts_flagged` records also trigger notifications.
- Pipeline run history may surface in notification activity feed if time permits.

**What does not change:** Document templates, Word/PPT/PDF generation, branding admin, notification delivery, recipient resolution, all 14 notification event types.

---

### Phase 9 — QA, Jira, Archival, Lifecycle *(MINIMAL — review only)*

**Status:** Existing spec appears valid. Review only.
**Execute:** Eleventh (after Phase 8)

**What to check:**
- Test case generation uses Story Generation Pipeline output (acceptance criteria from pipeline stage 7) — verify there's no conflict.
- Otherwise no material changes expected.

---

### Phase 10 — Work Tab UI Overhaul *(UNCHANGED)*

**Status:** Existing spec is valid. No addendum impact.
**Execute:** Third (parallel with Phase 11)

---

## New Data Model Entities

All entities below are new additions from the addendum. Schema goes in Phase 11 (infrastructure tables) or Phase 6 (org knowledge tables).

### Phase 11 Schema Additions

| Table | Purpose |
|-------|---------|
| `component_edges` | Layer 1: edges between org components (relationship types, unresolved references) |
| `question_embeddings` | Per-entity embedding for `search_project_kb` |
| `decision_embeddings` | Per-entity embedding |
| `requirement_embeddings` | Per-entity embedding |
| `risk_embeddings` | Per-entity embedding |
| `story_embeddings` | Per-entity embedding |
| `pipeline_runs` | Observability: which pipelines ran, inputs, outputs, cost |
| `pipeline_stage_runs` | Per-stage trace within a pipeline run |
| `pending_review` | Items from pipelines awaiting human confirmation |
| `conflicts_flagged` | Contradictions detected by impact assessment |
| `unresolved_references` (materialized view) | Materialized view over `component_edges` where `target_component_id IS NULL`; surfaces dynamic SOQL/Apex callouts and feeds Org Health findings |

> Footnote: `eval_runs` (Addendum §7) is an optional persistence table (file-only vs. DB persistence to be decided) and is deferred unless needed.

### Phase 6 Schema Migrations (existing models)

These are not clean additions. Each requires a migration path, back-fill, and (where noted) a dual-write transition.

| Existing model | Target | Migration work |
|----------------|--------|----------------|
| `DomainGrouping` | `domains` | Rename; add `source` enum (`ai_proposed | human_asserted`), `status` enum (`proposed | confirmed | archived`), `archived_reason` fields |
| `BusinessContextAnnotation` | `annotations` | Polymorphic rewrite with `entity_type` + `entity_id` (covers `component | edge | domain`); add `content_type`, `source` (`human | ai_derived_from_discovery`), `status` fields |
| `OrgComponent.embedding` (inline `vector(1536)` column) | `component_embeddings` table | Extract column into parallel table; add `embedded_text`, `embedded_text_hash`, `embedding_model`; include back-fill strategy and drop-column step |
| `KnowledgeArticle.embedding` (inline `vector(1536)` column) | Decide and document | Decide fate (retain inline, migrate to parallel table, or deprecate) during Phase 6 deep-dive |

### Phase 6 Schema Additions (truly new)

| Table | Purpose |
|-------|---------|
| `component_history` | Rename/modification audit trail per component |
| `domain_memberships` | Layer 3: many-to-many component-to-domain |
| `annotation_embeddings` | Layer 4: semantic search over annotations |
| `org_health_reports` | Org Health Assessment output records |

> Footnote: `annotation_versions` (Addendum §4.5) is an optional persistence table deferred unless needed.

### Phase 2 Schema (extends existing models)

Phase 2 extends the existing `Conversation` + `ChatMessage` + `ConversationType` models already in `prisma/schema.prisma`. Add an `agent_conversation_type` value or reuse `ConversationType` enum values (e.g., `GENERAL_CHAT` maps to the freeform agent). No new top-level table is required unless agent-specific metadata demands it.

---

## Tech Stack Additions

| Component | Technology | Notes |
|-----------|-----------|-------|
| Vector extension | pgvector | Already in Neon; confirm HNSW index support enabled |
| Embedding provider | Voyage AI or OpenAI | Decision at Phase 11 start |
| Eval harness | Custom lightweight | `pnpm eval [pipeline]`, JSON fixtures, CI gate |
| Claude Managed Agents | Claude API | Phase 6 only: Org Health Assessment + brownfield domain proposal |

**Background job runner:** Inngest — already locked (18 function stubs exist, CLAUDE.md is definitive).

---

## Outstanding Decisions

| Decision | When Needed | Recommendation |
|----------|------------|----------------|
| Embedding provider | Phase 11 deep-dive | Run quality test on 50 Salesforce component-to-query pairs. Voyage AI `voyage-3-lite` is cheaper; OpenAI `text-embedding-3-small` is more mature. Confirm data handling posture (no retention, no training). |
| RRF k constant | Phase 11 implementation | Start with k=60 (standard default). Tune during Phase 11 using labeled test pairs. |
| Domain proposal confidence threshold | Phase 6 | Start at manual-review-for-all; revisit after first 5 brownfield projects. |
| Org Health Assessment cost ceiling | Phase 6 | Default $25 per run; architect-override for rescue engagements. |
| Embedding migration strategy | Future (post-V1) | Document in Phase 11 spec: dual-write during transition window, incremental re-embedding job. |
| Rename collision edge case | Phase 6 implementation | Per Addendum §8.F: "If a Salesforce metadata ID is reused after a component is deleted and a new component is created with the same `api_name`, the sync may produce ambiguous matches. Current rule: match by ID first; if ID mismatch, treat as new component. Validate this behavior with an edge-case fixture in Phase 3." |

---

## Phases Requiring New Deep-Dives

| Phase | Type | Reason |
|-------|------|--------|
| Phase 11 | Initial deep-dive | New phase |
| Phase 2 | Full re-dive | Pipeline decomposition replaces generic harness; scope doubled |
| Phase 6 | Full re-dive | Five-layer model replaces flat structure; Managed Agents added; Org Health Assessment restored |

## Phases Requiring Spec Updates Only

| Phase | What to Update |
|-------|---------------|
| Phase 3 | Answer Logging Pipeline as answering path; question embeddings |
| Phase 4 | Story Generation Pipeline as generation path; story embeddings |
| Phase 5 | Context Package Assembly per §4.6; Phase 6 dependency; Briefing Pipeline for sprint health |
| Phase 7 | Briefing Pipeline for narrative synthesis; hybrid search substrate reference |
| Phase 8 | pending_review + conflicts_flagged notification wiring |
| Phase 9 | Review only |

---

## What This Addendum Does NOT Change

For clarity when executing phases — these are preserved exactly as in PRD v2.1:

- All user-facing workflows (discovery, story management, sprint management, QA, document generation, Jira sync, archival)
- All role capabilities and RBAC matrix
- All security and data handling posture in PRD §22 (embeddings provider exception added in §3.2)
- All six Salesforce development guardrails (PRD §15) — enforced in Claude Code skills, not web app
- All scope exclusions in PRD §24
- Tech stack (Next.js, Postgres, Prisma, Clerk, S3/R2, Vercel, Inngest)
- Engagement types, project lifecycle
