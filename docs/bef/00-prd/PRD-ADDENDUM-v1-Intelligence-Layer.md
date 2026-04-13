# PRD Addendum v1 — Intelligence Layer Architecture

**Parent document:** SF-Consulting-AI-Framework-PRD-v2.md
**Addendum version:** 1.0
**Date:** April 12, 2026
**Status:** Locked decisions; supersedes or amends specified PRD sections

---

## 0. Purpose

This addendum locks in architectural decisions for two areas the original PRD treated at too high a level of abstraction:

1. The **Org Metadata Intelligence Layer** (supersedes PRD §13 in substance; §13's external behavior is preserved)
2. The **Project Management AI Layer** (supersedes PRD §6 in substance; §6's external behavior is preserved)

It also locks three cross-cutting decisions that were missing from the original PRD: **pgvector**, a **formal evaluation harness**, and an explicit **model routing policy**.

**What is unchanged:** the tech stack (Next.js, Postgres, Prisma, Clerk, S3/R2, Vercel), the project lifecycle, roles, RBAC matrix, story/sprint semantics, document generation, Jira sync, archival, security posture, and all business-level requirements. This addendum is an architectural refinement, not a scope change.

---

## 1. Cross-Reference: Original PRD Sections Affected

| PRD Section | Effect of This Addendum |
|---|---|
| §5.2 Data Model Overview | **Amended.** New entities added in §7 of this addendum. |
| §5.3 API Design | **Unchanged in contract.** Implementation of Context Package API changes (see §4.6). |
| §6 AI Agent Harness | **Superseded in substance.** The harness is now decomposed into pipelines + one narrow freeform agent + a hybrid retrieval primitive. The task types in §6.2 map onto the pipelines in §5 of this addendum. |
| §8 Discovery Workflow | **Unchanged externally.** Implementation now runs through the Transcript Processing and Answer Logging pipelines. |
| §10.4 Story Generation Workflow | **Unchanged externally.** Implementation now runs through the Story Generation pipeline. |
| §13 Salesforce Org Connectivity and Knowledge Base | **Superseded in substance.** The "Org Knowledge Base Structure" in §13.4 is replaced by the five-layer model in §4 of this addendum. Sync semantics in §13.3 and brownfield ingestion in §13.6 are preserved but clarified. |
| §17 Dashboards | **Unchanged.** Implementation now queries metrics deterministically; narrative synthesis uses the Briefing/Status pipeline. |
| §22.3 AI Provider Data Handling | **Amended.** An embeddings provider exception is added (§3.1). |
| §25 Technology Stack | **Amended.** pgvector added. |
| §26 Build Sequence | **Amended.** Retrieval infrastructure and eval harness move into Phase 1. See §6 of this addendum. |
| §27 Open Questions | **Amended.** Items 1 and 2 in §27 are now resolved by this addendum; new open items added in §8 of this addendum. |

---

## 2. Newly Locked Decisions (Summary)

The following are now architecturally locked for V1:

1. The org knowledge base is a **five-layer model**: component graph, semantic embeddings, business domains, business context annotations, query/retrieval interface.
2. **Postgres with pgvector** is the storage substrate for all of the above. No graph database, no separate vector store.
3. **Salesforce durable metadata IDs** (not API names) are the primary identity key for components. API names are an indexed attribute.
4. The project management AI layer is a **pipeline-first architecture**: four deterministic pipelines (Transcript Processing, Answer Logging, Story Generation, Briefing/Status) + **one narrow freeform agent** ("project brain chat").
5. A **hybrid retrieval primitive** (BM25 full-text + vector similarity with reciprocal rank fusion) is shared across all pipelines, the freeform agent, and the org knowledge base query layer.
6. **Model routing** is centralized and explicit: Haiku 4.5 for extraction/classification/routing, Sonnet 4.6 for synthesis/reconciliation/generation, Opus 4.6 for long-horizon reasoning (Org Health Assessment, user-triggered deep analysis). No stage hardcodes a model name directly.
7. An **evaluation harness** is a V1 deliverable, not a future enhancement. Every pipeline has fixtures and a CI gate.
8. **Claude Managed Agents** is used only for the Org Health Assessment and initial brownfield domain proposal workloads. It is not used for any request-scoped or pipeline-driven work.

---

## 3. Tech Stack Amendments (amends PRD §25)

### 3.1 Additions

| Component | Technology | Notes |
|---|---|---|
| Vector extension | **pgvector** | Enabled on the Postgres instance (Neon and Supabase both support it). HNSW indexes for ANN search. |
| Embedding provider | **Voyage AI (voyage-3-lite)** or **OpenAI (text-embedding-3-small)** | Anthropic does not offer an embeddings API. This is an explicit, scoped exception to the "optimized for Claude" principle in PRD §3.3. Data handling agreement with the chosen provider required. Decision to be made at Phase 1 start based on pricing and quality for the firm's domain vocabulary. |
| Eval harness | **Custom, lightweight** | JSON fixtures per pipeline, runner invoked via `pnpm eval [pipeline]`, CI gate on main branch. No external eval framework required. |
| Background job runner | **Inngest** or **Trigger.dev** | For sync jobs, embedding jobs, long-running pipeline stages. Vercel cron is insufficient for durable workflows with retries. Decision at Phase 3 start. |

### 3.2 Amendment to Data Handling Posture

PRD §22.3 states that client data is not retained or used for training. That remains true for Claude API. For the embeddings provider, the addendum requires the same contractual posture before production use: no retention, no training. This is a gating item for Phase 1 vendor selection.

---

## 4. Org Metadata Intelligence Layer (supersedes PRD §13.4; amends §13.3 and §13.6)

### 4.1 Architecture Overview

The org knowledge base is a five-layer model. Each layer has a specific purpose; mixing responsibilities across layers is a design violation.

```
Layer 5: Query & Retrieval Interface   (how anything gets asked)
Layer 4: Business Context Annotations  (what humans know about components)
Layer 3: Business Domains              (grouping by business purpose)
Layer 2: Semantic Embeddings           (fuzzy search substrate)
Layer 1: Component Graph               (what exists + how it relates)
```

Data flows upward: higher layers reference lower layers by ID. A deletion in Layer 1 cascades as a soft-archive in Layers 2-4, never a hard delete.

### 4.2 Layer 1: Component Graph

**Purpose.** The authoritative structural model of the org: what components exist, their attributes, and how they reference each other.

**Entities.**

- `org_components`
  - `id` (UUID, primary key, internal)
  - `project_id` (FK)
  - `salesforce_metadata_id` (string, durable identity from Salesforce; primary match key on sync)
  - `api_name` (string, indexed; may change across renames)
  - `label` (string)
  - `component_type` (enum: `custom_object`, `standard_object`, `custom_field`, `standard_field`, `apex_class`, `apex_trigger`, `flow`, `lwc`, `aura_component`, `validation_rule`, `permission_set`, `permission_set_group`, `profile`, `connected_app`, `named_credential`, `custom_metadata_type`, `platform_event`, `page_layout`, `record_type`, `email_template`, `static_resource`, `report`, `dashboard`, `list_view`, `custom_tab`, ...)
  - `parent_component_id` (FK, nullable; fields point to their parent object)
  - `namespace` (string, nullable; populated for managed package components)
  - `api_version` (string, nullable)
  - `status` (enum: `active`, `archived`)
  - `raw_metadata` (jsonb; the full parsed Salesforce metadata payload for this component)
  - `first_seen_at`, `last_seen_at`, `last_modified_at` (timestamps)
  - `metadata_hash` (string; hash of `raw_metadata` for change detection)

- `component_edges`
  - `id` (UUID)
  - `project_id` (FK)
  - `source_component_id` (FK)
  - `target_component_id` (FK; nullable if `unresolved_reference_text` is set)
  - `edge_type` (enum: `lookup`, `master_detail`, `hierarchical`, `trigger_on_object`, `flow_on_object`, `flow_invokes_apex`, `class_references_class`, `class_references_object`, `class_references_field`, `layout_includes_field`, `validation_rule_on_object`, `permission_grants_access_to`, `record_type_of`, `report_on_object`, `dashboard_uses_report`, ...)
  - `edge_metadata` (jsonb; e.g., relationship name, child relationship name)
  - `unresolved_reference_text` (string, nullable; used when a reference is detected but cannot be resolved to a known component, e.g., dynamic SOQL)
  - `first_seen_at`, `last_seen_at`

**Why Postgres, not a graph database.** For the expected scale (50k nodes, 200k edges per project at the top end), Postgres with recursive CTEs and well-placed indexes performs well. Introducing Neo4j or similar adds operational surface area (second database, second backup strategy, second failure mode) for marginal benefit. Revisit only if a project crosses 500k edges or traversal queries exceed p95 latency budgets.

**Traversal patterns.**
- **Forward neighborhood** (used in context package assembly): given a component, walk 1-2 hops across `component_edges` where it is the source.
- **Reverse neighborhood** (used in impact analysis): given a component, walk 1-2 hops across `component_edges` where it is the target.
- **Domain traversal** (used in discovery): given a domain, materialize all component members and their edges for visualization.

### 4.3 Layer 2: Semantic Embeddings

**Purpose.** Fuzzy retrieval over components. Keyword search is insufficient; someone searching "renewal approval" needs to find `Opp_Approved_by_Finance__c` even though no keyword overlaps.

**Entities.**

- `component_embeddings`
  - `component_id` (FK to `org_components`, unique)
  - `embedded_text` (text; the concatenated string that was embedded, retained for debugging and re-embedding decisions)
  - `embedded_text_hash` (string; used to detect when re-embedding is required)
  - `embedding` (vector(1536) or provider-specific dimension)
  - `embedding_model` (string; tracks which model produced this embedding, for migration across provider changes)
  - `embedded_at` (timestamp)

**What gets embedded.** For a component, the `embedded_text` is a deterministic concatenation of:
- `api_name`
- `label`
- `description` (from metadata, if present)
- `help_text` (for fields)
- `inline_help` (for objects)
- For Apex classes and triggers: class-level comments + the first 50 lines of source
- For flows: flow label, description, and the names of all flow elements
- For validation rules: error message + formula comments

**Re-embedding rules.** On sync, compute `embedded_text` and its hash. If the hash matches the stored hash, do nothing. If it differs, re-embed. This prevents re-embedding the entire org on every sync and keeps embedding costs bounded.

**Indexing.** HNSW index on `embedding` with cosine distance. Tune `m` and `ef_construction` based on observed recall during Phase 3.

**Embedding model choice.** Decision deferred to Phase 1 start. Candidates: Voyage AI `voyage-3-lite` (cheaper, competitive quality) or OpenAI `text-embedding-3-small` (mature, widely supported). Whichever is chosen, store `embedding_model` on each row so a future migration can be incremental.

### 4.4 Layer 3: Business Domains

**Purpose.** Group components by business purpose, independent of the structural relationships in Layer 1. An "Account Onboarding" domain might span an Account field, a Contact field, a Flow, two validation rules, and an Apex trigger — components that have no direct structural edges between them but serve the same business process.

**Entities.**

- `domains`
  - `id` (UUID)
  - `project_id` (FK)
  - `name` (string; e.g., "Account Onboarding")
  - `description` (text)
  - `source` (enum: `ai_proposed`, `human_asserted`)
  - `status` (enum: `proposed`, `confirmed`, `archived`)
  - `created_by` (user_id, nullable — null when AI-proposed and not yet confirmed)
  - `created_at`, `updated_at`

- `domain_memberships`
  - `domain_id` (FK)
  - `component_id` (FK)
  - `rationale` (text, nullable; the AI's reasoning, or a human's note)
  - `source` (enum: `ai_proposed`, `human_asserted`)
  - `confidence` (float, nullable; populated for AI-proposed memberships)
  - Primary key: `(domain_id, component_id)`

**Membership semantics.**
- **Many-to-many.** A component can belong to multiple domains simultaneously (`Account.Status__c` can be in Onboarding, Renewal, and Reporting).
- **Not hierarchical.** Domains are flat. If hierarchy proves necessary post-V1, add a `parent_domain_id` column; do not design for it now.
- **Human override.** If an architect rejects an AI-proposed membership, mark the membership `status = archived` with `archived_reason`. Do not re-propose it on the next run unless the component's metadata changes materially.

**Population paths.**
- **Brownfield / rescue initial sync.** A Claude Managed Agents session walks the graph and proposes domains + memberships. The architect reviews in a UI and confirms, edits, or rejects. This is the primary path for inherited orgs. See §4.8.
- **Greenfield.** The architect creates domains manually as epics and features are defined, and links components as they are planned or built. AI may suggest memberships for new components based on epic/feature context.
- **Ongoing.** Every 2 weeks (or on architect trigger), a lighter domain-review pass runs over recently changed or new components and proposes memberships to existing domains.

### 4.5 Layer 4: Business Context Annotations

**Purpose.** The accumulated human knowledge about what components *mean* and *do* from a business perspective. This is the layer that makes the knowledge base useful — raw metadata is structurally explicit but semantically opaque.

**Entities.**

- `annotations`
  - `id` (UUID)
  - `project_id` (FK)
  - `entity_type` (enum: `component`, `edge`, `domain`)
  - `entity_id` (UUID; references the appropriate entity based on `entity_type`)
  - `content` (text)
  - `content_type` (enum: `note`, `warning`, `decision_reference`, `history`; defaults to `note`)
  - `source` (enum: `human`, `ai_derived_from_discovery`; for annotations the Answer Logging pipeline generates when a decision impacts a component)
  - `created_by` (user_id)
  - `created_at`, `updated_at`
  - `status` (enum: `active`, `archived`)

- `annotation_embeddings` (parallel structure to `component_embeddings`; supports annotation search independently of component search)

**Polymorphic pattern.** `entity_type` + `entity_id` forms a polymorphic foreign key. This is a deliberate deviation from strict relational normalization; the alternative (separate `component_annotations`, `edge_annotations`, `domain_annotations` tables) is worse for query patterns. Enforce consistency with a check constraint on application writes.

**Lifecycle.**
- When the annotated entity is soft-archived (Layer 1 component deletion), all annotations on it are soft-archived as a cascade. They remain queryable for historical context.
- Annotations are never hard-deleted except on project archive.
- Edit history is preserved via `annotation_versions` table (optional, Phase 4).

### 4.6 Layer 5: Query & Retrieval Interface

**Purpose.** The single entry point for "find relevant org knowledge for X." All higher-level consumers (story generation, context package assembly, freeform agent, dashboards) use this layer rather than reaching into Layers 1-4 directly.

**Primary function signature.**

```typescript
search_org_kb(
  project_id: string,
  query: string,
  options: {
    entity_types?: ('component' | 'edge' | 'domain' | 'annotation')[],
    component_types?: ComponentType[],  // filter Layer 1 results
    domain_ids?: string[],                // restrict to specific domains
    limit?: number,                        // default 20
    include_neighbors?: boolean,           // expand components to include 1-hop neighbors
  }
): Promise<SearchResult[]>
```

**Implementation: hybrid search with reciprocal rank fusion.**

1. **BM25 full-text search** over `org_components.api_name`, `org_components.label`, `org_components.raw_metadata` (selected fields projected to tsvector), and `annotations.content`. Use Postgres native `tsvector` + `tsquery`.
2. **Vector similarity search** over `component_embeddings.embedding` and `annotation_embeddings.embedding` using cosine distance.
3. **Reciprocal rank fusion** to merge the two result lists: `score = Σ (1 / (k + rank_i))` across rank lists, with `k = 60` (standard default).
4. **Filter and expand** based on `options`.
5. Return ranked `SearchResult` objects with entity type, entity ID, fused score, and a snippet.

**Context Package Assembly (amends PRD §12.2 Tier 2).** This is the deterministic function that Claude Code calls via the Context Package API. It is **not an agent loop**; it is a pipeline that ends with a single LLM call for summarization.

```
Input: story_id
1. Fetch the story, its acceptance criteria, parent epic/feature.
2. Read story.impacted_components (list of Layer 1 component IDs).
3. For each impacted component:
   a. Fetch component + all 1-hop neighbors via component_edges.
   b. Fetch domain memberships for component.
   c. Fetch annotations on component.
4. For each unique domain touched by step 3b:
   a. Fetch domain description and annotations.
5. Fetch related discovery Q&A via hybrid search using story description as query.
6. Fetch in-flight stories (status = In Progress, In Review) that share any component
   in the impacted set → surface sprint coordination flags.
7. Apply token budget: target 20k tokens for the package. If over, trim by lowest
   semantic similarity to the story description.
8. Single Sonnet call: generate a 200-word "context brief" header summarizing
   what the developer needs to know, referencing the structured data below it.
9. Return: { context_brief, story, epic_context, components_with_neighbors,
            domains, annotations, related_discovery, coordination_flags }.
```

Total latency target: <3 seconds p95 on a medium-complexity story. The only LLM call is step 8; everything else is SQL + vector search.

**On-demand org queries (amends PRD §12.2 Tier 3).** The Org Query API is a thin wrapper over `search_org_kb` with optional LLM synthesis when the caller requests a narrative answer rather than raw results.

### 4.7 Freshness and Change Propagation Rules

This is the section that was missing from the original PRD and where projects usually get into trouble at month 3. These rules are non-negotiable.

**Identity.**
- Primary match key on sync is `salesforce_metadata_id`. This is durable across renames.
- For metadata types without a durable Salesforce ID, the fallback is `api_name` within the correct `component_type` and `parent_component_id` scope. Log a warning per project per sync for any such components.

**Sync reconciliation algorithm.**

For each component returned by a sync:
1. Match by `salesforce_metadata_id` first. If matched: update in place, set `last_seen_at`, `last_modified_at` if `metadata_hash` changed.
2. If no `salesforce_metadata_id` match: match by `(api_name, component_type, parent_component_id)`. If matched: update in place.
3. If no match: create new component with `first_seen_at = now()`.
4. Record rename: if a match by `salesforce_metadata_id` has a different `api_name` than stored, record the change in `component_history` and update. Annotations, domain memberships, and edges are preserved.
5. After processing all components, any `org_components` row with `last_seen_at` older than the current sync timestamp is **soft-archived**: `status = archived`, annotations on it also soft-archived. Edges to/from it are soft-archived. Never hard-deleted.

**Re-embedding.**
- Compute `embedded_text` and its hash on every sync.
- Re-embed only if hash changed.
- This keeps embedding costs proportional to actual change, not to org size.

**Domain membership preservation.**
- Renames preserve memberships (matched by `salesforce_metadata_id`).
- Schema changes that add new fields to an object whose existing fields are members of a domain trigger a **domain review nudge** to the architect: "The Account object is a member of the Onboarding domain. 3 new fields were added in the last sync. Review for domain inclusion?"
- Archives preserve membership history but exclude from active queries.

**Annotation preservation.**
- Annotations follow entities by ID, not by name. Renames don't break annotations.
- Archives soft-archive annotations.

**Unresolved references.**
- Some references can't be resolved at parse time: dynamic SOQL, dynamic Apex invocation, external callouts. These are recorded as `component_edges` with `target_component_id = null` and `unresolved_reference_text` populated. They appear in the graph as dangling edges and are flagged in Org Health.

**Managed package handling.**
- Components with a non-null `namespace` are included in Layer 1 and Layer 2.
- They are excluded from AI-proposed domain memberships by default (managed package internals are rarely the firm's business concern). A project setting can override this.
- Annotations on managed package components are supported (useful for documenting how a managed package is used in this org).

**Large org strategy.**
- For orgs with >10k custom fields or >500 Apex classes: sync runs in chunks with pagination. Embedding is batched (50 components per API call to the embedding provider). Domain proposal is lazy — only runs over recently-changed-or-new components after initial brownfield ingestion.
- Initial brownfield ingestion of a large org may take 30-90 minutes. This is an acceptable background workload for the Managed Agents session (see §4.8).

### 4.8 Claude Managed Agents Scope

Managed Agents is used for exactly two workloads in V1:

**1. Org Health Assessment (rescue/takeover engagements, PRD §13.6).**
- Long-running (30 min – 2 hours).
- Traverses the full Layer 1 graph.
- Runs deterministic analyses (test coverage calculation, governor limit risk pattern detection via static analysis, sharing model review, FLS compliance check, hardcoded ID detection, technical debt inventory).
- For each finding, Claude generates a narrative explanation and remediation recommendation.
- Outputs a structured `org_health_reports` record plus a generated Word document via the standard document pipeline.
- Triggered by the architect at project setup (for rescue engagements) or on demand.

**2. Brownfield initial domain proposal.**
- Runs once per project at initial ingestion.
- Walks the Layer 1 graph, clusters components by structural relationships + semantic similarity, proposes domains + memberships + rationales.
- Writes back to `domains` and `domain_memberships` with `source = ai_proposed, status = proposed`.
- Architect reviews in UI before anything becomes `confirmed`.
- Can be re-run on demand, but default is once.

**Why Managed Agents for these specifically.** Both are long-horizon, benefit from checkpointing (restart-safe over hour-scale work), need a sandboxed environment to run static analyzers, and are triggered infrequently enough that the $0.08/hr active-runtime cost is negligible relative to token cost. They do not run on any user-facing request path.

**Not used for.** Transcript processing, answer logging, story generation, briefings, freeform agent, context package assembly, on-demand org queries, or anything else. Those are request-scoped pipelines.

### 4.9 Edge Cases and Explicit Non-Goals

- **Cross-project knowledge sharing.** Never. Each project's knowledge base is fully isolated. PRD §22.2 is preserved.
- **Real-time metadata sync.** Not in V1. Periodic (4-hour default) + manual trigger. Webhooks deferred (PRD §27 item 3 remains).
- **Component source code full-text analysis.** Apex source is stored and embedded at the class/trigger level (first 50 lines + comments), not full-body. Full body analysis is an Org Health Assessment task, not a live knowledge layer concern.
- **Line-level component provenance across syncs.** If an Apex class is refactored and its behavior changes but its name and ID remain, the knowledge base only tracks that the `metadata_hash` changed. It does not diff the source. Diff viewing is a future enhancement.
- **Multi-org sandboxes.** Out of scope. One sandbox per project (PRD §13.1).

---

## 5. Project Management AI Layer (supersedes PRD §6 in substance)

### 5.1 Architecture

The project management AI layer is:

- **Four deterministic pipelines.** Each is a stage graph with explicit inputs, outputs, and a specific model per stage. Pipelines handle the predictable, high-volume workflows.
- **One narrow freeform agent.** The "project brain chat." It handles open-ended PM/BA interactions where the flow can't be predicted.
- **One shared hybrid retrieval primitive.** Used by every pipeline and the agent. Same function, same scoring, same filters.
- **One centralized model router.** No pipeline stage hardcodes a model name.

The "Big Agent" anti-pattern (one LLM with dozens of tools reasoning its way through every interaction) is explicitly rejected. It is slow, expensive, non-evaluable, and degrades as project complexity grows.

### 5.2 The Four Pipelines

Each pipeline below is specified with: **input**, **stages** (with model per stage), **output**, **eval strategy**, and **failure handling**.

---

#### 5.2.1 Transcript Processing Pipeline

**Input.** Raw transcript (text, any length), source metadata (meeting type, attendees, date, project_id).

**Stages.**

| # | Stage | Model | Purpose |
|---|---|---|---|
| 1 | Segment | Haiku | Split into speaker turns (if not already structured), chunk into reasoning units of ~500 tokens. |
| 2 | Extract candidates | Haiku | Structured-output extraction of: questions, answers, decisions, requirements, risks, action items. Each with `text`, type-specific hints, and `confidence`. |
| 3 | Entity resolution | deterministic + hybrid search | For each candidate, retrieve top-K existing entities via `search_project_kb` scoped to the candidate type. |
| 4 | Reconcile | Sonnet | For each candidate + top-K matches, decide: `create_new`, `merge_with_existing`, `update_existing`. Structured output. |
| 5 | Apply | deterministic | If `confidence > 0.85`: auto-apply. Else: queue in `pending_review` table for human confirmation. |
| 6 | Impact assessment | Sonnet | For each applied change: which stories are unblocked, which decisions are contradicted, which new questions are raised. Writes `impact_notes` and triggers notifications. |
| 7 | Log | deterministic | Create `session_log` entry with full pipeline trace for audit. |

**Output.** `{ applied_changes[], pending_review[], new_questions_raised[], blocked_items_unblocked[], conflicts_detected[], session_log_id }`.

**Eval.** 10 labeled transcripts in `evals/transcript_processing/`. Each fixture has input transcript + expected extraction set (structural, not exact strings). Metrics: extraction F1 per candidate type, entity resolution top-1 accuracy, reconciliation decision accuracy.

**Failure handling.** Each stage is idempotent and retry-safe. Stage failure after 3 retries escalates to a human-review queue with the partial state preserved. No transcript is ever "lost" — the raw text is always retained on input.

---

#### 5.2.2 Answer Logging Pipeline

**Input.** Free-text answer from a user ("client confirmed renewal opps stay open until finance reviews"), optional question_id hint, project_id, user_id.

**Stages.**

| # | Stage | Model | Purpose |
|---|---|---|---|
| 1 | Retrieve candidate questions | deterministic + hybrid search | Top-5 open questions matching the answer text. |
| 2 | Match | Sonnet | Pick best matching question or determine "this is a standalone decision, not an answer." |
| 3 | Apply | deterministic | Update question with answer + `answered_date` OR create new decision. |
| 4 | Impact assessment | Sonnet | Identify unblocked stories, contradicted decisions, new questions to raise. |
| 5 | Propagate | deterministic | Apply impacts; create `conflicts_flagged` records for human review. |
| 6 | Annotate org KB | Sonnet | If the answer mentions Salesforce components by name or concept, propose an annotation on those components (Layer 4). Human confirms or rejects. |

**Output.** `{ question_updated_or_decision_created, impacts[], conflicts[], proposed_annotations[] }`.

**Eval.** 10 answer/question pairs with labeled correct matches. Metric: match accuracy, impact assessment completeness (no hallucinated impacts, no missed contradictions on known-contradicted fixtures).

---

#### 5.2.3 Story Generation Pipeline

**Input.** `requirement_id` OR `epic_id` + free-text prompt, project_id, user_id.

**Stages.**

| # | Stage | Model | Purpose |
|---|---|---|---|
| 1 | Assemble context | deterministic | Fetch parent epic/feature, linked requirements, related discovery Q&A (via hybrid search), candidate impacted components (via `search_org_kb` using requirement text). |
| 2 | Draft story | Sonnet | Structured-output draft matching the mandatory field schema (PRD §10.3). |
| 3 | Validate mandatory fields | deterministic | Every mandatory field present and well-formed. |
| 4 | Component cross-reference | deterministic + hybrid search | For each impacted component in the draft: does it exist? Is there an existing component with similar semantics (possible conflict)? |
| 5 | Resolve conflicts | Sonnet (only if stage 4 flagged) | "The field `Account.Renewal_Status__c` already exists with a different purpose. Is this story extending or replacing it?" Propose resolution. |
| 6 | Typography/branding validator | deterministic | Firm-level rules per PRD §6.3. |
| 7 | Return draft | deterministic | Persist as `draft` status; human reviews in UI before promoting to `ready`. |

**Output.** `{ story_draft, validation_result, component_conflicts[], ai_suggestions[] }`.

**Eval.** 15 labeled requirement-to-story fixtures. Structural validation of mandatory fields; semantic similarity check on acceptance criteria vs. gold; component cross-reference accuracy.

---

#### 5.2.4 Briefing / Status Pipeline

**Input.** `project_id`, `briefing_type` (enum: `daily_standup`, `weekly_status`, `executive_summary`, `blocker_report`, `discovery_gap_report`, `sprint_health`).

**Stages.**

| # | Stage | Model | Purpose |
|---|---|---|---|
| 1 | Fetch metrics | deterministic SQL | Per-briefing-type metrics query bundle (e.g., weekly_status pulls: stories completed, stories in progress, open questions by age, risks active, decisions logged). Cached per briefing type with 5-minute TTL. |
| 2 | Assemble narrative context | deterministic | Structured bundle of recent-period items. |
| 3 | Synthesize | Sonnet | Generate narrative prose matching the briefing-type template. |
| 4 | Validate | deterministic | Typography, branding, no AI-characteristic phrasing. |
| 5 | Cache and return | deterministic | Store generated briefing with `generated_at` and `inputs_hash` for cache invalidation. |

**Output.** Rendered briefing (markdown or HTML depending on destination).

**Eval.** Qualitative gold-standard briefing per type. Automated check: structural presence of required sections; no forbidden phrases; numeric accuracy (metrics in narrative match metrics from stage 1).

---

### 5.3 The Freeform Agent ("Project Brain Chat")

There is exactly one agent loop in the system. It is scoped to open-ended user conversations where the flow is unpredictable: "help me think through how to scope this epic," "what don't we know yet about renewals?", "summarize where we are on data migration and what's at risk."

**Model.** Sonnet 4.6 default. Opus 4.6 via user-triggered "think harder" mode.

**Context.** The last N turns (N tuned, starting at 20) + the project's Tier 1 summary + any dynamically retrieved context via the tools below.

**Tools.**

Read tools (no confirmation needed):
- `search_project_kb(query, entity_types, filters)` — hybrid search across questions, decisions, requirements, risks, stories, annotations, components.
- `search_org_kb(query, options)` — see §4.6.
- `get_sprint_state(sprint_id | current)` — structured sprint summary.
- `get_project_summary()` — Tier 1 summary.
- `get_blocked_items(age_threshold)` — blocked work items.
- `get_discovery_gaps(epic_id | all)` — outstanding questions by scope.

Write tools (confirmation required in UI before apply):
- `create_question(scope, text, owner)`
- `create_risk(text, likelihood, impact, mitigation)`
- `create_requirement(text, priority, source)`

**Explicitly not available to the agent.** Story creation (use the pipeline), transcript processing (use the pipeline), answer logging (use the pipeline), document generation (separate pipeline), sprint modification. The agent *suggests*; pipelines *execute*.

**Conversation persistence.** Every turn is logged to `agent_conversations` + `agent_messages`. The conversation has a `project_id` and a `user_id` and is resumable.

### 5.4 Hybrid Retrieval Primitive (shared)

Same design as §4.6, generalized beyond the org KB. Implemented once, used everywhere.

```typescript
search_project_kb(
  project_id: string,
  query: string,
  options: {
    entity_types?: ('question' | 'decision' | 'requirement' | 'risk' |
                    'story' | 'annotation' | 'component')[],
    filters?: Record<string, any>,
    limit?: number,
  }
): Promise<SearchResult[]>
```

Under the hood: BM25 + vector fusion across tables. Each searchable entity has a corresponding embedding table (`question_embeddings`, `decision_embeddings`, etc.) or is covered by `component_embeddings` / `annotation_embeddings`.

**Scheduling embeddings.** On entity create/update, enqueue an embedding job via the background job runner. Embedding is asynchronous; a new entity is searchable via BM25 immediately and via vector similarity once the embedding job completes (typically <30 seconds). This is acceptable eventual consistency.

### 5.5 Model Routing Policy

A centralized `model_router` module is the only place in the codebase that resolves a task to a specific model. Every pipeline stage and the freeform agent requests a model by **intent**, not by name.

```typescript
type Intent =
  | 'extract'           // structured extraction, classification, routing
  | 'synthesize'        // narrative generation, reconciliation, impact assessment
  | 'generate_structured' // story drafts, structured outputs requiring reasoning
  | 'reason_deeply'     // Org Health, conflict analysis, user 'think harder'
  | 'embed';            // embedding (routed to the embeddings provider)

function resolve_model(intent: Intent, override?: ModelOverride): ModelConfig { ... }
```

**Default mapping.**

| Intent | Default Model | Typical Cost Tier |
|---|---|---|
| `extract` | Haiku 4.5 | Low |
| `synthesize` | Sonnet 4.6 | Mid |
| `generate_structured` | Sonnet 4.6 | Mid |
| `reason_deeply` | Opus 4.6 | High |
| `embed` | Voyage 3-lite *or* OpenAI text-embedding-3-small | Very low |

**Why centralized.** When the next Claude generation ships, or when cost tuning becomes necessary, this is the single file that changes. Pipelines remain stable.

**Override hooks.** A `ModelOverride` can force a specific model for a given call. Used sparingly: user-triggered "think harder" mode forces `reason_deeply`; eval runs can force specific models to validate routing decisions.

### 5.6 Evaluation Harness (new V1 requirement)

**Structure.**

```
/evals
  /transcript_processing
    fixtures/
      transcript_01.json
      transcript_02.json
      ...
    expectations.ts        # structural + semantic assertions
  /answer_logging
    fixtures/
    expectations.ts
  /story_generation
    fixtures/
    expectations.ts
  /briefing
    fixtures/
    expectations.ts
  /context_package_assembly
    fixtures/
    expectations.ts
  runner.ts                # `pnpm eval [name]`
  shared/
    assertions.ts          # common semantic similarity, structural checks
```

**Fixture format.** JSON with `input`, `expected_properties` (structural assertions), optional `gold_output` (for semantic similarity checks, not exact match).

**Runner behavior.** Runs all fixtures for the target pipeline against the current codebase, produces a pass/fail report with diffs on failures, tracks latency and token cost per fixture for regression detection.

**CI integration.** `pnpm eval all` runs on PRs touching `src/ai/`, `src/pipelines/`, `prompts/`, or `evals/`. Non-zero exit blocks merge. Cost per CI run is bounded (~$0.50 expected).

**Initial fixtures.** 10 per pipeline at Phase 1 ship. Expand continuously as bugs are discovered (every production bug in a pipeline becomes a new fixture).

**Why this is V1, not V2.** Without evals, every prompt change is a roll of the dice. With 4 pipelines and a freeform agent, silent quality regression is inevitable within weeks. The eval harness pays for itself by the second prompt change.

---

## 6. Build Sequence Amendments (amends PRD §26)

### 6.1 Phase 1 — Expanded Scope

Add to Phase 1:

- **pgvector enabled** on the Postgres instance.
- **Embedding provider selected** and integrated.
- **Embedding job infrastructure** (background queue, embedding enqueue on entity write, retry on failure).
- **Hybrid retrieval primitive** (`search_project_kb`) implemented for the entities that exist at end of Phase 1 (questions, decisions, requirements, risks, session logs).
- **Model router module** implemented with intent-based resolution.
- **Eval harness scaffold** + 10 fixtures each for Transcript Processing and Answer Logging pipelines.
- **Layer 1 schema only** for the org KB (`org_components`, `component_edges`). No ingestion yet. This ensures no schema migration shock in Phase 3.

Rationale: retrieval, embeddings, routing, and evals are cross-cutting. Building them late means refactoring Phase 1/2 code to use them retroactively. Front-load once, reuse forever.

### 6.2 Phase 2 — Unchanged Scope, Updated Implementation

Phase 2 implements story management and sprint intelligence. Story Generation now runs as the pipeline specified in §5.2.3. Mandatory field validation is a deterministic stage in that pipeline. Embeddings extend to stories on creation. Evals added for Story Generation.

### 6.3 Phase 3 — Reduced Scope

Phase 3 now focuses on **Salesforce-specific ingestion and parsing** plus the **Context Package API**. The underlying retrieval, embedding, and schema substrate already exist.

Additions to Phase 3:
- Layer 2: component embeddings (substrate exists; enable on component sync).
- Layer 3: domain entities + manual creation UI. AI-proposed domain flow wired up (calls Managed Agents).
- Layer 4: annotations CRUD + UI.
- Layer 5: `search_org_kb` + Context Package API full implementation.
- Managed Agents integration for Org Health Assessment and brownfield domain proposal.
- Sync reconciliation algorithm per §4.7.
- Freshness edge cases per §4.9.

### 6.4 Phase 4 — Unchanged

Documents, QA, Jira sync, archival, polish. Same scope as PRD §26 Phase 4.

### 6.5 Cross-Phase: Freeform Agent

Build the freeform agent at end of Phase 2 (after enough entity types exist to have meaningful tools), not in Phase 1. Phase 1 uses the pipelines for all AI functionality.

---

## 7. Data Model Additions (amends PRD §5.2)

New entities introduced by this addendum:

**Org knowledge layer:**
- `component_edges`
- `component_embeddings`
- `component_history` (rename/modification audit trail)
- `domains`
- `domain_memberships`
- `annotations`
- `annotation_embeddings`
- `org_health_reports`
- `unresolved_references` (materialized view over `component_edges` where `target_component_id` is null)

**Retrieval/AI infrastructure:**
- `question_embeddings`
- `decision_embeddings`
- `requirement_embeddings`
- `risk_embeddings`
- `story_embeddings`
- `pipeline_runs` (observability: which pipelines ran, with which inputs, producing which outputs, at what cost)
- `pipeline_stage_runs` (per-stage trace within a pipeline run)
- `pending_review` (items from pipelines awaiting human confirmation)
- `conflicts_flagged` (contradictions detected by impact assessment)
- `agent_conversations`
- `agent_messages`

**Eval infrastructure (optional persistence, can live as files):**
- `eval_runs` (if persisting CI eval history)

Schema definitions in Prisma should be added during Phase 1 implementation. This addendum specifies which entities exist; the exact Prisma schema is produced by Claude Code during implementation.

---

## 8. Open Questions Additions (amends PRD §27)

Items **resolved** by this addendum:
- §27.1 (AI context window management) — resolved by pipeline decomposition + token budgets in context package assembly.
- §27.2 (Org metadata sync performance) — partially resolved by chunked sync + lazy domain evaluation + hash-based re-embedding; specific performance characteristics still measured during Phase 3.

Items **added**:

**A. Embedding provider selection.** Decision needed at Phase 1 start: Voyage AI vs. OpenAI. Criteria: quality on Salesforce-domain vocabulary (run a small quality test with 50 labeled component-to-query pairs), cost at expected volume, data handling posture, latency.

**B. Hybrid search weighting.** The reciprocal rank fusion constant `k = 60` is a default. Tune based on retrieval quality measurements during Phase 1 using labeled query-to-correct-entity pairs.

**C. Managed Agents cost ceiling.** What is the per-project budget for Org Health Assessment? A 2-hour Opus session with tool use could reach $10-30 in compute. Set a default ceiling (e.g., $25) with architect-override for rescue engagements where the value justifies deeper analysis.

**D. Domain proposal quality floor.** At what AI-proposed-membership confidence should memberships be auto-confirmed vs. require human review? Start at manual-review-for-all; revisit after the first 5 brownfield projects inform the threshold.

**E. Embedding model migration strategy.** When the firm switches embedding providers (inevitably, over multi-year lifespan), how is re-embedding orchestrated? Proposed: a background migration job that re-embeds incrementally, with dual-write during the transition window. Formalize when the first migration is planned.

**F. Rename collision edge case.** If a Salesforce metadata ID is reused after a component is deleted and a new component is created with the same `api_name`, the sync may produce ambiguous matches. Current rule: match by ID first; if ID mismatch, treat as new component. Validate this behavior with an edge-case fixture in Phase 3.

---

## 9. Refactoring Guidance for Work-in-Progress Implementation

If Claude Code has already begun building against PRD v2.1, the following is the recommended refactor path:

### 9.1 Additive, non-breaking changes
- Add pgvector extension and embedding tables (doesn't affect existing queries).
- Add model router module and retrofit existing Claude calls to route through it.
- Add eval harness scaffold.
- Add `pipeline_runs` / `pipeline_stage_runs` observability tables.

### 9.2 Refactoring changes
- Any existing "harness" code that handled transcript processing, answer logging, story generation, or briefings as a generic agent loop should be decomposed into pipelines per §5.2. The external API of each workflow remains the same.
- Any existing org KB code that assumed a flat `org_components` table is compatible with Layer 1. Add `component_edges` and migrate any ad-hoc relationship storage to use it.
- Any existing direct Claude calls should be updated to use the model router.

### 9.3 New work (not a refactor)
- Layer 3 (domains) and Layer 4 (annotations) are new. Build per §4.4-4.5.
- Hybrid retrieval primitive is new. Build per §4.6/5.4.
- Freeform agent is new. Build end of Phase 2 per §5.3.
- Managed Agents integration is new. Build in Phase 3 per §4.8.

### 9.4 Decisions to confirm before resuming implementation

Before Claude Code proceeds beyond the current state, the following decisions should be explicitly confirmed:

1. Embedding provider (Voyage AI vs. OpenAI).
2. Background job runner (Inngest vs. Trigger.dev vs. alternative).
3. That the pipeline-first architecture supersedes any existing "generic harness" design.
4. That eval harness is included in Phase 1 scope.

---

## 10. What This Addendum Does Not Change

For clarity to avoid misinterpretation:

- All user-facing behavior described in PRD v2.1 (workflows, dashboards, role capabilities, document generation, sprint management, QA) remains exactly as specified.
- All security, compliance, and data handling posture in PRD §22 remains as specified, with the sole addition of the embeddings provider contractual requirement in §3.2 of this addendum.
- All six Salesforce development guardrails in PRD §15 remain as specified and continue to be enforced in Claude Code skills, not in the web application.
- All scope exclusions in PRD §24 remain.
- Engagement types, project lifecycle, and RBAC are unchanged.

---

**End of Addendum v1.**
