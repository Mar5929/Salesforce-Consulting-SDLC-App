# Phase 9: Navigation and Badge Fixes - Research

**Researched:** 2026-04-07
**Domain:** Next.js layout data flow, Prisma count queries, sidebar navigation
**Confidence:** HIGH

## Summary

This is a small, well-scoped bug-fix phase with two issues: (1) the Team sidebar link navigates to `/projects/${id}/team` but the actual page lives at `/projects/${id}/settings/team`, and (2) the `questionReviewCount` and `openDefectCount` badge props exist on the Sidebar component but are never populated because AppShell doesn't receive or forward them, and the dashboard layout doesn't query the counts.

All decisions are locked. The fix requires changes to exactly three files: `sidebar.tsx` (href fix), `app-shell.tsx` (add props), and `(dashboard)/layout.tsx` (add Prisma count queries). No new libraries, patterns, or infrastructure needed.

**Primary recommendation:** Single plan with two tasks -- one for the Team link href fix, one for wiring badge counts through the layout > AppShell > Sidebar prop chain.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Change Team link href from `/projects/${id}/team` to `/projects/${id}/settings/team`
- **D-02:** AppShell must fetch questionReviewCount and openDefectCount and pass them to Sidebar as props
- **D-03:** Sidebar already accepts and renders these props -- no Sidebar changes needed for badge display
- **D-04:** Badge counts fetched via layout server component Prisma queries -- follows the established pattern where `(dashboard)/layout.tsx` queries data and passes through AppShell props. No new API routes or server actions.
- **D-05:** `questionReviewCount` = count of Questions with `status = 'ANSWERED'` (awaiting review)
- **D-06:** `openDefectCount` = count of Defects with `status = 'OPEN'`

### Claude's Discretion
None -- all decisions locked

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROJ-02 | User can view and edit project settings and team membership | Team link fix ensures navigation to settings/team page works correctly; badge counts improve sidebar usability |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase uses only existing project dependencies:

### Core (already installed)
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| Prisma | 7.6.0 | Count queries for badge data | Already used in layout for getCurrentMember |
| Next.js | 16.2.2 | Server component layout data fetching | Established pattern in (dashboard)/layout.tsx |

## Architecture Patterns

### Established Data Flow (layout > AppShell > Sidebar)

The project uses a consistent pattern for passing server-fetched data to the client-side sidebar. [VERIFIED: codebase inspection]

```
(dashboard)/layout.tsx (server component)
  -> queries Prisma for data
  -> passes props to <AppShell>
    -> AppShell (client component) forwards props to <Sidebar>
      -> Sidebar renders navigation with data
```

**Current state:**
- Layout queries `getCurrentMember(projectId)` and passes `currentMemberRole` and `activeProjectId` to AppShell
- AppShell forwards those to Sidebar
- Sidebar already accepts `questionReviewCount` and `openDefectCount` as optional props
- Sidebar already renders badges when these props have values > 0

**What's missing:**
1. Layout doesn't query the counts
2. AppShell interface doesn't include the count props
3. AppShell doesn't forward count props to Sidebar

### File Change Map

| File | Change | Lines Affected |
|------|--------|----------------|
| `src/components/layout/sidebar.tsx` | Fix Team href: `/projects/${id}/team` -> `/projects/${id}/settings/team` | Line 151 |
| `src/app/(dashboard)/layout.tsx` | Add `prisma` import, add two `prisma.question.count()` / `prisma.defect.count()` queries, pass results to AppShell | ~10 new lines |
| `src/components/layout/app-shell.tsx` | Add `questionReviewCount` and `openDefectCount` to AppShellProps, forward to Sidebar | ~6 lines changed |

### Prisma Count Queries

```typescript
// Source: verified against prisma/schema.prisma enums [VERIFIED: codebase]
// QuestionStatus.ANSWERED and DefectStatus.OPEN confirmed in schema

const [questionReviewCount, openDefectCount] = await Promise.all([
  prisma.question.count({
    where: { projectId, status: "ANSWERED" },
  }),
  prisma.defect.count({
    where: { projectId, status: "OPEN" },
  }),
])
```

**Key detail:** These queries should only run when `projectId` is available (non-null). The layout already has a conditional block for `if (projectId)`. The counts should be queried inside that same block, parallel with `getCurrentMember`. [VERIFIED: codebase]

### Team Page Route Confirmation

The team page lives at `src/app/(dashboard)/projects/[projectId]/settings/team/page.tsx`. The sidebar currently links to `/projects/${id}/team` (no `settings/` segment), which is a 404. [VERIFIED: codebase glob]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Badge count queries | Custom API route or server action | Prisma count in layout server component | Follows established pattern, no client-side fetching needed |

## Common Pitfalls

