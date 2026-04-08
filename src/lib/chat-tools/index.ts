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

  // Write tools — gated by role (Plan 03 adds these)
  if (perms.write) {
    // Mutate tools imported from src/lib/chat-tools/write/ — added in Plan 03
  }

  // Delete tools — only SA and PM (Plan 04 adds these)
  if (perms.delete) {
    // Delete tools imported from src/lib/chat-tools/delete/ — added in Plan 04
  }

  // Batch tools — SA, PM, BA (Plan 03 batch variants)
  if (perms.batch) {
    // Batch tools imported from src/lib/chat-tools/batch/ — added in Plan 03
  }

  void memberId // will be used by write/delete tools in Plans 03-04

  return tools
}

export { buildAgenticSystemPrompt } from "./system-prompt"
export { logToolCall } from "./audit"
export { ROLE_PERMISSIONS } from "./types"
export type { ToolResult, ToolCategory } from "./types"
