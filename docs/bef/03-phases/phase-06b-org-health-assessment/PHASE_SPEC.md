# Phase 6b Spec: Org Health Assessment

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Source: Split out from Phase 6 during the 2026-04-14 re-dive. Pre-split scope lived in `phase-06-org-knowledge/PHASE_SPEC.md` §2.15 (see git history).
> Depends On: Phase 6a (sync reconciliation, `component_edges`, `unresolved_references` materialized view, `component_history`), Phase 8 (Word document pipeline), Phase 9 (`assertProjectWritable` helper per DECISION-10)
> Unlocks: None (terminal diagnostic deliverable)
> Complexity: M
> Status: Ready for execute
> Last Updated: 2026-04-14

---

## 0. Split Rationale

Phase 6 was previously XL (34 tasks) and bundled the five-layer org KB model with the Org Health Assessment diagnostic. The 2026-04-14 re-dive split Org Health into Phase 6b because:

1. Zero downstream consumers: no other phase references `org_health_reports` or the Word output.
2. Dependency shift: Org Health needs the Phase 8 document pipeline (Word gen). 6a does not.
3. Parallelism: 6b can run alongside Phase 7 or Phase 9, shortening the 6 → 5 → 7 critical path.
4. Scope separability: analyzers are pure deterministic functions; the Managed Agent synthesis is a single task. Coherent as a standalone phase.

Cost ceiling defaults and trigger UX are preserved from the pre-split spec.

---

## 1. Scope Summary

Long-running diagnostic for rescue / takeover engagements. Architect triggers a run from project settings (SA role only). Six deterministic analyzers read Salesforce metadata and static analysis, Claude Managed Agents (Opus 4.6, `reason_deeply`) synthesize findings into a narrative + prioritized remediation backlog, and a Word document is produced via the Phase 8 pipeline.

**Duration:** 30 minutes – 2 hours.
**Engine:** Inngest step function per analyzer + Managed Agents synthesis at the end.
**Output:** `org_health_reports` record + Word document in S3 + completion notification.

---

## 2. Functional Requirements

### 2.1 Trigger and Progress UI

- SA-only trigger on `Project Settings → Org Health`. Cost ceiling input defaults to `$25`; architect may override before kickoff.
- Progress UI shows per-analyzer status and Managed Agents synthesis step with 1-second polling, 60-second timeout backoff.
- Completion emits a notification to the triggering SA.
- All mutation entry points call `assertProjectWritable(projectId)` (DECISION-10).

### 2.2 Snapshot Isolation (new, re-dive addition)

The run opens with a `component_snapshot_id` recorded in `org_health_reports`. All analyzers read from this snapshot (frozen view of `org_components`, `component_edges`, `component_embeddings`, `unresolved_references` at kickoff). Sync runs that fire mid-assessment do not alter in-flight analyzer output.

Implementation: snapshot table stores `(snapshot_id, project_id, created_at, component_ids jsonb)` capturing the active component-ID set at kickoff. Analyzers filter by membership. No deep clone required.

### 2.3 Six Deterministic Analyzers (re-dive: tech-debt analyzer cut)

Pure functions over fetched org data and Phase 6a tables. No AI calls.

| # | Analyzer | Inputs | Findings |
|---|---|---|---|
| 1 | Test coverage | Apex class + test metadata | Per-class coverage + aggregate; severity = err when < 75%, warn when < 90%. |
| 2 | Governor-limit risk | Apex bodies | SOQL/DML in loops, nested loops, SOQL without LIMIT on large-data queries. |
| 3 | Sharing-model review | OWD settings, role hierarchy, sharing rules | Depth > 10, orgs with public R/W on sensitive objects, missing sharing rules. |
| 4 | FLS / CRUD compliance | Apex SOQL + DML statements | Missing `Security.stripInaccessible` / `Schema.sObjectType.X.isAccessible()` checks. |
| 5 | Hardcoded IDs | Apex + Flow static strings | Matches `/^[a-zA-Z0-9]{15,18}$/` literal in code. |
| 6 | Unresolved references | `unresolved_references` materialized view from Phase 6a | Dynamic SOQL, dynamic Apex method invocations, metadata API refs; severity info\|warn by count. |

**Cut from pre-split spec:** tech-debt inventory analyzer (deprecated API versions, disabled validation rules, orphan workflows, TODO/FIXME comments). Signal was soft and the Managed Agent synthesis cost for digesting it was disproportionate. Revisit in a later release if users ask for it.

### 2.4 Managed Agent Synthesis

`src/lib/agent-harness/tasks/synthesize-health-report.ts` — Managed Agent (Opus 4.6, `reason_deeply`) takes the six analyzer outputs plus org summary stats and emits:

- Narrative executive summary (800–1,500 words markdown).
- Prioritized remediation backlog: array of `{ title, severity, rationale, estimated_effort, related_findings[] }`.
- Risk scorecard (optional): top 3 risks with one-line rationale.

All invocations dispatched via Inngest (never on HTTP request path, ADD-4.8-03).

### 2.5 Cost Ceiling and Hard Stop

- Default: `$25` per run, tracked in `pipeline_runs` + `pipeline_stage_runs`.
- Architect override via trigger dialog input field.
- Overrun → hard-stop immediately, persist partial findings + partial backlog, `org_health_reports.status = 'partial'`, completion notification flagged as partial.

### 2.6 Word Document Output

