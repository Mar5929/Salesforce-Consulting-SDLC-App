# Phase 1 Spec: RBAC, Security, Governance

> Parent: [Phase Plan](../../02-phase-plan/PHASE_PLAN.md)
> Depends On: None
> Status: Approved
> Last Updated: 2026-04-09

---

## 1. Scope Summary

Fix the foundational auth bypass where removed members can still authenticate, add missing `requireRole` gates to 8 action files, correct wrong role allowlists on 2 actions, fix the story status machine (BA management transitions, SA both groups), add prompt injection defense to transcript processing, create centralized token field stripping, and add `version` fields to 7 models for future OCC.

**In scope:** 12 of 16 domain gaps → 14 requirements
**Deferred:** GAP-RBAC-010/014/016 (Usage dashboard, audit logging, cost caps) → Phase 7. GAP-RBAC-007 secondary gap (AI tool call role enforcement) → Phase 2. GAP-RBAC-011 full OCC → V2.

---

## 2. Functional Requirements

### 2.1 Auth Layer Fix (REQ-RBAC-001)

- **What it does:** Filters `status: "ACTIVE"` in the `getCurrentMember` query so removed members are rejected from all server actions.
- **Inputs:** Any server action call from a member with `status: "REMOVED"`
- **Outputs:** "Not a member of this project" error
- **Business rules:** Only two statuses exist: ACTIVE and REMOVED. All 25+ action files use `getCurrentMember` or `requireRole` (which calls `getCurrentMember`), so this single fix propagates everywhere.
- **File:** `src/lib/auth.ts` line 13

### 2.2 Role Gates on Write Actions (REQ-RBAC-002 through 007)

Six action files need `requireRole` added to their write operations:

| REQ | Action File | Write Functions | Allowed Roles |
|-----|-------------|----------------|---------------|
| 002 | `src/actions/epics.ts` | createEpic (L60), updateEpic (L87), deleteEpic (L116) | SA, PM, BA |
| 003 | `src/actions/features.ts` | createFeature (L58), updateFeature (L95), deleteFeature (L124) | SA, PM, BA |
| 004 | `src/actions/sprints.ts` | createSprint (L75), updateSprint (L103), assignStories (L145), removeStories (L164) | SA, PM |
| 005 | `src/actions/milestones.ts` | createMilestone (L69), updateMilestone (L99), deleteMilestone (L132) | SA, PM |
| 006 | `src/actions/transcripts.ts` | entity deletion (~L222-226) | Decisions: not QA. Requirements/Risks: SA, PM, BA only |
| 007 | `src/app/(dashboard)/projects/[projectId]/settings/page.tsx` | Page load (Server Component) | SA, PM — redirect if unauthorized |

- **Business rules:** Read actions remain membership-only. The pattern is: change `getCurrentMember(projectId)` to `requireRole(projectId, [...roles])`. Settings page uses redirect, not error.

### 2.3 Story RBAC Fixes (REQ-RBAC-008, 009)

