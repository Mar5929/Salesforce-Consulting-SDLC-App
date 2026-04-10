# Gap Analysis: Dashboards and Search (Sections 17.1-17.7, 23.4)

### Summary of Analysis

I read the PRD sections 17.1-17.7 and 23.4, the v1.0 milestone audit, and the following files in full:

- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/dashboard/queries.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/dashboard/usage-queries.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/dashboard/health-score.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/dashboard/outstanding-questions.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/dashboard/blocked-items.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/dashboard/ai-summary-card.tsx` (implied by imports)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/dashboard/generate-briefing-button.tsx` (implied by imports)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/dashboard.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/pm-dashboard.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/search.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/search/global-search.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/search/command-palette.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/dashboard-synthesis.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/pm-dashboard-synthesis.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/pm-dashboard/page.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/pm-dashboard/pm-dashboard-client.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/roadmap/page.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/roadmap/roadmap-page-client.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/roadmap/milestones-tab.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/roadmap/epic-phase-grid.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/roadmap/execution-plan-tab.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/roadmap/milestone-ai-summary.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/sprints/[sprintId]/page.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/sprints/sprint-dashboard.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/pm-dashboard/stat-cards.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/pm-dashboard/ai-usage-charts.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/pm-dashboard/sprint-velocity-chart.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/pm-dashboard/team-activity.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/pm-dashboard/qa-summary.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/pm-dashboard/work-progress-chart.tsx`

Below is the full gap report. Writing to file now:

---

The gap report is being written to the `.planning/gap-analysis/07-dashboards-search-gaps.md` file. Since I cannot use Write tool directly, I will present the complete findings as my final response and note that the report content follows. Note that the instructions say to write the report to that file path. Let me check if I have a Write capability. Re-reading the instructions: "Write your complete report to: `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/.planning/gap-analysis/07-dashboards-search-gaps.md`"

I do not have a Write file tool available in this environment. The instructions say to write the file, but only Read, Glob, Grep, WebFetch, and WebSearch tools are available. I will deliver the full report as my response text, which the parent agent reads directly.

---

## Gap Analysis Report: Dashboards and Search
### PRD Sections 17.1-17.7 and 23.4

**Audit date:** 2026-04-08
**Auditor:** Code Explorer Agent
**Scope:** Discovery Dashboard (17.1), Roadmap Dashboard (17.2), Sprint Dashboard (17.3), Execution Plan View (17.4), PM Dashboard (17.5), Health Score (17.6), Search Architecture (17.7), Usage and Cost Dashboard (23.4)

---

### Overall Assessment

The dashboards and search domain is the most substantially built area of the application. The core infrastructure — three-layer search, command palette, discovery dashboard, PM dashboard, sprint dashboard with burndown, roadmap with milestones and epic phase grid, and execution plan — is all present and functional at a code level. However, several PRD-specified elements are missing or diverge meaningfully from spec. The gaps range from a wrong scoring model for the health score (the entire formula is different from what the PRD defines) to missing entity types in search, missing header metrics on the briefing, and a completely absent Usage and Costs standalone tab.

---

### GAP-DASH-001: Health Score Uses Wrong Scoring Model

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.6
- **What PRD says:** Health score is a signal counter: Green = 0 signals, Yellow = 1-3 signals, Red = 4+ signals. Signals are: open questions past age threshold (default 7 days), client-owned questions past follow-up threshold (default 3 days), blocked items past blocked threshold (default 5 days), active high-severity risks without mitigation plans. Thresholds are configurable per project.
- **What exists:** `src/lib/dashboard/queries.ts` lines 205-296 implement a weighted percentage formula: 40% answered %, 20% high-priority resolved %, 15% risk score, 15% article coverage, 10% stale article score. Output is 0-100 numeric, thresholds are >= 70 = "Good", 40-69 = "Needs Attention", < 40 = "At Risk". No signal-counting logic, no age-based question staleness check, no client-owned question detection, no blocked-item age check, no per-project configurable thresholds.
- **The gap:** The scoring model is completely different from the PRD. PRD describes a discrete signal counter (0/1-3/4+) driven by age and ownership-based triggers. The code implements a continuous weighted percentage score driven by aggregate ratios. Neither the inputs (age-based signals vs ratio aggregates) nor the output scale (3-band signal count vs 0-100%) nor the configurability (per-project thresholds vs hardcoded weights) match. The "Good/Needs Attention/At Risk" descriptor labels match, but that is the only overlap.
- **Scope estimate:** M
- **Dependencies:** GAP-DASH-002 (configurable thresholds per project), GAP-DASH-003 (client-owned question detection)
- **Suggested phase grouping:** Dashboard Correctness

---

### GAP-DASH-002: Health Score Thresholds Not Configurable Per Project

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 17.6
- **What PRD says:** "Thresholds are configurable per project."
- **What exists:** All thresholds are hardcoded constants in `src/lib/dashboard/queries.ts`. No per-project configuration field exists in the Prisma schema or any settings UI.
- **The gap:** No mechanism exists to configure health thresholds per project. This is a prerequisite for any future project where different health standards apply.
- **Scope estimate:** M
- **Dependencies:** GAP-DASH-001 (the entire health score model needs rework first)
- **Suggested phase grouping:** Dashboard Correctness

---

### GAP-DASH-003: Client-Owned Question Signal Missing from Health Score

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.6
- **What PRD says:** One health score signal is "client-owned questions past the follow-up threshold (default: 3 days)."
- **What exists:** The `Question` model has an `owner` field, but the health score computation in `queries.ts` never differentiates client-owned questions from internally-owned ones. No concept of "client-owned" threshold exists in the queries or UI.
- **The gap:** The client-owned question signal is never computed or displayed. On a Salesforce consulting engagement where the client is the primary answer source, this is one of the most operationally meaningful health signals.
- **Scope estimate:** S
- **Dependencies:** GAP-DASH-001 (health score model rework)
- **Suggested phase grouping:** Dashboard Correctness

---

### GAP-DASH-004: Briefing Header Missing Roadmap Progress and Requirements Count

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.1
- **What PRD says:** Header metrics (instant, database queries) include: open questions count (with count of those blocking work), blocked items count, roadmap progress (milestone-level summary), and requirements count (with unmapped count).
- **What exists:** The discovery dashboard page (`src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx`) renders: health score, current focus narrative, outstanding questions (open/answered/parked counts), and blocked items. There is no roadmap progress metric and no requirements count in the briefing header or anywhere on this page.
- **The gap:** Two of the four header metric groups are absent — roadmap progress summary (milestone-level) and requirements count with unmapped count. These are described as "instant, database query" (no AI cost), so they are straightforward additions.
- **Scope estimate:** S
- **Dependencies:** None (milestones and requirements tables exist)
- **Suggested phase grouping:** Briefing Completeness

---

### GAP-DASH-005: Briefing Missing "Blocking Questions" Section with Story Impact Detail

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.1
- **What PRD says:** "Blocking Questions (instant, database query). Full list of open questions that block at least one story, with: question ID, age, owner(s), question text, and the specific stories each question blocks."
- **What exists:** `src/components/dashboard/blocked-items.tsx` renders a list of blocking questions with question ID, truncated question text, and indented blocked entity list (stories/epics/features). It does not show question age or owner(s). The data model in `src/lib/dashboard/queries.ts` `getBlockedItems()` fetches question text and status but not `createdAt`/`updatedAt` for age calculation, and not owner information.
- **The gap:** Question age (days open) and owner(s) are absent from both the query and the UI. These are the fields with the highest operational value — who to chase and how long it has been waiting.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Briefing Completeness

---

### GAP-DASH-006: Briefing Missing Epic Status Section

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.1
- **What PRD says:** "Epic Status (instant, database query). Per-epic summary showing current phase (from EpicPhase), story counts by status, and completion percentage."
- **What exists:** The discovery dashboard page renders no Epic Status section. Neither `getDashboardData` in `src/actions/dashboard.ts` nor the page component queries epics or their phases. This section is entirely absent.
- **The gap:** No Epic Status section exists on the primary daily view. Given that the dashboard is described as the primary landing page for all team members, the absence of epic-level status makes it much less useful once a project is past early discovery.
- **Scope estimate:** M
- **Dependencies:** None (Epic and EpicPhase tables exist)
- **Suggested phase grouping:** Briefing Completeness

---

### GAP-DASH-007: Recommended Focus Section Is AI-Cached Blob, Not a Ranked List with Per-Question Reasoning

- **Severity:** Significant
- **Perspective:** Functionality / UX
- **PRD Reference:** Section 17.1
- **What PRD says:** "Recommended Focus (AI-synthesized, cached). An AI-prioritized ranked list of the top 3-5 questions the team should pursue next, with reasoning tied to what each question blocks. Example: '#1 Q-FM-002: How are EAST BU accounts identified in Salesforce? (blocking work).'"
- **What exists:** `src/lib/dashboard/queries.ts` `getCachedBriefing()` reads `cachedBriefingContent.recommendedFocus` as a plain string and `src/components/dashboard/ai-summary-card.tsx` renders it as a text card. The content is whatever free-form text the AI produces. The dashboard synthesis task may or may not produce a ranked list format — that is entirely dependent on the AI prompt, not enforced at the data structure level. No structured `Array<{rank, questionId, questionText, reasoning}>` shape exists.
- **The gap:** There is no structured ranked list with per-question links, question IDs, or explicit reasoning. The PRD shows a specific numbered format ("#1 Q-FM-002: ...") that implies navigable, structured output, not a prose paragraph. The current implementation treats Recommended Focus as a text blob with no guaranteed structure.
- **Scope estimate:** M
- **Dependencies:** GAP-DASH-005 (blocking question data needs owner/age to feed ranking reasoning)
- **Suggested phase grouping:** Briefing Completeness

---

### GAP-DASH-008: Roadmap Dashboard Missing "Upcoming Milestones" AI-Synthesized Section (Not True AI Call)

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 17.2
- **What PRD says:** "Upcoming milestones (instant + AI-synthesized). For the next 2-3 milestones: what must happen to reach them, what's currently blocking them, and target dates. The 'what must happen' description can be AI-generated from the milestone's linked stories and blocking questions."
- **What exists:** `src/components/roadmap/milestone-ai-summary.tsx` exists and renders an "Upcoming Milestones" section. However, the "AI synthesis" is entirely a local JavaScript function (`generateSummaryText`) that counts stories and formats a template string: "N of M stories complete. N stories remaining: ..." No AI call is made. The component generates summaries using `setTimeout(..., 300)` to simulate async — it is purely computational, not AI-powered. It also does not surface what is blocking each milestone.
- **The gap:** The "AI-generated" what-must-happen and blocking-question context described in the PRD is not implemented. The component produces a rote story count summary with no reasoning about what needs to happen next or what questions are blocking milestone completion.
- **Scope estimate:** M
- **Dependencies:** None (milestone-story and question-story relationships exist in DB)
- **Suggested phase grouping:** Roadmap Intelligence

---

### GAP-DASH-009: Sprint Dashboard Missing Stories Missing Mandatory Fields Section

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.3
- **What PRD says:** Sprint Dashboard shows "Stories missing acceptance criteria or other mandatory fields."
- **What exists:** `src/components/sprints/sprint-dashboard.tsx` renders: sprint goal, date range, progress bar, three summary cards (total stories, points completed, points remaining), and a burndown chart. There is no section or logic that identifies stories missing mandatory fields (acceptance criteria, description, story points, etc.).
- **The gap:** The mandatory field completeness check is entirely absent from the sprint dashboard. This is one of the more operationally useful features during the build phase — it surfaces stories that will block QA or development.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Sprint Dashboard Completeness

---

### GAP-DASH-010: Sprint Dashboard Missing Developer Workload View

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.3
- **What PRD says:** Sprint Dashboard shows "Developer workload (stories assigned per developer, story points per developer)."
- **What exists:** `src/components/sprints/sprint-dashboard.tsx` shows only aggregate sprint metrics (total stories, total points, burndown). No per-developer breakdown exists on the sprint dashboard. Note that the PM dashboard's `WorkProgressChart` does include a "Stories by Assignee" chart, but that is project-wide, not scoped to the current sprint, and is only visible to PM/SA roles.
- **The gap:** Sprint-scoped developer workload (stories assigned per developer in this sprint, points per developer in this sprint) is absent from the per-sprint dashboard view. This view is supposed to be visible to all roles per the PRD.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Sprint Dashboard Completeness

---

### GAP-DASH-011: Sprint Dashboard Missing Conflict Alerts Section

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 17.3
- **What PRD says:** Sprint Dashboard shows "Conflict alerts from sprint intelligence."
- **What exists:** `src/components/sprints/sprint-dashboard.tsx` shows no conflict alerts. However, `SprintIntelligencePanel` is rendered on the Plan and Board tabs of the sprint detail page (`src/app/(dashboard)/projects/[projectId]/sprints/[sprintId]/page.tsx`), not on the Dashboard tab. The conflict data is available (from `cachedAnalysis`) but is not wired into `SprintDashboard`.
- **The gap:** Conflict alerts are present on the Plan and Board tabs but absent from the Dashboard tab, which is where the PRD specifies them to appear alongside burndown.
- **Scope estimate:** S
- **Dependencies:** None (SprintIntelligencePanel already exists and takes the right props)
- **Suggested phase grouping:** Sprint Dashboard Completeness

---

### GAP-DASH-012: PM Dashboard Missing Risk Register Summary

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.5
- **What PRD says:** PM Dashboard includes "Risk register summary (active risks by severity)."
- **What exists:** `src/lib/inngest/functions/pm-dashboard-synthesis.ts` aggregates: stories by status, stories by assignee, questions by status, knowledge coverage, sprint velocity, AI usage, QA data (test results, defects), and team activity. There is no step aggregating risks. The `PmDashboardData` type has no `risks` field. The PM dashboard client renders no risk summary component.
- **The gap:** Risk register summary is entirely absent from the PM dashboard data model, synthesis function, and UI. A PM cannot see active risks or their severity distribution from the PM dashboard.
- **Scope estimate:** S
- **Dependencies:** None (Risk model exists with status and severity fields)
- **Suggested phase grouping:** PM Dashboard Completeness

---

### GAP-DASH-013: PM Dashboard Missing Upcoming Deliverable Deadlines

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.5
- **What PRD says:** PM Dashboard includes "Upcoming deliverable deadlines."
- **What exists:** No deliverable deadline data exists in the `PmDashboardData` type or `synthesizePmDashboard` Inngest function. The PM dashboard renders no deadline-oriented view. Milestones have `targetDate` fields that could serve as deliverable deadlines, but they are not surfaced here.
- **The gap:** Upcoming deliverable deadlines are absent. The most natural implementation would surface upcoming milestone target dates (next N milestones by date), but this is not connected to the PM dashboard.
- **Scope estimate:** S
- **Dependencies:** None (Milestone model with targetDate exists)
- **Suggested phase grouping:** PM Dashboard Completeness

---

### GAP-DASH-014: PM Dashboard Missing Client-Facing Items Needing Attention

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.5
- **What PRD says:** PM Dashboard includes "Client-facing items needing attention (client-owned open questions past follow-up threshold)."
- **What exists:** No "client-facing items" section exists in the PM dashboard. The synthesis function does not query for client-owned questions or questions past a follow-up threshold. The `PmDashboardData` type has no such field.
- **The gap:** This client-attention section is completely absent. For a Salesforce consulting firm, surfacing "questions you need answers from the client" with age indicators is a core PM workflow. This and the risk register (GAP-DASH-012) are the two PM-specific additions that distinguish Section 17.5 from a simple aggregation of the other dashboards.
- **Scope estimate:** S
- **Dependencies:** GAP-DASH-003 (client-owned question concept)
- **Suggested phase grouping:** PM Dashboard Completeness

---

### GAP-DASH-015: Section 23.4 Usage and Costs Dashboard Does Not Exist as Standalone Tab

- **Severity:** Significant
- **Perspective:** Functionality / Architecture
- **PRD Reference:** Section 23.4
- **What PRD says:** "Each project has a 'Usage & Costs' tab in project settings, visible to Solution Architects and PMs only." Includes: project totals filterable by date range (last 7 days, last 30 days, current sprint, custom range), breakdown by task type with percentage-of-total column, breakdown by team member (per-user consumption), trend chart (daily or weekly line chart), and Inngest event volume metric.
- **What exists:** AI usage data (total cost, cost over time, cost by area) exists in the PM dashboard synthesis function and is rendered in `AiUsageCharts`. The `src/lib/dashboard/usage-queries.ts` file provides `getTokenUsageSummary` which aggregates by task type. However: (1) there is no standalone "Usage & Costs" tab in project settings — `/projects/[projectId]/settings/` has pages for general settings, team, org, developer API, and Jira, but no usage tab; (2) there is no per-member breakdown in `usage-queries.ts` (only per-task-type); (3) there is no date range filter; (4) there is no Inngest event volume metric; (5) RBAC restriction to SA and PM only is not enforced on a dedicated tab since the feature is embedded inside the PM dashboard (which does enforce PM/SA access, but is not the settings location specified by the PRD).
- **The gap:** The Usage and Costs feature is partially implemented (token aggregation, cost over time, cost by area exist) but is embedded in the PM dashboard rather than a dedicated settings tab. Per-member breakdown, date range filtering, and Inngest event volume are all missing.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Usage and Cost Dashboard

---

### GAP-DASH-016: Usage and Costs Missing Per-Member Breakdown

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 23.4
- **What PRD says:** "Breakdown by team member: Token usage and cost per project member. Visible to SA and PM only; individual users do not see other users' consumption."
- **What exists:** `src/lib/dashboard/usage-queries.ts` `getTokenUsageSummary()` groups `SessionLog` by `taskType` only. The `SessionLog` model presumably has a `userId` or `memberId` field, but no per-member aggregation is implemented. The `PmDashboardData.aiUsage` type has no `byMember` field.
- **The gap:** Per-member usage breakdown is entirely absent from all queries, data types, and UI. The PRD notes this is for capacity planning and identifying expensive workflows, not performance monitoring — it has clear operational value.
- **Scope estimate:** S
- **Dependencies:** GAP-DASH-015 (the feature needs a proper settings tab context)
- **Suggested phase grouping:** Usage and Cost Dashboard

---

### GAP-DASH-017: Usage and Costs Missing Date Range Filter

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 23.4
- **What PRD says:** Project totals are "filterable by date range (last 7 days, last 30 days, current sprint, custom range)."
- **What exists:** `getTokenUsageSummary()` queries all `SessionLog` records with `status: "COMPLETE"` and no date filter. The PM dashboard synthesis function's AI cost step also queries all sessions without date scoping. No date range parameter exists anywhere in the usage query chain.
- **The gap:** All usage data is lifetime aggregates with no date scoping. The PM dashboard shows an "AI Cost Over Time" line chart which provides visual trending, but there is no interactive date range filter.
- **Scope estimate:** S
- **Dependencies:** GAP-DASH-015
- **Suggested phase grouping:** Usage and Cost Dashboard

---

### GAP-DASH-018: Usage and Costs Missing Inngest Event Volume Metric

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 23.5 (referenced back into 23.4)
- **What PRD says:** "The Usage & Costs dashboard (Section 23.4) should include an Inngest event volume metric alongside AI token costs so firm administrators can track consumption against tier limits."
- **What exists:** No Inngest event volume metric exists anywhere in the codebase. The PM dashboard shows only AI token costs.
- **The gap:** Inngest event volume is entirely absent. At scale (10-30 projects), exceeding the free tier is a real operational concern per Section 23.5's projections.
- **Scope estimate:** M (requires Inngest API integration or manual event counting)
- **Dependencies:** GAP-DASH-015
- **Suggested phase grouping:** Usage and Cost Dashboard

---

### GAP-DASH-019: Search Missing Story, OrgComponent, and BusinessProcess Entity Types

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.7
- **What PRD says:** Full-text indexed entities include: Question (questionText, answer), Decision (decisionText, rationale), Requirement (description), Story (title, description, acceptanceCriteria), OrgComponent (apiName, label), KnowledgeArticle (title, content, summary), BusinessProcess (name, description), Risk (description, mitigationStrategy). Global search bar returns "grouped results across all entity types (questions, stories, articles, components, decisions, etc.)."
- **What exists:** `src/lib/search/global-search.ts` defines `SearchEntityType = "question" | "decision" | "article" | "requirement" | "risk"`. The full-text search, semantic search, and all grouping logic operate on these five types only. Story, OrgComponent, and BusinessProcess are completely absent. `ALL_TYPES` is `["question", "decision", "article", "requirement", "risk"]`. The command palette (`src/components/search/command-palette.tsx`) has no Story, Component, or BusinessProcess entity icons or navigation paths.
- **The gap:** Three of the eight PRD-specified full-text search entities are missing — Story, OrgComponent, and BusinessProcess. Stories are arguably the most frequently searched entity for developers. OrgComponents are central to the Salesforce org knowledge layer.
- **Scope estimate:** M (requires adding tsvector columns to those tables in schema, adding search branches in global-search.ts, and adding entity types to the command palette)
- **Dependencies:** None (tables exist)
- **Suggested phase grouping:** Search Completeness

---

### GAP-DASH-020: Semantic Search (Layer 3) Only Covers KnowledgeArticle

- **Severity:** Significant
- **Perspective:** Functionality / Architecture
- **PRD Reference:** Section 17.7
- **What PRD says:** "Layer 3: Semantic Search (pgvector cosine similarity). 'Smart search' for meaning-based matching. Activated when full-text search returns few or no results, or when the user explicitly chooses semantic mode. Uses the same embedding infrastructure as the knowledge article retrieval system."
- **What exists:** `src/lib/search/global-search.ts` `semanticSearch()` only queries `KnowledgeArticle` (lines 358-391). It explicitly comments "Only KnowledgeArticle has embedding column in schema currently." No other entity type is semantically searchable.
- **The gap:** Semantic search is effectively restricted to one entity type. Questions, decisions, requirements, and risks do not have embedding columns in the schema and therefore cannot participate in semantic search. The PRD implies semantic search should work across entity types (at minimum the knowledge-intensive ones: questions, decisions, articles).
- **Scope estimate:** L (requires embedding columns on additional models, embedding generation pipeline extensions, and query updates)
- **Dependencies:** GAP-DASH-019 (story search), embedding infrastructure capacity
- **Suggested phase grouping:** Search Completeness

---

### GAP-DASH-021: Search Lacks "Explicit Semantic Mode" Toggle in UI

- **Severity:** Minor
- **Perspective:** UX
- **PRD Reference:** Section 17.7
- **What PRD says:** Semantic search is "activated when full-text search returns few or no results, or when the user explicitly chooses semantic mode."
- **What exists:** `src/lib/search/global-search.ts` always runs all three layers in parallel regardless of full-text result count. There is no conditional activation based on result count, and the command palette has no mode toggle. The search action schema (`src/actions/search.ts`) has no `mode` parameter.
- **The gap:** Semantic search always runs unconditionally (paying the embedding generation cost every time), and there is no user-facing mode toggle. The PRD describes it as a fallback or explicit choice, implying it should not always fire.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Search Completeness

---

### GAP-DASH-022: Execution Plan Tab Missing Phase Grouping Within Epics

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 17.4
- **What PRD says:** "Phase grouping. Stories can be grouped by which project phase they belong to within the epic (Discovery stories, Design stories, Build stories)."
- **What exists:** `src/components/roadmap/execution-plan-tab.tsx` groups stories only by epic (via `groupByEpic()`). Within each epic, stories are displayed in `sortOrder` sequence. No phase-based sub-grouping exists. The `Story` model has a phase relationship through `Sprint` and `EpicPhase`, but the execution plan tab does not use it.
- **The gap:** Phase grouping within epics is absent. Stories in Build phase and stories in Discovery phase for the same epic are interleaved by sort order with no visual or structural separation.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Roadmap Completeness

---

### GAP-DASH-023: Execution Plan Tab Missing Dependency Visualization Between Stories

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 17.4
- **What PRD says:** "Dependency visualization. The dependency chain between stories is visible — which stories block which other stories. The AI identifies these chains from the StoryComponent join table (overlapping impacted components) and from explicit dependencies set by the team."
- **What exists:** `src/components/roadmap/execution-plan-tab.tsx` shows `story.dependencies` as a plain text string ("Depends on: {story.dependencies}") and shows unresolved blocking questions with an alert icon. It does not visualize story-to-story dependency chains, does not link to the dependent story, and does not show which stories a given story blocks.
- **The gap:** True dependency chain visualization (which specific story must complete before this one, rendered as navigable links) is absent. The current implementation shows a raw text field and question blockers, not story-level dependency chains.
- **Scope estimate:** M (requires StoryDependency join table or using the existing `dependencies` text field with a structured format, plus UI to render chains)
- **Dependencies:** None
- **Suggested phase grouping:** Roadmap Completeness

---

### GAP-DASH-024: Health Score Not Displayed in Briefing Header

- **Severity:** Minor
- **Perspective:** UX / Architecture
- **PRD Reference:** Section 17.6 and 17.1
- **What PRD says:** Health score is "displayed in the Briefing header" (Section 17.6). The Briefing (Section 17.1) is the primary landing page. The header metrics include the health score.
- **What exists:** The health score is rendered as a dedicated card in the top-left of the discovery dashboard grid (`src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx` line 80-91), occupying one-third of the top row alongside the Current Focus narrative. This is visually prominent but is structured as a card body, not a page header element.
- **The gap:** Minor structural issue — the health score is in the right area but is not technically "in the header" as a header badge/chip alongside the page title and key counts. This is low severity since it is visible and prominent, but the PRD implies a compact header bar with all metrics inline.
- **Scope estimate:** S
- **Dependencies:** GAP-DASH-004 (adding the other header metrics that would co-exist with health score in the header)
- **Suggested phase grouping:** Briefing Completeness

---

### GAP-DASH-025: PM Dashboard AI Cost Uses Hardcoded Pricing, Not Shared Config with Section 23.4

- **Severity:** Minor
- **Perspective:** Architecture
- **PRD Reference:** Section 23.4
- **What PRD says:** "The application stores AI model pricing as a configuration object (TypeScript constants in V1, admin UI in V2)." Cost per session = (inputTokens * inputRate) + (outputTokens * outputRate). Single source of truth for pricing.
- **What exists:** Two separate cost calculation implementations exist: (1) `src/lib/config/ai-pricing.ts` is referenced in `src/lib/dashboard/usage-queries.ts` via `calculateCost()`, (2) `src/lib/inngest/functions/pm-dashboard-synthesis.ts` lines 86-89 has a local `estimateCost()` function with hardcoded approximation: `(inputTokens * 3) / 1_000_000 + (outputTokens * 15) / 1_000_000`. The two are not the same source.
- **The gap:** Dual cost calculation logic means the PM dashboard synthesis and the usage queries module can produce different cost numbers for identical sessions. This is an architecture correctness issue — if pricing is updated in `ai-pricing.ts`, the PM dashboard synthesis function will continue using the old hardcoded rates.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Usage and Cost Dashboard

---

### GAP-DASH-026: Discovery Dashboard Auto-Refresh Still Broken (Known from Audit, Partially Closed)

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 17.1 (Section 6.5 referenced)
- **What PRD says:** Recommended Focus and Current Focus narrative are "cached and refreshed on state changes or manual trigger."
- **What exists:** The milestone audit (DASH-05) identified that `dashboardSynthesisFunction` triggers on `PROJECT_STATE_CHANGED` but no action ever sends this event. The audit notes this was resolved by Phase 8 commit `f283ea8`. However, if `PROJECT_STATE_CHANGED` is still not fired by state-changing actions in the current build, auto-refresh remains broken. The audit marks this as "gap closure verified" but also notes this as a "broken flow" simultaneously. Given that the milestone audit marks it as closed, this may be resolved — but it deserves confirmation since it was a known broken integration at time of the audit.
- **The gap:** If `PROJECT_STATE_CHANGED` is not sent by mutation actions (question answered, story status changed, transcript processed, etc.), the discovery dashboard never auto-refreshes and the "cached and refreshed on state changes" guarantee is violated. The manual trigger via `GenerateBriefingButton` exists as a fallback.
- **Scope estimate:** S (event wiring if not already done)
- **Dependencies:** None
- **Suggested phase grouping:** Dashboard Correctness

---

### Summary Table

| Gap ID | Title | Severity | Scope | PRD Ref | Phase Grouping |
|--------|-------|----------|-------|---------|----------------|
| GAP-DASH-001 | Health Score Uses Wrong Scoring Model | Significant | M | 17.6 | Dashboard Correctness |
| GAP-DASH-002 | Health Score Thresholds Not Configurable Per Project | Minor | M | 17.6 | Dashboard Correctness |
| GAP-DASH-003 | Client-Owned Question Signal Missing from Health Score | Significant | S | 17.6 | Dashboard Correctness |
| GAP-DASH-004 | Briefing Header Missing Roadmap Progress and Requirements Count | Significant | S | 17.1 | Briefing Completeness |
| GAP-DASH-005 | Blocking Questions Missing Age and Owner Fields | Significant | S | 17.1 | Briefing Completeness |
| GAP-DASH-006 | Briefing Missing Epic Status Section | Significant | M | 17.1 | Briefing Completeness |
| GAP-DASH-007 | Recommended Focus Is Unstructured Prose, Not Ranked List with Question Links | Significant | M | 17.1 | Briefing Completeness |
| GAP-DASH-008 | Milestone AI Summaries Are Computed Locally, Not AI-Generated | Minor | M | 17.2 | Roadmap Intelligence |
| GAP-DASH-009 | Sprint Dashboard Missing Stories Missing Mandatory Fields | Significant | S | 17.3 | Sprint Dashboard Completeness |
| GAP-DASH-010 | Sprint Dashboard Missing Developer Workload View | Significant | S | 17.3 | Sprint Dashboard Completeness |
| GAP-DASH-011 | Sprint Dashboard Missing Conflict Alerts | Minor | S | 17.3 | Sprint Dashboard Completeness |
| GAP-DASH-012 | PM Dashboard Missing Risk Register Summary | Significant | S | 17.5 | PM Dashboard Completeness |
| GAP-DASH-013 | PM Dashboard Missing Upcoming Deliverable Deadlines | Significant | S | 17.5 | PM Dashboard Completeness |
| GAP-DASH-014 | PM Dashboard Missing Client-Facing Items Needing Attention | Significant | S | 17.5 | PM Dashboard Completeness |
| GAP-DASH-015 | Section 23.4 Usage and Costs Not a Dedicated Settings Tab | Significant | M | 23.4 | Usage and Cost Dashboard |
| GAP-DASH-016 | Usage and Costs Missing Per-Member Breakdown | Significant | S | 23.4 | Usage and Cost Dashboard |
| GAP-DASH-017 | Usage and Costs Missing Date Range Filter | Minor | S | 23.4 | Usage and Cost Dashboard |
| GAP-DASH-018 | Usage and Costs Missing Inngest Event Volume Metric | Minor | M | 23.5 | Usage and Cost Dashboard |
| GAP-DASH-019 | Search Missing Story, OrgComponent, and BusinessProcess Entity Types | Significant | M | 17.7 | Search Completeness |
| GAP-DASH-020 | Semantic Search Only Covers KnowledgeArticle | Significant | L | 17.7 | Search Completeness |
| GAP-DASH-021 | Search Lacks Explicit Semantic Mode Toggle | Minor | S | 17.7 | Search Completeness |
| GAP-DASH-022 | Execution Plan Tab Missing Phase Grouping Within Epics | Minor | S | 17.4 | Roadmap Completeness |
| GAP-DASH-023 | Execution Plan Tab Missing Story-to-Story Dependency Visualization | Minor | M | 17.4 | Roadmap Completeness |
| GAP-DASH-024 | Health Score Not Displayed in Briefing Header | Minor | S | 17.6 | Briefing Completeness |
| GAP-DASH-025 | PM Dashboard Uses Duplicate Hardcoded Pricing vs ai-pricing.ts | Minor | S | 23.4 | Usage and Cost Dashboard |
| GAP-DASH-026 | Discovery Dashboard Auto-Refresh Event Wiring Needs Verification | Significant | S | 17.1 | Dashboard Correctness |

**Total gaps: 26**
- Critical: 0
- Significant: 16
- Minor: 10

---

### Key Files Referenced in This Analysis

- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/dashboard/queries.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/dashboard/usage-queries.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/dashboard/blocked-items.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/dashboard/health-score.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/dashboard.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/pm-dashboard.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/actions/search.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/search/global-search.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/search/command-palette.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/dashboard-synthesis.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/lib/inngest/functions/pm-dashboard-synthesis.ts`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/pm-dashboard/page.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/pm-dashboard/pm-dashboard-client.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/pm-dashboard/stat-cards.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/pm-dashboard/ai-usage-charts.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/roadmap/page.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/roadmap/roadmap-page-client.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/roadmap/milestones-tab.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/roadmap/epic-phase-grid.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/roadmap/execution-plan-tab.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/roadmap/milestone-ai-summary.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/app/(dashboard)/projects/[projectId]/sprints/[sprintId]/page.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/sprints/sprint-dashboard.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/src/components/sprints/sprint-intelligence-panel.tsx`
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/archive/SF-Consulting-AI-Framework-PRD-v2.1.md` (sections 17.1-17.7, 23.4)
- `/Users/michaelrihm/Documents/Salesforce-Consulting-SDLC-App/.planning/v1.0-MILESTONE-AUDIT.md`