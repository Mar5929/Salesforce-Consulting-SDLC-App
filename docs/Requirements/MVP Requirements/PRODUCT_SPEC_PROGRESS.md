# Product Spec Review Progress Tracker

**Purpose.** This is the single source of truth for the state of the `PRODUCT_SPEC.md` review: what has been reviewed, what is open, what just happened, and what is up next. Every new Claude Code session reads this file first.

**Document under review:** `docs/MVP Requirements/PRODUCT_SPEC/PRODUCT_SPEC.md`

**Reference materials (not primary sources, used for prompting the review conversation):**

- `archive/PRD/PRD.md` (prior draft, 28 sections)
- `archive/PRD/sections/*.md` (deeper drafts for select sections)
- `archive/_legacy/` (earlier full-length drafts, addendum, and requirement index, kept for audit only)

**Related documents:**

- `docs/Post-MVP Requirements/PRODUCT_SPEC_POST_MVP.md`: parking lot for capabilities considered during review and intentionally deferred from MVP.

**Reviewer:** Michael Rihm
**Start date:** 2026-04-16

---

## What we are doing

Building `PRODUCT_SPEC.md` section by section. The spec captures only what the application should be able to do (functional behavior). How to build it (architecture, data model, APIs, security, build sequence) is a separate document produced after this one is signed off.

For each section:

1. Claude reads the corresponding content in the reference PRD and any deeper section drafts.
2. Claude asks Michael whether the content reflects how the system should function.
3. Michael corrects, reframes, or confirms.
4. Claude writes the approved content into `PRODUCT_SPEC.md`.
5. This tracker is updated: section status, date, session note, summary counters.
6. The session log at the bottom records what changed and why.
7. The tracker update is committed together with the `PRODUCT_SPEC.md` edits so the audit trail stays coherent.

Block order (A through F) is the review order. Do not skip ahead unless Michael says so.

---

## How to resume in a new session

1. Read this file in full.
2. Read `MEMORY.md` and the relevant memory files.
3. Find the first row below with status `Not Started` or `In Progress`. That is the next section to review.
4. Read the "Session log" at the bottom of this file for any unresolved threads from prior sessions.
5. Read that section in `PRODUCT_SPEC.md` (if drafted) and its corresponding content in `archive/PRD/PRD.md` or `archive/PRD/sections/`.
6. Before proposing edits, ask Michael what he wants the section to say. Do not rewrite until he gives direction.
7. When the section review finishes, follow steps 5 through 7 under "What we are doing" above.

---

## Status legend

| Status | Meaning |
|---|---|
| Not Started | No review conversation has happened for this section. |
| In Progress | Review is underway across one or more sessions. Not yet signed off. |
| Reviewed: No Changes | Section reviewed and confirmed as is. |
| Reviewed: Updated | Section reviewed and edited. Michael confirmed the updated version. |

---

## Review order

### Block A. Lock the frame first

Why first: these sections define vision, scope, non-goals, and users. Everything downstream has to answer to them.

| Order | # | Title | Status | Last Reviewed | Session Note |
|---|---|---|---|---|---|
| 1 | 1 | Vision, Scope, and Non-Goals | Reviewed: Updated | 2026-04-16 | Drafted with 5 subsections. Added "Roadmap and phase generation" as a sixth AI capability. |
| 2 | 2 | Target Users and Personas | Reviewed: Updated | 2026-04-16 | Six personas. SA + Tech Lead merged. Clients explicitly excluded. Project admin shared SA/PM. Tool-channel note per persona. |
| 3 | 3 | Problem Statement | Reviewed: No Changes | 2026-04-16 | Copied verbatim from archive/PRD/PRD.md §2. Block A complete. |

### Block B. Core product workflows

Why next: these are the heart of what the app does day to day. Most functional requirements live here.

