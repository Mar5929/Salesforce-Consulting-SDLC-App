"use client"

/**
 * AI Usage Charts
 *
 * Two charts side by side:
 * 1. AI Cost Over Time -- LineChart with --chart-1 line
 * 2. Cost by Feature Area -- BarChart with different chart colors per area
 *
 * Uses shadcn Charts (Recharts) with chart CSS variables.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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

interface AiUsageChartsProps {
  costOverTime: Array<{ date: string; cost: number }>
  costByArea: Record<string, number>
  totalCost: number
}

const lineChartConfig: ChartConfig = {
  cost: {
    label: "Cost ($)",
    color: "var(--chart-1)",
  },
}

const AREA_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function AiUsageCharts({
  costOverTime,
  costByArea,
  totalCost,
}: AiUsageChartsProps) {
  const areaData = Object.entries(costByArea).map(([area, cost]) => ({
    area,
    cost,
  }))

  const barChartConfig: ChartConfig = Object.fromEntries(
    areaData.map(({ area }, i) => [
      area,
      {
        label: area,
        color: AREA_COLORS[i % AREA_COLORS.length],
      },
    ])
  )
  // Add a "cost" entry for the bar dataKey
  barChartConfig.cost = { label: "Cost ($)", color: "var(--chart-1)" }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* AI Cost Over Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[18px] font-semibold">
            AI Cost Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {costOverTime.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-muted-foreground">
              No AI usage data yet
            </p>
          ) : (
            <ChartContainer config={lineChartConfig} className="h-[250px] w-full">
              <LineChart data={costOverTime}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v)
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--color-cost)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Cost by Feature Area */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[18px] font-semibold">
            Cost by Feature Area
          </CardTitle>
        </CardHeader>
        <CardContent>
          {areaData.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-muted-foreground">
              No AI usage data yet
            </p>
          ) : (
            <ChartContainer config={barChartConfig} className="h-[250px] w-full">
              <BarChart data={areaData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="area" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                  {areaData.map((_, index) => (
                    <rect
                      key={index}
                      fill={AREA_COLORS[index % AREA_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
