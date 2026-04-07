"use client"

/**
 * Work Progress Chart
 *
 * Two horizontal bar charts side by side:
 * 1. Stories by Status (Draft, Ready, Sprint Planned, In Progress, In Review, QA, Done)
 * 2. Stories by Assignee (D-14)
 *
 * Uses shadcn Charts (Recharts BarChart) with chart CSS variables.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WorkProgressChartProps {
  storiesByStatus: Record<string, number>
  storiesByAssignee: Array<{ assigneeName: string; count: number }>
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  SPRINT_PLANNED: "Sprint Planned",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  QA: "QA",
  DONE: "Done",
}

const STATUS_ORDER = [
  "DRAFT",
  "READY",
  "SPRINT_PLANNED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "QA",
  "DONE",
]

const statusChartConfig: ChartConfig = {
  count: {
    label: "Stories",
    color: "var(--chart-1)",
  },
}

const assigneeChartConfig: ChartConfig = {
  count: {
    label: "Stories",
    color: "var(--chart-2)",
  },
}

export function WorkProgressChart({
  storiesByStatus,
  storiesByAssignee,
}: WorkProgressChartProps) {
  const statusData = STATUS_ORDER.map((status) => ({
    status: STATUS_LABELS[status] ?? status,
    count: storiesByStatus[status] ?? 0,
  })).filter((d) => d.count > 0)

  const assigneeData = storiesByAssignee.map((a) => ({
    name: a.assigneeName,
    count: a.count,
  }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Stories by Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[18px] font-semibold">
            Stories by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-muted-foreground">
              No stories yet
            </p>
          ) : (
            <ChartContainer config={statusChartConfig} className="h-[250px] w-full">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="status"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Stories by Assignee (D-14) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[18px] font-semibold">
            Stories by Assignee
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assigneeData.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-muted-foreground">
              No assigned stories yet
            </p>
          ) : (
            <ChartContainer config={assigneeChartConfig} className="h-[250px] w-full">
              <BarChart data={assigneeData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
