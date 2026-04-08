import type { ProjectRole } from "@/generated/prisma"
import { ROLE_PERMISSIONS } from "./types"

// Query (read) tools
import { queryStoriesTools } from "./read/query-stories"
import { queryEpicsTools } from "./read/query-epics"
import { queryFeaturesTools } from "./read/query-features"
import { queryQuestionsTools } from "./read/query-questions"
import { queryDecisionsTools } from "./read/query-decisions"
import { queryRequirementsTools } from "./read/query-requirements"
import { queryRisksTools } from "./read/query-risks"
import { querySprintsTools } from "./read/query-sprints"
import { queryDefectsTools } from "./read/query-defects"
import { queryKnowledgeTools } from "./read/query-knowledge"
import { queryOrgComponentsTools } from "./read/query-org-components"
import { queryBusinessProcessesTools } from "./read/query-business-processes"
import { queryDocumentsTools } from "./read/query-documents"
import { queryConversationsTools } from "./read/query-conversations"
import { queryTestCasesTools } from "./read/query-test-cases"

// Write tools
import { mutateStoriesTools } from "./write/mutate-stories"
import { mutateEpicsTools } from "./write/mutate-epics"
import { mutateFeaturesTools } from "./write/mutate-features"
import { mutateQuestionsTools } from "./write/mutate-questions"
import { mutateDecisionsTools } from "./write/mutate-decisions"
import { mutateRequirementsTools } from "./write/mutate-requirements"
import { mutateRisksTools } from "./write/mutate-risks"
import { mutateSprintsTools } from "./write/mutate-sprints"
import { mutateDefectsTools } from "./write/mutate-defects"
import { mutateTestCasesTools } from "./write/mutate-test-cases"

// Batch tools
import { batchStoriesTools } from "./batch/batch-stories"
import { batchQuestionsTools } from "./batch/batch-questions"

/**
 * Tool registry. Returns the set of Vercel AI SDK tool() definitions
 * appropriate for the given role. (D-08, D-10)
 */
export function buildToolsForRole(
  role: ProjectRole,
  projectId: string,
  memberId: string
): Record<string, unknown> {
  const perms = ROLE_PERMISSIONS[role]
  const tools: Record<string, unknown> = {}

  if (perms.read) {
    Object.assign(
      tools,
      queryStoriesTools(projectId),
      queryEpicsTools(projectId),
      queryFeaturesTools(projectId),
      queryQuestionsTools(projectId),
      queryDecisionsTools(projectId),
      queryRequirementsTools(projectId),
      queryRisksTools(projectId),
      querySprintsTools(projectId),
      queryDefectsTools(projectId),
      queryKnowledgeTools(projectId),
      queryOrgComponentsTools(projectId),
      queryBusinessProcessesTools(projectId),
      queryDocumentsTools(projectId),
      queryConversationsTools(projectId),
      queryTestCasesTools(projectId),
    )
  }

  if (perms.write) {
    // SA, PM, BA, DEVELOPER can write stories, epics, features
    if (["SOLUTION_ARCHITECT", "PM", "BA", "DEVELOPER"].includes(role)) {
      Object.assign(tools, mutateStoriesTools(projectId, memberId, role))
      Object.assign(tools, mutateEpicsTools(projectId, memberId))
      Object.assign(tools, mutateFeaturesTools(projectId, memberId))
    }
    // SA, PM, BA can write discovery entities
    if (["SOLUTION_ARCHITECT", "PM", "BA"].includes(role)) {
      Object.assign(tools, mutateQuestionsTools(projectId, memberId))
      Object.assign(tools, mutateDecisionsTools(projectId, memberId))
      Object.assign(tools, mutateRequirementsTools(projectId, memberId))
      Object.assign(tools, mutateRisksTools(projectId, memberId))
    }
    // PM only can manage sprints (T-11-10)
    if (role === "PM") {
      Object.assign(tools, mutateSprintsTools(projectId, memberId))
    }
    // All roles can work with defects
    Object.assign(tools, mutateDefectsTools(projectId, memberId))
    // SA, PM, QA can manage test cases
    if (["SOLUTION_ARCHITECT", "PM", "QA"].includes(role)) {
      Object.assign(tools, mutateTestCasesTools(projectId, memberId))
    }
  }

  // Delete tools — only SA and PM (Plan 04 adds these)
  if (perms.delete) {
    // Delete tools imported from src/lib/chat-tools/delete/ — added in Plan 04
  }

  if (perms.batch) {
    // Batch stories and questions: SA, PM, BA
    if (["SOLUTION_ARCHITECT", "PM", "BA"].includes(role)) {
      Object.assign(tools, batchStoriesTools(projectId, memberId, role))
      Object.assign(tools, batchQuestionsTools(projectId, memberId))
    }
  }

  return tools
}

export { buildAgenticSystemPrompt } from "./system-prompt"
export { logToolCall } from "./audit"
export { ROLE_PERMISSIONS } from "./types"
export type { ToolResult, ToolCategory } from "./types"