**QA Draft enforcement (REQ-RBAC-008):**
- **What it does:** Adds explicit check in `createStory` that forces QA to DRAFT status
- **File:** `src/actions/stories.ts` (~L100)
- **Business rules:** Currently accidentally correct (schema doesn't accept status param). This codifies the intent for future safety.

**Status machine fix (REQ-RBAC-009):**
- **What it does:** Fixes two bugs in the story status machine:
  1. BA added to management transitions (Draft↔Ready, Ready↔Sprint Planned)
  2. SA can do both management AND execution transitions
- **File:** `src/lib/story-status-machine.ts`
- **Business rules per PRD Section 19.1:**
  - Management transitions (Draft→Ready→Sprint Planned): SA, PM, BA
  - Execution transitions (Sprint Planned→In Progress→In Review→QA→Done): SA, Developer
  - QA: Cannot transition at all

### 2.4 Role Allowlist Corrections (REQ-RBAC-010, 011)

**Org disconnect (REQ-RBAC-010):**
- **File:** `src/actions/org-connection.ts` (~L20-28)
- **Change:** Remove PM from allowlist → SA only

**Archive/reactivate (REQ-RBAC-011):**
- **File:** `src/actions/project-archive.ts` lines 26, 104
- **Change:** Add SA to allowlist → SA + PM (product decision)

### 2.5 Prompt Injection Defense (REQ-RBAC-012)

- **What it does:** Adds security paragraph to transcript processing system prompt framing the transcript as untrusted data
- **File:** `src/lib/agent-harness/tasks/transcript-processing.ts` (~L66-86)
- **Business rules:** AI must never execute embedded instructions. Suspicious content flagged as risk with `needsReview: true`.

### 2.6 Token Field Stripping (REQ-RBAC-013)

- **What it does:** Creates `stripTokenFields` utility that removes `sfOrgAccessToken`, `sfOrgRefreshToken`, `sfOrgInstanceUrl`, `keyVersion` from Project objects before they leave the server boundary.
- **File to create:** `src/lib/safe-project.ts`
- **Files to modify:** All server actions and API routes returning Project data without explicit `select`
- **Business rules:** Internal code (encryption/decryption) still accesses raw fields. Stripping only at serialization boundary.

### 2.7 OCC Schema Prep (REQ-RBAC-014)

- **What it does:** Adds `version Int @default(1)` to 7 models: Story, Epic, Feature, Question, Decision, Requirement, Risk
- **File:** `prisma/schema.prisma`
- **Business rules:** Field exists but is NOT used. No auto-increment, no compare-and-swap, no conflict UI. Schema prep only.

---

## 3. Technical Approach

### 3.1 Implementation Strategy

All changes are small, surgical fixes to existing code. No new architecture, no new patterns. The approach is:
1. Fix the single auth.ts line (propagates everywhere)
2. Add `requireRole` calls (mechanical — same pattern repeated)
3. Fix the status machine (logic change in one file)
4. Fix two role allowlists (one-line changes)
5. Add security paragraph to one prompt
6. Create one new utility file + apply it
7. Add schema fields (one migration)

### 3.2 File/Module Structure

```
src/
  lib/
    auth.ts               — modify (status filter)
    safe-project.ts       — CREATE (token stripping utility)
    story-status-machine.ts — modify (BA + SA fix)
    agent-harness/tasks/
      transcript-processing.ts — modify (security paragraph)
  actions/
    epics.ts              — modify (requireRole)
    features.ts           — modify (requireRole)
    sprints.ts            — modify (requireRole)
    milestones.ts         — modify (requireRole)
    transcripts.ts        — modify (role gate on entity delete)
    org-connection.ts     — modify (SA-only)
    project-archive.ts    — modify (SA+PM)
    stories.ts            — modify (QA Draft check)
  app/(dashboard)/projects/[projectId]/settings/
    page.tsx              — modify (requireRole + redirect)
prisma/
  schema.prisma           — modify (version fields)
```

---

## 4. Edge Cases & Error Handling

| Scenario | Expected Behavior | Error Response |
|----------|------------------|---------------|
| Removed member calls any action | Rejected at `getCurrentMember` | "Not a member of this project" |
| Developer tries to create an epic | Rejected at `requireRole` | "Insufficient permissions" |
| QA tries to create story with status READY | Rejected with explicit check | "QA can only create stories in Draft status" |
| BA tries execution transition (Sprint Planned → In Progress) | Rejected by status machine | `canTransition` returns false |
| SA tries execution transition | Allowed — SA can do both | Succeeds |
| Dev/BA/QA navigates to /settings URL directly | Redirected to project overview | HTTP redirect, no error shown |
| Transcript contains "Ignore previous instructions..." | AI flags as risk with needsReview | Risk entity created, no instruction followed |
| Server action returns Project without select | Token fields stripped by utility | No sensitive fields in response |

---

## 5. Integration Points

### From Prior Phases
- None — this is Phase 1, no dependencies.

### For Future Phases
- **Phase 2 (Agent Harness):** Receives the deferred GAP-RBAC-007 secondary gap (AI tool call role enforcement). The `getCurrentMember` fix here means the auth foundation is correct before Phase 2 builds on it.
- **Phase 4 (Work Management):** GAP-WORK-007 (BA cannot transition stories) is resolved by REQ-RBAC-009 in this phase. Phase 4 can mark it as handled.
- **Phase 7 (Dashboards):** Receives GAP-RBAC-010 (Usage & Costs), GAP-RBAC-014 (audit logging), GAP-RBAC-016 (cost caps).
- **V2 (Deferred):** GAP-RBAC-011 full OCC (conflict detection, diff UI, VersionHistory writes) is deferred to V2. Task 14 in this phase adds the `version` field as schema prep so V2 can build on it without a migration.

---

## 6. Acceptance Criteria

- [ ] Removed members (status: REMOVED) cannot call any server action
- [ ] Developers and QA cannot create/edit/delete epics or features
- [ ] Only SA and PM can manage sprints and assign stories
- [ ] Only SA and PM can manage milestones
- [ ] BA can do management story transitions (Draft↔Ready↔Sprint Planned)
- [ ] SA can do both management and execution story transitions
- [ ] QA cannot transition stories at all
- [ ] QA story creation forced to DRAFT status
- [ ] Only SA can disconnect Salesforce org
- [ ] Both SA and PM can archive/reactivate projects
- [ ] Settings page returns 302 redirect for non-SA/PM members
- [ ] Transcript processing system prompt contains anti-injection framing
- [ ] No server action or API route returns sfOrgAccessToken/sfOrgRefreshToken in response
- [ ] All 7 entity models have a `version` field with default 1
- [ ] No regressions — existing functionality for authorized users unchanged

---

## 7. Open Questions

None — all product decisions resolved during refinement.

---

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-09 | Initial spec | Created via domain refinement session, migrated to BEF format |
