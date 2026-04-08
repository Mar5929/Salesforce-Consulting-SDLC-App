"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getEpics } from "@/actions/epics"
import { getStories } from "@/actions/stories"
import { getQuestions } from "@/actions/questions"
import {
  initiateStorySession,
  initiateEnrichmentSession,
  initiateQuestionImpact,
} from "@/actions/conversations"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionPickerType = "STORY_SESSION" | "ENRICHMENT_SESSION" | "QUESTION_SESSION"

interface SessionEntityPickerProps {
  projectId: string
  sessionType: SessionPickerType | null
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Shared entity type for picker items
// ---------------------------------------------------------------------------

interface PickerEntity {
  id: string
  label: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionEntityPicker({
  projectId,
  sessionType,
  onClose,
}: SessionEntityPickerProps) {
  const router = useRouter()
  const [entities, setEntities] = React.useState<PickerEntity[]>([])
  const [selectedId, setSelectedId] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Fetch entities when the dialog opens
  React.useEffect(() => {
    if (!sessionType) return

    setEntities([])
    setSelectedId("")
    setLoading(true)

    async function fetchEntities() {
      try {
        if (sessionType === "STORY_SESSION") {
          const result = await getEpics({ projectId })
          const epics = result?.data?.epics ?? []
          setEntities(
            epics.map((e) => ({ id: e.id, label: `${e.prefix}: ${e.name}` }))
          )
        } else if (sessionType === "ENRICHMENT_SESSION") {
          const result = await getStories({ projectId })
          const stories = result?.data?.stories ?? []
          setEntities(
            stories.map((s) => ({
              id: s.id,
              label: `${s.displayId}: ${s.title}`,
            }))
          )
        } else if (sessionType === "QUESTION_SESSION") {
          const result = await getQuestions({ projectId, page: 1, pageSize: 100 })
          const questions = result?.data?.questions ?? []
          setEntities(
            questions.map((q) => ({
              id: q.id,
              label: `${q.displayId}: ${q.questionText.slice(0, 80)}${q.questionText.length > 80 ? "..." : ""}`,
            }))
          )
        }
      } catch {
        toast.error("Failed to load items. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchEntities()
  }, [sessionType, projectId])

  // ---------------------------------------------------------------------------
  // Dialog metadata per session type
  // ---------------------------------------------------------------------------

  const meta = React.useMemo(() => {
    switch (sessionType) {
      case "STORY_SESSION":
        return {
          title: "Story Generation",
          description: "Select an epic to generate stories from.",
          entityLabel: "Epic",
          placeholder: "Select an epic...",
        }
      case "ENRICHMENT_SESSION":
        return {
          title: "Story Enrichment",
          description: "Select a story to enrich with AI suggestions.",
          entityLabel: "Story",
          placeholder: "Select a story...",
        }
      case "QUESTION_SESSION":
        return {
          title: "Question Impact Assessment",
          description:
            "Select a question to assess its impact. The assessment runs in the background.",
          entityLabel: "Question",
          placeholder: "Select a question...",
        }
      default:
        return { title: "", description: "", entityLabel: "", placeholder: "" }
    }
  }, [sessionType])

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    if (!selectedId || !sessionType) return

    setSubmitting(true)
    try {
      if (sessionType === "STORY_SESSION") {
        const result = await initiateStorySession({
          projectId,
          epicId: selectedId,
        })
        if (result?.data?.conversationId) {
          onClose()
          router.push(
            `/projects/${projectId}/chat/${result.data.conversationId}?epicId=${result.data.epicId}`
          )
          router.refresh()
        } else {
          toast.error("Failed to create story session.")
        }
      } else if (sessionType === "ENRICHMENT_SESSION") {
        const result = await initiateEnrichmentSession({
          projectId,
          storyId: selectedId,
        })
        if (result?.data?.conversationId) {
          onClose()
          router.push(
            `/projects/${projectId}/chat/${result.data.conversationId}?storyId=${result.data.storyId}`
          )
          router.refresh()
        } else {
          toast.error("Failed to create enrichment session.")
        }
      } else if (sessionType === "QUESTION_SESSION") {
        const result = await initiateQuestionImpact({
          projectId,
          questionId: selectedId,
        })
        if (result?.data?.dispatched) {
          onClose()
          toast.success(
            "Impact assessment dispatched. You will be notified when it completes."
          )
        } else {
          toast.error("Failed to dispatch impact assessment.")
        }
      }
    } catch {
      toast.error("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={sessionType !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading {meta.entityLabel.toLowerCase()}s...
              </span>
            </div>
          ) : entities.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No {meta.entityLabel.toLowerCase()}s found for this project.
            </p>
          ) : (
            <Select value={selectedId} onValueChange={(val) => setSelectedId(val ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={meta.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedId || submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {sessionType === "QUESTION_SESSION" ? "Run Assessment" : "Start Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
