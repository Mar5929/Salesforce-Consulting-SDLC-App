/**
 * Org Synthesis Task Definition (Layer 1)
 *
 * AI task for identifying business processes within a domain grouping
 * and mapping each component's role in those processes.
 *
 * ORG-04: Brownfield ingestion — Synthesize+Articulate phase
 */

import type { TaskDefinition, TaskInput, ProjectContext } from "../types"

/**
 * Context loader for org synthesis.
 * Domain grouping and its components are passed in via input.metadata.
 */
async function orgSynthesizeContextLoader(
  input: TaskInput,
  _projectId: string
): Promise<ProjectContext> {
  const domainGrouping = input.metadata?.domainGrouping as {
    name: string
    description: string
    components: Array<{ apiName: string; label: string; componentType: string }>
  } | undefined

  if (!domainGrouping) {
    return {
      rawContext: "No domain grouping provided for synthesis.",
    }
  }

  const contextLines: string[] = [
    `## Domain Grouping: ${domainGrouping.name}`,
    "",
    domainGrouping.description || "No description provided.",
    "",
    "### Components in this Domain",
    "",
  ]

  for (const c of domainGrouping.components) {
    contextLines.push(`- **${c.apiName}** (${c.label || c.apiName}) — Type: ${c.componentType}`)
  }

  return {
    rawContext: contextLines.join("\n"),
  }
}

export const orgSynthesizeTask: TaskDefinition = {
  taskType: "ORG_QUERY",
  executionMode: "SINGLE_TURN",
  maxRetries: 3,
  ambiguityMode: "BACKGROUND",

  systemPromptTemplate: `You are a Salesforce consulting architect. For the given domain grouping and its components, identify the business processes they support.

For each business process, provide:
- name: A clear business process name (e.g., "Lead to Opportunity Conversion", "Case Escalation")
- description: What this process does in business terms
- complexity: "LOW", "MEDIUM", or "HIGH" based on number of components and automation involved
- components: Array of objects with { apiName, role, isRequired } where role describes the component's function (e.g., "primary data store", "automation trigger", "validation enforcement")
- dependsOn: Array of other process names this process depends on (from this same domain)

{{context}}

Respond with ONLY a valid JSON array. No markdown fences, no explanation text. Example format:
[{"name":"Lead to Opportunity","description":"Sales conversion process","complexity":"MEDIUM","components":[{"apiName":"Account","role":"primary data store","isRequired":true}],"dependsOn":[]}]`,

  contextLoader: orgSynthesizeContextLoader,

  tools: [],

  outputValidator: (output: string) => {
    try {
      const parsed = JSON.parse(output)
      if (!Array.isArray(parsed)) {
        return { valid: false, errors: ["Output must be a JSON array"] }
      }
      for (const item of parsed) {
        if (!item.name || !Array.isArray(item.components)) {
          return {
            valid: false,
            errors: ["Each process must have name and components"],
          }
        }
      }
      return { valid: true, errors: [] }
    } catch {
      return { valid: false, errors: ["Output is not valid JSON"] }
    }
  },
}
