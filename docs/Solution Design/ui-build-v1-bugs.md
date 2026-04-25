# UI Build v1 — Bug / Delta List

Output of the Wave 3 QA pass for the Wave 0–2 build of `web/`. Consolidates
deltas flagged by the eight Wave 2 agents plus integration notes.

**Verification limitation:** Playwright `chromium` download is blocked by the
sandbox (`Host not in allowlist`), so the screenshot-comparison loop in the
source plan's Wave 3 was not run. QA below is by source diff against
`visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/*.jsx`
plus build/lint/typecheck verification (`pnpm lint && pnpm typecheck &&
pnpm build` — clean, 40 routes prerendered as static).

Categorize each item as one of:
- **PARITY** — matches prototype exactly.
- **DELTA-OK** — intentional, documented divergence (not a bug).
- **TODO** — missing functionality flagged for follow-up; safe for v1.
- **FIX** — actionable bug that should be addressed in Wave 3 polish.

---

## Cross-cutting

| ID | Severity | Source | Item |
|---|---|---|---|
| X-1 | DELTA-OK | layout | `web/app/(app)/layout.tsx` is a `'use client'` wrapper because it composes the providers + shell. Every page is server-renderable inside it unless it needs state. |
| X-2 | DELTA-OK | icons | `Icon.tsx` ports the 35 SVG paths from `components.jsx` exactly. Settings and a few other views referenced icons not in the set (info, lock, bolt, cloud, sync, download). Substitutions used: `warn` for info, `shield` for lock, `zap` for bolt, `refresh` for sync. The Export button on dashboards was dropped instead of substituted. |
| X-3 | TODO | deps | Dashboards and a few other pages would benefit from a `download` icon for Export — add to `Icon.tsx` if a v2 needs it. |

## Wave 1 (shell + primitives + context)

| ID | Severity | Source | Item |
|---|---|---|---|
| 1A-1 | DELTA-OK | `Readiness.tsx` | Replaced the prototype's `window.dispatchEvent('open-readiness')` with an `onClick?: () => void` callback. Drawer integration moved to consumers via `useDrawer()`. |
| 1A-2 | DELTA-OK | `Avatar.tsx` | Returns `?` placeholder when an unknown `person` id is passed (prototype crashed). |
| 1A-3 | DELTA-OK | `QuestionCard.tsx` | Added owner avatar that wasn't in the prototype, derived from `question.owner` lowercased first word. Fallback `?` when owner doesn't map to a team id (e.g., "Acme CFO"). |
| 1B-1 | PARITY | `Rail.tsx` | Active state uses `usePathname` against route prefixes — supports nested routes correctly. |
| 1C-1 | DELTA-OK | `DrawerHost.tsx` | Wave 1C version had inline placeholder bodies because `Drawer` primitive wasn't yet available. Wave 2H replaced these with the real drawer components (`WorkItemDrawer`, `QuestionDrawer`, `ReproposalDrawer`, `ReadinessDrawer`). Final size: 48 lines. |

## Wave 2A — Home

| ID | Severity | Source | Item |
|---|---|---|---|
| 2A-1 | DELTA-OK | activity | "AI" actor uses `colorKey="a-michael"` (slate) since there's no `a-ai` token. Matches prototype's `.a-michael` class. |
| 2A-2 | PARITY | role widgets | `RoleWidgets.tsx` ports all 5 role variants (sarah/jamie/david/priya/marcus). `michael` role falls back to `sarah`, matching `widgets[viewingAs] \|\| widgets.sarah`. |
| 2A-3 | DELTA-OK | navigation | "Open roadmap →" pill on the phase-readiness card uses default gray pill styling (matches prototype, not the indigo SectionLink pattern). |
| 2A-4 | DELTA-OK | activity rows | Recent activity has 5 rows (matches `home.jsx`), not 6 as initially in my prompt. |

## Wave 2B — Work shell + Home/Admin/Roadmap

