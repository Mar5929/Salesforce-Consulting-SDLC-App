# Bug Execution Plan

Generated: 2026-04-07
Source: .planning/bugs/
Total Bugs: 29 (BUG-004 through BUG-032, excluding fixed BUG-001/002/003)
Phases: 7

## Severity Reclassifications

| Bug ID | Original | Final | Reason |
|--------|----------|-------|--------|
| BUG-007 | HIGH | CRITICAL | Invisible "Add Question" button blocks the primary discovery workflow entirely |
| BUG-014 | HIGH | CRITICAL | PM Dashboard never reflects story progress — business-critical for project management |
| BUG-024 | MEDIUM | CRITICAL | Entire QA tab is a dead end with no create action — QA workflow completely non-functional |
| BUG-017 | MEDIUM | HIGH | Stale knowledge article summaries undermine the "progressively smarter AI brain" value proposition |
| BUG-018 | MEDIUM | HIGH | Sprint assignment from backlog page is completely broken — core PM workflow |
| BUG-019 | MEDIUM | HIGH | SPRINT_PLANNED allowing impossible transitions causes silent data corruption |
| BUG-025 | MEDIUM | HIGH | Revisited story sessions completely broken — violates session continuity core value prop |
| BUG-027 | LOW | HIGH | Mislabeled bulk action confirms ALL records — data integrity issue |
| BUG-006 | HIGH | MEDIUM | Fragile title match works on happy path — latent risk, not active breakage |
| BUG-013 | HIGH | MEDIUM | One-time setup issue during deployment; once configured, never recurs |
| BUG-009 | HIGH | LOW | Cosmetic — checkbox functions correctly, only visual state is wrong |
| BUG-010 | HIGH | MEDIUM | Server guard prevents unauthorized moves; this is a UX gap, not security hole |
| BUG-016 | MEDIUM | LOW | Internal tool, project membership already validated at route level |
| BUG-022 | MEDIUM | LOW | Server guard works, only SA role would realistically attempt this action |
| BUG-032 | MEDIUM | LOW | Pure UX polish for single-project workflow |

## Phase 1: Quick Wins — Unblock Core Workflows [COMPLETED - 2026-04-07]
**Goal:** Fix trivial/simple bugs that unblock the most user-facing functionality with zero risk. All independent, no file conflicts.
**Complexity:** Low
**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|---------------|------------|-------|
| BUG-014 | updateStoryStatus doesn't fire PROJECT_STATE_CHANGED | CRITICAL | Trivial | Add one event emission line. Unblocks PM Dashboard accuracy. |
| BUG-007 | QuestionForm DialogTrigger renders empty button | CRITICAL | Simple | Fix render prop to include button label. Unblocks discovery workflow. |
| BUG-004 | Sidebar badge counts ANSWERED instead of needsReview | HIGH | Trivial | Change filter predicate in sidebar query. |
| BUG-011 | Archive redirect goes to /projects which doesn't exist | HIGH | Trivial | Change redirect path from /projects to /. |
| BUG-005 | Project creator member record has blank displayName/email | HIGH | Simple | Fetch Clerk user profile before creating member record. |

**Risks:** Minimal — all are isolated, single-file changes.
**Verification:** Sidebar badges show correct counts; "Add Question" button visible and functional; PM Dashboard updates after story status change; archive redirect lands on dashboard; project creator shows name/email in team views.
**Estimated scope:** ~5 files, 1-5 lines each.

## Phase 2: Data Integrity and Sprint Fixes [COMPLETED - 2026-04-07]
**Goal:** Fix data corruption risks and broken sprint/backlog workflows. Schema migration chain starts here.
**Complexity:** Medium
**Depends on:** Phase 1
**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|---------------|------------|-------|
| BUG-006 | Transcript-conversation linked by fragile title match | MEDIUM | Moderate | Add transcriptId FK to Conversation. Starts schema migration chain. |
| BUG-019 | Sprint board SPRINT_PLANNED creates impossible transitions | HIGH | Moderate | Fix column mapping and state transitions. Must complete before BUG-010. |
| BUG-018 | Backlog page never passes sprints to StoryTable | HIGH | Simple | Thread sprints prop from server component to StoryTable. |
| BUG-012 | Jira field customfield_story_points is invalid | HIGH | Simple | Fix Jira field name or make configurable. |
| BUG-013 | SF_TOKEN_ENCRYPTION_KEY undocumented — crypto crash | MEDIUM | Simple | Add to .env.example, validate in env schema. |

