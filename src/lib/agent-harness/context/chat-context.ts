/**
 * Context assembly for the general chat interface.
 *
 * Loads project-level context to ground AI responses.
 * Two modes:
 * - assembleGeneralChatContext + buildChatSystemPrompt: legacy lightweight context
 * - assembleEnhancedChatContext + buildSmartChatSystemPrompt: full 7-source context with search
 */

import { prisma } from "@/lib/db"
import { scopedPrisma } from "@/lib/project-scope"
import {
  assembleSmartChatContext,
  type SmartChatContext,
} from "./smart-retrieval"

export interface ChatContext {
  projectSummary: string
  openQuestions: Array<{ id: string; questionText: string; status: string }>
  recentDecisions: Array<{ id: string; title: string }>
}

/**
 * Assemble context for a general project chat session.
 * Provides the AI with project awareness for grounded responses.
 */
export async function assembleGeneralChatContext(
  projectId: string
): Promise<ChatContext> {
  const scoped = scopedPrisma(projectId)

  const [project, questions, decisions] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        name: true,
        clientName: true,
        engagementType: true,
        currentPhase: true,
      },
    }),
    scoped.question.findMany({
      where: { status: "OPEN" },
      select: { id: true, questionText: true, status: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    scoped.decision.findMany({
      select: { id: true, title: true },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
  ])

  const projectSummary = project
    ? [
        `Project: ${project.name}`,
        `Client: ${project.clientName}`,
        `Engagement Type: ${project.engagementType}`,
        `Current Phase: ${project.currentPhase}`,
      ].join("\n")
    : "Project details not available."

  return {
    projectSummary,
    openQuestions: questions,
    recentDecisions: decisions,
  }
}

/**
 * Build a system prompt from assembled chat context.
 */
export function buildChatSystemPrompt(context: ChatContext): string {
  const parts: string[] = [
    "You are an AI assistant for a Salesforce consulting project. You have deep knowledge of Salesforce products, implementation best practices, and this specific project's context.",
    "",
    "## Project Context",
    context.projectSummary,
  ]

  if (context.openQuestions.length > 0) {
    parts.push(
      "",
      "## Open Questions",
      ...context.openQuestions.map(
        (q) => `- [${q.status}] ${q.questionText}`
      )
    )
  }

  if (context.recentDecisions.length > 0) {
    parts.push(
      "",
      "## Recent Decisions",
      ...context.recentDecisions.map((d) => `- ${d.title}`)
    )
  }

  parts.push(
    "",
    "## Instructions",
    "- Answer questions about the project using the context provided above.",
    "- When you reference project decisions or questions, be specific.",
    "- If you don't have enough context to answer confidently, say so and suggest what information would help.",
    "- Be concise but thorough. Use Salesforce-specific terminology correctly.",
    "- Format responses with markdown for readability."
  )

  return parts.join("\n")
}

// ────────────────────────────────────────────
// Enhanced context (smart retrieval)
// ────────────────────────────────────────────

/**
 * Assemble enhanced context using all 7 project data sources + semantic search.
 * Replaces assembleGeneralChatContext for richer general chat responses.
 */
export async function assembleEnhancedChatContext(
  projectId: string,
  userQuery?: string
): Promise<SmartChatContext> {
  return assembleSmartChatContext(projectId, userQuery)
}

/**
 * Build system prompt from smart context with all data sources and search results.
 */
export function buildSmartChatSystemPrompt(context: SmartChatContext): string {
  const parts: string[] = [
    "You are an AI assistant for a Salesforce consulting project. You have deep knowledge of Salesforce products, implementation best practices, and this specific project's context.",
    "",
    "## Project Context",
    context.projectSummary,
  ]

  // Add all non-empty summary sections
  const summaryEntries = Object.entries(context.summaries) as [string, string][]
  for (const [, section] of summaryEntries) {
    if (section) {
      parts.push("", section)
    }
  }

  // Add search-relevant content
  if (context.relevantFullContent) {
    parts.push(
      "",
      "## Relevant Content (matched to your question)",
      context.relevantFullContent
    )
  }

  parts.push(
    "",
    "## Instructions",
    "- Answer questions about the project using ALL context provided above — stories, questions, decisions, knowledge articles, org components, and sprint data.",
    "- When you reference project items, use their display IDs (e.g., Q-001, D-003, S-012).",
    "- Draw connections between data sources — e.g., how an open question impacts a sprint story.",
    "- If you don't have enough context to answer confidently, say so and suggest what information would help.",
    "- Be concise but thorough. Use Salesforce-specific terminology correctly.",
    "- Format responses with markdown for readability."
  )

  return parts.join("\n")
}
