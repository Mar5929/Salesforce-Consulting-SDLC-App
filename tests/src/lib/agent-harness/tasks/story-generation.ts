/**
 * Story Generation Task Definition (Layer 1)
 *
 * Defines the AI task for generating user story drafts from project
 * requirements, discovery context, and knowledge articles. Uses
 * AGENT_LOOP execution mode so the AI can call create_story_draft
 * multiple times for each proposed story.
 *
 * WORK-06: AI-assisted story generation
 */

import type { TaskDefinition, TaskInput, ProjectContext } from "../types"
import { getStoriesContext } from "../context/stories-context"
import { getProjectSummary } from "../context/project-summary"
import { createStoryDraftToolDefinition } from "../tools/create-story-draft"

/**
 * Context loader for story generation.
 * Loads project summary + story-specific context (requirements, questions,
 * decisions, knowledge articles, existing stories).
 *
 * Token budget: ~4000 for stories context + ~500 for project summary.
 */
async function storyGenerationContextLoader(
  input: TaskInput,
  projectId: string
): Promise<ProjectContext> {
  const epicId = input.metadata?.epicId as string | undefined
  if (!epicId) {
    return {
      projectSummary: await getProjectSummary(projectId),
      rawContext: "Error: epicId is required for story generation context.",
    }
  }

  const featureId = input.metadata?.featureId as string | undefined

  const [projectSummary, storiesContext] = await Promise.all([
    getProjectSummary(projectId),
    getStoriesContext({ projectId, epicId, featureId }),
  ])

  return {
    projectSummary,
    rawContext: storiesContext,
  }
}

export const storyGenerationTask: TaskDefinition = {
  taskType: "STORY_GENERATION",
  executionMode: "AGENT_LOOP",
  maxIterations: 15,
  maxRetries: 3,
  ambiguityMode: "INTERACTIVE",

  systemPromptTemplate: `You are an AI assistant helping a Salesforce consulting team generate user stories from project discovery context.

## Project Context
{{context}}

## Your Task
Analyze the provided requirements, questions, decisions, and knowledge articles. Generate user story drafts that cover the requirements not already addressed by existing stories.

## Story Generation Guidelines
- Each story should have a clear, concise title
- Include a persona (As a [role]...) when the user role is clear from context
- Write descriptions in user story format: "As a [persona], I want [goal] so that [benefit]"
- Write acceptance criteria in Given/When/Then format
- Estimate story points using Fibonacci scale: 1, 2, 3, 5, 8, 13
- Assign priority: CRITICAL for blockers, HIGH for core functionality, MEDIUM for standard work, LOW for nice-to-haves
- Identify impacted Salesforce components (objects, flows, triggers, classes, LWC, etc.) with CREATE/MODIFY/DELETE impact type
- Provide clear reasoning for why each story is needed based on the requirements and context

## Rules
- DO NOT generate duplicate stories -- carefully check the "Existing Stories" list above
- If a requirement is already fully covered by existing stories, skip it
- If a requirement is partially covered, generate stories only for the uncovered parts
- When unsure about scope or acceptance criteria, call the tool anyway but note the uncertainty in the reasoning field
- After proposing all drafts, provide a brief summary of what was generated and ask if the user wants more stories, modifications, or has specific areas to focus on

## Tool Usage
Call the \`create_story_draft\` tool for each proposed story. Do not describe stories in text -- use the tool so they appear as reviewable cards.`,

  contextLoader: storyGenerationContextLoader,

  tools: [createStoryDraftToolDefinition],

  outputValidator: (output: string) => {
    const hasContent = output.length > 0
    return {
      valid: hasContent,
      errors: hasContent
        ? []
        : ["No output text generated -- story generation may not have completed"],
    }
  },
}
