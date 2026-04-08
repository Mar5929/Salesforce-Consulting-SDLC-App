"use client"

/**
 * Generation Progress
 *
 * Shows real-time progress during document generation.
 * Polls for document completion and displays step-by-step visual feedback.
 * Shows success toast on completion via sonner.
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Check, Loader2 } from "lucide-react"
import { getDocuments } from "@/actions/documents"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface GenerationProgressProps {
  templateName: string
  templateId: string
  sections: string[]
  projectId: string
  onComplete: () => void
}

export function GenerationProgress({
  templateName,
  templateId,
  sections,
  projectId,
  onComplete,
}: GenerationProgressProps) {
  const [progress, setProgress] = useState(10)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const pollCountRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Capture generation start time on mount to detect documents created after this point
  const generationStartTimeRef = useRef<number>(Date.now())

  const { execute: fetchDocuments } = useAction(getDocuments, {
    onSuccess: ({ data }) => {
      if (!data) return

      // Check if a document matching the template was created after generation started
      const newDoc = data.find(
        (doc) =>
          doc.templateUsed === templateId &&
          new Date(doc.createdAt).getTime() > generationStartTimeRef.current
      )

      if (newDoc) {
        setCompleted(true)
        setProgress(100)
        setCurrentStep(sections.length)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        toast.success("Document generated", {
          description: `${templateName} is ready for download.`,
        })
        onComplete()
      }
    },
    onError: () => {
      // Silently continue polling on error
    },
  })

  // Stable ref for fetchDocuments to avoid interval restarts on re-renders
  const fetchDocumentsRef = useRef(fetchDocuments)
  fetchDocumentsRef.current = fetchDocuments

  // Simulate progress and poll for completion
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      pollCountRef.current += 1

      // Simulate step progress (estimate ~30 seconds total)
      const estimatedSteps = sections.length + 1 // +1 for context assembly
      const stepDuration = 10 // polls per step (3s interval = ~30s for 10 polls)
      const simulatedStep = Math.min(
        Math.floor(pollCountRef.current / (stepDuration / estimatedSteps)),
        sections.length
      )
      setCurrentStep(simulatedStep)

      // Simulate progress (asymptotic approach to 90%, never 100% until real completion)
      const simulatedProgress = Math.min(
        10 + pollCountRef.current * 8,
        90
      )
      setProgress(simulatedProgress)

      // Poll for actual completion
      fetchDocumentsRef.current({ projectId })

      // Timeout after 2 minutes (40 polls at 3s)
      if (pollCountRef.current > 40) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setError("Generation is taking longer than expected. Check back later.")
      }
    }, 3000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sections.length, projectId])

  const handleRetry = useCallback(() => {
    setError(null)
    setProgress(10)
    setCurrentStep(0)
    pollCountRef.current = 0
    generationStartTimeRef.current = Date.now()
  }, [])

  if (error) {
    return (
      <div className="space-y-4 py-4">
        <DialogHeader>
          <DialogTitle>Generation Error</DialogTitle>
        </DialogHeader>
        <p className="text-[14px] text-destructive">{error}</p>
        <Button variant="outline" onClick={handleRetry}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <DialogHeader>
        <DialogTitle>
          {completed ? `${templateName} Ready` : `Generating ${templateName}`}
        </DialogTitle>
      </DialogHeader>

      <Progress value={progress} />

      <div className="space-y-2">
        {/* Context assembly step */}
        <div className="flex items-center gap-2 text-[14px]">
          {currentStep > 0 ? (
            <Check className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          )}
          <span
            className={
              currentStep > 0 ? "text-muted-foreground" : "text-foreground"
            }
          >
            Assembling project context...
          </span>
        </div>

        {/* Section steps */}
        {sections.map((section, idx) => {
          const stepIndex = idx + 1 // offset by context assembly step
          const isDone = currentStep > stepIndex
          const isCurrent = currentStep === stepIndex
          return (
            <div key={section} className="flex items-center gap-2 text-[14px]">
              {isDone ? (
                <Check className="h-4 w-4 text-green-600 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              ) : (
                <div className="h-4 w-4 shrink-0" />
              )}
              <span
                className={
                  isDone || isCurrent
                    ? isDone
                      ? "text-muted-foreground"
                      : "text-foreground"
                    : "text-muted-foreground/60"
                }
              >
                {isCurrent ? `Generating ${section}...` : section}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-[13px] text-muted-foreground">
        {completed
          ? "Document generated successfully."
          : "Estimated time: ~30 seconds"}
      </p>
    </div>
  )
}
