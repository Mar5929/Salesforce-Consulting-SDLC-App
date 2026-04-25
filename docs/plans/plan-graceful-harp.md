# Plan: Build the SDLC App UI from the Claude Design Handoff

**Owner:** Michael Rihm
**Working dir:** `C:\Users\michael.rihm\Documents\Claude_Projects\Salesforce-Consulting-SDLC-App`
**Scope:** Front-end UI only. No backend, no auth, no data persistence in this pass.
**Model for execution:** Opus 4.7 (1M context) recommended; agent teams spawned via the `Agent` tool with `subagent_type: Explore` for research and general-purpose for implementation.

---

## Context

Michael is pivoting off "spec-only, no code" discipline for a deliberate reason: a Claude Design export landed at `visuals/claude-design-exports/salesforce-consulting-sdlc-app/` that captures what the app looks like and functionally does, end to end. He wants to use it as the concrete starting point for the real code instead of continuing to write spec text for the remaining 17 of 24 PRODUCT_SPEC sections. Spec work on §§1–7 continues in a parallel track (separate plan); this plan covers only the UI build.

The handoff's `README.md` is explicit: **recreate pixel-perfectly, in whatever tech makes sense for the target codebase, by reading the HTML/CSS source directly.** The prototype is React + inline CSS + no build step. The production target is Next.js + Tailwind + TypeScript (per Michael's global UI rules in `~/.claude/rules/ui-development.md`).

A separate folder for design/architecture content will be created at `docs/Solution Design/` (see §10 below) so `PRODUCT_SPEC` stays functional-only per the existing memory rule.

---

## Non-goals (out of scope for this plan)

- No backend, API, or database. `data.js` is ported as a static TypeScript module; all screens read from it.
- No authentication, role gating, multi-tenant concerns. Role switcher is a UI toggle that changes which mock user is `currentUser`.
- No real AI calls. Re-proposal banners, confidence scores, and briefings are static mock content.
- No Salesforce integration. Org tab renders from mock components in `data.js`.
- No Jira/Linear integration. Jira sync screen renders in its disabled-and-configured states from static config.
- No i18n, no analytics, no error tracking.
- No changes to `PRODUCT_SPEC.md` or its subfiles (handled in a separate plan).

---

## Tech stack — decided

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Routing for the 10 tabs + subroutes, React conventions, SSR optional, aligns with Michael's stack posture |
| Styling | **Tailwind CSS v4** | Global UI rule mandates Tailwind; prototype's 1361-line `styles.css` ports cleanly to `tailwind.config` + `@theme` tokens |
| Icons | **Custom inline SVG** | Prototype defines 26 icons in `components.jsx`; port verbatim, no external icon library |
| Fonts | **`next/font` loading Inter + JetBrains Mono** | Matches prototype's Google Fonts load |
| State | **React `useState` + React Context for app-wide state** (viewing-as role, active drawer) | Prototype uses `useState` + `window.DATA`; keep equivalently simple |
| Routing | **Next.js App Router** (`app/(app)/home`, `app/(app)/work/items`, etc.) | One route per prototype tab/subnav leaf |
| Data | **`data.ts` static module** (port of `data.js`) | All screens read from this; no async, no fetch |
| Testing | **Playwright** (screenshot comparison against reference prototype screenshots) | Global UI rule; reference screenshots already exist at `project/screenshots/` |
| Lint/format | **ESLint (Next preset) + Prettier** | Michael's quality bar: clean lint + typecheck + test before merge |
| Package mgr | **pnpm** | Fast, disk-efficient; no strong requirement otherwise |

---

## Project structure

Create the app at `web/` at repo root (no monorepo).

