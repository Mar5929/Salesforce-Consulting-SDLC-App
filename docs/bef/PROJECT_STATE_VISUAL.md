# Project State — Visual Companion

> Hand-maintained mirror of `PROJECT_STATE.md`. If anything here disagrees with `PROJECT_STATE.md`, that file wins. Update this file whenever phase status, current step, or next actions change.
>
> **Last synced:** 2026-04-14 — Wave 1 merged, Wave 2 (Phase 6, 3, 4) ready to dispatch.

---

## 1. Where we are in the overall pipeline

```mermaid
flowchart LR
    S1["Stage 1<br/>PRD<br/>Complete"]:::done
    S2["Stage 2<br/>Architecture<br/>Complete"]:::done
    S3["Stage 3<br/>Phase Plan<br/>Complete"]:::done
    S4["Stage 4<br/>Phase Deep Dive<br/>In Progress"]:::active
    S5["Stage 5<br/>Execute<br/>Blocked on Stage 4"]:::blocked

    S1 --> S2 --> S3 --> S4 --> S5

    classDef done fill:#2d6a4f,stroke:#081c15,color:#fff
    classDef active fill:#e9c46a,stroke:#6a4c00,color:#000
    classDef blocked fill:#adb5bd,stroke:#495057,color:#000
```

**Active step:** Step 3 — Gap-closure pass (Wave 2: Phase 6, 3, 4).

---

## 2. Phase dependency graph and status

```mermaid
flowchart TD
    P1["Phase 1<br/>RBAC / Security / Governance<br/>14/14 tasks done"]:::done
    P11["Phase 11<br/>AI Infrastructure Foundation<br/>Spec locked · Not started"]:::ready
    P10["Phase 10<br/>Work Tab UI Overhaul<br/>Spec locked · Not started"]:::ready
    P2["Phase 2<br/>Harness Hardening + Core Pipelines<br/>Spec locked · Not started"]:::ready
    P3["Phase 3<br/>Discovery, Questions<br/>Re-dive pending (Wave 2)"]:::wave2
    P4["Phase 4<br/>Work Management<br/>Re-dive pending (Wave 2)"]:::wave2
    P6["Phase 6<br/>Org / KB — Five-Layer Model<br/>Next up — Wave 2"]:::next
    P5["Phase 5<br/>Sprint, Developer API<br/>Blocked on 4 + 6"]:::blocked
    P7["Phase 7<br/>Dashboards, Search<br/>Blocked on 3/4/5/6"]:::blocked
    P8["Phase 8<br/>Documents, Notifications<br/>Blocked on 1/2/7"]:::blocked
    P9["Phase 9<br/>QA, Jira, Archival, Lifecycle<br/>Blocked on 1/4/8"]:::blocked

    P1 --> P11
    P1 --> P10
    P11 --> P2
    P2 --> P3
    P2 --> P4
    P3 --> P4
    P11 --> P6
    P2 --> P6
    P4 --> P5
    P6 --> P5
    P3 --> P7
    P4 --> P7
    P5 --> P7
    P6 --> P7
    P1 --> P8
    P2 --> P8
    P7 --> P8
    P1 --> P9
    P4 --> P9
    P8 --> P9

    classDef done fill:#2d6a4f,stroke:#081c15,color:#fff
    classDef ready fill:#52b788,stroke:#1b4332,color:#000
    classDef next fill:#f77f00,stroke:#6a3500,color:#fff
    classDef wave2 fill:#e9c46a,stroke:#6a4c00,color:#000
    classDef blocked fill:#adb5bd,stroke:#495057,color:#000
```

**Legend:**
- Done — tasks executed and merged
- Spec locked — deep-dive complete, ready to execute
- Next up — actively being worked
- Re-dive pending — spec needs updates before execute
- Blocked — waiting on upstream phase

---

## 3. Current focus — Wave 2 gap-closure

```mermaid
flowchart LR
    subgraph Wave2["Wave 2 — Gap-closure (active)"]
        direction TB
        W2A["Phase 6 re-dive<br/>(Five-Layer Org KB)<br/>Next"]:::next
        W2B["Phase 3 audit fixes<br/>Ready to dispatch"]:::ready
        W2C["Phase 4 audit fixes<br/>+ 6 SF dev guardrails<br/>Ready to dispatch"]:::ready
    end
    subgraph Wave3["Wave 3 — remaining audits"]
        direction TB
        W3A["Phase 5"]:::pending
        W3B["Phase 7"]:::pending
        W3C["Phase 8"]:::pending
        W3D["Phase 9"]:::pending
    end
    Wave2 --> Wave3

    classDef next fill:#f77f00,stroke:#6a3500,color:#fff
    classDef ready fill:#52b788,stroke:#1b4332,color:#000
    classDef pending fill:#adb5bd,stroke:#495057,color:#000
```

---

## 4. What's next (granular)

Mirrored from `PROJECT_STATE.md` → "What's next, in order". Update both files together.

1. **Phase 6 re-dive** (Five-Layer Org KB)
   - Blocker to resolve first: `KnowledgeArticle.embedding` migration path
   - Depends on: Phase 11 (done), Phase 2 (done)
2. **Phase 3 audit fixes** — dispatch fix agent (Wave 2)
3. **Phase 4 audit fixes** — dispatch fix agent (Wave 2)
   - Must include: 6 SF dev guardrails in story-generation prompts (GAP-WORK-006)
   - Blocks: Phase 5, Phase 6 from delivering full dev context
4. After Wave 2 merges → Wave 3 (Phases 5, 7, 8, 9)
5. After all audits closed → Stage 4 Step 4 (verification sweep) → Stage 5 execute

### Quick fixes (do anytime, ~5 min each)

- None currently. (See `PROJECT_STATE.md` → "Quick fixes" if this list drifts.)

### User decisions pending

- See `docs/bef/audits/2026-04-13/CROSS_PHASE_SUMMARY.md` → Wave 0 user-decision queue.

---

## 5. Bug tracker snapshot

| Metric | Value |
|---|---|
| Total bugs | 0 |
| Open | 0 |
| Active bug phase | None |

Full detail: `docs/bef/04-bugs/BUGS.md`.

---

## How to keep this file in sync

When you edit `PROJECT_STATE.md`, update these in this file:
1. **Last synced** date at the top.
2. Pipeline stage status (Section 1) if the active stage moved.
3. Phase graph classes (Section 2) if any phase status changed — edit the `:::class` suffix on the node.
4. Current focus (Section 3) if the active wave shifted.
5. "What's next" list (Section 4) to match `PROJECT_STATE.md`.
