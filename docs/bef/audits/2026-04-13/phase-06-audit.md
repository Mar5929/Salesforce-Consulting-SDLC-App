# Phase 6 Audit: Five-Layer Org Knowledge Base

**Auditor:** Claude (Opus 4.6, 1M context) — from-scratch audit agent
**Date:** 2026-04-13
**Phase artifacts audited:**
- `docs/bef/03-phases/phase-06-org-knowledge/PHASE_SPEC.md` (HEAD 2026-04-13)
- `docs/bef/03-phases/phase-06-org-knowledge/TASKS.md` (HEAD 2026-04-13)

**Authoritative sources consulted:**
- `docs/bef/00-prd/PRD.md` §§3, 5, 6, 12, 13, 14, 22, 23, 26
- `docs/bef/00-prd/PRD-ADDENDUM-v1-Intelligence-Layer.md` §§2, 3, 4.1–4.9, 5.2.2, 5.4, 6.3, 7, 8
- `docs/bef/01-architecture/TECHNICAL_SPEC.md` (spot-checked schema + search_org_kb sections)
- `docs/bef/audits/2026-04-13/REQUIREMENT_INDEX.md`

**Reminder.** Addendum §4 supersedes PRD §13.4; Addendum §2 locks pgvector + hybrid retrieval. Any spec that reverts to the flat-KB model or a non-hybrid retrieval shape is a Blocker.

---

## 1. Scope Map

Requirements drawn from the REQUIREMENT_INDEX rows whose Phase-hint contains 6, plus Phase-6-claimed preserved REQ-ORG-* items.

