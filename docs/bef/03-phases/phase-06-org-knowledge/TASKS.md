# Phase 6 Tasks: Org Knowledge — Five-Layer Intelligence Model

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Pre-Addendum Tasks: [TASKS.pre-addendum.md](./TASKS.pre-addendum.md)
> Last Updated: 2026-04-14
> Status: Ready for execute (deep-dive complete via 2026-04-14 audit-fix wave)

---

## Organization

Tasks are grouped by the five-layer model plus cross-cutting infrastructure, migrations, and preserved requirements. Layer order is the execution order: Layer 1 → 2 → 3 → 4 → 5, with schema migrations gating everything and preserved features parallelizable.

```
Gate 0: Schema migrations (Tasks 1–5) — must complete before layer work
  |
Layer 1: Graph (Tasks 6–8)
Layer 2: Embeddings (Tasks 9–10) — depends on Layer 1 components existing
Layer 3: Domains (Tasks 11–13) — depends on Layers 1+2 for brownfield proposal
Layer 4: Annotations (Tasks 14–16) — independent of Layer 3; depends on Phase 2 Answer Logging
Layer 5: search_org_kb (Task 17) — depends on Layers 1–4
  |
Knowledge pipeline updates (Tasks 18–20) — depend on Layer 3/4
Org Health Assessment (Tasks 21–23) — depends on Layer 1
NLP query + context + observability (Tasks 24–26)
  |
Preserved features (Tasks 27–32) — parallelizable, independent
```

---

## Gate 0: Schema Migrations

### Task 1: Migrate `DomainGrouping` → `domains` + create `domain_memberships`

| Attribute | Details |
|-----------|---------|
| **Scope** | Rename/restructure `DomainGrouping` to `domains` with `source`, `status`, `archived_reason`, `rationale` fields. Create `domain_memberships` many-to-many. Back-fill existing rows as `source=human_asserted, status=confirmed`. |
| **Depends On** | None (deep-dive must confirm strategy) |
| **Complexity** | M |

**Acceptance:**
- [ ] `domains` table with new enums and fields exists.
- [ ] `domain_memberships` table exists with `confidence numeric(3,2) NULL` column (cites ADD-4.4-02; closes GAP-09b).
- [ ] All existing `DomainGrouping` rows migrated; memberships derived from `OrgComponent.domainGroupingId`.
- [ ] `OrgComponent.domainGroupingId` dropped after verification.

---

### Task 2: Migrate `BusinessContextAnnotation` → polymorphic `annotations`

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `annotations` polymorphic table. Back-fill existing `BusinessContextAnnotation` rows as `entity_type='component', source='human', status='confirmed'`. Drop old table. |
| **Depends On** | None |
| **Complexity** | M |

**Acceptance:**
- [ ] `annotations` table created with polymorphic `entity_type + entity_id`.
- [ ] All existing `BusinessContextAnnotation` rows migrated with fidelity.
- [ ] Old `BusinessContextAnnotation` table dropped after verification.
- [ ] BEFORE INSERT/UPDATE trigger on `annotations` enforces polymorphic consistency (entity_type vs entity_id existence in target table); raises constraint violation on mismatch (cites ADD-4.5-03; closes GAP-08b).

---

### Task 3: Extract `OrgComponent.embedding` → `component_embeddings`

| Attribute | Details |
|-----------|---------|
| **Scope** | Back-fill `component_embeddings` (schema from Phase 11) from the inline `OrgComponent.embedding` column. Dual-write window. Cut over readers. Drop column. |
| **Depends On** | Phase 11 migration complete |
| **Complexity** | L |

**Acceptance:**
- [ ] All non-null `OrgComponent.embedding` values migrated with `embedded_text` + hash.
- [ ] Dual-write period verified (sync writes to both locations).
- [ ] Readers (`search_org_kb`, smart retrieval) cut over.
- [ ] `OrgComponent.embedding` column dropped.

---

### Task 4: Migrate `KnowledgeArticle.embedding` → `knowledge_article_embeddings` (cites DECISION-05)

| Attribute | Details |
|-----------|---------|
| **Scope** | Create `knowledge_article_embeddings` parallel table mirroring `component_embeddings` shape (`vector(512)` per DECISION-02). Back-fill from existing inline `KnowledgeArticle.embedding` column (build `embedded_text` from `title + summary + content`, hash). 7-day max dual-write window. Cut over Task 34 readers. Drop inline column. Closes GAP-02. |
| **Depends On** | Phase 11 schema (or Phase 6 owns the migration if Phase 11 schema is closed) |
| **Complexity** | M |

**Acceptance:**
- [ ] `knowledge_article_embeddings` table exists with `vector(512)` embedding column and HNSW cosine index.
- [ ] All non-null `KnowledgeArticle.embedding` values back-filled into the new table with hashes.
- [ ] Dual-write verified for ≤ 7 days.
- [ ] Task 34 (two-pass retrieval) reads from new table.
- [ ] `KnowledgeArticle.embedding` column dropped after cut-over.

