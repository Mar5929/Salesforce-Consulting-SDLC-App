# Phase 6 Spec: Org Knowledge — Five-Layer Intelligence Model

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Addendum Source: [PRD-ADDENDUM-v1-Intelligence-Layer.md §4](../../00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md)
> Depends On: Phase 11 (Infrastructure Tables), Phase 2 (Agent Harness, Answer Logging Pipeline)
> Unlocks: Phase 5 (Context Package Assembly), Phase 7 (Dashboards/Search), Phase 6b (Org Health Assessment)
> Complexity: XL
> Status: Ready for execute (re-dive complete 2026-04-14)
> Last Updated: 2026-04-14
> Note: Org Health Assessment was split out into [Phase 6b](../phase-06b-org-health-assessment/PHASE_SPEC.md) during the 2026-04-14 re-dive.

---

## 0. Change Log vs Pre-Addendum Spec

This spec was rewritten on 2026-04-13 to incorporate PRD Addendum v1. The pre-addendum version is available via git history prior to the 2026-04-14 cleanup.

Preserved (unchanged or lightly enhanced):
- REQ-ORG-001 — PKCE on OAuth Web Server Flow
- REQ-ORG-002 — Automated incremental sync cron with needsAssignment + soft-delete (enhanced with sync reconciliation algorithm)
- REQ-ORG-003 — Sync schedule configuration UI
- REQ-ORG-007 — KnowledgeArticle confirmation model
- REQ-ORG-009 — Planned component creation from story execution
- REQ-ORG-013 — Planned component status upgrade during sync

Replaced or expanded:
- Flat org knowledge → Five-Layer Model (Layers 1–5)
- `DomainGrouping` → `domains` + `domain_memberships`
- `BusinessContextAnnotation` → polymorphic `annotations` + `annotation_embeddings`
- `OrgComponent.embedding` (inline column) → `component_embeddings` parallel table
- REQ-ORG-004 full knowledge refresh — updated to use Layer 3/4 structures
- REQ-ORG-010 NLP org query — now calls `search_org_kb` (Layer 5)

Restored from V2 deferral:
- Org Health Assessment (Claude Managed Agents, deterministic analyses, Word output)

---

## 1. Scope Summary

Implement the Org Metadata Intelligence Layer defined in PRD Addendum §4. The layer is populated during initial ingestion and maintained during incremental sync. Five layers sit on top of the existing `org_components` table:

1. **Component Graph** — typed edges between components (populated during sync).
2. **Semantic Embeddings** — parallel `component_embeddings` table with deterministic `embedded_text`.
3. **Business Domains** — many-to-many `domains` + `domain_memberships`, with brownfield AI proposal via Claude Managed Agents.
4. **Business Context Annotations** — polymorphic annotations over components, edges, or domains, with semantic search.
5. **Query & Retrieval Interface** — full `search_org_kb()` implementation (BM25 + vector, RRF merge, graph expansion).

Plus: sync reconciliation algorithm with rename detection (incl. ID-reuse heuristic), component history audit, knowledge refresh + articulation pipeline, NLP org query rewrite, and the six preserved requirements above.

**Org Health Assessment moved to [Phase 6b](../phase-06b-org-health-assessment/PHASE_SPEC.md).** Nothing in Phase 6a produces `org_health_reports` or the Word output; those are 6b-owned.

**Dependencies:**
- Phase 11 provides the empty schemas for `component_edges`, `component_embeddings`, and the `search_org_kb` function signature.
- Phase 2 provides the Answer Logging Pipeline that feeds AI-derived annotations.

**Unlocks:**
- Phase 5 Context Package Assembly (step 5 calls `search_org_kb`).
- Phase 7 Search (org entities resolve through Layer 5).

---

## 2. Functional Requirements

### 2.1 PKCE on OAuth Web Server Flow (REQ-ORG-001) — PRESERVED

Unchanged from pre-addendum spec (see git history pre-2026-04-14 for original §2.1 detail).

- Generate cryptographically random `code_verifier` (43–128 chars, base64url).
- `code_challenge = BASE64URL(SHA256(code_verifier))`.
- Store verifier alongside CSRF state, include in token exchange.
- Files: `src/lib/salesforce/oauth.ts`, `src/app/api/auth/salesforce/authorize/route.ts`, `src/app/api/auth/salesforce/callback/route.ts`.

**Auth flow scope (PRD-13-02):** OAuth 2.0 Web Server Flow + PKCE is the V1 default for interactive architect connection. JWT Bearer Flow (PRD-13-02) is acknowledged as a future option for CI / service-account use cases and is deferred to V2; not built in Phase 6. Closes GAP-12.

### 2.2 Automated Incremental Sync with Reconciliation Algorithm (REQ-ORG-002) — PRESERVED, ENHANCED

The existing cron + needsAssignment + soft-delete behavior is preserved. Enhancement: the per-component upsert inside each sync now runs the five-step **sync reconciliation algorithm** from Addendum §4.7 and integration plan §225–230.

Sync reconciliation (per fetched component from Salesforce):

1. **Match by `salesforce_metadata_id`** (durable identity). If matched → update in place.
2. **Fallback: match by `(api_name, component_type, parent_component_id)`**. If matched → treat as same component, update `salesforce_metadata_id` if previously null.
3. **No match → create new** `org_components` row.
4. **Rename detected** (match by ID but `api_name` differs): append row to `component_history` (`change_type = rename`, old/new api_name, timestamp), update `api_name` on the component, preserve annotations, domain memberships, and edges (all keyed by component ID, not name).
5. **After sync loop completes**: any active component in the project not seen in this sync run is soft-archived (`status = archived`, `archived_at = now()`, `archived_reason = "not_seen_in_sync"`).

Rename-collision edge case (Addendum §8.F): rule is **match-by-ID first, treat-as-new-on-mismatch**.

**Re-dive addition — ID-reuse heuristic (2026-04-14):** if the matched row is **archived AND `archived_at` is more than 30 days old AND Levenshtein distance between the stored `api_name` and the incoming `api_name` exceeds 50% of the longer name's length**, treat the incoming component as NEW (create fresh row, leave archived row archived). Otherwise, treat as legitimate rename. This prevents a false-positive rename when SF reuses a metadata ID after a deletion. Fixture in `/evals/org_knowledge/rename_collision/` (Task 36) exercises all three branches: legitimate rename, ID reuse with dissimilar name, ID reuse with similar name.

**Rename-collision edge-case fixture ownership (corrected):** the labeled edge-case fixture that validates the `salesforce_metadata_id` reuse-after-deletion behavior (current rule: match by ID first; if ID mismatch, treat as new component) is **owned by Phase 6**. The fixture itself physically lives in the Phase 11 eval infrastructure (under `/evals/org_knowledge/rename_collision/`), but its authorship, gold labels, and update responsibility belong to Phase 6. The Addendum §8.F draft assignment to Phase 3 is incorrect and superseded by this note.

Managed-package components (namespace non-empty): synced, but flagged `is_managed = true` and excluded from AI domain proposals by default. Project setting can override.

