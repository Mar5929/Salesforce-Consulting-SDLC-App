# Phase 6b Tasks: Org Health Assessment

> Parent Spec: [PHASE_SPEC.md](./PHASE_SPEC.md)
> Last Updated: 2026-04-14
> Status: Ready for execute

---

## Organization

Linear flow: schema → snapshot → analyzers → synthesis → trigger/UI → observability. Analyzers run in parallel inside Inngest; synthesis waits for all analyzers.

```
Task 1 (schema) → Task 2 (snapshot)
                       |
                       v
                 Task 3 (6 analyzers) → Task 4 (synthesis + Word)
                                             |
                                             v
                                        Task 5 (trigger + UI) → Task 6 (observability)
```

---

### Task 1: Schema — `org_health_reports` + `org_health_snapshots`

| Attribute | Details |
|---|---|
| **Scope** | Create both tables per spec §3.2 and §2.2. Prisma migration. |
| **Depends On** | Phase 6a (for referenced types) |
| **Complexity** | S |

**Acceptance:**
- [ ] `org_health_reports` created with all columns from spec §3.2.
- [ ] `org_health_snapshots` created keyed by `component_snapshot_id` with project scope.
- [ ] Prisma client regenerated.

---

### Task 2: Snapshot capture

| Attribute | Details |
|---|---|
| **Scope** | Implement `captureComponentSnapshot(projectId)` — writes an `org_health_snapshots` row capturing the active `component_ids` set at kickoff. Analyzers filter by membership. |
| **Depends On** | Task 1 |
| **Complexity** | S |

**Acceptance:**
- [ ] Snapshot captures only active components (`org_components.status = 'active'`).
- [ ] Function is idempotent per `run_id`.
- [ ] Unit test: sync run after snapshot does not change snapshot membership.

---

### Task 3: Six deterministic analyzers

| Attribute | Details |
|---|---|
| **Scope** | Implement test-coverage, governor-limits, sharing-model, fls-compliance, hardcoded-ids, unresolved-references in `src/lib/salesforce/health-analyzers/`. Each is a pure function returning structured findings. All analyzers filter by `component_snapshot_id`. Tech-debt analyzer cut per re-dive. |
| **Depends On** | Task 2, Phase 6a (edges + unresolved_references MV) |
| **Complexity** | XL |

**Acceptance:**
- [ ] All six analyzers implemented and return structured findings.
- [ ] Each analyzer has unit tests with fixture inputs.
- [ ] No AI calls inside analyzers.
- [ ] Analyzers read from snapshot, not live tables.
- [ ] Unresolved-references analyzer reads `unresolved_references` materialized view (ADD-4.7-10).
- [ ] FLS analyzer detects missing `Security.stripInaccessible` / `isAccessible()` / `isUpdateable()` checks.
- [ ] Hardcoded-ID regex matches 15/18-char alphanumeric literals inside Apex + Flow strings.
- [ ] Each analyzer tolerates per-item parse failures: log + skip + surface skipped count.

---

### Task 4: Managed Agent synthesis + Word output

| Attribute | Details |
|---|---|
| **Scope** | `synthesize-health-report.ts` agent task (Opus 4.6, `reason_deeply`). Takes analyzer outputs + org summary, emits narrative + remediation backlog. Generates Word document via Phase 8 pipeline. Writes `org_health_reports` row. |
| **Depends On** | Task 3, Phase 8 Word pipeline |
| **Complexity** | L |

**Acceptance:**
- [ ] Synthesis produces 800–1,500 word narrative and prioritized remediation backlog (structured array).
- [ ] Invocation dispatched through Inngest, never HTTP handler (ADD-4.8-03).
- [ ] Word document generated via Phase 8 `generateDocument({ template: 'org_health_report', data })` and stored in S3.
- [ ] `org_health_reports` row persisted with `summary_markdown`, `findings_jsonb`, `remediation_jsonb`, `word_document_s3_key`, duration.
- [ ] Synthesis timeout falls back gracefully: analyzer findings persisted, synthesis marked missing, SA notified.

---

### Task 5: Trigger action + cost ceiling + progress UI

| Attribute | Details |
|---|---|
| **Scope** | `src/actions/org-health.ts` trigger + status actions (SA only, `assertProjectWritable` at entry). Trigger dialog with cost ceiling input ($25 pre-filled). Progress page polling. Completion notification. |
| **Depends On** | Task 4, Phase 9 `assertProjectWritable` |
| **Complexity** | M |

**Acceptance:**
- [ ] Trigger restricted to SA role; `assertProjectWritable` called.
- [ ] Cost ceiling input defaults to `$25`, accepts architect override.
- [ ] Overrun hard-stops, persists partial findings, sets `org_health_reports.status = 'partial'`.
- [ ] Progress UI polls every 1s with 60s timeout backoff; shows per-analyzer + synthesis step status.
- [ ] Completion notification emitted (marked partial when applicable).
- [ ] Report detail page links to Word document.

---

### Task 6: Cost tracking for Managed Agent runs

| Attribute | Details |
|---|---|
| **Scope** | Health synthesis writes `pipeline_runs` + `pipeline_stage_runs` entries with token usage, dollar cost, duration. Aggregated into Phase 7 Usage & Costs tab. |
| **Depends On** | Task 4 |
| **Complexity** | S |

**Acceptance:**
- [ ] Every run produces observability rows.
- [ ] Cost visible in Phase 7 Usage & Costs tab.

---

## Summary

| # | Title | Depends On | Complexity |
|---|---|---|---|
| 1 | Schema — `org_health_reports` + `org_health_snapshots` | Phase 6a | S |
| 2 | Snapshot capture | 1 | S |
| 3 | Six deterministic analyzers | 2, Phase 6a | XL |
| 4 | Managed Agent synthesis + Word output | 3, Phase 8 | L |
| 5 | Trigger + cost ceiling + progress UI | 4, Phase 9 | M |
| 6 | Cost tracking for Managed Agent runs | 4 | S |