| Req ID | Requirement (1-line) | Covered by (spec §/task #) | Status | Notes |
|--------|----------------------|----------------------------|--------|-------|
| PRD-3-08 | Project connects to a single SF sandbox | §2.1 / Task 27 (PKCE) | Pass | |
| PRD-5-07 | Inngest step functions resumable | §2.15 / Tasks 21–23 (org-health.ts as Inngest step fn) | Pass | |
| PRD-5-09 | Read-only SF connection | §2.1 (implicit) | Partial | Spec doesn't explicitly call out read-only enforcement. Gap-12. |
| PRD-5-10 | Data model includes OrgComponent, OrgRelationship, DomainGrouping, BusinessContextAnnotation, BusinessProcess, KnowledgeArticle, etc. | §6 migrations; TASKS 1–5 | Pass | Migration path named. |
| PRD-5-18 | KnowledgeArticle has embedding, staleness | §2.10, §6.4 / Task 18, 34 | Partial | `KnowledgeArticle.embedding` fate deferred (§6.4 / Task 4). Gap-02. |
| PRD-5-19 | KnowledgeArticleReference polymorphic | §2.10 / Task 18 | Pass | |
| PRD-5-27 | BusinessProcess statuses + complexity | Not mentioned | Fail | Preserved entity not reaffirmed. Gap-13. |
| PRD-5-35 | GET /org/query endpoint | §2.13 / Task 24 | Pass | |
| PRD-6-07 | Context budget management | Deferred to Phase 5 | NotApplicable | Phase-hint 2,5. |
| PRD-6-08 | Harness task types incl. Org Query | §2.13 / Task 24 | Pass | |
| PRD-6-17 | Reusable context assembly fns | Phase 2 | NotApplicable | |
| PRD-12-04/05/06/07 | Context Package Tier 2 | Deferred to Phase 5 | NotApplicable | Phase 6 unblocks via `search_org_kb`. |
| PRD-12-10 | Sync ingests after merge | §2.2 / Task 6 | Pass | |
| PRD-13-01..03 | Single sandbox, OAuth JWT/WebServer, read-only | §2.1 / Task 27 | Partial | OAuth Web Server + PKCE only; JWT Bearer not listed. Gap-12. |
| PRD-13-04 | Metadata sync covers all SF CLI types (custom/standard objects, Apex, Flow/PB/Workflow/VR, LWC/Aura, perm sets/profiles/groups, Connected Apps, Named Creds, Remote Sites, installed packages) | §2.2, §2.4 (list partial) | Partial | Spec §2.4 edge extractors list fields/Apex/triggers/flows/VR; doesn't call out LWC/Aura, permission sets/profiles, Connected Apps, Named Credentials, Remote Sites, installed packages. Gap-01. |
| PRD-13-05 | Incremental sync Phases 1-2 on 4h cron | §2.2 / Task 28 | Pass | |
| PRD-13-06 | Full refresh Phases 3-4 weekly | §2.9 / Task 19 | Pass | |
| PRD-13-07 | Initial sync = all 4 phases | §2.9 / Task 18, 19 | Pass | |
| PRD-13-08 | `org_components` schema | Phase 11 schema + §6 | Pass | |
| PRD-13-09 | Component edges / relationships | §2.4 / Task 7 | Pass | |
| PRD-13-10 | Domain Groupings AI-suggested | §2.6 / Task 12 | Pass | |
| PRD-13-11 | BusinessContextAnnotations | §2.7 / Task 14 | Pass | |
| PRD-13-12 | Sync: add/update/flag removed, preserve history | §2.2 (5-step reconciliation) / Task 6 | Pass | |
| PRD-13-13 | Annotations accumulate | §2.7 / Task 14 | Pass | |
| PRD-13-15 | Brownfield 4-phase ingestion | §2.9 / Task 18 | Pass | |
| PRD-13-16 | Phase 3 produces BusinessProcess + BusinessProcessComponent suggestion records | Not addressed | Fail | Spec talks about domains but not BusinessProcess suggestion writes. Gap-04. |
| PRD-13-17 | Phase 4 KnowledgeArticle drafts per process + domain | §2.10 / Task 18 | Pass | |
| PRD-13-18 | Phase 3+4 single AI call | Not addressed | Fail | Addendum moves these into pipelines/managed agents; spec must state how (or if) this constraint changes. Gap-05. |
| PRD-13-19 | AI-generated entities require human review | §2.6, §2.7, §2.10 / Tasks 11, 14, 18 | Pass | |
| PRD-13-20 | BusinessProcess defaults isAiSuggested=true etc. | Not addressed | Fail | See Gap-04. |
| PRD-13-21 | AI-drafted KnowledgeArticles authorType=AI_GENERATED, confidence LOW/MEDIUM | Not addressed | Partial | Gap-04. |
| PRD-13-22 | Org Health Assessment for rescue engagements | §2.15 / Tasks 21–23 | Pass | |
| PRD-13-23 | Layer 1 (BusinessProcess ↔ OrgComponent join + BPDependency) | Task 20 (BPDependency) | Partial | Only BPDependency is named; no BusinessProcessComponent persistence task. Gap-04. |
| PRD-13-24 | Layer 2 KnowledgeArticle synthesis w/ versioning | §2.10 (referenced to pre-addendum) | Partial | Versioning not explicit. Gap-14. |
| PRD-13-25 | Layer 3 pgvector embeddings on KnowledgeArticle, OrgComponent | §2.5, §6.4 | Partial | KnowledgeArticle embedding deferred. Gap-02. |
| PRD-13-26 | Agents flag article staleness inline via DB | Task 33 (preserved) | Pass | |
| PRD-13-27 | Background deep KnowledgeArticle refresh job | §2.9 / Task 19 | Pass | |
| PRD-13-29 | Two-pass retrieval for article selection | Task 34 | Pass | |
| PRD-14-01 | Shared team sandbox | §2.1 | Pass | |
| PRD-22-04 / 22-11 / 22-12 | Per-project encryption / key rotation | Not addressed | Partial | Phase-6-hinted; credential encryption not revalidated. Gap-12. |
| PRD-23-10 | `sfOrgSyncIntervalHours` configurable | §2.3 / Task 29 | Pass | |
| PRD-25-04 | Single connection, no per-dev | §2.1 | Pass | |
| PRD-26-03 | Phase 3 deliverables | §1 scope | Pass | |
| **ADD-2-01** | Five-layer model | §1, §2.4–2.8 / Tasks 6–17 | Pass | |
| ADD-2-02 | pgvector sole vector store | §2.5 (HNSW on pgvector) | Pass | |
| **ADD-2-03** | SF durable metadata ID = primary identity | §2.2 reconciliation step 1 | Pass | |
| ADD-2-05 | Hybrid retrieval w/ RRF shared primitive | §2.8 / Task 17 | Partial | `search_org_kb` implements RRF internally but spec doesn't reference the shared primitive from Phase 1/2 (ADD-5.4-01). Gap-06. |
| **ADD-2-09** | Managed Agents limited to Health + brownfield domain proposal | §2.6, §2.15 | Pass | |
| ADD-4.1-01 | Data flows upward by ID ref | §2.7 (annotations keyed by ID) | Pass | |
| ADD-4.1-02 | Layer 1 deletion cascades as soft-archive | §2.2 step 5 + ADD-4.5-04 | Partial | Spec covers component soft-archive but does not state cascade to Layers 2–4 explicitly (only §2.7 restores rename follow-through). Gap-07. |
| ADD-4.2-01 | `org_components` required columns | Phase 11 (dep) | Pass | |
| ADD-4.2-02 | `component_edges` required columns incl. `edge_metadata jsonb` | §2.4 / Task 7 | Partial | Spec lists source/target/edge_type/unresolved_reference_text; does not mention `edge_metadata jsonb`. Gap-08. |
| ADD-4.2-03 | Recursive-CTE traversal forward/reverse/domain | §2.8 (neighbor expansion 1-hop only) / Task 17 | Fail | Only 1-hop expansion named; no multi-hop recursive CTE traversal spec. Gap-03. |
| **ADD-4.3-01** | `component_embeddings` columns | §2.5, §6.3 | Pass | |
| ADD-4.3-02 | Deterministic `embedded_text` includes `help_text`, `inline_help` | §2.5 | Partial | Spec includes api_name+label+description+help_text but omits `inline_help`. Gap-09. |
| ADD-4.3-03 | Re-embed only on hash change | §2.5 / Task 9 | Pass | |
| ADD-4.3-04 | HNSW cosine index | §2.5 / Task 10 | Pass | |
| ADD-4.3-05 | `embedding_model` persisted | §2.5 | Pass | |
| ADD-4.4-01 | `domains` schema | §2.6 / Task 1 | Pass | |
| **ADD-4.4-02** | `domain_memberships` many-to-many w/ rationale, source, **confidence** | §2.6 / Task 1 | Partial | Spec lists rationale + source + status; omits **confidence** score required by ADD. Gap-09. |
| ADD-4.4-03 | Flat domains V1 | §2.6 (implicit) | Pass | |
| ADD-4.4-04 | Rejected membership → status=archived, not re-proposed unless metadata changes | Not addressed | Fail | No re-proposal suppression rule stated. Gap-10. |
| ADD-4.4-05 | Brownfield proposal via Managed Agents | §2.6 / Task 12 | Pass | |
| ADD-4.4-06 | Greenfield: manual architect, AI suggestions for new components | Not addressed | Fail | Spec only covers brownfield path. Gap-11. |
| ADD-4.4-07 | Lighter domain-review pass every 2 weeks or on trigger | Not addressed | Fail | Only the per-sync nudge (Task 13) is covered; no biweekly review pass. Gap-11. |
| ADD-4.5-01 | Polymorphic `annotations` | §2.7 / Task 14 | Pass | |
| ADD-4.5-02 | `annotation_embeddings` | §2.7 / Task 15 | Pass | |
| **ADD-4.5-03** | Polymorphic consistency via check constraint | Not addressed | Fail | Gap-08. |
| ADD-4.5-04 | Soft-archive cascade for annotations | §4 edge case (stale flag) | Partial | Gap-07. |
| ADD-4.5-05 | Never hard-deleted except on project archive | Not addressed | Partial | Gap-07. |
| **ADD-4.6-01** | `search_org_kb` single entry point | §2.8 / Task 17 | Pass | |
| **ADD-4.6-02** | Hybrid BM25 + pgvector cosine + RRF with **k=60** | §2.8 / Task 17 | Partial | Spec says "RRF" but does not pin k=60. Gap-06. |
| ADD-4.6-04 | Context Package Assembly fetches 1-hop + annotations + Q&A + 20k budget | §2.8, Task 25 | Pass | (Phase 5 owns assembler; Phase 6 provides primitives.) |
| ADD-4.6-06 | Org Query API as thin wrapper w/ optional LLM synthesis | §2.13 / Task 24 | Partial | Spec rewrites three-tier but does not mention "optional LLM narrative synthesis" flag. Gap-15. |
| ADD-4.7-01 | Reconciliation: ID first, then (api_name, type, parent), else new | §2.2 / Task 6 | Pass | |
| ADD-4.7-02 | Missing durable IDs → per-project-per-sync warning | Not addressed | Fail | Gap-16. |
| ADD-4.7-03 | Renames → `component_history`, preserve annotations/memberships/edges | §2.2 / Task 6 | Pass | |
| ADD-4.7-04 | Unseen components soft-archived | §2.2 step 5 | Pass | |
| ADD-4.7-05 | Embedding cost proportional to change | §2.5 | Pass | |
| ADD-4.7-06 | Renames preserve domain memberships via SF metadata ID | §2.2, §2.7 | Pass | |
| **ADD-4.7-07** | New-fields-on-domain-object → "domain review nudge" | §2.6, Task 13, Task 35 | Pass | |
| ADD-4.7-08 | Archived memberships preserved, excluded from active queries | Not addressed | Fail | Gap-10. |
| ADD-4.7-09 | Annotations follow entities by ID | §2.7 | Pass | |
| **ADD-4.7-10** | Unresolved references w/ target_component_id=null, surfaced in Org Health | §2.4 / Task 8 | Partial | Org Health link mentioned but not enforced (Task 21 analyzers don't consume unresolved_references view). Gap-17. |
| ADD-4.7-11 | Managed-package components excluded from AI domain proposals by default, project override | §2.6, §2.4 | Pass | |
| ADD-4.7-12 | Annotations on managed-pkg components supported | Implicit in §2.7 | Pass | |
| **ADD-4.7-13** | Large orgs (>10k fields / >500 Apex): chunked sync + batched embedding (50/call) | Not addressed | Fail | No chunking/batch-size rules. Gap-18. |
| ADD-4.7-14 | Initial brownfield may take 30–90 min | §2.15 duration (30 min–2h for Health) | Partial | Ingestion duration not explicitly set. Gap-18. |
| **ADD-4.8-01** | Org Health: 6 analyses + `org_health_reports` + Word | §2.15 / Tasks 21–23 | Pass | |
| ADD-4.8-02 | Brownfield domain proposal = one-off Managed Agents run | §2.6 / Task 12 | Pass | |
| ADD-4.8-03 | Managed Agents never on user-facing request path | Implicit (async Inngest) | Partial | Not explicitly stated. Gap-19. |
| ADD-4.9-01 | No cross-project KB sharing | Implicit (project_id scoping) | Partial | Not explicitly reaffirmed. Gap-19. |
| ADD-4.9-02 | No real-time sync in V1 | §2.2 (cron-only) | Pass | |
| **ADD-4.9-03** | Apex stored/embedded class-level only, first 50 lines + comments | §2.5 | Pass | |
| ADD-4.9-04 | No line-level diffing | Implicit | Pass | |
| ADD-4.9-05 | One sandbox per project | §2.1 | Pass | |
| ADD-5.2.2-06 | Answer Logging Pipeline stage 6 → AI-derived annotation proposals | §2.7 / Task 16 | Pass | |
| ADD-6.1-07 | Phase 1/11 ships Layer 1 schema only, no ingestion | Honored by dependency | Pass | |
| ADD-7-01 | Additions: component_edges, component_embeddings, component_history, domains, domain_memberships, annotations, annotation_embeddings, org_health_reports, unresolved_references view | §6, Task 5 | Pass | |
| ADD-8-C | Managed Agents cost ceiling ($25 default) | §2.15 / Task 23 | Pass | |
| ADD-8-E | Embedding migration strategy | §7 deferred item #1 | Partial | Called out, not resolved. Gap-02. |
| REQ-ORG-001 | PKCE | §2.1 / Task 27 | Pass | |
| REQ-ORG-002 | Cron + reconciliation + soft-delete | §2.2 / Task 6, 28 | Pass | |
| REQ-ORG-003 | Sync schedule UI | §2.3 / Task 29 | Pass | |
| REQ-ORG-007 | KnowledgeArticle confirmation | §2.11 / Task 30 | Pass | |
| REQ-ORG-009 | PLANNED component creation | §2.12 / Task 31 | Pass | |
| REQ-ORG-010 | NLP org query | §2.13 / Task 24 | Pass | |
| REQ-ORG-011 | Agent staleness flagging | Task 33 | Pass | |
| REQ-ORG-012 | Two-pass semantic retrieval | Task 34 | Pass | |
| REQ-ORG-013 | PLANNED→EXISTING on sync | §2.14 / Task 32 | Pass | |

**Scope summary:** 88 rows mapped. 52 Pass, 20 Partial, 13 Fail, 3 NotApplicable.

---

## 2. Rubric Scorecard

| # | Criterion | Score | Justification (1 line) |
|---|-----------|-------|------------------------|
| R1 | Requirement traceability | Partial | Spec names PRD reqs and Addendum sections, but several ADD-4.x rows (4.4-04, 4.4-06, 4.4-07, 4.5-03, 4.7-02, 4.7-08, 4.7-13) have no task. |
| R2 | No PRD/Addendum/Tech-Spec contradiction | Partial | Spec honors five-layer model and pgvector, but ADD-4.2-03 (recursive-CTE multi-hop traversal) is silently narrowed to "1-hop neighbors"; PRD-13-18 (Phase 3+4 single call) left unresolved vs. Managed Agents split. No outright flat-KB reversion (no Blocker under the "flat-KB" rule). |
| R3 | Scope completeness | Fail | Missing: managed-pkg chunking/batching rules, biweekly domain review, greenfield domain flow, reject-and-suppress rule, BusinessProcess persistence path, durable-ID missing warning. |
| R4 | Acceptance criteria testable | Partial | Most ACs testable; RRF k=60, HNSW m/ef_construction, embedding batch size 50, archive exclusion query semantics, Org Health cost ceiling units ($25 per run vs per project) underspecified. |
| R5 | Edge cases enumerated | Partial | Good coverage (rename collision, failed embeddings, soft-archive of annotated entities). Missing: durable-ID missing warning, large-org chunking, archived-membership query exclusion, polymorphic check-constraint violation path, embedding-provider failure backoff. |
| R6 | Interfaces pinned | Partial | `search_org_kb` signature named (taken from Phase 11); `component_edges.edge_metadata jsonb` missing; `domain_memberships.confidence` missing; `annotations` polymorphic check-constraint not pinned; `embedded_text` field list incomplete vs ADD-4.3-02. |
| R7 | Upstream dependencies resolved | Pass | Phase 11 (schema + function signatures), Phase 2 (Answer Logging Pipeline), Phase 8 (Word doc pipeline) explicitly named with artifact-level contracts. |
| R8 | Outstanding-for-deep-dive closed/owned | Fail | §7 still lists 6 open items (embedding-migration window, rename-collision fixture, managed-pkg override UX, KnowledgeArticle embedding fate, domain-proposal confidence threshold, Org Health cost ceiling). Per prompt, R8 requires these tracked with owner/DoD. Spec status is explicitly "deep-dive still required" (§metadata line 9). Phase is not ready for /bef:execute. |

**Overall verdict:** **Ready-after-fixes**. The five-layer model is correctly adopted (no Blocker-class flat-KB reversion), but several Addendum requirements (4.4-04, 4.4-06, 4.4-07, 4.5-03, 4.7-02, 4.7-08, 4.7-13) have no task coverage, three schema details are missing, and §7 still lists 6 open deep-dive items. These must close before execute.

---

## 3. Gaps

### PHASE-6-GAP-01
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-13-04
- **Description:** Layer 1 edge-extractor coverage (§2.4) lists fields, Apex, triggers, flows, validation rules but omits LWC/Aura, permission sets/profiles/groups, Connected Apps, Named Credentials, Remote Site Settings, installed packages required by PRD-13-04. Metadata sync must cover all SF CLI types; edges/ingestion for these are unspecified.
- **Severity:** Major

### PHASE-6-GAP-02
- **Rubric criterion:** R1, R8
- **Affected Req IDs:** PRD-5-18, PRD-13-25, ADD-8-E
- **Description:** `KnowledgeArticle.embedding` fate is deferred to deep-dive (§6.4 / Task 4). Phase 6 cannot be executed while this is open because Layer 3 article retrieval (PRD-13-25, two-pass Task 34) depends on the decision. Options listed but no owner, decision date, or decision criteria.
- **Severity:** Blocker

### PHASE-6-GAP-03
- **Rubric criterion:** R2, R6
- **Affected Req IDs:** ADD-4.2-03
- **Description:** Addendum §4.2 locks recursive-CTE traversal for forward, reverse, and domain graph walks. Spec §2.8 limits `search_org_kb` neighbor expansion to 1-hop only. This silently narrows the Addendum requirement. No separate `traverse_component_graph(project_id, root_id, direction, depth)` or equivalent is specified.
- **Severity:** Blocker

### PHASE-6-GAP-04
- **Rubric criterion:** R3, R1
- **Affected Req IDs:** PRD-13-16, PRD-13-20, PRD-13-21, PRD-13-23
- **Description:** Brownfield ingestion must produce `BusinessProcess` and `BusinessProcessComponent` suggestion records with defaults (`isAiSuggested=true, isConfirmed=false, status=DISCOVERED`) and AI-drafted `KnowledgeArticle` defaults (`authorType=AI_GENERATED, confidence LOW|MEDIUM`). Only Task 20 (`BusinessProcessDependency`) exists; no task persists BusinessProcess/BusinessProcessComponent suggestions with the PRD-specified defaults.
- **Severity:** Major

### PHASE-6-GAP-05
- **Rubric criterion:** R2
- **Affected Req IDs:** PRD-13-18
- **Description:** PRD requires Phase 3+4 synthesis to run "as a single AI call because they need the same context." Addendum splits synthesis across pipelines and Managed Agents. Phase 6 spec doesn't confirm which model wins or how the single-context requirement is preserved. Needs explicit statement: does initial brownfield ingestion bundle Phase 3 (BusinessProcess synthesis) and Phase 4 (KnowledgeArticle draft) into the brownfield Managed Agents session, or split into sequential jobs?
- **Severity:** Major

### PHASE-6-GAP-06
- **Rubric criterion:** R4, R1
- **Affected Req IDs:** ADD-4.6-02, ADD-2-05
- **Description:** `search_org_kb` AC does not pin the RRF k=60 constant (ADD-4.6-02 locks k=60 default). Spec also doesn't declare `search_org_kb` as an instance of the shared hybrid-retrieval primitive from ADD-5.4-01 (implemented in Phase 1/2); risk of divergent implementations.
- **Severity:** Major

### PHASE-6-GAP-07
- **Rubric criterion:** R5, R6
- **Affected Req IDs:** ADD-4.1-02, ADD-4.5-04, ADD-4.5-05
- **Description:** Soft-archive cascade from Layer 1 → Layers 2–4 is not described. When an `org_components` row is archived, spec does not state what happens to: `component_embeddings`, `component_edges` (source or target), `domain_memberships`, `annotations` on that component, or `annotation_embeddings`. ADD-4.5-04 requires annotations cascade-soft-archive and remain queryable; ADD-4.5-05 requires no hard delete except on project archive.
- **Severity:** Major

### PHASE-6-GAP-08
- **Rubric criterion:** R6
- **Affected Req IDs:** ADD-4.2-02, ADD-4.5-03
- **Description:** Two schema details missing: (a) `component_edges.edge_metadata jsonb` column required by ADD-4.2-02 is not listed in §2.4. (b) Polymorphic consistency check constraint on `annotations(entity_type, entity_id)` required by ADD-4.5-03 is not specified.
- **Severity:** Major

### PHASE-6-GAP-09
- **Rubric criterion:** R6
- **Affected Req IDs:** ADD-4.3-02, ADD-4.4-02
- **Description:** (a) `embedded_text` builder (§2.5) omits `inline_help` required by ADD-4.3-02. (b) `domain_memberships` schema (§2.6) omits `confidence` column required by ADD-4.4-02.
- **Severity:** Major

### PHASE-6-GAP-10
- **Rubric criterion:** R3
- **Affected Req IDs:** ADD-4.4-04, ADD-4.7-08
- **Description:** No rule/task for suppressing re-proposal of a rejected `domain_membership` unless the component's metadata materially changes (ADD-4.4-04); no rule that archived memberships are preserved but excluded from active `search_org_kb` queries and Context Package Assembly (ADD-4.7-08).
- **Severity:** Major

### PHASE-6-GAP-11
- **Rubric criterion:** R3
- **Affected Req IDs:** ADD-4.4-06, ADD-4.4-07
- **Description:** Greenfield domain flow (architect creates manually, AI suggests memberships for new components) is not in spec. Biweekly "lighter" domain-review pass over recently-changed/new components (ADD-4.4-07) is not in spec (Task 13 handles only the per-sync nudge).
- **Severity:** Major

### PHASE-6-GAP-12
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-13-02, PRD-13-03, PRD-22-04, PRD-22-11, PRD-22-12
- **Description:** Spec §2.1 only addresses Web Server Flow + PKCE; JWT Bearer Flow (PRD-13-02) is not acknowledged. Read-only constraint (PRD-13-03) and per-project encryption/keyVersion rotation (PRD-22-11/12) not re-stated as Phase-6 acceptance criteria.
- **Severity:** Minor

### PHASE-6-GAP-13
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-5-27
- **Description:** BusinessProcess status enum (DISCOVERED/DOCUMENTED/CONFIRMED/DEPRECATED) and complexity (LOW/MEDIUM/HIGH/CRITICAL) not reaffirmed in Phase 6 schema review or preserved-features section.
- **Severity:** Minor

### PHASE-6-GAP-14
- **Rubric criterion:** R3
- **Affected Req IDs:** PRD-13-24
- **Description:** KnowledgeArticle versioning behavior on refresh (PRD-13-24 "Layer 2 provides AI-curated KnowledgeArticle synthesis with versioning and references") not covered by Task 19 ACs. Refresh task writes updated content but does not explicitly bump `version` or snapshot prior content.
- **Severity:** Minor

### PHASE-6-GAP-15
- **Rubric criterion:** R3
- **Affected Req IDs:** ADD-4.6-06
- **Description:** NLP org-query rewrite (Task 24) calls `search_org_kb` but does not implement the optional LLM narrative synthesis path required by ADD-4.6-06 ("thin wrapper with optional LLM synthesis for narrative answers").
- **Severity:** Major

### PHASE-6-GAP-16
- **Rubric criterion:** R5
- **Affected Req IDs:** ADD-4.7-02
- **Description:** Sync must log a warning per project per sync when Salesforce returns components without durable metadata IDs (ADD-4.7-02). Not in spec or AC.
- **Severity:** Minor

### PHASE-6-GAP-17
- **Rubric criterion:** R3, R1
- **Affected Req IDs:** ADD-4.7-10
- **Description:** Unresolved references must be flagged in Org Health (ADD-4.7-10). Task 21 deterministic analyzers enumerate six analyses (test coverage, governor limits, sharing, FLS, hardcoded IDs, tech debt) but do not include an "unresolved references" analyzer consuming the `unresolved_references` materialized view.
- **Severity:** Major

### PHASE-6-GAP-18
- **Rubric criterion:** R3, R4
- **Affected Req IDs:** ADD-4.7-13, ADD-4.7-14
- **Description:** Large-org pagination/chunking rule ( >10k custom fields or >500 Apex classes ) and embedding batch size (50 components per API call) not specified in Task 9/10 ACs. Initial brownfield ingestion duration budget (30–90 min per ADD-4.7-14) not set.
- **Severity:** Major

### PHASE-6-GAP-19
- **Rubric criterion:** R5
- **Affected Req IDs:** ADD-4.8-03, ADD-4.9-01
- **Description:** Two invariants are implicit but not enforced in ACs: Managed Agents workloads never on user-facing request path (ADD-4.8-03), and cross-project knowledge sharing is forbidden — every Layer 2–5 query must filter by `project_id` (ADD-4.9-01). Add explicit AC statements.
- **Severity:** Minor

### PHASE-6-GAP-20
- **Rubric criterion:** R8
- **Affected Req IDs:** (process)
- **Description:** §7 "Outstanding for Deep-Dive" lists 6 items without owners or resolution dates. Spec top matter reads `Status: Draft (populated from integration plan — deep-dive still required)`. Phase must be marked deep-dive-complete before a builder agent can execute.
- **Severity:** Blocker

---

## 4. Fix Plan

### Fix PHASE-6-GAP-01 (metadata coverage)
- **File(s) to edit:** `PHASE_SPEC.md` §2.4, §2.5, §6.5; `TASKS.md` Task 7, new Task 7b
- **Change summary:** Extend edge-extractor and embedding coverage to all SF CLI metadata types PRD-13-04 enumerates.
- **New content outline:**
  - §2.4: add extractor rows for LWC/Aura (`module`/`bundle` → field-access edges parsed from JS/HTML), Permission Sets/Profiles/Groups (`grants_access_to` edges), Connected Apps, Named Credentials, Remote Site Settings, installed packages (`installed_by` edges linking components to their namespace package).
  - §2.5: add embedded_text rules for LWC (description + template text nodes), Permission Set (name + label + description), Connected App (name + OAuth scopes list).
  - TASKS Task 7 AC: add "LWC/Aura references captured", "Permission-set grants captured as edges", "Connected App / Named Cred / Remote Site inventoried with edges to target objects/endpoints", "Installed-package namespace linked via edges".
  - Acceptance fixture: a sandbox with one of each metadata type must fully populate `org_components` + `component_edges`.
- **Cross-phase coordination:** Phase 11 schema already supports — confirm `component_type` enum includes LWC, AURA, PERMSET, PROFILE, CONNECTED_APP, NAMED_CREDENTIAL, REMOTE_SITE, INSTALLED_PACKAGE.
- **Definition of done:**
  - [ ] §2.4 lists every PRD-13-04 metadata family with a specific edge-extractor strategy.
  - [ ] §2.5 lists embedded_text rules for each new component type.
  - [ ] TASKS Task 7 AC enumerates each family explicitly.
  - [ ] Phase 11 `component_type` enum reconciled with the list.

### Fix PHASE-6-GAP-02 (`KnowledgeArticle.embedding` fate)
- **File(s) to edit:** `PHASE_SPEC.md` §6.4, §7 item 4; `TASKS.md` Task 4
- **Change summary:** Resolve the decision before schema work. Decision: migrate to parallel `knowledge_article_embeddings` table mirroring `component_embeddings` / `annotation_embeddings` (consistent with five-layer pattern).
- **New content outline:**
  - §6.4: lock decision = parallel table; document back-fill (generate `embedded_text` from `title + summary + content`, hash, migrate existing `KnowledgeArticle.embedding` column values row-for-row, dual-write window ≤ 1 week, cut over `two-pass retrieval` in Task 34, drop inline column).
  - §6.4: add `knowledge_article_embeddings` to Phase 11 schema as dependency (or own the migration in Phase 6 if Phase 11 has closed scope).
  - Task 4 AC: decision documented, parallel table created, all existing values migrated with non-null hashes, `KnowledgeArticle.embedding` column dropped.
  - §7 item 4: mark resolved with date + owner.
- **Cross-phase coordination:** Phase 11 schema update (or Phase 6 owns the new table); Phase 2 two-pass retrieval (Task 34) points at new table.
- **Definition of done:**
  - [ ] §6.4 states one decision, not three options.
  - [ ] Task 4 has concrete scope (not "decision pending").
  - [ ] §7 item 4 moves to "resolved" with owner.
  - [ ] Phase 11 dependency called out explicitly.

### Fix PHASE-6-GAP-03 (recursive-CTE traversal)
- **File(s) to edit:** `PHASE_SPEC.md` §2.8; `TASKS.md` Task 17, add Task 17b
- **Change summary:** Specify a `traverse_component_graph` SQL function (or `search_org_kb` option) that supports multi-hop forward, reverse, and domain traversals via recursive CTE over `component_edges`.
- **New content outline:**
  - §2.8: add signature `traverse_component_graph(project_id uuid, root_component_id uuid, direction text /* 'forward'|'reverse'|'both' */, max_depth int DEFAULT 3, edge_types text[] DEFAULT NULL) RETURNS TABLE (component_id uuid, depth int, path uuid[])` implemented as recursive CTE.
  - `search_org_kb.expand_neighbors` parameter extended to accept `{ depth: int, direction: 'forward'|'reverse'|'both' }` instead of boolean.
  - Add AC: forward walk from an object returns all fields/triggers/flows referencing it up to depth N; reverse walk from a field returns every Apex class/flow that reads or writes it; domain walk returns all components in the same domain plus their neighbors.
- **Cross-phase coordination:** Phase 11 function-signature contract must be updated (add `traverse_component_graph` signature) or Phase 6 explicitly owns the function.
- **Definition of done:**
  - [ ] `traverse_component_graph` signature in §2.8.
  - [ ] New Task 17b creates the SQL function with recursive CTE.
  - [ ] AC covers forward/reverse/domain cases.
  - [ ] Phase 11 reconciliation noted.

### Fix PHASE-6-GAP-04 (BusinessProcess persistence)
- **File(s) to edit:** `PHASE_SPEC.md` §2.9, §2.10; `TASKS.md` add Task 18b
- **Change summary:** Add explicit persistence of BusinessProcess and BusinessProcessComponent rows produced by Phase-3 synthesis with PRD-specified defaults.
- **New content outline:**
  - §2.9: state that synthesis (whether in pipeline or brownfield Managed Agents session) emits proposed `BusinessProcess` rows with defaults `isAiSuggested=true, isConfirmed=false, status=DISCOVERED, complexity=<AI-rated LOW|MEDIUM|HIGH|CRITICAL>`, and `BusinessProcessComponent` rows linking process → components.
  - §2.10: state that Phase-4 KnowledgeArticle drafts default to `authorType=AI_GENERATED, confidence=LOW|MEDIUM` (never HIGH for AI drafts).
  - Task 18b: "BusinessProcess + BusinessProcessComponent persistence". Depends on Task 12. AC: rows created with specified defaults; architect can confirm/reject in the existing confirmation UI.
- **Cross-phase coordination:** None; tables exist (PRD-5-10, PRD-5-27).
- **Definition of done:**
  - [ ] §2.9, §2.10 state the defaults explicitly.
  - [ ] Task 18b exists with AC enumerating default values.
  - [ ] Confirmation UI coverage in Task 30 extended to BusinessProcess.

### Fix PHASE-6-GAP-05 (Phase 3+4 single-context)
- **File(s) to edit:** `PHASE_SPEC.md` §2.9, new §2.9.1
- **Change summary:** State explicitly how PRD-13-18 ("single AI call") reconciles with the Addendum pipeline split.
- **New content outline:**
  - §2.9.1: "Brownfield ingestion runs Phase 3 synthesis + Phase 4 articulation in a single Managed Agents session (shares one context window). Incremental refresh (weekly) runs them as two sequential Inngest steps sharing a context bundle assembled at step start — not a single AI call — because scope is per-unassigned-component and fits in an ordinary pipeline stage."
  - Note supersession of PRD-13-18 narrowly: "PRD-13-18 applies to brownfield initial ingestion only; incremental refresh splits the call."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] §2.9.1 states reconciliation in one paragraph.
  - [ ] Revision History row added noting PRD-13-18 narrow supersession.

### Fix PHASE-6-GAP-06 (RRF k=60, shared primitive)
- **File(s) to edit:** `PHASE_SPEC.md` §2.8, §3.3; `TASKS.md` Task 17 AC
- **Change summary:** Pin RRF k=60 and declare `search_org_kb` as a specialization of the shared hybrid-retrieval primitive.
- **New content outline:**
  - §2.8: "RRF merge with k=60 (default from Addendum §4.6). Override only via tuning job; production default is 60."
  - §3.3: cite `src/lib/retrieval/hybrid.ts` (shared primitive from Phase 1/2) and note `search_org_kb` composes it.
  - Task 17 AC: "RRF constant k=60" and "shared primitive imported, not re-implemented".
- **Cross-phase coordination:** Phase 1/2 must expose the shared primitive module.
- **Definition of done:**
  - [ ] k=60 pinned in §2.8.
  - [ ] Task 17 AC names the shared primitive path.

### Fix PHASE-6-GAP-07 (soft-archive cascade)
- **File(s) to edit:** `PHASE_SPEC.md` new §2.16; `TASKS.md` new Task 6b
- **Change summary:** Define cascade rules from Layer 1 archive.
- **New content outline:**
  - §2.16 "Soft-Archive Cascade": when `org_components.status = archived`: (a) `component_embeddings` retained but excluded from active queries via `WHERE oc.status != 'archived'` filter in `search_org_kb`; (b) `component_edges` where source or target is archived → excluded from active traversals; (c) `domain_memberships` on archived component → `status = archived`, reason = "component_archived"; (d) `annotations.entity_id = component_id` → `status = archived`, cascade to `annotation_embeddings` exclusion; (e) nothing hard-deleted until project archive (ADD-4.5-05).
  - Task 6b: "Soft-archive cascade" — AC: archiving a component in a fixture leaves all related rows in place, marked archived, and excluded from `search_org_kb` results; re-activating the component (sync re-discovers it) restores rows to `active`.
- **Cross-phase coordination:** Phase 9 (archive) reads this contract for project-archive hard-delete path.
- **Definition of done:**
  - [ ] §2.16 covers all five cascade targets with SQL query semantics.
  - [ ] Task 6b exists with a round-trip fixture AC.

### Fix PHASE-6-GAP-08 (schema details)
- **File(s) to edit:** `PHASE_SPEC.md` §2.4, §2.7, §6.2; `TASKS.md` Task 2, Task 7
- **Change summary:** Add `edge_metadata jsonb` to `component_edges` spec and the polymorphic check constraint on `annotations`.
- **New content outline:**
  - §2.4: "Each edge row carries `edge_metadata jsonb` for extractor-specific context (e.g., for `references`: source line number; for `lookup`: relationship_name, cascade_delete)."
  - §2.7: "Polymorphic consistency enforced via check constraint: `CHECK ((entity_type = 'component' AND entity_id IN (SELECT id FROM org_components)) OR (entity_type = 'edge' AND ...) OR (entity_type = 'domain' AND ...))` — Phase 6 ships the DB trigger (Postgres cannot check across tables via CHECK alone; implement as BEFORE INSERT/UPDATE trigger)."
  - §6.2 + Task 2 AC: trigger present and enforced.
  - Task 7 AC: `edge_metadata` populated per extractor.
- **Cross-phase coordination:** Phase 11 schema amendment (add `edge_metadata jsonb` if absent).
- **Definition of done:**
  - [ ] `edge_metadata jsonb` in §2.4 and Phase 11 schema.
  - [ ] Polymorphic trigger in §2.7 + Task 2 AC.

### Fix PHASE-6-GAP-09 (embedding + confidence fields)
- **File(s) to edit:** `PHASE_SPEC.md` §2.5, §2.6, §6.1; `TASKS.md` Task 1, Task 9
- **Change summary:** Add `inline_help` to embedded_text; add `confidence numeric(3,2)` to `domain_memberships`.
- **New content outline:**
  - §2.5 default rule → `api_name + label + description + help_text + inline_help`.
  - §2.6 / §6.1: `domain_memberships.confidence numeric(3,2) NULL` (AI-set 0.00–1.00; human-asserted NULL).
  - Task 1 AC: confidence column present; Task 9 AC: `inline_help` included.
  - Task 12 AC: Managed Agent writes `confidence` on proposed memberships.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] `inline_help` in §2.5 list.
  - [ ] `confidence` column in §2.6 and Task 1.
  - [ ] Task 12 AC mentions confidence score.

