---
phase: 4
slug: salesforce-org-connectivity-and-developer-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | ORG-01 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/salesforce-oauth.test.ts` — stubs for ORG-01, ORG-02
- [ ] `tests/lib/metadata-sync.test.ts` — stubs for ORG-03, ORG-04
- [ ] `tests/lib/brownfield-ingestion.test.ts` — stubs for ORG-05, ORG-06
- [ ] `tests/api/context-package.test.ts` — stubs for DEV-01, DEV-02, DEV-03
- [ ] `tests/api/story-status.test.ts` — stubs for DEV-04, DEV-05

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Salesforce OAuth redirect flow | ORG-01 | Requires live Salesforce org and browser interaction | 1. Click "Connect Org" 2. Verify redirect to Salesforce login 3. Authorize and verify callback stores tokens |
| Metadata sync against real org | ORG-03 | Requires connected Salesforce org with metadata | 1. Trigger full sync 2. Verify OrgComponent records created 3. Verify relationships detected |
| Brownfield AI analysis quality | ORG-05 | AI output quality is subjective | 1. Run ingestion on synced org 2. Review domain groupings 3. Verify business process mappings make sense |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
