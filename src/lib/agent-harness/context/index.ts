/**
 * Context Assembly (Layer 3) — Barrel Export and assembleContext
 *
 * Combines multiple context loaders within a total token budget.
 * Simple token estimation: 1 token ~= 4 characters (conservative).
 *
 * Token budget cap prevents loading excessive data (T-02-08).
 */

// Re-export all context loaders
export { getProjectSummary } from "./project-summary"
export { getOpenQuestions, getQuestionContext } from "./questions"
export type { QuestionSummary, QuestionContextResult } from "./questions"
export { getRecentDecisions } from "./decisions"
export type { DecisionSummary } from "./decisions"
export { getArticleSummaries, getRelevantArticles } from "./article-summaries"
export type { ArticleSummary, ArticleFull } from "./article-summaries"
export { getBlockingRelationships } from "./blocking-relationships"
export type { BlockingRelationship } from "./blocking-relationships"
export { getEpicsAndFeatures } from "./epics-features"
export type { EpicOrFeature } from "./epics-features"

/**
 * A context loader produces a string section for AI prompt injection.
 */
export interface ContextLoader {
  /** Name for logging/debugging */
  name: string
  /** Load context and return formatted string */
  load: (projectId: string) => Promise<string>
}

/** Convert character count to estimated token count (1 token ~= 4 chars) */
function charsToTokens(chars: number): number {
  return Math.ceil(chars / 4)
}

/** Convert token count to character limit */
function tokensToChars(tokens: number): number {
  return tokens * 4
}

/**
 * Assemble context from multiple loaders, respecting a total token budget.
 *
 * Runs all loaders in parallel, concatenates results, and truncates
 * to the token budget if the combined output exceeds it.
 */
export async function assembleContext(
  loaders: ContextLoader[],
  projectId: string,
  tokenBudget: number
): Promise<string> {
  // Run all loaders in parallel
  const results = await Promise.all(
    loaders.map(async (loader) => {
      try {
        const content = await loader.load(projectId)
        return { name: loader.name, content }
      } catch (error) {
        // Gracefully handle loader failures — log and continue
        const message = error instanceof Error ? error.message : String(error)
        return { name: loader.name, content: `[${loader.name}: load failed - ${message}]` }
      }
    })
  )

  // Concatenate all results with section headers
  const sections = results
    .filter((r) => r.content.length > 0)
    .map((r) => `--- ${r.name} ---\n${r.content}`)

  let combined = sections.join("\n\n")

  // Truncate to token budget
  const charLimit = tokensToChars(tokenBudget)
  if (combined.length > charLimit) {
    combined = combined.slice(0, charLimit) + "\n\n[Context truncated to fit token budget]"
  }

  return combined
}
