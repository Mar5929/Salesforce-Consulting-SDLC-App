# Bug Tracker

Identified during post-deployment wiring audit (2026-04-07). Each bug has a detail file in `bugs/` with full context for fix agents.

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 11 |
| MEDIUM | 12 |
| LOW | 6 |
| **Total** | **32** |

## Recommended Fix Order

Fix these first — they unblock the most functionality:
1. BUG-001: Rename proxy.ts to middleware.ts (unblocks auth, roles, badges)
2. BUG-003: Add S3 env vars to Vercel (unblocks document generation)
3. BUG-002: Fix embedding payload shape (unblocks semantic search)
4. BUG-014: Add PROJECT_STATE_CHANGED to updateStoryStatus (unblocks dashboard freshness)
5. BUG-011: Fix archive redirect /projects to / (unblocks project lifecycle)

## All Bugs

### CRITICAL

| ID | Title | Phase | Status | Detail |
|----|-------|-------|--------|--------|
| BUG-001 | proxy.ts never runs as middleware — all auth silently disabled | 1 | Open | [Detail](bugs/BUG-001.md) |
| BUG-002 | Embedding pipeline silently skips — payload shape mismatch | 2 | Open | [Detail](bugs/BUG-002.md) |
| BUG-003 | S3 env vars missing from Vercel — document generation fails | 5 | Fixed | [Detail](bugs/BUG-003.md) |

### HIGH

| ID | Title | Phase | Status | Detail |
|----|-------|-------|--------|--------|
| BUG-004 | Sidebar badge counts ANSWERED instead of needsReview | 1 | Open | [Detail](bugs/BUG-004.md) |
| BUG-005 | Project creator member record has blank displayName/email | 1 | Open | [Detail](bugs/BUG-005.md) |
| BUG-006 | Transcript-conversation linked by fragile title match | 2 | Open | [Detail](bugs/BUG-006.md) |
| BUG-007 | QuestionForm DialogTrigger renders empty button | 2 | Open | [Detail](bugs/BUG-007.md) |
| BUG-008 | TRANSCRIPT_SESSION conversations render wrong UI at /chat/ | 2 | Open | [Detail](bugs/BUG-008.md) |
| BUG-009 | Checkbox indeterminate prop silently ignored on Base UI | 3 | Open | [Detail](bugs/BUG-009.md) |
| BUG-010 | Sprint board drag-and-drop has no role awareness | 3 | Open | [Detail](bugs/BUG-010.md) |
| BUG-011 | Archive redirect goes to /projects which doesn't exist | 5 | Open | [Detail](bugs/BUG-011.md) |
| BUG-012 | Jira field customfield_story_points is invalid | 5 | Open | [Detail](bugs/BUG-012.md) |
| BUG-013 | SF_TOKEN_ENCRYPTION_KEY undocumented — crypto crash | 5 | Open | [Detail](bugs/BUG-013.md) |
| BUG-014 | updateStoryStatus doesn't fire PROJECT_STATE_CHANGED | 8 | Open | [Detail](bugs/BUG-014.md) |

### MEDIUM

| ID | Title | Phase | Status | Detail |
|----|-------|-------|--------|--------|
| BUG-015 | Role-based nav has no restrictions on Phase 2 features | 1 | Open | [Detail](bugs/BUG-015.md) |
| BUG-016 | Transcript messages API doesn't validate ownership | 2 | Open | [Detail](bugs/BUG-016.md) |
| BUG-017 | Knowledge article summary never updated during refresh | 2 | Open | [Detail](bugs/BUG-017.md) |
| BUG-018 | Backlog page never passes sprints to StoryTable | 3 | Open | [Detail](bugs/BUG-018.md) |
| BUG-019 | Sprint board SPRINT_PLANNED creates impossible transitions | 3 | Open | [Detail](bugs/BUG-019.md) |
| BUG-020 | Org connection isSyncing always false | 4 | Open | [Detail](bugs/BUG-020.md) |
| BUG-021 | Brownfield pipeline stepper never shows running state | 4 | Open | [Detail](bugs/BUG-021.md) |
| BUG-022 | Analyze Org button visible to all roles, errors for non-SA | 4 | Open | [Detail](bugs/BUG-022.md) |
| BUG-023 | Document generation progress has polling race condition | 5 | Open | [Detail](bugs/BUG-023.md) |
| BUG-024 | No UI to create test cases — QA tab dead end | 5 | Open | [Detail](bugs/BUG-024.md) |
| BUG-025 | Revisited STORY_SESSION conversations broken — epicId URL-only | 7 | Open | [Detail](bugs/BUG-025.md) |
| BUG-032 | Project switcher dropdown doesn't match single-project workflow | 1 | Open | [Detail](bugs/BUG-032.md) |

### LOW

| ID | Title | Phase | Status | Detail |
|----|-------|-------|--------|--------|
| BUG-026 | OAuth CSRF error redirects to root with unhandled param | 4 | Open | [Detail](bugs/BUG-026.md) |
| BUG-027 | bulkConfirmHighConfidence confirms ALL records | 4 | Open | [Detail](bugs/BUG-027.md) |
| BUG-028 | PM Dashboard accessible by URL, shows infinite loading | 5 | Open | [Detail](bugs/BUG-028.md) |
| BUG-029 | Jira disconnect is a no-op placeholder | 5 | Open | [Detail](bugs/BUG-029.md) |
| BUG-030 | Document detail nests anchor inside button | 5 | Open | [Detail](bugs/BUG-030.md) |
| BUG-031 | Sidebar fallback paths 404 when no project active | CC | Open | [Detail](bugs/BUG-031.md) |
