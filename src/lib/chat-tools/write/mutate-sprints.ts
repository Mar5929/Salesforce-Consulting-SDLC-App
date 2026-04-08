import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"

export function mutateSprintsTools(projectId: string, memberId: string) {
  const scoped = scopedPrisma(projectId)
  void memberId

  return {
    create_sprint: tool({
      description: "Create a new sprint. Returns the created sprint summary.",
      inputSchema: z.object({
        name: z.string().min(1).max(200),
        startDate: z.string().describe("ISO 8601 date string (e.g. 2026-05-01)"),
        endDate: z.string().describe("ISO 8601 date string (e.g. 2026-05-14)"),
        goal: z.string().optional(),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const start = new Date(s.startDate)
          const end = new Date(s.endDate)
          if (isNaN(start.getTime())) return { success: false, error: "Invalid startDate" }
          if (isNaN(end.getTime())) return { success: false, error: "Invalid endDate" }
          if (end <= start) return { success: false, error: "endDate must be after startDate" }
          const sprint = await scoped.sprint.create({
            data: {
              projectId,
              name: s.name,
              startDate: start,
              endDate: end,
              goal: s.goal,
              status: "PLANNING",
            },
            select: { id: true, name: true, startDate: true, endDate: true, status: true },
          })
          return { success: true, sprint }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Create failed" }
        }
      },
    }),

    update_sprint: tool({
      description: "Update fields on an existing sprint. Only provide fields to change.",
      inputSchema: z.object({
        sprintId: z.string(),
        name: z.string().min(1).max(200).optional(),
        startDate: z.string().optional().describe("ISO 8601 date string"),
        endDate: z.string().optional().describe("ISO 8601 date string"),
        goal: z.string().optional(),
        status: z.enum(["PLANNING", "ACTIVE", "COMPLETE"]).optional(),
      }),
      execute: async (input) => {
        try {
          const s = sanitizeToolInput(input)
          const existing = await scoped.sprint.findUnique({
            where: { id: s.sprintId },
            select: { id: true },
          })
          if (!existing) return { success: false, error: "Sprint not found" }
          const { sprintId, startDate, endDate, ...rest } = s
          const parsedStart = startDate ? new Date(startDate) : undefined
          const parsedEnd = endDate ? new Date(endDate) : undefined
          if (parsedStart && isNaN(parsedStart.getTime())) return { success: false, error: "Invalid startDate" }
          if (parsedEnd && isNaN(parsedEnd.getTime())) return { success: false, error: "Invalid endDate" }
          const sprint = await scoped.sprint.update({
            where: { id: sprintId },
            data: {
              ...(parsedStart && { startDate: parsedStart }),
              ...(parsedEnd && { endDate: parsedEnd }),
              ...(rest.name !== undefined && { name: rest.name }),
              ...(rest.goal !== undefined && { goal: rest.goal }),
              ...(rest.status !== undefined && { status: rest.status }),
            },
            select: { id: true, name: true, startDate: true, endDate: true, status: true },
          })
          return { success: true, sprint }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Update failed" }
        }
      },
    }),
  }
}
