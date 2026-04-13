# Phase 6 Spec: Org Knowledge — Five-Layer Intelligence Model

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Gap Report: [06-org-knowledge-gaps.md](./06-org-knowledge-gaps.md)
> Addendum Source: [ADDENDUM-INTEGRATION-PLAN.md §Phase 6](../../ADDENDUM-INTEGRATION-PLAN.md), [PRD-ADDENDUM-v1-Intelligence-Layer.md §4](../../00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md)
> Depends On: Phase 11 (Infrastructure Tables), Phase 2 (Agent Harness, Answer Logging Pipeline)
> Unlocks: Phase 5 (Context Package Assembly), Phase 7 (Dashboards/Search)
> Complexity: XL
> Status: Draft (populated from integration plan — deep-dive still required)
> Last Updated: 2026-04-13

---

## 0. Change Log vs Pre-Addendum Spec

This spec was rewritten on 2026-04-13 to incorporate PRD Addendum v1. The pre-addendum version is preserved as `PHASE_SPEC.pre-addendum.md`.

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

Plus: Org Health Assessment (restored from V2), sync reconciliation algorithm with rename detection, component history audit, and the six preserved requirements above.

**Dependencies:**
- Phase 11 provides the empty schemas for `component_edges`, `component_embeddings`, and the `search_org_kb` function signature.
- Phase 2 provides the Answer Logging Pipeline that feeds AI-derived annotations.

**Unlocks:**
- Phase 5 Context Package Assembly (step 5 calls `search_org_kb`).
- Phase 7 Search (org entities resolve through Layer 5).

---

## 2. Functional Requirements

### 2.1 PKCE on OAuth Web Server Flow (REQ-ORG-001) — PRESERVED

Unchanged from pre-addendum spec. See `PHASE_SPEC.pre-addendum.md` §2.1 for full detail.

- Generate cryptographically random `code_verifier` (43–128 chars, base64url).
- `code_challenge = BASE64URL(SHA256(code_verifier))`.
- Store verifier alongside CSRF state, include in token exchange.
- Files: `src/lib/salesforce/oauth.ts`, `src/app/api/auth/salesforce/authorize/route.ts`, `src/app/api/auth/salesforce/callback/route.ts`.

### 2.2 Automated Incremental Sync with Reconciliation Algorithm (REQ-ORG-002) — PRESERVED, ENHANCED

The existing cron + needsAssignment + soft-delete behavior is preserved. Enhancement: the per-component upsert inside each sync now runs the five-step **sync reconciliation algorithm** from Addendum §4.7 and integration plan §225–230.

Sync reconciliation (per fetched component from Salesforce):

1. **Match by `salesforce_metadata_id`** (durable identity). If matched → update in place.
2. **Fallback: match by `(api_name, component_type, parent_component_id)`**. If matched → treat as same component, update `salesforce_metadata_id` if previously null.
3. **No match → create new** `org_components` row.
4. **Rename detected** (match by ID but `api_name` differs): append row to `component_history` (`change_type = rename`, old/new api_name, timestamp), update `api_name` on the component, preserve annotations, domain memberships, and edges (all keyed by component ID, not name).
5. **After sync loop completes**: any active component in the project not seen in this sync run is soft-archived (`status = archived`, `archived_at = now()`, `archived_reason = "not_seen_in_sync"`).

Rename-collision edge case (Addendum §8.F): rule is **match-by-ID first, treat-as-new-on-mismatch**. If a Salesforce metadata ID is reused after deletion (rare), the reused ID matches the archived row, which may cause false-positive rename. Deep-dive must validate with fixture and confirm behavior or add a "reuse detection" exception.

**Rename-collision edge-case fixture ownership (corrected):** the labeled edge-case fixture that validates the `salesforce_metadata_id` reuse-after-deletion behavior (current rule: match by ID first; if ID mismatch, treat as new component) is **owned by Phase 6**. The fixture itself physically lives in the Phase 11 eval infrastructure (under `/evals/org_knowledge/rename_collision/`), but its authorship, gold labels, and update responsibility belong to Phase 6. The Addendum §8.F draft assignment to Phase 3 is incorrect and superseded by this note.

