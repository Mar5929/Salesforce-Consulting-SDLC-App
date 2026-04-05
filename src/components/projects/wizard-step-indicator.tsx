"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface WizardStepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function WizardStepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
}: WizardStepIndicatorProps) {
  return (
    <div className="flex items-start justify-center gap-0">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep
        const isUpcoming = stepNumber > currentStep

        return (
          <div key={stepNumber} className="flex items-start">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  isActive &&
                    "bg-[#2563EB] text-white",
                  isCompleted &&
                    "border-2 border-[#2563EB] text-[#2563EB]",
                  isUpcoming &&
                    "border-2 border-[#E5E5E5] text-[#737373]"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-[13px] font-semibold",
                  isActive && "text-[#171717]",
                  isCompleted && "text-[#2563EB]",
                  isUpcoming && "text-[#737373]"
                )}
              >
                {stepLabels[i]}
              </span>
            </div>

            {/* Connector line */}
            {stepNumber < totalSteps && (
              <div
                className={cn(
                  "mt-4 h-[2px] w-16 self-start",
                  stepNumber < currentStep
                    ? "bg-[#2563EB]"
                    : "bg-[#E5E5E5]"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
