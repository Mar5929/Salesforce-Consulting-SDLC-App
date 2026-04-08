import type { ProjectRole } from "@/generated/prisma"
import { ROLE_PERMISSIONS } from "./types"

/**
 * Tool registry. Returns the set of Vercel AI SDK tool() definitions
 * appropriate for the given role. (D-08, D-10)
 *
 * Plans 02-04 add tool modules here as they are implemented.
 * The function signature is the stable contract for the chat route (Plan 05).
 */
export function buildToolsForRole(
  role: ProjectRole,
  projectId: string,
  memberId: string
): Record<string, unknown> {
  const perms = ROLE_PERMISSIONS[role]
  const tools: Record<string, unknown> = {}

  // Read tools — available to all roles (Plan 02 adds these)
  if (perms.read) {
    // Query tools imported from src/lib/chat-tools/read/ — added in Plan 02
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

  return tools
}

export { buildAgenticSystemPrompt } from "./system-prompt"
export { logToolCall } from "./audit"
export { ROLE_PERMISSIONS } from "./types"
export type { ToolResult, ToolCategory } from "./types"
