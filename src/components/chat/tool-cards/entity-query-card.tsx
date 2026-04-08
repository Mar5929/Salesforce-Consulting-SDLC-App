"use client"

import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ToolResultCard } from "./tool-result-card"

export interface EntityRow {
  id: string
  displayId?: string
  title?: string
  name?: string
  status?: string
}

interface EntityQueryCardProps {
  entityType: string
  entityTypePlural: string
  entities: EntityRow[]
  totalCount?: number
  toolName: string
}

export function EntityQueryCard({
  entityType,
  entityTypePlural,
  entities,
  totalCount,
  toolName: _toolName,
}: EntityQueryCardProps) {
  const displayed = entities.slice(0, 10)
  const total = totalCount ?? entities.length
  const remaining = total - displayed.length

  return (
    <ToolResultCard aria-label={`${entityType} query result`}>
      <p className="text-[13px] font-semibold mb-3">
        {total} {entities.length === 1 ? entityType : entityTypePlural}
      </p>
      <div className="space-y-0">
        {displayed.map((entity, i) => (
          <div key={entity.id}>
            {i > 0 && <Separator className="my-2" />}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {entity.displayId && (
                  <span className="text-[13px] text-muted-foreground shrink-0">{entity.displayId}</span>
                )}
                <span className="text-[14px] font-medium text-primary hover:underline cursor-pointer truncate">
                  {entity.title ?? entity.name ?? entity.id}
                </span>
              </div>
              {entity.status && (
                <Badge variant="outline" className="text-[11px] shrink-0">{entity.status}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-[13px] text-muted-foreground mt-3">
          and {remaining} more... Ask me to narrow the search or show more.
        </p>
      )}
      {entities.length === 0 && (
        <p className="text-[13px] text-muted-foreground">
          No {entityTypePlural.toLowerCase()} found matching your criteria.
        </p>
      )}
    </ToolResultCard>
  )
}
