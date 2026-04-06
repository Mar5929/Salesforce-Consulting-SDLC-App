---
phase: 2
slug: discovery-and-knowledge-brain
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.2 |
| **Config file** | `vitest.config.ts` (exists — `tests/**/*.test.ts` glob, `@` path alias, node environment) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-00 | 01 | 1 | AGENT-01 | — | N/A (test utilities) | unit | `npx tsc --noEmit tests/helpers/*.ts` | Wave 0 | pending |
| 02-01-01 | 01 | 1 | AGENT-01, AGENT-03, AGENT-06 | T-02-01, T-02-04 | Engine retries capped at 3, SessionLog created per call | unit | `npx vitest run tests/lib/agent-harness/engine.test.ts` | Wave 0 | pending |
| 02-01-02 | 01 | 1 | AGENT-02, AGENT-05 | T-02-05 | Tool inputs sanitized via DOMPurify, scoped DB access | unit | `npx vitest run tests/lib/agent-harness/` | Wave 0 | pending |
| 02-02-01 | 02 | 2 | AGENT-04, KNOW-05 | T-02-06 | Context loaders use scopedPrisma, token budget enforced | unit | `npx vitest run tests/lib/agent-harness/context.test.ts` | Wave 0 | pending |
| 02-02-02 | 02 | 2 | AGENT-04, TRNS-04 | T-02-07 | Tool schemas statically defined, outputValidator checks | unit | `npx vitest run tests/lib/agent-harness/task-definitions.test.ts` | Wave 0 | pending |
| 02-03-01 | 03 | 2 | CHAT-01, CHAT-04 | T-02-09, T-02-10 | Auth via Clerk, scopedPrisma for DB access | type-check | `npx tsc --noEmit src/app/api/chat/route.ts src/actions/conversations.ts` | N/A | pending |
| 02-03-02 | 03 | 2 | CHAT-02, CHAT-03, CHAT-05 | T-02-12 | AI markdown rendered safely | type-check | `npx tsc --noEmit src/components/chat/*.tsx` | N/A | pending |
| 02-04-01 | 04 | 3 | QUES-01 through QUES-08 | T-02-13, T-02-14 | Zod validation, role check on SA review | type-check | `npx tsc --noEmit src/actions/questions.ts src/lib/display-id.ts src/lib/agent-harness/tools/*.ts` | N/A | pending |
| 02-04-02 | 04 | 3 | QUES-02, QUES-05 | T-02-16 | sanitizeToolInput on all tool calls | type-check | `npx tsc --noEmit src/components/questions/*.tsx` | N/A | pending |
| 02-05-1a | 05 | 4 | TRNS-02, TRNS-04 | T-02-18 | Tools go through sanitizeToolInput, scopedPrisma | type-check | `npx tsc --noEmit src/lib/agent-harness/tools/*.ts src/lib/agent-harness/tool-executor.ts` | N/A | pending |
| 02-05-1b | 05 | 4 | TRNS-01, TRNS-05, INFRA-03 | T-02-17, T-02-20 | Content length validation, concurrency limit | type-check | `npx tsc --noEmit src/actions/transcripts.ts src/lib/inngest/functions/transcript-processing.ts` | N/A | pending |
| 02-05-02 | 05 | 4 | TRNS-06 | — | N/A | type-check | `npx tsc --noEmit src/components/transcripts/*.tsx` | N/A | pending |
| 02-06-01 | 06 | 4 | KNOW-01 through KNOW-04, KNOW-07 | T-02-22 | Staleness detection scoped, DOMPurify on article content | type-check | `npx tsc --noEmit src/actions/knowledge.ts src/lib/inngest/functions/article-refresh.ts src/lib/inngest/functions/staleness-detection.ts` | N/A | pending |
| 02-06-02 | 06 | 4 | KNOW-02, KNOW-03 | T-02-21 | AI markdown sanitized via DOMPurify | type-check | `npx tsc --noEmit src/components/knowledge/*.tsx` | N/A | pending |
| 02-07-01 | 07 | 5 | SRCH-01 through SRCH-04 | T-02-24 | All raw SQL uses tagged templates, $queryRawUnsafe banned | integration | `npx vitest run tests/lib/search/global-search.test.ts` | Wave 0 | pending |
| 02-07-02 | 07 | 5 | SRCH-04 | T-02-25 | Embedding data sent to Voyage AI (accepted risk) | type-check | `npx tsc --noEmit src/components/search/command-palette.tsx src/lib/inngest/functions/embedding-batch.ts` | N/A | pending |
| 02-08-01 | 08 | 5 | DASH-01 through DASH-05, KNOW-06 | T-02-30 | scopedPrisma on all queries | unit | `npx vitest run tests/lib/dashboard/health-score.test.ts` | Wave 0 | pending |
| 02-08-02 | 08 | 5 | DASH-04, DASH-05 | T-02-28, T-02-29 | DOMPurify on AI summary, debounce on synthesis | type-check | `npx tsc --noEmit src/components/dashboard/*.tsx src/lib/inngest/functions/dashboard-synthesis.ts` | N/A | pending |
| 02-09-01 | 09 | 5 | NOTF-01 through NOTF-04 | T-02-31, T-02-32, T-02-33 | Recipient check on markRead, notification content server-generated | type-check | `npx tsc --noEmit src/actions/notifications.ts src/lib/inngest/functions/notification-dispatch.ts` | N/A | pending |
| 02-09-02 | 09 | 5 | NOTF-01 | — | N/A | type-check | `npx tsc --noEmit src/components/notifications/*.tsx` | N/A | pending |

*Status: pending (pre-execution)*

---

## Wave 0 Requirements

- [x] `vitest.config.ts` — already exists with correct configuration (`tests/**/*.test.ts`, `@` alias, node env)
- [x] `vitest@4.1.2` — already installed as dev dependency
- [ ] `tests/helpers/mock-prisma.ts` — Prisma mock factory (Plan 01 Task 0)
- [ ] `tests/helpers/mock-anthropic.ts` — Anthropic SDK mock factory (Plan 01 Task 0)
- [ ] `tests/lib/agent-harness/engine.test.ts` — engine behavioral tests (Plan 01 Task 1)
- [ ] `tests/lib/agent-harness/context.test.ts` — context loader tests (Plan 02 Task 1)
- [ ] `tests/lib/agent-harness/task-definitions.test.ts` — task definition smoke tests (Plan 02 Task 2)
- [ ] `tests/lib/search/global-search.test.ts` — search integration tests (Plan 07 Task 1)
- [ ] `tests/lib/dashboard/health-score.test.ts` — health score computation tests (Plan 08 Task 1)

*Note: Test path convention is `tests/` (established in Phase 1), NOT `src/lib/__tests__/` (RESEARCH.md Wave 0 Gaps section had incorrect paths).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chat streaming renders smoothly | CHAT-04 | Streaming UX is visual/perceptual | Open chat, send message, verify streaming text renders incrementally without flicker |
| Kanban drag-to-advance | QUES-05 | Drag interaction is browser-dependent | On questions page, switch to kanban view, drag a card between columns, verify status updates |
| Cmd+K opens search palette | SRCH-01 | Keyboard shortcut binding is browser-dependent | Press Cmd+K on any page, verify command palette opens with search input focused |
| Notification bell badge updates | NOTF-01 | SWR polling timing is runtime-dependent | Trigger a notification event, wait ~30s, verify badge count increments |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-06
