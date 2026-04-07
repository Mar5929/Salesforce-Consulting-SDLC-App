import { prisma } from "./db"

export const MODELS_WITH_PROJECT_ID = [
  "Project",
  "ProjectMember",
  "Epic",
  "Feature",
  "Story",
  "Question",
  "Decision",
  "Requirement",
  "Risk",
  "Milestone",
  "Sprint",
  "Transcript",
  "SessionLog",
  "GeneratedDocument",
  "Attachment",
  "Notification",
  "Conversation",
  "OrgComponent",
  "DomainGrouping",
  "BusinessProcess",
  "KnowledgeArticle",
  "Defect",
  "StoryComponent",
] as const

/**
 * Returns a Prisma client scoped to a specific project.
 * Automatically injects `projectId` into:
 * - `where` clauses (for read/update/delete operations)
 * - `data` objects (for create/upsert operations)
 *
 * This ensures all queries through this client are isolated to the given project.
 */
export function scopedPrisma(projectId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ args, query, model }) {
        if (
          model &&
          MODELS_WITH_PROJECT_ID.includes(model as (typeof MODELS_WITH_PROJECT_ID)[number])
        ) {
          if ("where" in args) {
            args.where = { ...args.where, projectId }
          }
          // Enforce projectId on create/upsert data
          if ("data" in args && args.data && typeof args.data === "object" && !Array.isArray(args.data)) {
            (args.data as Record<string, unknown>).projectId = projectId
          }
        }
        return query(args)
      },
    },
  })
}
