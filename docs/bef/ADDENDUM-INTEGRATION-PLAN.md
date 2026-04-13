# Addendum Integration Plan for BEF Phases 1-10

**Date:** 2026-04-13
**Status:** Draft pending user review of four gating decisions (see §4)
**Source documents:**
- `docs/bef/00-prd/PRD.md` (base requirements, 27 sections)
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` (authoritative where it conflicts with PRD)
- `docs/bef/PROJECT_STATE.md` (BEF execution state)
- `docs/bef/03-phases/phase-01..phase-10/` (PHASE_SPEC.md and TASKS.md per phase)

---

## 0. Method and ground rules

### 0.1 Authority

The PRD Addendum v1 is the source of truth wherever it conflicts with the base PRD. This document integrates Addendum scope into the existing Build Execution Framework (BEF) phase structure. Every Addendum claim is cited by section number (for example, "per Addendum §5.2.3").

### 0.2 Preservation of BEF structure

BEF Phase numbers 1 through 10 and their names are preserved verbatim. The Addendum was written against the PRD's original 4-phase sequence (Addendum §6); this document translates those instructions into the 10-phase BEF layout without renumbering.

### 0.3 Action types

Every task change in §2 is tagged with one of four actions:

| Action | Meaning |
|--------|---------|
| ADD | Insert a new task into the phase that does not exist today. |
| MODIFY | Change scope, acceptance criteria, or complexity of an existing BEF task. |
| MOVE | Relocate an existing task from its current phase to a different phase. The receiving phase records an ADD; the source phase records a MOVE out. |
| REMOVE | Delete the task. Always paired with a rationale (resolved by ADD, obsoleted by Addendum, or duplicated elsewhere). |

### 0.4 Task ID convention

Existing BEF tasks are referenced by the REQ-* IDs from each phase's TASKS.md. New tasks introduced by this integration plan use the convention `REQ-<DOMAIN>-NEW-<n>` so they cannot collide with existing IDs during replan execution.

### 0.5 What is NOT in scope here

- No BEF phase file (PHASE_SPEC.md or TASKS.md) is edited by this plan. BEF files are amended only through `/bef:replan`.
- No code is written. This is a planning artifact.
- No renumbering, merging, or splitting of BEF phases.

---

## 1. Cross-phase additions

Eleven Addendum capabilities cut across multiple BEF phases. This table assigns each to its primary home phase and lists the phases that consume it.

| # | Capability | Addendum cite | Primary BEF phase | Consuming phases | Rationale |
|---|-----------|---------------|-------------------|------------------|-----------|
| 1 | pgvector extension enabled + vector columns | §3.1, §6.1 | Phase 1 (verify) | All AI phases | Already installed in `prisma/schema.prisma` (1024-dim on OrgComponent, KnowledgeArticle). Phase 1 reopen verifies and extends schema; no re-installation. |
| 2 | Embedding provider client (Voyage AI or OpenAI per Gating Decision 1) | §3.1, §6.1 | Phase 1 | 2, 3, 5, 6, 7 | Lives in `src/lib/search/embeddings.ts` today. Gating decision 1 formalizes provider choice and data handling agreement. |
| 3 | Embedding enqueue hook + batch Inngest function | §3.1, §6.1 | Phase 1 | 2, 3, 5, 6 | `src/lib/inngest/functions/embedding-batch.ts` exists. Phase 1 adds on-write enqueue hooks on all embedded entity types, retry, backfill. |
| 4 | Hybrid retrieval primitive (`search_project_kb`, `search_org_kb`) | §5.4, §6.1 | Phase 1 (project KB), Phase 6 (org KB) | 2, 3, 4, 5, 6, 7, 8 | `search_project_kb` logic exists in `src/lib/agent-harness/context/smart-retrieval.ts`. Phase 1 formalizes into shared primitive. `search_org_kb` is net new in Phase 6 per Addendum §4.5. |
| 5 | Model router module (intent-based) | §2, §5.5, §6.1 | Phase 1 | All AI phases | Not implemented. Centralized module required per Addendum §5.5: Haiku 4.5 (extraction, classification, routing), Sonnet 4.6 (synthesis, generation), Opus 4.6 (long-horizon reasoning). |
| 6 | Eval harness scaffold + fixtures + CI gate | §3.1, §5.6, §6.1 | Phase 1 | 2 (Story Generation evals), 3 (Discovery/Answer Logging evals), 7 (Briefing/Status evals) | Not implemented. `pnpm eval [pipeline]` runner, JSON fixtures per pipeline, CI main-branch gate. V1 deliverable per Gating Decision 4. |
| 7 | Pipeline framework (stage DAG, checkpoints, `pipeline_runs` tables) | §5.1, §5.2 | Phase 2 | 2, 3, 4, 5, 7 | Pipeline stage files exist in `src/lib/agent-harness/tasks/` (13 files) but no formal pipeline abstraction, no checkpointing, no run-tracking schema. Phase 2 formalizes. |
| 8 | Freeform agent ("Project Brain Chat") | §5.3, §6.5 | Phase 2 (end) | 6, 7 (use across surfaces) | Chat route and 31 chat tools already exist at `src/app/api/chat/` and `src/lib/chat-tools/`. Phase 2 wires the agent to the formalized pipeline framework, model router, and shared retrieval primitive per Addendum §6.5. |
| 9 | Managed Agents integration (Org Health Assessment, brownfield domain proposal) | §4.8, §6.3 | Phase 6 (V1 decision pending) | 3, 6 | Partial reference in `src/lib/inngest/functions/org-ingestion.ts`. Addendum treats as V1 Phase 3 work (Addendum §6.3). BEF Phase 6 currently defers Org Health Assessment (REQ-ORG-009) to V2. Conflict flagged in §7. |
| 10 | Typographic rules module (firm branding guardrails) | n/a (PRD §16) | Phase 4 (existing) | 4, 8 | Already present at `src/lib/documents/branding.ts`. Not an Addendum addition. Listed here for completeness because the task spec requested it; no action required. |
| 11 | Cost caps + rate limiting enforcement | §3.1 data handling, PRD §23 | Phase 7 (cost dashboards) | All AI phases | Rate limiter exists at `src/lib/api-keys/rate-limit.ts`. Addendum §3.1 requires embedding provider data handling agreement and per-project cost caps. Phase 7 already absorbed REQ-RBAC-010/014/015/016 from Phase 1 per replan log 2026-04-10. Addendum tightens scope but does not relocate. |

---

## 2. Per-BEF-phase refactor

### Phase 1: RBAC, Security, Governance

**Current scope (from PHASE_SPEC.md):** Role-based access control, security policies, and organizational governance framework.
**Current task count:** 14 tasks (10 S, 4 M). See `03-phases/phase-01-rbac-security-governance/TASKS.md`.
**Execution state:** COMPLETE (14/14 per PROJECT_STATE.md as of 2026-04-10).

**Addendum deltas:**
- Addendum §6.1 expands Phase 1 scope to include: pgvector verification, embedding provider selection, embedding job infrastructure, hybrid retrieval primitive (`search_project_kb`), model router, eval harness scaffold, and Layer 1 org KB schema (`org_components`, `component_edges`).
- Addendum §5.5 requires centralized model router as the only place that resolves task intent to model name.
- Addendum §5.6 requires eval harness with 10 fixtures each for Transcript Processing and Answer Logging pipelines.
- Addendum §7 adds data model entities including Layer 1 component graph, embedding status enums, `pipeline_runs`, `eval_runs`.

**Codebase state:**
- pgvector installed (Voyage 1024-dim): `prisma/migrations/vector-dimension-1024.sql`, columns on `OrgComponent` and `KnowledgeArticle`.
- Embedding generation client: `src/lib/search/embeddings.ts`.
- Embedding Inngest batch function: `src/lib/inngest/functions/embedding-batch.ts`.
- Hybrid retrieval: `src/lib/agent-harness/context/smart-retrieval.ts`, `src/lib/search/global-search.ts`.
- MISSING: model router module (no `src/lib/models/router.ts`), eval harness (no `src/evals/` or `pnpm eval` runner), `PipelineRun` and `EvalRun` Prisma models, on-write embedding enqueue hooks on every embedded entity, Layer 1 schema entities `org_components` and `component_edges` as Addendum-shaped tables (existing `OrgComponent` model partially satisfies but column names differ).

**Task changes:**

| Action | Task ID / Title | Change | Rationale |
|--------|-----------------|--------|-----------|
| ADD | REQ-RBAC-NEW-1: Model router module | New task. Implements `src/lib/models/router.ts` with intent-to-model resolution (Haiku/Sonnet/Opus). All pipeline stages request by intent, not name. | Per Addendum §5.5. Cross-cutting infrastructure required before Phases 2-7 can build AI features. |
| ADD | REQ-RBAC-NEW-2: Eval harness scaffold + CI gate | New task. Creates `src/evals/`, `pnpm eval [pipeline]` runner, JSON fixture format, GitHub Actions main-branch gate. 10 seed fixtures for Transcript Processing. 10 seed fixtures for Answer Logging. | Per Addendum §5.6 and Gating Decision 4. Must exist before Phase 2 pipelines are built so their first commits can gate on evals. |
| ADD | REQ-RBAC-NEW-3: Pipeline framework tables + schema | New task. Adds `PipelineRun` and `PipelineStageRun` Prisma models with checkpoint state, stage DAG persistence, and `EvalRun` model for eval history. | Per Addendum §5.1, §5.2, §7. Framework schema must precede Phase 2 pipeline formalization. |
| ADD | REQ-RBAC-NEW-4: Embedding enqueue on write for Layer 1 entities | New task. Adds Prisma middleware or explicit enqueue calls on create/update of: Question, Decision, Requirement, Risk, SessionLog. Verifies existing OrgComponent and KnowledgeArticle hooks. | Per Addendum §6.1. Substrate partially exists; this closes gaps on entities that lack on-write enqueue. |
| ADD | REQ-RBAC-NEW-5: Hybrid retrieval primitive audit and formalization | New task. Refactors `smart-retrieval.ts` into named primitive `searchProjectKB(params)` with BM25 + pgvector + reciprocal rank fusion. Documents public signature. Adds regression tests. | Per Addendum §5.4, §6.1. Substrate exists; this formalizes as a reusable primitive before Phases 2-7 consume it. |
| ADD | REQ-RBAC-NEW-6: Layer 1 org KB schema verification | New task. Verifies `OrgComponent` and `OrgRelationship` schemas match Addendum §4.1 expectations. Adds `component_edges` if OrgRelationship shape is insufficient. No ingestion logic. | Per Addendum §6.1. Avoids Phase 3 migration shock. Substrate mostly exists; this is a delta audit. |
| ADD | REQ-RBAC-NEW-7: Embedding provider data handling agreement | New task. Records provider selection per Gating Decision 1. Documents no-training, no-retention commitment from provider. Updates `docs/bef/00-prd/PRD.md` §22.3 compliance reference. | Per Addendum §3.1. Required before any user data is sent to embedding provider at scale. |
| MODIFY | REQ-RBAC-010: Usage & Costs dashboard | Already deferred to Phase 7 per replan log 2026-04-10. No change; noted here for traceability. | Kept in Phase 7. |
| MODIFY | REQ-RBAC-014: Audit logging | Already deferred to Phase 7 per replan log 2026-04-10. No change. | Kept in Phase 7. |
| MODIFY | REQ-RBAC-015: Cost caps implementation | Retains Phase 1 placement. Addendum §3.1 and PRD §23 both require. Scope tightens: per-project monthly embedding token cap; per-project monthly generation token cap; hard-fail with operator notification. | Addendum §3.1 explicit. Complexity upgraded from unlisted to M. |
| MODIFY | REQ-RBAC-016: Cost monitoring UI | Deferred to Phase 7 per replan log 2026-04-10. No change. | Kept in Phase 7. |

**Revised phase scope:** Phase 1 delivers RBAC/security/governance AND the cross-cutting intelligence substrate required by Addendum §6.1: model router, eval harness scaffold + CI gate, pipeline framework schema (`PipelineRun`, `PipelineStageRun`, `EvalRun`), formalized hybrid retrieval primitive, verified Layer 1 org KB schema, and embedding provider data handling agreement. Existing implementations of pgvector, embedding client, embedding batch function, and the `smart-retrieval.ts` logic are retained and formalized, not rebuilt.

**Revised task count:** 14 original + 7 ADD = 21 tasks. Complexity: approximately 10 S, 6 M, 5 L (new tasks skew M/L due to framework scope).

**Reopening note:** Phase 1 is currently marked COMPLETE for the RBAC sub-scope. Per Addendum §6.1, Phase 1 must be reopened with tasks REQ-RBAC-NEW-1 through REQ-RBAC-NEW-7 before Phase 2 can begin. See §5 of this document for the reopening declaration.

---

### Phase 2: Agent Harness, Transcripts

**Current scope (from PHASE_SPEC.md):** AI agent execution framework with transcript capture and state management for LLM-driven task automation.
**Current task count:** 10 tasks (6 S, 4 M).
**Execution state:** Specced, not started.

**Addendum deltas:**
- Addendum §1 cross-reference: PRD §6 (AI Agent Harness) is superseded in substance. The harness is now four deterministic pipelines plus one narrow freeform agent plus the hybrid retrieval primitive.
- Addendum §5.2 defines the four pipelines: Transcript Processing (§5.2.1), Answer Logging (§5.2.2), Story Generation (§5.2.3), Briefing/Status (§5.2.4).
- Addendum §6.5 places the freeform agent at the end of Phase 2 per Addendum sequencing, which maps to end of BEF Phase 2 here.
- Addendum §5.6 adds eval fixtures for Transcript Processing to Phase 1 (already scheduled there) but Phase 2 owns expansion to 10+ fixtures as pipeline matures.
- Gating Decision 3 confirms pipeline-first architecture supersedes any generic harness design.

**Codebase state:**
- Agent harness monolith: `src/lib/agent-harness/engine.ts` (11.6 KB), `tool-executor.ts`, `sanitize.ts`, `types.ts`. Not decomposed into pipelines today.
- Pipeline-shaped stage files under `src/lib/agent-harness/tasks/` (13 files): `transcript-processing.ts`, `question-answering.ts`, `story-generation.ts`, `briefing-generation.ts`, and nine others. These are task definitions, not a pipeline framework.
- Transcript processing Inngest: `src/lib/inngest/functions/transcript-processing.ts` (pipeline-shaped).
- Chat route: `src/app/api/chat/route.ts`. Chat tools: 31 files in `src/lib/chat-tools/` (20 query, 12 mutate, 2 batch, 3 system).
- Chat session context builders: `src/lib/chat-sessions/`.
- MISSING: formal Pipeline abstraction (no `src/lib/pipelines/` directory), pipeline stage DAG persistence, checkpoint state machines, Answer Logging pipeline.

**Task changes:**

| Action | Task ID / Title | Change | Rationale |
|--------|-----------------|--------|-----------|
| MODIFY | REQ-AGENT-001: Agent harness core executor | Repurpose as Pipeline Framework Core. Implements `src/lib/pipelines/` with Pipeline, Stage, StageRun abstractions. Consumes `PipelineRun`/`PipelineStageRun` schema from Phase 1 REQ-RBAC-NEW-3. | Per Addendum §5.1 and Gating Decision 3. Existing engine.ts is replaced with pipeline abstraction, not retrofitted. |
| MODIFY | REQ-AGENT-002: Transcript schema design | Scope unchanged; implementation now feeds Transcript Processing pipeline stages per Addendum §5.2.1. | Per Addendum §1 cross-reference table. |
| MODIFY | REQ-AGENT-003: Transcript capture middleware | Unchanged in scope; implementation invokes pipeline framework rather than generic harness. | Per Addendum §5.2.1. |
| MODIFY | REQ-AGENT-004: Message streaming protocol | Repurposed for freeform agent streaming only. Pipeline stages do not stream externally. | Per Addendum §5.3 (freeform agent is streaming surface). |
| MODIFY | REQ-AGENT-007: Agent state persistence | Replaced by `PipelineRun`/`PipelineStageRun` persistence from Phase 1 REQ-RBAC-NEW-3 plus freeform agent Conversation persistence. Split acceptance criteria. | Per Addendum §5.1 checkpoints and §5.3 freeform agent. |
| MODIFY | REQ-AGENT-008: Inngest integration for harness | Repurposed as pipeline runner binding. Each pipeline is an Inngest step function with stage checkpoints. | Per Addendum §5.1 and Gating Decision 2. |
| MODIFY | REQ-AGENT-009: Error recovery in transcripts | Scoped to pipeline stage retry semantics per Addendum §5.1. | Per Addendum §5.1. |
| MODIFY | REQ-AGENT-010: Test harness and mocking | Scope widened to produce pipeline-level test utilities usable by eval harness from Phase 1 REQ-RBAC-NEW-2. | Per Addendum §5.6. |
| ADD | REQ-AGENT-NEW-1: Transcript Processing pipeline formalization | Wraps existing `src/lib/agent-harness/tasks/transcript-processing.ts` as formal Pipeline with stages: parse, extract questions, extract decisions, synthesize. Mandatory field validation at terminal stage. Wires embedding enqueue. | Per Addendum §5.2.1. |
| ADD | REQ-AGENT-NEW-2: Answer Logging pipeline | New pipeline. Stages: classify, link to question, persist decision, embed, notify. | Per Addendum §5.2.2. Pipeline not yet implemented. |
| ADD | REQ-AGENT-NEW-3: Story Generation pipeline formalization | Wraps existing story-generation task as formal Pipeline. Mandatory field validation is a deterministic terminal stage per Addendum §5.2.3. Embedding on create. | Per Addendum §5.2.3 and §6.2. Preparatory for Phase 4 story management work. |
| ADD | REQ-AGENT-NEW-4: Freeform agent integration with pipeline framework | Formalizes the existing chat route as the "Project Brain Chat" per Addendum §5.3. Agent uses the shared hybrid retrieval primitive and model router. Chat tools remain. Added deterministic guardrails on mutation tools. | Per Addendum §5.3 and §6.5. Agent already exists; this binds it to the new framework. |
| ADD | REQ-AGENT-NEW-5: Pipeline evals extended to 10+ fixtures | Adds fixtures and assertions for Transcript Processing and Story Generation pipelines. Runs in CI per REQ-RBAC-NEW-2. | Per Addendum §5.6. |

**Revised phase scope:** Phase 2 formalizes the pipeline framework (supersedes generic harness per Addendum §1), implements Transcript Processing, Answer Logging, and Story Generation pipelines with checkpointed execution, wires the existing freeform agent to the framework, and extends the eval harness to cover the pipelines landed in this phase. Transcript capture and streaming remain, now implemented via pipelines and the freeform agent respectively.

**Revised task count:** 10 original (9 modified, 1 unchanged REQ-AGENT-005 status report template, 1 unchanged REQ-AGENT-006 rate limit notifications) + 5 ADD = 15 tasks. Complexity: approximately 4 S, 6 M, 5 L.

---

### Phase 3: Discovery, Questions

**Current scope (from PHASE_SPEC.md):** Gap detection, impact assessment, and readiness validation for requirement discovery from Salesforce metadata and code analysis.
**Current task count:** 13 tasks (4 S, 6 M, 3 L).
**Execution state:** Specced, not started. Deep-dive completed 2026-04-10.

**Addendum deltas:**
- Addendum §6.3 treats Org Health Assessment and brownfield domain proposal as V1 work using Managed Agents. BEF currently defers Org Health Assessment to V2 in Phase 6 (REQ-ORG-009). Conflict flagged in §7 of this document.
- Addendum §4.8 specifies Managed Agents as the execution model for Org Health Assessment.
- Addendum §5.2.2 Answer Logging pipeline pairs with Discovery workflow. Pipeline itself lands in Phase 2 (REQ-AGENT-NEW-2); Phase 3 consumes it for discovery-driven answer capture.
- Addendum §6.1 Layer 1 schema already handled in Phase 1. Phase 3 discovery tasks consume the substrate.

**Codebase state:**
- Question impact Inngest functions: `src/lib/inngest/functions/question-impact.ts`, `question-impact-assessment.ts`.
- Question tool defs: `src/lib/agent-harness/tasks/question-impact.ts`, `question-answering.ts`.
- Org component querying in chat tools: `src/lib/chat-tools/query-org-components.ts`.
- Discovery routes: `src/app/(dashboard)/projects/[projectId]/questions/`, `src/app/(dashboard)/projects/[projectId]/org/analysis/`.
- MISSING: formalized Answer Logging pipeline wrapper in discovery flow, evals for discovery-driven answer capture.

**Task changes:**

| Action | Task ID / Title | Change | Rationale |
|--------|-----------------|--------|-----------|
| MODIFY | REQ-DISC-003: Gap detection engine | Invokes model router (Haiku for classification, Sonnet for synthesis) per Addendum §5.5. Uses hybrid retrieval primitive from Phase 1. Not generic harness. | Per Addendum §5.5, §6.1. |
| MODIFY | REQ-DISC-004: Impact assessment | Runs as Pipeline per Addendum §5.1 (not free-form harness call). Checkpointed. Consumes hybrid retrieval. | Per Addendum §5.1. |
| MODIFY | REQ-DISC-005: Readiness assessment | Runs as Pipeline. Same as DISC-004. | Per Addendum §5.1. |
| ADD | REQ-DISC-NEW-1: Answer Logging pipeline wiring into discovery UI | Binds Phase 2 REQ-AGENT-NEW-2 Answer Logging pipeline to the question answer capture surface in `src/app/(dashboard)/projects/[projectId]/questions/[questionId]/`. | Per Addendum §5.2.2. |
| ADD | REQ-DISC-NEW-2: Discovery pipeline evals | 10 fixtures for Gap Detection, 10 for Impact Assessment, 10 for Readiness Assessment. Registered with eval harness from Phase 1 REQ-RBAC-NEW-2. | Per Addendum §5.6. |
| ADD | REQ-DISC-NEW-3 (CONDITIONAL, pending user decision in §7): Managed Agent for brownfield domain proposal | Integrates Claude Managed Agents for brownfield domain proposal per Addendum §4.8 and §6.3. Triggered from `src/app/(dashboard)/projects/[projectId]/org/analysis/`. | Per Addendum §4.8, §6.3. Conditional because BEF currently scopes Managed Agents in Phase 6. See §7. |

**Revised phase scope:** Phase 3 implements Salesforce metadata ingestion, parsing, gap detection, impact assessment, and readiness validation using the pipeline framework from Phase 2 and the model router + retrieval primitive from Phase 1. Pipeline evals are added for the three AI-heavy tasks. Managed Agents wiring for brownfield domain proposal is conditional on user resolution of the V1/V2 placement conflict (§7).

**Revised task count:** 13 original + 2 or 3 ADD = 15 or 16 tasks. Complexity: approximately 4 S, 7 M, 4 L.

---

### Phase 4: Work Management

**Current scope (from PHASE_SPEC.md):** Work item (Story/Epic/Feature) management with DRAFT to READY validation, test case generation, dual-mode org component selector, Salesforce guardrails.
**Current task count:** 9 tasks (2 S, 5 M, 2 L).
**Execution state:** Specced, not started. Deep-dive completed 2026-04-10.

**Addendum deltas:**
- Addendum §5.2.3 Story Generation pipeline already lands in Phase 2 (REQ-AGENT-NEW-3). Phase 4 consumes it for story creation UI and mandatory field validation.
- Addendum §5.6 evals for Story Generation extended in Phase 4 as the UI flow matures.
- Typographic/branding rules (PRD §16, module at `src/lib/documents/branding.ts`) referenced here for traceability; no change.
- No new Addendum-driven scope additions.

**Codebase state:**
- Story/Epic/Feature models in Prisma: `Story`, `Epic`, `Feature`, `EpicPhase`.
- Work management server actions: `src/actions/stories.ts`, `epics.ts`, `features.ts`, `epic-phases.ts`.
- Work routes: `src/app/(dashboard)/projects/[projectId]/backlog/`, `roadmap/`.
- Story generation harness task: `src/lib/agent-harness/tasks/story-generation.ts`.
- MISSING: DRAFT to READY validation pipeline stage, test case stub generation pipeline.

**Task changes:**

| Action | Task ID / Title | Change | Rationale |
|--------|-----------------|--------|-----------|
| MODIFY | REQ-WORK-002: DRAFT to READY validation gate | Implemented as terminal deterministic stage of Story Generation pipeline from Phase 2 REQ-AGENT-NEW-3. No generic harness call. | Per Addendum §5.2.3 mandatory field validation. |
| MODIFY | REQ-WORK-003: Test case stub generation | Runs as pipeline per framework from Phase 2. Uses model router (Sonnet for generation). | Per Addendum §5.1, §5.5. |
| ADD | REQ-WORK-NEW-1: Story Generation pipeline UI bindings | Wires the pipeline from Phase 2 REQ-AGENT-NEW-3 to the story creation flow in the Work UI. Handles pipeline run status display and retry. | Per Addendum §5.2.3. |
| ADD | REQ-WORK-NEW-2: Extended Story Generation evals | Adds 5 fixtures covering common greenfield story patterns and 5 fixtures covering brownfield stories tied to OrgComponent references. | Per Addendum §5.6. |

**Revised phase scope:** Phase 4 implements Work item management surfaces bound to the Story Generation pipeline from Phase 2. DRAFT to READY validation is enforced by the pipeline's deterministic terminal stage. Test case stub generation runs as its own pipeline. Branded document generation remains via the existing branding module. Eval coverage extends.

**Revised task count:** 9 original + 2 ADD = 11 tasks. Complexity: approximately 2 S, 6 M, 3 L.

---

### Phase 5: Sprint, Developer API

**Current scope (from PHASE_SPEC.md):** Sprint planning, capacity assessment, developer attribution, API context package, org query + component reporting, API key management, brownfield warnings.
**Current task count:** 12 tasks (5 S, 6 M, 1 L).
**Execution state:** Specced, not started. Deep-dive completed 2026-04-10.

**Addendum deltas:**
- Addendum §4.6 revises Context Package API implementation (contract unchanged per Addendum §1 cross-reference). Implementation now consumes `search_org_kb` from Phase 6 substrate.
- Addendum §5.5 model router governs all AI calls from developer API as well.
- Addendum §4.5 five-layer org KB Layer 5 (`search_org_kb`) is the backend for the Context Package API. Layer 5 lands in Phase 6; Phase 5 consumes it.

**Codebase state:**
- Developer API routes: `src/app/api/v1/context-package/`, `src/app/api/v1/org/components/`, `src/app/api/v1/project/summary/`, `src/app/api/v1/stories/[storyId]/status/`.
- Sprint Inngest: `src/lib/inngest/functions/sprint-intelligence.ts`.
- Sprint actions: `src/actions/sprints.ts`.
- API key management: `src/lib/api-keys/rate-limit.ts`, `src/actions/api-keys.ts`.
- MISSING: `search_org_kb` primitive consumer (depends on Phase 6 delivery).

**Task changes:**

| Action | Task ID / Title | Change | Rationale |
|--------|-----------------|--------|-----------|
| MODIFY | REQ-SPRINT-005: Full context package builder | Implementation consumes `search_org_kb` from Phase 6 plus `search_project_kb` from Phase 1. Model router governs summarization. | Per Addendum §4.6, §5.4, §5.5. Adds dependency on Phase 6 Layer 5 delivery. |
| MODIFY | REQ-SPRINT-006: Org query endpoint | Backed by `search_org_kb` per Addendum §4.5. | Per Addendum §4.5. |
| MODIFY | REQ-SPRINT-007: Component report endpoint | Uses hybrid retrieval primitive and Layer 2 component embeddings from Phase 6. | Per Addendum §4.2, §5.4. |
| MODIFY | REQ-SPRINT-009: NLP org query | Keyword translation with Phase 6 semantic enhancement hook (already reflected in replan log 2026-04-10). Now explicit: Phase 5 ships tier 1 regex + tier 2 full-text; tier 3 semantic delivered by Phase 6 `search_org_kb`. | Alignment with Addendum §4.5. |
| ADD | REQ-SPRINT-NEW-1: Model router integration in sprint intelligence | Explicit dependency binding. Sprint intelligence pipeline stages request by intent. | Per Addendum §5.5. |

**Revised phase scope:** Phase 5 delivers sprint planning, capacity assessment, developer attribution, and the Context Package API. Org query, component report, and the Context Package builder depend on the Layer 5 `search_org_kb` primitive delivered in Phase 6; Phase 5 ships tier 1/tier 2 retrieval with semantic enhancement wired once Phase 6 completes. API key management and brownfield warnings are unchanged.

**Revised task count:** 12 original + 1 ADD = 13 tasks. Complexity: approximately 5 S, 7 M, 1 L.

**Dependency change:** Phase 5 now has a soft dependency on Phase 6 Layer 5 delivery for full context package richness. Phase 5 ships with tier 1/2 retrieval working if Phase 6 slips.

---

### Phase 6: Org, Knowledge

**Current scope (from PHASE_SPEC.md):** Knowledge article management with 3-tier NLP search, agent staleness detection, org health baseline, Claude Code article confirmation workflow.
**Current task count:** 13 tasks (6 S, 5 M, 2 L). REQ-ORG-009 Org Health Assessment currently marked XL and deferred to V2 per replan log 2026-04-10.
**Execution state:** Specced, not started. Deep-dive completed 2026-04-10.

**Addendum deltas:**
- Addendum §4.1 through §4.5 specify the five-layer org KB model. BEF currently covers Layer 1 (Phase 1 schema per revised scope) and Layer 2/3/4/5 must land here.
- Addendum §4.5 Layer 5 `search_org_kb` is the primary deliverable from Phase 6 for downstream Phase 5 consumption.
- Addendum §4.7 sync reconciliation algorithm and §4.9 freshness edge cases land in Phase 6.
- Addendum §4.8 and §6.3 treat Org Health Assessment as V1 Phase 3 work using Managed Agents. BEF defers REQ-ORG-009 to V2. Conflict flagged in §7.

**Codebase state:**
- Org metadata models: `OrgComponent`, `OrgRelationship`, `OrgSyncRun`, `OrgIngestionRun`, `DomainGrouping`, `BusinessContextAnnotation`.
- Knowledge article model: `KnowledgeArticle` (with `embedding vector(1024)`).
- Org ingestion Inngest (Managed Agents reference): `src/lib/inngest/functions/org-ingestion.ts`.
- Article refresh: `src/lib/inngest/functions/article-refresh.ts`.
- Metadata sync: `src/lib/inngest/functions/metadata-sync.ts`.
- Staleness detection: `src/lib/inngest/functions/staleness-detection.ts`.
- MISSING: Layer 2 component embeddings on-sync enqueue (partial), Layer 3 manual domain creation UI, Layer 4 annotations CRUD + UI, Layer 5 `search_org_kb` primitive, sync reconciliation algorithm, brownfield domain proposal Managed Agent integration.

**Task changes:**

| Action | Task ID / Title | Change | Rationale |
|--------|-----------------|--------|-----------|
| MODIFY | REQ-ORG-004: Full-text search index | Tier 2 of 3-tier search per replan 2026-04-10. Now explicitly Layer 5 input. | Per Addendum §4.5. |
| MODIFY | REQ-ORG-005: Semantic search (Phase 7 hook) | Replaced by Layer 5 `search_org_kb` primitive that consumes Layer 2 component embeddings and Layer 4 annotation embeddings. No Phase 7 hook. | Per Addendum §4.5. |
| MODIFY | REQ-ORG-009: Org Health Assessment | Conditional un-defer from V2. If user accepts V1 placement per §7 conflict resolution, task becomes Phase 6 XL using Managed Agents per Addendum §4.8. If user keeps BEF V2 deferral, task stays deferred. | Conflict per Addendum §4.8, §6.3 vs. BEF Phase 6 deep-dive outcome. |
| ADD | REQ-ORG-NEW-1: Layer 2 component embeddings on-sync | Ensures every metadata sync enqueues embedding generation for new/changed OrgComponent rows. Substrate exists; this closes the on-sync hook. | Per Addendum §4.2. |
| ADD | REQ-ORG-NEW-2: Layer 3 domain entities + manual creation UI | CRUD on `DomainGrouping`. UI under `src/app/(dashboard)/projects/[projectId]/org/`. | Per Addendum §4.3. |
| ADD | REQ-ORG-NEW-3: Layer 4 annotations CRUD + UI + embeddings | CRUD on `BusinessContextAnnotation`. On-write embedding enqueue. UI surfacing annotations per component. | Per Addendum §4.4. |
| ADD | REQ-ORG-NEW-4: Layer 5 search_org_kb primitive | Implements `searchOrgKB(params)` combining Layer 2 component embeddings, Layer 4 annotation embeddings, BM25 over OrgComponent text fields, with reciprocal rank fusion. Used by Phase 5 Context Package API. | Per Addendum §4.5. |
| ADD | REQ-ORG-NEW-5: Sync reconciliation algorithm | Implements reconciliation per Addendum §4.7: additions, modifications, soft-archive on deletions, orphan edge handling. | Per Addendum §4.7. |
| ADD | REQ-ORG-NEW-6: Freshness edge cases | Handles the edge cases listed in Addendum §4.9: embedding staleness on annotation edit, cascading invalidation, in-flight sync race. | Per Addendum §4.9. |
| ADD (CONDITIONAL) | REQ-ORG-NEW-7: Managed Agents integration for Org Health Assessment and brownfield domain proposal | Depends on §7 conflict resolution. If Managed Agents become V1 scope, this task implements the Anthropic Managed Agents wiring. | Per Addendum §4.8, §6.3. |

**Revised phase scope:** Phase 6 delivers the full five-layer org knowledge model: Layer 2 component embeddings (on-sync), Layer 3 domain entities with manual creation, Layer 4 annotations with embeddings, Layer 5 `search_org_kb` primitive. Sync reconciliation and freshness edge cases are handled. Article management and staleness detection remain. Org Health Assessment V1 placement and Managed Agents integration depend on user resolution of the conflict flagged in §7.

**Revised task count:** 13 original + 6 ADD (plus 1 conditional) = 19 or 20 tasks. Complexity: approximately 6 S, 7 M, 5 L, 1 XL (conditional).

---

### Phase 7: Dashboards, Search

**Current scope (from PHASE_SPEC.md):** System dashboards with health score signal counter, semantic search across 3 new entity types (tsvector expansion), absorbed Phase 1 cost/audit gaps.
**Current task count:** 15 tasks (6 S, 6 M, 3 L).
**Execution state:** Specced, not started. Deep-dive completed 2026-04-10.

**Addendum deltas:**
- Addendum §5.2.4 Briefing/Status pipeline lands here. Dashboard narrative synthesis runs through this pipeline per Addendum §1 cross-reference (PRD §17 implementation updated).
- Addendum §5.5 model router governs dashboard synthesis calls.
- Addendum §5.6 evals include 10 fixtures for Briefing/Status pipeline.
- Absorbed cost/audit tasks already present; Addendum §3.1 tightens cost cap semantics.

**Codebase state:**
- Dashboard Inngest: `src/lib/inngest/functions/dashboard-synthesis.ts`, `pm-dashboard-synthesis.ts`.
- Dashboard actions: `src/actions/dashboard.ts`, `pm-dashboard.ts`.
- Dashboard routes: `src/app/(dashboard)/projects/[projectId]/dashboard/`, `pm-dashboard/`.
- Briefing task def: `src/lib/agent-harness/tasks/briefing-generation.ts`, `dashboard-synthesis.ts`.
- Global search: `src/lib/search/global-search.ts`.
- MISSING: Briefing/Status pipeline formalization (task defs exist; framework binding missing).

**Task changes:**

| Action | Task ID / Title | Change | Rationale |
|--------|-----------------|--------|-----------|
| MODIFY | REQ-DASH-002: Health score engine | Implementation unchanged in behavior. Runs as deterministic, not AI. Retained. | Alignment with Addendum §1 (PRD §17 deterministic metrics). |
| MODIFY | REQ-DASH-004: Real-time metric aggregation | Deterministic. Retained. | Addendum §1. |
| MODIFY | REQ-DASH-007: Semantic search | Consumes both `search_project_kb` (Phase 1) and `search_org_kb` (Phase 6). | Per Addendum §4.5, §5.4. |
| MODIFY | REQ-DASH-009: Cost dashboard | Surfaces cost caps from Phase 1 REQ-RBAC-015 and embedding provider spend. | Per Addendum §3.1. |
| ADD | REQ-DASH-NEW-1: Briefing/Status pipeline formalization | Wraps existing briefing/dashboard synthesis task defs as formal Pipeline. Uses model router (Sonnet for synthesis). | Per Addendum §5.2.4. |
| ADD | REQ-DASH-NEW-2: Briefing/Status pipeline evals | 10 fixtures covering green/yellow/red project states. | Per Addendum §5.6. |

**Revised phase scope:** Phase 7 delivers dashboards backed by deterministic metric aggregation plus narrative synthesis via the formalized Briefing/Status pipeline. Semantic search spans both project and org knowledge via the two retrieval primitives. Cost and audit dashboards surface cap enforcement. Eval coverage extends.

**Revised task count:** 15 original + 2 ADD = 17 tasks. Complexity: approximately 6 S, 7 M, 4 L.

---

### Phase 8: Documents, Notifications

**Current scope (from PHASE_SPEC.md):** Work item documentation, notification delivery system, rate limit handling.
**Current task count:** 9 tasks.
**Execution state:** Specced, not started. Deep-dive completed 2026-04-10.

**Addendum deltas:**
- No direct Addendum scope changes. Document generation and notifications are PRD §16 and §17 territory.
- Indirect: documents generated by pipelines (Story Generation, Briefing/Status) must respect model router and pipeline framework from Phase 1/2.
- Branding module (`src/lib/documents/branding.ts`) retained.

**Codebase state:**
- Document Inngest: `src/lib/inngest/functions/document-generation.ts`.
- Document content task def: `src/lib/agent-harness/tasks/document-content.ts` (15 KB, largest in the directory).
- Notification dispatch: `src/lib/inngest/functions/notification-dispatch.ts`.
- Document actions: `src/actions/documents.ts`, `notifications.ts`.
- Document routes: `src/app/(dashboard)/projects/[projectId]/documents/`.
- Branding: `src/lib/documents/branding.ts`.

**Task changes:**

| Action | Task ID / Title | Change | Rationale |
|--------|-----------------|--------|-----------|
| MODIFY | REQ-DOCS-002: Document upload pipeline | Runs as pipeline per framework from Phase 2. | Per Addendum §5.1. |
| MODIFY | REQ-DOCS-006: Notification delivery engine | Unchanged; listed for traceability. | n/a |

**Revised phase scope:** Unchanged. Phase 8 delivers document upload, versioning, generation, notifications, and rate limit handling. Implementations reuse the pipeline framework and branding module.

**Revised task count:** 9 tasks, unchanged. Complexity unchanged.

---

### Phase 9: QA, Jira, Archival, Lifecycle

**Current scope (from PHASE_SPEC.md):** QA orchestration, Jira sync, work item archival, lifecycle state management.
**Current task count:** 11 tasks.
**Execution state:** Specced, not started. Deep-dive completed 2026-04-10.

**Addendum deltas:**
- None. Addendum §10 ("What This Addendum Does Not Change") explicitly preserves QA, Jira, archival, and lifecycle scope.

**Codebase state:**
- Jira Inngest: `src/lib/inngest/functions/jira-sync.ts`.
- Jira actions: `src/actions/jira-sync.ts`, project-archive: `src/actions/project-archive.ts`.
- QA test case/execution models: `TestCase`, `TestExecution`, `Defect`.
- QA actions: `src/actions/test-executions.ts`, `defects.ts`.
- Jira models: `JiraConfig`, `JiraSyncRecord`.

**Task changes:** None.

**Revised phase scope:** Unchanged.

**Revised task count:** 11 tasks, unchanged.

---

### Phase 10: Work Tab UI Overhaul

**Current scope (from PHASE_SPEC.md):** Shared component library (PageHeader, DetailPageLayout, FilterBar, StatusBadge, ProgressBar, EditableField, MetadataSidebar, StatCard), Work overview redesign with "All Stories" view, Epic/Feature/Story detail page overhauls to two-column layout, kanban enhancements.
**Current task count:** 12 tasks. Overall complexity XL.
**Execution state:** Specced, not started. Added 2026-04-10.

**Addendum deltas:**
- None. UI overhaul is orthogonal to Addendum intelligence layer.
- Implication: Phase 10 should run after Phase 2 freeform agent integration so any chat surfaces are built with the redesigned components. Current PROJECT_STATE.md recommends Phase 10 run second (after Phase 1, before Phases 2-9). Addendum does not alter this recommendation.

**Codebase state:** UI components distributed across `src/components/` and route-colocated components. Shared library not yet scaffolded.

**Task changes:** None.

**Revised phase scope:** Unchanged.

**Revised task count:** 12 tasks, unchanged.

---

## 3. Dependency diagram

Post-integration dependencies (arrows read "is required by"):

```
Phase 1 (RBAC/security + model router + eval harness + pipeline schema + retrieval primitive)
  |
  +--> Phase 2 (Pipeline framework + Transcript/Answer/Story pipelines + Freeform agent)
  |       |
  |       +--> Phase 3 (Discovery, Questions) [consumes Answer Logging pipeline, evals]
  |       |
  |       +--> Phase 4 (Work Management) [consumes Story Generation pipeline]
  |       |
  |       +--> Phase 7 (Dashboards, Search) [consumes Briefing/Status pipeline]
  |       |
  |       +--> Phase 8 (Documents, Notifications) [consumes pipeline framework]
  |
  +--> Phase 6 (Org, Knowledge) [consumes embeddings, retrieval primitive, model router]
  |       |
  |       +--> Phase 5 (Sprint, Developer API) [consumes search_org_kb for Context Package]
  |       |
  |       +--> Phase 7 (Dashboards, Search) [consumes search_org_kb for semantic search]
  |
  +--> Phase 10 (UI Overhaul) [independent of intelligence layer; runs after Phase 1]

