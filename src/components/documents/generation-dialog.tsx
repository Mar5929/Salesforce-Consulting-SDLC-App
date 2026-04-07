"use client"

/**
 * Generation Dialog
 *
 * Configuration dialog for document generation with section checkboxes,
 * scope selector, and format selection. Transitions to progress view
 * after generation starts.
 *
 * Stub: Will be fully implemented in Task 2.
 */

import type { DocumentTemplate } from "@/lib/documents/templates/types"

interface GenerationDialogProps {
  template: DocumentTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  epics: Array<{ id: string; title: string }>
}

export function GenerationDialog({
  template,
  open,
  onOpenChange,
  projectId,
  epics,
}: GenerationDialogProps) {
  // Stub -- fully implemented in Task 2
  return null
}