Other REQ-ORG-002 behavior unchanged:
- Inngest dual trigger: `{ event: "org.sync-requested" }` + `{ cron: "0 */4 * * *" }`.
- Skip projects whose interval has not elapsed.
- `needsAssignment = true` flagging for new unclassified components.
- `sfOrgLastSyncAt` updated on success.
- `METADATA_SYNC_COMPLETE` notification emitted.

**Large-org chunking gate (closes GAP-18, ADD-4.7-13):** when SF returns more than **10,000 custom fields OR more than 500 Apex classes** for a project, sync switches to chunked mode: page size 500 metadata items per SF CLI call, processed sequentially with 1-second inter-page sleep to respect API limits.

**Durable-ID quality warning (closes GAP-16, ADD-4.7-02):** on each sync run, count components SF returned without a durable metadata ID. If count > 0, emit a single `sync.durable_id_missing` warning log entry (count + first 5 api_names) and a `SYNC_DATA_QUALITY` notification at most once per run.

Files: `src/lib/inngest/functions/metadata-sync.ts`, `src/lib/salesforce/metadata-sync.ts` (reconciliation + rename detection + managed-pkg flag), `src/lib/salesforce/component-history.ts` (new — write audit rows).

### 2.3 Sync Schedule Configuration UI (REQ-ORG-003) — PRESERVED

Unchanged from pre-addendum spec.

### 2.4 Layer 1 — Component Graph

Populate `component_edges` (schema from Phase 11) during sync. Each edge has:
- `source_component_id`, `target_component_id` (nullable for unresolved), `edge_type` (references, extends, parents, calls, triggers, child_of, lookup, master_detail, grants_access_to, installed_by, etc.), `unresolved_reference_text` (when target null), `edge_metadata jsonb` (extractor-specific context: e.g., for `references` the source line number; for `lookup` the relationship_name and cascade_delete; for `grants_access_to` the access level read/edit/delete). Closes GAP-08(a).

**Edge extractors — full SF metadata coverage (PRD-13-04). Closes GAP-01.**

| Metadata family | Extractor strategy | Edge types written |
|-----------------|-------------------|-------------------|
| Custom/Standard fields | Field metadata parse | `lookup`, `master_detail` |
| Apex classes | Static parse | `references` (class→class/object/field), `extends`, `implements` |
| Apex triggers | Trigger metadata | `triggers` (to parent object), `references` |
| Flows / Process Builder / Workflows | Flow XML parse | `calls` (Apex/subflow), `references` (fields) |
| Validation rules / formulas | Formula text parse | `references` |
| LWC / Aura bundles | JS + HTML + meta.xml parse | `references` (to fields/objects/Apex via `@wire`, `getRecord`, `imports`) |
| Permission Sets / Profiles / Permission Set Groups | Metadata parse | `grants_access_to` (component → object/field/Apex), with `edge_metadata.access` = read/edit/delete |
| Connected Apps | Metadata parse | `references` (to OAuth scopes; tracked as `edge_metadata.scopes`) |
| Named Credentials | Metadata parse | `references` (to External Services / endpoints; `edge_metadata.endpoint`) |
| Remote Site Settings | Metadata parse | `references` (to URLs; `edge_metadata.url`) |
| Installed packages | Package manifest parse | `installed_by` linking each managed component to its package namespace component |

**Unresolved references** (`target_component_id = null` + `unresolved_reference_text`): preserved for dynamic SOQL, runtime Apex callouts, metadata API references that cannot be statically resolved. These surface through the `unresolved_references` materialized view from Phase 11 and feed Org Health findings (see §2.15 unresolved-references analyzer).

Managed-package components: edges involving managed components are recorded but the managed component is excluded from AI domain proposal walks by default.

**Phase 11 schema reconciliation (GAP-01, GAP-08):** Phase 11 `component_type` enum must include LWC, AURA, PERMSET, PROFILE, PERMSET_GROUP, CONNECTED_APP, NAMED_CREDENTIAL, REMOTE_SITE, INSTALLED_PACKAGE. `component_edges.edge_metadata jsonb` column must exist. Reconciliation handled via Phase 11 schema amendment in Task 5.

**Re-dive addition — Apex parser strategy (2026-04-14):** for Apex classes and triggers, the graph-builder MUST use the SF Tooling API (`ApexClassLocalMember`, `ApexTriggerLocalMember`, `SymbolTable`) for symbol resolution rather than a custom regex parser. Tooling API gives resolved references for free and avoids a long tail of parser edge cases. Regex-based extraction is acceptable only for metadata families without Tooling API coverage (Flow XML, validation rule formulas, LWC template text).

Files: `src/lib/salesforce/graph-builder.ts` (new — per-component-type edge extractors), `src/lib/salesforce/metadata-sync.ts` (call graph-builder after upsert).

### 2.5 Layer 2 — Semantic Embeddings

Populate `component_embeddings` (schema from Phase 11). Each row: `component_id`, `embedded_text`, `embedded_text_hash`, `embedding_model`, `embedding vector(512)`, `generated_at`. **Vector dimension hardcoded to 512 in V1 per DECISION-02 (Voyage 3-lite).**

**Deterministic embedded text** per component type. Closes GAP-09(a):
- Default: `api_name + label + description + help_text + inline_help` (ADD-4.3-02 requires `inline_help`).
- Apex class: `class comments (header doc comment) + first 50 lines of body` (ADD-4.9-03).
- Flow: `label + description + element names (joined)`.
- Validation rule: `error message + formula comments`.
- Trigger: `api_name + trigger events + first 50 lines of body`.
- LWC / Aura: `name + description + template visible text nodes (deduped, max 200 tokens)`.
- Permission Set / Profile / Permission Set Group: `name + label + description + count of grants`.
- Connected App: `name + description + OAuth scopes joined`.

**Re-embed only when `embedded_text_hash` changes** (SHA-256 of `embedded_text`). Bounds cost on large orgs.

HNSW index on `embedding` column with cosine distance (see Phase 11 migration).

**Large-org batching (closes GAP-18):**
- Embedding batch size = **50 components per provider API call**.
- Inngest step function fans out with **20 parallel workers max**.
- Provider 429 → exponential backoff 1s/2s/4s/8s, max 4 retries; final failure recorded as `component_embeddings.status='failed'` and retried on next sync.

Files: `src/lib/salesforce/embedding-pipeline.ts` (new — deterministic text builder + hash + enqueue), Inngest step function `component-embedding-batch` (fan-out over dirty components).

### 2.6 Layer 3 — Business Domains

Replaces `DomainGrouping`. New tables:
- `domains` — `id`, `project_id`, `name`, `description`, `source` enum (`ai_proposed | human_asserted`), `status` enum (`proposed | confirmed | archived`), `archived_reason`, `rationale` (AI-provided), `created_by`, timestamps.
- `domain_memberships` — `domain_id`, `component_id`, `source` (same enum), `status` (same enum), `rationale`, **`confidence numeric(3,2) NULL` (AI-set 0.00–1.00 per ADD-4.4-02; NULL when human-asserted)**. Many-to-many (one component can belong to multiple domains). Closes GAP-09(b).