| Order | # | Title | Status | Last Reviewed | Session Note |
|---|---|---|---|---|---|
| 4 | 4 | Project Lifecycle | Reviewed: Updated | 2026-04-16 | Eight lifecycle stages. Stage 1 "Project Initialization" with AI-driven client context gathering (SA/PM-initiated, optional web research). No starter content seeded on creation. Terminology: "lifecycle stage" (delivery-wide) vs "Phase" (work hierarchy, §7). Single active stage. Two nice-to-haves deferred to `PRODUCT_SPEC_POST_MVP.md`. |
| 5 | 5 | Discovery Workflow | Reviewed: Updated | 2026-04-16 | Drafted in full with 7 subsections. Chat model replaced: one Claude.ai-style session primitive (no general vs. task distinction), private by default with opt-in project sharing, archive, cross-session recall, running session memory. CRUD-minus-delete firm guardrail introduced. Full chat mechanics reserved for §14. |
| 6 | 6 | Question System | Reviewed: Updated | 2026-04-16 | Drafted in full with 7 subsections. Lifecycle states: Draft, Open, Answered, Parked, Superseded (no hard delete). Re-open allowed; prior answers preserved in Answer History. Scoping model expanded to four levels: Engagement, Phase, Epic, Feature (Phase added). ID scheme includes `Q-P{n}-*` for Phase scope. Data model adds Spawned From (question linkage), Answer History, Activity Log. Owner enum adds Firm. Blocks scope expanded to any work item or named artifact. |
| 7 | 7 | Project Roadmap and Work Item Management | In Progress | 2026-04-17 | Structural shape locked. Five sub-sections in Work tab: Home, Admin Tasks, Roadmap, Work Items, Sprints. Four-level hierarchy (Phase → Epic → Feature optional → Work Item). Features optional. Admin Tasks as separate entity. Three lenses (Tree/Board/Timeline). Side-panel detail drawer. Readiness as composite of 3 sub-scores. Roadmap and Sprints as own sub-sections. Spun out to subfiles under `PRODUCT_SPEC/7-roadmap-and-work-items/`. Detailed items open: work item subtypes, sprint rules, re-proposal diff UX, admin task fields, cross-phase dependencies. |
| 8 | 8 | Sprint Intelligence | Not Started | | |
| 9 | 9 | Developer Execution and the AI Architect | Not Started | | |
| 10 | 10 | QA Workflow | Not Started | | |
| 11 | 11 | Document Generation and Branding | Not Started | | |
| 12 | 12 | Dashboards and Reporting | Not Started | | |

### Block C. Knowledge and AI behaviors

| Order | # | Title | Status | Last Reviewed | Session Note |
|---|---|---|---|---|---|
| 13 | 13 | Project Knowledge Base | Not Started | | |
| 14 | 14 | AI-Powered Capabilities | Not Started | | |
| 15 | 15 | Org-Awareness Features | Not Started | | |

### Block D. Salesforce integration behaviors

| Order | # | Title | Status | Last Reviewed | Session Note |
|---|---|---|---|---|---|
| 16 | 16 | Org Connectivity and Sync | Not Started | | |
| 17 | 17 | Sandbox Strategy | Not Started | | |
| 18 | 18 | Salesforce Development Guardrails | Not Started | | |

### Block E. Roles and operational behaviors

| Order | # | Title | Status | Last Reviewed | Session Note |
|---|---|---|---|---|---|
| 19 | 19 | Roles, Permissions, and Collaboration Behavior | Not Started | | |
| 20 | 20 | Client Jira Sync (Optional) | Not Started | | |
| 21 | 21 | Project Archival | Not Started | | |
| 22 | 22 | Consultant Licensing and Cost Management | Not Started | | |

### Block F. Wrap

Why last: the executive summary should reflect what we actually ended up with. Open questions capture anything still undecided.

| Order | # | Title | Status | Last Reviewed | Session Note |
|---|---|---|---|---|---|
| 23 | 23 | Executive Summary | Not Started | | |
| 24 | 24 | Open Questions | Not Started | | |

---

## Summary counters

Update these every time a section's status changes so the next session sees progress at a glance.

- Total sections: 24
- Not Started: 17
- In Progress: 1
- Reviewed: No Changes: 1
- Reviewed: Updated: 5

---

## What is up next

**Section 7 is in progress.** The structural shape of the Work tab is locked and spun out into subfiles under `PRODUCT_SPEC/7-roadmap-and-work-items/`. What remains is resolving the detailed open items flagged in each subfile.