### Pitfall 1: Forgetting to guard count queries behind projectId check
**What goes wrong:** Prisma query with `undefined` projectId returns counts across all projects
**Why it happens:** The layout extracts projectId from pathname which can be null
**How to avoid:** Place count queries inside the existing `if (projectId)` block
**Warning signs:** Badge shows counts from other projects

### Pitfall 2: Sequential instead of parallel queries
**What goes wrong:** Layout makes 3 sequential awaits (member + 2 counts) instead of parallel
**Why it happens:** Adding queries one at a time without thinking about performance
**How to avoid:** Use `Promise.all()` to run member lookup and both count queries concurrently
**Warning signs:** Noticeable page load delay

### Pitfall 3: Badge count type mismatch
**What goes wrong:** Prisma `count()` returns `number`, but prop might expect `number | undefined`
**Why it happens:** When projectId is null, counts won't be queried and should be undefined
**How to avoid:** Only set count variables inside the projectId block; default to undefined outside
**Warning signs:** TypeScript errors on AppShell props

## Code Examples

### Layout with badge count queries
```typescript
// Source: established pattern from (dashboard)/layout.tsx [VERIFIED: codebase]
import { prisma } from "@/lib/db"

// Inside DashboardLayout, within the existing if (projectId) block:
let questionReviewCount: number | undefined
let openDefectCount: number | undefined

if (projectId) {
  try {
    const [member, qCount, dCount] = await Promise.all([
      getCurrentMember(projectId),
      prisma.question.count({
        where: { projectId, status: "ANSWERED" },
      }),
      prisma.defect.count({
        where: { projectId, status: "OPEN" },
      }),
    ])
    currentMemberRole = member.role
    questionReviewCount = qCount
    openDefectCount = dCount
  } catch {
    redirect("/")
  }
}

return (
  <AppShell
    currentMemberRole={currentMemberRole}
    activeProjectId={projectId ?? undefined}
    questionReviewCount={questionReviewCount}
    openDefectCount={openDefectCount}
  >
    {children}
  </AppShell>
)
```

### AppShell prop forwarding
```typescript
// Source: existing pattern [VERIFIED: codebase]
interface AppShellProps {
  children: React.ReactNode
  currentMemberRole?: string
  activeProjectId?: string
  questionReviewCount?: number
  openDefectCount?: number
}

export function AppShell({
  children,
  currentMemberRole,
  activeProjectId,
  questionReviewCount,
  openDefectCount,
}: AppShellProps) {
  return (
    <div className="flex h-screen">
      <Sidebar
        currentMemberRole={currentMemberRole}
        activeProjectId={activeProjectId}
        questionReviewCount={questionReviewCount}
        openDefectCount={openDefectCount}
      />
      {/* ... rest unchanged */}
    </div>
  )
}
```

### Team link fix
```typescript
// Source: sidebar.tsx line 151 [VERIFIED: codebase]
// Before:
href: activeProjectId ? `/projects/${activeProjectId}/team` : "/team",
// After:
href: activeProjectId ? `/projects/${activeProjectId}/settings/team` : "/settings/team",
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts (assumed) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROJ-02a | Team link points to /settings/team | unit | `npx vitest run tests/unit/sidebar-nav.test.ts -x` | No - Wave 0 |
| PROJ-02b | Layout queries badge counts with correct filters | unit | `npx vitest run tests/unit/layout-badge-counts.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/sidebar-nav.test.ts` -- verify Team link href includes /settings/ segment
- [ ] `tests/unit/layout-badge-counts.test.ts` -- verify Prisma count queries use correct status filters

Note: These are simple, low-risk changes. The sidebar test would verify the `buildNavItems` function output. The layout test would mock Prisma and verify the count query arguments. Given the minimal scope, the planner may decide inline verification (visual check + TypeScript compilation) is sufficient.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | vitest.config.ts exists at project root | Validation Architecture | Low -- test command still works, just config path wrong |

All other claims verified via codebase inspection.

## Open Questions

None. This phase is fully specified with locked decisions and verified code references.

## Security Domain

Not applicable -- this phase modifies only navigation links and read-only count queries. No new user input, no new API surface, no auth changes.

## Sources

### Primary (HIGH confidence)
- `src/components/layout/sidebar.tsx` -- verified SidebarProps interface, buildNavItems function, badge rendering, Team link href
- `src/components/layout/app-shell.tsx` -- verified AppShellProps interface missing count props
- `src/app/(dashboard)/layout.tsx` -- verified data fetching pattern, missing count queries
- `prisma/schema.prisma` -- verified QuestionStatus.ANSWERED and DefectStatus.OPEN enums
- `src/app/(dashboard)/projects/[projectId]/settings/team/page.tsx` -- confirmed team page route

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing
- Architecture: HIGH -- verified exact file contents and prop interfaces
- Pitfalls: HIGH -- standard Prisma/Next.js patterns, well-understood

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable -- no external dependencies)
