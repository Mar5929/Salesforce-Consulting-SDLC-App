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
| **Framework** | Vitest (based on existing tests/ directory) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | ACHAT-01 | T-11-01 | Tool registry exports all expected tool names | unit | `npx vitest run tests/lib/chat-tools/build-tools.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | ACHAT-08 | T-11-02 | Role gating filters tools correctly per role | unit | `npx vitest run tests/lib/chat-tools/role-gating.test.ts` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | ACHAT-02 | — | Query tools return summary fields for all entities | unit | `npx vitest run tests/lib/chat-tools/query-tools.test.ts` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | ACHAT-03 | T-11-03 | Write tools validate input and call server actions | unit | `npx vitest run tests/lib/chat-tools/write-tools.test.ts` | ❌ W0 | ⬜ pending |
| 11-04-01 | 04 | 2 | ACHAT-05 | T-11-04 | All delete tools have needsApproval: true | unit | `npx vitest run tests/lib/chat-tools/delete-tools.test.ts` | ❌ W0 | ⬜ pending |
| 11-05-01 | 05 | 3 | ACHAT-09 | T-11-05 | Chat route registers tools with stopWhen(15) | integration | `npx vitest run tests/api/chat-route.test.ts` | ❌ W0 | ⬜ pending |
| 11-06-01 | 06 | 3 | ACHAT-12 | — | Tool result cards render for each entity type | unit | `npx vitest run tests/components/chat/tool-cards.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/chat-tools/build-tools.test.ts` — stubs for tool registry
- [ ] `tests/lib/chat-tools/role-gating.test.ts` — stubs for role-based filtering
- [ ] `tests/lib/chat-tools/query-tools.test.ts` — stubs for query tool execution
- [ ] `tests/lib/chat-tools/write-tools.test.ts` — stubs for write tool execution
- [ ] `tests/lib/chat-tools/delete-tools.test.ts` — stubs for delete tool needsApproval
- [ ] `tests/api/chat-route.test.ts` — stubs for chat route with tools
- [ ] `tests/components/chat/tool-cards.test.ts` — stubs for tool card rendering

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Delete confirmation card renders with Approve/Deny | ACHAT-05 | Requires browser interaction with streaming chat | Open chat, ask AI to delete an entity, verify confirmation card appears |
| SWR revalidation after mutations | ACHAT-17 | Requires live browser with context panel open | Create entity via chat, verify context panel updates |
| Multi-step tool chains work end-to-end | ACHAT-16 | Complex integration requiring live AI model | Ask AI to "create epic and generate stories", verify chain completes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
