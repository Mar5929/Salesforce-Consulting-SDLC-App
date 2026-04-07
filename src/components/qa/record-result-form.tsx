"use client"

/**
 * Record Result Form (D-06)
 *
 * Two-step form for recording test execution results.
 * Step 1: Create/describe test case (title, steps, expectedResult, testType)
 * Step 2: Record result (PASS/FAIL/BLOCKED, notes, environment)
 *
 * Uses react-hook-form + Zod resolver.
 * Calls createTestCase then recordTestExecution sequentially.
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
import { createTestCase, recordTestExecution } from "@/actions/test-executions"

// ────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────

const step1Schema = z.object({
  title: z.string().min(1, "Title is required"),
  steps: z.string().optional(),
  expectedResult: z.string().min(1, "Expected result is required"),
  testType: z.enum(["HAPPY_PATH", "EDGE_CASE", "NEGATIVE", "BULK"]),
})

const step2Schema = z.object({
  result: z.enum(["PASS", "FAIL", "BLOCKED"]),
  notes: z.string().optional(),
  environment: z.string().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

// ────────────────────────────────────────────
// Props
// ────────────────────────────────────────────

interface RecordResultFormProps {
  storyId: string
  projectId: string
  onComplete: () => void
  onCancel: () => void
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function RecordResultForm({
  storyId,
  projectId,
  onComplete,
  onCancel,
}: RecordResultFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      title: "",
      steps: "",
      expectedResult: "",
      testType: "HAPPY_PATH",
    },
  })

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      result: "PASS",
      notes: "",
      environment: "",
    },
  })

  // Track pending step 2 data for chained action calls
  const [pendingStep2Data, setPendingStep2Data] = useState<Step2Data | null>(null)

  const { execute: executeCreateTestCase } = useAction(createTestCase, {
    onSuccess: ({ data }) => {
      const tcId = data?.testCase?.id
      if (tcId && pendingStep2Data) {
        executeRecordExecution({
          testCaseId: tcId,
          result: pendingStep2Data.result,
          notes: pendingStep2Data.notes || undefined,
          environment: pendingStep2Data.environment || undefined,
        })
      } else {
        toast.error("Failed to create test case")
        setSubmitting(false)
      }
    },
    onError: () => {
      toast.error("Failed to create test case")
      setSubmitting(false)
    },
  })

  const { execute: executeRecordExecution } = useAction(recordTestExecution, {
    onSuccess: () => {
      toast.success("Test result recorded")
      setSubmitting(false)
      onComplete()
    },
    onError: () => {
      toast.error("Failed to record test execution")
      setSubmitting(false)
    },
  })

  function handleStep1Submit(data: Step1Data) {
    setStep1Data(data)
    setStep(2)
  }

  function handleStep2Submit(data: Step2Data) {
    if (!step1Data) return

    setSubmitting(true)
    setPendingStep2Data(data)

    executeCreateTestCase({
      storyId,
      title: step1Data.title,
      steps: step1Data.steps || undefined,
      expectedResult: step1Data.expectedResult,
      testType: step1Data.testType,
    })
  }

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-4">
      <h4 className="text-[14px] font-medium text-foreground mb-3">
        {step === 1 ? "Step 1: Define Test Case" : "Step 2: Record Result"}
      </h4>

      {step === 1 ? (
        <form
          onSubmit={step1Form.handleSubmit(handleStep1Submit)}
          className="flex flex-col gap-3"
        >
          <div>
            <Label htmlFor="tc-title" className="text-[13px]">
              Test Case Title *
            </Label>
            <Input
              id="tc-title"
              {...step1Form.register("title")}
              placeholder="e.g., Login flow works with valid credentials"
              className="mt-1"
            />
            {step1Form.formState.errors.title && (
              <p className="text-[12px] text-red-500 mt-1">
                {step1Form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="tc-steps" className="text-[13px]">
              Steps (optional)
            </Label>
            <Textarea
              id="tc-steps"
              {...step1Form.register("steps")}
              placeholder="1. Navigate to login page&#10;2. Enter credentials&#10;3. Click Sign In"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tc-expected" className="text-[13px]">
              Expected Result *
            </Label>
            <Input
              id="tc-expected"
              {...step1Form.register("expectedResult")}
              placeholder="User is redirected to dashboard"
              className="mt-1"
            />
            {step1Form.formState.errors.expectedResult && (
              <p className="text-[12px] text-red-500 mt-1">
                {step1Form.formState.errors.expectedResult.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-[13px]">Test Type</Label>
            <Select
              value={step1Form.watch("testType")}
              onValueChange={(v: string | null) => {
                if (v) step1Form.setValue("testType", v as Step1Data["testType"])
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
              className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              size="sm"
            >
              Next: Record Result
            </Button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={step2Form.handleSubmit(handleStep2Submit)}
          className="flex flex-col gap-3"
        >
          <div>
            <Label className="text-[13px]">Result *</Label>
            <div className="flex items-center gap-3 mt-1">
              {(["PASS", "FAIL", "BLOCKED"] as const).map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={r}
                    {...step2Form.register("result")}
                    className="accent-[#2563EB]"
                  />
                  <span className="text-[13px]">
                    {r === "PASS" ? "Pass" : r === "FAIL" ? "Fail" : "Blocked"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="exec-notes" className="text-[13px]">
              Notes
            </Label>
            <Textarea
              id="exec-notes"
              {...step2Form.register("notes")}
              placeholder="Additional observations..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="exec-env" className="text-[13px]">
              Environment
            </Label>
            <Input
              id="exec-env"
              {...step2Form.register("environment")}
              placeholder="e.g., Chrome 120, Production sandbox"
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-2 justify-end mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              size="sm"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              size="sm"
            >
              {submitting ? "Saving..." : "Record Result"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
