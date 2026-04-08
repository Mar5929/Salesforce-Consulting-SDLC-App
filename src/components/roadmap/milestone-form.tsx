"use client"

/**
 * Milestone Create/Edit Form
 *
 * Sheet form for creating and editing milestones.
 * Fields: name (required), description (optional), targetDate (optional), status.
 * Dirty form protection on close.
 */

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { format } from "date-fns"
import { MilestoneStatus } from "@/generated/prisma"
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
import { createMilestone, updateMilestone } from "@/actions/milestones"
import type { MilestoneData } from "@/app/(dashboard)/projects/[projectId]/roadmap/roadmap-page-client"

// ────────────────────────────────────────────
// Form schema
// ────────────────────────────────────────────

const milestoneFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.nativeEnum(MilestoneStatus),
})

type MilestoneFormValues = z.infer<typeof milestoneFormSchema>

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

const STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: MilestoneStatus.NOT_STARTED, label: "Not Started" },
  { value: MilestoneStatus.IN_PROGRESS, label: "In Progress" },
  { value: MilestoneStatus.COMPLETE, label: "Complete" },
]

// ────────────────────────────────────────────
// Props
// ────────────────────────────────────────────

interface MilestoneFormProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  milestone?: MilestoneData | null
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function MilestoneForm({
  projectId,
  open,
  onOpenChange,
  milestone,
}: MilestoneFormProps) {
  const router = useRouter()
  const isEdit = !!milestone

  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      name: "",
      description: "",
      targetDate: "",
      status: MilestoneStatus.NOT_STARTED,
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = form

  // Pre-populate fields when editing
  useEffect(() => {
    if (milestone && open) {
      reset({
        name: milestone.name,
        description: milestone.description ?? "",
        targetDate: milestone.targetDate
          ? format(new Date(milestone.targetDate), "yyyy-MM-dd")
          : "",
        status: milestone.status,
      })
    } else if (!milestone && open) {
      reset({
        name: "",
        description: "",
        targetDate: "",
        status: MilestoneStatus.NOT_STARTED,
      })
    }
  }, [milestone, open, reset])

  const { execute: executeCreate } = useAction(createMilestone, {
    onSuccess: () => {
      toast.success("Milestone created")
      onOpenChange(false)
      router.refresh()
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to create milestone"),
  })

  const { execute: executeUpdate } = useAction(updateMilestone, {
    onSuccess: () => {
      toast.success("Milestone updated")
      onOpenChange(false)
      router.refresh()
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to update milestone"),
  })

  function onSubmit(values: MilestoneFormValues) {
    const targetDate = values.targetDate
      ? new Date(values.targetDate).toISOString()
      : undefined

    if (isEdit && milestone) {
      executeUpdate({
        projectId,
        milestoneId: milestone.id,
        name: values.name,
        description: values.description || undefined,
        targetDate,
        status: values.status,
      })
    } else {
      executeCreate({
        projectId,
        name: values.name,
        description: values.description || undefined,
        targetDate,
        status: values.status,
      })
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && isDirty) {
      if (!confirm("You have unsaved changes. Discard them?")) return
    }
    onOpenChange(newOpen)
  }

  const currentStatus = watch("status")

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[480px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Milestone" : "New Milestone"}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 pt-4"
        >
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="MVP Launch"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[13px] text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What does this milestone represent?"
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Target Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="targetDate">Target Date (optional)</Label>
            <Input
              id="targetDate"
              type="date"
              {...register("targetDate")}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              value={currentStatus}
              onValueChange={(value) =>
                setValue("status", value as MilestoneStatus, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status">
                  {(value: string) => {
                    const match = STATUS_OPTIONS.find((opt) => opt.value === value)
                    return match?.label ?? value
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save Changes" : "Create Milestone"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
