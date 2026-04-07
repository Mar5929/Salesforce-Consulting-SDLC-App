import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { auditLogFunction } from "@/lib/inngest/functions/audit-log"
import { transcriptProcessingFunction, transcriptProcessingFailure } from "@/lib/inngest/functions/transcript-processing"
import { stalenessDetectionFunction } from "@/lib/inngest/functions/staleness-detection"
import { articleRefreshFunction } from "@/lib/inngest/functions/article-refresh"
import { embeddingBatchFunction } from "@/lib/inngest/functions/embedding-batch"
import { dashboardSynthesisFunction } from "@/lib/inngest/functions/dashboard-synthesis"
import { notificationDispatchFunction } from "@/lib/inngest/functions/notification-dispatch"
import { questionImpactAssessmentFunction } from "@/lib/inngest/functions/question-impact-assessment"
import { sprintIntelligence } from "@/lib/inngest/functions/sprint-intelligence"
import { metadataSyncFunction } from "@/lib/inngest/functions/metadata-sync"
import { orgIngestionFunction } from "@/lib/inngest/functions/org-ingestion"
import { generateDocumentFunction } from "@/lib/inngest/functions/document-generation"
import { synthesizePmDashboard } from "@/lib/inngest/functions/pm-dashboard-synthesis"
import { jiraSyncOnStatusChange } from "@/lib/inngest/functions/jira-sync"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    auditLogFunction,
    transcriptProcessingFunction,
    transcriptProcessingFailure,
    stalenessDetectionFunction,
    articleRefreshFunction,
    embeddingBatchFunction,
    dashboardSynthesisFunction,
    notificationDispatchFunction,
    questionImpactAssessmentFunction,
    sprintIntelligence,
    metadataSyncFunction,
    orgIngestionFunction,
    generateDocumentFunction,
    synthesizePmDashboard,
    jiraSyncOnStatusChange,
  ],
})
