"use client"

/**
 * Document Preview
 *
 * Renders document preview based on format.
 * PDF: inline iframe preview. DOCX/PPTX: metadata card with download buttons.
 *
 * Threat mitigations:
 * - T-05-12: Presigned URLs have 5-minute TTL, generated server-side after membership check
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Presentation, FileSpreadsheet, Download } from "lucide-react"

export interface GeneratedDocumentDetail {
  id: string
  title: string
  documentType: string
  format: string
  createdAt: string | Date
  generatedBy: { displayName: string | null }
}

interface DocumentPreviewProps {
  document: GeneratedDocumentDetail
  downloadUrl: string
}

const FORMAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  DOCX: FileText,
  PDF: FileSpreadsheet,
  PPTX: Presentation,
}

const FORMAT_LABELS: Record<string, string> = {
  DOCX: "Word",
  PPTX: "PowerPoint",
  PDF: "PDF",
}

export function DocumentPreview({
  document,
  downloadUrl,
}: DocumentPreviewProps) {
  const Icon = FORMAT_ICONS[document.format] ?? FileText
  const formatLabel = FORMAT_LABELS[document.format] ?? document.format

  // PDF: render inline via iframe
  if (document.format === "PDF") {
    return (
      <div className="mx-auto max-w-[720px]">
        <iframe
          src={downloadUrl}
          className="w-full h-[800px] rounded-lg border"
          title={`Preview of ${document.title}`}
        />
        <div className="mt-4 flex justify-center">
          <Button
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
            onClick={() => window.open(downloadUrl, "_blank")}
          >
            <Download className="mr-2 h-4 w-4" />
            Download {formatLabel}
          </Button>
        </div>
      </div>
    )
  }

  // DOCX/PPTX: metadata card with download button (no inline preview in V1)
  return (
    <div className="mx-auto max-w-[720px]">
      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <Icon className="h-16 w-16 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-[18px] font-semibold">{document.title}</h3>
            <p className="text-[14px] text-muted-foreground">
              {formatLabel} document &middot;{" "}
              {document.format === "DOCX"
                ? "Microsoft Word format"
                : "Microsoft PowerPoint format"}
            </p>
            <p className="text-[13px] text-muted-foreground">
              Inline preview is not available for {formatLabel} files.
              Download to view the full document.
            </p>
          </div>
          <Button
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
            onClick={() => window.open(downloadUrl, "_blank")}
          >
            <Download className="mr-2 h-4 w-4" />
            Download {formatLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
