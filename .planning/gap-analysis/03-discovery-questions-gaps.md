# Gap Analysis: Domain 03 — Discovery Workflow and Question System

**PRD Sections Audited:** 8.1, 8.3, 9 (all subsections)
**Date:** 2026-04-08

---

### GAP-DISC-001: Question ID scheme deviates from PRD specification

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 9.2
- **What PRD says:** Format `Q-{SCOPE}-{NUMBER}` where `{SCOPE}` is `ENG` for engagement-wide, a 2-4 letter epic prefix for epic-scoped (e.g., `Q-DM-001`), or `{EPIC}-{FEATURE}` for feature-scoped. Number is zero-padded (e.g., `001`). Epic prefixes must be unique within a project; the application validates uniqueness on epic create/edit.
- **What exists:** `src/lib/display-id.ts` generates IDs with a fixed `Q` prefix only: `Q-1`, `Q-2`, `Q-16`. The `generateDisplayId` function receives entity type `"Question"` and maps it to the prefix `"Q"` from `ENTITY_PREFIXES`. No scope segment is incorporated. No zero-padding. The feature-scope compound format (`{EPIC}-{FEATURE}`) is never produced. Epic prefix uniqueness is not validated in the question creation or scope-update paths.
- **The gap:** The produced IDs (`Q-1`, `Q-2`) are meaningless for human scanning by scope. Team members cannot tell from an ID whether a question is engagement-wide or scoped to a specific epic. The entire semantic value of the ID scheme — enabling fast triage by scanning IDs alone — is lost.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Question System Fidelity

---

### GAP-DISC-002: IMPACT ASSESSED state missing from lifecycle enum; REVIEWED state added without PRD basis

- **Severity:** Significant
- **Perspective:** Functionality / Architecture
- **PRD Reference:** Section 9.1
- **What PRD says:** The question lifecycle is `RAISED > SCOPED > OWNED > ANSWERED > IMPACT ASSESSED`. IMPACT ASSESSED is the terminal state, reached after the AI performs its post-answer analysis.
- **What exists:** `prisma/schema.prisma` `enum QuestionStatus` has: `OPEN`, `SCOPED`, `OWNED`, `ANSWERED`, `REVIEWED`, `PARKED`. `IMPACT_ASSESSED` is absent. `REVIEWED` (an SA quality-check flag) has been substituted but is not part of the PRD lifecycle at all. The transition table in `src/actions/questions.ts` (lines 400–415) enforces `ANSWERED -> REVIEWED` as the advancement path. The `questionImpactAssessmentFunction` writes `impactAssessment` to the Question record but never advances status.
- **The gap:** The lifecycle has no terminal state marking "this question has been fully processed." There is no machine-readable signal distinguishing "answered but AI analysis pending" from "answered and impact fully assessed." The introduced `REVIEWED` state conflates a human SA quality-check (which exists in the UI as a `needsReview` boolean) with a lifecycle position.
- **Scope estimate:** S
- **Dependencies:** GAP-DISC-003
- **Suggested phase grouping:** Question System Fidelity

---

### GAP-DISC-003: AI impact assessment stores text but does not execute downstream actions

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 9.1 (step 5)
- **What PRD says:** After an answer, the AI must: (1) update any existing technical design or assumption that changed; (2) flag blocked work items as unblocked; (3) raise new follow-up questions as Question records; (4) flag contradictions with prior decisions.
- **What exists:** `src/lib/inngest/functions/question-impact-assessment.ts` runs `questionAnsweringTask` and writes `result.output` (a string) to `question.impactAssessment`. Nothing else happens. The Inngest function does not create new Question records, does not transition any blocked work items, does not create conflict/decision records. The `ImpactAssessment` component (`src/components/questions/impact-assessment.tsx`) renders the JSON output client-side, but the `newQuestionsRaised` array it renders is advisory display — those questions are never persisted. The prompt in `question-answering.ts` asks the AI to mention follow-up questions and affected areas, but the harness ignores this structured output and stores only the raw string.
- **The gap:** The impact assessment is read-only text. All four PRD-mandated downstream write operations are absent. The assessment is informational, not operational.
- **Scope estimate:** L
- **Dependencies:** GAP-DISC-002
- **Suggested phase grouping:** AI-Driven Discovery Intelligence

---

### GAP-DISC-004: `questionImpactFunction` (hybrid routing with conflict detection) is unreachable from the direct answer UI path

