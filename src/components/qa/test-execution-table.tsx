"use client"

/**
 * Test Execution Table (D-06)
 *
 * Displays test cases with latest execution results for a story.
 * Color-coded result badges: Pass (green), Fail (red), Blocked (amber), Not Run (outline).
 * Failed tests show inline "Create Defect" link.
 * "Record Result" button opens inline RecordResultForm.
 */

import { useState, useEffect, useCallback } from "react"
import { useAction } from "next-safe-action/hooks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Bug, Plus, ClipboardList } from "lucide-react"
import { getStoryTestCases } from "@/actions/test-executions"
import { RecordResultForm } from "@/components/qa/record-result-form"
import { TestCaseCreateForm } from "@/components/qa/test-case-create-form"
import { format } from "date-fns"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface TestCaseWithExecution {
  id: string
  title: string
  steps: string | null
  expectedResult: string
  testType: string
  testExecutions: Array<{
    id: string
    result: string
    notes: string | null
    executedAt: string
    executedBy: { id: string; displayName: string } | null
  }>
}

interface TestExecutionTableProps {
  storyId: string
  projectId: string
  memberRole: string
  onCreateDefectFromTest?: (testCase: { id: string; title: string }) => void
}

// ────────────────────────────────────────────
// Result badge component
// ────────────────────────────────────────────

function ResultBadge({ result }: { result: string | null }) {
  if (!result) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not Run
      </Badge>
    )
  }

  const styles: Record<string, string> = {
    PASS: "bg-green-500 text-white border-green-500",
    FAIL: "bg-red-500 text-white border-red-500",
    BLOCKED: "bg-amber-500 text-white border-amber-500",
  }

  const labels: Record<string, string> = {
    PASS: "Pass",
    FAIL: "Fail",
    BLOCKED: "Blocked",
  }

  return (
    <Badge className={styles[result] ?? ""}>
      {labels[result] ?? result}
    </Badge>
  )
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function TestExecutionTable({
  storyId,
  projectId,
  memberRole,
  onCreateDefectFromTest,
}: TestExecutionTableProps) {
  const [testCases, setTestCases] = useState<TestCaseWithExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { execute: fetchTestCases } = useAction(getStoryTestCases, {
    onSuccess: ({ data }) => {
      if (data?.testCases) {
        setTestCases(data.testCases as unknown as TestCaseWithExecution[])
      }
      setLoading(false)
    },
    onError: () => {
      setLoading(false)
    },
  })

  const loadTestCases = useCallback(() => {
    setLoading(true)
    fetchTestCases({ storyId })
  }, [fetchTestCases, storyId])

  useEffect(() => {
    loadTestCases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId])

  function handleRecordComplete() {
    setShowRecordForm(false)
    loadTestCases()
  }

  function handleCreateComplete() {
    setShowCreateForm(false)
    loadTestCases()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[14px] text-muted-foreground">
        Loading test cases...
      </div>
    )
  }

  // Empty state
  if (testCases.length === 0 && !showRecordForm && !showCreateForm) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <h3 className="text-[16px] font-medium text-foreground">
          No test cases
        </h3>
        <p className="text-[14px] text-muted-foreground text-center max-w-md">
          Create test cases to define what needs testing, then record execution
          results to track quality.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] gap-1.5"
          >
            <ClipboardList className="h-4 w-4" />
            Create Test Case
          </Button>
          <Button
            onClick={() => setShowRecordForm(true)}
            variant="outline"
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Record Result
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-medium text-foreground">
          Test Execution
        </h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="outline"
            className="gap-1.5"
            size="sm"
          >
            <ClipboardList className="h-4 w-4" />
            Create Test Case
          </Button>
          <Button
            onClick={() => setShowRecordForm(true)}
            className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] gap-1.5"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Record Result
          </Button>
        </div>
      </div>

      {/* Create test case form */}
      {showCreateForm && (
        <TestCaseCreateForm
          storyId={storyId}
          onComplete={handleCreateComplete}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Record result form */}
      {showRecordForm && (
        <RecordResultForm
          storyId={storyId}
          projectId={projectId}
          onComplete={handleRecordComplete}
          onCancel={() => setShowRecordForm(false)}
        />
      )}

      {/* Test cases table */}
      {testCases.length > 0 && (
        <div className="rounded-lg border border-[#E5E5E5]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Case</TableHead>
                <TableHead className="w-[100px]">Result</TableHead>
                <TableHead className="w-[120px]">Tester</TableHead>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {testCases.map((tc) => {
                const latestExecution = tc.testExecutions[0] ?? null
                const result = latestExecution?.result ?? null
                const isFailed = result === "FAIL"

                return (
                  <TableRow key={tc.id}>
                    <TableCell className="text-[14px] font-medium">
                      {tc.title}
                    </TableCell>
                    <TableCell>
                      <ResultBadge result={result} />
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {latestExecution?.executedBy?.displayName ?? "--"}
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {latestExecution?.executedAt
                        ? format(
                            new Date(latestExecution.executedAt),
                            "MMM d"
                          )
                        : "--"}
                    </TableCell>
                    <TableCell className="text-[14px] text-muted-foreground">
                      {latestExecution?.notes ?? "--"}
                    </TableCell>
                    <TableCell>
                      {isFailed && onCreateDefectFromTest && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() =>
                            onCreateDefectFromTest({
                              id: tc.id,
                              title: tc.title,
                            })
                          }
                        >
                          <Bug className="h-3.5 w-3.5" />
                          Create Defect
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