---

### Task 5: Create new tables (`component_history`, `annotation_embeddings`, `org_health_reports`, `article_entity_refs`) + Phase 11 schema reconciliation

| Attribute | Details |
|-----------|---------|
| **Scope** | Add Prisma models + migrations for net-new tables. `domain_memberships` covered in Task 1. `knowledge_article_embeddings` covered in Task 4. **Reconcile Phase 11 schema** to add `component_edges.edge_metadata jsonb` (closes GAP-08a) and extend `component_type` enum with LWC, AURA, PERMSET, PROFILE, PERMSET_GROUP, CONNECTED_APP, NAMED_CREDENTIAL, REMOTE_SITE, INSTALLED_PACKAGE (closes GAP-01). |
| **Depends On** | None |
| **Complexity** | M |

**Acceptance:**
- [ ] `component_history` created with `component_id`, `change_type`, old/new value columns, `source`, `created_at`.
- [ ] `annotation_embeddings` created mirroring `component_embeddings` shape with `vector(512)` (cites DECISION-02).
- [ ] `org_health_reports` created with summary, findings JSON, remediation backlog, cost, duration, status fields.
- [ ] **`article_entity_refs` table created** (carry-forward decision #3) with columns `(id, article_id, entity_type, entity_id, ref_kind, created_at)`, UNIQUE constraint, polymorphic trigger, and `(entity_type, entity_id)` index. Phase 2 staleness hook (Tasks 11/12) depends on this.
- [ ] `component_edges.edge_metadata jsonb` column present in Phase 11 schema.
- [ ] `component_type` enum extended; reconciliation note in Phase 11 changelog.

---

## Layer 1: Component Graph

### Task 6: Implement sync reconciliation algorithm with rename detection

| Attribute | Details |
|-----------|---------|
| **Scope** | Rewrite `metadata-sync.ts` upsert logic to follow the 5-step reconciliation: match by `salesforce_metadata_id`, fallback `(api_name, component_type, parent_component_id)`, create new, detect rename (write `component_history`), soft-archive unseen. Flag managed-package components. |
| **Depends On** | Task 5 |
| **Complexity** | L |

**Acceptance:**
- [ ] 5-step reconciliation runs for every fetched component.
- [ ] Renames recorded in `component_history`; api_name updated; annotations/memberships/edges preserved.
- [ ] Components not seen in sync are soft-archived with reason.
- [ ] Managed-package components flagged `is_managed = true`.
- [ ] Existing fixtures pass; new rename fixture passes.
- [ ] Large-org chunked mode triggers when SF returns > 10,000 custom fields OR > 500 Apex classes; page size 500, 1-second inter-page sleep (closes GAP-18).
- [ ] On each sync, count components SF returned without durable metadata IDs; if > 0 emit single `sync.durable_id_missing` warning log + `SYNC_DATA_QUALITY` notification once per run (closes GAP-16, ADD-4.7-02).

---

### Task 7: Build Layer 1 graph-builder (component_edges extraction)

| Attribute | Details |
|-----------|---------|
| **Scope** | New `src/lib/salesforce/graph-builder.ts` with per-type extractors: field lookups, Apex references, trigger → parent, Flow invocations/field access, validation rule formula refs. Write to `component_edges`. |
| **Depends On** | Task 6 |
| **Complexity** | L |

**Acceptance:**
- [ ] `component_edges` populated during every sync.
- [ ] Lookup / master-detail relationships captured as edges with `edge_metadata.relationship_name` and `cascade_delete` (closes GAP-08a).
- [ ] Apex class/trigger references captured (`extends`, `implements`, `references`).
- [ ] Flow invocations and field access captured.
- [ ] Validation rule formula references captured.
- [ ] LWC / Aura references captured (closes GAP-01).
- [ ] Permission Set / Profile / Permission Set Group grants captured as `grants_access_to` edges with `edge_metadata.access` (read/edit/delete).
- [ ] Connected App, Named Credential, Remote Site Settings inventoried with `references` edges to scopes/endpoints/URLs in `edge_metadata`.
- [ ] Installed-package namespace linked via `installed_by` edges.
- [ ] Managed-package edges recorded (but flagged).
- [ ] Acceptance fixture: a sandbox with one of each metadata family fully populates `org_components` + `component_edges`.

---

### Task 8: Unresolved reference handling

| Attribute | Details |
|-----------|---------|
| **Scope** | Edges with no resolvable target persist with `target_component_id = null` + `unresolved_reference_text`. Attempt re-resolution on subsequent syncs. Confirm `unresolved_references` materialized view (Phase 11) refreshes correctly. |
| **Depends On** | Task 7 |
| **Complexity** | S |

**Acceptance:**
- [ ] Dynamic SOQL references persist as unresolved edges.
- [ ] Later sync that makes the target resolvable back-fills `target_component_id` and clears text.
- [ ] Materialized view surfaces the current unresolved set.

---

## Layer 2: Semantic Embeddings

### Task 9: Build deterministic embedded-text pipeline

| Attribute | Details |
|-----------|---------|
| **Scope** | `src/lib/salesforce/embedding-pipeline.ts` — per-component-type text builder (default, Apex, Flow, validation rule, trigger), SHA-256 hash, Inngest enqueue for changed hashes only. |
| **Depends On** | Task 3 |
| **Complexity** | M |

**Acceptance:**
- [ ] Embedded-text builder produces deterministic output per component type (spec §2.5).
- [ ] Default rule includes `api_name + label + description + help_text + inline_help` (closes GAP-09a, ADD-4.3-02).
- [ ] Builder covers LWC/Aura, Permission Set, Connected App per §2.5 (closes GAP-01).
- [ ] Re-embed skipped when `embedded_text_hash` unchanged.
- [ ] `embedding_model` field recorded.
- [ ] All embeddings written as `vector(512)` (cites DECISION-02).

---

### Task 10: Sync integration + HNSW index verification

| Attribute | Details |
|-----------|---------|
| **Scope** | Invoke the embedding pipeline from the sync step function (fan-out). Verify HNSW cosine index on `component_embeddings.embedding`. Add failure handling (`status=failed` + retry next sync). |
| **Depends On** | Task 9 |
| **Complexity** | M |

**Acceptance:**
- [ ] Sync triggers embedding generation for new or changed components only.
- [ ] Embedding batch size = 50 components per provider call; max 20 parallel workers (closes GAP-18).
- [ ] Provider 429 handled with exponential backoff 1s/2s/4s/8s, max 4 retries; final failures recorded `status='failed'` and retried next sync.
- [ ] Failures do not break sync; retried next cycle.
- [ ] HNSW cosine index present and used by `search_org_kb`.

---

## Layer 3: Business Domains

### Task 11: Domain CRUD + confirm/reject actions + UI

| Attribute | Details |
|-----------|---------|
| **Scope** | `src/actions/domains.ts` for CRUD on `domains` and `domain_memberships`. Review UI (`/knowledge/domains`) listing proposed/confirmed/archived domains. SA-only role gate on confirm/reject/edit/archive. Bulk confirm for high-confidence proposals. |
| **Depends On** | Task 1 |
| **Complexity** | M |

**Acceptance:**
- [ ] Architect can view, confirm, edit, reject, archive domains.
- [ ] Membership add/remove supported.
- [ ] Bulk confirm available.
- [ ] Reject sets `status='archived', archived_reason='rejected_by_architect', archived_at=now()` (closes GAP-10, ADD-4.4-04).
- [ ] Project Settings → Salesforce → "Include managed-package components in AI domain proposals" toggle exposed (default OFF) per §7 item 3 (closes GAP-20-3).

---

### Task 12: Brownfield domain proposal via Claude Managed Agents

| Attribute | Details |
|-----------|---------|
| **Scope** | New agent task `propose-domains.ts` (Opus 4.6, `reason_deeply`). Walks Layer 1 graph + Layer 2 embeddings, clusters, proposes `domains` + `domain_memberships` + rationales. Writes `source=ai_proposed, status=proposed`. Runs once per project at initial ingestion. Excludes managed-package components by default. Writes `pipeline_runs` entry with cost. |
| **Depends On** | Task 7, Task 10, Task 11 |
| **Complexity** | L |

**Acceptance:**
- [ ] Managed Agent produces domain proposals with rationales.
- [ ] Proposals written with correct source/status enums and `confidence` numeric (closes GAP-09b).
- [ ] Managed-package components excluded unless project override set.
- [ ] `pipeline_runs` entry records cost + duration.
- [ ] Architect review UI surfaces proposals.
- [ ] Re-runs honor rejection-suppression rule (skip `(component_id, domain_id)` pairs archived as `rejected_by_architect` unless `org_components.metadata_hash` changed since `archived_at`) (closes GAP-10).
- [ ] No invocation runs on user-facing HTTP path; verified via Inngest dispatch (closes GAP-19, ADD-4.8-03).
- [ ] V1 default: manual review for ALL proposals (no auto-confirm) per §7 item 5 (closes GAP-20-5).

---

### Task 13: Domain review nudge notification

| Attribute | Details |
|-----------|---------|
| **Scope** | When incremental sync adds new fields to an object whose other fields have domain memberships, emit `DOMAIN_REVIEW_NEEDED` notification to architect. |
| **Depends On** | Task 6, Task 11 |
| **Complexity** | S |

**Acceptance:**
- [ ] Notification emitted after sync when pattern detected.
- [ ] Notification links to the domain review UI.

---

## Layer 4: Annotations

### Task 14: Polymorphic annotation CRUD

| Attribute | Details |
|-----------|---------|
| **Scope** | Rewrite `src/actions/annotations.ts` for polymorphic `annotations`. Support `entity_type` in (`component`, `edge`, `domain`). Role gates (SA/BA/PM create, creator or SA delete). Reject empty/whitespace content. |
| **Depends On** | Task 2 |
| **Complexity** | M |

**Acceptance:**
- [ ] Create/delete work for all three entity types.
- [ ] Role gates enforced.
- [ ] Empty content rejected.

---

### Task 15: Annotation embedding pipeline + semantic index

| Attribute | Details |
|-----------|---------|
| **Scope** | Generate embeddings for annotation content, write to `annotation_embeddings`. Re-embed on content change. Used by `search_org_kb`. |
| **Depends On** | Task 5, Task 14 |
| **Complexity** | S |

**Acceptance:**
- [ ] New and edited annotations enqueue embedding generation.
- [ ] `annotation_embeddings` populated; HNSW cosine index present.

---

### Task 16: Answer Logging Pipeline — AI-derived annotation proposals

| Attribute | Details |
|-----------|---------|
| **Scope** | Hook into Phase 2 Answer Logging Pipeline: when a decision mentions a Salesforce component or concept, propose annotation with `source=ai_derived_from_discovery, status=proposed`. Architect confirms/rejects via review UI. |
| **Depends On** | Task 14, Phase 2 Answer Logging Pipeline |
| **Complexity** | M |

**Acceptance:**
- [ ] Pipeline emits annotation proposals tied to confirmed-existing component IDs.
- [ ] Proposals appear in architect review queue.
- [ ] Confirmed AI-derived annotations are retrieval-indistinguishable from human annotations.

---

## Layer 5: Query & Retrieval

### Task 17: Implement `search_org_kb` SQL function + Prisma wrapper (returns `SearchResponse`)

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement the `search_org_kb` function body (signature from Phase 11). BM25 over api_name/label/raw_metadata/annotations.content. Vector over `component_embeddings.embedding` + `annotation_embeddings.embedding`. **RRF merge with k=60 constant** (cites ADD-4.6-02). Filters incl. mandatory `project_id`. Active-row filter excludes archived components/memberships/annotations. Neighbor expansion now accepts `{depth, direction}`. Prisma wrapper at `src/lib/salesforce/search-org-kb.ts` returns typed `SearchResponse` with `_meta.not_implemented` envelope (carry-forward decision #2). **Composes `src/lib/retrieval/hybrid.ts` shared primitive — does not re-implement BM25+vector+RRF math** (cites ADD-2-05). |
| **Depends On** | Tasks 7, 10, 15, 17b (traverse function) |
| **Complexity** | L |

**Acceptance:**
- [ ] Function returns correctly-scored hits (BM25 + vector + RRF with k=60 pinned).
- [ ] Filters by entity_types, component_types, domain_ids work; `project_id` always applied.
- [ ] Archived rows excluded from active query results (closes GAP-07, GAP-10).
- [ ] `expand_neighbors` accepts `{depth: int, direction: 'forward'|'reverse'|'both'}` (boolean accepted for backwards compat → `{depth:1, direction:'both'}`).
- [ ] Wrapper returns `SearchResponse` typed as `{ hits, query_type, total, _meta: { not_implemented?, rrf_k:60, project_id } }`. Callers must branch on `_meta.not_implemented`, NOT `hits.length` (carry-forward decision #2).
- [ ] Wrapper composes `src/lib/retrieval/hybrid.ts`; no duplicated BM25/RRF logic in Phase 6 code (closes GAP-06).
- [ ] Graceful degradation if no embeddings: BM25-only result with `_meta.not_implemented = { reason: 'no_embeddings', missing_layers: ['layer_2'] }`.
- [ ] Phase 5 Context Package Assembly can call this end-to-end.

---

### Task 17b: Implement `traverse_component_graph` recursive-CTE function

| Attribute | Details |
|-----------|---------|
| **Scope** | New SQL function `traverse_component_graph(project_id, root_component_id, direction text, max_depth int, edge_types text[])` returning `(component_id, depth, path)` rows. Implemented as recursive CTE over `component_edges`. Forward/reverse/both directions. Excludes archived components. Cites ADD-4.2-03. Closes GAP-03. |
| **Depends On** | Task 7 |
| **Complexity** | M |

**Acceptance:**
- [ ] Function exists with the documented signature; default `max_depth=3`, hard cap 5.
- [ ] Forward walk from an object returns all fields/triggers/flows referencing it up to depth N.
- [ ] Reverse walk from a field returns every Apex class/flow that reads or writes it.
- [ ] `direction='both'` supports domain-walk pattern.
- [ ] Archived components excluded.
- [ ] Phase 11 function-signature contract amended to include `traverse_component_graph` (or Phase 6 owns the function explicitly).

---

## Knowledge Pipeline Updates

### Task 18: Phase 4 Articulate in ingestion (KnowledgeArticle creation)

| Attribute | Details |
|-----------|---------|
| **Scope** | Preserved from pre-addendum spec. After Layer 3 domain confirmation, create KnowledgeArticle per business process and per confirmed domain (>5 components). Write into Layer 3/4 structures. |
| **Depends On** | Task 12 |
| **Complexity** | L |

**Acceptance:**
- [ ] Articles created: one per BusinessProcess, one per confirmed domain with >5 components.
- [ ] References stored in `KnowledgeArticleReference` AND `article_entity_refs` (carry-forward decision #3).
- [ ] AI-drafted articles default to `authorType=AI_GENERATED, confidence ∈ {LOW, MEDIUM}` (closes GAP-04, PRD-13-21). AI never writes HIGH.
- [ ] Embedding enqueued to `knowledge_article_embeddings` (Task 4; cites DECISION-05).
- [ ] Initial brownfield ingestion budget: 30–90 minutes for a large org; progress surfaced as percent-complete every 60 seconds in ingestion UI (closes GAP-18, ADD-4.7-14).
- [ ] PRD-13-14 placeholder KnowledgeArticle seeded at project initialization (idempotent) (orphan owner per DECISION-08).
- [ ] `KnowledgeArticle.source` enum includes `'PHASE_4_BOOTSTRAP'` (Wave 3 absorption; closes Phase 4 OQ-1 / phase-04-audit OQ-1 per DECISION-08). Phase 4 Task 14 emits rows with this source; Phase 6 owns the schema migration. Enum reconciliation only; no other changes.

---

### Task 19: Full knowledge refresh pipeline (Layer 3/4 aware)

| Attribute | Details |
|-----------|---------|
| **Scope** | `knowledgeRefreshFunction` dual trigger (event + weekly cron). Writes domain memberships and annotations into Layer 3/4 tables. Preserves confirmation/staleness logic. UI refresh button. |
| **Depends On** | Task 18 |
| **Complexity** | L |

**Acceptance:**
- [ ] Function registered with `{ event: "org.knowledge-refresh-requested" }` + `{ cron: "0 2 * * 0" }`.
- [ ] No-op when zero targets.
- [ ] Writes Layer 3/4 rows with correct source/status.
- [ ] Refresh button visible to SA/PM.
- [ ] Every content rewrite bumps `KnowledgeArticle.version` and writes a `KnowledgeArticleVersion` snapshot row `(id, article_id, version, content, embedded_at)` (closes GAP-14, PRD-13-24).

---

### Task 20: BusinessProcessDependency persistence

| Attribute | Details |
|-----------|---------|
| **Scope** | Preserved from pre-addendum spec. Persist `dependsOn` from AI synthesis as `BusinessProcessDependency` records (idempotent, name-matched). |
| **Depends On** | None |
| **Complexity** | S |

**Acceptance:**
- [ ] Dependencies persisted with source/target/type.
- [ ] Re-run is idempotent.
- [ ] Unresolved targets logged, non-fatal.

---

## Org Health Assessment

### Task 21: Deterministic health analyzers

| Attribute | Details |
|-----------|---------|
| **Scope** | Six analyzers in `src/lib/salesforce/health-analyzers/`: test-coverage, governor-limit-risk, sharing-model, fls-compliance, hardcoded-ids, tech-debt. Each reads org data and produces structured findings JSON. |
| **Depends On** | Task 6 (sync must be reliable) |
| **Complexity** | XL |

**Acceptance:**
- [ ] **Seven** analyzers (test-coverage, governor, sharing, fls, hardcoded-ids, tech-debt, **unresolved-references**) — closes GAP-17, ADD-4.7-10.
- [ ] Unresolved-references analyzer reads the `unresolved_references` materialized view; produces structured findings (severity = info|warn based on count).
- [ ] Each analyzer runs independently and returns structured findings.
- [ ] Analyzers are pure functions over fetched org data (no AI calls).
- [ ] Unit-tested with sample fixtures.

---

### Task 22: Managed Agent synthesis + Word output

| Attribute | Details |
|-----------|---------|
| **Scope** | `synthesize-health-report.ts` Managed Agent task (Opus 4.6, `reason_deeply`) takes analyzer outputs and produces narrative + prioritized remediation backlog. Generate Word document via Phase 8 document pipeline. Store to S3. Write `org_health_reports` record. |
| **Depends On** | Task 21 |
| **Complexity** | L |

**Acceptance:**
- [ ] Synthesis produces narrative and remediation backlog.
- [ ] Word document generated and stored.
- [ ] `org_health_reports` row persisted with summary, findings, backlog, cost, duration.

---

### Task 23: Trigger, cost ceiling, and status UI

| Attribute | Details |
|-----------|---------|
| **Scope** | Architect trigger action (SA only). Cost ceiling ($25 default, architect-override). Hard-stop on overrun, persist partial results. Progress UI page. Completion notification. `pipeline_runs` entry. |
| **Depends On** | Task 22 |
| **Complexity** | M |

**Acceptance:**
- [ ] Architect can trigger run + override ceiling via input field in trigger dialog (default $25 pre-filled) — closes GAP-20-6.
- [ ] Overrun hard-stops with partial report (`status=partial`).
- [ ] Progress UI shows step-by-step status with polling (1s interval, 60s timeout backoff).
- [ ] Notification emitted on completion.
- [ ] Cost tracked in `pipeline_runs`.

---

## NLP Query + Context + Observability

### Task 24: Rewrite NLP org query to call `search_org_kb`

| Attribute | Details |
|-----------|---------|
| **Scope** | Rewrite `src/lib/salesforce/org-query.ts` three-tier fallback (regex → full-text → semantic) to invoke `search_org_kb` with appropriate filter/mode args. Response shape unchanged. |
| **Depends On** | Task 17 |
| **Complexity** | M |

**Acceptance:**
- [ ] All regex patterns supported (fields on X, triggers on X, flows on X, components in Y domain).
- [ ] Full-text fallback routes through `search_org_kb` BM25-only.
- [ ] Semantic fallback routes through `search_org_kb` vector-only.
- [ ] Response includes correct `queryType` indicator.
- [ ] Auth, rate limit unchanged.
- [ ] Caller branches on `SearchResponse._meta.not_implemented` envelope, NOT on `hits.length` (carry-forward decision #2).
- [ ] `?synthesize=true` (or body `{synthesize:true}`) invokes Haiku-class LLM with hits + query and returns 100–200-word `response.narrative`; cost logged to `pipeline_runs` (closes GAP-15, ADD-4.6-06).

---

### Task 25: Context package loader — include annotations (polymorphic) + 1-hop edges

| Attribute | Details |
|-----------|---------|
| **Scope** | Update `loadOrgComponentContext` to include polymorphic annotations (entity_type=component) and 1-hop edges via `component_edges`. Format for context string builder. |
| **Depends On** | Task 14, Task 7 |
| **Complexity** | M |

**Acceptance:**
- [ ] Annotations appear in context strings per spec format.
- [ ] 1-hop neighbors surfaced in context when relevant.
- [ ] Phase 5 Context Package Assembly receives the richer context.

---

### Task 26: Cost tracking for Managed Agent invocations

| Attribute | Details |
|-----------|---------|
| **Scope** | Ensure domain proposal (Task 12) and health synthesis (Task 22) write `pipeline_runs` + `pipeline_stage_runs` entries with token usage, dollar cost, and duration. |
| **Depends On** | Tasks 12, 22 |
| **Complexity** | S |

**Acceptance:**
- [ ] Every Managed Agent run produces observability rows.
- [ ] Cost tallies visible in Phase 7 Usage & Costs tab.

---

## Preserved Features (pre-addendum, parallelizable)

### Task 27: PKCE on OAuth Web Server Flow (REQ-ORG-001)

Unchanged from pre-addendum. See `TASKS.pre-addendum.md` Task 1 for implementation notes. Complexity S.

### Task 28: Automated incremental sync cron (REQ-ORG-002, base behavior)

Base cron + `needsAssignment` + soft-delete behavior. Reconciliation enhancement is Task 6. See `TASKS.pre-addendum.md` Task 2. Complexity M.

### Task 29: Sync schedule configuration UI (REQ-ORG-003)

Unchanged. See `TASKS.pre-addendum.md` Task 3. Complexity S.

### Task 30: KnowledgeArticle confirmation model + UI (REQ-ORG-007)

Unchanged. Depends on Task 18 (articles must exist). See `TASKS.pre-addendum.md` Task 7. Complexity M.

### Task 31: Planned component creation from story execution (REQ-ORG-009)

Unchanged. See `TASKS.pre-addendum.md` Task 9. Complexity M.

### Task 32: PLANNED → EXISTING upgrade during sync (REQ-ORG-013)

Unchanged; integrates with Task 6 reconciliation (a PLANNED row is simply a specific `status` value that the reconciliation can flip to EXISTING when matched). See `TASKS.pre-addendum.md` Task 10. Complexity S.

---

## Agent Harness Cross-Cutting (carried forward)

### Task 33: Agent staleness flagging at end of loop (REQ-ORG-011)

Unchanged. Depends on Phase 2 Task 4 (entity tracking). See `TASKS.pre-addendum.md` Task 12. Complexity M.

### Task 34: Two-pass semantic retrieval for article selection (REQ-ORG-012)

Unchanged. Depends on Task 18 + Task 4 decision (KnowledgeArticle embedding fate). See `TASKS.pre-addendum.md` Task 13. Complexity M.

---

## Audit-Fix Tasks (added 2026-04-14)

### Task 6b: Soft-archive cascade implementation (closes GAP-07, ADD-4.1-02 / 4.5-04 / 4.5-05)

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement cascade rules from §2.16: when an `org_components` row transitions to `status='archived'`, mark dependent rows in `domain_memberships`, `annotations`, `annotation_embeddings` as archived with `archived_reason`. `component_embeddings` retained. `component_edges` retained but excluded by `search_org_kb` and `traverse_component_graph`. Reactivation reverses cascade for `archived_reason ∈ {component_archived, entity_archived}` (NOT `rejected_by_architect`). Phase 9 calls a Phase-6-owned `cascadeArchiveProject(projectId)` helper for project-level archive. |
| **Depends On** | Task 5, Task 6 |
| **Complexity** | M |

**Acceptance:**
- [ ] Archiving a component in fixture leaves all related rows in place, marked archived, and excluded from `search_org_kb` results.
- [ ] Reactivating the component restores rows to `active` (except `rejected_by_architect`).
- [ ] `cascadeArchiveProject(projectId)` exported helper exists; consumed by Phase 9.
- [ ] No hard-deletes outside of project permanent-delete path.

---

### Task 11b: Domain re-proposal suppression rule (closes GAP-10, ADD-4.4-04 / 4.7-08)

| Attribute | Details |
|-----------|---------|
| **Scope** | Implement the rejection-suppression rule in the brownfield Managed Agents flow (Task 12) and the biweekly review pass (Task 12c): skip any `(component_id, domain_id)` pair already archived as `rejected_by_architect` UNLESS `org_components.metadata_hash` has changed since `archived_at`. On metadata change the pair becomes eligible for re-proposal. |
| **Depends On** | Task 11, Task 12 |
| **Complexity** | S |

**Acceptance:**
- [ ] Fixture: reject proposal → re-run proposal → no new row.
- [ ] Mutate `metadata_hash` → re-run → proposal reappears.
- [ ] Archived memberships excluded from `search_org_kb` and Context Package Assembly active queries.

---

### Task 12b: Greenfield AI membership suggestions (closes GAP-11, ADD-4.4-06)

| Attribute | Details |
|-----------|---------|
| **Scope** | Sonnet-class LLM step inside the incremental sync pipeline (NOT Managed Agents) that, for every newly added component without a domain membership, proposes 0–N memberships with `rationale` and `confidence`. Writes `source=ai_proposed, status=proposed`. Batched per sync. Respects the rejection-suppression rule (Task 11b). |
| **Depends On** | Task 6, Task 11, Task 11b |
| **Complexity** | S |

**Acceptance:**
- [ ] Triggered automatically in incremental sync when greenfield mode (project flag) is set.
- [ ] Model: Sonnet via the Phase 2 model router; cost logged.
- [ ] Confidence threshold honored.
- [ ] Architect reviews via existing UI (Task 11).

---

### Task 12c: Biweekly domain review pass (closes GAP-11, ADD-4.4-07)

| Attribute | Details |
|-----------|---------|
| **Scope** | Inngest cron `{ cron: "0 3 */14 * *" }` runs a Managed Agents session scoped to components whose `metadata_hash` changed in the last 14 days OR were added in the last 14 days. Emits proposal diffs for architect review. Respects suppression rule (Task 11b). |
| **Depends On** | Task 12, Task 11b |
| **Complexity** | M |

**Acceptance:**
- [ ] Cron registered.
- [ ] Scope filter limits Managed Agents input to recently-changed/added components.
- [ ] Proposal diffs surfaced in domain review UI.
- [ ] Cost logged in `pipeline_runs`.

---

### Task 18b: BusinessProcess + BusinessProcessComponent persistence (closes GAP-04, PRD-13-16/20/21/23)

| Attribute | Details |
|-----------|---------|
| **Scope** | Persist `BusinessProcess` rows produced by Phase-3 synthesis with PRD-mandated defaults (`isAiSuggested=true, isConfirmed=false, status=DISCOVERED, complexity ∈ {LOW,MEDIUM,HIGH,CRITICAL}`). Persist `BusinessProcessComponent` join rows. Extend Task 30 confirmation UI to BusinessProcess. Cites DECISION-08 orphan owners. |
| **Depends On** | Task 12 |
| **Complexity** | M |

**Acceptance:**
- [ ] Rows created with specified defaults.
- [ ] BusinessProcessComponent rows link process → components.
- [ ] BusinessProcess status enum `{DISCOVERED, DOCUMENTED, CONFIRMED, DEPRECATED}` and complexity `{LOW, MEDIUM, HIGH, CRITICAL}` enforced (closes GAP-13, PRD-5-27).
- [ ] Architect can confirm/edit/reject in confirmation UI.

---

## Summary

| # | Title | Depends On | Complexity |
|---|-------|------------|------------|
| 1 | Migrate DomainGrouping → domains + domain_memberships | deep-dive | M |
| 2 | Migrate BusinessContextAnnotation → polymorphic annotations | — | M |
| 3 | Extract OrgComponent.embedding → component_embeddings | Phase 11 | L |
| 4 | Resolve KnowledgeArticle.embedding fate | deep-dive | S–M |
| 5 | Create component_history, annotation_embeddings, org_health_reports | — | S |
| 6 | Sync reconciliation + rename detection | 5 | L |
| 7 | Layer 1 graph-builder | 6 | L |
| 8 | Unresolved reference handling | 7 | S |
| 9 | Deterministic embedded-text pipeline | 3 | M |
| 10 | Sync integration + HNSW verification | 9 | M |
| 11 | Domain CRUD + review UI | 1 | M |
| 12 | Brownfield domain proposal (Managed Agent) | 7, 10, 11 | L |
| 13 | Domain review nudge notification | 6, 11 | S |
| 14 | Polymorphic annotation CRUD | 2 | M |
| 15 | Annotation embedding pipeline | 5, 14 | S |
| 16 | Answer Logging → AI-derived annotation proposals | 14, Phase 2 | M |
| 17 | `search_org_kb` SQL + wrapper | 7, 10, 15 | L |
| 18 | Phase 4 Articulate in ingestion | 12 | L |
| 19 | Full knowledge refresh (Layer 3/4 aware) | 18 | L |
| 20 | BusinessProcessDependency persistence | — | S |
| 21 | Deterministic health analyzers (6) | 6 | XL |
| 22 | Managed Agent synthesis + Word output | 21 | L |
| 23 | Health trigger + cost ceiling + status UI | 22 | M |
| 24 | NLP query → `search_org_kb` | 17 | M |
| 25 | Context loader: annotations + 1-hop edges | 14, 7 | M |
| 26 | Cost tracking for Managed Agent runs | 12, 22 | S |
| 27 | PKCE OAuth (preserved) | — | S |
| 28 | Sync cron base behavior (preserved) | — | M |
| 29 | Sync schedule UI (preserved) | 28 | S |
| 30 | KnowledgeArticle confirmation model (preserved) | 18 | M |
| 31 | Planned component creation (preserved) | — | M |
| 32 | PLANNED → EXISTING upgrade (preserved) | 31, 6 | S |
| 33 | Agent staleness flagging (preserved) | Phase 2 T4 | M |
| 34 | Two-pass semantic retrieval (preserved) | 18, 4 | M |
| 35 | Domain review nudge: new-fields-on-domain-object detection (integration plan §244) | 6, 11, 13 | S |
| 36 | Rename-collision edge-case fixture authorship (Addendum §8.F, integration plan §425) | 6 | S |
| 6b | Soft-archive cascade implementation | 5, 6 | M |
| 11b | Domain re-proposal suppression rule | 11, 12 | S |
| 12b | Greenfield AI membership suggestions (Sonnet) | 6, 11, 11b | S |
| 12c | Biweekly domain review pass (Inngest cron + Managed Agents) | 12, 11b | M |
| 17b | `traverse_component_graph` recursive-CTE function | 7 | M |
| 18b | BusinessProcess + BusinessProcessComponent persistence | 12 | M |

---

### Task 35: Domain review nudge — new-fields-on-domain-object detection (integration plan §244)

| Attribute | Details |
|-----------|---------|
| **Scope** | Extend the sync reconciliation path so that when incremental sync adds new fields to an object whose existing fields are already members of one or more domains, the architect is notified to reassess domain membership for the new fields. Uses the `DOMAIN_REVIEW_NEEDED` notification introduced in Task 13 but adds the new-field-specific detection logic. |
| **Depends On** | Task 6 (reconciliation), Task 11 (domains), Task 13 (notification plumbing) |
| **Complexity** | S |

**Acceptance:**
- [ ] After sync, for every newly added field whose parent object has at least one existing field in a confirmed domain, a `DOMAIN_REVIEW_NEEDED` notification is emitted listing the new field(s) and the affected domain(s).
- [ ] Notification deep-links to the domain review UI scoped to the affected object.
- [ ] No notification emitted when no affected object has existing domain members.
- [ ] Unit test with fixture covering: (a) new field on object with existing domain members, (b) new field on object with no domain members, (c) multiple new fields on same object.

---

### Task 36: Rename-collision edge-case fixture (Addendum §8.F, integration plan §425)

| Attribute | Details |
|-----------|---------|
| **Scope** | Author a labeled edge-case fixture validating the "salesforce_metadata_id reuse after deletion" behavior. Current rule: match by ID first; if ID mismatch, treat as new component. Fixture physically lives in Phase 11 eval infrastructure (`/evals/org_knowledge/rename_collision/`) but ownership (authorship, gold labels, updates) belongs to Phase 6. Corrects the Addendum §8.F draft assignment to Phase 3. |
| **Depends On** | Phase 11 eval harness |
| **Complexity** | S |

**Acceptance:**
- [ ] Fixture committed under `/evals/org_knowledge/rename_collision/` with README documenting the scenario.
- [ ] Fixture exercises: (a) legitimate rename (same ID, different api_name) → rename path, (b) ID reuse after deletion (archived row has same ID, new component) → match-by-ID-first behavior documented, (c) ID mismatch (same api_name, different ID) → treated as new component.
- [ ] Gold labels captured for each scenario per the current reconciliation rule.
- [ ] Fixture registered as an eval suite under the Phase 11 harness, tagged `org-knowledge/rename-collision`.
- [ ] Ownership note recorded in PHASE_SPEC §2.2 so maintenance responsibility is unambiguous.
