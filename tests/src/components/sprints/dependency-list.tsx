"use client"

/**
 * Dependency List Component
 *
 * Displays AI-suggested execution ordering for stories in a sprint.
 * Shows numbered steps with reasoning from the sprint intelligence analysis.
 *
 * Per D-18: Ordered dependency suggestions with AI reasoning.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DependencySuggestion {
  order: number
  storyDisplayId: string
  storyTitle: string
  reasoning: string
}

interface DependencyListProps {
  dependencies: DependencySuggestion[]
}

export function DependencyList({ dependencies }: DependencyListProps) {
  if (dependencies.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Suggested Execution Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {dependencies
            .sort((a, b) => a.order - b.order)
            .map((dep) => (
              <li
                key={dep.storyDisplayId}
                className="flex items-start gap-3 text-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {dep.order}
                </span>
                <div>
                  <div className="font-medium">
                    {dep.storyDisplayId}: {dep.storyTitle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dep.reasoning}
                  </div>
                </div>
              </li>
            ))}
        </ol>
      </CardContent>
    </Card>
  )
}