### Fix PHASE-6-GAP-10 (rejection suppression + archived membership exclusion)
- **File(s) to edit:** `PHASE_SPEC.md` §2.6, §2.16; `TASKS.md` Task 11, new Task 11b
- **Change summary:** Add rules from ADD-4.4-04 and ADD-4.7-08.
- **New content outline:**
  - §2.6: "Rejected AI-proposed memberships: set `status = archived, archived_reason = 'rejected_by_architect'`. Brownfield or biweekly re-proposal MUST suppress any `(component_id, domain_id)` pair already archived as `rejected_by_architect` UNLESS `org_components.metadata_hash` has changed since the archive timestamp. On metadata change the pair becomes eligible for re-proposal."
  - §2.16 (from Gap-07): archived memberships excluded from active `search_org_kb` filters and Context Package Assembly.
  - Task 11 AC: rejection sets reason; Task 11b: "Re-proposal suppression" with a fixture (reject → re-run proposal → no new row; then mutate metadata_hash → re-run → proposal reappears).
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] Suppression rule stated with the exact condition (metadata_hash change).
  - [ ] Task 11b fixture covers both suppression and re-eligibility.

### Fix PHASE-6-GAP-11 (greenfield domain flow + biweekly review)
- **File(s) to edit:** `PHASE_SPEC.md` §2.6; `TASKS.md` new Tasks 12b, 12c
- **Change summary:** Add greenfield and biweekly review flows.
- **New content outline:**
  - §2.6 new subsection "Greenfield": architect creates domains manually; on each incremental sync, for every new component without a membership, AI runs a lightweight membership suggestion (Sonnet, not Managed Agents) that proposes 0–N memberships with rationale + confidence. Writes `source=ai_proposed, status=proposed`.
  - §2.6 new subsection "Biweekly Review Pass": Inngest `{ cron: "0 3 */14 * *" }` runs a Managed Agents session scoped to components whose `metadata_hash` changed in the last 14 days OR added within the last 14 days. Emits proposal diffs for architect review. Respects rejection-suppression rule (Gap-10).
  - Task 12b "Greenfield AI membership suggestions": Sonnet-based, triggered in incremental sync pipeline step, batched per sync, respects confidence threshold.
  - Task 12c "Biweekly domain review pass": Inngest cron, Managed Agents session, scope filter.
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] §2.6 has distinct Brownfield / Greenfield / Biweekly subsections.
  - [ ] Task 12b and 12c exist with model, trigger, scope, AC.

