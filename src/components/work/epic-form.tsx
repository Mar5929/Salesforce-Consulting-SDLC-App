"use client"

/**
 * Epic Create/Edit Form
 *
 * Dialog-based form for creating and editing epics.
 * Uses react-hook-form with Zod resolver for validation.
 * Calls createEpic or updateEpic server actions.
 */

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createEpic, updateEpic } from "@/actions/epics"

const epicFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  prefix: z
    .string()
    .min(1, "Prefix is required")
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Prefix must be uppercase letters and numbers only"),
  description: z.string().optional(),
})

type EpicFormValues = z.infer<typeof epicFormSchema>

interface EpicFormProps {
  projectId: string
  epic?: { id: string; name: string; prefix: string; description: string | null }
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function EpicForm({ projectId, epic, trigger, onSuccess }: EpicFormProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!epic

  const form = useForm<EpicFormValues>({
    resolver: zodResolver(epicFormSchema),
    defaultValues: {
      name: epic?.name ?? "",
      prefix: epic?.prefix ?? "",
      description: epic?.description ?? "",
    },
  })

  // Reset form when epic changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: epic?.name ?? "",
        prefix: epic?.prefix ?? "",
        description: epic?.description ?? "",
      })
    }
  }, [open, epic, form])

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createEpic, {
    onSuccess: () => {
      toast.success("Epic created")
      form.reset()
      setOpen(false)
      onSuccess?.()
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to create epic")
    },
  })

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateEpic, {
    onSuccess: () => {
      toast.success("Epic updated")
      setOpen(false)
      onSuccess?.()
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to update epic")
    },
  })

  const isExecuting = isCreating || isUpdating

  function onSubmit(values: EpicFormValues) {
    if (isEditing) {
      executeUpdate({
        projectId,
        epicId: epic.id,
        name: values.name,
        description: values.description,
      })
    } else {
      executeCreate({
        projectId,
        ...values,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
            New Epic
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            {isEditing ? "Edit Epic" : "Create Epic"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-[13px] font-semibold">
              Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Sales Cloud Implementation"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-[13px] text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Prefix */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prefix" className="text-[13px] font-semibold">
              Prefix
            </Label>
            <Input
              id="prefix"
              placeholder="e.g. SC"
              className="uppercase"
              disabled={isEditing}
              {...form.register("prefix", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase()
                },
              })}
            />
            {form.formState.errors.prefix && (
              <p className="text-[13px] text-red-600">
                {form.formState.errors.prefix.message}
              </p>
            )}
            {!isEditing && (
              <p className="text-[12px] text-muted-foreground">
                Used as prefix for stories (e.g. SC-001). Cannot be changed later.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description" className="text-[13px] font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Optional description of this epic"
              className="min-h-[80px]"
              {...form.register("description")}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
                  : "Create Epic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
