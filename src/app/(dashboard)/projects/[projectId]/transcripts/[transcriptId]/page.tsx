import { getTranscript } from "@/actions/transcripts"
import { TranscriptSessionClient } from "./transcript-session-client"

interface TranscriptDetailPageProps {
  params: Promise<{ projectId: string; transcriptId: string }>
}

/**
 * Transcript detail page (D-08).
 * Server component that loads transcript + linked conversation,
 * renders the processing session view.
 */
export default async function TranscriptDetailPage({ params }: TranscriptDetailPageProps) {
  const { projectId, transcriptId } = await params

  const result = await getTranscript({ transcriptId, projectId })
  const transcript = result?.data

  if (!transcript) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[14px] text-muted-foreground">Transcript not found.</p>
      </div>
    )
  }

  // Convert DB messages to the format expected by the client component
  const messages = transcript.conversation?.messages.map((msg) => ({
    id: msg.id,
    role: msg.role.toLowerCase() as "user" | "assistant" | "system",
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
    toolCalls: msg.toolCalls as Record<string, unknown> | null,
    inputTokens: msg.inputTokens,
    outputTokens: msg.outputTokens,
    cost: msg.cost,
  })) ?? []

  return (
    <TranscriptSessionClient
      projectId={projectId}
      transcriptId={transcriptId}
      transcriptTitle={transcript.title ?? "Untitled Transcript"}
      processingStatus={transcript.processingStatus}
      conversationId={transcript.conversation?.id}
      initialMessages={messages}
    />
  )
}