**Two options for the next session.** The first is the recommended path:

1. **Continue §7 and resolve work item subtypes.** This is the highest-leverage remaining decision in §7: it cascades into §8 (sprints), §9 (developer execution), and §10 (QA). Once subtypes are decided, downstream sprint rules (capacity, what can sit in a sprint) become easier to settle.
2. **Move to §8 Sprint Intelligence**, then return to §7 open items after §8. §8 surfaces more sprint context that will inform §7 sprint-rule decisions.

**Entry point for a new session.** Read this tracker and memory (including `CLAUDE.md` at the project root). Then read `PRODUCT_SPEC.md` §§1-6 and §7 for continuity, plus the six subfiles under `PRODUCT_SPEC/7-roadmap-and-work-items/`. Open the live visuals at `visuals/index.html` (served via `npx live-server visuals --port=5500`) to keep the §7 mockups available for reference. Per CLAUDE.md rules, lead with plain-English questions grounded in real scenarios; do not dump decision menus.

---

## Open threads across sections

Issues or decisions that span multiple sections and cannot be resolved inside a single section review. Each entry has the date raised, the thread, and the sections it affects.

| Date | Thread | Affects |
|---|---|---|
| 2026-04-16 | Possible missing functional areas to watch for during reviews: first-run and onboarding experience for a new consultant; notifications and alerts; global search across projects; activity or audit history the user can see; templates or starter kits for new projects; white-label and branding controls. Some may live inside existing sections; some may warrant new sections. Flag if they surface naturally during a review and are not covered. | All |
| 2026-04-16 | Section 18 (Salesforce Development Guardrails) may contain both user-facing behavior and technical policy. May need to split or trim when reached. | 18 |
| 2026-04-17 | Roadmap re-proposal work-section UX: diff view layout (stacked-by-change-type, side-by-side, tree diff), what evidence the AI attaches to each proposed change (discovery question IDs, transcript excerpts, decisions), banner visibility across roles, concurrent re-proposal handling, dismissal semantics. Overall Roadmap sub-section structure agreed 2026-04-17; these sub-details remain. | 7 |
| 2026-04-16 | AI web research capability. §4.3 (Project Initialization) states the AI can research publicly available client info and offer additions to the client context document when the SA or PM asks for it. §14 (AI-Powered Capabilities) needs to own this definitively and decide V1 scope for web research across other surfaces. | 14 |
| 2026-04-16 | Changing engagement type mid-project: deferred past MVP. Revisit when reviewing §19 (Firm Admin settings) or as part of post-MVP planning. | 4, 19 |
| 2026-04-16 | Full chat session spec. §5 introduced the session model at a reference level (Claude.ai-style sessions, private by default, opt-in project sharing, archive, cross-session recall, running session memory within a session, heavy operations folded in). §14 owns the full mechanics: session listing UI, archive behavior, session ownership on role changes (auto-archive on roll-off, firm-admin-only read access after archive), cross-session search scoping, session visibility toggle, cost/audit tracking of heavy operations run inside a session. | 14 |
| 2026-04-16 | CRUD-minus-delete guardrail, firm-wide. Chat-initiated and direct-entry records can be created, read, and edited, but never hard-deleted. Archive, park, cancel, and supersede cover the user's real needs. §19 codifies this as a firm-wide permission rule across all record types. | 19 |
| 2026-04-17 | Work item subtypes. User story only, or story + bug + spike + others? Affects lifecycle states, mandatory fields, ID scheme (type segment or not), sprint eligibility. Highest-leverage remaining decision in §7: cascades into §8, §9, §10. | 7, 8, 9, 10 |
| 2026-04-17 | Role-adaptive Home widget catalog. Each of the six personas (SA, Developer, PM, BA, QA, Firm Admin) needs a default widget set for the Work tab Home dashboard. Plus rules for the "Viewing as" role-switch toggle. | 7, 12 |
| 2026-04-17 | Sprint capacity model. Per-developer (sum of individual capacities), team total, or by role (dev, QA, BA capacity tracked separately). Affects how unassigned work items count and how over/under commitment is measured. | 7, 8 |
| 2026-04-17 | AI-proposed sprint composition. Does the AI propose what the next sprint should contain, or is planning always manual with the AI evaluating only what the human planned? | 7, 8 |
| 2026-04-17 | Cross-phase dependencies between work items. Blocks / blocked-by relationships. How they render on the Timeline view, how they surface in Sprint Intelligence. | 7, 8 |