```
web/
├─ app/
│  ├─ layout.tsx                    # Root layout (fonts, Rail, Topbar, ProjectHeader shell)
│  ├─ globals.css                   # Tailwind directives + design tokens + fonts
│  ├─ page.tsx                      # Redirect to /home
│  ├─ (app)/
│  │  ├─ home/page.tsx              # Home (home.jsx)
│  │  ├─ discovery/page.tsx         # Discovery (tabs.jsx: Discovery)
│  │  ├─ questions/page.tsx         # Questions (tabs.jsx: Questions)
│  │  ├─ work/
│  │  │  ├─ layout.tsx              # Work subnav
│  │  │  ├─ page.tsx                # redirect to work/home
│  │  │  ├─ home/page.tsx           # Work Home (work.jsx: WorkHome)
│  │  │  ├─ admin/page.tsx          # Admin Tasks (work.jsx: AdminTasks)
│  │  │  ├─ roadmap/page.tsx        # Roadmap (work.jsx: Roadmap)
│  │  │  ├─ items/
│  │  │  │  ├─ layout.tsx           # Lens switcher
│  │  │  │  ├─ tree/page.tsx        # TreeLens
│  │  │  │  ├─ board/page.tsx       # BoardLens
│  │  │  │  └─ timeline/page.tsx    # TimelineLens
│  │  │  └─ sprints/page.tsx        # Sprints
│  │  ├─ knowledge/page.tsx         # Knowledge (tabs.jsx: Knowledge)
│  │  ├─ org/page.tsx               # Org (tabs.jsx: Org)
│  │  ├─ chat/page.tsx              # Chat (chat.jsx)
│  │  ├─ documents/page.tsx         # Documents placeholder
│  │  ├─ dashboards/
│  │  │  ├─ layout.tsx              # Dashboard subnav
│  │  │  ├─ pm/page.tsx             # PMDashboard
│  │  │  ├─ sprint/page.tsx         # SprintDashboard
│  │  │  ├─ roadmap/page.tsx        # RoadmapDashboard
│  │  │  ├─ qa/page.tsx             # QADashboard
│  │  │  ├─ usage/page.tsx          # UsageDashboard
│  │  │  └─ health/page.tsx         # HealthDashboard
│  │  └─ settings/
│  │     ├─ layout.tsx              # Settings subnav (project + firm groups)
│  │     ├─ project/page.tsx        # ProjectSettings
│  │     ├─ team/page.tsx           # TeamSettings
│  │     ├─ salesforce/page.tsx     # SalesforceSettings
│  │     ├─ jira/page.tsx           # JiraSettings
│  │     ├─ ai/page.tsx             # AISettings
│  │     ├─ health/page.tsx         # HealthSettings
│  │     ├─ notifications/page.tsx  # NotifySettings
│  │     ├─ guardrails/page.tsx     # GuardrailsSettings
│  │     ├─ branding/page.tsx       # BrandingSettings
│  │     ├─ naming/page.tsx         # NamingSettings
│  │     ├─ security/page.tsx       # SecuritySettings
│  │     └─ billing/page.tsx        # BillingSettings
├─ components/
│  ├─ primitives/                   # Avatar, Chip, StatusChip, Readiness, Icon, Drawer, Card, Button, Table
│  ├─ shell/                        # Rail, Topbar, ProjectHeader, LifecycleStages, ViewingAs
│  ├─ drawers/                      # WorkItemDrawer, QuestionDrawer, ReproposalDrawer, ReadinessDrawer
│  └─ widgets/                      # Reusable widget cards (KPI, AICard, Burndown, etc.)
├─ lib/
│  ├─ data.ts                       # Port of project/data.js (typed)
│  ├─ types.ts                      # Entity interfaces (Project, Phase, Epic, WorkItem, Question, ...)
│  └─ context.tsx                   # ViewingAsProvider, DrawerProvider
├─ tailwind.config.ts               # Design tokens (colors, spacing, radii, shadows) ported from styles.css
├─ tests/
│  └─ screenshots/                  # Playwright specs, one per route
├─ public/                          # No assets initially (icons are inline SVG)
├─ package.json
├─ tsconfig.json
├─ next.config.ts
├─ .eslintrc.json
├─ .prettierrc
└─ README.md                        # Short — points back to plan + design docs
```

---

## Agent team waves

Waves 1→3 run sequentially. Within a wave, spawn every agent in **a single message with parallel `Agent` tool calls**.

### Wave 0 — Foundation (SINGLE agent, sequential to Wave 1)

**Agent: Bootstrap**
- Create `web/` with Next.js 15 + TypeScript + Tailwind + ESLint + Prettier.
- Use `pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir=false --import-alias '@/*'`.
- Install Playwright: `pnpm add -D @playwright/test` + `pnpm exec playwright install chromium`.
- Port fonts via `next/font/google` (Inter + JetBrains Mono) in `app/layout.tsx`.
- Port design tokens from `visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/styles.css` into `tailwind.config.ts`:
  - Colors: slate scale, indigo accent `#4F46E5`, semantic green/yellow/red, status chip backgrounds, avatar colors, logo gradient.
  - Typography: 10.5px–22px scale, 1.45–1.65 line-heights, 0.04–0.06em tracking.
  - Spacing: 6/8/10/12/14/16/18/20/22 px scale.
  - Radii: 3/4/5/6/8/10/12/20 px.
  - Shadows: modal, menu, card hover, kanban card.
  - Width tokens: rail 240px, topbar 44px, drawer 640/900/1080px.
