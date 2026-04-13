# Audit Report — ADDENDUM-INTEGRATION-PLAN.md

**Date:** 2026-04-13
**Auditor:** Technical Review (Claude Opus 4.6, 1M context)
**Target:** `docs/bef/ADDENDUM-INTEGRATION-PLAN.md`
**Source of truth:** `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md`
**Supporting sources:** `docs/bef/02-phase-plan/PHASE_PLAN.md`, `prisma/schema.prisma`, `src/lib/agent-harness/`, `src/lib/search/`

---

## VERDICT

**NEEDS REVISION** — Plan is structurally sound and faithfully reproduces most pipeline stages, but has several factual errors about existing codebase state, one missing entity, one omitted open question, a fixture-count discrepancy, and incomplete schema-migration treatment for three pre-existing models. These will cause rework if uncorrected.

---

## CRITICAL ISSUES

### C1. Existing hybrid retrieval is treated as non-existent

**Plan §Phase 11 (line 62-64)** specifies building `search_project_kb` as new at `src/lib/ai/search.ts`. Reality: a three-layer hybrid retrieval system already exists at `src/lib/search/global-search.ts` (structured + tsvector full-text + pgvector semantic), called from `src/lib/agent-harness/context/smart-retrieval.ts`. The plan's refactoring guidance (addendum §9.1) treats this as net-new construction rather than a refactor/generalization.

**Consequence:** duplicated implementation, or late discovery forces rewrite. Phase 11 deep-dive must start with: "audit `globalSearch()` for reuse as the primitive."

### C2. `component_embeddings` conflicts with existing `OrgComponent.embedding` column

**Plan §Phase 6 Schema Additions** lists `component_embeddings` as a new table. Current `prisma/schema.prisma` has `OrgComponent.embedding Unsupported("vector(1536)")` inline on the component row. Moving to a separate table per addendum §4.3 is a SCHEMA MIGRATION, not a net-new addition. The plan does not flag the migration, the drop-column, the back-fill of `embedded_text_hash` + `embedding_model`, or the dual-write transition.

**Also unmentioned:** `KnowledgeArticle.embedding` vector column already exists and is not addressed.

### C3. `unresolved_references` materialized view is missing entirely

**Addendum §7** explicitly lists `unresolved_references` (materialized view over `component_edges` where `target_component_id IS NULL`). **Plan** does not mention it anywhere: not in Phase 11, not in Phase 6 schema tables, not in Layer 1 coverage.

### C4. Story Generation fixture count is wrong (10 vs. 15)

**Plan §Phase 2** says "10 labeled fixtures for Story Generation pipeline."
**Addendum §5.2.3:** "15 labeled requirement-to-story fixtures."

Direct factual error.

### C5. Addendum §8 Open Question F is omitted from Outstanding Decisions

**Addendum §8.F** adds "Rename collision edge case" as a decision needing an edge-case fixture validated during ingestion phase. **Plan's Outstanding Decisions table** captures A, B, C, D, E but omits F.

### C6. Existing `BusinessContextAnnotation` + `DomainGrouping` conflicts under-specified

Plan does mention migrating `BusinessContextAnnotation` → `annotations` and `DomainGrouping` → `domains` in the Phase 6 prose, but the **"New Data Model Entities" table lists both as clean additions** with no migration flag. A reviewer of just that table will miss the migration work. Polymorphic rewrite of `annotations` (non-polymorphic today) is non-trivial.

---

## MINOR ISSUES