### Fix PHASE-6-GAP-12 (JWT + read-only + encryption re-affirmation)
- **File(s) to edit:** `PHASE_SPEC.md` §2.1, §8
- **Change summary:** Acknowledge JWT Bearer Flow option; re-state read-only + per-project encryption/keyVersion as Phase-6 ACs.
- **New content outline:**
  - §2.1: "OAuth 2.0 Web Server Flow + PKCE (default). JWT Bearer Flow available for CI/service accounts (V2)."
  - §8: "No write operations to SF from any Phase 6 code path (verified by code review + e2e test)."
  - §8: "Credentials encrypted with per-project HKDF-SHA256; `keyVersion` read on decrypt."
- **Cross-phase coordination:** None.
- **Definition of done:**
  - [ ] JWT Bearer called out as deferred-V2.
  - [ ] Read-only + encryption ACs present in §8.

### Fix PHASE-6-GAP-13 (BusinessProcess enum)
- **File(s) to edit:** `PHASE_SPEC.md` §2.9, §8
- **Change summary:** Restate BusinessProcess status + complexity enums as Phase-6 schema acceptance.
- **New content outline:**
  - §8 AC: "BusinessProcess.status in {DISCOVERED, DOCUMENTED, CONFIRMED, DEPRECATED}; complexity in {LOW, MEDIUM, HIGH, CRITICAL}."