- **Severity:** Significant
- **Perspective:** Functionality / Architecture
- **PRD Reference:** Section 9.1
- **What exists:** Two Inngest functions handle question impact. `questionImpactAssessmentFunction` (`src/lib/inngest/functions/question-impact-assessment.ts`) triggers on `ENTITY_CONTENT_CHANGED` with `action=answered`, which is what `answerQuestion` action fires (line 219 of `src/actions/questions.ts`). `questionImpactFunction` (`src/lib/inngest/functions/question-impact.ts`) triggers on `QUESTION_IMPACT_REQUESTED`, which is only fired from `src/actions/conversations.ts` line 434 (the chat answer path). The richer function — containing the `flag_conflict` tool, hybrid routing, and `QUESTION_SESSION` conversation creation — is only reachable via chat. The direct answer form in the question detail page uses the simpler function.
- **The gap:** Questions answered through the primary UI path (question detail page answer form) bypass all conflict detection logic. Additionally, the two functions have no coordination — a question answered via chat could trigger both events, producing two independent AI assessments writing to the same `impactAssessment` field with a race condition.
- **Scope estimate:** M
- **Dependencies:** GAP-DISC-003
- **Suggested phase grouping:** AI-Driven Discovery Intelligence

---

### GAP-DISC-005: `QuestionAffects` join table exists in schema but is never populated, queried, or displayed

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 9.3 (Affects field), Section 9.4 (Cross-Cutting Questions)
- **What PRD says:** The "Affects" field lists which epics/features a cross-cutting engagement-wide question touches. The AI identifies cross-cutting questions automatically when it detects the question's subject relates to multiple epics.
- **What exists:** `prisma/schema.prisma` defines `model QuestionAffects` (lines 1297–1308) with the correct structure. Searching `src/` for `questionAffects` returns zero matches. It is not included in any Prisma `include`, not written by any action or task, and not rendered anywhere. The question detail page (`[questionId]/page.tsx`) does not query it. The question form has no UI for selecting affected epics.
- **The gap:** The entire cross-cutting question concept is unavailable. An engagement-level question cannot be linked to the multiple epics it affects. The AI has no mechanism to detect and tag cross-cutting questions.
- **Scope estimate:** M
- **Dependencies:** None
- **Suggested phase grouping:** Question System Fidelity

---

### GAP-DISC-006: `source` field (manual / transcript / chat) absent from Question model

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 9.3
- **What PRD says:** Each question record includes a `source` field: manual, transcript, or chat.
- **What exists:** The `Question` model in `prisma/schema.prisma` has no `source` field. No `QuestionSource` enum exists. The transcript processing pipeline and the `createQuestion` action both create questions with no origin tracking.
- **The gap:** There is no machine-readable way to know where a question came from. Discovery pipeline attribution, filtering by source, and audit trail completeness are all missing.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Question System Fidelity

---

### GAP-DISC-007: Question owner cannot be set to "Client ({name})" or "TBD" — only project members are supported

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 9.1 (step 3), Section 9.3
- **What PRD says:** An owner is "a specific team member, the Client ({name}), or TBD."
- **What exists:** `Question.ownerId` is a FK to `ProjectMember`. `Question.ownerDescription String?` exists in the schema but is never written or read anywhere in `src/` (zero matches). `createQuestion` accepts only `assigneeId`. The `QuestionForm` renders only team members in the assignee dropdown.
- **The gap:** Questions cannot be attributed to client contacts or marked TBD. The `ownerDescription` field is dead schema. Any question requiring client input must either go unassigned or be assigned to a proxy team member, losing the semantic meaning of "waiting on client."
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Question System Fidelity

---

### GAP-DISC-008: Question detail page does not render `parkedReason` or `QuestionAffects`

- **Severity:** Minor
- **Perspective:** UX
- **PRD Reference:** Section 9.3
- **What PRD says:** Parked questions display a Parked Reason. The Affects field shows which epics/features a cross-cutting question touches.
- **What exists:** `src/components/questions/question-detail.tsx` — the `QuestionDetailData` interface does not include `parkedReason`, and the component renders no parked-reason section. The page server component (`[questionId]/page.tsx`) includes `questionBlocksStories`, `questionBlocksEpics`, `questionBlocksFeatures`, and `decisionQuestions` in its query but omits `questionAffects`. Neither the interface type nor the JSX renders affected epics/features.
- **The gap:** Users viewing a parked question cannot see why it was parked. Cross-cutting relationships for engagement-level questions are invisible in the detail view even once GAP-DISC-005 is resolved.
- **Scope estimate:** S
- **Dependencies:** GAP-DISC-005
- **Suggested phase grouping:** Question System Fidelity

