import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryKnowledgeTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_articles: tool({
      description: "Search for knowledge articles. Returns summary fields. Use get_article for full details.",
      inputSchema: z.object({
        articleType: z.enum(["BUSINESS_PROCESS", "INTEGRATION", "ARCHITECTURE_DECISION", "DOMAIN_OVERVIEW", "CROSS_CUTTING_CONCERN", "STAKEHOLDER_CONTEXT"]).optional(),
        isStale: z.boolean().optional().describe("Filter by stale status"),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ articleType, isStale, limit }) => {
        try {
          const articles = await scoped.knowledgeArticle.findMany({
            where: {
              ...(articleType && { articleType }),
              ...(isStale !== undefined && { isStale }),
            },
            select: {
              id: true,
              title: true,
              articleType: true,
              isStale: true,
              createdAt: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: articles.length, articles }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_article: tool({
      description: "Get full details of a single knowledge article by ID.",
      inputSchema: z.object({
        articleId: z.string().describe("The knowledge article ID"),
      }),
      execute: async ({ articleId }) => {
        try {
          const article = await scoped.knowledgeArticle.findUnique({
            where: { id: articleId },
          })
          if (!article) return { success: false, error: "Knowledge article not found" }
          return { success: true, article }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