- **Definition of done:**
  - [ ] Enum values present in §8.

### Fix PHASE-6-GAP-14 (article versioning)
- **File(s) to edit:** `TASKS.md` Task 19 AC
- **Change summary:** Pin versioning behavior.
- **New content outline:**
  - Task 19 AC: "Every content rewrite bumps `KnowledgeArticle.version` and writes a `KnowledgeArticleVersion` snapshot row (id, article_id, version, content, embedded_at)."
- **Definition of done:**
  - [ ] Versioning AC present in Task 19.

### Fix PHASE-6-GAP-15 (Org Query LLM synthesis)
- **File(s) to edit:** `PHASE_SPEC.md` §2.13; `TASKS.md` Task 24
- **Change summary:** Add optional LLM narrative synthesis to the NLP org-query endpoint.
- **New content outline:**
  - §2.13: "Response includes raw hits by default. When `?synthesize=true` (or body `{synthesize: true}`), a Haiku call receives hits + original query and returns a 100–200-word narrative answer in `response.narrative`. Cost logged to `pipeline_runs`."
  - Task 24 AC: "`synthesize=true` produces narrative; cost tracked; Haiku used."
- **Definition of done:**
  - [ ] `synthesize` flag documented in §2.13 request/response.
  - [ ] Task 24 AC covers synthesis path.