**Risks:** BUG-006 schema migration needs careful testing. BUG-019 state transition changes need validation against all existing sprint states.
**Verification:** Transcript detail pages load via FK; backlog shows sprint assignment dropdown; sprint board rejects impossible transitions; Jira sync maps story points correctly; graceful error when SF_TOKEN_ENCRYPTION_KEY missing.
**Estimated scope:** ~8-10 files. BUG-006 includes Prisma schema + migration + query updates.

## Phase 3: Knowledge, Sessions, and QA Workflow [COMPLETED - 2026-04-07]
**Goal:** Fix broken knowledge updates, restore story session continuity, and unblock the QA workflow. Continues schema migration chain.
**Complexity:** Medium-High
**Depends on:** Phase 2 (BUG-006 schema migration must be complete for BUG-025)
**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|---------------|------------|-------|
| BUG-024 | No UI to create test cases — QA tab dead end | CRITICAL | Moderate | Build TestCaseCreateForm component. New UI needed. |
| BUG-025 | Revisited STORY_SESSION conversations broken | HIGH | Moderate | Add metadata JSON to Conversation model. Continues schema chain. |
| BUG-017 | Knowledge article summary never updated during refresh | HIGH | Moderate | Update AI prompt and Prisma update to include summary. |
| BUG-027 | bulkConfirmHighConfidence confirms ALL records | HIGH | Moderate | Add confidence column, filter by threshold. Continues schema chain. |
| BUG-030 | Document detail nests anchor inside button | LOW | Trivial | Use asChild prop on Button. Quick parallel win. |

**Risks:** BUG-024 largest scope (new component). BUG-025 depends on BUG-006 migration stability. BUG-027 needs careful WHERE clause.
**Verification:** QA tab has functional create form; revisited story sessions load with full context; article refresh updates summaries; bulk confirm only affects high-confidence records; document download button is valid HTML.
**Estimated scope:** ~12-15 files.

## Phase 4: Sprint Board UX and Chat Fixes [COMPLETED - 2026-04-07]
**Goal:** Fix sprint board drag-and-drop UX and transcript chat rendering. Depends on Phase 2-3 fixes.
**Complexity:** Medium-High
**Depends on:** Phase 2 (BUG-019 for sprint board), Phase 2-3 (BUG-006, BUG-025 for chat)
**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|---------------|------------|-------|
| BUG-010 | Sprint board drag-and-drop has no role awareness | MEDIUM | Moderate | Add role check to drag handlers. Depends on BUG-019 (same file). |
| BUG-008 | TRANSCRIPT_SESSION conversations render wrong UI | HIGH | Complex | Fix conversation type routing. Depends on BUG-006 transcript link. |
| BUG-015 | Role-based nav has no restrictions on Phase 2+ features | MEDIUM | Moderate | Add phase gating and role arrays to nav items. |
| BUG-016 | Transcript messages API doesn't validate ownership | LOW | Simple | Add ownership check. Better with BUG-006 FK. |

**Risks:** BUG-008 is complex — may touch multiple chat components. BUG-010 UX changes must not break existing drag functionality.
**Verification:** Non-authorized roles see disabled drag handles; transcript sessions render extraction results (not chat UI); nav hides unauthorized features; transcript API rejects cross-conversation requests.
**Estimated scope:** ~8-10 files.

## Phase 5: Org Analysis and Pipeline Fixes [COMPLETED - 2026-04-08]
**Goal:** Fix Salesforce org analysis workflow — connection status, pipeline UI, and role gating.
**Complexity:** Medium
**Depends on:** Phase 3 (BUG-027 schema migration for BUG-021)
**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|---------------|------------|-------|
| BUG-021 | Brownfield pipeline stepper never shows running state | MEDIUM | Complex | Add ingestion run tracking. Concludes schema migration chain. |
| BUG-020 | Org connection isSyncing always false | MEDIUM | Simple | Query OrgSyncRun for active syncs. |
| BUG-022 | Analyze Org button visible to all roles | LOW | Simple | Add canTriggerAnalysis boolean from server component. |
| BUG-023 | Document generation progress polling race condition | MEDIUM | Moderate | Use timestamp-based detection instead of count comparison. |

