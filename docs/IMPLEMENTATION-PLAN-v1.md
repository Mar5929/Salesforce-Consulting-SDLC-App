# Implementation Plan v1: Salesforce Consulting AI Framework

**Date:** 2026-04-13
**Source documents:** `docs/bef/00-prd/PRD.md`, `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` (authoritative where they conflict), `docs/bef/03-phases/phase-{01..10}/`
**Scope:** Closes the delta between the current codebase state and PRD v2.1 + Addendum v1.

---

## 0. How to Read This Plan

The base PRD and the Intelligence Layer Addendum are both authoritative. Where they conflict, the Addendum wins. The BEF phase files (`docs/bef/03-phases/phase-XX/`) were drafted in April 2026 before the Addendum landed; they are accurate for the gap backlog they were written against, but their **phase scoping does not match the Addendum's Section 6 build sequence**. This plan resequences them accordingly.

Complexity sizing used throughout: **S** = half-day or less, **M** = one to three days, **L** = one full week, **XL** = more than one week (consider decomposition).

---

## 1. Current-State Inventory (mapped to PRD + Addendum requirements)

### 1.1 Data layer

| Area | State | PRD/Addendum mapping |
|---|---|---|
| Prisma schema | 51 models, 1408 lines. Covers projects, work hierarchy, discovery entities, org KB Layers 1/3/4, chat, transcripts, documents, QA, Jira, audit tables. | Covers PRD §5.2 and most of Addendum §7, **except** pgvector embedding tables, `pipeline_runs` / `pipeline_stage_runs` observability tables, `component_edges` (may exist as `OrgRelationship`, needs verification), HNSW indexes. |
| Migrations | `prisma/migrations/` present. | Schema evolution path established. |
| pgvector extension | Not enabled. | Addendum §2 item 2, §3.1: **required**. |
| `*_embeddings` tables | Not present. | Addendum §4.3, §5.4: **required**. |
| Version fields for OCC | Added in Phase 1 (task 14). | PRD §19: groundwork complete. |

### 1.2 Auth, RBAC, security (Phase 1 complete)

All 14 Phase 1 tasks shipped:
- Removed-member auth bypass closed (`getCurrentMember` filters status).
- Role gates added to epic/feature/sprint/milestone/transcript-entity-deletion writes + settings page.
- Story status machine corrected (BA manages work, SA permitted on both groups).
- Org disconnect restricted to SA; archive/reactivate restricted to SA + PM.
- Prompt injection defense added to transcript processing.
- Centralized token field stripping in API responses.
- Version fields added to entities.

### 1.3 AI harness (partial, pre-Addendum design)

Location: `src/lib/agent-harness/`.

- **Engine** (`engine.ts`): single-turn + agent loop execution exists.
- **Task definitions** (`tasks/`): transcript-processing, story-generation, enrichment, briefing-generation, dashboard-synthesis, question-answering.
- **Tool handlers** (`tools/`): create_question, create_decision, create_story_draft, create_requirement, create_risk, update_question_status.
- **Context assembly** (`context/`): Layer 3 context modules for epics-features, stories, questions, decisions, org-components, business-processes, article-summaries, chat-context, and a smart-retrieval BM25 + embedding stub.
- **Sanitization**: HTML/script stripping.

**Addendum impact:** this matches the "generic harness" design that §5 and §9.2 say must be **decomposed into four deterministic pipelines** plus one narrow freeform agent. External API shape can be preserved; internals change. `smart-retrieval` already references BM25 + embedding, suggesting some wiring exists but the embedding substrate does not.

### 1.4 Model routing

No centralized model router module exists. Calls to `@anthropic-ai/sdk` are presumed to hardcode model names per call site. Addendum §2 item 6 and §5.5 require a central router (Haiku for extract/classify/route, Sonnet for synthesis, Opus for long-horizon).

### 1.5 Background jobs (Inngest, 15+ functions)

Present under `src/lib/inngest/functions/`:
metadata-sync, org-ingestion, transcript-processing, dashboard-synthesis, pm-dashboard-synthesis, article-refresh, notification-dispatch, jira-sync, embedding-batch (stub or active — needs confirmation), question-impact, question-impact-assessment (apparent duplicate; Phase 3 unification task targets this), sprint-intelligence, staleness-detection, document-generation, audit-log.

**Addendum impact:** Inngest is the de facto choice but not formally ratified. See Gating Decision 2.

### 1.6 App routes (Next.js App Router)

Covered areas: auth, dashboard (home), project creation, per-project work/backlog/chat/dashboard/defects/documents/knowledge/questions/org/qa/jira/roadmap/search/pm-dashboard/settings/sprints/notifications. API routes exist for Inngest webhook, chat, per-project search, and Context Package.