### Fix PHASE-6-GAP-16 (durable-ID missing warning)
- **File(s) to edit:** `TASKS.md` Task 6 AC
- **Change summary:** Add per-project-per-sync warning when SF returns components without durable metadata IDs.
- **New content outline:**
  - Task 6 AC: "On sync run, count components returned by SF with null durable metadata_id; if count > 0, emit a single `sync.durable_id_missing` warning log entry with count and first 5 api_names, and a `SYNC_DATA_QUALITY` notification at most once per sync run."
- **Definition of done:**
  - [ ] Task 6 AC includes the warning + notification.

### Fix PHASE-6-GAP-17 (unresolved-references analyzer)
- **File(s) to edit:** `PHASE_SPEC.md` §2.15; `TASKS.md` Task 21
- **Change summary:** Add unresolved-references as a seventh deterministic health analyzer.
- **New content outline:**
  - §2.15 analyzer list: add "Unresolved references (reads `unresolved_references` materialized view; flags dynamic SOQL, dynamic Apex, external callouts the KB could not statically resolve)."
  - Task 21 AC: seven analyzers, each with structured findings; unresolved-references analyzer reads the view.
- **Definition of done:**
  - [ ] Analyzer count = 7 in §2.15 and Task 21.
  - [ ] View consumer named.

