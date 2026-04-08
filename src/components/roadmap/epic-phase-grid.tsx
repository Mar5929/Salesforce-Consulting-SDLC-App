"use client"

/**
 * Epic Phase Grid (Phase 12)
 *
 * Matrix view: rows = epics, columns = 5 phase types (Discovery, Design, Build, Test, Deploy).
 * Each cell shows a status chip that cycles on click with optimistic updates.
 */

import { useState, useEffect, useCallback } from "react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"
import { updateEpicPhaseStatus } from "@/actions/epic-phases"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface EpicPhase {
  id: string
  epicId: string
  phase: string
  status: string
  sortOrder: number
}

interface EpicData {
  id: string
  name: string
  prefix: string
  sortOrder: number
  phases: EpicPhase[]
  _count: { stories: number }
}

interface EpicPhaseGridProps {
  projectId: string
  epics: EpicData[]
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const PHASE_COLUMNS = [
  "DISCOVERY",
  "DESIGN",
  "BUILD",
  "TEST",
  "DEPLOY",
] as const

const PHASE_LABELS: Record<string, string> = {
  DISCOVERY: "Discovery",
  DESIGN: "Design",
  BUILD: "Build",
  TEST: "Test",
  DEPLOY: "Deploy",
}

const STATUS_CYCLE = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETE",
  "SKIPPED",
] as const

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  COMPLETE: {
    label: "Complete",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  SKIPPED: {
    label: "Skipped",
    className:
      "bg-gray-100 text-gray-400 line-through dark:bg-gray-800/60 dark:text-gray-500",
  },
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function getNextStatus(current: string): string {
  const idx = STATUS_CYCLE.indexOf(
    current as (typeof STATUS_CYCLE)[number]
  )
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

function getPhaseStatus(epic: EpicData, phase: string): string {
  const found = epic.phases.find((p) => p.phase === phase)
  return found?.status ?? "NOT_STARTED"
}

function getColumnAggregate(
  epics: EpicData[],
  phase: string
): { complete: number; total: number } {
  const total = epics.length
  const complete = epics.filter(
    (e) => getPhaseStatus(e, phase) === "COMPLETE"
  ).length
  return { complete, total }
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function EpicPhaseGrid({ projectId, epics }: EpicPhaseGridProps) {
  const [localEpics, setLocalEpics] = useState<EpicData[]>(epics)

  useEffect(() => {
    setLocalEpics(epics)
  }, [epics])

  const { execute } = useAction(updateEpicPhaseStatus, {
    onError({ error }) {
      // Revert optimistic update on failure
      setLocalEpics(epics)
      toast.error(
        error?.serverError ?? "Failed to update phase status"
      )
    },
  })

  const handleCellClick = useCallback(
    (epicId: string, phase: string, currentStatus: string) => {
      const nextStatus = getNextStatus(currentStatus)

      // Optimistic update
      setLocalEpics((prev) =>
        prev.map((epic) =>
          epic.id === epicId
            ? {
                ...epic,
                phases: epic.phases.map((p) =>
                  p.phase === phase ? { ...p, status: nextStatus } : p
                ),
              }
            : epic
        )
      )

      execute({ projectId, epicId, phase: phase as "DISCOVERY" | "DESIGN" | "BUILD" | "TEST" | "DEPLOY", status: nextStatus as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE" | "SKIPPED" })
    },
    [execute, projectId]
  )

  if (epics.length === 0) {
    return (
      <EmptyState
        heading="No epics yet"
        description="Create epics in the Work view to see the phase grid."
      />
    )
  }

  const sortedEpics = [...localEpics].sort(
    (a, b) => a.sortOrder - b.sortOrder
  )

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 min-w-[180px] bg-background">
              Epic
            </TableHead>
            {PHASE_COLUMNS.map((phase) => {
              const { complete, total } = getColumnAggregate(
                localEpics,
                phase
              )
              return (
                <TableHead
                  key={phase}
                  className="min-w-[130px] text-center"
                >
                  {PHASE_LABELS[phase]}{" "}
                  <span className="text-muted-foreground">
                    ({complete}/{total})
                  </span>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEpics.map((epic) => (
            <TableRow key={epic.id}>
              <TableCell className="sticky left-0 z-10 bg-background">
                <div className="font-semibold">{epic.name}</div>
                <div className="text-xs text-muted-foreground">
                  {epic._count.stories}{" "}
                  {epic._count.stories === 1 ? "story" : "stories"}
                </div>
              </TableCell>
              {PHASE_COLUMNS.map((phase) => {
                const status = getPhaseStatus(epic, phase)
                const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOT_STARTED
                return (
                  <TableCell
                    key={phase}
                    className="cursor-pointer text-center transition-colors hover:bg-muted/50"
                    onClick={() =>
                      handleCellClick(epic.id, phase, status)
                    }
                  >
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                        config.className
                      )}
                    >
                      {config.label}
                    </span>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
