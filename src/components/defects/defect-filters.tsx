"use client"

/**
 * Defect Filters (D-07)
 *
 * Filter bar with 4 selects: Status, Severity, Assignee, Story.
 * Uses nuqs useQueryState for URL-persisted filter values.
 */

import { useQueryState, parseAsString } from "nuqs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DEFECT_STATUS_LABELS } from "@/lib/defect-status-machine"
import { formatEnumLabel } from "@/lib/format-enum"
import type { DefectStatus } from "@/generated/prisma"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface DefectFiltersProps {
  projectId: string
  members: Array<{ id: string; displayName: string }>
  stories: Array<{ id: string; displayId: string; title: string }>
}

const SEVERITY_OPTIONS = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
]

const ALL_STATUSES: DefectStatus[] = [
  "OPEN",
  "ASSIGNED",
  "FIXED",
  "VERIFIED",
  "CLOSED",
]

// ────────────────────────────────────────────
// Hook for external consumers
// ────────────────────────────────────────────

export function useDefectFilters() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("")
  )
  const [severity, setSeverity] = useQueryState(
    "severity",
    parseAsString.withDefault("")
  )
  const [assigneeId, setAssigneeId] = useQueryState(
    "assignee",
    parseAsString.withDefault("")
  )
  const [storyId, setStoryId] = useQueryState(
    "story",
    parseAsString.withDefault("")
  )

  return {
    status: status || undefined,
    severity: severity || undefined,
    assigneeId: assigneeId || undefined,
    storyId: storyId || undefined,
    setStatus,
    setSeverity,
    setAssigneeId,
    setStoryId,
  }
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function DefectFilters({
  members,
  stories,
}: DefectFiltersProps) {
  const { status, severity, assigneeId, storyId, setStatus, setSeverity, setAssigneeId, setStoryId } =
    useDefectFilters()

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Status filter */}
      <Select
        value={status ?? "all"}
        onValueChange={(v: string | null) => setStatus(v === "all" ? "" : v ?? "")}
      >
        <SelectTrigger className="h-8 w-[150px] text-[13px]">
          <SelectValue placeholder="Status">
            {(value: string) => value === "all" ? "All Statuses" : (DEFECT_STATUS_LABELS[value as DefectStatus] ?? formatEnumLabel(value))}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {ALL_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {DEFECT_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Severity filter */}
      <Select
        value={severity ?? "all"}
        onValueChange={(v: string | null) => setSeverity(v === "all" ? "" : v ?? "")}
      >
        <SelectTrigger className="h-8 w-[140px] text-[13px]">
          <SelectValue placeholder="Severity">
            {(value: string) => {
              if (value === "all") return "All Severities"
              const match = SEVERITY_OPTIONS.find((s) => s.value === value)
              return match?.label ?? formatEnumLabel(value)
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severities</SelectItem>
          {SEVERITY_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assignee filter */}
      <Select
        value={assigneeId ?? "all"}
        onValueChange={(v: string | null) => setAssigneeId(v === "all" ? "" : v ?? "")}
      >
        <SelectTrigger className="h-8 w-[150px] text-[13px]">
          <SelectValue placeholder="Assignee">
            {(value: string) => {
              if (value === "all") return "All Assignees"
              const m = members.find((mb) => mb.id === value)
              return m ? m.displayName : value
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Story filter */}
      <Select
        value={storyId ?? "all"}
        onValueChange={(v: string | null) => setStoryId(v === "all" ? "" : v ?? "")}
      >
        <SelectTrigger className="h-8 w-[180px] text-[13px]">
          <SelectValue placeholder="Story">
            {(value: string) => {
              if (value === "all") return "All Stories"
              const s = stories.find((st) => st.id === value)
              return s ? `${s.displayId} - ${s.title.length > 30 ? s.title.slice(0, 30) + "..." : s.title}` : value
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stories</SelectItem>
          {stories.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.displayId} - {s.title.length > 30 ? s.title.slice(0, 30) + "..." : s.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
