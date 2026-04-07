/**
 * Outstanding Questions Component (D-24, DASH-01)
 *
 * Displays question counts by status as clickable stat cards.
 * Each card navigates to the question list pre-filtered by status.
 */

"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CircleHelp, CheckCircle, PauseCircle } from "lucide-react"

interface OutstandingQuestionsProps {
  stats: {
    total: number
    open: number
    answered: number
    parked: number
  }
}

const STATUS_CONFIG = [
  {
    key: "open" as const,
    label: "Open",
    filterValue: "OPEN",
    icon: CircleHelp,
    color: "text-[#2563EB]",
    bgColor: "bg-[#EFF6FF]",
    borderColor: "border-[#BFDBFE]",
  },
  {
    key: "answered" as const,
    label: "Answered",
    filterValue: "ANSWERED",
    icon: CheckCircle,
    color: "text-[#16A34A]",
    bgColor: "bg-[#F0FDF4]",
    borderColor: "border-[#BBF7D0]",
  },
  {
    key: "parked" as const,
    label: "Parked",
    filterValue: "PARKED",
    icon: PauseCircle,
    color: "text-[#9333EA]",
    bgColor: "bg-[#FAF5FF]",
    borderColor: "border-[#E9D5FF]",
  },
] as const

export function OutstandingQuestions({ stats }: OutstandingQuestionsProps) {
  const params = useParams()
  const projectId = params.projectId as string

  return (
    <div className="grid grid-cols-3 gap-3">
      {STATUS_CONFIG.map((config) => {
        const count = stats[config.key]
        const Icon = config.icon

        return (
          <Link
            key={config.key}
            href={`/projects/${projectId}/questions?status=${config.filterValue}`}
          >
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex size-9 items-center justify-center rounded-lg border ${config.bgColor} ${config.borderColor}`}
                >
                  <Icon className={`size-4 ${config.color}`} />
                </div>
                <div>
                  <p className="text-[24px] font-semibold leading-none text-foreground">
                    {count}
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {config.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
