"use client"

/**
 * Story Create/Edit Form (D-05, D-08, D-09)
 *
 * Slide-over panel (Sheet) for creating and editing stories.
 * Fields: title, epic, feature, persona, description, acceptanceCriteria (required),
 * storyPoints, priority, components (ComponentSelector).
 *
 * Edit mode: pre-populates fields, shows status transition buttons (D-09).
 * Dirty form protection per Pitfall 6.
 */

import { useState, useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createStory, updateStory, updateStoryStatus, addStoryComponent } from "@/actions/stories"
import { getAvailableTransitions } from "@/lib/story-status-machine"
import { ComponentSelector, type ComponentEntry } from "./component-selector"
import type { ProjectRole } from "@/generated/prisma"

// ────────────────────────────────────────────
// Form schema
// ────────────────────────────────────────────

const storyFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  epicId: z.string().min(1, "Epic is required"),
  featureId: z.string().optional(),
  persona: z.string().optional(),
  description: z.string().optional(),
  acceptanceCriteria: z.string().min(1, "Acceptance criteria are required"),
  storyPoints: z.number().int().min(0).max(100).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
})

type StoryFormValues = z.infer<typeof storyFormSchema>

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface StoryData {
  id: string
  title: string
  persona: string | null
  description: string | null
  acceptanceCriteria: string
  storyPoints: number | null
  priority: string
  status: string
  epicId: string
  featureId: string | null
  storyComponents?: Array<{
    id: string
    componentName: string
    impactType: string
  }>
}

interface StoryFormProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  story?: StoryData | null
  epics: Array<{ id: string; name: string; prefix: string }>
  features?: Array<{ id: string; name: string; prefix: string; epicId?: string }>
  defaultEpicId?: string
  defaultFeatureId?: string
  userRole?: ProjectRole
}

