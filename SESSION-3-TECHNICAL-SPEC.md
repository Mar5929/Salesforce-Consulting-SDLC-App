# Session 3 Technical Specification
# Salesforce Consulting AI Framework

**Date:** April 3, 2026
**Companion to:** SF-Consulting-AI-Framework-PRD-v2.1.md
**Purpose:** Detailed technical specifications for database schema, AI agent harness architecture, context window budget strategy, and dashboard implementation. Produced during Session 3 PRD deep-dive.

---

## Table of Contents

1. [Decisions Locked in Session 3](#1-decisions-locked-in-session-3)
2. [Database Schema — Full Entity and Relationship Design](#2-database-schema)
3. [AI Agent Harness — Implementation Architecture](#3-ai-agent-harness)
4. [Context Window Budget Strategy](#4-context-window-budget-strategy)
5. [Dashboard Architecture](#5-dashboard-architecture)
6. [Remaining Tier 2 Items for Future Sessions](#6-remaining-items)

---

## 1. Decisions Locked in Session 3

### Schema Decisions

- **Developer atomic tasks are ephemeral.** When Claude Code breaks a user story into implementation steps, those steps exist only within the Claude Code session. The web app tracks work at the story level. No `Task` entity in the web app database for developer execution steps.
- **Question blocking scope: Stories, Epics, and Features only (V1).** No polymorphic blocking against arbitrary entity types. Three explicit join tables instead of a generic polymorphic pattern.
- **Sprint-Story relationship: simple FK.** `sprintId` on the Story entity. Sprint carryover history not tracked in V1 (known simplification).
- **Session Log granularity: one entry per harness invocation.** Not per API call, not per user session. One transcript processing run = one session log entry.
- **Milestones are a first-class entity.** Progress is computed from linked stories and blocking questions, not stored statically.
- **Epic Phase Tracking is a first-class entity.** Each epic independently tracks its status across applicable project phases.
- **TestCase is its own table.** Not a JSON array on Story. Enables individual pass/fail tracking per test execution.

### Agent Harness Decisions

- **Three-layer architecture:** Task Definitions → Execution Engine → Context Assembly.
- **No rollback on partial agent loop failure.** Each tool call commits independently. Partial results preserved.
- **Dashboard synthesis: hybrid approach.** Quantitative data from instant Postgres queries. AI-synthesized narratives cached, refreshed on state changes or manual trigger.
- **Transcript processing cost acknowledged:** ~$0.50-$4.00 per transcript depending on model tier. Acceptable as cost of doing business.

---

## 2. Database Schema

### 2.1 Entity Relationship Overview

```
Project
  ├── ProjectMember (user ↔ project with role)
  ├── Epic
  │     ├── EpicPhase (per-phase status tracking)
  │     ├── Feature
  │     │     └── Story
  │     └── Story (can belong to epic directly, without feature)
  │           ├── StoryComponent → OrgComponent
  │           ├── TestCase
  │           │     └── TestExecution
  │           └── Defect
  ├── Question
  │     ├── QuestionBlocksStory → Story
  │     ├── QuestionBlocksEpic → Epic
  │     ├── QuestionBlocksFeature → Feature
  │     └── QuestionAffects → Epic/Feature (cross-cutting)
  ├── Decision
  │     ├── DecisionQuestion → Question
  │     └── DecisionScope → Epic/Feature
  ├── Requirement
  │     ├── RequirementEpic → Epic
  │     └── RequirementStory → Story
  ├── Risk
  │     └── RiskEpic → Epic
  ├── Milestone
  │     └── MilestoneStory → Story
  ├── Sprint
  ├── OrgComponent
  │     ├── OrgRelationship
  │     ├── DomainGrouping
  │     └── BusinessContextAnnotation
  ├── Transcript
  ├── SessionLog
  ├── GeneratedDocument
  ├── Attachment
  └── VersionHistory
```

### 2.2 Detailed Entity Specifications

Below is the complete set of entities with field types, constraints, and foreign keys. This maps directly to the Prisma schema you'll build.

---

#### Project

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, auto-generated | |
| name | String | Required | |
| clientName | String | Required | |
| engagementType | Enum | GREENFIELD, BUILD_PHASE, MANAGED_SERVICES, RESCUE_TAKEOVER | Affects default epics and AI prioritization |
| currentPhase | Enum | DISCOVERY, REQUIREMENTS, SOLUTION_DESIGN, BUILD, TESTING, DEPLOYMENT, HYPERCARE, ARCHIVE | Project-level phase indicator |
| startDate | DateTime | Required | |
| targetEndDate | DateTime | Nullable | TBD allowed |
| status | Enum | ACTIVE, ARCHIVED | |
| sfOrgInstanceUrl | String | Nullable, encrypted | Salesforce org connection |
| sfOrgAccessToken | String | Nullable, encrypted | Encrypted at rest |
| sfOrgRefreshToken | String | Nullable, encrypted | For token refresh |
| sfOrgLastSyncAt | DateTime | Nullable | Last successful metadata sync |
| sfOrgSyncIntervalHours | Int | Default: 4 | Configurable sync interval |
| cachedBriefingContent | JSON | Nullable | Cached AI-synthesized briefing |
| cachedBriefingGeneratedAt | DateTime | Nullable | Timestamp for briefing freshness |
| healthScoreThresholds | JSON | Default values | Configurable per-project thresholds |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

---

#### ProjectMember

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| clerkUserId | String | Required | User ID from Clerk |
| displayName | String | Required | Cached from Clerk for display |
| email | String | Required | Cached from Clerk |
| role | Enum | SOLUTION_ARCHITECT, DEVELOPER, PM, BA, QA | Per-project role |
| status | Enum | ACTIVE, REMOVED | Soft delete |
| joinedAt | DateTime | Auto-set | |
| removedAt | DateTime | Nullable | |

Unique constraint: (projectId, clerkUserId) — one role per user per project.

---

#### Epic

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| name | String | Required | e.g., "Field Mapping", "Data Migration" |
| prefix | String | Required, unique within project | 2-4 letter code for ID generation (e.g., "FM", "DM") |
| description | Text | Nullable | |
| status | Enum | NOT_STARTED, IN_PROGRESS, COMPLETE | Overall epic status |
| sortOrder | Int | Required | Display ordering |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

---

#### EpicPhase

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| epicId | UUID | FK → Epic | |
| phase | Enum | DISCOVERY, DESIGN, BUILD, TEST, DEPLOY | |
| status | Enum | NOT_STARTED, IN_PROGRESS, COMPLETE, SKIPPED | |
| sortOrder | Int | Required | Phase display ordering |

Unique constraint: (epicId, phase) — one record per phase per epic.

---

#### Feature

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| epicId | UUID | FK → Epic | |
| name | String | Required | |
| description | Text | Nullable | |
| status | Enum | NOT_STARTED, IN_PROGRESS, COMPLETE | |
| sortOrder | Int | Required | |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

---

#### Story (User Story)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| epicId | UUID | FK → Epic | |
| featureId | UUID | Nullable FK → Feature | Optional grouping |
| sprintId | UUID | Nullable FK → Sprint | Assigned when sprint-planned |
| assigneeId | UUID | Nullable FK → ProjectMember | |
| displayId | String | Auto-generated, unique within project | e.g., "STORY-FM-001" using epic prefix |
| title | String | Required | |
| persona | Text | Nullable | "As a [role]..." — required for Ready status |
| description | Text | Nullable | What the user needs and why — required for Ready |
| acceptanceCriteria | Text | Nullable | Given/When/Then — required for Ready |
| storyPoints | Int | Nullable | Required for sprint entry |
| priority | Enum | LOW, MEDIUM, HIGH, CRITICAL | Default: MEDIUM |
| status | Enum | DRAFT, READY, SPRINT_PLANNED, IN_PROGRESS, IN_REVIEW, QA, DONE | |
| dependencies | Text | Nullable | Freeform notes on what this story depends on |
| notes | Text | Nullable | Implementation notes, context |
| sortOrder | Int | Required | Execution ordering within epic |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

**Validation rule (enforced by application, not database):** Transition from DRAFT to READY requires: persona, description, acceptanceCriteria, storyPoints, at least one TestCase record, and at least one StoryComponent record. Transition to SPRINT_PLANNED requires sprintId.

---

#### Question

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| displayId | String | Auto-generated | e.g., "Q-ENG-001", "Q-FM-003" per Section 9.2 scheme |
| questionText | Text | Required | Clear enough for someone outside the project to understand |
| scope | Enum | ENGAGEMENT, EPIC, FEATURE | |
| scopeEpicId | UUID | Nullable FK → Epic | Set when scope = EPIC or FEATURE |
| scopeFeatureId | UUID | Nullable FK → Feature | Set when scope = FEATURE |
| ownerId | UUID | Nullable FK → ProjectMember | |
| ownerDescription | String | Nullable | For non-team owners: "Client (Sarah)", "TBD" |
| status | Enum | OPEN, ANSWERED, PARKED | |
| askedDate | DateTime | Auto-set on creation | |
| answerText | Text | Nullable | Populated when answered |
| answeredDate | DateTime | Nullable | |
| answeredById | UUID | Nullable FK → ProjectMember | Who provided/recorded the answer |
| impactAssessment | Text | Nullable | AI-generated: what changed as a result |
| parkedReason | Text | Nullable | Why deferred |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

---

#### Decision

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| displayId | String | Auto-generated | e.g., "D-FM-001" |
| title | String | Required | Short summary |
| rationale | Text | Required | Why this decision was made |
| decisionDate | DateTime | Required | |
| madeById | UUID | Nullable FK → ProjectMember | |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

---

#### Requirement

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| displayId | String | Auto-generated | e.g., "REQ-001" |
| description | Text | Required | |
| source | String | Nullable | Where/who this requirement came from |
| priority | Enum | LOW, MEDIUM, HIGH, CRITICAL | Default: MEDIUM |
| status | Enum | CAPTURED, MAPPED, DEFERRED | Mapped = linked to at least one epic or story |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

---

#### Risk

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| displayId | String | Auto-generated | e.g., "RISK-001" |
| description | Text | Required | |
| likelihood | Enum | LOW, MEDIUM, HIGH | |
| impact | Enum | LOW, MEDIUM, HIGH | |
| severity | Enum | LOW, MEDIUM, HIGH, CRITICAL | Can be computed or manually set |
| mitigationStrategy | Text | Nullable | |
| status | Enum | OPEN, MITIGATED, CLOSED, ACCEPTED | |
| ownerId | UUID | Nullable FK → ProjectMember | |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

---

#### Milestone

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| name | String | Required | e.g., "Discovery + field mapping complete" |
| description | Text | Nullable | "What must happen" criteria |
| targetDate | DateTime | Nullable | TBD allowed |
| status | Enum | NOT_STARTED, IN_PROGRESS, COMPLETE | |
| sortOrder | Int | Required | Roadmap display ordering |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

Progress is computed at query time from MilestoneStory join table — percentage of linked stories in DONE status.

---

#### Sprint

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| name | String | Required | e.g., "Sprint 1" |
| goal | Text | Nullable | Sprint goal statement |
| startDate | DateTime | Required | |
| endDate | DateTime | Required | |
| status | Enum | PLANNING, ACTIVE, COMPLETE | |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

---

#### TestCase

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| storyId | UUID | FK → Story | |
| title | String | Required | |
| steps | Text | Nullable | Step-by-step test procedure |
| expectedResult | Text | Required | |
| testType | Enum | HAPPY_PATH, EDGE_CASE, NEGATIVE, BULK | |
| source | Enum | AI_GENERATED, MANUAL | How it was created |
| sortOrder | Int | Required | |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

---

#### TestExecution

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| testCaseId | UUID | FK → TestCase | |
| executedById | UUID | FK → ProjectMember | |
| executedAt | DateTime | Required | |
| result | Enum | PASS, FAIL, BLOCKED | |
| notes | Text | Nullable | |
| defectId | UUID | Nullable FK → Defect | If result = FAIL, optionally link to defect |
| environment | String | Nullable | Where the test was run |

---

#### Defect

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| storyId | UUID | Nullable FK → Story | |
| testCaseId | UUID | Nullable FK → TestCase | Test case that exposed it |
| displayId | String | Auto-generated | e.g., "DEF-001" |
| title | String | Required | |
| severity | Enum | LOW, MEDIUM, HIGH, CRITICAL | |
| stepsToReproduce | Text | Required | |
| expectedBehavior | Text | Required | |
| actualBehavior | Text | Required | |
| environment | String | Nullable | |
| status | Enum | OPEN, ASSIGNED, FIXED, VERIFIED, CLOSED | |
| assigneeId | UUID | Nullable FK → ProjectMember | |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

---

#### OrgComponent

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| apiName | String | Required | Salesforce API name |
| label | String | Nullable | Human-readable label |
| componentType | Enum | OBJECT, FIELD, APEX_CLASS, APEX_TRIGGER, FLOW, PROCESS_BUILDER, WORKFLOW_RULE, VALIDATION_RULE, LWC, AURA, PERMISSION_SET, PROFILE, PERMISSION_SET_GROUP, CONNECTED_APP, NAMED_CREDENTIAL, REMOTE_SITE_SETTING, PLATFORM_EVENT, CUSTOM_METADATA_TYPE, RECORD_TYPE, PAGE_LAYOUT, INSTALLED_PACKAGE, OTHER | |
| parentComponentId | UUID | Nullable FK → OrgComponent (self) | For fields: parent object. For triggers: parent object. |
| namespace | String | Nullable | Managed package namespace |
| apiVersion | String | Nullable | |
| isActive | Boolean | Default: true | |
| domainGroupingId | UUID | Nullable FK → DomainGrouping | |
| componentStatus | Enum | EXISTING, PLANNED, DEPRECATED | PLANNED = referenced by stories but doesn't exist in org yet |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |
| lastSyncedAt | DateTime | Nullable | When last seen in a metadata sync |

Unique constraint: (projectId, apiName, componentType) — one record per component per project.

---

#### OrgRelationship

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| sourceComponentId | UUID | FK → OrgComponent | |
| targetComponentId | UUID | FK → OrgComponent | |
| relationshipType | Enum | LOOKUP, MASTER_DETAIL, TRIGGER_ON, FLOW_ON, REFERENCES | |

---

#### DomainGrouping

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| name | String | Required | e.g., "Sales", "Finance", "Marketing" |
| description | Text | Nullable | |
| isAiSuggested | Boolean | Default: true | True if AI proposed it, false if human created |
| isConfirmed | Boolean | Default: false | Architect confirms AI suggestions |

---

#### BusinessContextAnnotation

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| orgComponentId | UUID | FK → OrgComponent | |
| annotationText | Text | Required | Human-provided business context |
| createdById | UUID | FK → ProjectMember | |
| createdAt | DateTime | Auto-set | |

---

#### Transcript

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| uploadedById | UUID | FK → ProjectMember | |
| uploadedAt | DateTime | Auto-set | |
| title | String | Nullable | Optional label |
| rawContent | Text | Nullable | For small transcripts; otherwise use S3 ref |
| s3Key | String | Nullable | For large transcripts stored in S3 |
| processingStatus | Enum | PENDING, PROCESSING, COMPLETE, FAILED | |
| sessionLogId | UUID | Nullable FK → SessionLog | Link to the processing session |

---

#### SessionLog

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| userId | UUID | FK → ProjectMember | Who triggered the AI interaction |
| taskType | Enum | TRANSCRIPT_PROCESSING, QUESTION_ANSWERING, STORY_GENERATION, STORY_ENRICHMENT, BRIEFING_GENERATION, STATUS_REPORT_GENERATION, DOCUMENT_GENERATION, SPRINT_ANALYSIS, CONTEXT_PACKAGE_ASSEMBLY, ORG_QUERY, DASHBOARD_SYNTHESIS | Maps to Section 6.2 task types |
| status | Enum | RUNNING, COMPLETE, FAILED, PARTIAL | PARTIAL = agent loop stopped early with some results |
| startedAt | DateTime | Auto-set | |
| completedAt | DateTime | Nullable | |
| inputTokens | Int | Default: 0 | |
| outputTokens | Int | Default: 0 | |
| totalIterations | Int | Default: 1 | Number of agent loop iterations |
| summary | Text | Nullable | AI-generated summary of what was done |
| entitiesCreated | JSON | Nullable | Array of {entityType, entityId} for audit trail |
| entitiesModified | JSON | Nullable | Array of {entityType, entityId, fieldsChanged} |
| errorMessage | Text | Nullable | If status = FAILED |

---

#### GeneratedDocument

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| title | String | Required | |
| documentType | Enum | BRD, SDD, SOW, STATUS_REPORT, PRESENTATION, TEST_SCRIPT, DEPLOYMENT_RUNBOOK, TRAINING_MATERIAL, OTHER | |
| format | Enum | DOCX, PPTX, PDF | |
| s3Key | String | Required | S3 file reference |
| templateUsed | String | Nullable | Which template was used |
| generatedById | UUID | FK → ProjectMember | |
| sessionLogId | UUID | Nullable FK → SessionLog | |
| createdAt | DateTime | Auto-set | |

---

#### Attachment

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| entityType | String | Required | "Story", "Defect", "Question", etc. |
| entityId | UUID | Required | FK to the owning entity (not enforced at DB level) |
| s3Key | String | Required | |
| originalFilename | String | Required | |
| contentType | String | Required | MIME type |
| fileSizeBytes | Int | Required | |
| uploadedById | UUID | FK → ProjectMember | |
| uploadedAt | DateTime | Auto-set | |

---

#### VersionHistory

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| entityType | String | Required | "Story", "Question", "Decision", etc. |
| entityId | UUID | Required | |
| version | Int | Required | Incrementing version number |
| previousState | JSON | Required | Full snapshot of the entity before modification |
| modifiedById | UUID | FK → ProjectMember | |
| modifiedAt | DateTime | Auto-set | |

---

### 2.3 Join Tables

All join tables follow the same pattern: composite unique constraint on the two FK columns, no additional fields unless noted.

#### QuestionBlocksStory
| Field | Type |
|---|---|
| questionId | UUID FK → Question |
| storyId | UUID FK → Story |

#### QuestionBlocksEpic
| Field | Type |
|---|---|
| questionId | UUID FK → Question |
| epicId | UUID FK → Epic |

#### QuestionBlocksFeature
| Field | Type |
|---|---|
| questionId | UUID FK → Question |
| featureId | UUID FK → Feature |

#### QuestionAffects
| Field | Type | Notes |
|---|---|---|
| questionId | UUID FK → Question | |
| epicId | UUID Nullable FK → Epic | At least one must be set |
| featureId | UUID Nullable FK → Feature | |

#### DecisionQuestion
| Field | Type |
|---|---|
| decisionId | UUID FK → Decision |
| questionId | UUID FK → Question |

#### DecisionScope
| Field | Type |
|---|---|
| decisionId | UUID FK → Decision |
| epicId | UUID Nullable FK → Epic |
| featureId | UUID Nullable FK → Feature |

#### RequirementEpic
| Field | Type |
|---|---|
| requirementId | UUID FK → Requirement |
| epicId | UUID FK → Epic |

#### RequirementStory
| Field | Type |
|---|---|
| requirementId | UUID FK → Requirement |
| storyId | UUID FK → Story |

#### RiskEpic
| Field | Type |
|---|---|
| riskId | UUID FK → Risk |
| epicId | UUID FK → Epic |

#### StoryComponent
| Field | Type | Notes |
|---|---|---|
| storyId | UUID FK → Story | |
| orgComponentId | UUID FK → OrgComponent | |
| impactType | Enum: CREATE, MODIFY, DELETE | What the story does to this component |

This table is the foundation of sprint intelligence — conflict detection queries join on orgComponentId to find overlapping stories.

#### MilestoneStory
| Field | Type |
|---|---|
| milestoneId | UUID FK → Milestone |
| storyId | UUID FK → Story |

---

## 3. AI Agent Harness — Implementation Architecture

### 3.1 Three-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Next.js)               │
│  User clicks "Process Transcript" / "Generate     │
│  Briefing" / "Enrich Story" / etc.                │
└──────────────────────┬──────────────────────────┘
                       │ Server Action or API Route
                       ▼
┌─────────────────────────────────────────────────┐
│          Layer 1: Task Definitions                │
│                                                   │
│  Each task type is a config object:               │
│  {                                                │
│    taskType: "TRANSCRIPT_PROCESSING",             │
│    systemPromptTemplate: "...",                    │
│    contextLoader: async (input, projectId) => {}, │
│    tools: [...claude API tool definitions...],    │
│    outputValidator: (result) => {},               │
│    executionMode: "AGENT_LOOP",                   │
│    maxIterations: 10,                             │
│    maxRetries: 2                                  │
│  }                                                │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│          Layer 2: Execution Engine                 │
│                                                   │
│  1. Call contextLoader → project data from DB     │
│  2. Assemble system prompt (template + context    │
│     + firm rules)                                 │
│  3. Call Claude API (prompt + tools + user input) │
│  4. If tool_use → execute tools (DB writes) →     │
│     return results → loop back to step 3          │
│  5. Run outputValidator on final response         │
│  6. If invalid → re-prompt with corrections       │
│  7. Write SessionLog entry                        │
│  8. Return result to frontend                     │
└──────────────────────┬──────────────────────────┘
                       │ DB queries
                       ▼
┌─────────────────────────────────────────────────┐
│          Layer 3: Context Assembly                 │
│                                                   │
│  Reusable query functions:                        │
│  - getProjectSummary(projectId)                   │
│  - getEpicContext(epicId)                         │
│  - getOpenQuestions(projectId, scope?)             │
│  - getOrgComponents(projectId, componentNames?)   │
│  - getRecentSessions(projectId, limit)            │
│  - getBlockingRelationships(projectId)            │
│  - getMilestoneProgress(projectId)                │
│  - getStoryWithContext(storyId)                   │
│  - getSprintStories(sprintId)                     │
│                                                   │
│  Each task's contextLoader composes these         │
│  differently based on what the task needs.        │
└─────────────────────────────────────────────────┘
```

### 3.2 Task Definition Structure (TypeScript)

```typescript
// types/agent-harness.ts

type ExecutionMode = "SINGLE_TURN" | "AGENT_LOOP";

type TaskType =
  | "TRANSCRIPT_PROCESSING"
  | "QUESTION_ANSWERING"
  | "STORY_GENERATION"
  | "STORY_ENRICHMENT"
  | "BRIEFING_GENERATION"
  | "STATUS_REPORT_GENERATION"
  | "DOCUMENT_GENERATION"
  | "SPRINT_ANALYSIS"
  | "CONTEXT_PACKAGE_ASSEMBLY"
  | "ORG_QUERY"
  | "DASHBOARD_SYNTHESIS";

interface TaskDefinition {
  taskType: TaskType;
  systemPromptTemplate: string;
  contextLoader: (input: TaskInput, projectId: string) => Promise<ProjectContext>;
  tools: ClaudeToolDefinition[];
  outputValidator: (result: AIResult) => ValidationResult;
  executionMode: ExecutionMode;
  maxIterations: number;    // For AGENT_LOOP; ignored for SINGLE_TURN
  maxRetries: number;       // Re-prompt attempts on validation failure
}

interface TaskInput {
  userMessage: string;
  entityId?: string;        // Story ID, question ID, etc. if task targets a specific entity
  metadata?: Record<string, unknown>;
}

interface ProjectContext {
  summary?: ProjectSummary;
  epics?: EpicContext[];
  questions?: QuestionData[];
  orgComponents?: OrgComponentData[];
  stories?: StoryData[];
  decisions?: DecisionData[];
  sessions?: SessionLogData[];
  blockingRelationships?: BlockingData[];
  milestones?: MilestoneData[];
  [key: string]: unknown;
}

interface ValidationResult {
  valid: boolean;
  corrections?: string[];   // Specific instructions for re-prompting
}
```

### 3.3 Context Loader Examples

```typescript
// task-definitions/transcript-processing.ts

const transcriptProcessingContextLoader = async (
  input: TaskInput,
  projectId: string
): Promise<ProjectContext> => {
  // Transcript processing needs:
  // - Open questions (to detect duplicates and match answers)
  // - Recent decisions (to detect contradictions)
  // - Epic/feature structure (to scope extracted items)
  // - Recent sessions (for continuity)
  // Does NOT need: org components, sprint data, test cases

  const [questions, decisions, epics, sessions] = await Promise.all([
    getOpenQuestions(projectId),
    getRecentDecisions(projectId, 20),
    getEpicStructure(projectId),  // Just names, prefixes, and feature names — not full context
    getRecentSessions(projectId, 5),
  ]);

  return { questions, decisions, epics, sessions };
};
```

```typescript
// task-definitions/story-generation.ts

const storyGenerationContextLoader = async (
  input: TaskInput,
  projectId: string
): Promise<ProjectContext> => {
  // Story generation needs:
  // - The parent epic/feature with full business context
  // - Related discovery notes and answered questions
  // - Org components relevant to the epic's domain
  // - Related decisions
  // Does NOT need: sprint data, other epics' details, test cases

  const epicId = input.metadata?.epicId as string;

  const [epicContext, relatedQuestions, relatedDecisions, orgComponents] =
    await Promise.all([
      getEpicContext(epicId),
      getAnsweredQuestions(projectId, { scopeEpicId: epicId }),
      getDecisionsForEpic(epicId),
      getOrgComponentsForEpic(epicId),  // Components referenced by this epic's stories
    ]);

  return { epics: [epicContext], questions: relatedQuestions, decisions: relatedDecisions, orgComponents };
};
```

```typescript
// task-definitions/context-package-assembly.ts
// Called by Claude Code via REST API

const contextPackageContextLoader = async (
  input: TaskInput,
  projectId: string
): Promise<ProjectContext> => {
  // Context package for a developer picking up a ticket:
  // - Full story details with acceptance criteria
  // - Parent epic/feature business context
  // - ONLY org components relevant to this story (from StoryComponent join)
  // - Related decisions and answered discovery questions
  // - Other in-flight stories with overlapping components (sprint conflict info)

  const storyId = input.entityId!;

  const [story, storyComponents, relatedStories, relatedDecisions, relatedQuestions] =
    await Promise.all([
      getStoryWithContext(storyId),          // Includes epic and feature context
      getStoryOrgComponents(storyId),        // Traverses StoryComponent join
      getOverlappingStories(storyId),        // Stories sharing impacted components
      getDecisionsForStory(storyId),         // Decisions linked to this story's epic/feature
      getAnsweredQuestionsForStory(storyId), // Questions scoped to this story's epic/feature
    ]);

  return {
    stories: [story],
    orgComponents: storyComponents,
    relatedStories,
    decisions: relatedDecisions,
    questions: relatedQuestions,
  };
};
```

### 3.4 Tool Definitions by Task Type

Each task type declares what tools the AI can call. Tools are thin wrappers around Prisma operations with input validation.

#### Transcript Processing Tools

```typescript
const transcriptProcessingTools: ClaudeToolDefinition[] = [
  {
    name: "create_question",
    description: "Create a new question identified from the transcript",
    input_schema: {
      type: "object",
      properties: {
        questionText: { type: "string", description: "Clear question text" },
        scope: { type: "string", enum: ["ENGAGEMENT", "EPIC", "FEATURE"] },
        scopeEpicPrefix: { type: "string", description: "Epic prefix if epic/feature scoped" },
        ownerDescription: { type: "string", description: "Who should answer this" },
        blocksStoryIds: { type: "array", items: { type: "string" }, description: "Story IDs this blocks" },
      },
      required: ["questionText", "scope"],
    },
  },
  {
    name: "answer_question",
    description: "Record an answer to an existing open question identified in the transcript",
    input_schema: {
      type: "object",
      properties: {
        questionDisplayId: { type: "string", description: "e.g., Q-FM-003" },
        answerText: { type: "string" },
      },
      required: ["questionDisplayId", "answerText"],
    },
  },
  {
    name: "create_decision",
    description: "Record a decision made during the meeting",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        rationale: { type: "string" },
        relatedQuestionIds: { type: "array", items: { type: "string" } },
        affectsEpicPrefixes: { type: "array", items: { type: "string" } },
      },
      required: ["title", "rationale"],
    },
  },
  {
    name: "create_requirement",
    description: "Capture a business requirement stated or implied in the transcript",
    input_schema: {
      type: "object",
      properties: {
        description: { type: "string" },
        source: { type: "string", description: "Who stated this requirement" },
        priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
      },
      required: ["description"],
    },
  },
  {
    name: "create_risk",
    description: "Flag a risk identified from the transcript",
    input_schema: {
      type: "object",
      properties: {
        description: { type: "string" },
        likelihood: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
        impact: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
        affectsEpicPrefixes: { type: "array", items: { type: "string" } },
      },
      required: ["description"],
    },
  },
  {
    name: "flag_conflict",
    description: "Flag when new information contradicts an existing decision or assumption",
    input_schema: {
      type: "object",
      properties: {
        description: { type: "string" },
        conflictsWith: { type: "string", description: "Decision ID or question ID that's contradicted" },
      },
      required: ["description"],
    },
  },
];
```

#### Briefing Generation — No Tools (Read-Only)

```typescript
const briefingGenerationTools: ClaudeToolDefinition[] = [];
// Briefing generation is SINGLE_TURN with no tools.
// All context is loaded upfront, and Claude generates a structured response.
```

#### Story Generation Tools

```typescript
const storyGenerationTools: ClaudeToolDefinition[] = [
  {
    name: "create_story_draft",
    description: "Create a new user story in Draft status",
    input_schema: {
      type: "object",
      properties: {
        epicId: { type: "string" },
        featureId: { type: "string" },
        title: { type: "string" },
        persona: { type: "string" },
        description: { type: "string" },
        acceptanceCriteria: { type: "string" },
        impactedComponents: {
          type: "array",
          items: {
            type: "object",
            properties: {
              apiName: { type: "string" },
              componentType: { type: "string" },
              impactType: { type: "string", enum: ["CREATE", "MODIFY", "DELETE"] },
            },
          },
        },
        notes: { type: "string" },
      },
      required: ["epicId", "title"],
    },
  },
  {
    name: "create_test_case_stub",
    description: "Create a test case for a story based on acceptance criteria",
    input_schema: {
      type: "object",
      properties: {
        storyId: { type: "string" },
        title: { type: "string" },
        expectedResult: { type: "string" },
        testType: { type: "string", enum: ["HAPPY_PATH", "EDGE_CASE", "NEGATIVE", "BULK"] },
      },
      required: ["storyId", "title", "expectedResult", "testType"],
    },
  },
];
```

### 3.5 Execution Engine Implementation

```typescript
// lib/agent-harness/engine.ts

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface ExecutionResult {
  response: string;
  sessionLogId: string;
  entitiesCreated: { entityType: string; entityId: string }[];
  entitiesModified: { entityType: string; entityId: string }[];
  tokenUsage: { input: number; output: number };
}

export async function executeTask(
  taskDef: TaskDefinition,
  input: TaskInput,
  projectId: string,
  userId: string
): Promise<ExecutionResult> {
  // 1. Load context
  const context = await taskDef.contextLoader(input, projectId);

  // 2. Assemble system prompt
  const systemPrompt = assembleSystemPrompt(taskDef.systemPromptTemplate, context);

  // 3. Track entities and tokens
  const tracking = {
    entitiesCreated: [] as { entityType: string; entityId: string }[],
    entitiesModified: [] as { entityType: string; entityId: string }[],
    totalInputTokens: 0,
    totalOutputTokens: 0,
    iterations: 0,
  };

  // 4. Create session log (status: RUNNING)
  const sessionLog = await createSessionLog(projectId, userId, taskDef.taskType);

  // 5. Execute
  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: input.userMessage },
  ];

  let finalResponse = "";

  try {
    for (let i = 0; i < taskDef.maxIterations; i++) {
      tracking.iterations++;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools: taskDef.tools,
        messages,
      });

      tracking.totalInputTokens += response.usage.input_tokens;
      tracking.totalOutputTokens += response.usage.output_tokens;

      // Check if response contains tool calls
      const toolUseBlocks = response.content.filter(
        (block) => block.type === "tool_use"
      );
      const textBlocks = response.content.filter(
        (block) => block.type === "text"
      );

      if (toolUseBlocks.length === 0) {
        // No tool calls — we have the final response
        finalResponse = textBlocks.map((b) => b.text).join("\n");
        break;
      }

      // Execute tool calls
      const toolResults: Anthropic.MessageParam = {
        role: "user",
        content: await Promise.all(
          toolUseBlocks.map(async (toolUse) => {
            const result = await executeToolCall(
              toolUse.name,
              toolUse.input,
              projectId,
              tracking
            );
            return {
              type: "tool_result" as const,
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            };
          })
        ),
      };

      // Add assistant response and tool results to message history
      messages.push({ role: "assistant", content: response.content });
      messages.push(toolResults);

      // If stop_reason is "end_turn" after tool use, Claude is done
      if (response.stop_reason === "end_turn") {
        finalResponse = textBlocks.map((b) => b.text).join("\n");
        break;
      }
    }

    // 6. Validate output
    let validationAttempts = 0;
    while (validationAttempts < taskDef.maxRetries) {
      const validation = taskDef.outputValidator({ text: finalResponse });
      if (validation.valid) break;

      // Re-prompt with corrections
      messages.push({ role: "user", content: formatCorrections(validation.corrections!) });
      const retryResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      });
      tracking.totalInputTokens += retryResponse.usage.input_tokens;
      tracking.totalOutputTokens += retryResponse.usage.output_tokens;
      finalResponse = retryResponse.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      validationAttempts++;
    }

    // 7. Update session log (COMPLETE)
    await updateSessionLog(sessionLog.id, {
      status: "COMPLETE",
      inputTokens: tracking.totalInputTokens,
      outputTokens: tracking.totalOutputTokens,
      totalIterations: tracking.iterations,
      entitiesCreated: tracking.entitiesCreated,
      entitiesModified: tracking.entitiesModified,
      summary: finalResponse.substring(0, 500),
    });

    return {
      response: finalResponse,
      sessionLogId: sessionLog.id,
      entitiesCreated: tracking.entitiesCreated,
      entitiesModified: tracking.entitiesModified,
      tokenUsage: {
        input: tracking.totalInputTokens,
        output: tracking.totalOutputTokens,
      },
    };
  } catch (error) {
    await updateSessionLog(sessionLog.id, {
      status: tracking.entitiesCreated.length > 0 ? "PARTIAL" : "FAILED",
      inputTokens: tracking.totalInputTokens,
      outputTokens: tracking.totalOutputTokens,
      totalIterations: tracking.iterations,
      entitiesCreated: tracking.entitiesCreated,
      entitiesModified: tracking.entitiesModified,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
```

### 3.6 Tool Execution Dispatch

```typescript
// lib/agent-harness/tool-executor.ts

export async function executeToolCall(
  toolName: string,
  input: Record<string, unknown>,
  projectId: string,
  tracking: EntityTracking
): Promise<Record<string, unknown>> {
  switch (toolName) {
    case "create_question":
      return await createQuestionTool(input, projectId, tracking);
    case "answer_question":
      return await answerQuestionTool(input, projectId, tracking);
    case "create_decision":
      return await createDecisionTool(input, projectId, tracking);
    case "create_requirement":
      return await createRequirementTool(input, projectId, tracking);
    case "create_risk":
      return await createRiskTool(input, projectId, tracking);
    case "flag_conflict":
      return await flagConflictTool(input, projectId, tracking);
    case "create_story_draft":
      return await createStoryDraftTool(input, projectId, tracking);
    case "create_test_case_stub":
      return await createTestCaseStubTool(input, projectId, tracking);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function createQuestionTool(
  input: Record<string, unknown>,
  projectId: string,
  tracking: EntityTracking
): Promise<Record<string, unknown>> {
  // 1. Validate input
  const questionText = input.questionText as string;
  if (!questionText?.trim()) {
    return { error: "questionText is required" };
  }

  // 2. Check for duplicates (fuzzy match against existing questions)
  const existingQuestions = await prisma.question.findMany({
    where: { projectId, status: "OPEN" },
    select: { id: true, displayId: true, questionText: true },
  });
  // Simple similarity check — could be enhanced with embeddings later
  const duplicate = existingQuestions.find(
    (q) => textSimilarity(q.questionText, questionText) > 0.85
  );
  if (duplicate) {
    return {
      warning: `Possible duplicate of ${duplicate.displayId}: "${duplicate.questionText}"`,
      duplicateId: duplicate.displayId,
      created: false,
    };
  }

  // 3. Generate display ID
  const displayId = await generateQuestionDisplayId(projectId, input.scope as string, input.scopeEpicPrefix as string);

  // 4. Resolve scope references
  const scopeEpicId = input.scopeEpicPrefix
    ? await resolveEpicByPrefix(projectId, input.scopeEpicPrefix as string)
    : null;

  // 5. Create question
  const question = await prisma.question.create({
    data: {
      projectId,
      displayId,
      questionText,
      scope: (input.scope as string) || "ENGAGEMENT",
      scopeEpicId,
      ownerDescription: input.ownerDescription as string,
      status: "OPEN",
      askedDate: new Date(),
    },
  });

  // 6. Create blocking relationships if specified
  if (input.blocksStoryIds && Array.isArray(input.blocksStoryIds)) {
    for (const storyId of input.blocksStoryIds) {
      await prisma.questionBlocksStory.create({
        data: { questionId: question.id, storyId },
      });
    }
  }

  // 7. Track
  tracking.entitiesCreated.push({ entityType: "Question", entityId: question.id });

  return {
    created: true,
    questionId: question.id,
    displayId: question.displayId,
  };
}
```

---

## 4. Context Window Budget Strategy

### 4.1 The Problem

As a project grows over months, the total knowledge base can become very large. A brownfield project might have 200 objects with 3,000+ fields, 150 questions, 40 decisions, 80 stories, and 20 session logs. Loading everything into every AI request would exceed context limits and waste tokens.

### 4.2 Budget Allocation by Task Type

Each task type has a target context budget. These are approximate guidelines, not hard limits:

| Task Type | Target Context Budget | What Gets Loaded |
|---|---|---|
| Transcript Processing | 15-20K tokens | Open questions, recent decisions (last 20), epic/feature structure (names only), recent sessions (last 5) |
| Question Answering | 8-12K tokens | The specific question + its blocking relationships, related epic context, recent decisions affecting that scope |
| Story Generation | 10-15K tokens | Parent epic full context, related answered questions, org components for that epic's domain |
| Story Enrichment | 8-12K tokens | The story + its epic context + impacted org components |
| Briefing Generation | 20-30K tokens | Full project summary, all open questions, all milestones, active risks, recent session summaries, epic phase statuses |
| Document Generation | 15-25K tokens | Varies by document type; the context loader for each document template defines what's needed |
| Sprint Analysis | 15-20K tokens | All stories in the candidate sprint, their impacted components, blocking questions, dependency chains |
| Context Package Assembly | 10-15K tokens | Story details, parent epic, scoped org components, related decisions and questions, overlapping stories |
| Org Query | 5-10K tokens | Filtered org components matching the query, plus domain context |
| Dashboard Synthesis | 20-30K tokens | Same as briefing generation |

### 4.3 Context Sizing Strategies

**Strategy 1: Scoped Loading (Primary).** The context loader for each task type only fetches data relevant to that task. Transcript processing doesn't load org components. Story generation doesn't load sprint data. This is the first and most important strategy — don't load what you don't need.

**Strategy 2: Summarization for Older Context.** For long-running projects, older session logs and answered questions are summarized rather than included verbatim. The context loader keeps the last N sessions in full detail and includes condensed summaries of older ones. For example: recent 5 sessions in full, previous 20 sessions as a one-paragraph summary each.

**Strategy 3: Relevance-Based Org Component Filtering.** For org knowledge, the context loader uses the story's impacted components as the starting point and traverses 1-2 relationship hops. If a story touches `Account`, the package includes Account's fields, triggers, and flows — but not unrelated objects. For brownfield projects with 200+ objects, this keeps the org context manageable (typically 2-5K tokens for a focused package vs. 50K+ for the full org).

**Strategy 4: Tiered Detail Levels.** Some context is loaded at different detail levels depending on the task:
- **Full detail:** The primary entity being worked on (the story being enriched, the question being answered).
- **Summary detail:** Related entities (sibling stories in the same epic, other questions in the same scope).
- **Reference detail:** Distant context (other epics, project-level decisions) — just names and IDs, loadable on demand.

### 4.4 Monitoring and Adjustment

The session log tracks input/output tokens per request. After the first few weeks of real usage, review the token distribution:
- If any task type consistently exceeds its budget, investigate whether the context loader is over-fetching.
- If AI responses lack context (asking for information that should have been provided), the budget may be too tight for that task type.
- The summarization threshold (how many sessions to keep in full detail) should be tuned based on actual project sizes.

### 4.5 Brownfield Org Component Sizing

Estimated token sizes for org components (based on typical Salesforce orgs):

| Org Size | Objects | Fields | Total Org Tokens (full) | Typical Story Package (scoped) |
|---|---|---|---|---|
| Small | 20-50 | 200-500 | 10-20K | 1-3K |
| Medium | 50-150 | 500-2,000 | 20-60K | 2-5K |
| Large | 150-300 | 2,000-5,000 | 60-150K | 3-8K |

The scoped package (what actually gets loaded for a single story) is always manageable. The full org knowledge base never needs to be loaded in a single request — that's the whole point of scoped loading.

---

## 5. Dashboard Architecture

### 5.1 Data Flow

```
┌─────────────────────────────────────────────────┐
│                Dashboard UI (Next.js)             │
│                                                   │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Instant Data │  │  AI-Synthesized Content  │  │
│  │  (Postgres    │  │  (Cached, refresh on     │  │
│  │   queries)    │  │   trigger or manual)     │  │
│  │               │  │                          │  │
│  │ - Question    │  │ - Current Focus          │  │
│  │   counts      │  │   narrative              │  │
│  │ - Blocking    │  │ - Recommended Focus      │  │
│  │   questions   │  │   prioritization         │  │
│  │ - Milestone   │  │ - Briefing summary       │  │
│  │   progress    │  │                          │  │
│  │ - Epic phase  │  │ Stored on Project:       │  │
│  │   grid        │  │ - cachedBriefingContent  │  │
│  │ - Story       │  │ - cachedBriefingGenAt    │  │
│  │   statuses    │  │                          │  │
│  │ - Health      │  │ Refresh triggers:        │  │
│  │   score       │  │ - Question answered      │  │
│  │ - Sprint      │  │ - Story status changed   │  │
│  │   burndown    │  │ - Milestone reached      │  │
│  │               │  │ - Manual "Refresh" click │  │
│  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 5.2 Instant Data Queries

These are standard Prisma queries that power the dashboard's real-time metrics:

```typescript
// lib/dashboard/queries.ts

// Briefing header metrics
async function getBriefingMetrics(projectId: string) {
  const [openQuestions, blockingCount, milestones, unmappedRequirements] =
    await Promise.all([
      prisma.question.count({ where: { projectId, status: "OPEN" } }),
      prisma.question.count({
        where: {
          projectId,
          status: "OPEN",
          OR: [
            { questionBlocksStory: { some: {} } },
            { questionBlocksEpic: { some: {} } },
            { questionBlocksFeature: { some: {} } },
          ],
        },
      }),
      prisma.milestone.findMany({
        where: { projectId },
        include: {
          milestoneStories: {
            include: { story: { select: { status: true } } },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.requirement.count({
        where: { projectId, status: "CAPTURED" },
      }),
    ]);

  // Compute milestone progress
  const milestonesWithProgress = milestones.map((m) => {
    const total = m.milestoneStories.length;
    const done = m.milestoneStories.filter(
      (ms) => ms.story.status === "DONE"
    ).length;
    return {
      ...m,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  return {
    openQuestions,
    blockingCount,
    milestones: milestonesWithProgress,
    unmappedRequirements,
  };
}

// Epic Phase Grid
async function getEpicPhaseGrid(projectId: string) {
  return prisma.epic.findMany({
    where: { projectId },
    include: {
      epicPhases: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

// Blocking questions with full detail
async function getBlockingQuestions(projectId: string) {
  return prisma.question.findMany({
    where: {
      projectId,
      status: "OPEN",
      OR: [
        { questionBlocksStory: { some: {} } },
        { questionBlocksEpic: { some: {} } },
        { questionBlocksFeature: { some: {} } },
      ],
    },
    include: {
      questionBlocksStory: {
        include: { story: { select: { displayId: true, title: true } } },
      },
      questionBlocksEpic: {
        include: { epic: { select: { name: true } } },
      },
      questionBlocksFeature: {
        include: { feature: { select: { name: true } } },
      },
    },
    orderBy: { askedDate: "asc" },
  });
}

// Health score computation
async function computeHealthScore(projectId: string) {
  const thresholds = await getProjectThresholds(projectId);
  const now = new Date();

  const staleQuestions = await prisma.question.count({
    where: {
      projectId,
      status: "OPEN",
      askedDate: { lt: subDays(now, thresholds.questionAgeThresholdDays) },
    },
  });

  const staleClientQuestions = await prisma.question.count({
    where: {
      projectId,
      status: "OPEN",
      ownerDescription: { startsWith: "Client" },
      askedDate: { lt: subDays(now, thresholds.clientFollowUpThresholdDays) },
    },
  });

  const staleBlockedItems = await prisma.story.count({
    where: {
      projectId,
      status: { in: ["DRAFT", "READY"] },
      questionBlocksStory: {
        some: {
          question: {
            status: "OPEN",
            askedDate: { lt: subDays(now, thresholds.blockedThresholdDays) },
          },
        },
      },
    },
  });

  const unmitigatedHighRisks = await prisma.risk.count({
    where: {
      projectId,
      status: "OPEN",
      severity: { in: ["HIGH", "CRITICAL"] },
      mitigationStrategy: null,
    },
  });

  const signals = staleQuestions + staleClientQuestions + staleBlockedItems + unmitigatedHighRisks;

  return {
    score: signals === 0 ? "GREEN" : signals <= 3 ? "YELLOW" : "RED",
    signals,
    breakdown: { staleQuestions, staleClientQuestions, staleBlockedItems, unmitigatedHighRisks },
  };
}
```

### 5.3 Briefing Cache Refresh Triggers

The cached AI briefing is refreshed when:

1. A question is answered (calls `refreshBriefingCache` after the question answering harness task completes).
2. A story status changes to DONE (may affect milestone progress and current focus).
3. A user manually clicks "Refresh Briefing" on the dashboard.
4. More than 30 minutes have elapsed since the last refresh AND the dashboard is being viewed.

The refresh itself is a `DASHBOARD_SYNTHESIS` harness task that generates the Current Focus narrative and Recommended Focus list, then stores the result in the Project's `cachedBriefingContent` and `cachedBriefingGeneratedAt` fields.

---

## 6. Remaining Items for Future Sessions

### Tier 2 — Resolve During Phase 2-3 Build

1. **Sprint Intelligence Algorithms.** How exactly does conflict detection work? The StoryComponent join table provides the data, but the scoring algorithm (how to rank severity of overlapping components) needs design. Recommended: address during Phase 2 when sprint management is built.

2. **Org Metadata Parsing Pipeline.** Translating raw SF CLI JSON output into normalized OrgComponent/OrgRelationship rows. The existing `sf-org-knowledge` skill's four-phase approach informs this. Recommended: address during Phase 3 when org connectivity is built.

### Tier 3 — Resolve During Phase 4

3. **Document Generation Pipeline.** Library choices for generating branded Word/PowerPoint/PDF from templates. Candidates: `docx-templater` or `python-docx` (via subprocess) for Word, `pptxgenjs` for PowerPoint, `pdf-lib` for PDF. Recommended: address during Phase 4.

### Design Decisions Still Open

4. **Question duplicate detection algorithm.** Currently described as "fuzzy match" — the implementation could range from simple Levenshtein distance to embedding-based similarity. Start simple (substring + Levenshtein), upgrade to embeddings if false positives/negatives are problematic.

5. **Firm-level rules configuration format.** Typographic rules, naming conventions, and terminology are "hardcoded in V1." The specific format (TypeScript constants? JSON config file? Database seeds?) should be decided during Phase 1 setup.

6. **Webhook/event-driven briefing refresh vs. polling.** The current design uses function calls after harness tasks complete. An alternative is a Postgres trigger or event system. Start with the simpler approach (explicit calls after task completion).