Maturity varies: UI scaffolding is broadly in place, but many detail pages are placeholders per recent commits (`34bf6d1 feat: add editing and empty-state placeholders to epic, feature, and story detail pages`).

### 1.7 Evaluation harness

Does not exist. Addendum §5.6 and §9.4 item 4 make this a V1 deliverable, scoped to Phase 1. Required: JSON fixtures per pipeline, `pnpm eval [pipeline]` runner, CI gate on main. 10 fixtures each for Transcript Processing and Answer Logging at minimum for Phase 1.

### 1.8 Org KB layers

| Layer | State |
|---|---|
| L1 Component graph | `OrgComponent`, `OrgRelationship` models present. Sync scaffolding in `org-ingestion.ts`. **`component_edges` may need rename or verification.** |
| L2 Semantic embeddings | **Not built.** No pgvector, no `component_embeddings`. |
| L3 Business domains | `DomainGrouping`, `BusinessProcess`, `BusinessProcessComponent`, `BusinessProcessDependency` present. UI under `/org`. AI-proposed domain flow not yet wired to Managed Agents. |
| L4 Annotations | `BusinessContextAnnotation` model present. CRUD/UI status unclear; listed as deferred in Phase 6. |
| L5 Query interface | `/api/[projectId]/search` and `/api/[projectId]/context-package` routes exist but must be rewritten against the hybrid retrieval primitive. |

### 1.9 BEF phase execution status

From `docs/bef/PROJECT_STATE.md`:

| Phase | Tasks | Done | Notes |
|---|---|---|---|
| 1 RBAC, Security | 14 | 14 | Complete. |
| 2 Agent Harness, Transcripts | 10 | 0 | Specced. Predates Addendum. |
| 3 Discovery, Questions | 13 | 0 | Specced. |
| 4 Work Management | 9 | 0 | Specced. |
| 5 Sprint, Developer API | 12 | 0 | Specced. |
| 6 Org, Knowledge | 13 | 0 | Specced. |
| 7 Dashboards, Search | 15 | 0 | Specced. |
| 8 Documents, Notifications | 9 | 0 | Specced. |
| 9 QA, Jira, Archival | 11 | 0 | Specced. |
| 10 Work Tab UI Overhaul | 12 | 0 | Specced; recommended to run second in BEF plan. |

**Total remaining BEF tasks: 104.** This plan layers Addendum work on top of that backlog.

---

## 2. Gap Analysis

### 2.1 Built correctly (keep as-is)

- Clerk auth integration and RBAC wrappers.
- Prisma schema for work hierarchy, discovery entities, chat, transcripts, documents, QA, Jira, audit tables.
- Inngest job runtime.
- App Router route structure; role gates on writes.
- Token field stripping and HTML sanitization.
- Phase 1 RBAC fixes (all 14 tasks).

### 2.2 Needs refactoring (existing code, new shape)

| Area | Current | Target | Effort |
|---|---|---|---|
| AI harness | Generic agent loop with task modules. | Four deterministic pipelines (Transcript Processing, Answer Logging, Story Generation, Briefing/Status) per Addendum §5.2. Each pipeline is a fixed-stage DAG with typed inputs/outputs. | L per pipeline, 4 pipelines. |
| Claude API call sites | Direct SDK calls, hardcoded models. | All calls go through a central `modelRouter.ts` that resolves model by intent (extract / synthesize / long-horizon). | M. |
| Org relationships | `OrgRelationship` table. | Confirm alignment with Addendum's `component_edges` shape; rename or migrate if needed. | S–M. |
| Retrieval (smart-retrieval stub) | Partial BM25 + embedding reference code in `context/smart-retrieval`. | Replace with shared `search_project_kb` / `search_org_kb` primitive using Postgres tsvector + pgvector + RRF. | M. |
| Context Package API | Route exists at `/api/[projectId]/context-package`. | Rewrite output contract against Addendum §4.6 (Tier-1 + Tier-2 structure). | M. |
| Duplicate Inngest function | `question-impact.ts` and `question-impact-assessment.ts`. | Unify into one function with conflict detection + downstream actions (Phase 3 task 8). | S. |

### 2.3 Missing entirely (new work)

