"use client"

import { ToolResultCard } from "./tool-result-card"
import { Badge } from "@/components/ui/badge"

interface EntityDetailCardProps {
  entityType: string
  entity: Record<string, unknown>
  displayFields?: string[]
}

export function EntityDetailCard({ entityType, entity, displayFields }: EntityDetailCardProps) {
  const fields =
    displayFields ??
    Object.keys(entity)
      .filter(k => !["id", "projectId", "createdAt", "updatedAt"].includes(k))
      .slice(0, 6)

  const title = (entity.title ?? entity.name ?? entity.id) as string
  const status = entity.status as string | undefined

  return (
    <ToolResultCard aria-label={`${entityType} detail`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold">{entityType}</p>
        {status && (
          <Badge variant="outline" className="text-[11px]">
            {status}
          </Badge>
        )}
      </div>
      <p className="text-[14px] font-semibold text-primary mb-3">{title}</p>
      <div className="space-y-1">
        {fields
          .filter(f => f !== "title" && f !== "name" && f !== "status")
          .map(field => {
            const value = entity[field]
            if (value === null || value === undefined || value === "") return null
            return (
              <div key={field} className="flex gap-2">
                <span className="text-[13px] text-muted-foreground capitalize min-w-[100px]">
                  {field.replace(/([A-Z])/g, " $1").trim()}:
                </span>
                <span className="text-[14px] text-foreground">{String(value)}</span>
              </div>
            )
          })}
      </div>
    </ToolResultCard>
  )
}