**Brownfield initial domain proposal** (runs once per project at initial ingestion, after Layer 1 and Layer 2 are populated):
- Invoked via Claude Managed Agents (Opus 4.6, `reason_deeply` intent) through Inngest (never HTTP handler — ADD-4.8-03).
- Input: Layer 1 edges + Layer 2 embeddings + component metadata.
- Agent walks the graph, clusters by structural relationships + semantic similarity, proposes a set of domains with memberships and rationales.
- Writes rows as `source = ai_proposed, status = proposed` with `confidence` populated.
- Architect confirms, edits, or rejects in UI (bulk confirm supported for high-confidence proposals; V1 default is manual-review-for-all, no auto-confirm — see §7).
- Managed-package components excluded from the walk by default (per-project override — see §7 item 3).

**Re-dive additions — circuit-breaker + fallback (2026-04-14):**
- **Hard timeout:** 20 minutes per run. On timeout, persist whatever domains were proposed, mark the `pipeline_runs` entry as `partial`, notify the architect.
- **Cost ceiling:** `$15` per brownfield run (tracked in `pipeline_runs`). Overrun hard-stops and persists partial results identically to timeout.
- **Deterministic fallback:** if the Managed Agent run fails entirely (timeout, cost overrun, provider error), seed a single `Unclassified` domain and notify the architect. Ensures brownfield setup is never blocked by an agent failure.
- **Managed-package toggle UX:** the Project Settings toggle (§7 item 3) does NOT auto re-run the brownfield proposal when flipped OFF→ON. Instead, the domain review UI surfaces a "Propose domains for managed-package components" affordance that runs a scoped Managed Agent pass over just the newly-included components.

**Greenfield domain flow (closes GAP-11, ADD-4.4-06):** the architect creates and names domains manually. On each incremental sync, for every newly added component without a domain membership, a lightweight Sonnet-based suggestion (NOT Managed Agents, runs inside the sync pipeline step) proposes 0–N memberships with `rationale` and `confidence`. Writes `source=ai_proposed, status=proposed`. Architect reviews via the same domain UI.

**Biweekly domain review pass — CUT from V1 (2026-04-14 re-dive):** the Addendum §4.4-07 biweekly Managed Agents review cron is not built in V1. Rationale: it compounds cost and creates notification fatigue; brownfield one-shot plus per-sync greenfield suggestions already cover new fields. Revisit in V2 after observing actual drift in production. This is a narrow, documented supersession of Addendum §4.4-07 — not scope removal by accident.

**Rejection suppression rule (closes GAP-10, ADD-4.4-04):** when an AI-proposed `domain_membership` is rejected by the architect, set `status='archived', archived_reason='rejected_by_architect', archived_at=now()`. Brownfield re-runs and biweekly review MUST suppress any `(component_id, domain_id)` pair already archived as `rejected_by_architect` UNLESS `org_components.metadata_hash` has changed since `archived_at`. On metadata change the pair becomes eligible for re-proposal.

**Archived-membership exclusion (ADD-4.7-08):** archived memberships are preserved (audit trail) but excluded from active `search_org_kb` filters, Context Package Assembly, and any UI "active membership" listings. See cascade rules in §2.16.

**Domain review nudge:** when incremental sync adds new fields to an object whose existing fields are members of a domain, emit a notification event `DOMAIN_REVIEW_NEEDED` for the architect to classify the new fields.

**Migration of existing `DomainGrouping` records:** see §6.

Files: `src/lib/agent-harness/tasks/propose-domains.ts` (new — Managed Agent task), `src/actions/domains.ts` (CRUD + confirm/reject), `src/app/(dashboard)/projects/[projectId]/knowledge/domains/page.tsx` (review UI).

### 2.7 Layer 4 — Business Context Annotations

Replaces `BusinessContextAnnotation`. Polymorphic `annotations` table:
- `id`, `project_id`, `entity_type` enum (`component | edge | domain`), `entity_id` (string — matches the ID of whichever entity), `content`, `content_type` (`markdown` default), `source` enum (`human | ai_derived_from_discovery`), `status` enum (`proposed | confirmed | archived`), `created_by`, timestamps.

`annotation_embeddings` table — mirrors `component_embeddings` shape; embedding of `annotation.content` as `vector(512)` per DECISION-02. HNSW cosine index.

**Polymorphic consistency enforcement (closes GAP-08(b), ADD-4.5-03):** Postgres CHECK across tables is not directly supported, so consistency between `annotations.entity_type` and `annotations.entity_id` is enforced via a `BEFORE INSERT/UPDATE` trigger on `annotations`:
- `entity_type='component'` → `entity_id` must exist in `org_components`.
- `entity_type='edge'` → `entity_id` must exist in `component_edges`.
- `entity_type='domain'` → `entity_id` must exist in `domains`.
- Trigger raises an exception (constraint violation) on mismatch. Phase 6 ships the trigger; Task 2 AC verifies it.

**Answer Logging Pipeline integration (Phase 2):** when a discovery decision mentions a Salesforce component or concept, the pipeline proposes an annotation (`source = ai_derived_from_discovery`, `status = proposed`). Architect confirms or rejects. Confirmed AI-derived annotations are indistinguishable from human annotations at retrieval time.

**Rename follow-through:** annotations are keyed by component ID (not api_name), so they survive renames automatically. No migration step needed when `api_name` changes.

**Migration of existing `BusinessContextAnnotation` records:** see §6.

Files: `src/actions/annotations.ts` (polymorphic CRUD), Answer Logging Pipeline hook in Phase 2 emits proposals, `src/app/(dashboard)/projects/[projectId]/org/components/[componentId]/page.tsx` (annotation panel — now supports component | edge | domain scopes).

### 2.8 Layer 5 — Query & Retrieval Interface: `search_org_kb`

Full implementation of `search_org_kb(project_id, query, { entity_types?, component_types?, domain_ids?, expand_neighbors? })` — signature declared in Phase 11.

Retrieval flow:
1. **BM25** (tsvector) over `org_components.api_name`, `org_components.label`, `org_components.raw_metadata::text`, `annotations.content`. Return top-K with BM25 scores.
2. **Vector** (pgvector cosine) over `component_embeddings.embedding` + `annotation_embeddings.embedding`. Return top-K with similarity scores.
3. **RRF merge** (reciprocal rank fusion) across BM25 and vector result sets, **constant `k = 60` per ADD-4.6-02 (closes GAP-06)**. Production default is 60; override only via tuning job.
4. **Filter** by `entity_types` (component | annotation | domain), `component_types` (FIELD, APEX_CLASS, etc.), `domain_ids`. **Always filters by `project_id`** (ADD-4.9-01 — cross-project read impossible by construction).
5. **Active-row filter (closes GAP-07, GAP-10):** excludes archived components (`org_components.status='archived'`), archived domain memberships, archived annotations from active result set.
6. **Neighbor expansion** (`expand_neighbors`): now accepts `{ depth: int (default 1, max 5), direction: 'forward'|'reverse'|'both' }` (boolean accepted for backwards compat → `{depth:1, direction:'both'}`). Multi-hop expansion delegates to `traverse_component_graph` (see below).

