---
phase: 11
slug: agentic-chat-with-database-awareness-and-project-tool-use
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| *Populated during planning* | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Tool definition unit tests — verify tool schemas, parameter validation
- [ ] Tool execution integration tests — verify CRUD operations via tools
- [ ] Deletion safety gate tests — verify hard-coded confirmation gate cannot be bypassed
- [ ] Role-based gating tests — verify tools respect permission checks

*Existing vitest infrastructure covers test framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chat UI renders tool result cards correctly | D-12 | Visual rendering in browser | Open chat, trigger a query tool, verify card renders with correct entity data |
| Delete confirmation card blocks until user clicks | D-05 | Requires browser interaction | Trigger delete via chat, verify card appears, verify no deletion until explicit button click |
| SWR revalidation updates context panel | D-17 | Requires live browser observation | Create entity via chat, verify context panel reflects new entity within refresh interval |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