1. **pgvector extension + embedding tables** for questions, decisions, requirements, risks, stories, sessions, org components, annotations. HNSW indexes.
2. **Embedding provider integration** (Voyage or OpenAI, per Gating Decision 1). Batching, retry, backoff.
3. **Embedding enqueue on write**: every create/update of an embeddable entity fans out to Inngest.
4. **Hybrid retrieval primitive** shared by pipelines and freeform agent.
5. **Model router module** with intent-based resolution.
6. **Eval harness**: runner, fixtures format, CI gate, 10 fixtures each for Transcript Processing + Answer Logging at Phase 1.
7. **Pipeline observability tables**: `pipeline_runs`, `pipeline_stage_runs`.
8. **Freeform agent ("Project Brain Chat")**: built at end of Phase 2 per Addendum §5.3.
9. **Managed Agents integration** for Org Health Assessment and brownfield domain proposal. Cost cap field on Project.
10. **Layer 4 annotations CRUD UI** (if unbuilt) and confidence/status on Layer 3 domain proposals.
11. **Discovery AI features**: gap detection, readiness assessment, blocking-priority ranking (Phase 3 tasks 10–12).
12. **Story generation pipeline** (story creation from accepted requirements) with test case stub generation, DRAFT→READY validation gate, dual-mode component selector (Phase 4 + 5 tasks).
13. **Context Package API** end-to-end contract for Claude Code skills (Phase 5).
14. **Document generation** typographic rules module + Briefing/Status pipeline wiring (Phase 2 task 2 + Phase 8).
15. **Firm-level policy surfaces**: rate limits, per-consultant daily cap, per-project monthly cost cap, usage dashboard (Phase 2 + Phase 7).
16. **Jira one-directional sync**: field mapping UI, bidirectional defect sync (Phase 9).
17. **Project archival and reactivation** (Phase 9).
18. **Full dashboard sections**: discovery, team, PM (15 Phase 7 tasks).
19. **Work Tab UI overhaul** (Phase 10, 12 tasks).

### 2.4 BEF phase plan misalignment with Addendum §6

- **Phase 1 (BEF)** is scoped to RBAC/security only. Addendum §6.1 adds pgvector, embeddings, model router, eval harness, retrieval primitive, and Layer 1 schema (L1 already exists, so that subset is partially satisfied). **Phase 1 is not actually done**: it is done for RBAC but the Addendum moved more scope into Phase 1 after the BEF doc was written.
- **BEF Phase 4 ("Work Management")** contains tasks the Addendum places in Phase 2 (story generation pipeline, test case stubs, org KB cross-reference during generation). These belong with Addendum Phase 2.
- **BEF Phases 2, 3, 4 do not map 1:1 to Addendum Phases 2, 3, 4**. This plan resequences.

---

## 3. Resequenced Phased Work Breakdown

The canonical sequence below follows Addendum §6. BEF phase files remain the detailed specs for their task contents; this plan redistributes them.

### Phase A: Foundation Extension (Addendum §6.1 deltas on top of completed Phase 1 RBAC)

**Goal:** Install the retrieval, embedding, routing, and eval substrate the next three phases depend on. Nothing else can proceed correctly without this.

**Prerequisites:** Gating Decisions 1, 2, 3, 4 confirmed (see Section 4).

| # | Task | Files | Depends on | Complexity | Open questions |
|---|---|---|---|---|---|
| A1 | Enable pgvector on dev + prod Postgres. Verify Neon config. | `prisma/schema.prisma` (extensions block), deploy scripts | — | S | None. Confirm Neon plan tier supports HNSW. |
| A2 | Embedding provider client + key management. | `src/lib/embeddings/client.ts` (new), `src/env.ts`, `.env` | Gating Decision 1 | M | Batch size and rate limits differ per provider. |
| A3 | Add embedding tables to schema: `ProjectKbEmbedding` (polymorphic entity_type + entity_id), `OrgComponentEmbedding`, `AnnotationEmbedding`. HNSW indexes via raw SQL migration. | `prisma/schema.prisma`, `prisma/migrations/...` | A1 | M | Polymorphic join vs. per-entity table. Recommend polymorphic with composite unique (entity_type, entity_id, embedding_model). |
| A4 | Embedding enqueue hook: on create/update of embeddable entity types, fire `embedding/enqueue` Inngest event. | `src/actions/*` (each write action), `src/lib/inngest/events.ts` | A3 | M | Which entity types embed at Phase 1? Minimum per §6.1: questions, decisions, requirements, risks, sessions. |
| A5 | Embedding batch Inngest function (likely existing stub). Fan-out with checkpoint, retry, store vectors. | `src/lib/inngest/functions/embedding-batch.ts` | A2, A3 | M | None. |
| A6 | Hybrid retrieval primitive: `search_project_kb({ query, projectId, entityTypes, k })` returning BM25 + vector results fused via RRF. | `src/lib/retrieval/search-project-kb.ts` (new) | A3, A5 | M | Weighting/k for RRF. Default k=60 per Addendum §8; tune during eval. |
| A7 | Model router module with intent enum (`EXTRACT`, `CLASSIFY`, `ROUTE`, `SYNTHESIZE`, `RECONCILE`, `GENERATE`, `LONG_HORIZON`). Returns model + default params. | `src/lib/ai/model-router.ts` (new) | Gating Decision 3 | S | Should we version the routing policy? Recommend yes, stored as constant `MODEL_ROUTER_VERSION`. |
| A8 | Retrofit existing `@anthropic-ai/sdk` call sites to use model router. | All files importing `Anthropic` | A7 | M | None; mechanical refactor. |
| A9 | Pipeline observability tables: `pipeline_runs`, `pipeline_stage_runs`. | `prisma/schema.prisma` | — | S | Retention period? Recommend 90 days aligned with `ApiRequestLog`. |
| A10 | Eval harness scaffold: fixture format, runner script, CI gate on main. | `eval/` (new), `.github/workflows/`, `package.json` scripts | A7 | M | Fixture storage: JSON in repo vs. separate bucket? Recommend in-repo for V1. |
| A11 | Transcript Processing eval fixtures (10). | `eval/fixtures/transcript-processing/` | A10 | M | Source material for fixtures; can we use anonymized prior engagement transcripts? |
| A12 | Answer Logging eval fixtures (10). | `eval/fixtures/answer-logging/` | A10 | M | Same as A11. |
| A13 | Cost ceiling field on Project + enforcement hook in model router (daily/monthly). | `prisma/schema.prisma`, `src/lib/ai/model-router.ts`, `src/actions/pm-dashboard/*` | A7 | M | Default caps. Recommend $25/project/month Managed Agents cap per Addendum §8.C; $0/day consultant cap (unlimited) until firm sets policy. |