- Generated via Phase 8 document pipeline (`generateDocument({ template: 'org_health_report', data })`).
- Stored in S3 under project scope.
- Linked from the Org Health report detail page.

---

## 3. Technical Approach

### 3.1 Module Structure

```
src/lib/salesforce/health-analyzers/
  test-coverage.ts
  governor-limits.ts
  sharing-model.ts
  fls-compliance.ts
  hardcoded-ids.ts
  unresolved-references.ts

src/lib/agent-harness/tasks/
  synthesize-health-report.ts

src/lib/inngest/functions/
  org-health-assessment.ts       -- Inngest step function; one step per analyzer, final synthesis step

src/actions/
  org-health.ts                  -- trigger + status + cost override (assertProjectWritable at entry)

src/app/(dashboard)/projects/[projectId]/settings/org/health/
  page.tsx                       -- trigger + progress UI
  [runId]/page.tsx               -- report detail view
```

### 3.2 Schema

One new table owned by 6b:

```
org_health_reports (
  id                    uuid PRIMARY KEY,
  project_id            uuid NOT NULL REFERENCES projects(id),
  triggered_by_user_id  uuid NOT NULL,
  component_snapshot_id uuid NOT NULL,
  status                text NOT NULL,  -- queued | running | completed | partial | failed
  cost_ceiling_usd      numeric(10,2) NOT NULL,
  cost_actual_usd       numeric(10,2),
  duration_seconds      int,
  summary_markdown      text,
  findings_jsonb        jsonb,
  remediation_jsonb     jsonb,
  word_document_s3_key  text,
  started_at            timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz
)
```

Plus a lightweight `org_health_snapshots` table keyed by `component_snapshot_id`.

### 3.3 API Contracts

```
POST /api/actions/org-health/run
Body:     { projectId: string, costCeilingUsd?: number }
Response: { runId: string, status: "queued" }

GET /api/actions/org-health/status/:runId
Response: { runId, status, progress: { step: string, percent: number }, cost_actual_usd }
```

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|---|---|
| Sync runs mid-assessment | Snapshot isolation ensures analyzer output is stable. |
| Managed Agent synthesis timeout | Persist analyzer findings; mark synthesis as missing; notify SA. |
| Cost ceiling exceeded mid-run | Hard-stop, `status = partial`, persist what we have, notify. |
| Analyzer throws on one Apex class | Log + skip class; continue aggregate. Include skipped-items count in findings. |
| Phase 8 Word generation fails | Retain `org_health_reports` row; mark `word_document_s3_key = null` + note in UI; retry via action. |
| Project archived mid-run | `assertProjectWritable` trips at status poll; run terminates, marks `failed`. |
| Unresolved references MV not refreshed | Analyzer emits zero findings + info-level "index not current" note. |

---

## 5. Integration Points

**Depends On:**
- **Phase 6a:** `component_edges`, `unresolved_references` MV, `component_history`, `org_components` with sync reconciliation.
- **Phase 8:** `generateDocument({ template: 'org_health_report', data })`.
- **Phase 9:** `assertProjectWritable(projectId)` at every mutation entry point.

**Unlocks:** None.

---

## 6. Schema Migration Work

- Create `org_health_reports` (§3.2).
- Create `org_health_snapshots` (lightweight).
- No data migration required; table is greenfield.

---

## 7. Outstanding for Deep-Dive

None. Scope lifted intact from Phase 6 §2.15, minus the cut tech-debt analyzer, plus the snapshot-isolation addition from the re-dive.

---

## 8. Acceptance Criteria

Trigger + UX:
- [ ] SA-only trigger action (`assertProjectWritable` enforced at entry).
- [ ] Trigger dialog shows cost ceiling input, default `$25` pre-filled.
- [ ] Progress UI polls every 1s with 60s timeout backoff; shows per-analyzer + synthesis step status.
- [ ] Completion notification emitted (marked partial when applicable).

Analyzers:
- [ ] Six deterministic analyzers land (test coverage, governor, sharing, FLS, hardcoded IDs, unresolved references).
- [ ] Each analyzer is a pure function with unit-tested sample fixtures.
- [ ] Analyzers read from `component_snapshot_id`, not live tables.
- [ ] Unresolved-references analyzer reads the `unresolved_references` MV (ADD-4.7-10).

Synthesis and output:
- [ ] Managed Agent produces narrative + remediation backlog (Opus 4.6, `reason_deeply`).
- [ ] Invocation dispatched through Inngest, never HTTP handler (ADD-4.8-03).
- [ ] Word document generated via Phase 8 pipeline and stored in S3.
- [ ] `org_health_reports` row persisted with all fields populated (or partial + flagged).

Cost + snapshot:
- [ ] Cost ceiling ($25 default, architect-override) enforced; overrun hard-stops with `status = partial` + partial findings persisted.
- [ ] `component_snapshot_id` captured at kickoff; all analyzers filter by snapshot membership.
- [ ] `pipeline_runs` + `pipeline_stage_runs` rows written with token usage, dollar cost, duration.

Non-regression:
- [ ] Does not alter any Phase 6a path.
- [ ] Archived projects cannot trigger runs.

---

## 9. Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-14 | Phase 6b created by splitting Org Health Assessment out of Phase 6. Added snapshot-isolation and dropped tech-debt analyzer. | Re-dive decision: zero downstream consumers, dependency on Phase 8, parallelism with Phase 7/9. Tech-debt analyzer cut for signal-to-cost reasons. |
