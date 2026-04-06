/**
 * Sprint Intelligence Task Definition (Layer 1)
 *
 * Defines the AI task for sprint conflict analysis:
 * - Analyzes component overlaps between stories in a sprint
 * - Assesses conflict severity (HIGH/MEDIUM/LOW)
 * - Suggests dependency ordering for execution
 *
 * Output-only analysis task (no tools). Uses SINGLE_TURN mode
 * with BACKGROUND ambiguity handling (runs in Inngest).
 *
 * Per Pitfall 5: Context limited to 2000 tokens.
 * Per D-15, D-19: Sprint intelligence is advisory only (D-17).
 */

import type { TaskDefinition } from "../types"

export const sprintIntelligenceTask: TaskDefinition = {
  taskType: "SPRINT_ANALYSIS",

  systemPromptTemplate: `You are a sprint planning advisor for a Salesforce project. Your job is to analyze component overlaps between user stories in a sprint and provide actionable intelligence.

For each component overlap, assess severity:
- HIGH: Two stories both MODIFY the same component, or one CREATEs and another DELETEs
- MEDIUM: Two stories both CREATE on the same component (potential naming conflicts)
- LOW: One MODIFIES and one CREATEs the same component (likely compatible)

Then suggest an execution ordering for ALL stories based on component relationships. Stories that CREATE components should come before stories that MODIFY them. Stories with no overlaps can be parallelized.

Output valid JSON only. No markdown, no explanation outside the JSON structure.

{{context}}`,

  contextLoader: async () => {
    // Context is injected directly by the Inngest function, not via standard loader
    return { rawContext: "" }
  },

  tools: [],

  outputValidator: (output: string) => {
    try {
      const parsed = JSON.parse(output)
      const errors: string[] = []
      if (!Array.isArray(parsed.conflicts)) {
        errors.push("Missing or invalid 'conflicts' array")
      }
      if (!Array.isArray(parsed.dependencies)) {
        errors.push("Missing or invalid 'dependencies' array")
      }
      return { valid: errors.length === 0, errors }
    } catch {
      return { valid: false, errors: ["Output is not valid JSON"] }
    }
  },

  executionMode: "SINGLE_TURN",
  maxRetries: 2,
  ambiguityMode: "BACKGROUND",
  model: "claude-sonnet-4-20250514",
}