Managed-package components (namespace non-empty): synced, but flagged `is_managed = true` and excluded from AI domain proposals by default. Project setting can override.

Other REQ-ORG-002 behavior unchanged:
- Inngest dual trigger: `{ event: "org.sync-requested" }` + `{ cron: "0 */4 * * *" }`.
- Skip projects whose interval has not elapsed.
- `needsAssignment = true` flagging for new unclassified components.
- `sfOrgLastSyncAt` updated on success.
- `METADATA_SYNC_COMPLETE` notification emitted.

Files: `src/lib/inngest/functions/metadata-sync.ts`, `src/lib/salesforce/metadata-sync.ts` (reconciliation + rename detection + managed-pkg flag), `src/lib/salesforce/component-history.ts` (new — write audit rows).

### 2.3 Sync Schedule Configuration UI (REQ-ORG-003) — PRESERVED

Unchanged from pre-addendum spec. See `PHASE_SPEC.pre-addendum.md` §2.3.

### 2.4 Layer 1 — Component Graph

Populate `component_edges` (schema from Phase 11) during sync. Each edge has:
- `source_component_id`, `target_component_id` (nullable for unresolved), `edge_type` (references, extends, parents, calls, triggers, child_of, lookup, master_detail, etc.), `unresolved_reference_text` (when target null).

Edge extraction sources:
- Field metadata → lookup/master-detail relationships.
- Apex class parse → references (class → class, class → object, class → field).
- Trigger metadata → `triggers` edge to parent object.
- Flow metadata → `calls` edge to any invoked Apex / subflow; `references` edge to each accessed field.
- Validation rules / formulas → `references` edges parsed from formula text.

**Unresolved references** (`target_component_id = null` + `unresolved_reference_text`): preserved for dynamic SOQL, runtime Apex callouts, metadata API references that cannot be statically resolved. These surface through the `unresolved_references` materialized view from Phase 11 and feed Org Health findings.

Managed-package components: edges involving managed components are recorded but the managed component is excluded from AI domain proposal walks by default.

Files: `src/lib/salesforce/graph-builder.ts` (new — per-component-type edge extractors), `src/lib/salesforce/metadata-sync.ts` (call graph-builder after upsert).

### 2.5 Layer 2 — Semantic Embeddings

Populate `component_embeddings` (schema from Phase 11). Each row: `component_id`, `embedded_text`, `embedded_text_hash`, `embedding_model`, `embedding vector(1536)`, `generated_at`.

**Deterministic embedded text** per component type:
- Default: `api_name + label + description + help_text`.
- Apex class: `class comments (header doc comment) + first 50 lines of body`.
- Flow: `label + description + element names (joined)`.
- Validation rule: `error message + formula comments`.
- Trigger: `api_name + trigger events + first 50 lines of body`.

**Re-embed only when `embedded_text_hash` changes** (SHA-256 of `embedded_text`). Bounds cost on large orgs.

HNSW index on `embedding` column with cosine distance (see Phase 11 migration).

Files: `src/lib/salesforce/embedding-pipeline.ts` (new — deterministic text builder + hash + enqueue), Inngest step function `component-embedding-batch` (fan-out over dirty components).

### 2.6 Layer 3 — Business Domains

Replaces `DomainGrouping`. New tables:
- `domains` — `id`, `project_id`, `name`, `description`, `source` enum (`ai_proposed | human_asserted`), `status` enum (`proposed | confirmed | archived`), `archived_reason`, `rationale` (AI-provided), `created_by`, timestamps.
- `domain_memberships` — `domain_id`, `component_id`, `source` (same enum), `status` (same enum), `rationale`. Many-to-many (one component can belong to multiple domains).

**Brownfield initial domain proposal** (runs once per project at initial ingestion, after Layer 1 and Layer 2 are populated):
- Invoked via Claude Managed Agents (Opus 4.6, `reason_deeply` intent).
- Input: Layer 1 edges + Layer 2 embeddings + component metadata.
- Agent walks the graph, clusters by structural relationships + semantic similarity, proposes a set of domains with memberships and rationales.
- Writes rows as `source = ai_proposed, status = proposed`.
- Architect confirms, edits, or rejects in UI (bulk confirm supported for high-confidence proposals).
- Managed-package components excluded from the walk by default (per-project override available).

