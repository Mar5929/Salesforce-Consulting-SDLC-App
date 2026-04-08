"use client"

/**
 * Analysis Client
 *
 * Client wrapper for the Org Analysis page.
 * Handles tabbed review UI, bulk-confirm, trigger ingestion, and router.refresh().
 */

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Microscope, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { PipelineStepper } from "@/components/org/pipeline-stepper"
import { DomainReviewCard } from "@/components/org/domain-review-card"
import { ProcessReviewCard } from "@/components/org/process-review-card"
import {
  triggerIngestion,
  bulkConfirmHighConfidence,
} from "@/actions/org-analysis"

interface DomainGroupingData {
  id: string
  name: string
  description: string | null
  isConfirmed: boolean
  components: Array<{ apiName: string; label: string | null }>
}

interface BusinessProcessData {
  id: string
  name: string
  description: string | null
  complexity: string | null
  isConfirmed: boolean
  components: Array<{ apiName: string; role: string; isRequired: boolean }>
}

interface AnalysisClientProps {
  projectId: string
  isOrgConnected: boolean
  hasSyncedComponents: boolean
  hasRun: boolean
  pipelinePhase: 0 | 1 | 2 | 3 | 4
  pipelineStatus: "idle" | "running" | "completed" | "failed"
  domainGroupings: DomainGroupingData[]
  businessProcesses: BusinessProcessData[]
  dgTotal: number
  dgConfirmed: number
  bpTotal: number
  bpConfirmed: number
}

export function AnalysisClient({
  projectId,
  isOrgConnected,
  hasSyncedComponents,
  hasRun,
  pipelinePhase,
  pipelineStatus,
  domainGroupings,
  businessProcesses,
  dgTotal,
  dgConfirmed,
  bpTotal,
  bpConfirmed,
}: AnalysisClientProps) {
  const router = useRouter()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll for pipeline progress while status is "running" (BUG-021)
  const isRunning = pipelineStatus === "running"
  useEffect(() => {
    if (isRunning) {
      pollRef.current = setInterval(() => {
        router.refresh()
      }, 3000) // Poll every 3 seconds
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [isRunning, router])

  const { execute: executeTrigger, isExecuting: isTriggering } = useAction(
    triggerIngestion,
    {
      onSuccess: () => {
        toast.success("Org analysis started. This may take a few minutes.")
        router.refresh()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to start analysis")
      },
    }
  )

  const { execute: executeBulkConfirmDomains, isExecuting: isBulkConfirmingDomains } =
    useAction(bulkConfirmHighConfidence, {
      onSuccess: ({ data }) => {
        toast.success(`Confirmed ${data?.confirmed ?? 0} domain groupings`)
        router.refresh()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to bulk confirm")
      },
    })

  const { execute: executeBulkConfirmProcesses, isExecuting: isBulkConfirmingProcesses } =
    useAction(bulkConfirmHighConfidence, {
      onSuccess: ({ data }) => {
        toast.success(`Confirmed ${data?.confirmed ?? 0} business processes`)
        router.refresh()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to bulk confirm")
      },
    })

  function handleUpdate() {
    router.refresh()
  }

  const hasUnconfirmedDomains = domainGroupings.some((d) => !d.isConfirmed)
  const hasUnconfirmedProcesses = businessProcesses.some((p) => !p.isConfirmed)

  // Pre-ingestion empty state
  if (!hasRun) {
    return (
      <div className="mt-6 space-y-6">
        <PipelineStepper
          currentPhase={pipelinePhase}
          status={pipelineStatus}
        />

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Microscope className="size-12 text-muted-foreground" />
            <div>
              <h3 className="text-[18px] font-semibold">
                Org not analyzed yet
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Run the analysis pipeline to classify components into domain
                groupings and map them to business processes. Requires at least
                one completed metadata sync.
              </p>
            </div>
            <Button
              disabled={
                !isOrgConnected || !hasSyncedComponents || isTriggering
              }
              onClick={() => executeTrigger({ projectId })}
            >
              {isTriggering && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Analyze Org
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Post-ingestion: tabbed review interface
  return (
    <div className="mt-6 space-y-6">
      <PipelineStepper
        currentPhase={pipelinePhase}
        status={pipelineStatus}
      />

      {/* Re-analyze button */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={isTriggering}
          onClick={() => executeTrigger({ projectId })}
        >
          {isTriggering && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Re-analyze
        </Button>
      </div>

      <Tabs defaultValue="domains">
        <TabsList variant="line">
          <TabsTrigger value="domains">
            Domain Groupings
            <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">
              [{dgConfirmed}/{dgTotal}]
            </span>
          </TabsTrigger>
          <TabsTrigger value="processes">
            Business Processes
            <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">
              [{bpConfirmed}/{bpTotal}]
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Domain Groupings Tab */}
        <TabsContent value="domains" className="mt-4 space-y-4">
          {hasUnconfirmedDomains && (
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold">
                Review AI suggestions
              </h3>
              <Button
                disabled={isBulkConfirmingDomains}
                onClick={() =>
                  executeBulkConfirmDomains({
                    projectId,
                    type: "domain",
                  })
                }
              >
                {isBulkConfirmingDomains && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Confirm All High-Confidence
              </Button>
            </div>
          )}

          {domainGroupings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No domain groupings found.
            </p>
          ) : (
            <div className="space-y-4">
              {domainGroupings.map((grouping) => (
                <DomainReviewCard
                  key={grouping.id}
                  grouping={grouping}
                  projectId={projectId}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Business Processes Tab */}
        <TabsContent value="processes" className="mt-4 space-y-4">
          {hasUnconfirmedProcesses && (
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold">
                Review process mappings
              </h3>
              <Button
                disabled={isBulkConfirmingProcesses}
                onClick={() =>
                  executeBulkConfirmProcesses({
                    projectId,
                    type: "process",
                  })
                }
              >
                {isBulkConfirmingProcesses && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Confirm All High-Confidence
              </Button>
            </div>
          )}

          {businessProcesses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No business processes found.
            </p>
          ) : (
            <div className="space-y-4">
              {businessProcesses.map((process) => (
                <ProcessReviewCard
                  key={process.id}
                  process={process}
                  projectId={projectId}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
