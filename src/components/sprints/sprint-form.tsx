"use client"

/**
 * Sprint Create/Edit Form (D-10)
 *
 * Dialog form for creating and editing sprints.
 * Fields: name (required), goal (optional), startDate, endDate.
 * No capacity field per D-10.
 *
 * Uses react-hook-form + zod resolver.
 * On submit calls createSprint or updateSprint, closes dialog, shows toast.
 */

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSprint, updateSprint } from "@/actions/sprints"

// ────────────────────────────────────────────
// Form schema
// ────────────────────────────────────────────

const sprintFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    goal: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )

type SprintFormValues = z.infer<typeof sprintFormSchema>

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface SprintData {
  id: string
  name: string
  goal: string | null
  startDate: string | Date
  endDate: string | Date
  status: string
}

interface SprintFormProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  sprint?: SprintData | null
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function SprintForm({
  projectId,
  open,
  onOpenChange,
  sprint,
}: SprintFormProps) {
  const router = useRouter()
  const isEdit = !!sprint

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues: {
      name: "",
      goal: "",
      startDate: "",
      endDate: "",
    },
  })

  // Pre-populate fields in edit mode
  useEffect(() => {
    if (sprint && open) {
      reset({
        name: sprint.name,
        goal: sprint.goal ?? "",
        startDate: format(new Date(sprint.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(sprint.endDate), "yyyy-MM-dd"),
      })
    } else if (!sprint && open) {
      reset({ name: "", goal: "", startDate: "", endDate: "" })
    }
  }, [sprint, open, reset])

  const { execute: executeCreate } = useAction(createSprint, {
    onSuccess: () => {
      toast.success("Sprint created")
      onOpenChange(false)
      router.refresh()
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to create sprint"),
  })

  const { execute: executeUpdate } = useAction(updateSprint, {
    onSuccess: () => {
      toast.success("Sprint updated")
      onOpenChange(false)
      router.refresh()
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to update sprint"),
  })

  function onSubmit(values: SprintFormValues) {
    // Convert date strings to ISO datetime for Zod datetime validation
    const startDate = new Date(values.startDate).toISOString()
    const endDate = new Date(values.endDate).toISOString()

    if (isEdit && sprint) {
      executeUpdate({
        projectId,
        sprintId: sprint.id,
        name: values.name,
        goal: values.goal || undefined,
        startDate,
        endDate,
      })
    } else {
      executeCreate({
        projectId,
        name: values.name,
        goal: values.goal || undefined,
        startDate,
        endDate,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Sprint" : "New Sprint"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Sprint 1"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[13px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Goal */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal">Goal (optional)</Label>
            <Textarea
              id="goal"
              placeholder="What should this sprint accomplish?"
              rows={3}
              {...register("goal")}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-[13px] text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="text-[13px] text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save Changes" : "Create Sprint"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