**Domain review nudge:** when incremental sync adds new fields to an object whose existing fields are members of a domain, emit a notification event `DOMAIN_REVIEW_NEEDED` for the architect to classify the new fields.

**Migration of existing `DomainGrouping` records:** see §6.

Files: `src/lib/agent-harness/tasks/propose-domains.ts` (new — Managed Agent task), `src/actions/domains.ts` (CRUD + confirm/reject), `src/app/(dashboard)/projects/[projectId]/knowledge/domains/page.tsx` (review UI).

### 2.7 Layer 4 — Business Context Annotations

Replaces `BusinessContextAnnotation`. Polymorphic `annotations` table:
- `id`, `project_id`, `entity_type` enum (`component | edge | domain`), `entity_id` (string — matches the ID of whichever entity), `content`, `content_type` (`markdown` default), `source` enum (`human | ai_derived_from_discovery`), `status` enum (`proposed | confirmed | archived`), `created_by`, timestamps.

`annotation_embeddings` table — mirrors `component_embeddings` shape; embedding of `annotation.content`. HNSW cosine index.

**Answer Logging Pipeline integration (Phase 2):** when a discovery decision mentions a Salesforce component or concept, the pipeline proposes an annotation (`source = ai_derived_from_discovery`, `status = proposed`). Architect confirms or rejects. Confirmed AI-derived annotations are indistinguishable from human annotations at retrieval time.

**Rename follow-through:** annotations are keyed by component ID (not api_name), so they survive renames automatically. No migration step needed when `api_name` changes.

**Migration of existing `BusinessContextAnnotation` records:** see §6.

Files: `src/actions/annotations.ts` (polymorphic CRUD), Answer Logging Pipeline hook in Phase 2 emits proposals, `src/app/(dashboard)/projects/[projectId]/org/components/[componentId]/page.tsx` (annotation panel — now supports component | edge | domain scopes).

### 2.8 Layer 5 — Query & Retrieval Interface: `search_org_kb`

Full implementation of `search_org_kb(project_id, query, { entity_types?, component_types?, domain_ids?, expand_neighbors? })` — signature declared in Phase 11.

Retrieval flow:
1. **BM25** (tsvector) over `org_components.api_name`, `org_components.label`, `org_components.raw_metadata::text`, `annotations.content`. Return top-K with BM25 scores.
2. **Vector** (pgvector cosine) over `component_embeddings.embedding` + `annotation_embeddings.embedding`. Return top-K with similarity scores.
3. **RRF merge** (reciprocal rank fusion) across BM25 and vector result sets.
4. **Filter** by `entity_types` (component | annotation | domain), `component_types` (FIELD, APEX_CLASS, etc.), `domain_ids`.
5. **Neighbor expansion** (optional, `expand_neighbors = true`): for every hit that is a component, include 1-hop neighbors via `component_edges` and mark them as "related" (not scored).

Returns: `{ hits: [{ entity_type, entity_id, component?, annotation?, domain?, score, neighbors? }], query_type, total }`.

Phase 5 Context Package Assembly (step 5) depends on this function being production-ready.

Files: `prisma/migrations/xxx-search-org-kb.sql` (function body — from Phase 11 signature), `src/lib/salesforce/search-org-kb.ts` (thin Prisma wrapper invoking the SQL function).

### 2.9 Full Knowledge Refresh Pipeline (REQ-ORG-004) — UPDATED

Phases 3–4 refresh pipeline preserved. Updated to use Layer 3/4 structures:
- Domain creation → writes `domains` + `domain_memberships` (not `DomainGrouping`).
- AI-derived annotations from refresh synthesis → write `annotations` (not `BusinessContextAnnotation`).
- KnowledgeArticle creation, confirmation, staleness logic unchanged.

Triggers unchanged: `{ event: "org.knowledge-refresh-requested" }` + `{ cron: "0 2 * * 0" }`.

Files: `src/lib/inngest/functions/knowledge-refresh.ts`, `src/lib/inngest/functions/org-ingestion.ts`.