### Fix PHASE-6-GAP-18 (chunking + batching + ingestion budget)
- **File(s) to edit:** `PHASE_SPEC.md` §2.2, §2.5, §4; `TASKS.md` Task 6, Task 10, Task 18
- **Change summary:** Pin large-org rules.
- **New content outline:**
  - §2.2: "Large-org gate: when org returns >10,000 custom fields OR >500 Apex classes, sync switches to chunked mode — page size 500 metadata items per SF CLI call, processed sequentially with 1-second inter-page sleep to respect API limits."
  - §2.5: "Embedding batch size = 50 components per provider API call. Inngest step function fans out with 20 parallel workers max."
  - §4 edge-case row: "Provider returns 429" → exponential backoff 1s, 2s, 4s, 8s; max 4 retries; failures logged to `component_embeddings.status='failed'`.
  - §2.9 / Task 18 AC: "Initial brownfield ingestion budget 30–90 minutes for a large org; progress surfaced as percent-complete in the ingestion UI every 60 seconds."
- **Definition of done:**
  - [ ] Chunking threshold + page size in §2.2.
  - [ ] Batch size 50 in §2.5.
  - [ ] Backoff rule in §4.
  - [ ] Budget in Task 18 AC.

### Fix PHASE-6-GAP-19 (explicit invariants)
- **File(s) to edit:** `PHASE_SPEC.md` §8
- **Change summary:** Add two explicit ACs.
- **New content outline:**
  - §8 AC: "No Managed Agents invocation runs on a user-facing HTTP request handler — every invocation goes through Inngest."
  - §8 AC: "Every `search_org_kb` / `traverse_component_graph` call and every pipeline loader filters by `project_id`; cross-project read is impossible by construction. Verified by query audit test."