---

## Session log

Newest entries at the bottom. One entry per session. Each entry captures what was reviewed, what changed, and any decisions or open questions that came out of it.

### 2026-04-16: PRODUCT_SPEC.md created and outline locked

**Decisions made this session:**

- Split the refinement process into two documents. `PRODUCT_SPEC.md` captures only what the application should do (functional, user-facing). A separate technical spec will capture how to build it (architecture, data model, APIs, security, build sequence) and is produced only after `PRODUCT_SPEC.md` is signed off.
- Retired the prior `docs/Requirements/PRD/REVIEW_PROGRESS.md` tracker. It was initialized earlier the same day with zero completed section reviews.

**What was created:**

- `docs/MVP Requirements/PRODUCT_SPEC/PRODUCT_SPEC.md`: 24-section skeleton with a status marker under each section.
- `docs/MVP Requirements/PRODUCT_SPEC_PROGRESS.md`: this tracker.
- Retired-pointer note left at `docs/Requirements/PRD/REVIEW_PROGRESS.md`.

**Outline changes vs. the prior PRD section list:**

- Renamed "Epics, Features, and User Stories" to "Project Roadmap and Work Item Management" (Michael directed).
- Reframed "AI Intelligence Layer" to "AI-Powered Capabilities" so the section name reads as user-facing behavior, not architecture.
- Reframed "Org Metadata Intelligence Layer" to "Org-Awareness Features" for the same reason.
- Reframed "Multi-User Concurrency and RBAC" to "Roles, Permissions, and Collaboration Behavior" for the same reason.
- Added a new section "Project Knowledge Base" separate from the AI capabilities that use it. The prior PRD conflated the knowledge store (questions, decisions, requirements, risks, annotations, accumulated project memory) with the AI behaviors on top of it. Michael called this out; the new section treats the knowledge base as its own user-facing surface.
- Deferred to a future technical spec: System Architecture, Data Model, API Design, Security / Compliance / Data Handling, Build Sequence.

**What was not done:**

- No sections reviewed. The session locked the outline only.

**Next session starts with:** Block A, order 1. Section 1 "Vision, Scope, and Non-Goals."

### 2026-04-16 (session 2): Section 1 signed off

**Decisions made this session:**

- Kept Block A order as 1 Vision, 2 Personas, 3 Problem. Resolved the prior open thread on ordering.
- Section 3 Problem Statement will be copied verbatim from `docs/Requirements/PRD/PRD.md` §2 when reached. No review conversation needed for it.
- Section 1 retains all five subsections from the prior PRD draft (What This Product Is, Delivery Model, AI Capabilities at a Glance, Repository Posture, Non-Goals). Even though Delivery Model and AI Capabilities brush the architecture line, they are needed to describe what the product does.
- Added a sixth AI capability: Roadmap and phase generation. The solution architect (or PM) iterates with the AI on a phased roadmap; on approval the AI creates the phases directly in the work section.

**What was changed:**

- `PRODUCT_SPEC.md` §1 drafted in full. Status marker updated to Reviewed: Updated (2026-04-16).

**Open threads added for future sections:**

- Work hierarchy is Phase → Epic → Feature → Work Item. Affects §7.
- Work section needs a phase-level visualization. Affects §7.
- Discovery is never finalized; roadmap can be re-proposed as discovery evolves. Affects §5 and §7.

**Open threads resolved:**

- Block A ordering. Kept existing order.

**Next session starts with:** Block A, order 2. Section 2 "Target Users and Personas."

### 2026-04-16 (session 3): Section 2 signed off + collaboration mode set

**Decisions made this session:**