**Phase A exit criteria:**
- Any embeddable entity write produces an embedding within one minute.
- `search_project_kb` returns merged BM25 + vector results with < 500 ms p95 for 10k-entity projects.
- Every Claude call in the codebase routes through `modelRouter`.
- `pnpm eval transcript-processing` and `pnpm eval answer-logging` both run and pass on main.
- CI gate blocks merges on eval regression beyond threshold.

### Phase B: Pipeline Decomposition + Agent Harness Hardening (Addendum §6.2 + BEF Phase 2)

**Goal:** Refactor the generic harness into the four pipelines; harden the remaining harness surface area (rate limiting, output validation, typographic rules, context loaders, Needs Review UX).

| # | Task | Files | Depends on | Complexity | Open questions |
|---|---|---|---|---|---|
| B1 | Pipeline framework: stage DAG, typed input/output, checkpoints, `pipeline_runs` integration. | `src/lib/pipelines/framework.ts` (new) | A9 | L | Should stages be Inngest steps or in-process? Recommend Inngest steps for durability. |
| B2 | Refactor Transcript Processing into pipeline (parse → extract Q → extract D → synthesize → persist). | `src/lib/pipelines/transcript-processing/*`, replaces `agent-harness/tasks/transcript-processing.ts` | B1, A6, A7 | L | External API to UI must not change. |
| B3 | Refactor Answer Logging into pipeline (ingest answer → classify impact → detect conflicts → propagate to stories/questions). | `src/lib/pipelines/answer-logging/*` | B1, A6, A7 | L | Overlaps with Phase 3 BEF task 8 (unify impact assessment). Merge the two work streams. |
| B4 | Refactor Story Generation into pipeline (gather context → draft → validate required fields → generate test stubs → persist DRAFT). | `src/lib/pipelines/story-generation/*` | B1, A6, A7 | L | Validation gate is the BEF Phase 4 DRAFT→READY work. |
| B5 | Refactor Briefing/Status generation into pipeline (retrieve metrics → synthesize narrative → apply typographic rules → render). | `src/lib/pipelines/briefing/*` | B1, B9 | L | Dashboard synthesis + status report + document synthesis are variants. Parameterize. |
| B6 | Fix `create_question` tool: populate `confidence`, `needsReview`, `reviewReason`. (BEF Phase 2 task 1.) | `src/lib/agent-harness/tools/create-question.ts` | — | S | None. |
| B7 | Output validation + re-prompt loop for tool outputs. (BEF Phase 2 task 3.) | Pipeline framework hooks | B1 | M | Max retry count. Recommend 2. |
| B8 | SessionLog entity tracking: populate entities created/modified, tokens, cost. (BEF Phase 2 task 4.) | `src/lib/pipelines/framework.ts` | B1 | S | None. |
| B9 | Firm typographic rules module (no em dashes, banned phrases). (BEF Phase 2 task 2.) | `src/lib/text/firm-style.ts` (new) | — | S | Should it be rule-based post-processor or a prompt guardrail? Recommend both (belt and braces). |
| B10 | Rate limiting enforcement (per API key per minute + per consultant daily + per project monthly). (BEF Phase 2 task 5.) | `src/lib/ai/rate-limit.ts`, middleware on API routes | A13 | M | Storage: Redis vs. Postgres counter. Recommend Postgres counter for V1; revisit if hot. |
| B11 | Context loaders: `getRecentSessions`, `getMilestoneProgress`. (BEF Phase 2 task 6.) | `src/lib/agent-harness/context/*` | — | S | None. |
| B12 | Transcript context enrichment wiring. (BEF Phase 2 task 7.) | `src/lib/pipelines/transcript-processing/*` | B2 | S | None. |
| B13 | Story generation context loader expansion (include org KB cross-refs once Phase C lands). | `src/lib/pipelines/story-generation/*` | B4, C3 (soft) | M | Can ship without org KB first, layer in later. |
| B14 | General chat history window. (BEF Phase 2 task 9.) | `src/lib/agent-harness/context/chat-context.ts` | — | S | Window size. Recommend 20 messages or 8k tokens, whichever smaller. |
| B15 | Needs Review session-end UX. (BEF Phase 2 task 10.) | `src/components/work/*`, UI routes | B6 | M | Design. Reuse existing question detail page patterns. |
| B16 | Freeform agent ("Project Brain Chat"). (Addendum §5.3, §6.5.) | `src/lib/pipelines/freeform/*`, `src/app/(dashboard)/[projectId]/chat/*` | B1–B5, A6 | L | Tool allowlist. Recommend read-only initially; no write tools until guardrails proven. |

