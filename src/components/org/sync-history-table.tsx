/**
 * Sync History Table
 *
 * Displays recent OrgSyncRun records with status badges,
 * component counts, and error tooltips.
 */

import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SyncRun {
  id: string
  syncType: "FULL" | "INCREMENTAL"
  status: string
  componentCounts: {
    added: number
    modified: number
    removed: number
  } | null
  startedAt: Date
  completedAt: Date | null
  errorMessage: string | null
}

interface SyncHistoryTableProps {
  syncRuns: SyncRun[]
}

const STATUS_STYLES: Record<string, { className: string; label: string }> = {
  COMPLETED: {
    className: "bg-[#22C55E] text-white",
    label: "Completed",
  },
  FAILED: {
    className: "bg-[#EF4444] text-white",
    label: "Failed",
  },
  RUNNING: {
    className: "border border-border text-primary bg-transparent",
    label: "Running",
  },
  PENDING: {
    className: "bg-muted text-muted-foreground",
    label: "Pending",
  },
}

export function SyncHistoryTable({ syncRuns }: SyncHistoryTableProps) {
  if (syncRuns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sync history will appear here after the first metadata sync completes.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-[13px] font-semibold">Date</TableHead>
          <TableHead className="text-[13px] font-semibold">Type</TableHead>
          <TableHead className="text-[13px] font-semibold">Status</TableHead>
          <TableHead className="text-[13px] font-semibold text-right">Added</TableHead>
          <TableHead className="text-[13px] font-semibold text-right">Modified</TableHead>
          <TableHead className="text-[13px] font-semibold text-right">Removed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {syncRuns.map((run) => {
          const statusConfig = STATUS_STYLES[run.status] ?? STATUS_STYLES.PENDING
          const counts = run.componentCounts

          return (
            <TableRow key={run.id}>
              <TableCell className="text-[13px] text-muted-foreground">
                {format(new Date(run.startedAt), "yyyy-MM-dd HH:mm")}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {run.syncType === "FULL" ? "Full" : "Incremental"}
                </Badge>
              </TableCell>
              <TableCell>
                {run.status === "FAILED" && run.errorMessage ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">{run.errorMessage}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
                  >
                    {run.status === "RUNNING" && (
                      <span className="mr-1.5 inline-block size-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                    {statusConfig.label}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right text-[13px] text-muted-foreground">
                {counts?.added ?? "-"}
              </TableCell>
              <TableCell className="text-right text-[13px] text-muted-foreground">
                {counts?.modified ?? "-"}
              </TableCell>
              <TableCell className="text-right text-[13px] text-muted-foreground">
                {counts?.removed ?? "-"}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
