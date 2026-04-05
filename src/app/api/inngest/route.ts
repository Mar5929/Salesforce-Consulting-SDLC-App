import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { auditLogFunction } from "@/lib/inngest/functions/audit-log"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [auditLogFunction],
})
