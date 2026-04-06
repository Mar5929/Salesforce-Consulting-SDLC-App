"use client"

/**
 * Feature Create/Edit Form
 *
 * Dialog-based form for creating and editing features.
 * Uses react-hook-form with Zod resolver for validation.
 * Calls createFeature or updateFeature server actions.
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
import { createFeature, updateFeature } from "@/actions/features"

const featureFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  prefix: z
    .string()
    .min(1, "Prefix is required")
    .max(20),
  description: z.string().optional(),
})

type FeatureFormValues = z.infer<typeof featureFormSchema>

interface FeatureFormProps {
  projectId: string
  epicId: string
  feature?: { id: string; name: string; prefix: string; description: string | null }
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function FeatureForm({
  projectId,
  epicId,
  feature,
  trigger,
  onSuccess,
}: FeatureFormProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!feature

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureFormSchema),
    defaultValues: {
      name: feature?.name ?? "",
      prefix: feature?.prefix ?? "",
      description: feature?.description ?? "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: feature?.name ?? "",
        prefix: feature?.prefix ?? "",
        description: feature?.description ?? "",
      })
    }
  }, [open, feature, form])

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createFeature, {
    onSuccess: () => {
      toast.success("Feature created")
      form.reset()
      setOpen(false)
      onSuccess?.()
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to create feature")
    },
  })

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateFeature, {
    onSuccess: () => {
      toast.success("Feature updated")
      setOpen(false)
      onSuccess?.()
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to update feature")
    },
  })

  const isExecuting = isCreating || isUpdating

  function onSubmit(values: FeatureFormValues) {
    if (isEditing) {
      executeUpdate({
        projectId,
        featureId: feature.id,
        name: values.name,
        description: values.description,
      })
    } else {
      executeCreate({
        projectId,
        epicId,
        ...values,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
            New Feature
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            {isEditing ? "Edit Feature" : "Create Feature"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="feature-name" className="text-[13px] font-semibold">
              Name
            </Label>
            <Input
              id="feature-name"
              placeholder="e.g. Lead Management"
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
            <Label htmlFor="feature-prefix" className="text-[13px] font-semibold">
              Prefix
            </Label>
            <Input
              id="feature-prefix"
              placeholder="e.g. LM"
              disabled={isEditing}
              {...form.register("prefix")}
            />
            {form.formState.errors.prefix && (
              <p className="text-[13px] text-red-600">
                {form.formState.errors.prefix.message}
              </p>
            )}
            {!isEditing && (
              <p className="text-[12px] text-muted-foreground">
                Used to identify this feature. Cannot be changed later.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="feature-description" className="text-[13px] font-semibold">
              Description
            </Label>
            <Textarea
              id="feature-description"
              placeholder="Optional description of this feature"
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
                  : "Create Feature"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
