"use client"

import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { uploadTranscript } from "@/actions/transcripts"

interface UploadZoneProps {
  projectId: string
}

const MAX_WORDS = 10_000

/**
 * Drag-and-drop upload zone + paste textarea for transcript processing (D-07, TRNS-01).
 *
 * - Dashed border drop area for .txt files
 * - Textarea for direct paste
 * - Validates 10K word limit (T-02-17)
 * - On submit: calls uploadTranscript, navigates to transcript detail page
 */
export function UploadZone({ projectId }: UploadZoneProps) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const isOverLimit = wordCount > MAX_WORDS

  const handleFileRead = useCallback((file: File) => {
    if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
      setError("Only .txt files are supported. Paste your transcript text directly for other formats.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setContent(text)
      setError(null)
      // Use filename as title if not set
      if (!title) {
        setTitle(file.name.replace(/\.txt$/, ""))
      }
    }
    reader.onerror = () => {
      setError("Failed to read file. Please try pasting the content instead.")
    }
    reader.readAsText(file)
  }, [title])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileRead(file)
    },
    [handleFileRead]
  )

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileRead(file)
    },
    [handleFileRead]
  )

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      setError("Please provide transcript content.")
      return
    }
    if (isOverLimit) {
      setError(`This transcript exceeds the ${MAX_WORDS.toLocaleString()} word limit. Please split it into smaller sections.`)
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const result = await uploadTranscript({
        projectId,
        content: content.trim(),
        title: title.trim() || undefined,
        sourceType: "PASTE",
      })

      if (result?.data) {
        router.push(`/projects/${projectId}/transcripts/${result.data.transcriptId}`)
      } else {
        setError("Failed to upload transcript. Please try again.")
        setIsSubmitting(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload transcript.")
      setIsSubmitting(false)
    }
  }, [content, title, isOverLimit, projectId, router])

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-[#2563EB] bg-[#EFF6FF]"
            : "border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#9CA3AF]"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F0F0]">
          <Upload className="h-5 w-5 text-[#6B7280]" />
        </div>
        <div className="text-center">
          <p className="text-[14px] font-medium text-foreground">
            Drop a transcript file or click to browse
          </p>
          <p className="text-[13px] text-muted-foreground">
            .txt files only, or paste text below
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Transcript title (optional)"
        className="h-9 w-full rounded-md border border-[#E5E5E5] bg-background px-3 text-[14px] placeholder:text-muted-foreground focus:border-[#2563EB] focus:outline-none"
      />

      {/* Textarea for paste */}
      <Textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setError(null)
        }}
        placeholder="Paste transcript here..."
        className="min-h-[200px] resize-y text-[14px]"
        rows={8}
      />

      {/* Word count and error */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span
            className={`text-[13px] ${
              isOverLimit ? "font-medium text-[#DC2626]" : "text-muted-foreground"
            }`}
          >
            {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
          </span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isOverLimit || isSubmitting}
          className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Process Transcript"
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-[#FCA5A5] bg-[#FEF2F2] p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
          <p className="text-[13px] text-[#DC2626]">{error}</p>
        </div>
      )}
    </div>
  )
}