- Section 2 reframed to six roles. Merged Solution Architect and Tech Lead into a single "Solution Architect" role. Clients are never users of the system, made explicit in the section intro.
- Project administration (adding/removing team members, adjusting project-level settings) is a shared responsibility of the Solution Architect and the Project Manager. Not a standalone role.
- A single person may hold more than one role per project. Role assignment is per-project and governs visibility and permissions, not job title.
- Firm Administrator described by what it controls (guardrails, branding, templates, taxonomies, licensing defaults, firm dashboards), not by how V1 delivers the UI. The "V1 configured in code/DB" detail is a delivery concern and was dropped from §2.
- Executive / Firm Leadership viewer collapsed into Firm Administrator for V1. Future firm growth may split the role.
- QA tooling left illustrative in §2 (Playwright mentioned as example). Final tool commitment belongs in §10 (QA Workflow).
- Collaboration mode set: Claude drives the writing of PRODUCT_SPEC.md. Claude leads each section with proposed drafts and recommendations, raises short clarifiers only where guessing would waste work, owns doc organization, and proactively proposes subfile spin-outs when a section grows too dense.
- PRODUCT_SPEC.md is modular. Top-level lives at `docs/MVP Requirements/PRODUCT_SPEC/PRODUCT_SPEC.md`. Granular detail spins out to `docs/MVP Requirements/PRODUCT_SPEC/{section-number}-{slug}/{subtopic}.md`. Default is inline; spin out when a section exceeds ~300 lines or has more than 3 detailed sub-workflows.

**What was changed:**

- `PRODUCT_SPEC.md` §2 drafted in full. Status marker updated to Reviewed: Updated (2026-04-16).
- Two new memory files added: `feedback_proactive_spec_ownership.md` and `project_modular_spec_architecture.md`. Indexed in `MEMORY.md`.

**Open threads added for future sections:**

- None. All §2 open items resolved inline.

**Open threads resolved:**

- None from prior sessions.

**Next session starts with:** Block A, order 3. Section 3 "Problem Statement." Copy verbatim from `docs/Requirements/PRD/PRD.md` §2. No review conversation needed. Then move to Block B, order 4. Section 4 "Project Lifecycle."

### 2026-04-16 (session 4): Section 3 signed off, Block A complete

**Decisions made this session:**

- Section 3 copied verbatim from `archive/PRD/PRD.md` §2 per prior direction. No conversation or edits.
- Block A (Vision, Personas, Problem) is complete. Frame is locked.

**What was changed:**

- `PRODUCT_SPEC.md` §3 populated with the verbatim problem statement. Status marker updated to Reviewed: No Changes (2026-04-16).
- Tracker status row for §3 updated. Summary counters updated (22 Not Started → 21; Reviewed: No Changes 0 → 1).

**Open threads added for future sections:**

- None.

**Open threads resolved:**

- None from prior sessions.

**Next session starts with:** Block B, order 4. Section 4 "Project Lifecycle." This is the first section of Block B (core product workflows). Start with a proactive draft or structured recommendation, not a question list.

### 2026-04-16 (session 5): Section 4 signed off

**Decisions made this session:**

- Section 4 drafted in full. Eight lifecycle stages: Project Initialization, Discovery, Roadmap and Design, Build, Testing, Deployment, Hypercare and Handoff, Archive.
- **Terminology set.** "Lifecycle stage" refers to the delivery-wide framework (§4.3). "Phase" is reserved for the work hierarchy level below the project and above epics (§7). The two are explicitly disambiguated in §4.6.
- **Single active stage.** Only one lifecycle stage is active at a time. Active stage drives dashboard emphasis and AI surface, not hard gating. Work in other stages is still possible.
- **No default starter content on project creation.** The application does not seed epics, deliverables, or other scope when a project is created. Scope emerges from discovery and the roadmap proposal.
- **Project Initialization behavior.** On project creation, the AI proactively prompts the SA and PM for client context (who the client is, what they do, products they sell, background, stakeholders, engagement goals). User can enter what they have or defer. If the SA or PM asks, the AI can research publicly available info about the client and offer suggested additions to the context document for user review. Output is a living client context document that anchors the project's knowledge base (see §13).
- **Rescue/Takeover engagements.** Org Health Assessment is conducted during Project Initialization; the AI prompts for and helps assemble it. Not seeded.
- **Changing engagement type mid-project.** Deferred past MVP; flagged as a cross-section thread for revisit.
- **Roadmap re-proposal codified.** §4.4 establishes that discovery is never finalized and the roadmap can be re-proposed. SA approves; in-flight work is not reassigned automatically; roadmaps are versioned. §5 owns discovery-side triggers; §7 owns the work-section UX.

