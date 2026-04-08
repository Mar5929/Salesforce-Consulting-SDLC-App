"use client"

/**
 * Defect Create Sheet (D-07, D-08)
 *
 * Slide-over panel (Sheet) for creating defects.
 * Fields: title, severity, linked story, assignee, steps to reproduce,
 * expected behavior, actual behavior.
 * Supports pre-population from failed test cases via prefill prop.
 * Uses react-hook-form + Zod resolver.
 */

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createDefect } from "@/actions/defects"
import { formatEnumLabel } from "@/lib/format-enum"

// ────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────

const defectFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  storyId: z.string().optional(),
  assigneeId: z.string().optional(),
  stepsToReproduce: z.string().min(1, "Steps to reproduce are required"),
  expectedBehavior: z.string().min(1, "Expected behavior is required"),
  actualBehavior: z.string().min(1, "Actual behavior is required"),
})

type DefectFormData = z.infer<typeof defectFormSchema>

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface DefectCreateSheetProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  prefill?: {
    storyId?: string
    testCaseId?: string
    title?: string
  }
  members?: Array<{ id: string; displayName: string }>
  stories?: Array<{ id: string; displayId: string; title: string }>
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function DefectCreateSheet({
  projectId,
  open,
  onOpenChange,
  onCreated,
  prefill,
  members = [],
  stories = [],
}: DefectCreateSheetProps) {
  const form = useForm<DefectFormData>({
    resolver: zodResolver(defectFormSchema),
    defaultValues: {
      title: "",
      severity: "MEDIUM",
      storyId: "",
      assigneeId: "",
      stepsToReproduce: "",
      expectedBehavior: "",
      actualBehavior: "",
    },
  })

  const { execute, isPending } = useAction(createDefect, {
    onSuccess: () => {
      toast.success("Defect created")
      form.reset()
      onCreated()
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to create defect")
    },
  })

  // Apply prefill when sheet opens with prefill data
  useEffect(() => {
    if (open && prefill) {
      if (prefill.title) form.setValue("title", prefill.title)
      if (prefill.storyId) form.setValue("storyId", prefill.storyId)
    }
    if (!open) {
      form.reset()
    }
  }, [open, prefill, form])

  function handleSubmit(data: DefectFormData) {
    execute({
      projectId,
      title: data.title,
      severity: data.severity,
      stepsToReproduce: data.stepsToReproduce,
      expectedBehavior: data.expectedBehavior,
      actualBehavior: data.actualBehavior,
      storyId: data.storyId || undefined,
      assigneeId: data.assigneeId || undefined,
      testCaseId: prefill?.testCaseId || undefined,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Defect</SheetTitle>
          <SheetDescription>
            Report a new defect for this project.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4 mt-4"
        >
          {/* Title */}
          <div>
            <Label htmlFor="defect-title" className="text-[13px]">
              Title *
            </Label>
            <Input
              id="defect-title"
              {...form.register("title")}
              placeholder="Describe the defect"
              className="mt-1"
            />
            {form.formState.errors.title && (
              <p className="text-[12px] text-red-500 mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Severity */}
          <div>
            <Label className="text-[13px]">Severity *</Label>
            <Select
              value={form.watch("severity")}
              onValueChange={(v: string | null) => {
                if (v) form.setValue("severity", v as DefectFormData["severity"])
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue>
                  {(value: string) => formatEnumLabel(value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Linked Story */}
          {stories.length > 0 && (
            <div>
              <Label className="text-[13px]">Linked Story</Label>
              <Select
                value={form.watch("storyId") || "none"}
                onValueChange={(v: string | null) =>
                  form.setValue("storyId", v === "none" ? "" : v ?? "")
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select story" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked story</SelectItem>
                  {stories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.displayId} - {s.title.length > 40 ? s.title.slice(0, 40) + "..." : s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assignee */}
          {members.length > 0 && (
            <div>
              <Label className="text-[13px]">Assignee</Label>
              <Select
                value={form.watch("assigneeId") || "none"}
                onValueChange={(v: string | null) =>
                  form.setValue("assigneeId", v === "none" ? "" : v ?? "")
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Steps to Reproduce */}
          <div>
            <Label htmlFor="defect-steps" className="text-[13px]">
              Steps to Reproduce *
            </Label>
            <Textarea
              id="defect-steps"
              {...form.register("stepsToReproduce")}
              placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
              rows={3}
              className="mt-1"
            />
            {form.formState.errors.stepsToReproduce && (
              <p className="text-[12px] text-red-500 mt-1">
                {form.formState.errors.stepsToReproduce.message}
              </p>
            )}
          </div>

          {/* Expected Behavior */}
          <div>
            <Label htmlFor="defect-expected" className="text-[13px]">
              Expected Behavior *
            </Label>
            <Textarea
              id="defect-expected"
              {...form.register("expectedBehavior")}
              placeholder="What should happen"
              rows={2}
              className="mt-1"
            />
            {form.formState.errors.expectedBehavior && (
              <p className="text-[12px] text-red-500 mt-1">
                {form.formState.errors.expectedBehavior.message}
              </p>
            )}
          </div>

          {/* Actual Behavior */}
          <div>
            <Label htmlFor="defect-actual" className="text-[13px]">
              Actual Behavior *
            </Label>
            <Textarea
              id="defect-actual"
              {...form.register("actualBehavior")}
              placeholder="What actually happens"
              rows={2}
              className="mt-1"
            />
            {form.formState.errors.actualBehavior && (
              <p className="text-[12px] text-red-500 mt-1">
                {form.formState.errors.actualBehavior.message}
              </p>
            )}
          </div>

          {/* Footer buttons */}
          <SheetFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            >
              {isPending ? "Creating..." : "Create Defect"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
