import { inngest } from "../client"
import { EVENTS } from "../events"
import { prisma } from "@/lib/db"
import type { NotificationPriority } from "@/generated/prisma"

/**
 * Priority assignment by notification type (D-30).
 * URGENT: Immediate attention needed (conflicts, critical risks)
 * HIGH: Important workflow events (question answered, sprint conflicts)
 * NORMAL: Standard workflow events (assignments, status changes)
 * LOW: Informational (processing complete, sync done)
 */
const NOTIFICATION_PRIORITY: Record<string, NotificationPriority> = {
  SPRINT_CONFLICT_DETECTED: "URGENT",
  RISK_CHANGED: "HIGH",
  QUESTION_ANSWERED: "HIGH",
  WORK_ITEM_UNBLOCKED: "HIGH",
  HEALTH_SCORE_CHANGED: "HIGH",
  QUESTION_ASSIGNED: "NORMAL",
  QUESTION_AGING: "NORMAL",
  STORY_STATUS_CHANGED: "NORMAL",
  STORY_MOVED_TO_QA: "NORMAL",
  STORY_REASSIGNED: "NORMAL",
  DECISION_RECORDED: "NORMAL",
  ARTICLE_FLAGGED_STALE: "LOW",
  AI_PROCESSING_COMPLETE: "LOW",
  METADATA_SYNC_COMPLETE: "LOW",
}

/**
 * Notification Dispatch Function
 *
 * Triggered by NOTIFICATION_SEND event. Resolves recipients based on
 * notification type and creates Notification records in batch.
 *
 * Event data shape:
 *   projectId: string
 *   type: NotificationType enum value
 *   title: string
 *   body?: string
 *   entityType: NotificationEntityType enum value
 *   entityId: string
 *   actorMemberId: string (ProjectMember.id of the person who triggered the event)
 *   recipientMemberIds?: string[] (explicit recipients, skips resolution if provided)
 *
 * T-02-33: Notification content is generated server-side from event data,
 * not user input. Title templates are hardcoded per type.
 *
 * D-29: Dispatched via Inngest background jobs.
 */
export const notificationDispatchFunction = inngest.createFunction(
  {
    id: "notification-dispatch",
    retries: 3,
    concurrency: [
      {
        limit: 10,
        scope: "fn",
        key: "event.data.projectId",
      },
    ],
    triggers: [{ event: EVENTS.NOTIFICATION_SEND }],
  },
  async ({ event, step }) => {
    const {
      projectId,
      type,
      title,
      body,
      entityType,
      entityId,
      actorMemberId,
      recipientMemberIds,
    } = event.data as {
      projectId: string
      type: string
      title: string
      body?: string
      entityType: string
      entityId: string
      actorMemberId: string
      recipientMemberIds?: string[]
    }

    // Step 1: Resolve recipients
    const recipients = await step.run("resolve-recipients", async () => {
      // If explicit recipients provided, use them (minus the actor)
      if (recipientMemberIds && recipientMemberIds.length > 0) {
        return recipientMemberIds.filter((id) => id !== actorMemberId)
      }

      // Otherwise resolve based on notification type
      const activeMembers = await prisma.projectMember.findMany({
        where: { projectId, status: "ACTIVE" },
        select: { id: true, role: true, clerkUserId: true },
      })

      // Filter out the actor from all recipient lists
      const excludeActor = (members: typeof activeMembers) =>
        members.filter((m) => m.id !== actorMemberId).map((m) => m.id)

      switch (type) {
        // Question assigned -> assignee only (handled via explicit recipientMemberIds)
        case "QUESTION_ASSIGNED":
          return excludeActor(activeMembers)

        // Question answered -> PM + BA + SA roles (stakeholders)
        case "QUESTION_ANSWERED":
          return excludeActor(
            activeMembers.filter((m) =>
              ["PM", "BA", "SOLUTION_ARCHITECT"].includes(m.role)
            )
          )

        // Work item unblocked -> PM + assignee (handled via explicit recipientMemberIds if known)
        case "WORK_ITEM_UNBLOCKED":
          return excludeActor(
            activeMembers.filter((m) => ["PM", "BA"].includes(m.role))
          )

        // AI processing complete (transcript) -> uploader (via recipientMemberIds)
        case "AI_PROCESSING_COMPLETE":
          return excludeActor(activeMembers)

        // Article flagged stale -> SA + BA roles
        case "ARTICLE_FLAGGED_STALE":
          return excludeActor(
            activeMembers.filter((m) =>
              ["SOLUTION_ARCHITECT", "BA"].includes(m.role)
            )
          )

        // Health score changed -> PM + SA
        case "HEALTH_SCORE_CHANGED":
          return excludeActor(
            activeMembers.filter((m) =>
              ["PM", "SOLUTION_ARCHITECT"].includes(m.role)
            )
          )

        // Question aging -> PM + BA
        case "QUESTION_AGING":
          return excludeActor(
            activeMembers.filter((m) => ["PM", "BA"].includes(m.role))
          )

        // Sprint conflict detected -> PM + SA (Phase 3, but handle dispatch)
        case "SPRINT_CONFLICT_DETECTED":
          return excludeActor(
            activeMembers.filter((m) =>
              ["PM", "SOLUTION_ARCHITECT"].includes(m.role)
            )
          )

        // Story status changed -> PM + assignee (via recipientMemberIds if known)
        case "STORY_STATUS_CHANGED":
        case "STORY_MOVED_TO_QA":
        case "STORY_REASSIGNED":
          return excludeActor(
            activeMembers.filter((m) =>
              ["PM", "QA", "DEVELOPER"].includes(m.role)
            )
          )

        // Decision recorded -> all stakeholder roles
        case "DECISION_RECORDED":
          return excludeActor(
            activeMembers.filter((m) =>
              ["PM", "BA", "SOLUTION_ARCHITECT"].includes(m.role)
            )
          )

        // Risk changed -> PM + SA
        case "RISK_CHANGED":
          return excludeActor(
            activeMembers.filter((m) =>
              ["PM", "SOLUTION_ARCHITECT"].includes(m.role)
            )
          )

        // Metadata sync complete -> SA + Developer
        case "METADATA_SYNC_COMPLETE":
          return excludeActor(
            activeMembers.filter((m) =>
              ["SOLUTION_ARCHITECT", "DEVELOPER"].includes(m.role)
            )
          )

        // Default: all active members except actor
        default:
          return excludeActor(activeMembers)
      }
    })

    // Step 2: Create notifications in batch
    if (recipients.length === 0) {
      return { created: 0, recipients: [] }
    }

    const created = await step.run("create-notifications", async () => {
      const result = await prisma.notification.createMany({
        data: recipients.map((recipientId) => ({
          projectId,
          recipientId,
          type: type as any,
          title,
          body: body ?? null,
          entityType: entityType as any,
          entityId,
          priority: NOTIFICATION_PRIORITY[type] ?? "NORMAL",
        })),
      })
      return result.count
    })

    return { created, recipients }
  }
)
