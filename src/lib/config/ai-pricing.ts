/**
 * AI Model Pricing Configuration
 *
 * Per-token costs for Claude models used in the agent harness.
 * Prices in USD per token.
 * Source: Anthropic pricing page (as of 2025)
 */

export interface ModelPricing {
  inputPerToken: number
  outputPerToken: number
}

/**
 * Pricing for all supported Claude models.
 * Model names match the Anthropic SDK model parameter format.
 */
export const AI_PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-4-20250514": {
    inputPerToken: 3 / 1_000_000, // $3 per 1M input tokens
    outputPerToken: 15 / 1_000_000, // $15 per 1M output tokens
  },
  "claude-opus-4-20250514": {
    inputPerToken: 15 / 1_000_000, // $15 per 1M input tokens
    outputPerToken: 75 / 1_000_000, // $75 per 1M output tokens
  },
  "claude-haiku-3-5-20241022": {
    inputPerToken: 0.8 / 1_000_000, // $0.80 per 1M input tokens
    outputPerToken: 4 / 1_000_000, // $4 per 1M output tokens
  },
} as const

/** Default model used when none specified in TaskDefinition */
export const DEFAULT_MODEL = "claude-sonnet-4-20250514"

/**
 * Calculate the cost of an AI API call in USD.
 *
 * @param model - The Claude model name
 * @param inputTokens - Number of input tokens consumed
 * @param outputTokens - Number of output tokens generated
 * @returns Cost in USD
 * @throws Error if model is not found in pricing table
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = AI_PRICING[model]
  if (!pricing) {
    throw new Error(`Unknown model for pricing: ${model}. Known models: ${Object.keys(AI_PRICING).join(", ")}`)
  }
  return inputTokens * pricing.inputPerToken + outputTokens * pricing.outputPerToken
}