- Create `lib/types.ts` from the entities surfaced in the prototype: `Project`, `User`, `Phase`, `Epic`, `Feature`, `WorkItem`, `Question`, `Decision`, `Risk`, `AdminTask`, `Sprint`, `Component`, `Domain`, `Reproposal`, `ChatSession`, `ChatMessage`, `ExtractedRecord`. Use the enum values from `data.js` exactly.
- Port `project/data.js` to `lib/data.ts` as typed exports. Exact string values. No transformations.
- Commit: `chore: bootstrap web/ with Next.js + Tailwind + design tokens`.

**Exit criterion:** `pnpm dev` serves a blank route at localhost; `pnpm lint && pnpm typecheck && pnpm build` all clean.

---

### Wave 1 — Shell + primitives (3 agents, PARALLEL)

All three read `project/components.jsx`, `project/styles.css`, and `project/index.html` as references.

**Agent 1A — Shared primitives** (`components/primitives/`)
- Port every component from `components.jsx`: `Avatar`, `Chip` (all tone variants), `StatusChip` (mapped to data.statuses), `Readiness` (bar + percentage, color thresholds 80/60), `Icon` (all 26 named icons as inline SVG), `Drawer` (right-slide, 640/900/1080 widths, Esc-closes, backdrop 0.35 opacity), `Card` variants (`.card`, `.kpi`, `.ai-card`, `.q-card`), `Button` (`.btn`, `.primary`, `.ghost`, `.danger`, `.amber`, `.sm`), `Table` (`.tbl` with sticky header + row states).
- Every component is a TypeScript React component with typed props.
- No styling leaks — all styles via Tailwind classes keyed to the design tokens.

**Agent 1B — App shell** (`components/shell/` + `app/layout.tsx` + `app/(app)/layout.tsx`)
- Port `Rail` (left sidebar, 240px, dark navy, gradient logo, section headers, nav items with badges, user block + role tweaks menu).
- Port `Topbar` (44px sticky, breadcrumb + search + action icons).
- Port `ProjectHeader` (title, health indicator, viewing-as switcher dropdown, lifecycle stages strip, horizontal tabs with counts).
- Wire up Next.js routing — each top-level tab is a link to its route under `app/(app)/`.
- `LifecycleStages` component: 8 pills (Initialization → Archive) with active pulsing dot.
- `ViewingAs` menu: opens role switcher dropdown, updates React Context.

**Agent 1C — Context + drawer host** (`lib/context.tsx`)
- `ViewingAsProvider` — holds current "viewing as" user, exposes `useViewingAs()`.
- `DrawerProvider` — owns active drawer state (type + payload), exposes `openDrawer`, `closeDrawer`, `useDrawer()`. Prototype uses `window.dispatchEvent(new CustomEvent('open-readiness'))` — replace with React Context.
- Mount `<DrawerHost />` at app layout level; it renders the correct drawer based on context state.

**Exit criterion:** Running the app shows the Rail, Topbar, ProjectHeader, and lifecycle stages rendered identically to the prototype's index.html at `/home` (even though `/home` page body is still empty). Lint + typecheck + build still clean.

---

### Wave 2 — Feature tabs (8 agents, PARALLEL)

Each agent owns one or more pages. Every agent:
- Reads its source JSX files in full before writing.
- Creates Playwright screenshot tests for each page it owns under `tests/screenshots/`.
- Runs the screenshot loop (write → `pnpm dev` → Playwright screenshot → visually compare to reference PNG in `visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/screenshots/` or the matching prototype render → iterate until matches).
- Uses primitives from `components/primitives/` only — does not re-define Avatar, Chip, etc.

| Agent | Owns | Source files |
|---|---|---|
| 2A | Home tab | `home.jsx` |
| 2B | Work tab (shell + Home + Admin + Roadmap) | `work.jsx` (WorkHome, AdminTasks, Roadmap sections) |
| 2C | Work > Items (3 lenses) + Sprints | `work.jsx` (TreeLens, BoardLens, TimelineLens, Sprints) |
| 2D | Discovery + Questions + Knowledge + Org | `tabs.jsx` |
| 2E | Chat tab (sessions list + thread + right rail) | `chat.jsx` |
| 2F | Dashboards (6 views) | `dashboards.jsx` |
| 2G | Settings (13 screens) | `settings.jsx` |
| 2H | Drawers (WorkItem, Question, Reproposal, Readiness) | `drawers.jsx` |

