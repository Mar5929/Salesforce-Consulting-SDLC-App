/**
 * Stories Context Loader
 *
 * Loads scoped context for AI story generation. Assembles requirements,
 * answered questions, decisions, knowledge articles, and existing stories
 * for the given epic/feature scope.
 *
 * Token budget: 4000 tokens max for this context source.
 * Uses scopedPrisma for project isolation (T-02-06).
 */

import { scopedPrisma } from "@/lib/project-scope"
import { prisma } from "@/lib/db"

/** Truncate text to a maximum length, appending "..." if truncated */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

interface StoriesContextParams {
  projectId: string
  epicId: string
  featureId?: string | null
}

/**
 * Load story generation context for a given epic/feature scope.
 *
 * Loads:
 * 1. Requirements mapped to the epic (via RequirementEpic join)
 * 2. Answered questions scoped to the epic/feature
 * 3. Decisions scoped to the epic/feature (via DecisionScope join)
 * 4. Knowledge articles of type BUSINESS_PROCESS and DOMAIN_OVERVIEW (summary only)
 * 5. Existing stories for the epic/feature (to avoid duplicates)
 *
 * Returns formatted text block for prompt injection.
 */
export async function getStoriesContext(
  params: StoriesContextParams
): Promise<string> {
  const { projectId, epicId, featureId } = params
  const scoped = scopedPrisma(projectId)

  // Load epic name for context header
  const epic = await prisma.epic.findUnique({
    where: { id: epicId },
    select: { name: true, prefix: true },
  })

  const epicName = epic ? `${epic.prefix}: ${epic.name}` : epicId

  // Load all context in parallel
  const [requirements, answeredQuestions, decisions, articles, existingStories] =
    await Promise.all([
      // 1. Requirements mapped to this epic via RequirementEpic join
      prisma.requirementEpic.findMany({
        where: { epicId },
        select: {
          requirement: {
            select: {
              displayId: true,
              description: true,
              priority: true,
            },
          },
        },
      }),

      // 2. Answered questions scoped to the epic/feature
      scoped.question.findMany({
        where: {
          status: "ANSWERED",
          answerText: { not: null },
          ...(featureId
            ? { scopeFeatureId: featureId }
            : { scopeEpicId: epicId }),
        },
        select: {
          displayId: true,
          questionText: true,
          answerText: true,
        },
        take: 15,
        orderBy: { createdAt: "desc" },
      }),

      // 3. Decisions scoped to this epic/feature via DecisionScope join
      prisma.decisionScope.findMany({
        where: {
          ...(featureId
            ? { featureId }
            : { epicId }),
        },
        select: {
          decision: {
            select: {
              displayId: true,
              title: true,
              rationale: true,
            },
          },
        },
        take: 15,
      }),

      // 4. Knowledge articles (BUSINESS_PROCESS and DOMAIN_OVERVIEW only, summary)
      scoped.knowledgeArticle.findMany({
        where: {
          articleType: { in: ["BUSINESS_PROCESS", "DOMAIN_OVERVIEW"] },
        },
        select: {
          title: true,
          summary: true,
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      }),

      // 5. Existing stories for this epic/feature (to avoid duplicates)
      scoped.story.findMany({
        where: {
          epicId,
          ...(featureId ? { featureId } : {}),
        },
        select: {
          displayId: true,
          title: true,
        },
        orderBy: { sortOrder: "asc" },
      }),
    ])

  // Format as structured text block
  const sections: string[] = []

  // Requirements section
  if (requirements.length > 0) {
    const lines = requirements.map(
      (re) =>
        `- ${re.requirement.displayId}: ${truncateText(re.requirement.description, 200)} [Priority: ${re.requirement.priority}]`
    )
    sections.push(`## Requirements for ${epicName}\n${lines.join("\n")}`)
  } else {
    sections.push(`## Requirements for ${epicName}\nNo requirements mapped to this epic yet.`)
  }

  // Answered questions section
  if (answeredQuestions.length > 0) {
    const lines = answeredQuestions.map(
      (q) =>
        `- ${q.displayId}: ${truncateText(q.questionText, 150)} -> ${truncateText(q.answerText ?? "", 200)}`
    )
    sections.push(`## Answered Questions\n${lines.join("\n")}`)
  }

  // Decisions section
  if (decisions.length > 0) {
    const lines = decisions.map(
      (ds) =>
        `- ${ds.decision.displayId}: ${ds.decision.title} - ${truncateText(ds.decision.rationale, 200)}`
    )
    sections.push(`## Decisions\n${lines.join("\n")}`)
  }

  // Knowledge articles section (two-pass: summary only per KNOW-05)
  if (articles.length > 0) {
    const lines = articles.map(
      (a) => `- ${a.title}: ${truncateText(a.summary, 200)}`
    )
    sections.push(`## Knowledge Articles\n${lines.join("\n")}`)
  }

  // Existing stories section (for dedup)
  if (existingStories.length > 0) {
    const lines = existingStories.map((s) => `- ${s.displayId}: ${s.title}`)
    sections.push(`## Existing Stories (avoid duplicates)\n${lines.join("\n")}`)
  } else {
    sections.push(`## Existing Stories (avoid duplicates)\nNo stories created yet for this scope.`)
  }

  return sections.join("\n\n")
}