### 2.10 Ingestion Phase 4 — KnowledgeArticle Creation

Carried forward from pre-addendum spec. Runs after Layer 3 domain proposal. One article per confirmed domain with >5 components (`articleType = DOMAIN_OVERVIEW`) and one per business process (`articleType = BUSINESS_PROCESS`). References stored in `KnowledgeArticleReference`. Embedding enqueued.

Note: KnowledgeArticle's inline `embedding` column fate is deferred to deep-dive (see §7).

### 2.11 KnowledgeArticle Confirmation Model (REQ-ORG-007) — PRESERVED

Unchanged. `isConfirmed` field, confirm/reject/edit/bulk actions, SA-only role gate, context-assembly filter. See `PHASE_SPEC.pre-addendum.md` §2.7.

### 2.12 Planned Component Creation from Story Execution (REQ-ORG-009) — PRESERVED

Unchanged. See `PHASE_SPEC.pre-addendum.md` §2.9.

### 2.13 NLP Org Query API (REQ-ORG-010) — UPDATED

Endpoint and auth unchanged: `POST /api/v1/org/query`, API key, 60 req/min rate limit.

Query execution updated: the endpoint now calls `search_org_kb` (Layer 5) rather than running ad-hoc queries. Three-tier fallback preserved:

1. **Regex** pattern matching ("fields on X", "triggers on X", "flows on X", "components in Y domain", etc.) → translated to structured filters passed to `search_org_kb` (entity_types, component_types, parent filter via edges).
2. **Full-text** fallback → `search_org_kb` with BM25-only mode.
3. **Semantic** fallback → `search_org_kb` with vector-only mode.

`queryType` in the response now reflects which tier matched.

Files: `src/lib/salesforce/org-query.ts` (rewritten to call `search_org_kb`), `src/app/api/v1/org/query/route.ts` (unchanged shape).

### 2.14 Planned Component Status Upgrade During Sync (REQ-ORG-013) — PRESERVED

Unchanged. See `PHASE_SPEC.pre-addendum.md` §2.13.

### 2.15 Org Health Assessment (RESTORED from V2)

Long-running diagnostic for rescue / takeover engagements, triggered by architect at project setup.

- **Trigger:** architect clicks "Run Org Health Assessment" in project settings (SA role only).
- **Duration:** 30 minutes – 2 hours (async; status surfaced via notifications and a progress page).
- **Engine:** Claude Managed Agents, Opus 4.6 (`reason_deeply` intent). Deterministic analyses are plain SQL / static analysis; the Managed Agent synthesizes findings into a narrative and prioritized remediation backlog.
- **Deterministic analyses:**
  - Test coverage (Apex class level and aggregate).
  - Governor limit risk patterns (SOQL in loops, DML in loops, nested loops, large-data SOQL without LIMIT).
  - Sharing model review (OWD settings, role hierarchy depth, sharing rules).
  - FLS compliance (CRUD/FLS checks on SOQL and DML).
  - Hardcoded ID detection (static strings matching `/^[a-zA-Z0-9]{15,18}$/` in Apex / Flows).
  - Tech debt inventory (deprecated API versions, disabled validation rules, orphan workflows, TODO/FIXME comments in Apex).
- **Cost ceiling:** $25 default per run, tracked in `pipeline_runs` (Phase 11). Architect can override to a higher ceiling for complex rescue engagements. Overrun triggers a hard stop and surfaces partial findings.
- **Output:**
  - `org_health_reports` record (summary, per-analysis findings, remediation backlog, cost, duration).
  - Generated Word document via the Phase 8 document pipeline, stored in S3.
  - Notifications to architect on completion.