**Risks:** BUG-021 is most complex remaining — may need rethinking the polling approach for pipeline state.
**Verification:** Org connection shows syncing spinner; pipeline stepper shows running/completed states; Analyze Org only visible to SA; doc generation progress completes cleanly.
**Estimated scope:** ~6-8 files.

## Phase 6: Error Handling and Auth Edge Cases [COMPLETED - 2026-04-08]
**Goal:** Clean up error paths, auth edge cases, and remaining access control issues.
**Complexity:** Low
**Depends on:** Phase 4 (BUG-015 for nav gating context)
**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|---------------|------------|-------|
| BUG-026 | OAuth CSRF error redirects to root | LOW | Simple | Handle error param or encode projectId in state token. |
| BUG-028 | PM Dashboard accessible by URL, infinite loading | LOW | Simple | Add role guard, return 403 or redirect. |
| BUG-029 | Jira disconnect is a no-op placeholder | LOW | Simple | Implement deleteJiraConfig server action. |

**Risks:** Minimal — all isolated, well-understood fixes.
**Verification:** OAuth CSRF error shows meaningful message on correct page; PM Dashboard returns 403 for non-PM roles; Jira disconnect clears the integration.
**Estimated scope:** ~4-5 files.

## Phase 7: UX Polish [COMPLETED - 2026-04-08]
**Goal:** Cosmetic and UX polish items that don't affect functionality.
**Complexity:** Low
**Depends on:** Phase 4 (BUG-015 for sidebar context)
**Bugs (parallel):**

| Bug ID | Title | Final Severity | Complexity | Notes |
|--------|-------|---------------|------------|-------|
| BUG-009 | Checkbox indeterminate prop silently ignored | LOW | Simple | Conditionally render MinusIcon vs CheckIcon. |
| BUG-032 | Project switcher dropdown single-project workflow | LOW | Simple | Conditional rendering based on project count. |
| BUG-031 | Sidebar fallback paths 404 when no project active | LOW | Trivial | Already fixed in source — update stale test fixture. |

**Risks:** None — purely cosmetic.
**Verification:** Checkbox shows indeterminate state; project switcher simplified for single project; test fixture matches source.
**Estimated scope:** ~3 files.

## Dependency Graph

```
Phase 1 (Quick Wins)
  BUG-014, BUG-007, BUG-004, BUG-011, BUG-005
    │
    v
Phase 2 (Data Integrity)
  BUG-006 ─────────────────────────┐
  BUG-019 ──────────┐              │
  BUG-018, BUG-012, BUG-013       │
    │               │              │
    v               v              v
Phase 3 (Knowledge/Sessions/QA)  Phase 3
  BUG-025 (needs BUG-006)        BUG-024, BUG-017
  BUG-027 (schema chain)         BUG-030
    │               │
    v               v
Phase 4 (Sprint UX/Chat)
  BUG-010 (needs BUG-019)
  BUG-008 (needs BUG-006)
  BUG-015, BUG-016
    │
    v
Phase 5 (Org Analysis)          Phase 6 (Error Handling)
  BUG-021 (needs BUG-027)        BUG-026, BUG-028, BUG-029
  BUG-020, BUG-022, BUG-023
    │                               │
    v                               v
Phase 7 (UX Polish)
  BUG-009, BUG-032, BUG-031
```

## Summary

- **Phase 1** (parallel, 5 slots): BUG-014, BUG-007, BUG-004, BUG-011, BUG-005
- **Phase 2** (parallel, 5 slots): BUG-006, BUG-019, BUG-018, BUG-012, BUG-013
- **Phase 3** (parallel, 5 slots): BUG-024, BUG-025, BUG-017, BUG-027, BUG-030
- **Phase 4** (parallel, 4 slots): BUG-010, BUG-008, BUG-015, BUG-016
- **Phase 5** (parallel, 4 slots): BUG-021, BUG-020, BUG-022, BUG-023
- **Phase 6** (parallel, 3 slots): BUG-026, BUG-028, BUG-029
- **Phase 7** (parallel, 3 slots): BUG-009, BUG-032, BUG-031

**Total phases:** 7
**Total bugs:** 29
**Estimated parallel developer slots needed:** 5 (max in Phases 1-3)
**Critical path:** Phase 1 -> Phase 2 (BUG-006) -> Phase 3 (BUG-025, BUG-027) -> Phase 4 (BUG-008, BUG-010) -> Phase 5 (BUG-021)