- **M1.** `annotation_versions` optional table (addendum §4.5) not mentioned.
- **M2.** Stage failure semantics (addendum §5.2.1: "idempotent, 3-retry, human-review queue with partial state preserved") not carried into Phase 2 spec guidance.
- **M3.** `eval_runs` optional table (addendum §7) not addressed. Low priority but should be explicit (file-only vs. DB persistence decision).
- **M4.** "Eval harness fixtures at Phase 11" mixes addendum §6.1 (Transcript + Answer Logging, each 10) with §5.6 ("10 per pipeline at Phase 1 ship"). Plan follows §6.1 correctly, but should explicitly cite it to explain why Story/Briefing fixtures defer.
- **M5.** Plan's "tech stack additions" table says "pgvector: already in Neon; confirm HNSW index support enabled." HNSW support is standard in pgvector 0.5+; worth verifying current Neon-provisioned version rather than leaving as an open check.
- **M6.** Plan's Phase 2 schema table says `agent_conversations`/`agent_messages` "(may extend existing ChatMessage)" but `Conversation` + `ChatMessage` + `ConversationType` enum (GENERAL_CHAT, STORY_SESSION, etc.) already exist. Direction should be "extend, not replace."
- **M7.** The existing harness has 12 task types (`TRANSCRIPT_PROCESSING`, `STORY_GENERATION`, `BRIEFING_GENERATION`, `QUESTION_ANSWERING`, `STORY_ENRICHMENT`, `STATUS_REPORT_GENERATION`, `DOCUMENT_GENERATION`, `SPRINT_ANALYSIS`, `CONTEXT_PACKAGE_ASSEMBLY`, `ORG_QUERY`, `DASHBOARD_SYNTHESIS`, `ARTICLE_SYNTHESIS`). Plan's Phase 2 prose only addresses the 4 pipelines. What happens to the other 8 task types is not specified; they likely fold into Answer Logging / Story Gen / Briefing pipelines + doc pipeline, but the mapping should be explicit.

---

## SCHEMA CONFLICTS

| Entity in Plan | Actual State in `prisma/schema.prisma` | Classification |
|---|---|---|
| `annotations` (polymorphic) | `BusinessContextAnnotation` exists (OrgComponent-scoped only) | **Migration + polymorphic rewrite**, not pure new |
| `domains` | `DomainGrouping` exists (`id, projectId, name, description, confidence, isAiSuggested, isConfirmed`) | **Rename + field additions** (`source`, `status`, `archived_reason`), not pure new |
| `component_embeddings` | `OrgComponent.embedding vector(1536)` inline column exists | **Table extraction + schema shift**, not pure new |
| `agent_conversations` / `agent_messages` | `Conversation` + `ChatMessage` + `ConversationType` enum exist | **Extend existing models**, not pure new |
| `KnowledgeArticle.embedding` | Exists inline; plan does not mention its fate under Layer 2 strategy | Unaddressed |
| All other Phase 11 tables (`component_edges`, `*_embeddings` for question/decision/requirement/risk/story, `pipeline_runs`, `pipeline_stage_runs`, `pending_review`, `conflicts_flagged`) | Do not exist | **Truly new** |
| `component_history`, `domain_memberships`, `annotation_embeddings`, `org_health_reports` | Do not exist (note: `VersionHistory` is generic, not component-specific) | **Truly new** |

---

## CONFIRMED CORRECT

- **Phase 2 pipeline stages match addendum §5.2.1–§5.2.4 exactly:** 7 Transcript / 6 Answer / 7 Story / 5 Briefing stages; model assignments (Haiku/Sonnet/deterministic) all match.
- **Briefing types** enum (`daily_standup`, `weekly_status`, `executive_summary`, `blocker_report`, `discovery_gap_report`, `sprint_health`) reproduced exactly.
- **Context Package Assembly 9 steps** (Phase 5) reproduce addendum §4.6 verbatim, including "single Sonnet call at step 8" and <3s p95 target.
- **Model routing intent mapping** matches addendum §5.5 defaults (extract→Haiku 4.5, synthesize/generate_structured→Sonnet 4.6, reason_deeply→Opus 4.6, embed→provider).
- **Freeform agent tool allowlist** matches addendum §5.3: read tools (6), write tools with UI confirmation (3), explicit not-available list (story/transcript/answer/doc/sprint).
- **Org Health Assessment restored to V1** (Phase 6) per addendum §4.8; correctly reverses original Phase 6 spec's V2 deferral.
- **Managed Agents scope correctly limited** to exactly the two workloads in addendum §4.8 (Org Health + brownfield domain proposal).
- **Sync reconciliation 5-step algorithm** (Phase 6) matches addendum §4.7 (salesforce_metadata_id first, fallback tuple, rename tracking, soft-archive).
- **RRF formula** `score = Σ (1 / (60 + rank_i))` and k=60 default match.
- **Phase dependency order** (1 → 11 ∥ 10 → 2 → 3 ∥ 4 ∥ 6 → 5 → 7 → 8 → 9) is logically consistent; no circular dependencies; Phase 5's dependence on Phase 6 for `search_org_kb` is correctly sequenced.
- **"What doesn't change" §10** is respected: RBAC, workflows, doc generation, archival are not flagged as changing anywhere in the plan.
- **Freeform agent timing** (end of Phase 2) matches addendum §6.5.

