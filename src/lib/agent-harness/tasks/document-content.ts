/**
 * Document Content Generation Task Definition (Layer 1)
 *
 * Defines the AI task for generating professional consulting document
 * content for each section based on assembled project context.
 * Uses SINGLE_TURN execution mode -- pure text generation, no tools.
 * Runs in BACKGROUND mode (triggered by Inngest).
 *
 * DOC-01, DOC-02: AI generates content from project knowledge base
 */

import type { TaskDefinition, TaskInput, ProjectContext } from "../types"
import { getProjectSummary } from "../context/project-summary"
import { prisma } from "@/lib/db"
import { getTemplate } from "@/lib/documents/templates"
import type { TemplateSection } from "@/lib/documents/templates"
import { executeTask } from "../engine"

/**
 * Assemble context string for a given contextQuery.
 * Each query type pulls relevant project data and formats it as text.
 */
async function assembleContextForQuery(
  projectId: string,
  contextQuery: string
): Promise<string> {
  switch (contextQuery) {
    case "project-overview": {
      return getProjectSummary(projectId)
    }

    case "project-scope": {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          name: true,
          clientName: true,
          engagementType: true,
          currentPhase: true,
        },
      })
      return project
        ? `Project: ${project.name}\nClient: ${project.clientName}\nType: ${project.engagementType}\nPhase: ${project.currentPhase}`
        : "Project not found"
    }

    case "business-processes": {
      const processes = await prisma.businessProcess.findMany({
        where: { projectId },
        select: { name: true, description: true, status: true },
        take: 50,
      })
      if (processes.length === 0) return "No business processes documented."
      return processes
        .map(
          (p) =>
            `[${p.status}] ${p.name}: ${p.description || "No description"}`
        )
        .join("\n")
    }

    case "requirements-by-epic": {
      const epics = await prisma.epic.findMany({
        where: { projectId },
        select: {
          prefix: true,
          name: true,
          stories: {
            select: {
              displayId: true,
              title: true,
              acceptanceCriteria: true,
            },
            take: 20,
          },
        },
        take: 20,
      })
      if (epics.length === 0) return "No epics or requirements found."
      return epics
        .map(
          (e) =>
            `Epic ${e.prefix}: ${e.name}\n` +
            e.stories
              .map(
                (s) =>
                  `  - ${s.displayId}: ${s.title}\n    AC: ${s.acceptanceCriteria || "None"}`
              )
              .join("\n")
        )
        .join("\n\n")
    }

    case "questions-decisions": {
      const [questions, decisions] = await Promise.all([
        prisma.question.findMany({
          where: { projectId },
          select: {
            displayId: true,
            questionText: true,
            status: true,
            answerText: true,
          },
          take: 50,
        }),
        prisma.decision.findMany({
          where: { projectId },
          select: {
            displayId: true,
            title: true,
            rationale: true,
            decisionDate: true,
          },
          take: 50,
        }),
      ])
      const qText =
        questions.length > 0
          ? "Questions:\n" +
            questions
              .map(
                (q) =>
                  `- ${q.displayId} [${q.status}]: ${q.questionText}${q.answerText ? `\n  Answer: ${q.answerText.substring(0, 200)}` : ""}`
              )
              .join("\n")
          : "No questions recorded."
      const dText =
        decisions.length > 0
          ? "Decisions:\n" +
            decisions
              .map(
                (d) =>
                  `- ${d.displayId}: ${d.title}\n  Rationale: ${d.rationale || "Pending"}`
              )
              .join("\n")
          : "No decisions recorded."
      return `${qText}\n\n${dText}`
    }

    case "risks": {
      const risks = await prisma.risk.findMany({
        where: { projectId },
        select: {
          displayId: true,
          description: true,
          severity: true,
          status: true,
          mitigationStrategy: true,
        },
        take: 30,
      })
      if (risks.length === 0) return "No risks identified."
      return risks
        .map(
          (r) =>
            `- ${r.displayId} [${r.severity}/${r.status}]: ${r.description}\n  Mitigation: ${r.mitigationStrategy || "None"}`
        )
        .join("\n")
    }

    case "stories-by-epic": {
      const epics = await prisma.epic.findMany({
        where: { projectId },
        select: {
          prefix: true,
          name: true,
          features: {
            select: {
              prefix: true,
              name: true,
              stories: {
                select: {
                  displayId: true,
                  title: true,
                  acceptanceCriteria: true,
                  storyPoints: true,
                  status: true,
                },
                take: 30,
              },
            },
            take: 20,
          },
        },
        take: 20,
      })
      if (epics.length === 0) return "No epics found."
      return epics
        .map(
          (e) =>
            `Epic ${e.prefix}: ${e.name}\n` +
            e.features
              .map(
                (f) =>
                  `  Feature ${f.prefix}: ${f.name}\n` +
                  f.stories
                    .map(
                      (s) =>
                        `    - ${s.displayId} [${s.status}]: ${s.title} (${s.storyPoints ?? "?"} pts)\n      AC: ${s.acceptanceCriteria || "None"}`
                    )
                    .join("\n")
              )
              .join("\n")
        )
        .join("\n\n")
    }

    case "story-components": {
      const components = await prisma.storyComponent.findMany({
        where: { projectId },
        include: {
          orgComponent: {
            select: { apiName: true, componentType: true },
          },
          story: { select: { displayId: true, title: true } },
        },
        take: 100,
      })
      if (components.length === 0) return "No Salesforce components mapped."
      const grouped = new Map<
        string,
        Array<{
          componentName: string | null
          impactType: string
          orgApiName: string | null
          orgType: string | null
        }>
      >()
      for (const c of components) {
        const key = `${c.story.displayId}: ${c.story.title}`
        const existing = grouped.get(key) ?? []
        existing.push({
          componentName: c.componentName,
          impactType: c.impactType,
          orgApiName: c.orgComponent?.apiName ?? null,
          orgType: c.orgComponent?.componentType ?? null,
        })
        grouped.set(key, existing)
      }
      return Array.from(grouped.entries())
        .map(
          ([story, comps]) =>
            `${story}\n` +
            comps
              .map(
                (c) =>
                  `  - [${c.impactType}] ${c.orgApiName ?? c.componentName ?? "Unknown"} (${c.orgType ?? "custom"})`
              )
              .join("\n")
        )
        .join("\n\n")
    }

    case "dependencies": {
      // Story dependencies are stored as text in story.dependencies field
      const stories = await prisma.story.findMany({
        where: {
          epicId: { in: (await prisma.epic.findMany({ where: { projectId }, select: { id: true } })).map((e) => e.id) },
          dependencies: { not: null },
        },
        select: { displayId: true, title: true, dependencies: true },
        take: 50,
      })
      if (stories.length === 0) return "No dependencies recorded."
      return stories
        .map(
          (s) =>
            `- ${s.displayId}: ${s.title}\n  Dependencies: ${s.dependencies}`
        )
        .join("\n")
    }

    case "sprint-overview": {
      const sprint = await prisma.sprint.findFirst({
        where: { projectId },
        orderBy: { startDate: "desc" },
        select: {
          name: true,
          startDate: true,
          endDate: true,
          status: true,
          _count: { select: { stories: true } },
        },
      })
      if (!sprint) return "No sprints found."
      return `Sprint: ${sprint.name}\nStatus: ${sprint.status}\nStart: ${sprint.startDate.toISOString().split("T")[0]}\nEnd: ${sprint.endDate.toISOString().split("T")[0]}\nStories: ${sprint._count.stories}`
    }

    case "sprint-completed": {
      const sprint = await prisma.sprint.findFirst({
        where: { projectId },
        orderBy: { startDate: "desc" },
        select: { id: true },
      })
      if (!sprint) return "No sprints found."
      const completed = await prisma.story.findMany({
        where: { sprintId: sprint.id, status: "DONE" },
        select: {
          displayId: true,
          title: true,
          storyPoints: true,
        },
        take: 50,
      })
      if (completed.length === 0)
        return "No stories completed in current sprint."
      const totalPoints = completed.reduce(
        (sum, s) => sum + (s.storyPoints ?? 0),
        0
      )
      return (
        `Completed Stories (${completed.length}, ${totalPoints} pts total):\n` +
        completed
          .map(
            (s) =>
              `- ${s.displayId}: ${s.title} (${s.storyPoints ?? 0} pts)`
          )
          .join("\n")
      )
    }

    case "blockers-risks": {
      const risks = await prisma.risk.findMany({
        where: { projectId, status: { in: ["OPEN", "MITIGATED"] } },
        select: { displayId: true, description: true, severity: true },
        take: 20,
      })
      return risks.length > 0
        ? "Active Risks:\n" +
            risks
              .map(
                (r) => `- ${r.displayId} [${r.severity}]: ${r.description}`
              )
              .join("\n")
        : "No active blockers or risks."
    }

    case "progress-update": {
      const statusCounts = await prisma.story.groupBy({
        by: ["status"],
        where: { epic: { projectId } },
        _count: true,
      })
      if (statusCounts.length === 0) return "No stories found."
      return (
        "Story Status Summary:\n" +
        statusCounts
          .map((s) => `- ${s.status}: ${s._count}`)
          .join("\n")
      )
    }

    case "risks-actions": {
      const highRisks = await prisma.risk.findMany({
        where: {
          projectId,
          severity: { in: ["CRITICAL", "HIGH"] },
          status: { in: ["OPEN", "MITIGATED"] },
        },
        select: {
          displayId: true,
          description: true,
          severity: true,
          mitigationStrategy: true,
        },
        take: 15,
      })
      if (highRisks.length === 0) return "No high/critical risks."
      return highRisks
        .map(
          (r) =>
            `- ${r.displayId} [${r.severity}]: ${r.description}\n  Action: ${r.mitigationStrategy || "No mitigation plan"}`
        )
        .join("\n")
    }

    default:
      return `No context available for query: ${contextQuery}`
  }
}

