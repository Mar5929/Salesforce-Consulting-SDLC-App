"use client"

/**
 * Sprint Velocity Chart
 *
 * Bar chart showing points completed per sprint.
 * Uses --chart-1 color. Empty state when no sprint data.
 */

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SprintVelocityChartProps {
  velocity: Array<{ sprintName: string; pointsCompleted: number }>
}

const chartConfig: ChartConfig = {
  pointsCompleted: {
    label: "Points",
    color: "var(--chart-1)",
  },
}

export function SprintVelocityChart({ velocity }: SprintVelocityChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[18px] font-semibold">
          Sprint Velocity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {velocity.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted-foreground">
            No sprint data yet
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={velocity}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="sprintName" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="pointsCompleted"
                fill="var(--color-pointsCompleted)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
