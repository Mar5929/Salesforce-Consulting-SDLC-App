-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('GREENFIELD', 'BUILD_PHASE', 'MANAGED_SERVICES', 'RESCUE_TAKEOVER');

-- CreateEnum
CREATE TYPE "ProjectPhase" AS ENUM ('DISCOVERY', 'REQUIREMENTS', 'SOLUTION_DESIGN', 'BUILD', 'TESTING', 'DEPLOYMENT', 'HYPERCARE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('SOLUTION_ARCHITECT', 'DEVELOPER', 'PM', 'BA', 'QA');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "EpicStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "EpicPhaseType" AS ENUM ('DISCOVERY', 'DESIGN', 'BUILD', 'TEST', 'DEPLOY');

-- CreateEnum
CREATE TYPE "EpicPhaseStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'READY', 'SPRINT_PLANNED', 'IN_PROGRESS', 'IN_REVIEW', 'QA', 'DONE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "QuestionScope" AS ENUM ('ENGAGEMENT', 'EPIC', 'FEATURE');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('BUSINESS_PROCESS', 'TECHNICAL', 'DATA', 'INTEGRATION', 'SECURITY', 'COMPLIANCE', 'DESIGN', 'GENERAL');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('OPEN', 'SCOPED', 'OWNED', 'ANSWERED', 'REVIEWED', 'PARKED');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('CAPTURED', 'MAPPED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "RiskLikelihood" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RiskImpact" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'MITIGATED', 'CLOSED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('HAPPY_PATH', 'EDGE_CASE', 'NEGATIVE', 'BULK');

-- CreateEnum
CREATE TYPE "TestSource" AS ENUM ('AI_GENERATED', 'MANUAL');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('PASS', 'FAIL', 'BLOCKED');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('OPEN', 'ASSIGNED', 'FIXED', 'VERIFIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('OBJECT', 'FIELD', 'APEX_CLASS', 'APEX_TRIGGER', 'FLOW', 'PROCESS_BUILDER', 'WORKFLOW_RULE', 'VALIDATION_RULE', 'LWC', 'AURA', 'PERMISSION_SET', 'PROFILE', 'PERMISSION_SET_GROUP', 'CONNECTED_APP', 'NAMED_CREDENTIAL', 'REMOTE_SITE_SETTING', 'PLATFORM_EVENT', 'CUSTOM_METADATA_TYPE', 'RECORD_TYPE', 'PAGE_LAYOUT', 'INSTALLED_PACKAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "OrgRelationshipType" AS ENUM ('LOOKUP', 'MASTER_DETAIL', 'TRIGGER_ON', 'FLOW_ON', 'REFERENCES');

-- CreateEnum
CREATE TYPE "ComponentStatus" AS ENUM ('EXISTING', 'PLANNED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "EmbeddingStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED');

-- CreateEnum
CREATE TYPE "BusinessProcessStatus" AS ENUM ('DISCOVERED', 'DOCUMENTED', 'CONFIRMED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "Complexity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BusinessProcessDependencyType" AS ENUM ('TRIGGERS', 'FEEDS_DATA', 'REQUIRES_COMPLETION', 'SHARED_COMPONENTS');

-- CreateEnum
CREATE TYPE "KnowledgeArticleType" AS ENUM ('BUSINESS_PROCESS', 'INTEGRATION', 'ARCHITECTURE_DECISION', 'DOMAIN_OVERVIEW', 'CROSS_CUTTING_CONCERN', 'STAKEHOLDER_CONTEXT');

-- CreateEnum
CREATE TYPE "KnowledgeAuthorType" AS ENUM ('AI_GENERATED', 'HUMAN_AUTHORED', 'AI_GENERATED_HUMAN_EDITED');

-- CreateEnum
CREATE TYPE "KnowledgeArticleRefEntityType" AS ENUM ('BUSINESS_PROCESS', 'ORG_COMPONENT', 'EPIC', 'STORY', 'QUESTION', 'DECISION');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('GENERAL_CHAT', 'TRANSCRIPT_SESSION', 'STORY_SESSION', 'BRIEFING_SESSION', 'QUESTION_SESSION', 'ENRICHMENT_SESSION');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('QUESTION_ANSWERED', 'WORK_ITEM_UNBLOCKED', 'SPRINT_CONFLICT_DETECTED', 'AI_PROCESSING_COMPLETE', 'QUESTION_AGING', 'HEALTH_SCORE_CHANGED', 'QUESTION_ASSIGNED', 'STORY_STATUS_CHANGED', 'STORY_MOVED_TO_QA', 'STORY_REASSIGNED', 'DECISION_RECORDED', 'RISK_CHANGED', 'ARTICLE_FLAGGED_STALE', 'METADATA_SYNC_COMPLETE');

-- CreateEnum
CREATE TYPE "NotificationEntityType" AS ENUM ('QUESTION', 'STORY', 'SPRINT', 'PROJECT', 'ARTICLE', 'BUSINESS_PROCESS', 'DECISION', 'RISK');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ImpactType" AS ENUM ('CREATE', 'MODIFY', 'DELETE');

-- CreateEnum
CREATE TYPE "TranscriptStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "SessionLogTaskType" AS ENUM ('TRANSCRIPT_PROCESSING', 'QUESTION_ANSWERING', 'STORY_GENERATION', 'STORY_ENRICHMENT', 'BRIEFING_GENERATION', 'STATUS_REPORT_GENERATION', 'DOCUMENT_GENERATION', 'SPRINT_ANALYSIS', 'CONTEXT_PACKAGE_ASSEMBLY', 'ORG_QUERY', 'DASHBOARD_SYNTHESIS');

-- CreateEnum
CREATE TYPE "SessionLogStatus" AS ENUM ('RUNNING', 'COMPLETE', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BRD', 'SDD', 'SOW', 'STATUS_REPORT', 'PRESENTATION', 'TEST_SCRIPT', 'DEPLOYMENT_RUNBOOK', 'TRAINING_MATERIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentFormat" AS ENUM ('DOCX', 'PPTX', 'PDF');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('FULL', 'INCREMENTAL');

-- CreateEnum
CREATE TYPE "SyncRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "engagementType" "EngagementType" NOT NULL,
    "currentPhase" "ProjectPhase" NOT NULL DEFAULT 'DISCOVERY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetEndDate" TIMESTAMP(3),
    "sandboxStrategy" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "sfOrgInstanceUrl" TEXT,
    "sfOrgAccessToken" TEXT,
    "sfOrgRefreshToken" TEXT,
    "sfOrgLastSyncAt" TIMESTAMP(3),
    "sfOrgSyncIntervalHours" INTEGER NOT NULL DEFAULT 4,
    "cachedBriefingContent" JSONB,
    "cachedBriefingGeneratedAt" TIMESTAMP(3),
    "healthScoreThresholds" JSONB,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Epic" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "description" TEXT,
    "status" "EpicStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Epic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpicPhase" (
    "id" TEXT NOT NULL,
    "epicId" TEXT NOT NULL,
    "phase" "EpicPhaseType" NOT NULL,
    "status" "EpicPhaseStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "EpicPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "epicId" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "FeatureStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "epicId" TEXT NOT NULL,
    "featureId" TEXT,
    "sprintId" TEXT,
    "assigneeId" TEXT,
    "testAssigneeId" TEXT,
    "displayId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "persona" TEXT,
    "description" TEXT,
    "acceptanceCriteria" TEXT,
    "storyPoints" INTEGER,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT',
    "dependencies" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "scope" "QuestionScope" NOT NULL,
    "category" "QuestionCategory" NOT NULL DEFAULT 'GENERAL',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "scopeEpicId" TEXT,
    "scopeFeatureId" TEXT,
    "ownerId" TEXT,
    "ownerDescription" TEXT,
    "status" "QuestionStatus" NOT NULL DEFAULT 'OPEN',
    "askedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answerText" TEXT,
    "answeredDate" TIMESTAMP(3),
    "answeredById" TEXT,
    "impactAssessment" TEXT,
    "parkedReason" TEXT,
    "confidence" "Confidence" NOT NULL DEFAULT 'HIGH',
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "decisionDate" TIMESTAMP(3) NOT NULL,
    "madeById" TEXT,
    "confidence" "Confidence" NOT NULL DEFAULT 'HIGH',
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequirementStatus" NOT NULL DEFAULT 'CAPTURED',
    "confidence" "Confidence" NOT NULL DEFAULT 'HIGH',
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "likelihood" "RiskLikelihood" NOT NULL,
    "impact" "RiskImpact" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "mitigationStrategy" TEXT,
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "ownerId" TEXT,
    "confidence" "Confidence" NOT NULL DEFAULT 'HIGH',
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sprint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNING',
    "cachedAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "steps" TEXT,
    "expectedResult" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "source" "TestSource" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestExecution" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "executedById" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "result" "TestResult" NOT NULL,
    "notes" TEXT,
    "defectId" TEXT,
    "environment" TEXT,

    CONSTRAINT "TestExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "storyId" TEXT,
    "testCaseId" TEXT,
    "displayId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "stepsToReproduce" TEXT NOT NULL,
    "expectedBehavior" TEXT NOT NULL,
    "actualBehavior" TEXT NOT NULL,
    "environment" TEXT,
    "status" "DefectStatus" NOT NULL DEFAULT 'OPEN',
    "assigneeId" TEXT,
    "duplicateOfId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Defect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgComponent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "label" TEXT,
    "componentType" "ComponentType" NOT NULL,
    "parentComponentId" TEXT,
    "namespace" TEXT,
    "apiVersion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "domainGroupingId" TEXT,
    "componentStatus" "ComponentStatus" NOT NULL DEFAULT 'EXISTING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "embedding" vector(1536),
    "embeddingStatus" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING',
    "needsAssignment" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrgComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgRelationship" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceComponentId" TEXT NOT NULL,
    "targetComponentId" TEXT NOT NULL,
    "relationshipType" "OrgRelationshipType" NOT NULL,

    CONSTRAINT "OrgRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainGrouping" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isAiSuggested" BOOLEAN NOT NULL DEFAULT true,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DomainGrouping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessContextAnnotation" (
    "id" TEXT NOT NULL,
    "orgComponentId" TEXT NOT NULL,
    "annotationText" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessContextAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProcess" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "domainGroupingId" TEXT,
    "status" "BusinessProcessStatus" NOT NULL DEFAULT 'DISCOVERED',
    "complexity" "Complexity",
    "isAiSuggested" BOOLEAN NOT NULL DEFAULT true,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProcessComponent" (
    "id" TEXT NOT NULL,
    "businessProcessId" TEXT NOT NULL,
    "orgComponentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BusinessProcessComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProcessDependency" (
    "id" TEXT NOT NULL,
    "sourceProcessId" TEXT NOT NULL,
    "targetProcessId" TEXT NOT NULL,
    "dependencyType" "BusinessProcessDependencyType" NOT NULL,
    "description" TEXT,

    CONSTRAINT "BusinessProcessDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgSyncRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "syncType" "SyncType" NOT NULL,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'PENDING',
    "componentCounts" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OrgSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequestLog" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "articleType" "KnowledgeArticleType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" "Confidence" NOT NULL DEFAULT 'MEDIUM',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "staleReason" TEXT,
    "staleSince" TIMESTAMP(3),
    "lastRefreshedAt" TIMESTAMP(3),
    "authorType" "KnowledgeAuthorType" NOT NULL DEFAULT 'AI_GENERATED',
    "embedding" vector(1536),
    "embeddingStatus" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING',
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "thumbsUpCount" INTEGER NOT NULL DEFAULT 0,
    "thumbsDownCount" INTEGER NOT NULL DEFAULT 0,
    "effectivenessScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticleReference" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "entityType" "KnowledgeArticleRefEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeArticleReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "conversationType" "ConversationType" NOT NULL,
    "title" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "sessionLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT,
    "toolCalls" JSONB,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "entityType" "NotificationEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "rawContent" TEXT,
    "s3Key" TEXT,
    "processingStatus" "TranscriptStatus" NOT NULL DEFAULT 'PENDING',
    "sessionLogId" TEXT,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskType" "SessionLogTaskType" NOT NULL,
    "status" "SessionLogStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "model" TEXT DEFAULT 'claude-sonnet-4-20250514',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalIterations" INTEGER NOT NULL DEFAULT 1,
    "summary" TEXT,
    "entitiesCreated" JSONB,
    "entitiesModified" JSONB,
    "errorMessage" TEXT,

    CONSTRAINT "SessionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "format" "DocumentFormat" NOT NULL,
    "s3Key" TEXT NOT NULL,
    "templateUsed" TEXT,
    "generatedById" TEXT NOT NULL,
    "sessionLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionHistory" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "previousState" JSONB NOT NULL,
    "modifiedById" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusTransition" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "transitionedById" TEXT NOT NULL,
    "transitionedByRole" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "instanceUrl" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "jiraProjectKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraSyncRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "jiraIssueId" TEXT,
    "jiraIssueKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lastSyncAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraSyncRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBlocksStory" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,

    CONSTRAINT "QuestionBlocksStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBlocksEpic" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "epicId" TEXT NOT NULL,

    CONSTRAINT "QuestionBlocksEpic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBlocksFeature" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,

    CONSTRAINT "QuestionBlocksFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAffects" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "epicId" TEXT,
    "featureId" TEXT,

    CONSTRAINT "QuestionAffects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionQuestion" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "DecisionQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionScope" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "epicId" TEXT,
    "featureId" TEXT,

    CONSTRAINT "DecisionScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementEpic" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "epicId" TEXT NOT NULL,

    CONSTRAINT "RequirementEpic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementStory" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,

    CONSTRAINT "RequirementStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskEpic" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "epicId" TEXT NOT NULL,

    CONSTRAINT "RiskEpic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryComponent" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orgComponentId" TEXT,
    "componentName" TEXT,
    "impactType" "ImpactType" NOT NULL,

    CONSTRAINT "StoryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneStory" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,

    CONSTRAINT "MilestoneStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OauthState" (
    "token" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OauthState_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_clerkUserId_key" ON "ProjectMember"("projectId", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Epic_projectId_prefix_key" ON "Epic"("projectId", "prefix");

-- CreateIndex
CREATE UNIQUE INDEX "EpicPhase_epicId_phase_key" ON "EpicPhase"("epicId", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_epicId_prefix_key" ON "Feature"("epicId", "prefix");

-- CreateIndex
CREATE UNIQUE INDEX "Story_projectId_displayId_key" ON "Story"("projectId", "displayId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgComponent_projectId_apiName_componentType_key" ON "OrgComponent"("projectId", "apiName", "componentType");

-- CreateIndex
CREATE UNIQUE INDEX "OrgRelationship_sourceComponentId_targetComponentId_relatio_key" ON "OrgRelationship"("sourceComponentId", "targetComponentId", "relationshipType");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProcess_projectId_name_key" ON "BusinessProcess"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProcessComponent_businessProcessId_orgComponentId_key" ON "BusinessProcessComponent"("businessProcessId", "orgComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProcessDependency_sourceProcessId_targetProcessId_key" ON "BusinessProcessDependency"("sourceProcessId", "targetProcessId");

-- CreateIndex
CREATE INDEX "OrgSyncRun_projectId_startedAt_idx" ON "OrgSyncRun"("projectId", "startedAt");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "ApiKey_projectId_isActive_idx" ON "ApiKey"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "ApiRequestLog_apiKeyId_endpoint_timestamp_idx" ON "ApiRequestLog"("apiKeyId", "endpoint", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_projectId_articleType_title_key" ON "KnowledgeArticle"("projectId", "articleType", "title");

-- CreateIndex
CREATE INDEX "KnowledgeArticleReference_entityType_entityId_idx" ON "KnowledgeArticleReference"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticleReference_articleId_entityType_entityId_key" ON "KnowledgeArticleReference"("articleId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_priority_createdAt_idx" ON "Notification"("recipientId", "isRead", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "VersionHistory_entityType_entityId_idx" ON "VersionHistory"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "StatusTransition_entityType_entityId_createdAt_idx" ON "StatusTransition"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JiraConfig_projectId_key" ON "JiraConfig"("projectId");

-- CreateIndex
CREATE INDEX "JiraSyncRecord_projectId_status_idx" ON "JiraSyncRecord"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "JiraSyncRecord_projectId_storyId_key" ON "JiraSyncRecord"("projectId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBlocksStory_questionId_storyId_key" ON "QuestionBlocksStory"("questionId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBlocksEpic_questionId_epicId_key" ON "QuestionBlocksEpic"("questionId", "epicId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBlocksFeature_questionId_featureId_key" ON "QuestionBlocksFeature"("questionId", "featureId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAffects_questionId_epicId_featureId_key" ON "QuestionAffects"("questionId", "epicId", "featureId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionQuestion_decisionId_questionId_key" ON "DecisionQuestion"("decisionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionScope_decisionId_epicId_featureId_key" ON "DecisionScope"("decisionId", "epicId", "featureId");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementEpic_requirementId_epicId_key" ON "RequirementEpic"("requirementId", "epicId");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementStory_requirementId_storyId_key" ON "RequirementStory"("requirementId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskEpic_riskId_epicId_key" ON "RiskEpic"("riskId", "epicId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryComponent_storyId_orgComponentId_key" ON "StoryComponent"("storyId", "orgComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneStory_milestoneId_storyId_key" ON "MilestoneStory"("milestoneId", "storyId");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Epic" ADD CONSTRAINT "Epic_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpicPhase" ADD CONSTRAINT "EpicPhase_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "ProjectMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_testAssigneeId_fkey" FOREIGN KEY ("testAssigneeId") REFERENCES "ProjectMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_scopeEpicId_fkey" FOREIGN KEY ("scopeEpicId") REFERENCES "Epic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_scopeFeatureId_fkey" FOREIGN KEY ("scopeFeatureId") REFERENCES "Feature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "ProjectMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "ProjectMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_madeById_fkey" FOREIGN KEY ("madeById") REFERENCES "ProjectMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "ProjectMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestExecution" ADD CONSTRAINT "TestExecution_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestExecution" ADD CONSTRAINT "TestExecution_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestExecution" ADD CONSTRAINT "TestExecution_defectId_fkey" FOREIGN KEY ("defectId") REFERENCES "Defect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "ProjectMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "Defect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgComponent" ADD CONSTRAINT "OrgComponent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgComponent" ADD CONSTRAINT "OrgComponent_parentComponentId_fkey" FOREIGN KEY ("parentComponentId") REFERENCES "OrgComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgComponent" ADD CONSTRAINT "OrgComponent_domainGroupingId_fkey" FOREIGN KEY ("domainGroupingId") REFERENCES "DomainGrouping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgRelationship" ADD CONSTRAINT "OrgRelationship_sourceComponentId_fkey" FOREIGN KEY ("sourceComponentId") REFERENCES "OrgComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgRelationship" ADD CONSTRAINT "OrgRelationship_targetComponentId_fkey" FOREIGN KEY ("targetComponentId") REFERENCES "OrgComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainGrouping" ADD CONSTRAINT "DomainGrouping_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContextAnnotation" ADD CONSTRAINT "BusinessContextAnnotation_orgComponentId_fkey" FOREIGN KEY ("orgComponentId") REFERENCES "OrgComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContextAnnotation" ADD CONSTRAINT "BusinessContextAnnotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_domainGroupingId_fkey" FOREIGN KEY ("domainGroupingId") REFERENCES "DomainGrouping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcessComponent" ADD CONSTRAINT "BusinessProcessComponent_businessProcessId_fkey" FOREIGN KEY ("businessProcessId") REFERENCES "BusinessProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcessComponent" ADD CONSTRAINT "BusinessProcessComponent_orgComponentId_fkey" FOREIGN KEY ("orgComponentId") REFERENCES "OrgComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcessDependency" ADD CONSTRAINT "BusinessProcessDependency_sourceProcessId_fkey" FOREIGN KEY ("sourceProcessId") REFERENCES "BusinessProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcessDependency" ADD CONSTRAINT "BusinessProcessDependency_targetProcessId_fkey" FOREIGN KEY ("targetProcessId") REFERENCES "BusinessProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgSyncRun" ADD CONSTRAINT "OrgSyncRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiRequestLog" ADD CONSTRAINT "ApiRequestLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticleReference" ADD CONSTRAINT "KnowledgeArticleReference_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_sessionLogId_fkey" FOREIGN KEY ("sessionLogId") REFERENCES "SessionLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_sessionLogId_fkey" FOREIGN KEY ("sessionLogId") REFERENCES "SessionLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionLog" ADD CONSTRAINT "SessionLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionLog" ADD CONSTRAINT "SessionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_sessionLogId_fkey" FOREIGN KEY ("sessionLogId") REFERENCES "SessionLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionHistory" ADD CONSTRAINT "VersionHistory_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusTransition" ADD CONSTRAINT "StatusTransition_transitionedById_fkey" FOREIGN KEY ("transitionedById") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraConfig" ADD CONSTRAINT "JiraConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraSyncRecord" ADD CONSTRAINT "JiraSyncRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraSyncRecord" ADD CONSTRAINT "JiraSyncRecord_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBlocksStory" ADD CONSTRAINT "QuestionBlocksStory_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBlocksStory" ADD CONSTRAINT "QuestionBlocksStory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBlocksEpic" ADD CONSTRAINT "QuestionBlocksEpic_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBlocksEpic" ADD CONSTRAINT "QuestionBlocksEpic_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBlocksFeature" ADD CONSTRAINT "QuestionBlocksFeature_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBlocksFeature" ADD CONSTRAINT "QuestionBlocksFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAffects" ADD CONSTRAINT "QuestionAffects_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAffects" ADD CONSTRAINT "QuestionAffects_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAffects" ADD CONSTRAINT "QuestionAffects_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionQuestion" ADD CONSTRAINT "DecisionQuestion_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionQuestion" ADD CONSTRAINT "DecisionQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionScope" ADD CONSTRAINT "DecisionScope_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionScope" ADD CONSTRAINT "DecisionScope_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionScope" ADD CONSTRAINT "DecisionScope_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementEpic" ADD CONSTRAINT "RequirementEpic_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementEpic" ADD CONSTRAINT "RequirementEpic_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementStory" ADD CONSTRAINT "RequirementStory_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementStory" ADD CONSTRAINT "RequirementStory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskEpic" ADD CONSTRAINT "RiskEpic_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskEpic" ADD CONSTRAINT "RiskEpic_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryComponent" ADD CONSTRAINT "StoryComponent_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryComponent" ADD CONSTRAINT "StoryComponent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryComponent" ADD CONSTRAINT "StoryComponent_orgComponentId_fkey" FOREIGN KEY ("orgComponentId") REFERENCES "OrgComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneStory" ADD CONSTRAINT "MilestoneStory_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneStory" ADD CONSTRAINT "MilestoneStory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