**Coordination rules:**
- If an agent needs a new primitive not in `components/primitives/`, it adds it there and notes the addition in its final report. Do not fork primitives into the feature folder.
- If two agents need the same widget (e.g., a KPI card used on both Home and a Dashboard), it goes in `components/widgets/`.
- Every agent runs `pnpm lint && pnpm typecheck && pnpm build` before reporting done. No merge without clean output.

**Exit criterion per agent:** All pages owned render; Playwright screenshots captured; visual diff vs. prototype reference screenshots is within acceptable tolerance (no missing sections, layout matches, colors match). Agent's final report includes: (1) list of files created/changed, (2) screenshots captured with filenames, (3) any primitives added, (4) any deltas from the prototype flagged for Michael.

---

### Wave 3 — Integration + verification (single sequential pass)

Done by the top-level agent, not a sub-agent.

1. **Full-route screenshot sweep.** Run Playwright across every route. Save under `screenshots/ui-build-v1/`.
2. **Visual QA pass.** Open each captured screenshot alongside the matching prototype reference. Any meaningful mismatch (wrong layout, missing section, wrong color, bad typography) goes into a bug list at `docs/Solution Design/ui-build-v1-bugs.md`.
3. **Fix cycle.** For each bug: identify owner file, fix, re-screenshot, verify. Repeat until empty.
4. **Lint + typecheck + test final gate.** `pnpm lint && pnpm typecheck && pnpm build && pnpm playwright test`. All green.
5. **Commit the full build** in one feat commit per wave, with screenshots attached in a comment on the commit message (or as a PR if Michael prefers).

---

## Solution Design folder — seeding

