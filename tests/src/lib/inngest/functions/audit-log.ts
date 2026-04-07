import { inngest } from "../client"
import { EVENTS } from "../events"
import { prisma } from "@/lib/db"

export const auditLogFunction = inngest.createFunction(
  {
    id: "audit-log",
    retries: 3, // D-13: 3 retries with exponential backoff (Inngest default)
    triggers: [{ event: EVENTS.AUDIT_SENSITIVE_OP }],
  },
  async ({ event, step }) => {
    await step.run("write-audit-log", async () => {
      await prisma.statusTransition.create({
        data: {
          entityType: event.data.entityType,
          entityId: event.data.entityId,
          fromStatus: event.data.fromStatus,
          toStatus: event.data.toStatus,
          transitionedById: event.data.userId,
          transitionedByRole: event.data.userRole,
          reason: event.data.reason ?? null,
        },
      })
    })
  }
)
