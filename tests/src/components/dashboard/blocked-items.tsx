/**
 * Blocked Items Component (DASH-02)
 *
 * Lists questions that block stories, epics, or features.
 * Shows dependency chain indicators with indented sub-items.
 */

"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BlockedEntity {
  entityType: "STORY" | "EPIC" | "FEATURE"
  entityId: string
  entityDisplayId: string
  entityTitle: string
}

interface BlockedItemData {
  questionId: string
  questionDisplayId: string
  questionText: string
  questionStatus: string
  blockedEntities: BlockedEntity[]
}

interface BlockedItemsProps {
  items: BlockedItemData[]
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  STORY: "Story",
  EPIC: "Epic",
  FEATURE: "Feature",
}

const ENTITY_TYPE_COLORS: Record<string, string> = {
  STORY: "bg-[#DBEAFE] text-[#1E40AF]",
  EPIC: "bg-[#FEF3C7] text-[#92400E]",
  FEATURE: "bg-[#E0E7FF] text-[#3730A3]",
}

export function BlockedItems({ items }: BlockedItemsProps) {
  const params = useParams()
  const projectId = params.projectId as string

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-[13px] text-muted-foreground">
          No blocked items found
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.questionId}
          className="rounded-lg border border-[#E5E5E5] p-3"
        >
          {/* Blocking question */}
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#F59E0B]" />
            <div className="min-w-0 flex-1">
              <Link
                href={`/projects/${projectId}/questions/${item.questionId}`}
                className="text-[13px] font-medium text-foreground hover:text-[#2563EB]"
              >
                {item.questionDisplayId}
              </Link>
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                {item.questionText}
              </p>
            </div>
          </div>

          {/* Blocked entities (indented) */}
          <div className="mt-2 ml-6 flex flex-col gap-1.5">
            {item.blockedEntities.map((entity) => (
              <div
                key={`${entity.entityType}-${entity.entityId}`}
                className="flex items-center gap-2 text-[12px]"
              >
                <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${ENTITY_TYPE_COLORS[entity.entityType] || ""}`}
                >
                  {ENTITY_TYPE_LABELS[entity.entityType] || entity.entityType}
                </Badge>
                <span className="font-medium text-foreground">
                  {entity.entityDisplayId}
                </span>
                <span className="truncate text-muted-foreground">
                  {entity.entityTitle}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
