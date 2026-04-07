# Phase 9: Navigation and Badge Fixes - Context

**Gathered:** 2026-04-07
**Updated:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix two broken UI behaviors in the sidebar: (1) Team link navigates to wrong path, (2) badge counts for question reviews and open defects are never fetched or passed to Sidebar.

</domain>

<decisions>
## Implementation Decisions

### Team Link Fix
- **D-01:** Change Team link href from `/projects/${id}/team` to `/projects/${id}/settings/team`

### Badge Count Wiring
- **D-02:** AppShell must fetch questionReviewCount and openDefectCount and pass them to Sidebar as props
- **D-03:** Sidebar already accepts and renders these props — no Sidebar changes needed for badge display
- **D-04:** Badge counts fetched via layout server component Prisma queries — follows the established pattern where `app/(app)/projects/[projectId]/layout.tsx` queries data and passes through AppShell props. No new API routes or server actions.
- **D-05:** `questionReviewCount` = count of Questions with `status = 'ANSWERED'` (awaiting review — actionable items needing attention)
- **D-06:** `openDefectCount` = count of Defects with `status = 'OPEN'` (unresolved defects needing attention)

### Claude's Discretion
- None — all decisions locked

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Sidebar and Layout
- `src/components/layout/sidebar.tsx` — Sidebar component with badge rendering and Team link (line 151)
- `src/components/layout/app-shell.tsx` — AppShell wrapper that renders Sidebar without badge counts
- `src/app/(app)/projects/[projectId]/layout.tsx` — Server component layout that passes data to AppShell (established data flow pattern)

### Domain Models
- `prisma/schema.prisma` — Question and Defect models with status enums

### Success Criteria Source
- `.planning/ROADMAP.md` Phase 9 section — defines exact success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Sidebar already has full badge rendering logic (lines 16, 41, 130, 202-204) — just needs data
- SidebarProps interface already defines questionReviewCount and openDefectCount as optional props
- buildNavItems function already wires badge counts to Questions and Defects nav items

### Established Patterns
- AppShell is a client component ("use client") — receives props from layout
- Layout pages (app/(app)/projects/[projectId]/layout.tsx) are server components that pass data down
- Layout already queries Prisma for currentMemberRole and activeProjectId — badge counts follow same pattern

### Integration Points
- AppShell receives currentMemberRole and activeProjectId from layout — badge counts added to same prop flow
- Question count: Prisma count where projectId matches and status = ANSWERED
- Defect count: Prisma count where projectId matches and status = OPEN

</code_context>

<specifics>
## Specific Ideas

No specific requirements — both fixes are well-defined by the success criteria and decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-navigation-and-badge-fixes*
*Context gathered: 2026-04-07*