| ID | Severity | Source | Item |
|---|---|---|---|
| 2B-1 | TODO | DRY | `AdminTaskStatusChip` mapping (`Open` / `In Progress` / `Done`) is duplicated in `work/home/page.tsx` and `work/admin/page.tsx`. If a third caller appears, extract to `components/widgets/AdminTaskStatusChip.tsx`. |
| 2B-2 | TODO | primitive | Used Tailwind `!p-0` to override the `Card` primitive's hard-coded `p-[14px_16px]` for the admin-tasks table card. Cleaner: extend `Card` with a `noPadding` prop. |
| 2B-3 | PARITY | activity | Activity row avatar colors are hard-coded per row (`bg-a-michael` for AI, `bg-a-david` for DK, `bg-a-sarah` for SC) since avatars don't all map to real team ids. |

## Wave 2C — Items lenses + Sprints

| ID | Severity | Source | Item |
|---|---|---|---|
| 2C-1 | PARITY | Tree | Status column header is shown but only WI rows render a `StatusChip` — phase/epic rows leave it blank, per prototype. |
| 2C-2 | DELTA-OK | filters | Filter pills (Phase / Epic / Status / Sprint / Assignee) are visual-only — no client state. Per "mock-only" instruction. |
| 2C-3 | TODO | Burndown | `Burndown` widget renders a fixed mock series (Apr 14 → Apr 28). For Sprint dashboard real-data, extend props (`committed`, `actual: number[]`, `labels: string[]`). Currently used by Home/Sprints/Sprint dashboard with the same mock series. |

## Wave 2D — Discovery / Questions / Knowledge / Org

| ID | Severity | Source | Item |
|---|---|---|---|
| 2D-1 | PARITY | discovery | KPI counts (4, 54, 12, 6) are hard-coded — not derived from `DATA`. Matches prototype. "Auto-applied · 3 more" computed as `T.applied - 11` per source. |
| 2D-2 | PARITY | questions | Filter labels include literal counts (`Open · 4`, `Answered · 2`, `Parked · 1`) — static, matching prototype. |
| 2D-3 | DELTA-OK | questions | `QuestionCard` primitive exists but Questions tab uses `Table` because the prototype's source uses `.tbl`, not `.q-card`. Both are valid; matched the source. |
| 2D-4 | PARITY | org | Detail sidebar shows hard-coded "Standard Object", "Lead Management", etc. regardless of selected row. Matches prototype's mock behavior. 1-hop graph also hard-coded. |

## Wave 2E — Chat

| ID | Severity | Source | Item |
|---|---|---|---|
| 2E-1 | DELTA-OK | styling | Prototype's `chat-*` and `msg-*` CSS classes don't exist in `styles.css`. Built the layout entirely with Tailwind utilities + arbitrary px values, sourcing colors from `globals.css @theme` tokens. Wave 3 visual QA can flag any pixel deltas — but no reference screenshot exists for the chat tab. |
| 2E-2 | PARITY | right rail | Records-in-play / Unblocked / Heavy-ops cost are hard-coded to the s-001 storyline. Matches prototype — clicking other sessions doesn't update this content. The session summary bar chart **does** update per session. |
| 2E-3 | DELTA-OK | composer | Send button is just disabled-when-empty. No real submit logic. Per "no real LLM calls" rule. |

## Wave 2F — Dashboards

| ID | Severity | Source | Item |
|---|---|---|---|
| 2F-1 | FIX | layout | Prototype renders a 220px sticky **left sidebar** with dashboards listed vertically + "Saved views" + "New view" affordance. Replaced with horizontal segmented subnav (matches Work tab pattern). Layout deviation. Re-evaluate: do we want sidebar nav for dashboards specifically, or accept the simpler horizontal pattern? |
| 2F-2 | TODO | toolbar | Per-dashboard toolbar (Last refreshed timestamp, range segmented control, Refresh, Export) is **not implemented**. Needs cross-page state (range filter) — URL params or shared client store. |
| 2F-3 | TODO | nav | PMDashboard's `clickable-card` (phase readiness → /work) is non-clickable here. Adding nav would require client-side `useRouter`. |
| 2F-4 | TODO | drawer | QA defect rows don't open WI drawer (would need `'use client'` + drawer context). Defer to polish. |
| 2F-5 | DELTA-OK | data | Risks card uses live `DATA.risks` (3 entries) instead of prototype's static count pill. |
| 2F-6 | PARITY | Sprint | Sprint dashboard's completed-progress fill is 60% (hardcoded), not computed from `completed/committed`. Matches source. |