**Phase B exit criteria:**
- All four pipelines run end-to-end via Inngest with observability records.
- No Claude call bypasses model router.
- Eval gate still green with refactored pipelines.
- Freeform agent answers from project KB using hybrid retrieval without direct DB queries.

### Phase C: Org Knowledge Base Full Build (Addendum §6.3 + BEF Phase 6)

**Goal:** Complete L1–L5 of the org KB; ship Context Package API; wire Managed Agents for Org Health Assessment and brownfield domain proposal.

| # | Task | Files | Depends on | Complexity | Open questions |
|---|---|---|---|---|---|
| C1 | Verify `OrgRelationship` matches Addendum `component_edges` contract; migrate if needed. | `prisma/schema.prisma`, migrations | A1 | M | Field-level alignment check required before migration. |
| C2 | L2: component embeddings on sync. | `src/lib/inngest/functions/metadata-sync.ts`, embedding enqueue hook | A3, A5 | M | Re-embed strategy when embedding model changes (Addendum §8.E). Store `embedding_model`. |
| C3 | L5: `search_org_kb` primitive. | `src/lib/retrieval/search-org-kb.ts` | C2, A6 | M | Cross-project leakage impossible by design; assert projectId filter. |
| C4 | Context Package API rewrite against §4.6 Tier-1/Tier-2 contract. | `src/app/api/[projectId]/context-package/route.ts` | C3 | M | Versioning the API response shape. Recommend `v1` path segment. |
| C5 | Layer 4 annotations: CRUD + UI + embedding. | `src/actions/org-analysis/*`, `src/components/org/*`, `src/app/(dashboard)/[projectId]/org/*` | A3, A5 | L | Annotation scope (component vs. edge vs. domain). Addendum §4.5 specifies; follow. |
| C6 | Managed Agents integration: Org Health Assessment. | `src/lib/managed-agents/org-health.ts` (new), Inngest function | Addendum §8.C (cost cap) | L | Cost accounting. Enforce Project.managedAgentsCostCap. |
| C7 | Managed Agents integration: brownfield domain proposal. | `src/lib/managed-agents/domain-proposal.ts` (new) | C6 | L | Auto-confirm threshold (Addendum §8.D). Default manual-review-all in V1. |
| C8 | `DomainGrouping`/`BusinessProcessComponent` status fields: `proposed` vs. `confirmed`. UI for confirmation. | `prisma/schema.prisma`, `src/components/org/*` | C7 | M | Schema migration: new enum `ProposalStatus`. |
| C9 | NLP org query (3-tier: regex → full-text → semantic). (BEF Phase 6 task.) | `src/lib/retrieval/org-query.ts` | C3 | M | Fallback behavior on no match. |
| C10 | Sync reconciliation: rename collision, delete-then-recreate, soft-archive cascade. | `src/lib/inngest/functions/metadata-sync.ts` | C1, C2 | M | Addendum §8.F: match by `salesforce_metadata_id` first; if changed, treat as new. Validate with edge-case fixture. |
| C11 | Remaining BEF Phase 6 tasks (agent staleness scan, confirmation flags for Claude Code consumers). | As listed in `docs/bef/03-phases/phase-06-org-knowledge/TASKS.md` | C3, C8 | M–L | See phase file. |