---

### GAP-DISC-009: Discovery intelligence — gap detection not implemented

- **Severity:** Critical
- **Perspective:** Functionality
- **PRD Reference:** Section 8.3 (Gap Detection)
- **What PRD says:** The AI identifies areas where not enough information has been gathered: "Epic: Data Migration has 12 open questions and 3 have been answered. The merge rules and duplicate handling questions are blocking technical design."
- **What exists:** No Inngest function, agent harness task, API route, or UI component implements gap detection. The `dashboardSynthesisTask` includes a `knowledgeGaps` field in its output prompt, but this is prose inside a general briefing — not an epic-level gap analysis. There is no per-epic question coverage calculation anywhere.
- **The gap:** The concept does not exist in code. There is no analysis of discovery coverage by epic, no identification of epics with zero answered questions, and no proactive flagging of areas that lack sufficient information to begin design.
- **Scope estimate:** L
- **Dependencies:** GAP-DISC-012
- **Suggested phase grouping:** AI-Driven Discovery Intelligence

---

### GAP-DISC-010: Discovery intelligence — readiness assessment not implemented

- **Severity:** Critical
- **Perspective:** Functionality
- **PRD Reference:** Section 8.3 (Readiness Assessment)
- **What PRD says:** The AI suggests when there is enough information to begin creating epics, features, or user stories, with reasoning referencing specific answered requirements.
- **What exists:** Searching `src/` for readiness assessment concepts returns zero matches. The `briefing-generation.ts` task does not include readiness signaling. No Inngest function evaluates question answer ratios or requirement coverage to suggest readiness.
- **The gap:** This capability does not exist. The key value proposition of "the AI tells you when to stop doing discovery and start writing stories" is entirely unimplemented.
- **Scope estimate:** L
- **Dependencies:** None
- **Suggested phase grouping:** AI-Driven Discovery Intelligence

---

### GAP-DISC-011: Discovery intelligence — follow-up recommendations lack question-level prioritization by blocking impact

- **Severity:** Significant
- **Perspective:** Functionality
- **PRD Reference:** Section 8.3 (Follow-Up Recommendations)
- **What PRD says:** The AI recommends which questions to prioritize based on what they block — identifying the specific question ID, number of blocked work items, and why it should be asked next.
- **What exists:** The `dashboardSynthesisTask` prompts the AI to produce a `recommendedFocus` string. This is a prose paragraph, not a structured ranked list. `QuestionBlocksStory` / `QuestionBlocksEpic` / `QuestionBlocksFeature` join tables exist and are queryable, but blocking counts are never aggregated into a ranking. The `OutstandingQuestions` dashboard component shows status counts, not prioritized question lists with blocking reasons.
- **The gap:** There is no ranked question queue based on blocking impact. The `recommendedFocus` briefing paragraph is qualitatively useful but does not provide the specific question-level actionable guidance described in the PRD.
- **Scope estimate:** M
- **Dependencies:** GAP-DISC-009
- **Suggested phase grouping:** AI-Driven Discovery Intelligence

---

### GAP-DISC-012: Discovery dashboard missing three of seven PRD-specified sections

- **Severity:** Significant
- **Perspective:** Functionality / UI Structure
- **PRD Reference:** Section 8.4
- **What PRD says:** The discovery dashboard shows: (1) outstanding questions by scope with owner and age, (2) AI-recommended follow-up questions with reasoning, (3) recently answered questions and their impact, (4) blocked work items, (5) overall discovery progress per epic, (6) requirements captured but not yet mapped to epics/stories, (7) project health score.
- **What exists:** `src/app/(dashboard)/projects/[projectId]/dashboard/page.tsx` renders: health score (7 — present), current focus briefing, outstanding questions stats (1 — partial), blocked items (4 — present), recommended focus briefing (2 — degraded as prose). Missing entirely: (3) recently answered questions, (5) per-epic discovery progress breakdown, (6) requirements-not-mapped section. The `computeHealthScore` and `getQuestionStats` queries exist in `src/lib/dashboard/queries` but there is no per-epic question answered/raised ratio query.
- **The gap:** Three sections are entirely absent. Two sections present in degraded form: outstanding questions shows aggregate counts but not per-scope/per-owner aging, and follow-up recommendations are prose rather than structured question cards with blocking counts and reasoning.
- **Scope estimate:** M
- **Dependencies:** GAP-DISC-009, GAP-DISC-010
- **Suggested phase grouping:** Discovery Dashboard Completion

