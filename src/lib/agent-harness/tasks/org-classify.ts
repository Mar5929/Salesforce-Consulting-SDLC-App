/**
 * Org Classification Task Definition (Layer 1)
 *
 * AI task for analyzing Salesforce org components and grouping them
 * into logical domain areas (e.g., "Sales Pipeline", "Case Management").
 *
 * ORG-04: Brownfield ingestion — Classify phase
 * Threat: T-04-13 (token cost) — batched max 50 per call, budget-capped
 */

import type { TaskDefinition, TaskInput, ProjectContext } from "../types"

/**
 * Context loader for org classification.
 * Components are passed in via input.metadata.components (already batched by caller).
 */
async function orgClassifyContextLoader(
  input: TaskInput,
  _projectId: string
): Promise<ProjectContext> {
  const components = input.metadata?.components as Array<{
    apiName: string
    label: string
    componentType: string
  }> | undefined

  if (!components || components.length === 0) {
    return {
      rawContext: "No components provided for classification.",
    }
  }

  // Group by type for the AI
  const grouped: Record<string, Array<{ apiName: string; label: string }>> = {}
  for (const c of components) {
    if (!grouped[c.componentType]) grouped[c.componentType] = []
    grouped[c.componentType].push({ apiName: c.apiName, label: c.label || c.apiName })
  }

  const contextLines: string[] = ["## Org Components to Classify\n"]
  for (const [type, items] of Object.entries(grouped)) {
    contextLines.push(`### ${type} (${items.length})`)
    for (const item of items) {
      contextLines.push(`- ${item.apiName} (${item.label})`)
    }
    contextLines.push("")
  }

  return {
    rawContext: contextLines.join("\n"),
  }
}

export const orgClassifyTask: TaskDefinition = {
  taskType: "ORG_QUERY",
  executionMode: "SINGLE_TURN",
  maxRetries: 3,
  ambiguityMode: "BACKGROUND",

  systemPromptTemplate: `You are a Salesforce consulting architect. Analyze these org components and group them into logical domain areas.

For each domain grouping, provide:
- name: A business-meaningful name (e.g., "Sales Pipeline", "Case Management", "Partner Portal")
- description: Brief explanation of what this domain covers
- componentApiNames: Array of component API names that belong to this domain
- confidence: Your confidence (0-100) that this grouping is correct

Focus on business meaning, not technical structure. A single component may appear in multiple domains if it serves multiple business purposes.

{{context}}

Respond with ONLY a valid JSON array. No markdown fences, no explanation text. Example format:
[{"name":"Sales Pipeline","description":"Core sales objects and automation","componentApiNames":["Account","Opportunity"],"confidence":85}]`,

  contextLoader: orgClassifyContextLoader,

  tools: [],

  outputValidator: (output: string) => {
    try {
      const parsed = JSON.parse(output)
      if (!Array.isArray(parsed)) {
        return { valid: false, errors: ["Output must be a JSON array"] }
      }
      for (const item of parsed) {
        if (!item.name || !Array.isArray(item.componentApiNames)) {
          return {
            valid: false,
            errors: ["Each grouping must have name and componentApiNames"],
          }
        }
      }
      return { valid: true, errors: [] }
    } catch {
      return { valid: false, errors: ["Output is not valid JSON"] }
    }
  },
}
