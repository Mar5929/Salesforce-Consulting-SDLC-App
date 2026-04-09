# Bug Execution Plan

Generated: 2026-04-08
Source: `.planning/bugs/`
Total Bugs: 14
Phases: 5

---

## Severity Reclassifications

| Bug ID | Original | Final | Reason |
|--------|----------|-------|--------|
| BUG-034 | MEDIUM | LOW | No functionality is broken — content simply hasn't been built yet. Missing feature, not a regression. |
| BUG-035 | HIGH | CRITICAL | Chat is the primary AI surface. Stale sidebar navigation breaks the core discovery loop. |
| BUG-036 | MEDIUM | LOW | Archiving is pure housekeeping. No delivery workflow depends on it. |
| BUG-037 | HIGH | CRITICAL | A chat window that expands the page height makes every substantive AI session unusable. CSS-only fix makes it the cheapest CRITICAL in the batch. |
| BUG-039 | MEDIUM | LOW | UX clarity issue on a page that otherwise functions. No workflow blocked. |
| BUG-040 | HIGH | CRITICAL | Generate Stories is a headline delivery accelerator feature. 100% non-functional due to Prisma error. Trivial fix once BUG-045 is done. |
| BUG-041 | MEDIUM | LOW | Status can be changed through other means. DnD is a convenience interaction, not a required path. |
| BUG-043 | MEDIUM | HIGH | A work management tool where items cannot be edited is semantically broken. Users expect edit capability. |
| BUG-044 | HIGH | MEDIUM | Individual status changes work; bulk is a convenience shortcut. Original HIGH overstates user impact. |
| BUG-045 | HIGH | CRITICAL | Root cause blocker for four other bugs. Single trivial fix with outsized leverage. |

Unchanged: BUG-038 (HIGH), BUG-042 (LOW), BUG-046 (MEDIUM), BUG-047 (HIGH)

---

## Phase 1: Eliminate the Root Cause [COMPLETED - 2026-04-08]

**Goal:** Fix BUG-045 (Prisma client sync) — a single trivial fix that unblocks BUG-035, BUG-036, BUG-040, and BUG-038. Fix BUG-037 in parallel since it has zero dependencies and is a pure CSS change.

**Complexity:** Trivial to Simple

**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|----------------|------------|-------|
| BUG-045 | Analysis tab Prisma error — isArchived unknown | CRITICAL | Trivial | `prisma generate` + migrate. Must complete before Phase 2 begins. |
| BUG-037 | Chat window has no scroll — expands entire page height | CRITICAL | Simple | Pure CSS/layout fix. No deps, no conflicts. Safe to fix in parallel. |

**Risks:** BUG-045 migration must be applied to the Neon database, not just regenerated locally. If the schema change requires a destructive migration, confirm before running against production. BUG-037 CSS fix should be scoped carefully — chat container height constraints can affect other layout elements.

**Verification:**
- BUG-045: Analysis tab loads without Prisma error. `prisma generate` produces no type errors. `npx tsc --noEmit` passes.
- BUG-037: Open a conversation with 20+ messages. Chat content scrolls within a fixed-height container. Page height does not expand with message count.

**Estimated scope:** 1-3 files, ~1-2 hours

---

## Phase 2: Restore Core Chat and AI Session Functionality [COMPLETED - 2026-04-08]

**Goal:** With BUG-045 resolved, fix the chat sidebar staleness (BUG-035) and the broken Generate Stories feature (BUG-040). Fix BUG-047 in parallel — task assignment is a HIGH severity gap with no conflicts.

**Complexity:** Simple to Moderate

**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|----------------|------------|-------|
| BUG-035 | Chat tab shows stale conversation, new chats missing | CRITICAL | Simple | Depends on BUG-045. Conflicts with BUG-036 — do NOT fix BUG-036 in this phase. |
| BUG-040 | Generate Stories throws Prisma error | CRITICAL | Trivial | Depends on BUG-045. Conflicts with BUG-038 — do NOT fix BUG-038 in this phase. |
| BUG-047 | Assigned To dropdown shows no members or raw IDs | HIGH | Simple-Moderate | Independent. No conflicts in this phase. |

**Risks:** BUG-035 and BUG-036 are in conflicting files — fixing BUG-035 here means BUG-036 must wait for Phase 3. Same for BUG-040/BUG-038. Do not allow scope creep.

**Verification:**
- BUG-035: Create a new chat session. Sidebar updates immediately without page refresh.
- BUG-040: Trigger Generate Stories from an epic. Session created successfully, no Prisma error.
- BUG-047: Open assignment form. Dropdown shows real member names. Selection saves correctly.

**Estimated scope:** 3-5 files, ~2-4 hours

---

## Phase 3: Complete Chat Workflows, Enable Sessions, Feature Editability [COMPLETED - 2026-04-08]

**Goal:** Fix the dependents: BUG-036 (archive), BUG-038 (session types). Also fix BUG-043 (feature editing — HIGH, independent) and BUG-046 (picklist labels — MEDIUM, independent).

**Complexity:** Simple to Moderate