**Phase C exit criteria:**
- All five layers operational.
- Org Health Assessment completes within cost cap and produces ranked issues + domain proposals for a brownfield project.
- Context Package API returns deterministic Tier-1/Tier-2 for a real project under 2 seconds.

### Phase D: Discovery Completion (BEF Phase 3)

**Goal:** Ship the 13 discovery tasks from BEF Phase 3 against the new pipeline + retrieval substrate.

This phase is largely unchanged from the BEF spec. Key sequencing:

| # | Task (from BEF Phase 3) | Complexity | Depends on |
|---|---|---|---|
| D1 | Schema migration: enum fixes, `source` field. | S | — |
| D2 | Question display ID scheme `Q-{SCOPE}-{NUMBER}`. | S | D1 |
| D3 | Clean up ESCALATED references. | S | D1 |
| D4 | Wire `source` (MANUAL/TRANSCRIPT/CHAT) in create paths. | S | D1 |
| D5 | Client/TBD owner assignment. | S | — |
| D6 | Render `parkedReason`, `QuestionAffects` on detail page. | S | — |
| D7 | Pagination on questions list. | S | — |
| D8 | Unify impact assessment (merges with B3 Answer Logging pipeline). | M | B3 |
| D9 | Populate `QuestionAffects` via AI + manual UI. | M | B3 |
| D10 | Gap detection analysis. | L | A6, B1 |
| D11 | Readiness assessment. | L | A6, B1 |
| D12 | Blocking-priority question ranking. | M | D10 |
| D13 | Discovery dashboard sections (3 missing). | M | A6 |

**Open question:** Addendum is silent on whether gap detection waits for org KB L3 or can run on questions-only data. **Recommend:** ship on questions-only first; enhance with org KB cross-reference in a later iteration.

### Phase E: Work Management + Sprint + Developer API (BEF Phases 4 + 5)

**Goal:** Complete story management, sprint intelligence, Context Package consumption.

BEF Phase 4 (9 tasks) and BEF Phase 5 (12 tasks) remain largely as specced. Notable integrations with earlier phases:

- **DRAFT→READY validation gate** (BEF Phase 4 task 1) is implemented as a pipeline stage in B4.
- **Test case stub generation** (BEF Phase 4 task) is a pipeline stage in B4.
- **Dual-mode OrgComponent selector** (BEF Phase 4) needs C3 (`search_org_kb`) ready.
- **Context Package API consumption by Claude Code** (BEF Phase 5) needs C4 complete.
- **Salesforce guardrails in AI prompts** (BEF Phase 4): add to prompt templates in B4.
- **API key expiry + rotation, brownfield warning** (BEF Phase 5): additive, no dependencies.

See BEF phase files for full task list. Complexity totals roughly: 2 L + 6 M + 13 S across both phases.

### Phase F: Dashboards + Search Completion (BEF Phase 7)

**Goal:** 15 tasks covering health score rewrite, dashboard sections, search expansion (tsvector for 3 new entity types), Usage & Costs dashboard, audit logging, cost cap enforcement.

Sequencing: depends on A6/C3 (retrieval), B5 (Briefing pipeline for narrative), A13 (cost caps).

See `docs/bef/03-phases/phase-07-dashboards-search/TASKS.md`. Key items:
- Health score: rewrite from weighted percentage to PRD signal counter.
- Semantic search expansion across 3 new entity types.
- Inngest event volume metric (deferred to V2).

### Phase G: Documents + Notifications (BEF Phase 8)

**Goal:** 9 tasks: document generation via Briefing pipeline, notification dispatch completion, rate limit notifications (inherited from Phase 2 deferral).

Depends on: B5 (Briefing pipeline), B9 (typographic rules), B10 (rate limits).

### Phase H: QA + Jira + Archival (BEF Phase 9)

**Goal:** 11 tasks covering QA workflow completion, Jira one-directional sync, defect lifecycle, project archival + reactivation.

Minimal dependencies on Addendum work. Can partially run in parallel with Phase E/F once Phase A is done.

### Phase I: Work Tab UI Overhaul (BEF Phase 10)

**Goal:** 12 tasks: shared component library (PageHeader, DetailPageLayout, FilterBar, StatusBadge, ProgressBar, EditableField, MetadataSidebar, StatCard), Work overview redesign, Epic/Feature/Story detail page overhauls, kanban enhancements.

