"use client"

import { useState } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAction } from "next-safe-action/hooks"
import { Loader2, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WizardStepIndicator } from "./wizard-step-indicator"
import { createProject } from "@/actions/projects"
import { formatEnumLabel } from "@/lib/format-enum"

const ENGAGEMENT_TYPES = [
  { value: "GREENFIELD", label: "Greenfield" },
  { value: "BUILD_PHASE", label: "Build Phase" },
  { value: "MANAGED_SERVICES", label: "Managed Services" },
  { value: "RESCUE_TAKEOVER", label: "Rescue/Takeover" },
] as const

const PROJECT_ROLES = [
  { value: "SOLUTION_ARCHITECT", label: "Solution Architect" },
  { value: "PM", label: "Project Manager" },
  { value: "BA", label: "Business Analyst" },
  { value: "DEVELOPER", label: "Developer" },
  { value: "QA", label: "QA" },
] as const

const wizardSchema = z.object({
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
  teamMembers: z
    .array(
      z.object({
        email: z.string().email("Invalid email address"),
        role: z.enum([
          "SOLUTION_ARCHITECT",
          "DEVELOPER",
          "PM",
          "BA",
          "QA",
        ]),
      })
    )
    .optional(),
})

type WizardFormData = z.infer<typeof wizardSchema>

const STEP_LABELS = ["Project Details", "Sandbox Strategy", "Invite Team"]

export function CreateWizard() {
  const [currentStep, setCurrentStep] = useState(1)

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      name: "",
      clientName: "",
      engagementType: "GREENFIELD",
      startDate: "",
      targetEndDate: "",
      sandboxStrategy: "",
      teamMembers: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "teamMembers",
  })

  const { execute, isExecuting } = useAction(createProject)

  async function handleNext() {
    if (currentStep === 1) {
      const valid = await trigger([
        "name",
        "clientName",
        "engagementType",
        "startDate",
      ])
      if (!valid) return
    }
    if (currentStep < 3) {
      setCurrentStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
    }
  }

  function onSubmit(data: WizardFormData) {
    execute({
      name: data.name,
      clientName: data.clientName,
      engagementType: data.engagementType,
      startDate: data.startDate,
      targetEndDate: data.targetEndDate || undefined,
      sandboxStrategy: data.sandboxStrategy || undefined,
      teamMembers:
        data.teamMembers && data.teamMembers.length > 0
          ? data.teamMembers
          : undefined,
    })
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <WizardStepIndicator
        currentStep={currentStep}
        totalSteps={3}
        stepLabels={STEP_LABELS}
      />

      <Card className="mt-12">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Project Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#171717]">
                    Project Details
                  </h2>
                  <p className="mt-1 text-[14px] text-[#525252]">
                    Enter the basic information for your new project.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[13px] font-semibold">
                    Project Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="My Salesforce Project"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-[13px] text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="clientName"
                    className="text-[13px] font-semibold"
                  >
                    Client Name
                  </Label>
                  <Input
                    id="clientName"
                    placeholder="Acme Corp"
                    {...register("clientName")}
                  />
                  {errors.clientName && (
                    <p className="text-[13px] text-destructive">
                      {errors.clientName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold">
                    Engagement Type
                  </Label>
                  <Controller
                    name="engagementType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                  {errors.engagementType && (
                    <p className="text-[13px] text-destructive">
                      {errors.engagementType.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="startDate"
                    className="text-[13px] font-semibold"
                  >
                    Start Date
                  </Label>
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

                <div className="space-y-1.5">
                  <Label
                    htmlFor="targetEndDate"
                    className="text-[13px] font-semibold"
                  >
                    Target End Date (optional)
                  </Label>
                  <Input
                    id="targetEndDate"
                    type="date"
                    {...register("targetEndDate")}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Sandbox Strategy */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#171717]">
                    Sandbox Strategy
                  </h2>
                  <p className="mt-1 text-[14px] text-[#525252]">
                    Choose how your team will connect to Salesforce.
                  </p>
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
                    placeholder="Describe how your team will connect to Salesforce sandboxes..."
                    rows={5}
                    {...register("sandboxStrategy")}
                  />
                  <p className="text-[13px] text-[#737373]">
                    This step is optional. You can skip to the next step.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Invite Team */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#171717]">
                    Invite Team
                  </h2>
                  <p className="mt-1 text-[14px] text-[#525252]">
                    Add team members and assign their project roles.
                  </p>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Input
                        placeholder="team@example.com"
                        {...register(`teamMembers.${index}.email`)}
                      />
                      {errors.teamMembers?.[index]?.email && (
                        <p className="text-[13px] text-destructive">
                          {errors.teamMembers[index].email?.message}
                        </p>
                      )}
                    </div>

                    <Controller
                      name={`teamMembers.${index}.role`}
                      control={control}
                      render={({ field: roleField }) => (
                        <Select
                          value={roleField.value}
                          onValueChange={roleField.onChange}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role">
                              {(value: string) => {
                                const match = PROJECT_ROLES.find((r) => r.value === value)
                                return match?.label ?? formatEnumLabel(value)
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ email: "", role: "DEVELOPER" })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Member
                </Button>

                <p className="text-[13px] text-[#737373]">
                  This step is optional. You can create the project without
                  inviting anyone.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isExecuting}>
                  {isExecuting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Project
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
