"use server"

/**
 * Notification Server Actions
 *
 * Read/mark-read operations for in-app notifications.
 * All actions verify the notification belongs to the current user (T-02-31, T-02-32).
 * Uses next-safe-action for Zod validation and auth middleware.
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { actionClient } from "@/lib/safe-action"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const getNotificationsSchema = z.object({
  projectId: z.string().min(1),
  limit: z.number().int().positive().max(100).default(30),
})

const getUnreadCountSchema = z.object({
  projectId: z.string().min(1),
})

const markReadSchema = z.object({
  projectId: z.string().min(1),
  notificationId: z.string().min(1),
})

const markAllReadSchema = z.object({
  projectId: z.string().min(1),
})

// ────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────

/**
 * Fetch notifications for current user in project.
 * Ordered by createdAt DESC (newest first). D-30.
 * T-02-32: Filtered by recipientId = current member.
 */
export const getNotifications = actionClient
  .schema(getNotificationsSchema)
  .action(async ({ parsedInput: { projectId, limit }, ctx: { userId } }) => {
    const member = await getCurrentMember(projectId)

    const notifications = await prisma.notification.findMany({
      where: {
        projectId,
        recipientId: member.id,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return { notifications }
  })

/**
 * Lightweight unread count for SWR polling (30s interval).
 * T-02-32: Filtered by recipientId = current member.
 */
export const getUnreadCount = actionClient
  .schema(getUnreadCountSchema)
  .action(async ({ parsedInput: { projectId }, ctx: { userId } }) => {
    const member = await getCurrentMember(projectId)

    const count = await prisma.notification.count({
      where: {
        projectId,
        recipientId: member.id,
        isRead: false,
      },
    })

    return { count }
  })

/**
 * Mark a single notification as read.
 * T-02-31: Verifies notification.recipientId matches current user.
 */
export const markRead = actionClient
  .schema(markReadSchema)
  .action(async ({ parsedInput: { projectId, notificationId }, ctx: { userId } }) => {
    const member = await getCurrentMember(projectId)

    // Verify ownership before updating (T-02-31)
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification || notification.recipientId !== member.id) {
      throw new Error("Notification not found")
    }

    if (notification.isRead) {
      return { success: true }
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    return { success: true }
  })

/**
 * Mark all unread notifications for current user in project as read.
 * Non-destructive: notifications are not deleted (D-28).
 * T-02-31: Filtered by recipientId = current member.
 */
export const markAllRead = actionClient
  .schema(markAllReadSchema)
  .action(async ({ parsedInput: { projectId }, ctx: { userId } }) => {
    const member = await getCurrentMember(projectId)

    await prisma.notification.updateMany({
      where: {
        projectId,
        recipientId: member.id,
        isRead: false,
      },
      data: { isRead: true },
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  })