**What was created:**

- `docs/Post-MVP Requirements/PRODUCT_SPEC_POST_MVP.md`: parking lot for capabilities intentionally deferred from MVP. Seeded with the two §4-adjacent items Michael judged nice-to-have but not essential for V1: project templates / starter kits, and the consultant transition welcome brief. Related documents line added to this tracker's preamble.

**What was changed:**

- `PRODUCT_SPEC.md` §4 drafted in full (6 subsections). Status marker updated to Reviewed: Updated (2026-04-16). Tracker status row, summary counters (21→20 Not Started, 2→3 Reviewed: Updated), "What is up next," and open threads table all updated.

**Open threads added for future sections:**

- AI web research capability (affects §14): confirm V1 scope for AI web research, triggered by §4.3's behavior.
- Changing engagement type mid-project (affects §4, §19): deferred past MVP; revisit during §19 review or post-MVP planning.

**Open threads resolved:**

- None fully resolved. The "discovery is never finalized / roadmap re-proposal" thread has its overall shape established in §4.4 but still requires detail from §5 and §7 before it can close.

**Next session starts with:** Block B, order 5. Section 5 "Discovery Workflow."

### 2026-04-16 (session 6): Section 5 signed off, chat model reframed

**Decisions made this session:**

- Section 5 drafted in full: 7 subsections covering the shape of discovery, information input channels, what the AI does with each input, intelligence surfaces (gap, readiness, conflict, follow-up), uncertainty handling, discovery-side triggers for roadmap re-proposal, and where discovery output lands.
- **Chat model reframed.** The prior PRD's two-type model (general project chat vs. task sessions) is retired. The application now offers one primitive: the chat session, modeled on Claude.ai. Any team member can start a new session. Sessions live at the project level.
- **Session visibility: private by default.** The creator can open a session to the project team. This is the inverse of Claude's initial recommendation; Michael chose the stricter privacy posture.
- **Structured records from private sessions still flow to the shared project knowledge base.** The private/shared toggle controls who can read the raw conversation, not the derived records. Otherwise private sessions would starve the knowledge base and defeat the centralization premise.
- **Role changes: auto-archive.** When a team member rolls off a project, their sessions auto-archive.
- **Archived-session read access: firm admin only.** After a session is archived (through user action or role removal), the firm administrator is the only role with read access to the raw transcript. Project admins (SA, PM) do not retain read access. Already-shared sessions were explicitly released during the user's tenure and are separate from this behavior.
- **CRUD-minus-delete firm guardrail.** Chat-initiated and direct-entry records can be created, read, and edited, but never hard-deleted. Applies to any record regardless of origin. Archive, park, cancel, and supersede cover real needs.
- **Heavy operations folded into chat sessions.** Transcript processing, story generation, briefings, and document drafts run inside a chat session. No separate "start a task session" mode. Cost and audit tracking happen under the hood.
- **Session memory: running within a session, searchable across sessions on demand.** Within a session the AI has access to the session's prior messages. Across sessions the AI searches when the user asks ("scan a prior chat where I said X"). The prior PRD's "each message is independent intake" behavior is retired.
- **Full chat session spec deferred to §14.** §5 keeps a reference-level description and points to §14 for starting, listing, archiving, cross-session recall, visibility toggle, session ownership on role changes, and cost/audit behavior.

**What was changed:**

- `PRODUCT_SPEC.md` §5 drafted in full. Status marker updated to Reviewed: Updated (2026-04-16).
- Tracker status row, summary counters (20→19 Not Started, 3→4 Reviewed: Updated), "What is up next," open threads table, and session log all updated.

**Open threads added for future sections:**

