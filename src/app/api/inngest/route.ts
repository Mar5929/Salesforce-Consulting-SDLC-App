import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { auditLogFunction } from "@/lib/inngest/functions/audit-log"
import { transcriptProcessingFunction, transcriptProcessingFailure } from "@/lib/inngest/functions/transcript-processing"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [auditLogFunction, transcriptProcessingFunction, transcriptProcessingFailure],
})
