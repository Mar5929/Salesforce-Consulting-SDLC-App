import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { auditLogFunction } from "@/lib/inngest/functions/audit-log"
import { transcriptProcessingFunction, transcriptProcessingFailure } from "@/lib/inngest/functions/transcript-processing"
import { stalenessDetectionFunction } from "@/lib/inngest/functions/staleness-detection"
import { articleRefreshFunction } from "@/lib/inngest/functions/article-refresh"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    auditLogFunction,
    transcriptProcessingFunction,
    transcriptProcessingFailure,
    stalenessDetectionFunction,
    articleRefreshFunction,
  ],
})