/**
 * Context loader for document content generation.
 * Assembles context from the template's section contextQuery values.
 */
async function documentContentContextLoader(
  input: TaskInput,
  projectId: string
): Promise<ProjectContext> {
  const templateId = input.metadata?.templateId as string
  const sectionIds = input.metadata?.sectionIds as string[] | undefined
  const template = getTemplate(templateId)

  if (!template) {
    return {
      projectSummary: await getProjectSummary(projectId),
      rawContext: `Error: Template "${templateId}" not found.`,
    }
  }

  // Filter to requested sections, or use all
  const sections = sectionIds
    ? template.sections.filter((s: TemplateSection) =>
        sectionIds.includes(s.id)
      )
    : template.sections

  const contextParts = await Promise.all(
    sections.map(async (section: TemplateSection) => {
      const data = await assembleContextForQuery(
        projectId,
        section.contextQuery
      )
      return `## ${section.label}\n${section.description}\n\n${data}`
    })
  )

  return {
    projectSummary: await getProjectSummary(projectId),
    rawContext: contextParts.join("\n\n---\n\n"),
  }
}

/**
 * Document content generation task definition.
 * Instructs AI to generate professional consulting document content
 * for each section based on the assembled project context.
 */
export const documentContentTask: TaskDefinition = {
  taskType: "DOCUMENT_GENERATION",
  systemPromptTemplate: `You are a professional Salesforce consulting document writer. Generate polished, business-ready document content based on the provided project context.

Instructions:
- Write in a professional consulting tone
- Use clear, concise language appropriate for executive and technical audiences
- Structure each section with proper headings and paragraphs
- Include specific data points and metrics from the context when available
- Do not fabricate data -- use only what is provided in the context
- Format output as JSON with this structure: { "title": "Document Title", "sections": [{ "heading": "Section Name", "body": "Section content..." }] }

{{context}}`,
  contextLoader: documentContentContextLoader,
  tools: [],
  executionMode: "SINGLE_TURN",
  ambiguityMode: "BACKGROUND",
  model: "claude-sonnet-4-20250514",
}

/**
 * Execute document content generation.
 * Assembles project context per section, calls the agent harness,
 * and returns structured content for rendering.
 */
export async function executeDocumentContentTask(
  projectId: string,
  templateId: string,
  sectionIds: string[],
  userId: string
): Promise<{
  title: string
  sections: Array<{ heading: string; body: string }>
}> {
  const template = getTemplate(templateId)
  if (!template) {
    throw new Error(`Template "${templateId}" not found`)
  }

  const result = await executeTask(
    documentContentTask,
    {
      userMessage: `Generate content for the "${template.name}" document. Include sections: ${sectionIds.join(", ")}.`,
      metadata: { templateId, sectionIds },
    },
    projectId,
    userId
  )

  // Parse the JSON output from the AI
  try {
    const parsed = JSON.parse(result.output)
    return {
      title: parsed.title || template.name,
      sections: parsed.sections || [],
    }
  } catch {
    // Fallback: if AI didn't return valid JSON, wrap the raw output
    return {
      title: template.name,
      sections: [{ heading: template.name, body: result.output }],
    }
  }
}