**Sequencing recommendation from BEF:** run after Phase 1, before Phases 2+, so new features are built into correct patterns. **Revised recommendation:** run **after Phase A** (foundation) and **in parallel with Phase B** starting tasks. The UI overhaul has zero dependency on pipelines, embeddings, or retrieval, and running it now prevents rework in Phases D–H.

---

## 4. Gating Decisions (Addendum §9.4)

These four decisions must be confirmed before Phase A starts. Recommendations and reasoning follow.

### Decision 1: Embedding provider (Voyage AI vs. OpenAI)

**Recommendation:** **Voyage AI (`voyage-3-lite`).**

**Reasoning:**
- Voyage is Anthropic's recommended embeddings partner and has explicit domain-tuned variants (`voyage-code`, `voyage-law`, `voyage-finance`) that signal maturity on domain-specific vocabularies. Salesforce is a domain where tokenization of object/field API names matters.
- At V1 volume (10–30 projects, maybe 100k-entity KB total), cost difference between Voyage and OpenAI is immaterial (single-digit dollars per month). Cost is a non-factor.
- Contractual posture: both providers can offer no-retention/no-training agreements. Voyage has lighter sales friction than OpenAI for an internal tool of this size.
- Migration cost is low because `embedding_model` field lets both coexist.

**Only reason to pick OpenAI:** existing OpenAI vendor relationship inside the firm; otherwise pick Voyage.

### Decision 2: Background job runner (Inngest vs. Trigger.dev vs. alternative)

**Recommendation:** **Ratify Inngest.**

**Reasoning:**
- Inngest is already in use with 15+ functions. Switching costs are high for zero proven benefit.
- Inngest step functions, checkpoints, and fan-out cover every Addendum-required pattern.
- Free tier suffices for V1 load. Vercel-native deployment.
- Trigger.dev offers a similar feature set; there is no gap that Inngest has and Trigger.dev fills.

**Action:** formally close Addendum §3.1 row for background runner. Update PRD §25 accordingly.

### Decision 3: Pipeline-first architecture supersedes generic harness

**Recommendation:** **Confirm supersession.**

**Reasoning:**
- The generic harness makes every AI workflow look the same at runtime, which obscures stage-level failures, makes eval impossible, and forces all context into one prompt.
- Pipelines let each workflow have its own failure modes, retries, and observability. Eval harness work (Decision 4) is predicated on pipelines.
- Existing harness code refactor cost is roughly 2–3 weeks of engineering (Phase B tasks B1–B5). This pays back immediately in debuggability and eval coverage.
- The one place a freeform agent still makes sense (Project Brain Chat) is scoped narrowly per Addendum §5.3.

### Decision 4: Eval harness in Phase 1 scope

**Recommendation:** **Confirm inclusion.**

**Reasoning:**
- Without eval in Phase 1, pipeline refactors in Phase B have no regression gate. Refactors will ship silent behavior changes.
- Cost is bounded: Addendum §5.6 specifies a lightweight JSON-fixture runner and ~$0.50 per CI run.
- Phase A tasks A10–A12 size this at ~1 week of engineering for scaffold + 20 fixtures.
- Not ratifying this means paying the cost in Phase D (discovery AI features) or Phase F (dashboards) when regressions become user-visible.

---

## 5. Risk Register

