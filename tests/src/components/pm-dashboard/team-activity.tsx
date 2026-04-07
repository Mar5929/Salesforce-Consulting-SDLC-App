"use client"

/**
 * Team Activity List
 *
 * Compact list showing recent team actions.
 * Member name (14px/400), action description (14px/400),
 * timestamp (13px/400 metadata right-aligned).
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface TeamActivityProps {
  activities: Array<{
    memberName: string
    action: string
    timestamp: string
  }>
}

export function TeamActivity({ activities }: TeamActivityProps) {
  const displayActivities = activities.slice(0, 10)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[18px] font-semibold">
          Team Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted-foreground">
            No recent activity
          </p>
        ) : (
          <div className="divide-y divide-border">
            {displayActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[14px] font-normal text-foreground">
                    {activity.memberName}
                  </span>
                  <span className="mx-1.5 text-muted-foreground">-</span>
                  <span className="text-[14px] font-normal text-muted-foreground">
                    {activity.action}
                  </span>
                </div>
                <span className="shrink-0 text-[13px] font-normal text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