- Full chat session spec (§14).
- CRUD-minus-delete firm-wide guardrail (§19).
- Admin tasks as a new entity or a work-item type (§7).

**Open threads resolved (partial):**

- "Discovery is never finalized / roadmap re-proposal" thread: §5 side resolved. §5.6 defines manual and AI-surfaced triggers. The remaining §7 work-section UX keeps the thread open, but it is now scoped to §7 only.

**Next session starts with:** Block B, order 6. Section 6 "Question System."

### 2026-04-16 (session 7): Section 6 signed off

**Decisions made this session:**

- Section 6 drafted in full with 7 subsections. Led with a structured proposal (lifecycle states, scoping model, ID scheme, data model fields, cross-cutting behavior, volume, cross-section map); user confirmed A-G inline and drafting proceeded without iteration.
- **Lifecycle states cleaned up.** Retired the archive PRD's mixed state-machine + status model. Final states: Draft (AI-internal staging during extraction), Open, Answered, Parked, Superseded. No hard delete. Re-open allowed; prior answers preserved in Answer History.
- **Scoping model expanded to four levels.** Engagement, Phase, Epic, Feature. Phase scope added to match the Phase → Epic → Feature → Work Item hierarchy (open thread). Questions do not scope to user stories or tasks; story-level questions are recorded at Feature scope with the story captured in Blocks.
- **ID scheme.** Kept `Q-{SCOPE}-{NUMBER}`. Added `Q-P{n}-*` prefix for Phase scope. Epic and feature prefix uniqueness validated on create/edit. IDs are immutable across re-scoping.
- **Data model additions.** Added Spawned From (links a question to its parent when raised during impact assessment of another answer), Answer History (preserves prior answers on re-open), Activity Log (append-only state/scope/owner/edit events). Owner enum expanded to include Firm (for firm-admin-owned questions). Blocks scope broadened to any work item (phase, epic, feature, story, task) plus named artifacts (architecture decisions, in-progress deliverables, planned deployments).
- **Cross-cutting questions** are always Engagement-scoped with Affects populated. AI proposes on extraction; SA or owner can promote at any time. Impact assessment fans out across Affects on answer.
- **Volume expectations.** Added a Phase-scope band (0-10 per phase); kept archive PRD numbers for other scopes. 100-200 total at scale.

**What was changed:**

- `PRODUCT_SPEC.md` §6 drafted in full. Status marker updated to Reviewed: Updated (2026-04-16).
- Tracker status row, summary counters (19→18 Not Started, 4→5 Reviewed: Updated), "What is up next," and session log all updated.

**Open threads added for future sections:**

- None. §6 did not surface new cross-section threads. The CRUD-minus-delete (§19) and admin-task (§7) threads previously raised during §5 remain open and are referenced from §6.

**Open threads resolved:**

- None fully resolved. The work-hierarchy thread (affects §7) is partially advanced: §6 now assumes and encodes the Phase → Epic → Feature → Work Item hierarchy through its scoping model and ID scheme. §7 still owns the definitive hierarchy spec.

**Next session starts with:** Block B, order 7. Section 7 "Project Roadmap and Work Item Management." This is the largest single section and a strong candidate for subfile spin-out under `docs/MVP Requirements/PRODUCT_SPEC/7-roadmap-and-work-items/`.

### 2026-04-17: Section 7 structural shape locked, subfiles spun out

**Decisions made this session:**

