"use client"

import { ToolLoadingIndicator } from "./tool-cards/tool-loading-indicator"
import { ToolErrorCard } from "./tool-cards/tool-error-card"
import { EntityQueryCard, type EntityRow } from "./tool-cards/entity-query-card"
import { EntityDetailCard } from "./tool-cards/entity-detail-card"
import { MutationConfirmCard } from "./tool-cards/mutation-confirm-card"
import { DeleteConfirmationCard } from "./tool-cards/delete-confirmation-card"

// Maps tool name prefix to user-facing display name for loading indicators
export function getToolDisplayName(toolName: string): string {
  if (toolName === "create_stories") return "Creating multiple stories"
  if (toolName === "create_questions") return "Creating multiple questions"
  const [verb, ...entityParts] = toolName.split("_")
  const entity = entityParts.join(" ")
  switch (verb) {
    case "query": return `Searching ${entity}`
    case "get": return `Loading ${entity} details`
    case "create": return `Creating ${entity}`
    case "update": return `Updating ${entity}`
    case "delete": return `Preparing to delete ${entity}`
    default: return `Running ${toolName.replace(/_/g, " ")}`
  }
}

// Derives entity type label from tool name
function getEntityType(toolName: string): string {
  const parts = toolName.split("_")
  // query_stories -> "stories", get_story -> "story", create_epic -> "epic"
  const entity = parts.slice(1).join("_")
  return entity.charAt(0).toUpperCase() + entity.slice(1).replace(/_/g, " ")
}

function getEntityTypePlural(toolName: string): string {
  const entity = getEntityType(toolName)
  // Simple pluralization for display
  if (entity.endsWith("ies")) return entity
  if (entity.endsWith("y")) return entity.slice(0, -1) + "ies"
  if (entity.endsWith("s")) return entity + "es"
  return entity + "s"
}

export interface ToolInvocationPart {
  type: "tool-invocation"
  toolInvocationId: string
  toolName: string
  args: Record<string, unknown>
  state: string
  result?: unknown
}

interface ToolPartRendererProps {
  part: ToolInvocationPart
  addToolApprovalResponse?: (params: { id: string; approved: boolean }) => void
}

export function ToolPartRenderer({ part, addToolApprovalResponse }: ToolPartRendererProps) {
  const { toolName, state, result, toolInvocationId } = part

  // Loading state
  if (state === "partial-call" || (state === "call" && !result)) {
    return <ToolLoadingIndicator toolName={toolName} />
  }

  // Approval requested state (delete tools with needsApproval: true)
  if (state === "approval-requested") {
    const args = part.args as { reason?: string; [key: string]: unknown }
    const entityIdKey = Object.keys(args).find(k => k.endsWith("Id") && k !== "reason")
    const entityId = entityIdKey ? String(args[entityIdKey]) : toolInvocationId
    return (
      <DeleteConfirmationCard
        entityType={getEntityType(toolName)}
        entityName={entityId}
        approvalId={toolInvocationId}
        addToolApprovalResponse={addToolApprovalResponse ?? (() => {})}
      />
    )
  }

  // Result state
  if (state === "result" && result) {
    const r = result as Record<string, unknown>

    // Error result
    if (r.success === false) {
      return <ToolErrorCard error={String(r.error ?? "An error occurred")} toolName={toolName} />
    }

    // Delete confirmed result
    if (toolName.startsWith("delete_") && r.success === true) {
      const deleted = r.deleted as Record<string, unknown> | undefined
      return (
        <MutationConfirmCard
          action="deleted"
          entityType={getEntityType(toolName)}
          entityName={String(deleted?.title ?? deleted?.name ?? deleted?.id ?? "entity")}
        />
      )
    }

    // Create / batch create result
    if (
      (toolName.startsWith("create_") || toolName === "create_stories" || toolName === "create_questions") &&
      r.success === true
    ) {
      const entity = (r.story ??
        r.epic ??
        r.feature ??
        r.question ??
        r.decision ??
        r.requirement ??
        r.risk ??
        r.sprint ??
        r.defect ??
        r.testCase) as Record<string, unknown> | undefined
      const name = entity
        ? String(entity.title ?? entity.name ?? entity.displayId ?? "")
        : ""
      return (
        <MutationConfirmCard
          action="created"
          entityType={getEntityType(toolName)}
          entityName={name || `${r.created ?? 1} items`}
        />
      )
    }

    // Update result
    if (toolName.startsWith("update_") && r.success === true) {
      const entity = Object.values(r).find(v => v && typeof v === "object") as
        | Record<string, unknown>
        | undefined
      const name = entity ? String(entity.title ?? entity.name ?? "") : "entity"
      return (
        <MutationConfirmCard
          action="updated"
          entityType={getEntityType(toolName)}
          entityName={name}
        />
      )
    }

    // Query list result
    if (toolName.startsWith("query_") && r.success === true) {
      const listKey = Object.keys(r).find(k => Array.isArray(r[k]))
      const entities = listKey ? (r[listKey] as EntityRow[]) : []
      return (
        <EntityQueryCard
          entityType={getEntityType(toolName)}
          entityTypePlural={getEntityTypePlural(toolName)}
          entities={entities}
          totalCount={typeof r.count === "number" ? r.count : entities.length}
          toolName={toolName}
        />
      )
    }

    // Get detail result
    if (toolName.startsWith("get_") && r.success === true) {
      const entityKey = Object.keys(r).find(k => k !== "success" && typeof r[k] === "object")
      const entity = entityKey ? (r[entityKey] as Record<string, unknown>) : r
      return (
        <EntityDetailCard
          entityType={getEntityType(toolName)}
          entity={entity}
        />
      )
    }
  }

  // Fallback: show loading indicator
  return <ToolLoadingIndicator toolName={toolName} />
}