| # | Risk | Likelihood | Impact | Assumption/ambiguity | Mitigation |
|---|---|---|---|---|---|
| R1 | Embedding provider data handling agreement takes longer than a week. | M | H (blocks Phase A) | Assumes vendor agreements are fast. | Start Decision 1 procurement today; parallelize with A1 (pgvector install) which has no vendor dependency. |
| R2 | Neon plan tier does not support pgvector HNSW at required scale. | L | M | Assumes current Neon plan is sufficient. | Verify in A1; upgrade plan if needed. Fallback: IVFFlat indexes. |
| R3 | Refactoring existing harness into pipelines introduces behavior regressions that are invisible without eval. | H | H | Assumes test coverage of harness is thin (not verified). | Eval harness (A10–A12) must land **before** B1. No pipeline refactor merges without passing eval. |
| R4 | `OrgRelationship` schema does not cleanly match Addendum `component_edges`. | M | M | Field-level match not verified. | C1 starts with a read-only schema diff task; migration deferred until diff reviewed. |
| R5 | BEF Phase files drift further as this plan executes; contradictions emerge. | H | L | Plans rot. | Treat this plan as authoritative once approved; BEF phase files become task-detail references only. Update `docs/bef/PROJECT_STATE.md` Replan Log when this plan is accepted. |
| R6 | Managed Agents cost overruns on Org Health Assessment for large brownfield orgs. | M | M | $25/project cap is a guess. | Enforce cap in model router; expose override to SA with reason logged. Revisit after first 3 brownfield runs. |
| R7 | Freeform agent ("Project Brain Chat") answers incorrectly from stale context. | M | M | Assumes retrieval suffices without explicit freshness markers. | Pass `retrieved_at` into prompt; agent must disclose staleness in response. Add eval fixtures covering staleness. |
| R8 | Rate limit enforcement via Postgres counters causes write contention at scale. | L | M | V1 load makes this unlikely. | Monitor; switch to Redis or Upstash if contention observed. |
| R9 | pgvector migration path locks us out of later moves to dedicated vector DB. | L | L | Assumes Postgres suffices for V1 scale. | `embedding_model` column + polymorphic embedding table allow dual-write during any future migration. |
| R10 | Ambiguity: does gap detection require org KB L3, or questions-only data? | Certain | L | Addendum §6.3 reduces Phase 3 scope to ingestion + Context Package; gap detection sits in BEF Phase 3, not Addendum Phase 3. | Ship questions-only first. Expand later. User to confirm. |
| R11 | Ambiguity: BEF Phase 4 "Work Management" contains work the Addendum places in Phase 2 (story generation pipeline). | Certain | L | Scope overlap between docs. | This plan resolves by placing story generation pipeline in Phase B and the remaining BEF Phase 4 items in Phase E. User to confirm. |
| R12 | Ambiguity: whether `component_edges` is a new table or a rename of existing `OrgRelationship`. | Certain | M | Addendum §4.2 mentions `component_edges`; codebase has `OrgRelationship`. | C1 is explicitly a verify-or-migrate task. |
| R13 | Ambiguity: auto-confirm threshold for domain proposals in V1. | Certain | L | Addendum §8.D leaves threshold open. | Default manual-review-all in V1 per C7 note. User to confirm. |
| R14 | Ambiguity: eval fixture source material. Using real client transcripts requires redaction. | M | M | Assumes anonymization pipeline exists or can be built quickly. | Start with synthetic fixtures if redaction blocks. User to decide. |
| R15 | Deferred to V2 per BEF: Org Health Assessment (GAP-ORG-009, XL). But Addendum §4.8 lists it as a Managed Agents Phase 3 deliverable. | Certain | H | Contradiction between BEF Phase 6 deferral and Addendum §6.3. | **User must confirm: does Org Health Assessment ship in V1 per Addendum, or defer per BEF?** |
| R16 | Solo-developer capacity across 10+ phases is the dominant schedule risk. | Certain | H | Budget constraint explicit in CLAUDE.md. | Phases should be sequential for a solo dev; parallelization in Phase I + H only after Phase A. Plan assumes ~12 months to V1 at sustainable pace. |

---

## 6. Ambiguities Requiring User Input Before Phase A Starts

These are unresolved items this plan does not silently resolve. Answer before kickoff.

1. **Gating Decision 1 (embedding provider):** confirm Voyage or OpenAI.
2. **Gating Decision 2 (background runner):** confirm Inngest ratification.
3. **Gating Decision 3 (pipeline supersedes harness):** confirm.
4. **Gating Decision 4 (eval harness in Phase 1):** confirm.
5. **Org Health Assessment in V1 (R15):** Addendum says yes, BEF says deferred. Which is it?
6. **`component_edges` vs. `OrgRelationship` (R12):** is the existing table the intended Layer 1 edge storage, or does Addendum require a new table? Request: one-time schema review before C1.
7. **Domain proposal auto-confirm threshold (R13):** confirm manual-review-all for V1.
8. **Managed Agents cost cap default (R6):** confirm $25/project/month or provide a different number.
9. **Embedding entity-type scope at Phase 1 (A4):** confirm minimum set = questions, decisions, requirements, risks, sessions. Stories may wait until Phase B's B4.
10. **Eval fixture source (R14):** real anonymized transcripts, synthetic, or mix?
11. **Phase I (Work Tab UI overhaul) timing:** confirm parallelization with Phase B instead of BEF's original "run second" slot.
12. **Rate limit storage (B10):** confirm Postgres counter for V1, Redis deferred.

---

## 7. What This Plan Does Not Cover

- Production deploy orchestration (Vercel/Neon setup, domain, observability stack beyond pipeline_runs).
- Document templates and firm branding assets (Phase G produces the engine; content is separate).
- Client-facing Jira schemas for specific client instances (Phase H ships the mechanism; per-client mapping is a setup activity).
- V2 roadmap items explicitly deferred by BEF (Inngest event volume dashboard, dependency chain visualization, AI milestone summaries, semantic search expansion beyond Phase F scope, version history OCC beyond schema fields).
- Mobile, webhook automation, multi-org, real-time collaboration (out of scope per PRD §24).

---

**End of plan.**