While Wave 0 runs, create `docs/Solution Design/` and seed with:
- `README.md` — purpose of the folder (holds architecture, data model, UI design, build sequence — everything excluded from PRODUCT_SPEC by the "no design styling in spec" rule).
- `ui/design-tokens.md` — exact color/typography/spacing/radius/shadow tables ported from `styles.css`.
- `ui/components.md` — one row per primitive with props, variants, states.
- `ui/navigation-map.md` — top-level tabs, subnav per tab, every route in `app/(app)/`.
- `ui/data-model.md` — entities + fields + enums + relationships derived from `data.js`, formatted as TypeScript-adjacent pseudocode. Flag this is the **frontend mock model**, not the eventual backend schema.
- `ui/handoff-notes.md` — verbatim copy of key directives from the Claude Design handoff README (read in full, follow imports, don't screenshot the prototype to understand it, ask for clarification if ambiguous).

This folder is the durable home for decisions that inform code but don't belong in PRODUCT_SPEC.

---

## Open questions to resolve before Wave 0 kicks off

Ask Michael on session start. All have defaults if he wants to move fast.

1. **App location?** `web/` at repo root (recommended) vs. `apps/web/` (monorepo-ready) vs. repo root itself (no subfolder).
2. **Port or use as `/docs/Solution Design/` name?** Alternatives: `docs/Design/`, `docs/Architecture/`, `docs/Technical Design/`. Defaulting to `Solution Design` matches the language he used in the earlier question.
3. **Package manager?** pnpm (recommended) vs. npm vs. yarn.
4. **Production-strength from day 1, or intentional placeholder quality?** If production, Wave 2 needs ARIA labels, keyboard nav, focus management on drawers. If placeholder, defer to a Wave 4 accessibility pass.
5. **Does he want the `data.js` → `data.ts` port to clean up any obvious inconsistencies (missing FKs, spelling)**, or preserve bug-for-bug?
6. **Commit cadence** — one commit per wave (recommended) vs. one per agent vs. one big commit at the end.

---

## Critical files the new session must read first

Absolute paths on Windows (forward slashes are fine in reads):

1. `C:/Users/michael.rihm/.claude/plans/i-have-mvp-requirements-graceful-harp.md` — this plan.
2. `C:/Users/michael.rihm/Documents/Claude_Projects/Salesforce-Consulting-SDLC-App/CLAUDE.md` — project-level rules.
3. `C:/Users/michael.rihm/.claude/CLAUDE.md` and `C:/Users/michael.rihm/.claude/rules/ui-development.md` — UI stack posture, screenshot workflow, writing style rules.
4. `C:/Users/michael.rihm/Documents/Claude_Projects/Salesforce-Consulting-SDLC-App/visuals/claude-design-exports/salesforce-consulting-sdlc-app/README.md` — handoff directives.
5. `C:/Users/michael.rihm/Documents/Claude_Projects/Salesforce-Consulting-SDLC-App/visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/index.html` — the primary design file. Read top to bottom.
6. `C:/Users/michael.rihm/Documents/Claude_Projects/Salesforce-Consulting-SDLC-App/visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/styles.css` — 1361 lines of design tokens + component styles.
7. `C:/Users/michael.rihm/Documents/Claude_Projects/Salesforce-Consulting-SDLC-App/visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/components.jsx` — primitives.
8. `C:/Users/michael.rihm/Documents/Claude_Projects/Salesforce-Consulting-SDLC-App/visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/data.js` — mock data.
9. All other `.jsx` in `project/` — feature pages.

---

## Verification checklist (Wave 3 gate)

- [ ] `web/` has full Next.js project, lint + typecheck + build all clean.
- [ ] Every route in the structure map above renders without console errors.
- [ ] Tailwind config has every design token from `styles.css`, named consistently.
- [ ] Every primitive in `components.jsx` has a ported counterpart in `components/primitives/`.
- [ ] Rail, Topbar, ProjectHeader, LifecycleStages render identically to prototype on every route.
- [ ] All 4 drawers (WorkItem, Question, Reproposal, Readiness) open from their trigger and close on backdrop/Esc.
- [ ] Role switcher (`ViewingAs`) updates Home widgets correctly per `data.js` role rules.
- [ ] Playwright screenshot sweep complete, stored under `screenshots/ui-build-v1/`.
- [ ] Visual diff vs. prototype reference PNGs has no outstanding bugs.
- [ ] `docs/Solution Design/` seeded with the 6 files listed in §10.

---

## Memory updates the new session should make

The pivot off spec-only-mode needs to be recorded:

- Update `MEMORY.md` + `project_overview.md` + `session_history.md`: phase changed from "spec-only" to "spec §§1–7 in maintenance + UI code build in Wave 1". Date the change 2026-04-24.
- Update `feedback_no_design_styling_in_spec.md`: append a note that design/architecture content now lives in `docs/Solution Design/` — the rule on PRODUCT_SPEC is unchanged (still functional-only), but design has a documented home.
- Leave `feedback_schema_first.md`, `feedback_quality_bar.md`, `feedback_ui_screenshot_loop.md` untouched — they all still apply.

---

## Handoff prompt (paste this into the fresh session)

```text
Read C:/Users/michael.rihm/.claude/plans/i-have-mvp-requirements-graceful-harp.md in full before doing anything else.

Also read, in this order:
1. C:/Users/michael.rihm/Documents/Claude_Projects/Salesforce-Consulting-SDLC-App/CLAUDE.md
2. C:/Users/michael.rihm/.claude/CLAUDE.md and the rule files under C:/Users/michael.rihm/.claude/rules/ (especially ui-development.md, writing-style.md, ask-before-assuming.md, goal-driven-pushback.md)
3. The memory index at C:/Users/michael.rihm/.claude/projects/C--Users-michael-rihm-Documents-Claude-Projects-Salesforce-Consulting-SDLC-App/memory/MEMORY.md

Then:
- Ask me the six open questions in §"Open questions to resolve before Wave 0 kicks off" of the plan. Use AskUserQuestion. Default values are fine if I say so.
- Once I answer, execute Wave 0 (Bootstrap agent) yourself directly — it's sequential foundation work, no parallelism needed.
- After Wave 0's exit criterion is met, spawn Wave 1 as three parallel Agent tool calls in a single message.
- After Wave 1's exit criterion is met, spawn Wave 2 as eight parallel Agent tool calls in a single message.
- After Wave 2, run Wave 3 (integration + verification) yourself.

Quality bar from memory (non-negotiable): no merge without clean lint + typecheck + build. Every UI change screenshot-verified via Playwright before claiming done. Schema-first discipline doesn't apply here because there's no backend in this pass — `data.ts` is the source of truth.

Don't start any work outside this plan. If you think the plan is wrong, tell me before deviating.
```
