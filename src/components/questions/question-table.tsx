"use client"

/**
 * Question Table View (D-02, D-06)
 *
 * Default view for the questions list page.
 * Uses shadcn Table with column sorting.
 * Filter dropdowns use nuqs for URL-persisted state.
 * Status badges follow UI-SPEC Question Status Badge Colors.
 */

import { useRouter } from "next/navigation"
import { useQueryState, parseAsString } from "nuqs"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface QuestionRow {
  id: string
  displayId: string
  questionText: string
  scope: string
  priority: string
  status: string
  needsReview: boolean
  createdAt: string | Date
  owner?: { id: string; displayName: string; email: string } | null
  scopeEpic?: { id: string; name: string; prefix: string } | null
  scopeFeature?: { id: string; name: string; prefix: string } | null
}

interface QuestionTableProps {
  questions: QuestionRow[]
  projectId: string
  onFilterChange?: (filters: Record<string, string | undefined>) => void
}

// ────────────────────────────────────────────
// Status badge colors (UI-SPEC)
// ────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  SCOPED: "bg-[#F5F3FF] text-[#8B5CF6] border-[#DDD6FE]",
  OWNED: "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]",
  ANSWERED: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  REVIEWED: "bg-[#ECFEFF] text-[#06B6D4] border-[#A5F3FC]",
  PARKED: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-[#F5F5F5] text-[#737373]",
  MEDIUM: "bg-[#FFF7ED] text-[#EA580C]",
  HIGH: "bg-[#FEF2F2] text-[#DC2626]",
  CRITICAL: "bg-[#FEF2F2] text-[#DC2626] font-semibold",
}

const SCOPE_LABELS: Record<string, string> = {
  ENGAGEMENT: "Engagement",
  EPIC: "Epic",
  FEATURE: "Feature",
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function QuestionTable({ questions, projectId, onFilterChange }: QuestionTableProps) {
  const router = useRouter()

  // URL-persisted filter state via nuqs
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsString)
  const [scopeFilter, setScopeFilter] = useQueryState("scope", parseAsString)
  const [priorityFilter, setPriorityFilter] = useQueryState("priority", parseAsString)
  const [reviewFilter, setReviewFilter] = useQueryState("review", parseAsString)

  function handleRowClick(questionId: string) {
    router.push(`/projects/${projectId}/questions/${questionId}`)
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="SCOPED">Scoped</SelectItem>
            <SelectItem value="OWNED">Owned</SelectItem>
            <SelectItem value="ANSWERED">Answered</SelectItem>
            <SelectItem value="REVIEWED">Reviewed</SelectItem>
            <SelectItem value="PARKED">Parked</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={scopeFilter ?? "all"}
          onValueChange={(v) => setScopeFilter(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
            <SelectItem value="EPIC">Epic</SelectItem>
            <SelectItem value="FEATURE">Feature</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter ?? "all"}
          onValueChange={(v) => setPriorityFilter(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={reviewFilter ?? "all"}
          onValueChange={(v) => setReviewFilter(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Review" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Questions</SelectItem>
            <SelectItem value="needs_review">Needs Review</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#E5E5E5]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Question</TableHead>
              <TableHead className="w-[100px]">Scope</TableHead>
              <TableHead className="w-[140px]">Owner</TableHead>
              <TableHead className="w-[90px]">Priority</TableHead>
              <TableHead className="w-[100px]">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-[14px] text-[#737373]">
                  No questions yet. Ask your first question to start capturing discovery insights.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((q) => (
                <TableRow
                  key={q.id}
                  className="cursor-pointer hover:bg-[#FAFAFA]"
                  onClick={() => handleRowClick(q.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn("text-[12px]", STATUS_STYLES[q.status])}
                      >
                        {q.status}
                      </Badge>
                      {q.needsReview && (
                        <Badge variant="outline" className="bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA] text-[11px]">
                          Review
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-[#737373]">
                    {q.displayId}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-[14px]">
                    {q.questionText}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#737373]">
                    {SCOPE_LABELS[q.scope] ?? q.scope}
                  </TableCell>
                  <TableCell>
                    {q.owner ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(q.owner.displayName || q.owner.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[13px]">
                          {q.owner.displayName || q.owner.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[13px] text-[#737373]">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[12px]", PRIORITY_STYLES[q.priority])}
                    >
                      {q.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-[#737373]">
                    {format(new Date(q.createdAt), "MMM d")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
