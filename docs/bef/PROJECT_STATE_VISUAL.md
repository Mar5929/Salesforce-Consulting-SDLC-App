# Project State — Visual Companion

> Hand-maintained mirror of `PROJECT_STATE.md`. If anything here disagrees with `PROJECT_STATE.md`, that file wins. Update this file whenever phase status, current step, or next actions change.
>
> **Last synced:** 2026-04-14 — Waves 1 + 2 merged (Phases 11, 2, 3, 4, 6 audit fixes). Wave 3 (Phase 5, 7, 8, 9, 10) ready to dispatch. Phase 6 re-dive still pending (Step 3 deep-dive, separate from Step 3b audit).

---

## 1. Where we are in the overall pipeline

```mermaid
flowchart LR
    S1["Stage 1<br/>PRD<br/>Complete"]:::done
    S2["Stage 2<br/>Architecture<br/>Complete"]:::done
    S3["Stage 3<br/>Phase Plan<br/>Complete"]:::done
    S4["Stage 4<br/>Phase Deep Dive<br/>In Progress (active)"]:::active
    S5["Stage 5<br/>Execute<br/>Blocked on Stage 4"]:::blocked

    S1 --> S2 --> S3 --> S4 --> S5

    classDef done fill:#2d6a4f,stroke:#081c15,color:#fff
    classDef active fill:#e9c46a,stroke:#6a4c00,color:#000
    classDef blocked fill:#adb5bd,stroke:#495057,color:#000
```

### Stage 4 breakdown (active stage)

```mermaid
flowchart TD
    subgraph S4["Stage 4 — Phase Deep Dive"]
        direction TB
        Step3["Step 3: Deep-dive sessions<br/>2/3 done"]:::partial
        Step3b["Step 3b: PRD audit + gap closure<br/>Wave 1 merged · Wave 2 active"]:::partial
        Step4a["Step 4a: Initial verifier sweep<br/>Done (2026-04-13, verdict PROCEED)"]:::done
        Step4b["Step 4b: Post-gap-closure verifier sweep<br/>Pending (after Wave 2/3)"]:::blocked

        Step3 --> Step3b --> Step4b
        Step4a -.->|superseded by| Step4b
    end

    classDef done fill:#2d6a4f,stroke:#081c15,color:#fff
    classDef partial fill:#e9c46a,stroke:#6a4c00,color:#000
    classDef blocked fill:#adb5bd,stroke:#495057,color:#000
```

**Active step:** Step 3 (Phase 6 re-dive, next) + Step 3b (Wave 2 audit fixes, ready to dispatch). Phase 1 previously executed in Stage 5 before the Addendum replan; no other Stage 5 work is active.

---

## 2. Phase dependency graph and status

```mermaid
flowchart TD
    P1["Phase 1<br/>RBAC / Security / Governance<br/>14/14 tasks done"]:::done
    P11["Phase 11<br/>AI Infrastructure Foundation<br/>Spec locked · Not started"]:::ready
    P10["Phase 10<br/>Work Tab UI Overhaul<br/>Wave 3 audit pending · Not started"]:::wave3
    P2["Phase 2<br/>Harness Hardening + Core Pipelines<br/>Spec locked · Not started"]:::ready
    P3["Phase 3<br/>Discovery, Questions<br/>Audit fixes merged · Not started"]:::ready
    P4["Phase 4<br/>Work Management<br/>Audit fixes merged · Not started"]:::ready
    P6["Phase 6<br/>Org / KB — Five-Layer Model<br/>Audit fixes merged · Re-dive pending"]:::wave2
    P5["Phase 5<br/>Sprint, Developer API<br/>Wave 3 audit pending · Blocked on 4 + 6"]:::wave3
    P7["Phase 7<br/>Dashboards, Search<br/>Wave 3 audit pending · Blocked on 3/4/5/6"]:::wave3
    P8["Phase 8<br/>Documents, Notifications<br/>Wave 3 audit pending · Blocked on 1/2/7"]:::wave3
    P9["Phase 9<br/>QA, Jira, Archival, Lifecycle<br/>Wave 3 audit pending · Blocked on 1/4/8"]:::wave3

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
    classDef wave3 fill:#adb5bd,stroke:#495057,color:#000
    classDef blocked fill:#adb5bd,stroke:#495057,color:#000
```

**Legend:**
- Done — tasks executed and merged
- Spec locked / audit fixes merged — ready to execute pending final verifier sweep
- Re-dive pending — Phase 6 still needs Step 3 deep-dive (separate from Step 3b audit)
- Wave 3 audit pending — gap-closure fixes not yet dispatched
- Blocked — waiting on upstream phase

---

## 3. Current focus — Wave 3 gap-closure

```mermaid
flowchart LR
    subgraph Done["Waves 1 + 2 — Merged (2026-04-14)"]
        direction TB
        W1A["Phase 11 audit fixes<br/>13 gaps"]:::done
        W1B["Phase 2 audit fixes<br/>18 gaps"]:::done
        W2A["Phase 3 audit fixes<br/>15 gaps"]:::done
        W2B["Phase 4 audit fixes<br/>13 gaps · 6 SF dev guardrails"]:::done
        W2C["Phase 6 audit fixes<br/>20 gaps"]:::done
    end
    subgraph Wave3["Wave 3 — Ready to dispatch"]
        direction TB
        W3A["Phase 5"]:::next
        W3B["Phase 7"]:::next
        W3C["Phase 8"]:::next
        W3D["Phase 9"]:::next
        W3E["Phase 10"]:::next
    end
    subgraph Deepdive["Outstanding deep-dive"]
        direction TB
        D1["Phase 6 re-dive<br/>(Step 3, not Step 3b)<br/>Blocker: KA.embedding path"]:::next
    end
    Done --> Wave3
    Done --> Deepdive

    classDef done fill:#2d6a4f,stroke:#081c15,color:#fff
    classDef next fill:#f77f00,stroke:#6a3500,color:#fff
```

---

## 4. What's next (granular)

Mirrored from `PROJECT_STATE.md` → "What's next, in order". Update both files together.

1. **Phase 6 re-dive** (Five-Layer Org KB) — Step 3 deep-dive (distinct from the Wave 2 audit fix already merged)
   - Blocker to resolve first: `KnowledgeArticle.embedding` migration path
   - Depends on: Phase 11 (done), Phase 2 (done)
2. **Wave 3 audit fixes** — dispatch fix agents for Phases 5, 7, 8, 9, 10
3. After Wave 3 merges → Step 4b: post-gap-closure verifier sweep
4. After verifier PROCEED → Stage 5 execute (wave-based)

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
