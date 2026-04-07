/**
 * Component Table
 *
 * Displays OrgComponent records with type filtering and pagination.
 * Uses nuqs for URL-persisted filter and page state.
 */

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface OrgComponentRow {
  id: string
  apiName: string
  label: string | null
  componentType: string
  isActive: boolean
  lastSyncedAt: Date | null
  domainGroupingId: string | null
}

interface ComponentTableProps {
  components: OrgComponentRow[]
  totalCount: number
  currentPage: number
  pageSize: number
  currentType: string | null
}

const COMPONENT_TYPE_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "OBJECT", label: "Object" },
  { value: "FIELD", label: "Field" },
  { value: "APEX_CLASS", label: "Apex Class" },
  { value: "APEX_TRIGGER", label: "Apex Trigger" },
  { value: "LWC", label: "LWC" },
  { value: "FLOW", label: "Flow" },
  { value: "PERMISSION_SET", label: "Permission Set" },
  { value: "PROFILE", label: "Profile" },
  { value: "CUSTOM_METADATA_TYPE", label: "Custom Metadata" },
  { value: "OTHER", label: "Other" },
]

const TYPE_BADGE_COLORS: Record<string, string> = {
  OBJECT: "bg-blue-100 text-blue-800",
  FIELD: "bg-slate-100 text-slate-700",
  APEX_CLASS: "bg-purple-100 text-purple-800",
  APEX_TRIGGER: "bg-orange-100 text-orange-800",
  LWC: "bg-green-100 text-green-800",
  FLOW: "bg-amber-100 text-amber-800",
  PERMISSION_SET: "bg-teal-100 text-teal-800",
  PROFILE: "bg-rose-100 text-rose-800",
  CUSTOM_METADATA_TYPE: "bg-cyan-100 text-cyan-800",
  OTHER: "bg-gray-100 text-gray-600",
}

export function ComponentTable({
  components,
  totalCount,
  currentPage,
  pageSize,
  currentType,
}: ComponentTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "ALL") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    router.push(`?${params.toString()}`)
  }

  function handleTypeChange(value: string | null) {
    updateParams({ componentType: value, page: null })
  }

  function handlePageChange(newPage: number) {
    updateParams({ page: newPage > 1 ? String(newPage) : null })
  }

  return (
    <div className="space-y-4">
      {/* Type filter */}
      <div className="flex items-center gap-3">
        <Select
          value={currentType ?? "ALL"}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {COMPONENT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[13px] text-muted-foreground">
          {totalCount.toLocaleString()} component{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[13px] font-semibold">API Name</TableHead>
            <TableHead className="text-[13px] font-semibold">Label</TableHead>
            <TableHead className="text-[13px] font-semibold">Type</TableHead>
            <TableHead className="text-[13px] font-semibold">Status</TableHead>
            <TableHead className="text-[13px] font-semibold">Last Synced</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {components.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                No components found
              </TableCell>
            </TableRow>
          ) : (
            components.map((comp) => (
              <TableRow key={comp.id}>
                <TableCell className="text-[14px] font-normal">{comp.apiName}</TableCell>
                <TableCell className="text-[14px] text-secondary-foreground">{comp.label ?? "-"}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_COLORS[comp.componentType] ?? TYPE_BADGE_COLORS.OTHER}`}
                  >
                    {formatComponentType(comp.componentType)}
                  </span>
                </TableCell>
                <TableCell>
                  {comp.isActive ? (
                    <Badge variant="outline" className="text-xs text-[#22C55E] border-[#22C55E]">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Removed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-[13px] text-muted-foreground">
                  {comp.lastSyncedAt
                    ? formatDistanceToNow(new Date(comp.lastSyncedAt), { addSuffix: true })
                    : "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-[13px] text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Skeleton loading state for component table */
export function ComponentTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-[200px]" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>API Name</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Synced</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function formatComponentType(type: string): string {
  const map: Record<string, string> = {
    OBJECT: "Object",
    FIELD: "Field",
    APEX_CLASS: "Apex Class",
    APEX_TRIGGER: "Apex Trigger",
    LWC: "LWC",
    FLOW: "Flow",
    PERMISSION_SET: "Permission Set",
    PROFILE: "Profile",
    CUSTOM_METADATA_TYPE: "Custom Metadata",
    OTHER: "Other",
  }
  return map[type] ?? type
}
