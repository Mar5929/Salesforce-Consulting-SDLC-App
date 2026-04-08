"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAction } from "next-safe-action/hooks"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

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
import { updateProject } from "@/actions/projects"
import { formatEnumLabel } from "@/lib/format-enum"

const ENGAGEMENT_TYPES = [
  { value: "GREENFIELD", label: "Greenfield" },
  { value: "BUILD_PHASE", label: "Build Phase" },
  { value: "MANAGED_SERVICES", label: "Managed Services" },
  { value: "RESCUE_TAKEOVER", label: "Rescue/Takeover" },
] as const

const settingsSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  clientName: z.string().min(1, "Client name is required").max(100),
  engagementType: z.enum([
    "GREENFIELD",
    "BUILD_PHASE",
    "MANAGED_SERVICES",
    "RESCUE_TAKEOVER",
  ]),
  startDate: z.string().min(1, "Start date is required"),
  targetEndDate: z.string().optional(),
  sandboxStrategy: z.string().optional(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

interface ProjectSettingsFormProps {
  projectId: string
  defaultValues: {
    name: string
    clientName: string
    engagementType: string
    startDate: string
    targetEndDate: string
    sandboxStrategy: string
  }
}

export function ProjectSettingsForm({
  projectId,
  defaultValues,
}: ProjectSettingsFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: defaultValues.name,
      clientName: defaultValues.clientName,
      engagementType: defaultValues.engagementType as SettingsFormData["engagementType"],
      startDate: defaultValues.startDate,
      targetEndDate: defaultValues.targetEndDate,
      sandboxStrategy: defaultValues.sandboxStrategy,
    },
  })

  const { execute, isExecuting } = useAction(updateProject, {
    onSuccess: () => {
      toast.success("Project settings updated")
    },
    onError: (error) => {
      toast.error(error.error.serverError ?? "Failed to update project settings")
    },
  })

  function onSubmit(data: SettingsFormData) {
    execute({
      projectId,
      name: data.name,
      clientName: data.clientName,
      engagementType: data.engagementType,
      startDate: data.startDate,
      targetEndDate: data.targetEndDate || undefined,
      sandboxStrategy: data.sandboxStrategy || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-[13px] font-semibold">
          Project Name
        </Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-[13px] text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="clientName" className="text-[13px] font-semibold">
          Client Name
        </Label>
        <Input id="clientName" {...register("clientName")} />
        {errors.clientName && (
          <p className="text-[13px] text-destructive">
            {errors.clientName.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[13px] font-semibold">Engagement Type</Label>
        <Controller
          name="engagementType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select engagement type">
                    {(value: string) => {
                      const match = ENGAGEMENT_TYPES.find((t) => t.value === value)
                      return match?.label ?? formatEnumLabel(value)
                    }}
                  </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ENGAGEMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="startDate" className="text-[13px] font-semibold">
          Start Date
        </Label>
        <Input id="startDate" type="date" {...register("startDate")} />
        {errors.startDate && (
          <p className="text-[13px] text-destructive">
            {errors.startDate.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="targetEndDate" className="text-[13px] font-semibold">
          Target End Date (optional)
        </Label>
        <Input
          id="targetEndDate"
          type="date"
          {...register("targetEndDate")}
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="sandboxStrategy"
          className="text-[13px] font-semibold"
        >
          Sandbox Strategy
        </Label>
        <Textarea
          id="sandboxStrategy"
          rows={4}
          {...register("sandboxStrategy")}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isExecuting}>
          {isExecuting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  )
}