**`search_org_kb` is a specialization of the shared hybrid-retrieval primitive** at `src/lib/retrieval/hybrid.ts` (Phase 1/2). Phase 6 must import and compose, not re-implement the BM25+vector+RRF math (closes GAP-06, ADD-2-05).

**Return type — `SearchResponse` (carry-forward decision #2, P11 GAP-13).** `search_org_kb` returns:
```ts
type SearchResponse = {
  hits: SearchHit[];
  query_type: 'hybrid' | 'fulltext' | 'semantic';
  total: number;
  _meta: {
    not_implemented?: { reason: string; missing_layers: string[] };  // populated when called before required layers exist
    rrf_k: 60;
    project_id: string;
  };
};
type SearchHit = { entity_type, entity_id, component?, annotation?, domain?, score, neighbors? };
```
Callers MUST branch on `_meta.not_implemented` envelope, NOT on `hits.length`. When envelope is present, `hits` may be empty or contain BM25-only degraded results.

**Edge-type allowlist contract (re-dive addition, 2026-04-14):** Phase 5 Context Package Assembly MUST pass `edge_types: ['lookup','master_detail','references']` when calling `expand_neighbors`, and SHOULD constrain `depth` to 1 or 2 for the Context-Package path. Unfiltered walks over all edge types can fan out catastrophically on large orgs. This contract is enforced in Phase 5 code; Phase 6 documents it.

**Multi-hop graph traversal — `traverse_component_graph` (closes GAP-03, ADD-4.2-03).** New SQL function implemented as a recursive CTE over `component_edges`:
```sql
traverse_component_graph(
  project_id        uuid,
  root_component_id uuid,
  direction         text DEFAULT 'both',  -- 'forward'|'reverse'|'both'
  max_depth         int  DEFAULT 3,
  edge_types        text[] DEFAULT NULL
) RETURNS TABLE (component_id uuid, depth int, path uuid[])
```
- Forward walk: follows edges where `source_component_id = current` (e.g., from object → fields/triggers/flows that reference it).
- Reverse walk: follows edges where `target_component_id = current` (e.g., from a field → every Apex/flow that reads or writes it).
- Domain walk: union of forward+reverse over domain peers (use `direction='both'` with a domain-scoped root set).
- Excludes archived components from traversal.
- **Cycle detection (re-dive addition, 2026-04-14):** the CTE tracks the visited `path uuid[]` and skips any component already in the path. Apex A→B→A cycles are legitimate; cycle detection prevents infinite recursion, not legitimate relationships. Fixture with a known A↔B↔A loop validates termination.

Phase 5 Context Package Assembly (step 5) depends on this function being production-ready.

Files: `prisma/migrations/xxx-search-org-kb.sql` (function body — from Phase 11 signature), `prisma/migrations/xxx-traverse-component-graph.sql` (new function), `src/lib/salesforce/search-org-kb.ts` (thin Prisma wrapper, returns `SearchResponse`).

### 2.9 Full Knowledge Refresh Pipeline (REQ-ORG-004) — UPDATED

Phases 3–4 refresh pipeline preserved. Updated to use Layer 3/4 structures:
- Domain creation → writes `domains` + `domain_memberships` (not `DomainGrouping`).
- AI-derived annotations from refresh synthesis → write `annotations` (not `BusinessContextAnnotation`).
- KnowledgeArticle creation, confirmation, staleness logic unchanged.

**BusinessProcess + BusinessProcessComponent persistence (closes GAP-04, PRD-13-16/20/23, orphan owner per DECISION-08):** synthesis (whether brownfield Managed Agents session or weekly refresh pipeline) MUST emit:
- `BusinessProcess` rows with defaults `isAiSuggested=true, isConfirmed=false, status=DISCOVERED, complexity ∈ {LOW, MEDIUM, HIGH, CRITICAL}` (AI-rated).
- `BusinessProcessComponent` rows linking each process to its constituent components.
- Architect confirms/edits/rejects via the existing confirmation UI (Task 30 extends to BusinessProcess).

**KnowledgeArticle defaults from AI drafting (closes GAP-04, PRD-13-21):** Phase-4 draft articles default to `authorType=AI_GENERATED, confidence ∈ {LOW, MEDIUM}`. AI never writes `confidence=HIGH`; only architect confirmation can elevate.

#### 2.9.1 Phase 3+4 Single-Context Reconciliation (closes GAP-05, PRD-13-18)

PRD-13-18 requires Phase 3 (BusinessProcess synthesis) and Phase 4 (KnowledgeArticle articulation) to share one AI call/context. The Addendum splits work across pipelines and Managed Agents. Reconciliation:
- **Brownfield initial ingestion:** Phase 3 + Phase 4 run in a single Managed Agents session (one shared context window). PRD-13-18 satisfied for the highest-stakes path.
- **Incremental weekly refresh:** Phase 3 + Phase 4 run as two sequential Inngest pipeline steps that share a context bundle assembled at step start. Per-unassigned-component scope fits comfortably in a standard pipeline stage; not a single AI call.
- **Narrow PRD-13-18 supersession recorded** in Revision History.

Triggers unchanged: `{ event: "org.knowledge-refresh-requested" }` + `{ cron: "0 2 * * 0" }`.

Files: `src/lib/inngest/functions/knowledge-refresh.ts`, `src/lib/inngest/functions/org-ingestion.ts`.

### 2.10 Ingestion Phase 4 — KnowledgeArticle Creation

Carried forward from pre-addendum spec. Runs after Layer 3 domain proposal. One article per confirmed domain with >5 components (`articleType = DOMAIN_OVERVIEW`) and one per business process (`articleType = BUSINESS_PROCESS`). References stored in `KnowledgeArticleReference` AND in the new `article_entity_refs` table (see §6.6). Embedding enqueued to `knowledge_article_embeddings` (see §6.4 + DECISION-05).

AI-drafted defaults (PRD-13-21): `authorType=AI_GENERATED, confidence ∈ {LOW, MEDIUM}` (see §2.9).

**PRD-13-14 — Planned KB placeholder (orphan owner per DECISION-08):** at project initialization, Phase 6 seeds a placeholder KnowledgeArticle with `articleType=PLANNED, authorType=PLACEHOLDER, content=<empty markdown>` so downstream UI never sees an empty KB list. Seeding is idempotent.

**`KnowledgeArticle.source` enum (Wave 3 absorption, closes Phase 4 OQ-1; enum reconciliation per phase-04-audit OQ-1):** the `KnowledgeArticle.source` enum adds `'PHASE_4_BOOTSTRAP'` as an allowed value. Phase 4 Task 14 (Initial KnowledgeArticle Bootstrap Drafts, cites DECISION-08) emits rows with `source: 'PHASE_4_BOOTSTRAP'` and empty body so Phase 6 can populate them during `articleType=BUSINESS_PROCESS` / `DOMAIN_OVERVIEW` creation. Phase 6 schema migration owns the enum addition (single source of truth); Phase 4 consumes. Cross-reference: `docs/bef/03-phases/phase-04-work-management/TASKS.md` Task 14 AC, `PHASE_SPEC.md` §Outputs.

### 2.11 KnowledgeArticle Confirmation Model (REQ-ORG-007) — PRESERVED

Unchanged. `isConfirmed` field, confirm/reject/edit/bulk actions, SA-only role gate, context-assembly filter.

### 2.12 Planned Component Creation from Story Execution (REQ-ORG-009) — PRESERVED

Unchanged from pre-addendum spec.

### 2.13 NLP Org Query API (REQ-ORG-010) — UPDATED

Endpoint and auth unchanged: `POST /api/v1/org/query`, API key, 60 req/min rate limit.

Query execution updated: the endpoint now calls `search_org_kb` (Layer 5) rather than running ad-hoc queries. Three-tier fallback preserved:

1. **Regex** pattern matching ("fields on X", "triggers on X", "flows on X", "components in Y domain", etc.) → translated to structured filters passed to `search_org_kb` (entity_types, component_types, parent filter via edges).
2. **Full-text** fallback → `search_org_kb` with BM25-only mode.
3. **Semantic** fallback → `search_org_kb` with vector-only mode.

`queryType` in the response now reflects which tier matched.

**Optional LLM narrative synthesis (closes GAP-15, ADD-4.6-06):** when the request includes `?synthesize=true` (or body `{ synthesize: true }`), a Haiku-class call receives the `SearchResponse.hits` plus the original query and returns a 100–200-word narrative answer in `response.narrative`. Cost is logged to `pipeline_runs`. Default behavior (no flag) returns raw hits only.

Files: `src/lib/salesforce/org-query.ts` (rewritten to call `search_org_kb`, branches on `_meta.not_implemented`), `src/app/api/v1/org/query/route.ts` (adds `synthesize` flag).

### 2.14 Planned Component Status Upgrade During Sync (REQ-ORG-013) — PRESERVED

Unchanged from pre-addendum spec.

### 2.15 Org Health Assessment — MOVED to Phase 6b (2026-04-14 re-dive)

Org Health Assessment was split out of Phase 6 into **[Phase 6b](../phase-06b-org-health-assessment/PHASE_SPEC.md)** during the 2026-04-14 re-dive. Rationale: zero downstream consumers, dependency on Phase 8 (Word document pipeline), and the ability to run 6b in parallel with Phase 7 shortens the critical path to Phase 5.

Phase 6a DOES provide the substrate Phase 6b depends on: `component_edges`, the `unresolved_references` materialized view, `component_history`, and `org_components` with sync reconciliation.

Phase 6a changes vs. pre-split spec:
- `org_health_reports` table NOT owned here; moved to 6b schema.
- Health-analyzer files, Managed Agent synthesis, Word output, trigger UI — all in 6b.
- Tech-debt analyzer was cut entirely during the re-dive (signal-to-cost tradeoff); remaining six analyzers land in 6b.

### 2.16 Soft-Archive Cascade (closes GAP-07, ADD-4.1-02 / 4.5-04 / 4.5-05)

When an `org_components` row transitions to `status='archived'` (via §2.2 step 5 or via project archive), the following cascade applies. Nothing is hard-deleted except on project archive (ADD-4.5-05).

| Target | Action |
|--------|--------|
| `component_embeddings` for archived component | Retained; excluded from active queries via `WHERE oc.status != 'archived'` filter inside `search_org_kb`. |
| `component_edges` where source OR target is archived | Excluded from active traversals (`search_org_kb`, `traverse_component_graph`); rows retained for audit. |
| `domain_memberships` where `component_id` is archived | `status='archived', archived_reason='component_archived', archived_at=now()`. |
| `annotations` where `entity_type='component'` AND `entity_id` is archived | `status='archived', archived_reason='entity_archived', archived_at=now()`. Cascade marks corresponding `annotation_embeddings` as excluded from active queries. |
| `knowledge_article_embeddings` referencing archived components | Retained; staleness flag set on owning KnowledgeArticle (PRD-13-28 hook). |

**Reactivation:** if a future sync re-discovers the component (`status='active'`), cascade is reversed: dependent rows where `archived_reason ∈ {component_archived, entity_archived}` revert to `status='active'`. `rejected_by_architect` archives are NOT reactivated automatically (suppression rule, §2.6).

**Project archive (Phase 9 owner per DECISION-10):** Phase 9 calls `assertProjectWritable` at every mutation entry point. On project archive, Phase 9 invokes a Phase-6-owned `cascadeArchiveProject(projectId)` helper that hard-deletes only on user-confirmed permanent deletion path; standard archive keeps everything for audit.

### 2.17 PRD-13-28 — `isStale` Propagation (orphan owner per DECISION-08)

Phase 6 owns the `isStale` flag consumer surface (Phase 2 owns the emit hook). When a confirmed component, edge, or annotation that an existing KnowledgeArticle references changes its `metadata_hash` or is archived, Phase 2 emits `entity.changed`; Phase 6 reads the event in the knowledge-refresh pipeline and sets `KnowledgeArticle.isStale=true` plus `staleReason`. Surfaced in the article confirmation UI.

---

## 3. Technical Approach

### 3.1 Implementation Strategy (by layer, then cross-cutting)

1. **Schema migrations first** (§6) — new tables, rename/restructure of `DomainGrouping` → `domains`, `BusinessContextAnnotation` → `annotations`, extraction of `OrgComponent.embedding` → `component_embeddings`. Deep-dive to resolve the `KnowledgeArticle.embedding` decision before this step.
2. **Layer 1 (Component Graph)** — graph-builder + reconciliation + rename detection + `component_history`.
3. **Layer 2 (Embeddings)** — deterministic text builder + hash + embedding pipeline on sync.
4. **Layer 3 (Domains)** — schema + brownfield Managed Agent proposal + review UI + migrate `DomainGrouping` data.
5. **Layer 4 (Annotations)** — polymorphic rewrite + semantic index + Answer Logging Pipeline integration + migrate `BusinessContextAnnotation` data.
6. **Layer 5 (`search_org_kb`)** — implement the SQL function body + Prisma wrapper.
7. **Preserved features** (PKCE, sync cron, schedule UI, confirmation model, planned components).
8. **Full knowledge refresh + Phase 4 articulation** — now writes into Layer 3/4.
9. **NLP org query** — rewire to `search_org_kb`.
10. **Org Health Assessment** — Inngest function + deterministic analyzers + Managed Agent synthesis + Word output.
11. **Cost tracking** — Managed Agent invocations (domain proposal, health assessment) write `pipeline_runs` entries with cost.

### 3.2 Module Structure (high-level)

```
src/lib/salesforce/
  oauth.ts                       -- MODIFY (PKCE)
  metadata-sync.ts               -- MODIFY (reconciliation algorithm, rename detection, managed-pkg flag)
  graph-builder.ts               -- CREATE (Layer 1 edge extraction)
  embedding-pipeline.ts          -- CREATE (Layer 2 text + hash + enqueue)
  component-history.ts           -- CREATE (audit writes)
  search-org-kb.ts               -- CREATE (Layer 5 Prisma wrapper)
  org-query.ts                   -- REWRITE (three-tier via search_org_kb)
  health-analyzers/              -- CREATE (test-coverage, governor, sharing, fls, hardcoded-ids, tech-debt)

src/lib/agent-harness/tasks/
  propose-domains.ts             -- CREATE (Managed Agent, Layer 3 brownfield)
  synthesize-health-report.ts    -- CREATE (Managed Agent, Org Health)

src/lib/inngest/functions/
  metadata-sync.ts               -- MODIFY (cron + dispatch)
  knowledge-refresh.ts           -- MODIFY (write Layer 3/4)
  org-ingestion.ts               -- MODIFY (graph + embeddings + domain proposal + articulation)
  org-health-assessment.ts       -- CREATE

src/actions/
  domains.ts                     -- CREATE/REWRITE (replaces DomainGrouping actions)
  annotations.ts                 -- REWRITE (polymorphic)
  org-health.ts                  -- CREATE
  org-connection.ts              -- MODIFY (updateSyncInterval preserved)
  knowledge.ts                   -- MODIFY (confirmation preserved)
  stories.ts                     -- MODIFY (planned components preserved)
  enrichment.ts                  -- MODIFY (planned components preserved)

prisma/
  schema.prisma                  -- MAJOR (see §6)
```

### 3.3 API Contracts

**NLP Org Query** — same shape as pre-addendum spec; internally calls `search_org_kb`.

**Health Assessment trigger:**
```
POST /api/actions/org-health/run
Body: { projectId: string, costCeilingUsd?: number }
Response: { runId: string, status: "queued" }
```

**`search_org_kb` (internal SQL function):**
```sql
search_org_kb(
  project_id uuid,
  query text,
  entity_types text[] DEFAULT NULL,
  component_types text[] DEFAULT NULL,
  domain_ids uuid[] DEFAULT NULL,
  expand_neighbors jsonb DEFAULT NULL,  -- { depth: int, direction: text } or boolean (legacy)
  limit_count int DEFAULT 20
) RETURNS TABLE (...)
```
Wrapper at `src/lib/salesforce/search-org-kb.ts` adapts the SQL row set into `SearchResponse` (typed in `src/lib/retrieval/types.ts`) and populates `_meta.not_implemented` when prerequisite layers are unavailable. Composes `src/lib/retrieval/hybrid.ts` (shared BM25+vector+RRF primitive owned by Phase 1/2; cites ADD-2-05).

**`traverse_component_graph` (recursive-CTE):** signature in §2.8.

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|------------------|
| Sync finds component with reused `salesforce_metadata_id` (post-deletion) | Match-by-ID-first treats as rename. Deep-dive to validate with fixture; may add reuse-detection exception. |
| Rename detected: component has annotations, domain memberships, edges | All preserved (keyed by component ID). `component_history` row written. |
| Embedded text hash unchanged | Skip re-embed; preserve existing embedding. |
| Embedding API failure during sync | Record embedding as `status = failed`, retry on next sync. Sync itself does not fail. |
| Brownfield domain proposal Managed Agent times out or errors | Persist partial proposals if any, flag run as failed in `pipeline_runs`, surface to architect. |
| Domain proposal Managed Agent exceeds cost ceiling mid-run | Hard-stop, persist partial results, notify architect. |
| `search_org_kb` called before Layer 2 embeddings exist | BM25-only results; `queryType = "fulltext"`. |
| AI-derived annotation proposal for component that was soft-archived | Attach to archived component but flag the pending review as stale. |
| Managed-package component hit by domain walk | Excluded by default; project setting override required to include. |
| Health assessment cost ceiling exceeded mid-run | Hard-stop, persist partial findings and remediation items collected so far, mark report status `partial`, notify architect. |
| Unresolved reference resolves on later sync (dynamic Apex now statically resolvable) | `component_edges.target_component_id` back-filled, `unresolved_reference_text` cleared. |

Existing edge cases from pre-addendum spec (PKCE, cron, planned components, etc.) remain valid.

---

## 5. Integration Points

**Depends on:**
- **Phase 11:** schemas for `component_edges`, `component_embeddings`, `annotation_embeddings`, `pipeline_runs`, `unresolved_references` view, and the `search_org_kb` function signature.
- **Phase 2:** Answer Logging Pipeline emits AI-derived annotation proposals; agent harness entity tracking enables staleness flagging.

**Unlocks:**
- **Phase 5:** Context Package Assembly step 5 (Q&A lookup) and component graph expansion call `search_org_kb`. Phase 5 cannot fully deliver without Phase 6.
- **Phase 7:** Search UI entity types (OrgComponent, domain, annotation) resolve through Layer 5.
- **Phase 8:** Org Health Assessment emits Word document through the document pipeline.

**Schema contract with Phase 11:**
- Phase 11 creates empty tables and function signatures. Phase 6 populates and implements.
- If Phase 11 schema has drifted from the addendum, reconcile before Phase 6 deep-dive.

---

## 6. Schema Migration Work

Each existing model requires a migration path. No pure drops without back-fill.

### 6.1 `DomainGrouping` → `domains`

- Rename table (Prisma `@@map("domains")`) or create new `domains` and dual-write.
- Add fields: `source` enum (`ai_proposed | human_asserted`), `status` enum (`proposed | confirmed | archived`), `archived_reason`, `rationale`.
- Existing rows: back-fill `source = human_asserted`, `status = confirmed` (they were manually created/confirmed pre-addendum).
- Create `domain_memberships` many-to-many table. Back-fill from existing one-to-many `DomainGrouping → OrgComponent.domainGroupingId` relationship.
- Drop `OrgComponent.domainGroupingId` after back-fill verified.

### 6.2 `BusinessContextAnnotation` → `annotations`

- Create new `annotations` table (polymorphic: `entity_type`, `entity_id`, `content`, `content_type`, `source`, `status`, `created_by`, timestamps).
- Back-fill from existing `BusinessContextAnnotation`:
  - `entity_type = 'component'`, `entity_id = orgComponentId`, `content = annotationText`, `content_type = 'markdown'`, `source = 'human'`, `status = 'confirmed'`.
- Create `annotation_embeddings` table; enqueue embedding generation for all back-filled annotations.
- Drop `BusinessContextAnnotation` after back-fill verified.

### 6.3 `OrgComponent.embedding` → `component_embeddings`

Existing inline `embedding vector(1536)` column on `org_components`. Extract into parallel `component_embeddings` table (schema from Phase 11: `component_id`, `embedded_text`, `embedded_text_hash`, `embedding_model`, `embedding vector(512)` per DECISION-02, timestamps).

Migration strategy (re-dive: cycle-bound dual-write, not calendar-bound):
1. Create `component_embeddings` table (Phase 11 migration).
2. Back-fill from `OrgComponent.embedding` where not null: generate `embedded_text` + hash per the Layer 2 rules, insert row.
3. Enter dual-write window: sync writes to both the inline column and `component_embeddings`.
4. **Cut over gate (re-dive, 2026-04-14):** dual-write ends when (a) one full sync cycle completes with both stores row-count- and hash-consistent AND (b) `search_org_kb` + any other readers have been deployed pointing at the new table. Typically 1–2 days; calendar windows hide bugs that cycle-bound verification catches.
5. Drop `OrgComponent.embedding` column.

### 6.4 `KnowledgeArticle.embedding` → `knowledge_article_embeddings` (Decision LOCKED)

**Decision (cites DECISION-05):** migrate the inline `KnowledgeArticle.embedding` column to a parallel `knowledge_article_embeddings` table mirroring `component_embeddings` / `annotation_embeddings`. Layer 3 two-pass retrieval (Addendum §5.4, Task 34) depends on KA embeddings being built in Phase 6 V1. Closes GAP-02.

Schema (`vector(512)` per DECISION-02):
```
knowledge_article_embeddings (
  id                 uuid PRIMARY KEY,
  article_id         uuid NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  embedded_text      text NOT NULL,
  embedded_text_hash text NOT NULL,
  embedding_model    text NOT NULL,
  embedding          vector(512) NOT NULL,
  generated_at       timestamptz NOT NULL DEFAULT now(),
  status             text NOT NULL DEFAULT 'active'  -- active | failed
)
-- HNSW cosine index on embedding
```

Migration strategy (re-dive: cycle-bound, not calendar-bound):
1. Phase 11 schema migration adds `knowledge_article_embeddings` (or Phase 6 owns the migration if Phase 11 schema is closed).
2. Back-fill: for every row in `knowledge_articles` with a non-null inline `embedding`, build `embedded_text` from `title + summary + content`, hash it, copy embedding into the new table.
3. Dual-write window: writes go to both stores until cut-over gate clears.
4. **Cut over gate (re-dive, 2026-04-14):** same rule as §6.3 — one full refresh cycle row- and hash-consistent across stores AND Task 34 readers deployed against the new table. In practice usually 1–2 days.
5. Drop the inline `KnowledgeArticle.embedding` column.

§7 item 4 is RESOLVED by this section.

### 6.5 New Tables (net additions)

| Table | Purpose |
|-------|---------|
| `component_history` | Rename / modification audit trail per component (change_type, old/new values, timestamp, source). |
| `domain_memberships` | Layer 3 many-to-many (incl. `confidence numeric(3,2)`). |
| `annotation_embeddings` | Layer 4 semantic search index (`vector(512)`). |
| `knowledge_article_embeddings` | KA semantic index (`vector(512)`); see §6.4 (DECISION-05). |
| `article_entity_refs` | Polymorphic refs from KnowledgeArticles to org entities (component / edge / domain / annotation). See §6.6. |
| ~~`org_health_reports`~~ | Moved to Phase 6b. |

### 6.6 `article_entity_refs` Table (carry-forward decision #3)

Phase 6 owns this table so Phase 2's staleness hook (Phase 2 Tasks 11/12) has a target to reference.

```
article_entity_refs (
  id           uuid PRIMARY KEY,
  article_id   uuid NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  entity_type  text NOT NULL,   -- 'component' | 'edge' | 'domain' | 'annotation'
  entity_id    uuid NOT NULL,
  ref_kind     text NOT NULL,   -- 'cited' | 'derived_from' | 'related'
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, entity_type, entity_id, ref_kind)
)
-- BEFORE INSERT/UPDATE trigger enforces polymorphic consistency, identical pattern to annotations (§2.7).
-- Index (entity_type, entity_id) for reverse lookups (Phase 2 staleness hook).
```

Phase 2 staleness hook (Phase 2 Tasks 11/12) queries `article_entity_refs` by `(entity_type, entity_id)` to find every KnowledgeArticle that references a changed entity, then sets `KnowledgeArticle.isStale=true` (PRD-13-28; §2.17).

---

## 7. Re-Dive Decisions — 2026-04-14

The 2026-04-14 re-dive confirmed, amended, or superseded the earlier audit-fix resolutions. All items below are LOCKED for V1 execution.

### Scope split
- **Phase 6 split into 6a (this spec) and 6b (Org Health Assessment).** Rationale in §2.15 and `phase-06b-org-health-assessment/PHASE_SPEC.md` §0.

### Layer 1
- **Apex parser:** SF Tooling API (`SymbolTable` / `ApexClassLocalMember` / `ApexTriggerLocalMember`), not custom regex. Regex acceptable only for Flow XML, validation rule formulas, LWC template text. See §2.4.
- **Cycle detection in `traverse_component_graph`:** recursive CTE tracks `path uuid[]` and skips already-visited component IDs. See §2.8. Fixture validates A↔B↔A loop termination.

### Layer 2 / migrations
- **Dual-write windows are cycle-bound, not calendar-bound.** Cut over when (a) one full sync/refresh cycle completes with both stores row- and hash-consistent AND (b) readers deployed against new table. See §6.3 and §6.4.

### Layer 3
- **Biweekly domain review cron CUT from V1.** Narrow supersession of Addendum §4.4-07; see §2.6. Revisit in V2.
- **Brownfield proposal circuit breaker:** hard timeout 20 min, cost ceiling $15, deterministic fallback to single "Unclassified" domain on failure. See §2.6.
- **Managed-package toggle UX:** flipping OFF→ON does not auto re-run. Architect runs a scoped proposal via UI affordance. See §2.6.
- **Confidence threshold:** manual-review-for-all in V1. Revisit after 5 brownfield projects.

### Layer 5
- **Edge-type allowlist contract for Phase 5:** Context Package Assembly must pass `edge_types: ['lookup','master_detail','references']` to `expand_neighbors` and constrain depth to 1 or 2. See §2.8.

### Reconciliation
- **Rename ID-reuse heuristic:** archived-row-match with `archived_at` > 30 days AND Levenshtein > 50% → treat as NEW component. Otherwise treat as rename. See §2.2.

### Embeddings
- **`KnowledgeArticle.embedding`:** migrate to parallel `knowledge_article_embeddings` table per §6.4 (cites DECISION-05). Unchanged from audit-fix.

### Org Health
- All Org Health decisions moved to Phase 6b. Cost ceiling $25 default + architect override preserved. Tech-debt analyzer CUT. Snapshot-at-kickoff added.

**Net new outstanding items:** none. Phase 6a ready for `/bef:execute`.

---

## 8. Acceptance Criteria

Preserved (pre-addendum):
- [ ] OAuth authorization URL includes `code_challenge` and `code_challenge_method=S256`; token exchange includes `code_verifier`.
- [ ] Automated incremental sync runs on cron for all active connected projects; skips projects not yet due.
- [ ] `sfOrgSyncIntervalHours` configurable via settings UI (SA/PM only, 0–168 range).
- [ ] New unclassified components have `needsAssignment = true`; components removed from org are soft-deleted.
- [ ] KnowledgeArticle has `isConfirmed`; architect can confirm/reject/edit/bulk-confirm.
- [ ] Context assembly filters articles by confirmation status.
- [ ] Free-text story components create PLANNED OrgComponents; PLANNED upgraded to EXISTING on sync.

Five-layer model:
- [ ] `component_edges` populated during sync from fields, Apex, triggers, flows, validation rules.
- [ ] Unresolved references recorded with `target_component_id = null` + `unresolved_reference_text`.
- [ ] Sync reconciliation algorithm (5 steps) runs per component; renames recorded in `component_history`.
- [ ] Managed-package components flagged and excluded from domain proposals by default.
- [ ] `component_embeddings` populated on sync with deterministic `embedded_text`; re-embed only on hash change.
- [ ] HNSW cosine index present on `component_embeddings.embedding`.
- [ ] `domains` + `domain_memberships` replace `DomainGrouping`; existing data migrated as `source = human_asserted, status = confirmed`.
- [ ] Brownfield domain proposal Managed Agent runs at initial ingestion and produces `source = ai_proposed, status = proposed` rows with rationales.
- [ ] Architect can confirm/reject/edit domains and memberships in UI.
- [ ] Domain review nudge emitted when new fields added to domain-member objects.
- [ ] `annotations` polymorphic table replaces `BusinessContextAnnotation`; existing data migrated.
- [ ] `annotation_embeddings` generated and indexed.
- [ ] Answer Logging Pipeline proposes AI-derived annotations; architect confirms or rejects.
- [ ] `search_org_kb` SQL function implemented with BM25 + vector + RRF merge + filters + optional neighbor expansion.
- [ ] NLP org query endpoint calls `search_org_kb`; three-tier fallback (regex → full-text → semantic) preserved.

Org Health Assessment:
- Moved to Phase 6b. See [phase-06b-org-health-assessment/PHASE_SPEC.md §8](../phase-06b-org-health-assessment/PHASE_SPEC.md).

Observability:
- [ ] Managed Agent invocations (brownfield domain proposal, scoped managed-pkg re-proposal) write `pipeline_runs` entries with cost and duration.

Re-dive ACs (2026-04-14):
- [ ] Rename reconciliation: archived-row match with `archived_at` > 30 days AND Levenshtein > 50% of longer-name length → treat as NEW component, not rename. Verified by rename-collision fixture.
- [ ] Brownfield domain proposal: hard timeout 20 min; cost ceiling $15 enforced; timeout/overrun persists partial rows and emits partial notification.
- [ ] Brownfield domain proposal: on full failure, seed single "Unclassified" domain and notify architect (deterministic fallback).
- [ ] Managed-package toggle: OFF→ON does NOT auto re-run; UI affordance triggers scoped Managed Agent run over newly-included components.
- [ ] Biweekly domain review cron NOT implemented in V1 (narrow supersession of ADD-4.4-07 documented in §2.6).
- [ ] `traverse_component_graph` recursive CTE tracks visited path and skips revisits; fixture with A↔B↔A loop terminates.
- [ ] Dual-write cut-over verified by (a) one full sync/refresh cycle consistent across stores AND (b) reader deployment, not a calendar window (§6.3, §6.4).
- [ ] Apex edge extraction uses SF Tooling API `SymbolTable`; no regex Apex parser in `graph-builder.ts`.
- [ ] Phase 5 callers of `search_org_kb` with `expand_neighbors` pass `edge_types: ['lookup','master_detail','references']` and `depth ≤ 2` (enforced in Phase 5 code; documented here).

Schema + interfaces (closes GAP-06, GAP-08, GAP-09, GAP-12, GAP-13, GAP-19):
- [ ] All embedding columns are `vector(512)` (cites DECISION-02).
- [ ] `component_edges.edge_metadata jsonb` column populated per extractor.
- [ ] `domain_memberships.confidence numeric(3,2)` populated by AI proposal paths; NULL for human-asserted.
- [ ] `annotations` polymorphic consistency enforced via BEFORE INSERT/UPDATE trigger.
- [ ] `article_entity_refs` table created with the same polymorphic trigger (carry-forward decision #3).
- [ ] `knowledge_article_embeddings` table created and back-filled (cites DECISION-05).
- [ ] `search_org_kb` returns `SearchResponse` with `_meta.not_implemented` envelope; callers branch on the envelope, not array length (carry-forward decision #2).
- [ ] `search_org_kb` RRF constant pinned at `k=60` (ADD-4.6-02).
- [ ] `search_org_kb` composes `src/lib/retrieval/hybrid.ts` shared primitive (no re-implementation).
- [ ] `traverse_component_graph` recursive-CTE function exists with forward / reverse / both traversal (ADD-4.2-03).
- [ ] BusinessProcess status enum `{DISCOVERED, DOCUMENTED, CONFIRMED, DEPRECATED}` and complexity `{LOW, MEDIUM, HIGH, CRITICAL}` enforced (PRD-5-27 — closes GAP-13).
- [ ] No write operations to SF from any Phase 6 code path (PRD-13-03 read-only — closes GAP-12).
- [ ] Credentials encrypted with per-project HKDF-SHA256; `keyVersion` honored on decrypt (PRD-22-04/11/12 — closes GAP-12).
- [ ] No Managed Agents invocation runs on a user-facing HTTP request handler — every invocation goes through Inngest (ADD-4.8-03 — closes GAP-19).
- [ ] Every `search_org_kb` / `traverse_component_graph` call and every pipeline loader filters by `project_id`; cross-project read impossible by construction; verified by query-audit test (ADD-4.9-01 — closes GAP-19).

Non-regression:
- [ ] No regressions in OAuth, sync, planned components, knowledge refresh, confirmation model, or NLP query endpoint shape.

---

## 9. Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Pre-addendum version (see git history pre-2026-04-14). |
| 2026-04-13 | Major rewrite for PRD Addendum v1 | Five-layer model, Org Health restored, schema migrations, Managed Agents, `search_org_kb`. Populated from integration plan; deep-dive still required. |
| 2026-04-14 | Audit-fix wave: closed 20 gaps from the 2026-04-13 Phase 6 audit | Cites DECISION-02 (vector(512)), DECISION-05 (KA embedding in V1), DECISION-08 (orphan owners PRD-5-27, PRD-13-14, PRD-13-16/20/21, PRD-13-28), DECISION-10 (`assertProjectWritable` consumer). Carry-forward #2 (`SearchResponse` + `_meta.not_implemented`), #3 (`article_entity_refs` table). Narrow PRD-13-18 supersession recorded (§2.9.1: brownfield = single Managed Agents session; incremental refresh = two sequential pipeline steps sharing context bundle). All §7 deep-dive items resolved; status flipped to Ready for execute. |
| 2026-04-14 | Re-dive: split Org Health into Phase 6b; cut biweekly domain review cron; cut tech-debt analyzer; cycle-bound dual-write; Apex Tooling API; brownfield circuit breaker + deterministic fallback; ID-reuse rename heuristic; cycle detection in traverse CTE; edge-type allowlist contract for Phase 5; managed-pkg toggle UX. | Re-dive identified that the audit-fix wave closed paper gaps mechanically. These changes address coherence and cost-control issues surfaced by fresh design review. See §7. |