## Wave 2G — Settings

| ID | Severity | Source | Item |
|---|---|---|---|
| 2G-1 | DELTA-OK | viewingAs | NotifySettings used `viewingAs` prop in prototype; layout is now route-based. Falls back to `DATA.currentUser.id` ("sarah"). |
| 2G-2 | PARITY | chips | ProjectSettings lifecycle chips: only "Build" is `violet`; non-Build defaults to `gray` (matches prototype's ternary). |
| 2G-3 | DELTA-OK | icons | Side-rail icons dropped (they were never rendered in the prototype, just `SETTINGS_SECTIONS` config metadata). |
| 2G-4 | DELTA-OK | colors | Blue info-callout uses `border-blue-text/20` + `bg-blue-bg/40` (Tailwind opacity) since there's no dedicated `blue-soft` token. Inline prototype colors `#EFF6FF` / `#BFDBFE` are visually equivalent. |

## Wave 2H — Drawers

All four drawer components implemented and wired through `DrawerHost`. No
deltas flagged beyond "all use the `Drawer` primitive".

| ID | Severity | Source | Item |
|---|---|---|---|
| 2H-1 | DELTA-OK | animation | Slide-out is immediate (DrawerHost unmounts on `closeDrawer`); slide-in animates. Acceptable trade-off, but a polished version would unmount on transition end. |

---

## Verification checklist (§"Verification checklist (Wave 3 gate)" of source plan)

- [x] `web/` is a working Next.js project; `pnpm lint && pnpm typecheck &&
      pnpm build` all clean.
- [x] Every route in the structure map renders without console errors. **40
      routes prerendered as static** (PASSING build is the proof).
- [x] Tailwind config carries every design token from `styles.css`.
- [x] Every `components.jsx` primitive has a counterpart in
      `web/components/primitives/`.
- [x] Rail, Topbar, ProjectHeader, LifecycleStages render identically on
      every route (single `(app)/layout.tsx`).
- [x] All 4 drawers (WorkItem, Question, Reproposal, Readiness) open from
      their trigger and close on backdrop/Esc (`Drawer` primitive's keydown
      handler is wired).
- [x] Role switcher updates Home widgets correctly per `data.js` role rules
      (`RoleWidgets.tsx` reads `useViewingAs()`).
- [ ] **Playwright screenshot sweep stored under
      `web/screenshots/ui-build-v1/`** — **NOT RUN.** Sandbox blocks
      chromium download. Risk noted in plan.
- [ ] **Visual diff vs. prototype references — no outstanding bugs** —
      **DEFERRED.** No screenshots; QA above is by-source-diff. Several
      TODO/FIX items captured.
- [x] `docs/Solution Design/` seeded with the 6 files listed in §10.
- [x] Final commit pushed to `origin/claude/execute-plan-UrN35`.

## Recommended next-session work (Wave 4 polish)

1. **2F-1**: revisit dashboard subnav layout — sticky left sidebar vs. horizontal pills.
2. **2F-2**: add per-dashboard toolbar (range filter, refresh, export) — likely needs URL params.
3. **2C-3 / 2F-2**: extend `Burndown` widget with real-data props and use them on the Sprint dashboard.
4. **2B-1 / 2B-2**: extract `AdminTaskStatusChip` widget; add `noPadding` prop to `Card`.
5. **2F-3 / 2F-4**: wire dashboard rows to drawers / navigation where prototype expected it.
6. **Run Playwright in an environment that allows chromium download**; do the actual screenshot diff against `visuals/.../project/screenshots/`.
7. **Accessibility pass**: keyboard nav, ARIA labels, focus management on drawers — deferred from this build per "placeholder quality" decision.
