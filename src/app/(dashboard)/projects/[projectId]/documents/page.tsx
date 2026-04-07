/**
 * Documents Page
 *
 * Server component that loads document templates and generated documents.
 * Renders template gallery and version history table.
 * Interactive behavior (dialog state, downloads) delegated to client wrapper.
 */

import { notFound } from "next/navigation"
import { getCurrentMember } from "@/lib/auth"
import { DOCUMENT_TEMPLATES } from "@/lib/documents/templates"
import { getDocuments } from "@/actions/documents"
import { DocumentsClient } from "./documents-client"

interface DocumentsPageProps {
  params: Promise<{ projectId: string }>
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { projectId } = await params

  // Auth check
  try {
    await getCurrentMember(projectId)
  } catch {
    notFound()
  }

  // Fetch generated documents
  const result = await getDocuments({ projectId })
  const documents = result?.data ?? []

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-foreground">Documents</h1>

      <DocumentsClient
        templates={DOCUMENT_TEMPLATES}
        documents={documents}
        projectId={projectId}
      />
    </div>
  )
}
