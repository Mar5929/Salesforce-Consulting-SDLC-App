"use client"

import { Check, Pencil, Trash2 } from "lucide-react"
import { ToolResultCard } from "./tool-result-card"

interface MutationConfirmCardProps {
  action: "created" | "updated" | "deleted"
  entityType: string
  entityName: string
  changedFields?: Record<string, string>
}

export function MutationConfirmCard({
  action,
  entityType,
  entityName,
  changedFields,
}: MutationConfirmCardProps) {
  const Icon =
    action === "created" ? Check : action === "deleted" ? Trash2 : Pencil

  const iconClass =
    action === "created"
      ? "text-chart-2"
      : action === "deleted"
        ? "text-destructive"
        : "text-muted-foreground"

  return (
    <ToolResultCard aria-label={`${entityType} ${action}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <p className="text-[13px] font-semibold capitalize">
          {action} {entityType}
        </p>
      </div>
      <p className="text-[14px] font-medium">{entityName}</p>
      {changedFields && Object.keys(changedFields).length > 0 && (
        <div className="mt-2 space-y-1">
          {Object.entries(changedFields)
            .slice(0, 3)
            .map(([field, value]) => (
              <div key={field} className="flex gap-2">
                <span className="text-[13px] text-muted-foreground capitalize">{field}:</span>
                <span className="text-[13px]">{value}</span>
              </div>
            ))}
        </div>
      )}
    </ToolResultCard>
  )
}
