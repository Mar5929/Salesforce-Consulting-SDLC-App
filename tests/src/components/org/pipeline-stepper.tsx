"use client"

/**
 * Pipeline Stepper
 *
 * Horizontal stepper showing 4-phase brownfield ingestion progress.
 * Phases: Parse -> Classify -> Synthesize -> Complete
 * States: completed (accent fill + checkmark), active (accent outline + pulse),
 *         failed (destructive fill + X), upcoming (muted border).
 */

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

const PHASES = ["Parse", "Classify", "Synthesize", "Complete"] as const

interface PipelineStepperProps {
  /** Current phase index (0-4). 0 = not started, 4 = all complete */
  currentPhase: 0 | 1 | 2 | 3 | 4
  /** Pipeline status */
  status: "idle" | "running" | "completed" | "failed"
  /** Which phase failed (1-indexed) */
  failedPhase?: number
}

export function PipelineStepper({
  currentPhase,
  status,
  failedPhase,
}: PipelineStepperProps) {
  return (
    <div className="flex items-center justify-center gap-0 py-4">
      {PHASES.map((label, index) => {
        const phaseNumber = index + 1
        const isCompleted =
          status === "completed"
            ? true
            : phaseNumber < currentPhase
        const isActive =
          status === "running" && phaseNumber === currentPhase
        const isFailed =
          status === "failed" && failedPhase === phaseNumber
        const isUpcoming = !isCompleted && !isActive && !isFailed

        return (
          <div key={label} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                  isCompleted &&
                    "border-transparent bg-[#2563EB] text-white",
                  isActive &&
                    "animate-pulse border-[#2563EB] bg-transparent text-[#2563EB]",
                  isFailed &&
                    "border-transparent bg-[#EF4444] text-white",
                  isUpcoming &&
                    "border-border bg-transparent text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4" />
                ) : isFailed ? (
                  <X className="size-4" />
                ) : (
                  phaseNumber
                )}
              </div>
              <span
                className={cn(
                  "text-[13px] font-medium",
                  isCompleted && "text-foreground",
                  isActive && "text-[#2563EB]",
                  isFailed && "text-[#EF4444]",
                  isUpcoming && "text-muted-foreground"
                )}
              >
                {label}
              </span>
              {isActive && (
                <span className="text-[13px] font-normal text-muted-foreground">
                  In progress...
                </span>
              )}
            </div>

            {/* Connecting line (not after last step) */}
            {index < PHASES.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-12 sm:w-16",
                  phaseNumber < currentPhase || status === "completed"
                    ? "bg-[#2563EB]"
                    : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
