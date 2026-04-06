"use client"

/**
 * Question Create/Edit Form
 *
 * Dialog-based form for creating and editing questions.
 * Uses react-hook-form with Zod resolver for validation.
 * Triggers createQuestion server action on submit.
 */

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createQuestion } from "@/actions/questions"

const questionFormSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  scope: z.enum(["ENGAGEMENT", "EPIC", "FEATURE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  scopeEpicId: z.string().optional(),
  scopeFeatureId: z.string().optional(),
  assigneeId: z.string().optional(),
})

type QuestionFormValues = z.infer<typeof questionFormSchema>

interface QuestionFormProps {
  projectId: string
  epics?: Array<{ id: string; name: string; prefix: string }>
  features?: Array<{ id: string; name: string; prefix: string }>
  teamMembers?: Array<{ id: string; displayName: string; email: string }>
  trigger?: React.ReactNode
}

export function QuestionForm({
  projectId,
  epics = [],
  features = [],
  teamMembers = [],
  trigger,
}: QuestionFormProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionText: "",
      scope: "ENGAGEMENT",
      priority: "MEDIUM",
    },
  })

  const scope = form.watch("scope")

  const { execute, isExecuting } = useAction(createQuestion, {
    onSuccess: () => {
      toast.success("Question created")
      form.reset()
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to create question")
    },
  })

  function onSubmit(values: QuestionFormValues) {
    execute({
      projectId,
      ...values,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
            Ask Question
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            Ask a Question
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Question Text */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="questionText" className="text-[13px] font-semibold">
              Question
            </Label>
            <Textarea
              id="questionText"
              placeholder="What needs to be clarified?"
              className="min-h-[80px]"
              {...form.register("questionText")}
            />
            {form.formState.errors.questionText && (
              <p className="text-[13px] text-red-600">
                {form.formState.errors.questionText.message}
              </p>
            )}
          </div>

          {/* Scope */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold">Scope</Label>
            <Select
              value={scope}
              onValueChange={(v) => form.setValue("scope", v as QuestionFormValues["scope"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                <SelectItem value="EPIC">Epic</SelectItem>
                <SelectItem value="FEATURE">Feature</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional: Scope Epic */}
          {scope === "EPIC" && epics.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold">Epic</Label>
              <Select
                onValueChange={(v) => form.setValue("scopeEpicId", v)}
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
            </div>
          )}

          {/* Conditional: Scope Feature */}
          {scope === "FEATURE" && features.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold">Feature</Label>
              <Select
                onValueChange={(v) => form.setValue("scopeFeatureId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select feature" />
                </SelectTrigger>
                <SelectContent>
                  {features.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.prefix} - {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold">Priority</Label>
            <Select
              value={form.watch("priority")}
              onValueChange={(v) => form.setValue("priority", v as QuestionFormValues["priority"])}
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
          </div>

          {/* Assignee */}
          {teamMembers.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold">Assign to</Label>
              <Select
                onValueChange={(v) => form.setValue("assigneeId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.displayName || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              {isExecuting ? "Creating..." : "Create Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