**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|----------------|------------|-------|
| BUG-036 | Archive button on conversations may not work | LOW | Simple | Depends on BUG-045 + BUG-035 (both resolved). |
| BUG-038 | New Session type buttons do nothing on click | HIGH | Moderate | Depends on BUG-045 + BUG-040 (both resolved). Requires entity selection UI. |
| BUG-043 | Feature details not editable — no edit UI | HIGH | Moderate | Independent. New `updateFeature` server action + form needed. Conflicts with BUG-042/039 — do NOT fix those this phase. |
| BUG-046 | Picklist dropdowns show raw API values | MEDIUM | Simple | Cross-cutting but mechanical. BUG-047 already resolved, no conflicts. |

**Risks:** BUG-038 requires building entity selection UI — most complex fix in this phase. Confirm expected UX before building. BUG-043 needs a new server action with `next-safe-action` + Zod validation per project conventions.

**Verification:**
- BUG-036: Archive a conversation. Toast appears. Conversation removed from active list.
- BUG-038: Click each session type button. Each opens correct creation flow. Session appears in sidebar.
- BUG-043: Open feature detail. Edit fields. Save persists correctly.
- BUG-046: All dropdowns show human-readable labels, not raw enum values.

**Estimated scope:** 8-12 files, ~4-6 hours

---

## Phase 4: Work Management Quality Fixes

**Goal:** Address remaining work management gaps: bulk status change and sparse detail pages.

**Complexity:** Moderate

**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|----------------|------------|-------|
| BUG-044 | Bulk status change operations do nothing | MEDIUM | Moderate | May need new server action or batch API pattern. Conflicts with BUG-041 — hold BUG-041 to Phase 5. |
| BUG-042 | Feature/Story detail pages too basic — missing fields | LOW | Simple | Conflict with BUG-043 resolved. Add more schema fields to detail pages. |

**Risks:** BUG-044 scope ambiguity — confirm which entity types support bulk actions (stories? features? both?).

**Verification:**
- BUG-044: Select multiple items. Apply bulk status change. All items reflect new status.
- BUG-042: Detail pages display additional context fields without regression.

**Estimated scope:** 4-6 files, ~3-5 hours

---

## Phase 5: Low-Priority Polish and Missing Features

**Goal:** Close out remaining LOW severity items — DnD, visual hierarchy, and Projects tab content.

**Complexity:** Simple to Moderate

**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|----------------|------------|-------|
| BUG-041 | Kanban DnD doesn't work for features/epics | LOW | Moderate | New DnD handlers + `updateFeatureStatus`/`updateEpicStatus` server actions. |
| BUG-039 | Work tab UI clunky — hard to tell epics from features | LOW | Simple-Moderate | Visual hierarchy: breadcrumbs, labels, icons. |
| BUG-034 | Projects tab shows no content — only project name | LOW | Moderate | Missing feature build. Scope against PRD before implementing. |

**Risks:** BUG-034 is a feature build, not a bug fix — scope needs PRD-based definition. BUG-041 DnD requires careful testing for optimistic UI state consistency.

**Verification:**
- BUG-041: Drag epic/feature cards to new status columns. Status persists on refresh.
- BUG-039: Work tab visually distinguishes epics, features, and stories at a glance.
- BUG-034: Projects tab shows meaningful overview content.

**Estimated scope:** 6-10 files, ~4-8 hours

---

## Dependency Graph

```
BUG-045 (CRITICAL — root cause, Phase 1)
  ├── BUG-035 (Phase 2) ──► BUG-036 (Phase 3)
  └── BUG-040 (Phase 2) ──► BUG-038 (Phase 3)

BUG-037 (CRITICAL — independent, Phase 1, pure CSS)

BUG-047 (HIGH — independent, Phase 2)
BUG-043 (HIGH — independent, Phase 3)
BUG-046 (MEDIUM — independent, Phase 3)

BUG-044 (MEDIUM — Phase 4)
BUG-042 (LOW — Phase 4)

BUG-041 (LOW — Phase 5, after BUG-044 conflict resolved)
BUG-039 (LOW — Phase 5, after BUG-043 conflict resolved)
BUG-034 (LOW — Phase 5, isolated feature work)
```

---

## Summary

| Phase | Goal | Bugs (parallel) | Key Dependency |
|-------|------|------------------|----------------|
| **Phase 1** | Eliminate root cause | BUG-045, BUG-037 | None — start immediately |
| **Phase 2** | Restore core AI and work features | BUG-035, BUG-040, BUG-047 | Phase 1 complete |
| **Phase 3** | Complete chat workflows, editability, labels | BUG-036, BUG-038, BUG-043, BUG-046 | Phase 2 complete |
| **Phase 4** | Work management quality | BUG-044, BUG-042 | Phase 3 complete |
| **Phase 5** | Polish and missing features | BUG-041, BUG-039, BUG-034 | Phase 4 complete |

- **Total phases:** 5
- **Max parallel developer slots:** 4 (Phase 3)
- **CRITICALs resolved by end of Phase 2:** BUG-045, BUG-037, BUG-035, BUG-040
- **HIGHs resolved by end of Phase 3:** BUG-047, BUG-038, BUG-043
- **Single biggest leverage fix:** BUG-045 — one trivial Prisma regenerate unblocks four other bugs
- **Scope flag:** BUG-034 (Phase 5) needs PRD-based scoping before implementation begins