---

### GAP-DISC-013: No pagination in the questions list page — full dataset loaded on every render

- **Severity:** Minor
- **Perspective:** Functionality
- **PRD Reference:** Section 9.5
- **What PRD says:** At scale, a project might have 100-200 total questions.
- **What exists:** `src/app/(dashboard)/projects/[projectId]/questions/page.tsx` queries `db.question.findMany` with no `take` or `skip` — all questions are loaded in a single query. The `getQuestions` server action in `src/actions/questions.ts` (lines 315–354) correctly implements pagination with `page`/`pageSize` parameters, but the questions page does not use this action — it queries directly.
- **The gap:** The page will degrade at scale. The paginated action exists but is not wired to the page.
- **Scope estimate:** S
- **Dependencies:** None
- **Suggested phase grouping:** Question System Fidelity

---

### GAP-DISC-014: `ESCALATED` status referenced in agent task code does not exist in schema enum

- **Severity:** Minor
- **Perspective:** Architecture
- **PRD Reference:** Section 9.1
- **What exists:** `src/lib/agent-harness/tasks/question-answering.ts` line 189 includes `"ESCALATED"` in the `update_question_status` tool's status enum. `src/lib/agent-harness/tasks/dashboard-synthesis.ts` line 39 filters `status === "ESCALATED"` for statistics. The `QuestionStatus` enum in `prisma/schema.prisma` has no `ESCALATED` value. If the AI invokes `update_question_status` with `status: "ESCALATED"`, the Prisma `question.update` will throw a database enum validation error at runtime.
- **The gap:** Latent runtime error in the agent harness. The agent is told it can escalate a question but the database rejects that value. The dashboard statistics silently produce `escalatedCount = 0` because the filter never matches any real record.
- **Scope estimate:** S
- **Dependencies:** GAP-DISC-002
- **Suggested phase grouping:** Question System Fidelity

---

### Cross-Reference Notes (Agent 2 Domain — Transcript Extraction)

The following issues originate in transcript processing (Agent 2's scope) but have downstream effects on the gaps above:

- Questions extracted from transcripts do not set a `source` field, compounding GAP-DISC-006.
- The transcript AI pipeline does not populate `QuestionAffects` for cross-cutting questions it identifies, compounding GAP-DISC-005.
- Readiness assessment (GAP-DISC-010) depends on transcript-extracted questions having accurate scope and blocking metadata.

---

### Gap Summary

| ID | Title | Severity | Scope |
|----|-------|----------|-------|
| GAP-DISC-001 | Question ID scheme deviates from PRD spec | Significant | M |
| GAP-DISC-002 | IMPACT ASSESSED state missing; REVIEWED added without PRD basis | Significant | S |
| GAP-DISC-003 | AI impact assessment stores text but executes no downstream actions | Significant | L |
| GAP-DISC-004 | Hybrid routing function unreachable from direct answer UI path | Significant | M |
| GAP-DISC-005 | QuestionAffects table is schema-only — never populated or displayed | Significant | M |
| GAP-DISC-006 | `source` field absent from Question model | Minor | S |
| GAP-DISC-007 | Owner cannot be "Client" or "TBD" — only team members | Minor | S |
| GAP-DISC-008 | Detail page missing `parkedReason` and QuestionAffects rendering | Minor | S |
| GAP-DISC-009 | Gap detection not implemented | Critical | L |
| GAP-DISC-010 | Readiness assessment not implemented | Critical | L |
| GAP-DISC-011 | Follow-up recommendations lack question-level blocking prioritization | Significant | M |
| GAP-DISC-012 | Discovery dashboard missing 3 of 7 PRD sections | Significant | M |
| GAP-DISC-013 | Questions list has no pagination — full dataset loaded every render | Minor | S |
| GAP-DISC-014 | ESCALATED status in agent code has no schema enum value — latent runtime error | Minor | S |