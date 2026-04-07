"use client"

/**
 * QA and Questions Summary
 *
 * Displays test execution results (pass/fail/blocked) with colored bars,
 * defect summary by severity, and questions by status (D-14).
 *
 * Semantic colors: pass=green, fail=red, blocked=amber.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface QaSummaryProps {
  passCount: number
  failCount: number
  blockedCount: number
  defectsBySeverity: Record<string, number>
  openDefectCount: number
  questionsByStatus: Record<string, number>
}

const QUESTION_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  SCOPED: "Scoped",
  OWNED: "Owned",
  ANSWERED: "Answered",
  REVIEWED: "Reviewed",
  PARKED: "Parked",
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-[#EF4444] text-white",
  HIGH: "bg-[#F97316] text-white",
  MEDIUM: "bg-[#F59E0B] text-white",
  LOW: "bg-[#6B7280] text-white",
}

export function QaSummary({
  passCount,
  failCount,
  blockedCount,
  defectsBySeverity,
  openDefectCount,
  questionsByStatus,
}: QaSummaryProps) {
  const totalTests = passCount + failCount + blockedCount
  const hasQaData = totalTests > 0 || openDefectCount > 0
  const hasQuestionData = Object.values(questionsByStatus).some((v) => v > 0)

  if (!hasQaData && !hasQuestionData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[18px] font-semibold">
            QA and Questions Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-[14px] text-muted-foreground">
            No QA data yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[18px] font-semibold">
          QA and Questions Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Results */}
        {totalTests > 0 && (
          <div className="space-y-2">
            <p className="text-[14px] font-medium text-foreground">
              Test Results
            </p>
            <TestBar label="Pass" count={passCount} total={totalTests} color="bg-[#22C55E]" />
            <TestBar label="Fail" count={failCount} total={totalTests} color="bg-[#EF4444]" />
            <TestBar label="Blocked" count={blockedCount} total={totalTests} color="bg-[#F59E0B]" />
          </div>
        )}

        {/* Defect Summary */}
        {openDefectCount > 0 && (
          <div className="space-y-2">
            <p className="text-[14px] font-medium text-foreground">
              Open Defects: {openDefectCount}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(defectsBySeverity).map(([severity, count]) => (
                <Badge
                  key={severity}
                  className={SEVERITY_COLORS[severity] ?? "bg-muted"}
                >
                  {severity}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Questions by Status (D-14) */}
        {hasQuestionData && (
          <div className="space-y-2">
            <p className="text-[14px] font-medium text-foreground">
              Questions by Status
            </p>
            <div className="space-y-1">
              {Object.entries(questionsByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-muted-foreground">
                    {QUESTION_STATUS_LABELS[status] ?? status}
                  </span>
                  <Badge variant="secondary" className="text-[12px]">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TestBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percent = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-[13px] text-muted-foreground">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-muted h-2.5">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-8 text-right text-[13px] font-medium text-foreground">
        {count}
      </span>
    </div>
  )
}
