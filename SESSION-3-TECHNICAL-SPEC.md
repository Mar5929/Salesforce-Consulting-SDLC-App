# Session 3 Technical Specification
# Salesforce Consulting AI Framework

**Date:** April 3, 2026 (updated Sessions 4-7)
**Companion to:** SF-Consulting-AI-Framework-PRD-v2.3.md
**Purpose:** Detailed technical specifications for database schema, AI agent harness architecture, context window budget strategy, dashboard implementation, knowledge architecture, background jobs, search infrastructure, and notification system. Produced during Sessions 3-7.

---

## Table of Contents

1. [Decisions Locked in Session 3](#1-decisions-locked-in-session-3)
2. [Database Schema — Full Entity and Relationship Design](#2-database-schema)
3. [AI Agent Harness — Implementation Architecture](#3-ai-agent-harness)
4. [Context Window Budget Strategy](#4-context-window-budget-strategy)
5. [Dashboard Architecture](#5-dashboard-architecture)
6. [Brownfield Org Ingestion Pipeline](#6-brownfield-org-ingestion-pipeline)
7. [Background Job Infrastructure (Inngest)](#7-background-job-infrastructure)
8. [Search Infrastructure](#8-search-infrastructure)
9. [Remaining Items for Future Sessions](#9-remaining-items)

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
  │           ├── StoryComponent → OrgComponent (nullable, supports free-text)
  │           ├── TestCase
  │           │     └── TestExecution
  │           └── Defect
  ├── Question (+ confidence, needsReview, reviewReason)
  │     ├── QuestionBlocksStory → Story
  │     ├── QuestionBlocksEpic → Epic
  │     ├── QuestionBlocksFeature → Feature
  │     └── QuestionAffects → Epic/Feature (cross-cutting)
  ├── Decision (+ confidence, needsReview, reviewReason)
  │     ├── DecisionQuestion → Question
  │     └── DecisionScope → Epic/Feature
  ├── Requirement (+ confidence, needsReview, reviewReason)
  │     ├── RequirementEpic → Epic
  │     └── RequirementStory → Story
  ├── Risk (+ confidence, needsReview, reviewReason)
  │     └── RiskEpic → Epic
  ├── Milestone
  │     └── MilestoneStory → Story
  ├── Sprint
  ├── OrgComponent (+ embedding vector)
  │     ├── OrgRelationship
  │     ├── DomainGrouping
  │     └── BusinessContextAnnotation
  ├── BusinessProcess (NEW - Session 4)
  │     ├── BusinessProcessComponent → OrgComponent (role, isRequired)
  │     └── BusinessProcessDependency → BusinessProcess (dependencyType)
  ├── KnowledgeArticle (NEW - Session 4)
  │     └── KnowledgeArticleReference → (polymorphic: BP, OrgComponent, Epic, Story, Question, Decision)
  ├── Conversation (NEW - Session 5)
  │     └── ChatMessage (role, content, senderId, toolCalls)
  ├── Notification (NEW - Session 5)
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
| prefix | String | Required | 2-4 letter code for ID generation (e.g., "FM", "DM") |
| description | Text | Nullable | |
| status | Enum | NOT_STARTED, IN_PROGRESS, COMPLETE | Overall epic status |
| sortOrder | Int | Required | Display ordering |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

Unique constraint: (projectId, prefix) — prevents duplicate epic prefixes within a project, which would cause question ID collisions in the Q-{SCOPE}-{NUMBER} scheme.

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
| assigneeId | UUID | Nullable FK → ProjectMember | Developer assigned to build |
| testAssigneeId | UUID | Nullable FK → ProjectMember | QA member assigned to test. Used for QA handoff notifications when story moves to QA status. If null, notification goes to all project members with QA role. |
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
| confidence | Enum | HIGH, MEDIUM, LOW. Default: HIGH | AI's certainty about the extraction |
| needsReview | Boolean | Default: false | Set true when AI is uncertain |
| reviewReason | String | Nullable | Why the AI flagged it |
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
| confidence | Enum | HIGH, MEDIUM, LOW. Default: HIGH | AI's certainty about the extraction |
| needsReview | Boolean | Default: false | Set true when AI is uncertain |
| reviewReason | String | Nullable | Why the AI flagged it |
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
| confidence | Enum | HIGH, MEDIUM, LOW. Default: HIGH | AI's certainty about the extraction |
| needsReview | Boolean | Default: false | Set true when AI is uncertain |
| reviewReason | String | Nullable | Why the AI flagged it |
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
| confidence | Enum | HIGH, MEDIUM, LOW. Default: HIGH | AI's certainty about the extraction |
| needsReview | Boolean | Default: false | Set true when AI is uncertain |
| reviewReason | String | Nullable | Why the AI flagged it |
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
| assigneeId | UUID | Nullable FK → ProjectMember | Developer assigned to fix the defect |
| createdById | UUID | FK → ProjectMember | QA member who reported the defect |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

**Defect lifecycle role rules (enforced by application):**
- **QA** creates defects and sets assigneeId (the developer responsible for the fix).
- **Developer** transitions status to FIXED when the fix is complete.
- **QA** transitions to VERIFIED (fix confirmed) or reopens to OPEN (fix rejected).
- **SA/PM** can transition to CLOSED (accepted, won't-fix, or duplicate).

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
| embedding | Vector(1536) | Nullable | pgvector embedding for semantic search |

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
| model | String | Nullable, default: "claude-sonnet-4-20250514" | AI model used; drives cost calculation |
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

#### BusinessProcess (NEW - Session 4)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| name | String | Required | e.g., "Account Onboarding", "Renewal Pipeline" |
| description | Text | Nullable | What this business process does |
| domainGroupingId | UUID | Nullable FK → DomainGrouping | Business domain this process belongs to |
| status | Enum | DISCOVERED, DOCUMENTED, CONFIRMED, DEPRECATED | Lifecycle status |
| complexity | Enum | Nullable. LOW, MEDIUM, HIGH, CRITICAL | Used for sprint intelligence impact analysis |
| isAiSuggested | Boolean | Default: true | True if AI proposed during ingestion |
| isConfirmed | Boolean | Default: false | Architect confirms AI suggestions |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

Unique constraint: (projectId, name)

---

#### BusinessProcessComponent (NEW - Session 4)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| businessProcessId | UUID | FK → BusinessProcess | |
| orgComponentId | UUID | FK → OrgComponent | |
| role | String | Required | Component's function in the process (e.g., "Triggers onboarding workflow", "Stores renewal status") |
| isRequired | Boolean | Default: true | Whether this component is essential to the process |

Unique constraint: (businessProcessId, orgComponentId)

---

#### BusinessProcessDependency (NEW - Session 4)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| sourceProcessId | UUID | FK → BusinessProcess | |
| targetProcessId | UUID | FK → BusinessProcess | |
| dependencyType | Enum | TRIGGERS, FEEDS_DATA, REQUIRES_COMPLETION, SHARED_COMPONENTS | How the source depends on the target |
| description | Text | Nullable | Human-readable description of the dependency |

Unique constraint: (sourceProcessId, targetProcessId)

---

#### KnowledgeArticle (NEW - Session 4)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| articleType | Enum | BUSINESS_PROCESS, INTEGRATION, ARCHITECTURE_DECISION, DOMAIN_OVERVIEW, CROSS_CUTTING_CONCERN, STAKEHOLDER_CONTEXT | What the article covers |
| title | String | Required | |
| content | Text | Required | Markdown. The AI's synthesized understanding. |
| summary | String | Required | One-liner for two-pass context assembly (~50 tokens) |
| confidence | Enum | LOW, MEDIUM, HIGH | AI's confidence in the synthesis |
| version | Int | Default: 1 | Incremented on each refresh |
| isStale | Boolean | Default: false | Flagged by agent loop when referenced entities change |
| staleReason | String | Nullable | Why the article was flagged (e.g., "Component Account_Trigger modified") |
| staleSince | DateTime | Nullable | When the stale flag was set |
| lastRefreshedAt | DateTime | Nullable | Last time the article content was regenerated |
| authorType | Enum | AI_GENERATED, HUMAN_AUTHORED, AI_GENERATED_HUMAN_EDITED | |
| embedding | Vector(1536) | Nullable | pgvector embedding of content for semantic retrieval |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

Unique constraint: (projectId, articleType, title)

---

#### KnowledgeArticleReference (NEW - Session 4)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| articleId | UUID | FK → KnowledgeArticle | |
| entityType | Enum | BUSINESS_PROCESS, ORG_COMPONENT, EPIC, STORY, QUESTION, DECISION | Polymorphic: what type of entity is referenced |
| entityId | UUID | Required | ID of the referenced entity (no true FK due to polymorphic design) |

Unique constraint: (articleId, entityType, entityId)

Note: Polymorphic join table. No database-level foreign key on entityId because it references different tables depending on entityType. Application-level validation ensures referential integrity. This is cleaner than N nullable FK columns and is the standard pattern for this type of cross-entity reference.

---

#### Conversation (NEW - Session 5)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| conversationType | Enum | GENERAL_CHAT, TRANSCRIPT_SESSION, STORY_SESSION, BRIEFING_SESSION, QUESTION_SESSION, ENRICHMENT_SESSION | |
| title | String | Nullable | Auto-generated for task sessions; null for general chat |
| status | Enum | ACTIVE, COMPLETE, FAILED | |
| createdById | UUID | FK → ProjectMember | |
| sessionLogId | UUID | Nullable FK → SessionLog | Links task sessions to cost tracking |
| createdAt | DateTime | Auto-set | |
| updatedAt | DateTime | Auto-updated | |

Notes: One GENERAL_CHAT conversation per project, auto-created. Task sessions are created on demand per harness invocation.

---

#### ChatMessage (NEW - Session 5)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| conversationId | UUID | FK → Conversation | |
| role | Enum | USER, ASSISTANT, SYSTEM | |
| content | Text | Required | Message content |
| senderId | UUID | Nullable FK → ProjectMember | Null for AI (ASSISTANT) and SYSTEM messages |
| toolCalls | JSON | Nullable | AI tool call metadata for transparency |
| createdAt | DateTime | Auto-set | |

Messages are append-only. No edits, no deletes.

---

#### Notification (NEW - Session 5)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| projectId | UUID | FK → Project | |
| recipientId | UUID | FK → ProjectMember | |
| type | Enum | QUESTION_ANSWERED, WORK_ITEM_UNBLOCKED, SPRINT_CONFLICT_DETECTED, AI_PROCESSING_COMPLETE, QUESTION_AGING, HEALTH_SCORE_CHANGED, QUESTION_ASSIGNED, STORY_STATUS_CHANGED, ARTICLE_FLAGGED_STALE, METADATA_SYNC_COMPLETE | |
| title | String | Required | Short notification title |
| body | Text | Nullable | Additional detail |
| entityType | Enum | QUESTION, STORY, SPRINT, PROJECT, ARTICLE, BUSINESS_PROCESS | What entity triggered the notification |
| entityId | UUID | Required | For one-click navigation to the source entity |
| isRead | Boolean | Default: false | |
| createdAt | DateTime | Auto-set | |

Index on (recipientId, isRead, createdAt) for the notification bell query.

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
| id | UUID | PK |
| storyId | UUID FK → Story | |
| orgComponentId | UUID Nullable FK → OrgComponent | Linked org component. Null when the component is free-text (planned/new). |
| componentName | String Nullable | Free-text component name. Required when orgComponentId is null. Used for planned or new components that don't yet exist in the org metadata. |
| impactType | Enum: CREATE, MODIFY, DELETE | What the story does to this component |

**Free-text mode:** Stories often reference components that are planned but don't exist in the org yet (e.g., a new Flow or custom object). When `orgComponentId` is null, `componentName` holds the free-text description. When the component is later synced from the org, `orgComponentId` can be backfilled and `componentName` cleared.

**Validation rule (enforced by application):** Exactly one of `orgComponentId` or `componentName` must be non-null.

This table is the foundation of sprint intelligence. Conflict detection queries join on `orgComponentId` to find overlapping stories. Free-text entries (null `orgComponentId`) are excluded from conflict detection until linked.

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
│  Knowledge layer functions (Session 4-5):         │
│  - getRelevantArticles(projectId, scope)          │
│  - getArticleSummaries(projectId, scope)          │
│  - getBusinessProcesses(projectId, scope)         │
│  - getBusinessProcessForStory(storyId)            │
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
  // - Article summaries for mentioned domains (to flag stale articles)
  // Does NOT need: org components, sprint data, test cases

  const [questions, decisions, epics, sessions, articleSummaries] = await Promise.all([
    getOpenQuestions(projectId),
    getRecentDecisions(projectId, 20),
    getEpicStructure(projectId),  // Just names, prefixes, and feature names — not full context
    getRecentSessions(projectId, 5),
    getArticleSummaries(projectId),  // +1-2K tokens; AI flags stale articles inline
  ]);

  return { questions, decisions, epics, sessions, articleSummaries };
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

  const [epicContext, relatedQuestions, relatedDecisions, orgComponents,
         businessProcesses, relevantArticles] =
    await Promise.all([
      getEpicContext(epicId),
      getAnsweredQuestions(projectId, { scopeEpicId: epicId }),
      getDecisionsForEpic(epicId),
      getOrgComponentsForEpic(epicId),  // Components referenced by this epic's stories
      getBusinessProcesses(projectId, { epicId }), // Processes in this epic's domain (+2-4K)
      getRelevantArticles(projectId, { epicId, limit: 3 }), // Top 3 articles for epic domain
    ]);

  return {
    epics: [epicContext], questions: relatedQuestions, decisions: relatedDecisions,
    orgComponents, businessProcesses, relevantArticles,
  };
};
```

```typescript
// task-definitions/context-package-assembly.ts
// Called by Claude Code via REST API

const contextPackageContextLoader = async (
  input: TaskInput,
  projectId: string
): Promise<ProjectContext> => {
  // Context package for a developer picking up a ticket.
  // Provides BUSINESS INTELLIGENCE that Claude Code cannot get from SF CLI:
  // - Full story details with acceptance criteria
  // - Parent epic/feature business context
  // - Business processes for story components (what business capability they serve)
  // - Top relevant knowledge articles (AI-synthesized understanding)
  // - Related decisions and answered discovery questions
  // - Other in-flight stories with overlapping components (sprint conflict info)
  // NOTE: Raw org metadata (source code, field definitions) comes from SF CLI directly.
  // The web app provides enriched context: business processes, articles, decisions, cross-team awareness.

  const storyId = input.entityId!;

  const [story, storyComponents, relatedStories, relatedDecisions, relatedQuestions,
         businessProcesses, relevantArticles] =
    await Promise.all([
      getStoryWithContext(storyId),          // Includes epic and feature context
      getStoryOrgComponents(storyId),        // Traverses StoryComponent join
      getOverlappingStories(storyId),        // Stories sharing impacted components
      getDecisionsForStory(storyId),         // Decisions linked to this story's epic/feature
      getAnsweredQuestionsForStory(storyId), // Questions scoped to this story's epic/feature
      getBusinessProcessForStory(storyId),   // Story's components -> their business processes (+3-5K)
      getRelevantArticles(projectId, { storyId, limit: 3 }), // Top 3 semantically relevant articles full content
    ]);

  return {
    stories: [story],
    orgComponents: storyComponents,
    relatedStories,
    decisions: relatedDecisions,
    questions: relatedQuestions,
    businessProcesses,
    relevantArticles,
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

| Task Type | Target Context Budget | What Gets Loaded | Knowledge Layer Addition |
|---|---|---|---|
| Transcript Processing | 16-22K tokens | Open questions, recent decisions (last 20), epic/feature structure (names only), recent sessions (last 5) | +1-2K: article summaries for mentioned domains; AI flags stale articles |
| Question Answering | 9-15K tokens | The specific question + its blocking relationships, related epic context, recent decisions affecting that scope | +1-3K: top 2 semantically matched articles (full content) |
| Story Generation | 12-19K tokens | Parent epic full context, related answered questions, org components for that epic's domain | +2-4K: business processes for epic domain + top 3 relevant articles (full) |
| Story Enrichment | 9-14K tokens | The story + its epic context + impacted org components | +1-2K: business processes for story components + article summaries |
| Briefing Generation | 22-34K tokens | Full project summary, all open questions, all milestones, active risks, recent session summaries, epic phase statuses | +2-4K: article summaries project-wide (no full content) |
| Document Generation | 15-25K tokens | Varies by document type; the context loader for each document template defines what's needed | Varies by document type |
| Sprint Analysis | 17-23K tokens | All stories in the candidate sprint, their impacted components, blocking questions, dependency chains | +2-3K: business processes for all sprint components |
| Context Package Assembly | 13-20K tokens | Story details, parent epic, scoped org components, related decisions and questions, overlapping stories | +3-5K: business processes for story components + top 3 articles (full); biggest impact, developers need business context |
| Org Query | 5-10K tokens | Filtered org components matching the query, plus domain context | No change |
| Dashboard Synthesis | 22-34K tokens | Same as briefing generation | +2-4K: article summaries project-wide |

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

### 5.3 Usage and Cost Queries (Session 6)

The Usage & Costs tab in project settings aggregates SessionLog data with a pricing config to show token consumption and estimated dollar cost.

#### Pricing Configuration

```typescript
// lib/config/ai-pricing.ts

interface ModelPricing {
  inputPer1KTokens: number;
  outputPer1KTokens: number;
}

const AI_PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-4-20250514": { inputPer1KTokens: 0.003, outputPer1KTokens: 0.015 },
  "claude-opus-4-20250514":   { inputPer1KTokens: 0.015, outputPer1KTokens: 0.075 },
};

function calculateSessionCost(
  inputTokens: number,
  outputTokens: number,
  model: string = "claude-sonnet-4-20250514"
): number {
  const pricing = AI_PRICING[model] ?? AI_PRICING["claude-sonnet-4-20250514"];
  return (inputTokens / 1000) * pricing.inputPer1KTokens
       + (outputTokens / 1000) * pricing.outputPer1KTokens;
}
```

Note: SessionLog needs an additional `model` field (String, nullable, default to current Sonnet model ID) so cost calculation uses the correct rate. Added to SessionLog schema.

#### Usage Aggregation Queries

```typescript
// lib/dashboard/usage-queries.ts

interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  sessionCount: number;
}

// Project totals for a date range
async function getProjectUsage(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<UsageSummary> {
  const result = await prisma.sessionLog.aggregate({
    where: {
      projectId,
      status: { in: ["COMPLETE", "PARTIAL"] },
      startedAt: { gte: startDate, lte: endDate },
    },
    _sum: { inputTokens: true, outputTokens: true },
    _count: { id: true },
  });

  const inputTokens = result._sum.inputTokens ?? 0;
  const outputTokens = result._sum.outputTokens ?? 0;

  return {
    totalInputTokens: inputTokens,
    totalOutputTokens: outputTokens,
    totalCost: calculateSessionCost(inputTokens, outputTokens),
    sessionCount: result._count.id,
  };
}

// Breakdown by task type
async function getUsageByTaskType(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ taskType: string } & UsageSummary>> {
  const results = await prisma.sessionLog.groupBy({
    by: ["taskType"],
    where: {
      projectId,
      status: { in: ["COMPLETE", "PARTIAL"] },
      startedAt: { gte: startDate, lte: endDate },
    },
    _sum: { inputTokens: true, outputTokens: true },
    _count: { id: true },
  });

  return results.map(r => ({
    taskType: r.taskType,
    totalInputTokens: r._sum.inputTokens ?? 0,
    totalOutputTokens: r._sum.outputTokens ?? 0,
    totalCost: calculateSessionCost(r._sum.inputTokens ?? 0, r._sum.outputTokens ?? 0),
    sessionCount: r._count.id,
  }));
}

// Breakdown by team member (SA and PM only)
async function getUsageByMember(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ userId: string; displayName: string } & UsageSummary>> {
  const results = await prisma.sessionLog.groupBy({
    by: ["userId"],
    where: {
      projectId,
      status: { in: ["COMPLETE", "PARTIAL"] },
      startedAt: { gte: startDate, lte: endDate },
    },
    _sum: { inputTokens: true, outputTokens: true },
    _count: { id: true },
  });

  // Resolve display names
  const memberIds = results.map(r => r.userId);
  const members = await prisma.projectMember.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, displayName: true },
  });
  const nameMap = new Map(members.map(m => [m.id, m.displayName]));

  return results.map(r => ({
    userId: r.userId,
    displayName: nameMap.get(r.userId) ?? "Unknown",
    totalInputTokens: r._sum.inputTokens ?? 0,
    totalOutputTokens: r._sum.outputTokens ?? 0,
    totalCost: calculateSessionCost(r._sum.inputTokens ?? 0, r._sum.outputTokens ?? 0),
    sessionCount: r._count.id,
  }));
}

// Daily trend for chart
async function getDailyUsageTrend(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; inputTokens: number; outputTokens: number; cost: number }>> {
  const results = await prisma.$queryRaw<Array<{
    date: string; input_tokens: number; output_tokens: number;
  }>>`
    SELECT DATE("startedAt") as date,
           SUM("inputTokens") as input_tokens,
           SUM("outputTokens") as output_tokens
    FROM "SessionLog"
    WHERE "projectId" = ${projectId}::uuid
      AND "status" IN ('COMPLETE', 'PARTIAL')
      AND "startedAt" >= ${startDate}
      AND "startedAt" <= ${endDate}
    GROUP BY DATE("startedAt")
    ORDER BY date ASC
  `;

  return results.map(r => ({
    date: r.date,
    inputTokens: Number(r.input_tokens),
    outputTokens: Number(r.output_tokens),
    cost: calculateSessionCost(Number(r.input_tokens), Number(r.output_tokens)),
  }));
}
```

### 5.4 Briefing Cache Refresh Triggers

The cached AI briefing is refreshed when:

1. A question is answered (calls `refreshBriefingCache` after the question answering harness task completes).
2. A story status changes to DONE (may affect milestone progress and current focus).
3. A user manually clicks "Refresh Briefing" on the dashboard.
4. More than 30 minutes have elapsed since the last refresh AND the dashboard is being viewed.

The refresh itself is a `DASHBOARD_SYNTHESIS` harness task that generates the Current Focus narrative and Recommended Focus list, then stores the result in the Project's `cachedBriefingContent` and `cachedBriefingGeneratedAt` fields.

---

## 6. Brownfield Org Ingestion Pipeline (Session 4-5)

The ingestion pipeline runs when a Salesforce org is connected (or manually triggered). It expands the original two-phase flow (parse + classify) to four phases.

### 6.1 Pipeline Phases

```
Phase 1: Parse      -> OrgComponent + OrgRelationship rows
Phase 2: Classify   -> DomainGrouping suggestions (existing)
Phase 3: Synthesize -> BusinessProcess + BusinessProcessComponent suggestions
Phase 4: Articulate -> KnowledgeArticle drafts
```

**Phase 1 (Parse):** SF CLI metadata retrieval, parsed into normalized OrgComponent and OrgRelationship rows. Each component gets an embedding generated via Inngest `entity.content-changed` event.

**Phase 2 (Classify):** AI analyzes component relationships and proposes DomainGrouping assignments. Existing logic, unchanged.

**Phase 3+4 (Synthesize + Articulate):** Run as a single AI call to avoid re-deriving context. The AI:
1. Identifies logical business processes from component clusters and relationships.
2. Creates BusinessProcess records with `isAiSuggested = true`, `isConfirmed = false`, `status = DISCOVERED`.
3. Creates BusinessProcessComponent join records with role descriptions.
4. Writes KnowledgeArticle drafts: one per business process (`articleType = BUSINESS_PROCESS`) and one per domain (`articleType = DOMAIN_OVERVIEW`).
5. Creates KnowledgeArticleReference records linking articles to their constituent components and processes.
6. Generates embeddings for all new articles via Inngest `entity.content-changed` events.

### 6.2 Inngest Implementation

The full ingestion runs as an Inngest step function triggered by `org.sync-requested` or `org.initial-connect`:

```typescript
const orgIngestionFunction = inngest.createFunction(
  { id: "org-ingestion", concurrency: { limit: 1, scope: "env", key: "event.data.projectId" } },
  { event: "org.sync-requested" },
  async ({ event, step }) => {
    const { projectId } = event.data;

    // Phase 1: Parse metadata
    const components = await step.run("parse-metadata", async () => {
      const rawMetadata = await fetchSalesforceMetadata(projectId);
      return await parseIntoComponents(projectId, rawMetadata);
    });

    // Phase 2: Classify domains
    await step.run("classify-domains", async () => {
      return await classifyDomains(projectId, components);
    });

    // Phase 3+4: Synthesize processes and articulate knowledge
    await step.run("synthesize-and-articulate", async () => {
      return await synthesizeBusinessProcesses(projectId, components);
    });

    // Emit events for embedding generation
    await step.sendEvent("emit-embedding-events", {
      name: "entity.content-changed",
      data: { projectId, entityType: "BATCH", entityIds: components.map(c => c.id) },
    });
  }
);
```

### 6.3 Confirmation Model

All AI-generated entities require architect review:
- BusinessProcess suggestions appear in a "Review Suggested Processes" UI.
- KnowledgeArticle drafts appear in a "Review Knowledge Base" UI.
- Architect can confirm, edit, or discard each suggestion.
- Only confirmed processes and articles are treated as trusted context in future AI interactions.

---

## 7. Background Job Infrastructure — Inngest (Session 5)

### 7.1 Architecture

All asynchronous work runs through Inngest on Vercel serverless functions. The pattern: app state changes emit Inngest events; job handlers subscribe to relevant events.

### 7.2 Job Inventory

| Job | Trigger Event | Estimated Duration | Concurrency |
|---|---|---|---|
| Knowledge article refresh | `article.flagged-stale` (batched) | 10-30s per article | 2 per project |
| Dashboard synthesis cache | `project.state-changed` + manual | 5-15s | 1 per project |
| Transcript processing | `transcript.uploaded` | 30s-2min | 1 per project |
| Embedding generation | `entity.content-changed` | 1-5s per entity | 5 per project |
| Metadata sync | Cron (every 4h) + `org.sync-requested` | 30s-5min | 1 per project |
| Notification dispatch | `notification.send` | <1s | 10 per project |

### 7.3 Event Schema Pattern

```typescript
// All events follow this base pattern
type InngestEvent = {
  name: string;
  data: {
    projectId: string;
    [key: string]: unknown;
  };
};

// Example events
type ArticleFlaggedStale = InngestEvent & {
  name: "article.flagged-stale";
  data: { projectId: string; articleId: string; staleReason: string };
};

type EntityContentChanged = InngestEvent & {
  name: "entity.content-changed";
  data: { projectId: string; entityType: string; entityId: string };
};

type TranscriptUploaded = InngestEvent & {
  name: "transcript.uploaded";
  data: { projectId: string; transcriptId: string; userId: string };
};

type ProjectStateChanged = InngestEvent & {
  name: "project.state-changed";
  data: { projectId: string; changeType: string; entityType: string; entityId: string };
};
```

### 7.4 Step Function Pattern (Metadata Sync)

```typescript
const metadataSyncFunction = inngest.createFunction(
  {
    id: "metadata-sync",
    concurrency: { limit: 1, scope: "env", key: "event.data.projectId" },
  },
  [
    { event: "org.sync-requested" },
    { cron: "0 */4 * * *" },  // Every 4 hours
  ],
  async ({ event, step }) => {
    const projectId = event?.data?.projectId ?? await step.run("get-active-projects", getActiveProjects);

    // Step 1: Fetch metadata (checkpoint)
    const rawMetadata = await step.run("fetch-metadata", async () => {
      return await fetchSalesforceMetadata(projectId);
    });

    // Step 2: Parse into components (checkpoint)
    const components = await step.run("parse-components", async () => {
      return await parseIntoComponents(projectId, rawMetadata);
    });

    // Step 3: AI domain classification (checkpoint)
    await step.run("classify-domains", async () => {
      return await classifyDomains(projectId, components);
    });

    // Step 4: AI business process + article synthesis (checkpoint)
    await step.run("synthesize-knowledge", async () => {
      return await synthesizeBusinessProcesses(projectId, components);
    });

    // Emit notification
    await step.sendEvent("notify-complete", {
      name: "notification.send",
      data: {
        projectId,
        type: "METADATA_SYNC_COMPLETE",
        title: "Org metadata sync complete",
        entityType: "PROJECT",
        entityId: projectId,
      },
    });
  }
);
```

### 7.5 Staleness Detection (End of Agent Loop)

After every agent harness invocation, the execution engine runs a staleness check:

```typescript
// Called at the end of executeTask() in the execution engine
async function flagStaleArticles(
  projectId: string,
  tracking: EntityTracking
): Promise<void> {
  // Collect all entity IDs the agent modified
  const modifiedEntityIds = [
    ...tracking.entitiesCreated.map(e => ({ type: e.entityType, id: e.entityId })),
    ...tracking.entitiesModified.map(e => ({ type: e.entityType, id: e.entityId })),
  ];

  if (modifiedEntityIds.length === 0) return;

  // Find articles that reference any modified entity
  const staleArticles = await prisma.knowledgeArticleReference.findMany({
    where: {
      OR: modifiedEntityIds.map(e => ({
        entityType: e.type.toUpperCase(),
        entityId: e.id,
      })),
    },
    select: { articleId: true },
    distinct: ["articleId"],
  });

  // Flag them as stale (DB update only, no AI call)
  for (const ref of staleArticles) {
    await prisma.knowledgeArticle.update({
      where: { id: ref.articleId },
      data: {
        isStale: true,
        staleReason: `Referenced entities modified during ${tracking.taskType} session`,
        staleSince: new Date(),
      },
    });

    // Emit event for background refresh
    await inngest.send({
      name: "article.flagged-stale",
      data: { projectId, articleId: ref.articleId, staleReason: "Referenced entities modified" },
    });
  }
}
```

### 7.6 V1 Constraints and V2 Scaling Path

V1 constraints and their V2 solutions are fully documented in V2-ROADMAP.md Section 1.1. Key migration triggers:
- Job failure rate > 5%
- Metadata sync > 3 minutes regularly
- 10+ concurrent projects triggering events simultaneously
- User-perceived lag > 30 seconds
- Inngest event volume approaching tier limits

---

## 8. Search Infrastructure (Session 5)

### 8.1 Full-Text Search Setup (tsvector)

PostgreSQL `tsvector` columns are auto-maintained by database triggers. Prisma uses raw SQL for search queries since Prisma does not natively support `tsvector`.

```sql
-- Example: Add tsvector column and trigger for Question
ALTER TABLE "Question" ADD COLUMN "search_vector" tsvector;

CREATE INDEX idx_question_search ON "Question" USING GIN("search_vector");

CREATE OR REPLACE FUNCTION question_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW."questionText", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."answerText", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER question_search_trigger
  BEFORE INSERT OR UPDATE ON "Question"
  FOR EACH ROW EXECUTE FUNCTION question_search_update();
```

The same pattern applies to all indexed entities (see PRD Section 17.7 for the full list).

### 8.2 Semantic Search (pgvector)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Embedding columns are already defined on OrgComponent and KnowledgeArticle.
-- Add to other searchable entities:
ALTER TABLE "Question" ADD COLUMN "embedding" vector(1536);
ALTER TABLE "Decision" ADD COLUMN "embedding" vector(1536);
ALTER TABLE "Story" ADD COLUMN "embedding" vector(1536);

-- Create HNSW index for fast approximate nearest neighbor search
CREATE INDEX idx_knowledge_article_embedding
  ON "KnowledgeArticle" USING hnsw ("embedding" vector_cosine_ops);
```

Embeddings are generated via the Inngest `entity.content-changed` event handler. The embedding job calls the Claude/OpenAI embedding API and writes the result back to the entity's embedding column.

### 8.3 Global Search Query Pattern

```typescript
// lib/search/global-search.ts

interface SearchResult {
  entityType: string;
  entityId: string;
  displayId?: string;
  title: string;
  snippet: string;
  rank: number;
}

async function globalSearch(
  projectId: string,
  query: string,
  options: { semantic?: boolean; limit?: number }
): Promise<SearchResult[]> {
  const limit = options.limit ?? 20;

  // Layer 2: Full-text search
  const fullTextResults = await prisma.$queryRaw<SearchResult[]>`
    SELECT 'Question' as "entityType", id as "entityId", "displayId",
           "questionText" as title,
           ts_headline('english', "questionText", plainto_tsquery('english', ${query})) as snippet,
           ts_rank("search_vector", plainto_tsquery('english', ${query})) as rank
    FROM "Question"
    WHERE "projectId" = ${projectId}::uuid
      AND "search_vector" @@ plainto_tsquery('english', ${query})
    UNION ALL
    SELECT 'Story' as "entityType", id as "entityId", "displayId",
           title,
           ts_headline('english', description, plainto_tsquery('english', ${query})) as snippet,
           ts_rank("search_vector", plainto_tsquery('english', ${query})) as rank
    FROM "Story"
    WHERE "projectId" = ${projectId}::uuid
      AND "search_vector" @@ plainto_tsquery('english', ${query})
    -- ... additional UNION ALL for each indexed entity type
    ORDER BY rank DESC
    LIMIT ${limit}
  `;

  // If full-text returns few results and semantic is enabled, fall back
  if (fullTextResults.length < 3 && options.semantic) {
    const embedding = await generateEmbedding(query);
    const semanticResults = await prisma.$queryRaw<SearchResult[]>`
      SELECT 'KnowledgeArticle' as "entityType", id as "entityId", NULL as "displayId",
             title, summary as snippet,
             1 - (embedding <=> ${embedding}::vector) as rank
      FROM "KnowledgeArticle"
      WHERE "projectId" = ${projectId}::uuid
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT ${limit}
    `;
    return [...fullTextResults, ...semanticResults];
  }

  return fullTextResults;
}
```

---

## 9. Remaining Items for Future Sessions

### Tier 2: Resolve During Phase 2-3 Build

1. **Sprint Intelligence Algorithms.** The StoryComponent join table provides the data, but the scoring algorithm (how to rank severity of overlapping components) needs design. Recommended: address during Phase 2 when sprint management is built.

2. **Org Metadata Parsing Pipeline.** Translating raw SF CLI JSON output into normalized OrgComponent/OrgRelationship rows. The existing `sf-org-knowledge` skill's four-phase approach informs this. Recommended: address during Phase 3 when org connectivity is built.

### Tier 3: Resolve During Phase 4

3. **Document Generation Pipeline.** Library choices for generating branded Word/PowerPoint/PDF from templates. Candidates: `docx-templater` or `python-docx` (via subprocess) for Word, `pptxgenjs` for PowerPoint, `pdf-lib` for PDF. Recommended: address during Phase 4.

### Design Decisions to Finalize During Phase 1

4. **Question duplicate detection algorithm.** Start simple (substring + Levenshtein distance). Upgrade to embedding-based similarity in V2 if false positives/negatives are problematic (V2-ROADMAP.md Section 2.1).

5. **Firm-level rules configuration format.** TypeScript constants, JSON config file, or database seeds. Decide during Phase 1 initial setup.

### Resolved in Sessions 4-5

The following items from the original "Remaining Items" list have been fully specified:

- ~~Webhook/event-driven briefing refresh vs. polling~~ : Resolved. Inngest event-driven pattern (Section 7). Dashboard synthesis triggered by `project.state-changed` events.
- ~~Knowledge architecture~~ : Resolved. Three-layer design specified in PRD Section 13.7, entity schemas in Section 2.2, context assembly in Section 3, ingestion pipeline in Section 6.
- ~~Background job infrastructure~~ : Resolved. Inngest on Vercel serverless (Section 7).
- ~~Search infrastructure~~ : Resolved. Three-layer search (Section 8).
- ~~Notification system~~ : Resolved. In-app notifications via Inngest events (PRD Section 17.8, Notification entity in Section 2.2).
- ~~Chat/conversation model~~ : Resolved. Conversation + ChatMessage entities (Section 2.2).
- ~~AI ambiguity handling~~ : Resolved. Confidence/needsReview fields on Question, Decision, Requirement, Risk (Section 2.2, PRD Section 6.6).