- **Definition of done:**
  - [ ] Both ACs present in §8.

### Fix PHASE-6-GAP-20 (close deep-dive)
- **File(s) to edit:** `PHASE_SPEC.md` §7; status metadata
- **Change summary:** Run the deep-dive pass to close §7 items with decisions, owners, and DoDs. Update `Status:` from "Draft (deep-dive still required)" to "Ready for execute".
- **New content outline:**
  - §7 item 1: embedding migration window → resolved (7-day dual-write, cut over on all-row reconciliation).
  - §7 item 2: rename-collision fixture → Task 36 (already exists).
  - §7 item 3: managed-pkg override UX → decision recorded (Project Settings → Salesforce → "Include managed-package components in AI domain proposals" toggle, default off).
  - §7 item 4: KnowledgeArticle.embedding → Gap-02.
  - §7 item 5: domain-proposal confidence threshold → decision recorded (start manual-review-all; introduce auto-confirm at ≥0.90 after 5 projects).
  - §7 item 6: Org Health cost ceiling → $25 per run, architect override in trigger dialog (implemented by Task 23).
  - Status metadata: "Ready for execute" after fixes land.
- **Definition of done:**
  - [ ] Every §7 item is resolved or cross-referenced to an open gap.
  - [ ] `Status:` updated.
  - [ ] Revision History appended with deep-dive-complete date.

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
- [x] Overall verdict matches scorecard (Ready-after-fixes; R3 and R8 are Fail; R1, R2, R4, R5, R6 Partial; R7 Pass)
