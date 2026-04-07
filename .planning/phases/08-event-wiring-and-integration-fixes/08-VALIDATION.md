---
phase: 8
slug: event-wiring-and-integration-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | DASH-05 | — | N/A | integration | `grep -r "PROJECT_STATE_CHANGED" src/actions/questions.ts` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | DASH-05 | — | N/A | integration | `grep -r "PROJECT_STATE_CHANGED" src/lib/inngest/functions/transcript-processing.ts` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | ADMIN-01 | — | N/A | unit | `grep "newStatus" src/actions/stories.ts` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | ADMIN-01 | — | N/A | unit | `grep "fromStatus" src/app/api/v1/stories/*/status/route.ts` | ❌ W0 | ⬜ pending |
| 08-01-05 | 01 | 1 | ADMIN-01 | — | N/A | integration | `grep "jiraSyncRetryFunction" src/app/api/inngest/route.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No new test framework or fixtures needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard refreshes after question creation | DASH-05 | Requires running Inngest dev server + browser | Create a question, verify dashboard synthesis function runs within 30s |
| Jira retry syncs story | ADMIN-01 | Requires Jira integration config | Trigger manual retry from story table, verify JiraSyncRecord created |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
