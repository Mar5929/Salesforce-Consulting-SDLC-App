"use client"

/**
 * Test Case Create Form (BUG-024)
 *
 * Inline form for creating a test case without immediately recording a result.
 * Fields: title (required), steps (optional), expectedResult (required), testType (select).
 *
 * Uses react-hook-form + Zod resolver.
 * Calls createTestCase server action.
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
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
import { createTestCase } from "@/actions/test-executions"

// ────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  steps: z.string().optional(),
  expectedResult: z.string().min(1, "Expected result is required"),
  testType: z.enum(["HAPPY_PATH", "EDGE_CASE", "NEGATIVE", "BULK"]),
})

type FormData = z.infer<typeof formSchema>

// ────────────────────────────────────────────
// Props
// ────────────────────────────────────────────

interface TestCaseCreateFormProps {
  storyId: string
  onComplete: () => void
  onCancel: () => void
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function TestCaseCreateForm({
  storyId,
  onComplete,
  onCancel,
}: TestCaseCreateFormProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      steps: "",
      expectedResult: "",
      testType: "HAPPY_PATH",
    },
  })

  const { execute } = useAction(createTestCase, {
    onSuccess: () => {
      toast.success("Test case created")
      setSubmitting(false)
      onComplete()
    },
    onError: () => {
      toast.error("Failed to create test case")
      setSubmitting(false)
    },
  })

  function handleSubmit(data: FormData) {
    setSubmitting(true)
    execute({
      storyId,
      title: data.title,
      steps: data.steps || undefined,
      expectedResult: data.expectedResult,
      testType: data.testType,
    })
  }

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-4">
      <h4 className="text-[14px] font-medium text-foreground mb-3">
        Create Test Case
      </h4>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-3"
      >
        <div>
          <Label htmlFor="create-tc-title" className="text-[13px]">
            Test Case Title *
          </Label>
          <Input
            id="create-tc-title"
            {...form.register("title")}
            placeholder="e.g., Login flow works with valid credentials"
            className="mt-1"
          />
          {form.formState.errors.title && (
            <p className="text-[12px] text-red-500 mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="create-tc-steps" className="text-[13px]">
            Steps (optional)
          </Label>
          <Textarea
            id="create-tc-steps"
            {...form.register("steps")}
            placeholder="1. Navigate to login page&#10;2. Enter credentials&#10;3. Click Sign In"
            rows={3}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="create-tc-expected" className="text-[13px]">
            Expected Result *
          </Label>
          <Textarea
            id="create-tc-expected"
            {...form.register("expectedResult")}
            placeholder="User is redirected to dashboard with success message"
            rows={2}
            className="mt-1"
          />
          {form.formState.errors.expectedResult && (
            <p className="text-[12px] text-red-500 mt-1">
              {form.formState.errors.expectedResult.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-[13px]">Test Type</Label>
          <Select
            value={form.watch("testType")}
            onValueChange={(v: string | null) => {
              if (v) form.setValue("testType", v as FormData["testType"])
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HAPPY_PATH">Happy Path</SelectItem>
              <SelectItem value="EDGE_CASE">Edge Case</SelectItem>
              <SelectItem value="NEGATIVE">Negative</SelectItem>
              <SelectItem value="BULK">Bulk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 justify-end mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            size="sm"
          >
            {submitting ? "Creating..." : "Create Test Case"}
          </Button>
        </div>
      </form>
    </div>
  )
}