// ────────────────────────────────────────────
// Status badge styles
// ────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
  READY: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  SPRINT_PLANNED: "bg-[#F5F3FF] text-[#8B5CF6] border-[#DDD6FE]",
  IN_PROGRESS: "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]",
  IN_REVIEW: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",
  QA: "bg-[#FDF2F8] text-[#EC4899] border-[#FBCFE8]",
  DONE: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  SPRINT_PLANNED: "Sprint Planned",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  QA: "QA",
  DONE: "Done",
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function StoryForm({
  projectId,
  open,
  onOpenChange,
  story,
  epics,
  features = [],
  defaultEpicId,
  defaultFeatureId,
  userRole,
}: StoryFormProps) {
  const isEditing = !!story
  const [components, setComponents] = useState<ComponentEntry[]>([])

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      title: "",
      epicId: defaultEpicId ?? "",
      featureId: defaultFeatureId ?? "",
      persona: "",
      description: "",
      acceptanceCriteria: "",
      storyPoints: null,
      priority: "MEDIUM",
    },
  })

  const selectedEpicId = form.watch("epicId")

  // Filter features by selected epic
  const filteredFeatures = useMemo(
    () => features.filter((f) => !f.epicId || f.epicId === selectedEpicId),
    [features, selectedEpicId]
  )

  // Reset form when opening or story changes
  useEffect(() => {
    if (open) {
      if (story) {
        form.reset({
          title: story.title,
          epicId: story.epicId,
          featureId: story.featureId ?? "",
          persona: story.persona ?? "",
          description: story.description ?? "",
          acceptanceCriteria: story.acceptanceCriteria,
          storyPoints: story.storyPoints,
          priority: story.priority as StoryFormValues["priority"],
        })
        setComponents(
          (story.storyComponents ?? []).map((c) => ({
            componentName: c.componentName,
            impactType: c.impactType as ComponentEntry["impactType"],
          }))
        )
      } else {
        form.reset({
          title: "",
          epicId: defaultEpicId ?? "",
          featureId: defaultFeatureId ?? "",
          persona: "",
          description: "",
          acceptanceCriteria: "",
          storyPoints: null,
          priority: "MEDIUM",
        })
        setComponents([])
      }
    }
  }, [open, story, defaultEpicId, defaultFeatureId, form])

  // ── Server actions ──

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createStory, {
    onSuccess: async ({ data }) => {
      if (data?.story && components.length > 0) {
        // Add components after story is created
        for (const comp of components) {
          if (comp.componentName.trim()) {
            await executeAddComponent({
              projectId,
              storyId: data.story.id,
              componentName: comp.componentName.trim(),
              impactType: comp.impactType as "CREATE" | "MODIFY" | "DELETE",
            })
          }
        }
      }
      toast.success("Story created")
      onOpenChange(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to create story")
    },
  })

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateStory, {
    onSuccess: () => {
      toast.success("Story updated")
      onOpenChange(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to update story")
    },
  })

  const { execute: executeStatusChange, isExecuting: isChangingStatus } = useAction(
    updateStoryStatus,
    {
      onSuccess: () => {
        toast.success("Status updated")
        onOpenChange(false)
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Invalid status transition for your role")
      },
    }
  )

  const { executeAsync: executeAddComponent } = useAction(addStoryComponent)

  const isExecuting = isCreating || isUpdating

  // ── Handlers ──

  function onSubmit(values: StoryFormValues) {
    if (isEditing && story) {
      executeUpdate({
        projectId,
        storyId: story.id,
        title: values.title,
        persona: values.persona || undefined,
        description: values.description || undefined,
        acceptanceCriteria: values.acceptanceCriteria,
        storyPoints: values.storyPoints ?? undefined,
        priority: values.priority,
        featureId: values.featureId || null,
      })
    } else {
      executeCreate({
        projectId,
        epicId: values.epicId,
        featureId: values.featureId || undefined,
        title: values.title,
        persona: values.persona || undefined,
        description: values.description || undefined,
        acceptanceCriteria: values.acceptanceCriteria,
        storyPoints: values.storyPoints ?? undefined,
        priority: values.priority,
      })
    }
  }

  function handleStatusTransition(newStatus: string) {
    if (!story) return
    executeStatusChange({
      projectId,
      storyId: story.id,
      status: newStatus as "DRAFT" | "READY" | "SPRINT_PLANNED" | "IN_PROGRESS" | "IN_REVIEW" | "QA" | "DONE",
    })
  }

  // Dirty form protection (Pitfall 6)
  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && form.formState.isDirty) {
      if (!confirm("You have unsaved changes. Discard them?")) {
        return
      }
    }
    onOpenChange(newOpen)
  }

  // Available status transitions for edit mode
  const availableTransitions = useMemo(() => {
    if (!story || !userRole) return []
    return getAvailableTransitions(
      story.status as "DRAFT" | "READY" | "SPRINT_PLANNED" | "IN_PROGRESS" | "IN_REVIEW" | "QA" | "DONE",
      userRole
    )
  }, [story, userRole])

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Story" : "New Story"}</SheetTitle>
        </SheetHeader>

        {/* Status section for edit mode (D-09) */}
        {isEditing && story && (
          <div className="flex flex-wrap items-center gap-2 px-4">
            <span className="text-[13px] text-muted-foreground">Status:</span>
            <Badge
              variant="outline"
              className={cn("text-[12px]", STATUS_STYLES[story.status])}
            >
              {STATUS_LABELS[story.status] ?? story.status}
            </Badge>
            {availableTransitions.length > 0 && (
              <>
                <span className="text-[13px] text-muted-foreground ml-2">Move to:</span>
                {availableTransitions.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isChangingStatus}
                    onClick={() => handleStatusTransition(t)}
                    className="h-7 text-[12px]"
                  >
                    {STATUS_LABELS[t] ?? t}
                  </Button>
                ))}
              </>
            )}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="story-title" className="text-[13px] font-semibold">
              Title *
            </Label>
            <Input
              id="story-title"
              placeholder="As a user, I want to..."
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-[13px] text-red-600">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Epic */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold">Epic *</Label>
            <Controller
              control={form.control}
              name="epicId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v: string | null) => v && field.onChange(v)}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select epic" />
                  </SelectTrigger>
                  <SelectContent>
                    {epics.map((epic) => (
                      <SelectItem key={epic.id} value={epic.id}>
                        {epic.prefix} - {epic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.epicId && (
              <p className="text-[13px] text-red-600">
                {form.formState.errors.epicId.message}
              </p>
            )}
          </div>

          {/* Feature */}
          {filteredFeatures.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold">Feature</Label>
              <Controller
                control={form.control}
                name="featureId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v: string | null) => field.onChange(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {filteredFeatures.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.prefix} - {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Persona */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="story-persona" className="text-[13px] font-semibold">
              Persona
            </Label>
            <Input
              id="story-persona"
              placeholder="As a..."
              {...form.register("persona")}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="story-description" className="text-[13px] font-semibold">
              Description
            </Label>
            <Textarea
              id="story-description"
              placeholder="Optional description"
              className="min-h-[80px]"
              {...form.register("description")}
            />
          </div>

          {/* Acceptance Criteria (required per WORK-02) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="story-ac" className="text-[13px] font-semibold">
              Acceptance Criteria *
            </Label>
            <Textarea
              id="story-ac"
              placeholder="Given... When... Then..."
              className="min-h-[100px]"
              {...form.register("acceptanceCriteria")}
            />
            {form.formState.errors.acceptanceCriteria && (
              <p className="text-[13px] text-red-600">
                {form.formState.errors.acceptanceCriteria.message}
              </p>
            )}
          </div>

          {/* Story Points + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="story-points" className="text-[13px] font-semibold">
                Story Points
              </Label>
              <Input
                id="story-points"
                type="number"
                min={0}
                max={100}
                placeholder="Optional"
                {...form.register("storyPoints", {
                  setValueAs: (v: string) => (v === "" ? null : parseInt(v, 10)),
                })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold">Priority</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v: string | null) => v && field.onChange(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Components (D-08) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold">
              Salesforce Components
            </Label>
            <ComponentSelector value={components} onChange={setComponents} />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isExecuting}
              className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            >
              {isExecuting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Story"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
