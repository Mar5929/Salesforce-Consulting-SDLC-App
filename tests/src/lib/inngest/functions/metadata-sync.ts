/**
 * Metadata Sync Inngest Function
 *
 * Triggered by ORG_SYNC_REQUESTED event. Runs the metadata sync pipeline
 * with per-project concurrency limit of 1 to prevent token refresh race
 * conditions (T-04-09).
 *
 * Sequential type processing with Inngest step retries handles Salesforce
 * governor limit errors (T-04-10).
 */

import { inngest } from "../client"
import { EVENTS } from "../events"
import { syncMetadata } from "@/lib/salesforce/metadata-sync"

export const metadataSyncFunction = inngest.createFunction(
  {
    id: "metadata-sync",
    retries: 3,
    concurrency: [
      {
        scope: "fn",
        key: "event.data.projectId",
        limit: 1,
      },
    ],
  },
  { event: EVENTS.ORG_SYNC_REQUESTED },
  async ({ event, step }) => {
    const { projectId, syncType } = event.data as {
      projectId: string
      syncType: "FULL" | "INCREMENTAL"
    }

    const counts = await step.run("sync-metadata", async () => {
      return syncMetadata(projectId, syncType)
    })

    await step.sendEvent("notify-sync-complete", {
      name: EVENTS.ORG_SYNC_COMPLETED,
      data: {
        projectId,
        counts,
      },
    })

    return { success: true, counts }
  }
)