---

## RECOMMENDED EDITS

### E1. Fix fixture count (C4)

**Before (Phase 2 §Eval harness extension):** "10 labeled fixtures for Story Generation pipeline."
**After:** "15 labeled fixtures for Story Generation pipeline (per Addendum §5.2.3)."

### E2. Add `unresolved_references` materialized view (C3)

**In Phase 11 schema additions table**, add row:

| `unresolved_references` | Materialized view over `component_edges` where `target_component_id IS NULL`; surfaces dynamic SOQL/Apex callouts and feeds Org Health findings. |

### E3. Add Open Question F (C5)

**In Outstanding Decisions table**, add row:

| Rename collision edge case | Phase 6 implementation | Validate with edge-case fixture: if a Salesforce metadata ID is reused after deletion and a new component reuses the prior `api_name`, sync must treat as new (ID-first rule). Per Addendum §8.F. |

### E4. Reclassify schema "additions" as migrations where applicable (C2, C6, S-table)

**Under "New Data Model Entities," replace Phase 6 Schema Additions heading with two subsections:**

*Phase 6 Schema Migrations (existing models):*
- `DomainGrouping` → `domains` (rename + add `source`, `status`, `archived_reason` fields)
- `BusinessContextAnnotation` → `annotations` (polymorphic rewrite with `entity_type` + `entity_id`, add `content_type`, `source`, `status` fields)
- `OrgComponent.embedding` (inline vector column) → extracted into `component_embeddings` table (add `embedded_text`, `embedded_text_hash`, `embedding_model`); include back-fill strategy
- `KnowledgeArticle.embedding`: decide fate (retain inline, migrate to parallel table, or deprecate) and document

*Phase 6 Schema Additions (truly new):* `component_history`, `domain_memberships`, `annotation_embeddings`, `org_health_reports`

### E5. Reclassify Phase 2 schema (M6)

**Before:** "Phase 2 Schema (if not already in existing schema) ... agent_conversations ... agent_messages (may extend existing ChatMessage)."
**After:** "Phase 2: extends existing `Conversation` + `ChatMessage` + `ConversationType` models. Add `agent_conversation_type` or reuse `ConversationType` enum values (GENERAL_CHAT maps to freeform agent). No new top-level table required unless agent-specific metadata demands it."

### E6. Add hybrid-retrieval reuse note to Phase 11 (C1)

**Add to Phase 11 "What to build" §3 (Hybrid retrieval primitive):**

"Existing `src/lib/search/global-search.ts` implements a three-layer hybrid (structured + tsvector + pgvector) used today by `smart-retrieval.ts`. Phase 11 should generalize and relocate this to `src/lib/ai/search.ts` rather than rebuild. Audit first; refactor; retain call sites."

### E7. Specify fate of unaddressed task types (M7)

**Add to Phase 2 scope:**

"Existing `TaskType` enum values not covered by the four pipelines (`QUESTION_ANSWERING`, `STORY_ENRICHMENT`, `STATUS_REPORT_GENERATION`, `DOCUMENT_GENERATION`, `SPRINT_ANALYSIS`, `CONTEXT_PACKAGE_ASSEMBLY`, `ORG_QUERY`, `DASHBOARD_SYNTHESIS`, `ARTICLE_SYNTHESIS`) must be explicitly re-mapped during Phase 2 deep-dive: either fold into a pipeline (e.g., `QUESTION_ANSWERING` → Answer Logging), a different phase (`DOCUMENT_GENERATION` → Phase 8), or deprecate. No generic task-type execution remains after Phase 2."

### E8. Add failure/retry semantics (M2)

**Add to Phase 2 Transcript Processing description:**

"Each stage is idempotent and retry-safe; stage failure after 3 retries escalates to human-review queue with partial state preserved. Raw transcript text always retained on input."

### E9. Add `annotation_versions` and `eval_runs` as explicit deferred/optional (M1, M3)

Add footnote to Phase 6 and Phase 11 schema tables noting these optional persistence tables exist in addendum §4.5 and §7 and are deferred unless needed.

---

## BOTTOM LINE

The plan captures the intent faithfully but understates the "brownfield" work the addendum implies. The single riskiest gap is C1+C2: Phase 11 will likely over-build and Phase 6 will under-plan migrations unless these are corrected before deep-dive.
