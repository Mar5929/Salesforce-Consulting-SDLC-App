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
        }
        return query(args)
      },
    },
  })
}