- Section 7 reframed to match the user's Jira/ClickUp vision for the Work tab. Five sub-sections in the Work tab sub-nav: Home, Admin Tasks, Roadmap, Work Items, Sprints.
- **Four-level work hierarchy.** Phase → Epic → Feature (optional) → Work Item. Features are optional, used when an epic grows large enough that related work items benefit from clustering; skipped otherwise. ID scheme mirrors §6.3.
- **Admin Tasks are a separate entity**, not a Work Item subtype. Different lifecycle, different required fields, not sprint-eligible, not counted against sprint capacity. Parent to the project, not to a phase or epic.
- **Three lenses on Work Items:** Tree (planning), Board (Kanban by status, day-to-day execution), Timeline (Gantt with swimlane per phase). Lens toggle at the top; filters and search state persist across lenses.
- **Side-panel detail drawer** is the default UX for opening a work item. Slides in from the right, keeps the lens visible. Full-page view reserved for deep edits, reached via "Open full page" in the drawer.
- **Readiness is a composite of three sub-scores.** (1) open discovery questions blocking the epic; (2) work-item field gaps; (3) AI flags (contradictions, conflicts). Clicking the indicator opens a breakdown drawer with actionable items.
- **Roadmap is its own sub-section**, not a lens on Work Items. Owns the approved roadmap, AI re-proposal review (diff view + apply modes: Adopt wholesale, Merge, Selective apply), version history, manual re-proposal trigger, direct phase editing.
- **Sprints is its own sub-section**. Backlog + active sprint view, capacity bar, AI sprint intelligence (§8) surfaced inline. Lifecycle: Planning → Active → Closed. Sprint history retained. Closing prompts per-item for roll-over / return-to-backlog / mark-as-blocked.
- **AI roadmap re-proposal banner** surfaces at the top of the Work tab Home and in the Roadmap sub-section when a re-proposal is pending.
- **Role-adaptive Home widgets.** PM, BA, Developer, SA, QA, Firm Admin each see a tailored default widget set on the Work tab Home. "Viewing as" toggle lets any user switch to another role's view.

**What was created:**

- `PRODUCT_SPEC.md` §7 drafted as a compact map section with links to subfiles. Status marker set to In Progress (2026-04-17).
- `PRODUCT_SPEC/7-roadmap-and-work-items/` directory with six subfiles:
  - `work-tab-overview.md` (7.1 sub-nav, Home dashboard, navigation model).
  - `work-hierarchy.md` (7.2 four levels, parentage rules, ID scheme, example).
  - `admin-tasks.md` (7.3 separate entity, differences from work items, minimum fields).
  - `work-item-views.md` (7.4 three lenses, filters, search, detail drawer, readiness).
  - `roadmap.md` (7.6 sub-section structure, re-proposal review, apply modes, who sees what).
  - `sprints.md` (7.7 views, lifecycle, capacity, AI intelligence, closing flow).

**Process changes applied this session:**

- **Live-reloading visuals page** at `visuals/index.html` (served via `npx live-server visuals --port=5500`) introduced to give the user visual representations alongside interview questions. Eight views drafted for §7: Home, Work tab layout, Roadmap, Work Items (Tree, Board, Timeline), Readiness breakdown, Sprints. This visual-alongside-interview approach is now part of the workflow.
- **`CLAUDE.md` created at the project root.** Persists how to conduct section reviews: reason from first principles, plain questions one at a time, anchor on real scenarios, no PRD regurgitation, guide rather than interrogate, offer recommendations inside the conversation (not up-front menus), own the writing once shape is agreed.
- **`feedback_proactive_spec_ownership.md` memory updated** with refined guidance on interview style (walks through the "dense proposal-first framing was confusing" feedback from the user).

**Open threads added:**

- Work item subtypes (§7, §8, §9, §10).
- Role-adaptive Home widget catalog per role (§7, §12).
- Sprint capacity model (§7, §8).
- AI-proposed sprint composition (§7, §8).
- Cross-phase dependencies between work items (§7, §8).

**Open threads resolved:**

- Work hierarchy (was §7): Phase → Epic → Feature (optional) → Work Item. Confirmed and documented.
- Work section phase-level visualization (was §7): Timeline lens (Gantt with swimlane per phase) coexists with Tree and Board lenses via a view toggle.
- Admin tasks entity question (was §7): Admin Tasks are a separate entity type, not a Work Item subtype.

**Open threads partially resolved:**

- Discovery / roadmap re-proposal work-section UX: overall shape of the Roadmap sub-section agreed (current roadmap, banner, diff view, apply modes, version history). Sub-details remain open in updated thread (diff layout, evidence annotations, banner visibility, concurrent re-proposals, dismissal semantics).

**Next session starts with:** Recommended path is continuing §7 and resolving work item subtypes, which cascade into §8, §9, and §10. Alternative: move to §8 Sprint Intelligence, return to §7 open items after. Both are documented in "What is up next."
