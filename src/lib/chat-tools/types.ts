import type { ProjectRole } from "@/generated/prisma"

/**
 * Standardized tool result shape for all chat tools.
 * Execute handlers return this — never throw. (D-14)
 */
export type ToolResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export type ToolCategory = "read" | "write" | "delete" | "batch"

/**
 * Role permission map for tool gating. (D-08, D-09)
 * Matches web app permissions from server action role checks.
 */
export const ROLE_PERMISSIONS = {
  SOLUTION_ARCHITECT: { read: true, write: true, delete: true, batch: true },
  PM:                 { read: true, write: true, delete: true, batch: true },
  BA:                 { read: true, write: true, delete: false, batch: true },
  DEVELOPER:          { read: true, write: true, delete: false, batch: false },
  QA:                 { read: true, write: true, delete: false, batch: false },
} satisfies Record<ProjectRole, Record<ToolCategory, boolean>>
