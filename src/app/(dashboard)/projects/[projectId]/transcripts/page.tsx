import { getTranscripts } from "@/actions/transcripts"
import { UploadZone } from "@/components/transcripts/upload-zone"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { format } from "date-fns"
import { FileText } from "lucide-react"

interface TranscriptsPageProps {
  params: Promise<{ projectId: string }>
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  },
  COMPLETE: {
    label: "Complete",
    className: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
  },
  FAILED: {
    label: "Failed",
    className: "bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]",
  },
}

/**
 * Transcripts list page (D-07).
 * Server component that shows upload zone + list of past transcripts.
 */
export default async function TranscriptsPage({ params }: TranscriptsPageProps) {
  const { projectId } = await params

  const result = await getTranscripts({ projectId })
  const transcripts = result?.data ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-[24px] font-semibold text-foreground">Transcripts</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Upload meeting transcripts for AI extraction of questions, decisions, requirements, and risks.
        </p>
      </div>

      {/* Upload zone */}
      <UploadZone projectId={projectId} />

      {/* Past transcripts */}
      <div className="space-y-3">
        <h2 className="text-[16px] font-semibold text-foreground">
          Past Transcripts
        </h2>

        {transcripts.length === 0 ? (
          <EmptyState
            heading="No transcripts processed"
            description="Upload or paste a meeting transcript above to get started. The AI will extract questions, decisions, requirements, and risks."
          />
        ) : (
          <div className="space-y-2">
            {transcripts.map((transcript) => {
              const statusConfig = STATUS_BADGES[transcript.processingStatus] ?? STATUS_BADGES.PENDING

              return (
                <Link
                  key={transcript.id}
                  href={`/projects/${projectId}/transcripts/${transcript.id}`}
                >
                  <Card className="transition-colors hover:bg-[#FAFAFA]">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F0F0F0]">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-foreground">
                          {transcript.title ?? "Untitled Transcript"}
                        </p>
                        <p className="text-[13px] text-muted-foreground">
                          {format(new Date(transcript.uploadedAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={statusConfig.className}
                      >
                        {statusConfig.label}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