Phase 9 (QA, Jira, Archival, Lifecycle) depends only on Phase 4 for Story lifecycle transitions.
```

Key change from pre-integration dependency graph:
- Phase 1 now gates every AI-touching phase (2, 3, 4, 5, 6, 7, 8). Previously Phase 1 only gated RBAC-dependent phases.
- Phase 5 gains a soft dependency on Phase 6 Layer 5 delivery.
- Phase 6 moves upstream of Phase 5 and Phase 7 for retrieval substrate.

---

## 4. Gating decisions (Addendum §9.4, verbatim)

All four decisions must be confirmed before Phase 1 can be reopened.

### Decision 1: Embedding provider (Voyage AI vs. OpenAI)

**Verbatim (Addendum §9.4):** "Embedding provider (Voyage AI vs. OpenAI)."

**Current codebase state:** Voyage AI with 1024-dim vectors per `prisma/migrations/vector-dimension-1024.sql` and `src/lib/search/embeddings.ts`.

**Recommendation:** Confirm Voyage AI. Voyage offers stronger retrieval quality on code/document corpora than OpenAI text-embedding-3-large at comparable cost and the codebase is already committed to 1024-dim. Data handling agreement (no training, no retention) must be confirmed per Addendum §3.1 before this decision is final.

**Action required:** User confirmation.

### Decision 2: Background job runner (Inngest vs. Trigger.dev vs. alternative)

**Verbatim (Addendum §9.4):** "Background job runner (Inngest vs. Trigger.dev vs. alternative)."

**Current codebase state:** Inngest, 15 functions in `src/lib/inngest/functions/`.

**Recommendation:** Confirm Inngest. Project is committed; CLAUDE.md stack locks Inngest 4.1.2 with free tier sufficient for V1. Pipeline framework in Phase 2 REQ-AGENT-001 (modified) binds to Inngest step functions.

**Action required:** User confirmation.

### Decision 3: Pipeline-first architecture supersedes any existing "generic harness" design

**Verbatim (Addendum §9.4):** "That the pipeline-first architecture supersedes any existing 'generic harness' design."

**Current codebase state:** Generic harness exists (`src/lib/agent-harness/engine.ts`). Task defs in `src/lib/agent-harness/tasks/` are pipeline-shaped but not formalized. Addendum §1 supersedes PRD §6 in substance.

**Recommendation:** Confirm pipeline-first. Phase 2 REQ-AGENT-001 (MODIFY) replaces the generic engine with a Pipeline/Stage/StageRun abstraction. The existing `engine.ts` is retired; its tool-execution logic migrates into the freeform agent and a shared pipeline stage runner.

**Action required:** User confirmation.

### Decision 4: Eval harness included in Phase 1 scope

**Verbatim (Addendum §9.4):** "That eval harness is included in Phase 1 scope."

**Current codebase state:** No eval harness. No `src/evals/`, no runner, no CI gate.

**Recommendation:** Confirm Phase 1 inclusion. Phase 1 REQ-RBAC-NEW-2 creates the scaffold with 10 fixtures each for Transcript Processing and Answer Logging. Downstream pipelines extend in their respective phases. Late addition of evals means losing early regression protection on the very pipelines that encode firm IP.

**Action required:** User confirmation.

---

## 5. Phase 1 reopening note

Phase 1 RBAC/security/governance sub-scope is complete (14/14 tasks). Per Addendum §6.1, Phase 1 must be reopened with the following new tasks before Phase 2 can begin:

| New Task ID | Title | Complexity |
|-------------|-------|------------|
| REQ-RBAC-NEW-1 | Model router module | M |
| REQ-RBAC-NEW-2 | Eval harness scaffold + CI gate (10 Transcript + 10 Answer Logging fixtures) | L |
| REQ-RBAC-NEW-3 | Pipeline framework tables + schema (PipelineRun, PipelineStageRun, EvalRun) | M |
| REQ-RBAC-NEW-4 | Embedding enqueue on write for Layer 1 entities | M |
| REQ-RBAC-NEW-5 | Hybrid retrieval primitive audit and formalization | M |
| REQ-RBAC-NEW-6 | Layer 1 org KB schema verification | S |
| REQ-RBAC-NEW-7 | Embedding provider data handling agreement | S |

Phase 1 state transitions from COMPLETE to IN PROGRESS on replan adoption. The RBAC/security sub-scope remains COMPLETE; the reopen adds net new tasks and does not re-do finished work.

---

## 6. Replan log entry

Draft entry for appending to `docs/bef/PROJECT_STATE.md` Replan Log:

> 2026-04-13: PRD Addendum v1 (Intelligence Layer) integration adopted. Phase 1 reopened with 7 ADD tasks covering model router, eval harness scaffold + CI gate, pipeline framework schema (PipelineRun/PipelineStageRun/EvalRun), on-write embedding enqueue for Layer 1 entities, hybrid retrieval primitive formalization, Layer 1 org KB schema verification, and embedding provider data handling agreement. Phase 2 retargeted to deliver formal Pipeline framework + four pipelines (Transcript Processing, Answer Logging, Story Generation, Briefing/Status lands in Phase 7) + freeform agent wiring (all task defs exist; framework and eval bindings are net new). Phase 3 absorbs Answer Logging pipeline UI wiring + discovery pipeline evals. Phase 4 binds Story Generation pipeline to Work UI. Phase 5 soft-depends on Phase 6 Layer 5 delivery for Context Package API richness. Phase 6 expands to full five-layer org KB (Layer 2 on-sync embeddings, Layer 3 domains, Layer 4 annotations, Layer 5 search_org_kb, sync reconciliation, freshness edge cases). Phase 7 formalizes Briefing/Status pipeline + evals. Phases 8, 9, 10 scope unchanged. Four gating decisions (Addendum §9.4) require user confirmation before Phase 1 reopen begins. Open conflict: Org Health Assessment + Managed Agents placement (Addendum §4.8/§6.3 V1 vs. BEF Phase 6 V2 deferral) requires user resolution; see ADDENDUM-INTEGRATION-PLAN.md §7.

---

## 7. Risks and ambiguities

### 7.1 CRITICAL: Org Health Assessment V1 vs. V2 placement (requires user decision)

- Addendum §4.8 and §6.3 treat Org Health Assessment and brownfield domain proposal as V1 Phase 3 work executed via Claude Managed Agents.
- BEF Phase 6 deep-dive on 2026-04-10 deferred REQ-ORG-009 (Org Health Assessment, XL) to V2 with rationale "no downstream blockers."
- These directly contradict. Managed Agents integration itself depends on this resolution (Phase 3 REQ-DISC-NEW-3 and Phase 6 REQ-ORG-NEW-7 are conditional).
- **Recommendation:** Resolve by accepting Addendum placement (V1, Phase 6 for Org Health Assessment scope + Phase 3 brownfield proposal) because Addendum is authoritative per Addendum §1. This reverses the 2026-04-10 V2 deferral. Alternative: escalate to user that BEF deferral was made before Addendum was finalized.
- **Action required:** User decision.

### 7.2 Managed Agents cost and complexity (judgment call flagged)

- Addendum §2 and §4.8 describe Managed Agents as having "negligible" active-runtime cost relative to token cost, but do not specify a V1 budget.
- Cost caps per Addendum §3.1 apply; the integration plan assumes Managed Agent invocation is metered the same as regular Claude API usage against the per-project cap. If Managed Agents have separate billing or hosting fees, Phase 1 REQ-RBAC-015 cost caps must be extended.
- **Judgment call:** Assumed token-cost parity. User should confirm billing model before Phase 6 REQ-ORG-NEW-7 begins.

### 7.3 Pipeline framework vs. existing task defs (judgment call)

- `src/lib/agent-harness/tasks/` contains 13 pipeline-shaped files that are not currently executed via a Pipeline abstraction. Phase 2 REQ-AGENT-001 (MODIFY) formalizes the framework.
- **Judgment call:** Existing task defs are preserved as pipeline stage implementations, not rewritten. If they are found to violate Addendum §5.1 stage DAG contract (for example, if they short-circuit, chain unexpectedly, or lack mandatory field validation), rewrite cost is absorbed into Phase 2 REQ-AGENT-NEW-1 through REQ-AGENT-NEW-4. No separate task is created for discovery of these violations.

### 7.4 Layer 1 schema fit (judgment call)

- Addendum §4.1 specifies `org_components` and `component_edges` as Layer 1 schema. Existing Prisma has `OrgComponent` and `OrgRelationship`.
- Column-level parity is not confirmed. Phase 1 REQ-RBAC-NEW-6 is a delta audit; if the gap is large enough to require schema migration, task complexity will be revised upward during Phase 1 execution.
- **Judgment call:** Estimated S complexity. If audit finds material schema drift, replan task to M or L.

### 7.5 Embedding dimension lock-in

- pgvector columns are 1024-dim (Voyage). Switching to OpenAI text-embedding-3-small (1536 dim) or text-embedding-3-large (3072 dim) requires schema migration and full re-embedding. This is a hard cost of Gating Decision 1.
- **Implication:** If user reverses to OpenAI during Phase 1 gating, Phase 1 task REQ-RBAC-NEW-6 expands to include dimension migration and full re-embed of OrgComponent + KnowledgeArticle corpora.

### 7.6 Freeform agent scope drift

- Chat surface already has 31 tools. Addendum §5.3 describes the freeform agent as narrow: "open-ended PM/BA interactions." 31 tools is not narrow.
- **Judgment call:** Existing tools are retained in Phase 2 REQ-AGENT-NEW-4 integration. Tool reduction or gating by user role is deferred; flag surfaces here for the user to decide whether 31 tools is the narrow agent intent.

### 7.7 Phase 10 sequencing

- PROJECT_STATE.md recommends Phase 10 (UI Overhaul) run second, after Phase 1, before Phases 2-9. Addendum does not contradict but Phase 1 is now heavier; running Phase 10 immediately after expanded Phase 1 delays Phase 2 further.
- **Judgment call:** Integration plan preserves the existing recommendation. User may wish to reconsider given Phase 1 expansion.

### 7.8 Answer Logging pipeline shape (ambiguity)

- Addendum §5.2.2 describes Answer Logging pipeline but does not enumerate stages as precisely as §5.2.1 (Transcript Processing) or §5.2.3 (Story Generation).
- **Judgment call:** Plan lists five stages (classify, link, persist, embed, notify) based on analogy with Transcript Processing. User may prefer different stage boundaries; revisit at Phase 2 REQ-AGENT-NEW-2 kickoff.

---

**End of integration plan.**