Files: `src/lib/inngest/functions/org-health-assessment.ts` (new — Inngest step function, one step per analysis), `src/lib/salesforce/health-analyzers/*.ts` (one file per deterministic analysis), `src/lib/agent-harness/tasks/synthesize-health-report.ts` (Managed Agent task), `src/actions/org-health.ts` (trigger + status actions), `src/app/(dashboard)/projects/[projectId]/settings/org/health/page.tsx` (trigger + progress UI).

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
  expand_neighbors boolean DEFAULT false,
  limit_count int DEFAULT 20
) RETURNS TABLE (...)
```

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

Existing edge cases from pre-addendum spec (PKCE, cron, planned components, etc.) remain valid — see `PHASE_SPEC.pre-addendum.md` §4.

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

Existing inline `embedding vector(1536)` column on `org_components`. Extract into parallel `component_embeddings` table (schema from Phase 11: `component_id`, `embedded_text`, `embedded_text_hash`, `embedding_model`, `embedding vector(1536)`, timestamps).

Migration strategy (deep-dive to confirm dual-write window):
1. Create `component_embeddings` table (Phase 11 migration).
2. Back-fill from `OrgComponent.embedding` where not null: generate `embedded_text` + hash per the Layer 2 rules, insert row.
3. Enter dual-write window: sync writes to both the inline column and `component_embeddings`.
4. Cut over readers (`search_org_kb`, smart retrieval) to `component_embeddings`.
5. Drop `OrgComponent.embedding` column.

### 6.4 `KnowledgeArticle.embedding` — Decision Deferred

The existing inline `embedding vector(1536)` column on `KnowledgeArticle` has three possible fates:
- **Retain inline** (cheapest, but inconsistent with Layer 2 pattern).
- **Migrate to a parallel `knowledge_article_embeddings` table** (consistent, slightly higher cost).
- **Deprecate** (if KnowledgeArticle retrieval is replaced entirely by `search_org_kb` over components + annotations).

Deep-dive must choose before schema work begins. See §7.

### 6.5 New Tables (net additions)

| Table | Purpose |
|-------|---------|
| `component_history` | Rename / modification audit trail per component (change_type, old/new values, timestamp, source). |
| `domain_memberships` | Layer 3 many-to-many. |
| `annotation_embeddings` | Layer 4 semantic search index. |
| `org_health_reports` | Org Health Assessment output records (summary, findings JSON, remediation backlog, cost, duration, status). |

---

## 7. Outstanding for Deep-Dive

Items the integration plan flags as unresolved. Must be answered before implementation kick-off.

1. **Embedding migration window** — dual-write strategy for `OrgComponent.embedding` → `component_embeddings`. How long is the dual-write window, and what triggers cut-over?
2. **Rename-collision edge case** — Addendum §8.F. Current rule is match-by-ID-first, treat-as-new-on-mismatch. Validate with edge-case fixture (reused `salesforce_metadata_id` after deletion) before locking the algorithm.
3. **Managed-package exclusion override UX** — per-project setting to include managed-pkg components in domain proposals. Where does this setting live, and what is the default UX?
4. **`KnowledgeArticle.embedding` fate** — retain inline, migrate to parallel, or deprecate. See §6.4.
5. **Domain proposal confidence threshold** — recommendation: start with manual-review-for-all (no auto-confirm). Revisit after 5 brownfield projects to see if a confidence threshold for auto-confirmation is warranted.
6. **Org Health Assessment cost ceiling** — $25 default per run, architect-override. Confirm the ceiling and override UX before implementation. Overrun behavior: hard-stop with partial findings.

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
- [ ] Architect can trigger Org Health Assessment from project settings (SA only).
- [ ] All six deterministic analyses run and produce structured findings.
- [ ] Managed Agent synthesizes findings into narrative and remediation backlog.
- [ ] Cost ceiling enforced ($25 default); overrun hard-stops with partial results.
- [ ] `org_health_reports` record persisted; Word document generated via Phase 8 pipeline.

Observability:
- [ ] Managed Agent invocations (domain proposal, health synthesis) write `pipeline_runs` entries with cost and duration.

Non-regression:
- [ ] No regressions in OAuth, sync, planned components, knowledge refresh, confirmation model, or NLP query endpoint shape.

---

## 9. Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial spec | Pre-addendum — see `PHASE_SPEC.pre-addendum.md`. |
| 2026-04-13 | Major rewrite for PRD Addendum v1 | Five-layer model, Org Health restored, schema migrations, Managed Agents, `search_org_kb`. Populated from integration plan; deep-dive still required. |
