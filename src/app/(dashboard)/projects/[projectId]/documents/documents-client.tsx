"use client"

/**
 * Documents Client Wrapper
 *
 * Client component that manages generation dialog state,
 * template gallery interactions, and document downloads.
 */

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { useAction } from "next-safe-action/hooks"
import { getDocumentDownloadUrl } from "@/actions/documents"
import type { DocumentTemplate } from "@/lib/documents/templates/types"
import { TemplateGallery } from "@/components/documents/template-gallery"
import {
  VersionHistoryTable,
  type GeneratedDocumentRow,
} from "@/components/documents/version-history-table"
import { GenerationDialog } from "@/components/documents/generation-dialog"
import { Separator } from "@/components/ui/separator"

interface DocumentsClientProps {
  templates: DocumentTemplate[]
  documents: GeneratedDocumentRow[]
  projectId: string
}

export function DocumentsClient({
  templates,
  documents,
  projectId,
}: DocumentsClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplate | null>(null)

  const { execute: fetchDownloadUrl } = useAction(getDocumentDownloadUrl, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.open(data.url, "_blank")
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to get download URL")
    },
  })

  const handleGenerate = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId)
      if (template) {
        setSelectedTemplate(template)
        setDialogOpen(true)
      }
    },
    [templates]
  )

  const handleDownload = useCallback(
    (documentId: string) => {
      fetchDownloadUrl({ documentId })
    },
    [fetchDownloadUrl]
  )

  return (
    <>
      <div className="mt-6">
        <h2 className="text-[18px] font-semibold text-foreground mb-4">
          Templates
        </h2>
        <TemplateGallery templates={templates} onGenerate={handleGenerate} />
      </div>

      <Separator className="my-8" />

      <div>
        <h2 className="text-[18px] font-semibold text-foreground mb-4">
          Generated Documents
        </h2>
        <VersionHistoryTable
          documents={documents}
          projectId={projectId}
          onDownload={handleDownload}
        />
      </div>

      <GenerationDialog
        template={selectedTemplate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        epics={[]}
      />
    </>
  )
}
